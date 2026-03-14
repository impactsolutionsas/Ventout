import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS } from '../constants';
import { useCartStore } from '../store';
import { Star, ShieldCheck, Truck, RotateCcw, ChevronRight, ShoppingCart, Diamond, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          // Fallback to constants if not found in Firestore
          const fallbackProduct = PRODUCTS.find(p => p.id === id);
          setProduct(fallbackProduct || null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        const fallbackProduct = PRODUCTS.find(p => p.id === id);
        setProduct(fallbackProduct || null);
        try {
          handleFirestoreError(error, OperationType.GET, `products/${id}`);
        } catch (e) {
          // Error is re-thrown as JSON string by handleFirestoreError
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Chargement du produit...</p>
      </div>
    );
  }

  if (!product) return <div className="p-20 text-center">Produit non trouvé</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-10">
        <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-primary transition-colors">Catalogue</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-white dark:bg-slate-900 rounded-[40px] p-12 flex items-center justify-center border border-slate-100 dark:border-primary/10 shadow-sm"
          >
            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
          </motion.div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-primary/10 cursor-pointer hover:border-primary transition-colors">
                <img src={product.image} alt="" className="w-full h-full object-contain opacity-50" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{product.brand}</span>
            {product.new && <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Nouveau</span>}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tighter mb-6">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-sm text-slate-500 font-medium">({product.reviewsCount} avis clients)</span>
          </div>

          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-5xl font-black text-primary italic">{product.price.toLocaleString()} CFA</span>
            {product.oldPrice && (
              <span className="text-2xl text-slate-400 line-through font-light">{product.oldPrice.toLocaleString()} CFA</span>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 text-lg font-light">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button 
              onClick={() => addItem(product)}
              className="flex-1 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl shadow-primary/20"
            >
              <ShoppingCart className="w-6 h-6" />
              Ajouter au panier
            </button>
            <button className="px-8 py-5 border-2 border-slate-200 dark:border-primary/20 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-primary/5 transition-all">
              Favoris
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-primary/10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Livraison Express</p>
                <p className="text-[10px] text-slate-500">Gratuite dès 500€</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Garantie 2 Ans</p>
                <p className="text-[10px] text-slate-500">SAV Premium Inclus</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Retours Faciles</p>
                <p className="text-[10px] text-slate-500">Sous 14 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24">
        <h3 className="text-2xl font-black uppercase italic mb-10 border-b border-primary w-fit pb-2">Spécifications Techniques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6">
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between py-4 border-b border-slate-100 dark:border-primary/5">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{key}</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
