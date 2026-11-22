import { Suspense } from 'react'
import ExpensesClient from './ExpensesClient'
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading expenses...</div>}>
      <ExpensesClient />
    </Suspense>
  )
}