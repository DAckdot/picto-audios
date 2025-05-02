# Picto Audios - Frontend

## Descripción
Sistema de comunicación aumentativa basado en pictogramas con capacidad de síntesis de voz. Esta aplicación permite a los usuarios seleccionar pictogramas para formar frases que luego pueden ser reproducidas como audio, facilitando la comunicación para personas con dificultades del habla.

## Tecnologías
- **React.js** - Biblioteca JavaScript para construir interfaces de usuario
- **Vite** - Herramienta de compilación y desarrollo
- **TailwindCSS** - Framework CSS para diseño rápido
- **Web Speech API** - Para síntesis de voz

## Requisitos previos
- Node.js (v16.0.0 o superior)
- npm (v8.0.0 o superior)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/picto-audios.git

# Navegar al directorio del frontend
cd picto-audios/frontend

# Instalar dependencias
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`

## Construir para producción

```bash
npm run build
```

Los archivos compilados estarán disponibles en el directorio `dist/`

## Características principales
- Búsqueda de pictogramas
- Selección y organización de pictogramas en secuencia
- Reproducción de audio a partir de los pictogramas seleccionados
- Ajuste de velocidad y tono de la voz
- Organización de pictogramas por categorías

## Estructura del proyecto
- `src/components/` - Componentes reutilizables de React
- `src/hooks/` - Hooks personalizados (useSpeech, useQueueHandler)
- `src/assets/` - Pictogramas e imágenes
- `src/data/` - Datos estáticos como la lista de pictogramas

## Licencia
[Ver archivo LICENSE para detalles](../LICENSE)
