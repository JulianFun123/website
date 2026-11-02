<script setup lang="ts">
import PhotoFriendSprite from '../PhotoFriendSprite.vue'
defineProps<{ kind: 'meadow' | 'rain' | 'night' | 'dawn' }>()
</script>

<template>
  <svg v-if="kind === 'rain'" viewBox="0 0 80 96" fill="none" aria-hidden="true">
    <path
      d="M18 62C2 61 4 42 16 39C10 22 30 15 38 27C47 11 68 22 63 38C80 38 83 61 65 63Z"
      fill="#d5e3e0"
      stroke="#8da6a0"
      stroke-width="1.6"
    />
    <path
      d="M26 43Q29 47 32 43M48 43Q51 47 54 43M36 53Q40 55 44 53"
      stroke="#7d918d"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path d="M29 67Q22 80 29 80Q36 80 29 67ZM53 72Q46 85 53 85Q60 85 53 72Z" fill="#afc9cb" />
    <ellipse cx="20" cy="51" rx="5" ry="2" fill="#b9cfc8" />
    <ellipse cx="60" cy="51" rx="5" ry="2" fill="#b9cfc8" />
  </svg>
  <svg v-else-if="kind === 'night'" viewBox="0 0 80 96" fill="none" aria-hidden="true">
    <ellipse cx="23" cy="43" rx="20" ry="17" fill="#b2a9c4" transform="rotate(-30 23 43)" />
    <ellipse cx="57" cy="43" rx="20" ry="17" fill="#c3b6ce" transform="rotate(30 57 43)" />
    <ellipse cx="24" cy="62" rx="13" ry="12" fill="#9e9eb5" />
    <ellipse cx="56" cy="62" rx="13" ry="12" fill="#b6abc4" />
    <path d="M36 29L27 17M44 29L53 17" stroke="#b9aa85" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="40" cy="49" rx="10" ry="24" fill="#e4d8b5" stroke="#b9ac8c" stroke-width="1.5" />
    <path
      d="M36 39V42M44 39V42M37 50Q40 53 43 50"
      stroke="#887c68"
      stroke-width="2"
      stroke-linecap="round"
    />
    <circle cx="19" cy="43" r="4" fill="#d6cbdf" />
    <circle cx="61" cy="43" r="4" fill="#e0d5e8" />
  </svg>
  <div v-else class="album-pal" :class="kind" aria-hidden="true">
    <PhotoFriendSprite /><span v-if="kind === 'meadow'" class="pal-letter">♡</span
    ><span v-else class="pal-star">✧</span>
  </div>
</template>

<style scoped>
svg,
.album-pal {
  width: 100%;
  height: 100%;
}
.album-pal {
  position: relative;
}
.meadow > svg {
  filter: hue-rotate(35deg) saturate(0.65);
}
.dawn > svg {
  filter: saturate(0.55);
}
.pal-letter {
  position: absolute;
  left: 8%;
  bottom: 19%;
  width: 35%;
  height: 22%;
  border: 1px solid #bfb694;
  color: #b79e7f;
  background: #fff9e7;
  transform: rotate(-12deg);
  display: grid;
  place-items: center;
  font-size: 12px;
}
.pal-star {
  position: absolute;
  right: 8%;
  top: 2%;
  color: #b9a26d;
  font-size: 22px;
}
</style>
