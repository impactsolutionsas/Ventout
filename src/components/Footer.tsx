import React from 'react';
import { Link } from 'react-router-dom';
import { Diamond, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Diamond className="w-8 h-8" />
            <h2 className="text-white text-xl font-black leading-tight tracking-tighter uppercase">VENTOUT</h2>
          </div>
          <p className="text-sm leading-relaxed">
            Le spécialiste de l'électroménager haut de gamme. Qualité, design et technologie au service de votre maison.
          </p>
          <div className="flex gap-4">
            <Facebook className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
            <Instagram className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
            <Twitter className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 border-b border-primary w-fit pb-1 text-white">Navigation</h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li><Link to="/shop" className="hover:text-white transition-colors">Tous les produits</Link></li>
            <li><Link to="/shop?new=true" className="hover:text-white transition-colors">Nouveautés</Link></li>
            <li><Link to="/shop?promo=true" className="hover:text-white transition-colors">Promotions</Link></li>
            <li><Link to="/profile" className="hover:text-white transition-colors">Mon Compte</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 border-b border-primary w-fit pb-1 text-white">Support</h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Contactez-nous</a></li>
            <li><a href="#" className="hover:text-white transition-colors">SAV & Réparation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Livraison & Retours</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 border-b border-primary w-fit pb-1 text-white">Newsletter</h4>
          <p className="text-xs mb-4">Inscrivez-vous pour recevoir nos offres exclusives.</p>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Votre email" 
              className="bg-slate-900 border-none rounded-l-lg text-sm w-full focus:ring-1 focus:ring-primary px-4 py-2"
            />
            <button className="bg-primary text-white px-4 py-2 rounded-r-lg font-bold text-xs uppercase hover:bg-primary/90 transition-colors">OK</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 text-center text-xs">
        <p>© 2024 VENTOUT E-Commerce. Tous droits réservés.</p>
      </div>
    </footer>
  );
};
