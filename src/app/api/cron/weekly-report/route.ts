import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

export const maxDuration = 300; // Allows cron job to run for up to 5 minutes

export async function GET(request: Request) {
  // Check Vercel Cron auth header (Security)
  if (
    process.env.CRON_SECRET &&
    request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // We allow manual execution without auth only in development
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    const client = await pool.connect();
    
    // Fetch latest market data locally calling our own endpoint logic
    // We simulate the fetch logic to reuse the robust API code
    let marketData: any = null;
    try {
      const headers = { 'User-Agent': 'NGA-App' };
      const fetchJson = async (url: string) => (await fetch(url, { headers, cache: 'no-store' })).json();
      
      const [b, e, r, s, bo] = await Promise.all([
        fetchJson("https://dolarapi.com/v1/dolares/blue").catch(() => null),
        fetchJson("https://dolarapi.com/v1/cotizaciones/eur").catch(() => null),
        fetchJson("https://dolarapi.com/v1/cotizaciones/brl").catch(() => null),
        fetchJson("https://data912.com/live/arg_stocks").catch(() => []),
        fetchJson("https://data912.com/live/arg_bonds").catch(() => [])
      ]);
      
      marketData = { dolar: b, euro: e, real: r, stocks: s, bonds: bo };
    } catch (e) {
      console.error("Cron failed to fetch market data", e);
      return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
    }

    try {
      // 1. Get all subscribers
      const result = await client.query('SELECT "Email" FROM "Subscriptions"');
      const subscribers = result.rows;

      if (subscribers.length === 0) {
        return NextResponse.json({ message: 'No subscribers found' });
      }

      // 2. Setup Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const buildEmailTemplate = (data: any, token: string) => {
        const unsubscribeUrl = `https://ngainversiones.com/api/unsubscribe?token=${token}`;
        const date = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
        const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val}%`;
        const getPctColor = (val: number) => val >= 0 ? '#10b981' : '#ef4444';

        const currencies = [
          { label: 'Dólar Blue', value: data.dolar?.venta },
          { label: 'Euro', value: data.euro?.venta },
          { label: 'Real', value: data.real?.venta }
        ];

        // Filter for most relevant stocks and bonds
        const mainStocks = ['GGAL', 'YPFD', 'PAMP', 'ALUA', 'BMA'];
        const filteredStocks = data.stocks?.filter((s: any) => mainStocks.includes(s.symbol)).slice(0, 5) || [];
        
        const mainBonds = ['AL30', 'GD30', 'AL29', 'AE38'];
        const filteredBonds = data.bonds?.filter((b: any) => mainBonds.includes(b.symbol)).slice(0, 5) || [];

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #2563eb; padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">NGA INVERSIONES</h1>
                  <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Reporte Semanal de Mercado</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: capitalize;">${date}</p>
                  
                  <!-- Divisas -->
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em;">💵 Divisas</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; background-color: #f1f5f9; border-radius: 12px;">
                    ${currencies.map(c => `
                      <tr>
                        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #475569; font-size: 14px; font-weight: 600;">${c.label}</span>
                        </td>
                        <td style="padding: 16px; text-align: right; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #0f172a; font-size: 16px; font-weight: 800;">$${c.value || 'N/A'}</span>
                        </td>
                      </tr>
                    `).join('').replace(/,$/, '')}
                  </table>

                  <!-- Acciones -->
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em;">📈 Acciones Líderes</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Ticker</th>
                      <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Precio</th>
                      <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Var %</th>
                    </tr>
                    ${filteredStocks.map((s: any) => `
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #0f172a; font-size: 14px; font-weight: 700;">${s.symbol}</span>
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #334155; font-size: 14px; font-weight: 600;">${formatCurrency(s.c)}</span>
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: ${getPctColor(s.pct_change)}; font-size: 14px; font-weight: 700;">${formatPct(s.pct_change)}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </table>

                  <!-- Bonos -->
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em;">🏛️ Bonos Soberanos</h2>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Bono</th>
                      <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Precio</th>
                      <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">Var %</th>
                    </tr>
                    ${filteredBonds.map((b: any) => `
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #0f172a; font-size: 14px; font-weight: 700;">${b.symbol}</span>
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: #334155; font-size: 14px; font-weight: 600;">${formatCurrency(b.c)}</span>
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                          <span style="color: ${getPctColor(b.pct_change)}; font-size: 14px; font-weight: 700;">${formatPct(b.pct_change)}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </table>

                  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
                      Este es un reporte automático de NGA Inversiones.<br>
                      Las cotizaciones son de carácter informativo.
                    </p>
                    <p style="margin-top: 16px;">
                      <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Desuscribirse</a>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
      };

      // 3. Send emails
      const emailPromises = subscribers.map(async (sub) => {
        const token = Buffer.from(sub.Email).toString('base64');
        const html = buildEmailTemplate(marketData, token);
        
        try {
          await transporter.sendMail({
            from: `"NGA Inversiones" <${process.env.SMTP_USER}>`,
            to: sub.Email,
            subject: "📊 NGA Reporte Semanal",
            html: html,
          });
        } catch (mailError) {
          console.error(`Failed to send email to ${sub.Email}:`, mailError);
        }
      });

      await Promise.all(emailPromises);

      return NextResponse.json({ success: true, sent: subscribers.length });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, detail: error.message }, { status: 500 });
  }
}
