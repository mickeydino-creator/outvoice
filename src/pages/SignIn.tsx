import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../store/AuthContext"
import { Button, Input, Label } from "../components/ui"
import { AuthShell } from "./SignUp"

export default function SignIn() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("יש להזין אימייל וסיסמה.")
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

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-slate-900">התחברות</h1>
      <p className="mt-1 text-sm text-slate-500 mb-6">ברוכים השבים - אפשר להמשיך מאיפה שעצרתם.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>אימייל</Label>
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
          <Label>סיסמה</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="הסיסמה שלך"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "מתחברים..." : "התחברות"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        אין לך חשבון?{" "}
        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          להרשמה
        </Link>
      </p>
    </AuthShell>
  )
}
