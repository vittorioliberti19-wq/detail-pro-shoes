import {defineConfig} from 'vite';

// three.js sale en su propio chunk: el navegador lo cachea entre despliegues
// y deja de mezclarse con el código de la página.
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {three: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/environments/RoomEnvironment.js']}
      }
    }
  }
});
