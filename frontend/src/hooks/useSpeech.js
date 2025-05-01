"use client"

import { useState, useEffect, useCallback } from "react"

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  // Check if the browser supports speech synthesis
  const synth = window.speechSynthesis
  const isSupported = !!synth

  // Load available voices
  const loadVoices = useCallback(() => {
    const voicesList = synth.getVoices()
    if (voicesList.length === 0) {
      // Wait for voices to load asynchronously
      synth.onvoiceschanged = () => {
        setVoices(synth.getVoices())
        selectDefaultVoice(synth.getVoices())
      }
    } else {
      setVoices(voicesList)
      selectDefaultVoice(voicesList)
    }
  }, [synth])

  // Select a default voice
  const selectDefaultVoice = useCallback((availableVoices) => {
    // Try to find a Spanish voice
    const spanishVoice =
      availableVoices.find((voice) => voice.lang === "es-ES") ||
      availableVoices.find((voice) => voice.lang === "es-419") ||
      availableVoices.find((voice) => voice.lang.startsWith("es"))

    // If no Spanish voice, try with an English voice
    const fallbackVoice =
      availableVoices.find((voice) => voice.lang === "en-US") ||
      availableVoices.find((voice) => voice.lang.startsWith("en"))

    // Use any available voice if no Spanish or English
    const voice = spanishVoice || fallbackVoice || availableVoices[0] || null

    setSelectedVoice(voice)

    if (!voice) {
      console.warn("No voice selected. Ensure your browser supports speech synthesis.")
    } else {
      console.log("Selected voice:", voice.name, voice.lang)
    }
  }, [])

  // Function to speak text
  const speak = useCallback(
    (text) => {
      return new Promise((resolve, reject) => {
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

        if (!selectedVoice) {
          console.warn("No valid voice selected")
          resolve()
          return
        }

        // Cancel any ongoing speech
        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = selectedVoice
        utterance.rate = 1.355 // Increase speed (1.0 is normal, 2.0 is double)
        utterance.volume = 0.95 // Increase volume (1.0 is maximum)
        utterance.pitch = 2.3 // Adjust pitch (optional)
        setIsSpeaking(true)

        // Handle speech end
        utterance.onend = () => {
          setIsSpeaking(false)
          resolve()
        }

        // Handle errors
        utterance.onerror = (event) => {
          console.warn("Speech synthesis error:", event.error)
          setIsSpeaking(false)
          reject(event.error)
        }

        // Speak the text
        try {
          synth.speak(utterance)
        } catch (error) {
          console.error("Error while speaking:", error)
          setIsSpeaking(false)
          reject(error)
        }
      })
    },
    [isSupported, selectedVoice, synth],
  )

  // Stop speaking
  const stop = useCallback(() => {
    if (isSpeaking) {
      synth.cancel()
      setIsSpeaking(false)
    }
  }, [isSpeaking, synth])

  // Load voices on initialization
  useEffect(() => {
    if (isSupported) {
      loadVoices()
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices
      }
    }
  }, [isSupported, loadVoices, synth])

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
  }
}
