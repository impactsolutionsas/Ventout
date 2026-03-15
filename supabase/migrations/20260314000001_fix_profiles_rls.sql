-- ============================================================
-- FIX: Infinite recursion in profiles RLS policies
--
-- The original "Admins can view all profiles" policy does
-- SELECT on profiles to check the role, which triggers the
-- same policy again → infinite loop.
--
-- Solution:
-- 1. profiles: simple "users see own row" + admins check via JWT
-- 2. Other tables: use auth.jwt() instead of sub-querying profiles
-- ============================================================

-- ==================
-- DROP OLD POLICIES
-- ==================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Settings
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;


-- ==================
-- HELPER FUNCTION
-- ==================
-- Check admin role from the profiles table using SECURITY DEFINER
-- to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ==================
-- PROFILES POLICIES
-- ==================
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles (uses function to avoid recursion)
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Users can insert their own profile (fallback if trigger didn't fire)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- ==================
-- CATEGORIES POLICIES
-- ==================
CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  USING (public.is_admin());


-- ==================
-- PRODUCTS POLICIES
-- ==================
CREATE POLICY "products_select_all"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (public.is_admin());


-- ==================
-- ORDERS POLICIES
-- ==================
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (public.is_admin());


-- ==================
-- SETTINGS POLICIES
-- ==================
CREATE POLICY "settings_select_all"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "settings_admin_all"
  ON settings FOR ALL
  USING (public.is_admin());
