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
| `assets/js/main.js` | Parallax úvodu, scrollová scéna O DSTUDIO, linka přes stránku, menu, otevírací doba, výběr úrovně v ceníku, souhlas s mapou, poukaz |
| `assets/js/glass-carousel.js` | Carousel služeb za „tekutým sklem“ (WebGL, bez knihoven) |
| `assets/js/vendor/` | GSAP + ScrollTrigger (parallax) a Lenis (plynulé rolování), hostované lokálně |
| `assets/fonts/` | Inter, Cormorant Garamond, League Gothic, Instrument Serif a Pinyon Script (vše SIL OFL), hostované lokálně |
| `assets/logo/` | Logo vytažené z vektoru v brandbooku (čokoládová, krémová, bílá) |
| `assets/img/hero/` | Scéna pro úvod (na šířku a na výšku) |
| `assets/img/glass/` | Sedm ilustračních snímků služeb pro carousel (3 : 4, 768 × 1024) |
| `assets/img/shop/` | Osm produktových zátiší pro karty ceníku (4 : 3, 1152 × 864) |

## Úvod (hero)

Scéna přes celou první obrazovku a text dole uprostřed ve třech řádcích: drobný psaný
řádek („Péče v přístupu“), pod ním velký patkový titulek („Krása je v detailech“) a krátký
odstavec malými verzálkami. Rozložení textu vychází z hero „Refined Eyewear“ (Casa
Lunara) z knihovny Supahero; pozadí je vlastní. V úvodu zatím nejsou žádná tlačítka,
rezervace je v hlavičce.

- Písma úvodu: titulek **Instrument Serif**, psaný řádek **Pinyon Script** (obě SIL OFL;
  soubor psaného písma obsahuje jen latinku s českou a slovenskou diakritikou).
- Hlavička je nad scénou průhledná a její obsah krémový; v bílou lištu se změní, až scéna
  odroluje (třída `site-header--over` v `index.html`, na podstránkách není).
- Scéna a text se při rolování posouvají různou rychlostí (GSAP ScrollTrigger), plynulé
  rolování zajišťuje Lenis; obojí je v `assets/js/vendor/` (GSAP: standardní bezplatná
  licence, Lenis: MIT). Při zapnutém „omezit pohyb“ zůstává vše v klidu.
- Obrázek scény je ilustrační: `assets/img/hero/scene.webp` (na šířku) a `scene-m.webp`
  (na výšku, pro mobily). Výměna motivu = výměna těchto dvou souborů; ztmavení pod textem
  je `.hero-shade` v CSS.

## Linka přes celou stránku

Zpod scény v úvodu vychází béžová linka a vede až na spodní okraj stránky. Kreslí se
podle polohy stránky (`assets/js/main.js`, část „0c“):

- v sekci O DSTUDIO obkrouží nadpis a proplete se mezerami mezi bloky textu,
- projde za plochou carouselu a za barevnými bloky; z každého bloku vyjede v jeho
  barvě (čokoládová, smaragdová — atribut `data-line` na bloku),
- dál běží okrajem stránky vedle obsahu a stranu mění jen v mezeře mezi dvěma sekcemi,
  takže nikde nevede přes text,
- leží nad pozadím sekcí a pod jejich obsahem (CSS, část „The line“).

Bloky jsou sekce s třídou `block` (velké heslo na zaoblené barevné ploše): filozofie
(čokoládová), recenze (smaragdová) a závěrečná výzva (čokoládová). Další blok vznikne
stejným zápisem v `index.html`; linka si ho najde sama.

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
- Současné snímky jsou ilustrační; až budou fotografie ze salonu, stačí je vyměnit.

### Předlohy efektů

Efekty jsou přepsané do čistého JavaScriptu (web nemá React ani sestavovací krok):

- parallax úvodu — Osmo „Parallax Scrolling“,
- rozložení textu v úvodu — hero „Refined Eyewear“ (Casa Lunara) z knihovny Supahero,
- nájezd textu v úvodu — Watermelon UI „Hero 17“,
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
volná licence SIL OFL): nadpisy sekcí, nadpis „Chvíle pro sebe“ a velká hesla v barevných
blocích. Font má proměnnou šířku; web ho sází na 88 % (`--display-width` v CSS).
Kdyby se mělo vrátit k čistě brandbookové typografii, stačí `--font-display` přepsat na
`var(--font-sans)` a u `.h2`, `.statement` a `.story-title` zrušit `text-transform`.

Jen v úvodu jsou navíc dvě písma podle předlohy hero: **Instrument Serif** a **Pinyon
Script** (`--font-hero`, `--font-script` v CSS). Čistě brandbooková varianta úvodu:
obě proměnné přepsat na `var(--font-serif)`.

## Co je potřeba doplnit

Na webu už nejsou žádné poznámky „Demo“ ani zástupné texty. Co stále chybí, je vedené
jen tady:

- **Naše práce** — pět rámečků 4:5 čeká na fotografie. Do `<li class="pane">` stačí
  vložit `<img src="…" alt="…">`; linky v rámečku fotografie překryje.
- **Carousel služeb, úvod a karty ceníku** — ilustrační snímky nahradit fotografiemi ze
  salonu.
- **Náš tým** — jména, portréty a úrovně specialistek.
- **Recenze** — skutečné recenze klientek (teď je sekce jen blok s poděkováním).
- **Kontakt** — fotografie vchodu, o které mluví úvodní text sekce.
- **Patička** — sídlo společnosti a zápis v obchodním rejstříku (soud, oddíl, vložka).
  Řádek s těmito údaji byl z patičky odstraněn, dokud nejsou známé; obchodní
  společnost je má na webu uvádět.
- **Ochrana osobních údajů** — sídlo a zápis v rejstříku, e-mail pro žádosti, konkrétní
  doba uchování údajů z rezervací (teď obecná formulace) a datum účinnosti.

## Ceník

Ceník je pojatý jako butik:

- **Oddělení** jsou čtyři kategorie z brandbooku (velký nadpis s číslem a anglickým
  názvem). Lišta pod hlavičkou na ně odkazuje a ukazuje u nich počet služeb.
- **Produkt** je každá skupina služeb (Manikúra, Pedikúra, Gelové prodloužení, …): karta
  s fotografií, řádkem úrovní, ve kterých se služba nabízí, názvem, tabulkou cen
  a vlastním tlačítkem rezervace. Na mobilu je karta řádek s malou fotografií a kulatou
  šipkou místo tlačítka (rezervaci tam nese lišta u spodního okraje).
- **Úroveň** (Middle / Senior / Top) se v liště vybírá jako velikost. Výběr nic neskrývá:
  jen zvýrazní sloupec zvolené úrovně a ostatní ztlumí. Volba se pamatuje do zavření
  karty prohlížeče.

Ceny jsou běžné HTML tabulky v `index.html` (sekce `#cenik`), přepsané z brandbooku.
Změna ceny = přepsání čísla v příslušné buňce; počty služeb u oddělení a produktů jsou
obyčejný text hned vedle. Ceny se objevují ještě ve dvou odpovědích v sekci Časté otázky
(řasy; pánská manikúra a pedikúra).

Fotografie produktů jsou ilustrační zátiší (`assets/img/shop/`, jeden soubor na
produkt, poměr 4 : 3). Výměna = nahrazení souboru stejného jména.

Zelená je v ceníku vyhrazená zvolené úrovni a hlavnímu tlačítku; tlačítka u produktů
jsou proto jen v obrysu.

## Cookies a měření

Web sám žádné cookies neukládá; volbu návštěvníka si pamatuje v `localStorage`
(`dstudio-consent`). Mapa Google se načte až po kliknutí. Měření návštěvnosti není
nasazeno. Pokud se někdy nasadí, je potřeba přidat kategorii do nastavení cookies,
rozšířit CSP v `netlify.toml` a doplnit stránku o ochraně osobních údajů.
