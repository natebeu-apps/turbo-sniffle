'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }

export default function OrderClient() {
  const [products, setProducts] = useState<any[]>([])
  const [toOrder, setToOrder] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  async function load() {
    const { data } = await supabase.from('products').select('*').order('stock', { ascending: true })
    setProducts(data || [])
  }
  useEffect(() => { load() }, [])

  const low = products.filter(p => Number(p.stock || 0) <= Number(p.reorder_level ?? 5))

  function setQty(id: string, qty: number) {
    setToOrder(prev => ({ ...prev, [id]: qty }))
  }

  function orderText() {
    const lines = low.map(p => {
      const qty = toOrder[p.id] ?? Math.max(10 - Number(p.stock || 0), 1)
      return `- ${p.name} - Need ${qty} - In stock ${p.stock} - Supplier ${p.supplier || 'Unknown'}`
    })
    return `ORDER LIST - ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`
  }

  function copyList() {
    navigator.clipboard.writeText(orderText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function whatsappList() {
    const text = encodeURIComponent(orderText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: 0 }}>Order List - Low Stock</h1>
      <p style={{ color: '#64748b' }}>Everything at or below its reorder level. Set how many to order, then copy or send it.</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={copyList} style={{ padding: '12px 18px', borderRadius: 999, background: '#0f172a', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy List'}</button>
        <button onClick={whatsappList} style={{ padding: '12px 18px', borderRadius: 999, background: '#16a34a', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Send on WhatsApp</button>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Low Stock - {low.length} items</h3>
        {low.length === 0 && <p style={{ color: '#16a34a' }}>All good. No products are below their reorder level.</p>}
        {low.map(p => {
          const qty = toOrder[p.id] ?? Math.max(10 - Number(p.stock || 0), 1)
          return (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <b>{p.name}</b>
                <div style={{ color: '#64748b', fontSize: 13 }}>In stock: {p.stock} - Reorder at: {p.reorder_level ?? 5} - Supplier: {p.supplier || 'Not set'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Order:</span>
                <input type="number" value={qty} min={1} onChange={e => setQty(p.id, Number(e.target.value))} style={{ width: 70, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>Tip: To change when a product shows up here, change its reorder_level in Supabase. To add a supplier, fill the supplier column.</p>
    </div>
  )
}