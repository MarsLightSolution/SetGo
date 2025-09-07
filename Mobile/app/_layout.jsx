import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../Components/SafeScreen";
import { StatusBar, ActivityIndicator, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "../Store/authStore";

export default function RootLayout() {
  const { loadAuth, loading } = useAuthStore();

  // 🔹 Load auth data on app start
  useEffect(() => {
    loadAuth();
  }, []);

  // 🔹 While loading AsyncStorage, show a splash/loader
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
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
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
