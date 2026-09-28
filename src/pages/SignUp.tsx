import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../store/AuthContext"
import { Button, Input, Label } from "../components/ui"

export default function SignUp() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError("יש להזין שם מלא.")
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("יש להזין כתובת אימייל תקינה.")
      return
    }
    if (password.length < 6) {
      setError("הסיסמה צריכה לכלול לפחות 6 תווים.")
      return
    }
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.")
      return
    }

    setSubmitting(true)
    const { error: signUpError, needsEmailConfirmation } = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    })
    setSubmitting(false)

    if (signUpError) {
      setError(signUpError)
      return
    }

    if (needsEmailConfirmation) {
      setSubmitted(true)
      return
    }

    navigate("/onboarding")
  }

  if (submitted) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">בדקו את תיבת האימייל</h1>
          <p className="mt-2 text-sm text-slate-500">
            שלחנו קישור אימות אל <span className="font-medium text-slate-700" dir="ltr">{email}</span>. יש לאשר את
            הכתובת כדי להשלים את יצירת החשבון, ולאחר מכן להתחבר.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
            מעבר להתחברות
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-slate-900">יצירת חשבון</h1>
      <p className="mt-1 text-sm text-slate-500 mb-6">מתחילים להפיק חשבוניות תוך דקות.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>שם מלא</Label>
          <Input
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ישראל ישראלי"
            autoComplete="name"
          />
        </div>
        <div>
          <Label>אימייל</Label>
          <Input
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
            placeholder="לפחות 6 תווים"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label>אימות סיסמה</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="יש להזין את הסיסמה שוב"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? "יוצרים חשבון..." : "יצירת חשבון"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        כבר יש לך חשבון?{" "}
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
          התחברות
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="Invoxa" className="h-8 w-auto" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">{children}</div>
      </div>
    </div>
  )
}
