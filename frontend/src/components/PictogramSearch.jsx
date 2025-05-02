import { useState, useEffect, useCallback, useRef } from "react";

function PictogramSearch({ pictograms, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const firstRender = useRef(true);
  const prevPictogramsRef = useRef(pictograms);
  
  // Esta función extrae el texto del pictograma de cualquier formato posible
  const getPictogramText = (pictogram) => {
    return pictogram.FRASE || pictogram.label || pictogram.texto || pictogram.NOMBRE || "";
  };

  // Memoizamos la función de filtrado para evitar recálculos innecesarios
  const filterPictograms = useCallback((term, pictos) => {
    if (!term.trim()) {
      return pictos;
    }
    
    const termLower = term.toLowerCase();
    return pictos.filter((pictogram) => {
      const text = getPictogramText(pictogram);
      return text.toLowerCase().includes(termLower);
    });
  }, []);

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    // Aplicamos el filtrado y notificamos al componente padre
    const filteredResults = filterPictograms(term, pictograms);
    onSearch(filteredResults);
  };

  // Sólo actualizamos cuando cambian los pictogramas
  useEffect(() => {
    // Si es el primer renderizado, no hacemos nada adicional
    if (firstRender.current) {
      firstRender.current = false;
      prevPictogramsRef.current = pictograms;
      return;
    }

    // Solo actualizamos si los pictogramas han cambiado realmente
    if (prevPictogramsRef.current !== pictograms) {
      prevPictogramsRef.current = pictograms;
      const filteredResults = filterPictograms(searchTerm, pictograms);
      onSearch(filteredResults);
    }
  }, [pictograms, filterPictograms]); // Eliminamos searchTerm de las dependencias

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