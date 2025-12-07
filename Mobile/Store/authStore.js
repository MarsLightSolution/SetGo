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

    // 1️⃣ Login request
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    // 2️⃣ Check login success
    if (response.status === 200 || response.status === 201) {
      const userId = data.userId;
      const accessToken = data.accessToken;

      // 3️⃣ Create user object to store basic info
      const user = {
        userName: data.userName,
        userId: data.userId,
      };

      // 4️⃣ Store tokens and IDs
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userId', userId);

      // 5️⃣ Fetch full user data
      const userRes = await fetch(`${API_URL}/userdata/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = await userRes.json();
      console.log("User data response:", userData);

      if (userRes.ok) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData.data));

        set({
          isAuthenticated: true,
          user: userData.data || user,
          loading: false,
        });
        return { success: true, message: 'Login successful!' };
      } else {
        console.warn('Failed to fetch user details:', userData.message || userData.error);
        set({ loading: false });
        return { success: false, message: userData.message || 'Failed to fetch user details' };
      }
    } else {
      // Invalid credentials or server error
      set({ loading: false });
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    set({ loading: false });
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