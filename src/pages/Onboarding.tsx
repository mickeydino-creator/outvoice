import { useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useTutorial } from "../store/TutorialContext"
import { Button, Input, Select } from "../components/ui"

const steps = ["שם העסק", "סוג העסק", "מדינה", "מטבע", "לוגו", "תנאי תשלום"]

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

export default function Onboarding() {
  const { business, completeOnboarding } = useData()
  const { start: startTutorial, hasSeenTutorial } = useTutorial()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    businessType: "Freelancer",
    country: "ישראל",
    currency: "ILS",
    logoDataUrl: undefined as string | undefined,
    logoInitial: "?",
    defaultPaymentTerms: "Net 14",
  })

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const canContinue = [
    form.name.trim().length > 0,
    !!form.businessType,
    form.country.trim().length > 0,
    !!form.currency,
    true,
    !!form.defaultPaymentTerms,
  ][step]

  function handleFinish() {
    completeOnboarding({
      ...business,
      name: form.name,
      businessType: form.businessType,
      country: form.country,
      currency: form.currency,
      logoDataUrl: form.logoDataUrl,
      logoInitial: form.name.charAt(0).toUpperCase() || "?",
      defaultPaymentTerms: form.defaultPaymentTerms,
    })
    if (!hasSeenTutorial) {
      startTutorial()
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.jpg" alt="Invoxa" className="h-8 w-auto" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-slate-100"}`} />
            ))}
          </div>

          <p className="text-xs font-medium text-blue-600 mb-1">
            שלב {step + 1} מתוך {steps.length}
          </p>

          {step === 0 && (
            <StepShell title="מה שם העסק?" subtitle="השם יופיע על החשבוניות והצעות המחיר.">
              <Input
                autoFocus
                placeholder="לדוגמה: סטודיו צפון לעיצוב"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="באיזה סוג עסק מדובר?" subtitle="נתאים את תבניות החשבוניות לתחום שלך.">
              <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="היכן העסק פועל?" subtitle="כך נוכל להגדיר ברירות מחדל מתאימות למע״מ ולתצוגה.">
              <Input
                autoFocus
                placeholder="לדוגמה: ישראל"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="באיזה מטבע מתבצע החיוב?" subtitle="אפשר לשנות זאת בכל עת בהגדרות.">
              <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="ILS">ILS (₪) - שקל חדש</option>
                <option value="USD">USD - דולר אמריקאי</option>
                <option value="EUR">EUR - אירו</option>
                <option value="GBP">GBP - לירה שטרלינג</option>
                <option value="CAD">CAD - דולר קנדי</option>
                <option value="AUD">AUD - דולר אוסטרלי</option>
              </Select>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="הוספת לוגו" subtitle="אופציונלי - אפשר להוסיף גם בהמשך.">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 text-white text-xl font-semibold overflow-hidden">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="לוגו" className="h-full w-full object-cover" />
                  ) : (
                    form.name.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                  העלאת לוגו
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="תנאי תשלום ברירת מחדל" subtitle="יחולו אוטומטית על חשבוניות חדשות - אפשר לשנות בכל חשבונית.">
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
            </StepShell>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={step === 0 ? "invisible" : ""}
            >
              חזרה
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" variant="primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                המשך
              </Button>
            ) : (
              <Button type="button" variant="primary" disabled={!canContinue} onClick={handleFinish}>
                מעבר ללוח הבקרה
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1 mb-4">{subtitle}</p>
      {children}
    </div>
  )
}
