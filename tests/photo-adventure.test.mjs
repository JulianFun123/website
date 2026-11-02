import test from 'node:test'
import assert from 'node:assert/strict'
import { adventureLevels } from '../app/data/photoAdventure.ts'
import {
  ADVENTURE_COLUMNS,
  ADVENTURE_ROWS,
  createAdventureState,
  moveAdventure,
  interactAdventure,
  flashAdventure,
  tiles,
  neighbours,
  platesReady,
  chapterReady,
  mothPositions,
  validAdventureState,
} from '../app/utils/photoAdventure.ts'

// Search actual legal turns, including camera cooldowns and moving moths.
function walk(state, level, goal) {
  const queue = [state]
  const visited = new Set()
  for (let cursor = 0; cursor < queue.length && cursor < 50000; cursor++) {
    const current = queue[cursor]
    if (goal(current.position)) return current
    const actions = [-9, 1, 9, -1]
      .filter((delta) => !current.crates.includes(current.position + delta))
      .map((delta) => () => moveAdventure(current, level, current.position + delta))
    if (level.mothPaths.length || level.quirk === 'tide')
      actions.push(
        () => flashAdventure(current, level),
        () => interactAdventure(current, level),
      )
    for (const action of actions) {
      const result = action()
      if (result.state === current || result.event === 'bump') continue
      const next = result.state
      const key = [
        next.position,
        next.mothTurn % 48,
        next.turn % 4,
        next.stun,
        next.cooldown,
        next.crates.join(','),
        next.lanterns.join(','),
      ].join('|')
      if (!visited.has(key)) {
        visited.add(key)
        queue.push(next)
      }
    }
  }
  throw new Error(`No route in ${level.title} from ${state.position}`)
}
const arrive = (state, level, position) => walk(state, level, (cell) => cell === position)
function talk(state, level) {
  return interactAdventure(
    walk(state, level, (cell) => neighbours(cell, tiles(level, 'N')[0])),
    level,
  ).state
}

test('all eight photographs are well formed and every patrol stays off walls', () => {
  for (const level of adventureLevels) {
    assert.equal(level.rows.length, ADVENTURE_ROWS)
    assert.ok(level.rows.every((row) => row.length === ADVENTURE_COLUMNS))
    assert.equal(tiles(level, 'S').length, 1)
    assert.equal(tiles(level, 'N').length, 1)
    for (const tile of level.mothPaths.flat())
      assert.ok(!['#', '~', 'N'].includes(level.rows.join('')[tile]))
    assert.ok(validAdventureState(createAdventureState(level), level))
  }
})

test('hops cannot wrap rows, cross walls or mutate the previous state', () => {
  const level = adventureLevels[0]
  const state = createAdventureState(level)
  const snapshot = JSON.stringify(state)
  assert.equal(moveAdventure(state, level, 1).state, state)
  assert.equal(moveAdventure({ ...state, position: 8 }, level, 9).state.position, 8)
  assert.notEqual(moveAdventure(state, level, 11).state, state)
  assert.equal(JSON.stringify(state), snapshot)
})

test('chapter one requires both memory sparks and a conversation, and can be completed', () => {
  const level = adventureLevels[0]
  let state = createAdventureState(level)
  assert.equal(chapterReady(state, level), false)
  for (const spark of tiles(level, '*')) state = arrive(state, level, spark)
  assert.equal(state.collected.length, 3)
  assert.equal(chapterReady(state, level), false)
  state = talk(state, level)
  assert.equal(chapterReady(state, level), true)
  state = walk(state, level, (pos) => neighbours(pos, tiles(level, 'G')[0]))
  assert.equal(moveAdventure(state, level, tiles(level, 'G')[0]).event, 'exit')
})

test('two paperweights unfold the rain bridge and the complete rain chapter is solvable', () => {
  const level = adventureLevels[1]
  let state = createAdventureState(level)
  assert.equal(platesReady(state, level), false)
  state = arrive(state, level, 19)
  state = moveAdventure(state, level, 20).state
  state = moveAdventure(state, level, 21).state
  assert.ok(state.crates.includes(22))
  state = arrive(state, level, 37)
  state = moveAdventure(state, level, 38).state
  state = moveAdventure(state, level, 39).state
  assert.equal(platesReady(state, level), true)
  state = talk(state, level)
  for (const spark of tiles(level, '*')) state = arrive(state, level, spark)
  assert.equal(chapterReady(state, level), true)
  state = walk(state, level, (pos) => neighbours(pos, tiles(level, 'G')[0]))
  assert.equal(moveAdventure(state, level, tiles(level, 'G')[0]).event, 'exit')
})

test('the camera freezes patrols for four turns, then recharges; bumps keep memories', () => {
  const level = adventureLevels[2]
  let state = flashAdventure(createAdventureState(level), level).state
  const moths = mothPositions(state, level)
  for (let turn = 0; turn < 4; turn++) state = interactAdventure(state, level).state
  assert.deepEqual(mothPositions(state, level), moths)
  assert.equal(state.stun, 0)
  assert.equal(state.cooldown, 1)
  assert.equal(flashAdventure(state, level).state, state)
  state = interactAdventure(state, level).state
  assert.equal(flashAdventure(state, level).event, 'flash')
  const bump = interactAdventure(
    { ...createAdventureState(level), position: 12, collected: [12] },
    level,
  )
  assert.equal(bump.event, 'bump')
  assert.deepEqual(bump.state.collected, [12])
  assert.equal(bump.state.position, tiles(level, 'S')[0])
})

test('the darkroom can be completed with real patrols and the camera mechanic', () => {
  const level = adventureLevels[2]
  let state = createAdventureState(level)
  state = talk(state, level)
  for (const lantern of tiles(level, 'L')) {
    state = arrive(state, level, lantern)
    state = interactAdventure(state, level).state
  }
  for (const spark of tiles(level, '*')) state = arrive(state, level, spark)
  assert.equal(chapterReady(state, level), true)
  state = walk(state, level, (pos) => neighbours(pos, tiles(level, 'G')[0]))
  assert.equal(moveAdventure(state, level, tiles(level, 'G')[0]).event, 'exit')
})

test('the last photograph needs the correct memory sequence and the camera mark', () => {
  const level = adventureLevels[3]
  let state = talk(createAdventureState(level), level)
  const stars = tiles(level, 'X')
  state = arrive(state, level, stars[1])
  state = interactAdventure(state, level).state
  assert.equal(state.sequence, 0)
  for (const star of stars) {
    state = arrive(state, level, star)
    state = interactAdventure(state, level).state
  }
  assert.equal(state.sequence, 4)
  assert.notEqual(flashAdventure(state, level).event, 'ending')
  state = arrive(state, level, tiles(level, 'V')[0])
  assert.equal(flashAdventure(state, level).event, 'ending')
})

test('invalid and incompatible saved positions are rejected safely', () => {
  const level = adventureLevels[1]
  const state = createAdventureState(level)
  for (const value of [
    null,
    {},
    { ...state, position: 0 },
    { ...state, collected: [999] },
    { ...state, crates: [] },
    { ...state, position: state.crates[0] },
    { ...state, sequence: 5 },
    { ...state, mothTurn: -1 },
  ])
    assert.equal(validAdventureState(value, level), false)
})

test('all four new worlds can be completed using their actual special terrain', () => {
  for (const level of adventureLevels.slice(4)) {
    let state = talk(createAdventureState(level), level)
    for (const spark of tiles(level, '*')) state = arrive(state, level, spark)
    assert.equal(chapterReady(state, level), true, level.title)
    const gate = tiles(level, 'G')[0]
    if (gate !== undefined) {
      state = walk(state, level, (pos) => neighbours(pos, gate))
      assert.equal(moveAdventure(state, level, gate).event, 'exit', level.title)
    } else {
      state = arrive(state, level, tiles(level, 'V')[0])
      assert.equal(flashAdventure(state, level).event, 'ending', level.title)
    }
  }
})

test('wind carries Pip, ice slides as one undoable turn, and portals connect the two halves', () => {
  const wind = adventureLevels[4]
  const breeze = moveAdventure({ ...createAdventureState(wind), position: 11 }, wind, 12)
  assert.equal(breeze.state.position, 13)
  const ice = adventureLevels[5]
  const slide = moveAdventure({ ...createAdventureState(ice), position: 29 }, ice, 30)
  assert.equal(slide.state.position, 33)
  assert.equal(slide.state.turn, 1)
  const portal = adventureLevels[6]
  assert.equal(
    moveAdventure({ ...createAdventureState(portal), position: 11 }, portal, 12).state.position,
    41,
  )
})

test('tide crossings respect their cycle and the camera gives four safe hops', () => {
  const level = adventureLevels[7]
  const state = { ...createAdventureState(level), position: 30 }
  assert.equal(moveAdventure(state, level, 31).state.position, 30)
  const low = { ...state, turn: 2 }
  assert.equal(moveAdventure(low, level, 31).state.position, 31)
  const frozen = flashAdventure(state, level).state
  assert.equal(moveAdventure(frozen, level, 31).state.position, 31)
  assert.equal(validAdventureState({ ...state, position: 31 }, level), true)
})
