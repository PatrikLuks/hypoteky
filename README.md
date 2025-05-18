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

## Lokalizace a i18n
Aplikace podporuje vícejazyčné prostředí pomocí [react-i18next]. Veškeré texty v UI jsou spravovány v překladových souborech `src/locales/cs.json` a `src/locales/en.json`. Pro přidání nového jazyka stačí rozšířit tyto soubory a upravit inicializaci v `src/i18n.ts`.

## Testování
Testy jsou psány v Jest a React Testing Library. Spouštění testů:
```sh
npm run test
```
Testy pokrývají validace, dialogy, logiku utilit a chování UI. Všechny testy musí procházet i při změně typů.

## Přístupnost (WCAG, ARIA)
- Všechny dialogy a akční prvky mají správné ARIA popisky (`aria-label`, `role`, `aria-modal`).
- Klávesové zkratky: Enter/Escape pro potvrzení/zavření dialogů, W pro workflow, atd.
- Tlačítka mají autoFocus a jsou přístupná z klávesnice.
- Komponenty jsou navrženy s ohledem na čtečky obrazovky a WCAG 2.1.

## Best practices
- **Typová bezpečnost:** Všechny typy jsou striktně definovány v `src/types.ts`. Nepoužívejte `any`.
- **i18n:** Veškeré texty v UI musí být v překladových souborech, nikdy přímo v komponentě.
- **Přístupnost:** Každý nový dialog nebo akce musí mít ARIA popisky a být ovladatelná z klávesnice.
- **Čistota kódu:** Nepoužívané proměnné a importy pravidelně odstraňujte. Používejte linter.
- **Testy:** Každá nová logika nebo validace musí mít odpovídající test.

## Odstranění duplicitní Jest konfigurace
V projektu je pouze jeden konfigurační soubor: `jest.config.cjs`.

## Upgrade MUI na v7

- 17. 5. 2025: Proveden upgrade všech balíčků MUI (`@mui/material`, `@mui/icons-material`, `@mui/system`) na verzi 7.
- Otestována kompatibilita s projektem, všechny testy procházejí.
- Testy byly upraveny pro správnou práci s i18n a novou verzí MUI.
- V případě problémů s kompatibilitou viz [MUI v7 migration guide](https://mui.com/material-ui/migration/migration-v7/).
- Audit závislostí: jedna high vulnerability v `xlsx` (bez dostupné opravy, viz audit výše).

---

Projekt je připraven pro další rozšiřování dle potřeb finančních poradců. Přispívejte podle výše uvedených zásad.
