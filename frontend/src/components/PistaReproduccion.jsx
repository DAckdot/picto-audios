"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import PlaybackControls from "./PlaybackControls"
import { useSpeech } from "../hooks/useSpeech"
import fallbackImage from "../assets/default.png"

function PistaReproduccion({ queue = [], onUpdateQueue }) {
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
            onClick={clearQueue}
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
          </button>
          <button
            onClick={removeLastPictogram}
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
        className="flex overflow-x-auto space-x-4 bg-gray-100 p-4 rounded-lg min-h-[120px] drag-container"
        onDragOver={handleDragOver}
      >
        {queue.length === 0 ? (
          <div className="flex items-center justify-center w-full text-gray-400 italic">
            Arrastra pictogramas aquí para formar frases
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
                ${draggedOverIndex === index ? 'border-2 border-dashed border-blue-500 bg-blue-50' : ''}
              `}
            >
              <div className="w-24 h-24 bg-white rounded-md flex flex-col items-center justify-center border border-gray-300 shadow-sm hover:shadow-md">
                <img
                  src={getImageSource(item) || "/placeholder.svg"}
                  alt={getPictogramText(item)}
                  className="object-contain h-10 w-10"
                />
                <span
                  className="text-xs text-gray-700 mt-1 text-center overflow-hidden font-medium"
                  style={{ maxWidth: "100%", maxHeight: "40px" }}
                >
                  {getPictogramText(item)}
                </span>
              </div>
              <button
                onClick={() => removeFromQueue(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 hover:scale-110 transform transition-transform shadow"
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
              <div className="absolute bottom-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded-full">
                  Arrastrar
                </span>
              </div>
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
          disabled={queue.length === 0}
        />
      </div>
    </header>
  )
}

export default PistaReproduccion
