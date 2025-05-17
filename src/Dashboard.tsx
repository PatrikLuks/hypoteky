import React, { useMemo } from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Switch, FormGroup, FormControlLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { DashboardProps } from './types';

const Dashboard: React.FC<DashboardProps> = React.memo(({
  pripady, KROKY, poradci, aktivniPoradce, setAktivniPoradce, stavKrokuFilter, setStavKrokuFilter, zobrazArchivovane, setZobrazArchivovane, dashboardPrefs, setDashboardPrefs, isMobile, search, setSearch
}) => {
  // Výpočty statistik a grafů
  const dokoncene = useMemo(() => pripady.filter(p => !p.archivovano && p.kroky.every(k => k.splneno)).length, [pripady]);
  const pipelineData = useMemo(() => KROKY.slice(3).map((k, idx) => ({
    name: k,
    count: pripady.filter(p => !p.archivovano && p.aktualniKrok === idx).length
  })), [pripady, KROKY]);

  return (
    <Paper elevation={4} sx={{borderRadius:5,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:isMobile?2:3,mb:3,minWidth:isMobile?'100%':'340px',maxWidth:'400px',flex:'0 0 340px',position:'sticky',top:isMobile?0:8,zIndex:2}}>
      <Typography variant="h6" sx={{fontWeight:600,mb:2}}>Přehled</Typography>
      <Box component="ul" sx={{pl:2,mb:2}}>
        <li>Počet rozpracovaných případů: <b>{pripady.filter(p => !p.archivovano).length}</b></li>
        <li>Počet dokončených případů: <b>{dokoncene}</b></li>
        <li>Počet archivovaných případů: <b>{pripady.filter(p => p.archivovano).length}</b></li>
      </Box>
      <Box sx={{display:'flex',flexDirection:'column',gap:2,mb:2}}>
        <FormControl fullWidth size="small">
          <InputLabel id="aktivni-poradce-label">Aktivní poradce</InputLabel>
          <Select labelId="aktivni-poradce-label" value={aktivniPoradce} label="Aktivní poradce" onChange={e => setAktivniPoradce(e.target.value)}>
            <MenuItem value="">Všichni poradci</MenuItem>
            {poradci.map(jmeno => (
              <MenuItem key={jmeno} value={jmeno}>{jmeno}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="stav-kroku-label">Filtrovat podle stavu kroku</InputLabel>
          <Select labelId="stav-kroku-label" value={stavKrokuFilter} label="Filtrovat podle stavu kroku" onChange={e => setStavKrokuFilter(e.target.value)}>
            <MenuItem value="">Všechny stavy</MenuItem>
            {KROKY.slice(3).map((k, idx) => (
              <MenuItem key={idx} value={k}>{k}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="archiv-label">Archivace</InputLabel>
          <Select labelId="archiv-label" value={zobrazArchivovane ? 'ano' : 'ne'} label="Archivace" onChange={e => setZobrazArchivovane(e.target.value === 'ano')}>
            <MenuItem value="ne">Skrýt archivované</MenuItem>
            <MenuItem value="ano">Zobrazit archivované</MenuItem>
          </Select>
        </FormControl>
        <FormGroup row sx={{mb:2,gap:2}}>
          <FormControlLabel control={<Switch checked={dashboardPrefs.showSuccess} onChange={e=>setDashboardPrefs((p:any)=>({...p,showSuccess:e.target.checked}))} />} label="Úspěšnost" />
          <FormControlLabel control={<Switch checked={dashboardPrefs.showPipeline} onChange={e=>setDashboardPrefs((p:any)=>({...p,showPipeline:e.target.checked}))} />} label="Pipeline" />
        </FormGroup>
        <Box sx={{mb:2}}>
          <input type="text" placeholder="Vyhledat klienta, banku, poznámku..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'8px',borderRadius:4,border:'1px solid #ccc'}} />
        </Box>
      </Box>
      {/* Ukázka grafu pipeline */}
      {dashboardPrefs.showPipeline && (
        <Box sx={{mb:2}}>
          <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>Pipeline (počet případů v jednotlivých fázích)</Typography>
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
    </Paper>
  );
});

export default Dashboard;
