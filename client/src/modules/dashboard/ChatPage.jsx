import { Notice, PageHeading } from "../../components/ui/ProductUi";
import { FiArrowUpRight, FiShield } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiSend, FiUser, FiCpu } from "react-icons/fi";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! I'm your Adaptive Finance AI. Ask me anything about your income history, health score, or how much you should save.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Why did my health score drop?",
    "Based on my last 30 days, how much should I save this week?",
    "What's my highest earning platform recently?",
    "Am I safe to make a large purchase right now?",
  ];

  const scrollToBottom = () => {
    const container = messagesEndRef.current?.parentElement;
    container?.scrollTo({
      top: container.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Oops! I had trouble fetching that info. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simple bold markdown parser
  const renderMessageContent = (content) => {
    return content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="af-chat-page">
      <PageHeading
        eyebrow="A CONVERSATION WITH YOUR FINANCES"
        title={
          <>
            Your numbers.
            <br />
            <span>In plain language.</span>
          </>
        }
        description="Ask about your earnings, health score, or next steps. Get context from your financial picture."
      />
      <div className="af-chat-surface">
        <header className="af-chat-header">
          <span className="af-chat-agent-icon">
            <FiMessageSquare />
          </span>
          <div>
            <strong>Adaptive assistant</strong>
            <span>Financial context, made clearer.</span>
          </div>
          <span className="af-chat-context">
            <FiShield /> Your financial context
          </span>
        </header>
        <div
          className="af-chat-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                "af-chat-message " +
                (msg.role === "user"
                  ? "af-chat-message-user"
                  : "af-chat-message-assistant")
              }
            >
              <span className="af-chat-avatar" aria-hidden="true">
                {msg.role === "user" ? <FiUser /> : <FiCpu />}
              </span>
              <div className="af-chat-bubble">
                <span className="af-chat-message-label">
                  {msg.role === "user" ? "You" : "Adaptive"}
                </span>
                <p>{renderMessageContent(msg.content)}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="af-chat-thinking" role="status">
              <span className="af-chat-avatar">
                <FiCpu />
              </span>
              <span>
                Putting your picture into words
                <span className="af-thinking-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="af-chat-composer">
          {error && <Notice tone="error">{error}</Notice>}
          <details
            className="af-chat-prompts"
            key={messages.length === 1 ? "welcome" : "conversation"}
          >
            <summary>A place to start</summary>
            <div>
              {quickPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                >
                  {prompt}
                  <FiArrowUpRight />
                </button>
              ))}
            </div>
          </details>
          <form
            className="af-chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label className="af-sr-only" htmlFor="af-chat-input">
              Message your assistant
            </label>
            <input
              id="af-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your financial picture…"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="af-ui-button"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <FiSend />
              <span>Send</span>
            </button>
          </form>
          <p className="af-chat-disclaimer">
            A guide to understanding your finances. Verify important details
            before acting.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
