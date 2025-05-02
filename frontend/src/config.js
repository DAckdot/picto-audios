/**
 * Configuración centralizada de la aplicación
 */

// API endpoints
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  ENDPOINTS: {
    FOLDERS: '/folders',
    PICTOGRAMS: '/pictograms',
    USERS: '/users',
  }
};

// Configuración de síntesis de voz
export const SPEECH_CONFIG = {
  DEFAULT_RATE: 1.0,     // Velocidad normal
  DEFAULT_PITCH: 1.0,    // Tono normal
  DEFAULT_VOLUME: 1.0,   // Volumen máximo
  PREFERRED_LANGUAGE: 'es-ES'  // Español de España preferido
};

// Configuración general de la aplicación
export const APP_CONFIG = {
  DEFAULT_USER_ID: 1,
  APP_NAME: 'Picto Audios',
  VERSION: '1.0.0',
};