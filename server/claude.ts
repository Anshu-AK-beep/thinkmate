// ─────────────────────────────────────────────────────────────
// server/claude.ts — Groq SDK wrapper (Module 7: Streaming)
// ─────────────────────────────────────────────────────────────

import Groq from 'groq-sdk'
import type { Response } from 'express'

let _client: Groq | null = null

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _client
}

export interface InvokeOptions {
  systemPrompt: string
  messages:     { role: 'user' | 'assistant'; content: string }[]
  maxTokens?:   number
  temperature?: number
}

// ── Non-streaming (used by hint route) ───────────────────────
export async function invokeClaude(opts: InvokeOptions): Promise<string> {
  const { systemPrompt, messages, maxTokens = 1024, temperature = 0.3 } = opts
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

  try {
    const response = await getClient().chat.completions.create({
      model, max_tokens: maxTokens, temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const text = response.choices[0]?.message?.content
    if (!text?.trim()) throw new Error('Empty response from Groq')
    return text
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.includes('invalid_api_key'))
      throw new Error('Invalid Groq API key. Check GROQ_API_KEY in .env')
    if (msg.includes('429'))
      throw new Error('Groq rate limit hit. Please wait a moment.')
    throw err
  }
}

// ── Streaming (used by analyze route) ────────────────────────
// Streams chunks to Express response via SSE.
// Each chunk is: data: {"type":"chunk","text":"..."}\n\n
// End signal is: data: {"type":"done","full":"<full text>"}\n\n
// Error signal is: data: {"type":"error","message":"..."}\n\n
export async function invokeClaudeStream(
  opts: InvokeOptions,
  res:  Response,
): Promise<string> {
  const { systemPrompt, messages, maxTokens = 1200, temperature = 0.5 } = opts
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')  // disable nginx buffering if proxied
  res.flushHeaders()

  let fullText = ''

  try {
    const stream = await getClient().chat.completions.create({
      model, max_tokens: maxTokens, temperature,
      stream: true,                              // ← the key difference
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (!delta) continue

      fullText += delta

      // Send chunk to client
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`)
    }

    // Send completion signal with full text for parsing
    res.write(`data: ${JSON.stringify({ type: 'done', full: fullText })}\n\n`)
    res.end()

    return fullText

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`)
    res.end()
    throw err
  }
}