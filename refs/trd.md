# Technical Requirements Document (TRD) - PsikoTest.id Enterprise

## 1. Executive Summary & Localization Policy
This Technical Requirements Document (TRD) outlines the architectural guidelines, technology stack, and engineering standards for building the **PsikoTest.id Enterprise** platform. 

**STRICT LOCALIZATION RULE:** While this technical documentation and the underlying codebase (variables, database schemas, API routes) are written in English, **the application's actual User Interface (UI), textual content, PDF reports, and test instruments will be entirely in Indonesian.**

---

## 2. Architectural Paradigm
The platform utilizes **The Modern Serverless Stack** designed for high-traffic, multi-tenant B2B environments. 
* **Server-Side Rendering (SSR) First:** The application is explicitly NOT a Single Page Application (SPA). It leverages Next.js SSR to ensure immediate HTML delivery, faster First Contentful Paint (FCP), and optimal SEO for the public-facing pages at `/`.
* **Anti-Delay State Management:** Initial page loads are served via SSR, while subsequent client-side mutations and re-fetching rely strictly on **SWR** (Stale-While-Revalidate) to provide a zero-loading, hyper-fast, and highly responsive user experience.
* **Reusable Component Architecture:** The UI is constructed using modular, atomic, and highly reusable components to maintain consistency across the Web Profile, Client Portal, Super Admin Portal, and Assessment Portal.

---

## 3. Technology Stack & Dependencies
* **Framework:** Next.js (App Router).
* **Deployment:** Vercel (Edge & Serverless Functions).
* **Authentication:** `next-auth` (v4) for secure, session-based access control.
* **Payment Gateway:** Xendit (for direct pay-per-test quota order generation and webhook-based payment verification).
* **Object Storage:** Vercel Blob (for client logos, manual payment transfer proofs, and PDF reports).
* **Image Optimization:** `next/image` strictly used for all media assets to guarantee optimized delivery.
* **Key Package Dependencies:**
    * `swr`: For lightning-fast client-side data fetching and caching.
    * `recharts`: For rendering statistical charts in the HR Client and Super Admin dashboards.
    * `@react-pdf/renderer` or `jspdf`: For generating dynamic psychological PDF reports.
    * `xlsx`: For parsing norm data imports (CSV/Excel) in the Super Admin portal.
    * `@tiptap/react`: Headless rich-text editor for managing test instructions and question content.
    * `@dnd-kit/core`: For drag-and-drop interfaces (e.g., reordering question bank items).
    * `katex` & `react-latex`: For rendering complex mathematical or logical formulas within test questions.

---

## 4. Database Strategy & Strict Rules
The database architecture is built for extreme performance and absolute raw control.
* **Database:** Neon Serverless PostgreSQL.
* **Driver Strictness:** The application must strictly use the `@neondatabase/serverless` driver for all database connections.
* **Drizzle ORM Limitation Rule:** Drizzle ORM is **ONLY** authorized for schema definitions, running migrations, and database seeding. 
* **Zero-ORM Query Rule:** There will be absolutely no ORM usage for application queries. All CRUD operations must use **RAW SQL** parameterized queries utilizing the Neon driver.
* **API Route Isolation:** Every database model must have its own dedicated API route handler inside `/app/api/[model]/route.ts`. All raw SQL queries must be encapsulated within these route handlers.

---

## 5. Upstash Ecosystem Integration
To handle the asynchronous nature of scoring and real-time operations, the platform heavily leverages the Upstash ecosystem:
* **Upstash Redis:** Serves as the primary caching layer for master tests, active campaign configurations, and session validation to reduce hits on the Neon Postgres database during high-concurrency exams.
* **Upstash Workflow (QStash):** Orchestrates background jobs, particularly the scoring engine logic. When a participant submits a test, the calculation is offloaded to Upstash Workflow to ensure the main server remains non-blocking and resilient under heavy loads.
* **Upstash Realtime:** Used for pushing real-time updates to the HR Portal (e.g., instantly updating the candidate status table from "Running" to "Completed" the moment the Upstash Workflow finishes scoring).

---

## 6. Project Directory Structure (Next.js App Router)
The application follows a strictly segregated namespace and routing prefix layout to enforce clean separation of concerns and distinct visual boundaries:

* **`/`** (Public Frontend) ➔ Accessible without subfolder prefixes. Under `/app/(public)`.
* **`/panel`** (Superadmin Management Portal) ➔ Under `/app/(admin)/panel`.
* **`/clients`** (Tenant HR Dashboard) ➔ Under `/app/(client)/clients`.
* **`/clients/test`** (Assessment Interface) ➔ Under `/app/(test)/clients/test`.

```text
/
├── app/
│   ├── (public)/                 # Public Web Company Profile
│   │   ├── page.tsx              # Landing Page at / (SEO Optimized)
│   │   └── pricing/page.tsx      # Pricing Page at /pricing
│   ├── (admin)/                  # Superadmin Portal (NOINDEX)
│   │   └── panel/                # Superadmin Dashboard at /panel
│   │       ├── page.tsx
│   │       ├── tests/page.tsx
│   │       └── orders/page.tsx
│   ├── (client)/                 # Tenant Client Portal (NOINDEX)
│   │   └── clients/              # Client Dashboard at /clients
│   │       ├── page.tsx
│   │       ├── campaigns/page.tsx
│   │       └── billing/page.tsx
│   ├── (test)/                   # Candidate Test Interface (NOINDEX)
│   │   └── clients/
│   │       └── test/             # Test Taking Page at /clients/test
│   │           └── [campaignId]/page.tsx
│   ├── api/                      # Raw SQL API Route Handlers
│   │   ├── customers/route.ts
│   │   ├── campaigns/route.ts
│   │   ├── participants/route.ts
│   │   ├── test_results/route.ts
│   │   ├── test_orders/route.ts
│   │   └── webhooks/             # Xendit & Upstash callbacks
│   │       ├── xendit/route.ts
│   │       └── upstash/route.ts
│   └── layout.tsx
├── components/                   # Reusable UI Components
│   ├── ui/                       # Buttons, Inputs, Modals
│   ├── charts/                   # Recharts wrappers
│   └── assessment/               # DnD, KaTeX wrappers
├── db/                           # Drizzle Migrations & Seeders ONLY
│   ├── schema.ts
│   ├── seed.ts
│   └── migrations/
└── lib/
    ├── neon.ts                   # Raw SQL Neon Driver Instance
    ├── xendit.ts
    ├── upstash.ts
    └── swr-fetcher.ts
```