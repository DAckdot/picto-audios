"use client"

import { useState, useCallback } from "react"

export function useQueueHandler(initialQueue = []) {
  // Estado de la cola de reproducción
  const [queue, setQueue] = useState(() => [...initialQueue]);

  // Ensure clearQueue is not called unnecessarily
  const clearQueue = useCallback(() => {
    console.log("Limpiando cola");
    setQueue([]);
  }, []);

  // Reset queue with new items
  const setQueueItems = useCallback((newItems) => {
    console.log("Estableciendo elementos de la cola:", newItems.length);
    setQueue([...newItems]);
  }, []);

  // Add a pictogram to the queue
  const addToQueue = useCallback((pictogram) => {
    if (!pictogram) return;
    
    console.log("Añadiendo a la cola:", pictogram.FRASE || pictogram.label);
    
    // Check if pictogram already exists by ID or some unique property
    setQueue(prevQueue => {
      // Try to find by ID first
      const existingIndex = prevQueue.findIndex(item => 
        (item.COD_PICTOGRAMA && pictogram.COD_PICTOGRAMA && item.COD_PICTOGRAMA === pictogram.COD_PICTOGRAMA) || 
        (item.id && pictogram.id && item.id === pictogram.id)
      );
      
      if (existingIndex >= 0) {
        console.log("El pictograma ya existe en la cola, no se añadirá de nuevo");
        return prevQueue; // Already exists, don't add
      }
      
      console.log("Añadiendo nuevo pictograma a la cola, nueva longitud:", prevQueue.length + 1);
      const newQueue = [...prevQueue, pictogram];
      return newQueue;
    });
  }, []);

  // Remove an element at a specific index
  const removeFromQueue = useCallback((index) => {
    if (index >= 0 && index < queue.length) {
      console.log("Eliminando pictograma en índice:", index);
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
      console.log("Eliminando último pictograma de la cola");
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
      console.error("La función speak no es una función")
      return
    }
    
    try {
      console.log("Iniciando reproducción de cola con", queue.length, "elementos");
      
      for (const item of queue) {
        // Try to get the text of the pictogram from different possible properties
        const textToSpeak = item.FRASE || item.label || item.texto || item.NOMBRE || "";

        if (!textToSpeak) {
          console.warn("Pictograma sin texto:", item)
          continue // Skip this pictogram if it has no text
        }

        console.log("Hablando:", textToSpeak);
        await speak(textToSpeak)
      }
      console.log("Reproducción de cola completada");
    } catch (error) {
      if (error === "interrupted") {
        console.warn("La síntesis de voz fue interrumpida.")
      } else {
        console.error("Error durante la síntesis de voz:", error)
      }
    }
  }, [queue]);

  // Stop playback
  const stopQueue = useCallback((stop) => {
    if (typeof stop !== "function") {
      console.error("La función stop no es una función")
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
