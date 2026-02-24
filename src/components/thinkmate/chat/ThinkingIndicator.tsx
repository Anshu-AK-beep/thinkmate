export function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '88%' }}>
      {/* Label */}
      <div className="flex items-center gap-2" style={{ paddingLeft: 4 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgb(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'rgb(var(--primary-foreground))',
            fontFamily: 'var(--font-display)',
          }}
        >
          T
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgb(var(--primary))' }}>
          ThinkMate
        </span>
      </div>

      {/* Thinking bubble */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '12px 18px',
          background: 'rgb(var(--bubble-ai))',
          borderLeft: '3px solid rgb(var(--primary))',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="tm-thinking-dot" />
        <div className="tm-thinking-dot" />
        <div className="tm-thinking-dot" />
        <span
          style={{
            fontSize: '0.8rem',
            color: 'rgb(var(--muted-foreground))',
            marginLeft: 4,
            fontStyle: 'italic',
          }}
        >
          Analyzing your reasoning…
        </span>
      </div>
    </div>
  )
}