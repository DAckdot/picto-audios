// Servicio para gestionar las imágenes a través de Electron
// Proporciona una capa de abstracción para usar la API de Electron o alternativas

// Verificar si estamos en Electron o en un navegador web
const isElectron = window.electron !== undefined;

// Implementación para entorno Electron - usa el sistema de archivos local
const electronImplementation = {
  // Guardar imagen localmente
  saveImage: async (base64Data, fileName, folder) => {
    try {
      if (!isElectron) throw new Error('Electron no disponible');
      
      const result = await window.electron.imageAPI.saveImage(base64Data, fileName, folder);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar imagen');
      }
      
      return {
        success: true,
        filePath: result.filePath
      };
    } catch (error) {
      console.error('Error en saveImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Cargar imagen desde local
  loadImage: async (imagePath) => {
    try {
      if (!isElectron) throw new Error('Electron no disponible');
      
      // Si no hay ruta, devolvemos null
      if (!imagePath) return { success: false, error: 'Ruta no especificada' };
      
      const result = await window.electron.imageAPI.loadImage(imagePath);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar imagen');
      }
      
      return {
        success: true,
        base64Image: result.base64Image
      };
    } catch (error) {
      console.error('Error en loadImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Eliminar imagen
  deleteImage: async (imagePath) => {
    try {
      if (!isElectron) throw new Error('Electron no disponible');
      
      if (!imagePath) return { success: false, error: 'Ruta no especificada' };
      
      const result = await window.electron.imageAPI.deleteImage(imagePath);
      
      if (!result.success) {
        console.warn('No se pudo eliminar la imagen:', result.error);
        // No lanzamos error porque puede ser una imagen por defecto
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error en deleteImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Obtener imágenes predeterminadas
  getDefaultImages: async () => {
    try {
      if (!isElectron) throw new Error('Electron no disponible');
      
      const result = await window.electron.imageAPI.getDefaultImages();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener imágenes predeterminadas');
      }
      
      return {
        success: true,
        images: result.images
      };
    } catch (error) {
      console.error('Error en getDefaultImages:', error);
      return {
        success: false,
        error: error.message,
        images: []
      };
    }
  },
  
  // Seleccionar imagen del sistema de archivos
  selectImage: async () => {
    try {
      if (!isElectron) throw new Error('Electron no disponible');
      
      const result = await window.electron.imageAPI.selectImage();
      
      if (!result.success) {
        // Si fue cancelado, no es un error
        if (result.canceled) {
          return { success: false, canceled: true };
        }
        
        throw new Error(result.error || 'Error al seleccionar imagen');
      }
      
      return {
        success: true,
        filePath: result.filePath,
        fileName: result.fileName,
        base64Image: result.base64Image
      };
    } catch (error) {
      console.error('Error en selectImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Implementación para navegador web - usa memoria y localStorage como respaldo
const webImplementation = {
  // Un caché en memoria para las imágenes
  _imageCache: new Map(),
  
  // Guardar imagen en memoria/localStorage
  saveImage: async (base64Data, fileName, folder) => {
    try {
      // Generar nombre único
      const timestamp = new Date().getTime();
      const safeName = fileName.replace(/\s+/g, '_');
      const imagePath = `${folder}/${safeName}_${timestamp}.jpg`;
      
      // Guardar en memoria
      webImplementation._imageCache.set(imagePath, base64Data);
      
      // Opcional: intentar guardar en localStorage (con límites)
      try {
        // Verificar si localStorage está disponible y tiene espacio
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`image_${imagePath}`, base64Data);
        }
      } catch (storageError) {
        console.warn('No se pudo guardar en localStorage:', storageError);
      }
      
      return {
        success: true,
        filePath: imagePath
      };
    } catch (error) {
      console.error('Error al guardar imagen en navegador:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Cargar imagen desde memoria/localStorage
  loadImage: async (imagePath) => {
    try {
      // Primero intentar cargar desde la memoria
      if (webImplementation._imageCache.has(imagePath)) {
        return {
          success: true,
          base64Image: webImplementation._imageCache.get(imagePath)
        };
      }
      
      // Intentar cargar desde localStorage
      if (typeof localStorage !== 'undefined') {
        const storedImage = localStorage.getItem(`image_${imagePath}`);
        if (storedImage) {
          // Guardar en memoria para próximas solicitudes
          webImplementation._imageCache.set(imagePath, storedImage);
          return {
            success: true,
            base64Image: storedImage
          };
        }
      }
      
      // Si es una imagen por defecto (solo el nombre de archivo), intentar cargar desde assets
      if (!imagePath.includes('/')) {
        try {
          // Intentar importar dinámicamente (esto depende de Vite/webpack)
          const imageUrl = new URL(`../assets/${imagePath}`, import.meta.url).href;
          
          return {
            success: true,
            base64Image: imageUrl
          };
        } catch (importError) {
          console.warn(`No se pudo importar la imagen ${imagePath}:`, importError);
        }
      }
      
      // Si todo falla, usar una imagen por defecto
      return {
        success: false,
        error: 'Imagen no encontrada',
        base64Image: new URL('../assets/picto_ex.png', import.meta.url).href
      };
    } catch (error) {
      console.error('Error al cargar imagen en navegador:', error);
      return {
        success: false,
        error: error.message,
        base64Image: new URL('../assets/picto_ex.png', import.meta.url).href
      };
    }
  },
  
  // Eliminar imagen
  deleteImage: async (imagePath) => {
    try {
      // Eliminar de memoria
      webImplementation._imageCache.delete(imagePath);
      
      // Eliminar de localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`image_${imagePath}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar imagen en navegador:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Obtener imágenes predeterminadas
  getDefaultImages: async () => {
    // Este método es limitado en el navegador
    // Podría implementarse con un listado estático o importación dinámica
    console.warn('getDefaultImages no está completamente implementado en modo navegador');
    return {
      success: false,
      error: 'Función no disponible en navegador web',
      images: []
    };
  },
  
  // Seleccionar imagen (usa input file)
  selectImage: () => {
    return new Promise((resolve) => {
      // Crear un input file temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve({ success: false, canceled: true });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Image = e.target.result;
          resolve({
            success: true,
            fileName: file.name,
            base64Image
          });
        };
        
        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Error al leer el archivo'
          });
        };
        
        reader.readAsDataURL(file);
      };
      
      // Simular clic para abrir el selector
      input.click();
    });
  }
};

// Exportar la implementación adecuada según el entorno
const imageService = isElectron ? electronImplementation : webImplementation;

export default imageService;