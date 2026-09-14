import { useState } from "react"
import PageHeader from "../components/PageHeader"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import { Button, Card, Input, Label, Select } from "../components/ui"

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

export default function Settings() {
  const { business } = useData()
  const { showToast } = useToast()
  const [form, setForm] = useState(business)

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your business profile and plan." />

      <div className="px-4 lg:px-8 pb-16 space-y-8">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Business profile</h3>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              showToast("Business profile saved")
            }}
          >
            <div>
              <Label>Business name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Default currency</Label>
              <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="ILS">ILS — Israeli Shekel</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Business address</Label>
              <Input value={form.address.replace("\n", ", ")} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" variant="primary">
                Save changes
              </Button>
            </div>
          </form>
        </Card>

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
