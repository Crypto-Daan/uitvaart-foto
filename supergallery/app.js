/* SuperGallery productpagina — configurator, prijsregels en koppeling met de 3D-viewer.
   Prijsdata volgt de productregels van supergallery.nl (basisprijs + toeslag afwerking + toeslag lijst, per formaat). */
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

  const NONE_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#efece6"/>' +
    '<rect x="22" y="30" width="56" height="40" fill="#fff" stroke="#cfc7ba" stroke-width="1.5"/>' +
    '<path d="M26 66 L44 46 L54 58 L62 50 L74 66 Z" fill="#d9d2c4"/><circle cx="64" cy="40" r="4" fill="#b18f3c"/></svg>');
  const NONE = { key: 'none', type: 'none', name: 'Geen lijst', thumb: NONE_ICON, desc: 'Alleen het werk', mod: {} };

  function frameOptions(finish) {
    if (finish === 'print') {
      return [NONE].concat(WOODS.map(function (w) {
        return { key: 'pp-' + w.key, type: 'passepartout', wood: w.key, name: w.name, coated: w.coated,
          thumb: 'img/attr/attr_' + PP_IDS[w.key] + '.jpg', tex: 'img/strip/strip_' + PP_IDS[w.key] + '.jpg', desc: 'Passe-partout 5 cm · museumglas', mod: PP_MOD };
      }));
    }
    return [NONE].concat(WOODS.map(function (w) {
      return { key: 'sh-' + w.key, type: 'shadow', wood: w.key, name: w.name, coated: w.coated,
        thumb: 'img/attr/attr_' + SHADOW_IDS[w.key] + '.jpg', tex: 'img/strip/strip_' + SHADOW_IDS[w.key] + '.jpg', desc: 'Baklijst · zwevend, 5 mm ruimte', mod: SHADOW_MOD };
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

  /* ---------- Status ---------- */
  const state = { size: SIZES[1], finish: FINISHES[1], frame: NONE, bag: 0 };

  const $ = function (id) { return document.getElementById(id); };
  const euro = function (n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); };
  const fmtWH = function (w, h) { return Math.round(w) + ' × ' + Math.round(h) + ' cm'; };

  function frameName(frame) {
    if (frame.type === 'none') return 'geen lijst';
    if (frame.type === 'shadow') return 'baklijst ' + frame.name.toLowerCase();
    return frame.name.toLowerCase() + ' met passe-partout';
  }
  function fixFrameLabel(frame) {
    // "Wit" -> "Witte lijst", "Zwart" -> "Zwarte lijst", "Eiken" -> "Eiken lijst" enz.
    if (frame.type !== 'passepartout') return frame.name;
    const w = WOODS.find(function (x) { return x.key === frame.wood; }).name;
    const adj = { Wit: 'Witte', Zwart: 'Zwarte', Esdoorn: 'Esdoorn', Eiken: 'Eiken', Walnoot: 'Walnoten', Wengé: 'Wengé' }[w] || w;
    return adj + ' lijst';
  }

  function price() {
    const sid = state.size.id;
    const fin = state.finish.mod[sid] || 0;
    const fr = state.frame.type === 'none' ? 0 : (state.frame.mod[sid] || 0);
    return { base: BASE, fin: fin, frame: fr, total: BASE + fin + fr };
  }

  function viewerConfig() {
    const f = state.frame;
    return { w: state.size.w, h: state.size.h, finish: state.finish.key,
      frame: f.type === 'none' ? { type: 'none' } : { type: f.type, tex: f.tex, coated: f.coated, color: f.coated ? (f.wood === 'white' ? 0xf2f2f0 : 0x161616) : 0x9a7b55 } };
  }

  /* ---------- Rendering van opties ---------- */
  function renderSizes() {
    const box = $('sizeOpts'); box.innerHTML = '';
    SIZES.forEach(function (s) {
      const b = document.createElement('button');
      b.className = 'opt'; b.type = 'button';
      b.setAttribute('aria-pressed', String(s === state.size));
      const from = BASE + FINISHES[0].mod[s.id];
      b.innerHTML = '<span class="t">' + s.name + '</span><span class="d">' + s.w + ' × ' + s.h + ' cm</span><span class="p">vanaf ' + euro(from) + '</span>';
      b.addEventListener('click', function () { state.size = s; ensureFrameValid(); update(); });
      box.appendChild(b);
    });
    $('sizeSel').textContent = state.size.name + ' · ' + state.size.w + ' × ' + state.size.h + ' cm';
  }

  function renderFinishes() {
    const box = $('finishOpts'); box.innerHTML = '';
    FINISHES.forEach(function (f) {
      const b = document.createElement('button');
      b.className = 'opt pic'; b.type = 'button';
      b.setAttribute('aria-pressed', String(f === state.finish));
      b.title = f.desc;
      b.innerHTML = '<img src="' + f.thumb + '" alt="" loading="lazy" width="320" height="320" /><span class="t">' + f.name + '</span><span class="p">' + euro(BASE + (f.mod[state.size.id] || 0)) + '</span>';
      b.addEventListener('click', function () { state.finish = f; ensureFrameValid(); update(); });
      box.appendChild(b);
    });
    $('finishSel').textContent = state.finish.name;
  }

  function renderFrames() {
    const box = $('frameOpts'); box.innerHTML = '';
    const isPrint = state.finish.key === 'print';
    $('frameTitle').textContent = isPrint ? 'Lijst met passe-partout' : '3D Baklijst';
    const opts = frameOptions(state.finish.key);
    opts.forEach(function (f) {
      const b = document.createElement('button');
      b.className = 'opt pic'; b.type = 'button';
      const disabled = f.type === 'passepartout' && state.size.id === 49;
      b.disabled = disabled;
      b.setAttribute('aria-pressed', String(f.key === state.frame.key));
      b.title = f.desc;
      const extra = f.type === 'none' ? 'inbegrepen' : (disabled ? 'niet leverbaar' : '+ ' + euro(f.mod[state.size.id] || 0));
      b.innerHTML = '<img src="' + f.thumb + '" alt="" loading="lazy" width="320" height="320" /><span class="t">' + fixFrameLabel(f) + '</span><span class="p">' + extra + '</span>';
      b.addEventListener('click', function () { state.frame = f; update(); });
      box.appendChild(b);
    });
    $('frameSel').textContent = state.frame.type === 'none' ? 'Geen lijst' : fixFrameLabel(state.frame);
    $('frameNote').textContent = isPrint
      ? 'De losse print wordt in een vlakke houten lijst (profiel 2 cm) gezet, achter museumglas, met een passe-partout van 5 cm rondom. Niet leverbaar voor Giant.'
      : 'Het fotopaneel ligt 8 mm verdiept in een houten baklijst (profiel 1 cm, diepte 3,5 cm) met 5 mm ruimte rondom, waardoor het werk lijkt te zweven. Wit en zwart gecoat, de andere kleuren met echt houtfineer.';
  }

  function ensureFrameValid() {
    const opts = frameOptions(state.finish.key);
    const same = opts.find(function (o) { return state.frame.type !== 'none' && o.wood === state.frame.wood; });
    if (state.frame.type === 'none') return;
    if (same && !(same.type === 'passepartout' && state.size.id === 49)) state.frame = same;
    else state.frame = NONE;
  }

  function renderSummary() {
    const p = price();
    const d = window.ArtViewer.dims(viewerConfig());
    $('sumImage').textContent = fmtWH(state.size.w, state.size.h);
    $('sumTotal').textContent = fmtWH(d.W, d.H) + ' · ' + (d.D < 1 ? Math.round(d.D * 10) + ' mm' : d.D.toLocaleString('nl-NL') + ' cm') + ' diep';
    let build;
    if (state.finish.key === 'print') build = state.frame.type === 'none' ? 'Losse C-print, mat fotopapier' : 'C-print · passe-partout 5 cm · museumglas · ' + fixFrameLabel(state.frame).toLowerCase();
    else build = 'C-print · 3 mm ' + (state.finish.key === 'museum' ? 'TruLife® museumacryl' : 'PLEXIGLAS® ' + (state.finish.key === 'glossy' ? 'glans' : 'mat')) + ' · 3 mm Dibond' + (state.frame.type === 'none' ? '' : ' · baklijst ' + state.frame.name.toLowerCase());
    $('sumBuild').textContent = build;
    $('sumHang').textContent = state.finish.key === 'print' && state.frame.type === 'none' ? 'Geen (losse print)' : state.finish.key === 'print' ? 'Ophangoog in de lijst' : 'Verborgen verstek ophangprofiel';
    $('sumPrice').textContent = euro(p.total);
    $('hudSize').textContent = fmtWH(d.W, d.H);
    $('hudConfig').textContent = state.size.name + ' · ' + state.finish.name + ' · ' + frameName(state.frame);
    document.title = 'Poolside Backgammon by Slim Aarons | SuperGallery';
  }

  function update() {
    renderSizes(); renderFinishes(); renderFrames(); renderSummary();
    if (viewer) viewer.setConfig(viewerConfig());
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

  /* ---------- 3D-viewer ---------- */
  let viewer = null;
  const viewerEl = $('viewer');
  const VIEW_HINT = { orbit: 'Sleep om te draaien', front: 'Recht van voren', edge: 'Zijaanzicht: lijstprofiel en opbouw', glass: 'Close-up: reflectie van de afwerking' };

  function setViewTab(name) {
    document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === name)); });
    $('hudView').textContent = VIEW_HINT[name] || '';
  }

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }

  if (window.THREE && window.ArtViewer && webglOK()) {
    try {
      viewer = window.ArtViewer.create(viewerEl, {
        image: 'img/poolside.jpg',
        onReady: function () { $('viewerLoading').classList.add('done'); },
        onInteract: function (what, val) {
          if (what === 'spin') $('spinToggle').setAttribute('aria-pressed', String(!!val));
          if (what === 'view') setViewTab(val);
        }
      });
    } catch (e) { viewer = null; console.error(e); }
  }
  if (!viewer) {
    const fb = document.createElement('div');
    fb.className = 'viewer-fallback';
    fb.innerHTML = '<div><img src="img/poolside.jpg" alt="Poolside Backgammon" /><p style="margin-top:14px;font-size:.8rem">3D-weergave is niet beschikbaar in deze browser. Hier zie je de afbeelding.</p></div>';
    viewerEl.appendChild(fb);
    $('viewerLoading').classList.add('done');
  }

  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      const v = b.dataset.view;
      setViewTab(v);
      if (viewer) { viewer.setSpin(false); $('spinToggle').setAttribute('aria-pressed', 'false'); viewer.setView(v); }
    });
  });
  $('resetView').addEventListener('click', function () {
    setViewTab('orbit');
    $('studio').value = 'studio';
    $('spinToggle').setAttribute('aria-pressed', 'false');
    if (viewer) { viewer.setSpin(false); viewer.setStudio('studio'); viewer.reset(); }
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
    if (viewer) { viewer.setSpin(on); if (on) setViewTab('orbit'); }
  });

  /* ---------- Thema ---------- */
  const root = document.documentElement;
  function applyTheme(t) {
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    const dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    $('themeToggle').setAttribute('aria-pressed', String(dark));
    $('themeLabel').textContent = dark ? 'Licht' : 'Donker';
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('sg-theme'); } catch (e) {}
  applyTheme(savedTheme);
  $('themeToggle').addEventListener('click', function () {
    const dark = root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('sg-theme', next); } catch (e) {}
  });

  /* ---------- Info-popover afwerking ---------- */
  let pop = null;
  $('finishInfo').addEventListener('click', function (e) {
    e.stopPropagation();
    if (pop) { pop.remove(); pop = null; return; }
    pop = document.createElement('div');
    pop.className = 'popover';
    pop.innerHTML = '<button class="close" aria-label="Sluiten">×</button><h3>Het verschil zit in de reflectie</h3>' +
      '<p><b>Print</b> — de losse C-print, mat. Zelf inlijsten of kies hieronder een lijst met passe-partout.</p>' +
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
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  $('addToBag').addEventListener('click', function () {
    state.bag += 1;
    const c = $('bagCount'); c.textContent = String(state.bag); c.hidden = false;
    toast('Toegevoegd: Poolside Backgammon · ' + state.size.name + ' · ' + state.finish.name + ' · ' + frameName(state.frame) + ' · ' + euro(price().total));
  });
  $('sampleBtn').addEventListener('click', function () { toast('Materiaalstaal: we sturen je gratis een stalenset met alle afwerkingen en lijstkleuren.'); });

  update();
})();
