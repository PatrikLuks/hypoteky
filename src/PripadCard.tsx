import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip, Avatar, Button } from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import type { PripadCardProps } from './types';

const PripadCard: React.FC<PripadCardProps> = React.memo(({ pripad, onEdit, onDelete, onArchive, onUnarchive, onShowWorkflow }) => (
  <Card elevation={4} sx={{ borderRadius: 5, backdropFilter: 'blur(8px)', background: pripad.archivovano ? 'rgba(240,240,240,0.7)' : 'rgba(255,255,255,0.85)', mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40, fontWeight: 700 }}>{pripad.poradce?.[0] || '?'}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{pripad.klient}</Typography>
          <Typography variant="body2" color="text.secondary">Poradce: {pripad.poradce}</Typography>
        </Box>
        <Tooltip title="Upravit případ" arrow>
          <span>
            <IconButton color="primary" onClick={() => onEdit(pripad)} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
              <motion.span whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }} style={{ display: 'inline-flex' }}>
                <EditIcon />
              </motion.span>
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Smazat případ" arrow>
          <span>
            <IconButton color="error" onClick={() => onDelete(pripad.id)} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
              <motion.span whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }} style={{ display: 'inline-flex' }}>
                <DeleteIcon />
              </motion.span>
            </IconButton>
          </span>
        </Tooltip>
        {pripad.archivovano ? (
          <Tooltip title="Obnovit případ" arrow>
            <span>
              <IconButton color="primary" onClick={() => onUnarchive(pripad.id)} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                <UnarchiveIcon />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Archivovat případ" arrow>
            <span>
              <IconButton color="secondary" onClick={() => onArchive(pripad.id)} component={motion.button} whileHover={{ scale: 1.2, rotate: 8 }} whileTap={{ scale: 0.95, rotate: -8 }}>
                <ArchiveIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
      {/* Další obsah karty zde... */}
      <Button onClick={() => onShowWorkflow(pripad.id)} color="primary" size="small" sx={{ mt: 1 }}>Workflow</Button>
    </CardContent>
  </Card>
));

export default PripadCard;
