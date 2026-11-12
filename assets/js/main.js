/* DSTUDIO | Beauty Salon — main.js
   Vanilla JS, no dependencies. Everything is progressive enhancement:
   the page is fully readable and bookable without this file. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * 1. Header: hairline once the page has moved, and the mobile menu
   * ------------------------------------------------------------------ */
  const header = $('[data-header]');
  if (header) {
    const sentinel = $('[data-header-sentinel]');
    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-stuck', !entry.isIntersecting);
      }).observe(sentinel);
    }
  }

  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  if (menu && menuToggle) {
    const setMenu = (open) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
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
  const DAY_NAMES = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];

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
      return { state: 'holiday', text: 'Dnes je svátek · termín si ověřte v rezervaci' };
    }
    if (weekday && now.minutes >= HOURS.open && now.minutes < HOURS.close) {
      return { state: 'open', text: 'Právě otevřeno · dnes do 19:00' };
    }
    if (weekday && now.minutes < HOURS.open) {
      return { state: 'soon', text: 'Dnes otevíráme v 9:00' };
    }
    // After closing on a weekday, or on the weekend: find the next weekday.
    let next = (now.dow + 1) % 7;
    while (next === 0 || next === 6) next = (next + 1) % 7;
    const tomorrow = next === (now.dow + 1) % 7;
    if (!weekday) {
      return { state: 'appointment', text: `O víkendu pouze na objednání · ${DAY_NAMES[next]} od 9:00` };
    }
    return { state: 'closed', text: tomorrow ? 'Zítra otevíráme v 9:00' : `Otevíráme ${DAY_NAMES[next]} v 9:00` };
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
   * 4. Consent (cookies / third-party content)
   *    Stored in localStorage as "dstudio-consent". Nothing optional
   *    loads before the visitor says yes.
   * ------------------------------------------------------------------ */
  const CONSENT_KEY = 'dstudio-consent';
  const CONSENT_VERSION = 1;
  const banner = $('[data-consent-banner]');
  const dialog = $('[data-consent-dialog]');

  const consent = {
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
        analytics: Boolean(choice.analytics),
        ts: new Date().toISOString(),
      };
      try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (e) { /* session only */ }
      consent.current = value;
      consent.apply();
      return value;
    },
    current: null,
    apply() {
      const state = consent.current || { external: false, analytics: false };
      $$('[data-map]').forEach((map) => (state.external ? loadMap(map) : unloadMap(map)));
      if (state.analytics) loadAnalytics();
      document.dispatchEvent(new CustomEvent('dstudio:consent', { detail: state }));
    },
  };
  window.dstudioConsent = consent;

  function loadMap(map) {
    if (map.dataset.loaded) return;
    const frame = document.createElement('iframe');
    frame.src = map.dataset.src;
    frame.title = map.dataset.title || 'Mapa';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen', '');
    const slot = $('[data-map-slot]', map) || map;
    slot.appendChild(frame);
    map.dataset.loaded = 'true';
  }
  function unloadMap(map) {
    if (!map.dataset.loaded) return;
    const frame = $('iframe', map);
    if (frame) frame.remove();
    delete map.dataset.loaded;
  }
  // Analytics are not installed. If a measurement ID is ever added to
  // <meta name="dstudio:analytics-id">, it loads only after consent.
  function loadAnalytics() {
    const meta = $('meta[name="dstudio:analytics-id"]');
    const id = meta && meta.content.trim();
    if (!id || window.dstudioAnalyticsLoaded) return;
    window.dstudioAnalyticsLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  const showBanner = (show) => {
    if (!banner) return;
    banner.hidden = !show;
    document.documentElement.classList.toggle('has-consent-banner', show);
  };
  const syncDialog = () => {
    if (!dialog) return;
    const state = consent.current || { external: false, analytics: false };
    $$('input[data-consent-category]', dialog).forEach((input) => {
      input.checked = Boolean(state[input.dataset.consentCategory]);
    });
  };
  const openDialog = () => {
    if (!dialog) return;
    syncDialog();
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
      if (kind === 'accept') consent.write({ external: true, analytics: true });
      if (kind === 'reject') consent.write({ external: false, analytics: false });
      if (kind === 'save' && dialog) {
        const choice = {};
        $$('input[data-consent-category]', dialog).forEach((input) => {
          choice[input.dataset.consentCategory] = input.checked;
        });
        consent.write(choice);
      }
      if (kind === 'close') { closeDialog(); return; }
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
      const state = consent.current || { analytics: false };
      consent.write({ external: true, analytics: state.analytics });
      showBanner(false);
      const map = mapButton.closest('[data-map]');
      const frame = map && $('iframe', map);
      if (frame) frame.focus();
    }
  });
  if (dialog) {
    // Click on the backdrop closes the dialog.
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
  }

  consent.current = consent.read();
  consent.apply();
  showBanner(!consent.current);

  /* ------------------------------------------------------------------ *
   * 5. Scroll reveals — one quiet rise, once. Skipped with reduced motion.
   * ------------------------------------------------------------------ */
  const revealables = $$('[data-reveal]');
  if (revealables.length) {
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealables.forEach((el) => io.observe(el));
    } else {
      revealables.forEach((el) => el.classList.add('is-in'));
    }
  }

  /* ------------------------------------------------------------------ *
   * 6. Mobile booking bar — appears after the hero CTA has scrolled away,
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
   * 7. Gift voucher — slides out of the envelope to the right.
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
   * 8. Small things
   * ------------------------------------------------------------------ */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
