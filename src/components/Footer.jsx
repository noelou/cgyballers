import './Footer.css'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61562394387119'

const SPONSORS = [
  { src: '/sponsors/tricon.png', name: 'Tricon Steel' },
  { src: '/sponsors/madman.png', name: 'Madman Construction Supplies' },
  { src: '/sponsors/cdo-metal-plus.png', name: 'CDO Metal Plus' },
  { src: '/sponsors/abaday.png', name: 'Abaday' },
  { src: '/sponsors/fliq.png', name: 'FLIQ Athletics' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-sponsors">
          <span className="footer-heading">Sponsors</span>
          <div className="footer-sponsor-logos">
            {SPONSORS.map((s) => (
              <span className="footer-sponsor" key={s.src}>
                <img src={s.src} alt={s.name} loading="lazy" />
              </span>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-dim">&copy; {new Date().getFullYear()} CGYBallers League</span>
          <a className="footer-fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Follow on Facebook
          </a>
          <span className="footer-dim">Built for hoopers, by hoopers.</span>
        </div>
      </div>
    </footer>
  )
}
