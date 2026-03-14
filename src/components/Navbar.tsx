import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Diamond, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useCartStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const cartItems = useCartStore((state) => state.items);
  const { user, isAdmin, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useLocation().search ? [new URLSearchParams(location.search)] : [new URLSearchParams()];
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const params = new URLSearchParams(location.search);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }

    if (location.pathname !== '/shop') {
      navigate(`/shop?${params.toString()}`);
    } else {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  };

  React.useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [location.search]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-primary/20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-2 text-primary group">
            <img src="https://ais-pre-rwo65hk33mxz32suosmmx3-137105490329.europe-west3.run.app/logo.png" alt="VENTOUT" className="h-10 w-auto transition-transform group-hover:scale-110" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden flex items-center gap-2">
              <Diamond className="w-8 h-8" />
              <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-black leading-tight tracking-tighter">VENTOUT</h2>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/shop" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">Électroménager</Link>
            <Link to="/shop?cat=cuisine" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">Cuisine</Link>
            <Link to="/shop?promo=true" className="text-primary text-sm font-bold uppercase tracking-wider">Promos</Link>
          </nav>
        </div>

        <div className="flex flex-1 justify-end gap-3 md:gap-6 items-center">
          <div className="flex relative max-w-[120px] sm:max-w-[200px] md:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-8 md:pl-10 pr-4 py-1.5 md:py-2 rounded-full border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[10px] md:text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 rounded-lg bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin" className="p-2 rounded-lg bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <Link to="/profile" className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </Link>
                <button onClick={logout} className="hidden md:block text-slate-500 hover:text-primary">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all">
                <User className="w-4 h-4" />
                Connexion
              </Link>
            )}

            <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-primary/20 p-6 flex flex-col gap-4"
          >
            <Link to="/shop" onClick={() => setIsMenuOpen(false)}>Électroménager</Link>
            <Link to="/shop?cat=cuisine" onClick={() => setIsMenuOpen(false)}>Cuisine</Link>
            <Link to="/shop?promo=true" onClick={() => setIsMenuOpen(false)}>Promos</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
