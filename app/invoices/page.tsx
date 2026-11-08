'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('1')

  async function load() {
    const { data: inv } = await supabase.from('invoices').select('*, customers(name)').order('created_at', { ascending: false })
    setInvoices(inv || [])
    const { data: cust } = await supabase.from('customers').select('*')
    setCustomers(cust || [])
    const { data: prod } = await supabase.from('products').select('*')
    setProducts(prod || [])
  }
  useEffect(() => { load() }, [])

  const selectedProduct = products.find(p => p.id === productId)
  const total = selectedProduct ? Number(selectedProduct.price) * (Number(qty) || 1) : 0

  async function addInvoice(e: any) {
    e.preventDefault()
    if (!customerId || !productId) return alert('Pick a customer and a product')
    const { error } = await supabase.from('invoices').insert({
        invoice_number: 'INV-' + Date.now().toString().slice(-6),
        customer_id: customerId,
        product_id: productId,
        quantity: Number(qty) || 1,
        total: total,
        status: 'unpaid'
    })
    if (error) return alert('Save failed: ' + error.message)

    // Reduce stock
    if (selectedProduct) {
      await supabase.from('products').update({ stock: selectedProduct.stock - (Number(qty) || 1) }).eq('id', productId)
    }
    setCustomerId(''); setProductId(''); setQty('1')
    load()
  }

  async function markPaid(id: string) {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id)
    load()
  }

  return (
    <div style={{ color: '#111' }}>
      <h1>Invoices</h1>
      <form onSubmit={addInvoice} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', border: '1px solid #ddd', alignItems: 'center' }}>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={inputStyle}>
          <option value="">Select Customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={productId} onChange={e => setProductId(e.target.value)} style={inputStyle}>
          <option value="">Select Product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} - N${p.price} (Stock: {p.stock})</option>)}
        </select>
        <input placeholder="Qty" type="number" value={qty} onChange={e => setQty(e.target.value)} style={{ ...inputStyle, width: '80px' }} />
        <b>Total: N${total}</b>
        <button style={{ padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Invoice</button>
      </form>

      <div style={{ display: 'grid', gap: '10px' }}>
        {invoices.map(inv => (
          <div key={inv.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b>{inv.customers?.name || 'Customer'}</b> — N${inv.total} — Qty: {inv.quantity}<br />
              <span style={{ color: '#555', fontSize: '13px' }}>{new Date(inv.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span style={{ padding: '4px 10px', borderRadius: '20px', background: inv.status === 'paid' ? '#d4edda' : '#f8d7da', color: inv.status === 'paid' ? '#155724' : '#721c24', marginRight: '10px' }}>{inv.status}</span>
              {inv.status !== 'paid' && <button onClick={() => markPaid(inv.id)} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Paid</button>}
            </div>
          </div>
        ))}
        {invoices.length === 0 && <p>No invoices yet.</p>}
      </div>
    </div>
  )
}