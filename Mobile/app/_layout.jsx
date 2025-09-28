import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../Components/SafeScreen";
import { StatusBar, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar,
          }}
        >
          {/* Left Tab */}
          <Tabs.Screen
            name="home"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="search-outline" size={24} color={color} />
              ),
            }}
          />

          {/* Middle bigger Tab */}
          <Tabs.Screen
            name="add"
            options={{
              tabBarButton: (props) => (
                <TouchableOpacity
                  {...props}
                  style={styles.middleButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
              ),
            }}
          />

          {/* Right Tabs */}
          <Tabs.Screen
            name="notifications"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="notifications-outline" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={24} color={color} />
              ),
            }}
          />
        </Tabs>
      </SafeScreen>

      <StatusBar barStyle="dark-content" backgroundColor="#f5f3f0" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 5,
  },
  middleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -20,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    elevation: 5,
  },
});
