import * as THREE from 'three';

const wrap = document.querySelector('.bg3d');
const canvas = document.getElementById('bg3d-canvas');
if (wrap && canvas) start();

function start() {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
        wrap.style.display = 'none';
        return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor(0x05050b, 1);

    const scene = new THREE.Scene();
    const bgc = new THREE.Color(0x05050b);
    scene.background = bgc;
    scene.fog = new THREE.Fog(bgc, 28, 105);

    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 280);
    camera.position.set(0, 5.5, 20);

    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const P = {
        bg: new THREE.Color(css('--bg-dark') || '#0a0a14'),
        accent: new THREE.Color(css('--primary') || '#6c5ce7'),
        light: new THREE.Color(css('--primary-light') || '#a29bfe'),
        sec: new THREE.Color(css('--secondary') || '#00cec9')
    };

    /* ---- lights ---- */
    const amb = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(amb);
    const hemi = new THREE.HemisphereLight(0xbfd0ff, 0x0a0a14, 0.5);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(12, 24, 10);
    scene.add(dir);
    const p1 = new THREE.PointLight(P.accent.getHex(), 300, 90, 2);
    p1.position.set(0, 9, 0);
    scene.add(p1);
    const p2 = new THREE.PointLight(P.sec.getHex(), 260, 110, 2);
    p2.position.set(0, 10, -70);
    scene.add(p2);

    /* ---- shared materials ---- */
    const metal = new THREE.MeshStandardMaterial({ color: 0x191933, metalness: 0.72, roughness: 0.38 });
    const darkmetal = new THREE.MeshStandardMaterial({ color: 0x0f0f22, metalness: 0.5, roughness: 0.55 });
    const accent = new THREE.MeshStandardMaterial({ color: P.accent, emissive: P.accent, emissiveIntensity: 0.95, metalness: 0.25, roughness: 0.3 });
    const cable = new THREE.MeshStandardMaterial({ color: P.sec, emissive: P.sec, emissiveIntensity: 0.5, roughness: 0.45, metalness: 0.2 });
    const packet = new THREE.MeshBasicMaterial({ color: P.light });
    const gridMat = new THREE.LineBasicMaterial({ color: P.accent, transparent: true, opacity: 0.16 });
    const glowMat = new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const ledMats = [];
    for (let i = 0; i < 7; i++) {
        ledMats.push(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0x00e676), emissiveIntensity: 1.4, roughness: 0.35 }));
    }
    ledMats[4].emissive.setHex(P.accent.getHex());
    ledMats[5].emissive.setHex(P.sec.getHex());

    /* ---- floor grid ---- */
    const gv = [];
    for (let gx = -40; gx <= 40; gx += 5) { gv.push(gx, 0, -115, gx, 0, 25); }
    for (let gz = -115; gz <= 25; gz += 5) { gv.push(-40, 0, gz, 40, 0, gz); }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3));
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x070715, metalness: 0.35, roughness: 0.75 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.03, -45);
    scene.add(floor);

    /* ---- corridor of rack silhouettes ---- */
    const rackShell = new THREE.BoxGeometry(4, 8.5, 3);
    const rackUnit = new THREE.BoxGeometry(3.5, 0.7, 0.12);
    const ledGeo = new THREE.BoxGeometry(0.22, 0.22, 0.08);

    function buildRack() {
        const g = new THREE.Group();
        const shell = new THREE.Mesh(rackShell, metal);
        shell.position.y = 4.25;
        shell.castShadow = true;
        g.add(shell);
        for (let k = 0; k < 6; k++) {
            const u = new THREE.Mesh(rackUnit, darkmetal);
            u.position.set(0, 1.3 + k * 1.15, 1.56);
            g.add(u);
            const led = new THREE.Mesh(ledGeo, ledMats[(k + 1) % ledMats.length]);
            led.position.set(1.35, 1.3 + k * 1.15, 1.64);
            g.add(led);
        }
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.12, 3.1), accent);
        stripe.position.y = 8.6;
        g.add(stripe);
        return g;
    }

    const rackProto = buildRack();
    const racks = [];
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 9; i++) {
            const r = rackProto.clone();
            r.position.set(side * 17, 0, 8 - i * 10.8);
            r.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            scene.add(r);
            racks.push(r);
        }
    }

    /* ---- floating switches ---- */
    const swGeo = new THREE.BoxGeometry(5.4, 1.3, 2.9);
    const portGeo = new THREE.BoxGeometry(0.16, 0.18, 0.05);

    function buildSwitch() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(swGeo, metal);
        body.castShadow = true;
        g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.09, 2.7), accent);
        top.position.y = 0.66;
        g.add(top);
        for (let k = 0; k < 4; k++) {
            const led = new THREE.Mesh(ledGeo, ledMats[(k + 2) % ledMats.length]);
            led.position.set(-1.5 + k, 0.7, 1.48);
            g.add(led);
        }
        for (let k = 0; k < 10; k++) {
            const p = new THREE.Mesh(portGeo, ledMats[k % ledMats.length]);
            p.position.set(-2.3 + k * 0.5, 0.45, 1.52);
            g.add(p);
        }
        return g;
    }

    const swProto = buildSwitch();
    const switches = [];
    for (let i = 0; i < 16; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const s = swProto.clone();
        s.position.set(side * (6 + (i % 4) * 2.6), 3.2 + ((i * 13) % 5) * 1.4, 6 - Math.floor(i / 2) * 7.5);
        s.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        s.rotation.z = ((i % 5) - 2) * 0.06;
        s.rotation.x = ((i % 3) - 1) * 0.05;
        scene.add(s);
        switches.push(s);
    }

    /* ---- cables across the corridor ---- */
    const pktGeo = new THREE.OctahedronGeometry(0.16, 0);
    const curves = [];
    const packetMovers = [];
    for (let i = 0; i < 10; i++) {
        const z = 6 - i * 6.5;
        const A = new THREE.Vector3(-17, 8.6, z);
        const B = new THREE.Vector3(17, 8.6, z - 2 - (i % 3) * 2);
        const m = A.clone().lerp(B, 0.5);
        m.y = 14 + (i % 4) * 2.4;
        const curve = new THREE.CatmullRomCurve3([A, A.clone().lerp(B, .28).setY(m.y - 1.6), m, B.clone().lerp(A, .28).setY(m.y - 1.4), B]);
        curves.push(curve);
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.05, 6, false), cable));
        for (let k = 0; k < 3; k++) {
            const pm = new THREE.Mesh(pktGeo, packet);
            pm.userData = { curve, t: Math.random(), sp: 0.09 + Math.random() * 0.12 };
            scene.add(pm);
            packetMovers.push(pm);
        }
    }

    /* ---- central resource stream ---- */
    const strGeo = new THREE.OctahedronGeometry(0.12, 0);
    const stream = [];
    for (let i = 0; i < 80; i++) {
        const sm = new THREE.Mesh(strGeo, packet);
        sm.userData = { t: Math.random() * 130, sp: 3 + Math.random() * 6, x: (Math.random() - 0.5) * 9, y: 4 + Math.random() * 14 };
        scene.add(sm);
        stream.push(sm);
    }

    /* ---- data motes ---- */
    const M = 320;
    const mPos = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
        mPos[i * 3] = (Math.random() - 0.5) * 90;
        mPos[i * 3 + 1] = Math.random() * 30;
        mPos[i * 3 + 2] = 25 - Math.random() * 130;
    }
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    const moteMat = new THREE.PointsMaterial({ color: P.light, size: 0.09, transparent: true, opacity: 0.8 });
    const motes = new THREE.Points(mGeo, moteMat);
    scene.add(motes);

    /* ---- focal ring at the far end ---- */
    const ring = new THREE.Mesh(new THREE.TorusGeometry(11, 0.16, 8, 90), accent);
    ring.position.set(0, 14, -78);
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);
    const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(16, 2), glowMat);
    halo.position.set(0, 14, -80);
    scene.add(halo);

    /* ---- theme refresh ---- */
    const themeRefs = [p1.color, p2.color, gridMat.color, packet.color, accent.color, accent.emissive, cable.color, cable.emissive, glowMat.color, moteMat.color];

    function refreshTheme() {
        P.bg.set(css('--bg-dark') || '#0a0a14');
        P.accent.set(css('--primary') || '#6c5ce7');
        P.light.set(css('--primary-light') || '#a29bfe');
        P.sec.set(css('--secondary') || '#00cec9');
        bgc.copy(P.bg).lerp(P.accent, 0.10);
        [gridMat.color, glowMat.color].forEach(c => c.copy(P.accent));
        p1.color.copy(P.accent);
        p2.color.copy(P.sec);
        cable.color.copy(P.sec); cable.emissive.copy(P.sec);
        accent.color.copy(P.accent); accent.emissive.copy(P.accent);
        packet.color.copy(P.light);
        moteMat.color.copy(P.light);
        ledMats[4].emissive.copy(P.accent);
        ledMats[5].emissive.copy(P.sec);
    }
    window.addEventListener('lrn:themechange', refreshTheme);

    /* ---- interaction (scroll + mouse) ---- */
    let scrollProg = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function updateProg() { const max = document.documentElement.scrollHeight - innerHeight; scrollProg = max > 0 ? scrollY / max : 0; }
    addEventListener('scroll', updateProg, { passive: true });
    addEventListener('pointermove', e => {
        mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    addEventListener('resize', () => {
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }, { passive: true });
    renderer.setSize(innerWidth, innerHeight, false);
    updateProg();
    refreshTheme();

    /* ---- loop ---- */
    const clock = new THREE.Clock();
    let lastLed = 0;
    const lerp = (a, b, t) => a + (b - a) * t;

    (function loop() {
        requestAnimationFrame(loop);
        if (document.hidden) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        mouse.x = lerp(mouse.x, mouse.tx, 0.04);
        mouse.y = lerp(mouse.y, mouse.ty, 0.04);

        const tz = 24 - scrollProg * 96;
        camera.position.x = lerp(camera.position.x, mouse.x * 7 + Math.sin(t * 0.14) * 1.6, 0.05);
        camera.position.y = lerp(camera.position.y, 5.5 - scrollProg * 2.2 + mouse.y * 2.2, 0.05);
        camera.position.z = lerp(camera.position.z, tz, 0.055);
        camera.lookAt(mouse.x * 3, 5.5 + mouse.y, camera.position.z - 32);

        lastLed += dt;
        const ph = lastLed;
        ledMats.forEach((m, i) => {
            m.emissiveIntensity = 1.1 + Math.abs(Math.sin(ph * (1.2 + i * 0.35) + i)) * 1.1;
        });

        packetMovers.forEach(pm => {
            const d = pm.userData;
            d.t = (d.t + dt * d.sp) % 1;
            const pos = d.curve.getPoint(Math.max(0, Math.min(1, d.t)));
            pm.position.copy(pos);
            pm.position.y += Math.sin(t * 2 + d.t * 20) * 0.6;
        });

        stream.forEach(sm => {
            const d = sm.userData;
            d.t -= dt * d.sp;
            if (d.t < -10) d.t = 125;
            sm.position.set(d.x + Math.sin(t * 0.8 + d.t) * 1.5, d.y + Math.sin(t * 1.3 + d.t * 0.5) * 1.6, 25 - d.t * 0.9);
            sm.rotation.x += dt * 2.5;
            sm.rotation.y += dt * 3;
        });

        const mp = mGeo.attributes.position.array;
        for (let i = 0; i < M; i++) {
            mp[i * 3 + 1] += dt * (0.3 + (i % 7) * 0.12);
            if (mp[i * 3 + 1] > 30) mp[i * 3 + 1] = 0;
        }
        mGeo.attributes.position.needsUpdate = true;

        ring.rotation.z += dt * 0.18;
        ring.rotation.y += dt * 0.06;

        renderer.render(scene, camera);
    })();
}