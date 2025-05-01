"use client"

function PlaybackControls({ onPlay, onStop }) {
  const handlePlay = () => {
    try {
      onPlay()
    } catch (error) {
      console.error("Error during play:", error)
    }
  }

  const handleStop = () => {
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
        className="px-2 py-1 bg-lime-400 text-white rounded hover:bg-lime-500 flex items-center space-x-1 text-sm"
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
        <span>Play</span>
      </button>
      <button
        onClick={handleStop}
        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-1 text-sm"
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
        <span>Stop</span>
      </button>
    </div>
  )
}

export default PlaybackControls
