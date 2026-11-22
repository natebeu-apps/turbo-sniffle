'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const groups = [
  { label: 'SELL', links: [
    { href: '/', label: 'Dashboard' },
    { href: '/pos', label: 'Point of Sale' },
    { href: '/sales', label: 'Sales' },
    { href: '/shifts', label: 'Shifts' },
  ]},
  { label: 'INVENTORY', links: [
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'Order List' },
  ]},
  { label: 'MONEY', links: [
    { href: '/expenses', label: 'Expenses' },
    { href: '/reports/profit', label: 'Profit Report' },
  ]},
  { label: 'REPORTS', links: [
    { href: '/reports/daily', label: 'Daily Summary' },
  ]},
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const linkStyle = (active: boolean) => ({ display: 'block', padding: '12px 14px', borderRadius: 10, background: active ? '#1e293b' : 'transparent', color: active ? 'white' : '#e2e8f0', textDecoration: 'none', fontWeight: active ? '800' : '500', fontSize: 15 } as const)

  return (
    <>
      {/* Top bar - mobile only */}
      <div className="mobile-topbar">
        <button onClick={() => setOpen(true)} className="menu-btn" aria-label="Open menu">☰ Menu</button>
        <b>My Shop</b>
        <Link href="/pos" className="top-pos-btn">New Sale</Link>
      </div>

      {/* Sidebar - desktop, drawer on mobile */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 16px' }}>
          <div style={{ fontSize: 20, fontWeight: '800' }}>My Shop</div>
          <button onClick={() => setOpen(false)} className="close-btn" aria-label="Close menu">✕</button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px 12px' }}>
          <Link href="/pos" onClick={() => setOpen(false)} style={{ display: 'block', padding: '13px 14px', borderRadius: 10, background: '#16a34a', color: 'white', fontWeight: '800', textAlign: 'center', textDecoration: 'none' }}>New Sale - POS</Link>
          {groups.map(g => (
            <div key={g.label}>
              <div style={{ color: '#94a3b8', fontWeight: '700', fontSize: 11, letterSpacing: '0.08em', marginTop: 16, marginBottom: 4, paddingLeft: 12 }}>{g.label}</div>
              {g.links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={linkStyle(pathname === l.href)}>{l.label}</Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* Bottom nav - mobile only, like Snnel / PilosPOS */}
      <nav className="bottom-nav">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link>
        <Link href="/pos" className={pathname === '/pos' ? 'active' : ''}>POS</Link>
        <Link href="/products" className={pathname === '/products' ? 'active' : ''}>Products</Link>
        <Link href="/expenses" className={pathname === '/expenses' ? 'active' : ''}>Expenses</Link>
        <Link href="/reports/daily" className={pathname === '/reports/daily' ? 'active' : ''}>Daily</Link>
      </nav>
    </>
  )
}