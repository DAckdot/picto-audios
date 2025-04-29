import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './style.css';
import App from './App.vue';
import TestConnectionView from './views/TestConnectionView.vue';

// Detecta el idioma del navegador y configura la voz predeterminada
const synth = window.speechSynthesis;
synth.onvoiceschanged = () => {
  const voices = synth.getVoices();
  const spanishVoice = voices.find(voice => voice.lang === "es-419") || voices.find(voice => voice.lang.startsWith("es"));
  if (spanishVoice) {
    console.log(`Voz predeterminada configurada: ${spanishVoice.name} (${spanishVoice.lang})`);
  } else {
    console.warn("No se encontró una voz en español. Usando la voz predeterminada del navegador.");
  }
};

// Definir rutas
const routes = [
  { path: '/', component: App },
  { path: '/diagnostico', component: TestConnectionView }
];

// Crear router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Crear app
const app = createApp(App);
app.use(router);
app.mount('#app');
