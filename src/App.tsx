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

interface KrokPripadu {
  nazev: string;
  termin?: string;
  splneno: boolean;
  poznamka?: string;
}

interface PripadHypoteky {
  id: number;
  klient: string;
  aktualniKrok: number;
  krok1: Krok1Info;
  krok2: Krok2Info;
  kroky: KrokPripadu[];
  poznamka?: string;
}

function App() {
  const [pripady, setPripady] = useState<PripadHypoteky[]>([]);
  const [novyKlient, setNovyKlient] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [krok1Co, setKrok1Co] = useState('');
  const [krok1Castka, setKrok1Castka] = useState('');
  const [krok1Popis, setKrok1Popis] = useState('');
  const [krok2Termin, setKrok2Termin] = useState('');
  const [krok2Urok, setKrok2Urok] = useState('');
  const [zobrazChybu, setZobrazChybu] = useState(false);

  // Přidání několika vzorových hypoték při startu
  useState(() => {
    if (pripady.length === 0) {
      setPripady([
        {
          id: 1,
          klient: 'Jan Novák',
          aktualniKrok: 2,
          krok1: { co: 'Byt', castka: '4500000', popis: 'Novostavba v Praze' },
          krok2: { termin: '2025-05-10', urok: '4.29' },
          kroky: [
            { nazev: KROKY[2], termin: '2025-05-12', splneno: true },
            { nazev: KROKY[3], termin: '2025-05-15', splneno: false },
            { nazev: KROKY[4], termin: '', splneno: false },
            // ... další kroky ...
          ],
          poznamka: 'Hypotéka na byt pro mladý pár.'
        },
        {
          id: 2,
          klient: 'Petra Svobodová',
          aktualniKrok: 1,
          krok1: { co: 'Dům', castka: '8000000', popis: '' },
          krok2: { termin: '2025-05-12', urok: '3.99' },
          kroky: [
            { nazev: KROKY[2], termin: '', splneno: false },
            { nazev: KROKY[3], termin: '', splneno: false },
            { nazev: KROKY[4], termin: '', splneno: false },
            // ... další kroky ...
          ],
          poznamka: ''
        },
        {
          id: 3,
          klient: 'Martin Dvořák',
          aktualniKrok: 0,
          krok1: { co: '', castka: '', popis: '' },
          krok2: { termin: '', urok: '' },
          kroky: [
            { nazev: KROKY[2], termin: '', splneno: false },
            { nazev: KROKY[3], termin: '', splneno: false },
            { nazev: KROKY[4], termin: '', splneno: false },
            // ... další kroky ...
          ],
          poznamka: 'Zatím bez detailů.'
        }
      ]);
    }
  });

  // Přidání nového případu
  const pridejPripad = () => {
    setZobrazChybu(false);
    const noveKroky = KROKY.slice(2).map((nazev) => ({ nazev, termin: '', splneno: false }));
    setPripady([
      ...pripady,
      {
        id: pripady.length + 1,
        klient: novyKlient,
        aktualniKrok: 0,
        krok1: { co: krok1Co, castka: krok1Castka, popis: krok1Popis },
        krok2: { termin: krok2Termin, urok: krok2Urok },
        kroky: noveKroky,
        poznamka: poznamka || undefined,
      },
    ]);
    setNovyKlient('');
    setPoznamka('');
    setKrok1Co('');
    setKrok1Castka('');
    setKrok1Popis('');
    setKrok2Termin('');
    setKrok2Urok('');
  };

  // Označení kroku jako splněného a posun na další krok
  const splnitKrok = (pripadId: number, krokIdx: number) => {
    setPripady(pripady.map(pripad => {
      if (pripad.id !== pripadId) return pripad;
      const noveKroky = [...pripad.kroky];
      noveKroky[krokIdx] = { ...noveKroky[krokIdx], splneno: true };
      return {
        ...pripad,
        aktualniKrok: Math.min(krokIdx + 1, KROKY.length - 2),
        kroky: noveKroky,
      };
    }));
  };

  // Změna termínu kroku
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
        <input
          type="text"
          placeholder="Poznámka (nepovinné)"
          value={poznamka}
          onChange={e => setPoznamka(e.target.value)}
        />
        <button onClick={pridejPripad}>Přidat případ</button>
      </div>
      {zobrazChybu && (
        <div style={{color: 'red', marginBottom: '1rem'}}>Nastala chyba při přidávání případu.</div>
      )}
      <div className="pripady">
        {pripady.length === 0 && <p>Žádné případy nejsou evidovány.</p>}
        {pripady.map(pripad => (
          <div key={pripad.id} className="pripad">
            <h2>{pripad.klient}</h2>
            <p><b>Krok 1: Co chce klient financovat?</b></p>
            <ul>
              <li><b>Předmět:</b> {pripad.krok1.co}</li>
              <li><b>Částka:</b> {pripad.krok1.castka} Kč</li>
              {pripad.krok1.popis && <li><b>Popis:</b> {pripad.krok1.popis}</li>}
            </ul>
            <p><b>Krok 2: Návrh financování</b></p>
            <ul>
              <li><b>Datum návrhu:</b> {pripad.krok2.termin}</li>
              <li><b>Výše úroku:</b> {pripad.krok2.urok} %</li>
            </ul>
            <p>Aktuální krok: <b>{KROKY[pripad.aktualniKrok + 2]}</b></p>
            {pripad.poznamka && <p>Poznámka: {pripad.poznamka}</p>}
            <ol>
              {pripad.kroky.map((krok, idx) => (
                <li key={idx} className={krok.splneno ? 'splneno' : ''}>
                  <span>{krok.nazev}</span>
                  <input
                    type="date"
                    value={krok.termin}
                    onChange={e => nastavTermin(pripad.id, idx, e.target.value)}
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
        ))}
      </div>
    </div>
  );
}

export default App;
