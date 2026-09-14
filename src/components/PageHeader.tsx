import type { ReactNode } from "react"

export default function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  back?: ReactNode
}) {
  return (
    <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur border-b border-slate-200/70 px-4 lg:px-8 py-5 lg:py-6 mb-2">
      {back}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
