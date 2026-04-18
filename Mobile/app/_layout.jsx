import { Stack, usePathname, useRouter } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../Store/store';
import { FilterProvider } from '../context/FilterContext';
import { useAuthStore } from '../Store/authStore';
import { useOnboardingStore } from '../Store/onboardingStore';
import BottomTabBar from '../Components/BottomTabBar';
import ErrorBoundary from '../Components/ErrorBoundary';
import SplashScreen from '../Components/SplashScreen';
import OfflineBanner from '../Components/OfflineBanner';
import { useEffect, useState, useCallback } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from '../services/queryClient';
import '../i18n';

function AppContent() {
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initialized = useAuthStore((state) => state.initialized);
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const setSessionExpired = useAuthStore((state) => state.setSessionExpired);
  const initOnboarding = useOnboardingStore((state) => state.initialize);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    // Run auth check and onboarding check in parallel
    checkAuth();
    initOnboarding()
      .then(() => setOnboardingChecked(true))
      .catch(() => setOnboardingChecked(true)); // always unblock even if i18n/storage fails
  }, []);

  // Redirect to auth when the session expires (token refresh failed)
  useEffect(() => {
    if (sessionExpired && appReady && !showSplash) {
      setSessionExpired(false); // reset flag before navigating
      Toast.show({
        type: 'info',
        text1: 'Session Expired',
        text2: 'Please log in again to continue.',
        visibilityTime: 4000,
      });
      router.replace('/auth');
    }
  }, [sessionExpired, appReady, showSplash]);

  // Mark app as ready only when both auth and onboarding have been checked
  useEffect(() => {
    if (initialized && onboardingChecked) {
      setAppReady(true);
    }
  }, [initialized, onboardingChecked]);

  // After splash fades and app is ready, redirect first-time users to onboarding
  useEffect(() => {
    if (!showSplash && appReady && hasSeenOnboarding === false) {
      router.replace('/onboarding/language');
    }
  }, [showSplash, appReady, hasSeenOnboarding]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Define routes where tabs should be hidden
  const hideTabsRoutes = [
    '/onboarding',
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
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#008235"
        translucent={false}
      />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#F9FAFB' }
        }}
      >
        {/* Onboarding screens — no header, no tabs */}
        <Stack.Screen name="onboarding/language" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/slides" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding/gate" options={{ animation: 'slide_from_right' }} />

        <Stack.Screen name="index" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="post" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />

        {/* Chat screen — deep-linkable from product detail */}
        <Stack.Screen
          name="chat"
          options={{
            animation: 'slide_from_right',
            presentation: 'card'
          }}
        />

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
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
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
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
