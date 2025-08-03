import React from 'react';
import EmailImage from "../../assets/images/post2.png";
import { useLocation } from 'react-router-dom';
import axios from 'axios';

// i18n import
import { useTranslation } from 'react-i18next';

function EmailNotification() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const location = useLocation();
  const email = location.state?.email;

  const handleResendEmail = async () => {
    if (!email) {
      alert(t("emailNotification.noEmailProvided")); // Translated alert
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/forgotpassword", { email });

      if (res.status === 200 || res.status === 201) {
        alert(t("emailNotification.resendSuccess")); // Translated alert
      } else {
        alert(t("emailNotification.resendFailed")); // Translated alert
      }
    } catch (error) {
      console.error("Resend email error:", error);
      alert(t("emailNotification.resendError")); // Translated alert
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">{t("emailNotification.mainTitle")}</h1> {/* Translated */}

          <div className="text-center mb-8">
            <div className="w-80 h-64 mx-auto mb-6 flex items-center justify-center">
              <img
                src={EmailImage}
                alt={t("emailNotification.emailIllustrationAlt")}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-6 text-gray-900">
            <p className="text-base leading-relaxed">
              {t("emailNotification.instructions1", { email: email || t("emailNotification.yourEmail") })} {/* Translated with interpolation */}
            </p>

            <div>
              <p className="font-medium mb-3 text-base">{t("emailNotification.cantFindEmailTitle")}</p> {/* Translated */}
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">{t("emailNotification.tip1")}</span> {/* Translated */}
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">{t("emailNotification.tip2")}</span> {/* Translated */}
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">{t("emailNotification.tip3")}</span> {/* Translated */}
                </li>
              </ul>
            </div>

            <p className="text-base">{t("emailNotification.furtherTips")}</p> {/* Translated */}

            <div className="text-center pt-4">
              <button
                onClick={handleResendEmail}
                className="bg-lime-400 text-green-800 hover:bg-green-800 hover:text-white px-8 py-3 rounded font-medium transition-colors"
              >
                {t("emailNotification.sendNewEmailButton")} {/* Translated */}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer remains unchanged */}
    </div>
  );
}

export default EmailNotification;