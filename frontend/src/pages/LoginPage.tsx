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
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." }),
  password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters." }),
});

export default function LoginPage() {
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
      login(response.data);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 flex items-center justify-center relative overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.4)] mb-6"
          >
            <ShieldCheck className="h-9 w-9 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Access Studio
          </h1>
          <p className="text-slate-400 font-medium">
            Authorized personnel only beyond this point
          </p>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

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
                      <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            className="glass-input h-12 pl-4 bg-white/5 border-white/10 rounded-xl"
                            placeholder="janedoe_iam"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px] font-bold text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                          Password
                        </FormLabel>
                        <Link
                          to="#"
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-foreground transition-colors"
                        >
                          Recover Access
                        </Link>
                      </div>
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
                      <FormMessage className="text-[11px] font-bold text-destructive" />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all rounded-xl cursor-pointer"
                  >
                    Authenticate
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-white/5 p-8 bg-white/[0.02]">
            <p className="text-xs text-center text-slate-500 font-medium">
              New to the perimeter?{" "}
              <Link
                to="/register"
                className="font-bold text-primary hover:underline transition-all"
              >
                Apply for Credentials
              </Link>
            </p>
          </CardFooter>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-[10px] uppercase tracking-[0.4em] text-slate-600 font-black"
        >
          Secure Neural Link Established
        </motion.p>
      </motion.div>
    </div>
  );
}
