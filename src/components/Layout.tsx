import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useAuth } from "../store/AuthContext"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon, end: true },
  { to: "/invoices", label: "Invoices", icon: InvoiceIcon },
  { to: "/quotes", label: "Quotes", icon: QuoteIcon },
  { to: "/clients", label: "Clients", icon: ClientsIcon },
  { to: "/products", label: "Products & Services", icon: ProductIcon },
  { to: "/payments", label: "Payments", icon: PaymentIcon },
  { to: "/reports", label: "Reports", icon: ReportIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

const mobilePrimary = navItems.slice(0, 3)
const mobileMore = navItems.slice(3)

export default function Layout() {
  const { business } = useData()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex items-center px-6 h-16 border-b border-slate-100">
          <img src="/logo.jpg" alt="Invoxa" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-700">Free plan</p>
          <p className="mt-1 text-xs text-slate-500">3 of 5 invoices used this month.</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-blue-100">
            <div className="h-1.5 w-3/5 rounded-full bg-blue-600" />
          </div>
          <button
            onClick={() => navigate("/settings?upgrade=1")}
            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Upgrade to Pro
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-sm font-semibold overflow-hidden">
            {business.logoDataUrl ? (
              <img src={business.logoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              business.logoInitial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{business.name}</p>
            <p className="truncate text-xs text-slate-500">{business.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {mobilePrimary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-slate-500"
          >
            <MoreIcon className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-900/40 animate-fade-in" onClick={() => setMoreOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-white p-4 pb-8 animate-toast-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="grid grid-cols-3 gap-3">
              {mobileMore.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-xs font-medium ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 bg-slate-50"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-center leading-tight">{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setMoreOpen(false)
                  handleSignOut()
                }}
                className="flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-xs font-medium text-red-500 bg-red-50"
              >
                <LogoutIcon className="h-5 w-5" />
                <span className="text-center leading-tight">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  )
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 8c0-1.7 1.3-3 3-3M7 8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H8" />
      <path d="M15 8c0-1.7 1.3-3 3-3M15 8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-2" />
      <path d="M4 19h16" />
    </svg>
  )
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c1-3.6 3.7-5.5 6.5-5.5s5.5 1.9 6.5 5.5" />
      <circle cx="17" cy="8" r="2.6" />
      <path d="M16 14.7c2.4.3 4.3 2.1 5 5.3" />
    </svg>
  )
}

function ProductIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
  )
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 14.5h4" />
    </svg>
  )
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V9M10 19V5M16 19v-7M4 19h16" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}
