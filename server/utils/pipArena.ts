import {
  WEAPONS,
  WEAPON_PICKUPS,
  freshInventory,
  type WeaponId,
} from '../../shared/shooter/weapons.ts'
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
  type ArenaGrenade,
  type ArenaExplosion,
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
  lastGrenade: number
}
export class PipArena {
  sessions = new Map<string, Session>()
  endsAt = 0
  intermissionUntil = 0
  round = 1
  shots: ArenaShot[] = []
  events: ArenaEvent[] = []
  private serial = 0
  pickupTimers = new Map(WEAPON_PICKUPS.map((pickup) => [pickup.id, 0]))
  grenades = new Map<number, ArenaGrenade & { vx: number; vy: number; vz: number }>()
  explosions: ArenaExplosion[] = []

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
      weapon: 'camera',
      inventory: freshInventory(),
      grenades: 0,
    }
    const session: Session = {
      player,
      input: idleInput(),
      vy: 0,
      grounded: true,
      lastInput: now,
      lastShot: -1000,
      lastDamage: now,
      lastGrenade: -1000,
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
      this.resetPickups()
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
      weapon: 'camera',
      inventory: freshInventory(),
      grenades: 0,
    })
    session.vy = 0
    session.grounded = true
    session.input = idleInput()
    session.lastDamage = now
    session.lastShot = -1000
    session.lastGrenade = -1000
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
      this.resetPickups()
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
      if (input.weapon && p.inventory[input.weapon] !== 0) p.weapon = input.weapon
      session.input.weapon = null
      if (input.jump && session.grounded) {
        session.vy = 7.9
        session.grounded = false
        session.input.jump = false
      }
      const length = Math.max(1, Math.hypot(input.forward, input.strafe)),
        speed = (input.sprint ? 6.5 : 4.6) * (p.weapon === 'knife' ? 1.12 : 1)
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
      this.collect(session, now)
      if (input.grenade) {
        session.input.grenade = false
        if (p.grenades > 0 && now >= p.shieldUntil && now - session.lastGrenade >= 1000)
          this.throwGrenade(session, now)
      }
      if (
        input.fire &&
        now - session.lastShot >= WEAPONS[p.weapon].cooldown &&
        now >= p.shieldUntil
      )
        this.shoot(session, now)
    }
    this.stepGrenades(now, dt)
  }
  private resetPickups() {
    for (const id of this.pickupTimers.keys()) this.pickupTimers.set(id, 0)
    this.grenades.clear()
    this.explosions = []
    this.shots = []
  }
  private collect(session: Session, now: number) {
    const p = session.player
    if (p.y > 0.9) return
    for (const pickup of WEAPON_PICKUPS) {
      if (
        (this.pickupTimers.get(pickup.id) ?? 0) > now ||
        Math.hypot(p.x - pickup.x, p.z - pickup.z) > 1.15
      )
        continue
      if (pickup.kind === 'grenades') {
        if (p.grenades >= 3) continue
        p.grenades = Math.min(3, p.grenades + 2)
      } else {
        const weapon = WEAPONS[pickup.kind]
        if (
          weapon.ammo === -1
            ? p.inventory[pickup.kind] === -1
            : p.inventory[pickup.kind] >= weapon.ammo
        )
          continue
        p.inventory[pickup.kind] = weapon.ammo
        p.weapon = pickup.kind
      }
      this.pickupTimers.set(pickup.id, now + 15000)
    }
  }
  private damage(target: Session, amount: number, owner: string, now: number) {
    const p = target.player
    if (p.health <= 0 || p.shieldUntil > now) return false
    p.health = Math.max(0, p.health - amount)
    target.lastDamage = now
    if (p.health) return false
    const attacker = this.sessions.get(owner)
    if (attacker && attacker !== target) attacker.player.kills++
    p.deaths++
    p.respawnAt = now + 3000
    target.input = idleInput()
    this.note(
      attacker === target
        ? `${p.name} got a little too close to their own confetti.`
        : `${attacker?.player.name ?? 'The confetti'} caught ${p.name} in a little flash.`,
    )
    return true
  }
  private throwGrenade(session: Session, now: number) {
    const p = session.player
    p.grenades--
    session.lastGrenade = now
    const id = ++this.serial,
      speed = 13
    this.grenades.set(id, {
      id,
      owner: p.id,
      x: p.x,
      y: p.y + EYE_HEIGHT,
      z: p.z,
      vx: -Math.sin(p.yaw) * Math.cos(p.pitch) * speed,
      vy: 5 + Math.sin(p.pitch) * speed,
      vz: -Math.cos(p.yaw) * Math.cos(p.pitch) * speed,
      fuseAt: now + 1700,
    })
  }
  private stepGrenades(now: number, dt: number) {
    for (const g of this.grenades.values()) {
      g.vy -= 14 * dt
      const obstacle = (x: number, y: number, z: number) =>
        blockedAt(x, Math.max(0.01, y - 0.12), z)
      if (obstacle(g.x + g.vx * dt, g.y, g.z)) g.vx *= -0.55
      else g.x += g.vx * dt
      if (obstacle(g.x, g.y, g.z + g.vz * dt)) g.vz *= -0.55
      else g.z += g.vz * dt
      const previous = g.y
      g.y += g.vy * dt
      let floor = 0.14
      for (const b of ARENA_COVER)
        if (
          Math.abs(g.x - b.x) < b.w / 2 + 0.1 &&
          Math.abs(g.z - b.z) < b.d / 2 + 0.1 &&
          previous >= b.h + 0.1 &&
          g.y <= b.h + 0.14 &&
          g.vy < 0
        )
          floor = Math.max(floor, b.h + 0.14)
      if (g.y <= floor) {
        g.y = floor
        g.vy = Math.abs(g.vy) > 0.8 ? Math.abs(g.vy) * 0.38 : 0
        g.vx *= 0.8
        g.vz *= 0.8
      }
      if (now >= g.fuseAt) {
        this.explode(g, now)
        this.grenades.delete(g.id)
      }
    }
  }
  private explode(g: ArenaGrenade, now: number) {
    const radius = 5.5,
      hits: string[] = []
    const origin = [g.x, g.y + 0.12, g.z]
    for (const target of this.sessions.values()) {
      const p = target.player
      const offset = [p.x - g.x, p.y + 0.7 - origin[1]!, p.z - g.z]
      const distance = Math.hypot(...offset)
      if (distance > radius || p.health <= 0 || p.shieldUntil > now) continue
      const direction = offset.map((v) => v / Math.max(0.001, distance))
      const occluded = ARENA_COVER.some((b) => {
        const hit = rayBox(
          origin,
          direction,
          [b.x - b.w / 2, 0, b.z - b.d / 2],
          [b.x + b.w / 2, b.h, b.z + b.d / 2],
        )
        return hit !== null && hit < distance - 0.1
      })
      if (occluded) continue
      const amount = distance < 2 ? 100 : Math.round((100 * (radius - distance)) / (radius - 2))
      if (amount <= 0) continue
      hits.push(p.id)
      this.damage(target, amount, g.owner, now)
    }
    this.explosions.push({
      id: ++this.serial,
      owner: g.owner,
      x: g.x,
      y: g.y,
      z: g.z,
      radius,
      hits,
    })
  }
  private shoot(session: Session, now: number) {
    const p = session.player,
      weaponId = p.weapon,
      weapon = WEAPONS[weaponId]
    if (p.inventory[weaponId] === 0) {
      p.weapon = 'camera'
      return
    }
    session.lastShot = now
    if (p.inventory[weaponId] > 0) p.inventory[weaponId]--
    const origin = [p.x, p.y + EYE_HEIGHT, p.z]
    for (let pellet = 0; pellet < weapon.pellets; pellet++) {
      const spread =
        weaponId === 'longlens' && session.input.aim
          ? 0.0005
          : weapon.spread * (session.input.aim ? 0.65 : 1)
      const yaw = p.yaw + (Math.random() - 0.5) * spread * 2,
        pitch = p.pitch + (Math.random() - 0.5) * spread * 2
      const direction = [
        -Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch),
      ]
      let distance: number = weapon.range,
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
      const headshot =
        weaponId === 'longlens' &&
        target &&
        origin[1]! + direction[1]! * distance > target.player.y + 1.1
      const tag = target
        ? this.damage(target, weapon.damage * (headshot ? 1.5 : 1), p.id, now)
        : false
      this.shots.push({
        id: ++this.serial,
        owner: p.id,
        from: origin,
        to: origin.map((v, i) => v + direction[i]! * distance),
        hit: target?.player.id ?? null,
        tag,
        weapon: weaponId,
      })
    }
    if (p.inventory[weaponId] === 0) p.weapon = 'camera'
  }
  snapshot(now: number): ArenaSnapshot {
    const snapshot: ArenaSnapshot = {
      type: 'state',
      now,
      endsAt: this.endsAt,
      intermissionUntil: this.intermissionUntil,
      round: this.round,
      players: [...this.sessions.values()].map((s) => ({
        ...s.player,
        inventory: { ...s.player.inventory },
      })),
      shots: this.shots.splice(0),
      events: [...this.events],
      pickups: [...this.pickupTimers].map(([id, availableAt]) => ({ id, availableAt })),
      grenades: [...this.grenades.values()].map(({ vx, vy, vz, ...g }) => g),
      explosions: this.explosions.splice(0),
    }
    return snapshot
  }
}

export const pipArena = new PipArena()
