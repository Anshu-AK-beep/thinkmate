// src/components/thinkmate/problem/PdfPreviewModal.tsx
// Shows a browser-native PDF preview in a modal with download button.

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface PdfPreviewModalProps {
  blobUrl:  string
  filename: string
  onClose:  () => void
  onDownload: () => void
}

export function PdfPreviewModal({
  blobUrl, filename, onClose, onDownload,
}: PdfPreviewModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 201,
        top: '5vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(760px, 94vw)', height: '88vh',
        borderRadius: 'var(--radius)',
        background: 'rgb(var(--card))',
        border: '1px solid rgb(var(--border))',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', flexShrink: 0,
          borderBottom: '1px solid rgb(var(--border))',
          background: 'rgb(var(--background))',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Session Summary</div>
            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', marginTop: 1 }}>
              {filename}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Download button */}
            <button
              onClick={onDownload}
              className="flex items-center gap-2"
              style={{
                padding: '7px 14px', borderRadius: 'var(--radius)',
                background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.8125rem',
                boxShadow: 'var(--shadow-sm)', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Download size={13} />
              Download PDF
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius)', border: '1px solid rgb(var(--border))',
                background: 'transparent', cursor: 'pointer',
                color: 'rgb(var(--muted-foreground))', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted))'
                ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--foreground))'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--muted-foreground))'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <iframe
          src={blobUrl}
          title="Session PDF Preview"
          style={{ flex: 1, border: 'none', background: '#525659' }}
        />
      </div>
    </>
  )
}