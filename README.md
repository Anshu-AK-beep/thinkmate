# 🧠 ThinkMate — AI Socratic Tutor

> **No answers. Only better questions.**

ThinkMate is a full-stack AI-powered learning platform that uses the **Socratic method** to develop genuine understanding — never giving answers directly, but guiding students through questions that build real reasoning skills.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Socratic AI Mentor** | Groq-powered LLM (Llama 3.3 70B) shaped via prompt engineering to never give answers — only ask better questions |
| ⚡ **Streaming Responses** | Word-by-word AI responses with blinking cursor, just like ChatGPT — built with SSE |
| 🔐 **Authentication** | Google OAuth + Email/Password via Supabase Auth, per-user data isolation with RLS |
| 📊 **Analytics Dashboard** | Learning progress charts — level progression, session activity, subject breakdown, misconceptions |
| 🔁 **Spaced Repetition** | Ebbinghaus forgetting curve algorithm schedules reviews (1→3→7→14→28 days based on level) |
| 📄 **PDF Export** | Full conversation + stats exported as a formatted PDF — preview in-browser or download |
| 🔗 **Share Sessions** | Generate a public read-only link to share any session — no login required to view |
| 💡 **3-Tier Hint System** | Progressive hints: Orientation → Concept → Worked Example, tracked per session |
| 📱 **Mobile Responsive** | Collapsible sidebar, tab navigation, works on all screen sizes |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│   React + Vite + TypeScript + Tailwind v4               │
│                                                         │
│   /app          — Socratic chat interface               │
│   /analytics    — Learning dashboard (Recharts)         │
│   /share/:id    — Public read-only session view         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS + SSE streaming
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (Railway)                       │
│   Node.js + Express + TypeScript                        │
│                                                         │
│   POST /api/analyze   — streams AI response via SSE     │
│   POST /api/hint      — tier-based hint generation      │
│   GET  /api/analytics — aggregated learning stats       │
│   POST /api/review    — spaced repetition scheduling    │
│   POST /api/share     — create public session snapshot  │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼──────────────────────┐
│   Groq API          │  │   Supabase                     │
│   Llama 3.3 70B     │  │   PostgreSQL + Auth + RLS      │
│   ~200ms latency    │  │   Row-level security per user  │
└─────────────────────┘  └───────────────────────────────┘
```

---

## 🧠 The Core Prompt Engineering Challenge

The hardest part of ThinkMate was **shaping LLM behavior deliberately**:

- The model's natural instinct is to be helpful by answering — ThinkMate's system prompt overrides this, enforcing Socratic questioning
- It detects **misconceptions** in student reasoning and flags them without revealing the correction
- It tracks **understanding level** (Novice → Developing → Proficient → Advanced) across the conversation
- Hint generation is **tier-aware** — each tier builds on the last without revealing the full solution

This is not a wrapper around ChatGPT. The pedagogical behavior is intentionally engineered.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS v4 + tweakcn custom theme
- Recharts (analytics), jsPDF (export), Lucide icons
- Supabase JS client (auth)

**Backend**
- Node.js + Express + TypeScript
- Groq SDK with streaming (`stream: true`)
- Supabase Admin client (service role)
- Zod (validation), JWT middleware

**Infrastructure**
- Vercel (frontend, edge CDN)
- Railway (backend, auto-deploy from GitHub)
- Supabase (PostgreSQL + Auth + Row Level Security)
- Groq Cloud (LLM inference)

---

## 🚀 Local Setup

### Prerequisites
- Node.js 20+
- A Supabase project
- A Groq API key (free at console.groq.com)

### 1. Clone and install

```bash
git clone https://github.com/Anshu-AK-beep/thinkmate.git
cd thinkmate
npm install
```

### 2. Environment variables

Create a `.env` file in the root:

```env
# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Supabase (backend)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Supabase (frontend)
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001
```

### 3. Run database migrations

In Supabase Dashboard → SQL Editor, run these files in order:
1. `server/db/auth-migration.sql`
2. `server/db/schema-sr.sql`
3. `server/db/schema-share.sql`

### 4. Start development

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run dev
```

Open `http://localhost:5173`

---

## 📁 Project Structure

```
thinkmate/
├── server/
│   ├── routes/
│   │   ├── analyze.ts      # SSE streaming AI responses
│   │   ├── sessions.ts     # Session CRUD
│   │   ├── hint.ts         # 3-tier hint generation
│   │   ├── analytics.ts    # Learning stats aggregation
│   │   ├── review.ts       # Spaced repetition scheduling
│   │   └── share.ts        # Public session snapshots
│   ├── middleware/
│   │   ├── auth.ts         # JWT verification
│   │   └── rateLimit.ts    # In-memory rate limiting
│   ├── db/
│   │   ├── client.ts       # Supabase admin client
│   │   ├── sessions.ts     # DB query functions
│   │   └── *.sql           # Migration files
│   └── claude.ts           # Groq client + streaming
├── src/
│   ├── components/
│   │   └── thinkmate/
│   │       ├── chat/       # ChatWindow, MessageBubble, ThinkingIndicator
│   │       ├── layout/     # AppShell, Sidebar, TopBar
│   │       └── problem/    # ProblemCard, PdfPreviewModal, SubjectSelector
│   ├── hooks/
│   │   ├── useSession.ts   # Session state management
│   │   ├── useAI.ts        # Streaming AI calls
│   │   └── useReview.ts    # Spaced repetition state
│   ├── pages/
│   │   ├── Chat.tsx        # Main app page
│   │   ├── Analytics.tsx   # Dashboard
│   │   ├── Login.tsx       # Auth page
│   │   └── ShareView.tsx   # Public session view
│   └── lib/
│       ├── api.ts          # All API calls + streaming
│       ├── exportPdf.ts    # jsPDF generation
│       └── parser.ts       # AI response parser
├── vercel.json
└── railway.json
```

---

## 🔒 Security

- **Row Level Security** — Supabase RLS ensures users can only access their own sessions and messages
- **JWT middleware** — every API route (except `/api/share/:id` and `/api/health`) requires a valid Supabase JWT
- **Service role isolation** — backend uses service role key; frontend never sees it
- **Input validation** — all API inputs validated with Zod schemas

---

## 📸 Screenshots

> Coming soon — add screenshots of the chat interface, analytics dashboard, and share view

---

## 👨‍💻 Built By

**Anshu** — B.Sc. (H) Computer Science, Expected 2026

Passionate about building intelligent systems that solve real-world problems. ThinkMate combines prompt engineering, real-time streaming, and learning science into a production-grade full-stack application.

[![Portfolio](https://img.shields.io/badge/Portfolio-anshuportfolio--vert.vercel.app-10b981?style=flat-square)](https://anshuportfolio-vert.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Anshu--AK--beep-0f172a?style=flat-square&logo=github)](https://github.com/Anshu-AK-beep/thinkmate)
[![Email](https://img.shields.io/badge/Email-a69448190%40gmail.com-f59e0b?style=flat-square)](mailto:a69448190@gmail.com)

---

*"The measure of understanding is not the answer you give, but the questions you can ask."*