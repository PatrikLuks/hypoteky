import React, { useState, useMemo, Suspense, lazy } from 'react';
import './App.css';
import notificationSound from './assets/notification.mp3';
import type { TransitionProps } from '@mui/material/transitions';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, IconButton, Container, Box, Snackbar, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Slide, Grid, Fab } from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MuiAlert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '@mui/material/Skeleton';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';
import Dashboard from './Dashboard';
import type { PripadHypoteky, KrokPripadu, DemoUser } from './types';
import { bliziciSeTerminy, registerDemoUser, loginDemoUser, logoutDemoUser, getCurrentDemoUser, addUndoEntry } from './utils';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

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

// Typy interface KrokZmena, Attachment, KrokPripadu jsou nyní v types.ts, zde je odstraňuji

// Funkce pro upozornění na blížící se termíny (do 7 dnů) přesunuta do utils.ts
// function bliziciSeTerminy(pripad: PripadHypoteky) {
//   const dnes = new Date(); // aktuální datum dynamicky
//   const limit = new Date(dnes);
//   limit.setDate(dnes.getDate() + 7);
//   const upozorneni: string[] = [];
//   if (pripad.krok2.termin) {
//     const t = new Date(pripad.krok2.termin);
//     if (t > dnes && t <= limit) upozorneni.push(`Návrh financování: ${pripad.krok2.termin}`);
//   }
//   pripad.kroky.forEach((krok) => {
//     if (krok.termin) {
//       const t = new Date(krok.termin);
//       if (!krok.splneno && t > dnes && t <= limit) {
//         upozorneni.push(`${krok.nazev}: ${krok.termin}`);
//       }
//     }
//   });
//   return upozorneni;
// }

// Odstranění funkce pripominkyDnes, pokud není nikde volána v App.tsx (případně přesunout do utilit, pokud bude potřeba).

const EditDialog = lazy(() => import('./EditDialog'));
const WorkflowDialog = lazy(() => import('./WorkflowDialog'));

function App() {
  const { t, i18n } = useTranslation();
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
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity?: AlertColor}>({open: false, message: ''});
  const [bottomNav, setBottomNav] = useState('cases');
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState<{krok?:KrokPripadu, poradce?:string, open:boolean}>({open:false});
  const [openWorkflowSheet, setOpenWorkflowSheet] = useState<number|null>(null);
  const [bankaFilter, setBankaFilter] = useState('');
  const [terminFilter, setTerminFilter] = useState('');

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

  // Uložení editovaného případu s auditem a undo
  const ulozitEditaci = () => {
    if (editId === null) return;
    const vybranaBanka = krok3Banka === 'Další (ručně)' ? krok3Vlastni : krok3Banka;
    setPripady(pripady => pripady.map(p => {
      if (p.id !== editId) return p;
      const prev = { ...p };
      const novy = {
        ...p,
        klient: novyKlient,
        poradce: novyPoradce,
        poznamka,
        krok1: { co: krok1Co, castka: krok1Castka, popis: krok1Popis },
        krok2: { termin: krok2Termin, urok: krok2Urok },
        krok3: { banka: vybranaBanka },
        kroky: p.kroky.map((krok, idx) => {
          if (idx === p.aktualniKrok) {
            // Detailní audit změny
            const predchozi = { ...krok };
            const nove = {
              nazev: krok.nazev,
              termin: krok2Termin,
              splneno: krok.splneno,
              poznamka: krok.poznamka,
              splnenoAt: krok.splnenoAt,
              historie: krok.historie,
              pripomenoutZa: krok.pripomenoutZa,
              pripomenoutDatum: krok.pripomenoutDatum,
              attachments: krok.attachments
            };
            if (!krok.historie) krok.historie = [];
            krok.historie.push({ kdo: novyPoradce, kdy: new Date().toISOString(), zmena: 'Úprava kroku', predchozi, nove });
          }
          return krok;
        }),
        aktualniKrok: p.aktualniKrok
      };
      addUndoEntry(novy, prev, novyPoradce, 'Editace případu');
      return novy;
    }));
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

  const exportToExcel = () => {
    const data = pripady.map(p => ({
      ...p,
      attachments: (p.kroky?.flatMap(k=>k.attachments||[]).map(a=>`${a.name}|${a.url}`) || []).join(';')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pripady');
    XLSX.writeFile(wb, `pripady-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const imported = rows.map((r: Record<string, unknown>) => {
        const pripad = { ...r } as PripadHypoteky;
        if (typeof pripad.attachments === 'string') {
          // Rozparsovat přílohy zpět do pole
          pripad.kroky = pripad.kroky || [];
          const atts = (pripad.attachments as string).split(';').filter(Boolean).map((a: string) => {
            const [name, url] = a.split('|');
            return { id: Math.random().toString(36).slice(2), name, url, type: '' };
          });
          if (atts.length) {
            if (!pripad.kroky[0]) pripad.kroky[0] = {} as any;
            pripad.kroky[0].attachments = atts;
          }
        }
        return pripad;
      });
      // Hromadný import: aktualizace nebo přidání podle ID
      setPripady(prev => {
        const ids = new Set(imported.map((p) => p.id));
        const filtered = prev.filter(p=>!ids.has(p.id));
        return [...filtered, ...imported];
      });
      showSnackbar('Import z Excelu proběhl úspěšně', 'success');
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToJSON = () => {
    const data = JSON.stringify(pripady, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, `pripady-${new Date().toISOString().slice(0,10)}.json`);
  };

  const importFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string) as PripadHypoteky[];
        setPripady(prev => {
          const ids = new Set(imported.map((p)=>p.id));
          const filtered = prev.filter(p=>!ids.has(p.id));
          return [...filtered, ...imported];
        });
        showSnackbar('Import z JSON proběhl úspěšně', 'success');
      } catch {
        showSnackbar('Chyba při importu JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const isEmpty = pripady.length === 0;

  // Kombinované filtrování případů
  const filtrovanePripady = useMemo(() => {
    return pripady.filter(p => {
      if (!zobrazArchivovane && p.archivovano) return false;
      if (aktivniPoradce && p.poradce !== aktivniPoradce) return false;
      if (stavKrokuFilter && KROKY[p.aktualniKrok + 3] !== stavKrokuFilter) return false;
      if (bankaFilter && (p.krok3?.banka || '').toLowerCase() !== bankaFilter.toLowerCase()) return false;
      if (terminFilter) {
        // Porovnávej pouze rok-měsíc-den (YYYY-MM-DD)
        const t = (p.krok2?.termin || '').slice(0,10);
        if (t !== terminFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (!(
          p.klient.toLowerCase().includes(s) ||
          p.poradce.toLowerCase().includes(s) ||
          (p.krok3?.banka || '').toLowerCase().includes(s) ||
          (p.poznamka || '').toLowerCase().includes(s)
        )) return false;
      }
      return true;
    });
  }, [pripady, zobrazArchivovane, aktivniPoradce, stavKrokuFilter, bankaFilter, terminFilter, search]);

  // Autentizace
  const [authUser, setAuthUser] = useState<DemoUser | null>(() => getCurrentDemoUser());
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  React.useEffect(() => {
    // Požádat o povolení notifikací při načtení
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!window.Notification || Notification.permission !== 'granted') return;
    // Zabránit opakovaným notifikacím v jednom dni
    const today = new Date().toISOString().slice(0, 10);
    const notifiedKey = 'notified-' + today;
    if (localStorage.getItem(notifiedKey)) return;
    const blizici = pripady.filter(p => bliziciSeTerminy(p).length > 0);
    if (blizici.length > 0) {
      new Notification('Blíží se termín!', {
        body: `Máte ${blizici.length} případ(ů) s blížícím se termínem.`,
        icon: '/vite.svg'
      });
      localStorage.setItem(notifiedKey, '1');
    }
  }, [pripady]);

  // --- návratová část ---
  return (
    !authUser ? (
      <Container maxWidth="xs" sx={{mt:8}}>
        <Box sx={{p:4,boxShadow:3,borderRadius:3,background:'#fff',display:'flex',flexDirection:'column',gap:2}}>
          <Typography variant="h5" sx={{fontWeight:700,mb:2}}>{t(authMode==='login'?'login':'register')}</Typography>
          <input type="text" placeholder={t('username')} value={authUsername} onChange={e=>setAuthUsername(e.target.value)} style={{padding:8,borderRadius:4,border:'1px solid #ccc'}} />
          <input type="password" placeholder={t('password')} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} style={{padding:8,borderRadius:4,border:'1px solid #ccc'}} />
          {authError && <Typography color="error" variant="body2">{authError}</Typography>}
          {authMode==='login' ? (
            <Button variant="contained" color="primary" onClick={() => {
              const user = loginDemoUser(authUsername, authPassword);
              if (user) {
                setAuthUser(user);
                setAuthError('');
              } else {
                setAuthError(t('login.error') || 'Neplatné jméno nebo heslo');
              }
            }}>{t('login')}</Button>
          ) : (
            <Button variant="contained" color="primary" onClick={() => {
              if (!authUsername || !authPassword) {
                setAuthError(t('register.fill') || 'Vyplňte jméno i heslo');
                return;
              }
              const ok = registerDemoUser({ username: authUsername, password: authPassword, role: 'poradce' });
              if (ok) {
                setAuthMode('login');
                setAuthError(t('register.success') || 'Registrace úspěšná, nyní se přihlaste');
              } else {
                setAuthError(t('register.exists') || 'Uživatel již existuje');
              }
            }}>{t('register')}</Button>
          )}
          <Button color="secondary" onClick={()=>{setAuthMode(m=>m==='login'?'register':'login');setAuthError('');}}>
            {authMode==='login'?t('register'):t('login')}
          </Button>
        </Box>
      </Container>
    ) : (
      <>
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
              <Typography variant="h5" sx={{flexGrow:1,fontWeight:700,letterSpacing:1}}>{t('app.title')}</Typography>
              <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                <Button color="inherit" size="small" onClick={()=>setThemeMode(m=>m==='light'?'dark':m==='dark'?'blue':m==='blue'?'high-contrast':'light')} sx={{fontWeight:600}}>
                  {themeMode==='light'?'Světlý':themeMode==='dark'?'Tmavý':themeMode==='blue'?'Modrý':'Kontrastní'}
                </Button>
                <Button color="inherit" size="small" onClick={()=>setFontSize(f=>f==='normal'?'large':'normal')} sx={{fontWeight:600}}>
                  {fontSize==='normal'?'Větší písmo':'Normální písmo'}
                </Button>
                <Button color="inherit" size="small" onClick={()=>{logoutDemoUser();setAuthUser(null);}} sx={{fontWeight:600}}>Odhlásit</Button>
                <Button color="inherit" size="small" onClick={()=>i18n.changeLanguage(i18n.language==='cs'?'en':'cs')} sx={{fontWeight:600}}>
                  {i18n.language==='cs'?'EN':'CZ'}
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
                <Typography variant="h5" sx={{fontWeight:700}}>{t('no.cases')}</Typography>
                <Typography variant="body1" color="text.secondary">{t('add.first.case')}</Typography>
                <Button variant="contained" color="primary" size="large" onClick={()=>setOpenEditDialog(true)} sx={{fontWeight:600,px:4,py:1.2}}>{t('add.case')}</Button>
              </Box>
            )}
            <Box sx={{display:'flex',flexDirection:isMobile?'column':'row',gap:4}}>
              <Dashboard
                pripady={filtrovanePripady}
                KROKY={KROKY}
                poradci={poradci}
                aktivniPoradce={aktivniPoradce}
                setAktivniPoradce={setAktivniPoradce}
                stavKrokuFilter={stavKrokuFilter}
                setStavKrokuFilter={setStavKrokuFilter}
                zobrazArchivovane={zobrazArchivovane}
                setZobrazArchivovane={setZobrazArchivovane}
                dashboardPrefs={dashboardPrefs}
                setDashboardPrefs={setDashboardPrefs}
                isMobile={isMobile}
                search={search}
                setSearch={setSearch}
                bankaFilter={bankaFilter}
                setBankaFilter={setBankaFilter}
                terminFilter={terminFilter}
                setTerminFilter={setTerminFilter}
              />
            </Box>
            {/* Tlačítka pro export/import */}
            <Box sx={{display:'flex',gap:2,mt:4,mb:2,justifyContent:'center'}}>
              <Button variant="outlined" onClick={exportToExcel}>{t('export.excel')}</Button>
              <Button variant="outlined" component="label">{t('import.excel')}
                <input type="file" accept=".xlsx" hidden onChange={importFromExcel} />
              </Button>
              <Button variant="outlined" onClick={exportToJSON}>{t('export.json')}</Button>
              <Button variant="outlined" component="label">{t('import.json')}
                <input type="file" accept=".json" hidden onChange={importFromJSON} />
              </Button>
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
          <Suspense fallback={null}>
            <EditDialog
              open={openEditDialog}
              onClose={() => setOpenEditDialog(false)}
              onSave={ulozitEditaci}
              pripad={pripady.find(p => p.id === editId) || undefined}
              banky={BANKY}
              themeMode={themeMode}
            />
          </Suspense>
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
                      {historyDialog.krok.historie.map((z, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{opacity:0,y:10}}
                          animate={{opacity:1,y:0}}
                          exit={{opacity:0,y:10}}
                          transition={{duration:0.3}}
                          style={{display:'flex',alignItems:'center',gap:1}}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{whiteSpace:'nowrap'}}>
                            {new Date(z.kdy).toLocaleString('cs-CZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </Typography>
                          <Typography variant="body2" sx={{flexGrow:1,overflowWrap:'break-word'}}>
                            {z.zmena}
                          </Typography>
                        </motion.div>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
                      Žádné změny nebyly nalezeny.
                    </Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={()=>setHistoryDialog({open:false})} color="primary">
                    Zavřít
                  </Button>
                </DialogActions>
              </Dialog>
            )}
          </AnimatePresence>
          {/* Dialog pro workflow případu (kroky) */}
          <Suspense fallback={null}>
            <WorkflowDialog
              open={openWorkflowSheet !== null}
              onClose={() => setOpenWorkflowSheet(null)}
              pripad={pripady.find(p => p.id === openWorkflowSheet) || undefined}
              themeMode={themeMode}
            />
          </Suspense>
        </ThemeProvider>
      </>
    )
  );
}

export default App;
