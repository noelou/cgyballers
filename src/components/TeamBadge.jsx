import { useState } from 'react'

export default function TeamBadge({ team, size = 40 }) {
  if (!team) return null
  const initials = team.name
    .split(/\s+/)
    .filter((w) => !['x', 'the'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const [imgFailed, setImgFailed] = useState(false)

  if (team.logo && !imgFailed) {
    return (
      <img
        src={team.logo}
        alt={`${team.name} logo`}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-md)',
          objectFit: 'contain',
          flexShrink: 0,
          background: `${team.color}1f`,
          border: `1px solid ${team.color}55`,
        }}
        onError={() => setImgFailed(true)}
      />
    )
  }

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
