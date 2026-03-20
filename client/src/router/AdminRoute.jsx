import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function getRoleFromToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, token } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user?.role ?? getRoleFromToken(token);
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
