import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem } from '@mui/material';
import type { EditDialogProps } from './types';

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, onSave, pripad, banky, themeMode }) => {
  const [klient, setKlient] = useState(pripad?.klient || '');
  const [poradce, setPoradce] = useState(pripad?.poradce || '');
  const [co, setCo] = useState(pripad?.krok1?.co || '');
  const [castka, setCastka] = useState(pripad?.krok1?.castka || '');
  const [popis, setPopis] = useState(pripad?.krok1?.popis || '');
  const [termin, setTermin] = useState(pripad?.krok2?.termin || '');
  const [urok, setUrok] = useState(pripad?.krok2?.urok || '');
  const [banka, setBanka] = useState(pripad?.krok3?.banka || '');
  const [vlastniBanka, setVlastniBanka] = useState('');
  const [poznamka, setPoznamka] = useState(pripad?.poznamka || '');

  const handleSave = () => {
    onSave({ klient, poradce, co, castka, popis, termin, urok, banka: banka === 'Další (ručně)' ? vlastniBanka : banka, poznamka });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backdropFilter: 'blur(12px)',
          background: themeMode === 'dark' ? 'rgba(30,34,44,0.97)' : 'rgba(255,255,255,0.97)',
          boxShadow: '0 8px 32px #1976d244',
        },
      }}
    >
      <DialogTitle>Upravit případ</DialogTitle>
      <DialogContent>
        <TextField label="Klient" value={klient} onChange={e => setKlient(e.target.value)} fullWidth margin="normal" />
        <TextField label="Poradce" value={poradce} onChange={e => setPoradce(e.target.value)} fullWidth margin="normal" />
        <TextField label="Co financuje" value={co} onChange={e => setCo(e.target.value)} fullWidth margin="normal" />
        <TextField label="Částka" value={castka} onChange={e => setCastka(e.target.value)} fullWidth margin="normal" type="number" />
        <TextField label="Popis" value={popis} onChange={e => setPopis(e.target.value)} fullWidth margin="normal" />
        <TextField label="Termín" value={termin} onChange={e => setTermin(e.target.value)} fullWidth margin="normal" type="date" InputLabelProps={{ shrink: true }} />
        <TextField label="Úrok" value={urok} onChange={e => setUrok(e.target.value)} fullWidth margin="normal" type="number" />
        <Select value={banka} onChange={e => setBanka(e.target.value as string)} fullWidth displayEmpty sx={{ mt: 2 }}>
          <MenuItem value="" disabled>Vyberte banku</MenuItem>
          {banky.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </Select>
        {banka === 'Další (ručně)' && (
          <TextField label="Vlastní banka" value={vlastniBanka} onChange={e => setVlastniBanka(e.target.value)} fullWidth margin="normal" />
        )}
        <TextField label="Poznámka" value={poznamka} onChange={e => setPoznamka(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Zrušit</Button>
        <Button onClick={handleSave} color="primary" variant="contained">Uložit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(EditDialog);
