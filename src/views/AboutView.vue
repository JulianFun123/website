<script lang="ts" setup>
const socials = [
  {
    name: 'GitHub',
    link: 'https://github.com/JulianFun123',
  },
  {
    name: 'X',
    link: 'https://x.com/juliangojani',
  },
]
</script>
<template>
  <main class="p-10">
    <div class="flex gap-5 flex-wrap">
      <a v-for="social of socials" :href="social.link" class="text-3xl">{{ social.name }}</a>
    </div>
  </main>
</template>
