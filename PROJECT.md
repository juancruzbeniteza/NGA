# PROJECT: NGA Inversiones (Next.js Migration)

## 1. Vision & Core Purpose
NGA Inversiones is a high-fidelity financial platform for a 65-year-old firm in Rosario, Argentina. It provides real-time market data and an automated weekly market closing report system for subscribers.

## 2. Technical Stack (NEW)
- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling & UI:** Tailwind CSS 4, Framer Motion, Three.js (R3F/Drei).
- **Backend/API:** Next.js Route Handlers (`app/api/...`).
- **Database:** Supabase REST API or Vercel Postgres (Serverless friendly).
- **Email:** Resend or Nodemailer for weekly reports.
- **Infrastructure:** Vercel (Hosting, Edge Functions, Vercel Cron for Friday 17:00 reports).

## 3. Architecture & Data Flow
1. **Unified App:** Frontend and Backend coexist in the Next.js App Router.
2. **Serverless APIs:** The `/api/quotes` and `/api/subscribe` endpoints run as serverless functions on Vercel.
3. **Database:** Direct connection from Vercel to Supabase (bypassing Render's IPv4 limits) using Supabase JS Client or Prisma.
4. **Cron Jobs:** `vercel.json` configures a cron job to hit `/api/cron/weekly-report` every Friday at 17:00.

## 4. Current State
- Migrating from separated .NET 8 (Render) + Vite React (Vercel) to unified Next.js (Vercel).
