import { Link } from 'react-router-dom'
import standings from '../data/standings.json'

export default function Standings() {
  return (
    <div className="container">
      <span className="eyebrow">2026 Season</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Standings</h1>
      <p className="section-sub">League table, sorted by win percentage.</p>

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>GP</th>
              <th>W</th>
              <th>L</th>
              <th>PCT</th>
              <th>GB</th>
              <th>PF</th>
              <th>PA</th>
              <th>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.team}>
                <td>{row.rank}</td>
                <td>
                  <Link
                    to={`/teams/${row.team}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: row.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {row.name}
                  </Link>
                </td>
                <td>{row.gp}</td>
                <td>{row.wins}</td>
                <td>{row.losses}</td>
                <td>{row.winPct.toFixed(3)}</td>
                <td>{row.gb}</td>
                <td>{row.pf}</td>
                <td>{row.pa}</td>
                <td style={{ color: row.diff >= 0 ? 'var(--win)' : 'var(--loss)' }}>
                  {row.diff >= 0 ? `+${row.diff}` : row.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
