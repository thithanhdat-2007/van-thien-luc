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
