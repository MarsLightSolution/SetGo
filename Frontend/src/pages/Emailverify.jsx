import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EmailVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await axios.post('http://localhost:8080/verifyemail', { token });
        if (res.status === 200 || res.status === 201) {
          navigate("/postcard1");
        } else {
          setMessage("Verification failed.");
        }
      } catch (err) {
        setMessage("Verification failed or token expired.");
        console.error("Verification error:", err);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div>
      <h2>{message}</h2>
    </div>
  );
}

export default EmailVerify;