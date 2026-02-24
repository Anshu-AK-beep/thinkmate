import { useEffect, useState }     from 'react'
import { useNavigate }             from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Brain, TrendingUp, BookOpen, Lightbulb, Target } from 'lucide-react'
import { useAuth }        from '@/contexts/AuthContext'
import { setTokenGetter } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────
interface AnalyticsData {
  summary: {
    totalSessions:      number
    completedSessions:  number
    advancedSessions:   number
    totalHints:         number
    avgHintsPerSession: number
    sessionsWithHints:  number
  }
  levelProgression:  { date: string; level: string; numeric: number }[]
  sessionActivity:   { date: string; count: number }[]
  subjectBreakdown:  { subject: string; count: number; percentage: number }[]
  topMisconceptions: { text: string; count: number }[]
  hintUsage: {
    total:      number
    byTier:     { tier: number; label: string; count: number }[]
    noHintRate: number
  }
  levelDistribution: { level: string; count: number; percentage: number }[]
}

// ── Colors ────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  novice:     '#94a3b8',
  developing: '#f59e0b',
  proficient: '#6366f1',
  advanced:   '#10b981',
}

const SUBJECT_COLORS = ['#6366f1', '#f59e0b', '#10b981']

const LEVEL_LABELS: Record<string, string> = {
  novice: 'Novice', developing: 'Developing',
  proficient: 'Proficient', advanced: 'Advanced',
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'var(--primary)' }: {
  icon:   React.ElementType
  label:  string
  value:  string | number
  sub?:   string
  color?: string
}) {
  return (
    <div style={{
      padding: '20px', borderRadius: 'var(--radius)',
      border: '1px solid rgb(var(--border))',
      background: 'rgb(var(--card))', boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="flex items-center gap-3 mb-3">
        <div style={{
          width: 36, height: 36, borderRadius: 'calc(var(--radius) * 0.75)',
          background: `rgb(${color} / 0.1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={`rgb(${color})`} />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem',
        fontWeight: 700, color: 'rgb(var(--foreground))', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Chart section wrapper ──────────────────────────────────────
function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '24px', borderRadius: 'var(--radius)',
      border: '1px solid rgb(var(--border))',
      background: 'rgb(var(--card))', boxShadow: 'var(--shadow-sm)',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: '0.9375rem',
        fontWeight: 600, marginBottom: 20,
        color: 'rgb(var(--foreground))',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius)',
      background: 'rgb(var(--card))',
      border: '1px solid rgb(var(--border))',
      boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: 'rgb(var(--foreground))' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{
      height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem', fontStyle: 'italic',
      border: '1px dashed rgb(var(--border))', borderRadius: 'var(--radius)',
    }}>
      {message}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export function AnalyticsPage() {
  const navigate        = useNavigate()
  const { getToken }    = useAuth()
  const [data,     setData]     = useState<AnalyticsData | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    setTokenGetter(getToken)
    async function fetchAnalytics() {
    try {
      const token = await getToken()
      const res   = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/analytics`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
    fetchAnalytics()
  }, [getToken])

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgb(var(--background))', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
        </div>
        <p style={{ color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Loading your analytics…
        </p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgb(var(--background))', flexDirection: 'column', gap: 16,
      }}>
        <p style={{ color: 'rgb(var(--destructive))' }}>{error ?? 'No data'}</p>
        <button onClick={() => navigate('/app')} style={{
          padding: '8px 18px', borderRadius: 'var(--radius)',
          background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
          Back to App
        </button>
      </div>
    )
  }

  const { summary, levelProgression, sessionActivity, subjectBreakdown,
          topMisconceptions, hintUsage, levelDistribution } = data

  // Level progression — map numeric to label for Y axis
  const levelTicks = [1, 2, 3, 4]
  const levelTickFormatter = (v: number) =>
    ['', 'Novice', 'Developing', 'Proficient', 'Advanced'][v] ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(var(--background))' }}>
      {/* Top bar */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 40px)',
        borderBottom: '1px solid rgb(var(--border))',
        background: 'rgb(var(--background))', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgb(var(--muted-foreground))', fontFamily: 'var(--font-body)',
            fontSize: '0.875rem', padding: '4px 8px',
            borderRadius: 'var(--radius)', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgb(var(--foreground))'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgb(var(--muted-foreground))'}
        >
          <ArrowLeft size={15} />
          Back to App
        </button>

        <div className="flex items-center gap-2 mx-auto">
          <Brain size={18} color="rgb(var(--primary))" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem' }}>
            Learning Analytics
          </span>
        </div>

        <div style={{ width: 100 }} /> {/* spacer to center title */}
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 1100, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* No data state */}
        {summary.totalSessions === 0 && (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            borderRadius: 'var(--radius)', border: '1px dashed rgb(var(--border))',
          }}>
            <Brain size={40} color="rgb(var(--muted-foreground))" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No sessions yet</h2>
            <p style={{ color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem', marginBottom: 20 }}>
              Complete a few sessions and come back to see your learning analytics.
            </p>
            <button onClick={() => navigate('/app')} style={{
              padding: '9px 22px', borderRadius: 'var(--radius)',
              background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
            }}>
              Start a session
            </button>
          </div>
        )}

        {summary.totalSessions > 0 && (
          <>
            {/* ── Summary stats ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 14,
            }}>
              <StatCard
                icon={Target} label="Total Sessions"
                value={summary.totalSessions}
                sub={`${summary.completedSessions} completed`}
                color="var(--primary)"
              />
              <StatCard
                icon={TrendingUp} label="Reached Advanced"
                value={summary.advancedSessions}
                sub={`${summary.totalSessions > 0 ? Math.round((summary.advancedSessions / summary.totalSessions) * 100) : 0}% of sessions`}
                color="var(--accent)"
              />
              <StatCard
                icon={Lightbulb} label="Hints Used"
                value={summary.totalHints}
                sub={`${summary.avgHintsPerSession} avg per session`}
                color="var(--secondary)"
              />
              <StatCard
                icon={BookOpen} label="Independent Sessions"
                value={`${hintUsage.noHintRate}%`}
                sub="solved without hints"
                color="var(--primary)"
              />
            </div>

            {/* ── Level progression over time ── */}
            <ChartSection title="📈 Understanding Level Progression">
              {levelProgression.length < 2 ? (
                <EmptyChart message="Need more sessions to show progression" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={levelProgression} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis
                      dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                      tickFormatter={d => d.slice(5)}  // show MM-DD only
                    />
                    <YAxis
                      domain={[0.5, 4.5]} ticks={levelTicks}
                      tickFormatter={levelTickFormatter}
                      tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                      width={80}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0]
                        return (
                          <div style={{
                            padding: '10px 14px', borderRadius: 'var(--radius)',
                            background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))',
                            boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem',
                          }}>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                            <p style={{ color: 'rgb(var(--primary))' }}>
                              {levelTickFormatter(p.value as number)}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone" dataKey="numeric"
                      stroke="rgb(var(--primary))" strokeWidth={2.5}
                      dot={{ fill: 'rgb(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartSection>

            {/* ── Session activity + Subject breakdown (side by side) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {/* Session activity */}
              <ChartSection title="📅 Sessions per Day">
                {sessionActivity.length === 0 ? (
                  <EmptyChart message="No activity data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessionActivity} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                      <XAxis
                        dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }}
                        tickFormatter={d => d.slice(5)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                        width={24}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Sessions" fill="rgb(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>

              {/* Subject breakdown */}
              <ChartSection title="📚 Subject Breakdown">
                {subjectBreakdown.length === 0 ? (
                  <EmptyChart message="No subject data yet" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={subjectBreakdown} dataKey="count"
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                        >
                          {subjectBreakdown.map((_, i) => (
                            <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _name, props) => [
                            `${value} sessions (${props.payload.percentage}%)`,
                            props.payload.subject,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {subjectBreakdown.map((s, i) => (
                        <div key={s.subject} className="flex items-center gap-2">
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                            background: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
                          }} />
                          <span style={{ fontSize: '0.875rem', textTransform: 'capitalize', fontWeight: 500 }}>
                            {s.subject}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>
                            {s.count} ({s.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ChartSection>
            </div>

            {/* ── Misconceptions + Hint usage (side by side) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {/* Top misconceptions */}
              <ChartSection title="⚠ Common Misconceptions">
                {topMisconceptions.length === 0 ? (
                  <EmptyChart message="No misconceptions detected yet — great work!" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topMisconceptions.map((m, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{
                            fontSize: '0.8125rem', color: 'rgb(var(--foreground))',
                            lineHeight: 1.4, flex: 1, paddingRight: 12,
                          }}>
                            {m.text}
                          </span>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                            color: 'rgb(var(--destructive))',
                          }}>
                            ×{m.count}
                          </span>
                        </div>
                        <div style={{
                          height: 4, borderRadius: 2,
                          background: 'rgb(var(--muted))', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.round((m.count / (topMisconceptions[0]?.count ?? 1)) * 100)}%`,
                            background: 'rgb(var(--destructive) / 0.6)',
                            borderRadius: 2, transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartSection>

              {/* Hint usage */}
              <ChartSection title="💡 Hint Usage">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* No-hint rate */}
                  <div style={{
                    padding: '14px 16px', borderRadius: 'var(--radius)',
                    background: 'rgb(var(--accent) / 0.08)',
                    border: '1px solid rgb(var(--accent) / 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sessions without hints</span>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                      fontWeight: 700, color: 'rgb(var(--accent))',
                    }}>
                      {hintUsage.noHintRate}%
                    </span>
                  </div>

                  {/* By tier */}
                  {hintUsage.byTier.map(t => (
                    <div key={t.tier}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          Tier {t.tier} — {t.label}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>
                          {t.count} sessions
                        </span>
                      </div>
                      <div style={{
                        height: 6, borderRadius: 3,
                        background: 'rgb(var(--muted))', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: summary.totalSessions > 0
                            ? `${Math.round((t.count / summary.totalSessions) * 100)}%`
                            : '0%',
                          background: `rgb(var(--hint-${t.tier}))`,
                          borderRadius: 3, transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartSection>
            </div>

            {/* ── Level distribution ── */}
            <ChartSection title="🎯 Overall Level Distribution">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
              }}>
                {levelDistribution.map(l => (
                  <div key={l.level} style={{
                    padding: '16px', borderRadius: 'var(--radius)',
                    border: `1px solid ${LEVEL_COLORS[l.level]}40`,
                    background: `${LEVEL_COLORS[l.level]}12`,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.75rem',
                      fontWeight: 700, color: LEVEL_COLORS[l.level], lineHeight: 1,
                    }}>
                      {l.count}
                    </div>
                    <div style={{
                      fontSize: '0.8125rem', fontWeight: 600, marginTop: 6,
                      color: LEVEL_COLORS[l.level], textTransform: 'capitalize',
                    }}>
                      {LEVEL_LABELS[l.level]}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>
                      {l.percentage}% of sessions
                    </div>
                  </div>
                ))}
              </div>
            </ChartSection>
          </>
        )}
      </main>
    </div>
  )
}