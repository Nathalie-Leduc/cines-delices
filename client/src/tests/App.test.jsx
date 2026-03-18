import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

vi.mock('../services/mediaService', () => ({
  fetchMedia: vi.fn(() => new Promise(() => {})),
}));

describe('App', () => {
  it("affiche le titre de la page d'accueil", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'CinéDélices' })).toBeInTheDocument();
  });
});
