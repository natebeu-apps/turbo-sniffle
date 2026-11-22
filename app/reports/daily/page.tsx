import { Suspense } from 'react'
import DailyClient from './DailyClient'
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading daily summary...</div>}>
      <DailyClient />
    </Suspense>
  )
}