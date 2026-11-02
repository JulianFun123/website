import type { GalleryResponse } from '../../shared/types/photos'

interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string | null
  alt_description: string | null
  description: string | null
  urls: { raw: string }
  links: { html: string }
  user: { name: string; links: { html: string } }
}

function attributionUrl(value: string) {
  const url = new URL(value)
  url.searchParams.set('utm_source', 'julian_portfolio')
  url.searchParams.set('utm_medium', 'referral')
  return url.toString()
}

function imageUrl(raw: string, width: number) {
  const url = new URL(raw)
  url.searchParams.set('w', String(width))
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'max')
  url.searchParams.set('q', '80')
  return url.toString()
}

export const getUnsplashPhotos = defineCachedFunction(
  async (page: number): Promise<GalleryResponse> => {
    const config = useRuntimeConfig()
    try {
      const response = await $fetch.raw<UnsplashPhoto[]>(
        'https://api.unsplash.com/users/juliangojani/photos',
        {
          headers: {
            Authorization: `Client-ID ${config.unsplashAccessKey}`,
            'Accept-Version': 'v1',
          },
          query: { page, per_page: 30, order_by: 'latest' },
          timeout: 10000,
          retry: 0,
        },
      )

      return {
        page,
        hasMore: page < 100 && /rel="next"/.test(response.headers.get('link') ?? ''),
        photos: (response._data ?? []).map((photo) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          color: photo.color,
          alt: photo.alt_description || photo.description || 'Fotografie von Julian Gojani',
          src: imageUrl(photo.urls.raw, 900),
          srcset: [400, 700, 1000, 1400]
            .map((width) => `${imageUrl(photo.urls.raw, width)} ${width}w`)
            .join(', '),
          href: attributionUrl(photo.links.html),
          photographer: photo.user.name,
          photographerUrl: attributionUrl(photo.user.links.html),
        })),
      }
    } catch {
      // Do not forward upstream errors: they may contain authorization headers.
      throw createError({ statusCode: 502, statusMessage: 'Fotos konnten nicht geladen werden.' })
    }
  },
  {
    base: 'unsplash',
    name: 'unsplash-user-photos',
    maxAge: 60 * 60,
    swr: true,
    getKey: (page: number) => String(page),
  },
)
