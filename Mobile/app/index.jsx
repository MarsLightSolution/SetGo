import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../Store/authStore";

export default function Index() {
  const { userName, accessToken, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      {accessToken ? (
        <>
          <Text style={styles.welcome}>Welcome, {userName || "User"} 🎉</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
        <Text style={styles.title}>👋 Welcome to the App</Text>
          <Link href="/(form)" asChild>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Form</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)" asChild>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Login</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/signup" asChild>
            <TouchableOpacity style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Register</Text>
            </TouchableOpacity>
          </Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 15,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  btnOutlineText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
  logoutBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
