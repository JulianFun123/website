export interface CartTrack {
  id: string
  name: string
  subtitle: string
  description: string
  theme: 'meadow' | 'rain' | 'moon'
  width: number
  colour: string
  points: [number, number][]
  boosts: number[]
  boxes: number[]
}
export const CART_TRACKS: CartTrack[] = [
  {
    id: 'moss-mail',
    name: 'Moss & Mail Circuit',
    subtitle: '01 / a little countryside mischief',
    description:
      'Wide paper corners, little orchards and a post office that has never delivered anything on time.',
    theme: 'meadow',
    width: 10,
    colour: '#b6c89b',
    points: [
      [-42, -5],
      [-34, -32],
      [0, -40],
      [38, -26],
      [45, 8],
      [27, 34],
      [-10, 42],
      [-43, 25],
    ],
    boosts: [0.12, 0.52, 0.82],
    boxes: [0.22, 0.46, 0.72, 0.94],
  },
  {
    id: 'puddle-pass',
    name: 'Puddle Postcard Pass',
    subtitle: '02 / puddles have right of way',
    description:
      'A winding postcard above the water. A few hairpins, a few bridges, and absolutely no dry socks.',
    theme: 'rain',
    width: 9,
    colour: '#a7c7c9',
    points: [
      [-50, -25],
      [-12, -38],
      [5, -14],
      [34, -35],
      [57, -10],
      [40, 15],
      [12, 10],
      [-5, 36],
      [-40, 30],
      [-54, 8],
    ],
    boosts: [0.08, 0.4, 0.78],
    boxes: [0.18, 0.43, 0.69, 0.9],
  },
  {
    id: 'moon-ribbon',
    name: 'Moonlight Ribbonway',
    subtitle: '03 / the sky forgot its speed limit',
    description:
      'A glowing ribbon folded through the clouds. Stay on the paper; the moon is a very patient spectator.',
    theme: 'moon',
    width: 9.5,
    colour: '#beb4d1',
    points: [
      [-42, -30],
      [-5, -45],
      [34, -35],
      [50, -4],
      [28, 18],
      [39, 42],
      [4, 48],
      [-25, 32],
      [-49, 10],
      [-24, -3],
    ],
    boosts: [0.15, 0.49, 0.84],
    boxes: [0.23, 0.45, 0.67, 0.93],
  },
]
export interface TrackPoint {
  x: number
  z: number
  y: number
  tx: number
  tz: number
}
export interface BuiltTrack {
  config: CartTrack
  samples: TrackPoint[]
  length: number
}
const wrap = (n: number, size: number) => ((n % size) + size) % size
function curve(points: [number, number][], t: number) {
  const n = points.length,
    p = t * n,
    i = Math.floor(p),
    f = p - i
  const a = points[wrap(i - 1, n)]!,
    b = points[wrap(i, n)]!,
    c = points[wrap(i + 1, n)]!,
    d = points[wrap(i + 2, n)]!
  return [0, 1].map(
    (axis) =>
      0.5 *
      (2 * b[axis]! +
        (-a[axis]! + c[axis]!) * f +
        (2 * a[axis]! - 5 * b[axis]! + 4 * c[axis]! - d[axis]!) * f * f +
        (-a[axis]! + 3 * b[axis]! - 3 * c[axis]! + d[axis]!) * f * f * f),
  ) as [number, number]
}
function height(theme: CartTrack['theme'], t: number) {
  return theme === 'moon'
    ? 14 + 4 * Math.sin(t * Math.PI * 2) + 1.5 * Math.sin(t * Math.PI * 4)
    : theme === 'rain'
      ? 4 + 2.6 * Math.sin(t * Math.PI * 2)
      : 0.45 + 0.35 * Math.sin(t * Math.PI * 4)
}
export function buildCartTrack(config: CartTrack): BuiltTrack {
  const raw = Array.from({ length: 1201 }, (_, i) => curve(config.points, i / 1200)),
    distances = [0]
  for (let i = 1; i < raw.length; i++)
    distances.push(
      distances[i - 1]! + Math.hypot(raw[i]![0] - raw[i - 1]![0], raw[i]![1] - raw[i - 1]![1]),
    )
  const length = distances.at(-1)!,
    samples: TrackPoint[] = []
  let cursor = 1
  for (let i = 0; i < 360; i++) {
    const target = (i / 360) * length
    while (cursor < raw.length - 1 && distances[cursor]! < target) cursor++
    const a = raw[cursor - 1]!,
      b = raw[cursor]!,
      f =
        (target - distances[cursor - 1]!) /
        Math.max(0.001, distances[cursor]! - distances[cursor - 1]!)
    samples.push({
      x: a[0] + (b[0] - a[0]) * f,
      z: a[1] + (b[1] - a[1]) * f,
      y: height(config.theme, i / 360),
      tx: 0,
      tz: 0,
    })
  }
  for (let i = 0; i < samples.length; i++) {
    const a = samples[wrap(i - 1, samples.length)]!,
      b = samples[wrap(i + 1, samples.length)]!,
      l = Math.hypot(b.x - a.x, b.z - a.z)
    samples[i]!.tx = (b.x - a.x) / l
    samples[i]!.tz = (b.z - a.z) / l
  }
  return { config, samples, length }
}
export function trackPoint(track: BuiltTrack, progress: number, lane = 0): TrackPoint {
  const t = wrap(progress, 1) * track.samples.length,
    i = Math.floor(t),
    f = t - i,
    a = track.samples[i]!,
    b = track.samples[(i + 1) % track.samples.length]!
  const tx = a.tx + (b.tx - a.tx) * f,
    tz = a.tz + (b.tz - a.tz) * f,
    l = Math.hypot(tx, tz)
  return {
    x: a.x + (b.x - a.x) * f + (tz / l) * lane,
    z: a.z + (b.z - a.z) * f - (tx / l) * lane,
    y: a.y + (b.y - a.y) * f,
    tx: tx / l,
    tz: tz / l,
  }
}
export function nearestTrackPoint(track: BuiltTrack, x: number, z: number) {
  let index = 0,
    distance = Infinity
  track.samples.forEach((p, i) => {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2
    if (d < distance) {
      index = i
      distance = d
    }
  })
  const p = track.samples[index]!
  return {
    index,
    progress: index / track.samples.length,
    distance: Math.sqrt(distance),
    lane: (x - p.x) * p.tz - (z - p.z) * p.tx,
    point: p,
  }
}
