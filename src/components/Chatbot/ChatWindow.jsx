import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STORAGE_KEY = 'chatHistory';
const MAX_MESSAGES = 30;

/**
 * Builds a system prompt grounding the model to only dashboard data.
 */
const buildSystemPrompt = (issData, newsArticles) => {
  const { position, speed, locationName, astronauts } = issData || {};
  const lat = position?.latitude?.toFixed(4) ?? 'N/A';
  const lng = position?.longitude?.toFixed(4) ?? 'N/A';
  const spd = speed ?? 'N/A';
  const loc = locationName ?? 'Unknown';
  const crewCount = astronauts?.length ?? 0;
  const crewList =
    astronauts?.map((a) => `${a.name} (${a.craft})`).join(', ') || 'N/A';

  const articleLines =
    newsArticles
      ?.slice(0, 10)
      .map(
        (a) =>
          `- ${a.title} (${typeof a.source === 'object' ? a.source?.name : a.source || 'Unknown'}): ${a.description || 'No description'}`,
      )
      .join('\n') || 'No articles available.';

  return `You are a dashboard assistant. ONLY answer using this data:

ISS: Lat ${lat}, Lng ${lng}, Speed ${spd} km/h, Location: ${loc}
Crew (${crewCount} people): ${crewList}

News:
${articleLines}

If the question is outside this data, reply: "I can only answer about the current ISS data and news articles on this dashboard."`;
};

/**
 * Loads chat history from localStorage.
 */
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Saves chat history to localStorage (last N messages).
 */
const saveHistory = (messages) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_MESSAGES)),
    );
  } catch {
    /* quota exceeded — silently ignore */
  }
};

/**
 * Full chat window with message list, input, typing indicator,
 * and Hugging Face Mistral-7B integration.
 */
const ChatWindow = ({ issData, newsArticles, onClose }) => {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Persist on change
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // ---- Send message ----------------------------------------------------
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = import.meta.env.VITE_HF_TOKEN;
      if (!token) throw new Error('VITE_HF_TOKEN is not set.');

      const systemPrompt = buildSystemPrompt(issData, newsArticles);
      
      // Build messages array for the router API
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: text },
      ];

      const payload = {
        model: 'openai/gpt-oss-20b:groq',
        messages: apiMessages,
        max_tokens: 300,
        temperature: 0.5,
      };

      const { data } = await axios.post(
        'https://router.huggingface.co/v1/chat/completions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let reply = '';
      if (data?.choices && data.choices[0]?.message?.content) {
        reply = data.choices[0].message.content.trim();
      } else {
        reply = 'Sorry, I could not generate a response.';
      }

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: reply, ts: Date.now() },
      ]);
    } catch (err) {
      console.error('[Chatbot]', err);
      const errMsg =
        err.response?.status === 503
          ? 'Model is loading, please try again in a few seconds.'
          : err.response?.status === 401
            ? 'Invalid API token. Check VITE_HF_TOKEN in your .env file.'
            : `Error: ${err.message}`;
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: errMsg, ts: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, issData, newsArticles, messages]);

  // ---- Key handler -----------------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- Clear chat ------------------------------------------------------
  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-950 border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
          🤖 Dashboard Assistant
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none cursor-pointer"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">
            Ask me about the ISS or today's news!
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-md'
                  : 'bg-gray-800 text-gray-200 rounded-bl-md'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full text-left text-sm border-collapse border border-gray-600" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead className="bg-gray-700/50" {...props} />,
                  th: ({ node, ...props }) => <th className="border border-gray-600 px-3 py-1.5 font-semibold" {...props} />,
                  td: ({ node, ...props }) => <td className="border border-gray-600 px-3 py-1.5" {...props} />,
                  a: ({ node, ...props }) => (
                    <a className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[0.85em]" {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ---- Input ---- */}
      <div className="px-4 py-3 bg-gray-900/90 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 bg-gray-800/80 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
