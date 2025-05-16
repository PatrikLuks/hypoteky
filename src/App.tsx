import React, { useState, useMemo } from 'react';
import './App.css';
import notificationSound from './assets/notification.mp3';
import type { TransitionProps } from '@mui/material/transitions';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, IconButton, Container, Card, CardContent, Paper, Box, Avatar, Snackbar, Button, TextField, Select, MenuItem, FormControl, InputLabel, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Slide, Stepper, Step, StepLabel, StepContent, Button as MUIButton, TextField as MUITextField, Grid, Switch, FormGroup, FormControlLabel } from '@mui/material';
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
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '@mui/material/Skeleton';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';

// Přechod pro dialog (slide up)
const Transition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
  (props, ref) => {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

// Onboarding kroky pro step-by-step overlay
const onboardingSteps = [
  {
    title: 'Vítejte v aplikaci Správa hypoték',
    desc: 'Tato aplikace vám umožní efektivně spravovat případy hypoték klientů krok po kroku. Projděte si rychlý průvodce hlavními funkcemi.'
  },
  {
    title: 'Dashboard a statistiky',
    desc: 'Na hlavní stránce najdete přehled všech případů, rychlé filtry, statistiky a grafy. Můžete zde filtrovat, vyhledávat a exportovat data.'
  },
  {
    title: 'Workflow případů',
    desc: 'Každý případ obsahuje 14 kroků workflow. Sledujte postup, upravujte termíny, poznámky, přidávejte přílohy a označujte splněné kroky.'
  },
  {
    title: 'Přidání a editace případů',
    desc: 'Nový případ přidáte tlačítkem „Přidat případ“. Můžete také importovat data z CSV/JSON nebo upravit existující případ.'
  },
  {
    title: 'Personalizace a režimy',
    desc: 'Přizpůsobte si dashboard, přepínejte světlý/tmavý/modrý/kontrastní režim, zvětšete písmo nebo nastavte preferované sekce.'
  },
  {
    title: 'Nápověda a onboarding',
    desc: 'Kdykoliv klikněte na ikonu otazníku vpravo nahoře pro znovuspuštění průvodce nebo zobrazení nápovědy.'
  }
];

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

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // objectURL
}

interface KrokPripadu {
  nazev: string;
  termin?: string; // deadline
  splneno: boolean;
  poznamka?: string;
  splnenoAt?: string; // datum splnění
  historie?: KrokZmena[]; // auditní stopa
  pripomenoutZa?: number; // počet dní do připomenutí
  pripomenoutDatum?: string; // konkrétní datum připomínky
  attachments?: Attachment[];
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

// Funkce pro zjištění připomínek na dnešní den
function pripominkyDnes(pripad: PripadHypoteky) {
  const dnes = new Date().toISOString().slice(0,10);
  const upozorneni: string[] = [];
  pripad.kroky.forEach((krok) => {
    if (krok.pripomenoutZa) {
      // Vypočítat datum připomínky od termínu nebo od dne zadání
      let zaklad = krok.termin || pripad.krok2.termin;
      if (zaklad) {
        const d = new Date(zaklad);
        d.setDate(d.getDate() - krok.pripomenoutZa);
        if (d.toISOString().slice(0,10) === dnes) {
          upozorneni.push(`${krok.nazev}: připomínka za ${krok.pripomenoutZa} dní před termínem (${zaklad})`);
        }
      }
    }
    if (krok.pripomenoutDatum && krok.pripomenoutDatum === dnes) {
      upozorneni.push(`${krok.nazev}: připomínka na dnes (${dnes})`);
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
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity?: AlertColor}>({open: false, message: ''});
  const [bottomNav, setBottomNav] = useState('cases');
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState<{krok?:KrokPripadu, poradce?:string, open:boolean}>({open:false});
  const [openWorkflowSheet, setOpenWorkflowSheet] = useState<number|null>(null);

  // Stav pro personalizaci dashboardu
  const [dashboardPrefs, setDashboardPrefs] = useState(() => {
    const saved = localStorage.getItem('dashboardPrefs');
    return saved ? JSON.parse(saved) : {
      showSuccess: true,
      showPipeline: true,
      showAvgTime: true,
      showHeatmap: true
    };
  });

  // Onboarding stav
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const saved = localStorage.getItem('onboardingStep');
    return saved ? Number(saved) : 0;
  });

  // Rozšíření theme o více barevných schémat a velikostí písma
  const [themeMode, setThemeMode] = useState<'light'|'dark'|'blue'|'high-contrast'>('light');
  const [fontSize, setFontSize] = useState<'normal'|'large'>('normal');
  const theme = useMemo(() => createTheme({
    palette: themeMode === 'high-contrast' ? {
      mode: 'dark',
      primary: { main: '#fff' },
      secondary: { main: '#ffeb3b' },
      background: { default: '#111', paper: '#222' },
      text: { primary: '#fff', secondary: '#ffeb3b' }
    } : themeMode === 'blue' ? {
      mode: 'light',
      primary: { main: '#1565c0' },
      secondary: { main: '#00bcd4' },
      background: { default: '#e3f2fd', paper: '#fff' }
    } : themeMode === 'dark' ? {
      mode: 'dark',
      primary: { main: '#1976d2' },
      secondary: { main: '#ffa000' },
      background: { default: '#181c24', paper: '#23293a' }
    } : {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#ffa000' },
      background: { default: '#f4f6fa', paper: '#fff' }
    },
    shape: { borderRadius: 18 },
    spacing: 10,
    typography: {
      fontFamily: 'Urbanist, Inter, Roboto, Arial, sans-serif',
      fontSize: fontSize === 'large' ? 19 : 16,
      h1: { fontWeight: 900, letterSpacing: 0.5, fontSize: fontSize === 'large' ? '2.6rem' : '2.2rem' },
      h2: { fontWeight: 800, fontSize: fontSize === 'large' ? '2.1rem' : '1.7rem' },
      h3: { fontWeight: 700, fontSize: fontSize === 'large' ? '1.7rem' : '1.4rem' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 600, letterSpacing: 0.2 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      caption: { fontFamily: 'JetBrains Mono, monospace', fontWeight: 400, fontSize: fontSize === 'large' ? '1.1em' : '0.92em' },
    }
  }), [themeMode, fontSize]);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200); // simulace načítání
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('dashboardPrefs', JSON.stringify(dashboardPrefs));
  }, [dashboardPrefs]);

  React.useEffect(() => {
    localStorage.setItem('onboardingStep', onboardingStep.toString());
  }, [onboardingStep]);

  // Klávesové zkratky pro přepínání režimu a zvětšení písma
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 't') setThemeMode(m=>m==='light'?'dark':m==='dark'?'blue':m==='blue'?'high-contrast':'light');
      if (e.altKey && e.key === '+') setFontSize(f=>f==='normal'?'large':'normal');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Synchronizace tříd na <body> podle themeMode/fontSize
  React.useEffect(() => {
    document.body.classList.toggle('high-contrast', themeMode==='high-contrast');
    document.body.classList.toggle('font-large', fontSize==='large');
  }, [themeMode, fontSize]);

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
      pridejZmenuDoHistorie(pripadId, krokIdx, 'Krok označen jako splněný');
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
      pridejZmenuDoHistorie(pripadId, krokIdx, `Změna termínu na ${termin}`);
      return { ...pripad, kroky: noveKroky };
    }));
  };

  // Zápis změny do historie kroku
  function pridejZmenuDoHistorie(pripadId:number, krokIdx:number, zmena:string) {
    setPripady(pripady => pripady.map(pripad => {
      if (pripad.id !== pripadId) return pripad;
      const noveKroky = [...pripad.kroky];
      const krok = {...noveKroky[krokIdx]};
      const historie = krok.historie ? [...krok.historie] : [];
      historie.push({
        kdo: pripad.poradce,
        kdy: new Date().toISOString(),
        zmena
      });
      noveKroky[krokIdx] = {...krok, historie};
      return {...pripad, kroky: noveKroky};
    }));
  }

  // Průměrná doba od zadání do posledního splněného kroku (jen pro dokončené)
  const prumDoba = useMemo(() => {
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
  }, [pripady]);

  // Výpočet dat pro grafy
  const dokoncene = pripady.filter(p => !p.archivovano && p.kroky.every(k => k.splneno)).length;
  const rozpracovane = pripady.filter(p => !p.archivovano && !p.kroky.every(k => k.splneno)).length;
  const pipelineData = KROKY.slice(3).map((k, idx) => ({
    name: k,
    count: pripady.filter(p => !p.archivovano && p.aktualniKrok === idx).length
  }));
  const prumeryData = (() => {
    // Průměrná doba zpracování v jednotlivých měsících
    const hotove = pripady.filter(p => !p.archivovano && p.kroky.every(k => k.splneno));
    const byMonth: {[mesic:string]: number[]} = {};
    hotove.forEach(p => {
      const start = new Date(p.krok2.termin);
      const end = Math.max(...p.kroky.map(k => k.splnenoAt ? new Date(k.splnenoAt).getTime() : 0));
      if (!end) return;
      const ms = end - start.getTime();
      const dny = Math.round(ms / (1000*60*60*24));
      const mesic = start.toISOString().slice(0,7);
      if (!byMonth[mesic]) byMonth[mesic] = [];
      byMonth[mesic].push(dny);
    });
    return Object.entries(byMonth).map(([mesic, dnyArr]) => ({
      mesic,
      prumer: Math.round(dnyArr.reduce((a,b)=>a+b,0)/dnyArr.length)
    }));
  })();
  const heatmapData = (() => {
    // Počet termínů na každý den v měsíci
    const map: {[den:string]: number} = {};
    pripady.forEach(p => p.kroky.forEach(k => {
      if (k.termin) {
        map[k.termin] = (map[k.termin] || 0) + 1;
      }
    }));
    return Object.entries(map).map(([den, count]) => ({ den, count }));
  })();

  // Handler pro import z JSON (přes window event)
  useState(() => {
    const handler = (e: CustomEvent) => {
      if (Array.isArray(e.detail)) setPripady(e.detail);
    };
    window.addEventListener('importPripady', handler as EventListener);
    return () => window.removeEventListener('importPripady', handler as EventListener);
  });

  const isEmpty = !loading && pripady.length === 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Onboarding overlay (modal, step-by-step) */}
      {onboardingStep < onboardingSteps.length && (
        <Box sx={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:3000,background:'rgba(24,28,36,0.75)',display:'flex',alignItems:'center',justifyContent:'center'}}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          tabIndex={-1}
        >
          <Box sx={{background:'#fff',borderRadius:4,p:4,maxWidth:360,boxShadow:'0 8px 32px #1976d244',textAlign:'center'}}>
            <Typography id="onboarding-title" variant="h6" sx={{fontWeight:700,mb:2}}>{onboardingSteps[onboardingStep].title}</Typography>
            <Typography variant="body1" sx={{mb:3}}>{onboardingSteps[onboardingStep].desc}</Typography>
            <Button variant="contained" color="primary" onClick={()=>setOnboardingStep(s=>s+1)} sx={{mr:2}} autoFocus>Pokračovat</Button>
            <Button variant="text" color="secondary" onClick={()=>setOnboardingStep(onboardingSteps.length)}>Přeskočit</Button>
          </Box>
        </Box>
      )}
      <AppBar position="sticky" elevation={2} sx={{backdropFilter:'blur(8px)',background:themeMode==='dark'?'rgba(24,28,36,0.95)':'rgba(255,255,255,0.85)',color:themeMode==='dark'?'#fff':'#1976d2'}}>
        <Toolbar>
          <Typography variant="h5" sx={{flexGrow:1,fontWeight:700,letterSpacing:1}}>Správa hypoték</Typography>
          <Box sx={{display:'flex',alignItems:'center',gap:1}}>
            <Button color="inherit" size="small" onClick={()=>setThemeMode(m=>m==='light'?'dark':m==='dark'?'blue':m==='blue'?'high-contrast':'light')} sx={{fontWeight:600}}>
              {themeMode==='light'?'Světlý':themeMode==='dark'?'Tmavý':themeMode==='blue'?'Modrý':'Kontrastní'}
            </Button>
            <Button color="inherit" size="small" onClick={()=>setFontSize(f=>f==='normal'?'large':'normal')} sx={{fontWeight:600}}>
              {fontSize==='normal'?'Větší písmo':'Normální písmo'}
            </Button>
          </Box>
          <IconButton color="inherit" onClick={()=>setOnboardingStep(onboardingSteps.length-1)} sx={{ml:1}}>
            <Tooltip title="Nápověda a průvodce aplikací" arrow>
              <HelpOutlineIcon />
            </Tooltip>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{py: isMobile ? 1 : 4}}>
        {/* Loading skeletony */}
        {loading && (
          <Grid container spacing={3}>
            {[1,2,3].map(i => (
              <Grid item xs={12} key={i}>
                <Skeleton variant="rectangular" height={120} animation="wave" sx={{borderRadius:5,mb:2}} />
              </Grid>
            ))}
          </Grid>
        )}
        {/* Empty state */}
        {isEmpty && (
          <Box sx={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'40vh',gap:3,mt:6}}>
            <img src="/vite.svg" alt="Empty" width={90} style={{opacity:0.7}} />
            <Typography variant="h5" sx={{fontWeight:700}}>Zatím nemáte žádné případy</Typography>
            <Typography variant="body1" color="text.secondary">Přidejte první případ nebo importujte data.</Typography>
            <Button variant="contained" color="primary" size="large" onClick={()=>setOpenEditDialog(true)} sx={{fontWeight:600,px:4,py:1.2}}>Přidat případ</Button>
          </Box>
        )}
        <Box sx={{display:'flex',flexDirection:isMobile?'column':'row',gap:4}}>
          <Paper elevation={4} sx={{borderRadius:5,backdropFilter:'blur(8px)',background:themeMode==='dark'?'rgba(30,34,44,0.85)':'rgba(255,255,255,0.85)',p:isMobile?2:3,mb:3,minWidth:isMobile?'100%':'340px',maxWidth:'400px',flex:'0 0 340px',position:'sticky',top:isMobile?0:theme.spacing(2),zIndex:2}}>
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
            {pripady.filter(p => !p.archivovano).map(pripad => pripominkyDnes(pripad)).flat().length > 0 && (
              <Box className="notifikace-banner" sx={{mb:2,background:'linear-gradient(90deg,#fffbe7 60%,#ffe082 100%)',color:'#b26a00'}}>
                <b>Chytrá upozornění:</b>
                {pripady.filter(p => !p.archivovano).map(pripad => pripominkyDnes(pripad)).flat().map((upozorneni, idx) => (
                  <span key={idx} style={{marginLeft:8}}>{upozorneni}</span>
                ))}
              </Box>
            )}
            <Grid container spacing={isMobile ? 2 : 3}>
              {pripady.filter(p =>
                (zobrazArchivovane ? true : !p.archivovano) &&
                (aktivniPoradce ? p.poradce === aktivniPoradce : true) &&
                (stavKrokuFilter === '' || KROKY[p.aktualniKrok + 3] === stavKrokuFilter) &&
                (p.klient.toLowerCase().includes(search.toLowerCase()) ||
                p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
                (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
                )
              ).map(pripad => (
                <Grid item xs={12} key={pripad.id}>
                  <AnimatePresence>
                    <motion.div
                      whileHover={{ scale: 1.025, boxShadow: '0 8px 32px #1976d222' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      style={{ borderRadius: 20 }}
                    >
                      <Card elevation={6} sx={{borderRadius:5,mb:2,background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',boxShadow:'0 4px 24px #1976d211',backdropFilter:'blur(12px)'}}>
                        <CardContent>
                          <Box sx={{display:'flex',alignItems:'center',gap:2,mb:1,flexWrap:'wrap'}}>
                            <Avatar sx={{bgcolor:'#1976d2',width:40,height:40,fontWeight:700}}>{pripad.poradce?.[0] || '?'}</Avatar>
                            <Box sx={{flex:1}}>
                              <Typography variant="h6" sx={{fontWeight:600}}>{pripad.klient}</Typography>
                              <Typography variant="body2" color="text.secondary">Poradce: {pripad.poradce}</Typography>
                            </Box>
                            <Tooltip title="Upravit případ" arrow>
                              <span>
                                <IconButton color="primary" onClick={() => editovatPripad(pripad)} component={motion.button} whileHover={{scale:1.2,rotate:8}} whileTap={{scale:0.95,rotate:-8}}>
                                  <motion.span whileHover={{scale:1.2,rotate:8}} whileTap={{scale:0.95,rotate:-8}} style={{display:'inline-flex'}}>
                                    <EditIcon />
                                  </motion.span>
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Smazat případ" arrow>
                              <span>
                                <IconButton color="error" onClick={() => smazatPripad(pripad.id)} component={motion.button} whileHover={{scale:1.2,rotate:-8}} whileTap={{scale:0.95,rotate:8}}>
                                  <motion.span whileHover={{scale:1.2,rotate:-8}} whileTap={{scale:0.95,rotate:8}} style={{display:'inline-flex'}}>
                                    <DeleteIcon />
                                  </motion.span>
                                </IconButton>
                              </span>
                            </Tooltip>
                            {!pripad.archivovano ? (
                              <IconButton color="default" onClick={() => archivovatPripad(pripad.id)} component={motion.button} whileHover={{scale:1.2}} whileTap={{scale:0.95}}>
                                <motion.span whileHover={{scale:1.2}} whileTap={{scale:0.95}} style={{display:'inline-flex'}}>
                                  <ArchiveIcon />
                                </motion.span>
                              </IconButton>
                            ) : (
                              <IconButton color="primary" onClick={() => obnovitPripad(pripad.id)} component={motion.button} whileHover={{scale:1.2}} whileTap={{scale:0.95}}>
                                <motion.span whileHover={{scale:1.2}} whileTap={{scale:0.95}} style={{display:'inline-flex'}}>
                                  <UnarchiveIcon />
                                </motion.span>
                              </IconButton>
                            )}
                          </Box>
                          <Box sx={{my:2}}>
                            <Typography variant="subtitle2" color="primary" sx={{mb:1}}>Workflow</Typography>
                            <motion.div
                              initial={{ opacity: 0, x: 40 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, type: 'spring', bounce: 0.18 }}
                            >
                              <Stepper activeStep={pripad.aktualniKrok} orientation="vertical" sx={{background:'none'}}>
                                {pripad.kroky.map((krok, idx) => (
                                  <Step key={idx} completed={krok.splneno}>
                                    <StepLabel
                                      optional={krok.termin ? <span style={{color:'#1976d2',fontWeight:500}}>{krok.termin}</span> : undefined}
                                      sx={{display:'flex',alignItems:'center',gap:1}}
                                    >
                                      {krok.nazev}
                                      <Tooltip title="Historie změn kroku" arrow>
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="secondary"
                                            sx={{ml:1,opacity:0.7}}
                                            onClick={() => setHistoryDialog({krok,poradce:pripad.poradce,open:true})}
                                            aria-label="Zobrazit historii změn"
                                            component={motion.button}
                                            whileHover={{ scale: 1.2, rotate: 12 }}
                                            whileTap={{ scale: 0.95, rotate: -12 }}
                                          >
                                            <motion.span
                                              whileHover={{ scale: 1.3, rotate: 20 }}
                                              whileTap={{ scale: 0.9, rotate: -20 }}
                                              style={{ display: 'inline-flex' }}
                                            >
                                              <HistoryIcon fontSize="small" />
                                            </motion.span>
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </StepLabel>
                                    <motion.div
                                      key={krok.splneno ? 'splneno' : 'nesplneno'}
                                      initial={{ scale: 0.98, opacity: 0.7 }}
                                      animate={krok.splneno ? { scale: 1.04, opacity: 1, backgroundColor: '#e8f5e9' } : { scale: 1, opacity: 1, backgroundColor: '#fff' }}
                                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                      style={{ borderRadius: 12, padding: 0 }}
                                    >
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
                                              pridejZmenuDoHistorie(pripad.id, idx, `Změna poznámky na "${e.target.value}"`);
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
                                        <MUITextField
                                          size="small"
                                          type="number"
                                          label="Připomenout za (dní)"
                                          value={krok.pripomenoutZa || ''}
                                          onChange={e => {
                                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                                            setPripady(pripady.map(p => {
                                              if (p.id !== pripad.id) return p;
                                              const noveKroky = [...p.kroky];
                                              noveKroky[idx] = { ...noveKroky[idx], pripomenoutZa: val };
                                              return { ...p, kroky: noveKroky };
                                            }));
                                            pridejZmenuDoHistorie(pripad.id, idx, `Nastavena připomínka za ${e.target.value} dní`);
                                          }}
                                          sx={{mb:1,minWidth:120}}
                                          inputProps={{min:1,max:365}}
                                        />
                                        <MUITextField
                                          size="small"
                                          type="date"
                                          label="Připomenout v den"
                                          value={krok.pripomenoutDatum || ''}
                                          onChange={e => {
                                            setPripady(pripady.map(p => {
                                              if (p.id !== pripad.id) return p;
                                              const noveKroky = [...p.kroky];
                                              noveKroky[idx] = { ...noveKroky[idx], pripomenoutDatum: e.target.value };
                                              return { ...p, kroky: noveKroky };
                                            }));
                                            pridejZmenuDoHistorie(pripad.id, idx, `Nastavena připomínka na datum ${e.target.value}`);
                                          }}
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
                                        <Box sx={{my:1}}>
                                          <Box
                                            sx={{border:'2px dashed #1976d2',borderRadius:2,p:2,mb:1,background:'#f5faff',textAlign:'center',cursor:'pointer',transition:'background 0.2s'}}
                                            onDragOver={e=>e.preventDefault()}
                                            onDrop={e=>{
                                              e.preventDefault();
                                              const files = Array.from(e.dataTransfer.files);
                                              if (!files.length) return;
                                              setPripady(pripady.map(p => {
                                                if (p.id !== pripad.id) return p;
                                                const noveKroky = [...p.kroky];
                                                const krok = {...noveKroky[idx]};
                                                krok.attachments = krok.attachments || [];
                                                files.forEach(file => {
                                                  const url = URL.createObjectURL(file);
                                                  krok.attachments!.push({
                                                    id: Math.random().toString(36).slice(2),
                                                    name: file.name,
                                                    type: file.type,
                                                    url
                                                  });
                                                });
                                                noveKroky[idx] = krok;
                                                return {...p, kroky: noveKroky};
                                              }));
                                              showSnackbar('Příloha byla přidána', 'success');
                                            }}
                                          >
                                            Přetáhněte soubory sem pro nahrání příloh
                                          </Box>
                                          {krok.attachments && krok.attachments.length > 0 && (
                                            <Box sx={{display:'flex',flexWrap:'wrap',gap:2}}>
                                              {krok.attachments.map(att => (
                                                <Box key={att.id} sx={{border:'1px solid #ddd',borderRadius:2,p:1,minWidth:120,maxWidth:180,background:'#fff',boxShadow:'0 2px 8px #1976d211',position:'relative'}}>
                                                  {att.type.startsWith('image/') ? (
                                                    <img src={att.url} alt={att.name} style={{maxWidth:'100%',maxHeight:80,borderRadius:8}} />
                                                  ) : att.type==='application/pdf' ? (
                                                    <embed src={att.url} type="application/pdf" width="100%" height="80px" style={{borderRadius:8}} />
                                                  ) : (
                                                    <Typography variant="caption" color="text.secondary">{att.name}</Typography>
                                                  )}
                                                  <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mt:1}}>
                                                    <Button size="small" href={att.url} download={att.name} variant="outlined">Stáhnout</Button>
                                                    <Button size="small" color="error" variant="text" onClick={()=>{
                                                      setPripady(pripady.map(p => {
                                                        if (p.id !== pripad.id) return p;
                                                        const noveKroky = [...p.kroky];
                                                        const krok = {...noveKroky[idx]};
                                                        krok.attachments = krok.attachments?.filter(a => a.id !== att.id);
                                                        noveKroky[idx] = krok;
                                                        return {...p, kroky: noveKroky};
                                                      }));
                                                      showSnackbar('Příloha byla odstraněna', 'info');
                                                    }}>Smazat</Button>
                                                  </Box>
                                                </Box>
                                              ))}
                                            </Box>
                                          )}
                                        </Box>
                                      </StepContent>
                                    </motion.div>
                                  </Step>
                                ))}
                              </Stepper>
                            </motion.div>
                            {isMobile && (
                              <Button variant="contained" color="primary" size="small" sx={{mb:1}} onClick={()=>setOpenWorkflowSheet(pripad.id)}>
                                Workflow
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </Grid>
              ))}
            </Grid>
            {/* Přepínače pro zobrazení sekcí dashboardu */}
            <FormGroup row sx={{mb:2,gap:2}}>
              <FormControlLabel control={<Switch checked={dashboardPrefs.showSuccess} onChange={e=>setDashboardPrefs((p:any)=>({...p,showSuccess:e.target.checked}))} />} label="Úspěšnost" />
              <FormControlLabel control={<Switch checked={dashboardPrefs.showPipeline} onChange={e=>setDashboardPrefs((p:any)=>({...p,showPipeline:e.target.checked}))} />} label="Pipeline" />
              <FormControlLabel control={<Switch checked={dashboardPrefs.showAvgTime} onChange={e=>setDashboardPrefs((p:any)=>({...p,showAvgTime:e.target.checked}))} />} label="Průměrná doba" />
              <FormControlLabel control={<Switch checked={dashboardPrefs.showHeatmap} onChange={e=>setDashboardPrefs((p:any)=>({...p,showHeatmap:e.target.checked}))} />} label="Heatmapa termínů" />
            </FormGroup>
            {/* Grafy */}
            <Box sx={{my:3,display:'flex',flexDirection:'column',gap:3}}>
              {/* Úspěšnost: dokončené vs. rozpracované */}
              {dashboardPrefs.showSuccess && (
                <Card elevation={3} sx={{borderRadius:4,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:2}}>
                  <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>Úspěšnost případů</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[{name:'Dokončené',hodnota:dokoncene},{name:'Rozpracované',hodnota:rozpracovane}]}
                      margin={{top:10,right:20,left:0,bottom:0}}>
                      <XAxis dataKey="name"/>
                      <YAxis allowDecimals={false}/>
                      <RechartsTooltip/>
                      <Bar dataKey="hodnota" fill="#1976d2" radius={[8,8,0,0]}>
                        <LabelList dataKey="hodnota" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {/* Pipeline (funnel) */}
              {dashboardPrefs.showPipeline && (
                <Card elevation={3} sx={{borderRadius:4,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:2}}>
                  <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>Pipeline (počet případů v jednotlivých fázích)</Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={pipelineData} layout="vertical" margin={{left:20}}>
                      <XAxis type="number" allowDecimals={false}/>
                      <YAxis dataKey="name" type="category" width={160}/>
                      <RechartsTooltip/>
                      <Bar dataKey="count" fill="#ffa000" radius={[0,8,8,0]}>
                        <LabelList dataKey="count" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {/* Průměrná doba zpracování v čase */}
              {dashboardPrefs.showAvgTime && (
                <Card elevation={3} sx={{borderRadius:4,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:2}}>
                  <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>Průměrná doba zpracování (dní podle měsíce)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={prumeryData} margin={{top:10,right:20,left:0,bottom:0}}>
                      <XAxis dataKey="mesic"/>
                      <YAxis allowDecimals={false}/>
                      <RechartsTooltip/>
                      <Bar dataKey="prumer" fill="#43a047" radius={[8,8,0,0]}>
                        <LabelList dataKey="prumer" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {/* Heatmapa termínů */}
              {dashboardPrefs.showHeatmap && (
                <Card elevation={3} sx={{borderRadius:4,backdropFilter:'blur(8px)',background:'rgba(255,255,255,0.85)',p:2}}>
                  <Typography variant="subtitle1" sx={{fontWeight:600,mb:1}}>Heatmapa termínů (počet termínů na den)</Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={heatmapData} margin={{top:10,right:20,left:0,bottom:0}}>
                      <XAxis dataKey="den" angle={-45} textAnchor="end" height={60}/>
                      <YAxis allowDecimals={false}/>
                      <RechartsTooltip/>
                      <Bar dataKey="count" fill="#e53935" radius={[8,8,0,0]}>
                        <LabelList dataKey="count" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
      {/* FAB pro mobilní přidání případu */}
      {isMobile && (
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 1200 }}
          >
            <Fab color="primary" aria-label="Přidat případ" sx={{boxShadow:'0 4px 24px #1976d244'}} onClick={()=>setOpenEditDialog(true)}>
              <AddCircleIcon fontSize="large" />
            </Fab>
          </motion.div>
        </AnimatePresence>
      )}
      {/* BottomNavigation pro mobil */}
      {isMobile && (
        <BottomNavigation
          value={bottomNav}
          onChange={(_e, newValue) => setBottomNav(newValue)}
          showLabels
          sx={{position:'fixed',bottom:0,left:0,right:0,zIndex:1200,backdropFilter:'blur(8px)',background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',boxShadow:'0 -2px 16px #1976d211'}}
        >
          <BottomNavigationAction label="Případy" value="cases" icon={<ListAltIcon />} />
          <BottomNavigationAction label="Přehled" value="dashboard" icon={<RestoreIcon />} />
        </BottomNavigation>
      )}
      {/* Snackbar pro toast notifikace */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 2000, display: 'flex', justifyContent: 'center' }}
          >
            <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={()=>setSnackbar(s=>({...s,open:false}))} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
              <MuiAlert elevation={6} variant="filled" onClose={()=>setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{fontWeight:500,letterSpacing:0.2}}>
                {snackbar.message}
              </MuiAlert>
            </Snackbar>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dialog pro editaci případu */}
      <AnimatePresence>
        {openEditDialog && (
          <Dialog
            open={openEditDialog}
            onClose={() => setOpenEditDialog(false)}
            TransitionComponent={Transition}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx:{backdropFilter:'blur(12px)',background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',boxShadow:'0 8px 32px #1976d244'},
              role: 'dialog',
              'aria-modal': true,
              'aria-label': 'Upravit případ',
            }}
          >
            <DialogTitle>Upravit případ</DialogTitle>
            <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,py:2}}>
              <TextField label="Klient" value={novyKlient} onChange={e=>setNovyKlient(e.target.value)} fullWidth size="small" />
              <TextField label="Poradce" value={novyPoradce} onChange={e=>setNovyPoradce(e.target.value)} fullWidth size="small" />
              <TextField label="Co financuje" value={krok1Co} onChange={e=>setKrok1Co(e.target.value)} fullWidth size="small" />
              <TextField label="Částka" value={krok1Castka} onChange={e=>setKrok1Castka(e.target.value)} fullWidth size="small" />
              <TextField label="Popis" value={krok1Popis} onChange={e=>setKrok1Popis(e.target.value)} fullWidth size="small" />
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
        )}
      </AnimatePresence>
      {/* Dialog pro historii změn kroku */}
      <AnimatePresence>
        {historyDialog.open && (
          <Dialog
            open={historyDialog.open}
            onClose={()=>setHistoryDialog({open:false})}
            TransitionComponent={Transition}
            maxWidth="xs"
            PaperProps={{
              sx:{backdropFilter:'blur(12px)',background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',boxShadow:'0 8px 32px #1976d244'},
              role: 'dialog',
              'aria-modal': true,
              'aria-label': 'Historie změn kroku',
            }}
          >
            <DialogTitle sx={{display:'flex',alignItems:'center',gap:1}}>
              <HistoryIcon color="secondary" sx={{mr:1}} />
              Historie změn kroku
            </DialogTitle>
            <DialogContent sx={{minWidth:260}}>
              {historyDialog.krok?.historie && historyDialog.krok.historie.length > 0 ? (
                <Box sx={{display:'flex',flexDirection:'column',gap:2,mt:1}}>
                  {historyDialog.krok.historie.map((z,idx) => (
                    <motion.div
                      key={idx}
                      initial={{opacity:0,y:10}}
                      animate={{opacity:1,y:0}}
                      exit={{opacity:0,y:10}}
                      transition={{duration:0.25,delay:idx*0.05}}
                      style={{background:'#f5f5fa',borderRadius:8,padding:'8px 12px',boxShadow:'0 2px 8px #1976d211'}}
                    >
                      <Typography variant="body2" sx={{fontWeight:600}}>{z.kdo}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(z.kdy).toLocaleString('cs-CZ')}</Typography>
                      <Typography variant="body2" sx={{mt:0.5}}>{z.zmena}</Typography>
                    </motion.div>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{mt:2}}>Žádné změny</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setHistoryDialog({open:false})} color="primary">Zavřít</Button>
            </DialogActions>
          </Dialog>
        )}
      </AnimatePresence>
      {/* Dialog pro potvrzení smazání */}
      <Dialog
        open={openDeleteDialog}
        onClose={()=>setOpenDeleteDialog(false)}
        TransitionComponent={Transition}
        maxWidth="xs"
        PaperProps={{
          sx:{backdropFilter:'blur(8px)',background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)'},
          role: 'alertdialog',
          'aria-modal': true,
          'aria-label': 'Potvrzení smazání',
        }}
      >
        <DialogTitle>Opravdu smazat případ?</DialogTitle>
        <DialogActions>
          <Button onClick={()=>setOpenDeleteDialog(false)} color="secondary">Zrušit</Button>
          <Button onClick={()=>{setOpenDeleteDialog(false);}} color="error" variant="contained">Smazat</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog pro workflow kroky na mobilu */}
      <Dialog
        open={!!openWorkflowSheet}
        onClose={()=>setOpenWorkflowSheet(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx:{
            position:'fixed',
            m:0,
            bottom:0,
            left:0,
            right:0,
            borderTopLeftRadius:18,
            borderTopRightRadius:18,
            background:themeMode==='dark'?'rgba(30,34,44,0.97)':'rgba(255,255,255,0.97)',
            boxShadow:'0 -8px 32px #1976d244',
            minHeight:'40vh',
            maxHeight:'80vh',
            overflow:'auto',
            touchAction:'pan-y'
          },
          role: 'dialog',
          'aria-modal': true,
          'aria-label': 'Workflow kroky',
        }}
        TransitionComponent={Transition}
        tabIndex={-1}
      >
        <DialogTitle sx={{textAlign:'center',fontWeight:700}}>Workflow</DialogTitle>
        <DialogContent>
          {pripady.filter(p=>p.id===openWorkflowSheet).map(pripad=>(
            <Stepper key={pripad.id} activeStep={pripad.aktualniKrok} orientation="vertical" sx={{background:'none'}}>
              {pripad.kroky.map((krok, idx) => (
                <Step key={idx} completed={krok.splneno}>
                  <StepLabel>{krok.nazev}</StepLabel>
                  <StepContent>
                    {/* ...stejný obsah jako v Card... */}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenWorkflowSheet(null)} color="primary">Zavřít</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
