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

var builder = WebApplication.CreateBuilder(args);

// Database Configuration: Smart Switch
// DATABASE_URL is provided by Render/Supabase
var connectionString = builder.Configuration["DATABASE_URL"];

builder.Services.AddDbContext<AppDbContext>(options => 
{
    if (string.IsNullOrEmpty(connectionString))
    {
        // LOCAL: Usar SQLite
        options.UseSqlite("Data Source=nga_inversiones.db");
    }
    else 
    {
        // NUBE: Usar PostgreSQL (Supabase)
        // Convertir URL de Supabase si es necesario (Render a veces requiere sslmode=require)
        if (connectionString.StartsWith("postgres://")) {
            connectionString = connectionString.Replace("postgres://", "postgresql://");
        }
        options.UseNpgsql(connectionString);
    }
});

// SMTP Configuration
var smtpConfig = builder.Configuration.GetSection("Smtp");
builder.Services
    .AddFluentEmail(smtpConfig["FromEmail"] ?? "info@ngainversiones.com.ar", smtpConfig["FromName"] ?? "NGA Inversiones")
    .AddRazorRenderer()
    .AddSmtpSender(new SmtpClient(smtpConfig["Host"] ?? "smtp.gmail.com") { 
        Port = int.Parse(smtpConfig["Port"] ?? "587"),
        Credentials = new System.Net.NetworkCredential(smtpConfig["User"], smtpConfig["Pass"]),
        EnableSsl = true
    });

builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: Permitir todo en producción para evitar bloqueos
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddHostedService<WeeklyReportService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");

// Health Check for Pinging Service (Keep-alive)
app.MapGet("/", () => Results.Ok(new { status = "NGA Online", environment = connectionString != null ? "Cloud" : "Local", time = DateTime.Now }));

app.MapGet("/api/quotes", async (IHttpClientFactory httpClientFactory) =>
{
    return Results.Ok(await FetchMarketData(httpClientFactory.CreateClient()));
})
.WithName("GetQuotes");

app.MapPost("/api/subscribe", async (SubscriptionRequest request, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        return Results.BadRequest(new { success = false, message = "Email inválido" });

    try {
        if (await db.Subscriptions.AnyAsync(s => s.Email == request.Email))
            return Results.Ok(new { success = true, message = "Ya estás suscrito" });

        db.Subscriptions.Add(new Subscription { Email = request.Email });
        await db.SaveChangesAsync();
        return Results.Ok(new { success = true, message = "Suscripción exitosa" });
    } catch (Exception ex) {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/test-send", async (string email, IFluentEmail fluentEmail, IHttpClientFactory httpClientFactory) =>
{
    try {
        var client = httpClientFactory.CreateClient();
        var marketData = await new MarketDataFetcher(httpClientFactory).Fetch(client);
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(email));
        var result = await fluentEmail.To(email).Subject("📊 NGA Inversiones - Test Cierre").Body(new WeeklyReportService(null!, httpClientFactory).BuildEmailTemplateManual(marketData, token), true).SendAsync();
        return result.Successful ? Results.Ok(new { success = true }) : Results.Problem("Error");
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

async Task<MarketDataResponse> FetchMarketData(HttpClient client)
{
    client.DefaultRequestHeaders.Clear();
    client.DefaultRequestHeaders.Add("User-Agent", "NGA-Inversiones-App");
    try {
        var blueTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var euroTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var realTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");
        var stocksTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
        var bondsTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");
        await Task.WhenAll(blueTask, euroTask, realTask, stocksTask, bondsTask);
        var blue = await blueTask; var euro = await euroTask; var real = await realTask;
        var rawStocks = await stocksTask ?? new List<MarketData912>();
        var rawBonds = await bondsTask ?? new List<MarketData912>();
        var targetBonds = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bonds = rawBonds.Where(b => targetBonds.Contains(b.Symbol)).Select(b => new BondInfo(b.Symbol, GetBondName(b.Symbol), b.PxBid, b.PxAsk, $"{(b.PctChange >= 0 ? "+" : "")}{b.PctChange:F2}%")).ToList();
        var targetStocks = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var stocks = rawStocks.Where(s => targetStocks.Contains(s.Symbol)).Select(s => new StockInfo(s.Symbol, GetStockName(s.Symbol), s.LastPrice, $"{(s.PctChange >= 0 ? "+" : "")}{s.PctChange:F2}%", GetStockSector(s.Symbol))).ToList();
        return new MarketDataResponse(new Quote(blue?.Compra ?? 0, blue?.Venta ?? 0), new Quote(euro?.Compra ?? 0, euro?.Venta ?? 0), new Quote(real?.Compra ?? 0, real?.Venta ?? 0), bonds, stocks);
    } catch { return new MarketDataResponse(new Quote(0, 0), new Quote(0, 0), new Quote(0, 0), new(), new()); }
}

string GetBondName(string s) => s switch { "AL30" => "Bonar 2030", "GD30" => "Global 2030", "AL29" => "Bonar 2029", "AE38" => "Bonar 2038", "GD35" => "Global 2035", "AL41" => "Bonar 2041", _ => s };
string GetStockName(string s) => s switch { "GGAL" => "Galicia", "YPFD" => "YPF", "PAMP" => "Pampa", "ALUA" => "Aluar", "BMA" => "Macro", "LOMA" => "Loma Negra", "EDN" => "Edenor", "TXAR" => "Ternium", "CEPU" => "Central Puerto", "COME" => "Comercial Plata", _ => s };
string GetStockSector(string s) => s switch { "GGAL" or "BMA" => "Bancario", "YPFD" or "PAMP" or "EDN" or "CEPU" => "Energía", "ALUA" or "TXAR" => "Industria", "LOMA" => "Construcción", "COME" => "Holding", _ => "Varios" };

public class WeeklyReportService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    public WeeklyReportService(IServiceProvider serviceProvider, IHttpClientFactory httpClientFactory) { _serviceProvider = serviceProvider; _httpClientFactory = httpClientFactory; }
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
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var fluentEmail = scope.ServiceProvider.GetRequiredService<IFluentEmail>();
        var subscribers = await db.Subscriptions.ToListAsync();
        if (!subscribers.Any()) return;
        var client = _httpClientFactory.CreateClient();
        var marketData = await new MarketDataFetcher(_httpClientFactory).Fetch(client);
        foreach (var sub in subscribers) {
            try {
                string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(sub.Email));
                await fluentEmail.To(sub.Email).Subject("📊 NGA Inversiones - Cierre de Mercado Semanal").Body(BuildEmailTemplate(marketData, token), true).SendAsync();
            } catch (Exception ex) { Console.WriteLine(ex.Message); }
        }
    }
    public string BuildEmailTemplateManual(MarketDataResponse data, string token) => BuildEmailTemplate(data, token);
    private string BuildEmailTemplate(MarketDataResponse data, string token)
    {
        string unsubscribeUrl = $"https://nga-backend.onrender.com/api/unsubscribe?token={token}";
        return $@"<html><body style='font-family: sans-serif; background: #f1f5f9; padding: 20px;'><div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'><div style='background: #2563eb; color: white; padding: 30px; text-align: center;'><h1 style='margin:0'>NGA INVERSIONES</h1><p>REPORTE SEMANAL</p></div><div style='padding: 30px;'><p>Resumen de cierre de mercado:</p><ul><li>Dólar Blue: ${data.dolar.venta}</li><li>Euro: ${data.euro.venta}</li><li>Real: ${data.real.venta}</li></ul><p style='margin-top:20px; font-size: 12px; color: #64748b;'>Para dejar de recibir estos mails, <a href='{unsubscribeUrl}'>haz click aquí</a>.</p></div></div></body></html>";
    }
}

public class MarketDataFetcher {
    private readonly IHttpClientFactory _hf;
    public MarketDataFetcher(IHttpClientFactory hf) => _hf = hf;
    public async Task<MarketDataResponse> Fetch(HttpClient client) {
        client.DefaultRequestHeaders.Add("User-Agent", "NGA-App");
        var b = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var e = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var r = await client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");
        var s = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
        var bo = await client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");
        var targetB = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bonds = bo.Where(x => targetB.Contains(x.Symbol)).Select(x => new BondInfo(x.Symbol, x.Symbol, x.PxBid, x.PxAsk, x.PctChange.ToString())).ToList();
        var targetS = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var stocks = s.Where(x => targetS.Contains(x.Symbol)).Select(x => new StockInfo(x.Symbol, x.Symbol, x.LastPrice, x.PctChange.ToString(), "Sector")).ToList();
        return new MarketDataResponse(new Quote(b.Compra, b.Venta), new Quote(e.Compra, e.Venta), new Quote(r.Compra, r.Venta), bonds, stocks);
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
