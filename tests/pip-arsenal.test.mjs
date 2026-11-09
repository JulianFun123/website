import test from 'node:test'
import assert from 'node:assert/strict'
import { PipArena } from '../server/utils/pipArena.ts'
import {
  ARENA_LIMIT,
  ARENA_COVER,
  SPAWNS,
  blockedAt,
  idleInput,
  validInput,
} from '../shared/shooter/arena.ts'
import { WEAPONS, WEAPON_PICKUPS, freshInventory } from '../shared/shooter/weapons.ts'

function pair() {
  const arena = new PipArena()
  arena.join('a', 'Pip', 0, 1000)
  arena.join('b', 'Moss', 1, 1000)
  const a = arena.sessions.get('a'),
    b = arena.sessions.get('b')
  Object.assign(a.player, { x: -12, y: 0, z: 4, shieldUntil: 0 })
  Object.assign(b.player, { x: -12, y: 0, z: -4, shieldUntil: 0 })
  return { arena, a, b }
}
test('the expanded garden and all 17 pickup pads are reachable outside cover', () => {
  assert.equal(ARENA_LIMIT, 32)
  assert.ok(ARENA_COVER.length >= 25)
  assert.equal(WEAPON_PICKUPS.length, 17)
  for (const pickup of WEAPON_PICKUPS)
    assert.equal(blockedAt(pickup.x, 0, pickup.z), false, pickup.id)
  for (const [x, z] of SPAWNS) assert.equal(blockedAt(x, 0, z), false)
  const queue = [[...SPAWNS[0]]],
    reached = new Set([SPAWNS[0].join(',')])
  for (const [x, z] of queue)
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        key = `${nx},${nz}`
      if (!reached.has(key) && !blockedAt(nx, 0, nz)) {
        reached.add(key)
        queue.push([nx, nz])
      }
    }
  for (const pickup of WEAPON_PICKUPS)
    assert.ok(reached.has(`${pickup.x},${pickup.z}`), `No walkable path to ${pickup.id}`)
})
test('a pickup is shared, equips the winner, and respawns for the other player after 15 seconds', () => {
  const { arena, a, b } = pair(),
    pickup = WEAPON_PICKUPS.find((p) => p.kind === 'sparkler')
  Object.assign(a.player, { x: pickup.x, z: pickup.z })
  Object.assign(b.player, { x: pickup.x + 0.2, z: pickup.z })
  arena.tick(2000, 0.05)
  assert.equal(a.player.weapon, 'sparkler')
  assert.equal(a.player.inventory.sparkler, 75)
  assert.equal(b.player.inventory.sparkler, 0)
  assert.equal(arena.pickupTimers.get(pickup.id), 17000)
  const snapshot = arena.snapshot(2000)
  a.player.inventory.sparkler = 1
  assert.equal(snapshot.players.find((p) => p.id === 'a').inventory.sparkler, 75)
  a.player.x = -12
  a.player.z = 4
  arena.tick(17000, 0.05)
  assert.equal(b.player.inventory.sparkler, 75)
})
test('weapon requests cannot invent an uncollected weapon; finite ammo falls back to the camera', () => {
  const { arena, a, b } = pair()
  arena.input('a', { ...idleInput(), weapon: 'longlens' }, 2000)
  arena.tick(2000, 0.05)
  assert.equal(a.player.weapon, 'camera')
  a.player.inventory.sparkler = 1
  arena.input('a', { ...idleInput(), weapon: 'sparkler', fire: true }, 2300)
  arena.tick(2300, 0.05)
  assert.equal(a.player.inventory.sparkler, 0)
  assert.equal(a.player.weapon, 'camera')
  assert.equal(b.player.health, 88)
  assert.equal(validInput({ ...idleInput(), weapon: 'made-up-gun' }), null)
  assert.equal(validInput({ ...idleInput(), grenade: 999 }), null)
})
test('the knife must be picked up, has unlimited uses, and cannot tag from beyond melee range', () => {
  const { arena, a, b } = pair(),
    pickup = WEAPON_PICKUPS.find((p) => p.kind === 'knife')
  Object.assign(a.player, { x: pickup.x, z: pickup.z })
  Object.assign(b.player, { x: pickup.x, z: pickup.z - 4 })
  arena.tick(2000, 0.05)
  assert.equal(a.player.inventory.knife, -1)
  assert.equal(a.player.weapon, 'knife')
  arena.input('a', { ...idleInput(), fire: true }, 2500)
  arena.tick(2500, 0.05)
  assert.equal(b.player.health, 100)
  b.player.z = pickup.z - 1.7
  arena.input('a', { ...idleInput(), fire: true }, 3000)
  arena.tick(3000, 0.05)
  assert.equal(b.player.health, 45)
  arena.input('a', { ...idleInput(), fire: true }, 3450)
  arena.tick(3450, 0.05)
  assert.equal(b.player.health, 0)
  assert.equal(a.player.kills, 1)
})
test('the popper fires seven bounded pellets and spends only one shell per blast', () => {
  const { arena, a, b } = pair()
  b.player.z = 2.8
  a.player.inventory.popper = 16
  arena.input('a', { ...idleInput(), weapon: 'popper', fire: true }, 2500)
  arena.tick(2500, 0.05)
  const shots = arena.snapshot(2500).shots
  assert.equal(shots.length, 7)
  assert.equal(a.player.inventory.popper, 15)
  assert.equal(a.player.kills, 1)
  assert.ok(
    shots.every(
      (shot) =>
        Math.hypot(...shot.to.map((v, i) => v - shot.from[i])) <= WEAPONS.popper.range + 0.001,
    ),
  )
})
test('the aimed long lens can reach across the larger garden and rewards head-level aim', () => {
  const { arena, a, b } = pair()
  b.player.z = -27
  a.player.inventory.longlens = 12
  arena.input('a', { ...idleInput(), weapon: 'longlens', aim: true, fire: true }, 2500)
  arena.tick(2500, 0.05)
  assert.equal(b.player.health, 0)
  assert.equal(a.player.inventory.longlens, 11)
})
test('grenades require inventory, consume once, bounce within the map and detonate on their fuse', () => {
  const { arena, a } = pair()
  arena.input('a', { ...idleInput(), grenade: true }, 2000)
  arena.tick(2000, 0.05)
  assert.equal(arena.grenades.size, 0)
  a.player.grenades = 2
  arena.input('a', { ...idleInput(), grenade: true }, 2100)
  arena.tick(2100, 0.05)
  assert.equal(arena.grenades.size, 1)
  assert.equal(a.player.grenades, 1)
  arena.input('a', { ...idleInput(), grenade: true }, 2150)
  arena.tick(2150, 0.05)
  assert.equal(a.player.grenades, 1)
  for (let i = 1; i <= 35; i++) arena.tick(2150 + i * 50, 0.05)
  assert.equal(arena.grenades.size, 0)
  assert.equal(arena.snapshot(3900).explosions.length, 1)
  assert.equal(arena.snapshot(3900).explosions.length, 0)
})
test('confetti explosions respect cover and spawn shields, award tags and allow self-damage', () => {
  const { arena, a, b } = pair()
  const blast = (id, now) => {
    arena.grenades.set(id, {
      id,
      owner: 'a',
      x: 0,
      y: 0.14,
      z: 3,
      vx: 0,
      vy: 0,
      vz: 0,
      fuseAt: now,
    })
    arena.tick(now, 0.05)
  }
  Object.assign(b.player, { x: 0, z: -2.2 })
  blast(1, 2500)
  assert.equal(b.player.health, 100)
  Object.assign(b.player, { x: 0, z: 4, shieldUntil: 4000 })
  blast(2, 3000)
  assert.equal(b.player.health, 100)
  b.player.shieldUntil = 0
  blast(3, 3500)
  assert.equal(b.player.health, 0)
  assert.equal(a.player.kills, 1)
  Object.assign(a.player, { x: 0, z: 3.6 })
  blast(4, 4000)
  assert.equal(a.player.health, 0)
  assert.equal(a.player.deaths, 1)
  assert.equal(a.player.kills, 1)
})
test('respawns and round resets clear collected equipment and restore all pickup pads', () => {
  const { arena, a } = pair()
  a.player.inventory.longlens = 12
  a.player.weapon = 'longlens'
  a.player.grenades = 3
  a.player.health = 0
  a.player.respawnAt = 2500
  arena.tick(2500, 0.05)
  assert.deepEqual(a.player.inventory, freshInventory())
  assert.equal(a.player.grenades, 0)
  assert.equal(a.player.weapon, 'camera')
  for (const id of arena.pickupTimers.keys()) arena.pickupTimers.set(id, 999999)
  arena.intermissionUntil = 3000
  arena.tick(3000, 0.05)
  assert.ok([...arena.pickupTimers.values()].every((time) => time === 0))
})
