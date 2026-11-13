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
| `assets/js/main.js` | Parallax úvodu, scrollová scéna O DSTUDIO, menu, otevírací doba, zvýraznění úrovně v ceníku, souhlas s mapou, poukaz |
| `assets/js/vendor/` | GSAP + ScrollTrigger (parallax) a Lenis (plynulé rolování), hostované lokálně |
| `assets/fonts/` | Inter, Cormorant Garamond a League Gothic (SIL OFL), hostované lokálně |
| `assets/logo/` | Logo vytažené z vektoru v brandbooku (čokoládová, krémová, bílá) |
| `assets/img/hero/` | Vrstvy úvodní scény: zeď, dva závěsy, ruka s kyticí, flakony |

## Úvodní scéna (hero)

Úvod je složený ze čtyř vrstev, které se při rolování posouvají různou rychlostí:
zeď se slunečním světlem → sametové závěsy → titulek → ruka s kyticí a flakony.
Pohyb řídí GSAP ScrollTrigger, plynulé rolování Lenis; obojí je v `assets/js/vendor/`
(GSAP: standardní bezplatná licence, Lenis: MIT). Při zapnutém „omezit pohyb“ v systému
zůstává scéna v klidu a stránka se roluje běžně. Rozmístění vrstev pro mobil, tablet
a široké obrazovky je v `assets/css/main.css` v části „Hero“.

Obrázky scény jsou ilustrační. Až budou k dispozici vlastní fotografie salonu, stačí
vyměnit soubory v `assets/img/hero/` (průhledné WebP, stejné názvy).

## Scrollová scéna „O DSTUDIO“

Hned pod úvodem se při rolování odehrají tři věci (vše v `assets/js/main.js`, část „0b“):

- písmena nadpisu „Chvíle pro sebe“ a pět štítků služeb začínají rozhozené a sjedou se
  k sobě, než blok dojede doprostřed obrazovky,
- béžová linka se kreslí podle polohy stránky: obkrouží nadpis, proplete se mezerami
  mezi bloky textu a zmizí za tmavým blokem s heslem „Naslouchat vám.“ Její tvar se
  počítá ze skutečné polohy nadpisu, štítků a odstavců, takže sedí na každé šířce,
- při zapnutém „omezit pohyb“ vše stojí na místě a linka je vykreslená celá.

Text nadpisu se v `index.html` rozkládá na písmena až při sestavení; čitelná podoba
zůstává ve stránce pro čtečky a vyhledávače.

### Předlohy efektů

Efekty jsou přepsané do čistého JavaScriptu (web nemá React ani sestavovací krok):

- parallax úvodu — Osmo „Parallax Scrolling“,
- štítek, zvýrazněné slovo a vodítko v úvodu — Watermelon UI „Hero 17“,
- sbíhání písmen a štítků — **Skiper UI** „ScrollAnimation_002“ (autor @gurvinder-singh02),
- linka kreslená rolováním — **Skiper UI** „Skiper 19“ (tamtéž; inspirováno comgio.ai).

Bezplatná verze Skiper UI vyžaduje uvedení autora; je uveden zde a v komentáři v kódu.

## Značka

Web používá výhradně pět barev z Brandbooku 2.0 a jeho dvě písma: Inter nese běžný
text, Cormorant Garamond je akcent (kurzivní řádek pod titulky, ceník, poukaz).
Logo se nikde nesází písmem — všude je vložený schválený vektor.

Nad rámec brandbooku je přidané třetí písmo, **League Gothic** (vysoké úzké verzálky,
volná licence SIL OFL): úvodní titulek, nadpisy sekcí, nadpis „Chvíle pro sebe“ a dvě
velká hesla. Font má proměnnou šířku; web ho sází na 88 % (`--display-width` v CSS).
Kdyby se mělo vrátit k čistě brandbookové typografii, stačí `--font-display` přepsat na
`var(--font-sans)` a u `.h2`, `.statement`, `.story-title` a `.hero-title` zrušit
`text-transform`.

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
