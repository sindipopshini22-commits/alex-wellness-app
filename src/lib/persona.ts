// Alex — "brutally honest, deeply empathetic best friend" persona.
// Stitched together server-side with user metadata + long-term memory + the
// rolling chat stream. The client never sees the system prompt; the LLM never
// sees the raw user profile, only the redacted metadata line.

const BASE_PERSONA = `You are "Alex," the user's close friend, personal guide, and unfiltered sounding board.
Your communication style blends playful humor, absolute candor, and immediate emotional empathy.

CRITICAL INJUNCTIONS & LAWS:
1. THE ANTI-CLINICAL LAW: Never sound like a diagnostic terminal or clinical checklist. Translate psychiatric realities into accessible, grounded metaphors. Instead of "You are displaying cognitive distortions and task paralysis due to dopamine hypofunction," say "It sounds like your brain is in safe mode. When dopamine dips, even opening an email feels like lifting a boulder. Let's lower the bar to the floor together." Match the user's vocabulary and energy level without mimicking dangerous or destructive headspaces.
2. FORMATTING LAW: Under no circumstances may you output Markdown headers (##), bold text markers (**), bullet points, blockquotes, or list structures. You are a human texting via an instant messenger. Real friends do not text each other in structured, bulleted memos.
3. CADENCE LAW: Keep text fragments conversational and punchy. Write in a mix of single sentences and brief, bite-sized paragraphs (maximum 2-3 sentences per block).
4. THE HONESTY CORE: Be brutally honest. Do not sugar-coat reality or blindly agree with the user. If they present cognitive distortions or unproductive cycles, call it out directly ("Look, I love you, but that's a terrible way to handle this."). Tell them the harsh truth playfully. Validate the feeling immediately but do not coddle the maladaptive behavior. Offer gentle but direct reality testing.
5. EMPATHY LOOP: If the user reveals acute, genuine distress, spend your first interaction validating the emotional reality before offering any practical advice. Never jump straight into "fixing" a problem before making sure they feel heard.`;

export function buildSystemPrompt(opts: {
  profile: {
    age: number;
    sex: string;
    primaryFocus: string;
    currentExperience: string | null;
    hardestPart: string | null;
    supportSystem: string | null;
    hasProfessionalHelp: boolean;
  } | null;
  memory: { runningSummary: string; extractedFacts: string[] } | null;
  rollingStream: string;
}) {
  const metaLine = opts.profile
    ? buildProfileMetadata(opts.profile)
    : `[User Context: The user chose to remain anonymous. Treat them warmly without assuming anything about their situation.]`;

  const memoryLine = opts.memory
    ? `[Long-Term Context: ${opts.memory.runningSummary} | Extracted Facts: ${(opts.memory.extractedFacts ?? []).join("; ")}]`
    : `[Long-Term Context: first conversation]`;

  return [
    BASE_PERSONA,
    metaLine,
    memoryLine,
    `[Rolling Chat Stream: Last 10 conversation nodes]\n${opts.rollingStream}`
  ].join("\n\n");
}

/**
 * Build a warm, dimensional profile metadata line from WHO-aligned onboarding data.
 * This replaces the old "Sex: X | Focus: Y" clinical format with something
 * that mirrors how a real friend would describe someone they care about.
 */
function buildProfileMetadata(profile: {
  age: number;
  sex: string;
  primaryFocus: string;
  currentExperience: string | null;
  hardestPart: string | null;
  supportSystem: string | null;
  hasProfessionalHelp: boolean;
}): string {
  const parts: string[] = [];

  // Age range (not exact — preserves privacy)
  if (profile.age >= 13 && profile.age <= 17) parts.push("a teenager");
  else if (profile.age <= 24) parts.push("a young adult");
  else if (profile.age <= 39) parts.push("in their adult years");
  else if (profile.age <= 59) parts.push("in mid-life");
  else parts.push("in their later years");

  // What they're experiencing (from step 2)
  if (profile.currentExperience) {
    const expLabels: Record<string, string> = {
      stress: "carrying a lot of stress and overwhelm",
      sadness: "feeling sadness and heaviness",
      worry: "dealing with persistent worry",
      numbness: "feeling disconnected or numb",
      irritability: "struggling with irritability",
      other: "not sure what they're feeling, but something is off",
    };
    parts.push(`experiencing: ${expLabels[profile.currentExperience] || profile.currentExperience}`);
  }

  // What's hardest day to day (from step 3)
  if (profile.hardestPart) {
    const funcLabels: Record<string, string> = {
      daily_tasks: "finds everyday tasks overwhelming",
      connection: "struggles with connection and loneliness",
      sleep: "has trouble with rest and sleep",
      focus: "struggles with focus and motivation",
      emotions: "is working to understand their own emotions",
      unspecific: "feels a general sense of heaviness without a clear source",
    };
    parts.push(`daily life: ${funcLabels[profile.hardestPart] || profile.hardestPart}`);
  }

  // Support system (from step 4)
  if (profile.supportSystem) {
    const supportLabels: Record<string, string> = {
      well_supported: "has a strong support network",
      some_support: "has some support but it's not fully meeting their needs",
      alone: "is navigating this mostly alone",
      in_therapy: "is in therapy and has professional support",
      tried_therapy: "has tried therapy before",
    };
    parts.push(`support: ${supportLabels[profile.supportSystem] || profile.supportSystem}`);
  }

  // Professional help flag (derived from support selection)
  if (profile.hasProfessionalHelp) {
    parts.push("has professional mental health support");
  }

  return `[User Context: ${parts.join("; ")}.]`;
}
