import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

interface Toast {
  id: string
  message: string
  tone: "success" | "info" | "error"
}

interface ToastContextValue {
  showToast: (message: string, tone?: Toast["tone"]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-toast-in flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5 text-sm font-medium ${
              toast.tone === "success"
                ? "bg-white border-emerald-200 text-slate-800"
                : toast.tone === "error"
                ? "bg-white border-red-200 text-slate-800"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-xs ${
                toast.tone === "success" ? "bg-emerald-500" : toast.tone === "error" ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
