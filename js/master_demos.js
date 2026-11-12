/**
 * ============================================================================
 * VẤN THIÊN LỤC — MASTER INTEGRATION LOGIC ENGINE (js/master_demos.js)
 * ============================================================================
 * Tích hợp toàn vẹn 4 hệ thống demo vào luồng Game Loop chính:
 * 1. Global Top Resource Bar (top_resource_bar_demo.html)
 * 2. Character Stats Profile Panel (character_stats_demo.html)
 * 3. Tiên Môn Gia Viên (tien_mon_gia_vien_demo.html)
 * 4. Trấn Yêu Tháp Sprite Battler (tran_yeu_thap_sprite_battler_demo.html)
 * ============================================================================
 */

(function (window) {
    'use strict';

    // Format số gọn gàng (K, M, B)
    function formatCompactNumber(num) {
        const n = Number(num) || 0;
        if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
        return n.toLocaleString('vi-VN');
    }

    // ========================================================================
    // PHẦN 1: GLOBAL TOP RESOURCE BAR LOGIC
    // ========================================================================
    function updateMasterTopBar() {
        if (typeof state === 'undefined') return;

        // 1. Linh Thạch & Tiên Ngọc
        const stonesVal = state.stones ?? 0;
        const jadeVal = state.immortalJade ?? 0;

        const elStones = document.getElementById('top-spirit-stones');
        if (elStones) elStones.textContent = formatCompactNumber(stonesVal);

        const elJade = document.getElementById('top-immortal-jade');
        if (elJade) elJade.textContent = formatCompactNumber(jadeVal);

        // 2. Bể Linh Khí (Qi Pool)
        const currentQi = state.linhKhi ?? 0;
        const maxQi = typeof getLinhKhiMax === 'function' ? getLinhKhiMax() : 1000;
        const qiRate = typeof getLinhKhiRate === 'function' ? getLinhKhiRate() * (state.timeScale || 1) : 5;

        const elQiVal = document.getElementById('top-qi-val');
        if (elQiVal) elQiVal.textContent = `${formatCompactNumber(currentQi)} / ${formatCompactNumber(maxQi)}`;

        const elQiRate = document.getElementById('top-qi-rate');
        if (elQiRate) elQiRate.textContent = `+${formatCompactNumber(qiRate)}/s`;

        const elQiFill = document.getElementById('top-qi-fill');
        if (elQiFill && maxQi > 0) {
            const pct = Math.min(100, Math.max(0, (currentQi / maxQi) * 100));
            elQiFill.style.width = `${pct}%`;
        }

        // 3. Đạo Tâm & Chính/Tà
        const righteous = state.alignmentRighteous ?? 50;
        const demonic = state.alignmentDemonic ?? 50;
        const total = Math.max(1, righteous + demonic);
        const rightPct = Math.round((righteous / total) * 100);
        const demoPct = 100 - rightPct;

        const elRightVal = document.getElementById('top-righteous-pts');
        if (elRightVal) elRightVal.textContent = righteous;

        const elDemoVal = document.getElementById('top-demonic-pts');
        if (elDemoVal) elDemoVal.textContent = demonic;

        const elSun = document.getElementById('top-balance-sun');
        if (elSun) elSun.style.width = `${rightPct}%`;

        const elMoon = document.getElementById('top-balance-moon');
        if (elMoon) elMoon.style.width = `${demoPct}%`;

        const elMarker = document.getElementById('top-balance-marker');
        if (elMarker) elMarker.style.left = `${rightPct}%`;

        const elStatus = document.getElementById('top-balance-status');
        if (elStatus) {
            if (rightPct >= 70) {
                elStatus.textContent = 'Chính Đạo Hạo Nhiên';
                elStatus.style.color = '#38bdf8';
            } else if (demoPct >= 70) {
                elStatus.textContent = 'Ma Đạo Độc Tôn';
                elStatus.style.color = '#f43f5e';
            } else {
                elStatus.textContent = 'Chính Tà Cân Bằng';
                elStatus.style.color = '#a855f7';
            }
        }
    }

    // ========================================================================
    // PHẦN 2: CHARACTER STATS PROFILE LOGIC
    // ========================================================================
    function renderMasterCharacterStats() {
        // The current character controller owns the shared profile elements.
        if (typeof window.renderCharacterUI === 'function') {
            window.renderCharacterUI();
            return;
        }
        if (typeof state === 'undefined') return;

        const eff = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {};
        const realmObj = (typeof REALMS !== 'undefined' && REALMS[state.realmIndex]) ? REALMS[state.realmIndex] : { name: 'Phàm Nhân' };

        // 1. Tên, Cảnh Giới, Thế Giới
        const elName = document.getElementById('ui-player-name');
        if (elName) elName.textContent = state.playerName || 'Tiêu Dao Tử';

        const elRealm = document.getElementById('ui-realm-title');
        if (elRealm) elRealm.textContent = realmObj.name || 'Luyện Khí - Tầng 1';

        const elWorld = document.getElementById('ui-world-badge');
        if (elWorld) {
            elWorld.textContent = (state.realmIndex >= 8) ? '[THƯỢNG GIỚI] Tiên Vực' : '[HẠ GIỚI] Phàm Tục';
        }

        // 2. Tổng Lực Chiến (CP)
        const totalCp = Math.round(
            (eff.atk || 50) * 1.5 + 
            (eff.def || 30) * 2 + 
            (eff.maxHp || 500) * 0.1 + 
            (eff.speed || 10) * 5 + 
            (eff.crit || 5) * 20
        );
        const elCp = document.getElementById('ui-total-cp');
        if (elCp) elCp.textContent = `${totalCp.toLocaleString('vi-VN')} CP`;

        // 3. Khí Huyết (HP)
        const curHp = Math.max(0, Math.round(Number(state.hp) || 0));
        const maxHp = Math.max(1, Math.round(Number(eff.maxHp) || 1000));
        const elHpText = document.getElementById('ui-hp-text');
        if (elHpText) elHpText.textContent = `${curHp.toLocaleString('vi-VN')} / ${maxHp.toLocaleString('vi-VN')}`;
        const elHpBar = document.getElementById('ui-hp-bar');
        if (elHpBar) elHpBar.style.width = `${Math.min(100, (curHp / maxHp) * 100)}%`;

        // 4. Linh Lực (MP)
        const curMp = Math.max(0, Math.round(Number(state.mp) || 0));
        const maxMp = Math.max(1, Math.round(Number(eff.maxMp) || 200));
        const elMpText = document.getElementById('ui-mp-text');
        if (elMpText) elMpText.textContent = `${curMp.toLocaleString('vi-VN')} / ${maxMp.toLocaleString('vi-VN')}`;
        const elMpBar = document.getElementById('ui-mp-bar');
        if (elMpBar) elMpBar.style.width = `${Math.min(100, (curMp / maxMp) * 100)}%`;

        // 5. Đạo Tâm & Thọ Nguyên
        const mindVal = Math.min(100, Math.max(0, state.daoTam || 100));
        const elMindText = document.getElementById('ui-mind-text');
        if (elMindText) elMindText.textContent = `${mindVal} / 100`;
        const elMindBar = document.getElementById('ui-mind-bar');
        if (elMindBar) elMindBar.style.width = `${mindVal}%`;

        const curAge = Math.floor(Number(state.age) || 18);
        const maxAge = Math.floor(Number(state.maxAge) || 120);
        const elAgeText = document.getElementById('ui-lifespan-text');
        if (elAgeText) elAgeText.textContent = `${curAge} / ${maxAge} năm`;
        const elAgeBrief = document.getElementById('ui-lifespan-brief');
        if (elAgeBrief) elAgeBrief.textContent = `${curAge} / ${maxAge} năm`;
        const elAgeBar = document.getElementById('ui-lifespan-bar');
        if (elAgeBar) elAgeBar.style.width = `${Math.min(100, (curAge / maxAge) * 100)}%`;

        // 6. Lưới Thuộc Tính Chiến Đấu
        const elAtk = document.getElementById('ui-atk-val');
        if (elAtk) elAtk.textContent = (eff.atk || 50).toLocaleString('vi-VN');

        const elDef = document.getElementById('ui-def-val');
        if (elDef) elDef.textContent = (eff.def || 30).toLocaleString('vi-VN');

        const elSpd = document.getElementById('ui-spd-val');
        if (elSpd) elSpd.textContent = (eff.speed || 10).toLocaleString('vi-VN');

        const elCrit = document.getElementById('ui-crit-val');
        if (elCrit) elCrit.textContent = `${((eff.crit || 5)).toFixed(1)}%`;

        const elEva = document.getElementById('ui-eva-val');
        if (elEva) elEva.textContent = `${((eff.dodge || 3)).toFixed(1)}%`;

        const elPen = document.getElementById('ui-pen-val');
        if (elPen) elPen.textContent = (eff.penetration || 12).toLocaleString('vi-VN');

        const elDrain = document.getElementById('ui-drain-val');
        if (elDrain) elDrain.textContent = `${(eff.lifesteal || 0).toFixed(1)}%`;

        const elRegen = document.getElementById('ui-regen-val');
        if (elRegen) elRegen.textContent = `+${(eff.hpRegen || 5)}/s`;

        // 7. Đồng bộ Linh Căn
        const elRootName = document.getElementById('ui-root-badge');
        if (elRootName) elRootName.innerHTML = `<i class="fa-solid fa-bolt mr-1"></i> ${state.spiritRoot?.name || 'Thiên Lôi Linh Căn'}`;
    }

    // Chuyển Tab Linh Thú / Pháp Bảo trong Character Stats
    window.switchCompanionTab = function (tabType, btnEl) {
        document.querySelectorAll('.companion-tabs-nav .comp-tab-btn').forEach(btn => btn.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        const petTab = document.getElementById('tab-comp-pet');
        const artTab = document.getElementById('tab-comp-artifact');
        if (petTab) petTab.classList.toggle('active', tabType === 'pet');
        if (artTab) artTab.classList.toggle('active', tabType === 'artifact');
    };

    // ========================================================================
    // PHẦN 3: TIÊN MÔN GIA VIÊN LOGIC (ỦY QUYỀN TOÀN DIỆN CHO MAIN.JS)
    // Loại bỏ hoàn toàn bản demo thô cũ (Format 2: Dược Điền, Mỏ Quặng, Hàn Băng Trì)
    // Bảo vệ tuyệt đối 4 Card Glassmorphism chuẩn (Linh Căn Mộc, Dược Tuyền, Khoáng Động, Tiền Trang)
    // ========================================================================
    function initEstateSystem() {
        if (typeof window.updateEstateUI === 'function') {
            window.updateEstateUI();
        }
    }

    function showToastMessage(msg) {
        let toast = document.getElementById('toast-bubble');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-bubble';
            toast.className = 'toast-bubble';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ========================================================================
    // PHẦN 4: TRẤN YÊU THÁP SPRITE BATTLER ENGINE
    // ========================================================================
    const TOWER_BATTLER = {
        floor: 1,
        isFighting: false,
        autoClimb: false,
        autoClimbTimer: null,
        playerCurrentHp: 1000,
        playerMaxHp: 1000,
        bossCurrentHp: 800,
        bossMaxHp: 800,
        turnTimer: null
    };

    function initSpriteTowerBattler() {
        TOWER_BATTLER.floor = state.towerFloor || 1;
        updateTowerStageInfo();
    }

    function updateTowerStageInfo() {
        const floor = TOWER_BATTLER.floor;
        const elTitle = document.getElementById('stage-floor-title');
        if (elTitle) elTitle.textContent = `TẦNG ${floor}`;

        const elBtnLabel = document.getElementById('btn-challenge-label');
        if (elBtnLabel) elBtnLabel.textContent = `KHIÊU CHIẾN TẦNG ${floor}`;

        const eff = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {};
        TOWER_BATTLER.playerMaxHp = Math.max(100, Math.round(eff.maxHp || 1000));
        TOWER_BATTLER.playerCurrentHp = TOWER_BATTLER.playerMaxHp;

        // HP Boss tăng dần theo tầng tháp
        TOWER_BATTLER.bossMaxHp = Math.round(500 * Math.pow(1.15, floor - 1) + floor * 200);
        TOWER_BATTLER.bossCurrentHp = TOWER_BATTLER.bossMaxHp;

        const bossNames = [
            'Huyết Dực Bọ Hung', 'Hắc Giác Cự Xà', 'U Minh Ma Sói', 
            'Độc Nhãn Cự Tinh', 'Thiên Tà Cốt Ma', 'Xích Viêm Hỏa Ma'
        ];
        const bossName = bossNames[(floor - 1) % bossNames.length] + ` (Cấp ${floor})`;
        const elBossName = document.getElementById('boss-title-name');
        if (elBossName) elBossName.innerHTML = `<i class="fa-solid fa-skull mr-1"></i>${bossName}`;

        updateTowerHpDisplays();

        // Cập nhật tỷ số lực chiến
        const playerCp = (eff.atk || 50) * 2 + (eff.def || 30) * 1.5;
        const bossCp = (floor * 35) + 40;
        const ratio = (playerCp / Math.max(1, bossCp)).toFixed(1);
        const elMatchup = document.getElementById('matchup-cp-info');
        if (elMatchup) {
            elMatchup.textContent = `Tỷ số Lực Chiến: ${ratio}x (${ratio >= 1.5 ? 'Áp đảo đối thủ' : 'Đối kháng kịch liệt'})`;
        }
    }

    function updateTowerHpDisplays() {
        const elPlayerHpNum = document.getElementById('player-hp-num');
        if (elPlayerHpNum) elPlayerHpNum.textContent = `${formatCompactNumber(TOWER_BATTLER.playerCurrentHp)} / ${formatCompactNumber(TOWER_BATTLER.playerMaxHp)}`;

        const elPlayerHpFill = document.getElementById('player-hp-fill');
        if (elPlayerHpFill) {
            const pPct = Math.max(0, Math.min(100, (TOWER_BATTLER.playerCurrentHp / TOWER_BATTLER.playerMaxHp) * 100));
            elPlayerHpFill.style.width = `${pPct}%`;
        }

        const elBossHpNum = document.getElementById('boss-hp-num');
        if (elBossHpNum) elBossHpNum.textContent = `${formatCompactNumber(TOWER_BATTLER.bossCurrentHp)} / ${formatCompactNumber(TOWER_BATTLER.bossMaxHp)}`;

        const elBossHpFill = document.getElementById('boss-hp-fill');
        if (elBossHpFill) {
            const bPct = Math.max(0, Math.min(100, (TOWER_BATTLER.bossCurrentHp / TOWER_BATTLER.bossMaxHp) * 100));
            elBossHpFill.style.width = `${bPct}%`;
        }
    }

    window.handleChallengeClick = function () {
        if (TOWER_BATTLER.isFighting) return;
        startTowerBattleRound();
    };

    function startTowerBattleRound() {
        TOWER_BATTLER.isFighting = true;
        const btn = document.getElementById('btn-challenge');
        if (btn) btn.disabled = true;

        logTowerCombat(`⚔️ Bắt đầu đại chiến Tầng ${TOWER_BATTLER.floor}! Hai bên tiến vào thế trận.`);

        let turn = 1;
        function combatStep() {
            if (!TOWER_BATTLER.isFighting) return;

            const eff = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {};
            const playerAtk = eff.atk || 80;
            const bossAtk = Math.round(25 * Math.pow(1.12, TOWER_BATTLER.floor - 1) + 15);

            if (turn % 2 === 1) {
                // Người chơi tấn công Boss
                const playerSprite = document.getElementById('player-sprite-img');
                if (playerSprite) {
                    playerSprite.classList.add('animate-lunge-player');
                    setTimeout(() => playerSprite.classList.remove('animate-lunge-player'), 350);
                }

                const isCrit = Math.random() < ((eff.crit || 15) / 100);
                const dmg = Math.round(playerAtk * (isCrit ? 1.8 : 1.0) * (0.9 + Math.random() * 0.2));
                TOWER_BATTLER.bossCurrentHp = Math.max(0, TOWER_BATTLER.bossCurrentHp - dmg);

                spawnTowerDamage('boss-damage-anchor', dmg, isCrit, false);
                logTowerCombat(`🗡️ Tiêu Dao Tử vung kiếm chém gây <b class="${isCrit ? 'text-amber-400 font-bold' : 'text-slate-200'}">${dmg.toLocaleString()}</b> sát thương!`);

                updateTowerHpDisplays();

                if (TOWER_BATTLER.bossCurrentHp <= 0) {
                    finishTowerBattle(true);
                    return;
                }
            } else {
                // Boss phản kích
                const bossSprite = document.getElementById('boss-sprite-img');
                if (bossSprite) {
                    bossSprite.classList.add('animate-lunge-boss');
                    setTimeout(() => bossSprite.classList.remove('animate-lunge-boss'), 350);
                }

                const isDodge = Math.random() < ((eff.dodge || 10) / 100);
                if (isDodge) {
                    spawnTowerDamage('player-damage-anchor', 'NÉ TRÁNH', false, true);
                    logTowerCombat(`💨 Thân pháp Tiêu Dao Tử phiêu dật, né tránh đòn công của Ma Thú!`);
                } else {
                    const dmg = Math.max(1, Math.round(bossAtk * (0.85 + Math.random() * 0.3) - (eff.def || 30) * 0.3));
                    TOWER_BATTLER.playerCurrentHp = Math.max(0, TOWER_BATTLER.playerCurrentHp - dmg);
                    spawnTowerDamage('player-damage-anchor', dmg, false, false);
                    logTowerCombat(`🩸 Ma Thú gầm thét tấn công gây <b class="text-rose-400">${dmg.toLocaleString()}</b> sát thương!`);
                }

                updateTowerHpDisplays();

                if (TOWER_BATTLER.playerCurrentHp <= 0) {
                    finishTowerBattle(false);
                    return;
                }
            }

            turn++;
            TOWER_BATTLER.turnTimer = setTimeout(combatStep, 900);
        }

        setTimeout(combatStep, 500);
    }

    function finishTowerBattle(won) {
        TOWER_BATTLER.isFighting = false;
        const btn = document.getElementById('btn-challenge');
        if (btn) btn.disabled = false;

        if (won) {
            const rewardStones = Math.round(500 * Math.pow(1.18, TOWER_BATTLER.floor - 1));
            const rewardExp = Math.round(800 * Math.pow(1.15, TOWER_BATTLER.floor - 1));

            state.stones = (state.stones || 0) + rewardStones;
            if (typeof addExp === 'function') addExp(rewardExp);
            else state.exp = (state.exp || 0) + rewardExp;

            logTowerCombat(`🎉 <b class="text-amber-300">VIỄN CHINH THÀNH CÔNG TẦNG ${TOWER_BATTLER.floor}!</b> Phần thưởng: +${rewardStones.toLocaleString()} Linh Thạch, +${rewardExp.toLocaleString()} Tu Vi.`);
            showToastMessage(`Chiến thắng Tầng ${TOWER_BATTLER.floor}! +${rewardStones.toLocaleString()} Linh Thạch`);

            TOWER_BATTLER.floor++;
            state.towerFloor = TOWER_BATTLER.floor;
            updateTowerStageInfo();

            if (typeof updateHUD === 'function') updateHUD();

            // Nếu bật Auto-Climb thì tự động vượt tầng tiếp
            if (TOWER_BATTLER.autoClimb) {
                logTowerCombat(`⚡ Auto-Climb kích hoạt: Đang chuẩn bị tiến vào Tầng ${TOWER_BATTLER.floor}...`);
                TOWER_BATTLER.autoClimbTimer = setTimeout(startTowerBattleRound, 1500);
            }
        } else {
            logTowerCombat(`💀 <b class="text-rose-400">THẤT BẠI TẠI TẦNG ${TOWER_BATTLER.floor}!</b> Cần rèn luyện thêm căn cơ trước khi tái chiến.`);
            showToastMessage(`Thất bại tại Tầng ${TOWER_BATTLER.floor}! Hãy bồi bổ khí huyết.`);
            TOWER_BATTLER.autoClimb = false;
            const toggle = document.getElementById('auto-climb-toggle');
            if (toggle) toggle.checked = false;
        }
    }

    window.toggleAutoClimb = function (enabled) {
        TOWER_BATTLER.autoClimb = Boolean(enabled);
        if (TOWER_BATTLER.autoClimb && !TOWER_BATTLER.isFighting) {
            startTowerBattleRound();
        } else if (!TOWER_BATTLER.autoClimb && TOWER_BATTLER.autoClimbTimer) {
            clearTimeout(TOWER_BATTLER.autoClimbTimer);
        }
    };

    function spawnTowerDamage(anchorId, text, isCrit, isDodge) {
        const anchor = document.getElementById(anchorId);
        if (!anchor) return;

        const el = document.createElement('div');
        el.className = 'damage-pop-text';
        if (isCrit) el.classList.add('crit');
        if (isDodge) el.classList.add('dodge');
        el.textContent = (typeof text === 'number') ? `-${text}` : text;

        anchor.appendChild(el);
        setTimeout(() => el.remove(), 950);
    }

    function logTowerCombat(msg) {
        const logBox = document.getElementById('combat-log-scroll');
        if (!logBox) return;

        const row = document.createElement('div');
        row.className = 'log-entry';
        row.innerHTML = msg;
        logBox.appendChild(row);
        while (logBox.children.length > 50 && logBox.firstElementChild) {
            logBox.firstElementChild.remove();
        }
        logBox.scrollTop = logBox.scrollHeight;
    }

    window.fullHealPlayer = function () {
        TOWER_BATTLER.playerCurrentHp = TOWER_BATTLER.playerMaxHp;
        updateTowerHpDisplays();
        showToastMessage('Đã vận công hồi phục 100% Khí Huyết!');
    };

    // ========================================================================
    // TỰ ĐỘNG KHỞI TẠO & HOOK VÀO VÒNG LẶP UPDATE HUD
    // ========================================================================
    function initAllMasterDemos() {
        console.log('⚡ [MasterDemos] Initializing integrated demo systems...');
        // initEstateSystem(); // Ủy quyền hoàn toàn cho main.js
        initSpriteTowerBattler();
        updateMasterTopBar();
        renderMasterCharacterStats();

        // Hook vào updateHUD nếu có
        if (typeof window.updateHUD === 'function') {
            const originalUpdateHUD = window.updateHUD;
            window.updateHUD = function () {
                originalUpdateHUD.apply(this, arguments);
                updateMasterTopBar();
                renderMasterCharacterStats();
            };
        }

        // Định kỳ cập nhật topbar và character stats mỗi 1s
        if (window._masterDemosInterval) {
            clearInterval(window._masterDemosInterval);
            window._masterDemosInterval = null;
        }
        window._masterDemosInterval = setInterval(() => {
            updateMasterTopBar();
            renderMasterCharacterStats();
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllMasterDemos);
    } else {
        initAllMasterDemos();
    }

    // Export ra window để các module khác có thể gọi
    window.MasterDemos = {
        updateTopBar: updateMasterTopBar,
        renderCharacterStats: renderMasterCharacterStats,
        initEstate: initEstateSystem,
        initTowerBattler: initSpriteTowerBattler,
        get estateData() { return window.ESTATE_NODES || null; },
        towerData: TOWER_BATTLER
    };

})(window);
