import React, { useState } from "react";
import Chatbot from "../../chatbot.jsx";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        💬 Chat
      </button>

      {/* Chatbot Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl h-[85%] overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-2 transition"
            >
              ✕
            </button>

            {/* Chatbot content */}
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
}
export { ChatbotButton };