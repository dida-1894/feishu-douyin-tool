<script setup>
import { onMounted } from 'vue'
import Home from './components/Home.vue'

onMounted(() => {
  const script = document.createElement('script')
  script.src = "//js.users.51.la/21848355.js"
  script.type = "text/javascript"
  document.body.appendChild(script)
})
</script>

<template>
  <main>
    <Home />
  </main>
</template>

<style scoped>
  main {
    padding: 1rem;
  }
  h4 {
    font-size: calc(1.275rem + 0.3vw);
    margin-bottom: 1rem;
  }
  code {
    font-size: 0.875em;
    color: #d63384;
    word-wrap: break-word;
  }
</style>
