import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

export interface TutorialStep {
  id: string
  path: string
  target: string // matches a [data-tutorial="..."] element
  title: string
  description: string
  placement?: "top" | "bottom"
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    target: "dashboard-overview",
    title: "מתחילים כאן",
    description: "מרכז הבקרה מציג תמונת מצב מהירה של העסק.",
    placement: "bottom",
  },
  {
    id: "add-client",
    path: "/dashboard",
    target: "action-add-client",
    title: "הוספת הלקוח הראשון",
    description: "שמירת פרטי הלקוח מאפשרת ליצור חשבוניות והצעות מחיר במהירות.",
    placement: "bottom",
  },
  {
    id: "create-quote",
    path: "/dashboard",
    target: "action-create-quote",
    title: "יצירת הצעת מחיר",
    description: "אפשר ליצור הצעת מחיר מקצועית ולשלוח אותה ללקוח.",
    placement: "bottom",
  },
  {
    id: "create-invoice",
    path: "/dashboard",
    target: "action-create-invoice",
    title: "יצירת חשבונית",
    description: "הופכים את העבודה שלך לחשבונית מקצועית.",
    placement: "bottom",
  },
  {
    id: "send-invoice",
    path: "/invoices",
    target: "invoices-page",
    title: "שליחת החשבונית",
    description: "יש לפתוח חשבונית וללחוץ על ״שליחת חשבונית״ כדי לשלוח אותה באימייל ישירות ללקוח.",
    placement: "top",
  },
  {
    id: "track-payments",
    path: "/payments",
    target: "payments-overview",
    title: "מעקב אחר תשלומים",
    description: "כאן רואים אילו חשבוניות שולמו, ממתינות לתשלום או באיחור.",
    placement: "bottom",
  },
  {
    id: "templates",
    path: "/settings",
    target: "settings-templates-tab",
    title: "התאמת התבניות",
    description: "אפשר לערוך את קוד ה-HTML של החשבוניות והצעות המחיר בהגדרות ← תבניות מסמכים.",
    placement: "bottom",
  },
]

const STORAGE_KEY = "if_tutorial_seen"

interface TutorialContextValue {
  active: boolean
  stepIndex: number
  step: TutorialStep | null
  totalSteps: number
  hasSeenTutorial: boolean
  start: () => void
  next: () => void
  back: () => void
  skip: () => void
  close: () => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  const markSeen = useCallback(() => {
    setHasSeenTutorial(true)
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore storage failures
    }
  }, [])

  const goToStep = useCallback(
    (index: number) => {
      const step = TUTORIAL_STEPS[index]
      if (!step) return
      setStepIndex(index)
      navigate(step.path)
    },
    [navigate]
  )

  const start = useCallback(() => {
    setActive(true)
    goToStep(0)
  }, [goToStep])

  const next = useCallback(() => {
    if (stepIndex >= TUTORIAL_STEPS.length - 1) {
      setActive(false)
      markSeen()
      return
    }
    goToStep(stepIndex + 1)
  }, [stepIndex, goToStep, markSeen])

  const back = useCallback(() => {
    if (stepIndex === 0) return
    goToStep(stepIndex - 1)
  }, [stepIndex, goToStep])

  const skip = useCallback(() => {
    setActive(false)
    markSeen()
  }, [markSeen])

  const close = useCallback(() => {
    setActive(false)
    markSeen()
  }, [markSeen])

  const value = useMemo<TutorialContextValue>(
    () => ({
      active,
      stepIndex,
      step: active ? TUTORIAL_STEPS[stepIndex] ?? null : null,
      totalSteps: TUTORIAL_STEPS.length,
      hasSeenTutorial,
      start,
      next,
      back,
      skip,
      close,
    }),
    [active, stepIndex, hasSeenTutorial, start, next, back, skip, close]
  )

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider")
  return ctx
}
