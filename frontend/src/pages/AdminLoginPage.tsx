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
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Lock, User, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." }),
  password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters." }),
});

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await api.post("/auth/signin", values);
      const userData = response.data;

      if (!userData.roles.includes("ROLE_ADMIN")) {
        toast.error("Access Denied: Administrative privileges required.");
        return;
      }

      login(userData);
      toast.success("Admin Authorization Successful");
      navigate("/admin/users");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Authentication failed";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex items-center justify-center relative overflow-hidden px-4">
      {/* Red ambient glows for Admin portal */}
      <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-zinc-900/40 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-16 w-16 rounded-2xl bg-red-600/5 border border-red-600/20 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.2)] mb-6"
          >
            <ShieldAlert className="h-9 w-9 text-red-500 animate-pulse" />
          </motion.div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">
            Restricted Console
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
            Superuser Authentication Required
          </p>
        </div>

        <Card className="bg-zinc-950/50 backdrop-blur-3xl border-red-900/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

          <CardContent className="pt-10 px-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">
                        Admin ID
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            placeholder="root_admin"
                            {...field}
                            className="bg-black/40 border-zinc-800 focus:border-red-600/50 focus:ring-red-600/20 h-12 rounded-xl transition-all"
                          />
                          <User className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700 group-focus-within:text-red-500 transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          Secure Token
                        </FormLabel>
                        <span className="text-[9px] font-black uppercase text-zinc-800 tracking-tighter">
                          BIP-39 Standard
                        </span>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="bg-black/40 border-zinc-800 focus:border-red-600/50 focus:ring-red-600/20 h-12 rounded-xl transition-all"
                          />
                          <Lock className="absolute right-4 top-3.5 h-4 w-4 text-zinc-700 group-focus-within:text-red-500 transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500" />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all rounded-xl"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Initialize Override
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center p-8 border-t border-red-900/10 bg-red-600/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Unauthorized access is logged and traced
            </p>
          </CardFooter>
        </Card>

        <div className="mt-12 flex justify-center gap-8">
          <Link
            to="/login"
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            User Login
          </Link>
          <div className="w-[1px] h-3 bg-zinc-800" />
          <Link
            to="/"
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            System Root
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
