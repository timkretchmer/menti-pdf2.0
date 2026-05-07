const PREFIX = 'menti_scorecard_'

export function saveDraft(employeeName, data) {
  const key = PREFIX + employeeName.toLowerCase().replace(/\s+/g, '_')
  localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }))
}

export function loadDraft(employeeName) {
  const key = PREFIX + employeeName.toLowerCase().replace(/\s+/g, '_')
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

export function listDrafts() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .map(k => {
      const data = JSON.parse(localStorage.getItem(k))
      return {
        key: k,
        employeeName: data.employeeName || k.replace(PREFIX, ''),
        savedAt: data.savedAt,
        overall: data.overall,
      }
    })
    .sort((a, b) => b.savedAt - a.savedAt)
}

export function deleteDraft(employeeName) {
  const key = PREFIX + employeeName.toLowerCase().replace(/\s+/g, '_')
  localStorage.removeItem(key)
}
