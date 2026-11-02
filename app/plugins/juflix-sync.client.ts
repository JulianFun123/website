import { createJuflixSync } from '~/utils/juflixSync'

export default defineNuxtPlugin(() => ({
  provide: { juflixSync: createJuflixSync() },
}))
