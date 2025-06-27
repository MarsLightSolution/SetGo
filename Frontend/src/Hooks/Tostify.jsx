import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
  style: {
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 500,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
};

export const showSuccessToast = (message) =>
  toast.success(message, toastOptions);

export const showErrorToast = (message) =>
  toast.error(message, toastOptions);

export const showWarningToast = (message) =>
  toast.warn(message, toastOptions);

export const showInfoToast = (message) =>
  toast.info(message, toastOptions);

export const ToastifyContainer = () => (
  <ToastContainer
    newestOnTop
    closeButton
    limit={3}
    toastClassName="rounded-xl shadow-md"
    bodyClassName="px-3 py-2"
  />
);
