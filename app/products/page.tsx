'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('')

  async function load() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) alert('Load error: ' + error.message)
    setProducts(data || [])
  }
  useEffect(() => { load() }, [])

  async function addProduct(e: any) {
    e.preventDefault()
    if (!name) return alert('Please enter a name')
    const { error } = await supabase.from('products').insert({
      name, price: Number(price) || 0, cost: Number(cost) || 0, stock: Number(stock) || 0
    })
    if (error) return alert('Save failed: ' + error.message)
    setName(''); setPrice(''); setCost(''); setStock('')
    load()
  }

  return (
    <div style={{ color: '#111' }}>
      <h1>Products / Stock</h1>
      <form onSubmit={addProduct} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', border: '1px solid #ddd' }}>
        <input placeholder="Product name *" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        <input placeholder="Sell Price" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <input placeholder="Cost Price" type="number" value={cost} onChange={e => setCost(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <input placeholder="Stock Qty" type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <button style={{ padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Product</button>
      </form>

      <table style={{ width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#111' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '10px' }}>Product</th><th style={{ padding: '10px' }}>Price</th><th style={{ padding: '10px' }}>Cost</th><th style={{ padding: '10px' }}>Stock</th><th style={{ padding: '10px' }}>Profit / unit</th>
        </tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}><b>{p.name}</b></td>
              <td style={{ padding: '10px' }}>N${p.price}</td>
              <td style={{ padding: '10px' }}>N${p.cost}</td>
              <td style={{ padding: '10px' }}>{p.stock}</td>
              <td style={{ padding: '10px', color: 'green' }}>N${Number(p.price) - Number(p.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <p>No products yet.</p>}
    </div>
  )
}