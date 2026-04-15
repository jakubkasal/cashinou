# SKILLS.md – CashinoU

Definované postupy pro konzistentní práci AI asistenta s projektem. Každý skill popisuje kontext, pravidla a příklad zadání.

---

## Skill: Přidání nové stránky / funkce

**Kdy použít:** Přidávám novou stránku, sekci nebo logiku.

**Postup:**
1. Přidat tlačítko do sidebaru v `<nav class="sidebar">` a do bottom nav `<nav class="bottom-nav">`
2. Přidat `<div id="page-xxx" class="page">` v HTML těle
3. Registrovat ID stránky v `showPage()` (funkce na řádku ~391 v `index.html`)
4. Logické funkce pojmenovávat dle vzoru: `nacti...()`, `uloz...()`, `zobraz...()`
5. Data ukládat/číst přes `localStorage` – vždy `JSON.parse` / `JSON.stringify`
6. Myslet na mobilní layout – použít `.mobile-only` / `.desktop-only` nebo media query

**Příklad:**
```
"Přidej stránku s přehledem výdajů za poslední rok. Drž se existujícího stylu."
```

---

## Skill: Oprava chyby

**Kdy použít:** Něco nefunguje nebo vypadá špatně.

**Postup:**
1. Popsat co se děje, na jakém zařízení (mobil / desktop / obojí)
2. U vizuálních problémů přiložit screenshot
3. AI upravuje **pouze** rozbité místo – zbytek kódu se nemění
4. Po opravě ověřit funkčnost na obou layoutech

**Příklad:**
```
"Na mobilu sidebar překrývá obsah hlavní stránky. Screenshot v příloze. Oprav to."
```

---

## Skill: Úprava designu

**Kdy použít:** Měním vzhled – barvy, rozložení, typografii, velikosti.

**Pravidla:**
- Styly výhradně v `style.css`, inline styly jen výjimečně
- CSS proměnné (dark mode výchozí):
  - Pozadí: `--bg: #0e0e11`, `--surface: #17171c`, `--surface2: #1f1f26`
  - Ohraničení: `--border: #2a2a35`
  - Text: `--text: #e8e8f0`, `--muted: #666680`
  - Barvy: `--accent: #6366f1`, `--green: #22c55e`, `--red: #ef4444`, `--blue: #3b82f6`, `--yellow: #f59e0b`
  - Light mode přes `body.light { ... }` – přepisuje pouze barevné proměnné
- Font: `DM Sans` (text), `DM Mono` (čísla/kódy)
- Border radius: kartičky `14px`, tlačítka `8px`, malé prvky `6px`
- Přechody: `transition: all .15s` (interakce), `transition: background .2s, color .2s` (téma)
- Nikdy neměnit funkčnost – pouze vizuál

**Příklad:**
```
"Udělej kartičky na přehledu větší a přidej jim jemný shadow. Zachovej stávající proměnné."
```

---

## Skill: Práce s opakujícími se platbami

**Kdy použít:** Upravuji nebo rozšiřuji logiku opakujících se plateb.

**Klíčové funkce:**
- `aplikujOpakujici()` – volá se automaticky při startu, přidává splatné záznamy, obsahuje ochranu proti duplikátům
- `posunDatum(datum, f, smer)` – posouvá datum o měsíce bez přetékání (31. 3. + 1M = 30. 4., ne 1. 5.)

**Datová struktura:**
```js
opakujici: [{ id, typ, kategorieId, popis, castka, frekvence, datumPrvni, posledniPridani }]
```

**Upozornění:** Při jakékoli změně logiky přidávání záznamů vždy zachovat ochranu proti duplikátům.

---

## Skill: Nasazení nové verze

**Kdy použít:** Upravil jsem kód a chci nahrát novou verzi online.

**Postup:**
```bash
git add index.html style.css   # případně další změněné soubory
git commit -m "Stručný popis změny"
git push
```

Netlify nasadí automaticky po push na `main`. Produkce: cashinou.netlify.app

> Pozor: Při změně Service Workeru nebo cache je nutné zvýšit verzi cache (`cashinou-v3` → `cashinou-v4`) v JS sekci `index.html`, jinak prohlížeč servíruje starou verzi.

---

## Skill: Psaní testů

**Kdy použít:** Přidal jsem novou funkci a chci ověřit správnost logiky.

**Postup:**
- Testy jsou v `tests.js`, spouštějí se přes `tests.html`
- Testují se čistě logické funkce – výpočty, ukládání, filtrování
- Každý test má srozumitelný popis
- Žádné externí knihovny – vlastní jednoduchý test runner

**Příklad:**
```
"Napiš test pro funkci posunDatum – ověř přetékání na konci měsíce."
```
