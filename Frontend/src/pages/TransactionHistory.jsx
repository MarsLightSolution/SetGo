import React, { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Hash,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Minus,
} from "lucide-react";

import binocularImage from "../assets/images/binocular.png";

import { useTranslation } from "react-i18next";
import i18n from "../i18n"; // your i18n setup

/* Local UI components */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 pt-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variants = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-gray-200 text-gray-600",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-800",
    success: "bg-green-500 text-white shadow-sm",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const TransactionHistory = ({ forcedUserId }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUser(stored);
  }, []);

  useEffect(() => {
    const userId = user || forcedUserId;
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/users/${userId}/transactions`,
          {
            credentials: "include",
          }
        );
        const json = await res.json();
        const { transactions, walletBalance, totalCredit, totalDebit } =
          json.data || {};
        setTxns(transactions || []);
        setWalletBalance(walletBalance || 0);
        setTotalCredit(totalCredit || 0);
        setTotalDebit(totalDebit || 0);
      } catch (err) {
        console.error(t("transactionHistory.failedToFetchTransactions"), err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, forcedUserId, t]);

  const handleAddMoney = () => {
    alert(
      t("transactionHistory.addMoneyAlert") ||
        "Add Money functionality - Connect to your payment gateway"
    );
  };

  const handleWithdrawMoney = () => {
    alert(
      t("transactionHistory.withdrawMoneyAlert") ||
        "Withdraw Money functionality - Connect to your withdrawal system"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-lg text-gray-600">
                {t("transactionHistory.loadingTransactions") ||
                  "Loading transactions..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (txns.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 flex flex-col items-center justify-start px-6">
        <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-8 text-center">
          {/* Title first */}
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {t("No transactions found")}
          </h3>

          {/* Binocular image next */}
          <img
            src={binocularImage}
            alt={t("No Transactions")}
            className="mx-auto w-32 h-32 mb-6"
          />

          {/* Wallet Balance */}
          <div className="mb-6">
            <p className="text-gray-700 text-lg font-medium ">
              {t("Current Wallet Balance:")}
            </p>
            <p className="text-3xl font-bold text-green-600">
              €{walletBalance?.toFixed(2) || "0.00"}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="success"
              onClick={handleAddMoney}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base max-w-[140px]"
            >
              {/* <Plus className="h-5 w-5" /> */}
              {t("Add Money")}
            </Button>

            <Button
              variant="outline"
              onClick={handleWithdrawMoney}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base max-w-[140px]"
            >
              {/* <Minus className="h-5 w-5" /> */}
              {t("Withdraw")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-40px)] bg-gray-50 pt-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg h-full flex flex-col">
        <div className="px-8 pb-6 flex flex-col gap-6 flex-grow overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2 mt-6">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {t("transactionHistory.mainTitle") || "Transaction History"}
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
              <CardHeader className="flex justify-between pb-1">
                <CardTitle className="text-sm text-gray-600">
                  {t("transactionHistory.walletBalanceLabel") ||
                    "Wallet Balance"}
                </CardTitle>
                <Wallet className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{walletBalance.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("transactionHistory.walletBalanceDescription") ||
                    "Current available balance"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm text-gray-600">
                  {t("transactionHistory.totalCreditedLabel") ||
                    "Total Credited"}
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{totalCredit.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("transactionHistory.totalCreditedDescription") ||
                    "Total money received"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white">
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm text-gray-600">
                  {t("transactionHistory.totalDebitedLabel") || "Total Debited"}
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{totalDebit.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("transactionHistory.totalDebitedDescription") ||
                    "Total money sent"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center gap-4">
            <Button
              variant="success"
              onClick={handleAddMoney}
              className="flex items-center gap-2 px-6 py-3 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              {t("transactionHistory.addMoneyButton") || "Add Money"}
            </Button>
            <Button
              variant="outline"
              onClick={handleWithdrawMoney}
              className="flex items-center gap-2 px-6 py-3 text-base font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 bg-transparent"
            >
              <Minus className="h-5 w-5" />
              {t("transactionHistory.withdrawMoneyButton") || "Withdraw Money"}
            </Button>
          </div>

          {/* Transactions List */}
          <div className="max-h-[600px] overflow-y-auto pr-1 -mt-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex justify-between items-center border-b border-gray-100 mb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  {t("transactionHistory.mainTitle") || "Transaction History"}
                </CardTitle>
                <span className="inline-block bg-gradient-to-r from-green-400 to-lime-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                  {txns.length}{" "}
                  {t("transactionHistory.transactionsCount") || "transactions"}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {txns.map((t, idx) => (
                    <div
                      key={t.transactionId}
                      className="p-6 hover:bg-gray-100 transition-all duration-200"
                    >
                      <div className="flex justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          <div
                            className={`p-3 rounded-full flex-shrink-0 ${
                              t.direction === "credit"
                                ? "bg-green-100 text-green-600 ring-2 ring-green-200"
                                : "bg-red-100 text-red-600 ring-2 ring-red-200"
                            }`}
                          >
                            {t.direction === "credit" ? (
                              <ArrowDownCircle className="h-5 w-5" />
                            ) : (
                              <ArrowUpCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-base text-gray-900">
                                {t.direction === "credit"
                                  ? t("transactionHistory.direction.credit") ||
                                    "Money Received"
                                  : t("transactionHistory.direction.debit") ||
                                    "Money Sent"}
                              </h3>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600"
                              >
                                #{idx + 1}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {t.direction === "credit"
                                  ? t("transactionHistory.fromLabel") || "From:"
                                  : t("transactionHistory.toLabel") || "To:"}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {typeof t.counterparty === "object" &&
                                t.counterparty?.username
                                  ? t.counterparty.username[i18n.language] ||
                                    t.counterparty.username.en
                                  : t.counterparty || "Unknown User"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono text-xs">
                                  {t.transactionId}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(t.createdAt).toLocaleDateString(
                                    i18n.language === "az"
                                      ? "az-AZ"
                                      : i18n.language === "ru"
                                      ? "ru-RU"
                                      : "en-GB",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div
                            className={`text-xl font-bold ${
                              t.direction === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {t.direction === "credit" ? "+" : "-"}₹
                            {t.amount.toFixed(2)}
                          </div>
                          <div className="flex justify-end">
                            <Badge
                              variant={
                                t.status === "completed"
                                  ? "success"
                                  : t.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                t.status === "completed"
                                  ? "bg-green-500 text-white shadow-sm"
                                  : t.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {t.status.charAt(0).toUpperCase() +
                                t.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {t.direction === "credit"
                              ? t("transactionHistory.creditTransaction") ||
                                "Credit Transaction"
                              : t("transactionHistory.debitTransaction") ||
                                "Debit Transaction"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                        <div className="flex gap-4">
                          <span>
                            {t("transactionHistory.transactionIdLabel") ||
                              "Transaction ID"}
                            :{" "}
                            <span className="font-mono">
                              {t.transactionId.slice(-12)}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            {t.direction === "credit"
                              ? t("transactionHistory.creditedToWallet") ||
                                "Credited to your wallet"
                              : t("transactionHistory.debitedFromWallet") ||
                                "Debited from your wallet"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              t.status === "completed"
                                ? "bg-green-500"
                                : t.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="capitalize font-medium">
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
