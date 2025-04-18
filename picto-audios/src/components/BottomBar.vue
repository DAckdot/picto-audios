<template>
  <div class="bg-green-600 border-t border-green-700 p-3">
    <div class="flex items-center justify-between">
      <!-- Pictogram Queue -->
      <div 
        class="flex-1 overflow-x-auto flex space-x-2" 
        @dragover.prevent 
        @drop="handleDrop"
      >
        <div 
          v-for="(item, index) in queue" 
          :key="item.id"
          class="flex-shrink-0 relative group cursor-pointer"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragend="handleDragEnd"
        >
          <div class="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-green-600">
            <img 
              src="../assets/picto_ex.png" 
              alt="Pictogram" 
              class="object-contain h-10 w-10"
            />
          </div>
        </div>
      </div>
      <!-- Playback Controls -->
      <div class="flex-shrink-0 ml-4 flex items-center space-x-4">
        <PlaybackControls @play="playQueue" @stop="stopQueue" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSpeechHandler } from "../composables/useSpeechHandler";
import PlaybackControls from "./PlaybackControls.vue";

const props = defineProps({
  queue: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update-queue"]);

const draggedIndex = ref(null);
const { speak, stop } = useSpeechHandler();

const handleDragStart = (index) => {
  draggedIndex.value = index;
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

const handleDrop = (event) => {
  const targetIndex = Array.from(event.currentTarget.children).indexOf(event.target.closest(".group"));
  if (draggedIndex.value !== null && targetIndex !== -1 && draggedIndex.value !== targetIndex) {
    const updatedQueue = [...props.queue];
    const [movedItem] = updatedQueue.splice(draggedIndex.value, 1);
    updatedQueue.splice(targetIndex, 0, movedItem);
    emit("update-queue", updatedQueue);
  }
};

const playQueue = async () => {
  for (const item of props.queue) {
    await speak(item.label); // Play each pictogram in the queue
  }
};

const stopQueue = () => {
  stop(); // Stop the playback
};
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
