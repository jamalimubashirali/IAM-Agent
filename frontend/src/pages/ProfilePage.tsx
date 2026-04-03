import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Profile Schema ---
const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
});

// --- Password Schema ---
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Profile Form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
    },
  });

  // Password Form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile");
      profileForm.reset({
        email: res.data.email,
        phoneNumber: res.data.phoneNumber || "",
      });
    } catch (error) {
      console.error(error);
      if (user) {
        profileForm.reset({
          email: user.email,
          phoneNumber: "",
        });
      }
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsLoading(true);
    try {
      await api.put("/profile", { ...user, ...values });
      toast.success("Identity profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      await api.post("/profile/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Security credentials updated");
      passwordForm.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data || "Credential rotation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl glass-card flex items-center justify-center border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                Identity Hub
              </h1>
            </div>
            <p className="text-slate-400 font-medium">
              Manage your security profile and account credentials
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Security Clearance
              </p>
              <p className="text-sm font-bold text-slate-200 capitalize">
                {user?.roles?.[0]?.replace("ROLE_", "") || "User"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white/5 p-1.5 rounded-2xl border border-white/10 mb-8 overflow-x-auto inline-flex whitespace-nowrap">
            <TabsTrigger
              value="profile"
              className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card border-white/10 overflow-hidden rounded-3xl shadow-2xl">
                  <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white mb-1">
                      Identity Details
                    </h3>
                    <p className="text-sm text-slate-400">
                      Core identifying information associated with your account
                    </p>
                  </div>
                  <CardContent className="p-8">
                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                              Username ID
                            </Label>
                            <div className="relative">
                              <Input
                                value={user?.username || ""}
                                disabled
                                className="glass-input h-12 bg-black/40 border-white/5 text-slate-500 cursor-not-allowed italic"
                              />
                              <Lock className="absolute right-4 top-3.5 h-4 w-4 text-slate-700" />
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium ml-1">
                              Unique identifier cannot be modified by user
                            </p>
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                  Secure Email
                                </FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <Input
                                      {...field}
                                      type="email"
                                      className="glass-input h-12 pl-4 focus:ring-primary/20 transition-all border-white/10 bg-white/5 rounded-xl"
                                    />
                                    <Mail className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold text-destructive" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem className="space-y-2 max-w-sm">
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                Comms Protocol (Phone)
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Input
                                    {...field}
                                    className="glass-input h-12 pl-4 focus:ring-primary/20 transition-all border-white/10 bg-white/5 rounded-xl"
                                    placeholder="+1 (555) 000-0000"
                                  />
                                  <Phone className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold text-destructive" />
                            </FormItem>
                          )}
                        />

                        <div className="pt-6 flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
                          >
                            {isLoading ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" /> Save Identity
                                Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card border-white/10 overflow-hidden rounded-3xl shadow-2xl border-l-4 border-l-amber-500/30">
                  <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        Passcode Rotation
                      </h3>
                      <p className="text-sm text-slate-400">
                        Regularly update your credentials for maximum security
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Lock className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className="space-y-6 max-w-xl"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                Current Passphrase
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Input
                                    {...field}
                                    type={showCurrentPass ? "text" : "password"}
                                    className="glass-input h-12 pl-4 focus:ring-amber-500/20 transition-all border-white/10 bg-white/5 rounded-xl"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowCurrentPass(!showCurrentPass)
                                    }
                                    className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 hover:text-white"
                                  >
                                    {showCurrentPass ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold text-destructive" />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                  New Passphrase
                                </FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <Input
                                      {...field}
                                      type={showNewPass ? "text" : "password"}
                                      className="glass-input h-12 pl-4 focus:ring-primary/20 transition-all border-white/10 bg-white/5 rounded-xl"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowNewPass(!showNewPass)
                                      }
                                      className="absolute right-4 top-3.5 h-4 w-4 text-slate-600 hover:text-white"
                                    >
                                      {showNewPass ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold text-destructive" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                  Confirm Identity
                                </FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <Input
                                      {...field}
                                      type="password"
                                      className="glass-input h-12 pl-4 focus:ring-primary/20 transition-all border-white/10 bg-white/5 rounded-xl"
                                    />
                                    <Shield className="absolute right-4 top-3.5 h-4 w-4 text-slate-600" />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold text-destructive" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="pt-6 flex justify-end">
                          <Button
                            type="submit"
                            variant="secondary"
                            disabled={isLoading}
                            className="h-12 px-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-white/10 transition-all"
                          >
                            {isLoading ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              "Rotate Access Token"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
