🏃 Marathon Management Portal (MMP)

A full-stack platform for managing marathon registrations, participant verification, BIB allocation, QR scanning, and finisher certificate generation.

✨ Core Features
Multi-step runner registration
Organizer approval workflow
Attendance confirmation
QR-based BIB verification
Volunteer scanning dashboard
Finisher certificate generation
Email notifications & PDF delivery
Role-based dashboards (Participant / Organizer / Volunteer)
📌 Runner Lifecycle
🏗️ Architecture Overview
🛠️ Tech Stack
Frontend
React 19
Vite
Tailwind CSS
React Router
React Hook Form + Zod
Axios
TanStack Table
Recharts
html5-qrcode
Backend
Node.js
Express.js
Prisma ORM
PostgreSQL
JWT Authentication
bcryptjs
PDFKit
QRCode
Resend
🔐 Authentication & RBAC

<<<<<<< HEAD
## 🚀 Key Features

*   **📋 Multi-Step Runner Registration:** A smooth, wizard-based onboarding experience.
*   **👥 Role-Based Dashboards:** Custom user interfaces for **Participants**, **Organizers**, and **Volunteers**.
*   **🔍 QR-Based BIB Verification:** Instant ticket scanning and check-in via camera.
*   **📧 Automated Email Workflows:** Triggered notifications for registrations, approvals, and certificates.
*   **🎓 Certificate Generation:** Dynamically generated PDF finisher certificates with custom statistics.

---

## 🏛️ System Architecture

### 📊 Application Lifecycle Flow
Roles supported:

PARTICIPANT
ORGANIZER
VOLUNTEER

Protected APIs use:

### 🔁 Data Flow Sequence

```mermaid
sequenceDiagram
    participant Runner as Runner / Participant
    participant Scanner as Volunteer Scanner
    participant Admin as Organizer / Admin
    participant FE as React Frontend (Vite)
    participant BE as Express Backend (Node.js)
    participant DB as PostgreSQL Database (Prisma)
    participant Resend as Email Provider (Resend)

    %% Registration & Onboarding
    Runner->>FE: Fills Multi-step Registration Wizard
    FE->>BE: POST /auth/register & POST /participant/register
    BE->>DB: Save User & Registration Info
    BE->>Resend: Trigger Welcome Email (w/ Credentials)
    Resend-->>Runner: Deliver Email
    BE-->>FE: Return JWT & Registration Details

    %% Approval
    Admin->>FE: Review & Approve Runner
    FE->>BE: POST /admin/approve/:id (Auth: JWT Bearer)
    BE->>DB: Update status to APPROVED
    BE->>Resend: Trigger Registration Approved Email
    Resend-->>Runner: Deliver Email
    BE-->>FE: Success response

    %% Confirmation
    Runner->>FE: Confirm Attendance
    FE->>BE: POST /participant/confirm (Auth: JWT Bearer)
    BE->>DB: Update status to CONFIRMED
    BE-->>FE: Success response

    %% BIB Allocation
    Admin->>FE: Assign BIB Number & QR Code
    FE->>BE: POST /admin/allocate-bib (Auth: JWT Bearer)
    BE->>DB: Generate QR code & update status to BIB_ALLOCATED
    BE->>Resend: Trigger BIB & QR Code Email
    Resend-->>Runner: Deliver Email
    BE-->>FE: Success response

    %% Scan verification
    Scanner->>FE: Scan QR at counter (html5-qrcode)
    FE->>BE: POST /volunteer/scan-bib (Auth: JWT Bearer)
    BE->>DB: Verify BIB, log ScanLog, update status to BIB_COLLECTED
    BE-->>FE: Return Verification Status (Success/Fail)

    %% Finisher Certificates
    Admin->>FE: Submit Finish Time & Stats
    FE->>BE: POST /admin/complete-race (Auth: JWT Bearer)
    BE->>DB: Save Finish Stats, update status to COMPLETED
    BE->>BE: Generate Finisher Certificate (PDFKit)
    BE->>Resend: Trigger Completion Email with Certificate PDF Attachment
    Resend-->>Runner: Deliver Email
    BE-->>FE: Success response
    Runner->>FE: Download PDF Certificate
    FE->>BE: GET /certificate/download/:id
    BE-->>Runner: Serve Certificate PDF
```

---

## 🛠️ Tech Stack & Key Libraries

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 19** | User interface & views |
| | **Vite 8** | Rapid development build system |
| | **Tailwind CSS v4** | Modern styling |
| | **React Router v7** | Routing & path protection |
| | **Zod & React Hook Form** | Form handling & validation |
| | **TanStack Table** | Data tables & filtering |
| | **html5-qrcode** | QR scan functionality |
| **Backend** | **Node.js & Express** | Server & REST APIs |
| | **Prisma ORM** | PostgreSQL database mapper |
| | **PostgreSQL** | Primary relational database |
| | **JWT & bcryptjs** | Authentication & RBAC |
| | **PDFKit** | Finisher certificate PDF generation |
| | **Resend SDK** | System email delivery & alerts |

---

## 🔒 Security & Access Control

*   **Role-Based Dashboards:** Route protection matches permissions dynamically depending on role (`PARTICIPANT`, `ORGANIZER`, `VOLUNTEER`).
*   **Axios Interceptors:** Automatic insertion of JWT Bearer tokens to all outbound API calls.
*   **Secure Storage:** Salted and hashed passwords using `bcryptjs`.

---

## 📁 Repository Structure

```text
=======
JWT Authentication
Role-based middleware
Axios token interceptors
📂 Project Structure
>>>>>>> 6888c592a4e48dc44c026f27241eb0ffc9a1ccc1
MMP/
├── Backend/
│   ├── prisma/
│   └── src/
<<<<<<< HEAD
│       ├── controllers/       # Controller logic (Auth, Reg, Tasks, Certificates)
│       ├── middleware/        # Authentication & Role validation middlewares
│       ├── routes/            # Express route groups
│       ├── services/          # Emailing (Resend) & PDF Generation (PDFKit)
│       └── server.js          # Express server setup & entry point
└── Frontend/                  # React + Vite + Tailwind Frontend
    ├── src/
    │   ├── components/        # Reusable UI elements (Layouts, Modals, Tables)
    │   ├── context/           # Auth and App state contexts
    │   ├── pages/             # Page views (Landing, Dashboards, Registration Wizard)
    │   ├── services/          # API Axios configuration
    │   └── index.css          # Styling & Tailwind configuration
    └── index.html             # Single Page HTML entry point
```
=======
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
│
├── Frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── services/
🚀 Local Setup
Backend
cd Backend
npm install
>>>>>>> 6888c592a4e48dc44c026f27241eb0ffc9a1ccc1

npx prisma generate
npx prisma db push

<<<<<<< HEAD
## 🚀 Local Installation & Setup

### 1️⃣ Backend Setup
1. **Navigate to the directory**:
   ```bash
   cd Backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root of the `Backend/` directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/mmp_db?schema=public"
   JWT_SECRET="your-super-secret-key"
   RESEND_API_KEY="re_..."
   PORT=5000
   ```
4. **Database Migration**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

### 2️⃣ Frontend Setup
1. **Navigate to the directory**:
   ```bash
   cd ../Frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
4. **Open application**:
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.
npm run dev

Create .env:

DATABASE_URL=
JWT_SECRET=
RESEND_API_KEY=
Frontend
cd Frontend
npm install
npm run dev

Open:

http://localhost:5173
📧 Automated Workflows

The system automatically handles:

Welcome emails
Approval notifications
BIB QR emails
Certificate generation
Finisher completion emails
>>>>>>> 6888c592a4e48dc44c026f27241eb0ffc9a1ccc1
