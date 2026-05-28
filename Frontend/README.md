# Metropolis Marathon Portal (MMP) — Frontend

Welcome to the frontend application for the **Marathon Management Portal (MMP)**. This client app is built with a modern React tech stack and structured using premium Tailwind CSS utility layers and Shadcn UI design patterns.

---

## 🚀 Features

- **Multi-Step Participant Registration**: A 3-step registration wizard for runners to submit profiles, choose race category/t-shirt sizes, and configure emergency contacts.
- **Dynamic Status Tracker**: Visually tracks participant statuses (`REGISTERED` ➔ `APPROVED` ➔ `CONFIRMED` ➔ `BIB_COLLECTED` ➔ `COMPLETED`).
- **Organizer Admin Panel**: Admin controls to approve entries, assign BIBs, generate check-in QR codes, input finish times, and view registration stats.
- **Volunteer Check-in Scanner**: Camera-based QR Code scanner interface powered by `html5-qrcode` to mark BIB collection and finish-line stamps.
- **Kanban Task Board**: HTML5 Drag-and-Drop kanban task board to assign and update organizer tasks.
- **PDF Certificate Downloader**: Download beautiful race completion certificates generated on the fly.
- **Toast Notifications**: Interactive toast messaging integrated using `react-toastify`.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom `@tailwindcss/vite` plugin
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Form Management & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Notifications**: [React Toastify](https://github.com/fkhadra/react-toastify)
- **Charts**: [Recharts](https://recharts.org/)

---

## 📦 Directory Structure

```text
Frontend/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ui/             # Custom Shadcn-like components (Button, Input, Card, Select)
│   │   ├── Navbar.jsx      # Navigation Bar with Role-Aware items
│   │   └── QRScanner.jsx   # Scanner wrapper using html5-qrcode
│   ├── context/
│   │   └── AuthContext.jsx # JWT Authenticator State
│   ├── pages/              # Portal view routes
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── RegisterMarathon.jsx
│   │   ├── ParticipantDashboard.jsx
│   │   ├── OrganizerDashboard.jsx
│   │   ├── VolunteerDashboard.jsx
│   │   └── KanbanBoard.jsx
│   ├── services/
│   │   └── api.js          # Pre-configured Axios instance with Authorization headers
│   ├── App.jsx             # Main router configuration & Toast notifications
│   ├── index.css           # CSS variables & Tailwind directive
│   └── main.jsx            # Application entry point
├── package.json
└── vite.config.js          # Vite config bundling Tailwind CSS v4
```

---

## 🏁 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* Running MMP Backend instance on `http://localhost:3000`

### Installation

1. Install frontend project dependencies:
   ```bash
   npm install
   ```

2. Run the development server locally:
   ```bash
   npm run dev
   ```
   *The server runs by default on [http://localhost:5173](http://localhost:5173)*

### Building for Production

To compile and optimize the assets for production deployment:
```bash
npm run build
```
The output bundle will be generated under the `dist/` folder.

---

## 🎨 UI Guidelines & Design Tokens

MMP uses a custom styling theme in `src/index.css` configured on top of Tailwind CSS v4:
* **Neutrals**: Soft light background `bg-slate-50/50` with high contrast dark mode alternatives.
* **Component Outlines**: Input elements and Cards include a premium `ring-1 ring-black/10` (or `dark:ring-white/10` in dark mode) to simulate the clean look and feel of modern Shadcn UI components.
* **Notifications**: Global alerts use React Toastify rather than standard browser dialogs.
