import './globals.css'
import MobileNav from './MobileNav'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <MobileNav />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  )
}