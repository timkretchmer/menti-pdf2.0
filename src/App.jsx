import { useState, useEffect } from 'react'
import Scorecard from './Scorecard'
import { listDrafts, deleteDraft } from './storage'

const s = {
  draftBtn: { background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600,
    cursor: 'pointer', fontSize: 12 },
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function App() {
  const [drafts, setDrafts] = useState(() => listDrafts())
  const [loadData, setLoadData] = useState(null)

  useEffect(() => { setDrafts(listDrafts()) }, [])

  function handleDelete(name) {
    deleteDraft(name)
    setDrafts(listDrafts())
  }

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
