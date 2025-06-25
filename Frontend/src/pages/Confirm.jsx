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
      // Pass email as state to /pverify route
      navigate("/pverify", { state: { email } });
    }
  }, [params, navigate]);

  return (
    <div>
      {isVerified ? (
        "Redirecting..."
      ) : (
        <p>
          Please check your email and click the verification link to continue.
        </p>
      )}
    </div>
  );
}

export default Confirm;
