'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // <- use your existing supabase client path
import { useRouter } from 'next/navigation'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function handleUpdate() {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) alert(error.message)
    else {
      alert('Password updated! Now log in with it.')
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  return (
    <div>
      <h1>Set new password</h1>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" />
      <button onClick={handleUpdate}>Update password</button>
    </div>
  )
}