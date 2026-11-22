'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }

export default function ProfitClient() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [range, setRange] = useState('today')

  async function load() {
    const { data: p } = await supabase.from('products').select('*')
    setProducts(p || [])
    const { data: s } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(1000)
    setSales(s || [])
    // Try sale_items table, if it doesn't exist it just returns empty
    const { data: si } = await supabase.from('sale_items').select('*').limit(5000)
    setSaleItems(si || [])
  }
  useEffect(() => { load() }, [])

  function inRange(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    if (range === 'today') return d.toDateString() === now.toDateString()
    if (range === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo }
    if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  }

  const filteredSales = sales.filter(s => s.status !== 'refunded' && inRange(s.created_at))
  const totalRevenue = filteredSales.reduce((a, s) => a + Number(s.total || 0), 0)

  // Cost: from sale_items if we have them, otherwise estimate from sales items JSON
  const costMap: Record<string, number> = {}
  products.forEach(p => costMap[p.id] = Number(p.cost_price || p.cost || 0))

  let totalCost = 0
  const perProduct: Record<string, { name: string, qty: number, revenue: number, cost: number }> = {}

  if (saleItems.length > 0) {
    const saleIds = new Set(filteredSales.map(s => s.id))
    saleItems.filter(i => saleIds.has(i.sale_id)).forEach(i => {
      const prod = products.find(p => p.id === i.product_id)
      const name = prod?.name || i.product_name || 'Unknown'
      const qty = Number(i.quantity || 1)
      const rev = Number(i.total || i.price * qty || 0)
      const cost = Number(i.cost_price || costMap[i.product_id] || 0) * qty
      totalCost += cost
      if (!perProduct[name]) perProduct[name] = { name, qty: 0, revenue: 0, cost: 0 }
      perProduct[name].qty += qty
      perProduct[name].revenue += rev
      perProduct[name].cost += cost
    })
  } else {
    // Fallback: sales have items JSON like [{product_id, quantity, price}]
    filteredSales.forEach(s => {
      const items = s.items || []
      items.forEach((i: any) => {
        const prod = products.find(p => p.id === i.product_id)
        const name = prod?.name || i.name || 'Unknown'
        const qty = Number(i.quantity || i.qty || 1)
        const rev = Number(i.total || (i.price || 0) * qty)
        const cost = Number(costMap[i.product_id] || 0) * qty
        totalCost += cost
        if (!perProduct[name]) perProduct[name] = { name, qty: 0, revenue: 0, cost: 0 }
        perProduct[name].qty += qty
        perProduct[name].revenue += rev
        perProduct[name].cost += cost
      })
    })
  }

  const totalProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const sorted = Object.values(perProduct).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: 0 }}>Profit Report</h1>
      <p style={{ color: '#64748b' }}>Revenue - Cost = What you actually keep.</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {['today', 'week', 'month', 'all'].map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid #e2e8f0', background: range === r ? '#0f172a' : 'white', color: range === r ? 'white' : '#0f172a', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize' }}>{r === 'all' ? 'All Time' : r === 'week' ? 'Last 7 Days' : r}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>REVENUE</small><h2 style={{ margin: '4px 0' }}>N${totalRevenue.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{filteredSales.length} sales</small></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>COST</small><h2 style={{ margin: '4px 0', color: '#dc2626' }}>N${totalCost.toFixed(2)}</h2><small style={{ color: '#64748b' }}>What stock cost you</small></div>
        <div style={{ ...card, borderLeft: '4px solid #16a34a' }}><small style={{ color: '#64748b', fontWeight: '700' }}>PROFIT</small><h2 style={{ margin: '4px 0', color: '#16a34a' }}>N${totalProfit.toFixed(2)}</h2><small style={{ color: '#64748b' }}>Margin {margin.toFixed(1)}%</small></div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profit by Product</h3>
        {sorted.length === 0 && <p style={{ color: '#94a3b8' }}>No product breakdown yet. This happens if your products have no cost_price set, or your sales don't link to products. Set cost_price in Products and do a test sale.<br /><br />Check: Total Cost shows N${totalCost.toFixed(2)} - if it's 0, costs are missing.</p>}
        {sorted.map(p => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span><b>{p.name}</b> • {p.qty} sold</span>
            <span>Revenue N${p.revenue.toFixed(2)} • Cost N${p.cost.toFixed(2)} • <b style={{ color: (p.revenue - p.cost) >= 0 ? '#16a34a' : '#dc2626' }}>Profit N${(p.revenue - p.cost).toFixed(2)}</b></span>
          </div>
        ))}
      </div>

    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>Tip: If Cost shows N$0.00, go to Products and set cost_price for each product. Profit will fix itself instantly.</p>    </div>
  )
}