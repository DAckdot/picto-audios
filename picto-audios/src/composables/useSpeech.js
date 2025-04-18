import { ref } from "vue";

export function useSpeech() {
  const isSpeaking = ref(false);
  const voices = ref([]);
  const selectedVoice = ref(null);

  // Check if the browser supports speech synthesis
  const synth = window.speechSynthesis;
  const isSupported = !!synth;

  // Load available voices
  const loadVoices = () => {
    const voicesList = synth.getVoices();
    if (voicesList.length === 0) {
      // Wait for voices to load asynchronously
      synth.onvoiceschanged = () => {
        voices.value = synth.getVoices();
        selectDefaultVoice();
      };
    } else {
      voices.value = voicesList;
      selectDefaultVoice();
    }
  };

  // Select a default voice
  const selectDefaultVoice = () => {
    const spanishVoice =
      voices.value.find((voice) => voice.lang === "es-419") ||
      voices.value.find((voice) => voice.lang.startsWith("es"));

    selectedVoice.value = spanishVoice || voices.value[0] || null;

    if (!selectedVoice.value) {
      console.warn("No voice selected. Ensure your browser supports speech synthesis.");
    }
  };

  // Function to speak text
  const speak = (text) => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        console.warn("Speech synthesis is not supported in this browser");
        resolve();
        return;
      }

      if (!text || typeof text !== "string" || text.trim() === "") {
        console.warn("Invalid text provided for speech synthesis");
        resolve();
        return;
      }

      if (!selectedVoice.value || !(selectedVoice.value instanceof SpeechSynthesisVoice)) {
        console.warn("No valid voice selected");
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice.value; // Ensure this is a valid SpeechSynthesisVoice
      utterance.voice = selectedVoice.value; // Ensure this is a valid SpeechSynthesisVoice
      utterance.rate = 1.355; // Aumenta la velocidad (1.0 es normal, 2.0 es el doble)
      utterance.volume = 55.54; // Aumenta el volumen (1.0 es el máximo)
      utterance.pitch = 2.3; // Ajusta el tono (opcional)
      isSpeaking.value = true;

      // Handle speech end
      utterance.onend = () => {
        isSpeaking.value = false;
        resolve();
      };

      // Handle errors
      utterance.onerror = (event) => {
        console.warn("Speech synthesis error:", event.error);
        isSpeaking.value = false;
        reject(event.error);
      };

      // Speak the text
      try {
        synth.speak(utterance);
      } catch (error) {
        console.error("Error while speaking:", error);
        isSpeaking.value = false;
        reject(error);
      }
    });
  };

  // Stop speaking
  const stop = () => {
    if (isSpeaking.value) {
      synth.cancel();
      isSpeaking.value = false;
    }
  };

  // Load voices on initialization
  if (isSupported) {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
  };
}
