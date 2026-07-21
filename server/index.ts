import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleChat } from "./routes/chat";
import { handleForgotPassword, handleGoogleCallback, handleGoogleStart, handleGuestLogin, handleLogin } from "./routes/auth";
import { handleProfile } from "./routes/profile";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/chat", handleChat);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/forgot-password", handleForgotPassword);
  app.post("/api/auth/guest", handleGuestLogin);
  app.get("/api/auth/google", handleGoogleStart);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.post("/api/profile", handleProfile);

  return app;
}
