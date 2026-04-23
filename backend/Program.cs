using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using FluentEmail.Core;
using FluentEmail.Smtp;
using System.Net.Mail;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

// --- DB CONFIG (AUTO-RESCUE) ---
string GetConnectionString(string? envUrl) {
    // 1. Si no hay nada en Render, usamos el "Puenting" directo a Supabase
    if (string.IsNullOrEmpty(envUrl)) {
        return "Host=aws-1-us-west-2.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.yfsszfmmoakdjatsxnje;Password=Tatub.200412;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;Timeout=300";
    }

    // 2. Si hay algo, intentamos parsearlo
    try {
        if (envUrl.Contains("Host=") || envUrl.Contains("Server=")) return envUrl;
        var uri = new Uri(envUrl);
        var userInfo = uri.UserInfo.Split(':');
        return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;Pooling=false;Timeout=300";
    } catch {
        // Fallback al Puenting si el parseo falla
        return "Host=aws-1-us-west-2.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.yfsszfmmoakdjatsxnje;Password=Tatub.200412;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;Timeout=300";
    }
}

var connectionString = GetConnectionString(builder.Configuration["DATABASE_URL"]);

builder.Services.AddDbContext<AppDbContext>(options => {
    options.UseNpgsql(connectionString, o => o.EnableRetryOnFailure(5));
});

// --- SERVICES ---
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => { options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()); });
builder.Services.AddHostedService<WeeklyReportService>();

builder.Services.AddFluentEmail("juancruzbeniteza@gmail.com", "NGA Inversiones")
    .AddRazorRenderer()
    .AddSmtpSender(new SmtpClient("smtp.gmail.com") { 
        Port = 587, 
        Credentials = new System.Net.NetworkCredential("juancruzbeniteza@gmail.com", "lftmcuuggwjwjlel"),
        EnableSsl = true 
    });

var app = builder.Build();

// --- DIAGNOSTICS & SETUP ---
using (var scope = app.Services.CreateScope()) {
    try {
        // Diagnostic: DNS check
        var host = "aws-1-us-west-2.pooler.supabase.com";
        var ips = Dns.GetHostAddresses(host);
        Console.WriteLine($"[DIAG] Resolved {host} to: {string.Join(", ", ips.Select(i => i.ToString()))}");
        
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        Console.WriteLine("[DIAG] Database connected and ready.");
    } catch (Exception ex) {
        Console.WriteLine($"[DIAG] Critical DB Error: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");

app.MapGet("/", () => Results.Ok(new { status = "NGA Online", mode = "Production Rescue" }));

app.MapPost("/api/subscribe", async (SubscriptionRequest request, AppDbContext db, IFluentEmail fluentEmail) => {
    if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        return Results.BadRequest(new { success = false, message = "Email inválido" });

    try {
        var exists = await db.Subscriptions.AnyAsync(s => s.Email == request.Email);
        if (!exists) {
            db.Subscriptions.Add(new Subscription { Email = request.Email });
            await db.SaveChangesAsync();
        }
        return Results.Ok(new { success = true, message = "Suscripción Exitosa" });
    } catch (Exception ex) {
        // Failover logging
        try {
            string logPath = Path.Combine(AppContext.BaseDirectory, "failover.log");
            await File.AppendAllTextAsync(logPath, $"{DateTime.Now}|{request.Email}{Environment.NewLine}");
            await fluentEmail.To("juancruzbeniteza@gmail.com").Subject("⚠️ NGA Failover").Body($"DB Error: {ex.Message}. User: {request.Email}").SendAsync();
            return Results.Ok(new { success = true, message = "Suscripción Exitosa (via failover)" });
        } catch { return Results.Problem("Critical failure"); }
    }
});

app.MapGet("/api/quotes", async (IHttpClientFactory hf) => {
    try {
        var data = await new MarketDataFetcher(hf).Fetch(hf.CreateClient());
        return Results.Ok(data);
    } catch { return Results.Ok(new { status = "Market API limited" }); }
});

app.Run();

// --- MODELS & LOGIC ---

public class MarketDataFetcher {
    private readonly IHttpClientFactory _hf;
    public MarketDataFetcher(IHttpClientFactory hf) => _hf = hf;
    public async Task<MarketDataResponse> Fetch(HttpClient client) {
        client.DefaultRequestHeaders.Add("User-Agent", "NGA-App");
        var b = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var e = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var r = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");
        var stocks = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
        var bonds = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");
        
        var targetB = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bList = (bonds ?? new()).Where(x => targetB.Contains(x.Symbol)).Select(x => new BondInfo(x.Symbol, x.Symbol, x.PxBid, x.PxAsk, x.PctChange.ToString("F2") + "%")).ToList();
        var targetS = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var sList = (stocks ?? new()).Where(x => targetS.Contains(x.Symbol)).Select(x => new StockInfo(x.Symbol, x.Symbol, x.LastPrice, x.PctChange.ToString("F2") + "%", "Merval")).ToList();
        
        return new MarketDataResponse(new Quote(b?.Compra ?? 0, b?.Venta ?? 0), new Quote(e?.Compra ?? 0, e?.Venta ?? 0), new Quote(r?.Compra ?? 0, r?.Venta ?? 0), bList, sList);
    }
}

public class WeeklyReportService : BackgroundService {
    private readonly IServiceProvider _sp;
    private readonly IHttpClientFactory _hf;
    public WeeklyReportService(IServiceProvider sp, IHttpClientFactory hf) { _sp = sp; _hf = hf; }
    protected override async Task ExecuteAsync(CancellationToken st) {
        while (!st.IsCancellationRequested) {
            var now = DateTime.Now;
            if (now.DayOfWeek == DayOfWeek.Friday && now.Hour == 17 && now.Minute == 0) {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var email = scope.ServiceProvider.GetRequiredService<IFluentEmail>();
                var subs = await db.Subscriptions.ToListAsync();
                if (subs.Any()) {
                    var data = await new MarketDataFetcher(_hf).Fetch(_hf.CreateClient());
                    foreach (var s in subs) await email.To(s.Email).Subject("📊 NGA Reporte Semanal").Body($"Dólar Blue: ${data.dolar.venta}").SendAsync();
                }
                await Task.Delay(TimeSpan.FromHours(24), st);
            }
            await Task.Delay(TimeSpan.FromMinutes(1), st);
        }
    }
}

public class AppDbContext : DbContext { public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { } public DbSet<Subscription> Subscriptions { get; set; } }
public class Subscription { public int Id { get; set; } public string Email { get; set; } = ""; }
public record SubscriptionRequest(string Email);
public record MarketDataResponse(Quote dolar, Quote euro, Quote real, List<BondInfo> bonds, List<StockInfo> stocks);
public record Quote(decimal compra, decimal venta);
public record BondInfo(string ticker, string nombre, decimal compra, decimal venta, string variacion);
public record StockInfo(string ticker, string nombre, decimal precio, string variacion, string sector);
public record DolarApiResponse([property: JsonPropertyName("compra")] decimal Compra, [property: JsonPropertyName("venta")] decimal Venta);
public record MarketData912([property: JsonPropertyName("symbol")] string Symbol, [property: JsonPropertyName("px_bid")] decimal PxBid, [property: JsonPropertyName("px_ask")] decimal PxAsk, [property: JsonPropertyName("c")] decimal LastPrice, [property: JsonPropertyName("pct_change")] decimal PctChange);
