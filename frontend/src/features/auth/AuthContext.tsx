import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

export interface UserSession {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  status?: string;
  customerId?: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('bl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bl_token');
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('bl_token', token);
    } else {
      localStorage.removeItem('bl_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bl_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bl_user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ accessToken: string; refreshToken: string; user: UserSession }>('/auth/login', {
        email,
        password,
      });
      setToken(res.data.accessToken);
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ accessToken: string; refreshToken: string; user: UserSession }>('/auth/register', data);
      setToken(res.data.accessToken);
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bl_token');
    localStorage.removeItem('bl_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
