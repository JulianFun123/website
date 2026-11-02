import test from 'node:test'
import assert from 'node:assert/strict'
import { createJuflixSync } from '../app/utils/juflixSync.ts'

function player({ time = 0, state = 5, rate = 1 } = {}) {
  return {
    time,
    state,
    rate,
    muted: false,
    seeks: [],
    getCurrentTime() {
      return this.time
    },
    getPlayerState() {
      return this.state
    },
    getPlaybackRate() {
      return this.rate
    },
    setPlaybackRate(rate) {
      this.rate = rate
    },
    seekTo(time) {
      this.time = time
      this.seeks.push(time)
    },
    playVideo() {
      this.state = 1
    },
    pauseVideo() {
      this.state = 2
    },
    mute() {
      this.muted = true
    },
  }
}

for (const order of ['primary-first', 'ambient-first']) {
  test(`aligns late player readiness (${order}) and keeps both muted`, (t) => {
    const sync = createJuflixSync()
    const primary = player({ time: 42, state: 1, rate: 1.5 })
    const ambient = player()
    const roles = order === 'primary-first' ? ['primary', 'ambient'] : ['ambient', 'primary']
    for (const role of roles)
      t.after(sync.attach(role, role === 'primary' ? primary : ambient, 'video-a'))
    assert.equal(ambient.time, 42)
    assert.equal(ambient.state, 1)
    assert.equal(ambient.rate, 1.5)
    assert.ok(primary.muted && ambient.muted)
  })
}

test('follows primary pause, buffering, seeking and completion', (t) => {
  const sync = createJuflixSync()
  const primary = player({ state: 1 })
  const ambient = player()
  t.after(sync.attach('primary', primary, 'video-a'))
  t.after(sync.attach('ambient', ambient, 'video-a'))
  for (const state of [2, 3, 0]) {
    ambient.state = 1
    primary.state = state
    sync.onStateChange(primary)
    assert.equal(ambient.state, 2)
  }
  primary.state = 1
  primary.time = 75
  sync.onStateChange(primary)
  assert.equal(ambient.time, 75)
  assert.equal(ambient.state, 1)
})

test('corrects drift periodically without seeking again for small differences', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 10000 })
  const sync = createJuflixSync()
  const primary = player({ time: 30, state: 1 })
  const ambient = player()
  t.after(sync.attach('primary', primary, 'video-a'))
  t.after(sync.attach('ambient', ambient, 'video-a'))
  ambient.time = 28
  const initialSeeks = ambient.seeks.length
  t.mock.timers.tick(1000)
  assert.equal(ambient.seeks.length, initialSeeks)
  t.mock.timers.tick(500)
  assert.equal(ambient.time, 30)
  assert.equal(ambient.seeks.length, initialSeeks + 1)
  ambient.time = 29.9
  t.mock.timers.tick(2000)
  assert.equal(ambient.seeks.length, initialSeeks + 1)
})

test('late cleanup from an old video does not detach the new player', (t) => {
  const sync = createJuflixSync()
  const old = player({ state: 1 })
  const current = player({ state: 1, time: 15 })
  const ambient = player()
  const detachOld = sync.attach('primary', old, 'video-a')
  t.after(sync.attach('ambient', ambient, 'video-a'))
  const detachCurrent = sync.attach('primary', current, 'video-a')
  t.after(detachCurrent)
  detachOld()
  old.time = 99
  sync.onStateChange(old)
  assert.equal(ambient.time, 15)
  current.time = 20
  sync.onStateChange(current)
  assert.equal(ambient.time, 20)
  detachCurrent()
  assert.equal(ambient.state, 2)
})

test('does not seek a newly selected ambient video to the previous video position', (t) => {
  const sync = createJuflixSync()
  t.after(sync.attach('primary', player({ time: 90, state: 1 }), 'old-video'))
  const ambient = player()
  t.after(sync.attach('ambient', ambient, 'new-video'))
  assert.deepEqual(ambient.seeks, [])
  assert.notEqual(ambient.state, 1)
  t.after(sync.attach('primary', player({ time: 3, state: 1 }), 'new-video'))
  assert.equal(ambient.time, 3)
  assert.equal(ambient.state, 1)
})
