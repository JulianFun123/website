import test from 'node:test'
import assert from 'node:assert/strict'
import { PipArena } from '../server/utils/pipArena.ts'
import {
  MAX_PLAYERS,
  ROUND_MS,
  SPAWNS,
  idleInput,
  validInput,
  blockedAt,
  rayBox,
  cleanName,
} from '../shared/shooter/arena.ts'

function pair() {
  const arena = new PipArena()
  arena.join('a', 'Pip', 0, 1000)
  arena.join('b', 'Moss', 1, 1000)
  const a = arena.sessions.get('a'),
    b = arena.sessions.get('b')
  Object.assign(a.player, { x: -12, z: 4, y: 0, shieldUntil: 0 })
  Object.assign(b.player, { x: -12, z: -4, y: 0, shieldUntil: 0 })
  return { arena, a, b }
}
test('the public lobby is bounded and all spawn points are outside solid cover', () => {
  const arena = new PipArena()
  for (let i = 0; i < MAX_PLAYERS; i++) assert.equal(arena.join(`p${i}`, 'A friend', i, 1000), true)
  assert.equal(arena.join('extra', 'One too many', 0, 1000), false)
  assert.equal(arena.sessions.size, MAX_PLAYERS)
  for (const [x, z] of SPAWNS) assert.equal(blockedAt(x, 0, z), false)
  arena.leave('p0')
  assert.equal(arena.join('extra', 'Now there is room', 0, 1200), true)
})
test('network input rejects non-finite aim and clients cannot submit positions, health or tags', () => {
  const input = validInput({
    ...idleInput(),
    forward: 100,
    strafe: -200,
    x: 999,
    health: 999,
    kills: 99,
  })
  assert.equal(input.forward, 1)
  assert.equal(input.strafe, -1)
  assert.equal('x' in input, false)
  assert.equal('health' in input, false)
  for (const bad of [
    null,
    {},
    { ...idleInput(), yaw: Infinity },
    { ...idleInput(), pitch: NaN },
    { ...idleInput(), fire: 1 },
  ])
    assert.equal(validInput(bad), null)
  assert.equal(cleanName('<Pip>\u0000'), 'Pip')
})
test('server movement is normalized, respects cover and stops when input becomes stale', () => {
  const { arena, a } = pair()
  Object.assign(a.player, { x: 0, z: -3 })
  for (let i = 0; i < 20; i++) {
    const now = 2000 + i * 50
    arena.input('a', { ...idleInput(), forward: -1 }, now)
    arena.tick(now, 0.05)
  }
  assert.ok(a.player.z < -1.95)
  Object.assign(a.player, { x: -12, z: 0 })
  arena.input('a', { ...idleInput(), forward: 1, strafe: 1 }, 4000)
  arena.tick(4000, 0.05)
  assert.ok(Math.hypot(a.player.x + 12, a.player.z) <= 4.6 * 0.05 + 0.00001)
  const stopped = { x: a.player.x, z: a.player.z }
  arena.tick(4400, 0.05)
  assert.equal(a.player.x, stopped.x)
  assert.equal(a.player.z, stopped.z)
})
test('Pip can jump onto the low paper stacks and lands on their actual top', () => {
  const { arena, a } = pair()
  Object.assign(a.player, { x: -6, z: -7 })
  let landed = false
  for (let i = 0; i < 30; i++) {
    const now = 2000 + i * 50
    arena.input('a', { ...idleInput(), yaw: Math.PI, forward: i < 13 ? 1 : 0, jump: i === 0 }, now)
    arena.tick(now, 0.05)
    if (a.grounded && Math.abs(a.player.y - 1.3) < 0.01) landed = true
  }
  assert.equal(landed, true)
})
test('four server-validated flashes make a tag and the target respawns with protection', () => {
  const { arena, a, b } = pair()
  for (let i = 0; i < 4; i++) {
    const now = 2500 + i * 300
    arena.input('a', { ...idleInput(), fire: true }, now)
    arena.tick(now, 0.05)
  }
  assert.equal(b.player.health, 0)
  assert.equal(a.player.kills, 1)
  assert.equal(b.player.deaths, 1)
  assert.equal(arena.snapshot(3400).shots.length, 4)
  assert.equal(arena.snapshot(3400).shots.length, 0)
  arena.tick(6400, 0.05)
  assert.equal(b.player.health, 100)
  assert.ok(b.player.shieldUntil > 6400)
})
test('cover, spawn protection, range and the camera cooldown prevent invalid tags', () => {
  const { arena, a, b } = pair()
  Object.assign(a.player, { x: 0, z: 4 })
  Object.assign(b.player, { x: 0, z: -4 })
  arena.input('a', { ...idleInput(), fire: true }, 2500)
  arena.tick(2500, 0.05)
  assert.equal(b.player.health, 100)
  Object.assign(a.player, { x: -12, z: 4 })
  Object.assign(b.player, { x: -12, z: -4, shieldUntil: 4000 })
  arena.input('a', { ...idleInput(), fire: true }, 3000)
  arena.tick(3000, 0.05)
  assert.equal(b.player.health, 100)
  b.player.shieldUntil = 0
  arena.input('a', { ...idleInput(), fire: true }, 3300)
  arena.tick(3300, 0.05)
  assert.equal(b.player.health, 75)
  arena.input('a', { ...idleInput(), fire: true }, 3350)
  arena.tick(3350, 0.05)
  assert.equal(b.player.health, 75)
})
test('ray tests handle parallel rays and reject walls behind the camera', () => {
  assert.equal(rayBox([0, 1, 3], [0, 0, -1], [-1, 0, -1], [1, 2, 1]), 2)
  assert.equal(rayBox([3, 1, 3], [0, 0, -1], [-1, 0, -1], [1, 2, 1]), null)
  assert.equal(rayBox([0, 1, -3], [0, 0, -1], [-1, 0, -1], [1, 2, 1]), null)
})
test('rounds have a results interval, reset scores, and empty lobbies stop the round', () => {
  const { arena, a } = pair()
  a.player.kills = 4
  arena.tick(1000 + ROUND_MS, 0.05)
  assert.ok(arena.intermissionUntil > 1000 + ROUND_MS)
  const intermission = arena.intermissionUntil
  arena.tick(intermission, 0.05)
  assert.equal(arena.round, 2)
  assert.equal(a.player.kills, 0)
  assert.equal(a.player.health, 100)
  arena.leave('a')
  arena.leave('b')
  assert.equal(arena.endsAt, 0)
  assert.equal(arena.intermissionUntil, 0)
})
