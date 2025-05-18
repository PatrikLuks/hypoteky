import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip, Avatar, Button } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { useTranslation } from 'react-i18next';
import type { PripadCardProps } from './types';

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const PripadCard: React.FC<PripadCardProps> = React.memo(({ pripad, KROKY, onEdit, onDelete, onArchive, onUnarchive, onShowWorkflow }) => {
  const { t } = useTranslation();
  const controls = useAnimation();

  // Klávesové zkratky: Enter pro editaci, W pro workflow
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onEdit(pripad);
      if (e.key.toLowerCase() === 'w') onShowWorkflow(pripad.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pripad, onEdit, onShowWorkflow]);

  const handleSwipedLeft = () => {
    controls.start({ x: -120, opacity: 0.5 }).then(() => {
      if (pripad.archivovano) return; // nearchivovat už archivované
      onArchive(pripad.id);
      controls.set({ x: 0, opacity: 1 });
    });
  };
  const handleSwipedRight = () => {
    controls.start({ x: 120, opacity: 0.5 }).then(() => {
      if (pripad.archivovano) onUnarchive(pripad.id);
      else onDelete(pripad.id);
      controls.set({ x: 0, opacity: 1 });
    });
  };
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipedLeft,
    onSwipedRight: handleSwipedRight,
    delta: 60,
    trackTouch: true,
    trackMouse: false
  });

  return (
    <motion.div {...(isTouchDevice ? swipeHandlers : {})} animate={controls} role="region" aria-label={t('client') + ': ' + pripad.klient}>
      <Card elevation={4} sx={{ borderRadius: 5, backdropFilter: 'blur(8px)', background: pripad.archivovano ? 'rgba(240,240,240,0.7)' : 'rgba(255,255,255,0.85)', mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40, fontWeight: 700 }}>{pripad.poradce?.[0] || '?'}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{pripad.klient}</Typography>
              <Typography variant="body2" color="text.secondary">{t('advisor')}: {pripad.poradce}</Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                {t('current.step')}: {KROKY[pripad.aktualniKrok + 3] || '-'}
              </Typography>
            </Box>
            <Tooltip title={t('edit.case')} arrow>
              <span>
                <IconButton color="primary" onClick={() => onEdit(pripad)} aria-label={t('edit.case')} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                  <motion.span whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }} style={{ display: 'inline-flex' }}>
                    <EditIcon />
                  </motion.span>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('delete.case')} arrow>
              <span>
                <IconButton color="error" onClick={() => onDelete(pripad.id)} aria-label={t('delete.case')} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                  <motion.span whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }} style={{ display: 'inline-flex' }}>
                    <DeleteIcon />
                  </motion.span>
                </IconButton>
              </span>
            </Tooltip>
            {pripad.archivovano ? (
              <Tooltip title={t('unarchive.case')} arrow>
                <span>
                  <IconButton color="primary" onClick={() => onUnarchive(pripad.id)} aria-label={t('unarchive.case')} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                    <UnarchiveIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={t('archive.case')} arrow>
                <span>
                  <IconButton color="secondary" onClick={() => onArchive(pripad.id)} aria-label={t('archive.case')} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                    <ArchiveIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
          {/* Další obsah karty zde... */}
          <Button onClick={() => onShowWorkflow(pripad.id)} color="primary" size="small" sx={{ mt: 1 }} aria-label={t('workflow.title')}>{t('workflow.title')}</Button>
          {isTouchDevice && (
            <Box sx={{mt:1, fontSize:'0.95em', color:'#888', textAlign:'center'}}>
              <span style={{marginRight:8}}>{t('swipe.left')}</span>
              <span>{t('swipe.right', { action: pripad.archivovano ? t('unarchive.case') : t('delete.case') })}</span>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default PripadCard;
