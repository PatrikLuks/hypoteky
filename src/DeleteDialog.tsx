import React from 'react';
import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material';
import type { DeleteDialogProps } from './types';
import { useTranslation } from 'react-i18next';

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, onDelete, themeMode }) => {
  const { t } = useTranslation();
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open && deleteButtonRef.current) {
      deleteButtonRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onDelete, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          background: themeMode === 'dark' ? 'rgba(30,34,44,0.97)' : 'rgba(255,255,255,0.97)',
        },
        role: 'alertdialog',
        'aria-modal': true,
        'aria-label': t('delete.confirm.aria'),
      }}
    >
      <DialogTitle tabIndex={0}>{t('delete.confirm')}</DialogTitle>
      <DialogActions>
        <Button onClick={onClose} color="secondary" aria-label={t('cancel')}>{t('cancel')}</Button>
        <Button onClick={onDelete} color="error" variant="contained" ref={deleteButtonRef} aria-label={t('delete.case')} autoFocus>{t('delete.case')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(DeleteDialog);
