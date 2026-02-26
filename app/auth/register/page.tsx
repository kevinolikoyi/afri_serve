'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { genererSlug } from '@/lib/utils'
import { QrCode } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', nomRestaurant: '', whatsapp: '', ville: 'Cotonou'
  })
  const [error, setError] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function addLog(msg: string) {
    console.log(msg)
    setLog(l => [...l, msg])
  }

  async function handleRegister() {
    if (!form.email || !form.password || !form.nomRestaurant || !form.whatsapp) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    setError('')
    setLog([])

    try {
      // ── 1. Créer le compte ──────────────────────────────
      addLog('1. Création du compte auth...')
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        addLog('❌ Erreur auth : ' + authError.message)
        setError(authError.message)
        setLoading(false)
        return
      }

      addLog('✅ Compte créé — user id : ' + data.user?.id)

      const userId = data.user?.id
      if (!userId) {
        addLog('❌ userId est undefined')
        setError('Impossible de récupérer l\'identifiant utilisateur.')
        setLoading(false)
        return
      }

      // ── 2. Vérifier la session active ───────────────────
      addLog('2. Vérification de la session...')
      const { data: sessionData } = await supabase.auth.getSession()
      addLog('Session : ' + (sessionData.session ? '✅ active' : '❌ nulle — confirmation email requise'))

      if (!sessionData.session) {
        setError('Confirmez votre email avant de continuer, ou désactivez la confirmation dans Supabase → Auth → Email.')
        setLoading(false)
        return
      }

      // ── 3. Insérer le restaurant ────────────────────────
      addLog('3. Insertion du restaurant...')
      const slug = genererSlug(form.nomRestaurant)
      addLog('   slug généré : ' + slug)

      const payload = {
        user_id: userId,
        nom: form.nomRestaurant,
        slug,
        whatsapp: form.whatsapp,
        ville: form.ville,
        actif: true,
      }
      addLog('   payload : ' + JSON.stringify(payload))

      const { data: resto, error: dbError } = await supabase
        .from('restaurants')
        .insert(payload)
        .select()
        .single()

      if (dbError) {
        addLog('❌ Erreur DB : ' + JSON.stringify(dbError))

        // Slug en doublon → générer un slug unique
        if (dbError.code === '23505') {
          addLog('   → Slug en doublon, génération d\'un slug unique...')
          const slugUnique = `${slug}-${Date.now().toString().slice(-4)}`
          const { data: resto2, error: retryError } = await supabase
            .from('restaurants')
            .insert({ ...payload, slug: slugUnique })
            .select()
            .single()

          if (retryError) {
            addLog('❌ Échec retry : ' + JSON.stringify(retryError))
            setError('Erreur DB : ' + retryError.message)
            setLoading(false)
            return
          }
          addLog('✅ Restaurant créé (slug unique) : ' + resto2?.id)
        } else {
          setError('Erreur DB [' + dbError.code + '] : ' + dbError.message)
          setLoading(false)
          return
        }
      } else {
        addLog('✅ Restaurant créé : ' + resto?.id)
      }

      // ── 4. Redirection ──────────────────────────────────
      addLog('4. Redirection vers /dashboard...')
      setLoading(false)
      router.refresh()
      router.push('/dashboard')

    } catch (err: any) {
      addLog('❌ Exception : ' + err.message)
      setError('Erreur inattendue : ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="text-orange-500" size={32} />
            <span className="text-3xl font-bold text-white">
              Menu<span className="text-orange-500">QR</span>
            </span>
          </div>
          <p className="text-gray-400">Créez votre espace restaurant en 2 minutes</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Logs de debug visibles à l'écran */}
          {log.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs font-mono text-gray-300 space-y-1 max-h-40 overflow-y-auto">
              {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}

          <div className="space-y-4">
            {[
              { key: 'nomRestaurant', label: 'Nom du restaurant *', placeholder: 'Chez Maman', type: 'text' },
              { key: 'whatsapp', label: 'Numéro WhatsApp *', placeholder: '+229 97 00 00 00', type: 'tel' },
              { key: 'ville', label: 'Ville', placeholder: 'Cotonou', type: 'text' },
              { key: 'email', label: 'Email *', placeholder: 'vous@restaurant.com', type: 'email' },
              { key: 'password', label: 'Mot de passe *', placeholder: '••••••••', type: 'password' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => update(key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Création en cours...' : 'Créer mon restaurant'}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}