-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  category TEXT REFERENCES categories(id),
  brand TEXT,
  image TEXT,
  stock INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  new BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_email TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cod', 'card')),
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read, Admin write
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Public read, Admin write
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles: User read/write own, Admin read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: User read/write own, Admin read all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Settings: Public read, Admin write
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Initial Data

INSERT INTO categories (id, name, description, image) VALUES
('gros-electro', 'Gros Électroménager', 'Réfrigérateurs, Lave-linges, Fours', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrs1-xgEl4a7XKCC9E1iciRUPKi3O5kXSRu0rIgwXPh-zdYFPph1xUTMYjq3bSgIUPP64V0AclgylXv60AUb8cmUvWzY1hdzSmgOF7Jj5SC5aixMC4qC9833DSQVFII9sInGk3pglpqhqRuZA6nkJ4C6UqvrFMMd5CKwDmi6KQPTpyuy5s6-N3xCV_OjB73MFAqstadMQfJtM2CDCiViWiBD56Pu2K2rs261WQkIrn6kBUt36ulTv70QdgF6z0JdGr6OknXUf3M1I'),
('petit-electro', 'Petit Électroménager', 'Cafetières, Robots, Aspirateurs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsXu2bjf9c7P61nT_tvyF3E_-ISnJvaSI8lGmbk9bYawvCn6RZu1kwRX32aWjaTiR1Aia03atzs2mcyY3CZtnATXgYiVJrjS0jQW8MhyBR8OPkDoQOi3978RHDjuUXX0bmx410nyysTLahlWDRhWU230MXlfAXbHC8NeMXk9pEuU8EsR9NjhCdxQDOkZnx-3Cn7007To3GxQt_4hb9fDN377K6PJRolx51YbulS_GxA6botgX422EnRX7WUC7cUiQGivOfdrK3hLM'),
('electronics', 'Électronique', 'Smartphones, Laptops, Tablettes', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400'),
('cuisine', 'Cuisine', 'Micro-ondes, Mixeurs, Cuisson', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx8_lXvoDc6SissUSTliWuwrKcxyh5jSlElDg7jeDgeZXjUhjjUGbylwowK3odBQG8bmLKiVEyD6n2mBOsns1QPZ8Z29octH8Y2Yfj-7bIvS9LKwZkkBjEMLGhHF0qBMI1OKinTfhkN_0-KnbCw1Zu05FdbsVZ6KjFEjgNLmR5uwfKvzMnuNhJfsIy-DdAF1oN_urDuQlDMkIFvxX7ByR4MvYEAA0FIFrRtpAsPcrjFHajtsUElhiX-6bCmlPBvSNUcOv0wCv1_jw'),
('personal-care', 'Soin Personnel', 'Sèche-cheveux, Rasoirs, Bien-être', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, price, old_price, category, brand, image, stock, featured, new, rating, reviews_count, specs) VALUES
('1', 'Réfrigérateur Américain Samsung RS68', '634L, Technologie SpaceMax™, Froid ventilé intégral, Distributeur d''eau, glaçons et glace pilée sans raccordement d''eau.', 980000, 1180000, 'gros-electro', 'Samsung', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', 12, true, true, 4.5, 128, $$ {"Volume Total": "634 Litres", "Classe Énergétique": "F", "Dimensions": "91.2 x 178 x 71.6 cm", "Niveau Sonore": "36 dB"} $$),
('2', 'Robot Pâtissier KitchenAid Artisan 4.8L', 'Le robot pâtissier emblématique pour toutes vos créations culinaires.', 360000, NULL, 'petit-electro', 'KitchenAid', 'https://images.unsplash.com/photo-1591333139245-2b411c9d7b7c?auto=format&fit=crop&q=80&w=800', 25, true, true, 5, 84, $$ {"Capacité": "4.8 Litres", "Puissance": "300W", "Matériau": "Métal coulé"} $$),
('5', 'iPhone 15 Pro Max 256GB', 'Le summum de la technologie Apple avec puce A17 Pro.', 850000, NULL, 'electronics', 'Apple', 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=400', 15, true, true, 4.9, 450, $$ {"Écran": "6.7\" Super Retina XDR", "Puce": "A17 Pro", "Caméra": "48MP Main"} $$),
('6', 'MacBook Air M3 13"', 'Fin, léger et incroyablement puissant.', 785000, NULL, 'electronics', 'Apple', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400', 10, true, true, 4.8, 120, $$ {"Puce": "M3", "RAM": "8GB", "Stockage": "256GB SSD"} $$),
('3', 'Machine Espresso Breville Barista Express', 'Café de qualité professionnelle à la maison.', 445000, 555000, 'petit-electro', 'Breville', 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=800', 8, true, false, 4.8, 210, $$ {"Pression": "15 bars", "Broyeur": "Intégré", "Réservoir": "2 Litres"} $$),
('4', 'Micro-ondes LG NeoChef 25L', 'Technologie Smart Inverter pour une cuisson uniforme.', 125000, NULL, 'cuisine', 'LG', 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?auto=format&fit=crop&q=80&w=800', 45, false, false, 4.2, 56, $$ {"Capacité": "25 Litres", "Puissance": "1000W", "Type": "Solo"} $$),
('7', 'Sèche-cheveux Dyson Supersonic', 'Séchage rapide sans chaleur extrême.', 295000, NULL, 'personal-care', 'Dyson', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400', 20, true, false, 4.9, 320, $$ {"Moteur": "V9", "Réglages": "3 vitesses, 4 chaleurs"} $$)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, content) VALUES
('frontend', $$ {
  "slides": [
    {
      "id": "1",
      "title": "Le futur de la cuisine",
      "subtitle": "Nouveautés Samsung",
      "description": "Découvrez la nouvelle gamme de réfrigérateurs intelligents.",
      "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1920",
      "link": "/shop?cat=gros-electro",
      "buttonText": "Découvrir",
      "active": true
    }
  ],
  "featuredSections": [
    {"id": "top", "title": "Top Produits", "subtitle": "Les plus populaires", "active": true},
    {"id": "featured", "title": "Sélection du moment", "subtitle": "Nos coups de coeur", "active": true},
    {"id": "latest", "title": "Nouveautés", "subtitle": "Derniers arrivages", "active": true}
  ]
} $$)
ON CONFLICT (id) DO NOTHING;
