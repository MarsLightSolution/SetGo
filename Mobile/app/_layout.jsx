import { Stack, usePathname } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../Store/store';
import { FilterProvider } from '../context/FilterContext';
import { useAuthStore } from '../Store/authStore';
import BottomTabBar from '../Components/BottomTabBar';
import ErrorBoundary from '../Components/ErrorBoundary';
import SplashScreen from '../Components/SplashScreen';
import { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initialized = useAuthStore((state) => state.initialized);
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Mark app as ready when auth is initialized
  useEffect(() => {
    if (initialized) {
      setAppReady(true);
    }
  }, [initialized]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Define routes where tabs should be hidden
  const hideTabsRoutes = [
    '/AccountManagement/Accountsetting',
    '/auth',
    '/filters',
    '/checkout',
    '/chat',
    '/UserInfo/Userinfo',
    '/Chat/chat',
    '/Chat/chatbot',
    '/Chat/raiseQuery',
    '/UserInfo/EditForm',
    '/confirm',
    '/shops',
    '/shop'
  ];

  // Check if current route should hide tabs
  const shouldHideTabs =
    hideTabsRoutes.some(route => pathname?.startsWith(route)) ||
    pathname?.startsWith('/product/') ||
    pathname?.startsWith('/order/') ||
    pathname?.startsWith('/shop/');

  // Show splash screen until app is ready and splash animation completes
  if (showSplash || !appReady) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

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
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#ffffff'
            }}>
              <SplashScreen onFinish={() => {}} />
            </View>
          }
          persistor={persistor}
        >
          <FilterProvider>
            <AppContent />
          </FilterProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
