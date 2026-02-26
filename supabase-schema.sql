-- Copiez-collez ce fichier dans Supabase > SQL Editor

CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT DEFAULT 'Cotonou',
  logo_url TEXT,
  whatsapp TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  description TEXT,
  prix DECIMAL(10,0) NOT NULL,
  image_url TEXT,
  disponible BOOLEAN DEFAULT true,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  adresse TEXT,
  nombre_commandes INT DEFAULT 0,
  total_depense DECIMAL(10,0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, telephone)
);

CREATE TABLE commandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  statut TEXT DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','en_cours','prete','livree','annulee')),
  type TEXT DEFAULT 'sur_place' CHECK (type IN ('sur_place','emporter','livraison')),
  montant_total DECIMAL(10,0) DEFAULT 0,
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commande_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commande_id UUID REFERENCES commandes(id) ON DELETE CASCADE,
  plat_id UUID REFERENCES plats(id) ON DELETE SET NULL,
  nom_plat TEXT NOT NULL,
  prix_unitaire DECIMAL(10,0) NOT NULL,
  quantite INT NOT NULL DEFAULT 1,
  sous_total DECIMAL(10,0) NOT NULL
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commande_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only" ON restaurants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_only" ON categories FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_only" ON plats FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_only" ON clients FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_only" ON commandes FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid()));
CREATE POLICY "owner_only" ON commande_items FOR ALL USING (commande_id IN (SELECT id FROM commandes WHERE restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())));

CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT USING (actif = true);
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_read_plats" ON plats FOR SELECT USING (disponible = true);
CREATE POLICY "public_insert_commandes" ON commandes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_items" ON commande_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_upsert_clients" ON clients FOR INSERT WITH CHECK (true);
