# DSTUDIO | Beauty Salon — web

Statický web salonu DSTUDIO (Praha 7 – Holešovice). Čisté HTML, CSS a JavaScript bez
frameworku a bez build kroku: co je v repozitáři, to se nasazuje.

## Spuštění

```bash
python3 -m http.server 4173
```

Pak otevřete `http://localhost:4173/`.

## Nasazení (Netlify)

Celý adresář se nahraje tak, jak je (drag & drop nebo ZIP). `netlify.toml` nastavuje
bezpečnostní hlavičky (CSP, HSTS, …) a cache. `404.html` Netlify použije automaticky.

## Struktura

| Soubor | Co v něm je |
| --- | --- |
| `index.html` | Celá úvodní stránka včetně ceníku |
| `ochrana-osobnich-udaju.html` | Ochrana osobních údajů a cookies |
| `404.html` | Stránka „nenalezeno“ |
| `assets/css/main.css` | Všechny styly; nahoře barvy a písma z brandbooku |
| `assets/js/main.js` | Menu, otevírací doba, zvýraznění úrovně v ceníku, souhlas s mapou, poukaz |
| `assets/fonts/` | Inter a Cormorant Garamond (SIL OFL), hostované lokálně |
| `assets/logo/` | Logo vytažené z vektoru v brandbooku (čokoládová, krémová, bílá) |
| `assets/img/d.svg` | Obrys písmene D z loga — tvar v úvodu stránky |

## Značka

Web používá výhradně pět barev a dvě písma z Brandbooku 2.0. Inter nese text i běžné
nadpisy; Cormorant Garamond je akcent (úvodní titulek, ceník, poukaz, dvě krátká hesla).
Logo se nikde nesází písmem — všude je vložený schválený vektor.

## Co je potřeba doplnit

Zástupná místa na úvodní stránce mají v HTML atribut `data-demo` a na stránce štítek **DEMO**:

- **Naše práce** — pět rámečků 4:5 čeká na fotografie. Do `<li class="pane">` stačí
  vložit `<img src="…" alt="…">`; linky v rámečku fotografie překryje.
- **Náš tým** — jména, portréty a úrovně specialistek.
- **Recenze** — skutečné recenze klientek.
- **Kontakt** — fotografie vchodu.

Po doplnění obsahu se prvek s `data-demo` smaže.

Podbarvená místa `[doplnit …]` čekají na údaje od provozovatele:

- **Patička** — sídlo společnosti a zápis v obchodním rejstříku (soud, oddíl, vložka).
- **Ochrana osobních údajů** — sídlo a zápis v rejstříku, e-mail pro žádosti, doba
  uchování údajů z rezervací, datum účinnosti.

## Ceník

Ceník je běžná HTML tabulka v `index.html` (sekce `#cenik`), přepsaná z brandbooku.
Změna ceny = přepsání čísla v příslušné buňce. Ceny se objevují ještě ve dvou odpovědích
v sekci Časté otázky (řasy; pánská manikúra a pedikúra).

## Cookies a měření

Web sám žádné cookies neukládá; volbu návštěvníka si pamatuje v `localStorage`
(`dstudio-consent`). Mapa Google se načte až po kliknutí. Měření návštěvnosti není
nasazeno. Pokud se někdy nasadí, je potřeba přidat kategorii do nastavení cookies,
rozšířit CSP v `netlify.toml` a doplnit stránku o ochraně osobních údajů.
