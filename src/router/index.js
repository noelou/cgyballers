import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import News from '../pages/News.vue'
import NewsArticle from '../pages/NewsArticle.vue'
import Schedule from '../pages/Schedule.vue'
import GameDetail from '../pages/GameDetail.vue'
import Standings from '../pages/Standings.vue'
import Playoffs from '../pages/Playoffs.vue'
import Players from '../pages/Players.vue'
import PlayerDetail from '../pages/PlayerDetail.vue'
import Teams from '../pages/Teams.vue'
import TeamDetail from '../pages/TeamDetail.vue'
import NotFound from '../pages/NotFound.vue'
import { setPageMeta } from '../utils/seo'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { seo: {} } },
  { path: '/news', name: 'news', component: News, meta: { seo: { title: 'News', noindex: true } } },
  {
    path: '/news/:newsId',
    name: 'news-article',
    component: NewsArticle,
    meta: { seo: { title: 'News', noindex: true } },
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: Schedule,
    meta: { seo: { title: 'Schedule & Results', description: 'CGYBallers game schedule, results and final scores for every team.' } },
  },
  { path: '/games/:gameId', name: 'game-detail', component: GameDetail, meta: { seo: { title: 'Box Score' } } },
  {
    path: '/standings',
    name: 'standings',
    component: Standings,
    meta: { seo: { title: 'Standings', description: 'CGYBallers league standings: wins, losses and games played for all teams.' } },
  },
  {
    path: '/playoffs',
    name: 'playoffs',
    component: Playoffs,
    meta: { seo: { title: 'Playoffs', description: 'CGYBallers playoff bracket, matchups and results.' } },
  },
  {
    path: '/players',
    name: 'players',
    component: Players,
    meta: { seo: { title: 'Players', description: 'Every CGYBallers player with season stats: points, rebounds, assists and more.' } },
  },
  { path: '/players/:playerId', name: 'player-detail', component: PlayerDetail, meta: { seo: { title: 'Player' } } },
  {
    path: '/teams',
    name: 'teams',
    component: Teams,
    meta: { seo: { title: 'Teams', description: 'All CGYBallers teams, rosters and records.' } },
  },
  { path: '/teams/:teamId', name: 'team-detail', component: TeamDetail, meta: { seo: { title: 'Team' } } },
  { path: '/admin/login', name: 'admin-login', component: () => import('../pages/admin/Login.vue') },
  { path: '/admin', name: 'admin-dashboard', component: () => import('../pages/admin/Dashboard.vue') },
  { path: '/admin/games/new', name: 'admin-game-new', component: () => import('../pages/admin/GameForm.vue') },
  {
    path: '/admin/games/:gameId/edit',
    name: 'admin-game-edit',
    component: () => import('../pages/admin/GameForm.vue'),
  },
  {
    path: '/admin/games/:gameId/boxscore',
    name: 'admin-boxscore',
    component: () => import('../pages/admin/BoxScoreEntry.vue'),
  },
  {
    path: '/admin/games/:gameId/status',
    name: 'admin-game-status',
    component: () => import('../pages/admin/GameStatus.vue'),
  },
  { path: '/admin/players', name: 'admin-players', component: () => import('../pages/admin/PlayersList.vue') },
  { path: '/admin/players/new', name: 'admin-player-new', component: () => import('../pages/admin/PlayerForm.vue') },
  {
    path: '/admin/players/:playerId/edit',
    name: 'admin-player-edit',
    component: () => import('../pages/admin/PlayerForm.vue'),
  },
  { path: '/admin/teams', name: 'admin-teams', component: () => import('../pages/admin/TeamsList.vue') },
  { path: '/admin/teams/new', name: 'admin-team-new', component: () => import('../pages/admin/TeamForm.vue') },
  {
    path: '/admin/teams/:teamId/edit',
    name: 'admin-team-edit',
    component: () => import('../pages/admin/TeamForm.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { seo: { title: 'Page not found', noindex: true } },
  },
]

// Scroll restoration is handled by the ScrollToTop component (mirrors the React version).
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Default title/description per page. Team, player and game pages start with
// a generic title here, then fill in the real name once their data loads.
// Admin pages (no seo meta) are kept out of search results.
router.afterEach((to) => {
  setPageMeta(to.meta.seo ?? { title: 'Admin', noindex: true })
})

export default router
