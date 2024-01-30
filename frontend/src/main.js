import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import {i18n} from './locales/i18n.js'
createApp(App).use(i18n).mount('#app') // 注入国际化函数$t
