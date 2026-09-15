import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../store/AuthContext"
import { Button, Input, Label } from "../components/ui"
import { AuthShell } from "./SignUp"

export default function SignIn() {
  const { user, loading, signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }

    setSubmitting(true)
    const { error: signInError } = await signIn({ email: email.trim(), password })
    setSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate("/dashboard")
  }

  async function handleForgotPassword() {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError("Enter your email above first, then click \"Forgot password?\".")
      return
    }
    const { error: resetError } = await resetPassword(email.trim())
    if (resetError) {
      setError(resetError)
      return
    }
    setInfo("If an account exists for that email, a password reset link is on its way.")
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500 mb-6">Welcome back — pick up where you left off.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>Email</Label>
          <Input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Password</Label>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={handleForgotPassword}
            className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {info && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}
