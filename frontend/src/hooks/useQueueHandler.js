"use client"

import { useState, useCallback } from "react"

export function useQueueHandler(initialQueue = []) {
  // Make the queue reactive
  const [queue, setQueue] = useState([...initialQueue])

  // Ensure clearQueue is not called unnecessarily
  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  // Reset queue with new items
  const setQueueItems = useCallback((newItems) => {
    setQueue([...newItems])
  }, [])

  // Add a pictogram to the queue
  const addToQueue = useCallback((pictogram) => {
    if (!pictogram) return;
    
    // Check if pictogram already exists by ID or some unique property
    setQueue(prevQueue => {
      // Try to find by ID first
      const existingIndex = prevQueue.findIndex(item => 
        (item.COD_PICTOGRAMA && pictogram.COD_PICTOGRAMA && item.COD_PICTOGRAMA === pictogram.COD_PICTOGRAMA) || 
        (item.id && pictogram.id && item.id === pictogram.id)
      );
      
      if (existingIndex >= 0) {
        return prevQueue; // Already exists, don't add
      }
      return [...prevQueue, pictogram];
    });
  }, []);

  // Remove an element at a specific index
  const removeFromQueue = useCallback((index) => {
    if (index >= 0 && index < queue.length) {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue]
        newQueue.splice(index, 1)
        return newQueue
      })
    }
  }, [queue.length]);

  // Remove the last element from the queue
  const removeLastPictogram = useCallback(() => {
    if (queue.length > 0) {
      setQueue((prevQueue) => prevQueue.slice(0, -1))
    }
  }, [queue.length]);

  // Move a pictogram from one position to another
  const movePictogram = useCallback((fromIndex, toIndex) => {
    if (fromIndex >= 0 && fromIndex < queue.length && toIndex >= 0 && toIndex < queue.length && fromIndex !== toIndex) {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue]
        const [movedItem] = newQueue.splice(fromIndex, 1)
        newQueue.splice(toIndex, 0, movedItem)
        return newQueue
      })
    }
  }, [queue.length]);

  // Play the queue
  const playQueue = useCallback(async (speak) => {
    if (typeof speak !== "function") {
      console.error("speak is not a function")
      return
    }
    
    try {
      console.log("Starting playback of queue with", queue.length, "items");
      
      for (const item of queue) {
        // Try to get the text of the pictogram from different possible properties
        const textToSpeak = item.FRASE || item.label || item.texto || item.NOMBRE || "";

        if (!textToSpeak) {
          console.warn("Pictogram without text:", item)
          continue // Skip this pictogram if it has no text
        }

        console.log("Speaking:", textToSpeak);
        await speak(textToSpeak)
      }
      console.log("Queue playback completed");
    } catch (error) {
      if (error === "interrupted") {
        console.warn("Speech synthesis was interrupted.")
      } else {
        console.error("Error during speech synthesis:", error)
      }
    }
  }, [queue]);

  // Stop playback
  const stopQueue = useCallback((stop) => {
    if (typeof stop !== "function") {
      console.error("stop is not a function")
      return
    }
    stop()
  }, []);

  return {
    queue,
    setQueueItems,
    addToQueue,
    clearQueue,
    removeFromQueue,
    removeLastPictogram,
    movePictogram,
    playQueue,
    stopQueue,
  }
}
