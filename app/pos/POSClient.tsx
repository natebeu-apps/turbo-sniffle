'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CartItem = { id: string, name: string, price: number, qty: number, stock: number }

const card = { background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' } as const
const input = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 16, boxSizing: 'border-box' as const }

export default function POSClient() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [payment, setPayment] = useState('Cash')
  const [cashGiven, setCashGiven] = useState('')
  const [discount, setDiscount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSale, setLastSale] = useState<{ total: number, change: number } | null>(null)

  async function load() {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
  }
  useEffect(() => { load() }, [])

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })

  function addToCart(p: any) {
    if (Number(p.stock || 0) <= 0) { setMessage(`${p.name} is out of stock`); return }
    setMessage('')
    setLastSale(null)
    setCart(prev => {
      const found = prev.find(i => i.id === p.id)
      if (found) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: p.id, name: p.name, price: Number(p.price || 0), qty: 1, stock: Number(p.stock || 0) }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const discountAmt = Number(discount || 0)
  const total = Math.max(0, subtotal - discountAmt)
  const cashNum = Number(cashGiven || 0)
  const change = payment === 'Cash' && cashNum > 0 ? Math.max(0, cashNum - total) : 0
  const todaySalesCount = 0

  async function checkout() {
    if (cart.length === 0) return setMessage('Cart is empty. Tap a product to add it.')
    if (payment === 'Cash' && cashNum > 0 && cashNum < total) return setMessage('Cash given is less than total.')
    setLoading(true)
    setMessage('')

    const itemsForDb = cart.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.qty, qty: i.qty, total: i.price * i.qty }))

    const { data: sale, error } = await supabase.from('sales').insert([{
      store_id: '84c7967f-66a2-4813-bfd6-997d849ab5a0',
      total,
      payment_method: payment,
      status: 'completed',
      items: itemsForDb,
      discount: discountAmt,
      cash_given: payment === 'Cash' ? cashNum : null,
      change_given: payment === 'Cash' ? change : null,
    }]).select().single()

    if (error) {
      setLoading(false)
      return setMessage(`Sale failed: ${error.message}`)
    }

    // Try sale_items table if you have it - ignore if it does not exist
    if (sale?.id) {
      await supabase.from('sale_items').insert(cart.map(i => ({
        store_id: '84c7967f-66a2-4813-bfd6-997d849ab5a0',
        sale_id: sale.id,
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        total: i.price * i.qty,
      })))
    }

    // Decrease stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.id)
      if (prod) {
        await supabase.from('products').update({ stock: Number(prod.stock || 0) - item.qty }).eq('id', item.id)
      }
    }

    setLastSale({ total, change })
    setCart([])
    setCashGiven('')
    setDiscount('')
    setLoading(false)
    setMessage('Sale completed')
    load()
  }

  function holdSale() {
    if (cart.length === 0) return
    const held = JSON.parse(localStorage.getItem('held_sales') || '[]')
    held.push({ cart, payment, time: new Date().toLocaleTimeString() })
    localStorage.setItem('held_sales', JSON.stringify(held))
    setCart([])
    setMessage('Sale held. Use Resume Held to bring it back.')
  }

  function resumeHeld() {
    const held = JSON.parse(localStorage.getItem('held_sales') || '[]')
    if (held.length === 0) return setMessage('No held sales.')
    const last = held[held.length - 1]
    setCart(last.cart)
    localStorage.setItem('held_sales', JSON.stringify(held.slice(0, -1)))
    setMessage('Held sale restored.')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Point of Sale</h1>
          <p style={{ color: '#64748b', margin: '4px 0' }}>Search or tap a product, then take payment. Fast checkout for busy counters.</p>
        </div>
        <button onClick={resumeHeld} style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Resume Held Sale</button>
      </div>

      {message && <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: message.includes('failed') || message.includes('less') ? '#fef2f2' : '#f0fdf4', border: '1px solid #e2e8f0' }}>{message}</div>}
      {lastSale && <div style={{ marginTop: 12, padding: '16px', borderRadius: 12, background: '#16a34a', color: 'white', fontWeight: '800' }}>Paid N${lastSale.total.toFixed(2)} - Change to give: N${lastSale.change.toFixed(2)}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div>
          <input style={input} placeholder="Search products by name..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{ padding: '9px 16px', borderRadius: 999, border: '1px solid #e2e8f0', background: category === c ? '#0f172a' : 'white', color: category === c ? 'white' : '#0f172a', fontWeight: '700', cursor: 'pointer' }}>{c}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} style={{ ...card, textAlign: 'left', cursor: 'pointer', opacity: Number(p.stock || 0) <= 0 ? 0.5 : 1 }}>
                <div style={{ fontWeight: '800', fontSize: 15, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{p.category || 'General'} - Stock {p.stock}</div>
                <div style={{ fontSize: 18, fontWeight: '800', marginTop: 8, color: '#16a34a' }}>N${Number(p.price || 0).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: '700', marginTop: 6 }}>Tap to add</div>
              </button>
            ))}
            {filtered.length === 0 && <p style={{ color: '#94a3b8' }}>No products found. Try another search or add a product.</p>}
          </div>
        </div>

        <div style={{ ...card, position: 'sticky', top: 16 }}>
          <h3 style={{ marginTop: 0 }}>Cart - {cart.length} items</h3>
          {cart.length === 0 && <p style={{ color: '#94a3b8' }}>Cart is empty. Tap a product on the left.</p>}
          {cart.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{i.name}</b>
                <div style={{ color: '#64748b', fontSize: 12 }}>N${i.price.toFixed(2)} each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => changeQty(i.id, -1)} style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '800' }}>-</button>
                <b>{i.qty}</b>
                <button onClick={() => changeQty(i.id, 1)} style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '800' }}>+</button>
              </div>
              <b style={{ minWidth: 70, textAlign: 'right' }}>N${(i.price * i.qty).toFixed(2)}</b>
              <button onClick={() => removeItem(i.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>Remove</button>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Subtotal</span><b>N${subtotal.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span>Discount N$</span>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ width: 90, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 18 }}><span>Total Payable</span><b>N${total.toFixed(2)}</b></div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {['Cash', 'Card', 'Transfer'].map(m => (
                <button key={m} onClick={() => setPayment(m)} style={{ flex: 1, padding: '11px', borderRadius: 999, border: '1px solid #e2e8f0', background: payment === m ? '#0f172a' : 'white', color: payment === m ? 'white' : '#0f172a', fontWeight: '700', cursor: 'pointer' }}>{m}</button>
              ))}
            </div>

            {payment === 'Cash' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13, color: '#64748b', fontWeight: '700' }}>Cash Given N$</label>
                <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="Leave blank for exact cash" style={{ ...input, marginTop: 6 }} />
                {cashNum > 0 && <div style={{ marginTop: 8, fontWeight: '800' }}>Change: N${change.toFixed(2)}</div>}
              </div>
            )}

            <button onClick={checkout} disabled={loading || cart.length === 0} style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#16a34a', color: 'white', fontWeight: '800', fontSize: 17, border: 'none', cursor: 'pointer', marginTop: 16, opacity: cart.length === 0 ? 0.5 : 1 }}>{loading ? 'Processing...' : `Pay Now - N$${total.toFixed(2)}`}</button>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={holdSale} style={{ flex: 1, padding: '11px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Hold Sale</button>
              <button onClick={() => { setCart([]); setCashGiven(''); setDiscount('') }} style={{ flex: 1, padding: '11px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Clear Cart</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { div[style*="1fr 360px"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}