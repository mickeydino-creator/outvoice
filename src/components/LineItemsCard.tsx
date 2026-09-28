import { useData, makeBlankLineItem } from "../store/DataContext"
import { Button, Card, Input, Select } from "./ui"
import { formatCurrency, lineTotal } from "../lib/calc"
import type { LineItem } from "../types"

// Editable list of line items (description, quantity, price, VAT), shared by
// the invoice editor and the recurring invoice editor.
export default function LineItemsCard({ items, onChange }: { items: LineItem[]; onChange: (items: LineItem[]) => void }) {
  const { products, business } = useData()

  function updateItem(itemId: string, patch: Partial<LineItem>) {
    onChange(items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)))
  }

  function addItem() {
    onChange([...items, makeBlankLineItem()])
  }

  function addProductItem(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    onChange([
      ...items,
      { id: `li-${Date.now()}-${Math.random()}`, description: product.name, quantity: 1, unitPrice: product.price, taxRate: product.taxRate, productId: product.id },
    ])
  }

  function removeItem(itemId: string) {
    onChange(items.filter((it) => it.id !== itemId))
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-800">פריטים</h3>
        <div className="flex gap-2">
          {products.length > 0 && (
            <Select
              className="w-56"
              value=""
              onChange={(e) => {
                if (e.target.value) addProductItem(e.target.value)
              }}
            >
              <option value="">+ הוספה ממוצרים ושירותים</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          <Button size="sm" variant="secondary" onClick={addItem}>
            + הוספת פריט
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-slate-400 px-1">
          <div className="col-span-5">תיאור</div>
          <div className="col-span-2">כמות</div>
          <div className="col-span-2">מחיר ליחידה</div>
          <div className="col-span-1">מע״מ %</div>
          <div className="col-span-2 text-end">סכום</div>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
            <div className="col-span-2 sm:col-span-5">
              <Input
                placeholder="לדוגמה: עיצוב זהות מותגית"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-1">
              <Input
                type="number"
                min={0}
                value={item.taxRate}
                onChange={(e) => updateItem(item.id, { taxRate: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(lineTotal(item), business.currency)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
                aria-label="הסרת פריט"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}
