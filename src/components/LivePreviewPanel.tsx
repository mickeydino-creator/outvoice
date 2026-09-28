import { useEffect, useRef, useState, type ReactNode } from "react"

export default function LivePreviewPanel({ children, width = 768 }: { children: ReactNode; width?: number }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    function update() {
      if (!outer || !inner) return
      const containerWidth = outer.clientWidth
      const nextScale = containerWidth > 0 ? Math.min(1, containerWidth / width) : 1
      setScale(nextScale)
      setHeight(inner.offsetHeight * nextScale)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [width])

  return (
    // The outer box is forced LTR so the oversized inner document anchors to the left edge
    // and scales from top-left; the document itself keeps the page's RTL direction.
    <div ref={outerRef} dir="ltr" className="overflow-hidden rounded-2xl bg-slate-100" style={{ height }}>
      <div ref={innerRef} dir="rtl" style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  )
}
