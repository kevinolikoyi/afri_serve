'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { useRole } from '@/lib/useRole'
import { useRouter } from 'next/navigation'
import { UserCog, Plus, X, Mail, Shield, ShieldOff, Trash2, Crown, User, RefreshCw } from 'lucide-react'

type Member = {
  id: string
  user_id: string
  role: 'admin' | 'staff'
  nom: string | null
  email: string | null
  actif: boolean
  created_at: string
}

const PERMISSIONS = [
  { label: 'Voir les commandes',           admin: true,  staff: true  },
  { label: 'Changer le statut commande',   admin: true,  staff: true  },
  { label: 'Voir les clients',             admin: true,  staff: true  },
  { label: 'Voir les statistiques',        admin: true,  staff: true  },
  { label: "Voir le chiffre d'affaires",   admin: true,  staff: false },
  { label: 'Gérer le menu',                admin: true,  staff: false },
  { label: 'Gérer le profil restaurant',   admin: true,  staff: false },
  { label: 'Gérer le staff',               admin: true,  staff: false },
  { label: 'Annuler une commande',         admin: true,  staff: false },
]

export default function StaffPage() {
  const supabase = createClient()
  const router = useRouter()
  const { isAdmin, restaurantId, loading: roleLoading } = useRole()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPerms, setShowPerms] = useState(false)
  const [form, setForm] = useState({ email: '', nom: '', role: 'staff' })
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!roleLoading && !isAdmin) router.replace('/dashboard')
  }, [roleLoading, isAdmin])

  useEffect(() => {
    if (!roleLoading && isAdmin && restaurantId) loadMembers()
  }, [roleLoading, isAdmin, restaurantId])

  function notify(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('restaurant_members')
      .select('*')
      .eq('restaurant_id', restaurantId!)
      .order('created_at', { ascending: true })
    setMembers(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ email: '', nom: '', role: 'staff' })
    setShowForm(false)
  }

  async function handleInvite() {
    if (!form.email.trim()) { notify('Email obligatoire.', 'error'); return }
    if (!restaurantId) return

    if (members.find(m => m.email === form.email.trim())) {
      notify('Ce membre est déjà dans votre équipe.', 'error'); return
    }

    setSaving(true)

    // Résoudre le user_id via RPC (auth.users inaccessible côté client)
    const { data: userId, error: rpcError } = await supabase
      .rpc('get_user_id_by_email', { p_email: form.email.trim() })

    if (rpcError || !userId) {
      notify("Aucun compte trouvé. La personne doit d'abord créer un compte MenuQR.", 'error')
      setSaving(false); return
    }

    const { error } = await supabase.from('restaurant_members').insert({
      restaurant_id: restaurantId,
      user_id: userId,
      role: form.role,
      nom: form.nom.trim() || null,
      email: form.email.trim(),
      actif: true,
    })

    if (error) {
      notify('Erreur : ' + error.message, 'error')
    } else {
      notify(`Membre ajouté en tant que ${form.role} ✅`)
      resetForm()
      await loadMembers()
    }
    setSaving(false)
  }

  async function toggleRole(m: Member) {
    setActionId(m.id)
    const newRole = m.role === 'admin' ? 'staff' : 'admin'
    const { error } = await supabase
      .from('restaurant_members').update({ role: newRole }).eq('id', m.id)
    if (error) notify('Erreur : ' + error.message, 'error')
    else { notify(`Rôle changé → ${newRole} ✅`); await loadMembers() }
    setActionId(null)
  }

  async function toggleActif(m: Member) {
    setActionId(m.id)
    const { error } = await supabase
      .from('restaurant_members').update({ actif: !m.actif }).eq('id', m.id)
    if (error) notify('Erreur : ' + error.message, 'error')
    else { notify(m.actif ? 'Membre désactivé' : 'Membre réactivé ✅'); await loadMembers() }
    setActionId(null)
  }

  async function deleteMember(m: Member) {
    if (!confirm(`Supprimer ${m.nom ?? m.email} de l'équipe ?`)) return
    setActionId(m.id)
    const { error } = await supabase
      .from('restaurant_members').delete().eq('id', m.id)
    if (error) notify('Erreur : ' + error.message, 'error')
    else { notify('Membre supprimé'); await loadMembers() }
    setActionId(null)
  }

  const admins = members.filter(m => m.role === 'admin')
  const staffs = members.filter(m => m.role === 'staff')

  if (loading || roleLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Chargement...</div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-3xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Gestion du staff</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {members.length} membre{members.length > 1 ? 's' : ''} •{' '}
            {members.filter(m => m.actif).length} actif{members.filter(m => m.actif).length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadMembers}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Section Admins */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={13} className="text-orange-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Admins ({admins.length})
          </p>
        </div>
        <div className="space-y-2">
          {admins.map(m => (
            <MemberCard key={m.id} member={m}
              isLoading={actionId === m.id}
              isLastAdmin={admins.length <= 1}
              onToggleRole={() => toggleRole(m)}
              onToggleActif={() => toggleActif(m)}
              onDelete={() => deleteMember(m)}
            />
          ))}
        </div>
      </section>

      {/* Section Staff */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <User size={13} className="text-blue-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Staff ({staffs.length})
          </p>
        </div>
        {staffs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
            <UserCog size={30} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-1">Aucun staff ajouté</p>
            <p className="text-gray-600 text-xs mb-4">
              Invitez des membres pour gérer les commandes
            </p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
              <Plus size={14} /> Ajouter un staff
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {staffs.map(m => (
              <MemberCard key={m.id} member={m}
                isLoading={actionId === m.id}
                isLastAdmin={false}
                onToggleRole={() => toggleRole(m)}
                onToggleActif={() => toggleActif(m)}
                onDelete={() => deleteMember(m)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tableau permissions (collapsible) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowPerms(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Permissions par rôle
          </p>
          <span className="text-gray-600 text-xs">{showPerms ? '▲ Masquer' : '▼ Afficher'}</span>
        </button>

        {showPerms && (
          <div className="px-5 pb-5 border-t border-gray-800">
            {/* En-tête */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Action</span>
              <span className="text-center text-orange-400">Admin</span>
              <span className="text-center text-blue-400">Staff</span>
            </div>
            <div className="space-y-0 divide-y divide-gray-800">
              {PERMISSIONS.map(({ label, admin, staff }) => (
                <div key={label} className="grid grid-cols-[1fr_80px_80px] gap-2 py-2.5 items-center">
                  <span className="text-gray-400 text-xs">{label}</span>
                  <span className="text-center text-sm">{admin ? '✅' : '—'}</span>
                  <span className="text-center text-sm">{staff ? '✅' : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <p className="text-xs text-gray-600 mt-4 text-center">
        ⚠️ Le membre doit d'abord créer un compte sur MenuQR avant d'être ajouté.
      </p>

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">👤 Ajouter un membre</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Jean Kouassi"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="staff@restaurant.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['staff', 'admin'] as const).map(r => (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors
                        ${form.role === r
                          ? r === 'admin'
                            ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                            : 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                      {r === 'admin' ? <><Crown size={14} /> Admin</> : <><User size={14} /> Staff</>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {form.role === 'staff'
                    ? 'Commandes, clients (lecture), statistiques opérationnelles.'
                    : 'Accès complet au dashboard, y compris la gestion du staff.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors">
                Annuler
              </button>
              <button onClick={handleInvite} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50">
                {saving ? 'Vérification...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Carte membre ──────────────────────────────────────────────
function MemberCard({ member, isLoading, isLastAdmin, onToggleRole, onToggleActif, onDelete }: {
  member: Member
  isLoading: boolean
  isLastAdmin: boolean
  onToggleRole: () => void
  onToggleActif: () => void
  onDelete: () => void
}) {
  const initiale = (member.nom ?? member.email ?? '?')[0].toUpperCase()

  return (
    <div className={`bg-gray-900 border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all
      ${!member.actif ? 'border-gray-800/40 opacity-50' : 'border-gray-800 hover:border-gray-700'}`}>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
        ${member.role === 'admin' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>
        {initiale}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">
            {member.nom ?? member.email ?? 'Inconnu'}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${member.role === 'admin'
              ? 'bg-orange-500/10 text-orange-400'
              : 'bg-blue-500/10 text-blue-400'}`}>
            {member.role === 'admin' ? '👑 Admin' : '👤 Staff'}
          </span>
          {!member.actif && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-500">Inactif</span>
          )}
        </div>
        {member.nom && member.email && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{member.email}</p>
        )}
        <p className="text-xs text-gray-600 mt-0.5">Ajouté le {formatDate(member.created_at)}</p>
      </div>

      {/* Actions */}
      {isLoading ? (
        <div className="text-gray-500 text-xs animate-pulse px-2">...</div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Changer rôle */}
          <button onClick={onToggleRole} disabled={isLastAdmin}
            title={isLastAdmin ? 'Impossible : dernier admin' : `Passer en ${member.role === 'admin' ? 'staff' : 'admin'}`}
            className="p-2 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            {member.role === 'admin' ? <ShieldOff size={15} /> : <Shield size={15} />}
          </button>

          {/* Activer / désactiver */}
          <button onClick={onToggleActif} disabled={isLastAdmin}
            title={member.actif ? 'Désactiver' : 'Réactiver'}
            className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed
              ${member.actif
                ? 'text-gray-500 hover:text-yellow-400 hover:bg-gray-800'
                : 'text-green-400 hover:bg-gray-800'}`}>
            {member.actif ? <ShieldOff size={15} /> : <Shield size={15} />}
          </button>

          {/* Supprimer */}
          <button onClick={onDelete} disabled={isLastAdmin}
            title={isLastAdmin ? 'Impossible : dernier admin' : 'Supprimer'}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  )
}