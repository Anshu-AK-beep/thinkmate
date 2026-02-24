import { useNavigate }  from 'react-router-dom'
import { ArrowRight, Brain, Lightbulb, TrendingUp, MessageSquare, BookOpen, Zap } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Real Mentor Conversations',
    desc: 'ThinkMate responds like a teacher — acknowledging your thinking, sharing relatable real-life analogies, then pushing you deeper with one focused question.',
  },
  {
    icon: Brain,
    title: 'Misconception Detection',
    desc: 'The AI reads your reasoning carefully and identifies exactly where your thinking breaks down — not just that you\'re wrong, but why.',
  },
  {
    icon: TrendingUp,
    title: 'Adaptive Understanding Levels',
    desc: 'Every response you give is analysed. Your understanding level updates in real time from Novice to Advanced as your reasoning improves.',
  },
  {
    icon: Lightbulb,
    title: 'Graduated Hint System',
    desc: 'Stuck? Request a hint. Tier 1 orients you. Tier 2 explains the concept. Tier 3 shows a similar worked example. Never the answer — always your reasoning.',
  },
  {
    icon: BookOpen,
    title: 'Your Own Problems Too',
    desc: 'Don\'t just use sample problems — type in your own doubt from class, homework, or exam prep. ThinkMate works on any question.',
  },
  {
    icon: Zap,
    title: 'Full Session History',
    desc: 'Every conversation is saved. Come back later, pick up where you left off, and continue reasoning with full context intact.',
  },
]

const subjects = [
  { emoji: '∑', label: 'Mathematics', desc: 'Algebra, geometry, probability' },
  { emoji: '⚗', label: 'Science',     desc: 'Physics, chemistry, biology' },
  { emoji: '◈', label: 'General',     desc: 'Logic & critical reasoning' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(var(--background))',
      color: 'rgb(var(--foreground))',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        display: 'flex', alignItems: 'center', padding: '0 clamp(20px, 5vw, 48px)',
        background: 'rgb(var(--background) / 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgb(var(--border))',
        zIndex: 50,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem',
        }}>
          Think<span style={{ color: 'rgb(var(--primary))' }}>Mate</span>
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <span style={{
            fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))',
            display: 'none',  // hidden on very small screens — handled via flex
          }}>
            Free · No signup needed
          </span>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
            style={{
              padding: '7px 18px', borderRadius: 'var(--radius)',
              background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem',
            }}
          >
            Start Learning
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: 'clamp(80px, 15vw, 120px)',
        paddingBottom: 'clamp(48px, 8vw, 80px)',
        paddingLeft: 'clamp(20px, 5vw, 48px)',
        paddingRight: 'clamp(20px, 5vw, 48px)',
        textAlign: 'center',
        maxWidth: 700,
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2"
          style={{
            padding: '5px 14px', borderRadius: 999, marginBottom: 28,
            border: '1px solid rgb(var(--primary) / 0.3)',
            background: 'rgb(var(--primary) / 0.06)',
            fontSize: '0.75rem', color: 'rgb(var(--primary))', fontWeight: 500,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--accent))', display: 'inline-block' }} />
          Built for Indian students · CBSE, ICSE & State Boards
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 5vw, 3.25rem)',
          fontWeight: 700, lineHeight: 1.15,
          color: 'rgb(var(--foreground))', marginBottom: 20,
        }}>
          The AI mentor that asks{' '}
          <span style={{ color: 'rgb(var(--primary))', fontStyle: 'italic' }}>questions</span>,
          not answers.
        </h1>

        <p style={{
          fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
          color: 'rgb(var(--muted-foreground))', lineHeight: 1.7, marginBottom: 36,
        }}>
          ThinkMate analyses how you reason, shares real-life analogies to build intuition,
          and guides you to the answer through conversation — never just handing it to you.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
            style={{
              padding: '12px 28px', borderRadius: 'var(--radius)',
              background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600,
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            Try a problem now
            <ArrowRight size={16} />
          </button>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>
            Free · No signup needed
          </span>
        </div>
      </section>

      {/* Subjects */}
      <section style={{
        padding: '0 clamp(20px, 5vw, 48px) clamp(48px, 8vw, 80px)',
        maxWidth: 700, margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
        }}>
          {subjects.map(s => (
            <div key={s.label} style={{
              padding: '20px 18px', borderRadius: 'var(--radius)',
              border: '1px solid rgb(var(--border))',
              background: 'rgb(var(--card))', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.75rem',
                color: 'rgb(var(--primary))', marginBottom: 8,
              }}>
                {s.emoji}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: 'clamp(40px, 6vw, 64px) clamp(20px, 5vw, 48px)',
        background: 'rgb(var(--muted) / 0.3)',
        borderTop: '1px solid rgb(var(--border))',
        borderBottom: '1px solid rgb(var(--border))',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', textAlign: 'center',
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700,
            marginBottom: 'clamp(28px, 5vw, 48px)',
          }}>
            How ThinkMate works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
          }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                padding: '22px 20px', borderRadius: 'var(--radius)',
                border: '1px solid rgb(var(--border))',
                background: 'rgb(var(--card))', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 'calc(var(--radius) * 0.75)',
                  background: 'rgb(var(--primary) / 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Icon size={16} color="rgb(var(--primary))" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: '0.9375rem',
                  fontWeight: 600, marginBottom: 8,
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', lineHeight: 1.65,
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote + CTA */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 48px)',
        textAlign: 'center',
        maxWidth: 560, margin: '0 auto',
      }}>
        <blockquote style={{
          padding: '24px 28px', borderRadius: 'var(--radius)',
          background: 'rgb(var(--card))',
          border: '1px solid rgb(var(--border))',
          boxShadow: 'var(--shadow-sm)', marginBottom: 36,
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
            fontStyle: 'italic', lineHeight: 1.65, marginBottom: 12,
          }}>
            "The mind is not a vessel to be filled, but a fire to be kindled."
          </p>
          <cite style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', fontStyle: 'normal' }}>
            — Plutarch
          </cite>
        </blockquote>

        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 mx-auto"
          style={{
            padding: '12px 32px', borderRadius: 'var(--radius)',
            background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Start thinking
          <ArrowRight size={16} />
        </button>

        <p style={{
          marginTop: 32, fontSize: '0.75rem',
          color: 'rgb(var(--muted-foreground))', lineHeight: 1.6,
        }}>
          ThinkMate · MVP Demo · Built for hackathon<br />
          <span style={{ color: 'rgb(var(--accent))', fontWeight: 500 }}>
            No answers. Only better questions.
          </span>
        </p>
      </section>
    </div>
  )
}