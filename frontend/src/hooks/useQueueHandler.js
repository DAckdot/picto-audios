"use client"

import { useState, useCallback } from "react"

export function useQueueHandler(initialQueue = []) {
  // Estado de la cola de reproducción
  const [queue, setQueue] = useState(() => [...initialQueue]);

  // Ensure clearQueue is not called unnecessarily
  const clearQueue = useCallback(() => {
    console.log("Clearing queue");
    setQueue([]);
  }, []);

  // Reset queue with new items
  const setQueueItems = useCallback((newItems) => {
    console.log("Setting queue items:", newItems.length);
    setQueue([...newItems]);
  }, []);

  // Add a pictogram to the queue
  const addToQueue = useCallback((pictogram) => {
    if (!pictogram) return;
    
    console.log("Adding to queue:", pictogram.FRASE || pictogram.label);
    
    // Check if pictogram already exists by ID or some unique property
    setQueue(prevQueue => {
      // Try to find by ID first
      const existingIndex = prevQueue.findIndex(item => 
        (item.COD_PICTOGRAMA && pictogram.COD_PICTOGRAMA && item.COD_PICTOGRAMA === pictogram.COD_PICTOGRAMA) || 
        (item.id && pictogram.id && item.id === pictogram.id)
      );
      
      if (existingIndex >= 0) {
        console.log("Pictogram already exists in queue, not adding again");
        return prevQueue; // Already exists, don't add
      }
      
      console.log("Adding new pictogram to queue, new length:", prevQueue.length + 1);
      const newQueue = [...prevQueue, pictogram];
      return newQueue;
    });
  }, []);

  // Remove an element at a specific index
  const removeFromQueue = useCallback((index) => {
    if (index >= 0 && index < queue.length) {
      console.log("Removiendo pictograma en índice:", index);
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        newQueue.splice(index, 1);
        console.log("Nueva longitud de cola después de eliminar:", newQueue.length);
        return newQueue;
      });
    } else {
      console.warn("Intento de eliminar pictograma con índice inválido:", index);
    }
  }, [queue.length]);

  // Remove the last element from the queue
  const removeLastPictogram = useCallback(() => {
    if (queue.length > 0) {
      console.log("Removiendo último pictograma de la cola");
      setQueue((prevQueue) => {
        const newQueue = prevQueue.slice(0, -1);
        console.log("Nueva longitud de cola después de eliminar último:", newQueue.length);
        return newQueue;
      });
    } else {
      console.warn("Intento de eliminar último pictograma de cola vacía");
    }
  }, [queue.length]);

  // Move a pictogram from one position to another
  const movePictogram = useCallback((fromIndex, toIndex) => {
    if (fromIndex >= 0 && fromIndex < queue.length && toIndex >= 0 && toIndex < queue.length && fromIndex !== toIndex) {
      console.log(`Moviendo pictograma de índice ${fromIndex} a índice ${toIndex}`);
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        console.log("Reordenamiento completado, nueva cola:", newQueue.length, "items");
        return newQueue;
      });
    } else {
      console.warn("Intento de mover pictograma con índices inválidos:", { fromIndex, toIndex, queueLength: queue.length });
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
