'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '12px', color: '#111', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '100%', boxSizing: 'border-box' as any }
const card = { background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }

export default function Purchases() {
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [supplierName, setSupplierName] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  async function load() {
    const { data: p } = await supabase.from('products').select('*').order('name')
    setProducts(p || [])
    const { data: s } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(s || [])
    const { data: pu } = await supabase.from('purchases').select('*').order('created_at', { ascending: false })
    setPurchases(pu || [])
  }
  useEffect(() => { load() }, [])

  async function addSupplier() {
    if (!newSupplier) return alert('Enter supplier name')
    const { error } = await supabase.from('suppliers').insert({ name: newSupplier, phone: newSupplierPhone || null })
    if (error) return alert(error.message)
    setNewSupplier(''); setNewSupplierPhone(''); setSupplierName(newSupplier)
    load()
  }

  function addToCart(p: any) {
    const ex = cart.find(c => c.id === p.id)
    if (ex) setCart(cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c))
    else setCart([...cart, { id: p.id, name: p.name, cost: Number(p.cost), qty: 1 }])
  }

  const total = cart.reduce((s, c) => s + c.cost * c.qty, 0)

  async function receivePurchase() {
    if (cart.length === 0) return alert('Add at least 1 product')
    if (!supplierName) return alert('Pick a supplier')
    const purchaseNumber = 'PO-' + Date.now().toString().slice(-6)
    const { data: pur, error } = await supabase.from('purchases').insert({
      purchase_number: purchaseNumber, supplier_name: supplierName, total, status: 'received'
    }).select().single()
    if (error || !pur) return alert('Failed: ' + error?.message)

    for (const item of cart) {
      await supabase.from('purchase_items').insert({ purchase_id: pur.id, product_id: item.id, product_name: item.name, qty: item.qty, cost: item.cost, total: item.cost * item.qty })
      const prod = products.find(p => p.id === item.id)
      const newStock = Number(prod.stock) + Number(item.qty)
      // Update stock + update cost price to latest cost if changed
      await supabase.from('products').update({ stock: newStock, cost: item.cost }).eq('id', item.id)
      await supabase.from('stock_movements').insert({ product_id: item.id, change: Number(item.qty), reason: 'Purchase', note: purchaseNumber })
    }
    alert(`Received! Stock added for ${cart.length} products`)
    setCart([]); setSupplierName('')
    load()
  }

  async function viewPurchase(p: any) {
    setSelected(p)
    const { data } = await supabase.from('purchase_items').select('*').eq('purchase_id', p.id)
    setItems(data || [])
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search))

  return (
    <div style={{ color: '#111' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>📦 Purchases</h1>
      <p style={{ color: '#64748b', marginTop: 0 }}>Buy stock from suppliers - stock goes UP automatically.</p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1.5, minWidth: 320 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>New Purchase</h3>
            <label>Supplier</label>
            <input list="sup-list" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Select or type supplier..." style={inputStyle} />
            <datalist id="sup-list">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input placeholder="New supplier name" value={newSupplier} onChange={e => setNewSupplier(e.target.value)} style={inputStyle} />
              <input placeholder="Phone" value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} style={inputStyle} />
              <button onClick={addSupplier} style={{ padding: '12px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Supplier</button>
            </div>

            <input placeholder="Search product to buy..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginTop: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginTop: 10, maxHeight: 300, overflowY: 'auto' }}>
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, cursor: 'pointer', textAlign: 'left' }}>
                  <b>{p.name}</b><br /><small>Stock: {p.stock} | Cost: N${p.cost}</small>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...card, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Purchase History</h3>
            {purchases.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div><b>{p.purchase_number}</b> - {p.supplier_name}<br /><small>{new Date(p.created_at).toLocaleString()}</small></div>
                <div style={{ textAlign: 'right' }}><b>N${Number(p.total).toFixed(2)}</b><br /><button onClick={() => viewPurchase(p)}>View</button></div>
              </div>
            ))}
            {purchases.length === 0 && <p style={{ color: '#94a3b8' }}>No purchases yet.</p>}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300, ...card }}>
          <h3 style={{ marginTop: 0 }}>Receiving Cart ({cart.length})</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div><b>{item.name}</b><br />
                <small>Cost: N$</small>
                <input type="number" value={item.cost} onChange={e => setCart(cart.map(c => c.id === item.id ? { ...c, cost: Number(e.target.value) } : c))} style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => setCart(cart.map(c => c.id === item.id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}>-</button><b>{item.qty}</b>
                <button onClick={() => setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))}>+</button>
                <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} style={{ color: 'red' }}>x</button>
              </div>
              <b>N${(item.cost * item.qty).toFixed(2)}</b>
            </div>
          ))}
          {cart.length === 0 && <p style={{ color: '#94a3b8' }}>Tap a product to add it to this purchase.</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, marginTop: 12 }}><span>Total Cost</span><b style={{ color: '#16a34a' }}>N${total.toFixed(2)}</b></div>
          <button onClick={receivePurchase} style={{ width: '100%', marginTop: 12, padding: 14, background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: '700', cursor: 'pointer' }}>✅ Receive Stock</button>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>This will increase stock + record cost.</p>
        </div>

        {selected && (
          <div style={{ flex: 1, minWidth: 280, ...card }}>
            <h3>📄 {selected.purchase_number}</h3>
            <p>Supplier: {selected.supplier_name}<br />Date: {new Date(selected.created_at).toLocaleString()}</p>
            {items.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>{i.product_name} x {i.qty} @ N${i.cost}</span><b>N${Number(i.total).toFixed(2)}</b></div>)}
            <hr /><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Total</b><b>N${Number(selected.total).toFixed(2)}</b></div>
            <button onClick={() => setSelected(null)} style={{ marginTop: 10 }}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}