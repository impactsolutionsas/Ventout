import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Check if user is admin in Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            console.log(`User ${user.uid} role: ${role}`);
            setIsAdmin(role === 'admin');
          } else {
            // Create user doc if it doesn't exist
            const newUser = {
              email: user.email,
              role: 'user',
              createdAt: Date.now(),
              displayName: user.displayName || 'Utilisateur'
            };
            await setDoc(doc(db, 'users', user.uid), newUser);
            setIsAdmin(false);
          }
        } catch (error: any) {
          console.error("Firestore error in AuthContext:", error);
          // If we can't read the user doc, we definitely aren't an admin
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      alert("Configuration Firebase manquante. Veuillez ajouter votre clé API dans les paramètres de l'application.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/invalid-api-key') {
        alert("Clé API Firebase invalide. Veuillez vérifier votre configuration.");
      } else if (error.code === 'auth/configuration-not-found') {
        alert("Configuration manquante : L'authentification Google n'est pas activée dans votre projet Firebase.\n\nAction requise :\n1. Allez dans la console Firebase\n2. Authentication > Sign-in method\n3. Cliquez sur 'Ajouter un fournisseur'\n4. Sélectionnez 'Google' et activez-le.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`Domaine non autorisé : Ce domaine (${window.location.hostname}) n'est pas autorisé dans votre console Firebase.\n\nAction requise :\n1. Allez dans la console Firebase\n2. Authentication > Settings > Authorized domains\n3. Ajoutez "${window.location.hostname}" à la liste.`);
      } else if (error.code === 'auth/popup-blocked') {
        alert("Le popup de connexion a été bloqué par votre navigateur. Veuillez autoriser les popups pour ce site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silent fail as user intentionally closed it
        console.log("Login popup closed by user");
      } else {
        alert(`Échec de la connexion : ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
