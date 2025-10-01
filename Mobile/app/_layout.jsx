import { Stack } from 'expo-router';
import { FilterProvider } from '../context/FilterContext';
import BottomTabBar from '../Components/BottomTabBar';

export default function RootLayout() {
  return (
    <FilterProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'none' // Prevents flash during navigation
        }}
      >
        {/* Main screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="post" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />
        
        {/* Modal/Fullscreen screens - these won't show in bottom nav */}
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
      </Stack>
      <BottomTabBar />
    </FilterProvider>
  );
}