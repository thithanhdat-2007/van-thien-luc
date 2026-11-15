// ==========================================
// FILE: js/market.js - Phường Thị (Chợ Tu Chân)
// Backend actions: buy_item / sell_item / refresh_shop / get_market_state
// UI: Vạn Bảo Lâu • Tàng Thư Các • Hắc Thị (Quỷ Thị) • Thu Mua (Bán Rác)
// Phụ thuộc runtime (khai báo trong app.js): state, addLog, updateHUD,
// playSound, activeDrawer, renderDrawerContent, saveGameState.
// ==========================================

const MARKET_CURRENCY_LABEL = { linh_thach: "Linh Thạch", tien_ngoc: "Tiên Ngọc" };
let lastMarketResponse = null;

// ---------- Tiện ích nội bộ ----------
function getMarketCatalogItem(itemId) {
    return DEFAULT_STATE.inventory.find(item => item.id === itemId) || null;
}

function getMarketPoolEntry(shopType, itemId) {
    return (MARKET_ITEM_POOLS[shopType] || []).find(entry => entry.itemId === itemId) || null;
}

function getMarketWalletValue(currency) {
    if (typeof window !== 'undefined' && window.GameState) {
        return currency === "tien_ngoc" ? (Number(window.GameState.jade ?? window.GameState.immortalJade) || 0) : (Number(window.GameState.stones) || 0);
    }
    return currency === "tien_ngoc" ? (state.immortalJade || 0) : (state.stones || 0);
}

function changeMarketWallet(currency, delta) {
    if (typeof window !== 'undefined' && window.GameState) {
        if (currency === "tien_ngoc") {
            window.GameState.jade = Math.max(0, (window.GameState.jade || 0) + delta);
        } else {
            window.GameState.stones = Math.max(0, (window.GameState.stones || 0) + delta);
        }
    }
    if (typeof state !== 'undefined') {
        if (currency === "tien_ngoc") state.immortalJade = Math.max(0, (state.immortalJade || 0) + delta);
        else state.stones = Math.max(0, (state.stones || 0) + delta);
        if ((state.stones || 0) > 10 && Array.isArray(state.progressionFlags) && !state.progressionFlags.includes("tung_so_huu_tren_10_linh_thach")) {
            state.progressionFlags.push("tung_so_huu_tren_10_linh_thach");
        }
    }
    if (typeof window !== 'undefined') {
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.saveGame === 'function') window.saveGame();
        else if (typeof window.saveGameState === 'function') window.saveGameState();
    }
}

function getMarketBasePrice(itemId) {
    for (const shopType of Object.keys(MARKET_ITEM_POOLS)) {
        const entry = getMarketPoolEntry(shopType, itemId);
        if (entry && entry.currency === "linh_thach") return entry.price;
    }
    return MARKET_BASE_PRICES[itemId] || 0;
}

function getMarketSellPrice(itemId) {
    return Math.max(1, Math.floor(getMarketBasePrice(itemId) * MARKET_CONFIG.sellRatio));
}

function pushMarketLog(message) {
    const market = ensureMarketState();
    market.actionLog.push(message);
    if (market.actionLog.length > MARKET_CONFIG.maxActionLog) {
        market.actionLog.splice(0, market.actionLog.length - MARKET_CONFIG.maxActionLog);
    }
    return message;
}

function randomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Trọng số hiệu dụng: cảnh giới càng cao, Tỷ lệ (Rate) xuất hiện các vật phẩm xịn càng lớn.
function getMarketEffectiveWeight(entry, realmIndex) {
    const rarity = getMarketCatalogItem(entry.itemId)?.rarity || 1;
    const rareBoost = 1 + realmIndex * MARKET_CONFIG.rareWeightPerRealm * Math.max(0, rarity - 2);
    return Math.max(0, entry.weight * rareBoost);
}

function rollMarketItems(shopType) {
    const shop = MARKET_SHOPS[shopType];
    const realmIndex = state.realmIndex || 0;
    const candidates = (MARKET_ITEM_POOLS[shopType] || [])
        .filter(entry => realmIndex >= (entry.minRealmIndex || 0) && getMarketCatalogItem(entry.itemId));
    const picked = [];
    const pool = candidates.map(entry => ({ entry, weight: getMarketEffectiveWeight(entry, realmIndex) }));
    const slots = Math.min(shop?.slots || 0, pool.length);
    for (let i = 0; i < slots; i++) {
        const total = pool.reduce((sum, candidate) => sum + candidate.weight, 0);
        if (total <= 0) break;
        let roll = Math.random() * total;
        let index = pool.findIndex(candidate => (roll -= candidate.weight) < 0);
        if (index < 0) index = pool.length - 1;
        const [{ entry }] = pool.splice(index, 1);
        const [minStock, maxStock] = entry.stock || [1, 1];
        picked.push({ id: entry.itemId, stock: randomIntInclusive(minStock, maxStock) });
    }
    return picked;
}

function rollMarketShop(shopType) {
    const market = ensureMarketState();
    market.shops[shopType] = { items: rollMarketItems(shopType), refreshedAt: Date.now() };
}

// ---------- Chuẩn hóa state (tương thích save cũ) ----------
function ensureMarketState(target = state) {
    const saved = target.market && typeof target.market === "object" ? target.market : {};
    const market = {
        activeTab: MARKET_SHOPS[saved.activeTab] ? saved.activeTab : "van_bao_lau",
        nextAutoRefreshAt: Number(saved.nextAutoRefreshAt) || 0,
        shops: saved.shops && typeof saved.shops === "object" ? saved.shops : {},
        actionLog: Array.isArray(saved.actionLog) ? saved.actionLog.slice(-MARKET_CONFIG.maxActionLog) : []
    };
    target.market = market;
    const needsAutoRefresh = !market.nextAutoRefreshAt || Date.now() >= market.nextAutoRefreshAt;
    Object.keys(MARKET_ITEM_POOLS).forEach(shopType => {
        const shop = market.shops[shopType];
        const valid = shop && Array.isArray(shop.items)
            && shop.items.every(item => getMarketPoolEntry(shopType, item.id) && Number.isFinite(Number(item.stock)));
        if (!valid) market.shops[shopType] = null;
    });
    if (needsAutoRefresh) {
        Object.keys(MARKET_ITEM_POOLS).forEach(shopType => {
            market.shops[shopType] = { items: rollMarketItems(shopType), refreshedAt: Date.now() };
        });
        market.nextAutoRefreshAt = Date.now() + MARKET_CONFIG.autoRefreshMs;
    } else {
        Object.keys(MARKET_ITEM_POOLS).forEach(shopType => {
            if (!market.shops[shopType]) market.shops[shopType] = { items: rollMarketItems(shopType), refreshedAt: Date.now() };
        });
    }
    return market;
}

function getMarketRefreshCooldownSeconds() {
    const market = state.market || ensureMarketState();
    return Math.max(0, Math.ceil((market.nextAutoRefreshAt - Date.now()) / 1000));
}

// ---------- RESPONSE STATE (JSON CHUẨN) ----------
function buildMarketShopItems(shopType) {
    const market = ensureMarketState();
    if (shopType === "thu_mua") {
        return state.inventory
            .filter(item => item.count > 0 && !item.equipped && getMarketBasePrice(item.id) > 0)
            .map(item => ({
                id: item.id,
                name: item.name,
                price: getMarketSellPrice(item.id),
                currency: "linh_thach",
                stock: item.count,
                desc: item.desc
            }));
    }
    return (market.shops[shopType]?.items || []).map(slot => {
        const entry = getMarketPoolEntry(shopType, slot.id);
        const catalog = getMarketCatalogItem(slot.id) || {};
        return {
            id: slot.id,
            name: catalog.name || slot.id,
            price: entry?.price || 0,
            currency: entry?.currency || "linh_thach",
            stock: slot.stock,
            desc: entry?.desc || catalog.desc || ""
        };
    });
}

function get_market_state(shopType, actionLog = null, status = "success") {
    const market = ensureMarketState();
    const activeTab = MARKET_SHOPS[shopType] ? shopType : market.activeTab;
    const logs = Array.isArray(actionLog)
        ? actionLog
        : (market.actionLog.length ? [market.actionLog[market.actionLog.length - 1]] : []);
    const response = {
        status,
        wallet: {
            linh_thach: state.stones || 0,
            tien_ngoc: state.immortalJade || 0
        },
        shop_data: {
            active_tab: activeTab,
            refresh_cooldown: getMarketRefreshCooldownSeconds(),
            items: buildMarketShopItems(activeTab)
        },
        action_log: logs
    };
    lastMarketResponse = response;
    return response;
}

function marketError(shopType, message) {
    return get_market_state(shopType, [pushMarketLog(`[Phường Thị] ${message}`)], "error");
}

// ---------- 3 HÀM API ACTIONS (BACKEND) ----------
function buy_item(item_id, shop_type, quantity = 1) {
    const market = ensureMarketState();
    const qty = Math.floor(Number(quantity));
    if (!MARKET_ITEM_POOLS[shop_type]) return marketError(shop_type, "Cửa hàng không tồn tại.");
    if (!Number.isFinite(qty) || qty < 1) return marketError(shop_type, "Số lượng giao dịch không hợp lệ.");
    market.activeTab = shop_type;
    const slot = market.shops[shop_type]?.items.find(item => item.id === item_id);
    const entry = getMarketPoolEntry(shop_type, item_id);
    const catalog = getMarketCatalogItem(item_id);
    if (!slot || !entry || !catalog) return marketError(shop_type, "Vật phẩm không có trong danh sách bày bán.");
    if (slot.stock < qty) return marketError(shop_type, `Kho tiệm chỉ còn ${slot.stock} ${catalog.name}.`);
    const totalCost = entry.price * qty;
    if (getMarketWalletValue(entry.currency) < totalCost) {
        return marketError(shop_type, "Linh thạch không đủ, đạo hữu vui lòng gom thêm!");
    }
    changeMarketWallet(entry.currency, -totalCost);
    slot.stock -= qty;
    const inv = (typeof window !== 'undefined' && window.GameState && Array.isArray(window.GameState.inventory)) ? window.GameState.inventory : state.inventory;
    let owned = inv.find(item => item && item.id === item_id);
    if (!owned) {
        owned = structuredClone(catalog);
        owned.count = 0;
        inv.push(owned);
    }
    owned.count = (Number(owned.count || owned.quantity) || 0) + qty;
    owned.quantity = owned.count;
    if (typeof state !== 'undefined' && state.inventory !== inv) state.inventory = inv;
    const log = pushMarketLog(`[Phường Thị] Giao dịch thành công: Mua ${qty} ${catalog.name} (-${totalCost.toLocaleString("vi-VN")} ${MARKET_CURRENCY_LABEL[entry.currency]}).`);
    return get_market_state(shop_type, [log], "success");
}

function sell_item(item_id, quantity = 1) {
    const market = ensureMarketState();
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) return marketError("thu_mua", "Số lượng bán không hợp lệ.");
    const inv = (typeof window !== 'undefined' && window.GameState && Array.isArray(window.GameState.inventory)) ? window.GameState.inventory : state.inventory;
    const owned = inv.find(item => item && item.id === item_id);
    if (!owned || (Number(owned.count || owned.quantity) || 0) < qty) {
        return marketError("thu_mua", "Trong túi không đủ số lượng vật phẩm để bán!");
    }
    if (owned.equipped) {
        return marketError("thu_mua", "Vật phẩm đang trang bị trên người, không thể bán!");
    }
    const basePrice = getMarketBasePrice(item_id);
    if (basePrice <= 0) {
        return marketError("thu_mua", `Thương nhân không thu mua ${owned.name}.`);
    }
    const unitSellPrice = getMarketSellPrice(item_id);
    const totalGain = unitSellPrice * qty;
    const newCount = Math.max(0, (Number(owned.count || owned.quantity) || 0) - qty);
    owned.count = newCount;
    owned.quantity = newCount;
    if (newCount <= 0) {
        const idx = inv.indexOf(owned);
        if (idx >= 0) inv.splice(idx, 1);
    }
    if (typeof state !== 'undefined' && state.inventory !== inv) state.inventory = inv;
    changeMarketWallet("linh_thach", totalGain);
    market.activeTab = "thu_mua";
    const log = pushMarketLog(`[Phường Thị] Thu mua thành công: Bán ${qty} ${owned.name}, nhận +${totalGain.toLocaleString("vi-VN")} Linh Thạch (20% giá gốc).`);
    return get_market_state("thu_mua", [log], "success");
}

function refresh_shop(shop_type, is_manual = false) {
    if (!MARKET_ITEM_POOLS[shop_type]) return marketError(shop_type, "Cửa hàng này không hỗ trợ làm mới.");
    const market = ensureMarketState();
    market.activeTab = shop_type;
    if (is_manual) {
        if ((state.stones || 0) < MARKET_CONFIG.manualRefreshCost) {
            return marketError(shop_type, "Linh thạch không đủ, đạo hữu vui lòng gom thêm!");
        }
        changeMarketWallet("linh_thach", -MARKET_CONFIG.manualRefreshCost);
    } else {
        market.nextAutoRefreshAt = Date.now() + MARKET_CONFIG.autoRefreshMs;
    }
    rollMarketShop(shop_type);
    const shopName = MARKET_SHOPS[shop_type].name;
    const log = pushMarketLog(is_manual
        ? `[Phường Thị] Tiêu hao ${MARKET_CONFIG.manualRefreshCost} Linh thạch, ${shopName} đã làm mới hàng hóa!`
        : `[Phường Thị] Đã qua 8 canh giờ, ${shopName} tự động làm mới hàng hóa!`);
    return get_market_state(shop_type, [log], "success");
}

window.buy_item = buy_item;
window.sell_item = sell_item;
window.refresh_shop = refresh_shop;
window.get_market_state = get_market_state;
window.MarketAPI = { buy_item, sell_item, refresh_shop, get_market_state };

// ---------- Vòng lặp: auto-refresh 8h thời gian thực ----------
function marketTick() {
    const market = state.market;
    if (!market || !market.nextAutoRefreshAt) { ensureMarketState(); return; }
    if (Date.now() >= market.nextAutoRefreshAt) {
        Object.keys(MARKET_ITEM_POOLS).forEach(shopType => rollMarketShop(shopType));
        market.nextAutoRefreshAt = Date.now() + MARKET_CONFIG.autoRefreshMs;
        const log = pushMarketLog("[Phường Thị] Chu kỳ 8 giờ hoàn tất, toàn bộ cửa hàng đã tự động làm mới hàng hóa!");
        if (typeof addLog === "function") addLog(`🏪 ${log}`, "text-amber-300");
        if (activeDrawer === "market") renderDrawerContent("market");
        return;
    }
    const countdown = document.getElementById("market-refresh-countdown");
    if (countdown && activeDrawer === "market") {
        countdown.textContent = formatMarketCountdown(getMarketRefreshCooldownSeconds());
    }
}

// ---------- UI ----------
function formatMarketCountdown(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(value => String(value).padStart(2, "0")).join(":");
}

function applyMarketResponse(response) {
    const isError = response.status !== "success";
    const message = response.action_log?.[response.action_log.length - 1];
    if (message && typeof addLog === "function") {
        addLog(isError ? `⚠️ ${message}` : `🏪 ${message}`, isError ? "text-rose-400" : "text-emerald-400");
    }
    if (typeof playSound === "function") playSound(isError ? "thunder" : "bell");
    if (typeof updateHUD === "function") updateHUD();
    if (activeDrawer === "market") renderDrawerContent("market");
    const hubContent = document.getElementById('hub-modal-content');
    const hubBackdrop = document.getElementById('hub-modal-backdrop');
    if (hubBackdrop && !hubBackdrop.classList.contains('hidden') && hubBackdrop.dataset.activeHub === 'world' && hubContent && typeof renderWorldMarketHub === 'function') {
        renderWorldMarketHub(hubContent);
    }
    const pageMarketContent = document.getElementById('world-market-page-content');
    if (pageMarketContent && document.getElementById('page-world-market')?.classList.contains('active') && typeof renderWorldMarketHub === 'function') {
        renderWorldMarketHub(pageMarketContent);
    }
    if (typeof saveGameState === "function" && !isError) saveGameState();
    return response;
}

function selectMarketTab(shopType) {
    if (!MARKET_SHOPS[shopType]) return;
    ensureMarketState().activeTab = shopType;
    if (activeDrawer === "market") renderDrawerContent("market");
    const hubContent = document.getElementById('hub-modal-content');
    const hubBackdrop = document.getElementById('hub-modal-backdrop');
    if (hubBackdrop && !hubBackdrop.classList.contains('hidden') && hubBackdrop.dataset.activeHub === 'world' && hubContent && typeof renderWorldMarketHub === 'function') {
        renderWorldMarketHub(hubContent);
    }
    const pageMarketContent = document.getElementById('world-market-page-content');
    if (pageMarketContent && document.getElementById('page-world-market')?.classList.contains('active') && typeof renderWorldMarketHub === 'function') {
        renderWorldMarketHub(pageMarketContent);
    }
    requestAnimationFrame(() => document.querySelector(`[data-market-tab="${shopType}"]`)?.focus());
}

function marketBuy(itemId, shopType) {
    const input = document.getElementById(`market-qty-${itemId}`);
    const quantity = input ? Number(input.value) : 1;
    return applyMarketResponse(buy_item(itemId, shopType, quantity));
}

function marketSell(itemId, quantity) {
    return applyMarketResponse(sell_item(itemId, quantity));
}

function marketRefresh(shopType) {
    return applyMarketResponse(refresh_shop(shopType, true));
}

function renderMarketItemCard(item, shopType) {
    const catalog = getMarketCatalogItem(item.id) || {};
    const rarity = catalog.rarity || 1;
    const icon = catalog.icon || "fa-box";
    const affordable = getMarketWalletValue(item.currency) >= item.price;
    const soldOut = item.stock <= 0;
    const currencyIcon = item.currency === "tien_ngoc" ? "fa-solid fa-diamond text-purple-300" : "fa-regular fa-gem text-jade-300";
    return `
        <article class="market-item rarity-${rarity} ${soldOut ? "is-sold-out" : ""}">
            <div class="market-item__icon"><i class="fa-solid ${icon}"></i></div>
            <div class="market-item__body">
                <div class="market-item__name">${item.name}</div>
                <p class="market-item__desc">${item.desc}</p>
                <div class="market-item__meta">
                    <span class="market-price ${affordable ? "" : "is-short"}"><i class="${currencyIcon}"></i>${item.price.toLocaleString("vi-VN")} ${MARKET_CURRENCY_LABEL[item.currency]}</span>
                    <span class="market-stock">Tồn kho: ${item.stock}</span>
                </div>
            </div>
            <div class="market-item__actions">
                ${soldOut ? `<span class="market-soldout">Đã bán hết</span>` : `
                    <label class="sr-only" for="market-qty-${item.id}">Số lượng ${item.name}</label>
                    <input id="market-qty-${item.id}" class="market-qty" type="number" min="1" max="${item.stock}" value="1" inputmode="numeric">
                    <button type="button" class="market-btn market-btn--buy" onclick="marketBuy('${item.id}', '${shopType}')">Mua</button>
                `}
            </div>
        </article>`;
}

function renderMarketSellCard(item) {
    const catalog = getMarketCatalogItem(item.id) || {};
    const rarity = catalog.rarity || 1;
    const icon = catalog.icon || "fa-box";
    const basePrice = getMarketBasePrice(item.id);
    return `
        <article class="market-item rarity-${rarity}">
            <div class="market-item__icon"><i class="fa-solid ${icon}"></i></div>
            <div class="market-item__body">
                <div class="market-item__name">${item.name} <span class="market-stock">x${item.stock}</span></div>
                <p class="market-item__desc">${item.desc}</p>
                <div class="market-item__meta">
                    <span class="market-price"><i class="fa-regular fa-gem text-jade-300"></i>+${item.price.toLocaleString("vi-VN")} Linh Thạch / cái</span>
                    <span class="market-stock">20% của ${basePrice.toLocaleString("vi-VN")}</span>
                </div>
            </div>
            <div class="market-item__actions market-item__actions--sell">
                <button type="button" class="market-btn" onclick="marketSell('${item.id}', 1)">Bán 1</button>
                ${item.stock > 1 ? `<button type="button" class="market-btn market-btn--ghost" onclick="marketSell('${item.id}', ${item.stock})">Bán hết (+${(item.price * item.stock).toLocaleString("vi-VN")})</button>` : ""}
            </div>
        </article>`;
}

function renderMarketDrawer(contentEl, titleEl, iconEl) {
    const market = ensureMarketState();
    const tab = market.activeTab;
    const shop = MARKET_SHOPS[tab];
    const view = get_market_state(tab, lastMarketResponse?.shop_data?.active_tab === tab ? lastMarketResponse.action_log : null, lastMarketResponse?.status || "success");
    titleEl.textContent = "Phường Thị Tu Chân";
    iconEl.className = tab === "hac_thi" ? "fa-solid fa-mask text-purple-400" : "fa-solid fa-store text-amber-400";

    const tabsHtml = Object.values(MARKET_SHOPS).map(s => `
        <button type="button" role="tab" data-market-tab="${s.id}" aria-selected="${s.id === tab}" tabindex="${s.id === tab ? 0 : -1}"
            class="market-tab market-tab--${s.theme} ${s.id === tab ? "is-active" : ""}" onclick="selectMarketTab('${s.id}')">
            <i class="fa-solid ${s.icon}"></i><span>${s.name}</span>
        </button>`).join("");

    const toolbarHtml = shop.refreshable ? `
        <div class="market-toolbar">
            <span class="market-countdown"><i class="fa-regular fa-clock"></i> Tự làm mới: <b id="market-refresh-countdown">${formatMarketCountdown(view.shop_data.refresh_cooldown)}</b></span>
            <button type="button" class="market-btn market-btn--refresh" onclick="marketRefresh('${tab}')" ${state.stones < MARKET_CONFIG.manualRefreshCost ? "aria-disabled=\"true\"" : ""}>
                <i class="fa-solid fa-rotate"></i> Làm Mới Thủ Công (${MARKET_CONFIG.manualRefreshCost} LT)
            </button>
        </div>` : `<p class="market-hint">Túi đồ của đạo hữu: Nhấp vào vật phẩm rác/dư thừa để bán đổi lấy Linh Thạch (Giá bán = ${Math.round(MARKET_CONFIG.sellRatio * 100)}% giá gốc).</p>`;

    const items = view.shop_data.items;
    const listHtml = items.length
        ? items.map(item => tab === "thu_mua" ? renderMarketSellCard(item) : renderMarketItemCard(item, tab)).join("")
        : `<p class="market-empty">${tab === "thu_mua" ? "Túi đồ hiện chưa có vật phẩm dư thừa để bán." : "Kệ hàng trống trơn, hãy làm mới hoặc chờ đợt kế tiếp."}</p>`;

    const logHtml = market.actionLog.length
        ? market.actionLog.slice().reverse().map(line => `<li>${line}</li>`).join("")
        : "<li>Chưa có giao dịch nào tại Phường Thị.</li>";

    contentEl.innerHTML = `
        <section class="market-shell market-shell--${shop.theme}">
            <div class="page-header-title">
                <h2>🏮 VẠN BẢO PHƯỜNG THỊ</h2>
            </div>
            <div class="market-wallet" aria-label="Thông tin ví">
                <span class="market-wallet__chip"><i class="fa-regular fa-gem text-jade-300"></i><small>Linh Thạch</small><b>${view.wallet.linh_thach.toLocaleString("vi-VN")}</b></span>
                <span class="market-wallet__chip"><i class="fa-solid fa-diamond text-purple-300"></i><small>Tiên Ngọc</small><b>${view.wallet.tien_ngoc.toLocaleString("vi-VN")}</b></span>
            </div>
            <div class="market-tabs" role="tablist" aria-label="Cửa hàng Phường Thị" onkeydown="handleMarketTabKeys(event)">${tabsHtml}</div>
            <div class="market-panel" role="tabpanel" aria-label="${shop.name}">
                <header class="market-panel__head">
                    <h3>${shop.name}</h3>
                    <span>${shop.subtitle}</span>
                </header>
                ${tab === "hac_thi" ? `<p class="market-whisper"><i class="fa-solid fa-skull mr-1.5 text-purple-400"></i>"Quỷ Thị ẩn thế: Chỉ giao dịch kỳ trân dị bảo nghịch thiên cải mệnh, giá cắt cổ, kẻ hữu duyên mới gánh nổi..."</p>` : ""}
                ${toolbarHtml}
                <div class="market-list">${listHtml}</div>
            </div>
            <details class="market-log">
                <summary>Nhật ký giao dịch (${market.actionLog.length})</summary>
                <ul>${logHtml}</ul>
            </details>
            <details class="market-log market-json">
                <summary>Response State JSON (${view.status})</summary>
                <pre class="market-json__pre">${JSON.stringify(view, null, 2)}</pre>
            </details>
        </section>`;
}

function handleMarketTabKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const keys = Object.keys(MARKET_SHOPS);
    const current = keys.indexOf(ensureMarketState().activeTab);
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % keys.length;
    if (event.key === "ArrowLeft") next = (current - 1 + keys.length) % keys.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = keys.length - 1;
    event.preventDefault();
    selectMarketTab(keys[next]);
}

// ============================================================================
// HỆ THỐNG THẾ GIỚI (WORLD SYSTEM: PHƯỜNG THỊ • ĐẤU GIÁ • BÍ CẢNH • ĐẤU PHÁP • LỊCH LUYỆN)
// KẾT NỐI TRỰC TIẾP VỚI window.GameState (SINGLE SOURCE OF TRUTH)
// ============================================================================

// State bộ nhớ cho Đấu Giá Hội, Bí Cảnh và Lịch Luyện
const WORLD_STATE = {
    auctionLots: [
        {
            id: "lot_thanh_lien_hoa",
            name: "Thanh Liên Địa Tâm Hỏa",
            type: "Dị Hỏa Cực Phẩm",
            tier: "thien",
            icon: "fa-fire-flame-curved",
            image: "./assets/images/item_dan_pot_tier2.jpg",
            desc: "Dị hỏa sinh ra từ lòng địa nhiệt ngàn năm, tương trợ luyện đan nghịch thiên.",
            effect: "+50% Tốc độ luyện đan & +300 Công Kích",
            currentBid: 250,
            leadingBidder: "Diệp Thần",
            buyoutPrice: 600,
            remainingSeconds: 315,
            won: false
        },
        {
            id: "lot_thai_hu_kinh",
            name: "Hỗn Nguyên Thái Hư Kính",
            type: "Pháp Bảo Thần Thoại",
            tier: "thien",
            icon: "fa-shield-halved",
            image: "./assets/images/item_bamboo_scroll.jpg",
            desc: "Cổ bảo phản chiếu càn khôn, triệt tiêu sát thương từ thiên lôi ma khí.",
            effect: "+1,500 Khí Huyết, +400 Phòng Ngự",
            currentBid: 420,
            leadingBidder: "Cơ Vô Nhai",
            buyoutPrice: 900,
            remainingSeconds: 642,
            won: false
        },
        {
            id: "lot_hoa_than_dan",
            name: "Cửu Chuyển Hóa Thần Đan",
            type: "Đan Dược Nghịch Thiên",
            tier: "thien",
            icon: "fa-pills",
            image: "./assets/images/item_qi_pill_bottle.jpg",
            desc: "Cực phẩm linh đan tụ linh thiên địa, phá vỡ bình cảnh tu vi tức thì.",
            effect: "+100% Tỷ lệ đột phá cảnh giới kế tiếp",
            currentBid: 550,
            leadingBidder: "Nam Cung Nguyệt",
            buyoutPrice: 1200,
            remainingSeconds: 890,
            won: false
        },
        {
            id: "lot_tram_tien_kiem",
            name: "Bát Hoang Trảm Tiên Kiếm",
            type: "Tuyệt Phẩm Thần Binh",
            tier: "thien",
            icon: "fa-khanda",
            image: "./assets/images/item_bamboo_sword.jpg",
            desc: "Thần kiếm thượng cổ xuất thế trảm toái hư không, sát ý khiếp đảm quần ma.",
            effect: "+850 Công Kích, +15% Bạo Kích",
            currentBid: 700,
            leadingBidder: "Lãnh Vô Tình",
            buyoutPrice: 1500,
            remainingSeconds: 1420,
            won: false
        }
    ],
    dungeons: [
        {
            id: "dungeon_van_duoc",
            name: "Vạn Dược Cốc",
            realmReq: 0,
            realmName: "Luyện Khí Kỳ",
            mpCost: 20,
            durationMs: 2000,
            icon: "fa-leaf",
            desc: "Thung lũng ngập tràn linh khí, dược thảo sơ cấp và yêu thú cấp thấp sinh sống.",
            drops: "Linh Thảo, Hạt Giống, Đan Dược Hạ Phẩm, 100 - 300 Linh Thạch"
        },
        {
            id: "dungeon_hac_phong",
            name: "Hắc Phong Lĩnh",
            realmReq: 10,
            realmName: "Trúc Cơ Kỳ",
            mpCost: 50,
            durationMs: 2500,
            icon: "fa-wind",
            desc: "Vùng núi cao gió độc cuồn cuộn, nơi ẩn giấu nhiều mạch khoáng ngàn năm.",
            drops: "Huyền Thiết, Huyết Sâm, Pháp Khí Trúc Cơ, 400 - 800 Linh Thạch"
        },
        {
            id: "dungeon_huyet_ma",
            name: "Huyết Ma Bí Cảnh",
            realmReq: 14,
            realmName: "Kim Đan Kỳ",
            mpCost: 100,
            durationMs: 3000,
            icon: "fa-skull",
            desc: "Cấm địa ma đạo cổ xưa, đầy rẫy ma vật hung hãn nhưng ẩn tàng bảo vật vô giá.",
            drops: "Yêu Đan Cực Phẩm, Tử Linh Chi, Pháp Bảo Kim Đan, 1,000 - 2,500 Linh Thạch"
        },
        {
            id: "dungeon_thai_co",
            name: "Thái Cổ Di Tích",
            realmReq: 18,
            realmName: "Nguyên Anh Kỳ",
            mpCost: 200,
            durationMs: 3500,
            icon: "fa-monument",
            desc: "Tàn tích thượng cổ trôi dạt trong hư không, phong ấn dị bảo tiên thiên.",
            drops: "Dị Bảo Thượng Cổ, Dị Hỏa Tàn Diệp, 3,000 - 8,000 Linh Thạch"
        }
    ],
    arenaNPCs: [
        { rank: 1, name: "Cơ Vô Nhai", title: "Thiên Kiêu Bảng Thủ", realm: "Nguyên Anh Đỉnh Phong", cp: 120000, icon: "fa-crown", color: "text-amber-400", element: "Kim", desc: "Đại đệ tử Thái Nhất Môn, kiếm ý thông thần, từng một kiếm chém rụng thiên thạch ngoài thái không." },
        { rank: 2, name: "Nam Cung Nguyệt", title: "Băng Phách Tiên Tử", realm: "Nguyên Anh Hậu Kỳ", cp: 95000, icon: "fa-fan", color: "text-cyan-300", element: "Thủy", desc: "Thánh nữ Dao Trì Thánh Địa, băng phách huyền công đông cứng vạn dặm hư không." },
        { rank: 3, name: "Lãnh Vô Tình", title: "Tuyệt Tình Đao Ma", realm: "Nguyên Anh Sơ Kỳ", cp: 78000, icon: "fa-skull-crossbones", color: "text-rose-400", element: "Hỏa", desc: "Tán tu đao ma nhập đạo, sát phạt quyết đoán, dưới đao chưa từng có kẻ sống sót." },
        { rank: 4, name: "Sở Phong", title: "Thiên Lôi Kiếm Tôn", realm: "Kim Đan Đỉnh Phong", cp: 62000, icon: "fa-bolt", color: "text-yellow-300", element: "Kim", desc: "Truyền nhân Lôi Âm Tông, dẫn Cửu Thiên Huyền Lôi nhập kiếm, tốc độ kinh lôi trác tuyệt." },
        { rank: 5, name: "Bạch Hạc Chân Nhân", title: "Dược Vương Các Chủ", realm: "Kim Đan Hậu Kỳ", cp: 48000, icon: "fa-feather", color: "text-emerald-400", element: "Mộc", desc: "Kỳ tài đan đạo lấy thảo mộc hộ thân, sinh cơ bất tuyệt, linh lực kéo dài vĩnh cửu." },
        { rank: 6, name: "Diệp Thần", title: "Bất Diệt Cuồng Đồ", realm: "Kim Đan Trung Kỳ", cp: 35000, icon: "fa-fire", color: "text-orange-400", element: "Hỏa", desc: "Thần ma luyện thể giả, nắm đấm xé rách thương khung, càng chiến thương tích càng dũng mãnh." },
        { rank: 7, name: "Lôi Chấn Tử", title: "Côn Lôn Đệ Tử", realm: "Kim Đan Sơ Kỳ", cp: 26000, icon: "fa-cloud-bolt", color: "text-sky-300", element: "Thổ", desc: "Thiên kiêu Côn Lôn Cung, ngự thổ kết trận vững như thái sơn bất khả xâm phạm." },
        { rank: 8, name: "Thạch Hạo", title: "Đại Hoang Chí Tôn", realm: "Trúc Cơ Đỉnh Phong", cp: 18000, icon: "fa-shield", color: "text-amber-300", element: "Thổ", desc: "Thiếu niên xuất thân đại hoang, thiên sinh thần lực, nắm giữ chí tôn cốt nghịch thiên." },
        { rank: 9, name: "Tiêu Viêm", title: "Viêm Đế Hậu Nhân", realm: "Trúc Cơ Hậu Kỳ", cp: 12000, icon: "fa-flame", color: "text-rose-300", element: "Hỏa", desc: "Thiên tài sa sút nay trỗi dậy, điều khiển dị hỏa thiêu đốt đan điền địch thủ." },
        { rank: 10, name: "Hàn Lập", title: "Tiểu Tán Tu", realm: "Trúc Cơ Sơ Kỳ", cp: 8000, icon: "fa-flask", color: "text-teal-300", element: "Mộc", desc: "Tán tu bình phàm tính tình cẩn trọng, ẩn giấu vô số phù lục và độc kế phòng thân." }
    ],
    currentEncounter: null,
    isDungeonExploring: false,
    autoEncounterTimer: null
};

// Khởi tạo sự kiện lịch luyện ngẫu nhiên
function generateRandomEncounter() {
    const pool = [
        {
            title: "Gặp Gỡ Tán Tu Bị Yêu Thú Vây Khốn",
            desc: "Trên đường thám hiểm sơn cốc, đạo hữu bắt gặp một tu sĩ trẻ đang bị bầy Bạch Hổ vây hãm thập phần nguy kịch.",
            icon: "fa-person-falling",
            choiceA: {
                label: "Rút Kiếm Tương Trợ (Chính Đạo)",
                badge: "+5 Điểm Chính Đạo • +1 Thảo Dược • +200 Tu Vi",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.righteous = (gs.righteous || 0) + 5;
                        if (gs.materials) gs.materials.herbs = (gs.materials.herbs || 0) + 1;
                        if (typeof window.addExp === 'function') window.addExp(200);
                    }
                    if (typeof addLog === 'function') {
                        addLog(`✨ <span class="text-sky-300 font-bold">[Lịch Luyện]</span> Ra tay tương trợ tiểu tu sĩ, nhận được sự cảm kích dâng tặng 1 Linh Thảo. <b class="text-cyan-300">+5 Chính Đạo</b>, <b class="text-amber-300">+200 Tu Vi</b>!`, "text-sky-300");
                    }
                }
            },
            choiceB: {
                label: "Tọa Sơn Quan Hổ Đấu (Ma Đạo)",
                badge: "+5 Điểm Ma Đạo • +300 Linh Thạch",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.demonic = (gs.demonic || 0) + 5;
                        gs.spiritStones = (gs.spiritStones || 0) + 300;
                    }
                    if (typeof addLog === 'function') {
                        addLog(`🔥 <span class="text-rose-400 font-bold">[Lịch Luyện]</span> Đứng trên cao quan sát đoạt lấy túi trữ vật vô chủ, thu được 300 Linh Thạch. <b class="text-rose-400">+5 Ma Đạo</b>!`, "text-rose-400");
                    }
                }
            }
        },
        {
            title: "Khai Quật Thảo Dược Ngàn Năm",
            desc: "Dưới chân vách đá dựng đứng tỏa ra dược hương nồng nặc, một gốc Thiên Niên Huyết Sâm vừa nở hoa rực rỡ.",
            icon: "fa-seedling",
            choiceA: {
                label: "Cẩn Thận Thu Hái (Chính Đạo)",
                badge: "+5 Điểm Chính Đạo • +1 Huyết Sâm Trăm Năm",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.righteous = (gs.righteous || 0) + 5;
                        if (gs.materials) gs.materials.huyetSam = (gs.materials.huyetSam || 0) + 1;
                    }
                    if (typeof addLog === 'function') {
                        addLog(`🌿 <span class="text-emerald-400 font-bold">[Lịch Luyện]</span> Thu hái dược thảo cẩn trọng giữ nguyên linh căn đất trời, thu được 1 Huyết Sâm. <b class="text-cyan-300">+5 Chính Đạo</b>!`, "text-emerald-300");
                    }
                }
            },
            choiceB: {
                label: "Huyết Tế Rút Cạn Dược Tính (Ma Đạo)",
                badge: "+5 Điểm Ma Đạo • +2 Huyết Sâm • +500 Tu Vi",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.demonic = (gs.demonic || 0) + 5;
                        if (gs.materials) gs.materials.huyetSam = (gs.materials.huyetSam || 0) + 2;
                        if (typeof window.addExp === 'function') window.addExp(500);
                    }
                    if (typeof addLog === 'function') {
                        addLog(`🩸 <span class="text-rose-400 font-bold">[Lịch Luyện]</span> Vận ma công rút cạn linh khí vùng đất, cưỡng đoạt 2 Huyết Sâm và hấp thụ 500 Tu Vi. <b class="text-rose-400">+5 Ma Đạo</b>!`, "text-rose-400");
                    }
                }
            }
        },
        {
            title: "Trảm Yêu Tiễu Trừ Ma Lĩnh",
            desc: "Một toán tà tu cướp bóc đang áp giải hàng hóa cướp được từ phàm trần ngang qua đường mòn.",
            icon: "fa-skull-crossbones",
            choiceA: {
                label: "Chính Khí Trừ Tà (Chính Đạo)",
                badge: "+10 Điểm Chính Đạo • +1 Yêu Đan • +350 Linh Thạch",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.righteous = (gs.righteous || 0) + 10;
                        gs.spiritStones = (gs.spiritStones || 0) + 350;
                        if (gs.materials) gs.materials.yeuDan = (gs.materials.yeuDan || 0) + 1;
                    }
                    if (typeof addLog === 'function') {
                        addLog(`⚔️ <span class="text-amber-300 font-bold">[Lịch Luyện]</span> Vung kiếm trảm yêu bảo vệ bá tánh, nhận được Yêu Đan và 350 Linh Thạch. <b class="text-cyan-300">+10 Chính Đạo</b>!`, "text-amber-300 font-bold");
                    }
                }
            },
            choiceB: {
                label: "Thu Nạp Làm Thuộc Hạ (Ma Đạo)",
                badge: "+10 Điểm Ma Đạo • +1,000 Tu Vi",
                action: () => {
                    const gs = window.GameState;
                    if (gs) {
                        gs.demonic = (gs.demonic || 0) + 10;
                        if (typeof window.addExp === 'function') window.addExp(1000);
                    }
                    if (typeof addLog === 'function') {
                        addLog(`🔥 <span class="text-rose-400 font-bold">[Lịch Luyện]</span> Uy áp ma uy thu phục đám tà tu, nhận được 1,000 Tu Vi phụng hiến. <b class="text-rose-400">+10 Ma Đạo</b>!`, "text-rose-400");
                    }
                }
            }
        }
    ];
    return pool[Math.floor(Math.random() * pool.length)];
}

// BỘ ĐIỀU PHỐI CHÍNH CÁC TRANG THẾ GIỚI
function renderWorldPage(sub = 'market', container = null) {
    let content = container;
    if (!content) {
        content = document.getElementById(`world-${sub}-page-content`) || document.getElementById(`page-world-${sub}-content`);
    }
    if (!content) return;

    if (sub === 'market') {
        renderWorldMarketPage(content);
    } else if (sub === 'auction') {
        if (typeof window.renderWorldAuctionHub === 'function' && window.renderWorldAuctionHub !== renderWorldAuctionPage) {
            window.renderWorldAuctionHub(content);
        } else {
            renderWorldAuctionPage(content);
        }
    } else if (sub === 'dungeon') {
        if (typeof window.renderWorldDungeonHub === 'function' && window.renderWorldDungeonHub !== renderWorldDungeonPage) {
            window.renderWorldDungeonHub(content);
        } else {
            renderWorldDungeonPage(content);
        }
    } else if (sub === 'arena') {
        renderWorldArenaPage(content);
    } else if (sub === 'encounter') {
        if (typeof window.renderWorldExpeditionDashboard === 'function' && window.renderWorldExpeditionDashboard !== renderWorldEncounterPage) {
            window.renderWorldExpeditionDashboard(content);
        } else {
            renderWorldEncounterPage(content);
        }
    }
}

// ==========================================
// 1. PHƯỜNG THỊ (WORLD MARKET PAGE)
// ==========================================
window.currentMarketSubTab = window.currentMarketSubTab || 'shop';

function switchMarketSubTab(tab) {
    window.currentMarketSubTab = tab;
    renderWorldPage('market');
}
window.switchMarketSubTab = switchMarketSubTab;

// Định nghĩa tra cứu vật phẩm để đồng bộ chuẩn xác với GameState.inventory
const WORLD_MARKET_DEFS = {
    herbs: { id: 'herb_spirit', name: 'Thảo Dược Sơ Cấp', category: 'herbs', rarity: 1 },
    huyetSam: { id: 'huyet_sam', name: 'Huyết Sâm Trăm Năm', category: 'herbs', rarity: 2 },
    linhChi: { id: 'linh_chi', name: 'Tử Linh Chi Thượng Phẩm', category: 'herbs', rarity: 3 },
    tinhThuy: { id: 'tinh_thuy', name: 'Huyền Âm Tinh Thủy', category: 'herbs', rarity: 4 },
    ores: { id: 'stone_ore', name: 'Khoáng Thạch Thô', category: 'ores', rarity: 1 },
    huyenThiet: { id: 'huyen_thiet', name: 'Huyền Thiết Ngàn Năm', category: 'ores', rarity: 3 },
    seed_linh_thao: { id: 'seed_linh_thao', name: 'Hạt Giống Linh Thảo', category: 'seeds', rarity: 1 },
    seed_ngoc_sam: { id: 'seed_ngoc_sam', name: 'Hạt Giống Ngọc Sâm', category: 'seeds', rarity: 2 },
    seed_tuyet_lien: { id: 'seed_tuyet_lien', name: 'Hạt Giống Tuyết Liên', category: 'seeds', rarity: 3 },
    tramCai: { id: 'tram_cai', name: 'Trâm Cài Bạch Ngọc', category: 'gifts', rarity: 2 },
    luuLy: { id: 'luu_ly', name: 'Lưu Ly Bảo Châu', category: 'gifts', rarity: 3 },
    hoaLacTinh: { id: 'hoa_lac_tinh', name: 'Hoa Lạc Tinh', category: 'gifts', rarity: 4 }
};

function getMarketItemOwned(key, type, def) {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const d = def || WORLD_MARKET_DEFS[key] || { id: key, name: key };
    let count = 0;

    // 1. Check in GameState.inventory or state.inventory
    const inv = Array.isArray(gs.inventory) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    for (const item of inv) {
        if (!item) continue;
        if (item.id === d.id || item.id === key || item.name === d.name || (item.name && item.name.includes(d.name)) || (d.name && d.name.includes(item.name))) {
            count += (Number(item.count ?? item.quantity) || 1);
        }
    }

    // 2. Direct resource structures in GameState
    if (gs.herbs && gs.herbs[key]) count += Number(gs.herbs[key]) || 0;
    if (gs.ores && gs.ores[key]) count += Number(gs.ores[key]) || 0;
    if (gs.materials && gs.materials[key]) count += Number(gs.materials[key]) || 0;
    if (gs.gifts && gs.gifts[key]) count += Number(gs.gifts[key]) || 0;

    return count;
}

function calculateItemSellPrice(item) {
    if (!item) return 10;
    if (typeof item.sellPrice === 'number' && item.sellPrice > 0) return item.sellPrice;
    if (typeof item.price === 'number' && item.price > 0) return Math.max(5, Math.floor(item.price * 0.4));
    
    // Fallback pricing based on rarity / tier
    const r = Number(item.rarity || item.tier || 1);
    switch (r) {
        case 1: return 30;    // Phẩm
        case 2: return 120;   // Linh
        case 3: return 450;   // Huyền
        case 4: return 1800;  // Địa
        case 5: return 8000;  // Thiên
        case 6: return 35000; // Tiên / Thần
        default: return 50;
    }
}

function renderWorldMarketPage(container) {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const stones = Number(gs.stones ?? gs.spiritStones ?? s?.stones) || 0;
    const jade = Number(gs.jade ?? gs.immortalJade ?? s?.immortalJade) || 0;
    const currentTab = window.currentMarketSubTab || 'shop';

    const marketSections = [
        {
            title: "🌿 Dược Thảo Luyện Đan",
            items: [
                { key: 'herbs', name: "Thảo Dược Sơ Cấp", type: "mat", price: 10, sellPrice: 5, icon: "fa-leaf", tier: "pham", desc: "Dược thảo xanh tốt ngưng tụ linh khí sơ khai." },
                { key: 'huyetSam', name: "Huyết Sâm Trăm Năm", type: "mat", price: 50, sellPrice: 25, icon: "fa-seedling", tier: "linh", desc: "Huyết sâm hút khí huyết đất trời, dược lực dồi dào." },
                { key: 'linhChi', name: "Tử Linh Chi Thượng Phẩm", type: "mat", price: 120, sellPrice: 60, icon: "fa-cannabis", tier: "huyen", desc: "Linh chi tím cực phẩm giúp vững bền đan điền." },
                { key: 'tinhThuy', name: "Huyền Âm Tinh Thủy", type: "mat", price: 250, sellPrice: 120, icon: "fa-droplet", tier: "dia", desc: "Giọt nước tinh khiết ngưng tụ ngàn năm nơi hàn đầm." }
            ]
        },
        {
            title: "⛏️ Khoáng Thạch Luyện Khí",
            items: [
                { key: 'ores', name: "Khoáng Thạch Thô", type: "mat", price: 15, sellPrice: 7, icon: "fa-gem", tier: "pham", desc: "Quặng sắt chứa linh tạp chất cơ bản." },
                { key: 'huyenThiet', name: "Huyền Thiết Ngàn Năm", type: "mat", price: 80, sellPrice: 40, icon: "fa-cube", tier: "huyen", desc: "Hắc thiết rèn từ thiên thạch ngàn năm cực kỳ cứng rắn." }
            ]
        },
        {
            title: "🌱 Hạt Giống Gia Viên",
            items: [
                { key: 'seed_linh_thao', name: "Hạt Giống Linh Thảo", type: "seed", price: 20, sellPrice: 10, icon: "fa-wheat-awn", tier: "pham", desc: "Hạt giống thảo mộc mau lớn cho dược điền." },
                { key: 'seed_ngoc_sam', name: "Hạt Giống Ngọc Sâm", type: "seed", price: 60, sellPrice: 30, icon: "fa-seedling", tier: "linh", desc: "Mầm cây ngọc sâm cần bồi dưỡng đất màu mỡ." },
                { key: 'seed_tuyet_lien', name: "Hạt Giống Tuyết Liên", type: "seed", price: 150, sellPrice: 75, icon: "fa-spa", tier: "huyen", desc: "Hạt giống hoa sen tuyết hiếm thấy trên đỉnh tuyết sơn." }
            ]
        },
        {
            title: "🎁 Lễ Vật Đạo Lữ",
            items: [
                { key: 'tramCai', name: "Trâm Cài Bạch Ngọc", type: "gift", price: 100, sellPrice: 50, icon: "fa-wand-magic-sparkles", tier: "linh", desc: "Trâm cài ngọc trắng tinh tế tặng đạo lữ tăng thiện cảm." },
                { key: 'luuLy', name: "Lưu Ly Bảo Châu", type: "gift", price: 250, sellPrice: 125, icon: "fa-circle-dot", tier: "huyen", desc: "Bảo châu lưu ly tỏa ánh ngũ sắc quý phái." },
                { key: 'hoaLacTinh', name: "Hoa Lạc Tinh", type: "gift", price: 500, sellPrice: 250, icon: "fa-fan", tier: "dia", desc: "Đóa hoa kết tinh từ ánh sao rơi lấp lánh ngàn năm." }
            ]
        }
    ];

    const inv = Array.isArray(gs.inventory) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const recyclableItems = inv.filter(item => item && !item.equipped);

    container.innerHTML = `
        <div class="space-y-4">
            <!-- VÍ TIỀN TOP BANNER -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-lg shadow-md shrink-0">
                        <i class="fa-solid fa-shop"></i>
                    </span>
                    <div>
                        <h3 class="font-serif text-base font-bold text-amber-300">🏮 Vạn Bảo Phường Thị</h3>
                        <p class="text-xs text-stone-400">Giao thương vạn dặm • Cung ứng linh tài tu luyện & Thu mua càn khôn nang</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-stone-800 flex items-center gap-2">
                        <i class="fa-solid fa-gem text-amber-400 text-xs"></i>
                        <span class="text-xs text-stone-400">Linh Thạch:</span>
                        <strong class="text-amber-300 font-mono text-sm">${stones.toLocaleString('vi-VN')}</strong>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-stone-800 flex items-center gap-2">
                        <i class="fa-solid fa-diamond text-purple-400 text-xs"></i>
                        <span class="text-xs text-stone-400">Tiên Ngọc:</span>
                        <strong class="text-purple-300 font-mono text-sm">${jade.toLocaleString('vi-VN')}</strong>
                    </div>
                </div>
            </div>

            <!-- SUB-NAV PHÂN PHÒNG PHƯỜNG THỊ -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-slate-950/90 border border-stone-800">
                <div class="flex items-center gap-2">
                    <button type="button" onclick="switchMarketSubTab('shop')" class="px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${currentTab === 'shop' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-md' : 'text-stone-400 hover:text-stone-200 border border-transparent'}">
                        <i class="fa-solid fa-store text-amber-400"></i>
                        <span>🏮 Vạn Bảo Tiệm (Mua Bán Thường Dùng)</span>
                    </button>
                    <button type="button" onclick="switchMarketSubTab('recycle')" class="px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${currentTab === 'recycle' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-md' : 'text-stone-400 hover:text-stone-200 border border-transparent'}">
                        <i class="fa-solid fa-sack-dollar text-emerald-400"></i>
                        <span>💼 Thu Mua Túi Đồ (Thanh Lý Linh Thạch)</span>
                        <span class="px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-400 text-[10px] font-mono">${recyclableItems.length}</span>
                    </button>
                </div>
                ${currentTab === 'recycle' ? `
                    <button type="button" onclick="batchSellCommonItems()" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-broom text-amber-400"></i>
                        <span>🧹 Thu Mua Nhanh Đồ Phổ Thông (Phẩm 1-2)</span>
                    </button>
                ` : ''}
            </div>

            <!-- TAB 1: VẠN BẢO TIỆM -->
            ${currentTab === 'shop' ? `
                <div class="space-y-4">
                    ${marketSections.map(sec => `
                        <div class="space-y-2">
                            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider pl-1">${sec.title}</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                ${sec.items.map(it => {
                                    const owned = getMarketItemOwned(it.key, it.type, it);
                                    const tierBorder = it.tier === 'dia' ? 'border-purple-500/70' :
                                                       it.tier === 'huyen' ? 'border-sky-500/60' :
                                                       it.tier === 'linh' ? 'border-emerald-500/60' : 'border-stone-800';

                                    return `
                                        <div class="p-3 rounded-xl bg-slate-900/80 border ${tierBorder} flex flex-col justify-between gap-2.5 shadow-md hover:border-amber-400/60 transition">
                                            <div>
                                                <div class="flex items-center justify-between gap-2 mb-1.5">
                                                    <div class="flex items-center gap-2">
                                                        <span class="w-7 h-7 rounded-lg bg-slate-950 border border-stone-700 flex items-center justify-center text-amber-400 text-xs shrink-0">
                                                            <i class="fa-solid ${it.icon}"></i>
                                                        </span>
                                                        <h5 class="text-xs font-bold text-slate-100 truncate">${it.name}</h5>
                                                    </div>
                                                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 border border-stone-800 shrink-0">
                                                        Có: ${owned}
                                                    </span>
                                                </div>
                                                <p class="text-[10.5px] text-stone-400 line-clamp-2">${it.desc}</p>
                                            </div>

                                            <div class="pt-2 border-t border-stone-800/80 space-y-2">
                                                <div class="flex items-center justify-between text-[11px] font-mono">
                                                    <span class="text-amber-300">Mua: <b>${it.price} LT</b></span>
                                                    <span class="text-stone-400">Bán: <b>${it.sellPrice} LT</b></span>
                                                </div>

                                                <div class="grid grid-cols-2 gap-1.5">
                                                    <button type="button" onclick="buyWorldMarketItem('${it.key}', '${it.type}', ${it.price}, 1)" class="py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition cursor-pointer">
                                                        Mua +1
                                                    </button>
                                                    <button type="button" onclick="sellWorldMarketItem('${it.key}', '${it.type}', ${it.sellPrice}, 1)" ${owned <= 0 ? 'disabled' : ''} class="py-1 rounded-lg ${owned > 0 ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer' : 'bg-slate-950 text-stone-600 border border-stone-900 cursor-not-allowed'} text-[11px] font-semibold transition">
                                                        Bán -1
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <!-- TAB 2: THU MUA TÚI ĐỒ (INVENTORY RECYCLE) -->
                <div class="space-y-3">
                    <div class="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center justify-between text-xs text-stone-300">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-emerald-400"></i>
                            <span>Thương nhân Phường Thị định giá thu mua bảo vật theo phẩm chất. Trang bị đang mặc trên người được bảo hộ an toàn.</span>
                        </div>
                        <span class="text-stone-400 font-mono text-[11px]">Vật phẩm khả dụng: <strong class="text-emerald-400">${recyclableItems.length}</strong></span>
                    </div>

                    ${recyclableItems.length === 0 ? `
                        <div class="py-16 text-center rounded-2xl bg-slate-950/60 border border-dashed border-stone-800 space-y-3">
                            <span class="w-14 h-14 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-center text-stone-500 text-2xl mx-auto shadow-inner">
                                <i class="fa-solid fa-box-open"></i>
                            </span>
                            <h4 class="text-sm font-bold text-stone-300">Càn Khôn Bảo Nang Sạch Sẽ</h4>
                            <p class="text-xs text-stone-500 max-w-md mx-auto">Hiện không có trang bị hay linh tài thặng dư nào để thanh lý. Hãy thám hiểm Bí Cảnh hoặc khiêu chiến Trấn Yêu Tháp để thu hoạch thêm!</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            ${recyclableItems.map(item => {
                                const unitPrice = calculateItemSellPrice(item);
                                const qty = Number(item.count ?? item.quantity) || 1;
                                const totalVal = unitPrice * qty;
                                const r = Number(item.rarity || item.tier || 1);
                                const rarityColor = r >= 5 ? 'text-amber-400 border-amber-500/50 bg-amber-950/30' :
                                                    r === 4 ? 'text-purple-400 border-purple-500/50 bg-purple-950/30' :
                                                    r === 3 ? 'text-sky-400 border-sky-500/50 bg-sky-950/30' :
                                                    r === 2 ? 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30' :
                                                              'text-stone-400 border-stone-800 bg-slate-950';

                                const rarityName = r >= 6 ? 'Thần Phẩm' :
                                                   r === 5 ? 'Thiên Phẩm' :
                                                   r === 4 ? 'Địa Phẩm' :
                                                   r === 3 ? 'Huyền Phẩm' :
                                                   r === 2 ? 'Linh Phẩm' : 'Phàm Phẩm';

                                const iconClass = item.icon || (item.type === 'weapon' ? 'fa-khanda' : (item.type === 'armor' ? 'fa-shield-halved' : 'fa-box'));

                                const safeId = item.id ? String(item.id).replace(/'/g, "\\'") : String(item.name).replace(/'/g, "\\'");

                                return `
                                    <div class="p-3.5 rounded-xl bg-slate-900/90 border border-stone-800/80 hover:border-emerald-500/50 transition flex flex-col justify-between gap-3 shadow-md">
                                        <div class="flex items-start justify-between gap-2.5">
                                            <div class="flex items-start gap-2.5 min-w-0">
                                                <span class="w-9 h-9 rounded-lg bg-slate-950 border border-stone-700 flex items-center justify-center text-amber-400 text-sm shrink-0 shadow">
                                                    <i class="fa-solid ${iconClass}"></i>
                                                </span>
                                                <div class="min-w-0">
                                                    <h5 class="text-xs font-bold text-slate-100 truncate">${item.name}</h5>
                                                    <div class="flex items-center gap-1.5 mt-1">
                                                        <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${rarityColor}">
                                                            ${rarityName}
                                                        </span>
                                                        <span class="text-[10.5px] text-stone-400 truncate">${item.type || 'Linh Vật'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="text-right shrink-0">
                                                <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-stone-800">
                                                    x${qty}
                                                </span>
                                            </div>
                                        </div>

                                        <p class="text-[11px] text-stone-400 line-clamp-2">${item.desc || 'Chiến lợi phẩm thu được qua tu luyện và thám hiểm bát hoang.'}</p>

                                        <div class="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                                            <div class="text-[11px] font-mono text-stone-400">
                                                Giá thu: <strong class="text-amber-300">${unitPrice.toLocaleString('vi-VN')} LT</strong>
                                                ${qty > 1 ? `<span class="text-[10px] text-stone-500"> (Tổng: ${totalVal.toLocaleString('vi-VN')})</span>` : ''}
                                            </div>
                                            <div class="flex items-center gap-1.5 shrink-0">
                                                <button type="button" onclick="sellInventoryItem('${safeId}', 1)" class="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-semibold transition cursor-pointer">
                                                    Bán 1
                                                </button>
                                                ${qty > 1 ? `
                                                    <button type="button" onclick="sellInventoryItem('${safeId}', ${qty})" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 text-[11px] font-bold transition cursor-pointer">
                                                        Bán Hết
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            `}
        </div>
    `;
}

// Thao tác Mua vật phẩm Phường Thị
function buyWorldMarketItem(key, type, price, amount = 1) {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;
    const totalCost = price * amount;
    const currentStones = Number(gs?.stones ?? gs?.spiritStones ?? s?.stones) || 0;
    if (currentStones < totalCost) {
        const msg = `⚠️ Linh Thạch không đủ để mua vật phẩm này (Cần ${totalCost.toLocaleString('vi-VN')} LT, hiện có ${currentStones.toLocaleString('vi-VN')} LT)!`;
        if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, "warning");
        return;
    }

    const newStones = currentStones - totalCost;
    if (gs) {
        gs.stones = newStones;
        gs.spiritStones = newStones;
    }
    if (s) {
        s.stones = newStones;
    }

    const def = WORLD_MARKET_DEFS[key] || { id: key, name: key, category: type, rarity: 2 };
    const inv = (gs && Array.isArray(gs.inventory)) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const existing = inv.find(i => i && (i.id === def.id || i.id === key || i.name === def.name));
    if (existing) {
        existing.count = (Number(existing.count ?? existing.quantity) || 0) + amount;
        existing.quantity = existing.count;
    } else {
        inv.push({
            id: def.id,
            name: def.name,
            type: type === 'gift' ? 'Lễ Vật' : (type === 'seed' ? 'Hạt Giống' : 'Nguyên Liệu'),
            category: def.category,
            count: amount,
            quantity: amount,
            rarity: def.rarity || 2,
            icon: 'fa-box'
        });
    }
    if (gs) gs.inventory = inv;
    if (s) s.inventory = inv;

    // Đồng bộ vào kho dược liệu / khoáng thạch nếu có
    if (def.category === 'herbs') {
        if (gs) {
            gs.herbs = gs.herbs || {};
            gs.herbs[key] = (Number(gs.herbs[key]) || 0) + amount;
        }
    } else if (def.category === 'ores') {
        if (gs) {
            gs.ores = gs.ores || {};
            gs.ores[key] = (Number(gs.ores[key]) || 0) + amount;
        }
    }

    if (typeof playSound === 'function') playSound('click');
    if (typeof addLog === 'function') {
        addLog(`🏮 <span class="text-amber-300 font-bold">[Phường Thị]</span> Mua thành công <strong>${amount}x ${def.name}</strong> (Tiêu hao <strong>${totalCost.toLocaleString('vi-VN')} Linh Thạch</strong>)!`, "text-amber-300");
    }
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`🏮 Mua thành công ${amount}x ${def.name}!`, "success");
    }

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();
    renderWorldPage('market');
}
window.buyWorldMarketItem = buyWorldMarketItem;
window.buyMarketItem = buyWorldMarketItem;

// Thao tác Bán vật phẩm Phường Thị (Tab Tiệm)
function sellWorldMarketItem(key, type, sellPrice, amount = 1) {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;

    const def = WORLD_MARKET_DEFS[key] || { id: key, name: key };
    const owned = getMarketItemOwned(key, type, def);

    if (owned < amount) {
        const msg = `⚠️ Không có đủ vật phẩm để bán!`;
        if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, "warning");
        return;
    }

    const earnings = sellPrice * amount;
    const currentStones = Number(gs?.stones ?? gs?.spiritStones ?? s?.stones) || 0;
    const newStones = currentStones + earnings;
    if (gs) {
        gs.stones = newStones;
        gs.spiritStones = newStones;
    }
    if (s) {
        s.stones = newStones;
    }

    // Trừ vật phẩm trong inventory
    const inv = Array.isArray(gs?.inventory) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const existing = inv.find(i => i && (i.id === def.id || i.id === key || i.name === def.name || (i.name && i.name.includes(key))));
    if (existing) {
        const cur = Number(existing.count ?? existing.quantity) || 1;
        const remaining = Math.max(0, cur - amount);
        existing.count = remaining;
        existing.quantity = remaining;
        if (remaining <= 0) {
            const idx = inv.indexOf(existing);
            if (idx >= 0) inv.splice(idx, 1);
        }
    }
    if (gs) gs.inventory = inv;
    if (s) s.inventory = inv;

    // Trừ kho nguyên liệu trực tiếp nếu có
    if (gs && gs.herbs && gs.herbs[key]) {
        gs.herbs[key] = Math.max(0, (Number(gs.herbs[key]) || 0) - amount);
    }
    if (gs && gs.ores && gs.ores[key]) {
        gs.ores[key] = Math.max(0, (Number(gs.ores[key]) || 0) - amount);
    }
    if (gs && gs.materials && gs.materials[key]) {
        gs.materials[key] = Math.max(0, (Number(gs.materials[key]) || 0) - amount);
    }

    if (typeof playSound === 'function') playSound('click');
    if (typeof addLog === 'function') {
        addLog(`💰 <span class="text-emerald-400 font-bold">[Phường Thị]</span> Xuất bán <strong>${amount}x ${def.name}</strong>, thu về <strong>+${earnings.toLocaleString('vi-VN')} Linh Thạch</strong>!`, "text-emerald-300");
    }
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`💰 Đã bán ${amount}x ${def.name} (+${earnings.toLocaleString('vi-VN')} LT)!`, "success");
    }

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();
    renderWorldPage('market');
}
window.sellWorldMarketItem = sellWorldMarketItem;
window.sellMarketItem = sellWorldMarketItem;

// Thao tác Thanh Lý đơn lẻ trong Túi Đồ
function sellInventoryItem(identifier, amount = 1) {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;

    const inv = Array.isArray(gs?.inventory) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const item = inv.find(i => i && !i.equipped && (String(i.id) === String(identifier) || String(i.name) === String(identifier)));
    if (!item) {
        if (typeof window.showGameToast === 'function') window.showGameToast("⚠️ Không tìm thấy vật phẩm hoặc vật phẩm đang được trang bị!", "warning");
        return;
    }

    const currentCount = Number(item.count ?? item.quantity) || 1;
    const sellQty = Math.min(currentCount, Math.max(1, Math.floor(amount)));
    const unitPrice = calculateItemSellPrice(item);
    const totalEarnings = unitPrice * sellQty;

    // Deduct count or remove item
    if (currentCount <= sellQty) {
        const idx = inv.indexOf(item);
        if (idx >= 0) inv.splice(idx, 1);
    } else {
        item.count = currentCount - sellQty;
        item.quantity = item.count;
    }
    if (gs) gs.inventory = inv;
    if (s) s.inventory = inv;

    // Add stones to GameState
    const currentStones = Number(gs?.stones ?? gs?.spiritStones ?? s?.stones) || 0;
    const newStones = currentStones + totalEarnings;
    if (gs) {
        gs.stones = newStones;
        gs.spiritStones = newStones;
    }
    if (s) s.stones = newStones;

    if (typeof playSound === 'function') playSound('click');
    const msg = `💰 <span class="text-emerald-400 font-bold">[Phường Thị]</span> Thanh lý thành công <strong>${sellQty}x ${item.name}</strong>, thu về <strong>+${totalEarnings.toLocaleString('vi-VN')} Linh Thạch</strong>!`;
    if (typeof addLog === 'function') addLog(msg, "text-emerald-300");
    if (typeof window.showGameToast === 'function') window.showGameToast(`💰 Đã thanh lý ${sellQty}x ${item.name} (+${totalEarnings.toLocaleString('vi-VN')} LT)!`, "success");

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();

    renderWorldPage('market');
}
window.sellInventoryItem = sellInventoryItem;

// Thao tác Thanh Lý Nhanh đồ phẩm chất Phổ Thông & Linh Phẩm (Phẩm 1-2)
function batchSellCommonItems() {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;

    const inv = Array.isArray(gs?.inventory) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const commonItems = inv.filter(i => i && !i.equipped && (Number(i.rarity || i.tier || 1) <= 2));
    if (commonItems.length === 0) {
        if (typeof window.showGameToast === 'function') window.showGameToast("ℹ️ Không có vật phẩm phẩm cấp Phổ Thông (Phẩm 1-2) cần thanh lý!", "info");
        return;
    }

    let totalSoldItems = 0;
    let totalEarnings = 0;

    for (const item of commonItems) {
        const count = Number(item.count ?? item.quantity) || 1;
        const unitPrice = calculateItemSellPrice(item);
        const gain = unitPrice * count;
        totalSoldItems += count;
        totalEarnings += gain;

        const idx = inv.indexOf(item);
        if (idx >= 0) inv.splice(idx, 1);
    }

    if (gs) gs.inventory = inv;
    if (s) s.inventory = inv;

    const currentStones = Number(gs?.stones ?? gs?.spiritStones ?? s?.stones) || 0;
    const newStones = currentStones + totalEarnings;
    if (gs) {
        gs.stones = newStones;
        gs.spiritStones = newStones;
    }
    if (s) s.stones = newStones;

    if (typeof playSound === 'function') playSound('click');
    const msg = `🧹 <span class="text-emerald-400 font-bold">[Phường Thị]</span> Thanh lý nhanh <strong>${totalSoldItems} vật phẩm</strong> phẩm chất Phổ Thông & Linh Phẩm, thu về <strong>+${totalEarnings.toLocaleString('vi-VN')} Linh Thạch</strong>!`;
    if (typeof addLog === 'function') addLog(msg, "text-emerald-300");
    if (typeof window.showGameToast === 'function') window.showGameToast(`🧹 Đã thanh lý nhanh ${totalSoldItems} vật phẩm (+${totalEarnings.toLocaleString('vi-VN')} LT)!`, "success");

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();

    renderWorldPage('market');
}
window.batchSellCommonItems = batchSellCommonItems;

// ==========================================
// 2. ĐẤU GIÁ HỘI (WORLD AUCTION PAGE)
// ==========================================
function renderWorldAuctionPage(container) {
    const gs = window.GameState || {};
    const jade = Number(gs.immortalJade) || 0;
    const lots = WORLD_STATE.auctionLots;

    container.innerHTML = `
        <div class="space-y-4">
            <!-- HEADER -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 text-lg shadow-md shrink-0">
                        <i class="fa-solid fa-gavel"></i>
                    </span>
                    <div>
                        <h3 class="font-serif text-base font-bold text-purple-300">🔨 Đấu Giá Hội Cửu Châu</h3>
                        <p class="text-xs text-stone-400">Đấu giá kỳ trân dị bảo bằng Tiên Ngọc, thời gian có hạn</p>
                    </div>
                </div>
                <div class="px-4 py-2 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center gap-2">
                    <i class="fa-solid fa-diamond text-purple-400 text-sm"></i>
                    <span class="text-xs text-stone-400">Tiên Ngọc Hiện Có:</span>
                    <strong class="text-purple-300 font-mono text-base">${jade.toLocaleString('vi-VN')}</strong>
                </div>
            </div>

            <!-- 4 VẬT PHẨM ĐẤU GIÁ -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${lots.map(lot => {
                    const remMins = Math.floor(lot.remainingSeconds / 60);
                    const remSecs = lot.remainingSeconds % 60;
                    const isLeading = lot.leadingBidder === "Bản Tôn";

                    return `
                        <div class="p-4 rounded-2xl bg-slate-950/90 border ${lot.won ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-purple-500/40'} shadow-xl flex flex-col justify-between space-y-3.5">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${lot.won ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-purple-950 text-purple-300 border border-purple-500/30'}">
                                        ${lot.won ? '✓ ĐÃ SỞ HỮU' : `⏱️ Còn ${remMins}m ${remSecs}s`}
                                    </span>
                                    <span class="text-[11px] font-bold text-amber-400">${lot.type}</span>
                                </div>

                                <div class="flex items-center gap-3 mb-2">
                                    <div class="w-12 h-12 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center justify-center text-xl text-purple-400 shrink-0">
                                        <i class="fa-solid ${lot.icon}"></i>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-bold text-slate-100">${lot.name}</h4>
                                        <p class="text-xs text-emerald-400 font-semibold mt-0.5">${lot.effect}</p>
                                    </div>
                                </div>
                                <p class="text-[11px] text-stone-400">${lot.desc}</p>

                                <div class="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-stone-800 grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div>
                                        <span class="text-[10px] text-stone-400 block font-sans">Giá Đấu Hiện Tại:</span>
                                        <b class="text-purple-300 text-sm">${lot.currentBid} Tiên Ngọc</b>
                                        <div class="text-[10px] text-stone-400 font-sans">Dẫn đầu: <strong class="${isLeading ? 'text-emerald-400' : 'text-amber-300'}">${lot.leadingBidder}</strong></div>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-[10px] text-stone-400 block font-sans">Giá Mua Đứt:</span>
                                        <b class="text-amber-400 text-sm">${lot.buyoutPrice} Tiên Ngọc</b>
                                        <div class="text-[10px] text-emerald-400 font-sans">Sở hữu ngay</div>
                                    </div>
                                </div>
                            </div>

                            ${!lot.won ? `
                                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
                                    <button type="button" onclick="bidAuctionItem('${lot.id}')" class="py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                                        <i class="fa-solid fa-arrow-up"></i> Đấu Giá (+50)
                                    </button>
                                    <button type="button" onclick="buyoutAuctionItem('${lot.id}')" class="py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                        <i class="fa-solid fa-bolt"></i> Mua Đứt
                                    </button>
                                </div>
                            ` : `
                                <div class="py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center text-xs font-bold text-emerald-300">
                                    ✨ Vật phẩm đã nằm trong Túi Trữ Vật của Bản Tôn!
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function bidAuctionItem(lotId) {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;
    const lot = WORLD_STATE.auctionLots.find(l => l.id === lotId);
    if (!lot || lot.won) return;

    const bidCost = 50;
    const currentJade = Number(gs?.jade ?? gs?.immortalJade ?? s?.immortalJade) || 0;
    if (currentJade < bidCost) {
        const msg = `⚠️ Tiên Ngọc không đủ để tham gia đấu giá (Cần ${bidCost} Tiên Ngọc, hiện có ${currentJade})!`;
        if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, "warning");
        return;
    }

    const newJade = currentJade - bidCost;
    if (gs) {
        gs.jade = newJade;
        gs.immortalJade = newJade;
    }
    if (s) {
        s.immortalJade = newJade;
    }

    lot.currentBid += bidCost;
    lot.leadingBidder = "Bản Tôn";

    if (typeof playSound === 'function') playSound('bell');
    if (typeof addLog === 'function') {
        addLog(`🔨 <span class="text-purple-300 font-bold">[Đấu Giá Hội]</span> Bản Tôn xuất ngọc ra giá: <strong>${lot.name}</strong> đạt mốc <strong>${lot.currentBid} Tiên Ngọc</strong>!`, "text-purple-300");
    }
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`🔨 Đã ra giá ${lot.currentBid} Tiên Ngọc cho ${lot.name}!`, "info");
    }

    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    renderWorldPage('auction');
}
window.bidAuctionItem = bidAuctionItem;

function buyoutAuctionItem(lotId) {
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;
    const lot = WORLD_STATE.auctionLots.find(l => l.id === lotId);
    if (!lot || lot.won) return;

    const currentJade = Number(gs?.jade ?? gs?.immortalJade ?? s?.immortalJade) || 0;
    if (currentJade < lot.buyoutPrice) {
        const msg = `⚠️ Tiên Ngọc không đủ để mua đứt (Cần ${lot.buyoutPrice} Tiên Ngọc, hiện có ${currentJade})!`;
        if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, "warning");
        return;
    }

    const newJade = currentJade - lot.buyoutPrice;
    if (gs) {
        gs.jade = newJade;
        gs.immortalJade = newJade;
    }
    if (s) {
        s.immortalJade = newJade;
    }

    lot.won = true;
    lot.leadingBidder = "Bản Tôn";

    // Thêm vật phẩm vào túi
    const inv = (gs && Array.isArray(gs.inventory)) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);
    const existing = inv.find(i => i && i.id === lot.id);
    if (existing) {
        existing.count = (Number(existing.count || existing.quantity) || 0) + 1;
        existing.quantity = existing.count;
    } else {
        inv.push({
            id: lot.id,
            name: lot.name,
            type: lot.type,
            count: 1,
            quantity: 1,
            rarity: 5,
            desc: lot.desc,
            effect: lot.effect,
            icon: lot.icon
        });
    }
    if (gs) gs.inventory = inv;
    if (s) s.inventory = inv;

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof addLog === 'function') {
        addLog(`🎉 <span class="text-amber-300 font-bold">[Đấu Giá Thành Công]</span> Bản Tôn dốc hầu bao mua đứt kỳ bảo <strong>${lot.name}</strong>, thiên hạ kính sợ!`, "text-amber-300 font-bold");
    }
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`🎉 Mua đứt thành công ${lot.name}!`, "success");
    }

    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    renderWorldPage('auction');
}
window.buyoutAuctionItem = buyoutAuctionItem;

// ==========================================
// 3. BÍ CẢNH THÁM HIỂM (WORLD DUNGEON PAGE)
// ==========================================
function renderWorldDungeonPage(container) {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const currentMp = Number(gs.mp ?? s?.mp) || 0;
    const maxMp = Number(gs.maxMp ?? s?.maxMp) || 100;
    const playerRealm = Number(gs.realmIndex ?? s?.realmIndex) || 0;
    const dungeons = WORLD_STATE.dungeons;
    const activeExp = WORLD_STATE.activeDungeon;

    container.innerHTML = `
        <div class="space-y-4">
            <!-- BANNER -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/50 flex items-center justify-center text-sky-300 text-lg shadow-md shrink-0">
                        <i class="fa-solid fa-dungeon"></i>
                    </span>
                    <div>
                        <h3 class="font-serif text-base font-bold text-sky-300">🗝️ Bí Cảnh Thám Hiểm & Lịch Luyện</h3>
                        <p class="text-xs text-stone-400">Tiến vào các cổ tích phân tầng, tiêu hao Linh Lực (15 giây lịch luyện) thu hoạch Dược Liệu, Khoáng Thạch & Trang Bị Hiếm</p>
                    </div>
                </div>
                <div class="px-4 py-2 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center gap-2">
                    <i class="fa-solid fa-bolt text-sky-400 text-sm"></i>
                    <span class="text-xs text-stone-400">Linh Lực:</span>
                    <strong class="text-sky-300 font-mono text-sm">${currentMp} / ${maxMp} MP</strong>
                </div>
            </div>

            <!-- ACTIVE EXPEDITION PANEL NẾU ĐANG THÁM HIỂM -->
            ${activeExp ? `
                <div class="p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-slate-950 border border-sky-500/60 shadow-xl space-y-3 animate-pulse">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <span class="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-300 flex items-center justify-center">
                                <i class="fa-solid fa-compass animate-spin-slow"></i>
                            </span>
                            <div>
                                <h4 class="text-sm font-bold text-sky-200">Đang Thám Hiểm: ${activeExp.name}</h4>
                                <span id="dungeon-live-status" class="text-xs text-amber-300 font-mono">
                                    ${activeExp.statusText || 'Đang dò đường qua cổ trận...'}
                                </span>
                            </div>
                        </div>
                        <div class="px-3 py-1 rounded-xl bg-slate-950 border border-sky-400/40 text-sky-300 font-mono font-bold text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-hourglass-half"></i>
                            <span id="dungeon-live-countdown">${Math.max(0, 15 - (activeExp.elapsedSeconds || 0))}s</span>
                        </div>
                    </div>

                    <!-- Progress Bar 15s -->
                    <div class="w-full h-3 rounded-full bg-slate-950 border border-sky-500/30 overflow-hidden p-0.5">
                        <div id="dungeon-live-progress-fill" class="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-400 to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(56,189,248,0.6)]" style="width: ${Math.min(100, Math.round(((activeExp.elapsedSeconds || 0) / 15) * 100))}%"></div>
                    </div>
                </div>
            ` : ''}

            <!-- DANH SÁCH BÍ CẢNH -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${dungeons.map(d => {
                    const isRealmOk = playerRealm >= d.realmReq;
                    const isMpOk = currentMp >= d.mpCost;
                    const isBusy = Boolean(WORLD_STATE.isDungeonExploring);
                    const canExplore = isRealmOk && isMpOk && !isBusy;

                    return `
                        <div class="p-4 rounded-2xl bg-slate-950/90 border border-stone-800 flex flex-col justify-between space-y-3 shadow-lg hover:border-sky-500/50 transition">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2.5">
                                        <span class="w-8 h-8 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-sky-400 text-sm">
                                            <i class="fa-solid ${d.icon}"></i>
                                        </span>
                                        <h4 class="text-sm font-bold text-slate-100">${d.name}</h4>
                                    </div>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isRealmOk ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-900/50'}">
                                        Y/C: ${d.realmName}
                                    </span>
                                </div>
                                <p class="text-xs text-stone-400">${d.desc}</p>
                                <div class="mt-2.5 p-2 rounded-lg bg-stone-900/60 border border-stone-800 text-[11px] font-mono text-amber-300/90">
                                    🎁 Thưởng: ${d.drops}
                                </div>
                            </div>

                            <div class="space-y-2 pt-2 border-t border-stone-800/80">
                                <button type="button" onclick="exploreWorldDungeon('${d.id}')" ${canExplore ? '' : 'disabled'} class="w-full py-2.5 rounded-xl border font-bold text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2 ${canExplore ? 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 text-slate-950 border-sky-300 cursor-pointer active:scale-95' : 'bg-slate-900 text-stone-500 border-stone-800 cursor-not-allowed'}">
                                    <i class="fa-solid fa-compass"></i>
                                    <span>${isBusy ? 'Đang thám hiểm bí cảnh...' : !isRealmOk ? `Chưa Đủ Cảnh Giới (${d.realmName})` : !isMpOk ? `Thiếu Linh Lực (Cần ${d.mpCost} MP)` : `Thám Hiểm 15 Giây (-${d.mpCost} MP)`}</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function exploreWorldDungeon(dungeonId) {
    if (WORLD_STATE.isDungeonExploring) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast("Đạo hữu đang tiến hành một chuyến thám hiểm khác, xin kiên nhẫn!", "warning");
        }
        return;
    }
    const gs = window.GameState;
    const s = (typeof state !== 'undefined' ? state : null);
    if (!gs && !s) return;
    const d = WORLD_STATE.dungeons.find(x => x.id === dungeonId);
    if (!d) return;

    const playerRealm = Number(gs?.realmIndex ?? s?.realmIndex) || 0;
    const currentMp = Number(gs?.mp ?? s?.mp) || 0;

    if (playerRealm < d.realmReq) {
        if (typeof addLog === 'function') addLog(`⚠️ Cảnh giới chưa đủ để tiến vào ${d.name}!`, "text-rose-400");
        return;
    }
    if (currentMp < d.mpCost) {
        if (typeof addLog === 'function') addLog(`⚠️ Linh Lực không đủ để kích hoạt truyền tống trận bí cảnh!`, "text-rose-400");
        return;
    }

    const newMp = Math.max(0, currentMp - d.mpCost);
    if (gs) gs.mp = newMp;
    if (s) s.mp = newMp;

    WORLD_STATE.isDungeonExploring = true;
    WORLD_STATE.activeDungeon = {
        id: dungeonId,
        name: d.name,
        startTime: Date.now(),
        totalSeconds: 15,
        elapsedSeconds: 0,
        statusText: "Bước 1/4: Đạo hữu vượt qua kết giới cổ, bắt đầu thăm dò..."
    };

    if (typeof playSound === 'function') playSound('portal');
    if (typeof addLog === 'function') {
        addLog(`🧭 <span class="text-sky-300 font-bold">[Bí Cảnh Thám Hiểm]</span> Bản Tôn bước qua kết giới, chính thức thám hiểm <strong>${d.name}</strong> (Thời gian: 15 giây)...`, "text-sky-300");
    }

    renderWorldPage('dungeon');

    if (WORLD_STATE.dungeonTimer) clearInterval(WORLD_STATE.dungeonTimer);

    WORLD_STATE.dungeonTimer = setInterval(() => {
        if (!WORLD_STATE.activeDungeon) {
            clearInterval(WORLD_STATE.dungeonTimer);
            return;
        }

        WORLD_STATE.activeDungeon.elapsedSeconds += 1;
        const elapsed = WORLD_STATE.activeDungeon.elapsedSeconds;

        // Cập nhật DOM trực tiếp nếu đang ở trang Bí Cảnh
        const cdEl = document.getElementById('dungeon-live-countdown');
        if (cdEl) cdEl.textContent = `${Math.max(0, 15 - elapsed)}s`;
        const fillEl = document.getElementById('dungeon-live-progress-fill');
        if (fillEl) fillEl.style.width = `${Math.min(100, Math.round((elapsed / 15) * 100))}%`;
        const statusEl = document.getElementById('dungeon-live-status');

        // Giai đoạn 1 (3 giây): Thăm dò
        if (elapsed === 3) {
            WORLD_STATE.activeDungeon.statusText = "Bước 2/4: Phát hiện dược thảo ngàn năm & dấu vết cổ mạch...";
            if (statusEl) statusEl.textContent = WORLD_STATE.activeDungeon.statusText;
            if (typeof addLog === 'function') {
                addLog(`🌿 <span class="text-emerald-300 font-bold">[Bí Cảnh - Thăm Dò]</span> Tầng sâu <strong>${d.name}</strong> ngập tràn linh khí! Đạo hữu tìm thấy khóm linh thảo phát quang và mạch khoáng thạch ẩn sâu dưới thạch bích...`, "text-emerald-300");
            }
        }

        // Giai đoạn 2 (7 giây): Giao chiến yêu thú hộ trận
        if (elapsed === 7) {
            WORLD_STATE.activeDungeon.statusText = "Bước 3/4: Đụng độ Linh Thú hộ trận, kích hoạt đại chiến!";
            if (statusEl) statusEl.textContent = WORLD_STATE.activeDungeon.statusText;
            if (typeof playSound === 'function') playSound('sword');
            if (typeof addLog === 'function') {
                addLog(`⚔️ <span class="text-amber-300 font-bold">[Bí Cảnh - Giao Chiến]</span> Bất ngờ đụng độ Thú Hộ Trận gầm thét xông tới! Bản Tôn tế xuất thần thông oanh kích phá tan yêu trận...`, "text-amber-300");
            }
        }

        // Giai đoạn 3 (11 giây): Phá giải phong ấn & Đoạt bảo
        if (elapsed === 11) {
            WORLD_STATE.activeDungeon.statusText = "Bước 4/4: Phá giải phong ấn cổ thạch thất, mở bảo rương...";
            if (statusEl) statusEl.textContent = WORLD_STATE.activeDungeon.statusText;
            if (typeof playSound === 'function') playSound('bell');
            if (typeof addLog === 'function') {
                addLog(`✨ <span class="text-purple-300 font-bold">[Bí Cảnh - Đoạt Bảo]</span> Cổ trận tan biến, lộ ra càn khôn thạch thất rực sáng bảo quang! Đạo hữu tiến vào thu thập kỳ trân dị bảo...`, "text-purple-300");
            }
        }

        // Hoàn tất (15 giây): Nhận toàn bộ thưởng
        if (elapsed >= 15) {
            clearInterval(WORLD_STATE.dungeonTimer);
            WORLD_STATE.isDungeonExploring = false;
            WORLD_STATE.activeDungeon = null;

            // 1. Linh Thạch
            const stonesFound = Math.floor(Math.random() * 300) + (d.realmReq * 150) + 250;
            const curStones = Number(gs?.stones ?? s?.stones) || 0;
            if (gs) {
                gs.stones = curStones + stonesFound;
                gs.spiritStones = gs.stones;
            }
            if (s) s.stones = curStones + stonesFound;

            // 2. Dược Liệu & Khoáng Thạch
            let herbId = 'herb_huyet_sam';
            let herbName = 'Huyết Sâm';
            let herbCount = 2;
            let oreId = 'ore_huyen_thiet';
            let oreName = 'Huyền Thiết';
            let oreCount = 2;

            if (dungeonId === 'dungeon_van_duoc') {
                herbId = 'herb_huyet_sam';
                herbName = 'Huyết Sâm';
                herbCount = 3;
                oreId = 'ore_tinh_thiet';
                oreName = 'Bách Tinh Thiết';
                oreCount = 2;
                if (gs?.herbs) gs.herbs.huyetSam = (gs.herbs.huyetSam || 0) + herbCount;
                if (gs?.ores) gs.ores.huyenThiet = (gs.ores.huyenThiet || 0) + oreCount;
            } else if (dungeonId === 'dungeon_hac_phong') {
                herbId = 'herb_linh_chi';
                herbName = 'Tử Linh Chi';
                herbCount = 2;
                oreId = 'ore_huyen_thiet';
                oreName = 'Huyền Thiết';
                oreCount = 3;
                if (gs?.herbs) gs.herbs.linhChi = (gs.herbs.linhChi || 0) + herbCount;
                if (gs?.ores) gs.ores.huyenThiet = (gs.ores.huyenThiet || 0) + oreCount;
            } else if (dungeonId === 'dungeon_huyet_ma') {
                herbId = 'herb_tinh_thuy';
                herbName = 'Thiên Tinh Thủy';
                herbCount = 2;
                oreId = 'ore_tu_tinh';
                oreName = 'Tử Tinh Khoáng';
                oreCount = 2;
                if (gs?.herbs) gs.herbs.tinhThuy = (gs.herbs.tinhThuy || 0) + herbCount;
                if (gs?.ores) gs.ores.tuTinh = (gs.ores.tuTinh || 0) + oreCount;
            } else {
                herbId = 'herb_yeu_dan';
                herbName = 'Thái Cổ Yêu Đan';
                herbCount = 3;
                oreId = 'ore_thai_co';
                oreName = 'Thái Cổ Thiên Thạch';
                oreCount = 3;
                if (gs?.herbs) gs.herbs.yeuDan = (gs.herbs.yeuDan || 0) + herbCount;
                if (gs?.ores) gs.ores.tuTinh = (gs.ores.tuTinh || 0) + oreCount;
            }

            // 3. Trang Bị Hiếm
            let rareEquip = null;
            const ts = Date.now();
            if (dungeonId === 'dungeon_van_duoc') {
                rareEquip = {
                    id: `eq_van_duoc_${ts}`,
                    name: 'Thanh Phong Linh Kiếm (Hiếm)',
                    type: 'Vũ Khí',
                    category: 'weapon',
                    rarity: 3,
                    stats: { atk: 85, hp: 150 },
                    desc: 'Linh kiếm thanh nhã thu hoạch từ thạch thất Vạn Dược Cốc, sắc bén phi phàm.',
                    icon: 'fa-khanda'
                };
            } else if (dungeonId === 'dungeon_hac_phong') {
                rareEquip = {
                    id: `eq_hac_phong_${ts}`,
                    name: 'Hắc Phong Huyền Giáp (Hiếm)',
                    type: 'Áo Giáp',
                    category: 'armor',
                    rarity: 3,
                    stats: { def: 95, hp: 450 },
                    desc: 'Chiến giáp đúc từ Huyền Thiết ngàn năm tại Hắc Phong Lĩnh, hộ thể kiên cố.',
                    icon: 'fa-shield-halved'
                };
            } else if (dungeonId === 'dungeon_huyet_ma') {
                rareEquip = {
                    id: `eq_huyet_ma_${ts}`,
                    name: 'Huyết Sát Ma Đao (Hiếm)',
                    type: 'Vũ Khí',
                    category: 'weapon',
                    rarity: 4,
                    stats: { atk: 220, crit: 10 },
                    desc: 'Ma đao hung sát cổ đại phong ấn trong Huyết Ma Bí Cảnh, đòn đánh kèm huyết khí bạo liệt.',
                    icon: 'fa-wand-magic-sparkles'
                };
            } else {
                rareEquip = {
                    id: `eq_thai_co_${ts}`,
                    name: 'Thái Cổ Càn Khôn Bội (Hiếm)',
                    type: 'Pháp Bảo',
                    category: 'artifact',
                    rarity: 4,
                    stats: { atk: 180, def: 250, hp: 1500 },
                    desc: 'Cổ bội mang đạo vận thái sơ lưu lạc từ kỷ nguyên trước, bảo hộ linh căn bất diệt.',
                    icon: 'fa-gem'
                };
            }

            // Đưa Dược Liệu, Khoáng Thạch và Trang Bị vào Túi Đồ (window.GameState.inventory & state.inventory)
            const inv = (gs && Array.isArray(gs.inventory)) ? gs.inventory : (Array.isArray(s?.inventory) ? s.inventory : []);

            // Thêm dược liệu vào túi
            const exHerb = inv.find(i => i && i.id === herbId);
            if (exHerb) {
                exHerb.count = (Number(exHerb.count || exHerb.quantity) || 0) + herbCount;
                exHerb.quantity = exHerb.count;
            } else {
                inv.push({
                    id: herbId,
                    name: herbName,
                    type: 'Dược Liệu',
                    count: herbCount,
                    quantity: herbCount,
                    rarity: 3,
                    desc: 'Dược thảo thượng phẩm thu hoạch từ Bí Cảnh.',
                    icon: 'fa-leaf'
                });
            }

            // Thêm khoáng thạch vào túi
            const exOre = inv.find(i => i && i.id === oreId);
            if (exOre) {
                exOre.count = (Number(exOre.count || exOre.quantity) || 0) + oreCount;
                exOre.quantity = exOre.count;
            } else {
                inv.push({
                    id: oreId,
                    name: oreName,
                    type: 'Khoáng Thạch',
                    count: oreCount,
                    quantity: oreCount,
                    rarity: 3,
                    desc: 'Khoáng thạch quý hiếm khai thác từ Bí Cảnh.',
                    icon: 'fa-gem'
                });
            }

            // Thêm trang bị hiếm vào túi
            if (rareEquip) {
                inv.push(rareEquip);
            }

            if (gs) gs.inventory = inv;
            if (s) s.inventory = inv;

            if (typeof playSound === 'function') playSound('breakthrough');
            if (typeof addLog === 'function') {
                addLog(`🎁 <span class="text-emerald-400 font-bold">[Thám Hiểm Hoàn Tất]</span> Toàn thắng rời khỏi <strong>${d.name}</strong>! Thu hoạch: <strong>+${stonesFound.toLocaleString('vi-VN')} Linh Thạch</strong>, <strong>+${herbCount} ${herbName}</strong>, <strong>+${oreCount} ${oreName}</strong> và <strong>Trang Bị Hiếm [${rareEquip.name}]</strong>!`, "text-emerald-300 font-bold");
            }

            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`🎁 Thám hiểm hoàn tất! Nhận [${rareEquip.name}], ${herbName}, ${oreName} & ${stonesFound} Linh Thạch!`, "success");
            }

            if (typeof window.syncAllUI === 'function') window.syncAllUI();
            if (typeof window.saveGame === 'function') window.saveGame();
            renderWorldPage('dungeon');
        }
    }, 1000);
}
window.exploreWorldDungeon = exploreWorldDungeon;
window.exploreWorldDungeon = exploreWorldDungeon;

// ==========================================
// 4. ĐẤU PHÁP ĐÀI (WORLD ARENA PAGE)
// ==========================================
function getElementalAdvantage(attackerElem, defenderElem) {
    if (!attackerElem || !defenderElem) return 0;
    const counters = {
        'Kim': 'Mộc',
        'Mộc': 'Thổ',
        'Thổ': 'Thủy',
        'Thủy': 'Hỏa',
        'Hỏa': 'Kim'
    };
    if (counters[attackerElem] === defenderElem) return 1; // Khắc chế (Ưu thế)
    if (counters[defenderElem] === attackerElem) return -1; // Bị khắc (Yếu thế)
    return 0;
}

function getArenaStipend(rank) {
    const r = Number(rank) || 11;
    if (r === 1) return { jade: 150, stones: 100000 };
    if (r === 2) return { jade: 100, stones: 80000 };
    if (r === 3) return { jade: 80, stones: 60000 };
    if (r <= 5) return { jade: 50, stones: 40000 };
    if (r <= 10) return { jade: 30, stones: 25000 };
    return { jade: 10, stones: 10000 };
}

function claimDailyArenaStipend() {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const today = new Date().toISOString().slice(0, 10);
    const lastClaim = gs.arenaLastClaimDate || (s ? s.arenaLastClaimDate : null);

    if (lastClaim === today) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast("ℹ️ Hôm nay đạo hữu đã nhận Bổng Lộc Đấu Pháp Đài rồi, ngày mai hãy quay lại!", "info");
        }
        return;
    }

    const curRank = Number(gs.arenaRank ?? s?.arenaRank ?? 11);
    const stipend = getArenaStipend(curRank);

    const newJade = (Number(gs.jade ?? gs.immortalJade ?? s?.jade) || 0) + stipend.jade;
    const newStones = (Number(gs.stones ?? gs.spiritStones ?? s?.stones) || 0) + stipend.stones;

    if (gs) {
        gs.arenaLastClaimDate = today;
        gs.jade = newJade;
        gs.immortalJade = newJade;
        gs.stones = newStones;
        gs.spiritStones = newStones;
    }
    if (s) {
        s.arenaLastClaimDate = today;
        s.jade = newJade;
        s.immortalJade = newJade;
        s.stones = newStones;
    }

    if (typeof playSound === 'function') playSound('breakthrough');
    const msg = `🎁 Đã nhận Bổng Lộc Đấu Pháp Đài Hạng #${curRank}: +${stipend.jade} Tiên Ngọc 💎, +${stipend.stones.toLocaleString('vi-VN')} Linh Thạch!`;
    if (typeof addLog === 'function') addLog(msg, "text-amber-300 font-bold");
    if (typeof window.showGameToast === 'function') window.showGameToast(msg, "success");

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();

    renderWorldPage('arena');
}
window.claimDailyArenaStipend = claimDailyArenaStipend;

function buyArenaTicket() {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const cost = 1000;
    const curStones = Number(gs.stones ?? gs.spiritStones ?? s?.stones) || 0;

    if (curStones < cost) {
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ Cần ${cost.toLocaleString('vi-VN')} Linh Thạch để mua thêm Vé Khiêu Chiến!`, "warning");
        return;
    }

    const newStones = curStones - cost;
    const curTickets = Number(gs.arenaTickets ?? s?.arenaTickets ?? 5);
    const newTickets = curTickets + 1;

    if (gs) {
        gs.stones = newStones;
        gs.spiritStones = newStones;
        gs.arenaTickets = newTickets;
    }
    if (s) {
        s.stones = newStones;
        s.arenaTickets = newTickets;
    }

    if (typeof playSound === 'function') playSound('click');
    if (typeof window.showGameToast === 'function') window.showGameToast(`🎟️ Đã mua 1 Vé Khiêu Chiến (-${cost} LT)!`, "success");

    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    renderWorldPage('arena');
}
window.buyArenaTicket = buyArenaTicket;

function renderWorldArenaPage(container) {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const playerCP = (typeof window.getCombatPower === 'function') 
        ? window.getCombatPower() 
        : (Number(gs.cp ?? gs.combatPower) || Math.round((Number(gs.atk || 680) * 2.5) + (Number(gs.def || 320) * 2.0) + (Number(gs.maxHp || 5800) * 0.15)));
    
    const playerRank = Number(gs.arenaRank ?? s?.arenaRank ?? 11);
    const npcs = WORLD_STATE.arenaNPCs || [];
    const tickets = Number(gs.arenaTickets ?? s?.arenaTickets ?? 5);
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasClaimedDaily = (gs.arenaLastClaimDate === todayStr || s?.arenaLastClaimDate === todayStr);
    const stipend = getArenaStipend(playerRank);

    container.innerHTML = `
        <div class="space-y-4">
            <!-- BANNER THÔNG TIN BẢN THÂN -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-rose-500/40 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <span class="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 text-xl shadow-md shrink-0">
                        <i class="fa-solid fa-trophy"></i>
                    </span>
                    <div>
                        <h3 class="font-serif text-base font-bold text-rose-300">⚔️ Đấu Pháp Đài Thiên Kiêu (Bảng Phong Vân)</h3>
                        <p class="text-xs text-stone-400">Tranh phong cùng thập đại thiên kiêu Cửu Châu • Đoạt thứ hạng nhận Tiên Ngọc & Linh Thạch</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2.5">
                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-stone-800 text-center">
                        <span class="text-[10px] text-stone-400 block">Thứ Hạng:</span>
                        <strong class="text-amber-300 font-mono text-sm">${playerRank <= 10 ? `Hạng #${playerRank}` : 'Chưa Có Hạng'}</strong>
                    </div>

                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-stone-800 text-center">
                        <span class="text-[10px] text-stone-400 block">Chiến Lực (CP):</span>
                        <strong class="text-emerald-400 font-mono text-sm">${playerCP.toLocaleString('vi-VN')}</strong>
                    </div>

                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-stone-800 text-center flex items-center gap-2">
                        <div>
                            <span class="text-[10px] text-stone-400 block">Vé Khiêu Chiến:</span>
                            <strong class="text-sky-300 font-mono text-sm">${tickets} / 5</strong>
                        </div>
                        <button type="button" onclick="buyArenaTicket()" title="Mua thêm 1 vé khiêu chiến (1.000 Linh Thạch)" class="p-1 px-1.5 rounded bg-sky-950 border border-sky-600/50 hover:bg-sky-900 text-sky-300 text-xs cursor-pointer transition">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <button type="button" onclick="claimDailyArenaStipend()" ${hasClaimedDaily ? 'disabled' : ''} class="px-3.5 py-2 rounded-xl ${hasClaimedDaily ? 'bg-slate-950 text-stone-600 border border-stone-900 cursor-not-allowed' : 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-500/60 cursor-pointer shadow-md'} text-xs font-bold transition flex items-center gap-1.5">
                        <i class="fa-solid fa-gift text-amber-400"></i>
                        <span>${hasClaimedDaily ? 'Đã Nhận Bổng Lộc' : `Nhận Bổng Lộc (${stipend.jade} 💎)`}</span>
                    </button>
                </div>
            </div>

            <!-- BẢNG XẾP HẠNG 10 THIÊN KIÊU -->
            <div class="space-y-2">
                <div class="flex items-center justify-between pl-1 pr-1">
                    <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Bảng Vàng Thập Đại Thiên Kiêu</h4>
                    <span class="text-[11px] text-stone-400">Chiến thắng đoạt vị trí và nhận thưởng Tiên Ngọc</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${npcs.map(npc => {
                        const isCurrentRank = (playerRank === npc.rank);
                        const isAlreadySurpassed = (playerRank < npc.rank);
                        const canChallenge = (playerRank > npc.rank);

                        const jadeReward = 30 + (10 - npc.rank) * 10;
                        const stoneReward = 50000;

                        const rankBadgeStyle = npc.rank === 1 ? 'text-amber-300 bg-amber-950/60 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                                               npc.rank === 2 ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/60' :
                                               npc.rank === 3 ? 'text-rose-400 bg-rose-950/50 border-rose-500/60' :
                                                                'text-stone-400 bg-slate-950 border-stone-800';

                        const cardBorder = isCurrentRank ? 'border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.25)] bg-slate-900/95' :
                                           npc.rank <= 3 ? 'border-stone-700/80 hover:border-amber-500/50 bg-slate-900/80' :
                                                           'border-stone-800/80 hover:border-stone-700 bg-slate-900/70';

                        const elemBadgeColor = npc.element === 'Kim' ? 'text-amber-300 bg-amber-950/40 border-amber-500/40' :
                                               npc.element === 'Mộc' ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40' :
                                               npc.element === 'Thủy' ? 'text-sky-300 bg-sky-950/40 border-sky-500/40' :
                                               npc.element === 'Hỏa' ? 'text-rose-400 bg-rose-950/40 border-rose-500/40' :
                                                                       'text-yellow-600 bg-yellow-950/40 border-yellow-700/40';

                        return `
                            <div class="p-3.5 rounded-2xl ${cardBorder} border transition flex flex-col justify-between gap-3 shadow-md">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="flex items-start gap-3 min-w-0">
                                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${rankBadgeStyle}">
                                            #${npc.rank}
                                        </div>
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <i class="fa-solid ${npc.icon} ${npc.color} text-xs"></i>
                                                <h5 class="text-xs font-bold text-slate-100 truncate">${npc.name}</h5>
                                                <span class="text-[10.5px] text-amber-300/80 font-mono">(${npc.title})</span>
                                                <span class="px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${elemBadgeColor}">
                                                    ${npc.element || 'Hỗn Độn'}
                                                </span>
                                            </div>
                                            <p class="text-[11px] text-stone-400 mt-0.5">
                                                ${npc.realm} • Chiến Lực: <b class="text-rose-400 font-mono">${npc.cp.toLocaleString('vi-VN')}</b>
                                            </p>
                                        </div>
                                    </div>

                                    ${isCurrentRank ? `
                                        <span class="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/60 text-[11px] font-bold shrink-0 flex items-center gap-1">
                                            <i class="fa-solid fa-crown text-amber-400 text-xs"></i> Vị Trí Của Ta
                                        </span>
                                    ` : isAlreadySurpassed ? `
                                        <span class="px-2.5 py-1 rounded-lg bg-slate-950 text-stone-500 border border-stone-800 text-[10.5px] font-medium shrink-0">
                                            Đã Đánh Bại
                                        </span>
                                    ` : `
                                        <div class="flex items-center gap-1.5 shrink-0">
                                            <button type="button" onclick="challengeArenaRival(${npc.rank}, false)" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm" title="Vào Đấu Trường Trực Tiếp (Dual-HP Bar, Sát Chiêu)">
                                                <i class="fa-solid fa-khanda text-xs"></i> Đấu Trường
                                            </button>
                                            <button type="button" onclick="challengeArenaRival(${npc.rank}, true)" class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm" title="Quyết Đấu Nhanh (Tính toán ngũ hành & chiến lực)">
                                                <i class="fa-solid fa-bolt text-xs"></i> Quyết Đấu
                                            </button>
                                        </div>
                                    `}
                                </div>

                                <p class="text-[11px] text-stone-400 line-clamp-2">${npc.desc || 'Thiên kiêu một phương danh chấn Cửu Châu.'}</p>

                                <div class="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10.5px] font-mono">
                                    <span class="text-stone-400">Phần Thưởng Đoạt Hạng:</span>
                                    <span class="text-amber-300 font-semibold">+${jadeReward} Tiên Ngọc 💎 &nbsp; +${stoneReward.toLocaleString('vi-VN')} LT</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function challengeArenaRival(rank, isQuick = false) {
    const gs = window.GameState || {};
    const s = (typeof state !== 'undefined' ? state : null);
    const tickets = Number(gs.arenaTickets ?? s?.arenaTickets ?? 5);

    if (tickets <= 0) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast("⚠️ Đã hết Vé Khiêu Chiến Đấu Pháp Đài! Hãy dùng Linh Thạch mua thêm.", "warning");
        }
        return;
    }

    const rival = (typeof WORLD_STATE !== 'undefined' && WORLD_STATE.arenaNPCs)
        ? WORLD_STATE.arenaNPCs.find(n => n.rank === rank)
        : null;
    if (!rival) return;

    // Deduct ticket
    const newTickets = tickets - 1;
    if (gs) gs.arenaTickets = newTickets;
    if (s) s.arenaTickets = newTickets;

    const curRank = Number(gs.arenaRank ?? s?.arenaRank ?? 11);
    const jadeWon = 30 + (10 - rank) * 10;
    const stonesWon = 50000;

    // CASE 1: Live Universal Battle Arena
    if (!isQuick && typeof window.startUniversalBattle === 'function') {
        const ok = window.startUniversalBattle({
            mode: 'arena',
            enemyId: `rival_rank_${rank}`,
            name: rival.name,
            titleBadge: `⚔️ ĐẤU PHÁP ĐÀI • TRANH HẠNG #${rank}`,
            realm: rival.realm || 'Kim Đan Sơ Kỳ',
            element: rival.element || 'Kim',
            hp: Math.round((rival.cp || 15000) * 10),
            maxHp: Math.round((rival.cp || 15000) * 10),
            atk: Math.round((rival.cp || 15000) * 1.4),
            def: Math.round((rival.cp || 15000) * 0.4),
            crit: 18,
            eva: 12,
            cp: rival.cp || 15000,
            icon: '⚔️',
            rewards: {
                targetRank: rank,
                title: `Hạng #${rank}`,
                linhThach: stonesWon,
                jade: jadeWon,
                badge: `Hạng #${rank} Tiên Giới`
            }
        });
        if (ok) {
            if (typeof window.syncAllUI === 'function') window.syncAllUI();
            if (typeof window.saveGame === 'function') window.saveGame();
            return;
        }
    }

    // CASE 2: Quick Simulated Duel
    const playerCP = (typeof window.getCombatPower === 'function') 
        ? window.getCombatPower() 
        : (Number(gs.cp ?? gs.combatPower) || Math.round((Number(gs.atk || 680) * 2.5) + (Number(gs.def || 320) * 2.0) + (Number(gs.maxHp || 5800) * 0.15)));
    
    const playerElem = gs.root?.element || gs.spiritRoot?.element || gs.spiritualRoot?.element || 'Kim';
    const adv = getElementalAdvantage(playerElem, rival.element);
    const elemFactor = adv === 1 ? 1.25 : (adv === -1 ? 0.85 : 1.0);
    const effectivePlayerCP = Math.round(playerCP * elemFactor);

    const winRatio = effectivePlayerCP / (effectivePlayerCP + (rival.cp || 15000));
    const isWin = (effectivePlayerCP >= rival.cp) || (Math.random() < winRatio);

    if (isWin) {
        let promoted = false;
        if (rank < curRank) {
            if (gs) gs.arenaRank = rank;
            if (s) s.arenaRank = rank;
            promoted = true;
        }

        const newStones = (Number(gs.stones ?? gs.spiritStones ?? s?.stones) || 0) + stonesWon;
        const newJade = (Number(gs.jade ?? gs.immortalJade ?? s?.jade) || 0) + jadeWon;
        if (gs) {
            gs.stones = newStones;
            gs.spiritStones = newStones;
            gs.jade = newJade;
            gs.immortalJade = newJade;
        }
        if (s) {
            s.stones = newStones;
            s.spiritStones = newStones;
            s.jade = newJade;
            s.immortalJade = newJade;
        }

        if (typeof playSound === 'function') playSound('breakthrough');
        const advText = adv === 1 ? " (Khắc chế Ngũ Hành +25% CP)" : (adv === -1 ? " (Bị khắc Ngũ Hành -15% CP)" : "");
        const winMsg = promoted
            ? `🏆 <span class="text-amber-300 font-bold">[Đấu Pháp Đài]</span> Quyết đấu toàn thắng trước <strong>${rival.name}</strong>${advText}! Bản Tôn đoạt lấy <strong>Hạng #${rank}</strong>! Thưởng: <strong>+${jadeWon} Tiên Ngọc 💎</strong>, <strong>+${stonesWon.toLocaleString('vi-VN')} Linh Thạch</strong>!`
            : `🏆 <span class="text-amber-300 font-bold">[Đấu Pháp Đài]</span> Luận bàn toàn thắng trước <strong>${rival.name}</strong>${advText}! Thưởng: <strong>+${jadeWon} Tiên Ngọc 💎</strong>, <strong>+${stonesWon.toLocaleString('vi-VN')} Linh Thạch</strong>!`;

        if (typeof addLog === 'function') addLog(winMsg, "text-amber-300 font-bold");
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(promoted ? `🏆 Đại Thắng Hạng #${rank} (+${jadeWon} Ngọc, +${stonesWon.toLocaleString('vi-VN')} LT)!` : `🏆 Thắng Quyết Đấu (+${jadeWon} Ngọc)!`, "success");
        }
    } else {
        if (typeof playSound === 'function') playSound('defeat');
        const advText = adv === -1 ? " (Bị khắc Ngũ Hành -15% CP)" : "";
        const failMsg = `⚠️ <span class="text-rose-400 font-bold">[Đấu Pháp Đài]</span> Quyết đấu thất bại trước <strong>${rival.name}</strong>${advText}! Đối phương CP (${rival.cp.toLocaleString('vi-VN')}) uy áp quá lớn, hãy đề thăng tu vi!`;
        if (typeof addLog === 'function') addLog(failMsg, "text-rose-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ Thất bại trước ${rival.name}!`, "warning");
    }

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.updateHUD === 'function') window.updateHUD();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();

    renderWorldPage('arena');
}
window.challengeArenaRival = challengeArenaRival;
window.quickChallengeArenaRival = (rank) => challengeArenaRival(rank, true);

// ==========================================
// 5. LỊCH LUYỆN HỒNG HOANG (WORLD ENCOUNTER PAGE)
// ==========================================
function renderWorldEncounterPage(container) {
    const gs = window.GameState || {};
    const righteous = Number(gs.righteous) || 50;
    const demonic = Number(gs.demonic) || 50;

    if (!WORLD_STATE.currentEncounter) {
        WORLD_STATE.currentEncounter = generateRandomEncounter();
    }
    const enc = WORLD_STATE.currentEncounter;

    let daoTamTitle = "☯️ Tiêu Dao Tự Tại";
    let daoTamColor = "text-amber-300";
    if (righteous >= demonic + 15) {
        daoTamTitle = "✨ Chính Khí Lẫm Nhiên (Chánh Đạo)";
        daoTamColor = "text-sky-400";
    } else if (demonic >= righteous + 15) {
        daoTamTitle = "🔥 Ma Đạo Cực Thịnh (Ma Tu)";
        daoTamColor = "text-rose-400";
    }

    container.innerHTML = `
        <div class="space-y-4">
            <!-- BANNER CHÍNH / TÀ & ĐẠO TÂM -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 text-lg shadow-md shrink-0">
                        <i class="fa-solid fa-yin-yang"></i>
                    </span>
                    <div>
                        <h3 class="font-serif text-base font-bold ${daoTamColor}">${daoTamTitle}</h3>
                        <p class="text-xs text-stone-400">Đạo tâm chuyển dời theo mỗi quyết định hành hiệp hay đoạt bảo trên tiên lộ</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center gap-2">
                        <i class="fa-solid fa-sun text-sky-400 text-xs"></i>
                        <span class="text-xs text-stone-400">Chính Đạo:</span>
                        <strong class="text-sky-300 font-mono text-sm">${righteous}</strong>
                    </div>
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center gap-2">
                        <i class="fa-solid fa-moon text-rose-400 text-xs"></i>
                        <span class="text-xs text-stone-400">Ma Đạo:</span>
                        <strong class="text-rose-300 font-mono text-sm">${demonic}</strong>
                    </div>
                </div>
            </div>

            <!-- SỰ KIỆN KỲ NGỘ ĐANG DIỄN RA -->
            <div class="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div class="flex items-center gap-2.5">
                        <span class="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm">
                            <i class="fa-solid ${enc.icon}"></i>
                        </span>
                        <div>
                            <h4 class="text-sm font-bold text-slate-100">${enc.title}</h4>
                            <span class="text-[10px] text-amber-300 font-mono">Kỳ Ngộ Cửu Châu</span>
                        </div>
                    </div>
                    <button type="button" onclick="rollWorldEncounter()" class="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-dice"></i> Đổi Sự Kiện
                    </button>
                </div>

                <p class="text-xs text-stone-300 leading-relaxed">${enc.desc}</p>

                <!-- 2 LỰA CHỌN -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button type="button" onclick="resolveWorldEncounterChoice('A')" class="p-3.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/50 text-left transition shadow-md group cursor-pointer space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-sky-200 group-hover:text-sky-100">${enc.choiceA.label}</span>
                            <i class="fa-solid fa-arrow-right text-sky-400 text-xs opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition"></i>
                        </div>
                        <p class="text-[10px] text-sky-400 font-mono">${enc.choiceA.badge}</p>
                    </button>

                    <button type="button" onclick="resolveWorldEncounterChoice('B')" class="p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/50 text-left transition shadow-md group cursor-pointer space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-rose-200 group-hover:text-rose-100">${enc.choiceB.label}</span>
                            <i class="fa-solid fa-arrow-right text-rose-400 text-xs opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition"></i>
                        </div>
                        <p class="text-[10px] text-rose-400 font-mono">${enc.choiceB.badge}</p>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function resolveWorldEncounterChoice(choice) {
    const enc = WORLD_STATE.currentEncounter;
    if (!enc) return;

    if (choice === 'A' && typeof enc.choiceA?.action === 'function') {
        enc.choiceA.action();
    } else if (choice === 'B' && typeof enc.choiceB?.action === 'function') {
        enc.choiceB.action();
    }

    if (typeof playSound === 'function') playSound('bell');
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    // Sinh sự kiện mới sau khi chọn
    WORLD_STATE.currentEncounter = generateRandomEncounter();
    renderWorldPage('encounter');
}
window.resolveWorldEncounterChoice = resolveWorldEncounterChoice;

function rollWorldEncounter() {
    WORLD_STATE.currentEncounter = generateRandomEncounter();
    if (typeof playSound === 'function') playSound('click');
    renderWorldPage('encounter');
}
window.rollWorldEncounter = rollWorldEncounter;

// Exports tương thích toàn cục
window.renderWorldPage = renderWorldPage;
window.renderWorldMarketHub = (c) => renderWorldPage('market', c);
if (typeof window.renderWorldAuctionHub !== 'function') window.renderWorldAuctionHub = renderWorldAuctionPage;
if (typeof window.renderWorldDungeonHub !== 'function') window.renderWorldDungeonHub = renderWorldDungeonPage;
window.renderWorldArenaHub = (c) => renderWorldPage('arena', c);
if (typeof window.renderWorldExpeditionDashboard !== 'function') window.renderWorldExpeditionDashboard = renderWorldEncounterPage;
