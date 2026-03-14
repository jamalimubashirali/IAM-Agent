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
} from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import React from "react";

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

/**
 * Pick icon styles based on the audit action / status so the activity feed
 * feels contextual and matches the premium dark aesthetic.
 */
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
      iconBg: "bg-blue-500/10",
      iconBorder: "border-blue-500/20",
      iconColor: "text-blue-500",
      Icon: Users,
    };
  return {
    iconBg: "bg-primary/10",
    iconBorder: "border-primary/20",
    iconColor: "text-primary",
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

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const { data } = await api.get<DashboardStats>("/dashboard/stats");
        setStats(data);
      } catch {
        // Non-critical – metrics will just stay null
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch last 5 audit log entries for the activity feed
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Greeting */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              {user?.username}
            </span>
          </h1>
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
            Online
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Here is an overview of your identity and system access.
        </p>
      </div>

      {isAdmin ? (
        <>
          {/* Admin Metrics Row */}
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              title="Total Active Users"
              value={statsLoading ? "…" : (stats?.totalUsers ?? "–")}
              trend={statsLoading ? "" : stats ? "Live count" : "Unavailable"}
              icon={Users}
              color="text-blue-400"
              bgColor="bg-blue-400/10"
              borderColor="border-blue-400/20"
              glow="hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]"
              isLoading={statsLoading}
            />
            <MetricCard
              title="System Roles"
              value={statsLoading ? "…" : (stats?.totalRoles ?? "–")}
              trend={statsLoading ? "" : stats ? "Configured" : "Unavailable"}
              icon={KeyRound}
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
              borderColor="border-emerald-400/20"
              glow="hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
              isLoading={statsLoading}
            />
            <MetricCard
              title="Pending AI Actions"
              value={statsLoading ? "…" : (stats?.pendingActions ?? "–")}
              trend={
                statsLoading
                  ? ""
                  : stats?.pendingActions
                    ? "Requires attention"
                    : "All clear"
              }
              icon={Activity}
              color="text-amber-400"
              bgColor="bg-amber-400/10"
              borderColor="border-amber-400/20"
              glow="hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]"
              pulse={!!stats?.pendingActions}
              isLoading={statsLoading}
            />
          </div>

          {/* Activity Feed */}
          <div className="mt-8">
            <h2 className="text-lg font-medium tracking-tight mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Recent System Activity
            </h2>
            <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-xl">
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Loading activity…
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground text-sm">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {recentLogs.map((log) => {
                      const style = resolveLogStyle(log);
                      return (
                        <div
                          key={log.id}
                          className="p-5 flex items-start gap-4 hover:bg-white/5 transition-colors"
                        >
                          <div
                            className={`mt-1 flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center border ${style.iconBg} ${style.iconBorder}`}
                          >
                            <style.Icon
                              className={`h-4 w-4 ${style.iconColor}`}
                            />
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                              <span className="uppercase tracking-wider text-[11px] font-mono opacity-60">
                                {log.action}
                              </span>
                              {log.status === "FAILURE" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-destructive border-destructive/20 bg-destructive/10"
                                >
                                  FAILED
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {log.details}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              {log.username}
                              {log.target && log.target !== log.username && (
                                <>
                                  {" "}
                                  →{" "}
                                  <span className="font-mono">
                                    {log.target}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {humanTime(log.timestamp)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Standard User View */
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-xl overflow-hidden group hover:border-primary/30 transition-all">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Profile Identity
              </CardTitle>
              <CardDescription>Your registered account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 flex flex-col">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Email Address
                </p>
                <p className="text-sm font-medium text-slate-200 bg-background/50 p-2 rounded-md border border-border inline-block">
                  {user?.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Assigned Roles
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user?.roles?.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="bg-primary/5 border-primary/20 text-primary py-1 px-3"
                    >
                      {role.replace("ROLE_", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-border/50 shadow-xl overflow-hidden text-center flex flex-col items-center justify-center p-8 opacity-70">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">
              You do not have administrative access to the system. Contact an
              admin for further privileges.
            </p>
          </Card>
        </div>
      )}
    </div>
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
      className={`bg-card/40 backdrop-blur-md border ${borderColor} shadow-lg transition-all duration-300 ${glow} relative overflow-hidden group`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100`}
      />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3
                className={`text-3xl font-bold text-slate-100 tracking-tight ${
                  isLoading ? "animate-pulse opacity-40" : ""
                }`}
              >
                {value}
              </h3>
            </div>
          </div>
          <div
            className={`h-11 w-11 rounded-xl ${bgColor} flex items-center justify-center border ${borderColor} shadow-inner`}
          >
            <Icon
              className={`h-5 w-5 ${color} ${pulse ? "animate-pulse" : ""}`}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-muted-foreground">
          <span className={`${color} font-medium mr-2`}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
