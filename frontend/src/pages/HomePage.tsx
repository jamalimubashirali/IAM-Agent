import { Link } from "react-router-dom"
import { ShieldCheck, ArrowRight, Users, KeyRound, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_50%,_#e2e8f0_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3">
              <ShieldCheck className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Enterprise IAM</p>
              <h1 className="font-['Source_Serif_4'] text-2xl font-semibold text-slate-900">Access Studio</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">User Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Create Account</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/admin/login">Admin Portal</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="mt-14 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <h2 className="font-['Source_Serif_4'] text-4xl font-semibold text-slate-900 md:text-5xl">
              Identity and access controls that feel deliberate.
            </h2>
            <p className="text-lg text-slate-600">
              Operate secure onboarding, role-based access control, and audit trails from a single
              console. Built for teams that need clarity, compliance, and speed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                  Explore the Console
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Start with a new account</Link>
              </Button>
            </div>
          </div>

          <Card className="border-amber-200 bg-white/90 p-6 shadow-sm">
            <h3 className="font-['Source_Serif_4'] text-xl font-semibold text-slate-900">
              Built-in workflows
            </h3>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold text-slate-900">User lifecycle management</p>
                </div>
                <p className="mt-2">
                  Review accounts, enable or disable access, and keep user profiles consistent.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold text-slate-900">Role & permission studio</p>
                </div>
                <p className="mt-2">
                  Design roles, map permissions, and keep authorization aligned with policy.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold text-slate-900">Audit insights</p>
                </div>
                <p className="mt-2">
                  Track sensitive events and validate compliance with searchable activity logs.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <Card className="border-slate-200 bg-white/80 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Users</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Self-service profile</h3>
            <p className="mt-2 text-sm text-slate-600">
              Update contact info, manage passwords, and keep personal settings secure.
            </p>
          </Card>
          <Card className="border-slate-200 bg-white/80 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admins</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Role governance</h3>
            <p className="mt-2 text-sm text-slate-600">
              Curate permissions, align roles, and enforce guardrails with clarity.
            </p>
          </Card>
          <Card className="border-slate-200 bg-white/80 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Compliance</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Audit history</h3>
            <p className="mt-2 text-sm text-slate-600">
              Verify access decisions and maintain evidence for review.
            </p>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default HomePage
