import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import PageHeader from "../components/PageHeader"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import { useTutorial } from "../store/TutorialContext"
import { useAuth } from "../store/AuthContext"
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui"
import { renderInvoiceTemplate, renderQuoteTemplate } from "../lib/documentTemplates"
import { sanitizeHtml } from "../lib/sanitizeHtml"
import type { Client } from "../types"

const plans = [
  {
    name: "Free",
    price: "$0",
    tagline: "Great for getting started",
    features: ["Up to 5 invoices/month", "Basic invoice templates", "Client management"],
    current: true,
  },
  {
    name: "Pro",
    price: "$15",
    tagline: "For growing freelancers & agencies",
    features: [
      "Unlimited invoices",
      "Quotes",
      "Payment tracking",
      "PDF downloads",
      "Custom branding",
      "Automated reminders",
      "Reports",
    ],
    highlight: true,
  },
  {
    name: "Business",
    price: "$39",
    tagline: "For teams managing multiple businesses",
    features: ["Everything in Pro", "Multiple team members", "Multiple businesses", "Advanced reports", "Priority support"],
  },
]

const tabs = [
  { key: "profile", label: "Business profile" },
  { key: "invoicing", label: "Invoicing" },
  { key: "email", label: "Email settings" },
  { key: "templates", label: "Document Templates" },
  { key: "account", label: "Account" },
  { key: "billing", label: "Plan & billing" },
] as const

type TabKey = (typeof tabs)[number]["key"]

export default function Settings() {
  const [tab, setTab] = useState<TabKey>("profile")

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your business profile, invoicing defaults, and plan." />

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
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Business profile</h3>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("Business profile saved")
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white text-xl font-semibold overflow-hidden">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              form.logoInitial
            )}
          </div>
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Upload logo
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <p className="mt-1.5 text-xs text-slate-400">PNG or JPG, square works best.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Business name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Business type</Label>
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
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Business address</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save changes
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
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Invoicing defaults</h3>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("Invoicing settings saved")
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Invoice number prefix</Label>
            <Input value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
            <p className="mt-1 text-xs text-slate-400">Next invoice will be numbered like {form.invoicePrefix || "INV"}-1044</p>
          </div>
          <div>
            <Label>Default currency</Label>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="ILS">ILS — Israeli Shekel</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
            </Select>
          </div>
          <div>
            <Label>Default payment terms</Label>
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
          </div>
          <div>
            <Label>Tax label</Label>
            <Input value={form.taxLabel} onChange={(e) => setForm({ ...form, taxLabel: e.target.value })} placeholder="Tax, VAT, GST..." />
          </div>
          <div>
            <Label>Default tax rate (%)</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultTaxRate}
              onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label>Default invoice notes / footer</Label>
          <Textarea
            rows={3}
            value={form.invoiceFooter}
            onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
            placeholder="Thank you for your business..."
          />
          <p className="mt-1 text-xs text-slate-400">Appears on every new invoice and quote by default — you can still edit it per document.</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Invoice appearance preview</p>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm overflow-hidden">
              {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" className="h-full w-full object-cover" /> : form.logoInitial}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{form.name || "Your business name"}</p>
              <p className="text-slate-500">Invoice · {form.invoicePrefix || "INV"}-1044 · {form.currency}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save changes
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
      <h3 className="text-sm font-semibold text-slate-800 mb-1">Email settings</h3>
      <p className="text-sm text-slate-500 mb-4">Customize what clients see when you send an invoice by email.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          updateBusiness(form)
          showToast("Email settings saved")
        }}
      >
        <div>
          <Label>Subject line</Label>
          <Input value={form.emailSubjectTemplate} onChange={(e) => setForm({ ...form, emailSubjectTemplate: e.target.value })} />
        </div>
        <div>
          <Label>Email body</Label>
          <Textarea rows={6} value={form.emailBodyTemplate} onChange={(e) => setForm({ ...form, emailBodyTemplate: e.target.value })} />
          <p className="mt-1 text-xs text-slate-400">
            Use placeholders: {"{client}"}, {"{number}"}, {"{total}"}, {"{dueDate}"}, {"{business}"}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Automated payment reminders are a Pro feature. Upgrade to send them automatically before and after the due date.
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save changes
          </Button>
        </div>
      </form>
    </Card>
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
    showToast(error ?? "Password reset link sent", error ? "error" : "info")
  }

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Account</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Full name</dt>
            <dd className="text-slate-800 font-medium">{user?.user_metadata?.full_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Login email</dt>
            <dd className="text-slate-800 font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Password</dt>
            <dd>
              <button onClick={handleSendResetLink} className="text-blue-600 font-medium hover:text-blue-700">
                Send reset link
              </button>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Two-factor authentication</dt>
            <dd>
              <button onClick={() => showToast("Two-factor setup coming soon", "info")} className="text-blue-600 font-medium hover:text-blue-700">
                Enable
              </button>
            </dd>
          </div>
        </dl>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Help</h3>
        <p className="text-sm text-slate-500 mb-4">Replay the initial setup wizard, or the interactive app tutorial.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              updateBusiness({ onboarded: false })
              navigate("/onboarding")
            }}
          >
            Restart onboarding
          </Button>
          <Button variant="secondary" onClick={startTutorial}>
            Replay tutorial
          </Button>
        </div>
      </Card>

      <Card className="p-5 border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-1">Danger zone</h3>
        <p className="text-sm text-slate-500 mb-4">Deleting your account permanently removes all invoices, quotes, and client data.</p>
        <Button variant="danger" onClick={() => showToast("Account deletion requires email confirmation", "info")}>
          Delete account
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
        <h3 className="text-base font-semibold text-slate-900">Plan &amp; billing</h3>
        <p className="text-sm text-slate-500 mt-1">Upgrade anytime — your data stays exactly where it is.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-5 flex flex-col ${plan.highlight ? "border-blue-300 ring-1 ring-blue-100" : ""}`}
          >
            {plan.highlight && (
              <span className="self-start mb-3 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                Most popular
              </span>
            )}
            <h4 className="text-base font-semibold text-slate-900">{plan.name}</h4>
            <p className="text-sm text-slate-500 mt-0.5">{plan.tagline}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {plan.price}
              <span className="text-sm font-normal text-slate-400">/mo</span>
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
              onClick={() => showToast(`${plan.name} plan selected — checkout coming soon`, "info")}
            >
              {plan.current ? "Current plan" : `Upgrade to ${plan.name}`}
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
  name: "Jane Cooper",
  company: "Acme Studio",
  email: "jane@acmestudio.com",
  phone: "+1 (555) 010-0100",
  address: "123 Main St, San Francisco, CA",
  createdAt: new Date().toISOString(),
}

const previewItems = [
  { id: "1", description: "Design services", quantity: 2, unitPrice: 450, taxRate: 0 },
  { id: "2", description: "Consulting", quantity: 1, unitPrice: 150, taxRate: 8.5 },
]

function DocumentTemplatesTab() {
  const { business, templates, saveTemplate, resetTemplate } = useData()
  const { showToast } = useToast()
  const [docType, setDocType] = useState<"invoice" | "quote">("invoice")
  const [draft, setDraft] = useState(templates.invoiceHtml)

  useEffect(() => {
    setDraft(docType === "invoice" ? templates.invoiceHtml : templates.quoteHtml)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType])

  const previewHtml = useMemo(() => {
    const safe = sanitizeHtml(draft)
    if (docType === "invoice") {
      return renderInvoiceTemplate(
        safe,
        {
          number: "INV-1001",
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          items: previewItems,
          discount: 0,
          notes: "Thank you for your business.",
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
        notes: "This quote is valid for 14 days.",
      },
      previewClient,
      business
    )
  }, [draft, docType, business])

  function handleSave() {
    saveTemplate(docType, draft)
    showToast(`${docType === "invoice" ? "Invoice" : "Quote"} template saved`)
  }

  function handleReset() {
    resetTemplate(docType)
    showToast("Reset to default template", "info")
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Document Templates</h3>
        <p className="text-sm text-slate-500">
          Customize the HTML/CSS used when generating and emailing invoices and quotes. JavaScript is not allowed and
          will be stripped automatically.
        </p>
      </div>

      <div className="flex gap-2">
        {(["invoice", "quote"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDocType(t)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium border transition-colors ${
              docType === t ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "invoice" ? "Invoice HTML" : "Quote HTML"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-medium text-slate-500">Code editor</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="w-full h-[420px] resize-none border-0 bg-slate-900 text-slate-100 font-mono text-xs p-4 outline-none"
          />
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-medium text-slate-500">Live preview</div>
          <iframe
            title="Template preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="w-full h-[420px] bg-white"
          />
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5 max-w-3xl">
          {TEMPLATE_VARIABLES[docType].map((v) => (
            <code key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {v}
            </code>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={handleReset}>
            Reset to default
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
