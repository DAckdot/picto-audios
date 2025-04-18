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
        console.warn("Speech synthesis is not supported in this browser")
        resolve()
        return
      }

      if (!text || typeof text !== "string" || text.trim() === "") {
        console.warn("Invalid text provided for speech synthesis")
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
        console.warn("Speech synthesis error:", event.error)
        isSpeaking.value = false
        resolve() // Resolve to avoid unhandled promise rejection
      }

      // Speak the text
      try {
        synth.speak(utterance)
      } catch (error) {
        console.error("Error while speaking:", error)
        isSpeaking.value = false
        resolve()
      }
    })
  }

  return {
    speak,
    isSpeaking,
    isSupported,
  }
}
