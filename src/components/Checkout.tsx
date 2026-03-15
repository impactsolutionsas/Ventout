import React, { useState } from 'react';
import { useCartStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Truck, CreditCard, Wallet } from 'lucide-react';

export const Checkout = () => {
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    phone: '',
    paymentMethod: 'cod' as 'cod' | 'card'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Veuillez vous connecter pour commander.");
      return;
    }
    setLoading(true);

    try {
      const orderData = {
        user_id: user.id,
        user_name: `${formData.firstName} ${formData.lastName}`,
        user_email: user.email,
        items,
        total: total(),
        status: 'pending',
        payment_method: formData.paymentMethod,
        shipping_address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
        },
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Supabase Realtime notifie automatiquement l'admin via postgres_changes
      setOrderPlaced(true);
      clearCart();
    } catch (error: any) {
      console.error("Error placing order:", error);
      alert("Une erreur est survenue lors de la commande. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-4xl font-black mb-4 uppercase italic">Merci pour votre commande !</h2>
        <p className="text-slate-500 mb-10 text-lg">Votre commande a été enregistrée avec succès. Vous recevrez un appel de confirmation prochainement.</p>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          Suivre ma commande
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <h2 className="text-3xl font-black mb-8 uppercase tracking-tight italic">Informations de Livraison</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Prénom</label>
                <input 
                  required
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom</label>
                <input 
                  required
                  type="text" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Adresse Complète</label>
              <input 
                required
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ville</label>
                <input 
                  required
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Téléphone</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <h3 className="text-2xl font-black mt-12 mb-6 uppercase tracking-tight italic">Mode de Paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  className="hidden" 
                  checked={formData.paymentMethod === 'cod'}
                  onChange={() => setFormData({...formData, paymentMethod: 'cod'})}
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold uppercase text-sm">Paiement à la livraison</p>
                  <p className="text-xs text-slate-500">Payez en espèces à réception</p>
                </div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all opacity-50 cursor-not-allowed ${formData.paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-primary/20'}`}>
                <input 
                  disabled
                  type="radio" 
                  name="payment" 
                  className="hidden"
                  checked={formData.paymentMethod === 'card'}
                  onChange={() => setFormData({...formData, paymentMethod: 'card'})}
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.paymentMethod === 'card' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold uppercase text-sm">Carte Bancaire</p>
                  <p className="text-xs text-slate-500">Bientôt disponible</p>
                </div>
              </label>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl mt-10 hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Traitement...' : 'Confirmer la Commande'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-primary/20">
            <h3 className="text-xl font-black uppercase mb-6 italic">Votre Commande</h3>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-primary/10">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-500">Quantité: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()} CFA</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-primary/20 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Sous-total</span>
                <span className="font-bold">{total().toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Livraison</span>
                <span className="text-green-600 font-bold">Gratuite</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-primary/20">
                <span className="text-lg font-black uppercase italic">Total</span>
                <span className="text-2xl font-black text-primary">{total().toLocaleString()} CFA</span>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-slate-500">
              <Truck className="w-8 h-8 text-primary" />
              <p className="text-xs leading-relaxed">
                Livraison express en 24/48h. Notre équipe vous contactera pour confirmer l'heure de passage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
