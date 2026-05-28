import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Page Imports
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterMarathon from './pages/RegisterMarathon';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import KanbanBoard from './pages/KanbanBoard';

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
    if (user.role === 'ORGANIZER') return <Navigate to="/admin" replace />;
    if (user.role === 'VOLUNTEER') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/5 transition-all duration-300">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-marathon" element={<RegisterMarathon />} />

          {/* Participant Protected Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['PARTICIPANT']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Organizer Protected Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ORGANIZER']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Volunteer Protected Route */}
          <Route 
            path="/volunteer" 
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'ORGANIZER']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Shared Kanban Board Protected Route */}
          <Route 
            path="/kanban" 
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'ORGANIZER']}>
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
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </AuthProvider>
    </Router>
  );
}
