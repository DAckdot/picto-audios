import { useState, useEffect } from "react";
import PictogramCard from "../components/PictogramCard";
import PictogramSearch from "../components/PictogramSearch";
import systemPictograms from "../data/systemPictograms.json";
import { useSpeech } from "../hooks/useSpeech";

// Importamos la función getImageUrl de pictograms.js
const getImageUrl = (name) => {
  return new URL(`../assets/${name}.png`, import.meta.url).href;
};

function SystemPictogramsPage() {
  const [pictograms, setPictograms] = useState([]);
  const [filteredPictograms, setFilteredPictograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { speak } = useSpeech();

  useEffect(() => {
    // Load system pictograms from JSON and transform to match expected format
    setLoading(true);
    const transformedPictograms = systemPictograms.map(pictogram => {
      // Extraer solo el nombre de archivo sin la ruta y sin la extensión
      const fileName = pictogram.path.split('/').pop().replace('.png', '');
      return {
        id: pictogram.id,
        label: pictogram.label,
        // Usamos getImageUrl para generar la URL correcta
        image: getImageUrl(fileName.replace('.png', '')),
        systemPictogram: true,
      };
    });
    setPictograms(transformedPictograms);
    setFilteredPictograms(transformedPictograms);
    setLoading(false);
  }, []);

  const handlePictogramClick = (pictogram) => {
    console.log("Pictogram clicked:", pictogram.label);
    speak(pictogram.label);
  };

  const handleSearch = (results) => {
    setFilteredPictograms(results);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Pictogramas del Sistema</h1>
          <p className="text-sm text-gray-600 mt-1">
            Pictogramas disponibles para todos los usuarios
          </p>
        </div>

        <div className="p-4 h-full overflow-auto custom-scrollbar">
          {/* Loading indicator */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-2"></div>
              <span>Cargando pictogramas...</span>
            </div>
          ) : (
            <div>
              <PictogramSearch pictograms={pictograms} onSearch={handleSearch} />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                {filteredPictograms.map((pictogram) => (
                  <PictogramCard
                    key={pictogram.id}
                    pictogram={pictogram}
                    onClick={() => handlePictogramClick(pictogram)}
                    disableEditDelete={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SystemPictogramsPage;
export { getImageUrl };
