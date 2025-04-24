<template>
  <div 
  class="pictogram-card flex flex-col items-center bg-white rounded-lg border border-green-600 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[200px] mx-auto aspect-square cursor-pointer"
  @click.stop="handleAddToQueue"
  >
    <img
      :src="pictogram.image || '../assets/picto_ex.png'" 
      :alt="pictogram.name" 
      class="object-contain h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
    />
    <p class="text-sm sm:text-base md:text-sm font-medium text-green-600 mt-2 text-center leading-tight">{{ pictogram.label }}</p>
    <button 
      class="bg-green-400 text-white text-xs sm:text-sm md:text-base px-2 py-1 rounded mt-2 hover:bg-green-500"
      @click.stop="handleAddToQueue"
    >
      Agregar
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  pictogram: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["click", "add-to-queue"]);

const handleClick = () => {
  emit("click", props.pictogram);
};

const handleAddToQueue = () => {
  emit("add-to-queue", props.pictogram);
};
</script>

<style scoped>
.pictogram-card {
  border: 1px solid #ccc;
  padding: 16px;
  text-align: center;
}
button {
  margin-top: 8px;
}
</style>