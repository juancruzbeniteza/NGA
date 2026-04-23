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

// Database Configuration - PostgreSQL
var connectionString = builder.Configuration["DATABASE_URL"] 
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options => 
{
    if (string.IsNullOrEmpty(connectionString))
    {
        // Fallback to SQLite for local development if no Postgres is provided
        options.UseSqlite("Data Source=nga_inversiones.db");
    }
    else 
    {
        options.UseNpgsql(connectionString);
    }
});

// SMTP Configuration from appsettings.json or Environment Variables
var smtpConfig = builder.Configuration.GetSection("Smtp");
builder.Services
    .AddFluentEmail(smtpConfig["FromEmail"] ?? "info@ngainversiones.com.ar", smtpConfig["FromName"] ?? "NGA Inversiones")
    .AddRazorRenderer()
    .AddSmtpSender(new SmtpClient(smtpConfig["Host"] ?? "localhost") { 
        Port = int.Parse(smtpConfig["Port"] ?? "587"),
        Credentials = new System.Net.NetworkCredential(smtpConfig["User"], smtpConfig["Pass"]),
        EnableSsl = bool.Parse(smtpConfig["EnableSsl"] ?? "true")
    });

builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddHostedService<WeeklyReportService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Automatically apply migrations/create schema
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

app.MapGet("/api/quotes", async (IHttpClientFactory httpClientFactory) =>
{
    return Results.Ok(await FetchMarketData(httpClientFactory.CreateClient()));
})
.WithName("GetQuotes");

app.MapPost("/api/subscribe", async (SubscriptionRequest request, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        return Results.BadRequest(new { message = "Email inválido" });

    if (await db.Subscriptions.AnyAsync(s => s.Email == request.Email))
        return Results.Ok(new { message = "Ya estás suscrito" });

    db.Subscriptions.Add(new Subscription { Email = request.Email });
    await db.SaveChangesAsync();

    return Results.Ok(new { success = true, message = "Suscripción exitosa" });
});

// TEST ENDPOINT: Trigger manual email for testing
app.MapGet("/api/test-send", async (string email, IFluentEmail fluentEmail, IHttpClientFactory httpClientFactory) =>
{
    try {
        var client = httpClientFactory.CreateClient();
        var marketData = await new MarketDataFetcher(httpClientFactory).Fetch(client);
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(email));
        
        var result = await fluentEmail
            .To(email)
            .Subject("📊 NGA Inversiones - Cierre de Mercado")
            .Body(new WeeklyReportService(null!, httpClientFactory).BuildEmailTemplateManual(marketData, token), true)
            .SendAsync();

        if (result.Successful)
            return Results.Ok(new { success = true, message = $"Mail enviado a {email}" });
        else
            return Results.Problem("Error al enviar: " + string.Join(", ", result.ErrorMessages));
    } catch (Exception ex) {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/unsubscribe", async (string token, AppDbContext db) =>
{
    try {
        byte[] data = Convert.FromBase64String(token);
        string email = Encoding.UTF8.GetString(data);
        
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.Email == email);
        string message;
        string icon;
        
        if (sub != null) {
            db.Subscriptions.Remove(sub);
            await db.SaveChangesAsync();
            message = $"Ya no recibirás nuestros reportes semanales en <b>{email}</b>. Siempre puedes volver a suscribirte en nuestra web.";
            icon = "✓";
        } else {
            message = $"No encontramos una suscripción activa para <b>{email}</b> o ya has sido desuscrito.";
            icon = "ⓘ";
        }

        return Results.Content($@"
                <html>
                <body style='font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; margin: 0;'>
                    <div style='background: white; padding: 50px; border-radius: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; max-width: 440px;'>
                        <div style='color: #2563eb; font-size: 64px; margin-bottom: 24px;'>{icon}</div>
                        <h1 style='color: #1e293b; margin-bottom: 12px; font-size: 24px; font-weight: 800;'>Estado de Suscripción</h1>
                        <p style='color: #64748b; line-height: 1.6; font-size: 16px;'>{message}</p>
                        <a href='http://localhost:5173' style='display: inline-block; margin-top: 32px; background: #2563eb; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;'>Volver a NGA</a>
                    </div>
                </body>
                </html>", "text/html");
    } catch {
        return Results.BadRequest("Token inválido");
    }
});

app.MapPost("/api/contact", (ContactRequest request) =>
{
    return Results.Ok(new { success = true, message = "Mensaje recibido" });
})
.WithName("PostContact");

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

        var blue = await blueTask;
        var euro = await euroTask;
        var real = await realTask;
        var rawStocks = await stocksTask ?? new List<MarketData912>();
        var rawBonds = await bondsTask ?? new List<MarketData912>();

        var targetBonds = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bonds = rawBonds
            .Where(b => targetBonds.Contains(b.Symbol))
            .Select(b => new BondInfo(b.Symbol, GetBondName(b.Symbol), b.PxBid, b.PxAsk, $"{(b.PctChange >= 0 ? "+" : "")}{b.PctChange:F2}%"))
            .ToList();

        var targetStocks = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var stocks = rawStocks
            .Where(s => targetStocks.Contains(s.Symbol))
            .Select(s => new StockInfo(s.Symbol, GetStockName(s.Symbol), s.LastPrice, $"{(s.PctChange >= 0 ? "+" : "")}{s.PctChange:F2}%", GetStockSector(s.Symbol)))
            .ToList();

        return new MarketDataResponse(
            new Quote(blue?.Compra ?? 0, blue?.Venta ?? 0),
            new Quote(euro?.Compra ?? 0, euro?.Venta ?? 0),
            new Quote(real?.Compra ?? 0, real?.Venta ?? 0),
            bonds,
            stocks
        );
    } catch {
        return new MarketDataResponse(new Quote(0, 0), new Quote(0, 0), new Quote(0, 0), new(), new());
    }
}

string GetBondName(string symbol) => symbol switch {
    "AL30" => "Bonar 2030", "GD30" => "Global 2030", "AL29" => "Bonar 2029", "AE38" => "Bonar 2038", "GD35" => "Global 2035", "AL41" => "Bonar 2041", _ => symbol
};

string GetStockName(string symbol) => symbol switch {
    "GGAL" => "Galicia", "YPFD" => "YPF", "PAMP" => "Pampa", "ALUA" => "Aluar", "BMA" => "Macro", "LOMA" => "Loma Negra", "EDN" => "Edenor", "TXAR" => "Ternium", "CEPU" => "Central Puerto", "COME" => "Comercial Plata", _ => symbol
};

string GetStockSector(string symbol) => symbol switch {
    "GGAL" or "BMA" => "Bancario", "YPFD" or "PAMP" or "EDN" or "CEPU" => "Energía", "ALUA" or "TXAR" => "Industria", "LOMA" => "Construcción", "COME" => "Holding", _ => "Varios"
};

public class WeeklyReportService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;

    public WeeklyReportService(IServiceProvider serviceProvider, IHttpClientFactory httpClientFactory)
    {
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            if (now.DayOfWeek == DayOfWeek.Friday && now.Hour == 17 && now.Minute == 0)
            {
                await SendWeeklyReports();
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
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

        foreach (var sub in subscribers)
        {
            try {
                string token = Convert.ToBase64String(Encoding.UTF8.GetBytes(sub.Email));
                string emailBody = BuildEmailTemplate(marketData, token);
                
                await fluentEmail
                    .To(sub.Email)
                    .Subject("📊 NGA Inversiones - Cierre de Mercado Semanal")
                    .Body(emailBody, true)
                    .SendAsync();
            } catch (Exception ex) {
                Console.WriteLine($"Error sending email to {sub.Email}: {ex.Message}");
            }
        }
    }

    public string BuildEmailTemplateManual(MarketDataResponse data, string token) => BuildEmailTemplate(data, token);

    private string BuildEmailTemplate(MarketDataResponse data, string token)
    {
        string unsubscribeUrl = $"http://localhost:5023/api/unsubscribe?token={token}";
        string primaryBlue = "#2563eb";
        string secondarySlate = "#1e293b";
        string successGreen = "#059669";
        string dangerRed = "#dc2626";

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #f1f5f9; padding: 40px 0;'>
                <tr>
                    <td align='center'>
                        <table border='0' cellpadding='0' cellspacing='0' width='600' style='background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'>
                            <!-- Header -->
                            <tr>
                                <td align='center' style='padding: 40px 40px 20px 40px; background: linear-gradient(135deg, {primaryBlue} 0%, #1e40af 100%);'>
                                    <img src='https://scontent.fros8-1.fna.fbcdn.net/v/t39.30808-1/348431323_258445666706358_5973766118846707652_n.png' width='70' style='border-radius: 12px; margin-bottom: 15px; background: white; padding: 5px;' />
                                    <h1 style='color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase; font-style: italic;'>NGA INVERSIONES</h1>
                                    <p style='color: #bfdbfe; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 0.1em;'>REPORTE DE CIERRE SEMANAL</p>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td style='padding: 40px;'>
                                    <p style='margin: 0 0 24px 0; color: {secondarySlate}; font-size: 16px; font-weight: 500;'>
                                        Hola, te compartimos el resumen de mercado de esta semana. Estos son los valores actualizados al cierre del viernes:
                                    </p>

                                    <!-- FX Section -->
                                    <h2 style='font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;'>💵 Mercado de Divisas</h2>
                                    <div style='background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 32px;'>
                                        <table width='100%' cellspacing='0' cellpadding='0'>
                                            <tr>
                                                <td style='padding-bottom: 12px;'>
                                                    <span style='color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Dólar Blue</span><br/>
                                                    <span style='font-size: 20px; font-weight: 800; color: {secondarySlate};'>${data.dolar.venta:N2}</span>
                                                </td>
                                                <td style='padding-bottom: 12px; text-align: right;'>
                                                    <span style='color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Euro Oficial</span><br/>
                                                    <span style='font-size: 20px; font-weight: 800; color: {secondarySlate};'>${data.euro.venta:N2}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <span style='color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;'>Real</span><br/>
                                                    <span style='font-size: 20px; font-weight: 800; color: {secondarySlate};'>${data.real.venta:N2}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Stocks Section -->
                                    <h2 style='font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;'>📈 Acciones Merval</h2>
                                    <table width='100%' cellspacing='0' cellpadding='0' style='border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;'>
                                        <tr style='background-color: #f8fafc;'>
                                            <th align='left' style='padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b;'>Ticker</th>
                                            <th align='right' style='padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b;'>Precio</th>
                                            <th align='right' style='padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b;'>Var %</th>
                                        </tr>
                                        {string.Join("", data.stocks.Take(6).Select(s => $@"
                                        <tr>
                                            <td style='padding: 12px 16px; border-top: 1px solid #f1f5f9; font-weight: 700; color: {secondarySlate};'>{s.ticker}</td>
                                            <td align='right' style='padding: 12px 16px; border-top: 1px solid #f1f5f9; font-weight: 600; color: {secondarySlate};'>${s.precio:N2}</td>
                                            <td align='right' style='padding: 12px 16px; border-top: 1px solid #f1f5f9; font-weight: 800; color: {(s.variacion.Contains("+") ? successGreen : dangerRed)};'>{s.variacion}</td>
                                        </tr>"))}
                                    </table>

                                    <!-- CTA -->
                                    <div style='margin-top: 40px; text-align: center;'>
                                        <a href='https://ngainversiones.com.ar/contacto' style='display: inline-block; background-color: {primaryBlue}; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;'>Hablar con un Asesor</a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style='padding: 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;'>
                                    <p style='margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: 600;'>© 2026 NGA INVERSIONES • ROSARIO</p>
                                    <p style='margin: 0 0 20px 0; color: #94a3b8; font-size: 11px; line-height: 1.5;'>
                                        Este mail es de carácter informativo y no constituye asesoramiento financiero.
                                    </p>
                                    <a href='{unsubscribeUrl}' style='color: #2563eb; font-size: 12px; font-weight: 700; text-decoration: none;'>Desuscribirse de este servicio</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";
    }
}

public class MarketDataFetcher {
    private readonly IHttpClientFactory _httpClientFactory;
    public MarketDataFetcher(IHttpClientFactory httpClientFactory) => _httpClientFactory = httpClientFactory;
    public async Task<MarketDataResponse> Fetch(HttpClient client) {
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("User-Agent", "NGA-Inversiones-App");
        var blueTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var euroTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var realTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");
        var stocksTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
        var bondsTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");
        await Task.WhenAll(blueTask, euroTask, realTask, stocksTask, bondsTask);
        var blue = await blueTask;
        var euro = await euroTask;
        var real = await realTask;
        var rawStocks = await stocksTask ?? new List<MarketData912>();
        var rawBonds = await bondsTask ?? new List<MarketData912>();
        var targetBonds = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bonds = rawBonds.Where(b => targetBonds.Contains(b.Symbol)).Select(b => new BondInfo(b.Symbol, GetBondName(b.Symbol), b.PxBid, b.PxAsk, $"{(b.PctChange >= 0 ? "+" : "")}{b.PctChange:F2}%")).ToList();
        var targetStocks = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var stocks = rawStocks.Where(s => targetStocks.Contains(s.Symbol)).Select(s => new StockInfo(s.Symbol, GetStockName(s.Symbol), s.LastPrice, $"{(s.PctChange >= 0 ? "+" : "")}{s.PctChange:F2}%", GetStockSector(s.Symbol))).ToList();
        return new MarketDataResponse(new Quote(blue?.Compra ?? 0, blue?.Venta ?? 0), new Quote(euro?.Compra ?? 0, euro?.Venta ?? 0), new Quote(real?.Compra ?? 0, real?.Venta ?? 0), bonds, stocks);
    }
    string GetBondName(string s) => s switch { "AL30"=>"Bonar 2030","GD30"=>"Global 2030","AL29"=>"Bonar 2029","AE38"=>"Bonar 2038","GD35"=>"Global 2035","AL41"=>"Bonar 2041", _=>s };
    string GetStockName(string s) => s switch { "GGAL"=>"Galicia","YPFD"=>"YPF","PAMP"=>"Pampa","ALUA"=>"Aluar","BMA"=>"Macro","LOMA"=>"Loma Negra","EDN"=>"Edenor","TXAR"=>"Ternium","CEPU"=>"Central Puerto","COME"=>"Comercial Plata", _=>s };
    string GetStockSector(string s) => s switch { "GGAL" or "BMA"=>"Bancario","YPFD" or "PAMP" or "EDN" or "CEPU"=>"Energía","ALUA" or "TXAR"=>"Industria","LOMA"=>"Construcción","COME"=>"Holding", _=>"Varios" };
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Subscription> Subscriptions { get; set; }
}

public class Subscription
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
}

public record ContactRequest(string Nombre, string Email, string Mensaje);
public record SubscriptionRequest(string Email);
public record MarketDataResponse(Quote dolar, Quote euro, Quote real, List<BondInfo> bonds, List<StockInfo> stocks);
public record Quote(decimal compra, decimal venta);
public record BondInfo(string ticker, string nombre, decimal compra, decimal venta, string variacion);
public record StockInfo(string ticker, string nombre, decimal precio, string variacion, string sector);

public record DolarApiResponse(
    [property: JsonPropertyName("compra")] decimal Compra, [property: JsonPropertyName("venta")] decimal Venta
);

public record MarketData912(
    [property: JsonPropertyName("symbol")] string Symbol, [property: JsonPropertyName("px_bid")] decimal PxBid, [property: JsonPropertyName("px_ask")] decimal PxAsk, [property: JsonPropertyName("c")] decimal LastPrice, [property: JsonPropertyName("pct_change")] decimal PctChange
);
