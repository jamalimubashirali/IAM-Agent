import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_70%,_#cbd5f5_100%)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="font-['Source_Serif_4'] text-4xl font-semibold text-slate-900">
          This space is unassigned.
        </h1>
        <p className="mt-4 text-base text-slate-600">
          The page you requested does not exist. Return to the console or head back to the home
          experience.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
