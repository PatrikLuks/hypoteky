import React, { useState, useMemo } from 'react';
import './App.css';
import notificationSound from './assets/notification.mp3';
import type { TransitionProps } from '@mui/material/transitions';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, IconButton, Container, Card, CardContent, Paper, Box, Avatar, Snackbar, Button, TextField, Select, MenuItem, FormControl, InputLabel, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Slide, Stepper, Step, StepLabel, StepContent, Button as MUIButton, TextField as MUITextField } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MuiAlert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';

// Přechod pro dialog (slide up)
const Transition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
  (props, ref) => {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

// Definice kroků procesu hypotéky
const KROKY = [
  'Co chce klient financovat?',
  'Návrh financování',
  'Výběr banky',
  'Příprava žádosti',
  'Kompletace podkladů',
  'Podání žádosti',
  'Odhad',
  'Schvalování',
  'Úvěrová dokumentace',
  'Podpis úvěrové dokumentace',
  'Příprava k čerpání',
  'Čerpání',
  'Zahájení splácení',
  'Podmínky pro vyčerpání',
];

// Statický seznam bank a institucí
const BANKY = [
  'Česká spořitelna',
  'Komerční banka',
  'ČSOB',
  'UniCredit Bank',
  'Raiffeisenbank',
  'Moneta Money Bank',
  'mBank',
  'Fio banka',
  'Air Bank',
  'Sberbank',
  'Hypoteční banka',
  'Equa bank',
  'Oberbank',
  'Expobank',
  'Hello bank!',
  'Trinity Bank',
  'Wüstenrot hypoteční banka',
  'Další (ručně)'
];

// Typy
interface Krok1Info {
  co: string;
  castka: string;
  popis: string;
}

interface Krok2Info {
  termin: string;
  urok: string;
}

interface Krok3Info {
  banka: string;
}

interface KrokZmena {
  kdo: string;
  kdy: string; // ISO datum
  zmena: string; // popis změny
}

interface KrokPripadu {
  nazev: string;
  termin?: string; // deadline
  splneno: boolean;
  poznamka?: string;
  splnenoAt?: string; // datum splnění
  historie?: KrokZmena[]; // auditní stopa
  pripomenoutZa?: number; // počet dní do připomenutí
}

interface PripadHypoteky {
  id: number;
  klient: string;
  poradce: string; // nový údaj
  aktualniKrok: number;
  krok1: Krok1Info;
  krok2: Krok2Info;
  krok3: Krok3Info;
  kroky: KrokPripadu[];
  poznamka?: string;
  archivovano?: boolean; // nově pro archivaci
}

// Funkce pro upozornění na blížící se termíny (do 7 dnů)
function bliziciSeTerminy(pripad: PripadHypoteky) {
  const dnes = new Date('2025-05-16'); // aktuální datum
  const limit = new Date(dnes);
  limit.setDate(dnes.getDate() + 7);
  const upozorneni: string[] = [];
  // Krok 2 a další (kroky s termínem)
  if (pripad.krok2.termin) {
    const t = new Date(pripad.krok2.termin);
    if (t > dnes && t <= limit) upozorneni.push(`Návrh financování: ${pripad.krok2.termin}`);
  }
  pripad.kroky.forEach((krok) => {
    if (krok.termin) {
      const t = new Date(krok.termin);
      if (!krok.splneno && t > dnes && t <= limit) {
        upozorneni.push(`${krok.nazev}: ${krok.termin}`);
      }
    }
  });
  return upozorneni;
}

// Export do CSV
function exportToCSV(pripady: PripadHypoteky[]) {
  const rows = [
    [
      'Klient', 'Poradce', 'Co financuje', 'Částka', 'Popis', 'Datum návrhu', 'Úrok', 'Banka', 'Poznámka',
      ...KROKY.slice(3).map((k, i) => `Krok ${i+4} - ${k} - deadline`),
      ...KROKY.slice(3).map((k, i) => `Krok ${i+4} - ${k} - splněno`),
      ...KROKY.slice(3).map((k, i) => `Krok ${i+4} - ${k} - poznámka`)
    ]
  ];
  pripady.forEach(p => {
    rows.push([
      p.klient,
      p.poradce,
      p.krok1.co,
      p.krok1.castka,
      p.krok1.popis,
      p.krok2.termin,
      p.krok2.urok,
      p.krok3.banka,
      p.poznamka || '',
      ...p.kroky.map(k => k.termin || ''),
      ...p.kroky.map(k => k.splneno ? (k.splnenoAt || 'ano') : ''),
      ...p.kroky.map(k => k.poznamka || '')
    ]);
  });
  const csv = rows.map(r => r.map(x => '"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hypoteky.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Export do JSON
function exportToJSON(pripady: PripadHypoteky[]) {
  const json = JSON.stringify(pripady, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hypoteky.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import z JSON
function importFromJSON(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    try {
      const data = JSON.parse(text);
      // setPripady je dostupné pouze v komponentě, proto předáme funkci jako parametr
      window.dispatchEvent(new CustomEvent('importPripady', { detail: data }));
    } catch {
      // intentionally empty: pokud JSON není validní, ignorujeme
    }
  };
  reader.readAsText(file);
}

function App() {
  const [pripady, setPripady] = useState<PripadHypoteky[]>([]);
  const [novyKlient, setNovyKlient] = useState('');
  const [novyPoradce, setNovyPoradce] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [krok1Co, setKrok1Co] = useState('');
  const [krok1Castka, setKrok1Castka] = useState('');
  const [krok1Popis, setKrok1Popis] = useState('');
  const [krok2Termin, setKrok2Termin] = useState('');
  const [krok2Urok, setKrok2Urok] = useState('');
  const [krok3Banka, setKrok3Banka] = useState('');
  const [krok3Vlastni, setKrok3Vlastni] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [zvukAbsolvovany, setZvukAbsolvovany] = useState(false);
  const [stavKrokuFilter, setStavKrokuFilter] = useState('');
  const [zobrazArchivovane, setZobrazArchivovane] = useState(false);
  const [aktivniPoradce, setAktivniPoradce] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity?: AlertColor}>({open: false, message: ''});
  const [bottomNav, setBottomNav] = useState('cases');

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#ffa000' },
      background: { default: darkMode ? '#181c24' : '#f4f6fa' }
    },
    shape: { borderRadius: 10 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' }
  }), [darkMode]);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Získat seznam všech poradců z případů
  const poradci = Array.from(new Set(pripady.map(p => p.poradce).filter(Boolean)));

  // Vymazání všech případů a přidání pěti nových
  useState(() => {
    setPripady([
      {
        id: 1,
        klient: 'Alena Novotná',
        poradce: 'Jana Veselá',
        aktualniKrok: 0,
        krok1: { co: 'Byt', castka: '3500000', popis: 'Praha 4, novostavba' },
        krok2: { termin: '2025-05-20', urok: '4.19' },
        krok3: { banka: 'Česká spořitelna' },
        kroky: KROKY.slice(3).map(nazev => ({ nazev, termin: '', splneno: false, splnenoAt: undefined, poznamka: '' })),
        poznamka: 'První hypotéka.',
        archivovano: false
      },
      {
        id: 2,
        klient: 'Petr Malý',
        poradce: 'Jana Veselá',
        aktualniKrok: 1,
        krok1: { co: 'Dům', castka: '7800000', popis: 'Rodinný dům, Brno' },
        krok2: { termin: '2025-05-22', urok: '3.89' },
        krok3: { banka: 'Komerční banka' },
        kroky: KROKY.slice(3).map(nazev => ({ nazev, termin: '', splneno: false, splnenoAt: undefined, poznamka: '' })),
        poznamka: '',
        archivovano: false
      },
      {
        id: 3,
        klient: 'Lucie Černá',
        poradce: 'Petr Novák',
        aktualniKrok: 2,
        krok1: { co: 'Rekonstrukce', castka: '1200000', popis: 'Rekonstrukce bytu, Plzeň' },
        krok2: { termin: '2025-05-25', urok: '4.05' },
        krok3: { banka: 'ČSOB' },
        kroky: KROKY.slice(3).map(nazev => ({ nazev, termin: '', splneno: false, splnenoAt: undefined, poznamka: '' })),
        poznamka: 'Rekonstrukce pro mladý pár.',
        archivovano: false
      },
      {
        id: 4,
        klient: 'Tomáš Dvořák',
        poradce: 'Petr Novák',
        aktualniKrok: 0,
        krok1: { co: 'Pozemek', castka: '2500000', popis: 'Stavební pozemek, Ostrava' },
        krok2: { termin: '2025-05-28', urok: '4.50' },
        krok3: { banka: 'Raiffeisenbank' },
        kroky: KROKY.slice(3).map(nazev => ({ nazev, termin: '', splneno: false, splnenoAt: undefined, poznamka: '' })),
        poznamka: '',
        archivovano: false
      },
      {
        id: 5,
        klient: 'Eva Králová',
        poradce: 'Jana Veselá',
        aktualniKrok: 1,
        krok1: { co: 'Chata', castka: '1800000', popis: 'Rekreační objekt, Liberec' },
        krok2: { termin: '2025-05-30', urok: '3.75' },
        krok3: { banka: 'Moneta Money Bank' },
        kroky: KROKY.slice(3).map(nazev => ({ nazev, termin: '', splneno: false, splnenoAt: undefined, poznamka: '' })),
        poznamka: 'Letní rekreace.',
        archivovano: false
      }
    ]);
  });

  // Počet případů s blížícím se termínem
  const pocetBlizicich = pripady.filter(p => bliziciSeTerminy(p).length > 0).length;

  // Zvukové upozornění na blížící se termíny (pouze jednou)
  useState(() => {
    if (pocetBlizicich > 0 && !zvukAbsolvovany) {
      const audio = new Audio(notificationSound);
      audio.play();
      setZvukAbsolvovany(true);
    }
  });

  // Helper pro otevření snackbaru
  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Import z CSV (základní podpora)
  function importFromCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const data: PripadHypoteky[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(x => x.replace(/^"|"$/g, '').replace(/""/g, '"'));
        data.push({
          id: i,
          klient: cols[0],
          poradce: cols[1],
          krok1: { co: cols[2], castka: cols[3], popis: cols[4] },
          krok2: { termin: cols[5], urok: cols[6] },
          krok3: { banka: cols[7] },
          poznamka: cols[8],
          aktualniKrok: 0,
          kroky: KROKY.slice(3).map((nazev, idx) => ({
            nazev,
            termin: cols[9+idx] || '',
            splneno: !!cols[9+KROKY.slice(3).length+idx],
            splnenoAt: cols[9+KROKY.slice(3).length+idx] || undefined,
            poznamka: cols[9+2*KROKY.slice(3).length+idx] || ''
          })),
          archivovano: false
        });
      }
      setPripady(data);
      showSnackbar('Data byla úspěšně importována', 'success');
    };
    reader.readAsText(file);
  }

  // Smazání případu
  const smazatPripad = (id: number) => {
    setPripady(pripady.filter(p => p.id !== id));
    showSnackbar('Případ byl úspěšně smazán', 'success');
  };

  // Archivace případu
  const archivovatPripad = (id: number) => {
    setPripady(pripady.map(p => p.id === id ? { ...p, archivovano: true } : p));
    showSnackbar('Případ byl archivován', 'info');
  };

  const obnovitPripad = (id: number) => {
    setPripady(pripady.map(p => p.id === id ? { ...p, archivovano: false } : p));
    showSnackbar('Případ byl obnoven z archivu', 'info');
  };

  // Editace případu (základní: pouze předvyplnění formuláře, úprava po přidání)
  const editovatPripad = (pripad: PripadHypoteky) => {
    setEditId(pripad.id);
    setNovyKlient(pripad.klient);
    setNovyPoradce(pripad.poradce);
    setPoznamka(pripad.poznamka || '');
    setKrok1Co(pripad.krok1.co);
    setKrok1Castka(pripad.krok1.castka);
    setKrok1Popis(pripad.krok1.popis);
    setKrok2Termin(pripad.krok2.termin);
    setKrok2Urok(pripad.krok2.urok);
    setKrok3Banka(BANKY.includes(pripad.krok3.banka) ? pripad.krok3.banka : 'Další (ručně)');
    setKrok3Vlastni(BANKY.includes(pripad.krok3.banka) ? '' : pripad.krok3.banka);
    setOpenEditDialog(true);
  };

  // Uložení editovaného případu
  const ulozitEditaci = () => {
    if (editId === null) return;
    const vybranaBanka = krok3Banka === 'Další (ručně)' ? krok3Vlastni : krok3Banka;
    setPripady(pripady.map(p =>
      p.id === editId
        ? {
            ...p,
            klient: novyKlient,
            poradce: novyPoradce,
            poznamka,
            krok1: { co: krok1Co, castka: krok1Castka, popis: krok1Popis },
            krok2: { termin: krok2Termin, urok: krok2Urok },
            krok3: { banka: vybranaBanka },
            kroky: p.kroky, // zachovat původní kroky
            aktualniKrok: p.aktualniKrok // zachovat aktuální krok
          }
        : p
    ));
    setEditId(null);
    setNovyKlient('');
    setNovyPoradce('');
    setPoznamka('');
    setKrok1Co('');
    setKrok1Castka('');
    setKrok1Popis('');
    setKrok2Termin('');
    setKrok2Urok('');
    setKrok3Banka('');
    setKrok3Vlastni('');
    showSnackbar('Případ byl úspěšně upraven', 'success');
  };

  // Označení kroku jako splněného a posun na další krok
  const splnitKrok = (pripadId: number, krokIdx: number) => {
    setPripady(pripady.map(pripad => {
      if (pripad.id !== pripadId) return pripad;
      const noveKroky = [...pripad.kroky];
      const dnes = new Date().toISOString().slice(0, 10);
      noveKroky[krokIdx] = { ...noveKroky[krokIdx], splneno: true, splnenoAt: dnes };
      return {
        ...pripad,
        aktualniKrok: Math.min(krokIdx + 1, KROKY.length - 2),
        kroky: noveKroky,
      };
    }));
  };

  // Změna termínu (deadline) kroku
  const nastavTermin = (pripadId: number, krokIdx: number, termin: string) => {
    setPripady(pripady.map(pripad => {
      if (pripad.id !== pripadId) return pripad;
      const noveKroky = [...pripad.kroky];
      noveKroky[krokIdx] = { ...noveKroky[krokIdx], termin };
      return { ...pripad, kroky: noveKroky };
    }));
  };

  // Průměrná doba od zadání do posledního splněného kroku (jen pro dokončené)
  const prumDoba = (() => {
    const hotove = pripady.filter(p => !p.archivovano && p.kroky.every(k => k.splneno));
    if (hotove.length === 0) return '-';
    const sum = hotove.reduce((acc, p) => {
      const start = new Date(p.krok2.termin).getTime();
      const end = Math.max(...p.kroky.map(k => k.splnenoAt ? new Date(k.splnenoAt).getTime() : 0));
      return acc + (end - start);
    }, 0);
    const avgMs = sum / hotove.length;
    const dny = Math.round(avgMs / (1000*60*60*24));
    return dny + ' dní';
  })();

  // Handler pro import z JSON (přes window event)
  useState(() => {
    const handler = (e: CustomEvent) => {
      if (Array.isArray(e.detail)) setPripady(e.detail);
    };
    window.addEventListener('importPripady', handler as EventListener);
    return () => window.removeEventListener('importPripady', handler as EventListener);
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={2} sx={{backdropFilter:'blur(8px)',background:darkMode?'rgba(24,28,36,0.95)':'rgba(255,255,255,0.85)',color:darkMode?'#fff':'#1976d2'}}>
        <Toolbar>
          <Typography variant="h5" sx={{flexGrow:1,fontWeight:700,letterSpacing:1}}>Správa hypoték</Typography>
          <IconButton color="inherit" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{py: isMobile ? 1 : 4}}>
        <Box sx={{display:'flex',flexDirection:isMobile?'column':'row',gap:4}}>
          <Paper elevation={4} sx={{borderRadius:5,backdropFilter:'blur(8px)',background:darkMode?'rgba(30,34,44,0.85)':'rgba(255,255,255,0.85)',p:isMobile?2:3,mb:3,minWidth:isMobile?'100%':'340px',maxWidth:'400px',flex:'0 0 340px',position:'sticky',top:theme.spacing(2),zIndex:2}}>
            <Typography variant="h6" sx={{fontWeight:600,mb:2}}>Přehled</Typography>
            <Box component="ul" sx={{pl:2,mb:2}}>
              <li>Počet rozpracovaných případů: <b>{pripady.filter(p => !p.archivovano).length}</b></li>
              <li>Počet případů s blížícím se termínem: <b>{pripady.filter(p => !p.archivovano && bliziciSeTerminy(p).length > 0).length}</b></li>
              <li>Počet dokončených případů: <b>{pripady.filter(p => !p.archivovano && p.aktualniKrok === KROKY.length - 3 && p.kroky.every(k => k.splneno)).length}</b></li>
              <li>Počet archivovaných případů: <b>{pripady.filter(p => p.archivovano).length}</b></li>
              <li>Průměrná doba zpracování: <b>{prumDoba}</b></li>
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
            </Box>
            <Box sx={{display:'flex',gap:1,flexWrap:'wrap',mb:2}}>
              <Button variant="contained" color="primary" size="small" onClick={() => exportToCSV(pripady)}>Exportovat do CSV</Button>
              <Button variant="outlined" color="primary" size="small" component="label">
                Importovat z CSV
                <input type="file" accept=".csv" hidden onChange={importFromCSV} />
              </Button>
              <Button variant="contained" color="secondary" size="small" onClick={() => exportToJSON(pripady)}>Exportovat do JSON</Button>
              <Button variant="outlined" color="secondary" size="small" component="label">
                Importovat z JSON
                <input type="file" accept=".json" hidden onChange={importFromJSON} />
              </Button>
            </Box>
          </Paper>
          <Box sx={{flex:1}}>
            <Box sx={{display:'flex',justifyContent:'flex-end',mb:2}}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Vyhledat klienta, banku, poznámku..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{minWidth: isMobile ? '100%' : 250}}
              />
            </Box>
            <Grid container spacing={isMobile ? 2 : 3}>
              {pripady.filter(p =>
                (zobrazArchivovane ? true : !p.archivovano) &&
                (aktivniPoradce ? p.poradce === aktivniPoradce : true) &&
                (stavKrokuFilter === '' || KROKY[p.aktualniKrok + 3] === stavKrokuFilter) &&
                (p.klient.toLowerCase().includes(search.toLowerCase()) ||
                p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
                (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
                )
              ).map(pripad => {
                return (
                  <Grid size={12} key={pripad.id}>
                    <Card elevation={6} sx={{borderRadius:5,mb:2,background:darkMode?'rgba(30,34,44,0.92)':'rgba(255,255,255,0.97)',boxShadow:'0 4px 24px #1976d211'}}>
                      <CardContent>
                        <Box sx={{display:'flex',alignItems:'center',gap:2,mb:1,flexWrap:'wrap'}}>
                          <Avatar sx={{bgcolor:'#1976d2',width:40,height:40,fontWeight:700}}>{pripad.poradce?.[0] || '?'}</Avatar>
                          <Box sx={{flex:1}}>
                            <Typography variant="h6" sx={{fontWeight:600}}>{pripad.klient}</Typography>
                            <Typography variant="body2" color="text.secondary">Poradce: {pripad.poradce}</Typography>
                          </Box>
                          <IconButton color="primary" onClick={() => editovatPripad(pripad)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => smazatPripad(pripad.id)}><DeleteIcon /></IconButton>
                          {!pripad.archivovano ? (
                            <IconButton color="default" onClick={() => archivovatPripad(pripad.id)}><ArchiveIcon /></IconButton>
                          ) : (
                            <IconButton color="primary" onClick={() => obnovitPripad(pripad.id)}><UnarchiveIcon /></IconButton>
                          )}
                        </Box>
                        <Box sx={{my:2}}>
                          <Typography variant="subtitle2" color="primary" sx={{mb:1}}>Workflow</Typography>
                          <Stepper activeStep={pripad.aktualniKrok} orientation="vertical" sx={{background:'none'}}>
                            {pripad.kroky.map((krok, idx) => (
                              <Step key={idx} completed={krok.splneno}>
                                <StepLabel optional={krok.termin ? <span style={{color:'#1976d2',fontWeight:500}}>{krok.termin}</span> : undefined}>
                                  {krok.nazev}
                                </StepLabel>
                                <StepContent>
                                  <MUITextField
                                    size="small"
                                    label="Poznámka ke kroku"
                                    value={krok.poznamka || ''}
                                    onChange={e => {
                                      setPripady(pripady.map(p => {
                                        if (p.id !== pripad.id) return p;
                                        const noveKroky = [...p.kroky];
                                        noveKroky[idx] = { ...noveKroky[idx], poznamka: e.target.value };
                                        return { ...p, kroky: noveKroky };
                                      }));
                                    }}
                                    sx={{mb:1,minWidth:220}}
                                  />
                                  <MUITextField
                                    size="small"
                                    type="date"
                                    label="Termín"
                                    value={krok.termin || ''}
                                    onChange={e => nastavTermin(pripad.id, idx, e.target.value)}
                                    sx={{mb:1,minWidth:140}}
                                    InputLabelProps={{ shrink: true }}
                                  />
                                  <MUIButton
                                    variant={krok.splneno ? 'contained' : 'outlined'}
                                    color={krok.splneno ? 'success' : 'primary'}
                                    size="small"
                                    onClick={() => splnitKrok(pripad.id, idx)}
                                    disabled={krok.splneno || idx > pripad.aktualniKrok}
                                    sx={{ml:1}}
                                  >
                                    {krok.splneno ? 'Splněno' : 'Označit jako splněné'}
                                  </MUIButton>
                                </StepContent>
                              </Step>
                            ))}
                          </Stepper>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>
      </Container>
      {/* FAB pro mobilní přidání případu */}
      {isMobile && (
        <Fab color="primary" aria-label="Přidat případ" sx={{position:'fixed',bottom:80,right:24,zIndex:1200,boxShadow:'0 4px 24px #1976d244'}} onClick={()=>setOpenEditDialog(true)}>
          <AddCircleIcon fontSize="large" />
        </Fab>
      )}
      {/* BottomNavigation pro mobil */}
      {isMobile && (
        <BottomNavigation
          value={bottomNav}
          onChange={(_e, newValue) => setBottomNav(newValue)}
          showLabels
          sx={{position:'fixed',bottom:0,left:0,right:0,zIndex:1200,backdropFilter:'blur(8px)',background:darkMode?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',boxShadow:'0 -2px 16px #1976d211'}}
        >
          <BottomNavigationAction label="Případy" value="cases" icon={<ListAltIcon />} />
          <BottomNavigationAction label="Přehled" value="dashboard" icon={<RestoreIcon />} />
        </BottomNavigation>
      )}
      {/* Snackbar pro toast notifikace */}
      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={()=>setSnackbar(s=>({...s,open:false}))} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
        <MuiAlert elevation={6} variant="filled" onClose={()=>setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{fontWeight:500,letterSpacing:0.2}}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      {/* Dialog pro editaci případu */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} TransitionComponent={Transition} maxWidth="sm" fullWidth PaperProps={{sx:{backdropFilter:'blur(8px)',background:darkMode?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)'}}}>
        <DialogTitle>Upravit případ</DialogTitle>
        <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,py:2}}>
          <TextField label="Klient" value={novyKlient} onChange={e=>setNovyKlient(e.target.value)} fullWidth size="small" />
          <TextField label="Poradce" value={novyPoradce} onChange={e=>setNovyPoradce(e.target.value)} fullWidth size="small" />
          <TextField label="Co financuje" value={krok1Co} onChange={e=>setKrok1Co(e.target.value)} fullWidth size="small" />
          <TextField label="Částka" value={krok1Castka} onChange={e=>setKrok1Castka(e.target.value)} fullWidth size="small" />
          <TextField label="Popis" value={krok1Popis} onChange={e=>setKrok1Popis(e.target.value)} fullWidth size="small" />
          <TextField label="Datum návrhu" type="date" value={krok2Termin} onChange={e=>setKrok2Termin(e.target.value)} fullWidth size="small" InputLabelProps={{shrink:true}} />
          <TextField label="Úrok (%)" value={krok2Urok} onChange={e=>setKrok2Urok(e.target.value)} fullWidth size="small" />
          <Select value={krok3Banka} onChange={e=>setKrok3Banka(e.target.value)} fullWidth size="small" displayEmpty>
            {BANKY.map(b=>(<MenuItem key={b} value={b}>{b}</MenuItem>))}
          </Select>
          {krok3Banka==='Další (ručně)' && (
            <TextField label="Vlastní banka" value={krok3Vlastni} onChange={e => setKrok3Vlastni(e.target.value)} fullWidth size="small" />
          )}
          <TextField label="Poznámka" value={poznamka} onChange={e=>setPoznamka(e.target.value)} fullWidth size="small" multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenEditDialog(false)} color="secondary">Zrušit</Button>
          <Button onClick={()=>{ulozitEditaci();setOpenEditDialog(false);}} color="primary" variant="contained">Uložit změny</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog pro potvrzení smazání */}
      <Dialog open={openDeleteDialog} onClose={()=>setOpenDeleteDialog(false)} TransitionComponent={Transition} maxWidth="xs" PaperProps={{sx:{backdropFilter:'blur(8px)',background:darkMode?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)'}}}>
        <DialogTitle>Opravdu smazat případ?</DialogTitle>
        <DialogActions>
          <Button onClick={()=>setOpenDeleteDialog(false)} color="secondary">Zrušit</Button>
          <Button onClick={()=>{setOpenDeleteDialog(false);}} color="error" variant="contained">Smazat</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
