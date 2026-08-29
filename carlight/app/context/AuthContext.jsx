'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData) => {
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setAuthError(null);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError('Failed to login. Please try again.');
      return { success: false, error: 'Failed to login' };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setUser(null);
      localStorage.clear();
      setAuthError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthError('Failed to logout. Please try again.');
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, authError, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
