import { bliziciSeTerminy } from './utils';

describe('bliziciSeTerminy', () => {
  it('vrací prázdné pole pokud nejsou žádné blížící se termíny', () => {
    const pripad = {
      id: 1,
      klient: 'Test',
      poradce: 'Poradce',
      aktualniKrok: 0,
      krok1: { co: '', castka: '' },
      krok2: { termin: '', urok: '' },
      krok3: { banka: '' },
      kroky: [],
    };
    expect(bliziciSeTerminy(pripad)).toEqual([]);
  });

  it('vrací termín z krok2 pokud je v příštích 7 dnech', () => {
    const dnes = new Date();
    const zaTriDny = new Date(dnes);
    zaTriDny.setDate(dnes.getDate() + 3);
    const pripad = {
      id: 2,
      klient: 'Test',
      poradce: 'Poradce',
      aktualniKrok: 0,
      krok1: { co: '', castka: '' },
      krok2: { termin: zaTriDny.toISOString().slice(0,10), urok: '' },
      krok3: { banka: '' },
      kroky: [],
    };
    expect(bliziciSeTerminy(pripad)).toContain(`Návrh financování: ${zaTriDny.toISOString().slice(0,10)}`);
  });

  it('vrací termíny z jednotlivých kroků pokud jsou v příštích 7 dnech a nejsou splněné', () => {
    const dnes = new Date();
    const zaPetDni = new Date(dnes);
    zaPetDni.setDate(dnes.getDate() + 5);
    const pripad = {
      id: 3,
      klient: 'Test',
      poradce: 'Poradce',
      aktualniKrok: 0,
      krok1: { co: '', castka: '' },
      krok2: { termin: '', urok: '' },
      krok3: { banka: '' },
      kroky: [
        { nazev: 'Krok A', termin: zaPetDni.toISOString().slice(0,10), splneno: false },
        { nazev: 'Krok B', termin: zaPetDni.toISOString().slice(0,10), splneno: true },
      ],
    };
    expect(bliziciSeTerminy(pripad)).toContain(`Krok A: ${zaPetDni.toISOString().slice(0,10)}`);
    expect(bliziciSeTerminy(pripad)).not.toContain(`Krok B: ${zaPetDni.toISOString().slice(0,10)}`);
  });
});
