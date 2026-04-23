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
      .filter((x: any) => targetS.includes(x.symbol))
      .map((x: any) => ({
        ticker: x.symbol,
        nombre: x.symbol,
        precio: x.c,
        variacion: `${x.pct_change >= 0 ? '+' : ''}${x.pct_change.toFixed(2)}%`,
        sector: "Mercado Local"
      }));

    return NextResponse.json({
      dolar: { compra: b?.compra || 0, venta: b?.venta || 0 },
      euro: { compra: e?.compra || 0, venta: e?.venta || 0 },
      real: { compra: r?.compra || 0, venta: r?.venta || 0 },
      bonds,
      stocks
    });

  } catch (error) {
    console.error("Error fetching quotes:", error);
    // Fallback response if everything fails
    return NextResponse.json({
      dolar: { compra: 0, venta: 0 },
      euro: { compra: 0, venta: 0 },
      real: { compra: 0, venta: 0 },
      bonds: [],
      stocks: []
    }, { status: 500 });
  }
}
