import { useState, useEffect } from "react";

function PictogramSearch({ pictograms, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Esta función extrae el texto del pictograma de cualquier formato posible
  const getPictogramText = (pictogram) => {
    return pictogram.FRASE || pictogram.label || pictogram.texto || pictogram.NOMBRE || "";
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      // Si el término de búsqueda está vacío, mostrar todos los pictogramas
      onSearch(pictograms);
      return;
    }
    
    const termLower = term.toLowerCase();
    const filteredPictograms = pictograms.filter((pictogram) => {
      const text = getPictogramText(pictogram);
      return text.toLowerCase().includes(termLower);
    });
    
    onSearch(filteredPictograms);
  };

  // Al montar el componente o cuando cambian los pictogramas, resetear los resultados
  useEffect(() => {
    onSearch(pictograms);
  }, [pictograms, onSearch]);

  return (
    <div className="search-bar mb-4">
      <input
        type="text"
        placeholder="Buscar pictogramas..."
        value={searchTerm}
        onChange={handleSearch}
        className="p-2 border border-gray-300 rounded-lg w-full focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
      />
    </div>
  );
}

export default PictogramSearch;