# ThinkMate — Module 2 Spec: UI Shell

## What was built
Full application UI with all screens and components. All dummy data — no real AI calls yet.

## New files added
```
src/
├── components/thinkmate/
│   ├── layout/
│   │   ├── AppShell.tsx        ← master layout: sidebar + topbar + main content
│   │   ├── Sidebar.tsx         ← session history, new problem button, footer
│   │   └── TopBar.tsx          ← logo, active subject pill, dark mode toggle
│   ├── chat/
│   │   ├── ChatWindow.tsx      ← scrollable messages + auto-scroll to latest
│   │   ├── MessageBubble.tsx   ← AI (left, teal border) + student (right, teal bg) bubbles
│   │   ├── ThinkingIndicator.tsx ← animated 3-dot pulse while AI is "thinking"
│   │   └── ReasoningInput.tsx  ← auto-resize textarea, char count, ⌘↵ shortcut, hint btn
│   └── problem/
│       ├── ProblemCard.tsx     ← left panel: problem statement, level tracker, stats, hints
│       └── SubjectSelector.tsx ← pre-session: pick subject → pick problem
├── hooks/
│   └── useSession.ts           ← all session state: messages, level, hints, history
├── data/
│   └── sampleProblems.ts       ← 10 problems across Maths, Science, General
└── pages/
    ├── Landing.tsx             ← hero, features, quote, CTA
    └── Chat.tsx                ← main app page, orchestrates all components
```

## Layout Architecture

### Routes
- `/`    → LandingPage — marketing/intro page
- `/app` → ChatPage — main application

### ChatPage states
1. **No session**: Shows `SubjectSelector` (full width, centered)
2. **Active session**: Shows split panel
   - Left (360px fixed): `ProblemCard` — problem, level tracker, stats, hints, end button
   - Right (flex): `ChatWindow` — messages + `ReasoningInput`

### AppShell
Wraps all app routes. Contains `TopBar` + `Sidebar` + main content area.
Dark mode toggle lives here — sets `class="dark"` on `<html>`.

## Key Design Decisions

### Split panel (not sidebar+chat)
Student must always see the problem while reasoning. Keeping it in a fixed left panel prevents them from scrolling away and losing context.

### Dummy AI in ChatPage
`DUMMY_RESPONSES` array simulates AI turn-taking with 1.8s delay. `dummyIndex` cycles through responses. Module 3 replaces this with a real API call.

### useSession hook
All session state lives here. ChatPage just calls `startSession()`, `addStudentMessage()`, `addAIMessage()`, `requestHint()`, `endSession()`. Clean separation of state and UI.

### Understanding level progression
Reflected in: `ProblemCard` progress bar, `MessageBubble` badge, `Sidebar` history card. All read from `session.currentLevel`. Updated by `addAIMessage()`.

## Module 3 Integration Points
The following are the exact places where real AI replaces dummy data:

1. **`src/pages/Chat.tsx` → `handleSubmitReasoning()`**
   Replace the `setTimeout` block with: `await analyzeReasoning(text, session)`

2. **`src/pages/Chat.tsx` → `handleHintRequest()`**
   Replace hardcoded hints array with: `await getHint(session.hintsUsed + 1, session)`

3. **`src/hooks/useSession.ts`**
   No changes needed — the hook is already wired to receive AI responses via `addAIMessage()`

## What to verify
- [ ] Landing page loads at `/`
- [ ] "Start Learning" / "Try a problem now" navigates to `/app`
- [ ] Subject selector shows 3 subjects
- [ ] Clicking a subject shows problems for that subject
- [ ] Clicking a problem starts a session and shows split panel
- [ ] Typing in input enables Send button after 10 chars
- [ ] ⌘↵ / Ctrl+↵ submits the message
- [ ] AI "thinking" animation appears for 1.8s
- [ ] AI response appears with level badge
- [ ] Hint button decrements remaining hints
- [ ] Hint content appears in chat
- [ ] Progress bar in ProblemCard updates with level
- [ ] "End Session" returns to subject selector and saves to sidebar history
- [ ] Dark mode toggle works