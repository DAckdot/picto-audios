<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">Diagnóstico de Conexión</h1>
      
      <div class="space-y-4">
        <!-- Estado general -->
        <div class="p-4 rounded-lg" :class="overallStatus.bgColor">
          <h2 class="font-bold" :class="overallStatus.textColor">Estado general: {{ overallStatus.text }}</h2>
        </div>
        
        <!-- Controles -->
        <div class="flex space-x-4 mb-6">
          <button 
            @click="runAllTests" 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Probando...</span>
            <span v-else>Probar todo</span>
          </button>
          
          <button 
            @click="resetTests" 
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reiniciar tests
          </button>
        </div>
        
        <!-- Tarjeta de API Base -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 p-3 border-b flex justify-between items-center">
            <h3 class="font-semibold">API Base</h3>
            <button 
              @click="testAPIBase" 
              class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Probar
            </button>
          </div>
          <div class="p-4">
            <p class="text-gray-600 mb-2">URL: {{ apiBaseURL }}</p>
            <p class="text-gray-600 mb-2">Estado: 
              <span 
                :class="testResults.apiBase.color" 
                class="font-semibold"
              >
                {{ testResults.apiBase.text }}
              </span>
            </p>
            <pre v-if="testResults.apiBase.details" class="bg-gray-100 p-2 rounded overflow-auto text-xs mt-2">{{ testResults.apiBase.details }}</pre>
          </div>
        </div>
        
        <!-- Tarjeta de Usuarios -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 p-3 border-b flex justify-between items-center">
            <h3 class="font-semibold">Usuarios API</h3>
            <button 
              @click="testUsers" 
              class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Probar
            </button>
          </div>
          <div class="p-4">
            <p class="text-gray-600 mb-2">URL: {{ apiBaseURL }}/usuarios</p>
            <p class="text-gray-600 mb-2">Estado: 
              <span 
                :class="testResults.users.color" 
                class="font-semibold"
              >
                {{ testResults.users.text }}
              </span>
            </p>
            <pre v-if="testResults.users.details" class="bg-gray-100 p-2 rounded overflow-auto text-xs mt-2">{{ testResults.users.details }}</pre>
          </div>
        </div>
        
        <!-- Tarjeta de Carpetas -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 p-3 border-b flex justify-between items-center">
            <h3 class="font-semibold">Carpetas API</h3>
            <button 
              @click="testFolders" 
              class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Probar
            </button>
          </div>
          <div class="p-4">
            <p class="text-gray-600 mb-2">URL: {{ apiBaseURL }}/carpetas?usuario_id=1</p>
            <p class="text-gray-600 mb-2">Estado: 
              <span 
                :class="testResults.folders.color" 
                class="font-semibold"
              >
                {{ testResults.folders.text }}
              </span>
            </p>
            <pre v-if="testResults.folders.details" class="bg-gray-100 p-2 rounded overflow-auto text-xs mt-2">{{ testResults.folders.details }}</pre>
          </div>
        </div>
        
        <!-- Tarjeta de Pictogramas -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 p-3 border-b flex justify-between items-center">
            <h3 class="font-semibold">Pictogramas POST</h3>
            <div class="flex space-x-2">
              <input
                v-model="testFolderId"
                type="number"
                placeholder="ID de carpeta"
                class="border rounded px-2 py-1 w-24 text-sm"
              />
              <button 
                @click="testPictogramasPost" 
                class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Probar
              </button>
            </div>
          </div>
          <div class="p-4">
            <p class="text-gray-600 mb-2">URL: {{ apiBaseURL }}/pictogramas</p>
            <p class="text-gray-600 mb-2">Estado: 
              <span 
                :class="testResults.pictogramas.color" 
                class="font-semibold"
              >
                {{ testResults.pictogramas.text }}
              </span>
            </p>
            <pre v-if="testResults.pictogramas.details" class="bg-gray-100 p-2 rounded overflow-auto text-xs mt-2">{{ testResults.pictogramas.details }}</pre>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { checkConnection, fetchUsers, fetchFoldersByUser, createPictogram } from '../api';

const apiBaseURL = "https://pb-ykap.onrender.com/index.php";
const isLoading = ref(false);
const testFolderId = ref(1);

const testResults = ref({
  apiBase: { text: 'No probado', color: 'text-gray-500', details: null },
  users: { text: 'No probado', color: 'text-gray-500', details: null },
  folders: { text: 'No probado', color: 'text-gray-500', details: null },
  pictogramas: { text: 'No probado', color: 'text-gray-500', details: null }
});

const overallStatus = computed(() => {
  const results = Object.values(testResults.value);
  
  // Si algún test falló
  if (results.some(r => r.text.includes('Error') || r.text.includes('Falló'))) {
    return {
      text: 'Hay problemas de conexión',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    };
  }
  
  // Si todos los tests fueron exitosos
  if (results.every(r => r.text.includes('Correcto'))) {
    return {
      text: 'Todos los tests pasaron correctamente',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    };
  }
  
  // Estado parcial o no probado
  return {
    text: 'Algunos tests pendientes',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  };
});

async function testAPIBase() {
  try {
    testResults.value.apiBase = { text: 'Probando...', color: 'text-blue-500', details: null };
    
    const result = await checkConnection();
    
    if (result.connected) {
      testResults.value.apiBase = { 
        text: 'Correcto', 
        color: 'text-green-600',
        details: `Status: ${result.status}\nStatusText: ${result.statusText}`
      };
    } else {
      testResults.value.apiBase = { 
        text: 'Falló', 
        color: 'text-red-600',
        details: result.error || 'No se pudo conectar al API'
      };
    }
  } catch (error) {
    testResults.value.apiBase = { 
      text: 'Error', 
      color: 'text-red-600', 
      details: error.toString()
    };
  }
}

async function testUsers() {
  try {
    testResults.value.users = { text: 'Probando...', color: 'text-blue-500', details: null };
    
    const users = await fetchUsers();
    
    if (Array.isArray(users)) {
      testResults.value.users = { 
        text: 'Correcto', 
        color: 'text-green-600',
        details: `Se encontraron ${users.length} usuarios\n${JSON.stringify(users.slice(0, 2), null, 2)}${users.length > 2 ? '...' : ''}`
      };
    } else if (users.message) {
      testResults.value.users = { 
        text: users.message.includes('No se encontraron') ? 'Sin datos' : 'Error',
        color: users.message.includes('No se encontraron') ? 'text-yellow-600' : 'text-red-600',
        details: users.message
      };
    } else {
      testResults.value.users = { 
        text: 'Respuesta inesperada', 
        color: 'text-yellow-600',
        details: JSON.stringify(users, null, 2)
      };
    }
  } catch (error) {
    testResults.value.users = { 
      text: 'Error', 
      color: 'text-red-600', 
      details: error.toString()
    };
  }
}

async function testFolders() {
  try {
    testResults.value.folders = { text: 'Probando...', color: 'text-blue-500', details: null };
    
    const folders = await fetchFoldersByUser(1);
    
    if (Array.isArray(folders)) {
      testResults.value.folders = { 
        text: 'Correcto', 
        color: 'text-green-600',
        details: `Se encontraron ${folders.length} carpetas\n${JSON.stringify(folders.slice(0, 2), null, 2)}${folders.length > 2 ? '...' : ''}`
      };
    } else if (folders.message) {
      testResults.value.folders = { 
        text: folders.message.includes('No se encontraron') ? 'Sin datos' : 'Error',
        color: folders.message.includes('No se encontraron') ? 'text-yellow-600' : 'text-red-600',
        details: folders.message
      };
    } else {
      testResults.value.folders = { 
        text: 'Respuesta inesperada', 
        color: 'text-yellow-600',
        details: JSON.stringify(folders, null, 2)
      };
    }
  } catch (error) {
    testResults.value.folders = { 
      text: 'Error', 
      color: 'text-red-600', 
      details: error.toString()
    };
  }
}

async function testPictogramasPost() {
  try {
    testResults.value.pictogramas = { text: 'Probando...', color: 'text-blue-500', details: null };
    
    // Crear un pictograma de prueba pequeño
    const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const response = await createPictogram(
      testFolderId.value, 
      "Test desde diagnóstico", 
      testImage
    );
    
    if (response.id) {
      testResults.value.pictogramas = { 
        text: 'Correcto', 
        color: 'text-green-600',
        details: `Pictograma creado con ID: ${response.id}\n${JSON.stringify(response, null, 2)}`
      };
    } else if (response.message) {
      testResults.value.pictogramas = { 
        text: response.message.includes('creado') ? 'Correcto' : 'Error',
        color: response.message.includes('creado') ? 'text-green-600' : 'text-red-600',
        details: response.message
      };
    } else {
      testResults.value.pictogramas = { 
        text: 'Respuesta inesperada', 
        color: 'text-yellow-600',
        details: JSON.stringify(response, null, 2)
      };
    }
  } catch (error) {
    testResults.value.pictogramas = { 
      text: 'Error', 
      color: 'text-red-600', 
      details: error.toString()
    };
  }
}

async function runAllTests() {
  isLoading.value = true;
  
  try {
    await testAPIBase();
    await testUsers();
    await testFolders();
    
    // Solo probar pictogramas si hay una carpeta válida
    if (testFolderId.value) {
      await testPictogramasPost();
    }
  } finally {
    isLoading.value = false;
  }
}

function resetTests() {
  testResults.value = {
    apiBase: { text: 'No probado', color: 'text-gray-500', details: null },
    users: { text: 'No probado', color: 'text-gray-500', details: null },
    folders: { text: 'No probado', color: 'text-gray-500', details: null },
    pictogramas: { text: 'No probado', color: 'text-gray-500', details: null }
  };
}
</script>
