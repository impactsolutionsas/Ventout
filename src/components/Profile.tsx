import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Order } from '../types';
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Profile = () => {
  const { user, profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const ordersData = data.map(order => ({ 
          ...order, 
          createdAt: new Date(order.created_at).getTime() 
        } as Order));
        setOrders(ordersData);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En préparation';
      case 'shipped': return 'Expédiée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (!user || !profile) return null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-primary/20 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary mx-auto mb-6">
              <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random`} alt={profile.display_name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-black uppercase italic">{profile.display_name}</h2>
            <p className="text-slate-500 text-sm mb-8">{profile.email}</p>
            <button 
              onClick={logout}
              className="w-full py-3 border-2 border-slate-200 dark:border-primary/20 rounded-xl font-bold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all uppercase tracking-widest"
            >
              Déconnexion
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <h3 className="text-3xl font-black mb-8 uppercase tracking-tight italic">Mes Commandes</h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-primary/20">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Vous n'avez pas encore passé de commande.</p>
              <Link to="/shop" className="text-primary font-bold mt-4 inline-block hover:underline">Commencer mes achats</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-primary/20 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="p-2 md:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-primary/20">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Commande #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="font-bold text-xs md:text-sm">{format(order.createdAt, 'dd MMMM yyyy', { locale: fr })}</p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col justify-between w-full sm:w-auto sm:text-right gap-2">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Statut</p>
                        <p className="font-black text-primary uppercase text-xs md:text-sm">{getStatusLabel(order.status)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</p>
                        <p className="font-black text-sm md:text-lg">{order.total.toLocaleString()} CFA</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-primary/10 pr-4">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain" />
                          <div className="text-xs">
                            <p className="font-bold line-clamp-1 max-w-[150px]">{item.name}</p>
                            <p className="text-slate-500">x{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
