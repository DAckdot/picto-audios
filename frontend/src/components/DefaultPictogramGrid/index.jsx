import { useState, useEffect, useCallback } from "react";
import imageService from "../../services/imageService";

function DefaultPictogramGrid({ onSelectPictogram, onAddToQueue }) {
  const [defaultPictograms, setDefaultPictograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isElectronEnabled, setIsElectronEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Check if Electron is available
  useEffect(() => {
    setIsElectronEnabled(window.electron !== undefined);
  }, []);

  // Function to load default pictograms
  const loadDefaultPictograms = useCallback(async () => {
    if (!isElectronEnabled) {
      setError("Default pictograms are only available in desktop mode");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await imageService.getDefaultImages();

      if (!result.success) {
        throw new Error(result.error || "Failed to load default images");
      }

      // Create pictogram objects from the image data
      const pictogramsPromises = result.images.map(async (image, index) => {
        let label = image.fileName.split(".")[0].replace(/_/g, " ");

        try {
          const imageResult = await imageService.loadImage(image.filePath);
          return {
            id: `default-${index}`,
            FRASE: label,
            label,
            imagePath: image.filePath,
            RUTA_IMAGEN: image.filePath,
            base64Image: imageResult.success ? imageResult.base64Image : null,
          };
        } catch (err) {
          console.error(`Error loading image ${image.filePath}:`, err);
          return {
            id: `default-${index}`,
            FRASE: label,
            label,
            imagePath: image.filePath,
            RUTA_IMAGEN: image.filePath,
            base64Image: null,
          };
        }
      });

      const pictograms = await Promise.all(pictogramsPromises);
      setDefaultPictograms(pictograms);
    } catch (error) {
      console.error("Error loading default pictograms:", error);
      setError(`Error loading default pictograms: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isElectronEnabled]);

  // Load default pictograms when component mounts or isElectronEnabled changes
  useEffect(() => {
    loadDefaultPictograms();
  }, [loadDefaultPictograms]);

  const handlePictogramClick = (pictogram) => {
    if (onSelectPictogram) {
      onSelectPictogram(pictogram);
    }

    if (onAddToQueue) {
      onAddToQueue(pictogram);
    }
  };

  if (!isElectronEnabled) {
    return (
      <div className="p-4 text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Desktop Mode Required: </strong>
          <span className="block sm:inline">Default pictograms are only available in the desktop application.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Default Pictograms</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-2"></div>
          <span>Loading default pictograms...</span>
        </div>
      ) : defaultPictograms.length === 0 ? (
        <div className="text-center text-gray-500 p-8">No default pictograms found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {defaultPictograms.map((pictogram) => (
            <div
              key={pictogram.id}
              className="pictogram-card flex flex-col items-center bg-white rounded-lg border border-green-400 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[200px] mx-auto aspect-square cursor-pointer"
              onClick={() => handlePictogramClick(pictogram)}
            >
              <img
                src={pictogram.base64Image || "/placeholder.svg"}
                alt={pictogram.label}
                className="object-contain h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
              />
              <p className="text-sm sm:text-base md:text-sm font-medium text-green-700 mt-2 text-center leading-tight">
                {pictogram.FRASE || pictogram.label}
              </p>
              <span className="absolute top-1 left-1 bg-green-100 text-green-800 text-[8px] px-1 rounded">
                Default
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DefaultPictogramGrid;