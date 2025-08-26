import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const PaymentStatus = () => {
  const [status, setStatus] = useState("PENDING");
  const [price, setPrice] = useState(0); // Set appropriately or pass as prop
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  useEffect(() => {
    if (!orderId) return;

    const socket = io(`${import.meta.env.VITE_SERVER}`, { withCredentials: true });
    socket.emit("subscribePayment", orderId);

    socket.on("paymentUpdate", (data) => {
      if (data.status === "PAID" && data.orderId === orderId) {
        setStatus("SUCCESS");
        // Run any post-success callbacks here
        setTimeout(() => {
          socket.disconnect();
        }, 1800);
      }
    });

    return () => {
      socket.off("paymentUpdate");
      socket.disconnect();
    };
  }, [orderId]);

  // Render UI based on status
  return (
    <div>
      {status === "SUCCESS"
        ? "Payment Successful! Thank you."
        : status === "PENDING"
        ? "Waiting for payment confirmation..."
        : "Payment Failed."}
    </div>
  );
};

export default PaymentStatus;
