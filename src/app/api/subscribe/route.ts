import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Email inválido' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Create table if not exists (fail-safe)
      await client.query(`
        CREATE TABLE IF NOT EXISTS "Subscriptions" (
          "Id" SERIAL PRIMARY KEY,
          "Email" TEXT NOT NULL UNIQUE
        );
      `);

      // Check if exists
      const checkRes = await client.query('SELECT 1 FROM "Subscriptions" WHERE "Email" = $1', [email]);
      
      if (checkRes.rowCount && checkRes.rowCount > 0) {
        return NextResponse.json({ success: true, message: 'Ya estás suscrito' });
      }

      // Insert
      await client.query('INSERT INTO "Subscriptions" ("Email") VALUES ($1) ON CONFLICT DO NOTHING', [email]);
      
      return NextResponse.json({ success: true, message: 'Suscripción exitosa' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Subscription Error:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor', detail: error.message }, { status: 500 });
  }
}
