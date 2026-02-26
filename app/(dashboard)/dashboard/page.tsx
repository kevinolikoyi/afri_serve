import { createClient } from '@/lib/supabase/server'
import { formatPrix } from '@/lib/utils'
import { ShoppingBag, Users, UtensilsCrossed, TrendingUp, QrCode, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: restaurant } = await supabase
    .from('restaurants').select('*').eq('user_id', user!.id).single()

  if (!restaurant) return (
    <div className="p-8 text-center text-gray-400">
      <p>Restaurant non trouvé. <Link href="/register" className="text-orange-500">Créer un restaurant</Link></p>
    </div>
  )

  const [{ count: nbPlats }, { count: nbClients }, { count: nbCommandes }, { data: commandes }] = await Promise.all([
    supabase.from('plats').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
    supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
    supabase.from('commandes').select('montant_total').eq('restaurant_id', restaurant.id),
  ])

  const totalVentes = commandes?.reduce((s, c) => s + Number(c.montant_total), 0) ?? 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const stats = [
    { label: 'Plats au menu', value: nbPlats ?? 0, icon: UtensilsCrossed, color: 'text-blue-400' },
    { label: 'Clients', value: nbClients ?? 0, icon: Users, color: 'text-green-400' },
    { label: 'Commandes', value: nbCommandes ?? 0, icon: ShoppingBag, color: 'text-purple-400' },
    { label: 'Total ventes', value: formatPrix(totalVentes), icon: TrendingUp, color: 'text-orange-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bonjour 👋 {restaurant.nom}</h1>
        <p className="text-gray-400 mt-1">Voici un aperçu de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <Icon className={`${color} mb-3`} size={24} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* QR Code & Lien public */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="text-orange-500" size={22} />
            <h2 className="font-bold text-white">Votre page publique</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Partagez ce lien avec vos clients ou affichez le QR code sur vos tables.</p>
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-orange-400 text-sm font-mono">{appUrl}/{restaurant.slug}</span>
            <Link href={`/${restaurant.slug}`} target="_blank">
              <ExternalLink size={16} className="text-gray-400 hover:text-white" />
            </Link>
          </div>
          <Link href="/dashboard/menu"
            className="mt-4 w-full block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
            Gérer le menu →
          </Link>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="font-bold text-white mb-4">Actions rapides</h2>
          <div className="space-y-3">
            {[
              { href: '/dashboard/menu', label: '+ Ajouter un plat', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
              { href: '/dashboard/commandes', label: '📋 Voir les commandes', color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' },
              { href: '/dashboard/clients', label: '👥 Mes clients', color: 'bg-green-500/10 text-green-400 hover:bg-green-500/20' },
              { href: '/dashboard/statistiques', label: '📊 Statistiques', color: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' },
            ].map(({ href, label, color }) => (
              <Link key={href} href={href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${color}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
