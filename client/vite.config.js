import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '/src': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Découpe le bundle en chunks thématiques
    // Analogie : au lieu d'un seul gros livre, on a des fascicules —
    // le visiteur ne télécharge que le fascicule de la page qu'il visite.
    rollupOptions: {
      output: {
        manualChunks: {
          // Librairies React — chargées sur toutes les pages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Pages admin — chargées uniquement par les admins
          'chunk-admin': [
            './src/pages/Admin/Dashboard.jsx',
            './src/pages/Admin/Recettes.jsx',
            './src/pages/Admin/Categories.jsx',
            './src/pages/Admin/Utilisateurs.jsx',
            './src/pages/Admin/AdminIngredients.jsx',
            './src/pages/Admin/IngredientsValidation.jsx',
            './src/pages/Admin/AdminNotifications.jsx',
            './src/pages/Admin/AdminIngredientRecipes.jsx',
            './src/pages/Admin/AdminCategoryRecipes.jsx',
          ],
          // Pages membre — chargées uniquement par les membres connectés
          'chunk-member': [
            './src/pages/MemberRecipes/MemberRecipes.jsx',
            './src/pages/MemberProfile/MemberProfile.jsx',
            './src/pages/MemberContact/MemberContact.jsx',
            './src/pages/MemberInterface/MemberInterface.jsx',
            './src/pages/CreateRecipe/CreateRecipe.jsx',
          ],
          // Pages légales — rarement visitées
          'chunk-legal': [
            './src/pages/MentionsLegales/MentionsLegales.jsx',
            './src/pages/PolitiqueConfidentialite/PolitiqueConfidentialite.jsx',
            './src/pages/PolitiqueCookies/PolitiqueCookies.jsx',
            './src/pages/ReglesModeration/ReglesModerations.jsx',
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    env: {
      VITE_API_URL: 'http://localhost:3000',
    },
  },
});
