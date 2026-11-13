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
| `assets/js/main.js` | Parallax úvodu, scrollová scéna O DSTUDIO, linka přes stránku, menu, otevírací doba, zvýraznění úrovně v ceníku, souhlas s mapou, poukaz |
| `assets/js/glass-carousel.js` | Carousel služeb za „tekutým sklem“ (WebGL, bez knihoven) |
| `assets/js/vendor/` | GSAP + ScrollTrigger (parallax) a Lenis (plynulé rolování), hostované lokálně |
| `assets/fonts/` | Inter, Cormorant Garamond a League Gothic (SIL OFL), hostované lokálně |
| `assets/logo/` | Logo vytažené z vektoru v brandbooku (čokoládová, krémová, bílá) |
| `assets/img/hero/` | Fotografie hedvábí pro úvod (na šířku a na výšku) |
| `assets/img/glass/` | Sedm ilustračních snímků služeb pro carousel (3 : 4, 768 × 1024) |

## Úvod (hero)

Úvod vychází z návrhu s krémovým hedvábím: text je vlevo (na mobilu nahoře), sklady
látky na druhé straně. Fotografie a text se při rolování posouvají různou rychlostí
(GSAP ScrollTrigger), plynulé rolování zajišťuje Lenis; obojí je v `assets/js/vendor/`
(GSAP: standardní bezplatná licence, Lenis: MIT). Při zapnutém „omezit pohyb“ zůstává
vše v klidu a stránka se roluje běžně.

Obrázky jsou ilustrační: `assets/img/hero/silk.webp` (na šířku) a `silk-m.webp` (na
výšku, pro mobily). Jiný motiv z návrhů (smaragdové hedvábí, květ, …) znamená jen
vyměnit tyto dva soubory; světlejší nebo tmavší závoj pod textem je `.hero-veil` v CSS.

## Linka přes celou stránku

Z hedvábí v úvodu vychází béžová linka a vede až na spodní okraj stránky. Kreslí se
podle polohy stránky (`assets/js/main.js`, část „0c“):

- v sekci O DSTUDIO obkrouží nadpis a proplete se mezerami mezi bloky textu,
- projde za tmavým blokem s heslem,
- dál běží okrajem stránky vedle obsahu a stranu mění jen v mezeře mezi dvěma sekcemi,
  takže nikde nevede přes text,
- leží nad pozadím sekcí a pod jejich obsahem (CSS, část „The line“).

Trasa se počítá ze skutečného rozložení stránky a přepočítá se při změně velikosti okna
i výšky stránky (otevřená otázka, načtená mapa). Při „omezit pohyb“ je linka vykreslená
celá. Barva a tloušťka: `.ribbon path` v CSS.

## Scrollová scéna „O DSTUDIO“

Hned pod úvodem (vše v `assets/js/main.js`, část „0b“):

- písmena nadpisu „Chvíle pro sebe“ a pět štítků služeb začínají rozhozené a sjedou se
  k sobě, než blok dojede doprostřed obrazovky,
- linka z úvodu tu obkrouží nadpis (viz výše),
- při zapnutém „omezit pohyb“ vše stojí na místě.

Text nadpisu se v `index.html` rozkládá na písmena až při sestavení; čitelná podoba
zůstává ve stránce pro čtečky a vyhledávače.

## Carousel služeb („tekuté sklo“)

Za sekcí O DSTUDIO je zaoblená plocha s nekonečným pásem snímků, přes který leží
skleněná čočka: na jejím okraji se obraz vlní a rozkládá do barev. Pás se posouvá tažením,
šipkami na klávesnici, tlačítky po stranách nebo vodorovným gestem; kolečko myši dál
roluje stránku. Klik na prostřední snímek ho zvětší (zavřít: tlačítko, Esc nebo klik).

- Snímky a jejich názvy jsou obyčejný seznam v `index.html` (sekce „SLUŽBY V OBRAZE“);
  stačí vyměnit soubory v `assets/img/glass/` nebo upravit položky seznamu.
- Vykreslování je v `assets/js/glass-carousel.js` (čisté WebGL, načítá se až u sekce).
- Bez WebGL nebo skriptů zůstane seznam jako obyčejná řada obrázků, která se posouvá do
  strany. Při „omezit pohyb“ odpadá úvodní nájezd a třpyt čočky.
- Současné snímky jsou ilustrační (označené štítkem Demo).

### Předlohy efektů

Efekty jsou přepsané do čistého JavaScriptu (web nemá React ani sestavovací krok):

- parallax úvodu — Osmo „Parallax Scrolling“,
- zvýrazněné slovo a nájezd textu v úvodu — Watermelon UI „Hero 17“,
- sbíhání písmen a štítků — **Skiper UI** „ScrollAnimation_002“ (autor @gurvinder-singh02),
- linka kreslená rolováním — **Skiper UI** „Skiper 19“ (tamtéž; inspirováno comgio.ai),
- carousel za tekutým sklem — **Componentry** „Liquid Glass Carousel“ (Harsh Jadhav,
  licence MIT); shader čočky je převzatý, zbytek je přepsaný bez Reactu a three.js.

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
