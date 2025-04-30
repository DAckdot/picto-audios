<template>
  <div 
    class="pictogram-card flex flex-col items-center bg-white rounded-lg border border-lime-500 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[200px] mx-auto aspect-square cursor-pointer"
    :class="{ 'bg-lime-200': isSelected }"
    @click="handleClick"
  >
    <img
      :src="getImageSource(pictogram)" 
      :alt="pictogram.FRASE || pictogram.label || 'Pictograma'" 
      class="object-contain h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
      @error="handleImageError"
    />
    <p class="text-sm sm:text-base md:text-sm font-medium text-lime-700 mt-2 text-center leading-tight">
      {{ pictogram.FRASE || pictogram.label }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import defaultImage from '../assets/picto_ex.png';

const props = defineProps({
  pictogram: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const hasError = ref(false);

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click", props.pictogram);
};

const handleImageError = () => {
  hasError.value = true;
};

const getImageSource = (pictogram) => {
  // Si hay un error al cargar la imagen o no tiene una imagen válida, usar la imagen por defecto
  if (hasError.value) {
    return defaultImage;
  }
  
  // Si viene de la API, la imagen está en pictogram.PHOTO
  if (pictogram.PHOTO) {
    // Verificar si ya es una URL de datos completa
    if (pictogram.PHOTO.startsWith('data:')) {
      return pictogram.PHOTO;
    }
    // De lo contrario, asumimos que es una cadena base64 y construimos la URL
    return `data:image/jpeg;base64,${pictogram.PHOTO}`;
  }
  
  // Si viene de datos locales, la imagen está en pictogram.image
  if (pictogram.image) {
    return pictogram.image;
  }
  
  // Si no tiene ninguna, usar la imagen por defecto
  return defaultImage;
};
</script>

<style scoped>
.pictogram-card {
  border: 1px solid #ccc;
  padding: 16px;
  text-align: center;
}
</style>