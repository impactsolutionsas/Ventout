import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy, limit, addDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Order, Product } from '../types';
import { PRODUCTS } from '../constants';
import { 
  Users, ShoppingBag, TrendingUp, Package, 
  CheckCircle, Clock, Truck, XCircle, 
  Plus, Edit, Trash2, Search, Settings, Bell
} from 'lucide-react';
import socket from '../socket';
import { UserProfile, AppSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export const Admin = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users' | 'settings'>('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    siteName: 'VENTOUT',
    logo: 'https://ais-pre-rwo65hk33mxz32suosmmx3-137105490329.europe-west3.run.app/logo.png',
    currency: 'CFA',
    contactEmail: 'contact@ventout.fr'
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'cuisine',
    brand: '',
    description: '',
    image: 'https://picsum.photos/seed/appliance/400/400',
    stock: 10,
    specs: {}
  });

  useEffect(() => {
    if (!isAdmin) return;

    socket.on('order_notification', (order) => {
      setNotifications(prev => [order, ...prev]);
      // Refresh orders list
      setOrders(prev => {
        // Avoid duplicates if the order is already there
        if (prev.find(o => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      // Show discreet toast
      setShowToast(order);
      setTimeout(() => setShowToast(null), 5000);
    });

    return () => {
      socket.off('order_notification');
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(ordersData);

        const productsSnap = await getDocs(collection(db, 'products'));
        const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProducts(productsData.length > 0 ? productsData : PRODUCTS);

        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        setAllUsers(usersData);

        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
        if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
          setPermissionError(true);
        } else if (error.message.includes("offline")) {
          alert("Impossible de charger les données car vous semblez être hors ligne.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.code === 'permission-denied') {
        alert("Action refusée : Vous n'avez pas les permissions pour modifier cette commande. Vérifiez vos règles Firestore ou assurez-vous d'être bien administrateur.");
      } else {
        alert("Erreur lors de la mise à jour du statut");
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      alert("Produit supprimé !");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const promoteToAdmin = async () => {
    const { auth } = await import('../firebase');
    if (!auth.currentUser) return;
    
    setIsPromoting(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        role: 'admin',
        email: auth.currentUser.email,
        updatedAt: Date.now()
      }, { merge: true });
      alert("Succès ! Vous avez été promu administrateur. La page va s'actualiser.");
      window.location.reload();
    } catch (error) {
      console.error("Promotion error:", error);
      alert("Erreur lors de la promotion. Vérifiez que vos règles Firestore autorisent l'écriture sur votre propre document utilisateur.");
    } finally {
      setIsPromoting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-red-600">Accès Refusé</h2>
        <p className="text-slate-500 mt-2">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        <div className="mt-10 p-6 bg-slate-50 rounded-2xl max-w-md mx-auto border border-slate-200">
          <p className="text-sm text-slate-600 mb-4">Si vous êtes le développeur, vous pouvez vous promouvoir administrateur pour tester :</p>
          <button 
            onClick={promoteToAdmin}
            disabled={isPromoting}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {isPromoting ? 'Promotion en cours...' : 'Me promouvoir Administrateur'}
          </button>
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-3xl font-black uppercase italic mb-4">Erreur de Permissions Firestore</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Bien que vous soyez connecté, votre base de données Firestore refuse l'accès aux données. 
            Cela est généralement dû à des règles de sécurité trop restrictives.
          </p>
          <div className="bg-white p-6 rounded-2xl text-left border border-red-100 mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Action Requise :</p>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
              <li>Ouvrez votre <strong>Console Firebase</strong>.</li>
              <li>Allez dans <strong>Firestore Database</strong> &gt; <strong>Rules</strong>.</li>
              <li>Copiez le contenu du fichier <code>firestore.rules</code> (à la racine de ce projet).</li>
              <li>Collez-le dans la console et cliquez sur <strong>Publish</strong>.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Actualiser la page
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalRevenue: orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.total : acc, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    bestSellers: [] // Would calculate from orders
  };

  const chartData = orders.slice(0, 7).reverse().map(o => ({
    name: format(o.createdAt, 'dd/MM'),
    total: o.total
  }));

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: Date.now(),
        rating: 5,
        reviewsCount: 0
      });
      setProducts([{ id: productRef.id, ...newProduct } as Product, ...products]);
      alert("Produit ajouté avec succès !");
      setIsAddingProduct(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Erreur lors de l'ajout du produit");
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert("Paramètres mis à jour !");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Erreur lors de la mise à jour des paramètres");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 20 }}
            className="fixed top-24 right-6 z-[60] bg-slate-900 text-white p-6 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 max-w-sm"
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Nouvelle Commande !</p>
              <p className="font-bold text-sm">{showToast.userName}</p>
              <p className="text-xs text-slate-400">{showToast.total.toLocaleString()} CFA • {showToast.items.length} articles</p>
            </div>
            <button onClick={() => setShowToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-lg">
              <XCircle className="w-5 h-5 text-slate-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-950 rounded-3xl p-6 text-white sticky top-24">
            <h2 className="text-xl font-black uppercase italic mb-8 px-4 tracking-tighter">Admin Panel</h2>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <TrendingUp className="w-5 h-5" /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <ShoppingBag className="w-5 h-5" /> Commandes
                {stats.pendingOrders > 0 && (
                  <span className="ml-auto bg-white text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Package className="w-5 h-5" /> Produits
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Users className="w-5 h-5" /> Utilisateurs
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Settings className="w-5 h-5" /> Paramètres
              </button>
            </nav>
          </div>
          
          {notifications.length > 0 && (
            <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-4">
                <Bell className="w-4 h-4" /> Notifications
              </h3>
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="text-xs p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800">
                    <p className="font-bold">Nouvelle commande !</p>
                    <p className="text-slate-500">{n.userName} - {n.total} CFA</p>
                  </div>
                ))}
                <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-amber-800 dark:text-amber-400 hover:underline">Tout effacer</button>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 space-y-10">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-primary/20 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Chiffre d'Affaires</p>
                  <h4 className="text-3xl font-black italic">{stats.totalRevenue.toLocaleString()} CFA</h4>
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
                    <TrendingUp className="w-4 h-4" /> +12.5% ce mois
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-primary/20 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Commandes Totales</p>
                  <h4 className="text-3xl font-black italic">{stats.totalOrders}</h4>
                  <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold">
                    <ShoppingBag className="w-4 h-4" /> {stats.pendingOrders} en attente
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-primary/20 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nouveaux Clients</p>
                  <h4 className="text-3xl font-black italic">48</h4>
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-bold">
                    <Users className="w-4 h-4" /> +8 aujourd'hui
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-primary/20 shadow-sm">
                <h3 className="text-xl font-black uppercase italic mb-8">Ventes Récentes</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic">Gestion des Commandes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Rechercher..." className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none w-64" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-8 py-4">Client</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Total</th>
                      <th className="px-8 py-4">Statut</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-bold text-sm">{order.userName}</p>
                          <p className="text-xs text-slate-500">{order.userEmail}</p>
                        </td>
                        <td className="px-8 py-6 text-sm">
                          {format(order.createdAt, 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-8 py-6 font-black">
                          {order.total.toLocaleString()} CFA
                        </td>
                        <td className="px-8 py-6">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-none outline-none cursor-pointer ${
                              order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                              'bg-red-100 text-red-600'
                            }`}
                          >
                            <option value="pending">En attente</option>
                            <option value="processing">Préparation</option>
                            <option value="shipped">Expédiée</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic">Inventaire Produits</h3>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" /> Ajouter un Produit
                </button>
              </div>
              
              {isAddingProduct ? (
                <form onSubmit={handleAddProduct} className="p-8 space-y-6 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom du Produit</label>
                      <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Marque</label>
                      <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Prix (€)</label>
                      <input required type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Stock</label>
                      <input required type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Catégorie</label>
                      <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                        <option value="cuisine">Cuisine</option>
                        <option value="buanderie">Buanderie</option>
                        <option value="froid">Froid</option>
                        <option value="petit-electromenager">Petit Électroménager</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">URL de l'Image</label>
                      <input required type="url" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                    <textarea required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none h-24" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Spécifications (JSON)</label>
                    <textarea placeholder='{"Couleur": "Blanc", "Garantie": "2 ans"}' className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none h-24 font-mono" onChange={e => {
                      try {
                        const specs = JSON.parse(e.target.value);
                        setNewProduct({...newProduct, specs});
                      } catch (err) {
                        // Invalid JSON, don't update yet
                      }
                    }}></textarea>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest">Enregistrer</button>
                    <button type="button" onClick={() => setIsAddingProduct(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest">Annuler</button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-8 py-4">Produit</th>
                        <th className="px-8 py-4">Catégorie</th>
                        <th className="px-8 py-4">Prix</th>
                        <th className="px-8 py-4">Stock</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <img src={product.image} alt="" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                              <div>
                                <p className="font-bold text-sm">{product.name}</p>
                                <p className="text-xs text-slate-500">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm uppercase tracking-widest font-bold text-slate-400">{product.category}</td>
                          <td className="px-8 py-6 font-black">{product.price.toLocaleString()} CFA</td>
                          <td className="px-8 py-6">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {product.stock} en stock
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right space-x-2">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Edit className="w-4 h-4 text-slate-400" /></button>
                            <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic">Gestion des Utilisateurs</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Rechercher..." className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none w-64" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-8 py-4">Utilisateur</th>
                      <th className="px-8 py-4">Rôle</th>
                      <th className="px-8 py-4">Date d'inscription</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {u.displayName?.charAt(0) || u.email.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-sm">{u.displayName || 'Utilisateur'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500">
                          {format(u.createdAt, 'dd/MM/yyyy')}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 dark:border-primary/10">
                <h3 className="text-xl font-black uppercase italic">Paramètres Généraux</h3>
              </div>
              <form onSubmit={handleUpdateSettings} className="p-8 space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom de la Boutique</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email de Contact</label>
                  <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Devise</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                </div>
                <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest">Enregistrer les Paramètres</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
