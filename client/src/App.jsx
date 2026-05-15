import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Navbar from '@/components/Navbar';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import CreatePoll from '@/pages/CreatePoll';
import EditPoll from '@/pages/EditPoll';
import PollDetail from '@/pages/PollDetail';
import PublicRespond from '@/pages/PublicRespond';
import AccountSettings from '@/pages/AccountSettings';
import NotFound from '@/pages/NotFound';
import AdminDashboard from '@/pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, requireAdmin }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/polls/create" element={<ProtectedRoute><CreatePoll /></ProtectedRoute>} />
      <Route path="/polls/:id" element={<ProtectedRoute><PollDetail /></ProtectedRoute>} />
      <Route path="/polls/:id/edit" element={<ProtectedRoute><EditPoll /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/respond/:shareId" element={<PublicRespond />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <SocketProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <AppRoutes />
              </div>
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}