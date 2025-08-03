import React, { useEffect, useState } from "react";
import Footer from "../components/common/Footer";

import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Import i18n for language detection


const TransactionHistory = ({ forcedUserId }) => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) {
      try {
        setUser(stored);
      } catch (e) {
        console.error("Error parsing userData", e);
      }
    }
  }, []);

  useEffect(() => {
    const userId = user;
    if (!userId) {
      console.log(t("transactionHistory.noUserId")); // Translated
      return;
    } else console.log(userId);

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/users/${userId}/transactions`,
          {
            credentials: "include",
          }
        );
        const json = await res.json();
        const { transactions, walletBalance, totalCredit, totalDebit } = json.data || {};

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


  if (loading) return <p className="p-6 text-center">{t("transactionHistory.loadingTransactions")}</p>;
  if (txns.length === 0)
    return <p className="p-6 text-center">{t("transactionHistory.emptyState")}</p>; // Corrected key here

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">{t("transactionHistory.mainTitle")}</h1>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 p-4 rounded shadow">
          <p className="text-sm text-gray-600">{t("transactionHistory.walletBalanceLabel")}</p>
          <p className="text-xl font-bold text-green-700">₹ {walletBalance.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded shadow">
          <p className="text-sm text-gray-600">{t("transactionHistory.totalCreditedLabel")}</p>
          <p className="text-xl font-bold text-blue-700">₹ {totalCredit.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded shadow">
          <p className="text-sm text-gray-600">{t("transactionHistory.totalDebitedLabel")}</p>
          <p className="text-xl font-bold text-red-700">₹ {totalDebit.toFixed(2)}</p>
        </div>
       </div>

      <table className="min-w-full bg-white shadow rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.hash")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.amount")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.direction")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.counterparty")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.status")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.date")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("transactionHistory.tableHeader.transactionId")}</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((t, idx) => (
            <tr key={t.transactionId} className="border-b last:border-none hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
              <td className="py-3 px-4 font-semibold text-green-700">
                ₹ {t.amount.toFixed(2)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    t.direction === "credit"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t.direction.toUpperCase() === "CREDIT" ? t("transactionHistory.direction.credit") : t("transactionHistory.direction.debit")}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {typeof t.counterparty === 'object' && t.counterparty?.username ? (
                    t.counterparty.username[i18n.language] || t.counterparty.username.en
                ) : (
                    "—"
                )}
              </td>
              <td className="py-3 px-4 text-gray-600 capitalize">
                {t(`transactionHistory.status.${t.status}`)}
              </td>
              <td className="py-3 px-4 text-gray-500">
                {new Date(t.createdAt).toLocaleString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-GB'))}
              </td>
              <td className="py-3 px-4 text-gray-600">{t.transactionId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;