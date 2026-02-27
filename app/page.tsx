import Link from 'next/link'
import { QrCode, MessageCircle, BarChart2, Users, Smartphone, Zap, CheckCircle, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0F0F0F]/85 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <QrCode className="text-orange-500" size={24} />
          <span className="text-xl font-bold">Menu<span className="text-orange-500">QR</span></span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="#fonctionnalites" className="text-gray-400 hover:text-white text-sm transition-colors">Fonctionnalités</a>
          <a href="#comment" className="text-gray-400 hover:text-white text-sm transition-colors">Comment ça marche</a>
          <a href="#tarifs" className="text-gray-400 hover:text-white text-sm transition-colors">Tarifs</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" 
            target="_blank" 
            className="text-gray-400 hover:text-white text-sm transition-colors hidden sm:block">
            Connexion
          </Link>
          <Link href="/auth/register"
            target="_blank"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-orange-500/20">
            Démarrer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Texte */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🇧🇯 Fait pour l&apos;Afrique francophone
              </div>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
                Votre restaurant,<br />
                <span className="text-orange-500">100% digital</span><br />
                en quelques minutes
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                Menu en ligne, QR code, commandes WhatsApp, historique clients et statistiques — tout pour moderniser votre restaurant au Bénin et en Afrique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register"
                  target="_blank"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  🚀 Commencer gratuitement
                </Link>
                <a href="#comment"
                  className="border border-white/15 hover:border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:bg-white/5">
                  Voir comment ça marche <ArrowRight size={18} />
                </a>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative animate-float">
                <div className="w-[260px] sm:w-[300px] bg-[#1A1A1A] border-2 border-white/10 rounded-[40px] p-5 shadow-2xl">
                  {/* Notch */}
                  <div className="w-20 h-5 bg-[#0F0F0F] rounded-xl mx-auto mb-4" />
                  {/* Screen */}
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-orange-500 px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🍽️</div>
                      <div>
                        <p className="text-white font-bold text-sm">Chez Maman</p>
                        <p className="text-orange-100 text-xs">Menu digital • Cotonou</p>
                      </div>
                    </div>
                    {/* QR */}
                    <div className="flex justify-center py-4 bg-gray-50">
                      <div className="w-24 h-24 bg-[#1A1A1A] rounded-xl grid grid-cols-5 gap-1 p-2">
                        {[1,0,1,0,1, 1,1,0,1,1, 0,1,1,0,1, 1,0,0,1,0, 1,1,0,1,1].map((v, i) => (
                          <div key={i} className={`rounded-sm ${v ? 'bg-white' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                    {/* Menu items */}
                    <div className="px-3 pb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🍲 Plats du jour</p>
                      {[
                        ['Riz sauce graine', '1 500 F'],
                        ['Poulet braisé', '2 500 F'],
                        ['Attiéké poisson', '1 800 F'],
                      ].map(([nom, prix]) => (
                        <div key={nom} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="text-xs font-medium text-gray-800">{nom}</span>
                          <span className="text-xs font-bold text-orange-500">{prix}</span>
                        </div>
                      ))}
                    </div>
                    {/* WA button */}
                    <div className="px-3 pb-3">
                      <div className="bg-[#25D366] text-white text-center py-2.5 rounded-xl text-xs font-bold">
                        📲 Commander via WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow sous le phone */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-8 bg-orange-500/20 blur-xl rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="border-y border-white/5 bg-[#1A1A1A] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '5 min', label: 'Pour créer votre espace digital' },
            { num: '0', label: 'Compétence technique requise' },
            { num: '+40%', label: 'De commandes en moyenne' },
            { num: '6', label: 'Pays couverts d\'ici 2026' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="text-3xl font-black text-orange-500 mb-1">{num}</div>
              <div className="text-gray-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLÈMES ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-3">Le problème</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Gérer un restaurant sans outils,<br className="hidden sm:block" /> ça coûte cher.</h2>
            <p className="text-gray-400 max-w-xl mx-auto">WhatsApp, cahiers, appels téléphoniques… les méthodes informelles freinent la croissance de votre restaurant.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '😰', title: 'Commandes perdues ou oubliées', desc: 'Sans système centralisé, chaque commande reçue sur WhatsApp risque d\'être oubliée.' },
              { icon: '📊', title: 'Aucun suivi des ventes', desc: 'Impossible de savoir quels plats se vendent le mieux ou d\'analyser votre chiffre d\'affaires.' },
              { icon: '👥', title: 'Clients fidèles non identifiés', desc: 'Vous ne savez pas qui sont vos meilleurs clients ni comment les fidéliser.' },
              { icon: '📱', title: 'Pas de présence en ligne', desc: 'Vos clients ne peuvent pas consulter votre menu depuis chez eux ou le partager.' },
              { icon: '⏰', title: 'Temps perdu à gérer les commandes', desc: 'Chaque commande par téléphone nécessite une attention manuelle qui ralentit votre équipe.' },
              { icon: '🚫', title: 'Croissance bloquée', desc: 'Sans outils adaptés, difficile de professionnaliser votre activité et d\'attirer plus de clients.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#1A1A1A] border border-white/7 rounded-2xl p-6 hover:border-orange-500/25 transition-colors">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" className="py-20 px-6 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-3">La solution</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Tout ce dont votre restaurant<br className="hidden sm:block" /> a besoin, en un seul outil</h2>
            <p className="text-gray-400 max-w-xl mx-auto">MenuQR vous donne tous les outils pour digitaliser, gérer et développer votre restaurant — sans aucune compétence technique.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { num: '01', icon: <Zap size={26} />, title: 'Création en 5 minutes', desc: 'Inscription simple, configuration guidée, et votre espace professionnel en ligne est immédiatement accessible.' },
              { num: '02', icon: <Smartphone size={26} />, title: 'Menu en ligne dynamique', desc: 'Ajoutez vos plats par catégories, modifiez les prix, activez ou désactivez les articles en temps réel.' },
              { num: '03', icon: <QrCode size={26} />, title: 'QR Code automatique', desc: 'Un QR code unique généré pour votre restaurant. Posez-le sur vos tables ou partagez-le en ligne.' },
              { num: '04', icon: <MessageCircle size={26} />, title: 'Commandes via WhatsApp', desc: 'Chaque commande est automatiquement formatée et envoyée sur votre WhatsApp. Zéro friction.' },
              { num: '05', icon: <Users size={26} />, title: 'Commandes à distance', desc: 'Vos clients commandent depuis n\'importe où via un lien unique — sur place, à emporter ou en livraison.' },
              { num: '06', icon: <BarChart2 size={26} />, title: 'Statistiques & fidélisation', desc: 'Suivez vos ventes, identifiez vos clients réguliers et prenez des décisions basées sur des données réelles.' },
            ].map(({ num, icon, title, desc }) => (
              <div key={title} className="bg-[#0F0F0F] border border-white/7 rounded-2xl p-7 hover:border-orange-500/25 hover:-translate-y-1 transition-all">
                <p className="text-orange-500 font-bold text-xs tracking-widest mb-4">{num}</p>
                <div className="text-orange-500 mb-4">{icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-3xl sm:text-4xl font-black">Lancez-vous en 4 étapes simples</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Créez votre compte', desc: 'Inscrivez votre restaurant en quelques clics. Aucune carte bancaire requise.' },
              { num: '2', title: 'Ajoutez votre menu', desc: 'Renseignez vos plats, prix et catégories. Ajoutez des photos pour mettre l\'eau à la bouche.' },
              { num: '3', title: 'Partagez votre QR code', desc: 'Affichez votre QR code sur les tables. Vos clients scannent et commandent immédiatement.' },
              { num: '4', title: 'Recevez les commandes', desc: 'Les commandes arrivent sur WhatsApp et dans votre dashboard. Gérez tout depuis un seul endroit.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-black mx-auto mb-5 shadow-lg shadow-orange-500/30">
                  {num}
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" className="py-20 px-6 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Simple, transparent,<br className="hidden sm:block" /> accessible à tous</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Des abonnements pensés pour les petites et grandes structures de restauration en Afrique.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 items-center">
            {[
              {
                name: 'Débutant', price: 'Gratuit', period: '', desc: 'Parfait pour tester la plateforme', featured: false,
                features: ['Menu en ligne (10 plats max)', 'QR code unique', 'Commandes WhatsApp', 'Tableau de bord basique'],
              },
              {
                name: 'Professionnel', price: '9 900 F', period: '/ mois', desc: 'Idéal pour les restaurants actifs', featured: true,
                features: ['Menu illimité avec photos', 'Page publique + lien partageable', 'Commandes à emporter & livraison', 'Historique clients automatique', 'Statistiques de ventes', 'Support prioritaire'],
              },
              {
                name: 'Business', price: '24 900 F', period: '/ mois', desc: 'Pour les structures en croissance', featured: false,
                features: ['Tout du plan Pro', 'Gestion multi-restaurants', 'Programme de fidélité avancé', 'Analyse intelligente (IA)', 'Paiement mobile intégré', 'Account manager dédié'],
              },
            ].map(({ name, price, period, desc, featured, features }) => (
              <div key={name}
                className={`rounded-2xl p-7 border relative transition-all
                  ${featured
                    ? 'bg-gradient-to-b from-orange-500/10 to-[#1A1A1A] border-orange-500 scale-105 shadow-2xl shadow-orange-500/10'
                    : 'bg-[#0F0F0F] border-white/8 hover:border-white/15'}`}>
                {featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ⭐ Populaire
                  </div>
                )}
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{name}</p>
                <div className="text-3xl font-black text-white mb-1">
                  {price} <span className="text-base font-normal text-gray-500">{period}</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">{desc}</p>
                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors
                    ${featured
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'}`}>
                  {name === 'Business' ? 'Contacter l\'équipe' : 'Choisir ce plan'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Prêt à digitaliser votre restaurant ?</h2>
          <p className="text-gray-400 text-lg mb-10">Rejoignez les restaurants béninois qui modernisent leur activité avec MenuQR. Démarrez gratuitement dès aujourd&apos;hui.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/25 hover:-translate-y-0.5">
              🚀 Commencer gratuitement
            </Link>
            <a href={`https://wa.me/22900000000`}
              target="_blank"
              className="bg-[#25D366] hover:opacity-90 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20">
              <MessageCircle size={20} /> Discuter sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#1A1A1A] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <QrCode className="text-orange-500" size={20} />
            <span className="text-lg font-bold">Menu<span className="text-orange-500">QR</span></span>
          </div>
          <p className="text-gray-600 text-sm">© 2025 MenuQR — Plateforme SaaS de digitalisation des restaurants</p>
          <p className="text-gray-600 text-sm">🇧🇯 Fait au Bénin, pour l&apos;Afrique</p>
        </div>
      </footer>

    </main>
  )
}