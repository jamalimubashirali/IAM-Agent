import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, SearchX } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="text-[120px] font-black leading-none tracking-tighter opacity-10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <SearchX size={48} className="text-primary/60" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-4">
            Coordinate Unassigned<span className="text-primary italic">.</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 max-w-md mx-auto">
            The requested resource is missing from the core index. Re-route to a
            known security domain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.2)] transition-all active:scale-95"
            >
              <Link to="/" className="flex items-center gap-3">
                <Home size={18} />
                Return to Core
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 glass-card border-white/10 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/5 transition-all active:scale-95"
            >
              <Link to="/dashboard" className="flex items-center gap-3">
                <LayoutDashboard size={18} />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-16 flex items-center gap-3"
        >
          <div className="h-px w-8 bg-slate-800" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 italic">
            Access Studio Terminal
          </span>
          <div className="h-px w-8 bg-slate-800" />
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
