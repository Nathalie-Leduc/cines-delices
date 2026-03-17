import { Route, Routes } from 'react-router-dom';
import AdminLayout from './Layouts/AdminLayout';
import MembreLayout from './Layouts/MemberLayout';
import PublicLayout from './Layouts/PublicLayout';
import Home from './pages/Home';
import Membre from './pages/MemberInterface';
import MesRecettes from './pages/MemberRecipes';
import Profil from './pages/MemberProfile';
import CreateRecipe from './pages/CreateRecipe';
import RecipesPage from './pages/RecipesPage/RecipesPage.jsx';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Contact from './pages/Contact';
import MentionsLegales from './pages/MentionsLegales/MentionsLegales.jsx';
import Login from './pages/Login';
import Dashboard from './pages/Admin/Dashboard.jsx';
import Recettes from './pages/Admin/Recettes.jsx';
import Categories from './pages/Admin/Categories.jsx';
import Utilisateurs from './pages/Admin/Utilisateurs.jsx';
import ProtectedRoute from './router/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Layout public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/films" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Layout membre (protégé) */}
      <Route
        path="/membre/*"
        element={
          <ProtectedRoute>
            <MembreLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Membre />} />
        <Route path="profil" element={<Profil />} />
        <Route path="mes-recettes" element={<MesRecettes />} />
        <Route path="creer-recette" element={<CreateRecipe />} />
      </Route>
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="recettes" element={<Recettes />} />
        <Route path="categories" element={<Categories />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
      </Route>
    </Routes>
  );
}

export default App;
