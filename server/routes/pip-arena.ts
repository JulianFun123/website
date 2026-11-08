import { pipArena } from '../utils/pipArena'
import { MAX_PLAYERS, TICK_MS, validInput } from '../../shared/shooter/arena'

// One public room, owned by this Nitro process. No client-supplied positions or hits.
type ArenaPeer = {
  id: string
  send: (data: string) => unknown
  close: (code?: number, reason?: string) => unknown
}
const peers = new Map<
  string,
  { peer: ArenaPeer; window: number; count: number; connected: number }
>()
let timer: ReturnType<typeof setInterval> | undefined
function remove(id: string) {
  peers.delete(id)
  pipArena.leave(id)
  if (!peers.size) {
    clearInterval(timer)
    timer = undefined
  }
}
function send(peer: ArenaPeer, value: unknown) {
  try {
    peer.send(JSON.stringify(value))
  } catch {
    remove(peer.id)
  }
}
function start() {
  if (timer) return
  timer = setInterval(() => {
    const now = Date.now()
    pipArena.tick(now, TICK_MS / 1000)
    const packet = JSON.stringify(pipArena.snapshot(now))
    for (const { peer, connected } of peers.values()) {
      // Spectators may watch the lobby; bound abandoned lobby sockets as well.
      if (now - connected > 2 * 60 * 60 * 1000) {
        peer.close(1000, 'Time for a little break')
        remove(peer.id)
        continue
      }
      try {
        peer.send(packet)
      } catch {
        remove(peer.id)
      }
    }
  }, TICK_MS)
}
export default defineWebSocketHandler({
  upgrade(request) {
    const origin = request.headers.get('origin')
    if (origin && new URL(origin).host !== new URL(request.url).host)
      throw new Response('Please enter through the garden.', { status: 403 })
  },
  open(peer) {
    if (peers.size >= 48) {
      peer.close(1013, 'The garden is busy. Try again in a moment.')
      return
    }
    peers.set(peer.id, { peer, window: Date.now(), count: 0, connected: Date.now() })
    send(peer, { type: 'welcome', id: peer.id, maxPlayers: MAX_PLAYERS })
    start()
  },
  message(peer, message) {
    const connection = peers.get(peer.id)
    if (!connection) return
    const now = Date.now()
    if (now - connection.window >= 1000) {
      connection.window = now
      connection.count = 0
    }
    if (++connection.count > 80) {
      peer.close(1008, 'Too many messages')
      remove(peer.id)
      return
    }
    const text = message.text()
    if (text.length > 512) {
      peer.close(1009, 'Message too large')
      remove(peer.id)
      return
    }
    try {
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object') return
      if (data.type === 'join') {
        if (!pipArena.join(peer.id, data.name, data.colour, now))
          send(peer, {
            type: 'error',
            message: 'The garden is full (12 players). A place will open when someone leaves.',
          })
      } else if (data.type === 'leave') pipArena.leave(peer.id)
      else if (data.type === 'input') {
        const input = validInput(data)
        if (input) pipArena.input(peer.id, input, now)
      } else if (data.type === 'ping' && typeof data.at === 'number' && Number.isFinite(data.at))
        send(peer, { type: 'pong', at: data.at })
    } catch {
      /* Ignore malformed client data; authoritative state remains untouched. */
    }
  },
  close(peer) {
    remove(peer.id)
  },
  error(peer) {
    remove(peer.id)
  },
})
