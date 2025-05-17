import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditDialog from './EditDialog';

describe('EditDialog', () => {
  it('zobrazí dialog a validuje vstupy', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(
      <EditDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
        banky={['Banka1', 'Banka2']}
        themeMode="light"
      />
    );
    expect(screen.getByText('Upravit případ')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Uložit'));
    expect(onSave).not.toHaveBeenCalled(); // validace zabrání prázdnému save
  });
});
