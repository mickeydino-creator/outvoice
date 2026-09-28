// Recurring-invoice schedule math. Mirrored in
// supabase/functions/_shared/recurrence.ts (the Edge Function can't import
// from src/), so keep the two files identical.
//
// A schedule is defined in wall-clock terms: "starting on 2026-10-01 at
// 09:00 Asia/Jerusalem, every 1 month". Occurrence k is always computed from
// the start date (never from the previous occurrence), so monthly schedules
// starting on the 31st land on the last day of shorter months and then go
// back to the 31st, instead of drifting.

export type RecurrenceUnit = "day" | "week" | "month" | "year"

export interface RecurrenceRule {
  startDate: string // YYYY-MM-DD
  sendTime: string // HH:MM
  timezone: string
  unit: RecurrenceUnit
  interval: number
  endDate?: string | null // YYYY-MM-DD, inclusive
}

// Enough for a daily schedule to run for decades; guards against bad input.
const MAX_OCCURRENCES = 20000

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone)
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      fmt = formatterFor("UTC")
    }
    formatters.set(timeZone, fmt)
  }
  return fmt
}

function wallClockParts(utcMs: number, timeZone: string) {
  const parts: Record<string, number> = {}
  for (const p of formatterFor(timeZone).formatToParts(new Date(utcMs))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value)
  }
  return parts
}

// How far the zone's wall clock is ahead of UTC at a given instant.
function zoneOffsetMs(utcMs: number, timeZone: string) {
  const p = wallClockParts(utcMs, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toDateKey(y: number, monthIndex: number, d: number) {
  const date = new Date(Date.UTC(y, monthIndex, d))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function daysInMonth(y: number, monthIndex: number) {
  return new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate()
}

// Calendar day (YYYY-MM-DD) of an instant in the given timezone.
export function dateKeyInZone(date: Date, timeZone: string) {
  const p = wallClockParts(date.getTime(), timeZone)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

// Converts a wall-clock date + time in `timeZone` to the UTC instant. The
// second pass corrects for a DST change between the guess and the answer.
export function zonedTimeToUtc(dateKey: string, time: string, timeZone: string) {
  const [y, m, d] = dateKey.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const wall = Date.UTC(y, m - 1, d, hh || 0, mm || 0)
  let utc = wall - zoneOffsetMs(wall, timeZone)
  utc = wall - zoneOffsetMs(utc, timeZone)
  return new Date(utc)
}

export function occurrenceDateKey(rule: RecurrenceRule, k: number) {
  const [y, m, d] = rule.startDate.split("-").map(Number)
  const step = k * Math.max(1, rule.interval)
  switch (rule.unit) {
    case "day":
      return toDateKey(y, m - 1, d + step)
    case "week":
      return toDateKey(y, m - 1, d + step * 7)
    case "month": {
      const total = m - 1 + step
      const yy = y + Math.floor(total / 12)
      const mi = total % 12
      return toDateKey(yy, mi, Math.min(d, daysInMonth(yy, mi)))
    }
    case "year": {
      const yy = y + step
      return toDateKey(yy, m - 1, Math.min(d, daysInMonth(yy, m - 1)))
    }
  }
}

// Upcoming send moments strictly after `after`, in order. Stops at the end
// date (inclusive) when one is set.
export function upcomingOccurrences(rule: RecurrenceRule, after: Date, count: number): Date[] {
  const result: Date[] = []
  const afterKey = dateKeyInZone(after, rule.timezone)
  for (let k = 0; k < MAX_OCCURRENCES && result.length < count; k++) {
    const key = occurrenceDateKey(rule, k)
    if (rule.endDate && key > rule.endDate) break
    // Cheap string comparison skips whole days before `after` without the
    // timezone conversion.
    if (key < afterKey) continue
    const at = zonedTimeToUtc(key, rule.sendTime, rule.timezone)
    if (at.getTime() > after.getTime()) result.push(at)
  }
  return result
}

export function nextOccurrence(rule: RecurrenceRule, after: Date): Date | null {
  return upcomingOccurrences(rule, after, 1)[0] ?? null
}

// "Net 30" -> 30 days until due; "Due on receipt" (or anything unknown) -> 0.
export function paymentTermsDays(terms: string) {
  const match = /net\s*(\d+)/i.exec(terms ?? "")
  return match ? Number(match[1]) : 0
}
