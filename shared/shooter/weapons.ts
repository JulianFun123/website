export const WEAPON_ORDER = ['camera', 'sparkler', 'popper', 'longlens', 'knife'] as const
export type WeaponId = (typeof WEAPON_ORDER)[number]
export const WEAPONS = {
  camera: {
    name: 'Pocket Camera',
    short: 'Camera',
    icon: '⌑',
    colour: '#d9c49c',
    damage: 25,
    cooldown: 300,
    range: 42,
    pellets: 1,
    spread: 0,
    ammo: -1,
  },
  sparkler: {
    name: 'Firefly Sparkler',
    short: 'Sparkler',
    icon: '✧',
    colour: '#c5d7ac',
    damage: 12,
    cooldown: 110,
    range: 35,
    pellets: 1,
    spread: 0.022,
    ammo: 75,
  },
  popper: {
    name: 'Confetti Popper',
    short: 'Popper',
    icon: '✳',
    colour: '#dfb8c9',
    damage: 16,
    cooldown: 850,
    range: 19,
    pellets: 7,
    spread: 0.105,
    ammo: 16,
  },
  longlens: {
    name: 'Moonlight Lens',
    short: 'Long Lens',
    icon: '☾',
    colour: '#b7c7df',
    damage: 70,
    cooldown: 1100,
    range: 90,
    pellets: 1,
    spread: 0.022,
    ammo: 12,
  },
  knife: {
    name: 'Paper Letter Opener',
    short: 'Knife',
    icon: '╱',
    colour: '#dedbc8',
    damage: 55,
    cooldown: 450,
    range: 2.2,
    pellets: 1,
    spread: 0,
    ammo: -1,
  },
} as const
export const freshInventory = (): Record<WeaponId, number> => ({
  camera: -1,
  sparkler: 0,
  popper: 0,
  longlens: 0,
  knife: 0,
})
export const isWeapon = (value: unknown): value is WeaponId =>
  typeof value === 'string' && (WEAPON_ORDER as readonly string[]).includes(value)
export interface WeaponPickup {
  id: string
  kind: WeaponId | 'grenades'
  x: number
  z: number
}
export const WEAPON_PICKUPS: WeaponPickup[] = [
  { id: 'firefly-centre', kind: 'sparkler', x: -3, z: 3 },
  { id: 'confetti-centre', kind: 'popper', x: 3, z: -3 },
  { id: 'knife-west', kind: 'knife', x: -13, z: 9 },
  { id: 'knife-east', kind: 'knife', x: 13, z: -9 },
  { id: 'grenades-centre', kind: 'grenades', x: 0, z: 5 },
  { id: 'lens-north', kind: 'longlens', x: 0, z: -25 },
  { id: 'lens-south', kind: 'longlens', x: 0, z: 25 },
  { id: 'firefly-post', kind: 'sparkler', x: -23, z: -20 },
  { id: 'confetti-frost', kind: 'popper', x: 23, z: 20 },
  { id: 'firefly-library', kind: 'sparkler', x: 23, z: -20 },
  { id: 'confetti-orchard', kind: 'popper', x: -23, z: 20 },
  { id: 'grenades-west', kind: 'grenades', x: -23, z: 0 },
  { id: 'grenades-east', kind: 'grenades', x: 23, z: 0 },
  { id: 'knife-north', kind: 'knife', x: 13, z: -26 },
  { id: 'knife-south', kind: 'knife', x: -13, z: 26 },
  { id: 'grenades-north', kind: 'grenades', x: -13, z: -26 },
  { id: 'grenades-south', kind: 'grenades', x: 13, z: 26 },
]
