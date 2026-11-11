(function () {
    'use strict';
    /* ==========================================================================
       HỆ THỐNG TIÊN MÔN GIA VIÊN • ĐỘNG PHỦ (#modal-gia-vien)
       Module khép kín chuẩn SPA theo chỉ thị Bản Tôn
       ========================================================================== */
    const ESTATE_NODES = [
        {
            id: "node_spirit_tree",
            name: "Linh Căn Mộc",
            subTitle: "Tụ Linh Trận",
            icon: "fa-solid fa-tree",
            theme: "tuvi",
            level: 1,
            baseProductionRate: 120, // 120 Tu Vi / phút (= 2 Tu Vi / giây)
            capacity: 500,
            currentAmount: 180,
            resourceType: "tuvi",
            resourceName: "Tu Vi",
            resourceUnit: "điểm",
            upgradeBaseCost: 1500,
            assignedCompanionId: "companion_1", // Mặc định Liễu Như Yên cai quản
            description: "Hấp thu thiên địa thanh khí ngưng đọng thành nguyên khí tu vi thuần khiết."
        },
        {
            id: "node_herb_spring",
            name: "Dược Tuyền",
            subTitle: "Suối Linh Dịch",
            icon: "fa-solid fa-faucet-drip",
            theme: "herb",
            level: 1,
            baseProductionRate: 6, // 6 Linh Thảo / phút
            capacity: 40,
            currentAmount: 12,
            resourceType: "herb",
            resourceName: "Linh Thảo",
            resourceUnit: "bó",
            upgradeBaseCost: 1200,
            assignedCompanionId: null,
            description: "Mạch ngầm tụ dưỡng ngọc lộ linh tuyền, giúp dược thảo phát triển thần tốc."
        },
        {
            id: "node_mineral_cavern",
            name: "Khoáng Động",
            subTitle: "Địa Mạch Thần Khoáng",
            icon: "fa-solid fa-mountain",
            theme: "ore",
            level: 1,
            baseProductionRate: 6, // 6 Khoáng Thạch / phút
            capacity: 40,
            currentAmount: 8,
            resourceType: "ore",
            resourceName: "Khoáng Thạch",
            resourceUnit: "khối",
            upgradeBaseCost: 1200,
            assignedCompanionId: null,
            description: "Địa mạch cửu u kết tụ huyền thiết thạch anh, nguyên liệu cốt lõi rèn pháp khí."
        },
        {
            id: "node_money_treasury",
            name: "Tiền Trang",
            subTitle: "Tụ Tài Trận",
            icon: "fa-solid fa-vault",
            theme: "gold",
            level: 1,
            baseProductionRate: 60, // 60 Linh Thạch / phút
            capacity: 600,
            currentAmount: 240,
            resourceType: "gold",
            resourceName: "Linh Thạch",
            resourceUnit: "viên",
            upgradeBaseCost: 2000,
            assignedCompanionId: null,
            description: "Vận chuyển thiên địa bảo khí quy tụ bốn phương tài lộc về Động Phủ."
        }
    ];

    const COMPANIONS_LIST = [
        {
            id: "companion_1",
            name: "Liễu Như Yên",
            title: "Tiểu Sư Muội",
            avatar: "./assets/images/nu_tu_trong_suot.png",
            affectionLevel: 5, // Cấp 5 -> Tự động thu thập khi đầy bồn!
            bonusDesc: "+50% Tốc độ & Tự động thu thập khi đầy bồn"
        },
        {
            id: "companion_2",
            name: "Lãnh Nguyệt",
            title: "Ma Tông Thánh Nữ",
            avatar: "./assets/images/avatar_heart_demon.jpg",
            affectionLevel: 2,
            bonusDesc: "+50% Tốc độ sản xuất tài nguyên"
        },
        {
            id: "companion_3",
            name: "Hồ Mị Nhi",
            title: "Yêu Tộc Công Chúa",
            avatar: "./assets/images/pet_fox.jpg",
            affectionLevel: 3,
            bonusDesc: "+50% Tốc độ sản xuất tài nguyên"
        }
    ];

    // State người chơi đồng bộ với window.state
    const playerState = {
        _linhThach: 25000,
        _tuVi: 128500,
        herbs: 14,
        ores: 8,
        get linhThach() {
            if (window.state && typeof window.state.stones !== 'undefined') return window.state.stones;
            return this._linhThach;
        },
        set linhThach(val) {
            this._linhThach = val;
            if (window.state) {
                window.state.stones = val;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        },
        get tuVi() {
            if (window.state && typeof window.state.exp !== 'undefined') return window.state.exp;
            return this._tuVi;
        },
        set tuVi(val) {
            this._tuVi = val;
            if (window.state) {
                window.state.exp = val;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        }
    };

    let currentActiveDispatchNodeId = null;
    let estateIdleTimer = null;

    // VÒNG LẶP IDLE SẢN XUẤT (Chạy ngầm an toàn, không sinh nhiều timer)
    function runIdleProductionTick() {
        let hasAnyFull = false;

        const lieuNhuYen = COMPANIONS_LIST.find(c => c.id === 'companion_1');
        const hasAutoClaimPerk = lieuNhuYen && lieuNhuYen.affectionLevel >= 5;

        ESTATE_NODES.forEach(node => {
            const hasCompanion = Boolean(node.assignedCompanionId);
            const multiplier = hasCompanion ? 1.5 : 1.0;
            const ratePerSecond = (node.baseProductionRate / 60) * multiplier;

            if (node.currentAmount < node.capacity) {
                node.currentAmount = Math.min(node.capacity, node.currentAmount + ratePerSecond);
            }

            if (node.currentAmount >= node.capacity) {
                hasAnyFull = true;
            }
        });

        // Tự động thu thập nếu Liễu Như Yên đạt Cấp 5
        if (hasAutoClaimPerk && hasAnyFull) {
            claimAllEstateResources(true);
        }

        // Chỉ cập nhật DOM giao diện nếu Modal Gia Viên đang mở để tối ưu hiệu năng
        const modal = document.getElementById('modal-gia-vien');
        if (modal && modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
            updateEstateUI();
        }
    }

    function initEstateIdleLoop() {
        if (estateIdleTimer) clearInterval(estateIdleTimer);
        estateIdleTimer = setInterval(runIdleProductionTick, 1000);
    }

    function catchUpEstateProgress(seconds) {
        if (!seconds || seconds <= 0) return;
        const capped = Math.min(86400, seconds);
        const lieuNhuYen = COMPANIONS_LIST.find(c => c.id === 'companion_1');
        const hasAutoClaimPerk = lieuNhuYen && lieuNhuYen.affectionLevel >= 5;

        ESTATE_NODES.forEach(node => {
            const hasCompanion = Boolean(node.assignedCompanionId);
            const multiplier = hasCompanion ? 1.5 : 1.0;
            const ratePerSecond = (node.baseProductionRate / 60) * multiplier;
            const produced = ratePerSecond * capped;

            if (hasAutoClaimPerk) {
                const total = Math.floor(node.currentAmount + produced);
                if (total > 0) {
                    if (node.resourceType === 'tuVi') playerState.tuVi += total;
                    else if (node.resourceType === 'herbs') playerState.herbs += total;
                    else if (node.resourceType === 'ores') playerState.ores += total;
                    else if (node.resourceType === 'linhThach') playerState.linhThach += total;
                }
                node.currentAmount = 0;
            } else {
                node.currentAmount = Math.min(node.capacity, node.currentAmount + produced);
            }
        });

        const modal = document.getElementById('modal-gia-vien');
        if (modal && modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
            updateEstateUI();
        }
    }

    function getUpgradeCost(node) {
        return Math.round(node.upgradeBaseCost * Math.pow(1.65, node.level - 1));
    }

    function upgradeNode(nodeId) {
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const cost = getUpgradeCost(node);
        if (playerState.linhThach < cost) {
            showEstateToast(`⚠️ Không đủ Linh Thạch! Cần ${cost.toLocaleString()} Linh Thạch để nâng cấp.`);
            return;
        }

        playerState.linhThach -= cost;
        node.level += 1;
        node.baseProductionRate = Math.round(node.baseProductionRate * 1.45);
        node.capacity = Math.round(node.capacity * 1.5);

        showEstateToast(`✨ Chúc mừng! Đã nâng cấp [${node.name}] lên Cấp ${node.level}!`);
        updateEstateUI();
    }

    function addResourceToPlayer(type, amount) {
        switch (type) {
            case 'tuvi':
                playerState.tuVi += amount;
                if (typeof window.addExp === 'function' && window.state) {
                    // playerState.tuVi setter already updated window.state.exp
                }
                break;
            case 'herb':
                playerState.herbs += amount;
                if (window.alchemyPlayerState && window.alchemyPlayerState.materials) {
                    window.alchemyPlayerState.materials.herb_huysam = (window.alchemyPlayerState.materials.herb_huysam || 0) + amount;
                    window.alchemyPlayerState.materials.herb_linhchi = (window.alchemyPlayerState.materials.herb_linhchi || 0) + Math.max(1, Math.floor(amount / 2));
                }
                if (window.forgingPlayerState && window.forgingPlayerState.inventory) {
                    window.forgingPlayerState.inventory.herb_spirit = (window.forgingPlayerState.inventory.herb_spirit || 0) + Math.max(1, Math.floor(amount / 3));
                }
                if (typeof window.addItemToInventory === 'function') {
                    window.addItemToInventory({
                        id: 'herb_huysam',
                        name: 'Huyết Sâm Linh Thảo',
                        type: 'Material',
                        category: 'Material',
                        rarity: 'Common',
                        icon: '🌿',
                        desc: 'Linh thảo thu hoạch từ Dược Tuyền Gia Viên, dùng để luyện đan.'
                    }, amount);
                }
                break;
            case 'ore':
                playerState.ores += amount;
                if (window.forgingPlayerState && window.forgingPlayerState.inventory) {
                    window.forgingPlayerState.inventory.stone_ore = (window.forgingPlayerState.inventory.stone_ore || 0) + amount;
                }
                if (typeof window.addItemToInventory === 'function') {
                    window.addItemToInventory({
                        id: 'stone_ore',
                        name: 'Huyền Thiết Khoáng',
                        type: 'Material',
                        category: 'Material',
                        rarity: 'Uncommon',
                        icon: '⛏️',
                        desc: 'Khoáng thạch thu hoạch từ Khoáng Động Gia Viên, dùng để đúc pháp khí.'
                    }, amount);
                }
                break;
            case 'gold':
                playerState.linhThach += amount;
                break;
        }
        if (typeof window.saveGameState === 'function') window.saveGameState();
    }

    function spawnLootMagnetEffect(startRect, targetEl, iconChar = '💎', count = 8) {
        if (typeof document === 'undefined') return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (targetEl) {
                targetEl.classList.remove('currency-card-flash');
                void targetEl.offsetWidth;
                targetEl.classList.add('currency-card-flash');
            }
            return;
        }

        const startX = startRect ? (startRect.left + startRect.width / 2) : (window.innerWidth / 2);
        const startY = startRect ? (startRect.top + startRect.height / 2) : (window.innerHeight / 2);

        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 20, width: 40, height: 20 };
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        const particleCount = Math.min(12, Math.max(4, count));

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'loot-magnet-particle pointer-events-none fixed z-[999999] select-none text-sm';
            particle.textContent = iconChar;
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            particle.style.transform = `translate(-50%, -50%) scale(0.6)`;
            particle.style.opacity = '1';
            document.body.appendChild(particle);

            const duration = 500 + i * 40;
            const curveOffset = (Math.random() - 0.5) * 120;
            const startTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

            function flyStep(now) {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                const t = progress;
                const ctrlX = (startX + endX) / 2 + curveOffset;
                const ctrlY = Math.min(startY, endY) - 50 - Math.random() * 20;

                const curX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * ctrlX + Math.pow(t, 2) * endX;
                const curY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * ctrlY + Math.pow(t, 2) * endY;
                const scale = t < 0.2 ? (0.6 + t * 3) : (1.2 - (t - 0.2) * 0.5);

                particle.style.left = `${curX.toFixed(1)}px`;
                particle.style.top = `${curY.toFixed(1)}px`;
                particle.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)})`;

                if (progress < 1) {
                    requestAnimationFrame(flyStep);
                } else {
                    particle.remove();
                    if (i === particleCount - 1 && targetEl) {
                        targetEl.classList.remove('currency-card-flash');
                        void targetEl.offsetWidth;
                        targetEl.classList.add('currency-card-flash');
                        if (typeof window.playSound === 'function') {
                            window.playSound('ding');
                        }
                    }
                }
            }

            setTimeout(() => requestAnimationFrame(flyStep), i * 30);
        }
    }

    function getLootConfigForResourceType(resType) {
        const typeMap = {
            gold: { selector: '.vault-pill--gold', icon: '🪙' },
            spirit_stones: { selector: '.vault-pill--gold', icon: '🪙' },
            tu_vi: { selector: '.vault-pill--tuvi', icon: '⚡' },
            herb: { selector: '.vault-pill--herb', icon: '🌿' },
            ore: { selector: '.vault-pill--ore', icon: '💎' }
        };
        return typeMap[resType] || { selector: '.vault-pill--gold', icon: '💎' };
    }

    function claimSingleNode(nodeId) {
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const amountToClaim = Math.floor(node.currentAmount);
        if (amountToClaim <= 0) {
            showEstateToast(`Bồn chứa [${node.name}] chưa có đủ tài nguyên để thu thập!`);
            return;
        }

        // Trigger Loot Magnet visual effect
        const btnEl = document.querySelector(`[onclick*="claimSingleNode('${nodeId}')"]`);
        const cfg = getLootConfigForResourceType(node.resourceType);
        const targetPill = document.querySelector(cfg.selector);
        if (btnEl && targetPill) {
            spawnLootMagnetEffect(btnEl.getBoundingClientRect(), targetPill, cfg.icon, 8);
        }

        addResourceToPlayer(node.resourceType, amountToClaim);
        node.currentAmount -= amountToClaim;

        showEstateToast(`💎 Đã thu nạp +${amountToClaim.toLocaleString()} ${node.resourceName}!`);
        if (typeof window.addLog === 'function') {
            window.addLog(`🏡 <span class="text-emerald-300 font-bold">[Động Phủ Thu Nạp]</span> Đã thu hoạch <strong>+${amountToClaim.toLocaleString()} ${node.resourceName}</strong> từ ${node.name}!`, 'text-emerald-300');
        }
        updateEstateUI();
    }

    function claimAllEstateResources(isAuto = false) {
        let totalClaimed = 0;
        const summary = [];

        // Trigger Loot Magnet visual effects for all active nodes
        if (!isAuto) {
            const btnAll = document.getElementById('btn-claim-all');
            const startRect = btnAll ? btnAll.getBoundingClientRect() : null;
            ESTATE_NODES.forEach(n => {
                if (n.currentAmount > 0) {
                    const cfg = getLootConfigForResourceType(n.resourceType);
                    const targetPill = document.querySelector(cfg.selector);
                    if (targetPill) {
                        spawnLootMagnetEffect(startRect, targetPill, cfg.icon, 6);
                    }
                }
            });
        }

        ESTATE_NODES.forEach(node => {
            const amount = Math.floor(node.currentAmount);
            if (amount > 0) {
                addResourceToPlayer(node.resourceType, amount);
                node.currentAmount -= amount;
                totalClaimed += amount;
                summary.push(`+${amount.toLocaleString()} ${node.resourceName}`);
            }
        });

        if (totalClaimed <= 0) {
            if (!isAuto) showEstateToast(`Không có tài nguyên nào tích lũy để thu thập!`);
            return;
        }

        if (isAuto) {
            showEstateToast(`🌸 [Liễu Như Yên Tự Động Thu Hoạch]: ${summary.join(', ')}!`);
            if (typeof window.addLog === 'function') {
                window.addLog(`🌸 <span class="text-pink-300 font-bold">[Đạo Lữ Thu Hoạch]</span> Liễu Như Yên đã tự động thu gom toàn bộ sản lượng Động Phủ: ${summary.join(', ')}!`, 'text-pink-300');
            }
        } else {
            showEstateToast(`✨ Thu thập tất cả thành công: ${summary.join(', ')}!`);
            if (typeof window.addLog === 'function') {
                window.addLog(`🏡 <span class="text-emerald-300 font-bold">[Động Phủ Đại Thu Hoạch]</span> Đã thu gom toàn bộ sản vật 4 Linh Trận: <strong>${summary.join(', ')}</strong>!`, 'text-emerald-300');
            }
        }

        updateEstateUI();
    }

    // Modal Phái cử Đạo Lữ
    function openDispatchModal(nodeId) {
        currentActiveDispatchNodeId = nodeId;
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const titleEl = document.getElementById('dispatch-modal-title');
        if (titleEl) {
            titleEl.innerHTML = `<i class="fa-solid fa-user-shield text-amber-300"></i> Phái Cử: ${node.name}`;
        }

        const listContainer = document.getElementById('dispatch-companions-list');
        if (listContainer) {
            listContainer.innerHTML = COMPANIONS_LIST.map(comp => {
                const assignedNode = ESTATE_NODES.find(n => n.assignedCompanionId === comp.id);
                const isCurrentNode = node.assignedCompanionId === comp.id;

                return `
                    <div class="companion-select-item ${isCurrentNode ? 'is-selected' : ''}" onclick="assignCompanionToNode('${comp.id}')">
                        <div class="flex items-center gap-3">
                            <img src="${comp.avatar}" class="w-10 h-10 rounded-lg object-cover border border-pink-400" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">
                            <div>
                                <h4 class="font-bold text-xs text-slate-100 flex items-center gap-2">
                                    ${comp.name}
                                    ${isCurrentNode ? '<span class="text-[10px] text-amber-300 font-mono">[Đang Cai Quản]</span>' : ''}
                                </h4>
                                <span class="text-[11px] text-pink-300">${comp.title} • Hảo Cảm Cấp ${comp.affectionLevel}</span>
                                <span class="text-[10px] text-emerald-400 block">${comp.bonusDesc}</span>
                            </div>
                        </div>
                        <button type="button" class="px-3 py-1 rounded bg-sky-900/60 text-sky-200 border border-sky-500/40 text-xs font-bold cursor-pointer">
                            ${isCurrentNode ? 'Giữ Nguyên' : (assignedNode ? 'Chuyển Sang' : 'Bổ Nhiệm')}
                        </button>
                    </div>
                `;
            }).join('');
        }

        const dispatchModal = document.getElementById('dispatch-modal');
        if (dispatchModal) dispatchModal.classList.add('is-open');
    }

    function closeDispatchModal(e) {
        if (e && e.target && e.target !== document.getElementById('dispatch-modal')) return;
        const dispatchModal = document.getElementById('dispatch-modal');
        if (dispatchModal) dispatchModal.classList.remove('is-open');
    }

    function assignCompanionToNode(companionId) {
        if (!currentActiveDispatchNodeId) return;

        ESTATE_NODES.forEach(n => {
            if (n.assignedCompanionId === companionId) {
                n.assignedCompanionId = null;
            }
        });

        const node = ESTATE_NODES.find(n => n.id === currentActiveDispatchNodeId);
        if (node) {
            node.assignedCompanionId = companionId;
            const comp = COMPANIONS_LIST.find(c => c.id === companionId);
            showEstateToast(`👤 Đã bổ nhiệm [${comp?.name || 'Đạo Lữ'}] cai quản [${node.name}] (+50% tốc độ)!`);
        }

        closeDispatchModal();
        updateEstateUI();
    }

    function unassignCompanionFromActiveNode() {
        if (!currentActiveDispatchNodeId) return;
        const node = ESTATE_NODES.find(n => n.id === currentActiveDispatchNodeId);
        if (node) {
            node.assignedCompanionId = null;
            showEstateToast(`Đã thu hồi lệnh cai quản tại [${node.name}].`);
        }
        closeDispatchModal();
        updateEstateUI();
    }

    function updateEstateUI() {
        const linhThachEl = document.getElementById('player-linh-thach');
        const tuViEl = document.getElementById('player-tu-vi');
        const herbsEl = document.getElementById('player-herbs');
        const oresEl = document.getElementById('player-ores');

        if (linhThachEl) linhThachEl.textContent = playerState.linhThach.toLocaleString();
        if (tuViEl) tuViEl.textContent = playerState.tuVi.toLocaleString();
        if (herbsEl) herbsEl.textContent = playerState.herbs.toLocaleString();
        if (oresEl) oresEl.textContent = playerState.ores.toLocaleString();

        const lieuNhuYen = COMPANIONS_LIST.find(c => c.id === 'companion_1');
        const autoInd = document.getElementById('auto-claim-indicator');
        const autoText = document.getElementById('auto-claim-text');
        if (autoInd && autoText) {
            if (lieuNhuYen && lieuNhuYen.affectionLevel >= 5) {
                autoInd.classList.remove('is-disabled');
                autoText.innerHTML = `🌸 <b>Liễu Như Yên:</b> Đang tự động thu thập khi đầy bồn`;
            } else {
                autoInd.classList.add('is-disabled');
                autoText.textContent = `Liễu Như Yên: Cần Hảo Cảm Cấp 5 để mở Auto`;
            }
        }

        const container = document.getElementById('estate-nodes-container');
        if (!container) return;

        let totalPending = 0;

        container.innerHTML = ESTATE_NODES.map(node => {
            const isFull = node.currentAmount >= node.capacity;
            const pct = Math.min(100, Math.round((node.currentAmount / node.capacity) * 100));
            const upgradeCost = getUpgradeCost(node);
            const canUpgrade = playerState.linhThach >= upgradeCost;
            const canClaim = Math.floor(node.currentAmount) > 0;
            totalPending += Math.floor(node.currentAmount);

            const assignedComp = COMPANIONS_LIST.find(c => c.id === node.assignedCompanionId);
            const hasCompanion = Boolean(assignedComp);
            const multiplier = hasCompanion ? 1.5 : 1.0;
            const effectiveRate = Math.round(node.baseProductionRate * multiplier);

            return `
                <article class="node-card ${isFull ? 'is-full' : ''}" id="card-${node.id}">
                    <div class="node-card-header">
                        <div class="node-meta">
                            <div class="node-icon-frame node-icon-frame--${node.theme}">
                                <i class="${node.icon}"></i>
                            </div>
                            <div class="node-title-group">
                                <h3>${node.name}</h3>
                                <span>${node.subTitle}</span>
                            </div>
                        </div>
                        <span class="node-level-badge">Cấp ${node.level}</span>
                    </div>

                    <div class="node-card-body">
                        <div class="storage-status-block">
                            <div class="storage-header">
                                <span class="storage-label">
                                    <i class="fa-solid fa-box-archive"></i> Bồn Chứa:
                                </span>
                                <span class="storage-numbers ${isFull ? 'is-maxed' : ''}">
                                    ${Math.floor(node.currentAmount).toLocaleString()} / ${node.capacity.toLocaleString()} ${node.resourceUnit}
                                    ${isFull ? '(ĐẦY)' : ''}
                                </span>
                            </div>
                            <div class="storage-track">
                                <div class="storage-fill storage-fill--${node.theme} ${isFull ? 'is-maxed' : ''}" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <div class="rate-and-dispatch-row">
                            <div class="production-rate-info">
                                <span class="rate-title">Sản lượng:</span>
                                <span class="rate-value">
                                    +${effectiveRate} / phút
                                    ${hasCompanion ? '<span class="rate-bonus-tag">+50%</span>' : ''}
                                </span>
                            </div>

                            <div class="dispatch-slot-box" onclick="openDispatchModal('${node.id}')" title="Bấm để cử Đạo Lữ tọa trấn">
                                ${hasCompanion 
                                    ? `<img src="${assignedComp.avatar}" alt="${assignedComp.name}" class="dispatch-avatar" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">`
                                    : `<div class="dispatch-placeholder"><i class="fa-solid fa-plus"></i></div>`
                                }
                                <div class="dispatch-label-col">
                                    <span>Phái cử</span>
                                    <span>${hasCompanion ? assignedComp.name : 'Trống (+50%)'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="node-card-footer">
                        <button type="button" class="btn-node-action btn-claim cursor-pointer" ${canClaim ? '' : 'disabled'} onclick="claimSingleNode('${node.id}')">
                            <i class="fa-solid fa-hand-holding"></i> Thu Nạp
                        </button>
                        <button type="button" class="btn-node-action btn-upgrade cursor-pointer" ${canUpgrade ? '' : 'disabled'} onclick="upgradeNode('${node.id}')" title="Cần ${upgradeCost.toLocaleString()} Linh Thạch">
                            <i class="fa-solid fa-arrow-up-right-dots"></i> Cấp ${node.level + 1} (${upgradeCost.toLocaleString()})
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        const totalPendingEl = document.getElementById('total-pending-count');
        const btnClaimAll = document.getElementById('btn-claim-all');
        if (totalPendingEl) totalPendingEl.textContent = `${totalPending.toLocaleString()} món tài nguyên`;
        if (btnClaimAll) btnClaimAll.disabled = totalPending <= 0;
    }

    let toastTimer = null;
    function showEstateToast(msg) {
        const toast = document.getElementById('estate-toast-bubble') || document.getElementById('toast-bubble');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('is-active');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('is-active');
        }, 2600);
    }

    function openGiaVienModal() {
        if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
        if (typeof closeAllDropups === 'function') closeAllDropups();
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        const modal = document.getElementById('modal-gia-vien');
        if (modal) {
            modal.style.setProperty('display', 'block', 'important');
            modal.style.setProperty('pointer-events', 'auto', 'important');
            modal.classList.remove('hidden');
            modal.classList.add('active');
            updateEstateUI();
        }
    }

    function closeGiaVienModal() {
        const modal = document.getElementById('modal-gia-vien');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.style.setProperty('pointer-events', 'none', 'important');
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    
    window.openGiaVienModal = openGiaVienModal;
    window.closeGiaVienModal = closeGiaVienModal;
    window.upgradeNode = upgradeNode;
    window.claimSingleNode = claimSingleNode;
    window.claimAllEstateResources = claimAllEstateResources;
    window.openDispatchModal = openDispatchModal;
    window.closeDispatchModal = closeDispatchModal;
    window.assignCompanionToNode = assignCompanionToNode;
    window.unassignCompanionFromActiveNode = unassignCompanionFromActiveNode;
    window.updateEstateUI = updateEstateUI;
    window.showToast = showEstateToast;
    window.ESTATE_NODES = ESTATE_NODES;
    window.COMPANIONS_LIST = COMPANIONS_LIST;
    globalThis.openGiaVienModal = openGiaVienModal;
    globalThis.closeGiaVienModal = closeGiaVienModal;
    globalThis.upgradeNode = upgradeNode;
    globalThis.claimSingleNode = claimSingleNode;
    globalThis.claimAllEstateResources = claimAllEstateResources;
    globalThis.openDispatchModal = openDispatchModal;
    globalThis.closeDispatchModal = closeDispatchModal;
    globalThis.assignCompanionToNode = assignCompanionToNode;
    globalThis.unassignCompanionFromActiveNode = unassignCompanionFromActiveNode;
    globalThis.updateEstateUI = updateEstateUI;
    globalThis.showToast = showEstateToast;
    globalThis.ESTATE_NODES = ESTATE_NODES;
    globalThis.COMPANIONS_LIST = COMPANIONS_LIST;
    window.initEstateIdleLoop = initEstateIdleLoop;
    window.catchUpEstateProgress = catchUpEstateProgress;
    globalThis.catchUpEstateProgress = catchUpEstateProgress;
})();
