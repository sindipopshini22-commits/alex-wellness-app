// PII scrubbing before any value leaves the process boundary.
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;

export function scrubPii(input: unknown): unknown {
  if (typeof input === "string") {
    return input.replace(EMAIL, "[redacted-email]").replace(PHONE, "[redacted-phone]");
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = scrubPii(v);
    }
    return out;
  }
  return input;
}
