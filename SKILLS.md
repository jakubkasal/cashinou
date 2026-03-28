# Skills – CashinoU

Tento soubor popisuje předem definované postupy (skills) pro práci s AI při vývoji projektu CashinoU.
Každý skill říká AI jak má přistupovat k určitému typu úkolu, aby byl výsledek konzistentní s ostatním kódem.

---

## Skill: Přidání nové funkce do appky

**Kdy použít:** Chci přidat novou stránku, tlačítko nebo logiku.

**Postup pro AI:**
1. Drž se existujícího stylu kódu – CSS proměnné (`--accent`, `--surface`...), font DM Sans
2. Nová stránka = přidat tlačítko do sidebaru + do bottom nav (mobil) + `<div id="page-xxx">` v HTML
3. Vždy mysli na mobilní verzi – přidat `.mobile-only` / `.desktop-only` pokud se layout liší
4. Data ukládej přes `localStorage` – stejný vzor jako ostatní funkce (`nacti...` / `uloz...`)
5. Po přidání funkce aktualizuj README.md

**Příklad promptu:**
> "Přidej stránku s přehledem výdajů za poslední rok. Drž se existujícího stylu."

---

## Skill: Oprava chyby (bug fix)

**Kdy použít:** Něco nefunguje nebo vypadá špatně.

**Postup pro AI:**
1. Nejdřív popiš co se děje a na jakém zařízení (mobil / počítač / oba)
2. Přilož screenshot pokud je to vizuální problém
3. AI má upravit jen to co je rozbité – neměnit zbytek kódu
4. Po opravě zkontroluj že funguje na obou zařízeních

**Příklad promptu:**
> "Na mobilu sidebar překrývá obsah. Screenshot v příloze. Oprav to."

---

## Skill: Úprava designu

**Kdy použít:** Chci změnit vzhled – barvy, rozložení, velikost písma...

**Postup pro AI:**
1. Design drží dark mode jako výchozí (`--bg: #0e0e11`, `--accent: #6366f1`)
2. Font je vždy DM Sans (text) a DM Mono (čísla)
3. Border radius je konzistentní: kartičky 14px, tlačítka 8px, malé prvky 6px
4. Animace jsou jemné – transition 0.15s
5. Nikdy neměnit funkčnost, jen vizuál

**Příklad promptu:**
> "Udělej kartičky na přehledu větší a přidej jim jemný shadow."

---

## Skill: Přidání nové kategorie výdajů (jako uživatel)

**Kdy použít:** Chci přidat kategorii přímo v appce.

**Postup:**
1. Jdi do sekce **Kategorie** v sidebaru
2. Vyber typ (Výdaj / Příjem)
3. Zadej název, vyber emoji ikonku, volitelně nastav měsíční limit
4. Klikni **Přidat kategorii**

*Poznámka: Toto nevyžaduje práci s AI – jde to udělat přímo v appce.*

---

## Skill: Nasazení nové verze na Netlify

**Kdy použít:** Upravil jsem kód a chci nahrát novou verzi online.

**Postup:**
1. Ulož změny v kódu
2. V Terminálu:
```bash
git add .
git commit -m "Popis změny"
git push
```
3. Jdi na **netlify.com** → projekt → přetáhni složku `apka` do deploy zóny
4. Za pár sekund je nová verze live

---

## Skill: Psaní automatických testů

**Kdy použít:** Přidal jsem novou funkci a chci ověřit že funguje správně.

**Postup pro AI:**
1. Test píšeme v souboru `tests.js`
2. Testujeme čistě logické funkce – výpočty, ukládání, filtrování
3. Každý test má jasný popis co testuje
4. Používáme jednoduchý vlastní test runner (bez externích knihoven)

**Příklad promptu:**
> "Napiš test pro funkci výpočtu bilance – příjmy minus výdaje."
