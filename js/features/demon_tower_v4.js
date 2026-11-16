// ============================================================================
// TRAN YEU THAP V4 (IIFE ISOLATED + DIRECT window.GameState BINDING)
// ============================================================================
(function () {

        /**
         * 1. HỆ THỐNG NGŨ HÀNH KIẾM Ý & TƯƠNG KHẮC
         */

        /**
         * 5. TRẠNG THÁI NGƯỜI CHƠI & ĐẤU TRƯỜNG V2
         */
        let towerState = {
            customBattle: null,
            autoCombat: true, // true = Tự Động, false = Thủ Công
            skillCooldowns: { 0: 0, 1: 0, 2: 0 },
            bossChargingUlt: false,
            linhThach: 0,
            tuVi: 0,
            realmName: "Luyện Khí Tầng 1",
            highestCleared: 0,
            selectedFloor: 1,
            selectedTier: 1,
            activeManualId: "thanh_lien_kiem_dien",
            selectedUltId: 2, // Mặc định chọn Thức 3 (Tuyệt Thế Tiên Thuật) của Thanh Liên Kiếm Điển
            combatSpeed: 1,
            inCombat: false,
            combatTimer: null,
            battleTurns: 0,
            maxDamageDealt: 0,
            maxCombo: 0,

            skyTheme: 'cosmic', // 'cosmic' | 'bloodmoon' | 'thunder' | 'immortal'
            wingsEnabled: true,
            phapTuongEnabled: true,
            tamThanhEnabled: true, // Nhất Khí Hóa Tam Thanh (2 Nguyên Thần Phân Thân trợ chiến)
            sfxEnabled: false,

            hero: {
                name: 'Tiêu Dao Tử',
                maxHp: 500,
                hp: 500,
                mp: 0,
                maxMp: 100,
                atk: 28,
                def: 14,
                crit: 10,
                critDmg: 1.5,
                eva: 5,
                element: 'Kim',
                swordCount: 6
            },

            liveBossHp: 920000,
            liveBossMaxHp: 920000,
            liveBossMp: 0,
            liveBossToughness: 100,
            liveBossBrokenTurns: 0,
            comboCount: 0,

            domainActive: false,
            domainTicksLeft: 0,
            shieldBellTurns: 0, // Đông Hoàng Chung Hộ Thể
            bossEnragedVisual: false,
            bossBrokenVisual: false,

            activeGuardian: null,
            capturedSouls: [],
            lootBag: []
        };
        window.towerState = towerState;

        /**
         * 5.1 ĐỒNG BỘ DỮ LIỆU VỚI GAME CHÍNH (VẠN CỔ TU TIÊN)
         */
        function syncWithParent(payload) {
            if (!payload) return;
            try {
                if (typeof window.handleTowerSyncMessage === 'function') {
                    window.handleTowerSyncMessage(payload);
                    return;
                }
                if (window.parent && window.parent !== window && typeof window.parent.handleTowerSyncMessage === 'function') {
                    window.parent.handleTowerSyncMessage(payload);
                }
            } catch (err) {
                console.warn('[DemonTower V4] syncWithParent error:', err);
            }
        }

        function applyMainGameData(data) {
            if (!data || towerState.inCombat) return;
            try {
                if (data.linhThach !== undefined) towerState.linhThach = Number(data.linhThach) || 0;
                if (data.tuVi !== undefined) towerState.tuVi = Number(data.tuVi) || 0;
                if (data.realmName) towerState.realmName = String(data.realmName);
                if (data.highestCleared !== undefined) towerState.highestCleared = Math.max(0, Number(data.highestCleared) || 0);

                if (data.selectedFloor !== undefined) {
                    towerState.selectedFloor = Math.max(1, Math.min(50, Number(data.selectedFloor) || 1));
                } else if (data.highestCleared !== undefined) {
                    towerState.selectedFloor = Math.max(1, Math.min(50, towerState.highestCleared + 1));
                }

                if (data.selectedTier !== undefined) {
                    towerState.selectedTier = Math.max(1, Math.min(5, Number(data.selectedTier) || 1));
                } else {
                    towerState.selectedTier = Math.ceil(towerState.selectedFloor / 10) || 1;
                }

                if (data.hero) {
                    if (data.hero.maxHp) {
                        towerState.hero.maxHp = Number(data.hero.maxHp);
                        towerState.hero.hp = Number(data.hero.hp || data.hero.maxHp);
                    }
                    if (data.hero.atk !== undefined) towerState.hero.atk = Number(data.hero.atk);
                    if (data.hero.def !== undefined) towerState.hero.def = Number(data.hero.def);
                    if (data.hero.crit !== undefined) towerState.hero.crit = Number(data.hero.crit);
                    if (data.hero.critDmg !== undefined) towerState.hero.critDmg = Number(data.hero.critDmg);
                    if (data.hero.lifesteal !== undefined) towerState.hero.lifesteal = Number(data.hero.lifesteal) || 0;
                    if (data.hero.eva !== undefined) towerState.hero.eva = Number(data.hero.eva);
                    towerState.hero.tier = data.hero.tier;
                    towerState.hero.realmIndex = data.hero.realmIndex;
                    towerState.hero.armorPen = data.hero.armorPen || 0;
                    towerState.hero.critResist = data.hero.critResist || 0;
                    if (data.hero.element) towerState.hero.element = String(data.hero.element);
                    if (data.hero.swordCount) towerState.hero.swordCount = Number(data.hero.swordCount);
                    if (data.hero.swordFormationLevel !== undefined) towerState.hero.swordFormationLevel = Number(data.hero.swordFormationLevel) || 0;
                    if (data.hero.swordFormationOpeningPct !== undefined) towerState.hero.swordFormationOpeningPct = Number(data.hero.swordFormationOpeningPct) || 0;
                }

                const heroName = data.characterName || data.playerName;
                if (heroName) {
                    const nameEl = document.getElementById('hero-display-name');
                    if (nameEl) nameEl.innerHTML = `<span>🗡️</span> ${heroName} • `;
                }

                if (data.activeManualId) towerState.activeManualId = data.activeManualId;
                if (data.selectedUltId !== undefined) towerState.selectedUltId = data.selectedUltId;
                if (Array.isArray(data.capturedSouls)) {
                    towerState.capturedSouls = data.capturedSouls;
                }
                if (Array.isArray(data.lootBag)) {
                    towerState.lootBag = data.lootBag;
                }
                if (Object.prototype.hasOwnProperty.call(data, 'activeGuardian')) {
                    towerState.activeGuardian = data.activeGuardian;
                    const guardEl = document.getElementById('guardian-spirit-name');
                    if (guardEl) {
                        guardEl.textContent = data.activeGuardian ? `${data.activeGuardian.icon || '🐺'} ${data.activeGuardian.name}` : 'Chưa có Hộ Pháp';
                    }
                }

                // Update UI elements
                const ltEl = document.getElementById('ui-linh-thach');
                if (ltEl) ltEl.textContent = fmt(towerState.linhThach);
                const tvEl = document.getElementById('ui-tu-vi');
                if (tvEl) tvEl.textContent = fmt(towerState.tuVi);
                const clrEl = document.getElementById('ui-cleared-badge');
                if (clrEl) clrEl.textContent = `Đã vượt: ${towerState.highestCleared}/50 Tầng`;
                const rlmEl = document.getElementById('header-realm-tag');
                if (rlmEl) rlmEl.textContent = `Cảnh Giới: ${towerState.realmName}`;
                const swdEl = document.getElementById('ui-sword-count-top');
                if (swdEl) swdEl.textContent = towerState.hero.swordCount;
                const elemTag = document.getElementById('hero-element-tag');
                if (elemTag && ELEMENTS[towerState.hero.element]) {
                    elemTag.textContent = ELEMENTS[towerState.hero.element].name;
                }

                if (typeof selectTierGroup === 'function') selectTierGroup(towerState.selectedTier);
                if (typeof selectFloor === 'function') selectFloor(towerState.selectedFloor);
                if (typeof renderLootBag === 'function') renderLootBag();
                if (typeof renderCapturedSouls === 'function') renderCapturedSouls();
                if (typeof updateClimbProgressHUD === 'function') updateClimbProgressHUD();
            } catch (err) {
                console.warn('[DemonTower V4] applyMainGameData error:', err);
            }
        }

        function tryDirectSyncFromParent() {
            try {
                const getter = typeof window.getTowerSyncPayload === 'function'
                    ? window.getTowerSyncPayload
                    : (window.parent && window.parent !== window && typeof window.parent.getTowerSyncPayload === 'function'
                        ? window.parent.getTowerSyncPayload
                        : null);
                if (getter) {
                    const p = getter();
                    if (p) {
                        applyMainGameData(p);
                        return true;
                    }
                }
            } catch (e) {
                console.warn('[DemonTower V4] tryDirectSyncFromParent error:', e);
            }
            return false;
        }

        let isTowerHibernated = false;
        function isTowerActive() {
            if (isTowerHibernated) return false;
            if (document.hidden) return false;
            const modalEl = document.getElementById('modal-tran-yeu-thap') || document.getElementById('tran-yeu-thap-popup');
            if (modalEl && (modalEl.classList.contains('hidden') || modalEl.style.display === 'none' || !modalEl.classList.contains('active'))) {
                return false;
            }
            if (window.parent && window.parent !== window) {
                try {
                    const parentModal = window.parent.document.getElementById('modal-tran-yeu-thap');
                    if (parentModal && (parentModal.classList.contains('hidden') || parentModal.style.display === 'none')) {
                        return false;
                    }
                } catch (e) {}
            }
            return true;
        }

        window.addEventListener('message', (event) => {
            if (!event.data) return;
            if (event.data.type === 'van-thien-luc:tower-init-data' || event.data.type === 'van-thien-luc:tower-update-hero') {
                isTowerHibernated = false;
                applyMainGameData(event.data.data);
                if (typeof window.wakeTowerEffects === 'function') window.wakeTowerEffects();
                if (typeof renderTowerHeader === 'function') renderTowerHeader();
                if (typeof renderHeroCard === 'function') renderHeroCard();
            } else if (event.data.type === 'van-thien-luc:tower-pause') {
                isTowerHibernated = true;
                if (typeof window.pauseTowerEffects === 'function') window.pauseTowerEffects();
            } else if (event.data.type === 'van-thien-luc:tower-resume') {
                isTowerHibernated = false;
                if (typeof window.wakeTowerEffects === 'function') window.wakeTowerEffects();
            } else if (event.data.type === 'van-thien-luc:start-custom-battle') {
                isTowerHibernated = false;
                const enemy = event.data.enemy;
                if (enemy) {
                    towerState.customBattle = enemy;
                    tryDirectSyncFromParent();
                    if (typeof window.wakeTowerEffects === 'function') window.wakeTowerEffects();
                    if (typeof setupCustomBattleUI === 'function') setupCustomBattleUI(enemy);
                }
            }
        });

        /**
         * 6. ÂM LUẬT KIẾM HIỆP SYNTHESIZER
         */
        const _globalPlaySound = (typeof window !== 'undefined' && typeof window.playSound === 'function') ? window.playSound : null;
        function playSound(type) {
            if (!_globalPlaySound) return;
            const forceForTower = Boolean(towerState && towerState.sfxEnabled && typeof window !== 'undefined' && window.soundEnabled);
            _globalPlaySound(type, forceForTower);
        }

        function toggleSoundFX() {
            towerState.sfxEnabled = !towerState.sfxEnabled;
            const btn = document.getElementById('btn-sfx-toggle');
            btn.innerHTML = towerState.sfxEnabled ? `<span>🔊</span>` : `<span>🔇</span>`;
            btn.setAttribute('aria-pressed', String(towerState.sfxEnabled));
        }

        function togglePhapTuongMode() {
            towerState.phapTuongEnabled = !towerState.phapTuongEnabled;
            const btn = document.getElementById('btn-phap-tuong');
            if (btn) {
                btn.textContent = towerState.phapTuongEnabled ? "🐉 Pháp Tướng: BẬT" : "🐉 Pháp Tướng: TẮT";
                btn.setAttribute('aria-pressed', String(towerState.phapTuongEnabled));
            }
            if (towerState.phapTuongEnabled) {
                spawnCalligraphySeal('龍神', 450, 220, '#38bdf8');
            }
        }

        function toggleDivineWings() {
            towerState.wingsEnabled = !towerState.wingsEnabled;
            const btn = document.getElementById('btn-wings-toggle');
            if (btn) {
                btn.textContent = towerState.wingsEnabled ? "🪽 Thần Dực" : "🪽 Tắt Dực";
                btn.setAttribute('aria-pressed', String(towerState.wingsEnabled));
            }
            if (towerState.wingsEnabled) {
                spawnCalligraphySeal('神翼', 280, 260, '#c084fc');
            }
        }

        function toggleThreePureClones() {
            towerState.tamThanhEnabled = !towerState.tamThanhEnabled;
            const btn = document.getElementById('btn-tam-thanh');
            if (btn) {
                btn.textContent = towerState.tamThanhEnabled ? "👥 Hóa Tam Thanh: BẬT" : "👥 Hóa Tam Thanh: TẮT";
                btn.setAttribute('aria-pressed', String(towerState.tamThanhEnabled));
            }
            playSound('bell');
            const canvas = document.getElementById('combat-canvas');
            if (canvas && towerState.tamThanhEnabled) {
                spawnCalligraphySeal('一氣化三清', canvas.width * 0.24, canvas.height * 0.35, '#38bdf8');
                triggerAnimeCutIn("NHẤT KHÍ HÓA TAM THANH!", "THÁI THANH • THƯỢNG THANH • NGỌC THANH ĐỒNG XUẤT", "👥");
                addLog(`<span class="text-cyan-300 font-bold">👥 [Nhất Khí Hóa Tam Thanh]</span> Đạo hữu phân hóa ra 2 đạo <strong>Nguyên Thần Đạo Thân</strong> (Viêm Đế Hỏa Thân & Lôi Đế Pháp Thân) cùng kết Tam Tài Kiếm Trận vây công Yêu Vương!`);
            }
        }

        function triggerCinemaLetterbox(quoteText = "✦ NHẤT CHU THẢO TRẢM TẬN NHẬT NGUYỆT TINH THẦN ✦", duration = 2300) {
            const arena = document.getElementById('arena-viewport');
            const quoteEl = document.getElementById('cinema-top-quote');
            if (!arena) return;
            if (quoteEl && quoteText) quoteEl.textContent = quoteText;
            arena.classList.add('cinema-mode-active');
            scheduleTowerEffect(() => {
                arena.classList.remove('cinema-mode-active');
            }, duration);
        }

        function triggerTimeStopVisual(duration = 1150) {
            const arena = document.getElementById('arena-viewport');
            if (!arena) return;
            arena.classList.remove('vfx-timestop-frame');
            void arena.offsetWidth;
            arena.classList.add('vfx-timestop-frame');
            scheduleTowerEffect(() => {
                arena.classList.remove('vfx-timestop-frame');
            }, duration);
        }

        function setSkyTheme(theme) {
            towerState.skyTheme = theme;
            const themes = ['cosmic', 'bloodmoon', 'thunder', 'immortal'];
            themes.forEach(th => {
                const btn = document.getElementById(`sky-btn-${th}`);
                if (!btn) return;
                if (th === theme) {
                    btn.className = "px-2 py-0.5 rounded bg-indigo-600/40 text-amber-200 border border-amber-400/70 font-bold transition";
                } else {
                    btn.className = "px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition";
                }
            });

            const arena = document.getElementById('arena-viewport');
            if (theme === 'bloodmoon') {
                arena.style.background = "radial-gradient(ellipse at 50% 0%, #4c0519 0%, #18040c 58%, #030104 100%)";
                spawnCalligraphySeal('血月', 500, 180, '#f43f5e');
            } else if (theme === 'thunder') {
                arena.style.background = "radial-gradient(ellipse at 50% 0%, #3b0764 0%, #0f0728 58%, #020307 100%)";
                spawnCalligraphySeal('雷池', 500, 180, '#c084fc');
            } else if (theme === 'immortal') {
                arena.style.background = "radial-gradient(ellipse at 50% 0%, #064e3b 0%, #0c192c 58%, #020409 100%)";
                spawnCalligraphySeal('仙境', 500, 180, '#fde047');
            } else {
                arena.style.background = "radial-gradient(ellipse at 50% 0%, #1a1642 0%, #070a14 58%, #020307 100%)";
                spawnCalligraphySeal('星河', 500, 180, '#38bdf8');
            }
        }

        function triggerAnimeCutIn(title, subtitle, icon = "🌌") {
            const wrap = document.getElementById('anime-cutin-banner');
            const titleEl = document.getElementById('cutin-title');
            const subEl = document.getElementById('cutin-subtitle');
            const iconEl = document.getElementById('cutin-icon');
            if (!wrap) return;

            titleEl.textContent = title;
            subEl.textContent = subtitle;
            iconEl.textContent = icon;

            wrap.classList.remove('hidden', 'anime-cutin-active');
            void wrap.offsetWidth;
            wrap.classList.add('anime-cutin-active');
            scheduleTowerEffect(() => {
                wrap.classList.add('hidden');
            }, 1650);
        }

        /**
         * ============================================================================
         * 7. ĐẠI ENGINE ĐỒ HỌA V2: PHƯỢNG HOÀNG LỬA, THÁI CỰC HỖN ĐỘN LUÂN, KHAI THIÊN MÔN & ĐÔNG HOÀNG CHUNG
         * ============================================================================
         */
        let canvasProjectiles = [];
        const towerSwordPool = [];
        const towerParticlePool = [];
        let canvasCrescents = [];
        let canvasLaserBeams = [];
        let canvasLightningArcs = [];
        let canvasSpaceCracks = [];
        let canvasCalligraphy = [];
        let canvasParticles = [];
        let canvasShockwaves = [];
        let canvasSlashes = [];
        let canvasColossalSwords = [];
        let canvasPhoenixes = [];
        let canvasTaijiWheels = [];
        let canvasHeavenSplits = [];
        let canvasGiantPalms = [];
        let canvasFireLotuses = [];
        let canvasBlackHoles = [];
        let canvasBuddhaSeals = [];
        let canvasIcePillars = [];
        let canvasMeteors = [];
        let canvasReincarnationWheels = [];
        window.canvasProjectiles = canvasProjectiles;
        window.canvasParticles = canvasParticles;
        const towerEffectTimers = new Set();
        function scheduleTowerEffect(callback, delay) {
            const timerId = window.setTimeout(() => {
                towerEffectTimers.delete(timerId);
                callback();
            }, delay);
            towerEffectTimers.add(timerId);
            return timerId;
        }
        function cancelTowerEffects() {
            towerEffectTimers.forEach(timerId => window.clearTimeout(timerId));
            towerEffectTimers.clear();
            // Dọn sạch các mảng hạt hiệu ứng thừa để giải phóng bộ nhớ
            canvasProjectiles.length = 0;
            canvasCrescents.length = 0;
            canvasLaserBeams.length = 0;
            canvasLightningArcs.length = 0;
            canvasSpaceCracks.length = 0;
            canvasCalligraphy.length = 0;
            canvasParticles.length = 0;
            canvasShockwaves.length = 0;
            canvasSlashes.length = 0;
            canvasColossalSwords.length = 0;
            canvasPhoenixes.length = 0;
            canvasTaijiWheels.length = 0;
            canvasHeavenSplits.length = 0;
            canvasGiantPalms.length = 0;
            canvasFireLotuses.length = 0;
            canvasBlackHoles.length = 0;
            canvasBuddhaSeals.length = 0;
            canvasIcePillars.length = 0;
            canvasMeteors.length = 0;
            canvasReincarnationWheels.length = 0;
            canvasCelestialPlanets.length = 0;
            canvasTribulationEyes.length = 0;
            canvasGlassShards.length = 0;
            if (typeof heroAnim !== 'undefined' && heroAnim.afterimages) heroAnim.afterimages.length = 0;
        }
        let canvasCelestialPlanets = [];
        let canvasTribulationEyes = [];
        let canvasGlassShards = [];
        let ambientDust = [];
        let backgroundSwords = [];
            const formationCache = new Map();
            function getFormationSprite(width, height, domainActive) {
                const key = `${Math.round(width)}x${Math.round(height)}:${domainActive ? 'domain' : 'normal'}`;
                let cached = formationCache.get(key);
                if (cached) return cached;
                const off = document.createElement('canvas');
                off.width = Math.ceil(width);
                off.height = Math.ceil(height * 0.62);
                const c = off.getContext('2d');
                c.translate(width * 0.5, height * 0.31);
                c.scale(1, 0.31);
                const ringColor = domainActive ? 'rgba(56, 189, 248, 0.72)' : 'rgba(245, 158, 11, 0.36)';
                c.strokeStyle = ringColor;
                c.lineWidth = 3.8;
                c.shadowColor = domainActive ? '#06b6d4' : '#f59e0b';
                c.shadowBlur = 26;
                c.beginPath(); c.arc(0, 0, width * 0.37, 0, Math.PI * 2); c.stroke();
                c.shadowBlur = 0;
                c.lineWidth = 2;
                c.setLineDash([14, 10]);
                c.beginPath(); c.arc(0, 0, width * 0.29, 0, Math.PI * 2); c.stroke();
                c.setLineDash([]);
                for (let s = 0; s < 2; s++) {
                    c.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const a = s * (Math.PI / 3) + (i * Math.PI * 2) / 3;
                        const rx = Math.cos(a) * width * 0.29;
                        const ry = Math.sin(a) * width * 0.29;
                        if (i === 0) c.moveTo(rx, ry); else c.lineTo(rx, ry);
                    }
                    c.closePath(); c.stroke();
                }
                if (formationCache.size > 8) formationCache.delete(formationCache.keys().next().value);
                formationCache.set(key, off);
                return off;
            }
        let starfield = [];
        let godRays = [];

        let arenaCam = {
            scale: 1.0,
            targetScale: 1.0,
            offsetX: 0,
            offsetY: 0
        };

        let heroAnim = {
            dashOffset: 0,
            hitFlash: 0,
            dodgeOffset: 0,
            avatarSlashAngle: 0,
            afterimages: []
        };
        let bossAnim = {
            dashOffset: 0,
            hitFlash: 0,
            dodgeOffset: 0,
            avatarSlashAngle: 0
        };

        function triggerCameraZoom(zoom = 1.09, duration = 450) {
            // Giữ cố định tỷ lệ khung hình đấu trường (1.0) để tránh zoom in/out nhấp nháy
            arenaCam.scale = 1.0;
            arenaCam.targetScale = 1.0;
        }

        function triggerAnimeImpactFrame() {
            const arena = document.getElementById('arena-viewport');
            if (!arena) return;
            arena.classList.remove('vfx-impact-frame');
            void arena.offsetWidth;
            arena.classList.add('vfx-impact-frame');
        }

        function getCurrentEnemy() {
            if (towerState && towerState.currentEnemy) return towerState.currentEnemy;
            if (towerState && towerState.customBattle) {
                const cb = towerState.customBattle;
                return {
                    floor: cb.floor || 1,
                    name: cb.name || 'Đối Thủ',
                    title: cb.titleBadge || cb.name,
                    realmUnlock: cb.realm || 'Trúc Cơ',
                    element: cb.element || 'Hỏa',
                    hp: Number(cb.hp || cb.maxHp || 100000),
                    maxHp: Number(cb.hp || cb.maxHp || 100000),
                    atk: Number(cb.atk || 12000),
                    def: Number(cb.def || 4000),
                    crit: Number(cb.crit || 15),
                    eva: Number(cb.eva || 10),
                    cp: Number(cb.cp || (cb.atk * 3 + cb.hp * 0.1)),
                    icon: cb.icon || '👹',
                    drops: Array.isArray(cb.drops) ? cb.drops : [
                        { id: 'custom_reward', name: cb.rewards || 'Chiến Lợi Phẩm', rarity: 'rare', icon: cb.icon || '🎁', desc: cb.rewards || 'Phần thưởng chiến thắng' }
                    ]
                };
            }
            return (typeof TOWER_50_FLOORS !== 'undefined' ? TOWER_50_FLOORS.find(f => f.floor === (towerState ? towerState.selectedFloor : 1)) : null) || {
                floor: 1, name: 'Yêu Quái', element: 'Kim', hp: 100000, maxHp: 100000, atk: 10000, def: 2000, crit: 10, eva: 5, cp: 50000, drops: []
            };
        }

        // THẦN THÔNG TRÌNH DIỄN 1: MƯA VẠN KIẾM TRIỀU TÔNG
        function triggerSwordRainSpectacle() {
            if (towerState.inCombat && !resolvingPlayerTurn) { queuedTowerAction = () => triggerSwordRainSpectacle(); addLog('📜 Đã chuẩn bị thần thông cho lượt kế tiếp.'); return; }
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;
            const elemObj = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;

            playSound('thunder');
            playSound('bell');
            triggerScreenShake('ult');
            triggerAnimeImpactFrame();
            triggerCameraZoom(1.12, 900);
            triggerAnimeCutIn("VẠN KIẾM TRIỀU TÔNG!", "CỬU THIÊN THẦN KIẾM TỀ HẠ", "☄️");

            spawnCalligraphySeal('萬劍朝宗', w * 0.5, h * 0.36, elemObj.color);

            for (let i = 0; i < 24; i++) {
                scheduleTowerEffect(() => {
                    const startX = w * (0.05 + Math.random() * 0.65);
                    const startY = -60 - Math.random() * 140;
                    const targetX = w * (0.62 + Math.random() * 0.32);
                    const targetY = h * (0.35 + Math.random() * 0.42);

                    spawnFlyingSwordProjectile(
                        startX, startY,
                        targetX, targetY,
                        i % 2 === 0 ? elemObj.glow : '#06b6d4',
                        i % 2 === 0 ? elemObj.color : '#ffffff',
                        i % 4 === 0,
                        1.05 + Math.random() * 0.45
                    );
                }, i * 13);
            }

            if (towerState.inCombat && towerState.liveBossHp > 0) {
                const rainDmg = towerDamage(towerState.hero, getCurrentEnemy(), 1.9);
                towerState.liveBossHp = Math.max(0, towerState.liveBossHp - rainDmg);
                if (towerState.liveBossBrokenTurns <= 0) {
                    towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - 35);
                }
                bossAnim.hitFlash = 8;
                incrementCombo();
                spawnFloatingText('boss-stage-anchor', `☄️ VẠN KIẾM TRIỀU TÔNG -${fmt(rainDmg)}!`, 'ult');
                updateBarsUI(
                    towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
            }
        }

        // THẦN THÔNG TRÌNH DIỄN 2: NHẤT KIẾM KHAI THIÊN MÔN (CHÉM ĐÔI BẦU TRỜI & NỨT VỠ HƯ KHÔNG)
        function triggerHeavenSplitSpectacle() {
            if (towerState.inCombat && !resolvingPlayerTurn) { queuedTowerAction = () => triggerHeavenSplitSpectacle(); addLog('📜 Đã chuẩn bị thần thông cho lượt kế tiếp.'); return; }
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;

            playSound('thunder');
            playSound('bell');
            triggerScreenShake('ult');
            triggerAnimeImpactFrame();
            triggerCameraZoom(1.15, 1000);
            triggerAnimeCutIn("NHẤT KIẾM KHAI THIÊN MÔN!", "THƯỢNG CỔ CẤM THUẬT • TRẢM ĐỨT CÀN KHÔN", "🌌");

            canvasHeavenSplits.push({
                life: 1.0,
                color1: '#e879f9',
                color2: '#38bdf8'
            });

            spawnCalligraphySeal('開天闢地', w * 0.5, h * 0.35, '#fde047');
            spawnSpaceShatter(w * 0.75, h * 0.52, '#e879f9', 18);

            if (towerState.inCombat && towerState.liveBossHp > 0) {
                const splitDmg = towerDamage(towerState.hero, getCurrentEnemy(), 2.45);
                towerState.liveBossHp = Math.max(0, towerState.liveBossHp - splitDmg);
                if (towerState.liveBossBrokenTurns <= 0) {
                    towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - 55);
                }
                bossAnim.hitFlash = 10;
                incrementCombo();
                spawnFloatingText('boss-stage-anchor', `🌌 KHAI THIÊN NHẤT KIẾM -${fmt(splitDmg)}!`, 'ult');
                updateBarsUI(
                    towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
            }
        }

        // THẦN THÔNG TRÌNH DIỄN 3: NHẤT CHU THẢO TRẢM TẬN NHẬT NGUYỆT TINH THẦN (MỘT CỌNG CỎ CHÉM ĐÔI NHẬT NGUYỆT TINH TÚ)
        function triggerGrassCutsStarsSpectacle() {
            if (towerState.inCombat && !resolvingPlayerTurn) { queuedTowerAction = () => triggerGrassCutsStarsSpectacle(); addLog('📜 Đã chuẩn bị thần thông cho lượt kế tiếp.'); return; }
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;

            playSound('thunder');
            playSound('bell');
            triggerScreenShake('ult');
            triggerCinemaLetterbox("✦ THẢO TỰ KIẾM QUYẾT • NHẤT CHU THẢO TRẢM TẬN NHẬT NGUYỆT TINH THẦN ✦", 2800);
            triggerAnimeCutIn("NHẤT THẢO TRẢM TINH THẦN!", "MỘT CỌNG CỎ CHÉM RỤNG NHẬT NGUYỆT TINH TÚ", "🌿");
            triggerCameraZoom(1.16, 1200);

            // Triệu hồi 3 Tinh Cầu Thái Cổ (Thái Dương Tinh, Thái Âm Tinh, Đế Tinh) trên bầu trời bị chém làm đôi!
            canvasCelestialPlanets.push(
                { x: w * 0.35, y: h * 0.24, r: 44, color1: '#fde047', color2: '#ea580c', ring: false, splitOffset: 0, life: 1.0, name: '日' },
                { x: w * 0.56, y: h * 0.20, r: 38, color1: '#e0f2fe', color2: '#38bdf8', ring: true, splitOffset: 0, life: 1.0, name: '月' },
                { x: w * 0.76, y: h * 0.26, r: 48, color1: '#c084fc', color2: '#6366f1', ring: true, splitOffset: 0, life: 1.0, name: '星' }
            );

            // Vết chém Lục Ngọc Đại Đạo cắt ngang cả 3 hành tinh và chém thẳng xuống Yêu Vương
            scheduleTowerEffect(() => {
                triggerAnimeImpactFrame();
                spawnLaserBeam(w * 0.04, h * 0.14, w * 0.96, h * 0.32, '#10b981', 38);
                spawnLaserBeam(w * 0.18, h * 0.62, w * 0.92, h * 0.45, '#34d399', 44);
                spawnCalligraphySeal('斬日月星辰', w * 0.52, h * 0.38, '#6ee7b7');
                spawnGlassShatterShards(w * 0.72, h * 0.48, '#34d399', 26);
            }, 220);

            if (towerState.inCombat && towerState.liveBossHp > 0) {
                const grassDmg = towerDamage(towerState.hero, getCurrentEnemy(), 3.2);
                towerState.liveBossHp = Math.max(0, towerState.liveBossHp - grassDmg);
                towerState.liveBossToughness = 0;
                bossAnim.hitFlash = 12;
                incrementCombo();
                spawnFloatingText('boss-stage-anchor', `🌿 NHẤT THẢO TRẢM TINH THẦN -${fmt(grassDmg)}!`, 'ult');
                updateBarsUI(
                    towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
            }
        }

        // THẦN THÔNG TRÌNH DIỄN 4: CỬU TRỌNG LÔI KIẾP & NGHỊCH THIÊN PHẠT ĐẠO (CHÉM ĐÔI THIÊN ĐẠO PHÁP NHÃN)
        function triggerHeavenlyTribulationEvent() {
            if (towerState.inCombat && !resolvingPlayerTurn) { queuedTowerAction = () => triggerHeavenlyTribulationEvent(); addLog('📜 Đã chuẩn bị thần thông cho lượt kế tiếp.'); return; }
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;

            playSound('thunder');
            playSound('bell');
            triggerScreenShake('ult');
            triggerCinemaLetterbox("⚡ CỬU TRỌNG HỒNG MÔNG LÔI KIẾP • NGHỊCH THIÊN TRẢM PHÁP NHÃN ⚡", 2900);
            triggerAnimeCutIn("NGHỊCH THIÊN PHẠT ĐẠO!", "DÙNG PHÀM THÂN TRẢM ĐỨT THIÊN ĐẠO PHÁP NHÃN", "👁️");
            triggerCameraZoom(1.15, 1300);

            canvasTribulationEyes.push({
                x: w * 0.52,
                y: h * 0.22,
                life: 1.0,
                slashed: false
            });

            // 9 Đạo Hồng Mông Tử Tiêu Thần Lôi giáng liên hoàn
            for (let i = 0; i < 9; i++) {
                scheduleTowerEffect(() => {
                    playSound('thunder');
                    const lx = w * (0.64 + (Math.random() - 0.5) * 0.26);
                    const ly = h * (0.48 + (Math.random() - 0.5) * 0.16);
                    spawnLightningArc(w * 0.52, h * 0.22, lx, ly, i % 2 === 0 ? '#fde047' : '#e879f9');
                    spawnLaserBeam(w * 0.52, h * 0.22, lx, ly, i % 2 === 0 ? '#a855f7' : '#fde047', 22);
                    canvasShockwaves.push({ x: lx, y: ly, r: 10, maxR: 130, alpha: 0.95, color: '#e879f9' });

                    if (i === 5) {
                        // Ở đạo lôi kiếp thứ 6, Kiếm Tiên bay lên chém đứt đôi Con Mắt Thiên Đạo!
                        canvasTribulationEyes.forEach(ey => ey.slashed = true);
                        triggerAnimeImpactFrame();
                        spawnLaserBeam(w * 0.18, h * 0.55, w * 0.85, h * 0.08, '#fde047', 48);
                        spawnCalligraphySeal('逆天伐道', w * 0.52, h * 0.24, '#fde047');
                        spawnGlassShatterShards(w * 0.52, h * 0.22, '#fde047', 28);
                    }
                }, i * 110);
            }

            if (towerState.inCombat && towerState.liveBossHp > 0) {
                const tribDmg = towerDamage(towerState.hero, getCurrentEnemy(), 3.1);
                towerState.liveBossHp = Math.max(0, towerState.liveBossHp - tribDmg);
                towerState.liveBossToughness = 0;
                bossAnim.hitFlash = 12;
                incrementCombo();
                spawnFloatingText('boss-stage-anchor', `⚡ CỬU TRỌNG THIÊN KIẾP -${fmt(tribDmg)}!`, 'ult');
                updateBarsUI(
                    towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
            }
        }

        // VỠ KÍNH KHÔNG GIAN 3D (3D SPATIAL GLASS SHATTER SHARDS)
        function spawnGlassShatterShards(x, y, color = '#67e8f9', count = 20) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 14;
                canvasGlassShards.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    rot: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.28,
                    size: 10 + Math.random() * 18,
                    color: i % 2 === 0 ? color : '#ffffff',
                    life: 1.0
                });
            }
        }

        // TAM ĐẠI PHÁP BẢO CHỦ ĐỘNG (PHÍM 1, 2, 3) CÓ COOLDOWN & TIÊU HAO MP
        const ARTIFACT_CONFIGS = {
            1: { name: 'Đông Hoàng Chung', mp: 25, cd: 4 },
            2: { name: 'Tru Tiên Kiếm', mp: 35, cd: 4 },
            3: { name: 'Thái Cực Luân', mp: 50, cd: 4 }
        };
        const artifactCooldowns = { 1: 0, 2: 0, 3: 0 };

        function updateArtifactButtonsUI() {
            for (let slot = 1; slot <= 3; slot++) {
                const btn = document.getElementById(`art-btn-${slot}`);
                if (!btn) continue;
                const cfg = ARTIFACT_CONFIGS[slot];
                const cd = artifactCooldowns[slot] || 0;
                const canAfford = (towerState.hero && towerState.hero.mp >= cfg.mp);

                const cdBadge = btn.querySelector('.art-cd-badge');
                if (cd > 0) {
                    btn.classList.add('opacity-50', 'grayscale', 'pointer-events-none');
                    if (cdBadge) {
                        cdBadge.textContent = `⏳ ${cd} hiệp`;
                        cdBadge.classList.remove('hidden');
                    }
                } else {
                    btn.classList.remove('opacity-50', 'grayscale', 'pointer-events-none');
                    if (cdBadge) cdBadge.classList.add('hidden');
                }
            }
        }

        function castActiveArtifact(slot) {
            const cfg = ARTIFACT_CONFIGS[slot] || { name: 'Pháp Bảo', mp: 25, cd: 4 };
            if (artifactCooldowns[slot] > 0) {
                addLog(`⏳ <span class="text-amber-300 font-bold">[${cfg.name}]</span> đang trong thời gian hồi chiêu (còn ${artifactCooldowns[slot]} hiệp)!`);
                spawnFloatingText('hero-stage-anchor', `HỒI CHIÊU (${artifactCooldowns[slot]}H)`, 'dodge');
                return;
            }
            if (towerState.hero && towerState.hero.mp < cfg.mp) {
                addLog(`⚠️ <span class="text-rose-400 font-bold">[Linh Lực Không Đủ]</span> ${cfg.name} cần ${cfg.mp} MP (Hiện có: ${Math.floor(towerState.hero.mp)} MP)!`);
                spawnFloatingText('hero-stage-anchor', `THIẾU MP (${cfg.mp})`, 'dodge');
                return;
            }

            if (towerState.inCombat && manualTurnResolver) {
                const resolve = manualTurnResolver;
                manualTurnResolver = null;
                resolve({ type: 'artifact', slot });
                return;
            }

            if (towerState.inCombat && !resolvingPlayerTurn) {
                queuedTowerAction = () => castActiveArtifact(slot);
                addLog(`📜 Đã chuẩn bị ${cfg.name} (tiêu hao ${cfg.mp} MP) cho hiệp kế tiếp.`);
                return;
            }

            // Trừ MP & Kích hoạt Cooldown
            if (towerState.hero) {
                towerState.hero.mp = Math.max(0, towerState.hero.mp - cfg.mp);
            }
            artifactCooldowns[slot] = cfg.cd;
            updateArtifactButtonsUI();

            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;

            if (slot === 1) {
                // Đông Hoàng Chung: Kim Chung Tráo Hộ Thể + Hồi Máu
                towerState.shieldBellTurns = TOWER_RULES.bellShieldTurns;
                document.getElementById('hero-shield-badge').classList.remove('hidden');
                const heal = Math.round(towerState.hero.maxHp * 0.25);
                towerState.hero.hp = Math.min(towerState.hero.maxHp, towerState.hero.hp + heal);

                playSound('bell');
                spawnCalligraphySeal('東皇鐘', w * 0.23, h * 0.42, '#fbbf24');
                canvasShockwaves.push({ x: w * 0.23, y: h * 0.56, r: 10, maxR: 150, alpha: 1.0, color: '#fbbf24' });
                spawnFloatingText('hero-stage-anchor', `🔔 ĐÔNG HOÀNG CHUNG +${fmtShort(heal)} HP!`, 'heal');
                addLog(`<span class="text-amber-300 font-bold">🔔 [Đông Hoàng Chung]</span> Tiêu hao 25 MP! Giảm 55% sát thương nhận vào trong 4 hiệp và hồi 25% Khí Huyết! (Hồi chiêu: 4 hiệp)`);
            } else if (slot === 2) {
                // Tru Tiên Tứ Kiếm Trận
                activateSwordDomain();
                addLog(`<span class="text-rose-400 font-bold">🩸 [Tru Tiên Kiếm Trận]</span> Tiêu hao 35 MP! Khởi động Tru Tiên Kiếm Trận oanh tạc liên tục! (Hồi chiêu: 5 hiệp)`);
            } else if (slot === 3) {
                // Hỗn Độn Thái Cực Luân
                playSound('thunder');
                triggerScreenShake('ult');
                triggerCameraZoom(1.1, 600);
                triggerAnimeCutIn("HỖN ĐỘN THÁI CỰC LUÂN!", "ÂM DƯƠNG NGHỊCH CHUYỂN • VẠN PHÁP QUY HƯ", "☯️");
                canvasTaijiWheels.push({
                    x: w * 0.25,
                    y: h * 0.54,
                    tx: w * 0.77,
                    ty: h * 0.54,
                    progress: 0,
                    radius: 85,
                    life: 1.0
                });
                if (towerState.inCombat && towerState.liveBossHp > 0) {
                    const wheelDmg = towerDamage(towerState.hero, getCurrentEnemy(), 2.2);
                    towerState.liveBossHp = Math.max(0, towerState.liveBossHp - wheelDmg);
                    towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - 60);
                    spawnFloatingText('boss-stage-anchor', `☯️ THÁI CỰC LUÂN -${fmt(wheelDmg)}!`, 'ult');
                }
                addLog(`<span class="text-cyan-300 font-bold">☯️ [Hỗn Độn Thái Cực Luân]</span> Tiêu hao 50 MP! Đại phá Yêu Cang và giáng đòn hủy diệt! (Hồi chiêu: 7 hiệp)`);
            }

            updateBarsUI(
                towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
            );
        }

        function spawnCalligraphySeal(charText, x, y, color = '#fde047') {
            canvasCalligraphy.push({
                text: charText,
                x, y,
                scale: 2.9,
                alpha: 1.0,
                color
            });
        }

        function spawnLaserBeam(x1, y1, x2, y2, color = '#38bdf8', width = 28) {
            canvasLaserBeams.push({
                x1, y1, x2, y2,
                color,
                width,
                life: 1.0
            });
        }

        function spawnSpaceShatter(x, y, color = '#67e8f9', count = 11) {
            const branches = [];
            for (let i = 0; i < count; i++) {
                const baseAngle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.4;
                const segs = [];
                let cx = 0, cy = 0;
                const steps = 3 + Math.floor(Math.random() * 3);
                for (let s = 1; s <= steps; s++) {
                    const dist = s * (18 + Math.random() * 22);
                    const a = baseAngle + (Math.random() - 0.5) * 0.55;
                    cx = Math.cos(a) * dist;
                    cy = Math.sin(a) * dist;
                    segs.push({ x: cx, y: cy });
                }
                branches.push(segs);
            }
            canvasSpaceCracks.push({ x, y, branches, life: 1.0, color });
        }

        const lightningArtwork = new Map();
        const eyeArtwork = new Map();
        function prepareEyeArtwork(slashed) {
            if (eyeArtwork.has(slashed)) return eyeArtwork.get(slashed);
            const surface = document.createElement('canvas');
            surface.width = 1000;
            surface.height = 640;
            const paint = surface.getContext('2d');
            paint.scale(2, 2);
            paint.translate(250, 160);
            paint.strokeStyle = slashed ? '#f43f5e' : '#e879f9';
            paint.lineWidth = 4;
            paint.shadowColor = '#a855f7';
            paint.shadowBlur = 40;
            const split = slashed ? 16 : 0;
            paint.beginPath();
            paint.moveTo(-140, -split);
            paint.quadraticCurveTo(0, -68 - split, 140, -split);
            paint.quadraticCurveTo(0, 68 + split, -140, split);
            paint.stroke();
            paint.fillStyle = slashed ? '#f43f5e' : '#fde047';
            paint.beginPath();
            paint.arc(0, 0, 28, 0, Math.PI * 2);
            paint.fill();
            if (slashed) {
                paint.strokeStyle = '#ffffff';
                paint.lineWidth = 6;
                paint.beginPath();
                paint.moveTo(-165, 35);
                paint.lineTo(165, -35);
                paint.stroke();
            }
            eyeArtwork.set(slashed, surface);
            return surface;
        }
        const crescentArtwork = new Map();
        function prepareCrescentArtwork(color, radius) {
            const key = `${color}:${radius}`;
            if (crescentArtwork.has(key)) return crescentArtwork.get(key);
            const size = Math.ceil(radius * 2 + 160);
            const surface = document.createElement('canvas');
            surface.width = size * 2;
            surface.height = size * 2;
            const paint = surface.getContext('2d');
            paint.scale(2, 2);
            paint.translate(size / 2, size / 2);
            paint.fillStyle = '#ffffff';
            paint.shadowColor = color;
            paint.shadowBlur = 26;
            paint.beginPath();
            paint.arc(0, 0, radius, -Math.PI * 0.44, Math.PI * 0.44, false);
            paint.arc(-14, 0, radius * 0.88, Math.PI * 0.4, -Math.PI * 0.4, true);
            paint.closePath();
            paint.fill();
            crescentArtwork.set(key, surface);
            return surface;
        }
        function prepareLightningArtwork(color) {
            if (lightningArtwork.has(color)) return lightningArtwork.get(color);
            const variants = Array.from({ length: 4 }, () => {
                const surface = document.createElement('canvas');
                surface.width = 1120;
                surface.height = 240;
                const paint = surface.getContext('2d');
                paint.scale(2, 2);
                paint.strokeStyle = color;
                paint.shadowColor = color;
                paint.shadowBlur = 18;
                paint.lineWidth = 3.5;
                paint.beginPath();
                paint.moveTo(30, 60);
                for (let i = 1; i < 8; i++) paint.lineTo(30 + i * 62.5, 60 + (Math.random() - 0.5) * 38);
                paint.lineTo(530, 60);
                paint.stroke();
                paint.strokeStyle = '#ffffff';
                paint.lineWidth = 1.2;
                paint.stroke();
                return surface;
            });
            lightningArtwork.set(color, variants);
            return variants;
        }
        function spawnLightningArc(x1, y1, x2, y2, color = '#38bdf8') {
            const variants = prepareLightningArtwork(color);
            canvasLightningArcs.push({
                sprite: variants[Math.floor(Math.random() * variants.length)],
                x: x1, y: y1, angle: Math.atan2(y2 - y1, x2 - x1),
                length: Math.hypot(x2 - x1, y2 - y1), life: 1, color
            });
            return;
            const points = [{ x: x1, y: y1 }];
            const steps = 8;
            for (let i = 1; i < steps; i++) {
                const ratio = i / steps;
                const nx = x1 + (x2 - x1) * ratio + (Math.random() - 0.5) * 38;
                const ny = y1 + (y2 - y1) * ratio + (Math.random() - 0.5) * 38;
                points.push({ x: nx, y: ny });
            }
            points.push({ x: x2, y: y2 });
            canvasLightningArcs.push({ points, life: 1.0, color });
        }

        function spawnCrescentWave(sx, sy, tx, ty, color = '#38bdf8', radius = 56) {
            const angle = Math.atan2(ty - sy, tx - sx);
            canvasCrescents.push({
                x: sx, y: sy,
                vx: Math.cos(angle) * 25,
                vy: Math.sin(angle) * 25,
                angle,
                radius,
                color,
                life: 1.0
            });
        }

        // Bake only static artwork at 2x resolution. Motion and effect counts stay live.
        function createTowerArtwork(width, height, originX, originY, paint) {
            const surface = document.createElement('canvas');
            surface.width = width * 2;
            surface.height = height * 2;
            const brush = surface.getContext('2d');
            brush.scale(2, 2);
            brush.translate(originX, originY);
            brush.globalCompositeOperation = 'lighter';
            paint(brush);
            return { surface, width, height, x: -originX, y: -originY };
        }

        function drawTowerArtwork(ctx, artwork) {
            ctx.drawImage(artwork.surface, artwork.x, artwork.y, artwork.width, artwork.height);
        }

        function prepareAmbientDustArtwork(dust) {
            return createTowerArtwork(64, 64, 32, 32, paint => {
                paint.globalAlpha = dust.alpha;
                paint.fillStyle = dust.color;
                paint.shadowColor = dust.color;
                paint.shadowBlur = 0;
                paint.beginPath();
                paint.arc(0, 0, dust.r, 0, Math.PI * 2);
                paint.fill();
            });
        }

        function getTowerArtwork(cache, key, prepare, limit = 12) {
            let artwork = cache.get(key);
            if (!artwork) {
                artwork = prepare();
                if (cache.size >= limit) cache.delete(cache.keys().next().value);
                cache.set(key, artwork);
            }
            return artwork;
        }

        const divineWingArtwork = new Map();
        // VẼ CÁNH THẦN DỰC LÔI PHƯỢNG CHO KIẾM TIÊN (DIVINE LUMINOUS WINGS)
        function drawHeroDivineWings(ctx, x, y, t, color1 = '#38bdf8', color2 = '#a855f7') {
            if (!towerState.wingsEnabled) return;
            const wing = getTowerArtwork(divineWingArtwork, `${color1}|${color2}`, () =>
                createTowerArtwork(208, 192, 144, 96, paint => {
                    for (let f = 0; f < 6; f++) {
                        paint.save();
                        paint.rotate(-0.35 + f * 0.16);
                        const featherLen = 88 - f * 8;
                        const grad = paint.createLinearGradient(0, 0, -featherLen, -20);
                        grad.addColorStop(0, '#ffffff');
                        grad.addColorStop(0.45, color1);
                        grad.addColorStop(1, 'transparent');
                        paint.fillStyle = grad;
                        paint.shadowColor = color2;
                        // Canvas blur is measured in pixels, independently of the 2x transform.
                        paint.shadowBlur = 32;
                        paint.globalAlpha = 0.65 - f * 0.06;
                        paint.beginPath();
                        paint.moveTo(-10, 0);
                        paint.quadraticCurveTo(-featherLen * 0.6, -24, -featherLen, -8);
                        paint.quadraticCurveTo(-featherLen * 0.5, 8, -10, 4);
                        paint.closePath();
                        paint.fill();
                        paint.restore();
                    }
                }));
            ctx.save();
            ctx.translate(x, y - 24);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            const flap = Math.sin(t * 4.5) * 0.16;

            for (let side of [-1, 1]) {
                ctx.save();
                ctx.scale(side, 1);
                ctx.rotate(flap);

                drawTowerArtwork(ctx, wing);
                ctx.restore();
            }

            ctx.restore();
        }

        // VẼ ĐÔNG HOÀNG CHUNG HỘ THỂ (GOLDEN ANCIENT BELL SHIELD)
        function drawDongHoangBellShield(ctx, x, y, t) {
            if (towerState.shieldBellTurns <= 0) return;
            ctx.save();
            ctx.translate(x, y - 5);
            ctx.globalCompositeOperation = 'lighter';

            const pulse = 0.85 + Math.sin(t * 5) * 0.15;
            ctx.globalAlpha = 0.42 * pulse;
            ctx.strokeStyle = '#fde047';
            ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 28;

            // Hình vòm Chuông Đông Hoàng
            ctx.beginPath();
            ctx.moveTo(-58, 58);
            ctx.lineTo(-46, -25);
            ctx.quadraticCurveTo(0, -82, 46, -25);
            ctx.lineTo(58, 58);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Minh văn Phạn tự xoay quanh chuông
            const runes = ['卍', '鎮', '護', '道', '仙', '皇'];
            ctx.font = 'bold 14px "Noto Serif SC", serif';
            ctx.fillStyle = '#fef08a';
            for (let i = 0; i < runes.length; i++) {
                const a = t * 2 + (i * Math.PI * 2) / runes.length;
                const rx = Math.cos(a) * 52;
                const ry = Math.sin(a) * 16 + 15;
                ctx.fillText(runes[i], rx - 7, ry);
            }

            ctx.restore();
        }

        // VẼ CHÂN LONG KIẾM HỒN & CỬU U MA LONG UỐN LƯỢN 3D
        const dragonArtworkCache = new Map();
        const dragonPointsX = new Float64Array(26);
        const dragonPointsY = new Float64Array(26);
        function drawArticulatedSpiritDragon(ctx, centerX, centerY, t, isHero = true, mainColor = '#fde047', glowColor = '#f59e0b') {
            if (!towerState.phapTuongEnabled) return;
            const segments = 14;
            const artwork = getTowerArtwork(dragonArtworkCache, `${mainColor}|${glowColor}|${isHero}`, () => {
                const body = Array.from({ length: segments }, (_, i) => {
                    const ratio = 1 - i / segments;
                    const segRadius = 3 + Math.sin(ratio * Math.PI) * 11;
                    return createTowerArtwork(112, 112, 56, 56, paint => {
                        // Tối ưu hiệu năng: Tắt shadowBlur ở từng đốt thân rồng lặp nhiều
                        paint.globalCompositeOperation = 'source-over';
                        paint.fillStyle = i % 2 === 0 ? mainColor : '#ffffff';
                        paint.shadowColor = glowColor;
                        paint.shadowBlur = 0;
                        paint.beginPath();
                        paint.arc(0, 0, segRadius, 0, Math.PI * 2);
                        paint.fill();
                        if (i % 2 === 0 && i < segments - 3) {
                            paint.fillStyle = mainColor;
                            paint.beginPath();
                            paint.moveTo(-4, -segRadius);
                            paint.lineTo(6, -segRadius - 9 * ratio);
                            paint.lineTo(4, -segRadius + 2);
                            paint.closePath();
                            paint.fill();
                        }
                    });
                });
                const head = createTowerArtwork(176, 160, 96, 80, paint => {
                    paint.globalAlpha = 0.85;
                    paint.fillStyle = '#ffffff';
                    paint.shadowColor = glowColor;
                    paint.shadowBlur = 18;
                    paint.beginPath();
                    paint.moveTo(22, 0);
                    paint.lineTo(-6, -12);
                    paint.lineTo(-14, -6);
                    paint.lineTo(-14, 6);
                    paint.lineTo(-6, 12);
                    paint.closePath();
                    paint.fill();
                    paint.strokeStyle = mainColor;
                    paint.lineWidth = 3;
                    paint.beginPath();
                    paint.moveTo(-4, -8);
                    paint.quadraticCurveTo(-22, -24, -34, -18);
                    paint.moveTo(-4, 8);
                    paint.quadraticCurveTo(-22, 24, -34, 18);
                    paint.stroke();
                    paint.fillStyle = isHero ? '#38bdf8' : '#fef08a';
                    paint.beginPath();
                    paint.arc(4, -4, 2.5, 0, Math.PI * 2);
                    paint.arc(4, 4, 2.5, 0, Math.PI * 2);
                    paint.fill();
                });
                return { body, head };
            }, 8);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const dir = isHero ? 1 : -1;

            for (let i = 0; i < segments; i++) {
                const phase = t * 3.4 - i * 0.22;
                const radiusX = 95 + Math.sin(t * 1.5 + i * 0.15) * 28;
                const radiusY = 62 + Math.cos(t * 1.2 + i * 0.18) * 22;

                const px = centerX + Math.cos(phase * dir) * radiusX - dir * 15;
                const py = centerY - 78 + Math.sin(phase * 1.5) * radiusY;
                dragonPointsX[i] = px;
                dragonPointsY[i] = py;
            }

            for (let i = segments - 1; i >= 0; i--) {
                const ratio = 1 - i / segments;

                ctx.save();
                ctx.translate(dragonPointsX[i], dragonPointsY[i]);
                if (i > 0) {
                    ctx.rotate(Math.atan2(dragonPointsY[i - 1] - dragonPointsY[i], dragonPointsX[i - 1] - dragonPointsX[i]));
                }

                ctx.globalAlpha = 0.22 + ratio * 0.45;
                ctx.shadowBlur = 0;
                drawTowerArtwork(ctx, artwork.body[i]);
                ctx.restore();
            }

            const headAngle = Math.atan2(dragonPointsY[0] - dragonPointsY[1], dragonPointsX[0] - dragonPointsX[1]);
            ctx.save();
            ctx.translate(dragonPointsX[0], dragonPointsY[0]);
            ctx.rotate(headAngle);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            drawTowerArtwork(ctx, artwork.head);

            ctx.restore();
            ctx.restore();
        }

        function draw3DLotusPedestal(ctx, x, y, t, color1 = '#38bdf8', color2 = '#0284c7') {
            ctx.save();
            ctx.translate(x, y + 66);
            ctx.scale(1, 0.34);
            ctx.globalCompositeOperation = 'lighter';

            const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 92);
            grad.addColorStop(0, color1);
            grad.addColorStop(0.5, color2);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.42;
            ctx.beginPath();
            ctx.arc(0, 0, 92, 0, Math.PI * 2);
            ctx.fill();

            const petals = 12;
            ctx.rotate(t * 0.85);
            for (let i = 0; i < petals; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / petals);
                ctx.globalAlpha = 0.65;
                ctx.fillStyle = i % 2 === 0 ? color1 : '#ffffff';
                ctx.strokeStyle = color2;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(18, 0);
                ctx.quadraticCurveTo(48, -16, 76, 0);
                ctx.quadraticCurveTo(48, 16, 18, 0);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }

        function drawSwordQiClashCore(ctx, heroX, heroY, bossX, bossY, t) {
            if (!towerState.inCombat && !towerState.domainActive) return;

            const elemObj = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;
            const pushRatio = 0.51 + Math.sin(t * 4.5) * 0.06 + (towerState.domainActive ? 0.08 : 0);
            const clashX = heroX + (bossX - heroX) * pushRatio;
            const clashY = heroY - 12 + Math.cos(t * 6) * 5;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const heroBeamGrad = ctx.createLinearGradient(heroX + 35, heroY - 12, clashX, clashY);
            heroBeamGrad.addColorStop(0, 'transparent');
            heroBeamGrad.addColorStop(0.25, elemObj.glow);
            heroBeamGrad.addColorStop(1, '#ffffff');

            ctx.strokeStyle = heroBeamGrad;
            ctx.lineWidth = 7 + Math.sin(t * 18) * 2.5;
            ctx.shadowColor = elemObj.glow;
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.moveTo(heroX + 35, heroY - 12);
            ctx.lineTo(clashX, clashY);
            ctx.stroke();

            const bossBeamGrad = ctx.createLinearGradient(bossX - 35, bossY - 12, clashX, clashY);
            bossBeamGrad.addColorStop(0, 'transparent');
            bossBeamGrad.addColorStop(0.25, '#e11d48');
            bossBeamGrad.addColorStop(1, '#fda4af');

            ctx.strokeStyle = bossBeamGrad;
            ctx.lineWidth = 7 + Math.cos(t * 18) * 2.5;
            ctx.shadowColor = '#e11d48';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.moveTo(bossX - 35, bossY - 12);
            ctx.lineTo(clashX, clashY);
            ctx.stroke();

            const coreR = 16 + Math.sin(t * 25) * 5;
            const coreGrad = ctx.createRadialGradient(clashX, clashY, 2, clashX, clashY, coreR * 2.4);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.4, elemObj.color);
            coreGrad.addColorStop(0.75, '#f43f5e');
            coreGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(clashX, clashY, coreR * 2.4, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 4; i++) {
                const a = t * 8 + (i * Math.PI) / 2;
                ctx.strokeStyle = i % 2 === 0 ? elemObj.color : '#fda4af';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(clashX, clashY);
                ctx.lineTo(
                    clashX + Math.cos(a) * (28 + Math.random() * 18),
                    clashY + Math.sin(a) * (28 + Math.random() * 18)
                );
                ctx.stroke();
            }

            ctx.restore();
        }

        const swordArtworkCache = new Map();
        function drawDetailedSword(ctx, length = 48, bladeColor = '#67e8f9', glowColor = '#06b6d4', hiltColor = '#f59e0b') {
            const key = JSON.stringify([length, bladeColor, glowColor, hiltColor]);
            let artwork = swordArtworkCache.get(key);
            if (!artwork) {
                const padding = 64;
                const left = Math.ceil(length * 0.6 + padding);
                const width = Math.ceil(length * 1.5 + padding * 2);
                const height = 160;
                const scale = Math.max(2, window.devicePixelRatio || 1);
                const surface = document.createElement('canvas');
                surface.width = Math.ceil(width * scale);
                surface.height = Math.ceil(height * scale);
                const paint = surface.getContext('2d');
                paint.scale(scale, scale);
                paint.translate(left, height / 2);
                paintDetailedSword(paint, length, bladeColor, glowColor, hiltColor);
                artwork = { surface, left, width, height };
                if (swordArtworkCache.size >= 96) swordArtworkCache.delete(swordArtworkCache.keys().next().value);
                swordArtworkCache.set(key, artwork);
            }
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.drawImage(artwork.surface, -artwork.left, -artwork.height / 2, artwork.width, artwork.height);
            ctx.restore();
        }

        function paintDetailedSword(ctx, length, bladeColor, glowColor, hiltColor) {
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 18;

            ctx.fillStyle = glowColor;
            ctx.globalAlpha *= 0.38;
            ctx.beginPath();
            ctx.moveTo(length * 0.82, 0);
            ctx.lineTo(length * 0.36, -7.5);
            ctx.lineTo(-length * 0.25, -4.2);
            ctx.lineTo(-length * 0.25, 4.2);
            ctx.lineTo(length * 0.36, 7.5);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha /= 0.38;

            const grad = ctx.createLinearGradient(-length * 0.35, 0, length * 0.75, 0);
            grad.addColorStop(0, bladeColor);
            grad.addColorStop(0.55, '#ffffff');
            grad.addColorStop(1, bladeColor);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(length * 0.74, 0);
            ctx.lineTo(length * 0.44, -4.0);
            ctx.lineTo(-length * 0.25, -2.8);
            ctx.lineTo(-length * 0.25, 2.8);
            ctx.lineTo(length * 0.44, 4.0);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-length * 0.24, 0);
            ctx.lineTo(length * 0.68, 0);
            ctx.stroke();

            ctx.fillStyle = hiltColor;
            ctx.beginPath();
            ctx.moveTo(-length * 0.18, 0);
            ctx.lineTo(-length * 0.31, -11.5);
            ctx.lineTo(-length * 0.38, -3.5);
            ctx.lineTo(-length * 0.38, 3.5);
            ctx.lineTo(-length * 0.31, 11.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-length * 0.28, 0, 2.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#78350f';
            ctx.fillRect(-length * 0.54, -2.0, length * 0.16, 4.0);
            ctx.fillStyle = hiltColor;
            ctx.beginPath();
            ctx.arc(-length * 0.56, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        function drawHeroAstralAvatar(ctx, x, y, t) {
            if (!towerState.phapTuongEnabled) return;
            const elemObj = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;

            ctx.save();
            ctx.translate(x - 22, y - 64 + Math.sin(t * 1.8) * 6);
            ctx.globalCompositeOperation = 'lighter';

            const pulse = 0.85 + Math.sin(t * 3.2) * 0.15;
            const scale = towerState.domainActive ? 1.28 : 1.05;
            ctx.scale(scale, scale);

            const swordCount = towerState.domainActive ? 28 : 20;
            ctx.save();
            ctx.translate(0, -22);
            for (let i = 0; i < swordCount; i++) {
                const angle = t * (towerState.domainActive ? 1.35 : 0.5) + (i * Math.PI * 2) / swordCount;
                ctx.save();
                ctx.rotate(angle);
                ctx.translate(114, 0);
                ctx.globalAlpha = 0.45 * pulse;
                drawDetailedSword(ctx, 44, i % 2 === 0 ? elemObj.color : '#67e8f9', elemObj.glow, '#f59e0b');
                ctx.restore();
            }

            ctx.rotate(-t * 0.65);
            ctx.strokeStyle = elemObj.color;
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 96, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([12, 8]);
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 0, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.3 * pulse;
            const avatarGrad = ctx.createLinearGradient(0, -120, 0, 75);
            avatarGrad.addColorStop(0, elemObj.color);
            avatarGrad.addColorStop(0.55, '#0284c7');
            avatarGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = avatarGrad;
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 2;
            ctx.shadowColor = elemObj.glow;
            ctx.shadowBlur = 32;

            ctx.beginPath();
            ctx.moveTo(-58, -48);
            ctx.lineTo(-85, -72);
            ctx.lineTo(-35, -52);
            ctx.lineTo(35, -52);
            ctx.lineTo(85, -72);
            ctx.lineTo(58, -48);
            ctx.lineTo(72, 12);
            ctx.lineTo(34, 78);
            ctx.lineTo(-34, 78);
            ctx.lineTo(-72, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, -76, 23, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.globalAlpha = 0.92;
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 18;
            ctx.fillRect(-13, -78, 9, 3.2);
            ctx.fillRect(4, -78, 9, 3.2);

            ctx.save();
            ctx.translate(48, -28);
            ctx.rotate(-0.35 + heroAnim.avatarSlashAngle + Math.sin(t * 2.5) * 0.08);
            ctx.scale(2.1, 2.1);
            drawDetailedSword(ctx, 56, '#ffffff', elemObj.glow, '#fbbf24');
            ctx.restore();

            ctx.restore();
            ctx.restore();
        }

        function drawBossAstralAvatar(ctx, x, y, t) {
            if (!towerState.phapTuongEnabled) return;
            ctx.save();
            ctx.translate(x + 22, y - 66 + Math.cos(t * 1.7) * 7);
            ctx.globalCompositeOperation = 'lighter';

            const scale = towerState.bossEnragedVisual ? 1.35 : 1.08;
            ctx.scale(scale, scale);

            ctx.save();
            ctx.translate(0, -22);
            ctx.rotate(-t * 0.75);
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#e11d48';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(0, 0, 102, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 12; i++) {
                const a = -t * 0.6 + (i * Math.PI * 2) / 12;
                ctx.save();
                ctx.rotate(a);
                ctx.translate(116, 0);
                ctx.globalAlpha = 0.42;
                drawDetailedSword(ctx, 46, '#fda4af', '#e11d48', '#881337');
                ctx.restore();
            }
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = towerState.bossEnragedVisual ? 0.48 : 0.3;
            const maGrad = ctx.createLinearGradient(0, -120, 0, 78);
            maGrad.addColorStop(0, '#f43f5e');
            maGrad.addColorStop(0.5, '#7e22ce');
            maGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = maGrad;
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 2.2;

            ctx.beginPath();
            ctx.moveTo(-62, -48);
            ctx.lineTo(-102, -98 + Math.sin(t * 3) * 10);
            ctx.lineTo(-32, -54);
            ctx.lineTo(32, -54);
            ctx.lineTo(102, -98 + Math.sin(t * 3) * 10);
            ctx.lineTo(62, -48);
            ctx.lineTo(44, 78);
            ctx.lineTo(-44, 78);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.globalAlpha = 0.95;
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 18;
            for (let r = 0; r < 2; r++) {
                ctx.fillRect(-15, -84 + r * 7, 7.5, 2.8);
                ctx.fillRect(7, -84 + r * 7, 7.5, 2.8);
            }
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.moveTo(0, -96);
            ctx.lineTo(4, -87);
            ctx.lineTo(0, -78);
            ctx.lineTo(-4, -87);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.restore();
        }

        function drawCelestialHeavenlyGate(ctx, w, h, t) {
            ctx.save();
            const cx = w * 0.5;
            const cy = h * 0.25;
            ctx.globalCompositeOperation = 'lighter';

            // Tùy chỉnh Thiên Tượng theo Sky Theme
            const gateGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, w * 0.32);
            if (towerState.skyTheme === 'bloodmoon') {
                gateGrad.addColorStop(0, 'rgba(244, 63, 94, 0.58)');
                gateGrad.addColorStop(0.5, 'rgba(136, 19, 55, 0.28)');
                gateGrad.addColorStop(1, 'transparent');
            } else if (towerState.skyTheme === 'thunder') {
                gateGrad.addColorStop(0, 'rgba(192, 132, 252, 0.55)');
                gateGrad.addColorStop(0.5, 'rgba(88, 28, 135, 0.25)');
                gateGrad.addColorStop(1, 'transparent');
            } else if (towerState.skyTheme === 'immortal') {
                gateGrad.addColorStop(0, 'rgba(253, 224, 71, 0.52)');
                gateGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.22)');
                gateGrad.addColorStop(1, 'transparent');
            } else {
                gateGrad.addColorStop(0, 'rgba(103, 232, 249, 0.42)');
                gateGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.16)');
                gateGrad.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = gateGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.32, 0, Math.PI * 2);
            ctx.fill();

            // Nếu là Huyết Nguyệt, vẽ mặt trăng máu khổng lồ
            if (towerState.skyTheme === 'bloodmoon') {
                ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
                ctx.shadowColor = '#e11d48';
                ctx.shadowBlur = 40;
                ctx.beginPath();
                ctx.arc(cx, cy, 85, 0, Math.PI * 2);
                ctx.fill();
            }

            const gateWidth = 175;
            const gateHeight = 115;
            ctx.strokeStyle = towerState.domainActive ? 'rgba(103, 232, 249, 0.48)' : 'rgba(251, 191, 36, 0.34)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = towerState.domainActive ? '#22d3ee' : '#f59e0b';
            ctx.shadowBlur = 20;

            ctx.strokeRect(cx - gateWidth, cy - gateHeight * 0.4, 16, gateHeight);
            ctx.strokeRect(cx + gateWidth - 16, cy - gateHeight * 0.4, 16, gateHeight);

            ctx.beginPath();
            ctx.moveTo(cx - gateWidth - 28, cy - gateHeight * 0.4);
            ctx.quadraticCurveTo(cx, cy - gateHeight * 0.85, cx + gateWidth + 28, cy - gateHeight * 0.4);
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const a = t * 0.4 + (i * Math.PI * 2) / 8;
                const sx = cx + Math.cos(a) * 145;
                const sy = cy + Math.sin(a) * 52;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(a + Math.PI * 0.5);
                ctx.globalAlpha = 0.4;
                drawDetailedSword(ctx, 38, '#fde047', '#f59e0b', '#fbbf24');
                ctx.restore();
            }

            ctx.restore();
        }

        function drawSwordImmortal(ctx, x, y, t, isAfterimage = false) {
            const elemObj = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;

            if (!isAfterimage) {
                draw3DLotusPedestal(ctx, x + heroAnim.dashOffset * 0.5, y, t, elemObj.color, elemObj.glow);
                drawArticulatedSpiritDragon(ctx, x + heroAnim.dashOffset * 0.4, y, t, true, elemObj.color, elemObj.glow);
                drawHeroAstralAvatar(ctx, x + heroAnim.dashOffset * 0.4, y, t);
            }

            ctx.save();
            const floatY = Math.sin(t * 2.6) * 7;
            const curX = x + (isAfterimage ? 0 : heroAnim.dashOffset + heroAnim.dodgeOffset);
            const curY = y + floatY;

            if (!isAfterimage) {
                drawHeroDivineWings(ctx, curX, curY, t, elemObj.color, elemObj.glow);
            }

            ctx.translate(curX, curY);

            if (heroAnim.dodgeOffset < -5 && !isAfterimage) {
                ctx.globalAlpha = 0.55;
            }

            // Vầng Thái Cực Kiếm Ý sau lưng
            ctx.save();
            ctx.translate(0, -20);
            ctx.rotate(t * 0.9);
            ctx.strokeStyle = towerState.domainActive ? '#fde047' : elemObj.color;
            ctx.lineWidth = 2.2;
            ctx.shadowColor = elemObj.glow;
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(0, 0, 52, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([7, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, 41, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Hỗn Thiên Lăng
            ctx.save();
            ctx.strokeStyle = elemObj.color;
            ctx.lineWidth = 4.5;
            ctx.shadowColor = elemObj.glow;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(-26, 10);
            ctx.bezierCurveTo(
                -72, -40 + Math.sin(t * 4) * 14,
                -15, -92 + Math.cos(t * 3) * 12,
                42, -46 + Math.sin(t * 5) * 10
            );
            ctx.stroke();
            ctx.restore();

            // Pháp Bào Kiếm Tiên
            const robeWave = Math.sin(t * 3.6) * 8.5;
            const robeGrad = ctx.createLinearGradient(-32, -55, 28, 68);
            robeGrad.addColorStop(0, '#0f172a');
            robeGrad.addColorStop(0.5, '#0369a1');
            robeGrad.addColorStop(1, '#06b6d4');

            ctx.fillStyle = heroAnim.hitFlash > 0 ? '#ffffff' : robeGrad;
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 18;

            ctx.beginPath();
            ctx.moveTo(-15, -39);
            ctx.lineTo(17, -39);
            ctx.lineTo(34 + robeWave * 0.4, 15);
            ctx.lineTo(17, 18);
            ctx.lineTo(30 + robeWave * 0.6, 72);
            ctx.lineTo(0, 56);
            ctx.lineTo(-36 + robeWave, 72);
            ctx.lineTo(-19, 15);
            ctx.lineTo(-40 + robeWave * 0.7, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-15, -4, 30, 6);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(0, -1, 4.2, 0, Math.PI * 2);
            ctx.fill();

            // Đầu & Tóc Bạc
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(-6, -48);
            ctx.quadraticCurveTo(-44, -58 + robeWave, -60, -32 + robeWave * 1.2);
            ctx.quadraticCurveTo(-32, -36, -8, -40);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(2, -50, 11.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = elemObj.color;
            ctx.shadowColor = elemObj.glow;
            ctx.shadowBlur = 12;
            ctx.fillRect(5, -52, 5.5, 2.4);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(4, -58, 2.8, 4.5);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-5, -60);
            ctx.lineTo(9, -60);
            ctx.lineTo(6, -76);
            ctx.lineTo(-2, -76);
            ctx.closePath();
            ctx.fill();

            // Bản Mệnh Thần Kiếm
            ctx.save();
            ctx.translate(19, -8);
            const swordAngle = heroAnim.dashOffset > 10 ? 0.12 : -0.52 + Math.sin(t * 3) * 0.08;
            ctx.rotate(swordAngle);
            drawDetailedSword(ctx, 72, elemObj.color, elemObj.glow, '#fbbf24');
            ctx.restore();

            // Hộ Pháp Yêu Linh
            if (towerState.activeGuardian && !isAfterimage) {
                ctx.save();
                const petX = -50;
                const petY = -62 + Math.cos(t * 4) * 6;
                ctx.translate(petX, petY);
                ctx.fillStyle = 'rgba(88, 28, 135, 0.85)';
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 1.8;
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(0, 0, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(towerState.activeGuardian.icon, 0, 1);
                ctx.restore();
            }

            // Quỹ đạo Phi Kiếm Hộ Thể
            if (!isAfterimage) {
                const numOrbitSwords = Math.min(24, towerState.hero.swordCount + (towerState.domainActive ? 6 : 0));
                for (let i = 0; i < numOrbitSwords; i++) {
                    const orbitAngle = t * (towerState.domainActive ? 4.6 : 2.7) + (i * Math.PI * 2) / numOrbitSwords;
                    const ox = Math.cos(orbitAngle) * 68;
                    const oy = Math.sin(orbitAngle) * 30 - 10;

                    ctx.save();
                    ctx.translate(ox, oy);
                    ctx.rotate(Math.sin(orbitAngle) * 0.25);
                    const sColor = i % 2 === 0 ? elemObj.color : '#67e8f9';
                    const gColor = i % 2 === 0 ? elemObj.glow : '#06b6d4';
                    drawDetailedSword(ctx, 42, sColor, gColor, '#f59e0b');
                    ctx.restore();
                }
            }

            ctx.restore();

            if (!isAfterimage) {
                drawDongHoangBellShield(ctx, curX, curY, t);
            }

            // 8. NHẤT KHÍ HÓA TAM THANH (Vẽ 2 Đạo Nguyên Thần Phân Thân: Thái Thượng Viêm Thân & Cửu Thiên Lôi Thân đứng hộ pháp)
            if (!isAfterimage && towerState.tamThanhEnabled) {
                const clones = [
                    { ox: -72, oy: -58, color: '#fb7185', glow: '#e11d48', title: '上清' },
                    { ox: -68, oy: 56, color: '#c084fc', glow: '#9333ea', title: '玉清' }
                ];
                clones.forEach((cl, cIdx) => {
                    ctx.save();
                    const clFloat = Math.sin(t * 3.2 + cIdx * 2) * 8;
                    ctx.translate(curX + cl.ox, curY + cl.oy + clFloat);
                    ctx.scale(0.72, 0.72);
                    ctx.globalAlpha = 0.82;

                    // Pháp luân sau lưng Phân Thân
                    ctx.save();
                    ctx.rotate(t * (cIdx === 0 ? 2.2 : -2.2));
                    ctx.strokeStyle = cl.color;
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = cl.glow;
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    ctx.arc(0, -18, 44, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();

                    // Đạo bào Nguyên Thần Phân Thân
                    ctx.fillStyle = cl.glow;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(-14, -36);
                    ctx.lineTo(14, -36);
                    ctx.lineTo(26, 48);
                    ctx.lineTo(-26, 48);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(0, -48, 10, 0, Math.PI * 2);
                    ctx.fill();

                    // Thần kiếm của Phân Thân
                    ctx.save();
                    ctx.translate(22, -10);
                    ctx.rotate(-0.35 + Math.sin(t * 4 + cIdx) * 0.15);
                    drawDetailedSword(ctx, 64, '#ffffff', cl.glow, '#fde047');
                    ctx.restore();

                    ctx.restore();
                });
            }
        }

        function drawDemonSovereign(ctx, x, y, t) {
            const fObj = TOWER_50_FLOORS.find(f => f.floor === towerState.selectedFloor);
            const bossElem = fObj ? ELEMENTS[fObj.element] : ELEMENTS.Moc;

            draw3DLotusPedestal(ctx, x + bossAnim.dashOffset * 0.5, y, -t, '#fb7185', bossElem.glow);
            drawArticulatedSpiritDragon(ctx, x + bossAnim.dashOffset * 0.4, y, t + 1.5, false, '#fb7185', bossElem.glow);
            drawBossAstralAvatar(ctx, x + bossAnim.dashOffset * 0.4, y, t);

            ctx.save();
            const floatY = Math.cos(t * 2.3) * 8;
            const scale = towerState.bossEnragedVisual ? 1.22 : (towerState.bossBrokenVisual ? 0.92 : 1.04);
            ctx.translate(x + bossAnim.dashOffset + bossAnim.dodgeOffset, y + floatY);
            ctx.scale(scale, scale);

            if (towerState.bossBrokenVisual) {
                ctx.rotate(0.09);
            }

            ctx.save();
            ctx.translate(0, -22);
            ctx.rotate(-t * 1.15);
            ctx.strokeStyle = towerState.bossEnragedVisual ? '#fda4af' : bossElem.color;
            ctx.lineWidth = 2.6;
            ctx.shadowColor = bossElem.glow;
            ctx.shadowBlur = 26;
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            ctx.stroke();

            for (let k = 0; k < 8; k++) {
                const a = (k * Math.PI) / 4;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
                ctx.lineTo(Math.cos(a + 0.15) * 75, Math.sin(a + 0.15) * 75);
                ctx.lineTo(Math.cos(a + 0.3) * 60, Math.sin(a + 0.3) * 60);
                ctx.stroke();
            }
            ctx.restore();

            const wingFlap = Math.sin(t * 4.2) * 15;
            ctx.save();
            ctx.fillStyle = bossAnim.hitFlash > 0 ? '#ffffff' : 'rgba(136, 19, 55, 0.94)';
            ctx.strokeStyle = bossElem.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = bossElem.glow;
            ctx.shadowBlur = 24;

            ctx.beginPath();
            ctx.moveTo(-10, -28);
            ctx.lineTo(-86, -80 + wingFlap);
            ctx.lineTo(-62, -18 + wingFlap * 0.5);
            ctx.lineTo(-90, 22 + wingFlap * 0.3);
            ctx.lineTo(-22, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(12, -28);
            ctx.lineTo(90, -80 - wingFlap);
            ctx.lineTo(68, -18 - wingFlap * 0.5);
            ctx.lineTo(94, 22 - wingFlap * 0.3);
            ctx.lineTo(24, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            const armorGrad = ctx.createLinearGradient(0, -55, 0, 70);
            armorGrad.addColorStop(0, '#4c0519');
            armorGrad.addColorStop(0.5, '#881337');
            armorGrad.addColorStop(1, '#1e1b4b');

            ctx.fillStyle = bossAnim.hitFlash > 0 ? '#ffffff' : armorGrad;
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2.2;

            ctx.beginPath();
            ctx.moveTo(-27, -42);
            ctx.lineTo(27, -42);
            ctx.lineTo(38, 12);
            ctx.lineTo(25, 70);
            ctx.lineTo(0, 54);
            ctx.lineTo(-25, 70);
            ctx.lineTo(-38, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = towerState.bossEnragedVisual ? '#fef08a' : bossElem.color;
            ctx.shadowColor = bossElem.glow;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, -10, 9.5 + Math.sin(t * 6) * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#31102f';
            ctx.beginPath();
            ctx.moveTo(0, -70);
            ctx.lineTo(-17, -44);
            ctx.lineTo(0, -34);
            ctx.lineTo(17, -44);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = bossElem.color;
            ctx.beginPath();
            ctx.moveTo(-10, -58);
            ctx.quadraticCurveTo(-36, -84, -19, -96);
            ctx.quadraticCurveTo(-18, -72, -4, -62);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(10, -58);
            ctx.quadraticCurveTo(36, -84, 19, -96);
            ctx.quadraticCurveTo(18, -72, 4, -62);
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(-10, -50); ctx.lineTo(-3, -47); ctx.lineTo(-9, -45); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, -50); ctx.lineTo(3, -47); ctx.lineTo(9, -45); ctx.fill();

            const numBlades = towerState.bossEnragedVisual ? 9 : 6;
            for (let i = 0; i < numBlades; i++) {
                const a = -t * 2.3 + (i * Math.PI * 2) / numBlades;
                const bx = Math.cos(a) * 68;
                const by = Math.sin(a) * 30 - 12;

                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(Math.PI + Math.sin(a) * 0.25);
                drawDetailedSword(ctx, 45, bossElem.color, bossElem.glow, '#9f1239');
                ctx.restore();
            }

            if (towerState.bossChargingUlt) {
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 30 + Math.sin(t * 8) * 15;
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                const chargeR = 75 + Math.sin(t * 7) * 8;
                ctx.arc(0, -20, chargeR, 0, Math.PI * 2);
                ctx.stroke();

                for (let i = 0; i < 6; i++) {
                    const ang = t * 3.5 + (i * Math.PI / 3);
                    const dist = 110 - ((t * 80 + i * 25) % 45);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(ang) * dist, -20 + Math.sin(ang) * dist);
                    ctx.lineTo(Math.cos(ang) * (dist - 16), -20 + Math.sin(ang) * (dist - 16));
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.restore();
        }

        function initArenaCanvas() {
            prepareEyeArtwork(false);
            prepareEyeArtwork(true);
            const preloadColors = new Set(['#38bdf8', '#fde047', '#e879f9', '#a855f7', '#06b6d4', '#ffffff']);
            Object.values(ELEMENTS).forEach(element => {
                preloadColors.add(element.color);
                preloadColors.add(element.glow);
            });
            preloadColors.forEach(color => prepareLightningArtwork(color));
            CULTIVATION_MANUALS.forEach(manual => manual.skills.forEach(skill => {
                if (skill.color) preloadColors.add(skill.color);
            }));
            const preloadSurface = document.createElement('canvas');
            preloadSurface.width = 1;
            preloadSurface.height = 1;
            const preloadContext = preloadSurface.getContext('2d');
            preloadColors.forEach(color => {
                prepareLightningArtwork(color);
                [46, 56, 72].forEach(radius => prepareCrescentArtwork(color, radius));
                [44, 48, 70].forEach(length => drawDetailedSword(preloadContext, length, color, color));
            });
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { desynchronized: true });
            const renderScale = 1;
            let arenaWidth = 1;
            let arenaHeight = 1;

            function resize() {
                arenaWidth = Math.max(1, canvas.offsetWidth);
                arenaHeight = Math.max(1, canvas.offsetHeight);
                const pixelWidth = Math.round(arenaWidth * renderScale);
                const pixelHeight = Math.round(arenaHeight * renderScale);
                if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
                    canvas.width = pixelWidth;
                    canvas.height = pixelHeight;
                }
            }
            resize();
            window.addEventListener('resize', resize);

            // Phím tắt chiến đấu & thao tác: 1, 2, 3 (Pháp Bảo), Space (Chiến/Dừng), Q (Chuyển Tab), C (Càn Quét nhanh)
            window.addEventListener('keydown', (e) => {
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
                if ((e.code === 'Space' || e.key === 'Enter') && e.target.closest('button, summary')) return;

                const vModal = document.getElementById('tower-victory-modal');
                const isVictoryOpen = vModal && !vModal.classList.contains('hidden');
                const dModal = document.getElementById('tower-defeat-modal');
                const isDefeatOpen = dModal && !dModal.classList.contains('hidden');

                if (isVictoryOpen) {
                    if (e.code === 'Space' || e.key === 'Enter') {
                        e.preventDefault();
                        proceedToNextFloorFromModal();
                        return;
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        closeVictoryModal();
                        return;
                    }
                    if (e.key === 'c' || e.key === 'C') {
                        e.preventDefault();
                        sweepFromVictoryModal();
                        return;
                    }
                }

                if (isDefeatOpen) {
                    if (e.code === 'Space' || e.key === 'Enter') {
                        e.preventDefault();
                        retryFloorFromDefeatModal();
                        return;
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        closeDefeatModal();
                        return;
                    }
                }

                if (e.key === '1') castActiveArtifact(1);
                if (e.key === '2') castActiveArtifact(2);
                if (e.key === '3') castActiveArtifact(3);
                if (e.key === 'q' || e.key === 'Q') {
                    castActiveSkillSlot(0);
                }
                if (e.key === 'w' || e.key === 'W') {
                    castActiveSkillSlot(1);
                }
                if (e.key === 'e' || e.key === 'E') {
                    castActiveSkillSlot(2);
                }
                if (e.key === 'm' || e.key === 'M') {
                    toggleAutoManualCombat();
                }
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (towerState.inCombat && manualTurnResolver) {
                        castActiveSkillSlot(0);
                    } else {
                        startOrStopCombat();
                    }
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    toggleNextRightSidebarTab();
                }
                if (e.key === 'c' || e.key === 'C') {
                    sweepClearedFloor(1);
                }
                if (e.key === 't' || e.key === 'T') {
                    const autoChk = document.getElementById('chk-auto-climb');
                    if (autoChk) {
                        autoChk.checked = !autoChk.checked;
                        autoChk.dispatchEvent(new Event('change'));
                    }
                }
                if (e.key === 'x' || e.key === 'X') {
                    toggleCombatSpeed();
                }
            });

            ambientDust = [];
            for (let i = 0; i < 25; i++) {
                ambientDust.push({
                    x: Math.random() * 1400,
                    y: Math.random() * 800,
                    r: 1.2 + Math.random() * 2.8,
                    vy: -0.45 - Math.random() * 0.95,
                    vx: (Math.random() - 0.5) * 0.75,
                    color: i % 3 === 0 ? '#38bdf8' : (i % 3 === 1 ? '#fde047' : '#f43f5e'),
                    alpha: 0.3 + Math.random() * 0.65
                });
            }
            // Every mote keeps its exact random radius, opacity and color for its lifetime.
            ambientDust.forEach(dust => { dust.artwork = prepareAmbientDustArtwork(dust); });

            starfield = [];
            for (let i = 0; i < 90; i++) {
                starfield.push({
                    xRatio: Math.random(),
                    yRatio: Math.random() * 0.68,
                    size: 0.6 + Math.random() * 1.8,
                    phase: Math.random() * Math.PI * 2
                });
            }

            godRays = [
                { xRatio: 0.22, width: 110, alpha: 0.07 },
                { xRatio: 0.50, width: 160, alpha: 0.09 },
                { xRatio: 0.78, width: 110, alpha: 0.06 }
            ];

            backgroundSwords = [
                { xRatio: 0.07, yRatio: 0.82, angle: 1.35, scale: 0.78 },
                { xRatio: 0.13, yRatio: 0.86, angle: 1.72, scale: 0.65 },
                { xRatio: 0.34, yRatio: 0.84, angle: 1.48, scale: 0.62 },
                { xRatio: 0.44, yRatio: 0.87, angle: 1.61, scale: 0.55 },
                { xRatio: 0.64, yRatio: 0.85, angle: 1.68, scale: 0.65 },
                { xRatio: 0.86, yRatio: 0.83, angle: 1.42, scale: 0.78 },
                { xRatio: 0.93, yRatio: 0.87, angle: 1.78, scale: 0.62 }
            ];


            let effectsActiveUntil = performance.now() + 2200;
            const profileRendering = new URLSearchParams(location.search).has('perf');
            let profileFrames = 0;
            let profileTotalMs = 0;
            let profileMaxMs = 0;
            let profileStartedAt = 0;
            let renderFrameId = null;
            let idleRenderTimer = null;
            let lastRenderTimestamp = 0;
            const renderInterval = 1000 / TOWER_RULES.targetFps;
            let nextRenderTimestamp = 0;
            const pauseEffects = () => {
                if (renderFrameId !== null) {
                    cancelAnimationFrame(renderFrameId);
                    renderFrameId = null;
                }
                if (idleRenderTimer !== null) {
                    clearTimeout(idleRenderTimer);
                    idleRenderTimer = null;
                }
            };
            window.pauseTowerEffects = pauseEffects;

            const wakeEffects = () => {
                if (!isTowerActive()) return;
                effectsActiveUntil = performance.now() + 2200;
                if (idleRenderTimer !== null) {
                    clearTimeout(idleRenderTimer);
                    idleRenderTimer = null;
                }
                if (renderFrameId === null) {
                    renderFrameId = requestAnimationFrame(renderLoop);
                }
            };
            window.wakeTowerEffects = wakeEffects;
            window.addEventListener('pointerdown', (event) => {
                if (event.target.closest('button, input, label, [onclick]')) wakeEffects();
            });
            window.addEventListener('keydown', wakeEffects);
            window.addEventListener('resize', wakeEffects);
            document.addEventListener('visibilitychange', () => {
                if (!isTowerActive()) {
                    pauseEffects();
                } else {
                    wakeEffects();
                }
            });

            function renderLoop(timestamp) {
                renderFrameId = null;
                if (!isTowerActive()) return;
                if (timestamp < nextRenderTimestamp - 0.5) {
                    renderFrameId = requestAnimationFrame(renderLoop);
                    return;
                }
                nextRenderTimestamp = timestamp + renderInterval - Math.max(0, timestamp - nextRenderTimestamp) % renderInterval;
                const frameFactor = lastRenderTimestamp
                    ? Math.min(3, Math.max(0.25, (timestamp - lastRenderTimestamp) / 16.6667))
                    : 1;
                lastRenderTimestamp = timestamp;
                const frameStartedAt = performance.now();
                if (!profileStartedAt) profileStartedAt = frameStartedAt;
                const t = timestamp * 0.001;
                const w = arenaWidth;
                const h = arenaHeight;
                ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
                ctx.clearRect(0, 0, w, h);

                arenaCam.scale = 1.0;
                arenaCam.targetScale = 1.0;

                ctx.save();

                const heroX = w * 0.23;
                const heroY = h * 0.57;
                const bossX = w * 0.77;
                const bossY = h * 0.57;

                if (heroAnim.dashOffset > 0) heroAnim.dashOffset *= Math.pow(0.84, frameFactor);
                if (heroAnim.dodgeOffset < 0) heroAnim.dodgeOffset *= Math.pow(0.85, frameFactor);
                if (heroAnim.avatarSlashAngle > 0) heroAnim.avatarSlashAngle *= Math.pow(0.86, frameFactor);
                if (heroAnim.hitFlash > 0) heroAnim.hitFlash = Math.max(0, heroAnim.hitFlash - frameFactor);

                if (bossAnim.dashOffset < 0) bossAnim.dashOffset *= Math.pow(0.84, frameFactor);
                if (bossAnim.dodgeOffset > 0) bossAnim.dodgeOffset *= Math.pow(0.85, frameFactor);
                if (bossAnim.hitFlash > 0) bossAnim.hitFlash = Math.max(0, bossAnim.hitFlash - frameFactor);

                // ==================== LAYER 0: BẦU TRỜI & THIÊN TƯỢNG ====================
                ctx.save();
                starfield.forEach(st => {
                    const twinkle = 0.25 + Math.abs(Math.sin(t * 2.2 + st.phase)) * 0.75;
                    ctx.fillStyle = `rgba(226, 232, 240, ${twinkle})`;
                    ctx.beginPath();
                    ctx.arc(st.xRatio * w, st.yRatio * h, st.size, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Nếu Thiên Tượng là Lôi Trì, tự động giáng tia chớp tím trên tầng mây
                if (towerState.skyTheme === 'thunder' && Math.random() < 0.08) {
                    const lx = Math.random() * w;
                    spawnLightningArc(lx, 0, lx + (Math.random() - 0.5) * 140, h * 0.45, '#c084fc');
                }

                const floatPeak1Y = h * 0.34 + Math.sin(t * 1.1) * 6;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(w * 0.29, floatPeak1Y);
                ctx.lineTo(w * 0.33, floatPeak1Y - 45);
                ctx.lineTo(w * 0.37, floatPeak1Y);
                ctx.lineTo(w * 0.33, floatPeak1Y + 28);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                const floatPeak2Y = h * 0.35 + Math.cos(t * 1.2) * 6;
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.22)';
                ctx.beginPath();
                ctx.moveTo(w * 0.63, floatPeak2Y);
                ctx.lineTo(w * 0.67, floatPeak2Y - 48);
                ctx.lineTo(w * 0.71, floatPeak2Y);
                ctx.lineTo(w * 0.67, floatPeak2Y + 30);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                drawCelestialHeavenlyGate(ctx, w, h, t);
                const moonX = w * 0.5;
                const moonY = h * 0.25;

                ctx.save();
                ctx.translate(moonX, moonY);
                for (let ring = 0; ring < 3; ring++) {
                    ctx.save();
                    ctx.rotate(t * (0.3 + ring * 0.15) * (ring % 2 === 0 ? 1 : -1));
                    ctx.scale(1, 0.35 + ring * 0.18);
                    ctx.strokeStyle = towerState.domainActive ? 'rgba(56, 189, 248, 0.36)' : 'rgba(245, 158, 11, 0.28)';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.arc(0, 0, 125 + ring * 26, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.globalAlpha = towerState.domainActive ? 0.65 : 0.38;
                ctx.strokeStyle = towerState.domainActive ? '#38bdf8' : '#f59e0b';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(-78, 0);
                ctx.quadraticCurveTo(0, -35 - Math.sin(t * 2) * 5, 78, 0);
                ctx.quadraticCurveTo(0, 35 + Math.sin(t * 2) * 5, -78, 0);
                ctx.stroke();

                ctx.fillStyle = towerState.domainActive ? '#67e8f9' : '#fde047';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#020617';
                ctx.fillRect(-2.5, -11, 5, 22);
                ctx.restore();

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                godRays.forEach((ray, idx) => {
                    const rx = w * ray.xRatio + Math.sin(t * 0.8 + idx) * 25;
                    const rayGrad = ctx.createLinearGradient(rx, 0, rx, h * 0.85);
                    rayGrad.addColorStop(0, `rgba(253, 224, 71, ${ray.alpha})`);
                    rayGrad.addColorStop(0.5, `rgba(56, 189, 248, ${ray.alpha * 0.6})`);
                    rayGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = rayGrad;
                    ctx.beginPath();
                    ctx.moveTo(rx - ray.width * 0.3, 0);
                    ctx.lineTo(rx + ray.width * 0.3, 0);
                    ctx.lineTo(rx + ray.width * 1.1, h * 0.88);
                    ctx.lineTo(rx - ray.width * 1.1, h * 0.88);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();

                const pillarPositions = [0.06, 0.15, 0.85, 0.94];
                pillarPositions.forEach((px, idx) => {
                    const colX = w * px;
                    const colW = idx === 1 || idx === 2 ? 22 : 34;
                    ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
                    ctx.lineWidth = 1;
                    ctx.fillRect(colX - colW / 2, h * 0.08, colW, h * 0.76);
                    ctx.strokeRect(colX - colW / 2, h * 0.08, colW, h * 0.76);

                    ctx.fillStyle = idx < 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(244, 63, 94, 0.45)';
                    for (let r = 0; r < 5; r++) {
                        const ry = h * (0.18 + r * 0.12) + Math.sin(t * 2 + r + idx) * 3;
                        ctx.fillRect(colX - 3.5, ry, 7, 11);
                    }
                });
                ctx.restore();

                // ==================== LAYER 1: SÀN THỦY KÍNH & BÁT QUÁI TRẬN ====================
                ctx.save();
                ctx.strokeStyle = 'rgba(225, 29, 72, 0.32)';
                ctx.lineWidth = 4.5;
                ctx.setLineDash([12, 6]);
                ctx.beginPath();
                ctx.moveTo(0, h * 0.12);
                ctx.quadraticCurveTo(w * 0.5, h * 0.38 + Math.sin(t * 1.5) * 10, w, h * 0.12);
                ctx.stroke();
                ctx.setLineDash([]);

                const floorY = h * 0.77;
                const floorGradHero = ctx.createRadialGradient(heroX, floorY, 8, heroX, floorY, 165);
                floorGradHero.addColorStop(0, 'rgba(6, 182, 212, 0.32)');
                floorGradHero.addColorStop(1, 'transparent');
                ctx.fillStyle = floorGradHero;
                ctx.fillRect(0, h * 0.65, w * 0.5, h * 0.35);

                const floorGradBoss = ctx.createRadialGradient(bossX, floorY, 8, bossX, floorY, 165);
                floorGradBoss.addColorStop(0, 'rgba(225, 29, 72, 0.32)');
                floorGradBoss.addColorStop(1, 'transparent');
                ctx.fillStyle = floorGradBoss;
                ctx.fillRect(w * 0.5, h * 0.65, w * 0.5, h * 0.35);

                ctx.save();
                ctx.translate(0, floorY * 1.66);
                ctx.scale(1, -0.28);
                ctx.globalAlpha = 0.18;
                drawSwordImmortal(ctx, heroX, heroY, t, true);
                ctx.restore();

                ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
                ctx.lineWidth = 1;
                for (let wv = 0; wv < 6; wv++) {
                    const wy = h * 0.72 + wv * 18;
                    const waveOffset = Math.sin(t * 2 + wv) * 20;
                    ctx.beginPath();
                    ctx.moveTo(w * 0.12 + waveOffset, wy);
                    ctx.lineTo(w * 0.88 + waveOffset, wy);
                    ctx.stroke();
                }

                ctx.save();
                ctx.translate(w * 0.5, floorY);
                ctx.rotate(t * (towerState.domainActive ? 2.1 : 0.48));
                const formation = getFormationSprite(w, h, towerState.domainActive);
                ctx.drawImage(formation, -w * 0.5, -h * 0.31, w, h * 0.62);
                ctx.restore();

                backgroundSwords.forEach(bs => {
                    ctx.save();
                    ctx.translate(w * bs.xRatio, h * bs.yRatio);
                    ctx.rotate(bs.angle);
                    ctx.scale(bs.scale, bs.scale);
                    ctx.globalAlpha = 0.5;
                    drawDetailedSword(ctx, 44, '#94a3b8', '#38bdf8', '#78350f');
                    ctx.restore();
                });
                ctx.restore();

                // ==================== LAYER 2: ẤN CHỮ HÁN CỔ KHỔNG LỒ ====================
                for (let i = canvasCalligraphy.length - 1; i >= 0; i--) {
                    const cg = canvasCalligraphy[i];
                    cg.scale += (1.0 - cg.scale) * 0.22;
                    cg.alpha -= 0.024;
                    if (cg.alpha <= 0) {
                        canvasCalligraphy.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(cg.x, cg.y);
                    ctx.scale(cg.scale, cg.scale);
                    ctx.globalAlpha = cg.alpha;
                    ctx.font = '900 86px "Noto Serif SC", serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = cg.color;
                    ctx.shadowBlur = 38;
                    ctx.strokeStyle = cg.color;
                    ctx.lineWidth = 3.5;
                    ctx.strokeText(cg.text, 0, 0);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(cg.text, 0, 0);
                    ctx.restore();
                }

                // ==================== LAYER 3: HẠT LINH KHÍ & TRU TIÊN TỨ KIẾM TRẬN ====================
                ambientDust.forEach(d => {
                    d.y += d.vy * (towerState.domainActive ? 3.0 : 1) * frameFactor;
                    d.x += d.vx * frameFactor;
                    if (d.y < 0) { d.y = h; d.x = Math.random() * w; }
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                    ctx.translate(d.x % w, d.y);
                    drawTowerArtwork(ctx, d.artwork);
                    ctx.restore();
                });

                if (towerState.domainActive) {
                    const fourColors = ['#f43f5e', '#38bdf8', '#fde047', '#c084fc'];
                    for (let i = 0; i < 10; i++) {
                        const sx = w * (0.1 + i * 0.088);
                        const sy = h * 0.16 + Math.sin(t * 3.8 + i) * 12;
                        ctx.save();
                        ctx.translate(sx, sy);
                        ctx.rotate(Math.PI * 0.5);
                        ctx.globalAlpha = 0.78;
                        drawDetailedSword(ctx, 64, '#ffffff', fourColors[i % 4], '#fde047');
                        ctx.restore();
                    }
                }

                // ==================== LAYER 4: TÀN ẢNH THUẤN DI & 2 NHÂN VẬT CHÍNH ====================
                for (let i = heroAnim.afterimages.length - 1; i >= 0; i--) {
                    const ai = heroAnim.afterimages[i];
                    ai.alpha -= 0.045;
                    if (ai.alpha <= 0) {
                        heroAnim.afterimages.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = ai.alpha * 0.55;
                    drawSwordImmortal(ctx, ai.x, ai.y, t, true);
                    ctx.restore();
                }

                drawSwordImmortal(ctx, heroX, heroY, t, false);
                drawDemonSovereign(ctx, bossX, bossY, t);



                // ==================== LAYER 5: TỰ ĐỘNG ĐẤU PHI KIẾM ====================


                // ==================== LAYER 6: HDR ADDITIVE BLOOM & ĐẠI THẦN THÔNG MỚI ====================
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                // 6.00 NHẤN GIỮ CHUỘT: NGỰ KIẾM CHÂN NHÂN (TELEKINETIC SWORD SWARM AROUND CURSOR)


                // 6.001 LỤC ĐẠO LUÂN HỒI BÀN (6-REALM REINCARNATION WHEEL)
                for (let i = canvasReincarnationWheels.length - 1; i >= 0; i--) {
                    const rw = canvasReincarnationWheels[i];
                    rw.life -= 0.02 * frameFactor;
                    if (rw.life <= 0) {
                        canvasReincarnationWheels.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(rw.x, rw.y);
                    ctx.rotate(t * 1.8);
                    ctx.globalAlpha = Math.min(1, rw.life * 1.3);
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 38;

                    ctx.beginPath();
                    ctx.arc(0, 0, 135, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(0, 0, 92, 0, Math.PI * 2);
                    ctx.stroke();

                    const sixRealms = ['天道', '修羅', '人間', '畜生', '餓鬼', '地獄'];
                    for (let k = 0; k < 6; k++) {
                        const a = (k * Math.PI * 2) / 6;
                        ctx.save();
                        ctx.rotate(a);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(135, 0);
                        ctx.stroke();

                        ctx.font = 'bold 16px "Noto Serif SC", serif';
                        ctx.fillStyle = '#fef08a';
                        ctx.fillText(sixRealms[k], 96, -6);
                        ctx.restore();
                    }
                    ctx.restore();
                }

                // 6.002 NHẬT NGUYỆT TINH THẦN BỊ CHÉM ĐÔI TRÊN BẦU TRỜI (SLICED CELESTIAL PLANETS)
                for (let i = canvasCelestialPlanets.length - 1; i >= 0; i--) {
                    const pl = canvasCelestialPlanets[i];
                    pl.life -= 0.018 * frameFactor;
                    if (pl.life < 0.78) {
                        pl.splitOffset += 1.9;
                    }
                    if (pl.life <= 0) {
                        canvasCelestialPlanets.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.translate(pl.x, pl.y);
                    ctx.globalAlpha = Math.min(1, pl.life * 1.4);

                    // Vẽ 2 nửa hành tinh bị kiếm cỏ chém trượt lệch nhau!
                    for (let half of [-1, 1]) {
                        ctx.save();
                        ctx.translate(half * pl.splitOffset * 1.4, half * pl.splitOffset * 0.45);
                        ctx.beginPath();
                        if (half === -1) {
                            ctx.arc(0, 0, pl.r, Math.PI, Math.PI * 2);
                        } else {
                            ctx.arc(0, 0, pl.r, 0, Math.PI);
                        }
                        ctx.closePath();
                        const pGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pl.r);
                        pGrad.addColorStop(0, '#ffffff');
                        pGrad.addColorStop(0.45, pl.color1);
                        pGrad.addColorStop(1, pl.color2);
                        ctx.fillStyle = pGrad;
                        ctx.shadowColor = pl.color1;
                        ctx.shadowBlur = 32;
                        ctx.fill();
                        ctx.restore();
                    }

                    // Khe nứt Kiếm Quang Lục Ngọc phát sáng giữa 2 nửa Tinh Cầu
                    ctx.strokeStyle = '#6ee7b7';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.moveTo(-pl.r * 1.4, 0);
                    ctx.lineTo(pl.r * 1.4, 0);
                    ctx.stroke();

                    ctx.restore();
                }

                // 6.003 THIÊN ĐẠO PHÁP NHÃN CỬU TRỌNG LÔI KIẾP (HEAVENLY TRIBULATION EYE)
                for (let i = canvasTribulationEyes.length - 1; i >= 0; i--) {
                    const ey = canvasTribulationEyes[i];
                    ey.life -= 0.015 * frameFactor;
                    if (ey.life <= 0) {
                        canvasTribulationEyes.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(ey.x, ey.y);
                    ctx.globalAlpha = Math.min(1, ey.life * 1.4);
                    ctx.drawImage(prepareEyeArtwork(ey.slashed), -250, -160, 500, 320);
                    ctx.restore();
                    continue;
                    ctx.strokeStyle = ey.slashed ? '#f43f5e' : '#e879f9';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 40;

                    const split = ey.slashed ? 16 : 0;
                    ctx.beginPath();
                    ctx.moveTo(-140, -split);
                    ctx.quadraticCurveTo(0, -68 - split, 140, -split);
                    ctx.quadraticCurveTo(0, 68 + split, -140, split);
                    ctx.stroke();

                    ctx.fillStyle = ey.slashed ? '#f43f5e' : '#fde047';
                    ctx.beginPath();
                    ctx.arc(0, 0, 28, 0, Math.PI * 2);
                    ctx.fill();

                    if (ey.slashed) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.moveTo(-165, 35);
                        ctx.lineTo(165, -35);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // 6.004 MẢNH VỠ KÍNH KHÔNG GIAN 3D (3D SPATIAL GLASS SHARDS)
                for (let i = canvasGlassShards.length - 1; i >= 0; i--) {
                    const gs = canvasGlassShards[i];
                    gs.x += gs.vx * frameFactor;
                    gs.y += gs.vy * frameFactor;
                    gs.vy += 0.25;
                    gs.rot += gs.vRot;
                    gs.life -= 0.032 * frameFactor;
                    if (gs.life <= 0) {
                        canvasGlassShards.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(gs.x, gs.y);
                    ctx.rotate(gs.rot);
                    ctx.globalAlpha = gs.life;
                    ctx.fillStyle = gs.color;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = gs.color;
                    ctx.shadowBlur = 15;

                    ctx.beginPath();
                    ctx.moveTo(0, -gs.size);
                    ctx.lineTo(gs.size * 0.75, gs.size * 0.6);
                    ctx.lineTo(-gs.size * 0.85, gs.size * 0.4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.01 THÁI CỰC HỖN ĐỘN DIỆT THẾ LUÂN (Spinning Yin-Yang Taiji Wheel)
                for (let i = canvasTaijiWheels.length - 1; i >= 0; i--) {
                    const tw = canvasTaijiWheels[i];
                    tw.progress += 0.032 * frameFactor;
                    const cx = tw.x + (tw.tx - tw.x) * Math.min(1, tw.progress);
                    const cy = tw.y + (tw.ty - tw.y) * Math.min(1, tw.progress);
                    if (tw.progress >= 1) tw.life -= 0.05 * frameFactor;
                    if (tw.life <= 0) {
                        canvasTaijiWheels.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(t * 7);
                    ctx.globalAlpha = tw.life;
                    ctx.strokeStyle = '#34d399';
                    ctx.lineWidth = 5;
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 35;

                    ctx.beginPath();
                    ctx.arc(0, 0, tw.radius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Lưỡi cưa Kiếm Khí quanh Thái Cực Luân
                    for (let k = 0; k < 12; k++) {
                        ctx.save();
                        ctx.rotate((k * Math.PI * 2) / 12);
                        ctx.translate(tw.radius, 0);
                        drawDetailedSword(ctx, 36, '#fde047', '#10b981', '#ffffff');
                        ctx.restore();
                    }
                    ctx.restore();
                }

                // 6.02 CHU TƯỚC PHẦN THIÊN PHƯỢNG HOÀNG LỬA (Soaring Fire Phoenix)
                for (let i = canvasPhoenixes.length - 1; i >= 0; i--) {
                    const ph = canvasPhoenixes[i];
                    ph.progress += 0.036 * frameFactor;
                    const px = ph.sx + (ph.tx - ph.sx) * Math.min(1, ph.progress);
                    const py = ph.sy + (ph.ty - ph.sy) * Math.min(1, ph.progress) - Math.sin(ph.progress * Math.PI) * 55;
                    if (ph.progress >= 1) ph.life -= 0.06 * frameFactor;
                    if (ph.life <= 0) {
                        canvasPhoenixes.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.globalAlpha = ph.life;
                    ctx.fillStyle = '#fb7185';
                    ctx.shadowColor = '#f43f5e';
                    ctx.shadowBlur = 35;

                    // Đôi cánh Chu Tước Lửa sải rộng
                    const flap = Math.sin(t * 16) * 28;
                    ctx.beginPath();
                    ctx.moveTo(45, 0);
                    ctx.lineTo(-25, -75 + flap);
                    ctx.lineTo(-55, -20);
                    ctx.lineTo(-95, 0);
                    ctx.lineTo(-55, 20);
                    ctx.lineTo(-25, 75 - flap);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#fef08a';
                    ctx.beginPath();
                    ctx.arc(10, 0, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 6.03 VẾT CHÉM KHAI THIÊN MÔN XẺ ĐÔI BẦU TRỜI (Heaven Split Dimensional Rift)
                for (let i = canvasHeavenSplits.length - 1; i >= 0; i--) {
                    const hs = canvasHeavenSplits[i];
                    hs.life -= 0.025 * frameFactor;
                    if (hs.life <= 0) {
                        canvasHeavenSplits.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = hs.life;
                    ctx.strokeStyle = hs.color1;
                    ctx.lineWidth = 42 * hs.life;
                    ctx.shadowColor = hs.color2;
                    ctx.shadowBlur = 50;
                    ctx.beginPath();
                    ctx.moveTo(w * 0.1, 0);
                    ctx.lineTo(w * 0.88, h);
                    ctx.stroke();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 14 * hs.life;
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.04 ĐẠI HOANG PHIÊN THIÊN THỦ ẤN & NHƯ LAI THẦN CHƯỞNG (Colossal Descending God Palm)
                for (let i = canvasGiantPalms.length - 1; i >= 0; i--) {
                    const gp = canvasGiantPalms[i];
                    if (gp.y < gp.targetY) {
                        gp.y += 28;
                        if (gp.y >= gp.targetY) {
                            gp.y = gp.targetY;
                            canvasShockwaves.push({ x: gp.x, y: gp.targetY + 45, r: 20, maxR: 220, alpha: 1.0, color: gp.color });
                            spawnSpaceShatter(gp.x, gp.targetY, gp.color, 16);
                        }
                    } else {
                        gp.life -= 0.032 * frameFactor;
                    }
                    if (gp.life <= 0) {
                        canvasGiantPalms.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(gp.x, gp.y);
                    ctx.globalAlpha = gp.life;
                    ctx.fillStyle = gp.color;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = gp.color;
                    ctx.shadowBlur = 45;

                    // Vẽ Pháp Luân & Bàn Tay Cự Thần 5 Ngón khổng lồ ép xuống
                    ctx.beginPath();
                    ctx.arc(0, 0, 95, 0, Math.PI * 2);
                    ctx.stroke();

                    // Lòng bàn tay & 5 ngón tay thần quang
                    ctx.beginPath();
                    ctx.roundRect(-55, -35, 110, 85, 22);
                    ctx.fill();
                    ctx.stroke();
                    const fingerOffsets = [-46, -23, 0, 23, 46];
                    const fingerLens = [52, 68, 76, 68, 48];
                    fingerOffsets.forEach((fx, fIdx) => {
                        ctx.beginPath();
                        ctx.roundRect(fx - 9, -35 - fingerLens[fIdx], 18, fingerLens[fIdx] + 8, 9);
                        ctx.fill();
                        ctx.stroke();
                    });

                    // Ấn chữ Vạn 卍 hoặc Cổ Tự giữa lòng bàn tay
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 48px "Noto Serif SC", serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('卍', 0, 10);
                    ctx.restore();
                }

                // 6.05 PHẬT NỘ HỎA LIÊN - DỊ HỎA DUNG HỢP (3-Color Spinning Supernova Fire Lotus)
                for (let i = canvasFireLotuses.length - 1; i >= 0; i--) {
                    const fl = canvasFireLotuses[i];
                    fl.progress += 0.035 * frameFactor;
                    const cx = fl.sx + (fl.tx - fl.sx) * Math.min(1, fl.progress);
                    const cy = fl.sy + (fl.ty - fl.sy) * Math.min(1, fl.progress);
                    if (fl.progress >= 1) {
                        fl.explodeRadius += 14;
                        fl.life -= 0.04 * frameFactor;
                    }
                    if (fl.life <= 0) {
                        canvasFireLotuses.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(t * 6.5);
                    ctx.globalAlpha = fl.life;

                    const lotusColors = ['#10b981', '#f43f5e', '#fbbf24'];
                    for (let layer = 0; layer < 3; layer++) {
                        ctx.save();
                        ctx.rotate(layer * 0.4 + t * (layer % 2 === 0 ? 3 : -3));
                        const pCount = 8 + layer * 4;
                        const rLen = (48 + layer * 22) + fl.explodeRadius * 0.45;
                        ctx.fillStyle = lotusColors[layer];
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = lotusColors[layer];
                        ctx.shadowBlur = 28;

                        for (let p = 0; p < pCount; p++) {
                            ctx.save();
                            ctx.rotate((p * Math.PI * 2) / pCount);
                            ctx.beginPath();
                            ctx.moveTo(0, 0);
                            ctx.quadraticCurveTo(rLen * 0.5, -18, rLen, 0);
                            ctx.quadraticCurveTo(rLen * 0.5, 18, 0, 0);
                            ctx.fill();
                            ctx.stroke();
                            ctx.restore();
                        }
                        ctx.restore();
                    }
                    ctx.restore();
                }

                // 6.06 THÔN THIÊN HẮC ĐỘNG - VẠN HÓA QUY KHƯ (Gravitational Singularity Black Hole)
                for (let i = canvasBlackHoles.length - 1; i >= 0; i--) {
                    const bh = canvasBlackHoles[i];
                    bh.life -= 0.024 * frameFactor;
                    if (bh.life <= 0) {
                        canvasBlackHoles.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(bh.x, bh.y);
                    ctx.globalAlpha = Math.min(1, bh.life * 1.4);

                    // Đĩa bồi tụ Huyết Tử Ma Quang xoay xoáy
                    for (let ring = 3; ring >= 1; ring--) {
                        ctx.save();
                        ctx.rotate(-t * (4 + ring * 2));
                        ctx.strokeStyle = ring === 1 ? '#f43f5e' : (ring === 2 ? '#a855f7' : '#fda4af');
                        ctx.lineWidth = 6 * ring;
                        ctx.setLineDash([28, 18]);
                        ctx.shadowColor = '#e11d48';
                        ctx.shadowBlur = 35;
                        ctx.beginPath();
                        ctx.arc(0, 0, 38 + ring * 26 * bh.life, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }

                    // Lõi Hắc Động Đen Tuyệt Đối nuốt ánh sáng
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = '#020106';
                    ctx.strokeStyle = '#f43f5e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 42 * bh.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.07 LỤC TỰ ĐẠI MINH CHÚ • KIM CƯƠNG PHẬT ẤN (Golden Sanskrit Swastika Array)
                for (let i = canvasBuddhaSeals.length - 1; i >= 0; i--) {
                    const bs = canvasBuddhaSeals[i];
                    bs.scale += (1.15 - bs.scale) * 0.18;
                    bs.life -= 0.028 * frameFactor;
                    if (bs.life <= 0) {
                        canvasBuddhaSeals.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(bs.x, bs.y);
                    ctx.rotate(t * 2.5);
                    ctx.scale(bs.scale, bs.scale);
                    ctx.globalAlpha = bs.life;
                    ctx.strokeStyle = '#fde047';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 40;

                    ctx.beginPath();
                    ctx.arc(0, 0, 95, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.font = '900 95px "Noto Serif SC", serif';
                    ctx.fillStyle = '#fef08a';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('卍', 0, 0);
                    ctx.restore();
                }

                // 6.08 VĨNH HẰNG BĂNG TINH TRỤ (Erupting Crystalline Ice Pillars)
                for (let i = canvasIcePillars.length - 1; i >= 0; i--) {
                    const ip = canvasIcePillars[i];
                    ip.height = Math.min(ip.maxHeight, ip.height + 32);
                    ip.life -= 0.028 * frameFactor;
                    if (ip.life <= 0) {
                        canvasIcePillars.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(ip.x, ip.baseY);
                    ctx.globalAlpha = ip.life;
                    const iceGrad = ctx.createLinearGradient(0, 0, 0, -ip.height);
                    iceGrad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
                    iceGrad.addColorStop(0.6, 'rgba(103, 232, 249, 0.92)');
                    iceGrad.addColorStop(1, '#ffffff');
                    ctx.fillStyle = iceGrad;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 28;

                    ctx.beginPath();
                    ctx.moveTo(-ip.width * 0.6, 0);
                    ctx.lineTo(-ip.width * 0.35, -ip.height * 0.75);
                    ctx.lineTo(0, -ip.height);
                    ctx.lineTo(ip.width * 0.35, -ip.height * 0.75);
                    ctx.lineTo(ip.width * 0.6, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.09 CHU THIÊN TINH ĐẤU VẪN THẠCH (Cosmic Starlight Meteors)
                for (let i = canvasMeteors.length - 1; i >= 0; i--) {
                    const mt = canvasMeteors[i];
                    mt.x += mt.vx * frameFactor;
                    mt.y += mt.vy * frameFactor;
                    if (mt.y >= mt.targetY) {
                        canvasShockwaves.push({ x: mt.x, y: mt.y, r: 8, maxR: 85, alpha: 0.95, color: mt.color });
                        spawnSpaceShatter(mt.x, mt.y, mt.color, 7);
                        canvasMeteors.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(mt.x, mt.y);
                    ctx.rotate(Math.atan2(mt.vy, mt.vx));
                    const tailGrad = ctx.createLinearGradient(0, 0, -140, 0);
                    tailGrad.addColorStop(0, '#ffffff');
                    tailGrad.addColorStop(0.3, mt.color);
                    tailGrad.addColorStop(1, 'transparent');
                    ctx.strokeStyle = tailGrad;
                    ctx.lineWidth = mt.size * 2.2;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = mt.color;
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-140, 0);
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(0, 0, mt.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 6.0 Dải lụa Kiếm Ý theo trỏ chuột


                // 6.1 Laser Beams
                for (let i = canvasLaserBeams.length - 1; i >= 0; i--) {
                    const lb = canvasLaserBeams[i];
                    lb.life -= 0.06 * frameFactor;
                    if (lb.life <= 0) {
                        canvasLaserBeams.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = lb.life;
                    ctx.strokeStyle = lb.color;
                    ctx.lineWidth = lb.width * lb.life;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = lb.color;
                    ctx.shadowBlur = 35;
                    ctx.beginPath();
                    ctx.moveTo(lb.x1, lb.y1);
                    ctx.lineTo(lb.x2, lb.y2);
                    ctx.stroke();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = (lb.width * 0.4) * lb.life;
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.2 Bán Nguyệt Kiếm Mang
                for (let i = canvasCrescents.length - 1; i >= 0; i--) {
                    const cr = canvasCrescents[i];
                    cr.x += cr.vx * frameFactor;
                    cr.y += cr.vy * frameFactor;
                    cr.life -= 0.04 * frameFactor;
                    if (cr.life <= 0) {
                        canvasCrescents.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(cr.x, cr.y);
                    ctx.rotate(cr.angle);
                    ctx.globalAlpha = cr.life;
                    const crescent = prepareCrescentArtwork(cr.color, cr.radius);
                    const crescentSize = crescent.width / 2;
                    ctx.drawImage(crescent, -crescentSize / 2, -crescentSize / 2, crescentSize, crescentSize);
                    ctx.restore();
                }

                // 6.3 Tia Chớp Kiếm Điện
                for (let i = canvasLightningArcs.length - 1; i >= 0; i--) {
                    const la = canvasLightningArcs[i];
                    la.life -= 0.11 * frameFactor;
                    if (la.life <= 0) {
                        canvasLightningArcs.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = la.life;
                    if (la.sprite) {
                        ctx.translate(la.x, la.y);
                        ctx.rotate(la.angle);
                        ctx.drawImage(la.sprite, -30, -60, la.length + 60, 120);
                        ctx.restore();
                        continue;
                    }
                    ctx.strokeStyle = la.color;
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = la.color;
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    la.points.forEach((pt, idx) => {
                        if (idx === 0) ctx.moveTo(pt.x, pt.y);
                        else ctx.lineTo(pt.x, pt.y);
                    });
                    ctx.stroke();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                    ctx.restore();
                }

                // 6.4 Vết Nứt Không Gian
                for (let i = canvasSpaceCracks.length - 1; i >= 0; i--) {
                    const sc = canvasSpaceCracks[i];
                    sc.life -= 0.045 * frameFactor;
                    if (sc.life <= 0) {
                        canvasSpaceCracks.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(sc.x, sc.y);
                    ctx.globalAlpha = sc.life;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.4 * sc.life;
                    ctx.shadowColor = sc.color;
                    ctx.shadowBlur = 18;

                    sc.branches.forEach(br => {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        br.forEach(seg => ctx.lineTo(seg.x, seg.y));
                        ctx.stroke();
                    });
                    ctx.restore();
                }

                // 6.5 Đường Đạn Phi Kiếm
                for (let i = canvasProjectiles.length - 1; i >= 0; i--) {
                    const p = canvasProjectiles[i];
                    p.progress += p.speed * frameFactor;

                    const inv = 1 - p.progress;
                    const curX = inv * inv * p.sx + 2 * inv * p.progress * p.cx + p.progress * p.progress * p.tx;
                    const curY = inv * inv * p.sy + 2 * inv * p.progress * p.cy + p.progress * p.progress * p.ty;

                    const trailPoint = p.trail.length >= 11 ? p.trail.shift() : { x: 0, y: 0 };
                    trailPoint.x = curX;
                    trailPoint.y = curY;
                    p.trail.push(trailPoint);

                    if (p.trail.length > 2) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(p.trail[0].x, p.trail[0].y);
                        for (let k = 1; k < p.trail.length; k++) {
                            ctx.lineTo(p.trail[k].x, p.trail[k].y);
                        }
                        ctx.strokeStyle = p.glowColor;
                        ctx.lineWidth = p.scale * 6;
                        ctx.lineCap = 'round';
                        ctx.shadowColor = p.glowColor;
                        ctx.shadowBlur = 0;
                        ctx.globalAlpha = 0.78;
                        ctx.stroke();

                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = p.scale * 2;
                        ctx.globalAlpha = 0.95;
                        ctx.stroke();
                        ctx.restore();
                    }

                    const prev = p.trail[Math.max(0, p.trail.length - 2)];
                    const angle = Math.atan2(curY - prev.y, curX - prev.x);
                    ctx.save();
                    ctx.translate(curX, curY);
                    ctx.rotate(angle);
                    ctx.scale(p.scale, p.scale);
                    drawDetailedSword(ctx, 44, p.bladeColor, p.glowColor, '#f59e0b');
                    ctx.restore();

                    if (p.progress >= 1) {
                        if (p.triggerClash) {
                            canvasShockwaves.push({
                                x: p.tx, y: p.ty,
                                r: 5, maxR: 44 + Math.random() * 25,
                                alpha: 0.95,
                                color: p.glowColor
                            });
                            canvasSlashes.push({
                                x: p.tx, y: p.ty,
                                angle: (Math.random() - 0.5) * 2.8,
                                len: 68 + Math.random() * 45,
                                life: 1.0,
                                color: p.bladeColor
                            });
                        }

                        if (canvasParticles.length < 120) {
                            for (let k = 0; k < 4; k++) {
                                if (canvasParticles.length >= 120) break;
                                const spAngle = Math.random() * Math.PI * 2;
                                const spSpeed = 2.5 + Math.random() * 7;
                                const particle = towerParticlePool.pop() || {};
                                particle.x = p.tx; particle.y = p.ty;
                                particle.vx = Math.cos(spAngle) * spSpeed;
                                particle.vy = Math.sin(spAngle) * spSpeed;
                                particle.life = 1;
                                particle.color = k % 2 === 0 ? '#ffffff' : p.glowColor;
                                particle.size = 2 + Math.random() * 3;
                                canvasParticles.push(particle);
                            }
                        }
                        canvasProjectiles.splice(i, 1);
                        if (towerSwordPool.length < 256) towerSwordPool.push(p);
                    }
                }

                // 6.6 Vệt Chém Không Gian
                for (let i = canvasSlashes.length - 1; i >= 0; i--) {
                    const sl = canvasSlashes[i];
                    sl.life -= 0.08 * frameFactor;
                    if (sl.life <= 0) {
                        canvasSlashes.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(sl.x, sl.y);
                    ctx.rotate(sl.angle);
                    ctx.globalAlpha = sl.life;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = sl.color;
                    ctx.shadowBlur = 24;
                    ctx.beginPath();
                    ctx.moveTo(-sl.len, 0);
                    ctx.quadraticCurveTo(0, -7 * sl.life, sl.len, 0);
                    ctx.quadraticCurveTo(0, 7 * sl.life, -sl.len, 0);
                    ctx.fill();
                    ctx.restore();
                }

                // 6.7 Đại Kiếm Khổng Lồ
                for (let i = canvasColossalSwords.length - 1; i >= 0; i--) {
                    const cs = canvasColossalSwords[i];
                    cs.y += cs.vy * frameFactor;
                    if (cs.y >= cs.targetY) {
                        cs.y = cs.targetY;
                        cs.life -= 0.04 * frameFactor;
                    }
                    if (cs.life <= 0) {
                        canvasColossalSwords.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.translate(cs.x, cs.y);
                    ctx.rotate(Math.PI * 0.5);
                    ctx.globalAlpha = cs.life;
                    ctx.scale(4.2, 4.2);
                    drawDetailedSword(ctx, 70, '#ffffff', cs.color, '#fbbf24');
                    ctx.restore();
                }

                // 6.8 Sóng Xung Kích & Hạt Kiếm Quang
                for (let i = canvasShockwaves.length - 1; i >= 0; i--) {
                    const sw = canvasShockwaves[i];
                    sw.r += (sw.maxR - sw.r) * (1 - Math.pow(0.78, frameFactor));
                    sw.alpha -= 0.06 * frameFactor;
                    if (sw.alpha <= 0) {
                        canvasShockwaves.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = sw.alpha;
                    ctx.strokeStyle = sw.color;
                    ctx.lineWidth = 3.0;
                    ctx.shadowColor = sw.color;
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                for (let i = canvasParticles.length - 1; i >= 0; i--) {
                    const pt = canvasParticles[i];
                    pt.x += pt.vx * frameFactor;
                    pt.y += pt.vy * frameFactor;
                    pt.life -= 0.045 * frameFactor;
                    if (pt.life <= 0) {
                        canvasParticles.splice(i, 1);
                        if (towerParticlePool.length < 2048) towerParticlePool.push(pt);
                        continue;
                    }
                    ctx.save();
                    ctx.globalAlpha = pt.life;
                    ctx.fillStyle = pt.color;
                    ctx.shadowColor = pt.color;
                    ctx.shadowBlur = 0;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                ctx.restore();
                ctx.restore();

                if (profileRendering) {
                    const elapsed = performance.now() - frameStartedAt;
                    profileFrames++;
                    profileTotalMs += elapsed;
                    profileMaxMs = Math.max(profileMaxMs, elapsed);
                    if (profileFrames % 30 === 0) {
                        canvas.dataset.renderMeanMs = (profileTotalMs / profileFrames).toFixed(2);
                        canvas.dataset.renderMaxMs = profileMaxMs.toFixed(2);
                        canvas.dataset.renderFrames = String(profileFrames);
                        canvas.dataset.renderFps = (profileFrames * 1000 / (performance.now() - profileStartedAt)).toFixed(1);
                    }
                }
                // Luôn bám theo nhịp màn hình (144 Hz nếu máy hỗ trợ). Gameplay/VFX
                // đã chuẩn hóa theo frameFactor nên tăng FPS không làm animation chạy nhanh hơn.
                if (isTowerActive()) renderFrameId = requestAnimationFrame(renderLoop);
            }
            if (isTowerActive()) wakeEffects();
        }

        function spawnFlyingSwordProjectile(sx, sy, tx, ty, glowColor = '#06b6d4', bladeColor = '#67e8f9', triggerClash = true, scale = 0.96) {
            // Giới hạn cứng mảng canvasProjectiles tối đa 45 phần tử (hết lag 100%)
            if (canvasProjectiles.length >= 45) return;
            const midX = (sx + tx) * 0.5;
            const midY = (sy + ty) * 0.5 + (Math.random() - 0.5) * 195;
            const sword = towerSwordPool.pop() || { trail: [] };
            sword.sx = sx; sword.sy = sy;
            sword.cx = midX; sword.cy = midY;
            sword.tx = tx; sword.ty = ty;
            sword.progress = 0;
            sword.speed = 0.068 + Math.random() * 0.035;
            sword.glowColor = glowColor; sword.bladeColor = bladeColor;
            sword.triggerClash = triggerClash; sword.scale = scale;
            sword.trail.length = 0;
            canvasProjectiles.push(sword);
        }

        function fireCanvasSwordQi(fromHero = true, color = '#38bdf8', count = 3, isHeavyCrit = false) {
            if (!fromHero) return;
            const canvas = document.getElementById('combat-canvas');
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;
            const elemObj = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;

            const sx = fromHero ? w * 0.24 : w * 0.76;
            const sy = h * 0.56;
            const tx = fromHero ? w * 0.76 : w * 0.24;
            const ty = h * 0.56;

            spawnCrescentWave(sx, sy - 10, tx, ty - 10, color, isHeavyCrit ? 72 : 46);

            if (fromHero && isHeavyCrit) {
                heroAnim.dashOffset = w * 0.36;
                heroAnim.avatarSlashAngle = 1.25;
                heroAnim.afterimages.push(
                    { x: w * 0.32, y: sy, alpha: 0.95 },
                    { x: w * 0.44, y: sy - 14, alpha: 0.8 },
                    { x: w * 0.56, y: sy + 10, alpha: 0.65 }
                );
                spawnLaserBeam(sx, sy - 18, tx + 45, ty - 18, elemObj.color, 26);
                spawnSpaceShatter(tx, ty - 15, elemObj.color, 12);
                spawnCalligraphySeal('斬', tx, ty - 45, elemObj.color);
                spawnLightningArc(sx, sy - 20, tx, ty - 15, elemObj.color);
                triggerCameraZoom(1.07, 320);
                triggerAnimeImpactFrame();

                canvasSlashes.push(
                    { x: tx, y: ty - 15, angle: 0.65, len: 145, life: 1.0, color: elemObj.color },
                    { x: tx, y: ty - 15, angle: -0.65, len: 145, life: 1.0, color: '#38bdf8' }
                );
            } else if (fromHero) {
                heroAnim.dashOffset = 45;
                heroAnim.avatarSlashAngle = 0.45;
            } else {
                bossAnim.dashOffset = -45;
            }

            for (let i = 0; i < count; i++) {
                scheduleTowerEffect(() => {
                    spawnFlyingSwordProjectile(
                        sx, sy + (Math.random() * 65 - 32),
                        tx + (Math.random() * 35 - 17), ty + (Math.random() * 65 - 32),
                        color,
                        fromHero ? elemObj.color : '#fda4af',
                        true,
                        isHeavyCrit ? 1.32 : 0.98
                    );
                }, i * 45);
            }
        }

        function fmt(n) {
            return Math.round(n).toLocaleString('vi-VN');
        }
        function fmtShort(n) {
            if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
            if (n >= 1e3) return Math.round(n / 1e3) + 'K';
            return n;
        }
        function getHeroCP() {
            const h = towerState.hero;
            return Math.round((h.maxHp + h.atk * 5.2 + h.def * 4) * (1 + (h.crit + h.eva + h.swordCount) / 180));
        }

        /**
         * 8. CHỌN NGŨ HÀNH KIẾM Ý & ÔN DƯỠNG KIẾM TRẬN
         */
        function selectHeroElement(elemKey) {
            if (!ELEMENTS[elemKey]) return;
            towerState.hero.element = elemKey;
            const elemObj = ELEMENTS[elemKey];

            ELEMENT_KEYS.forEach(k => {
                const btn = document.getElementById(`elem-btn-${k}`);
                if (!btn) return;
                if (k === elemKey) {
                    btn.className = "px-2 py-1 rounded-lg border-2 border-amber-400 bg-amber-500/25 text-amber-200 text-[11px] font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] transition";
                } else {
                    btn.className = "px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-[11px] opacity-70 hover:opacity-100 transition";
                }
            });

            document.getElementById('hero-element-tag').textContent = elemObj.name;
            playSound('sword');
            const canvas = document.getElementById('combat-canvas');
            if (canvas) {
                spawnCalligraphySeal(elemObj.icon, canvas.width * 0.23, canvas.height * 0.45, elemObj.color);
            }

            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            if (fObj) updateArenaHUD(fObj);
        }

        function forgeSwordUpgrade() {
            const cost = TOWER_RULES.forgeSwordCost;
            if (towerState.linhThach < cost) {
                addLog(`<span class="text-rose-400">⚠️ Cần 100,000 Linh Thạch để Ôn Dưỡng Kiếm Trận! Hãy Càn Quét hoặc vượt tầng để thu thập thêm.</span>`);
                return;
            }
            towerState.linhThach -= cost;
            towerState.hero.swordCount++;
            towerState.hero.atk += 25000;
            towerState.hero.crit = Math.min(90, towerState.hero.crit + 1);

            document.getElementById('ui-linh-thach').textContent = fmt(towerState.linhThach);
            document.getElementById('ui-sword-count-top').textContent = towerState.hero.swordCount;

            playSound('bell');
            const canvas = document.getElementById('combat-canvas');
            if (canvas) {
                spawnCalligraphySeal('鑄劍', canvas.width * 0.23, canvas.height * 0.42, '#fde047');
                spawnSpaceShatter(canvas.width * 0.23, canvas.height * 0.55, '#fde047', 10);
            }
            spawnFloatingText('hero-stage-anchor', `🗡️ +1 PHI KIẾM HỘ THỂ & +25K CÔNG!`, 'ult');
            addLog(`<span class="text-amber-300 font-bold">🔥 [Ôn Dưỡng Kiếm Trận]</span> Đạo hữu tiêu hao 100,000 Linh Thạch đúc thêm <strong>+1 Bản Mệnh Phi Kiếm</strong> (Tổng: ${towerState.hero.swordCount} Kiếm) và tăng <strong>+25,000 Kiếm Công</strong>!`);

            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            if (fObj) updateArenaHUD(fObj);

            syncWithParent({
                action: 'forge_sword',
                linhThachCost: cost,
                linhThachTotal: towerState.linhThach,
                swordCount: towerState.hero.swordCount
            });
        }

        function incrementCombo() {
            towerState.comboCount++;
            const box = document.getElementById('combo-counter-box');
            const numEl = document.getElementById('combo-number');
            const bonusEl = document.getElementById('combo-bonus-text');
            if (!box || !numEl) return;

            box.classList.remove('hidden');
            numEl.textContent = towerState.comboCount;
            bonusEl.textContent = `(+${Math.min(150, towerState.comboCount * 2)}% Bạo Thương)`;

            box.classList.remove('combo-badge-anim');
            void box.offsetWidth;
            box.classList.add('combo-badge-anim');
        }

        /**
         * 9. RENDER GIAO DIỆN 50 TẦNG & BẢNG RỚT ĐỒ
         */
        function selectTierGroup(tierNum) {
            towerState.selectedTier = tierNum;
            const tierThemes = { 1: 'cosmic', 2: 'immortal', 3: 'thunder', 4: 'bloodmoon', 5: 'bloodmoon' };
            if (tierThemes[tierNum]) {
                towerState.skyTheme = tierThemes[tierNum];
            }

            for (let i = 1; i <= 5; i++) {
                const btn = document.getElementById(`tier-btn-${i}`);
                if (!btn) continue;
                if (i === tierNum) {
                    btn.className = "py-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 transition font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]";
                } else {
                    btn.className = "py-1.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 transition";
                }
            }
            renderFloorList();
        }

        function setupCustomBattleUI(enemy) {
            if (!enemy) return;
            towerState.customBattle = enemy;

            const titleEl = document.getElementById('tower-main-title') || document.querySelector('.tower-identity h1');
            if (titleEl) {
                titleEl.textContent = enemy.titleBadge || `⚔️ CHIẾN ĐẤU • ${enemy.name.toUpperCase()}`;
            }
            const tagEl = document.getElementById('ui-cleared-badge');
            if (tagEl) {
                tagEl.textContent = enemy.mode === 'arena' ? '⚔️ Đấu Pháp Đài' : (enemy.mode === 'tamma' ? '💀 Huyễn Cảnh' : (enemy.mode === 'sect_trial' ? '⛩️ Thí Luyện' : '🌀 Quyết Đấu'));
            }

            renderFloorList();

            const fObj = {
                floor: enemy.floor || 1,
                name: enemy.name || 'Đối Thủ',
                title: enemy.titleBadge || enemy.name,
                realmUnlock: enemy.realm || 'Trúc Cơ',
                element: enemy.element || 'Hỏa',
                hp: Number(enemy.hp || enemy.maxHp || 100000),
                maxHp: Number(enemy.hp || enemy.maxHp || 100000),
                atk: Number(enemy.atk || 12000),
                def: Number(enemy.def || 4000),
                crit: Number(enemy.crit || 15),
                eva: Number(enemy.eva || 10),
                cp: Number(enemy.cp || (enemy.atk * 3 + enemy.hp * 0.1)),
                icon: enemy.icon || '👹',
                drops: Array.isArray(enemy.drops) ? enemy.drops : [
                    { id: 'custom_reward', name: enemy.rewards || 'Chiến Lợi Phẩm', rarity: 'rare', icon: enemy.icon || '🎁', desc: enemy.rewards || 'Phần thưởng chiến thắng' }
                ]
            };
            updateArenaHUD(fObj);

            if (towerState.inCombat) stopCombat();
            setTimeout(() => {
                if (!towerState.inCombat) startOrStopCombat();
            }, 180);
        }

        function renderFloorList() {
            const box = document.getElementById('floor-list-container');
            if (!box) return;

            if (towerState.customBattle) {
                const cb = towerState.customBattle;
                const elemInfo = ELEMENTS[cb.element] || ELEMENTS.Hoa;
                box.innerHTML = `
                    <div class="p-3.5 rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-950/40 via-slate-900/80 to-slate-950/90 shadow-lg space-y-3">
                        <div class="flex items-center gap-2.5 border-b border-amber-500/30 pb-2.5">
                            <span class="text-3xl shrink-0 p-1.5 rounded-xl bg-black/60 border border-amber-500/30">${cb.icon || '⚔️'}</span>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-sm font-bold text-amber-300 font-xianxia truncate">${cb.name}</h3>
                                <div class="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                                    <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold text-[10px]">${cb.realm || 'Trúc Cơ'}</span>
                                    <span>${elemInfo.icon} Hệ ${elemInfo.name}</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-1.5 text-xs font-mono bg-black/40 p-2.5 rounded-lg border border-slate-800">
                            <div class="flex justify-between text-slate-300">
                                <span>Khí Huyết:</span>
                                <span class="text-rose-400 font-bold">${Number(cb.hp || cb.maxHp || 100000).toLocaleString('vi-VN')}</span>
                            </div>
                            <div class="flex justify-between text-slate-300">
                                <span>Công Kích:</span>
                                <span class="text-amber-400 font-bold">${Number(cb.atk || 12000).toLocaleString('vi-VN')}</span>
                            </div>
                            <div class="flex justify-between text-slate-300">
                                <span>Phòng Ngự:</span>
                                <span class="text-cyan-400 font-bold">${Number(cb.def || 4000).toLocaleString('vi-VN')}</span>
                            </div>
                            <div class="flex justify-between text-slate-300">
                                <span>Chiến Lực:</span>
                                <span class="text-emerald-400 font-bold">${Number(cb.cp || (cb.atk * 3 + cb.hp * 0.1)).toLocaleString('vi-VN')} CP</span>
                            </div>
                        </div>
                        ${cb.rewards ? `
                        <div class="border-t border-slate-800 pt-2 text-[11px]">
                            <div class="text-amber-300 font-semibold mb-1 flex items-center gap-1"><span>🎁</span> Thưởng Chiến Thắng:</div>
                            <div class="text-slate-300 text-[10px] leading-relaxed bg-slate-950/70 p-2 rounded border border-slate-800/80">${cb.rewards}</div>
                        </div>
                        ` : ''}
                        <div class="text-center pt-1 border-t border-slate-800/60">
                            <span class="text-[10px] text-amber-400/90 font-medium animate-pulse">⚡ Sàn Đấu Quyết Chiến Đơn Lẻ</span>
                        </div>
                    </div>
                `;
                return;
            }

            const floors = TOWER_50_FLOORS.filter(f => f.tier === towerState.selectedTier).slice().reverse();

            box.innerHTML = floors.map(f => {
                const isCleared = f.floor <= towerState.highestCleared;
                const isSelected = f.floor === towerState.selectedFloor;
                const isLocked = f.floor > towerState.highestCleared + 1;
                const elemInfo = ELEMENTS[f.element] || ELEMENTS.Kim;

                let cardStyle = "border-slate-800/90 bg-slate-900/50 hover:border-slate-700";
                if (isSelected) cardStyle = "border-amber-400 bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
                else if (isLocked) cardStyle = "border-slate-800/40 bg-slate-950/40 opacity-50 cursor-not-allowed";
                else if (f.isMilestone) cardStyle = "border-rose-500/40 bg-rose-950/20";
                else if (isCleared) cardStyle = "border-emerald-500/25 bg-emerald-950/10";

                return `
                    <div onclick="selectFloor(${f.floor})" class="p-2 rounded-xl border ${cardStyle} cursor-pointer transition flex items-center justify-between">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-xianxia font-bold text-xs ${
                                f.isMilestone ? 'bg-rose-600 text-white shadow' :
                                isCleared ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                'bg-slate-800 text-slate-400'
                            }">
                                ${f.floor}
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1">
                                    <span class="text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}">${f.name.replace(/\s*\(Tầng \d+\)/i, '')}</span>
                                    <span class="text-[10px]" title="Hệ ${elemInfo.name}">${elemInfo.icon}</span>
                                </div>
                                <div class="text-[10px] text-slate-400 font-mono">
                                    HP: ${fmtShort(f.hp)} • Công: ${fmtShort(f.atk)}
                                </div>
                            </div>
                        </div>
                        <div class="shrink-0 ml-1">
                            ${isCleared
                                ? '<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✔ Qua</span>'
                                : isLocked
                                ? '<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500">🔒</span>'
                                : '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">🗡️ Trảm</span>'
                            }
                        </div>
                    </div>
                `;
            }).join('');
        }

        function jumpToHighestFloor() {
            if (towerState.inCombat) stopCombat();
            const nextF = Math.min(50, towerState.highestCleared + 1);
            const tier = Math.ceil(nextF / 10);
            selectTierGroup(tier);
            selectFloor(nextF);
        }

        function updateClimbProgressHUD() {
            const badge = document.getElementById('climb-progress-badge');
            if (badge) {
                const pct = Math.round((towerState.highestCleared / 50) * 100);
                badge.textContent = `${towerState.highestCleared}/50 (${pct}%)`;
            }
            const headerCleared = document.getElementById('ui-cleared-badge');
            if (headerCleared) {
                headerCleared.textContent = `Đã vượt: ${towerState.highestCleared}/50 Tầng`;
            }
        }

        function selectFloor(floorNum) {
            if (towerState.inCombat) return;

            // Kiểm tra phong ấn tầng
            if (floorNum > towerState.highestCleared + 1) {
                playSound('bell');
                spawnFloatingText('hero-stage-anchor', '🔒 TẦNG NÀY ĐANG BỊ PHONG ẤN!', 'dodge');
                addLog(`<span class="text-rose-400 font-bold">🔒 [Phong Ấn Trấn Yêu]</span> Tầng ${floorNum} chưa mở cửa! Hãy vượt Tầng ${towerState.highestCleared + 1} trước.`);
                return;
            }

            const fObj = TOWER_50_FLOORS.find(x => x.floor === floorNum);
            if (!fObj) return;
            towerState.currentEnemy = fObj;

            towerState.selectedFloor = floorNum;
            towerState.selectedTier = Math.ceil(floorNum / 10);

            // Đồng bộ thiên tượng theo tầng
            const tierThemes = { 1: 'cosmic', 2: 'immortal', 3: 'thunder', 4: 'bloodmoon', 5: 'bloodmoon' };
            if (tierThemes[towerState.selectedTier]) {
                towerState.skyTheme = tierThemes[towerState.selectedTier];
            }

            towerState.hero.hp = towerState.hero.maxHp;
            towerState.hero.mp = 0;
            towerState.bossEnragedVisual = false;
            towerState.bossBrokenVisual = false;
            towerState.comboCount = 0;
            document.getElementById('combo-counter-box').classList.add('hidden');

            playSound('sword');
            triggerCameraZoom(1.04, 300);
            spawnFloatingText('hero-stage-anchor', `🗼 TIẾN VÀO TẦNG ${floorNum}!`, 'dodge');

            updateArenaHUD(fObj);
            renderFloorList();
            updateClimbProgressHUD();
        }

        function updateArenaHUD(fObj) {
            if (towerState.customBattle) {
                const cb = towerState.customBattle;
                document.getElementById('arena-floor-title').textContent = `${cb.titleBadge || '⚔️ ĐỐI CHIẾN'} • ${cb.name}`;
                document.getElementById('arena-boss-cp').textContent = fmt(fObj.cp);
                document.getElementById('arena-floor-tag').textContent = `⚔️ ${cb.realm || 'Đại Địch'}`;
            } else {
                document.getElementById('arena-floor-title').textContent = `Tầng ${fObj.floor} • ${fObj.name.replace(/\s*\(Tầng \d+\)/i, '')}`;
                document.getElementById('arena-boss-cp').textContent = fmt(fObj.cp);
                document.getElementById('arena-floor-tag').textContent = fObj.isMilestone
                    ? `🔥 CỘT MỐC ${fObj.realmUnlock.toUpperCase()}`
                    : `🗡️ TẦNG THÍ LUYỆN ${fObj.floor}/50`;
            }

            const bossElem = ELEMENTS[fObj.element] || ELEMENTS.Moc;
            const heroElem = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;
            document.getElementById('boss-element-badge').innerHTML = `Hệ: ${bossElem.icon} ${fObj.element} Yêu`;

            const counterEl = document.getElementById('ui-element-counter-status');
            if (counterEl) {
                if (heroElem.counters === fObj.element) {
                    counterEl.className = "text-xs text-emerald-400 font-bold animate-pulse";
                    counterEl.innerHTML = `⚡ Đang Khắc Chế [${bossElem.name}] (+35% Sát Thương)!`;
                } else {
                    const counterKey = Object.keys(ELEMENTS).find(k => ELEMENTS[k].counters === fObj.element) || 'Kim';
                    const targetElem = ELEMENTS[counterKey];
                    if (bossElem.counters === towerState.hero.element) {
                        counterEl.className = "text-xs text-rose-400 font-bold flex items-center gap-1.5 flex-wrap";
                        counterEl.innerHTML = `⚠️ Bị Khắc Hệ! <button onclick="selectHeroElement('${counterKey}')" class="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/60 text-amber-200 text-[10px] font-bold animate-pulse transition">⚡ Đổi sang ${targetElem.name} để lật kèo</button>`;
                    } else {
                        counterEl.className = "text-xs text-slate-300 flex items-center gap-1.5 flex-wrap";
                        counterEl.innerHTML = `<span>☯️ Cân Bằng:</span> <button onclick="selectHeroElement('${counterKey}')" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/60 text-amber-200 text-[10px] font-bold transition">⚡ Đổi sang ${targetElem.name} (+35% Công)</button>`;
                    }
                }
            }

            const myCp = getHeroCP();
            const ratio = (myCp / (fObj.cp || 1)).toFixed(2);
            const ratioEl = document.getElementById('arena-cp-ratio');
            if (ratioEl) {
                if (ratio >= 1) {
                    ratioEl.className = "text-xs text-emerald-400 font-semibold";
                    ratioEl.textContent = `Kiếm Lực: ${fmt(myCp)} (${ratio}x)`;
                } else {
                    ratioEl.className = "text-xs text-amber-300 font-semibold";
                    ratioEl.textContent = `Kiếm Lực: ${fmt(myCp)} (${ratio}x)`;
                }
            }

            updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp, fObj.hp, fObj.hp, 0, 100, false);
            document.getElementById('boss-hud-name').textContent = `👹 ${fObj.name}`;
            document.getElementById('boss-stats-mini').textContent = `Bạo: ${fObj.crit}% | Né: ${fObj.eva}%`;

            updateFightButtonUI(towerState.inCombat);

            const lootTableEl = document.getElementById('loot-table-floor');
            if (lootTableEl) lootTableEl.textContent = towerState.customBattle ? (towerState.customBattle.name || 'Quyết Đấu') : fObj.floor;
            const dropBox = document.getElementById('floor-drop-preview');
            const drops = Array.isArray(fObj.drops) ? fObj.drops : [];
            if (dropBox) {
                dropBox.innerHTML = drops.length > 0 ? drops.map(item => `
                    <div class="p-2 rounded-xl border rarity-${item.rarity || 'Dia'} flex items-center gap-2">
                        <div class="text-xl shrink-0">${item.icon || '🎁'}</div>
                        <div class="min-w-0">
                            <div class="text-[11px] font-bold truncate">${item.name}</div>
                            <div class="text-[9px] opacity-80 truncate">${item.desc || ''}</div>
                        </div>
                    </div>
                `).join('') : `<div class="p-2 text-xs text-slate-400 italic">Thưởng quyết chiến danh dự</div>`;
            }

            if (!towerState.customBattle) {
                const nextMilestoneFloor = Math.ceil(fObj.floor / 10) * 10;
                const mBoss = TOWER_50_FLOORS.find(x => x.floor === nextMilestoneFloor);
                if (mBoss) {
                    const mTitle = document.getElementById('milestone-title-right');
                    if (mTitle) mTitle.textContent = `Cột Mốc Tầng ${mBoss.floor}: ${mBoss.realmUnlock}`;
                    const mDesc = document.getElementById('milestone-desc-right');
                    if (mDesc) mDesc.textContent = mBoss.milestoneDesc;
                    const mBtn = document.getElementById('btn-breakthrough-milestone');
                    if (towerState.highestCleared >= mBoss.floor) {
                        const mStat = document.getElementById('milestone-status-text');
                        if (mStat) {
                            mStat.textContent = "🔓 Đã Phá Phong Ấn";
                            mStat.className = "text-xs font-bold text-emerald-400";
                        }
                        if (mBtn) {
                            mBtn.disabled = false;
                            mBtn.className = "mt-2 w-full py-2 rounded-xl font-xianxia font-bold text-xs uppercase bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg cursor-pointer transition hover:brightness-110";
                            mBtn.textContent = `🌌 ĐỘT PHÁ ${mBoss.realmUnlock.toUpperCase()} NGAY`;
                        }
                    } else {
                        const mStat = document.getElementById('milestone-status-text');
                        if (mStat) {
                            mStat.textContent = "🔒 Chưa Vượt Ải";
                            mStat.className = "text-xs font-bold text-rose-400";
                        }
                        if (mBtn) {
                            mBtn.disabled = true;
                            mBtn.className = "mt-2 w-full py-2 rounded-xl font-xianxia font-bold text-xs uppercase bg-slate-800 text-slate-500 cursor-not-allowed opacity-60";
                            mBtn.textContent = `🔒 CẦN TRẢM BOSS TẦNG ${mBoss.floor}`;
                        }
                    }
                }
            }

            document.getElementById('stat-atk').textContent = fmtShort(towerState.hero.atk);
            document.getElementById('stat-def').textContent = fmtShort(towerState.hero.def);
            document.getElementById('stat-crit').textContent = towerState.hero.crit + '%';
            document.getElementById('stat-eva').textContent = towerState.hero.eva + '%';
        }

        let lastHeroHp = null;
        let lastBossHp = null;

        function updateBarsUI(hHp, hMaxHp, hMp, bHp, bMaxHp, bMp, bToughness = 100, bBroken = false) {
            const hPct = Math.max(0, Math.min(100, (hHp / (hMaxHp || 1)) * 100));
            const heroFill = document.getElementById('hero-hp-fill');
            const heroGhost = document.getElementById('hero-hp-ghost');
            if (heroFill) heroFill.style.width = `${hPct}%`;
            if (heroGhost) {
                if (lastHeroHp !== null && hHp > lastHeroHp) {
                    heroGhost.style.transition = 'none';
                    heroGhost.style.width = `${hPct}%`;
                    void heroGhost.offsetWidth;
                    heroGhost.style.transition = 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.35s';
                } else {
                    heroGhost.style.transition = 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.35s';
                    heroGhost.style.width = `${hPct}%`;
                }
            }
            document.getElementById('hero-hp-label').textContent = `${fmt(hHp)} / ${fmt(hMaxHp)}`;

            // Nháy đỏ viền khi mất trên 15% máu tối đa
            if (lastHeroHp !== null && (lastHeroHp - hHp) > hMaxHp * 0.15) {
                const card = document.getElementById('hero-hud-card');
                if (card) {
                    card.classList.add('ring-2', 'ring-rose-500');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-rose-500'), 700);
                }
            }
            lastHeroHp = hHp;

            const bPct = Math.max(0, Math.min(100, (bHp / (bMaxHp || 1)) * 100));
            const bossFill = document.getElementById('boss-hp-fill');
            const bossGhost = document.getElementById('boss-hp-ghost');
            if (bossFill) bossFill.style.width = `${bPct}%`;
            if (bossGhost) {
                if (lastBossHp !== null && bHp > lastBossHp) {
                    bossGhost.style.transition = 'none';
                    bossGhost.style.width = `${bPct}%`;
                    void bossGhost.offsetWidth;
                    bossGhost.style.transition = 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.35s';
                } else {
                    bossGhost.style.transition = 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.35s';
                    bossGhost.style.width = `${bPct}%`;
                }
            }
            document.getElementById('boss-hp-label').textContent = `${fmt(bHp)} / ${fmt(bMaxHp)}`;

            // Nháy đỏ viền Boss khi Boss mất trên 15% máu tối đa
            if (lastBossHp !== null && (lastBossHp - bHp) > bMaxHp * 0.15) {
                const card = document.getElementById('boss-hud-card');
                if (card) {
                    card.classList.add('ring-2', 'ring-rose-500');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-rose-500'), 700);
                }
            }
            lastBossHp = bHp;

            document.getElementById('hero-mp-fill').style.width = `${Math.min(100, hMp)}%`;
            document.getElementById('hero-mp-label').textContent = `${Math.min(100, Math.round(hMp))}/100`;

            document.getElementById('boss-mp-fill').style.width = `${Math.min(100, bMp)}%`;
            document.getElementById('boss-mp-label').textContent = `${Math.min(100, Math.round(bMp))}/100`;

            // Cảnh báo Boss đang tụ lực đại sát chiêu (trên Card & trên đầu Boss)
            const ultWarn = document.getElementById('boss-ult-warning');
            const headWarn = document.getElementById('boss-head-warning');
            if (towerState.bossChargingUlt) {
                if (ultWarn) {
                    ultWarn.classList.remove('hidden');
                    const enemyName = towerState.currentEnemy?.name || 'Yêu Vương';
                    ultWarn.innerHTML = `⚠️ CẢNH BÁO: [${enemyName.toUpperCase()}] ĐANG TỤ LỰC HỦY DIỆT! (Dùng [1] Hộ Thân hoặc Chiêu Phá Cang để ngắt!)`;
                }
                if (headWarn) headWarn.classList.remove('hidden');
            } else {
                if (ultWarn) ultWarn.classList.add('hidden');
                if (headWarn) headWarn.classList.add('hidden');
            }

            const tFill = document.getElementById('boss-toughness-fill');
            const tLabel = document.getElementById('boss-toughness-label');
            const tTitle = document.getElementById('boss-toughness-title');
            if (tFill && tLabel) {
                tFill.style.width = `${Math.max(0, bToughness)}%`;
                tLabel.textContent = bBroken ? `VỠ CANG!` : `${Math.round(bToughness)}%`;
                tTitle.innerHTML = bBroken
                    ? `<span class="text-amber-300 animate-pulse">💥 PHÁ GIÁP:</span>`
                    : `🛡️ Yêu Cang:`;
            }
        }

        /**
         * 10. HIỆU ỨNG THỊ GIÁC ĐẠI CHIÊU V2
         */
        function spawnFloatingText(anchorId, text, type = 'normal') {
            const anchor = document.getElementById(anchorId);
            if (!anchor) return;
            const el = document.createElement('div');

            let styleClass = "floating-dmg dmg-normal text-lg text-slate-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]";
            if (type === 'crit') {
                styleClass = "floating-dmg dmg-crit text-2xl md:text-3xl text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,1)]";
            } else if (type === 'ult') {
                styleClass = "floating-dmg dmg-crit text-3xl md:text-4xl text-cyan-200 drop-shadow-[0_0_28px_rgba(34,211,238,1)]";
            } else if (type === 'dodge') {
                styleClass = "floating-dmg dmg-dodge text-xl text-cyan-300 italic drop-shadow-[0_2px_10px_rgba(6,182,212,0.95)]";
            } else if (type === 'heal') {
                styleClass = "floating-dmg dmg-normal text-xl text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.95)]";
            } else if (type === 'boss-hit') {
                styleClass = "floating-dmg dmg-normal text-xl text-rose-400 drop-shadow-[0_2px_8px_rgba(244,63,94,0.95)]";
            }

            el.className = styleClass;
            el.style.left = `${45 + (Math.random() * 16 - 8)}%`;
            el.style.top = `34%`;
            el.textContent = text;
            anchor.appendChild(el);

            // Giới hạn tối đa 12 số sát thương bay đồng thời để tránh tràn DOM
            while (anchor.children.length > 12 && anchor.firstElementChild) {
                anchor.firstElementChild.remove();
            }

            setTimeout(() => el.remove(), 1100);
        }

        function triggerScreenShake(mode = 'crit') {
            const arena = document.getElementById('arena-viewport');
            const cls = mode === 'ult' ? 'vfx-shake-ult' : 'vfx-shake-crit';
            arena.classList.remove('vfx-shake-crit', 'vfx-shake-ult');
            void arena.offsetWidth;
            arena.classList.add(cls);
        }

        function playHeavenlyLightningVFX(ultObj, targetSide = 'boss') {
            const layer = document.getElementById('vfx-overlay-layer');
            const canvas = document.getElementById('combat-canvas');
            const leftPos = targetSide === 'boss' ? '76%' : '24%';

            triggerAnimeCutIn(ultObj.name.toUpperCase(), ultObj.subtitle || "THƯỢNG CỔ KIẾM QUYẾT", ultObj.icon || "⚡");

            if (canvas) {
                const w = canvas.width;
                const h = canvas.height;
                const targetX = targetSide === 'boss' ? w * 0.77 : w * 0.23;
                const targetY = h * 0.52;

                if (ultObj.vfxType === 'taiji') {
                    canvasTaijiWheels.push({
                        x: w * 0.24, y: h * 0.54,
                        tx: targetX, ty: targetY,
                        progress: 0, radius: 92, life: 1.0
                    });
                } else if (ultObj.vfxType === 'phoenix') {
                    canvasPhoenixes.push({
                        sx: w * 0.18, sy: h * 0.55,
                        tx: targetX + 40, ty: targetY,
                        progress: 0, life: 1.0
                    });
                } else if (ultObj.vfxType === 'heavensplit') {
                    canvasHeavenSplits.push({
                        life: 1.0,
                        color1: ultObj.boltColor2,
                        color2: ultObj.boltColor3
                    });
                } else if (ultObj.vfxType === 'giantpalm') {
                    canvasGiantPalms.push({
                        x: targetX,
                        y: -160,
                        targetY: targetY - 10,
                        color: ultObj.boltColor2,
                        life: 1.0
                    });
                } else if (ultObj.vfxType === 'firelotus') {
                    canvasFireLotuses.push({
                        sx: w * 0.25, sy: h * 0.52,
                        tx: targetX, ty: targetY,
                        progress: 0, explodeRadius: 0, life: 1.0
                    });
                } else if (ultObj.vfxType === 'blackhole') {
                    canvasBlackHoles.push({
                        x: targetX, y: targetY - 10,
                        life: 1.0
                    });
                } else if (ultObj.vfxType === 'buddha') {
                    canvasBuddhaSeals.push({
                        x: targetX, y: targetY - 15,
                        scale: 2.6, life: 1.0
                    });
                } else if (ultObj.vfxType === 'icepillar') {
                    for (let p = 0; p < 6; p++) {
                        setTimeout(() => {
                            canvasIcePillars.push({
                                x: targetX - 95 + p * 38,
                                baseY: h * 0.78,
                                width: 34 + Math.random() * 14,
                                height: 20,
                                maxHeight: 165 + Math.random() * 85,
                                life: 1.0
                            });
                        }, p * 55);
                    }
                } else if (ultObj.vfxType === 'meteor') {
                    for (let m = 0; m < 14; m++) {
                        setTimeout(() => {
                            const startX = w * (0.15 + Math.random() * 0.45);
                            const destX = targetX + (Math.random() - 0.5) * 160;
                            const destY = targetY + (Math.random() - 0.5) * 90;
                            const angle = Math.atan2(destY + 80, destX - startX);
                            canvasMeteors.push({
                                x: startX,
                                y: -60,
                                vx: Math.cos(angle) * 26,
                                vy: Math.sin(angle) * 26,
                                targetY: destY,
                                size: 9 + Math.random() * 7,
                                color: m % 2 === 0 ? ultObj.boltColor2 : ultObj.boltColor3
                            });
                        }, m * 45);
                    }
                } else if (ultObj.vfxType === 'timestop') {
                    triggerTimeStopVisual(1150);
                    triggerCinemaLetterbox("⏳ THỜI KHÔNG NGƯNG ĐỌNG • VẠN VẬT TĨNH CHỈ ⏳", 1800);
                    spawnGlassShatterShards(targetX, targetY, '#38bdf8', 24);
                } else if (ultObj.vfxType === 'reincarnation') {
                    triggerCinemaLetterbox("☸️ LỤC ĐẠO LUÂN HỒI BÀN • CHUNG CỰC PHÁN QUYẾT ☸️", 2400);
                    canvasReincarnationWheels.push({
                        x: targetX,
                        y: targetY - 25,
                        life: 1.0
                    });
                    spawnGlassShatterShards(targetX, targetY, '#fde047', 24);
                } else if (ultObj.vfxType === 'grasscut') {
                    triggerGrassCutsStarsSpectacle();
                } else if (ultObj.vfxType === 'swordrain') {
                    for (let s = 0; s < 28; s++) {
                        setTimeout(() => {
                            spawnFlyingSwordProjectile(
                                w * (0.1 + Math.random() * 0.5),
                                -40 - Math.random() * 90,
                                targetX + (Math.random() - 0.5) * 110,
                                targetY + (Math.random() - 0.5) * 90,
                                ultObj.boltColor2, ultObj.color, s % 3 === 0, 1.15
                            );
                        }, s * 18);
                    }
                }

                canvasColossalSwords.push({
                    x: targetX,
                    y: -140,
                    targetY: targetY,
                    vy: 45,
                    color: ultObj.boltColor2,
                    life: 1.0
                });
                spawnLaserBeam(targetX, 0, targetX, h, ultObj.boltColor2, 42);
                spawnSpaceShatter(targetX, targetY, ultObj.boltColor2, 15);
                spawnCalligraphySeal(ultObj.sealChar || '滅', targetX, targetY - 55, ultObj.boltColor2);
                triggerCameraZoom(1.12, 550);
                triggerAnimeImpactFrame();
                canvasShockwaves.push({
                    x: targetX, y: targetY + 35,
                    r: 12, maxR: 185,
                    alpha: 1.0,
                    color: ultObj.boltColor2
                });
            }

            const wrapper = document.createElement('div');
            wrapper.className = "absolute inset-0 pointer-events-none";
            wrapper.innerHTML = `
                <div class="absolute inset-0 bg-cyan-200/15 animate-pulse"></div>
                <svg style="left:${leftPos}; transform:translateX(-50%)" class="absolute top-0 h-full w-72 drop-shadow-[0_0_40px_${ultObj.boltColor2}]" viewBox="0 0 120 320" fill="none">
                    <path d="M60 0 L42 95 L78 115 L32 215 L68 228 L55 320" stroke="${ultObj.boltColor2}" stroke-width="12" stroke-linecap="round" opacity="0.55"/>
                    <path d="M60 0 L42 95 L78 115 L32 215 L68 228 L55 320" stroke="${ultObj.boltColor1}" stroke-width="4.5" stroke-linecap="round"/>
                    <path d="M42 95 L12 160 M78 115 L108 180 M32 215 L10 275" stroke="${ultObj.boltColor3}" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="55" cy="295" r="35" fill="${ultObj.boltColor2}" opacity="0.8"/>
                </svg>
            `;
            layer.appendChild(wrapper);
            setTimeout(() => wrapper.remove(), 520);
        }

        const combatLogHistory = [];
        function addLog(html) {
            const stream = document.getElementById('combat-log-stream');
            if (!stream) return;
            combatLogHistory.unshift(html);
            if (combatLogHistory.length > 40) combatLogHistory.pop();
            stream.innerHTML = combatLogHistory.slice(0, 3).map(entry => `<div>${entry}</div>`).join('');
        }

        function switchRightSidebarTab(tabName) {
            const tabFloors = document.getElementById('sidebar-tab-floors');
            const tabManuals = document.getElementById('sidebar-tab-manuals');
            const tabBag = document.getElementById('sidebar-tab-bag');
            const btnFloors = document.getElementById('tab-btn-floors');
            const btnManuals = document.getElementById('tab-btn-manuals');
            const btnBag = document.getElementById('tab-btn-bag');

            tabFloors.classList.add('hidden');
            if (tabManuals) tabManuals.classList.add('hidden');
            tabBag.classList.add('hidden');

            const inactiveCls = "py-2 rounded-xl font-xianxia font-bold text-[11px] bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition relative";
            btnFloors.className = inactiveCls;
            if (btnManuals) btnManuals.className = inactiveCls;
            btnBag.className = inactiveCls;

            if (tabName === 'floors') {
                tabFloors.classList.remove('hidden');
                btnFloors.className = "py-2 rounded-xl font-xianxia font-bold text-[11px] bg-gradient-to-r from-amber-500/25 to-rose-500/20 text-amber-300 border border-amber-400/60 shadow transition";
            } else if (tabName === 'manuals' && tabManuals) {
                tabManuals.classList.remove('hidden');
                btnManuals.className = "py-2 rounded-xl font-xianxia font-bold text-[11px] bg-gradient-to-r from-purple-500/30 to-cyan-500/25 text-amber-200 border border-amber-400/60 shadow transition";
                renderManualsCompendium();
            } else {
                tabBag.classList.remove('hidden');
                btnBag.className = "py-2 rounded-xl font-xianxia font-bold text-[11px] bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 text-emerald-300 border border-emerald-400/60 shadow transition relative";
            }
        }

        function toggleNextRightSidebarTab() {
            const tabs = ['floors', 'manuals', 'bag'];
            const tabFloors = document.getElementById('sidebar-tab-floors');
            const tabManuals = document.getElementById('sidebar-tab-manuals');
            let currentTab = 'floors';
            if (tabFloors && tabFloors.classList.contains('hidden')) {
                currentTab = (tabManuals && !tabManuals.classList.contains('hidden')) ? 'manuals' : 'bag';
            }
            const nextIdx = (tabs.indexOf(currentTab) + 1) % tabs.length;
            switchRightSidebarTab(tabs[nextIdx]);
        }

        function showCinematicBanner(text, duration = 2200) {
            const b = document.getElementById('cinematic-banner');
            if (!b) return;
            b.textContent = text;
            b.classList.remove('hidden');
            setTimeout(() => b.classList.add('hidden'), duration);
        }

        function activateSwordDomain() {
            if (!towerState.inCombat) {
                startOrStopCombat();
            }
            if (towerState.domainActive) return;

            towerState.domainActive = true;
            towerState.domainTicksLeft = TOWER_RULES.domainTurns;
            playSound('bell');
            triggerScreenShake('ult');
            triggerCameraZoom(1.1, 600);
            triggerAnimeCutIn("TRU TIÊN TỨ KIẾM TRẬN!", "PHI TIÊN DIỆT THẦN • TỨ KIẾM TỀ TRẢM", "🩸");

            const canvas = document.getElementById('combat-canvas');
            if (canvas) {
                spawnCalligraphySeal('誅仙', canvas.width * 0.5, canvas.height * 0.42, '#38bdf8');
                spawnSpaceShatter(canvas.width * 0.5, canvas.height * 0.48, '#38bdf8', 15);
            }
            document.getElementById('arena-viewport').classList.add('domain-active-bg');
            addLog(`<span class="text-cyan-300 font-bold">🌌 [KHAI MỞ KIẾM TRẬN]</span> <strong>Tru Tiên Tứ Kiếm Trận</strong> bao phủ thiên địa! Vạn Kiếm đồng loạt xuất kích trong 5 hiệp!`);
        }

        /**
         * 11. CORE COMBAT LOOP V2 & AUTO CONTINUATION
         */
        let nextCombatTurn = null;
        let combatGeneration = 0;
        let wakeCombatSleep = null;
        let queuedTowerAction = null;
        let queuedCombatSkill = null;
        let resolvingPlayerTurn = false;
        function getCombatTurnDelay() {
            return Math.max(TOWER_RULES.minimumTurnDurationMs || 800,
                Math.round(TOWER_RULES.turnDurationMs / (towerState.combatSpeed || 1)));
        }
        const sleep = ms => new Promise(resolve => {
            wakeCombatSleep = resolve;
            towerState.combatTimer = setTimeout(() => { wakeCombatSleep = null; towerState.combatTimer = null; resolve(); }, ms);
        });
        function refreshCombatPlayer() {
            try {
                const getter = typeof window.getTowerSyncPayload === 'function'
                    ? window.getTowerSyncPayload
                    : (window.parent && window.parent !== window && typeof window.parent.getTowerSyncPayload === 'function'
                        ? window.parent.getTowerSyncPayload
                        : null);
                if (getter) {
                    const payload = getter();
                    if (payload?.hero) {
                        towerState.hero = { ...structuredClone(payload.hero), hp: payload.hero.maxHp, mp: 0, maxMp: 100 };
                        if (payload.realmName) towerState.realmName = payload.realmName;
                        if (payload.characterName) towerState.characterName = payload.characterName;
                        if (payload.linhThach !== undefined) towerState.linhThach = Number(payload.linhThach) || 0;
                        if (payload.tuVi !== undefined) towerState.tuVi = Number(payload.tuVi) || 0;
                        if (payload.highestCleared !== undefined) towerState.highestCleared = Math.max(0, Number(payload.highestCleared) || 0);
                        return true;
                    }
                }
            } catch (error) { 
                console.warn('[Tower] Không đọc được chỉ số nhân vật từ main game, dùng fallback', error); 
            }
            if (!towerState.hero || typeof towerState.hero !== 'object') {
                towerState.hero = {
                    name: 'Tiêu Dao Tử',
                    maxHp: 500,
                    hp: 500,
                    mp: 0,
                    maxMp: 100,
                    atk: 28,
                    def: 14,
                    crit: 10,
                    critDmg: 1.5,
                    eva: 5,
                    element: 'Kim',
                    swordCount: 6
                };
            } else {
                towerState.hero.maxHp = Math.max(1, Number(towerState.hero.maxHp || towerState.hero.hp) || 500);
                towerState.hero.hp = towerState.hero.maxHp;
                towerState.hero.mp = 0;
                towerState.hero.maxMp = 100;
                towerState.hero.atk = Math.max(1, Number(towerState.hero.atk) || 28);
                towerState.hero.def = Math.max(0, Number(towerState.hero.def) || 14);
                towerState.hero.crit = Math.max(0, Number(towerState.hero.crit) || 10);
                towerState.hero.critDmg = Math.max(1.5, Number(towerState.hero.critDmg) || 1.5);
                towerState.hero.eva = Math.max(0, Number(towerState.hero.eva) || 5);
                towerState.hero.element = towerState.hero.element || 'Kim';
            }
            return true;
        }
        const SKILL_SLOT_CONFIGS = [
            { slot: 0, name: 'Tiểu Thần Thông', key: 'Q', mp: 0, cd: 0, gainMp: 25, mult: 1.0, toughnessBreak: 25, isUlt: false },
            { slot: 1, name: 'Đại Thần Thông', key: 'W', mp: 35, cd: 2, gainMp: 0, mult: 1.75, toughnessBreak: 55, isUlt: false },
            { slot: 2, name: 'Tuyệt Thế Cấm Thuật', key: 'E', mp: 80, cd: 4, gainMp: 0, mult: 2.85, toughnessBreak: 90, isUlt: true }
        ];

        let manualTurnResolver = null;
        function waitForPlayerManualAction() {
            return new Promise(resolve => {
                manualTurnResolver = resolve;
            });
        }

        function triggerHitStop(durationMs = 135) {
            const arena = document.getElementById('arena-viewport');
            if (arena) arena.classList.add('hit-stop-freeze');
            return new Promise(resolve => {
                setTimeout(() => {
                    if (arena) arena.classList.remove('hit-stop-freeze');
                    resolve();
                }, durationMs);
            });
        }

        function toggleAutoManualCombat() {
            towerState.autoCombat = !towerState.autoCombat;
            updateCombatModeUI();
            const modeName = towerState.autoCombat ? 'TỰ ĐỘNG' : 'THỦ CÔNG';
            addLog(`🕹️ <span class="text-amber-300 font-bold">[Chế Độ Chiến Đấu]</span> Đã chuyển sang chế độ <strong>${modeName}</strong>!`);
            if (towerState.autoCombat && manualTurnResolver) {
                const resolve = manualTurnResolver;
                manualTurnResolver = null;
                resolve({ type: 'auto' });
            }
        }

        function updateCombatModeUI() {
            const btn = document.getElementById('btn-combat-mode');
            const icon = document.getElementById('combat-mode-icon');
            const text = document.getElementById('combat-mode-text');
            if (!btn) return;
            if (towerState.autoCombat) {
                if (icon) icon.textContent = '🤖';
                if (text) text.textContent = 'Tự Động';
                btn.className = 'px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-xianxia font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm';
                btn.title = 'Chế độ TỰ ĐỘNG: AI tự xoay tua chiêu thức và tự kích hoạt khiên phản đòn (Phím M)';
            } else {
                if (icon) icon.textContent = '🕹️';
                if (text) text.textContent = 'Thủ Công';
                btn.className = 'px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-xs font-xianxia font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm';
                btn.title = 'Chế độ THỦ CÔNG: Mỗi hiệp dừng chờ đạo hữu bấm [Q/W/E] hoặc [1/2/3] (Phím M)';
            }
        }

        function castActiveSkillSlot(slotIdx) {
            const cfg = SKILL_SLOT_CONFIGS[slotIdx];
            if (!cfg) return;
            const cd = towerState.skillCooldowns ? (towerState.skillCooldowns[slotIdx] || 0) : 0;
            if (cd > 0) {
                addLog(`⏳ <span class="text-amber-300 font-bold">[${cfg.name}]</span> đang hồi chiêu (còn ${cd} hiệp)!`);
                spawnFloatingText('hero-stage-anchor', `HỒI CHIÊU (${cd}H)`, 'dodge');
                return;
            }
            if (towerState.hero && towerState.hero.mp < cfg.mp) {
                addLog(`⚠️ <span class="text-rose-400 font-bold">[Linh Lực Không Đủ]</span> ${cfg.name} cần ${cfg.mp} Kiếm Nguyên (Hiện có: ${Math.floor(towerState.hero.mp)})!`);
                spawnFloatingText('hero-stage-anchor', `THIẾU MP (${cfg.mp})`, 'dodge');
                return;
            }

            if (manualTurnResolver) {
                const resolve = manualTurnResolver;
                manualTurnResolver = null;
                resolve({ type: 'skill', slot: slotIdx });
            } else if (!towerState.inCombat) {
                const manual = CULTIVATION_MANUALS.find(m => m.id === towerState.activeManualId) || CULTIVATION_MANUALS[0];
                const skill = manual.skills[slotIdx];
                if (skill) selectUltimateSkill(skill.id, true);
            }
        }

        function towerDamage(attacker, defender, multiplier = 1, defFactor = 1, isCrit = false, critDamage = 1.5) {
            if (!attacker || !defender) return 100;

            const atkVal = Number(attacker.atk || 1000);
            const defVal = Number((defender.def || 500) * defFactor);
            const defMaxHp = Number(defender.maxHp || defender.hp || 100000);

            const atkCp = Number(attacker.cp || (attacker.atk * 3 + (attacker.maxHp || attacker.hp || 10000) * 0.1)) || 10000;
            const defCp = Number(defender.cp || (defender.atk * 3 + defMaxHp * 0.1)) || 10000;
            const cpRatio = atkCp / Math.max(1, defCp);

            // Chênh lệch lực chiến áp đảo (> 5 lần) hoặc quá yếu (< 0.2 lần) hay cân bằng
            let totalDmg = 100;
            if (cpRatio >= 5.0) {
                const rawOverkill = Math.max(atkVal * 2.2, defMaxHp * 0.65) * multiplier;
                totalDmg = Math.max(1, Math.round(isCrit ? rawOverkill * critDamage : rawOverkill));
            } else if (cpRatio <= 0.2) {
                const chip = Math.max(10, Math.round(defMaxHp * 0.015 * multiplier));
                totalDmg = Math.max(1, Math.round(isCrit ? chip * critDamage : chip));
            } else {
                const basePacingFraction = 0.046; // Cân bằng nhịp độ giao tranh kịch tính 8-15 hiệp
                const cpPacingFactor = Math.pow(Math.max(0.3, Math.min(3.0, cpRatio)), 0.45);
                const statFactor = Math.max(0.4, Math.min(2.5, (atkVal + 100) / Math.max(100, defVal + 100)));

                let baseDmg = defMaxHp * basePacingFraction * cpPacingFactor * Math.sqrt(statFactor) * multiplier;
                baseDmg *= (0.93 + Math.random() * 0.14);

                if (isCrit) {
                    baseDmg *= (critDamage || 1.5);
                }
                totalDmg = Math.max(1, Math.round(baseDmg));
            }

            const lsRate = Number(attacker === towerState.hero ? (towerState.hero.lifesteal || 0) : 0);
            if (lsRate > 0 && towerState.inCombat && towerState.hero.hp > 0) {
                const healHp = Math.max(1, Math.round(totalDmg * lsRate));
                towerState.hero.hp = Math.min(towerState.hero.maxHp, towerState.hero.hp + healHp);
                if (typeof spawnFloatingText === 'function') {
                    spawnFloatingText('hero-stage-anchor', `+${fmt(healHp)} 🩸`, 'heal');
                }
            }
            return totalDmg;
        }
        let combatTurnBusy = false;
        function playCombatTurn() {
            if (combatTurnBusy || !towerState.inCombat || !nextCombatTurn) return;
            nextCombatTurn();
        }

        function pickAutoCombatSkill(useUltimate) {
            const manual = CULTIVATION_MANUALS[Math.floor(Math.random() * CULTIVATION_MANUALS.length)];
            const lastSkillIndex = manual.skills.length - 1;
            const skillIndex = useUltimate ? lastSkillIndex : Math.floor(Math.random() * lastSkillIndex);
            return ULTIMATE_SKILLS.find(skill => skill.id === manual.skills[skillIndex].id);
        }

        function updateCombatSkillUI(skill = null) {
            const bar = document.getElementById('active-manual-skills-bar');
            const skillId = skill ? String(skill.id) : '';
            if (bar) {
                bar.dataset.castingSkillId = skillId;
                bar.querySelectorAll('button[data-skill-id]').forEach(button => {
                    button.classList.toggle('is-casting', button.dataset.skillId === skillId);
                });
            }
            const nameEl = document.getElementById('combat-skill-name');
            if (nameEl) {
                nameEl.textContent = skill
                    ? `${skill.icon || '⚡'} ${skill.name}`
                    : `Ngẫu nhiên ${typeof ULTIMATE_SKILLS !== 'undefined' ? ULTIMATE_SKILLS.length : 15} thần thông`;
            }
            const metaEl = document.getElementById('combat-skill-meta');
            if (metaEl) {
                const manual = (typeof CULTIVATION_MANUALS !== 'undefined')
                    ? (CULTIVATION_MANUALS.find(m => m.id === towerState.activeManualId) || CULTIVATION_MANUALS[0])
                    : null;
                const mName = (skill?.manualName || manual?.name || 'Công Pháp').replace(/[《》]/g, '');
                const stanceStr = skill?.stance || 'Liên Chiêu';
                metaEl.textContent = skill
                    ? `${mName} · ${stanceStr}`
                    : `${typeof CULTIVATION_MANUALS !== 'undefined' ? CULTIVATION_MANUALS.length : 5} công pháp · [Q/W/E] Xuất Chiêu`;
            }
            const turnEl = document.getElementById('combat-turn-label');
            if (turnEl) {
                turnEl.textContent = towerState.inCombat
                    ? `Hiệp ${towerState.battleTurns}`
                    : 'Sẵn sàng';
            }
        }

        async function startOrStopCombat() {
            if (towerState.inCombat) {
                stopCombat("Đạo hữu chủ động thu kiếm lùi bước.");
                return;
            }

            refreshCombatPlayer();
            let fObj;
            if (towerState.customBattle) {
                const cb = towerState.customBattle;
                const heroHp = Number(towerState.hero?.maxHp || towerState.hero?.hp || 850000);
                const heroAtk = Number(towerState.hero?.atk || 148000);
                const heroDef = Number(towerState.hero?.def || 42000);

                fObj = {
                    floor: cb.floor || 1,
                    name: cb.name || 'Đối Thủ',
                    title: cb.titleBadge || cb.name,
                    realmUnlock: cb.realm || 'Trúc Cơ',
                    element: cb.element || 'Hỏa',
                    hp: Number(cb.hp || cb.maxHp || Math.round(heroHp * 1.05)),
                    maxHp: Number(cb.hp || cb.maxHp || Math.round(heroHp * 1.05)),
                    atk: Number(cb.atk || Math.round(heroAtk * 0.95)),
                    def: Number(cb.def || Math.round(heroDef * 0.95)),
                    crit: Number(cb.crit || 15),
                    eva: Number(cb.eva || 10),
                    cp: Number(cb.cp || (cb.atk ? (cb.atk * 3 + (cb.hp || 100000) * 0.1) : (heroAtk * 3 + heroHp * 0.1))),
                    icon: cb.icon || '👹',
                    drops: Array.isArray(cb.drops) ? cb.drops : [
                        { id: 'custom_reward', name: cb.rewards?.title || cb.rewards || 'Chiến Lợi Phẩm', rarity: 'rare', icon: cb.icon || '🎁', desc: cb.rewards?.badge || 'Phần thưởng chiến thắng' }
                    ]
                };
            } else {
                towerState.selectedFloor = Math.max(1, Number(towerState.selectedFloor) || 1);
                if (typeof TOWER_50_FLOORS !== 'undefined' && Array.isArray(TOWER_50_FLOORS) && TOWER_50_FLOORS.length > 0) {
                    const found = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor) || TOWER_50_FLOORS[0];
                    if (found) fObj = structuredClone(found);
                }
            }
            if (!fObj) {
                fObj = {
                    floor: towerState.selectedFloor || 1,
                    name: 'Hắc Phong Lang',
                    title: 'Tầng 1 - Hắc Phong Lang',
                    realmUnlock: 'Luyện Khí',
                    element: 'Mộc',
                    hp: 80000,
                    maxHp: 80000,
                    atk: 12000,
                    def: 3500,
                    crit: 10,
                    eva: 8,
                    cp: 40000,
                    drops: []
                };
            }
            towerState.currentEnemy = fObj;

            combatGeneration++;
            towerState.inCombat = true;
            combatTurnBusy = false;
            if (typeof manualTurnResolver === 'function') {
                manualTurnResolver({ type: 'auto' });
                manualTurnResolver = null;
            }
            lastHeroHp = null;
            lastBossHp = null;

            towerState.battleTurns = 0;
            towerState.maxDamageDealt = 0;
            towerState.maxCombo = 0;
            towerState.hero.hp = towerState.hero.maxHp;
            towerState.bossEnragedVisual = false;
            towerState.bossBrokenVisual = false;
            towerState.comboCount = 0;

            towerState.liveBossHp = fObj.hp;
            towerState.liveBossMaxHp = fObj.hp;
            const sfLevel = Number(towerState.hero?.swordFormationLevel ?? window.getSwordFormationBonus?.()?.level ?? 0) || 0;
            const sfOpenPct = Number(towerState.hero?.swordFormationOpeningPct ?? window.getSwordFormationBonus?.()?.towerOpeningDmgPercent ?? 0) || 0;
            let sfOpenDmg = 0;
            if (sfLevel > 0 && sfOpenPct > 0 && towerState.liveBossHp > 1) {
                sfOpenDmg = Math.max(1, Math.round((Number(towerState.hero?.atk) || 28) * (sfOpenPct / 100)));
                towerState.liveBossHp = Math.max(1, towerState.liveBossHp - sfOpenDmg);
            }
            towerState.liveBossMp = 0;
            towerState.liveBossToughness = 100;
            towerState.liveBossBrokenTurns = 0;
            towerState.bossChargingUlt = false;
            towerState.skillCooldowns = { 0: 0, 1: 0, 2: 0 };
            artifactCooldowns[1] = 0;
            artifactCooldowns[2] = 0;
            artifactCooldowns[3] = 0;
            let bossEnraged = false;

            updateArenaHUD(fObj);
            updateFightButtonUI(true);
            updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp, towerState.liveBossHp, towerState.liveBossMaxHp, 0, 100, false);
            updateArtifactButtonsUI();
            updateActiveSkillsUI();
            updateCombatModeUI();

            const heroElem = ELEMENTS[towerState.hero.element] || ELEMENTS.Kim;
            const isElementAdvantage = heroElem.counters === fObj.element;

            const battleTitle = towerState.customBattle ? (towerState.customBattle.titleBadge || towerState.customBattle.name) : `Tầng ${fObj.floor}`;
            addLog(`<span class="text-amber-300 font-bold">🗡️ [Khai Chiến: ${battleTitle}]</span> Tiêu Dao Tử vận chuyển <strong>${heroElem.name}</strong> đối quyết <strong>${fObj.name}</strong>! ${isElementAdvantage ? '<span class="text-emerald-400 font-bold">(Khắc Hệ +35% Sát Thương!)</span>' : ''}`);
            if (sfOpenDmg > 0) {
                addLog(`<span class="text-cyan-300 font-bold">⚔️ [Bản Mệnh Kiếm Trận Lv.${sfLevel}]</span> Vạn kiếm quy tông khai chiến, phủ đầu trảm gây <strong>-${fmt(sfOpenDmg)}</strong> sát thương!`, 'text-cyan-300');
            }

            const runTick = async () => {
                if (combatTurnBusy || !towerState.inCombat || nextCombatTurn !== runTick) return;
                combatTurnBusy = true;
                try {
                while (towerState.inCombat && nextCombatTurn === runTick) {
                towerState.battleTurns++;

                // 1. Giảm hồi chiêu đầu hiệp
                for (let sKey in artifactCooldowns) {
                    if (artifactCooldowns[sKey] > 0) artifactCooldowns[sKey]--;
                }
                for (let sIdx in towerState.skillCooldowns) {
                    if (towerState.skillCooldowns[sIdx] > 0) towerState.skillCooldowns[sIdx]--;
                }
                updateArtifactButtonsUI();
                updateActiveSkillsUI();

                const h = towerState.hero;
                const isMilestoneBoss = Boolean(fObj.isMilestone || (fObj.floor % 10 === 0));
                const isCountering = (ELEMENTS[h.element]?.counters === fObj.element);
                const hasForgedArtifact = Boolean(h.hasForgedArtifact);

                let milestonePenalty = 1.0;
                if (isMilestoneBoss) {
                    if (!isCountering || !hasForgedArtifact) {
                        milestonePenalty = 0.60;
                        if (towerState.battleTurns === 1) {
                            addLog(`<span class="text-rose-400 font-bold">⚠️ [ÁP CHẾ CỘT MỐC]</span> Chưa trang bị Pháp Bảo hoặc sai Hệ Ngũ Hành khắc chế Boss (${fObj.element})! Sát thương bị giảm 40%!`);
                        }
                    }
                }
                const elemMult = ((isCountering ? 1.35 : 1.0) * milestonePenalty);
                const comboBonusMult = 1 + Math.min(1.5, towerState.comboCount * 0.02);

                const isBossBroken = towerState.liveBossBrokenTurns > 0;
                if (isBossBroken) {
                    towerState.liveBossBrokenTurns--;
                    if (towerState.liveBossBrokenTurns === 0) {
                        towerState.liveBossToughness = 100;
                        towerState.bossBrokenVisual = false;
                        addLog(`🛡️ ${fObj.name} ngưng tụ lại Hộ Thể Yêu Cang!`);
                    }
                }

                // Tru Tiên Kiếm Trận & Hộ Pháp
                if (towerState.domainActive && towerState.domainTicksLeft > 0) {
                    towerState.domainTicksLeft--;
                    fireCanvasSwordQi(true, '#22d3ee', 6, false);
                    playSound('sword');
                    const domainDmg = towerDamage(h, fObj, 0.68 * elemMult);
                    towerState.liveBossHp = Math.max(0, towerState.liveBossHp - domainDmg);
                    if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - 30);
                    incrementCombo();
                    towerState.maxDamageDealt = Math.max(towerState.maxDamageDealt || 0, domainDmg);
                    towerState.maxCombo = Math.max(towerState.maxCombo || 0, towerState.comboCount || 0);
                    spawnFloatingText('boss-stage-anchor', `🗡️ KIẾM TRẬN -${fmt(domainDmg)}`, 'dodge');

                    if (towerState.domainTicksLeft <= 0) {
                        towerState.domainActive = false;
                        document.getElementById('arena-viewport').classList.remove('domain-active-bg');
                    }
                }

                if (towerState.activeGuardian) {
                    const petDmg = towerDamage(h, fObj, towerState.activeGuardian.bonusAtkRatio);
                    towerState.liveBossHp = Math.max(0, towerState.liveBossHp - petDmg);
                    if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - 10);
                }

                // 2. LỰA CHỌN HÀNH ĐỘNG (THỦ CÔNG vs TỰ ĐỘNG)
                let chosenAction = null;
                const manual = CULTIVATION_MANUALS.find(m => m.id === towerState.activeManualId) || CULTIVATION_MANUALS[0];

                if (!towerState.autoCombat) {
                    document.getElementById('combat-turn-label').textContent = `Hiệp ${towerState.battleTurns} (Chờ lệnh [Q/W/E/1/2/3])`;
                    chosenAction = await waitForPlayerManualAction();
                    if (!towerState.inCombat || nextCombatTurn !== runTick) return;
                    if (chosenAction && chosenAction.type === 'auto') {
                        chosenAction = null;
                    }
                }

                if (!chosenAction) {
                    // TỰ ĐỘNG XOAY TUA CHIÊU THỨC THÔNG MINH
                    if (towerState.bossChargingUlt && artifactCooldowns[1] === 0 && h.mp >= ARTIFACT_CONFIGS[1].mp) {
                        chosenAction = { type: 'artifact', slot: 1 };
                    } else if (towerState.bossChargingUlt && towerState.skillCooldowns[1] === 0 && h.mp >= 35) {
                        chosenAction = { type: 'skill', slot: 1 };
                    } else if (h.mp >= 80 && towerState.skillCooldowns[2] === 0) {
                        chosenAction = { type: 'skill', slot: 2 };
                    } else if (h.mp >= 35 && towerState.skillCooldowns[1] === 0) {
                        chosenAction = { type: 'skill', slot: 1 };
                    } else {
                        chosenAction = { type: 'skill', slot: 0 };
                    }
                }

                document.getElementById('combat-turn-label').textContent = `Hiệp ${towerState.battleTurns}`;

                // 3. THI TRIỂN HÀNH ĐỘNG CỦA NGƯỜI CHƠI
                let playerUsedShield = false;
                let playerPoiseBreak = 0;

                if (chosenAction.type === 'artifact') {
                    const slot = chosenAction.slot;
                    const cfg = ARTIFACT_CONFIGS[slot];
                    h.mp = Math.max(0, h.mp - cfg.mp);
                    artifactCooldowns[slot] = cfg.cd;
                    updateArtifactButtonsUI();
                    if (slot === 1) {
                        playerUsedShield = true;
                        towerState.shieldBellTurns = TOWER_RULES.bellShieldTurns || 4;
                        document.getElementById('hero-shield-badge').classList.remove('hidden');
                        const heal = Math.round(h.maxHp * 0.25);
                        h.hp = Math.min(h.maxHp, h.hp + heal);
                        playSound('bell');
                        const canvas = document.getElementById('combat-canvas');
                        if (canvas) {
                            spawnCalligraphySeal('東皇鐘', canvas.width * 0.23, canvas.height * 0.42, '#fbbf24');
                            canvasShockwaves.push({ x: canvas.width * 0.23, y: canvas.height * 0.56, r: 10, maxR: 150, alpha: 1.0, color: '#fbbf24' });
                        }
                        spawnFloatingText('hero-stage-anchor', `🔔 ĐÔNG HOÀNG CHUNG +${fmtShort(heal)} HP!`, 'heal');
                        addLog(`<span class="text-amber-300 font-bold">🔔 [Đông Hoàng Chung]</span> Vận chuyển Kim Chung Tráo giảm 55% sát thương và sẵn sàng Phản Chấn sát chiêu! (Hồi ${fmtShort(heal)} HP)`);
                    } else if (slot === 2) {
                        activateSwordDomain();
                        addLog(`<span class="text-rose-400 font-bold">🩸 [Tru Tiên Kiếm Trận]</span> Khởi động Tru Tiên Kiếm Trận oanh tạc liên tục!`);
                    } else if (slot === 3) {
                        playSound('thunder');
                        triggerScreenShake('ult');
                        triggerCameraZoom(1.1, 600);
                        triggerAnimeCutIn("HỖN ĐỘN THÁI CỰC LUÂN!", "ÂM DƯƠNG NGHỊCH CHUYỂN • VẠN PHÁP QUY HƯ", "☯️");
                        playerPoiseBreak = 60;
                        const wheelDmg = towerDamage(h, fObj, 2.2 * elemMult);
                        towerState.liveBossHp = Math.max(0, towerState.liveBossHp - wheelDmg);
                        if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - playerPoiseBreak);
                        spawnFloatingText('boss-stage-anchor', `☯️ THÁI CỰC LUÂN -${fmt(wheelDmg)}!`, 'ult');
                        addLog(`<span class="text-cyan-300 font-bold">☯️ [Hỗn Độn Thái Cực Luân]</span> Đại phá Yêu Cang và giáng đòn hủy diệt <strong class="text-cyan-200">${fmt(wheelDmg)}</strong>!`);
                    }
                } else {
                    const slotIdx = chosenAction.slot;
                    const skill = manual.skills[slotIdx] || manual.skills[0];
                    updateCombatSkillUI(skill);

                    if (slotIdx === 0) {
                        // Thức 1: 0 MP, 0 CD, hồi +25 MP
                        h.mp = Math.min(100, h.mp + 25);
                        playerPoiseBreak = skill.toughnessBreak || 25;
                        incrementCombo();
                        if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - playerPoiseBreak);
                        const isCrit = isBossBroken || (Math.random() * 100 < h.crit);
                        const finalDmg = towerDamage(h, fObj, (skill.mult * 0.85) * elemMult, isBossBroken ? 0.3 : 0.9, isCrit, h.critDmg * comboBonusMult);
                        towerState.liveBossHp = Math.max(0, towerState.liveBossHp - finalDmg);
                        towerState.maxDamageDealt = Math.max(towerState.maxDamageDealt || 0, finalDmg);
                        towerState.maxCombo = Math.max(towerState.maxCombo || 0, towerState.comboCount || 0);
                        bossAnim.hitFlash = 4;
                        playHeavenlyLightningVFX(skill, 'boss');
                        fireCanvasSwordQi(true, skill.color, 4, isCrit);
                        playSound(isCrit ? 'crit' : 'sword');
                        spawnFloatingText('boss-stage-anchor', `${skill.icon} ${skill.name} -${fmt(finalDmg)}`, isCrit ? 'crit' : 'hit');
                        spawnFloatingText('hero-stage-anchor', '+25 MP', 'heal');
                        addLog(`${skill.icon} <span class="text-amber-200 font-bold">[Thức 1 • ${skill.name}]</span> Xuất kiếm trúng đích gây <strong class="text-amber-300">${fmt(finalDmg)}</strong> ST! Hồi +25 Kiếm Nguyên.`);
                    } else if (slotIdx === 1) {
                        // Thức 2: 35 MP, 2 CD, phá Yêu Cang mạnh
                        h.mp = Math.max(0, h.mp - 35);
                        towerState.skillCooldowns[1] = 2;
                        playerPoiseBreak = skill.toughnessBreak || 55;
                        incrementCombo();
                        if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - playerPoiseBreak);
                        const isCrit = isBossBroken || (Math.random() * 100 < (h.crit + 15));
                        const finalDmg = towerDamage(h, fObj, (skill.mult * 1.1) * elemMult, isBossBroken ? 0.2 : 0.8, isCrit, h.critDmg * comboBonusMult);
                        towerState.liveBossHp = Math.max(0, towerState.liveBossHp - finalDmg);
                        towerState.maxDamageDealt = Math.max(towerState.maxDamageDealt || 0, finalDmg);
                        towerState.maxCombo = Math.max(towerState.maxCombo || 0, towerState.comboCount || 0);
                        bossAnim.hitFlash = 6;
                        playHeavenlyLightningVFX(skill, 'boss');
                        fireCanvasSwordQi(true, skill.color, 7, isCrit);
                        playSound('crit');
                        triggerScreenShake('crit');
                        spawnFloatingText('boss-stage-anchor', `${skill.icon} ${skill.name} -${fmt(finalDmg)}!`, 'crit');
                        addLog(`${skill.icon} <span class="text-amber-300 font-bold">[Thức 2 • ${skill.name}]</span> Phá giáp xuất kích gây <strong class="text-amber-300">${fmt(finalDmg)}</strong> ST và phá vỡ ${playerPoiseBreak} Điểm Yêu Cang!`);
                    } else if (slotIdx === 2) {
                        // Thức 3: 80 MP, 4 CD, Tuyệt Thế Cấm Thuật
                        h.mp = Math.max(0, h.mp - 80);
                        towerState.skillCooldowns[2] = 4;
                        playerPoiseBreak = skill.toughnessBreak || 90;
                        incrementCombo();
                        if (!isBossBroken) towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - playerPoiseBreak);
                        const isCrit = isBossBroken || (Math.random() * 100 < (h.crit + 25));
                        const finalDmg = towerDamage(h, fObj, (skill.mult * 1.55) * elemMult, isBossBroken ? 0 : 0.6, isCrit, h.critDmg * comboBonusMult);
                        towerState.liveBossHp = Math.max(0, towerState.liveBossHp - finalDmg);
                        towerState.maxDamageDealt = Math.max(towerState.maxDamageDealt || 0, finalDmg);
                        towerState.maxCombo = Math.max(towerState.maxCombo || 0, towerState.comboCount || 0);
                        bossAnim.hitFlash = 8;
                        playHeavenlyLightningVFX(skill, 'boss');
                        fireCanvasSwordQi(true, skill.color, 12, true);
                        playSound('thunder');
                        triggerScreenShake('ult');
                        await triggerHitStop(140);
                        spawnFloatingText('boss-stage-anchor', `💥 ${skill.name.toUpperCase()} -${fmt(finalDmg)}!`, 'ult');
                        addLog(`💥 <span class="text-cyan-300 font-bold">[Cấm Thuật • ${skill.name}]</span> Trảm xuất cấm thuật diệt thế gây <strong class="text-amber-300">${fmt(finalDmg)}</strong> ST!`);
                        if (skill.healRatio) {
                            const heal = Math.round(h.maxHp * skill.healRatio);
                            h.hp = Math.min(h.maxHp, h.hp + heal);
                            spawnFloatingText('hero-stage-anchor', `+${fmt(heal)} HP`, 'heal');
                        }
                    }
                }

                // Kiểm tra vỡ Yêu Cang
                if (!isBossBroken && towerState.liveBossToughness <= 0 && towerState.liveBossHp > 0) {
                    towerState.liveBossBrokenTurns = 3;
                    towerState.bossBrokenVisual = true;
                    playSound('bell');
                    triggerScreenShake('ult');
                    triggerCameraZoom(1.1, 450);
                    const canvas = document.getElementById('combat-canvas');
                    if (canvas) {
                        spawnCalligraphySeal('破', canvas.width * 0.77, canvas.height * 0.45, '#fde047');
                    }
                    showCinematicBanner('💥 HỘ THỂ YÊU CANG VỠ VỤN! 100% BẠO KÍCH & CHOÁNG TRONG 3 HIỆP! 💥', 2200);
                    addLog(`<span class="text-amber-300 font-bold">🔔 [PHÁ YÊU CANG]</span> Yêu Cang của ${fObj.name} đã vỡ nát! Mọi đòn kiếm tiếp theo <strong>100% BẠO KÍCH</strong>!`);
                }

                if (!bossEnraged && towerState.liveBossHp > 0 && (towerState.liveBossHp / towerState.liveBossMaxHp) <= TOWER_RULES.enrageHpRatio) {
                    bossEnraged = true;
                    towerState.bossEnragedVisual = true;
                    playSound('thunder');
                    triggerScreenShake('ult');
                    showCinematicBanner(`🩸 ${fObj.name.toUpperCase()} HUYẾT TẾ MA ĐAN • CUỒNG BẠO! 🩸`, 2400);
                    addLog(`<span class="text-rose-400 font-bold">🩸 [HUYẾT TẾ CUỒNG BẠO]</span> ${fObj.name} mở rộng Huyết Dực, triệu hồi Cửu U Ma Thần Pháp Tướng!`);
                }

                updateBarsUI(
                    h.hp, h.maxHp, h.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
                updateActiveSkillsUI();

                await sleep(getCombatTurnDelay());
                if (!towerState.inCombat || nextCombatTurn !== runTick) return;
                if (towerState.liveBossHp <= 0) {
                    triggerFatalFinisher(fObj, () => handleVictory(fObj));
                    return;
                }

                // 4. LƯỢT PHẢN CÔNG CỦA BOSS (BOSS ACTION & PARRY / ULT RESOLUTION)
                if (towerState.bossChargingUlt) {
                    // Boss đang gồng sát chiêu từ hiệp trước!
                    const parried = (playerUsedShield || towerState.shieldBellTurns > 0 || towerState.liveBossBrokenTurns > 0 || towerState.liveBossToughness <= 0);

                    if (parried) {
                        // === PHẢN CHẤN / PHÁ CHIÊU HOÀN HẢO ===
                        towerState.bossChargingUlt = false;
                        towerState.liveBossMp = 0;
                        towerState.liveBossBrokenTurns = Math.max(towerState.liveBossBrokenTurns, 2);
                        towerState.bossBrokenVisual = true;

                        const reflectDmg = Math.round(towerState.liveBossMaxHp * 0.20);
                        towerState.liveBossHp = Math.max(0, towerState.liveBossHp - reflectDmg);

                        playSound('bell');
                        triggerScreenShake('ult');
                        await triggerHitStop(150);

                        const canvas = document.getElementById('combat-canvas');
                        if (canvas) {
                            spawnCalligraphySeal('反震', canvas.width * 0.77, canvas.height * 0.45, '#38bdf8');
                            spawnSpaceShatter(canvas.width * 0.77, canvas.height * 0.45, '#38bdf8', 16);
                        }
                        spawnFloatingText('boss-stage-anchor', `💥 PHẢN CHẤN HOÀN HẢO -${fmt(reflectDmg)}!`, 'crit');
                        addLog(`⚡ <span class="text-cyan-300 font-bold">[PHẢN CHẤN HOÀN HẢO]</span> Đạo hữu hóa giải sát chiêu diệt thế! Phản chấn gây <span class="text-amber-300 font-bold">${fmt(reflectDmg)}</span> sát thương và làm ${fObj.name} CHOÁNG 2 HIỆP!`);
                    } else {
                        // === BOSS GIẢI PHÓNG TUYỆT KỸ HỦY DIỆT ===
                        towerState.bossChargingUlt = false;
                        towerState.liveBossMp = 0;

                        const heroDodged = (Math.random() * 100) < h.eva;
                        if (heroDodged) {
                            heroAnim.dodgeOffset = -45;
                            spawnFloatingText('hero-stage-anchor', '✨ NÉ TRÁNH TUYỆT KỸ!', 'dodge');
                            addLog(`✨ <span class="text-cyan-300 font-bold">[Ngự Phong Thần Pháp]</span> Đạo hữu xuất quỷ nhập thần né tránh toàn bộ Tuyệt Kỹ Hủy Diệt của ${fObj.name}!`);
                        } else {
                            const ultDmg = Math.round(h.maxHp * (0.45 + Math.random() * 0.15));
                            h.hp = Math.max(0, h.hp - ultDmg);
                            heroAnim.hitFlash = 8;
                            playSound('thunder');
                            triggerScreenShake('ult');
                            await triggerHitStop(140);
                            playHeavenlyLightningVFX({ color: '#f43f5e' }, 'hero');
                            spawnFloatingText('hero-stage-anchor', `💀 DIỆT THẾ -${fmt(ultDmg)}!`, 'boss-hit');
                            addLog(`💀 <span class="text-rose-500 font-bold">[TUYỆT KỸ HỦY DIỆT]</span> ${fObj.name} giáng đòn hủy diệt trời đất, đoạt đi <span class="text-rose-300 font-bold">${fmt(ultDmg)}</span> Khí Huyết!`);
                        }
                    }
                } else {
                    // Lượt đánh bình thường của Boss
                    const isStunned = towerState.liveBossBrokenTurns > 0 && (Math.random() < 0.70);
                    if (isStunned) {
                        spawnFloatingText('boss-stage-anchor', '💫 CHOÁNG VÁNG!', 'dodge');
                        addLog(`<span class="text-amber-300 font-bold">💫 [CHOÁNG VÁNG]</span> ${fObj.name} chịu nội thương do vỡ Cang, lảo đảo không thể xuất chiêu!`);
                    } else {
                        const heroDodged = (Math.random() * 100) < h.eva;
                        if (heroDodged) {
                            heroAnim.dodgeOffset = -45;
                            spawnFloatingText('hero-stage-anchor', '✨ NGỰ PHONG NÉ!', 'dodge');
                            addLog(`<span class="text-cyan-300">✨ [Ngự Phong Thân Pháp]</span> Đạo hữu đạp phi kiếm lướt nhẹ, <strong>NÉ TRÁNH</strong> đòn của ${fObj.name}!`);
                        } else {
                            const isBossCrit = (Math.random() * 100) < fObj.crit;
                            let bossDmg = towerDamage(fObj, h, (bossEnraged ? 1.35 : 1) * (.9 + Math.random() * .2), .9, isBossCrit, 1.65);
                            if (isMilestoneBoss && (!isCountering || !hasForgedArtifact)) {
                                bossDmg = Math.round(bossDmg * 1.45);
                            }

                            if (towerState.shieldBellTurns > 0) {
                                towerState.shieldBellTurns--;
                                bossDmg = Math.round(bossDmg * 0.45);
                                const reflectDmg = towerDamage(h, fObj, .35);
                                towerState.liveBossHp = Math.max(0, towerState.liveBossHp - reflectDmg);
                                spawnFloatingText('boss-stage-anchor', `🔔 PHẢN CHẤN -${fmt(reflectDmg)}`, 'crit');
                                if (towerState.shieldBellTurns <= 0) {
                                    document.getElementById('hero-shield-badge').classList.add('hidden');
                                }
                            }

                            h.hp = Math.max(0, h.hp - bossDmg);
                            heroAnim.hitFlash = 4;
                            spawnFloatingText('hero-stage-anchor', `-${fmt(bossDmg)}`, 'boss-hit');
                            addLog(`<span class="text-rose-300">${fObj.name} đánh trả gây <strong class="text-rose-400">${fmt(bossDmg)}</strong> sát thương. Khí Huyết còn ${fmt(h.hp)} / ${fmt(h.maxHp)}.</span>`);
                        }

                        // Tích lũy Nộ Khí cho Boss (+20 MP mỗi lượt bình thường)
                        towerState.liveBossMp = Math.min(100, towerState.liveBossMp + 20);

                        // Kiểm tra đạt ngưỡng gồng đại chiêu (>= 80% MP)
                        if (towerState.liveBossMp >= 80 && towerState.liveBossHp > 0) {
                            towerState.bossChargingUlt = true;
                            playSound('thunder');
                            triggerScreenShake('crit');
                            addLog(`⚠️ <span class="text-rose-400 font-bold">[CẢNH BÁO SÁT CHIÊU]</span> ${fObj.name} đang tụ lực hủy diệt! (Dùng [1] Đông Hoàng Chung hoặc chiêu Phá Cang để ngắt!)`);
                        }
                    }
                }

                updateBarsUI(
                    h.hp, h.maxHp, h.mp,
                    towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                    towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                );
                updateActiveSkillsUI();

                await sleep(getCombatTurnDelay());
                if (!towerState.inCombat || nextCombatTurn !== runTick) return;
                if (towerState.liveBossHp <= 0) {
                    triggerFatalFinisher(fObj, () => handleVictory(fObj));
                    return;
                }
                if (h.hp <= 0) {
                    handleDefeat(fObj);
                    return;
                }

                }
                } catch (error) { if (nextCombatTurn === runTick) stopCombat("Trận đấu tạm dừng do lỗi xử lý."); console.error(error); }
            };

            nextCombatTurn = runTick;
            await runTick();
        }

        function stopCombat(reason) {
            combatGeneration++;
            nextCombatTurn = null;
            queuedTowerAction = queuedCombatSkill = null;
            if (manualTurnResolver) {
                const resolve = manualTurnResolver;
                manualTurnResolver = null;
                resolve(null);
            }
            if (wakeCombatSleep) { const resolve = wakeCombatSleep; wakeCombatSleep = null; resolve(); }
            clearTimeout(towerState.combatTimer);
            towerState.combatTimer = null;
            combatTurnBusy = false;
            cancelTowerEffects();
            towerState.inCombat = false;
            towerState.domainActive = false;
            towerState.bossEnragedVisual = false;
            towerState.bossBrokenVisual = false;
            towerState.bossChargingUlt = false;
            const ultWarn = document.getElementById('boss-ult-warning');
            if (ultWarn) ultWarn.classList.add('hidden');
            document.getElementById('arena-viewport').classList.remove('domain-active-bg');
            updateFightButtonUI(false);
            artifactCooldowns[1] = 0;
            artifactCooldowns[2] = 0;
            artifactCooldowns[3] = 0;
            towerState.skillCooldowns = { 0: 0, 1: 0, 2: 0 };
            updateArtifactButtonsUI();
            updateActiveSkillsUI();
            if (reason) addLog(`<span class="text-slate-400">⏹️ ${reason}</span>`);
        }

        /**
         * 12. HIỆU ỨNG TRẢM SÁT DỨT ĐIỂM & ĐẠI THẮNG
         */
        function triggerFatalFinisher(fObj, onComplete) {
            if (!fObj) {
                if (onComplete) onComplete();
                return;
            }
            towerState.liveBossHp = 0;
            playSound('thunder');
            playSound('bell');
            triggerScreenShake('ult');
            triggerCameraZoom(1.15, 450);

            fireCanvasSwordQi(true, '#fde047', 15, true);

            const canvas = document.getElementById('combat-canvas');
            if (canvas) {
                spawnCalligraphySeal('斬', canvas.width * 0.77, canvas.height * 0.45, '#f59e0b');
            }

            bossAnim.hitFlash = 12;
            bossAnim.dodgeOffset = 55;

            spawnFloatingText('boss-stage-anchor', '⚔️ TRẢM SÁT DỨT ĐIỂM! 💥', 'ult');
            showCinematicBanner(`⚔️ VẠN KIẾM QUY TÔNG • TRẢM SÁT ${fObj.name.toUpperCase()}! ⚔️`, 1800);
            addLog(`<span class="text-amber-300 font-bold">⚡ [TRẢM SÁT KẾT LIỄU]</span> Vạn kiếm tề xuất, chém vỡ ma đan của <strong>${fObj.name}</strong>, hoàn tất đồ ma!`);

            const battle = nextCombatTurn;
            towerState.combatTimer = setTimeout(() => {
                towerState.combatTimer = null;
                if (towerState.inCombat && nextCombatTurn === battle && onComplete) onComplete();
            }, 550);
        }

        function handleVictory(fObj) {
            stopCombat();
            playSound('bell');

            // Sau chiến thắng: Khí Huyết hồi phục toàn bộ nhờ hấp thu linh khí thiên địa
            towerState.hero.hp = towerState.hero.maxHp;
            towerState.hero.mp = 0;

            if (towerState.customBattle) {
                const cb = towerState.customBattle;
                showCinematicBanner(`🏆 ĐẠI THẮNG ĐỐI QUYẾT! TRẢM BẠI ${cb.name}! 🏆`, 2500);
                addLog(`<span class="text-emerald-300 font-bold">🏆 [ĐẠI THẮNG QUYẾT CHIẾN]</span> Đạo hữu kiếm khí tung hoành, đại thắng đối quyết <strong>${cb.name}</strong>!`);

                updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp, 0, fObj.hp, 0, 100, false);

                try {
                    /* direct GameState */
                } catch (e) {}

                showCustomVictoryModal(cb);
                return;
            }

            const ltGain = fObj.floor * 16000;
            const tvGain = fObj.floor * 48000;
            towerState.linhThach += ltGain;
            towerState.tuVi += tvGain;
            document.getElementById('ui-linh-thach').textContent = fmt(towerState.linhThach);
            document.getElementById('ui-tu-vi').textContent = fmt(towerState.tuVi);

            const droppedItem = fObj.drops[Math.floor(Math.random() * fObj.drops.length)];
            addItemToLootBag(droppedItem);

            const soulIcons = ["🐺", "🕷️", "🐻", "👻", "🐍", "💀", "🌿", "🐲", "🗿", "🐆"];
            const newSoul = {
                id: `soul_${fObj.floor}_${Date.now()}`,
                name: `Hồn ${fObj.name}`,
                icon: fObj.isMilestone ? "👹" : soulIcons[(fObj.floor - 1) % 10],
                floor: fObj.floor,
                atkBonus: Math.round(fObj.atk * 0.24),
                critBonus: fObj.isMilestone ? 5 : 2
            };
            towerState.capturedSouls.unshift(newSoul);
            renderCapturedSouls();

            if (fObj.floor > towerState.highestCleared) {
                towerState.highestCleared = fObj.floor;
                document.getElementById('ui-cleared-badge').textContent = `Đã vượt: ${towerState.highestCleared}/50 Tầng`;
            }

            showCinematicBanner(`🏆 TRẢM YÊU ĐẠI THẮNG TẦNG ${fObj.floor}! 🏆`, 2400);
            addLog(`<span class="text-emerald-300 font-bold">🏆 [TRẢM YÊU ĐẠI THẮNG]</span> Vượt Tầng ${fObj.floor}! Thu hoạch <strong>${droppedItem.icon} [${droppedItem.name}]</strong> & phong ấn <strong>[${newSoul.name}]</strong>!`);

            renderFloorList();
            updateArenaHUD(fObj);
            updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp, 0, fObj.hp, 0, 100, false);

            syncWithParent({
                action: 'victory',
                floor: fObj.floor,
                highestCleared: towerState.highestCleared,
                linhThachGained: ltGain,
                tuViGained: tvGain,
                linhThachTotal: towerState.linhThach,
                tuViTotal: towerState.tuVi,
                droppedItem: droppedItem,
                newSoul: newSoul,
                capturedSouls: towerState.capturedSouls,
                lootBag: towerState.lootBag,
                selectedFloor: towerState.selectedFloor,
                selectedTier: towerState.selectedTier
            });

            const climbGeneration = combatGeneration;
            if (document.getElementById('chk-auto-climb').checked && fObj.floor < 50) {
                const nextF = fObj.floor + 1;
                const nextFObj = TOWER_50_FLOORS.find(x => x.floor === nextF);

                // Điểm dừng an toàn: Tự động dừng Leo Tháp nếu tầng tiếp theo là Boss Cột Mốc và lực chiến ta chưa bằng đối phương
                if (nextFObj && nextFObj.isMilestone && getHeroCP() < nextFObj.cp) {
                    document.getElementById('chk-auto-climb').checked = false;
                    updateAutoClimbUI();
                    showCinematicBanner(`⚠️ DỪNG LEO TỰ ĐỘNG TẠI CỘT MỐC TẦNG ${nextF}! MA UY CỰC THỊNH!`, 3200);
                    addLog(`<span class="text-amber-300 font-bold">⚠️ [Cột Mốc Hiểm Địa]</span> Tầng ${nextF} là Cột Mốc <strong>${nextFObj.name}</strong> (${nextFObj.realmUnlock})! Kiếm Lực đạo hữu chưa áp đảo đối thủ, hệ thống tự động dừng Tự Leo để bảo toàn sinh mệnh.`);
                    showVictoryModal(fObj, droppedItem, newSoul, ltGain, tvGain);
                    return;
                }

                showCinematicBanner(`🏆 ĐẠI THẮNG TẦNG ${fObj.floor}! TIẾN LÊN TẦNG ${nextF}... ⚡`, 1600);
                spawnFloatingText('hero-stage-anchor', `+${fmtShort(ltGain)} LT  +${fmtShort(tvGain)} TV`, 'heal');
                addLog(`<span class="text-emerald-300 font-bold">⚡ [Tự Động Leo Tháp]</span> Đã vượt Tầng ${fObj.floor}! Thu hoạch <strong>+${fmt(ltGain)} LT</strong>, <strong>+${fmt(tvGain)} TV</strong> & nhận <strong>${droppedItem.name}</strong>.`);

                const delay = Math.round(950 / (towerState.combatSpeed || 1));
                setTimeout(() => {
                    if (combatGeneration !== climbGeneration || towerState.inCombat || !document.getElementById('chk-auto-climb').checked) return;
                    towerState.selectedTier = Math.ceil(nextF / 10);
                    selectTierGroup(towerState.selectedTier);
                    selectFloor(nextF);
                    addLog(`<span class="text-amber-300 font-bold">⚡ [Tự Động Leo Tháp]</span> Tiến vào Tầng ${nextF}... Khai trận trảm ma!`);
                    setTimeout(() => {
                        if (combatGeneration === climbGeneration && document.getElementById('chk-auto-climb').checked && !towerState.inCombat) {
                            startOrStopCombat();
                        }
                    }, Math.round(450 / (towerState.combatSpeed || 1)));
                }, delay);
            } else {
                showVictoryModal(fObj, droppedItem, newSoul, ltGain, tvGain);
            }
        }

        function sweepClearedFloor(times = 1) {
            if (towerState.highestCleared <= 0) {
                addLog(`<span class="text-rose-400">⚠️ Chưa vượt tầng nào! Hãy khiêu chiến vượt tầng 1 trước khi Càn Quét.</span>`);
                return;
            }
            const count = Math.max(1, Math.min(10, Number(times) || 1));
            const sweepF = Math.max(1, towerState.highestCleared);
            const fObj = TOWER_50_FLOORS.find(x => x.floor === sweepF);
            if (!fObj) return;

            const ltGain = fObj.floor * 12000 * count;
            const tvGain = fObj.floor * 35000 * count;
            towerState.linhThach += ltGain;
            towerState.tuVi += tvGain;
            document.getElementById('ui-linh-thach').textContent = fmt(towerState.linhThach);
            document.getElementById('ui-tu-vi').textContent = fmt(towerState.tuVi);

            let lastDrop = null;
            for (let i = 0; i < count; i++) {
                const droppedItem = fObj.drops[Math.floor(Math.random() * fObj.drops.length)];
                addItemToLootBag(droppedItem);
                lastDrop = droppedItem;
            }

            playSound('bell');
            spawnFloatingText('hero-stage-anchor', `⚡ CÀN QUÉT x${count} T.${sweepF} +${fmtShort(ltGain)} LT!`, 'heal');
            addLog(`<span class="text-emerald-300 font-bold">⚡ [Càn Quét x${count} Tầng ${sweepF}]</span> Thu về <strong>+${fmt(ltGain)} Linh Thạch</strong>, <strong>+${fmt(tvGain)} Tu Vi</strong> & <strong>${count} Đạo Cụ</strong>!`);

            syncWithParent({
                action: 'sweep',
                floor: sweepF,
                count: count,
                linhThachGained: ltGain,
                tuViGained: tvGain,
                linhThachTotal: towerState.linhThach,
                tuViTotal: towerState.tuVi,
                droppedItem: lastDrop,
                lootBag: towerState.lootBag
            });
        }

        function renderCapturedSouls() {
            const box = document.getElementById('captured-soul-box');
            const badge = document.getElementById('soul-count-badge');
            if (!box || !badge) return;

            badge.textContent = `${towerState.capturedSouls.length} Hồn`;
            if (towerState.capturedSouls.length === 0) {
                box.innerHTML = `<div class="text-[10px] text-slate-500 text-center py-2">Trảm Yêu Vương để thu thập Nguyên Thần Yêu Hồn!</div>`;
                return;
            }

            box.innerHTML = towerState.capturedSouls.map(s => `
                <div class="p-2 rounded-xl bg-slate-900/90 border border-purple-500/35 flex items-center justify-between gap-1.5">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="text-lg shrink-0">${s.icon}</span>
                        <div class="min-w-0">
                            <div class="text-[11px] font-bold text-purple-200 truncate">${s.name}</div>
                            <div class="text-[9px] text-slate-400">Kiếm Công +${fmtShort(s.atkBonus)} • Bạo +${s.critBonus}%</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button onclick="devourDemonSoul('${s.id}')" class="px-2 py-1 rounded bg-rose-600/25 hover:bg-rose-600/50 border border-rose-500/40 text-[9px] font-bold text-rose-200 transition">
                            Luyện Hóa
                        </button>
                        <button onclick="equipGuardianSoul('${s.id}')" class="px-2 py-1 rounded bg-cyan-600/25 hover:bg-cyan-600/50 border border-cyan-500/40 text-[9px] font-bold text-cyan-200 transition">
                            Hộ Pháp
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function devourDemonSoul(soulId) {
            const idx = towerState.capturedSouls.findIndex(x => x.id === soulId);
            if (idx === -1) return;
            const s = towerState.capturedSouls[idx];

            towerState.hero.atk += s.atkBonus;
            towerState.hero.crit = Math.min(90, towerState.hero.crit + s.critBonus);
            towerState.capturedSouls.splice(idx, 1);

            playSound('bell');
            spawnFloatingText('hero-stage-anchor', `🏺 LUYỆN HỒN +${fmtShort(s.atkBonus)} CÔNG!`, 'ult');
            addLog(`<span class="text-purple-300 font-bold">🏺 [Luyện Yêu Hồ]</span> Luyện hóa <strong>${s.name}</strong>, tăng vĩnh viễn +${fmt(s.atkBonus)} Kiếm Công & +${s.critBonus}% Bạo Kích!`);

            renderCapturedSouls();
            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            if (fObj) updateArenaHUD(fObj);

            syncWithParent({
                action: 'soul_devoured',
                capturedSouls: towerState.capturedSouls
            });
        }

        function equipGuardianSoul(soulId) {
            const idx = towerState.capturedSouls.findIndex(x => x.id === soulId);
            if (idx === -1) return;
            const s = towerState.capturedSouls[idx];

            towerState.activeGuardian = {
                name: s.name.replace('Hồn ', ''),
                icon: s.icon,
                bonusAtkRatio: 0.38 + (s.floor * 0.008)
            };
            towerState.capturedSouls.splice(idx, 1);

            document.getElementById('guardian-spirit-name').innerHTML = `<span>${towerState.activeGuardian.icon}</span> ${towerState.activeGuardian.name}`;

            playSound('bell');
            spawnFloatingText('hero-stage-anchor', `✨ HỘ PHÁP: ${towerState.activeGuardian.name.toUpperCase()}!`, 'heal');
            addLog(`<span class="text-cyan-300 font-bold">🐺 [Khế Ước Hộ Pháp]</span> Đã thu phục <strong>${towerState.activeGuardian.name}</strong> trợ chiến!`);

            renderCapturedSouls();

            syncWithParent({
                action: 'guardian_equipped',
                activeGuardian: towerState.activeGuardian,
                capturedSouls: towerState.capturedSouls
            });
        }

        function handleDefeat(fObj) {
            stopCombat();
            const chk = document.getElementById('chk-auto-climb');
            if (chk && chk.checked) {
                chk.checked = false;
                updateAutoClimbUI();
            }
            playSound('thunder');
            triggerScreenShake('ult');

            if (towerState.customBattle) {
                const cb = towerState.customBattle;
                addLog(`<span class="text-rose-400 font-bold">⚠️ [TRỌNG THƯƠNG LÙI BƯỚC]</span> Không địch lại ${cb.name}! Kinh mạch chấn thương!`);
                try {
                    /* direct GameState */
                } catch (e) {}
                syncWithParent({ isInjured: true });
                showCustomDefeatModal(cb);
                return;
            }

            addLog(`<span class="text-rose-400 font-bold">⚠️ [TRỌNG THƯƠNG LÙI BƯỚC]</span> Không địch lại ${fObj.name}! Kinh mạch chấn thương, cần điều tức 15s hoặc dùng Hồi Huyết Đan!`);
            syncWithParent({ isInjured: true });
            showDefeatModal(fObj);
        }

        function showCustomVictoryModal(cb) {
            const modal = document.getElementById('tower-victory-modal');
            if (!modal) return;

            const fTitle = document.getElementById('victory-floor-title');
            if (fTitle) fTitle.textContent = `ĐẠI THẮNG: ${cb.name ? cb.name.toUpperCase() : 'QUYẾT ĐẤU'}`;
            const bDesc = document.getElementById('victory-boss-desc');
            if (bDesc) bDesc.textContent = `Đã kích bại [${cb.name}], uy danh vang dội, thu hoạch vô lượng cơ duyên!`;

            const ltGain = (cb.rewards && (cb.rewards.linhThach || cb.rewards.stones)) || 150000;
            const tvGain = (cb.rewards && (cb.rewards.tuVi || cb.rewards.exp)) || 300000;
            const ltEl = document.getElementById('victory-reward-lt');
            if (ltEl) ltEl.textContent = `+${fmt(ltGain)}`;
            const tvEl = document.getElementById('victory-reward-tv');
            if (tvEl) tvEl.textContent = `+${fmt(tvGain)}`;

            const turnsEl = document.getElementById('victory-stat-turns');
            if (turnsEl) turnsEl.textContent = `${towerState.battleTurns || 1} Hiệp`;
            const maxDmgEl = document.getElementById('victory-stat-max-dmg');
            if (maxDmgEl) maxDmgEl.textContent = fmt(towerState.maxDamageDealt || Math.round(towerState.hero.atk * 1.5));
            const maxComboEl = document.getElementById('victory-stat-max-combo');
            if (maxComboEl) maxComboEl.textContent = `${Math.max(1, towerState.maxCombo || 1)} Hits`;

            const lootName = document.getElementById('victory-loot-name');
            const lootIcon = document.getElementById('victory-loot-icon');
            const lootRarity = document.getElementById('victory-loot-rarity');
            const useItemBtn = document.getElementById('btn-victory-use-item');
            if (useItemBtn) useItemBtn.classList.add('hidden');
            if (lootName) lootName.textContent = (cb.rewards && (cb.rewards.title || cb.rewards.badge)) || 'Chiến Tích Quyết Đấu';
            if (lootIcon) lootIcon.textContent = cb.icon || '🏆';
            if (lootRarity) lootRarity.textContent = cb.realm || 'Tuyệt Phẩm';

            const soulRow = document.getElementById('victory-soul-row');
            if (soulRow) soulRow.classList.add('hidden');

            const milestoneBanner = document.getElementById('victory-milestone-banner');
            if (milestoneBanner) milestoneBanner.classList.add('hidden');

            const nextBtn = document.getElementById('btn-victory-next-floor');
            if (nextBtn) {
                nextBtn.innerHTML = `🏆 Hoàn Tất & Trở Về <span class="text-[10px] text-amber-200 block font-normal">(Space / Enter)</span>`;
                nextBtn.onclick = function() {
                    closeVictoryModal();
                };
            }

            modal.classList.remove('hidden');
        }

        function showCustomDefeatModal(cb) {
            const modal = document.getElementById('tower-defeat-modal');
            if (!modal) return;
            const fTitle = document.getElementById('defeat-floor-title');
            if (fTitle) fTitle.textContent = `CHIẾN BẠI TRƯỚC ${cb.name ? cb.name.toUpperCase() : 'ĐỐI THỦ'}!`;
            const bDesc = document.getElementById('defeat-boss-desc');
            if (bDesc) bDesc.textContent = `[${cb.name}] công lực thâm hậu cái thế, khó lòng kháng cự. Cần tĩnh dưỡng điều tức!`;
            modal.classList.remove('hidden');
        }

        function toggleTowerAutoFarm() {
            window._towerAutoFarm = !window._towerAutoFarm;
            const btn = document.getElementById('btn-tower-autofarm');
            if (btn) {
                btn.textContent = window._towerAutoFarm ? '🔁 Quét Tháp: BẬT' : '🔁 Quét Tháp: Tắt';
                btn.className = window._towerAutoFarm
                    ? 'px-2 py-1 rounded-xl bg-amber-500/90 text-slate-950 border border-amber-300 font-bold text-[11px] shadow-[0_0_12px_rgba(245,158,11,0.5)] transition animate-pulse'
                    : 'px-2 py-1 rounded-xl bg-slate-900/90 hover:bg-amber-900/60 border border-amber-400/50 text-amber-200 font-bold text-[11px] transition';
            }
        }

        function showVictoryModal(fObj, droppedItem, newSoul, ltGain, tvGain) {
            try {
                /* direct GameState */
            } catch (e) {}

            if (window._towerAutoFarm) {
                setTimeout(() => {
                    if (window._towerAutoFarm && typeof startFloor === 'function') {
                        const targetFloor = Math.max(1, Number(towerState?.maxClearedFloor || fObj?.floor || 1));
                        startFloor(targetFloor);
                    }
                }, 900);
            }

            const modal = document.getElementById('tower-victory-modal');
            if (!modal) return;

            const fTitle = document.getElementById('victory-floor-title');
            if (fTitle) fTitle.textContent = `VƯỢT THÀNH CÔNG TẦNG ${fObj.floor}`;
            const bDesc = document.getElementById('victory-boss-desc');
            if (bDesc) bDesc.textContent = `Đã trảm sát [${fObj.name}], ma uy tan biến, thu hoạch vô lượng cơ duyên!`;
            const ltEl = document.getElementById('victory-reward-lt');
            if (ltEl) ltEl.textContent = `+${fmt(ltGain)}`;
            const tvEl = document.getElementById('victory-reward-tv');
            if (tvEl) tvEl.textContent = `+${fmt(tvGain)}`;

            currentVictoryItem = droppedItem;
            currentVictorySoul = newSoul;

            // Cập nhật thống kê chiến tích
            const turnsEl = document.getElementById('victory-stat-turns');
            if (turnsEl) turnsEl.textContent = `${towerState.battleTurns || 1} Hiệp`;
            const maxDmgEl = document.getElementById('victory-stat-max-dmg');
            if (maxDmgEl) maxDmgEl.textContent = fmt(towerState.maxDamageDealt || Math.round(towerState.hero.atk * 1.5));
            const maxComboEl = document.getElementById('victory-stat-max-combo');
            if (maxComboEl) maxComboEl.textContent = `${Math.max(1, towerState.maxCombo || 1)} Hits`;

            // Reset trạng thái nút Dùng Ngay & Luyện Hóa
            const useItemBtn = document.getElementById('btn-victory-use-item');
            if (useItemBtn) {
                useItemBtn.textContent = '✨ Dùng Ngay';
                useItemBtn.disabled = false;
                useItemBtn.className = "px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/60 text-cyan-200 text-xs font-bold transition active:scale-95";
            }
            const devourSoulBtn = document.getElementById('btn-victory-devour-soul');
            if (devourSoulBtn) {
                devourSoulBtn.textContent = '🏺 Luyện Hóa';
                devourSoulBtn.disabled = false;
                devourSoulBtn.className = "px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/60 text-rose-200 text-xs font-bold transition active:scale-95";
            }

            const lootIcon = document.getElementById('victory-loot-icon');
            const lootName = document.getElementById('victory-loot-name');
            const lootRarity = document.getElementById('victory-loot-rarity');
            const lootBox = document.getElementById('victory-loot-box');
            if (droppedItem) {
                if (lootIcon) lootIcon.textContent = droppedItem.icon || '🎁';
                if (lootName) lootName.textContent = droppedItem.name || 'Bảo Vật';
                if (lootRarity) {
                    const rarityLabels = { Tien: 'Tiên Phẩm', Thien: 'Thiên Giai', Dia: 'Địa Giai' };
                    lootRarity.textContent = rarityLabels[droppedItem.rarity] || 'Kỳ Bảo';
                }
                if (lootBox) {
                    if (droppedItem.rarity === 'Tien') {
                        lootBox.className = "col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]";
                        if (lootRarity) lootRarity.className = "text-xs px-2.5 py-1 rounded-lg bg-amber-600/35 border border-amber-400 text-amber-200 font-bold";
                    } else if (droppedItem.rarity === 'Thien') {
                        lootBox.className = "col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-purple-500/15 border border-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
                        if (lootRarity) lootRarity.className = "text-xs px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-400/60 text-purple-200 font-bold";
                    } else {
                        lootBox.className = "col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
                        if (lootRarity) lootRarity.className = "text-xs px-2.5 py-1 rounded-lg bg-cyan-600/30 border border-cyan-400/60 text-cyan-200 font-bold";
                    }
                }
            }

            const soulRow = document.getElementById('victory-soul-row');
            if (newSoul && soulRow) {
                soulRow.classList.remove('hidden');
                const sIcon = document.getElementById('victory-soul-icon');
                if (sIcon) sIcon.textContent = newSoul.icon || '👹';
                const sName = document.getElementById('victory-soul-name');
                if (sName) sName.textContent = `${newSoul.name} (+${fmt(newSoul.atkBonus)} Công)`;
            } else if (soulRow) {
                soulRow.classList.add('hidden');
            }

            // Banner cột mốc cảnh giới (Tầng 10, 20, 30, 40, 50)
            const milestoneBanner = document.getElementById('victory-milestone-banner');
            if (milestoneBanner) {
                if (fObj.isMilestone && fObj.realmUnlock) {
                    milestoneBanner.classList.remove('hidden');
                    const mName = document.getElementById('victory-milestone-name');
                    if (mName) mName.textContent = `Đột Phá ${fObj.realmUnlock.toUpperCase()} (+Phi Kiếm & Thuộc Tính)`;
                } else {
                    milestoneBanner.classList.add('hidden');
                }
            }

            const nextBtn = document.getElementById('btn-victory-next-floor');
            if (nextBtn) {
                if (fObj.floor >= 50) {
                    nextBtn.innerHTML = '🏆 ĐÃ PHÁ ĐỈNH THÁP';
                    nextBtn.disabled = true;
                } else {
                    nextBtn.innerHTML = `🗡️ Khiêu Chiến Tầng ${fObj.floor + 1} <span class="text-[10px] text-amber-200 block font-normal">(Space / Enter)</span>`;
                    nextBtn.disabled = false;
                }
            }

            modal.classList.remove('hidden');
        }

        let currentVictoryItem = null;
        let currentVictorySoul = null;

        function closeVictoryModal() {
            const modal = document.getElementById('tower-victory-modal');
            if (modal) modal.classList.add('hidden');
            if (towerState.customBattle) {
                towerState.customBattle = null;
                try {
                    /* direct GameState */
                } catch (e) {}
            }
        }

        function sweepFromVictoryModal() {
            sweepClearedFloor(1);
            spawnFloatingText('hero-stage-anchor', '⚡ ĐÃ CÀN QUÉT THÊM!', 'heal');
        }

        function useItemFromVictoryModal() {
            if (!currentVictoryItem) return;
            const item = currentVictoryItem;
            useLootItem(item.id);
            const btn = document.getElementById('btn-victory-use-item');
            if (btn) {
                btn.textContent = '✓ Đã Luyện Hóa';
                btn.disabled = true;
                btn.className = "px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-400 text-emerald-200 font-bold text-xs";
            }
        }

        function devourSoulFromVictoryModal() {
            if (!currentVictorySoul) return;
            const s = currentVictorySoul;
            devourDemonSoul(s.id);
            const btn = document.getElementById('btn-victory-devour-soul');
            if (btn) {
                btn.textContent = `✓ Đã Luyện Hóa (+${fmtShort(s.atkBonus)})`;
                btn.disabled = true;
                btn.className = "px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-400 text-emerald-200 font-bold text-xs";
            }
        }

        function breakthroughFromVictoryModal() {
            closeVictoryModal();
            claimMilestoneBreakthrough();
        }

        function proceedToNextFloorFromModal() {
            closeVictoryModal();
            if (towerState.selectedFloor < 50) {
                const nextF = towerState.selectedFloor + 1;
                towerState.selectedTier = Math.ceil(nextF / 10);
                selectTierGroup(towerState.selectedTier);
                selectFloor(nextF);
                setTimeout(() => {
                    if (!towerState.inCombat) startOrStopCombat();
                }, 300);
            }
        }

        function showDefeatModal(fObj) {
            const modal = document.getElementById('tower-defeat-modal');
            if (!modal) return;
            const fTitle = document.getElementById('defeat-floor-title');
            if (fTitle) fTitle.textContent = `TRỌNG THƯƠNG TẠI TẦNG ${fObj.floor}!`;
            const bDesc = document.getElementById('defeat-boss-desc');
            if (bDesc) bDesc.textContent = `[${fObj.name}] ma uy hung hãn vượt tầm kiếm lực hiện tại. Hãy củng cố tu vi hoặc đổi chiến thuật!`;
            modal.classList.remove('hidden');
        }

        function closeDefeatModal() {
            const modal = document.getElementById('tower-defeat-modal');
            if (modal) modal.classList.add('hidden');
            if (towerState.customBattle) {
                towerState.customBattle = null;
                try {
                    /* direct GameState */
                } catch (e) {}
            }
        }

        function retryFloorFromDefeatModal() {
            const isCustom = !!towerState.customBattle;
            const currentCustom = towerState.customBattle;
            closeDefeatModal();
            healHeroFull();
            setTimeout(() => {
                if (isCustom && currentCustom) {
                    setupCustomBattleUI(currentCustom);
                } else {
                    if (!towerState.inCombat) startOrStopCombat();
                }
            }, 300);
        }

        function addItemToLootBag(itemTemplate) {
            const existing = towerState.lootBag.find(x => x.id === itemTemplate.id);
            if (existing) {
                existing.count++;
            } else {
                towerState.lootBag.unshift({ ...itemTemplate, count: 1 });
            }
            renderLootBag();
        }

        function useLootItem(itemId) {
            const idx = towerState.lootBag.findIndex(x => x.id === itemId);
            if (idx === -1) return;
            const item = towerState.lootBag[idx];

            if (item.statBoost.atk) towerState.hero.atk += item.statBoost.atk;
            if (item.statBoost.def) towerState.hero.def += item.statBoost.def;
            if (item.statBoost.hp) {
                towerState.hero.maxHp += item.statBoost.hp;
                towerState.hero.hp += item.statBoost.hp;
            }
            if (item.statBoost.crit) towerState.hero.crit = Math.min(90, towerState.hero.crit + item.statBoost.crit);
            if (item.statBoost.eva) towerState.hero.eva = Math.min(70, towerState.hero.eva + item.statBoost.eva);

            item.count--;
            if (item.count <= 0) towerState.lootBag.splice(idx, 1);

            playSound('bell');
            spawnFloatingText('hero-stage-anchor', `✨ LĨNH NGỘ ${item.name.toUpperCase()}!`, 'heal');
            addLog(`<span class="text-emerald-300">💊 [Luyện Hóa Bảo Vật]</span> Đạo hữu luyện hóa <strong>${item.name}</strong>: ${item.desc}!`);

            renderLootBag();
            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            if (fObj) updateArenaHUD(fObj);

            syncWithParent({
                action: 'loot_updated',
                lootBag: towerState.lootBag
            });
        }

        function useAllLootItems() {
            if (towerState.lootBag.length === 0) return;
            let totalAtk = 0;
            let totalHp = 0;
            towerState.lootBag.forEach(item => {
                const c = item.count;
                if (item.statBoost.atk) {
                    towerState.hero.atk += item.statBoost.atk * c;
                    totalAtk += item.statBoost.atk * c;
                }
                if (item.statBoost.def) towerState.hero.def += item.statBoost.def * c;
                if (item.statBoost.hp) {
                    towerState.hero.maxHp += item.statBoost.hp * c;
                    towerState.hero.hp += item.statBoost.hp * c;
                    totalHp += item.statBoost.hp * c;
                }
                if (item.statBoost.crit) towerState.hero.crit = Math.min(90, towerState.hero.crit + item.statBoost.crit * c);
                if (item.statBoost.eva) towerState.hero.eva = Math.min(70, towerState.hero.eva + item.statBoost.eva * c);
            });
            towerState.lootBag = [];
            playSound('bell');
            spawnFloatingText('hero-stage-anchor', `🌌 ĐẠI LUYỆN HÓA +${fmtShort(totalAtk)} CÔNG!`, 'ult');
            addLog(`<span class="text-emerald-300 font-bold">✨ [Đại Luyện Hóa Túi Đồ]</span> Đã hấp thu toàn bộ Linh Đan & Pháp Bảo! Kiếm Công +${fmt(totalAtk)}, Khí Huyết +${fmt(totalHp)}!`);
            renderLootBag();
            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            if (fObj) updateArenaHUD(fObj);

            syncWithParent({
                action: 'loot_updated',
                lootBag: towerState.lootBag
            });
        }

        function renderLootBag() {
            const grid = document.getElementById('loot-bag-grid');
            const totalItems = towerState.lootBag.reduce((sum, x) => sum + x.count, 0);
            document.getElementById('bag-count-badge').textContent = `${totalItems}`;

            if (towerState.lootBag.length === 0) {
                grid.innerHTML = `<div class="text-center py-6 text-xs text-slate-500">Chưa có chiến lợi phẩm. Hãy khiêu chiến hoặc Càn Quét!</div>`;
                return;
            }

            grid.innerHTML = towerState.lootBag.map(item => `
                <div onclick="useLootItem('${item.id}')" class="p-2 rounded-xl border rarity-${item.rarity} cursor-pointer hover:brightness-125 transition flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-lg shrink-0">
                            ${item.icon}
                        </div>
                        <div class="min-w-0">
                            <div class="text-xs font-bold truncate">${item.name}</div>
                            <div class="text-[10px] opacity-85 truncate">${item.desc}</div>
                        </div>
                    </div>
                    <div class="shrink-0 flex flex-col items-end">
                        <span class="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono font-bold">x${item.count}</span>
                        <span class="text-[9px] underline mt-0.5 opacity-90">Luyện hóa</span>
                    </div>
                </div>
            `).join('');
        }

        function selectUltimateSkill(ultId, castImmediately = true) {
            const u = ULTIMATE_SKILLS.find(s => s.id === ultId);
            if (!u) return;

            towerState.selectedUltId = ultId;
            if (u.manualId && u.manualId !== towerState.activeManualId) {
                towerState.activeManualId = u.manualId;
            }

            renderManualSelectorBar();
            renderActiveManualSkillsBar();
            renderManualsCompendium();
            updateCombatModeUI();
            updateArtifactButtonsUI();

            if (castImmediately && towerState.inCombat) {
                queuedCombatSkill = u;
                updateCombatSkillUI(u);
                addLog(`📜 Đã chuẩn bị ${u.name} cho lượt kế tiếp.`);
                return;
            }
            if (castImmediately) {
                if (towerState.inCombat) updateCombatSkillUI(u);
                playHeavenlyLightningVFX(u, 'boss');
                fireCanvasSwordQi(true, u.color, 8, true);
                playSound('thunder');
                triggerScreenShake('ult');

                if (towerState.inCombat && towerState.liveBossHp > 0) {
                    const instantDmg = Math.round(towerState.hero.atk * (u.mult * 0.55));
                    towerState.liveBossHp = Math.max(0, towerState.liveBossHp - instantDmg);
                    if (towerState.liveBossBrokenTurns <= 0) {
                        towerState.liveBossToughness = Math.max(0, towerState.liveBossToughness - (u.toughnessBreak || 35));
                    }
                    bossAnim.hitFlash = 6;
                    incrementCombo();
                    spawnFloatingText('boss-stage-anchor', `${u.icon} ${u.name.toUpperCase()} -${fmt(instantDmg)}!`, 'ult');
                    updateBarsUI(
                        towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp,
                        towerState.liveBossHp, towerState.liveBossMaxHp, towerState.liveBossMp,
                        towerState.liveBossToughness, towerState.liveBossBrokenTurns > 0
                    );
                }
            }

            addLog(`📜 Vận chuyển <strong>${u.manualName}</strong> • Thi triển <strong>[${u.name}]</strong>: ${u.desc}`);
        }

        function selectCultivationManual(manualId) {
            const manual = CULTIVATION_MANUALS.find(m => m.id === manualId);
            if (!manual) return;
            towerState.activeManualId = manual.id;
            selectHeroElement(manual.element);
            towerState.selectedUltId = manual.skills[2].id;

            renderManualSelectorBar();
            renderActiveManualSkillsBar();
            renderManualsCompendium();
            updateCombatModeUI();
            updateArtifactButtonsUI();

            triggerAnimeCutIn(manual.name, `${manual.tier.toUpperCase()} • ${manual.passiveDesc.toUpperCase()}`, manual.icon);
            addLog(`<span class="text-amber-300 font-bold">📜 [Chuyển Đổi Chủ Tu Công Pháp]</span> Đạo hữu vận chuyển <strong>${manual.name}</strong> (${manual.passiveDesc})! Đã mở khóa Tam Thức Liên Chiêu mới!`);
        }

        function renderManualSelectorBar() {
            const bar = document.getElementById('manual-selector-bar');
            if (!bar) return;
            bar.innerHTML = CULTIVATION_MANUALS.map(m => {
                const isActive = m.id === towerState.activeManualId;
                return `
                    <button onclick="selectCultivationManual('${m.id}')" aria-pressed="${isActive}" class="px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        isActive
                            ? 'bg-gradient-to-r from-amber-500/35 to-purple-600/35 text-amber-200 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
                            : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    }" title="${m.name} - ${m.passiveDesc}">
                        <span>${m.icon}</span>
                        <span>${m.shortName}</span>
                    </button>
                `;
            }).join('');
        }

        function renderActiveManualSkillsBar() {
            const bar = document.getElementById('active-manual-skills-bar');
            if (!bar) return;
            const manual = CULTIVATION_MANUALS.find(m => m.id === towerState.activeManualId) || CULTIVATION_MANUALS[0];
            const lbl = document.getElementById('active-manual-label');
            if (lbl) lbl.textContent = manual.shortName;

            const heroMp = (towerState.hero && towerState.hero.mp != null) ? towerState.hero.mp : 0;

            bar.innerHTML = manual.skills.map((s, idx) => {
                const cfg = SKILL_SLOT_CONFIGS[idx] || { key: idx === 0 ? 'Q' : (idx === 1 ? 'W' : 'E'), mp: 0 };
                const cd = (towerState.skillCooldowns && towerState.skillCooldowns[idx]) ? towerState.skillCooldowns[idx] : 0;
                const canAfford = heroMp >= cfg.mp;
                const badgeLabel = idx === 0 ? 'Thức 1' : (idx === 1 ? 'Thức 2' : 'Cấm Thuật');
                const isCasting = String(s.id) === bar.dataset.castingSkillId;

                let statusText = `${cfg.mp > 0 ? cfg.mp + ' MP' : '+25 MP'}`;
                let disabledClass = '';
                if (cd > 0) {
                    statusText = `⏳ ${cd} hiệp`;
                    disabledClass = 'opacity-50 grayscale pointer-events-none';
                } else if (!canAfford) {
                    disabledClass = 'opacity-65';
                }

                return `
                    <button onclick="castActiveSkillSlot(${idx})" data-skill-id="${s.id}" class="tower-skill-card ${isCasting ? 'is-casting ' : ''}${disabledClass}" title="${s.stance}: ${s.desc} [Phím ${cfg.key}] (Bấm để xuất chiêu)">
                        <span>${s.icon}</span>
                        <span>${badgeLabel} [${cfg.key}] · ${statusText}</span>
                        <span>${s.name}</span>
                    </button>
                `;
            }).join('');
        }

        function updateActiveSkillsUI() {
            renderActiveManualSkillsBar();
        }

        function renderManualsCompendium() {
            const box = document.getElementById('manuals-compendium-list');
            if (!box) return;

            box.innerHTML = CULTIVATION_MANUALS.map(m => {
                const isEquipped = m.id === towerState.activeManualId;
                return `
                    <div class="p-2.5 rounded-xl border rarity-${m.rarity} transition ${isEquipped ? 'ring-2 ring-amber-400' : ''}">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <div class="flex items-center gap-1.5 min-w-0">
                                <span class="text-lg shrink-0">${m.icon}</span>
                                <div class="min-w-0">
                                    <div class="text-xs font-xianxia font-bold text-amber-200 truncate">${m.name}</div>
                                    <div class="text-[9px] text-cyan-300 font-semibold">${m.tier} • Hệ ${m.element}</div>
                                </div>
                            </div>
                            <button onclick="selectCultivationManual('${m.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                                isEquipped
                                    ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
                                    : 'bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/60 text-amber-200'
                            }">
                                ${isEquipped ? '✔ Đang Chủ Tu' : '⚡ Vận Chuyển'}
                            </button>
                        </div>
                        <div class="text-[10px] text-emerald-300/90 mb-2 bg-black/30 px-2 py-1 rounded border border-white/5">
                            ☯️ <strong>Tâm Pháp:</strong> ${m.passiveDesc}
                        </div>
                        <div class="space-y-1">
                            ${m.skills.map(s => `
                                <div onclick="selectUltimateSkill(${s.id}, true)" class="p-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 border ${
                                    s.id === towerState.selectedUltId ? 'border-amber-400' : 'border-slate-800'
                                } cursor-pointer flex items-center justify-between gap-2 transition">
                                    <div class="flex items-center gap-1.5 min-w-0">
                                        <span class="text-base shrink-0">${s.icon}</span>
                                        <div class="min-w-0">
                                            <div class="text-[11px] font-bold text-slate-100 truncate">
                                                <span class="text-amber-300">[${s.stance}]</span> ${s.name}
                                            </div>
                                            <div class="text-[9px] text-slate-400 truncate">${s.desc}</div>
                                        </div>
                                    </div>
                                    <span class="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[9px] font-bold shrink-0">
                                        ⚡ Thi Triển (${Math.round(s.mult * 100)}%)
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function updateFightButtonUI(isFighting) {
            const btn = document.getElementById('btn-fight');
            if (!btn) return;
            btn.dataset.fighting = String(isFighting);
            document.querySelector('.tower-combat-dock').dataset.fighting = String(isFighting);
            updateCombatSkillUI();
            if (isFighting) {
                btn.className = "px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/50 font-xianxia font-bold text-xs xl:text-sm tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.3)] transition active:scale-95 flex items-center justify-center gap-1.5";
                btn.innerHTML = `<span>⏹️ DỪNG CHIẾN</span> <kbd class="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-rose-300 border border-rose-500/40">Space</kbd>`;
            } else {
                btn.className = "px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-700 hover:brightness-110 text-white font-xianxia font-bold text-xs xl:text-sm tracking-wider shadow-[0_0_25px_rgba(225,29,72,0.7)] transition active:scale-95 flex items-center justify-center gap-1.5";
                const label = towerState.customBattle ? (towerState.customBattle.name || 'QUYẾT ĐẤU') : `T.${towerState.selectedFloor}`;
                btn.innerHTML = `<span>🗡️ KHIÊU CHIẾN (${label})</span> <kbd class="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-amber-200 border border-amber-400/40">Space</kbd>`;
            }
        }

        function updateAutoClimbUI() {
            const chk = document.getElementById('chk-auto-climb');
            const label = document.getElementById('auto-climb-label');
            const dot = document.getElementById('auto-climb-status-dot');
            const text = document.getElementById('auto-climb-text');
            if (!chk || !label || !text) return;

            if (chk.checked) {
                label.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-400/80 text-emerald-200 text-xs cursor-pointer select-none shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all duration-200";
                if (dot) dot.classList.remove('hidden');
                text.textContent = "Tự Leo: BẬT";
            } else {
                label.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs cursor-pointer select-none transition-all duration-200 hover:border-amber-500/50";
                if (dot) dot.classList.add('hidden');
                text.textContent = "Tự Leo: TẮT";
            }
        }

        function updateSpeedBtnUI() {
            const btn = document.getElementById('btn-speed');
            const val = document.getElementById('speed-label');
            if (!btn) return;
            if (val) val.textContent = `${towerState.combatSpeed || 1}x`;
            btn.title = `Khoảng nghỉ mỗi lượt: ${getCombatTurnDelay() / 1000}s. Bấm hoặc nhấn X để đổi tốc độ.`;
        }

        function toggleCombatSpeed() {
            towerState.combatSpeed = (towerState.combatSpeed || 1) % 3 + 1;
            updateSpeedBtnUI();
            spawnFloatingText('hero-stage-anchor', `${towerState.combatSpeed}x · ${getCombatTurnDelay() / 1000}s/lượt`, 'dodge');
        }

        function healHeroFull() {
            towerState.hero.hp = towerState.hero.maxHp;
            towerState.hero.mp = Math.min(100, towerState.hero.mp + 40);
            const fObj = TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor);
            updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp, fObj.hp, fObj.hp, 0);
            spawnFloatingText('hero-stage-anchor', '+40 KIẾM NGUYÊN!', 'heal');
            addLog(`💚 Đạo hữu vận chuyển Thanh Liên Kiếm Điển, hồi đầy Khí Huyết và ngưng tụ <strong>+40 Kiếm Nguyên</strong>!`);
        }

        function claimMilestoneBreakthrough() {
            const nextMilestoneFloor = Math.ceil(towerState.selectedFloor / 10) * 10;
            const mBoss = TOWER_50_FLOORS.find(x => x.floor === nextMilestoneFloor);
            if (!mBoss || towerState.highestCleared < mBoss.floor) return;

            towerState.realmName = mBoss.realmUnlock;
            document.getElementById('header-realm-tag').textContent = `Cảnh Giới: ${mBoss.realmUnlock}`;

            towerState.hero.maxHp = Math.round(towerState.hero.maxHp * 1.65);
            towerState.hero.hp = towerState.hero.maxHp;
            towerState.hero.atk = Math.round(towerState.hero.atk * 1.48);
            towerState.hero.def = Math.round(towerState.hero.def * 1.42);
            towerState.hero.swordCount += 4;
            document.getElementById('ui-sword-count-top').textContent = towerState.hero.swordCount;

            playHeavenlyLightningVFX(ULTIMATE_SKILLS[5], 'hero');
            triggerScreenShake('ult');
            spawnFloatingText('hero-stage-anchor', `🌌 ĐỘT PHÁ ${mBoss.realmUnlock.toUpperCase()}!`, 'ult');
            addLog(`<span class="text-amber-300 font-bold">🌌 [ĐỘT PHÁ ĐẠI CẢNH GIỚI]</span> Chúc mừng đạo hữu chính thức bước vào <strong>${mBoss.realmUnlock}</strong>! Kiếm Lực tăng vọt & nhận thêm +4 Bản Mệnh Phi Kiếm!`);

            if (mBoss.floor < 50) {
                const nextFloor = mBoss.floor + 1;
                selectTierGroup(Math.ceil(nextFloor / 10));
                selectFloor(nextFloor);
            } else {
                updateArenaHUD(mBoss);
            }
        }

        function closeTowerPopup() {
            isTowerHibernated = true;
            if (towerState.inCombat) stopCombat();
            cancelTowerEffects();
            if (typeof window.pauseTowerEffects === 'function') window.pauseTowerEffects();
            closeVictoryModal();
            closeDefeatModal();
            syncWithParent({
                action: 'close',
                highestCleared: towerState.highestCleared,
                selectedFloor: towerState.selectedFloor,
                selectedTier: towerState.selectedTier,
                capturedSouls: towerState.capturedSouls,
                lootBag: towerState.lootBag,
                activeManualId: towerState.activeManualId,
                selectedUltId: towerState.selectedUltId,
                activeGuardian: towerState.activeGuardian
            });
            if (window.parent !== window) {
                /* direct GameState */
                return;
            }
            document.getElementById('tran-yeu-thap-popup').classList.add('hidden');
        }

        function openTowerPopup() {
            isTowerHibernated = false;
            document.getElementById('tran-yeu-thap-popup').classList.remove('hidden');
            if (typeof window.wakeTowerEffects === 'function') window.wakeTowerEffects();
        }

        function initTowerMenus() {
            const menus = [...document.querySelectorAll('.tower-menu')];
            const closeMenu = (menu, restoreFocus = false) => {
                menu.open = false;
                if (restoreFocus) menu.querySelector('summary').focus();
            };
            menus.forEach(menu => {
                menu.addEventListener('toggle', () => {
                    if (menu.open) menus.forEach(other => { if (other !== menu) closeMenu(other); });
                });
                menu.addEventListener('click', event => {
                    if (event.target.closest('button') && !menu.hasAttribute('data-keep-open')) closeMenu(menu, true);
                });
            });
            document.addEventListener('click', event => {
                if (!event.target.closest('.tower-menu')) menus.forEach(menu => closeMenu(menu));
            });
            document.addEventListener('keydown', event => {
                const opened = menus.find(menu => menu.open);
                const resultDialog = document.querySelector('#tower-victory-modal:not(.hidden), #tower-defeat-modal:not(.hidden)');
                if (event.key === 'Escape' && opened && !resultDialog) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeMenu(opened, true);
                }
            });
            document.getElementById('btn-sfx-toggle').setAttribute('aria-label', 'Bật hoặc tắt âm thanh');
            const visualToggles = {
                'btn-sfx-toggle': towerState.sfxEnabled,
                'btn-phap-tuong': towerState.phapTuongEnabled,
                'btn-wings-toggle': towerState.wingsEnabled,
                'btn-tam-thanh': towerState.tamThanhEnabled
            };
            Object.entries(visualToggles).forEach(([id, enabled]) => {
                document.getElementById(id).setAttribute('aria-pressed', String(enabled));
            });
        }

        window.addEventListener('pagehide', () => stopCombat());
        // Startup handled by window.initDemonTowerV4() inside index.html
    

    // Export functions needed by inline onclick handlers
    if (typeof syncWithParent === 'function') window.syncWithParent = syncWithParent;
    if (typeof applyMainGameData === 'function') window.applyMainGameData = applyMainGameData;
    if (typeof tryDirectSyncFromParent === 'function') window.tryDirectSyncFromParent = tryDirectSyncFromParent;
    if (typeof isTowerActive === 'function') window.isTowerActive = isTowerActive;
    if (typeof toggleSoundFX === 'function') window.toggleSoundFX = toggleSoundFX;
    if (typeof togglePhapTuongMode === 'function') window.togglePhapTuongMode = togglePhapTuongMode;
    if (typeof toggleDivineWings === 'function') window.toggleDivineWings = toggleDivineWings;
    if (typeof toggleThreePureClones === 'function') window.toggleThreePureClones = toggleThreePureClones;
    if (typeof triggerCinemaLetterbox === 'function') window.triggerCinemaLetterbox = triggerCinemaLetterbox;
    if (typeof triggerTimeStopVisual === 'function') window.triggerTimeStopVisual = triggerTimeStopVisual;
    if (typeof setSkyTheme === 'function') window.setSkyTheme = setSkyTheme;
    if (typeof triggerAnimeCutIn === 'function') window.triggerAnimeCutIn = triggerAnimeCutIn;
    if (typeof scheduleTowerEffect === 'function') window.scheduleTowerEffect = scheduleTowerEffect;
    if (typeof cancelTowerEffects === 'function') window.cancelTowerEffects = cancelTowerEffects;
    if (typeof getFormationSprite === 'function') window.getFormationSprite = getFormationSprite;
    if (typeof triggerCameraZoom === 'function') window.triggerCameraZoom = triggerCameraZoom;
    if (typeof triggerAnimeImpactFrame === 'function') window.triggerAnimeImpactFrame = triggerAnimeImpactFrame;
    if (typeof getCurrentEnemy === 'function') window.getCurrentEnemy = getCurrentEnemy;
    if (typeof triggerSwordRainSpectacle === 'function') window.triggerSwordRainSpectacle = triggerSwordRainSpectacle;
    if (typeof triggerHeavenSplitSpectacle === 'function') window.triggerHeavenSplitSpectacle = triggerHeavenSplitSpectacle;
    if (typeof triggerGrassCutsStarsSpectacle === 'function') window.triggerGrassCutsStarsSpectacle = triggerGrassCutsStarsSpectacle;
    if (typeof triggerHeavenlyTribulationEvent === 'function') window.triggerHeavenlyTribulationEvent = triggerHeavenlyTribulationEvent;
    if (typeof spawnGlassShatterShards === 'function') window.spawnGlassShatterShards = spawnGlassShatterShards;
    if (typeof updateArtifactButtonsUI === 'function') window.updateArtifactButtonsUI = updateArtifactButtonsUI;
    if (typeof castActiveArtifact === 'function') window.castActiveArtifact = castActiveArtifact;
    if (typeof spawnCalligraphySeal === 'function') window.spawnCalligraphySeal = spawnCalligraphySeal;
    if (typeof spawnLaserBeam === 'function') window.spawnLaserBeam = spawnLaserBeam;
    if (typeof spawnSpaceShatter === 'function') window.spawnSpaceShatter = spawnSpaceShatter;
    if (typeof prepareEyeArtwork === 'function') window.prepareEyeArtwork = prepareEyeArtwork;
    if (typeof prepareCrescentArtwork === 'function') window.prepareCrescentArtwork = prepareCrescentArtwork;
    if (typeof prepareLightningArtwork === 'function') window.prepareLightningArtwork = prepareLightningArtwork;
    if (typeof spawnLightningArc === 'function') window.spawnLightningArc = spawnLightningArc;
    if (typeof spawnCrescentWave === 'function') window.spawnCrescentWave = spawnCrescentWave;
    if (typeof createTowerArtwork === 'function') window.createTowerArtwork = createTowerArtwork;
    if (typeof drawTowerArtwork === 'function') window.drawTowerArtwork = drawTowerArtwork;
    if (typeof prepareAmbientDustArtwork === 'function') window.prepareAmbientDustArtwork = prepareAmbientDustArtwork;
    if (typeof getTowerArtwork === 'function') window.getTowerArtwork = getTowerArtwork;
    if (typeof drawHeroDivineWings === 'function') window.drawHeroDivineWings = drawHeroDivineWings;
    if (typeof drawDongHoangBellShield === 'function') window.drawDongHoangBellShield = drawDongHoangBellShield;
    if (typeof drawArticulatedSpiritDragon === 'function') window.drawArticulatedSpiritDragon = drawArticulatedSpiritDragon;
    if (typeof draw3DLotusPedestal === 'function') window.draw3DLotusPedestal = draw3DLotusPedestal;
    if (typeof drawSwordQiClashCore === 'function') window.drawSwordQiClashCore = drawSwordQiClashCore;
    if (typeof drawDetailedSword === 'function') window.drawDetailedSword = drawDetailedSword;
    if (typeof paintDetailedSword === 'function') window.paintDetailedSword = paintDetailedSword;
    if (typeof drawHeroAstralAvatar === 'function') window.drawHeroAstralAvatar = drawHeroAstralAvatar;
    if (typeof drawBossAstralAvatar === 'function') window.drawBossAstralAvatar = drawBossAstralAvatar;
    if (typeof drawCelestialHeavenlyGate === 'function') window.drawCelestialHeavenlyGate = drawCelestialHeavenlyGate;
    if (typeof drawSwordImmortal === 'function') window.drawSwordImmortal = drawSwordImmortal;
    if (typeof drawDemonSovereign === 'function') window.drawDemonSovereign = drawDemonSovereign;
    if (typeof initArenaCanvas === 'function') window.initArenaCanvas = initArenaCanvas;
    if (typeof resize === 'function') window.resize = resize;
    if (typeof renderLoop === 'function') window.renderLoop = renderLoop;
    if (typeof spawnFlyingSwordProjectile === 'function') window.spawnFlyingSwordProjectile = spawnFlyingSwordProjectile;
    if (typeof fireCanvasSwordQi === 'function') window.fireCanvasSwordQi = fireCanvasSwordQi;
    if (typeof fmt === 'function') window.fmt = fmt;
    if (typeof fmtShort === 'function') window.fmtShort = fmtShort;
    if (typeof getHeroCP === 'function') window.getHeroCP = getHeroCP;
    if (typeof selectHeroElement === 'function') window.selectHeroElement = selectHeroElement;
    if (typeof forgeSwordUpgrade === 'function') window.forgeSwordUpgrade = forgeSwordUpgrade;
    if (typeof incrementCombo === 'function') window.incrementCombo = incrementCombo;
    if (typeof selectTierGroup === 'function') window.selectTierGroup = selectTierGroup;
    if (typeof setupCustomBattleUI === 'function') window.setupCustomBattleUI = setupCustomBattleUI;
    if (typeof renderFloorList === 'function') window.renderFloorList = renderFloorList;
    if (typeof jumpToHighestFloor === 'function') window.jumpToHighestFloor = jumpToHighestFloor;
    if (typeof updateClimbProgressHUD === 'function') window.updateClimbProgressHUD = updateClimbProgressHUD;
    if (typeof selectFloor === 'function') window.selectFloor = selectFloor;
    if (typeof updateArenaHUD === 'function') window.updateArenaHUD = updateArenaHUD;
    if (typeof updateBarsUI === 'function') window.updateBarsUI = updateBarsUI;
    if (typeof spawnFloatingText === 'function') window.spawnFloatingText = spawnFloatingText;
    if (typeof triggerScreenShake === 'function') window.triggerScreenShake = triggerScreenShake;
    if (typeof playHeavenlyLightningVFX === 'function') window.playHeavenlyLightningVFX = playHeavenlyLightningVFX;
    if (typeof addLog === 'function') window.addLog = addLog;
    if (typeof switchRightSidebarTab === 'function') window.switchRightSidebarTab = switchRightSidebarTab;
    if (typeof toggleNextRightSidebarTab === 'function') window.toggleNextRightSidebarTab = toggleNextRightSidebarTab;
    if (typeof showCinematicBanner === 'function') window.showCinematicBanner = showCinematicBanner;
    if (typeof activateSwordDomain === 'function') window.activateSwordDomain = activateSwordDomain;
    if (typeof getCombatTurnDelay === 'function') window.getCombatTurnDelay = getCombatTurnDelay;
    if (typeof refreshCombatPlayer === 'function') window.refreshCombatPlayer = refreshCombatPlayer;
    if (typeof waitForPlayerManualAction === 'function') window.waitForPlayerManualAction = waitForPlayerManualAction;
    if (typeof triggerHitStop === 'function') window.triggerHitStop = triggerHitStop;
    if (typeof toggleAutoManualCombat === 'function') window.toggleAutoManualCombat = toggleAutoManualCombat;
    if (typeof updateCombatModeUI === 'function') window.updateCombatModeUI = updateCombatModeUI;
    if (typeof castActiveSkillSlot === 'function') window.castActiveSkillSlot = castActiveSkillSlot;
    if (typeof towerDamage === 'function') window.towerDamage = towerDamage;
    if (typeof playCombatTurn === 'function') window.playCombatTurn = playCombatTurn;
    if (typeof pickAutoCombatSkill === 'function') window.pickAutoCombatSkill = pickAutoCombatSkill;
    if (typeof updateCombatSkillUI === 'function') window.updateCombatSkillUI = updateCombatSkillUI;
    if (typeof startOrStopCombat === 'function') window.startOrStopCombat = startOrStopCombat;
    if (typeof stopCombat === 'function') window.stopCombat = stopCombat;
    if (typeof triggerFatalFinisher === 'function') window.triggerFatalFinisher = triggerFatalFinisher;
    if (typeof handleVictory === 'function') window.handleVictory = handleVictory;
    if (typeof sweepClearedFloor === 'function') window.sweepClearedFloor = sweepClearedFloor;
    if (typeof renderCapturedSouls === 'function') window.renderCapturedSouls = renderCapturedSouls;
    if (typeof devourDemonSoul === 'function') window.devourDemonSoul = devourDemonSoul;
    if (typeof equipGuardianSoul === 'function') window.equipGuardianSoul = equipGuardianSoul;
    if (typeof handleDefeat === 'function') window.handleDefeat = handleDefeat;
    if (typeof showCustomVictoryModal === 'function') window.showCustomVictoryModal = showCustomVictoryModal;
    if (typeof showCustomDefeatModal === 'function') window.showCustomDefeatModal = showCustomDefeatModal;
    if (typeof toggleTowerAutoFarm === 'function') window.toggleTowerAutoFarm = toggleTowerAutoFarm;
    if (typeof showVictoryModal === 'function') window.showVictoryModal = showVictoryModal;
    if (typeof closeVictoryModal === 'function') window.closeVictoryModal = closeVictoryModal;
    if (typeof sweepFromVictoryModal === 'function') window.sweepFromVictoryModal = sweepFromVictoryModal;
    if (typeof useItemFromVictoryModal === 'function') window.useItemFromVictoryModal = useItemFromVictoryModal;
    if (typeof devourSoulFromVictoryModal === 'function') window.devourSoulFromVictoryModal = devourSoulFromVictoryModal;
    if (typeof breakthroughFromVictoryModal === 'function') window.breakthroughFromVictoryModal = breakthroughFromVictoryModal;
    if (typeof proceedToNextFloorFromModal === 'function') window.proceedToNextFloorFromModal = proceedToNextFloorFromModal;
    if (typeof showDefeatModal === 'function') window.showDefeatModal = showDefeatModal;
    if (typeof closeDefeatModal === 'function') window.closeDefeatModal = closeDefeatModal;
    if (typeof retryFloorFromDefeatModal === 'function') window.retryFloorFromDefeatModal = retryFloorFromDefeatModal;
    if (typeof addItemToLootBag === 'function') window.addItemToLootBag = addItemToLootBag;
    if (typeof useLootItem === 'function') window.useLootItem = useLootItem;
    if (typeof useAllLootItems === 'function') window.useAllLootItems = useAllLootItems;
    if (typeof renderLootBag === 'function') window.renderLootBag = renderLootBag;
    if (typeof selectUltimateSkill === 'function') window.selectUltimateSkill = selectUltimateSkill;
    if (typeof selectCultivationManual === 'function') window.selectCultivationManual = selectCultivationManual;
    if (typeof renderManualSelectorBar === 'function') window.renderManualSelectorBar = renderManualSelectorBar;
    if (typeof renderActiveManualSkillsBar === 'function') window.renderActiveManualSkillsBar = renderActiveManualSkillsBar;
    if (typeof updateActiveSkillsUI === 'function') window.updateActiveSkillsUI = updateActiveSkillsUI;
    if (typeof renderManualsCompendium === 'function') window.renderManualsCompendium = renderManualsCompendium;
    if (typeof updateFightButtonUI === 'function') window.updateFightButtonUI = updateFightButtonUI;
    if (typeof updateAutoClimbUI === 'function') window.updateAutoClimbUI = updateAutoClimbUI;
    if (typeof updateSpeedBtnUI === 'function') window.updateSpeedBtnUI = updateSpeedBtnUI;
    if (typeof toggleCombatSpeed === 'function') window.toggleCombatSpeed = toggleCombatSpeed;
    if (typeof healHeroFull === 'function') window.healHeroFull = healHeroFull;
    if (typeof claimMilestoneBreakthrough === 'function') window.claimMilestoneBreakthrough = claimMilestoneBreakthrough;
    if (typeof closeTowerPopup === 'function') window.closeTowerPopup = closeTowerPopup;
    if (typeof openTowerPopup === 'function') window.openTowerPopup = openTowerPopup;
    if (typeof initTowerMenus === 'function') window.initTowerMenus = initTowerMenus;

    // Override TOWER_RULES turn duration
    if (typeof TOWER_RULES === 'object' && TOWER_RULES) {
        TOWER_RULES.turnDurationMs = 1000;
        TOWER_RULES.minimumTurnDurationMs = 850;
    }

    // Boot function replacing window.onload
    window.initDemonTowerV4 = function () {
        if (!window.__towerV4Booted) {
            window.__towerV4Booted = true;
            if (typeof initTowerMenus === 'function') initTowerMenus();
            if (typeof initArenaCanvas === 'function') initArenaCanvas();
            if (typeof renderManualSelectorBar === 'function') renderManualSelectorBar();
            if (typeof renderActiveManualSkillsBar === 'function') renderActiveManualSkillsBar();
            if (typeof renderManualsCompendium === 'function') renderManualsCompendium();
            if (typeof updateCombatModeUI === 'function') updateCombatModeUI();
            if (typeof updateArtifactButtonsUI === 'function') updateArtifactButtonsUI();

            const synced = typeof tryDirectSyncFromParent === 'function' ? tryDirectSyncFromParent() : false;
            if (!synced) {
                const s = window.state || window.GameState?._rawState || window.GameState || {};
                const cleared = Math.max(0, (Number(s.towerFloor) || 1) - 1);
                towerState.highestCleared = cleared;
                towerState.linhThach = Number(s.stones ?? window.GameState?.LinhThach ?? 0) || 0;
                towerState.tuVi = Number(s.exp ?? window.GameState?.TuVi ?? 0) || 0;
                const tierIdx = Math.min(5, Math.max(1, Math.floor(cleared / 10) + 1));
                if (typeof selectTierGroup === 'function') selectTierGroup(tierIdx);
                if (typeof renderLootBag === 'function') renderLootBag();
                if (typeof renderCapturedSouls === 'function') renderCapturedSouls();
                if (typeof selectFloor === 'function') selectFloor(Math.min(50, cleared + 1));
            }
            if (typeof updateClimbProgressHUD === 'function') updateClimbProgressHUD();
            if (typeof updateSpeedBtnUI === 'function') updateSpeedBtnUI();
            if (typeof updateFightButtonUI === 'function') updateFightButtonUI(false);

            const autoChk = document.getElementById('chk-auto-climb');
            if (autoChk) {
                autoChk.addEventListener('change', (e) => {
                    if (typeof updateAutoClimbUI === 'function') updateAutoClimbUI();
                    if (e.target.checked && !towerState.inCombat && typeof startOrStopCombat === 'function') {
                        startOrStopCombat();
                    }
                });
                if (typeof updateAutoClimbUI === 'function') updateAutoClimbUI();
            }
        }
    };

    function syncBackToMainGameState() {
        const s = window.state || window.GameState?._rawState || window.GameState;
        if (!s || typeof towerState !== 'object' || !towerState) return;
        s.stones = Number(towerState.linhThach) || 0;
        s.exp = Number(towerState.tuVi) || 0;
        s.towerFloor = Math.max(Number(s.towerFloor) || 1, (Number(towerState.highestCleared) || 0) + 1);
        if (!s.demonTower || typeof s.demonTower !== 'object') s.demonTower = {};
        s.demonTower.highestCleared = Number(towerState.highestCleared) || 0;
        s.demonTower.selectedFloor = Number(towerState.selectedFloor) || 1;
        s.demonTower.selectedTier = Number(towerState.selectedTier) || 1;
        s.demonTower.activeManualId = towerState.activeManualId || 'thanh_lien_kiem_dien';
        s.demonTower.selectedUltId = towerState.selectedUltId ?? 2;
        s.demonTower.capturedSouls = Array.isArray(towerState.capturedSouls) ? towerState.capturedSouls : [];
        s.demonTower.lootBag = Array.isArray(towerState.lootBag) ? towerState.lootBag : [];
        s.demonTower.activeGuardian = towerState.activeGuardian || null;
        if (towerState.hero?.swordCount) s.demonTower.swordCount = towerState.hero.swordCount;
        if (window.GameState && typeof window.GameState.syncFromState === 'function') window.GameState.syncFromState(s);
        if (typeof window.recalculateAllStats === 'function') window.recalculateAllStats();
        if (typeof window.updateUI === 'function') window.updateUI();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.forceSaveNow === 'function') window.forceSaveNow();
    }

    if (typeof handleVictory === 'function') {
        const _origWin = handleVictory;
        window.handleVictory = function () {
            const res = _origWin.apply(this, arguments);
            syncBackToMainGameState();
            return res;
        };
        handleVictory = window.handleVictory;
    }
    if (typeof sweepClearedFloor === 'function') {
        const _origSweep = sweepClearedFloor;
        window.sweepClearedFloor = function () {
            const res = _origSweep.apply(this, arguments);
            syncBackToMainGameState();
            return res;
        };
        sweepClearedFloor = window.sweepClearedFloor;
    }
    if (typeof forgeSwordUpgrade === 'function') {
        const _origForge = forgeSwordUpgrade;
        window.forgeSwordUpgrade = function () {
            const res = _origForge.apply(this, arguments);
            syncBackToMainGameState();
            return res;
        };
        forgeSwordUpgrade = window.forgeSwordUpgrade;
    }

    const origRefresh = typeof refreshCombatPlayer === 'function' ? refreshCombatPlayer : null;
    window.refreshCombatPlayer = function () {
        if (origRefresh) {
            try { origRefresh.apply(this, arguments); } catch (_) {}
        }
        const s = window.state || window.GameState?._rawState || window.GameState;
        const payload = typeof window.getTowerSyncPayload === 'function' ? window.getTowerSyncPayload() : null;
        if (typeof towerState === 'object' && towerState) {
            if (payload) {
                towerState.linhThach = Number(payload.linhThach) || 0;
                towerState.tuVi = Number(payload.tuVi) || 0;
                towerState.realmName = payload.realmName || towerState.realmName;
                towerState.highestCleared = Math.max(0, Number(payload.highestCleared) || 0);
                if (payload.hero && towerState.hero) {
                    Object.assign(towerState.hero, payload.hero);
                    if (!towerState.inCombat) towerState.hero.hp = towerState.hero.maxHp;
                }
            } else if (s) {
                const realmEl = document.getElementById('realm-badge');
                towerState.realmName = realmEl ? realmEl.textContent.trim() : (s.realmName || towerState.realmName || 'Luyện Khí Tầng 1');
                towerState.linhThach = Number(s.stones ?? window.GameState?.LinhThach ?? 0) || 0;
                towerState.tuVi = Number(s.exp ?? window.GameState?.TuVi ?? 0) || 0;
                towerState.highestCleared = Math.max(0, (Number(s.towerFloor) || 1) - 1);
            }

            const heroName = payload?.characterName || s?.playerName || s?.characterName || s?.name || towerState.hero?.name || 'Tiêu Dao Tử';
            const nameEl = document.getElementById('hero-display-name');
            if (nameEl) nameEl.innerHTML = `<span>🗡️</span> ${heroName} • `;
            const elemTag = document.getElementById('hero-element-tag');
            if (elemTag && ELEMENTS[towerState.hero?.element]) {
                elemTag.textContent = ELEMENTS[towerState.hero.element].name;
            }
            const guardEl = document.getElementById('guardian-spirit-name');
            if (guardEl) {
                guardEl.textContent = towerState.activeGuardian
                    ? `${towerState.activeGuardian.icon || '🐺'} ${towerState.activeGuardian.name}`
                    : 'Chưa có Hộ Pháp';
            }
            const swdEl = document.getElementById('ui-sword-count-top');
            if (swdEl && towerState.hero?.swordCount) swdEl.textContent = towerState.hero.swordCount;

            const headerRealm = document.getElementById('header-realm-tag');
            if (headerRealm) headerRealm.textContent = 'Cảnh Giới: ' + towerState.realmName;
            const clearedBadge = document.getElementById('ui-cleared-badge');
            if (clearedBadge) clearedBadge.textContent = 'Đã vượt: ' + towerState.highestCleared + '/50 Tầng';
            const ltEl = document.getElementById('ui-linh-thach');
            if (ltEl) ltEl.textContent = Math.floor(towerState.linhThach).toLocaleString('vi-VN');
            const tvEl = document.getElementById('ui-tu-vi');
            if (tvEl) tvEl.textContent = Math.floor(towerState.tuVi).toLocaleString('vi-VN');

            const atkEl = document.getElementById('stat-atk');
            if (atkEl) atkEl.textContent = fmtShort(towerState.hero.atk);
            const defEl = document.getElementById('stat-def');
            if (defEl) defEl.textContent = fmtShort(towerState.hero.def);
            const critEl = document.getElementById('stat-crit');
            if (critEl) critEl.textContent = Math.round(towerState.hero.crit) + '%';
            const evaEl = document.getElementById('stat-eva');
            if (evaEl) evaEl.textContent = Math.round(towerState.hero.eva) + '%';

            const fObj = towerState.currentEnemy || (typeof TOWER_50_FLOORS !== 'undefined' && TOWER_50_FLOORS.find(x => x.floor === towerState.selectedFloor)) || null;
            if (fObj && typeof updateArenaHUD === 'function') {
                updateArenaHUD(fObj);
            } else if (typeof updateBarsUI === 'function') {
                updateBarsUI(towerState.hero.hp, towerState.hero.maxHp, towerState.hero.mp || 0, towerState.liveBossHp || 1000, towerState.liveBossMaxHp || 1000, 0, 100, false);
            }
            if (typeof updateClimbProgressHUD === 'function') updateClimbProgressHUD();
        }
    };

    window.closeTowerPopup = function () {
        if (typeof stopCombat === 'function') stopCombat();
        if (typeof window.setOverlayVFXPause === 'function') window.setOverlayVFXPause(false);
        const modal = document.getElementById('modal-tran-yeu-thap');
        if (modal) {
            modal.classList.remove('active', 'is-open', 'flex');
            modal.classList.add('hidden');
            modal.style.setProperty('display', 'none', 'important');
        }
        if (typeof window.forceSaveNow === 'function') window.forceSaveNow();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
    };

    window.openDemonTowerModal = function () {
        if (typeof window.closeAllModals === 'function') window.closeAllModals();
        if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
        if (typeof window.setOverlayVFXPause === 'function') window.setOverlayVFXPause(true);
        const modal = document.getElementById('modal-tran-yeu-thap');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active', 'is-open', 'flex');
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('opacity', '1', 'important');
            modal.style.setProperty('pointer-events', 'auto', 'important');
            modal.style.setProperty('z-index', '9800', 'important');
        }
        window.initDemonTowerV4();
        if (!towerState.inCombat && typeof tryDirectSyncFromParent === 'function') {
            tryDirectSyncFromParent();
        }
        window.refreshCombatPlayer();
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (typeof initArenaCanvas === 'function') initArenaCanvas();
            if (typeof wakeTowerEffects === 'function') wakeTowerEffects();
        }, 60);
    };
    globalThis.openDemonTowerModal = window.openDemonTowerModal;
    globalThis.closeDemonTowerModal = window.closeTowerPopup;
})();
