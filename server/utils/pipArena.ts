import {
  ARENA_COVER,
  EYE_HEIGHT,
  MAX_PLAYERS,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  ROUND_MS,
  SPAWNS,
  blockedAt,
  cleanName,
  idleInput,
  rayBox,
  type ArenaPlayer,
  type ArenaSnapshot,
  type ArenaShot,
  type ArenaEvent,
  type ShooterInput,
} from '../../shared/shooter/arena.ts'

interface Session {
  player: ArenaPlayer
  input: ShooterInput
  vy: number
  grounded: boolean
  lastInput: number
  lastShot: number
  lastDamage: number
}
export class PipArena {
  sessions = new Map<string, Session>()
  endsAt = 0
  intermissionUntil = 0
  round = 1
  shots: ArenaShot[] = []
  events: ArenaEvent[] = []
  private serial = 0

  join(id: string, name: unknown, colour: unknown, now: number) {
    if (this.sessions.has(id)) return true
    if (this.sessions.size >= MAX_PLAYERS) return false
    const player: ArenaPlayer = {
      id,
      name: cleanName(name),
      colour:
        typeof colour === 'number' && Number.isInteger(colour) && colour >= 0 && colour < 6
          ? colour
          : 0,
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      pitch: 0,
      health: 100,
      kills: 0,
      deaths: 0,
      respawnAt: 0,
      shieldUntil: 0,
    }
    const session: Session = {
      player,
      input: idleInput(),
      vy: 0,
      grounded: true,
      lastInput: now,
      lastShot: -1000,
      lastDamage: now,
    }
    this.sessions.set(id, session)
    this.spawn(session, now)
    if (!this.endsAt) this.endsAt = now + ROUND_MS
    this.note(`${player.name} unfolded into the garden.`)
    return true
  }
  leave(id: string) {
    const session = this.sessions.get(id)
    if (session) this.note(`${session.player.name} packed their camera.`)
    this.sessions.delete(id)
    if (!this.sessions.size) {
      this.endsAt = 0
      this.intermissionUntil = 0
    }
  }
  input(id: string, input: ShooterInput, now: number) {
    const session = this.sessions.get(id)
    if (!session) return
    session.input = input
    session.lastInput = now
  }
  private note(text: string) {
    this.events.push({ id: ++this.serial, text })
    this.events = this.events.slice(-5)
  }
  private spawn(session: Session, now: number) {
    const others = [...this.sessions.values()].filter((s) => s !== session && s.player.health > 0)
    const points = SPAWNS.map((point, index) => ({
      point,
      distance: others.length
        ? Math.min(...others.map((s) => Math.hypot(s.player.x - point[0], s.player.z - point[1])))
        : (index + this.serial) % SPAWNS.length,
    }))
    points.sort((a, b) => b.distance - a.distance)
    const point = points[0]!.point
    Object.assign(session.player, {
      x: point[0],
      y: 0,
      z: point[1],
      health: 100,
      respawnAt: 0,
      shieldUntil: now + 1400,
    })
    session.vy = 0
    session.grounded = true
    session.input = idleInput()
    session.lastDamage = now
  }
  tick(now: number, dt: number) {
    dt = Math.min(0.05, Math.max(0, dt))
    if (this.endsAt && now >= this.endsAt && !this.intermissionUntil) {
      this.intermissionUntil = now + 7000
      const winner = [...this.sessions.values()].sort(
        (a, b) => b.player.kills - a.player.kills || a.player.deaths - b.player.deaths,
      )[0]
      this.note(
        winner
          ? `${winner.player.name} kept the brightest album. A new round in a moment.`
          : 'A new little round.',
      )
    }
    if (this.intermissionUntil) {
      if (now < this.intermissionUntil) return
      this.round++
      this.endsAt = now + ROUND_MS
      this.intermissionUntil = 0
      for (const session of this.sessions.values()) {
        session.player.kills = 0
        session.player.deaths = 0
        this.spawn(session, now)
      }
    }
    for (const session of this.sessions.values()) {
      const p = session.player
      if (p.health <= 0) {
        if (now >= p.respawnAt) this.spawn(session, now)
        continue
      }
      const input = now - session.lastInput < 350 ? session.input : idleInput()
      p.yaw = input === session.input ? input.yaw : p.yaw
      p.pitch = input === session.input ? input.pitch : p.pitch
      if (input.jump && session.grounded) {
        session.vy = 7.9
        session.grounded = false
        session.input.jump = false
      }
      const length = Math.max(1, Math.hypot(input.forward, input.strafe)),
        speed = input.sprint ? 6.5 : 4.6
      const dx =
        ((-Math.sin(p.yaw) * input.forward + Math.cos(p.yaw) * input.strafe) / length) * speed * dt
      const dz =
        ((-Math.cos(p.yaw) * input.forward - Math.sin(p.yaw) * input.strafe) / length) * speed * dt
      if (!blockedAt(p.x + dx, p.y, p.z)) p.x += dx
      if (!blockedAt(p.x, p.y, p.z + dz)) p.z += dz
      session.vy -= 19 * dt
      const previous = p.y
      p.y += session.vy * dt
      let floor = 0
      for (const b of ARENA_COVER)
        if (
          Math.abs(p.x - b.x) < b.w / 2 + PLAYER_RADIUS * 0.5 &&
          Math.abs(p.z - b.z) < b.d / 2 + PLAYER_RADIUS * 0.5 &&
          previous >= b.h - 0.06 &&
          p.y <= b.h &&
          session.vy <= 0
        )
          floor = Math.max(floor, b.h)
      if (p.y <= floor) {
        p.y = floor
        session.vy = 0
        session.grounded = true
      } else session.grounded = false
      if (now - session.lastDamage > 6000) p.health = Math.min(100, p.health + dt * 12)
      if (input.fire && now - session.lastShot >= 300 && now >= p.shieldUntil)
        this.shoot(session, now)
    }
  }
  private shoot(session: Session, now: number) {
    const p = session.player
    session.lastShot = now
    const origin = [p.x, p.y + EYE_HEIGHT, p.z],
      direction = [
        -Math.sin(p.yaw) * Math.cos(p.pitch),
        Math.sin(p.pitch),
        -Math.cos(p.yaw) * Math.cos(p.pitch),
      ]
    let distance = 42,
      target: Session | null = null
    for (const box of ARENA_COVER) {
      const hit = rayBox(
        origin,
        direction,
        [box.x - box.w / 2, 0, box.z - box.d / 2],
        [box.x + box.w / 2, box.h, box.z + box.d / 2],
      )
      if (hit !== null && hit < distance) distance = hit
    }
    for (const other of this.sessions.values()) {
      const q = other.player
      if (other === session || q.health <= 0 || q.shieldUntil > now) continue
      const hit = rayBox(
        origin,
        direction,
        [q.x - PLAYER_RADIUS, q.y, q.z - PLAYER_RADIUS],
        [q.x + PLAYER_RADIUS, q.y + PLAYER_HEIGHT, q.z + PLAYER_RADIUS],
      )
      if (hit !== null && hit < distance) {
        distance = hit
        target = other
      }
    }
    let tag = false
    if (target) {
      target.player.health = Math.max(0, target.player.health - 25)
      target.lastDamage = now
      if (!target.player.health) {
        tag = true
        p.kills++
        target.player.deaths++
        target.player.respawnAt = now + 3000
        target.input = idleInput()
        this.note(`${p.name} caught ${target.player.name} in a little flash.`)
      }
    }
    this.shots.push({
      id: ++this.serial,
      owner: p.id,
      from: origin,
      to: origin.map((v, i) => v + direction[i]! * distance),
      hit: target?.player.id ?? null,
      tag,
    })
  }
  snapshot(now: number): ArenaSnapshot {
    const snapshot: ArenaSnapshot = {
      type: 'state',
      now,
      endsAt: this.endsAt,
      intermissionUntil: this.intermissionUntil,
      round: this.round,
      players: [...this.sessions.values()].map((s) => ({ ...s.player })),
      shots: this.shots.splice(0),
      events: [...this.events],
    }
    return snapshot
  }
}

export const pipArena = new PipArena()
