import { useState, useEffect } from 'react'
import Scorecard from './Scorecard'
import { listDrafts, deleteDraft } from './storage'

// ⚠️ Change this before deploying
const PASSWORD = 'menti2025'

const s = {
  gate: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#1a1a2e,#2d2d5e)', fontFamily: "'Segoe UI',system-ui,sans-serif" },
  card: { background: 'white', borderRadius: 16, padding: '40px 36px', width: 340,
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)' },
  tag:  { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7c3aed',
    fontWeight: 700, marginBottom: 10 },
  h1:   { fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' },
  sub:  { fontSize: 13, color: '#6b6b8a', margin: '0 0 24px' },
  input: { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 14px',
    fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
  btn:  { width: '100%', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: 8,
    padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  err:  { fontSize: 12, color: '#dc2626', marginBottom: 12 },
  draftBtn: { background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600,
    cursor: 'pointer', fontSize: 12 },
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('sc_auth') === '1')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [drafts, setDrafts] = useState([])
  const [loadData, setLoadData] = useState(null)

  useEffect(() => { if (authed) setDrafts(listDrafts()) }, [authed])

  function login() {
    if (pw === PASSWORD) { sessionStorage.setItem('sc_auth', '1'); setAuthed(true) }
    else setErr('Incorrect password. Try again.')
  }

  function handleDelete(name) {
    deleteDraft(name)
    setDrafts(listDrafts())
  }

  if (!authed) return (
    <div style={s.gate}>
      <div style={s.card}>
        <div style={s.tag}>Mentimeter · People & Culture</div>
        <h1 style={s.h1}>Performance Scorecard</h1>
        <p style={s.sub}>Year-End Review · Manager Access Only</p>
        <input style={s.input} type="password" placeholder="Enter password"
          value={pw} onChange={e => { setPw(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
        {err && <div style={s.err}>{err}</div>}
        <button style={s.btn} onClick={login}>Continue →</button>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#f8f8fc', minHeight: '100vh' }}>
      {drafts.length > 0 && !loadData && (
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px',
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Saved drafts:</span>
          {drafts.map(d => (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={s.draftBtn} onClick={() => setLoadData(d)}>{d.employeeName}</button>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>{formatDate(d.savedAt)}</span>
              <button style={{ ...s.draftBtn, color: '#dc2626' }}
                onClick={() => handleDelete(d.employeeName)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <Scorecard
        initialData={loadData}
        onSave={() => setDrafts(listDrafts())}
        onClear={() => setLoadData(null)}
      />
    </div>
  )
}
