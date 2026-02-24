import express             from 'express'
import cors                from 'cors'
import dotenv              from 'dotenv'
import { analyzeRouter }   from './routes/analyze'
import { hintRouter }      from './routes/hint'
import { sessionsRouter }  from './routes/sessions'
import { analyticsRouter } from './routes/analytics'
import { reviewRouter }    from './routes/review'
import { shareRouter }     from './routes/share'
import { rateLimiter }     from './middleware/rateLimit'

dotenv.config()

const app  = express()
const PORT = process.env.PORT ?? 3001

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '200kb' }))   // larger limit for session snapshots
app.use(rateLimiter)

app.use('/api/sessions',  sessionsRouter)
app.use('/api/analyze',   analyzeRouter)
app.use('/api/hint',      hintRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/review',    reviewRouter)
app.use('/api/share',     shareRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    status:   allConfigured() ? 'ok' : 'degraded',
    groq:     !!process.env.GROQ_API_KEY,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    auth:     !!process.env.SUPABASE_ANON_KEY,
    version:  '2.3.0',
  })
})

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ThinkMate]', err)
  res.status(500).json({ message: 'Internal server error', code: 'SERVER_ERROR' })
})

app.listen(PORT, () => {
  console.log(`\n🧠 ThinkMate v2.3 — http://localhost:${PORT}`)
  console.log(`   Groq        : ${process.env.GROQ_API_KEY      ? '✓' : '⚠ missing'}`)
  console.log(`   Supabase    : ${process.env.SUPABASE_URL      ? '✓' : '⚠ missing'}`)
  console.log(`   Auth        : ${process.env.SUPABASE_ANON_KEY ? '✓' : '⚠ missing'}`)
  console.log(`   Share API   : ✓ /api/share\n`)
})

function allConfigured() {
  return !!(
    process.env.GROQ_API_KEY &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_ANON_KEY
  )
}