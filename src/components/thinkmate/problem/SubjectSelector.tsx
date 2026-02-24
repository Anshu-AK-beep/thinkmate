import { useState } from 'react'
import { ArrowRight, Calculator, FlaskConical, Brain, PenLine, BookOpen } from 'lucide-react'
import { SUBJECTS, getProblemsBySubject } from '@/data/sampleProblem'
import type { Subject } from '@/types'
import type { Problem } from '@/data/sampleProblem'

interface SubjectSelectorProps {
  onSelectProblem: (problem: Problem) => void
  error?: string | null
}

const subjectIcons = {
  mathematics: Calculator,
  science:     FlaskConical,
  general:     Brain,
}

type Tab = 'samples' | 'custom'

export function SubjectSelector({ onSelectProblem, error }: SubjectSelectorProps) {
  const [activeTab,    setActiveTab]    = useState<Tab>('samples')
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null)

  // Custom problem state
  const [customSubject, setCustomSubject] = useState<Subject>('general')
  const [customText,    setCustomText]    = useState('')
  const charCount = customText.trim().length
  const isReady   = charCount >= 20

  const problems = activeSubject ? getProblemsBySubject(activeSubject) : []

  const handleCustomSubmit = () => {
    if (!isReady) return
    const problem: Problem = {
      id:        'custom-' + Math.random().toString(36).slice(2, 8),
      subject:   customSubject,
      topic:     'Your Question',
      grade:     'Custom',
      statement: customText.trim(),
    }
    onSelectProblem(problem)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 40px',
        overflowY: 'auto',
        background: 'rgb(var(--background))',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 520 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.875rem',
            fontWeight: 700,
            color: 'rgb(var(--foreground))',
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          What are you thinking about today?
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'rgb(var(--muted-foreground))', lineHeight: 1.6 }}>
          Pick a sample problem or ask your own doubt — ThinkMate will guide you through reasoning, not give you the answer.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="tm-misconception-flag"
          style={{ marginBottom: 20, maxWidth: 640, width: '100%' }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 'var(--radius)',
          background: 'rgb(var(--muted))',
          marginBottom: 28,
        }}
      >
        {([
          { key: 'samples', label: 'Sample Problems', icon: BookOpen },
          { key: 'custom',  label: 'Ask Your Own',    icon: PenLine  },
        ] as { key: Tab; label: string; icon: typeof BookOpen }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex items-center gap-2"
            style={{
              padding: '8px 18px',
              borderRadius: 'calc(var(--radius) * 0.75)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              background: activeTab === key ? 'rgb(var(--background))' : 'transparent',
              color: activeTab === key ? 'rgb(var(--foreground))' : 'rgb(var(--muted-foreground))',
              boxShadow: activeTab === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Sample Problems ── */}
      {activeTab === 'samples' && (
        <div style={{ width: '100%', maxWidth: 680 }}>
          {/* Subject cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 28,
            }}
          >
            {SUBJECTS.map(subject => {
              const Icon     = subjectIcons[subject.value]
              const isActive = activeSubject === subject.value
              return (
                <button
                  key={subject.value}
                  onClick={() => setActiveSubject(subject.value)}
                  style={{
                    padding: '18px 16px',
                    borderRadius: 'var(--radius)',
                    border: isActive
                      ? '2px solid rgb(var(--primary))'
                      : '1.5px solid rgb(var(--border))',
                    background: isActive ? 'rgb(var(--primary) / 0.06)' : 'rgb(var(--card))',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s',
                    boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--primary) / 0.4)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'
                  }}
                >
                  <div
                    style={{
                      width: 36, height: 36,
                      borderRadius: 'calc(var(--radius) * 0.75)',
                      background: isActive ? 'rgb(var(--primary))' : 'rgb(var(--muted))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, transition: 'background 0.18s',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'rgb(var(--primary-foreground))' : 'rgb(var(--muted-foreground))'} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 3 }}>
                    {subject.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', lineHeight: 1.4 }}>
                    {subject.description}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Problem list */}
          {activeSubject && (
            <div className="tm-animate-in">
              <p style={{
                fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgb(var(--muted-foreground))', fontWeight: 600, marginBottom: 10,
              }}>
                Choose a problem
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {problems.map(problem => (
                  <button
                    key={problem.id}
                    onClick={() => onSelectProblem(problem)}
                    className="flex items-start justify-between gap-4"
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius)',
                      border: '1.5px solid rgb(var(--border))',
                      background: 'rgb(var(--card))',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.18s', boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgb(var(--primary) / 0.35)'
                      el.style.boxShadow   = 'var(--shadow-md)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgb(var(--border))'
                      el.style.boxShadow   = 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span style={{
                          fontSize: '0.6875rem', padding: '2px 7px',
                          borderRadius: 'calc(var(--radius) * 0.5)',
                          background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))', fontWeight: 500,
                        }}>
                          {problem.topic}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))' }}>
                          {problem.grade}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem', color: 'rgb(var(--foreground))',
                        lineHeight: 1.55, fontFamily: 'var(--font-display)',
                      }}>
                        {problem.statement}
                      </p>
                    </div>
                    <ArrowRight size={15} style={{ color: 'rgb(var(--primary))', flexShrink: 0, marginTop: 4 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!activeSubject && (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              border: '1px dashed rgb(var(--border))', borderRadius: 'var(--radius)',
              color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem',
            }}>
              Select a subject above to see problems
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Ask Your Own ── */}
      {activeTab === 'custom' && (
        <div className="tm-animate-in" style={{ width: '100%', maxWidth: 640 }}>

          {/* Subject picker */}
          <p style={{
            fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgb(var(--muted-foreground))', fontWeight: 600, marginBottom: 10,
          }}>
            Subject
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {SUBJECTS.map(s => {
              const Icon     = subjectIcons[s.value]
              const isActive = customSubject === s.value
              return (
                <button
                  key={s.value}
                  onClick={() => setCustomSubject(s.value)}
                  className="flex items-center gap-2"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius)',
                    border: isActive ? '1.5px solid rgb(var(--primary))' : '1.5px solid rgb(var(--border))',
                    background: isActive ? 'rgb(var(--primary) / 0.08)' : 'rgb(var(--card))',
                    color: isActive ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.15s',
                  }}
                >
                  <Icon size={13} />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Doubt input */}
          <p style={{
            fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgb(var(--muted-foreground))', fontWeight: 600, marginBottom: 10,
          }}>
            Your Question or Doubt
          </p>
          <div
            style={{
              border: `1.5px solid ${isReady ? 'rgb(var(--primary) / 0.4)' : 'rgb(var(--border))'}`,
              borderRadius: 'var(--radius)',
              background: 'rgb(var(--card))',
              boxShadow: isReady ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.2s',
              marginBottom: 12,
            }}
          >
            <textarea
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder={
                customSubject === 'mathematics'
                  ? "e.g. I don't understand why a negative times a negative gives a positive. Can you help me reason through it?"
                  : customSubject === 'science'
                  ? "e.g. Why does ice float on water? I thought solids are always denser than liquids..."
                  : "e.g. I'm confused about how to spot a logical fallacy in an argument. What should I look for?"
              }
              rows={5}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', fontFamily: 'var(--font-body)',
                fontSize: '0.9rem', lineHeight: 1.65,
                color: 'rgb(var(--foreground))',
              }}
            />
            <div style={{
              padding: '6px 14px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{
                fontSize: '0.6875rem', fontFamily: 'var(--font-mono)',
                color: charCount > 0 ? 'rgb(var(--muted-foreground))' : 'transparent',
              }}>
                {charCount} chars {charCount < 20 && charCount > 0 && `— ${20 - charCount} more needed`}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))' }}>
                Be specific — the more context, the better the questions
              </span>
            </div>
          </div>

          <button
            onClick={handleCustomSubmit}
            disabled={!isReady}
            className="flex items-center justify-center gap-2 w-full"
            style={{
              padding: '11px 20px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: isReady ? 'rgb(var(--primary))' : 'rgb(var(--muted))',
              color: isReady ? 'rgb(var(--primary-foreground))' : 'rgb(var(--muted-foreground))',
              cursor: isReady ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem',
              boxShadow: isReady ? 'var(--shadow-md)' : 'none',
              transition: 'all 0.18s',
            }}
          >
            <ArrowRight size={16} />
            Start Reasoning Session
          </button>

          <p style={{
            textAlign: 'center', marginTop: 12,
            fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', fontStyle: 'italic',
          }}>
            ThinkMate will never just give you the answer — it will ask questions until you find it yourself.
          </p>
        </div>
      )}
    </div>
  )
}