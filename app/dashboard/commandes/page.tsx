'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix, formatDate } from '@/lib/utils'
import { Search, X, Filter } from 'lucide-react'
import { useRole } from '@/lib/useRole'

const STATUT_COLORS: Record<string, string> = {
  nouvelle:  'bg-blue-500/10 text-blue-400',
  en_cours:  'bg-yellow-500/10 text-yellow-400',
  prete:     'bg-green-500/10 text-green-400',
  livree:    'bg-gray-500/10 text-gray-400',
  annulee:   'bg-red-500/10 text-red-400',
}

const STATUT_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle', en_cours: 'En cours',
  prete: 'Prête', livree: 'Livrée', annulee: 'Annulée',
}

const TYPE_LABELS: Record<string, string> = {
  sur_place: 'Sur place', emporter: 'À emporter', livraison: 'Livraison',
}

// Progression du statut pour admin + staff
const STATUT_NEXT: Record<string, { value: string; label: string; color: string }[]> = {
  nouvelle:  [{ value: 'en_cours', label: '▶ Prendre en charge', color: 'bg-yellow-500 hover:bg-yellow-600' }],
  en_cours:  [{ value: 'prete',    label: '✅ Marquer prête',    color: 'bg-green-500 hover:bg-green-600'  }],
  prete:     [{ value: 'livree',   label: '📦 Marquer livrée',   color: 'bg-gray-600 hover:bg-gray-700'    }],
  livree:    [],
  annulee:   [],
}

export default function CommandesPage() {
  const supabase = createClient()
  const { isAdmin, restaurantId, loading: roleLoading } = useRole()

  const [commandes, setCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!roleLoading && restaurantId) loadData()
  }, [roleLoading, restaurantId])

  async function loadData() {
    if (!restaurantId) return
    const { data } = await supabase
      .from('commandes')
      .select('*, clients(nom, telephone), commande_items(nom_plat, quantite, sous_total)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
    setCommandes(data ?? [])
    setLoading(false)
  }

  async function updateStatut(cmdId: string, newStatut: string) {
    setUpdatingId(cmdId)
    await supabase.from('commandes').update({ statut: newStatut }).eq('id', cmdId)
    setCommandes(prev => prev.map(c => c.id === cmdId ? { ...c, statut: newStatut } : c))
    setUpdatingId(null)
  }

  async function annulerCommande(cmdId: string) {
    if (!confirm('Annuler cette commande ?')) return
    await updateStatut(cmdId, 'annulee')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return commandes.filter(cmd => {
      if (q) {
        const nom = cmd.clients?.nom?.toLowerCase() ?? ''
        const tel = cmd.clients?.telephone?.toLowerCase() ?? ''
        const numero = cmd.numero?.toLowerCase() ?? ''
        const plats = cmd.commande_items?.map((i: any) => i.nom_plat.toLowerCase()).join(' ') ?? ''
        if (!nom.includes(q) && !tel.includes(q) && !numero.includes(q) && !plats.includes(q)) return false
      }
      if (filterStatut && cmd.statut !== filterStatut) return false
      if (filterType && cmd.type !== filterType) return false
      return true
    })
  }, [commandes, search, filterStatut, filterType])

  const hasFilter = search || filterStatut || filterType

  function resetFilters() { setSearch(''); setFilterStatut(''); setFilterType('') }

  if (loading || roleLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Commandes</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {commandes.length} commande{commandes.length > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par client, téléphone, n° commande, plat..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
              ${showFilters || filterStatut || filterType
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}>
            <Filter size={15} />
            <span className="hidden sm:inline">Filtres</span>
            {(filterStatut || filterType) && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {[filterStatut, filterType].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500">
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500">
              <option value="">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {hasFilter && (
              <button onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-sm transition-colors">
                <X size={13} /> Réinitialiser
              </button>
            )}
          </div>
        )}

        {hasFilter && (
          <p className="text-xs text-gray-500">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {commandes.length}
          </p>
        )}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">Aucune commande ne correspond à votre recherche</p>
            {hasFilter && (
              <button onClick={resetFilters} className="mt-3 text-orange-400 hover:underline text-sm">
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {filtered.map(cmd => {
          const nextActions = STATUT_NEXT[cmd.statut] ?? []
          const isUpdating = updatingId === cmd.id
          const peutAnnuler = isAdmin && cmd.statut !== 'annulee' && cmd.statut !== 'livree'

          return (
            <div key={cmd.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:p-6 hover:border-gray-700 transition-colors">

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-white">{cmd.numero}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[cmd.statut]}`}>
                      {STATUT_LABELS[cmd.statut]}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
                      {TYPE_LABELS[cmd.type] ?? cmd.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(cmd.created_at)}</p>
                </div>
                {/* Montant visible uniquement pour admin */}
                {isAdmin && (
                  <span className="text-orange-400 font-bold text-base lg:text-lg ml-3 flex-shrink-0">
                    {formatPrix(cmd.montant_total)}
                  </span>
                )}
              </div>

              {/* Client */}
              {cmd.clients && (
                <p className="text-sm text-gray-400 mb-2">
                  👤 {cmd.clients.nom} — {cmd.clients.telephone}
                </p>
              )}

              {/* Items */}
              <div className="text-sm text-gray-500 flex flex-wrap gap-x-1 mb-3">
                {cmd.commande_items?.map((item: any, i: number) => (
                  <span key={i}>
                    {item.nom_plat} x{item.quantite}
                    {i < cmd.commande_items.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>

              {/* Actions statut — admin + staff */}
              {(nextActions.length > 0 || peutAnnuler) && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-800">
                  {nextActions.map(action => (
                    <button key={action.value}
                      onClick={() => updateStatut(cmd.id, action.value)}
                      disabled={isUpdating}
                      className={`text-xs font-bold px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${action.color}`}>
                      {isUpdating ? '...' : action.label}
                    </button>
                  ))}
                  {/* Annuler — admin uniquement */}
                  {peutAnnuler && (
                    <button onClick={() => annulerCommande(cmd.id)} disabled={isUpdating}
                      className="text-xs font-bold px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      ✕ Annuler
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}