import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import { useTutorial } from "../store/TutorialContext"
import { useAuth } from "../store/AuthContext"
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui"
import { DEFAULT_INVOICE_TEMPLATE, DEFAULT_QUOTE_TEMPLATE, renderInvoiceTemplate, renderQuoteTemplate } from "../lib/documentTemplates"
import { sanitizeHtml } from "../lib/sanitizeHtml"
import type { Client } from "../types"

const plans = [
  {
    name: "Free",
    label: "חינמית",
    upgradeLabel: "מעבר לתוכנית החינמית",
    price: "$0",
    tagline: "מושלמת כדי להתחיל",
    features: ["עד 5 חשבוניות בחודש", "תבניות חשבונית בסיסיות", "ניהול לקוחות"],
    current: true,
  },
  {
    name: "Pro",
    label: "Pro",
    upgradeLabel: "שדרוג ל-Pro",
    price: "$15",
    tagline: "לפרילנסרים וסוכנויות בצמיחה",
    features: [
      "חשבוניות ללא הגבלה",
      "הצעות מחיר",
      "מעקב תשלומים",
      "הורדת PDF",
      "מיתוג מותאם אישית",
      "תזכורות אוטומטיות",
      "דוחות",
    ],
    highlight: true,
  },
  {
    name: "Business",
    label: "עסקית",
    upgradeLabel: "שדרוג לתוכנית העסקית",
    price: "$39",
    tagline: "לצוותים שמנהלים כמה עסקים",
    features: ["כל מה שיש ב-Pro", "משתמשים מרובים בצוות", "ניהול כמה עסקים", "דוחות מתקדמים", "תמיכה בעדיפות"],
  },
]

// Stored values stay in English for compatibility with existing data; only the labels are localized.
const BUSINESS_TYPES = [
  { value: "Freelancer", label: "פרילנסר" },
  { value: "Design & Creative Agency", label: "סטודיו לעיצוב וקריאייטיב" },
  { value: "Marketing Agency", label: "משרד פרסום ושיווק" },
  { value: "Development / IT Services", label: "פיתוח ושירותי IT" },
  { value: "Photography", label: "צילום" },
  { value: "Consulting", label: "ייעוץ" },
  { value: "Home & Repair Services", label: "שירותי בית ותיקונים" },
  { value: "Other", label: "אחר" },
]

const PAYMENT_TERMS = [
  { value: "Due on receipt", label: "לתשלום מיידי" },
  { value: "Net 7", label: "שוטף + 7" },
  { value: "Net 14", label: "שוטף + 14" },
  { value: "Net 30", label: "שוטף + 30" },
  { value: "Net 60", label: "שוטף + 60" },
]

function formatReminderKey(key: string): string {
  if (key === "due") return "ביום התשלום"
  const [kind, days] = key.split("_")
  if (kind === "before") return days === "1" ? "יום לפני מועד התשלום" : `${days} ימים לפני מועד התשלום`
  if (kind === "after") return days === "1" ? "יום אחרי מועד התשלום" : `${days} ימים אחרי מועד התשלום`
  return key.replace("_", " ")
}

const tabs = [
  { key: "profile", label: "פרופיל העסק" },
  { key: "invoicing", label: "חשבוניות" },
  { key: "email", label: "הגדרות אימייל" },
  { key: "templates", label: "תבניות מסמכים" },
  { key: "reminders", label: "תזכורות" },
  { key: "account", label: "חשבון" },
  { key: "billing", label: "תוכנית וחיוב" },
] as const

type TabKey = (typeof tabs)[number]["key"]

export default function Settings() {
  const [tab, setTab] = useState<TabKey>("profile")

  return (
    <div>
      <PageHeader title="הגדרות" subtitle="ניהול פרופיל העסק, ברירות המחדל לחשבוניות והתוכנית." />

      <div className="px-4 lg:px-8 pb-16">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              data-tutorial={t.key === "templates" ? "settings-templates-tab" : undefined}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "invoicing" && <InvoicingTab />}
        {tab === "email" && <EmailTab />}
        {tab === "templates" && <DocumentTemplatesTab />}
        {tab === "reminders" && <RemindersTab />}
        {tab === "account" && <AccountTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </div>
  )
}

function ProfileTab() {
  const { business, updateBusiness } = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(business)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logoDataUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="p-5 max-w-3xl">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">פרופיל העסק</h3>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("פרופיל העסק נשמר")
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white text-xl font-semibold overflow-hidden">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="לוגו" className="h-full w-full object-cover" />
            ) : (
              form.logoInitial
            )}
          </div>
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              העלאת לוגו
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <p className="mt-1.5 text-xs text-slate-400">PNG או JPG, עדיף בפורמט ריבועי.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>שם העסק</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>סוג העסק</Label>
            <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>מדינה</Label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <Label>אימייל</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>טלפון</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>כתובת העסק</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            שמירת שינויים
          </Button>
        </div>
      </form>
    </Card>
  )
}

function InvoicingTab() {
  const { business, updateBusiness } = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(business)

  return (
    <Card className="p-5 max-w-3xl">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">ברירות מחדל לחשבוניות</h3>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("הגדרות החשבוניות נשמרו")
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>קידומת למספר חשבונית</Label>
            <Input value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
            <p className="mt-1 text-xs text-slate-400">החשבונית הבאה תמוספר בפורמט <span dir="ltr">{form.invoicePrefix || "INV"}-1044</span></p>
          </div>
          <div>
            <Label>מטבע ברירת מחדל</Label>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="ILS">ILS (₪) - שקל חדש</option>
              <option value="USD">USD - דולר אמריקאי</option>
              <option value="EUR">EUR - אירו</option>
              <option value="GBP">GBP - לירה שטרלינג</option>
              <option value="CAD">CAD - דולר קנדי</option>
              <option value="AUD">AUD - דולר אוסטרלי</option>
            </Select>
          </div>
          <div>
            <Label>תנאי תשלום ברירת מחדל</Label>
            <Select
              value={form.defaultPaymentTerms}
              onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
            >
              {PAYMENT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>שם המס</Label>
            <Input value={form.taxLabel} onChange={(e) => setForm({ ...form, taxLabel: e.target.value })} placeholder="מע״מ, VAT, GST..." />
          </div>
          <div>
            <Label>שיעור מע״מ ברירת מחדל (%)</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultTaxRate}
              onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>אזור זמן</Label>
            <Select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              <option value="Asia/Jerusalem">Asia/Jerusalem (ישראל)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/Denver">America/Denver</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </Select>
            <p className="mt-1 text-xs text-slate-400">משמש לחישוב מועדי התשלום עבור תזכורות.</p>
          </div>
        </div>

        <div>
          <Label>הערות ברירת מחדל / כותרת תחתונה לחשבונית</Label>
          <Textarea
            rows={3}
            value={form.invoiceFooter}
            onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
            placeholder="תודה על שיתוף הפעולה..."
          />
          <p className="mt-1 text-xs text-slate-400">יופיע כברירת מחדל בכל חשבונית והצעת מחיר חדשה - אפשר לערוך בכל מסמך בנפרד.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">תצוגה מקדימה של החשבונית</p>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm overflow-hidden">
              {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" className="h-full w-full object-cover" /> : form.logoInitial}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{form.name || "שם העסק שלך"}</p>
              <p className="text-slate-500">חשבונית · <span dir="ltr">{form.invoicePrefix || "INV"}-1044</span> · {form.currency}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            שמירת שינויים
          </Button>
        </div>
      </form>
    </Card>
  )
}

function EmailTab() {
  const { business, updateBusiness } = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(business)

  return (
    <Card className="p-5 max-w-3xl">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">הגדרות אימייל</h3>
      <p className="text-sm text-slate-500 mb-4">התאמה אישית של מה שהלקוחות רואים כשחשבונית נשלחת באימייל.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("הגדרות האימייל נשמרו")
        }}
      >
        <div>
          <Label>שורת נושא</Label>
          <Input value={form.emailSubjectTemplate} onChange={(e) => setForm({ ...form, emailSubjectTemplate: e.target.value })} />
        </div>
        <div>
          <Label>גוף האימייל</Label>
          <Textarea rows={6} value={form.emailBodyTemplate} onChange={(e) => setForm({ ...form, emailBodyTemplate: e.target.value })} />
          <p className="mt-1 text-xs text-slate-400">
            אפשר להשתמש במשתנים: {"{client}"}, {"{number}"}, {"{total}"}, {"{dueDate}"}, {"{business}"}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          אפשר להגדיר תזכורות תשלום אוטומטיות בלשונית ״תזכורות״.
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            שמירת שינויים
          </Button>
        </div>
      </form>
    </Card>
  )
}

function parseDaysList(value: string): number[] {
  return value
    .split(",")
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
}

function RemindersTab() {
  const { reminderSettings, updateReminderSettings, reminderLog } = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(reminderSettings)

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">תזכורות לחשבוניות</h3>
        <p className="text-sm text-slate-500 mb-4">
          שליחת אימייל אוטומטי ללקוחות על חשבוניות שטרם שולמו. לא נשלחות תזכורות על חשבוניות ששולמו, וכל תזכורת
          נשלחת פעם אחת בלבד.
        </p>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            updateReminderSettings(form)
            showToast("הגדרות התזכורות נשמרו")
          }}
        >
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            הפעלת תזכורות אוטומטיות
          </label>

          <div className={form.enabled ? "space-y-5" : "space-y-5 opacity-50 pointer-events-none"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>ימים לפני תאריך התשלום</Label>
                <Input
                  value={form.daysBefore.join(", ")}
                  onChange={(e) => setForm({ ...form, daysBefore: parseDaysList(e.target.value) })}
                  placeholder="e.g. 3, 7"
                />
                <p className="mt-1 text-xs text-slate-400">מספרי ימים מופרדים בפסיקים. אפשר להשאיר ריק.</p>
              </div>
              <div>
                <Label>ימים אחרי תאריך התשלום (באיחור)</Label>
                <Input
                  value={form.daysAfter.join(", ")}
                  onChange={(e) => setForm({ ...form, daysAfter: parseDaysList(e.target.value) })}
                  placeholder="e.g. 3, 7"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.onDueDate}
                onChange={(e) => setForm({ ...form, onDueDate: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
              />
              שליחת תזכורת ביום התשלום
            </label>

            <div>
              <Label>הודעה מותאמת אישית (אופציונלי)</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="אפשר להשאיר ריק כדי להשתמש בהודעת ברירת המחדל."
              />
              <p className="mt-1 text-xs text-slate-400">
                משתנים: {"{{client_name}}"}, {"{{business_name}}"}, {"{{invoice_number}}"}, {"{{total}}"},{" "}
                {"{{due_date}}"}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              שמירת שינויים
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">תזכורות שנשלחו לאחרונה</h3>
        {reminderLog.length === 0 ? (
          <p className="text-sm text-slate-400">עדיין לא נשלחו תזכורות.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {reminderLog.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <div>
                  <p className="text-slate-700">
                    {entry.invoiceNumber} - {entry.clientName}
                  </p>
                  <p className="text-xs text-slate-400">{formatReminderKey(entry.reminderKey)}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(entry.sentAt).toLocaleString("he-IL")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function AccountTab() {
  const { updateBusiness } = useData()
  const { user, signOut, resetPassword } = useAuth()
  const { showToast } = useToast()
  const { start: startTutorial } = useTutorial()
  const navigate = useNavigate()

  async function handleSendResetLink() {
    if (!user?.email) return
    const { error } = await resetPassword(user.email)
    showToast(error ?? "קישור לאיפוס סיסמה נשלח", error ? "error" : "info")
  }

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">חשבון</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">שם מלא</dt>
            <dd className="text-slate-800 font-medium">{user?.user_metadata?.full_name ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">אימייל להתחברות</dt>
            <dd className="text-slate-800 font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">סיסמה</dt>
            <dd>
              <button onClick={handleSendResetLink} className="text-blue-600 font-medium hover:text-blue-700">
                שליחת קישור לאיפוס
              </button>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">אימות דו-שלבי</dt>
            <dd>
              <button onClick={() => showToast("הגדרת אימות דו-שלבי תהיה זמינה בקרוב", "info")} className="text-blue-600 font-medium hover:text-blue-700">
                הפעלה
              </button>
            </dd>
          </div>
        </dl>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={handleSignOut}>
            התנתקות
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">עזרה</h3>
        <p className="text-sm text-slate-500 mb-4">הפעלה מחדש של אשף ההגדרה הראשוני או של המדריך האינטראקטיבי.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              updateBusiness({ onboarded: false })
              navigate("/onboarding")
            }}
          >
            הפעלה מחדש של אשף ההגדרה
          </Button>
          <Button variant="secondary" onClick={startTutorial}>
            הפעלה מחדש של המדריך
          </Button>
        </div>
      </Card>

      <Card className="p-5 border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-1">אזור מסוכן</h3>
        <p className="text-sm text-slate-500 mb-4">מחיקת החשבון תסיר לצמיתות את כל החשבוניות, הצעות המחיר ונתוני הלקוחות.</p>
        <Button variant="danger" onClick={() => showToast("מחיקת החשבון מחייבת אישור באימייל", "info")}>
          מחיקת החשבון
        </Button>
      </Card>
    </div>
  )
}

function BillingTab() {
  const { showToast } = useToast()
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">תוכנית וחיוב</h3>
        <p className="text-sm text-slate-500 mt-1">אפשר לשדרג בכל עת - כל הנתונים נשארים בדיוק במקומם.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-5 flex flex-col ${plan.highlight ? "border-blue-300 ring-1 ring-blue-100" : ""}`}
          >
            {plan.highlight && (
              <span className="self-start mb-3 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                הכי פופולרית
              </span>
            )}
            <h4 className="text-base font-semibold text-slate-900">{plan.label}</h4>
            <p className="text-sm text-slate-500 mt-0.5">{plan.tagline}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {plan.price}
              <span className="text-sm font-normal text-slate-400"> / לחודש</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.current ? "secondary" : plan.highlight ? "primary" : "secondary"}
              className="mt-5 w-full"
              disabled={plan.current}
              onClick={() => showToast(`נבחרה התוכנית ${plan.label} - התשלום יהיה זמין בקרוב`, "info")}
            >
              {plan.current ? "התוכנית הנוכחית" : plan.upgradeLabel}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

const TEMPLATE_VARIABLES = {
  invoice: [
    "{{business_name}}", "{{business_logo}}", "{{business_email}}", "{{business_address}}",
    "{{client_name}}", "{{client_company}}", "{{client_email}}", "{{client_address}}",
    "{{invoice_number}}", "{{issue_date}}", "{{due_date}}", "{{invoice_items}}",
    "{{subtotal}}", "{{tax}}", "{{discount}}", "{{total}}", "{{notes}}",
  ],
  quote: [
    "{{business_name}}", "{{business_logo}}", "{{business_email}}", "{{business_address}}",
    "{{client_name}}", "{{client_company}}", "{{client_email}}", "{{client_address}}",
    "{{quote_number}}", "{{issue_date}}", "{{expiry_date}}", "{{quote_items}}",
    "{{subtotal}}", "{{tax}}", "{{discount}}", "{{total}}", "{{notes}}",
  ],
} as const

const previewClient: Client = {
  id: "preview",
  name: "ישראל ישראלי",
  company: "סטודיו אקמה בע״מ",
  email: "israel@acme.co.il",
  phone: "050-1234567",
  address: "רחוב הרצל 1, תל אביב",
  createdAt: new Date().toISOString(),
}

const previewItems = [
  { id: "1", description: "שירותי עיצוב", quantity: 2, unitPrice: 450, taxRate: 0 },
  { id: "2", description: "ייעוץ", quantity: 1, unitPrice: 150, taxRate: 18 },
]

function DocumentTemplatesTab() {
  const { business, templates, saveTemplate, resetTemplate } = useData()
  const { showToast } = useToast()
  const [docType, setDocType] = useState<"invoice" | "quote">("invoice")
  const [editorOpen, setEditorOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // The single "code" field: its content adapts to whichever document type
  // is selected above. Both the code and its preview stay hidden until you
  // explicitly open them — nothing renders inline on this page.
  const code = docType === "invoice" ? templates.invoiceHtml : templates.quoteHtml
  const isDefault = code === (docType === "invoice" ? DEFAULT_INVOICE_TEMPLATE : DEFAULT_QUOTE_TEMPLATE)

  function handleReset() {
    resetTemplate(docType)
    showToast("התבנית שוחזרה לברירת המחדל", "info")
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">תבניות מסמכים</h3>
        <p className="text-sm text-slate-500">
          התאמה אישית של קוד ה-HTML/CSS שמשמש להפקת חשבוניות והצעות מחיר ולשליחתן באימייל. JavaScript אינו נתמך
          ויוסר אוטומטית.
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(["invoice", "quote"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDocType(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              docType === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "invoice" ? "חשבונית" : "הצעת מחיר"}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-800">תבנית {docType === "invoice" ? "חשבונית" : "הצעת מחיר"}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDefault ? "בשימוש העיצוב המוגדר כברירת מחדל." : "בשימוש עיצוב מותאם אישית."} הקוד והתצוגה המקדימה נפתחים לפי דרישה.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              תצוגה מקדימה
            </Button>
            <Button variant="primary" onClick={() => setEditorOpen(true)}>
              עריכת קוד
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5 max-w-2xl">
          {TEMPLATE_VARIABLES[docType].map((v) => (
            <code key={v} dir="ltr" className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {v}
            </code>
          ))}
        </div>
        <Button variant="secondary" onClick={handleReset} disabled={isDefault}>
          שחזור ברירת מחדל
        </Button>
      </div>

      {previewOpen && (
        <TemplatePreviewModal docType={docType} code={code} business={business} onClose={() => setPreviewOpen(false)} />
      )}

      {editorOpen && (
        <TemplateCodeEditorModal
          docType={docType}
          initialCode={code}
          business={business}
          onClose={() => setEditorOpen(false)}
          onSave={(html) => {
            saveTemplate(docType, html)
            showToast(`תבנית ${docType === "invoice" ? "החשבונית" : "הצעת המחיר"} נשמרה`)
            setEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}

// A read-only, modern surface for seeing how the current saved template
// renders — opened via the "Preview" button rather than shown inline.
function TemplatePreviewModal({
  docType,
  code,
  business,
  onClose,
}: {
  docType: "invoice" | "quote"
  code: string
  business: ReturnType<typeof useData>["business"]
  onClose: () => void
}) {
  const previewHtml = useMemo(() => renderPreview(docType, code, business), [docType, code, business])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fade-in">
      <Card className="w-full max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            תצוגה מקדימה של תבנית {docType === "invoice" ? "החשבונית" : "הצעת המחיר"}
          </h3>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <iframe title="תצוגה מקדימה של התבנית" srcDoc={previewHtml} sandbox="allow-same-origin" className="w-full h-[70vh] bg-white" />
      </Card>
    </div>
  )
}

function renderPreview(docType: "invoice" | "quote", rawHtml: string, business: ReturnType<typeof useData>["business"]) {
  const safe = sanitizeHtml(rawHtml)
  if (docType === "invoice") {
    return renderInvoiceTemplate(
      safe,
      {
        number: "INV-1001",
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        items: previewItems,
        discount: 0,
        notes: "תודה על שיתוף הפעולה.",
      },
      previewClient,
      business
    )
  }
  return renderQuoteTemplate(
    safe,
    {
      number: "QUO-2001",
      issueDate: new Date().toISOString(),
      expiryDate: new Date().toISOString(),
      items: previewItems,
      discount: 0,
      notes: "הצעת מחיר זו בתוקף ל-14 ימים.",
    },
    previewClient,
    business
  )
}

// A focused, modern editing surface for the template's HTML/CSS — opened
// explicitly via "Edit code" rather than being editable inline on the page.
function TemplateCodeEditorModal({
  docType,
  initialCode,
  business,
  onClose,
  onSave,
}: {
  docType: "invoice" | "quote"
  initialCode: string
  business: ReturnType<typeof useData>["business"]
  onClose: () => void
  onSave: (html: string) => void
}) {
  const [draft, setDraft] = useState(initialCode)
  const previewHtml = useMemo(() => renderPreview(docType, draft, business), [docType, draft, business])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fade-in">
      <Card className="w-full max-w-6xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              עריכת קוד תבנית {docType === "invoice" ? "החשבונית" : "הצעת המחיר"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">השינויים יחולו רק לאחר השמירה.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 min-h-0">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            dir="ltr"
            aria-label="קוד התבנית"
            className="w-full h-[60vh] lg:h-auto resize-none border-0 border-e border-slate-100 bg-slate-900 text-slate-100 font-mono text-xs p-4 outline-none"
          />
          <iframe title="תצוגה מקדימה של התבנית" srcDoc={previewHtml} sandbox="allow-same-origin" className="w-full h-[60vh] lg:h-auto bg-white" />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 max-w-3xl">
            {TEMPLATE_VARIABLES[docType].map((v) => (
              <code key={v} dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {v}
              </code>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={onClose}>
              ביטול
            </Button>
            <Button variant="primary" onClick={() => onSave(draft)}>
              שמירה
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
