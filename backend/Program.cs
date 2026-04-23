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
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using Microsoft.Extensions.Configuration;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// DATABASE CONNECTION BUILDER (Supabase Optimized)
string GetConnectionString(string? url)
{
    if (string.IsNullOrEmpty(url)) return "Data Source=nga_inversiones.db";
    if (!url.Contains("://")) return url;

    try {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo[0];
        var pass = userInfo[1];
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var db = uri.AbsolutePath.Trim('/');

        // Note: For Supabase, adding 'Pooling=false' often solves transient errors in free tiers
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true;Pooling=false;Timeout=300";
    } catch {
        return url;
    }
}

var connectionString = GetConnectionString(builder.Configuration["DATABASE_URL"]);

builder.Services.AddDbContext<AppDbContext>(options => 
{
    if (connectionString.Contains("Data Source=")) {
        options.UseSqlite(connectionString);
    } else {
        options.UseNpgsql(connectionString, npgsqlOptions => {
            npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
        });
    }
});

builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => { options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()); });
builder.Services.AddHostedService<WeeklyReportService>();

// Mail config (using env vars if available)
var smtpConfig = builder.Configuration.GetSection("Smtp");
builder.Services.AddFluentEmail("juancruzbeniteza@gmail.com", "NGA Inversiones")
    .AddRazorRenderer()
    .AddSmtpSender(new SmtpClient("smtp.gmail.com") { 
        Port = 587, 
        Credentials = new System.Net.NetworkCredential("juancruzbeniteza@gmail.com", "lftmcuuggwjwjlel"),
        EnableSsl = true 
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    } catch (Exception ex) {
        Console.WriteLine($"Startup DB Error: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");

app.MapGet("/", () => Results.Ok(new { status = "NGA Online", database = connectionString.Contains("Host") ? "Postgres" : "SQLite" }));

app.MapGet("/api/quotes", async (IHttpClientFactory hf) =>
{
    try {
        var data = await new MarketDataFetcher(hf).Fetch(hf.CreateClient());
        return Results.Ok(data);
    } catch (Exception ex) { return Results.Problem(ex.Message); }
});

app.MapPost("/api/subscribe", async (SubscriptionRequest request, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        return Results.BadRequest(new { success = false, message = "Email inválido" });

    try {
        var exists = await db.Subscriptions.AnyAsync(s => s.Email == request.Email);
        if (exists) return Results.Ok(new { success = true, message = "Ya estás suscrito" });

        db.Subscriptions.Add(new Subscription { Email = request.Email });
        await db.SaveChangesAsync();
        return Results.Ok(new { success = true, message = "Suscripción exitosa" });
    } catch (Exception ex) {
        // Find the deepest error message
        var inner = ex;
        while (inner.InnerException != null) inner = inner.InnerException;
        return Results.Json(new { success = false, message = "Error de base de datos", detail = inner.Message }, statusCode: 500);
    }
});

app.MapGet("/api/unsubscribe", async (string token, AppDbContext db) =>
{
    try {
        byte[] data = Convert.FromBase64String(token);
        string email = Encoding.UTF8.GetString(data);
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.Email == email);
        if (sub != null) { db.Subscriptions.Remove(sub); await db.SaveChangesAsync(); }
        return Results.Content("<h1>Desuscripción Exitosa</h1>", "text/html");
    } catch { return Results.BadRequest(); }
});

app.Run();

public class WeeklyReportService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly IHttpClientFactory _hf;
    public WeeklyReportService(IServiceProvider sp, IHttpClientFactory hf) { _sp = sp; _hf = hf; }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            if (now.DayOfWeek == DayOfWeek.Friday && now.Hour == 17 && now.Minute == 0) { await SendWeeklyReports(); await Task.Delay(TimeSpan.FromHours(24), stoppingToken); }
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
    private async Task SendWeeklyReports()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var fluentEmail = scope.ServiceProvider.GetRequiredService<IFluentEmail>();
        var subscribers = await db.Subscriptions.ToListAsync();
        if (!subscribers.Any()) return;
        var marketData = await new MarketDataFetcher(_hf).Fetch(_hf.CreateClient());
        foreach (var sub in subscribers) {
            try {
                string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(sub.Email));
                await fluentEmail.To(sub.Email).Subject("📊 NGA Cierre Semanal").Body(BuildEmailTemplate(marketData, token), true).SendAsync();
            } catch (Exception ex) { Console.WriteLine(ex.Message); }
        }
    }
    private string BuildEmailTemplate(MarketDataResponse data, string token)
    {
        string unsub = $"https://frontend-gilt-eta-56.vercel.app/api/unsubscribe?token={token}";
        return $@"<html><body style='font-family:sans-serif;background:#f1f5f9;padding:20px'><div style='max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)'><div style='background:#2563eb;color:white;padding:30px;text-align:center'><h1 style='margin:0'>NGA INVERSIONES</h1><p>REPORTE SEMANAL</p></div><div style='padding:30px'><p>Cierre de mercado:</p><ul><li>Blue: ${data.dolar.venta}</li><li>Euro: ${data.euro.venta}</li><li>Real: ${data.real.venta}</li></ul><p style='margin-top:20px;font-size:12px;color:#64748b'>Para desuscribirte <a href='{unsub}'>haz click aquí</a>.</p></div></div></body></html>";
    }
}

public class MarketDataFetcher {
    private readonly IHttpClientFactory _hf;
    public MarketDataFetcher(IHttpClientFactory hf) => _hf = hf;
    public async Task<MarketDataResponse> Fetch(HttpClient client) {
        try {
            client.DefaultRequestHeaders.Add("User-Agent", "NGA-App");
            var b = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
            var e = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
            var r = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");
            var s = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
            var bo = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");
            var targetB = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
            var boData = bo ?? new List<MarketData912>();
            var bonds = boData.Where(x => targetB.Contains(x.Symbol)).Select(x => new BondInfo(x.Symbol, x.Symbol, x.PxBid, x.PxAsk, x.PctChange.ToString("F2") + "%")).ToList();
            var targetS = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
            var sData = s ?? new List<MarketData912>();
            var stocks = sData.Where(x => targetS.Contains(x.Symbol)).Select(x => new StockInfo(x.Symbol, x.Symbol, x.LastPrice, x.PctChange.ToString("F2") + "%", "Sector")).ToList();
            return new MarketDataResponse(new Quote(b?.Compra ?? 0, b?.Venta ?? 0), new Quote(e?.Compra ?? 0, e?.Venta ?? 0), new Quote(r?.Compra ?? 0, r?.Venta ?? 0), bonds, stocks);
        } catch { return new MarketDataResponse(new Quote(0, 0), new Quote(0, 0), new Quote(0, 0), new(), new()); }
    }
}

public class AppDbContext : DbContext { public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { } public DbSet<Subscription> Subscriptions { get; set; } }
public class Subscription { public int Id { get; set; } public string Email { get; set; } = ""; }
public record ContactRequest(string Nombre, string Email, string Mensaje);
public record SubscriptionRequest(string Email);
public record MarketDataResponse(Quote dolar, Quote euro, Quote real, List<BondInfo> bonds, List<StockInfo> stocks);
public record Quote(decimal compra, decimal venta);
public record BondInfo(string ticker, string nombre, decimal compra, decimal venta, string variacion);
public record StockInfo(string ticker, string nombre, decimal precio, string variacion, string sector);
public record DolarApiResponse([property: JsonPropertyName("compra")] decimal Compra, [property: JsonPropertyName("venta")] decimal Venta);
public record MarketData912([property: JsonPropertyName("symbol")] string Symbol, [property: JsonPropertyName("px_bid")] decimal PxBid, [property: JsonPropertyName("px_ask")] decimal PxAsk, [property: JsonPropertyName("c")] decimal LastPrice, [property: JsonPropertyName("pct_change")] decimal PctChange);
