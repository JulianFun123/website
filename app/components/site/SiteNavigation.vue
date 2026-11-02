<script setup lang="ts">
import { navigationLinks } from '~/data/navigation'

const route = useRoute()
const navigation = ref<HTMLElement>()

function revealActiveLink() {
  if (!import.meta.client || !window.matchMedia('(max-width: 767px)').matches) return
  const nav = navigation.value
  const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!nav || !active) return
  const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left
  nav.scrollTo({ left: nav.scrollLeft + offset - (nav.clientWidth - active.offsetWidth) / 2 })
}

onMounted(revealActiveLink)
watch(
  () => route.path,
  () => nextTick(revealActiveLink),
  { flush: 'post' },
)
</script>

<template>
  <nav
    ref="navigation"
    aria-label="Hauptnavigation"
    class="site-navigation p-6 flex flex-wrap gap-3"
  >
    <NuxtLink
      v-for="link of navigationLinks"
      :key="link.url"
      :to="link.url"
      class="site-nav-link text-xl"
      exact-active-class="is-active"
    >
      {{ link.text }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.site-nav-link {
  color: var(--nav-text);
  transition: color 300ms ease;
}

.site-nav-link:hover {
  color: var(--nav-hover);
}
.site-nav-link.is-active {
  color: var(--text);
}

.site-nav-link:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 4px;
}
@media (prefers-reduced-motion: reduce) {
  .site-nav-link {
    transition: none;
  }
}
@media (max-width: 767px) {
  .site-navigation {
    position: relative;
    flex-wrap: nowrap;
    gap: 20px;
    padding: 8px 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    scroll-padding-inline: 16px;
  }
  .site-navigation::-webkit-scrollbar {
    display: none;
  }
  .site-nav-link {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    min-height: 44px;
    white-space: nowrap;
    font-size: 16px;
    line-height: 1.4;
  }
}
</style>
