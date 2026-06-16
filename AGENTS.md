# AI Agent Instructions - PsikoTest.id Enterprise

## 1. Project Overview
**Project Name:** PsikoTest.id Enterprise
**Type:** B2B SaaS (Software as a Service) for Psychological Assessments.
**Architecture:** Modern Serverless Stack (SSR-First).

You are acting as a Senior Full-Stack Engineer. Your primary goal is to build, refactor, and maintain this application following the strict architectural guidelines outlined below.

## 2. Tech Stack & Dependencies
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS, Lucide React (Icons).
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).
- **ORM/Migrations:** Drizzle ORM (STRICTLY for migrations, schema definition, and seeding ONLY).
- **Authentication:** NextAuth.js v4.
- **Client-Side Fetching:** SWR (Stale-While-Revalidate) for anti-delay, optimistic UI updates.
- **Background Jobs/Cache:** Upstash Ecosystem (Redis, QStash for scoring workflows, Realtime).
- **Storage:** Vercel Blob (for image/PDF uploads).
- **Payment Gateway:** Xendit (Invoice & Callbacks).
- **PDF Generation:** `@react-pdf/renderer`.

## 3. ABSOLUTE RULES (Do Not Break)
1. **Zero ORM for Queries:** You must NEVER use Drizzle ORM or Prisma to query, insert, update, or delete data in the application code. All database interactions inside `/app/api/route.ts` or Server Actions MUST use **RAW SQL** via the Neon serverless driver (`await sql\`SELECT * FROM... \``).
2. **SSR First, SWR Second:** Do not build this as a Single Page Application (SPA). Initial page loads must be Server-Side Rendered (SSR) passing fallback data. SWR is used on the client for subsequent mutations, polling, and revalidation.
3. **Language Boundary:** - All code (variable names, functions, file names, database tables/columns) MUST be in **English**.
   - All user-facing text (UI components, error messages, test instructions, PDF content) MUST be strictly in **Indonesian**.
4. **Database Schema Constraints:** - Use `BIGSERIAL` for primary keys. NO UUIDs.
   - Do NOT use PostgreSQL `ENUM`. Use `VARCHAR` with `CHECK` constraints instead.
   - Always implement proper indexing for high-traffic operations.
5. **Security & SEO & Route Prefixes:** - Root `/` (under `/app/(public)`) for the public website must be SEO optimized.
   - `/panel` (under `/app/(admin)/panel`) is for the Super Admin Panel.
   - `/clients` (under `/app/(client)/clients`) is for B2B Client Tenants.
   - `/clients/test` (under `/app/(test)/clients/test`) is for candidate test-taking pages.
   - All routes under `/panel` and `/clients` must be strictly secured behind NextAuth and hidden from search engines (`<meta name="robots" content="noindex, nofollow" />`).

## 4. Workflows & State Management
- **Test Scoring:** Test scoring is heavy. Do not process scoring synchronously on the client request. Offload the scoring calculation to **Upstash QStash** when the participant submits their test, and update the UI using SWR polling or Upstash Realtime.
- **Direct Pay-Per-Test Payments:** Payment workflows rely on Xendit webhooks. Ensure the `/api/webhooks/xendit` route safely verifies callback signatures before updating the `test_orders` status and crediting test quotas in `customer_test_quotas`.

When asked to generate or review code, explicitly check against these rules before providing your answer.