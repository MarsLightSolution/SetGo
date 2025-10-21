import React, { useState } from "react";
import Chatbot from "../../chatbot.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 active:scale-95 z-50 flex items-center gap-3 cursor-pointer"
      >
        <MessageCircle size={24} className="text-white" />
        <span className="font-semibold tracking-wide text-[17px] hidden sm:inline font-[Poppins]">
          Chat with us
        </span>
      </button>

      {/* Chatbot Overlay with Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative w-[90%] sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[60%] h-[85%] overflow-hidden"
            >
              {/* Chatbot Content with onClose handler */}
              <Chatbot onClose={() => setIsOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { ChatbotButton };
