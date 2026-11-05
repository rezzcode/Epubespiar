import { createApp } from 'vue';
import App from './App.vue';
import './styles/index.css';
import { initializeTheme } from '../../composables/useTheme.js';

initializeTheme().then(() => {
  const app = createApp(App);
  app.mount('#app');
});
