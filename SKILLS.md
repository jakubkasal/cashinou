# SKILLS.md — CashinoU Financial Tracker

**Purpose:** This document is the primary "How-to" manual for any AI agent working with this codebase. It describes repeatable development patterns, domain-specific operations, and data integrity protocols derived from the actual source.

> **Audience:** AI agents, contributors, and automated tooling.
> **Source of truth:** `index.html` (all JS logic), `style.css` (all styling), `tests.js` (all tests).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Capabilities](#2-core-capabilities)
3. [Recipe: Adding a New Page / Feature](#3-recipe-adding-a-new-page--feature)
4. [Recipe: Creating a New Data Entity](#4-recipe-creating-a-new-data-entity)
5. [Recipe: Building a New Financial UI Component](#5-recipe-building-a-new-financial-ui-component)
6. [Recipe: Implementing a New Validation Rule](#6-recipe-implementing-a-new-validation-rule)
7. [Data Integrity Protocols](#7-data-integrity-protocols)
8. [Financial Calculation Rules](#8-financial-calculation-rules)
9. [Testing Procedures](#9-testing-procedures)
10. [Refactoring Guidelines](#10-refactoring-guidelines)
11. [Deployment Checklist](#11-deployment-checklist)

---

## 1. Architecture Overview

| Concern | Implementation |
|---|---|
| Language | Vanilla JavaScript (ES2020+), no bundler, no TypeScript |
| UI | Single `index.html` — SPA via JS-controlled `.page.active` class |
| Styling | `style.css` — CSS custom properties, single `768px` breakpoint |
| Persistence | `localStorage` only — three keys: `zaznamy`, `kategorie`, `opakujici` |
| Charts | Chart.js 4.x (CDN) — `doughnut`, `bar`, `line` |
| Testing | Custom zero-dependency runner in `tests.js` + `tests.html` |
| Packaging | Electron (dev-only) for macOS desktop app |
| Deployment | Netlify auto-deploy from `main` branch |
| Currency | CZK only — `formatKc()` for all display |

**There is no backend, no API, no database, no build step, and no framework.** Every change is made directly in `index.html` or `style.css`.

---

## 2. Core Capabilities

An agent working in this codebase can reliably perform the following tasks:

- [ ] Implementing new transaction categories (default or user-created)
- [ ] Adding new SPA pages with dual desktop/mobile navigation
- [ ] Building financial summary cards with CZK-formatted totals
- [ ] Implementing new recurring payment frequencies
- [ ] Generating new Chart.js charts (income, expenses, trends)
- [ ] Adding budget limit alerts for spending categories
- [ ] Implementing savings withdrawal flows (paired record pattern)
- [ ] Writing unit tests for financial logic functions
- [ ] Extending CSV export with new fields
- [ ] Adding new validation rules for financial inputs
- [ ] Safely refactoring `localStorage` data migrations
- [ ] Updating the Service Worker cache version on asset changes

---

## 3. Recipe: Adding a New Page / Feature

### Checklist

- [ ] **1. Add nav buttons** — add a `.nav-btn` to `<nav class="sidebar">` (desktop) AND a `.bottom-nav-btn` to `<nav class="bottom-nav">` (mobile); both call `showPage('yourpage', this)`
- [ ] **2. Add the page container** — add `<div id="page-yourpage" class="page">` in the HTML body alongside existing pages
- [ ] **3. Register the page** — the `showPage(name, btn)` function auto-handles any page ID; no registration array exists, but verify the ID matches exactly
- [ ] **4. Write a render function** — name it `renderYourPage()` following the `render...()` prefix convention; call it from `showPage()` or nav click handler
- [ ] **5. Mobile layout** — wrap desktop-only sections with `.desktop-only` and mobile equivalents with `.mobile-only`; provide separate `renderMobileYourPage()` if layout differs significantly
- [ ] **6. Do not touch other pages** — scope all changes; never modify existing render functions unless fixing a bug

### Naming Conventions

| Prefix | Purpose | Example |
|---|---|---|
| `nacti...()` | Read from `localStorage` | `nactiZaznamy()` |
| `uloz...()` | Write to `localStorage` | `ulozZaznamy(data)` |
| `render...()` / `zobraz...()` | Build and inject HTML | `renderPrehled()` |
| `smazat...()` / `smazej...()` | Delete data | `smazatKategorii(id)` |
| `aplikuj...()` | Apply business logic | `aplikujOpakujici()` |
| `zavrit...()` | Close a modal | `zavritModal('modal-zaznam')` |

### HTML ID Conventions

- Pages: `page-<name>` (kebab-case)
- Modals: `modal-<name>`
- Forms: `form-<name>`
- Lists: `<name>-list`

---

## 4. Recipe: Creating a New Data Entity

### Step 1 — Define the data shape

All entities are plain JS objects stored as JSON arrays in `localStorage`. Define the shape inline as a comment near the storage functions.

```javascript
// Shape: { id: number, datum: "YYYY-MM-DD", typ: "prijem"|"vydaj",
//           kategorieId: string, popis: string, castka: number }
```

### Step 2 — Write storage functions

Follow the exact pattern used for all three existing entities:

```javascript
function nactiNewEntity() {
  return JSON.parse(localStorage.getItem('newEntity') || '[]');
}

function ulozNewEntity(data) {
  localStorage.setItem('newEntity', JSON.stringify(data));
}
```

> **Rule:** Always parse with a fallback default (`'[]'` for arrays, `'{}'` for objects). Never read `localStorage` directly outside a `nacti...()` function.

### Step 3 — Generate IDs

```javascript
// Standard ID for user-created records:
id: Date.now()

// ID for auto-inserted records (multiple in same millisecond):
id: Date.now() + Math.random()

// ID for user-created categories:
id: 'prefix_' + Date.now()  // e.g. 'kat_1714000000000'
```

### Step 4 — Write CRUD operations

Follow the guard-clause pattern:

```javascript
function ulozNewRecord(data) {
  // validate first
  if (!data.castka || parseFloat(data.castka) <= 0) {
    showStatus('Zadej platnou částku.', 'err');
    return;
  }
  const records = nactiNewEntity();
  records.push({ id: Date.now(), ...data });
  ulozNewEntity(records);
  renderRelevantPage();
}

function smazatNewRecord(id) {
  const records = nactiNewEntity().filter(r => r.id !== id);
  ulozNewEntity(records);
  renderRelevantPage();
}
```

### Step 5 — Handle data migration (if needed)

If adding a new field to an existing entity, write a migration IIFE that runs at app init, following the pattern of the existing `migrujCerpani()` function:

```javascript
(function migrujNewField() {
  const records = nactiZaznamy();
  let changed = false;
  records.forEach(z => {
    if (z.newField === undefined) {
      z.newField = defaultValue;
      changed = true;
    }
  });
  if (changed) ulozZaznamy(records);
})();
```

> **Rule:** Always gate migration writes behind a `changed` flag to avoid unnecessary `localStorage` writes on every app start.

---

## 5. Recipe: Building a New Financial UI Component

### Summary Card (`.card`)

Use for displaying a single aggregate metric (total income, balance, savings):

```html
<div class="card">
  <div class="card-label">Label Text</div>
  <div class="card-value" style="color: var(--green);" id="my-value">0 Kč</div>
</div>
```

- Value must always be formatted with `formatKc(number)` — never raw `.toFixed(2)`
- Positive income → `var(--green)`, expenses → `var(--red)`, balance → `var(--blue)` or `var(--text)`
- Place inside a `.cards` container for automatic 3-column grid layout

### Transaction Row (`.record-item`)

```html
<div class="record-item">
  <span class="rec-emoji">${kat.emoji}</span>
  <div class="rec-main">
    <span class="rec-name">${z.popis || kat.nazev}</span>
    <span class="rec-date">${z.datum}</span>
  </div>
  <span class="rec-amount ${z.typ === 'prijem' ? 'green' : 'red'}">
    ${z.typ === 'prijem' ? '+' : '-'}${formatKc(z.castka)}
  </span>
  <button onclick="otevritEditZaznam(${z.id})">✏️</button>
</div>
```

> **Rule:** Always prefix income amounts with `+` and expense amounts with `-` for clarity. Use `.green` / `.red` helper classes for colour.

### Chart Component

Always destroy existing instance before creating a new one to prevent Canvas reuse errors:

```javascript
function renderMyChart() {
  if (charts['my-chart-id']) {
    charts['my-chart-id'].destroy();
  }
  const ctx = document.getElementById('my-chart-id');
  if (!ctx) return;
  charts['my-chart-id'] = new Chart(ctx, {
    type: 'bar',
    data: { ... },
    options: {
      color: getColor('--text'),
      scales: {
        x: { grid: { color: getColor('--border') } },
        y: { grid: { color: getColor('--border') } }
      }
    }
  });
}
```

> **Rule:** Read all theme colours from CSS custom properties via `getColor('--token')` at render time — never hardcode hex values inside chart config. This ensures correct colours in both dark and light modes.

### Type Toggle (`.type-toggle`)

For any form that switches between income/expense:

```html
<div class="type-toggle">
  <button class="type-btn active" onclick="setTyp('vydaj', this)">Výdaj</button>
  <button class="type-btn" onclick="setTyp('prijem', this)">Příjem</button>
</div>
```

Manage state with a module-scope variable (e.g. `let aktivniTyp = 'vydaj'`). Update `.active` class on the clicked button; re-render the category selector filtered to matching `typ`.

### Modal

```html
<div id="modal-new" class="modal-overlay">
  <div class="modal">
    <h3>Title</h3>
    <!-- form fields -->
    <div class="modal-actions">
      <button class="btn-danger" onclick="smazatNew(editNewId)">Smazat</button>
      <button class="btn-primary" onclick="ulozEditNew()">Uložit</button>
    </div>
    <button class="modal-close" onclick="zavritModal('modal-new')">✕</button>
  </div>
</div>
```

Open: `document.getElementById('modal-new').classList.add('open')`
Close: `zavritModal('modal-new')` — this removes `.open`

---

## 6. Recipe: Implementing a New Validation Rule

### Pattern

All validation uses the guard-clause style — check, show error, `return`. There is no validation library.

```javascript
function ulozMyForm() {
  const input = document.getElementById('my-input').value.trim();
  const amount = parseFloat(document.getElementById('my-amount').value);
  const status = document.getElementById('my-status');

  // Rule 1: required text field
  if (!input) {
    status.textContent = 'Popis nesmí být prázdný.';
    status.className = 'status-msg err';
    return;
  }

  // Rule 2: positive numeric amount
  if (isNaN(amount) || amount <= 0) {
    status.textContent = 'Zadej kladnou částku.';
    status.className = 'status-msg err';
    return;
  }

  // Rule 3: domain-specific (e.g. savings withdrawal limit)
  if (amount > availableSavings) {
    status.textContent = 'Nelze čerpat více, než je na spoření.';
    status.className = 'status-msg err';
    return;
  }

  // All valid — proceed
  status.textContent = 'Uloženo.';
  status.className = 'status-msg ok';
  // ... save logic
}
```

### Validation Rules Checklist

| Input Type | Rule | Implementation |
|---|---|---|
| Amount field | Must not be empty | `!value` check before `parseFloat` |
| Amount field | Must be a positive number | `isNaN(parsed) \|\| parsed <= 0` |
| Amount field | Supports decimals | Use `parseFloat()`, not `parseInt()` |
| Text field (description) | Optional unless required by domain | Check `value.trim()` |
| Category limit | `0` means "no limit" | Skip budget alert when `limit === 0` |
| Savings withdrawal | Cannot exceed current savings balance | Compute balance live before saving |
| Date field | ISO `YYYY-MM-DD` format | Use `<input type="date">` — browser enforces format |

### Status Message Display

```javascript
// Error
status.textContent = 'Error message here.';
status.className = 'status-msg err';   // red

// Success
status.textContent = 'Uloženo.';
status.className = 'status-msg ok';    // green

// Clear
status.textContent = '';
status.className = 'status-msg';
```

---

## 7. Data Integrity Protocols

These rules prevent data corruption in `localStorage`-persisted financial records.

### 7.1 The `recuring` Misspelling — DO NOT FIX

Auto-inserted recurring records have a field spelled `recuring: true` (one `r`). This is a backward-compatibility constraint — existing user data in `localStorage` uses this spelling. **Never rename it to `recurring`.** Any duplicate-prevention logic that checks for this field must use the misspelled form.

### 7.2 `cerpani` Records — Synthetic Income

When a user withdraws from savings, two records are created atomically:

```javascript
// 1. The actual expense (what was purchased)
zaznamy.push({
  id: Date.now(),
  datum: datum,
  typ: 'vydaj',
  kategorieId: selectedKatId,
  popis: popis,
  castka: amount
});

// 2. Synthetic offset — MUST be created in the same operation
zaznamy.push({
  id: Date.now() + Math.random(), // avoid ID collision
  datum: datum,
  typ: 'prijem',
  kategorieId: 'sporeni',
  cerpani: true,
  popis: 'Čerpání: ' + popis,
  castka: amount
});
ulozZaznamy(zaznamy);
```

**Rules for `cerpani` records:**
- Always exclude them from real income totals: `zaznamy.filter(z => z.typ === 'prijem' && !z.cerpani)`
- Always include them in savings balance: `z.typ === 'vydaj' ? sum + z.castka : sum - z.castka`
- Never display them as standalone income in transaction lists — always render them as part of the savings context

### 7.3 Income vs. Expense Totals

The correct formula for main balance display:

```javascript
// CORRECT
const income = zaznamy.filter(z => z.typ === 'prijem' && !z.cerpani)
  .reduce((s, z) => s + z.castka, 0);
const expenses = zaznamy.filter(z => z.typ === 'vydaj')
  .reduce((s, z) => s + z.castka, 0);
const balance = income - expenses;

// WRONG — includes synthetic cerpani in income
const income = zaznamy.filter(z => z.typ === 'prijem') // BUG
```

### 7.4 Savings Balance Formula

```javascript
// Savings deposits are vydaj (expense) into sporeni category
// Withdrawals reduce the balance via cerpani synthetic income
const savings = zaznamy
  .filter(z => z.kategorieId === 'sporeni')
  .reduce((s, z) => z.typ === 'vydaj' ? s + z.castka : s - z.castka, 0);
```

### 7.5 Duplicate Prevention in Recurring Payments

Before inserting an auto-generated recurring record, check for an existing record with all three matching conditions:

```javascript
const alreadyExists = zaznamy.some(z =>
  z.recuring === true &&           // note: one 'r'
  z.kategorieId === op.kategorieId &&
  z.popis === op.popis &&
  z.datum.startsWith(dalsiStr.slice(0, 7)) // YYYY-MM match
);
if (!alreadyExists) {
  zaznamy.push({ ..., recuring: true });
}
```

### 7.6 Month-End Date Arithmetic

Never use `setDate(date.getDate() + 30)` for monthly calculations. Use `posunDatum()`:

```javascript
// CORRECT — handles overflow (March 31 + 1m = April 30)
const next = posunDatum(currentDate, '1m', 1);

// WRONG — April has 30 days, this produces May 1
const d = new Date(date);
d.setMonth(d.getMonth() + 1); // BUG if day > 28
```

### 7.7 Amount Precision

All amounts are stored as native JS `Number` (floats). Use `parseFloat()` for all parsing:

```javascript
const castka = parseFloat(input.value);  // correct — supports decimals
// NOT parseInt — would discard cents
```

Display via `formatKc(n)` — uses `toLocaleString('cs-CZ', { minimumFractionDigits:0, maximumFractionDigits:2 })`. Never call `.toFixed()` directly in render functions.

### 7.8 `localStorage` Write Discipline

- Always read the full array, mutate, then write the full array back
- Never write partial updates or merge without reading first
- After any write, immediately call the relevant `render...()` function

```javascript
// CORRECT
const data = nactiZaznamy();
data.push(newRecord);
ulozZaznamy(data);
renderPrehled();
```

---

## 8. Financial Calculation Rules

### Budget Alert Logic

```javascript
// Only alert when limit > 0 (limit === 0 means "no limit")
if (kat.limit > 0) {
  const spent = zaznamy
    .filter(z => z.datum.startsWith(currentMonth) && z.typ === 'vydaj' && z.kategorieId === kat.id)
    .reduce((s, z) => s + z.castka, 0);
  const pct = Math.min((spent / kat.limit) * 100, 100); // clamp to 100%
  // Show alert only if pct >= 50
  // Style: yellow warning (50–99%), red over-limit (100%)
}
```

### Month Filtering

```javascript
// Current month string: "YYYY-MM"
const mesic = datum.slice(0, 7); // or dnesYM()

// Filter records to a month
const mesicniZaznamy = zaznamy.filter(z => z.datum.startsWith(mesic));

// "All time" is represented by aktivniMesic === null
const filtered = aktivniMesic
  ? zaznamy.filter(z => z.datum.startsWith(aktivniMesic))
  : zaznamy;
```

### Records Display Cap

The overview page renders only the 50 most recent records to avoid DOM performance issues. Always sort descending by date and slice:

```javascript
const sorted = zaznamy.sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 50);
```

---

## 9. Testing Procedures

### Test Framework

Tests live in `tests.js` and run in the browser via `tests.html`. There is no CLI test runner. To run tests: open `tests.html` in a browser.

### Test Runner API

```javascript
skupina('Group Name')                       // begins a named group
test('description', () => { ... })          // registers a test case
ocekavam(actual, expected, 'msg')           // strict equality (===)
ocekavamTrue(condition, 'msg')              // truthy assertion
ocekavamChybu(() => fn(), 'msg')            // asserts the function throws
```

### How to Write a New Test

1. **Copy the function under test** into `tests.js` (functions are duplicated there — not imported from `index.html`)
2. **Replace `localStorage`** references in the copy with `localStorageMock` (plain object defined at top of `tests.js`)
3. **Add a new `skupina()`** block or append to the most relevant existing one
4. **Write synchronous tests only** — there is no async test support
5. **Clear mock storage** at the start of every write test: `localStorageMock.clear()`

### Example Test

```javascript
skupina('Budget limits')

test('spending under limit shows correct percentage', () => {
  const result = vypocitejProcento(300, 500);
  ocekavam(result, 60, 'should be 60%');
});

test('spending capped at 100% when over limit', () => {
  const result = Math.min((600 / 500) * 100, 100);
  ocekavam(result, 100, 'capped at 100');
});

test('limit=0 means no limit', () => {
  const hasLimit = (limit) => limit > 0;
  ocekavamTrue(!hasLimit(0), 'limit 0 should not trigger');
});
```

### Test Coverage Checklist

Before submitting any financial logic change, ensure tests cover:

- [ ] Normal/expected input
- [ ] Zero values (amount = 0 is invalid)
- [ ] Negative values (must be rejected)
- [ ] Decimal values (must be supported for amounts)
- [ ] Empty string inputs (must be rejected)
- [ ] Month-boundary cases for date arithmetic
- [ ] The `recuring`/`cerpani` field presence (backward-compat)

---

## 10. Refactoring Guidelines

### Safe Refactoring Rules

1. **Do not rename `recuring`** — stored in users' `localStorage`; renaming breaks all existing recurring payment auto-detection
2. **Do not rename `cerpani`** — same reason; the migration function `migrujCerpani()` depends on it
3. **Do not split `index.html`** into modules without first implementing a build step — the app has no bundler
4. **Do not change `localStorage` key names** (`zaznamy`, `kategorie`, `opakujici`) — doing so silently loses all user data
5. **Do not remove `localStorageMock`** from `tests.js` — all tests depend on it for isolation

### How to Safely Rename a Function

1. Add the new function name as an alias pointing to the old function
2. Update all call sites within `index.html`
3. Remove the old name only after verifying no remaining references
4. Update the corresponding copy in `tests.js`

```javascript
// Step 1 — alias
const newName = oldName;

// Step 2 — update call sites
// Step 3 — delete old name after grep confirms zero references
```

### How to Safely Add a Field to an Existing Entity

1. Write a migration IIFE (see Section 4, Step 5)
2. Use `=== undefined` checks — not falsy checks — to detect missing fields (a `false` value is valid state)
3. Add the field with its default value in all existing creation paths
4. Update the corresponding test copies in `tests.js`

### How to Update the CSS Design System

- **Only change `style.css`** — never add inline styles to `index.html` except for dynamic values set by JS
- **Only override colour tokens** in `body.light { }` — never duplicate layout rules per theme
- **Respect the breakpoint** — `@media (max-width: 768px)` is the only breakpoint; do not introduce new ones

---

## 11. Deployment Checklist

### Before Every Commit

- [ ] Test both desktop (≥769px) and mobile (≤768px) layouts in browser
- [ ] Open `tests.html` — all tests must pass (green)
- [ ] If any cached file (`index.html`, `style.css`, `cashinou.png`) was changed, increment the Service Worker cache version string (`cashinou-v3` → `cashinou-v4`) inside the inline SW blob in `index.html`

### Deploying

```bash
git add index.html style.css   # add specific files — avoid git add -A
git commit -m "Short description of change"
git push
```

Netlify auto-deploys from `main`. Production URL: `cashinou.netlify.app`

### Cache Version Rule

The Service Worker caches `'./'` (the root `index.html`). If you do not bump the cache key after a code change, users will continue serving the old version from cache. The cache key is the string `'cashinou-v3'` (or current version) in the inline SW blob — update it to `'cashinou-v4'`, etc.

---

*This file was generated by analyzing the live codebase and reflects only patterns currently present in the project. Do not suggest external libraries, frameworks, or tooling not already in use.*
