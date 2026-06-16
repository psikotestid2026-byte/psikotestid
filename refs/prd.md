# Product Requirements Document (PRD) - PsikoTest.id Integrated Platform

*Note: While this PRD is written in English for documentation purposes, the application's actual user interface, content, and test instruments will be entirely in Indonesian.*

## 1. Executive Summary
This document defines the product requirements for **PsikoTest.id Enterprise**, an integrated SaaS platform combining four main modules into a single ecosystem: **Web Company Profile** (public front-end at `/`), **Portal HR Client** (customer/institution dashboard at `/clients`), **Portal Super Admin** (platform management dashboard at `/panel`), and **Assessment Portal** (candidate test interface at `/clients/test`). This integration aims to create a seamless user flow from product discovery, self-registration, direct test quota purchasing, large-scale assessment operations, to candidate testing with a white-label identity.

---

## 2. Goals and Objectives
* **Sales Conversion:** Utilize the Web Company Profile as the primary acquisition funnel directing visitors to register and log in to the Portal HR Client.
* **Client Autonomy (Self-Service):** Empower HR Clients to independently purchase test quotas, generate test links, and customize their portal branding.
* **Centralized Control:** Provide Super Admins with full visibility and control over all customer orders, accounts, and core system configurations (test instruments & norms).
* **Professional Exam Experience:** Provide a smooth, stable test-taking interface that fully adapts to the client company's visual identity to look professional to candidates.

---

## 3. User Personas
1. **Public Visitor / Prospective Client:** Visitors looking for an automated psychological assessment solution (HR departments, schools, or independent psychologists) who access the Web Company Profile at `/`.
2. **HR Client / Customer:** Registered client admins responsible for purchasing specific test quotas, sending exam links, adjusting branding, and downloading candidate reports via the Portal HR Client at `/clients`.
3. **Super Admin / Platform Owner:** The main platform managers who handle master data, manage and verify payment orders, and monitor overall system health via the Portal Super Admin at `/panel`.
4. **Participant / Examinee:** Candidates or students accessing campaign-specific test links at `/clients/test/[campaignId]`; they do not require a login/password registration process, only needing to fill out their biodata to start the timed test.

---

## 4. Core Features Specification

### Module 1: Web Company Profile (Public Front-End at `/`)
Serves as the product storefront and user entry point.
* **Hero Section & Value Proposition:** Presents the main message about managing psychological assessments in one dashboard, along with trust metrics (e.g., number of clients, number of tests).
* **Workflow (How It Works):** Visual explanation of the 3-step platform usage: Purchase Test Quotas Directly ➔ Send Link ➔ Receive Automated Results.
* **Feature Showcase:** Explanations of flagship features like Custom Branding (White-label), Candidate Management, and PDF Reports.
* **Call-to-Action (CTA) & Authentication:** Direct buttons pointing to registration or login for the Portal HR Client (Admin) and Portal Super Admin.

### Module 2: Portal HR Client (Customer Dashboard at `/clients`)
Serves as an exclusive workspace for B2B clients.
* **Overview:** Widgets to monitor remaining test quotas (grouped by test types like WPT, DISC, PAPI), total completed participants, and currently active test sessions (campaigns).
* **Direct Quota Purchase System (Billing):** A module to purchase test quotas directly. HR Clients select the test types and the quantity they need, generate an order invoice, and pay directly via Xendit gateway (Virtual Account, QRIS, etc.) or upload manual bank transfer receipts. Upon payment confirmation, the test quotas are instantly credited to the customer's account.
* **Test Session Management (Campaigns):** A feature to create new test links by selecting a combination of standardized test instruments (such as DISC, WPT, PAPI) depending on available quotas.
* **Candidate Management & Reports:** Real-time participant list table with the ability to download and print Assessment Result PDF Reports automatically.
* **Branding Settings:** Facility to upload company logos and set primary theme colors so the participant test portal matches the client's identity.

### Module 3: Portal Super Admin (Platform Management at `/panel`)
Serves as the command and operational center for system owners.
* **System Overview:** Visibility into platform metrics such as total revenue, total clients, number of test submissions, and pending order approvals.
* **Customer & Order Management:** Client management table including active test quotas, billing order history, and manual invoice approval actions (Approve/Reject) for manual bank transfer orders.
* **Master Test & Question Bank Management (Bank Soal):** CRUD modules to add new test instruments, set price per test, duration, instructions, and edit JSON-formatted question items.
* **Norms & Scoring Configuration:** Interface to configure automated scoring formulas (e.g., Matching Key, Matrix, Vector) and upload norm data (converting raw scores to IQ/Psychological Labels) using CSV files.

### Module 4: Assessment Portal (Participant at `/clients/test`)
Serves as the test-taking interface for candidates.
* **White-label UI:** The portal interface dynamically changes to match the logo and primary color (brand color) of the inviting client company, removing prominent traces of the PsikoTest.id identity.
* **Frictionless Access:** Participants do not need to create accounts or memorize passwords; access utilizes a Campaign ID in the URL (`/clients/test/[campaignId]`) and validates data completeness via a Biodata form (Name & Email).
* **Progressive Stages:** Structured UI flow guiding participants from the Welcome Screen ➔ Biodata ➔ Exam Instructions ➔ Question Execution ➔ Next Test Transition ➔ Completion.
* **Timer Mechanism & Auto-Submit:** Includes a countdown timer (specifically for tests with time limits like WPT), which automatically locks and submits answers when time runs out.
* **Scoring Execution (Client/Server-Side) & Quota Deduction:** A scoring module that triggers instantly after the last test is completed, sending calculated results (raw and norm scores) directly to the database. Successful completion of a test automatically deducts 1 quota of the corresponding test type from the inviting client's available test quotas.

---

## 5. System Workflow
1. **Acquisition:** Visitors read product information on the **Web Company Profile** at `/` and click "Daftar Akun Corporate" (Register Corporate Account).
2. **Onboarding & Quota Purchase:** Clients log into the **Portal HR Client** at `/clients`, complete their company branding, and navigate to the purchase section. They select test instruments and quantities (e.g. 50 WPT, 50 DISC), and pay the generated invoice directly via Xendit.
3. **Verification:** The payment gateway automatically triggers a webhook callback upon successful transaction, changing the order status to PAID and instantly updating the client's test quotas. For manual transfer options, Super Admins verify payment inside the **Portal Super Admin** at `/panel` and manually approve the order to credit quotas.
4. **Distribution:** Clients in the **Portal HR Client** at `/clients` use their available test quotas to create an exam *Campaign* link and distribute it to candidate participants.
5. **Assessment Execution:** Candidates access the link at `/clients/test/[campaignId]`, enter the **Assessment Portal**, and see the white-labeled portal. Participants read instructions, complete the test within the time limit, and click submit.
6. **Results Processing:** Participant answers are calculated by the scoring engine (offloaded via Upstash QStash). Upon completion, 1 test quota is deducted from the client's quota ledger for each completed test. The PDF report is instantly available in the **Portal HR Client** for download.

---

## 6. Non-Functional Requirements (NFR)
* **Role-Based Access Control (RBAC):** The system must ensure strict access separation between public users, `customer` (HR Admin), `super_admin`, and `participant` (Examinee) starting from the authentication stage.
* **Data Privacy (Row Level Security):** Company data, test quotas, and candidate test results must be isolated using database-level RLS policies so HR Clients can only view their own data, and participants cannot access other participants' data.
* **Transaction Integrity:** Implementation of transaction locks (e.g., `FOR UPDATE` or atomic operations) in the database when checking and deducting test quotas upon exam completion to prevent double-deductions or quota overdrafts.
* **Exam UI Performance:** The **Assessment Portal** must be optimized to load question items rapidly (client-side rendering) to avoid loading delays that could unfairly penalize the participant's remaining exam time.