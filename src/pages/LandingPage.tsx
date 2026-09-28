import { Link } from "react-router-dom"

const features = [
  {
    title: "כל מה שמגיע לכם, במבט אחד",
    description: "מרכז בקרה אחד מציג כל חשבונית, הצעת מחיר וסטטוס תשלום, בלי לחפור בשרשורי מיילים.",
    span: "lg:col-span-2",
  },
  {
    title: "תבניות שנראות בדיוק כמוכם",
    description: "הלוגו, הצבעים והטון שלכם, בכל מסמך שיוצא מהעסק.",
    span: "",
  },
  {
    title: "תזכורות עדינות, שנשלחות בשבילכם",
    description: "חשבוניות באיחור מקבלות מעקב אוטומטי, כך שאין צורך לנהל את השיחה הלא נעימה הזאת.",
    span: "",
  },
  {
    title: "מקום אחד לכל הלקוחות",
    description: "אנשי קשר, היסטוריה ומסמכים יושבים יחד, ושום דבר לא הולך לאיבוד בין פרויקט לפרויקט.",
    span: "lg:col-span-2",
  },
]

const steps = [
  {
    title: "מוסיפים את הלקוחות",
    description: "כל הקשרים ופרטי ההתקשרות שלכם, מסודרים במקום אחד נקי.",
  },
  {
    title: "יוצרים חשבונית או הצעת מחיר",
    description: "מתחילים מתבנית מוקפדת, ומתאימים אותה כך שתהיה שלכם לגמרי.",
  },
  {
    title: "שולחים, ונושמים לרווחה",
    description: "עוקבים אחרי צפיות ותשלומים, והתזכורות כבר דואגות למעקב.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="bg-blue-600 text-white">
        <p className="text-center text-xs sm:text-sm font-medium py-2 px-4">
          Invoxa היא הדרך הרגועה לנהל את העסק שלכם <span aria-hidden="true">←</span>
        </p>
      </div>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="Invoxa" className="h-7 w-auto" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">המוצר</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">איך זה עובד</a>
            <a href="#for-teams" className="hover:text-slate-900 transition-colors">לצוותים</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              התחברות
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 active:scale-[0.97] transition-all"
            >
              התחילו בחינם
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 mb-5">
              נבנה לפרילנסרים ולצוותים קטנים
            </p>
            <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl sm:leading-[1.05] font-extrabold tracking-tight text-balance">
              לקבל את הכסף
              <br className="hidden sm:block" /> בלי לרדוף אחריו.
            </h1>
            <p className="mt-6 text-lg text-slate-500 max-w-md text-pretty">
              חשבוניות, הצעות מחיר, לקוחות ותשלומים, הכול בסביבת עבודה אחת רגועה וממוקדת, שבנויה בדיוק לאופן שבו אתם עובדים.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                התחילו בחינם
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                איך זה עובד
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-400">בלי כרטיס אשראי · מוכנים לעבודה תוך דקות</p>
          </div>

          <div className="relative sm:pb-14">
            <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden bg-white">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-400">חשבונית INV-00428</p>
                  <p className="text-sm font-semibold text-slate-900">סטודיו טבע</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> שולמה
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">כיוון מותגי וזהות חזותית</span>
                  <span className="text-slate-700 font-medium">3,200.00 ₪</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">הקמת מערכת עיצוב</span>
                  <span className="text-slate-700 font-medium">1,080.00 ₪</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">סה״כ</span>
                  <span className="text-lg font-bold text-blue-600">4,280.00 ₪</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute bottom-0 -start-6 translate-y-[calc(100%+1rem)] items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 px-4 py-3 animate-fade-in">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm">✓</span>
              <div className="text-xs">
                <p className="font-semibold text-slate-800">התשלום התקבל</p>
                <p className="text-slate-400">ממש עכשיו · 4,280.00 ₪</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features - bento grid */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <p className="text-xs font-semibold tracking-wide text-blue-600 mb-4">ברירת מחדל טובה יותר</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-xl text-balance">
            כל מה שצריך. בלי שום דבר מיותר.
          </h2>
          <p className="mt-5 text-slate-500 max-w-md">
            Invoxa מטפלת בצד התפעולי של העסק, כדי שירגיש ברור ומדויק בדיוק כמו העבודה עצמה.
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
            <p className="text-xs font-semibold tracking-wide text-blue-400 mb-4">קצב פשוט יותר</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-lg text-balance">
              מהשלום הראשון ועד התשלום המלא.
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            <p className="text-sm font-semibold text-slate-800">
              לפרילנסרים, לצוותים קטנים ולכל מי שבונה את הדבר הבא.
            </p>
            <Link to="/signup" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              התחילו בחינם <span aria-hidden="true">←</span>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section id="get-started" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="rounded-3xl bg-blue-600 px-6 sm:px-10 py-16 sm:py-20 text-center text-white">
            <p className="text-xs font-semibold tracking-wide text-blue-200 mb-4">מתחילים יום צלול יותר</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
              מוכנים לפשט את הפקת החשבוניות?
            </h2>
            <p className="mt-5 text-blue-100">חזרו לחלק בעסק שאתם באמת אוהבים.</p>
            <Link
              to="/signup"
              className="mt-9 inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 hover:bg-blue-50 active:scale-[0.98] transition-all"
            >
              התחילו בחינם
            </Link>
            <p className="mt-4 text-xs text-blue-200">חינם להתחלה · בלי כרטיס אשראי</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <img src="/logo.png" alt="Invoxa" className="h-6 w-auto mb-3" />
            <p className="text-sm text-slate-400 max-w-xs">הדרך הרגועה לנהל את העסק.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-3">המוצר</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#features" className="hover:text-slate-800">יכולות</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-800">איך זה עובד</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-3">חשבון</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/login" className="hover:text-slate-800">התחברות</Link></li>
              <li><Link to="/signup" className="hover:text-slate-800">יצירת חשבון</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-6">
          <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} Invoxa. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  )
}
