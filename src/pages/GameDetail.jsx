import { Link, useParams } from 'react-router-dom'
import schedule from '../data/schedule.json'
import teams from '../data/teams.json'
import players from '../data/players.json'
import TeamBadge from '../components/TeamBadge'
import { getBoxscore, sumLines } from '../utils/boxscores'
import { formatDate, formatTime } from '../utils/date'
import './GameDetail.css'

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))
const playerById = Object.fromEntries(players.map((p) => [p.id, p]))

export default function GameDetail() {
  const { gameId } = useParams()
  const game = schedule.find((g) => g.id === gameId)
  const box = getBoxscore(gameId)

  if (!game || !box) {
    return (
      <div className="container">
        <div className="empty-state card">
          <p>No box score is available for this game.</p>
          <Link to="/schedule" className="btn">Back to Schedule</Link>
        </div>
      </div>
    )
  }

  const homeWon = game.homeScore > game.awayScore

  return (
    <div className="container">
      <Link to="/schedule" style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13 }}>
        &larr; Back to Schedule
      </Link>

      <div className="card game-detail-header">
        <div className="game-detail-date">
          {formatDate(game.date, { weekday: 'long', month: 'long', day: 'numeric' })} &middot; {formatTime(game.time)} &middot; {game.venue}
        </div>
        <div className="game-detail-score">
          <TeamRow team={teamById[game.home]} name={game.homeName} score={game.homeScore} won={homeWon} />
          <TeamRow team={teamById[game.away]} name={game.awayName} score={game.awayScore} won={!homeWon} />
        </div>
      </div>

      <BoxTable teamId={game.home} teamName={game.homeName} lines={box.lines} />
      <BoxTable teamId={game.away} teamName={game.awayName} lines={box.lines} />
    </div>
  )
}

function TeamRow({ team, name, score, won }) {
  return (
    <div className={`game-detail-team ${won ? 'won' : ''}`}>
      <TeamBadge team={team} size={36} />
      <Link to={`/teams/${team.id}`}>{name}</Link>
      <span className="game-detail-team-score">{score}</span>
    </div>
  )
}

const STAT_COLS = [
  ['pts', 'PTS'],
  ['reb', 'REB'],
  ['ast', 'AST'],
  ['blk', 'BLK'],
  ['stl', 'STL'],
]

function BoxTable({ teamId, teamName, lines }) {
  const rows = Object.entries(lines)
    .filter(([id]) => playerById[id]?.team === teamId)
    .map(([id, line]) => ({ player: playerById[id], line }))
    .sort((a, b) => b.line.pts - a.line.pts || a.player.name.localeCompare(b.player.name))

  const totals = sumLines(rows.map((r) => r.line))

  const dnp = (teamById[teamId]?.playerIds ?? [])
    .filter((id) => !(id in lines))
    .map((id) => playerById[id]?.name)
    .filter(Boolean)

  return (
    <>
      <div className="section-title game-detail-box-title">{teamName}</div>
      <div className="card table-scroll">
        <table className="game-detail-box">
          <thead>
            <tr>
              <th>Player</th>
              {STAT_COLS.map(([key, label]) => <th key={key}>{label}</th>)}
              <th>3PT</th>
              <th>FT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, line }) => (
              <tr key={player.id}>
                <td className="game-detail-name">
                  <Link to={`/players/${player.id}`}>{player.name}</Link>
                  <span className="game-detail-num">#{player.number}</span>
                </td>
                {STAT_COLS.map(([key]) => <td key={key}>{line[key] || 0}</td>)}
                <td>{line.tpm || 0}-{line.tpa || 0}</td>
                <td>{line.ftm || 0}-{line.fta || 0}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              {STAT_COLS.map(([key]) => <td key={key}>{totals[key]}</td>)}
              <td>{totals.tpm}-{totals.tpa}</td>
              <td>{totals.ftm}-{totals.fta}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {dnp.length > 0 && (
        <p className="game-detail-dnp">
          <span>Did not play</span> {dnp.join(', ')}
        </p>
      )}
    </>
  )
}
