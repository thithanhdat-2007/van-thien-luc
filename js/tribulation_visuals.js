// Draw PNG artwork in a fixed layer. Damage and progression stay in main.js.
(() => {
    const modal = document.getElementById('modal-do-kiep');
    const avatar = document.getElementById('tribulation-avatar-img');
    const artwork = [...document.querySelectorAll('[data-trib-lightning-tier]')];
    if (!modal || !avatar || !artwork.length) return;

    let layer;
    let stage;
    let flash;
    const timers = new Set();
    const colors = ['#38bdf8', '#facc15', '#c084fc', '#34d399', '#67e8f9', '#f43f5e', '#a855f7', '#fb7185', '#eab308', '#f97316'];

    function clear() {
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
        layer?.replaceChildren();
        stage?.replaceChildren();
        flash?.classList.remove('active');
        lightningCanvas = null;
        lightningCtx = null;
    }

    let lightningCanvas = null;
    let lightningCtx = null;

    function getLightningCanvas() {
        if (!stage) return null;
        if (!lightningCanvas || !lightningCanvas.isConnected) {
            lightningCanvas = document.createElement('canvas');
            lightningCanvas.id = 'trib-lightning-canvas';
            lightningCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:45;';
            stage.appendChild(lightningCanvas);
            lightningCtx = lightningCanvas.getContext('2d');
        }
        const rect = modal.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if (lightningCanvas.width !== Math.floor(rect.width * dpr) || lightningCanvas.height !== Math.floor(rect.height * dpr)) {
            lightningCanvas.width = Math.floor(rect.width * dpr);
            lightningCanvas.height = Math.floor(rect.height * dpr);
        }
        lightningCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { canvas: lightningCanvas, ctx: lightningCtx, width: rect.width, height: rect.height };
    }

    function generateDisplacementSegments(x1, y1, x2, y2, displace = 70, minDisplace = 6) {
        if (displace < minDisplace) return [{ x1, y1, x2, y2 }];
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * (displace * 0.35);
        return [
            ...generateDisplacementSegments(x1, y1, midX, midY, displace * 0.52, minDisplace),
            ...generateDisplacementSegments(midX, midY, x2, y2, displace * 0.52, minDisplace)
        ];
    }

    function renderProceduralLightning(targetHeadX, targetHeadY, boltColor) {
        const cObj = getLightningCanvas();
        if (!cObj) return;
        const { ctx, canvas } = cObj;
        const modalRect = modal.getBoundingClientRect();
        const endX = targetHeadX - modalRect.left;
        const endY = targetHeadY - modalRect.top;
        const startX = endX + (Math.random() - 0.5) * 120;
        const startY = 0;

        // Main procedural bolt
        const mainSegments = generateDisplacementSegments(startX, startY, endX, endY, 80, 5);
        
        // Secondary sub-branches
        const subBranches = [];
        for (let i = 2; i < mainSegments.length - 2; i += 3) {
            if (Math.random() < 0.35) {
                const seg = mainSegments[i];
                const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.5);
                const branchLen = 60 + Math.random() * 90;
                const bx2 = seg.x2 + Math.sin(branchAngle) * branchLen;
                const by2 = seg.y2 + Math.cos(branchAngle) * branchLen;
                subBranches.push(generateDisplacementSegments(seg.x2, seg.y2, bx2, by2, 35, 4));
            }
        }

        // Crawling shield arcs
        const shieldArcs = [];
        const shieldR = 75 + Math.random() * 25;
        for (let a = 0; a < 6; a++) {
            const baseAngle = (a / 6) * Math.PI * 2;
            const arcStart = baseAngle + (Math.random() - 0.5) * 0.4;
            const arcEnd = arcStart + 0.5 + Math.random() * 0.6;
            shieldArcs.push({ arcStart, arcEnd, r: shieldR + (Math.random() - 0.5) * 15 });
        }

        let frame = 0;
        const totalFrames = 6;
        function drawFrame() {
            frame++;
            const alpha = Math.max(0, 1 - (frame - 1) / totalFrames);
            if (alpha <= 0 || !modal.classList.contains('active')) {
                const dpr = window.devicePixelRatio || 1;
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Pass 1: Outer glowing aura
            ctx.strokeStyle = boltColor;
            ctx.lineWidth = 5.5;
            ctx.shadowBlur = 28;
            ctx.shadowColor = boltColor;

            ctx.beginPath();
            mainSegments.forEach((s, idx) => {
                if (idx === 0) ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
            });
            subBranches.forEach(branch => {
                branch.forEach((s, idx) => {
                    if (idx === 0) ctx.moveTo(s.x1, s.y1);
                    ctx.lineTo(s.x2, s.y2);
                });
            });
            ctx.stroke();

            // Pass 2: Intense white-hot core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // Pass 3: Crawling electric arcs around shield
            ctx.strokeStyle = boltColor;
            ctx.lineWidth = 2.0;
            ctx.shadowBlur = 16;
            shieldArcs.forEach(sa => {
                ctx.beginPath();
                ctx.arc(endX, endY, sa.r, sa.arcStart, sa.arcEnd);
                ctx.stroke();
            });

            ctx.restore();

            requestAnimationFrame(drawFrame);
        }

        requestAnimationFrame(drawFrame);
    }

    function chooseArtwork(wave, total) {
        const title = document.getElementById('trib-target-realm-title')?.textContent || '';
        const base = /PHI THĂNG|TIÊN/.test(title) ? 8
            : /HÓA THẦN/.test(title) ? 6
            : /NGUYÊN ANH/.test(title) ? 4
            : /KIM ĐAN|KẾT ĐAN/.test(title) ? 2 : 0;
        const sequences = { 0: [0, 1, 2], 2: [1, 3, 4], 4: [2, 4, 5, 6], 6: [3, 5, 6, 7], 8: [0, 1, 2, 3, 4, 5, 6, 8, 9] };
        const sequence = sequences[base];
        return artwork[sequence[Math.min(wave - 1, sequence.length - 1)]];
    }

    function strike(wave, total) {
        if (!modal.classList.contains('active')) return;
        if (!stage) {
            stage = document.createElement('div');
            stage.id = 'trib-lightning-stage';
            stage.className = 'trib-lightning-stage';
            modal.appendChild(stage);
        }
        if (!flash) {
            flash = document.createElement('div');
            flash.id = 'trib-sky-flash';
            flash.className = 'trib-sky-flash';
            modal.appendChild(flash);
        }
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'tribulation-strike-layer';
            layer.setAttribute('aria-hidden', 'true');
            layer.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;overflow:hidden!important;';
            document.body.appendChild(layer);
        }

        const rect = avatar.getBoundingClientRect();
        // The artwork's impact burst is at about 90% of its image height.
        const headX = rect.left + rect.width / 2;
        const headY = rect.top + rect.height * 0.72;
        const height = Math.max(620, headY + 70);
        const width = Math.min(window.innerWidth * 0.92, Math.max(rect.width * 1.35, height * 0.78));
        const top = headY - height * 0.9;
        const color = colors[Math.max(0, artwork.indexOf(chooseArtwork(wave, total)))] || colors[0];
        modal.style.setProperty('--trib-flash-ambient', `${color}66`);
        modal.style.setProperty('--trib-flash-color', color);
        modal.style.setProperty('--bolt-glow', color);
        modal.style.setProperty('--bolt-color', color);

        const image = document.createElement('img');
        image.className = 'trib-lightning-art-bolt';
        image.alt = '';
        const sceneRect = modal.getBoundingClientRect();
        image.style.cssText = `top:${Math.round(top - sceneRect.top)}px;left:${Math.round(headX - sceneRect.left)}px;width:${Math.round(width)}px;height:${Math.round(height)}px;`;
        image.style.setProperty('--bolt-glow', color);
        image.style.setProperty('--bolt-color', color);
        image.addEventListener('error', () => {
            console.error('Không tải được ảnh thiên kiếp:', image.src);
            image.remove();
        }, { once: true });
        stage.appendChild(image);
        image.src = chooseArtwork(wave, total).src;

        // --- NÂNG CẤP AAA: PROCEDURAL MIDPOINT DISPLACEMENT LIGHTNING & CRAWLING SHIELD ARCS ---
        try {
            renderProceduralLightning(headX, headY, color);
            if (typeof window.triggerCameraTrauma === 'function') {
                window.triggerCameraTrauma(0.65, 'modal-do-kiep');
            }
            if (window.soundSystem?.play) {
                window.soundSystem.play('danger');
            }
        } catch (e) {
            console.warn('[TribulationVisuals] Lỗi vẽ lôi kiếp phân nhánh:', e);
        }

        // Keep the existing environmental flash, shockwave, sparks and camera shake.
        flash.style.background = `radial-gradient(circle at 50% 30%, ${color}99, transparent 72%)`;
        flash.classList.add('active');
        const flashTimer = setTimeout(() => {
            flash.classList.remove('active');
            timers.delete(flashTimer);
        }, 320);
        timers.add(flashTimer);

        const modalRect = modal.getBoundingClientRect();
        const impactX = headX - modalRect.left;
        const impactY = headY - modalRect.top;
        const shockwave = document.createElement('div');
        shockwave.className = 'trib-impact-shockwave';
        shockwave.style.left = `${Math.round(impactX)}px`;
        shockwave.style.top = `${Math.round(impactY)}px`;
        stage.appendChild(shockwave);
        const shockTimer = setTimeout(() => {
            shockwave.remove();
            timers.delete(shockTimer);
        }, 850);
        timers.add(shockTimer);

        for (let i = 0; i < 6; i++) {
            const spark = document.createElement('div');
            const angle = i * 60 + (Math.random() * 30 - 15);
            spark.className = 'trib-spark-arc';
            spark.style.left = `${Math.round(impactX)}px`;
            spark.style.top = `${Math.round(impactY)}px`;
            spark.style.width = `${Math.round(18 + Math.random() * 24)}px`;
            spark.style.height = '3px';
            spark.style.setProperty('--rot', `${angle}deg`);
            spark.style.setProperty('--tx', `${Math.cos(angle * Math.PI / 180) * 90}px`);
            spark.style.setProperty('--ty', `${Math.sin(angle * Math.PI / 180) * 45}px`);
            stage.appendChild(spark);
            const sparkTimer = setTimeout(() => {
                spark.remove();
                timers.delete(sparkTimer);
            }, 680);
            timers.add(sparkTimer);
        }

        const timer = setTimeout(() => {
            image.remove();
            timers.delete(timer);
        }, 4200);
        timers.add(timer);
    }

    window.tribulationVisuals = { strike, clear };
})();
