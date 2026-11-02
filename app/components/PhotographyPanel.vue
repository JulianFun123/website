<script setup lang="ts">
import { polaroids } from '~/data/photography'
import PolaroidCard from '~/components/photography/PolaroidCard.vue'
import WanderingPhotoFriend from '~/components/photography/WanderingPhotoFriend.vue'

const { open: gameOpen } = useAdventureAccess()

const {
  container,
  isMobile,
  activeIndex,
  magnets,
  resetMagnets,
  handleDragStart,
  handleDragEnd,
  handlePointerDown,
  reduceMotion,
} = useMagneticPolaroids(polaroids)
</script>

<template>
  <div data-left-panel="photography" class="flex size-full items-center justify-center p-6">
    <div
      ref="container"
      class="polaroid-stage relative aspect-[3/4] w-full max-w-sm"
      @pointerleave="resetMagnets"
    >
      <PolaroidCard
        v-for="(polaroid, index) in polaroids"
        :key="index"
        :polaroid="polaroid"
        :magnet="magnets[index]!"
        :index="index"
        :count="polaroids.length"
        :active="activeIndex === index"
        :reduce-motion="reduceMotion"
        :draggable="!isMobile"
        @activate="handlePointerDown(index)"
        @drag-start="handleDragStart(index)"
        @drag-end="handleDragEnd"
      />
      <WanderingPhotoFriend
        :enabled="!isMobile && !gameOpen"
        :reduce-motion="reduceMotion"
        :photos="polaroids"
        @play="gameOpen = true"
      />
    </div>
  </div>
</template>

<style scoped>
.polaroid-stage {
  isolation: isolate;
}
@media (max-width: 767px) {
  .polaroid-stage {
    height: 100%;
    aspect-ratio: auto;
    max-width: 28rem;
  }
  .polaroid-stage :deep(.polaroid-card) {
    width: 24%;
  }
  .polaroid-stage :deep(.polaroid-card:nth-child(1)) {
    --mobile-polaroid-x: 12%;
    --mobile-polaroid-y: 49%;
  }
  .polaroid-stage :deep(.polaroid-card:nth-child(2)) {
    --mobile-polaroid-x: 31%;
    --mobile-polaroid-y: 43%;
  }
  .polaroid-stage :deep(.polaroid-card:nth-child(3)) {
    --mobile-polaroid-x: 51%;
    --mobile-polaroid-y: 56%;
  }
  .polaroid-stage :deep(.polaroid-card:nth-child(4)) {
    --mobile-polaroid-x: 72%;
    --mobile-polaroid-y: 45%;
  }
  .polaroid-stage :deep(.polaroid-card:nth-child(5)) {
    --mobile-polaroid-x: 90%;
    --mobile-polaroid-y: 53%;
  }
}
</style>
