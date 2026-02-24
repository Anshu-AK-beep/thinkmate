// ─────────────────────────────────────────────────────────────
// src/lib/parser.ts — Safe AI response parser (updated)
// Handles new mentorResponse field in addition to questions
// ─────────────────────────────────────────────────────────────

import type { UnderstandingLevel } from '@/types'

export interface ParsedAnalysis {
  mentorResponse:         string      // full 3-part response shown in chat
  questions:              string[]    // extracted questions for UI tagging
  analysis:               string
  understandingLevel:     UnderstandingLevel
  misconceptionsDetected: string[]
  confidenceScore:        number
  suggestHint:            boolean
}

export interface ParsedHint {
  hint: string
  tier: number
}

const VALID_LEVELS: UnderstandingLevel[] = ['novice', 'developing', 'proficient', 'advanced']

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1)
  return raw.trim()
}

export function parseAnalysisResponse(raw: string): ParsedAnalysis {
  try {
    const json = JSON.parse(extractJSON(raw))

    const level: UnderstandingLevel = VALID_LEVELS.includes(json.understandingLevel)
      ? json.understandingLevel
      : 'novice'

    // mentorResponse is the full message shown in chat
    const mentorResponse: string =
      typeof json.mentorResponse === 'string' && json.mentorResponse.trim().length > 0
        ? json.mentorResponse
        : typeof json.questions === 'object' && Array.isArray(json.questions)
          ? json.questions.join('\n\n')   // fallback if model skips mentorResponse
          : 'Can you walk me through your reasoning step by step?'

    const questions: string[] = Array.isArray(json.questions)
      ? json.questions.filter((q: unknown) => typeof q === 'string' && q.trim().length > 0).slice(0, 2)
      : []

    if (questions.length === 0) {
      questions.push('Can you walk me through your reasoning in more detail?')
    }

    return {
      mentorResponse,
      questions,
      analysis:               typeof json.analysis === 'string' ? json.analysis : '',
      understandingLevel:     level,
      misconceptionsDetected: Array.isArray(json.misconceptionsDetected)
        ? json.misconceptionsDetected.filter((m: unknown) => typeof m === 'string')
        : [],
      confidenceScore: typeof json.confidenceScore === 'number'
        ? Math.min(1, Math.max(0, json.confidenceScore))
        : 0.7,
      suggestHint: typeof json.suggestHint === 'boolean' ? json.suggestHint : false,
    }
  } catch {
    return {
      mentorResponse:         'Can you explain your thinking in a bit more detail?',
      questions:              ['Can you explain your thinking in a bit more detail?'],
      analysis:               'Unable to parse AI response.',
      understandingLevel:     'novice',
      misconceptionsDetected: [],
      confidenceScore:        0.5,
      suggestHint:            false,
    }
  }
}

export function parseHintResponse(raw: string, tier: number): ParsedHint {
  try {
    const json = JSON.parse(extractJSON(raw))
    return {
      hint: typeof json.hint === 'string' && json.hint.trim().length > 0
        ? json.hint
        : 'Think carefully about the key relationships in this problem.',
      tier: typeof json.tier === 'number' ? json.tier : tier,
    }
  } catch {
    return {
      hint: 'Think carefully about the key relationships in this problem.',
      tier,
    }
  }
}