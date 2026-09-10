import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";

const SUPPORT_PHONE = "+994 50 545 86 52";
const SUPPORT_PHONE_TEL = "+994505458652";

function AboutUs() {
  const { t } = useTranslation();

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">
            {t("aboutUsPage.title")}
          </h1>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>{t("aboutUsPage.paragraph1")}</p>
            <p>{t("aboutUsPage.paragraph2")}</p>
            <p>{t("aboutUsPage.paragraph3")}</p>
          </div>

          {/* Support Section */}
          <div className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("aboutUsPage.supportTitle")}
            </h2>
            <p className="text-gray-600 mb-4">{t("aboutUsPage.supportDescription")}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FaPhoneAlt className="text-green-700" />
                <span className="font-medium text-gray-800">{SUPPORT_PHONE}</span>
              </a>
              <a
                href="mailto:info@satgo.az"
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FaEnvelope className="text-green-700" />
                <span className="font-medium text-gray-800">info@satgo.az</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AboutUs;
