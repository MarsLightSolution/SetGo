"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../Store/authStore";
import { useRouter } from "expo-router";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../utils/toastify";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading } = useAuthStore();
  const router = useRouter();
const handleLogin = async () => {
  if (!email || !password) {
    showErrorToast("Please enter email & password");
    return;
  }

  try {
    const { success, message } = await login(email, password);

    if (success) {
      showSuccessToast(message); // show "Login successful!"
      router.push("/"); // Home
    } else {
      showErrorToast(message); // show backend error message
      router.push("/(auth)"); // Stay on login
    }
  } catch (err) {
    showErrorToast("Network error. Please try again");
    console.error("Login error:", err);
  }
};



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.formSection}>
            <Text style={styles.title}>Login</Text>
            <View style={styles.divider} />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.registerSection}>
            <Text style={styles.title}>Not registered yet?</Text>
            <View style={styles.divider} />

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="heart" size={16} color="#000" />
                <Text style={styles.featureText}>Save your favorite items</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubble" size={16} color="#000" />
                <Text style={styles.featureText}>Connect with community</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="create" size={16} color="#000" />
                <Text style={styles.featureText}>Create and share content</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.registerButtonText}>Register in 30 seconds</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3f0",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formSection: {
    marginBottom: 32,
  },
  registerSection: {
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  divider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  loginButton: {
    backgroundColor: "#B5E941",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  registerButton: {
    backgroundColor: "#B5E941",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  registerButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
