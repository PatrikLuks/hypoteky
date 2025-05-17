import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, Box, Typography } from '@mui/material';
import type { EditDialogProps } from './types';
import type { Attachment } from './types';
import { undoPripad, redoPripad } from './utils';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, onSave, pripad, banky, themeMode }) => {
  const { t } = useTranslation();
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
  const [attachments, setAttachments] = useState<Attachment[]>(pripad?.kroky?.[0]?.attachments || []);
  const [errors, setErrors] = useState({
    klient: '',
    poradce: '',
    co: '',
    castka: '',
    termin: '',
    urok: '',
    banka: '',
  });

  const validate = () => {
    const newErrors: typeof errors = {
      klient: klient.trim() ? '' : t('validation.client'),
      poradce: poradce.trim() ? '' : t('validation.advisor'),
      co: co.trim() ? '' : t('validation.what'),
      castka: !castka.trim() ? t('validation.amount') : isNaN(Number(castka)) || Number(castka) <= 0 ? t('validation.amount.valid') : '',
      termin: termin ? '' : t('validation.deadline'),
      urok: !urok.trim() ? t('validation.interest') : isNaN(Number(urok)) || Number(urok) <= 0 ? t('validation.interest.valid') : '',
      banka: banka ? '' : t('validation.bank'),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(e => !e);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAttachments = files.map(file => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  // Drag&drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const newAttachments = files.map(file => {
        const url = URL.createObjectURL(file);
        return {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: file.type,
          url
        };
      });
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ klient, poradce, co, castka, popis, termin, urok, banka: banka === 'Další (ručně)' ? vlastniBanka : banka, poznamka, attachments });
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
      <DialogTitle>{t('edit.case')}</DialogTitle>
      <DialogContent>
        <TextField label={t('client')} value={klient} onChange={e => setKlient(e.target.value)} fullWidth margin="normal" error={!!errors.klient} helperText={errors.klient} />
        <TextField label={t('advisor')} value={poradce} onChange={e => setPoradce(e.target.value)} fullWidth margin="normal" error={!!errors.poradce} helperText={errors.poradce} />
        <TextField label={t('what')} value={co} onChange={e => setCo(e.target.value)} fullWidth margin="normal" error={!!errors.co} helperText={errors.co} />
        <TextField label={t('amount')} value={castka} onChange={e => setCastka(e.target.value)} fullWidth margin="normal" type="number" error={!!errors.castka} helperText={errors.castka} />
        <TextField label={t('description')} value={popis} onChange={e => setPopis(e.target.value)} fullWidth margin="normal" />
        <TextField label={t('deadline')} value={termin} onChange={e => setTermin(e.target.value)} fullWidth margin="normal" type="date" InputLabelProps={{ shrink: true }} error={!!errors.termin} helperText={errors.termin} />
        <TextField label={t('interest')} value={urok} onChange={e => setUrok(e.target.value)} fullWidth margin="normal" type="number" error={!!errors.urok} helperText={errors.urok} />
        <Select value={banka} onChange={e => setBanka(e.target.value as string)} fullWidth displayEmpty sx={{ mt: 2 }} error={!!errors.banka}>
          <MenuItem value="" disabled>{t('validation.bank.select')}</MenuItem>
          {banky.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </Select>
        {banka === 'Další (ručně)' && (
          <TextField label={t('custom.bank')} value={vlastniBanka} onChange={e => setVlastniBanka(e.target.value)} fullWidth margin="normal" />
        )}
        <TextField label={t('note')} value={poznamka} onChange={e => setPoznamka(e.target.value)} fullWidth margin="normal" multiline minRows={2} />
        <Box sx={{mt:2}}>
          <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>{t('attachments')}</Typography>
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{border:'2px dashed #aaa',borderRadius:2,p:2,mb:2,textAlign:'center',background:'#fafbfc',cursor:'pointer'}}
          >
            {t('attachments.drop')} <input type="file" multiple onChange={handleFileChange} style={{display:'inline'}} />
          </Box>
          <Box sx={{display:'flex',flexWrap:'wrap',gap:2}}>
            {attachments.map(att => (
              <Box key={att.id} sx={{border:'1px solid #eee',borderRadius:2,p:1,minWidth:120,maxWidth:180,display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
                {/* Náhled obrázku */}
                {att.type.startsWith('image/') ? (
                  <img src={att.url} alt={att.name} style={{maxWidth:120,maxHeight:90,borderRadius:4,marginBottom:4}} />
                ) : att.type === 'application/pdf' ? (
                  <object data={att.url} type="application/pdf" width="100" height="80">
                    <InsertDriveFileIcon fontSize="large" sx={{color:'#888'}} />
                  </object>
                ) : (
                  <InsertDriveFileIcon fontSize="large" sx={{color:'#888',mb:1}} />
                )}
                <Typography variant="caption" sx={{wordBreak:'break-all',mb:1}}>{att.name}</Typography>
                <Box sx={{display:'flex',gap:1}}>
                  <Button size="small" onClick={()=>window.open(att.url, '_blank')}>{t('attachments.download')}</Button>
                  <Button size="small" color="error" onClick={()=>setAttachments(prev=>prev.filter(a=>a.id!==att.id))}>{t('attachments.delete')}</Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">{t('cancel')}</Button>
        <Button onClick={handleSave} color="primary" variant="contained">{t('save')}</Button>
      </DialogActions>
      <Box sx={{display:'flex',gap:1,mt:2,justifyContent:'flex-end'}}>
        <Button size="small" variant="outlined" onClick={() => {
          if (pripad) {
            const prev = undoPripad(pripad);
            if (prev) {
              onSave({
                klient: prev.klient,
                poradce: prev.poradce,
                co: prev.krok1?.co || '',
                castka: prev.krok1?.castka || '',
                popis: prev.krok1?.popis || '',
                termin: prev.krok2?.termin || '',
                urok: prev.krok2?.urok || '',
                banka: prev.krok3?.banka || '',
                poznamka: prev.poznamka || '',
                attachments: prev.kroky?.[0]?.attachments || []
              });
            }
          }
        }}>{t('undo')}</Button>
        <Button size="small" variant="outlined" onClick={() => {
          if (pripad) {
            const next = redoPripad(pripad);
            if (next) {
              onSave({
                klient: next.klient,
                poradce: next.poradce,
                co: next.krok1?.co || '',
                castka: next.krok1?.castka || '',
                popis: next.krok1?.popis || '',
                termin: next.krok2?.termin || '',
                urok: next.krok2?.urok || '',
                banka: next.krok3?.banka || '',
                poznamka: next.poznamka || '',
                attachments: next.kroky?.[0]?.attachments || []
              });
            }
          }
        }}>{t('redo')}</Button>
      </Box>
    </Dialog>
  );
};

export default React.memo(EditDialog);
