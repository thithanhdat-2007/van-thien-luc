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
    return currency === "tien_ngoc" ? (state.immortalJade || 0) : (state.stones || 0);
}

function changeMarketWallet(currency, delta) {
    if (currency === "tien_ngoc") state.immortalJade = Math.max(0, (state.immortalJade || 0) + delta);
    else state.stones = Math.max(0, (state.stones || 0) + delta);
    if ((state.stones || 0) > 10 && Array.isArray(state.progressionFlags) && !state.progressionFlags.includes("tung_so_huu_tren_10_linh_thach")) {
        state.progressionFlags.push("tung_so_huu_tren_10_linh_thach");
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
    let owned = state.inventory.find(item => item.id === item_id);
    if (!owned) {
        owned = structuredClone(catalog);
        owned.count = 0;
        state.inventory.push(owned);
    }
    owned.count += qty;
    const log = pushMarketLog(`[Phường Thị] Giao dịch thành công: Mua ${qty} ${catalog.name} (-${totalCost.toLocaleString("vi-VN")} ${MARKET_CURRENCY_LABEL[entry.currency]}).`);
    return get_market_state(shop_type, [log], "success");
}

function sell_item(item_id, quantity = 1) {
    const market = ensureMarketState();
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) return marketError("thu_mua", "Số lượng bán không hợp lệ.");
    const owned = state.inventory.find(item => item.id === item_id);
    if (!owned || owned.count < qty) {
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
    owned.count = Math.max(0, (owned.count || 0) - qty);
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
