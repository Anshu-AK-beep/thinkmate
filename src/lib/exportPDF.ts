// src/lib/exportPdf.ts
// Generates a PDF with: header, problem, stats, level progression,
// AND the full conversation history. Downloads + preview both supported.

import jsPDF from 'jspdf'
import type { Session, UnderstandingLevel } from '@/types'

const LEVEL_LABEL: Record<UnderstandingLevel, string> = {
  novice: 'Novice', developing: 'Developing',
  proficient: 'Proficient', advanced: 'Advanced',
}

const LEVEL_FILL: Record<UnderstandingLevel, [number, number, number]> = {
  novice:     [148, 163, 184],
  developing: [245, 158,  11],
  proficient: [ 16, 185, 129],
  advanced:   [ 34, 197,  94],
}

const PROGRESS_PCT: Record<UnderstandingLevel, number> = {
  novice: 20, developing: 50, proficient: 85, advanced: 100,
}

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: 'Mathematics', science: 'Science', general: 'General',
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function stripMarkdown(t: string) {
  return t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim()
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { lines.push(''); continue }
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length > maxChars && current) { lines.push(current); current = word }
      else current = candidate
    }
    if (current) lines.push(current)
  }
  return lines.length ? lines : ['']
}

export interface ExportResult {
  blobUrl:  string
  filename: string
  download: () => void
}

export async function exportSessionPdf(session: Session, studentName: string): Promise<ExportResult> {
  const doc    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const PAGE_W = 210
  const PAGE_H = 297
  const MX     = 16
  const CW     = PAGE_W - MX * 2
  const WRAP   = 84

  const C = {
    navy:       [15,  23,  42]  as [number,number,number],
    primary:    [16,  185, 129] as [number,number,number],
    accent:     [245, 158,  11] as [number,number,number],
    success:    [16,  185, 129] as [number,number,number],
    text:       [15,  23,  42]  as [number,number,number],
    muted:      [100, 116, 139] as [number,number,number],
    border:     [203, 213, 225] as [number,number,number],
    light:      [248, 250, 252] as [number,number,number],
    white:      [255, 255, 255] as [number,number,number],
    aiBg:       [236, 253, 245] as [number,number,number],
    studentBg:  [240, 253, 244] as [number,number,number],
    hintBg:     [255, 251, 235] as [number,number,number],
    red:        [239,  68,  68] as [number,number,number],
    card:       [255, 255, 255] as [number,number,number],
  }

  let y = 0

  function addPageHeader() {
    doc.setFillColor(...C.navy)
    doc.rect(0, 0, PAGE_W, 8, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.white)
    doc.text('ThinkMate Session Export', MX, 5.5)
    doc.text(studentName, PAGE_W - MX, 5.5, { align: 'right' })
    y = 14
  }

  function checkPage(needed: number) {
    if (y + needed > PAGE_H - 14) {
      doc.addPage()
      addPageHeader()
    }
  }

  // ── MAIN HEADER ──────────────────────────────────────────────
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, PAGE_W, 46, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...C.white)
  doc.text('ThinkMate', MX, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text('Session Summary Report', MX, 28)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(studentName, PAGE_W - MX, 17, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184)
  doc.text(formatDate(session.startedAt), PAGE_W - MX, 24, { align: 'right' })
  doc.text(formatTime(session.startedAt), PAGE_W - MX, 30, { align: 'right' })

  // Subject + level badges
  const lc = LEVEL_FILL[session.currentLevel]
  doc.setFillColor(...C.primary)
  doc.roundedRect(MX, 33, 36, 8, 1.5, 1.5, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
  doc.text(SUBJECT_LABEL[session.subject] ?? session.subject, MX + 18, 38.2, { align: 'center' })
  doc.setFillColor(...lc)
  doc.roundedRect(MX + 39, 33, 42, 8, 1.5, 1.5, 'F')
  doc.text(LEVEL_LABEL[session.currentLevel], MX + 60, 38.2, { align: 'center' })

  y = 56

  // ── PROBLEM ───────────────────────────────────────────────────
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
  doc.text('PROBLEM STATEMENT', MX, y); y += 4

  const probLines = wrapText(session.problem, WRAP)
  const probBoxH  = probLines.length * 5.8 + 12
  doc.setFillColor(...C.aiBg); doc.setDrawColor(...C.border)
  doc.roundedRect(MX, y, CW, probBoxH, 2.5, 2.5, 'FD')
  doc.setFillColor(...C.primary); doc.rect(MX, y, 3, probBoxH, 'F')
  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text)
  let ly = y + 8
  for (const l of probLines) { doc.text(l, MX + 8, ly); ly += 5.8 }
  y += probBoxH + 10

  // ── LEVEL CARD ────────────────────────────────────────────────
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
  doc.text('FINAL UNDERSTANDING LEVEL', MX, y); y += 4

  doc.setFillColor(...C.light); doc.setDrawColor(...C.border)
  doc.roundedRect(MX, y, CW, 28, 2.5, 2.5, 'FD')
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...lc)
  doc.text(LEVEL_LABEL[session.currentLevel], MX + 8, y + 11)
  const desc: Record<UnderstandingLevel, string> = {
    novice: 'Just getting started — keep exploring the concept.',
    developing: 'Good progress! You are on the right track.',
    proficient: 'Strong reasoning. A little more to fully master it.',
    advanced: 'Outstanding! You have mastered this concept.',
  }
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted)
  doc.text(desc[session.currentLevel], MX + 8, y + 19)
  const bx = MX + 8, bw = CW - 16, bh = 4, by = y + 22
  doc.setFillColor(...C.border); doc.roundedRect(bx, by, bw, bh, 1, 1, 'F')
  doc.setFillColor(...lc)
  doc.roundedRect(bx, by, (PROGRESS_PCT[session.currentLevel] / 100) * bw, bh, 1, 1, 'F')
  y += 38

  // ── STATS ROW ─────────────────────────────────────────────────
  const studentMsgs = session.messages.filter(m => m.role === 'student' && !m.content.startsWith('[Requested'))
  const aiMsgs      = session.messages.filter(m => m.role === 'ai')
  const allMisc     = aiMsgs.flatMap(m => m.metadata?.misconceptionsDetected ?? [])
  const uniqueMisc  = [...new Set(allMisc)]

  const stats = [
    { label: 'Responses',    value: String(studentMsgs.length) },
    { label: 'Hints Used',   value: `${session.hintsUsed}/${session.maxHints}` },
    { label: 'Misconceptions', value: String(uniqueMisc.length) },
    { label: 'Status',       value: session.isComplete ? 'Completed ✓' : 'In Progress' },
  ]
  const sw = (CW - 9) / 4
  stats.forEach((s, i) => {
    const bx2 = MX + i * (sw + 3)
    doc.setFillColor(...C.white); doc.setDrawColor(...C.border)
    doc.roundedRect(bx2, y, sw, 18, 2, 2, 'FD')
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
    doc.text(s.value, bx2 + sw / 2, y + 9, { align: 'center' })
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted)
    doc.text(s.label, bx2 + sw / 2, y + 15, { align: 'center' })
  })
  y += 24

  // ── LEVEL PROGRESSION ─────────────────────────────────────────
  const levelJourney: UnderstandingLevel[] = []
  for (const m of aiMsgs) {
    const lv = m.metadata?.understandingLevel
    if (lv && levelJourney.at(-1) !== lv) levelJourney.push(lv)
  }
  if (levelJourney.length > 1) {
    checkPage(22)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
    doc.text('LEVEL PROGRESSION', MX, y); y += 4
    doc.setFillColor(...C.light); doc.setDrawColor(...C.border)
    doc.roundedRect(MX, y, CW, 16, 2, 2, 'FD')
    const stepW = CW / levelJourney.length
    levelJourney.forEach((lv, i) => {
      const cx = MX + i * stepW + stepW / 2, cy = y + 7
      doc.setFillColor(...LEVEL_FILL[lv]); doc.circle(cx, cy, 3.5, 'F')
      doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LEVEL_FILL[lv])
      doc.text(LEVEL_LABEL[lv], cx, cy + 6.5, { align: 'center' })
      if (i < levelJourney.length - 1) {
        doc.setDrawColor(...C.border); doc.setLineWidth(0.4)
        doc.line(cx + 3.5, cy, cx + stepW - 3.5, cy)
      }
    })
    y += 22
  }

  // ── FULL CONVERSATION ─────────────────────────────────────────
  checkPage(20)
  y += 4
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
  doc.text('FULL CONVERSATION', MX, y)
  doc.setDrawColor(...C.border); doc.line(MX + 37, y - 1, MX + CW, y - 1)
  y += 6

  const convMsgs = session.messages.filter(m => m.role === 'student' || m.role === 'ai')

  for (const msg of convMsgs) {
    const isStudent = msg.role === 'student'
    const isHint    = isStudent && msg.content.startsWith('[Requested Hint')
    const content   = stripMarkdown(msg.content || '…')
    const misc      = msg.metadata?.misconceptionsDetected ?? []

    if (isHint) {
      // Hint request — amber italic note, centered
      checkPage(12)
      doc.setFillColor(...C.hintBg); doc.setDrawColor(245, 158, 11)
      doc.roundedRect(MX + CW * 0.15, y, CW * 0.7, 9, 2, 2, 'FD')
      doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.accent)
      doc.text(`💡 ${content}`, MX + CW / 2, y + 5.5, { align: 'center' })
      y += 13
      continue
    }

    const lines    = wrapText(content, isStudent ? WRAP - 12 : WRAP - 4)
    const boxH     = Math.max(lines.length * 5 + 12, 18)
    const miscH    = misc.length > 0 ? misc.length * 5 + 6 : 0

    checkPage(boxH + miscH + 4)

    if (isStudent) {
      // Student — right aligned green bubble
      const bw2 = CW * 0.78
      const bx2 = MX + CW - bw2
      doc.setFillColor(...C.studentBg); doc.setDrawColor(134, 239, 172)
      doc.roundedRect(bx2, y, bw2, boxH, 2, 2, 'FD')

      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.success)
      doc.text('You', bx2 + bw2 - 5, y + 5, { align: 'right' })

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text)
      let lineY2 = y + 9
      for (const l of lines) { doc.text(l, bx2 + 6, lineY2); lineY2 += 5 }
    } else {
      // AI — left aligned indigo-tinted bubble
      const bw2 = CW * 0.84
      doc.setFillColor(...C.aiBg); doc.setDrawColor(...C.border)
      doc.roundedRect(MX, y, bw2, boxH, 2, 2, 'FD')
      doc.setFillColor(...C.primary); doc.rect(MX, y, 2.5, boxH, 'F')

      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
      doc.text('ThinkMate', MX + 6, y + 5)
      if (msg.metadata?.understandingLevel) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted)
        doc.text(`→ ${LEVEL_LABEL[msg.metadata.understandingLevel]}`, MX + 32, y + 5)
      }

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text)
      let lineY2 = y + 9
      for (const l of lines) { doc.text(l, MX + 6, lineY2); lineY2 += 5 }

      // Misconceptions below bubble
      if (misc.length > 0) {
        y += boxH + 1
        for (const m2 of misc) {
          const ml = wrapText(`⚠ ${m2}`, WRAP - 6)
          checkPage(ml.length * 4.5 + 2)
          doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.red)
          for (const l of ml) { doc.text(l, MX + 6, y); y += 4.5 }
        }
        y += 4
        continue
      }
    }

    y += boxH + 4
  }

  // ── MISCONCEPTIONS SUMMARY ───────────────────────────────────
  if (uniqueMisc.length > 0) {
    checkPage(10 + uniqueMisc.length * 6)
    y += 4
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary)
    doc.text('MISCONCEPTIONS SUMMARY', MX, y); y += 5
    for (const m2 of uniqueMisc.slice(0, 8)) {
      const ml = wrapText(`• ${m2}`, WRAP)
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.red)
      for (const l of ml) { doc.text(l, MX + 4, y); y += 5 }
      y += 1
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...C.navy)
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
    doc.text(
      `ThinkMate · Generated ${formatDate(new Date())} · "No answers. Only better questions."`,
      PAGE_W / 2, PAGE_H - 4, { align: 'center' },
    )
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MX, PAGE_H - 4, { align: 'right' })
  }

  const safeName = studentName.replace(/\s+/g, '-').toLowerCase()
  const safeDate = new Date().toISOString().slice(0, 10)
  const filename = `thinkmate-${session.subject}-${safeName}-${safeDate}.pdf`
  const blob     = doc.output('blob')
  const blobUrl  = URL.createObjectURL(blob)

  return { blobUrl, filename, download: () => doc.save(filename) }
}