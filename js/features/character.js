(function () {
    'use strict';
    /* ==========================================================================
       HỆ THỐNG BẢN NGUYÊN TU SĨ & BẢNG CHỈ SỐ NHÂN VẬT (CHARACTER STATS ENGINE)
       Áp dụng chuẩn dữ liệu & công thức từ character_stats_demo.html
       ========================================================================== */
    const player = {
        name: "Tiêu Dao Tử",
        world: "[HẠ GIỚI] Phàm Tục",
        daoTam: "Chính Tà Cân Bằng",
        realmIndex: 4,
        realmName: "Trúc Cơ - Sơ Kỳ",
        core: {
            hp: 5800,
            maxHp: 5800,
            mp: 2400,
            maxMp: 2400,
            daoTamPoints: 100,
            maxDaoTam: 100,
            age: 18,
            maxLifespan: 200
        },
        combat: {
            atk: 680,
            def: 320,
            spd: 125,
            critRate: 18.5,
            armorPen: 12.0,
            dodge: 8.5
        },
        spiritRoot: {
            name: "Thiên Lôi Linh Căn",
            type: "mutated", // 'scrap' | 'true' | 'heaven' | 'mutated'
            elements: {
                kim: true,
                moc: false,
                thuy: true,
                hoa: false,
                tho: false
            }
        },
        companion: {
            pet: {
                name: "Cửu Vĩ Thiên Hồ",
                rank: "Thần Thú",
                desc: "Hồ ly chín đuôi thượng cổ, hộ vệ đạo tâm, gia tăng 15% Thân Pháp và 10% Tỉ lệ Bạo Kích khi xuất chiến.",
                avatar: "./assets/images/pet_fox.jpg"
            },
            artifacts: [
                { slot: "sword", name: "Trúc Kiếm Cổ Linh", equipped: true },
                { slot: "mirror", name: null, equipped: false },
                { slot: "orb", name: null, equipped: false }
            ]
        }
    };

    /**
     * TÍNH TOÁN LỰC CHIẾN (COMBAT POWER - CP)
     * Quy đổi chuẩn Xianxia RPG:
     * - Công Kích: x2.5
     * - Phòng Ngự: x2.0
     * - Khí Huyết: x0.15
     * - Linh Lực: x0.10
     * - Tốc Độ: x1.8
     * - Bạo Kích (%): x15.0
     * - Xuyên Giáp (%): x12.0
     * - Né Tránh (%): x10.0
     */
    function calculateCP(p) {
        if (!p || !p.core || !p.combat) return 0;
        const c = p.combat;
        const core = p.core;

        const cpAtk = (c.atk || 0) * 2.5;
        const cpDef = (c.def || 0) * 2.0;
        const cpHp = (core.maxHp || 0) * 0.15;
        const cpMp = (core.maxMp || 0) * 0.10;
        const cpSpd = (c.spd || 0) * 1.8;
        const cpCrit = (c.critRate || 0) * 15.0;
        const cpPen = (c.armorPen || 0) * 12.0;
        const cpDodge = (c.dodge || 0) * 10.0;

        return Math.round(cpAtk + cpDef + cpHp + cpMp + cpSpd + cpCrit + cpPen + cpDodge);
    }

    /**
     * HỆ SỐ TỐC ĐỘ HẤP THU LINH CĂN
     * - Tạp Linh Căn (4-5 hệ): x0.5
     * - Chân Linh Căn (2-3 hệ): x1.0
     * - Thiên Linh Căn (1 hệ tinh thuần): x1.5
     * - Biến Dị Linh Căn (Phong, Băng, Lôi): x2.0
     */
    function getSpiritRootMultiplier(root) {
        if (!root) return 1.0;
        switch (root.type) {
            case 'mutated':
                return 2.0;
            case 'heaven':
                return 1.5;
            case 'true':
                return 1.0;
            case 'scrap':
            default:
                return 0.5;
        }
    }

    /**
     * CƠ CHẾ THỌ NGUYÊN (LIFESPAN & TỌA HÓA)
     */
    function advanceAge(p, years) {
        if (!p) p = (typeof window !== 'undefined' && window.player) ? window.player : player;
        p.core.age += years;
        if (p.core.age >= p.core.maxLifespan) {
            triggerToaHoa(p);
            return true;
        }
        return false;
    }

    function triggerToaHoa(p) {
        console.warn("[Tọa Hóa] Đạo hữu " + p.name + " thọ nguyên đã tận (" + p.core.age + "/" + p.core.maxLifespan + " năm)!");
        if (typeof showXianxiaToast === 'function') {
            showXianxiaToast(`⚠️ THỌ NGUYÊN ĐÃ TẬN! Đạo hữu ${p.name} đạt giới hạn thọ nguyên (${p.core.age}/${p.core.maxLifespan} năm). Hãy chuyển sinh trùng tu!`, 'error');
        } else if (typeof alert === 'function') {
            alert("⚠️ THỌ NGUYÊN ĐÃ TẬN!\n\nĐạo hữu " + p.name + " tuổi thọ đạt giới hạn (" + p.core.age + "/" + p.core.maxLifespan + " năm), nhục thân tan biến, hóa thành tro bụi nhân gian.\nHãy Chuyển Sinh để trùng tu kiếp sau!");
        }
    }

    function onBreakthroughMajorRealm(p, bonusYears) {
        if (!p) p = (typeof window !== 'undefined' && window.player) ? window.player : player;
        p.core.maxLifespan += bonusYears;
    }

    /**
     * CHUYỂN TAB LINH THÚ / PHÁP BẢO
     */
    
    /**
     * CHUYỂN ĐỔI TỨC THÌ 3 SUB-TAB NGỌC GIẢN CỘT TRÁI (CĂN CƠ | LINH CĂN | ĐỒNG HÀNH)
     */
    function switchOriginSubTab(tabName, btnEl) {
        const key = String(tabName || 'canco').toLowerCase();
        document.querySelectorAll('.origin-subtab-btn').forEach(btn => {
            const match = btn === btnEl || btn.getAttribute('data-origin-tab') === key;
            btn.classList.toggle('active', match);
        });
        const map = {
            canco: 'origin-tab-canco',
            linhcan: 'origin-tab-linhcan',
            donghanh: 'origin-tab-donghanh'
        };
        const targetId = map[key] || 'origin-tab-canco';
        document.querySelectorAll('.origin-subtab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === targetId);
        });
    }

    function switchCompanionTab(tabType, btn) {
        document.querySelectorAll('.comp-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.comp-tab-content').forEach(c => c.classList.remove('active'));

        if (btn) btn.classList.add('active');
        if (tabType === 'pet') {
            const petTab = document.getElementById('tab-comp-pet');
            if (petTab) petTab.classList.add('active');
        } else {
            const artTab = document.getElementById('tab-comp-artifact');
            if (artTab) artTab.classList.add('active');
        }
    }

    /**
     * BỐC DỮ LIỆU ĐỒNG BỘ TỪ GAMESTATE TOÀN CỤC (WINDOW.STATE)
     */
    function getActivePlayerStats() {
        const s = (typeof window !== 'undefined' && window.state) 
            ? window.state 
            : (typeof globalThis !== 'undefined' && globalThis.state) 
                ? globalThis.state 
                : null;

        if (!s) return player;
        const effective = typeof window.getEffectiveStats === 'function' ? window.getEffectiveStats() : {};

        // Tên cảnh giới từ REALMS
        let realmName = "Trúc Cơ - Sơ Kỳ";
        if (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[s.realmIndex]) {
            realmName = REALMS[s.realmIndex].name;
        } else if (s.realmName) {
            realmName = s.realmName;
        }

        // Tên giới vực
        const worldName = (s.currentWorld === "ThuongGioi") ? "[THƯỢNG GIỚI] Tiên Vực" : "[HẠ GIỚI] Phàm Tục";

        // Đạo tâm
        let daoTamText = "Chính Tà Cân Bằng";
        const currentDaoTam = (typeof s.daoTam === 'number') ? s.daoTam : 100;
        if (currentDaoTam > 70) daoTamText = "Thái Dương Thánh Đạo";
        else if (currentDaoTam < 30) daoTamText = "Thái Âm Ma Đạo";

        // Linh căn
        const sRoot = s.spiritualRoot || {};
        const pillars = sRoot.pillars || {};
        let rootName = s.spiritRoot || "Thiên Lôi Linh Căn";
        if (sRoot.id && typeof sRoot.id === 'string') {
            if (sRoot.id === 'thunder_heaven') rootName = "Thiên Lôi Linh Căn";
            else if (sRoot.id.includes('heaven')) rootName = "Thiên Linh Căn";
            else if (sRoot.id.includes('chaos')) rootName = "Hỗn Độn Diệt Thế Căn";
        }

        let rootType = "mutated";
        if (sRoot.tier === 'heaven') rootType = 'heaven';
        else if (sRoot.tier === 'true') rootType = 'true';
        else if (sRoot.tier === 'mortal' || sRoot.tier === 'scrap') rootType = 'scrap';
        else if (sRoot.tier === 'mutated') rootType = 'mutated';

        const hasKim = typeof pillars.metal === 'number' ? pillars.metal > 0 : true;
        const hasMoc = typeof pillars.wood === 'number' ? pillars.wood > 0 : false;
        const hasThuy = typeof pillars.water === 'number' ? pillars.water > 0 : true;
        const hasHoa = typeof pillars.fire === 'number' ? pillars.fire > 0 : false;
        const hasTho = typeof pillars.earth === 'number' ? pillars.earth > 0 : false;

        return {
            name: s.player?.name || s.name || "Tiêu Dao Tử",
            avatar_url: s.player?.avatar_url || s.avatar_url || s.player?.avatar || s.avatar,
            world: worldName,
            daoTam: daoTamText,
            realmIndex: s.realmIndex || 0,
            realmName: realmName,
            core: {
                hp: s.hp ?? s.totalHp ?? 5800,
                maxHp: effective.maxHp ?? s.maxHp ?? s.totalHp ?? 5800,
                mp: s.mp ?? s.totalMp ?? 2400,
                maxMp: effective.maxMp ?? s.maxMp ?? s.totalMp ?? 2400,
                daoTamPoints: currentDaoTam,
                maxDaoTam: 100,
                age: s.ageYears ?? s.age ?? 18,
                maxLifespan: s.maxAge ?? s.lifespan ?? 200
            },
            combat: {
                atk: effective.atk ?? s.totalAtk ?? s.atk ?? 680,
                def: effective.def ?? s.totalDef ?? s.def ?? 320,
                spd: s.speed ?? 125,
                critRate: (typeof s.crit === 'number') ? s.crit : 18.5,
                armorPen: (typeof s.armorPen === 'number') ? s.armorPen : 12.0,
                dodge: (typeof s.dodge === 'number') ? s.dodge : 8.5
            },
            spiritRoot: {
                name: rootName,
                type: rootType,
                elements: {
                    kim: hasKim,
                    moc: hasMoc,
                    thuy: hasThuy,
                    hoa: hasHoa,
                    tho: hasTho
                }
            },
            companion: {
                pet: {
                    name: s.pet?.name || "Cửu Vĩ Thiên Hồ",
                    rank: s.pet?.rank || "Thần Thú",
                    desc: s.pet?.desc || "Hồ ly chín đuôi thượng cổ, hộ vệ đạo tâm, gia tăng 15% Thân Pháp và 10% Tỉ lệ Bạo Kích khi xuất chiến.",
                    avatar: s.pet?.avatar || "./assets/images/pet_fox.jpg"
                },
                artifacts: s.artifacts || [
                    { slot: "sword", name: "Trúc Kiếm Cổ Linh", equipped: true },
                    { slot: "mirror", name: null, equipped: false },
                    { slot: "orb", name: null, equipped: false }
                ]
            }
        };
    }

    /**
     * RENDER CẬP NHẬT GIAO DIỆN BẢN NGUYÊN TU SĨ
     */
    function renderCharacterUI(p) {
        if (!p) {
            p = getActivePlayerStats();
        }
        const cp = calculateCP(p);
        const rootMult = getSpiritRootMultiplier(p.spiritRoot);
        const setTextIfChanged = (element, value) => {
            if (element && element.textContent !== value) element.textContent = value;
        };
        const setBarWidthIfChanged = (element, percent) => {
            if (!element) return;
            const width = Math.min(100, Math.max(0, percent)).toFixed(1) + '%';
            if (element.style.width !== width) element.style.width = width;
        };

        // Header
        const nameEl = document.getElementById('ui-player-name');
        setTextIfChanged(nameEl, p.name);
        const worldEl = document.getElementById('ui-world-badge');
        setTextIfChanged(worldEl, p.world);
        const realmEl = document.getElementById('ui-realm-title');
        setTextIfChanged(realmEl, p.realmName);
        const avatarEl = document.getElementById('ui-avatar');
        if (avatarEl && (p.avatar_url || p.avatar)) {
            const nextAvatar = p.avatar_url || p.avatar;
            if (avatarEl.dataset.profileAvatar !== nextAvatar) {
                avatarEl.dataset.profileAvatar = nextAvatar;
                if (avatarEl.getAttribute('src') !== nextAvatar) avatarEl.src = nextAvatar;
            }
        }
        const daoTamEl = document.getElementById('ui-dao-tam');
        if (daoTamEl) daoTamEl.innerHTML = '<i class="fa-solid fa-yin-yang mr-1"></i> ' + p.daoTam;
        const rootBadgeEl = document.getElementById('ui-root-badge');
        if (rootBadgeEl) rootBadgeEl.innerHTML = '<i class="fa-solid fa-bolt mr-1 text-amber-400"></i> ' + (p.spiritRoot?.name || 'Thiên Lôi Linh Căn');
        const totalCpEl = document.getElementById('ui-total-cp');
        setTextIfChanged(totalCpEl, Math.round(cp).toLocaleString('vi-VN') + " CP");
        const formattedAge = Math.floor(Number(p.core.age) || 18);
        const formattedMaxAge = Math.floor(Number(p.core.maxLifespan) || 120);
        const lifespanBriefEl = document.getElementById('ui-lifespan-brief');
        setTextIfChanged(lifespanBriefEl, formattedAge + " / " + formattedMaxAge + " năm");

        // Panel 1: Progress Bars
        const hpText = document.getElementById('ui-hp-text');
        setTextIfChanged(hpText, Math.floor(Number(p.core.hp) || 0).toLocaleString('vi-VN') + " / " + Math.floor(Number(p.core.maxHp) || 0).toLocaleString('vi-VN'));
        const hpBar = document.getElementById('ui-hp-bar');
        if (hpBar) {
            const hpPct = p.core.maxHp > 0 ? (p.core.hp / p.core.maxHp) * 100 : 100;
            setBarWidthIfChanged(hpBar, hpPct);
        }

        const mpText = document.getElementById('ui-mp-text');
        setTextIfChanged(mpText, Math.floor(Number(p.core.mp) || 0).toLocaleString('vi-VN') + " / " + Math.floor(Number(p.core.maxMp) || 0).toLocaleString('vi-VN'));
        const mpBar = document.getElementById('ui-mp-bar');
        if (mpBar) {
            const mpPct = p.core.maxMp > 0 ? (p.core.mp / p.core.maxMp) * 100 : 100;
            setBarWidthIfChanged(mpBar, mpPct);
        }

        const mindText = document.getElementById('ui-mind-text');
        setTextIfChanged(mindText, Math.round(Number(p.core.daoTamPoints) || 0) + " / " + Math.round(Number(p.core.maxDaoTam) || 100));
        const mindBar = document.getElementById('ui-mind-bar');
        if (mindBar) {
            const mindPct = p.core.maxDaoTam > 0 ? (p.core.daoTamPoints / p.core.maxDaoTam) * 100 : 100;
            setBarWidthIfChanged(mindBar, mindPct);
        }

        const lifespanText = document.getElementById('ui-lifespan-text');
        setTextIfChanged(lifespanText, formattedAge + " / " + formattedMaxAge + " năm");
        const lifespanBar = document.getElementById('ui-lifespan-bar');
        if (lifespanBar) {
            const lifePct = p.core.maxLifespan > 0 ? (p.core.age / p.core.maxLifespan) * 100 : 10;
            setBarWidthIfChanged(lifespanBar, lifePct);
        }

        // Panel 2: Combat Stats
        const atkEl = document.getElementById('ui-stat-atk');
        if (atkEl) atkEl.textContent = Number(p.combat.atk).toLocaleString();
        const defEl = document.getElementById('ui-stat-def');
        if (defEl) defEl.textContent = Number(p.combat.def).toLocaleString();
        const spdEl = document.getElementById('ui-stat-spd');
        if (spdEl) spdEl.textContent = Number(p.combat.spd).toLocaleString();
        const critEl = document.getElementById('ui-stat-crit');
        if (critEl) critEl.textContent = p.combat.critRate + "%";
        const penEl = document.getElementById('ui-stat-pen');
        if (penEl) penEl.textContent = p.combat.armorPen + "%";
        const dodgeEl = document.getElementById('ui-stat-dodge');
        if (dodgeEl) dodgeEl.textContent = p.combat.dodge + "%";

        // Panel 3: Linh Căn
        const rootMultEl = document.getElementById('ui-root-multiplier');
        if (rootMultEl) rootMultEl.textContent = "x" + rootMult.toFixed(2);
        const rootPurityEl = document.getElementById('ui-root-purity-name');
        if (rootPurityEl && p.spiritRoot) rootPurityEl.textContent = p.spiritRoot.name;

        // 5 Nguyên tố Ngũ Hành
        const elements = p.spiritRoot?.elements || { kim: true, moc: false, thuy: true, hoa: false, tho: false };
        const elemMap = {
            'root-elem-kim': elements.kim,
            'root-elem-moc': elements.moc,
            'root-elem-thuy': elements.thuy,
            'root-elem-hoa': elements.hoa,
            'root-elem-tho': elements.tho
        };
        Object.entries(elemMap).forEach(([id, active]) => {
            const el = document.getElementById(id);
            if (el) {
                if (active) el.classList.add('active');
                else el.classList.remove('active');
            }
        });

        // Cập nhật 3 ô Pháp Bảo Bản Mệnh trên Cột Trái nếu người chơi có trang bị
        if (window.state) {
            const eq = window.state.equipped || {};
            const arts = Array.isArray(window.state.artifacts) ? window.state.artifacts : [];
            const artSword = arts.find(a => a.id === 'sword');
            const artMirror = arts.find(a => a.id === 'mirror');
            const artOrb = arts.find(a => a.id === 'bead' || a.id === 'orb');

            const swordEl = document.getElementById('ui-artifact-slot-sword');
            if (swordEl) {
                const wpName = (artSword && artSword.equipped) ? `${artSword.name} (Bậc ${artSword.level || 1})` : (eq.weapon?.name || "Trúc Kiếm Cổ Linh");
                setTextIfChanged(swordEl, wpName);
            }
            const mirrorEl = document.getElementById('ui-artifact-slot-mirror');
            if (mirrorEl) {
                const arName = (artMirror && artMirror.equipped) ? `${artMirror.name} (Bậc ${artMirror.level || 1})` : (eq.armor?.name || "[Bấm để gắn]");
                setTextIfChanged(mirrorEl, arName);
                mirrorEl.className = (artMirror && artMirror.equipped) || eq.armor?.name ? "text-[10px] text-sky-300 font-mono" : "text-[10px] text-slate-400 font-mono";
            }
            const orbEl = document.getElementById('ui-artifact-slot-orb');
            if (orbEl) {
                const tlName = (artOrb && artOrb.equipped) ? `${artOrb.name} (Bậc ${artOrb.level || 1})` : (eq.talisman?.name || "[Bấm để gắn]");
                setTextIfChanged(orbEl, tlName);
                orbEl.className = (artOrb && artOrb.equipped) || eq.talisman?.name ? "text-[10px] text-purple-300 font-mono" : "text-[10px] text-slate-400 font-mono";
            }

            // Cập nhật ô Linh Thú Hộ Pháp trên Cột Trái
            const activePetId = window.state.activePet || 'fox';
            const petLvl = Number(window.state.petLevel) || 1;
            const petTier = Number(window.state.petTier) || 1;
            const petsData = typeof DIVINE_PETS_DATA !== 'undefined' ? DIVINE_PETS_DATA : [];
            const bloodlineTiers = typeof PET_BLOODLINE_TIERS !== 'undefined' ? PET_BLOODLINE_TIERS : [];
            const curPet = petsData.find(pt => pt.id === activePetId) || petsData[0];
            const curBloodline = bloodlineTiers[petTier - 1] || bloodlineTiers[0];

            if (curPet) {
                const petNameEl = document.getElementById('ui-pet-name');
                if (petNameEl) setTextIfChanged(petNameEl, `${curPet.name} (Cấp ${petLvl})`);
                const petBadgeEl = document.getElementById('ui-pet-badge');
                if (petBadgeEl && curBloodline) setTextIfChanged(petBadgeEl, curBloodline.name || 'Ấu Niên Thể');
                const petDescEl = document.getElementById('ui-pet-desc');
                if (petDescEl) setTextIfChanged(petDescEl, `${curPet.title} • Hệ ${curPet.element}. ${curPet.skillDesc}`);
                const petImgEl = document.getElementById('ui-pet-img');
                const petFrame = petImgEl ? petImgEl.parentElement : document.querySelector('.pet-avatar-frame');
                if (curPet.id === 'fox') {
                    if (petImgEl) {
                        petImgEl.style.display = 'block';
                        petImgEl.src = curPet.image || './assets/images/pet_fox.jpg';
                    }
                    const iconEl = petFrame ? petFrame.querySelector('.pet-avatar-icon') : null;
                    if (iconEl) iconEl.remove();
                } else if (petFrame) {
                    if (petImgEl) petImgEl.style.display = 'none';
                    let iconEl = petFrame.querySelector('.pet-avatar-icon');
                    if (!iconEl) {
                        iconEl = document.createElement('div');
                        iconEl.className = 'pet-avatar-icon w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-900 border border-slate-700';
                        petFrame.appendChild(iconEl);
                    }
                    iconEl.innerHTML = `<i class="fa-solid ${curPet.icon || 'fa-paw'} text-2xl ${curPet.textColor || 'text-amber-400'}"></i>`;
                }
            }
        }

        
        const s = (typeof state !== 'undefined' && state) ? state : (window.GameState || window.state || null);
        if (s) {
            const realmsArr = (typeof REALMS !== 'undefined' && Array.isArray(REALMS)) ? REALMS : (window.REALMS || []);
            const curRealmObj = realmsArr[s.realmIndex || 0] || {};
            const maxExp = Number(curRealmObj.maxExp || s.maxExp) || 100;
            const curExp = Number(s.exp) || 0;
            const lkCur = Number(s.linhKhi) || 0;
            const lkMax = Math.max(1, Number(s.maxLinhKhi) || 50000);
            const lkPct = Math.max(15, Math.min(100, Math.round((lkCur / lkMax) * 100)));
            const lkBar = document.getElementById('ui-root-linhkhi-bar');
            if (lkBar) lkBar.style.width = lkPct + '%';

            const actBtn = document.getElementById('btn-cultivate-action');
            const actLbl = document.getElementById('btn-cultivate-label');
            const actIcon = document.getElementById('btn-cultivate-icon');
            if (actBtn) {
                const isReady = curExp >= maxExp;
                actBtn.classList.toggle('is-ready', isReady);
                actBtn.classList.toggle('is-breakthrough-ready', isReady);
                actBtn.classList.toggle('breakthrough-ready', isReady);
                actBtn.classList.toggle('is-meditating', !isReady);
                actBtn.setAttribute('data-ready', isReady ? 'true' : 'false');
                if (isReady) {
                    actBtn.removeAttribute('disabled');
                    if (actLbl) actLbl.textContent = curRealmObj.isMajorBottleneck ? 'NGHÊNH ĐÓN THIÊN KIẾP' : 'ĐỘT PHÁ CẢNH GIỚI';
                    if (actIcon) actIcon.className = 'fa-solid fa-bolt-lightning mr-1.5 text-amber-950 animate-bounce';
                } else {
                    if (actLbl) actLbl.textContent = 'ĐANG TỤ KHÍ...';
                    if (actIcon) actIcon.className = 'fa-solid fa-yin-yang fa-spin mr-1.5 text-emerald-400/80';
                }
            }
        }

        // Cập nhật legacy fallback elements nếu có
        const legacyHpText = document.getElementById('stat-hp-text');
        if (legacyHpText) legacyHpText.textContent = p.core.hp + "/" + p.core.maxHp;
        const legacyAtk = document.getElementById('stat-atk');
        if (legacyAtk) legacyAtk.textContent = p.combat.atk;
        const legacyDef = document.getElementById('stat-def');
        if (legacyDef) legacyDef.textContent = p.combat.def;
        const legacySpd = document.getElementById('stat-spd');
        if (legacySpd) legacySpd.textContent = p.combat.spd;
        const legacyCrit = document.getElementById('stat-crit');
        if (legacyCrit) legacyCrit.textContent = p.combat.critRate + "%";
        const legacyCp = document.getElementById('combat-power-text');
        if (legacyCp) legacyCp.textContent = cp;
    }

    /**
     * ĐỒNG BỘ CÔNG PHÁP NHÂN VẬT (CHARACTER SKILLS SYNC)
     */
    function syncCharacterSkills(targetState) {
        const s = targetState || (typeof window !== 'undefined' ? window.state : null);
        if (!s) return [];
        if (typeof window.ensureLearnedSkillsInit === 'function') {
            window.ensureLearnedSkillsInit();
        }
        return s.learnedSkills || [];
    }

    function renderCharacterSkills(container) {
        const host = container || document.getElementById('skills-page-content');
        if (!host) return;
        if (typeof window.renderSkillsHub === 'function') {
            window.renderSkillsHub(host);
        }
    }

    // Xuất khẩu các hàm ra window và globalThis
    window.player = player;
    window.calculateCP = calculateCP;
    window.getSpiritRootMultiplier = getSpiritRootMultiplier;
    window.advanceAge = advanceAge;
    window.switchOriginSubTab = switchOriginSubTab;
    window.switchCompanionTab = switchCompanionTab;
    window.renderCharacterUI = renderCharacterUI;
    window.getActivePlayerStats = getActivePlayerStats;
    window.onBreakthroughMajorRealm = onBreakthroughMajorRealm;
    window.syncCharacterSkills = syncCharacterSkills;
    window.renderCharacterSkills = renderCharacterSkills;

    globalThis.player = player;
    globalThis.calculateCP = calculateCP;
    globalThis.getSpiritRootMultiplier = getSpiritRootMultiplier;
    globalThis.advanceAge = advanceAge;
    globalThis.switchOriginSubTab = switchOriginSubTab;
    globalThis.switchCompanionTab = switchCompanionTab;
    globalThis.renderCharacterUI = renderCharacterUI;
    globalThis.getActivePlayerStats = getActivePlayerStats;
    globalThis.onBreakthroughMajorRealm = onBreakthroughMajorRealm;
    globalThis.syncCharacterSkills = syncCharacterSkills;
    globalThis.renderCharacterSkills = renderCharacterSkills;

    // Đảm bảo sau khi DOM sẵn sàng, các thanh điều hướng và khung 3 cột luôn hoạt động chuẩn xác
})();
