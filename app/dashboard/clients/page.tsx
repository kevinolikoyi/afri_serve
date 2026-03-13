'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix, formatDate } from '@/lib/utils'
import { Search, X, ArrowUpDown } from 'lucide-react'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nombre_commandes' | 'total_depense' | 'created_at'>('nombre_commandes')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: restaurant } = await supabase
      .from('restaurants').select('id').eq('user_id', user.id).single()
    if (!restaurant) { setLoading(false); return }

    const { data } = await supabase
      .from('clients').select('*')
      .eq('restaurant_id', restaurant.id)

    setClients(data ?? [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let result = clients.filter(c => {
      if (!q) return true
      return (
        c.nom?.toLowerCase().includes(q) ||
        c.telephone?.toLowerCase().includes(q)
      )
    })
    result = [...result].sort((a, b) => {
      const va = a[sortBy] ?? 0
      const vb = b[sortBy] ?? 0
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return result
  }, [clients, search, sortBy, sortDir])

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors
        ${sortBy === col
          ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}>
      {label}
      <ArrowUpDown size={12} className={sortBy === col ? 'text-orange-400' : 'text-gray-600'} />
      {sortBy === col && <span className="text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Clients</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
        </p>
      </div>

      {(!clients || clients.length === 0) ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg mb-1">Aucun client enregistré</p>
          <p className="text-sm">Les clients apparaîtront ici après leurs premières commandes</p>
        </div>
      ) : (
        <>
          {/* Barre recherche + tris */}
          <div className="mb-5 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou téléphone..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Tris */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">Trier par :</span>
              <SortBtn col="nombre_commandes" label="Commandes" />
              <SortBtn col="total_depense" label="Total dépensé" />
              <SortBtn col="created_at" label="Date d'inscription" />
            </div>

            {(search) && (
              <p className="text-xs text-gray-500">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {clients.length}
              </p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">Aucun client ne correspond à votre recherche</p>
              <button onClick={() => setSearch('')} className="mt-3 text-orange-400 hover:underline text-sm">
                Effacer la recherche
              </button>
            </div>
          ) : (
            <>
              {/* Table desktop */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      {['Nom', 'Téléphone', 'Commandes', 'Total dépensé', 'Depuis'].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-sm font-medium text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-950 divide-y divide-gray-800">
                    {filtered.map(client => (
                      <tr key={client.id} className="hover:bg-gray-900 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{client.nom}</td>
                        <td className="px-6 py-4 text-gray-400">{client.telephone}</td>
                        <td className="px-6 py-4">
                          <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full text-sm font-medium">
                            {client.nombre_commandes}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-orange-400 font-medium">{formatPrix(client.total_depense)}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(client.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="lg:hidden space-y-3">
                {filtered.map(client => (
                  <div key={client.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">{client.nom}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{client.telephone}</p>
                      </div>
                      <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full text-sm font-medium">
                        {client.nombre_commandes} cmd
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <span className="text-orange-400 font-bold">{formatPrix(client.total_depense)}</span>
                      <span className="text-gray-500 text-xs">{formatDate(client.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}