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
        return `<html><body style='font-family:sans-serif;background:#f1f5f9;padding:20px'><div style='max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)'><div style='background:#2563eb;color:white;padding:30px;text-align:center'><h1 style='margin:0'>NGA INVERSIONES</h1><p>REPORTE SEMANAL</p></div><div style='padding:30px'><p>Cierre de mercado:</p><ul><li>Blue: $${data.dolar?.venta || 'N/A'}</li><li>Euro: $${data.euro?.venta || 'N/A'}</li><li>Real: $${data.real?.venta || 'N/A'}</li></ul><p style='margin-top:20px;font-size:12px;color:#64748b'>Para desuscribirte <a href='${unsubscribeUrl}'>haz click aquí</a>.</p></div></div></body></html>`;
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
