import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../Layouts/AdminLayout';
import Dashboard from '../pages/Admin/Dashboard.jsx';
import Recettes from '../pages/Admin/Recettes.jsx';
import Categories from '../pages/Admin/Categories.jsx';
import Utilisateurs from '../pages/Admin/Utilisateurs.jsx';

const adminRouter = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'recettes', element: <Recettes /> },
      { path: 'categories', element: <Categories /> },
      { path: 'utilisateurs', element: <Utilisateurs /> },
    ],
  },
]);

export default adminRouter;
