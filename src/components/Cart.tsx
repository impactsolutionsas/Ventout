import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export const Cart = () => {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-3xl font-black mb-4">Votre panier est vide</h2>
        <p className="text-slate-500 mb-8">Il semble que vous n'ayez pas encore ajouté de produits à votre panier.</p>
        <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all inline-flex items-center gap-2">
          Continuer mes achats
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-10 uppercase tracking-tight">Votre Panier</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-primary/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Produit</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Prix</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Quantité</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Sous-total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-primary/10">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-slate-500 uppercase font-semibold">{item.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold">{item.price.toLocaleString()} CFA</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center border border-slate-200 dark:border-primary/20 rounded-full p-1 bg-slate-50 dark:bg-slate-800">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="font-black">{(item.price * item.quantity).toLocaleString()} CFA</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-primary transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 rounded-2xl p-4 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <div className="h-24 w-24 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-primary/10">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{item.name}</h3>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">{item.brand}</p>
                    <p className="font-bold text-primary mt-2">{item.price.toLocaleString()} CFA</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-primary/5">
                  <div className="flex items-center border border-slate-200 dark:border-primary/20 rounded-full p-1 bg-slate-50 dark:bg-slate-800">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Sous-total</p>
                    <p className="font-black text-sm">{(item.price * item.quantity).toLocaleString()} CFA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-primary rounded-xl p-8 sticky top-28">
            <h3 className="text-xl font-black uppercase tracking-tight mb-6 border-b border-slate-200 dark:border-primary/10 pb-4">Résumé</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Sous-total</span>
                <span className="font-bold">{total().toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Livraison</span>
                <span className="text-green-600 font-bold text-sm">Gratuite</span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-primary/10 flex justify-between items-center">
                <span className="text-lg font-black uppercase">Total</span>
                <span className="text-2xl font-black text-primary">{total().toLocaleString()} CFA</span>
              </div>
            </div>
            <Link 
              to="/checkout"
              className="w-full py-5 bg-primary hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2"
            >
              Commander
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="mt-8 p-4 bg-slate-50 dark:bg-primary/5 rounded-lg">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-widest mb-1">Paiement Sécurisé</p>
                  <p className="text-slate-500">Nous assurons la sécurité de vos transactions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
