import { getUnsplashPhotos } from '../utils/unsplash'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pageValue = query.page ?? '1'
  if (
    typeof pageValue !== 'string' ||
    !/^[1-9]\d{0,2}$/.test(pageValue) ||
    Number(pageValue) > 100
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Seitennummer.' })
  }
  if (!useRuntimeConfig(event).unsplashAccessKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Die Fotogalerie ist noch nicht verfügbar.',
    })
  }
  return getUnsplashPhotos(Number(pageValue))
})
