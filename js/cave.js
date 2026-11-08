// ==========================================
// FILE: js/cave.js - Giao diện Bảng Điều Khiển Động Phủ (Cave Dwelling Hub)
// 4 Cards (2x2 Grid): Tụ Linh Trận • Linh Điền • Đan Các • Khí Các
// ==========================================

let activeSeedSlotId = null;

function isCaveHubOpen() {
    const backdrop = document.getElementById("hub-modal-backdrop");
    return Boolean(backdrop && !backdrop.classList.contains("hidden") && backdrop.dataset.activeHub === "cave");
}

function getCaveItemCount(itemId) {
    return state.inventory.find(item => item.id === itemId)?.count || 0;
}

function getCaveCatalogItem(itemId) {
    return DEFAULT_STATE.inventory.find(item => item.id === itemId) || state.inventory.find(item => item.id === itemId) || { id: itemId, name: itemId };
}

function getCavePlotCountdownSeconds(plot) {
    if (!plot.herbId || plot.progress >= 100 || !plot.speed) return 0;
    const effectiveSpeed = plot.speed;
    return Math.max(1, Math.ceil((100 - plot.progress) / effectiveSpeed));
}

function formatCavePlotTimer(seconds) {
    if (seconds <= 0) return "Đã chín";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}s`;
}

function getCaveHerbStageClass(progress) {
    if (progress >= 100) return "fa-spa scale-110 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]";
    if (progress >= 60) return "fa-leaf scale-100 text-emerald-400";
    if (progress >= 25) return "fa-seedling scale-90 text-teal-400";
    return "fa-seedling scale-75 text-slate-400";
}

function getAlchemySuccessRate(recipe) {
    const fireBonus = (typeof getPillarLevel === "function" ? getPillarLevel("fire") : 0) * 0.02 * (typeof getPillarEfficiency === "function" ? getPillarEfficiency("fire") : 1);
    return Math.min(0.95, (recipe.baseChance || 0.7) + fireBonus);
}

// ---------- TƯƠNG TÁC CARD 1: TỤ LINH TRẬN ----------
function collectCaveSpiritPool() {
    const available = Math.floor(state.linhKhi || 0);
    if (available <= 0) {
        addLog("Bể chứa Linh Khí đang cạn, hãy chờ Tụ Linh Trận hội tụ thêm!", "text-amber-300");
        playSound("thunder");
        return;
    }
    state.linhKhi = Math.max(0, state.linhKhi - available);
    const gained = addExp(available);
    playSound("qi");
    if (typeof spawnFloatingText === "function") {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 40, `+${gained.gainedAmount.toLocaleString("vi-VN")} Tu Vi`, "text-jade-300");
    }
    addLog(`[Tụ Linh Trận] Thu thập <span class="text-jade-300 font-bold">${available.toLocaleString("vi-VN")} Linh Khí</span> từ bể chứa, chuyển hóa thành <span class="text-gold-300 font-bold">+${gained.gainedAmount.toLocaleString("vi-VN")} Tu Vi</span>!`);
    updateHUD();
    saveGameState();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

function upgradeCaveSpiritArray() {
    const cost = state.arrayLevel * CAVE_HUB_RULES.arrayUpgradeBaseCost;
    if (state.stones < cost) {
        addLog(`Không đủ Linh Thạch để nâng cấp Tụ Linh Trận (Cần ${cost.toLocaleString("vi-VN")} Linh Thạch).`, "text-rose-400");
        playSound("thunder");
        return;
    }
    state.stones -= cost;
    state.arrayLevel++;
    playSound("bell");
    addLog(`[Tụ Linh Trận] Thăng lên <span class="text-gold-300 font-bold">Cấp ${state.arrayLevel}</span>! Tốc độ tụ khí và sức chứa bể Linh Khí tăng +25%.`, "text-emerald-300");
    updateHUD();
    saveGameState();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

// ---------- TƯƠNG TÁC CARD 2: LINH ĐIỀN ----------
function openCaveSeedPicker(plotId) {
    activeSeedSlotId = activeSeedSlotId === plotId ? null : plotId;
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

function plantCaveSeed(plotId, herbId) {
    const plot = state.farmPlots.find(p => p.id === plotId);
    const seed = CAVE_HUB_RULES.seeds.find(s => s.herbId === herbId);
    if (!plot || !seed) return;
    plot.herbId = seed.herbId;
    plot.herbName = seed.herbName;
    plot.progress = 5;
    plot.speed = seed.speed;
    activeSeedSlotId = null;
    playSound("qi");
    addLog(`[Linh Điền] Đã gieo hạt <span class="text-emerald-300 font-semibold">${seed.herbName}</span> tại Ô đất #${plot.id}.`);
    saveGameState();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

function quickHarvestCaveFarm() {
    const ripePlots = state.farmPlots.filter(plot => plot.herbId && plot.progress >= 100);
    if (!ripePlots.length) {
        addLog("Chưa có linh thảo nào chín để thu hoạch nhanh!", "text-amber-300");
        playSound("thunder");
        return;
    }
    const woodBonus = 1 + (typeof getPillarLevel === "function" ? getPillarLevel("wood") : 0) * 0.02 * (typeof getPillarEfficiency === "function" ? getPillarEfficiency("wood") : 1);
    const isSuppressed = typeof isHeavenlySuppressed === "function" && isHeavenlySuppressed();
    const harvestSummary = {};
    ripePlots.forEach(plot => {
        let count = Math.max(2, Math.floor(2 * woodBonus));
        if (isSuppressed) {
            count = Math.max(1, Math.floor(count * 0.1));
        }
        let invItem = state.inventory.find(i => i.id === plot.herbId);
        if (!invItem) {
            invItem = structuredClone(getCaveCatalogItem(plot.herbId));
            invItem.count = 0;
            state.inventory.push(invItem);
        }
        invItem.count += count;
        harvestSummary[plot.herbName] = (harvestSummary[plot.herbName] || 0) + count;
        plot.herbId = null;
        plot.herbName = "Trống";
        plot.progress = 0;
        plot.speed = 0;
    });
    const summaryText = Object.entries(harvestSummary).map(([name, qty]) => `${qty} ${name}`).join(", ");
    playSound("bell");
    addLog(`[Linh Điền] Thu hoạch nhanh thành công: <span class="text-emerald-400 font-bold">${summaryText}</span>!`);
    updateHUD();
    saveGameState();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

function expandCaveFarmPlot() {
    if (state.farmPlots.length >= CAVE_HUB_RULES.maxFarmPlots) {
        addLog(`Linh Điền đã đạt giới hạn tối đa (${CAVE_HUB_RULES.maxFarmPlots} ô đất)!`, "text-amber-300");
        return;
    }
    const cost = state.farmPlots.length * CAVE_HUB_RULES.farmExpandBaseCost;
    if (state.stones < cost) {
        addLog(`Không đủ Linh Thạch để khai khẩn ô đất mới (Cần ${cost.toLocaleString("vi-VN")} Linh Thạch).`, "text-rose-400");
        playSound("thunder");
        return;
    }
    state.stones -= cost;
    const nextId = state.farmPlots.length + 1;
    state.farmPlots.push({ id: nextId, herbId: null, herbName: "Trống", progress: 0, speed: 0 });
    playSound("bell");
    addLog(`[Linh Điền] Khai khẩn thành công <span class="text-emerald-300 font-bold">Ô đất #${nextId}</span> (-${cost.toLocaleString("vi-VN")} Linh Thạch)!`, "text-emerald-300");
    updateHUD();
    saveGameState();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

// ---------- TƯƠNG TÁC CARD 3: ĐAN CÁC (ĐAN PHỔ POPUP) ----------
function openCaveAlchemyPopup() {
    if (state.realmIndex < CAVE_HUB_RULES.alchemyUnlockRealmIndex) {
        addLog("🔒 Đan Các yêu cầu đạt cảnh giới Trúc Cơ - Sơ Kỳ để mở khóa!", "text-amber-300");
        return;
    }
    const backdrop = document.getElementById("center-modal-backdrop");
    const box = document.getElementById("center-modal-box");
    if (!backdrop || !box) return;
    backdrop.classList.remove("hidden");
    backdrop.classList.add("flex");
    renderCaveAlchemyPopup();
}

function renderCaveAlchemyPopup() {
    const box = document.getElementById("center-modal-box");
    if (!box) return;
    const recipesHtml = ALCHEMY_RECIPES.map(recipe => {
        const chancePct = Math.round(getAlchemySuccessRate(recipe) * 100);
        const canCraft = recipe.materials.every(mat => getCaveItemCount(mat.itemId) >= mat.count);
        const matsHtml = recipe.materials.map(mat => {
            const owned = getCaveItemCount(mat.itemId);
            const item = getCaveCatalogItem(mat.itemId);
            const enough = owned >= mat.count;
            return `<span class="cave-recipe-mat ${enough ? "is-enough" : "is-missing"}">${item.name}: ${owned}/${mat.count}</span>`;
        }).join("");
        const ownedPill = getCaveItemCount(recipe.pillId);
        return `
            <article class="cave-recipe-card">
                <div class="cave-recipe-card__main">
                    <div class="flex items-center justify-between gap-2.5">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-lg overflow-hidden border border-amber-500/30 shrink-0 bg-slate-950 flex items-center justify-center shadow-md">
                                <img src="./assets/images/item_qi_pill_bottle.jpg" alt="${recipe.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gold-300 font-serif">${recipe.name} <span class="text-[11px] font-mono text-slate-400">(Đang có: ${ownedPill})</span></h4>
                                <p class="text-[11px] text-slate-400 font-mono">Dược Phương Thượng Thừa</p>
                            </div>
                        </div>
                        <span class="cave-chance-badge shrink-0"><i class="fa-solid fa-fire-flame-curved mr-1"></i>Tỷ lệ: ${chancePct}%</span>
                    </div>
                    <p class="text-xs text-slate-300 mt-1">${recipe.desc}</p>
                    <div class="cave-recipe-mats mt-2">${matsHtml}</div>
                </div>
                <button type="button" onclick="craftCaveRecipe('${recipe.id}')" class="cave-action-btn cave-action-btn--jade mt-3 w-full" ${canCraft ? "" : "disabled"}>
                    <i class="fa-solid fa-fire-burner mr-1"></i>${canCraft ? "Khởi Lò Luyện Đan" : "Thiếu Nguyên Liệu"}
                </button>
            </article>`;
    }).join("");

    box.innerHTML = `
        <div class="p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-gold-500/25 pb-3">
                <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-fire-burner text-amber-400 text-lg"></i>
                    <div>
                        <h3 class="font-serif text-base font-bold text-gold-300">Vạn Dược Tiên Đỉnh • Đan Các</h3>
                        <p class="text-[11px] text-slate-400">Khai lò luyện chế linh đan diệu dược, điều hòa đan độc</p>
                    </div>
                </div>
                <button type="button" onclick="closeCenterModal()" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 flex items-center justify-center">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
                <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-biohazard text-rose-400"></i> Đan Độc Kinh Mạch:</span>
                <span class="${(state.danDoc || 0) >= 70 ? 'text-rose-400 font-bold animate-pulse' : ((state.danDoc || 0) >= 30 ? 'text-amber-300' : 'text-emerald-400')} font-bold">${state.danDoc || 0}/100%</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">${recipesHtml}</div>
        </div>`;
}

function craftCaveRecipe(recipeId) {
    if (state.realmIndex < CAVE_HUB_RULES.alchemyUnlockRealmIndex) return;
    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    const hasAll = recipe.materials.every(mat => getCaveItemCount(mat.itemId) >= mat.count);
    if (!hasAll) {
        addLog("Không đủ nguyên liệu dược thảo theo Đan Phổ!", "text-rose-400");
        playSound("thunder");
        return;
    }
    recipe.materials.forEach(mat => {
        const inv = state.inventory.find(i => i.id === mat.itemId);
        if (inv) inv.count = Math.max(0, (inv.count || 0) - mat.count);
    });
    const successRate = getAlchemySuccessRate(recipe);
    if (Math.random() > successRate) {
        playSound("thunder");
        addLog(`💨 [Đan Các] Lửa lò bất ổn, luyện chế <span class="text-amber-300">${recipe.name}</span> thất bại (Tỷ lệ ${Math.round(successRate * 100)}%).`, "text-rose-400");
    } else {
        let pill = state.inventory.find(i => i.id === recipe.pillId);
        if (!pill) {
            pill = structuredClone(getCaveCatalogItem(recipe.pillId));
            pill.count = 0;
            state.inventory.push(pill);
        }
        pill.count += 1;
        playSound("bell");
        addLog(`🔥 [Đan Các] Đan hương ngào ngạt! Luyện thành công <span class="text-gold-300 font-bold">1 ${recipe.name}</span>!`, "text-emerald-300");
    }
    updateHUD();
    saveGameState();
    renderCaveAlchemyPopup();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

// ---------- TƯƠNG TÁC CARD 4: KHÍ CÁC (LÒ RÈN POPUP) ----------
function openCaveForgePopup() {
    if (state.realmIndex < CAVE_HUB_RULES.forgeUnlockRealmIndex) {
        addLog("🔒 Khí Các yêu cầu đạt cảnh giới Trúc Cơ - Trung Kỳ để mở khóa!", "text-amber-300");
        return;
    }
    const backdrop = document.getElementById("center-modal-backdrop");
    const box = document.getElementById("center-modal-box");
    if (!backdrop || !box) return;
    backdrop.classList.remove("hidden");
    backdrop.classList.add("flex");
    renderCaveForgePopup();
}

function renderCaveForgePopup() {
    const box = document.getElementById("center-modal-box");
    if (!box) return;
    const recipesHtml = FORGE_RECIPES.map(recipe => {
        const matsOk = recipe.materials.every(mat => getCaveItemCount(mat.itemId) >= mat.count);
        const stonesOk = state.stones >= recipe.stoneCost;
        const canForge = matsOk && stonesOk;
        const matsHtml = [
            `<span class="cave-recipe-mat ${stonesOk ? "is-enough" : "is-missing"}">Linh Thạch: ${state.stones.toLocaleString("vi-VN")}/${recipe.stoneCost}</span>`,
            ...recipe.materials.map(mat => {
                const owned = getCaveItemCount(mat.itemId);
                const item = getCaveCatalogItem(mat.itemId);
                return `<span class="cave-recipe-mat ${owned >= mat.count ? "is-enough" : "is-missing"}">${item.name}: ${owned}/${mat.count}</span>`;
            })
        ].join("");
        const targetCatalogItem = getCaveCatalogItem(recipe.targetId);
        const forgeImg = recipe.image || targetCatalogItem?.image || (recipe.targetId === 'sword_bamboo' ? './assets/images/item_bamboo_sword.jpg' : './assets/images/mirror_bagua.jpg');
        return `
            <article class="cave-recipe-card">
                <div class="cave-recipe-card__main">
                    <div class="flex items-center justify-between gap-2.5">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-lg overflow-hidden border border-cyan-500/30 shrink-0 bg-slate-950 flex items-center justify-center shadow-md">
                                <img src="${forgeImg}" alt="${recipe.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-cyan-200 font-serif">${recipe.name}</h4>
                                <p class="text-[11px] text-slate-400 font-mono">Bản Mệnh Đúc Tạo</p>
                            </div>
                        </div>
                        <span class="cave-chance-badge shrink-0"><i class="fa-solid fa-hammer mr-1"></i>Tỷ lệ: ${Math.round(recipe.chance * 100)}%</span>
                    </div>
                    <p class="text-xs text-slate-300 mt-1">${recipe.desc}</p>
                    <div class="cave-recipe-mats mt-2">${matsHtml}</div>
                </div>
                <button type="button" onclick="forgeCaveRecipe('${recipe.id}')" class="cave-action-btn cave-action-btn--gold mt-3 w-full" ${canForge ? "" : "disabled"}>
                    <i class="fa-solid fa-hammer mr-1"></i>${canForge ? "Khởi Lò Rèn Đúc" : "Thiếu Nguyên Liệu"}
                </button>
            </article>`;
    }).join("");

    box.innerHTML = `
        <div class="p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-gold-500/25 pb-3">
                <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-hammer text-cyan-300 text-lg"></i>
                    <div>
                        <h3 class="font-serif text-base font-bold text-gold-300">Thiên Công Khí Các • Lò Rèn Pháp Bảo</h3>
                        <p class="text-[11px] text-slate-400">Ghép Huyền Thiết Khoáng và Linh Thảo để rèn đúc & cường hóa Pháp Bảo</p>
                    </div>
                </div>
                <button type="button" onclick="closeCenterModal()" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 flex items-center justify-center">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">${recipesHtml}</div>
        </div>`;
}

function forgeCaveRecipe(recipeId) {
    if (state.realmIndex < CAVE_HUB_RULES.forgeUnlockRealmIndex) return;
    const recipe = FORGE_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    const matsOk = recipe.materials.every(mat => getCaveItemCount(mat.itemId) >= mat.count);
    if (!matsOk || state.stones < recipe.stoneCost) {
        addLog("Không đủ khoáng thạch hoặc Linh Thạch để rèn đúc!", "text-rose-400");
        playSound("thunder");
        return;
    }
    state.stones = Math.max(0, (state.stones || 0) - recipe.stoneCost);
    recipe.materials.forEach(mat => {
        const inv = state.inventory.find(i => i.id === mat.itemId);
        if (inv) inv.count = Math.max(0, (inv.count || 0) - mat.count);
    });
    if (Math.random() > recipe.chance) {
        playSound("thunder");
        addLog(`💥 [Khí Các] Hỏa hầu quá mạnh, rèn đúc <span class="text-amber-300">${recipe.name}</span> thất bại!`, "text-rose-400");
    } else {
        if (recipe.giveItem) {
            let item = state.inventory.find(i => i.id === recipe.targetId);
            if (!item) {
                item = structuredClone(getCaveCatalogItem(recipe.targetId));
                item.count = 0;
                state.inventory.push(item);
            }
            item.count += 1;
        }
        if (recipe.statBonus) {
            if (recipe.statBonus.atk) state.atk += recipe.statBonus.atk;
            if (recipe.statBonus.def) state.def += recipe.statBonus.def;
            if (recipe.statBonus.maxHp) {
                state.maxHp += recipe.statBonus.maxHp;
                state.hp += recipe.statBonus.maxHp;
            }
        }
        playSound("sword");
        addLog(`⚒️ [Khí Các] Kim quang bùng nổ! Rèn luyện thành công <span class="text-gold-300 font-bold">${recipe.name}</span>!`, "text-emerald-300");
    }
    updateHUD();
    saveGameState();
    renderCaveForgePopup();
    if (isCaveHubOpen()) renderCaveHubDashboard();
}

// ---------- RENDER BẢNG ĐIỀU KHIỂN ĐỘNG PHỦ (REDESIGNED HERO 1 - SUB 3 LAYOUT) ----------
function renderCaveHubDashboard(activeTab = null) {
    const content = document.getElementById("hub-modal-content");
    const tabs = document.getElementById("hub-modal-tabs");
    const title = document.getElementById("hub-modal-title");
    if (!content) return;
    const caveTitleMap = {
        array: "🌀 ĐỘNG PHỦ • TỤ LINH TRẬN",
        farm: "🌿 ĐỘNG PHỦ • LINH ĐIỀN",
        alchemy: "🧪 ĐỘNG PHỦ • ĐAN CÁC",
        forge: "⚒️ ĐỘNG PHỦ • KHÍ CÁC"
    };
    if (title) title.textContent = caveTitleMap[activeTab] || "🏠 ĐỘNG PHỦ TU TIÊN";
    if (tabs) {
        tabs.innerHTML = "";
        tabs.classList.add("hidden");
        tabs.style.setProperty("display", "none", "important");
    }

    const hubCard = document.getElementById("hub-modal-card");
    if (hubCard) hubCard.classList.add("hub-modal--wide");

    // 1. Dữ liệu Tụ Linh Trận
    const poolCurrent = Math.floor(state.linhKhi || 0);
    const poolMax = Math.max(1, Math.floor(getLinhKhiMax()));
    const poolPct = Math.min(100, Math.round((poolCurrent / poolMax) * 100));
    const poolRate = getLinhKhiRate();
    const arrayUpgradeCost = state.arrayLevel * CAVE_HUB_RULES.arrayUpgradeBaseCost;
    const rawQiGen = REALMS[state.realmIndex].rate * (1 + (state.arrayLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel);
    const isHaGioi = !state.currentWorld || state.currentWorld === 'HaGioi' || String(state.currentWorld).includes('Hạ Giới');
    const isNerfed = isHaGioi && rawQiGen > 500;

    // 2. Dữ liệu Linh Điền
    const expandCost = state.farmPlots.length * CAVE_HUB_RULES.farmExpandBaseCost;
    const hasRipe = state.farmPlots.some(p => p.herbId && p.progress >= 100);
    const plotsHtml = state.farmPlots.map(plot => {
        if (!plot.herbId) {
            const picking = activeSeedSlotId === plot.id;
            return `
                <div class="cave-farm-slot is-empty p-1.5 rounded-lg border border-slate-700/40 bg-slate-950/40">
                    <div class="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Ô #${plot.id}</span>
                        <i class="fa-solid fa-seedling text-slate-600 text-[10px]"></i>
                    </div>
                    ${picking ? `
                        <div class="grid grid-cols-1 gap-1 mt-1">
                            ${CAVE_HUB_RULES.seeds.map(seed => `
                                <button type="button" onclick="plantCaveSeed(${plot.id}, '${seed.herbId}')" class="cave-seed-option text-[10px] py-0.5 px-1 rounded bg-slate-800 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-300 flex items-center gap-1 transition">
                                    <i class="fa-solid ${seed.icon} text-emerald-400 text-[10px]"></i><span class="truncate">${seed.herbName}</span>
                                </button>
                            `).join("")}
                        </div>
                    ` : `
                        <button type="button" onclick="openCaveSeedPicker(${plot.id})" class="cave-seed-btn text-[10px] py-0.5 w-full mt-1 rounded bg-slate-800/60 hover:bg-emerald-950/80 text-slate-400 hover:text-emerald-300 border border-slate-700/30 hover:border-emerald-500/40 transition">
                            + Gieo hạt
                        </button>
                    `}
                </div>`;
        }
        const remSec = getCavePlotCountdownSeconds(plot);
        const isRipe = plot.progress >= 100;
        return `
            <div class="cave-farm-slot ${isRipe ? "is-ripe border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.2)]" : "is-growing border-slate-700/40"} p-1.5 rounded-lg border bg-slate-950/40">
                <div class="flex items-center justify-between gap-1">
                    <span class="text-[10px] font-bold text-emerald-200 truncate">${plot.herbName}</span>
                    <i class="fa-solid ${getCaveHerbStageClass(plot.progress)} text-[10px] transition-transform"></i>
                </div>
                <div class="cave-progress h-1 mt-1 bg-slate-800 rounded-full overflow-hidden">
                    <div data-farm-fill="${plot.id}" class="cave-progress__fill cave-progress__fill--emerald h-full bg-emerald-400 rounded-full" style="width:${Math.min(100, plot.progress)}%"></div>
                </div>
                <div class="flex items-center justify-between text-[9px] mt-0.5 font-mono">
                    <span data-farm-pct="${plot.id}" class="text-slate-400">${Math.floor(plot.progress)}%</span>
                    <span data-farm-timer="${plot.id}" class="${isRipe ? "text-gold-300 font-bold" : "text-teal-300"}">${formatCavePlotTimer(remSec)}</span>
                </div>
            </div>`;
    }).join("");

    // 3. Dữ liệu Đan Các
    const alchemyUnlocked = state.realmIndex >= CAVE_HUB_RULES.alchemyUnlockRealmIndex;
    const avgAlchemyRate = Math.round(getAlchemySuccessRate(ALCHEMY_RECIPES[0]) * 100);

    // 4. Dữ liệu Khí Các
    const forgeUnlocked = state.realmIndex >= CAVE_HUB_RULES.forgeUnlockRealmIndex;
    const oreCount = getCaveItemCount("stone_ore");

    content.innerHTML = `
        <div class="cave-redesign-container flex flex-col gap-4 w-full">
            <div class="page-header-title flex items-center justify-between">
                <h2>${caveTitleMap[activeTab] || "🏠 ĐỘNG PHỦ TU TIÊN"}</h2>
                <button type="button" onclick="openDongPhuHub('${activeTab ? (activeTab === 'alchemy' ? 'dp-luyen-dan' : activeTab === 'forge' ? 'dp-luyen-khi' : activeTab === 'companion' ? 'dp-khue-phong' : 'dp-gia-vien') : 'dp-gia-vien'}')" class="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold hover:scale-105 transition shadow cursor-pointer">
                    <i class="fa-solid fa-mountain mr-1"></i> Thái Ất Động Phủ (Hub 2 Cột)
                </button>
            </div>
            <!-- ========================================================
                 PHẦN TOP: TỤ LINH TRẬN (HERO SECTION - CHIẾM 45-50% MODAL)
                 Độc quyền toàn bộ chiều ngang w-full.
                 Tâm điểm: Khối cầu Linh Khí Châu (Qi Orb) với chất lỏng sóng sánh dâng lên,
                 2-3 vòng ma trận Bát Quái Cổ Tự xoay ngược chiều, vệt sáng hút khí,
                 con số neon rực rỡ ở tâm, badge tốc độ lơ lửng và nút Thu Thập viền vàng đập nhịp tim.
                 ======================================================== -->
            <section class="cave-hero-section relative w-full rounded-2xl overflow-hidden p-5 sm:p-6 shadow-[0_0_35px_rgba(20,184,166,0.35)] flex flex-col justify-between">
                <!-- NỀN BANNER ĐỘNG PHỦ & RADIAL GRADIENT XANH NGỌC -->
                <img src="./assets/images/bg_lofi_dongphu.jpg" alt="Động Phủ Tiên Gia" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none filter blur-[1px] mix-blend-luminosity z-0" onerror="this.style.display='none'">
                <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/35 via-slate-950/85 to-slate-950 z-0"></div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

                <!-- BỐ CỤC 3 CỘT CÂN ĐỐI (TRÁI - TÂM ĐIỂM QI ORB - PHẢI) -->
                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                    
                    <!-- CÁNH TRÁI: TIÊU ĐỀ, CẤP ĐỘ TRẬN & NÚT NÂNG CẤP -->
                    <div class="flex flex-col items-center md:items-start text-center md:text-left gap-3 flex-1 order-2 md:order-1">
                        <div>
                            <div class="flex items-center gap-2 justify-center md:justify-start">
                                <span class="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">Trung Tâm Năng Lượng Động Phủ</span>
                                <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-gold-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.25)]">Cấp ${state.arrayLevel}</span>
                            </div>
                            <h2 class="text-xl sm:text-2xl font-serif font-black text-white flex items-center gap-2.5 mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                <i class="fa-solid fa-dharmachakra text-cyan-400"></i>
                                <span>Tụ Linh Trận</span>
                            </h2>
                            <p class="text-[11px] text-slate-400 max-w-xs mt-1">Hội tụ thiên địa linh khí, ngưng kết thành chất lỏng thuần khiết truyền tống vào đan điền.</p>
                        </div>

                        <!-- BADGE TỐC ĐỘ HỘI TỤ LƠ LỬNG (+175 Linh Khí / s) -->
                        <div class="cave-speed-badge-floating">
                            <i class="fa-solid fa-bolt-lightning text-amber-400 animate-pulse text-xs"></i>
                            <span class="text-[11px] text-slate-300 font-medium">Hội tụ:</span>
                            <span id="cave-pool-rate" class="text-sm font-mono font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">+${poolRate.toLocaleString("vi-VN")} / s${isNerfed ? ' <span class="text-[10px] text-amber-400 font-normal block sm:inline">(Uy áp Hạ Giới: Hiệu suất tụ linh suy giảm)</span>' : ''}</span>
                        </div>

                        <!-- NÚT NÂNG CẤP TRẬN PHÁP -->
                        <button type="button" onclick="upgradeCaveSpiritArray()" class="py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 text-xs sm:text-sm font-bold shadow-md transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer mt-1">
                            <i class="fa-solid fa-arrow-up-right-dots text-amber-400"></i>
                            <span>Nâng Cấp Trận (${arrayUpgradeCost} LT)</span>
                        </button>
                    </div>

                    <!-- TÂM ĐIỂM: KHỐI CẦU LINH KHÍ CHÂU (QI ORB) VỚI 2-3 VÒNG TRẬN PHÁP XOAY NGƯỢC CHIỀU -->
                    <div class="cave-qi-stage order-1 md:order-2">
                        <!-- Vệt sáng tụ khí hướng tâm -->
                        <div class="qi-converge-rays"></div>

                        <!-- SVG Definitions cho hiệu ứng Glow và Gradient phát sáng -->
                        <svg class="absolute w-0 h-0 pointer-events-none" aria-hidden="true" focusable="false">
                            <defs>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="qiLiquidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.9" />
                                    <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.95" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <!-- Vòng 1 (Ngoại Trận): <circle> lớn, stroke-dasharray="10 20", stroke #2dd4bf, filter="url(#glow)", class quay thuận (animate-spin-slow) -->
                        <div class="cave-array-ring cave-array-ring--outer animate-spin-slow animate-array-cw">
                            <svg viewBox="0 0 280 280" class="w-full h-full drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]">
                                <!-- Đường vành đai ngoài cùng stroke-dasharray 10 20 -->
                                <circle cx="140" cy="140" r="132" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="10 20" filter="url(#glow)"></circle>
                                <circle cx="140" cy="140" r="120" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4 6" opacity="0.6"></circle>
                                <!-- 8 Quẻ Bát Quái đặt tại các hướng -->
                                <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☰</text>
                                <text x="222" y="58" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☱</text>
                                <text x="256" y="145" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☲</text>
                                <text x="222" y="232" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☳</text>
                                <text x="140" y="266" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☷</text>
                                <text x="58" y="232" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☶</text>
                                <text x="24" y="145" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☵</text>
                                <text x="58" y="58" text-anchor="middle" font-size="14" font-weight="bold" fill="#2dd4bf">☴</text>
                            </svg>
                        </div>

                        <!-- Vòng 2 (Nội Trận): Dùng <path> vẽ họa tiết bát quái đơn giản (các nét cắt), stroke #0ea5e9, filter="url(#glow)", gán class quay ngược (spin-reverse) -->
                        <div class="cave-array-ring cave-array-ring--inner spin-reverse animate-array-ccw">
                            <svg viewBox="0 0 240 240" class="w-full h-full drop-shadow-[0_0_10px_rgba(14,165,233,0.7)]">
                                <!-- Các nét cắt họa tiết Bát Quái bằng path -->
                                <path d="M40,40 L200,40 L200,200 L40,200 Z" fill="none" stroke="#0ea5e9" stroke-width="1.4" opacity="0.75" filter="url(#glow)"></path>
                                <path d="M120,30 L210,120 L120,210 L30,120 Z" fill="none" stroke="#2dd4bf" stroke-width="1.2" opacity="0.65" filter="url(#glow)"></path>
                                <path d="M60,120 L180,120 M120,60 L120,180 M78,78 L162,162 M78,162 L162,78" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="6 4" opacity="0.6"></path>
                                <circle cx="120" cy="120" r="102" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="8 6" filter="url(#glow)"></circle>
                                <circle cx="120" cy="18" r="3.5" fill="#2dd4bf" filter="url(#glow)"></circle>
                                <circle cx="222" cy="120" r="3.5" fill="#2dd4bf" filter="url(#glow)"></circle>
                                <circle cx="120" cy="222" r="3.5" fill="#2dd4bf" filter="url(#glow)"></circle>
                                <circle cx="18" cy="120" r="3.5" fill="#2dd4bf" filter="url(#glow)"></circle>
                            </svg>
                        </div>

                        <!-- KHỐI CẦU LINH KHÍ CHÂU (QI ORB) -->
                        <div class="cave-qi-orb relative overflow-hidden rounded-full border border-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.5)]">
                            <!-- SVG Quả Cầu Phát Sáng với Stroke #2dd4bf & #0ea5e9, filter="url(#glow)" -->
                            <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#2dd4bf" stroke-width="1.5" filter="url(#glow)"></circle>
                                <circle cx="50" cy="50" r="44" fill="none" stroke="#0ea5e9" stroke-width="1" opacity="0.7"></circle>
                            </svg>

                            <!-- Chất lỏng sóng sánh dâng lên bên trong -->
                            <div id="cave-pool-liquid" class="cave-qi-orb-liquid transition-all duration-500 bg-gradient-to-t from-sky-600/90 via-teal-500/85 to-teal-300/90" style="height: ${poolPct}%;">
                                <!-- Dual Wave Rotator nhấp nhô đỉnh sóng -->
                                <div class="cave-qi-wave-rotator"></div>
                                <div class="cave-qi-wave-rotator--back"></div>
                            </div>
                            <!-- Alias cave-pool-bar ẩn để bảo toàn code cũ -->
                            <div id="cave-pool-bar" class="hidden" style="width: ${poolPct}%;"></div>

                            <!-- THÔNG SỐ CHÍNH GIỮA TÂM KHỐI CẦU -->
                            <div class="cave-qi-orb-core z-20">
                                <span class="text-[9px] uppercase tracking-widest text-teal-200/90 font-extrabold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mb-0.5">Linh Khí Châu</span>
                                <div id="cave-pool-text" class="font-mono font-black text-lg sm:text-xl text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.95)] leading-tight tracking-tight">
                                    ${poolCurrent.toLocaleString("vi-VN")} / ${poolMax.toLocaleString("vi-VN")}
                                </div>
                                <span id="cave-pool-text-pct" class="text-xs sm:text-sm font-mono font-extrabold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] mt-0.5">
                                    ${poolPct}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- CÁNH PHẢI: NÚT THU THẬP VIỀN VÀNG ĐẬP NHỊP TIM & TRẠNG THÁI -->
                    <div class="flex flex-col items-center md:items-end text-center md:text-right gap-3 flex-1 order-3">
                        <div>
                            <span class="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Trữ lượng trận pháp</span>
                            <div class="text-base font-mono font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                                ${poolPct >= 100 ? "⚠️ Tràn Bể Linh Khí!" : "Đang Tích Tụ..."}
                            </div>
                            <span class="text-[10px] text-slate-400 block mt-0.5">Linh khí chuyển trực tiếp thành Tu Vi khi thu nạp</span>
                        </div>

                        <!-- NÚT THU THẬP VIỀN VÀNG RỰC ĐẬP NHỊP TIM LIÊN TỤC -->
                        <button type="button" onclick="collectCaveSpiritPool()" class="cave-collect-btn-golden w-full sm:w-auto">
                            <i class="fa-solid fa-hand-sparkles text-xl sm:text-2xl animate-bounce"></i>
                            <span>THU THẬP</span>
                        </button>
                    </div>
                </div>
            </section>

            <!-- BANNER BẾ QUAN TƯ QUÁ (TĨNH TÂM ĐOẠN MA) -->
            <div class="cave-meditation-banner relative w-full rounded-2xl p-3 sm:p-4 border ${state.beQuanTuQua?.active ? 'border-teal-500/70 bg-gradient-to-r from-teal-950/80 via-slate-900/90 to-teal-950/80 shadow-[0_0_25px_rgba(20,184,166,0.25)]' : 'border-slate-800 bg-slate-950/70'} flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${state.beQuanTuQua?.active ? 'bg-teal-500/25 text-teal-300 border border-teal-400/50 animate-pulse' : 'bg-slate-900 text-slate-400 border border-slate-800'} flex items-center justify-center text-lg flex-shrink-0">
                        <i class="fa-solid fa-om"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs sm:text-sm font-bold text-slate-100 font-serif">Bế Quan Tư Quá</span>
                            <span class="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${state.beQuanTuQua?.active ? 'bg-teal-500/20 text-teal-300 border border-teal-400/50 animate-pulse' : 'bg-slate-800 text-slate-400'}">
                                ${state.beQuanTuQua?.active ? 'Đang Bế Quan (+5 Đạo Tâm / giờ)' : 'Chưa Nhập Định'}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                            ${state.beQuanTuQua?.active ? 'Ngưng nạp Tu Vi để gột rửa tạp niệm, xua tan Tâm Ma và phục hồi Đạo Tâm.' : 'Treo máy không nhận Tu Vi nhưng mỗi giờ hồi phục 5 Đạo Tâm.'}
                        </p>
                    </div>
                </div>
                <button type="button" onclick="toggleBeQuanTuQua()" class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${state.beQuanTuQua?.active ? 'bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border border-teal-400/60 shadow-[0_0_12px_rgba(45,212,191,0.3)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
                    <i class="fa-solid ${state.beQuanTuQua?.active ? 'fa-person-walking-arrow-right' : 'fa-hand-holding-hand'}"></i>
                    <span>${state.beQuanTuQua?.active ? 'Xuất Quan' : 'Nhập Định Tư Quá'}</span>
                </button>
            </div>

            <!-- ========================================================
                 PHẦN BOTTOM: 3 TÍNH NĂNG PHỤ TRỢ (GRID-COLS-3 ĐỀU NHAU)
                 Các Card nhỏ gọn hơn, background slate-900/50, viền mỏng sáng khi hover,
                 nút tối giản gọn gàng làm nền suy tôn cho Tụ Linh Trận
                 ======================================================== -->
            <div class="cave-sub-features-grid grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
                <!-- CARD 1: VƯỜN DƯỢC THẢO (LINH ĐIỀN) -->
                <article class="cave-sub-card cave-sub-card--farm group">
                    <header class="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-seedling text-emerald-400 text-sm"></i>
                            <div>
                                <span class="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider block">Vườn Dược Thảo</span>
                                <h3 class="text-sm font-bold text-slate-200 font-serif">Linh Điền</h3>
                            </div>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">${state.farmPlots.length}/${CAVE_HUB_RULES.maxFarmPlots} Ô đất</span>
                    </header>
                    <div class="py-2.5 flex-1 flex flex-col justify-center">
                        <div class="cave-farm-grid grid grid-cols-2 gap-1.5 max-h-[150px] overflow-y-auto pr-1">${plotsHtml}</div>
                    </div>
                    <footer class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                        <button type="button" onclick="quickHarvestCaveFarm()" class="py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${hasRipe ? "ring-1 ring-gold-400" : ""}">
                            <i class="fa-solid fa-basket-shopping"></i> Thu Hoạch
                        </button>
                        <button type="button" onclick="expandCaveFarmPlot()" class="py-1.5 px-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer" ${state.farmPlots.length >= CAVE_HUB_RULES.maxFarmPlots ? "disabled" : ""}>
                            <i class="fa-solid fa-trowel"></i> ${state.farmPlots.length >= CAVE_HUB_RULES.maxFarmPlots ? "Tối Đa" : `Khai Khẩn (${expandCost} LT)`}
                        </button>
                    </footer>
                </article>

                <!-- CARD 2: LÒ LUYỆN ĐAN (ĐAN CÁC) -->
                <article class="cave-sub-card cave-sub-card--alchemy ${alchemyUnlocked ? "" : "is-locked"} group">
                    <header class="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-fire-burner ${alchemyUnlocked ? "text-amber-400" : "text-slate-500"} text-sm"></i>
                            <div>
                                <span class="text-[10px] uppercase ${alchemyUnlocked ? "text-amber-400" : "text-slate-500"} font-semibold tracking-wider block">Lò Luyện Đan</span>
                                <h3 class="text-sm font-bold ${alchemyUnlocked ? "text-slate-200" : "text-slate-400"} font-serif">Đan Các</h3>
                            </div>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded ${alchemyUnlocked ? "bg-amber-950/80 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-400"}">${alchemyUnlocked ? "Bát Quái Lô" : "Chưa Mở"}</span>
                    </header>
                    ${alchemyUnlocked ? `
                        <div class="py-2.5 flex-1 flex flex-col justify-center space-y-2">
                            <div class="flex items-center gap-2.5">
                                <div class="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                                    <i class="fa-solid fa-fire-burner text-base animate-pulse"></i>
                                </div>
                                <div class="text-[11px] space-y-0.5 text-slate-300 flex-1">
                                    <div class="font-bold text-gold-200">Lò Bát Quái Đang Cháy</div>
                                    <div class="text-slate-400 text-[10px]">Linh Chi: <b class="text-emerald-300 font-mono">${getCaveItemCount("herb_spirit")}</b> · Huyết Sâm: <b class="text-purple-300 font-mono">${getCaveItemCount("herb_blood")}</b></div>
                                </div>
                            </div>
                            <div class="text-amber-300/90 font-mono text-[10px] bg-amber-950/30 p-1.5 rounded border border-amber-500/20 text-center">
                                Thành đan cơ bản: ~${avgAlchemyRate}%
                            </div>
                        </div>
                        <footer class="pt-2 border-t border-slate-800/80">
                            <button type="button" onclick="openCaveAlchemyPopup()" class="w-full py-1.5 px-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer">
                                <i class="fa-solid fa-book-medical"></i> Mở Đan Phổ
                            </button>
                        </footer>
                    ` : `
                        <div class="py-4 flex-1 flex flex-col items-center justify-center text-center">
                            <i class="fa-solid fa-lock text-slate-500 text-lg mb-1"></i>
                            <p class="text-xs font-bold text-amber-200/90">Yêu cầu Trúc Cơ Sơ Kỳ</p>
                            <span class="text-[10px] text-slate-400 mt-0.5">Đột phá Trúc Cơ để khai mở lò đan.</span>
                        </div>
                        <footer class="pt-2 border-t border-slate-800/80">
                            <button type="button" disabled class="w-full py-1.5 px-3 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <i class="fa-solid fa-lock"></i> Mở Đan Phổ (Khóa)
                            </button>
                        </footer>
                    `}
                </article>

                <!-- CARD 3: LÒ RÈN PHÁP BẢO (KHÍ CÁC) -->
                <article class="cave-sub-card cave-sub-card--forge ${forgeUnlocked ? "" : "is-locked"} group">
                    <header class="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-hammer ${forgeUnlocked ? "text-cyan-400" : "text-slate-500"} text-sm"></i>
                            <div>
                                <span class="text-[10px] uppercase ${forgeUnlocked ? "text-cyan-400" : "text-slate-500"} font-semibold tracking-wider block">Lò Rèn Pháp Bảo</span>
                                <h3 class="text-sm font-bold ${forgeUnlocked ? "text-slate-200" : "text-slate-400"} font-serif">Khí Các</h3>
                            </div>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded ${forgeUnlocked ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30" : "bg-slate-800 text-slate-400"}">${forgeUnlocked ? "Địa Hỏa Lô" : "Chưa Mở"}</span>
                    </header>
                    ${forgeUnlocked ? `
                        <div class="py-2.5 flex-1 flex flex-col justify-center space-y-2">
                            <div class="flex items-center gap-2.5">
                                <div class="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
                                    <i class="fa-solid fa-hammer text-base"></i>
                                </div>
                                <div class="text-[11px] space-y-0.5 text-slate-300 flex-1">
                                    <div class="font-bold text-cyan-200">Địa Hỏa Chú Kiếm Sẵn Sàng</div>
                                    <div class="text-slate-400 text-[10px]">Huyền Thiết Khoáng: <b class="text-cyan-300 font-mono">${oreCount}</b></div>
                                </div>
                            </div>
                            <div class="text-cyan-300/90 font-mono text-[10px] bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20 text-center">
                                Cường hóa & Đúc Pháp Bảo
                            </div>
                        </div>
                        <footer class="pt-2 border-t border-slate-800/80">
                            <button type="button" onclick="openCaveForgePopup()" class="w-full py-1.5 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer">
                                <i class="fa-solid fa-anvil"></i> Mở Lò Rèn
                            </button>
                        </footer>
                    ` : `
                        <div class="py-4 flex-1 flex flex-col items-center justify-center text-center">
                            <i class="fa-solid fa-lock text-slate-500 text-lg mb-1"></i>
                            <p class="text-xs font-bold text-cyan-200/90">Yêu cầu Trúc Cơ Trung Kỳ</p>
                            <span class="text-[10px] text-slate-400 mt-0.5">Đột phá Trung Kỳ để dẫn Địa Hỏa rèn đúc.</span>
                        </div>
                        <footer class="pt-2 border-t border-slate-800/80">
                            <button type="button" disabled class="w-full py-1.5 px-3 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <i class="fa-solid fa-lock"></i> Mở Lò Rèn (Khóa)
                            </button>
                        </footer>
                    `}
                </article>
            </div>
        </div>`;
}

// Cập nhật trực tiếp mức Linh Khí, tiến trình Linh Điền mỗi giây khi Modal Động Phủ đang mở
function tickCaveHubDashboard() {
    if (!isCaveHubOpen()) return;
    const poolText = document.getElementById("cave-pool-text");
    const poolLiquid = document.getElementById("cave-pool-liquid");
    const poolBar = document.getElementById("cave-pool-bar");
    const poolRate = document.getElementById("cave-pool-rate");
    const poolPctEl = document.getElementById("cave-pool-text-pct");

    const current = Math.floor(state.linhKhi || 0);
    const max = Math.max(1, Math.floor(getLinhKhiMax()));
    const pct = Math.min(100, Math.round((current / max) * 100));

    if (poolText) {
        poolText.textContent = `${current.toLocaleString("vi-VN")} / ${max.toLocaleString("vi-VN")}`;
    }
    if (poolLiquid) {
        poolLiquid.style.height = `${pct}%`;
    }
    if (poolBar) {
        poolBar.style.height = `${pct}%`;
        poolBar.style.width = `${pct}%`;
    }
    if (poolPctEl) {
        poolPctEl.textContent = `${pct}%`;
    }
    if (poolRate) {
        const rate = getLinhKhiRate();
        const rawRate = REALMS[state.realmIndex].rate * (1 + (state.arrayLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel);
        const isHa = !state.currentWorld || state.currentWorld === 'HaGioi' || String(state.currentWorld).includes('Hạ Giới');
        if (isHa && rawRate > 500) {
            poolRate.innerHTML = `+${rate.toLocaleString("vi-VN")} / s <span class="text-[10px] text-amber-400 font-normal block sm:inline">(Uy áp Hạ Giới: Hiệu suất tụ linh suy giảm)</span>`;
        } else {
            poolRate.textContent = `+${rate.toLocaleString("vi-VN")} / s`;
        }
    }

    // Cập nhật tiến độ Linh Điền mượt mà theo từng giây
    if (Array.isArray(state.farmPlots)) {
        state.farmPlots.forEach(plot => {
            const timerEl = document.querySelector(`[data-farm-timer="${plot.id}"]`);
            const fillEl = document.querySelector(`[data-farm-fill="${plot.id}"]`);
            const pctEl = document.querySelector(`[data-farm-pct="${plot.id}"]`);
            if (timerEl) {
                const remSec = getCavePlotCountdownSeconds(plot);
                const isRipe = plot.progress >= 100;
                timerEl.textContent = formatCavePlotTimer(remSec);
                timerEl.className = isRipe ? "text-gold-300 font-bold" : "text-teal-300";
            }
            if (fillEl) {
                fillEl.style.width = `${Math.min(100, plot.progress)}%`;
            }
            if (pctEl) {
                pctEl.textContent = `${Math.floor(plot.progress)}%`;
            }
        });
    }
}

function toggleBeQuanTuQua() {
    if (!state.beQuanTuQua) state.beQuanTuQua = { active: false, startTime: 0 };
    state.beQuanTuQua.active = !state.beQuanTuQua.active;
    if (state.beQuanTuQua.active) {
        state.beQuanTuQua.startTime = Date.now();
        if (typeof addLog === 'function') {
            addLog("🧘 <span class='text-teal-300 font-bold'>[Bế Quan Tư Quá]</span> Bắt đầu nhập định tĩnh tâm, buông bỏ chấp niệm. Tạm ngưng thu thập Tu Vi, mỗi giờ hồi phục 5 Đạo Tâm.", "text-teal-300 font-bold", "be-quan-tu-qua");
        }
    } else {
        if (typeof addLog === 'function') {
            addLog("✨ <span class='text-amber-300 font-bold'>[Xuất Quan]</span> Đạo hữu hoàn tất bế quan tư quá, đạo tâm củng cố, tiếp tục hành trình tu đạo!", "text-amber-300 font-bold", "be-quan-tu-qua");
        }
    }
    if (typeof playSound === 'function') playSound('bell');
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
    renderCaveHubDashboard();
}

if (typeof window !== "undefined") {
    window.toggleBeQuanTuQua = toggleBeQuanTuQua;
    window.renderCaveHubDashboard = renderCaveHubDashboard;
    window.collectCaveSpiritPool = collectCaveSpiritPool;
    window.upgradeCaveSpiritArray = upgradeCaveSpiritArray;
}

// ============================================================================
// ĐỘNG PHỦ HUB 2 CỘT — QUẢN LÝ NỘI BỘ (THÁI ẤT ĐỘNG PHỦ)
// ============================================================================

function switchDpTab(roomId) {
    if (!roomId) roomId = 'dp-gia-vien';

    // 1. Gỡ bỏ active ở tất cả nút tab trong .dp-sidebar
    const buttons = document.querySelectorAll('.dp-sidebar .dp-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 2. Gán active cho nút vừa bấm
    const targetBtn = document.querySelector(`.dp-sidebar .dp-tab-btn[onclick*="${roomId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // 3. Ẩn tất cả .dp-room và hiện .dp-room tương ứng
    const rooms = document.querySelectorAll('.dp-main-content .dp-room');
    rooms.forEach(room => {
        room.classList.remove('active');
        room.style.display = 'none';
    });

    const targetRoom = document.getElementById(roomId);
    if (targetRoom) {
        targetRoom.classList.add('active');
        targetRoom.style.display = 'block';
    }

    // 4. Render/Cập nhật dữ liệu cho phòng vừa mở
    renderDongPhuRoomContent(roomId);
}

function openDongPhuHub(initialTab = 'dp-gia-vien') {
    if (typeof closeHubModal === 'function') closeHubModal();
    const dpPage = document.getElementById('page-dong-phu');
    if (dpPage) {
        const allPages = document.querySelectorAll('.game-page');
        allPages.forEach(p => {
            p.classList.remove('active', 'flex');
            p.classList.add('hidden');
            p.style.display = 'none';
        });
        dpPage.classList.remove('hidden');
        dpPage.classList.add('active', 'flex');
        dpPage.style.display = 'flex';
    }
    switchDpTab(initialTab);
}

function detoxifyDanDoc() {
    if (!state.danDoc || state.danDoc <= 0) {
        if (typeof addLog === 'function') addLog("✨ Thần hồn thanh tịnh, trong kinh mạch không có đan độc tích tụ!", "text-emerald-300");
        return;
    }
    const cost = 200;
    if (state.stones < cost) {
        if (typeof addLog === 'function') addLog(`Không đủ Linh Thạch để vận công thanh lọc đan độc (Cần ${cost} LT).`, "text-rose-400");
        return;
    }
    state.stones -= cost;
    state.danDoc = Math.max(0, state.danDoc - 20);
    if (typeof playSound === 'function') playSound('bell');
    if (typeof addLog === 'function') addLog(`🌿 Vận chuyển linh lực khu trục đan độc, giảm 20 điểm Đan Độc (Hiện còn ${state.danDoc}/100)!`, "text-teal-300");
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
}

function renderDongPhuRoomContent(roomId) {
    if (!roomId) roomId = 'dp-gia-vien';

    // Cập nhật linh khí rate ở chân sidebar
    const sidebarQi = document.getElementById('dp-sidebar-qi-rate');
    if (sidebarQi) {
        const rate = typeof getLinhKhiRate === 'function' ? getLinhKhiRate() : 5;
        sidebarQi.textContent = `+${rate.toLocaleString('vi-VN')} LK/giây`;
    }

    // 1. TIÊN MÔN GIA VIÊN
    if (roomId === 'dp-gia-vien') {
        const lvlEl = document.getElementById('dp-gv-array-level');
        if (lvlEl) lvlEl.textContent = `Cấp ${state.arrayLevel || 1}`;

        const poolCurrent = Math.floor(state.linhKhi || 0);
        const poolMax = typeof getLinhKhiMax === 'function' ? Math.max(1, Math.floor(getLinhKhiMax())) : 1000;
        const poolPct = Math.min(100, Math.round((poolCurrent / poolMax) * 100));
        const poolRate = typeof getLinhKhiRate === 'function' ? getLinhKhiRate() : 5;

        const poolText = document.getElementById('dp-gv-pool-text');
        if (poolText) poolText.textContent = `${poolCurrent.toLocaleString('vi-VN')} / ${poolMax.toLocaleString('vi-VN')}`;

        const poolBar = document.getElementById('dp-gv-pool-bar');
        if (poolBar) poolBar.style.width = `${poolPct}%`;

        const rateText = document.getElementById('dp-gv-rate-text');
        if (rateText) rateText.textContent = `+${poolRate.toLocaleString('vi-VN')} LK/giây`;

        const beQuanBtn = document.getElementById('dp-gv-bequan-btn');
        if (beQuanBtn) {
            const isBeQuan = state.beQuanTuQua && state.beQuanTuQua.active;
            beQuanBtn.textContent = isBeQuan ? "🛑 Xuất Quan" : "🧘 Bắt Đầu Bế Quan";
            beQuanBtn.className = isBeQuan 
                ? "px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-medium transition cursor-pointer text-[11px]"
                : "px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-300 font-medium transition cursor-pointer text-[11px]";
        }

        const farmCount = document.getElementById('dp-gv-farm-count');
        const farmPlots = Array.isArray(state.farmPlots) ? state.farmPlots : [];
        if (farmCount) farmCount.textContent = `${farmPlots.length} Ô Đất`;

        const plotsGrid = document.getElementById('dp-gv-plots-grid');
        if (plotsGrid) {
            plotsGrid.innerHTML = farmPlots.map(plot => {
                const hasHerb = Boolean(plot.herbId);
                const isRipe = hasHerb && (plot.progress || 0) >= 100;
                return `
                    <div class="p-2 rounded-lg border ${isRipe ? 'border-amber-500/50 bg-amber-950/30' : hasHerb ? 'border-emerald-500/40 bg-slate-900/60' : 'border-slate-800 bg-slate-950/50'} text-xs flex flex-col justify-between">
                        <div class="flex items-center justify-between text-[11px] mb-1">
                            <span class="text-slate-400">Ô #${plot.id}</span>
                            <span class="${isRipe ? 'text-amber-300 font-bold animate-pulse' : hasHerb ? 'text-emerald-400' : 'text-slate-500'}">
                                ${isRipe ? '✨ Đã Chín' : hasHerb ? `${plot.progress || 0}%` : 'Trống'}
                            </span>
                        </div>
                        <div class="text-[11px] font-semibold text-slate-200 truncate mb-1">
                            ${hasHerb ? (plot.herbName || 'Linh Thảo') : '<span class="text-slate-500 italic">Chưa gieo</span>'}
                        </div>
                        <div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-1">
                            <div class="${isRipe ? 'bg-amber-400' : 'bg-emerald-500'} h-full transition-all" style="width: ${Math.min(100, plot.progress || 0)}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 2. LUYỆN ĐAN PHÒNG
    if (roomId === 'dp-luyen-dan') {
        const docVal = Math.min(100, Math.max(0, state.danDoc || 0));
        const docText = document.getElementById('dp-dan-doc-text');
        if (docText) {
            docText.textContent = `${docVal} / 100`;
            docText.className = docVal > 70 ? 'text-rose-400 font-mono font-bold animate-pulse' : docVal > 40 ? 'text-amber-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold';
        }
        const docBar = document.getElementById('dp-dan-doc-bar');
        if (docBar) {
            docBar.style.width = `${docVal}%`;
            docBar.className = docVal > 70 ? 'bg-rose-500 h-full rounded-full transition-all' : docVal > 40 ? 'bg-amber-500 h-full rounded-full transition-all' : 'bg-emerald-500 h-full rounded-full transition-all';
        }

        const recipesGrid = document.getElementById('dp-dan-recipes-grid');
        if (recipesGrid) {
            const recipes = Array.isArray(ALCHEMY_RECIPES) ? ALCHEMY_RECIPES : [];
            recipesGrid.innerHTML = recipes.map(recipe => {
                const canCraft = Array.isArray(recipe.materials) && recipe.materials.every(m => getCaveItemCount(m.itemId) >= m.count);
                const matsHtml = (recipe.materials || []).map(m => {
                    const owned = getCaveItemCount(m.itemId);
                    const isEnough = owned >= m.count;
                    const item = getCaveCatalogItem(m.itemId);
                    return `<span class="text-[10px] px-1.5 py-0.5 rounded ${isEnough ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/30' : 'bg-rose-950/80 text-rose-300 border border-rose-600/30'}">${item.name || m.itemId}: ${owned}/${m.count}</span>`;
                }).join(' ');

                return `
                    <div class="p-3 rounded-xl bg-slate-900/70 border ${canCraft ? 'border-amber-500/40 hover:border-amber-400/60' : 'border-slate-800'} transition flex flex-col justify-between gap-2">
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-capsules text-amber-400"></i> ${recipe.name}
                                </span>
                                <span class="text-[10px] text-emerald-400 font-mono">Tỷ lệ: ${Math.round((recipe.baseChance || 0.7) * 100)}%</span>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2 leading-tight">${recipe.desc || 'Đan dược tinh thuần hỗ trợ tu vi'}</p>
                            <div class="flex flex-wrap gap-1 mb-2">${matsHtml}</div>
                        </div>
                        <button type="button" onclick="craftCaveRecipe('${recipe.id}'); renderDongPhuRoomContent('dp-luyen-dan');" class="dp-action-btn ${canCraft ? 'dp-action-btn-emerald' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}" ${canCraft ? '' : 'disabled'}>
                            <i class="fa-solid fa-fire"></i> Khai Lò Luyện Đan
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    // 3. LUYỆN KHÍ THẤT
    if (roomId === 'dp-luyen-khi') {
        const recipesGrid = document.getElementById('dp-forge-recipes-grid');
        if (recipesGrid) {
            const recipes = Array.isArray(FORGE_RECIPES) ? FORGE_RECIPES : [];
            recipesGrid.innerHTML = recipes.map(recipe => {
                const matsOk = (recipe.materials || []).every(m => getCaveItemCount(m.itemId) >= m.count);
                const stonesOk = (state.stones || 0) >= (recipe.stoneCost || 0);
                const canForge = matsOk && stonesOk;

                const matsHtml = [
                    `<span class="text-[10px] px-1.5 py-0.5 rounded ${stonesOk ? 'bg-amber-950/80 text-amber-300 border border-amber-600/30' : 'bg-rose-950/80 text-rose-300 border border-rose-600/30'}">LT: ${(state.stones || 0).toLocaleString('vi-VN')}/${(recipe.stoneCost || 0).toLocaleString('vi-VN')}</span>`,
                    ...(recipe.materials || []).map(m => {
                        const owned = getCaveItemCount(m.itemId);
                        const isEnough = owned >= m.count;
                        const item = getCaveCatalogItem(m.itemId);
                        return `<span class="text-[10px] px-1.5 py-0.5 rounded ${isEnough ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/30' : 'bg-rose-950/80 text-rose-300 border border-rose-600/30'}">${item.name || m.itemId}: ${owned}/${m.count}</span>`;
                    })
                ].join(' ');

                return `
                    <div class="p-3 rounded-xl bg-slate-900/70 border ${canForge ? 'border-amber-500/40 hover:border-amber-400/60' : 'border-slate-800'} transition flex flex-col justify-between gap-2">
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-shield-halved text-cyan-400"></i> ${recipe.name}
                                </span>
                                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">${recipe.slot || 'Trang Bị'}</span>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2 leading-tight">${recipe.desc || 'Thần binh pháp bảo hộ thể'}</p>
                            <div class="flex flex-wrap gap-1 mb-2">${matsHtml}</div>
                        </div>
                        <button type="button" onclick="forgeCaveRecipe('${recipe.id}'); renderDongPhuRoomContent('dp-luyen-khi');" class="dp-action-btn ${canForge ? 'dp-action-btn-gold' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}" ${canForge ? '' : 'disabled'}>
                            <i class="fa-solid fa-hammer"></i> Khai Chùy Đúc Binh
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    // 4. KHUÊ PHÒNG ĐẠO LỮ
    if (roomId === 'dp-khue-phong') {
        const companionsGrid = document.getElementById('dp-companions-grid');
        if (companionsGrid) {
            let comps = Array.isArray(state.companions) && state.companions.length > 0 ? state.companions : [];
            if (!comps.length && typeof COMPANIONS_DATA !== 'undefined' && Array.isArray(COMPANIONS_DATA)) {
                state.companions = structuredClone(COMPANIONS_DATA);
                comps = state.companions;
            }
            companionsGrid.innerHTML = comps.map(comp => {
                const aff = Math.min(100, Math.max(0, Number(comp.affinity) || 0));
                let stageTitle = 'Sơ Thức (Gặp Gỡ)';
                if (aff >= 80) stageTitle = 'Đồng Tâm Sinh Tử';
                else if (aff >= 50) stageTitle = 'Tri Kỷ Hồng Nhan';
                else if (aff >= 20) stageTitle = 'Tương Tri';

                return `
                    <div class="p-3.5 rounded-xl bg-slate-900/75 border border-pink-500/30 hover:border-pink-500/60 transition flex flex-col justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div class="w-14 h-14 rounded-xl border border-pink-400/50 overflow-hidden bg-slate-950 flex-shrink-0 shadow-[0_0_12px_rgba(244,114,182,0.3)]">
                                <img src="${comp.avatar || './assets/images/nu_tu_trong_suot.png'}" alt="${comp.name}" class="w-full h-full object-cover" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">
                            </div>
                            <div class="flex-grow min-w-0">
                                <div class="flex items-center justify-between mb-0.5">
                                    <h4 class="text-xs font-bold text-pink-300 truncate">${comp.name}</h4>
                                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-950/80 text-pink-300 border border-pink-500/40 font-mono">${stageTitle}</span>
                                </div>
                                <p class="text-[10px] text-amber-300 font-serif italic mb-1.5">${comp.title || 'Tiên Nữ Cố Nhân'}</p>
                                <div class="space-y-1">
                                    <div class="flex justify-between text-[10px]">
                                        <span class="text-slate-400">Hảo Cảm:</span>
                                        <span class="text-pink-400 font-mono font-bold">${aff} / 100</span>
                                    </div>
                                    <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div class="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all" style="width: ${aff}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <b>Gia trì đạo lữ:</b> ${comp.effectDesc || '+5% Bạo kích, hồi 10% Khí Huyết mỗi 4 hiệp'}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="dualCultivateCompanion('${comp.id}'); renderDongPhuRoomContent('dp-khue-phong');" class="dp-action-btn dp-action-btn-rose">
                                <i class="fa-solid fa-yin-yang"></i> Song Tu Đả Tọa
                            </button>
                            <button type="button" onclick="giftCompanion('${comp.id}'); renderDongPhuRoomContent('dp-khue-phong');" class="dp-action-btn dp-action-btn-gold">
                                <i class="fa-solid fa-gift"></i> Tặng Quà (500 LT)
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

if (typeof window !== "undefined") {
    window.switchDpTab = switchDpTab;
    window.openDongPhuHub = openDongPhuHub;
    window.detoxifyDanDoc = detoxifyDanDoc;
    window.renderDongPhuRoomContent = renderDongPhuRoomContent;
}

