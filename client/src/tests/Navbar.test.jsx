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

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recettes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Film' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Série' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('conserve la navigation desktop publique pour un membre connecté', () => {
    useAuthMock.mockReturnValue({
      user: { prenom: 'nora', role: 'MEMBER' },
      isAuthenticated: true,
      isAdmin: false,
      logout: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recettes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Film' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Série' })).toBeInTheDocument();
    expect(screen.getAllByText('Bonjour,').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nora').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('conserve la navigation desktop publique pour un administrateur connecté', () => {
    useAuthMock.mockReturnValue({
      user: { prenom: 'jade', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recettes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Film' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Série' })).toBeInTheDocument();
    expect(screen.getAllByText('Bonjour,').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jade').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
