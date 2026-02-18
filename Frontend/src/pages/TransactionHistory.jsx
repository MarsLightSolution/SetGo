"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Hash,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";

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
          `${import.meta.env.VITE_SERVER}/users/${userId}/transactions`,
          { credentials: "include" }
        );
        const json = await res.json();
        const { transactions, walletBalance, totalCredit, totalDebit } =
          json.data || {};

        setTxns(transactions || []);
        setWalletBalance(walletBalance || 0);
        setTotalCredit(totalCredit || 0);
        setTotalDebit(totalDebit || 0);
      } catch (err) {
        console.error(
          t("transactionHistory.failedToFetchTransactions"),
          err
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [user, forcedUserId, t]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 text-lg">
            {t("transactionHistory.loadingTransactions")}
          </p>
        </div>
      </div>
    );

  if (txns.length === 0)
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-white max-w-5xl w-full rounded-2xl shadow-lg p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">
              {t("transactionHistory.emptyState")}
            </h3>
            <p className="text-gray-500">
              {t(
                "transactionHistory.emptyMessage",
                "Your transaction history will appear here once you start making transactions."
              )}
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-grow flex justify-center py-10">
        <div className="bg-white max-w-5xl w-full rounded-2xl shadow-lg p-8 flex flex-col">
          {/* Heading */}
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-3xl font-bold text-gray-800">
              {t("transactionHistory.mainTitle")}
            </h1>
            <p className="text-gray-500">
              {t(
                "transactionHistory.subtitle",
                "Track your financial activity and wallet balance"
              )}
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance */}
            <div className="bg-gray-50 rounded-xl shadow p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-500 truncate mr-2">
                  {t("transactionHistory.walletBalanceLabel")}
                </h2>
                <Wallet className="h-5 w-5 text-green-600 flex-shrink-0" />
              </div>
              <div className="text-2xl font-bold text-green-700 truncate">
                ₼ {walletBalance.toFixed(2)}
              </div>
            </div>

            {/* Total Credit */}
            <div className="bg-green-50 rounded-xl shadow p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-500 truncate mr-2">
                  {t("transactionHistory.totalCreditedLabel")}
                </h2>
                <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
              </div>
              <div className="text-2xl font-bold text-green-700 truncate">
                ₼ {totalCredit.toFixed(2)}
              </div>
            </div>

            {/* Total Debit */}
            <div className="bg-red-50 rounded-xl shadow p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-500 truncate mr-2">
                  {t("transactionHistory.totalDebitedLabel")}
                </h2>
                <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
              </div>
              <div className="text-2xl font-bold text-red-700 truncate">
                ₼ {totalDebit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mb-10">
  <button className="w-40 bg-lime-500 hover:bg-lime-600 text-white py-3 rounded-full font-medium transition">
    {t("transactionHistory.addMoney", { defaultValue: "Add Money" })}
  </button>
  <button className="w-40 bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-medium transition">
    {t("transactionHistory.withdrawMoney", { defaultValue: "Withdraw Money" })}
  </button>
</div>


         {/* Table */}
<div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10">
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-left border-collapse">
      {/* Header */}
      <thead className="bg-gray-100 text-gray-700 sticky top-0">
        <tr>
          <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              {t("transactionHistory.tableHeader.hash")}
            </div>
          </th>
          <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("transactionHistory.tableHeader.amount")}
            </div>
          </th>
          <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("transactionHistory.tableHeader.direction")}
            </div>
          </th>
          {/* <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("transactionHistory.tableHeader.counterparty")}
            </div>
          </th> */}
          <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("transactionHistory.tableHeader.status")}
            </div>
          </th>
          <th className="px-6 py-3 font-semibold border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("transactionHistory.tableHeader.date")}
            </div>
          </th>
          <th className="px-6 py-3 font-semibold border-b">
            {t("transactionHistory.tableHeader.transactionId")}
          </th>
        </tr>
      </thead>

      {/* Body */}
      <tbody>
        {txns.map((txn, idx) => (
          <tr
            key={txn.transactionId}
            className={`transition hover:bg-gray-50 ${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
            }`}
          >
            <td className="px-6 py-3 font-medium">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-semibold">
                {idx + 1}
              </div>
            </td>
            <td className="px-6 py-3 font-bold text-gray-800">
              ₼ {txn.amount.toFixed(2)}
            </td>
            <td className="px-6 py-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  txn.direction.toLowerCase() === "credit"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {txn.direction.toUpperCase() === "CREDIT"
                  ? t("transactionHistory.direction.credit")
                  : t("transactionHistory.direction.debit")}
              </span>
            </td>
            {/* <td className="px-6 py-3 text-gray-600">
              {typeof txn.counterparty === "object" &&
              txn.counterparty?.username
                ? txn.counterparty.username[i18n.language] ||
                  txn.counterparty.username.en
                : "—"}
            </td> */}
           <td className="px-6 py-3">
  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
    {t(`${txn.status}`)}
  </span>
</td>

            <td className="px-6 py-3 text-gray-500">
              {new Date(txn.createdAt).toLocaleString(
                i18n.language === "az"
                  ? "az-AZ"
                  : i18n.language === "ru"
                  ? "ru-RU"
                  : "en-GB"
              )}
            </td>
            <td className="px-6 py-3 font-mono text-xs text-gray-400 max-w-[150px] truncate">
              {txn.transactionId}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
