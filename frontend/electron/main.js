import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import url from 'url';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directorio para almacenar las imágenes
const imageStorageDir = path.join(app.getPath('userData'), 'pictograms');
const defaultImagesDir = path.join(__dirname, '../src/assets');

// Asegurar que los directorios existan
function ensureDirectoriesExist() {
  const dirs = [
    imageStorageDir,
    path.join(imageStorageDir, 'saludos'),
    path.join(imageStorageDir, 'comida'),
    path.join(imageStorageDir, 'actividades'),
    path.join(imageStorageDir, 'emociones'),
    path.join(imageStorageDir, 'otros')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directorio creado: ${dir}`);
    }
  });
}

// Copia las imágenes por defecto al directorio de almacenamiento
function copyDefaultImages() {
  try {
    if (!fs.existsSync(defaultImagesDir)) {
      console.warn('El directorio de imágenes por defecto no existe:', defaultImagesDir);
      return;
    }
    
    // Leer las imágenes del directorio de assets
    const assetFiles = fs.readdirSync(defaultImagesDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    
    // Si no hay archivos, no hacer nada
    if (assetFiles.length === 0) {
      console.log('No se encontraron imágenes por defecto para copiar');
      return;
    }
    
    // Copiar las imágenes al directorio de almacenamiento
    const defaultFolder = path.join(imageStorageDir, 'por_defecto');
    if (!fs.existsSync(defaultFolder)) {
      fs.mkdirSync(defaultFolder, { recursive: true });
    }
    
    assetFiles.forEach(file => {
      const sourcePath = path.join(defaultImagesDir, file);
      const targetPath = path.join(defaultFolder, file);
      
      // Solo copiar si no existe
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Imagen copiada: ${file}`);
      }
    });
    
    console.log(`${assetFiles.length} imágenes predeterminadas disponibles`);
  } catch (error) {
    console.error('Error al copiar imágenes predeterminadas:', error);
  }
}

// Crear la ventana principal
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Cargar la aplicación
  const startUrl = isDev
    ? 'http://localhost:5173' // Puerto de desarrollo de Vite
    : url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      });
  
  mainWindow.loadURL(startUrl);

  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  ensureDirectoriesExist();
  copyDefaultImages();
  createWindow();

  app.on('activate', function () {
    // En macOS es común volver a crear una ventana cuando
    // se hace clic en el icono del dock y no hay otras ventanas abiertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir de la aplicación cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ============= GESTIÓN DE IMÁGENES =============

// Convertir una imagen a base64
function imageToBase64(imagePath) {
  try {
    // Leer el archivo de imagen
    const imageData = fs.readFileSync(imagePath);
    
    // Obtener el tipo MIME basado en la extensión
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg'; // Valor por defecto
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    
    // Convertir a base64
    const base64Image = `data:${mimeType};base64,${imageData.toString('base64')}`;
    return base64Image;
  } catch (error) {
    console.error('Error al convertir imagen a base64:', error);
    return null;
  }
}

// Guardar una imagen de base64 a un archivo
ipcMain.handle('save-image', async (event, args) => {
  try {
    const { base64Data, fileName, folder = 'otros' } = args;
    
    // Validar los datos
    if (!base64Data || !fileName) {
      return { success: false, error: 'Datos incompletos' };
    }
    
    // Asegurar que el directorio de la carpeta exista
    const folderPath = path.join(imageStorageDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Extraer los datos binarios del string base64
    // Formato esperado: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Formato de imagen inválido' };
    }
    
    // Extraer el tipo MIME y los datos
    const mimeType = matches[1];
    const base64Content = matches[2];
    
    // Determinar extensión a partir del MIME
    let extension = '.jpg';
    if (mimeType === 'image/png') extension = '.png';
    else if (mimeType === 'image/gif') extension = '.gif';
    else if (mimeType === 'image/svg+xml') extension = '.svg';
    
    // Crear nombre de archivo seguro y único
    const safeFileName = fileName
      .replace(/[^a-z0-9áéíóúñü]/gi, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const finalFileName = `${safeFileName}_${timestamp}${extension}`;
    const filePath = path.join(folderPath, finalFileName);
    
    // Convertir base64 a buffer y guardar
    const imageBuffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, imageBuffer);
    
    // Devolver la ruta relativa para almacenar en la base de datos
    const relativePath = path.join(folder, finalFileName);
    
    return {
      success: true,
      filePath: relativePath.replace(/\\/g, '/') // Normalizar para que sea independiente del SO
    };
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    return { success: false, error: error.message };
  }
});

// Cargar una imagen desde el sistema de archivos
ipcMain.handle('load-image', async (event, imagePath) => {
  try {
    // Validar ruta
    if (!imagePath) {
      return { success: false, error: 'Ruta no especificada' };
    }
    
    // Convertir ruta relativa a absoluta
    const fullPath = path.join(imageStorageDir, imagePath);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      return { 
        success: false, 
        error: `Imagen no encontrada: ${imagePath}` 
      };
    }
    
    // Convertir imagen a base64
    const base64Image = imageToBase64(fullPath);
    if (!base64Image) {
      return { success: false, error: 'Error al convertir imagen' };
    }
    
    return {
      success: true,
      base64Image
    };
  } catch (error) {
    console.error('Error al cargar imagen:', error);
    return { success: false, error: error.message };
  }
});

// Eliminar una imagen del sistema de archivos
ipcMain.handle('delete-image', async (event, imagePath) => {
  try {
    // Validar ruta
    if (!imagePath) {
      return { success: false, error: 'Ruta no especificada' };
    }
    
    // Convertir ruta relativa a absoluta
    const fullPath = path.join(imageStorageDir, imagePath);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      return { 
        success: false, 
        error: `Imagen no encontrada: ${imagePath}` 
      };
    }
    
    // Eliminar el archivo
    fs.unlinkSync(fullPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    return { success: false, error: error.message };
  }
});

// Obtener las imágenes predeterminadas
ipcMain.handle('get-default-images', async () => {
  try {
    const defaultFolder = path.join(imageStorageDir, 'por_defecto');
    
    // Si no existe el directorio, devolver array vacío
    if (!fs.existsSync(defaultFolder)) {
      return { success: true, images: [] };
    }
    
    // Leer las imágenes del directorio
    const files = fs.readdirSync(defaultFolder)
      .filter(file => file.toLowerCase().endsWith('.png') || 
                       file.toLowerCase().endsWith('.jpg') || 
                       file.toLowerCase().endsWith('.jpeg'));
    
    // Convertir cada imagen a objeto con metadatos
    const images = files.map(file => {
      const filePath = path.join('por_defecto', file).replace(/\\/g, '/');
      
      return {
        fileName: file,
        filePath
      };
    });
    
    return {
      success: true,
      images
    };
  } catch (error) {
    console.error('Error al obtener imágenes predeterminadas:', error);
    return { success: false, error: error.message, images: [] };
  }
});

// Seleccionar una imagen del sistema de archivos
ipcMain.handle('select-image', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'gif'] }
      ]
    });
    
    // Si el usuario cancela, devolver un objeto indicando esto
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    
    // Convertir a base64 para previsualización
    const base64Image = imageToBase64(filePath);
    
    return {
      success: true,
      filePath,
      fileName,
      base64Image
    };
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    return { success: false, error: error.message };
  }
});