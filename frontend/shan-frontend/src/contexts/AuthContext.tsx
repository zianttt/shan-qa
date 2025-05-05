// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '../api/api';
import { getToken, setToken, removeToken } from '../utils/tokenUtils';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await getCurrentUser();
          setCurrentUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          removeToken();
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = (userData: User, token: string) => {
    setCurrentUser(userData);
    setToken(token);
  };

  const logout = () => {
    setCurrentUser(null);
    removeToken();
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};