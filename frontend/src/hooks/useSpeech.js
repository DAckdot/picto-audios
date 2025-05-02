"use client"

import { useState, useEffect, useCallback } from "react"
import { SPEECH_CONFIG } from "../config"

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  // Check if the browser supports speech synthesis
  const synth = window.speechSynthesis
  const isSupported = !!synth

  // Select a default voice
  const selectDefaultVoice = useCallback((availableVoices) => {
    // Try to find a voice in the preferred language from config
    const preferredVoice =
      availableVoices.find((voice) => voice.lang === SPEECH_CONFIG.PREFERRED_LANGUAGE) ||
      availableVoices.find((voice) => voice.lang.startsWith(SPEECH_CONFIG.PREFERRED_LANGUAGE.split('-')[0]))

    // If no preferred voice, try with an English voice
    const fallbackVoice =
      availableVoices.find((voice) => voice.lang === "en-US") ||
      availableVoices.find((voice) => voice.lang.startsWith("en"))

    // Use any available voice if no preferred or English
    const voice = preferredVoice || fallbackVoice || availableVoices[0] || null

    setSelectedVoice(voice)

    if (!voice) {
      console.warn("No voice selected. Ensure your browser supports speech synthesis.")
    } else {
      console.log("Selected voice:", voice.name, voice.lang)
    }
  }, [])

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
  }, [synth, selectDefaultVoice])

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
        utterance.rate = SPEECH_CONFIG.DEFAULT_RATE 
        utterance.volume = SPEECH_CONFIG.DEFAULT_VOLUME
        utterance.pitch = SPEECH_CONFIG.DEFAULT_PITCH
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

  // Ensure loadVoices is stable and doesn't cause unnecessary re-renders
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
