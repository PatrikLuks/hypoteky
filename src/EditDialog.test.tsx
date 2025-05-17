import { render, screen, fireEvent } from '@testing-library/react';
import EditDialog from './EditDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

describe('EditDialog', () => {
  it('zobrazí dialog a validuje vstupy', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <EditDialog
          open={true}
          onClose={onClose}
          onSave={onSave}
          banky={['Banka1', 'Banka2']}
          themeMode="light"
        />
      </I18nextProvider>
    );
    expect(screen.getByText(i18n.t('edit.case'))).toBeInTheDocument();
    fireEvent.click(screen.getByText(i18n.t('save')));
    expect(onSave).not.toHaveBeenCalled(); // validace zabrání prázdnému save
  });
});
