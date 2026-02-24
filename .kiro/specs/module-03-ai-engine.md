# ThinkMate — Module 3 Spec: AI Reasoning Engine

## What was built
Real AI integration via Amazon Bedrock (Claude). Replaced all dummy data with live API calls.

## New files

```
src/
├── lib/
│   ├── prompts.ts     ← system prompt + buildAnalysisPrompt() + buildHintPrompt()
│   ├── parser.ts      ← safe JSON parser for AI responses, graceful fallbacks
│   └── api.ts         ← frontend fetch client for Express backend
└── hooks/
    └── useAI.ts       ← React hook: analyze() + hint() with loading/error/retry

server/
├── index.ts           ← Express app, CORS, middleware, routes, health check
├── bedrock.ts         ← AWS SDK client, invokeClaude(), error normalisation
├── middleware/
│   └── rateLimit.ts   ← 30 req/min per IP (in-memory)
└── routes/
    ├── analyze.ts     ← POST /api/analyze — Zod validation → Bedrock → parsed response
    └── hint.ts        ← POST /api/hint    — Zod validation → Bedrock → hint + remaining count

src/pages/
└── Chat.tsx           ← UPDATED: dummy setTimeout replaced with useAI() calls
```

## Architecture

```
React :5173
  └─ useAI hook
      └─ api.ts (fetch)
            └─ POST /api/analyze   →  Express :3001
            └─ POST /api/hint      →      └─ Zod validation
                                          └─ buildPrompt()
                                          └─ invokeClaude()   →  Bedrock
                                          └─ parseResponse()  ←  Bedrock
                                   ←  JSON response
```

## The Prompt — Design Decisions

### Why temperature 0.3–0.4?
Low enough for consistent JSON output, high enough for varied question phrasing. Avoids the AI generating identical questions across sessions.

### Why structured JSON output?
The frontend needs to independently render: (a) question text, (b) understanding level badge, (c) misconception flag. JSON lets each UI element consume exactly what it needs. Plain text would require fragile regex parsing.

### Why a separate HINT_SYSTEM_PROMPT?
Hints have different constraints than analysis questions — they must reveal progressively more while still not giving the answer. A separate system prompt avoids conflicting instructions.

### Why shared prompts.ts between frontend and server?
`buildAnalysisPrompt()` and `buildHintPrompt()` are pure functions with no Node.js dependencies. Keeping them in `src/lib/` means they're testable in isolation and can be imported by both server routes and any future Lambda functions.

## Key Integration Points in Chat.tsx

### Before (Module 2 dummy)
```ts
setTimeout(() => {
  const response = DUMMY_RESPONSES[dummyIndex % DUMMY_RESPONSES.length]
  addAIMessage(response.content, response.level, response.misconceptions)
  setDummyIndex(i => i + 1)
}, 1800)
```

### After (Module 3 real)
```ts
analyze(
  { sessionId, problem, subject, studentResponse, conversationHistory, attemptNumber },
  (res) => {
    addAIMessage(res.questions.join('\n\n'), res.understandingLevel, res.misconceptionsDetected)
  }
)
```

## Error Handling Strategy

| Error Type | User sees | Technical |
|---|---|---|
| Network / server down | "Cannot reach server on port 3001" | TypeError: fetch failed |
| AWS credentials bad | "AWS credentials invalid" | UnrecognizedClientException |
| Bedrock access denied | "Enable model access in AWS Console" | AccessDeniedException |
| Rate limited (429) | "Wait a moment and try again" | RATE_LIMITED |
| Server error (500) | "Try submitting again" | auto-retry once |
| JSON parse failure | Safe fallback question shown | parseAnalysisResponse catches |

## Setup Checklist
- [ ] `cp .env.example .env` and fill in AWS credentials
- [ ] Enable Claude model access in AWS Console → Bedrock → Model access (ap-south-1)
- [ ] `npm install @aws-sdk/client-bedrock-runtime express cors zod dotenv`
- [ ] `npm install -D @types/express @types/cors tsx nodemon`
- [ ] Add `server` and `server:prod` scripts to package.json
- [ ] `npm run server` in one terminal
- [ ] `npm run dev` in another terminal
- [ ] Visit `http://localhost:3001/api/health` — should show `{"status":"ok","bedrock":true}`
- [ ] Test a full conversation — AI questions should now be real, Socratic, and adaptive

## Module 4 Integration Points
- `server/routes/analyze.ts` — add DynamoDB session context retrieval before Bedrock call
- `server/routes/hint.ts` — move `hintUsage` Map to DynamoDB (currently in-memory, resets on server restart)
- `server/index.ts` — add JWT auth middleware before routes

## AWS Bedrock Setup (one-time)
1. AWS Console → Amazon Bedrock → Model access
2. Click "Manage model access"
3. Enable: **Anthropic Claude 3.5 Sonnet**
4. Region: **ap-south-1** (Mumbai) — lowest latency for India
5. Wait ~2 minutes for access to activate