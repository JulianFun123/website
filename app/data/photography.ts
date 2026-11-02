export interface Polaroid {
  x: number
  y: number
  src: string
  rotate: number
}

const img = (i: number) => `/images/photos/${i}.png`

export const polaroids: Polaroid[] = [
  { x: 10, y: 10, src: img(1), rotate: -5 },
  { x: 95, y: 0, src: img(2), rotate: 7 },
  { x: 15, y: 110, src: img(3), rotate: -10 },
  { x: 50, y: 56, src: img(4), rotate: 10 },
  { x: 90, y: 100, src: img(5), rotate: 10 },
]
