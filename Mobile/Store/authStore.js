import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (token && user) {
        set({ 
          isAuthenticated: true, 
          user: JSON.parse(user) 
        });
      } else {
        set({ isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isAuthenticated: false, user: null });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        set({ 
          isAuthenticated: true, 
          user: data.user,
          loading: false 
        });

        return { success: true, message: 'Login successful!' };
      } else {
        set({ loading: false });
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      set({ loading: false });
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));