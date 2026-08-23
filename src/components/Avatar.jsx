import { colorFromString, initials } from '../utils/avatarColor'

export default function Avatar({ name, size = 48, square = false }) {
  const bg = colorFromString(name)
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: square ? 'var(--radius-md)' : '50%',
        background: `linear-gradient(155deg, ${bg}, ${bg}99)`,
        color: '#0b0d10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
