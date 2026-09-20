// Shared in-memory cache for GET API responses, keyed by URL. Lives for the
// lifetime of the tab (a hard refresh clears it, which is fine — that's when
// you *want* a fresh load). The point: navigating back to a page you've
// already visited shows the last response immediately instead of flashing
// a loading state, while a background refetch keeps it from going stale.
import { ref } from 'vue'

const store = new Map()

// `fallback` should match the shape callers expect before any data has ever
// arrived (e.g. [] for a list endpoint, {} for a keyed-by-id one) so
// unguarded template reads (like `players.length`) never see `undefined`.
export function cachedJson(url, fallback) {
  let entry = store.get(url)
  if (!entry) {
    entry = { data: ref(fallback), loaded: ref(false) }
    store.set(url, entry)
  }

  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      entry.data.value = json
      entry.loaded.value = true
    })

  return entry
}
