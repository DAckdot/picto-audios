import { useMeSpeak } from "./useMeSpeak"
import { useSpeech } from "./useSpeech"

export function useSpeechHandler() {
  // Detecta si meSpeak está disponible
  const isMeSpeakSupported = typeof window.meSpeak !== "undefined"

  // Usa useMeSpeak si está disponible, de lo contrario usa useSpeech
  return isMeSpeakSupported ? useMeSpeak() : useSpeech()
}
