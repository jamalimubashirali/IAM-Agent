import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  ShieldCheck,
  ArrowRight,
  Info,
  User,
  Mail,
  Lock,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["user", "admin", "mod"]),
});

export default function RegisterPage() {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      await api.post("/auth/signup", { ...values, role: [values.role] });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 flex items-center justify-center relative overflow-hidden py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.4)] mb-6"
          >
            <ShieldCheck className="h-9 w-9 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Create Identity
          </h1>
          <p className="text-slate-400 font-medium">
            Establish your profile within the secure perimeter
          </p>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <CardContent className="pt-10 px-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            className="glass-input h-12 pl-4 bg-white/5 border-white/10 rounded-xl"
                            placeholder="johndoe_id"
                            {...field}
                          />
                          <User className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            className="glass-input h-12 pl-4 bg-white/5 border-white/10 rounded-xl"
                            type="email"
                            placeholder="john@safeguard.io"
                            {...field}
                          />
                          <Mail className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-destructive" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                          Passcode
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              className="glass-input h-12 pl-4 bg-white/5 border-white/10 rounded-xl"
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                            <Lock className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                          Access Tier
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="glass-input h-12 bg-white/5 border-white/10 rounded-xl text-slate-300">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-card border-white/10 text-slate-200">
                            <SelectItem
                              value="user"
                              className="focus:bg-primary/20 focus:text-white"
                            >
                              Standard User
                            </SelectItem>
                            <SelectItem
                              value="mod"
                              className="focus:bg-primary/20 focus:text-white"
                            >
                              Moderator
                            </SelectItem>
                            <SelectItem
                              value="admin"
                              className="focus:bg-primary/20 focus:text-white"
                            >
                              System Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all rounded-xl cursor-not-allowed disabled:opacity-50"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Initialize Identity
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-white/5 p-8 bg-white/[0.02]">
            <p className="text-xs text-center text-slate-500 font-medium">
              Already have an identity?{" "}
              <Link
                to="/login"
                className="font-bold text-primary hover:underline transition-all"
              >
                Return to Login
              </Link>
            </p>
          </CardFooter>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 p-5 glass-card border-amber-500/20 rounded-2xl flex gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
              Developer Notice
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Role selection is exposed for demonstration. Use standard IAM
              protocols in production.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
