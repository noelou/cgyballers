// Per-page <title>, description, social-preview and canonical tags.
// index.html carries the same defaults for crawlers that don't run JS
// (e.g. Facebook link previews); Google runs JS and sees these updates.

export const SITE_NAME = 'CGYBallers'
export const SITE_URL = 'https://cgyballers.gacs.me'
export const DEFAULT_TITLE = 'CGYBallers — Community Basketball League'
export const DEFAULT_DESCRIPTION =
  'CGYBallers is a community basketball league. Follow the game schedule, standings, playoffs, box scores and player stats for every team.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// `title` is the page-specific part ("Standings"); the site name is appended.
// `noindex` keeps a page (404s, admin) out of search results.
export function setPageMeta({ title, description, noindex = false } = {}) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESCRIPTION
  const url = SITE_URL + window.location.pathname

  document.title = fullTitle
  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:title', fullTitle)
  setMeta('name', 'twitter:description', desc)
  setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow')
  setCanonical(url)
}
