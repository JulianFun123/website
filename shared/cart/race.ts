import { trackPoint, nearestTrackPoint, type BuiltTrack } from './tracks.ts'
export const RACE_LAPS = 3
export const CART_COLOURS = [
  '#e7d09d',
  '#bdd0a6',
  '#b6c9df',
  '#dfb7c8',
  '#c5b6d9',
  '#a9d2c8',
  '#d6bb9a',
  '#c7ccab',
]
export type CartItem = 'boost' | 'bubble' | 'plane' | 'puddle'
export const CART_ITEMS = {
  boost: { name: 'Pocket Sunshine', icon: '✧' },
  bubble: { name: 'Bubble Blanket', icon: '◯' },
  plane: { name: 'Paper Plane', icon: '➤' },
  puddle: { name: 'Sleepy Puddle', icon: '♢' },
} as const
export interface DriveInput {
  throttle: number
  steer: number
  brake: boolean
  drift: boolean
}
export const idleDrive = (): DriveInput => ({ throttle: 0, steer: 0, brake: false, drift: false })
export interface CartRacer {
  id: number
  name: string
  colour: number
  x: number
  z: number
  y: number
  yaw: number
  speed: number
  vx: number
  vz: number
  progress: number
  gates: number
  lastSafe: number
  fall: number
  finishedAt: number | null
  boostUntil: number
  shieldUntil: number
  spinUntil: number
  rescueUntil: number
  drift: number
  wasDrifting: boolean
  item: CartItem | null
  lastPad: number
  padUntil: number
  itemAt: number
  lane: number
}
export interface CartBox {
  id: number
  progress: number
  lane: number
  readyAt: number
}
export interface CartHazard {
  id: number
  owner: number
  x: number
  z: number
  y: number
  expires: number
}
export interface CartPlane extends CartHazard {
  target: number
}
export interface CartRace {
  track: BuiltTrack
  racers: CartRacer[]
  boxes: CartBox[]
  hazards: CartHazard[]
  planes: CartPlane[]
  elapsed: number
  difficulty: 'gentle' | 'peppy'
  serial: number
  notice: string
  noticeUntil: number
}
const angle = (n: number) => Math.atan2(Math.sin(n), Math.cos(n))
const forward = (a: number, b: number) => (b - a + 1) % 1
export function createCartRace(
  track: BuiltTrack,
  name: string,
  colour: number,
  difficulty: CartRace['difficulty'] = 'peppy',
): CartRace {
  const names = [name, 'Moss', 'Puddle', 'Dot', 'Flurry', 'Gust', 'Fold', 'Tomorrow']
  const racers = names.map((name, id) => {
    const progress = (1 - (Math.floor(id / 2) * 3.2 + 1) / track.length) % 1,
      lane = (id % 2 ? 1 : -1) * 1.6,
      p = trackPoint(track, progress, lane)
    return {
      id,
      name,
      colour: id === 0 ? colour : (id + colour) % 8,
      x: p.x,
      z: p.z,
      y: p.y,
      yaw: Math.atan2(p.tx, p.tz),
      speed: 0,
      vx: 0,
      vz: 0,
      progress,
      gates: 0,
      lastSafe: progress,
      fall: 0,
      finishedAt: null,
      boostUntil: 0,
      shieldUntil: 0,
      spinUntil: 0,
      rescueUntil: 0,
      drift: 0,
      wasDrifting: false,
      item: null,
      lastPad: -1,
      padUntil: 0,
      itemAt: 5 + id,
      lane,
    }
  })
  return {
    track,
    racers,
    boxes: track.config.boxes.flatMap((progress, i) =>
      [-2.8, 0, 2.8].map((lane, j) => ({ id: i * 3 + j, progress, lane, readyAt: 0 })),
    ),
    hazards: [],
    planes: [],
    elapsed: 0,
    difficulty,
    serial: 0,
    notice: 'Go, little Pip!',
    noticeUntil: 3,
  }
}
export function racerProgress(racer: CartRacer) {
  if (racer.gates === 0 && racer.progress > 0.9) return (racer.progress - 1) * 12
  const previous = (racer.gates % 12) / 12
  return racer.gates + Math.min(0.99, forward(previous, racer.progress) * 12)
}
export function cartStandings(race: CartRace) {
  return [...race.racers].sort((a, b) =>
    a.finishedAt !== null && b.finishedAt !== null
      ? a.finishedAt - b.finishedAt
      : a.finishedAt !== null
        ? -1
        : b.finishedAt !== null
          ? 1
          : racerProgress(b) - racerProgress(a),
  )
}
function notice(race: CartRace, text: string) {
  race.notice = text
  race.noticeUntil = race.elapsed + 2.1
}
export function rescueKart(race: CartRace, racer: CartRacer) {
  const p = trackPoint(race.track, racer.lastSafe, racer.id % 2 ? 1 : -1)
  Object.assign(racer, {
    x: p.x,
    z: p.z,
    y: p.y,
    yaw: Math.atan2(p.tx, p.tz),
    speed: 3,
    vx: p.tx * 3,
    vz: p.tz * 3,
    fall: 0,
    drift: 0,
    wasDrifting: false,
    rescueUntil: race.elapsed + 1.5,
  })
  if (!racer.id) notice(race, 'A little helping ribbon. Back on the road.')
}
function hitKart(race: CartRace, racer: CartRacer) {
  if (
    racer.finishedAt !== null ||
    racer.rescueUntil > race.elapsed ||
    racer.spinUntil > race.elapsed
  )
    return
  if (racer.shieldUntil > race.elapsed) {
    racer.shieldUntil = 0
    if (!racer.id) notice(race, 'Pop! Your bubble kept you safe.')
    return
  }
  racer.spinUntil = race.elapsed + 1.1
  racer.speed *= 0.35
  if (!racer.id) notice(race, 'A tiny wobble. You’ve still got this.')
}
export function useCartItem(race: CartRace, racer: CartRacer) {
  if (!racer.item || racer.finishedAt !== null || racer.spinUntil > race.elapsed) return
  const item = racer.item
  racer.item = null
  if (item === 'boost') racer.boostUntil = Math.max(racer.boostUntil, race.elapsed + 2)
  if (item === 'bubble') racer.shieldUntil = race.elapsed + 8
  if (item === 'puddle')
    race.hazards.push({
      id: ++race.serial,
      owner: racer.id,
      x: racer.x - Math.sin(racer.yaw) * 3,
      z: racer.z - Math.cos(racer.yaw) * 3,
      y: racer.y,
      expires: race.elapsed + 18,
    })
  if (item === 'plane') {
    const target = race.racers
      .filter((p) => p !== racer && p.finishedAt === null)
      .sort((a, b) => forward(racer.progress, a.progress) - forward(racer.progress, b.progress))[0]
    if (target)
      race.planes.push({
        id: ++race.serial,
        owner: racer.id,
        target: target.id,
        x: racer.x,
        z: racer.z,
        y: racer.y + 0.9,
        expires: race.elapsed + 6,
      })
  }
  if (!racer.id) notice(race, `${CART_ITEMS[item].icon} ${CART_ITEMS[item].name}`)
}
export function driveCartAI(race: CartRace, racer: CartRacer): DriveInput {
  const aim = trackPoint(
    race.track,
    racer.progress + (8 + racer.speed * 0.24) / race.track.length,
    racer.lane * 0.65,
  )
  const difference = angle(Math.atan2(aim.x - racer.x, aim.z - racer.z) - racer.yaw)
  const steer = Math.max(-1, Math.min(1, -difference * 2.3))
  const curve = Math.abs(difference)
  return {
    throttle: curve > 1.05 ? 0.35 : curve > 0.65 ? 0.7 : 1,
    steer,
    brake: curve > 1.2 && racer.speed > 12,
    drift: curve > 0.25 && curve < 0.8 && racer.speed > 13,
  }
}
export function stepCartRace(race: CartRace, dt: number, input: DriveInput) {
  dt = Math.max(0, Math.min(1 / 30, dt))
  race.elapsed += dt
  for (const racer of race.racers) {
    if (racer.finishedAt !== null) {
      racer.speed *= Math.exp(-3 * dt)
      continue
    }
    const control = racer.id === 0 ? input : driveCartAI(race, racer)
    const near = nearestTrackPoint(race.track, racer.x, racer.z)
    const onRoad = near.distance < race.track.config.width * 0.56
    if (onRoad) {
      racer.lastSafe = near.progress
      racer.fall = 0
    } else racer.fall += dt
    if (
      near.distance > race.track.config.width * 2 ||
      (race.track.config.theme !== 'meadow' &&
        racer.fall > (race.track.config.theme === 'moon' ? 0.7 : 1.1))
    ) {
      rescueKart(race, racer)
      continue
    }
    const boosting = racer.boostUntil > race.elapsed,
      spinning = racer.spinUntil > race.elapsed
    const max = onRoad
      ? boosting
        ? 35
        : racer.id === 0
          ? 27
          : race.difficulty === 'gentle'
            ? 22
            : 25.4 + (racer.id % 3) * 0.4
      : race.track.config.theme === 'rain'
        ? 9
        : 12
    racer.speed += control.throttle * 19 * dt
    racer.speed -= dt * (control.brake ? 32 : control.throttle ? 1.7 : 5)
    if (spinning) racer.speed -= dt * 18
    racer.speed = Math.max(0, Math.min(max, racer.speed))
    const drifting = control.drift && racer.speed > 10 && onRoad && !spinning
    if (drifting && Math.abs(control.steer) > 0.12) racer.drift = Math.min(2.8, racer.drift + dt)
    if (racer.wasDrifting && !drifting) {
      if (racer.drift > 0.55) {
        racer.boostUntil = Math.max(
          racer.boostUntil,
          race.elapsed + Math.min(1.5, racer.drift * 0.6),
        )
        if (!racer.id)
          notice(
            race,
            racer.drift > 1.6
              ? '✧ A very warm little drift boost!'
              : '✧ A pocket-sized drift boost!',
          )
      }
      racer.drift = 0
    }
    racer.wasDrifting = drifting
    racer.yaw -=
      Math.max(-1, Math.min(1, control.steer)) *
      dt *
      (0.35 + racer.speed * 0.055) *
      (drifting ? 1.17 : 1) *
      (spinning ? 0.12 : 1)
    const grip = 1 - Math.exp(-(drifting ? 3.8 : 11) * dt)
    racer.vx += (Math.sin(racer.yaw) * racer.speed - racer.vx) * grip
    racer.vz += (Math.cos(racer.yaw) * racer.speed - racer.vz) * grip
    racer.x += racer.vx * dt
    racer.z += racer.vz * dt
    const after = nearestTrackPoint(race.track, racer.x, racer.z)
    const previousProgress = racer.progress
    racer.progress = after.progress
    racer.y =
      after.point.y - (race.track.config.theme !== 'meadow' ? racer.fall * racer.fall * 10 : 0)
    const expected = ((racer.gates + 1) % 12) / 12
    const gateDistance = Math.min(
      forward(expected, racer.progress),
      forward(racer.progress, expected),
    )
    if (
      after.distance < race.track.config.width * 0.65 &&
      (expected === 0 ? previousProgress > 0.9 && racer.progress < 0.1 : gateDistance < 0.018) &&
      Math.sin(racer.yaw) * after.point.tx + Math.cos(racer.yaw) * after.point.tz > 0.25
    ) {
      racer.gates++
      if (racer.gates >= RACE_LAPS * 12) racer.finishedAt = race.elapsed
      else if (!racer.id && racer.gates % 12 === 0)
        notice(race, `Lap ${Math.floor(racer.gates / 12) + 1}. A little more lovely chaos.`)
    }
    for (let i = 0; i < race.track.config.boosts.length; i++) {
      const pad = race.track.config.boosts[i]!
      if (
        onRoad &&
        Math.min(forward(pad, racer.progress), forward(racer.progress, pad)) < 0.008 &&
        (racer.lastPad !== i || racer.padUntil < race.elapsed)
      ) {
        racer.boostUntil = Math.max(racer.boostUntil, race.elapsed + 1.2)
        racer.lastPad = i
        racer.padUntil = race.elapsed + 3
      }
    }
    if (!racer.item && onRoad)
      for (const box of race.boxes) {
        if (box.readyAt > race.elapsed) continue
        const p = trackPoint(race.track, box.progress, box.lane)
        if (Math.hypot(p.x - racer.x, p.z - racer.z) < 1.65) {
          const rank = cartStandings(race).findIndex((p) => p === racer)
          const pool: CartItem[] =
            rank > 3
              ? ['boost', 'plane', 'boost', 'bubble']
              : ['puddle', 'plane', 'bubble', 'boost']
          racer.item = pool[(race.serial++ + racer.id) % pool.length]!
          box.readyAt = race.elapsed + 7
          if (!racer.id)
            notice(race, `${CART_ITEMS[racer.item].icon} ${CART_ITEMS[racer.item].name} · E to use`)
          break
        }
      }
    if (racer.id && racer.item && race.elapsed > racer.itemAt) {
      useCartItem(race, racer)
      racer.itemAt = race.elapsed + 5 + racer.id * 0.35
    }
  }
  for (let i = 0; i < race.racers.length; i++)
    for (let j = i + 1; j < race.racers.length; j++) {
      const a = race.racers[i]!,
        b = race.racers[j]!,
        dx = a.x - b.x,
        dz = a.z - b.z,
        d = Math.hypot(dx, dz)
      if (
        d < 1.35 &&
        Math.abs(a.y - b.y) < 1.5 &&
        a.finishedAt === null &&
        b.finishedAt === null &&
        a.rescueUntil < race.elapsed &&
        b.rescueUntil < race.elapsed
      ) {
        const push = (1.35 - d) * 0.5,
          l = Math.max(0.01, d)
        a.x += (dx / l) * push
        a.z += (dz / l) * push
        b.x -= (dx / l) * push
        b.z -= (dz / l) * push
        a.speed *= 0.99
        b.speed *= 0.99
      }
    }
  for (const hazard of race.hazards)
    for (const racer of race.racers)
      if (
        hazard.owner !== racer.id &&
        Math.abs(hazard.y - racer.y) < 2 &&
        Math.hypot(hazard.x - racer.x, hazard.z - racer.z) < 1.6
      ) {
        hitKart(race, racer)
        hazard.expires = 0
      }
  race.hazards = race.hazards.filter((h) => h.expires > race.elapsed)
  race.planes = race.planes.filter((plane) => {
    const target = race.racers[plane.target]!
    const dx = target.x - plane.x,
      dz = target.z - plane.z,
      d = Math.hypot(dx, dz)
    if (d < 1.4 && target.finishedAt === null) {
      hitKart(race, target)
      return false
    }
    plane.x += (dx / Math.max(0.01, d)) * 38 * dt
    plane.z += (dz / Math.max(0.01, d)) * 38 * dt
    plane.y += (target.y + 1 - plane.y) * Math.min(1, dt * 6)
    return plane.expires > race.elapsed && target.finishedAt === null
  })
}
export function formatCartTime(time: number) {
  return `${Math.floor(time / 60)}:${(time % 60).toFixed(2).padStart(5, '0')}`
}
