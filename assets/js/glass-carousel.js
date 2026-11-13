/* DSTUDIO — liquid glass carousel
 *
 * A plain-WebGL port of the "Liquid Glass Carousel" component from Componentry
 * (https://componentry.dev, © Harsh Jadhav, MIT licence): an endless row of pictures
 * seen through a liquid-glass lens, with snap scrolling and a focus view.
 * The lens fragment shader and the motion constants come from that component; the
 * rendering is rewritten without React and three.js, and the input is adapted to a
 * page that scrolls: the wheel only moves the row sideways, touch still scrolls the
 * page, and there are buttons and keys for everything.
 *
 * Without WebGL or scripts the pictures stay as an ordinary scrollable row.
 */
(() => {
  'use strict';

  const stage = document.querySelector('[data-glass-stage]');
  if (!stage) return;
  const figures = [...stage.querySelectorAll('[data-glass-list] figure')];
  const items = figures.map((figure) => {
    const img = figure.querySelector('img');
    return { src: img.getAttribute('src'), title: figure.querySelector('figcaption').textContent.trim(), aspect: 3 / 4, tex: null };
  });
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap || null;
  const titleEl = stage.querySelector('[data-glass-title]');
  const countEl = stage.querySelector('[data-glass-count]');
  const liveEl = stage.querySelector('[data-glass-live]');
  const closeBtn = stage.querySelector('[data-glass-close]');
  const cursorEl = stage.querySelector('[data-glass-cursor]');
  const pad = (n) => String(n).padStart(2, '0');

  const LENS = {
    sizeX: 0.565, sizeY: 1, rotation: 65, zoom: 0, dispersion: 11, blur: 0, glow: 4.2, whiteGlow: 0.24, novaSize: 12,
    ring: 6, ringRadius: 0.49, ringWidth: 0.014, shimmerFreq: 12, shimmerSpeed: 3.5, shimmerDepth: 0.12,
    rimStart: 0.578, rimTangential: 0.6, rimInward: 0, rimFreq1: 2, rimFreq2: 1,
    ringColor: [0.843, 0.737, 0.584],            // the brand's warm beige instead of the original blue
    rimLine: 1.4, rimLinePos: 0.488, rimLineWidth: 0.003, samples: 16,
  };
  const FOCUS = { cardDuration: 0.7, focusDuration: 0.9, cardEase: 'power4.out', focusEase: 'power3.out', stagger: 0.06, dropDist: 1.4, centerScale: 1.18, lensFade: 0.85 };
  const ENTRY = { delay: 0.25, startH: 80, riseDuration: 1.0, stagger: 0.07, riseEase: 'power3.out', fromBelow: 0.9, growDelay: 0.25, growDuration: 2.15, growEase: 'expo.inOut', growStagger: 0.085, lensBloom: 1.4, lensBloomEase: 'power2.inOut' };
  const REPEATS = 4, GAP = 12, PANEL_MAX = 450;
  const BACKGROUND = [1, 1, 1];                           // white, like the stage: the lens glow is additive and needs it
  const BLANK = [0.94, 0.92, 0.89];                        // a panel whose picture has not arrived yet

  const QUAD_VS = `
attribute vec2 aPos; uniform vec4 uRect; uniform vec2 uRes; varying vec2 vUv;
void main(){ vUv = aPos + 0.5; gl_Position = vec4((uRect.xy + aPos * uRect.zw) / (uRes * 0.5), 0.0, 1.0); }`;
  const QUAD_FS = `
precision mediump float; varying vec2 vUv; uniform sampler2D uTex; uniform float uHas; uniform vec3 uFlat;
void main(){ gl_FragColor = vec4(mix(uFlat, texture2D(uTex, vUv).rgb, uHas), 1.0); }`;
  const LENS_VS = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos + 0.5; gl_Position = vec4(aPos * 2.0, 0.0, 1.0); }`;
  // Lens shader: Componentry "Liquid Glass Carousel" (MIT), unchanged apart from uniform names kept as is.
  const LENS_FS = `
#define PI 3.14159265
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uSizeX;
uniform float uSizeY;
uniform float uAspect;
uniform float uZoom;
uniform float uDispersion;
uniform float uBlur;
uniform float uGlow;
uniform float uWhiteGlow;
uniform float uNovaSize;
uniform float uBlueRing;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uShimmer;
uniform float uShimmerFreq;
uniform float uShimmerSpeed;
uniform float uShimmerDepth;
uniform float uTime;
uniform float uRimStart;
uniform float uRimTangential;
uniform float uRimInward;
uniform float uRimFreq1;
uniform float uRimFreq2;
uniform vec3 uBlueColor;
uniform float uRimLine;
uniform float uRimLinePos;
uniform float uRimLineWidth;
uniform float uRotation;
uniform int uSamples;

const int MAX_SAMPLES = 16;

vec3 discLens(vec2 center, float aspectCorrect, out float outA) {
  vec2 p = (vUv - center);
  p.x *= aspectCorrect;
  float ca = cos(uRotation), sa = sin(uRotation);
  p = mat2(ca, -sa, sa, ca) * p;
  vec2 halfSize = vec2(uSizeX, uSizeY);
  float dist = length(p / halfSize);
  outA = 0.0;
  float maskND = dist;
  if (maskND > 1.0) return vec3(0.0);

  float shapeND = clamp(maskND, 0.0, 1.0);
  float nd = clamp(dist, 0.0, 1.0);
  vec2 offset = vUv - center;
  vec2 radialDir = normalize(offset + 1e-6);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
  float angle = atan(p.y, p.x);

  float pull = uZoom * 0.30 * (nd * nd);
  float rimStrength = smoothstep(uRimStart, 1.0, nd);
  float fluidWave = sin(angle * uRimFreq1) * 0.55 + sin(angle * uRimFreq2) * 0.25;
  float rScreen = (uSizeX + uSizeY) * 0.5;
  vec2 rimOff = tangentDir * fluidWave * rimStrength * rScreen * uRimTangential;
  vec2 rimPull = -radialDir * rimStrength * rScreen * uRimInward;

  vec2 baseUV = center + offset * (1.0 - pull) + rimOff + rimPull;

  float rimMask = smoothstep(0.55, 1.0, nd);
  vec2 dispDir = offset * uDispersion * 0.004 * rimMask;
  int N = uSamples;
  if (N < 2) N = 2;
  if (N > MAX_SAMPLES) N = MAX_SAMPLES;
  vec3 col = vec3(0.0);
  vec3 caW = vec3(0.0);
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= N) break;
    float t = float(i) / float(N - 1);
    vec2 sUV = baseUV + dispDir * (t - 0.5);
    vec3 s = texture2D(uTex, sUV).rgb;
    vec3 w = vec3(
      exp(-pow((t - 0.00) / 0.38, 2.0)),
      exp(-pow((t - 0.50) / 0.38, 2.0)),
      exp(-pow((t - 1.00) / 0.38, 2.0))
    );
    col += s * w;
    caW += w;
  }
  col /= max(caW, vec3(0.001));

  col *= mix(0.91, 1.0, smoothstep(0.0, 0.38, shapeND));

  float r2 = shapeND * shapeND * 0.25;
  float gs = max(uNovaSize * uGlow * 0.003, 0.004);
  float nova = exp(-r2 / gs) + exp(-r2 / (gs * 7.0)) * 0.18;
  nova *= uWhiteGlow * (uGlow / 17.0) * 1.15;
  col += vec3(nova);

  float dC = shapeND * 0.5;
  float tR = clamp(uRingRadius, 0.1, 0.49);
  float rW = max(uRingWidth, 0.003);
  float ring = exp(-pow((dC - tR) / rW, 2.0));
  ring *= uBlueRing * (uGlow / 17.0) * 1.8;
  if (uShimmer > 0.5) ring *= sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth + (1.0 - uShimmerDepth);
  float ringAura = exp(-pow((dC - tR) / (rW * 6.0), 2.0)) * 0.28 * uBlueRing * (uGlow / 17.0);
  col += uBlueColor * (ring + ringAura);
  col += vec3(exp(-pow((dC - uRimLinePos) / max(uRimLineWidth, 0.0001), 2.0)) * uRimLine);

  outA = smoothstep(1.0, 0.93, maskND);
  return col;
}

void main(){
  vec3 base = texture2D(uTex, vUv).rgb;
  float a = 0.0;
  vec3 c = discLens(uCenter, uAspect, a);
  gl_FragColor = vec4(mix(base, c, a), 1.0);
}`;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const attrs = { antialias: true, alpha: false, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
    if (!gl) return;
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const program = (vs, fs) => {
      const v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      const p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f);
      gl.bindAttribLocation(p, 0, 'aPos');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      const uniforms = {};
      for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i += 1) {
        const info = gl.getActiveUniform(p, i);
        uniforms[info.name] = gl.getUniformLocation(p, info.name);
      }
      return { p, u: uniforms };
    };
    const quadProg = program(QUAD_VS, QUAD_FS), lensProg = program(LENS_VS, LENS_FS);
    if (!quadProg || !lensProg) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    stage.insertBefore(canvas, stage.firstChild);
    stage.classList.add('is-live');
    // the stage takes over the keyboard from the plain scrolling row
    stage.tabIndex = 0;
    const row = stage.querySelector('[data-glass-list]');
    row.removeAttribute('tabindex');

    let W = Math.max(1, stage.clientWidth), H = Math.max(1, stage.clientHeight), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const panelHFor = () => Math.max(120, Math.min(PANEL_MAX, Math.round(H * 0.52)));
    let PANEL_H = panelHFor();

    // the row is first drawn into a texture; the lens pass then reads it
    const sceneTex = gl.createTexture(), sceneFbo = gl.createFramebuffer();
    const sizeTargets = () => {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    sizeTargets();

    // a one-pixel texture stands in for pictures that have not arrived yet
    const blankTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blankTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 234, 226, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    items.forEach((item) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (gl2) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        item.tex = tex;
      };
      img.src = item.src;
    });

    // ---- the row ----
    const N = items.length, POOL = REPEATS * N;
    const EASE = reduced ? 0.28 : 0.09, SNAP_EASE = reduced ? 0.22 : 0.05;
    const WHEEL = 1.4, DRAG = 1.6, TOUCH_DRAG = 1, TOUCH_EASE = 0.22, FRICTION = 0.865, SNAP_IDLE_MS = 120;
    const SHRINK_MAX = 60, SHRINK_ATTACK = 0.25, SHRINK_DECAY = 0.06;
    const slot = (i) => items[i].aspect * PANEL_H + GAP;
    let offsets = [], total = 0;
    const measure = () => { offsets = []; let acc = 0; for (let i = 0; i < N; i += 1) { offsets.push(acc); acc += slot(i); } total = acc; };
    measure();
    const centreOf = (i) => offsets[i] + slot(i) / 2 - GAP / 2;
    const centreForIndex = (idx) => centreOf(((idx % N) + N) % N) + Math.floor(idx / N) * total;
    const nearestIndex = (value) => {
      let best = 0, bestDist = Infinity;
      for (let i = 0; i < N; i += 1) {
        const k = Math.round((value - centreOf(i)) / total), dist = Math.abs(centreOf(i) + k * total - value);
        if (dist < bestDist) { bestDist = dist; best = i + k * N; }
      }
      return best;
    };
    const centreIndex = (value) => ((nearestIndex(value) % N) + N) % N;

    let scroll = centreForIndex(0), target = scroll, velocity = 0, prevScroll = scroll, energy = 0;
    let lastInput = performance.now(), snapped = true, pendingFocus = null, lastCentre = -1;
    const focus = { active: false, poolIdx: -1, lensFx: 1, scale: 1, anim: null };
    const drop = new Array(POOL).fill(0), lastX = new Array(POOL);
    const rise = new Array(POOL).fill(1), grow = new Array(POOL).fill(1);
    let entryActive = false, entrySettled = false, entryPlayed = false, entryAnim = null;
    let rects = [], centred = null, draws = [];

    const layout = () => {
      rects = []; centred = null; draws = [];
      let centredDist = Infinity;
      const half = W / 2, buffer = PANEL_H, inEntry = entryActive || entrySettled, mid = Math.floor(REPEATS / 2);
      const cSrc = centreIndex(scroll);
      for (let poolIdx = 0; poolIdx < POOL; poolIdx += 1) {
        const rep = Math.floor(poolIdx / N), i = poolIdx % N, item = items[i];
        let x = centreOf(i) - scroll;
        x = ((x % total) + total) % total;
        x += (rep - mid) * total;
        if (x > half + total) x -= total * REPEATS;
        if (!inEntry && (x < -half - buffer || x > half + buffer)) { lastX[poolIdx] = undefined; continue; }
        lastX[poolIdx] = x;

        const shrink = 1 - 0.25 * energy, h = PANEL_H * shrink, w = item.aspect * PANEL_H * shrink;
        const isFocused = focus.active && focus.poolIdx === poolIdx, d = drop[poolIdx] || 0;
        let y = 0, drawW = w, drawH = h;
        if (isFocused) { drawW = w * focus.scale; drawH = h * focus.scale; } else if (d > 0) y = -d * H * FOCUS.dropDist;

        let fx = x, fy = y, fw = drawW, fh = drawH;
        if (inEntry) {
          if (rep !== mid) { lastX[poolIdx] = undefined; continue; }
          const slotH = (s) => ENTRY.startH + (PANEL_H - ENTRY.startH) * (grow[mid * N + s] || 0);
          fh = ENTRY.startH + (drawH - ENTRY.startH) * (grow[poolIdx] || 0);
          fw = fh * item.aspect;
          let di = i - cSrc;
          if (di > N / 2) di -= N;
          if (di < -N / 2) di += N;
          let off = 0;
          for (let k = 0; k < Math.abs(di); k += 1) {
            const a = (((cSrc + Math.sign(di) * k) % N) + N) % N, b = (((cSrc + Math.sign(di) * (k + 1)) % N) + N) % N;
            off += Math.sign(di) * ((items[a].aspect * slotH(a) + items[b].aspect * slotH(b)) / 2 + GAP);
          }
          fx = off;
          if (fx < -half - buffer || fx > half + buffer) { lastX[poolIdx] = undefined; continue; }
          const below = -H * ENTRY.fromBelow;
          fy = below + (y - below) * (rise[poolIdx] || 0);
        }
        draws.push({ x: fx, y: fy, w: fw, h: fh, item, top: isFocused });
        const sx = x + W / 2, sy = H / 2 - y;
        rects.push({ left: sx - drawW / 2, right: sx + drawW / 2, top: sy - drawH / 2, bottom: sy + drawH / 2, poolIdx, src: i, x });
        if (Math.abs(x) < centredDist) { centredDist = Math.abs(x); centred = { src: i, poolIdx }; }
      }
    };

    // ---- words around the picture ----
    const announce = (index) => {
      if (titleEl) titleEl.textContent = items[index].title;
      if (countEl) countEl.textContent = `${pad(index + 1)}/${pad(N)}`;
      if (liveEl) liveEl.textContent = `${items[index].title}, ${index + 1} z ${N}${focus.active ? ', zvětšeno' : ''}`;
    };
    const setFocused = (on) => {
      stage.classList.toggle('is-focused', on);
      if (closeBtn) closeBtn.hidden = !on;
      if (lastCentre >= 0) announce(lastCentre);
    };

    // ---- focus view: the others fall away, the middle one grows, the lens clears ----
    const locked = () => focus.active || entryActive || entrySettled;
    const ranked = (centreX, list, far) => {
      const sorted = list.map((idx) => ({ idx, dist: Math.abs(lastX[idx] - centreX) })).sort((a, b) => (far ? b.dist - a.dist : a.dist - b.dist));
      let rank = 0, prev = -1;
      return sorted.map((o) => { if (prev >= 0 && Math.abs(o.dist - prev) > 1) rank += 1; prev = o.dist; return { idx: o.idx, rank }; });
    };
    const openFocus = () => {
      if (focus.active || !centred || !items[centred.src].tex) return;
      focus.active = true; focus.poolIdx = centred.poolIdx;
      target = centreForIndex(nearestIndex(scroll));
      const others = [];
      for (let k = 0; k < POOL; k += 1) if (k !== focus.poolIdx && lastX[k] !== undefined) others.push(k);
      if (focus.anim) focus.anim.kill();
      if (!gsap || reduced) { focus.lensFx = 0; focus.scale = FOCUS.centerScale; others.forEach((k) => { drop[k] = 1; }); } else {
        const tl = gsap.timeline();
        tl.to(focus, { lensFx: 0, duration: FOCUS.lensFade, ease: 'power3.out' }, 0);
        tl.to(focus, { scale: FOCUS.centerScale, duration: FOCUS.focusDuration, ease: FOCUS.focusEase }, 0);
        ranked(lastX[focus.poolIdx] || 0, others, false).forEach((o) => tl.to(drop, { [o.idx]: 1, duration: FOCUS.cardDuration, ease: FOCUS.cardEase }, o.rank * FOCUS.stagger));
        focus.anim = tl;
      }
      setFocused(true);
    };
    const closeFocus = () => {
      if (!focus.active) return;
      if (focus.anim) focus.anim.kill();
      const done = () => { focus.active = false; focus.poolIdx = -1; };
      const others = [];
      for (let k = 0; k < POOL; k += 1) if (lastX[k] !== undefined && (drop[k] || 0) > 0) others.push(k);
      setFocused(false);
      if (!gsap || reduced) { focus.lensFx = 1; focus.scale = 1; drop.fill(0); done(); return; }
      const tl = gsap.timeline({ onComplete: done });
      tl.to(focus, { lensFx: 1, duration: FOCUS.lensFade * 0.8, ease: 'power3.inOut' }, 0);
      tl.to(focus, { scale: 1, duration: FOCUS.focusDuration * 0.85, ease: FOCUS.focusEase }, 0);
      ranked(lastX[focus.poolIdx] || 0, others, true).forEach((o) => tl.to(drop, { [o.idx]: 0, duration: FOCUS.cardDuration * 0.85, ease: FOCUS.cardEase }, o.rank * FOCUS.stagger * 0.7));
      focus.anim = tl;
    };

    // ---- entry: small pictures rise from below, then grow into the row ----
    const playEntry = () => {
      if (entryPlayed || reduced || !gsap) return;
      entryPlayed = true;
      rise.fill(0); grow.fill(0);
      entryActive = true; entrySettled = false; focus.lensFx = 0;
      target = centreForIndex(nearestIndex(scroll)); scroll = target; velocity = 0; snapped = true;
      layout();
      const visible = [];
      for (let k = 0; k < POOL; k += 1) if (lastX[k] !== undefined) visible.push(k);
      const tl = gsap.timeline({ delay: ENTRY.delay });
      const spread = ENTRY.stagger * Math.max(visible.length - 1, 1);
      let riseEnd = 0;
      visible.forEach((idx) => { const at = Math.random() * spread; riseEnd = Math.max(riseEnd, at + ENTRY.riseDuration); tl.to(rise, { [idx]: 1, duration: ENTRY.riseDuration, ease: ENTRY.riseEase }, at); });
      tl.call(() => { entryActive = false; entrySettled = true; }, [], riseEnd);
      const cSrc = centreIndex(scroll), mid = Math.floor(REPEATS / 2);
      const list = visible.filter((k) => Math.floor(k / N) === mid).map((k) => { let di = (k % N) - cSrc; if (di > N / 2) di -= N; if (di < -N / 2) di += N; return { idx: k, rank: Math.abs(di) }; });
      const maxRank = Math.max(0, ...list.map((o) => o.rank));
      const growStart = riseEnd + ENTRY.growDelay;
      let growEnd = growStart;
      tl.to(focus, { lensFx: 1, duration: ENTRY.lensBloom, ease: ENTRY.lensBloomEase }, growStart);
      list.forEach((o) => { const at = growStart + (maxRank - o.rank) * ENTRY.growStagger; growEnd = Math.max(growEnd, at + ENTRY.growDuration); tl.to(grow, { [o.idx]: 1, duration: ENTRY.growDuration, ease: ENTRY.growEase }, at); });
      tl.call(() => { entrySettled = false; grow.fill(1); rise.fill(1); stage.classList.add('is-ready'); }, [], growEnd);
      entryAnim = tl;
    };

    // ---- input ----
    const step = (direction) => {
      if (locked()) return;
      velocity = 0; pendingFocus = null; snapped = true; lastInput = performance.now();
      target = centreForIndex(nearestIndex(scroll) + direction);
    };
    const local = (event) => { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
    const panelAt = (x, y) => rects.find((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) || null;
    let dragging = false, dragId = null, dragLastX = 0, dragDist = 0, dragVel = 0, dragMoveT = 0, dragType = 'mouse', suppressClick = false;
    const showCursor = (on) => { if (cursorEl) cursorEl.classList.toggle('is-on', on && !locked() && !dragging); };

    canvas.addEventListener('wheel', (event) => {
      // only a sideways gesture moves the row; an ordinary wheel keeps scrolling the page
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || locked()) return;
      event.preventDefault();
      pendingFocus = null; target += event.deltaX * WHEEL; lastInput = performance.now(); snapped = false;
    }, { passive: false });
    canvas.addEventListener('pointerdown', (event) => {
      suppressClick = false;
      if (locked() || dragging || (event.button !== 0 && event.pointerType === 'mouse')) return;
      dragging = true; dragId = event.pointerId; dragType = event.pointerType || 'mouse';
      try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* best effort */ }
      dragLastX = local(event).x; dragDist = 0; dragVel = 0; dragMoveT = performance.now();
      velocity = 0; pendingFocus = null; snapped = false; lastInput = dragMoveT; showCursor(false);
    });
    canvas.addEventListener('pointermove', (event) => {
      const p = local(event);
      if (dragging && event.pointerId === dragId) {
        const dx = p.x - dragLastX, sens = dragType === 'mouse' ? DRAG : TOUCH_DRAG;
        dragLastX = p.x; dragDist += Math.abs(dx); target -= dx * sens; dragVel = dragVel * 0.6 - dx * sens * 0.4;
        dragMoveT = performance.now(); lastInput = dragMoveT; snapped = false;
      }
      if (event.pointerType !== 'mouse') return;
      if (cursorEl) cursorEl.style.transform = `translate(${p.x + 14}px, ${p.y + 18}px)`;
      const over = panelAt(p.x, p.y) !== null;
      canvas.style.cursor = locked() ? '' : dragging ? 'grabbing' : over ? 'grab' : '';
      showCursor(over);
    });
    const release = (event) => {
      if (!dragging || (event && dragId !== null && event.pointerId !== dragId)) return;
      dragging = false;
      try { canvas.releasePointerCapture(dragId); } catch (error) { /* already released */ }
      dragId = null;
      velocity = performance.now() - dragMoveT > 90 ? 0 : dragVel;
      dragVel = 0; lastInput = performance.now(); snapped = false;
      suppressClick = dragDist > (dragType === 'mouse' ? 6 : 12);
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', () => showCursor(false));
    canvas.addEventListener('click', (event) => {
      if (suppressClick) { suppressClick = false; return; }
      if (focus.active) { closeFocus(); return; }
      if (locked()) return;
      const p = local(event), hit = panelAt(p.x, p.y);
      if (!hit) return;
      if (centred && hit.poolIdx === centred.poolIdx) { pendingFocus = null; openFocus(); return; }
      velocity = 0; snapped = true; target = centreForIndex(nearestIndex(scroll + hit.x)); pendingFocus = { src: hit.src }; showCursor(false);
    });
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      else if (event.key === 'Escape' && focus.active) { event.preventDefault(); closeFocus(); }
      else if ((event.key === 'Enter' || event.key === ' ') && event.target === stage) { event.preventDefault(); if (focus.active) closeFocus(); else openFocus(); }
    });
    const prevBtn = stage.querySelector('[data-glass-prev]'), nextBtn = stage.querySelector('[data-glass-next]');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (focus.active) closeFocus(); else step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (focus.active) closeFocus(); else step(1); });
    if (closeBtn) closeBtn.addEventListener('click', closeFocus);

    // ---- drawing ----
    gl.useProgram(lensProg.p);
    const L = lensProg.u;
    gl.uniform1i(L.uTex, 0);
    gl.uniform2f(L.uCenter, 0.5, 0.5);
    gl.uniform1f(L.uBlur, LENS.blur); gl.uniform1f(L.uGlow, LENS.glow); gl.uniform1f(L.uWhiteGlow, LENS.whiteGlow); gl.uniform1f(L.uNovaSize, LENS.novaSize);
    gl.uniform1f(L.uRingRadius, LENS.ringRadius); gl.uniform1f(L.uRingWidth, LENS.ringWidth);
    gl.uniform1f(L.uShimmer, reduced ? 0 : 1); gl.uniform1f(L.uShimmerFreq, LENS.shimmerFreq); gl.uniform1f(L.uShimmerSpeed, LENS.shimmerSpeed); gl.uniform1f(L.uShimmerDepth, LENS.shimmerDepth);
    gl.uniform1f(L.uRimStart, LENS.rimStart); gl.uniform1f(L.uRimFreq1, LENS.rimFreq1); gl.uniform1f(L.uRimFreq2, LENS.rimFreq2);
    gl.uniform3f(L.uBlueColor, LENS.ringColor[0], LENS.ringColor[1], LENS.ringColor[2]);
    gl.uniform1f(L.uRimLinePos, LENS.rimLinePos); gl.uniform1f(L.uRimLineWidth, LENS.rimLineWidth);
    gl.uniform1f(L.uRotation, (LENS.rotation * Math.PI) / 180); gl.uniform1i(L.uSamples, LENS.samples);
    gl.useProgram(quadProg.p);
    gl.uniform1i(quadProg.u.uTex, 0);
    gl.uniform3f(quadProg.u.uFlat, BLANK[0], BLANK[1], BLANK[2]);

    const draw = (time) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.clearColor(BACKGROUND[0], BACKGROUND[1], BACKGROUND[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(quadProg.p);
      gl.uniform2f(quadProg.u.uRes, W, H);
      gl.activeTexture(gl.TEXTURE0);
      draws.sort((a, b) => (a.top ? 1 : 0) - (b.top ? 1 : 0)).forEach((d) => {
        gl.uniform4f(quadProg.u.uRect, d.x, d.y, d.w, d.h);
        gl.uniform1f(quadProg.u.uHas, d.item.tex ? 1 : 0);
        gl.bindTexture(gl.TEXTURE_2D, d.item.tex || blankTex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(lensProg.p);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      const narrow = Math.min(1, Math.max(0.5, W / H / 1.45));      // a narrow stage gets a smaller lens
      gl.uniform2f(L.uRes, canvas.width, canvas.height);
      gl.uniform1f(L.uAspect, W / H);
      gl.uniform1f(L.uSizeX, LENS.sizeX * narrow); gl.uniform1f(L.uSizeY, LENS.sizeY * narrow);
      gl.uniform1f(L.uTime, time * 0.001);
      const fx = focus.lensFx;
      gl.uniform1f(L.uDispersion, LENS.dispersion * fx); gl.uniform1f(L.uBlueRing, LENS.ring * fx); gl.uniform1f(L.uRimLine, LENS.rimLine * fx);
      gl.uniform1f(L.uZoom, LENS.zoom * fx); gl.uniform1f(L.uRimTangential, LENS.rimTangential * fx); gl.uniform1f(L.uRimInward, LENS.rimInward * fx);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let raf = 0, onScreen = true;
    const tick = (time) => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      if (!dragging) {
        target += velocity; velocity *= FRICTION;
        if (Math.abs(velocity) < 0.05) velocity = 0;
        if (!snapped && !focus.active && performance.now() - lastInput > SNAP_IDLE_MS) { target = centreForIndex(nearestIndex(scroll)); snapped = true; }
      }
      const follow = dragging && dragType !== 'mouse' ? TOUCH_EASE : snapped && !pendingFocus ? SNAP_EASE : EASE;
      scroll += (target - scroll) * follow;
      const ci = centreIndex(scroll);
      if (ci !== lastCentre) { lastCentre = ci; announce(ci); }
      const norm = Math.min(1, Math.abs(scroll - prevScroll) / SHRINK_MAX);
      prevScroll = scroll;
      energy += (norm - energy) * (norm > energy ? SHRINK_ATTACK : SHRINK_DECAY);
      layout();
      if (pendingFocus && !focus.active && Math.abs(target - scroll) < 0.5) {
        const wanted = pendingFocus; pendingFocus = null;
        if (centred && centred.src === wanted.src) openFocus();
      }
      draw(time);
      raf = requestAnimationFrame(tick);
    };
    const loop = () => { if (!raf) raf = requestAnimationFrame(tick); };

    new ResizeObserver(() => {
      W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight); dpr = Math.min(window.devicePixelRatio || 1, 2);
      const index = nearestIndex(scroll);
      PANEL_H = panelHFor(); measure(); sizeTargets();
      scroll = centreForIndex(index); target = scroll;
      loop();
    }).observe(stage);
    new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];          // several can arrive at once; the last one is current
      onScreen = entry.isIntersecting;
      if (onScreen) { loop(); if (entry.intersectionRatio > 0.35) playEntry(); }
    }, { threshold: [0, 0.35] }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); stage.classList.remove('is-live', 'is-ready', 'is-focused'); stage.removeAttribute('tabindex'); row.tabIndex = 0; canvas.remove(); onScreen = false; });

    if (reduced || !gsap) stage.classList.add('is-ready');
    announce(0);
    loop();
  };

  // set up only when the section is near the screen: the pictures and the GL context can wait
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { near.disconnect(); start(); }
    }, { rootMargin: '900px 0px' });
    near.observe(stage);
  } else start();
})();
