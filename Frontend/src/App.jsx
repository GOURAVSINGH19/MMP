import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Page Imports
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterMarathon from './pages/RegisterMarathon';
import EventsRouter from './pages/EventsRouter';
import EventDetail from './pages/EventDetail';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import KanbanBoard from './pages/KanbanBoard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaytmPayment from './pages/PaytmPayment';
import PaymentResult from './pages/PaymentResult';

// Protected Route Component to restrict access by role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check failed -> Redirect to their matching portal
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/admin" replace />;
    if (user.role === 'VOLUNTEER') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const FULL_BLEED_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

function AppContent() {
  const { pathname } = useLocation();
  const isFullBleed = FULL_BLEED_PATHS.some((p) => pathname === p || pathname.startsWith('/reset-password'));

  return (
    <div className={`min-h-screen text-slate-900 transition-all duration-300 ${isFullBleed && pathname === '/' ? 'bg-brand-dark' : 'mesh-bg'}`}>
      <Navbar />
      <main className={isFullBleed ? 'w-full' : 'max-w-6xl mx-auto px-4 py-6'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-marathon" element={<RegisterMarathon />} />
          <Route path="/events" element={<EventsRouter />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Participant Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/paytm-checkout/:paymentId" 
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <PaytmPayment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment-result" 
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <PaymentResult />
              </ProtectedRoute>
            } 
          />

          {/* Organizer Protected Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Volunteer Protected Route */}
          <Route 
            path="/volunteer" 
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Shared Kanban Board Protected Route */}
          <Route 
            path="/kanban" 
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN']}>
                <KanbanBoard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </AuthProvider>
    </Router>
  );
}
