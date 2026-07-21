import { RequestHandler } from "express";
import { ChatRequest, ChatResponse } from "@shared/api";

export const handleChat: RequestHandler = (req, res) => {
  const body = req.body as Partial<ChatRequest>;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    res.status(400).json({ message: "A message is required." });
    return;
  }

  const lowerMessage = message.toLowerCase();
  let reply = "Thank you for sharing that with me. What feels most important about it right now?";

  if (lowerMessage.includes("overwhelmed") || lowerMessage.includes("stress")) {
    reply = "That sounds like a lot to carry. Would it help to slow down and name the one part that feels heaviest right now?";
  } else if (lowerMessage.includes("sad") || lowerMessage.includes("lonely")) {
    reply = "I’m glad you brought that here. You do not have to solve the whole feeling at once — what has today been like for you?";
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    reply = "Hi, I’m here with you. What would feel good to talk through today?";
  }

  const response: ChatResponse = { reply };
  res.status(200).json(response);
};
