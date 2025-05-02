import React from 'react';

function AboutPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Acerca de Picto Audios</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Nuestra Misión</h2>
        <p className="mb-4">
          Picto Audios es un sistema de comunicación aumentativa basado en pictogramas con capacidad de síntesis de voz,
          diseñado para facilitar la comunicación para personas con dificultades del habla.
        </p>
        <p>
          Nuestro objetivo es proporcionar una herramienta accesible, intuitiva y efectiva que mejore
          la calidad de vida y autonomía de nuestros usuarios.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Características</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Búsqueda rápida de pictogramas</li>
          <li>Organización por categorías</li>
          <li>Creación de secuencias de pictogramas</li>
          <li>Síntesis de voz de alta calidad</li>
          <li>Interfaz adaptada a diferentes dispositivos</li>
          <li>Personalizaciones de usuarios</li>
        </ul>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Tecnología</h2>
        <p className="mb-4">
          Picto Audios está desarrollado con React.js, Vite y TailwindCSS para crear una experiencia fluida
          y moderna. Utilizamos la Web Speech API para proporcionar la síntesis de voz natural.
        </p>
      </div>
    </div>
  );
}

export default AboutPage;