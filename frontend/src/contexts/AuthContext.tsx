import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  specialization?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialUser(): User | null {
  const storedUser = localStorage.getItem('carenet_user');
  const storedToken = localStorage.getItem('carenet_token');
  if (storedUser && storedToken) {
    try {
      const parsed = JSON.parse(storedUser);
      parsed.token = storedToken;
      return parsed;
    } catch {
      localStorage.removeItem('carenet_user');
      localStorage.removeItem('carenet_token');
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = data.data;
    localStorage.setItem('carenet_token', userData.token);
    localStorage.setItem('carenet_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    const userData = data.data;
    localStorage.setItem('carenet_token', userData.token);
    localStorage.setItem('carenet_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('carenet_token');
    localStorage.removeItem('carenet_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
