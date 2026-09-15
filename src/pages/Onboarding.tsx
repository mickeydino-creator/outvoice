import { useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useTutorial } from "../store/TutorialContext"
import { Button, Input, Select } from "../components/ui"

const steps = ["Business name", "Business type", "Country", "Currency", "Logo", "Payment terms"]

export default function Onboarding() {
  const { business, completeOnboarding } = useData()
  const { start: startTutorial, hasSeenTutorial } = useTutorial()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    businessType: "Freelancer",
    country: "United States",
    currency: "USD",
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
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            IF
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">InvoiceFlow</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-slate-100"}`} />
            ))}
          </div>

          <p className="text-xs font-medium text-blue-600 mb-1">
            Step {step + 1} of {steps.length}
          </p>

          {step === 0 && (
            <StepShell title="What's your business called?" subtitle="This will appear on your invoices and quotes.">
              <Input
                autoFocus
                placeholder="e.g. Northwind Creative Agency"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="What type of business do you run?" subtitle="We'll tailor invoice templates to fit.">
              <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                <option>Freelancer</option>
                <option>Design & Creative Agency</option>
                <option>Marketing Agency</option>
                <option>Development / IT Services</option>
                <option>Photography</option>
                <option>Consulting</option>
                <option>Home & Repair Services</option>
                <option>Other</option>
              </Select>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Where's your business based?" subtitle="Helps us set sensible defaults for tax and formatting.">
              <Input
                autoFocus
                placeholder="e.g. United States"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="What currency do you bill in?" subtitle="You can change this anytime in Settings.">
              <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="ILS">ILS — Israeli Shekel</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
              </Select>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Add your logo" subtitle="Optional — you can always add this later.">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 text-white text-xl font-semibold overflow-hidden">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    form.name.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                  Upload logo
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="Default payment terms" subtitle="Applied to new invoices automatically — you can override any time.">
              <Select
                value={form.defaultPaymentTerms}
                onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
              >
                <option>Due on receipt</option>
                <option>Net 7</option>
                <option>Net 14</option>
                <option>Net 30</option>
                <option>Net 60</option>
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
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" variant="primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" variant="primary" disabled={!canContinue} onClick={handleFinish}>
                Go to dashboard
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
