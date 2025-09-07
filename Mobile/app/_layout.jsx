import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../Components/SafeScreen";
import { StatusBar, ActivityIndicator, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "../Store/authStore";
import { ToastifyContainer } from "../utils/toastify";

export default function RootLayout() {
  const { loadAuth, loading } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeScreen>
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </SafeScreen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeScreen>
      <StatusBar
        barStyle="dark-content" 
        backgroundColor="#f5f3f0"
      />
      <ToastifyContainer />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
