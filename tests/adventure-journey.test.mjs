import test from 'node:test'
import assert from 'node:assert/strict'
import { adventureJourney } from '../app/data/adventureJourney.ts'
import { adventureLevels } from '../app/data/photoAdventure.ts'
import { createAdventureState } from '../app/utils/photoAdventure.ts'
import {
  freshJourney,
  readJourney,
  stageUnlocked,
  completeJourneyStop,
} from '../app/utils/adventureProgress.ts'
import {
  createCatchRound,
  stepCatch,
  catchDuration,
  shuffledPostcards,
  POSTCARD_SYMBOLS,
  createRhythmRound,
  stepRhythm,
  tapFirefly,
  FIREFLY_BEATS,
  FIREFLY_DURATION,
} from '../app/utils/adventureArcade.ts'

test('the atlas contains eight photographs and three distinct arcade stops with ordered unlocks', () => {
  assert.equal(adventureJourney.filter((stop) => stop.kind === 'level').length, 8)
  assert.deepEqual(
    adventureJourney.filter((stop) => stop.kind !== 'level').map((stop) => stop.kind),
    ['catch', 'pairs', 'rhythm'],
  )
  assert.equal(new Set(adventureJourney.map((stop) => stop.id)).size, adventureJourney.length)
  let progress = freshJourney()
  assert.equal(stageUnlocked(-1, progress), false)
  assert.equal(stageUnlocked(1, progress), false)
  assert.deepEqual(completeJourneyStop(progress, 5), progress)
  for (let i = 0; i < adventureJourney.length; i++) {
    assert.equal(stageUnlocked(i, progress), true)
    progress = completeJourneyStop(progress, i)
  }
  assert.equal(progress.completed.length, 11)
  assert.equal(completeJourneyStop(progress, 0).stage, 10)
})

test('an existing four-chapter save migrates without losing its position or finished album', () => {
  const state = createAdventureState(adventureLevels[2])
  const migrated = readJourney({ version: 1, chapter: 2, state, screen: 'play', frame: 0 })
  assert.deepEqual(migrated.completed, ['meadow', 'rain'])
  assert.deepEqual(migrated.checkpoints.darkroom.state, state)
  const finished = readJourney({
    version: 1,
    chapter: 3,
    state: createAdventureState(adventureLevels[3]),
    screen: 'credits',
    frame: 0,
  })
  assert.equal(stageUnlocked(4, finished), true)
  assert.equal(finished.stage, 4)
  assert.equal(stageUnlocked(5, finished), false)
  assert.equal(readJourney({ version: 1, chapter: 99 }), null)
})

test('checkpoints, collected objects and arcade records survive a JSON storage round trip', () => {
  let progress = freshJourney()
  for (let i = 0; i <= 4; i++)
    progress = completeJourneyStop(progress, i, i === 4 ? { score: 14, stars: 2 } : undefined)
  progress.checkpoints['post-office'] = {
    state: { ...createAdventureState(adventureLevels[4]), talked: true, collected: [14] },
    screen: 'play',
    frame: 0,
  }
  const restored = readJourney(JSON.parse(JSON.stringify(progress)))
  assert.deepEqual(restored, progress)
  assert.equal(
    completeJourneyStop(restored, 4, { score: 8, stars: 1 }).best['pocket-rain'].score,
    14,
  )
  assert.equal(
    completeJourneyStop(restored, 4, { score: 20, stars: 3 }).best['pocket-rain'].stars,
    3,
  )
})

test('broken storage cannot unlock future worlds or restore invalid board positions', () => {
  assert.equal(readJourney(null), null)
  assert.equal(readJourney({ version: 42 }), null)
  const progress = freshJourney()
  progress.completed = ['meadow', 'sunset']
  progress.stage = 10
  progress.checkpoints.meadow = {
    state: { ...createAdventureState(adventureLevels[0]), position: 999 },
    screen: 'play',
    frame: 0,
  }
  progress.best['pocket-rain'] = { score: NaN, stars: 9 }
  const restored = readJourney(progress)
  assert.deepEqual(restored.completed, ['meadow'])
  assert.equal(restored.stage, 1)
  assert.deepEqual(restored.checkpoints, {})
  assert.deepEqual(restored.best, {})
})

test('catch rounds score each falling object once, penalize clouds and can be won', () => {
  const single = { ...createCatchRound(), drops: [{ id: 1, x: 50, y: 83, cloud: false }] }
  const caught = stepCatch(single, 100, 50, false)
  assert.equal(caught.score, 1)
  assert.equal(stepCatch(caught, 100, 50, false).score, 1)
  assert.equal(
    stepCatch(
      { ...single, score: 3, drops: [{ id: 1, x: 50, y: 83, cloud: true }] },
      100,
      50,
      false,
    ).score,
    2,
  )
  for (const gentle of [false, true]) {
    let round = createCatchRound()
    while (round.elapsed < catchDuration(gentle)) {
      const target = round.drops.filter((drop) => !drop.cloud).sort((a, b) => b.y - a.y)[0]
      round = stepCatch(round, 100, target?.x ?? 50, gentle)
    }
    assert.ok(round.score >= 7, `catch round must be winnable (${gentle}): ${round.score}`)
  }
})

test('postcard shuffles preserve all six pairs without a predictable repeated deck', () => {
  const cards = shuffledPostcards(123)
  for (const symbol of POSTCARD_SYMBOLS)
    assert.equal(cards.filter((card) => card === symbol).length, 2)
  assert.deepEqual(cards, shuffledPostcards(123))
  assert.notDeepEqual(cards, shuffledPostcards(124))
})

test('all twelve fireflies can be timed; repeated taps cannot score the same note twice', () => {
  let round = createRhythmRound()
  for (const beat of FIREFLY_BEATS) {
    while (round.elapsed < beat)
      round = stepRhythm(round, Math.min(100, beat - round.elapsed), false)
    round = tapFirefly(round, false)
    const hits = round.hits
    assert.equal(tapFirefly(round, false).hits, hits)
  }
  while (round.elapsed < FIREFLY_DURATION) round = stepRhythm(round, 100, false)
  assert.equal(round.hits, 12)
  assert.equal(round.maxCombo, 12)
  assert.equal(tapFirefly({ ...createRhythmRound(), elapsed: 1500 }, true).hits, 1)
  assert.equal(tapFirefly({ ...createRhythmRound(), elapsed: 1500 }, false).hits, 0)
})
