import { createContext, useState, type ReactNode } from 'react';
import api from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<{ isNewUser: boolean; isProfileComplete: boolean }>;
  selectRole: (role: string) => Promise<void>;
  completeProfile: (data: CompleteProfileData) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

interface RegisterData {
  email: string;
  password: string;
}

interface CompleteProfileData {
  name?: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

// eslint-disable-next-line react-refresh/only-export-components
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

  const googleLogin = async (idToken: string): Promise<{ isNewUser: boolean; isProfileComplete: boolean }> => {
    const { data } = await api.post('/auth/google', { idToken });
    const userData = data.data;
    localStorage.setItem('carenet_token', userData.token);
    localStorage.setItem('carenet_user', JSON.stringify(userData));
    setUser(userData);
    return { isNewUser: data.isNewUser, isProfileComplete: data.isProfileComplete };
  };

  const selectRole = async (role: string) => {
    const { data } = await api.post('/auth/google/select-role', { role });
    const updatedUser = { ...user!, role: data.data.role as User['role'], isProfileComplete: false };
    localStorage.setItem('carenet_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const completeProfile = async (profileData: CompleteProfileData) => {
    const { data } = await api.post('/auth/google/complete-profile', profileData);
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
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, selectRole, completeProfile, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
