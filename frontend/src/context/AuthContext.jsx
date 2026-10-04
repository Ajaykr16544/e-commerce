import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopnest_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadUser = async () => {
    const savedToken = localStorage.getItem('shopnest_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      localStorage.removeItem('shopnest_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: authToken, user: loggedUser } = res.data;
        localStorage.setItem('shopnest_token', authToken);
        setToken(authToken);
        setUser(loggedUser);
        showToast(`Welcome back, ${loggedUser.name}!`, 'success');
        return { success: true };
      }
    } catch (error) {
      showToast(error.message, 'error');
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        const { token: authToken, user: newUser } = res.data;
        localStorage.setItem('shopnest_token', authToken);
        setToken(authToken);
        setUser(newUser);
        showToast('Account registered successfully! Welcome to ShopNest.', 'success');
        return { success: true };
      }
    } catch (error) {
      showToast(error.message, 'error');
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('shopnest_token');
      setToken(null);
      setUser(null);
      showToast('Logged out successfully', 'info');
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/me/update', data);
      if (res.data.success) {
        setUser(res.data.user);
        showToast('Profile updated successfully', 'success');
        return { success: true };
      }
    } catch (error) {
      showToast(error.message, 'error');
      return { success: false, message: error.message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/password/update', { currentPassword, newPassword });
      if (res.data.success) {
        showToast('Password changed successfully', 'success');
        return { success: true };
      }
    } catch (error) {
      showToast(error.message, 'error');
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    reloadUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
