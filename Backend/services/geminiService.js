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
- manage profiles
- receive notifications

Admins can:
- approve or reject events
- manage users
- monitor activities

Instructions:
1. Answer only the user's exact question about Campus Connect.
1b. If backend provides event data, use it and do not invent events.
2. Keep responses short and direct (1-3 sentences).
3. Do not invent features or UI elements.
4. If unsure, say you are not sure and suggest contacting admin.
5. Avoid step-by-step lists unless the user explicitly asks for steps.
6. Never expose technical backend details or API keys.
7. Be polite and professional.
8. Help users navigate the platform using only known features.
9. If the user greets you, respond naturally.
10. If the question is unrelated, politely redirect to Campus Connect topics.`;

let cachedModel = null;
let cachedFallbackModel = null;

function createGeminiModel(modelName) {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: modelName,
    systemInstruction: {
      role: "system",
      parts: [{ text: SYSTEM_PROMPT }]
    }
  });
}

function getPrimaryModel() {
  if (!cachedModel) {
    cachedModel = createGeminiModel("gemini-3-flash-preview");
  }
  return cachedModel;
}

function getFallbackModel() {
  if (!cachedFallbackModel) {
    cachedFallbackModel = createGeminiModel("gemini-flash-latest");
  }
  return cachedFallbackModel;
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

async function generateChatReply(message, history = []) {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    const error = new Error("Message is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedHistory = normalizeHistory(history);

  try {
    const model = getPrimaryModel();
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

    const fallbackModel = getFallbackModel();
    const fallbackChat = fallbackModel.startChat({ history: normalizedHistory });
    const fallbackResult = await fallbackChat.sendMessage(trimmed);
    const fallbackResponse = fallbackResult?.response;
    return fallbackResponse?.text() || "";
  }
}

module.exports = {
  generateChatReply
};
