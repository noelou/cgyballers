import { ref, watch } from 'vue'

const STORAGE_KEY = 'cgyballers-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const theme = ref(getInitialTheme())

  watch(
    theme,
    (value) => {
      document.documentElement.setAttribute('data-theme', value)
      window.localStorage.setItem(STORAGE_KEY, value)
    },
    { immediate: true }
  )

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
