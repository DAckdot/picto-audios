"use client"

import { useState } from "react"

export function useQueueHandler(initialQueue = []) {
  // Make the queue reactive
  const [queue, setQueue] = useState([...initialQueue])

  // Clear the entire queue
  const clearQueue = () => {
    setQueue([])
  }

  // Add a pictogram to the queue
  const addToQueue = (pictogram) => {
    if (pictogram && !queue.includes(pictogram)) {
      setQueue((prevQueue) => [...prevQueue, pictogram])
    }
  }

  // Remove an element at a specific index
  const removeFromQueue = (index) => {
    if (index >= 0 && index < queue.length) {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue]
        newQueue.splice(index, 1)
        return newQueue
      })
    }
  }

  // Remove the last element from the queue
  const removeLastPictogram = () => {
    if (queue.length > 0) {
      setQueue((prevQueue) => prevQueue.slice(0, -1))
    }
  }

  // Move a pictogram from one position to another
  const movePictogram = (fromIndex, toIndex) => {
    if (fromIndex >= 0 && fromIndex < queue.length && toIndex >= 0 && toIndex < queue.length && fromIndex !== toIndex) {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue]
        const [movedItem] = newQueue.splice(fromIndex, 1)
        newQueue.splice(toIndex, 0, movedItem)
        return newQueue
      })
    }
  }

  // Play the queue
  const playQueue = async (speak) => {
    if (typeof speak !== "function") {
      console.error("speak is not a function")
      return
    }
    try {
      for (const item of queue) {
        // Try to get the text of the pictogram from different possible properties
        const textToSpeak = item.FRASE || item.label || item.texto || ""

        if (!textToSpeak) {
          console.warn("Pictogram without text:", item)
          continue // Skip this pictogram if it has no text
        }

        await speak(textToSpeak)
      }
    } catch (error) {
      if (error === "interrupted") {
        console.warn("Speech synthesis was interrupted.")
      } else {
        console.error("Error during speech synthesis:", error)
      }
    }
  }

  // Stop playback
  const stopQueue = (stop) => {
    if (typeof stop !== "function") {
      console.error("stop is not a function")
      return
    }
    stop()
  }

  return {
    queue,
    addToQueue,
    clearQueue,
    removeFromQueue,
    removeLastPictogram,
    movePictogram,
    playQueue,
    stopQueue,
  }
}
