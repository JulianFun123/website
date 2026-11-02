export type MiniKind = 'catch' | 'pairs' | 'rhythm'
export interface JourneyStop {
  id: string
  kind: 'level' | MiniKind
  level: number
  title: string
  description: string
  icon: string
  x: number
  y: number
}
export const adventureJourney: JourneyStop[] = [
  {
    id: 'meadow',
    kind: 'level',
    level: 0,
    title: 'The Unsent Meadow',
    description: 'Find the first little colours.',
    icon: '❧',
    x: 19,
    y: 15,
  },
  {
    id: 'rain',
    kind: 'level',
    level: 1,
    title: 'Rain on the Contact Sheet',
    description: 'A bridge, two paperweights, one cloudy friend.',
    icon: '♢',
    x: 46,
    y: 10,
  },
  {
    id: 'darkroom',
    kind: 'level',
    level: 2,
    title: 'The Midnight Darkroom',
    description: 'Make a little light for the moths.',
    icon: '☾',
    x: 76,
    y: 15,
  },
  {
    id: 'sunset',
    kind: 'level',
    level: 3,
    title: 'Where the Sunset Sleeps',
    description: 'Four memories, one photograph of home.',
    icon: '☀',
    x: 84,
    y: 36,
  },
  {
    id: 'pocket-rain',
    kind: 'catch',
    level: 3,
    title: 'Pockets Full of Sky',
    description: 'Catch falling sunbeams. Dodge the sleepy rainclouds.',
    icon: '✧',
    x: 56,
    y: 34,
  },
  {
    id: 'post-office',
    kind: 'level',
    level: 4,
    title: 'The Breeze Post Office',
    description: 'Let the wind carry your next little hop.',
    icon: '⌁',
    x: 27,
    y: 37,
  },
  {
    id: 'matching-postcards',
    kind: 'pairs',
    level: 4,
    title: 'The Misplaced Postcards',
    description: 'Find the matching memories in a shuffled album.',
    icon: '▧',
    x: 16,
    y: 59,
  },
  {
    id: 'frost',
    kind: 'level',
    level: 5,
    title: 'The Frosted Negative',
    description: 'Slippery photographs. Very careful mittens.',
    icon: '❅',
    x: 45,
    y: 57,
  },
  {
    id: 'firefly-waltz',
    kind: 'rhythm',
    level: 5,
    title: 'The Firefly Waltz',
    description: 'Time your camera clicks to a firefly dance.',
    icon: '♫',
    x: 77,
    y: 60,
  },
  {
    id: 'library',
    kind: 'level',
    level: 6,
    title: 'The Folded Library',
    description: 'Step through the folds between two pages.',
    icon: '◎',
    x: 72,
    y: 83,
  },
  {
    id: 'tomorrow',
    kind: 'level',
    level: 7,
    title: 'The Tide of Tomorrow',
    description: 'Catch a still moment before the water rises.',
    icon: '≈',
    x: 38,
    y: 84,
  },
]
