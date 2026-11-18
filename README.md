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

Demo je označené hlavičkou `X-Robots-Tag: noindex, nofollow`, aby se neukázalo ve
vyhledávačích. Před ostrým spuštěním tento řádek z `netlify.toml` smažte.

## Struktura

| Soubor | Co v něm je |
| --- | --- |
| `index.html` | Celá úvodní stránka včetně ceníku |
| `ochrana-osobnich-udaju.html` | Ochrana osobních údajů a cookies |
| `404.html` | Stránka „nenalezeno“ |
| `assets/css/main.css` | Všechny styly; nahoře barvy a písma z brandbooku |
| `assets/js/main.js` | Jediný skript webu (bez knihoven): záložní parallax, linka přes stránku, menu, otevírací doba, ceník, souhlas s mapou, carousel s automatickým posouváním, skeletony, poukaz |
| `assets/fonts/` | Inter, Cormorant Garamond, League Gothic, Instrument Serif a Pinyon Script (vše SIL OFL), hostované lokálně |
| `assets/logo/` | Logo vytažené z vektoru v brandbooku (čokoládová, krémová, bílá) |
| `assets/img/hero/` | Scéna pro úvod (na šířku a na výšku) |
| `assets/img/glass/` | Sedm ilustračních snímků služeb pro carousel (3 : 4, 768 × 1024) |
| `assets/img/shop/` | Osm produktových zátiší pro karty ceníku (4 : 3, 1152 × 864) |
| `assets/img/team/` | Tři ilustrační fotografie pro sekci Náš tým (4 : 5, 960 × 1200) |

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
- Scéna a text se při rolování posouvají různou rychlostí. Běží to jako CSS animace
  řízené rolováním (Chrome, Edge, Safari) přímo na grafické kartě, takže se nic neseká ani
  při zatížené stránce; ve Firefoxu totéž počítá `main.js`. Rolování je nativní (žádná
  knihovna pro „plynulé“ rolování). Při zapnutém „omezit pohyb“ zůstává vše v klidu.
- Text sedí v dolní třetině obrazovky; výška je `padding-bottom` u `.hero-layer-title`.
- Obrázek scény je ilustrační: `assets/img/hero/scene.webp` (na šířku) a `scene-m.webp`
  (na výšku, pro mobily). Výměna motivu = výměna těchto dvou souborů; ztmavení pod textem
  je `.hero-shade` v CSS.

## Výkon a načítání

- Web nemá žádnou JavaScriptovou knihovnu; celý skript má asi 30 kB. Animace při rolování
  používají jen `transform` a `opacity` (běží na grafické kartě), hlavička pod sebou nic
  nerozmazává.
- **Skeletony:** rámečky obrázků (carousel, ceník, tým, mapa) ukazují do načtení klidnou
  plochu s přejíždějícím světlem; pak se obrázek plynule objeví (třída `sk` v HTML,
  `is-loaded` přidá `main.js`). Úvodní scéna se vynoří ze smaragdové plochy.
- Obrázky pod prvním displejem se načítají až u sekce (`loading="lazy"`), obrázek úvodu
  se stahuje přednostně.

## Linka přes celou stránku

Zpod scény v úvodu vychází tenká béžová linka a vede až do patičky. Kreslí se podle
polohy stránky (`assets/js/main.js`, část „0c“):

- v sekci O DSTUDIO obkrouží nadpis a proplete se mezerami mezi bloky textu,
- projde za carouselem a za barevnými bloky; z každého bloku vyjede v jeho barvě
  (čokoládová, smaragdová — atribut `data-line` na bloku),
- dál běží okrajem stránky vedle obsahu a stranu mění jen v mezeře mezi dvěma sekcemi,
  takže nikde nevede přes text; končí za patičkou,
- leží nad pozadím sekcí a pod jejich obsahem (CSS, část „The line“).

Bloky jsou sekce s třídou `block` (velké heslo na zaoblené barevné ploše): filozofie
(čokoládová) a recenze (smaragdová). Další blok vznikne stejným zápisem v `index.html`;
linka si ho najde sama.

Trasa se počítá ze skutečného rozložení stránky a přepočítá se při změně velikosti okna
i výšky stránky (otevřená otázka, načtená mapa). Při „omezit pohyb“ je linka vykreslená
celá. Barva a tloušťka: `.ribbon path` v CSS.

## Scrollová scéna „O DSTUDIO“

Hned pod úvodem (CSS animace řízené rolováním; `main.js` jen dodá každému písmenu jeho
vzdálenost od středu a ve Firefoxu animaci počítá sám):

- písmena nadpisu „Chvíle pro sebe“ a pět štítků služeb začínají rozhozené a sjedou se
  k sobě, než blok dojede doprostřed obrazovky,
- linka z úvodu tu obkrouží nadpis (viz výše),
- při zapnutém „omezit pohyb“ vše stojí na místě.

Text nadpisu se v `index.html` rozkládá na písmena až při sestavení; čitelná podoba
zůstává ve stránce pro čtečky a vyhledávače.

## Carousel služeb

Plnohodnotný carousel: nekonečná řada sedmi snímků (3 : 4) s popiskem, která se každé
3 vteřiny sama posune o jeden snímek. Aktuální snímek sedí u levého okraje obsahu, řada
běží až k oběma okrajům obrazovky a po posledním snímku plynule pokračuje prvním.

- **Ovládání:** šipky pod řadou, šipky na klávesnici (když je fokus v carouselu), tažení
  myší, přejetí prstem, přejetí do strany na touchpadu a čárky pod řadou (každá skočí na
  svůj snímek). Svislé přejetí prstem přes řadu dál normálně posouvá stránkou.
- **Kdy stojí:** dokud na něm spočívá myš nebo prst, dokud je v něm fokus z klávesnice
  a dokud není vidět na obrazovce; potom pokračuje. Aktuální čárka se plní po dobu, kterou
  zbývá do dalšího posunu. Tlačítko vlevo dole ho zastaví natrvalo (a znovu spustí).
- **Omezit pohyb:** kdo má v systému zapnuté „omezit pohyb“, tomu se carousel sám
  nespustí (lze ho spustit tlačítkem) a snímky se přepínají bez animace.
- Bez JavaScriptu je to obyčejná řada posuvná do strany.
- Snímky jsou v `index.html` (sekce „SLUŽBY V OBRAZE“); výměna = soubor stejného jména
  v `assets/img/glass/`. Nový snímek = další `.gallery-item` a k němu další čárka
  `.gallery-dot`; upravit i „ze 7“ a „/ 07“. Interval je `DWELL` v `main.js` (část 7c).
- Současné snímky jsou ilustrační; až budou fotografie ze salonu, stačí je vyměnit.

### Předlohy efektů

Efekty jsou přepsané do čistého CSS a JavaScriptu (web nemá React ani sestavovací krok):

- parallax úvodu — Osmo „Parallax Scrolling“ (dnes jako CSS animace řízené rolováním),
- rozložení textu v úvodu — hero „Refined Eyewear“ (Casa Lunara) z knihovny Supahero,
- nájezd textu v úvodu — Watermelon UI „Hero 17“,
- sbíhání písmen a štítků — **Skiper UI** „ScrollAnimation_002“ (autor @gurvinder-singh02),
- linka kreslená rolováním — **Skiper UI** „Skiper 19“ (tamtéž; inspirováno comgio.ai),

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
- **Carousel služeb, úvod, karty ceníku a tým** — ilustrační snímky nahradit fotografiemi
  ze salonu.
- **Náš tým** — portréty, jména a úrovně specialistek: soubory v `assets/img/team/`
  vyměnit a do `<figcaption>` napsat jméno a úroveň.
- **E-mail salonu** — zatím neznámý, proto na webu není. Po doplnění se přidá řádek
  „E-mail“ do kontaktů a adresa do patičky.
- **Sleva 10 % na první návštěvu** — na webu je bez dalších podmínek; pokud nějaké platí
  (které služby, kombinace s poukazem…), je potřeba je doplnit ke slevě v ceníku.
- **Hodnocení na Google** — v kontaktu je napsané ručně (4,9 z 5, 32 recenzí podle profilu
  salonu v Mapách Google k 16. 11. 2026). Při změně přepsat číslo, počet recenzí
  a šířku vyplněných hvězd (`--rating` u `.rating-stars` v CSS: 98 % = 4,9).
- **Patička** — sídlo společnosti a zápis v obchodním rejstříku (soud, oddíl, vložka).
  Řádek s těmito údaji byl z patičky odstraněn, dokud nejsou známé; obchodní
  společnost je má na webu uvádět.
- **Ochrana osobních údajů** — sídlo a zápis v rejstříku, e-mail pro žádosti, konkrétní
  doba uchování údajů z rezervací (teď obecná formulace) a datum účinnosti.

## Ceník

Ceník je pojatý jako butik:

- **Oddělení** jsou čtyři kategorie z brandbooku (velký nadpis s číslem a anglickým
  názvem). Lišta pod hlavičkou na ně odkazuje a ukazuje u nich počet služeb; na mobilu
  se dá posouvat do strany.
- **Produkt** je každá skupina služeb (Manikúra, Pedikúra, Gelové prodloužení, …): karta
  s fotografií, názvem, tabulkou cen a vlastním tlačítkem rezervace. Na mobilu je karta
  řádek s malou fotografií a kulatou šipkou místo tlačítka.
- **Úrovně** (Middle / Senior / Top) jsou napsané přímo nad sloupci cen u každé tabulky,
  na všech velikostech obrazovky.
- **Sleva 10 % na první návštěvu** je zvýrazněná smaragdovou visačkou v hlavičce ceníku
  a znovu v liště, která se při procházení ceníku drží nahoře.

Ceny jsou běžné HTML tabulky v `index.html` (sekce `#cenik`), přepsané z brandbooku.
Změna ceny = přepsání čísla v příslušné buňce; počty služeb u oddělení a produktů jsou
obyčejný text hned vedle. Ceny se objevují ještě ve dvou odpovědích v sekci Časté otázky
(řasy; pánská manikúra a pedikúra).

Fotografie produktů jsou ilustrační zátiší (`assets/img/shop/`, jeden soubor na
produkt, poměr 4 : 3). Výměna = nahrazení souboru stejného jména.

## Dárkový poukaz, kontakt, patička

- **Poukaz** je záměrně méně uhlazený: krémový lístek s béžovým ústřižkem za perforací,
  vyseknutými zářezy a kulatou samolepkou, položený nakřivo na smaragdové obálce. Pole
  Pro / Hodnota / Platnost do odpovídají tištěnému poukazu z brandbooku.
- **Odkazy v textu** jsou smaragdové a podtržené; samostatné odkazy (Instagram, recenze,
  trasa v mapách) jsou nenápadná tlačítka v obrysu.
- **Kontakt:** adresa, telefon, Instagram, rezervace a otevírací doba; vedle hodnocení
  na Google a mapa. Mapa i odkazy „Trasa v aplikaci“ ukazují na profil salonu v Mapách
  Google (špendlík ve dvoře, ne na čísle domu na ulici). „Jak se k nám dostanete“ jsou
  tři kroky pod mapou.
- **Patička** je jeden čokoládový celek: výzva k rezervaci, čtyři sloupce (adresa,
  kontakt, otevírací doba, provozovatel), logo přes celou šířku a spodní lišta s odkazy.

## Cookies a měření

Web sám žádné cookies neukládá; volbu návštěvníka si pamatuje v `localStorage`
(`dstudio-consent`). Mapa Google se načte až po kliknutí. Měření návštěvnosti není
nasazeno. Pokud se někdy nasadí, je potřeba přidat kategorii do nastavení cookies,
rozšířit CSP v `netlify.toml` a doplnit stránku o ochraně osobních údajů.
