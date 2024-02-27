<script setup>
import { onMounted } from 'vue'
import Home from './components/Home.vue'

onMounted(() => {
  const script = document.createElement('script')
  script.src = "//js.users.51.la/21848355.js"
  script.type = "text/javascript"
  document.body.appendChild(script)


  var _hmt = _hmt || [];
  (function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?ce7af71a5920ffad38682a00b292600c";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
  })();
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
