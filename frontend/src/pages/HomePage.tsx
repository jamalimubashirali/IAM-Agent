import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  Users,
  KeyRound,
  ScrollText,
  Globe,
  Zap,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    // y: 0,
    transition: {
      staggerChildren: 0.1,
      // duration: 0.5,
      // ease: [0.22, 1, 0.36, 1],
    },
  },
};

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 overflow-x-hidden selection:bg-primary/30">
      <div className="mx-auto max-w-7xl px-6 py-12 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-10"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl glass-card p-3 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">
                SafeGuard v2.4
              </p>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Access Studio
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {isAuthenticated ? (
              <Button
                asChild
                className="glass-button bg-primary/20 hover:bg-primary/30 border-primary/30 h-11 px-6 text-sm font-medium"
              >
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hover:bg-white/5 text-slate-300"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                >
                  <Link to="/register">Get Started</Link>
                </Button>
                <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
                <Button
                  asChild
                  variant="outline"
                  className="glass-button border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  <Link to="/admin/login">Admin Console</Link>
                </Button>
              </>
            )}
          </div>
        </motion.header>

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-20 lg:mt-32 grid gap-16 lg:grid-cols-2 items-center"
        >
          <div className="space-y-8">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-primary font-medium"
            >
              <Zap className="h-3 w-3 fill-primary" />
              <span>Agentic Identity Management</span>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              Control your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-400">
                Digital Perimeter.
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-400 max-w-xl leading-relaxed"
            >
              Orchestrate secure onboarding, granular role-based access, and
              deep audit trails from a neural console. Designed for
              high-velocity teams at the edge of innovation.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-5 pt-4"
            >
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(139,92,246,0.4)]"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                  Explore the Console
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 glass-button border-white/10 text-white"
              >
                <Link to="/register">Create New Account</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-6 pt-10 text-slate-500"
            >
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-white leading-none">
                  99.9%
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Reliability
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-white leading-none">
                  AES-256
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Encrypted
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <Card className="glass-card p-8 border-white/20 relative z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16" />

              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Fingerprint className="h-6 w-6 text-primary" />
                Security Workflows
              </h3>

              <div className="space-y-5">
                <div className="group/item rounded-2xl bg-white/5 border border-white/5 p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">
                        User Lifecycle
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Automated onboarding and identity verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group/item rounded-2xl bg-white/5 border border-white/5 p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">
                        Granular Governance
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Policy-driven roles and deep permission management.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group/item rounded-2xl bg-white/5 border border-white/5 p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <ScrollText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">
                        Immutable Audit
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Searchable activity logs and compliance evidence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -right-20 w-64 h-64 border border-white/5 rounded-full pointer-events-none opacity-20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -right-10 w-40 h-40 border border-primary/20 rounded-full pointer-events-none opacity-30 border-dashed"
            />
          </motion.div>
        </motion.main>

        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-32 grid gap-8 md:grid-cols-3"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:border-primary/50 transition-all p-8 h-full bg-gradient-to-b from-white/10 to-transparent">
              <Globe className="h-8 w-8 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">Global Identity</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect users across regions with zero latency and consistent
                policy enforcement.
              </p>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:border-primary/50 transition-all p-8 h-full bg-gradient-to-b from-white/10 to-transparent">
              <ShieldCheck className="h-8 w-8 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Threat Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Identify anomalous patterns and revoke access automatically with
                AI guardrails.
              </p>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:border-primary/50 transition-all p-8 h-full bg-gradient-to-b from-white/10 to-transparent">
              <Zap className="h-8 w-8 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Fast Integration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Developer-first APIs that plug into any stack in minutes, not
                days.
              </p>
            </Card>
          </motion.div>
        </motion.section>

        <footer className="mt-40 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs font-medium">
          <p>© 2026 SafeGuard Systems Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Security Audit
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Developer API
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
