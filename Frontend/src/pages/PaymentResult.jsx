import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SERVER = import.meta.env.VITE_SERVER;
const POLL_MS = 2000;
const MAX_WAIT_MS = 90000;

// The browser return from the bank proves nothing; the order's paymentStatus (set by the
// bank's server-to-server callback) is the only source of truth.
async function fetchOrder(orderId, allowRefresh = true) {
  const res = await fetch(`${SERVER}/api/payments/order/${orderId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    credentials: "include",
  });
  if (res.status === 401 && allowRefresh) {
    const refreshed = await fetch(`${SERVER}/refreshAccessToken`, { method: "POST", credentials: "include" });
    const body = await refreshed.json().catch(() => ({}));
    if (refreshed.ok && body.accessToken) {
      localStorage.setItem("accessToken", body.accessToken);
      return fetchOrder(orderId, false);
    }
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).data.order;
}

const ICONS = {
  processing: (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-lime-200 rounded-full" />
      <div className="absolute inset-0 border-4 border-lime-500 rounded-full border-t-transparent animate-spin" />
    </div>
  ),
  completed: (
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  failed: (
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
  waiting: (
    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

export default function PaymentResult() {
  const { orderId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState("processing"); // processing | completed | failed | timeout | error
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer;
    let seenOrder = false;
    const started = Date.now();

    const poll = async () => {
      try {
        const current = await fetchOrder(orderId);
        if (cancelled) return;
        seenOrder = true;
        setOrder(current);
        if (current.paymentStatus === "completed" || current.paymentStatus === "failed") {
          setState(current.paymentStatus);
          localStorage.removeItem("pendingPayment");
          return;
        }
      } catch {
        if (cancelled) return;
      }
      if (Date.now() - started > MAX_WAIT_MS) {
        setState(seenOrder ? "timeout" : "error");
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  const icon = state === "timeout" || state === "error" ? ICONS.waiting : ICONS[state];
  const productId = order?.product?.id;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h1 className="text-xl font-bold mb-2">{t(`paymentResult.${state}.title`)}</h1>
        <p className="text-gray-600 mb-4">{t(`paymentResult.${state}.message`)}</p>

        {order && (
          <div className="border rounded-lg p-4 mb-5 bg-gray-50 text-sm text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">{t("paymentResult.total")}</span>
              <span className="font-semibold">₼ {order.total}</span>
            </div>
            {order.walletDeduction > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t("payment.walletPayment")}</span>
                <span>₼ {order.walletDeduction}</span>
              </div>
            )}
            {order.onlineAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t("payment.onlinePayment")}</span>
                <span>₼ {order.onlineAmount}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {state === "completed" && (
            <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg" onClick={() => navigate(`/order/${orderId}`)}>
              {t("paymentResult.viewOrder")}
            </button>
          )}
          {state === "failed" && productId && (
            <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg" onClick={() => navigate(`/product/${productId}`)}>
              {t("paymentResult.tryAgain")}
            </button>
          )}
          {(state === "timeout" || state === "error") && (
            <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-3 rounded-lg" onClick={() => navigate("/orders")}>
              {t("paymentResult.myOrders")}
            </button>
          )}
          {state !== "processing" && (
            <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg" onClick={() => navigate("/")}>
              {t("paymentResult.continueShopping")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
