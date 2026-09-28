import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState, Input, Label } from "../components/ui"
import { formatCurrency } from "../lib/calc"

export default function Clients() {
  const { clients, clientStats, business, addClient } = useData()
  const { showToast } = useToast()
  const [query, setQuery] = useState("")
  const [params, setParams] = useSearchParams()
  const [showModal, setShowModal] = useState(params.get("new") === "1")

  const filtered = useMemo(() => {
    if (!query) return clients
    const q = query.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }, [clients, query])

  function closeModal() {
    setShowModal(false)
    if (params.get("new")) {
      params.delete("new")
      setParams(params, { replace: true })
    }
  }

  return (
    <div>
      <PageHeader
        title="לקוחות"
        subtitle={`${clients.length} לקוחות`}
        actions={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + הוספת לקוח
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-10 space-y-4">
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="חיפוש לקוחות..." value={query} onChange={(e) => setQuery(e.target.value)} className="ps-9" />
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="עדיין אין לקוחות"
            description="אחרי הוספת הלקוח הראשון אפשר להתחיל להפיק עבורו חשבוניות."
            action={<Button variant="primary" onClick={() => setShowModal(true)}>הוספת לקוח</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => {
              const stats = clientStats(client.id)
              return (
                <Link key={client.id} to={`/clients/${client.id}`}>
                  <Card className="p-5 h-full hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{client.name}</p>
                        <p className="text-xs text-slate-500 truncate">{client.company}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">סך החיובים</p>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {formatCurrency(stats.totalInvoiced, business.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">פתוח לתשלום</p>
                        <p className={`font-medium mt-0.5 ${stats.outstanding > 0 ? "text-amber-600" : "text-slate-700"}`}>
                          {formatCurrency(stats.outstanding, business.currency)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddClientModal
          onClose={closeModal}
          onCreate={(data) => {
            addClient(data)
            showToast(`${data.name} נוסף/ה ללקוחות`)
            closeModal()
          }}
        />
      )}
    </div>
  )
}

function AddClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: { name: string; company: string; email: string; phone: string; address: string }) => void
}) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", address: "" })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900">הוספת לקוח</h3>
        <p className="text-sm text-slate-500 mt-1 mb-5">רק הפרטים הבסיסיים - אפשר להוסיף פרטים נוספים בהמשך.</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.name.trim()) return
            onCreate(form)
          }}
        >
          <div>
            <Label>שם מלא</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ישראל ישראלי" />
          </div>
          <div>
            <Label>חברה</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="סטודיו לדוגמה" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>אימייל</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="israel@example.co.il" />
            </div>
            <div>
              <Label>טלפון</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-1234567" />
            </div>
          </div>
          <div>
            <Label>כתובת</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="רחוב הרצל 1, תל אביב" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" variant="primary">
              הוספת לקוח
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
