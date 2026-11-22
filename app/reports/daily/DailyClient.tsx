'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }

export default function DailyClient() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])

  async function load() {
    const today = new Date().toISOString().slice(0, 10)
    const { data: s } = await supabase.from('sales').select('*').gte('created_at', today).order('created_at', { ascending: false })
    setSales(s || [])
    const { data: p } = await supabase.from('products').select('*')
    setProducts(p || [])
    const { data: sh } = await supabase.from('shifts').select('*').gte('created_at', today).order('created_at', { ascending: false })
    setShifts(sh || [])
    const { data: si } = await supabase.from('sale_items').select('*').limit(5000)
    setSaleItems(si || [])
  }
  useEffect(() => { load() }, [])

  const totalRevenue = sales.reduce((a, s) => a + Number(s.total || 0), 0)
  const costMap: Record<string, number> = {}
  products.forEach(p => costMap[p.id] = Number(p.cost_price || p.cost || 0))

  let totalCost = 0
  const saleIds = new Set(sales.map(s => s.id))
  if (saleItems.length > 0) {
    saleItems.filter(i => saleIds.has(i.sale_id)).forEach(i => {
      totalCost += Number(i.cost_price || costMap[i.product_id] || 0) * Number(i.quantity || 1)
    })
  } else {
    sales.forEach(s => {
      const items = s.items || []
      items.forEach((i: any) => { totalCost += Number(costMap[i.product_id] || 0) * Number(i.quantity || i.qty || 1) })
    })
  }
  const profit = totalRevenue - totalCost
  const cashSales = sales.filter(s => (s.payment_method || '').toLowerCase().includes('cash')).reduce((a, s) => a + Number(s.total || 0), 0)
  const cardSales = totalRevenue - cashSales
  const shift = shifts[0]
  const opening = shift ? Number(shift.opening_cash || 0) : 0
  const expected = opening + cashSales

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Daily Summary</h1>
          <p style={{ color: '#64748b' }}>{new Date().toLocaleDateString()} - End of day printout</p>
        </div>
        <button onClick={() => window.print()} style={{ padding: '12px 20px', borderRadius: 999, background: '#0f172a', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Print / Save as PDF</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>SALES TODAY</small><h2 style={{ margin: '4px 0' }}>{sales.length}</h2></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>REVENUE</small><h2 style={{ margin: '4px 0' }}>N${totalRevenue.toFixed(2)}</h2></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>COST</small><h2 style={{ margin: '4px 0', color: '#dc2626' }}>N${totalCost.toFixed(2)}</h2></div>
        <div style={{ ...card, borderLeft: '4px solid #16a34a' }}><small style={{ color: '#64748b', fontWeight: '700' }}>PROFIT</small><h2 style={{ margin: '4px 0', color: '#16a34a' }}>N${profit.toFixed(2)}</h2></div>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Cash Check</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><span>Opening Cash</span><b>N${opening.toFixed(2)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}><span>Cash Sales</span><b>N${cashSales.toFixed(2)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}><span>Card / Other Sales</span><b>N${cardSales.toFixed(2)}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 8 }}><span>Expected in Till</span><b>N${expected.toFixed(2)}</b></div>
        {shift && <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}><span>Counted at Close</span><b>N${Number(shift.closing_cash || 0).toFixed(2)}</b></div>}
        {shift && <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}><span>Difference</span><b style={{ color: Number(shift.difference || 0) === 0 ? '#16a34a' : '#dc2626' }}>N${Number(shift.difference || 0).toFixed(2)}</b></div>}
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Sales Today - {sales.length}</h3>
        {sales.length === 0 && <p style={{ color: '#94a3b8' }}>No sales yet today.</p>}
        {sales.slice(0, 30).map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span>{new Date(s.created_at).toLocaleTimeString()} - {s.payment_method || 'Sale'}</span>
            <b>N${Number(s.total || 0).toFixed(2)}</b>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
        <div>Counted by: ________________</div>
        <div>Signed: ________________</div>
      </div>
    </div>
  )
}