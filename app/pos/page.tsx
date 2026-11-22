import { Suspense } from 'react'
import POSClient from './POSClient'
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading POS...</div>}>
      <POSClient />
    </Suspense>
  )
}