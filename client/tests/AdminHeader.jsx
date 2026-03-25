import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminHeader from '../src/components/AdminHeader.jsx';

// Mock de localStorage sert a tester
const localStorageMock = (() => {
    let store = {};
  
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  describe('AdminHeader', () => {
    beforeEach(() => {
      // Remplacer localStorage par le mock avant chaque test
      global.localStorage = localStorageMock;
      // Simuler un token dans localStorage (pour simuler un utilisateur connecté)
      localStorage.setItem('token', 'fake-token');
    });
  
    afterEach(() => {
      // Nettoyer localStorage après chaque test
      localStorage.clear();
    });
  
    it('affiche le titre et le bouton de déconnexion', () => {
      render(
        <MemoryRouter>
          <AdminHeader />
        </MemoryRouter>
      );
  
      // Vérifie que le titre est affiché
      expect(screen.getByText('Panneau d\'administration')).toBeInTheDocument();
  
      // Vérifie que le bouton de déconnexion est présent
      expect(screen.getByTestId('admin-logout-button')).toBeInTheDocument();
      expect(screen.getByText('Déconnexion')).toBeInTheDocument();
    });
  
    it('supprime le token et redirige vers la page de connexion après déconnexion', () => {
      // Mock de useNavigate pour vérifier la redirection
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });
  
      render(
        <MemoryRouter>
          <AdminHeader />
        </MemoryRouter>
      );
  
      // Vérifie que localStorage contient un token avant déconnexion
      expect(localStorage.getItem('token')).toBe('fake-token');
  
      // Simule un clic sur le bouton de déconnexion
      fireEvent.click(screen.getByTestId('admin-logout-button'));
  
      // Vérifie que le token a été supprimé de localStorage
      expect(localStorage.getItem('token')).toBeNull();
  
      // Vérifie que la fonction de redirection a été appelée avec le bon chemin
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });