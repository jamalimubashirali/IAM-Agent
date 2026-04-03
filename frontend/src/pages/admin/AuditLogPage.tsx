import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Terminal,
  Server,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  username: string;
  target: string;
  details: string;
  status: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/audit");
      setLogs(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Audit sequence synchronization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS") {
      return <CheckCircle2 className="h-3 w-3 mr-1.5" />;
    }
    return <XCircle className="h-3 w-3 mr-1.5" />;
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 min-h-[calc(100vh-120px)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Security Intelligence
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Real-time surveillance of system access and permission shifts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-6 py-2 border border-white/10 mr-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                Live Traffic
              </span>
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-ping" />
                Operational
              </span>
            </div>
          </div>
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="glass-card border-white/10 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl transition-all"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3 w-3 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Sequence
          </Button>
        </div>
      </header>

      <Card className="glass-card border-white/10 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-slate-400" />
              </div>
              <CardTitle className="text-lg font-bold text-white">
                Immutable Audit Trail
              </CardTitle>
            </div>

            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search action logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-11 bg-black/40 border-white/5 focus:ring-primary/20 h-11 rounded-xl text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-widest text-slate-500 pl-8">
                    Chronology
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Operation
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Subject
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Object
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Verification
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pr-8">
                    Manifest
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center gap-3"
                        >
                          <Server className="h-12 w-12 text-slate-800" />
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Terminal Silence - No Logs Found
                          </p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        key={log.id}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                      >
                        <TableCell className="font-mono text-[10px] text-slate-400 whitespace-nowrap pl-8">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-2 text-primary opacity-50" />
                            {format(
                              new Date(log.timestamp),
                              "yyyy.MM.dd | HH:mm:ss",
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-white/5 border-white/5 text-slate-200 uppercase tracking-widest text-[9px] font-black px-2 py-0.5 rounded-md"
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[9px] font-black text-primary">
                                {log.username[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-slate-200 text-xs font-bold">
                              {log.username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-slate-500 italic">
                          {log.target}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-none ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {getStatusIcon(log.status)}
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <span
                            className="text-[10px] text-slate-500 font-medium truncate inline-block max-w-[200px]"
                            title={log.details}
                          >
                            {log.details}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 px-4">
        <span>SHA-256 Verified Sequence</span>
        <span>SEC-AUDIT-V4.2</span>
      </footer>
    </div>
  );
}
