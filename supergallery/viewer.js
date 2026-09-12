/* ArtViewer — fotorealistische 3D-weergave van een ingelijste fotoprint.
   Eenheden in centimeters. Gebouwd op three.js r128 (UMD, vendor/three.min.js).

   API:
     const v = ArtViewer.create(containerEl, { image: 'img/poolside.jpg', onInteract: fn });
     v.setConfig({ w, h, finish: 'print'|'glossy'|'matt'|'museum', frame: { type, tex, color } });
     v.setView('orbit'|'front'|'edge'|'glass');  v.setStudio('studio'|'galerie'|'woonkamer'|'donker');
     v.setScale(bool);  v.setSpin(bool);  v.reset();
     ArtViewer.dims(cfg) -> { W, H, D }  (buitenmaat incl. lijst, in cm)
*/
(function () {
  'use strict';

  const DEG = Math.PI / 180;

  /* ---------- Fysieke maten van de opbouw (cm) ---------- */
  const SPEC = {
    plexi: 0.3, dibond: 0.3, hangGap: 0.8,       // fotopaneel: 3 mm plexi + 3 mm dibond, ophangprofiel
    paper: 0.05,
    shadow: { profile: 1.0, depth: 3.5, gap: 0.5, recess: 0.8, back: 0.3 },   // baklijst
    pp: { profile: 2.0, depth: 2.5, mat: 5.0, glass: 0.2 }                     // passe-partout lijst
  };

  function dims(cfg) {
    const t = cfg.frame ? cfg.frame.type : 'none';
    if (t === 'shadow') {
      const e = SPEC.shadow.gap + SPEC.shadow.profile;
      return { W: cfg.w + 2 * e, H: cfg.h + 2 * e, D: SPEC.shadow.depth };
    }
    if (t === 'passepartout') {
      const e = SPEC.pp.mat + SPEC.pp.profile;
      return { W: cfg.w + 2 * e, H: cfg.h + 2 * e, D: SPEC.pp.depth };
    }
    if (cfg.finish === 'print') return { W: cfg.w, H: cfg.h, D: SPEC.paper };
    return { W: cfg.w, H: cfg.h, D: SPEC.plexi + SPEC.dibond + SPEC.hangGap };
  }

  /* ---------- Expositie-omgevingen ---------- */
  const STUDIOS = {
    studio:    { wall: 0xe8e5df, floor: 0xcdc3b3, sky: 0xffffff, ground: 0xb9b2a6, key: 0xfff5e6, keyI: 1.15, fillI: 0.45, hemiI: 0.55, exposure: 1.0,  figure: 0x3a3733 },
    galerie:   { wall: 0xf7f7f5, floor: 0xdcdcd8, sky: 0xffffff, ground: 0xcfcfcb, key: 0xffffff, keyI: 1.25, fillI: 0.5,  hemiI: 0.6,  exposure: 1.05, figure: 0x3a3a3a },
    woonkamer: { wall: 0xd6c9b5, floor: 0x9c7147, sky: 0xffe9d1, ground: 0x7a5a3d, key: 0xffdcb4, keyI: 1.05, fillI: 0.4,  hemiI: 0.5,  exposure: 0.95, figure: 0x3b2f24 },
    donker:    { wall: 0x2a2b2f, floor: 0x1a1a1c, sky: 0xd8d8e0, ground: 0x2a2a2e, key: 0xfff0d8, keyI: 1.5,  fillI: 0.25, hemiI: 0.3,  exposure: 1.0,  figure: 0xbdbdb8 }
  };

  /* ---------- Camera-standen ---------- */
  const VIEWS = {
    orbit: { yaw: 0.5,  pitch: 0.14,  distF: 1.0,  tx: 0,     ty: 0,    boost: 1.0 },
    front: { yaw: 0,    pitch: 0,     distF: 0.92, tx: 0,     ty: 0,    boost: 1.0 },
    edge:  { yaw: 1.2,  pitch: 0.16,  distF: 0.5,  tx: 0.3,   ty: 0,    boost: 1.0 },   // tx als fractie van W
    glass: { yaw: 0.38, pitch: -0.06, distF: 0.36, tx: -0.16, ty: 0.12, boost: 1.6 }
  };

  function create(container, opts) {
    opts = opts || {};
    const onInteract = opts.onInteract || function () {};

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 4 / 3, 1, 4000);

    /* Omgevingsreflecties: een "kamer" met softboxen, via PMREM */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = makeEnvironment(pmrem);

    /* Verlichting */
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff5e6, 1.15);
    key.position.set(-170, 230, 280);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -240; key.shadow.camera.right = 240;
    key.shadow.camera.top = 240; key.shadow.camera.bottom = -240;
    key.shadow.camera.near = 20; key.shadow.camera.far = 900;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    scene.add(key.target);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(220, 80, 260);
    scene.add(fill);

    /* Muur en vloer */
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e5df, roughness: 0.96, metalness: 0, envMapIntensity: 0.15 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), wallMat);
    wall.position.set(0, 120, -0.05);
    wall.receiveShadow = true;
    scene.add(wall);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xcdc3b3, roughness: 0.75, metalness: 0, envMapIntensity: 0.35 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -150, 450);
    floor.receiveShadow = true;
    scene.add(floor);
    const skirting = new THREE.Mesh(new THREE.BoxGeometry(1400, 7, 1.2), new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.6 }));
    skirting.position.set(0, -146.5, 0.6);
    scene.add(skirting);

    /* Schaalfiguur (1,75 m) */
    const figure = makeFigure();
    figure.visible = false;
    scene.add(figure);

    /* Kunstwerk */
    const art = new THREE.Group();
    scene.add(art);

    /* Texturen */
    const loader = new THREE.TextureLoader();
    const texCache = new Map();
    let photoTex = null;
    let photoReady = false;
    let maxAniso = renderer.capabilities.getMaxAnisotropy();

    function loadTex(url, cb) {
      if (texCache.has(url)) { const t = texCache.get(url); if (t.image && t.image.width) cb(t); else t._cbs.push(cb); return t; }
      const t = loader.load(url, function (tex) { tex._cbs.forEach(function (f) { f(tex); }); tex._cbs = []; });
      t._cbs = [cb];
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = maxAniso;
      texCache.set(url, t);
      return t;
    }

    /* Status */
    const state = {
      cfg: { w: 45, h: 30, finish: 'print', frame: { type: 'none' } },
      view: 'orbit', studio: 'studio', spin: false,
      W: 45, H: 30, fit: 200,
      yaw: 0.5, pitch: 0.14, dist: 200, tx: 0, ty: 0,
      yawT: 0.5, pitchT: 0.14, distT: 200, txT: 0, tyT: 0,
      boost: 1, boostT: 1,
      photoMats: [],
      visible: true, dragging: false, lastUser: 0
    };

    photoTex = loadTex(opts.image, function () {
      photoReady = true;
      rebuild();
      if (opts.onReady) opts.onReady();
    });

    /* ---------- Opbouw van het object ---------- */
    function clearArt() {
      while (art.children.length) {
        const c = art.children.pop();
        c.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m && !m._shared) m.dispose(); });
          }
        });
      }
      state.photoMats = [];
    }

    function photoMaterial(finish) {
      let m;
      if (finish === 'print') {
        m = new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.92, metalness: 0, envMapIntensity: 0.25 });
      } else if (finish === 'glossy') {
        m = new THREE.MeshPhysicalMaterial({ map: photoTex, roughness: 0.4, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, reflectivity: 0.7, envMapIntensity: 1.0 });
      } else if (finish === 'matt') {
        m = new THREE.MeshPhysicalMaterial({ map: photoTex, roughness: 0.75, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.45, reflectivity: 0.4, envMapIntensity: 0.45 });
      } else { // museum: glans blijft, spiegelbeeld nauwelijks zichtbaar
        m = new THREE.MeshPhysicalMaterial({ map: photoTex, roughness: 0.45, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, reflectivity: 0.3, envMapIntensity: 0.32 });
      }
      m._baseEnv = m.envMapIntensity;
      state.photoMats.push(m);
      return m;
    }

    function woodMaterial(frame, length, vertical) {
      const base = { roughness: frame.coated ? 0.38 : 0.55, metalness: 0, envMapIntensity: frame.coated ? 0.7 : 0.5, color: 0xffffff };
      const m = new THREE.MeshStandardMaterial(base);
      if (frame.tex) {
        const key = frame.tex + (vertical ? '|v' : '|h') + '|' + Math.round(length);
        let t = texCache.get(key);
        if (!t) {
          const tex = new THREE.Texture();
          tex.encoding = THREE.sRGBEncoding;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.anisotropy = maxAniso;
          tex.center.set(0.5, 0.5);
          if (vertical) { tex.rotation = Math.PI / 2; tex.repeat.set(1, length / 60); }
          else { tex.repeat.set(length / 60, 1); }
          texCache.set(key, tex);
          t = tex;
          loadTex(frame.tex, function (src) { tex.image = src.image; tex.needsUpdate = true; });
        }
        m.map = t;
      } else {
        m.color = new THREE.Color(frame.color || 0x888888);
      }
      return m;
    }

    /* Vier lijstlatten rond een opening (innerW x innerH), profielbreedte p, diepte d, vanaf z0 */
    function addFrameBars(parent, innerW, innerH, p, d, z0, frame) {
      const W = innerW + 2 * p, H = innerH + 2 * p;
      const zc = z0 + d / 2;
      const mk = function (sx, sy, x, y, vertical) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, d), woodMaterial(frame, vertical ? sy : sx, vertical));
        mesh.position.set(x, y, zc);
        mesh.castShadow = true; mesh.receiveShadow = true;
        parent.add(mesh);
      };
      mk(W, p, 0, H / 2 - p / 2, false);          // boven
      mk(W, p, 0, -H / 2 + p / 2, false);         // onder
      mk(p, innerH, -W / 2 + p / 2, 0, true);     // links
      mk(p, innerH, W / 2 - p / 2, 0, true);      // rechts
    }

    /* Fotopaneel: dibond + plexi met de print als voorvlak. Achterzijde op z0. */
    function addPanel(parent, w, h, finish, z0) {
      const dib = new THREE.Mesh(new THREE.BoxGeometry(w, h, SPEC.dibond),
        new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.5 }));
      dib.position.set(0, 0, z0 + SPEC.dibond / 2);
      dib.castShadow = true; dib.receiveShadow = true;
      parent.add(dib);

      const edge = new THREE.MeshPhysicalMaterial({ color: 0xd2e8ee, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.6, envMapIntensity: 0.8 });
      const back = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
      const front = photoMaterial(finish);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, SPEC.plexi), [edge, edge, edge, edge, front, back]);
      slab.position.set(0, 0, z0 + SPEC.dibond + SPEC.plexi / 2);
      slab.castShadow = true; slab.receiveShadow = true;
      parent.add(slab);

      // ophangprofiel (verstek), verborgen achter het paneel
      const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.max(10, w * 0.6), 4, SPEC.hangGap),
        new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.5, metalness: 0.6 }));
      rail.position.set(0, h * 0.3, z0 - SPEC.hangGap / 2);
      parent.add(rail);
    }

    function rebuild() {
      if (!photoReady) return;
      clearArt();
      const cfg = state.cfg;
      const w = cfg.w, h = cfg.h;
      const frame = cfg.frame || { type: 'none' };
      const g = new THREE.Group();

      if (frame.type === 'shadow' && cfg.finish !== 'print') {
        const S = SPEC.shadow;
        const innerW = w + 2 * S.gap, innerH = h + 2 * S.gap;
        // achterpaneel van de baklijst
        const backMat = woodMaterial(frame, innerW, false);
        const back = new THREE.Mesh(new THREE.BoxGeometry(innerW, innerH, S.back), backMat);
        back.position.set(0, 0, S.back / 2);
        back.receiveShadow = true;
        g.add(back);
        addFrameBars(g, innerW, innerH, S.profile, S.depth, 0, frame);
        // paneel verdiept in de lijst
        const z0 = S.depth - S.recess - SPEC.plexi - SPEC.dibond;
        addPanel(g, w, h, cfg.finish, z0);
      } else if (frame.type === 'passepartout' && cfg.finish === 'print') {
        const P = SPEC.pp;
        const innerW = w + 2 * P.mat, innerH = h + 2 * P.mat;
        // achterplaat
        const back = new THREE.Mesh(new THREE.BoxGeometry(innerW, innerH, 0.3), new THREE.MeshStandardMaterial({ color: 0x9a8f80, roughness: 0.9 }));
        back.position.set(0, 0, 0.15);
        g.add(back);
        // print
        const print = new THREE.Mesh(new THREE.PlaneGeometry(w, h), photoMaterial('print'));
        print.position.set(0, 0, 0.32);
        print.receiveShadow = true;
        g.add(print);
        // passe-partout met venster
        const shape = new THREE.Shape();
        shape.moveTo(-innerW / 2, -innerH / 2); shape.lineTo(innerW / 2, -innerH / 2); shape.lineTo(innerW / 2, innerH / 2); shape.lineTo(-innerW / 2, innerH / 2); shape.closePath();
        const hole = new THREE.Path();
        const hw = w / 2 - 0.3, hh = h / 2 - 0.3;
        hole.moveTo(-hw, -hh); hole.lineTo(-hw, hh); hole.lineTo(hw, hh); hole.lineTo(hw, -hh); hole.closePath();
        shape.holes.push(hole);
        const matGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
        const mat = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0xf3efe5, roughness: 0.95, metalness: 0, envMapIntensity: 0.2 }));
        mat.position.set(0, 0, 0.34);
        mat.castShadow = true; mat.receiveShadow = true;
        g.add(mat);
        // museumglas: alleen reflectie (additief), nauwelijks spiegeling
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH),
          new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.02, metalness: 0, reflectivity: 0.5, envMapIntensity: 0.35, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        glass.position.set(0, 0, P.depth - 0.25);
        glass.renderOrder = 5;
        g.add(glass);
        addFrameBars(g, innerW, innerH, P.profile, P.depth, 0, frame);
      } else if (cfg.finish === 'print') {
        // losse print, met de voorzijde als foto en papierwitte randen
        const paper = new THREE.MeshStandardMaterial({ color: 0xf7f6f2, roughness: 0.95 });
        const sheet = new THREE.Mesh(new THREE.BoxGeometry(w, h, SPEC.paper), [paper, paper, paper, paper, photoMaterial('print'), paper]);
        sheet.position.set(0, 0, 0.35 + SPEC.paper / 2);
        sheet.castShadow = true; sheet.receiveShadow = true;
        g.add(sheet);
      } else {
        addPanel(g, w, h, cfg.finish, SPEC.hangGap);
      }

      art.add(g);
      const d = dims(cfg);
      state.W = d.W; state.H = d.H;
      figure.position.x = -(d.W / 2 + 55);
      key.target.position.set(0, 0, 0);
      updateFit();
      applyView(state.view, false);
    }

    function updateFit() {
      const tanH = Math.tan(camera.fov * DEG / 2);
      const aspect = camera.aspect || 4 / 3;
      const m = 1.5;
      state.fit = Math.max(state.H * m / (2 * tanH), state.W * m / (2 * tanH * aspect));
    }

    /* ---------- Camera ---------- */
    function applyView(name, animate) {
      const v = VIEWS[name] || VIEWS.orbit;
      state.view = name;
      state.yawT = v.yaw; state.pitchT = v.pitch;
      state.distT = state.fit * v.distF;
      state.txT = v.tx * state.W; state.tyT = v.ty * state.H;
      state.boostT = v.boost;
      if (!animate) { state.yaw = state.yawT; state.pitch = state.pitchT; state.dist = state.distT; state.tx = state.txT; state.ty = state.tyT; state.boost = state.boostT; }
    }

    function updateCamera() {
      const k = 0.09;
      state.yaw += (state.yawT - state.yaw) * k;
      state.pitch += (state.pitchT - state.pitch) * k;
      state.dist += (state.distT - state.dist) * k;
      state.tx += (state.txT - state.tx) * k;
      state.ty += (state.tyT - state.ty) * k;
      state.boost += (state.boostT - state.boost) * 0.08;
      const cy = Math.cos(state.pitch);
      const x = state.tx + state.dist * Math.sin(state.yaw) * cy;
      const y = state.ty + state.dist * Math.sin(state.pitch);
      const z = state.dist * Math.cos(state.yaw) * cy;
      camera.position.set(x, y, z);
      camera.lookAt(state.tx, state.ty, 0);
      state.photoMats.forEach(function (m) { m.envMapIntensity = m._baseEnv * state.boost; });
    }

    /* ---------- Interactie ---------- */
    const el = renderer.domElement;
    const pointers = new Map();
    let pinchDist = 0;

    function userTouched() {
      state.lastUser = performance.now();
      if (state.spin) { state.spin = false; onInteract('spin', false); }
      if (state.view === 'front') { state.view = 'orbit'; onInteract('view', 'orbit'); }
    }
    el.addEventListener('pointerdown', function (e) {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      state.dragging = true; container.classList.add('dragging');
      if (pointers.size === 2) { const p = Array.from(pointers.values()); pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
    });
    el.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        state.yawT = clamp(state.yawT + dx * 0.0065, -1.35, 1.35);
        state.pitchT = clamp(state.pitchT - dy * 0.0045, -0.4, 0.65);
        userTouched();
      } else if (pointers.size === 2) {
        const p = Array.from(pointers.values());
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinchDist > 0) zoomBy(pinchDist / d);
        pinchDist = d;
        userTouched();
      }
    });
    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) { state.dragging = false; container.classList.remove('dragging'); }
    }
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomBy(Math.exp(e.deltaY * 0.0012));
      state.lastUser = performance.now();
    }, { passive: false });
    el.addEventListener('dblclick', function () { applyView('orbit', true); onInteract('view', 'orbit'); });

    function zoomBy(f) { state.distT = clamp(state.distT * f, state.fit * 0.22, state.fit * 2.4); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ---------- Formaat en zichtbaarheid ---------- */
    function resize() {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const oldFit = state.fit;
      updateFit();
      if (oldFit) { const r = state.fit / oldFit; state.dist *= r; state.distT *= r; }
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container); else window.addEventListener('resize', resize);
    resize();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) { state.visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(container);
    }

    /* ---------- Render loop ---------- */
    let t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!state.visible || document.hidden) return;
      const t = (now - t0) / 1000;
      if (state.spin) { state.yawT = Math.sin(t * 0.45) * 0.85; state.pitchT = 0.12 + Math.sin(t * 0.3) * 0.06; }
      updateCamera();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    /* ---------- Studio ---------- */
    function setStudio(name) {
      const s = STUDIOS[name] || STUDIOS.studio;
      state.studio = name;
      wallMat.color.setHex(s.wall);
      floorMat.color.setHex(s.floor);
      skirting.material.color.setHex(name === 'donker' ? 0x1f1f22 : 0xf2f0ec);
      hemi.color.setHex(s.sky); hemi.groundColor.setHex(s.ground); hemi.intensity = s.hemiI;
      key.color.setHex(s.key); key.intensity = s.keyI;
      fill.intensity = s.fillI;
      renderer.toneMappingExposure = s.exposure;
      figure.material.color.setHex(s.figure);
    }
    setStudio('studio');

    return {
      setConfig: function (cfg) {
        state.cfg = { w: cfg.w, h: cfg.h, finish: cfg.finish, frame: cfg.frame || { type: 'none' } };
        rebuild();
      },
      setView: function (name) { applyView(name, true); },
      setStudio: setStudio,
      setScale: function (on) {
        figure.visible = !!on;
        if (on) {
          // uitzoomen zodat figuur (1,75 m) en werk samen in beeld staan
          const tanH = Math.tan(camera.fov * DEG / 2);
          const span = state.W + 130;
          state.distT = Math.max(state.fit * 1.25, span * 1.25 / (2 * tanH * (camera.aspect || 1.33)), 240 / (2 * tanH));
          state.txT = -state.W * 0.18; state.tyT = -45; state.pitchT = Math.min(state.pitchT, 0.08);
        } else { applyView(state.view, true); }
      },
      setSpin: function (on) { state.spin = !!on; if (on && state.view === 'front') { state.view = 'orbit'; onInteract('view', 'orbit'); } },
      reset: function () { applyView('orbit', true); },
      getView: function () { return state.view; },
      dims: function () { return dims(state.cfg); }
    };
  }

  /* ---------- Omgeving voor reflecties ---------- */
  function makeEnvironment(pmrem) {
    const s = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.28, 0.28, 0.29), side: THREE.BackSide }));
    room.scale.set(1200, 800, 1200);
    s.add(room);
    const panel = function (w, h, color, x, y, z, rx, ry) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    panel(520, 260, new THREE.Color(7, 7, 7), 0, 395, 120, Math.PI / 2, 0);               // softbox boven
    panel(220, 420, new THREE.Color(5.5, 5.8, 6.2), -595, 60, 240, 0, Math.PI / 2);      // raam links (koel)
    panel(160, 260, new THREE.Color(3.2, 2.6, 1.9), 595, 40, 320, 0, -Math.PI / 2);     // warm licht rechts
    panel(700, 300, new THREE.Color(1.6, 1.6, 1.6), 0, 60, 598, 0, Math.PI);            // lichte wand achter de kijker
    panel(1200, 1200, new THREE.Color(0.12, 0.11, 0.1), 0, -395, 0, -Math.PI / 2, 0);   // vloer donker
    const rt = pmrem.fromScene(s, 0.035);
    return rt.texture;
  }

  /* ---------- Schaalfiguur, 175 cm, plat silhouet ---------- */
  function makeFigure() {
    const mat = new THREE.MeshBasicMaterial({ color: 0x3a3733, transparent: true, opacity: 0.45, depthWrite: false });
    const g = new THREE.Group();
    const part = function (w, h, x, yBottom) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, yBottom + h / 2, 0);
      g.add(m);
    };
    part(11, 86, -7, 0);   part(11, 86, 7, 0);      // benen
    part(36, 64, 0, 86);                            // romp
    part(8, 58, -23, 90);  part(8, 58, 23, 90);     // armen
    part(8, 5, 0, 150);                             // hals
    g.add(new THREE.Mesh(new THREE.CircleGeometry(11, 32).translate(0, 166, 0), mat));
    g.material = mat;
    g.position.set(-120, -150, 6);
    return g;
  }

  window.ArtViewer = { create: create, dims: dims, SPEC: SPEC };
})();
