const { useEffect, useMemo, useRef, useState } = React;

const CHATBOT_WELCOME =
  "Hi! I am your Campus Connect assistant. Ask me about events, registrations, profiles, or admin tasks.";

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
                  className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-[#0e8f84] text-white"
                      : "bg-white text-[#1f3149] border border-[#e0ecf6]"
                  }`}
                >
                  {message.content}
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
