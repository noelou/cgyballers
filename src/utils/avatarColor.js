const PALETTE = [
  '#ff6a1a', '#1ac0ff', '#ffd21a', '#ff1a5e', '#3dff9e', '#a45bff',
  '#ff8e1a', '#1affc4', '#ff4f4f', '#5b8cff', '#c8ff1a', '#ff6bd6',
]

export function colorFromString(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

export function initials(name = '') {
  const parts = name.replace(/[^a-zA-Z\s.-]/g, '').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
