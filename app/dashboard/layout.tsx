'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, BarChart2, LogOut, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/statistiques', label: 'Statistiques', icon: BarChart2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <a href="/" className="flex items-center gap-2">
            <QrCode className="text-orange-500" size={24} />
            <span className="text-xl font-bold">Menu<span className="text-orange-500">QR</span></span>
          </a>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${pathname === href
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors">
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-950">
        {children}
      </main>
    </div>
  )
}