const { useEffect, useMemo, useRef, useState } = React;

const CHATBOT_WELCOME =
  "Hi! I am your Campus Connect assistant. Ask me about events, registrations, profiles, or admin tasks.";

// Helper to render markdown-like bold (**text**)
function renderTextWithBold(text, isUser) {
  if (!text.includes('**')) return text;
  
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong 
          key={i} 
          className={`font-semibold ${isUser ? 'text-white' : 'text-[#111c2b] font-bold'}`}
        >
          {part}
        </strong>
      );
    }
    return part;
  });
}

// Helper to render clean structured lists and text blocks instead of raw markdown chars
function renderFormattedMessage(content, isUser) {
  if (!content) return null;
  
  const lines = content.split('\n');
  const textClass = isUser ? 'text-white' : 'text-[#1f3149]';
  const bulletColorClass = isUser ? 'bg-white' : 'bg-[#0ea596]';
  const subBulletColorClass = isUser ? 'bg-white/70' : 'bg-[#0ea596]/70';

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        // Detect if line is indented sub-bullet (starts with spaces and * or -)
        const isSubBullet = line.startsWith('  ') && (trimmed.startsWith('*') || trimmed.startsWith('-'));
        
        // Detect if line is a primary bullet (starts with * or -)
        const isPrimaryBullet = !line.startsWith('  ') && (trimmed.startsWith('*') || trimmed.startsWith('-'));
        
        // Detect numbered list (e.g., "1. item")
        const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)$/);

        if (isSubBullet) {
          const cleanText = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <div key={index} className={`pl-5 flex items-start gap-2 text-xs ${isUser ? 'text-white/90' : 'text-[#5f748a]'}`}>
              <span className={`mt-1.5 h-1 w-1 rounded-full ${subBulletColorClass} shrink-0`} />
              <span>{renderTextWithBold(cleanText, isUser)}</span>
            </div>
          );
        }

        if (isPrimaryBullet) {
          const cleanText = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <div key={index} className={`pl-1.5 flex items-start gap-2 text-sm ${textClass}`}>
              <span className={`mt-2 h-1.5 w-1.5 rounded-full ${bulletColorClass} shrink-0`} />
              <span className="flex-1">{renderTextWithBold(cleanText, isUser)}</span>
            </div>
          );
        }

        if (matchNumbered) {
          const num = matchNumbered[1];
          const cleanText = matchNumbered[2];
          return (
            <div key={index} className={`pl-1.5 flex items-start gap-2 text-sm ${textClass}`}>
              <span className={`font-semibold text-xs mt-0.5 shrink-0 ${isUser ? 'text-white' : 'text-[#0ea596]'}`}>{num}.</span>
              <span className="flex-1">{renderTextWithBold(cleanText, isUser)}</span>
            </div>
          );
        }

        // Default line
        return (
          <p key={index} className={`text-sm leading-relaxed ${textClass}`}>
            {renderTextWithBold(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: "welcome", role: "assistant", content: CHATBOT_WELCOME }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const trimmedInput = useMemo(() => input.trim(), [input]);

  useEffect(() => {
    if (!isOpen) return;

    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen]);

  function toggleChat() {
    setIsOpen((prev) => !prev);
  }

  async function sendMessage() {
    if (!trimmedInput || isLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmedInput
    };

    const historySnapshot = [...messages, userMessage]
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setErrorText("");
    setIsLoading(true);

    try {
      const response = await campusAPI.sendChatMessage(userMessage.content, historySnapshot);
      const replyText = String(response?.reply || "").trim();

      if (!replyText) {
        throw new Error("Assistant did not return a response.");
      }

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: replyText }
      ]);
    } catch (error) {
      setErrorText(error?.data?.message || error?.message || "Chat service is unavailable.");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I am having trouble right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {!isOpen && (
        <button
          type="button"
          onClick={toggleChat}
          aria-label="Open Campus Connect Assistant"
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#169f91,#36cfc0)] text-white shadow-[0_16px_28px_rgba(22,159,145,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
        >
          <span className="text-xl">💬</span>
        </button>
      )}

      {isOpen && (
        <div className="flex w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[#cfe0ee] bg-white shadow-[0_22px_48px_rgba(24,46,70,0.18)]">
          <div className="flex items-center justify-between bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Campus Connect</p>
              <p className="text-lg font-semibold">Assistant</p>
            </div>
            <button
              type="button"
              onClick={toggleChat}
              aria-label="Minimize assistant"
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-white/30"
            >
              Minimize
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[360px] flex-1 space-y-3 overflow-y-auto bg-[#f7fbff] px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-[#0e8f84] text-white"
                      : "bg-white text-[#1f3149] border border-[#e0ecf6]"
                  }`}
                >
                  {renderFormattedMessage(message.content, message.role === "user")}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-[#e0ecf6] bg-white px-4 py-2 text-sm text-[#1f3149] shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#0e8f84]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#0e8f84] [animation-delay:0.12s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#0e8f84] [animation-delay:0.24s]"></span>
                </div>
              </div>
            )}
          </div>

          {errorText && (
            <div className="border-t border-[#f4d2d8] bg-[#fdeef1] px-4 py-2 text-xs font-semibold text-[#c53c58]">
              {errorText}
            </div>
          )}

          <div className="border-t border-[#d7e5f1] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about events, registrations, or admin tasks..."
                rows={1}
                className="max-h-24 flex-1 resize-none rounded-xl border border-[#d6e4ef] bg-white px-3 py-2 text-sm text-[#1f3149] placeholder:text-[#7a8ea3] outline-none transition focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59630]"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!trimmedInput || isLoading}
                className="rounded-xl bg-[#0e8f84] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(14,143,132,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#8aa8a5]"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
