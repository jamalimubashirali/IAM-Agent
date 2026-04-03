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
  ChevronRight,
  Terminal,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-[#020203] text-foreground flex flex-col md:flex-row relative selection:bg-primary/30">
      {/* Dynamic Background System */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Sidebar - The Control Column */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 backdrop-blur-3xl z-20 flex flex-col h-auto md:h-screen sticky top-0 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="p-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-black text-xl tracking-tighter text-white uppercase italic">
                Studio<span className="text-primary italic">.</span>IAM
              </p>
              <div className="flex items-center gap-1.5 opacity-40">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Node_Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-4 pb-12 px-4 space-y-1 relative z-10 custom-scrollbar">
          <div className="px-4 mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            Core Terminal
          </div>
          <NavItem to="/dashboard" icon={Home} label="Overview" />
          <NavItem to="/profile" icon={UserCircle} label="Identity Profile" />

          {isAdmin && (
            <div className="mt-10 space-y-1">
              <div className="px-4 mb-4 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
                  Governance
                </span>
                <Terminal size={10} className="text-slate-700" />
              </div>
              <NavItem to="/admin/users" icon={Users} label="Entity Registry" />
              <NavItem
                to="/admin/roles"
                icon={KeyRound}
                label="Security Policies"
              />
              <NavItem
                to="/admin/audit"
                icon={ScrollText}
                label="Audit Sequence"
              />

              <div className="mt-10 mb-4 px-4 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
                  Intelligence
                </span>
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </div>
              </div>
              <NavItem
                to="/admin/hitl"
                icon={Activity}
                label="System Override"
              />
              <NavItem to="/admin/assistant" icon={Bot} label="Neural Proxy" />
            </div>
          )}
        </nav>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 mt-auto relative z-10">
          <div className="flex items-center gap-4 mb-6 px-2 group cursor-pointer">
            <div className="relative">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:border-primary/50 transition-colors overflow-hidden">
                {user?.username?.charAt(0).toUpperCase() || "U"}
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/20 transition-colors" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-black border border-white/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-black text-white truncate tracking-tight uppercase leading-none mb-1">
                {user?.username}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-bold tracking-tight">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full h-12 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl border border-transparent hover:border-red-500/20 transition-all group"
          >
            <LogOut className="h-4 w-4 mr-3 group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Deployment Deck */}
      <main className="flex-1 flex flex-col min-h-screen z-10 w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 flex items-center gap-6 pointer-events-none opacity-20">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Kernel_Status
            </span>
            <span className="text-[10px] font-mono text-emerald-500">
              STABLE_V4
            </span>
          </div>
          <Cpu size={24} className="text-slate-600" />
        </div>

        <div className="flex-1 overflow-auto p-6 md:p-12 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto w-full h-full">{children}</div>
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
        "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 group relative overflow-hidden",
        isActive
          ? "bg-primary/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)] border border-primary/20"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent",
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 transition-all duration-300",
            isActive
              ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
              : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110",
          )}
        />
        <span className="flex-1">{label}</span>
        {!isActive && (
          <ChevronRight
            size={12}
            className="opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all"
          />
        )}
      </>
    )}
  </NavLink>
);

export default AppShell;
