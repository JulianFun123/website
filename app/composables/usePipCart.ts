import { CART_TRACKS, buildCartTrack } from '~~/shared/cart/tracks'
import {
  createCartRace,
  stepCartRace,
  cartStandings,
  useCartItem,
  rescueKart,
  idleDrive,
  type CartRace,
  type DriveInput,
} from '~~/shared/cart/race'

export function usePipCart() {
  const selected = ref(0),
    colour = ref(0),
    name = ref('Pip'),
    difficulty = ref<'gentle' | 'peppy'>('peppy')
  const phase = ref<'menu' | 'countdown' | 'race' | 'paused' | 'finished'>('menu')
  const track = computed(() => buildCartTrack(CART_TRACKS[selected.value]!))
  const race = shallowRef<CartRace | null>(null)
  const standings = computed(() => (race.value ? cartStandings(race.value) : []))
  const position = computed(() => standings.value.findIndex((r) => r.id === 0) + 1)
  const player = computed(() => race.value?.racers[0] ?? null)
  const countdown = ref(3)
  const records = ref<Record<string, { time: number; place: number }>>({})
  const autoGas = ref(false)
  const input: DriveInput = idleDrive()
  let remaining = 0,
    accumulator = 0,
    hudTime = 0
  onMounted(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pip-cart-records-v1') || '{}')
      for (const config of CART_TRACKS) {
        const entry = saved[config.id]
        if (
          entry &&
          Number.isFinite(entry.time) &&
          entry.time > 0 &&
          entry.time < 3600 &&
          Number.isInteger(entry.place) &&
          entry.place >= 1 &&
          entry.place <= 8
        )
          records.value[config.id] = entry
      }
      const identity = JSON.parse(localStorage.getItem('pip-shooter-identity') || 'null')
      if (identity && typeof identity.name === 'string') name.value = identity.name.slice(0, 20)
    } catch {
      /* A fresh little trophy shelf is fine. */
    }
  })
  function start() {
    race.value = createCartRace(
      track.value,
      name.value.trim().slice(0, 20) || 'Pip',
      colour.value,
      difficulty.value,
    )
    remaining = 3.2
    countdown.value = 3
    phase.value = 'countdown'
    accumulator = 0
    Object.assign(input, idleDrive())
  }
  function update(dt: number) {
    if (phase.value === 'countdown') {
      remaining -= dt
      countdown.value = Math.max(1, Math.ceil(remaining))
      if (remaining <= 0) phase.value = 'race'
      return
    }
    if (phase.value !== 'race' || !race.value) return
    accumulator += Math.min(0.1, dt)
    while (accumulator >= 1 / 60) {
      stepCartRace(race.value, 1 / 60, input)
      accumulator -= 1 / 60
      if (race.value.racers[0]!.finishedAt !== null) {
        finish()
        break
      }
    }
    hudTime += dt
    if (hudTime > 0.07) {
      triggerRef(race)
      hudTime = 0
    }
  }
  function finish() {
    triggerRef(race)
    phase.value = 'finished'
    Object.assign(input, idleDrive())
    const time = player.value!.finishedAt!,
      place = position.value,
      key = track.value.config.id,
      previous = records.value[key]
    if (!previous || time < previous.time)
      records.value = { ...records.value, [key]: { time, place } }
    try {
      localStorage.setItem('pip-cart-records-v1', JSON.stringify(records.value))
    } catch {
      /* Records remain available during this visit. */
    }
  }
  function pause() {
    if (phase.value === 'race') {
      phase.value = 'paused'
      Object.assign(input, idleDrive())
    }
  }
  function resume() {
    if (phase.value === 'paused') {
      phase.value = 'race'
      accumulator = 0
    }
  }
  function menu() {
    phase.value = 'menu'
    race.value = null
    Object.assign(input, idleDrive())
  }
  function item() {
    if (phase.value === 'race' && race.value) {
      useCartItem(race.value, race.value.racers[0]!)
      triggerRef(race)
    }
  }
  function rescue() {
    if (phase.value === 'race' && race.value && player.value) {
      rescueKart(race.value, player.value)
      triggerRef(race)
    }
  }
  return {
    selected,
    colour,
    name,
    difficulty,
    phase,
    track,
    race,
    standings,
    position,
    player,
    countdown,
    records,
    autoGas,
    input,
    start,
    update,
    pause,
    resume,
    menu,
    item,
    rescue,
  }
}
