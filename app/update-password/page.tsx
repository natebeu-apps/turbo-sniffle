'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' // <- keep YOUR import from login page
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function setup() {
      // Exchange ?code=... from the email link for a real session
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) alert('Link error: ' + error.message)
      }
      setReady(true)
    }
    setup()
  }, [])

  async function handleUpdate() {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) alert(error.message)
    else {
      alert('Password updated! Now log in with it.')
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  if (!ready) return <p>Verifying your reset link...</p>

  return (
    <div>
      <h1>Set new password</h1>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" />
      <button onClick={handleUpdate}>Update password</button>
    </div>
  )
}