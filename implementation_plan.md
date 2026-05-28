# Marathon Management Portal (MMP) — Full-Stack Implementation Plan

This implementation plan covers the end-to-end development of the **Marathon Management Portal (MMP)**. The portal is designed as a premium, highly interactive web application for participants, organizers, and volunteers to seamlessly manage a marathon event.

We will follow the **strictly required Build Order** across all 9 phases, leveraging modern UI aesthetics (sleek dark mode, harmonious tailwind-based color schemes, smooth glassmorphism, micro-animations) and a robust TypeScript-based Express backend.

---

## User Review Required

Before we proceed, please review the following architectural and credential details:

> [!IMPORTANT]
> **Database Syncing & Prisma Client:**
> The Neon PostgreSQL database URL is already configured in the backend's `.env`. We will update `schema.prisma` to change the `Status` enum from `CERTIFICATE_ISSUED` to `COMPLETED` so it matches the required status tracking enum exactly. We will run `npx prisma db push` to synchronize this with Neon DB.

> [!IMPORTANT]
> **Resend Email API Key:**
> For Phase 8 (Notifications), we will use the **Resend** service to send professional email notifications (welcome credentials, approval notification, BIB assignment, and certificate delivery). You will need to add a `RESEND_API_KEY` to the Backend's `.env` file. We will provide a fallback mock email logger so that development and local testing work seamlessly even without an active Resend key.

---

## Open Questions

### 1. Marathon Registration Flow (Recommended Option Proposed)
*   **Proposed Flow:** The landing page of the application will be a beautiful, modern **Event Showcase & Registration Form**. 
*   When a user submits the registration form, the backend:
    1. Automatically creates a `User` account for them with a secure, random password (or a user-defined password).
    2. Stores the marathon registration under the `Registration` model with status `REGISTERED`.
    3. Sends their login credentials (email & password) and registration summary to their email via Resend.
    4. Logs them in automatically, redirecting them to their new **Participant Dashboard**.
*   *Please let us know if you prefer this seamless automated registration flow, or a traditional "Register Account -> Login -> Fill Marathon Form" sequence.*

---

## Proposed Changes & Architecture

### Folder Structure Alignment

We will strictly adhere to the recommended folder structures:

#### Frontend Structure (`Frontend/src/`)
```
src/
 ├── pages/       # Login, Register, Landing, ParticipantDashboard, OrganizerDashboard, VolunteerDashboard, KanbanBoard
 ├── components/  # Tracker, Navbar, Table, QRScanner, CertificateButton, TaskCard
 ├── layouts/     # MainLayout, AuthLayout, AdminLayout
 ├── services/    # api.js (axios setup), auth.service.js, registration.service.js, admin.service.js
 ├── hooks/       # useAuth.js, useQrScanner.js
 ├── context/     # AuthContext.jsx
 └── utils/       # helpers.js, formatters.js
```

#### Backend Structure (`Backend/src/`)
```
src/
 ├── routes/       # auth.routes.ts, participant.routes.ts, admin.routes.ts, task.routes.ts, volunteer.routes.ts
 ├── controllers/  # auth.controller.ts, participant.controller.ts, admin.controller.ts, task.controller.ts, volunteer.controller.ts
 ├── middleware/   # auth.middleware.ts, role.middleware.ts
 ├── services/     # email.service.ts, pdf.service.ts, qr.service.ts
 ├── prisma/       # client.ts (re-exporting from generated/prisma)
 ├── utils/        # logger.ts
 └── templates/    # emailTemplates.ts
```

---

## Step-by-Step Build Order

We will build the phases sequentially as requested. Below is the technical plan for each phase:

### 1. Database Update & Backend Initialization
*   Initialize the `Backend` as a pure **JavaScript (Node.js ES Modules)** project:
    *   Create `package.json` with `"type": "module"`.
    *   Install backend dependencies: `express`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `@prisma/client`, `pdfkit`, `qrcode`, `resend`, `nodemon`.
*   Update `Backend/prisma/schema.prisma` to align the `Status` enum exactly:
    ```prisma
    enum Status {
      REGISTERED
      APPROVED
      CONFIRMED
      BIB_COLLECTED
      COMPLETED
    }
    ```
*   Update the Prisma client by running `npx prisma generate` and execute `npx prisma db push` to apply the status enum update to the Neon DB.

### Phase 2: Authentication
*   **Backend (JavaScript ES Modules):**
    *   Implement user registration (`POST /auth/register`) and login (`POST /auth/login`).
    *   Passwords securely hashed using `bcryptjs`.
    *   JWT Tokens signed with standard secret, containing user ID, email, and role.
    *   Create authentication middleware (`authenticateJWT`) and role-based access control middleware (`requireRole('ORGANIZER')` / `requireRole('VOLUNTEER')`).
*   **Frontend:**
    *   Implement `AuthContext` to manage JWT token storage, user state, and role-based page protection.
    *   Design a stunning **Login** and **Register** page using **shadcn/ui** design patterns, featuring custom gradients, floating glassmorphic panels, and smooth micro-animations.

### Phase 3: Registration System
*   **Backend (JavaScript ES Modules):**
    *   Implement `POST /participant/register` or handle creation directly during sign-up. Stores marathon-specific details: `distance` (5K, 10K, 21K, 42K), `tshirtSize` (S, M, L, XL, XXL), `emergencyName`, `emergencyPhone`.
    *   Generate a random password if registering for the first time, save the participant as a `User` (role `PARTICIPANT`) and create their `Registration` entry.
    *   Send credentials and welcome details via email.
*   **Frontend:**
    *   Create an engaging, multi-step **Marathon Registration Form** using **shadcn/ui** components (e.g. Card, Input, Label, Select, Button) with Zod validation.
    *   Redirect newly registered participants directly to their dynamic dashboard.

### Phase 4: Participant Status Tracker
*   **Backend:**
    *   `GET /participant/status/:id`: Returns registration status, BIB details, finish time, and certificate URL.
    *   `POST /participant/confirm`: Allows the participant to self-confirm their attendance after approval (sets status to `CONFIRMED`).
*   **Frontend:**
    *   Design a visually stunning **Progress Tracker** showing step-by-step progress: `REGISTERED` ➔ `APPROVED` ➔ `CONFIRMED` ➔ `BIB_COLLECTED` ➔ `COMPLETED`.
    *   Status bubbles glow with custom CSS shadows (green/violet) and connect with smooth status bars.
    *   **BIB Display:** Animated electronic bib card showcasing the assigned BIB number, participant name, and the event category.
    *   **Confirm Button:** Interactive action button with subtle pulse effect, active only when status is `APPROVED`.
    *   **Certificate Button:** Sleek download action button that queries the certificate endpoint when status is `COMPLETED`.

### Phase 5: Organizer Dashboard
*   **Backend:**
    *   `GET /admin/participants`: Return all participants with their users and registration data.
    *   `POST /admin/assign-bib`: Endpoint to assign a BIB number, change status to `CONFIRMED` (or `APPROVED` -> `CONFIRMED`), generate QR code, and send confirmation email.
    *   `POST /admin/finish-time`: Enters marathon finish time, changes status to `COMPLETED`, triggers certificate generation, and emails the certificate.
*   **Frontend:**
    *   Build a **Sleek Metric Cards Grid** showing: Total Registrations, Pending Approvals, Volunteers, Finishers.
    *   **Registrations Table:** Integrated with search, category filtering, and status filtering.
    *   **Actions:**
        *   *Approve:* One-click registration approval.
        *   *Assign BIB:* Open a glassmorphic modal to enter the BIB number (automatically triggers QR creation).
        *   *Enter Finish Time:* Modal to record marathon timings (e.g., `01:45:23`).

### Phase 6: QR Code System
*   **Backend:**
    *   When BIB is assigned, generate a QR code containing `participant_id + bib_number`.
    *   We will generate a **Base64 Data URI** using the `qrcode` library on the backend and store it directly in the database (`bibQrUrl`). This eliminates external image hosting dependencies and guarantees fast, reliable loads!
    *   `POST /volunteer/scan`: Verify BIB scanned, update status to `BIB_COLLECTED` (or `COMPLETED` depending on context), and log the scan in the `ScanLog` database table.
*   **Frontend (Volunteer/Staff Interface):**
    *   Integrate `html5-qrcode` to access the camera.
    *   On a successful scan, call the backend update API and display a sleek success toast or visual animation (green confirmation ring).

### Phase 7: Certificate Generation
*   **Backend:**
    *   Use `pdfkit` to generate a gorgeous, high-resolution PDF certificate dynamically.
    *   The certificate will feature elegant border flourishes, a modern typography layout (e.g., Helvetica/Helvetica-Bold), and customized parameters (Participant's Name, distance category, official finish time, and event date).
    *   `GET /certificate/:participantId`: Returns the generated PDF directly as a stream with the correct content headers (`application/pdf`) so it opens beautifully in the browser.

### Phase 8: Notifications
*   **Backend Services:**
    *   Configure the `Resend` service client.
    *   Design clean, modern, responsive HTML email templates:
        1.  **Registration Success:** "Welcome to the Marathon! Here are your account credentials..."
        2.  **Registration Approved:** "Your registration has been approved! Log in to confirm your spot."
        3.  **BIB & QR Assigned:** "Your BIB is ready! Show this QR code at the bib collection counter." (Includes embedded BIB and QR image).
        4.  **Certificate Ready:** "Congratulations on finishing the marathon! Your certificate is attached." (PDF attached directly).

### Phase 9: Task Management (Kanban Board)
*   **Backend:**
    *   Add `Task` and `TaskAssignment` models.
    *   `GET /tasks`, `POST /tasks`, `PUT /tasks/:id` (for updating columns/details), `DELETE /tasks/:id`.
*   **Frontend:**
    *   Create a premium **Kanban Board** with columns: `Todo`, `In Progress`, and `Done`.
    *   Implement smooth dragging and dropping using HTML5 Drag and Drop APIs or `@dnd-kit/core` with absolute ease and modern glassmorphic task cards.
    *   Allows organizers to create/assign tasks, and volunteers to move their assigned tasks to `Done`.

### Phase 10: Volunteer Dashboard
*   **Frontend:**
    *   A custom simplified dashboard tailored for volunteers logged into their accounts.
    *   **Assigned Tasks Panel:** A clean checklist of the volunteer's assigned tasks.
    *   **Scanner Interface:** Fast access to the camera scanner to check in participants at the bib counter or finish line.
    *   **Scan Logs:** Quick history list of participants they have checked in.

---

## Verification Plan

### Automated Verification
1.  **Backend API Tests:**
    *   Launch the Express server: `npm run dev` in `Backend`.
    *   Run test HTTP requests (we will create a test script or use axios checks) to verify Auth endpoints, Role protection, Registration endpoints, and PDF Certificate response.
2.  **Database Inspection:**
    *   Verify User, Registration, and Task tables contain appropriate data using Prisma Studio (`npx prisma studio`).

### Manual UX Verification
1.  **Authenticating Users:** Test logging in as a Participant, Organizer, and Volunteer, verifying that access control redirects unauthorized roles.
2.  **Marathon Registration & Credentials:** Submit a marathon registration, verify credentials are created, and check the mock email log (or actual Resend email) to ensure credentials and BIB updates are sent.
3.  **Progress Tracker and BIB Card:** Ensure status changes in the DB update the tracker seamlessly with smooth animations.
4.  **Volunteer QR Scanning:** Simulate QR code scans with the camera or by pasting QR data, verifying status changes to `BIB_COLLECTED` and logs are created in `ScanLog`.
5.  **Kanban Board Drag & Drop:** Test moving cards between Todo, In Progress, and Done, verifying column status remains synchronized on reload.
