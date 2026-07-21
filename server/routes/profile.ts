import { RequestHandler } from "express";
import { ProfileRequest, ProfileResponse } from "@shared/api";
import { getCookieSessionEmail, getSessionEmail } from "./auth";

const profiles = new Map<string, ProfileRequest>();

export const handleProfile: RequestHandler = (req, res) => {
  const body = req.body as Partial<ProfileRequest>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = Number(body.age);
  const experience = typeof body.experience === "string" ? body.experience.trim() : "";
  const hardestPart = typeof body.hardestPart === "string" ? body.hardestPart.trim() : "";
  const support = typeof body.support === "string" ? body.support.trim() : "";

  if (name.length < 2 || age < 13 || age > 120 || !experience || !hardestPart || !support) {
    res.status(400).json({ message: "Please complete every questionnaire field." });
    return;
  }

  const profile: ProfileRequest = { name, age, experience, hardestPart, support };
  const email = getSessionEmail(req.header("authorization")?.replace("Bearer ", "")) ?? getCookieSessionEmail(req.header("cookie"));
  profiles.set(email ?? `guest:${name.toLowerCase()}`, profile);
  const response: ProfileResponse = { profile, onboardingComplete: true };
  res.status(200).json(response);
};
