'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Load token from localStorage
    const savedToken = localStorage.getItem('geoteam_token');
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (jwtToken) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (err) {
      console.error('Session restore failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData);
      const { token: jwtToken, user: userData } = response.data;
      
      localStorage.setItem('geoteam_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('geoteam_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('geoteam_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setLoading(false);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, profileData);
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authError,
      register,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!user
    }}>
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
