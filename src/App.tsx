import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import BottomNav from "./components/BottomNav";
import Index from "./pages/Index";
import CycleDiary from "./pages/CycleDiary";
import Habits from "./pages/Habits";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Conteudo from "./pages/Conteudo";
import Planos from "./pages/Planos";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground font-body">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground font-body">Carregando...</p></div>;

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/diario" element={<ProtectedRoute><CycleDiary /></ProtectedRoute>} />
        <Route path="/habitos" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
        <Route path="/comunidade" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/conteudo" element={<ProtectedRoute><Conteudo /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
