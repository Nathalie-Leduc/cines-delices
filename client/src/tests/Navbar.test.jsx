import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';

const useAuthMock = vi.fn();

vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../services/recipesService', () => ({
  getRecipesCatalog: vi.fn(),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche la navigation publique pour un visiteur', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
    });

    renderNavbar();

    expect(screen.getAllByText('Accueil').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Recettes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Film').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Série').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Se connecter').length).toBeGreaterThan(0);
    expect(screen.queryByText('Mon espace')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('bascule sur la navigation membre après connexion', () => {
    useAuthMock.mockReturnValue({
      user: { prenom: 'nora', role: 'MEMBER' },
      isAuthenticated: true,
      isAdmin: false,
      logout: vi.fn(),
    });

    renderNavbar();

    expect(screen.getAllByText('Mon espace').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mes recettes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Créer une recette').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Profil').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Espace membre').length).toBeGreaterThan(0);
    expect(screen.queryByText('Accueil')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('bascule sur la navigation admin pour un administrateur connecté', () => {
    useAuthMock.mockReturnValue({
      user: { prenom: 'jade', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    });

    renderNavbar();

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Utilisateurs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Catégories').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Validation').length).toBeGreaterThan(0);
    expect(screen.getByText('Bonjour,')).toBeInTheDocument();
    expect(screen.getByText('Jade')).toBeInTheDocument();
    expect(screen.queryByText('Espace admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Accueil')).not.toBeInTheDocument();
    expect(screen.queryByText('Mon espace')).not.toBeInTheDocument();
  });
});
