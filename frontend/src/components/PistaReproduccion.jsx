"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import PlaybackControls from "./PlaybackControls"
import { useQueueHandler } from "../hooks/useQueueHandler"
import { useSpeech } from "../hooks/useSpeech"
import fallbackImage from "../assets/default.png"
// Eliminamos las importaciones de Atlaskit que causaban problemas

function PistaReproduccion({ queue = [], onUpdateQueue, onWrappedAddToQueue }) {
  const defaultImage = fallbackImage
  const { speak, stop, isSpeaking } = useSpeech()
  const {
    queue: internalQueue,
    clearQueue,
    removeFromQueue,
    removeLastPictogram,
    movePictogram,
    playQueue,
    stopQueue,
    addToQueue,
    setQueueItems
  } = useQueueHandler([])

  // Estado para drag and drop nativo
  const queueContainerRef = useRef(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  // Cadena dinámica para síntesis de voz basada en la cola actual
  const [speechText, setSpeechText] = useState("")

  // Sincronización de cola externa a cola interna (solo cuando cambie la cola externa)
  useEffect(() => {
    // Prevenir bucles de sincronización bidireccional
    const externalQueueJSON = JSON.stringify(queue);
    const internalQueueJSON = JSON.stringify(internalQueue);
    
    if (externalQueueJSON !== internalQueueJSON) {
      // Solo actualizamos cuando realmente hay cambios externos
      // y evitamos notificar al padre de inmediato
      console.log("Queue prop changed, updating internal queue quietly");
      setQueueItems(queue);
    }
  }, [queue, setQueueItems]); // Solo depende de la cola externa y la función para actualizar

  // Actualizar el texto para síntesis de voz cuando cambia la cola
  useEffect(() => {
    // Construir frase completa basada en los elementos de la cola
    const text = internalQueue.map(item => 
      item.FRASE || item.label || item.texto || item.NOMBRE || ""
    ).filter(text => text).join(" ");
    
    setSpeechText(text);
  }, [internalQueue]);

  // Notificar cambios en cola interna SOLO cuando proceden de acciones internas
  // y no de la sincronización desde la cola externa
  const handleInternalQueueChange = useCallback((action) => {
    return (...args) => {
      // Realizar la acción interna
      const result = action(...args);
      
      // Después de la acción, notificamos al componente padre de manera asíncrona
      // para evitar que se superponga con otras actualizaciones
      setTimeout(() => {
        if (onUpdateQueue && typeof onUpdateQueue === 'function') {
          onUpdateQueue([...internalQueue]);
        }
      }, 0);
      
      return result;
    };
  }, [internalQueue, onUpdateQueue]);

  // Envolver las acciones que modifican la cola
  const wrappedClearQueue = useCallback(
    () => handleInternalQueueChange(clearQueue)(), 
    [handleInternalQueueChange, clearQueue]
  );
  
  const wrappedRemoveFromQueue = useCallback(
    (index) => handleInternalQueueChange(removeFromQueue)(index), 
    [handleInternalQueueChange, removeFromQueue]
  );
  
  const wrappedRemoveLastPictogram = useCallback(
    () => handleInternalQueueChange(removeLastPictogram)(), 
    [handleInternalQueueChange, removeLastPictogram]
  );
  
  const wrappedMovePictogram = useCallback(
    (fromIndex, toIndex) => handleInternalQueueChange(movePictogram)(fromIndex, toIndex), 
    [handleInternalQueueChange, movePictogram]
  );
  
  // Versión envuelta del addToQueue para PictogramGrid
  const wrappedAddToQueue = useCallback(
    (pictogram) => handleInternalQueueChange(addToQueue)(pictogram),
    [handleInternalQueueChange, addToQueue]
  );

  // Exportar la función envuelta para que el componente padre pueda usarla
  useEffect(() => {
    if (onWrappedAddToQueue && typeof onWrappedAddToQueue === 'function') {
      onWrappedAddToQueue(wrappedAddToQueue);
    }
  }, [wrappedAddToQueue, onWrappedAddToQueue]);

  // Manejar eventos de drag and drop nativo
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index) => {
    setDraggedOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && draggedOverIndex !== null && draggedItem !== draggedOverIndex) {
      wrappedMovePictogram(draggedItem, draggedOverIndex);
    }
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  // Manejar reproducción
  const handlePlay = useCallback(() => {
    setIsPlaying(true);

    // Usar la cadena completa en lugar de reproducir cada elemento individualmente
    if (speechText) {
      speak(speechText)
        .finally(() => {
          setIsPlaying(false);
        });
    } else {
      // Si no hay texto para sintetizar, usamos el método anterior como respaldo
      playQueue(speak)
        .finally(() => {
          setIsPlaying(false);
        });
    }
  }, [playQueue, speak, speechText]);

  const handleStop = useCallback(() => {
    stop(); // Llamar directamente a stop para detener la síntesis de voz
    stopQueue(stop); // Mantener la llamada a stopQueue para compatibilidad
    setIsPlaying(false);
  }, [stopQueue, stop]);

  // Function to get the pictogram text
  const getPictogramText = useCallback((item) => {
    return item.FRASE || item.label || item.texto || item.NOMBRE || "No text"
  }, []);

  // Function to get the pictogram image source
  const getImageSource = useCallback((item) => {
    // Si no hay elemento, devolver imagen por defecto
    if (!item) return defaultImage;
    
    // Buscar primero en PHOTO (campo principal)
    if (item.PHOTO) {
      // Si ya es una URL de datos completa, usarla directamente
      if (typeof item.PHOTO === "string" && item.PHOTO.startsWith("data:")) {
        return item.PHOTO;
      }
      // Si es una cadena base64, construir la URL
      if (typeof item.PHOTO === "string" && item.PHOTO.length > 0) {
        return `data:image/jpeg;base64,${item.PHOTO}`;
      }
    }
    
    // Verificar FOTO (para compatibilidad)
    if (item.FOTO && item.FOTO !== null) {
      // Si ya es una URL de datos completa, usarla directamente
      if (typeof item.FOTO === "string" && item.FOTO.startsWith("data:")) {
        return item.FOTO;
      }
      // Si es una cadena base64, construir la URL
      if (typeof item.FOTO === "string" && item.FOTO.length > 0) {
        return `data:image/jpeg;base64,${item.FOTO}`;
      }
    }
    
    // Para pictogramas del sistema o locales
    if (item.image) {
      return item.image;
    }
    
    // Si no hay imagen disponible, usar imagen predeterminada
    return defaultImage;
  }, [defaultImage]);

  return (
    <header className="bg-zinc-700 border-b border-lime-400 p-4 flex flex-col space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-semibold">Tablero de comunicacion</h1>
        <div className="flex space-x-2">
          <button
            onClick={wrappedClearQueue}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center space-x-1 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
            <span>Clear All</span>
          </button>
          <button
            onClick={wrappedRemoveLastPictogram}
            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center space-x-1 text-sm"
          >
            <span>Borrar Ultimo</span>
          </button>
        </div>
      </div>

      {/* Texto de la frase completa */}
      {speechText && (
        <div className="bg-white p-2 rounded-md shadow">
          <p className="text-gray-800 text-sm font-medium">{speechText}</p>
        </div>
      )}

      {/* Pictogram Queue with native drag-and-drop */}
      <div
        ref={queueContainerRef}
        className="flex overflow-x-auto space-x-4 bg-gray-100 p-2 rounded-lg min-h-[100px] drag-container"
      >
        {internalQueue.length === 0 ? (
          <div className="flex items-center justify-center w-full text-gray-400 italic">
            Arrastra pictogramas aquí para formar frases
          </div>
        ) : (
          internalQueue.map((item, index) => (
            <div
              key={item.id || item.COD_PICTOGRAMA || index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              className={`flex-shrink-0 relative group cursor-move draggable-item
                ${draggedOverIndex === index ? 'drop-target' : ''}
              `}
            >
              <div className="w-20 h-20 bg-white rounded-md flex flex-col items-center justify-center border border-gray-300">
                <img
                  src={getImageSource(item) || "/placeholder.svg"}
                  alt={getPictogramText(item)}
                  className="object-contain h-8 w-8"
                />
                <span
                  className="text-xs text-gray-700 mt-1 text-center overflow-hidden"
                  style={{ maxWidth: "100%", maxHeight: "40px" }}
                >
                  {getPictogramText(item)}
                </span>
              </div>
              <button
                onClick={() => wrappedRemoveFromQueue(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label="Remove pictogram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex justify-end space-x-4">
        <PlaybackControls 
          onPlay={handlePlay} 
          onStop={handleStop} 
          isPlaying={isPlaying || isSpeaking}
          disabled={internalQueue.length === 0}
        />
      </div>
    </header>
  )
}

export default PistaReproduccion
