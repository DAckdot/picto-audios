import { reactive } from "vue";

export function useQueueHandler(initialQueue = []) {
  // Hacer que la cola sea reactiva
  const queue = reactive([...initialQueue]);

  // Limpiar toda la cola
  const clearQueue = () => {
    queue.splice(0, queue.length); // Vaciar la cola de manera reactiva
  };

  // Agregar un pictograma a la cola
  const addToQueue = (pictogram) => {
    if (pictogram && !queue.includes(pictogram)) {
      queue.push(pictogram); // Agregar el pictograma de manera reactiva
    }
  };

  // Eliminar un elemento en un índice específico
  const removeFromQueue = (index) => {
    if (index >= 0 && index < queue.length) {
      queue.splice(index, 1); // Eliminar el elemento de manera reactiva
    }
  };

  // Eliminar el último elemento de la cola
  const removeLastPictogram = () => {
    if (queue.length > 0) {
      queue.pop(); // Eliminar el último elemento de manera reactiva
    }
  };

  // Mover un pictograma de una posición a otra
  const movePictogram = (fromIndex, toIndex) => {
    if (
      fromIndex >= 0 &&
      fromIndex < queue.length &&
      toIndex >= 0 &&
      toIndex < queue.length &&
      fromIndex !== toIndex
    ) {
      const [movedItem] = queue.splice(fromIndex, 1); // Eliminar el elemento de la posición original
      queue.splice(toIndex, 0, movedItem); // Insertar el elemento en la nueva posición
    }
  };

  // Reproducir la cola
  const playQueue = async (speak) => {
    if (typeof speak !== "function") {
      console.error("speak is not a function");
      return;
    }
    try {
      for (const item of queue) {
        // Intentar obtener el texto del pictograma de diferentes propiedades posibles
        const textToSpeak = item.FRASE || item.label || item.texto || '';
        
        if (!textToSpeak) {
          console.warn("Pictograma sin texto:", item);
          continue; // Saltar este pictograma si no tiene texto
        }
        
        await speak(textToSpeak);
      }
    } catch (error) {
      if (error === "interrupted") {
        console.warn("Speech synthesis was interrupted.");
      } else {
        console.error("Error during speech synthesis:", error);
      }
    }
  };

  // Detener la reproducción
  const stopQueue = (stop) => {
    if (typeof stop !== "function") {
      console.error("stop is not a function");
      return;
    }
    stop();
  };

  return {
    queue, // Retornar la cola reactiva
    addToQueue,
    clearQueue,
    removeFromQueue,
    removeLastPictogram,
    movePictogram,
    playQueue,
    stopQueue,
  };
}