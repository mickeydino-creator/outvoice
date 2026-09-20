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
    <div ref={outerRef} className="overflow-hidden rounded-2xl bg-slate-100" style={{ height }}>
      <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  )
}
