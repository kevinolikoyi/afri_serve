'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { genererSlug } from '@/lib/utils'
import type { Restaurant } from '@/types'
import { Save, Store } from 'lucide-react'

export default function ParalametresPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState({
    nom: '', whatsapp: '', telephone: '', adresse: '', ville: '', description: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: r } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single()
    if (!r) { setLoading(false); return }
    setRestaurant(r)
    setForm({
      nom: r.nom ?? '',
      whatsapp: r.whatsapp ?? '',
      telephone: r.telephone ?? '',
      adresse: r.adresse ?? '',
      ville: r.ville ?? '',
      description: r.description ?? '',
    })
    setLoading(false)
  }

  async function handleSave() {
    if (!restaurant) return
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    if (!form.whatsapp.trim()) { setError('Le numéro WhatsApp est obligatoire.'); return }

    setSaving(true); setError(''); setSuccess('')

    // Regénérer le slug si le nom a changé
    const newSlug = form.nom.trim() !== restaurant.nom
      ? genererSlug(form.nom.trim())
      : restaurant.slug

    const { error: dbError } = await supabase.from('restaurants').update({
      nom: form.nom.trim(),
      slug: newSlug,
      whatsapp: form.whatsapp.trim(),
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      ville: form.ville.trim() || 'Cotonou',
      description: form.description.trim() || null,
    }).eq('id', restaurant.id)

    if (dbError) {
      setError('Erreur : ' + dbError.message)
    } else {
      setSuccess('Informations mises à jour ✅')
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-2xl">

      {/* Notifications */}
      {success && <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-medium shadow-lg">{success}</div>}
      {error && <div className="fixed top-4 right-4 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm font-medium shadow-lg">{error}</div>}

      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1 text-sm">Mettez à jour les informations de votre restaurant</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 lg:p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <Store className="text-orange-500" size={20} />
          <h2 className="font-bold text-white">Informations du restaurant</h2>
        </div>

        <div className="space-y-4">

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom du restaurant <span className="text-orange-500">*</span>
            </label>
            <input
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Chez Maman"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {form.nom && form.nom !== restaurant?.nom && (
              <p className="text-xs text-gray-500 mt-1">
                Nouveau lien : <span className="text-orange-400">/resto/{genererSlug(form.nom)}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez votre restaurant en quelques mots..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none h-24"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Numéro WhatsApp <span className="text-orange-500">*</span>
            </label>
            <input
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder="+229 97 00 00 00"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
            <input
              value={form.telephone}
              onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
              placeholder="+229 21 00 00 00"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Adresse + Ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse</label>
              <input
                value={form.adresse}
                onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                placeholder="Ex: Rue 123, Akpakpa"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ville</label>
              <input
                value={form.ville}
                onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                placeholder="Ex: Cotonou"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Lien public actuel */}
          <div className="bg-gray-800 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Lien public actuel</p>
            <p className="text-orange-400 text-sm font-mono">
              {process.env.NEXT_PUBLIC_APP_URL}/resto/{restaurant?.slug}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50">
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  )
}