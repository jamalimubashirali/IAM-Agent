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
import { ShieldCheck, ArrowRight, Info } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden py-10">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-[460px] p-4 relative z-10 flex flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_25px_rgba(139,92,246,0.3)] mb-5">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
            Initialize Access
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create an administrator or user identity profile
          </p>
        </div>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden">
          {/* Subtle top border highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <CardContent className="pt-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Username</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11"
                          placeholder="johndoe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11"
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-background/50 border-border/50 focus-visible:ring-primary/50 h-11"
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Identity Role
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border-border/50 h-11">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card/90 backdrop-blur-xl border-border/50">
                            <SelectItem value="user">Standard User</SelectItem>
                            <SelectItem value="mod">Moderator</SelectItem>
                            <SelectItem value="admin">System Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
                  >
                    Establish Identity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-border/30 p-6 bg-muted/20">
            <p className="text-sm text-center text-muted-foreground">
              Already initialized?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Return to Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="fixed bottom-6 right-6 max-w-[300px] bg-primary/10 border border-primary/20 p-4 shadow-lg rounded-xl text-xs text-muted-foreground/80 flex gap-3 z-20 backdrop-blur-md">
        <Info className="h-5 w-5 text-primary flex-shrink-0" />
        <p>
          <strong className="text-slate-300">Developer Note:</strong> The
          identity role selector is exposed here for demo/testing purposes.
          Production IAM systems typically assign roles out-of-band.
        </p>
      </div>
    </div>
  );
}
