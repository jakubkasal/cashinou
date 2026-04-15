# AGENTS.md – CashinoU – Technická dokumentace pro AI asistenta

## Přehled projektu

CashinoU je osobní finanční tracker – Single Page Application (SPA) v čistém HTML/CSS/JavaScript bez frameworků.

- **GitHub:** github.com/jakubkasal/cashinou
- **Produkce:** cashinou.netlify.app

---

## Struktura souborů

- `index.html` – veškerá HTML struktura + celá JavaScript logika
- `style.css` – všechny styly

Žádné buildovací nástroje, žádné závislosti přes npm. Vše běží přímo v prohlížeči.

---

## Architektura

### Navigace
- **Desktop:** postranní sidebar s tlačítky
- **Mobil:** spodní navigation bar s 5 tlačítky (Přehled, Grafy, ➕Přidat, Platby, Více)
- Přepínání stránek přes funkci `showPage()` – skrývá/zobrazuje `div` elementy

### Ukládání dat
Vše v `localStorage` prohlížeče. Žádný backend, žádná databáze.

---

## Datové struktury (localStorage)

```js
// Záznamy příjmů a výdajů
zaznamy: [
  { id, datum, typ, kategorieId, popis, castka, recuring? }
]

// Kategorie
kategorie: [
  { id, nazev, emoji, typ, default, limit }
]

// Opakující se platby
opakujici: [
  { id, typ, kategorieId, popis, castka, frekvence, datumPrvni, posledniPridani }
]

// Téma
theme: "light" | "dark"
```

---

## Hlavní funkce

| Funkce | Popis |
|--------|-------|
| Přidávání záznamů | příjem/výdaj, kategorie, popis, částka, datum |
| Přehled | filtrování podle měsíce, vyhledávání, filtr kategorie |
| Grafy | Chart.js – koláčový, sloupcový, čárový |
| Opakující se platby | nastaví se jednou, při každém spuštění se automaticky přidají splatné záznamy |
| Kategorie | emoji ikonky + měsíční limity |
| Export | CSV export |
| Téma | dark/light mode |

---

## Klíčové technické detaily

### `posunDatum(datum, mesice)`
Vlastní funkce pro posunutí data o měsíce bez přetékání.
- Příklad: 31. března + 1 měsíc = 30. dubna (ne 1. května)

### `aplikujOpakujici()`
- Volá se automaticky při každém spuštění aplikace
- Prochází `opakujici` a přidává záznamy, které jsou splatné
- Obsahuje ochranu proti duplikátům

### PWA / Service Worker
- Service Worker je aktivní, verze cache: `cashinou-v3`
- Manifest se generuje dynamicky přes `Blob` a `URL.createObjectURL`
- Podporuje offline provoz

---

## Konvence a tipy pro práci s kódem

- Veškerá logika je v `index.html` – hledej funkce přímo tam
- Při úpravě dat v localStorage vždy aktualizuj celé pole (`JSON.stringify`)
- Kategorie mají `typ: "prijem" | "vydaj"` – hlídat při filtrování
- `id` záznamů se generuje přes `Date.now()` nebo podobný timestamp
- Grafy se překreslují při každém přepnutí na stránku Grafy
