import { useState, useRef, useEffect } from 'react'
import { Send, Lightbulb } from 'lucide-react'

interface ReasoningInputProps {
  onSubmit:       (text: string) => void
  onHintRequest:  () => void
  remainingHints: number
  disabled?:      boolean
  placeholder?:   string
}

export function ReasoningInput({
  onSubmit,
  onHintRequest,
  remainingHints,
  disabled,
  placeholder = 'Explain your thinking… (Enter to send, Shift+Enter for new line)',
}: ReasoningInputProps) {
  const [value, setValue]   = useState('')
  const textareaRef         = useRef<HTMLTextAreaElement>(null)

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
    // Reset height after clear
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter alone → send
      e.preventDefault()
      handleSubmit()
    }
    // Shift+Enter → default browser behaviour (new line) — no preventDefault needed
  }

  const charCount = value.length
  const isReady   = charCount >= 10

  return (
    <div style={{
      borderTop: '1px solid rgb(var(--border))',
      padding: '14px 20px 16px',
      background: 'rgb(var(--background))',
      flexShrink: 0,
    }}>
      <div style={{
        border: `1.5px solid ${isReady ? 'rgb(var(--primary) / 0.4)' : 'rgb(var(--border))'}`,
        borderRadius: 'var(--radius)',
        background: 'rgb(var(--card))',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isReady ? 'var(--shadow-glow)' : 'none',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          style={{
            width: '100%',
            padding: '12px 14px 8px',
            background: 'transparent',
            border: 'none', outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem', lineHeight: 1.6,
            color: 'rgb(var(--foreground))',
            minHeight: 60,
          }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between" style={{ padding: '4px 10px 10px 14px' }}>
          <div className="flex items-center gap-3">
            <span style={{
              fontSize: '0.6875rem',
              color: charCount > 0 ? 'rgb(var(--muted-foreground))' : 'transparent',
              fontFamily: 'var(--font-mono)',
              transition: 'color 0.2s',
            }}>
              {charCount} chars
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))' }}>
              ↵ send · Shift+↵ new line
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hint button */}
            <button
              onClick={onHintRequest}
              disabled={remainingHints === 0 || disabled}
              className="flex items-center gap-1.5"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid rgb(var(--border))',
                background: 'transparent',
                cursor: remainingHints > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                color: remainingHints > 0 ? 'rgb(var(--secondary))' : 'rgb(var(--muted-foreground))',
                opacity: remainingHints > 0 ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              <Lightbulb size={13} />
              Hint {remainingHints > 0 ? `(${remainingHints} left)` : '(none left)'}
            </button>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!isReady || disabled}
              className="flex items-center gap-1.5"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: isReady && !disabled ? 'rgb(var(--primary))' : 'rgb(var(--muted))',
                color: isReady && !disabled ? 'rgb(var(--primary-foreground))' : 'rgb(var(--muted-foreground))',
                cursor: isReady && !disabled ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem',
                transition: 'all 0.15s',
                boxShadow: isReady && !disabled ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Send size={13} />
              Send
            </button>
          </div>
        </div>
      </div>

      <p style={{
        fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))',
        marginTop: 8, textAlign: 'center', fontStyle: 'italic',
      }}>
        There are no wrong answers here — only opportunities to think deeper.
      </p>
    </div>
  )
}