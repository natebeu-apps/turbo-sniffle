'use client'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // If a recovery token lands on / by mistake, forward it to /update-password
    if (window.location.hash.includes('type=recovery')) {
      window.location.href = '/update-password' + window.location.hash
    }
  }, [])
  import { Suspense } from 'react'
  import DashboardClient from './DashboardClient'
  export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  )
}  // ... rest of your homepage
}

