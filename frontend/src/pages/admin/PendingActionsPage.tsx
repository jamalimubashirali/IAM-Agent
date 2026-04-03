import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Cpu,
  Zap,
  Eye,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStatus = "PENDING" | "APPROVED" | "REJECTED";

interface PendingAction {
  id: number;
  toolName: string;
  description: string;
  payloadJson: string;
  status: ActionStatus;
  chatId: string | null;
  requestedByUserId: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low";

function deriveRiskLevel(toolName: string): RiskLevel {
  const t = toolName.toLowerCase();
  if (t.includes("admin") || t.includes("assignrole") || t.includes("role"))
    return "critical";
  if (t.includes("delete") || t.includes("deactivate") || t.includes("disable"))
    return "high";
  if (t.includes("update") || t.includes("create") || t.includes("password"))
    return "medium";
  return "low";
}

function deriveTitle(toolName: string): string {
  return toolName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\btool\b/gi, "")
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case "critical":
      return "text-red-400 bg-red-400/10 border-red-500/20 shadow-red-500/5";
    case "high":
      return "text-orange-400 bg-orange-400/10 border-orange-500/20";
    case "medium":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-500/20";
    case "low":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-500/20";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PendingActionsPage() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const selectedAction = actions.find((a) => a.id === selectedId) ?? null;

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<PendingAction[]>("/actions/pending");
      setActions(data);
      setSelectedId((prev) =>
        prev && data.some((a) => a.id === prev) ? prev : (data[0]?.id ?? null),
      );
    } catch {
      toast.error("Failed to sync pending operations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const token = localStorage.getItem("token");
    const sseUrl = `http://localhost:8080/api/hitl/stream${token ? `?token=${token}` : ""}`;
    const es = new EventSource(sseUrl);

    es.addEventListener("hitl-action", () => {
      toast.info("Awaiting System Override", {
        description: "New AI operation triggered HITL pause.",
      });
      fetchPending();
    });

    sseRef.current = es;
    return () => es.close();
  }, [fetchPending]);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/actions/${id}/approve`);
      toast.success("Command Authorized", {
        description: "Action executed via system kernel.",
      });
      fetchPending();
    } catch {
      toast.error("Authorization Failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/actions/${id}/reject`);
      toast.info("Command Vetoed", {
        description: "Override suppressed. No changes applied.",
      });
      fetchPending();
    } catch {
      toast.error("Veto Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              HITL Command Center
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Human-in-the-Loop gateway for sensitive AI-driven operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPending}
            disabled={isLoading}
            className="glass-button border-white/10 text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync Buffer
          </Button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Live Feedback
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Pane */}
        <div className="col-span-1 glass-card border-white/10 rounded-2xl flex flex-col overflow-hidden bg-black/20 shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Pending Sequence
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                <RefreshCw className="h-10 w-10 animate-spin opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  Synchronizing...
                </span>
              </div>
            ) : actions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center p-6"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500/60" />
                </div>
                <p className="font-bold text-white uppercase tracking-widest text-xs mb-1">
                  Queue Empty
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  All commands have been processed
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {actions.map((action, idx) => {
                  const risk = deriveRiskLevel(action.toolName);
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <button
                        className={`w-full text-left transition-all relative overflow-hidden rounded-xl border p-4 group ${
                          selectedId === action.id
                            ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                        }`}
                        onClick={() => setSelectedId(action.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getRiskColor(risk)}`}
                          >
                            {risk}
                          </span>
                          <span className="text-[9px] font-mono text-slate-600">
                            ID-{action.id.toString().padStart(3, "0")}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm mb-1 group-hover:text-white transition-colors">
                          {deriveTitle(action.toolName)}
                        </h4>
                        <div className="flex items-center text-[10px] text-slate-500 font-medium">
                          <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                          {format(
                            new Date(action.createdAt),
                            "HH:mm:ss | MMM dd",
                          )}
                        </div>
                        {selectedId === action.id && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute left-0 bottom-0 top-0 w-0.5 bg-primary"
                          />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Pane */}
        <div className="col-span-1 lg:col-span-2 glass-card border-white/10 rounded-2xl flex flex-col overflow-hidden bg-black/40 shadow-3xl">
          {!selectedAction ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <Eye className="h-16 w-16 text-slate-700 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Select Operation to Inspect
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAction.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full"
              >
                <div className="p-8 border-b border-white/5 bg-white/[0.03] relative overflow-hidden">
                  {deriveRiskLevel(selectedAction.toolName) === "critical" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                          {deriveTitle(selectedAction.toolName)}
                        </h2>
                        <Badge
                          variant="outline"
                          className={`border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 ${getRiskColor(deriveRiskLevel(selectedAction.toolName))}`}
                        >
                          {deriveRiskLevel(selectedAction.toolName)} Risk
                          Manifest
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-medium text-lg leading-snug max-w-2xl">
                        {selectedAction.description}
                      </p>
                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">
                            Temporal Origin
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {format(
                              new Date(selectedAction.createdAt),
                              "MMMM dd, yyyy · HH:mm:ss",
                            )}
                          </span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">
                            Session ID
                          </span>
                          <span className="text-xs font-mono text-primary">
                            {selectedAction.chatId || "DIRECT_EXEC"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShieldAlert
                        className={`h-8 w-8 ${deriveRiskLevel(selectedAction.toolName) === "critical" ? "text-red-500 animate-pulse" : "text-slate-500"}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Payload Inspection
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-700">
                      JSON_v1.0
                    </span>
                  </div>

                  <div className="flex-1 bg-[#050505] rounded-3xl border border-white/5 overflow-hidden shadow-inner relative group">
                    <div className="absolute top-0 left-0 right-0 h-10 bg-white/[0.03] flex items-center px-6 border-b border-white/5">
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                      </div>
                    </div>
                    <div className="h-full pt-10 overflow-auto p-8 custom-scrollbar">
                      <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-slate-400">
                        <code
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              try {
                                return JSON.stringify(
                                  JSON.parse(selectedAction.payloadJson),
                                  null,
                                  2,
                                );
                              } catch {
                                return selectedAction.payloadJson;
                              }
                            })()
                              .replace(
                                /"(.*?)":/g,
                                '<span class="text-primary/80">"$1"</span>:',
                              )
                              .replace(
                                /"(.*?)"(,|(?=\n|\r))/g,
                                '<span class="text-emerald-500/80">"$1"</span>$2',
                              )
                              .replace(
                                /\b(true|false)\b/g,
                                '<span class="text-amber-500">$1</span>',
                              )
                              .replace(
                                /\b(\d+)\b/g,
                                '<span class="text-primary/60">$1</span>',
                              ),
                          }}
                        />
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
                  <Button
                    onClick={() => handleReject(selectedAction.id)}
                    disabled={
                      selectedAction.status !== "PENDING" ||
                      processingId === selectedAction.id
                    }
                    variant="outline"
                    className="flex-1 h-14 bg-white/5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-black uppercase tracking-widest text-xs transition-all rounded-2xl"
                  >
                    <XCircle className="mr-3 h-5 w-5" /> Veto Sequence
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedAction.id)}
                    disabled={
                      selectedAction.status !== "PENDING" ||
                      processingId === selectedAction.id
                    }
                    className="flex-[1.5] h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all rounded-2xl"
                  >
                    {processingId === selectedAction.id ? (
                      <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                    ) : (
                      <Zap className="mr-3 h-5 w-5 fill-current" />
                    )}
                    Authorize Execution
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
