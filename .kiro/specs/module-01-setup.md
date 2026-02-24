# ThinkMate — Module 1 Spec: Project Setup & Theme

## Project Overview
ThinkMate is a Socratic AI learning platform that guides students through reasoning rather than providing answers. It uses Claude AI to analyze student reasoning, detect misconceptions, and generate targeted follow-up questions.

**Target users:** Indian students (Classes 6–12 and college), teachers, self-learners  
**Core value prop:** AI that asks, not tells  
**Stack:** React + Vite + TypeScript, shadcn/ui, Tailwind CSS v4, framer-motion, AWS backend (future modules)

---

## Module 1 Goals
- [x] Vite + React + TypeScript project scaffold
- [x] Tailwind CSS v4 with `@tailwindcss/vite` plugin
- [x] Custom tweakcn-compatible theme (`src/index.css`)
- [x] TypeScript type definitions for all core domain objects
- [x] `cn()` utility helper
- [x] React Router setup
- [x] Theme preview component for visual verification
- [x] Path alias `@/` → `src/`

---

## Design Decisions

### Aesthetic: "Focused Scholar"
Warm parchment backgrounds (`#fffbf4`), deep ink typography (`#14110c`), teal-indigo primary (`#256370`), amber secondary (`#d98f34`). Intentionally calm and distraction-free — this is a thinking tool, not an entertainment app.

### Fonts
- **Lora** (serif) — headings and display text. Academic gravitas without being stuffy.
- **IBM Plex Sans** — body and UI. Clean, technical, slightly warm.
- **IBM Plex Mono** — code, math expressions, session IDs.

### Why tweakcn-compatible CSS vars
All color tokens are defined as space-separated RGB values (e.g. `37 99 112`) so they can be composed with Tailwind's opacity modifier syntax: `rgb(var(--primary) / 0.15)`. This makes hover states, ghost variants, and transparency effects trivial.

### Custom ThinkMate tokens (beyond shadcn base)
- `--level-novice/developing/proficient/advanced` — understanding level colors
- `--hint-1/2/3` — graduated hint tier colors
- `--bubble-ai/student` — chat bubble backgrounds
- `--sidebar-bg/border` — sidebar-specific surface colors
- `--shadow-sm/md/lg/glow` — named shadow scale

---

## File Structure
```
src/
├── components/
│   ├── ui/                   ← shadcn auto-generated (DO NOT manually edit)
│   └── thinkmate/            ← all custom ThinkMate components
├── pages/                    ← route-level components
├── hooks/                    ← custom React hooks (Module 2+)
├── lib/
│   └── utils.ts              ← cn() helper
├── types/
│   └── index.ts              ← all shared TypeScript types
├── App.tsx
├── main.tsx
└── index.css                 ← theme source of truth
```

---

## Key Types (src/types/index.ts)

| Type | Purpose |
|------|---------|
| `Session` | Full conversation session with messages, subject, problem |
| `Message` | Single turn — student or AI, with optional AI metadata |
| `AIAnalysisMetadata` | Understanding level, misconceptions, confidence from AI |
| `UnderstandingLevel` | `novice \| developing \| proficient \| advanced` |
| `HintTier` | `1 \| 2 \| 3 \| 4` (graduated hint system) |
| `Subject` | `mathematics \| science \| general` |
| `AnalyzeReasoningRequest/Response` | API contract for main AI call |
| `HintRequest/Response` | API contract for hint system |

---

## Next Module
**Module 2 — UI Shell**: Full application layout including sidebar, chat view, problem input panel, hint system, and understanding level tracker. Uses dummy data — no AI calls yet.

---

## Constraints & Notes
- Do NOT modify files inside `src/components/ui/` — these are shadcn-managed
- All custom components go in `src/components/thinkmate/`
- Theme is the single source of truth — never hardcode colors in components
- `ThemePreview.tsx` is a dev-only component — remove before production
- Dark mode is fully supported via `.dark` class on `<html>`