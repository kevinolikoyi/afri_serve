'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, BarChart2, LogOut, QrCode, Menu, X, CircleUser, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRole } from '@/lib/useRole'

const NAV = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard, adminOnly: false },
  { href: '/dashboard/menu',         label: 'Menu',         icon: UtensilsCrossed, adminOnly: true  },
  { href: '/dashboard/commandes',    label: 'Commandes',    icon: ShoppingBag,     adminOnly: false },
  { href: '/dashboard/clients',      label: 'Clients',      icon: Users,           adminOnly: false },
  { href: '/dashboard/statistiques', label: 'Statistiques', icon: BarChart2,       adminOnly: false },
  { href: '/dashboard/staff',        label: 'Staff',        icon: UserCog,         adminOnly: true  },
  { href: '/dashboard/profil',       label: 'Profil',       icon: CircleUser,      adminOnly: true  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAdmin, role, loading } = useRole()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin)

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <QrCode className="text-orange-500" size={24} />
          <span className="text-xl font-bold">Menu<span className="text-orange-500">QR</span></span>
        </a>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Badge rôle */}
      {!loading && role && (
        <div className="px-5 pt-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
            ${isAdmin ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {isAdmin ? '👑 Admin' : '👤 Staff'}
          </span>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 mt-2">
        {visibleNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            onClick={() => setSidebarOpen(false)}
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
    </>
  )

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu size={22} />
          </button>
          <a href="/" className="flex items-center gap-2">
            <QrCode className="text-orange-500" size={20} />
            <span className="font-bold text-white">Menu<span className="text-orange-500">QR</span></span>
          </a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white p-1">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}