'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const inputStyle = { padding: '10px', color: '#111', background: 'white', border: '1px solid #999', borderRadius: '4px' }

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [barcode, setBarcode] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('')
  const [lowStock, setLowStock] = useState('5')

  async function load() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) alert('Load error: ' + error.message)
    setProducts(data || [])
  }
  useEffect(() => { load() }, [])

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))]

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)
    const matchesCat = categoryFilter === 'All' || (p.category || 'General') === categoryFilter
    return matchesSearch && matchesCat
  })

  async function addProduct(e: any) {
    e.preventDefault()
    if (!name) return alert('Please enter a name')
    const { error } = await supabase.from('products').insert({
      name,
      category: category || 'General',
      barcode: barcode || null,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      low_stock_level: Number(lowStock) || 5
    })
    if (error) return alert('Save failed: ' + error.message)
    setName(''); setCategory(''); setBarcode(''); setPrice(''); setCost(''); setStock(''); setLowStock('5')
    load()
  }

  async function adjustStock(p: any, change: number) {
    const reason = prompt(`Adjust stock for ${p.name}\nEnter reason (e.g. Damaged, Counted):`, 'Counted')
    if (reason === null) return
    const newStock = Number(p.stock) + change
    if (newStock < 0) return alert('Stock cannot go below 0')
    await supabase.from('products').update({ stock: newStock }).eq('id', p.id)
    await supabase.from('stock_movements').insert({ product_id: p.id, change, reason, note: 'Manual adjustment' })
    load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const status = (p: any) => {
    if (Number(p.stock) <= 0) return '🔴 Out'
    if (Number(p.stock) <= Number(p.low_stock_level || 5)) return '🟡 Low'
    return '🟢 In Stock'
  }

  return (
    <div style={{ color: '#111' }}>
      <h1>Products / Stock</h1>
      <p><a href="/">← Back to Dashboard</a></p>

      <form onSubmit={addProduct} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', border: '1px solid #ddd' }}>
        <input placeholder="Product name *" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} />
        <input placeholder="Barcode / SKU" value={barcode} onChange={e => setBarcode(e.target.value)} style={inputStyle} />
        <input placeholder="Sell Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <input placeholder="Cost Price" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <input placeholder="Stock Qty" type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
        <input placeholder="Low stock at" type="number" value={lowStock} onChange={e => setLowStock(e.target.value)} style={{ ...inputStyle, width: '110px' }} />
        <button style={{ padding: '10px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Product</button>
      </form>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input placeholder="Search name or barcode..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <table style={{ width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#111' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '10px' }}>Product</th><th style={{ padding: '10px' }}>Price</th><th style={{ padding: '10px' }}>Cost</th><th style={{ padding: '10px' }}>Stock</th><th style={{ padding: '10px' }}>Status</th><th style={{ padding: '10px' }}>Profit / unit</th><th style={{ padding: '10px' }}>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}><b>{p.name}</b><br /><small>{p.category || 'General'} {p.barcode ? `• ${p.barcode}` : ''}</small></td>
              <td style={{ padding: '10px' }}>N${p.price}</td>
              <td style={{ padding: '10px' }}>N${p.cost}</td>
              <td style={{ padding: '10px' }}><b>{p.stock}</b></td>
              <td style={{ padding: '10px' }}>{status(p)}</td>
              <td style={{ padding: '10px', color: 'green' }}>N${Number(p.price) - Number(p.cost)}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => adjustStock(p, 1)}>+1</button>{' '}
                <button onClick={() => adjustStock(p, -1)}>-1</button>{' '}
                <button onClick={() => deleteProduct(p.id)} style={{ color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p>No products yet.</p>}
    </div>
  )
}