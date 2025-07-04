import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import type { WorkflowDialogProps } from './types';
import { useTranslation } from 'react-i18next';

const WorkflowDialog: React.FC<WorkflowDialogProps> = ({ open, onClose, pripad, themeMode }) => {
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
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          position: 'fixed',
          m: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          background: themeMode === 'dark' ? 'rgba(30,34,44,0.97)' : 'rgba(255,255,255,0.97)',
          boxShadow: '0 -8px 32px #1976d244',
          minHeight: '40vh',
          maxHeight: '80vh',
          overflow: 'auto',
          touchAction: 'pan-y',
        },
        role: 'dialog',
        'aria-modal': true,
        'aria-label': t('workflow.aria'),
      }}
      tabIndex={-1}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }} tabIndex={0} aria-label={t('workflow.title')}>
        {t('workflow.title')}
      </DialogTitle>
      <DialogContent>
        {pripad && (
          <Stepper activeStep={pripad.aktualniKrok} orientation="vertical" sx={{ background: 'none' }}>
            {pripad.kroky.map((krok, idx) => (
              <Step key={idx} completed={krok.splneno} aria-label={krok.nazev}>
                <StepLabel>{krok.nazev}</StepLabel>
                <StepContent>
                  {/* ...další obsah kroku lze doplnit zde... */}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" aria-label={t('close')} autoFocus>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(WorkflowDialog);
