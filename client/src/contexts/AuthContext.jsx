import { createContext, useContext, useMemo, useState } from 'react';

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'auth_user';

const AuthContext = createContext(null);

function isJwtValid(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return false;
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const parts = token.split('.');

  if (parts.length !== 3) {
    return false;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));

    if (!payload?.exp || typeof payload.exp !== 'number') {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch {
    return false;
  }
}

function getInitialAuthState() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!isJwtValid(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return { token: null, user: null, isAuthenticated: false };
  }

  let user = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  return { token, user, isAuthenticated: true };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);

  const login = ({ token, user = null }) => {
    const normalizedToken = token?.startsWith('Bearer ') ? token.slice(7) : token;

    if (!normalizedToken || !isJwtValid(normalizedToken)) {
      throw new Error('Token invalide ou expiré');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, normalizedToken);

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }

    setAuthState({ token: normalizedToken, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  const value = useMemo(() => {
    return {
      ...authState,
      login,
      logout,
    };
  }, [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit etre utilise dans AuthProvider');
  }

  return context;
}
