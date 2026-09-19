// src/components/AIChat.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
};

const getSessionId = () => {
  let sessionId = localStorage.getItem("haip_ai_session_id");
  if (!sessionId) {
    sessionId =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("haip_ai_session_id", sessionId);
  }
  return sessionId;
};

/* ----------------------------------------------------------------
   Inline markdown: **bold**, *italic*
   ---------------------------------------------------------------- */
const renderInline = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

/* ----------------------------------------------------------------
   Block renderer: bullet lists, blank lines, plain lines
   ---------------------------------------------------------------- */
const renderMessageContent = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let currentList = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ");

    if (isBullet) {
      if (!currentList) {
        currentList = [];
        blocks.push({ type: "list", items: currentList });
      }
      currentList.push(trimmed.slice(2));
    } else {
      currentList = null;
      if (trimmed === "") {
        blocks.push({ type: "break" });
      } else {
        blocks.push({ type: "line", text: line });
      }
    }
  });

  return blocks.map((block, i) => {
    if (block.type === "list") {
      return (
        <ul className="ai-chat-list" key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    if (block.type === "break") {
      return <br key={i} />;
    }
    return (
      <React.Fragment key={i}>
        {renderInline(block.text)}
        {i < blocks.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const TYPING_CHARS_PER_TICK = 2;
const TYPING_INTERVAL_MS = 12;

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      displayText: "Hello! I'm your AI assistant. How can I help you today?",
      image: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef(getSessionId());
  const messagesContainerRef = useRef(null);

  /* ----------------------------------------------------------------
     Smooth-scroll on new messages / typewriter updates, only while open
     ---------------------------------------------------------------- */
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !isOpen) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  /* ----------------------------------------------------------------
     Instant jump to bottom the moment the chat window is opened
     ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [isOpen]);

  /* ----------------------------------------------------------------
     Typewriter reveal — runs for every bot message, including those
     with images. The image appears once displayText === text.
     Long answers speed up so users don't wait too long.
     ---------------------------------------------------------------- */
  useEffect(() => {
    const lastIndex = messages.length - 1;
    const last = messages[lastIndex];
    if (!last || last.type !== "bot") return;
    if (last.displayText === last.text) return;

    const timer = setTimeout(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const msg = { ...updated[lastIndex] };
        const charsPerTick = msg.text.length > 200 ? 4 : TYPING_CHARS_PER_TICK;
        const nextLength = Math.min(
          msg.displayText.length + charsPerTick,
          msg.text.length
        );
        msg.displayText = msg.text.slice(0, nextLength);
        updated[lastIndex] = msg;
        return updated;
      });
    }, TYPING_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [messages]);

  /* ----------------------------------------------------------------
     Init: register session and pull history
     ---------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function initChat() {
      try {
        await fetch(`${API_BASE}/api/client/ai-chat/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ session_id: sessionIdRef.current }),
        });

        const res = await fetch(
          `${API_BASE}/api/client/ai-chat/history/${sessionIdRef.current}`,
          { credentials: "include" }
        );
        const json = await res.json();

        if (!cancelled && json.success && json.data.length) {
          setMessages(
            json.data.map((m) => ({
              type: m.sender,
              text: m.message,
              displayText: m.message,
              image: m.image_url || null,
            }))
          );
        }
      } catch (err) {
        console.error("AI chat init error:", err);
      }
    }

    initChat();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------------------------------
     Send a message
     ---------------------------------------------------------------- */
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setMessages((prev) => [
      ...prev,
      { type: "user", text: userText, displayText: userText, image: null },
    ]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/client/ai-chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          message: userText,
        }),
      });
      const json = await res.json();

      const botText = json.success
        ? json.data.text
        : "Sorry, something went wrong. Please try again.";
      const botImage = json.success ? json.data.image_url : null;

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: botText, displayText: "", image: botImage },
      ]);
    } catch (err) {
      console.error("AI chat message error:", err);
      const fallback = "Sorry, I couldn't reach the server. Please try again.";
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: fallback, displayText: "", image: null },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        className={`ai-chat-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="AI Chat Assistant"
      >
        <span className="ai-chat-button-icon">
          {isOpen ? (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect x="4" y="8" width="16" height="12" rx="5" fill="#FFFFFF" />
              <rect x="2" y="12" width="2.5" height="5" rx="1.25" fill="#FFFFFF" />
              <rect x="19.5" y="12" width="2.5" height="5" rx="1.25" fill="#FFFFFF" />
              <circle cx="9" cy="14" r="2" fill="#893C87" />
              <circle cx="15" cy="14" r="2" fill="#893C87" />
              <rect x="10.25" y="17.5" width="3.5" height="1.4" rx="0.7" fill="#893C87" />
              <line x1="12" y1="8" x2="12" y2="4.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="3.5" r="1.8" fill="#FFFFFF" />
            </svg>
          )}
        </span>
        <span className="ai-chat-button-badge">AI</span>
      </button>

      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  />
                </svg>
              </div>
              <div>
                <span className="ai-chat-title">AI Assistant</span>
                <span className="ai-chat-status">Online</span>
              </div>
            </div>
            <button className="ai-chat-minimize" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
          </div>

          <div className="ai-chat-messages" ref={messagesContainerRef}>
            {messages.map((msg, index) => {
              const isFullyRevealed = msg.displayText === msg.text;
              const showCaret = msg.type === "bot" && !isFullyRevealed;
              const showImage =
                msg.type === "bot" && msg.image && isFullyRevealed;

              return (
                <div key={index} className={`ai-chat-message ${msg.type}`}>
                  <div className="ai-chat-bubble">
                    {msg.type === "bot" && (
                      <span className="ai-chat-bot-icon">🤖</span>
                    )}
                    <span className="ai-chat-bubble-content">
                      {renderMessageContent(msg.displayText)}
                      {showCaret && <span className="ai-chat-caret">|</span>}

                      {showImage && (
                        <a
                          href={resolveImage(msg.image)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ai-chat-image-link"
                        >
                          <img
                            src={resolveImage(msg.image)}
                            alt=""
                            className="ai-chat-bubble-image"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </a>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="ai-chat-message bot">
                <div className="ai-chat-bubble ai-chat-typing">
                  <span className="ai-chat-bot-icon">🤖</span>
                  <span className="typing-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ===== Floating button ===== */
        .ai-chat-button {
          position: fixed !important;
          bottom: 30px !important;
          right: 30px !important;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A855F7, #893C87);
          color: #FFFFFF;
          border: 3px solid #7C3AED;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 4px rgba(124, 58, 237, 0.2),
            0 8px 32px rgba(124, 58, 237, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2147483000 !important;
        }

        .ai-chat-button:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow:
            0 0 0 4px rgba(124, 58, 237, 0.3),
            0 12px 40px rgba(124, 58, 237, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.15);
        }

        .ai-chat-button:active { transform: scale(0.95); }

        .ai-chat-button.active {
          background: linear-gradient(135deg, #c62828, #b71c1c);
          border-color: #d32f2f;
          box-shadow:
            0 0 0 4px rgba(198, 40, 40, 0.2),
            0 8px 32px rgba(198, 40, 40, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
        }

        .ai-chat-button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-chat-button-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #FFB800, #FF8C00);
          color: #1a1a1a;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 6px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(255, 184, 0, 0.3);
          line-height: 1;
          letter-spacing: 0.5px;
        }

        .ai-chat-button.active .ai-chat-button-badge { display: none; }

        /* ===== Chat window ===== */
        .ai-chat-window {
          position: fixed !important;
          bottom: 110px !important;
          right: 30px !important;
          width: 380px;
          height: 520px;
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 2147483000 !important;
          animation: aiChatSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #E1D9E0;
        }

        @keyframes aiChatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ai-chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          flex-shrink: 0;
        }

        .ai-chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-chat-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-chat-avatar svg {
          width: 20px;
          height: 20px;
          color: #FFFFFF;
        }

        .ai-chat-title {
          font-weight: 600;
          font-size: 15px;
          display: block;
          line-height: 1.2;
        }

        .ai-chat-status {
          font-size: 11px;
          opacity: 0.8;
          display: block;
          line-height: 1.2;
        }

        .ai-chat-minimize {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #FFFFFF;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .ai-chat-minimize:hover { background: rgba(255, 255, 255, 0.25); }

        .ai-chat-messages {
          flex: 1;
          padding: 16px 20px;
          overflow-y: auto;
          background: #FBF9FA;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scroll-behavior: smooth;
        }

        .ai-chat-messages::-webkit-scrollbar { width: 4px; }
        .ai-chat-messages::-webkit-scrollbar-thumb {
          background: #E1D9E0;
          border-radius: 2px;
        }

        .ai-chat-message { display: flex; width: 100%; }
        .ai-chat-message.user { justify-content: flex-end; }
        .ai-chat-message.bot  { justify-content: flex-start; }

        .ai-chat-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .ai-chat-bubble-content {
          flex: 1;
          min-width: 0;
        }

        .ai-chat-message.user .ai-chat-bubble {
          background: #893C87;
          color: #FFFFFF;
          border-bottom-right-radius: 4px;
        }

        .ai-chat-message.bot .ai-chat-bubble {
          background: #FFFFFF;
          color: #241F24;
          border-bottom-left-radius: 4px;
          border: 1px solid #E1D9E0;
        }

        .ai-chat-bot-icon {
          flex-shrink: 0;
          font-size: 18px;
        }

        .ai-chat-list {
          margin: 6px 0 2px;
          padding-left: 18px;
        }

        .ai-chat-list li { margin-bottom: 4px; }
        .ai-chat-list li:last-child { margin-bottom: 0; }

        .ai-chat-caret {
          display: inline-block;
          margin-left: 2px;
          animation: caretBlink 0.8s steps(1) infinite;
          color: #893C87;
          font-weight: 700;
        }

        @keyframes caretBlink {
          0%, 50%   { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }

        /* ===== Images ===== */
        .ai-chat-image-link {
          display: block;
          margin-top: 10px;
          cursor: zoom-in;
          text-decoration: none;
        }

        .ai-chat-bubble-image {
          display: block;
          width: 100%;
          max-width: 260px;
          border-radius: 8px;
          border: 1px solid #E1D9E0;
          background: #F3EAF2;
          transition: transform 0.15s ease;
          animation: aiChatImageFadeIn 0.35s ease-out;
        }

        @keyframes aiChatImageFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ai-chat-image-link:hover .ai-chat-bubble-image {
          transform: scale(1.02);
        }

        /* ===== Typing indicator ===== */
        .ai-chat-typing {
          background: #FFFFFF !important;
          border: 1px solid #E1D9E0 !important;
          min-width: 60px;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 2px 0;
        }

        .typing-dots span {
          animation: typingDot 1.4s infinite;
          font-size: 20px;
          line-height: 1;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
          30%           { opacity: 1; transform: translateY(-4px); }
        }

        /* ===== Input row ===== */
        .ai-chat-input {
          display: flex;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid #E1D9E0;
          background: #FFFFFF;
          flex-shrink: 0;
        }

        .ai-chat-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s ease;
          outline: none;
          background: #FFFFFF;
          color: #241F24;
        }

        .ai-chat-input input:focus {
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }

        .ai-chat-input input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-chat-input button {
          padding: 10px 14px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .ai-chat-input button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(137, 60, 135, 0.3);
        }

        .ai-chat-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .ai-chat-input button svg { width: 20px; height: 20px; }

        /* ===== Responsive ===== */
        @media (max-width: 480px) {
          .ai-chat-window {
            width: calc(100% - 32px);
            right: 16px !important;
            bottom: 100px !important;
            height: 460px;
            border-radius: 12px;
          }
          .ai-chat-button {
            width: 56px;
            height: 56px;
            bottom: 20px !important;
            right: 20px !important;
          }
          .ai-chat-bubble-image { max-width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-chat-window { animation: none; }
          .ai-chat-caret  { animation: none; }
          .ai-chat-bubble-image { animation: none; }
          .ai-chat-messages { scroll-behavior: auto; }
        }
      `}</style>
    </>
  );
};

export default AIChat;