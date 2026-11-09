import { isWeapon, type WeaponId } from './weapons.ts'
export const ARENA_LIMIT = 32
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
  ...[-1, 1].flatMap((side) => [
    { x: side * 19, z: -18, w: 5.5, d: 1.6, h: 1.3, kind: 'paper' as const },
    { x: side * 19, z: 18, w: 5.5, d: 1.6, h: 1.3, kind: 'paper' as const },
    { x: side * 25, z: -10, w: 1.8, d: 6, h: 2.6, kind: 'album' as const },
    { x: side * 25, z: 10, w: 1.8, d: 6, h: 2.6, kind: 'album' as const },
    { x: side * 17, z: -5, w: 1.7, d: 3.4, h: 1.9, kind: 'planter' as const },
    { x: side * 17, z: 5, w: 1.7, d: 3.4, h: 1.9, kind: 'planter' as const },
    { x: side * 9, z: -21, w: 1.8, d: 4, h: 2.5, kind: 'album' as const },
    { x: side * 9, z: 21, w: 1.8, d: 4, h: 2.5, kind: 'album' as const },
    { x: side * 4, z: -17, w: 3, d: 1.4, h: 0.75, kind: 'paper' as const },
    { x: side * 4, z: 17, w: 3, d: 1.4, h: 0.75, kind: 'paper' as const },
  ]),
]
export const SPAWNS = [
  [-28, -28],
  [28, 28],
  [-28, 28],
  [28, -28],
  [0, -29],
  [0, 29],
  [-29, -4],
  [29, 4],
  [-15, -28],
  [15, 28],
  [-28, 15],
  [28, -15],
] as const
export interface ShooterInput {
  forward: number
  strafe: number
  yaw: number
  pitch: number
  jump: boolean
  fire: boolean
  sprint: boolean
  grenade: boolean
  aim: boolean
  weapon: WeaponId | null
}
export const idleInput = (): ShooterInput => ({
  forward: 0,
  strafe: 0,
  yaw: 0,
  pitch: 0,
  jump: false,
  fire: false,
  sprint: false,
  grenade: false,
  aim: false,
  weapon: null,
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
  weapon: WeaponId
  inventory: Record<WeaponId, number>
  grenades: number
}
export interface ArenaShot {
  id: number
  owner: string
  from: number[]
  to: number[]
  hit: string | null
  tag: boolean
  weapon: WeaponId
}
export interface ArenaGrenade {
  id: number
  owner: string
  x: number
  y: number
  z: number
  fuseAt: number
}
export interface ArenaExplosion {
  id: number
  owner: string
  x: number
  y: number
  z: number
  radius: number
  hits: string[]
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
  pickups: { id: string; availableAt: number }[]
  grenades: ArenaGrenade[]
  explosions: ArenaExplosion[]
}
export function validInput(value: unknown): ShooterInput | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (
    ![v.forward, v.strafe, v.yaw, v.pitch].every((n) => typeof n === 'number' && Number.isFinite(n))
  )
    return null
  if (![v.jump, v.fire, v.sprint].every((n) => typeof n === 'boolean')) return null
  if (v.grenade !== undefined && typeof v.grenade !== 'boolean') return null
  if (v.aim !== undefined && typeof v.aim !== 'boolean') return null
  if (v.weapon !== undefined && v.weapon !== null && !isWeapon(v.weapon)) return null
  return {
    forward: Math.max(-1, Math.min(1, v.forward as number)),
    strafe: Math.max(-1, Math.min(1, v.strafe as number)),
    yaw: (v.yaw as number) % (Math.PI * 2),
    pitch: Math.max(-1.35, Math.min(1.35, v.pitch as number)),
    jump: v.jump as boolean,
    fire: v.fire as boolean,
    sprint: v.sprint as boolean,
    grenade: v.grenade === true,
    aim: v.aim === true,
    weapon: isWeapon(v.weapon) ? v.weapon : null,
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
    far = 100
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
  return near <= 100 && far >= 0 ? near : null
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
