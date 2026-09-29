export function formatDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts)
}

export function formatDateShort(iso) {
  return formatDate(iso, { month: 'short', day: 'numeric' })
}

// Games that never got a slot (e.g. forfeits by a team that dropped out)
// have no time — show a dash instead of crashing.
export function formatTime(time24) {
  if (!time24) return '—'
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}
