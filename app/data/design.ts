import introduction from '~/content/design/introduction.md?raw'
import juflix from '~/content/design/juflix.md?raw'
import pastefy from '~/content/design/pastefy.md?raw'
import flags from '~/content/design/flags.md?raw'
import typography from '~/content/design/typography.md?raw'
import palette from '~/content/design/palette.md?raw'

export interface DesignElement {
  id: string
  title: string
  kind: 'image' | 'text' | 'palette'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  background?: string
  color?: string
  src?: string
  alt?: string
  text?: string
  fontFamily?: string
  fontSize?: number
  colors?: { name: string; value: string }[]
  /** Markdown + Vue (MDC). Import a .md file with ?raw, or use an inline string. */
  content?: string
}

export const designConfig: { title: string; introduction: string; elements: DesignElement[] } = {
  title: 'Design',
  introduction,
  elements: [
    {
      id: 'flags',
      title: 'Flag Icons / collection',
      kind: 'image',
      x: 850,
      y: 580,
      width: 480,
      height: 260,
      rotation: 0,
      src: '/images/design/flag-icons.svg',
      alt: 'Collection of flat flag icons',
      background: '#01102E',
      content: flags,
    },

    ...['de', 'eu', 'ua', 'gb', 'si'].map(
      (g, i) =>
        ({
          id: g,
          title: g,
          kind: 'image',
          x: 1350,
          y: 580 + i * 40,
          width: 30,
          height: 30,
          rotation: 0,
          src: `/images/design/${g}.png`,
          alt: 'Flag',
          background: '#FFFFFF00',
        }) as DesignElement,
    ),
    {
      id: 'ody',
      title: 'App Designs / ody',
      kind: 'image',
      x: 50,
      y: 380,
      width: 480,
      height: 250,
      rotation: 0,
      src: '/images/design/ody.png',
      alt: 'Collection of flat flag icons',
      background: '#FFFFFF',
      content: flags,
    },
    {
      id: 'planet',
      title: 'Illustrations / foreign planet',
      kind: 'image',
      x: 250,
      y: 980,
      width: 1280 / 3,
      height: 720 / 3,
      rotation: 0,
      src: '/images/design/planet.svg',
      alt: 'Collection of flat flag icons',
      background: '#FFFFFF00',
    },
    {
      id: 'guitar',
      title: 'Guitar',
      kind: 'image',
      x: 850,
      y: 200,
      width: 1200 / 3.3,
      height: 720 / 3.3,
      rotation: 0,
      src: '/images/design/guitar.png',
      alt: 'Collection of flat flag icons',
      background: '#FFFFFF00',
    },
    ...[
      ['/images/design/fuzzpluzz.png', 'Fuzzpluzz'],
      ['/images/design/metal.png', 'Metal'],
      ['/images/design/echo.png', 'Echo'],
      ['/images/design/tremolo.png', 'Tremolo'],
    ].map(
      (g, i) =>
        ({
          id: g[0],
          title: g[1],
          kind: 'image',
          x: 1250 + i * 90,
          y: 200,
          width: 80,
          height: 110,
          rotation: 0,
          src: g[0],
          alt: 'Collection of flat flag icons',
          background: '#FFFFFF00',
        }) as DesignElement,
    ),
    {
      id: 'pedal',
      title: 'Pedal',
      kind: 'image',
      x: 1250,
      y: 340,
      width: 182,
      height: 110,
      rotation: 0,
      src: '/images/design/pedal.png',
      alt: 'Collection of flat flag icons',
      background: '#FFFFFF00',
    },
  ],
}
