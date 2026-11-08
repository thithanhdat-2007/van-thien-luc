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

        const curAge = state.age || 18;
        const maxAge = state.maxAge || 120;
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
    // PHẦN 3: TIÊN MÔN GIA VIÊN LOGIC
    // ========================================================================
    const ESTATE_DATA = {
        nodes: [
            {
                id: 'node_spirit_tree',
                name: 'Linh Căn Mộc',
                subTitle: 'Tụ Linh Trận',
                icon: 'fa-solid fa-tree',
                color: 'text-emerald-400',
                resourceType: 'exp',
                resourceLabel: 'Tu Vi',
                ratePerHour: 1200,
                maxCapacity: 6000,
                accumulated: 1850,
                assignedCompanion: null
            },
            {
                id: 'node_herb_garden',
                name: 'Dược Điền Thiên Tuyền',
                subTitle: 'Linh Thảo Viên',
                icon: 'fa-solid fa-seedling',
                color: 'text-green-400',
                resourceType: 'herb',
                resourceLabel: 'Linh Thảo',
                ratePerHour: 6,
                maxCapacity: 30,
                accumulated: 9,
                assignedCompanion: null
            },
            {
                id: 'node_ore_mine',
                name: 'Linh Thạch Mỏ Quặng',
                subTitle: 'Địa Mạch Mỏ',
                icon: 'fa-solid fa-gem',
                color: 'text-amber-400',
                resourceType: 'stones',
                resourceLabel: 'Linh Thạch',
                ratePerHour: 1800,
                maxCapacity: 9000,
                accumulated: 3200,
                assignedCompanion: null
            },
            {
                id: 'node_fish_pond',
                name: 'Hàn Băng Linh Trì',
                subTitle: 'Ngưng Tụ Tiên Tuyền',
                icon: 'fa-solid fa-water',
                color: 'text-sky-400',
                resourceType: 'liquid',
                resourceLabel: 'Tẩy Tủy Dịch',
                ratePerHour: 4,
                maxCapacity: 20,
                accumulated: 6,
                assignedCompanion: null
            }
        ],
        activeNodeForDispatch: null
    };

    function initEstateSystem() {
        renderEstateNodes();
        updateEstateVaultShelf();
        // Cập nhật tích lũy định kỳ
        setInterval(accumulateEstateResources, 3000);
    }

    function renderEstateNodes() {
        const container = document.getElementById('estate-nodes-container');
        if (!container) return;

        let totalPending = 0;
        let html = '';

        ESTATE_DATA.nodes.forEach(node => {
            const pct = Math.min(100, Math.floor((node.accumulated / node.maxCapacity) * 100));
            const isFull = pct >= 100;
            const boost = node.assignedCompanion ? 1.5 : 1.0;
            const effectiveRate = Math.round(node.ratePerHour * boost);
            totalPending += Math.floor(node.accumulated);

            html += `
            <div class="estate-node-card ${isFull ? 'is-full-capacity' : ''}" id="estate-card-${node.id}">
                <div class="node-card-header">
                    <div class="flex items-center gap-3">
                        <div class="node-icon-box">
                            <i class="${node.icon} ${node.color} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="node-title">${node.name}</h3>
                            <span class="node-subtitle">${node.subTitle}</span>
                        </div>
                    </div>
                    <span class="node-rate-badge">
                        +${effectiveRate}/giờ ${node.assignedCompanion ? '⚡+50%' : ''}
                    </span>
                </div>

                <!-- THANH TÍCH LŨY -->
                <div class="space-y-1.5 my-3">
                    <div class="flex justify-between text-xs font-mono">
                        <span class="text-slate-400">Tích lũy ${node.resourceLabel}:</span>
                        <strong class="${isFull ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-200'}">
                            ${Math.floor(node.accumulated).toLocaleString()} / ${node.maxCapacity.toLocaleString()}
                        </strong>
                    </div>
                    <div class="capacity-progress-track">
                        <div class="capacity-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>

                <!-- ĐẠO LỮ TỌA TRẤN -->
                <div class="node-guardian-box" onclick="openDispatchModal('${node.id}')" title="Bấm để phái cử hoặc đổi Đạo Lữ cai quản">
                    <i class="fa-solid fa-user-shield text-amber-400 text-sm"></i>
                    <div class="guardian-info-text truncate">
                        ${node.assignedCompanion ? `Cai quản: <b class="text-amber-300">${node.assignedCompanion.name}</b> (+50% tốc độ)` : 'Chưa phái cử Đạo Lữ <span class="text-cyan-400 underline ml-1">Phái cử</span>'}
                    </div>
                </div>

                <!-- NÚT THU THẬP TỪNG ĐIỂM -->
                <button type="button" class="btn-node-claim" onclick="claimEstateResource('${node.id}')" ${node.accumulated <= 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-hand-holding-hand mr-1.5"></i>
                    Thu Hoạch (${Math.floor(node.accumulated).toLocaleString()} ${node.resourceLabel})
                </button>
            </div>`;
        });

        container.innerHTML = html;

        const totalEl = document.getElementById('total-pending-count');
        if (totalEl) totalEl.textContent = `${totalPending.toLocaleString()} đơn vị`;
    }

    function accumulateEstateResources() {
        ESTATE_DATA.nodes.forEach(node => {
            const boost = node.assignedCompanion ? 1.5 : 1.0;
            const ratePerSec = (node.ratePerHour * boost) / 3600;
            const gain = ratePerSec * 3 * (state.timeScale || 1);
            node.accumulated = Math.min(node.maxCapacity, node.accumulated + gain);
        });
        renderEstateNodes();
    }

    function updateEstateVaultShelf() {
        if (typeof state === 'undefined') return;
        const elStones = document.getElementById('player-linh-thach');
        if (elStones) elStones.textContent = (state.stones || 0).toLocaleString();

        const elTuVi = document.getElementById('player-tu-vi');
        if (elTuVi) elTuVi.textContent = (state.exp || 0).toLocaleString();

        const elHerbs = document.getElementById('player-herbs');
        if (elHerbs) {
            const herbsCount = (state.inventory || []).filter(i => (i.type === 'herb' || i.id?.includes('herb'))).length;
            elHerbs.textContent = herbsCount;
        }

        const elOres = document.getElementById('player-ores');
        if (elOres) {
            const oresCount = (state.inventory || []).filter(i => (i.type === 'ore' || i.id?.includes('ore'))).length;
            elOres.textContent = oresCount;
        }
    }

    window.claimEstateResource = function (nodeId) {
        const node = ESTATE_DATA.nodes.find(n => n.id === nodeId);
        if (!node || node.accumulated <= 0) return;

        const amount = Math.floor(node.accumulated);
        node.accumulated -= amount;

        // Bổ sung tài nguyên thật vào game
        if (node.resourceType === 'stones') {
            state.stones = (state.stones || 0) + amount;
        } else if (node.resourceType === 'exp') {
            if (typeof addExp === 'function') addExp(amount);
            else state.exp = (state.exp || 0) + amount;
        } else if (node.resourceType === 'herb') {
            if (!Array.isArray(state.inventory)) state.inventory = [];
            state.inventory.push({ id: 'herb_thai_at', name: 'Thái Ất Linh Thảo', type: 'herb', count: amount, quality: 'Hạ Phẩm' });
        } else if (node.resourceType === 'liquid') {
            if (!Array.isArray(state.inventory)) state.inventory = [];
            state.inventory.push({ id: 'item_tay_tuy_dich', name: 'Tẩy Tủy Dịch', type: 'pill', count: amount, quality: 'Trung Phẩm' });
        }

        if (typeof showFloatingText === 'function') {
            showFloatingText(`+${amount.toLocaleString()} ${node.resourceLabel}`, 'emerald');
        } else {
            showToastMessage(`Đã thu hoạch +${amount.toLocaleString()} ${node.resourceLabel}!`);
        }

        if (typeof updateHUD === 'function') updateHUD();
        renderEstateNodes();
        updateEstateVaultShelf();
    };

    window.claimAllEstateResources = function () {
        let claimedCount = 0;
        ESTATE_DATA.nodes.forEach(node => {
            if (node.accumulated > 0) {
                const amount = Math.floor(node.accumulated);
                node.accumulated -= amount;
                claimedCount += amount;

                if (node.resourceType === 'stones') {
                    state.stones = (state.stones || 0) + amount;
                } else if (node.resourceType === 'exp') {
                    if (typeof addExp === 'function') addExp(amount);
                    else state.exp = (state.exp || 0) + amount;
                } else {
                    if (!Array.isArray(state.inventory)) state.inventory = [];
                    state.inventory.push({ id: node.id + '_prod', name: node.resourceLabel, type: node.resourceType, count: amount });
                }
            }
        });

        if (claimedCount > 0) {
            showToastMessage(`Thu nạp thành công toàn bộ tài nguyên gia viên (+${claimedCount.toLocaleString()})!`);
            if (typeof updateHUD === 'function') updateHUD();
        } else {
            showToastMessage('Tất cả linh bồn đều trống rỗng, chưa có gì để thu hoạch.');
        }

        renderEstateNodes();
        updateEstateVaultShelf();
    };

    window.openDispatchModal = function (nodeId) {
        ESTATE_DATA.activeNodeForDispatch = nodeId;
        const modal = document.getElementById('dispatch-modal');
        if (!modal) return;

        const companionsListEl = document.getElementById('dispatch-companions-list');
        if (companionsListEl) {
            // Danh sách đạo lữ từ state hoặc mặc định
            const companions = (state.companions && state.companions.length > 0)
                ? state.companions
                : [
                    { id: 'lieu_nhu_yen', name: 'Liễu Như Yên', avatar: './assets/images/dao_lu_avatar.jpg', favor: 5, bonus: '+50% Linh Thảo & EXP' },
                    { id: 'tieu_ngoc', name: 'Bạch Thiển', avatar: './assets/images/pet_fox.jpg', favor: 4, bonus: '+50% Linh Thạch & Thần Thủy' }
                ];

            let html = '';
            companions.forEach(c => {
                html += `
                <div class="companion-choice-card" onclick="assignCompanionToActiveNode('${c.id}', '${c.name}')">
                    <img src="${c.avatar || './assets/images/dao_lu_avatar.jpg'}" class="companion-choice-avatar" alt="${c.name}">
                    <div>
                        <div class="font-bold text-slate-200 text-xs">${c.name}</div>
                        <div class="text-[10px] text-amber-300 font-mono">${c.bonus || 'Tọa trấn +50% sản lượng'}</div>
                    </div>
                    <button type="button" class="ml-auto px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs border border-amber-500/40 font-bold">
                        Bổ Nhiệm
                    </button>
                </div>`;
            });
            companionsListEl.innerHTML = html;
        }

        modal.classList.add('active');
    };

    window.closeDispatchModal = function (e) {
        if (e && e.target && e.target.id !== 'dispatch-modal') return;
        const modal = document.getElementById('dispatch-modal');
        if (modal) modal.classList.remove('active');
        ESTATE_DATA.activeNodeForDispatch = null;
    };

    window.assignCompanionToActiveNode = function (compId, compName) {
        const nodeId = ESTATE_DATA.activeNodeForDispatch;
        if (!nodeId) return;

        const targetNode = ESTATE_DATA.nodes.find(n => n.id === nodeId);
        if (targetNode) {
            targetNode.assignedCompanion = { id: compId, name: compName };
            showToastMessage(`Đã phái cử ${compName} tọa trấn cai quản ${targetNode.name}!`);
        }

        closeDispatchModal();
        renderEstateNodes();
    };

    window.unassignCompanionFromActiveNode = function () {
        const nodeId = ESTATE_DATA.activeNodeForDispatch;
        if (!nodeId) return;

        const targetNode = ESTATE_DATA.nodes.find(n => n.id === nodeId);
        if (targetNode) {
            targetNode.assignedCompanion = null;
            showToastMessage(`Đã gỡ bỏ người cai quản tại ${targetNode.name}.`);
        }

        closeDispatchModal();
        renderEstateNodes();
    };

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
        initEstateSystem();
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
        setInterval(() => {
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
        estateData: ESTATE_DATA,
        towerData: TOWER_BATTLER
    };

})(window);
