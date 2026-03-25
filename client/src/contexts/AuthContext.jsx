// 🔧 MODIF : ajout de useCallback dans les imports
//    Avant  : import { createContext, useContext, useMemo, useState } from 'react';
//    Après  : on ajoute useCallback pour stabiliser login/logout

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'auth_user';
const DISPLAY_NAME_KEY = 'displayName';

const AuthContext = createContext(null);

function decodeJwtPayload(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isJwtValid(rawToken) {
  const payload = decodeJwtPayload(rawToken);

  if (!payload?.exp || typeof payload.exp !== 'number') {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowInSeconds;
}

function getInitialAuthState() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!isJwtValid(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(DISPLAY_NAME_KEY);
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

function normalizeDisplayName(user) {
  const rawValue = typeof user?.prenom === 'string' && user.prenom.trim()
    ? user.prenom
    : typeof user?.pseudo === 'string' && user.pseudo.trim()
      ? user.pseudo
      : typeof user?.name === 'string' && user.name.trim()
        ? user.name
        : '';

  const trimmed = String(rawValue || '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// ──────────────────────────────────────────────────────────────────────
  //  MODIF : login enveloppé dans useCallback
  //
  //  Pourquoi ? Avant, login était une simple fonction recréée à chaque
  //  render du composant. Le useMemo qui construit `value` ne listait
  //  que [authState] en dépendance, donc il pouvait capturer une
  //  "vieille copie" de login/logout (closure périmée).
  //  useCallback garantit que la référence reste stable
  //  [] = pas de dépendances car on utilise setAuthState (stable par
  //  défaut dans React) et les fonctions utilitaires sont définies
  //  en dehors du composant.

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);

  const login = useCallback(({ token, user = null }) => {
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

    const displayName = normalizeDisplayName(user);
    if (displayName) {
      localStorage.setItem(DISPLAY_NAME_KEY, displayName);
    } else {
      localStorage.removeItem(DISPLAY_NAME_KEY);
    }

    window.dispatchEvent(new Event('user-display-name-updated'));
    setAuthState({ token: normalizedToken, user, isAuthenticated: true });
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  //  MODIF : logout enveloppé dans useCallback
  //
  //  Même raison que login : on stabilise la référence pour que le
  //  useMemo ci-dessous ne capture jamais une version périmée.
  // ──────────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(DISPLAY_NAME_KEY);
    window.dispatchEvent(new Event('user-display-name-updated'));
    setAuthState({ token: null, user: null, isAuthenticated: false });
   }, []);

  const value = useMemo(() => {
    const tokenPayload = decodeJwtPayload(authState.token);
    const role = authState.user?.role ?? tokenPayload?.role ?? null;

    return {
      ...authState,
      role,
      isAdmin: String(role).toUpperCase() === 'ADMIN',
      login,
      logout,
    };
  }, [authState, login, logout]);

// 🔧 MODIF : ajout de login et logout dans les dépendances du useMemo
  //    Avant  : [authState]
  //    Après  : [authState, login, logout]
  //    Grâce au useCallback, ces références sont stables donc le useMemo
  //    ne se recalcule pas inutilement, mais il a toujours la bonne version.
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit etre utilise dans AuthProvider');
  }

  return context;
}
