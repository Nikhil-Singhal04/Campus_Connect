const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `You are Campus Connect AI Assistant.

Your role is to help students and admins use the Campus Connect platform correctly.

About Platform:
Campus Connect is a college platform where students can:
- create accounts
- login securely
- browse campus events
- register for events
- join student communities
- use ConnectX (a campus-wide social feed to create posts, view updates, like posts, and write comments)
- manage profiles
- receive notifications

Admins can:
- approve or reject events
- manage users
- monitor activities

Instructions:
1. Answer only the user's exact question about Campus Connect.
1b. If backend provides event data, use it to answer questions about specific months, past events, or upcoming events. Do not invent events.
2. Keep responses short, direct, and structured as bullet points. Do not write paragraphs.
3. Do not invent features or UI elements.
4. If unsure, say you are not sure and suggest contacting admin in a bullet point.
5. Format every response using bullet points (or numbered lists for sequential steps) to make it look neat, clear, and easy to read.
6. Never expose technical backend details or API keys.
7. Be polite and professional.
8. Help users navigate the platform using only known features.
9. If the user greets you, respond using bullet points (e.g., "* Hello! \n * How can I help you with Campus Connect today?").
10. If the question is unrelated, politely redirect to Campus Connect topics using bullet points.
11. When asked how to register for an event, explain these steps:
    1. Go to the Dashboard.
    2. Find the desired event and click the "Register" button.
    3. Fill in any required registration details.
    4. Click the "Verify Payment & Register" (or "Register") button to complete your registration.`;


function createGeminiModel(modelName, eventsListText = "") {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const client = new GoogleGenerativeAI(apiKey);
  const systemInstructionText = SYSTEM_PROMPT + (eventsListText ? `\n\nReal-time Event Data from database:\n${eventsListText}` : "");
  return client.getGenerativeModel({
    model: modelName,
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstructionText }]
    }
  });
}

function getPrimaryModel(eventsListText = "") {
  return createGeminiModel("gemini-3.5-flash", eventsListText);
}

function getFallbackModel(eventsListText = "") {
  return createGeminiModel("gemini-2.5-flash", eventsListText);
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  const normalized = history
    .map((item) => {
      const role = String(item?.role || "").toLowerCase() === "assistant" ? "model" : "user";
      const content = String(item?.content || item?.text || "").trim();
      if (!content) return null;

      return {
        role,
        parts: [{ text: content }]
      };
    })
    .filter(Boolean);

  // Gemini chat requires the first message to be from the user.
  while (normalized.length && normalized[0].role !== "user") {
    normalized.shift();
  }

  return normalized;
}

async function generateChatReply(message, history = [], eventsListText = "") {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    const error = new Error("Message is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedHistory = normalizeHistory(history);

  try {
    const model = getPrimaryModel(eventsListText);
    const chat = model.startChat({ history: normalizedHistory });
    const result = await chat.sendMessage(trimmed);
    const response = result?.response;
    return response?.text() || "";
  } catch (error) {
    const status = error?.status || error?.statusCode;
    const messageText = String(error?.message || "");
    const isNotFound = status === 404 || messageText.includes("not found");

    if (!isNotFound) {
      throw error;
    }

    const fallbackModel = getFallbackModel(eventsListText);
    const fallbackChat = fallbackModel.startChat({ history: normalizedHistory });
    const fallbackResult = await fallbackChat.sendMessage(trimmed);
    const fallbackResponse = fallbackResult?.response;
    return fallbackResponse?.text() || "";
  }
}

module.exports = {
  generateChatReply
};
