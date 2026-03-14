import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  RefreshCw,
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

/**
 * Derive a risk level from the tool name so the UI can colour-code cards.
 * The tool names match what is registered inside the Spring AI @Tool methods.
 */
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
  // Convert camelCase / snake_case tool name to a human title
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
      return "text-red-400 bg-red-400/10 border-red-500/20";
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

  // ── Fetch pending actions ──────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<PendingAction[]>("/actions/pending");
      setActions(data);
      // Auto-select first if nothing is selected or selected is gone
      setSelectedId((prev) =>
        prev && data.some((a) => a.id === prev) ? prev : (data[0]?.id ?? null),
      );
    } catch {
      toast.error("Failed to load pending actions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── SSE: live push of new pending actions ──────────────────────────────────
  useEffect(() => {
    fetchPending();

    // EventSource cannot carry Authorization headers; the backend has this
    // endpoint open. It only pushes a notification (no sensitive payload), so
    // the actual data is always fetched via the secured REST call.
    const token = localStorage.getItem("token");
    // We append the token as a query param for the SSE endpoint because
    // EventSource doesn't support custom headers; WebSecurityConfig allows it.
    const sseUrl = `http://localhost:8080/api/hitl/stream${token ? `?token=${token}` : ""}`;

    const es = new EventSource(sseUrl);

    es.addEventListener("hitl-action", () => {
      // A new action was paused — refresh the list and notify admin.
      toast.info("🔔 New AI action is awaiting your approval", {
        description: "Check the Pending Actions dashboard.",
      });
      fetchPending();
    });

    es.onerror = () => {
      // SSE connection dropped — not fatal, fall back to manual refresh.
    };

    sseRef.current = es;
    return () => {
      es.close();
    };
  }, [fetchPending]);

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/actions/${id}/approve`);
      toast.success("Action approved and executed successfully");
      fetchPending();
    } catch {
      toast.error("Failed to approve action");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/actions/${id}/reject`);
      toast.info("Action rejected — no changes were applied");
      fetchPending();
    } catch {
      toast.error("Failed to reject action");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Pending AI Actions
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve sensitive operations requested by the AI agent
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPending}
            disabled={isLoading}
            className="bg-background/50 border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Live monitor indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            Live Monitoring
          </div>
        </div>
      </div>

      {/* Main layout: list + detail pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* ── Left pane: action list ────────────────────────────────────────── */}
        <div className="col-span-1 border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm overflow-y-auto w-full flex flex-col p-2 space-y-2 relative shadow-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <RefreshCw className="h-8 w-8 animate-spin opacity-40" />
              <p className="text-sm">Loading actions…</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <CheckCircle2 size={48} className="mb-4 text-emerald-500/50" />
              <p className="font-medium text-lg">All caught up!</p>
              <p className="text-sm mt-1">
                There are no pending actions requiring your attention.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {actions.map((action) => {
                const risk = deriveRiskLevel(action.toolName);
                return (
                  <motion.div
                    key={action.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all border ${
                        selectedId === action.id
                          ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                          : "bg-background/40 border-border/40 hover:bg-white/5 hover:border-white/10"
                      }`}
                      onClick={() => setSelectedId(action.id)}
                    >
                      <CardContent className="p-4 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-foreground text-sm truncate pr-2">
                            {deriveTitle(action.toolName)}
                          </h3>
                          {risk === "critical" && (
                            <ShieldAlert
                              size={14}
                              className="text-red-400 flex-shrink-0"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase px-1.5 py-0 rounded ${getRiskColor(risk)}`}
                          >
                            {risk}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center">
                            <Clock size={10} className="mr-1" />
                            {format(new Date(action.createdAt), "MMM dd HH:mm")}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground truncate">
                          {action.description}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── Right pane: action detail ─────────────────────────────────────── */}
        <div className="col-span-1 lg:col-span-2 flex flex-col h-full bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-2xl relative">
          {!selectedAction ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
              Select an action from the list to view details
            </div>
          ) : (
            (() => {
              const risk = deriveRiskLevel(selectedAction.toolName);
              const isPending = selectedAction.status === "PENDING";
              const isProcessing = processingId === selectedAction.id;
              return (
                <>
                  {/* Ambient glow for critical actions */}
                  {risk === "critical" && (
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
                  )}

                  {/* Detail header */}
                  <div className="p-6 border-b border-border/50 bg-background/30 backdrop-blur-sm z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-semibold text-foreground">
                            {deriveTitle(selectedAction.toolName)}
                          </h2>
                          <Badge
                            variant="outline"
                            className={`uppercase px-2 py-0.5 rounded-sm font-semibold tracking-wider ${getRiskColor(risk)}`}
                          >
                            {risk} RISK
                          </Badge>
                          {!isPending && (
                            <Badge
                              variant="outline"
                              className={
                                selectedAction.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }
                            >
                              {selectedAction.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm">
                          {selectedAction.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Triggered:{" "}
                          {format(
                            new Date(selectedAction.createdAt),
                            "MMM dd, yyyy HH:mm:ss",
                          )}
                          {selectedAction.chatId && (
                            <>
                              {" "}
                              &nbsp;·&nbsp; Session:{" "}
                              <code className="font-mono">
                                {selectedAction.chatId}
                              </code>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payload viewer */}
                  <div className="flex-1 overflow-y-auto p-6 z-10 bg-black/20">
                    <div className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle size={16} /> JSON Payload
                    </div>
                    <div className="bg-[#0d1117] border border-border/60 rounded-xl overflow-hidden shadow-inner">
                      <div className="flex px-4 py-2 border-b border-white/5 bg-white/5">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                      </div>
                      <pre className="p-5 text-sm text-slate-300 overflow-x-auto font-mono">
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
                                '<span class="text-blue-400">"$1"</span>:',
                              )
                              .replace(
                                /"(.*?)"(,|(?=\n|\r))/g,
                                '<span class="text-emerald-400">"$1"</span>$2',
                              )
                              .replace(
                                /\b(true|false)\b/g,
                                '<span class="text-orange-400">$1</span>',
                              )
                              .replace(
                                /\b(\d+)\b/g,
                                '<span class="text-purple-400">$1</span>',
                              ),
                          }}
                        />
                      </pre>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-md z-10 flex gap-4">
                    <Button
                      onClick={() => handleReject(selectedAction.id)}
                      disabled={!isPending || isProcessing}
                      variant="outline"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-12 text-base transition-all"
                    >
                      <XCircle className="mr-2 h-5 w-5" /> Reject Request
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedAction.id)}
                      disabled={!isPending || isProcessing}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] h-12 text-base font-semibold transition-all"
                    >
                      {isProcessing ? (
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                      )}
                      Approve Action
                    </Button>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
