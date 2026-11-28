'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function setup() {
      // Case 1: ?code=... (PKCE flow)
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) alert('Link error: ' + error.message)
        setReady(true)
        return
      }

      // Case 2: #access_token=...&refresh_token=... (what Supabase actually sends you)
      const hash = new URLSearchParams(window.location.hash.replace('#', ''))
      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) alert('Link error: ' + error.message)
        setReady(true)
        return
      }

      // Case 3: No token at all - check if we already have a session
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        alert('This link is expired or already used. Request a fresh reset email.')
      }
      setReady(true)
    }
    setup()
  }, [])

  async function update() {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return alert(error.message)
    alert('Password updated! Now log in with it.')
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) return <p style={{ padding: 20 }}>Setting up your reset link...</p>

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h1>Set new password</h1>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }}
      />
      <button onClick={update} style={{ padding: '10px 20px' }}>
        Update password
      </button>
    </div>
  )
}