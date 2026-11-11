(() => {
    'use strict';

    const object = document.getElementById('model-two-object');
    const illustration = document.getElementById('model-two-illustration');
    const wrapper = object?.closest('.character-wrapper');
    const openButton = document.getElementById('model-two-settings-button');
    if (!object || !illustration || !wrapper || !openButton) return;

    const storageKey = 'van-thien-luc-character-model-2';
    const defaults = {
        displayMode: 'vector', expression: 'kuudere', theme: 'ice', windSpeed: 100, clothWave: 100,
        breathAmp: 100, flameScale: 100, particleCount: 18, eyeOpen: 100,
        zoom: 100, mouseLook: true, foreheadMark: false, blush: true, magicCircle: true,
        hiddenLayers: []
    };
    const layers = [
        ['layer-head-group', 'Khuôn mặt và mắt'],
        ['layer-hand-upper', 'Tay bắt kiếm quyết'],
        ['layer-spirit-flame', 'Linh hỏa'],
        ['layer-hand-lower', 'Tay nâng linh hỏa'],
        ['layer-skirt-legs', 'Váy và chân tọa thiền'],
        ['layer-torso-robe', 'Thân áo'],
        ['layer-sleeves-wide', 'Tay áo rộng'],
        ['layer-celestial-ribbons', 'Dải lụa tiên'],
        ['layer-hair-back', 'Tóc sau'],
        ['layer-head-ribbons', 'Lụa cột tóc'],
        ['layer-ice-crystals', 'Tinh thể băng'],
        ['layer-aura', 'Hào quang']
    ];
    const expressions = [
        ['kuudere', '❄️ Lạnh lùng'], ['smile', '🌸 Dịu dàng'],
        ['shy', '😳 Ngại ngùng'], ['meditate', '🧘 Nhắm mắt'],
        ['awakened', '⚡ Thức tỉnh']
    ];
    const themes = [
        ['ice', 'Băng'], ['sakura', 'Đào hoa'],
        ['jade', 'Thanh ngọc'], ['violet', 'Lôi']
    ];
    const sliders = [
        ['windSpeed', 'Gió linh khí', 0, 300, 'x'],
        ['clothWave', 'Độ mềm tóc và lụa', 0, 250, '%'],
        ['breathAmp', 'Nhịp thở', 0, 250, '%'],
        ['flameScale', 'Cường độ linh hỏa', 0, 220, '%'],
        ['particleCount', 'Hạt băng tinh', 10, 60, ' hạt'],
        ['eyeOpen', 'Độ mở mắt', 20, 135, '%'],
        ['zoom', 'Kích thước model', 55, 175, '%']
    ];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (_) { /* Storage is optional. */ }
    const prefs = { ...defaults, ...saved };
    if (!['illustration', 'vector'].includes(prefs.displayMode)) prefs.displayMode = defaults.displayMode;
    if (!expressions.some(([key]) => key === prefs.expression)) prefs.expression = defaults.expression;
    if (!themes.some(([key]) => key === prefs.theme)) prefs.theme = defaults.theme;
    sliders.forEach(([key, , min, max]) => { prefs[key] = Math.max(min, Math.min(max, Number(prefs[key]) || min)); });
    ['mouseLook', 'foreheadMark', 'blush', 'magicCircle'].forEach(key => { prefs[key] = Boolean(prefs[key]); });
    prefs.hiddenLayers = Array.isArray(prefs.hiddenLayers) ? prefs.hiddenLayers.filter(id => layers.some(([key]) => key === id)) : [];
    const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch (_) { /* Storage is optional. */ } };
    let svgDocument = null;
    let particles = [];
    let frame = 0;
    let visible = false;
    let mouseX = 0;
    let mouseY = 0;
    let burstUntil = 0;
    let uploadedSource = null;
    let lastMeshFrame = 0;
    let selectedLayer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const panel = document.createElement('section');
    panel.id = 'model-two-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Điều chỉnh model nhân vật');
    panel.innerHTML = `
        <div class="model-two-header"><h2>Băng Tâm Tiên Tử v5.0 Ultimate Studio</h2><button type="button" data-action="close" aria-label="Đóng bảng điều chỉnh">✕</button></div>
        <div class="model-two-body">
            <fieldset><legend>5 Trạng Thái Đạo Tâm</legend><div class="model-two-grid">${expressions.map(([key, label]) => `<button type="button" data-expression="${key}">${label}</button>`).join('')}</div></fieldset>
            <fieldset><legend>Chuyển động &amp; Linh khí vũ trụ</legend>${sliders.map(([key, label, min, max]) => `<label class="model-two-slider"><span>${label}</span><output data-output="${key}"></output><input type="range" data-slider="${key}" min="${min}" max="${max}"></label>`).join('')}</fieldset>
            <fieldset><legend>Sắc Linh Hỏa &amp; Pháp Trận</legend><div class="model-two-grid">${themes.map(([key, label]) => `<button type="button" data-theme="${key}">${label}</button>`).join('')}</div></fieldset>
            <fieldset><legend>3D Parallax &amp; Phụ kiện</legend>
                <label class="model-two-layer"><input type="checkbox" data-option="mouseLook"> 3D Parallax &amp; Liếc mắt</label>
                <label class="model-two-layer"><input type="checkbox" data-option="foreheadMark"> Ấn ký Băng Liên trán</label>
                <label class="model-two-layer"><input type="checkbox" data-option="blush"> Má hồng tiên nữ</label>
                <label class="model-two-layer"><input type="checkbox" data-option="magicCircle"> Vòng pháp trận xoay</label>
            </fieldset>
            <fieldset><legend>12 Lớp hình Live2D Rig</legend>${layers.map(([key, label]) => `<div class="model-two-layer"><input type="checkbox" data-layer="${key}" aria-label="Hiện ${label}"><span>${label}</span><button type="button" data-select-layer="${key}" aria-label="Soi ${label}">Soi</button></div>`).join('')}<button type="button" data-action="clear-selection">Bỏ soi lớp</button></fieldset>
            <div class="model-two-actions"><button type="button" data-action="vector">Model 2D Tiên Hiệp v5.0</button><button type="button" data-action="illustration">Ảnh tĩnh nhân vật</button><button type="button" data-action="burst">⚡ Xung Kích Bình Cảnh</button><button type="button" data-action="upload">Nạp ảnh riêng</button><button type="button" data-action="export">Tải SVG hiện tại</button><button type="button" data-action="reset">Đặt lại điều chỉnh</button></div>
            <input type="file" id="model-two-upload-input" accept="image/png,image/jpeg,image/webp" hidden>
            <p class="model-two-note">Chuẩn Cosmic Xianxia God-Tier: Cây xương phân cấp Vàng, 3D Parallax Tilt, Đôi mắt 5 tầng Live2D, Đột phá Xung Kích Bình Cảnh &amp; Đồng bộ Ngày/Đêm.</p>
        </div>`;
    document.body.appendChild(panel);
    const uploadedCanvas = document.createElement('canvas');
    uploadedCanvas.id = 'model-two-uploaded';
    uploadedCanvas.width = 1280;
    uploadedCanvas.height = 760;
    uploadedCanvas.setAttribute('role', 'img');
    uploadedCanvas.setAttribute('aria-label', 'Ảnh nhân vật do người dùng chọn');
    wrapper.appendChild(uploadedCanvas);
    const meshContext = uploadedCanvas.getContext('2d');

    const meshVertices = [];
    const meshTriangles = [];
    const meshColumns = 16;
    const meshRows = 10;
    for (let row = 0; row <= meshRows; row++) {
        for (let column = 0; column <= meshColumns; column++) {
            const x = column * 1280 / meshColumns;
            const y = row * 760 / meshRows;
            meshVertices.push({ x, y, sourceX: x, sourceY: y });
        }
    }
    for (let row = 0; row < meshRows; row++) {
        for (let column = 0; column < meshColumns; column++) {
            const first = row * (meshColumns + 1) + column;
            meshTriangles.push([first, first + 1, first + meshColumns + 1]);
            meshTriangles.push([first + 1, first + meshColumns + 2, first + meshColumns + 1]);
        }
    }

    const svgEl = id => svgDocument?.getElementById(id);
    const attr = (id, name, value) => { const el = svgEl(id); if (el) el.setAttribute(name, value); };
    const show = (id, yes) => { const el = svgEl(id); if (el) el.style.display = yes ? '' : 'none'; };

    function syncPanel() {
        panel.querySelector('[data-action="illustration"]').setAttribute('aria-pressed', String(wrapper.classList.contains('model-two-illustration-mode')));
        panel.querySelector('[data-action="vector"]').setAttribute('aria-pressed', String(!wrapper.classList.contains('model-two-illustration-mode') && !wrapper.classList.contains('model-two-image-mode')));
        panel.querySelectorAll('[data-expression]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.expression === prefs.expression)));
        panel.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === prefs.theme)));
        panel.querySelectorAll('[data-slider]').forEach(input => {
            const key = input.dataset.slider;
            input.value = prefs[key];
            const suffix = sliders.find(([name]) => name === key)[4];
            panel.querySelector(`[data-output="${key}"]`).textContent = suffix === 'x' ? `${(prefs[key] / 100).toFixed(1)}x` : `${prefs[key]}${suffix}`;
        });
        panel.querySelectorAll('[data-option]').forEach(input => { input.checked = Boolean(prefs[input.dataset.option]); });
        panel.querySelectorAll('[data-layer]').forEach(input => { input.checked = !prefs.hiddenLayers.includes(input.dataset.layer); });
        panel.querySelectorAll('[data-select-layer]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.selectLayer === selectedLayer)));
    }

    function applyEyeOpen() {
        const offset = (1 - prefs.eyeOpen / 100) * 4.5;
        const y = (189 + offset).toFixed(1);
        attr('eye-clip-path-L', 'd', `M 601,196 C 607,${y} 621,${y} 628,195 C 623,202 608,203 601,196 Z`);
        attr('eye-clip-path-R', 'd', `M 679,196 C 673,${y} 659,${y} 652,195 C 657,202 672,203 679,196 Z`);
        attr('upper-lash-L', 'd', `M 599,196.5 C 606,${(188.5 + offset).toFixed(1)} 621,${(188.5 + offset).toFixed(1)} 629,195.5`);
        attr('upper-lash-R', 'd', `M 681,196.5 C 674,${(188.5 + offset).toFixed(1)} 659,${(188.5 + offset).toFixed(1)} 651,195.5`);
    }

    function applyExpression() {
        const expr = prefs.expression;
        show('anime-eyes-open', expr !== 'meditate');
        show('anime-eyes-closed', expr === 'meditate');
        show('anime-eyes-glow', expr === 'awakened');
        attr('extra-star-L', 'opacity', ['smile', 'shy'].includes(expr) ? '1' : '0');
        attr('extra-star-R', 'opacity', ['smile', 'shy'].includes(expr) ? '1' : '0');
        const mouth = {
            kuudere: 'M 634.5,229 Q 640,230.5 645.5,229',
            smile: 'M 633,228 Q 640,233.5 647,228',
            shy: 'M 635,230 Q 638,228 640,230 Q 642,232 645,229.5',
            meditate: 'M 635,229 Q 640,231 645,229',
            awakened: 'M 634.5,229.5 Q 640,228.5 645.5,229.5'
        };
        attr('anime-mouth', 'd', mouth[expr] || mouth.kuudere);
        attr('blush-oval-L', 'opacity', expr === 'shy' ? '.65' : expr === 'smile' ? '.42' : '.22');
        attr('blush-oval-R', 'opacity', expr === 'shy' ? '.65' : expr === 'smile' ? '.42' : '.22');
        attr('blush-lines', 'opacity', expr === 'shy' ? '.85' : expr === 'smile' ? '.55' : '.30');
        applyEyeOpen();
    }

    function applySettings() {
        wrapper.style.setProperty('--model-two-zoom', String(prefs.zoom / 100));
        if (!uploadedSource) wrapper.classList.toggle('model-two-illustration-mode', prefs.displayMode === 'illustration' && illustration.naturalWidth > 0);
        syncPanel();
        if (!svgDocument) return;
        applyExpression();
        show('acc-forehead-mark', prefs.foreheadMark || prefs.expression === 'awakened');
        show('acc-blush', prefs.blush);
        show('acc-magic-circle', prefs.magicCircle);
        layers.forEach(([id]) => show(id, !prefs.hiddenLayers.includes(id)));
        const filters = { ice: '', sakura: 'hue-rotate(125deg) saturate(1.15)', jade: 'hue-rotate(-48deg) saturate(1.1)', violet: 'hue-rotate(58deg) saturate(1.2)' };
        const tintedLayers = new Set(['layer-aura', 'layer-spirit-flame', 'layer-ice-crystals', 'layer-celestial-ribbons', 'layer-sleeves-wide', 'layer-torso-robe', 'layer-skirt-legs']);
        svgDocument.querySelectorAll('.rig-layer').forEach(el => {
            el.classList.toggle('bone-highlight', el.id === selectedLayer);
            el.classList.toggle('bone-dimmed', Boolean(selectedLayer && el.id !== selectedLayer));
            el.style.filter = `${tintedLayers.has(el.id) ? filters[prefs.theme] || '' : ''} ${el.id === selectedLayer ? 'drop-shadow(0 0 12px #38bdf8)' : ''}`.trim();
        });
        object.style.filter = 'drop-shadow(0 18px 18px rgba(0,0,0,.64))';
        if (particles.length !== prefs.particleCount) initParticles();
        syncPanel();
    }

    function initParticles() {
        const host = svgEl('svg-particles-layer');
        if (!host) return;
        host.replaceChildren();
        particles = [];
        const count = Math.min(60, Math.max(10, prefs.particleCount));
        for (let i = 0; i < count; i++) {
            const diamond = Math.random() > 0.6;
            const el = svgDocument.createElementNS('http://www.w3.org/2000/svg', diamond ? 'polygon' : 'circle');
            const size = Math.random() * 1.7 + 1.5; // Kích thước hạt nhỏ 1.5px - 3.2px theo chuẩn
            if (diamond) {
                el.setAttribute('points', `0,${(-size * 1.6).toFixed(1)} ${size.toFixed(1)},0 0,${(size * 1.6).toFixed(1)} ${(-size).toFixed(1)},0`);
                el.setAttribute('fill', '#e0f2fe');
            } else {
                el.setAttribute('r', size.toFixed(1));
                el.setAttribute('fill', '#ffffff');
            }
            host.appendChild(el);
            particles.push({
                el,
                diamond,
                x: 640 + (Math.random() - 0.5) * 600,
                y: 380 + (Math.random() - 0.5) * 480,
                vy: -(Math.random() * 0.55 + 0.2), // Trôi lên chậm rãi mượt mà
                vx: (Math.random() - 0.5) * 0.25,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function renderImageMesh(now, wind, cloth, breath, mx, my) {
        if (!uploadedSource || !meshContext) return;
        if (!reduceMotion.matches && now - lastMeshFrame < 33) return;
        lastMeshFrame = now;
        const t = now / 1000;
        const motion = reduceMotion.matches ? 0 : 1;
        const floatY = Math.sin(t * 1.8) * 5 * breath * motion;
        meshContext.clearRect(0, 0, 1280, 760);
        for (const vertex of meshVertices) {
            const x = vertex.sourceX;
            const y = vertex.sourceY;
            let dx = 0;
            let dy = floatY * Math.max(0, Math.min(1, (660 - y) / 140));
            const headDistance = Math.hypot(x - 640, y - 180);
            if (headDistance < 145) {
                const weight = Math.cos((headDistance / 145) * Math.PI / 2);
                dx += mx * 9 * weight;
                dy += my * 6 * weight;
            }
            if (x > 665 && y > 95 && y < 450) {
                const weight = Math.min(1, (x - 665) / 250) * Math.max(0, 1 - Math.abs(y - 265) / 185);
                dx += Math.cos(t * 2.2 * wind - (x - 665) * 0.015) * 6 * cloth * weight * motion;
                dy += Math.sin(t * 3 * wind - (x - 665) * 0.018) * 15 * cloth * weight * motion;
            }
            if (y > 310 && y < 580 && Math.abs(x - 640) > 115) {
                const weight = Math.min(1, (Math.abs(x - 640) - 115) / 260) * Math.max(0, 1 - Math.abs(y - 445) / 140);
                dy += Math.sin(t * 2.4 * wind - Math.abs(x - 640) * 0.012) * 12 * cloth * weight * motion;
            }
            vertex.x = x + dx;
            vertex.y = y + dy;
        }
        for (const [i0, i1, i2] of meshTriangles) {
            const a = meshVertices[i0], b = meshVertices[i1], c = meshVertices[i2];
            const determinant = (b.sourceX - a.sourceX) * (c.sourceY - a.sourceY) - (c.sourceX - a.sourceX) * (b.sourceY - a.sourceY);
            if (!determinant) continue;
            const scaleX = ((b.x - a.x) * (c.sourceY - a.sourceY) - (c.x - a.x) * (b.sourceY - a.sourceY)) / determinant;
            const shearY = ((b.y - a.y) * (c.sourceY - a.sourceY) - (c.y - a.y) * (b.sourceY - a.sourceY)) / determinant;
            const shearX = ((c.x - a.x) * (b.sourceX - a.sourceX) - (b.x - a.x) * (c.sourceX - a.sourceX)) / determinant;
            const scaleY = ((c.y - a.y) * (b.sourceX - a.sourceX) - (b.y - a.y) * (c.sourceX - a.sourceX)) / determinant;
            const moveX = a.x - scaleX * a.sourceX - shearX * a.sourceY;
            const moveY = a.y - shearY * a.sourceX - scaleY * a.sourceY;
            meshContext.save();
            meshContext.beginPath();
            meshContext.moveTo(a.x, a.y);
            meshContext.lineTo(b.x, b.y);
            meshContext.lineTo(c.x, c.y);
            meshContext.closePath();
            meshContext.clip();
            meshContext.transform(scaleX, shearY, shearX, scaleY, moveX, moveY);
            meshContext.drawImage(uploadedSource, 0, 0);
            meshContext.restore();
        }
    }

    function animate(now) {
        if (!visible || document.hidden || !svgDocument) { frame = 0; return; }
        const t = now / 1000;
        const motion = reduceMotion.matches ? 0 : 1;
        const wind = prefs.windSpeed / 100;
        const cloth = prefs.clothWave / 100;
        const breath = prefs.breathAmp / 100;
        const mx = prefs.mouseLook ? mouseX : 0;
        const my = prefs.mouseLook ? mouseY : 0;
        const burst = now < burstUntil ? Math.max(0, (burstUntil - now) / 1600) : 0;

        // 3D PARALLAX TILT THỜI GIAN THỰC (Theo tọa độ con trỏ chuột mx, my)
        const tiltY = (mx * 6.5 * motion).toFixed(2);
        const tiltX = (-my * 4.5 * motion).toFixed(2);
        wrapper.style.setProperty('--model-two-tilt-y', `${tiltY}deg`);
        wrapper.style.setProperty('--model-two-tilt-x', `${tiltX}deg`);

        if (uploadedSource) {
            renderImageMesh(now, wind, cloth, breath, mx, my);
            frame = reduceMotion.matches ? 0 : requestAnimationFrame(animate);
            return;
        }

        const setTransform = (id, value) => { const el = svgEl(id); if (el) el.style.transform = value; };

        // 1. KIẾN TRÚC XƯƠNG PHÂN CẤP VÀNG (GOLDEN HIERARCHICAL BONE TREE)
        // A. #bone-root (Pivot 640px 520px): Duy nhất nhận translateY(floatY) để cả cơ thể nâng lên hạ xuống thống nhất, không bao giờ lệch trục
        const floatY = Math.sin(t * 1.8) * 4.5 * breath * motion;
        setTransform('bone-root', `translateY(${floatY.toFixed(2)}px)`);

        // B. #bone-torso (Pivot 640px 440px): Nhịp thở tĩnh khí (scaleY / scaleX) đặt tại đây
        const breathScaleY = 1 + Math.sin(t * 2.0) * 0.012 * breath * motion;
        const breathScaleX = 1 - Math.sin(t * 2.0) * 0.003 * breath * motion;
        setTransform('bone-torso', `scale(${breathScaleX.toFixed(4)}, ${breathScaleY.toFixed(4)})`);

        // C. #layer-head-group (Pivot đốt sống cổ 640px 245px): Khớp cổ chuẩn giải phẫu, CHỈ rotate tối đa ±2.2°, TUYỆT ĐỐI KHÔNG translate
        const headRot = Math.max(-2.2, Math.min(2.2, mx * 2.0 + Math.sin(t * 1.2) * 0.4 * breath * motion));
        setTransform('layer-head-group', `rotate(${headRot.toFixed(2)}deg)`);

        // D. Tóc mai nằm BÊN TRONG #layer-head-group, đung đưa quanh thái dương (604px, 135px) & (676px, 135px)
        setTransform('hair-sidelock-L', `rotate(${(Math.sin(t * 2.4 * wind) * 2.0 * cloth * motion - mx * 1.2).toFixed(2)}deg)`);
        setTransform('hair-sidelock-R', `rotate(${(Math.cos(t * 2.4 * wind + 0.6) * 2.0 * cloth * motion - mx * 1.2).toFixed(2)}deg)`);

        // E. Cố định ống tay áo rộng nối liền vai tại khớp khuỷu (556, 415) & (736, 425)
        const burstLift = burst * 16;
        setTransform('layer-hand-upper', `translateY(${(-burstLift).toFixed(2)}px) rotate(${(Math.sin(t * 2.0) * 1.3 * breath * motion + mx * 1.0).toFixed(2)}deg)`);
        setTransform('layer-hand-lower', `rotate(${(Math.sin(t * 1.8 + 0.8) * 0.9 * motion).toFixed(2)}deg)`);

        // 2. HỆ THỐNG VẬT LÝ TÓC & LỤA LỆCH PHA ĐA TẦN SỐ (PHASE-DELAYED WAVE PHYSICS)
        setTransform('sub-hair-back-left', `rotate(${(Math.sin(t * 2.2 * wind - 0.45) * 3.4 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-hair-back-right', `rotate(${(Math.sin(t * 2.6 * wind - 1.15) * 4.0 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-ribbon-top-right', `rotate(${(Math.sin(t * 3.1 * wind - 0.75) * 5.5 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-celestial-L', `rotate(${(Math.sin(t * 2.7 * wind - 0.95) * 4.8 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-celestial-R', `rotate(${(-Math.cos(t * 2.7 * wind - 1.6) * 4.8 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-sleeve-L', `rotate(${(Math.sin(t * 2.1 * wind - 0.5) * 2.4 * cloth * motion).toFixed(2)}deg)`);
        setTransform('sub-sleeve-R', `rotate(${(-Math.sin(t * 2.1 * wind - 1.25) * 2.4 * cloth * motion).toFixed(2)}deg)`);

        // 3. ĐÔI MẮT ANIME LINH HỒN 5 TẦNG & TỰ ĐỘNG CHỚP MẮT
        attr('pupil-group-L', 'transform', `translate(${(mx * 2.6).toFixed(1)},${(my * 1.8).toFixed(1)})`);
        attr('pupil-group-R', 'transform', `translate(${(mx * 2.6).toFixed(1)},${(my * 1.8).toFixed(1)})`);
        if (prefs.expression !== 'meditate') {
            const cycle = t % 4.5;
            const blink = motion && (cycle > 4.34 && cycle < 4.48);
            show('anime-eyes-open', !blink);
            show('anime-eyes-closed', Boolean(blink));
        }

        // 4. CHU KỲ NGÀY / ĐÊM & LINH HỎA (DAY/NIGHT AMBIENT TINT)
        const hour = new Date().getHours() + new Date().getMinutes() / 60;
        const nightFactor = (hour >= 6 && hour <= 18) ? Math.abs(hour - 12) / 12 : 0.6 + Math.sin(((hour > 18 ? hour - 18 : hour + 6) / 12) * Math.PI) * 0.4;
        const nightGlow = 1 + nightFactor * 0.25;

        // 5. HIỆU ỨNG ĐỘT PHÁ "XUNG KÍCH BÌNH CẢNH" (BÙNG NỔ CỘT LINH KHÍ & XOAY PHÁP TRẬN TỐC ĐỘ CAO)
        const vfxPillar = svgEl('vfx-breakthrough-pillar');
        if (vfxPillar) {
            vfxPillar.setAttribute('opacity', (burst * 0.95).toFixed(3));
        }
        const magicCircle = svgEl('acc-magic-circle');
        if (magicCircle) {
            const circleRot = (t * 25 + burst * 900) % 360; // Quay tốc độ cao khi xung kích
            magicCircle.style.transform = `rotate(${circleRot.toFixed(1)}deg)`;
            if (burst > 0.05) {
                magicCircle.querySelectorAll('ellipse').forEach((el, idx) => {
                    el.setAttribute('stroke', idx === 0 ? '#fbbf24' : '#38bdf8');
                });
            } else {
                magicCircle.querySelectorAll('ellipse').forEach((el, idx) => {
                    el.setAttribute('stroke', idx === 0 ? '#7dd3fc' : '#bae6fd');
                });
            }
        }

        // Cường độ Linh Hỏa (Phình to gấp đôi 2.0x khi bùng sáng Xung Kích Bình Cảnh)
        const baseFlame = (prefs.flameScale / 100) * (1 + Math.sin(t * 8.5) * 0.08 * motion) * nightGlow;
        const flameMultiplier = 1 + burst * 1.0; // 1.0 -> 2.0x (Gấp đôi khi burst = 1!)
        setTransform('layer-spirit-flame', `scale(${(baseFlame * flameMultiplier).toFixed(3)})`);

        // 6. KHỬ NHIỄU HẠT: TRÔI LÊN CHẬM RÃI & MỜ DẦN THEO HÀM SIN
        if (motion) {
            particles.forEach(p => {
                p.y -= -p.vy * wind * 0.8;
                p.x += p.vx + Math.sin(t * 1.8 + p.phase) * 0.3 * wind;
                if (p.y < 40) {
                    p.y = 660;
                    p.x = 640 + (Math.random() - 0.5) * 600;
                }
                const op = 0.25 + 0.65 * Math.abs(Math.sin(t * 2.0 + p.phase));
                p.el.setAttribute('opacity', op.toFixed(2));
                if (p.diamond) {
                    p.el.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${(Math.sin(t * 1.5 + p.phase) * 25).toFixed(1)})`);
                } else {
                    p.el.setAttribute('cx', p.x.toFixed(1));
                    p.el.setAttribute('cy', p.y.toFixed(1));
                }
            });
        }

        frame = reduceMotion.matches ? 0 : requestAnimationFrame(animate);
    }

    function triggerBreakthroughBurst(durationMs = 2400) {
        burstUntil = performance.now() + durationMs;
        start();
    }
    window.triggerCharacterBreakthroughBurst = triggerBreakthroughBurst;

    // Tự động kết nối sự kiện Xung Kích Bình Cảnh / Đột Phá của game
    document.addEventListener('click', event => {
        const btn = event.target.closest('#main-action-btn, #btn-breakthrough, [data-action="breakthrough"], #btn-minor-breakthrough-confirm, #btn-major-breakthrough-confirm');
        if (btn) {
            triggerBreakthroughBurst(2600);
        }
    });
    window.addEventListener('game:breakthrough', () => triggerBreakthroughBurst(2800));

    function start() { if (!frame && visible && !document.hidden && svgDocument) frame = requestAnimationFrame(animate); }
    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }
    function closePanel() { panel.hidden = true; document.body.classList.remove('model-two-panel-open'); openButton.setAttribute('aria-expanded', 'false'); openButton.focus(); }
    function onLoad() {
        svgDocument = object.contentDocument;
        if (!svgDocument?.getElementById('layer-head-group')) return;
        wrapper.classList.add('model-two-ready');
        applySettings();
        start();
    }
    object.addEventListener('load', onLoad);
    illustration.addEventListener('load', () => { wrapper.classList.add('model-two-ready'); applySettings(); });
    if (illustration.complete && illustration.naturalWidth) {
        wrapper.classList.add('model-two-ready');
        applySettings();
    }
    if (object.contentDocument?.getElementById('layer-head-group')) {
        svgDocument = object.contentDocument;
        wrapper.classList.add('model-two-ready');
        applySettings();
        start();
    }

    openButton.addEventListener('click', () => {
        const open = panel.hidden;
        panel.hidden = !open;
        document.body.classList.toggle('model-two-panel-open', open);
        openButton.setAttribute('aria-expanded', String(open));
        if (open) { syncPanel(); panel.querySelector('button, input')?.focus(); }
    });

    panel.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.expression) {
            prefs.expression = button.dataset.expression;
            if (prefs.expression === 'awakened') {
                prefs.foreheadMark = true;
                triggerBreakthroughBurst(2200);
            }
        }
        else if (button.dataset.theme) prefs.theme = button.dataset.theme;
        else if (button.dataset.selectLayer) selectedLayer = selectedLayer === button.dataset.selectLayer ? null : button.dataset.selectLayer;
        else if (button.dataset.action === 'clear-selection') selectedLayer = null;
        else if (button.dataset.action === 'burst') triggerBreakthroughBurst(2400);
        else if (button.dataset.action === 'close') { closePanel(); return; }
        else if (button.dataset.action === 'upload') { panel.querySelector('#model-two-upload-input').click(); return; }
        else if (button.dataset.action === 'illustration' || button.dataset.action === 'vector') {
            prefs.displayMode = button.dataset.action;
            wrapper.classList.remove('model-two-image-mode');
            uploadedSource = null;
            meshContext?.clearRect(0, 0, 1280, 760);
        }
        else if (button.dataset.action === 'export') {
            if (!svgDocument) return;
            const blob = new Blob([new XMLSerializer().serializeToString(svgDocument.documentElement)], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bang-tam-tien-tu-v5.svg'; anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return;
        } else if (button.dataset.action === 'reset') {
            Object.assign(prefs, defaults, { hiddenLayers: [] });
            selectedLayer = null;
            wrapper.classList.remove('model-two-image-mode');
            uploadedSource = null;
            meshContext?.clearRect(0, 0, 1280, 760);
        }
        save(); applySettings();
    });

    panel.addEventListener('input', event => {
        const input = event.target;
        if (input.dataset.slider) prefs[input.dataset.slider] = Number(input.value);
        else if (input.dataset.option) prefs[input.dataset.option] = input.checked;
        else if (input.dataset.layer) prefs.hiddenLayers = input.checked ? prefs.hiddenLayers.filter(id => id !== input.dataset.layer) : [...new Set([...prefs.hiddenLayers, input.dataset.layer])];
        else return;
        save(); applySettings();
    });

    panel.querySelector('#model-two-upload-input').addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
        if (file.size > 10_000_000) {
            panel.querySelector('.model-two-note').textContent = 'Ảnh vượt quá 10 MB. Hãy chọn ảnh nhỏ hơn.';
            event.target.value = '';
            return;
        }
        event.target.value = '';
        try {
            const bitmap = await createImageBitmap(file);
            const source = document.createElement('canvas');
            source.width = 1280;
            source.height = 760;
            const context = source.getContext('2d');
            const scale = Math.min(1280 / bitmap.width, 760 / bitmap.height);
            const width = bitmap.width * scale;
            const height = bitmap.height * scale;
            context.drawImage(bitmap, (1280 - width) / 2, (760 - height) / 2, width, height);
            bitmap.close();
            uploadedSource = source;
            wrapper.classList.remove('model-two-illustration-mode');
            lastMeshFrame = 0;
            renderImageMesh(performance.now(), prefs.windSpeed / 100, prefs.clothWave / 100, prefs.breathAmp / 100, mouseX, mouseY);
            wrapper.classList.add('model-two-image-mode');
            start();
        } catch (_) {
            panel.querySelector('.model-two-note').textContent = 'Không đọc được ảnh này. Hãy chọn PNG, JPEG hoặc WebP khác.';
        }
    });

    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closePanel(); });
    wrapper.addEventListener('pointermove', event => {
        const rect = wrapper.getBoundingClientRect();
        mouseX = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
        mouseY = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
        if (reduceMotion.matches) start();
    });
    wrapper.addEventListener('pointerleave', () => {
        mouseX = 0;
        mouseY = 0;
        wrapper.style.setProperty('--model-two-tilt-y', '0deg');
        wrapper.style.setProperty('--model-two-tilt-x', '0deg');
    });
    new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting || false;
        if (visible) start(); else { stop(); if (!panel.hidden) closePanel(); }
    }).observe(wrapper);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    reduceMotion.addEventListener('change', () => { stop(); start(); });
    syncPanel();
})();
