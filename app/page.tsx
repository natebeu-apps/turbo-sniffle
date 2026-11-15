'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
const label = { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: '0.5px' }

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  async function load() {
    const { data: p } = await supabase.from('products').select('*')
    setProducts(p || [])
    const { data: s } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50)
    setSales(s || [])
    const { data: si } = await supabase.from('sale_items').select('*').order('created_at', { ascending: false }).limit(200)
    setSaleItems(si || [])
    const { data: c } = await supabase.from('customers').select('*')
    setCustomers(c || [])
  }
  useEffect(() => {
    setTodayStr(new Date().toDateString())
    setTodayLabel(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    load()
  }, [])

  const [todayStr, setTodayStr] = useState('')
  const [todayLabel, setTodayLabel] = useState('')
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === todayStr && s.status !== 'refunded')
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0)
  const todayItems = saleItems.filter(i => new Date(i.created_at).toDateString() === todayStr)
  const todayProfit = todayItems.reduce((sum, i) => {
    const sale = sales.find(s => s.id === i.sale_id)
    if (sale?.status === 'refunded') return sum
    return sum + (Number(i.price) - Number(i.cost)) * Number(i.qty)
  }, 0)

  const allSales = sales.filter(s => s.status !== 'refunded')
  const allTotal = allSales.reduce((sum, s) => sum + Number(s.total || 0), 0)

  const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.low_stock_level || 5))
  const outStock = products.filter(p => Number(p.stock) <= 0)
  const stockValue = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.cost), 0)

  const byPayment: any = {}
  todaySales.forEach(s => { byPayment[s.payment_method] = (byPayment[s.payment_method] || 0) + Number(s.total) })

  const topProducts: any = {}
  saleItems.forEach(i => {
    const sale = sales.find(s => s.id === i.sale_id)
    if (sale?.status === 'refunded') return
    if (!topProducts[i.product_name]) topProducts[i.product_name] = { name: i.product_name, qty: 0, total: 0 }
    topProducts[i.product_name].qty += Number(i.qty)
    topProducts[i.product_name].total += Number(i.total)
  })
  const topList = Object.values(topProducts).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5)
  const recentSales = sales.slice(0, 5)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 30, margin: 0 }}>Good day 👋</h1>
          <p style={{ color: '#64748b', margin: '6px 0 0' }}>{todayLabel} • Here's your business today</p>
        </div>
        <Link href="/pos" style={{ background: '#22c55e', color: 'white', padding: '14px 22px', borderRadius: 12, textDecoration: 'none', fontWeight: '800', fontSize: 16 }}>🛒 Open POS Till →</Link>
      </div>

      {/* TOP STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 20 }}>
        <div style={card}><div style={label}>Today's Sales</div><h2 style={{ margin: '8px 0 4px', fontSize: 28, color: '#16a34a' }}>N${todayTotal.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{todaySales.length} sales today</small></div>
        <div style={card}><div style={label}>Today's Profit</div><h2 style={{ margin: '8px 0 4px', fontSize: 28, color: '#0f172a' }}>N${todayProfit.toFixed(2)}</h2><small style={{ color: '#64748b' }}>Sales - Cost</small></div>
        <div style={card}><div style={label}>All-Time Sales</div><h2 style={{ margin: '8px 0 4px', fontSize: 28 }}>N${allTotal.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{allSales.length} total sales</small></div>
        <div style={card}><div style={label}>Stock Value (Cost)</div><h2 style={{ margin: '8px 0 4px', fontSize: 28 }}>N${stockValue.toFixed(2)}</h2><small style={{ color: '#64748b' }}>{products.length} products</small></div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
        {[
          { href: '/pos', icon: '🛒', title: 'POS Till', sub: 'Sell now' },
          { href: '/products', icon: '📦', title: 'Products', sub: `${products.length} items` },
          { href: '/sales', icon: '🧾', title: 'Sales', sub: 'History & receipts' },
          { href: '/purchases', icon: '🚚', title: 'Purchases', sub: 'Restock' },
          { href: '/customers', icon: '👥', title: 'Customers', sub: `${customers.length} customers` },
          { href: '/invoices', icon: '📄', title: 'Invoices', sub: 'View invoices' },
          { href: '/expenses', icon: '💸', title: 'Expenses', sub: 'Track costs' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ ...card, textDecoration: 'none', color: '#111', padding: 16 }}>
            <div style={{ fontSize: 26 }}>{a.icon}</div><b style={{ display: 'block', marginTop: 6 }}>{a.title}</b><small style={{ color: '#64748b' }}>{a.sub}</small>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16, alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ flex: 1.5, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>💳 Today's Payments</h3>
            {Object.keys(byPayment).length === 0 && <p style={{ color: '#94a3b8' }}>No sales yet today. Open the Till!</p>}
            {Object.entries(byPayment).map(([method, amt]: any) => (
              <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>{method === 'Cash' ? '💵 Cash' : method === 'Card' ? '💳 Card' : method === 'EFT' ? '🏦 EFT' : '📱 ' + method}</span><b>N${Number(amt).toFixed(2)}</b>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>🏆 Top Selling Products</h3>
            {topList.length === 0 && <p style={{ color: '#94a3b8' }}>No sales yet.</p>}
            {topList.map((p: any, i: number) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span><b>#{i + 1}</b> {p.name}</span><span><b>{p.qty} sold</b> • N${p.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>🧾 Recent Sales</h3>
            {recentSales.length === 0 && <p style={{ color: '#94a3b8' }}>No sales yet.</p>}
            {recentSales.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span><b>{s.sale_number}</b> • {s.customer_name} • {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{s.status === 'refunded' ? <span style={{ color: '#dc2626', fontWeight: '700' }}>REFUNDED</span> : <b>N${Number(s.total).toFixed(2)}</b>}</span>
              </div>
            ))}
            <Link href="/sales" style={{ display: 'inline-block', marginTop: 10, fontWeight: '700' }}>View all sales →</Link>
          </div>
        </div>

        {/* RIGHT - ALERTS */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ marginTop: 0 }}>⚠️ Needs Attention</h3>
            {lowStock.length === 0 && outStock.length === 0 && <p style={{ color: '#16a34a', fontWeight: '700' }}>✅ All stock levels OK</p>}
            {outStock.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fef3c7' }}>
                <span>🔴 <b>{p.name}</b></span><span style={{ color: '#dc2626', fontWeight: '700' }}>OUT</span>
              </div>
            ))}
            {lowStock.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fef3c7' }}>
                <span>🟡 <b>{p.name}</b></span><span>Only {p.stock} left</span>
              </div>
            ))}
            {(lowStock.length > 0 || outStock.length > 0) && <Link href="/purchases" style={{ display: 'inline-block', marginTop: 10, fontWeight: '700' }}>Restock in Purchases →</Link>}
          </div>
        </div>
      </div>
    </div>
  )
}