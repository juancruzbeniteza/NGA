import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ success: false, message: 'Token requerido' }, { status: 400 });
  }

  try {
    const email = Buffer.from(token, 'base64').toString('utf-8');

    if (!email.includes('@')) {
      throw new Error('Token inválido');
    }

    const client = await pool.connect();

    try {
      const res = await client.query('DELETE FROM "Subscriptions" WHERE "Email" = $1 RETURNING *', [email]);
      
      const successHtml = `
        <html>
        <body style='font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; margin: 0;'>
            <div style='background: white; padding: 50px; border-radius: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; max-width: 440px;'>
                <div style='color: #2563eb; font-size: 64px; margin-bottom: 24px;'>✓</div>
                <h1 style='color: #1e293b; margin-bottom: 12px; font-size: 24px; font-weight: 800;'>Desuscripción Exitosa</h1>
                <p style='color: #64748b; line-height: 1.6; font-size: 16px;'>Ya no recibirás nuestros reportes semanales en <b>${email}</b>.</p>
                <a href='/' style='display: inline-block; margin-top: 32px; background: #2563eb; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;'>Volver a NGA</a>
            </div>
        </body>
        </html>
      `;

      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Unsubscribe Error:', error);
    return NextResponse.json({ success: false, message: 'Error procesando solicitud' }, { status: 400 });
  }
}
