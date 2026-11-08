'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('General')

  async function load() {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    if (error) alert('Load error: ' + error.message)
    setExpenses(data || [])
  }
  useEffect(() => { load() }, [])

  async function addExpense(e: any) {
    e.preventDefault()
    if (!description) return alert('Enter a description')
    const { error } = await supabase.from('expenses').insert({ title: description, description, amount: Number(amount) || 0, category })
    if (error) return alert('Save failed: ' + error.message)
    setDescription(''); setAmount(''); setCategory('General')
    load()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <div style={{ color: '#111' }}>
      <h1>Expenses</h1>
      <p><b>Total Expenses: N${totalExpenses}</b></p>
      <form onSubmit={addExpense} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', border: '1px solid #ddd' }}>
        <input placeholder="What did you spend on? *" value={description} onChange={e => setDescription(e.target.value)} required style={inputStyle} />
        <input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          <option>General</option><option>Rent</option><option>Stock</option><option>Transport</option><option>Marketing</option><option>Salaries</option>
        </select>
        <button style={{ padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Expense</button>
      </form>

      <div style={{ display: 'grid', gap: '10px' }}>
        {expenses.map(ex => (
          <div key={ex.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
            <div><b>{ex.description}</b> — <span style={{ color: '#555' }}>{ex.category}</span><br /><span style={{ color: '#555', fontSize: '13px' }}>{new Date(ex.created_at).toLocaleDateString()}</span></div>
            <b style={{ color: 'red' }}>- N${ex.amount}</b>
          </div>
        ))}
        {expenses.length === 0 && <p>No expenses yet.</p>}
      </div>
    </div>
  )
}