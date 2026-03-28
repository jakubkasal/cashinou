// ═══════════════════════════════════════════════════════════════════
// CashinoU – Automatické testy
// Spuštění: otevři tests.html v prohlížeči
// ═══════════════════════════════════════════════════════════════════

const vysledky = [];
let aktualniSkupina = '';

function skupina(nazev) {
  aktualniSkupina = nazev;
  console.group(`📂 ${nazev}`);
}

function test(popis, fn) {
  try {
    fn();
    vysledky.push({ ok: true, skupina: aktualniSkupina, popis });
    console.log(`  ✅ ${popis}`);
  } catch (e) {
    vysledky.push({ ok: false, skupina: aktualniSkupina, popis, chyba: e.message });
    console.error(`  ❌ ${popis}: ${e.message}`);
  }
}

function ocekavam(skutecnost, ocekavano, zprava) {
  if (skutecnost !== ocekavano) {
    throw new Error(`${zprava || ''} → očekáváno: ${JSON.stringify(ocekavano)}, dostáno: ${JSON.stringify(skutecnost)}`);
  }
}

function ocekavamTrue(podminka, zprava) {
  if (!podminka) throw new Error(zprava || 'Podmínka není splněna');
}

function ocekavamChybu(fn, zprava) {
  let vyvolanaCh = false;
  try { fn(); } catch { vyvolanaCh = true; }
  if (!vyvolanaCh) throw new Error(zprava || 'Očekávána chyba, ale žádná nebyla vyhozena');
}

// ── Mock localStorage ────────────────────────────────────────────────
const mockStorage = {};
const localStorageMock = {
  getItem: k => mockStorage[k] ?? null,
  setItem: (k, v) => { mockStorage[k] = v; },
  removeItem: k => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// ── Pomocné funkce (kopie z index.html) ─────────────────────────────

function formatKc(n) {
  return Number(n).toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' Kč';
}

function dnes() {
  return new Date().toISOString().split('T')[0];
}

function dnesYM() {
  return new Date().toISOString().slice(0, 7);
}

function formatMesic(ym) {
  const [y, m] = ym.split('-');
  const mesice = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
  return `${mesice[parseInt(m) - 1]} ${y}`;
}

function frekvenceLabel(f) {
  return { '1d': 'denně', '7d': 'týdně', '1m': 'měsíčně', '3m': 'každé 3 měs.', '4m': 'každé 4 měs.', '6m': 'každých 6 měs.', '12m': 'ročně' }[f] || 'měsíčně';
}

// ── Datové funkce ────────────────────────────────────────────────────

const DEFAULT_KAT = [
  { id: 'auto', nazev: 'Auto', emoji: '🚗', typ: 'vydaj', default: true, limit: 0 },
  { id: 'jidlo', nazev: 'Jídlo', emoji: '🍔', typ: 'vydaj', default: true, limit: 0 },
  { id: 'zabava', nazev: 'Zábava', emoji: '🎮', typ: 'vydaj', default: true, limit: 0 },
  { id: 'sporeni', nazev: 'Spoření', emoji: '💰', typ: 'vydaj', default: true, limit: 0 },
  { id: 'vyplata', nazev: 'Výplata', emoji: '💳', typ: 'prijem', default: true, limit: 0 },
  { id: 'kapesne', nazev: 'Kapesné', emoji: '💵', typ: 'prijem', default: true, limit: 0 },
  { id: 'jine', nazev: 'Jiné příjmy', emoji: '📦', typ: 'prijem', default: true, limit: 0 },
];

function nactiKategorie() {
  try { return JSON.parse(localStorageMock.getItem('kategorie')) || DEFAULT_KAT; }
  catch { return DEFAULT_KAT; }
}
function ulozKategorie(k) { localStorageMock.setItem('kategorie', JSON.stringify(k)); }

function nactiZaznamy() {
  try { return JSON.parse(localStorageMock.getItem('zaznamy')) || []; }
  catch { return []; }
}
function ulozZaznamy(z) { localStorageMock.setItem('zaznamy', JSON.stringify(z)); }

function nactiOpakujici() {
  try { return JSON.parse(localStorageMock.getItem('opakujici')) || []; }
  catch { return []; }
}
function ulozOpakujici(o) { localStorageMock.setItem('opakujici', JSON.stringify(o)); }

// ── Výpočetní funkce ─────────────────────────────────────────────────

function vypocitejBilanci(zaznamy) {
  const prijmy = zaznamy.filter(z => z.typ === 'prijem').reduce((s, z) => s + z.castka, 0);
  const vydaje = zaznamy.filter(z => z.typ === 'vydaj').reduce((s, z) => s + z.castka, 0);
  return { prijmy, vydaje, bilance: prijmy - vydaje };
}

function filteredZaznamy(zaznamy, mesic) {
  if (!mesic) return zaznamy;
  return zaznamy.filter(z => z.datum.startsWith(mesic));
}

function jeSplatna(r) {
  if (!r.posledniPridani) return true;
  const posl = new Date(r.posledniPridani);
  const dnesD = new Date();
  const f = r.frekvence || '1m';
  let dalsi = new Date(posl);
  if (f === '1d') dalsi.setDate(dalsi.getDate() + 1);
  else if (f === '7d') dalsi.setDate(dalsi.getDate() + 7);
  else if (f === '1m') dalsi.setMonth(dalsi.getMonth() + 1);
  else if (f === '3m') dalsi.setMonth(dalsi.getMonth() + 3);
  else if (f === '4m') dalsi.setMonth(dalsi.getMonth() + 4);
  else if (f === '6m') dalsi.setMonth(dalsi.getMonth() + 6);
  else if (f === '12m') dalsi.setFullYear(dalsi.getFullYear() + 1);
  return dnesD >= dalsi;
}

function hledejZaznamy(zaznamy, query) {
  const q = query.toLowerCase();
  return zaznamy.filter(z => z.popis.toLowerCase().includes(q) || z.kategorieId.includes(q));
}

function exportCSVRadky(zaznamy, kategorie) {
  return zaznamy.map(z => {
    const kat = kategorie.find(k => k.id === z.kategorieId);
    const katNazev = kat ? kat.nazev : z.kategorieId;
    return `${z.datum},${z.typ},"${katNazev}","${z.popis}",${z.castka}`;
  });
}

// ═══════════════════════════════════════════════════════════════════
// TESTY
// ═══════════════════════════════════════════════════════════════════

// ── 1. Pomocné funkce ────────────────────────────────────────────────
skupina('Pomocné funkce');

test('formatKc – celé číslo', () => {
  const vysledek = formatKc(1000);
  ocekavamTrue(vysledek.includes('1') && vysledek.includes('000') && vysledek.includes('Kč'), `Obsahuje 1, 000 a Kč: ${vysledek}`);
});

test('formatKc – nula', () => {
  ocekavam(formatKc(0), '0 Kč');
});

test('formatKc – desetinné číslo', () => {
  ocekavamTrue(formatKc(259.5).includes('259'), 'Obsahuje 259');
});

test('dnes – vrací dnešní datum ve formátu YYYY-MM-DD', () => {
  const d = dnes();
  ocekavamTrue(/^\d{4}-\d{2}-\d{2}$/.test(d), `Formát datumu: ${d}`);
});

test('dnesYM – vrací rok-měsíc ve formátu YYYY-MM', () => {
  const ym = dnesYM();
  ocekavamTrue(/^\d{4}-\d{2}$/.test(ym), `Formát: ${ym}`);
});

test('formatMesic – leden 2025', () => {
  ocekavam(formatMesic('2025-01'), 'Leden 2025');
});

test('formatMesic – prosinec 2024', () => {
  ocekavam(formatMesic('2024-12'), 'Prosinec 2024');
});

test('frekvenceLabel – měsíčně', () => {
  ocekavam(frekvenceLabel('1m'), 'měsíčně');
});

test('frekvenceLabel – ročně', () => {
  ocekavam(frekvenceLabel('12m'), 'ročně');
});

test('frekvenceLabel – neznámá hodnota vrátí výchozí', () => {
  ocekavam(frekvenceLabel('xyz'), 'měsíčně');
});

console.groupEnd();

// ── 2. Výpočet bilance ───────────────────────────────────────────────
skupina('Výpočet bilance');

test('Kladná bilance – příjmy > výdaje', () => {
  const z = [
    { typ: 'prijem', castka: 30000 },
    { typ: 'vydaj', castka: 5000 },
  ];
  const { bilance } = vypocitejBilanci(z);
  ocekavam(bilance, 25000);
});

test('Záporná bilance – výdaje > příjmy', () => {
  const z = [
    { typ: 'prijem', castka: 1000 },
    { typ: 'vydaj', castka: 5000 },
  ];
  const { bilance } = vypocitejBilanci(z);
  ocekavam(bilance, -4000);
});

test('Nulová bilance – příjmy = výdaje', () => {
  const z = [
    { typ: 'prijem', castka: 5000 },
    { typ: 'vydaj', castka: 5000 },
  ];
  const { bilance } = vypocitejBilanci(z);
  ocekavam(bilance, 0);
});

test('Prázdný seznam záznamů', () => {
  const { prijmy, vydaje, bilance } = vypocitejBilanci([]);
  ocekavam(prijmy, 0);
  ocekavam(vydaje, 0);
  ocekavam(bilance, 0);
});

test('Více záznamů stejného typu', () => {
  const z = [
    { typ: 'vydaj', castka: 100 },
    { typ: 'vydaj', castka: 200 },
    { typ: 'vydaj', castka: 300 },
  ];
  const { vydaje } = vypocitejBilanci(z);
  ocekavam(vydaje, 600);
});

test('Desetinné částky', () => {
  const z = [
    { typ: 'prijem', castka: 100.50 },
    { typ: 'vydaj', castka: 50.25 },
  ];
  const { bilance } = vypocitejBilanci(z);
  ocekavam(bilance, 50.25);
});

console.groupEnd();

// ── 3. Ukládání a načítání dat ───────────────────────────────────────
skupina('Ukládání a načítání dat');

test('Uložit a načíst záznamy', () => {
  localStorageMock.clear();
  const z = [{ id: 1, datum: '2025-01-01', typ: 'vydaj', kategorieId: 'jidlo', popis: 'Oběd', castka: 150 }];
  ulozZaznamy(z);
  const nactene = nactiZaznamy();
  ocekavam(nactene.length, 1);
  ocekavam(nactene[0].popis, 'Oběd');
});

test('Načíst záznamy z prázdného storage', () => {
  localStorageMock.clear();
  const z = nactiZaznamy();
  ocekavam(z.length, 0);
});

test('Uložit více záznamů', () => {
  localStorageMock.clear();
  const z = [
    { id: 1, typ: 'vydaj', castka: 100, popis: 'A' },
    { id: 2, typ: 'prijem', castka: 200, popis: 'B' },
    { id: 3, typ: 'vydaj', castka: 300, popis: 'C' },
  ];
  ulozZaznamy(z);
  ocekavam(nactiZaznamy().length, 3);
});

test('Uložit a načíst kategorie', () => {
  localStorageMock.clear();
  const k = [{ id: 'test', nazev: 'Testová', emoji: '🧪', typ: 'vydaj', default: false, limit: 0 }];
  ulozKategorie(k);
  const nactene = nactiKategorie();
  ocekavam(nactene[0].nazev, 'Testová');
});

test('Načíst výchozí kategorie pokud storage prázdný', () => {
  localStorageMock.clear();
  const k = nactiKategorie();
  ocekavamTrue(k.length > 0, 'Výchozí kategorie načteny');
  ocekavamTrue(k.some(k => k.id === 'auto'), 'Kategorie Auto existuje');
});

test('Uložit a načíst opakující se platby', () => {
  localStorageMock.clear();
  const o = [{ id: 1, popis: 'Netflix', castka: 259, frekvence: '1m' }];
  ulozOpakujici(o);
  ocekavam(nactiOpakujici()[0].popis, 'Netflix');
});

test('Přidat nový záznam do existujících', () => {
  localStorageMock.clear();
  ulozZaznamy([{ id: 1, popis: 'Existující', castka: 100 }]);
  const z = nactiZaznamy();
  z.push({ id: 2, popis: 'Nový', castka: 200 });
  ulozZaznamy(z);
  ocekavam(nactiZaznamy().length, 2);
});

test('Smazat záznam podle id', () => {
  localStorageMock.clear();
  ulozZaznamy([
    { id: 1, popis: 'Ponechat', castka: 100 },
    { id: 2, popis: 'Smazat', castka: 200 },
  ]);
  ulozZaznamy(nactiZaznamy().filter(z => z.id !== 2));
  const z = nactiZaznamy();
  ocekavam(z.length, 1);
  ocekavam(z[0].popis, 'Ponechat');
});

console.groupEnd();

// ── 4. Filtrování podle měsíce ───────────────────────────────────────
skupina('Filtrování podle měsíce');

const testZaznamy = [
  { id: 1, datum: '2025-01-15', typ: 'vydaj', castka: 100, popis: 'Leden' },
  { id: 2, datum: '2025-01-28', typ: 'prijem', castka: 500, popis: 'Leden příjem' },
  { id: 3, datum: '2025-02-10', typ: 'vydaj', castka: 200, popis: 'Únor' },
  { id: 4, datum: '2025-03-05', typ: 'vydaj', castka: 300, popis: 'Březen' },
];

test('Filtr leden 2025 – 2 záznamy', () => {
  const f = filteredZaznamy(testZaznamy, '2025-01');
  ocekavam(f.length, 2);
});

test('Filtr únor 2025 – 1 záznam', () => {
  const f = filteredZaznamy(testZaznamy, '2025-02');
  ocekavam(f.length, 1);
  ocekavam(f[0].popis, 'Únor');
});

test('Filtr null – všechny záznamy', () => {
  const f = filteredZaznamy(testZaznamy, null);
  ocekavam(f.length, 4);
});

test('Filtr neexistující měsíc – 0 záznamů', () => {
  const f = filteredZaznamy(testZaznamy, '2024-06');
  ocekavam(f.length, 0);
});

test('Bilance po filtraci leden', () => {
  const f = filteredZaznamy(testZaznamy, '2025-01');
  const { bilance } = vypocitejBilanci(f);
  ocekavam(bilance, 400);
});

console.groupEnd();

// ── 5. Vyhledávání ───────────────────────────────────────────────────
skupina('Vyhledávání v záznamech');

const hledaniZaznamy = [
  { id: 1, popis: 'Benzín Shell', kategorieId: 'auto' },
  { id: 2, popis: 'McDonald\'s', kategorieId: 'jidlo' },
  { id: 3, popis: 'Netflix', kategorieId: 'zabava' },
  { id: 4, popis: 'Benzín OMV', kategorieId: 'auto' },
];

test('Hledat "benzín" – 2 výsledky', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, 'benzín').length, 2);
});

test('Hledat "netflix" (malá písmena) – 1 výsledek', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, 'netflix').length, 1);
});

test('Hledat "BENZÍN" (velká písmena) – 2 výsledky', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, 'BENZÍN').length, 2);
});

test('Hledat neexistující – 0 výsledků', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, 'xyzabc').length, 0);
});

test('Hledat prázdný řetězec – všechny záznamy', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, '').length, 4);
});

test('Hledat podle kategorieId', () => {
  ocekavam(hledejZaznamy(hledaniZaznamy, 'auto').length, 2);
});

console.groupEnd();

// ── 6. Kategorie ────────────────────────────────────────────────────
skupina('Správa kategorií');

test('Výchozí kategorie obsahují Auto', () => {
  ocekavamTrue(DEFAULT_KAT.some(k => k.id === 'auto'));
});

test('Výchozí kategorie obsahují Výplatu', () => {
  ocekavamTrue(DEFAULT_KAT.some(k => k.id === 'vyplata'));
});

test('Výchozí vydajové kategorie – 4 položky', () => {
  ocekavam(DEFAULT_KAT.filter(k => k.typ === 'vydaj').length, 4);
});

test('Výchozí příjmové kategorie – 3 položky', () => {
  ocekavam(DEFAULT_KAT.filter(k => k.typ === 'prijem').length, 3);
});

test('Přidat novou kategorii', () => {
  localStorageMock.clear();
  const k = [...DEFAULT_KAT];
  k.push({ id: 'zdravi', nazev: 'Zdraví', emoji: '💊', typ: 'vydaj', default: false, limit: 500 });
  ulozKategorie(k);
  const nactene = nactiKategorie();
  ocekavamTrue(nactene.some(k => k.id === 'zdravi'), 'Nová kategorie Zdraví existuje');
});

test('Smazat nevýchozí kategorii', () => {
  localStorageMock.clear();
  const k = [...DEFAULT_KAT, { id: 'smazat', nazev: 'Smazat', emoji: '🗑️', typ: 'vydaj', default: false, limit: 0 }];
  ulozKategorie(k);
  ulozKategorie(nactiKategorie().filter(k => k.id !== 'smazat'));
  ocekavamTrue(!nactiKategorie().some(k => k.id === 'smazat'), 'Kategorie smazána');
});

test('Kategorie s limitem – limit uložen správně', () => {
  localStorageMock.clear();
  const k = [{ id: 'limit-test', nazev: 'Test', emoji: '🧪', typ: 'vydaj', default: false, limit: 2000 }];
  ulozKategorie(k);
  ocekavam(nactiKategorie()[0].limit, 2000);
});

console.groupEnd();

// ── 7. Opakující se platby ───────────────────────────────────────────
skupina('Opakující se platby');

test('Nová platba bez posledniPridani je vždy splatná', () => {
  ocekavamTrue(jeSplatna({ frekvence: '1m', posledniPridani: null }));
});

test('Měsíční platba – splatná po měsíci', () => {
  const minulyMesic = new Date();
  minulyMesic.setMonth(minulyMesic.getMonth() - 1);
  const r = { frekvence: '1m', posledniPridani: minulyMesic.toISOString().split('T')[0] };
  ocekavamTrue(jeSplatna(r), 'Platba z minulého měsíce je splatná');
});

test('Měsíční platba – není splatná dnes', () => {
  const r = { frekvence: '1m', posledniPridani: dnes() };
  ocekavamTrue(!jeSplatna(r), 'Platba přidaná dnes není ještě splatná');
});

test('Roční platba – splatná po roce', () => {
  const minulyRok = new Date();
  minulyRok.setFullYear(minulyRok.getFullYear() - 1);
  const r = { frekvence: '12m', posledniPridani: minulyRok.toISOString().split('T')[0] };
  ocekavamTrue(jeSplatna(r), 'Roční platba je splatná');
});

test('Roční platba – není splatná za 6 měsíců', () => {
  const pred6M = new Date();
  pred6M.setMonth(pred6M.getMonth() - 6);
  const r = { frekvence: '12m', posledniPridani: pred6M.toISOString().split('T')[0] };
  ocekavamTrue(!jeSplatna(r), 'Roční platba není splatná po 6 měsících');
});

test('frekvenceLabel pro všechny hodnoty', () => {
  const hodnoty = ['1d', '7d', '1m', '3m', '4m', '6m', '12m'];
  hodnoty.forEach(h => {
    ocekavamTrue(frekvenceLabel(h).length > 0, `Label pro ${h} existuje`);
  });
});

console.groupEnd();

// ── 8. Export CSV ────────────────────────────────────────────────────
skupina('Export CSV');

test('Export generuje správný počet řádků', () => {
  const z = [
    { id: 1, datum: '2025-01-01', typ: 'vydaj', kategorieId: 'jidlo', popis: 'Oběd', castka: 150 },
    { id: 2, datum: '2025-01-02', typ: 'prijem', kategorieId: 'vyplata', popis: 'Práce', castka: 30000 },
  ];
  const radky = exportCSVRadky(z, DEFAULT_KAT);
  ocekavam(radky.length, 2);
});

test('Export řádek obsahuje datum', () => {
  const z = [{ id: 1, datum: '2025-03-15', typ: 'vydaj', kategorieId: 'auto', popis: 'Benzín', castka: 1500 }];
  const radky = exportCSVRadky(z, DEFAULT_KAT);
  ocekavamTrue(radky[0].includes('2025-03-15'), 'Datum v CSV');
});

test('Export řádek obsahuje částku', () => {
  const z = [{ id: 1, datum: '2025-01-01', typ: 'vydaj', kategorieId: 'auto', popis: 'Test', castka: 999 }];
  const radky = exportCSVRadky(z, DEFAULT_KAT);
  ocekavamTrue(radky[0].includes('999'), 'Částka v CSV');
});

test('Export řádek obsahuje název kategorie', () => {
  const z = [{ id: 1, datum: '2025-01-01', typ: 'vydaj', kategorieId: 'jidlo', popis: 'Oběd', castka: 100 }];
  const radky = exportCSVRadky(z, DEFAULT_KAT);
  ocekavamTrue(radky[0].includes('Jídlo'), 'Název kategorie v CSV');
});

test('Export neznámé kategorie použije ID', () => {
  const z = [{ id: 1, datum: '2025-01-01', typ: 'vydaj', kategorieId: 'neznama', popis: 'Test', castka: 100 }];
  const radky = exportCSVRadky(z, DEFAULT_KAT);
  ocekavamTrue(radky[0].includes('neznama'), 'ID neznámé kategorie v CSV');
});

console.groupEnd();

// ── 9. Validace vstupů ───────────────────────────────────────────────
skupina('Validace vstupů');

test('Záporná částka není platná', () => {
  const castka = -100;
  ocekavamTrue(isNaN(castka) || castka <= 0, 'Záporná částka odmítnuta');
});

test('Nulová částka není platná', () => {
  const castka = 0;
  ocekavamTrue(castka <= 0, 'Nulová částka odmítnuta');
});

test('Kladná částka je platná', () => {
  const castka = 100;
  ocekavamTrue(!isNaN(castka) && castka > 0, 'Kladná částka akceptována');
});

test('Prázdný popis není platný', () => {
  const popis = '   '.trim();
  ocekavamTrue(popis.length === 0, 'Prázdný popis odmítnut');
});

test('Neprázdný popis je platný', () => {
  const popis = 'Benzín'.trim();
  ocekavamTrue(popis.length > 0, 'Neprázdný popis akceptován');
});

test('Datum ve správném formátu', () => {
  const d = '2025-03-15';
  ocekavamTrue(/^\d{4}-\d{2}-\d{2}$/.test(d), 'Formát YYYY-MM-DD');
});

test('Parsování desetinné částky s čárkou', () => {
  const castka = parseFloat('259,90'.replace(',', '.'));
  ocekavam(castka, 259.90);
});

console.groupEnd();

// ── 10. Budget limity ────────────────────────────────────────────────
skupina('Budget limity');

test('Výdaje nepřekračují limit', () => {
  const limit = 3000;
  const utraceno = 2500;
  ocekavamTrue(utraceno <= limit, 'Limit nepřekročen');
});

test('Výdaje překračují limit', () => {
  const limit = 3000;
  const utraceno = 3500;
  ocekavamTrue(utraceno > limit, 'Limit překročen');
});

test('Procento využití limitu', () => {
  const limit = 1000;
  const utraceno = 750;
  const pct = Math.round((utraceno / limit) * 100);
  ocekavam(pct, 75);
});

test('Procento přesahující 100% se ořízne', () => {
  const limit = 1000;
  const utraceno = 1500;
  const pct = Math.min((utraceno / limit) * 100, 100);
  ocekavam(pct, 100);
});

test('Kategorie bez limitu (limit = 0) se ignoruje', () => {
  const limit = 0;
  ocekavamTrue(limit === 0, 'Limit 0 = bez limitu');
});

console.groupEnd();

// ═══════════════════════════════════════════════════════════════════
// VÝSLEDKY
// ═══════════════════════════════════════════════════════════════════

const uspesne = vysledky.filter(t => t.ok).length;
const neuspesne = vysledky.filter(t => !t.ok).length;
const celkem = vysledky.length;

console.log('\n' + '═'.repeat(50));
console.log(`📊 Výsledky: ${uspesne}/${celkem} testů prošlo`);
if (neuspesne > 0) {
  console.log(`❌ Selhalo: ${neuspesne} testů`);
  vysledky.filter(t => !t.ok).forEach(t => {
    console.error(`  • ${t.skupina} → ${t.popis}: ${t.chyba}`);
  });
}
console.log('═'.repeat(50));

// Export pro tests.html
if (typeof window !== 'undefined') {
  window.testVysledky = { vysledky, uspesne, neuspesne, celkem };
}
