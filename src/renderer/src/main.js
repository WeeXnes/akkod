import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';

try {
  if (localStorage.getItem('akkod-theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch {}

createApp(App).mount('#app');
