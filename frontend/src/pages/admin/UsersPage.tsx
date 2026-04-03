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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/lib/api";
import { type User } from "@/types";
import {
  Trash2,
  MoreHorizontal,
  Search,
  RefreshCw,
  UserCircle,
  Users,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import UserEditDialog from "./UserEditDialog";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync user directory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to purge this identity? This action is irreversible.",
      )
    )
      return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Identity purged from system");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Purge operation failed");
    }
  };

  const handleSuspend = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to revoke access for this user? Access will be strictly denied.",
      )
    )
      return;
    try {
      await api.put(`/users/${id}`, { enabled: false });
      toast.success("Access revoked for target identity");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Revocation failed");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 min-h-[calc(100vh-120px)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Identity Directory
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Manage global access control and identity lifecycles
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="glass-card border-white/10 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl transition-all"
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-3 w-3 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Sync Directory
        </Button>
      </header>

      <Card className="glass-card border-white/10 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search Identity Database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-11 bg-black/40 border-white/5 focus:ring-primary/20 h-11 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-[10px] py-1 px-3"
              >
                {filteredUsers.length} Active Identites
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-500 pl-8">
                    ID Prefix
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Subject Identity
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Security Clearance
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pr-8">
                    Operations
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center gap-3"
                        >
                          <UserCircle className="h-12 w-12 text-slate-800" />
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            No Records in Directory
                          </p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={user.id}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors group cursor-default"
                      >
                        <TableCell className="font-mono text-[10px] text-slate-600 pl-8">
                          #SEC-{user.id.toString().padStart(4, "0")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">
                              {user.username}
                            </span>
                            <span className="text-xs text-slate-500">
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none shadow-sm ${
                                  role.name === "ROLE_ADMIN"
                                    ? "bg-red-500/10 text-red-500 shadow-red-500/10"
                                    : role.name === "ROLE_MODERATOR"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-primary/10 text-primary shadow-primary/10"
                                }`}
                              >
                                {role.name.replace("ROLE_", "")}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-none ${
                              user.enabled
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-slate-700/20 text-slate-500"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full mr-1.5 ${user.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
                            />
                            {user.enabled ? "Authorized" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-9 w-9 p-0 hover:bg-white/10 rounded-xl"
                              >
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[200px] glass-card border-white/10 rounded-2xl shadow-3xl text-slate-300 p-2"
                            >
                              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 py-2">
                                Administrative Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem
                                className="cursor-pointer rounded-lg focus:bg-primary/20 focus:text-white transition-all py-2.5 px-3"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <ShieldCheck className="mr-3 h-4 w-4 text-primary" />
                                <span className="text-xs font-bold">
                                  Modify Clearance
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer rounded-lg focus:bg-amber-500/20 focus:text-amber-500 transition-all py-2.5 px-3"
                                onClick={() => handleSuspend(user.id)}
                              >
                                <UserMinus className="mr-3 h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold">
                                  Revoke Access
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem
                                className="cursor-pointer rounded-lg focus:bg-red-500/20 focus:text-red-500 text-red-500 transition-all py-2.5 px-3"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                <span className="text-xs font-bold">
                                  Purge Identity
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
