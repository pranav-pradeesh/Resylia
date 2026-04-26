'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'energy' | 'stress' | 'workload' | 'freetext' | 'done'

const QUESTIONS = {
  energy:   { label: 'Energy', question: 'How is your energy today?', low: 'Exhausted', high: 'Energised' },
  stress:   { label: 'Stress', question: 'How stressed are you?',     low: 'Calm',     high: 'Overwhelmed' },
  workload: { label: 'Workload', question: 'How is your workload?',   low: 'Light',    high: 'Crushing' },
}

const STEP_ORDER: Step[] = ['energy', 'stress', 'workload', 'freetext', 'done']

export default function CheckinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('energy')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ streak: number; risk_level: string; suggestion?: string } | null>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  function selectScore(value: number) {
    const q = step as 'energy' | 'stress' | 'workload'
    setScores((s) => ({ ...s, [q]: value }))
    const next = STEP_ORDER[stepIndex + 1]
    setTimeout(() => setStep(next), 180)
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, free_text: freeText || undefined, source: 'web' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Fetch coach suggestion
      const coachRes = await fetch('/api/coach', { method: 'POST' })
      const coach = coachRes.ok ? await coachRes.json() : null

      setResult({ ...data, suggestion: coach?.suggestion })
      setStep('done')
    } catch (e: any) {
      alert(e.message ?? 'Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const progressPct = ((stepIndex) / 4) * 100

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      background: '#0a0a0f',
      minHeight: '100vh',
      color: '#f1f0eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
        * { box-sizing:border-box; }
        .container { width:100%; max-width:460px; }
        .progress-bar { height:3px; background:rgba(255,255,255,0.08); border-radius:99px; margin-bottom:48px; overflow:hidden; }
        .progress-fill { height:100%; background:#f59e0b; border-radius:99px; transition:width 0.4s ease; }
        .question { font-family:'DM Serif Display',serif; font-size:clamp(28px,6vw,40px); letter-spacing:-1px; margin-bottom:8px; }
        .labels { display:flex; justify-content:space-between; font-size:11px; color:#6b7280; margin-bottom:40px; }
        .score-row { display:flex; gap:12px; justify-content:center; margin-bottom:32px; }
        .score-btn { width:56px; height:56px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#f1f0eb; font-size:20px; font-family:'DM Mono',monospace; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:center; }
        .score-btn:hover { background:rgba(245,158,11,0.15); border-color:#f59e0b; transform:scale(1.08); }
        .score-btn.selected { background:rgba(245,158,11,0.2); border-color:#f59e0b; color:#f59e0b; }
        textarea { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:#f1f0eb; font-family:'DM Mono',monospace; font-size:14px; padding:16px; resize:none; outline:none; transition:border-color 0.2s; }
        textarea:focus { border-color:rgba(245,158,11,0.4); }
        .char-count { text-align:right; font-size:11px; color:#6b7280; margin-top:6px; }
        .submit-btn { width:100%; padding:16px; background:#f59e0b; color:#0a0a0f; border:none; border-radius:10px; font-family:'DM Mono',monospace; font-weight:500; font-size:15px; cursor:pointer; margin-top:24px; transition:opacity 0.2s; }
        .submit-btn:hover { opacity:0.85; }
        .submit-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .skip-link { text-align:center; font-size:12px; color:#6b7280; margin-top:16px; cursor:pointer; }
        .skip-link:hover { color:#9ca3af; }
        .done-card { text-align:center; }
        .streak { font-size:64px; line-height:1; color:#f59e0b; margin:16px 0 4px; }
        .streak-label { font-size:13px; color:#6b7280; margin-bottom:40px; }
        .suggestion-card { background:#111118; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:24px; text-align:left; margin-bottom:24px; }
        .suggestion-label { font-size:11px; color:#f59e0b; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
        .suggestion-text { font-size:15px; line-height:1.7; color:#e5e7eb; }
        .risk-badge { display:inline-block; padding:4px 12px; border-radius:99px; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin-bottom:24px; }
        .risk-low { background:rgba(34,197,94,0.1); color:#86efac; border:1px solid rgba(34,197,94,0.2); }
        .risk-medium { background:rgba(245,158,11,0.1); color:#fcd34d; border:1px solid rgba(245,158,11,0.2); }
        .risk-high { background:rgba(239,68,68,0.1); color:#fca5a5; border:1px solid rgba(239,68,68,0.2); }
        .back-link { font-size:13px; color:#f59e0b; text-decoration:none; cursor:pointer; }
      `}</style>

      <div className="container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {step !== 'done' && step !== 'freetext' && (
          <ScoreStep
            question={QUESTIONS[step as 'energy' | 'stress' | 'workload'].question}
            low={QUESTIONS[step as 'energy' | 'stress' | 'workload'].low}
            high={QUESTIONS[step as 'energy' | 'stress' | 'workload'].high}
            selected={scores[step]}
            onSelect={selectScore}
          />
        )}

        {step === 'freetext' && (
          <div>
            <div className="question" style={{ marginBottom: 12 }}>Anything on your mind?</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Optional. Only you and your AI coach see this.</div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="What's weighing on you today? Or what went well?"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
            <div className="char-count">{freeText.length}/500</div>
            <button className="submit-btn" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit check-in →'}
            </button>
            {!submitting && (
              <div className="skip-link" onClick={submit}>Skip and submit</div>
            )}
          </div>
        )}

        {step === 'done' && result && (
          <div className="done-card">
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4, letterSpacing: 2, textTransform: 'uppercase' }}>Check-in complete</div>
            <div className="streak">🔥 {result.streak}</div>
            <div className="streak-label">day streak — keep it going!</div>

            <div className={`risk-badge risk-${result.risk_level}`}>
              {result.risk_level === 'low' && '✓ Low burnout risk'}
              {result.risk_level === 'medium' && '⚠ Medium burnout risk'}
              {result.risk_level === 'high' && '⚡ High burnout risk'}
            </div>

            {result.suggestion && (
              <div className="suggestion-card">
                <div className="suggestion-label">Your coach says</div>
                <div className="suggestion-text">{result.suggestion}</div>
              </div>
            )}

            <div onClick={() => router.push('/dashboard')} className="back-link">
              ← Back to dashboard
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreStep({
  question, low, high, selected, onSelect,
}: {
  question: string
  low: string
  high: string
  selected?: number
  onSelect: (v: number) => void
}) {
  return (
    <div>
      <div className="question">{question}</div>
      <div className="labels"><span>{low}</span><span>{high}</span></div>
      <div className="score-row">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            className={`score-btn${selected === v ? ' selected' : ''}`}
            onClick={() => onSelect(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
