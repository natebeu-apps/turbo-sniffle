'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function handleSignup() {
    setMsg('Creating your shop...')
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMsg(error.message); return }
    if (!data.user) { setMsg('Check your email to confirm'); return }

    // 2. Create their store
    const { error: storeError } = await supabase.from('stores').insert({
      owner_id: data.user.id,
      name: shopName,
      currency: 'N$'
    })
    if (storeError) { setMsg(storeError.message); return }

    router.push('/')
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h1>Create your shop</h1>
      <input placeholder="Shop Name - e.g. Kapana Corner" value={shopName} onChange={e => setShopName(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
      <button onClick={handleSignup} style={{ width: '100%', padding: 13, background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, fontWeight: '800' }}>Create Shop</button>
      <p>{msg}</p>
      <Link href="/login">Already have an account? Log in</Link>
    </div>
  )
}