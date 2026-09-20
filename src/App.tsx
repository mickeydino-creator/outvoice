import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import { useData } from "./store/DataContext"
import { useAuth } from "./store/AuthContext"
import { isSupabaseConfigured } from "./lib/supabaseClient"
import LandingPage from "./pages/LandingPage"
import SignUp from "./pages/SignUp"
import SignIn from "./pages/SignIn"
import PublicQuote from "./pages/PublicQuote"
import PublicInvoice from "./pages/PublicInvoice"
import Dashboard from "./pages/Dashboard"
import Invoices from "./pages/Invoices"
import InvoiceEditor from "./pages/InvoiceEditor"
import InvoiceView from "./pages/InvoiceView"
import Quotes from "./pages/Quotes"
import QuoteEditor from "./pages/QuoteEditor"
import QuoteView from "./pages/QuoteView"
import Clients from "./pages/Clients"
import ClientDetail from "./pages/ClientDetail"
import ProductsServices from "./pages/ProductsServices"
import Payments from "./pages/Payments"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import Onboarding from "./pages/Onboarding"

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

function RequireOnboarding() {
  const { business, loading } = useData()
  if (loading) return <LoadingScreen />
  if (!business.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
    </div>
  )
}

function SupabaseSetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-lg font-semibold text-slate-900">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-slate-500">
          Set <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> in your environment
          (see <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code>) and reload.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/q/:id" element={<PublicQuote />} />
      <Route path="/i/:id" element={<PublicInvoice />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<RequireOnboarding />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceEditor />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<QuoteEditor />} />
            <Route path="/quotes/:id" element={<QuoteView />} />
            <Route path="/quotes/:id/edit" element={<QuoteEditor />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/products" element={<ProductsServices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
