import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0, background: '#f6f7f9', color: '#111' }}>
        <nav style={{ background: '#0f172a', color: 'white', padding: '12px 20px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          <a href="/" style={{ color: 'white', fontWeight: '800', fontSize: 20, textDecoration: 'none', marginRight: 12 }}>MyBooks<span style={{ color: '#22c55e' }}>.</span></a>
          <a href="/customers" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Customers</a>
          <a href="/products" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Products</a>
          <a href="/pos" style={{ color: 'white', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, background: '#22c55e', fontWeight: '700' }}>🛒 POS Till</a>
          <a href="/sales" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Sales</a>
          <a href="/shifts" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>💰 Shifts</a>
          <a href="/reports/profit" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>📈 Profit</a>
          <a href="/purchases" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Purchases</a>
          <a href="/invoices" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Invoices</a>
          <a href="/expenses" style={{ color: '#e2e8f0', textDecoration: 'none', padding: '8px 12px', borderRadius: 8 }}>Expenses</a>
        </nav>
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </body>
    </html>
  )
}