import { useState } from "react"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState, Input, Label, Textarea } from "../components/ui"
import { formatCurrency } from "../lib/calc"
import type { Product } from "../types"

export default function ProductsServices() {
  const { products, business, addProduct, updateProduct, deleteProduct } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Product | "new" | null>(null)

  function handleDelete(product: Product) {
    if (confirm(`למחוק את ״${product.name}״?`)) {
      deleteProduct(product.id)
      showToast("הפריט נמחק", "info")
    }
  }

  return (
    <div>
      <PageHeader
        title="מוצרים ושירותים"
        subtitle="שמירת פריטים שחוזרים על עצמם מאפשרת להוסיף אותם לחשבוניות בלחיצה אחת."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            + הוספת פריט
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-10">
        {products.length === 0 ? (
          <EmptyState
            title="עדיין אין מוצרים או שירותים"
            description="הוספת הפריטים הנפוצים ביותר מזרזת את הפקת החשבוניות."
            action={
              <Button variant="primary" onClick={() => setEditing("new")}>
                הוספת הפריט הראשון
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-800">{product.name}</h3>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(product.price, business.currency)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500 flex-1">{product.description || "אין תיאור"}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">שיעור מע״מ: {product.taxRate}%</span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(product)} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      עריכה
                    </button>
                    <button onClick={() => handleDelete(product)} className="text-xs font-medium text-slate-400 hover:text-red-500">
                      מחיקה
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ProductModal
          product={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === "new") {
              addProduct(data)
              showToast("הפריט נוסף")
            } else {
              updateProduct(editing.id, data)
              showToast("הפריט עודכן")
            }
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product
  onClose: () => void
  onSave: (data: Omit<Product, "id">) => void
}) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    taxRate: product?.taxRate ?? 0,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900">{product ? "עריכת פריט" : "הוספת פריט"}</h3>
        <p className="text-sm text-slate-500 mt-1 mb-5">אפשר לבחור בפריט בעת הוספת שורות לחשבונית או להצעת מחיר.</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.name.trim()) return
            onSave(form)
          }}
        >
          <div>
            <Label>שם</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="חבילת עיצוב לוגו" />
          </div>
          <div>
            <Label>תיאור</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תיאור קצר שיופיע בחשבוניות" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>מחיר</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>שיעור מע״מ (%)</Label>
              <Input type="number" min={0} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" variant="primary">
              שמירת פריט
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
