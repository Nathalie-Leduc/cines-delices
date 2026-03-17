import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

describe('App', () => {
  it("affiche le titre de la page d'accueil", () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    /*//expect(screen.getByRole('heading', { name: 'CinéDélices' })).toBeInTheDocument();
     // Vérifier qu'il y a au moins un <h1> avec "CinéDélices"
     const headings = screen.getAllByRole('heading', { name: 'CinéDélices' });
     expect(headings.length).toBeGreaterThan(0);*/
     
    // Vérifiez que "CinéDélices" est affiché
    expect(screen.getByRole('heading', { name: 'CinéDélices' })).toBeInTheDocument();
  });
});


