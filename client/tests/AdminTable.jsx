import { render, screen } from '@testing-library/react';
import AdminTable from './AdminTable';

describe('AdminTable', () => {
  it('affiche les colonnes et données', () => {
    const columns = ['id', 'title'];
    const data = [{ id: 1, title: 'Ratatouille' }];
    render(<AdminTable columns={columns} data={data} />);
    expect(screen.getByText('Ratatouille')).toBeInTheDocument();
  });
});
