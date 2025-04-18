import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

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

createApp(App).mount('#app')
