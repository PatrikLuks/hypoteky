// Utility funkce pro hypotéky
import type { PripadHypoteky } from './types';

/**
 * Vrací pole upozornění na blížící se termíny v případu (do 7 dnů).
 * @param pripad Případ hypotéky
 */
export function bliziciSeTerminy(pripad: PripadHypoteky): string[] {
  const dnes = new Date();
  const limit = new Date(dnes);
  limit.setDate(dnes.getDate() + 7);
  const upozorneni: string[] = [];
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
