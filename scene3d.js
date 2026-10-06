import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ============================================================
   SCENE THEMES
   ============================================================ */
const SCENE_THEMES = {
    dark:   { bg: 0x05050b, fog: 0x05050b, accent: 0x6c5ce7, cable: 0x00cec9, grid: 0x2b2b4d, floor: 0x0a0a16, packet: 0xa29bfe, key: 0x99aaff },
    matrix: { bg: 0x020a05, fog: 0x020a05, accent: 0x00e676, cable: 0x00ff9d, grid: 0x0f3d24, floor: 0x04120a, packet: 0x69f0ae, key: 0x77ffbb },
    cyan:   { bg: 0x03090e, fog: 0x03090e, accent: 0x00cec9, cable: 0x84ffff, grid: 0x0e3a44, floor: 0x061319, packet: 0xa0fff8, key: 0x8dfff9 },
    red:    { bg: 0x0b0205, fog: 0x0b0205, accent: 0xff2d55, cable: 0xff8a00, grid: 0x3d0f1a, floor: 0x140409, packet: 0xff9db1, key: 0xff90a8 },
    gold:   { bg: 0x0a0703, fog: 0x0a0703, accent: 0xffb300, cable: 0xffe082, grid: 0x3d2f0a, floor: 0x151004, packet: 0xffecb3, key: 0xffdc80 }
};

const SITE_TO_SCENE = { cyber: 'dark', matrix: 'matrix', ocean: 'cyan', blood: 'red', gold: 'gold', ghost: 'dark' };

const STATUS = {
    online: { label: 'يعمل بشكل طبيعي', color: 0x00e676, css: '#00e676' },
    busy:   { label: 'حمل عمل مرتفع',    color: 0xffb300, css: '#ffb300' },
    warn:   { label: 'تحذير — يحتاج متابعة', color: 0xff2d55, css: '#ff2d55' },
    off:    { label: 'مغلق / صيانة',      color: 0x6c5ce7, css: '#6c5ce7' }
};

/* ============================================================
   DEVICE TOPOLOGY
   ============================================================ */
const DEVICES = [
    { id: 'rk1', name: 'RACK-01', sub: 'خوادم التطبيقات', kind: 'rack', pos: [-11.5, 0, -6.5], anchor: [-11.5, 2.5, -5.1], status: 'online',
      specs: [['النوع', 'Rack 42U'], ['المعالج', '2× Xeon 64C'], ['الذاكرة', '512 GB ECC'], ['الشبكة', '2× 25G'], ['IP', '10.0.1.11']],
      bars: { 'حمل المعالج': 58, 'الذاكرة': 46, 'التخزين': 34, 'الشبكة': 62 } },
    { id: 'rk2', name: 'RACK-02', sub: 'خوادم البوتات', kind: 'rack', pos: [-4, 0, -6.5], anchor: [-4, 2.5, -5.1], status: 'online',
      specs: [['النوع', 'Rack 42U'], ['المعالج', '2× EPYC 32C'], ['الذاكرة', '256 GB ECC'], ['الشبكة', '2× 10G'], ['IP', '10.0.1.12']],
      bars: { 'حمل المعالج': 41, 'الذاكرة': 55, 'التخزين': 28, 'الشبكة': 47 } },
    { id: 'rk3', name: 'RACK-03', sub: 'خوادم قواعد البيانات', kind: 'rack', pos: [4, 0, -6.5], anchor: [4, 2.5, -5.1], status: 'busy',
      specs: [['النوع', 'Rack 42U'], ['المعالج', '4× Xeon 48C'], ['الذاكرة', '1 TB ECC'], ['الشبكة', '4× 25G'], ['IP', '10.0.1.13']],
      bars: { 'حمل المعالج': 84, 'الذاكرة': 78, 'التخزين': 66, 'الشبكة': 91 } },
    { id: 'rk4', name: 'RACK-04', sub: 'خوادم النسخ الاحتياطي', kind: 'rack', pos: [11.5, 0, -6.5], anchor: [11.5, 2.5, -5.1], status: 'online',
      specs: [['النوع', 'Rack 42U'], ['المعالج', '1× Xeon 24C'], ['الذاكرة', '128 GB'], ['التخزين', '48 TB HDD'], ['IP', '10.0.1.14']],
      bars: { 'حمل المعالج': 22, 'الذاكرة': 31, 'التخزين': 57, 'الشبكة': 19 } },

    { id: 'sw1', name: 'SW-ACC-01', sub: 'سويتش وصول يسار', kind: 'switch', pos: [-7.5, 0, -1.5], anchor: [-7.5, 1, -0.4], status: 'online',
      specs: [['المنافذ', '48 × 1G + 4 × 10G'], ['القدرة', 'Throughput 176 Gbps'], ['VLAN', '12 فعّالة'], ['MTU', '9000 Jumbo'], ['IP', '10.0.2.11']],
      bars: { 'منافذ مشغولة': 64, 'دخول Gbps': 38, 'خروج Gbps': 35, 'الحصص': 12 } },
    { id: 'sw2', name: 'SW-ACC-02', sub: 'سويتش وصول يمين', kind: 'switch', pos: [7.5, 0, -1.5], anchor: [7.5, 1, -0.4], status: 'busy',
      specs: [['المنافذ', '48 × 1G + 4 × 10G'], ['القدرة', 'Throughput 176 Gbps'], ['VLAN', '9 فعّالة'], ['MTU', '9000 Jumbo'], ['IP', '10.0.2.12']],
      bars: { 'منافذ مشغولة': 79, 'دخول Gbps': 61, 'خروج Gbps': 58, 'الحصص': 27 } },

    { id: 'core', name: 'CORE-SW', sub: 'سويتش النواة', kind: 'core', pos: [0, 0, 1.5], anchor: [0, 1.2, 1.5], status: 'online',
      specs: [['المنافذ', '32 × 40G'], ['القدرة', '2.56 Tbps'], ['البروتوكول', 'VXLAN / EVPN'], ['التكرار', 'MDC مزدوج'], ['IP', '10.0.2.1']],
      bars: { 'حمل النواة': 47, 'تبديل Gbps': 88, 'جدولة': 33, 'الحصص': 18 } },

    { id: 'fw', name: 'FW-01', sub: 'جدار الحماية', kind: 'firewall', pos: [0, 0, 7.5], anchor: [0, 1.5, 7.5], status: 'online',
      specs: [['النوع', 'NGFW 10G'], ['السياسات', '248 قاعدة'], ['IPS', 'مفعّل'], ['المصادقة', 'IPSec + SSL'], ['IP', '10.0.3.1']],
      bars: { 'فلترة Mbps': 42, 'جلسات نشطة': 61, 'IPS مراقَب': 29, 'رموز SSL': 37 } },

    { id: 'rtr', name: 'RTR-01', sub: 'الراوتر الرئيسي', kind: 'router', pos: [0, 0, 12.5], anchor: [0, 1.5, 12.5], status: 'online',
      specs: [['البروتوكول', 'BGP AS64512'], ['المسارات', '842,190'], ['السعة', '40 Gbps'], ['المصادقة', 'RPKI + RTBH'], ['IP', '10.0.4.1']],
      bars: { 'استخدام السعة': 54, 'مسارات نشطة': 71, 'زمن التسليم': 23, 'حرق/إسقاط': 6 } },

    { id: 'c1', name: 'NODE-A', sub: 'عقدة عملاء', kind: 'client', pos: [-9, 0, 16.5], anchor: [-9, 0.9, 16.5], status: 'online',
      specs: [['النوع', 'Edge Client'], ['الاتصال', '1 Gbps'], ['زمن الاستجابة', '6 ms'], ['التشفير', 'TLS 1.3'], ['IP', '10.0.9.21']],
      bars: { 'الاستخدام': 36, 'التنزيل Mbps': 44, 'الرفع Mbps': 17, 'الحصص': 9 } },
    { id: 'c2', name: 'NODE-B', sub: 'عقدة عملاء', kind: 'client', pos: [9, 0, 16.5], anchor: [9, 0.9, 16.5], status: 'warn',
      specs: [['النوع', 'Edge Client'], ['الاتصال', '1 Gbps'], ['زمن الاستجابة', '48 ms'], ['التشفير', 'TLS 1.3'], ['IP', '10.0.9.22']],
      bars: { 'الاستخدام': 88, 'التنزيل Mbps': 79, 'الرفع Mbps': 63, 'الحصص': 74 } },

    { id: 'cloud', name: 'CLOUD-EDGE', sub: 'عقدة سحابية خارجية', kind: 'cloud', pos: [0, 7.5, 21], anchor: [0, 7.5, 21], status: 'online',
      specs: [['المزود', 'Global Edge'], ['المناطق', '14 منطقة'], ['Anycast', 'مفعّل'], ['الوصول', '120 Tbps'], ['DNS', 'Authoritative']],
      bars: { 'حافة Gbps': 49, 'إصابات الكاش': 87, 'مناطق نشطة': 64, 'التخزين TB': 38 } }
];

const LINKS = [
    ['rk1', 'sw1'], ['rk2', 'sw1'], ['rk3', 'sw2'], ['rk4', 'sw2'],
    ['sw1', 'core'], ['sw2', 'core'],
    ['core', 'fw'], ['fw', 'rtr'], ['rtr', 'cloud'],
    ['rtr', 'c1'], ['rtr', 'c2']
];

const KIND_LABEL = { rack: 'سيرفر', switch: 'سويتش وصول', core: 'سويتش نواة', firewall: 'جدار حماية', router: 'راوتر', client: 'عقدة', cloud: 'سحابة' };
const KIND_ICON = { rack: 'fas fa-server', switch: 'fas fa-network-wired', core: 'fas fa-sitemap', firewall: 'fas fa-shield-halved', router: 'fas fa-wifi', client: 'fas fa-laptop-code', cloud: 'fas fa-cloud' };

/* ============================================================
   SHARED STATE
   ============================================================ */
const roleMats = { body: [], accent: [], cable: [], packet: [], grid: [], floor: [], wire: [] };
let currentSceneTheme = 'dark';

function makeMat(role, params) {
    const m = new THREE.MeshStandardMaterial(params);
    if (roleMats[role]) roleMats[role].push(m);
    if (params.wireframe) { roleMats.wire.push(m); m.__baseWire = true; }
    return m;
}

function applySceneTheme(name) {
    const t = SCENE_THEMES[name] || SCENE_THEMES.dark;
    currentSceneTheme = name;
    roleMats.accent.forEach(m => { m.color.setHex(t.accent); if (m.emissive) m.emissive.setHex(t.accent); });
    roleMats.cable.forEach(m => { m.color.setHex(t.cable); if (m.emissive) m.emissive.setHex(t.cable); });
    roleMats.packet.forEach(m => { m.color.setHex(t.packet); if (m.emissive) m.emissive.setHex(t.packet); });
    roleMats.grid.forEach(m => m.color.setHex(t.grid));
    roleMats.floor.forEach(m => m.color.setHex(t.floor));
    window.__sceneThemeRef?.forEach(ref => {
        if (ref.type === 'bg') { ref.obj.setHex(t.bg); }
        if (ref.type === 'fog') { ref.obj.setHex(t.fog); }
        if (ref.type === 'key') { ref.obj.setHex(t.key); }
        if (ref.type === 'point') { ref.obj.setHex(t.accent); }
        if (ref.type === 'cable') { ref.obj.setHex(t.cable); }
    });
    window.dispatchEvent(new CustomEvent('scene-theme', { detail: { name, theme: t } }));
}

/* ============================================================
   HERO 3D SCENE
   ============================================================ */
function initHero() {
    const canvas = $('#hero-canvas');
    if (!canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
    camera.position.set(0, 0, 17);

    const root = new THREE.Group();
    scene.add(root);

    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#6c5ce7';
    let accent = new THREE.Color(cssVar('--primary') || '#6c5ce7');
    let light = new THREE.Color(cssVar('--primary-light') || '#a29bfe');

    const coreGeo = new THREE.IcosahedronGeometry(4.6, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.5 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(3.4, 0);
    const innerMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.07 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    root.add(inner);

    // node shell
    const NODE_COUNT = 90;
    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodePts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = 7 + Math.random() * 4.5;
        const v = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta) * 0.72,
            r * Math.cos(phi)
        );
        nodePos.set([v.x, v.y, v.z], i * 3);
        nodePts.push(v);
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const pointsMat = new THREE.PointsMaterial({ color: light, size: 0.22, transparent: true, opacity: 0.9, sizeAttenuation: true });
    root.add(new THREE.Points(pointsGeo, pointsMat));

    // links between near nodes
    const lineVerts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
            if (nodePts[i].distanceTo(nodePts[j]) < 3.6 && Math.random() < 0.55) {
                lineVerts.push(nodePts[i].x, nodePts[i].y, nodePts[i].z, nodePts[j].x, nodePts[j].y, nodePts[j].z);
            }
        }
    }
    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    const linesMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.22 });
    root.add(new THREE.LineSegments(linesGeo, linesMat));

    // orbiting "server" chips
    const chips = [];
    const chipGeo = new THREE.BoxGeometry(0.75, 0.75, 0.18);
    for (let i = 0; i < 7; i++) {
        const m = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 });
        const chip = new THREE.Mesh(chipGeo, m);
        chip.userData = { r: 6.4 + Math.random() * 3, a: (i / 7) * Math.PI * 2, s: 0.18 + Math.random() * 0.25, y: (Math.random() - 0.5) * 6 };
        root.add(chip);
        chips.push({ mesh: chip, mat: m });
    }

    // flowing packets on random links
    const linkPairs = [];
    for (let i = 0; i < lineVerts.length; i += 6) {
        linkPairs.push([new THREE.Vector3(lineVerts[i], lineVerts[i + 1], lineVerts[i + 2]),
                        new THREE.Vector3(lineVerts[i + 3], lineVerts[i + 4], lineVerts[i + 5])]);
    }
    const packets = [];
    const pktGeo = new THREE.SphereGeometry(0.14, 8, 8);
    for (let i = 0; i < 26; i++) {
        const pair = linkPairs[(Math.random() * linkPairs.length) | 0];
        if (!pair) break;
        const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const p = new THREE.Mesh(pktGeo, m);
        p.userData = { a: pair[0], b: pair[1], t: Math.random(), sp: 0.25 + Math.random() * 0.5 };
        root.add(p);
        packets.push({ mesh: p, mat: m });
    }

    function refreshColors() {
        accent = new THREE.Color(cssVar('--primary') || '#6c5ce7');
        light = new THREE.Color(cssVar('--primary-light') || '#a29bfe');
        coreMat.color.copy(accent);
        innerMat.color.copy(accent);
        linesMat.color.copy(accent);
        pointsMat.color.copy(light);
        chips.forEach(c => c.mat.color.copy(accent));
        packets.forEach(p => p.mat.color.copy(light));
    }
    window.addEventListener('lrn:themechange', refreshColors);

    const pointer = { x: 0, y: 0 };
    const hero = $('#home');
    if (hero) {
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
            pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        });
        hero.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
    }

    function resize() {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(canvas.parentElement || canvas);

    let visible = true;
    if (hero) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 }).observe(hero);

    return {
        render(dt, t) {
            if (!visible) return;
            root.rotation.y += dt * 0.08;
            root.rotation.x = lerp(root.rotation.x, pointer.y * 0.28, 0.05);
            root.rotation.z = lerp(root.rotation.z, -pointer.x * 0.12, 0.05);
            core.rotation.y -= dt * 0.22;
            core.rotation.x += dt * 0.14;
            inner.rotation.y += dt * 0.3;
            const pulse = 1 + Math.sin(t * 1.6) * 0.03;
            inner.scale.setScalar(pulse);
            chips.forEach(c => {
                const d = c.mesh.userData;
                d.a += dt * d.s;
                c.mesh.position.set(Math.cos(d.a) * d.r, d.y + Math.sin(t + d.a) * 0.6, Math.sin(d.a) * d.r);
                c.mesh.lookAt(0, c.mesh.position.y, 0);
            });
            packets.forEach(p => {
                const d = p.mesh.userData;
                d.t += dt * d.sp;
                if (d.t > 1) d.t = 0;
                p.mesh.position.lerpVectors(d.a, d.b, d.t);
            });
            camera.position.x = lerp(camera.position.x, pointer.x * 2.2, 0.04);
            camera.position.y = lerp(camera.position.y, -pointer.y * 1.6, 0.04);
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
        }
    };
}

/* ============================================================
   DATACENTER 3D SCENE
   ============================================================ */
function initDatacenter() {
    const canvas = $('#dc-canvas');
    const viewport = $('#dcViewport');
    if (!canvas || !viewport) return null;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (e) {
        $('#dcLoading').innerHTML = '<span>متصفحك لا يدعم WebGL — تعذّر عرض المشهد ثلاثي الأبعاد.</span>';
        return null;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const T0 = SCENE_THEMES.dark;
    scene.background = new THREE.Color(T0.bg);
    scene.fog = new THREE.Fog(T0.fog, 34, 78);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
    const CAM_HOME = new THREE.Vector3(0, 15, 30);
    const TARGET_HOME = new THREE.Vector3(0, 2.2, 3);
    camera.position.copy(CAM_HOME);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 8;
    controls.maxDistance = 70;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.target.copy(TARGET_HOME);

    // ---------- lights ----------
    const amb = new THREE.AmbientLight(0xffffff, 0.42);
    scene.add(amb);
    const hemi = new THREE.HemisphereLight(0xbfd0ff, 0x1a1030, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(T0.key, 2.1);
    key.position.set(14, 26, 16);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -30; key.shadow.camera.right = 30;
    key.shadow.camera.top = 30; key.shadow.camera.bottom = -30;
    key.shadow.camera.far = 80;
    key.shadow.bias = -0.0006;
    scene.add(key);
    const point = new THREE.PointLight(T0.accent, 260, 70, 2);
    point.position.set(0, 9, 4);
    scene.add(point);
    const rim = new THREE.PointLight(T0.cable, 140, 60, 2);
    rim.position.set(0, 6, -16);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 90, 55, 2);
    fill.position.set(0, 12, 22);
    scene.add(fill);

    window.__sceneThemeRef = [
        { type: 'bg', obj: scene.background },
        { type: 'fog', obj: scene.fog.color },
        { type: 'key', obj: key.color },
        { type: 'point', obj: point.color },
        { type: 'cable', obj: rim.color }
    ];

    // ---------- layers ----------
    const layers = {
        floor: new THREE.Group(),
        devices: new THREE.Group(),
        network: new THREE.Group(),
        data: new THREE.Group(),
        labels: new THREE.Group()
    };
    Object.values(layers).forEach(g => scene.add(g));
    const LAYER_EXplode = { floor: -3, devices: 0, network: 7, data: 14, labels: 21 };
    const layerBaseY = { floor: 0, devices: 0, network: 0, data: 0, labels: 0 };

    // ---------- floor ----------
    const floorMat = makeMat('floor', { color: T0.floor, metalness: 0.25, roughness: 0.72 });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    layers.floor.add(floorMesh);

    const gridMat = new THREE.LineBasicMaterial({ color: T0.grid, transparent: true, opacity: 0.5 });
    roleMats.grid.push(gridMat);
    const gv = [];
    const GS = 40, GD = 40;
    for (let i = 0; i <= GD; i++) {
        const p = -GS + (i * (GS * 2)) / GD;
        gv.push(-GS, 0, p, GS, 0, p, p, 0, -GS, p, 0, GS);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3));
    layers.floor.add(new THREE.LineSegments(gridGeo, gridMat));

    // glowing floor edge
    const edgeMat = makeMat('accent', { color: T0.accent, emissive: T0.accent, emissiveIntensity: 1.4, roughness: 0.4 });
    const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(GS * 2, GS * 2)),
        new THREE.LineBasicMaterial({ color: T0.accent })
    );
    roleMats.accent.push(edge.material);
    edge.position.y = 0.03;
    layers.floor.add(edge);

    // ---------- materials ----------
    const bodyMat = () => makeMat('body', { color: 0x26264a, metalness: 0.35, roughness: 0.42 });
    const darkMat = () => makeMat('body', { color: 0x14142a, metalness: 0.3, roughness: 0.62 });
    const accentMat = (int = 0.75) => makeMat('accent', { color: T0.accent, emissive: T0.accent, emissiveIntensity: int, metalness: 0.3, roughness: 0.3 });
    const ledMat = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.2, roughness: 0.4 });

    const ledBlinkers = [];
    const deviceRoots = {};
    const wireMeshes = [];

    function trackWire(mesh) { wireMeshes.push(mesh); return mesh; }

    function makeLabel(name, sub, y) {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 140;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 512, 140);
        ctx.textAlign = 'center';
        ctx.font = 'bold 52px Cairo, Tahoma, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(120,140,255,0.9)';
        ctx.shadowBlur = 20;
        ctx.fillText(name, 256, 58);
        ctx.shadowBlur = 6;
        ctx.font = '30px Cairo, Tahoma, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.fillText(sub, 256, 108);
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
        spr.scale.set(6.2, 1.7, 1);
        spr.position.set(0, y, 0);
        spr.renderOrder = 10;
        return spr;
    }

    /* ---- builders ---- */
    function buildRack(d) {
        const g = new THREE.Group();
        const W = 3, H = 4.6, D = 2.2;
        const shell = trackWire(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat()));
        shell.position.y = H / 2;
        shell.castShadow = true; shell.receiveShadow = true;
        g.add(shell);

        const inner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, H - 0.4, D - 0.4), darkMat());
        inner.position.y = H / 2;
        g.add(inner);

        const st = STATUS[d.status].color;
        for (let i = 0; i < 7; i++) {
            const u = trackWire(new THREE.Mesh(new THREE.BoxGeometry(W - 0.35, 0.44, 0.14), bodyMat()));
            u.position.set(0, 0.55 + i * 0.58, D / 2 + 0.06);
            g.add(u);
            const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 1.6, 0.07, 0.05), accentMat(1.1));
            bar.position.set(-0.35, 0.55 + i * 0.58, D / 2 + 0.15);
            g.add(bar);
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.06), ledMat(i % 3 === 0 ? st : 0x00e676));
            led.position.set(W / 2 - 0.35, 0.55 + i * 0.58, D / 2 + 0.15);
            g.add(led);
            ledBlinkers.push({ mesh: led, base: led.material.emissiveIntensity, speed: 2 + Math.random() * 5, phase: Math.random() * 9 });
        }
        // top accent strip
        const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.1, D + 0.1), accentMat(0.9));
        top.position.y = H;
        g.add(top);

        const feet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.16, D + 0.3), darkMat());
        feet.position.y = 0.08;
        g.add(feet);
        return g;
    }

    function buildSwitch(d, isCore) {
        const g = new THREE.Group();
        const W = isCore ? 6.4 : 4.6, H = 0.85, D = 2.6;
        const body = trackWire(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat()));
        body.position.y = H / 2 + 0.35;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        const base = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.35, D - 0.6), darkMat());
        base.position.y = 0.18;
        g.add(base);

        const st = STATUS[d.status].color;
        const ports = isCore ? 20 : 16;
        for (let i = 0; i < ports; i++) {
            const px = -W / 2 + 0.45 + (i * (W - 0.9)) / (ports - 1);
            const on = Math.random() < (d.status === 'busy' ? 0.8 : 0.55);
            const pm = new THREE.MeshStandardMaterial({
                color: on ? st : 0x1b1b30,
                emissive: on ? st : 0x000000,
                emissiveIntensity: on ? 2 : 0,
                roughness: 0.4
            });
            const port = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.06), pm);
            port.position.set(px, H / 2 + 0.3, D / 2 + 0.04);
            g.add(port);
            if (on) ledBlinkers.push({ mesh: port, base: 2, speed: 1.5 + Math.random() * 6, phase: Math.random() * 9 });
        }
        const strip = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.07, 0.05), accentMat(1.2));
        strip.position.set(0, H + 0.35, D / 2 + 0.05);
        g.add(strip);

        if (isCore) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 8, 48), accentMat(1.6));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = H + 0.55;
            g.add(ring);
            g.userData.spin = ring;
        }
        return g;
    }

    function buildFirewall(d) {
        const g = new THREE.Group();
        const W = 4.4, H = 2.4, D = 2.4;
        const body = trackWire(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat()));
        body.position.y = H / 2 + 0.2;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        const shield = trackWire(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.16, 6), accentMat(1.3)));
        shield.rotation.x = Math.PI / 2;
        shield.position.set(0, H / 2 + 0.3, D / 2 + 0.12);
        g.add(shield);

        const base = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.22, D - 0.5), darkMat());
        base.position.y = 0.11;
        g.add(base);

        for (let i = 0; i < 8; i++) {
            const st = i % 4 === 0 ? STATUS[d.status].color : 0x00e676;
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.05), ledMat(st));
            led.position.set(-1.6 + i * 0.45, 0.6, D / 2 + 0.12);
            g.add(led);
            ledBlinkers.push({ mesh: led, base: 2.2, speed: 2 + Math.random() * 7, phase: Math.random() * 9 });
        }
        return g;
    }

    function buildRouter(d) {
        const g = new THREE.Group();
        const W = 4.6, H = 1.4, D = 2.6;
        const body = trackWire(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat()));
        body.position.y = H / 2 + 0.35;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        const base = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.36, D - 0.6), darkMat());
        base.position.y = 0.18;
        g.add(base);

        [-1.7, 1.7].forEach(x => {
            const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 8), darkMat());
            ant.position.set(x, H + 1.1, -0.6);
            ant.rotation.z = x < 0 ? 0.22 : -0.22;
            g.add(ant);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), accentMat(1.8));
            tip.position.set(x + (x < 0 ? -0.18 : 0.18), H + 1.95, -0.6);
            g.add(tip);
            ledBlinkers.push({ mesh: tip, base: 1.8, speed: 3, phase: Math.random() * 9 });
        });

        for (let i = 0; i < 6; i++) {
            const pm = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 2, roughness: 0.4 });
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.05), pm);
            led.position.set(-1.4 + i * 0.55, 0.75, D / 2 + 0.12);
            g.add(led);
            ledBlinkers.push({ mesh: led, base: 2, speed: 1.5 + Math.random() * 6, phase: Math.random() * 9 });
        }
        return g;
    }

    function buildClient(d) {
        const g = new THREE.Group();
        const body = trackWire(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), bodyMat()));
        body.position.y = 0.55;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.1), accentMat(1.4));
        top.position.y = 1.15;
        g.add(top);
        const st = STATUS[d.status].color;
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.06), ledMat(st));
        led.position.set(0, 0.75, 0.78);
        g.add(led);
        ledBlinkers.push({ mesh: led, base: 2.2, speed: 4, phase: Math.random() * 9 });
        return g;
    }

    function buildCloud(d) {
        const g = new THREE.Group();
        const grp = new THREE.Group();
        const wire = trackWire(new THREE.Mesh(
            new THREE.IcosahedronGeometry(2.3, 1),
            makeMat('body', { color: 0x15152a, metalness: 0.7, roughness: 0.3, wireframe: true })
        ));
        grp.add(wire);
        const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), accentMat(0.55));
        glow.material.transparent = true;
        glow.material.opacity = 0.35;
        grp.add(glow);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(3, 0.05, 8, 64), accentMat(1.5));
        halo.rotation.x = Math.PI / 2.3;
        grp.add(halo);
        g.add(grp);
        g.userData.spin = grp;
        g.userData.float = true;
        return g;
    }

    const BUILDERS = { rack: buildRack, switch: d => buildSwitch(d, false), core: d => buildSwitch(d, true), firewall: buildFirewall, router: buildRouter, client: buildClient, cloud: buildCloud };

    const roots = [];
    DEVICES.forEach(d => {
        const root = BUILDERS[d.kind](d);
        root.position.set(d.pos[0], d.pos[1], d.pos[2]);
        root.userData.device = d;
        root.userData.baseScale = 1;
        layers.devices.add(root);
        deviceRoots[d.id] = root;
        roots.push(root);

        const label = makeLabel(d.name, d.sub, d.kind === 'cloud' ? 3.6 : (d.kind === 'rack' ? 5.6 : 3));
        label.position.x = d.pos[0];
        label.position.z = d.pos[2];
        label.position.y = d.pos[1] + (d.kind === 'cloud' ? 3.6 : (d.kind === 'rack' ? 5.6 : 3));
        layers.labels.add(label);

        if (d.kind !== 'cloud') {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(2.1, 2.45, 48),
                new THREE.MeshBasicMaterial({ color: T0.accent, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(0, 0.06, 0);
            ring.visible = false;
            roleMats.accent.push(ring.material);
            root.add(ring);
            root.userData.ring = ring;
        }
    });

    /* ---- cables + packets ---- */
    const byId = Object.fromEntries(DEVICES.map(d => [d.id, d]));
    const curves = [];
    const cableMat = makeMat('cable', { color: T0.cable, emissive: T0.cable, emissiveIntensity: 0.45, roughness: 0.5, metalness: 0.2 });

    LINKS.forEach(([a, b]) => {
        const A = new THREE.Vector3(...byId[a].anchor);
        const B = new THREE.Vector3(...byId[b].anchor);
        const dist = A.distanceTo(B);
        const m1 = A.clone().lerp(B, 0.34); m1.y += 1.1 + dist * 0.06;
        const m2 = A.clone().lerp(B, 0.68); m2.y += 0.9 + dist * 0.05;
        const curve = new THREE.CatmullRomCurve3([A, m1, m2, B]);
        curves.push(curve);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.075, 7, false), cableMat);
        tube.castShadow = false;
        layers.network.add(tube);

        // connector blocks
        [A, B].forEach(p => {
            const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), cableMat);
            c.position.copy(p);
            layers.network.add(c);
        });
    });

    const packetMeshes = [];
    const pGeo = new THREE.OctahedronGeometry(0.2, 0);
    curves.forEach((curve, ci) => {
        const n = 2 + (ci % 2);
        for (let i = 0; i < n; i++) {
            const m = new THREE.MeshBasicMaterial({ color: SCENE_THEMES.dark.packet });
            roleMats.packet.push(m);
            const p = new THREE.Mesh(pGeo, m);
            p.userData = { curve, t: Math.random(), sp: 0.14 + Math.random() * 0.22 };
            layers.data.add(p);
            packetMeshes.push(p);
        }
    });

    // ambient data motes
    const moteCount = 260;
    const motePos = new Float32Array(moteCount * 3);
    const moteSpeed = new Float32Array(moteCount);
    for (let i = 0; i < moteCount; i++) {
        motePos[i * 3] = (Math.random() - 0.5) * 62;
        motePos[i * 3 + 1] = Math.random() * 22;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 62;
        moteSpeed[i] = 0.4 + Math.random() * 1.4;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({ color: SCENE_THEMES.dark.packet, size: 0.14, transparent: true, opacity: 0.75 });
    roleMats.packet.push(moteMat);
    const motes = new THREE.Points(moteGeo, moteMat);
    layers.data.add(motes);

    // vertical light beams on racks (data layer)
    DEVICES.filter(d => d.kind === 'rack').forEach(d => {
        const bm = new THREE.MeshBasicMaterial({ color: T0.accent, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
        roleMats.accent.push(bm);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 16, 16, 1, true), bm);
        beam.position.set(d.pos[0], 8, d.pos[2]);
        layers.data.add(beam);
    });

    applySceneTheme('dark');

    /* ---------- interaction ---------- */
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10, -10);
    const tooltip = $('#dcTooltip');
    const infoEl = $('#dcInfo');
    let hovered = null;
    let selected = null;
    let pointerPx = { x: 0, y: 0 };

    canvas.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        pointerPx = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    canvas.addEventListener('pointerleave', () => { pointerNDC.set(-10, -10); setHover(null); });

    function findDeviceRoot(obj) {
        let o = obj;
        while (o) {
            if (o.userData && o.userData.device) return o;
            o = o.parent;
        }
        return null;
    }

    function setHover(root) {
        if (hovered === root) return;
        if (hovered) hovered.userData.hovered = false;
        hovered = root;
        if (hovered) {
            hovered.userData.hovered = true;
            const d = hovered.userData.device;
            tooltip.innerHTML = `${d.name} <small>${d.sub} • ${KIND_LABEL[d.kind]}</small>`;
            tooltip.classList.add('show');
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.classList.remove('show');
            canvas.style.cursor = 'grab';
        }
    }

    canvas.addEventListener('click', () => {
        if (hovered) selectDevice(hovered.userData.device.id);
        else deselect();
    });

    /* ---------- camera tween ---------- */
    const tween = { active: false, t: 0, dur: 1, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTgt: new THREE.Vector3(), toTgt: new THREE.Vector3() };
    function tweenCam(pos, tgt, dur = 1.05) {
        tween.active = true; tween.t = 0; tween.dur = dur;
        tween.fromPos.copy(camera.position); tween.toPos.copy(pos);
        tween.fromTgt.copy(controls.target); tween.toTgt.copy(tgt);
    }

    function focusDevice(d) {
        const root = deviceRoots[d.id];
        const box = new THREE.Box3().setFromObject(root);
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()).length();
        const dist = clamp(size * 2.1, 9, 26);
        const dir = new THREE.Vector3(0.4, 0.42, 1).normalize();
        tweenCam(c.clone().add(dir.multiplyScalar(dist)), c);
    }

    function deselect() {
        if (selected && selected.userData.ring) selected.userData.ring.visible = false;
        selected = null;
        infoEl.classList.remove('open');
        $$('.rack-node').forEach(n => n.classList.remove('active'));
    }

    function selectDevice(id) {
        const d = DEVICES.find(x => x.id === id);
        const root = deviceRoots[id];
        if (!d || !root) return;
        if (selected && selected.userData.ring) selected.userData.ring.visible = false;
        selected = root;
        if (root.userData.ring) root.userData.ring.visible = true;

        $('#dcInfoIcon').innerHTML = `<i class="${KIND_ICON[d.kind]}"></i>`;
        $('#dcInfoName').textContent = d.name;
        $('#dcInfoType').textContent = `${d.sub} • ${KIND_LABEL[d.kind]}`;
        const st = STATUS[d.status];
        const stEl = $('#dcInfoStatus');
        stEl.innerHTML = `<span class="dot" style="background:${st.css};box-shadow:0 0 8px ${st.css}"></span> ${st.label}`;
        stEl.style.color = st.css;

        $('#dcInfoSpecs').innerHTML = d.specs.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
        $('#dcInfoBars').innerHTML = Object.entries(d.bars).map(([k, v]) => `
            <div class="bar-row" data-key="${k}">
                <div class="bar-top"><span>${k}</span><b>${v}%</b></div>
                <div class="bar-track"><div class="bar-fill" style="width:${v}%"></div></div>
            </div>`).join('');
        $('#dcInfoLinks').innerHTML = `
            <a href="#pricing"><i class="fas fa-tags"></i> الأسعار</a>
            <a href="#services"><i class="fas fa-cubes"></i> الخدمات</a>
            <a href="https://discord.gg/lrn" target="_blank"><i class="fab fa-discord"></i> اطلب خدمة</a>`;

        infoEl.classList.add('open');
        focusDevice(d);
        setAutoRotate(false);
        $$('.rack-node').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    }

    $('#dcInfoClose')?.addEventListener('click', deselect);

    /* ---------- controls UI ---------- */
    function setAutoRotate(on) {
        controls.autoRotate = on;
        $('#btnAutoRotate')?.classList.toggle('active', on);
    }

    $$('.dc-chip[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const on = !btn.classList.contains('active');
            btn.classList.toggle('active', on);
            const g = layers[btn.dataset.layer];
            if (g) g.visible = on;
        });
    });

    $$('.dc-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.dc-swatch').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applySceneTheme(btn.dataset.scene);
        });
    });

    $('#btnAutoRotate')?.addEventListener('click', () => setAutoRotate(!controls.autoRotate));

    let explodeOn = false, explodeVal = 0;
    $('#btnExplode')?.addEventListener('click', e => {
        explodeOn = !explodeOn;
        e.currentTarget.classList.toggle('active', explodeOn);
    });

    let wireOn = false;
    $('#btnWireframe')?.addEventListener('click', e => {
        wireOn = !wireOn;
        e.currentTarget.classList.toggle('active', wireOn);
        [...roleMats.body, ...roleMats.accent, ...roleMats.cable, floorMat].forEach(m => {
            if (m.__baseWire) return;
            if ('wireframe' in m) m.wireframe = wireOn;
        });
    });

    $('#btnResetCam')?.addEventListener('click', () => {
        deselect();
        setAutoRotate(true);
        tweenCam(CAM_HOME.clone(), TARGET_HOME.clone());
    });

    /* ---------- rack strip ---------- */
    const strip = $('#dcRackStrip');
    if (strip) {
        strip.innerHTML = DEVICES.map(d => `
            <button class="rack-node" data-id="${d.id}">
                <span class="rn-state" style="--st:${STATUS[d.status].css}"></span>
                <span class="rn-icon"><i class="${KIND_ICON[d.kind]}"></i></span>
                <span class="rn-text"><b>${d.name}</b><small>${d.sub}</small></span>
            </button>`).join('');
        strip.addEventListener('click', e => {
            const btn = e.target.closest('.rack-node');
            if (btn) selectDevice(btn.dataset.id);
        });
    }

    /* ---------- HUD ---------- */
    $('#hudNodes').textContent = DEVICES.length;
    let traffic = 34;
    setInterval(() => {
        traffic = clamp(traffic + (Math.random() - 0.5) * 9, 12, 96);
        $('#hudTraffic').textContent = traffic.toFixed(1);
        $('#hudUptime').textContent = (99.9 + Math.random() * 0.09).toFixed(2);
    }, 1600);
    $('#hudTraffic').textContent = traffic.toFixed(1);

    setInterval(() => {
        if (!infoEl.classList.contains('open')) return;
        $$('#dcInfoBars .bar-row').forEach(row => {
            const cur = parseInt(row.querySelector('.bar-top b').textContent, 10) || 50;
            const next = clamp(cur + Math.round((Math.random() - 0.5) * 14), 5, 97);
            row.querySelector('.bar-top b').textContent = next + '%';
            row.querySelector('.bar-fill').style.width = next + '%';
        });
    }, 1800);

    /* ---------- resize ---------- */
    function resize() {
        const w = viewport.clientWidth, h = viewport.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(viewport);

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.02 }).observe(viewport);

    // hide loader
    setTimeout(() => $('#dcLoading')?.classList.add('hide'), 700);

    /* ---------- render ---------- */
    let frames = 0, fpsT = 0;
    return {
        render(dt, t) {
            if (!visible) return;

            // fps
            frames++; fpsT += dt;
            if (fpsT >= 0.5) {
                const el = $('#hudFps');
                if (el) el.textContent = Math.round(frames / fpsT);
                frames = 0; fpsT = 0;
            }

            // camera tween
            if (tween.active) {
                tween.t = Math.min(1, tween.t + dt / tween.dur);
                const k = easeInOut(tween.t);
                camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
                controls.target.lerpVectors(tween.fromTgt, tween.toTgt, k);
                if (tween.t >= 1) tween.active = false;
            }

            // explode
            explodeVal = lerp(explodeVal, explodeOn ? 1 : 0, Math.min(1, dt * 4));
            Object.keys(layers).forEach(k => {
                layers[k].position.y = layerBaseY[k] + explodeVal * LAYER_EXplode[k];
            });

            // blink LEDs
            ledBlinkers.forEach(l => {
                const v = 0.55 + Math.abs(Math.sin(t * l.speed + l.phase)) * l.base;
                l.mesh.material.emissiveIntensity = v;
            });

            // hover scale
            roots.forEach(r => {
                const target = r.userData.hovered ? 1.05 : 1;
                const s = lerp(r.scale.x, target, Math.min(1, dt * 8));
                r.scale.setScalar(s);
            });

            // spinners & floats
            roots.forEach(r => {
                if (r.userData.spin) r.userData.spin.rotation.y += dt * 0.6;
                if (r.userData.float) r.position.y = r.userData.device.pos[1] + Math.sin(t * 0.9) * 0.5;
            });

            // packets
            packetMeshes.forEach(p => {
                const d = p.userData;
                d.t = (d.t + dt * d.sp) % 1;
                if (!(d.t >= 0)) d.t = 0;
                p.position.copy(d.curve.getPointAt(d.t));
                p.rotation.x += dt * 3;
                p.rotation.y += dt * 2.4;
            });

            // motes
            const mp = moteGeo.attributes.position.array;
            for (let i = 0; i < moteCount; i++) {
                mp[i * 3 + 1] += dt * moteSpeed[i];
                if (mp[i * 3 + 1] > 22) mp[i * 3 + 1] = 0;
            }
            moteGeo.attributes.position.needsUpdate = true;

            // raycast
            raycaster.setFromCamera(pointerNDC, camera);
            const hits = raycaster.intersectObjects(layers.devices.children, true);
            setHover(hits.length ? findDeviceRoot(hits[0].object) : null);

            if (hovered && tooltip.classList.contains('show')) {
                tooltip.style.left = pointerPx.x + 'px';
                tooltip.style.top = pointerPx.y + 'px';
            }

            controls.update();
            renderer.render(scene, camera);
        }
    };
}

/* ============================================================
   BOOT
   ============================================================ */
const heroScene = initHero();
const dcScene = initDatacenter();

if (!dcScene) {
    const l = $('#dcLoading');
    if (l) l.innerHTML = '<span>تعذّر تحميل المشهد ثلاثي الأبعاد — تأكد من اتصال الإنترنت (Three.js من CDN).</span>';
}

let last = performance.now();
function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    const t = now / 1000;
    heroScene?.render(dt, t);
    dcScene?.render(dt, t);
}
requestAnimationFrame(loop);

// keep scene theme synced with site theme
window.addEventListener('lrn:themechange', e => {
    const target = SITE_TO_SCENE[e.detail.theme] || 'dark';
    if (target !== currentSceneTheme) {
        applySceneTheme(target);
        $$('.dc-swatch').forEach(b => b.classList.toggle('active', b.dataset.scene === target));
    }
});

// initial sync from stored theme
try {
    const stored = localStorage.getItem('lrn-theme') || 'cyber';
    const target = SITE_TO_SCENE[stored] || 'dark';
    if (target !== 'dark') {
        applySceneTheme(target);
        $$('.dc-swatch').forEach(b => b.classList.toggle('active', b.dataset.scene === target));
    }
} catch (e) { /* ignore */ }
