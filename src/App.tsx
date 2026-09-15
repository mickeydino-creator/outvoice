import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import { useData } from "./store/DataContext"
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

function RequireOnboarding() {
  const { business } = useData()
  if (!business.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<RequireOnboarding />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
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
    </Routes>
  )
}
