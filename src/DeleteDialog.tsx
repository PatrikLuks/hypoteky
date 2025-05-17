import React from 'react';
import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material';
import type { DeleteDialogProps } from './types';

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, onDelete, themeMode }) => (
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
      'aria-label': 'Potvrzení smazání',
    }}
  >
    <DialogTitle>Opravdu smazat případ?</DialogTitle>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Zrušit</Button>
      <Button onClick={onDelete} color="error" variant="contained">Smazat</Button>
    </DialogActions>
  </Dialog>
);

export default React.memo(DeleteDialog);
