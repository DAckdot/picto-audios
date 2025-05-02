const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras a la ventana del navegador
contextBridge.exposeInMainWorld('electron', {
  // API de imágenes locales
  imageAPI: {
    // Guardar una imagen en el sistema de archivos local
    saveImage: (base64Data, fileName, folder) => 
      ipcRenderer.invoke('save-image', { base64Data, fileName, folder }),
    
    // Cargar una imagen desde el sistema de archivos local o desde assets
    loadImage: (imagePath) => 
      ipcRenderer.invoke('load-image', imagePath),
    
    // Eliminar una imagen del sistema de archivos local
    deleteImage: (imagePath) => 
      ipcRenderer.invoke('delete-image', imagePath),
    
    // Obtener todas las imágenes del directorio de assets (imágenes por defecto)
    getDefaultImages: () => 
      ipcRenderer.invoke('get-default-images'),
    
    // Abrir el selector de archivos para elegir una imagen
    selectImage: () => 
      ipcRenderer.invoke('select-image')
  }
});