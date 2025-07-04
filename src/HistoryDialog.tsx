import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import HistoryIcon from '@mui/icons-material/History';
import type { HistoryDialogProps } from './types';
import { useTranslation } from 'react-i18next';

const HistoryDialog: React.FC<HistoryDialogProps> = ({ open, onClose, krok, themeMode }) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          backdropFilter: 'blur(12px)',
          background: themeMode === 'dark' ? 'rgba(30,34,44,0.97)' : 'rgba(255,255,255,0.97)',
          boxShadow: '0 8px 32px #1976d244',
        },
        role: 'dialog',
        'aria-modal': true,
        'aria-label': t('history.aria'),
      }}
      tabIndex={-1}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }} tabIndex={0} aria-label={t('history.title')}>
        <HistoryIcon color="secondary" sx={{ mr: 1 }} />
        {t('history.title')}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 260 }}>
        {krok?.historie && krok.historie.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {krok.historie.map((z, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                style={{ background: '#f5f5fa', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px #1976d211' }}
                aria-label={t('history.change') + ' ' + (idx + 1)}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{z.kdo}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(z.kdy).toLocaleString('cs-CZ')}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{z.zmena}</Typography>
              </motion.div>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('history.empty')}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" aria-label={t('close')} autoFocus>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(HistoryDialog);
