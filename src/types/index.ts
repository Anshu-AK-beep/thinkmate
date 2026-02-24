// ─────────────────────────────────────────────────────────────
// src/types/index.ts — All shared TypeScript types
// ─────────────────────────────────────────────────────────────

// ── Domain Types ──────────────────────────────────────────────

export type Subject = 'mathematics' | 'science' | 'general'

export type UnderstandingLevel = 'novice' | 'developing' | 'proficient' | 'advanced'

export type QuestionType = 'clarification' | 'probing' | 'extension' | 'challenge'

export type HintTier = 1 | 2 | 3

export type MessageRole = 'student' | 'ai' | 'system'

// ── Message / Conversation ────────────────────────────────────

export interface AIAnalysisMetadata {
  understandingLevel:     UnderstandingLevel
  questionType:           QuestionType
  misconceptionsDetected: string[]
  confidenceScore:        number       // 0–1
  hintsUsed:              HintTier[]
}

export interface Message {
  id:        string
  role:      MessageRole
  content:   string
  timestamp: Date
  metadata?: AIAnalysisMetadata
}

// ── Session ───────────────────────────────────────────────────

export interface Session {
  id:           string
  subject:      Subject
  problem:      string
  messages:     Message[]
  currentLevel: UnderstandingLevel
  hintsUsed:    number
  maxHints:     number        // default: 3
  startedAt:    Date
  isComplete:   boolean
}