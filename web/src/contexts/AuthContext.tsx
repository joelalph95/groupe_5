import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import socketService from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (telephone: string, password: string) => Promise<void>;
  register: (userData: any, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      socketService.connect(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (telephone: string, password: string) => {
    const response = await authService.login(telephone, password);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
    socketService.connect(response.token);
  };

  const register = async (userData: any, role: string) => {
    let response;
    if (role === 'patient') {
      response = await authService.registerPatient(userData);
    } else if (role === 'ambulancier') {
      response = await authService.registerAmbulancier(userData);
    } else if (role === 'pharmacien') {
      response = await authService.registerPharmacien(userData);
    } else {
      throw new Error('Rôle invalide');
    }
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
    socketService.connect(response.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};