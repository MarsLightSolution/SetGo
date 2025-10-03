import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../Store/store';
import { FilterProvider } from '../context/FilterContext';
import { useAuthStore } from '../Store/authStore';
import BottomTabBar from '../Components/BottomTabBar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'none'
        }}
      >
        {/* Main screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="post" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />
        
        {/* Product detail screen */}
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            animation: 'slide_from_right'
          }} 
        />
        
        {/* Modal/Fullscreen screens */}
        <Stack.Screen 
          name="auth" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="filters" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="checkout" 
          options={{ 
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="chat" 
          options={{ 
            animation: 'slide_from_right'
          }} 
        />
      </Stack>
      <BottomTabBar />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        } 
        persistor={persistor}
      >
        <FilterProvider>
          <AppContent />
        </FilterProvider>
      </PersistGate>
    </Provider>
  );
}