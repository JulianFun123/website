import {
  idleInput,
  type ArenaShot,
  type ArenaSnapshot,
  type ShooterInput,
} from '~~/shared/shooter/arena'

export function usePipShooter() {
  const status = ref<'connecting' | 'online' | 'offline'>('connecting')
  const id = ref('')
  const snapshot = shallowRef<ArenaSnapshot | null>(null)
  const wanted = ref(false)
  const error = ref('')
  const ping = ref(0)
  const hit = ref(false)
  const damaged = ref(false)
  const player = computed(() => snapshot.value?.players.find((p) => p.id === id.value) ?? null)
  const input = idleInput()
  const queued: ArenaShot[] = []
  let socket: WebSocket | undefined
  let retry: ReturnType<typeof setTimeout> | undefined
  let inputTimer: ReturnType<typeof setInterval> | undefined
  let pingTimer: ReturnType<typeof setInterval> | undefined
  let hitTimer: ReturnType<typeof setTimeout> | undefined
  let damageTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let attempts = 0
  let identity = { name: 'Little Pip', colour: 0 }

  function send(message: unknown) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }
  function clearInput() {
    Object.assign(input, idleInput(), { yaw: input.yaw, pitch: input.pitch })
  }
  function connect() {
    if (disposed) return
    status.value = 'connecting'
    const url = new URL('/pip-arena', window.location.href)
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(url)
    socket.onopen = () => {
      attempts = 0
      status.value = 'online'
      error.value = ''
    }
    socket.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data)
        if (packet.type === 'welcome') {
          id.value = packet.id
          if (wanted.value) send({ type: 'join', ...identity })
        } else if (packet.type === 'state') {
          const before = player.value
          snapshot.value = packet as ArenaSnapshot
          const after = player.value
          if (before && after && after.health < before.health) {
            damaged.value = true
            clearTimeout(damageTimer)
            damageTimer = setTimeout(() => {
              damaged.value = false
            }, 180)
          }
          for (const shot of packet.shots as ArenaShot[]) {
            queued.push(shot)
            if (shot.owner === id.value && shot.hit) {
              hit.value = true
              clearTimeout(hitTimer)
              hitTimer = setTimeout(() => {
                hit.value = false
              }, 200)
            }
          }
          if (queued.length > 100) queued.splice(0, queued.length - 100)
        } else if (packet.type === 'pong') ping.value = Math.max(0, Date.now() - packet.at)
        else if (packet.type === 'error') {
          error.value = packet.message
          wanted.value = false
          clearInput()
          if (document.pointerLockElement) document.exitPointerLock()
        }
      } catch {
        /* Ignore incomplete transport messages. */
      }
    }
    socket.onclose = () => {
      status.value = 'offline'
      snapshot.value = null
      clearInput()
      if (document.pointerLockElement) document.exitPointerLock()
      if (!disposed)
        retry = setTimeout(connect, Math.min(10000, 1000 * 2 ** Math.min(attempts++, 3)))
    }
    socket.onerror = () => {
      error.value = 'The garden connection is taking a little moment. Retrying…'
    }
  }
  function join(name: string, colour: number) {
    identity = { name, colour }
    wanted.value = true
    error.value = ''
    send({ type: 'join', ...identity })
  }
  function leave() {
    wanted.value = false
    clearInput()
    send({ type: 'leave' })
    if (document.pointerLockElement) document.exitPointerLock()
  }
  onMounted(() => {
    connect()
    inputTimer = setInterval(() => {
      if (wanted.value) {
        send({ type: 'input', ...input })
        input.jump = false
      }
    }, 1000 / 30)
    pingTimer = setInterval(() => send({ type: 'ping', at: Date.now() }), 2500)
  })
  onBeforeUnmount(() => {
    disposed = true
    clearTimeout(retry)
    clearTimeout(hitTimer)
    clearTimeout(damageTimer)
    clearInterval(inputTimer)
    clearInterval(pingTimer)
    socket?.close(1000, 'Packed the camera')
    if (document.pointerLockElement) document.exitPointerLock()
  })
  return {
    status,
    id,
    snapshot,
    wanted,
    error,
    ping,
    hit,
    damaged,
    player,
    input,
    join,
    leave,
    clearInput,
    consumeShots: () => queued.splice(0),
  }
}
