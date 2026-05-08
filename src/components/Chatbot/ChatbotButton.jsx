import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

/**
 * Fixed-position FAB that toggles the chat window.
 *
 * @param {{
 *   issData: object,
 *   newsArticles: Array
 * }} props — forwarded to ChatWindow
 */
const ChatbotButton = ({ issData, newsArticles }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ---- Chat panel ---- */}
      <div
        className={`fixed bottom-20 right-6 w-[380px] h-[500px] z-50 transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChatWindow
          issData={issData}
          newsArticles={newsArticles}
          onClose={() => setIsOpen(false)}
        />
      </div>

      {/* ---- FAB ---- */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-2xl shadow-lg shadow-cyan-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
};

export default ChatbotButton;
