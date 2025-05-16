import { useState } from 'react';
import './App.css';
import notificationSound from './assets/notification.mp3';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// Pomocná funkce pro formátování čísel s oddělením po 3 cifrách
function formatCislo(cislo: string) {
  if (!cislo) return '';
  const num = Number(cislo);
  if (isNaN(num)) return cislo;
  return num.toLocaleString('cs-CZ');
}

// Pomocná funkce pro automatické generování termínů
function generujTerminy(vychoziDatum: string, pocetKroku: number, intervalDni = 7) {
  const terminy: string[] = [];
  let datum = new Date(vychoziDatum); // eslint-disable-line prefer-const
  for (let i = 0; i < pocetKroku; i++) {
    datum.setDate(datum.getDate() + intervalDni);
    terminy.push(datum.toISOString().slice(0, 10));
  }
  return terminy;
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

// Zvýraznění aktuálního kroku
const getKrokClass = (pripad: PripadHypoteky, idx: number) => {
  if (idx === pripad.aktualniKrok) return 'krok-aktualni';
  if (idx < pripad.aktualniKrok) return 'krok-hotovo';
  return '';
};

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
  const [zobrazChybu, setZobrazChybu] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [searchPoradce, setSearchPoradce] = useState('');
  const [zvukAbsolvovany, setZvukAbsolvovany] = useState(false);
  const [stavKrokuFilter, setStavKrokuFilter] = useState('');
  const [zobrazArchivovane, setZobrazArchivovane] = useState(false);
  const [aktivniPoradce, setAktivniPoradce] = useState('');

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

  // Funkce pro výpočet vlastních připomenutí
  function vlastniPripomenuti(pripad: PripadHypoteky) {
    const dnes = new Date('2025-05-16');
    const upozorneni: string[] = [];
    pripad.kroky.forEach((krok) => {
      if (krok.termin && krok.pripomenoutZa && !krok.splneno) {
        const datumKroku = new Date(krok.termin);
        const datumPripomenuti = new Date(datumKroku);
        datumPripomenuti.setDate(datumKroku.getDate() - krok.pripomenoutZa);
        if (dnes >= datumPripomenuti && dnes < datumKroku) {
          upozorneni.push(`${krok.nazev}: připomenutí za ${krok.pripomenoutZa} dní před termínem (${krok.termin})`);
        }
      }
    });
    return upozorneni;
  }

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
    };
    reader.readAsText(file);
  }

  // Přidání nového případu
  const pridejPripad = () => {
    setZobrazChybu(false);
    const vybranaBanka = krok3Banka === 'Další (ručně)' ? krok3Vlastni : krok3Banka;
    // Pokud je zadán termín návrhu, vygeneruj automaticky termíny pro další kroky (krok 4+)
    let noveKroky = KROKY.slice(3).map((nazev) => ({
      nazev,
      termin: '',
      splneno: false,
      splnenoAt: undefined,
      poznamka: ''
    }));
    if (krok2Termin) {
      const terminy = generujTerminy(krok2Termin, noveKroky.length);
      noveKroky = noveKroky.map((k, i) => ({ ...k, termin: terminy[i] }));
    }
    setPripady([
      ...pripady,
      {
        id: pripady.length + 1,
        klient: novyKlient,
        poradce: novyPoradce,
        aktualniKrok: 0,
        krok1: { co: krok1Co, castka: krok1Castka, popis: krok1Popis },
        krok2: { termin: krok2Termin, urok: krok2Urok },
        krok3: { banka: vybranaBanka },
        kroky: noveKroky,
        poznamka: poznamka || undefined,
        archivovano: false
      },
    ]);
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
  };

  // Smazání případu
  const smazatPripad = (id: number) => {
    setPripady(pripady.filter(p => p.id !== id));
  };

  // Archivace případu
  const archivovatPripad = (id: number) => {
    setPripady(pripady.map(p => p.id === id ? { ...p, archivovano: true } : p));
  };

  const obnovitPripad = (id: number) => {
    setPripady(pripady.map(p => p.id === id ? { ...p, archivovano: false } : p));
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

  // Přesun na předchozí/další krok
  const posunKrok = (pripadId: number, novyKrok: number) => {
    setPripady(pripady.map(pripad => {
      if (pripad.id !== pripadId) return pripad;
      return { ...pripad, aktualniKrok: novyKrok };
    }));
  };

  // Export přehledu případu do PDF
  const exportPripadPDF = async (pripadId: number) => {
    const el = document.getElementById('pripad-pdf-'+pripadId);
    if (!el) return;
    const canvas = await html2canvas(el, {scale:2, useCORS:true});
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({orientation:'p',unit:'pt',format:'a4'});
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth-40;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save('pripad-'+pripadId+'.pdf');
  };

  // Data pro graf: rozložení případů podle aktuálního kroku
  const rozlozeniKroku = KROKY.slice(3).map((k, idx) => ({
    krok: `${idx+4}. ${k}`,
    pocet: pripady.filter(p => !p.archivovano && p.aktualniKrok === idx).length
  }));

  // Data pro graf: rozložení případů podle banky
  const rozlozeniBanky = Array.from(new Set(pripady.map(p => p.krok3.banka))).map(banka => ({
    banka,
    pocet: pripady.filter(p => p.krok3.banka === banka && !p.archivovano).length
  })).filter(b => b.pocet > 0);

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
    <div className="container">
      <h1>Správa hypoték</h1>
      {/* Simulace e-mailového upozornění/banner */}
      {pocetBlizicich > 0 && (
        <div className="notifikace-banner">
          <b>Upozornění:</b> Máš {pocetBlizicich} případ{pocetBlizicich === 1 ? '' : pocetBlizicich < 5 ? 'y' : 'ů'} s blížícím se termínem!
        </div>
      )}
      <div className="novy-pripad">
        <input
          type="text"
          placeholder="Jméno klienta"
          value={novyKlient}
          onChange={e => setNovyKlient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Poradce (jméno)"
          value={novyPoradce}
          onChange={e => setNovyPoradce(e.target.value)}
        />
        <input
          type="text"
          placeholder="Co chce klient financovat? (např. byt, dům)"
          value={krok1Co}
          onChange={e => setKrok1Co(e.target.value)}
        />
        <input
          type="number"
          placeholder="Za kolik (Kč)"
          value={krok1Castka}
          onChange={e => setKrok1Castka(e.target.value)}
        />
        <input
          type="text"
          placeholder="Popis (nepovinné)"
          value={krok1Popis}
          onChange={e => setKrok1Popis(e.target.value)}
        />
        <input
          type="date"
          placeholder="Datum návrhu financování"
          value={krok2Termin}
          onChange={e => setKrok2Termin(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Výše úroku (%)"
          value={krok2Urok}
          onChange={e => setKrok2Urok(e.target.value)}
        />
        <select className="select-banka" value={krok3Banka} onChange={e => setKrok3Banka(e.target.value)}>
          <option value="" disabled>Vyberte banku nebo instituci…</option>
          <optgroup label="Nejčastější banky">
            <option value="Česká spořitelna">Česká spořitelna</option>
            <option value="Komerční banka">Komerční banka</option>
            <option value="ČSOB">ČSOB</option>
            <option value="UniCredit Bank">UniCredit Bank</option>
            <option value="Raiffeisenbank">Raiffeisenbank</option>
            <option value="Moneta Money Bank">Moneta Money Bank</option>
            <option value="mBank">mBank</option>
            <option value="Fio banka">Fio banka</option>
            <option value="Air Bank">Air Bank</option>
            <option value="Hypoteční banka">Hypoteční banka</option>
          </optgroup>
          <optgroup label="Další instituce">
            <option value="Sberbank">Sberbank</option>
            <option value="Equa bank">Equa bank</option>
            <option value="Oberbank">Oberbank</option>
            <option value="Expobank">Expobank</option>
            <option value="Hello bank!">Hello bank!</option>
            <option value="Trinity Bank">Trinity Bank</option>
            <option value="Wüstenrot hypoteční banka">Wüstenrot hypoteční banka</option>
          </optgroup>
          <option value="Další (ručně)">Jiná (zadám ručně)</option>
        </select>
        {krok3Banka === 'Další (ručně)' && (
          <input
            type="text"
            placeholder="Zadejte název banky/instituce"
            value={krok3Vlastni}
            onChange={e => setKrok3Vlastni(e.target.value)}
          />
        )}
        <input
          type="text"
          placeholder="Poznámka (nepovinné)"
          value={poznamka}
          onChange={e => setPoznamka(e.target.value)}
        />
        {editId ? (
          <>
            <button onClick={ulozitEditaci}>Uložit změny</button>
            <button onClick={() => setEditId(null)}>Zrušit</button>
          </>
        ) : (
          <button onClick={pridejPripad}>Přidat případ</button>
        )}
      </div>
      {zobrazChybu && (
        <div style={{color: 'red', marginBottom: '1rem'}}>Nastala chyba při přidávání případu.</div>
      )}
      <div className="dashboard">
        <h2>Přehled</h2>
        <div style={{marginBottom:'1rem'}}>
          <label>Aktivní poradce: </label>
          <select value={aktivniPoradce} onChange={e => setAktivniPoradce(e.target.value)}>
            <option value="">Všichni poradci</option>
            {poradci.map(jmeno => (
              <option key={jmeno} value={jmeno}>{jmeno}</option>
            ))}
          </select>
        </div>
        <ul>
          <li>Počet rozpracovaných případů: {pripady.filter(p => !p.archivovano).length}</li>
          <li>Počet případů s blížícím se termínem: {pripady.filter(p => !p.archivovano && bliziciSeTerminy(p).length > 0).length}</li>
          <li>Počet dokončených případů: {pripady.filter(p => !p.archivovano && p.aktualniKrok === KROKY.length - 3 && p.kroky.every(k => k.splneno)).length}</li>
          <li>Počet archivovaných případů: {pripady.filter(p => p.archivovano).length}</li>
          <li>Průměrná doba zpracování: {prumDoba}</li>
        </ul>
        <div style={{display:'flex',gap:'2rem',flexWrap:'wrap',margin:'1.5rem 0'}}>
          <div style={{width:'320px',height:'220px',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #0001',padding:'1rem'}}>
            <b>Rozložení případů podle kroku</b>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={rozlozeniKroku}>
                <XAxis dataKey="krok" fontSize={12} interval={0} angle={-30} textAnchor="end" height={60}/>
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Bar dataKey="pocet" fill="#1976d2" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{width:'260px',height:'220px',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #0001',padding:'1rem'}}>
            <b>Rozložení případů podle banky</b>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={rozlozeniBanky} dataKey="pocet" nameKey="banka" cx="50%" cy="50%" outerRadius={60} label>
                  {rozlozeniBanky.map((_, idx) => (
                    <Cell key={idx} fill={["#1976d2","#388e3c","#ffa000","#d32f2f","#7b1fa2"][idx%5]} />
                  ))}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <button onClick={() => exportToCSV(pripady)} style={{marginTop:'1rem'}}>Exportovat do CSV</button>
        <label style={{marginLeft:'1rem', cursor:'pointer'}}>
          <input type="file" accept=".csv" style={{display:'none'}} onChange={importFromCSV} />
          <span style={{textDecoration:'underline', color:'#1976d2'}}>Importovat z CSV</span>
        </label>
        <button onClick={() => exportToJSON(pripady)} style={{marginLeft:'1rem'}}>Exportovat do JSON</button>
        <label style={{marginLeft:'1rem', cursor:'pointer'}}>
          <input type="file" accept=".json" style={{display:'none'}} onChange={importFromJSON} />
          <span style={{textDecoration:'underline', color:'#1976d2'}}>Importovat z JSON</span>
        </label>
        <div style={{marginTop:'1rem',display:'flex',gap:'1.5rem',flexWrap:'wrap',alignItems:'center'}}>
          {/* Filtrování podle poradce je nyní vázáno na aktivního poradce */}
          <div>
            <label>Filtrovat podle poradce: </label>
            <select value={searchPoradce} onChange={e => setSearchPoradce(e.target.value)} disabled={!!aktivniPoradce}>
              <option value="">Všichni</option>
              {poradci.map(jmeno => (
                <option key={jmeno} value={jmeno}>{jmeno}</option>
              ))}
            </select>
            {aktivniPoradce && <span style={{color:'#888',fontSize:'0.95em',marginLeft:6}}>(používá se výběr výše)</span>}
          </div>
          <div>
            <label>Filtrovat podle stavu kroku: </label>
            <select value={stavKrokuFilter} onChange={e => setStavKrokuFilter(e.target.value)}>
              <option value="">Všechny stavy</option>
              {KROKY.slice(3).map((k, idx) => (
                <option key={idx} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label>
              <input type="checkbox" checked={zobrazArchivovane} onChange={e => setZobrazArchivovane(e.target.checked)} />
              Zobrazit archivované
            </label>
          </div>
        </div>
      </div>
      <div className="pripady">
        <input
          type="text"
          placeholder="Vyhledat klienta, banku, poznámku..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{marginBottom: '1rem', minWidth: '250px'}}
        />
        {pripady.filter(p =>
          !p.archivovano &&
          (aktivniPoradce ? p.poradce === aktivniPoradce : (searchPoradce === '' || p.poradce === searchPoradce)) &&
          (stavKrokuFilter === '' || KROKY[p.aktualniKrok + 3] === stavKrokuFilter) &&
          (p.klient.toLowerCase().includes(search.toLowerCase()) ||
          p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
          (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
          )
        ).length === 0 && <p>Žádné případy neodpovídají filtru.</p>}
        {pripady.filter(p =>
          (zobrazArchivovane ? true : !p.archivovano) &&
          (aktivniPoradce ? p.poradce === aktivniPoradce : (searchPoradce === '' || p.poradce === searchPoradce)) &&
          (stavKrokuFilter === '' || KROKY[p.aktualniKrok + 3] === stavKrokuFilter) &&
          (p.klient.toLowerCase().includes(search.toLowerCase()) ||
          p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
          (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
          )
        ).map(pripad => {
          const upozorneni = bliziciSeTerminy(pripad);
          return (
            <div key={pripad.id} className="pripad" id={'pripad-pdf-'+pripad.id}>
              <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                <h2>{pripad.klient}</h2>
                <span style={{fontSize:'0.95em', color:'#1976d2'}}>Poradce: {pripad.poradce}</span>
                <button onClick={() => editovatPripad(pripad)}>Editovat</button>
                <button onClick={() => smazatPripad(pripad.id)} style={{color:'red'}}>Smazat</button>
                {!pripad.archivovano ? (
                  <button onClick={() => archivovatPripad(pripad.id)} style={{color:'#888'}}>Archivovat</button>
                ) : (
                  <button onClick={() => obnovitPripad(pripad.id)} style={{color:'#1976d2'}}>Obnovit</button>
                )}
              </div>
              {/* Progress bar/timeline */}
              <div className="progress-bar-timeline">
                {KROKY.slice(3).map((k, idx) => (
                  <div key={idx} className={
                    idx < pripad.aktualniKrok ? 'timeline-done' : idx === pripad.aktualniKrok ? 'timeline-current' : 'timeline-todo'
                  }>
                    <div className="timeline-dot" />
                    {idx === pripad.aktualniKrok && (
                      <span className="timeline-label">{k}</span>
                    )}
                  </div>
                ))}
                <select className="timeline-select" value={pripad.aktualniKrok} onChange={e => posunKrok(pripad.id, Number(e.target.value))}>
                  {KROKY.slice(3).map((k, idx) => (
                    <option key={idx} value={idx}>{idx+4}. {k}</option>
                  ))}
                </select>
              </div>
              <p><b>Poradce:</b> {pripad.poradce}</p>
              <p><b>Krok 1: Co chce klient financovat?</b></p>
              <ul>
                <li><b>Předmět:</b> {pripad.krok1.co}</li>
                <li><b>Částka:</b> {formatCislo(pripad.krok1.castka)} Kč</li>
                {pripad.krok1.popis && <li><b>Popis:</b> {pripad.krok1.popis}</li>}
              </ul>
              <p><b>Krok 2: Návrh financování</b></p>
              <ul>
                <li><b>Datum návrhu:</b> {pripad.krok2.termin}</li>
                <li><b>Výše úroku:</b> {pripad.krok2.urok} %</li>
              </ul>
              <p><b>Krok 3: Výběr banky</b></p>
              <ul>
                <li><b>Banka/instituce:</b> {pripad.krok3?.banka || '-'}</li>
              </ul>
              {upozorneni.length > 0 && (
                <div className="notifikace-term">
                  <b>Upozornění na blížící se termíny:</b>
                  <ul>
                    {upozorneni.map((u, i) => <li key={i}><span className="badge-term">⚠</span> {u}</li>)}
                  </ul>
                </div>
              )}
              {/* Vlastní upozornění na připomenutí */}
              {vlastniPripomenuti(pripad).length > 0 && (
                <div className="notifikace-term" style={{background:'#e3f2fd',borderLeft:'4px solid #1976d2',color:'#1976d2'}}>
                  <b>Vlastní upozornění:</b>
                  <ul>
                    {vlastniPripomenuti(pripad).map((u, i) => <li key={i}><span className="badge-term">⏰</span> {u}</li>)}
                  </ul>
                </div>
              )}
              <p>Aktuální krok: <b>{KROKY[pripad.aktualniKrok + 2]}</b></p>
              {pripad.poznamka && <p>Poznámka: {pripad.poznamka}</p>}
              {/* Rychlé akce pro poradce */}
              <div className="rychle-akce">
                <button onClick={() => {
                  // Označit všechny kroky jako splněné
                  setPripady(pripady.map(p =>
                    p.id === pripad.id
                      ? {
                          ...p,
                          kroky: p.kroky.map((k) => ({
                            ...k,
                            splneno: true,
                            splnenoAt: k.splnenoAt || new Date().toISOString().slice(0,10)
                          })),
                          aktualniKrok: KROKY.length - 3
                        }
                      : p
                  ));
                }}>Označit vše jako splněné</button>
                <button onClick={() => {
                  // Posunout na další krok
                  setPripady(pripady.map(p =>
                    p.id === pripad.id
                      ? {
                          ...p,
                          aktualniKrok: Math.min(p.aktualniKrok + 1, KROKY.length - 3)
                        }
                      : p
                  ));
                }}>Posunout na další krok</button>
                <button onClick={() => {
                  // Vrátit na předchozí krok
                  setPripady(pripady.map(p =>
                    p.id === pripad.id
                      ? {
                          ...p,
                          aktualniKrok: Math.max(p.aktualniKrok - 1, 0)
                        }
                      : p
                  ));
                }}>Zpět na předchozí krok</button>
                <button onClick={() => exportPripadPDF(pripad.id)} style={{background:'#fffde7',color:'#b26a00',border:'1px solid #ffe082'}}>Tisk / PDF</button>
              </div>
              <ol>
                {pripad.kroky.map((krok, idx) => (
                  <li key={idx} className={krok.splneno ? 'splneno ' + getKrokClass(pripad, idx) : getKrokClass(pripad, idx)}>
                    <span>{krok.nazev}</span>
                    <input
                      type="date"
                      value={krok.termin}
                      onChange={e => nastavTermin(pripad.id, idx, e.target.value)}
                      title="Deadline"
                    />
                    <input
                      type="number"
                      min="1"
                      max="60"
                      placeholder="Připomenout za X dní před termínem"
                      value={krok.pripomenoutZa ?? ''}
                      onChange={e => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setPripady(pripady.map(p => {
                          if (p.id !== pripad.id) return p;
                          const noveKroky = [...p.kroky];
                          noveKroky[idx] = { ...noveKroky[idx], pripomenoutZa: val };
                          return { ...p, kroky: noveKroky };
                        }));
                      }}
                      style={{width:60,marginLeft:6}}
                      title="Vlastní upozornění na připomenutí"
                    />
                    {krok.splneno && (
                      <span style={{color: 'green', fontSize: '0.9em'}}>Splněno: {krok.splnenoAt}</span>
                    )}
                    <input
                      type="text"
                      placeholder="Poznámka ke kroku"
                      value={krok.poznamka}
                      onChange={e => {
                        setPripady(pripady.map(p => {
                          if (p.id !== pripad.id) return p;
                          const noveKroky = [...p.kroky];
                          noveKroky[idx] = { ...noveKroky[idx], poznamka: e.target.value };
                          return { ...p, kroky: noveKroky };
                        }));
                      }}
                      style={{marginLeft:8, minWidth:120}}
                    />
                    <button
                      disabled={krok.splneno || idx > pripad.aktualniKrok}
                      onClick={() => splnitKrok(pripad.id, idx)}
                    >
                      {krok.splneno ? 'Splněno' : 'Označit jako splněné'}
                    </button>
                    {/* Zobrazit historii změn ke kroku */}
                    {krok.historie && krok.historie.length > 0 && (
                      <details style={{marginLeft:8}}>
                        <summary>Historie změn</summary>
                        <ul style={{fontSize:'0.9em',color:'#555'}}>
                          {krok.historie.map((z, i) => (
                            <li key={i}>{z.kdy} – {z.kdo}: {z.zmena}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
