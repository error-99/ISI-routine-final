import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Semester, User } from '../types';

interface AuthContextType {
  user: User | null;
  currentSemester: Semester | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadCount: number;
  login: (student_id: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: {
    student_id: string;
    name: string;
    password: string;
    department: string;
    batch_no: string;
    semester_id: number;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  updateUserData: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = async () => {
    if (!api.getToken()) return;
    try {
      const res = await api.getUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // ignore
    }
  };

  const refreshProfile = async () => {
    if (!api.getToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.current_semester) {
          setCurrentSemester(res.data.current_semester);
        }
        await refreshUnreadCount();
      } else {
        // If token failed or invalid
        if (res.message && res.message.toLowerCase().includes('unauthorized')) {
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    // Background unread count poller every 30s
    const timer = setInterval(() => {
      if (api.getToken()) {
        refreshUnreadCount();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const login = async (student_id: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ student_id, password });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshProfile();
        return { success: true, message: res.message || 'Login successful' };
      }
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    student_id: string;
    name: string;
    password: string;
    department: string;
    batch_no: string;
    semester_id: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshProfile();
        return { success: true, message: res.message || 'Registration successful' };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
    setCurrentSemester(null);
    setUnreadCount(0);
  };

  const updateUserData = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentSemester,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        refreshProfile,
        refreshUnreadCount,
        updateUserData,
      }}
    >
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
