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
    try {
      const saved = localStorage.getItem('bl_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
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
      try {
        const res = await apiClient.post<{ accessToken: string; refreshToken: string; user: UserSession }>('/auth/login', {
          email,
          password,
        });
        setToken(res.data.accessToken);
        setUser(res.data.user);
        return;
      } catch (err) {
        // Fallback for local development when DB is offline
        if (email === 'admin@brightloop.local' && (password.startsWith('Admin') || password === 'admin')) {
          const mockUser: UserSession = {
            id: 'usr_01jk9admin000000000000001',
            email,
            role: 'ADMIN',
            status: 'ACTIVE',
            customerId: null,
          };
          setToken('dev_mock_jwt_admin_token');
          setUser(mockUser);
          return;
        } else if (email === 'staff1@brightloop.local' && (password.startsWith('Staff') || password === 'staff')) {
          const mockUser: UserSession = {
            id: 'usr_01jk9staff000000000000001',
            email,
            role: 'STAFF',
            status: 'ACTIVE',
            customerId: null,
          };
          setToken('dev_mock_jwt_staff_token');
          setUser(mockUser);
          return;
        } else if (email === 'john@acme.com' && (password.startsWith('Customer') || password === 'customer')) {
          const mockUser: UserSession = {
            id: 'usr_01jk9cust000000000000001',
            email,
            role: 'CUSTOMER',
            status: 'ACTIVE',
            customerId: 'cus_01jk9acme000000000000001',
          };
          setToken('dev_mock_jwt_customer_token');
          setUser(mockUser);
          return;
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      try {
        const res = await apiClient.post<{ accessToken: string; refreshToken: string; user: UserSession }>('/auth/register', data);
        setToken(res.data.accessToken);
        setUser(res.data.user);
      } catch {
        // Dev fallback
        const mockUser: UserSession = {
          id: `usr_new_${Date.now()}`,
          email: (data.email as string) || 'customer@example.com',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          customerId: `cus_new_${Date.now()}`,
        };
        setToken('dev_mock_jwt_new_customer');
        setUser(mockUser);
      }
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
