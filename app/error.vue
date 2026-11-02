<script setup lang="ts">
import type { NuxtError } from '#app'
import LostFolder from '~/components/error/LostFolder.vue'
import AdventureLauncher from '~/components/site/AdventureLauncher.vue'

const props = defineProps<{ error: NuxtError }>()
const status = computed(() => props.error.status || props.error.statusCode || 500)
const notFound = computed(() => status.value === 404)

useHead(() => ({
  title: notFound.value ? 'A little lost · Julian Gojani' : 'A little hiccup · Julian Gojani',
  htmlAttrs: { 'data-theme': 'light', lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
}))

function goHome() {
  return clearError({ redirect: '/' })
}
</script>

<template>
  <main class="lost-page">
    <div class="lost-paper">
      <header class="lost-header">
        <a href="/" @click.prevent="goHome">Julian Gojani<span aria-hidden="true">↗</span></a>
        <span class="archive-label">the lost &amp; found department</span>
      </header>

      <section class="lost-content" aria-labelledby="lost-title">
        <p class="case-number">
          {{ notFound ? 'CASE NO. 004 / MISSING PAGE' : `A SMALL INTERRUPTION / ${status}` }}
        </p>
        <div class="lost-illustration" :aria-label="`Error ${status}`" role="group">
          <template v-if="notFound">
            <span class="lost-digit" aria-hidden="true">4</span>
            <LostFolder />
            <span class="lost-digit last-four" aria-hidden="true">4</span>
          </template>
          <LostFolder v-else />
        </div>

        <h1 id="lost-title">{{ notFound ? 'A little lost.' : 'A little hiccup.' }}</h1>
        <p class="lost-description">
          {{
            notFound
              ? 'This page wandered off. We’re looking into it.'
              : 'Something got tangled up. Let’s find our way back.'
          }}
        </p>
        <a class="home-link" href="/" @click.prevent="goHome"
          ><span aria-hidden="true">↳</span> Let’s go home
          <span class="home-arrow" aria-hidden="true">↗</span></a
        >
      </section>

      <footer class="lost-footer">
        <span>Nothing’s broken. Just a small detour.</span
        ><span class="found-stamp">YOU ARE HERE <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
    <AdventureLauncher />
  </main>
</template>

<style>
@import '@fontsource/google-sans';
@import '@fontsource/google-sans-code';
</style>

<style scoped>
.lost-page {
  min-height: 100dvh;
  padding: 24px;
  background: #f3f4f6;
  color: #292824;
  font-family: 'Google Sans', sans-serif;
}
.lost-paper {
  min-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: #fff;
  overflow: hidden;
}
.lost-header,
.lost-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px 36px;
}
.lost-header a {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
  font-size: 16px;
  min-height: 44px;
}
.lost-header a span {
  color: #aaa79f;
  font-size: 13px;
}
.archive-label,
.case-number,
.found-stamp {
  font-family: 'Google Sans Code', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: #99958a;
}
.archive-label {
  font-size: 11px;
  letter-spacing: -0.03em;
}
.lost-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 45px 24px 64px;
}
.case-number {
  margin: 0 0 54px;
}
.lost-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 26px;
}
.lost-digit {
  font-size: clamp(130px, 18vw, 210px);
  font-weight: 400;
  letter-spacing: -0.09em;
  line-height: 1;
  color: #e9e8e3;
  transform: rotate(-9deg);
  user-select: none;
}
.last-four {
  transform: rotate(8deg);
}
h1 {
  font-size: clamp(34px, 5vw, 52px);
  letter-spacing: -0.055em;
  font-weight: 400;
  line-height: 1.1;
  margin: 0 0 16px;
}
.lost-description {
  font-size: 15px;
  line-height: 1.7;
  color: #8a877f;
  margin: 0;
  max-width: 300px;
}
.home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 30px;
  padding: 13px 20px;
  min-height: 48px;
  border: 1px solid #e5e2d9;
  border-radius: 12px;
  font-size: 14px;
  color: #444138;
  text-decoration: none;
  background: #faf9f5;
  transition:
    background 180ms,
    transform 180ms;
}
.home-link:hover {
  background: #f2e3b5;
  transform: translateY(-2px);
}
.home-arrow {
  padding-left: 8px;
  color: #928978;
}
a:focus-visible {
  outline: 2px solid #82724c;
  outline-offset: 5px;
}
.lost-footer {
  color: #aaa69c;
  font-size: 11px;
}
.found-stamp {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}
.found-stamp span {
  font-size: 21px;
  color: #b0a074;
}
@media (max-width: 767px) {
  .lost-page {
    padding: 12px;
  }
  .lost-paper {
    min-height: calc(100dvh - 24px);
    border-radius: 22px;
  }
  .lost-header,
  .lost-footer {
    padding: 16px 22px;
  }
  .archive-label {
    display: none;
  }
  .lost-content {
    padding: 42px 16px;
  }
  .case-number {
    font-size: 9px;
    margin-bottom: 50px;
  }
  .lost-illustration {
    gap: 2px;
    width: 100%;
    margin-bottom: 28px;
  }
  .lost-digit {
    font-size: clamp(80px, 20vw, 140px);
  }
  .lost-footer {
    justify-content: center;
    text-align: center;
    padding-bottom: 22px;
  }
  .found-stamp {
    display: none;
  }
  .lost-description {
    font-size: 14px;
    max-width: 250px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-link {
    transition: none;
  }
  .home-link:hover {
    transform: none;
  }
}
</style>
