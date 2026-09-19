import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import News from '../pages/News.vue'
import NewsArticle from '../pages/NewsArticle.vue'
import Schedule from '../pages/Schedule.vue'
import GameDetail from '../pages/GameDetail.vue'
import Standings from '../pages/Standings.vue'
import Players from '../pages/Players.vue'
import PlayerDetail from '../pages/PlayerDetail.vue'
import Teams from '../pages/Teams.vue'
import TeamDetail from '../pages/TeamDetail.vue'
import NotFound from '../pages/NotFound.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/news', name: 'news', component: News },
  { path: '/news/:newsId', name: 'news-article', component: NewsArticle },
  { path: '/schedule', name: 'schedule', component: Schedule },
  { path: '/games/:gameId', name: 'game-detail', component: GameDetail },
  { path: '/standings', name: 'standings', component: Standings },
  { path: '/players', name: 'players', component: Players },
  { path: '/players/:playerId', name: 'player-detail', component: PlayerDetail },
  { path: '/teams', name: 'teams', component: Teams },
  { path: '/teams/:teamId', name: 'team-detail', component: TeamDetail },
  { path: '/admin/login', name: 'admin-login', component: () => import('../pages/admin/Login.vue') },
  { path: '/admin', name: 'admin-dashboard', component: () => import('../pages/admin/Dashboard.vue') },
  { path: '/admin/games/new', name: 'admin-game-new', component: () => import('../pages/admin/GameNew.vue') },
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
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
]

// Scroll restoration is handled by the ScrollToTop component (mirrors the React version).
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
