export type Restaurant = {
  id: string
  user_id: string
  nom: string
  slug: string
  description?: string
  telephone?: string
  adresse?: string
  ville: string
  logo_url?: string
  whatsapp: string
  actif: boolean
  created_at: string
}

export type Categorie = {
  id: string
  restaurant_id: string
  nom: string
  ordre: number
}

export type Plat = {
  id: string
  restaurant_id: string
  categorie_id?: string
  nom: string
  description?: string
  prix: number
  image_url?: string
  disponible: boolean
  ordre: number
}

export type CommandeStatut = 'nouvelle' | 'en_cours' | 'prete' | 'livree' | 'annulee'
export type CommandeType = 'sur_place' | 'emporter' | 'livraison'

export type Commande = {
  id: string
  restaurant_id: string
  client_id?: string
  numero: string
  statut: CommandeStatut
  type: CommandeType
  montant_total: number
  commentaire?: string
  created_at: string
  commande_items?: CommandeItem[]
  clients?: Client
}

export type CommandeItem = {
  id: string
  commande_id: string
  plat_id?: string
  nom_plat: string
  prix_unitaire: number
  quantite: number
  sous_total: number
}

export type Client = {
  id: string
  restaurant_id: string
  nom: string
  telephone: string
  adresse?: string
  nombre_commandes: number
  total_depense: number
  created_at: string
}

export type PanierItem = {
  plat: Plat
  quantite: number
}
