import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CART_TRACKS,
  buildCartTrack,
  trackPoint,
  nearestTrackPoint,
} from '../shared/cart/tracks.ts'
import {
  createCartRace,
  stepCartRace,
  driveCartAI,
  cartStandings,
  rescueKart,
  useCartItem,
  idleDrive,
  RACE_LAPS,
} from '../shared/cart/race.ts'

const fresh = (index = 0) => createCartRace(buildCartTrack(CART_TRACKS[index]), 'Pip', 0)
function place(race, racer, progress, lane = 0) {
  const p = trackPoint(race.track, progress, lane)
  Object.assign(racer, {
    x: p.x,
    z: p.z,
    y: p.y,
    yaw: Math.atan2(p.tx, p.tz),
    progress,
    vx: 0,
    vz: 0,
    speed: 0,
  })
}
function isolate(race) {
  for (const racer of race.racers.slice(1)) racer.finishedAt = 100
}

test('three distinct closed roads have finite, evenly spaced samples and consistent lane offsets', () => {
  assert.equal(CART_TRACKS.length, 3)
  assert.equal(new Set(CART_TRACKS.map((t) => t.id)).size, 3)
  for (const config of CART_TRACKS) {
    const track = buildCartTrack(config)
    assert.ok(track.length > 250 && track.length < 400)
    const distances = track.samples.map((p, i) => {
      assert.ok(Object.values(p).every(Number.isFinite))
      assert.ok(Math.abs(Math.hypot(p.tx, p.tz) - 1) < 1e-9)
      const next = track.samples[(i + 1) % track.samples.length]
      return Math.hypot(p.x - next.x, p.z - next.z)
    })
    assert.ok(Math.max(...distances) / Math.min(...distances) < 1.02)
    assert.deepEqual(trackPoint(track, 0), trackPoint(track, 1))
    const centre = trackPoint(track, 0.5),
      right = trackPoint(track, 0.5, 2)
    assert.ok(Math.abs(Math.hypot(right.x - centre.x, right.z - centre.z) - 2) < 1e-9)
    assert.ok(Math.abs(nearestTrackPoint(track, right.x, right.z).lane - 2) < 0.05)
  }
})

for (let index = 0; index < CART_TRACKS.length; index++) {
  test(`all eight drivers can complete all three laps on ${CART_TRACKS[index].id}`, () => {
    const race = fresh(index)
    for (let i = 0; i < 60 * 180 && race.racers.some((r) => r.finishedAt === null); i++)
      stepCartRace(race, 1 / 60, driveCartAI(race, race.racers[0]))
    for (const racer of race.racers) {
      assert.ok(racer.finishedAt > 20 && racer.finishedAt < 180, racer.name)
      assert.equal(racer.gates, RACE_LAPS * 12)
      assert.ok(racer.progress < 0.01, 'finish is awarded only after crossing the line')
    }
    const result = cartStandings(race)
    for (let i = 1; i < result.length; i++)
      assert.ok(result[i - 1].finishedAt <= result[i].finishedAt)
  })
}

test('crossing the start beats the waiting grid, without awarding an unearned lap', () => {
  const race = fresh(),
    player = race.racers[0]
  place(race, player, 0.003)
  assert.equal(cartStandings(race)[0], player)
  isolate(race)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.gates, 0)
  place(race, player, 0.5)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.gates, 0, 'skipping the first checkpoints cannot advance the lap')
  player.gates = 35
  place(race, player, 0.985)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.finishedAt, null, 'being near the finish is not crossing it')
  place(race, player, 0.002)
  player.yaw += Math.PI
  player.progress = 0.995
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.finishedAt, null, 'a reverse crossing is not a finish')
  player.yaw -= Math.PI
  player.progress = 0.995
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.gates, 36)
  assert.equal(player.finishedAt, race.elapsed)
})

test('right steering turns right relative to the driver and the chase camera', () => {
  const race = fresh(),
    player = race.racers[0]
  isolate(race)
  place(race, player, 0.3)
  player.speed = 20
  const yaw = player.yaw
  stepCartRace(race, 1 / 60, { ...idleDrive(), throttle: 1, steer: 1 })
  // With +Z forward, screen right is -X; compare against the initial right vector.
  const rightX = -Math.cos(yaw),
    rightZ = Math.sin(yaw)
  assert.ok(Math.sin(player.yaw) * rightX + Math.cos(player.yaw) * rightZ > 0)
})

test('item boxes are shared, do not overwrite a held item, and return after seven seconds', () => {
  const race = fresh(),
    player = race.racers[0],
    rival = race.racers[1],
    box = race.boxes[0]
  isolate(race)
  place(race, player, box.progress, box.lane)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.ok(player.item)
  const original = player.item
  assert.equal(box.readyAt, race.elapsed + 7)
  rival.finishedAt = null
  rival.itemAt = Infinity
  place(race, rival, box.progress, box.lane)
  place(race, player, 0.05)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(rival.item, null)
  race.elapsed = box.readyAt
  place(race, rival, box.progress, box.lane)
  stepCartRace(race, 1 / 60, idleDrive())
  assert.ok(rival.item)
  assert.equal(player.item, original)
})

test('bubble absorbs a hazard once; a later puddle spins the kart and planes expire', () => {
  const race = fresh(),
    player = race.racers[0]
  isolate(race)
  player.item = 'bubble'
  useCartItem(race, player)
  assert.equal(player.item, null)
  assert.equal(player.shieldUntil, 8)
  const puddle = (id) => ({
    id,
    owner: 1,
    x: player.x,
    z: player.z,
    y: player.y,
    expires: race.elapsed + 18,
  })
  race.hazards.push(puddle(1))
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(player.spinUntil, 0)
  assert.equal(player.shieldUntil, 0)
  assert.equal(race.hazards.length, 0)
  race.hazards.push(puddle(2))
  stepCartRace(race, 1 / 60, idleDrive())
  assert.ok(player.spinUntil > race.elapsed)
  race.planes.push({ id: 3, owner: 0, target: 1, x: 999, z: 999, y: 0, expires: 0 })
  stepCartRace(race, 1 / 60, idleDrive())
  assert.equal(race.planes.length, 0)
})

test('drifts need movement and steering; releasing a charged drift grants a temporary boost', () => {
  const race = fresh(),
    player = race.racers[0]
  isolate(race)
  for (let i = 0; i < 90; i++)
    stepCartRace(race, 1 / 60, { ...idleDrive(), drift: true, steer: 0.2 })
  assert.equal(player.drift, 0)
  for (let i = 0; i < 50; i++) {
    place(race, player, 0.3)
    player.speed = 18
    stepCartRace(race, 1 / 60, { ...idleDrive(), throttle: 1, drift: true, steer: 0.3 })
  }
  assert.ok(player.drift > 0.55)
  stepCartRace(race, 1 / 60, { ...idleDrive(), throttle: 1 })
  assert.ok(player.boostUntil > race.elapsed)
  assert.equal(player.drift, 0)
})

test('a helping ribbon returns to the last safe road without advancing checkpoints', () => {
  for (const index of [0, 1, 2]) {
    const race = fresh(index),
      player = race.racers[0]
    isolate(race)
    player.lastSafe = 0.3
    player.gates = 3
    player.x = 1000
    player.z = 1000
    rescueKart(race, player)
    assert.ok(nearestTrackPoint(race.track, player.x, player.z).distance < 1.1)
    assert.equal(player.gates, 3)
    assert.ok(player.rescueUntil > race.elapsed)
    const p = trackPoint(race.track, 0.3)
    assert.ok(Math.sin(player.yaw) * p.tx + Math.cos(player.yaw) * p.tz > 0.99)
    if (index > 0) {
      place(race, player, 0.3, race.track.config.width)
      player.fall = 1.2
      stepCartRace(race, 1 / 60, idleDrive())
      assert.equal(player.fall, 0)
      assert.ok(nearestTrackPoint(race.track, player.x, player.z).distance < 1.1)
    }
  }
})
