export interface VideoPlayer {
  getCurrentTime(): number
  getPlayerState(): number
  getPlaybackRate(): number
  setPlaybackRate(rate: number): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  mute(): void
}

export type PlayerRole = 'primary' | 'ambient'

export function createJuflixSync() {
  let primary: VideoPlayer | undefined
  let ambient: VideoPlayer | undefined
  let primaryVideoId: string | undefined
  let ambientVideoId: string | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let lastSeek = -Infinity

  function sync(force = false) {
    if (!primary || !ambient) return
    // During a video change, one iframe can become ready before the other.
    if (primaryVideoId !== ambientVideoId) {
      if ([1, 3].includes(ambient.getPlayerState())) ambient.pauseVideo()
      return
    }
    const state = primary.getPlayerState()
    const ambientState = ambient.getPlayerState()
    const position = primary.getCurrentTime()

    // Buffering, pausing and ending the preview must also stop the ambient layer.
    if (state !== 1 && (ambientState === 1 || ambientState === 3)) ambient.pauseVideo()
    if (![0, 1, 2, 5].includes(state)) return

    const rate = primary.getPlaybackRate()
    if (ambient.getPlaybackRate() !== rate) ambient.setPlaybackRate(rate)

    // Avoid seeking continuously while YouTube is still buffering the last seek.
    if (
      (force || Math.abs(position - ambient.getCurrentTime()) > 0.4) &&
      (force || Date.now() - lastSeek >= 1500)
    ) {
      ambient.seekTo(position, true)
      lastSeek = Date.now()
    }
    if (state === 1 && ambientState !== 1) ambient.playVideo()
  }

  function attach(role: PlayerRole, player: VideoPlayer, videoId: string) {
    player.mute()
    if (role === 'primary') {
      primary = player
      primaryVideoId = videoId
    } else {
      ambient = player
      ambientVideoId = videoId
    }
    lastSeek = -Infinity
    sync(true)
    if (primary && ambient && !timer) timer = setInterval(sync, 500)

    return () => {
      if (role === 'primary' && primary === player) {
        primary = undefined
        ambient?.pauseVideo()
      }
      if (role === 'ambient' && ambient === player) ambient = undefined
      if ((!primary || !ambient) && timer) {
        clearInterval(timer)
        timer = undefined
      }
    }
  }

  function onStateChange(player: VideoPlayer) {
    if (primary === player) sync(true)
  }

  return { attach, onStateChange }
}
