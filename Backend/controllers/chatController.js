const { all } = require("../db");
const { generateChatReply } = require("../services/geminiService");

const EVENT_KEYWORDS = [
  "event",
  "events",
  "workshop",
  "seminar",
  "hackathon",
  "coding",
  "cultural",
  "talk",
  "webinar",
  "meetup",
  "competition",
  "fest",
  "conference",
  "bootcamp",
  "training",
  "live"
];

const STOPWORDS = new Set([
  "is",
  "are",
  "there",
  "any",
  "going",
  "on",
  "happening",
  "today",
  "tomorrow",
  "current",
  "upcoming",
  "live",
  "event",
  "events",
  "the",
  "a",
  "an",
  "about",
  "please",
  "tell",
  "me",
  "of"
]);

function isEventQuery(message) {
  const text = String(message || "").toLowerCase();
  return EVENT_KEYWORDS.some((word) => text.includes(word));
}

function extractKeywords(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !STOPWORDS.has(word));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  const a = String(left || "");
  const b = String(right || "");
  if (!a || !b) return Math.max(a.length, b.length);

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function isNearMatch(keyword, target) {
  if (!keyword || !target) return false;
  if (keyword.length < 4 || target.length < 4) return false;

  const maxDistance = keyword.length >= 7 ? 2 : 1;
  return levenshteinDistance(keyword, target) <= maxDistance;
}

function isUpcoming(dateValue) {
  if (!dateValue) return true;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return true;
  const today = new Date();
  parsed.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

async function findMatchingEvents(message) {
  const keywords = extractKeywords(message);
  const events = await all(
    `SELECT id, title, event_type AS "eventType", department, date, time, location, description
     FROM events
     WHERE approval_status = 'Approved'
     ORDER BY created_at DESC`
  );

  const upcomingEvents = events.filter((event) => isUpcoming(event.date));

  if (!keywords.length) {
    return upcomingEvents.slice(0, 3);
  }

  const matches = upcomingEvents.filter((event) => {
    const fields = [
      event.title,
      event.description,
      event.eventType,
      event.department,
      event.location
    ];
    const haystack = fields.map((value) => String(value || "").toLowerCase()).join(" ");
    const tokens = fields.flatMap((value) => tokenize(value));

    return keywords.some((keyword) => {
      if (haystack.includes(keyword)) return true;
      return tokens.some((token) => isNearMatch(keyword, token));
    });
  });

  return matches.slice(0, 3);
}

async function handleChat(req, res) {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    if (isEventQuery(message)) {
      const events = await findMatchingEvents(message);

      if (!events.length) {
        return res.json({ reply: "No matching events are listed right now." });
      }

      const lines = events.map((event) =>
        `${event.title} - ${event.date || "TBA"} ${event.time || ""} (${event.location || "TBA"})`
          .trim()
      );

      return res.json({ reply: `Yes. ${lines.join(" | ")}` });
    }

    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const reply = await generateChatReply(message, history);

    if (!reply) {
      return res.status(502).json({ message: "No response received from assistant." });
    }

    return res.json({ reply });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Chat error:", error);
    return res.status(status).json({
      message:
        status === 503
          ? "Chat service is not configured."
          : "Could not generate a response right now."
    });
  }
}

module.exports = {
  handleChat
};
