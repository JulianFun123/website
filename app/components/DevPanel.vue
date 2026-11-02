<script setup lang="ts">
import { motion, useReducedMotion } from 'motion-v'
import { projects } from '~/data/projects'

const reduceMotion = useReducedMotion()
const { selected } = useProjectSelection()
const number = computed(() =>
  String(projects.findIndex((project) => project.id === selected.value.id) + 1).padStart(2, '0'),
)
const entrance = computed(() => ({ opacity: 0, y: reduceMotion.value ? 0 : 25 }))
const exit = computed(() => ({ opacity: 0, y: reduceMotion.value ? 0 : -25 }))
</script>

<template>
  <div data-left-panel="dev" class="dev-panel">
    <motion.div
      class="panel-top"
      :initial="entrance"
      :animate="{ opacity: 1, y: 0 }"
      :exit="exit"
      :transition="{ duration: reduceMotion ? 0 : 0.3 }"
      ><span>Julian Gojani</span></motion.div
    >
    <motion.div
      class="index-object"
      :initial="entrance"
      :animate="{ opacity: 1, y: 0 }"
      :exit="exit"
      :transition="{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.08 }"
    >
      <div class="paper paper-back" aria-hidden="true"><span>source / archive</span></div>
      <div class="paper paper-middle" aria-hidden="true"><span>selected / work</span></div>
      <div class="paper paper-front">
        <div class="paper-top">
          <span>PROJECT FILE</span
          ><svg class="paper-friend" viewBox="0 0 24 20" fill="none" aria-hidden="true">
            <path
              class="paper-eyes"
              d="M7 6V8M17 6V8"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M8 13Q12 17 16 13"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <Transition name="file-number" mode="out-in"
          ><span :key="number" class="paper-number">{{ number }}</span></Transition
        >
        <div class="paper-label">
          <Transition name="file-number" mode="out-in"
            ><strong :key="selected.id">{{ selected.name }}</strong></Transition
          ><span>{{ selected.repo.replace('https://github.com/', '') }}</span>
        </div>
        <div class="paper-footer">
          <span>{{ selected.category }}</span
          ><span>{{ selected.status }}</span>
        </div>
      </div>
    </motion.div>
    <motion.div
      class="panel-bottom"
      :initial="entrance"
      :animate="{ opacity: 1, y: 0 }"
      :exit="exit"
      :transition="{ duration: reduceMotion ? 0 : 0.3 }"
      ><span>{{ projects.length }} projects</span></motion.div
    >
  </div>
</template>

<style scoped>
.dev-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 30px;
  padding: 30px;
  color: #222;
}
.panel-top {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font:
    10px 'Google Sans Code',
    monospace;
}
.panel-top > span:last-child {
  color: #aaa;
  font-size: 8px;
}
.index-object {
  position: relative;
  width: 90%;
  align-self: center;
  aspect-ratio: 3/4;
  margin: 15px 0;
}
.paper {
  position: absolute;
  inset: 0;
  border: 1px solid #dcdcdc;
  border-radius: 2px;
  background: #fff;
  box-shadow: 1px 6px 9px -7px #0003;
  transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.index-object:hover .paper-back {
  transform: rotate(-15deg) translate(-8px, 0);
}
.index-object:hover .paper-middle {
  transform: rotate(-7deg) translate(-3px, -3px);
}
.index-object:hover .paper-front {
  transform: rotate(1deg) translateY(-4px);
}
.paper-friend {
  width: 22px;
  height: 18px;
  color: #afa58f;
}
.paper-eyes {
  transform-origin: 12px 7px;
  animation: paper-blink 13s infinite;
}
@keyframes paper-blink {
  0%,
  65%,
  68%,
  100% {
    transform: scaleY(1);
  }
  66%,
  67% {
    transform: scaleY(0.1);
  }
}
.paper-back {
  transform: rotate(-11deg) translate(-5px, 3px);
  background: #f4f4f4;
  padding: 15px;
  color: #bbb;
  font:
    8px 'Google Sans Code',
    monospace;
}
.paper-middle {
  transform: rotate(-5deg);
  background: #fafafa;
  padding: 15px;
  color: #ccc;
  font:
    8px 'Google Sans Code',
    monospace;
}
.paper-front {
  transform: rotate(4deg);
  padding: 19px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.paper-top {
  display: flex;
  justify-content: space-between;
  font:
    7px 'Google Sans Code',
    monospace;
  letter-spacing: 0.12em;
  color: #a6a6a6;
}
.paper-top > span:last-child {
  font-size: 13px;
}
.paper-number {
  display: block;
  font-size: clamp(70px, 10vw, 150px);
  font-weight: 300;
  line-height: 0.9;
  letter-spacing: -0.09em;
  margin: 20px 0;
  color: #222;
}
.paper-label strong {
  display: block;
  font-size: clamp(17px, 1.8vw, 28px);
  letter-spacing: -0.06em;
  font-weight: 400;
  line-height: 1.2;
}
.paper-label > span {
  display: block;
  font:
    7px 'Google Sans Code',
    monospace;
  color: #aaa;
  margin-top: 10px;
  overflow-wrap: anywhere;
}
.paper-footer {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  border-top: 1px solid #e9e9e9;
  padding-top: 10px;
  margin-top: 25px;
  font:
    6px 'Google Sans Code',
    monospace;
  color: #aaa;
}
.panel-bottom {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 11px;
  color: #999;
}
.panel-bottom > span:last-child {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b6b6b6;
}
.file-number-enter-active,
.file-number-leave-active {
  transition: opacity 150ms ease;
}
.file-number-enter-from,
.file-number-leave-to {
  opacity: 0;
}
@media (max-width: 767px) {
  .dev-panel {
    padding: 25px;
    flex-direction: row;
    align-items: center;
    gap: 15px;
  }
  .panel-top {
    font-size: 12px;
  }
  .panel-top > span:last-child {
    font-size: 9px;
  }
  .index-object {
    width: 40%;
    max-width: 170px;
    aspect-ratio: 3/4;
    flex-shrink: 0;
    margin: 0 10px;
  }
  .paper-front {
    padding: 13px;
  }
  .paper-number {
    font-size: 70px;
    margin: 13px 0;
  }
  .paper-label strong {
    font-size: 17px;
  }
  .paper-top {
    font-size: 5px;
  }
  .paper-label > span {
    font-size: 5px;
    margin-top: 6px;
  }
  .paper-footer {
    font-size: 5px;
    margin-top: 10px;
  }
  .panel-bottom {
    display: none;
  }
}
@media (min-width: 768px) and (max-height: 750px) {
  .dev-panel {
    padding: 25px;
  }
  .index-object {
    width: 75%;
    max-height: 350px;
  }
  .paper-number {
    font-size: 90px;
    margin: 10px 0;
  }
  .paper-footer {
    margin-top: 15px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .paper {
    transition: none;
  }
  .paper-eyes {
    animation: none;
  }
  .index-object:hover .paper-back {
    transform: rotate(-11deg) translate(-5px, 3px);
  }
  .index-object:hover .paper-middle {
    transform: rotate(-5deg);
  }
  .index-object:hover .paper-front {
    transform: rotate(4deg);
  }
  .file-number-enter-active,
  .file-number-leave-active {
    transition: none;
  }
}
@media (max-width: 767px) {
  .dev-panel {
    padding: 18px 20px;
    gap: 16px;
  }
  .panel-top > span:last-child {
    color: #777;
    font-size: 12px;
    line-height: 1.5;
  }
  .index-object {
    width: 40%;
    max-width: 132px;
    margin: 0 4px;
  }
  .paper-front {
    padding: 12px;
  }
  .paper-number {
    font-size: 64px;
    margin: 8px 0;
  }
  .paper-label strong {
    font-size: 16px;
    overflow-wrap: anywhere;
  }
  .paper-label > span,
  .paper-footer {
    display: none;
  }
  .paper-top {
    font-size: 6px;
  }
}
</style>
