import { ADVENTURE_STORAGE_KEY } from '~/data/adventureStorage'

export function useAdventureAccess() {
  const open = useState('pip-adventure-open', () => false)
  const hasPlayed = useState('pip-adventure-played', () => false)
  onMounted(() => {
    try {
      hasPlayed.value =
        hasPlayed.value ||
        localStorage.getItem('pip-has-played') === 'yes' ||
        !!localStorage.getItem(ADVENTURE_STORAGE_KEY)
    } catch {
      /* Private storage may be unavailable. */
    }
  })
  function markPlayed() {
    if (hasPlayed.value) return
    hasPlayed.value = true
    try {
      localStorage.setItem('pip-has-played', 'yes')
    } catch {
      /* Keep the launcher available for this visit. */
    }
  }
  return { open, hasPlayed, markPlayed }
}
