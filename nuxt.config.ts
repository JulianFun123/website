// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    unsplashAccessKey: '',
  },
  nitro: {
    storage: {
      unsplash: { driver: 'memory' },
    },
    devStorage: {
      unsplash: { driver: 'memory' },
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt/module',
    'motion-v/nuxt',
    '@nuxtjs/mdc',
  ],
  mdc: { highlight: false },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
