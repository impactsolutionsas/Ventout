import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      navigate('/');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 dark:border-primary/20 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Connexion</h1>
            <p className="text-slate-500 text-sm">Bon retour parmi nous sur VENTOUT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                <Link to="/reset-password" title="Réinitialiser le mot de passe" className="text-[10px] font-bold text-primary hover:underline">Oublié ?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Google Auth removed */}

          <p className="mt-10 text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary font-black uppercase italic hover:underline">S'inscrire</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
};
