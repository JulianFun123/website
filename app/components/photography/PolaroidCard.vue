<script setup lang="ts">
import { motion } from 'motion-v'
import type { Polaroid } from '~/data/photography'
import type { PolaroidMagnet } from '~/composables/useMagneticPolaroids'
import PeekingFriends from '~/components/photography/PeekingFriends.vue'

defineProps<{
  polaroid: Polaroid
  magnet: PolaroidMagnet
  index: number
  count: number
  draggable: boolean
  active: boolean
  reduceMotion: boolean | null
}>()
const emit = defineEmits<{ activate: []; dragStart: []; dragEnd: [] }>()
</script>

<template>
  <div
    class="polaroid-card absolute w-[32%] -translate-x-1/2 -translate-y-1/2"
    :style="{
      left: `var(--mobile-polaroid-x, ${polaroid.x}%)`,
      top: `var(--mobile-polaroid-y, ${polaroid.y}%)`,
      zIndex: active ? 50 : index,
    }"
  >
    <!-- Magnetische Bewegung -->
    <motion.div
      :style="{
        x: magnet.x,
        y: magnet.y,
      }"
    >
      <!-- Einblendanimation -->
      <motion.div
        :initial="{
          opacity: 0,
          y: reduceMotion ? 0 : 40,
          scale: reduceMotion ? 1 : 0.85,
        }"
        :exit="{
          opacity: 0,
          y: reduceMotion ? 0 : -50,
          scale: reduceMotion ? 1 : 0.85,
          transition: {
            duration: reduceMotion ? 0 : 0.25,
            delay: reduceMotion ? 0 : (count - index - 1) * 0.04,
            ease: 'easeIn',
          },
        }"
        :animate="{
          opacity: 1,
          y: 0,
          scale: 1,
        }"
        :transition="{
          duration: reduceMotion ? 0 : 0.5,
          delay: reduceMotion ? 0 : index * 0.1,
          ease: 'backOut',
        }"
      >
        <!-- Dragging -->
        <motion.div
          :drag="draggable"
          drag-snap-to-origin
          :drag-momentum="false"
          :drag-transition="{
            bounceStiffness: 350,
            bounceDamping: 20,
          }"
          :while-drag="{
            scale: 1.08,
          }"
          :while-hover="{
            scale: 1.03,
          }"
          :style="{
            rotate: `${polaroid.rotate}deg`,
            touchAction: draggable ? 'none' : 'pan-y',
          }"
          class="relative cursor-grab touch-none active:cursor-grabbing"
          @pointerdown="emit('activate')"
          @drag-start="emit('dragStart')"
          @drag-end="emit('dragEnd')"
        >
          <PeekingFriends v-if="index === 3" :enabled="draggable && !reduceMotion" />
          <div class="relative z-10 bg-white p-[6%] pb-[24%] shadow-lg">
            <NuxtImg
              :src="polaroid.src"
              width="240"
              height="300"
              densities="1x 2x"
              format="webp"
              quality="80"
              alt=""
              draggable="false"
              class="pointer-events-none block aspect-[4/5] w-full select-none object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  </div>
</template>
