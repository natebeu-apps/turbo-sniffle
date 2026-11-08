import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', margin: 0, background: '#f2f2f2', color: '#111' }}>
        <nav style={{ background: '#111', color: 'white', padding: '12px 20px', display: 'flex', gap: '20px' }}>
          <a href="/" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>MyBooks</a>
          <a href="/customers" style={{ color: 'white', textDecoration: 'none' }}>Customers</a>
          <a href="/products" style={{ color: 'white', textDecoration: 'none' }}>Products / Stock</a>
          <a href="/invoices" style={{ color: 'white', textDecoration: 'none' }}>Invoices</a>
          <a href="/expenses" style={{ color: 'white', textDecoration: 'none' }}>Expenses</a>
        </nav>
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#111' }}>
          {children}
        </div>
      </body>
    </html>
  )
}