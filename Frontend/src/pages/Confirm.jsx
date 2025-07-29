import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import Footer from "../components/common/Footer";

import { useTranslation } from 'react-i18next';

function Confirm() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [params] = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifiedParam = params.get("verified");
    const email = params.get("email");
    const isTrue = verifiedParam === "true";
    setIsVerified(isTrue);

    if (isTrue && email) {
      setTimeout(() => {
        navigate("/pverify", { state: { email } });
      }, 2000);
    }
  }, [params, navigate]); // No 't' needed here if it's not used in the effect's logic

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-white">

      {/* Main Content */}
      <div className="flex-grow flex justify-center items-center px-4 py-">
        <div className="bg-white max-w-md w-full p-10 min-h-[250px] rounded-2xl shadow-2xl text-center transition-all duration-500">

          {isVerified ? (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">{t("confirm.redirectingTitle")}</h2> {/* Translated */}
              <p className="text-gray-600">{t("confirm.redirectingMessage")}</p> {/* Translated */}
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("confirm.title")}</h2> {/* Translated */}
              <p className="text-gray-600">
                {t("confirm.instructions")} {/* Translated */}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer at bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default Confirm;