<template>
  <div class="flex items-center space-x-2">
    <button 
      @click="handlePlay" 
      class="px-2 py-1 bg-lime-400 text-white rounded hover:bg-lime-500 flex items-center space-x-1 text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Reproducir</span>
    </button>
    <button 
      @click="handleStop" 
      class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-1 text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="6" y1="18" x2="18" y2="6"/>
      </svg>
      <span>Detener</span>
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['play', 'stop']);

const handlePlay = () => {
  try {
    emit('play');
  } catch (error) {
    console.error("Error during play:", error);
  }
};

const handleStop = () => {
  try {
    emit('stop');
  } catch (error) {
    console.error("Error during stop:", error);
  }
};
</script>

