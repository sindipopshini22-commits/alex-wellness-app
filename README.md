# Alex — AI-Powered Mental Wellness Companion

A cross-platform (Android, iOS, Web) mental wellness app that uses AI as a supportive tool — grounded in WHO mhGAP guidelines and peer-reviewed research. Alex provides structured, evidence-based support exercises (CBT, ACT) with an independent safety classifier and human escalation paths.

> ** Important:** Alex is a self-guided support tool. It uses AI trained on structured therapeutic techniques. It is **not a therapist**, cannot diagnose you, and is **not a substitute for professional care**. In crisis, call or text **988** (US) or **116 123** (UK Samaritans).

---

## Features

###  AI Chat
- Therapeutic conversations grounded in CBT, ACT, and WHO-endorsed techniques
- Streaming responses from Groq-powered LLM
- RAG (Retrieval-Augmented Generation) from a clinical knowledge base
- **File & photo attachments** — share images, PDFs, or text files in chat
- Session history with long-term memory compaction

###  Authentication
- Email & password registration/login
- Anonymous sign-in
- **Google OAuth** sign-in
- Forgot/reset password flow
- HMAC-signed session tokens
- Session timeout & sliding window extension

### Safety System (Research-Backed)
- **Independent Safety Classifier** (D3) — separate from the conversational model, runs on every message
- **Risk Mitigation Controller** (D4) — graduated responses: constrained, crisis resources, human escalation
- **Context-aware crisis detection** — handles negation ("I don't want to kill myself" won't trigger false alarm)
- C-SSRS-aligned risk assessment categories
- Crisis hotline surfacing (988 US, 116 123 UK, findahelpline.com international)
- Clinical review dashboard for human oversight
- Audit logging for all safety events

### 📓 Journaling
- Write & manage journal entries with mood tracking
- Encrypted storage

### Classroom
- Educational modules with structured content
- Interactive exercises (panic breathing, depression micro-wins, thought defusion, grounding)
- Course progress tracking

### Voice (Optional)
- Speech-to-Text via Deepgram
- Text-to-Speech via ElevenLabs

### Settings & Data
- Profile management (WHO-aligned intake fields)
- Account deletion (GDPR-compliant)
- Data export
- EULA & legal acceptance tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via Prisma (Neon) |
| **Auth** | Custom HMAC-signed session tokens + Google OAuth |
| **LLM** | Groq API (runs LLM inference) |
| **Rate Limiting** | Upstash Redis |
| **Voice** | Deepgram (STT), ElevenLabs (TTS) |
| **Validation** | Zod |
| **Mobile** | Capacitor (Android + iOS wrappers) |
| **Styling** | Tailwind CSS v4 |
| **Safety** | Custom safety classifier + C-SSRS-aligned risk mitigation |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon serverless Postgres)
- A Groq API key (for AI chat)

### 1. Clone & Install

```bash
git clone https://github.com/sindipopshini22-commits/alex-wellness-app.git
cd alex-wellness-app
npm install
```

### 2. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | LLM provider key (or use Groq via `.env.local`) |
| `NEXTAUTH_SECRET` | Random 64-char string for session signing |
| `SESSION_SECRET` | Random 64-char string for HMAC tokens |
| `UPSTASH_REDIS_REST_URL` | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token for rate limiting |

Optional but recommended:

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | For sending password reset emails |
| `DEEPGRAM_API_KEY` | For voice STT |
| `ELEVENLABS_API_KEY` | For voice TTS |

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npx next dev -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Two frontends:** the pre-auth pages (landing `/`, `/login`, `/questionnaire`)
> are a separate **Vite + React SPA** in [`client-frontend/`](client-frontend/README.md).
>
> - **Development:** `npm run dev:all` runs Next.js (port 3000) **and** the Vite SPA
>   (port 8080) together — use `http://localhost:8080` for the SPA pages.
> - **Production:** the SPA is built into `public/frontend/` by
>   `npm run build:frontend` (Vercel does this automatically via `vercel.json`).
>   Next.js serves it on `/`, `/login`, and `/questionnaire`.

---

## Architecture

The app follows a research-backed architecture with safety as a first-class concern:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│ Client Apps │───▶│ API Gateway  │───▶│ Session / Auth   │
│ (Web/iOS    │    │ (Next.js)    │    │ Orchestrator     │
│  /Android)  │    │              │    │                  │
└─────────────┘    └──────────────┘    └──────────────────┘
                          │                      │
                          ▼                      ▼
                  ┌─────────────────────────────────────┐
                  │       Conversation Orchestrator      │
                  │  ┌──────────┐  ┌──────────────────┐ │
                  │  │ Support  │  │ Safety Classifier │ │
                  │  │ Model    │  │ (Independent D3)  │ │
                  │  │ (D2)     │  └──────────────────┘ │
                  │  └──────────┘           │            │
                  │         │               ▼            │
                  │         │      ┌──────────────────┐ │
                  │         └─────▶│ Risk Mitigation  │ │
                  │                │ Controller (D4)  │ │
                  │                └──────────────────┘ │
                  └─────────────────────────────────────┘
```

- **Independent Safety Classifier**: Runs in parallel with the conversational model on every message. Uses C-SSRS-aligned risk categories.
- **Risk Mitigation Controller**: Enforces graduated responses — constrained mode, crisis resources, or human escalation.
- **Crisis detection**: Regex + LLM classifier. Negation-aware (doesn't trigger on "I don't want to kill myself").
- **Human-in-the-loop**: Clinical review dashboard for sampling and oversight.

---

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, chat, journal, etc.)
│   ├── dashboard/     # Main chat UI
│   ├── login/         # Login page
│   ├── onboarding/    # User onboarding wizard
│   ├── classroom/     # Educational modules
│   ├── settings/      # Profile, delete, export
│   └── legal/         # EULA pages
├── components/
│   ├── auth/          # Login, disclaimer
│   ├── dashboard/     # ChatWindow, TopNav, Sidebar, etc.
│   ├── interventions/ # Crisis cards, breathing exercises
│   ├── classroom/     # Course layout, module data
│   ├── onboarding/    # Wizard component
│   ├── settings/      # Profile editor, export
│   └── legal/         # EULA modal
├── lib/
│   ├── safetyInterceptor.ts  # Crisis detection pipeline
│   ├── safetyClassifier.ts   # LLM-based risk classifier
│   ├── riskMitigation.ts     # Risk mitigation controller
│   ├── session.ts            # Auth session management
│   ├── llm.ts                # LLM client
│   ├── rag.ts                # RAG knowledge base
│   └── validation.ts         # Zod schemas
└── proxy.ts           # Edge middleware (rate limit, security headers)
```

---

## Running Tests

```bash
# Safety interceptor tests
npx tsx src/lib/__tests__/safetyInterceptor.test.ts
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set all environment variables from `.env` in Vercel's dashboard
4. Deploy

### Environment Variables for Production

Ensure these are set in your hosting platform:

- `DATABASE_URL` — production Postgres connection string
- `SESSION_SECRET` — **must be a unique, random 64-char string** (not the dev default)
- `NEXTAUTH_SECRET` — random string for Auth.js
- `NEXTAUTH_URL` — your production URL (e.g. `https://your-app.vercel.app`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — update redirect URIs for production domain
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — for rate limiting
- `RESEND_API_KEY` — for password reset emails

---

## Security

- **HMAC-signed session tokens** — prevents UUID theft impersonation
- **Zod validation** on all API inputs
- **Rate limiting** via Upstash Redis
- **Security headers**: CSP, HSTS, X-Frame-Options, etc.
- **PII scrubbing** before sending to external APIs
- **Independent safety classifier** — separate from the conversational model
- **Crisis detection** with hard-coded escalation paths (LLM can't override)
- **Audit logging** for all auth and safety events

---

## License

Private — All rights reserved.

---

## Crisis Resources

If you're in crisis, help is available 24/7:

- **US**: Call or text **988** (Suicide & Crisis Lifeline)
- **US**: Text **HOME** to **741741** (Crisis Text Line)
- **UK**: Call **116 123** (Samaritans)
- **UK**: Text **SHOUT** to **85258**
- **International**: Visit [findahelpline.com](https://findahelpline.com)
- **Emergency**: Call **911** (US) or **999** (UK)
