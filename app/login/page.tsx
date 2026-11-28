'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMsg(error.message); return }
    router.push('/')
  }

  async function handleForgot() {
    if (!email) { setMsg('Enter your email first, then click Send reset email'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    if (error) { setMsg(error.message); return }
    setMsg('Check your email for the reset link!')
    setShowForgot(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h1>Log in</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
      <button onClick={handleLogin} style={{ width: '100%', padding: 13, background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, fontWeight: '800' }}>Log In</button>

      <button onClick={() => setShowForgot(!showForgot)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginTop: 10, padding: 0 }}>
        Forgot password?
      </button>

      {showForgot && (
        <div style={{ marginTop: 10, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
          <p style={{ margin: '0 0 10px 0', fontSize: 14 }}>We'll email a reset link to <b>{email || 'your email'}</b></p>
          <button onClick={handleForgot} style={{ width: '100%', padding: 10, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: '700' }}>Send reset email</button>
        </div>
      )}

      <p>{msg}</p>
      <Link href="/signup">No account? Create your shop</Link>
    </div>
  )
}