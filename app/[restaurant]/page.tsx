'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import type { Restaurant, Categorie, Plat, PanierItem } from '@/types'
import { ShoppingCart, Plus, Minus, MessageCircle, MapPin, Phone } from 'lucide-react'

export default function RestaurantPage() {
  const { restaurant: slug } = useParams()
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [panier, setPanier] = useState<PanierItem[]>([])
  const [showPanier, setShowPanier] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '', type: 'sur_place', commentaire: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMenu() }, [slug])

  async function loadMenu() {
    const { data: r } = await supabase.from('restaurants').select('*').eq('slug', slug).eq('actif', true).single()
    if (!r) { setLoading(false); return }
    setRestaurant(r)
    const [{ data: cats }, { data: pls }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', r.id).order('ordre'),
      supabase.from('plats').select('*').eq('restaurant_id', r.id).eq('disponible', true).order('ordre'),
    ])
    setCategories(cats ?? [])
    setPlats(pls ?? [])
    setLoading(false)
  }

  function addToPanier(plat: Plat) {
    setPanier(p => {
      const ex = p.find(i => i.plat.id === plat.id)
      if (ex) return p.map(i => i.plat.id === plat.id ? { ...i, quantite: i.quantite + 1 } : i)
      return [...p, { plat, quantite: 1 }]
    })
  }

  function removeFromPanier(platId: string) {
    setPanier(p => {
      const ex = p.find(i => i.plat.id === platId)
      if (!ex) return p
      if (ex.quantite === 1) return p.filter(i => i.plat.id !== platId)
      return p.map(i => i.plat.id === platId ? { ...i, quantite: i.quantite - 1 } : i)
    })
  }

  const total = panier.reduce((s, i) => s + i.plat.prix * i.quantite, 0)
  const nbItems = panier.reduce((s, i) => s + i.quantite, 0)

  async function commander() {
    if (!restaurant || !form.nom || !form.telephone) return
    setLoading(true)

    // Upsert client
    const { data: client } = await supabase.from('clients')
      .upsert({ restaurant_id: restaurant.id, nom: form.nom, telephone: form.telephone }, { onConflict: 'restaurant_id,telephone' })
      .select().single()

    // Créer commande
    const numero = `CMD-${Date.now().toString().slice(-4)}`
    const { data: commande } = await supabase.from('commandes').insert({
      restaurant_id: restaurant.id,
      client_id: client?.id,
      numero,
      type: form.type,
      montant_total: total,
      commentaire: form.commentaire,
      statut: 'nouvelle',
    }).select().single()

    if (commande) {
      await supabase.from('commande_items').insert(
        panier.map(i => ({
          commande_id: commande.id,
          plat_id: i.plat.id,
          nom_plat: i.plat.nom,
          prix_unitaire: i.plat.prix,
          quantite: i.quantite,
          sous_total: i.plat.prix * i.quantite,
        }))
      )
    }

    // Envoyer sur WhatsApp
    const txt = `🍽️ *Nouvelle commande - ${restaurant.nom}*\n\n` +
      `*N°:* ${numero}\n*Type:* ${form.type.replace('_', ' ')}\n*Client:* ${form.nom}\n*Tél:* ${form.telephone}\n\n` +
      `*Commande:*\n${panier.map(i => `• ${i.plat.nom} x${i.quantite} = ${formatPrix(i.plat.prix * i.quantite)}`).join('\n')}\n\n` +
      `*Total: ${formatPrix(total)}*` +
      (form.commentaire ? `\n\n*Note:* ${form.commentaire}` : '')

    window.open(`https://wa.me/${restaurant.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`, '_blank')
    setPanier([]); setShowPanier(false); setLoading(false)
    alert('✅ Commande envoyée avec succès !')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Chargement...</div></div>
  if (!restaurant) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">Restaurant introuvable</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">{restaurant.nom}</h1>
          {restaurant.adresse && <p className="flex items-center gap-1 text-orange-100 text-sm mt-1"><MapPin size={14} />{restaurant.adresse}, {restaurant.ville}</p>}
          {restaurant.telephone && <p className="flex items-center gap-1 text-orange-100 text-sm mt-0.5"><Phone size={14} />{restaurant.telephone}</p>}
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {categories.length > 0 ? categories.map(cat => {
          const cPlats = plats.filter(p => p.categorie_id === cat.id)
          if (cPlats.length === 0) return null
          return (
            <div key={cat.id} className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">{cat.nom}</h2>
              <div className="space-y-3">
                {cPlats.map(plat => <PlatCard key={plat.id} plat={plat} panier={panier} onAdd={addToPanier} onRemove={removeFromPanier} />)}
              </div>
            </div>
          )
        }) : (
          <div className="space-y-3 mt-4">
            {plats.map(plat => <PlatCard key={plat.id} plat={plat} panier={panier} onAdd={addToPanier} onRemove={removeFromPanier} />)}
          </div>
        )}
      </div>

      {/* Bouton panier fixe */}
      {nbItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setShowPanier(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-between px-6 shadow-xl transition-colors">
              <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{nbItems}</span>
              <span>Voir mon panier</span>
              <span>{formatPrix(total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-w-2xl mx-auto p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Mon panier</h2>
              <button onClick={() => setShowPanier(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-3 mb-6">
              {panier.map(item => (
                <div key={item.plat.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div><p className="font-medium text-gray-800">{item.plat.nom}</p><p className="text-sm text-orange-500">{formatPrix(item.plat.prix)}</p></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => removeFromPanier(item.plat.id)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus size={14} /></button>
                    <span className="font-bold w-6 text-center">{item.quantite}</span>
                    <button onClick={() => addToPanier(item.plat)} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 mb-6">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500">
                <option value="sur_place">Sur place</option>
                <option value="emporter">À emporter</option>
                <option value="livraison">Livraison</option>
              </select>
              <input placeholder="Votre nom *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500" />
              <input placeholder="Votre téléphone *" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500" />
              <textarea placeholder="Commentaire (optionnel)" value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500 resize-none h-20" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-xl font-bold text-orange-500">{formatPrix(total)}</span>
            </div>
            <button onClick={commander} disabled={loading || !form.nom || !form.telephone}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50">
              <MessageCircle size={20} />
              Commander via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlatCard({ plat, panier, onAdd, onRemove }: { plat: Plat; panier: PanierItem[]; onAdd: (p: Plat) => void; onRemove: (id: string) => void }) {
  const item = panier.find(i => i.plat.id === plat.id)
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{plat.nom}</p>
        {plat.description && <p className="text-sm text-gray-500 mt-0.5">{plat.description}</p>}
        <p className="text-orange-500 font-bold mt-2">{formatPrix(plat.prix)}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {item ? (
          <>
            <button onClick={() => onRemove(plat.id)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus size={14} /></button>
            <span className="font-bold w-6 text-center">{item.quantite}</span>
            <button onClick={() => onAdd(plat)} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"><Plus size={14} /></button>
          </>
        ) : (
          <button onClick={() => onAdd(plat)} className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 shadow-md"><Plus size={18} /></button>
        )}
      </div>
    </div>
  )
}
