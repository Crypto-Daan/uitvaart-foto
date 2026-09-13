/* SuperGallery productpagina — configurator, prijsregels en koppeling met de 3D-viewer.
   Prijsdata volgt de productregels van supergallery.nl (basisprijs + toeslag afwerking + toeslag lijst, per formaat).
   Extra's: "Mijn muur" (eigen foto op ware grootte), "Vergelijk formaten", delen en bewaren van een ontwerp. */
(function () {
  'use strict';

  const BASE = 250;
  const IMG_RATIO = 1.5; // landscape 2:3

  // Formaten (staande maatvoering van de shop; dit werk is liggend, dus breedte en hoogte gewisseld)
  const SIZES = [
    { id: 42, name: 'Classical', short: 30 },
    { id: 43, name: 'Small',     short: 40 },
    { id: 44, name: 'Medium',    short: 50 },
    { id: 45, name: 'Grand',     short: 60 },
    { id: 46, name: 'Luxe',      short: 70 },
    { id: 47, name: 'Large',     short: 80 },
    { id: 48, name: 'XLarge',    short: 100 },
    { id: 49, name: 'Giant',     short: 120 }
  ].map(function (s) { return Object.assign(s, { w: Math.round(s.short * IMG_RATIO), h: s.short }); });

  const FINISHES = [
    { key: 'print',  name: 'Print',        thumb: 'img/attr/attr_38.jpg', desc: 'Losse C-print op Fujicolor Crystal Archive DP II, mat',
      mod: { 42: 0, 43: 50, 44: 175, 45: 300, 46: 400, 47: 450, 48: 500, 49: 700 } },
    { key: 'glossy', name: 'Plexi glossy', thumb: 'img/attr/attr_39.jpg', desc: 'Facemount op 3 mm PLEXIGLAS® glans, 3 mm Dibond',
      mod: { 42: 100, 43: 200, 44: 450, 45: 550, 46: 650, 47: 750, 48: 1250, 49: 2000 } },
    { key: 'matt',   name: 'Plexi matt',   thumb: 'img/attr/attr_40.jpg', desc: 'Facemount op 3 mm PLEXIGLAS® mat, 3 mm Dibond',
      mod: { 42: 100, 43: 200, 44: 450, 45: 550, 46: 650, 47: 750, 48: 1250, 49: 2000 } },
    { key: 'museum', name: 'Museumplexi',  thumb: 'img/attr/attr_41.jpg', desc: 'Facemount op 3 mm TruLife® museumacryl, 3 mm Dibond',
      mod: { 42: 250, 43: 350, 44: 700, 45: 1200, 46: 1250, 47: 1450, 48: 2000, 49: 2750 } }
  ];

  const WOODS = [
    { key: 'white',  name: 'Wit',     coated: true },
    { key: 'maple',  name: 'Esdoorn', coated: false },
    { key: 'oak',    name: 'Eiken',   coated: false },
    { key: 'walnut', name: 'Walnoot', coated: false },
    { key: 'wenge',  name: 'Wengé',   coated: false },
    { key: 'black',  name: 'Zwart',   coated: true }
  ];
  const SHADOW_IDS = { white: 59, maple: 51, oak: 52, walnut: 53, wenge: 54, black: 55 };
  const PP_IDS = { white: 65, maple: 66, oak: 67, walnut: 68, wenge: 69, black: 70 };
  const SHADOW_MOD = { 42: 100, 43: 140, 44: 150, 45: 200, 46: 250, 47: 300, 48: 450, 49: 550 };
  const PP_MOD = { 42: 150, 43: 200, 44: 250, 45: 400, 46: 500, 47: 750, 48: 1000 }; // Giant: niet leverbaar
  const MAT_SHARE = 0.2; // passe-partout 5 cm kost 20% van de lijstprijs (shopregel)

  const NONE_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f4f4f4"/>' +
    '<rect x="22" y="30" width="56" height="40" fill="#fff" stroke="#d0d0d0" stroke-width="1.5"/>' +
    '<path d="M26 66 L44 46 L54 58 L62 50 L74 66 Z" fill="#dedede"/><circle cx="64" cy="40" r="4" fill="#bdbdbd"/></svg>');
  const NONE = { key: 'none', type: 'none', name: 'Geen lijst', thumb: NONE_ICON, desc: 'Alleen het werk', mod: {} };

  function frameOptions(finish) {
    if (finish === 'print') {
      return [NONE].concat(WOODS.map(function (w) {
        return { key: 'pp-' + w.key, type: 'passepartout', wood: w.key, name: w.name, coated: w.coated,
          thumb: 'img/attr/attr_' + PP_IDS[w.key] + '.jpg', tex: w.coated ? null : 'img/strip/strip_' + PP_IDS[w.key] + '.jpg', desc: 'Vlakke lijst · museumglas · passe-partout optioneel', mod: PP_MOD };
      }));
    }
    return [NONE].concat(WOODS.map(function (w) {
      return { key: 'sh-' + w.key, type: 'shadow', wood: w.key, name: w.name, coated: w.coated,
        thumb: 'img/attr/attr_' + SHADOW_IDS[w.key] + '.jpg', tex: w.coated ? null : 'img/strip/strip_' + SHADOW_IDS[w.key] + '.jpg', desc: 'Baklijst · zwevend, 5 mm ruimte', mod: SHADOW_MOD };
    }));
  }

  const RELATED = [
    { name: 'Pool At Puerto Vallarta', img: 'img/related/4181.jpg' },
    { name: 'Palm Beach Villa', img: 'img/related/4180.jpg' },
    { name: 'Spot The Ball', img: 'img/related/4179.jpg' },
    { name: 'Esther Williams In Pool', img: 'img/related/4178.jpg' },
    { name: 'Marisa Berenson', img: 'img/related/4177.jpg' },
    { name: 'Bermuda Street Scene', img: 'img/related/4176.jpg' },
    { name: 'Boughton House', img: 'img/related/4175.jpg' },
    { name: 'Snorkelling In The Shallows', img: 'img/related/4174.jpg' }
  ];

  /* ---------- Status ----------
     Zonder voorselectie: de pagina start met de 2D-foto en "Vanaf € 250,00".
     Pas bij een keuze schakelt de viewer naar 3D. */
  const state = { size: null, finish: null, frame: NONE, mat: false, bag: 0, mode: 'photo' };
  const PREVIEW = { size: SIZES[1], finish: FINISHES[1] };   // voorbeeld in 3D zolang er nog niets gekozen is

  const $ = function (id) { return document.getElementById(id); };
  const euro = function (n) { return '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const fmtWH = function (w, h) { return Math.round(w) + ' × ' + Math.round(h) + ' cm'; };
  const eff = function () { return { size: state.size || PREVIEW.size, finish: state.finish || PREVIEW.finish }; };
  const complete = function () { return !!(state.size && state.finish); };

  function frameName(frame) {
    if (frame.type === 'none') return 'geen lijst';
    if (frame.type === 'shadow') return 'baklijst ' + frame.name.toLowerCase();
    return fixFrameLabel(frame).toLowerCase() + (state.mat ? ' met passe-partout' : '');
  }
  function fixFrameLabel(frame) {
    // "Wit" -> "Witte lijst", "Zwart" -> "Zwarte lijst", "Eiken" -> "Eiken lijst" enz.
    if (frame.type !== 'passepartout') return frame.name;
    const w = WOODS.find(function (x) { return x.key === frame.wood; }).name;
    const adj = { Wit: 'Witte', Zwart: 'Zwarte', Esdoorn: 'Esdoorn', Eiken: 'Eiken', Walnoot: 'Walnoten', Wengé: 'Wengé' }[w] || w;
    return adj + ' lijst';
  }
  function describe() {
    const e = eff();
    return e.size.name + ' · ' + e.finish.name + ' · ' + frameName(state.frame);
  }

  function priceFor(size, finish, frame, mat) {
    const sid = size.id;
    const fin = finish.mod[sid] || 0;
    const fr = frame.type === 'none' ? 0 : (frame.mod[sid] || 0);
    const m = finish.key === 'print' && frame.type === 'passepartout' && mat ? Math.round(fr * MAT_SHARE) : 0;
    return { base: BASE, fin: fin, frame: fr, mat: m, total: BASE + fin + fr + m };
  }
  function price() { const e = eff(); return priceFor(e.size, e.finish, state.frame, state.mat); }
  function hasMatOption() { return !!state.finish && state.finish.key === 'print' && state.frame.type === 'passepartout'; }
  function matPrice() { return Math.round((state.frame.mod[eff().size.id] || 0) * MAT_SHARE); }

  function configFor(size, finish, frame, mat) {
    return { w: size.w, h: size.h, finish: finish.key,
      frame: frame.type === 'none' ? { type: 'none' } : { type: frame.type, mat: frame.type === 'passepartout' && !!mat, tex: frame.tex, coated: frame.coated, color: frame.coated ? (frame.wood === 'white' ? 0xf2f2f0 : 0x161616) : 0x9a7b55 } };
  }
  function viewerConfig() { const e = eff(); return configFor(e.size, e.finish, state.frame, state.mat); }

  /* Elke keuze in de configurator brengt de viewer naar 3D (behalve in muur- of vergelijkstand) */
  function choose(fn) { fn(); if (state.mode === 'photo') setMode('3d'); update(); }

  /* ---------- Rendering van opties ---------- */
  function renderSizes() {
    const box = $('sizeOpts'); box.innerHTML = '';
    SIZES.forEach(function (s) {
      const b = document.createElement('button');
      b.className = 'opt'; b.type = 'button';
      b.setAttribute('aria-pressed', String(s === state.size));
      const from = BASE + FINISHES[0].mod[s.id];
      b.innerHTML = '<span class="t">' + s.name + '</span><span class="d"><span class="dl">' + s.w + ' × ' + s.h + ' cm</span><span class="ds">' + s.w + '×' + s.h + 'cm</span></span><span class="p">vanaf ' + euro(from) + '</span>';
      b.addEventListener('click', function () { choose(function () { state.size = s; ensureFrameValid(); }); });
      box.appendChild(b);
    });
    $('sizeSel').textContent = state.size ? state.size.name + ' · ' + state.size.w + ' × ' + state.size.h + ' cm' : 'Kies een formaat';
  }

  function renderFinishes() {
    const box = $('finishOpts'); box.innerHTML = '';
    FINISHES.forEach(function (f) {
      const b = document.createElement('button');
      b.className = 'opt pic'; b.type = 'button';
      b.setAttribute('aria-pressed', String(f === state.finish));
      b.title = f.desc;
      const pr = state.size ? euro(BASE + (f.mod[state.size.id] || 0)) : 'vanaf ' + euro(BASE + (f.mod[SIZES[0].id] || 0));
      b.innerHTML = '<img src="' + f.thumb + '" alt="" loading="lazy" width="320" height="320" /><span class="t">' + f.name + '</span><span class="p">' + pr + '</span>';
      b.addEventListener('click', function () { choose(function () { state.finish = f; ensureFrameValid(); }); });
      box.appendChild(b);
    });
    $('finishSel').textContent = state.finish ? state.finish.name : 'Kies een afwerking';
  }

  function renderFrames() {
    const box = $('frameOpts'); box.innerHTML = '';
    const finish = state.finish;
    const isPrint = !!finish && finish.key === 'print';
    $('frameTitle').textContent = isPrint ? 'Lijst' : '3D Baklijst';
    const opts = frameOptions(finish ? finish.key : 'glossy');
    const sid = eff().size.id;
    opts.forEach(function (f) {
      const b = document.createElement('button');
      b.className = 'opt pic'; b.type = 'button';
      const unavailable = f.type === 'passepartout' && sid === 49;
      b.disabled = !finish || unavailable;
      b.setAttribute('aria-pressed', String(!!finish && f.key === state.frame.key));
      b.title = f.desc;
      const extra = f.type === 'none' ? 'inbegrepen' : (unavailable ? 'niet leverbaar' : (state.size ? '+ ' : 'vanaf + ') + euro(f.mod[state.size ? sid : SIZES[0].id] || 0));
      b.innerHTML = '<img src="' + f.thumb + '" alt="" loading="lazy" width="320" height="320" /><span class="t">' + fixFrameLabel(f) + '</span><span class="p">' + extra + '</span>';
      b.addEventListener('click', function () { choose(function () { state.frame = f; }); });
      box.appendChild(b);
    });
    $('frameSel').textContent = !finish ? 'Kies eerst een afwerking' : state.frame.type === 'none' ? 'Geen lijst' : fixFrameLabel(state.frame);
    renderMat();
    $('frameNote').textContent = !finish
      ? 'De lijstopties hangen af van de afwerking: een baklijst bij plexi, een vlakke lijst met museumglas bij een print.'
      : isPrint
        ? 'De losse print wordt in een vlakke houten lijst (profiel 2 cm) gezet, achter museumglas, naar keuze met een passe-partout van 5 cm rondom. Niet leverbaar voor Giant.'
        : 'Het fotopaneel ligt 8 mm verdiept in een houten baklijst (profiel 1 cm, diepte 3,5 cm) met 5 mm ruimte rondom, waardoor het werk lijkt te zweven. Wit en zwart gecoat, de andere kleuren met echt houtfineer.';
  }

  function renderMat() {
    const box = $('matOpts');
    const show = hasMatOption();
    box.hidden = !show;
    if (!show) return;
    box.innerHTML = '';
    [{ mat: false, label: 'Zonder passe-partout' }, { mat: true, label: 'Passe-partout 5 cm (+ ' + euro(matPrice()) + ')' }].forEach(function (o) {
      const b = document.createElement('button');
      b.className = 'opt mat'; b.type = 'button';
      b.setAttribute('aria-pressed', String(state.mat === o.mat));
      b.innerHTML = '<span class="t">' + o.label + '</span>';
      b.addEventListener('click', function () { choose(function () { state.mat = o.mat; }); });
      box.appendChild(b);
    });
  }

  function ensureFrameValid() {
    if (state.frame.type === 'none' || !state.finish) { if (!state.finish) state.frame = NONE; return; }
    const opts = frameOptions(state.finish.key);
    const same = opts.find(function (o) { return o.wood === state.frame.wood; });
    if (same && !(same.type === 'passepartout' && eff().size.id === 49)) state.frame = same;
    else state.frame = NONE;
  }

  function renderSummary() {
    const p = price();
    const cfg = viewerConfig();
    const d = window.ArtViewer.dims(cfg);
    const done = complete();
    $('sumImage').textContent = state.size ? fmtWH(state.size.w, state.size.h) : '—';
    $('sumTotal').textContent = done ? fmtWH(d.W, d.H) + ' · ' + (d.D < 1 ? Math.round(d.D * 10) + ' mm' : d.D.toLocaleString('nl-NL') + ' cm') + ' diep' : '—';
    let build = '—';
    if (state.finish) {
      if (state.finish.key === 'print') build = state.frame.type === 'none' ? 'Losse C-print, mat fotopapier' : 'C-print · ' + (state.mat ? 'passe-partout 5 cm · ' : '') + 'museumglas · ' + fixFrameLabel(state.frame).toLowerCase();
      else build = 'C-print · 3 mm ' + (state.finish.key === 'museum' ? 'TruLife® museumacryl' : 'PLEXIGLAS® ' + (state.finish.key === 'glossy' ? 'glans' : 'mat')) + ' · 3 mm Dibond' + (state.frame.type === 'none' ? '' : ' · baklijst ' + state.frame.name.toLowerCase());
    }
    $('sumBuild').textContent = build;
    $('sumHang').textContent = !state.finish ? '—' : state.finish.key === 'print' && state.frame.type === 'none' ? 'Geen (losse print)' : state.finish.key === 'print' ? 'Ophangoog in de lijst' : 'Verborgen verstek ophangprofiel';
    $('sumPrice').textContent = done ? euro(p.total) : 'Vanaf ' + euro(BASE);
    $('sumLabel').textContent = done ? 'Totaal' : 'Prijs';
    $('hudSize').textContent = fmtWH(d.W, d.H);
    $('hudSize').title = (done ? '' : 'Voorbeeld · ') + describe();
  }

  function update() {
    renderSizes(); renderFinishes(); renderFrames(); renderSummary(); markSaved();
    if (viewer) viewer.setConfig(viewerConfig());
    snapCache.clear();
    if (state.mode === 'wall') renderWall();
    if (state.mode === 'compare') renderCompare();
  }

  /* ---------- Gerelateerde werken ---------- */
  (function () {
    const g = $('relatedGrid');
    RELATED.forEach(function (r) {
      const a = document.createElement('a');
      a.className = 'card'; a.href = '#';
      a.innerHTML = '<div class="im"><img src="' + r.img + '" alt="' + r.name + ' — Slim Aarons" loading="lazy" /></div><span class="t">' + r.name + '</span><span class="p"><span>Slim Aarons</span><b>vanaf ' + euro(BASE) + '</b></span>';
      g.appendChild(a);
    });
  })();

  /* ---------- Viewer: foto (2D), 3D, mijn muur, vergelijk ---------- */
  let viewer = null;
  let currentView = 'orbit';
  const viewerEl = $('viewer');
  const OVERLAY_MODES = { photo: 'viewerPhoto', wall: 'viewerWall', compare: 'viewerCompare' };
  let hintShown = false;

  /* Tabs: foto / 3D / mijn muur / vergelijk. Camerastanden (voor, zijkant, close-up) zitten in de balk in de 3D-weergave. */
  function setViewTab(name) {
    const tab = OVERLAY_MODES[name] ? name : 'orbit';
    document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === tab)); });
    if (!OVERLAY_MODES[name]) {
      currentView = name;
      document.querySelectorAll('[data-cam]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cam === name)); });
    }
  }
  function showHintOnce() {
    if (hintShown) return; hintShown = true;
    const h = $('hudHint'); h.classList.add('show');
    setTimeout(function () { h.classList.remove('show'); }, 3500);
  }

  function photoRect() {
    const img = $('viewerPhoto').querySelector('img');
    const v = viewerEl.getBoundingClientRect(), i = img.getBoundingClientRect();
    return { x: i.left - v.left, y: i.top - v.top, w: i.width, h: i.height, vw: v.width, vh: v.height };
  }
  function setMode(mode) {
    const from = state.mode;
    if (mode === '3d' && from === 'photo' && viewer) viewer.enterFrom(photoRect());
    state.mode = mode;
    Object.keys(OVERLAY_MODES).forEach(function (m) { $(OVERLAY_MODES[m]).classList.toggle('off', m !== mode); });
    viewerEl.classList.toggle('is-photo', mode === 'photo');
    viewerEl.classList.toggle('is-overlay', mode !== '3d');
    if (mode !== '3d') { setViewTab(mode); if (viewer) viewer.setSpin(false); $('spinToggle').setAttribute('aria-pressed', 'false'); }
    else { setViewTab(currentView); if (viewer) viewer.setView(currentView); showHintOnce(); }
    if (mode === 'wall') renderWall();
    if (mode === 'compare') renderCompare();
  }

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }

  let viewerReady = false;
  const readyQueue = [];
  function whenReady(fn) { if (viewerReady) fn(); else readyQueue.push(fn); }

  if (window.THREE && window.ArtViewer && webglOK()) {
    try {
      viewer = window.ArtViewer.create(viewerEl, {
        image: 'img/poolside.jpg',
        onReady: function () { $('viewerLoading').classList.add('done'); viewerReady = true; readyQueue.splice(0).forEach(function (f) { f(); }); },
        onInteract: function (what, val) {
          if (what === 'spin') $('spinToggle').setAttribute('aria-pressed', String(!!val));
          if (what === 'view') setViewTab(val);
        }
      });
      window.__sgViewer = viewer;
    } catch (e) { viewer = null; console.error(e); }
  }
  if (!viewer) {
    // geen WebGL: de foto blijft staan, de 3D-knoppen doen niets
    $('viewerLoading').classList.add('done');
    $('to3d').hidden = true;
    $('viewerBar').hidden = true;
    document.querySelectorAll('[data-view]:not([data-view="photo"])').forEach(function (b) { b.disabled = true; });
  }

  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      const v = b.dataset.view;
      if (OVERLAY_MODES[v]) { setMode(v); return; }
      if (!viewer) return;
      if (state.mode !== '3d') setMode('3d');
    });
  });
  document.querySelectorAll('[data-cam]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!viewer) return;
      const v = b.getAttribute('aria-pressed') === 'true' ? 'orbit' : b.dataset.cam;   // nogmaals klikken: terug naar vrij draaien
      currentView = v; setViewTab(v); viewer.setView(v);
      viewer.setSpin(false); $('spinToggle').setAttribute('aria-pressed', 'false');
    });
  });
  $('to3d').addEventListener('click', function () { if (viewer) setMode('3d'); });
  /* Veeg over de foto: horizontaal vegen opent 3D en draait direct mee; verticaal blijft scrollen */
  (function swipeToRotate() {
    const el = $('viewerPhoto');
    let g = null;
    el.addEventListener('pointerdown', function (e) {
      if (!viewer || e.target.closest('button')) return;
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, live: false };
    });
    el.addEventListener('pointermove', function (e) {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.live) {
        if (Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy) * 1.2) return;   // nog geen duidelijke horizontale veeg
        g.live = true;
        try { el.setPointerCapture(e.pointerId); } catch (x) {}
        currentView = 'orbit';
        setMode('3d');
      }
      viewer.nudge(dx, dy);
      g.x = e.clientX; g.y = e.clientY;
    });
    const end = function (e) { if (g && e.pointerId === g.id) g = null; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  })();
  $('resetView').addEventListener('click', function () {
    currentView = 'orbit'; setViewTab('orbit');
    $('studio').value = 'studio';
    $('spinToggle').setAttribute('aria-pressed', 'false');
    $('scaleToggle').setAttribute('aria-pressed', 'false');
    if (viewer) { viewer.setSpin(false); viewer.setScale(false); viewer.setStudio('studio'); viewer.reset(); }
  });
  $('studio').addEventListener('change', function () { if (viewer) viewer.setStudio(this.value); });
  $('scaleToggle').addEventListener('click', function () {
    const on = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', String(on));
    if (viewer) viewer.setScale(on);
  });
  $('spinToggle').addEventListener('click', function () {
    const on = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', String(on));
    if (viewer) { viewer.setSpin(on); if (on) { currentView = 'orbit'; setViewTab('orbit'); } }
  });

  /* ---------- Losse renders van het werk (cache per configuratie) ---------- */
  const snapCache = new Map();
  function snapKey(cfg) { return [cfg.w, cfg.h, cfg.finish, cfg.frame.type, cfg.frame.tex || cfg.frame.color || '', cfg.frame.mat ? 1 : 0].join('|'); }
  function getSnap(cfg, cb) {
    if (!viewer) return;
    const k = snapKey(cfg);
    if (snapCache.has(k)) { cb(snapCache.get(k)); return; }
    whenReady(function () { viewer.snapshot(cfg, function (res) { snapCache.set(k, res); cb(res); }); });
  }

  /* ---------- 1. Mijn muur: eigen foto, werk op ware grootte ---------- */
  const wall = { img: null, natW: 0, natH: 0, roomCm: 350, x: 0.5, y: 0.42, snap: null };
  const wallScene = $('wallScene'), wallPhoto = $('wallPhoto'), wallArt = $('wallArt');

  function wallRect() {
    // weergegeven rechthoek van de muurfoto (object-fit: contain) binnen de scène
    const sw = wallScene.clientWidth, sh = wallScene.clientHeight;
    if (!wall.img) return { x: 0, y: 0, w: sw, h: sh };
    const r = Math.min(sw / wall.natW, sh / wall.natH);
    const w = wall.natW * r, h = wall.natH * r;
    return { x: (sw - w) / 2, y: (sh - h) / 2, w: w, h: h };
  }
  function layoutWall() {
    if (!wall.snap) return;
    const r = wallRect();
    const pxPerCm = r.w / wall.roomCm;
    const w = wall.snap.W * pxPerCm, h = wall.snap.H * pxPerCm;
    wallArt.style.width = w + 'px'; wallArt.style.height = h + 'px';
    wallArt.style.left = (r.x + r.w * wall.x - w / 2) + 'px';
    wallArt.style.top = (r.y + r.h * wall.y - h / 2) + 'px';
    $('wallSizeLabel').textContent = fmtWH(wall.snap.W, wall.snap.H) + ' · ' + describe();
  }
  function renderWall() {
    if (!viewer) return;
    wallArt.classList.add('loading');
    getSnap(viewerConfig(), function (res) { wall.snap = res; wallArt.src = res.url; wallArt.classList.remove('loading'); layoutWall(); });
  }
  $('wallFile').addEventListener('change', function () {
    const f = this.files && this.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = function () {
      wall.img = url; wall.natW = im.naturalWidth; wall.natH = im.naturalHeight;
      wallPhoto.src = url; wallPhoto.hidden = false; wallScene.classList.add('has-photo');
      layoutWall();
      toast('Sleep het werk op de juiste plek en stel de breedte van je muur in.');
    };
    im.src = url;
  });
  $('wallWidth').addEventListener('input', function () { wall.roomCm = Number(this.value); $('wallWidthVal').textContent = this.value + ' cm'; layoutWall(); });
  (function drag() {
    let active = null;
    wallArt.addEventListener('pointerdown', function (e) { active = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: wall.x, oy: wall.y }; wallArt.setPointerCapture(e.pointerId); });
    wallArt.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== active.id) return;
      const r = wallRect();
      wall.x = Math.max(0.05, Math.min(0.95, active.ox + (e.clientX - active.x) / r.w));
      wall.y = Math.max(0.05, Math.min(0.95, active.oy + (e.clientY - active.y) / r.h));
      layoutWall();
    });
    const end = function (e) { if (active && e.pointerId === active.id) active = null; };
    wallArt.addEventListener('pointerup', end); wallArt.addEventListener('pointercancel', end);
  })();
  if (window.ResizeObserver) new ResizeObserver(function () { if (state.mode === 'wall') layoutWall(); if (state.mode === 'compare') renderCompare(); }).observe(wallScene);

  /* ---------- 2. Formaatvergelijker: tot drie formaten boven een bank ---------- */
  const cmp = { picked: null };
  function cmpDefault() {
    const cur = state.size || SIZES[2];
    const i = SIZES.indexOf(cur);
    const pick = [cur];
    if (SIZES[i + 1]) pick.push(SIZES[i + 1]); else if (SIZES[i - 1]) pick.unshift(SIZES[i - 1]);
    return pick;
  }
  function renderCompare() {
    if (!viewer) return;
    if (!cmp.picked) cmp.picked = cmpDefault();
    const chips = $('cmpChips'); chips.innerHTML = '';
    SIZES.forEach(function (s) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip-btn';
      b.setAttribute('aria-pressed', String(cmp.picked.indexOf(s) >= 0));
      b.textContent = s.name + ' ' + s.w + '×' + s.h;
      b.addEventListener('click', function () {
        const i = cmp.picked.indexOf(s);
        if (i >= 0) { if (cmp.picked.length > 1) cmp.picked.splice(i, 1); }
        else { if (cmp.picked.length >= 3) cmp.picked.shift(); cmp.picked.push(s); }
        cmp.picked.sort(function (a, b) { return a.short - b.short; });
        renderCompare();
      });
      chips.appendChild(b);
    });
    const e = eff();
    const stage = $('cmpStage'); const legend = $('cmpLegend');
    stage.innerHTML = ''; legend.innerHTML = '';
    const cfgs = cmp.picked.map(function (s) { return { size: s, cfg: configFor(s, e.finish, state.frame, state.mat) }; });
    const dimsList = cfgs.map(function (c) { return window.ArtViewer.dims(c.cfg); });
    const gap = 30;
    const artsCm = dimsList.reduce(function (a, d) { return a + d.W; }, 0) + gap * (cfgs.length + 1);
    const roomCm = Math.max(330, artsCm);
    const roomH = 250; // cm van vloer tot bovenrand van het beeld
    // schaal zo dat de kamer in breedte én hoogte in de viewer past, gecentreerd
    const pxPerCm = Math.min(stage.clientWidth / roomCm, stage.clientHeight / roomH);
    const roomPx = roomCm * pxPerCm, x0 = (stage.clientWidth - roomPx) / 2, y0 = stage.clientHeight - roomH * pxPerCm;
    legend.style.width = Math.round(roomPx) + 'px'; legend.style.margin = '0 auto';
    // bank (220 cm breed, 85 cm hoog) gecentreerd op de vloer
    const sofa = document.createElement('div'); sofa.className = 'cmp-sofa';
    sofa.style.width = (220 * pxPerCm) + 'px'; sofa.style.height = (85 * pxPerCm) + 'px';
    sofa.style.left = (x0 + (roomCm - 220) / 2 * pxPerCm) + 'px';
    sofa.innerHTML = '<svg viewBox="0 0 220 85" preserveAspectRatio="none"><rect x="14" y="4" width="192" height="46" rx="8" fill="#cfc9bf"/><rect x="0" y="34" width="34" height="40" rx="9" fill="#bfb8ad"/><rect x="186" y="34" width="34" height="40" rx="9" fill="#bfb8ad"/><rect x="24" y="44" width="172" height="30" rx="5" fill="#d9d3c9"/><rect x="24" y="74" width="10" height="11" fill="#8d857a"/><rect x="186" y="74" width="10" height="11" fill="#8d857a"/></svg>';
    stage.appendChild(sofa);
    const floorLine = document.createElement('div'); floorLine.className = 'cmp-floor'; stage.appendChild(floorLine);
    // slots van gelijke breedte
    const slotW = roomCm / cfgs.length;
    cfgs.forEach(function (c, i) {
      const d = dimsList[i];
      const cx = x0 + (slotW * (i + 0.5)) * pxPerCm;
      const cy = y0 + (roomH - 165) * pxPerCm; // hart op 165 cm hoogte
      const img = document.createElement('img'); img.className = 'cmp-art loading'; img.alt = c.size.name;
      img.style.width = (d.W * pxPerCm) + 'px'; img.style.height = (d.H * pxPerCm) + 'px';
      img.style.left = (cx - d.W * pxPerCm / 2) + 'px'; img.style.top = (cy - d.H * pxPerCm / 2) + 'px';
      stage.appendChild(img);
      getSnap(c.cfg, function (res) { img.src = res.url; img.classList.remove('loading'); });
      const pr = priceFor(c.size, e.finish, state.frame, state.mat).total;
      const l = document.createElement('button'); l.type = 'button'; l.className = 'cmp-item';
      l.setAttribute('aria-pressed', String(state.size === c.size));
      l.innerHTML = '<b>' + c.size.name + '</b><span>' + fmtWH(d.W, d.H) + '</span><span>' + euro(pr) + '</span>';
      l.addEventListener('click', function () { state.size = c.size; ensureFrameValid(); update(); toast(c.size.name + ' gekozen · ' + euro(pr)); });
      legend.appendChild(l);
    });
    $('cmpNote').textContent = 'Bank van 220 cm als referentie · ' + e.finish.name + ' · ' + frameName(state.frame) + (complete() ? '' : ' · kies een afwerking voor de definitieve prijs');
  }

  /* ---------- 5. Delen: link met configuratie, met afbeelding waar mogelijk ---------- */
  function shareParams() {
    const p = new URLSearchParams();
    if (state.size) p.set('formaat', state.size.name.toLowerCase());
    if (state.finish) p.set('afwerking', state.finish.key);
    if (state.frame.type !== 'none') p.set('lijst', state.frame.key);
    if (hasMatOption() && state.mat) p.set('passepartout', '1');
    return p;
  }
  function shareUrl() { const q = shareParams().toString(); return location.origin + location.pathname + (q ? '?' + q : ''); }
  function applyParams() {
    const p = new URLSearchParams(location.search);
    if (!p.has('formaat') && !p.has('afwerking')) return false;
    const s = SIZES.find(function (x) { return x.name.toLowerCase() === (p.get('formaat') || ''); });
    const f = FINISHES.find(function (x) { return x.key === p.get('afwerking'); });
    if (s) state.size = s;
    if (f) state.finish = f;
    if (f && p.get('lijst')) { const fr = frameOptions(f.key).find(function (x) { return x.key === p.get('lijst'); }); if (fr) state.frame = fr; }
    state.mat = p.get('passepartout') === '1';
    ensureFrameValid();
    return true;
  }
  function dataUrlToFile(url, name) {
    const parts = url.split(','), mime = parts[0].match(/:(.*?);/)[1], bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], name, { type: mime });
  }
  $('shareBtn').addEventListener('click', function () {
    const url = shareUrl();
    const text = 'Poolside Backgammon van Slim Aarons · ' + describe() + (complete() ? ' · ' + euro(price().total) : '');
    const finish = function (ok) { if (ok) toast('Link gedeeld.'); };
    if (navigator.share) {
      const data = { title: 'Poolside Backgammon — SuperGallery', text: text, url: url };
      try {
        if (viewer && state.mode === '3d' && navigator.canShare) {
          const file = dataUrlToFile(viewer.capture(), 'poolside-backgammon.jpg');
          if (navigator.canShare({ files: [file] })) data.files = [file];
        }
      } catch (e) {}
      navigator.share(data).then(function () { finish(true); }).catch(function () {});
      return;
    }
    const copy = function () { toast('Link gekopieerd: deel je ontwerp via WhatsApp of mail.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(copy).catch(function () { prompt('Kopieer deze link', url); });
    else prompt('Kopieer deze link', url);
  });
  $('downloadBtn').addEventListener('click', function () {
    if (!viewer) return;
    const go = function (url) { const a = document.createElement('a'); a.href = url; a.download = 'poolside-backgammon-' + describe().replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png'; document.body.appendChild(a); a.click(); a.remove(); };
    if (state.mode === '3d') go(viewer.capture()); else getSnap(viewerConfig(), function (res) { go(res.url); });
  });

  /* ---------- 6. Bewaren en terugkomen ---------- */
  const SAVE_KEY = 'sg-saved-designs';
  function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } }
  function storeSaved(list) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) {} }
  function thumbFrom(url, cb) {
    const im = new Image();
    im.onload = function () {
      const c = document.createElement('canvas'); const s = 260 / Math.max(im.width, im.height);
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/png'));
    };
    im.src = url;
  }
  function markSaved() {
    const q = shareParams().toString();
    const on = complete() && loadSaved().some(function (d) { return d.query === q; });
    $('saveBtn').setAttribute('aria-pressed', String(on));
    $('saveBtn').title = on ? 'Bewaard · klik om te verwijderen' : 'Bewaar ontwerp';
  }
  function renderSaved() {
    markSaved();
    const list = loadSaved();
    const box = $('savedList'); box.innerHTML = '';
    $('savedSection').hidden = list.length === 0;
    const badge = $('wishCount'); badge.textContent = String(list.length); badge.hidden = list.length === 0;
    list.slice().reverse().forEach(function (d) {
      const el = document.createElement('div'); el.className = 'saved';
      el.innerHTML = '<img src="' + (d.thumb || 'img/poolside-thumb.jpg') + '" alt="" />' +
        '<div class="saved-body"><b>' + d.label + '</b><span>' + euro(d.price) + ' · bewaard op ' + new Date(d.ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) + '</span>' +
        '<div class="saved-actions"><button type="button" class="btn-mini" data-load="' + d.id + '">Laden</button><button type="button" class="btn-mini ghost" data-share="' + d.id + '">Deel</button><button type="button" class="btn-mini ghost" data-del="' + d.id + '">Verwijder</button></div></div>';
      box.appendChild(el);
    });
    box.querySelectorAll('[data-load]').forEach(function (b) { b.addEventListener('click', function () { loadDesign(Number(b.dataset.load)); }); });
    box.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { storeSaved(loadSaved().filter(function (d) { return d.id !== Number(b.dataset.del); })); renderSaved(); }); });
    box.querySelectorAll('[data-share]').forEach(function (b) { b.addEventListener('click', function () { const d = loadSaved().find(function (x) { return x.id === Number(b.dataset.share); }); if (!d) return; const u = location.origin + location.pathname + '?' + d.query; if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('Link gekopieerd.'); }); else prompt('Kopieer deze link', u); }); });
  }
  function loadDesign(id) {
    const d = loadSaved().find(function (x) { return x.id === id; }); if (!d) return;
    history.replaceState(null, '', location.pathname + '?' + d.query);
    state.size = null; state.finish = null; state.frame = NONE; state.mat = false;
    applyParams();
    if (viewer) setMode('3d'); update();
    $('welcome').hidden = true;
    document.querySelector('.viewer-col').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Ontwerp geladen: ' + d.label);
  }
  $('saveBtn').addEventListener('click', function () {
    if (!complete()) { toast(!state.size ? 'Kies eerst een formaat om te bewaren.' : 'Kies eerst een afwerking om te bewaren.'); return; }
    const q = shareParams().toString();
    const existing = loadSaved().find(function (d) { return d.query === q; });
    if (existing) { storeSaved(loadSaved().filter(function (d) { return d.id !== existing.id; })); renderSaved(); toast('Ontwerp verwijderd uit je bewaarde ontwerpen.'); return; }
    const entry = { id: Date.now(), ts: Date.now(), label: describe(), price: price().total, query: shareParams().toString(), thumb: null };
    const commit = function () { const list = loadSaved(); list.push(entry); storeSaved(list); renderSaved(); toast('Bewaard. Je vindt dit ontwerp terug bij "Bewaarde ontwerpen", ook als je later terugkomt.'); };
    if (viewer) getSnap(viewerConfig(), function (res) { thumbFrom(res.url, function (t) { entry.thumb = t; commit(); }); }); else commit();
  });
  $('remindForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const mail = $('remindMail').value.trim();
    if (!mail) return;
    try { localStorage.setItem('sg-remind', mail); } catch (x) {}
    toast('We mailen je over twee dagen op ' + mail + ' met je bewaarde ontwerp.');
    $('remindMail').value = '';
  });
  (function welcomeBack() {
    const list = loadSaved();
    if (!list.length) return;
    const last = list[list.length - 1];
    $('welcomeText').textContent = 'Welkom terug. Jouw Poolside Backgammon (' + last.label + ', ' + euro(last.price) + ') staat klaar.';
    $('welcome').hidden = false;
    $('welcomeLoad').addEventListener('click', function () { loadDesign(last.id); });
    $('welcomeClose').addEventListener('click', function () { $('welcome').hidden = true; });
  })();

  /* ---------- Info-popover afwerking ---------- */
  let pop = null;
  $('finishInfo').addEventListener('click', function (e) {
    e.stopPropagation();
    if (pop) { pop.remove(); pop = null; return; }
    pop = document.createElement('div');
    pop.className = 'popover';
    pop.innerHTML = '<button class="close" aria-label="Sluiten">×</button><h3>Het verschil zit in de reflectie</h3>' +
      '<p><b>Print</b> — de losse C-print, mat. Zelf inlijsten of kies hieronder een lijst, met of zonder passe-partout.</p>' +
      '<p><b>Plexi glossy</b> — glanzend beeld met veel diepte; de ruimte kan in het oppervlak spiegelen.</p>' +
      '<p><b>Plexi matt</b> — ingetogen, weinig reflectie, rustig in fel verlichte ruimtes.</p>' +
      '<p><b>Museumplexi</b> — TruLife®: de glans blijft, maar je spiegelbeeld is nauwelijks zichtbaar.</p>' +
      '<p class="muted">Gebruik de knop <b>Glasinspectie</b> boven de 3D-weergave om het verschil te zien.</p>';
    const head = this.closest('.group-head');
    head.style.position = 'relative';
    pop.style.top = '28px'; pop.style.left = '0';
    head.appendChild(pop);
    pop.querySelector('.close').addEventListener('click', function () { pop.remove(); pop = null; });
  });
  document.addEventListener('click', function (e) { if (pop && !pop.contains(e.target)) { pop.remove(); pop = null; } });

  /* ---------- Winkelmand (demo) ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }
  $('addToBag').addEventListener('click', function () {
    if (!complete()) {
      toast(!state.size ? 'Kies eerst een formaat.' : 'Kies eerst een afwerking.');
      (!state.size ? $('sizeOpts') : $('finishOpts')).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const n = qty();
    state.bag += n;
    const c = $('bagCount'); c.textContent = String(state.bag); c.hidden = false;
    toast('Toegevoegd: ' + (n > 1 ? n + ' × ' : '') + 'Poolside Backgammon · ' + describe() + ' · ' + euro(price().total * n));
  });
  /* Aantal */
  function qty() { const v = parseInt($('qty').value, 10); return isNaN(v) || v < 1 ? 1 : Math.min(20, v); }
  $('qtyMinus').addEventListener('click', function () { $('qty').value = String(Math.max(1, qty() - 1)); });
  $('qtyPlus').addEventListener('click', function () { $('qty').value = String(Math.min(20, qty() + 1)); });
  $('qty').addEventListener('change', function () { this.value = String(qty()); });
  $('sampleBtn').addEventListener('click', function () { toast('Materiaalstaal: we sturen je gratis een stalenset met alle afwerkingen en lijstkleuren.'); });

  /* ---------- Start ---------- */
  renderSaved();
  const fromLink = applyParams();
  setMode(fromLink && viewer ? '3d' : 'photo');
  update();
  if (fromLink) toast('Gedeeld ontwerp geladen: ' + describe());
})();
