import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text1: {
    fontSize: 16,
    fontWeight: "600",
  },
  text2: {
    fontSize: 14,
    fontWeight: "500",
  },
});

/* ---------------------- CUSTOM TOAST COMPONENTS ---------------------- */

const SuccessToast = (props) => (
  <BaseToast
    {...props}
    style={[styles.container, { borderLeftColor: "#4CAF50", backgroundColor: "#E8F5E9" }]}
    contentContainerStyle={{ paddingHorizontal: 12 }}
    text1Style={[styles.text1, { color: "#2E7D32" }]}
    text2Style={[styles.text2, { color: "#388E3C" }]}
  />
);

const ErrorToastCustom = (props) => (
  <ErrorToast
    {...props}
    style={[styles.container, { borderLeftColor: "#F44336", backgroundColor: "#FFEBEE" }]}
    text1Style={[styles.text1, { color: "#C62828" }]}
    text2Style={[styles.text2, { color: "#B71C1C" }]}
  />
);

const WarningToast = (props) => (
  <BaseToast
    {...props}
    style={[styles.container, { borderLeftColor: "#FFC107", backgroundColor: "#FFF8E1" }]}
    contentContainerStyle={{ paddingHorizontal: 12 }}
    text1Style={[styles.text1, { color: "#FF8F00" }]}
    text2Style={[styles.text2, { color: "#FF6F00" }]}
  />
);

const InfoToast = (props) => (
  <BaseToast
    {...props}
    style={[styles.container, { borderLeftColor: "#2196F3", backgroundColor: "#E3F2FD" }]}
    contentContainerStyle={{ paddingHorizontal: 12 }}
    text1Style={[styles.text1, { color: "#1565C0" }]}
    text2Style={[styles.text2, { color: "#0D47A1" }]}
  />
);

/* ---------------------- BASE CONFIG ---------------------- */

const baseConfig = {
  position: "top",
  visibilityTime: 3000,
  autoHide: true,
  topOffset: 50,
};

/* ---------------------- EXPORT FUNCTIONS ---------------------- */

export const showSuccessToast = (message) => {
  Toast.show({ type: "success", text1: "Success", text2: message, ...baseConfig });
};

export const showErrorToast = (message) => {
  Toast.show({ type: "error", text1: "Error", text2: message, ...baseConfig });
};

export const showWarningToast = (message) => {
  Toast.show({ type: "warning", text1: "Warning", text2: message, ...baseConfig });
};

export const showInfoToast = (message) => {
  Toast.show({ type: "info", text1: "Info", text2: message, ...baseConfig });
};

/* ---------------------- TOAST CONTAINER ---------------------- */

export const ToastifyContainer = () => (
  <Toast
    config={{
      success: SuccessToast,
      error: ErrorToastCustom,
      warning: WarningToast,
      info: InfoToast,
    }}
  />
);
