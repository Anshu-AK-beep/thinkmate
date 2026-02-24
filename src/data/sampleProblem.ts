import type { Subject } from '@/types'

export interface Problem {
  id: string
  subject: Subject
  topic: string
  grade: string
  statement: string
  context?: string
}

export const SAMPLE_PROBLEMS: Problem[] = [
  // ── Mathematics ──────────────────────────────────────────────
  {
    id: 'math-001',
    subject: 'mathematics',
    topic: 'Newton\'s Second Law',
    grade: 'Class 9–10',
    statement: 'A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds. What is the net force acting on the car?',
    context: 'Use F = ma. Think about what acceleration means here.',
  },
  {
    id: 'math-002',
    subject: 'mathematics',
    topic: 'Quadratic Equations',
    grade: 'Class 10',
    statement: 'Solve: x² - 5x + 6 = 0. Explain your reasoning at each step.',
    context: 'Think about what values of x would make the equation equal to zero.',
  },
  {
    id: 'math-003',
    subject: 'mathematics',
    topic: 'Probability',
    grade: 'Class 9',
    statement: 'A bag contains 3 red, 4 blue, and 5 green balls. What is the probability of drawing a blue ball? What changes if you don\'t put the ball back?',
  },
  {
    id: 'math-004',
    subject: 'mathematics',
    topic: 'Pythagoras Theorem',
    grade: 'Class 8',
    statement: 'A ladder 10m long leans against a wall. The foot of the ladder is 6m from the wall. How high does the ladder reach? Why does this work?',
  },

  // ── Science ──────────────────────────────────────────────────
  {
    id: 'sci-001',
    subject: 'science',
    topic: 'Photosynthesis',
    grade: 'Class 7–8',
    statement: 'A plant in a dark room for 3 days turns yellow and stops growing. Explain why, using your understanding of how plants make food.',
  },
  {
    id: 'sci-002',
    subject: 'science',
    topic: 'Acids & Bases',
    grade: 'Class 10',
    statement: 'When you mix vinegar (acetic acid) with baking soda (sodium bicarbonate), bubbles form and the mixture cools down. What is happening and why?',
  },
  {
    id: 'sci-003',
    subject: 'science',
    topic: 'Electricity',
    grade: 'Class 10',
    statement: 'Two resistors of 4Ω and 6Ω are connected in parallel to a 12V battery. Why does more current flow through the 4Ω resistor?',
  },
  {
    id: 'sci-004',
    subject: 'science',
    topic: 'Heredity',
    grade: 'Class 10',
    statement: 'Both parents have brown eyes but their child has blue eyes. How is this possible? What does this tell you about how traits are inherited?',
  },

  // ── General ──────────────────────────────────────────────────
  {
    id: 'gen-001',
    subject: 'general',
    topic: 'Critical Reasoning',
    grade: 'All levels',
    statement: '"All successful people wake up early. Ravi wakes up early. Therefore Ravi will be successful." Is this argument logically valid? Why or why not?',
  },
  {
    id: 'gen-002',
    subject: 'general',
    topic: 'Data Interpretation',
    grade: 'Class 9+',
    statement: 'A news headline says: "90% of accidents happen within 10km of home — so long drives are safer." What is wrong with this conclusion?',
  },
  {
    id: 'gen-003',
    subject: 'general',
    topic: 'Economics Basics',
    grade: 'Class 11–12',
    statement: 'If the government prints more money to pay off its debt, what do you think happens to the value of that money over time? Walk through your reasoning.',
  },
]

export const SUBJECTS: { value: Subject; label: string; emoji: string; description: string }[] = [
  {
    value: 'mathematics',
    label: 'Mathematics',
    emoji: '∑',
    description: 'Algebra, geometry, probability & more',
  },
  {
    value: 'science',
    label: 'Science',
    emoji: '⚗',
    description: 'Physics, chemistry & biology',
  },
  {
    value: 'general',
    label: 'General',
    emoji: '◈',
    description: 'Logic, reasoning & critical thinking',
  },
]

export function getProblemsBySubject(subject: Subject): Problem[] {
  return SAMPLE_PROBLEMS.filter(p => p.subject === subject)
}