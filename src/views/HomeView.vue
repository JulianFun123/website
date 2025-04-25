<script setup lang="ts">
import { ref } from 'vue'

const portfolio = [
  {
    name: 'pastefy',
    screenshot: '/screenshots/pastefy.png',
    link: 'https://pastefy.app',
  },
  {
    name: 'punyshort',
    screenshot: '/screenshots/punyshort.png',
    link: 'https://puny.be',
  },
  {
    name: 'quotysco',
    screenshot: '/screenshots/quotysco.png',
    link: 'https://quotysco.eu',
  },
  {
    name: 'interaapps',
    screenshot: '/screenshots/interaapps.png',
    link: 'https://interaapps.de',
  },
  {
    name: 'codebox',
    screenshot: '/screenshots/codebox.png',
    link: 'https://box.pastefy.app',
  },
  {
    name: 'guitar-helper',
    screenshot: '/screenshots/guitar-helper.png',
    link: 'https://guitar-helper.ia-app.de',
  },
  {
    name: 'flag-icons',
    screenshot: '/screenshots/flag-icons.svg',
    link: 'https://github.com/interaapps/flag-icons',
    tags: ['design'],
  },
  {
    name: 'puls',
    link: 'https://github.com/interaapps/puls',
    tags: ['js'],
  },
  {
    name: 'petrel',
    link: 'https://github.com/interaapps/petrel',
    tags: ['js'],
  },
  {
    name: 'jsonplus',
    link: 'https://github.com/interaapps/jsonplus',
    tags: ['php'],
  },
]

const currentImage = ref<string | undefined>(undefined)
</script>

<template>
  <main class="relative h-full">
    <div class="flex gap-6 flex-wrap p-10">
      <a
        v-for="entry of portfolio"
        target="_blank"
        :href="entry.link"
        class="text-3xl transition-all opacity-60 hover:opacity-100"
        @mouseenter="currentImage = entry.screenshot"
        @mouseleave="currentImage = undefined"
      >
        {{ entry.name }}
      </a>
    </div>

    <div
      v-if="currentImage"
      class="hidden md:block transition-all absolute bottom-0 right-0 border-t border-l border-black/20 dark:border-white/30 pt-2 pl-2 rounded-tl-xl bg-white/10"
    >
      <img
        class="w-[50rem] h-[20rem] object-cover object-left-top opacity-60 dark:opacity-40 rounded-tl-md border-t border-l border-rounded border-white/30"
        :src="currentImage"
        alt="preview"
      />
    </div>
  </main>
</template>
