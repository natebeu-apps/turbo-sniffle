'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, products: 0, revenue: 0, unpaid: 0, expenses: 0, lowStock: [] as any[] })

  async function load() {
    const { data: cust } = await supabase.from('customers').select('id')
    const { data: prod } = await supabase.from('products').select('*')
    const { data: inv } = await supabase.from('invoices').select('*')
    const { data: exp } = await supabase.from('expenses').select('*')

    const paid = (inv || []).filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0)
    const unpaid = (inv || []).filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total || 0), 0)
    const expensesTotal = (exp || []).reduce((s, e) => s + Number(e.amount || 0), 0)

    setStats({
      customers: cust?.length || 0,
      products: prod?.length || 0,
      revenue: paid,
      unpaid,
      expenses: expensesTotal,
      lowStock: (prod || []).filter(p => Number(p.stock) <= 5)
    })
  }
  useEffect(() => { load() }, [])

  const profit = stats.revenue - stats.expenses

  const card = { background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #ddd', flex: '1', minWidth: '180px' } as any

  return (
    <div style={{ color: '#111' }}>
      <h1>Dashboard</h1>
      <p>Welcome back! Here is your business today.</p>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={card}><small>Revenue (Paid)</small><h2 style={{ color: 'green', margin: '5px 0' }}>N${stats.revenue}</h2></div>
        <div style={card}><small>Unpaid Invoices</small><h2 style={{ color: '#d97706', margin: '5px 0' }}>N${stats.unpaid}</h2></div>
        <div style={card}><small>Expenses</small><h2 style={{ color: 'red', margin: '5px 0' }}>N${stats.expenses}</h2></div>
        <div style={card}><small>Profit (Revenue - Expenses)</small><h2 style={{ color: profit >= 0 ? 'green' : 'red', margin: '5px 0' }}>N${profit}</h2></div>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={card}><small>Customers</small><h2>{stats.customers}</h2><Link href="/customers">View Customers →</Link></div>
        <div style={card}><small>Products</small><h2>{stats.products}</h2><Link href="/products">View Products →</Link></div>
        <div style={card}><small>Invoices</small><h2><Link href="/invoices">Create Invoice →</Link></h2></div>
        <div style={card}><small>Expenses</small><h2><Link href="/expenses">Add Expense →</Link></h2></div>
      </div>

      {stats.lowStock.length > 0 && (
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffe69c' }}>
          <b>⚠️ Low Stock Alert</b>
          <ul>{stats.lowStock.map(p => <li key={p.id}>{p.name} - only {p.stock} left</li>)}</ul>
        </div>
      )}
    </div>
  )
}