import React from 'react';
import EmailImage from "../../assets/images/post2.png";
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function EmailNotification() {
  const location = useLocation();
  const email = location.state?.email;

  const handleResendEmail = async () => {
    if (!email) {
      alert("No email provided.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/forgotpassword", { email });
      
      if (res.status === 200 || res.status === 201) {
        // Optionally navigate somewhere else:
        // navigate("/newpassword");
      } else {
        alert("Failed to resend email.");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      alert("An error occurred while resending the email.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Email</h1>

          <div className="text-center mb-8">
            <div className="w-80 h-64 mx-auto mb-6 flex items-center justify-center">
              <img
                src={EmailImage}
                alt="Email illustration with envelope and person"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-6 text-gray-900">
            <p className="text-base leading-relaxed">
              If there is a user account with this email address, we have sent you an email to <b>{email || "your email"}</b>. Please
              follow the link in the email to create a new password.
            </p>

            <div>
              <p className="font-medium mb-3 text-base">Can't find the email or didn't receive an email?</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Check your spam or junk mail folder.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Filter your received emails by the keywords "classifieds".</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-base">Have a new email sent to you</span>
                </li>
              </ul>
            </div>

            <p className="text-base">Further tips can be found on our help page.</p>

            <div className="text-center pt-4">
              <button
                onClick={handleResendEmail}
                className="bg-lime-400 text-green-800 hover:bg-green-800 hover:text-white px-8 py-3 rounded font-medium transition-colors"
              >
                Send new email
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