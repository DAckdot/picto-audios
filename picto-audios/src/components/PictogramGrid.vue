<template>
  <div class="p-4 h-full overflow-auto custom-scrollbar md:overflow-scroll ">
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <PictogramCard 
        v-for="pictogram in pictograms" 
        :key="pictogram.id" 
        :pictogram="pictogram" 
        @click="$emit('play-pictogram', pictogram)" 
        @add-to-queue="$emit('add-to-queue', pictogram)" 
      />
    </div>
  </div>
</template>

<script setup>
import PictogramCard from './PictogramCard.vue';

const props = defineProps({
  pictograms: {
    type: Array,
    required: true,
  },
});

defineEmits(["play-pictogram", "add-to-queue"]);
</script>

<style scoped>
/* Scroll personalizado */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #0406042b #f0f0f0;
  
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4caf50;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #f0f0f0;
}
</style>