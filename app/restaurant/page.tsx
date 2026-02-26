'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import type { Restaurant, Categorie, Plat, PanierItem } from '@/types'
import { ShoppingCart, Plus, Minus, MessageCircle, MapPin, Phone, X } from 'lucide-react'

export default function RestaurantPage() {
  const { slug } = useParams()
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [panier, setPanier] = useState<PanierItem[]>([])
  const [showPanier, setShowPanier] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '', type: 'sur_place', commentaire: '' })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function loadMenu() {
    const { data: r } = await supabase
      .from('restaurants').select('*')
      .eq('slug', slug).eq('actif', true).single()
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

  useEffect(() => { 
    if (slug) {
      (async () => {
        await loadMenu()
      })()
    }
  }, [slug])

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
    setSending(true)

    // Upsert client
    const { data: client } = await supabase.from('clients')
      .upsert(
        { restaurant_id: restaurant.id, nom: form.nom, telephone: form.telephone },
        { onConflict: 'restaurant_id,telephone' }
      ).select().single()

    // Créer commande
    const numero = `CMD-${new Date().getTime().toString().slice(-4)}`
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

    // Message WhatsApp
    const txt =
      `🍽️ *Nouvelle commande — ${restaurant.nom}*\n\n` +
      `*N°:* ${numero}\n` +
      `*Type:* ${form.type.replace('_', ' ')}\n` +
      `*Client:* ${form.nom}\n` +
      `*Tél:* ${form.telephone}\n\n` +
      `*Commande:*\n` +
      panier.map(i => `• ${i.plat.nom} x${i.quantite} — ${formatPrix(i.plat.prix * i.quantite)}`).join('\n') +
      `\n\n*Total: ${formatPrix(total)}*` +
      (form.commentaire ? `\n\n*Note:* ${form.commentaire}` : '')

    window.open(
      `https://wa.me/${restaurant.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`,
      '_blank'
    )

    setPanier([])
    setShowPanier(false)
    setSending(false)
    setDone(true)
    setTimeout(() => setDone(false), 4000)
  }

  // ── Loader ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement du menu...</div>
    </div>
  )

  // ── 404 ───────────────────────────────────────────────────
  if (!restaurant) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <p className="text-gray-600 font-medium">Restaurant introuvable</p>
        <p className="text-gray-400 text-sm mt-1">Vérifiez le lien et réessayez</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Notification succès */}
      {done && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium">
          ✅ Commande envoyée avec succès !
        </div>
      )}

      {/* Header */}
      <div className="bg-orange-500 text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">{restaurant.nom}</h1>
          {restaurant.adresse && (
            <p className="flex items-center gap-1.5 text-orange-100 text-sm mt-2">
              <MapPin size={14} /> {restaurant.adresse}, {restaurant.ville}
            </p>
          )}
          {restaurant.telephone && (
            <p className="flex items-center gap-1.5 text-orange-100 text-sm mt-1">
              <Phone size={14} /> {restaurant.telephone}
            </p>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-36">
        {plats.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🍽️</div>
            <p>Le menu n&apos;est pas encore disponible</p>
          </div>
        ) : categories.length > 0 ? (
          categories.map(cat => {
            const cPlats = plats.filter(p => p.categorie_id === cat.id)
            if (cPlats.length === 0) return null
            return (
              <div key={cat.id} className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-orange-100">
                  {cat.nom}
                </h2>
                <div className="space-y-3">
                  {cPlats.map(plat => (
                    <PlatCard key={plat.id} plat={plat} panier={panier} onAdd={addToPanier} onRemove={removeFromPanier} />
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <div className="space-y-3 mt-2">
            {plats.map(plat => (
              <PlatCard key={plat.id} plat={plat} panier={panier} onAdd={addToPanier} onRemove={removeFromPanier} />
            ))}
          </div>
        )}
      </div>

      {/* Bouton panier fixe */}
      {nbItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setShowPanier(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-between px-6 shadow-2xl transition-colors">
              <span className="bg-white/25 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {nbItems}
              </span>
              <span className="flex items-center gap-2"><ShoppingCart size={18} /> Voir mon panier</span>
              <span>{formatPrix(total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">🛒 Mon panier</h2>
              <button onClick={() => setShowPanier(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="space-y-1 mb-6">
              {panier.map(item => (
                <div key={item.plat.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {item.plat.image_url && (
                      <img src={item.plat.image_url} alt={item.plat.nom} className="w-12 h-12 rounded-xl object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{item.plat.nom}</p>
                      <p className="text-sm text-orange-500 font-semibold">{formatPrix(item.plat.prix)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => removeFromPanier(item.plat.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-5 text-center">{item.quantite}</span>
                    <button onClick={() => addToPanier(item.plat)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire */}
            <div className="space-y-3 mb-5">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500 bg-gray-50">
                <option value="sur_place">🪑 Sur place</option>
                <option value="emporter">🥡 À emporter</option>
                <option value="livraison">🛵 Livraison</option>
              </select>
              <input placeholder="Votre nom *" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500 bg-gray-50" />
              <input placeholder="Votre téléphone *" value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500 bg-gray-50" />
              <textarea placeholder="Commentaire (optionnel)" value={form.commentaire}
                onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-orange-500 bg-gray-50 resize-none h-20" />
            </div>

            {/* Total + bouton */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-bold text-gray-800 text-lg">Total</span>
              <span className="text-2xl font-black text-orange-500">{formatPrix(total)}</span>
            </div>
            <button onClick={commander}
              disabled={sending || !form.nom || !form.telephone}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-lg">
              <MessageCircle size={22} />
              {sending ? 'Envoi...' : 'Commander via WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant carte plat ──────────────────────────────────────
function PlatCard({ plat, panier, onAdd, onRemove }: {
  plat: Plat
  panier: PanierItem[]
  onAdd: (p: Plat) => void
  onRemove: (id: string) => void
}) {
  const item = panier.find(i => i.plat.id === plat.id)
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:border-orange-100 transition-colors">
      {plat.image_url ? (
        <img src={plat.image_url} alt={plat.nom} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-3xl">🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">{plat.nom}</p>
        {plat.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{plat.description}</p>}
        <p className="text-orange-500 font-bold mt-2">{formatPrix(plat.prix)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item ? (
          <>
            <button onClick={() => onRemove(plat.id)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Minus size={14} />
            </button>
            <span className="font-bold w-5 text-center">{item.quantite}</span>
            <button onClick={() => onAdd(plat)}
              className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors">
              <Plus size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => onAdd(plat)}
            className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md shadow-orange-200">
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  )
}