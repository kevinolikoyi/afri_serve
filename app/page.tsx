import Link from 'next/link'
import { QrCode, MessageCircle, BarChart2, Users, Smartphone, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <QrCode className="text-orange-500" size={24} />
          <span className="text-xl font-bold">Menu<span className="text-orange-500">QR</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Connexion</Link>
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Démarrer gratuitement</Link>
        </div>
      </nav>
      <section className="pt-40 pb-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
          🇧🇯 Fait pour l'Afrique francophone
        </div>
        <h1 className="text-5xl font-black mb-6 leading-tight">
          Votre restaurant,<br /><span className="text-orange-500">100% digital</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-xl mx-auto mb-10">
          Menu en ligne, QR code, commandes WhatsApp et statistiques — tout ce qu'il faut pour moderniser votre restaurant.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-orange-500/25">
            🚀 Commencer gratuitement
          </Link>
          <Link href="/login" className="border border-gray-700 hover:border-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors">
            Se connecter
          </Link>
        </div>
      </section>
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Création en 5 min', desc: 'Votre espace restaurant en ligne immédiatement, sans compétence technique.' },
            { icon: MessageCircle, title: 'Commandes WhatsApp', desc: 'Les commandes arrivent directement sur votre WhatsApp, comme vous en avez l\'habitude.' },
            { icon: QrCode, title: 'QR Code automatique', desc: 'Un QR code unique généré pour vos tables. Vos clients scannent et commandent.' },
            { icon: Smartphone, title: 'Menu mobile', desc: 'Vos clients consultent votre menu depuis leur téléphone, sans application à installer.' },
            { icon: Users, title: 'Base clients auto', desc: 'Chaque commande crée automatiquement une fiche client dans votre tableau de bord.' },
            { icon: BarChart2, title: 'Statistiques', desc: 'Suivez vos ventes et identifiez vos plats les plus populaires.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/30 transition-colors">
              <Icon className="text-orange-500 mb-4" size={28} />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-black mb-4">Prêt à digitaliser votre restaurant ?</h2>
        <p className="text-gray-400 mb-8">Rejoignez les restaurants béninois qui modernisent leur activité.</p>
        <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-colors inline-block">
          Créer mon restaurant gratuitement →
        </Link>
      </section>
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-600 text-sm">
        © 2025 MenuQR — 🇧🇯 Fait au Bénin, pour l'Afrique
      </footer>
    </main>
  )
}
