import { useState, useEffect } from "react";
import { ChatContext } from "./chatContext";

export default function ChatProvider({ children }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat messages from localStorage", e);
      }
    }
    return [
      {
        role: "assistant",
        content:
          "Hi there! I'm your Finspire AI. Ask me anything about your income history, health score, or how much you should save.",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // This request can finish while another dashboard section is on screen.
  const handleSend = async (text) => {
    const messageText = text || input;
    if (loading || !messageText.trim()) return;
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
      if (!response.ok) throw new Error("Failed to get response");
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

  return (
    <ChatContext.Provider
      value={{ messages, input, setInput, loading, error, handleSend }}
    >
      {children}
    </ChatContext.Provider>
  );
}
