import { randomUUID } from "node:crypto";
import { URLSearchParams } from "node:url";
import { RequestHandler } from "express";
import { LoginRequest, LoginResponse } from "@shared/api";

const sessions = new Map<string, string>();

export const handleLogin: RequestHandler = (req, res) => {
  const body = req.body as Partial<LoginRequest>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  const token = randomUUID();
  sessions.set(token, email);
  const response: LoginResponse = { token, user: { email } };
  res.status(200).json(response);
};

export const handleForgotPassword: RequestHandler = (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    res.status(400).json({ message: "Enter your email address first." });
    return;
  }
  res.status(200).json({ message: "If an account exists for that email, reset instructions are ready to be sent." });
};

export const handleGoogleStart: RequestHandler = (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    res.status(503).json({ message: "Google sign-in is not configured yet." });
    return;
  }

  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "select_account" });
  res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
};

export const handleGoogleCallback: RequestHandler = async (req, res) => {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REDIRECT_URI: redirectUri, FRONTEND_URL: frontendUrl } = process.env;
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!clientId || !clientSecret || !redirectUri || !code) {
    res.redirect(`${frontendUrl ?? "http://localhost:8080"}/login?oauth=error`);
    return;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !tokens.access_token) throw new Error("Google token exchange failed");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = (await profileResponse.json()) as { email?: string };
    if (!profileResponse.ok || !profile.email) throw new Error("Google profile lookup failed");
    const sessionToken = randomUUID();
    sessions.set(sessionToken, profile.email.toLowerCase());
    res.setHeader("Set-Cookie", `alex_session_token=${sessionToken}; HttpOnly; SameSite=Lax; Path=/`);
    res.redirect(`${frontendUrl ?? "http://localhost:8080"}/questionnaire?oauth=success`);
  } catch {
    res.redirect(`${frontendUrl ?? "http://localhost:8080"}/login?oauth=error`);
  }
};

export const handleGuestLogin: RequestHandler = (_req, res) => {
  const email = `guest-${randomUUID().slice(0, 8)}@alex.local`;
  const token = randomUUID();
  sessions.set(token, email);
  const response: LoginResponse = { token, user: { email } };
  res.status(200).json(response);
};

export const getSessionEmail = (token: string | undefined) => (token ? sessions.get(token) : undefined);

export const getCookieSessionEmail = (cookieHeader: string | undefined) => {
  const token = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith("alex_session_token="))?.split("=")[1];
  return getSessionEmail(token);
};
