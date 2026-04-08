# 💰 CashinoU

Osobní finanční tracker – webová aplikace pro sledování příjmů, výdajů a finanční bilance.

## Co aplikace dělá

- Přidávání příjmů a výdajů s vlastními kategoriemi a ikonkami
- Přehled bilance, příjmů a výdajů s měsíčním filtrováním
- Vizualizace dat pomocí grafů (koláčový, sloupcový, čárový vývoj)
- Opakující se platby s nastavitelnou frekvencí (denně až ročně)
- Měsíční limity na kategorie s upozorněním při překročení
- Export dat ve formátu CSV
- Plně responzivní – funguje na počítači i mobilu
- Funguje offline (PWA – Progressive Web App)
- Dark / light mode

## Technologie

- **HTML** – struktura aplikace
- **CSS** – vzhled, responzivní design, dark/light mode
- **JavaScript** – logika aplikace, práce s daty
- **Chart.js** – vizualizace grafů
- **localStorage** – ukládání dat v prohlížeči
- **Service Worker** – offline podpora (PWA)

## Jak spustit

### Možnost 1 – Lokálně
1. Stáhni celou složku projektu (nebo git clone)
2. Otevři index.html v prohlížeči
3. Aplikace funguje okamžitě, bez instalace

### Možnost 2 – Online
Aplikace je dostupná na: [cashinou.netlify.app](https://cashinou.netlify.app)

### Možnost 3 – Ze zdrojového kódu
```bash
git clone https://github.com/jakubkasal/cashinou.git
cd cashinou
# Otevři index.html v prohlížeči
open index.html
```

## Instalace na mobilní zařízení (PWA)

### iOS (iPhone/iPad)
1. Otevři aplikaci v **Safari**
2. Klepni na ikonu sdílení ⬆
3. Vyber **"Přidat na plochu"**
4. Aplikace se chová jako nativní app

### Android
1. Otevři aplikaci v **Chrome**
2. Klepni na **"Přidat na plochu"** (banner nebo menu)

## Struktura projektu

```
cashinou/
├── index.html      # Struktura aplikace (HTML)
├── style.css       # Vzhled aplikace (CSS)
├── cashinou.png    # Logo aplikace
├── tests.html      # Spouštěč automatických testů
├── tests.js        # Automatické testy
├── README.md       # Dokumentace
├── AGENTS.md       # Popis práce s AI nástrojem
└── SKILLS.md       # Postupy pro vývoj s AI
```

## Práce s AI

Při vývoji této aplikace byl použit AI nástroj Claude (Anthropic) jako pomocník.
Více informací v souboru [AGENTS.md](AGENTS.md).

## Testování

Automatické testy jsou dostupné v souboru `tests.html`.
Otevři ho v prohlížeči pro spuštění testů.
Testy pokrývají: výpočet bilance, ukládání dat, filtrování, vyhledávání, kategorie, opakující se platby, export CSV a validaci vstupů.