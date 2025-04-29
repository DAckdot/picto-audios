<template>
  <header class="bg-black border-b border-green-700 p-4 flex flex-col space-y-4">
    <!-- Header Title -->
    <div class="flex items-center justify-between">
      <h1 class="text-white text-lg font-semibold">Tablero de comunicación</h1>
      <div class="flex space-x-2">
        <button 
          @click="clearQueue" 
          class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center space-x-1 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="6" y1="18" x2="18" y2="6"/>
          </svg>
          <span>Borrar Todo</span>
        </button>
        <button 
          @click="removeLastPictogram" 
          class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center space-x-1 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-7 7-7-7"/>
          </svg>
          <span>Borrar Último</span>
        </button>
      </div>
    </div>

    <!-- Pictogram Queue -->
   <div class="flex overflow-x-auto space-x-4 bg-gray-100 p-2 rounded-lg min-h-[100px]" @dragover.prevent @drop="handleDrop">
      <div 
      v-for="(item, index) in internalQueue" 
      :key="item.id"
      class="flex-shrink-0 relative group cursor-move"
      draggable="true"
      @dragstart="handleDragStart($event, index)"
      @dragover.prevent
      @dragenter.prevent="handleDragEnter($event, index)"
      >
        <div class="w-20 h-20 bg-white rounded-md flex flex-col items-center justify-center border border-gray-300"
             :class="{ 'border-blue-500 border-2': isDraggingOver === index }">
          <img 
            :src="item.image || defaultImage" 
            :alt="item.label" 
            class="object-contain h-8 w-8"
          />
          <span class="text-xs text-gray-700 mt-1">{{ item.label }}</span>
        </div>
        <button 
          @click="removeFromQueue(index)" 
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          aria-label="Eliminar pictograma"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="6" y1="18" x2="18" y2="6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Playback Controls -->
    <div class="flex justify-end space-x-4">
      <PlaybackControls 
        @play="playQueue(speak)" 
        @stop="stopQueue(stop)" 
      />
    </div>
  </header>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useQueueHandler } from "../composables/useQueueHandler";
import { useSpeech } from "../composables/useSpeech";
import PlaybackControls from "./PlaybackControls.vue";
import fallbackImage from '../assets/vue.svg';

const defaultImage = fallbackImage;
const props = defineProps({
  queue: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update-queue"]);

const { speak, stop } = useSpeech();
const { 
  queue: internalQueue, 
  clearQueue, 
  removeFromQueue, 
  removeLastPictogram, 
  movePictogram, 
  playQueue, 
  stopQueue,
  addToQueue 
} = useQueueHandler(props.queue);

// Sincronizar la cola interna cuando cambia la prop externa
watch(() => props.queue, (newQueue) => {
  // Actualizar la cola interna cuando cambia la prop externa
  if (newQueue.length !== internalQueue.length) {
    // Solo reinicializar si es necesario para evitar bucles infinitos
    internalQueue.splice(0, internalQueue.length, ...newQueue);
  }
}, { deep: true });

// Sincronizar la cola externa cuando cambia la interna
watch(internalQueue, () => {
  console.log("Queue updated:", internalQueue);  // Para depuración
  emit("update-queue", [...internalQueue]);
}, { deep: true });

// Inicializar
onMounted(() => {
  // Asegurarse de que internalQueue tenga los mismos elementos que props.queue
  if (props.queue.length > 0 && internalQueue.length === 0) {
    props.queue.forEach(item => addToQueue(item));
  }
});

// Variables para manejar arrastrar y soltar
const draggedItemIndex = ref(null);
const isDraggingOver = ref(null);

// Funciones para manejar arrastrar y soltar
const handleDragStart = (event, index) => {
  draggedItemIndex.value = index;
  // Establecer los datos que se arrastran
  event.dataTransfer.effectAllowed = 'move';
  // Ocultar la imagen fantasma del arrastre
  const dragImage = new Image();
  dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Imagen transparente 1x1
  event.dataTransfer.setDragImage(dragImage, 0, 0);
};

const handleDragEnter = (event, index) => {
  if (index !== draggedItemIndex.value) {
    isDraggingOver.value = index;
  }
};

const handleDrop = () => {
  if (draggedItemIndex.value !== null && isDraggingOver.value !== null && draggedItemIndex.value !== isDraggingOver.value) {
    // Mover el elemento
    movePictogram(draggedItemIndex.value, isDraggingOver.value);
  }
  
  // Reiniciar variables
  draggedItemIndex.value = null;
  isDraggingOver.value = null;
};
</script>

<style scoped>
/* Add hover effects for buttons */
button:hover {
  transition: background-color 0.3s ease;
}

.cursor-move {
  cursor: grab;
}

.cursor-move:active {
  cursor: grabbing;
}
</style>
