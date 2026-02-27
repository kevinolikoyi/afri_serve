'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/utils'
import type { Plat, Categorie, Restaurant } from '@/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, FolderPlus, X, ChevronDown, ImagePlus, Loader2 } from 'lucide-react'

type PlatForm = {
  id?: string
  nom: string
  description: string
  prix: string
  categorie_id: string
  disponible: boolean
  image_url: string
}

const FORM_INIT: PlatForm = {
  nom: '', description: '', prix: '', categorie_id: '', disponible: true, image_url: ''
}

export default function MenuPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [showPlatForm, setShowPlatForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [form, setForm] = useState<PlatForm>(FORM_INIT)
  const [catNom, setCatNom] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [preview, setPreview] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setPageLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: r } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single()
    if (!r) { setPageLoading(false); return }
    setRestaurant(r)
    const [{ data: cats }, { data: pls }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', r.id).order('ordre'),
      supabase.from('plats').select('*').eq('restaurant_id', r.id).order('ordre'),
    ])
    setCategories(cats ?? [])
    setPlats(pls ?? [])
    setPageLoading(false)
  }

  function notify(msg: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
    else { setError(msg); setTimeout(() => setError(''), 4000) }
  }

  // ── Upload image ──────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !restaurant) return

    // Validation
    if (!file.type.startsWith('image/')) { notify('Fichier invalide. Choisissez une image.', 'error'); return }
    if (file.size > 3 * 1024 * 1024) { notify('Image trop lourde. Maximum 3 Mo.', 'error'); return }

    // Aperçu local immédiat
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    // Supprimer l'ancienne image si elle existe
    if (form.image_url) {
      const oldPath = form.image_url.split('/plats/')[1]
      if (oldPath) await supabase.storage.from('plats').remove([oldPath])
    }

    // Upload vers Supabase Storage
    const ext = file.name.split('.').pop()
    const fileName = `${restaurant.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('plats')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      notify('Erreur upload : ' + uploadError.message, 'error')
      setPreview('')
      setUploading(false)
      return
    }

    // Récupérer l'URL publique
    const { data } = supabase.storage.from('plats').getPublicUrl(fileName)
    setForm(f => ({ ...f, image_url: data.publicUrl }))
    setUploading(false)
    notify('Image uploadée ✅')
  }

  async function removeImage() {
    if (form.image_url) {
      const path = form.image_url.split('/plats/')[1]
      if (path) await supabase.storage.from('plats').remove([path])
    }
    setForm(f => ({ ...f, image_url: '' }))
    setPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Sauvegarder un plat ───────────────────────────────────
  async function savePlat() {
    if (!restaurant) return
    if (!form.nom.trim()) { notify('Le nom du plat est obligatoire.', 'error'); return }
    if (!form.prix || isNaN(Number(form.prix)) || Number(form.prix) <= 0) {
      notify('Le prix doit être un nombre valide.', 'error'); return
    }

    setLoading(true)
    const payload = {
      restaurant_id: restaurant.id,
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      prix: Number(form.prix),
      categorie_id: form.categorie_id || null,
      disponible: form.disponible,
      image_url: form.image_url || null,
    }

    if (form.id) {
      const { error } = await supabase.from('plats').update(payload).eq('id', form.id)
      if (error) { notify('Erreur : ' + error.message, 'error'); setLoading(false); return }
      notify('Plat modifié ✅')
    } else {
      const { error } = await supabase.from('plats').insert(payload)
      if (error) { notify('Erreur : ' + error.message, 'error'); setLoading(false); return }
      notify('Plat ajouté ✅')
    }

    closeForm()
    await loadData()
    setLoading(false)
  }

  function closeForm() {
    setShowPlatForm(false)
    setForm(FORM_INIT)
    setPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openEdit(plat: Plat) {
    setForm({
      id: plat.id,
      nom: plat.nom,
      description: plat.description ?? '',
      prix: String(plat.prix),
      categorie_id: plat.categorie_id ?? '',
      disponible: plat.disponible,
      image_url: plat.image_url ?? '',
    })
    setPreview(plat.image_url ?? '')
    setShowPlatForm(true)
  }

  // ── Catégorie ─────────────────────────────────────────────
  async function saveCategorie() {
    if (!restaurant || !catNom.trim()) { notify('Nom obligatoire.', 'error'); return }
    setLoading(true)
    const { error } = await supabase.from('categories').insert({
      restaurant_id: restaurant.id, nom: catNom.trim(), ordre: categories.length,
    })
    if (error) { notify('Erreur : ' + error.message, 'error'); setLoading(false); return }
    notify('Catégorie créée ✅')
    setCatNom(''); setShowCatForm(false)
    await loadData(); setLoading(false)
  }

  async function deleteCategorie(id: string) {
    const nb = plats.filter(p => p.categorie_id === id).length
    if (nb > 0) { notify(`${nb} plat(s) dans cette catégorie. Déplacez-les d'abord.`, 'error'); return }
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('categories').delete().eq('id', id)
    notify('Catégorie supprimée')
    await loadData()
  }

  async function toggleDispo(plat: Plat) {
    await supabase.from('plats').update({ disponible: !plat.disponible }).eq('id', plat.id)
    setPlats(p => p.map(pl => pl.id === plat.id ? { ...pl, disponible: !pl.disponible } : pl))
  }

  async function deletePlat(id: string) {
    if (!confirm('Supprimer ce plat ?')) return
    const plat = plats.find(p => p.id === id)
    if (plat?.image_url) {
      const path = plat.image_url.split('/plats/')[1]
      if (path) await supabase.storage.from('plats').remove([path])
    }
    await supabase.from('plats').delete().eq('id', id)
    notify('Plat supprimé')
    setPlats(p => p.filter(pl => pl.id !== id))
  }

  const platsFiltres = filterCat === 'all' ? plats
    : filterCat === 'sans' ? plats.filter(p => !p.categorie_id)
    : plats.filter(p => p.categorie_id === filterCat)

  const imgSrc = preview || form.image_url

  if (pageLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-5xl">

      {/* Notifications */}
      {success && <div className="fixed top-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-medium shadow-lg">{success}</div>}
      {error && <div className="fixed top-6 right-6 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm font-medium shadow-lg">{error}</div>}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Gestion du menu</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {plats.length} plat{plats.length > 1 ? 's' : ''} • {plats.filter(p => p.disponible).length} disponible{plats.filter(p => p.disponible).length > 1 ? 's' : ''} • {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 lg:gap-3">
          <button onClick={() => setShowCatForm(true)}
            className="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs lg:text-sm font-medium transition-colors">
            <FolderPlus size={15} /> <span className="hidden sm:inline">Catégorie</span>
          </button>
          {categories.length > 0 && (
            <button onClick={() => { setForm(FORM_INIT); setPreview(''); setShowPlatForm(true) }}
              className="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs lg:text-sm font-bold transition-colors">
              <Plus size={15} /> <span className="hidden sm:inline">Ajouter un plat</span><span className="sm:hidden">Plat</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { id: 'all', nom: 'Tous', count: plats.length },
            ...categories.map(c => ({ id: c.id, nom: c.nom, count: plats.filter(p => p.categorie_id === c.id).length })),
            { id: 'sans', nom: 'Sans catégorie', count: plats.filter(p => !p.categorie_id).length },
          ].map(({ id, nom, count }) => (
            <button key={id} onClick={() => setFilterCat(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                ${filterCat === id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
              {nom}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterCat === id ? 'bg-white/20' : 'bg-gray-700'}`}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de catégorie */}
      {categories.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-gray-400 font-medium mb-1">Commencez par créer une catégorie</p>
          <p className="text-gray-600 text-sm mb-5">Ex : Plats du jour, Boissons, Desserts...</p>
          <button onClick={() => setShowCatForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
            <FolderPlus size={16} /> Créer une catégorie
          </button>
        </div>
      )}

      {/* Gestion catégories */}
      {categories.length > 0 && (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégories</p>
            <button onClick={() => { setForm(FORM_INIT); setPreview(''); setShowPlatForm(true) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors">
              <Plus size={13} /> Ajouter un plat
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-300">{cat.nom}</span>
                <span className="text-xs text-gray-500">{plats.filter(p => p.categorie_id === cat.id).length} plat(s)</span>
                <button onClick={() => deleteCategorie(cat.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste plats */}
      {platsFiltres.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-lg font-medium text-gray-500 mb-2">Aucun plat pour l'instant</p>
          <p className="text-sm">Cliquez sur "Ajouter un plat" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {platsFiltres.map(plat => {
            const cat = categories.find(c => c.id === plat.categorie_id)
            return (
              <div key={plat.id}
                className={`bg-gray-900 border rounded-xl px-5 py-4 flex items-center justify-between transition-all
                  ${plat.disponible ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  {/* Miniature */}
                  {plat.image_url ? (
                    <img src={plat.image_url} alt={plat.nom}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-700">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plat.disponible ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{plat.nom}</p>
                      {cat && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">{cat.nom}</span>}
                      {!plat.disponible && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-500">Indisponible</span>}
                    </div>
                    {plat.description && <p className="text-sm text-gray-500 mt-0.5 max-w-lg truncate">{plat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-orange-400 font-bold text-lg">{formatPrix(plat.prix)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleDispo(plat)} title={plat.disponible ? 'Masquer' : 'Afficher'}
                      className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                      {plat.disponible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => openEdit(plat)}
                      className="p-2 text-gray-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-800">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deletePlat(plat.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Plat ── */}
      {showPlatForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{form.id ? '✏️ Modifier le plat' : '➕ Nouveau plat'}</h2>
              <button onClick={closeForm} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">

              {/* Upload image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo du plat</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                {imgSrc ? (
                  <div className="relative group">
                    <img src={imgSrc} alt="aperçu"
                      className="w-full h-48 object-cover rounded-xl border border-gray-700" />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                        <Loader2 className="text-white animate-spin" size={28} />
                      </div>
                    )}
                    {!uploading && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-gray-900 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-100">
                          <ImagePlus size={14} /> Changer
                        </button>
                        <button onClick={removeImage}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-600">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-500 hover:bg-orange-500/5 transition-all group">
                    {uploading ? (
                      <Loader2 className="text-orange-500 animate-spin" size={28} />
                    ) : (
                      <>
                        <ImagePlus className="text-gray-600 group-hover:text-orange-500 transition-colors" size={28} />
                        <p className="text-sm text-gray-500 group-hover:text-gray-400">Cliquez pour ajouter une photo</p>
                        <p className="text-xs text-gray-600">JPG, PNG, WEBP • Max 3 Mo</p>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom du plat <span className="text-orange-500">*</span></label>
                <input placeholder="Ex: Riz sauce graine" value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea placeholder="Ex: Riz blanc accompagné de sauce graine maison..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none h-20" />
              </div>

              {/* Prix + Catégorie */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Prix (F CFA) <span className="text-orange-500">*</span></label>
                  <input type="number" placeholder="Ex: 1500" value={form.prix}
                    onChange={e => setForm(f => ({ ...f, prix: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Catégorie</label>
                  <div className="relative">
                    <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none">
                      <option value="">Sans catégorie</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Disponibilité */}
              <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Disponible</p>
                  <p className="text-xs text-gray-500 mt-0.5">Visible sur votre menu public</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.disponible ? 'bg-orange-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.disponible ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeForm}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors">
                Annuler
              </button>
              <button onClick={savePlat} disabled={loading || uploading}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
                {loading ? 'Enregistrement...' : form.id ? 'Mettre à jour' : 'Ajouter le plat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Catégorie ── */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">📁 Nouvelle catégorie</h2>
              <button onClick={() => { setShowCatForm(false); setCatNom('') }} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom <span className="text-orange-500">*</span></label>
            <input placeholder="Ex: Plats du jour, Boissons, Desserts..." value={catNom}
              onChange={e => setCatNom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCategorie()}
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCatForm(false); setCatNom('') }}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors">Annuler</button>
              <button onClick={saveCategorie} disabled={loading}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}