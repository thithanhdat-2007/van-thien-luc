/* ==========================================================================
   MODULE 12: KHUÊ PHÒNG TIÊN ĐIỆN (COMPANION & DUAL CULTIVATION SYSTEM)
   Hệ Thống Đạo Lữ Song Tu & Duyên Phận đồng bộ GameState & chỉ số thật
   ========================================================================== */
(() => {
    'use strict';

    // ====================================================================
    // KHỐI 1: CẤU TRÚC DỮ LIỆU ĐẠO LỮ (COMPANIONS_DATA)
    // ====================================================================
    const COMPANIONS_DATA = [
        {
            id: "companion_1",
            name: "Liễu Như Yên",
            title: "Thanh Vân Tiên Tử",
            sect: "Thanh Vân Tiên Phái",
            avatar: "./assets/images/nu_tu_trong_suot.png",
            quote: "Sư huynh, bế quan mệt mỏi rồi sao? Muội vừa pha linh trà tuyết liên cho huynh...",
            unlocked: true,
            unlockCondition: "Mặc định mở khóa khi nhập đạo",
            baseMultiplier: 1.0,
            affection: 120, // Khởi đầu mốc Tri Kỷ
            buffs: [
                { level: 1, text: "+10% Tốc độ Tụ Khí Tu Vi & +100 HP" },
                { level: 2, text: "+15% Tốc độ Tụ Khí & +500 Khí Huyết (HP)" },
                { level: 3, text: "🌸 Mở khóa: Tự động thu hoạch Gia Viên" },
                { level: 4, text: "+30% Tốc độ Tụ Khí, +1,500 HP & Song Tu x3.0 Tu Vi" }
            ]
        },
        {
            id: "companion_2",
            name: "Nam Cung Uyển",
            title: "Kiếm Tiên Lãnh Nguyệt",
            sect: "Thiên Kiếm Tông",
            avatar: "./assets/images/char_cultivator.jpg",
            quote: "Kiếm đạo vô tình, nhưng đối với ngươi... kiếm tâm của ta chưa từng dao động.",
            unlocked: false,
            unlockCondition: "Đột phá Trúc Cơ hoặc Vượt Tầng 10 Trấn Yêu Tháp",
            baseMultiplier: 1.2,
            affection: 0,
            buffs: [
                { level: 1, text: "+15% Sát thương Công Kích (ATK) & +50 DEF" },
                { level: 2, text: "+20% Sát thương Công Kích & +10% Bạo Kích" },
                { level: 3, text: "⚔️ Mở khóa: Tự động thu hoạch Gia Viên & +15% Sát thương Boss" },
                { level: 4, text: "+35% Công Kích, +20% Bạo Kích & Song Tu x3.0 Tu Vi" }
            ]
        },
        {
            id: "companion_3",
            name: "Dạ U Cơ",
            title: "U Minh Ma Tôn",
            sect: "U Minh Ma Tông",
            avatar: "./assets/images/avatar_heart_demon.jpg",
            quote: "Đạo ma bất đồng? Kẻ thắng làm vua. Đêm nay, để ta xem đạo tâm của ngươi kiên định đến đâu...",
            unlocked: false,
            unlockCondition: "Đột phá Kim Đan hoặc Điểm Ma Đạo > 50",
            baseMultiplier: 1.5,
            affection: 0,
            buffs: [
                { level: 1, text: "+12% Hút Máu Khí Huyết & +30 ATK" },
                { level: 2, text: "+18% Hút Máu & +20% Xuyên Thấu Giáp" },
                { level: 3, text: "🩸 Mở khóa: Tự động thu hoạch Gia Viên & Phản phệ sát thương" },
                { level: 4, text: "+25% Hút Máu, Miễn Phệ Tâm Ma & Song Tu x3.0 Tu Vi" }
            ]
        }
    ];

    // ====================================================================
    // KHỐI 2: CẤP BẬC HẢO CẢM & VẬT PHẨM QUÀ TẶNG (4 MỐC CHUẨN RPG)
    // ====================================================================
    const AFFECTION_RANKS = [
        { level: 1, title: "Sơ Kiến", minExp: 0, maxExp: 99, multiplier: 1.0 },
        { level: 2, title: "Tri Kỷ", minExp: 100, maxExp: 299, multiplier: 1.5 },
        { level: 3, title: "Khuynh Tâm", minExp: 300, maxExp: 599, multiplier: 2.0 },
        { level: 4, title: "Đạo Lữ Vĩnh Kết", minExp: 600, maxExp: 999999, multiplier: 3.0 }
    ];

    const GIFT_ITEMS_DATA = {
        gift_tramcai: { id: "gift_tramcai", name: "Bạch Ngọc Trâm Cài", affection: 100, costStones: 2500, rarity: "Common" },
        gift_luuly: { id: "gift_luuly", name: "Thất Bảo Lưu Ly", affection: 250, costStones: 6000, rarity: "Uncommon" },
        gift_hoalactinh: { id: "gift_hoalactinh", name: "Hoa Lạc Tinh", affection: 600, costStones: 15000, rarity: "Rare" }
    };

    const COMPANIONS_STORAGE_KEY = 'van_co_companions_v2';

    function showXianxiaToast(msg, type = 'info') {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(msg, type === 'error' ? 'error' : 'success');
        }
        const toast = document.getElementById('toast-bubble') || document.getElementById('estate-toast-bubble');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('is-active');
            setTimeout(() => toast.classList.remove('is-active'), 2800);
        }
    }

    // ====================================================================
    // STATE NGƯỜI CHƠI & KHUÊ PHÒNG (ĐỒNG BỘ GAMESTATE)
    // ====================================================================
    function getGiftItemCount(itemId) {
        if (window.GameState && window.GameState.gifts) {
            if (itemId === 'gift_tramcai' && typeof window.GameState.gifts.tramCai === 'number') return window.GameState.gifts.tramCai;
            if (itemId === 'gift_luuly' && typeof window.GameState.gifts.luuLy === 'number') return window.GameState.gifts.luuLy;
            if (itemId === 'gift_hoalactinh' && typeof window.GameState.gifts.hoaLacTinh === 'number') return window.GameState.gifts.hoaLacTinh;
        }
        const inv = (window.GameState && Array.isArray(window.GameState.inventory))
            ? window.GameState.inventory
            : (window.state && Array.isArray(window.state.inventory) ? window.state.inventory : []);
        
        const aliasMap = {
            gift_tramcai: ['gift_tramcai', 'gift_hairpin', 'tram_cai', 'Trâm Cài', 'Bạch Ngọc Trâm Cài'],
            gift_luuly: ['gift_luuly', 'gift_glass', 'luu_ly', 'Lưu Ly', 'Thất Bảo Lưu Ly'],
            gift_hoalactinh: ['gift_hoalactinh', 'gift_flower', 'hoa_lac_tinh', 'Hoa Lạc Tinh']
        };
        const aliases = (aliasMap[itemId] || [itemId]).map(a => a.toLowerCase());
        let count = 0;
        inv.forEach(item => {
            if (!item) return;
            const id = String(item.id || item.key || '').toLowerCase();
            const name = String(item.name || '').toLowerCase();
            if (aliases.some(a => id === a || id.includes(a) || name.includes(a))) {
                count += Number(item.quantity || item.qty || item.count || 1);
            }
        });
        return count;
    }

    function consumeGiftItem(itemId) {
        const inv = (window.GameState && Array.isArray(window.GameState.inventory))
            ? window.GameState.inventory
            : (window.state && Array.isArray(window.state.inventory) ? window.state.inventory : []);

        const aliasMap = {
            gift_tramcai: ['gift_tramcai', 'gift_hairpin', 'tram_cai', 'Trâm Cài', 'Bạch Ngọc Trâm Cài'],
            gift_luuly: ['gift_luuly', 'gift_glass', 'luu_ly', 'Lưu Ly', 'Thất Bảo Lưu Ly'],
            gift_hoalactinh: ['gift_hoalactinh', 'gift_flower', 'hoa_lac_tinh', 'Hoa Lạc Tinh']
        };
        const aliases = (aliasMap[itemId] || [itemId]).map(a => a.toLowerCase());
        for (let i = inv.length - 1; i >= 0; i--) {
            const item = inv[i];
            if (!item) continue;
            const id = String(item.id || item.key || '').toLowerCase();
            const name = String(item.name || '').toLowerCase();
            if (aliases.some(a => id === a || id.includes(a) || name.includes(a))) {
                const currentQty = Number(item.quantity || item.qty || item.count || 1);
                if (currentQty <= 1) {
                    inv.splice(i, 1);
                } else {
                    item.quantity = currentQty - 1;
                    item.count = item.quantity;
                    if (item.qty !== undefined) item.qty = item.quantity;
                }
                return true;
            }
        }
        return false;
    }

    const playerState = {
        _realmIndex: 2,
        get realmIndex() {
            if (window.state && typeof window.state.realmIndex === 'number') {
                return Math.max(this._realmIndex, window.state.realmIndex);
            }
            return this._realmIndex;
        },
        set realmIndex(v) {
            this._realmIndex = v;
        },
        activeCompanionId: "companion_1",
        gifts: {
            get gift_tramcai() { return getGiftItemCount('gift_tramcai'); },
            get gift_luuly() { return getGiftItemCount('gift_luuly'); },
            get gift_hoalactinh() { return getGiftItemCount('gift_hoalactinh'); }
        },
        lastDualCultivationTime: 0,
        dualCooldownHours: 12
    };

    function getActiveCompanion() {
        return COMPANIONS_DATA.find(c => c.id === playerState.activeCompanionId) || COMPANIONS_DATA[0];
    }

    function getAffectionRank(points) {
        for (let i = AFFECTION_RANKS.length - 1; i >= 0; i--) {
            if (points >= AFFECTION_RANKS[i].minExp) {
                return AFFECTION_RANKS[i];
            }
        }
        return AFFECTION_RANKS[0];
    }

    // ====================================================================
    // LƯU TRỮ & ĐỒNG BỘ DỮ LIỆU ĐẠO LỮ (PERSISTENCE)
    // ====================================================================
    function saveCompanionsState() {
        try {
            const payload = {
                companions: COMPANIONS_DATA.map(c => ({
                    id: c.id,
                    affection: c.affection,
                    unlocked: c.unlocked
                })),
                activeCompanionId: playerState.activeCompanionId,
                lastDualCultivationTime: playerState.lastDualCultivationTime
            };
            localStorage.setItem(COMPANIONS_STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn('saveCompanionsState error:', e);
        }
    }

    function loadCompanionsState() {
        try {
            let loaded = null;
            const raw = localStorage.getItem(COMPANIONS_STORAGE_KEY);
            if (raw) {
                loaded = JSON.parse(raw);
            } else if (window.GameState && Array.isArray(window.GameState.companionsData) && window.GameState.companionsData.length > 0) {
                loaded = {
                    companions: window.GameState.companionsData,
                    activeCompanionId: window.GameState.activeCompanionId,
                    lastDualCultivationTime: window.GameState.lastDualCultivationTime
                };
            } else if (window.state && Array.isArray(window.state.companions) && window.state.companions.length > 0) {
                loaded = {
                    companions: window.state.companions,
                    activeCompanionId: window.state.activeCompanionId,
                    lastDualCultivationTime: window.state.lastDualCultivationTime
                };
            }

            if (loaded) {
                if (Array.isArray(loaded.companions)) {
                    loaded.companions.forEach(saved => {
                        const match = COMPANIONS_DATA.find(c => c.id === saved.id);
                        if (match) {
                            if (typeof saved.affection === 'number') match.affection = saved.affection;
                            if (saved.unlocked) match.unlocked = true;
                        }
                    });
                }
                if (loaded.activeCompanionId) playerState.activeCompanionId = loaded.activeCompanionId;
                if (typeof loaded.lastDualCultivationTime === 'number') playerState.lastDualCultivationTime = loaded.lastDualCultivationTime;
            }

            checkCompanionUnlocks();
            syncCompanionsToGameState();
        } catch (e) {
            console.warn('loadCompanionsState error:', e);
        }
    }

    // ====================================================================
    // KIỂM TRA ĐIỀU KIỆN MỞ KHÓA ĐẠO LỮ DỰA TRÊN GAMESTATE
    // ====================================================================
    function checkCompanionUnlocks() {
        const gs = window.GameState || window.state || {};
        const realmIdx = Number(gs.realmIndex ?? (window.state?.realmIndex ?? 0));
        const towerFloor = Number(gs.towerFloor ?? (window.demonTowerState?.currentFloor ?? 0));
        const demonic = Number(gs.alignment?.demonic ?? (window.state?.alignment?.demonic ?? 50));

        const c1 = COMPANIONS_DATA.find(c => c.id === 'companion_1');
        if (c1) c1.unlocked = true;

        const c2 = COMPANIONS_DATA.find(c => c.id === 'companion_2');
        if (c2 && !c2.unlocked && (realmIdx >= 4 || towerFloor >= 10)) {
            c2.unlocked = true;
            if (c2.affection < 50) c2.affection = 50;
            showXianxiaToast(`🌸 Đạo duyên cảm ứng! Ngươi đã hội đủ điều kiện kết duyên cùng [${c2.name}]!`, "success");
            if (typeof window.addLog === 'function') {
                window.addLog(`🌸 <span class="text-pink-300 font-bold">[Tiên Duyên Tương Ngộ]</span> Đạo hữu đạt cảnh giới khai mở kết duyên cùng Kiếm Tiên <strong>${c2.name}</strong>!`, 'text-pink-300');
            }
        }

        const c3 = COMPANIONS_DATA.find(c => c.id === 'companion_3');
        if (c3 && !c3.unlocked && (realmIdx >= 8 || demonic > 50)) {
            c3.unlocked = true;
            if (c3.affection < 50) c3.affection = 50;
            showXianxiaToast(`🌸 Đạo duyên cảm ứng! Ngươi đã hội đủ điều kiện kết duyên cùng [${c3.name}]!`, "success");
            if (typeof window.addLog === 'function') {
                window.addLog(`🌸 <span class="text-purple-300 font-bold">[Ma Duyên Khế Hợp]</span> Khí tức tương dẫn mở ra duyên phận cùng Ma Tôn <strong>${c3.name}</strong>!`, 'text-purple-300');
            }
        }
    }

    // Tự động thu hoạch Gia Viên khi có Đạo Lữ đạt mốc Khuynh Tâm (Hảo cảm >= 300)
    function checkCompanionAutoHarvest() {
        const hasKhuynhTam = COMPANIONS_DATA.some(c => c.unlocked && c.affection >= 300);
        if (hasKhuynhTam && typeof window.claimAllEstateResources === 'function') {
            window.claimAllEstateResources(true);
        }
    }

    // Đồng bộ dữ liệu sang GameState & window.state.companions (chuẩn stats.js:593)
    function syncCompanionsToGameState() {
        const s = window.state || (window.GameState ? window.GameState._rawState : null) || {};
        const companionList = COMPANIONS_DATA.map(c => {
            const rank = getAffectionRank(c.affection);
            return {
                id: c.id,
                name: c.name,
                title: c.title,
                affection: c.affection,
                affinity: rank.level,
                level: rank.level,
                affectionLevel: rank.level,
                unlocked: c.unlocked
            };
        });

        s.companions = companionList;
        s.activeCompanionId = playerState.activeCompanionId;
        s.lastDualCultivationTime = playerState.lastDualCultivationTime;

        if (window.GameState) {
            window.GameState.companionsData = companionList;
            window.GameState.activeCompanionId = playerState.activeCompanionId;
            window.GameState.lastDualCultivationTime = playerState.lastDualCultivationTime;
        }

        saveCompanionsState();
    }

    // ====================================================================
    // HÀM 1: MUA VẬT PHẨM QUÀ BẰNG LINH THẠCH (BUY GIFTS)
    // ====================================================================
    function buyGiftWithStones(itemId) {
        const gift = GIFT_ITEMS_DATA[itemId];
        if (!gift) return;

        const stones = Number(window.GameState?.spiritStones ?? window.state?.stones ?? 0);
        if (stones < gift.costStones) {
            showXianxiaToast(`⚠️ Không đủ Linh Thạch! Cần ${gift.costStones.toLocaleString('vi-VN')} Linh Thạch.`, "error");
            return;
        }

        if (window.GameState) {
            window.GameState.spiritStones = stones - gift.costStones;
            window.GameState.stones = window.GameState.spiritStones;
        }
        if (window.state) {
            window.state.stones = stones - gift.costStones;
        }

        const inv = (window.GameState && Array.isArray(window.GameState.inventory))
            ? window.GameState.inventory
            : (window.state && Array.isArray(window.state.inventory) ? window.state.inventory : []);

        const existing = inv.find(it => it && (it.id === itemId || it.name === gift.name));
        if (existing) {
            existing.quantity = (Number(existing.quantity || existing.qty || existing.count) || 1) + 1;
            existing.count = existing.quantity;
        } else {
            inv.push({
                id: itemId,
                name: gift.name,
                type: "Gift",
                category: "Gift",
                quantity: 1,
                count: 1,
                rarity: gift.rarity,
                desc: `Vật phẩm tặng cho Đạo Lữ tăng +${gift.affection} Hảo Cảm.`
            });
        }

        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        else if (typeof window.saveGame === 'function') window.saveGame();

        showXianxiaToast(`🛍️ Đã mua 1x [${gift.name}] (-${gift.costStones.toLocaleString('vi-VN')} Linh Thạch)!`, "success");
        updateUI();
    }

    // ====================================================================
    // HÀM 2: TẶNG QUÀ (GIVE GIFT)
    // ====================================================================
    function giveGift(itemId) {
        const gift = GIFT_ITEMS_DATA[itemId];
        if (!gift) return;

        const owned = getGiftItemCount(itemId);
        if (owned <= 0) {
            showXianxiaToast(`⚠️ Đã hết [${gift.name}] trong túi! Bấm Mua để bổ sung.`, "error");
            return;
        }

        const comp = getActiveCompanion();
        const prevRank = getAffectionRank(comp.affection);

        consumeGiftItem(itemId);
        comp.affection = Math.min(6000, comp.affection + gift.affection);

        const newRank = getAffectionRank(comp.affection);

        syncCompanionsToGameState();
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        else if (typeof window.saveGame === 'function') window.saveGame();

        if (typeof window.addLog === 'function') {
            window.addLog(`🎁 <span class="text-pink-300 font-bold">[Đạo Lữ Khuê Phòng]</span> Tặng <strong>${gift.name}</strong> cho ${comp.name} (+${gift.affection} Hảo Cảm)! Quan hệ đạt [${newRank.title}].`, 'text-pink-300');
        }

        if (newRank.level > prevRank.level) {
            if (newRank.level === 3) {
                showXianxiaToast(`💖 TÌNH CẢM THĂNG HOA! [${comp.name}] đạt [Khuynh Tâm]! Đã mở khóa [Tự Động Thu Hoạch Gia Viên]!`, "success");
                checkCompanionAutoHarvest();
            } else if (newRank.level >= 4) {
                showXianxiaToast(`💍 ĐẠO LỮ VĨNH KẾT! Cùng [${comp.name}] thề nguyền trọn đời, Song Tu nhận x3.0 Tu Vi!`, "success");
            } else {
                showXianxiaToast(`💖 TÌNH CẢM THĂNG HOA! Quan hệ với [${comp.name}] đạt cảnh giới [${newRank.title}] (Cấp ${newRank.level})!`, "success");
            }
        } else {
            showXianxiaToast(`🎁 Đã tặng [${gift.name}] cho ${comp.name} (+${gift.affection} Hảo Cảm)!`, "info");
        }

        updateUI();
    }

    // ====================================================================
    // HÀM 3: SONG TU CÙNG ĐẠO LỮ (DUAL CULTIVATION)
    // ====================================================================
    function getDualCooldownRemainingSeconds() {
        const now = Date.now();
        const cooldownMs = playerState.dualCooldownHours * 60 * 60 * 1000;
        const elapsed = now - playerState.lastDualCultivationTime;
        if (elapsed >= cooldownMs) return 0;
        return Math.ceil((cooldownMs - elapsed) / 1000);
    }

    function triggerDualCultivation() {
        const remaining = getDualCooldownRemainingSeconds();
        if (remaining > 0) {
            const hours = Math.floor(remaining / 3600);
            const mins = Math.floor((remaining % 3600) / 60);
            const secs = remaining % 60;
            showXianxiaToast(`⚠️ Song tu đòi hỏi điều hòa âm dương! Cần chờ hồi phục khí huyết (${hours}h ${mins}m ${secs}s).`, "error");
            return;
        }

        const comp = getActiveCompanion();
        const rank = getAffectionRank(comp.affection);
        const baseMult = comp.baseMultiplier || 1.0;

        const currentRealmIdx = Number(window.GameState?.realmIndex ?? window.state?.realmIndex ?? playerState.realmIndex);
        const gainedExp = Math.round((currentRealmIdx + 1) * (rank.multiplier || 1.0) * baseMult * 30000);

        if (typeof window.addExp === 'function') {
            window.addExp(gainedExp);
        } else if (window.GameState) {
            window.GameState.exp = Number(window.GameState.exp || 0) + gainedExp;
            if (window.state) window.state.exp = window.GameState.exp;
        } else if (window.state) {
            window.state.exp = Number(window.state.exp || 0) + gainedExp;
        }

        comp.affection = Math.min(6000, comp.affection + 25);

        let breakthroughSuccess = false;
        if (comp.id === 'companion_3' && rank.level >= 4 && Math.random() < 0.25) {
            breakthroughSuccess = true;
            window.breakthroughBonusChance = (Number(window.breakthroughBonusChance || 0) + 30);
        }

        playerState.lastDualCultivationTime = Date.now();
        syncCompanionsToGameState();

        if (typeof window.progressSectQuest === 'function') {
            window.progressSectQuest('dual', 1);
        }
        if (window.GameState) window.GameState.hasDualCultivated = true;

        if (typeof window.addLog === 'function') {
            window.addLog(`🌸 <span class="text-pink-300 font-bold">[Âm Dương Song Tu]</span> Cùng đạo lữ <strong>${comp.name}</strong> (${rank.title} - Hệ số x${rank.multiplier}) giao hòa tâm thần! Thu hoạch <strong>+${gainedExp.toLocaleString('vi-VN')} Tu Vi</strong> (+25 Hảo Cảm)!`, 'text-pink-300');
        }

        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        else if (typeof window.saveGame === 'function') window.saveGame();

        showDualCultivationAnimation(gainedExp, comp, breakthroughSuccess);
        updateUI();
    }

    function resetDualCooldown() {
        playerState.lastDualCultivationTime = 0;
        syncCompanionsToGameState();
        updateUI();
        showXianxiaToast("✨ Đã đặt lại thời gian hồi chiêu Song Tu!", "success");
    }

    // ====================================================================
    // HIỆU ỨNG SONG TU ANIMATION & CÁNH HOA RƠI
    // ====================================================================
    function showDualCultivationAnimation(gainedExp, comp, breakthroughSuccess) {
        const overlay = document.getElementById('dual-cultivation-overlay');
        const rewardBox = document.getElementById('dual-reward-amount-box');
        const resultText = document.getElementById('dual-result-text');

        if (rewardBox) {
            rewardBox.innerHTML = `
                <div class="dual-taiji-core mb-2 flex items-center justify-center">
                    <i class="fa-solid fa-yin-yang text-5xl text-amber-300 animate-spin" style="animation-duration: 10s; filter: drop-shadow(0 0 18px rgba(245,158,11,0.7));"></i>
                </div>
                <span>+${gainedExp.toLocaleString('vi-VN')} Tu Vi Linh Lực!</span>
            `;
        }
        if (resultText) {
            if (breakthroughSuccess) {
                resultText.innerHTML = `🌟 MA ĐẠO THẦN UY! Nhờ âm dương giao hòa cùng [${comp.name}], ngươi may mắn kích phát cảm ngộ, <b>ĐỘT PHÁ BÌNH CẢNH THÀNH CÔNG</b> mà không cần Đan dược!`;
            } else {
                resultText.textContent = `Ngươi cùng [${comp.name}] tâm thần hòa hợp, đôi bên vận chuyển chu thiên, âm dương bổ khuyết, linh lực như thủy triều dâng trào!`;
            }
        }

        if (typeof window.playSound === 'function') window.playSound('bell');

        generatePetals();
        if (overlay) overlay.classList.add('is-active');
    }

    function closeDualAnimation() {
        const overlay = document.getElementById('dual-cultivation-overlay');
        if (overlay) overlay.classList.remove('is-active');
        const petals = document.getElementById('petals-canvas');
        if (petals) petals.innerHTML = '';
    }

    function generatePetals() {
        const container = document.getElementById('petals-canvas');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal-particle';
            petal.style.left = `${Math.random() * 100}vw`;
            petal.style.animationDelay = `${Math.random() * 2}s`;
            petal.style.setProperty('--x-end', `${(Math.random() - 0.5) * 200}px`);
            container.appendChild(petal);
        }
    }

    // ====================================================================
    // ĐIỀU HƯỚNG TABS & CHỌN ĐẠO LỮ
    // ====================================================================
    function switchChamberTab(tab) {
        const btnInteract = document.getElementById('tab-btn-interact');
        const btnCompanions = document.getElementById('tab-btn-companions');
        const viewInteract = document.getElementById('tab-content-interact');
        const viewCompanions = document.getElementById('tab-content-companions');

        if (tab === 'interact') {
            if (btnInteract) btnInteract.classList.add('is-active');
            if (btnCompanions) btnCompanions.classList.remove('is-active');
            if (viewInteract) viewInteract.style.display = 'block';
            if (viewCompanions) viewCompanions.style.display = 'none';
        } else {
            if (btnInteract) btnInteract.classList.remove('is-active');
            if (btnCompanions) btnCompanions.classList.add('is-active');
            if (viewInteract) viewInteract.style.display = 'none';
            if (viewCompanions) viewCompanions.style.display = 'block';
        }
    }

    function selectCompanion(compId) {
        checkCompanionUnlocks();
        const comp = COMPANIONS_DATA.find(c => c.id === compId);
        if (!comp) return;

        if (!comp.unlocked) {
            showXianxiaToast(`🔒 Đạo Lữ Chưa Mở Khóa! Điều kiện: ${comp.unlockCondition}`, "error");
            return;
        }

        playerState.activeCompanionId = compId;
        syncCompanionsToGameState();
        showXianxiaToast(`🌸 Đã cùng [${comp.name}] kết định đồng hành!`, "success");
        updateUI();
        switchChamberTab('interact');
    }

    function unlockCompanionTest(compId) {
        const comp = COMPANIONS_DATA.find(c => c.id === compId);
        if (!comp) return;
        comp.unlocked = true;
        if (comp.affection < 100) comp.affection = 100;
        playerState.activeCompanionId = compId;
        syncCompanionsToGameState();
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        showXianxiaToast(`🌸 Đã kết duyên mở khóa Đạo Lữ [${comp.name}] (${comp.title})!`, "success");
        updateUI();
    }

    // ====================================================================
    // CẬP NHẬT GIAO DIỆN TỔNG THỂ (UPDATE UI)
    // ====================================================================
    function updateUI() {
        checkCompanionUnlocks();
        const comp = getActiveCompanion();
        const rank = getAffectionRank(comp.affection);

        // Cột Trái
        const avatarEl = document.getElementById('companion-main-img');
        if (avatarEl) {
            avatarEl.src = comp.avatar;
            avatarEl.onerror = () => { avatarEl.src = './assets/images/nu_tu_trong_suot.png'; };
        }
        const quoteEl = document.getElementById('companion-quote-bubble');
        if (quoteEl) quoteEl.textContent = `"${comp.quote}"`;
        const nameEl = document.getElementById('comp-name-title');
        if (nameEl) nameEl.textContent = comp.name;
        const sectEl = document.getElementById('comp-sect-title');
        if (sectEl) sectEl.textContent = `${comp.sect} • ${comp.title}`;
        const rankBadgeEl = document.getElementById('comp-affection-rank-badge');
        if (rankBadgeEl) rankBadgeEl.textContent = `${rank.title} (Cấp ${rank.level})`;

        // Affection Points & Bar
        const ptsEl = document.getElementById('affection-points-text');
        if (ptsEl) ptsEl.textContent = `${comp.affection.toLocaleString('vi-VN')} / 600`;
        const pct = Math.min(100, Math.round((comp.affection / 600) * 100));
        const fillEl = document.getElementById('affection-fill');
        if (fillEl) fillEl.style.width = `${pct}%`;

        // Passive Buffs
        const buffsBox = document.getElementById('companion-buffs-list');
        if (buffsBox) {
            buffsBox.innerHTML = comp.buffs.map(b => {
                const isUnlocked = rank.level >= b.level;
                return `
                    <div class="buff-tag-item ${isUnlocked ? 'buff--unlocked' : 'buff--locked'}">
                        <span><i class="fa-solid ${isUnlocked ? 'fa-circle-check text-rose-400' : 'fa-lock'} mr-1.5"></i>${b.text}</span>
                        <span class="font-mono text-[10px] font-bold">[Cấp ${b.level}]</span>
                    </div>
                `;
            }).join('');
        }

        // Cột Phải: Quà tặng
        const cntTram = document.getElementById('cnt-tram-cai');
        const cntLuuly = document.getElementById('cnt-luu-ly');
        const cntHoalac = document.getElementById('cnt-hoa-lac-tinh');
        const bTram = document.getElementById('badge-tram-cai');
        const bLuuly = document.getElementById('badge-luu-ly');
        const bHoalac = document.getElementById('badge-hoa-lac-tinh');

        if (cntTram) cntTram.textContent = playerState.gifts.gift_tramcai;
        if (cntLuuly) cntLuuly.textContent = playerState.gifts.gift_luuly;
        if (cntHoalac) cntHoalac.textContent = playerState.gifts.gift_hoalactinh;

        if (bTram) bTram.textContent = `Còn: ${playerState.gifts.gift_tramcai}`;
        if (bLuuly) bLuuly.textContent = `Còn: ${playerState.gifts.gift_luuly}`;
        if (bHoalac) bHoalac.textContent = `Còn: ${playerState.gifts.gift_hoalactinh}`;

        // Cooldown & Nút Song Tu
        const remaining = getDualCooldownRemainingSeconds();
        const btnSongTu = document.getElementById('btn-song-tu');
        const cdStatus = document.getElementById('cooldown-timer-status');
        const rewardPreview = document.getElementById('cultivation-reward-preview');

        const currentRealmIdx = Number(window.GameState?.realmIndex ?? window.state?.realmIndex ?? playerState.realmIndex);
        const gainedExp = Math.round((currentRealmIdx + 1) * (rank.multiplier || 1.0) * (comp.baseMultiplier || 1.0) * 30000);
        if (rewardPreview) rewardPreview.textContent = `Dự kiến nhận: +${gainedExp.toLocaleString('vi-VN')} Tu Vi (Hệ số x${rank.multiplier})`;

        if (btnSongTu) {
            if (remaining > 0) {
                btnSongTu.disabled = true;
                const hours = Math.floor(remaining / 3600);
                const mins = Math.floor((remaining % 3600) / 60);
                const secs = remaining % 60;
                btnSongTu.innerHTML = `<i class="fa-regular fa-clock"></i> ĐANG HỒI KHÍ (${hours}h ${mins}m)`;
                if (cdStatus) cdStatus.textContent = `Hồi chiêu: ${hours}h ${mins}m ${secs}s`;
            } else {
                btnSongTu.disabled = false;
                btnSongTu.innerHTML = `<i class="fa-solid fa-spa"></i> KHỞI ĐỘNG SONG TU`;
                if (cdStatus) cdStatus.textContent = `Trạng thái: Sẵn sàng`;
            }
        }

        // Danh sách Đạo Lữ (Tab 2)
        const compListContainer = document.getElementById('companion-cards-list');
        if (compListContainer) {
            compListContainer.innerHTML = COMPANIONS_DATA.map(c => {
                const isSelected = c.id === playerState.activeCompanionId;
                const cRank = getAffectionRank(c.affection);

                if (!c.unlocked) {
                    return `
                        <div class="companion-item-card is-locked-silhouette">
                            <div class="flex items-center gap-3">
                                <img src="${c.avatar}" alt="${c.name}" class="comp-avatar-thumb" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">
                                <div>
                                    <h4 class="font-bold text-slate-400 text-sm font-serif flex items-center gap-2">
                                        <i class="fa-solid fa-lock text-rose-500"></i> ${c.name}
                                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">[Chưa Mở]</span>
                                    </h4>
                                    <span class="text-xs text-rose-400 font-mono block mt-0.5">Yêu cầu: ${c.unlockCondition}</span>
                                </div>
                            </div>
                            <button type="button" onclick="unlockCompanionTest('${c.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition cursor-pointer">
                                Mở (Test)
                            </button>
                        </div>
                    `;
                }

                return `
                    <div class="companion-item-card ${isSelected ? 'is-active-companion' : ''}" onclick="selectCompanion('${c.id}')">
                        <div class="flex items-center gap-3">
                            <img src="${c.avatar}" alt="${c.name}" class="comp-avatar-thumb" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">
                            <div>
                                <h4 class="font-bold text-slate-100 text-sm font-serif flex items-center gap-2">
                                    ${c.name}
                                    ${isSelected ? '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold font-mono">ĐANG CHỌN</span>' : ''}
                                </h4>
                                <span class="text-xs text-pink-300 font-mono block mt-0.5">${c.sect} • ${c.title}</span>
                                <span class="text-[10px] text-slate-400 block">${cRank.title} (Hảo cảm: ${c.affection.toLocaleString('vi-VN')}/600)</span>
                            </div>
                        </div>
                        <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isSelected ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'} cursor-pointer">
                            ${isSelected ? 'Đã Chọn' : 'Đồng Hành'}
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    function openKhuePhongModal() {
        if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
        if (typeof closeAllDropups === 'function') closeAllDropups();
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        loadCompanionsState();
        const el = document.getElementById('modal-khue-phong');
        if (el) {
            el.style.setProperty('display', 'flex', 'important');
            el.style.setProperty('flex-direction', 'column', 'important');
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('z-index', '10000', 'important');
            el.style.setProperty('opacity', '1', 'important');
            el.classList.remove('hidden');
            el.classList.add('active', 'is-open', 'flex');
            updateUI();
        }
    }

    function closeKhuePhongModal() {
        const el = document.getElementById('modal-khue-phong');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.classList.remove('active', 'is-open', 'flex');
            el.classList.add('hidden');
        }
        closeDualAnimation();
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    // Gắn listener đóng modal khi click ra backdrop
    if (typeof document !== 'undefined') {
        const attachBackdrop = () => {
            const modal = document.getElementById('modal-khue-phong');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeKhuePhongModal();
                    }
                });
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                attachBackdrop();
                loadCompanionsState();
            });
        } else {
            attachBackdrop();
            loadCompanionsState();
        }
    }

    // Định kỳ kiểm tra tự động thu hoạch mỗi 60s
    setInterval(checkCompanionAutoHarvest, 60000);

    // Xuất bản hàm ra window & globalThis
    window.COMPANIONS_DATA = COMPANIONS_DATA;
    window.GIFT_ITEMS_DATA = GIFT_ITEMS_DATA;
    window.openKhuePhongModal = openKhuePhongModal;
    window.closeKhuePhongModal = closeKhuePhongModal;
    window.giveGift = giveGift;
    window.buyGiftWithStones = buyGiftWithStones;
    window.triggerDualCultivation = triggerDualCultivation;
    window.resetDualCooldown = resetDualCooldown;
    window.closeDualAnimation = closeDualAnimation;
    window.switchChamberTab = switchChamberTab;
    window.selectCompanion = selectCompanion;
    window.unlockCompanionTest = unlockCompanionTest;
    window.updateKhuePhongUI = updateUI;
    window.checkCompanionUnlocks = checkCompanionUnlocks;
    window.checkCompanionAutoHarvest = checkCompanionAutoHarvest;
    window.saveCompanionsState = saveCompanionsState;
    window.loadCompanionsState = loadCompanionsState;

    globalThis.COMPANIONS_DATA = COMPANIONS_DATA;
    globalThis.GIFT_ITEMS_DATA = GIFT_ITEMS_DATA;
    globalThis.openKhuePhongModal = openKhuePhongModal;
    globalThis.closeKhuePhongModal = closeKhuePhongModal;
    globalThis.triggerDualCultivation = triggerDualCultivation;
    globalThis.giveGift = giveGift;
    globalThis.buyGiftWithStones = buyGiftWithStones;
    globalThis.unlockCompanionTest = unlockCompanionTest;
    globalThis.checkCompanionUnlocks = checkCompanionUnlocks;
    globalThis.checkCompanionAutoHarvest = checkCompanionAutoHarvest;
    globalThis.saveCompanionsState = saveCompanionsState;
    globalThis.loadCompanionsState = loadCompanionsState;
})();
