export interface SkyDrop {
  id: number
  x: number
  y: number
  cloud: boolean
}
export interface CatchRound {
  elapsed: number
  spawned: number
  drops: SkyDrop[]
  score: number
  caught: number
  clouds: number
  x: number
}
export const createCatchRound = (): CatchRound => ({
  elapsed: 0,
  spawned: 0,
  drops: [],
  score: 0,
  caught: 0,
  clouds: 0,
  x: 50,
})
export const catchDuration = (gentle: boolean) => (gentle ? 30000 : 24000)
export function stepCatch(
  round: CatchRound,
  elapsed: number,
  x: number,
  gentle: boolean,
): CatchRound {
  const dt = Math.max(0, Math.min(100, elapsed))
  const next: CatchRound = {
    ...round,
    elapsed: Math.min(catchDuration(gentle), round.elapsed + dt),
    drops: [],
    x: Math.max(9, Math.min(91, x)),
  }
  const spawned = Math.floor(next.elapsed / 750)
  const drops = [...round.drops]
  for (let id = round.spawned; id < spawned; id++)
    drops.push({ id, x: 10 + ((id * 37 + 17) % 81), y: -8, cloud: id % 5 === 4 })
  next.spawned = spawned
  for (const drop of drops) {
    const y = drop.y + dt * (gentle ? 0.021 : 0.028)
    if (y >= 84) {
      if (Math.abs(drop.x - next.x) <= (gentle ? 16 : 12)) {
        if (drop.cloud) {
          next.score = Math.max(0, next.score - 1)
          next.clouds++
        } else {
          next.score++
          next.caught++
        }
      }
    } else next.drops.push({ ...drop, y })
  }
  return next
}

export const POSTCARD_SYMBOLS = ['❧', '♢', '☾', '☀', '✧', '♡']
export function shuffledPostcards(seed: number) {
  const cards = [...POSTCARD_SYMBOLS, ...POSTCARD_SYMBOLS]
  let random = seed >>> 0 || 1
  for (let i = cards.length - 1; i > 0; i--) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0
    const other = random % (i + 1)
    ;[cards[i], cards[other]] = [cards[other]!, cards[i]!]
  }
  return cards
}

export const FIREFLY_BEATS = Array.from({ length: 12 }, (_, i) => 1800 + i * 1100)
export const FIREFLY_DURATION = FIREFLY_BEATS.at(-1)! + 600
export interface RhythmRound {
  elapsed: number
  notes: number[]
  hits: number
  combo: number
  maxCombo: number
  feedback: string
}
export const createRhythmRound = (): RhythmRound => ({
  elapsed: 0,
  notes: Array(12).fill(0),
  hits: 0,
  combo: 0,
  maxCombo: 0,
  feedback: 'Wait for a firefly to reach the camera frame.',
})
export function stepRhythm(round: RhythmRound, dt: number, gentle: boolean): RhythmRound {
  const next = {
    ...round,
    notes: [...round.notes],
    elapsed: Math.min(FIREFLY_DURATION, round.elapsed + Math.max(0, Math.min(100, dt))),
  }
  FIREFLY_BEATS.forEach((beat, i) => {
    if (next.notes[i] === 0 && next.elapsed > beat + (gentle ? 320 : 190)) {
      next.notes[i] = -1
      next.combo = 0
      next.feedback = 'That one fluttered past. The next is on its way.'
    }
  })
  return next
}
export function tapFirefly(round: RhythmRound, gentle: boolean): RhythmRound {
  const index = FIREFLY_BEATS.findIndex(
    (beat, i) => round.notes[i] === 0 && Math.abs(round.elapsed - beat) <= (gentle ? 320 : 190),
  )
  if (index < 0)
    return {
      ...round,
      combo: 0,
      feedback: 'A little patience. Click when the glow reaches the frame.',
    }
  const notes = [...round.notes]
  notes[index] = 1
  return {
    ...round,
    notes,
    hits: round.hits + 1,
    combo: round.combo + 1,
    maxCombo: Math.max(round.maxCombo, round.combo + 1),
    feedback:
      Math.abs(round.elapsed - FIREFLY_BEATS[index]!) < 85
        ? 'A perfectly tiny photograph. ✧'
        : 'Click. A little glow, safely kept.',
  }
}
