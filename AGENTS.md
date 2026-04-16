# AGENTS.md — CashinoU Financial Tracker

Primary context file for AI assistants working in this codebase. Read this before writing any code.

---

## 1. Role & Persona

You are a **senior front-end engineer** maintaining a personal finance application. Approach every task with:

- **Precision over cleverness.** Financial numbers displayed to the user must always be formatted with `formatKc()`. Never concatenate raw floats into the UI.
- **Data integrity first.** All writes to `localStorage` go through the dedicated save helpers (`ulozZaznamy`, `ulozKategorie`, `ulozOpakujici`). Never call `localStorage.setItem` directly in feature code.
- **Minimal footprint.** This is an intentionally zero-dependency SPA. Do not introduce npm packages, bundlers, or frameworks. Every CDN script added is a trade-off that must be justified.
- **Czech-aware.** The UI language is Czech. Variable names, function names, and user-facing strings follow Czech conventions. Maintain that consistency when adding code.

---

## 2. Tech Stack Overview

| Layer | Technology |
|---|---|
| Markup / Logic | Plain HTML5 + Vanilla JavaScript (ES2020+) |
| Styling | Custom CSS with CSS custom properties (no framework) |
| Charts | Chart.js 4.x (loaded from CDN) |
| Typography | Google Fonts — DM Sans (body), DM Mono (amounts) |
| Data persistence | `localStorage` (JSON-serialised, single-user, no backend) |
| Desktop packaging | Electron ^41.2.0 + electron-builder ^26.8.1 |
| PWA | Service Worker (`cashinou-v3` cache key) + dynamic Web App Manifest |
| Testing | Custom test runner (`tests.js` / `tests.html`), no external framework |

There is no build step, no TypeScript compiler, and no module bundler. The application runs directly from `index.html`.

---

## 3. Project Structure

```
apka/
├── index.html        # Entire SPA: HTML skeleton + all JavaScript (~1 080 lines)
├── style.css         # All styling + responsive design (~1 178 lines)
├── tests.js          # Unit tests and custom assertion helpers
├── tests.html        # Visual test runner UI
├── cashinou.png      # Application logo
├── package-lock.json # Electron/electron-builder dependency lock
├── README.md         # End-user documentation (Czech)
├── AGENTS.md         # This file — AI assistant context
└── .gitignore        # Excludes node_modules/, dist/
```

**Distribution output** (generated, not committed):
```
dist/mac-arm64/       # Electron packaged desktop app
```

Because all application logic lives in `index.html`, locate code by searching for function names or HTML IDs — there is no module import map.

---

## 4. Coding Standards

### JavaScript

- **ES2020 vanilla JS only.** Arrow functions, `const`/`let`, template literals, optional chaining — all fine. No TypeScript, no JSX, no module syntax (`import`/`export`).
- **No external libraries** beyond Chart.js. Utility needs (date arithmetic, formatting) are solved inline.
- **ID generation:** `Date.now()` — a numeric timestamp — used as the primary key for all records and recurring payments.

### Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Functions | camelCase, Czech verbs | `ulozZaznam()`, `renderPrehled()`, `smazatKategorii()` |
| Variables | camelCase, Czech nouns | `zaznamy`, `aktivniTyp`, `editZaznamId` |
| HTML element IDs | kebab-case | `modal-zaznam`, `form-kategorie`, `rec-list` |
| Category IDs | prefixed string | `"auto"`, `"jidlo"`, `"kat_<timestamp>"` (user-created) |
| Date strings | ISO `YYYY-MM-DD` | `"2025-04-01"` |
| Month strings | `YYYY-MM` | `"2025-04"` |

**Function name prefixes:**

| Prefix | Meaning |
|---|---|
| `nacti...` | Load / read from localStorage |
| `uloz...` | Save / write to localStorage |
| `render...` / `zobraz...` | Build and inject HTML into the DOM |
| `smazat` / `smazej` | Delete |
| `zavrit` | Close (modals) |
| `aplikuj...` | Apply business logic (e.g., recurring payments) |

### CSS

- All colour and spacing tokens are defined as CSS custom properties on `:root`. **Never hardcode hex colours in new rules** — reference an existing variable.
- Dark theme is the default. Light theme is the `body.light` override block. Any new colour token needs both a `:root` value and a `body.light` value.
- The single responsive breakpoint is **768px**: `@media (max-width: 768px)` for mobile, desktop is ≥ 769px.

**Core design tokens (from `:root`):**

```css
--bg: #0e0e11          /* page background */
--surface: #17171c     /* card background */
--surface2: #1f1f26    /* hover / secondary surfaces */
--border: #2a2a35      /* all borders */
--text: #e8e8f0        /* primary text */
--muted: #666680       /* secondary / hint text */
--accent: #6366f1      /* primary CTA */
--green: #22c55e       /* income / savings */
--red: #ef4444         /* expenses / danger */
--blue: #3b82f6        /* informational */
--yellow: #f59e0b      /* warnings / budget alerts */
```

---

## 5. Domain Logic Rules

### Amounts & Formatting

1. **Always use `formatKc(n)`** to display any monetary value to the user. Never write raw numbers into the DOM.
   ```javascript
   // Correct
   el.textContent = formatKc(zaznam.castka);
   // Wrong
   el.textContent = zaznam.castka + ' Kč';
   ```
2. `formatKc` uses `toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })` and appends ` Kč`. Output examples: `"1 500 Kč"`, `"1 234,56 Kč"`.
3. **The currency is always CZK (Czech Koruna).** There is no multi-currency support. Do not parameterise the currency symbol.
4. **Parse input amounts with `parseFloat()`**, not `parseInt`. Amounts can have decimal places.
5. **Native JS `Number` arithmetic is used** throughout (no Decimal.js). Maintain this — do not introduce Decimal.js unless the task explicitly requires arbitrary-precision arithmetic.

### Transaction Records (`zaznamy`)

Every record object must conform to this shape:

```javascript
{
  id: number,              // Date.now() at creation — used as primary key
  datum: "YYYY-MM-DD",    // ISO date string
  typ: "prijem" | "vydaj", // income or expense — never any other string
  kategorieId: string,    // must reference an existing category id
  popis: string,          // user-provided description (can be empty string)
  castka: number,         // positive float; amount in CZK
  recuring?: boolean,     // true only when auto-inserted by aplikujOpakujici()
  cerpani?: boolean       // true only when this is a savings-withdrawal helper record
}
```

Rules:
- `castka` must always be **positive**. The sign of the transaction is carried by `typ`.
- `id` uniqueness is guaranteed by `Date.now()`. Do not generate IDs any other way.
- Records with `cerpani: true` are synthetic income entries created to offset a savings withdrawal expense. They must never appear as real income in balance calculations — filter them with `!z.cerpani` where needed.

### Categories (`kategorie`)

```javascript
{
  id: string,              // "auto" | "jidlo" | "kat_<timestamp>" (user-created)
  nazev: string,           // display name
  emoji: string,           // single Unicode emoji
  typ: "prijem" | "vydaj",
  default: boolean,        // true for the 7 built-in categories; false for user-created
  limit: number            // monthly budget cap in CZK; 0 means no limit
}
```

Rules:
- **Never delete or modify the 7 default categories** in code. Their IDs (`auto`, `jidlo`, `zabava`, `sporeni`, `vyplata`, `kapesne`, `jine`) are referenced throughout the codebase.
- User-created category IDs follow the pattern `"kat_" + Date.now()`.
- Budget limit `0` means "unlimited" — treat it as such in all budget-alert logic.

### Recurring Payments (`opakujici`)

```javascript
{
  id: number,
  typ: "prijem" | "vydaj",
  kategorieId: string,
  popis: string,
  castka: number,
  frekvence: string,         // one of: "1d" | "7d" | "1m" | "3m" | "4m" | "6m" | "12m"
  datumPrvni: "YYYY-MM-DD", // first scheduled payment date
  posledniPridani: "YYYY-MM-DD" // last date a record was auto-inserted
}
```

- Auto-insertion happens in `aplikujOpakujici()`, called once on app init.
- Records auto-inserted by this function carry `recuring: true` (note: the field name is misspelled — preserve this spelling for backward compatibility with stored data).
- Do not call `aplikujOpakujici()` more than once per session.

### Balance Calculation

```javascript
const prijmy = zaznamy.filter(z => z.typ === 'prijem' && !z.cerpani)
  .reduce((s, z) => s + z.castka, 0);
const vydaje = zaznamy.filter(z => z.typ === 'vydaj')
  .reduce((s, z) => s + z.castka, 0);
const bilance = prijmy - vydaje;
```

Always exclude `cerpani` records from income totals. Always include all `vydaj` records in expenses.

### Savings Withdrawal Flow

When a user withdraws from savings (`cerpani` checkbox checked):

1. Validate `available savings >= withdrawal amount` before saving.
2. Push the user's expense record (normal `vydaj`).
3. Push a second synthetic income record: `{ typ: 'prijem', kategorieId: 'sporeni', cerpani: true, ... }`.
4. This synthetic record reduces the displayed savings balance without inflating total income.

### Date Arithmetic

Use the existing `posunDatum(datum, frekvence)` helper for all date shifting. It handles month-end overflow correctly (e.g., 31 March + 1 month → 30 April, not 1 May). Do not use raw `Date` arithmetic for month-based offsets.

### Service Worker Cache

The cache key is `cashinou-v3` (hardcoded string). **Increment this version** (`cashinou-v4`, etc.) whenever you change files that need to be re-fetched by existing PWA installs (`index.html`, `style.css`, Chart.js CDN URL).

---

## 6. Standard Workflows

### Adding a New Transaction Field

1. **Update the record shape** — add the optional field to the data-model comment block near the `ulozZaznam` function in `index.html`.
2. **Update `ulozZaznam()`** — read the new field from the form and include it in the object pushed to `zaznamy`.
3. **Update render functions** — if the field changes how a record looks in lists or stats, update `renderZaznamy()` and `renderPrehled()`.
4. **Update `tests.js`** — add test cases for the new field (validation, persistence, display).
5. **Do not change existing field names or types** — `localStorage` already has serialised records; changing a field name without a migration function will silently drop data for existing users.

### Adding a New UI Component

1. **HTML structure** — add markup to `index.html` in the relevant `<section id="page-...">` block.
2. **CSS** — add styles to `style.css`. Use existing tokens (`var(--surface)`, `var(--border)`, etc.). Add a `@media (max-width: 768px)` block for the mobile layout.
3. **JavaScript** — add logic inline in `index.html`'s `<script>` block. Follow the `render...()` / `uloz...()` naming convention.
4. **No new files** — the SPA pattern is a deliberate architectural choice. Do not create separate `*.js` or `*.css` files for new features.

### Adding a New Page / Section

1. Add a `<section id="page-<name>" class="page">...</section>` block to `index.html`.
2. Add a navigation button to both the **desktop sidebar** (`<nav class="sidebar">`) and the **mobile bottom bar** (`<div class="bottom-nav">`).
3. Wire the button to the navigation function (e.g., `navigujNa('<name>')`).
4. Add a `render<Name>()` function that is called by the navigation handler on page switch.

### Adding a New Recurring Frequency

1. Add the new frequency string (e.g., `"2m"`) to the `<select name="frekvence">` options in the recurring-payment form.
2. Add a case for it in `posunDatum()` (or the relevant date-advance logic inside `aplikujOpakujici()`).
3. Add a test case in `tests.js` covering the new frequency boundary (e.g., end-of-month behaviour).

### Writing Tests

Use the existing helpers in `tests.js`:

```javascript
test('popis testu', () => {
  ocekavam(actual, expected, 'failure message');
  ocekavamTrue(condition, 'failure message');
  ocekavamChybu(() => { /* code expected to throw */ }, 'failure message');
});
```

Use `localStorageMock` (defined at the top of `tests.js`) instead of real `localStorage`. Reset it between tests that write data to avoid state leakage.

---

## 7. What to Avoid

- **Do not introduce a CSS framework** (Bootstrap, Tailwind, etc.). The design system is bespoke and complete.
- **Do not add a JS framework** (React, Vue, Svelte, etc.). The single-file architecture is intentional.
- **Do not call `localStorage` directly** in feature code — use the `nacti...` / `uloz...` helpers.
- **Do not display raw numbers** — always use `formatKc()`.
- **Do not hardcode colour values** in new CSS — use the existing custom property tokens.
- **Do not rename `recuring`** (the misspelled field on recurring-generated records) — it is persisted in users' `localStorage` and renaming it breaks existing data without a migration.
- **Do not modify default category IDs** or their `default: true` flag.
- **Do not speculatively add ARIA attributes** — the app does not currently use ARIA and partial ARIA is worse than none.
