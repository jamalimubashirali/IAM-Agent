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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import { type Role } from "@/types";
import { Plus, Edit3, Shield, KeySquare, RefreshCw } from "lucide-react";

import RoleEditDialog from "./RoleEditDialog";

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
      toast.error("Failed to fetch roles");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
          Role & Access Management
        </h1>
        <p className="text-muted-foreground">
          Define system roles and configure granular access permissions.
        </p>
      </div>

      <Card className="bg-card/40 backdrop-blur-md border border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Configured Roles</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRoles}
                className="bg-background/50 border-border/50 hover:bg-primary/10 hover:text-primary transition-colors h-9"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={handleCreate}
                className="h-9 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-shadow"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Role
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-background/50">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[200px]">Role Designation</TableHead>
                <TableHead>Assigned Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <KeySquare className="h-8 w-8 text-muted-foreground/30" />
                      <p>No roles configured in the system.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="border-border/50 hover:bg-primary/5 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{role.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">
                      <div className="flex flex-col">
                        <span>{role.name}</span>
                        {role.name === "ROLE_ADMIN" && (
                          <span className="text-[10px] text-destructive tracking-widest uppercase mt-0.5">
                            Superuser
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((perm) => (
                            <Badge
                              key={perm.id}
                              variant="outline"
                              className="text-[10px] uppercase font-mono tracking-wider bg-background/50 border-border/50 text-muted-foreground"
                            >
                              {perm.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No permissions assigned
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(role)}
                        className="opacity-50 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Modify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
