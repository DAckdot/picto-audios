import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import meSpeak from "mespeak"

// Detecta el idioma del navegador
const userLanguage = navigator.language || navigator.userLanguage;
const voiceFile = userLanguage.startsWith('es') ? '/es.json' : '/en-us.json';

// Carga la configuración y la voz según el idioma detectado
fetch('/mespeak_config.json')
  .then(response => response.json())
  .then(data => meSpeak.loadConfig(data))
  .catch(error => console.error("Failed to load meSpeak config:", error))

fetch(voiceFile) // Carga el archivo de voz basado en el idioma
  .then(response => response.json())
  .then(data => meSpeak.loadVoice(data))
  .catch(error => console.error(`Failed to load meSpeak voice for ${userLanguage}:`, error))

createApp(App).mount('#app')
