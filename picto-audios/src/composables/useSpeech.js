import { ref } from "vue"

export function useSpeech() {
  const isSpeaking = ref(false)

  // Check if the browser supports speech synthesis
  const synth = window.speechSynthesis
  const isSupported = !!synth

  // Function to speak text
  const speak = (text) => {
    return new Promise((resolve) => {
      if (!isSupported) {
        console.error("Speech synthesis is not supported in this browser")
        resolve()
        return
      }

      // Cancel any ongoing speech
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set speaking state
      isSpeaking.value = true

      // Handle speech end
      utterance.onend = () => {
        isSpeaking.value = false
        resolve()
      }

      // Handle errors
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        isSpeaking.value = false
        resolve()
      }

      // Speak the text
      synth.speak(utterance)
    })
  }

  return {
    speak,
    isSpeaking,
    isSupported,
  }
}
