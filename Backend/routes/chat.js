const express = require("express");
const { handleChat } = require("../controllers/chatController");

const router = express.Router();

// Chat endpoint
router.post("/", handleChat);

module.exports = router;
