import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function Confirm() {
  const [params] = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifiedParam = params.get("verified");
    const email = params.get("email");
    const isTrue = verifiedParam === "true";
    setIsVerified(isTrue);

    if (isTrue && email) {
      navigate("/pverify", { state: { email } });
    }
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-[#f5f3f0] flex items-center justify-center px-4">
      <div className="bg-white max-w-lg w-full p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-green-600 mb-4">
          {isVerified ? "Redirecting..." : "Confirm Your Email"}
        </h2>

        {!isVerified && (
          <p className="text-gray-700 text-base">
            Please check your email and click the verification link to continue
            with your registration process.
          </p>
        )}

        {isVerified && (
          <p className="text-gray-600 italic">Hold tight, we’re verifying you!</p>
        )}
      </div>
    </div>
  );
}

export default Confirm;
