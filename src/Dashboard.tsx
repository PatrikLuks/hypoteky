import React, { useMemo } from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Switch, FormGroup, FormControlLabel, TextField, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import type { DashboardProps, SavedFilter } from './types';
import { useTranslation } from 'react-i18next';

const FILTERS_KEY = 'dashboardSavedFilters';

function loadSavedFilters(): SavedFilter[] {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_KEY) || '[]');
  } catch { return []; }
}
function saveSavedFilters(filters: SavedFilter[]) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

const Dashboard: React.FC<DashboardProps> = React.memo(({
  pripady, KROKY, poradci, poradce, setPoradce, stavKrokuFilter, setStavKrokuFilter, zobrazArchivovane, setZobrazArchivovane, dashboardPrefs, setDashboardPrefs, isMobile, search, setSearch, bankaFilter, setBankaFilter, terminFilter, setTerminFilter
}) => {
  const { t } = useTranslation();

  // Výpočty statistik a grafů
  const dokoncene = useMemo(() => pripady.filter(p => !p.archivovano && p.kroky.every(k => k.splneno)).length, [pripady]);
  const pipelineData = useMemo(() => KROKY.slice(3).map((k, idx) => ({
    name: k,
    count: pripady.filter(p => !p.archivovano && p.aktualniKrok === idx).length
  })), [pripady, KROKY]);
  // Získání unikátních bank z případů
  const banky = useMemo(() => Array.from(new Set(pripady.map(p => (p.krok3?.banka || '').trim()).filter(Boolean))), [pripady]);

  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>(loadSavedFilters());
  const [filterName, setFilterName] = React.useState('');

  // Uložit aktuální filtr
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    const newFilter: SavedFilter = {
      id: uuidv4(),
      name: filterName.trim(),
      data: { poradce, stavKrokuFilter, zobrazArchivovane, bankaFilter, terminFilter, search },
      createdAt: new Date().toISOString()
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    saveSavedFilters(updated);
    setFilterName('');
  };
  // Načíst filtr
  const handleLoadFilter = (f: SavedFilter) => {
    setPoradce(f.data.poradce);
    setStavKrokuFilter(f.data.stavKrokuFilter);
    setZobrazArchivovane(f.data.zobrazArchivovane);
    setBankaFilter(f.data.bankaFilter);
    setTerminFilter(f.data.terminFilter);
    setSearch(f.data.search);
  };
  // Smazat filtr
  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    saveSavedFilters(updated);
  };
  // Sdílet filtr (JSON do clipboardu)
  const handleShareFilter = (f: SavedFilter) => {
    navigator.clipboard.writeText(JSON.stringify(f.data));
    alert('Filtr zkopírován do schránky jako JSON.');
  };

  return (
    <Paper elevation={4} sx={{borderRadius:5,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:isMobile?2:3,mb:3,minWidth:isMobile?'100%':'340px',maxWidth:'400px',flex:'0 0 340px',position:'sticky',top:isMobile?0:8,zIndex:2}}>
      {/* Graf pipeline nahoru */}
      {dashboardPrefs.showPipeline && (
        <Box sx={{mb:2}}>
          <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>{t('pipeline.graph')}</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineData} layout="vertical" margin={{left:20}}>
              <XAxis type="number" allowDecimals={false}/>
              <YAxis dataKey="name" type="category" width={160}/>
              <RechartsTooltip/>
              <Bar dataKey="count" fill="#ffa000" radius={[0,8,8,0]}>
                <LabelList dataKey="count" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
      <Typography variant="h6" sx={{fontWeight:600,mb:2}}>{t('overview')}</Typography>
      <Box component="ul" sx={{pl:2,mb:2}}>
        <li>{t('cases.active')}: <b>{pripady.filter(p => !p.archivovano).length}</b></li>
        <li>{t('cases.completed')}: <b>{dokoncene}</b></li>
        <li>{t('cases.archived')}: <b>{pripady.filter(p => p.archivovano).length}</b></li>
      </Box>
      <Box sx={{display:'flex',flexDirection:'column',gap:2,mb:2}}>
        <FormControl fullWidth size="small">
          <InputLabel id="poradce-label">{t('filter.advisor')}</InputLabel>
          <Select labelId="poradce-label" value={poradce} label={t('filter.advisor')} onChange={e => setPoradce(e.target.value)}>
            <MenuItem value="">{t('filter.all.advisors')}</MenuItem>
            {poradci.map(jmeno => (
              <MenuItem key={jmeno} value={jmeno}>{jmeno}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="stav-kroku-label">{t('filter.step')}</InputLabel>
          <Select labelId="stav-kroku-label" value={stavKrokuFilter} label={t('filter.step')} onChange={e => setStavKrokuFilter(e.target.value)}>
            <MenuItem value="">{t('filter.all.steps')}</MenuItem>
            {KROKY.slice(3).map((k, idx) => (
              <MenuItem key={idx} value={k}>{k}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="archiv-label">{t('filter.archive')}</InputLabel>
          <Select labelId="archiv-label" value={zobrazArchivovane ? 'ano' : 'ne'} label={t('filter.archive')} onChange={e => setZobrazArchivovane(e.target.value === 'ano')}>
            <MenuItem value="ne">{t('filter.hide.archived')}</MenuItem>
            <MenuItem value="ano">{t('filter.show.archived')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="banka-filter-label">{t('filter.bank')}</InputLabel>
          <Select labelId="banka-filter-label" value={bankaFilter} label={t('filter.bank')} onChange={e => setBankaFilter(e.target.value)}>
            <MenuItem value="">{t('filter.all.banks')}</MenuItem>
            {banky.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label={t('filter.deadline')}
          type="date"
          value={terminFilter}
          onChange={e => setTerminFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <FormGroup row sx={{mb:2,gap:2}}>
          <FormControlLabel control={<Switch checked={dashboardPrefs.showSuccess} onChange={e=>setDashboardPrefs((p)=>({...p,showSuccess:e.target.checked}))} />} label={t('success')} />
          <FormControlLabel control={<Switch checked={dashboardPrefs.showPipeline} onChange={e=>setDashboardPrefs((p)=>({...p,showPipeline:e.target.checked}))} />} label={t('pipeline')} />
        </FormGroup>
        <Box sx={{mb:2}}>
          <input type="text" placeholder={t('search.placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'8px',borderRadius:4,border:'1px solid #ccc'}} />
        </Box>
        <Box sx={{display:'flex',flexDirection:'column',gap:2,mb:2}}>
          <Box sx={{display:'flex',gap:1,alignItems:'center',mb:1}}>
            <TextField size="small" label={t('filter.name')} value={filterName} onChange={e=>setFilterName(e.target.value)} sx={{flex:1}} />
            <Button variant="outlined" size="small" onClick={handleSaveFilter}>{t('filter.save')}</Button>
          </Box>
          {savedFilters.length > 0 && (
            <Box sx={{mb:1}}>
              <Typography variant="caption" color="text.secondary">{t('filter.saved')}:</Typography>
              <Box sx={{display:'flex',flexWrap:'wrap',gap:1,mt:0.5}}>
                {savedFilters.map(f => (
                  <Box key={f.id} sx={{display:'flex',alignItems:'center',border:'1px solid #eee',borderRadius:2,px:1,py:0.5,bgcolor:'#fafbfc'}}>
                    <Button size="small" onClick={()=>handleLoadFilter(f)}>{f.name}</Button>
                    <Button size="small" color="error" onClick={()=>handleDeleteFilter(f.id)} sx={{minWidth:0,ml:0.5}}>✕</Button>
                    <Button size="small" onClick={()=>handleShareFilter(f)} sx={{minWidth:0,ml:0.5}}>{t('filter.share')}</Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          {/* ...zbytek filtrů... */}
        </Box>
      </Box>
    </Paper>
  );
});

export default Dashboard;
