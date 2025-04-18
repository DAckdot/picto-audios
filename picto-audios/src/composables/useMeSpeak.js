import { ref } from "vue"
import meSpeak from "mespeak"

export function useMeSpeak() {
  const isSpeaking = ref(false)
  const speak = (text) => {
    isSpeaking.value = true
    meSpeak.speak(
      text,
      { amplitude: 90, wordgap: 0 },
      () => { isSpeaking.value = false }
    )
  }
  return { speak, isSpeaking }
}
