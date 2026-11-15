

/* ==========================================================================
   MODULE 11: LUYỆN KHÍ THẤT (FORGING SYSTEM - TÁCH BIỆT TRONG IIFE)
   ========================================================================== */
(() => {
    // ====================================================================
        // 1. DATA STATE CỦA NGƯỜI CHƠI (PLAYER STATE ĐỒNG BỘ VỚI WINDOW.STATE)
        // ====================================================================
        // Helper kiểm tra và khấu trừ nguyên liệu rèn đúc trực tiếp từ GameState/inventory
        function getForgingMaterialCount(matKey) {
            let count = 0;
            if (window.GameState && window.GameState.materials) {
                if (matKey === 'stone_ore' && typeof window.GameState.materials.huyenThiet === 'number') {
                    count += window.GameState.materials.huyenThiet;
                }
                if (matKey === 'herb_spirit' && typeof window.GameState.materials.linhChi === 'number') {
                    count += window.GameState.materials.linhChi;
                }
                if (matKey === 'herb_blood' && typeof window.GameState.materials.huyetSam === 'number') {
                    count += window.GameState.materials.huyetSam;
                }
            } else if (window.state && window.state.materials) {
                if (matKey === 'stone_ore' && typeof window.state.materials.huyenThiet === 'number') {
                    count += window.state.materials.huyenThiet;
                }
                if (matKey === 'herb_spirit' && typeof window.state.materials.linhChi === 'number') {
                    count += window.state.materials.linhChi;
                }
                if (matKey === 'herb_blood' && typeof window.state.materials.huyetSam === 'number') {
                    count += window.state.materials.huyetSam;
                }
            }

            const inv = (window.GameState && Array.isArray(window.GameState.inventory))
                ? window.GameState.inventory
                : (window.state && Array.isArray(window.state.inventory) ? window.state.inventory : []);
            
            const aliasMap = {
                stone_ore: ['stone_ore', 'ore', 'khoang_thach', 'Huyền Thiết Khoáng', 'Huyền Thiết', 'huyen_thiet'],
                herb_spirit: ['herb_spirit', 'herb_linhchi', 'linh_chi', 'Linh Chi', 'Tử Linh Chi'],
                herb_blood: ['herb_blood', 'herb_huysam', 'huyet_sam', 'Huyết Sâm', 'Huyết Ngọc Sâm', 'ngoc_sam']
            };
            const aliases = aliasMap[matKey] || [matKey];
            inv.forEach(item => {
                if (!item) return;
                const itemId = String(item.id || item.key || '').toLowerCase();
                const itemName = String(item.name || '').toLowerCase();
                const matched = aliases.some(a => {
                    const al = a.toLowerCase();
                    return itemId === al || itemId.includes(al) || itemName === al || itemName.includes(al);
                });
                if (matched) {
                    count += Number(item.quantity || item.qty || item.count || 1);
                }
            });
            return count;
        }

        function consumeForgingMaterial(matKey, qty) {
            let remain = qty;
            
            // 1. Khấu trừ trong materials trước
            if (window.GameState && window.GameState.materials) {
                const m = window.GameState.materials;
                if (matKey === 'stone_ore' && typeof m.huyenThiet === 'number' && m.huyenThiet > 0) {
                    const deduct = Math.min(remain, m.huyenThiet);
                    m.huyenThiet -= deduct;
                    remain -= deduct;
                }
                if (remain > 0 && matKey === 'herb_spirit' && typeof m.linhChi === 'number' && m.linhChi > 0) {
                    const deduct = Math.min(remain, m.linhChi);
                    m.linhChi -= deduct;
                    remain -= deduct;
                }
                if (remain > 0 && matKey === 'herb_blood' && typeof m.huyetSam === 'number' && m.huyetSam > 0) {
                    const deduct = Math.min(remain, m.huyetSam);
                    m.huyetSam -= deduct;
                    remain -= deduct;
                }
            }
            if (window.state && window.state.materials && window.state !== window.GameState) {
                const m = window.state.materials;
                if (matKey === 'stone_ore' && typeof m.huyenThiet === 'number') m.huyenThiet = Math.max(0, m.huyenThiet - qty);
                if (matKey === 'herb_spirit' && typeof m.linhChi === 'number') m.linhChi = Math.max(0, m.linhChi - qty);
                if (matKey === 'herb_blood' && typeof m.huyetSam === 'number') m.huyetSam = Math.max(0, m.huyetSam - qty);
            }

            // 2. Nếu còn dư cần trừ, khấu trừ tiếp trong inventory
            if (remain > 0) {
                const targetInvs = [];
                if (window.GameState && Array.isArray(window.GameState.inventory)) targetInvs.push(window.GameState.inventory);
                if (window.state && Array.isArray(window.state.inventory) && window.state.inventory !== (window.GameState && window.GameState.inventory)) {
                    targetInvs.push(window.state.inventory);
                }
                
                const aliasMap = {
                    stone_ore: ['stone_ore', 'ore', 'khoang_thach', 'Huyền Thiết Khoáng', 'Huyền Thiết'],
                    herb_spirit: ['herb_spirit', 'herb_linhchi', 'linh_chi', 'Linh Chi', 'Tử Linh Chi'],
                    herb_blood: ['herb_blood', 'herb_huysam', 'huyet_sam', 'Huyết Sâm', 'Huyết Ngọc Sâm']
                };
                const aliases = aliasMap[matKey] || [matKey];

                targetInvs.forEach(inv => {
                    let toDeduct = remain;
                    for (let i = inv.length - 1; i >= 0; i--) {
                        if (toDeduct <= 0) break;
                        const item = inv[i];
                        if (!item) continue;
                        const itemId = String(item.id || item.key || '').toLowerCase();
                        const itemName = String(item.name || '').toLowerCase();
                        const matched = aliases.some(a => {
                            const al = a.toLowerCase();
                            return itemId === al || itemId.includes(al) || itemName === al || itemName.includes(al);
                        });
                        if (matched) {
                            const curQty = Number(item.quantity || item.qty || item.count || 1);
                            if (curQty <= toDeduct) {
                                toDeduct -= curQty;
                                inv.splice(i, 1);
                            } else {
                                const newQty = curQty - toDeduct;
                                item.quantity = newQty;
                                item.count = newQty;
                                if (item.qty !== undefined) item.qty = newQty;
                                toDeduct = 0;
                            }
                        }
                    }
                });
            }

            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();
            if (typeof window.syncAllUI === 'function') window.syncAllUI();
        }

        const playerState = {
            get realmIndex() {
                if (window.GameState && typeof window.GameState.realmIndex === 'number') {
                    return window.GameState.realmIndex;
                }
                if (window.state && typeof window.state.realmIndex === 'number') {
                    return window.state.realmIndex;
                }
                return 0;
            },
            set realmIndex(v) {
                if (window.GameState) window.GameState.realmIndex = v;
                if (window.state) window.state.realmIndex = v;
            },
            get stones() {
                if (window.GameState && typeof window.GameState.stones === 'number') {
                    return window.GameState.stones;
                }
                if (window.state && typeof window.state.stones === 'number') {
                    return window.state.stones;
                }
                return 0;
            },
            set stones(v) {
                const val = Math.max(0, Number(v) || 0);
                if (window.GameState) {
                    window.GameState.stones = val;
                    window.GameState.spiritStones = val;
                }
                if (window.state) {
                    window.state.stones = val;
                    window.state.spiritStones = val;
                }
                if (typeof window.syncAllUI === 'function') window.syncAllUI();
                else if (typeof window.updateHUD === 'function') window.updateHUD();
            },
            inventory: {
                get stone_ore() { return getForgingMaterialCount('stone_ore'); },
                set stone_ore(v) {},
                get herb_spirit() { return getForgingMaterialCount('herb_spirit'); },
                set herb_spirit(v) {},
                get herb_blood() { return getForgingMaterialCount('herb_blood'); },
                set herb_blood(v) {}
            },
            craftedBag: [] // Túi lưu các món đồ đã đúc thành công
        };
        window.forgingPlayerState = playerState;

        const REALM_LABELS = {
            0: "Luyện Khí Tầng 1",
            2: "Luyện Khí Tầng 3",
            4: "Luyện Khí Tầng 5",
            6: "Luyện Khí Tầng 7",
            10: "Trúc Cơ - Sơ Kỳ",
            11: "Trúc Cơ - Trung Kỳ",
            12: "Trúc Cơ - Hậu Kỳ",
            13: "Kim Đan - Sơ Kỳ",
            14: "Kim Đan - Trung Kỳ",
            15: "Kim Đan - Hậu Kỳ",
            16: "Nguyên Anh - Sơ Kỳ",
            17: "Nguyên Anh - Hậu Kỳ",
            18: "Hóa Thần - Sơ Kỳ"
        };

        // ====================================================================
        // 2. CẤU TRÚC DỮ LIỆU CÔNG THỨC (CRAFTING_RECIPES - 5 ĐẠI CẢNH GIỚI)
        // ====================================================================
        const CRAFTING_RECIPES = [
            // --- 1. LUYỆN KHÍ KỲ ---
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
                    { key: "stones", name: "Linh Thạch", qty: 200, icon: "fa-gem" }
                ],
                baseStats: { atk: 150 },
                craftTime: 4,
                desc: "Phi kiếm đúc từ thanh trúc kết hợp Huyền Thiết khoáng, chém sắt như bùn."
            },
            {
                id: "ar_thanh_van_dao_bao",
                name: "Thanh Vân Đạo Bào",
                type: "Pháp Y",
                slot: "armor",
                icon: "fa-shirt",
                reqRealmName: "Luyện Khí Tầng 5",
                reqRealmIndex: 4,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 4, icon: "fa-cubes" },
                    { key: "herb_spirit", name: "Tử Linh Chi", qty: 2, icon: "fa-leaf" },
                    { key: "stones", name: "Linh Thạch", qty: 250, icon: "fa-gem" }
                ],
                baseStats: { def: 120, hp: 600 },
                craftTime: 5,
                desc: "Đạo bào ngưng tụ thanh vân linh khí, gia tăng thể phách và phòng ngự."
            },
            {
                id: "boots_thien_phong_hai",
                name: "Thiên Phong Linh Hài",
                type: "Phi Hài",
                slot: "boots",
                icon: "fa-socks",
                reqRealmName: "Luyện Khí Tầng 7",
                reqRealmIndex: 6,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 4, icon: "fa-cubes" },
                    { key: "herb_spirit", name: "Tử Linh Chi", qty: 2, icon: "fa-leaf" },
                    { key: "stones", name: "Linh Thạch", qty: 300, icon: "fa-gem" }
                ],
                baseStats: { def: 80, hp: 400, speed: 20 },
                craftTime: 5,
                desc: "Đôi giày lướt gió ngự phong, tăng cường thân pháp và né tránh công kích."
            },

            // --- 2. TRÚC CƠ KỲ ---
            {
                id: "ac_ho_than_ngoc_boi",
                name: "Hộ Thân Ngọc Bội",
                type: "Trang Sức",
                slot: "talisman",
                icon: "fa-gem",
                reqRealmName: "Trúc Cơ - Sơ Kỳ",
                reqRealmIndex: 10,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 8, icon: "fa-cubes" },
                    { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 1, icon: "fa-seedling" },
                    { key: "stones", name: "Linh Thạch", qty: 400, icon: "fa-gem" }
                ],
                baseStats: { def: 160, atk: 120, hp: 800 },
                craftTime: 6,
                desc: "Ngọc bội viễn cổ hộ trì tâm mạch, công thủ toàn diện."
            },
            {
                id: "wp_am_duong_kiem",
                name: "Âm Dương Huyền Minh Kiếm",
                type: "Vũ Khí",
                slot: "weapon",
                icon: "fa-khanda",
                reqRealmName: "Trúc Cơ - Trung Kỳ",
                reqRealmIndex: 11,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 10, icon: "fa-cubes" },
                    { key: "herb_spirit", name: "Tử Linh Chi", qty: 4, icon: "fa-leaf" },
                    { key: "stones", name: "Linh Thạch", qty: 600, icon: "fa-gem" }
                ],
                baseStats: { atk: 350, def: 80, crit: 5 },
                craftTime: 6,
                desc: "Song khí âm dương giao hòa, mũi kiếm sắc bén rạch phá phòng ngự ma vật."
            },
            {
                id: "ar_huyen_giap_dao_y",
                name: "Huyền Giáp Đạo Y",
                type: "Pháp Y",
                slot: "armor",
                icon: "fa-shield-halved",
                reqRealmName: "Trúc Cơ - Hậu Kỳ",
                reqRealmIndex: 12,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 12, icon: "fa-cubes" },
                    { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 2, icon: "fa-seedling" },
                    { key: "stones", name: "Linh Thạch", qty: 800, icon: "fa-gem" }
                ],
                baseStats: { def: 320, hp: 2000 },
                craftTime: 7,
                desc: "Đạo y khảm vảy huyền quy, kiên cố bất hoại trước công kích tầm xa."
            },

            // --- 3. KIM ĐAN KỲ ---
            {
                id: "wp_xich_tieu_kiem",
                name: "Xích Tiêu Liệt Diễm Kiếm",
                type: "Vũ Khí",
                slot: "weapon",
                icon: "fa-fire-flame-curved",
                reqRealmName: "Kim Đan - Sơ Kỳ",
                reqRealmIndex: 13,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 16, icon: "fa-cubes" },
                    { key: "herb_spirit", name: "Tử Linh Chi", qty: 6, icon: "fa-leaf" },
                    { key: "stones", name: "Linh Thạch", qty: 1500, icon: "fa-gem" }
                ],
                baseStats: { atk: 650, crit: 10, hp: 1200 },
                craftTime: 7,
                desc: "Thần kiếm tắm trong địa tâm liệt hỏa, phát huy uy lực đan hỏa đốt cháy vạn vật."
            },
            {
                id: "ar_huyen_vu_bao_giap",
                name: "Huyền Vũ Bảo Giáp",
                type: "Pháp Y",
                slot: "armor",
                icon: "fa-shield",
                reqRealmName: "Kim Đan - Trung Kỳ",
                reqRealmIndex: 14,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 18, icon: "fa-cubes" },
                    { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 4, icon: "fa-seedling" },
                    { key: "stones", name: "Linh Thạch", qty: 2000, icon: "fa-gem" }
                ],
                baseStats: { def: 550, hp: 4500 },
                craftTime: 8,
                desc: "Áo giáp đúc theo trận pháp Huyền Vũ chân tông, giảm thương cực hạn."
            },

            // --- 4. NGUYÊN ANH KỲ ---
            {
                id: "wp_thai_hu_tram_tien",
                name: "Thái Hư Trảm Tiên Kiếm",
                type: "Vũ Khí",
                slot: "weapon",
                icon: "fa-bolt-lightning",
                reqRealmName: "Nguyên Anh - Sơ Kỳ",
                reqRealmIndex: 16,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 25, icon: "fa-cubes" },
                    { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 6, icon: "fa-seedling" },
                    { key: "stones", name: "Linh Thạch", qty: 5000, icon: "fa-gem" }
                ],
                baseStats: { atk: 1400, crit: 15, def: 300, hp: 3500 },
                craftTime: 8,
                desc: "Trấn phái thần kiếm xé rách hư không, trảm diệt nguyên anh yêu ma."
            },
            {
                id: "ar_cuu_u_thien_y",
                name: "Cửu U Thiên Hoàng Y",
                type: "Pháp Y",
                slot: "armor",
                icon: "fa-vest",
                reqRealmName: "Nguyên Anh - Hậu Kỳ",
                reqRealmIndex: 17,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 30, icon: "fa-cubes" },
                    { key: "herb_spirit", name: "Tử Linh Chi", qty: 10, icon: "fa-leaf" },
                    { key: "stones", name: "Linh Thạch", qty: 8000, icon: "fa-gem" }
                ],
                baseStats: { def: 1100, hp: 9000 },
                craftTime: 9,
                desc: "Pháp y dệt từ lông vũ Cửu U Thiên Hoàng, phòng ngự tuyệt luân, hồi phục khí huyết."
            },

            // --- 5. HÓA THẦN KỲ ---
            {
                id: "wp_khai_thien_than_kiem",
                name: "Khai Thiên Thần Kiếm",
                type: "Vũ Khí",
                slot: "weapon",
                icon: "fa-dragon",
                reqRealmName: "Hóa Thần - Sơ Kỳ",
                reqRealmIndex: 18,
                materials: [
                    { key: "stone_ore", name: "Huyền Thiết", qty: 50, icon: "fa-cubes" },
                    { key: "herb_blood", name: "Huyết Ngọc Sâm", qty: 10, icon: "fa-seedling" },
                    { key: "stones", name: "Linh Thạch", qty: 15000, icon: "fa-gem" }
                ],
                baseStats: { atk: 2800, crit: 25, hp: 15000, def: 600 },
                craftTime: 10,
                desc: "Thần binh cái thế trước cổng Phi Thăng, uy lực khai thiên trảm ma."
            }
        ];

        // ====================================================================
        // 3. CƠ CHẾ XÁC SUẤT PHẨM CHẤT (RNG QUALITIES)
        // ====================================================================
        const XIANXIA_AFFIX_POOL = [
            { label: "Kiếm Ý Sắc Bén", text: "Bạo kích +8% • Sát thương bạo +15%" },
            { label: "Cửu U Huyết Nhận", text: "Hút máu +6% • Hồi phục +120 HP/s" },
            { label: "Canh Kim Phá Trận", text: "Phá giáp +15% • Bỏ qua 20% hộ giáp" },
            { label: "Kim Cang Hộ Thể", text: "Giảm thương +12% • Kháng bạo +10%" },
            { label: "Linh Mạch Quán Thông", text: "Tốc độ tu vi +10% • Giảm tiêu hao MP 15%" }
        ];

        const CRAFTING_QUALITIES = {
            HAPHAP: {
                id: "ha_pham",
                name: "Hạ Phẩm",
                multiplier: 1.0,
                colorText: "text-slate-200",
                badgeBg: "bg-slate-800 text-slate-300 border-slate-600",
                borderStyle: "border-slate-500",
                boxStyle: "quality--ha-pham",
                subStat: null
            },
            TRUNGPHAM: {
                id: "trung_pham",
                name: "Trung Phẩm",
                multiplier: 1.5,
                colorText: "text-emerald-400",
                badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
                borderStyle: "border-emerald-500",
                boxStyle: "quality--trung-pham",
                subStat: { label: "Dòng Phụ", text: "Tốc đánh +5%" }
            },
            THUONGPHAM: {
                id: "thuong_pham",
                name: "Thượng Phẩm",
                multiplier: 2.5,
                colorText: "text-sky-400",
                badgeBg: "bg-sky-950/90 text-sky-300 border-sky-400",
                borderStyle: "border-sky-400",
                boxStyle: "quality--thuong-pham",
                subStat: { label: "Cực Phẩm Đặc Hiệu", text: "Tốc đánh +10% • Bạo kích +8%" }
            },
            CUCPHAM: {
                id: "cuc_pham",
                name: "Tiên Thiên Cực Phẩm",
                multiplier: 3.8,
                colorText: "text-amber-300 font-extrabold",
                badgeBg: "bg-amber-950/90 text-amber-300 border-amber-400 ring-1 ring-amber-400/50",
                borderStyle: "border-amber-400 shadow-[0_0_18px_rgba(250,204,21,0.6)]",
                boxStyle: "quality--cuc-pham",
                subStat: { label: "Tiên Khí Thần Uy", text: "Bạo kích +16% • Phá giáp +22% • Tụ khí +15%" }
            }
        };

        /**
         * Quay số ngẫu nhiên phẩm chất:
         * 50% Hạ Phẩm, 30% Trung Phẩm, 15% Thượng Phẩm, 5% Tiên Thiên Cực Phẩm
         */
        function rollCraftingQuality() {
            const rand = Math.random(); // 0 -> 1
            if (rand < 0.05) {
                return CRAFTING_QUALITIES.CUCPHAM;    // 5%
            } else if (rand < 0.20) {
                return CRAFTING_QUALITIES.THUONGPHAM; // 15%
            } else if (rand < 0.50) {
                return CRAFTING_QUALITIES.TRUNGPHAM;  // 30%
            } else {
                return CRAFTING_QUALITIES.HAPHAP;     // 50%
            }
        }

        // ====================================================================
        // 4. TRẠNG THÁI LÒ RÈN & TIMER ĐẾM NGƯỢC
        // ====================================================================
        const furnaceState = {
            isCrafting: false,
            activeRecipeId: null,
            timerInterval: null,
            totalTime: 0,
            elapsedTime: 0
        };

        // ====================================================================
        // 5. SYNTHETIC SOUND EFFECTS (WEB AUDIO API - ZERO ASSET DEPENDENCY)
        // ====================================================================
        let audioCtx = null;

        function playSoundFx(type) {
            // Vô hiệu hóa Web Audio synthesis trong Luyện Khí để triệt tiêu stutter
            return;
        }

        // ====================================================================
        // 6. RENDER GIAO DIỆN & CẬP NHẬT HUD
        // ====================================================================
        function updateTopBarUI() {
            const stonesEl = document.getElementById('display-stones');
            const huyenThietEl = document.getElementById('display-huyen-thiet');
            const linhChiEl = document.getElementById('display-linh-chi');
            const ngocSamEl = document.getElementById('display-ngoc-sam');
            const realmBadge = document.getElementById('forging-realm-badge');

            if (stonesEl) stonesEl.textContent = Number(playerState.stones || 0).toLocaleString('vi-VN');
            if (huyenThietEl) huyenThietEl.textContent = getForgingMaterialCount('stone_ore');
            if (linhChiEl) linhChiEl.textContent = getForgingMaterialCount('herb_spirit');
            if (ngocSamEl) ngocSamEl.textContent = getForgingMaterialCount('herb_blood');

            if (realmBadge) {
                const rIdx = playerState.realmIndex;
                const rName = (typeof REALMS !== 'undefined' && REALMS[rIdx]?.name) || REALM_LABELS[rIdx] || `Cảnh Giới Cấp ${rIdx}`;
                realmBadge.textContent = rName;
            }
        }

        function renderBlueprints() {
            const container = document.getElementById('blueprints-list');
            if (!container) return;
            container.innerHTML = '';

            CRAFTING_RECIPES.forEach(recipe => {
                const realmMet = playerState.realmIndex >= recipe.reqRealmIndex;
                let matsMet = true;

                // Kiểm tra từng nguyên liệu
                const matsHtml = recipe.materials.map(mat => {
                    let owned = 0;
                    if (mat.key === 'stones') owned = playerState.stones;
                    else owned = getForgingMaterialCount(mat.key);

                    const isEnough = owned >= mat.qty;
                    if (!isEnough) matsMet = false;

                    return `
                        <div class="material-pill ${isEnough ? 'mat--enough' : 'mat--missing'}">
                            <i class="fa-solid ${mat.icon}"></i>
                            <span>${mat.name}: <b>${owned}/${mat.qty}</b></span>
                        </div>
                    `;
                }).join('');

                // Điều kiện kích hoạt nút Luyện Khí
                const canCraft = realmMet && matsMet && !furnaceState.isCrafting;
                let btnLabel = "Khởi Lò Luyện Khí";
                let btnIcon = "fa-hammer";

                if (furnaceState.isCrafting) {
                    btnLabel = "Lò Đang Tôi Luyện...";
                    btnIcon = "fa-spinner fa-spin";
                } else if (!realmMet) {
                    btnLabel = `Yêu Cầu ${recipe.reqRealmName}`;
                    btnIcon = "fa-lock";
                } else if (!matsMet) {
                    btnLabel = "Thiếu Nguyên Liệu";
                    btnIcon = "fa-triangle-exclamation";
                }

                // Render Base Stats
                const statsArr = [];
                if (recipe.baseStats.atk) statsArr.push(`Công: <b class="stat-highlight">+${recipe.baseStats.atk} ATK</b>`);
                if (recipe.baseStats.def) statsArr.push(`Thủ: <b class="stat-highlight">+${recipe.baseStats.def} DEF</b>`);
                if (recipe.baseStats.hp) statsArr.push(`Huyết: <b class="stat-highlight">+${recipe.baseStats.hp} HP</b>`);
                if (recipe.baseStats.crit) statsArr.push(`Bạo: <b class="stat-highlight">+${recipe.baseStats.crit}% CRIT</b>`);
                if (recipe.baseStats.speed) statsArr.push(`Tốc: <b class="stat-highlight">+${recipe.baseStats.speed} SPD</b>`);

                const card = document.createElement('article');
                card.className = 'recipe-card';
                card.innerHTML = `
                    <div class="craft-card-content">
                        <div class="recipe-header">
                            <div class="recipe-title-group">
                                <div class="recipe-item-avatar">
                                    <i class="fa-solid ${recipe.icon}"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h3 class="recipe-name">${recipe.name}</h3>
                                        <span class="recipe-type-tag">${recipe.type}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-400 mt-0.5">${recipe.desc}</p>
                                </div>
                            </div>
                        </div>

                        <div class="recipe-meta-stats">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span>Chỉ số gốc:</span>
                                ${statsArr.join(' • ')}
                            </div>
                            <div class="ml-auto font-mono text-[11px] text-amber-300">
                                <i class="fa-regular fa-hourglass-half"></i> ${recipe.craftTime}s
                            </div>
                        </div>

                        <div class="materials-container">
                            <div class="materials-title">
                                <i class="fa-solid fa-boxes-stacked"></i> Nguyên Liệu Tiêu Hao:
                            </div>
                            <div class="materials-list">
                                ${matsHtml}
                            </div>
                        </div>
                    </div>
                    <div class="craft-card-action">
                        <span class="recipe-req-badge ${realmMet ? 'req--met' : 'req--unmet'}">
                            <i class="fa-solid ${realmMet ? 'fa-check' : 'fa-lock'}"></i> ${recipe.reqRealmName}
                        </span>
                        <button type="button" class="btn-forge" onclick="startCrafting('${recipe.id}')" ${canCraft ? '' : 'disabled'}>
                            <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            // ================================================================
            // KHU VỰC 1: BÀN DUNG LUYỆN THẦN BINH (3x Cùng Loại -> 1x Phẩm Cao Hơn)
            // ================================================================
            const gs = window.GameState || window.state || {};
            const inv = Array.isArray(gs.inventory) ? gs.inventory : [];

            // Thu thập trang bị có thể dung luyện (có ít nhất 3 bản sao và chưa đạt Cực Phẩm)
            const copyGroups = {};
            inv.forEach(i => {
                if (!i || !(i.type === 'equip' || i.type === 'Equipment' || i.equipSlot || i.slot) || i.tier === 'cuc') return;
                const baseKey = (i.baseName || i.name || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
                if (!copyGroups[baseKey]) copyGroups[baseKey] = { item: i, totalCount: 0 };
                copyGroups[baseKey].totalCount += Number(i.count || i.quantity || i.qty || 1);
            });
            const fuseableItems = Object.values(copyGroups).filter(g => g.totalCount >= 3).map(g => ({
                ...g.item,
                count: g.totalCount
            }));

            const fusionHeader = document.createElement('div');
            fusionHeader.className = 'w-full my-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80 border border-amber-500/40 text-left';
            fusionHeader.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-amber-400 text-lg"></i>
                        <h4 class="font-serif font-bold text-amber-300 text-sm">BÀN DUNG LUYỆN THẦN BINH (ĐỘT PHÁ PHẨM CHẤT)</h4>
                    </div>
                    <span class="text-xs text-amber-400 font-mono">Quy tắc: 3 Bản Sao ➔ 1 Phẩm Kế Tiếp (+60% Chỉ số)</span>
                </div>
                ${fuseableItems.length === 0 ? `
                    <div class="py-4 text-center text-xs text-stone-400 italic">
                        Hiện không có trang bị nào đạt đủ 3 bản sao để dung luyện. Hãy rèn đúc hoặc trảm yêu tại Trấn Yêu Tháp để thu thập thêm trang bị!
                    </div>
                ` : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        ${fuseableItems.map(it => `
                            <div class="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-amber-500/30">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <div class="w-9 h-9 rounded bg-stone-800 flex items-center justify-center text-amber-400 flex-shrink-0 border border-stone-700">
                                        <i class="${it.icon || 'fa-solid fa-khanda'}"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <div class="text-xs font-serif font-bold text-stone-200 truncate">${it.name}</div>
                                        <div class="text-[10px] text-amber-300 font-mono">Đang có: x${it.count} bản sao</div>
                                    </div>
                                </div>
                                <button type="button" onclick="window.fuseEquipmentItem('${it.id}');" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-serif font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer">
                                    ✨ Dung Luyện
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            `;
            container.appendChild(fusionHeader);

            // ================================================================
            // KHU VỰC 2: BÀN CƯỜNG HÓA THẦN BINH (+1 ĐẾN +10)
            // ================================================================
            const enhanceableItems = inv.filter(i => i && (i.type === 'equip' || i.type === 'Equipment' || i.equipSlot || i.slot)).slice(0, 10);

            const enhanceHeader = document.createElement('div');
            enhanceHeader.className = 'w-full my-4 p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-stone-900/90 to-sky-950/80 border border-sky-500/40 text-left';
            
            const enhanceRates = [100, 100, 95, 85, 75, 65, 50, 40, 30, 20];

            enhanceHeader.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-500/20">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-bolt-lightning text-sky-400 text-lg"></i>
                        <h4 class="font-serif font-bold text-sky-300 text-sm">BÀN CƯỜNG HÓA THẦN BINH (+1 ĐẾN +10)</h4>
                    </div>
                    <span class="text-xs text-sky-400 font-mono">Gia trì thần văn: Mỗi cấp +12% Chỉ số gốc (Thất bại không mất trang bị)</span>
                </div>
                ${enhanceableItems.length === 0 ? `
                    <div class="py-4 text-center text-xs text-stone-400 italic">
                        Hiện chưa có trang bị nào trong túi đồ để cường hóa. Hãy rèn đúc một món vũ khí trước!
                    </div>
                ` : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        ${enhanceableItems.map(it => {
                            const curLvl = Number(it.enhanceLevel) || 0;
                            const isMax = curLvl >= 10;
                            const costStones = (curLvl + 1) * 350;
                            const costOre = (curLvl + 1) * 2;
                            const successRate = enhanceRates[curLvl] || 20;

                            const canEnhance = !isMax && (playerState.stones >= costStones) && (getForgingMaterialCount('stone_ore') >= costOre) && !furnaceState.isCrafting;

                            return `
                                <div class="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-sky-500/30">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="w-9 h-9 rounded bg-stone-800 flex items-center justify-center text-sky-400 flex-shrink-0 border border-stone-700">
                                            <i class="${it.icon || 'fa-solid fa-shield'}"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <div class="text-xs font-serif font-bold text-slate-100 truncate flex items-center gap-1.5">
                                                ${it.name}
                                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/60 text-sky-300 font-mono">+${curLvl}</span>
                                            </div>
                                            <div class="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                                                <span><i class="fa-solid fa-gem text-amber-400"></i> ${costStones.toLocaleString('vi-VN')} LT</span>
                                                <span><i class="fa-solid fa-cubes text-cyan-400"></i> ${costOre} Quặng</span>
                                                <span class="text-emerald-400 font-mono font-bold">${successRate}% TL</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onclick="window.enhanceEquipmentItem('${it.id}');" ${canEnhance ? '' : 'disabled'} class="px-3 py-1.5 rounded-lg ${isMax ? 'bg-stone-800 text-stone-500' : 'bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-stone-950'} font-serif font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                        ${isMax ? 'Max +10' : `⚡ Tôi Luyện +${curLvl + 1}`}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            `;
            container.appendChild(enhanceHeader);
        }

        // ====================================================================
        // DUNG LUYỆN THẦN BINH (FUSION: 3X CÙNG LOẠI -> 1X PHẨM KẾ TIẾP)
        // ====================================================================
        function fuseEquipmentItem(targetId) {
            const s = window.GameState || window.state || {};
            const inv = Array.isArray(s.inventory) ? s.inventory : [];
            
            let targetItem = inv.find(i => i && (i.id === targetId || i.baseId === targetId));
            if (!targetItem) {
                if (typeof window.showGameToast === 'function') {
                    window.showGameToast("⚠️ Không tìm thấy trang bị trong túi đồ để dung luyện!", "warning");
                }
                return false;
            }

            const rawBaseName = (targetItem.baseName || targetItem.name || 'Thần Binh').replace(/\s*\([^)]*\)/g, '').trim();

            // Tìm tất cả các bản sao cùng loại
            const matchingItems = [];
            let totalCopies = 0;
            inv.forEach((it, idx) => {
                if (!it) return;
                const itBaseName = (it.baseName || it.name || '').replace(/\s*\([^)]*\)/g, '').trim();
                if ((it.id === targetItem.id || itBaseName === rawBaseName) && it.tier !== 'cuc') {
                    const count = Number(it.count || it.quantity || it.qty || 1);
                    totalCopies += count;
                    matchingItems.push({ item: it, index: idx, count });
                }
            });

            if (totalCopies < 3) {
                if (typeof window.showGameToast === 'function') {
                    window.showGameToast(`⚠️ Cần ít nhất 3 bản sao [${rawBaseName}] để dung luyện (Hiện có: ${totalCopies}/3)!`, "warning");
                }
                return false;
            }

            // Khấu trừ 3 bản sao từ inventory
            let neededToDeduct = 3;
            for (let i = matchingItems.length - 1; i >= 0 && neededToDeduct > 0; i--) {
                const entry = matchingItems[i];
                const it = entry.item;
                const curQty = Number(it.count || it.quantity || it.qty || 1);
                if (curQty <= neededToDeduct) {
                    neededToDeduct -= curQty;
                    const removeIdx = inv.indexOf(it);
                    if (removeIdx !== -1) inv.splice(removeIdx, 1);
                } else {
                    const remain = curQty - neededToDeduct;
                    it.count = remain;
                    it.quantity = remain;
                    if (it.qty !== undefined) it.qty = remain;
                    neededToDeduct = 0;
                }
            }

            // Xác định phẩm kế tiếp: ha -> trung -> thuong -> cuc
            const tierOrder = ['ha', 'trung', 'thuong', 'cuc'];
            const curTier = targetItem.tier || 'ha';
            let curTierIdx = tierOrder.indexOf(curTier);
            if (curTierIdx === -1) curTierIdx = 0;
            const nextTier = tierOrder[Math.min(tierOrder.length - 1, curTierIdx + 1)];

            const tierNameMap = {
                ha: 'Hạ Phẩm',
                trung: 'Trung Phẩm',
                thuong: 'Thượng Phẩm',
                cuc: 'Cực Phẩm'
            };
            const nextTierName = tierNameMap[nextTier] || 'Thần Phẩm';

            // Tính toán chỉ số tăng 60% (+60%)
            const mult = 1.6;
            const newAtk = Math.round((Number(targetItem.atk || targetItem.atkBonus) || 100) * mult);
            const newDef = Math.round((Number(targetItem.def || targetItem.defBonus) || 50) * mult);
            const newHp = Math.round((Number(targetItem.maxHp || targetItem.hpBonus || targetItem.hp) || 300) * mult);
            const newCrit = Math.min(50, Math.round((Number(targetItem.crit || targetItem.critBonus) || 0) * 1.25) + 3);

            const newName = `${rawBaseName} (${nextTierName})`;

            const upgradedItem = {
                ...targetItem,
                id: `${targetItem.id.replace(/_ha|_trung|_thuong|_cuc/g, '')}_${nextTier}_${Date.now()}`,
                name: newName,
                baseName: rawBaseName,
                type: 'Equipment',
                category: 'Equipment',
                slot: targetItem.slot || 'weapon',
                equipSlot: targetItem.equipSlot || (targetItem.slot === 'weapon' ? 'sword' : 'mirror'),
                tier: nextTier,
                rarity: Math.min(6, (Number(targetItem.rarity) || 2) + 1),
                count: 1,
                quantity: 1,
                equipped: false,
                atk: newAtk,
                atkBonus: newAtk,
                def: newDef,
                defBonus: newDef,
                maxHp: newHp,
                hpBonus: newHp,
                crit: newCrit,
                critBonus: newCrit,
                desc: `Thần binh trải qua vạn hỏa tôi luyện dung hợp, đột phá lên phẩm chất ${nextTierName} (+60% toàn bộ chỉ số).`
            };

            inv.unshift(upgradedItem);
            if (window.state && window.state !== s && Array.isArray(window.state.inventory)) {
                window.state.inventory.unshift(upgradedItem);
            }

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.playSound === 'function') window.playSound('bell');
            if (typeof window.spawnFloatingText === 'function') {
                window.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Dung Luyện Thành ${nextTierName}!`, 'text-amber-300 font-bold text-lg');
            }
            const successMsg = `✨ Dung luyện thành công! Đột phá tạo ra: ${newName}!`;
            if (typeof window.showGameToast === 'function') {
                window.showGameToast(successMsg, 'breakthrough');
            }
            if (typeof window.addLog === 'function') {
                window.addLog(`✨ <span class="text-amber-300 font-bold">[Lò Dung Luyện]</span> ${successMsg}`, 'text-amber-300');
            }
            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();

            renderBlueprints();
            updateTopBarUI();
            return true;
        }

        // ====================================================================
        // CƯỜNG HÓA THẦN BINH (ENHANCEMENT: +1 ĐẾN +10)
        // ====================================================================
        function enhanceEquipmentItem(targetId) {
            const s = window.GameState || window.state || {};
            const inv = Array.isArray(s.inventory) ? s.inventory : [];
            const item = inv.find(i => i && i.id === targetId);
            if (!item) {
                if (typeof window.showGameToast === 'function') window.showGameToast("⚠️ Không tìm thấy trang bị để cường hóa!", "warning");
                return false;
            }

            const currentLvl = Number(item.enhanceLevel) || 0;
            if (currentLvl >= 10) {
                if (typeof window.showGameToast === 'function') window.showGameToast("✨ Trang bị đã đạt Cực Cảnh Cường Hóa (+10)!", "info");
                return false;
            }

            const costStones = (currentLvl + 1) * 350;
            const costOre = (currentLvl + 1) * 2;

            const playerStones = Number(s.stones ?? s.spiritStones ?? (typeof state !== 'undefined' ? state.stones : 0)) || 0;
            const playerOre = getForgingMaterialCount('stone_ore');

            if (playerStones < costStones) {
                if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ Không đủ Linh Thạch (Cần ${costStones.toLocaleString('vi-VN')} LT)!`, "warning");
                return false;
            }
            if (playerOre < costOre) {
                if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ Không đủ Huyền Thiết (Cần ${costOre} Quặng)!`, "warning");
                return false;
            }

            // Khấu trừ tài nguyên
            if (window.GameState) {
                window.GameState.stones = Math.max(0, playerStones - costStones);
                window.GameState.spiritStones = window.GameState.stones;
            }
            if (window.state && window.state !== window.GameState) {
                window.state.stones = Math.max(0, playerStones - costStones);
            }
            consumeForgingMaterial('stone_ore', costOre);

            // Tỷ lệ thành công theo cấp
            const enhanceRates = [1.0, 1.0, 0.95, 0.85, 0.75, 0.65, 0.50, 0.40, 0.30, 0.20];
            const successRate = enhanceRates[currentLvl] || 0.20;
            const isSuccess = Math.random() <= successRate;

            if (!isSuccess) {
                if (typeof window.playSound === 'function') window.playSound('fail');
                const failMsg = `💥 Cường hóa [${item.name}] lên +${currentLvl + 1} thất bại! Tiêu hao ${costStones} LT và ${costOre} Huyền Thiết.`;
                if (typeof window.showGameToast === 'function') window.showGameToast(failMsg, 'warning');
                if (typeof window.addLog === 'function') window.addLog(`💥 <span class="text-amber-400">[Luyện Khí]</span> ${failMsg}`, 'text-amber-400');
                renderBlueprints();
                updateTopBarUI();
                return false;
            }

            // Cường hóa thành công!
            const newLvl = currentLvl + 1;
            item.enhanceLevel = newLvl;
            const rawName = (item.baseName || item.name).replace(/\s*\(\+\d+\)/g, '').trim();
            item.name = `${rawName} (+${newLvl})`;
            if (!item.baseStats) {
                item.baseStats = {
                    atk: Number(item.atk || item.atkBonus) || 0,
                    def: Number(item.def || item.defBonus) || 0,
                    hp: Number(item.maxHp || item.hpBonus || item.hp) || 0
                };
            }
            // Mỗi cấp cường hóa tăng thêm 12% chỉ số gốc
            const enhanceMult = 1 + (newLvl * 0.12);
            if (item.baseStats.atk) {
                item.atk = Math.round(item.baseStats.atk * enhanceMult);
                item.atkBonus = item.atk;
            }
            if (item.baseStats.def) {
                item.def = Math.round(item.baseStats.def * enhanceMult);
                item.defBonus = item.def;
            }
            if (item.baseStats.hp) {
                item.maxHp = Math.round(item.baseStats.hp * enhanceMult);
                item.hpBonus = item.maxHp;
                if (item.hp) item.hp = item.maxHp;
            }

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.playSound === 'function') window.playSound('breakthrough');
            if (typeof window.spawnFloatingText === 'function') {
                window.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Cường Hóa +${newLvl}!`, 'text-amber-300 font-bold text-lg');
            }
            const succMsg = `⚡ Cường hóa thành công! [${item.name}] đạt Cấp +${newLvl}!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(succMsg, 'breakthrough');
            if (typeof window.addLog === 'function') window.addLog(`⚡ <span class="text-amber-300 font-bold">[Luyện Khí]</span> ${succMsg}`, 'text-amber-300 font-bold');

            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();

            renderBlueprints();
            updateTopBarUI();
            return true;
        }

        // ====================================================================
        // 7. HÀM START CRAFTING (KHỞI ĐỘNG RÈN ĐÚC)
        // ====================================================================
        function startCrafting(recipeId) {
            if (furnaceState.isCrafting) return;

            const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
            if (!recipe) return;

            // Kiểm tra cảnh giới
            if (playerState.realmIndex < recipe.reqRealmIndex) {
                showXianxiaToast(`⚠️ Cảnh giới chưa đủ! Cần đạt ${recipe.reqRealmName} để đúc trang bị này.`, 'error');
                return;
            }

            // Kiểm tra nguyên liệu
            for (const mat of recipe.materials) {
                if (mat.key === 'stones') {
                    if (playerState.stones < mat.qty) {
                        showXianxiaToast("⚠️ Không đủ Linh Thạch!", "error");
                        return;
                    }
                } else {
                    const owned = getForgingMaterialCount(mat.key);
                    if (owned < mat.qty) {
                        showXianxiaToast(`⚠️ Không đủ nguyên liệu: ${mat.name}! (Có ${owned}/${mat.qty})`, "error");
                        return;
                    }
                }
            }

            // 1. Khấu trừ nguyên liệu thật trong GameState
            recipe.materials.forEach(mat => {
                if (mat.key === 'stones') {
                    playerState.stones = Math.max(0, playerState.stones - mat.qty);
                } else {
                    consumeForgingMaterial(mat.key, mat.qty);
                }
            });

            // 2. Kích hoạt trạng thái lò rèn
            furnaceState.isCrafting = true;
            furnaceState.activeRecipeId = recipeId;
            furnaceState.totalTime = recipe.craftTime;
            furnaceState.elapsedTime = 0;

            // Phát âm thanh búa rèn
            playSoundFx('forge_start');

            // Cập nhật giao diện lò rèn: Lửa bùng cháy dữ dội!
            const furnacePanel = document.getElementById('furnace-panel');
            furnacePanel.classList.add('is-forging');

            const statusBadge = document.getElementById('furnace-status-badge');
            statusBadge.className = 'furnace-status-badge status--crafting';
            document.getElementById('furnace-status-icon').className = 'fa-solid fa-fire-flame-curved text-rose-400';
            document.getElementById('furnace-status-text').textContent = 'Đang tôi luyện đúc khí...';

            // Kích hoạt hộp tiến độ & timer
            const progressBox = document.getElementById('crafting-progress-box');
            progressBox.classList.add('is-active');
            document.getElementById('crafting-active-name').innerHTML = `
                <i class="fa-solid fa-hammer text-amber-400 animate-bounce"></i> Đang rèn: ${recipe.name}
            `;

            updateTopBarUI();
            renderBlueprints();

            // 3. Khởi động Timer đếm ngược (Mỗi 100ms)
            const tickRateMs = 100;
            if (furnaceState.timerInterval) {
                clearInterval(furnaceState.timerInterval);
                furnaceState.timerInterval = null;
            }
            furnaceState.timerInterval = setInterval(() => {
                furnaceState.elapsedTime += (tickRateMs / 1000);
                const remaining = Math.max(0, furnaceState.totalTime - furnaceState.elapsedTime);
                const progressPct = Math.min(100, (furnaceState.elapsedTime / furnaceState.totalTime) * 100);

                // Cập nhật thanh tiến độ và text đếm ngược
                document.getElementById('crafting-progress-fill').style.width = `${progressPct}%`;
                document.getElementById('crafting-percent-text').textContent = `${Math.round(progressPct)}%`;
                document.getElementById('crafting-timer-text').innerHTML = `
                    <i class="fa-regular fa-clock"></i> ${remaining.toFixed(1)}s
                `;

                // Khi hết giờ: Hoàn thành rèn đúc!
                if (furnaceState.elapsedTime >= furnaceState.totalTime) {
                    clearInterval(furnaceState.timerInterval);
                    finishCrafting(recipeId);
                }
            }, tickRateMs);
        }

        // ====================================================================
        // 8. HÀM FINISH CRAFTING (QUAY RNG, HIỂN THỊ POPUP & ADD TÚI ĐỒ)
        // ====================================================================
        function finishCrafting(recipeId) {
            const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
            if (!recipe) return;

            // 1. Quay random phẩm chất (RNG)
            const quality = rollCraftingQuality();

            // Lấy dòng phụ ngẫu nhiên nếu đạt Thượng Phẩm / Cực Phẩm
            let dynamicSubStat = quality.subStat ? quality.subStat.text : null;
            if (quality.id === 'thuong_pham' || quality.id === 'cuc_pham') {
                const rolledAffix = XIANXIA_AFFIX_POOL[Math.floor(Math.random() * XIANXIA_AFFIX_POOL.length)];
                if (rolledAffix) {
                    dynamicSubStat = quality.id === 'cuc_pham' 
                        ? `${rolledAffix.text} • [Tiên Thiên Hào Quang]`
                        : rolledAffix.text;
                }
            }

            // 2. Tính toán chỉ số nhân theo hệ số phẩm chất
            const multipliedStats = {};
            for (const [key, val] of Object.entries(recipe.baseStats)) {
                multipliedStats[key] = Math.round(val * quality.multiplier);
            }

            // 3. Tạo vật phẩm hoàn chỉnh
            const craftedItem = {
                id: `${recipe.id}_${Date.now()}`,
                name: `${recipe.name} (${quality.name})`,
                baseName: recipe.name,
                type: recipe.type,
                slot: recipe.slot,
                icon: recipe.icon,
                quality: quality.name,
                qualityId: quality.id,
                stats: multipliedStats,
                subStat: dynamicSubStat,
                timeCreated: new Date().toLocaleTimeString('vi-VN')
            };

            // Đưa vào kho trang bị người chơi
            playerState.craftedBag.unshift(craftedItem);

            // Đồng bộ trang bị rèn được vào Túi Đồ Bản Nguyên
            const prevCp = typeof window.getCombatPower === 'function' ? window.getCombatPower() : 0;
            const rarityMap = { cuc_pham: 'Legendary', thuong_pham: 'Epic', trung_pham: 'Rare', ha_pham: 'Common' };
            const itemPayload = {
                id: craftedItem.id,
                name: craftedItem.name,
                type: 'Equipment',
                category: 'Equipment',
                slot: craftedItem.slot,
                rarity: rarityMap[quality.id] || 'Common',
                icon: craftedItem.slot === 'weapon' ? '🗡️' : (craftedItem.slot === 'armor' ? '🥋' : '📿'),
                atkBonus: multipliedStats.atk || 0,
                defBonus: multipliedStats.def || 0,
                hpBonus: multipliedStats.hp || 0,
                desc: `${recipe.desc} (${craftedItem.subStat || 'Phẩm chất ' + quality.name})`
            };

            if (window.GameState && Array.isArray(window.GameState.inventory)) {
                window.GameState.inventory.unshift(itemPayload);
            }
            if (typeof window.addItemToInventory === 'function') {
                window.addItemToInventory(itemPayload, 1);
            } else if (window.state && Array.isArray(window.state.inventory) && window.state !== window.GameState) {
                window.state.inventory.unshift(itemPayload);
            }

            if (window.GameState) window.GameState.hasForgedGear = true;
            if (window.state) window.state.hasForgedGear = true;
            if (typeof window.updateMainQuestUI === 'function') window.updateMainQuestUI();

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            const newCp = typeof window.getCombatPower === 'function' ? window.getCombatPower() : 0;
            const cpDelta = Math.max(800, newCp - prevCp);

            if (typeof window.spawnFloatingText === 'function') {
                window.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Rèn Thành ${quality.name}! (+${cpDelta.toLocaleString('vi-VN')} CP)`, 'text-amber-300 font-bold');
            }

            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`🎉 Đã rèn thành công ${craftedItem.name} (+${cpDelta.toLocaleString('vi-VN')} CP)!`, 'success');
            }

            if (typeof window.addLog === 'function') {
                window.addLog(`⚒️ <span class="text-amber-300 font-bold">[Luyện Khí Đại Thành]</span> Đã rèn thành công <strong>${craftedItem.name}</strong> (${craftedItem.subStat || 'Phẩm chất ' + quality.name})! (+${cpDelta.toLocaleString('vi-VN')} CP). Đã cất vào Càn Khôn Nang.`, 'text-amber-300');
            }
            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();
            if (typeof window.syncAllUI === 'function') window.syncAllUI();
            else if (typeof window.updateHUD === 'function') window.updateHUD();

            // 4. Reset trạng thái lò rèn về bình thường
            furnaceState.isCrafting = false;
            furnaceState.activeRecipeId = null;

            const furnacePanel = document.getElementById('furnace-panel');
            furnacePanel.classList.remove('is-forging');

            const statusBadge = document.getElementById('furnace-status-badge');
            statusBadge.className = 'furnace-status-badge status--idle';
            document.getElementById('furnace-status-icon').className = 'fa-solid fa-fire text-slate-400';
            document.getElementById('furnace-status-text').textContent = 'Chờ mồi lửa (Nhàn rỗi)';

            const progressBox = document.getElementById('crafting-progress-box');
            progressBox.classList.remove('is-active');
            document.getElementById('crafting-progress-fill').style.width = '0%';

            // Âm thanh chúc mừng vang dội
            playSoundFx('forge_success');

            // 5. Hiển thị Popup chúc mừng
            openCraftingResultModal(craftedItem, quality);

            // Cập nhật lại UI kệ đồ và danh sách công thức
            renderRecentItemsShelf();
            renderBlueprints();
        }

        // ====================================================================
        // 9. MODAL KẾT QUẢ & KỆ TRANG BỊ
        // ====================================================================
        function openCraftingResultModal(item, quality) {
            const overlay = document.getElementById('crafting-modal-overlay');
            const resultCard = document.getElementById('crafting-result-card');

            // Reset class chất lượng
            resultCard.className = `crafting-result-card ${quality.boxStyle}`;

            // Badge
            const badge = document.getElementById('modal-quality-badge');
            badge.className = `result-badge ${quality.badgeBg}`;
            badge.textContent = `PHẨM CHẤT: ${quality.name.toUpperCase()}`;

            // Icon
            const iconBox = document.getElementById('modal-item-icon-box');
            iconBox.className = `result-item-icon-circle ${quality.badgeBg} border ${quality.borderStyle}`;
            document.getElementById('modal-item-icon').className = `fa-solid ${item.icon} ${quality.colorText}`;

            // Tên & mô tả
            document.getElementById('modal-item-name').className = `result-item-name ${quality.colorText}`;
            document.getElementById('modal-item-name').textContent = item.name;

            // Stats
            document.getElementById('modal-stat-quality').textContent = `${quality.name} (Hệ số x${quality.multiplier})`;
            document.getElementById('modal-stat-quality').className = `${quality.colorText} font-bold`;

            const statLines = [];
            if (item.stats.atk) statLines.push(`Công Kích: <strong class="${quality.colorText}">+${item.stats.atk} ATK</strong>`);
            if (item.stats.def) statLines.push(`Phòng Ngự: <strong class="${quality.colorText}">+${item.stats.def} DEF</strong>`);
            if (item.stats.hp) statLines.push(`Khí Huyết: <strong class="${quality.colorText}">+${item.stats.hp} HP</strong>`);
            document.getElementById('modal-stat-row-1').innerHTML = statLines.join(' | ');

            // Substat
            const substatContainer = document.getElementById('modal-substat-container');
            if (item.subStat) {
                substatContainer.style.display = 'flex';
                document.getElementById('modal-substat-text').textContent = `Dòng Phụ: ${item.subStat}`;
            } else {
                substatContainer.style.display = 'none';
            }

            overlay.classList.add('is-open');
        }

        function closeCraftingModal() {
            document.getElementById('crafting-modal-overlay').classList.remove('is-open');
        }

        function renderRecentItemsShelf() {
            const container = document.getElementById('recent-items-container');
            if (!playerState.craftedBag.length) {
                container.innerHTML = '<span class="text-[11px] text-slate-500 italic">Chưa có trang bị nào được đúc trong phiên này.</span>';
                return;
            }
            container.innerHTML = playerState.craftedBag.slice(0, 6).map(it => {
                let badgeCol = "text-slate-300 border-slate-600";
                if (it.qualityId === 'trung_pham') badgeCol = "text-emerald-300 border-emerald-500/60 bg-emerald-950/40";
                if (it.qualityId === 'thuong_pham') badgeCol = "text-sky-300 border-sky-400 bg-sky-950/50 shadow-[0_0_8px_rgba(56,189,248,0.5)]";

                return `
                    <div class="shelf-item-badge ${badgeCol}" title="${it.name} - ${it.subStat || ''}">
                        <i class="fa-solid ${it.icon}"></i>
                        <span>${it.name}</span>
                    </div>
                `;
            }).join('');
        }



        // ====================================================================
        // KHỞI CHẠY LẦN ĐẦU
        // ====================================================================
        window.updateForgingUI = function() {
            if (document.getElementById('blueprints-list')) {
                renderBlueprints();
            }
            if (typeof updateTopBarUI === 'function') updateTopBarUI();
        };

        window.addEventListener('DOMContentLoaded', () => {
            updateTopBarUI();
            renderBlueprints();
            renderRecentItemsShelf();
        });

    function openLuyenKhiModal() {
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        const el = document.getElementById('modal-luyen-khi');
        if (el) {
            el.style.setProperty('display', 'flex', 'important');
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('z-index', '10000', 'important');
            el.style.setProperty('opacity', '1', 'important');
            el.classList.remove('hidden');
            el.classList.add('active', 'is-open', 'flex');
            if (typeof renderBlueprints === 'function') renderBlueprints();
            if (typeof updateTopBarUI === 'function') updateTopBarUI();
        }
    }

    function closeLuyenKhiModal() {
        const el = document.getElementById('modal-luyen-khi');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
            el.classList.add('hidden');
        }
        closeCraftingModal();
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    window.openLuyenKhiModal = openLuyenKhiModal;
    window.closeLuyenKhiModal = closeLuyenKhiModal;
    globalThis.openLuyenKhiModal = openLuyenKhiModal;
    globalThis.closeLuyenKhiModal = closeLuyenKhiModal;

    window.startCrafting = startCrafting;
    window.finishCrafting = finishCrafting;
    window.openCraftingResultModal = openCraftingResultModal;
    window.closeCraftingModal = closeCraftingModal;
    window.renderBlueprints = renderBlueprints;
    window.renderRecentItemsShelf = renderRecentItemsShelf;
    window.updateTopBarUI = updateTopBarUI;
    window.fuseEquipmentItem = fuseEquipmentItem;
    globalThis.fuseEquipmentItem = fuseEquipmentItem;
    window.enhanceEquipmentItem = enhanceEquipmentItem;
    globalThis.enhanceEquipmentItem = enhanceEquipmentItem;
})();
