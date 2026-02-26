'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import type { Plat, Categorie, Restaurant } from '@/types'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

export default function MenuPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editPlat, setEditPlat] = useState<Partial<Plat>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: r } = await supabase.from('restaurants').select('*').eq('user_id', user!.id).single()
    if (!r) return
    setRestaurant(r)
    const [{ data: cats }, { data: pls }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', r.id).order('ordre'),
      supabase.from('plats').select('*').eq('restaurant_id', r.id).order('ordre'),
    ])
    setCategories(cats ?? [])
    setPlats(pls ?? [])
  }

  async function savePlat() {
    if (!restaurant || !editPlat.nom || !editPlat.prix) return
    setLoading(true)
    const payload = { ...editPlat, restaurant_id: restaurant.id }
    if (editPlat.id) {
      await supabase.from('plats').update(payload).eq('id', editPlat.id)
    } else {
      await supabase.from('plats').insert(payload)
    }
    setShowForm(false); setEditPlat({})
    await loadData(); setLoading(false)
  }

  async function toggleDispo(plat: Plat) {
    await supabase.from('plats').update({ disponible: !plat.disponible }).eq('id', plat.id)
    await loadData()
  }

  async function deletePlat(id: string) {
    if (!confirm('Supprimer ce plat ?')) return
    await supabase.from('plats').delete().eq('id', id)
    await loadData()
  }

  async function addCategorie() {
    const nom = prompt('Nom de la catégorie :')
    if (!nom || !restaurant) return
    await supabase.from('categories').insert({ restaurant_id: restaurant.id, nom })
    await loadData()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion du menu</h1>
          <p className="text-gray-400 mt-1">{plats.length} plat{plats.length > 1 ? 's' : ''} au menu</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addCategorie}
            className="px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium transition-colors">
            + Catégorie
          </button>
          <button onClick={() => { setEditPlat({}); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
            <Plus size={16} /> Ajouter un plat
          </button>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-5">{editPlat.id ? 'Modifier' : 'Nouveau'} plat</h2>
            <div className="space-y-4">
              <input placeholder="Nom du plat *" value={editPlat.nom ?? ''}
                onChange={e => setEditPlat(p => ({ ...p, nom: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              <textarea placeholder="Description" value={editPlat.description ?? ''}
                onChange={e => setEditPlat(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none h-20" />
              <input type="number" placeholder="Prix (F CFA) *" value={editPlat.prix ?? ''}
                onChange={e => setEditPlat(p => ({ ...p, prix: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              <select value={editPlat.categorie_id ?? ''}
                onChange={e => setEditPlat(p => ({ ...p, categorie_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                <option value="">Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditPlat({}) }}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors">
                Annuler
              </button>
              <button onClick={savePlat} disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des plats */}
      <div className="space-y-2">
        {plats.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">Aucun plat pour l'instant</p>
            <p className="text-sm">Cliquez sur "Ajouter un plat" pour commencer</p>
          </div>
        )}
        {plats.map(plat => (
          <div key={plat.id}
            className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${plat.disponible ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div>
                <p className="font-medium text-white">{plat.nom}</p>
                {plat.description && <p className="text-sm text-gray-500 mt-0.5">{plat.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-orange-400 font-bold">{formatPrix(plat.prix)}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleDispo(plat)} title={plat.disponible ? 'Masquer' : 'Afficher'}
                  className="p-2 text-gray-400 hover:text-white transition-colors">
                  {plat.disponible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => { setEditPlat(plat); setShowForm(true) }}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deletePlat(plat.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
