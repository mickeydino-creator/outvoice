import { useEffect, useState } from "react"
import { TUTORIAL_STEPS, useTutorial } from "../store/TutorialContext"

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8

export default function TutorialOverlay() {
  const { active, step, stepIndex, totalSteps, next, back, skip, close } = useTutorial()
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!active || !step) {
      setRect(null)
      return
    }

    let cancelled = false
    let attempts = 0
    let frame = 0

    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-tutorial="${step!.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        el.scrollIntoView({ block: "center", behavior: "smooth" })
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        return
      }
      attempts += 1
      if (!cancelled && attempts < 90) {
        frame = requestAnimationFrame(measure)
      } else if (!cancelled) {
        setRect(null)
      }
    }

    setRect(null)
    frame = requestAnimationFrame(measure)

    function onViewportChange() {
      const el = document.querySelector<HTMLElement>(`[data-tutorial="${step!.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }

    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [active, step])

  if (!active || !step) return null

  const spotlightStyle = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {spotlightStyle ? (
        <div
          className="absolute rounded-2xl transition-all duration-300 ease-out"
          style={{
            ...spotlightStyle,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/55 transition-opacity duration-300" />
      )}

      <TutorialCard
        rect={rect}
        step={step}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onNext={next}
        onBack={back}
        onSkip={skip}
        onClose={close}
      />
    </div>
  )
}

function TutorialCard({
  rect,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  onClose,
}: {
  rect: Rect | null
  step: (typeof TUTORIAL_STEPS)[number]
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onClose: () => void
}) {
  const cardWidth = 320
  const gap = 16
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1280
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800

  let left = viewportW / 2 - cardWidth / 2
  let anchorBottom = false
  let offset = viewportH / 2 - 100 // top offset, or bottom offset when anchorBottom is true

  if (rect) {
    const spaceBelow = viewportH - (rect.top + rect.height)
    const spaceAbove = rect.top
    const prefersBelow = step.placement !== "top"
    const placeBelow = prefersBelow ? spaceBelow > 180 || spaceAbove < 180 : !(spaceAbove > 180 && spaceBelow < 180)

    if (placeBelow) {
      offset = rect.top + rect.height + PADDING + gap
      anchorBottom = false
    } else {
      offset = viewportH - (rect.top - PADDING - gap)
      anchorBottom = true
    }

    left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardWidth / 2, viewportW - cardWidth - 16))
  }

  return (
    <div
      key={step.id}
      className="absolute pointer-events-auto animate-toast-in rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 p-5"
      style={{
        width: cardWidth,
        top: anchorBottom ? undefined : offset,
        bottom: anchorBottom ? offset : undefined,
        left,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-blue-600">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <button onClick={onClose} aria-label="Close tutorial" className="text-slate-300 hover:text-slate-500 -mt-1 -mr-1">
          <CloseIcon />
        </button>
      </div>

      <h3 className="mt-2 text-base font-semibold text-slate-900">{step.title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.description}</p>

      <div className="mt-3 h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={onSkip} className="text-xs font-medium text-slate-400 hover:text-slate-600">
          Skip tutorial
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              onClick={onBack}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
