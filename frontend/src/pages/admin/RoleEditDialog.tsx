import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type Role, type Permission } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  permissions: z.array(z.number()),
});

interface RoleEditDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: () => void;
}

export default function RoleEditDialog({
  role,
  open,
  onOpenChange,
  onRoleUpdated,
}: RoleEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
    values: role
      ? {
          name: role.name,
          permissions: role.permissions.map((p) => p.id),
        }
      : {
          name: "",
          permissions: [],
        },
  });

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/roles/permissions");
      setAllPermissions(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load permissions");
    }
  };

  async function onSubmit(values: z.infer<typeof roleSchema>) {
    setIsLoading(true);
    try {
      const payload = {
        name: values.name,
        permissions: values.permissions.map((id) => ({ id })),
      };

      if (role) {
        await api.put(`/roles/${role.id}`, payload);
        toast.success("Security Policy Synchronized", {
          description: "Role permissions updated in core registry.",
        });
      } else {
        await api.post("/roles", payload);
        toast.success("New Security Domain Initialized", {
          description: "Domain successfully provisioned.",
        });
      }
      onRoleUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Registry Update Failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] glass-card border-white/10 bg-black/80 backdrop-blur-3xl rounded-[2rem] p-0 overflow-hidden shadow-3xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-600 opacity-50" />

        <DialogHeader className="p-8 pb-4 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                {role ? "Refine Security Role" : "Provision Security Domain"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Adjust granular permission matrices for{" "}
                {role ? role.name : "new access tier"}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                      Domain Identifier
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          {...field}
                          disabled={!!role}
                          className="glass-input h-14 pl-12 rounded-2xl font-bold text-slate-100 border-white/5 focus:border-primary/40 bg-white/5 transition-all"
                          placeholder="ROLE_DOMAIN_NAME"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] uppercase font-black tracking-widest text-red-400 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                        Privilege Matrix
                      </FormLabel>
                      <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest italic font-bold">
                        {form.watch("permissions").length} Active Grants
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 border border-white/5 p-4 rounded-3xl max-h-[280px] overflow-y-auto custom-scrollbar shadow-inner">
                      {allPermissions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => {
                            const isChecked = field.value?.includes(item.id);
                            return (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FormItem
                                  className={`flex flex-row items-center space-x-3 space-y-0 p-3 rounded-xl border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-primary/10 border-primary/30"
                                      : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                  }`}
                                  onClick={() => {
                                    const newValue = isChecked
                                      ? field.value?.filter(
                                          (value) => value !== item.id,
                                        )
                                      : [...(field.value || []), item.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      className={`h-5 w-5 rounded-md transition-colors border-white/10 ${isChecked ? "bg-primary border-primary text-white" : ""}`}
                                    />
                                  </FormControl>
                                  <FormLabel
                                    className={`font-bold transition-colors cursor-pointer ${isChecked ? "text-white text-xs" : "text-slate-500 text-[11px]"}`}
                                  >
                                    {item.name}
                                  </FormLabel>
                                </FormItem>
                              </motion.div>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage className="text-[10px] uppercase font-black tracking-widest text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5"
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 flex-[1.5] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all"
                >
                  {isLoading ? "Synchronizing..." : "Commit Registry Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
