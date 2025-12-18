import { Stack, usePathname } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../Store/store';
import { FilterProvider } from '../context/FilterContext';
import { useAuthStore } from '../Store/authStore';
import BottomTabBar from '../Components/BottomTabBar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';  // ✅ FIXED IMPORT

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  // Define routes where tabs should be hidden
const hideTabsRoutes = [
  '/AccountManagement/Accountsetting',
  '/auth',
  '/filters',
  '/checkout',

  // From HEAD
  '/chat',
  '/UserInfo/Userinfo',
  '/Chat/chat',
  '/Chat/chatbot',
  '/Chat/raiseQuery',

  // From incoming branch
  '/UserInfo/EditForm',
  '/confirm',

  // Shop routes
  '/shops',
  '/shop'
];

// Check if current route should hide tabs
const shouldHideTabs =
  hideTabsRoutes.some(route => pathname?.startsWith(route)) ||
  pathname?.startsWith('/product/') ||
  pathname?.startsWith('/order/') ||
  pathname?.startsWith('/shop/');

return (
  <>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none'
      }}
    >

        <Stack.Screen name="index" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="post" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />
        
        {/* Product detail screen */}
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
        
        {/* Order detail screen */}
        <Stack.Screen 
          name="order/[orderId]" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
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
          name="confirm" 
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
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
        
        <Stack.Screen 
          name="Chat/chat" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
        
        <Stack.Screen 
          name="AccountManagement/Accountsetting" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }} 
        />
        
        <Stack.Screen 
          name="UserInfo/Userinfo" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />
        
        <Stack.Screen 
          name="UserInfo/EditForm" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />

        {/* Dashboard screens */}
        <Stack.Screen 
          name="Dashboard/Dashboard" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card'
          }} 
        />

        {/* Categories screen */}
        <Stack.Screen
          name="categories/index"
          options={{
            animation: 'slide_from_right',
            presentation: 'card'
          }}
        />

        {/* Shop screens */}
        <Stack.Screen
          name="shops/index"
          options={{
            animation: 'slide_from_right',
            presentation: 'card'
          }}
        />

        <Stack.Screen
          name="shop/[id]"
          options={{
            animation: 'slide_from_right',
            presentation: 'card'
          }}
        />
      </Stack>
      {!shouldHideTabs && <BottomTabBar />}
      <Toast />
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
