import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  checkAuth: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userStr && userId) {
        set({ 
          isAuthenticated: true, 
          user: JSON.parse(userStr),
          loading: false
        });
      } else {
        set({ isAuthenticated: false, user: null, loading: false });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isAuthenticated: false, user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Create user object to store
        const user = {
          userName: data.userName,
          userId: data.userId,
          // Add any other user properties you need
        };

        await AsyncStorage.setItem('token', data.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('userId', data.userId);
        
        set({ 
          isAuthenticated: true, 
          user: user,
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
      await AsyncStorage.multiRemove(['token', 'user','userId']);
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));