import { useEffect, useRef } from 'react'
import { MessageBubble }     from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ReasoningInput }    from './ReasoningInput'
import type { Message }      from '@/types'

interface ChatWindowProps {
  messages:       Message[]
  isLoading:      boolean      // waiting for first chunk
  isStreaming:    boolean      // chunks arriving
  streamText:     string       // accumulated stream text
  remainingHints: number
  onSubmit:       (text: string) => void
  onHintRequest:  () => void
}

export function ChatWindow({
  messages, isLoading, isStreaming, streamText,
  remainingHints, onSubmit, onHintRequest,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages and on each streaming chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // The latest AI message index — we'll overlay stream text on it
  const lastAIIndex = [...messages].map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === 'ai')
    .at(-1)?.i ?? -1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(16px, 3vw, 24px) clamp(14px, 3vw, 28px)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLatest={i === messages.length - 1}
            // Pass streaming state only to the latest AI bubble
            isStreaming={isStreaming && i === lastAIIndex}
            streamText={isStreaming && i === lastAIIndex ? streamText : undefined}
          />
        ))}

        {/* Show thinking indicator only before first chunk arrives */}
        {isLoading && !isStreaming && <ThinkingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input — disabled while loading or streaming */}
      <ReasoningInput
        onSubmit={onSubmit}
        onHintRequest={onHintRequest}
        remainingHints={remainingHints}
        disabled={isLoading || isStreaming}
      />
    </div>
  )
}