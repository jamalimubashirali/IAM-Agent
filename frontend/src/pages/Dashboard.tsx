import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  KeyRound,
  Activity,
  UserCircle,
  ShieldCheck,
  Clock,
  Zap,
  RefreshCw,
  ArrowUpRight,
  Fingerprint,
  Globe,
} from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  totalRoles: number;
  pendingActions: number;
}

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  username: string;
  target: string;
  details: string;
  status: "SUCCESS" | "FAILURE";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveLogStyle(log: AuditLog) {
  const a = log.action.toLowerCase();
  if (log.status === "FAILURE")
    return {
      iconBg: "bg-destructive/10",
      iconBorder: "border-destructive/20",
      iconColor: "text-destructive",
      Icon: ShieldCheck,
    };
  if (a.includes("login"))
    return {
      iconBg: "bg-blue-500/10",
      iconBorder: "border-blue-500/20",
      iconColor: "text-blue-400",
      Icon: UserCircle,
    };
  if (a.includes("role") || a.includes("permission"))
    return {
      iconBg: "bg-amber-500/10",
      iconBorder: "border-amber-500/20",
      iconColor: "text-amber-400",
      Icon: Activity,
    };
  if (a.includes("register") || a.includes("user"))
    return {
      iconBg: "bg-primary/10",
      iconBorder: "border-primary/20",
      iconColor: "text-primary",
      Icon: Users,
    };
  return {
    iconBg: "bg-slate-500/10",
    iconBorder: "border-slate-500/20",
    iconColor: "text-slate-400",
    Icon: Activity,
  };
}

function humanTime(ts: string): string {
  try {
    return format(new Date(ts), "MMM dd, HH:mm");
  } catch {
    return ts;
  }
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      // duration: 0.4, ease: [0.22, 1, 0.36, 1] 
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      try {
        const { data } = await api.get<DashboardStats>("/dashboard/stats");
        setStats(data);
      } catch {
        // Non-critical
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchLogs = async () => {
      try {
        const { data } = await api.get<AuditLog[]>("/audit");
        setRecentLogs(data.slice(0, 5));
      } catch {
        setRecentLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchStats();
    fetchLogs();
  }, [isAdmin]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10"
    >
      {/* Greeting Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-white/5"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              System Console
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-mono"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_8px_var(--primary)]" />
              v2.4.1 LIVE
            </Badge>
          </div>
          <p className="text-slate-400 font-medium">
            Authorized session for{" "}
            <span className="text-primary font-bold">{user?.username}</span>
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Node Status
            </span>
            <span className="text-sm text-emerald-400 font-mono flex items-center gap-2">
              <Globe className="w-3 h-3" />
              US-EAST-1
            </span>
          </div>
        </div>
      </motion.div>

      {isAdmin ? (
        <>
          {/* Admin Metrics Row */}
          <motion.div
            variants={itemVariants}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <MetricCard
              title="Active Directory Users"
              value={statsLoading ? "…" : (stats?.totalUsers ?? "–")}
              trend="+12% this month"
              icon={Users}
              color="text-blue-400"
              bgColor="bg-blue-400/5"
              borderColor="border-blue-400/20"
              glow="hover:shadow-[0_0_40px_rgba(96,165,250,0.15)]"
              isLoading={statsLoading}
            />
            <MetricCard
              title="Identity Roles"
              value={statsLoading ? "…" : (stats?.totalRoles ?? "–")}
              trend="Policy compliant"
              icon={Fingerprint}
              color="text-primary"
              bgColor="bg-primary/5"
              borderColor="border-primary/20"
              glow="hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
              isLoading={statsLoading}
            />
            <MetricCard
              title="Neural Audit Tasks"
              value={statsLoading ? "…" : (stats?.pendingActions ?? "–")}
              trend={
                statsLoading
                  ? ""
                  : stats?.pendingActions
                    ? "Attention required"
                    : "No drift detected"
              }
              icon={Activity}
              color="text-amber-400"
              bgColor="bg-amber-400/5"
              borderColor="border-amber-400/20"
              glow="hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]"
              pulse={!!stats?.pendingActions}
              isLoading={statsLoading}
            />
          </motion.div>

          {/* Main Content Area */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Activity Feed */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center text-white">
                  <Zap className="w-5 h-5 mr-3 text-primary fill-primary/30" />
                  Live Audit Stream
                </h2>
                <Button
                  variant="link"
                  className="text-xs text-primary/80 hover:text-primary font-bold uppercase tracking-widest"
                >
                  View Full Logs
                </Button>
              </div>

              <Card className="glass-card overflow-hidden border-white/5 ring-1 ring-white/5">
                <CardContent className="p-0">
                  {logsLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-16 text-slate-400 font-medium">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      Decrypting logs...
                    </div>
                  ) : recentLogs.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 font-medium whitespace-pre-wrap">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      Zero system drift recorded in current session.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {recentLogs.map((log) => {
                        const style = resolveLogStyle(log);
                        return (
                          <div
                            key={log.id}
                            className="p-6 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group"
                          >
                            <div
                              className={`mt-1 flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border ${style.iconBg} ${style.iconBorder} transition-transform group-hover:scale-110`}
                            >
                              <style.Icon
                                className={`h-5 w-5 ${style.iconColor}`}
                              />
                            </div>
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-white flex items-center gap-3">
                                  <span className="uppercase tracking-widest text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-300">
                                    {log.action}
                                  </span>
                                  {log.status === "FAILURE" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-black text-white border-destructive bg-destructive/60 animate-pulse"
                                    >
                                      CRITICAL FAILURE
                                    </Badge>
                                  )}
                                </p>
                                <div className="text-[10px] font-mono text-slate-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1.5" />
                                  {humanTime(log.timestamp)}
                                </div>
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed italic">
                                "{log.details}"
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <UserCircle className="w-3 h-3 text-slate-600" />
                                <p className="text-[11px] font-bold text-slate-500">
                                  {log.username}
                                  {log.target &&
                                    log.target !== log.username && (
                                      <>
                                        <span className="mx-2 text-slate-700">
                                          →
                                        </span>
                                        <span className="text-primary/70">
                                          {log.target}
                                        </span>
                                      </>
                                    )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions / System Health */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-white">
                System Guard
              </h2>
              <Card className="glass-card border-emerald-500/10 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">
                    Auto-Defense
                  </span>
                  <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold">
                    ARMED
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>RESOURCE LOAD</span>
                      <span>14%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "14%" }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>LATENCY (P99)</span>
                      <span>24ms</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "42%" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
                <Button className="w-full glass-button bg-primary/20 hover:bg-primary/30 border-primary/20 text-primary font-bold text-xs tracking-widest uppercase py-6">
                  Execute Security Audit
                </Button>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 p-6 flex items-center gap-4 group cursor-pointer hover:bg-white/[0.04] transition-all">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Rotate Keys</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Last rotated 4 days ago
                  </p>
                </div>
                <ArrowUpRight className="ml-auto w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            </motion.div>
          </div>
        </>
      ) : (
        /* Standard User View */
        <motion.div
          variants={itemVariants}
          className="grid gap-8 md:grid-cols-2"
        >
          <Card className="glass-card relative group overflow-hidden border-primary/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            <CardHeader className="pb-8 border-b border-white/5">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <UserCircle className="h-6 w-6 text-primary" />
                Identity Profile
              </CardTitle>
              <CardDescription className="text-slate-500">
                Your cryptographic credentials and roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  Verified Identity
                </p>
                <p className="text-lg font-bold text-white bg-white/5 px-4 py-3 rounded-xl border border-white/5 flex items-center justify-between">
                  {user?.email}
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  Assigned Capabilities
                </p>
                <div className="flex flex-wrap gap-3">
                  {user?.roles?.map((role) => (
                    <Badge
                      key={role}
                      className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 px-4 py-1.5 rounded-lg text-xs font-bold tracking-tight"
                    >
                      {role.replace("ROLE_", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="h-20 w-20 rounded-3xl bg-slate-900/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-slate-700" />
            </div>
            <h4 className="text-xl font-bold mb-2">Restricted Access</h4>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium">
              This environment is currently restricted to standard user
              operations. Elevated admin panels are disabled for this session.
            </p>
            <Button
              variant="outline"
              className="mt-8 glass-button border-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest"
            >
              Request Privilege Elevation
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glow: string;
  pulse?: boolean;
  isLoading?: boolean;
};

function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  glow,
  pulse,
  isLoading,
}: MetricCardProps) {
  return (
    <Card
      className={`glass-card border ${borderColor} transition-all duration-500 ${glow} relative overflow-hidden group`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none transition-opacity opacity-40 group-hover:opacity-100`}
      />
      <CardContent className="p-8 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                className={`text-4xl font-bold text-white tracking-tighter ${
                  isLoading ? "animate-pulse opacity-20" : ""
                }`}
              >
                {value}
              </h3>
            </div>
          </div>
          <div
            className={`h-12 w-12 rounded-2xl ${bgColor} flex items-center justify-center border ${borderColor} shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}
          >
            <Icon
              className={`h-6 w-6 ${color} ${pulse ? "animate-pulse" : ""}`}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-[11px] font-bold tracking-tight">
            <span
              className={`${color} group-hover:translate-x-1 transition-transform`}
            >
              {trend}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-800 opacity-20 group-hover:opacity-40 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}
