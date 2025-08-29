import React from "react";
import { Wallet, ShoppingBag, UserCog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Footer from "../common/Footer";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Example values (replace later with API data)
  const walletBalance = 1250;
  const ordersCount = 8;
  const sellerStatus = "Active";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex justify-center py-6 flex-1">
        <div className="bg-white max-w-5xl w-full rounded-2xl shadow-lg p-5">
          {/* Heading */}
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {t("dashboard.heading", { defaultValue: "Dashboard" })}
          </h1>
          <p className="text-center text-gray-500 mb-8">
            {t("dashboard.subtitle", {
              defaultValue:
                "Manage your wallet, orders and seller panel from one place.",
            })}
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wallet Box */}
            <div className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center">
              <Wallet className="h-12 w-12 text-lime-700 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t("dashboard.wallet", { defaultValue: "Wallet" })}
              </h3>
              <button
                onClick={() => navigate("/my/transactions")}
                className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-full font-medium transition"
              >
                {t("dashboard.viewWallet", { defaultValue: "View Wallet" })}
              </button>
            </div>

            {/* Orders Box */}
            <div className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center">
              <ShoppingBag className="h-12 w-12 text-lime-700 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t("dashboard.orders", { defaultValue: "Orders" })}
              </h3>
              <button
                onClick={() => navigate("/orders")}
                className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-full font-medium transition"
              >
                {t("dashboard.viewOrders", { defaultValue: "View Orders" })}
              </button>
            </div>

            {/* Seller/Admin Box */}
            <div className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col items-center text-center">
              <UserCog className="h-12 w-12 text-lime-700 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t("dashboard.sellerAdmin", {
                  defaultValue: "Seller / Admin",
                })}
              </h3>
              <button
                onClick={() => navigate("/seller")}
                className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-full font-medium transition"
              >
                {t("dashboard.viewSeller", { defaultValue: "View Panel" })}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer always at bottom */}
      <Footer />
    </div>
  );
};

export default Dashboard;
