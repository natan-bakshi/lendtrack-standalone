import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // בדוק session קיים
    auth.getUser().then((u) => {
      setUser(u);
      setIsAuthenticated(!!u);
      setIsLoadingAuth(false);
    });

    // הקשב לשינויים
    const unsubscribe = auth.onAuthStateChange((u) => {
      setUser(u);
      setIsAuthenticated(!!u);
      setIsLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
