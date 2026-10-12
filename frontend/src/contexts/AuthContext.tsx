import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../api/axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // В реальном приложении здесь нужно проверить токен на валидность через API
      // Для простоты считаем, что если токен есть, то пользователь залогинен
      setIsAuthenticated(true);
      // Можно сделать запрос /me для получения данных пользователя
      setUser({ id: 1, username: 'User' }); 
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser({ id: 1, username: 'User' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};