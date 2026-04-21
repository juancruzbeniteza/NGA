using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

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
    
    try {
        // Core Currencies
        var blueTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/dolares/blue");
        var euroTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/eur");
        var realTask = client.GetFromJsonAsync<DolarApiResponse>("https://dolarapi.com/v1/cotizaciones/brl");

        await Task.WhenAll(blueTask, euroTask, realTask);

        var blue = await blueTask;
        var euro = await euroTask;
        var real = await realTask;

        // Bonds (Argentine market context)
        var bonds = new[] {
            new { ticker = "AL30", nombre = "Bonar 2030", compra = 52.40m, venta = 53.10m, moneda = "USD" },
            new { ticker = "GD30", nombre = "Global 2030", compra = 56.15m, venta = 56.80m, moneda = "USD" },
            new { ticker = "AL30D", nombre = "Bonar 2030 (D)", compra = 52.45m, venta = 53.00m, moneda = "USD" }
        };

        // Leading Stocks (Merval Context - Mocking real tickers with live-ish prices since public API is down)
        var stocks = new[] {
            new { ticker = "GGAL", nombre = "Grupo Fin. Galicia", precio = 4850.50m, variacion = "+2.4%", sector = "Bancario" },
            new { ticker = "YPFD", nombre = "YPF S.A.", precio = 24120.00m, variacion = "-1.2%", sector = "Energía" },
            new { ticker = "PAMP", nombre = "Pampa Energía", precio = 1840.20m, variacion = "+0.8%", sector = "Energía" },
            new { ticker = "ALUA", nombre = "Aluar Aluminio", precio = 890.00m, variacion = "+1.5%", sector = "Industria" },
            new { ticker = "BMA", nombre = "Banco Macro", precio = 5600.30m, variacion = "+3.1%", sector = "Bancario" }
        };

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
        return Results.Ok(new
        {
            dolar = new { compra = 1390, venta = 1410 },
            euro = new { compra = 1611, venta = 1625 },
            real = new { compra = 276, venta = 277 },
            bonds = new[] {
                new { ticker = "AL30", nombre = "Bonar 2030", compra = 52.40m, venta = 53.10m, moneda = "USD" },
                new { ticker = "GD30", nombre = "Global 2030", compra = 56.15m, venta = 56.80m, moneda = "USD" }
            },
            stocks = new[] {
                new { ticker = "GGAL", nombre = "Galicia", precio = 4850.50m, variacion = "+2.4%" }
            }
        });
    }
})
.WithName("GetQuotes");

app.MapPost("/api/contact", (ContactRequest request) =>
{
    return Results.Ok(new { success = true, message = "Mensaje recibido" });
})
.WithName("PostContact");

app.Run();

record ContactRequest(string Nombre, string Email, string Mensaje);

record DolarApiResponse(
    [property: JsonPropertyName("compra")] decimal Compra, 
    [property: JsonPropertyName("venta")] decimal Venta
);
