import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const headers = { 'User-Agent': 'NGA-App' };

    const fetchJson = async (url: string) => {
      const res = await fetch(url, { headers, next: { revalidate: 60 } }); // Cache for 60 seconds
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    };

    const [b, e, r, s, bo] = await Promise.all([
      fetchJson("https://dolarapi.com/v1/dolares/blue").catch(() => null),
      fetchJson("https://dolarapi.com/v1/cotizaciones/eur").catch(() => null),
      fetchJson("https://dolarapi.com/v1/cotizaciones/brl").catch(() => null),
      fetchJson("https://data912.com/live/arg_stocks").catch(() => []),
      fetchJson("https://data912.com/live/arg_bonds").catch(() => [])
    ]);

    const targetB = ["AL30", "GD30", "AL29", "AE38", "GD35", "AL41"];
    const bonds = (bo || [])
      .filter((x: any) => targetB.includes(x.symbol))
      .map((x: any) => ({
        ticker: x.symbol,
        nombre: x.symbol,
        compra: x.px_bid,
        venta: x.px_ask,
        variacion: `${x.pct_change >= 0 ? '+' : ''}${x.pct_change.toFixed(2)}%`
      }));

    const targetS = ["GGAL", "YPFD", "PAMP", "ALUA", "BMA", "LOMA", "EDN", "TXAR", "CEPU", "COME"];
    const stocks = (s || [])
      .filter((x: { symbol: string }) => targetS.includes(x.symbol))
      .map((x: { symbol: string, c: number, pct_change: number }) => ({
        ticker: x.symbol,
        nombre: x.symbol,
        precio: x.c,
        variacion: `${x.pct_change >= 0 ? '+' : ''}${(x.pct_change || 0).toFixed(2)}%`,
        sector: "Mercado Local"
      }));

    return NextResponse.json({
      dolar: { compra: b?.compra || 1350, venta: b?.venta || 1400 },
      euro: { compra: e?.compra || 1600, venta: e?.euro || 1650 },
      real: { compra: r?.compra || 250, venta: r?.real || 280 },
      bonds,
      stocks
    });

  } catch (error) {
    console.error("Error fetching quotes:", error);
    // Fallback response with realistic values to avoid division by zero or UI break
    return NextResponse.json({
      dolar: { compra: 1350, venta: 1400 },
      euro: { compra: 1600, venta: 1650 },
      real: { compra: 250, venta: 280 },
      bonds: [],
      stocks: []
    });
  }
}
