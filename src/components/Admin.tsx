import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Order, Product, Category, Slide, FrontendContent } from '../types';
import { PRODUCTS, CATEGORIES } from '../constants';
import { 
  Users, ShoppingBag, TrendingUp, Package, 
  CheckCircle, Clock, Truck, XCircle, 
  Plus, Edit, Trash2, Search, Settings, Bell,
  Upload, Image as ImageIcon, LayoutDashboard,
  ChevronRight, MoreVertical, Filter, Download, Loader2,
  Tag, Layers, Monitor, Play, Eye, EyeOff
} from 'lucide-react';
import { UserProfile, AppSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export const Admin = () => {
  const { isAdmin, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'users' | 'settings' | 'frontend'>('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    image: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [frontendContent, setFrontendContent] = useState<FrontendContent>({
    slides: [],
    featuredSections: []
  });
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [editingSection, setEditingSection] = useState<{id: string, title: string, subtitle: string, active: boolean} | null>(null);
  const [newSlide, setNewSlide] = useState<Partial<Slide>>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '/shop',
    buttonText: 'Découvrir',
    active: true
  });
  const [settings, setSettings] = useState<AppSettings>({
    siteName: 'VENTOUT',
    logo: 'https://ais-pre-rwo65hk33mxz32suosmmx3-137105490329.europe-west3.run.app/logo.png',
    currency: 'CFA',
    contactEmail: 'contact@ventout.fr'
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    oldPrice: undefined,
    category: 'cuisine',
    brand: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    stock: 10,
    featured: false,
    new: false,
    specs: {}
  });
  const [productSearch, setProductSearch] = useState('');

  const uploadToSupabase = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'category') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const bucket = target === 'product' ? 'products' : 'categories';
      const url = await uploadToSupabase(file, bucket);
      if (target === 'product') {
        setNewProduct(prev => ({ ...prev, image: url }));
      } else {
        setNewCategory(prev => ({ ...prev, image: url }));
      }
    } catch (error: any) {
      console.warn('Storage upload failed, using data URL fallback:', error.message);
      // Fallback: convert to data URL if bucket doesn't exist
      const dataUrl = await fileToDataUrl(file);
      if (target === 'product') {
        setNewProduct(prev => ({ ...prev, image: dataUrl }));
      } else {
        setNewCategory(prev => ({ ...prev, image: dataUrl }));
      }
    } finally {
      setUploading(false);
    }
  };


  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);

    try {
      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData.map(o => ({ ...o })));

      // Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*');
      if (productsData) setProducts(productsData);

      // Fetch Users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*');
      if (usersData) setAllUsers(usersData.map(u => ({ 
        id: u.id, 
        email: u.email, 
        role: u.role, 
        display_name: u.display_name,
        created_at: u.created_at
      })));

      // Fetch Categories
      const { data: catsData } = await supabase
        .from('categories')
        .select('*');
      if (catsData) setCategories(catsData.length > 0 ? catsData : CATEGORIES);

      // Fetch Settings — all rows at once to avoid multiple requests
      const { data: allSettings } = await supabase
        .from('settings')
        .select('id, content');
      if (allSettings) {
        const gen = allSettings.find(s => s.id === 'general');
        if (gen) setSettings(gen.content as AppSettings);
        const front = allSettings.find(s => s.id === 'frontend');
        if (front) setFrontendContent(front.content as FrontendContent);
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const channels = [
      supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT' && payload.new) {
          const newOrder = payload.new;
          setNotifications(prev => [newOrder, ...prev]);
          setShowToast(newOrder);
          setTimeout(() => setShowToast(null), 5000);
        }
      }).subscribe(),
      supabase.channel('admin-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe(),
      supabase.channel('admin-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData).subscribe(),
      supabase.channel('admin-categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData).subscribe(),
      supabase.channel('admin-settings').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error: any) {
      console.error("Update error:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
      alert("Produit supprimé !");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const seedDatabase = async () => {
    if (!window.confirm("Voulez-vous importer les produits et catégories par défaut dans la base de données ?")) return;
    setLoading(true);
    try {
      // Seed Categories
      for (const category of CATEGORIES) {
        await supabase.from('categories').upsert({
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          created_at: new Date().toISOString()
        });
      }

      // Seed Products
      for (const product of PRODUCTS) {
        await supabase.from('products').upsert({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          old_price: product.oldPrice || null,
          category: product.category,
          brand: product.brand,
          image: product.image,
          stock: product.stock,
          featured: product.featured ?? false,
          new: product.new ?? false,
          rating: product.rating,
          reviews_count: product.reviewsCount,
          specs: product.specs,
          created_at: new Date().toISOString()
        });
      }
      alert("Base de données initialisée !");
      fetchData();
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Erreur lors de l'initialisation");
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async () => {
    if (!user) return;
    
    setIsPromoting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) throw error;
      alert("Succès ! Vous avez été promu administrateur. La page va s'actualiser.");
      window.location.reload();
    } catch (error) {
      console.error("Promotion error:", error);
      alert("Erreur lors de la promotion.");
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
          <h2 className="text-3xl font-black uppercase italic mb-4">Erreur de Permissions</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Bien que vous soyez connecté, la base de données refuse l'accès aux données.
            Vérifiez que les politiques RLS de Supabase sont correctement configurées.
          </p>
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
    name: format(new Date(o.created_at), 'dd/MM'),
    total: o.total
  }));

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        old_price: newProduct.oldPrice || null,
        category: newProduct.category,
        brand: newProduct.brand,
        image: newProduct.image,
        stock: newProduct.stock,
        featured: newProduct.featured ?? false,
        new: newProduct.new ?? false,
        specs: newProduct.specs || {},
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        alert("Produit mis à jour !");
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...productData,
            created_at: new Date().toISOString(),
            rating: 0,
            reviews_count: 0
          }]);
        if (error) throw error;
        alert("Produit ajouté avec succès !");
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        price: 0,
        oldPrice: undefined,
        category: categories[0]?.id || 'cuisine',
        brand: '',
        description: '',
        image: '',
        stock: 10,
        featured: false,
        new: false,
        specs: {}
      });
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erreur lors de l'enregistrement du produit");
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        image: newCategory.image,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        alert("Catégorie mise à jour !");
      } else {
        const slug = (newCategory.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error } = await supabase
          .from('categories')
          .insert([{
            id: slug || `cat-${Date.now()}`,
            ...categoryData,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
        alert("Catégorie ajoutée !");
      }
      setIsAddingCategory(false);
      setEditingCategory(null);
      setNewCategory({ name: '', description: '', image: '' });
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erreur lors de l'enregistrement de la catégorie");
    }
  };

  const deleteCategory = async (id: string) => {
    const linkedProducts = products.filter(p => p.category === id);
    if (linkedProducts.length > 0) {
      alert(`Impossible de supprimer : ${linkedProducts.length} produit(s) utilisent cette catégorie. Réassignez-les d'abord.`);
      return;
    }
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert("Catégorie supprimée");
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Erreur lors de la suppression de la catégorie");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      alert(`Rôle mis à jour avec succès : ${newRole}`);
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToSupabase(file, 'products');
      setNewSlide(prev => ({ ...prev, image: url }));
    } catch (error: any) {
      console.warn('Storage upload failed, using data URL fallback:', error.message);
      const dataUrl = await fileToDataUrl(file);
      setNewSlide(prev => ({ ...prev, image: dataUrl }));
    } finally {
      setUploading(false);
    }
  };

  const saveFrontendContent = async (updatedContent: FrontendContent) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'frontend', content: updatedContent });
      if (error) throw error;
      alert("Contenu frontend mis à jour !");
      fetchData();
    } catch (error) {
      console.error("Error saving frontend content:", error);
      alert("Erreur lors de la sauvegarde du contenu frontend");
    }
  };

  const addOrUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const slideToSave = {
      ...newSlide,
      id: editingSlide?.id || Date.now().toString()
    } as Slide;

    let updatedSlides = [...frontendContent.slides];
    if (editingSlide) {
      updatedSlides = updatedSlides.map(s => s.id === editingSlide.id ? slideToSave : s);
    } else {
      updatedSlides.push(slideToSave);
    }

    await saveFrontendContent({ ...frontendContent, slides: updatedSlides });
    setIsAddingSlide(false);
    setEditingSlide(null);
  };

  const deleteSlide = async (slideId: string) => {
    if (!window.confirm("Supprimer ce slide ?")) return;
    const updatedSlides = frontendContent.slides.filter(s => s.id !== slideId);
    await saveFrontendContent({ ...frontendContent, slides: updatedSlides });
  };

  const toggleSlideStatus = async (slideId: string) => {
    const updatedSlides = frontendContent.slides.map(s => 
      s.id === slideId ? { ...s, active: !s.active } : s
    );
    await saveFrontendContent({ ...frontendContent, slides: updatedSlides });
  };

  const toggleSectionStatus = async (sectionId: string) => {
    const updatedSections = frontendContent.featuredSections.map(s => 
      s.id === sectionId ? { ...s, active: !s.active } : s
    );
    await saveFrontendContent({ ...frontendContent, featuredSections: updatedSections });
  };

  const updateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const updatedSections = frontendContent.featuredSections.map(s => 
      s.id === editingSection.id ? editingSection : s
    );
    await saveFrontendContent({ ...frontendContent, featuredSections: updatedSections });
    setEditingSection(null);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      category: product.category,
      brand: product.brand,
      description: product.description,
      image: product.image,
      stock: product.stock,
      featured: product.featured ?? false,
      new: product.new ?? false,
      specs: product.specs
    });
    setIsAddingProduct(true);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'general', content: settings });
      if (error) throw error;
      alert("Paramètres mis à jour !");
      fetchData();
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
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-primary/10 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-6 lg:mb-10 lg:px-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black italic">V</div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Admin Panel</h2>
            </div>
            
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-5 h-5" /> <span className="whitespace-nowrap">Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <ShoppingBag className="w-5 h-5" /> <span className="whitespace-nowrap">Commandes</span>
                {stats.pendingOrders > 0 && (
                  <span className="ml-2 lg:ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Package className="w-5 h-5" /> <span className="whitespace-nowrap">Produits</span>
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Tag className="w-5 h-5" /> <span className="whitespace-nowrap">Catégories</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Users className="w-5 h-5" /> <span className="whitespace-nowrap">Utilisateurs</span>
              </button>
              <button 
                onClick={() => setActiveTab('frontend')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'frontend' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Monitor className="w-5 h-5" /> <span className="whitespace-nowrap">Frontend</span>
              </button>
              <div className="lg:pt-4 lg:mt-4 lg:border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Settings className="w-5 h-5" /> <span className="whitespace-nowrap">Paramètres</span>
                </button>
              </div>
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
                <div className="w-full" style={{ minHeight: 300, height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Gestion des Commandes</h3>
                  <p className="text-sm text-slate-500">Suivez et gérez les commandes clients</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                    <Download className="w-4 h-4" /> Exporter
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-primary/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Rechercher une commande..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 ring-primary/20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 shadow-sm">Toutes</button>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-primary">En attente</button>
                      <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-primary">Livrées</button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-8 py-5">Client</th>
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Total</th>
                        <th className="px-8 py-5">Statut</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                      {orders.map(order => (
                        <tr key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary font-black text-xs">
                                {order.user_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1">{order.user_name}</p>
                                <p className="text-xs text-slate-400">{order.user_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                            {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                            <span className="block text-[10px] text-slate-400">{format(new Date(order.created_at), 'HH:mm')}</span>
                          </td>
                          <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                            {order.total.toLocaleString()} CFA
                          </td>
                          <td className="px-8 py-6">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-none outline-none cursor-pointer transition-all ${
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
                            <button className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Inventaire Produits</h3>
                  <p className="text-sm text-slate-500">Gérez votre catalogue et vos stocks</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      price: 0,
                      oldPrice: undefined,
                      category: categories[0]?.id || 'cuisine',
                      brand: '',
                      description: '',
                      image: '',
                      stock: 10,
                      featured: false,
                      new: false,
                      specs: {}
                    });
                    setIsAddingProduct(true);
                  }}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                >
                  <Plus className="w-5 h-5" /> Nouveau Produit
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-primary/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Rechercher un produit..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 ring-primary/20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors">
                      <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-8 py-5">Produit</th>
                        <th className="px-8 py-5">Catégorie</th>
                        <th className="px-8 py-5">Prix</th>
                        <th className="px-8 py-5">Stock</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="group hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-2xl p-2 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <img src={product.image} alt="" className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1">{product.name}</p>
                                <p className="text-xs text-slate-400 font-medium">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                            {product.price.toLocaleString()} CFA
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${product.stock < 5 ? 'bg-red-500' : product.stock < 15 ? 'bg-amber-500' : 'bg-green-500'}`} />
                              <span className={`text-xs font-bold ${product.stock < 5 ? 'text-red-600' : product.stock < 15 ? 'text-amber-600' : 'text-green-600'}`}>
                                {product.stock} unités
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => startEdit(product)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product Modal */}
              <AnimatePresence>
                {isAddingProduct && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAddingProduct(false)}
                      className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                      <div className="p-8 border-b border-slate-100 dark:border-primary/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-tight">
                            {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                          </h3>
                          <p className="text-sm text-slate-500">Remplissez les informations ci-dessous</p>
                        </div>
                        <button onClick={() => setIsAddingProduct(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                          <XCircle className="w-6 h-6 text-slate-400" />
                        </button>
                      </div>

                      <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          {/* Image Section */}
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Image du Produit</label>
                              <div className="relative group">
                                <div className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative">
                                  {newProduct.image ? (
                                    <>
                                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-contain p-8" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform">
                                          <Upload className="w-4 h-4" /> Changer l'image
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'product')} />
                                        </label>
                                      </div>
                                    </>
                                  ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-4 p-10 text-center">
                                      <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Cliquez pour télécharger</p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG ou WEBP (Max 5MB)</p>
                                      </div>
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'product')} />
                                    </label>
                                  )}
                                  {uploading && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Téléchargement...</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ou URL de l'image</label>
                              <div className="relative">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="url" 
                                  placeholder="https://images.unsplash.com/..."
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 ring-primary/20" 
                                  value={newProduct.image} 
                                  onChange={e => setNewProduct({...newProduct, image: e.target.value})} 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Info Section */}
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nom du Produit</label>
                                <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Marque</label>
                                <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Prix (CFA)</label>
                                <input required type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ancien Prix (CFA)</label>
                                <input type="number" min="0" placeholder="Laisser vide si pas de promo" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newProduct.oldPrice || ''} onChange={e => setNewProduct({...newProduct, oldPrice: e.target.value ? Number(e.target.value) : undefined})} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Stock Initial</label>
                                <input required type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Options</label>
                                <div className="flex items-center gap-4 py-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newProduct.featured ?? false} onChange={e => setNewProduct({...newProduct, featured: e.target.checked})} className="w-4 h-4 rounded accent-primary" />
                                    <span className="text-sm font-medium">En vedette</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={newProduct.new ?? false} onChange={e => setNewProduct({...newProduct, new: e.target.checked})} className="w-4 h-4 rounded accent-primary" />
                                    <span className="text-sm font-medium">Nouveau</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Catégorie</label>
                                <select required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 appearance-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
                              <textarea required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 h-32 resize-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 dark:border-primary/10 flex justify-end gap-4">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingProduct(false)} 
                            className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Annuler
                          </button>
                          <button 
                            type="submit" 
                            disabled={uploading}
                            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                          >
                            {editingProduct ? 'Mettre à jour' : 'Créer le Produit'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gestion des Catégories</h2>
                  <p className="text-slate-500 text-sm mt-1">Gérez les catégories de produits de votre boutique.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '', image: '' });
                    setIsAddingCategory(true);
                  }}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" /> Nouvelle Catégorie
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-primary/10 group">
                    <div className="relative aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6">
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <h3 className="text-white font-bold text-xl">{category.name}</h3>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-2 h-10">{category.description}</p>
                    <p className="text-xs font-bold text-slate-400 mb-4">{products.filter(p => p.category === category.id).length} produit(s)</p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setEditingCategory(category);
                          setNewCategory(category);
                          setIsAddingCategory(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold text-xs hover:bg-primary hover:text-white transition-all"
                      >
                        <Edit className="w-4 h-4" /> Modifier
                      </button>
                      <button 
                        onClick={() => deleteCategory(category.id)}
                        className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Gestion des Utilisateurs</h3>
                  <p className="text-sm text-slate-500">Gérez les comptes et les permissions</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-primary/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Rechercher un utilisateur..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 ring-primary/20" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-8 py-5">Utilisateur</th>
                        <th className="px-8 py-5">Rôle</th>
                        <th className="px-8 py-5">Date d'inscription</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                      {allUsers.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs">
                                {u.display_name?.charAt(0) || u.email.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1">{u.display_name || 'Sans nom'}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                            {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== 'admin' ? (
                                <button 
                                  onClick={() => updateUserRole(u.id, 'admin')}
                                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                >
                                  Promouvoir Admin
                                </button>
                              ) : (
                                <button 
                                  onClick={() => updateUserRole(u.id, 'user')}
                                  className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:underline"
                                >
                                  Rétrograder User
                                </button>
                              )}
                              <button 
                                onClick={() => deleteUser(u.id)}
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frontend' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gestion du Frontend</h2>
                  <p className="text-slate-500 text-sm mt-1">Gérez les slides, bannières et sections de la page d'accueil.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingSlide(null);
                    setNewSlide({
                      title: '',
                      subtitle: '',
                      description: '',
                      image: '',
                      link: '/shop',
                      buttonText: 'Découvrir',
                      active: true
                    });
                    setIsAddingSlide(true);
                  }}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" /> Nouveau Slide
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase italic">Slides du Hero</h3>
                  <div className="space-y-4">
                    {frontendContent.slides.map((slide) => (
                      <div key={slide.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-primary/10 flex gap-6">
                        <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                          <img src={slide.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{slide.title}</h4>
                            {!slide.active && <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded">Inactif</span>}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mb-3">{slide.description}</p>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                setEditingSlide(slide);
                                setNewSlide(slide);
                                setIsAddingSlide(true);
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                              Modifier
                            </button>
                            <button 
                              onClick={() => toggleSlideStatus(slide.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                              {slide.active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button 
                              onClick={() => deleteSlide(slide.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {frontendContent.slides.length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-primary/10 rounded-3xl">
                        <Play className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Aucun slide configuré</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase italic">Sections en Vedette</h3>
                  <div className="space-y-4">
                    {frontendContent.featuredSections.map((section) => (
                      <div key={section.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-primary/10 flex items-center justify-between group">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{section.title}</h4>
                          <p className="text-xs text-slate-400">{section.subtitle}</p>
                          <button 
                            onClick={() => setEditingSection(section)}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Modifier le texte
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleSectionStatus(section.id)}
                            className={`p-3 rounded-xl transition-all ${section.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {section.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {frontendContent.featuredSections.length === 0 && (
                      <button 
                        onClick={() => saveFrontendContent({
                          ...frontendContent,
                          featuredSections: [
                            { id: 'latest', title: 'Derniers Arrivages', subtitle: 'Découvrez nos nouveautés', active: true },
                            { id: 'featured', title: 'Sélection du Moment', subtitle: 'Les produits que vous allez adorer', active: true },
                            { id: 'top', title: 'Les Mieux Notés', subtitle: 'La qualité plébiscitée par nos clients', active: true }
                          ]
                        })}
                        className="w-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-primary/10 rounded-3xl hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Initialiser les sections</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isAddingSlide && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                      <form onSubmit={addOrUpdateSlide} className="p-8 md:p-12">
                        <div className="flex items-center justify-between mb-10">
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                            {editingSlide ? 'Modifier le Slide' : 'Nouveau Slide'}
                          </h3>
                          <button type="button" onClick={() => setIsAddingSlide(false)} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <XCircle className="w-6 h-6 text-slate-400" />
                          </button>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Titre</label>
                              <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Sous-titre</label>
                              <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newSlide.subtitle} onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
                            <textarea required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 h-24 resize-none" value={newSlide.description} onChange={e => setNewSlide({...newSlide, description: e.target.value})}></textarea>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Lien (URL)</label>
                              <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newSlide.link} onChange={e => setNewSlide({...newSlide, link: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Texte du Bouton</label>
                              <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newSlide.buttonText} onChange={e => setNewSlide({...newSlide, buttonText: e.target.value})} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Image du Slide</label>
                            {newSlide.image && (
                              <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                                <img src={newSlide.image} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={newSlide.image} onChange={e => setNewSlide({...newSlide, image: e.target.value})} placeholder="URL de l'image" />
                              </div>
                              <label className={`cursor-pointer bg-slate-100 dark:bg-slate-800 px-6 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? <Loader2 className="w-5 h-5 text-slate-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-500" />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleSlideImageUpload} disabled={uploading} />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 mt-8 border-t border-slate-100 dark:border-primary/10 flex justify-end gap-4">
                          <button type="button" onClick={() => setIsAddingSlide(false)} className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                          <button type="submit" disabled={uploading} className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                            {editingSlide ? 'Mettre à jour' : 'Créer le Slide'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {editingSection && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                      <form onSubmit={updateSection} className="p-8 md:p-12">
                        <div className="flex items-center justify-between mb-10">
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Modifier la Section</h3>
                          <button type="button" onClick={() => setEditingSection(null)} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <XCircle className="w-6 h-6 text-slate-400" />
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Titre</label>
                            <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={editingSection.title} onChange={e => setEditingSection({...editingSection, title: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Sous-titre</label>
                            <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20" value={editingSection.subtitle} onChange={e => setEditingSection({...editingSection, subtitle: e.target.value})} />
                          </div>
                        </div>

                        <div className="pt-8 mt-8 border-t border-slate-100 dark:border-primary/10 flex justify-end gap-4">
                          <button type="button" onClick={() => setEditingSection(null)} className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                          <button type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                            Enregistrer
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Paramètres</h3>
                <p className="text-sm text-slate-500">Configurez les options de votre boutique</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-primary/10">
                      <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" /> Informations Générales
                      </h4>
                    </div>
                    <form onSubmit={handleUpdateSettings} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom de la Boutique</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email de Contact</label>
                          <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20" value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Devise</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}>
                            <option value="CFA">Franc CFA (CFA)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">Dollar ($)</option>
                          </select>
                        </div>
                      </div>
                      <div className="pt-4">
                        <button type="submit" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                          Enregistrer les Modifications
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-primary/10">
                      <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-amber-500">
                        <Bell className="w-4 h-4" /> Maintenance
                      </h4>
                    </div>
                    <div className="p-8 space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Utilisez ces outils pour réinitialiser ou peupler votre base de données avec des données de démonstration.
                      </p>
                      <button 
                        type="button"
                        onClick={seedDatabase}
                        className="w-full bg-amber-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                      >
                        Importer les données démo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Category Modal — global level */}
      <AnimatePresence>
        {isAddingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCategory(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-primary/10 flex items-center justify-between bg-slate-50/50 dark:bg-primary/5">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Détails de la catégorie</p>
                </div>
                <button onClick={() => setIsAddingCategory(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Image de la Catégorie</label>
                    <div className="relative group">
                      <div className="aspect-video rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative">
                        {newCategory.image ? (
                          <>
                            <img src={newCategory.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Changer
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'category')} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-4 p-10 text-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white">Télécharger une image</p>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'category')} />
                          </label>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nom de la Catégorie</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20"
                      value={newCategory.name}
                      onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
                    <textarea
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 h-32 resize-none"
                      value={newCategory.description}
                      onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-primary/10 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {editingCategory ? 'Mettre à jour' : 'Créer la Catégorie'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
