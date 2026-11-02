<script setup lang="ts">
import PhotoFriendSprite from '../PhotoFriendSprite.vue'
import AdventurePal from './AdventurePal.vue'
import type { StoryFrame } from '~/data/photoAdventure'
defineProps<{ frame: StoryFrame; index: number; total: number }>()
defineEmits<{ next: [] }>()
</script>

<template>
  <section class="story-frame" aria-label="Story scene">
    <div
      :key="`${frame.scene}-${index}`"
      class="storybook"
      :class="`scene-${frame.scene}`"
      aria-hidden="true"
    >
      <span class="story-sun" /><span class="story-cloud cloud-one" /><span
        class="story-cloud cloud-two"
      />
      <span class="story-hill hill-back" /><span class="story-hill" />
      <span class="story-tree tree-one" /><span class="story-tree tree-two" />
      <div class="story-pip"><PhotoFriendSprite /></div>
      <div class="story-pal">
        <AdventurePal
          :kind="
            frame.scene === 'rain'
              ? 'rain'
              : frame.scene === 'night'
                ? 'night'
                : frame.scene === 'home'
                  ? 'dawn'
                  : 'meadow'
          "
        />
      </div>
      <div class="story-letter"><span>to Pip,</span><i>♡</i></div>
      <div v-if="frame.scene === 'wind'" class="flying-photo photo-one">✧</div>
      <div v-if="frame.scene === 'wind'" class="flying-photo photo-two">☾</div>
      <svg class="wind-lines" viewBox="0 0 500 250">
        <path
          d="M-20 120Q130 40 270 110T530 70M-30 170Q130 90 240 150T520 130"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-dasharray="8 9"
        />
      </svg>
      <span
        v-for="star in 5"
        :key="star"
        class="story-star"
        :style="{
          left: `${star * 16}%`,
          top: `${15 + (star % 3) * 13}%`,
          animationDelay: `${star * 0.2}s`,
        }"
        >✧</span
      >
      <span v-if="frame.scene === 'rain'" class="rain-lines" />
    </div>
    <p class="story-speaker">{{ frame.speaker }}</p>
    <p class="story-text">{{ frame.text }}</p>
    <footer>
      <span class="story-dots" :aria-label="`Scene ${index + 1} of ${total}`"
        ><i v-for="dot in total" :key="dot" :class="{ active: dot === index + 1 }" /></span
      ><button class="story-next" @click="$emit('next')">
        {{ index + 1 === total ? 'Turn the page' : 'A little further' }}
        <span aria-hidden="true">↗</span>
      </button>
    </footer>
    <small>Enter or Space to turn the page</small>
  </section>
</template>

<style scoped>
.story-frame {
  max-width: 670px;
  margin: 0 auto;
}
.storybook {
  position: relative;
  width: 100%;
  aspect-ratio: 2/1;
  background: #e7ebe1;
  overflow: hidden;
  border: 9px solid #fff;
  box-shadow: 0 3px 15px #71665012;
  transform: rotate(-1deg);
}
.story-sun {
  position: absolute;
  width: 13%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #e9d69b;
  right: 18%;
  top: 17%;
}
.story-hill {
  position: absolute;
  width: 140%;
  height: 65%;
  border-radius: 50%;
  background: #bdcaaa;
  bottom: -40%;
  left: -40%;
  transform: rotate(10deg);
}
.hill-back {
  bottom: -28%;
  left: -4%;
  background: #d1dac1;
  transform: rotate(-10deg);
}
.story-cloud {
  position: absolute;
  width: 20%;
  height: 13%;
  border-radius: 50%;
  top: 28%;
  left: 9%;
  background: #fff9;
}
.cloud-two {
  top: 17%;
  left: 55%;
  width: 16%;
  opacity: 0.6;
}
.story-pip,
.story-pal {
  position: absolute;
  height: 42%;
  width: 20%;
  left: 28%;
  bottom: 8%;
  animation: story-arrival 900ms ease both;
}
.story-pip svg,
.story-pal svg {
  width: 100%;
  height: 100%;
}
.story-pal {
  left: 65%;
  height: 35%;
  bottom: 14%;
  animation-delay: 300ms;
}
.story-letter {
  position: absolute;
  left: 48%;
  top: 35%;
  transform: rotate(10deg);
  width: 18%;
  height: 29%;
  background: #fffdf1;
  box-shadow: 0 3px 8px #4c493018;
  padding: 9px;
  font:
    clamp(6px, 1.4vw, 10px) 'Google Sans Code',
    monospace;
  color: #a2997e;
}
.story-letter i {
  display: block;
  text-align: center;
  font-size: 24px;
  line-height: 1.5;
  color: #bba07b;
}
.story-tree {
  position: absolute;
  width: 17%;
  height: 55%;
  left: 0;
  bottom: 5%;
  background: #a9bd9b;
  border-radius: 50% 50% 35% 50%;
  transform: rotate(-10deg);
}
.tree-two {
  left: auto;
  right: -5%;
  width: 20%;
  bottom: -12%;
  transform: rotate(25deg);
}
.wind-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: #ffffffe0;
  opacity: 0;
}
.flying-photo {
  position: absolute;
  width: 17%;
  aspect-ratio: 4/5;
  background: #e6e5da;
  border: 6px solid #fff;
  border-bottom-width: 18px;
  display: grid;
  place-items: center;
  color: #b5ac8d;
  font-size: 30px;
  left: 35%;
  top: 10%;
  animation: flying-page 3s ease-in-out infinite alternate;
}
.photo-two {
  left: 65%;
  top: 30%;
  animation-delay: -1s;
}
.scene-wind .wind-lines {
  opacity: 1;
  animation: breeze 4s linear infinite;
}
.scene-wind .story-letter,
.scene-wind .story-pal {
  display: none;
}
.scene-rain {
  background: #d6e0df;
}
.scene-rain .story-sun {
  opacity: 0.25;
}
.scene-rain .story-cloud {
  background: #aebfc1;
  width: 27%;
  height: 18%;
}
.scene-rain .story-letter {
  display: none;
}
.rain-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    110deg,
    transparent 0 37px,
    #718c9a1f 38px 39px,
    transparent 40px 75px
  );
  animation: rain-drift 3s linear infinite;
}
.scene-night {
  background: #30374a;
}
.scene-night .story-sun {
  background: #e7dfbb;
  box-shadow: 0 0 35px #f2e0a022;
}
.scene-night .story-hill {
  background: #414b59;
}
.scene-night .hill-back {
  background: #3c4655;
}
.scene-night .story-tree {
  background: #485268;
}
.scene-night .story-letter {
  display: none;
}
.scene-night .story-cloud {
  opacity: 0.07;
}
.scene-home {
  background: #eee4d6;
}
.scene-home .story-sun {
  background: #e4c7a0;
}
.scene-home .story-letter {
  opacity: 0.8;
}
.story-star {
  display: none;
  position: absolute;
  color: #f0dc9f;
  font-size: 18px;
  animation: star-breathe 3s ease-in-out infinite alternate;
}
.scene-night .story-star {
  display: block;
}
.story-speaker {
  margin: 30px 0 12px;
  color: #73654c;
  font-size: 16px;
  letter-spacing: -0.02em;
}
.story-text {
  max-width: 530px;
  min-height: 76px;
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
  color: #918878;
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
}
.story-dots {
  display: flex;
  gap: 6px;
}
.story-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #e1d8c6;
}
.story-dots i.active {
  background: #aa9062;
}
.story-next {
  min-height: 46px;
  padding: 10px 18px;
  border: 1px solid #ded3b9;
  border-radius: 12px;
  background: #f2e7cc;
  color: #807050;
  font-size: 13px;
}
.story-next span {
  margin-left: 12px;
}
small {
  display: block;
  margin-top: 16px;
  color: #b2a890;
  font:
    9px 'Google Sans Code',
    monospace;
  text-align: right;
}
button:focus-visible {
  outline: 2px solid #ab966b;
  outline-offset: 3px;
}
@keyframes story-arrival {
  from {
    opacity: 0;
    transform: translateY(25px) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}
@keyframes flying-page {
  from {
    transform: translate(-10px, 5px) rotate(-15deg);
  }
  to {
    transform: translate(15px, -15px) rotate(12deg);
  }
}
@keyframes breeze {
  to {
    stroke-dashoffset: -68;
  }
}
@keyframes rain-drift {
  to {
    background-position: -75px 0;
  }
}
@keyframes star-breathe {
  to {
    opacity: 0.3;
    transform: scale(0.75);
  }
}
@media (max-width: 600px) {
  .story-text {
    font-size: 14px;
    min-height: 110px;
  }
  .story-speaker {
    font-size: 14px;
  }
  .storybook {
    border-width: 5px;
  }
  .story-letter {
    padding: 5px;
  }
  .story-letter i {
    font-size: 15px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
