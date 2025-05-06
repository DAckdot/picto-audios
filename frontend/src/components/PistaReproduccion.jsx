"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import PlaybackControls from "./PlaybackControls"
import { useSpeech } from "../hooks/useSpeech"
import fallbackImage from "../assets/img/default.png"

function PistaReproduccion({ queue = [], onUpdateQueue, onShowSystemPictograms }) {
  const defaultImage = fallbackImage
  const { speak, stop, isSpeaking } = useSpeech()
  
  // Estado para drag and drop nativo
  const queueContainerRef = useRef(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  // Cadena dinámica para síntesis de voz basada en la cola actual
  const [speechText, setSpeechText] = useState("")

  // Actualizar el texto para síntesis de voz cuando cambia la cola
  useEffect(() => {
    // Construir frase completa basada en los elementos de la cola
    const text = queue.map(item => 
      item.FRASE || item.label || item.texto || item.NOMBRE || ""
    ).filter(text => text).join(" ");
    
    setSpeechText(text);
  }, [queue]);

  // Notificar cambios en la cola
  const updateQueue = useCallback((newQueue) => {
    if (onUpdateQueue && typeof onUpdateQueue === 'function') {
      console.log("Notificando cambio en la cola:", newQueue.length, "items");
      onUpdateQueue(newQueue);
    }
  }, [onUpdateQueue]);

  // Operaciones de la cola
  const clearQueue = useCallback(() => {
    console.log("Ejecutando limpieza completa de la cola");
    updateQueue([]);
  }, [updateQueue]);
  
  const removeFromQueue = useCallback((index) => {
    console.log("Ejecutando eliminación de pictograma en índice:", index);
    if (index >= 0 && index < queue.length) {
      const newQueue = [...queue];
      newQueue.splice(index, 1);
      updateQueue(newQueue);
    }
  }, [queue, updateQueue]);
  
  const removeLastPictogram = useCallback(() => {
    console.log("Ejecutando eliminación del último pictograma");
    if (queue.length > 0) {
      const newQueue = [...queue].slice(0, -1);
      updateQueue(newQueue);
    }
  }, [queue, updateQueue]);
  
  const movePictogram = useCallback((fromIndex, toIndex) => {
    console.log(`Moviendo pictograma de índice ${fromIndex} a ${toIndex}`);
    if (fromIndex >= 0 && fromIndex < queue.length && toIndex >= 0 && toIndex < queue.length && fromIndex !== toIndex) {
      const newQueue = [...queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      updateQueue(newQueue);
    }
  }, [queue, updateQueue]);
  
  const addToQueue = useCallback((pictogram) => {
    console.log("Agregando pictograma a la cola:", pictogram);
    if (!pictogram) return;
    
    // Ya no verificamos si el pictograma existe, permitimos duplicados
    const newQueue = [...queue, pictogram];
    updateQueue(newQueue);
  }, [queue, updateQueue]);

  // Manejar eventos de drag and drop nativo
  const handleDragStart = (e, index) => {
    console.log("Drag start en índice:", index);
    e.dataTransfer.setData("text/plain", index);
    setDraggedItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necesario para permitir el drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (index) => {
    console.log("Drag enter en índice:", index);
    if (draggedItem !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    console.log(`Moviendo pictograma de índice ${draggedItem} a ${index}`);
    
    if (draggedItem !== null && draggedItem !== index) {
      movePictogram(draggedItem, index);
    }
    
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
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
      // Si no hay texto para sintetizar, reproducir elemento por elemento
      const playPictograms = async () => {
        try {
          for (const item of queue) {
            const textToSpeak = item.FRASE || item.label || item.texto || item.NOMBRE || "";
            if (textToSpeak) {
              await speak(textToSpeak);
            }
          }
        } finally {
          setIsPlaying(false);
        }
      };
      
      playPictograms();
    }
  }, [queue, speak, speechText]);

  const handleStop = useCallback(() => {
    stop(); // Llamar directamente a stop para detener la síntesis de voz
    setIsPlaying(false);
  }, [stop]);

  // Function to get the pictogram text
  const getPictogramText = useCallback((item) => {
    return item.FRASE || item.label || item.texto || item.NOMBRE || "Sin texto"
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
    <header className="bg-zinc-700 border-b border-lime-400 py-2 px-3 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-white text-base font-semibold">Tablero de comunicacion</h1>
            <button
          onClick={onShowSystemPictograms}
          className="ml-2 p-1.5 bg-lime-500 text-white rounded hover:bg-lime-600 transition-colors flex items-center"
          title="Mostrar pictogramas por defecto"
            >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="ml-1 hidden sm:inline text-xs">Inicio</span>
            </button>
          </div>
          <div className="flex space-x-1">
            <button
          onClick={clearQueue}
          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center"
          title="Limpiar cola"
            >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
            </button>
            <button
          onClick={removeLastPictogram}
          className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center text-xs"
          title="Borrar último pictograma"
            >
          <span>Borrar Ultimo</span>
            </button>
            <PlaybackControls 
          onPlay={handlePlay} 
          onStop={handleStop} 
          isPlaying={isPlaying || isSpeaking}
          disabled={queue.length === 0}
            />
          </div>
        </div>

        {/* Texto de la frase completa - más compacto */}
      {speechText && (
        <div className="bg-white px-2 py-1 rounded shadow-sm">
          <p className="text-gray-800 text-xs font-medium">{speechText}</p>
        </div>
      )}

      {/* Pictogram Queue with native drag-and-drop - altura optimizada */}
      <div
        ref={queueContainerRef}
        className="flex overflow-x-auto space-x-2 bg-gray-100 p-2 rounded min-h-[100px] drag-container"
        onDragOver={handleDragOver}
      >
        {queue.length === 0 ? (
          <div className="flex items-center justify-center w-full text-gray-400 italic text-xs">
            Selecciona pictogramas para formar frases
          </div>
        ) : (
          queue.map((item, index) => (
            <div
              key={`queue-item-${index}`} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={() => handleDragEnter(index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex-shrink-0 relative group cursor-move draggable-item transition-transform transform hover:scale-105
                ${draggedOverIndex === index ? 'border border-dashed border-blue-500 bg-blue-50' : ''}
              `}
            >
              <div className="w-20 h-20 bg-white rounded flex flex-col items-center justify-center border border-gray-300 shadow-sm hover:shadow-md">
                <img
                  src={getImageSource(item) || "/placeholder.svg"}
                  alt={getPictogramText(item)}
                  className="object-contain h-12 w-12"
                />
                <span
                  className="text-xs text-gray-700 mt-1 text-center overflow-hidden font-medium"
                  style={{ maxWidth: "100%", maxHeight: "28px" }}
                >
                  {getPictogramText(item)}
                </span>
              </div>
              <button
                onClick={() => removeFromQueue(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 hover:scale-110 transform transition-transform shadow"
                aria-label="Eliminar pictograma"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
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
    </header>
  )
}

export default PistaReproduccion
