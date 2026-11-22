import { Suspense } from 'react'
import ProfitClient from './ProfitClient'

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading profit...</div>}>
      <ProfitClient />
    </Suspense>
  )
}