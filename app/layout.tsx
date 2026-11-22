import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0, background: '#f6f7f9', color: '#111' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px' }}>
          <a href="/" style={{ padding: '12px 14px', borderRadius: 10, background: '#16a34a', color: 'white', fontWeight: '800', textAlign: 'center' }}>New Sale - POS</Link>

          <small style={{ color: '#94a3b8', fontWeight: '700', marginTop: 14, paddingLeft: 6 }}>SELL</small>
          <a href="/">Dashboard</a>
          <a href="/pos">Point of Sale</a>
          <a href="/sales">Sales</a>
          <a href="/shifts">Shifts</a>

          <small style={{ color: '#94a3b8', fontWeight: '700', marginTop: 14, paddingLeft: 6 }}>INVENTORY</small>
          <a href="/products">Products</a>
          <a href="/orders">Order List - Low Stock</a>

          <small style={{ color: '#94a3b8', fontWeight: '700', marginTop: 14, paddingLeft: 6 }}>MONEY</small>
          <a href="/expenses">Expenses</a>
          <a href="/reports/profit">Profit Report</a>

          <small style={{ color: '#94a3b8', fontWeight: '700', marginTop: 14, paddingLeft: 6 }}>REPORTS</small>
          <a href="/reports/daily">Daily Summary</a>
        </nav>
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </body>
    </html>
  )
}