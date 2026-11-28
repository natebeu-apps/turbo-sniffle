'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }
const input = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 15, boxSizing: 'border-box' as const }
const btn = { padding: '12px 18px', borderRadius: '999px', background: '#0f172a', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }

const CATS = ['Rent', 'Stock Purchase', 'Transport', 'Airtime / Data', 'Salaries', 'Electricity', 'Other']

export default function ExpensesClient() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Rent')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [range, setRange] = useState('month')

async function load() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 1. Get MY store only
  const { data: myStore } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!myStore) {
    setExpenses([])
    setSales([])
    setProducts([])
    setSaleItems([])
    return
  }
  const storeId = myStore.id

  // 2. Load ONLY my store's data
  const { data: e } = await supabase.from('expenses').select('*').eq('store_id', storeId).order('expense_date', { ascending: false })
  setExpenses(e || [])
  const { data: s } = await supabase.from('sales').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(1000)
  setSales(s || [])
  const { data: p } = await supabase.from('products').select('*').eq('store_id', storeId)
  setProducts(p || [])
  const { data: si } = await supabase.from('sale_items').select('*').eq('store_id', storeId).limit(5000)
  setSaleItems(si || [])
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

  const filteredExpenses = expenses.filter(e => inRange(e.expense_date))
  const totalExpenses = filteredExpenses.reduce((a, e) => a + Number(e.amount || 0), 0)

  // Gross profit for same period
  const filteredSales = sales.filter(s => s.status !== 'refunded' && inRange(s.created_at))
  const revenue = filteredSales.reduce((a, s) => a + Number(s.total || 0), 0)
  const costMap: Record<string, number> = {}
  products.forEach(p => costMap[p.id] = Number(p.cost_price || p.cost || 0))
  let cogs = 0
  const saleIds = new Set(filteredSales.map(s => s.id))
  if (saleItems.length > 0) {
    saleItems.filter(i => saleIds.has(i.sale_id)).forEach(i => { cogs += Number(i.cost_price || costMap[i.product_id] || 0) * Number(i.quantity || 1) })
  } else {
    filteredSales.forEach(s => {
      const items = s.items || []
      items.forEach((i: any) => { cogs += Number(costMap[i.product_id] || 0) * Number(i.quantity || i.qty || 1) })
    })
  }
  const grossProfit = revenue - cogs
  const netProfit = grossProfit - totalExpenses

  async function addExpense() {
    if (!title || !amount) return alert('Add a title and amount')
    const { error } = await supabase.from('expenses').insert([{ store_id: '84c7967f-66a2-4813-bfd6-997d849ab5a0', title, category, amount: Number(amount), expense_date: date }])
    if (error) return alert(error.message)
    setTitle(''); setAmount(''); load()
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const byCat: Record<string, number> = {}
  filteredExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0) })

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: 0 }}>Expenses</h1>
      <p style={{ color: '#64748b' }}>Record operating costs. Net profit is gross profit minus expenses.</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {['today', 'week', 'month', 'all'].map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid #e2e8f0', background: range === r ? '#0f172a' : 'white', color: range === r ? 'white' : '#0f172a', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize' }}>{r === 'all' ? 'All Time' : r === 'week' ? 'Last 7 Days' : r}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>REVENUE</small><h2 style={{ margin: '4px 0' }}>N${revenue.toFixed(2)}</h2></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>COST OF STOCK</small><h2 style={{ margin: '4px 0', color: '#dc2626' }}>N${cogs.toFixed(2)}</h2></div>
        <div style={card}><small style={{ color: '#64748b', fontWeight: '700' }}>EXPENSES</small><h2 style={{ margin: '4px 0', color: '#dc2626' }}>N${totalExpenses.toFixed(2)}</h2></div>
        <div style={{ ...card, borderLeft: '4px solid #16a34a' }}><small style={{ color: '#64748b', fontWeight: '700' }}>NET PROFIT</small><h2 style={{ margin: '4px 0', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>N${netProfit.toFixed(2)}</h2><small style={{ color: '#64748b' }}>Gross N${grossProfit.toFixed(2)} minus expenses</small></div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Add Expense</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <input style={input} placeholder="What was it for? e.g. Shop rent" value={title} onChange={e => setTitle(e.target.value)} />
          <select style={input} value={category} onChange={e => setCategory(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
          <input style={input} type="number" placeholder="Amount N$" value={amount} onChange={e => setAmount(e.target.value)} />
          <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button onClick={addExpense} style={{ ...btn, marginTop: 12 }}>Add Expense</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Expenses by Category</h3>
          {Object.keys(byCat).length === 0 && <p style={{ color: '#94a3b8' }}>No expenses in this period.</p>}
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}><span>{cat}</span><b>N${amt.toFixed(2)}</b></div>
          ))}
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Recent Expenses</h3>
          {filteredExpenses.length === 0 && <p style={{ color: '#94a3b8' }}>No expenses yet. Add your first one above.</p>}
          {filteredExpenses.slice(0, 30).map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span><b>{e.title}</b> <span style={{ color: '#64748b' }}>- {e.category} - {e.expense_date}</span></span>
              <span><b>N${Number(e.amount || 0).toFixed(2)}</b> <button onClick={() => deleteExpense(e.id)} style={{ marginLeft: 8, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}>Delete</button></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}