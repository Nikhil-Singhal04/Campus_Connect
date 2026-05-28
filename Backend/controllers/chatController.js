const { all } = require("../db");
const { generateChatReply } = require("../services/geminiService");

async function handleChat(req, res) {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    // Fetch all approved events (both past and upcoming)
    const events = await all(
      `SELECT id, title, event_type AS "eventType", department, date, time, location, description
       FROM events
       WHERE approval_status = 'Approved'
       ORDER BY date ASC`
    );

    // Format events for the AI model, categorizing them as Past or Upcoming
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const eventsListText = events
      .map((event) => {
        let status = "Upcoming";
        if (event.date) {
          const eventDate = new Date(event.date);
          if (eventDate < today) {
            status = "Past";
          }
        }
        return `- Title: "${event.title}", Date: ${event.date || "TBA"}, Time: ${event.time || ""}, Location: ${event.location || "TBA"}, Type: ${event.eventType || ""}, Department: ${event.department || ""}, Description: ${event.description || ""}, Status: ${status}`;
      })
      .join("\n");

    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    
    // Pass today's date along with the events list for context
    const contextWithDate = `Today's Date is: ${todayStr}\n\n${eventsListText}`;
    
    const reply = await generateChatReply(message, history, contextWithDate);

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
