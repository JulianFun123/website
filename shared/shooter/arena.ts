export const ARENA_LIMIT = 14
export const MAX_PLAYERS = 12
export const TICK_MS = 50
export const ROUND_MS = 180000
export const PLAYER_RADIUS = 0.36
export const PLAYER_HEIGHT = 1.5
export const EYE_HEIGHT = 1.23
export const PIP_COLOURS = ['#ecd9a5', '#c1d3b1', '#c4cfdf', '#dfc4cf', '#d6c5ad', '#b8d8d3']
export interface Cover {
  x: number
  z: number
  w: number
  d: number
  h: number
  kind: 'paper' | 'planter' | 'album'
}
export const ARENA_COVER: Cover[] = [
  { x: 0, z: 0, w: 3.2, d: 3.2, h: 1.9, kind: 'planter' },
  { x: -6, z: -5, w: 3.6, d: 1.3, h: 1.3, kind: 'paper' },
  { x: 6, z: 5, w: 3.6, d: 1.3, h: 1.3, kind: 'paper' },
  { x: -6, z: 5, w: 1.5, d: 3.2, h: 2.2, kind: 'album' },
  { x: 6, z: -5, w: 1.5, d: 3.2, h: 2.2, kind: 'album' },
  { x: 0, z: -9, w: 3, d: 1.2, h: 0.8, kind: 'paper' },
  { x: 0, z: 9, w: 3, d: 1.2, h: 0.8, kind: 'paper' },
  { x: -10, z: 0, w: 1.4, d: 2.4, h: 1.1, kind: 'planter' },
  { x: 10, z: 0, w: 1.4, d: 2.4, h: 1.1, kind: 'planter' },
]
export const SPAWNS = [
  [-11, -11],
  [11, 11],
  [-11, 11],
  [11, -11],
  [0, -12],
  [0, 12],
  [-12, -4],
  [12, 4],
] as const
export interface ShooterInput {
  forward: number
  strafe: number
  yaw: number
  pitch: number
  jump: boolean
  fire: boolean
  sprint: boolean
}
export const idleInput = (): ShooterInput => ({
  forward: 0,
  strafe: 0,
  yaw: 0,
  pitch: 0,
  jump: false,
  fire: false,
  sprint: false,
})
export interface ArenaPlayer {
  id: string
  name: string
  colour: number
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  health: number
  kills: number
  deaths: number
  respawnAt: number
  shieldUntil: number
}
export interface ArenaShot {
  id: number
  owner: string
  from: number[]
  to: number[]
  hit: string | null
  tag: boolean
}
export interface ArenaEvent {
  id: number
  text: string
}
export interface ArenaSnapshot {
  type: 'state'
  now: number
  endsAt: number
  intermissionUntil: number
  round: number
  players: ArenaPlayer[]
  shots: ArenaShot[]
  events: ArenaEvent[]
}
export function validInput(value: unknown): ShooterInput | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (
    ![v.forward, v.strafe, v.yaw, v.pitch].every((n) => typeof n === 'number' && Number.isFinite(n))
  )
    return null
  if (![v.jump, v.fire, v.sprint].every((n) => typeof n === 'boolean')) return null
  return {
    forward: Math.max(-1, Math.min(1, v.forward as number)),
    strafe: Math.max(-1, Math.min(1, v.strafe as number)),
    yaw: (v.yaw as number) % (Math.PI * 2),
    pitch: Math.max(-1.35, Math.min(1.35, v.pitch as number)),
    jump: v.jump as boolean,
    fire: v.fire as boolean,
    sprint: v.sprint as boolean,
  }
}
export function cleanName(value: unknown) {
  return typeof value === 'string'
    ? value
        .replace(/[\p{C}<>]/gu, '')
        .trim()
        .slice(0, 20) || 'Little Pip'
    : 'Little Pip'
}
export function rayBox(
  origin: number[],
  direction: number[],
  min: number[],
  max: number[],
): number | null {
  let near = 0,
    far = 45
  for (let axis = 0; axis < 3; axis++) {
    if (Math.abs(direction[axis]!) < 1e-8) {
      if (origin[axis]! < min[axis]! || origin[axis]! > max[axis]!) return null
      continue
    }
    const a = (min[axis]! - origin[axis]!) / direction[axis]!,
      b = (max[axis]! - origin[axis]!) / direction[axis]!
    near = Math.max(near, Math.min(a, b))
    far = Math.min(far, Math.max(a, b))
    if (far < near) return null
  }
  return near <= 45 && far >= 0 ? near : null
}
export function blockedAt(x: number, y: number, z: number) {
  return (
    Math.abs(x) > ARENA_LIMIT - PLAYER_RADIUS ||
    Math.abs(z) > ARENA_LIMIT - PLAYER_RADIUS ||
    ARENA_COVER.some(
      (b) =>
        y < b.h - 0.04 &&
        y + PLAYER_HEIGHT > 0.05 &&
        x > b.x - b.w / 2 - PLAYER_RADIUS &&
        x < b.x + b.w / 2 + PLAYER_RADIUS &&
        z > b.z - b.d / 2 - PLAYER_RADIUS &&
        z < b.z + b.d / 2 + PLAYER_RADIUS,
    )
  )
}
