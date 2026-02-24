import type { Message } from '@/types'

interface MessageBubbleProps {
  message:    Message
  isLatest?:  boolean
  isStreaming?: boolean     // ← new: show cursor if this bubble is being streamed
  streamText?: string       // ← new: partial text during streaming
}

function renderContent(text: string): React.ReactNode {
  // Render **bold** markdown
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    // Render newlines
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}

export function MessageBubble({
  message,
  isStreaming,
  streamText,
}: MessageBubbleProps) {
  const isStudent = message.role === 'student'
  const isHintRequest = message.content.startsWith('[Requested Hint')

  // Content to display — stream text overrides message content while streaming
  const displayText = (isStreaming && streamText) ? streamText : message.content

  if (isHintRequest) {
    const tierMatch = message.content.match(/Hint (\d+) — ([^)]+)/)
    const tier  = tierMatch?.[1] ?? '1'
    const label = tierMatch?.[2] ?? 'Hint'
    return (
      <div className="flex justify-end">
        <div style={{
          padding: '6px 12px', borderRadius: 'var(--radius)',
          background: 'rgb(var(--secondary) / 0.12)',
          border: '1px solid rgb(var(--secondary) / 0.25)',
          fontSize: '0.75rem', color: 'rgb(var(--secondary))',
          fontStyle: 'italic', fontFamily: 'var(--font-mono)',
        }}>
          💡 Hint {tier} requested — {label}
        </div>
      </div>
    )
  }

  if (isStudent) {
    return (
      <div className="flex justify-end">
        <div style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          background: 'rgb(var(--primary))',
          color: 'rgb(var(--primary-foreground))',
          fontSize: '0.9rem', lineHeight: 1.65,
          fontFamily: 'var(--font-body)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {renderContent(message.content)}
        </div>
      </div>
    )
  }

  // AI bubble
  const level = message.metadata?.understandingLevel
  const misconceptions = message.metadata?.misconceptionsDetected ?? []

  return (
    <div className="flex justify-start">
      <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* AI avatar + label */}
        <div className="flex items-center gap-2">
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgb(var(--primary) / 0.12)',
            border: '1.5px solid rgb(var(--primary) / 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: 700,
            color: 'rgb(var(--primary))', flexShrink: 0,
          }}>
            T
          </div>
          <span style={{
            fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))',
            fontWeight: 500, letterSpacing: '0.04em',
          }}>
            ThinkMate
          </span>
          {level && !isStreaming && (
            <span
              className={`tm-level-${level}`}
              style={{
                fontSize: '0.6375rem', padding: '1px 6px',
                borderRadius: 'calc(var(--radius) * 0.5)', fontWeight: 500,
              }}
            >
              {level}
            </span>
          )}
        </div>

        {/* Message content */}
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius)',
          background: 'rgb(var(--card))',
          border: '1px solid rgb(var(--border))',
          borderLeft: '3px solid rgb(var(--primary) / 0.4)',
          fontSize: '0.9rem', lineHeight: 1.75,
          fontFamily: 'var(--font-body)',
          boxShadow: 'var(--shadow-sm)',
          color: 'rgb(var(--foreground))',
        }}>
          {displayText
            ? renderContent(displayText)
            : <span style={{ color: 'rgb(var(--muted-foreground))' }}>…</span>
          }

          {/* Streaming cursor */}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: 2, height: '1em',
              background: 'rgb(var(--primary))',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'tm-blink 0.8s step-end infinite',
            }} />
          )}
        </div>

        {/* Misconception flags */}
        {!isStreaming && misconceptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {misconceptions.map((m, i) => (
              <div
                key={i}
                className="tm-misconception-flag flex items-start gap-1.5"
                style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              >
                <span>⚠</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}