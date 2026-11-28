'use client'
import { useEffect } from 'react'
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export default function Page() {
  useEffect(() => {
    // If a recovery token lands on / by mistake, forward it to /update-password
    if (window.location.hash.includes('type=recovery')) {
      window.location.href = '/update-password' + window.location.hash
    }
  }, [])

  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  )
}