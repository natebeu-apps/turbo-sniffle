import Link from 'next/link'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const linkStyle = { display: 'block', padding: '10px 12px', borderRadius: '10px', color: '#e2e8f0', textDecoration: 'none', fontSize: 15 } as const
  const labelStyle = { color: '#94a3b8', fontWeight: '700', fontSize: 11, letterSpacing: '0.08em', marginTop: 16, marginBottom: 4, paddingLeft: 12 } as const

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f6f7f9', color: '#111' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside style={{ width: 240, background: '#0f172a', color: 'white', padding: '16px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: '800', padding: '4px 12px 16px' }}>My Shop</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link href="/pos" style={{ display: 'block', padding: '12px 14px', borderRadius: 10, background: '#16a34a', color: 'white', fontWeight: '800', textAlign: 'center', textDecoration: 'none' }}>New Sale - POS</Link>

              <div style={labelStyle}>SELL</div>
              <Link href="/" style={linkStyle}>Dashboard</Link>
              <Link href="/pos" style={linkStyle}>Point of Sale</Link>
              <Link href="/sales" style={linkStyle}>Sales</Link>
              <Link href="/shifts" style={linkStyle}>Shifts</Link>

              <div style={labelStyle}>INVENTORY</div>
              <Link href="/products" style={linkStyle}>Products</Link>
              <Link href="/orders" style={linkStyle}>Order List - Low Stock</Link>

              <div style={labelStyle}>MONEY</div>
              <Link href="/expenses" style={linkStyle}>Expenses</Link>
              <Link href="/reports/profit" style={linkStyle}>Profit Report</Link>

              <div style={labelStyle}>REPORTS</div>
              <Link href="/reports/daily" style={linkStyle}>Daily Summary</Link>
            </nav>
          </aside>
          <main style={{ flex: 1, padding: 20, maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}