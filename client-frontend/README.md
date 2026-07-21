# Alex Frontend — Vite + React SPA

The frontend landing experience for the Alex Wellness Platform. This is a beautiful Vite + React 18 SPA that handles the pre-authenticated user journey: landing, login, and onboarding questionnaire.

## Tech Stack

- **React 18** with TypeScript
- **Vite 8** for dev/build
- **Tailwind CSS 3** with shadcn/ui components
- **Framer Motion** for animations
- **React Router DOM** for client-side routing
- **TanStack React Query** for API data fetching

## Development

The frontend is designed to run alongside the Next.js backend. The Vite dev server proxies `/api/*` requests to the Next.js backend.

```bash
# Run both frontend and backend together
cd .. && npm run dev:all

# Or run frontend only
npm run dev        # Starts on http://localhost:8080

# Build for production
npm run build
```

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Index | Landing page with hero, features, and CTA |
| `/login` | Login | Sign in with email/password, Google OAuth, or anonymous |
| `/questionnaire` | Questionnaire | 6-step onboarding wizard |
| `/dashboard` | Dashboard | Chat, First Aid Kit, Journal, Lectures |

## API Connection

All API calls are proxied to the Next.js backend:
- Auth: `/api/auth/*` → Next.js handles login, Google OAuth, anonymous auth
- Profile: `/api/profile` → Next.js handles onboarding profile creation
- Chat: `/api/chat` → Next.js handles LLM-powered chat with streaming
- Sessions: `/api/sessions` → Next.js manages chat sessions
