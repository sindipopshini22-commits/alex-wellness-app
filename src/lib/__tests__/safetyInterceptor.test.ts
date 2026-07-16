/**
 * Tests for safetyInterceptor — validates context-aware panic/depression/intrusive/existential
 * detection so that past/completed episodes don't trigger false alarms while
 * active present-tense episodes still get interventions.
 *
 * These tests exercise the regex fallback path (evaluateWithRegex), which is
 * used when the LLM is unavailable (no API key in test/dev environments).
 *
 * Run: npx tsx src/lib/__tests__/safetyInterceptor.test.ts
 */

import { evaluateMessagePayload } from "@/lib/safetyInterceptor";

type Result = Awaited<ReturnType<typeof evaluateMessagePayload>>;

let passed = 0;
let failed = 0;

async function test(description: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (e: any) {
    console.log(`  ✗ ${description}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assertEqual(actual: Result, expected: { type: string; subType?: string }, input: string) {
  if (actual.type !== expected.type) {
    throw new Error(
      `Expected type "${expected.type}" but got "${actual.type}"` +
      (actual.type === "INTERVENTION_CARD" ? ` (subType: ${(actual as any).subType})` : "") +
      `\n    Input: "${input}"`
    );
  }
  if (expected.subType && (actual as any).subType !== expected.subType) {
    throw new Error(
      `Expected subType "${expected.subType}" but got "${(actual as any).subType}"` +
      `\n    Input: "${input}"`
    );
  }
}

// ── Panic ──────────────────────────────────────────────────────────────
console.log("\n=== PANIC ===\n");

// False alarms — should be STANDARD
test("past tense: 'I had a panic attack yesterday'", async () => {
  assertEqual(
    await evaluateMessagePayload("I had a panic attack yesterday"),
    { type: "STANDARD" }, "I had a panic attack yesterday"
  );
});

test("past tense: 'i did the panic attack quick help'", async () => {
  assertEqual(
    await evaluateMessagePayload("i did the panic attack quick help"),
    { type: "STANDARD" }, "i did the panic attack quick help"
  );
});

test("past tense: 'finished the panic attack protocol'", async () => {
  assertEqual(
    await evaluateMessagePayload("finished the panic attack protocol"),
    { type: "STANDARD" }, "finished the panic attack protocol"
  );
});

test("past tense: 'I completed the panic attack exercise'", async () => {
  assertEqual(
    await evaluateMessagePayload("I completed the panic attack exercise"),
    { type: "STANDARD" }, "I completed the panic attack exercise"
  );
});

test("past tense: 'went through the panic attack thing'", async () => {
  assertEqual(
    await evaluateMessagePayload("went through the panic attack thing"),
    { type: "STANDARD" }, "went through the panic attack thing"
  );
});

test("past tense: 'the panic attack protocol worked'", async () => {
  assertEqual(
    await evaluateMessagePayload("the panic attack protocol worked"),
    { type: "STANDARD" }, "the panic attack protocol worked"
  );
});

test("past tense: 'I used to have a panic attack every time'", async () => {
  assertEqual(
    await evaluateMessagePayload("I used to have a panic attack every time"),
    { type: "STANDARD" }, "I used to have a panic attack every time"
  );
});

test("completed: 'my panic attack is done'", async () => {
  assertEqual(
    await evaluateMessagePayload("my panic attack is done"),
    { type: "STANDARD" }, "my panic attack is done"
  );
});

test("completed: 'the panic has passed'", async () => {
  assertEqual(
    await evaluateMessagePayload("the panic has passed"),
    { type: "STANDARD" }, "the panic has passed"
  );
});

test("completed: 'panic attack subsided'", async () => {
  assertEqual(
    await evaluateMessagePayload("my panic attack has subsided"),
    { type: "STANDARD" }, "my panic attack has subsided"
  );
});

test("completed: 'my panic is calming down'", async () => {
  assertEqual(
    await evaluateMessagePayload("my panic is calming down"),
    { type: "STANDARD" }, "my panic is calming down"
  );
});

// Active episodes — should trigger intervention
test("active: 'I'm having a panic attack right now'", async () => {
  assertEqual(
    await evaluateMessagePayload("I'm having a panic attack right now"),
    { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" }, "I'm having a panic attack right now"
  );
});

test("active: 'I can't breathe'", async () => {
  assertEqual(
    await evaluateMessagePayload("I can't breathe"),
    { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" }, "I can't breathe"
  );
});

test("active: 'my heart is racing and I'm dying'", async () => {
  assertEqual(
    await evaluateMessagePayload("my heart is racing and I'm dying"),
    { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" }, "my heart is racing and I'm dying"
  );
});

test("active: 'hyperventilating really bad'", async () => {
  assertEqual(
    await evaluateMessagePayload("hyperventilating really bad"),
    { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" }, "hyperventilating really bad"
  );
});

test("active (plural): 'I'm having panic attacks'", async () => {
  assertEqual(
    await evaluateMessagePayload("I'm having panic attacks"),
    { type: "INTERVENTION_CARD", subType: "PANIC_SOS_CARD" }, "I'm having panic attacks"
  );
});

// ── Depression ─────────────────────────────────────────────────────────
console.log("\n=== DEPRESSION ===\n");

test("past tense: 'I was feeling numb yesterday'", async () => {
  assertEqual(
    await evaluateMessagePayload("I was feeling numb yesterday"),
    { type: "STANDARD" }, "I was feeling numb yesterday"
  );
});

test("past tense: 'I used to be hopeless'", async () => {
  assertEqual(
    await evaluateMessagePayload("I used to be hopeless"),
    { type: "STANDARD" }, "I used to be hopeless"
  );
});

test("completed: 'numb has lifted'", async () => {
  assertEqual(
    await evaluateMessagePayload("numb has lifted"),
    { type: "STANDARD" }, "numb has lifted"
  );
});

test("completed: 'empty has lifted'", async () => {
  assertEqual(
    await evaluateMessagePayload("that empty feeling has lifted"),
    { type: "STANDARD" }, "that empty feeling has lifted"
  );
});

// Active
test("active: 'I am numb'", async () => {
  assertEqual(
    await evaluateMessagePayload("I am numb"),
    { type: "INTERVENTION_CARD", subType: "DEPRESSION_MICRO_WIN" }, "I am numb"
  );
});

test("active: 'I feel totally hopeless'", async () => {
  assertEqual(
    await evaluateMessagePayload("I feel totally hopeless"),
    { type: "INTERVENTION_CARD", subType: "DEPRESSION_MICRO_WIN" }, "I feel totally hopeless"
  );
});

test("active: 'everything is empty'", async () => {
  assertEqual(
    await evaluateMessagePayload("everything is empty"),
    { type: "INTERVENTION_CARD", subType: "DEPRESSION_MICRO_WIN" }, "everything is empty"
  );
});

// ── Intrusive Thoughts ─────────────────────────────────────────────────
console.log("\n=== INTRUSIVE THOUGHTS ===\n");

test("past tense: 'I had intrusive thoughts before'", async () => {
  assertEqual(
    await evaluateMessagePayload("I had intrusive thoughts before"),
    { type: "STANDARD" }, "I had intrusive thoughts before"
  );
});

test("past tense: 'I used to have racing thoughts'", async () => {
  assertEqual(
    await evaluateMessagePayload("I used to have racing thoughts"),
    { type: "STANDARD" }, "I used to have racing thoughts"
  );
});

test("past tense: 'I couldn't stop thinking about it'", async () => {
  assertEqual(
    await evaluateMessagePayload("I couldn't stop thinking about it"),
    { type: "STANDARD" }, "I couldn't stop thinking about it"
  );
});

test("completed: 'my thoughts have calmed down'", async () => {
  assertEqual(
    await evaluateMessagePayload("my thoughts have calmed down"),
    { type: "STANDARD" }, "my thoughts have calmed down"
  );
});

test("completed: 'my mind has cleared'", async () => {
  assertEqual(
    await evaluateMessagePayload("my mind has cleared"),
    { type: "STANDARD" }, "my mind has cleared"
  );
});

test("completed: 'my head cleared'", async () => {
  assertEqual(
    await evaluateMessagePayload("my head cleared"),
    { type: "STANDARD" }, "my head cleared"
  );
});

// Active
test("active: 'I can't stop thinking about this'", async () => {
  assertEqual(
    await evaluateMessagePayload("I can't stop thinking about this"),
    { type: "INTERVENTION_CARD", subType: "THOUGHT_DEFUSION_CANVAS" }, "I can't stop thinking about this"
  );
});

test("active (plural): 'intrusive thoughts are everywhere'", async () => {
  assertEqual(
    await evaluateMessagePayload("intrusive thoughts are everywhere"),
    { type: "INTERVENTION_CARD", subType: "THOUGHT_DEFUSION_CANVAS" }, "intrusive thoughts are everywhere"
  );
});

test("active: 'my racing thoughts won't stop'", async () => {
  assertEqual(
    await evaluateMessagePayload("my racing thoughts won't stop"),
    { type: "INTERVENTION_CARD", subType: "THOUGHT_DEFUSION_CANVAS" }, "my racing thoughts won't stop"
  );
});

test("active: 'I'm stuck in my head with looping thoughts'", async () => {
  assertEqual(
    await evaluateMessagePayload("I'm stuck in my head with looping thoughts"),
    { type: "INTERVENTION_CARD", subType: "THOUGHT_DEFUSION_CANVAS" }, "I'm stuck in my head with looping thoughts"
  );
});

// ── Existential Dread ──────────────────────────────────────────────────
console.log("\n=== EXISTENTIAL DREAD ===\n");

test("past tense: 'I was feeling existential dread last week'", async () => {
  assertEqual(
    await evaluateMessagePayload("I was feeling existential dread last week"),
    { type: "STANDARD" }, "I was feeling existential dread last week"
  );
});

test("past tense: 'I used to feel meaningless'", async () => {
  assertEqual(
    await evaluateMessagePayload("I used to feel meaningless"),
    { type: "STANDARD" }, "I used to feel meaningless"
  );
});

test("past tense: 'I wondered what's the point'", async () => {
  assertEqual(
    await evaluateMessagePayload("I wondered what's the point"),
    { type: "STANDARD" }, "I wondered what's the point"
  );
});

test("completed: 'existential dread has passed'", async () => {
  assertEqual(
    await evaluateMessagePayload("existential dread has passed"),
    { type: "STANDARD" }, "existential dread has passed"
  );
});

test("completed: 'the meaningless is gone'", async () => {
  assertEqual(
    await evaluateMessagePayload("the meaningless is gone"),
    { type: "STANDARD" }, "the meaningless is gone"
  );
});

// Active
test("active: 'what is the point of anything'", async () => {
  assertEqual(
    await evaluateMessagePayload("what is the point of anything"),
    { type: "INTERVENTION_CARD", subType: "MACRO_TO_MICRO_ZOOM" }, "what is the point of anything"
  );
});

test("active: 'I'm feeling existential dread'", async () => {
  assertEqual(
    await evaluateMessagePayload("I'm feeling existential dread"),
    { type: "INTERVENTION_CARD", subType: "MACRO_TO_MICRO_ZOOM" }, "I'm feeling existential dread"
  );
});

test("active: 'nothing matters anymore'", async () => {
  assertEqual(
    await evaluateMessagePayload("nothing matters anymore"),
    { type: "INTERVENTION_CARD", subType: "MACRO_TO_MICRO_ZOOM" }, "nothing matters anymore"
  );
});

// ── Crisis (should always fire) ────────────────────────────────────────
console.log("\n=== CRISIS (should always fire) ===\n");

test("crisis: 'I want to die'", async () => {
  const r = await evaluateMessagePayload("I want to die");
  if (r.type !== "CRISIS_ALERT") throw new Error(`Expected CRISIS_ALERT, got ${r.type}`);
});

test("crisis: 'suicidal thoughts'", async () => {
  const r = await evaluateMessagePayload("I'm having suicidal thoughts");
  if (r.type !== "CRISIS_ALERT") throw new Error(`Expected CRISIS_ALERT, got ${r.type}`);
});

// ── Summary ────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total\n`);
