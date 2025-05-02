"use client"

function PlaybackControls({ onPlay, onStop, isPlaying = false, disabled = false }) {
  const handlePlay = () => {
    if (disabled || isPlaying) return;
    try {
      onPlay()
    } catch (error) {
      console.error("Error during play:", error)
    }
  }

  const handleStop = () => {
    if (!isPlaying) return;
    try {
      onStop()
    } catch (error) {
      console.error("Error during stop:", error)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handlePlay}
        disabled={disabled || isPlaying}
        className={`px-2 py-1 ${disabled ? 'bg-gray-400' : (isPlaying ? 'bg-lime-600' : 'bg-lime-400 hover:bg-lime-500')} 
          text-white rounded flex items-center space-x-1 text-sm transition-colors 
          ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>{isPlaying ? "Reproduciendo..." : "Reproducir"}</span>
      </button>
      <button
        onClick={handleStop}
        disabled={!isPlaying}
        className={`px-2 py-1 ${!isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-red-500 hover:bg-red-600 cursor-pointer'} 
          text-white rounded flex items-center space-x-1 text-sm transition-colors`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="6" y="6" width="12" height="12" />
        </svg>
        <span>Detener</span>
      </button>
    </div>
  )
}

export default PlaybackControls
