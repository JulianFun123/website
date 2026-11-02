import type { VideoPlayer } from './juflixSync'

export interface YouTubePlayer extends VideoPlayer {
  destroy(): void
  getOptions?(): string[]
  // YouTube still exposes this in some players, but does not guarantee it.
  unloadModule?(module: string): void
}

interface PlayerEvent {
  target: YouTubePlayer
}
interface YouTubeApi {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady(event: PlayerEvent): void
        onStateChange(event: PlayerEvent & { data: number }): void
        onApiChange?(event: PlayerEvent): void
      }
    },
  ) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YouTubeApi> | undefined

export function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const existing = document.getElementById('juflix-youtube-api')
    const script = existing ?? document.createElement('script')
    const timeout = setTimeout(() => fail(), 15000)

    function cleanup() {
      clearTimeout(timeout)
      script.removeEventListener('error', fail)
      if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous
    }
    function ready() {
      cleanup()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube player API unavailable'))
      previous?.()
    }
    function fail() {
      cleanup()
      if (!existing) script.remove()
      reject(new Error('YouTube player API could not be loaded'))
    }

    window.onYouTubeIframeAPIReady = ready
    script.addEventListener('error', fail, { once: true })
    if (!existing) {
      const apiScript = script as HTMLScriptElement
      apiScript.id = 'juflix-youtube-api'
      apiScript.src = 'https://www.youtube.com/iframe_api'
      apiScript.async = true
      document.head.append(apiScript)
    }
  }).catch((error) => {
    apiPromise = undefined
    throw error
  })

  return apiPromise
}

export function disableYouTubeCaptions(player: YouTubePlayer) {
  // The player preference cannot be overridden consistently. Use the optional
  // captions module when available, without breaking playback when it isn't.
  try {
    if (player.getOptions?.().includes('captions')) player.unloadModule?.('captions')
  } catch {
    // Optional captions support must not interrupt synchronization.
  }
}
