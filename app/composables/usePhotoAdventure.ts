import {
  adventureLevels,
  adventureStories,
  endingStory,
  afterglowEnding,
} from '~/data/photoAdventure'
import {
  createAdventureState,
  moveAdventure,
  interactAdventure,
  flashAdventure,
  tiles,
  chapterReady,
  type AdventureState,
  type AdventureResult,
} from '~/utils/photoAdventure'

import { adventureJourney } from '~/data/adventureJourney'
import {
  ADVENTURE_STORAGE_KEY,
  freshJourney,
  readJourney,
  completeJourneyStop,
  stageUnlocked,
  type MiniResult,
} from '~/utils/adventureProgress'

type Screen = 'title' | 'world' | 'minigame' | 'story' | 'play' | 'ending' | 'credits'
const copy = (state: AdventureState): AdventureState => ({
  ...state,
  crates: [...state.crates],
  collected: [...state.collected],
  lanterns: [...state.lanterns],
})

export function usePhotoAdventure() {
  const stage = ref(0)
  const progress = ref(freshJourney())
  const stop = computed(() => adventureJourney[stage.value]!)
  const chapter = computed(() => stop.value.level)
  const access = useAdventureAccess()
  const level = computed(() => adventureLevels[chapter.value]!)
  const state = ref(createAdventureState(level.value))
  const screen = ref<Screen>('title')
  const frame = ref(0)
  const saved = computed(
    () => Object.keys(progress.value.checkpoints).length > 0 || progress.value.completed.length > 0,
  )
  const journal = ref(false)
  const paused = ref(false)
  const dialogue = ref<number | null>(null)
  const message = ref('Every photograph has a little door. Let’s see where this one goes.')
  const flash = ref(false)
  const history = ref<AdventureState[]>([])
  const sceneFrames = computed(() =>
    screen.value === 'ending'
      ? chapter.value >= 4
        ? afterglowEnding
        : endingStory
      : adventureStories[chapter.value]!,
  )
  const storyFrame = computed(() => sceneFrames.value[frame.value]!)
  const ready = computed(() => chapterReady(state.value, level.value))
  const sparks = computed(() => tiles(level.value, '*').length)
  let flashTimer: ReturnType<typeof setTimeout> | undefined
  let lastMove = 0

  function persist() {
    if (!import.meta.client || screen.value === 'title') return
    if (
      stop.value.kind === 'level' &&
      ['story', 'play', 'ending', 'credits'].includes(screen.value)
    ) {
      progress.value.checkpoints[stop.value.id] = {
        state: copy(state.value),
        screen: screen.value as 'story' | 'play' | 'ending' | 'credits',
        frame: frame.value,
      }
    }
    access.markPlayed()
    try {
      localStorage.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(progress.value))
    } catch {
      /* The adventure also works without storage. */
    }
  }

  onMounted(() => {
    try {
      const restored = readJourney(
        JSON.parse(localStorage.getItem(ADVENTURE_STORAGE_KEY) || 'null'),
      )
      if (restored) {
        progress.value = restored
        stage.value = restored.stage
        state.value = createAdventureState(level.value)
      }
    } catch {
      /* Invalid or older data never prevents a fresh adventure. */
    }
  })
  onBeforeUnmount(() => clearTimeout(flashTimer))

  function openWorld() {
    persist()
    screen.value = 'world'
    journal.value = false
    paused.value = false
    dialogue.value = null
    persist()
  }

  function selectStage(index: number, replay = false) {
    if (!stageUnlocked(index, progress.value)) return
    persist()
    stage.value = index
    progress.value.stage = index
    history.value = []
    journal.value = false
    paused.value = false
    dialogue.value = null
    if (stop.value.kind === 'level') {
      const checkpoint = replay ? null : progress.value.checkpoints[stop.value.id]
      state.value = checkpoint ? copy(checkpoint.state) : createAdventureState(level.value)
      frame.value = checkpoint?.frame ?? 0
      screen.value = checkpoint?.screen ?? 'story'
    } else screen.value = 'minigame'
    message.value = 'Pip checks the camera strap. Ready when you are.'
    persist()
  }

  function begin(resume = false) {
    if (resume) openWorld()
    else selectStage(0, true)
  }

  function recordMini(result: MiniResult) {
    if (stop.value.kind === 'level') return
    progress.value = completeJourneyStop(progress.value, stage.value, result)
    persist()
  }
  function completeMini(result: MiniResult) {
    recordMini(result)
    screen.value = 'world'
    persist()
  }

  function nextFrame() {
    if (frame.value + 1 < sceneFrames.value.length) frame.value++
    else {
      screen.value = screen.value === 'ending' ? 'credits' : 'play'
      frame.value = 0
    }
    persist()
  }

  function apply(result: AdventureResult) {
    if (result.state !== state.value) {
      history.value = [...history.value.slice(-59), copy(state.value)]
      state.value = result.state
    }
    if (result.message) message.value = result.message
    if (result.event === 'talk') dialogue.value = 0
    if (result.event === 'flash') {
      flash.value = true
      clearTimeout(flashTimer)
      flashTimer = setTimeout(() => {
        flash.value = false
      }, 300)
    }
    if (result.event === 'exit') {
      progress.value = completeJourneyStop(progress.value, stage.value)
      persist()
      progress.value.checkpoints[stop.value.id] = {
        state: copy(state.value),
        screen: 'credits',
        frame: 0,
      }
      screen.value = 'world'
    }
    if (result.event === 'ending') {
      progress.value = completeJourneyStop(progress.value, stage.value)
      screen.value = 'ending'
      frame.value = 0
    }
    persist()
  }

  const canAct = () =>
    screen.value === 'play' && !journal.value && !paused.value && dialogue.value === null
  function move(to: number) {
    if (canAct()) apply(moveAdventure(state.value, level.value, to))
  }
  function interact() {
    if (canAct()) apply(interactAdventure(state.value, level.value))
  }
  function takePhoto() {
    if (canAct()) apply(flashAdventure(state.value, level.value))
  }
  function undo() {
    if (!canAct()) return
    const previous = history.value.pop()
    if (previous) {
      state.value = previous
      message.value = 'One little step back. Everyone deserves an undo.'
      persist()
    } else message.value = 'This is the beginning of this little chapter.'
  }
  function restart() {
    history.value = [...history.value.slice(-59), copy(state.value)]
    state.value = createAdventureState(level.value)
    message.value = 'A fresh page. Your earlier chapters are safe. Z can undo this restart, too.'
    persist()
  }
  function onKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (key === 'escape' && (journal.value || paused.value || dialogue.value !== null)) {
      event.preventDefault()
      event.stopPropagation()
      journal.value = false
      paused.value = false
      dialogue.value = null
      return
    }
    if (event.target instanceof HTMLButtonElement && (key === ' ' || key === 'enter')) return
    if (
      (screen.value === 'story' || screen.value === 'ending') &&
      (key === ' ' || key === 'enter')
    ) {
      event.preventDefault()
      if (!event.repeat) nextFrame()
      return
    }
    if (screen.value !== 'play') return
    if (key === 'j') {
      event.preventDefault()
      if (!event.repeat) journal.value = !journal.value
      return
    }
    if (key === 'p') {
      event.preventDefault()
      if (!event.repeat) paused.value = !paused.value
      return
    }
    if (dialogue.value !== null) {
      if (key === 'e' || key === 'enter' || key === ' ') {
        event.preventDefault()
        if (!event.repeat)
          dialogue.value =
            dialogue.value + 1 < level.value.dialogue.length ? dialogue.value + 1 : null
      }
      return
    }
    if (!canAct()) return
    const offsets: Record<string, number> = {
      arrowleft: -1,
      a: -1,
      arrowright: 1,
      d: 1,
      arrowup: -9,
      w: -9,
      arrowdown: 9,
      s: 9,
    }
    if (key in offsets) {
      event.preventDefault()
      if (!event.repeat || Date.now() - lastMove >= 125) {
        lastMove = Date.now()
        move(state.value.position + offsets[key]!)
      }
    } else if (['e', ' ', 'z', 'r'].includes(key)) {
      event.preventDefault()
      const actions: Record<string, () => void> = {
        e: interact,
        ' ': takePhoto,
        z: undo,
        r: restart,
      }
      if (!event.repeat) actions[key]?.()
    }
  }
  return {
    chapter,
    stage,
    stop,
    progress,
    openWorld,
    selectStage,
    completeMini,
    recordMini,
    level,
    state,
    screen,
    frame,
    saved,
    journal,
    paused,
    dialogue,
    message,
    flash,
    history,
    sceneFrames,
    storyFrame,
    ready,
    sparks,
    begin,
    nextFrame,
    move,
    interact,
    takePhoto,
    undo,
    restart,
    onKey,
  }
}
