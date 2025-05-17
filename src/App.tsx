import React, { useState, useMemo, Suspense, lazy } from 'react';
import './App.css';
import notificationSound from './assets/notification.mp3';
import type { TransitionProps } from '@mui/material/transitions';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, IconButton, Container, Box, Snackbar, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Slide, Stepper, Step, StepLabel, StepContent, Grid, Fab } from '@mui/material';
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
import type { PripadHypoteky, KrokPripadu } from './types';
import { bliziciSeTerminy } from './utils';

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
const DeleteDialog = lazy(() => import('./DeleteDialog'));

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

  // Odstranění nepoužívané funkce pridejZmenuDoHistorie, pokud není volána mimo původní Card rendering.
  // Pokud bude potřeba, přesunout do samostatného souboru nebo předat jako prop.

  const isEmpty = pripady.length === 0;

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
          <Dashboard
            pripady={pripady}
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
          />
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
                  {historyDialog.krok.historie.map((z: any, idx: number) => (
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
      <Suspense fallback={null}>
        <WorkflowDialog
          open={!!openWorkflowSheet}
          onClose={() => setOpenWorkflowSheet(null)}
          pripad={pripady.find(p => p.id === openWorkflowSheet) || undefined}
          themeMode={themeMode}
        />
      </Suspense>
      <Suspense fallback={null}>
        <DeleteDialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          onDelete={() => {
            setPripady(pripady.filter(p => p.id !== null));
            setOpenDeleteDialog(false);
          }}
          themeMode={themeMode}
        />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
