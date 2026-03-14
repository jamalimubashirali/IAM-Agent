import type { ElementType, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LogOut,
  ShieldCheck,
  Users,
  KeyRound,
  ScrollText,
  Home,
  UserCircle,
  Bot,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* Background ambient accents */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 hidden md:block">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-50 mix-blend-screen" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/60 backdrop-blur-xl z-10 flex flex-col h-auto md:h-screen sticky top-0 shadow-lg">
        <div className="p-5 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Access Studio
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NavItem to="/dashboard" icon={Home} label="Overview" />
          <NavItem to="/profile" icon={UserCircle} label="My Profile" />

          {isAdmin && (
            <div className="mt-8 space-y-1">
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Administration
              </div>
              <NavItem to="/admin/users" icon={Users} label="User Management" />
              <NavItem
                to="/admin/roles"
                icon={KeyRound}
                label="Role Management"
              />
              <NavItem to="/admin/audit" icon={ScrollText} label="Audit Logs" />

              <div className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
                <span>AI Operations</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
              </div>
              <NavItem
                to="/admin/hitl"
                icon={Activity}
                label="Pending Actions"
              />
              <NavItem to="/admin/assistant" icon={Bot} label="AI Assistant" />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border/50 bg-card/40 mt-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-slate-200 truncate leading-tight">
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-white border-border/50 hover:bg-white/5 transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen z-10 w-full">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

type NavItemProps = {
  to: string;
  icon: ElementType;
  label: string;
};

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-white/5 hover:text-slate-200",
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}
        <Icon
          className={cn(
            "h-4 w-4",
            isActive
              ? "text-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.5)] flex-shrink-0"
              : "text-muted-foreground group-hover:text-slate-300 flex-shrink-0",
          )}
        />
        <span className="truncate">{label}</span>
      </>
    )}
  </NavLink>
);

export default AppShell;
