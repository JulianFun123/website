export const ADVENTURE_COLUMNS = 9
export const ADVENTURE_ROWS = 7

export interface AdventureLevel {
  title: string
  subtitle: string
  theme: 'meadow' | 'rain' | 'night' | 'dawn'
  rows: string[]
  friend: string
  dialogue: string[]
  objective: string
  mothPaths: number[][]
  quirk?: 'wind' | 'ice' | 'portals' | 'tide'
}

export interface AdventureState {
  position: number
  crates: number[]
  collected: number[]
  lanterns: number[]
  talked: boolean
  sequence: number
  turn: number
  mothTurn: number
  stun: number
  cooldown: number
}
export interface AdventureResult {
  state: AdventureState
  message: string
  event?: 'collect' | 'talk' | 'bump' | 'flash' | 'puzzle' | 'exit' | 'ending'
}

export function tiles(level: AdventureLevel, symbol: string) {
  return [...level.rows.join('')].flatMap((tile, index) => (tile === symbol ? [index] : []))
}

export function createAdventureState(level: AdventureLevel): AdventureState {
  return {
    position: tiles(level, 'S')[0] ?? 0,
    crates: tiles(level, 'B'),
    collected: [],
    lanterns: [],
    talked: false,
    sequence: 0,
    turn: 0,
    mothTurn: 0,
    stun: 0,
    cooldown: 0,
  }
}

export function neighbours(a: number, b: number) {
  return (
    Math.abs((a % ADVENTURE_COLUMNS) - (b % ADVENTURE_COLUMNS)) +
      Math.abs(Math.floor(a / ADVENTURE_COLUMNS) - Math.floor(b / ADVENTURE_COLUMNS)) ===
    1
  )
}

export function platesReady(state: AdventureState, level: AdventureLevel) {
  return tiles(level, 'P').every((tile) => state.crates.includes(tile))
}

export function mothPositions(state: AdventureState, level: AdventureLevel) {
  return level.mothPaths.map((path) => path[Math.floor(state.mothTurn / 2) % path.length]!)
}

export function chapterReady(state: AdventureState, level: AdventureLevel) {
  return (
    state.talked &&
    tiles(level, '*').every((tile) => state.collected.includes(tile)) &&
    platesReady(state, level) &&
    tiles(level, 'L').every((tile) => state.lanterns.includes(tile)) &&
    (!tiles(level, 'X').length || state.sequence === tiles(level, 'X').length)
  )
}

function solid(tile: number, state: AdventureState, level: AdventureLevel) {
  const symbol = level.rows.join('')[tile]
  return (
    symbol === undefined ||
    symbol === '#' ||
    symbol === '~' ||
    symbol === 'N' ||
    (symbol === '=' && !platesReady(state, level)) ||
    (symbol === 'T' && !state.stun && state.turn % 4 < 2)
  )
}

function advance(state: AdventureState, level: AdventureLevel): AdventureResult {
  const next = {
    ...state,
    turn: state.turn + 1,
    mothTurn: state.mothTurn + (state.stun ? 0 : 1),
    cooldown: Math.max(0, state.cooldown - 1),
    stun: Math.max(0, state.stun - 1),
  }
  if (!state.stun && mothPositions(next, level).includes(next.position)) {
    next.position = tiles(level, 'S')[0]!
    return {
      state: next,
      message:
        'A startled moth! Pip tumbles back to the entrance. Everything in your pockets is safe.',
      event: 'bump',
    }
  }
  return { state: next, message: '' }
}

export function moveAdventure(
  state: AdventureState,
  level: AdventureLevel,
  to: number,
): AdventureResult {
  if (to < 0 || to >= ADVENTURE_COLUMNS * ADVENTURE_ROWS || !neighbours(state.position, to))
    return { state, message: 'One little hop at a time.' }
  if (solid(to, state, level))
    return {
      state,
      message:
        level.rows.join('')[to] === '='
          ? 'The bridge needs both paperweights on their brass switches.'
          : 'Not this way. There is always another little path.',
    }
  let next = { ...state, crates: [...state.crates], collected: [...state.collected] }
  if (next.crates.includes(to)) {
    const beyond = to + (to - state.position)
    if (
      beyond < 0 ||
      beyond >= ADVENTURE_COLUMNS * ADVENTURE_ROWS ||
      !neighbours(to, beyond) ||
      solid(beyond, next, level) ||
      next.crates.includes(beyond) ||
      tiles(level, 'G').includes(beyond)
    )
      return { state, message: 'That paperweight needs a little more room. Z undoes a hop.' }
    next.crates = next.crates.map((tile) => (tile === to ? beyond : tile))
  }
  next.position = to
  const before = next.collected.length
  const collect = () => {
    if (tiles(level, '*').includes(next.position) && !next.collected.includes(next.position))
      next.collected.push(next.position)
  }
  collect()
  const directions: Record<string, number> = { '>': 1, '<': -1, '^': -9, v: 9 }
  let delta = to - state.position
  for (let step = 0; step < 9; step++) {
    const cell = level.rows.join('')[next.position]!
    if (cell === 'O') {
      const other = tiles(level, 'O').find((portal) => portal !== next.position)
      if (other !== undefined) next.position = other
      collect()
      break
    }
    if (cell !== 'I' && !(cell in directions)) break
    delta = directions[cell] ?? delta
    const destination = next.position + delta
    if (
      !neighbours(next.position, destination) ||
      solid(destination, next, level) ||
      next.crates.includes(destination)
    )
      break
    next.position = destination
    collect()
  }
  const collected = next.collected.length > before
  const result = advance(next, level)
  if (result.event === 'bump') return result
  next = result.state
  if (tiles(level, 'G').includes(next.position)) {
    if (chapterReady(next, level))
      return { state: next, message: 'The photograph remembers its way home.', event: 'exit' }
    return {
      state: next,
      message: 'There is still a little unfinished kindness here. Check your notebook.',
    }
  }
  return {
    state: next,
    message: collected ? 'A memory spark. A tiny piece of the world remembers its colour.' : '',
    event: collected ? 'collect' : undefined,
  }
}

export function interactAdventure(state: AdventureState, level: AdventureLevel): AdventureResult {
  const near = (tile: number) => neighbours(state.position, tile) || state.position === tile
  if (tiles(level, 'N').some(near))
    return {
      state: { ...state, talked: true },
      message: level.dialogue[state.talked ? level.dialogue.length - 1 : 0]!,
      event: 'talk',
    }
  const lantern = tiles(level, 'L').find(near)
  if (lantern !== undefined && !state.lanterns.includes(lantern))
    return {
      state: { ...state, lanterns: [...state.lanterns, lantern], cooldown: 0 },
      message: 'A warm little lantern. The moths look a little less lonely.',
      event: 'puzzle',
    }
  const star = tiles(level, 'X').find(near)
  if (star !== undefined) {
    const order = tiles(level, 'X')
    const correct = order[state.sequence] === star
    return {
      state: {
        ...state,
        sequence: correct ? Math.min(4, state.sequence + 1) : state.sequence === 4 ? 4 : 0,
      },
      message:
        state.sequence === 4
          ? 'All four memories are shining.'
          : correct
            ? [
                'A leaf. Where the journey began.',
                'A raindrop. A friend who stayed.',
                'A moon. A little courage in the dark.',
                'A sun. The way home. Take a photo from the camera mark.',
              ][state.sequence]!
            : 'The stars gently blink out. Remember: leaf, drop, moon, sun.',
      event: 'puzzle',
    }
  }
  const result = advance(state, level)
  return {
    ...result,
    message:
      result.message || 'Pip takes a breath. The world moves one little beat. (E also waits.)',
  }
}

export function flashAdventure(state: AdventureState, level: AdventureLevel): AdventureResult {
  if (tiles(level, 'V').some((tile) => tile === state.position)) {
    return chapterReady(state, level)
      ? { state, message: 'Click. A home made of all the places you have been.', event: 'ending' }
      : {
          state,
          message: tiles(level, 'X').length
            ? 'The album is almost ready. Wake the four memories and speak to the keeper first.'
            : 'A few sparks are still waiting. Find all three, and speak to Tomorrow before the last photograph.',
        }
  }
  if (state.cooldown)
    return {
      state,
      message: `The camera is catching its breath. ${state.cooldown} more little beats.`,
    }
  return {
    state: { ...state, stun: 4, cooldown: 5 },
    message:
      level.quirk === 'tide'
        ? 'Click! The tide holds its breath. Four safe hops across the water.'
        : level.mothPaths.length
          ? 'Click! The moths pause to admire the light. Four safe hops.'
          : 'Click! Pip saves a very ordinary, very lovely moment.',
    event: 'flash',
  }
}

export function validAdventureState(
  value: unknown,
  level: AdventureLevel,
): value is AdventureState {
  if (!value || typeof value !== 'object') return false
  const s = value as AdventureState
  const cell = (n: unknown): n is number =>
    Number.isInteger(n) && Number(n) >= 0 && Number(n) < ADVENTURE_COLUMNS * ADVENTURE_ROWS
  const list = (v: unknown): v is number[] =>
    Array.isArray(v) && v.every(cell) && new Set(v).size === v.length
  return (
    cell(s.position) &&
    list(s.crates) &&
    s.crates.length === tiles(level, 'B').length &&
    list(s.collected) &&
    s.collected.every((n) => tiles(level, '*').includes(n)) &&
    list(s.lanterns) &&
    s.lanterns.every((n) => tiles(level, 'L').includes(n)) &&
    s.crates.every((n) => !solid(n, s, level)) &&
    (!solid(s.position, s, level) || level.rows.join('')[s.position] === 'T') &&
    !s.crates.includes(s.position) &&
    typeof s.talked === 'boolean' &&
    [s.sequence, s.turn, s.mothTurn, s.stun, s.cooldown].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) &&
    s.sequence <= 4 &&
    s.stun <= 4 &&
    s.cooldown <= 5
  )
}
