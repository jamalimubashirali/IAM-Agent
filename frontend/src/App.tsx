import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/admin/UsersPage";
import RolesPage from "@/pages/admin/RolesPage";
import AuditLogPage from "@/pages/admin/AuditLogPage";
import AIChatPage from "@/pages/admin/AIChatPage";
import PendingActionsPage from "@/pages/admin/PendingActionsPage";
import ProfilePage from "@/pages/ProfilePage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/layout/AppShell";

const ProtectedLayout = ({ requiredRole }: { requiredRole?: string }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const hasToken = isAuthenticated || !!localStorage.getItem("token");

  if (!hasToken) {
    const loginPath = location.pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
    return <Navigate to={loginPath} replace />;
  }

  if (requiredRole && user && !user.roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route element={<ProtectedLayout requiredRole="ROLE_ADMIN" />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
            <Route path="/admin/hitl" element={<PendingActionsPage />} />
            <Route path="/admin/assistant" element={<AIChatPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
