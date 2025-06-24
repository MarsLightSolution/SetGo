import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WaitVerify({ isVerified }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isVerified) {
      navigate('/postcard1');
    }
  }, [isVerified, navigate]); // Make sure to include isVerified in deps

  return (
    <div>
      {isVerified
        ? "Redirecting..."
        : "Please wait until your email gets verified..."}
    </div>
  );
}

export default WaitVerify;
