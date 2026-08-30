import { Link } from 'react-router-dom'
import standings from '../utils/standings'
import teams from '../data/teams.json'
import TeamBadge from '../components/TeamBadge'

export default function Standings() {
  return (
    <div className="container">
      <span className="eyebrow">2026 Season</span>
      <h1 className="section-title" style={{ fontSize: 28, marginTop: 8 }}>Standings</h1>
      <p className="section-sub">League table.</p>

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>GP</th>
              <th>W</th>
              <th>L</th>
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
                    <TeamBadge team={teams.find((t) => t.id === row.team)} size={24} />
                    {row.name}
                  </Link>
                </td>
                <td>{row.gp}</td>
                <td>{row.wins}</td>
                <td>{row.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
