import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useAuthStore } from "../Store/authStore";
import { showErrorToast, showSuccessToast } from "../utils/toastify";
import { API_ENDPOINTS } from "../config/api";


export default function ConfirmPage() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams();
  const [verified, setVerified] = useState(false);

  const { login } = useAuthStore();

  useEffect(() => {
    let interval;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.CHECK_STATUS}?email=${email}`);
        const data = await res.json();

        if (data.success && data.emailVerified) {
          setVerified(true);
          clearInterval(interval);

          // auto login after short delay
          setTimeout(async () => {
            try {
              const { success, message } = await login(email, password);
              if (success) {
                showSuccessToast("Logged in successfully!");
                router.replace("/"); // go to Home
              } else {
                showErrorToast(message || "Login failed");
                router.replace("/auth"); // fallback to login
              }
            } catch (err) {
              showErrorToast("Network error. Please try again");
              console.error("Auto login error:", err);
            }
          }, 1500);
        }
      } catch (err) {
        console.log("Error checking verification:", err);
      }
    };

    // poll every 5s
    interval = setInterval(checkStatus, 5000);
    checkStatus();

    return () => clearInterval(interval);
  }, [email, password]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      {!verified ? (
        <Text style={styles.text}>
          We've sent a confirmation link to {email}.{"\n"} Please check your
          email to continue.
        </Text>
      ) : (
        <Text style={styles.text}>Email confirmed! Redirecting to login…</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
  },
});
