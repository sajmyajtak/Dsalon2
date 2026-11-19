/* DSTUDIO | Beauty Salon — main.js
   Vanilla JS, no dependencies. Everything is progressive enhancement:
   the page is fully readable and bookable without this file. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * 0. Scroll effects: the hero parallax and the story's converging letters
   *    Where the browser has CSS scroll-driven animations (Chrome, Edge,
   *    Safari), CSS runs both on the compositor and this part only gives
   *    each converging item its distance from the middle (--d). Elsewhere
   *    one requestAnimationFrame loop does the same maths while scrolling.
   *    Converge is modelled on Skiper UI "ScrollAnimation_002" by
   *    @gurvinder-singh02. Nothing moves for reduced motion.
   * ------------------------------------------------------------------ */
  const motionOn = !reduceMotion.matches;
  const cssScroll = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
  const converge = $$('[data-converge]').map((box) => {
    const items = $$('[data-cv]', box);
    const centre = Math.floor(items.length / 2);
    items.forEach((el, i) => {
      el.style.setProperty('--d', String(i - centre));
      el.style.setProperty('--ad', String(Math.abs(i - centre)));
    });
    return { box, items, centre, arc: box.dataset.converge === 'arc' };
  });
  if (motionOn && !cssScroll) {
    const hero = $('.hero');
    const layers = [['1', 0.7], ['3', 0.4]].map(([n, k]) => [$(`[data-parallax-layer="${n}"]`), k]).filter(([el]) => el);
    let queued = false;
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      if (hero) {
        const p = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
        layers.forEach(([el, k]) => { el.style.transform = `translate3d(0, ${(p * k * el.offsetHeight).toFixed(1)}px, 0)`; });
      }
      const unit = Math.max(0.42, Math.min(window.innerWidth, 1440) / 1440);
      converge.forEach(({ box, items, centre, arc }) => {
        const r = box.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        const q = 1 - Math.min(Math.max((vh - r.top) / Math.max(0.44 * vh + r.height / 2, 1), 0), 1);
        items.forEach((el, i) => {
          const d = i - centre;
          el.style.transform = arc
            ? `translate(${(d * 90 * unit * q).toFixed(1)}px, ${(-Math.abs(d) * 22 * unit * q).toFixed(1)}px) rotate(${(d * 34 * q).toFixed(2)}deg) scale(${(1 - 0.25 * q).toFixed(3)})`
            : `perspective(500px) translateX(${(d * 50 * unit * q).toFixed(1)}px) rotateX(${(d * 50 * q).toFixed(2)}deg)`;
        });
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * 0c. The line
   *     One line drawn by the scroll, from under the hero scene to the foot
   *     of the page (idea after Skiper UI 19). Its route is worked out from
   *     where things really are: it lassoes the story heading, threads the
   *     gaps between that section's blocks, goes behind the carousel and the
   *     coloured blocks — leaving each block in that block's colour — and
   *     otherwise runs down the page margin, changing sides in the space
   *     between sections. It is cut into short paths so that only the piece
   *     being drawn repaints.
   * ------------------------------------------------------------------ */
  const ribbonSvg = $('[data-ribbon]');
  const storyTitle = $('.story-title');
  if (ribbonSvg && storyTitle) {
    const NS = 'http://www.w3.org/2000/svg';
    const line = { paths: [], total: 0, table: [], drawn: 0, size: '', first: true };
    const at = (el) => {
      const r = el.getBoundingClientRect();
      const l = r.left + window.scrollX, t = r.top + window.scrollY;
      return { l, r: l + r.width, t, b: t + r.height, w: r.width, h: r.height, cx: l + r.width / 2, cy: t + r.height / 2 };
    };
    // smooth curve through the points: Catmull-Rom, one cubic Bézier per span
    const spans = (p) => p.slice(0, -1).map((b, i) => {
      const a = p[Math.max(i - 1, 0)], c = p[i + 1], e = p[Math.min(i + 2, p.length - 1)];
      return ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
    });

    const route = (W, H) => {
      const hero = at($('.hero')), foot = at($('.hero-foot')), column = at($('.story-inner'));
      const t = at(storyTitle), label = at($('.story .eyebrow')), l = at($('.story-lead')), k = at($('.story-tokens')), x = at($('.story-text'));
      const story = at($('.story'));
      const rest = $$('main > section').filter((el) => !el.classList.contains('gallery') && at(el).t >= story.b - 5).concat($('.site-footer') || []);
      const glassEl = $('.gallery-track'), glass = glassEl ? at(glassEl) : null;
      const next = glass || (rest.length ? at(rest[0]) : { t: H });          // what the line goes behind first
      const marks = {};                                                      // point index -> colour the line takes from there
      const lane = Math.max(Math.min(column.l * 0.5, column.l - 12), 8);        // where the line runs beside the content
      const laneX = { l: lane, r: W - lane };
      const rx = Math.min(t.w * 0.56, W * 0.47);
      const top = Math.min(t.t - t.h * 0.3, label.t - 18), bottom = t.b + t.h * 0.07;     // the lasso clears the label and accents above, the lead below
      const beside = (edge, dir) => Math.min(Math.max(edge + dir * Math.min(W * 0.09, 120), 12), W - 12);
      const gap1 = (l.b + k.t) / 2, gap2 = (k.b + x.t) / 2, below = x.b + Math.min((next.t - x.b) * 0.3, 90);
      const p = [
        [W * (W < 700 ? 0.78 : 0.5), hero.b - 120], [W * (W < 700 ? 0.9 : 0.5), foot.cy],       // straight down, out from under the hero scene
        [t.cx + rx * 0.5, top], [t.cx - rx * 0.55, top + t.h * 0.05], [t.cx - rx * 1.03, t.cy],  // over the heading, round its left end
        [t.cx - rx * 0.55, bottom], [t.cx + rx * 0.5, bottom + 2], [t.cx + rx * 1.04, t.cy],     // underneath, up the right end
        [t.cx + rx * 0.6, top + t.h * 0.02], [t.cx - rx * 0.1, top - t.h * 0.12],               // close the loop
        [t.cx - rx * 1.1, top + t.h * 0.3], [beside(l.l, -1), l.cy],                            // out and down the left of the lead
        [W * 0.3, gap1], [W * 0.72, gap1], [beside(k.r, 1), k.cy],                              // across under the lead, round the tokens
        [W * 0.7, gap2], [W * 0.28, gap2], [beside(x.l, -1), x.cy],                             // back under the tokens, down the left of the text
        [W * 0.34, below], [W * 0.68, below + (next.t - below) * 0.35],                         // under the text
        ...(glass ? [[W * 0.56, glass.t + 24], [W * 0.46, glass.cy], [W * 0.54, glass.b - 16]] : []),   // behind the carousel
      ];
      // the rest of the page: behind each coloured block (which dyes the line), otherwise
      // down the margin, changing sides between sections
      let side = 'r';
      rest.forEach((el) => {
        const b = at(el);
        if (el.classList.contains('block') || el.classList.contains('site-footer')) {
          p.push([W * 0.56, b.t + 24]);
          if (el.dataset.line) marks[p.length] = el.dataset.line;           // the change happens out of sight
          p.push([W * 0.5, b.cy], [W * 0.6, b.b - 24]);
          return;
        }
        const pad = Math.min(Math.max((parseFloat(getComputedStyle(el).paddingTop) || 48) * 0.5, 24), b.h * 0.25);
        const x0 = laneX[side], sway = Math.min(lane * 0.35, 14) * (side === 'r' ? -1 : 1);
        const from = b.t + pad, to = b.b - pad, steps = Math.floor((to - from) / 520);
        p.push([x0, from]);
        for (let i = 1; i <= steps; i += 1) p.push([x0 + (i % 2 ? sway : 0), from + ((to - from) * i) / (steps + 1)]);
        p.push([x0, to]);
        side = side === 'r' ? 'l' : 'r';
      });
      p.push([p[p.length - 1][0], H + 40]);                                                      // and off the foot of the page
      return { points: p, marks };
    };

    const apply = () => {
      line.paths.forEach((piece) => {
        const shown = Math.min(Math.max(line.drawn - piece.from, 0), piece.len);
        if (shown === piece.shown) return;
        piece.shown = shown;
        piece.el.style.visibility = shown > 0 ? 'visible' : 'hidden';
        piece.el.style.strokeDashoffset = String(piece.len - shown);
      });
    };
    // how much of the line belongs above the lower part of the screen
    const target = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const tip = window.scrollY + window.innerHeight * (0.8 + 0.2 * Math.min(window.scrollY / max, 1));
      const t = line.table;
      if (!t.length || tip <= t[0][0]) return 0;
      let lo = 0, hi = t.length - 1;
      if (tip >= t[hi][0]) return line.total;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (t[mid][0] <= tip) lo = mid; else hi = mid; }
      return t[lo][1] + (t[hi][1] - t[lo][1]) * Math.min(Math.max((tip - t[lo][0]) / Math.max(t[hi][0] - t[lo][0], 0.001), 0), 1);
    };
    // One requestAnimationFrame loop: the drawn length eases towards the target and the
    // loop stops as soon as it has arrived, so a still page costs nothing.
    let raf = 0, intro = null;
    const step = (now) => {
      raf = 0;
      const goal = target();
      if (intro) {
        const t = Math.min((now - intro.t0) / intro.ms, 1);
        line.drawn = goal * (1 - Math.pow(1 - t, 3));
        if (t >= 1) intro = null;
      } else {
        const diff = goal - line.drawn;
        line.drawn = Math.abs(diff) < 0.75 ? goal : line.drawn + diff * 0.2;
      }
      apply();
      if (intro || line.drawn !== goal) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const follow = (mode) => {
      if (!motionOn) { line.drawn = line.total; apply(); return; }
      if (mode === 'now') { intro = null; line.drawn = target(); apply(); return; }
      if (mode === 'intro') intro = { t0: performance.now(), ms: 1800 };
      kick();
    };
    const build = () => {
      const W = document.documentElement.clientWidth, H = document.body.offsetHeight;
      if (!W || !H || line.size === `${W}x${H}`) return;
      line.size = `${W}x${H}`;
      ribbonSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      ribbonSvg.setAttribute('preserveAspectRatio', 'none');
      const { points, marks } = route(W, H), curve = spans(points);
      ribbonSvg.textContent = '';
      line.paths = []; line.table = [];
      let from = 0, far = -Infinity, colour = '';
      // short pieces (at most four spans); a new piece also starts wherever the colour changes
      const cuts = [0];
      for (let i = 1; i < curve.length; i += 1) if (marks[i] || i - cuts[cuts.length - 1] >= 4) cuts.push(i);
      cuts.push(curve.length);
      for (let c = 0; c < cuts.length - 1; c += 1) {
        const i = cuts[c], end = cuts[c + 1];
        if (marks[i]) colour = marks[i];
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', `M${points[i][0].toFixed(1)},${points[i][1].toFixed(1)}${curve.slice(i, end).join('')}`);
        if (colour) el.style.stroke = `var(--${colour})`;
        ribbonSvg.appendChild(el);
        const len = el.getTotalLength();
        el.style.strokeDasharray = `${len} ${len}`;
        el.style.visibility = 'hidden';
        // the lowest point the line has reached at each length along it
        const samples = Math.max(8, Math.round(len / 40));
        for (let s = 0; s <= samples; s += 1) {
          far = Math.max(far, el.getPointAtLength((len * s) / samples).y);
          line.table.push([far, from + (len * s) / samples]);
        }
        line.paths.push({ el, len, from, shown: -1 });
        from += len;
      }
      line.total = from;
      if (line.first) { line.first = false; line.drawn = 0; apply(); follow('intro'); } else follow('now');
    };
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
    let rebuild = 0;
    const later = () => { clearTimeout(rebuild); rebuild = setTimeout(build, 180); };
    window.addEventListener('resize', later);
    if (window.ResizeObserver) new ResizeObserver(later).observe(document.body);   // the page grows when an answer opens, the map loads…
    if (motionOn) window.addEventListener('scroll', () => follow(), { passive: true });
  }

  // Overlays pause the smooth scroll underneath them.
  const pauseScroll = () => {};   // native scrolling: overlays only need overflow: hidden on <html>

  /* ------------------------------------------------------------------ *
   * 1. Header: hairline once the page has moved, and the mobile menu
   * ------------------------------------------------------------------ */
  const header = $('[data-header]');
  if (header) {
    const sentinel = $('[data-header-hero]') || $('[data-header-sentinel]');   // home: the bar changes when the hero scene has gone
    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-stuck', !entry.isIntersecting);
      }).observe(sentinel);
    }
  }

  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  if (menu && menuToggle) {
    const behind = $$('main, .site-footer, .bookbar');
    const setMenu = (open) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      // The sheet covers the page; keep keyboard and screen readers inside it.
      behind.forEach((el) => { el.inert = open; });
      pauseScroll(open);
      if (open) {
        const first = $('a, button', menu);
        if (first) first.focus({ preventScroll: true });
      }
    };
    menuToggle.addEventListener('click', () => {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuToggle.focus();
      }
    });
    // Leaving the mobile breakpoint always closes the drawer.
    window.matchMedia('(min-width: 60em)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * 2. Opening hours — "open now" from the real hours on the door plate
   *    Po–Pá 9:00–19:00, So–Ne pouze na objednání. Europe/Prague time.
   * ------------------------------------------------------------------ */
  const HOURS = { open: 9 * 60, close: 19 * 60 };
  const DAY_NAMES = ['v\u00A0neděli', 'v\u00A0pondělí', 'v\u00A0úterý', 've středu', 've čtvrtek', 'v\u00A0pátek', 'v\u00A0sobotu'];

  function pragueParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', weekday: 'short', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return {
      dow,
      y: Number(parts.year), m: Number(parts.month), d: Number(parts.day),
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
  }

  // Czech public holidays (fixed dates + Good Friday and Easter Monday).
  function isCzechHoliday(y, m, d) {
    const fixed = ['1-1', '5-1', '5-8', '7-5', '7-6', '9-28', '10-28', '11-17', '12-24', '12-25', '12-26'];
    if (fixed.includes(`${m}-${d}`)) return true;
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const mm = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * mm + 114) / 31);
    const day = ((h + l - 7 * mm + 114) % 31) + 1;
    const easter = Date.UTC(y, month - 1, day);
    const today = Date.UTC(y, m - 1, d);
    const diff = Math.round((today - easter) / 864e5);
    return diff === -2 || diff === 1;
  }

  function hoursStatus(now = pragueParts()) {
    const weekday = now.dow >= 1 && now.dow <= 5;
    if (isCzechHoliday(now.y, now.m, now.d)) {
      return { state: 'holiday', text: 'Dnes je státní svátek · termíny najdete v\u00A0rezervaci Noona' };
    }
    if (weekday && now.minutes >= HOURS.open && now.minutes < HOURS.close) {
      return { state: 'open', text: 'Právě otevřeno · dnes do 19:00' };
    }
    if (weekday && now.minutes < HOURS.open) {
      return { state: 'soon', text: 'Dnes otevíráme v 9:00' };
    }
    // After closing on a weekday, or on the weekend: the next working day that is
    // not a public holiday (so the line never promises a Monday that is Easter Monday).
    let next = null;
    for (let i = 1; i <= 10 && !next; i += 1) {
      const day = new Date(Date.UTC(now.y, now.m - 1, now.d + i));
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue;
      if (isCzechHoliday(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate())) continue;
      next = { dow, tomorrow: i === 1 };
    }
    if (!next) return { state: 'closed', text: 'Po–Pá 9:00–19:00' };
    if (!weekday) {
      return { state: 'appointment', text: `O\u00A0víkendu pouze na objednání · otevíráme ${DAY_NAMES[next.dow]} v\u00A09:00` };
    }
    return { state: 'closed', text: next.tomorrow ? 'Zítra otevíráme v\u00A09:00' : `Otevíráme ${DAY_NAMES[next.dow]} v\u00A09:00` };
  }

  function paintHours() {
    const status = hoursStatus();
    $$('[data-hours-status]').forEach((el) => {
      el.dataset.state = status.state;
      const label = $('[data-hours-text]', el) || el;
      label.textContent = status.text;
      el.hidden = false;
    });
    const dow = pragueParts().dow;
    $$('[data-hours-row]').forEach((row) => {
      const days = row.dataset.hoursRow.split(',').map(Number);
      row.classList.toggle('is-today', days.includes(dow));
    });
  }
  if ('Intl' in window) {
    try {
      paintHours();
      setInterval(paintHours, 60 * 1000);
    } catch (err) { /* keep the static hours */ }
  }

  /* ------------------------------------------------------------------ *
   * 3. Price list: the department being read is marked in the pinned bar
   *    (and scrolled into view there on phones).
   * ------------------------------------------------------------------ */
  const priceRoot = $('[data-prices]');
  if (priceRoot) {
    const links = $$('[data-chapter-link]', priceRoot);
    const chapters = $$('[data-chapter]', priceRoot);
    const index = $('.chapter-index', priceRoot);
    if (links.length && 'IntersectionObserver' in window) {
      const setCurrent = (id) => links.forEach((link) => {
        if (link.dataset.chapterLink !== id) { link.removeAttribute('aria-current'); return; }
        link.setAttribute('aria-current', 'location');
        if (index && index.scrollWidth > index.clientWidth + 1) {
          index.scrollTo({ left: link.offsetLeft - 16, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setCurrent(entry.target.dataset.chapter); });
      }, { rootMargin: '-30% 0px -65% 0px' });
      chapters.forEach((chapter) => io.observe(chapter));
    }
  }

  /* ------------------------------------------------------------------ *
   * 4. Consent for third-party content (the Google map)
   *    Stored in localStorage as "dstudio-consent". Nothing from another
   *    server loads before the visitor says yes. The site has no analytics.
   * ------------------------------------------------------------------ */
  const CONSENT_KEY = 'dstudio-consent';
  const CONSENT_VERSION = 1;
  const banner = $('[data-consent-banner]');
  const dialog = $('[data-consent-dialog]');

  const consent = {
    current: null,
    read() {
      try {
        const value = JSON.parse(localStorage.getItem(CONSENT_KEY));
        if (value && value.v === CONSENT_VERSION) return value;
      } catch (e) { /* unavailable or malformed */ }
      return null;
    },
    write(choice) {
      const value = {
        v: CONSENT_VERSION,
        necessary: true,
        external: Boolean(choice.external),
        ts: new Date().toISOString(),
      };
      try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (e) { /* this visit only */ }
      consent.current = value;
      consent.apply();
      return value;
    },
    apply() {
      const allowed = Boolean(consent.current && consent.current.external);
      $$('[data-map]').forEach((map) => (allowed ? loadMap(map) : unloadMap(map)));
    },
  };

  function loadMap(map) {
    if (map.dataset.loaded) return;
    const frame = document.createElement('iframe');
    frame.src = map.dataset.src;
    frame.title = map.dataset.title || 'Mapa';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen', '');
    const slot = $('[data-map-slot]', map) || map;
    slot.classList.add('sk');
    slot.classList.remove('is-loaded');
    frame.addEventListener('load', () => slot.classList.add('is-loaded'), { once: true });
    slot.appendChild(frame);
    map.dataset.loaded = 'true';
  }
  function unloadMap(map) {
    if (!map.dataset.loaded) return;
    const frame = $('iframe', map);
    if (frame) frame.remove();
    delete map.dataset.loaded;
  }

  const showBanner = (show) => {
    if (!banner) return;
    banner.hidden = !show;
    document.documentElement.classList.toggle('has-consent-banner', show);
  };
  const syncDialog = () => {
    if (!dialog) return;
    const state = consent.current || {};
    $$('input[data-consent-category]', dialog).forEach((input) => {
      input.checked = Boolean(state[input.dataset.consentCategory]);
    });
  };
  const openDialog = () => {
    if (!dialog) return;
    syncDialog();
    pauseScroll(true);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  const closeDialog = () => {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };

  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-consent]');
    if (action) {
      const kind = action.dataset.consent;
      if (kind === 'close') { closeDialog(); return; }
      if (kind === 'accept') consent.write({ external: true });
      if (kind === 'reject') consent.write({ external: false });
      if (kind === 'save' && dialog) {
        const choice = {};
        $$('input[data-consent-category]', dialog).forEach((input) => {
          choice[input.dataset.consentCategory] = input.checked;
        });
        consent.write(choice);
      }
      showBanner(false);
      closeDialog();
      return;
    }
    if (e.target.closest('[data-consent-open]')) {
      e.preventDefault();
      openDialog();
      return;
    }
    const mapButton = e.target.closest('[data-map-load]');
    if (mapButton) {
      // Loading the map is itself the consent for third-party content.
      consent.write({ external: true });
      showBanner(false);
      const frame = $('iframe', mapButton.closest('[data-map]'));
      if (frame) frame.focus();
    }
  });
  if (dialog) {
    // A click on the backdrop closes the dialog.
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
    dialog.addEventListener('close', () => pauseScroll(false));
  }

  consent.current = consent.read();
  consent.apply();
  showBanner(!consent.current);

  /* ------------------------------------------------------------------ *
   * 5. Mobile booking bar — appears after the hero CTA has scrolled away,
   *    steps aside for the final call to action and the footer.
   * ------------------------------------------------------------------ */
  const bookBar = $('[data-bookbar]');
  if (bookBar && 'IntersectionObserver' in window) {
    const watch = $$('[data-bookbar-hide]');
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      bookBar.classList.toggle('is-visible', visible.size === 0);
    }, { threshold: 0 });
    watch.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * 6. Gift voucher — slides out of the envelope to the right.
   *    Where CSS scroll-driven animations exist, CSS does it on its own.
   * ------------------------------------------------------------------ */
  const voucher = $('[data-voucher]');
  if (voucher) {
    const cssDriven = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    if (reduceMotion.matches || cssDriven || !('IntersectionObserver' in window)) {
      voucher.classList.add('is-out');
    } else {
      new IntersectionObserver(([entry], io) => {
        if (!entry.isIntersecting) return;
        voucher.classList.add('is-out');
        io.disconnect();
      }, { threshold: 0.6 }).observe(voucher);
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. Sideways rows (work panes, team photographs): a keyboard stop only
   *    while they really scroll (phones and tablets); on wide screens
   *    everything in them is in view.
   * ------------------------------------------------------------------ */
  const scrollers = $$('[data-scroller]');
  if (scrollers.length) {
    const sync = () => scrollers.forEach((scroller) => {
      if (scroller.scrollWidth > scroller.clientWidth + 1) scroller.tabIndex = 0;
      else scroller.removeAttribute('tabindex');
    });
    sync();
    window.addEventListener('resize', sync, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * 7b. Skeletons: a picture's placeholder gives way once it has loaded
   * ------------------------------------------------------------------ */
  const settle = (box) => {
    const img = $('img', box);
    if (!img) return;
    const done = () => box.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  };
  $$('.sk, [data-fade]').forEach(settle);

  /* ------------------------------------------------------------------ *
   * 7c. Carousel: an endless row that moves on by itself every 3 seconds
   *     The pictures are copied once in front of and twice behind the real
   *     ones, and the position is always brought back onto the real ones,
   *     so the row never runs out. It moves by transform only, eased in one
   *     requestAnimationFrame loop that runs only while it moves. It holds
   *     while the mouse rests on it, while it has keyboard focus or a finger
   *     on it, and while it is off screen, and carries on from where it was.
   *     A stop button for keyboard users appears when it gets focus. With
   *     reduced motion it does not start by itself and moves at once.
   * ------------------------------------------------------------------ */
  const gallery = $('[data-gallery]');
  const viewport = gallery && $('[data-gallery-viewport]', gallery);
  const row = gallery && $('[data-gallery-track]', gallery);
  const arrows = gallery && $('[data-gallery-arrows]', gallery);
  const real = row ? $$('.gallery-item', row) : [];
  if (gallery && viewport && arrows && real.length > 1) {
    const N = real.length;
    const DWELL = 3000;                                    // ms on each picture
    const names = real.map((el) => {
      const cap = $('figcaption', el).cloneNode(true);
      $$('.gallery-no', cap).forEach((no) => no.remove());
      return cap.textContent.trim();
    });
    const copies = () => real.map((el) => {
      const copy = el.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      $$('.sk', copy).forEach(settle);
      return copy;
    });
    row.prepend(...copies());
    row.append(...copies(), ...copies());
    const items = $$('.gallery-item', row);                // N copies, the N real pictures, 2N copies
    const playBtn = $('[data-gallery-play]', gallery);
    const status = $('[data-gallery-status]', gallery);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2);

    let step = 0;            // px from one picture to the next
    let pos = N, target = N; // in pictures, counted along the whole row
    let tween = null, raf = 0, drag = null, current = -1;

    const render = () => { row.style.transform = `translate3d(${(-pos * step).toFixed(2)}px, 0, 0)`; };
    // the current picture: its number turns green; moves made by the visitor are announced
    const mark = (announce) => {
      const i = Math.round(target), n = ((i % N) + N) % N;
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (n === current) return;
      current = n;
      if (announce && status) status.textContent = `Snímek ${n + 1} ze ${N}: ${names[n]}`;
    };
    // stay on the real pictures: the copies on either side look the same
    const wrap = () => {
      const shift = pos < N - 0.5 ? N : pos >= 2 * N - 0.5 ? -N : 0;
      if (!shift) return;
      pos += shift; target += shift;
      if (tween) { tween.from += shift; tween.to += shift; }
      if (drag) drag.base += shift;
      mark(false);
    };
    const frame = (now) => {
      raf = 0;
      if (tween) {
        const t = Math.min((now - tween.t0) / tween.ms, 1);
        pos = tween.from + (tween.to - tween.from) * tween.ease(t);
        if (t >= 1) tween = null;
      }
      wrap();
      render();
      if (tween) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const moveTo = (to, how) => {
      target = to;
      mark(how !== 'auto');
      if (!motionOn) { tween = null; pos = to; wrap(); render(); return; }
      tween = how === 'auto'
        ? { from: pos, to, t0: performance.now(), ms: 900, ease: easeInOut }
        : { from: pos, to, t0: performance.now(), ms: 650, ease: easeOut };
      kick();
    };

    // the wait for the next move: a timer that keeps what is left of it while held
    const holds = new Set(['offscreen']);
    let auto = motionOn, timer = 0, left = DWELL, since = 0;
    const resume = () => {
      if (timer || !auto || holds.size) return;
      since = performance.now();
      timer = setTimeout(() => { timer = 0; left = DWELL; go(1, 'auto'); }, Math.max(left, 0));
    };
    const pause = () => {
      if (!timer) return;
      clearTimeout(timer); timer = 0;
      left -= performance.now() - since;
    };
    const restart = () => { clearTimeout(timer); timer = 0; left = DWELL; resume(); };
    const hold = (why, on) => {
      if (on) holds.add(why); else holds.delete(why);
      if (holds.size) pause(); else resume();
    };
    const go = (dir, how = 'user') => { moveTo(Math.round(target) + dir, how); restart(); };
    const setAuto = (on) => {
      auto = on;
      playBtn.textContent = auto ? 'Zastavit automatické posouvání' : 'Spustit automatické posouvání';
      restart();
    };

    // arrows, keyboard arrows and the stop button (keyboard users only)
    playBtn.hidden = false;
    playBtn.addEventListener('click', () => {
      if (!auto) { holds.delete('focus'); holds.delete('hover'); }   // asked to run: run now
      setAuto(!auto);
    });
    $('[data-gallery-prev]', arrows).addEventListener('click', () => go(-1));
    $('[data-gallery-next]', arrows).addEventListener('click', () => go(1));
    gallery.addEventListener('keydown', (e) => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    });

    // mouse over it, keyboard focus in it, off screen, tab in the background: hold
    gallery.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
    gallery.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hold('hover', false); });
    gallery.addEventListener('focusin', (e) => {
      let keyboard = true;
      try { keyboard = e.target.matches(':focus-visible'); } catch (_) { /* older browsers: treat as keyboard */ }
      if (keyboard) hold('focus', true);
    });
    gallery.addEventListener('focusout', (e) => { if (!gallery.contains(e.relatedTarget)) hold('focus', false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting || entry.intersectionRatio < 0.35), { threshold: [0, 0.35, 0.7] }).observe(viewport);
    } else holds.delete('offscreen');
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));

    // drag with the mouse, swipe with a finger or pen (vertical swipes still scroll the page)
    viewport.addEventListener('dragstart', (e) => e.preventDefault());
    viewport.addEventListener('pointerdown', (e) => {
      if ((e.pointerType === 'mouse' && e.button !== 0) || !step) return;
      drag = { id: e.pointerId, x0: e.clientX, base: pos, trail: [[e.timeStamp, e.clientX]], moved: false };
      try { viewport.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
      hold('drag', true);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x0) < 5) return;
        drag.moved = true; drag.base = pos; drag.x0 = e.clientX; tween = null;   // catch the row where it is
        gallery.classList.add('is-dragging');
      }
      pos = drag.base - (e.clientX - drag.x0) / step;
      drag.trail.push([e.timeStamp, e.clientX]);
      while (drag.trail.length > 2 && drag.trail[0][0] < e.timeStamp - 120) drag.trail.shift();
      kick();
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      gallery.classList.remove('is-dragging');
      holds.delete('drag');
      if (!d.moved) { hold('drag', false); return; }
      // a quick flick goes on to the next picture in its direction, otherwise the nearest
      // one; the speed is that of the last 120 ms before letting go
      const trail = d.trail.concat([[e.timeStamp, e.clientX]]).filter(([t]) => t >= e.timeStamp - 120);
      const [t0, x0] = trail[0], [t1, x1] = trail[trail.length - 1];
      const speed = trail.length > 2 && t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
      let to = Math.round(pos);
      if (e.type === 'pointerup' && Math.abs(speed) > 0.3) to = speed < 0 ? Math.ceil(pos - 0.02) : Math.floor(pos + 0.02);
      moveTo(to, 'user');
      restart();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => viewport.addEventListener(type, release));

    // a sideways trackpad swipe (or Shift + wheel) moves one picture per gesture
    let wheelSum = 0, wheelLock = false, wheelQuiet = 0;
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(wheelQuiet);
      wheelQuiet = setTimeout(() => { wheelLock = false; wheelSum = 0; }, 180);
      if (wheelLock) return;
      wheelSum += e.deltaX;
      if (Math.abs(wheelSum) > 40) { wheelLock = true; go(wheelSum > 0 ? 1 : -1); }
    }, { passive: false });

    // start
    const measure = () => {
      const a = items[N].getBoundingClientRect(), b = items[2 * N].getBoundingClientRect();
      step = (b.left - a.left) / N;
      render();
    };
    viewport.removeAttribute('tabindex');
    gallery.classList.add('is-live');
    arrows.hidden = false;
    measure();
    window.addEventListener('resize', measure, { passive: true });
    mark(false);
    setAuto(auto);
  }

  /* ------------------------------------------------------------------ *
   * 8. Small things
   * ------------------------------------------------------------------ */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
