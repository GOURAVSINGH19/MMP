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

Roles supported:

PARTICIPANT
ORGANIZER
VOLUNTEER

Protected APIs use:

JWT Authentication
Role-based middleware
Axios token interceptors
📂 Project Structure
MMP/
├── Backend/
│   ├── prisma/
│   └── src/
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

npx prisma generate
npx prisma db push

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
