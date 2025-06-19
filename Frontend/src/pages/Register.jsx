import React from "react";
import Footer from "../components/common/Footer";

const Register = () => {
  return (
    <>
    <div className="min-h-screen flex items-center text-black justify-center bg-[#f5f3f0]">
      <div className="w-full max-w-md bg-white px-6 py-8 rounded-md text-center">
        {/* Heading */}
        <h2 className="text-lg text-black font-semibold mb-4">Register in 30 seconds</h2>
        <hr className="mb-6 border-t text-black border-gray-300" />

        {/* Login details */}
        <div className="text-left mb-4">
          <p className="font-semibold mb-2">Your Login Details</p>
          <input
            type="text"
            placeholder="Username"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            placeholder="E-mail"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <label className="flex items-start text-sm mt-1">
            <input type="checkbox" className="mr-2 mt-1" />
            <span>
              Yes, I look forward to regular email updates from the group – you
              can unsubscribe at any time
            </span>
          </label>
        </div>

        {/* Register button */}
        <button className="hover:bg-[#B5E941] bg-lime-500 text-white font-semibold py-2 px-4 rounded-full w-full mt-4 transition-all">
          Register for free
        </button>

        {/* Footer info */}
        <p className="text-xs text-gray-600 mt-4">
          Our <span className="text-green-700">terms of use</span> apply.
          Information on how we process your data can be found in our{" "}
          <span className="text-green-700">privacy policy</span>.
        </p>
      </div>
    </div>
    <Footer/>
</>
);
};

export default Register;
