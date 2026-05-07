import { useState } from 'react'
import { saveDraft } from './storage'

const RATINGS = ["Not Meeting", "Meeting", "Exceeding"]

const SPAN_POSITIONS = ["Below Midpoint", "At Midpoint", "Above Midpoint"]

const LEVEL_OPTIONS = [
  "DE1","DE2","DE3","DE4","DE5","DE6","M1","M2","M3","M4","M5","M6"
]

const DIMENSIONS = [
  {
    id: "results",
    label: "Results & Impact",
    icon: "📊",
    description: "What the employee has achieved — concrete outcomes and business impact within their scope.",
    criteria: {
      "Not Meeting": "Output is below what's expected for the role and seniority level. Goals are missed or results are not commensurate with scope.",
      "Meeting":     "Consistently delivers results within scope. Goals are met, outcomes are relevant and contribute to team and functional success.",
      "Exceeding":   "Consistently exceeds expected results. Delivers high-impact outcomes that drive success beyond their immediate scope.",
    }
  },
  {
    id: "craft",
    label: "Craft",
    icon: "🔧",
    description: "The quality, depth, and mastery of role-specific skills and competencies relative to seniority level.",
    criteria: {
      "Not Meeting": "Role-specific skills and competencies are below the expected level. Work quality requires significant improvement or oversight.",
      "Meeting":     "Demonstrates solid competency for their seniority level. Work is reliable and meets quality standards consistently.",
      "Exceeding":   "Demonstrates mastery that exceeds expectations for their level. Sets a quality standard and may mentor others in craft.",
    }
  },
  {
    id: "teamImpact",
    label: "Team Impact",
    icon: "🤝",
    description: "How the employee makes those around them better — contribution to culture, collaboration, and team effectiveness.",
    criteria: {
      "Not Meeting": "Limited contribution to team culture or collaboration. May create friction, work in isolation, or undermine team dynamics.",
      "Meeting":     "Actively contributes to a positive team environment. Collaborates effectively, supports peers, and embodies Menti's values.",
      "Exceeding":   "Elevates those around them. Creates a culture of trust and high performance. Others actively seek them out for collaboration.",
    }
  },
  {
    id: "leadership",
    label: "Leadership",
    icon: "👥",
    description: "How effectively they lead, develop, and create clarity for their team. Based on Heart & Bravery principles. Managers only.",
    managersOnly: true,
    criteria: {
      "Not Meeting": "Leadership behaviours are inconsistent or underdeveloped. Team clarity, development, or trust is being negatively affected.",
      "Meeting":     "Provides clear direction, develops team members actively, and leads with authenticity. People processes are handled well.",
      "Exceeding":   "Exceptional leadership that multiplies team performance. Acts as a culture carrier, coaches peers, and sets the standard.",
    }
  },
]

export default function Scorecard({ initialData, onSave, onClear }) {
  const [employeeName, setEmployeeName] = useState(initialData?.employeeName || '')
  const [role, setRole] = useState(initialData?.role || '')
  const [level, setLevel] = useState(initialData?.level || '')
  const [isManager, setIsManager] = useState(initialData?.isManager || false)
  const [spanPosition, setSpanPosition] = useState(initialData?.spanPosition || '')
  const [ratings, setRatings] = useState(initialData?.ratings || {})
  const [evidence, setEvidence] = useState(initialData?.evidence || {})
  const [devNotes, setDevNotes] = useState(initialData?.devNotes || '')
  const [levelChange, setLevelChange] = useState(initialData?.levelChange || 'no')
  const [savedToast, setSavedToast] = useState(false)

  const activeDimensions = DIMENSIONS.filter(d => !d.managersOnly || isManager)

  // Weighted average score (1=Not Meeting, 2=Meeting, 3=Exceeding)
  const weightedScore = () => {
    const vals = activeDimensions.map(d => ratings[d.id]).filter(Boolean)
    if (vals.length < activeDimensions.length) return null
    const score = r => r === "Exceeding" ? 3 : r === "Meeting" ? 2 : 1
    return vals.reduce((s, v) => s + score(v), 0) / vals.length
  }

  const computeIncrease = (score, span) => {
    if (!score || !span) return null
    const bounds = {
      "Not Meeting": { "Below Midpoint": [0, 1],  "At Midpoint": [0, 0],  "Above Midpoint": [0, 0] },
      "Meeting":     { "Below Midpoint": [4, 5],  "At Midpoint": [2, 4],  "Above Midpoint": [1, 2] },
      "Exceeding":   { "Below Midpoint": [6, 8],  "At Midpoint": [4, 6],  "Above Midpoint": [2, 4] },
    }
    let bucket, t
    if (score < 1.5)      { bucket = "Not Meeting"; t = (score - 1.0) / 0.5 }
    else if (score < 2.5) { bucket = "Meeting";     t = (score - 1.5) / 1.0 }
    else                  { bucket = "Exceeding";   t = (score - 2.5) / 0.5 }
    t = Math.min(1, Math.max(0, t))
    const [lo, hi] = bounds[bucket][span]
    const pct = Math.round((lo + t * (hi - lo)) * 10) / 10
    return { bucket, pct, lo, hi }
  }

  const score = weightedScore()
  const increaseResult = computeIncrease(score, spanPosition)
  const overall = increaseResult?.bucket ?? null
  const suggestedIncrease = increaseResult
    ? (increaseResult.lo === increaseResult.hi
        ? `${increaseResult.lo}%`
        : `~${increaseResult.pct}% (range: ${increaseResult.lo}–${increaseResult.hi}%)`)
    : null

  const pct = Math.round(
    (activeDimensions.filter(d => ratings[d.id]).length / activeDimensions.length) * 100
  )

  function handleSave() {
    if (!employeeName) return
    saveDraft(employeeName, {
      employeeName, role, level, isManager,
      spanPosition, ratings, evidence, devNotes, levelChange, overall
    })
    onSave?.()
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit'
  }
  const selectStyle = { ...inputStyle, background: 'white' }
  const textareaStyle = { ...inputStyle, resize: 'vertical' }

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#f7f6f3', minHeight: '100vh', padding: '24px 20px 60px' }}>

      {/* Toast */}
      {savedToast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          ✓ Draft saved
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', color: 'white',
        borderRadius: 14, padding: '24px 28px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 8, fontWeight: 600 }}>
            Year-End · Manager Tool
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Performance Evaluation Scorecard</h1>
          <p style={{ fontSize: 13, color: '#c4c4e0', margin: 0 }}>Complete one scorecard per direct report before the calibration session.</p>
        </div>
        {initialData && (
          <button onClick={onClear} style={{ background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ← All drafts
          </button>
        )}
      </div>

      {/* Employee details */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7c3aed', marginBottom: 14 }}>
          Employee Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Employee Name</label>
            <input value={employeeName} onChange={e => setEmployeeName(e.target.value)}
              placeholder="e.g. Alex Eriksson" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Role Title</label>
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="e.g. Product Designer" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Seniority Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}>
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current Span Position</label>
            <select value={spanPosition} onChange={e => setSpanPosition(e.target.value)} style={selectStyle}>
              <option value="">Select position</option>
              {SPAN_POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isManager} onChange={e => setIsManager(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            This employee manages people (include Leadership dimension)
          </label>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Scorecard completion</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#065f46' : '#374151' }}>{pct}%</span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 10, height: 8 }}>
          <div style={{ background: pct === 100 ? '#10b981' : '#7c3aed', height: 8, borderRadius: 10,
            width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Dimension ratings */}
      {activeDimensions.map(dim => {
        const r = ratings[dim.id]
        const borderColor = r === "Exceeding" ? '#86efac' : r === "Meeting" ? '#93c5fd' : r === "Not Meeting" ? '#fca5a5' : '#f3f4f6'
        return (
          <div key={dim.id} style={{ background: 'white', borderRadius: 12, padding: 20,
            marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1.5px solid ${borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{dim.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e' }}>{dim.label}</span>
                  {dim.managersOnly && (
                    <span style={{ fontSize: 10, background: '#fee2e2', color: '#7f1d1d',
                      padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>Managers only</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#6b6b8a', margin: 0 }}>{dim.description}</p>
              </div>
              {r && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, flexShrink: 0, marginLeft: 12,
                  background: r === "Exceeding" ? '#d1fae5' : r === "Meeting" ? '#dbeafe' : '#fee2e2',
                  color: r === "Exceeding" ? '#065f46' : r === "Meeting" ? '#1d4ed8' : '#7f1d1d' }}>
                  {r}
                </span>
              )}
            </div>

            {/* Rating buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {RATINGS.map(opt => {
                const sel = ratings[dim.id] === opt
                return (
                  <button key={opt} onClick={() => setRatings(prev => ({ ...prev, [dim.id]: opt }))}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.15s', border: '2px solid',
                      borderColor: sel ? (opt === "Exceeding" ? '#10b981' : opt === "Meeting" ? '#3b82f6' : '#ef4444') : '#e5e7eb',
                      background: sel ? (opt === "Exceeding" ? '#d1fae5' : opt === "Meeting" ? '#dbeafe' : '#fee2e2') : 'white',
                      color: sel ? (opt === "Exceeding" ? '#065f46' : opt === "Meeting" ? '#1d4ed8' : '#7f1d1d') : '#6b7280',
                    }}>
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Criteria description */}
            {r && (
              <div style={{ background: r === "Exceeding" ? '#f0fdf4' : r === "Meeting" ? '#eff6ff' : '#fff1f2',
                borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#374151' }}>
                <strong>What this means: </strong>{dim.criteria[r]}
              </div>
            )}

            {/* Evidence */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Evidence & examples <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional but strongly recommended)</span>
              </label>
              <textarea value={evidence[dim.id] || ''} rows={2} style={textareaStyle}
                onChange={e => setEvidence(prev => ({ ...prev, [dim.id]: e.target.value }))}
                placeholder={`Describe specific examples of ${dim.label.toLowerCase()} that informed this rating...`} />
            </div>
          </div>
        )
      })}

      {/* Seniority assessment */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7c3aed', marginBottom: 12 }}>
          Seniority Level Assessment
        </div>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 14 }}>
          Based on this employee's performance, results, and demonstrated competencies, what is your assessment of their seniority level?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { val: 'no',   label: 'Remains at current level' },
            { val: 'up',   label: 'Ready for level progression' },
            { val: 'down', label: 'Level recalibration needed' },
          ].map(opt => (
            <button key={opt.val} onClick={() => setLevelChange(opt.val)}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s', border: '2px solid',
                borderColor: levelChange === opt.val ? '#7c3aed' : '#e5e7eb',
                background: levelChange === opt.val ? '#f5f3ff' : 'white',
                color: levelChange === opt.val ? '#5b21b6' : '#6b7280' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Development notes */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7c3aed', marginBottom: 12 }}>
          Development Notes
        </div>
        <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 10 }}>
          Key growth areas, stretch goals, or development themes to bring into the year-end conversation.
        </p>
        <textarea value={devNotes} onChange={e => setDevNotes(e.target.value)} rows={3}
          style={textareaStyle}
          placeholder="What should this person focus on in the next 6 months? What would 'Exceeding' look like for them next year?" />
      </div>

      {/* Summary */}
      {overall && (
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', color: 'white',
          borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12, fontWeight: 600 }}>
            Scorecard Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
            {[
              { label: 'Weighted Score', value: `${score.toFixed(2)} / 3.00` },
              { label: 'Overall Band',   value: overall },
              { label: 'Span Position',  value: spanPosition || '—' },
              { label: 'Suggested Increase', value: suggestedIncrease || '—', highlight: increaseResult?.pct > 0 },
            ].map(item => (
              <div key={item.label} style={{ background: item.highlight ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: item.highlight ? '#6ee7b7' : 'white' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 16px' }}>
            * Increase guidance is subject to calibration. Final decisions require department-level sign-off.
          </p>
          <button onClick={handleSave} disabled={!employeeName}
            style={{ background: employeeName ? '#7c3aed' : '#4b5563', color: 'white', border: 'none',
              borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700,
              cursor: employeeName ? 'pointer' : 'not-allowed' }}>
            Save Draft
          </button>
          {!employeeName && (
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 12 }}>Add employee name to save</span>
          )}
        </div>
      )}

      {/* Calibration readiness */}
      <div style={{ background: 'white', borderRadius: 12, padding: 18,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: pct === 100 ? '#d1fae5' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {pct === 100 ? '✅' : '📋'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
            {pct === 100 ? 'Ready for calibration' : `${activeDimensions.filter(d => !ratings[d.id]).length} dimension(s) still need a rating`}
          </div>
          <div style={{ fontSize: 12, color: '#6b6b8a' }}>
            {pct === 100
              ? 'All dimensions rated. Bring this scorecard to your calibration session.'
              : 'Complete all dimension ratings before the calibration session.'}
          </div>
        </div>
      </div>

    </div>
  )
}
