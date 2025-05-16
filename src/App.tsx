import { useState } from 'react';
import './App.css';

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

interface KrokPripadu {
  nazev: string;
  termin?: string; // deadline
  splneno: boolean;
  poznamka?: string;
  splnenoAt?: string; // datum splnění
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
}

// Pomocná funkce pro formátování čísel s oddělením po 3 cifrách
function formatCislo(cislo: string) {
  if (!cislo) return '';
  const num = Number(cislo);
  if (isNaN(num)) return cislo;
  return num.toLocaleString('cs-CZ');
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
        poznamka: 'První hypotéka.'
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
        poznamka: ''
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
        poznamka: 'Rekonstrukce pro mladý pár.'
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
        poznamka: ''
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
        poznamka: 'Letní rekreace.'
      }
    ]);
  });

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
          }))
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
    const noveKroky = KROKY.slice(3).map((nazev) => ({
      nazev,
      termin: '',
      splneno: false,
      splnenoAt: undefined,
      poznamka: ''
    }));
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

  return (
    <div className="container">
      <h1>Správa hypoték</h1>
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
        <ul>
          <li>Počet rozpracovaných případů: {pripady.length}</li>
          <li>Počet případů s blížícím se termínem: {pripady.filter(p => bliziciSeTerminy(p).length > 0).length}</li>
          <li>Počet dokončených případů: {pripady.filter(p => p.aktualniKrok === KROKY.length - 3 && p.kroky.every(k => k.splneno)).length}</li>
        </ul>
        <button onClick={() => exportToCSV(pripady)} style={{marginTop:'1rem'}}>Exportovat do CSV</button>
        <label style={{marginLeft:'1rem', cursor:'pointer'}}>
          <input type="file" accept=".csv" style={{display:'none'}} onChange={importFromCSV} />
          <span style={{textDecoration:'underline', color:'#1976d2'}}>Importovat z CSV</span>
        </label>
        <div style={{marginTop:'1rem'}}>
          <label>Filtrovat podle poradce: </label>
          <select value={searchPoradce} onChange={e => setSearchPoradce(e.target.value)}>
            <option value="">Všichni</option>
            {[...new Set(pripady.map(p => p.poradce).filter(Boolean))].map(jmeno => (
              <option key={jmeno} value={jmeno}>{jmeno}</option>
            ))}
          </select>
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
          (searchPoradce === '' || p.poradce === searchPoradce) &&
          (p.klient.toLowerCase().includes(search.toLowerCase()) ||
          p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
          (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
          )
        ).length === 0 && <p>Žádné případy neodpovídají filtru.</p>}
        {pripady.filter(p =>
          (searchPoradce === '' || p.poradce === searchPoradce) &&
          (p.klient.toLowerCase().includes(search.toLowerCase()) ||
          p.krok3.banka.toLowerCase().includes(search.toLowerCase()) ||
          (p.poznamka && p.poznamka.toLowerCase().includes(search.toLowerCase()))
          )
        ).map(pripad => {
          const upozorneni = bliziciSeTerminy(pripad);
          return (
            <div key={pripad.id} className="pripad">
              <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                <h2>{pripad.klient}</h2>
                <span style={{fontSize:'0.95em', color:'#1976d2'}}>Poradce: {pripad.poradce}</span>
                <button onClick={() => editovatPripad(pripad)}>Editovat</button>
                <button onClick={() => smazatPripad(pripad.id)} style={{color:'red'}}>Smazat</button>
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
                <div style={{color: 'orange', marginBottom: '0.5rem'}}>
                  <b>Upozornění na blížící se termíny:</b>
                  <ul>
                    {upozorneni.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}
              <p>Aktuální krok: <b>{KROKY[pripad.aktualniKrok + 2]}</b></p>
              {pripad.poznamka && <p>Poznámka: {pripad.poznamka}</p>}
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
