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
  ScrollText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

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
      toast.error("Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS") {
      return <CheckCircle2 className="h-3 w-3 mr-1" />;
    }
    return <XCircle className="h-3 w-3 mr-1" />;
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
          System Audit Trail
        </h1>
        <p className="text-muted-foreground">
          Monitor security events, role modifications, and system-level actions.
        </p>
      </div>

      <Card className="bg-card/40 backdrop-blur-md border border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              <CardTitle>Event Logs</CardTitle>
            </div>

            <div className="flex gap-3 w-full sm:w-64">
              <div className="relative w-full group flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 hover:bg-background/80"
                />
                {/* Glowing background effect for input */}
                <div className="absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity blur-md" />
              </div>

              <Button
                onClick={fetchLogs}
                variant="outline"
                size="icon"
                className="bg-background/50 border-border/50 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-background/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Event Action</TableHead>
                <TableHead>Initiator</TableHead>
                <TableHead>Target Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground/30" />
                      <p>No audit logs available or matching your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-border/50 hover:bg-primary/5 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                        {format(
                          new Date(log.timestamp),
                          "MMM dd, yyyy HH:mm:ss",
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-background/50 border-border/50 text-slate-200 uppercase tracking-wider text-[10px]"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-200 text-sm font-medium">
                      {log.username}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.target}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {getStatusIcon(log.status)}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right max-w-sm">
                      <span
                        className="text-xs text-muted-foreground truncate block float-right max-w-[250px]"
                        title={log.details}
                      >
                        {log.details}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
