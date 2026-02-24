import { useState }   from 'react'
import {
  BookOpen, RotateCcw, Tag, RefreshCw,
  Download, Eye, Loader2, Share2, Check, Copy,
} from 'lucide-react'
import type { Problem } from '@/data/sampleProblem'
import type { Session, UnderstandingLevel } from '@/types'
import { useAuth }          from '@/contexts/AuthContext'
import { PdfPreviewModal }  from './PdfPreviewModal'
import { createShare }      from '@/lib/api'

interface ProblemCardProps {
  problem:          Problem
  session:          Session
  currentLevel:     UnderstandingLevel
  messageCount:     number
  hintsUsed:        number
  maxHints:         number
  onEndSession:     () => void
  isReviewSession?: boolean
}

const levelMeta: Record<UnderstandingLevel, { label: string; desc: string }> = {
  novice:     { label: 'Novice',     desc: "Keep exploring — you're just getting started." },
  developing: { label: 'Developing', desc: "Good progress! You're on the right track." },
  proficient: { label: 'Proficient', desc: 'Strong reasoning. One more push to get there.' },
  advanced:   { label: 'Advanced',   desc: '🎯 Outstanding! You\'ve mastered this concept.' },
}
const progressPercent: Record<UnderstandingLevel, number> = {
  novice: 20, developing: 50, proficient: 85, advanced: 100,
}
const hintLabels: Record<number, string> = {
  1: 'Orientation', 2: 'Concept', 3: 'Worked Example',
}

export function ProblemCard({
  problem, session, currentLevel, messageCount,
  hintsUsed, maxHints, onEndSession, isReviewSession,
}: ProblemCardProps) {
  const { user }   = useAuth()
  const level      = levelMeta[currentLevel]
  const progress   = progressPercent[currentLevel]

  const [exporting,  setExporting]  = useState(false)
  const [sharing,    setSharing]    = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)
  const [shareUrl,   setShareUrl]   = useState<string | null>(null)
  const [preview,    setPreview]    = useState<{
    blobUrl: string; filename: string; download: () => void
  } | null>(null)

  // ── PDF preview ──────────────────────────────────────────────
  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const { exportSessionPdf } = await import('@/lib/exportPDF')
      const name = (user?.user_metadata?.full_name as string)
        || user?.email?.split('@')[0] || 'Student'
      const result = await exportSessionPdf(session, name)
      setPreview(result)
    } catch (err) {
      console.error('[export]', err)
    } finally {
      setExporting(false)
    }
  }

  const closePreview = () => {
    if (preview?.blobUrl) URL.revokeObjectURL(preview.blobUrl)
    setPreview(null)
  }

  // ── Share online ─────────────────────────────────────────────
  const handleShare = async () => {
    if (sharing || messageCount === 0) return
    setSharing(true)
    setShareError(null)
    try {
      const name = (user?.user_metadata?.full_name as string)
        || user?.email?.split('@')[0] || 'Student'

      // Sanitize snapshot — ensure all dates are strings, no circular refs
      const snapshot = JSON.parse(JSON.stringify({
        id:           session.id,
        problem:      session.problem,
        subject:      session.subject,
        currentLevel: session.currentLevel,
        hintsUsed:    session.hintsUsed,
        maxHints:     session.maxHints,
        isComplete:   session.isComplete,
        startedAt:    session.startedAt instanceof Date
          ? session.startedAt.toISOString()
          : String(session.startedAt),
        messages: session.messages.map(m => ({
          id:       m.id,
          role:     m.role,
          content:  m.content,
          metadata: m.metadata ?? null,
        })),
        studentName: name,
      }))

      const res = await createShare(session.id, snapshot)
      setShareUrl(res.shareUrl)
      await navigator.clipboard.writeText(res.shareUrl).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('[share] failed:', err)
      const msg = err instanceof Error ? err.message : 'Failed to create share link'
      setShareError(msg)
    } finally {
      setSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {preview && (
        <PdfPreviewModal
          blobUrl={preview.blobUrl}
          filename={preview.filename}
          onClose={closePreview}
          onDownload={preview.download}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '20px', gap: 16, overflowY: 'auto',
      }}>

        {/* Review banner */}
        {isReviewSession && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius)',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <RefreshCw size={14} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
                Spaced Repetition Review
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                This problem is due for review. Continue where you left off!
              </div>
            </div>
          </div>
        )}

        {/* Problem header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={13} color="#10b981" />
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981', fontWeight: 600 }}>
              Problem
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: '0.75rem', padding: '2px 8px', borderRadius: '0.375rem',
              background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 500, textTransform: 'capitalize',
            }}>
              {problem.subject}
            </span>
            {problem.topic && problem.topic !== 'Active Problem' && (
              <span style={{
                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '0.375rem',
                background: '#f1f5f9', color: '#64748b',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Tag size={10} />{problem.topic}
              </span>
            )}
          </div>

          <div style={{
            padding: '14px 16px', borderRadius: 'var(--radius)',
            background: '#fff', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', lineHeight: 1.7, margin: 0 }}>
              {problem.statement}
            </p>
          </div>
        </div>

        {/* Level */}
        <div style={{ padding: '14px 16px', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Understanding Level</span>
            <span className={`tm-level-${currentLevel}`} style={{ fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '0.375rem', fontWeight: 600 }}>
              {level.label}
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: 4,
              background: '#10b981', transition: 'width 0.7s ease',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>{level.desc}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[{ label: 'Responses', value: messageCount }, { label: 'Hints Used', value: `${hintsUsed} / ${maxHints}` }].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', background: '#fff', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: '#10b981', lineHeight: 1, marginBottom: 3 }}>{value}</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Hint tiers */}
        <div>
          <p style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Hint Tiers
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map(tier => {
              const used = hintsUsed >= tier
              return (
                <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: used ? '#10b981' : '#e2e8f0' }} />
                  <span style={{ fontSize: '0.75rem', color: used ? '#0f172a' : '#64748b', textDecoration: used ? 'line-through' : 'none', opacity: used ? 0.6 : 1 }}>
                    {tier}. {hintLabels[tier]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Row 1: Preview + Download */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleExport} disabled={exporting || messageCount === 0}
              style={{
                flex: 1, padding: '9px 10px', borderRadius: 'var(--radius)',
                border: '1px solid rgba(16,185,129,0.3)',
                background: exporting ? '#f1f5f9' : 'rgba(16,185,129,0.07)',
                cursor: exporting || messageCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                color: exporting ? '#64748b' : '#10b981', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: messageCount === 0 ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              {exporting ? <><Loader2 size={12} className="animate-spin" />Building…</> : <><Eye size={12} />Preview PDF</>}
            </button>
            {preview && (
              <button onClick={preview.download} style={{
                padding: '9px 12px', borderRadius: 'var(--radius)',
                border: '1px solid #10b981', background: '#10b981', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                fontSize: '0.8rem', fontWeight: 500,
              }}>
                <Download size={12} />
              </button>
            )}
          </div>

          {/* Row 2: Share online */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {shareError && (
              <div style={{
                fontSize: '0.75rem', color: '#f43f5e', padding: '7px 10px',
                borderRadius: 'var(--radius)', background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.2)',
              }}>
                ⚠ {shareError}
              </div>
            )}
            <button
              onClick={handleShare} disabled={sharing || messageCount === 0}
              style={{
                width: '100%', padding: '9px 10px', borderRadius: 'var(--radius)',
                border: '1px solid rgba(99,102,241,0.3)',
                background: sharing ? '#f1f5f9' : 'rgba(99,102,241,0.07)',
                cursor: sharing || messageCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                color: sharing ? '#64748b' : '#6366f1', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: messageCount === 0 ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              {sharing
                ? <><Loader2 size={12} className="animate-spin" />Creating link…</>
                : <><Share2 size={12} />{shareUrl ? 'Regenerate Link' : 'Share Online'}</>
              }
            </button>

            {/* Share URL display */}
            {shareUrl && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', borderRadius: 'var(--radius)',
                background: '#f8fafc', border: '1px solid #e2e8f0',
              }}>
                <span style={{
                  flex: 1, fontSize: '0.7rem', color: '#64748b',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '4px 8px', borderRadius: '0.375rem', flexShrink: 0,
                    border: '1px solid #e2e8f0', background: copied ? '#dcfce7' : '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.75rem', color: copied ? '#16a34a' : '#64748b', transition: 'all 0.2s',
                  }}
                >
                  {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                </button>
              </div>
            )}
          </div>

          {/* End session */}
          <button
            onClick={onEndSession}
            style={{
              width: '100%', padding: '9px 16px', borderRadius: 'var(--radius)',
              border: '1px solid #e2e8f0', background: 'transparent',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
              color: '#64748b', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,63,94,0.4)'
              ;(e.currentTarget as HTMLElement).style.color = '#f43f5e'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'
              ;(e.currentTarget as HTMLElement).style.color = '#64748b'
            }}
          >
            <RotateCcw size={13} />
            {isReviewSession ? 'End Review & Schedule Next' : 'End Session & Choose New Problem'}
          </button>
        </div>
      </div>
    </>
  )
}