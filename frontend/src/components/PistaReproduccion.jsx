"use client"

import { useState, useEffect, useCallback } from "react"
import PlaybackControls from "./PlaybackControls"
import { useQueueHandler } from "../hooks/useQueueHandler"
import { useSpeech } from "../hooks/useSpeech"
import fallbackImage from "../assets/hola.png"

function PistaReproduccion({ queue, onUpdateQueue }) {
  const [internalQueue, setInternalQueue] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const defaultImage = "/placeholder.svg";
  
  // Load initial queue from props
  useEffect(() => {
    if (JSON.stringify(queue) !== JSON.stringify(internalQueue)) {
      setInternalQueue(queue);
    }
  }, [queue]);

  // Only update the parent when internal queue changes from user actions
  const notifyParentOfChanges = useCallback(() => {
    onUpdateQueue([...internalQueue]);
  }, [onUpdateQueue, internalQueue]);

  // Use a separate effect for notifying parent of changes
  useEffect(() => {
    notifyParentOfChanges();
  }, [notifyParentOfChanges]);

  // Functions to handle drag and drop
  const handleDragStart = (event, index) => {
    setDraggedItemIndex(index)
    // Set the data being dragged
    event.dataTransfer.effectAllowed = "move"
    // Hide the drag ghost image
    const dragImage = new Image()
    dragImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" // 1x1 transparent image
    event.dataTransfer.setDragImage(dragImage, 0, 0)
  }

  const handleDragEnter = (event, index) => {
    if (index !== draggedItemIndex) {
      setIsDraggingOver(index)
    }
  }

  const handleDrop = () => {
    if (draggedItemIndex !== null && isDraggingOver !== null && draggedItemIndex !== isDraggingOver) {
      // Move the element
      movePictogram(draggedItemIndex, isDraggingOver)
    }

    // Reset variables
    setDraggedItemIndex(null)
    setIsDraggingOver(null)
  }

  // Function to get the pictogram text
  const getPictogramText = (item) => {
    return item.FRASE || item.label || item.texto || item.NOMBRE || "No text"
  }

  // Function to get the pictogram image source
  const getImageSource = (item) => {
    // If it comes from the API, the image is in PHOTO or FOTO
    if (item.PHOTO) {
      if (typeof item.PHOTO === "string" && item.PHOTO.startsWith("data:")) {
        return item.PHOTO
      }
      if (typeof item.PHOTO !== "string" || !item.PHOTO) {
        return defaultImage
      }
      return `data:image/jpeg;base64,${item.PHOTO}`
    }
    if (item.FOTO) {
      if (typeof item.FOTO === "string" && item.FOTO.startsWith("data:")) {
        return item.FOTO
      }
      if (typeof item.FOTO !== "string" || !item.FOTO) {
        return defaultImage
      }
      return `data:image/jpeg;base64,${item.FOTO}`
    }
    // If it comes from local data
    if (item.image) {
      return item.image
    }
    if (item.IMAGEN) {
      return item.IMAGEN
    }
    return defaultImage
  }

  // Queue modification functions
  const clearQueue = () => {
    setInternalQueue([]);
  };

  const removeFromQueue = (index) => {
    setInternalQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
  };

  const removeLastPictogram = () => {
    if (internalQueue.length > 0) {
      setInternalQueue(prev => prev.slice(0, -1));
    }
  };

  const movePictogram = (fromIndex, toIndex) => {
    setInternalQueue(prev => {
      const newQueue = [...prev];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return newQueue;
    });
  };

  // Speech functionality
  const { speak, stop } = useSpeech();
  const { playQueue, stopQueue } = useQueueHandler(internalQueue);

  return (
    <header className="bg-zinc-700 border-b border-lime-400 p-4 flex flex-col space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-semibold">Communication Board</h1>
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
            <span>Clear All</span>
          </button>
          <button
            onClick={removeLastPictogram}
            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center space-x-1 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 7l-7 7-7-7" />
            </svg>
            <span>Delete Last</span>
          </button>
        </div>
      </div>

      {/* Pictogram Queue */}
      <div
        className="flex overflow-x-auto space-x-4 bg-gray-100 p-2 rounded-lg min-h-[100px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {internalQueue.map((item, index) => (
          <div
            key={item.id || item.COD_PICTOGRAMA || index}
            className="flex-shrink-0 relative group cursor-move"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEnter(e, index)}
          >
            <div
              className={`w-20 h-20 bg-white rounded-md flex flex-col items-center justify-center border border-gray-300 ${
                isDraggingOver === index ? "border-blue-500 border-2" : ""
              }`}
            >
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
              onClick={() => removeFromQueue(index)}
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
        ))}
      </div>

      {/* Playback Controls */}
      <div className="flex justify-end space-x-4">
        <PlaybackControls onPlay={() => playQueue(speak)} onStop={() => stopQueue(stop)} />
      </div>
    </header>
  )
}

export default PistaReproduccion
