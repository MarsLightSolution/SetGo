import { toast } from "react-hot-toast";

export const showSuccessToast = (message) => toast.success(message);
export const showErrorToast = (message) => toast.error(message);
export const showWarningToast = (message) => toast(message, { icon: '⚠️' });
export const showInfoToast = (message) => toast(message, { icon: 'ℹ️' });

// No-op: Toaster is already mounted in main.jsx
export const ToastifyContainer = () => null;
