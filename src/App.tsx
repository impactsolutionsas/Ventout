import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { Shop } from './components/Shop';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Profile } from './components/Profile';
import { Admin } from './components/Admin';

export default function App() {
  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary selection:text-white">
          {!isFirebaseConfigured && (
            <div className="bg-amber-500 text-white text-center py-2 text-xs font-bold uppercase tracking-widest">
              Configuration Firebase requise : Veuillez ajouter vos clés API dans les paramètres.
            </div>
          )}
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
