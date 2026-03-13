'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import { TrendingUp, ShoppingBag, Users, UtensilsCrossed, ArrowUp, ArrowDown } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRole } from '@/lib/useRole'

type Commande = {
  id: string; montant_total: number; statut: string; type: string
  created_at: string
  commande_items: { nom_plat: string; quantite: number; sous_total: number }[]
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ec4899']
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const fmtVentes = (v: unknown) => [formatPrix(Number(v) || 0), 'Ventes'] as [string, string]
const fmtCount  = (v: unknown) => [String(Number(v) || 0), 'commandes'] as [string, string]

export default function StatistiquesPage() {
  const supabase = createClient()
  const { isAdmin, restaurantId, loading: roleLoading } = useRole()

  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'7j' | '30j' | '12m'>('30j')

  useEffect(() => {
    if (!roleLoading && restaurantId) loadData()
  }, [roleLoading, restaurantId])

  async function loadData() {
    if (!restaurantId) return
    const { data } = await supabase
      .from('commandes')
      .select('*, commande_items(nom_plat, quantite, sous_total)')
      .eq('restaurant_id', restaurantId)
      .neq('statut', 'annulee')
      .order('created_at', { ascending: true })
    setCommandes(data ?? [])
    setLoading(false)
  }

  function filtrerCommandes() {
    const now = new Date()
    return commandes.filter(c => {
      const d = new Date(c.created_at)
      if (periode === '7j') return (now.getTime() - d.getTime()) <= 7 * 86400000
      if (periode === '30j') return (now.getTime() - d.getTime()) <= 30 * 86400000
      return d.getFullYear() === now.getFullYear()
    })
  }

  const filtered = filtrerCommandes()
  const totalVentes = filtered.reduce((s, c) => s + Number(c.montant_total), 0)
  const nbCommandes = filtered.length
  const panier = nbCommandes > 0 ? totalVentes / nbCommandes : 0

  function getPrecedent() {
    const now = new Date()
    return commandes.filter(c => {
      const d = new Date(c.created_at)
      const diff = now.getTime() - d.getTime()
      if (periode === '7j') return diff > 7 * 86400000 && diff <= 14 * 86400000
      if (periode === '30j') return diff > 30 * 86400000 && diff <= 60 * 86400000
      return d.getFullYear() === now.getFullYear() - 1
    })
  }

  const totalPrec = getPrecedent().reduce((s, c) => s + Number(c.montant_total), 0)
  const pctVentes = totalPrec > 0 ? Math.round(((totalVentes - totalPrec) / totalPrec) * 100) : null

  function getVentesData() {
    if (periode === '12m') {
      return MOIS.map((nom, i) => ({
        nom,
        ventes: filtered.filter(c => new Date(c.created_at).getMonth() === i).reduce((s, c) => s + Number(c.montant_total), 0),
        commandes: filtered.filter(c => new Date(c.created_at).getMonth() === i).length,
      }))
    }
    const jours = periode === '7j' ? 7 : 30
    return Array.from({ length: jours }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (jours - 1 - i))
      const label = `${d.getDate()}/${d.getMonth() + 1}`
      const dayCmd = filtered.filter(c => {
        const cd = new Date(c.created_at)
        return cd.getDate() === d.getDate() && cd.getMonth() === d.getMonth()
      })
      return { nom: label, ventes: dayCmd.reduce((s, c) => s + Number(c.montant_total), 0), commandes: dayCmd.length }
    })
  }

  function getTopPlats() {
    const map: Record<string, { nom: string; quantite: number; total: number }> = {}
    filtered.forEach(c => {
      c.commande_items?.forEach(item => {
        if (!map[item.nom_plat]) map[item.nom_plat] = { nom: item.nom_plat, quantite: 0, total: 0 }
        map[item.nom_plat].quantite += item.quantite
        map[item.nom_plat].total += Number(item.sous_total)
      })
    })
    return Object.values(map).sort((a, b) => b.quantite - a.quantite).slice(0, 6)
  }

  function getTypesData() {
    const types: Record<string, number> = { sur_place: 0, emporter: 0, livraison: 0 }
    filtered.forEach(c => { if (types[c.type] !== undefined) types[c.type]++ })
    return [
      { nom: 'Sur place', value: types.sur_place },
      { nom: 'À emporter', value: types.emporter },
      { nom: 'Livraison', value: types.livraison },
    ].filter(d => d.value > 0)
  }

  const ventesData = getVentesData()
  const topPlats = getTopPlats()
  const typesData = getTypesData()
  const maxPlat = topPlats[0]?.quantite ?? 1

  // KPIs selon le rôle
  const allKpis = [
    { label: 'Chiffre d\'affaires', value: formatPrix(totalVentes), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', pct: pctVentes, adminOnly: true },
    { label: 'Commandes',           value: nbCommandes,             icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10', pct: null,      adminOnly: false },
    { label: 'Panier moyen',        value: formatPrix(Math.round(panier)), icon: UtensilsCrossed, color: 'text-blue-400', bg: 'bg-blue-500/10', pct: null, adminOnly: true },
    { label: 'Clients uniques',     value: new Set(commandes.map(c => c.id)).size, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', pct: null, adminOnly: false },
  ]
  const kpis = allKpis.filter(k => !k.adminOnly || isAdmin)

  if (loading || roleLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Statistiques</h1>
          <p className="text-gray-400 mt-1 text-sm">Analysez les performances de votre restaurant</p>
        </div>
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
          {(['7j', '30j', '12m'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${periode === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs filtrés selon rôle */}
      <div className={`grid gap-3 lg:gap-5 mb-6 lg:mb-8 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {kpis.map(({ label, value, icon: Icon, color, bg, pct }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-4 lg:p-5 border border-gray-800">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={color} size={20} />
            </div>
            <div className="text-lg lg:text-2xl font-bold text-white">{value}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-500 text-xs lg:text-sm">{label}</p>
              {pct !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pct >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(pct)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {commandes.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500 text-lg mb-1">Aucune donnée disponible</p>
          <p className="text-sm">Les statistiques apparaîtront après vos premières commandes</p>
        </div>
      ) : (
        <>
          {/* Graphique ventes — admin uniquement */}
          {isAdmin && (
            <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800 mb-5 lg:mb-6">
              <h2 className="font-bold text-white mb-5">Évolution des ventes</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ventesData}>
                  <defs>
                    <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="nom" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v > 0 ? `${(Number(v) / 1000).toFixed(0)}k` : '0'} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} formatter={fmtVentes} />
                  <Area type="monotone" dataKey="ventes" stroke="#f97316" strokeWidth={2} fill="url(#gradVentes)" dot={false} activeDot={{ r: 5, fill: '#f97316' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 mb-5 lg:mb-6">
            {/* Top plats — visible par tous */}
            <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
              <h2 className="font-bold text-white mb-5">🏆 Plats les plus commandés</h2>
              {topPlats.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {topPlats.map((plat, i) => (
                    <div key={plat.nom}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                          <span className="text-sm text-white font-medium truncate max-w-[160px]">{plat.nom}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-400">{plat.quantite} vendus</span>
                          {/* Total par plat masqué pour staff */}
                          {isAdmin && <span className="text-xs font-bold text-orange-400">{formatPrix(plat.total)}</span>}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(plat.quantite / maxPlat) * 100}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Types de commandes — visible par tous */}
            <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
              <h2 className="font-bold text-white mb-5">📦 Types de commandes</h2>
              {typesData.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={typesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {typesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} formatter={fmtCount} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {typesData.map((d, i) => (
                      <div key={d.nom} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-400">{d.nom}</span>
                        <span className="text-sm font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Histogramme commandes — visible par tous */}
          <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
            <h2 className="font-bold text-white mb-5">Nombre de commandes</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ventesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="nom" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} formatter={fmtCount} />
                <Bar dataKey="commandes" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}