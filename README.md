# Správa hypoték – aplikace pro finanční poradce

Tato aplikace umožňuje finančním poradcům evidovat a spravovat případy hypoték klientů krok po kroku. Každý případ obsahuje všechny důležité fáze procesu vyřízení hypotéky, včetně zadání základních údajů, návrhu financování, výběru banky, kompletace podkladů a dalších.

## Funkce
- Přehledné zadání a evidence všech případů
- Sledování postupu krok po kroku (od záměru klienta až po čerpání a splácení)
- Možnost zadat termíny a označit splnění jednotlivých fází
- Zadání výše úroku a data návrhu financování
- Vzorová data pro rychlý start

## Spuštění projektu

1. Ujistěte se, že máte nainstalovaný Node.js a npm.
2. Nainstalujte závislosti:
   ```sh
   npm install
   ```
3. Spusťte vývojový server:
   ```sh
   npm run dev
   ```
   Aplikace poběží na http://localhost:5173

4. Pro produkční build spusťte:
   ```sh
   npm run build
   ```

## Struktura projektu
- `src/App.tsx` – hlavní logika a UI aplikace
- `src/App.css` – stylování
- `README.md` – tento popis

## Další rozvoj
- Upozornění na blížící se termíny
- Export/import případů
- Uživatelské účty a zabezpečení

---

Projekt je připraven pro další rozšiřování dle potřeb finančních poradců.
