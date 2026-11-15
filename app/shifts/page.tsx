import { Suspense } from 'react'
import ShiftsClient from './ShiftsClient'

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading shifts...</div>}>
      <ShiftsClient />
    </Suspense>
  )
}