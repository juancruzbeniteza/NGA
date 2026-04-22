using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.MapGet("/api/quotes", async (IHttpClientFactory httpClientFactory) =>
{
    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Add("User-Agent", "NGA-Inversiones-App");
    
    try {
        // Core Currencies
        var blueTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var euroTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var realTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");

        // Market Data from Data912
        var stocksTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_stocks");
        var bondsTask = client.GetFromJsonAsync<List<MarketData912>>("https://data912.com/live/arg_bonds");

        await Task.WhenAll(blueTask, euroTask, realTask, stocksTask, bondsTask);

        var blue = await blueTask;
        var euro = await euroTask;
        var real = await realTask;
        var rawStocks = await stocksTask ?? new List<MarketData912>();
        var rawBonds = await bondsTask ?? new List<MarketData912>();

        // Filter and Map Bonds
        var targetBonds = new[] { "AL30", "GD30", "AL29", "AE38", "GD35", "AL41" };
        var bonds = rawBonds
            .Where(b => targetBonds.Contains(b.Symbol))
            .Select(b => new { 
                ticker = b.Symbol, 
                nombre = GetBondName(b.Symbol),
                compra = b.PxBid, 
                venta = b.PxAsk,
                variacion = $"{(b.PctChange >= 0 ? "+" : "")}{b.PctChange:F2}%"
            })
            .ToList();

        // Filter and Map Stocks
        var targetStocks = new[] { "GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME" };
        var stocks = rawStocks
            .Where(s => targetStocks.Contains(s.Symbol))
            .Select(s => new { 
                ticker = s.Symbol, 
                nombre = GetStockName(s.Symbol),
                precio = s.LastPrice, 
                variacion = $"{(s.PctChange >= 0 ? "+" : "")}{s.PctChange:F2}%",
                sector = GetStockSector(s.Symbol)
            })
            .ToList();

        return Results.Ok(new
        {
            dolar = new { compra = blue?.Compra ?? 0, venta = blue?.Venta ?? 0 },
            euro = new { compra = euro?.Compra ?? 0, venta = euro?.Venta ?? 0 },
            real = new { compra = real?.Compra ?? 0, venta = real?.Venta ?? 0 },
            bonds = bonds,
            stocks = stocks
        });
    } catch (Exception ex) {
        Console.WriteLine($"Error fetching prices: {ex.Message}");
        // Minimal fallback
        return Results.Ok(new { error = "API Unavailable", message = ex.Message });
    }
})
.WithName("GetQuotes");

app.MapPost("/api/contact", (ContactRequest request) =>
{
    return Results.Ok(new { success = true, message = "Mensaje recibido" });
})
.WithName("PostContact");

app.Run();

// Helper Functions
string GetBondName(string symbol) => symbol switch {
    "AL30" => "Bonar 2030",
    "GD30" => "Global 2030",
    "AL29" => "Bonar 2029",
    "AE38" => "Bonar 2038",
    "GD35" => "Global 2035",
    "AL41" => "Bonar 2041",
    _ => symbol
};

string GetStockName(string symbol) => symbol switch {
    "GGAL" => "Grupo Fin. Galicia",
    "YPFD" => "YPF S.A.",
    "PAMP" => "Pampa Energía",
    "ALUA" => "Aluar Aluminio",
    "BMA" => "Banco Macro",
    "LOMA" => "Loma Negra",
    "EDN" => "Edenor",
    "TXAR" => "Ternium Arg",
    "CEPU" => "Central Puerto",
    "COME" => "Soc. Com. del Plata",
    _ => symbol
};

string GetStockSector(string symbol) => symbol switch {
    "GGAL" or "BMA" => "Bancario",
    "YPFD" or "PAMP" or "EDN" or "CEPU" => "Energía",
    "ALUA" or "TXAR" => "Industria",
    "LOMA" => "Construcción",
    "COME" => "Holding",
    _ => "Varios"
};

record ContactRequest(string Nombre, string Email, string Mensaje);

record DolarApiResponse(
    [property: JsonPropertyName("compra")] decimal Compra, 
    [property: JsonPropertyName("venta")] decimal Venta
);

record MarketData912(
    [property: JsonPropertyName("symbol")] string Symbol,
    [property: JsonPropertyName("px_bid")] decimal PxBid,
    [property: JsonPropertyName("px_ask")] decimal PxAsk,
    [property: JsonPropertyName("c")] decimal LastPrice,
    [property: JsonPropertyName("pct_change")] decimal PctChange
);
