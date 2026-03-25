import { Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import MemberInterface from './pages/MemberInterface';
import MemberRecipes from './pages/MemberRecipes';
import MemberProfile from './pages/MemberProfile';
import CreateRecipe from './pages/CreateRecipe';
import RecipesPage from './pages/RecipesPage';
import RecipeDetail from "./pages/RecipeDetail";
import Movies from './pages/Movies';
import Series from './pages/Series';
import Contact from './pages/Contact';
import MentionsLegales from './pages/MentionsLegales';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Dashboard, Recettes, Categories, Utilisateurs, IngredientsValidation } from './pages/Admin';
import ProtectedRoute from './router';
import AdminRoute from './router/AdminRoute.jsx';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:slug" element={<RecipeDetail />} />
        <Route path="/films" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route
        path="/membre/*"
        element={
          <ProtectedRoute>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberInterface />} />
        <Route path="profil" element={<MemberProfile />} />
        <Route path="mes-recettes" element={<MemberRecipes />} />
        <Route path="creer-recette" element={<CreateRecipe />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Recettes />} />
          <Route path="recettes" element={<Recettes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="validation-recettes" element={<Dashboard />} />
          <Route path="validation-ingredients" element={<IngredientsValidation />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
