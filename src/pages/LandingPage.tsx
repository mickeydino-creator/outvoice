import { Link } from "react-router-dom"

const trustedBy = ["NORTHSTAR", "LUMEN&CO", "ARCFORM", "STUDIO NINE", "GREENFIELD"]

const features = [
  {
    index: "01",
    title: "Move with clarity",
    description: "Know what's owed, what's paid, and what happens next — at a glance.",
  },
  {
    index: "02",
    title: "Keep it together",
    description: "Clients, invoices, quotes, and payments in one calm, connected workspace.",
  },
  {
    index: "03",
    title: "Look like yourself",
    description: "Thoughtful templates and details that make every send feel considered.",
  },
]

const steps = [
  {
    index: "01",
    title: "Add your clients",
    description: "Bring your relationships and contact details into one clean place.",
  },
  {
    index: "02",
    title: "Create an invoice or quote",
    description: "Start with a thoughtful template, then make it unmistakably yours.",
  },
  {
    index: "03",
    title: "Send it and get paid",
    description: "Send with confidence and see exactly when the money lands.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="bg-slate-50 border-b border-slate-100">
        <p className="text-center text-xs font-mono tracking-wide text-slate-500 py-2 px-4">
          <span className="text-blue-600">●</span> Invoxa is the calmer way to run your business{" "}
          <span aria-hidden="true">→</span>
        </p>
      </div>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src="/logo.jpg" alt="Invoxa" className="h-7 w-auto" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Product</a>
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#for-teams" className="hover:text-slate-900">For teams</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Get started <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-mono font-medium tracking-wide text-blue-600 mb-4">
              + INVOICING, WITHOUT THE NOISE
            </p>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Simple invoicing.
              <br />
              <span className="text-blue-600">Built for your business.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 max-w-md">
              Invoices, quotes, clients, and payments — brought together in one beautifully focused workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
                See how it works <span aria-hidden="true">→</span>
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-400">✓ No credit card required &nbsp;|&nbsp; Setup in minutes</p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden bg-white">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 text-xs font-mono text-slate-400">
                <span>invoxa / quickstart</span>
                <span className="flex items-center gap-1 text-emerald-500">● live</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
                  <span>NEW INVOICE</span>
                </div>
                <dl className="space-y-3 text-sm font-mono">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">client</dt>
                    <dd className="text-slate-800">northstar-studio</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">project</dt>
                    <dd className="text-slate-800">brand direction</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">amount</dt>
                    <dd className="text-blue-600 font-semibold">$4,280.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">status</dt>
                    <dd className="text-emerald-500">ready to send</dd>
                  </div>
                </dl>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 text-xs font-mono text-slate-400">
                invoice / INV-00428
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-6 -right-4 items-center gap-3 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 px-4 py-3 animate-fade-in">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Payment received</p>
                <p className="text-slate-400">Northstar Studio · just now</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">+$4,280</span>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-slate-100 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono tracking-wide text-slate-400">BUILT FOR THE WAY YOU WORK</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {trustedBy.map((name) => (
                <span key={name} className="text-sm font-semibold text-slate-300 tracking-wide">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <p className="text-xs font-mono font-medium tracking-wide text-blue-600 mb-4">A BETTER DEFAULT</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-xl">
            Everything you need.
            <br />
            <span className="text-blue-600">Nothing you don't.</span>
          </h2>
          <p className="mt-5 text-slate-500 max-w-md">
            Invoxa makes the operational side of your business feel as clear and intentional as the work itself.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
            {features.map((f) => (
              <div key={f.index} className="bg-slate-50 p-8">
                <span className="text-xs font-mono text-blue-500">{f.index}</span>
                <h3 className="mt-10 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* In sync / code mockup */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-mono font-medium tracking-wide text-blue-600 mb-4">&lt;/&gt; ONE SOURCE OF TRUTH</p>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Your business,
                <br />
                <span className="text-blue-600">in sync.</span>
              </h2>
              <p className="mt-5 text-slate-500 max-w-sm">
                From the first quote to the final payment, Invoxa keeps the details connected so you can keep moving.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Clear by default
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Designed to scale
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Human in every detail
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
              <div className="flex items-center gap-4 px-5 pt-4 text-xs font-mono text-slate-400 border-b border-slate-100 pb-3">
                <span className="text-slate-900 border-b-2 border-blue-600 pb-3 -mb-3">01 invoice.create</span>
                <span>02 quote.send</span>
                <span>03 payment.track</span>
              </div>
              <div className="px-5 py-2 text-xs font-mono text-slate-400 border-b border-slate-100">invoice.create.ts</div>
              <pre className="px-5 py-4 text-xs font-mono leading-6 text-slate-600 overflow-x-auto">
{`const invoice = await invoxa.invoices.create({
  client: "northstar-studio",
  currency: "USD",
  line_items: [
    { description: "Brand direction", amount: 428000 }
  ],
  due_date: "2026-10-24"
});`}
              </pre>
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-mono text-slate-400">
                <span className="text-emerald-500">◷ Ready</span>
                <span>Invoxa API ↗</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
          <p className="text-xs font-mono font-medium tracking-wide text-blue-600 mb-4">A SIMPLER RHYTHM</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            From first hello
            <br />
            <span className="text-blue-600">to paid in full.</span>
          </h2>
          <p className="mt-5 text-slate-500 max-w-md mx-auto">
            Three small steps stand between great work and getting paid for it.
          </p>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-10 text-left">
            {steps.map((step) => (
              <div key={step.index}>
                <p className="text-xs font-mono text-slate-400 mb-3">{step.index}</p>
                <div className="h-14 w-14 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600 mb-5">
                  <StepIcon index={step.index} />
                </div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider strip */}
        <section id="for-teams" className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-800 text-center sm:text-left">
              For freelancers, small teams, and people building what's next.
            </p>
            <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-800">
              See pricing <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="rounded-3xl bg-blue-50/70 border border-blue-100 px-6 py-20 text-center">
            <p className="text-xs font-mono font-medium tracking-wide text-blue-500 mb-4">START WITH A CLEARER DAY</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to simplify
              <br />
              <span className="text-blue-600">your invoicing?</span>
            </h2>
            <p className="mt-5 text-slate-500">Get back to the part of your business you actually love.</p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:shadow-md transition-shadow"
            >
              Get started <span aria-hidden="true">↗</span>
            </Link>
            <p className="mt-4 text-xs text-slate-400">Free to start · No credit card required</p>
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

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function StepIcon({ index }: { index: string }) {
  if (index === "01") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20c1-3.6 3.7-5.5 6.5-5.5s5.5 1.9 6.5 5.5" />
      </svg>
    )
  }
  if (index === "02") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </svg>
    )
  }
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}
