'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }
const btn = { padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }

type CartItem = { id: string, name: string, price: number, cost: number, stock: number, qty: number }

export default function POS() {
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [customerName, setCustomerName] = useState('Walk-in')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [tendered, setTendered] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)

  async function load() {
    const { data: prod } = await supabase.from('products').select('*').order('name')
    setProducts(prod || [])
    const { data: cust } = await supabase.from('customers').select('*').order('name')
    setCustomers(cust || [])
  }
  useEffect(() => { load() }, [])

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))]

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    const match = p.name.toLowerCase().includes(s) || (p.barcode || '').includes(search)
    const cat = categoryFilter === 'All' || (p.category || 'General') === categoryFilter
    return match && cat
  })

  function addToCart(p: any) {
    if (Number(p.stock) <= 0) return alert(`${p.name} is out of stock`)
    const existing = cart.find(c => c.id === p.id)
    if (existing) {
      if (existing.qty + 1 > Number(p.stock)) return alert('Not enough stock')
      setCart(cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { id: p.id, name: p.name, price: Number(p.price), cost: Number(p.cost), stock: Number(p.stock), qty: 1 }])
    }
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const discountVal = Number(discount) || 0
  const total = Math.max(0, subtotal - discountVal)
  const tenderedVal = Number(tendered) || 0
  const changeDue = paymentMethod === 'Cash' ? Math.max(0, tenderedVal - total) : 0

  async function checkout() {
    if (cart.length === 0) return alert('Cart is empty')
    if (paymentMethod === 'Cash' && tenderedVal < total) return alert(`Cash tendered N$${tenderedVal} is less than total N$${total}`)
    setLoading(true)

    const saleNumber = 'SALE-' + Date.now().toString().slice(-6)

    const { data: sale, error: saleErr } = await supabase.from('sales').insert({
      sale_number: saleNumber,
      customer_name: customerName || 'Walk-in',
      subtotal, discount: discountVal, total,
      payment_method: paymentMethod,
      amount_tendered: paymentMethod === 'Cash' ? tenderedVal : total,
      change_due: changeDue,
      status: 'completed'
    }).select().single()

    if (saleErr || !sale) { setLoading(false); return alert('Sale failed: ' + saleErr?.message) }

    // Save items + deduct stock
    for (const item of cart) {
      await supabase.from('sale_items').insert({
        sale_id: sale.id, product_id: item.id, product_name: item.name,
        qty: item.qty, price: item.price, cost: item.cost, total: item.price * item.qty
      })
      const prod = products.find(p => p.id === item.id)
      const newStock = Number(prod.stock) - item.qty
      await supabase.from('products').update({ stock: newStock }).eq('id', item.id)
      await supabase.from('stock_movements').insert({
        product_id: item.id, change: -item.qty, reason: 'Sale', note: saleNumber
      })
    }

    setLastSale({ ...sale, items: cart })
    setCart([]); setDiscount(''); setTendered(''); setCustomerName('Walk-in')
    setLoading(false)
    load()
  }

  return (
    <div style={{ color: '#111', padding: 16, maxWidth: 1200, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>POS / Till</h1>
      <p><a href="/">← Dashboard</a> | <a href="/products">Products</a> | <a href="/sales">Sales History →</a></p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT: PRODUCTS */}
        <div style={{ flex: 2, minWidth: 320 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input placeholder="Search name / barcode..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={Number(p.stock) <= 0}
                style={{ background: Number(p.stock) <= 0 ? '#eee' : 'white', border: '1px solid #ddd', borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'left' }}>
                <b>{p.name}</b><br />
                <small>{p.category || 'General'}</small><br />
                <b style={{ color: 'green' }}>N${p.price}</b><br />
                <small>{Number(p.stock) <= 0 ? '🔴 Out' : `Stock: ${p.stock}`}</small>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p>No products found. Add some in Products first.</p>}
        </div>

        {/* RIGHT: CART */}
        <div style={{ flex: 1, minWidth: 300, background: 'white', border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Cart ({cart.length})</h3>

          <label>Customer</label>
          <input list="cust-list" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in" style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
          <datalist id="cust-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>

          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div><b>{item.name}</b><br /><small>N${item.price} each</small></div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => setCart(cart.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}>-</button>
                <b>{item.qty}</b>
                <button onClick={() => { if (item.qty + 1 > item.stock) return alert('Not enough stock'); setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)) }}>+</button>
                <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} style={{ color: 'red' }}>x</button>
              </div>
              <b>N${(item.price * item.qty).toFixed(2)}</b>
            </div>
          ))}
          {cart.length === 0 && <p style={{ color: '#888' }}>Tap a product to add it here.</p>}

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><b>N${subtotal.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
              <span>Discount N$</span>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ ...inputStyle, width: 100 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}><span>Total</span><b>N${total.toFixed(2)}</b></div>
          </div>

          <label style={{ display: 'block', marginTop: 12 }}>Payment Method</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
            {['Cash', 'Card', 'EFT', 'Mobile Money'].map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #999', background: paymentMethod === m ? '#111' : 'white', color: paymentMethod === m ? 'white' : '#111', cursor: 'pointer' }}>{m}</button>
            ))}
          </div>

          {paymentMethod === 'Cash' && (
            <>
              <label>Cash Tendered N$</label>
              <input type="number" value={tendered} onChange={e => setTendered(e.target.value)} placeholder="e.g. 100" style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
              <p>Change Due: <b>N${changeDue.toFixed(2)}</b></p>
            </>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCart([])} style={{ ...btn, background: '#eee', color: '#111', flex: 1 }}>Clear</button>
            <button onClick={checkout} disabled={loading || cart.length === 0} style={{ ...btn, flex: 2, background: 'green' }}>{loading ? 'Processing...' : `Charge N$${total.toFixed(2)}`}</button>
          </div>
        </div>
      </div>

      {lastSale && (
        <div style={{ marginTop: 20, background: '#e8f5e9', padding: 16, borderRadius: 10, border: '1px solid #a5d6a7' }}>
          <h3>✅ Sale Complete - {lastSale.sale_number}</h3>
          <p>Customer: {lastSale.customer_name} | Payment: {lastSale.payment_method} | Total: <b>N${Number(lastSale.total).toFixed(2)}</b>
          {lastSale.payment_method === 'Cash' && <> | Change: N${Number(lastSale.change_due).toFixed(2)}</>}</p>
          <ul>{lastSale.items.map((i: any) => <li key={i.id}>{i.name} x {i.qty} = N${(i.price * i.qty).toFixed(2)}</li>)}</ul>
          <p>Stock has been deducted. <a href="/products">Check Products →</a></p>
        </div>
      )}
    </div>
  )
}