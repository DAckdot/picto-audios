<template>
  <div class="flex items-center space-x-4">
    <button 
      @click="$emit('play')" 
      class="px-4 py-2 bg-white text-white rounded hover:bg-green-600 flex items-center space-x-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Reproducir Todo</span>
    </button>
    <button 
      @click="$emit('stop')" 
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="6" y1="18" x2="18" y2="6"/>
      </svg>
      <span>Detener</span>
    </button>
  </div>
</template>

<script setup>
// No additional logic needed; emits events for play and stop actions
</script>

<style scoped>
/* Add any additional styles if needed */
button {
  padding: 8px 16px;
  background-color: #000; /* Verde */
  color: white;
  border-radius: 16px;
  font-size: 14px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #388e3c; /* Verde oscuro */
}
</style>
