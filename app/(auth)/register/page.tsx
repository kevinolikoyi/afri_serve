'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { genererSlug } from '@/lib/utils'
import { QrCode } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', nomRestaurant: '', whatsapp: '', ville: 'Cotonou' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleRegister() {
    setLoading(true); setError('')
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password
    })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      const slug = genererSlug(form.nomRestaurant)
      const { error: dbError } = await supabase.from('restaurants').insert({
        user_id: data.user.id,
        nom: form.nomRestaurant,
        slug,
        whatsapp: form.whatsapp,
        ville: form.ville,
      })
      if (dbError) { setError(dbError.message); setLoading(false); return }
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="text-orange-500" size={32} />
            <span className="text-3xl font-bold text-white">Menu<span className="text-orange-500">QR</span></span>
          </div>
          <p className="text-gray-400">Créez votre espace restaurant en 2 minutes</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            {[
              { key: 'nomRestaurant', label: 'Nom du restaurant', placeholder: 'Chez Maman', type: 'text' },
              { key: 'whatsapp', label: 'Numéro WhatsApp', placeholder: '+229 97 00 00 00', type: 'tel' },
              { key: 'ville', label: 'Ville', placeholder: 'Cotonou', type: 'text' },
              { key: 'email', label: 'Email', placeholder: 'vous@restaurant.com', type: 'email' },
              { key: 'password', label: 'Mot de passe', placeholder: '••••••••', type: 'password' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <input type={type} value={form[key as keyof typeof form]}
                  onChange={e => update(key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder={placeholder} />
              </div>
            ))}
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Création...' : 'Créer mon restaurant'}
            </button>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
