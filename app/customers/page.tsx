'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  async function load() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (error) alert('Load error: ' + error.message)
    setCustomers(data || [])
  }
  useEffect(() => { load() }, [])

  async function addCustomer(e: any) {
    e.preventDefault()
    if (!name) return alert('Please enter a name')
    const { error } = await supabase.from('customers').insert({ name, email, phone, address })
    if (error) {
      alert('Save failed: ' + error.message)
      return
    }
    setName(''); setEmail(''); setPhone(''); setAddress('')
    load()
  }

  return (
    <div style={{ color: '#111' }}>
      <h1 style={{ color: '#111' }}>Customers</h1>
      <form onSubmit={addCustomer} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', border: '1px solid #ddd' }}>
        <input placeholder="Name *" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
        <button style={{ padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Customer</button>
      </form>

      <div style={{ display: 'grid', gap: '10px' }}>
        {customers.map(c => (
          <div key={c.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', color: '#111', border: '1px solid #ddd' }}>
            <b>{c.name}</b> — {c.email} — {c.phone}<br />
            <span style={{ color: '#555' }}>{c.address}</span>
          </div>
        ))}
        {customers.length === 0 && <p style={{ color: '#111' }}>No customers yet. Add your first one above.</p>}
      </div>
    </div>
  )
}