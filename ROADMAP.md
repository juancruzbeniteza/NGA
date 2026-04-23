# ROADMAP: Next.js Migration

## Phase 1: Initialization 
- [ ] Create Next.js App Router project.
- [ ] Setup Tailwind CSS, Framer Motion, and Three.js dependencies.

## Phase 2: Frontend Migration
- [ ] Port UI components (`Hero`, `MarketInsights`, `Quotes`, `ChatAssistant`).
- [ ] Migrate pages to `app/page.tsx`, `app/mercado/page.tsx`, etc.
- [ ] Move `public` assets (images, 3D models).

## Phase 3: Backend & API Migration
- [ ] Create Route Handlers: `app/api/quotes/route.ts` (Fetch dolarapi & data912).
- [ ] Create Route Handlers: `app/api/subscribe/route.ts` & `app/api/unsubscribe/route.ts`.
- [ ] Setup Supabase Client for Serverless DB interactions.

## Phase 4: Weekly Reports & Cron
- [ ] Setup `app/api/cron/weekly-report/route.ts`.
- [ ] Configure `vercel.json` for Cron Jobs.
- [ ] Setup Nodemailer/Resend for email delivery.

## Phase 5: Testing & Cutover
- [ ] Verify local build.
- [ ] Deploy to Vercel.
- [ ] Decommission old Render and .NET backend.
