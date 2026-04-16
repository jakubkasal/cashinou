# CashinoU — Osobní finanční tracker

> Přehledná webová aplikace pro správu osobních financí. Sleduj příjmy, výdaje, úspory a rozpočty — bez registrace, bez serveru, přímo v prohlížeči.

---

## Popis

CashinoU řeší jeden z nejběžnějších každodenních problémů: **kam mizí peníze**. Aplikace umožňuje zaznamenávat příjmy a výdaje, přiřazovat je ke kategoriím, vizualizovat vývoj bilance a nastavit měsíční rozpočty s upozorněním na překročení. Všechna data jsou uložena lokálně v prohlížeči — žádný účet, žádný cloud, žádné odesílání dat třetím stranám.

Funguje jako plnohodnotná PWA (Progressive Web App), takže ji lze nainstalovat na mobil nebo počítač a používat i bez připojení k internetu. Pro pokročilejší uživatele je dostupná také jako desktopová aplikace přes Electron.

---

## Klíčové vlastnosti

- **Záznamy příjmů a výdajů** — přidávání transakcí s vlastním popisem, kategorií, emoji ikonou a datem
- **Měsíční přehled bilance** — přehledný dashboard s celkovými příjmy, výdaji a čistou bilancí pro zvolený měsíc
- **Vyhledávání a filtrování** — fulltextové vyhledávání v historii transakcí a filtr podle kategorie
- **Vizualizace dat** — tři typy grafů: koláčový (výdaje dle kategorií), sloupcový (příjmy vs. výdaje), čárový (vývoj bilance v čase)
- **Opakující se platby** — automatické přidávání pravidelných transakcí s frekvencí od denní po roční
- **Měsíční rozpočty** — nastavení limitu výdajů na kategorii s upozorněním při překročení
- **Spoření** — samostatný přehled spořicí kategorie s kumulativním grafem a měsíčním rozpisem
- **Správa kategorií** — vytváření, úprava a mazání vlastních kategorií s výběrem emoji ikony
- **Export do CSV** — stažení kompletní historie transakcí pro zpracování v tabulkovém procesoru
- **Dark / light mode** — přepínání tmavého a světlého motivu
- **Responzivní design** — plnohodnotné rozhraní na počítači (boční panel) i mobilu (spodní navigace)
- **Offline podpora (PWA)** — instalace na plochu iOS/Android, funguje bez internetu díky Service Workeru
- **Desktopová aplikace** — balíčkování pro macOS, Windows a Linux přes Electron

---

## Technologický zásobník

| Vrstva | Technologie |
|---|---|
| **Struktura** | HTML5 |
| **Logika** | Vanilla JavaScript (ES2020+) |
| **Stylování** | Custom CSS s CSS Custom Properties (proměnné pro témata) |
| **Grafy** | Chart.js 4.x |
| **Typografie** | Google Fonts — DM Sans, DM Mono |
| **Uložiště dat** | localStorage (JSON serializace) |
| **PWA** | Service Worker + Web App Manifest |
| **Desktopové balíčkování** | Electron ^41.2.0 + electron-builder ^26.8.1 |
| **Testování** | Vlastní testovací runner (tests.js) |

Aplikace nevyžaduje žádný build krok, bundler ani backend server. Celá logika aplikace je obsažena v souboru `index.html`.

---

## Instalace a spuštění

### Varianta 1 — Přímé otevření v prohlížeči (nejjednodušší)

```bash
# 1. Naklonuj repozitář
git clone https://github.com/jakubkasal/cashinou.git

# 2. Přejdi do složky projektu
cd cashinou

# 3. Otevři aplikaci v prohlížeči
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Aplikace funguje okamžitě — žádné `npm install`, žádné ENV proměnné, žádná konfigurace.

---

### Varianta 2 — Online verze

Aplikace je nasazena a dostupná na adrese:

**[jakubkasal.github.io/cashinou](https://jakubkasal.github.io/cashinou/)**

---

### Varianta 3 — Instalace jako PWA (mobil / počítač)

**iOS (iPhone / iPad):**
1. Otevři aplikaci v **Safari**
2. Klepni na ikonu sdílení
3. Zvol **"Přidat na plochu"**

**Android:**
1. Otevři aplikaci v **Chrome**
2. Klepni na **"Přidat na plochu"** (banner nebo tři tečky v menu)

**Počítač (Chrome / Edge):**
1. Otevři aplikaci v prohlížeči
2. V adresním řádku klikni na ikonu instalace

---

### Varianta 4 — Desktopová aplikace (Electron)

```bash
# Naklonuj repozitář a nainstaluj závislosti
git clone https://github.com/jakubkasal/cashinou.git
cd cashinou
npm install

# Spusť v Electron prostředí
npx electron .

# Vytvoř instalovatelný balíček (macOS / Windows / Linux)
npx electron-builder
```

Výstupní soubory se uloží do složky `dist/`.

> Poznámka: Pro sestavení desktopové aplikace jsou potřeba Node.js a npm. Samotná webová verze žádné závislosti nemá.

---

## Struktura projektu

```
cashinou/
├── index.html          # Celá SPA aplikace — HTML struktura + veškerá JavaScript logika
├── style.css           # Kompletní stylování — layout, responzivita, dark/light mode
├── cashinou.png        # Logo aplikace (192×192 px)
├── tests.html          # Spouštěč automatických testů (otevři v prohlížeči)
├── tests.js            # Sada jednotkových testů pokrývající klíčové funkce
├── package.json        # Electron závislosti (pouze pro desktopové balíčkování)
├── README.md           # Tato dokumentace
├── AGENTS.md           # Pokyny pro práci s AI nástrojem při vývoji
├── SKILLS.md           # Vývojové postupy s AI asistentem
├── .gitignore          # Ignorované soubory (node_modules, dist)
└── dist/               # Výstup Electron buildů (generováno, není v gitu)
```

### Klíčové části kódu v `index.html`

| Oblast | Popis |
|---|---|
| `nactiZaznamy()` / `ulozZaznamy()` | Čtení a zápis transakcí do localStorage |
| `nactiKategorie()` / `ulozKategorie()` | Správa kategorií |
| `renderPrehled()` | Vykreslení přehledu na desktopu |
| `renderMobilePrehled()` | Vykreslení přehledu na mobilu |
| `renderGrafy()` | Sestavení a vykreslení Chart.js grafů |
| `renderSporeni()` | Přehled a grafika spořicí kategorie |
| `renderOpakujici()` | Seznam a logika opakujících se plateb |
| `renderKategorie()` | Správa vlastních kategorií |
| `formatKc(n)` | Formátování částek v českých korunách |
| `posunDatum(date, freq, dir)` | Výpočet dat pro opakující se platby |

---

## Testování

Automatické testy jsou dostupné po otevření souboru `tests.html` v prohlížeči. Pokrývají:

- Výpočet bilance a filtrování podle měsíce
- Ukládání a načítání dat z localStorage
- Vyhledávání v historii transakcí
- Logiku kategorií a výchozích hodnot
- Opakující se platby a výpočet frekvencí
- Export do CSV
- Validaci vstupních hodnot formuláře


## Vývoj s AI

Aplikace byla vyvíjena ve spolupráci s AI nástrojem **Claude** (Anthropic). Pokyny pro práci s AI asistentem při dalším vývoji jsou popsány v souboru [AGENTS.md](AGENTS.md). Vývojové postupy a vzory pak v [SKILLS.md](SKILLS.md).

---

## Licence

Projekt je určen pro osobní použití.