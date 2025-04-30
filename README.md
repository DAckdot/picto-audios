# Picto-audios

Interface donde en base a imágenes se van formulando oraciones por el navegador, para poder conversar con el cliente.

---

## Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Backend](#backend)
- [Frontend](#frontend)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Licencia](#licencia)

---

## Descripción General

El sistema está compuesto por un backend en PHP (API RESTful) y un frontend en Vue.js. Permite gestionar usuarios, carpetas y pictogramas, y construir frases a partir de imágenes, que luego son reproducidas por el navegador usando síntesis de voz.

---

## Arquitectura

- **Backend**: PHP puro, expone endpoints REST para usuarios, carpetas y pictogramas. Utiliza MySQL y puede ejecutarse en Docker.
- **Frontend**: Vue.js 3 + Vite + Tailwind CSS. Permite seleccionar carpetas, ver pictogramas, crear frases y reproducirlas por voz.

---

## Backend

### Estructura

- `pictogramas_backend/`
  - `index.php`: Punto de entrada de la API REST.
  - `models/`: Modelos PHP para Usuario, Carpeta y Pictograma.
  - `config/db.php`: Configuración de la base de datos.
  - `Dockerfile`: Para ejecutar el backend en Docker.

### Endpoints principales

- **Usuarios**
  - `GET /index.php/usuarios`: Listar usuarios.
  - `POST /index.php/usuarios`: Crear usuario.
  - `PUT /index.php/usuarios/{id}`: Editar usuario.
  - `DELETE /index.php/usuarios/{id}`: Eliminar usuario.

- **Carpetas**
  - `GET /index.php/carpetas?usuario_id={id}`: Listar carpetas de un usuario.
  - `POST /index.php/carpetas`: Crear carpeta.
  - `PUT /index.php/carpetas/{id}`: Editar carpeta.
  - `DELETE /index.php/carpetas/{id}`: Eliminar carpeta.

- **Pictogramas**
  - `GET /index.php/pictogramas?carpeta_id={id}`: Listar pictogramas de una carpeta.
  - `POST /index.php/pictogramas`: Crear pictograma.
  - `PUT /index.php/pictogramas/{id}`: Editar pictograma.
  - `DELETE /index.php/pictogramas/{id}`: Eliminar pictograma.

### Funcionamiento

- El backend valida que los usuarios y carpetas existan antes de crear o eliminar recursos.
- Las imágenes de los pictogramas se almacenan en base64 en la base de datos.
- El backend responde en JSON y maneja errores comunes (datos incompletos, recursos no encontrados, etc).

### Ejecución con Docker

```bash
cd pictogramas_backend
docker build -t pictogramas-backend .
docker run -p 8080:80 pictogramas-backend
```

---

## Frontend

El frontend de este proyecto está desarrollado utilizando las siguientes tecnologías:

- **Vue.js 3**: Framework progresivo para construir interfaces de usuario.
- **Tailwind CSS**: Framework de utilidades para estilos rápidos y responsivos.
- **Vite**: Herramienta de construcción rápida para proyectos Vue.js.

### Estructura del frontend

El frontend se encuentra en la carpeta `frontend` y tiene la siguiente estructura principal:

```
frontend/
├── src/
│   ├── assets/        # Archivos estáticos como imágenes
│   ├── components/    # Componentes reutilizables como PictogramCard y PictogramGrid
│   ├── composables/   # Funciones reutilizables como useQueueHandler y useSpeech
│   ├── views/         # Vistas principales de la aplicación
│   ├── App.vue        # Componente raíz de Vue
│   ├── main.js        # Punto de entrada de la aplicación
│   └── style.css      # Estilos globales
├── index.html         # Archivo HTML principal
└── package.json       # Dependencias y scripts del proyecto
```

### Funcionamiento

- El usuario selecciona una carpeta y ve los pictogramas asociados.
- Puede agregar pictogramas a una "cola" para construir frases.
- Al reproducir la frase, el navegador usa la síntesis de voz para leerla.
- Permite crear, editar y eliminar carpetas y pictogramas.
- Incluye una vista de diagnóstico para probar la conexión con el backend.

---

## Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/picto-audios.git
cd picto-audios
```

### 2. Backend

#### Opción A: Docker (recomendado)

```bash
cd pictogramas_backend
docker build -t pictogramas-backend .
docker run -p 8080:80 pictogramas-backend
```

#### Opción B: Servidor local PHP

Asegúrate de tener PHP y MySQL configurados. Coloca la carpeta `pictogramas_backend` en tu servidor web y configura la base de datos en `config/db.php`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

### 4. Configuración de la API

El frontend está configurado para consumir la API en `https://pb-ykap.onrender.com/index.php` por defecto. Si corres el backend localmente, ajusta la URL en `src/api.js` (`API_BASE_URL`).

---

## Licencia

MIT License. Consulta el archivo LICENSE para más detalles.

---

¿Dudas? Consulta los archivos README de cada subcarpeta para detalles adicionales.