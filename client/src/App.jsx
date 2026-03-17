import { Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout/AdminLayout.jsx';
import MembreLayout from './layouts/MemberLayout/MemberLayout.jsx';
import PublicLayout from './layouts/PublicLayout/PublicLayout.jsx';
import Home from './pages/Home/Home.jsx';
import Membre from './pages/MemberInterface/MemberInterface.jsx';
import MesRecettes from './pages/MemberRecipes/MemberRecipes.jsx';
import Profil from './pages/MemberProfile/MemberProfile.jsx';
import Recipes from './pages/Recipes/Recipes.jsx';
import Movies from './pages/Movies/Movies.jsx';
import Series from './pages/Series/Series.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Login from './pages/Login/Login.jsx';
import ProtectedRoute from './router/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Layout public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/films" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/contact" element={<Contact />} />
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
      </Route>
      <Route path="/admin/*" element={<AdminLayout />} />
    </Routes>
  );
}

export default App;