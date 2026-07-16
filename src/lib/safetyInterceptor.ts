// Alex — safety interceptor.
//
// Refactored to use the independent Safety Classifier (D3) and
// Risk Mitigation Controller (D4) as its primary classification layer.
//
// Architecture:
//   1. Immediate crisis regex (never deferred, always runs first).
//   2. Independent Safety Classifier (separate pipeline from conversational model).
//   3. Risk Mitigation Controller determines graduated response.
//   4. Intervention card routing for present-tense symptom episodes.
//   5. Regex fallback (safety net when LLM classifier unavailable).
//
// This replaces the old pattern where the same LLM was used for both
// conversation and classification.

import { classifyRisk, isLowRiskContent } from "@/lib/safetyClassifier";
import { determineMitigation, buildMitigationPayload, type MitigationAction } from "@/lib/riskMitigation";

// ── Crisis patterns — always checked first, never skipped ──────────────
const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|want to die|end my life|harm myself)\b/i,
  /\b(overdose|slit my wrists|take my life|hanging myself|jump off)\b/i,
  /\b(no reason to live|better off dead|goodbye forever|final message)\b/i,
  /\b(self[-\s]?harm|cut(ting)? myself|burn(ing)? myself)\b/i
];

// ── Negation patterns — if a crisis keyword is negated, don't trigger alert ──
// Covers:
//   - "I don't want to kill myself" (intention pattern)
//   - "I wont kill myself" (no apostrophe, direct verb)
//   - "I'm not suicidal" (direct adjective)
//   - "I feel great rn i dont want to kill myself :)" (casual speech)
//
// Note: includes common apostrophe-less spellings (dont, wont, cant, etc.)

// Pattern 1: negation + intention word + crisis keyword
// e.g. "don't want to kill myself", "not going to harm myself"
const NEGATION_PREFIX = /\b((don't|dont|do not|doesn't|doesnt|does not|didn't|didnt|did not|wasn't|wasnt|was not|won't|wont|will not|wouldn't|wouldnt|would not|can't|cant|cannot|can not|couldn't|couldnt|could not|never|no longer|not|no|isn't|isnt|is not|aren't|arent|are not|haven't|havent|have not|hadn't|hadnt|had not)\s+(want to|going to|gonna|plan to|think about|consider|feel like|try to|attempt|gotta)\s+)\b/i;

// Pattern 2: direct negation + crisis verb (no intention word between)
// e.g. "won't kill myself", "can't harm myself", "would never hurt myself"
const NEGATION_DIRECT_VERB = /\b((won't|wont|will not|wouldn't|wouldnt|would not|can't|cant|cannot|can not|couldn't|couldnt|could not|shan't|shant|shall not|mustn't|mustnt|must not|shouldn't|shouldnt|should not|would never|will never)\s+(kill|harm|hurt|end|take|cut|hang|jump|overdose|slit|burn|self-harm))\b/i;

// Pattern 3: "I am not [crisis adjective]" or "I'm not [crisis]"
// e.g. "I'm not suicidal", "I'm not going to kill myself", "I am not suicidal"
const NEGATION_DIRECT = /\b((i'm|i am|im)\s+(not|never)\s+(suicidal|going to|gonna))\b|\b((not|never)\s+(suicidal))\b/i;

/**
 * Check if a crisis keyword is negated in the content.
 * E.g. "I don't want to kill myself" → true (negated, don't trigger)
 *      "I want to kill myself" → false (not negated, trigger alert)
 */
function isCrisisNegated(content: string): boolean {
  // Pattern 1: negation + intention + crisis keyword
  if (NEGATION_PREFIX.test(content)) {
    for (const pattern of CRISIS_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
  }
  // Pattern 2: direct negation before crisis verb
  // Two-step: verify a crisis keyword actually follows the negation
  if (NEGATION_DIRECT_VERB.test(content)) {
    for (const pattern of CRISIS_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
  }
  // Pattern 3: "I'm not suicidal / I'm not going to"
  if (NEGATION_DIRECT.test(content)) {
    // Verify a crisis keyword exists to avoid false positives on "I'm not going to the store"
    for (const pattern of CRISIS_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
  }
  return false;
}

// ── Intervention card patterns (separate from risk classification) ────
const PANIC_PATTERNS = /\b(panic attack(s)?|can't breathe|heart (is )?racing|chest (is )?tight|i (am|'m) dying|losing control|hyperventilat(ing|e)?)\b/i;
const DEPRESSION_PATTERNS = /\b(can't get out of bed|everything is empty|no energy to move|numb|totally hopeless|can't feel anything|empty inside)\b/i;
const INTRUSIVE_PATTERNS = /\b(can't stop thinking about|intrusive thought(s)?|looping mind|stuck in my head|racing thoughts|thoughts won't stop)\b/i;
const EXISTENTIAL_PATTERNS = /\b(what is the point|nothing matters|existential dread|why do we exist|meaningless|why are we here)\b/i;

// ── Past/completed tense detection (prevents false positives) ──────────
const PANIC_PAST_TENSE = /\b(had|was having|experienced|used to have|did|finished|completed|went through|practiced|tried)\s+((a|the|my)\s+)?panic\s+attack(s)?\b/i;
const PANIC_COMPLETED  = /\bpanic\s+(attack(s)?\s+)?(is (done|over|gone|calming|settling)|(has )?(passed|subsided|ended|finished))\b/i;
const PANIC_PROTOCOL   = /\bpanic\s+attack\s+(protocol|exercise|technique|session|tool|guide)\b/i;
const DEPRESSION_PAST_TENSE = /\b(was feeling|used to (feel|be|have)|was|had been)\s+(numb|hopeless|empty)\b/i;
const DEPRESSION_COMPLETED = /\b(numb|hopeless|empty)\s+(is (gone|over|done|lifting)|has (passed|lifted)|gone now|better now)\b/i;
const INTRUSIVE_PAST_TENSE = /\b(had|used to have|was experiencing)\s+(intrusive\s+thought(s)?|racing\s+thought(s)?|looping)\b|\b(couldn't|could not)\s+stop\s+thinking\b/i;
const INTRUSIVE_COMPLETED = /\b(thought(s)?|mind|head)\s+(have\s+|has\s+)?(calmed|slowed|settled|stopped|cleared)\b/i;
const EXISTENTIAL_PAST_TENSE = /\b(was feeling|used to feel|wondered|asked)\s+(what('s| is) the point|why (are|were) we|existential|meaningless)\b/i;
const EXISTENTIAL_COMPLETED = /\b(existential\s+dread|meaningless|nihilism)\s+(has (passed|lifted|ended)|is (gone|over|done)|passed|faded)\b/i;

// ── Types (backward-compatible with chat intercept results) ────────────
/**
 * @deprecated Use classifyRisk + determineMitigation from the new safety
 * classifier pipeline. This type is kept for backward compatibility with
 * existing chat intercept routes.
 */
export type InterceptResult =
  | { type: "CRISIS_ALERT" | "HUMAN_ESCALATION"; payload: { immediateAction: string; message: string; hotlines: any } }
  | { type: "CRISIS_RESOURCES"; payload: { message: string; hotlines: any; checkinPrompt: string } }
  | { type: "CONSTRAINED"; payload: { message: string; hasResources: boolean } }
  | { type: "INTERVENTION_CARD"; subType: string; rawText?: string }
  | { type: "STANDARD" };

// ── Intervention card detection (present-tense symptom episodes) ───────
// This runs as Layer 3 AFTER the safety classifier clears the message.
// It routes to specific interactive exercises, not crisis resources.

function detectInterventionCard(content: string): InterceptResult | null {
  if (PANIC_PATTERNS.test(content)) {
    if (PANIC_PAST_TENSE.test(content) || PANIC_COMPLETED.test(content) || PANIC_PROTOCOL.test(content)) {
      return null; // past/completed — no intervention needed
    }
    return { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" };
  }
  if (DEPRESSION_PATTERNS.test(content)) {
    if (DEPRESSION_PAST_TENSE.test(content) || DEPRESSION_COMPLETED.test(content)) {
      return null;
    }
    return { type: "INTERVENTION_CARD", subType: "DEPRESSION_MICRO_WIN" };
  }
  if (INTRUSIVE_PATTERNS.test(content)) {
    if (INTRUSIVE_PAST_TENSE.test(content) || INTRUSIVE_COMPLETED.test(content)) {
      return null;
    }
    return { type: "INTERVENTION_CARD", subType: "THOUGHT_DEFUSION_CANVAS", rawText: content };
  }
  if (EXISTENTIAL_PATTERNS.test(content)) {
    if (EXISTENTIAL_PAST_TENSE.test(content) || EXISTENTIAL_COMPLETED.test(content)) {
      return null;
    }
    return { type: "INTERVENTION_CARD", subType: "MACRO_TO_MICRO_ZOOM" };
  }
  return null;
}

// ── Main entry point ───────────────────────────────────────────────────

/**
 * Evaluate a user message and return the appropriate intercept result.
 *
 * Architecture (correct layering):
 * 1. Immediate crisis regex (never deferred — Layer 1)
 * 2. Intervention card routing for present-tense symptom episodes (Layer 2)
 *    — This runs BEFORE the safety classifier because intervention cards
 *      are symptom-to-exercise routing, not risk assessment. Panic attacks
 *      and intrusive thoughts are routed to structured exercises, not to
 *      crisis resources.
 * 3. Independent Safety Classifier (C-SSRS-aligned, Layer 3)
 *    — Only for messages that aren't already handled by an intervention card
 * 4. Risk Mitigation Controller determines graduated response (Layer 4)
 *
 * This function is called BOTH by the intercept endpoint (quick pre-screen)
 * and by the main chat endpoint (full parallel processing with RAG).
 *
 * When called by the chat endpoint with skipInterventionCards=true, the
 * intervention detection is skipped (already handled client-side by the
 * intercept pre-screen).
 */
export async function evaluateMessagePayload(
  content: string,
  options?: { context?: string[]; skipInterventionCards?: boolean }
): Promise<InterceptResult> {
  // Layer 1: Crisis regex — ALWAYS checked first, never deferred
  // BUT: skip if the crisis keyword is negated (e.g. "I don't want to kill myself")
  if (!isCrisisNegated(content)) {
    for (const pattern of CRISIS_PATTERNS) {
      if (pattern.test(content)) {
        return {
          type: "CRISIS_ALERT",
          payload: {
            immediateAction: "CALL_EMERGENCY_SERVICES",
            message:
              "I am intercepting this because your life and safety are what matter most right now. I cannot let us just text through this. Please reach a real human in the next few minutes:",
            hotlines: {
              us: { suicide: "988 (Call or Text — 24/7)", crisis: "Text HOME to 741741" },
              uk: { samaritans: "Samaritans — 116 123", text: "Text SHOUT to 85258" },
              intl: "findahelpline.com lists free lines in 50+ countries.",
              emergency: "If you are in immediate danger, call your local emergency number (911 in the US, 999 in the UK)."
            }
          }
        };
      }
    }
  }

  // Layer 2: Intervention card detection (present-tense symptom episodes)
  // Runs BEFORE the safety classifier because these are symptom-to-exercise
  // routes, not risk assessments. Past/completed episodes pass through.
  if (!options?.skipInterventionCards) {
    const card = detectInterventionCard(content);
    if (card) return card;
  }

  // Layer 3: Independent Safety Classifier (C-SSRS-aligned, separate LLM pipeline)
  // Only runs if the content has risk indicators beyond symptom keywords.
  // The classifier checks for CRISIS-LEVEL risk (suicide, self-harm, psychosis,
  // substance emergency), not symptom routing (panic, depression, intrusive
  // thoughts — those are handled by Layer 2 intervention cards).
  if (!isLowRiskContent(content)) {
    const riskAssessment = await classifyRisk(content, options?.context);
    const mitigationState = determineMitigation(riskAssessment);
    const mitigationPayload = buildMitigationPayload(mitigationState);

    // If classifier found a risk, return the mitigation action
    if (mitigationPayload.type !== "STANDARD") {
      return mitigationPayload as InterceptResult;
    }
  }

  // Layer 4: Everything passed — return STANDARD
  return { type: "STANDARD" };
}

// Note: quickScreen has been removed. Use isLowRiskContent from
// safetyClassifier.ts for synchronous risk indicator checks.
