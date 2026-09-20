import { Link } from "react-router-dom"

const trustedBy = ["Northstar Studio", "Lumen & Co", "Arcform", "Studio Nine", "Greenfield"]

const features = [
  {
    title: "See what's owed, instantly",
    description: "A single dashboard shows every invoice, quote, and payment status — no digging through email threads.",
    span: "lg:col-span-2",
  },
  {
    title: "Templates that look like you",
    description: "Your logo, your colors, your tone — on every document you send.",
    span: "",
  },
  {
    title: "Gentle reminders, sent for you",
    description: "Overdue invoices follow up automatically, so you don't have to have that conversation.",
    span: "",
  },
  {
    title: "One place for every client",
    description: "Contacts, history, and documents live together — nothing gets lost between projects.",
    span: "lg:col-span-2",
  },
]

const steps = [
  {
    title: "Add your clients",
    description: "Bring your relationships and contact details into one clean place.",
  },
  {
    title: "Create an invoice or quote",
    description: "Start from a thoughtful template, then make it unmistakably yours.",
  },
  {
    title: "Send it, then relax",
    description: "Track opens and payments, and let reminders handle the follow-up.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="bg-blue-600 text-white">
        <p className="text-center text-xs sm:text-sm font-medium py-2 px-4">
          Invoxa is the calmer way to run your business <span aria-hidden="true">→</span>
        </p>
      </div>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src="/logo.jpg" alt="Invoxa" className="h-7 w-auto" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#for-teams" className="hover:text-slate-900 transition-colors">For teams</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 active:scale-[0.97] transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 mb-5">
              Built for freelancers &amp; small teams
            </p>
            <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl sm:leading-[1.05] font-extrabold tracking-tight text-balance">
              Get paid without
              <br className="hidden sm:block" /> the chasing.
            </h1>
            <p className="mt-6 text-lg text-slate-500 max-w-md text-pretty">
              Invoices, quotes, clients, and payments — brought together in one calm, focused workspace built for how you actually work.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-400">No credit card required · Set up in minutes</p>
          </div>

          <div className="relative sm:pb-14">
            <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden bg-white">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-400">Invoice INV-00428</p>
                  <p className="text-sm font-semibold text-slate-900">Northstar Studio</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Paid
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Brand direction &amp; identity</span>
                  <span className="text-slate-700 font-medium">$3,200.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Design system setup</span>
                  <span className="text-slate-700 font-medium">$1,080.00</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Total</span>
                  <span className="text-lg font-bold text-blue-600">$4,280.00</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute bottom-0 -left-6 translate-y-[calc(100%+1rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 px-4 py-3 animate-fade-in">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm">✓</span>
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Payment received</p>
                <p className="text-slate-400">Just now · $4,280.00</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-slate-100 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-semibold tracking-wide text-slate-400 mb-6">TRUSTED BY INDEPENDENT BUSINESSES LIKE</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {trustedBy.map((name) => (
                <span key={name} className="text-sm font-semibold text-slate-300">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features - bento grid */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <p className="text-xs font-semibold tracking-wide text-blue-600 mb-4">A BETTER DEFAULT</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-xl text-balance">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-5 text-slate-500 max-w-md">
            Invoxa handles the operational side of your business so it feels as clear and intentional as the work itself.
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className={f.span}>
                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50/60 p-7 sm:p-8 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-500 leading-relaxed max-w-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <p className="text-xs font-semibold tracking-wide text-blue-400 mb-4">A SIMPLER RHYTHM</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-lg text-balance">
              From first hello to paid in full.
            </h2>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
              {steps.map((step, i) => (
                <div key={step.title}>
                  <p className="text-4xl font-extrabold text-slate-700 mb-4">0{i + 1}</p>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For teams strip */}
        <section id="for-teams" className="border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-800">
              For freelancers, small teams, and people building what's next.
            </p>
            <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              See pricing <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="rounded-3xl bg-blue-600 px-6 sm:px-10 py-16 sm:py-20 text-center text-white">
            <p className="text-xs font-semibold tracking-wide text-blue-200 mb-4">START WITH A CLEARER DAY</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
              Ready to simplify your invoicing?
            </h2>
            <p className="mt-5 text-blue-100">Get back to the part of your business you actually love.</p>
            <Link
              to="/signup"
              className="mt-9 inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 hover:bg-blue-50 active:scale-[0.98] transition-all"
            >
              Get started free
            </Link>
            <p className="mt-4 text-xs text-blue-200">Free to start · No credit card required</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <img src="/logo.jpg" alt="Invoxa" className="h-6 w-auto mb-3" />
            <p className="text-sm text-slate-400 max-w-xs">The calmer way to run your business.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#features" className="hover:text-slate-800">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-800">How it works</a></li>
              <li><a href="#pricing" className="hover:text-slate-800">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-3">Account</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/login" className="hover:text-slate-800">Sign in</Link></li>
              <li><Link to="/signup" className="hover:text-slate-800">Create account</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-6">
          <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} Invoxa, Inc.</p>
        </div>
      </footer>
    </div>
  )
}
