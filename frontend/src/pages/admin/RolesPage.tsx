import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import { type Role } from "@/types";
import {
  Plus,
  KeySquare,
  RefreshCw,
  Key,
  ShieldCheck,
  Settings,
} from "lucide-react";
import RoleEditDialog from "./RoleEditDialog";
import { motion, AnimatePresence } from "framer-motion";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/roles");
      setRoles(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync role registry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 min-h-[calc(100vh-120px)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Access Governance
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Define security domains and refine granular permission matrices
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchRoles}
            className="glass-card border-white/10 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl transition-all"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={handleCreate}
            className="h-10 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Initialize Role
          </Button>
        </div>
      </header>

      <Card className="glass-card border-white/10 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02] flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Key className="h-4 w-4 text-slate-400" />
            </div>
            <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">
              Security Profiles
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-white/5 font-mono text-[10px] py-1 border-white/10 text-slate-500"
          >
            REGISTRY_v4.2
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-500 pl-8">
                    Serial
                  </TableHead>
                  <TableHead className="w-[240px] text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Classification
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Granted Privileges
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pr-8">
                    Management
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center gap-3"
                        >
                          <KeySquare className="h-12 w-12 text-slate-800" />
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Access Control List Empty
                          </p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role, index) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={role.id}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                      >
                        <TableCell className="font-mono text-[10px] text-slate-600 pl-8">
                          #PERM-{role.id.toString().padStart(3, "0")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200 tracking-tight">
                                {role.name}
                              </span>
                              {role.name === "ROLE_ADMIN" && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-500/10 text-red-500 border-none text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0"
                                >
                                  Elevated
                                </Badge>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">
                              {role.name === "ROLE_ADMIN"
                                ? "System Superuser"
                                : "Standard Domain"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2 py-3">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.map((perm) => (
                                <Badge
                                  key={perm.id}
                                  variant="outline"
                                  className="text-[9px] font-mono font-bold tracking-tight bg-white/5 border-white/5 text-slate-400 group-hover:text-primary group-hover:border-primary/20 transition-all px-2"
                                >
                                  {perm.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-700 italic font-medium">
                                No specific grants attached
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          >
                            <Settings className="h-3.5 w-3.5 mr-2" />
                            Provision
                          </Button>
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

      <RoleEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        role={selectedRole}
        onRoleUpdated={fetchRoles}
      />
    </div>
  );
}
