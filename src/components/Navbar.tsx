import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut, LayoutDashboard, ChevronRight, Sparkles } from 'lucide-react';
import { useCartStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const cartItems = useCartStore((state) => state.items);
  const { user, profile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/shop', label: 'Boutique' },
    { to: '/shop?cat=cuisine', label: 'Cuisine', match: '/shop' },
    { to: '/shop?promo=true', label: 'Promos', accent: true },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-[0_1px_30px_-8px_rgba(0,0,0,0.08)] border-b border-slate-100 dark:border-slate-800/50'
            : 'bg-white dark:bg-slate-950 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">

            {/* Logo */}
            <Link to="/" className="relative flex items-center gap-2.5 group shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300">
                  <span className="text-white font-black text-sm tracking-tighter">V</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary-dark opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                VENT<span className="text-primary">OUT</span>
              </span>
            </Link>

            {/* Center Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-12">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    link.accent
                      ? 'text-primary hover:bg-primary/5'
                      : isActive(link.to.split('?')[0])
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.accent && (
                    <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  )}
                  {link.label}
                  {isActive(link.to.split('?')[0]) && !link.accent && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Search */}
              <div className="hidden sm:block relative">
                <motion.div
                  animate={{ width: isSearchFocused ? 260 : 180 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative"
                >
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 text-sm outline-none placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
                  />
                </motion.div>
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
              >
                <ShoppingCart className="w-[20px] h-[20px]" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-primary/30"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Admin */}
              {user && isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:flex p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
                >
                  <LayoutDashboard className="w-[20px] h-[20px]" />
                </Link>
              )}

              {/* User */}
              {user && profile ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-200"
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden ring-2 ring-primary/20">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                          {profile.display_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                      {profile.display_name?.split(' ')[0] || 'Profil'}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors duration-200 shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Connexion</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isMenuOpen ? 'close' : 'open'}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-950 z-[70] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {/* Mobile search */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 outline-none text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all"
                  />
                </div>

                {/* Nav links */}
                <nav className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 ${
                          link.accent
                            ? 'text-primary bg-primary/5'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {link.accent && <Sparkles className="w-4 h-4" />}
                          {link.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-5" />

                {/* User section */}
                <div className="space-y-1">
                  {user ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-primary/20">
                            {profile?.photo_url ? (
                              <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                                {profile?.display_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {profile?.display_name || 'Mon Profil'}
                            </p>
                            <p className="text-xs text-slate-400">{profile?.email}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
                        </Link>
                      </motion.div>
                      {isAdmin && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <LayoutDashboard className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Administration</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
                          </Link>
                        </motion.div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                      >
                        <button
                          onClick={() => { logout(); setIsMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
                        >
                          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                          <span className="text-sm font-semibold text-slate-500 group-hover:text-red-500 transition-colors">Déconnexion</span>
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-semibold text-sm shadow-sm"
                      >
                        <User className="w-4 h-4" />
                        Connexion
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
