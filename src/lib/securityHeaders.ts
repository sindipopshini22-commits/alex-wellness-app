// Alex — Security headers configuration.
//
// Implements defense-in-depth response headers for all routes:
// - CSP: prevents XSS and data injection
// - HSTS: enforces HTTPS
// - X-Content-Type-Options: prevents MIME sniffing
// - X-Frame-Options: prevents clickjacking
// - Referrer-Policy: limits referrer leakage
// - Permissions-Policy: restricts browser features

export const SECURITY_HEADERS: Record<string, string> = {
  // Content Security Policy
  // Restricts which sources can load scripts, styles, fonts, etc.
  // This is a strict policy tuned for the app's requirements.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-eval' needed for Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.groq.com https://api.deepgram.com https://api.elevenlabs.io https://*.upstash.io wss://api.deepgram.com",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // HTTP Strict Transport Security
  // Forces HTTPS connections, prevents downgrade attacks
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Limit referrer information leakage
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Restrict browser features
  "Permissions-Policy": [
    "camera=()",
    "microphone=(self)",
    "geolocation=()",
    "interest-cohort=()",
  ].join(", "),

  // Prevent browser from detecting the MIME type (legacy)
  "X-XSS-Protection": "0", // Disabled in favor of CSP
};
