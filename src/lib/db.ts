import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1 // Vercel best practices for Serverless functions
});

export default pool;
