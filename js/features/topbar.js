(function () {
    'use strict';
    // ========================================================================
    // 9. THANH TÀI NGUYÊN KHUNG TRÊN (GLOBAL TOP RESOURCE BAR)
    // Tích hợp từ top_resource_bar_demo.html sang chuẩn SPA độc lập
    // ========================================================================

    /**
     * 1. HÀM FORMAT SỐ GỌN (1.5M, 20K, 3.2B) THEO CHUẨN TIÊN HIỆP
     */
    function formatNumber(num) {
        const n = Number(num) || 0;
        if (n >= 1e9) {
            return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
        }
        if (n >= 1e6) {
            return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
        }
        if (n >= 1e3) {
            return (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
        }
        return n.toLocaleString('vi-VN');
    }

    /**
     * 2. HÀM CẬP NHẬT TOÀN BỘ THANH TÀI NGUYÊN (UPDATE TOPBAR)
     * @param {Object} data
     *   - stones: Số Linh Thạch
     *   - jade: Số Tiên Ngọc
     *   - qiCurrent: Linh khí hiện tại
     *   - qiMax: Dung tích linh khí tối đa
     *   - qiRate: Tốc độ hấp thu mỗi giây (+X/s)
     *   - righteous: Điểm Chính Đạo (0..100)
     *   - demonic: Điểm Ma Đạo (0..100)
     */
    function updateTopResourceBar(data) {
        if (!data) return;
        const setTextIfChanged = (element, value) => {
            if (element && element.textContent !== value) element.textContent = value;
        };
        const setWidthIfChanged = (element, value) => {
            if (element && element.style.width !== value) element.style.width = value;
        };

        // 1. Cập nhật Tiền tệ
        if (typeof data.stones !== 'undefined') {
            const elStones = document.getElementById('top-spirit-stones');
            setTextIfChanged(elStones, formatNumber(data.stones));
        }
        if (typeof data.jade !== 'undefined') {
            const elJade = document.getElementById('top-immortal-jade');
            setTextIfChanged(elJade, formatNumber(data.jade));
        }

        // 2. Cập nhật Khối Linh Khí / Tu Vi
        if (typeof data.qiCurrent !== 'undefined' && typeof data.qiMax !== 'undefined') {
            const cur = Math.max(0, Number(data.qiCurrent) || 0);
            const max = Math.max(1, Number(data.qiMax) || 1);
            const pct = Math.min(100, Math.max(0, (cur / max) * 100));

            const elQiFill = document.getElementById('top-qi-fill');
            setWidthIfChanged(elQiFill, pct.toFixed(1) + '%');

            const elQiText = document.getElementById('top-qi-text');
            setTextIfChanged(elQiText, `${formatNumber(cur)} / ${formatNumber(max)}`);

            const elQiRate = document.getElementById('top-qi-rate');
            if (elQiRate && typeof data.qiRate !== 'undefined') {
                setTextIfChanged(elQiRate, `(+${formatNumber(data.qiRate)}/s)`);
            }

            const legacyVal = document.getElementById('top-qi-val');
            setTextIfChanged(legacyVal, `${formatNumber(cur)} / ${formatNumber(max)}`);
        }

        // 3. Cập nhật Khối Cân Bằng Đạo Tâm (Sun / Moon)
        if (typeof data.righteous !== 'undefined' && typeof data.demonic !== 'undefined') {
            const r = Math.max(0, Number(data.righteous) || 0);
            const d = Math.max(0, Number(data.demonic) || 0);
            const total = Math.max(1, r + d);

            const sunPct = (r / total) * 100;
            const moonPct = (d / total) * 100;

            const elValSun = document.getElementById('val-righteous');
            setTextIfChanged(elValSun, String(r));

            const elValMoon = document.getElementById('val-demonic');
            setTextIfChanged(elValMoon, String(d));

            const elTrackSun = document.getElementById('track-sun');
            setWidthIfChanged(elTrackSun, sunPct.toFixed(1) + '%');

            const elTrackMoon = document.getElementById('track-moon');
            setWidthIfChanged(elTrackMoon, moonPct.toFixed(1) + '%');

            const elTrackOrb = document.getElementById('track-orb');
            if (elTrackOrb) elTrackOrb.style.left = sunPct.toFixed(1) + '%';

            // Kích hoạt Glow cho phe chiếm ưu thế
            const poleSun = document.getElementById('pole-sun');
            const poleMoon = document.getElementById('pole-moon');

            if (poleSun && poleMoon) {
                if (sunPct > 50) {
                    poleSun.classList.add('dominant');
                    poleMoon.classList.remove('dominant');
                } else if (moonPct > 50) {
                    poleMoon.classList.add('dominant');
                    poleSun.classList.remove('dominant');
                } else {
                    poleSun.classList.remove('dominant');
                    poleMoon.classList.remove('dominant');
                }
            }
        }
    }

    /**
     * 3. TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU TỪ GAME STATE SANG TOPBAR
     */
    function syncTopResourceBarFromState() {
        const s = window.state || (typeof state !== 'undefined' ? state : null);
        if (!s) return;

        const stones = typeof s.stones !== 'undefined' ? s.stones : (window.playerState?._linhThach || 0);
        const jade = typeof s.immortalJade !== 'undefined' ? s.immortalJade : (s.jade || 0);

        const curExp = typeof s.exp !== 'undefined' ? s.exp : (s.spiritPool || 0);
        const realms = window.REALMS || (typeof REALMS !== 'undefined' ? REALMS : []);
        const rIdx = s.realmIndex || 0;
        const maxExp = (realms[rIdx] && realms[rIdx].maxExp) ? realms[rIdx].maxExp : 100;
        const rate = s.spiritRate || (realms[rIdx] ? realms[rIdx].expRate : 5) || 5;

        const righteous = s.alignment?.righteous ?? 50;
        const demonic = s.alignment?.demonic ?? 50;

        updateTopResourceBar({
            stones,
            jade,
            qiCurrent: curExp,
            qiMax: maxExp,
            qiRate: rate,
            righteous,
            demonic
        });
    }
    window.formatNumber = formatNumber;
    window.updateTopResourceBar = updateTopResourceBar;
    window.syncTopResourceBarFromState = syncTopResourceBarFromState;
    globalThis.formatNumber = formatNumber;
    globalThis.updateTopResourceBar = updateTopResourceBar;
    globalThis.syncTopResourceBarFromState = syncTopResourceBarFromState;
})();
