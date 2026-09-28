import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabaseClient"

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (params: { fullName: string; email: string; password: string }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Supabase returns auth errors in English; map the common ones to Hebrew
// before they reach the UI.
function translateAuthError(message: string | undefined | null): string | null {
  if (!message) return null
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "האימייל או הסיסמה שגויים."
  if (m.includes("email not confirmed")) return "כתובת האימייל עדיין לא אומתה. יש לבדוק את תיבת הדואר."
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists"))
    return "כבר קיים חשבון עם כתובת האימייל הזו."
  if (m.includes("password should be at least")) return "הסיסמה צריכה לכלול לפחות 6 תווים."
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "כתובת האימייל אינה תקינה."
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("for security purposes"))
    return "בוצעו יותר מדי ניסיונות. אפשר לנסות שוב בעוד כמה דקות."
  if (m.includes("failed to fetch") || m.includes("network")) return "אין חיבור לשרת. יש לבדוק את החיבור לאינטרנט."
  return "משהו השתבש. אפשר לנסות שוב."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signUp({ fullName, email, password }: { fullName: string; email: string; password: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: translateAuthError(error?.message), needsEmailConfirmation: !error && !data.session }
  }

  async function signIn({ email, password }: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: translateAuthError(error?.message) }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error: translateAuthError(error?.message) }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
    }),
    [session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
