import { colorFromString, initials } from '../utils/avatarColor'

export default function Avatar({ name, pic = null, size = 48, square = false }) {
  const borderRadius = square ? 'var(--radius-md)' : '50%'

  if (pic) {
    return (
      <img
        className="avatar"
        src={pic}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        style={{
          width: size,
          height: size,
          borderRadius,
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }

  const bg = colorFromString(name)
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius,
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
