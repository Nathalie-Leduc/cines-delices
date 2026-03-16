import { Route, Routes } from 'react-router-dom';
import MembreLayout from './components/membre/MembreLayout.jsx';
import PublicLayout from './layouts/PublicLayout/PublicLayout.jsx';
import Home from './pages/Home/Home.jsx';
import Membre from './pages/Membre/Membre.jsx';
import MesRecettes from './pages/Membre/MesRecettes.jsx';
import Profil from './pages/Membre/Profil.jsx';
import ProtectedRoute from './router/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route
        path="/membre"
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
    </Routes>
  );
}

export default App;