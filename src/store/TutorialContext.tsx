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
    title: "Start here",
    description: "Your dashboard gives you a quick overview of your business.",
    placement: "bottom",
  },
  {
    id: "add-client",
    path: "/dashboard",
    target: "action-add-client",
    title: "Add your first client",
    description: "Save your customer's details so you can quickly create invoices and quotes.",
    placement: "bottom",
  },
  {
    id: "create-quote",
    path: "/dashboard",
    target: "action-create-quote",
    title: "Create a quote",
    description: "Create a professional quote and send it to your client.",
    placement: "bottom",
  },
  {
    id: "create-invoice",
    path: "/dashboard",
    target: "action-create-invoice",
    title: "Create an invoice",
    description: "Turn your work into a professional invoice.",
    placement: "bottom",
  },
  {
    id: "send-invoice",
    path: "/invoices",
    target: "invoices-page",
    title: "Send the invoice",
    description: "Open any invoice and click \"Send invoice\" to email it straight to your client.",
    placement: "top",
  },
  {
    id: "track-payments",
    path: "/payments",
    target: "payments-overview",
    title: "Track payments",
    description: "See which invoices are paid, pending, or overdue.",
    placement: "bottom",
  },
  {
    id: "templates",
    path: "/settings",
    target: "settings-templates-tab",
    title: "Customize your templates",
    description: "Edit the HTML used for your invoices and quotes in Settings → Document Templates.",
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
