'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '12px', color: '#111', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  async function load() {
    const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
    setSales(data || [])
  }
  useEffect(() => { load() }, [])

  const filtered = sales.filter(s =>
    (s.sale_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.payment_method || '').toLowerCase().includes(search.toLowerCase())
  )

  const todaySales = sales.filter(s => s.status !== 'refunded')
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0)
  const todayProfit = 0 // we calculate profit in detail view below

  async function viewSale(s: any) {
    setSelected(s)
    const { data } = await supabase.from('sale_items').select('*').eq('sale_id', s.id)
    setItems(data || [])
  }

  async function refundSale() {
    if (!selected) return
    if (!confirm(`Refund ${selected.sale_number} - N$${selected.total}?\nStock will be returned.`)) return

    // 1. Return stock for each item
    for (const item of items) {
      if (!item.product_id) continue
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      if (prod) {
        await supabase.from('products').update({ stock: Number(prod.stock) + Number(item.qty) }).eq('id', item.product_id)
        await supabase.from('stock_movements').insert({
          product_id: item.product_id, change: Number(item.qty), reason: 'Refund', note: selected.sale_number
        })
      }
    }
    // 2. Mark sale as refunded
    await supabase.from('sales').update({ status: 'refunded' }).eq('id', selected.id)
    alert('Refunded - stock returned')
    setSelected(null); setItems([])
    load()
  }

  function printReceipt() {
    window.print()
  }

  function getReceiptText() {
    if (!selected) return ''
    let text = `RECEIPT - ${selected.sale_number}\n`
    text += `Customer: ${selected.customer_name}\n`
    text += `Date: ${new Date(selected.created_at).toLocaleString()}\n\n`
    items.forEach(i => { text += `${i.product_name} x ${i.qty} = N$${Number(i.total).toFixed(2)}\n` })
    text += `\nTotal: N$${Number(selected.total).toFixed(2)}\nPayment: ${selected.payment_method}\n`
    if (selected.payment_method === 'Cash') text += `Tendered: N$${Number(selected.amount_tendered).toFixed(2)} | Change: N$${Number(selected.change_due).toFixed(2)}\n`
    if (selected.status === 'refunded') text += `\n*** REFUNDED ***\n`
    text += `\nThank you!`
    return text
}

function shareWhatsApp() {
  if (!selected) return
  // web.whatsapp.com works on PC, wa.me works on phone
  const text = getReceiptText()
  window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
}

async function copyReceipt() {
  const text = getReceiptText()
  try {
     await navigator.clipboard.writeText(text)
    alert('Receipt copied! Paste it in WhatsApp / SMS')
  } catch {
    alert(text)
  }
}

const profitForSelected = selected?.status === 'refunded' ? 0 : items.reduce((sum, i) => sum + (Number(i.price) - Number(i.cost)) * Number(i.qty), 0)

  return (
    <div style={{ color: '#111' }}>
      <h1>Sales History</h1>
      <p><a href="/">← Dashboard</a> | <a href="/pos">→ Open POS Till</a></p>

      <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
        <div style={{ background: 'white', padding: 15, borderRadius: 8, border: '1px solid #ddd', flex: 1 }}>
          <small>Total Sales (not refunded)</small><h2 style={{ color: 'green', margin: '5px 0' }}>N${todayTotal.toFixed(2)}</h2>
        </div>
        <div style={{ background: 'white', padding: 15, borderRadius: 8, border: '1px solid #ddd', flex: 1 }}>
          <small>Number of Sales</small><h2 style={{ margin: '5px 0' }}>{todaySales.length}</h2>
        </div>
      </div>

      <input placeholder="Search sale no / customer / payment..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 15 }} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LIST */}
        <table style={{ flex: 2, minWidth: 320, background: 'white', borderRadius: '8px', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>Sale</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee', background: selected?.id === s.id ? '#f0f0f0' : 'white' }}>
                <td style={{ padding: '10px' }}><b>{s.sale_number}</b><br /><small>{new Date(s.created_at).toLocaleString()}</small></td>
                <td style={{ padding: '10px' }}>{s.customer_name}</td>
                <td style={{ padding: '10px' }}>{s.payment_method}</td>
                <td style={{ padding: '10px' }}>N${Number(s.total).toFixed(2)}</td>
                <td style={{ padding: '10px' }}>{s.status === 'refunded' ? '🔴 Refunded' : '🟢 Completed'}</td>
                <td style={{ padding: '10px' }}><button onClick={() => viewSale(s)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DETAIL / RECEIPT */}
        {selected && (
          <div style={{ flex: 1, minWidth: 300, background: 'white', padding: 16, borderRadius: 10, border: '1px solid #ddd' }}>
            <h3 style={{ marginTop: 0 }}>{selected.sale_number}</h3>
            <p>Customer: <b>{selected.customer_name}</b><br />
            Date: {new Date(selected.created_at).toLocaleString()}<br />
            Payment: {selected.payment_method}<br />
            Status: {selected.status}</p>
            <hr />
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                <span>{i.product_name} x {i.qty}</span><b>N${Number(i.total).toFixed(2)}</b>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}><span>Subtotal</span><b>N${Number(selected.subtotal).toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><b>- N${Number(selected.discount).toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><span>Total</span><b>N${Number(selected.total).toFixed(2)}</b></div>
            {selected.payment_method === 'Cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tendered</span><span>N${Number(selected.amount_tendered).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change</span><span>N${Number(selected.change_due).toFixed(2)}</span></div>
              </>
            )}
            <p style={{ color: 'green' }}>Profit on this sale: N${profitForSelected.toFixed(2)}</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button onClick={printReceipt} style={{ padding: '10px 14px', background: '#111', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>🖨️ Print</button>
              <button onClick={shareWhatsApp} style={{ padding: '10px 14px', background: '#25D366', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>WhatsApp Receipt</button>
              <button onClick={copyReceipt} style={{ padding: '10px 14px', background: '#eee', color: '#111', border: '1px solid #999', borderRadius: 6, cursor: 'pointer' }}>📋 Copy Receipt</button>
              {selected.status !== 'refunded' && (
                <button onClick={refundSale} style={{ padding: '10px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Refund Sale</button>
              )}
              <button onClick={() => { setSelected(null); setItems([]) }}>Close</button>
            </div>
          </div>
        )}
      </div>
      {filtered.length === 0 && <p>No sales yet. Go sell something in POS!</p>}
    </div>
  )
}