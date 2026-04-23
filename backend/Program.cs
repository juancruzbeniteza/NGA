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

// DATABASE CONNECTION (The most flexible way)
string GetConnectionString(string? input)
{
    if (string.IsNullOrEmpty(input)) return "Data Source=nga_inversiones.db";
    
    // Si el usuario pega la cadena de ADO.NET de Supabase, la usamos DIRECTA
    if (input.Contains("Server=") || input.Contains("Host=") && input.Contains("Password=")) {
        return input;
    }

    // Si es formato postgres:// intentamos convertirlo
    try {
        var uri = new Uri(input);
        var userInfo = uri.UserInfo.Split(':');
        return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";
    } catch {
        return input;
    }
}

var connectionString = GetConnectionString(builder.Configuration["DATABASE_URL"]);

builder.Services.AddDbContext<AppDbContext>(options => 
{
    if (connectionString.Contains("Data Source=")) {
        options.UseSqlite(connectionString);
    } else {
        options.UseNpgsql(connectionString, npgsqlOptions => {
            npgsqlOptions.EnableRetryOnFailure(2); // Pocos reintentos para no bloquear el hilo
        });
    }
});

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

using (var scope = app.Services.CreateScope())
{
    try {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    } catch (Exception ex) {
        Console.WriteLine($"DB Error: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");

app.MapGet("/", () => Results.Ok(new { status = "NGA Online", time = DateTime.Now }));

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
        var inner = ex;
        while (inner.InnerException != null) inner = inner.InnerException;
        return Results.Json(new { success = false, message = "Error de conexión", detail = inner.Message }, statusCode: 500);
    }
});

app.MapGet("/api/quotes", async (IHttpClientFactory hf) =>
{
    try {
        var data = await new MarketDataFetcher(hf).Fetch(hf.CreateClient());
        return Results.Ok(data);
    } catch { 
        // Fallback data if API or anything else fails
        return Results.Ok(new { dolar = new { compra = 1000, venta = 1100 }, bonds = new List<string>(), stocks = new List<string>() });
    }
});

app.MapGet("/api/test-send", async (string email, IFluentEmail fluentEmail, IHttpClientFactory hf) =>
{
    try {
        var data = await new MarketDataFetcher(hf).Fetch(hf.CreateClient());
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(email));
        var res = await fluentEmail.To(email).Subject("📊 Test NGA").Body(new WeeklyReportService(null!, hf).BuildEmailTemplateManual(data, token), true).SendAsync();
        return res.Successful ? Results.Ok(new { success = true }) : Results.Problem("SMTP Error");
    } catch (Exception ex) { return Results.Problem(ex.Message); }
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
        var subs = await db.Subscriptions.ToListAsync();
        if (!subs.Any()) return;
        var data = await new MarketDataFetcher(_hf).Fetch(_hf.CreateClient());
        foreach (var sub in subs) {
            try {
                string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(sub.Email));
                await fluentEmail.To(sub.Email).Subject("📊 Reporte NGA").Body(BuildEmailTemplate(data, token), true).SendAsync();
            } catch {}
        }
    }
    public string BuildEmailTemplateManual(MarketDataResponse data, string token) => BuildEmailTemplate(data, token);
    private string BuildEmailTemplate(MarketDataResponse data, string token)
    {
        return $@"<html><body><h1>NGA INVERSIONES</h1><p>Dólar Blue: ${data.dolar.venta}</p></body></html>";
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
            return new MarketDataResponse(new Quote(b?.Compra ?? 0, b?.Venta ?? 0), new Quote(e?.Compra ?? 0, e?.Venta ?? 0), new Quote(r?.Compra ?? 0, r?.Venta ?? 0), new(), new());
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
