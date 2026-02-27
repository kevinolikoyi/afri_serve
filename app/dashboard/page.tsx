'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import { ShoppingBag, Users, UtensilsCrossed, TrendingUp, QrCode, ExternalLink, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import type { Restaurant } from '@/types'

export default function DashboardPage() {
  const supabase = createClient()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [stats, setStats] = useState({ plats: 0, clients: 0, commandes: 0, ventes: 0 })
  const [loading, setLoading] = useState(true)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: r } = await supabase
      .from('restaurants').select('*').eq('user_id', user.id).single()
    if (!r) { setLoading(false); return }
    setRestaurant(r)

    const [{ count: nbPlats }, { count: nbClients }, { count: nbCommandes }, { data: commandes }] = await Promise.all([
      supabase.from('plats').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id),
      supabase.from('commandes').select('montant_total').eq('restaurant_id', r.id),
    ])

    const totalVentes = commandes?.reduce((s, c) => s + Number(c.montant_total), 0) ?? 0
    setStats({ plats: nbPlats ?? 0, clients: nbClients ?? 0, commandes: nbCommandes ?? 0, ventes: totalVentes })
    setLoading(false)

    // Générer le QR code après chargement
    setTimeout(() => generateQR(r.slug), 200)
  }

  async function generateQR(slug: string) {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    await QRCode.toCanvas(canvas, `${appUrl}/resto/${slug}`, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }

  function downloadQR() {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qrcode-${restaurant?.slug}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  function printQR() {
    const canvas = qrCanvasRef.current
    if (!canvas || !restaurant) return
    const dataUrl = canvas.toDataURL()
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>QR Code — ${restaurant.nom}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
            img { width: 250px; height: 250px; }
            h2 { font-size: 22px; margin: 16px 0 8px; color: #111; }
            p { color: #666; font-size: 14px; margin: 4px 0; }
            .url { font-size: 12px; color: #f97316; margin-top: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <h2>${restaurant.nom}</h2>
          <p>Scannez pour voir notre menu</p>
          <p class="url">${appUrl}/resto/${restaurant.slug}</p>
          <br/>
          <button onclick="window.print()">🖨️ Imprimer</button>
        </body>
      </html>
    `)
    win.document.close()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  if (!restaurant) return (
    <div className="p-8 text-center text-gray-400">
      <p className="text-lg mb-2">Restaurant non trouvé.</p>
      <Link href="/auth/register" className="text-orange-500 hover:underline">Créer un restaurant</Link>
    </div>
  )

  const statCards = [
    { label: 'Plats au menu', value: stats.plats, icon: UtensilsCrossed, color: 'text-blue-400' },
    { label: 'Clients', value: stats.clients, icon: Users, color: 'text-green-400' },
    { label: 'Commandes', value: stats.commandes, icon: ShoppingBag, color: 'text-purple-400' },
    { label: 'Total ventes', value: formatPrix(stats.ventes), icon: TrendingUp, color: 'text-orange-400' },
  ]

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Bonjour 👋 {restaurant.nom}</h1>
        <p className="text-gray-400 mt-1 text-sm">Voici un aperçu de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6 lg:mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-4 lg:p-6 border border-gray-800">
            <Icon className={`${color} mb-2 lg:mb-3`} size={20} />
            <div className="text-xl lg:text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-400 text-xs lg:text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">

        {/* QR Code — affiché uniquement si au moins 1 plat */}
        {stats.plats > 0 && <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4 lg:mb-5">
            <QrCode className="text-orange-500" size={20} />
            <h2 className="font-bold text-white">QR Code & Lien public</h2>
          </div>

          {/* URL publique */}
          <div className="bg-gray-800 rounded-xl px-3 lg:px-4 py-3 flex items-center justify-between mb-4 lg:mb-5">
            <span className="text-orange-400 text-xs lg:text-sm font-mono truncate">
              {appUrl}/resto/{restaurant.slug}
            </span>
            <Link href={`/resto/${restaurant.slug}`} target="_blank" className="ml-2 flex-shrink-0">
              <ExternalLink size={15} className="text-gray-400 hover:text-white transition-colors" />
            </Link>
          </div>

          {/* QR Code canvas */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-2xl p-3 lg:p-4 shadow-lg">
              <canvas ref={qrCanvasRef} />
            </div>
            <p className="text-gray-500 text-xs lg:text-sm text-center">
              Affichez ce QR code sur vos tables ou comptoir
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Download size={15} /> Télécharger
              </button>
              <button onClick={printQR}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Printer size={15} /> Imprimer
              </button>
            </div>
          </div>
        </div>
        }

        {/* Message si menu vide */}
        {stats.plats === 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white font-semibold mb-1">Votre menu est vide</p>
            <p className="text-gray-500 text-sm mb-5">Ajoutez vos plats pour activer votre page publique et générer votre QR code.</p>
            <Link href="/dashboard/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
              🍽️ Créer mon menu
            </Link>
          </div>
        )}

        {/* Actions rapides */}
        <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
          <h2 className="font-bold text-white mb-4 lg:mb-5">Actions rapides</h2>
          <div className="space-y-3">
            {[
              { href: '/dashboard/menu', label: '🍽️ Ajouter un plat', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15' },
              { href: '/dashboard/commandes', label: '📋 Voir les commandes', color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/15' },
              { href: '/dashboard/clients', label: '👥 Mes clients', color: 'bg-green-500/10 text-green-400 hover:bg-green-500/15' },
              { href: '/dashboard/statistiques', label: '📊 Statistiques', color: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/15' },
            ].map(({ href, label, color }) => (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${color}`}>
                <span>{label}</span>
                <ExternalLink size={14} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}