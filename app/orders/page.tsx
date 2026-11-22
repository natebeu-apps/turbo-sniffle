import { Suspense } from 'react'
import OrderClient from './OrderClient'
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading order list...</div>}>
      <OrderClient />
    </Suspense>
  )
}