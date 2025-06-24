import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import WaitVerify from "./WaitVerify";

function Confirm() {
  const [params] = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifiedParam = params.get("verified");
    setIsVerified(verifiedParam === "true");
  }, [params]);

  return (
    <div>
      {/* Show WaitVerify always, it handles redirect inside */}
      <WaitVerify isVerified={isVerified} />

      {/* Show error only if verification failed */}
      {!isVerified && <h2>Verification Failed ❌</h2>}
    </div>
  );
}

export default Confirm;
