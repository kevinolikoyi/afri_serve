import { createClient } from '@/lib/supabase/server'
import { formatPrix, formatDate } from '@/lib/utils'

const STATUT_COLORS: Record<string, string> = {
  nouvelle: 'bg-blue-500/10 text-blue-400',
  en_cours: 'bg-yellow-500/10 text-yellow-400',
  prete: 'bg-green-500/10 text-green-400',
  livree: 'bg-gray-500/10 text-gray-400',
  annulee: 'bg-red-500/10 text-red-400',
}

const STATUT_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle', en_cours: 'En cours',
  prete: 'Prête', livree: 'Livrée', annulee: 'Annulée',
}

export default async function CommandesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: restaurant } = await supabase.from('restaurants').select('id').eq('user_id', user!.id).single()

  const { data: commandes } = await supabase
    .from('commandes')
    .select('*, clients(nom, telephone), commande_items(nom_plat, quantite, sous_total)')
    .eq('restaurant_id', restaurant!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Commandes</h1>
        <p className="text-gray-400 mt-1">{commandes?.length ?? 0} commande{(commandes?.length ?? 0) > 1 ? 's' : ''} au total</p>
      </div>
      <div className="space-y-3">
        {(!commandes || commandes.length === 0) && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">Aucune commande pour l'instant</p>
            <p className="text-sm">Les commandes apparaîtront ici dès qu'un client passera commande</p>
          </div>
        )}
        {commandes?.map(cmd => (
          <div key={cmd.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{cmd.numero}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[cmd.statut]}`}>
                    {STATUT_LABELS[cmd.statut]}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
                    {cmd.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{formatDate(cmd.created_at)}</p>
              </div>
              <span className="text-orange-400 font-bold text-lg">{formatPrix(cmd.montant_total)}</span>
            </div>
            {cmd.clients && (
              <p className="text-sm text-gray-400 mb-2">👤 {cmd.clients.nom} — {cmd.clients.telephone}</p>
            )}
            <div className="text-sm text-gray-500">
              {cmd.commande_items?.map((item: any, i: number) => (
                <span key={i}>{item.nom_plat} x{item.quantite}{i < cmd.commande_items.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
