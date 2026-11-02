import { adventureJourney } from '../data/adventureJourney.ts'
import {
  adventureLevels,
  adventureStories,
  endingStory,
  afterglowEnding,
} from '../data/photoAdventure.ts'
import { validAdventureState, type AdventureState } from './photoAdventure.ts'

export { ADVENTURE_STORAGE_KEY } from '../data/adventureStorage.ts'
export interface LevelCheckpoint {
  state: AdventureState
  screen: 'story' | 'play' | 'ending' | 'credits'
  frame: number
}
export interface MiniResult {
  score: number
  stars: number
}
export interface JourneyProgress {
  version: 2
  stage: number
  completed: string[]
  checkpoints: Record<string, LevelCheckpoint>
  best: Record<string, MiniResult>
}
export const freshJourney = (): JourneyProgress => ({
  version: 2,
  stage: 0,
  completed: [],
  checkpoints: {},
  best: {},
})
export function stageUnlocked(index: number, progress: JourneyProgress) {
  return (
    index >= 0 &&
    index < adventureJourney.length &&
    (index === 0 || progress.completed.includes(adventureJourney[index - 1]!.id))
  )
}
export function completeJourneyStop(
  progress: JourneyProgress,
  index: number,
  result?: MiniResult,
): JourneyProgress {
  if (!stageUnlocked(index, progress)) return progress
  const stop = adventureJourney[index]!
  const previous = progress.best[stop.id]
  const best =
    result && (!previous || result.score > previous.score)
      ? { ...progress.best, [stop.id]: result }
      : progress.best
  return {
    ...progress,
    completed: [...new Set([...progress.completed, stop.id])],
    stage: Math.min(
      Math.max(index + 1, new Set([...progress.completed, stop.id]).size),
      adventureJourney.length - 1,
    ),
    best,
  }
}
function validCheckpoint(value: unknown, levelIndex: number): value is LevelCheckpoint {
  if (!value || typeof value !== 'object') return false
  const v = value as LevelCheckpoint
  const length =
    v.screen === 'ending'
      ? levelIndex >= 4
        ? afterglowEnding.length
        : endingStory.length
      : adventureStories[levelIndex]!.length
  return (
    ['story', 'play', 'ending', 'credits'].includes(v.screen) &&
    Number.isInteger(v.frame) &&
    v.frame >= 0 &&
    v.frame < length &&
    validAdventureState(v.state, adventureLevels[levelIndex]!)
  )
}
export function readJourney(value: unknown): JourneyProgress | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.version === 1) {
    if (typeof raw.chapter !== 'number') return null
    const chapter = Number(raw.chapter)
    if (!Number.isInteger(chapter) || chapter < 0 || chapter > 3 || !validCheckpoint(raw, chapter))
      return null
    const progress = freshJourney()
    progress.stage = chapter
    progress.completed = adventureJourney.slice(0, chapter).map((stop) => stop.id)
    if (chapter === 3 && (raw.screen === 'ending' || raw.screen === 'credits')) {
      progress.completed.push('sunset')
      progress.stage = 4
    }
    progress.checkpoints[adventureJourney[chapter]!.id] = {
      state: raw.state as AdventureState,
      screen: raw.screen as LevelCheckpoint['screen'],
      frame: Number(raw.frame),
    }
    return progress
  }
  if (
    raw.version !== 2 ||
    !Number.isInteger(raw.stage) ||
    Number(raw.stage) < 0 ||
    Number(raw.stage) >= adventureJourney.length ||
    !Array.isArray(raw.completed) ||
    !raw.checkpoints ||
    typeof raw.checkpoints !== 'object' ||
    !raw.best ||
    typeof raw.best !== 'object'
  )
    return null
  const progress = freshJourney()
  // Only contiguous, legitimately ordered unlocks are restored.
  for (const stop of adventureJourney) {
    if (!raw.completed.includes(stop.id)) break
    progress.completed.push(stop.id)
  }
  for (const stop of adventureJourney) {
    const checkpoint = (raw.checkpoints as Record<string, unknown>)[stop.id]
    if (stop.kind === 'level' && validCheckpoint(checkpoint, stop.level))
      progress.checkpoints[stop.id] = checkpoint
    const best = (raw.best as Record<string, MiniResult>)[stop.id]
    if (
      stop.kind !== 'level' &&
      best &&
      Number.isFinite(best.score) &&
      best.score >= 0 &&
      Number.isInteger(best.stars) &&
      best.stars >= 1 &&
      best.stars <= 3
    )
      progress.best[stop.id] = best
  }
  progress.stage = stageUnlocked(Number(raw.stage), progress)
    ? Number(raw.stage)
    : Math.min(progress.completed.length, adventureJourney.length - 1)
  return progress
}
