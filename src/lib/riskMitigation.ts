// Alex — Risk Mitigation Mode Controller (D4 in architecture).
//
// Receives the risk assessment from the independent Safety Classifier (D3)
// and determines the appropriate mitigation action. Enforces graduated
// responses:
//
//   none/low   → deliver standard conversational response
//   moderate   → constrain generation, gentle check-in, optional resources
//   high       → constrained crisis protocol + resource surfacing
//   imminent   → hard-coded crisis override + human escalation
//
// The key design constraint: escalation paths are CODE-ENFORCED, not
// prompt-instructed. Once the controller decides "imminent," no LLM output
// can override the crisis resource block.

import type { RiskAssessment, RiskLevel, RiskCategoryId } from "./safetyClassifier";

// ── Types ──────────────────────────────────────────────────────────────

export type MitigationAction =
  | { type: "PROCEED_NORMAL" }
  | {
      type: "CONSTRAINED_RESPONSE";
      constraints: string[];
      gentleCheckin?: string;
    }
  | {
      type: "CRISIS_RESOURCES";
      message: string;
      hotlines: typeof HOTLINES;
      checkinPrompt: string;
    }
  | {
      type: "HUMAN_ESCALATION";
      priority: "normal" | "urgent";
      message: string;
      hotlines: typeof HOTLINES;
      escalationReason: string;
    };

export type MitigationState = {
  action: MitigationAction;
  assessment: RiskAssessment;
  timestamp: number;
};

// ── Hotlines ──────────────────────────────────────────────────────────

const HOTLINES = {
  us: {
    suicide: "988 (Call or Text — 24/7)",
    crisis: "Text HOME to 741741",
    substance: "SAMHSA Helpline — 1-800-662-4357",
  },
  uk: {
    samaritans: "Samaritans — 116 123",
    text: "Text SHOUT to 85258",
  },
  intl: "findahelpline.com lists free crisis lines in 50+ countries.",
  emergency: "If you are in immediate danger, call your local emergency number (911 in the US, 999 in the UK).",
};

// ── Action Controllers ────────────────────────────────────────────────

function buildProceedNormal(): MitigationAction {
  return { type: "PROCEED_NORMAL" };
}

function buildConstrainedResponse(assessment: RiskAssessment): MitigationAction {
  // Collect which categories are concerning to build targeted constraints
  const activeCategories = Object.entries(assessment.categories)
    .filter(([_, c]) => c.level === "moderate" || c.level === "high")
    .map(([id]) => id as RiskCategoryId);

  // Build gentle check-in message based on which categories triggered
  const checkinParts: string[] = [];
  const resourceLinks: string[] = [];

  for (const catId of activeCategories) {
    switch (catId) {
      case "suicidal_ideation":
      case "self_harm": {
        checkinParts.push("I want to check in on how you're feeling right now — are you safe?");
        resourceLinks.push("• Crisis resources are always available at 988 (US) or 116 123 (UK)");
        break;
      }
      case "acute_crisis": {
        checkinParts.push("It sounds like you're going through something intense right now. Let's slow down together.");
        resourceLinks.push("• Try the Panic Intercept breathing exercise or the 5-4-3-2-1 grounding technique");
        break;
      }
      case "psychosis_reality_testing": {
        checkinParts.push("I hear that your experience feels very real. Let me help you ground in what's physically around you right now.");
        resourceLinks.push("• Sensory grounding: name 5 things you can see, 4 you can touch, 3 you can hear");
        break;
      }
      case "substance_emergency": {
        checkinParts.push("Substance concerns are serious — your safety comes first.");
        resourceLinks.push("• SAMHSA Helpline: 1-800-662-4357 (US) · Talk to Frank: 0300 123 6600 (UK)");
        break;
      }
      case "risk_to_others": {
        checkinParts.push("I'm concerned about what you've shared. You don't have to handle this alone.");
        resourceLinks.push("• Call 988 (US) or 116 123 (UK) — they're trained to help with these feelings");
        break;
      }
    }
  }

  const gentleCheckin = checkinParts.length > 0
    ? checkinParts.join(" ") + "\n\n" + resourceLinks.join("\n")
    : undefined;

  // Generation constraints: inject into system prompt to guide the model
  const constraints = [
    "Do NOT explore or probe for more details about the risk-related content.",
    "Keep responses brief, grounded, and supportive — no open-ended therapeutic exploration.",
    "IF the user is experiencing active symptoms (panic, distress), offer one evidence-based technique (breathing, grounding) BEFORE continuing conversation.",
    "Do NOT attempt to diagnose or label what the user is experiencing.",
    "If the user mentions medications, do NOT suggest changes to dosage or timing.",
  ];

  return {
    type: "CONSTRAINED_RESPONSE",
    constraints,
    gentleCheckin,
  };
}

function buildCrisisResources(assessment: RiskAssessment): MitigationAction {
  const activeCatNames = Object.entries(assessment.categories)
    .filter(([_, c]) => c.level === "high" || c.level === "imminent")
    .map(([id]) => id.replace(/_/g, " "));

  const message = `I'm intercepting this because your safety and well-being are what matter most right now.\n\nI've detected signals related to: ${activeCatNames.join(", ")}.\n\nPlease reach out to a real human who is trained to help:`;

  const checkinPrompt = activeCatNames.includes("suicidal ideation") || activeCatNames.includes("self harm")
    ? "Would you be willing to call 988 (US) or 116 123 (UK) with me right now? I'll stay here with you."
    : "These resources are here for you. Would you like me to stay with you while you reach out?";

  return {
    type: "CRISIS_RESOURCES",
    message,
    hotlines: HOTLINES,
    checkinPrompt,
  };
}

function buildHumanEscalation(assessment: RiskAssessment): MitigationAction {
  const imminentCats = Object.entries(assessment.categories)
    .filter(([_, c]) => c.level === "imminent" || c.level === "high")
    .map(([id, c]) => `${id.replace(/_/g, " ")} (${c.level}, confidence: ${Math.round(c.confidence * 100)}%)`);

  const escalationReason = `Imminent/high risk detected: ${imminentCats.join("; ")}. Assessment: ${assessment.reasoning}`;

  return {
    type: "HUMAN_ESCALATION",
    priority: "urgent",
    message: `Your safety is the only thing that matters right now.\n\nI need you to reach a real human immediately. Here are the numbers:\n\nUS: 988 (Suicide & Crisis Lifeline)\nUK: Samaritans at 116 123\n\nOr call your local emergency services right now.\n\nI'll stay on this screen with you until you do. You are not alone.`,
    hotlines: HOTLINES,
    escalationReason,
  };
}

// ── Main Decision Engine ──────────────────────────────────────────────

/**
 * Determine the appropriate mitigation action based on a risk assessment.
 * This is a pure function with no side effects — the caller decides how to
 * enforce the action.
 */
export function determineMitigation(assessment: RiskAssessment): MitigationState {
  const action = routeByRiskLevel(assessment);

  return {
    action,
    assessment,
    timestamp: Date.now(),
  };
}

function routeByRiskLevel(assessment: RiskAssessment): MitigationAction {
  switch (assessment.overallRisk) {
    case "none":
    case "low":
      return buildProceedNormal();

    case "moderate":
      return buildConstrainedResponse(assessment);

    case "high":
      return buildCrisisResources(assessment);

    case "imminent":
      return buildHumanEscalation(assessment);

    default:
      return buildProceedNormal();
  }
}

/**
 * Build constraint directives for the conversational model based on the
 * current mitigation state. These are injected into the system prompt.
 */
export function buildConstraintDirectives(state: MitigationState): string {
  if (state.action.type === "PROCEED_NORMAL") {
    return "";
  }

  if (state.action.type === "CONSTRAINED_RESPONSE") {
    return [
      "\n\n--- MITIGATION CONSTRAINTS ---",
      "A risk signal was detected in the user's last message. The following constraints apply to your response:",
      ...state.action.constraints.map(c => `- ${c}`),
      state.action.gentleCheckin ? `\nGentle check-in context: ${state.action.gentleCheckin}` : "",
    ].filter(Boolean).join("\n");
  }

  if (state.action.type === "CRISIS_RESOURCES") {
    return [
      "\n\n--- CRISIS RESOURCE MODE ---",
      "The user has been shown crisis resources. Your job is to:",
      "- Do NOT generate therapeutic content. You are in resource mode.",
      "- Keep responses very brief (1-2 sentences).",
      "- Gently encourage the user to use the provided crisis lines.",
      "- Offer to stay present while they reach out.",
      "- Do NOT ask probing questions about their situation.",
      "- Do NOT attempt to resolve or explore the crisis yourself.",
      state.action.checkinPrompt ? `\nCheck-in prompt to offer: "${state.action.checkinPrompt}"` : "",
    ].filter(Boolean).join("\n");
  }

  if (state.action.type === "HUMAN_ESCALATION") {
    return [
      "\n\n--- HUMAN ESCALATION MODE ---",
      "CRITICAL: The user has been shown imminent crisis resources.",
      "Your ONLY allowed responses are:",
      "1. Encourage them to call emergency services / crisis lines.",
      "2. Offer to stay present silently.",
      "3. Acknowledge their courage in reaching out.",
      "Do NOT generate any other content.",
      "Do NOT explore, therapize, or comfort beyond direct crisis encouragement.",
      "Every response must include or reference crisis resources.",
    ].join("\n");
  }

  return "";
}

/**
 * Get the client-facing payload to send to the frontend based on the
 * mitigation action. This is what the chat API returns.
 */
export function buildMitigationPayload(state: MitigationState): {
  type: string;
  payload: any;
} {
  const { action } = state;

  switch (action.type) {
    case "PROCEED_NORMAL":
      return { type: "STANDARD", payload: {} };

    case "CONSTRAINED_RESPONSE":
      return {
        type: "CONSTRAINED",
        payload: {
          message: action.gentleCheckin ?? "",
          hasResources: !!action.gentleCheckin,
        },
      };

    case "CRISIS_RESOURCES":
      return {
        type: "CRISIS_RESOURCES",
        payload: {
          message: action.message,
          hotlines: action.hotlines,
          checkinPrompt: action.checkinPrompt,
        },
      };

    case "HUMAN_ESCALATION":
      return {
        type: "HUMAN_ESCALATION",
        payload: {
          message: action.message,
          hotlines: action.hotlines,
          escalationReason: action.escalationReason,
          priority: action.priority,
        },
      };
  }
}
