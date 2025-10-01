import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { showErrorToast, showSuccessToast } from "../../utils/toastify";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const handleSignup = async () => {
    // ✅ Client-side validation before calling API
    if (!username || !email || !password) {
      showErrorToast("⚠️ Please fill all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("📧 Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showErrorToast("🔑 Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // ✅ Signup success
        showSuccessToast("🎉 Account created! Check your email for confirmation.");
        router.push({
          pathname: "/confirm",
          params: { email, password },
        });
      } else {
        // ✅ Handle specific errors from backend
        if (res.status === 400) {
          showErrorToast(data.message || "Invalid request. Please check your details.");
        } else if (res.status === 409) {
          // 409 Conflict → Email already registered
          showErrorToast("🚫 Email is already registered. Try logging in.");
        } else if (res.status === 422) {
          showErrorToast(data.message || "❌ Validation failed. Please check your input.");
        } else if (res.status === 500) {
          showErrorToast("💥 Server error. Please try again later.");
        } else {
          showErrorToast(data.message || "Signup failed. Please try again.");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Signup error:", error);
      showErrorToast("🌐 Network error. Please check your connection.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account ✨</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <TextInput
        style={styles.input}
        placeholder="Full username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#34C759",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footerText: {
    marginTop: 20,
    color: "#666",
    fontSize: 14,
  },
  link: {
    color: "#34C759",
    fontWeight: "600",
  },
});
