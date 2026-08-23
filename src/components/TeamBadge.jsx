export default function TeamBadge({ team, size = 40 }) {
  if (!team) return null
  const initials = team.name
    .split(/\s+/)
    .filter((w) => !['x', 'the'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.36,
        flexShrink: 0,
        color: team.color,
        background: `${team.color}1f`,
        border: `1px solid ${team.color}55`,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
