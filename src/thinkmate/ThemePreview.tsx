// ThemePreview.tsx
// Drop this into any page to visually verify the full theme is working correctly.
// Remove in production.

import { cn } from '@/lib/utils'

const levels = ['novice', 'developing', 'proficient', 'advanced'] as const
const hintTiers = [1, 2, 3] as const

export function ThemePreview() {
  return (
    <div className="min-h-screen p-8 space-y-10" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Header ── */}
      <div className="space-y-1">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'rgb(var(--foreground))' }}>
          ThinkMate
        </h1>
        <p style={{ color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Module 1 — Theme Preview · All tokens verified below
        </p>
      </div>

      {/* ── Color Palette ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Color Tokens</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'background',   var: 'var(--background)' },
            { name: 'card',         var: 'var(--card)' },
            { name: 'primary',      var: 'var(--primary)' },
            { name: 'secondary',    var: 'var(--secondary)' },
            { name: 'accent',       var: 'var(--accent)' },
            { name: 'muted',        var: 'var(--muted)' },
            { name: 'destructive',  var: 'var(--destructive)' },
            { name: 'border',       var: 'var(--border)' },
          ].map(({ name, var: cssVar }) => (
            <div key={name} className="space-y-1">
              <div
                className="h-12 rounded-lg border"
                style={{
                  background: `rgb(${cssVar.replace('var(', '').replace(')', '')})`,
                  borderColor: 'rgb(var(--border))',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Typography</h2>
        <div className="space-y-2" style={{ padding: '1.5rem', background: 'rgb(var(--card))', borderRadius: 'var(--radius)', border: '1px solid rgb(var(--border))' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600 }}>
            Lora — Display / Headings
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'rgb(var(--muted-foreground))' }}>
            "The mind is not a vessel to be filled, but a fire to be kindled." — Plutarch
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', marginTop: '0.75rem' }}>
            IBM Plex Sans — Body / UI. Clear, technical, warm. Used for all student input, AI responses, and interface labels.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', marginTop: '0.5rem' }}>
            IBM Plex Mono — Code / math expressions / session IDs
          </p>
        </div>
      </section>

      {/* ── Understanding Level Badges ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Understanding Levels</h2>
        <div className="flex gap-3 flex-wrap">
          {levels.map(level => (
            <span
              key={level}
              className={cn('tm-level-' + level)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'calc(var(--radius) * 0.6)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {level}
            </span>
          ))}
        </div>
      </section>

      {/* ── Chat Bubbles ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Conversation Bubbles</h2>
        <div className="space-y-3 max-w-lg">
          <div className="tm-question-card tm-animate-in">
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(var(--primary))', marginBottom: '0.25rem' }}>
              ThinkMate
            </p>
            <p>You mentioned that force equals mass times acceleration. Can you tell me — what happens to acceleration if we double the mass but keep the same force applied?</p>
          </div>
          <div className="tm-response-bubble ml-auto max-w-sm">
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: 0.75, marginBottom: '0.25rem' }}>
              You
            </p>
            <p>Hmm, I think acceleration would increase because there's more mass involved...</p>
          </div>
        </div>
      </section>

      {/* ── Hint Tiers ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Hint Tiers</h2>
        <div className="space-y-2 max-w-lg">
          {hintTiers.map(tier => (
            <div
              key={tier}
              className={cn('tm-question-card', `tm-hint-tier-${tier}`)}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Hint {tier} — {tier === 1 ? 'Minimal Guidance' : tier === 2 ? 'Conceptual Hint' : 'Structured Hint'}
              </p>
              <p style={{ color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem' }}>
                {tier === 1 && 'Think about what the formula F = ma is actually telling you. Which variable is on which side?'}
                {tier === 2 && 'Remember that F, m, and a have a proportional relationship. If F stays constant and m increases, what must happen to a?'}
                {tier === 3 && 'Try this: write out F = ma, then solve for a. Now substitute double the mass. What do you get?'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Misconception Flag ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Misconception Flag</h2>
        <div className="tm-misconception-flag max-w-lg">
          ⚠ Possible misconception detected: confusion between direct and inverse proportionality
        </div>
      </section>

      {/* ── AI Thinking Indicator ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>AI Thinking State</h2>
        <div className="flex items-center gap-2" style={{ padding: '0.875rem 1.25rem', background: 'rgb(var(--muted))', borderRadius: 'var(--radius)', width: 'fit-content' }}>
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', marginLeft: '4px' }}>Analyzing your reasoning…</span>
        </div>
      </section>

      {/* ── Shadow Tokens ── */}
      <section className="space-y-3">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Shadows</h2>
        <div className="flex gap-6">
          {['var(--shadow-sm)', 'var(--shadow-md)', 'var(--shadow-lg)'].map((s, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--radius)',
                background: 'rgb(var(--card))',
                boxShadow: s,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'rgb(var(--muted-foreground))',
              }}
            >
              {['sm', 'md', 'lg'][i]}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}