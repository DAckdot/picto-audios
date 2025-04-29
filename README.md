# Picto-audios
Interface donde en base a imagenes se van formulando oraciones por el navegador , para poder conversar con el cliente

## Frontend

El frontend de este proyecto está desarrollado utilizando las siguientes tecnologías:

- **Vue.js 3**: Framework progresivo para construir interfaces de usuario.
- **Tailwind CSS**: Framework de utilidades para estilos rápidos y responsivos.
- **Vite**: Herramienta de construcción rápida para proyectos Vue.js.

### Estructura del frontend

El frontend se encuentra en la carpeta `frontend` y tiene la siguiente estructura principal:
frontend/ ├── src/ │ ├── assets/ # Archivos estáticos como imágenes │ ├── components/ # Componentes reutilizables como PictogramCard y PictogramGrid │ ├── composables/ # Funciones reutilizables como useQueueHandler y useSpeech │ ├── views/ # Vistas principales de la aplicación │ ├── App.vue # Componente raíz de Vue │ ├── main.js # Punto de entrada de la aplicación │ └── styles.css # Estilos globales ├── index.html # Archivo HTML principal └── package.json # Dependencias y scripts del proyecto

### Instalación

Sigue estos pasos para instalar y ejecutar el frontend:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/picto-audios.git
   cd picto-audios/frontend
2. **Instalar dependencias**:
   npm install