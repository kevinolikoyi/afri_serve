import { createClient } from '@/lib/supabase/server'
import { formatPrix, formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: restaurant } = await supabase
    .from('restaurants').select('id').eq('user_id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients').select('*')
    .eq('restaurant_id', restaurant!.id)
    .order('nombre_commandes', { ascending: false })

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Clients</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {clients?.length ?? 0} client{(clients?.length ?? 0) > 1 ? 's' : ''} enregistré{(clients?.length ?? 0) > 1 ? 's' : ''}
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
          {/* ── Table desktop ── */}
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
                {clients.map(client => (
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

          {/* ── Cards mobile ── */}
          <div className="lg:hidden space-y-3">
            {clients.map(client => (
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
    </div>
  )
}