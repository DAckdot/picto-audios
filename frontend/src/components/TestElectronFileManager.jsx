import React, { useState } from 'react';
import imageService from '../services/imageService';

function TestElectronFileManager() {
  const [imagePath, setImagePath] = useState(null);
  const [pictograms, setPictograms] = useState([]);

  const handleUploadImage = async () => {
    try {
      const result = await imageService.selectImage();
      if (result.success) {
        const saveResult = await imageService.saveImage(result.base64Image, result.fileName, 'test_folder');
        if (saveResult.success) {
          setImagePath(saveResult.filePath);
          alert('Image uploaded and saved successfully!');
        } else {
          alert('Failed to save image: ' + saveResult.error);
        }
      } else {
        alert('Image selection canceled or failed.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleCreatePictogram = () => {
    if (!imagePath) {
      alert('No image uploaded. Please upload an image first.');
      return;
    }
    const newPictogram = {
      id: Date.now(),
      label: 'Test Pictogram',
      imagePath,
    };
    setPictograms([...pictograms, newPictogram]);
    alert('Pictogram created successfully!');
  };

  const handleEditPictogram = (id) => {
    const newImagePath = prompt('Enter new image path:');
    if (!newImagePath) return;

    setPictograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imagePath: newImagePath } : p))
    );
    alert('Pictogram updated successfully!');
  };

  const handleDeletePictogram = async (id) => {
    const pictogramToDelete = pictograms.find((p) => p.id === id);
    if (!pictogramToDelete) return;

    try {
      await imageService.deleteImage(pictogramToDelete.imagePath);
      setPictograms((prev) => prev.filter((p) => p.id !== id));
      alert('Pictogram and associated image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Test Electron File Manager</h1>

      <button
        onClick={handleUploadImage}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Upload Image
      </button>

      <button
        onClick={handleCreatePictogram}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4 ml-2"
      >
        Create Pictogram
      </button>

      <div className="mt-4">
        <h2 className="text-md font-semibold mb-2">Pictograms</h2>
        {pictograms.length === 0 ? (
          <p>No pictograms created yet.</p>
        ) : (
          <ul>
            {pictograms.map((p) => (
              <li key={p.id} className="mb-2">
                <div className="flex items-center space-x-4">
                  <span>{p.label}</span>
                  <span className="text-sm text-gray-500">({p.imagePath})</span>
                  <button
                    onClick={() => handleEditPictogram(p.id)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePictogram(p.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TestElectronFileManager;