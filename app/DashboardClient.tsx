'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' } as const
const pill = (active: boolean) => ({ padding: '10px 16px', borderRadius: 999, border: '1px solid #e2e8f0', background: active ? '#0f172a' : 'white', color: active ? 'white' : '#0f172a', fontWeight: '700', cursor: 'pointer' } as const)

export default function DashboardClient() {
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [range, setRange] = useState('week')

  async function load() {
    const { data: s } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(1000)
    setSales(s || [])
    const { data: p } = await supabase.from('products').select('*')
    setProducts(p || [])
    const { data: si } = await supabase.from('sale_items').select('*').limit(5000)
    setSaleItems(si || [])
    const { data: e } = await supabase.from('expenses').select('*')
    setExpenses(e || [])
  }
  useEffect(() => { load() }, [])

  function inRange(dstr: string) {
    const d = new Date(dstr)
    const now = new Date()
    if (range === 'today') return d.toDateString() === now.toDateString()
    if (range === 'week') { const a = new Date(); a.setDate(now.getDate() - 7); return d >= a }
    if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  }

  const fSales = sales.filter(s => s.status !== 'refunded' && inRange(s.created_at))
  const revenue = fSales.reduce((a, s) => a + Number(s.total || 0), 0)
  const costMap: Record<string, number> = {}
  products.forEach(p => costMap[p.id] = Number(p.cost_price || p.cost || 0))
  const nameMap: Record<string, string> = {}
  products.forEach(p => nameMap[p.id] = p.name)

  let cogs = 0
  const saleIds = new Set(fSales.map(s => s.id))
  const byProduct: Record<string, { name: string, qty: number, revenue: number, profit: number }> = {}

  if (saleItems.length > 0) {
    saleItems.filter(i => saleIds.has(i.sale_id)).forEach(i => {
      const cost = Number(i.cost_price || costMap[i.product_id] || 0)
      const qty = Number(i.quantity || 1)
      const rev = Number(i.price || i.total || 0) * qty
      cogs += cost * qty
      const key = i.product_id || i.name || 'Unknown'
      if (!byProduct[key]) byProduct[key] = { name: i.name || nameMap[i.product_id] || 'Unknown', qty: 0, revenue: 0, profit: 0 }
      byProduct[key].qty += qty
      byProduct[key].revenue += rev
      byProduct[key].profit += rev - (cost * qty)
    })
  } else {
    fSales.forEach(s => {
      const items = s.items || []
      items.forEach((i: any) => {
        const cost = Number(costMap[i.product_id] || 0)
        const qty = Number(i.quantity || i.qty || 1)
        const rev = Number(i.price || 0) * qty
        cogs += cost * qty
        const key = i.product_id || 'Unknown'
        if (!byProduct[key]) byProduct[key] = { name: i.name || nameMap[i.product_id] || 'Unknown', qty: 0, revenue: 0, profit: 0 }
        byProduct[key].qty += qty
        byProduct[key].revenue += rev
        byProduct[key].profit += rev - (cost * qty)
      })
    })
  }

  const grossProfit = revenue - cogs
  const fExpenses = expenses.filter(e => inRange(e.expense_date))
  const totalExpenses = fExpenses.reduce((a, e) => a + Number(e.amount || 0), 0)
  const netProfit = grossProfit - totalExpenses
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const stockValue = products.reduce((a, p) => a + Number(p.cost_price || p.cost || 0) * Number(p.stock || 0), 0)
  const lowStock = products.filter(p => Number(p.stock || 0) <= Number(p.reorder_level ?? 5))
  const best = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Last 7 days chart
  const days: { label: string, total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const total = sales.filter(s => s.status !== 'refunded' && new Date(s.created_at).toDateString() === d.toDateString()).reduce((a, s) => a + Number(s.total || 0), 0)
    days.push({ label, total })
  }
  const maxDay = Math.max(...days.map(d => d.total), 1)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>👋 Good day, here is your shop today</h1>
          <p style={{ color: '#64748b' }}>Sell faster, control inventory, understand your numbers.</p>
        </div>
        <Link href="/pos" style={{ padding: '12px 20px', borderRadius: 999, background: '#16a34a', color: 'white', fontWeight: '800', textDecoration: 'none' }}>New Sale - POS</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {['today', 'week', 'month', 'all'].map(r => (
          <button key={r} onClick={() => setRange(r)} style={pill(range === r)}>{r === 'all' ? 'All Time' : r === 'week' ? 'Last 7 Days' : r === 'month' ? 'This Month' : 'Today'}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>TOTAL SALES</small><h2 style={{ margin: '4px 0' }}>N${revenue.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{fSales.length} invoices</small></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>GROSS PROFIT</small><h2 style={{ margin: '4px 0', color: '#16a34a' }}>N${grossProfit.toFixed(2)}</h2><small style={{ color: '#64748b' }}>Margin {margin.toFixed(1)}%</small></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>EXPENSES</small><h2 style={{ margin: '4px 0', color: '#dc2626' }}>N${totalExpenses.toFixed(2)}</h2><small style={{ color: '#64748b' }}>Operating costs</small></div>
        <div style={{ ...card, borderLeft: '4px solid #16a34a' }}><small style={{ color: '#64748b', fontWeight: '700' }}>NET PROFIT</small><h2 style={{ margin: '4px 0', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>N${netProfit.toFixed(2)}</h2><small style={{ color: '#64748b' }}>After expenses</small></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>STOCK VALUE</small><h2 style={{ margin: '4px 0' }}>N${stockValue.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{products.length} products</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Sales Performance - Last 7 Days</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, paddingTop: 8 }}>
            {days.map(d => (
              <div key={d.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>N${d.total.toFixed(0)}</div>
                <div style={{ height: Math.max((d.total / maxDay) * 100, 4), background: '#16a34a', borderRadius: '8px 8px 0 0' }}></div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{d.label}</div>
              </div>
            ))}
          </div>
          <Link href="/reports/profit" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none', fontSize: 14 }}>See full Profit Report</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Best Sellers</h3>
          {best.length === 0 && <p style={{ color: '#94a3b8' }}>No sales in this period yet.</p>}
          {best.map((b, i) => (
            <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span><b>{i + 1}. {b.name}</b> <span style={{ color: '#64748b' }}>- {b.qty} sold</span></span>
              <b>N${b.revenue.toFixed(2)}</b>
            </div>
          ))}
          <Link href="/products" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none', fontSize: 14 }}>Manage Products</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={{ ...card, borderLeft: lowStock.length > 0 ? '4px solid #dc2626' : '4px solid #16a34a' }}>
          <h3 style={{ marginTop: 0 }}>Low Stock - Needs Ordering</h3>
          {lowStock.length === 0 && <p style={{ color: '#16a34a' }}>All good. No products below reorder level.</p>}
          {lowStock.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span><b>{p.name}</b> <span style={{ color: '#64748b' }}>- Supplier {p.supplier || 'Not set'}</span></span>
              <b style={{ color: '#dc2626' }}>{p.stock} left</b>
            </div>
          ))}
          <Link href="/orders" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none', fontSize: 14 }}>See full Order List - {lowStock.length} items</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Business Overview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Revenue</span><b>N${revenue.toFixed(2)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Cost of Stock</span><b>N${cogs.toFixed(2)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Expenses</span><b>N${totalExpenses.toFixed(2)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f1f5f9', marginTop: 4 }}><span>Net Profit</span><b style={{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>N${netProfit.toFixed(2)}</b></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Link href="/expenses" style={{ padding: '10px 14px', borderRadius: 999, background: '#0f172a', color: 'white', fontWeight: '700', textDecoration: 'none', fontSize: 13 }}>Add Expense</Link>
            <Link href="/reports/daily" style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid #e2e8f0', fontWeight: '700', textDecoration: 'none', fontSize: 13, color: '#0f172a' }}>Daily Summary</Link>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Getting Started - 3 steps to your first sale</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div><b>1. Add Products</b><p style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>Add name, price, cost price, and stock.</p><Link href="/products" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none' }}>Add Product</Link></div>
          <div><b>2. Ring Up a Sale</b><p style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>Open POS, tap products, take payment.</p><Link href="/pos" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none' }}>Open POS</Link></div>
          <div><b>3. Check Profit</b><p style={{ color: '#64748b', fontSize: 13, margin: '4px 0' }}>See what you kept after costs and expenses.</p><Link href="/reports/profit" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none' }}>View Profit</Link></div>
        </div>
      </div>
    </div>
  )
}