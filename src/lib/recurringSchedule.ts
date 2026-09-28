import type { RecurringFrequency, RecurringInvoice } from "../types"
import { nextOccurrence, type RecurrenceRule } from "./recurrence"

export function recurrenceRuleOf(r: Pick<RecurringInvoice, "startDate" | "sendTime" | "timezone" | "frequency" | "interval" | "endDate">): RecurrenceRule {
  return {
    startDate: r.startDate,
    sendTime: r.sendTime,
    timezone: r.timezone,
    unit: r.frequency,
    interval: r.interval,
    endDate: r.endDate || null,
  }
}

// Recomputes next_run_at from now: used on every save and when resuming, so a
// paused schedule never sends back-dated invoices for the time it was off.
export function withNextRun(r: RecurringInvoice, now = new Date()): RecurringInvoice {
  if (!r.active) return { ...r, nextRunAt: undefined }
  const next = nextOccurrence(recurrenceRuleOf(r), now)
  return next ? { ...r, nextRunAt: next.toISOString() } : { ...r, nextRunAt: undefined, active: false }
}

const UNIT_LABELS: Record<RecurringFrequency, { one: string; many: string }> = {
  day: { one: "כל יום", many: "ימים" },
  week: { one: "כל שבוע", many: "שבועות" },
  month: { one: "כל חודש", many: "חודשים" },
  year: { one: "כל שנה", many: "שנים" },
}

export function frequencyLabel(frequency: RecurringFrequency, interval: number) {
  const labels = UNIT_LABELS[frequency]
  if (interval <= 1) return labels.one
  if (interval === 2 && frequency === "week") return "כל שבועיים"
  if (interval === 2 && frequency === "month") return "כל חודשיים"
  if (interval === 2 && frequency === "year") return "כל שנתיים"
  if (interval === 2 && frequency === "day") return "כל יומיים"
  return `כל ${interval} ${labels.many}`
}

export function unitPluralLabel(frequency: RecurringFrequency) {
  return UNIT_LABELS[frequency].many
}

// Date + time of a send moment, shown in the schedule's own timezone.
export function formatSendMoment(iso: string, timeZone: string) {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return new Date(iso).toLocaleString("he-IL")
  }
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}
