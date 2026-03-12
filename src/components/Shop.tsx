import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../constants';
import { ShoppingCart, Filter, ChevronRight, Search } from 'lucide-react';
import { useCartStore } from '../store';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('cat');
  const promoOnly = searchParams.get('promo') === 'true';
  const searchQuery = searchParams.get('q') || '';
  const minPrice = Number(searchParams.get('min')) || 0;
  const maxPrice = Number(searchParams.get('max')) || 2000000;
  const selectedBrand = searchParams.get('brand') || '';
  const inStockOnly = searchParams.get('stock') === 'true';
  
  const addItem = useCartStore((state) => state.addItem);

  const brands = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort();

  const filteredProducts = PRODUCTS.filter(p => {
    if (categoryId && p.category !== categoryId) return false;
    if (promoOnly && !p.oldPrice) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (inStockOnly && p.stock <= 0) return false;
    return true;
  });

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  return (
    <main className="max-w-7xl mx-auto w-full px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">Catalogue</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Catégories</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/shop" className={`flex items-center justify-between text-sm hover:text-primary transition-colors ${!categoryId ? 'text-primary font-semibold' : ''}`}>
                    <span>Tous les produits</span>
                  </Link>
                </li>
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <Link to={`/shop?cat=${cat.id}`} className={`flex items-center justify-between text-sm hover:text-primary transition-colors ${categoryId === cat.id ? 'text-primary font-semibold' : ''}`}>
                      <span>{cat.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Filtres</h3>
              <div className="space-y-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={promoOnly} 
                    onChange={() => handleFilterChange('promo', promoOnly ? null : 'true')}
                    className="rounded border-slate-300 text-primary focus:ring-primary" 
                  /> 
                  Promotions uniquement
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={inStockOnly} 
                    onChange={() => handleFilterChange('stock', inStockOnly ? null : 'true')}
                    className="rounded border-slate-300 text-primary focus:ring-primary" 
                  /> 
                  En stock uniquement
                </label>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-primary/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marques</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleFilterChange('brand', null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!selectedBrand ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Toutes
                    </button>
                    {brands.map(brand => (
                      <button 
                        key={brand}
                        onClick={() => handleFilterChange('brand', brand)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBrand === brand ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-primary/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prix</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Min</label>
                      <input 
                        type="number" 
                        value={minPrice}
                        onChange={(e) => handleFilterChange('min', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Max</label>
                      <input 
                        type="number" 
                        value={maxPrice}
                        onChange={(e) => handleFilterChange('max', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2000000" 
                    step="10000"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('max', e.target.value)}
                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0 CFA</span>
                    <span>2 000 000 CFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {searchQuery && (
            <div className="mb-6 flex items-center gap-2 text-slate-500">
              <span className="text-sm">Résultats pour :</span>
              <span className="font-bold text-slate-900 dark:text-white italic">"{searchQuery}"</span>
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('q');
                  setSearchParams(params);
                }}
                className="text-xs text-primary hover:underline ml-2"
              >
                Effacer
              </button>
            </div>
          )}
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
              <div key={product.id} className="group relative flex flex-col rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:shadow-xl border border-slate-100 dark:border-primary/10">
                <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" />
                  {product.new && (
                    <span className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white uppercase">New</span>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.brand}</p>
                <Link to={`/product/${product.id}`} className="mt-1 text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2 h-10">
                  {product.name}
                </Link>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    {product.oldPrice && <span className="text-xs text-slate-400 line-through">{product.oldPrice.toLocaleString()} CFA</span>}
                    <span className="text-lg font-bold">{product.price.toLocaleString()} CFA</span>
                  </div>
                  <button 
                    onClick={() => addItem(product)}
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun produit trouvé</h3>
            <p className="text-slate-500 max-w-xs">Essayez de modifier vos filtres ou votre recherche pour trouver ce que vous cherchez.</p>
            <button 
              onClick={() => setSearchParams({})}
              className="mt-8 text-primary font-bold hover:underline"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>
    </div>
    </main>
  );
};
