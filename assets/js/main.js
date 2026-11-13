/* DSTUDIO | Beauty Salon — main.js
   Vanilla JS, no dependencies. Everything is progressive enhancement:
   the page is fully readable and bookable without this file. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * 0. Parallax hero and smooth scrolling
   *    A plain-JS port of the reference component: one scrubbed GSAP
   *    timeline moves the four layers by different amounts while the
   *    hero scrolls away (layers a page does not use are skipped); Lenis
   *    smooths wheel scrolling. Skipped for
   *    people who prefer reduced motion, and if the libraries are absent.
   * ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduceMotion.matches && window.gsap && window.ScrollTrigger) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const layersRoot = $('[data-parallax-layers]');
    if (layersRoot) {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: layersRoot, start: '0% 0%', end: '100% 0%', scrub: 0 },
      });
      [['1', 70], ['2', 55], ['3', 40], ['4', 10]].forEach(([layer, yPercent]) => {
        const layers = $$(`[data-parallax-layer="${layer}"]`, layersRoot);
        if (layers.length) timeline.to(layers, { yPercent, ease: 'none' }, 0);
      });
    }

    if (window.Lenis) {
      lenis = new window.Lenis();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

      // In-page links: glide to the section and stop below the sticky header, the same
      // place a native jump would land (scroll-padding on <html>, scroll-margin on the
      // target). The position is measured from the real scroll offset at click time.
      document.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;
        const id = decodeURIComponent(link.getAttribute('href').slice(1));
        const target = id ? document.getElementById(id) : document.body;
        if (!target) return;
        event.preventDefault();
        const offset = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
          + (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
        const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });   // start from where the page really is
        lenis.scrollTo(y, { force: true, duration: 1.1 });
        if (id && location.hash !== `#${id}`) {
          try { history.pushState(null, '', `#${id}`); } catch (error) { /* embedded previews may forbid it */ }
        }
        // keyboard and screen-reader users continue from the section they asked for
        if (target !== document.body) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    }
  }
  /* ------------------------------------------------------------------ *
   * 0b. Story section
   *     Converge: the heading's letters and the service tokens start spread
   *     out from their middle and come together while the block scrolls from
   *     the bottom of the screen to its centre (effect modelled on Skiper UI
   *     "ScrollAnimation_002" by @gurvinder-singh02).
   * ------------------------------------------------------------------ */
  const motionOn = !reduceMotion.matches && window.gsap && window.ScrollTrigger;
  if (motionOn) {
    const { gsap } = window;
    $$('[data-converge]').forEach((box) => {
      const items = $$('[data-cv]', box);
      if (!items.length) return;
      const centre = Math.floor(items.length / 2);
      const arc = box.dataset.converge === 'arc';
      const unit = () => Math.max(0.42, Math.min(window.innerWidth, 1440) / 1440);   // spread follows the screen
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'center 56%', scrub: 0, invalidateOnRefresh: true },
      });
      items.forEach((el, i) => {
        const d = i - centre;
        const from = arc
          ? { x: () => d * 90 * unit(), y: () => -Math.abs(d) * 22 * unit(), rotate: d * 34, scale: 0.75 }
          : { x: () => d * 50 * unit(), rotateX: d * 50, transformPerspective: 500 };
        tl.fromTo(el, from, { x: 0, y: 0, rotate: 0, rotateX: 0, scale: 1 }, 0);
      });
    });
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
      const rest = $$('main > section').filter((el) => !el.classList.contains('glass') && at(el).t >= story.b - 5).concat($('.site-footer') || []);
      const glassEl = $('.glass-stage'), glass = glassEl ? at(glassEl) : null;
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
        if (el.classList.contains('block')) {
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
    const follow = (seconds) => {
      if (!motionOn) { line.drawn = line.total; apply(); return; }
      if (!seconds) { window.gsap.killTweensOf(line); line.drawn = target(); apply(); return; }
      window.gsap.to(line, { drawn: target(), duration: seconds, ease: 'power2.out', overwrite: true, onUpdate: apply });
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
      const keep = line.first ? 0 : null;
      if (line.first) { line.first = false; line.drawn = 0; apply(); follow(1.8); } else follow(keep);
    };
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
    let rebuild = 0;
    const later = () => { clearTimeout(rebuild); rebuild = setTimeout(build, 180); };
    window.addEventListener('resize', later);
    if (window.ResizeObserver) new ResizeObserver(later).observe(document.body);   // the page grows when an answer opens, the map loads…
    if (motionOn) window.addEventListener('scroll', () => follow(0.7), { passive: true });
  }

  // Overlays pause the smooth scroll underneath them.
  const pauseScroll = (paused) => { if (lenis) { if (paused) lenis.stop(); else lenis.start(); } };

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
   * 3. Price list: every chapter and every level is always on the page.
   *    The buttons only re-ink one level's column; the index follows
   *    the chapter being read.
   * ------------------------------------------------------------------ */
  const priceRoot = $('[data-prices]');
  if (priceRoot) {
    const buttons = $$('[data-level-btn]', priceRoot);
    const live = $('[data-level-live]', priceRoot);
    const store = {
      get(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
      set(key, val) { try { sessionStorage.setItem(key, val); } catch (e) { /* private mode */ } },
    };
    const title = (level) => level.charAt(0).toUpperCase() + level.slice(1);

    const applyLevel = (level, announce) => {
      priceRoot.dataset.level = level;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.levelBtn === level)));
      store.set('dstudio-level', level);
      if (announce && live) {
        live.textContent = level ? `V ceníku je zvýrazněna úroveň ${title(level)}.` : 'Zvýraznění úrovně je vypnuté.';
      }
    };
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const level = button.dataset.levelBtn;
        applyLevel(priceRoot.dataset.level === level ? '' : level, true);
      });
    });
    priceRoot.classList.add('is-enhanced');
    const saved = store.get('dstudio-level');
    if (saved && buttons.some((b) => b.dataset.levelBtn === saved)) applyLevel(saved, false);

    const links = $$('[data-chapter-link]', priceRoot);
    const chapters = $$('[data-chapter]', priceRoot);
    if (links.length && 'IntersectionObserver' in window) {
      const setCurrent = (id) => links.forEach((link) => {
        if (link.dataset.chapterLink === id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
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
    ($('[data-map-slot]', map) || map).appendChild(frame);
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
   * 7. Gallery strip: a keyboard stop only while it really scrolls
   *    (phones and tablets); on wide screens all panes are in view.
   * ------------------------------------------------------------------ */
  const scroller = $('[data-scroller]');
  if (scroller) {
    const sync = () => {
      if (scroller.scrollWidth > scroller.clientWidth + 1) scroller.tabIndex = 0;
      else scroller.removeAttribute('tabindex');
    };
    sync();
    window.addEventListener('resize', sync, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * 8. Small things
   * ------------------------------------------------------------------ */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
