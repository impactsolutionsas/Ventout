import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Star, ShoppingCart, Zap, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../store';
import { supabase } from '../supabase';
import { Product, Category, FrontendContent } from '../types';

export const Home = () => {
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frontendContent, setFrontendContent] = useState<FrontendContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let isInitial = true;

    const fetchData = async (showLoader = false) => {
      if (showLoader) setLoading(true);

      try {
        // Fetch Products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) {
          console.error("Error fetching products:", productsError);
          setProducts(PRODUCTS);
        } else {
          setProducts(productsData && productsData.length > 0 ? productsData : PRODUCTS);
        }

        // Fetch Categories
        const { data: catsData, error: catsError } = await supabase
          .from('categories')
          .select('*');

        if (catsError) {
          console.error("Error fetching categories:", catsError);
          setCategories(CATEGORIES);
        } else {
          setCategories(catsData && catsData.length > 0 ? catsData : CATEGORIES);
        }

        // Fetch Frontend Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('content')
          .eq('id', 'frontend')
          .single();

        if (settingsError) {
          console.error("Error fetching frontend settings:", settingsError);
        } else if (settingsData) {
          setFrontendContent(settingsData.content as FrontendContent);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setProducts(PRODUCTS);
        setCategories(CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchData(true);

    // Set up real-time subscriptions
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData();
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchData();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.frontend' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const latestProducts = products.filter(p => p.new).slice(0, 5);
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const topProducts = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  const activeSlides = frontendContent?.slides.filter(s => s.active) || [];
  const displaySlides = activeSlides.length > 0 ? activeSlides : null;

  useEffect(() => {
    const slideCount = displaySlides ? displaySlides.length : latestProducts.length;
    if (slideCount === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [displaySlides?.length, latestProducts.length]);

  const nextSlide = () => {
    const slideCount = displaySlides ? displaySlides.length : latestProducts.length;
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };
  const prevSlide = () => {
    const slideCount = displaySlides ? displaySlides.length : latestProducts.length;
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Chargement de VENTOUT...</p>
      </div>
    );
  }

  const getSection = (id: string) => frontendContent?.featuredSections.find(s => s.id === id);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Categories */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-primary/20 overflow-hidden shadow-sm sticky top-24">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-primary/10">
              <h3 className="font-black uppercase italic tracking-tighter text-lg">Catégories</h3>
            </div>
            <nav className="p-4 space-y-1">
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/shop?cat=${cat.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 dark:border-primary/10">
                    <img src={cat.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-bold text-sm">{cat.name}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </nav>
            <div className="p-6 mt-4">
              <div className="bg-slate-950 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase text-primary mb-2">Petit Électro</p>
                  <p className="text-sm font-bold leading-tight mb-4 italic">Simplifiez votre quotidien</p>
                  <Link to="/shop?cat=petit-electro" className="text-[10px] font-black uppercase bg-primary text-white px-4 py-2 rounded-lg inline-block hover:scale-105 transition-transform">Découvrir</Link>
                </div>
                <Zap className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 rotate-12" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-12 overflow-hidden">
          {/* Hero Slider */}
          <section className="relative h-[400px] md:h-[550px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                {displaySlides ? (
                  <>
                    <img 
                      src={displaySlides[currentSlide].image} 
                      alt={displaySlides[currentSlide].title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent flex flex-col justify-center px-8 md:px-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/30">
                          <Sparkles className="w-3 h-3" /> {displaySlides[currentSlide].subtitle}
                        </span>
                        <h2 className="text-3xl md:text-7xl font-black text-white leading-tight md:leading-none mb-4 md:mb-6 max-w-2xl uppercase italic tracking-tighter">
                          {displaySlides[currentSlide].title}
                        </h2>
                        <p className="text-slate-300 text-sm md:text-lg mb-6 md:mb-10 max-w-md font-medium leading-relaxed line-clamp-2">
                          {displaySlides[currentSlide].description}
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <Link 
                            to={displaySlides[currentSlide].link}
                            className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20 text-center"
                          >
                            {displaySlides[currentSlide].buttonText}
                          </Link>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : latestProducts.length > 0 ? (
                  <>
                    <img 
                      src={latestProducts[currentSlide].image} 
                      alt={latestProducts[currentSlide].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent flex flex-col justify-center px-8 md:px-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/30">
                          <Sparkles className="w-3 h-3" /> Dernier Arrivage
                        </span>
                        <h2 className="text-3xl md:text-7xl font-black text-white leading-tight md:leading-none mb-4 md:mb-6 max-w-2xl uppercase italic tracking-tighter">
                          {latestProducts[currentSlide].name}
                        </h2>
                        <p className="text-slate-300 text-sm md:text-lg mb-6 md:mb-10 max-w-md font-medium leading-relaxed line-clamp-2">
                          {latestProducts[currentSlide].description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link 
                            to={`/product/${latestProducts[currentSlide].id}`}
                            className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20 text-center"
                          >
                            Voir le produit
                          </Link>
                          <button 
                            onClick={() => addItem(latestProducts[currentSlide])}
                            className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-white/20 transition-all"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <p className="text-white font-bold italic uppercase tracking-widest">Bienvenue chez VENTOUT</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slider Controls */}
            <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 flex gap-2 md:gap-3 z-10">
              <button 
                onClick={prevSlide}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Slider Indicators */}
            <div className="absolute bottom-8 left-8 flex gap-2 z-10">
              {(displaySlides || latestProducts).map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${currentSlide === idx ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
                />
              ))}
            </div>
          </section>

          {/* Mobile Categories (Horizontal Scroll) */}
          <section className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Catégories</h3>
              <Link to="/shop" className="text-primary text-xs font-bold uppercase underline">Tout voir</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/shop?cat=${cat.id}`}
                  className="flex-shrink-0 w-32 text-center group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 border border-slate-200 dark:border-primary/20">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Top Products Section */}
          {(!getSection('top') || getSection('top')?.active) && (
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Tendances</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                    {getSection('top')?.title || 'Top Produits'}
                  </h3>
                  {getSection('top')?.subtitle && <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{getSection('top')?.subtitle}</p>}
                </div>
                <Link to="/shop" className="text-slate-500 hover:text-primary transition-colors flex items-center gap-2 font-bold text-sm">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {topProducts.map((product) => (
                  <ProductCard key={product.id} product={product} addItem={addItem} />
                ))}
              </div>
            </section>
          )}

          {/* Featured Selection Section */}
          {(!getSection('featured') || getSection('featured')?.active) && (
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Star className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sélection</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                    {getSection('featured')?.title || 'Produits Vedettes'}
                  </h3>
                  {getSection('featured')?.subtitle && <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{getSection('featured')?.subtitle}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} addItem={addItem} />
                ))}
              </div>
            </section>
          )}

          {/* Banner Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 rounded-[2rem] p-10 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-primary font-black uppercase tracking-widest text-[10px] mb-4 block">Collection Électronique</span>
                <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-4 leading-none">Le futur <br/>est ici.</h4>
                <p className="text-slate-400 text-sm mb-8 max-w-[200px]">Découvrez les derniers smartphones et laptops.</p>
                <Link to="/shop?cat=electronics" className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                  Acheter <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400" 
                alt="" 
                className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="bg-primary rounded-[2rem] p-10 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-white/80 font-black uppercase tracking-widest text-[10px] mb-4 block">Petit Électro</span>
                <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-4 leading-none">Cuisinez <br/>comme un chef.</h4>
                <p className="text-white/70 text-sm mb-8 max-w-[200px]">Des robots qui font tout le travail pour vous.</p>
                <Link to="/shop?cat=petit-electro" className="inline-flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-slate-950 transition-all">
                  Explorer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400" 
                alt="" 
                className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30 group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </section>

          {/* Latest Arrivals Section */}
          {(!getSection('latest') || getSection('latest')?.active) && (
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Zap className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Nouveautés</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                    {getSection('latest')?.title || 'Derniers Arrivages'}
                  </h3>
                  {getSection('latest')?.subtitle && <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{getSection('latest')?.subtitle}</p>}
                </div>
                <Link to="/shop" className="text-slate-500 hover:text-primary transition-colors flex items-center gap-2 font-bold text-sm">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {latestProducts.map((product) => (
                  <ProductCard key={product.id} product={product} addItem={addItem} />
                ))}
              </div>
            </section>
          )}

          {/* Newsletter Section */}
          <section className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-200 dark:border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Rejoignez le Club</h3>
              <p className="text-slate-500 mb-8">Inscrivez-vous pour recevoir nos offres exclusives et les dernières nouveautés directement dans votre boîte mail.</p>
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="votre@email.com" 
                  className="flex-1 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-primary/20 outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform">
                  S'inscrire
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, addItem }: any) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-primary/20 overflow-hidden hover:shadow-2xl transition-all duration-500"
    >
      <div className="relative aspect-square p-3 md:p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
        {product.new && (
          <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-primary text-white text-[7px] md:text-[8px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase italic z-10">New</span>
        )}
        <img src={product.image} alt={product.name} className="max-w-full h-auto object-contain group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-x-2 md:inset-x-4 bottom-2 md:bottom-4 translate-y-16 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <button 
            onClick={() => addItem(product)}
            className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl"
          >
            <ShoppingCart className="w-4 h-4" /> Ajouter
          </button>
        </div>
        {/* Mobile Add to Cart Button */}
        <button 
          onClick={() => addItem(product)}
          className="md:hidden absolute bottom-2 right-2 bg-primary text-white p-2 rounded-lg shadow-lg z-10"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{product.brand}</span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
            <span className="text-[8px] md:text-[10px] font-bold">{product.rating}</span>
          </div>
        </div>
        <Link to={`/product/${product.id}`} className="text-[10px] md:text-sm font-black uppercase italic tracking-tighter line-clamp-1 hover:text-primary transition-colors">
          {product.name}
        </Link>
        <div className="mt-2 md:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs md:text-lg font-black text-primary">{product.price.toLocaleString()} CFA</span>
          {product.oldPrice && (
            <span className="text-[8px] md:text-xs text-slate-400 line-through">{product.oldPrice.toLocaleString()} CFA</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
