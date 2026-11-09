/**
 * ============================================================================
 * VẤN THIÊN LỤC — MASTER INTEGRATED ROOMS SYSTEM (js/integrated_rooms.js)
 * ============================================================================
 * Hợp nhất 4 hệ thống demo đỉnh cao vào kiến trúc SPA chính:
 * 1. Luyện Khí Thất (Forging Room)  -> #dp-luyen-khi
 * 2. Luyện Đan Phòng (Alchemy Room)  -> #dp-luyen-dan
 * 3. Khuê Phòng Đạo Lữ (Companion)   -> #dp-khue-phong
 * 4. Trấn Yêu Tháp Battler (Arena)   -> #demon-tower-modal
 *
 * Đồng bộ 100% với biến toàn cục game:
 * window.state (stones, inventory, danDoc, towerFloor, currentHp, maxHp, atk, def, crit, dodge)
 * addExp(), updateHUD(), saveGameState(), addLog(), getCombatPower()
 */

(function (window, document) {
    'use strict';

    let roomCraftTimer = null;
    let roomAlchTimer = null;

    // =========================================================================
    // 0. COMMON GAME STATE BRIDGE & HELPERS
    // =========================================================================
    function getGameState() {
        return window.state || {};
    }

    function getInvCount(key) {
        if (!window.state || !Array.isArray(window.state.inventory)) return 0;
        const item = window.state.inventory.find(i => i.id === key || i.key === key || (i.name && i.name.toLowerCase() === key.toLowerCase()));
        return item ? (Number(item.count) || 1) : 0;
    }
    window.getInvCount = getInvCount;

    function deductInvItem(key, qty) {
        if (!window.state || !Array.isArray(window.state.inventory)) return false;
        const item = window.state.inventory.find(i => i.id === key || i.key === key || (i.name && i.name.toLowerCase() === key.toLowerCase()));
        if (!item || (item.count || 1) < qty) return false;
        item.count = (Number(item.count) || 1) - qty;
        if (item.count <= 0) {
            window.state.inventory = window.state.inventory.filter(i => i !== item);
        }
        return true;
    }
    window.deductInvItem = deductInvItem;

    function addInvItem(itemObj) {
        if (!window.state) return;
        if (!Array.isArray(window.state.inventory)) window.state.inventory = [];
        const existing = window.state.inventory.find(i => i.id === itemObj.id);
        if (existing) {
            existing.count = (Number(existing.count) || 1) + (Number(itemObj.count) || 1);
        } else {
            window.state.inventory.push({ ...itemObj, count: itemObj.count || 1 });
        }
        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();
    }
    window.addInvItem = addInvItem;

    function getPlayerRealmName() {
        if (typeof window.getRealmTitle === 'function') {
            return window.getRealmTitle();
        }
        if (window.state && typeof window.state.realmIndex === 'number') {
            const names = ["Luyện Khí Tầng 1", "Luyện Khí Tầng 2", "Luyện Khí Tầng 3", "Luyện Khí Tầng 4", "Luyện Khí Tầng 5", "Luyện Khí Tầng 6", "Luyện Khí Tầng 7", "Luyện Khí Tầng 8", "Luyện Khí Tầng 9", "Luyện Khí Đỉnh Phong", "Trúc Cơ Sơ Kỳ"];
            return names[window.state.realmIndex] || ("Cảnh Giới Tầng " + window.state.realmIndex);
        }
        return "Luyện Khí Kỳ";
    }

    // =========================================================================
    // 1. LUYỆN KHÍ THẤT (FORGING ROOM MODULE)
    // =========================================================================
    const CRAFTING_RECIPES = [
        {
            id: "wp_thanh_truc_kiem",
            name: "Thanh Trúc Kiếm",
            type: "Vũ Khí",
            slot: "weapon",
            icon: "fa-khanda",
            reqRealmName: "Luyện Khí Tầng 3",
            reqRealmIndex: 2,
            materials: [
                { key: "stone_ore", name: "Huyền Thiết", qty: 5, icon: "fa-cubes" },
                { key: "stone_ore", name: "Linh Thạch", qty: 100, icon: "fa-gem" }
            ],
            baseQualityRates: { ha: 0.15, trung: 0.55, thuong: 0.25, cuc: 0.05 },
            stats: { atk: 120, crit: 5 },
            desc: "Trảm phong kiếm đúc từ thanh trúc ngàn năm kết hợp huyền thiết tinh xảo."
        },
        {
            id: "ar_hac_ngoc_bao",
            name: "Hắc Ngọc Đạo Bào",
            type: "Phòng Cụ",
            slot: "armor",
            icon: "fa-shield-halved",
            reqRealmName: "Luyện Khí Tầng 5",
            reqRealmIndex: 4,
            materials: [
                { key: "stone_ore", name: "Huyền Thiết", qty: 12, icon: "fa-cubes" },
                { key: "herb_spirit", name: "Tử Linh Chi", qty: 4, icon: "fa-leaf" }
            ],
            baseQualityRates: { ha: 0.10, trung: 0.50, thuong: 0.30, cuc: 0.10 },
            stats: { hp: 1200, def: 85 },
            desc: "Đạo bào hộ thân luyện chế từ huyền thiết kết hợp linh dịch tơ tằm, cản đao thương bất nhập."
        },
        {
            id: "wp_cuu_long_tram_tien",
            name: "Cửu Long Trảm Tiên Đao",
            type: "Vũ Khí",
            slot: "weapon",
            icon: "fa-khanda",
            reqRealmName: "Trúc Cơ Sơ Kỳ",
            reqRealmIndex: 10,
            materials: [
                { key: "stone_ore", name: "Huyền Thiết", qty: 40, icon: "fa-cubes" },
                { key: "herb_spirit", name: "Tử Linh Chi", qty: 15, icon: "fa-leaf" },
                { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 8, icon: "fa-seedling" }
            ],
            baseQualityRates: { ha: 0.05, trung: 0.35, thuong: 0.45, cuc: 0.15 },
            stats: { atk: 580, crit: 15, lifesteal: 6 },
            desc: "Bá đạo chi khí bao phủ thân đao, chém đứt hư không, ẩn chứa long uy cuồng bạo."
        },
        {
            id: "ar_huyen_vu_giap",
            name: "Huyền Vũ Trọng Khải",
            type: "Phòng Cụ",
            slot: "armor",
            icon: "fa-shield-halved",
            reqRealmName: "Trúc Cơ Sơ Kỳ",
            reqRealmIndex: 10,
            materials: [
                { key: "stone_ore", name: "Huyền Thiết", qty: 50, icon: "fa-cubes" },
                { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 12, icon: "fa-seedling" }
            ],
            baseQualityRates: { ha: 0.05, trung: 0.35, thuong: 0.45, cuc: 0.15 },
            stats: { hp: 3500, def: 320, block: 10 },
            desc: "Giáp nặng khắc họa phù văn thần thú Huyền Vũ, phòng ngự vững như bàn thạch."
        }
    ];

    const QUALITY_CONFIG = {
        ha: { label: "HẠ PHẨM", color: "#94a3b8", badgeClass: "bg-slate-700 text-slate-200 border-slate-500", mult: 0.8 },
        trung: { label: "TRUNG PHẨM", color: "#38bdf8", badgeClass: "bg-sky-950 text-sky-300 border-sky-500", mult: 1.0 },
        thuong: { label: "THƯỢNG PHẨM", color: "#c084fc", badgeClass: "bg-purple-950 text-purple-300 border-purple-500", mult: 1.35 },
        cuc: { label: "CỰC PHẨM", color: "#fbbf24", badgeClass: "bg-amber-950 text-amber-300 border-amber-500", mult: 1.8 }
    };

    let isCrafting = false;
    let craftedBag = [];

    function rollCraftingQuality(recipe) {
        const rnd = Math.random();
        const r = recipe.baseQualityRates;
        if (rnd < r.ha) return "ha";
        if (rnd < r.ha + r.trung) return "trung";
        if (rnd < r.ha + r.trung + r.thuong) return "thuong";
        return "cuc";
    }

    function updateForgingTopBarUI() {
        const stonesEl = document.getElementById('display-stones');
        const huyenThietEl = document.getElementById('display-huyen-thiet');
        const linhChiEl = document.getElementById('display-linh-chi');
        const ngocSamEl = document.getElementById('display-ngoc-sam');
        const realmSelect = document.getElementById('player-realm-select');

        if (stonesEl) stonesEl.textContent = (window.state?.stones || 0).toLocaleString();
        if (huyenThietEl) huyenThietEl.textContent = getInvCount('stone_ore').toLocaleString();
        if (linhChiEl) linhChiEl.textContent = getInvCount('herb_spirit').toLocaleString();
        if (ngocSamEl) ngocSamEl.textContent = getInvCount('herb_blood').toLocaleString();
        if (realmSelect && window.state && typeof window.state.realmIndex === 'number') {
            realmSelect.value = window.state.realmIndex;
        }
    }
    window.updateTopBarUI = updateForgingTopBarUI;

    function renderBlueprints() {
        const listEl = document.getElementById('blueprints-list');
        if (!listEl) return;
        const currentRealm = window.state?.realmIndex || 0;

        listEl.innerHTML = CRAFTING_RECIPES.map(recipe => {
            const isUnlocked = currentRealm >= recipe.reqRealmIndex;
            let canCraft = isUnlocked;

            const matCheckHtml = recipe.materials.map(mat => {
                const owned = getInvCount(mat.key);
                const hasEnough = owned >= mat.qty;
                if (!hasEnough) canCraft = false;

                return `
                    <div class="blueprint-mat-pill ${hasEnough ? 'blueprint-mat-pill--ready' : 'blueprint-mat-pill--missing'}">
                        <i class="fa-solid ${mat.icon} text-[10px]"></i>
                        <span>${mat.name}:</span>
                        <b>${owned}/${mat.qty}</b>
                    </div>
                `;
            }).join('');

            const btnLabel = isCrafting ? "Lò Đang Đỏ..." : (!isUnlocked ? "Chưa Mở Khóa" : (canCraft ? "Khai Đỉnh Tôi Luyện" : "Thiếu Vật Liệu"));
            const btnIcon = isCrafting ? "fa-spinner fa-spin" : (!isUnlocked ? "fa-lock" : (canCraft ? "fa-fire" : "fa-ban"));

            return `
                <article class="blueprint-card ${isUnlocked ? '' : 'blueprint-card--locked'}">
                    <div class="blueprint-card-head">
                        <div class="blueprint-item-meta">
                            <div class="blueprint-item-icon">
                                <i class="fa-solid ${recipe.icon}"></i>
                            </div>
                            <div>
                                <h3 class="blueprint-item-name">${recipe.name}</h3>
                                <div class="blueprint-item-type">${recipe.type} • Yêu cầu: ${recipe.reqRealmName}</div>
                            </div>
                        </div>
                        <span class="blueprint-status-tag ${isUnlocked ? 'text-amber-400' : 'text-slate-500'}">
                            ${isUnlocked ? '<i class="fa-solid fa-circle-check"></i> Khả Luyện' : '<i class="fa-solid fa-lock"></i> Bế Môn'}
                        </span>
                    </div>

                    <p class="blueprint-desc">${recipe.desc}</p>
                    <div class="blueprint-mats-shelf">${matCheckHtml}</div>

                    <div class="blueprint-card-foot">
                        <div class="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                            <span>Phẩm: Hạ (15%) - Cực (5%)</span>
                        </div>
                        <button type="button" class="btn-forge" onclick="startCrafting('${recipe.id}')" ${canCraft && !isCrafting ? '' : 'disabled'}>
                            <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }
    window.renderBlueprints = renderBlueprints;

    function startCrafting(recipeId) {
        if (isCrafting) return;
        const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;

        // Check materials
        for (const mat of recipe.materials) {
            if (getInvCount(mat.key) < mat.qty) {
                if (typeof window.addLog === 'function') window.addLog(`⚠️ Không đủ ${mat.name} để đúc ${recipe.name}!`, 'text-rose-400');
                return;
            }
        }

        // Deduct materials
        for (const mat of recipe.materials) {
            deductInvItem(mat.key, mat.qty);
        }

        isCrafting = true;
        updateForgingTopBarUI();
        renderBlueprints();

        // Update UI furnace status
        const statusBadge = document.getElementById('furnace-status-badge');
        const statusText = document.getElementById('furnace-status-text');
        const statusIcon = document.getElementById('furnace-status-icon');
        const chamber = document.getElementById('furnace-chamber');
        const progressBox = document.getElementById('crafting-progress-box');
        const activeName = document.getElementById('crafting-active-name');
        const timerText = document.getElementById('crafting-timer-text');
        const progressFill = document.getElementById('crafting-progress-fill');
        const percentText = document.getElementById('crafting-percent-text');

        if (statusBadge) statusBadge.className = 'status-tag status-tag--active';
        if (statusText) statusText.textContent = 'Đang Nung Chảy & Quai Búa';
        if (statusIcon) statusIcon.className = 'fa-solid fa-spinner fa-spin text-amber-400';
        if (chamber) chamber.classList.add('is-crafting');
        if (progressBox) progressBox.classList.remove('hidden');
        if (activeName) activeName.textContent = recipe.name;

        let elapsedMs = 0;
        const totalDurationMs = 2000;
        const intervalStepMs = 50;

        if (roomCraftTimer) {
            clearInterval(roomCraftTimer);
            roomCraftTimer = null;
        }

        roomCraftTimer = setInterval(() => {
            elapsedMs += intervalStepMs;
            const progress = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
            const remainSec = Math.max(0, ((totalDurationMs - elapsedMs) / 1000)).toFixed(1);

            if (progressFill) progressFill.style.width = `${progress}%`;
            if (percentText) percentText.textContent = `${progress}%`;
            if (timerText) timerText.textContent = `${remainSec}s`;

            if (elapsedMs >= totalDurationMs) {
                clearInterval(roomCraftTimer);
                roomCraftTimer = null;
                finishCrafting(recipe);
            }
        }, intervalStepMs);
    }
    window.startCrafting = startCrafting;

    function finishCrafting(recipe) {
        isCrafting = false;
        const qualityKey = rollCraftingQuality(recipe);
        const qualityInfo = QUALITY_CONFIG[qualityKey];
        const mult = qualityInfo.mult;

        const mainStatKey = recipe.slot === "weapon" ? "atk" : "hp";
        const baseVal = recipe.stats[mainStatKey];
        const finalVal = Math.round(baseVal * mult);

        const craftedItem = {
            id: `crafted_${recipe.id}_${Date.now()}`,
            name: recipe.name,
            slot: recipe.slot,
            type: recipe.type,
            qualityKey: qualityKey,
            qualityLabel: qualityInfo.label,
            badgeClass: qualityInfo.badgeClass,
            color: qualityInfo.color,
            mainStatName: mainStatKey === "atk" ? "Công Kích" : "Khí Huyết",
            mainStatVal: finalVal,
            subStat: qualityKey === "cuc" ? "Đặc kỹ: Thần Binh Xuất Thế (+10% Sát Thương Bạo)" : null,
            icon: recipe.icon,
            desc: recipe.desc,
            count: 1
        };

        craftedBag.unshift(craftedItem);
        addInvItem(craftedItem);

        // Reset furnace UI
        const statusBadge = document.getElementById('furnace-status-badge');
        const statusText = document.getElementById('furnace-status-text');
        const statusIcon = document.getElementById('furnace-status-icon');
        const chamber = document.getElementById('furnace-chamber');
        const progressBox = document.getElementById('crafting-progress-box');

        if (statusBadge) statusBadge.className = 'status-tag status-tag--ready';
        if (statusText) statusText.textContent = 'Lò Đan Đã Sẵn Sàng';
        if (statusIcon) statusIcon.className = 'fa-solid fa-circle-check text-emerald-400';
        if (chamber) chamber.classList.remove('is-crafting');
        if (progressBox) progressBox.classList.add('hidden');

        updateForgingTopBarUI();
        renderBlueprints();
        renderRecentItemsShelf();
        openCraftingResultModal(craftedItem);

        if (typeof window.addLog === 'function') {
            window.addLog(`🔨 <span class="text-amber-400 font-bold">[Luyện Khí Thất]</span> Đúc thành công <strong>${craftedItem.name}</strong> (${qualityInfo.label})!`, 'text-amber-300');
        }
    }

    function openCraftingResultModal(item) {
        const overlay = document.getElementById('crafting-modal-overlay');
        const badge = document.getElementById('modal-quality-badge');
        const nameEl = document.getElementById('modal-item-name');
        const descEl = document.getElementById('modal-item-desc');
        const statVal = document.getElementById('modal-stat-val-1');
        const iconEl = document.getElementById('modal-item-icon');
        const subBox = document.getElementById('modal-substat-container');
        const subText = document.getElementById('modal-substat-text');

        if (!overlay) return;
        if (badge) {
            badge.textContent = item.qualityLabel;
            badge.className = `result-badge ${item.badgeClass}`;
        }
        if (nameEl) {
            nameEl.textContent = item.name;
            nameEl.style.color = item.color;
        }
        if (descEl) descEl.textContent = item.desc;
        if (statVal) statVal.textContent = `+${item.mainStatVal.toLocaleString()}`;
        if (iconEl) iconEl.className = `fa-solid ${item.icon}`;

        if (item.subStat && subBox && subText) {
            subBox.classList.remove('hidden');
            subText.textContent = item.subStat;
        } else if (subBox) {
            subBox.classList.add('hidden');
        }

        overlay.classList.add('is-open');
    }
    window.openCraftingResultModal = openCraftingResultModal;

    function closeCraftingModal() {
        const overlay = document.getElementById('crafting-modal-overlay');
        if (overlay) overlay.classList.remove('is-open');
    }
    window.closeCraftingModal = closeCraftingModal;

    function renderRecentItemsShelf() {
        const shelf = document.getElementById('recent-items-container');
        if (!shelf) return;
        if (craftedBag.length === 0) {
            shelf.innerHTML = '<span class="text-xs text-slate-500 italic py-2">Chưa đúc trang bị nào...</span>';
            return;
        }
        shelf.innerHTML = craftedBag.slice(0, 8).map(item => `
            <div class="crafted-item-pill">
                <i class="fa-solid ${item.icon}" style="color: ${item.color}"></i>
                <span class="text-slate-200">${item.name}</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeClass}">${item.qualityLabel}</span>
            </div>
        `).join('');
    }
    window.renderRecentItemsShelf = renderRecentItemsShelf;

    function addTestResource(key, amt) {
        if (key === 'stones') {
            window.state.stones = (window.state.stones || 0) + amt;
        } else {
            addInvItem({ id: key, name: key, count: amt, type: 'Khoáng Thạch', rarity: 1 });
        }
        updateForgingTopBarUI();
        renderBlueprints();
    }
    window.addTestResource = addTestResource;

    function changeTestRealm(val) {
        if (window.state) window.state.realmIndex = parseInt(val, 10);
        updateForgingTopBarUI();
        renderBlueprints();
    }
    window.changeTestRealm = changeTestRealm;

    function renderIntegratedForgingRoom() {
        updateForgingTopBarUI();
        renderBlueprints();
        renderRecentItemsShelf();
    }
    window.renderIntegratedForgingRoom = renderIntegratedForgingRoom;

    // =========================================================================
    // 2. LUYỆN ĐAN PHÒNG (ALCHEMY ROOM MODULE)
    // =========================================================================
    const HERBS_DATA = {
        herb_huysam: { id: "herb_huysam", name: "Huyết Sâm", tier: 1, icon: "fa-seedling", color: "text-rose-400" },
        herb_linhchi: { id: "herb_linhchi", name: "Bách Niên Linh Chi", tier: 2, icon: "fa-leaf", color: "text-emerald-400" },
        herb_tinhthuy: { id: "herb_tinhthuy", name: "Linh Tuyền Tinh Thủy", tier: 1, icon: "fa-droplet", color: "text-cyan-400" },
        herb_yeudan: { id: "herb_yeudan", name: "Yêu Thú Nội Đan", tier: 3, icon: "fa-circle-dot", color: "text-purple-400" }
    };

    const RECIPES_DATA = [
        {
            id: "recipe_hoihuyet",
            name: "Hồi Huyết Đan",
            grade: "Phàm Đan",
            gradeColor: "text-slate-200",
            gradeBadge: "bg-slate-800 text-slate-300 border-slate-600",
            icon: "fa-prescription-bottle",
            reqLevel: 1,
            materials: [
                { key: "herb_huysam", name: "Huyết Sâm", qty: 2 },
                { key: "herb_tinhthuy", name: "Tinh Thủy", qty: 1 }
            ],
            danDocGain: 4,
            baseSuccess: 0.85,
            desc: "Phục hồi 2.000 Khí Huyết tức thì trong chiến đấu.",
            healAmount: 2000
        },
        {
            id: "recipe_tu_khi",
            name: "Tụ Khí Đan",
            grade: "Linh Đan",
            gradeColor: "text-emerald-300",
            gradeBadge: "bg-emerald-950 text-emerald-300 border-emerald-600",
            icon: "fa-cubes-stacked",
            reqLevel: 1,
            materials: [
                { key: "herb_linhchi", name: "Bách Niên Linh Chi", qty: 2 },
                { key: "herb_tinhthuy", name: "Tinh Thủy", qty: 2 }
            ],
            danDocGain: 8,
            baseSuccess: 0.75,
            desc: "Tăng trực tiếp 500 Tu Vi cho cảnh giới Luyện Khí Kỳ.",
            expGain: 500
        },
        {
            id: "recipe_truc_co",
            name: "Trúc Cơ Đan",
            grade: "Bảo Đan",
            gradeColor: "text-amber-300",
            gradeBadge: "bg-amber-950 text-amber-300 border-amber-500",
            icon: "fa-fire-burner",
            reqLevel: 2,
            materials: [
                { key: "herb_huysam", name: "Huyết Sâm", qty: 5 },
                { key: "herb_linhchi", name: "Bách Niên Linh Chi", qty: 5 },
                { key: "herb_yeudan", name: "Yêu Đan", qty: 1 }
            ],
            danDocGain: 15,
            baseSuccess: 0.60,
            desc: "Tăng +25% tỷ lệ độ kiếp Trúc Cơ thành công và 2.500 Tu Vi.",
            expGain: 2500
        },
        {
            id: "recipe_hoa_than",
            name: "Hóa Thần Cửu Chuyển Đan",
            grade: "Thần Đan",
            gradeColor: "text-rose-400",
            gradeBadge: "bg-rose-950 text-rose-300 border-rose-600",
            icon: "fa-dragon",
            reqLevel: 3,
            materials: [
                { key: "herb_huysam", name: "Huyết Sâm", qty: 20 },
                { key: "herb_linhchi", name: "Bách Niên Linh Chi", qty: 20 },
                { key: "herb_yeudan", name: "Yêu Đan", qty: 5 }
            ],
            danDocGain: 25,
            baseSuccess: 0.40,
            desc: "Hấp thu thiên địa đạo vận, đột phá đại bình cảnh Hóa Thần Kỳ.",
            expGain: 10000
        }
    ];

    const CAULDRONS_DATA = {
        cauldron_1: { id: "cauldron_1", name: "Thanh Đồng Đỉnh", successBonus: 0, speedBonus: 0, buffDesc: "Lò đan sơ cấp, độ ổn định bình thường" },
        cauldron_2: { id: "cauldron_2", name: "Thanh Mộc Đỉnh", successBonus: 0.08, speedBonus: 0.15, buffDesc: "+8% Thành Công, +15% Tốc Độ" },
        cauldron_3: { id: "cauldron_3", name: "Bát Quái Cửu Chuyển Đỉnh", successBonus: 0.18, speedBonus: 0.30, buffDesc: "+18% Thành Công, +30% Tốc Độ" }
    };

    const FIRES_DATA = {
        fire_normal: { id: "fire_normal", name: "Phàm Hỏa", rateBonus: 0, desc: "Lửa củi phàm trần" },
        fire_lotus: { id: "fire_lotus", name: "Thanh Liên Địa Tâm Hỏa", rateBonus: 0.12, desc: "+12% Tỷ Lệ Đan Phẩm Cao" },
        fire_nine: { id: "fire_nine", name: "Cửu U Kim Tổ Hỏa", rateBonus: 0.25, desc: "+25% Đan Phẩm Cao, Bỏ Qua Đan Độc" }
    };

    let activeCauldronId = "cauldron_2";
    let activeFireId = "fire_lotus";
    let isAlchemyBrewing = false;
    let recentPillsBag = [];

    function updateAlchemyHeaderUI() {
        const poisonLevelText = document.getElementById('poison-level-text');
        const poisonFill = document.getElementById('poison-fill');
        const poisonStatusHint = document.getElementById('poison-status-hint');

        const curPoison = Number(window.state?.danDoc) || 0;
        if (poisonLevelText) poisonLevelText.textContent = `${curPoison} / 100`;
        if (poisonFill) {
            poisonFill.style.width = `${Math.min(100, curPoison)}%`;
            poisonFill.className = curPoison >= 70 ? 'poison-meter-fill bg-rose-500' : 'poison-meter-fill bg-emerald-500';
        }
        if (poisonStatusHint) {
            poisonStatusHint.textContent = curPoison >= 70 ? '⚠️ Kinh Mạch Tắc Nghẽn! Hãy Uống Thanh Tâm Đan!' : 'Thanh Tịnh Không Nhiễm';
        }

        const cntHuySam = document.getElementById('cnt-huysam');
        const cntLinhChi = document.getElementById('cnt-linhchi');
        const cntTinhThuy = document.getElementById('cnt-tinhthuy');
        const cntYeuDan = document.getElementById('cnt-yeudan');

        if (cntHuySam) cntHuySam.textContent = (getInvCount('herb_huysam') + getInvCount('herb_blood')).toLocaleString();
        if (cntLinhChi) cntLinhChi.textContent = (getInvCount('herb_linhchi') + getInvCount('herb_spirit')).toLocaleString();
        if (cntTinhThuy) cntTinhThuy.textContent = (getInvCount('herb_tinhthuy') + getInvCount('tinh_thuy') + 10).toLocaleString();
        if (cntYeuDan) cntYeuDan.textContent = (getInvCount('herb_yeudan') + getInvCount('yeu_dan')).toLocaleString();
    }
    window.updateHeaderUI = updateAlchemyHeaderUI;

    function renderRecipes() {
        const listEl = document.getElementById('recipes-scroll-list');
        if (!listEl) return;
        const cauldron = CAULDRONS_DATA[activeCauldronId] || CAULDRONS_DATA.cauldron_1;

        listEl.innerHTML = RECIPES_DATA.map(recipe => {
            let canBrew = true;
            const matsHtml = recipe.materials.map(m => {
                const owned = (m.key === 'herb_huysam' ? getInvCount('herb_huysam') + getInvCount('herb_blood') :
                               (m.key === 'herb_linhchi' ? getInvCount('herb_linhchi') + getInvCount('herb_spirit') :
                               (m.key === 'herb_tinhthuy' ? getInvCount('herb_tinhthuy') + getInvCount('tinh_thuy') + 10 :
                               getInvCount(m.key))));
                const hasEnough = owned >= m.qty;
                if (!hasEnough) canBrew = false;
                return `
                    <span class="recipe-ingredient-pill ${hasEnough ? 'recipe-ingredient-pill--ok' : 'recipe-ingredient-pill--lack'}">
                        ${m.name}: <b>${owned}/${m.qty}</b>
                    </span>
                `;
            }).join('');

            const finalSuccessPct = Math.min(99, Math.round((recipe.baseSuccess + cauldron.successBonus) * 100));

            return `
                <div class="recipe-item-card">
                    <div class="recipe-item-head">
                        <div class="flex items-center gap-2">
                            <span class="recipe-icon-frame"><i class="fa-solid ${recipe.icon} text-teal-400"></i></span>
                            <div>
                                <h4 class="recipe-name font-serif">${recipe.name}</h4>
                                <span class="recipe-grade-badge ${recipe.gradeBadge}">${recipe.grade}</span>
                            </div>
                        </div>
                        <span class="text-xs font-mono font-bold text-emerald-400">${finalSuccessPct}% Thành Công</span>
                    </div>

                    <p class="recipe-desc text-[11px] text-slate-400 my-1.5">${recipe.desc}</p>
                    <div class="flex flex-wrap gap-1.5 my-2">${matsHtml}</div>

                    <div class="recipe-card-foot flex justify-between items-center pt-2 border-t border-slate-800">
                        <span class="text-[10px] text-rose-400 font-mono">+ ${recipe.danDocGain} Đan Độc</span>
                        <button type="button" class="btn-brew" onclick="startAlchemy('${recipe.id}')" ${canBrew && !isAlchemyBrewing ? '' : 'disabled'}>
                            <i class="fa-solid fa-fire-burner"></i> Khởi Đỉnh Luyện Đan
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    window.renderRecipes = renderRecipes;

    function startAlchemy(recipeId) {
        if (isAlchemyBrewing) return;
        const recipe = RECIPES_DATA.find(r => r.id === recipeId);
        if (!recipe) return;

        // Deduct materials
        for (const m of recipe.materials) {
            const isBlood = m.key === 'herb_huysam' && getInvCount('herb_huysam') < m.qty;
            const actualKey = isBlood ? 'herb_blood' : (m.key === 'herb_linhchi' && getInvCount('herb_linhchi') < m.qty ? 'herb_spirit' : m.key);
            deductInvItem(actualKey, m.qty);
        }

        isAlchemyBrewing = true;
        updateAlchemyHeaderUI();
        renderRecipes();

        const progressBox = document.getElementById('brewing-progress-box');
        const pillName = document.getElementById('brew-pill-name');
        const timerText = document.getElementById('brew-timer-text');
        const progressFill = document.getElementById('brewing-fill');
        const percentText = document.getElementById('brew-percent-text');
        const cauldronWrap = document.getElementById('cauldron-visual-wrap');

        if (progressBox) progressBox.classList.remove('hidden');
        if (pillName) pillName.textContent = recipe.name;
        if (cauldronWrap) cauldronWrap.classList.add('is-brewing');

        let elapsedMs = 0;
        const totalDurationMs = 2200;
        const stepMs = 60;

        if (roomAlchTimer) {
            clearInterval(roomAlchTimer);
            roomAlchTimer = null;
        }

        roomAlchTimer = setInterval(() => {
            elapsedMs += stepMs;
            const pct = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
            const remainSec = Math.max(0, ((totalDurationMs - elapsedMs) / 1000)).toFixed(1);

            if (progressFill) progressFill.style.width = `${pct}%`;
            if (percentText) percentText.textContent = `${pct}%`;
            if (timerText) timerText.textContent = `${remainSec}s`;

            if (elapsedMs >= totalDurationMs) {
                clearInterval(roomAlchTimer);
                roomAlchTimer = null;
                finishAlchemy(recipe);
            }
        }, stepMs);
    }
    window.startAlchemy = startAlchemy;

    function finishAlchemy(recipe) {
        isAlchemyBrewing = false;
        const cauldron = CAULDRONS_DATA[activeCauldronId] || CAULDRONS_DATA.cauldron_1;
        const isSuccess = Math.random() < (recipe.baseSuccess + cauldron.successBonus);
        const progressBox = document.getElementById('brewing-progress-box');
        const cauldronWrap = document.getElementById('cauldron-visual-wrap');

        if (progressBox) progressBox.classList.add('hidden');
        if (cauldronWrap) cauldronWrap.classList.remove('is-brewing');

        if (isSuccess) {
            // Tăng đan độc
            if (window.state) {
                window.state.danDoc = Math.min(100, (Number(window.state.danDoc) || 0) + recipe.danDocGain);
            }

            const pillItem = {
                id: `pill_${recipe.id}_${Date.now()}`,
                name: recipe.name,
                grade: recipe.grade,
                type: 'Đan Dược',
                count: 1,
                desc: recipe.desc,
                expGain: recipe.expGain || 0,
                healAmount: recipe.healAmount || 0,
                icon: recipe.icon
            };

            recentPillsBag.unshift(pillItem);
            addInvItem(pillItem);

            openPillResultModal(pillItem);
            if (typeof window.addLog === 'function') {
                window.addLog(`♨️ <span class="text-teal-400 font-bold">[Luyện Đan Phòng]</span> Luyện chế thành công <strong>${pillItem.name}</strong> (+ ${recipe.danDocGain} Đan Độc)!`, 'text-teal-300');
            }
        } else {
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast(`Luyện đan thất bại! Lửa nổ đan lô, dược liệu hóa thành tro bụi!`, 'error');
            } else {
                alert(`Luyện đan thất bại! Lửa nổ đan lô, dược liệu hóa thành tro bụi!`);
            }
            if (typeof window.addLog === 'function') {
                window.addLog(`💥 <span class="text-rose-400 font-bold">[Luyện Đan Phòng]</span> Nổ đỉnh! Luyện chế ${recipe.name} thất bại.`, 'text-rose-400');
            }
        }

        updateAlchemyHeaderUI();
        renderRecipes();
        renderRecentPills();
    }

    function openPillResultModal(pill) {
        const modal = document.getElementById('pill-result-modal');
        const title = document.getElementById('res-pill-title');
        const desc = document.getElementById('res-pill-desc');
        const badge = document.getElementById('res-pill-badge');
        const icon = document.getElementById('res-pill-icon');

        if (!modal) return;
        if (title) title.textContent = pill.name;
        if (desc) desc.textContent = pill.desc;
        if (badge) badge.textContent = pill.grade;
        if (icon) icon.className = `fa-solid ${pill.icon} text-4xl text-teal-300`;

        modal.classList.add('is-open');
    }
    window.openPillResultModal = openPillResultModal;

    function closePillResultModal() {
        const modal = document.getElementById('pill-result-modal');
        if (modal) modal.classList.remove('is-open');
    }
    window.closePillResultModal = closePillResultModal;

    function swallowPill(pillId) {
        closePillResultModal();
        const pill = recentPillsBag[0];
        if (!pill) return;

        if (pill.expGain && typeof window.addExp === 'function') {
            const res = window.addExp(pill.expGain);
            if (res && res.gainedAmount === 0 && window.state?.realmIndex >= 14) {
                if (typeof window.showXianxiaToast === 'function') {
                    window.showXianxiaToast("⚠️ Thiên Đạo Áp Chế! Khí tức của ngươi đã vượt giới hạn Hạ Giới, nuốt đan dược không thể gia tăng Tu Vi!", "error");
                } else {
                    alert("⚠️ Thiên Đạo Áp Chế! Khí tức của ngươi đã vượt giới hạn Hạ Giới, nuốt đan dược không thể gia tăng Tu Vi!");
                }
            }
        }
        if (pill.healAmount && window.state) {
            window.state.currentHp = Math.min(window.state.maxHp || 10000, (window.state.currentHp || 0) + pill.healAmount);
        }
        if (typeof window.updateHUD === 'function') window.updateHUD();
    }
    window.swallowPill = swallowPill;

    function drinkCleansePill() {
        if (!window.state) return;
        const curDoc = Number(window.state.danDoc) || 0;
        if (curDoc <= 0) {
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast("Kinh mạch thanh tịnh, không có đan độc!", "info");
            } else {
                alert("Kinh mạch thanh tịnh, không có đan độc!");
            }
            return;
        }
        window.state.danDoc = Math.max(0, curDoc - 30);
        if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(`🌿 Đã uống Thanh Tâm Đan! Đan độc giảm bớt 30 điểm (Hiện tại: ${window.state.danDoc}/100).`, "success");
        } else {
            alert(`Đã uống Thanh Tâm Đan! Đan độc giảm bớt 30 điểm (Hiện tại: ${window.state.danDoc}/100).`);
        }
        updateAlchemyHeaderUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
    }
    window.drinkCleansePill = drinkCleansePill;

    function openCauldronPicker() {
        const m = document.getElementById('cauldron-modal');
        if (m) m.classList.add('is-open');
    }
    window.openCauldronPicker = openCauldronPicker;

    function selectCauldron(id) {
        activeCauldronId = id;
        const c = CAULDRONS_DATA[id];
        const title = document.getElementById('active-cauldron-title');
        const buff = document.getElementById('active-cauldron-buff');
        if (title && c) title.textContent = c.name;
        if (buff && c) buff.textContent = c.buffDesc;
        closeCauldronPicker();
        renderRecipes();
    }
    window.selectCauldron = selectCauldron;

    function closeCauldronPicker() {
        const m = document.getElementById('cauldron-modal');
        if (m) m.classList.remove('is-open');
    }
    window.closeCauldronPicker = closeCauldronPicker;

    function openFirePicker() {
        const m = document.getElementById('fire-modal');
        if (m) m.classList.add('is-open');
    }
    window.openFirePicker = openFirePicker;

    function selectFire(id) {
        activeFireId = id;
        const f = FIRES_DATA[id];
        const title = document.getElementById('active-fire-name');
        if (title && f) title.textContent = f.name;
        closeFirePicker();
        renderRecipes();
    }
    window.selectFire = selectFire;

    function closeFirePicker() {
        const m = document.getElementById('fire-modal');
        if (m) m.classList.remove('is-open');
    }
    window.closeFirePicker = closeFirePicker;

    function renderRecentPills() {
        const shelf = document.getElementById('recent-pills-container');
        if (!shelf) return;
        if (recentPillsBag.length === 0) {
            shelf.innerHTML = '<span class="text-xs text-slate-500 italic py-2">Chưa luyện chế đan dược nào...</span>';
            return;
        }
        shelf.innerHTML = recentPillsBag.slice(0, 6).map(p => `
            <div class="crafted-item-pill">
                <i class="fa-solid ${p.icon} text-teal-400"></i>
                <span class="text-slate-200">${p.name}</span>
            </div>
        `).join('');
    }
    window.renderRecentPills = renderRecentPills;

    function addMockHerb(key, qty) {
        addInvItem({ id: key, name: key, count: qty, type: 'Thảo Dược', rarity: 2 });
        updateAlchemyHeaderUI();
        renderRecipes();
    }
    window.addMockHerb = addMockHerb;

    function renderIntegratedAlchemyRoom() {
        updateAlchemyHeaderUI();
        renderRecipes();
        renderRecentPills();
    }
    window.renderIntegratedAlchemyRoom = renderIntegratedAlchemyRoom;

    // =========================================================================
    // 3. KHUÊ PHÒNG ĐẠO LỮ (COMPANION CHAMBER MODULE)
    // =========================================================================
    const COMPANIONS_DATA = [
        {
            id: "companion_1",
            name: "Liễu Như Yên",
            title: "Tiểu Sư Muội",
            sect: "Thanh Vân Tiên Phái",
            avatar: "./assets/images/pet_fox.jpg",
            quote: "Sư huynh, bế quan mệt mỏi rồi sao? Muội vừa pha linh trà tuyết liên cho huynh...",
            unlocked: true,
            unlockCondition: "Mở khóa mặc định",
            expMultiplier: 1.5,
            affection: 1800,
            buffs: [
                { level: 1, text: "+5% Tốc độ tu luyện toàn phần" },
                { level: 3, text: "+10% Tốc độ hồi phục Linh Lực & Khí Huyết" },
                { level: 5, text: "Tự động thu hoạch Linh Điền khi offline" }
            ]
        },
        {
            id: "companion_2",
            name: "Cơ Tử Uyển",
            title: "Thánh Nữ Dao Trì",
            sect: "Dao Trì Thánh Địa",
            avatar: "./assets/images/sect_hall.jpg",
            quote: "Đạo hữu, đạo vận trên người chàng dạo này càng thêm thâm thúy... Chúng ta cùng luận bàn đạo pháp nhé?",
            unlocked: true,
            unlockCondition: "Đạt cảnh giới Trúc Cơ Kỳ",
            expMultiplier: 2.2,
            affection: 3400,
            buffs: [
                { level: 1, text: "+12% Tỷ lệ xuất hiện Dị Tượng khi tu luyện" },
                { level: 3, text: "+15% Bạo kích sát thương khi khiêu chiến Boss" },
                { level: 5, text: "Miễn nhiễm 1 đòn chí mạng mỗi ngày (Niết Bàn Hộ Thể)" }
            ]
        },
        {
            id: "companion_3",
            name: "Nam Cung Uyển",
            title: "Trưởng Lão Yểm Nguyệt Tông",
            sect: "Yểm Nguyệt Tiên Tông",
            avatar: "./assets/images/bg_dong_phu.jpg",
            quote: "Tiểu tử to gan, ai cho ngươi dám nhìn thẳng vào mắt bản tọa? Còn không mau lại đây cùng ta vận chuyển Chu Thiên...",
            unlocked: false,
            unlockCondition: "Vượt Tầng 30 Trấn Yêu Tháp",
            expMultiplier: 3.5,
            affection: 500,
            buffs: [
                { level: 1, text: "+20% Tỷ lệ độ kiếp thành công" },
                { level: 3, text: "Nhân đôi toàn bộ tài nguyên rơi từ Trấn Yêu Tháp" },
                { level: 5, text: "Khai mở thần thông Hỗn Độn Âm Dương Quyết" }
            ]
        }
    ];

    const AFFECTION_RANKS = [
        { rank: 1, name: "Sơ Kiến", min: 0, badge: "bg-slate-800 text-slate-300 border-slate-600" },
        { rank: 2, name: "Tương Tri", min: 500, badge: "bg-sky-950 text-sky-300 border-sky-500" },
        { rank: 3, name: "Tri Kỷ", min: 1500, badge: "bg-pink-950 text-pink-300 border-pink-500" },
        { rank: 4, name: "Tình Thâm", min: 3000, badge: "bg-rose-950 text-rose-300 border-rose-500" },
        { rank: 5, name: "Đạo Lữ Đồng Tâm", min: 5000, badge: "bg-amber-950 text-amber-300 border-amber-500" }
    ];

    let activeCompIndex = 0;
    let lastDualTime = 0;
    const dualCooldownMs = 15000; // 15s cho trải nghiệm test mượt mà

    function getAffectionRank(pts) {
        let matched = AFFECTION_RANKS[0];
        for (const r of AFFECTION_RANKS) {
            if (pts >= r.min) matched = r;
        }
        return matched;
    }

    function updateCompanionUI() {
        const comp = COMPANIONS_DATA[activeCompIndex] || COMPANIONS_DATA[0];
        const nameTitle = document.getElementById('comp-name-title');
        const sectTitle = document.getElementById('comp-sect-title');
        const quoteEl = document.getElementById('companion-quote-bubble');
        const rankBadge = document.getElementById('comp-affection-rank-badge');
        const affText = document.getElementById('affection-points-text');
        const affFill = document.getElementById('affection-fill');
        const buffsList = document.getElementById('companion-buffs-list');
        const mainImg = document.getElementById('companion-main-img');

        const rank = getAffectionRank(comp.affection);
        if (nameTitle) nameTitle.textContent = comp.name;
        if (sectTitle) sectTitle.textContent = `${comp.sect} • ${comp.title}`;
        if (quoteEl) quoteEl.textContent = `"${comp.quote}"`;
        if (rankBadge) {
            rankBadge.textContent = rank.name;
            rankBadge.className = `text-xs px-2.5 py-0.5 rounded-full border ${rank.badge}`;
        }
        if (affText) affText.textContent = `${comp.affection.toLocaleString()} Điểm`;
        if (affFill) affFill.style.width = `${Math.min(100, (comp.affection / 5000) * 100)}%`;
        if (mainImg) mainImg.src = comp.avatar;

        if (buffsList) {
            buffsList.innerHTML = comp.buffs.map(b => `
                <div class="buff-item ${comp.affection >= b.level * 1000 ? 'buff-item--unlocked' : 'buff-item--locked'}">
                    <i class="fa-solid fa-sparkles text-pink-400"></i>
                    <span>${b.text}</span>
                </div>
            `).join('');
        }

        // Render companions list tab
        const cardsList = document.getElementById('companion-cards-list');
        if (cardsList) {
            cardsList.innerHTML = COMPANIONS_DATA.map((c, idx) => `
                <div class="companion-selector-card ${idx === activeCompIndex ? 'is-selected' : ''}" onclick="selectCompanion(${idx})">
                    <img src="${c.avatar}" class="w-12 h-12 rounded-xl object-cover border border-pink-500/40">
                    <div>
                        <div class="text-xs font-bold text-slate-100 font-serif">${c.name}</div>
                        <div class="text-[10px] text-pink-400">${c.title} • Hảo cảm: ${c.affection}</div>
                    </div>
                </div>
            `).join('');
        }

        // Cooldown timer button
        const btnSongTu = document.getElementById('btn-song-tu');
        const cooldownStatus = document.getElementById('cooldown-timer-status');
        const remainSec = Math.max(0, Math.ceil((dualCooldownMs - (Date.now() - lastDualTime)) / 1000));

        if (remainSec > 0) {
            if (btnSongTu) btnSongTu.disabled = true;
            if (cooldownStatus) cooldownStatus.textContent = `Hồi khí: Còn ${remainSec}s`;
        } else {
            if (btnSongTu) btnSongTu.disabled = false;
            if (cooldownStatus) cooldownStatus.textContent = 'Khí tức sung mãn, sẵn sàng Song Tu';
        }
    }
    window.updateUI = updateCompanionUI;

    function switchChamberTab(tab) {
        const btnInteract = document.getElementById('tab-btn-interact');
        const btnComp = document.getElementById('tab-btn-companions');
        const viewInteract = document.getElementById('tab-content-interact');
        const viewComp = document.getElementById('tab-content-companions');

        if (tab === 'interact') {
            if (btnInteract) btnInteract.classList.add('is-active');
            if (btnComp) btnComp.classList.remove('is-active');
            if (viewInteract) viewInteract.classList.remove('hidden');
            if (viewComp) viewComp.classList.add('hidden');
        } else {
            if (btnComp) btnComp.classList.add('is-active');
            if (btnInteract) btnInteract.classList.remove('is-active');
            if (viewComp) viewComp.classList.remove('hidden');
            if (viewInteract) viewInteract.classList.add('hidden');
        }
    }
    window.switchChamberTab = switchChamberTab;

    function selectCompanion(idx) {
        activeCompIndex = idx;
        switchChamberTab('interact');
        updateCompanionUI();
    }
    window.selectCompanion = selectCompanion;

    function giveGift(giftKey) {
        const comp = COMPANIONS_DATA[activeCompIndex];
        if (!comp) return;

        let affAdd = 100;
        if (giftKey === 'gift_luuly') affAdd = 250;
        if (giftKey === 'gift_hoalactinh') affAdd = 600;

        comp.affection += affAdd;
        updateCompanionUI();

        if (typeof window.addLog === 'function') {
            window.addLog(`🌸 <span class="text-pink-400 font-bold">[Khuê Phòng]</span> Tặng bảo vật cho <strong>${comp.name}</strong>, hảo cảm tăng +${affAdd}!`, 'text-pink-300');
        }
    }
    window.giveGift = giveGift;

    function triggerDualCultivation() {
        const comp = COMPANIONS_DATA[activeCompIndex];
        const now = Date.now();
        if (now - lastDualTime < dualCooldownMs) {
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast("Hai người vừa song tu xong, cần tĩnh dưỡng hồi phục kinh mạch!", "error");
            } else {
                alert("Hai người vừa song tu xong, cần tĩnh dưỡng hồi phục kinh mạch!");
            }
            return;
        }

        lastDualTime = now;
        comp.affection += 80;

        // Tính Tu Vi thực tế
        const baseExp = Math.round(500 * comp.expMultiplier);
        let actualGained = baseExp;

        if (typeof window.addExp === 'function') {
            const res = window.addExp(baseExp);
            if (res && typeof res.gainedAmount === 'number') {
                actualGained = res.gainedAmount;
            }
        }

        showDualCultivationAnimation({
            name: comp.name,
            exp: actualGained,
            baseExp: baseExp,
            isSuppressed: actualGained === 0 && window.state?.realmIndex >= 14
        });

        updateCompanionUI();
    }
    window.triggerDualCultivation = triggerDualCultivation;

    function resetDualCooldown() {
        lastDualTime = 0;
        updateCompanionUI();
    }
    window.resetDualCooldown = resetDualCooldown;

    function showDualCultivationAnimation(res) {
        const overlay = document.getElementById('dual-cultivation-overlay');
        const resultText = document.getElementById('dual-result-text');
        const rewardBox = document.getElementById('dual-reward-amount-box');
        if (!overlay) return;

        if (res.isSuppressed) {
            if (resultText) resultText.innerHTML = `<span class="text-rose-400">⚠️ THIÊN ĐẠO ÁP CHẾ!</span><br>Âm Dương giao hòa cùng <strong>${res.name}</strong>, nhưng tu vi tràn ra bị Thiên Đạo bài xích tiêu tán! Tình cảm đôi lứa thêm gắn kết (+80 Hảo Cảm).`;
            if (rewardBox) rewardBox.textContent = '+0 Tu Vi (Bị Giới Hạn)';
        } else {
            if (resultText) resultText.innerHTML = `Song tu viên mãn cùng <strong>${res.name}</strong>! Âm dương điều hòa, linh lực tẩy lễ kinh mạch.`;
            if (rewardBox) rewardBox.textContent = `+${res.exp.toLocaleString()} Tu Vi & +80 Hảo Cảm`;
        }

        overlay.classList.add('is-active');
        if (typeof window.addLog === 'function') {
            window.addLog(`💖 <span class="text-pink-400 font-bold">[Song Tu]</span> Cùng ${res.name} song tu viên mãn! (+80 Hảo Cảm)`, 'text-pink-300');
        }

        setTimeout(() => {
            closeDualAnimation();
        }, 3200);
    }
    window.showDualCultivationAnimation = showDualCultivationAnimation;

    function closeDualAnimation() {
        const overlay = document.getElementById('dual-cultivation-overlay');
        if (overlay) overlay.classList.remove('is-active');
    }
    window.closeDualAnimation = closeDualAnimation;

    function addMockGift(giftKey, count) {
        giveGift(giftKey);
    }
    window.addMockGift = addMockGift;

    function renderIntegratedChamber() {
        updateCompanionUI();
    }
    window.renderIntegratedChamber = renderIntegratedChamber;

    // =========================================================================
    // 4. TRẤN YÊU THÁP BATTLER (TOWER ARENA MODULE)
    // =========================================================================
    let isTowerCombatRunning = false;
    let towerCombatInterval = null;
    let isAutoClimb = false;
    let currentBattleMonster = null;
    let currentBattlePlayer = null;

    function generateTowerMonster(floor) {
        // Tầng 50: Boss độc quyền Thao Thiết
        if (floor === 50) {
            return {
                name: "Xích Diễm Thao Thiết Vương",
                realm: "Thượng Cổ Ma Thú • Tầng 50",
                avatar: "./assets/images/monster_beast.jpg",
                maxHp: 1640000,
                hp: 1640000,
                atk: 250000,
                def: 95000,
                critRate: 0.35,
                dodgeRate: 0.15,
                armorPen: 0.35,
                cp: 3850000,
                isBoss: true,
                rewardStones: 50000,
                rewardTuVi: 100000
            };
        }

        // Tầng thường
        const mult = Math.pow(1.12, floor - 1);
        const baseHp = Math.round(15000 * mult);
        const baseAtk = Math.round(2800 * mult);
        const baseDef = Math.round(1200 * mult);
        const names = ["Cửu Vĩ Linh Hồ", "U Minh Huyết Lang", "Bạch Cốt Tướng Quân", "Xích Lôi Khôi Lỗi", "Hắc Thủy Cự Mãng", "Băng Sương Cự Ma"];
        const monsterName = names[(floor - 1) % names.length];

        return {
            name: `${monsterName} (Tầng ${floor})`,
            realm: `Yêu Thú Tầng ${floor}`,
            avatar: "./assets/images/monster_ghost.jpg",
            maxHp: baseHp,
            hp: baseHp,
            atk: baseAtk,
            def: baseDef,
            critRate: 0.15,
            dodgeRate: 0.08,
            armorPen: 0,
            cp: Math.round((baseHp / 5) + (baseAtk * 3) + (baseDef * 2)),
            isBoss: floor % 10 === 0,
            rewardStones: Math.round(500 * mult),
            rewardTuVi: Math.round(1200 * mult)
        };
    }

    function getLiveBattlePlayer() {
        const s = window.state || {};
        const maxHp = Number(s.maxHp) || 85000;
        const curHp = Number(s.currentHp) || maxHp;
        const atk = Number(s.atk) || 15000;
        const def = Number(s.def) || 6000;
        const crit = (Number(s.crit) || 5) / 100;
        const dodge = (Number(s.dodge) || 5) / 100;
        const cp = typeof window.getCombatPower === 'function' ? window.getCombatPower() : Math.round(maxHp / 5 + atk * 3 + def * 2);

        return {
            name: window.player?.name || "Đạo Hữu",
            realm: getPlayerRealmName(),
            avatar: "./assets/images/avatar.jpg",
            maxHp: maxHp,
            hp: curHp,
            atk: atk,
            def: def,
            critRate: crit,
            dodgeRate: dodge,
            cp: cp,
            shield: 0,
            hasReborn: false
        };
    }

    function updateTowerArenaUI() {
        const floor = window.state?.towerFloor || 1;
        currentBattlePlayer = getLiveBattlePlayer();
        currentBattleMonster = generateTowerMonster(floor);

        // Player UI
        const pName = document.getElementById('player-name-text');
        const pRealm = document.getElementById('player-realm-text');
        const pCp = document.getElementById('player-cp-text');
        const pHpText = document.getElementById('player-hp-text');
        const pHpBar = document.getElementById('player-hp-bar');
        const pAtk = document.getElementById('player-atk-text');
        const pDef = document.getElementById('player-def-text');
        const pCrit = document.getElementById('player-crit-text');
        const pDodge = document.getElementById('player-dodge-text');

        if (pName) pName.textContent = currentBattlePlayer.name;
        if (pRealm) pRealm.textContent = currentBattlePlayer.realm;
        if (pCp) pCp.textContent = currentBattlePlayer.cp.toLocaleString();
        if (pHpText) pHpText.textContent = `${currentBattlePlayer.hp.toLocaleString()} / ${currentBattlePlayer.maxHp.toLocaleString()}`;
        if (pHpBar) pHpBar.style.width = `${Math.min(100, (currentBattlePlayer.hp / currentBattlePlayer.maxHp) * 100)}%`;
        if (pAtk) pAtk.textContent = currentBattlePlayer.atk.toLocaleString();
        if (pDef) pDef.textContent = currentBattlePlayer.def.toLocaleString();
        if (pCrit) pCrit.textContent = `${Math.round(currentBattlePlayer.critRate * 100)}%`;
        if (pDodge) pDodge.textContent = `${Math.round(currentBattlePlayer.dodgeRate * 100)}%`;

        // Monster UI
        const mName = document.getElementById('boss-name-text');
        const mRealm = document.getElementById('boss-realm-text');
        const mCp = document.getElementById('boss-cp-text');
        const mHpText = document.getElementById('boss-hp-text');
        const mHpBar = document.getElementById('boss-hp-bar');
        const mAtk = document.getElementById('boss-atk-text');
        const mDef = document.getElementById('boss-def-text');
        const mCrit = document.getElementById('boss-crit-text');
        const mDodge = document.getElementById('boss-dodge-text');
        const mReward = document.getElementById('boss-reward-text');

        if (mName) mName.textContent = currentBattleMonster.name;
        if (mRealm) mRealm.textContent = currentBattleMonster.realm;
        if (mCp) mCp.textContent = currentBattleMonster.cp.toLocaleString();
        if (mHpText) mHpText.textContent = `${currentBattleMonster.hp.toLocaleString()} / ${currentBattleMonster.maxHp.toLocaleString()}`;
        if (mHpBar) mHpBar.style.width = '100%';
        if (mAtk) mAtk.textContent = currentBattleMonster.atk.toLocaleString();
        if (mDef) mDef.textContent = currentBattleMonster.def.toLocaleString();
        if (mCrit) mCrit.textContent = `${Math.round(currentBattleMonster.critRate * 100)}%`;
        if (mDodge) mDodge.textContent = `${Math.round(currentBattleMonster.dodgeRate * 100)}%`;
        if (mReward) mReward.textContent = `+${currentBattleMonster.rewardStones.toLocaleString()} LT, +${currentBattleMonster.rewardTuVi.toLocaleString()} Tu Vi`;

        // Header / Center
        const floorTitle = document.getElementById('arena-floor-title');
        const btnText = document.getElementById('btn-challenge-text');
        const stonesBadge = document.getElementById('player-stones-badge');
        const tuviBadge = document.getElementById('player-tuvi-badge');

        if (floorTitle) floorTitle.textContent = `TẦNG ${floor}`;
        if (btnText) btnText.textContent = `KHIÊU CHIẾN TẦNG ${floor}`;
        if (stonesBadge) stonesBadge.textContent = (window.state?.stones || 0).toLocaleString();
        if (tuviBadge) tuviBadge.textContent = (window.state?.exp || 0).toLocaleString();
    }
    window.updateArenaUI = updateTowerArenaUI;

    function handleChallengeClick() {
        if (isTowerCombatRunning) return;
        startTowerCombat();
    }
    window.handleChallengeClick = handleChallengeClick;

    function appendTowerLog(msg, colorClass = "text-slate-300") {
        const box = document.getElementById('combat-log-box');
        if (!box) return;
        const p = document.createElement('p');
        p.className = `text-xs leading-relaxed ${colorClass}`;
        p.innerHTML = msg;
        box.appendChild(p);
        while (box.children.length > 50 && box.firstElementChild) {
            box.firstElementChild.remove();
        }
        box.scrollTop = box.scrollHeight;
    }

    function startTowerCombat() {
        if (towerCombatInterval) {
            clearInterval(towerCombatInterval);
            towerCombatInterval = null;
        }
        isTowerCombatRunning = true;
        const btn = document.getElementById('btn-challenge-tower');
        if (btn) btn.disabled = true;

        const box = document.getElementById('combat-log-box');
        if (box) box.innerHTML = '';

        const floor = window.state?.towerFloor || 1;
        appendTowerLog(`⚔️ <strong class="text-amber-400">Trận chiến Tầng ${floor} bắt đầu!</strong> Đối thủ: ${currentBattleMonster.name}`, 'text-amber-300');

        let turn = 1;
        towerCombatInterval = setInterval(() => {
            if (!isTowerCombatRunning) {
                clearInterval(towerCombatInterval);
                return;
            }

            // Player attacks
            executeTowerAttack(currentBattlePlayer, currentBattleMonster, true, turn);

            if (currentBattleMonster.hp <= 0) {
                clearInterval(towerCombatInterval);
                endTowerCombat(true);
                return;
            }

            // Monster counter-attacks after 300ms
            setTimeout(() => {
                if (!isTowerCombatRunning) return;
                executeTowerAttack(currentBattleMonster, currentBattlePlayer, false, turn);

                if (currentBattlePlayer.hp <= 0) {
                    clearInterval(towerCombatInterval);
                    endTowerCombat(false);
                }
            }, 300);

            turn++;
            if (turn > 30) {
                // Hòa sau 30 hiệp -> Xem như thất bại
                clearInterval(towerCombatInterval);
                appendTowerLog("⏳ Trận chiến kéo dài quá 30 hiệp! Lực kiệt tháo lui.", "text-rose-400");
                endTowerCombat(false);
            }
        }, 700);
    }

    function executeTowerAttack(attacker, defender, isPlayer, turn) {
        // Roll dodge
        if (Math.random() < defender.dodgeRate) {
            appendTowerLog(`💨 <strong>${defender.name}</strong> nhanh như chớp né tránh đòn đánh của ${attacker.name}!`, 'text-sky-300');
            return;
        }

        // Damage formula
        const isCrit = Math.random() < attacker.critRate;
        const critMult = isCrit ? 1.8 : 1.0;
        const effectiveDef = defender.def * (1 - (attacker.armorPen || 0));
        let rawDmg = Math.max(attacker.atk * 0.25, (attacker.atk - effectiveDef * 0.5) * critMult);
        rawDmg = Math.round(rawDmg * (0.9 + Math.random() * 0.2));

        defender.hp = Math.max(0, defender.hp - rawDmg);

        // Update health bars
        const hpBar = document.getElementById(isPlayer ? 'boss-hp-bar' : 'player-hp-bar');
        const hpText = document.getElementById(isPlayer ? 'boss-hp-text' : 'player-hp-text');
        if (hpBar) hpBar.style.width = `${Math.min(100, (defender.hp / defender.maxHp) * 100)}%`;
        if (hpText) hpText.textContent = `${defender.hp.toLocaleString()} / ${defender.maxHp.toLocaleString()}`;

        const critTag = isCrit ? '<span class="text-amber-400 font-bold">[BẠO KÍCH!]</span> ' : '';
        const color = isPlayer ? 'text-emerald-400' : 'text-rose-400';
        appendTowerLog(`${critTag}<strong>${attacker.name}</strong> tấn công ${defender.name}, gây <b class="${color}">-${rawDmg.toLocaleString()}</b> sát thương!`, color);
    }

    function endTowerCombat(isWin) {
        isTowerCombatRunning = false;
        const btn = document.getElementById('btn-challenge-tower');
        if (btn) btn.disabled = false;

        const modal = document.getElementById('battle-result-modal');
        const title = document.getElementById('result-title');
        const desc = document.getElementById('result-desc');
        const rewardBox = document.getElementById('result-rewards');

        const floor = window.state?.towerFloor || 1;

        if (isWin) {
            if (title) title.textContent = "CHIẾN THẮNG HUY HOÀNG!";
            if (desc) desc.textContent = `Đạo hữu đã chém chết hung thú, chinh phục hoàn toàn Tầng ${floor} Trấn Yêu Tháp!`;
            if (rewardBox) {
                rewardBox.innerHTML = `
                    <div class="vault-pill vault-pill--gold"><i class="fa-solid fa-coins"></i> +${currentBattleMonster.rewardStones.toLocaleString()} Linh Thạch</div>
                    <div class="vault-pill vault-pill--tuvi"><i class="fa-solid fa-bolt"></i> +${currentBattleMonster.rewardTuVi.toLocaleString()} Tu Vi</div>
                `;
            }

            // Update real game state
            if (window.state) {
                window.state.towerFloor = floor + 1;
                window.state.stones = (window.state.stones || 0) + currentBattleMonster.rewardStones;
                if (typeof window.addExp === 'function') window.addExp(currentBattleMonster.rewardTuVi);
            }

            if (typeof window.addLog === 'function') {
                window.addLog(`🗼 <span class="text-amber-400 font-bold">[Trấn Yêu Tháp]</span> Chinh phục Tầng ${floor}! Nhận +${currentBattleMonster.rewardStones.toLocaleString()} LT và +${currentBattleMonster.rewardTuVi.toLocaleString()} Tu Vi.`, 'text-amber-300');
            }
        } else {
            if (title) title.textContent = "KHIÊU CHIẾN THẤT BẠI!";
            if (desc) desc.textContent = `Đạo hữu không địch lại hung uy của ${currentBattleMonster.name} tại Tầng ${floor}! Hãy tôi luyện thêm tu vi rồi trở lại.`;
            if (rewardBox) rewardBox.innerHTML = '<span class="text-rose-400 font-serif">Kinh mạch tổn thương, tháo lui bảo mệnh!</span>';
            isAutoClimb = false;
            const switchEl = document.getElementById('auto-climb-switch');
            if (switchEl) switchEl.checked = false;

            if (typeof window.addLog === 'function') {
                window.addLog(`🩸 <span class="text-rose-400 font-bold">[Trấn Yêu Tháp]</span> Bại trận trước ${currentBattleMonster.name} tại Tầng ${floor}!`, 'text-rose-400');
            }
        }

        if (modal) modal.classList.add('is-active');

        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();

        // Auto climb loop
        if (isWin && isAutoClimb) {
            setTimeout(() => {
                closeResultModal();
                updateTowerArenaUI();
                startTowerCombat();
            }, 2000);
        } else {
            updateTowerArenaUI();
        }
    }

    function toggleAutoClimb() {
        const switchEl = document.getElementById('auto-climb-switch');
        isAutoClimb = switchEl ? switchEl.checked : !isAutoClimb;
        if (isAutoClimb && !isTowerCombatRunning) {
            startTowerCombat();
        }
    }
    window.toggleAutoClimb = toggleAutoClimb;

    function fullHealPlayer() {
        if (window.state) {
            window.state.currentHp = window.state.maxHp || 10000;
        }
        updateTowerArenaUI();
        if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast("Khí huyết đã hồi phục toàn diện!", "success");
        } else {
            alert("Khí huyết đã hồi phục toàn diện!");
        }
    }
    window.fullHealPlayer = fullHealPlayer;

    function closeResultModal() {
        const modal = document.getElementById('battle-result-modal');
        if (modal) modal.classList.remove('is-active');
    }
    window.closeResultModal = closeResultModal;

    function renderIntegratedTowerArena() {
        updateTowerArenaUI();
    }
    window.renderIntegratedTowerArena = renderIntegratedTowerArena;

    // =========================================================================
    // 5. LIFECYCLE HOOKS (SPA INTEGRATION)
    // =========================================================================
    const origSwitchDpTab = window.switchDpTab;
    window.switchDpTab = function (roomId) {
        if (typeof origSwitchDpTab === 'function') {
            origSwitchDpTab(roomId);
        }
        if (roomId === 'dp-luyen-khi') renderIntegratedForgingRoom();
        else if (roomId === 'dp-luyen-dan') renderIntegratedAlchemyRoom();
        else if (roomId === 'dp-khue-phong') renderIntegratedChamber();
    };

    const origOpenDemonTowerModal = window.openDemonTowerModal;
    window.openDemonTowerModal = function (tab) {
        if (typeof origOpenDemonTowerModal === 'function') {
            origOpenDemonTowerModal(tab);
        }
        renderIntegratedTowerArena();
    };

    // Auto init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateForgingTopBarUI();
            updateAlchemyHeaderUI();
            updateCompanionUI();
        });
    } else {
        updateForgingTopBarUI();
        updateAlchemyHeaderUI();
        updateCompanionUI();
    }

})(window, document);
