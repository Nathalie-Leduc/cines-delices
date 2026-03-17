import AdminLayout from '../Layouts/AdminLayout';
const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'recipes', element: <AdminMesRecettesPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'users', element: <AdminMembrePage /> },
    ],
  },
]);
