import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type User } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  UserCircle,
  Mail,
  Phone,
  Activity,
  Save,
  X,
  UserCog,
} from "lucide-react";
import { motion } from "framer-motion";

const userSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  enabled: z.string(),
});

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export default function UserEditDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: UserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      enabled: "true",
    },
    values: user
      ? {
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          enabled: user.enabled ? "true" : "false",
        }
      : undefined,
  });

  async function onSubmit(values: z.infer<typeof userSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        enabled: values.enabled === "true",
      };
      await api.put(`/users/${user.id}`, payload);
      toast.success("Profile Synchronized", {
        description: "User data updated in core registry.",
      });
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Registry Sync Failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] glass-card border-white/10 bg-black/80 backdrop-blur-3xl rounded-[2rem] p-0 overflow-hidden shadow-3xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-600 opacity-50" />

        <DialogHeader className="p-8 pb-4 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                Update User Identity
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Modify profile data for{" "}
                <span className="text-slate-300 font-bold">
                  {user?.username}
                </span>
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">
                      Electronic Mail
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          {...field}
                          className="glass-input h-14 pl-12 rounded-2xl font-bold text-slate-100 border-white/5 focus:border-primary/40 bg-white/5 transition-all"
                          placeholder="user@internal.iam"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] uppercase font-black tracking-widest text-red-400 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">
                      Telecom Line
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          {...field}
                          className="glass-input h-14 pl-12 rounded-2xl font-bold text-slate-100 border-white/5 focus:border-primary/40 bg-white/5 transition-all"
                          placeholder="+X (XXX) XXX-XXXX"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] uppercase font-black tracking-widest text-red-400 mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">
                      Lifecycle State
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="glass-input h-14 rounded-2xl font-bold text-slate-100 border-white/5 bg-white/5">
                          <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-slate-600" />
                            <SelectValue placeholder="Select status" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-card border-white/10 bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                        <SelectItem
                          value="true"
                          className="focus:bg-emerald-500/10 focus:text-emerald-400 py-3 font-bold uppercase tracking-widest text-[10px]"
                        >
                          Operational (Active)
                        </SelectItem>
                        <SelectItem
                          value="false"
                          className="focus:bg-red-500/10 focus:text-red-400 py-3 font-bold uppercase tracking-widest text-[10px]"
                        >
                          Deactivated (Locked)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] uppercase font-black tracking-widest text-red-400 mt-2" />
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 flex-[1.5] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all"
                >
                  {isLoading ? "Updating..." : "Authorize Registry Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
