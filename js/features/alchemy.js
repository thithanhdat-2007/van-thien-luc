/* ==========================================================================
   MODULE 10: LUYỆN ĐAN PHÒNG (ALCHEMY SYSTEM - TÁCH BIỆT TRONG IIFE)
   NÂNG CẤP CHUYÊN SÂU: BATCH CRAFTING, BẠO KÍCH ĐAN ĐẠO, ĐỒNG BỘ TÚI ĐỒ & THIÊN CƠ NHẬT KÝ
   ========================================================================== */
(() => {
    // ====================================================================
    // KHỐI 1: LINH THẢO & NGUYÊN LIỆU (HERBS_DATA)
    // ====================================================================
    const HERBS_DATA = {
        herb_huysam: {
            id: "herb_huysam",
            name: "Huyết Sâm",
            tier: 1,
            icon: "fa-seedling",
            color: "text-rose-400",
            desc: "Hấp thu linh khí thổ nhưỡng đỏ, bổ khí dưỡng huyết."
        },
        herb_linhchi: {
            id: "herb_linhchi",
            name: "Bách Niên Linh Chi",
            tier: 2,
            icon: "fa-leaf",
            color: "text-emerald-400",
            desc: "Linh chi ngàn năm tôi luyện thiên địa tinh hoa, tăng cường tu vi."
        },
        herb_tinhthuy: {
            id: "herb_tinhthuy",
            name: "Linh Tuyền Tinh Thủy",
            tier: 1,
            icon: "fa-droplet",
            color: "text-sky-400",
            desc: "Nước giếng linh tuyền tinh thuần, hòa tan dược tính."
        },
        herb_yeudan: {
            id: "herb_yeudan",
            name: "Yêu Đan Cấp Thấp",
            tier: 2,
            icon: "fa-circle-radiation",
            color: "text-purple-400",
            desc: "Ngưng tụ từ yêu thú Trấn Yêu Tháp, dược lực cuồng bạo trợ phá cảnh."
        }
    };

    // ====================================================================
    // KHỐI 2: CÁC LOẠI LÒ ĐAN (CAULDRONS_DATA)
    // ====================================================================
    const CAULDRONS_DATA = {
        cauldron_1: {
            id: "cauldron_1",
            name: "Thạch Lò",
            themeClass: "cauldron-theme--stone",
            smokeName: "Khói Trắng Bạc",
            buffDesc: "Lò đá cơ bản • Không có thuộc tính phụ gia",
            successRateBonus: 0.0,
            cucPhamRateBonus: 0.0,
            timeReductionPct: 0.0,
            desc: "Lò luyện đan đục từ khối đá granite, nhiệt hỏa phân tán."
        },
        cauldron_2: {
            id: "cauldron_2",
            name: "Thanh Mộc Đỉnh",
            themeClass: "cauldron-theme--wood",
            smokeName: "Khói Ngọc Bích",
            buffDesc: "+10% Tỷ lệ thành công • Giảm 10% thời gian luyện",
            successRateBonus: 0.10,
            cucPhamRateBonus: 0.0,
            timeReductionPct: 0.10,
            desc: "Đúc từ thân cổ mộc vạn năm, bảo tồn 100% dược tính linh thảo."
        },
        cauldron_3: {
            id: "cauldron_3",
            name: "Tử Kim Bát Quái Lò",
            themeClass: "cauldron-theme--purple",
            smokeName: "Khói Tử Kim Cầu Vồng",
            buffDesc: "+20% Tỷ lệ ra CỰC PHẨM • Giảm 30% thời gian luyện",
            successRateBonus: 0.15,
            cucPhamRateBonus: 0.20,
            timeReductionPct: 0.30,
            desc: "Khắc phù trận Bát Quái, có khả năng lọc sạch hoàn toàn tạp chất Đan Độc!"
        }
    };

    // ====================================================================
    // KHỐI 2.1: HỆ THỐNG DỊ HỎA (FLAMES_DATA)
    // ====================================================================
    const FLAMES_DATA = {
        fire_mortal: { id: "fire_mortal", name: "Địa Hỏa Phàm Hỏa", bonusSuccess: 0, bonusCrit: 0.0, color: "text-amber-400" },
        fire_lotus: { id: "fire_lotus", name: "Thanh Liên Địa Tâm Hỏa", bonusSuccess: 0.05, bonusCrit: 0.08, color: "text-teal-300" },
        fire_sammuoi: { id: "fire_sammuoi", name: "Tam Muội Chân Hỏa", bonusSuccess: 0.10, bonusCrit: 0.15, color: "text-purple-400" }
    };

    // ====================================================================
    // KHỐI 3: CẤP BẬC LUYỆN ĐAN SƯ (ALCHEMIST_LEVELS) - MỞ RỘNG 5 CẤP BẬC
    // ====================================================================
    const ALCHEMIST_LEVELS = [
        {
            level: 1,
            title: "Đan Đồng",
            tagClass: "bg-slate-800 text-slate-300 border-slate-600",
            maxExp: 150,
            canCraftLinhDan: false,
            bonusSuccessRate: 0.0,
            bonusCritRate: 0.0,
            desc: "Mới bước chân vào Đan đạo, chỉ có thể luyện Phàm Đan."
        },
        {
            level: 2,
            title: "Nhất Giai Luyện Đan Sư",
            tagClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
            maxExp: 400,
            canCraftLinhDan: false,
            bonusSuccessRate: 0.05,
            bonusCritRate: 0.03,
            desc: "Nắm vững phân phối hỏa hầu. +5% tỷ lệ đan thành công."
        },
        {
            level: 3,
            title: "Nhị Giai Luyện Đan Sư",
            tagClass: "bg-purple-950/90 text-purple-300 border-purple-400",
            maxExp: 1000,
            canCraftLinhDan: true,
            bonusSuccessRate: 0.10,
            bonusCritRate: 0.06,
            desc: "Đại sư Đan đạo! Cho phép luyện Linh Đan, tăng tỷ lệ đan dược thượng thừa."
        },
        {
            level: 4,
            title: "Tam Giai Đan Vương",
            tagClass: "bg-amber-950/90 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
            maxExp: 2500,
            canCraftLinhDan: true,
            bonusSuccessRate: 0.15,
            bonusCritRate: 0.10,
            desc: "Đan Đạo Tông Sư! Mở khóa luyện chế Huyền Đan & Địa Đan, tăng 10% Bạo Kích đan dược."
        },
        {
            level: 5,
            title: "Đan Đạo Thánh Thủ",
            tagClass: "bg-rose-950/90 text-pink-300 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]",
            maxExp: 6000,
            canCraftLinhDan: true,
            bonusSuccessRate: 0.20,
            bonusCritRate: 0.15,
            desc: "Cảnh giới Đan Thánh chí cao! Dược khí thông thần, giảm 40% đan độc tạp chất."
        }
    ];

    // ====================================================================
    // KHỐI 4: ĐAN PHƯƠNG (RECIPES_DATA) - BẢO TỒN ID CŨ & MỞ RỘNG CHIỀU SÂU
    // ====================================================================
    const RECIPES_DATA = [
        {
            id: "recipe_hoihuyet",
            name: "Hồi Huyết Đan",
            grade: "Phàm Đan",
            gradeColor: "text-slate-200",
            gradeBadge: "bg-slate-800 text-slate-300 border-slate-600",
            icon: "fa-prescription-bottle",
            reqLevel: 1,
            reqLevelTitle: "Đan Đồng (Cấp 1)",
            materials: [
                { matId: "herb_huysam", qty: 5 }
            ],
            baseTime: 5,
            expReward: 15,
            baseEffect: { type: "heal_hp", val: 10000, label: "Hồi 10,000 Khí Huyết (HP)" },
            desc: "Đan dược bổ khí huyết nhập môn, phục hồi vết thương nhẹ khi giao tranh."
        },
        {
            id: "recipe_tukhi",
            name: "Tụ Khí Đan",
            grade: "Linh Đan",
            gradeColor: "text-teal-300",
            gradeBadge: "bg-teal-950/80 text-teal-300 border-teal-500",
            icon: "fa-capsules",
            reqLevel: 2,
            reqLevelTitle: "Nhất Giai Luyện Đan Sư (Cấp 2)",
            materials: [
                { matId: "herb_linhchi", qty: 10 },
                { matId: "herb_tinhthuy", qty: 5 }
            ],
            baseTime: 8,
            expReward: 35,
            baseEffect: { type: "add_exp", val: 5000, label: "Tăng 5,000 Điểm Tu Vi" },
            desc: "Hấp thu thiên địa linh khí cô đặc, gia tăng tu vi một cách nhanh chóng."
        },
        {
            id: "recipe_trucco",
            name: "Trúc Cơ Đan",
            grade: "Linh Đan",
            gradeColor: "text-purple-300",
            gradeBadge: "bg-purple-950/80 text-purple-300 border-purple-500",
            icon: "fa-circle-radiation",
            reqLevel: 2,
            reqLevelTitle: "Nhất Giai Luyện Đan Sư (Cấp 2)",
            materials: [
                { matId: "herb_yeudan", qty: 1 },
                { matId: "herb_linhchi", qty: 15 }
            ],
            baseTime: 12,
            expReward: 65,
            baseEffect: { type: "tribulation_buff", val: 25, label: "+25% Tỷ lệ Thành Công Đột Phá" },
            desc: "Nghịch thiên linh đan trợ giúp tu sĩ phá tan gông xiềng Luyện Khí, bước vào Trúc Cơ."
        },
        {
            id: "recipe_taytuy",
            name: "Tẩy Tủy Hoán Cốt Đan",
            grade: "Huyền Đan",
            gradeColor: "text-sky-300",
            gradeBadge: "bg-sky-950/80 text-sky-300 border-sky-500",
            icon: "fa-hand-sparkles",
            reqLevel: 3,
            reqLevelTitle: "Nhị Giai Luyện Đan Sư (Cấp 3)",
            materials: [
                { matId: "herb_linhchi", qty: 20 },
                { matId: "herb_tinhthuy", qty: 10 },
                { matId: "herb_huysam", qty: 10 }
            ],
            baseTime: 14,
            expReward: 110,
            baseEffect: { type: "cleanse_poison", val: 35, label: "Tiêu trừ 35% Đan Độc & Thanh Tịnh Thần Hồn" },
            desc: "Tẩy uế phạt tủy, bài trừ tạp chất tích tụ trong kinh mạch, đưa đan điền về trạng thái hoàn mỹ."
        },
        {
            id: "recipe_kimdan",
            name: "Cố Bản Kim Đan",
            grade: "Địa Đan",
            gradeColor: "text-amber-300",
            gradeBadge: "bg-amber-950/80 text-amber-300 border-amber-500",
            icon: "fa-shield-halved",
            reqLevel: 3,
            reqLevelTitle: "Nhị Giai Luyện Đan Sư (Cấp 3)",
            materials: [
                { matId: "herb_yeudan", qty: 3 },
                { matId: "herb_linhchi", qty: 25 },
                { matId: "herb_huysam", qty: 15 }
            ],
            baseTime: 18,
            expReward: 180,
            baseEffect: { type: "atk_buff", val: 60, label: "Vĩnh viễn +60 Công Kích & +15,000 Tu Vi" },
            desc: "Tôi luyện kim thân bất hoại, ngưng kết đan điền thành kim đan vĩnh hằng, bộc phát sát thương."
        },
        {
            id: "recipe_baohuyet",
            name: "Cuồng Huyết Bạo Thể Đan",
            grade: "Địa Đan",
            gradeColor: "text-rose-400",
            gradeBadge: "bg-rose-950/80 text-rose-300 border-rose-500",
            icon: "fa-burst",
            reqLevel: 4,
            reqLevelTitle: "Tam Giai Đan Vương (Cấp 4)",
            materials: [
                { matId: "herb_yeudan", qty: 5 },
                { matId: "herb_huysam", qty: 30 }
            ],
            baseTime: 22,
            expReward: 260,
            baseEffect: { type: "crit_buff", val: 5, label: "Vĩnh viễn +5% Bạo Kích & +30,000 Max HP" },
            desc: "Dược lực ma đạo hung hãn kích phát tiềm năng huyết mạch, khiến mỗi đòn đánh bạo phát cuồng nộ."
        }
    ];

    // ====================================================================
    // STATE NGƯỜI CHƠI & TIẾN TRÌNH LUYỆN ĐAN
    // ====================================================================
    const playerState = {
        level: 2,
        exp: 300,
        danDoc: 25,
        cleansePills: 5,
        activeCauldronId: "cauldron_2",
        activeFireId: "fire_lotus",
        materials: {
            herb_huysam: 20,
            herb_linhchi: 25,
            herb_tinhthuy: 15,
            herb_yeudan: 5
        },
        inventoryPills: []
    };
    window.alchemyPlayerState = playerState;

    const selectedBatch = {};

    const brewingProcess = {
        isBrewing: false,
        activeRecipeId: null,
        batchCount: 1,
        timerInterval: null,
        totalSeconds: 0,
        elapsedSeconds: 0,
        modalIsOpen: false
    };

    // ====================================================================
    // ĐỒNG BỘ NGUYÊN LIỆU VỚI TÚI ĐỒ CHÍNH (BIDIRECTIONAL INVENTORY BRIDGE)
    // ====================================================================
    function getMaterialCount(matId) {
        if (window.state && Array.isArray(window.state.inventory)) {
            const found = window.state.inventory.find(i => i && i.id === matId);
            if (found && typeof found.count === 'number') {
                return found.count;
            }
        }
        return playerState.materials[matId] || 0;
    }

    function consumeMaterial(matId, qty) {
        if (playerState.materials[matId] !== undefined) {
            playerState.materials[matId] = Math.max(0, (playerState.materials[matId] || 0) - qty);
        }
        if (window.state && Array.isArray(window.state.inventory)) {
            const found = window.state.inventory.find(i => i && i.id === matId);
            if (found && typeof found.count === 'number') {
                found.count = Math.max(0, found.count - qty);
            }
        }
        if (typeof window.saveGameState === 'function') {
            window.saveGameState();
        }
    }

    function syncMaterialsFromInventory() {
        if (window.state && Array.isArray(window.state.inventory)) {
            Object.keys(playerState.materials).forEach(matId => {
                const found = window.state.inventory.find(i => i && i.id === matId);
                if (found && typeof found.count === 'number') {
                    playerState.materials[matId] = Math.max(playerState.materials[matId] || 0, found.count);
                }
            });
        }
    }

    // ====================================================================
    // TÍNH TOÁN XÁC SUẤT RNG DỰA TRÊN LÒ ĐAN, DỊ HỎA & CẤP NGHỀ
    // ====================================================================
    function calculateRates() {
        const cauldron = CAULDRONS_DATA[playerState.activeCauldronId] || CAULDRONS_DATA.cauldron_1;
        const prof = ALCHEMIST_LEVELS.find(p => p.level === playerState.level) || ALCHEMIST_LEVELS[0];
        const fire = FLAMES_DATA[playerState.activeFireId] || FLAMES_DATA.fire_mortal;

        // Tỷ lệ thành công cơ bản (không nổ lò):
        let successRate = Math.min(0.99, 0.85 + (cauldron.successRateBonus || 0) + (prof.bonusSuccessRate || 0) + (fire.bonusSuccess || 0));

        // Tỷ lệ Cực Phẩm:
        let rateCucPham = (cauldron.cucPhamRateBonus || 0.005) + (playerState.level >= 4 ? 0.05 : 0);
        let rateThuongPham = 0.08 + (prof.bonusSuccessRate * 0.8);
        let rateTrungPham = 0.30 + (prof.bonusSuccessRate * 0.6);
        let rateHaPham = Math.max(0.1, 1 - (rateCucPham + rateThuongPham + rateTrungPham));

        const total = rateCucPham + rateThuongPham + rateTrungPham + rateHaPham;

        // Tỷ lệ Bạo Kích Đan Đạo (Crit Brew - Song Hoàn Đan x2):
        const critRate = Math.min(0.50, 0.15 + (fire.bonusCrit || 0) + (prof.bonusCritRate || 0));

        return {
            successRate: successRate,
            cucPham: rateCucPham / total,
            thuongPham: rateThuongPham / total,
            trungPham: rateTrungPham / total,
            haPham: rateHaPham / total,
            critRate: critRate
        };
    }

    function rollPillQuality() {
        const rates = calculateRates();
        const rand = Math.random();

        if (rand < rates.cucPham) {
            return {
                id: "cuc_pham",
                name: "CỰC PHẨM",
                multiplier: 3.0,
                danDoc: 0,
                badgeClass: "bg-purple-950 text-pink-300 border border-pink-400 shadow-[0_0_15px_#e879f9]",
                colorClass: "text-pink-300",
                isMutation: true
            };
        } else if (rand < rates.cucPham + rates.thuongPham) {
            return {
                id: "thuong_pham",
                name: "Thượng Phẩm",
                multiplier: 2.0,
                danDoc: 1,
                badgeClass: "bg-sky-950 text-sky-300 border border-sky-400",
                colorClass: "text-sky-400",
                isMutation: false
            };
        } else if (rand < rates.cucPham + rates.thuongPham + rates.trungPham) {
            return {
                id: "trung_pham",
                name: "Trung Phẩm",
                multiplier: 1.5,
                danDoc: 5,
                badgeClass: "bg-emerald-950 text-emerald-300 border border-emerald-500",
                colorClass: "text-emerald-400",
                isMutation: false
            };
        } else {
            return {
                id: "ha_pham",
                name: "Hạ Phẩm",
                multiplier: 1.0,
                danDoc: 10,
                badgeClass: "bg-slate-800 text-slate-300 border-slate-600",
                colorClass: "text-slate-200",
                isMutation: false
            };
        }
    }

    // ====================================================================
    // BATCH CRAFTING: CHỌN SỐ LƯỢNG (x1, x5, Max)
    // ====================================================================
    function setAlchemyBatch(recipeId, count) {
        if (brewingProcess.isBrewing) return;
        const rec = RECIPES_DATA.find(r => r.id === recipeId);
        if (!rec) return;

        const maxCraftable = Math.max(1, Math.min(...rec.materials.map(m => {
            const owned = getMaterialCount(m.matId);
            return Math.floor(owned / m.qty);
        })));

        let finalCount = 1;
        if (count === 'max') {
            finalCount = Math.max(1, maxCraftable);
        } else {
            finalCount = Math.min(Number(count) || 1, Math.max(1, maxCraftable));
        }

        selectedBatch[recipeId] = finalCount;
        renderRecipes();
    }

    // ====================================================================
    // LOGIC START ALCHEMY & FINISH ALCHEMY
    // ====================================================================
    function startAlchemy(recipeId, batchCount = null) {
        if (brewingProcess.isBrewing) return;

        const rec = RECIPES_DATA.find(r => r.id === recipeId);
        const cauldron = CAULDRONS_DATA[playerState.activeCauldronId] || CAULDRONS_DATA.cauldron_1;
        if (!rec || !cauldron) return;

        // 1. Kiểm tra cấp nghề
        if (playerState.level < rec.reqLevel) {
            showXianxiaToast(`⚠️ Cấp nghề chưa đủ! Cần đạt ${rec.reqLevelTitle}.`, 'error');
            return;
        }

        const count = Math.max(1, Number(batchCount || selectedBatch[recipeId] || 1));

        // 2. Kiểm tra nguyên liệu theo batch
        for (const mat of rec.materials) {
            const owned = getMaterialCount(mat.matId);
            const required = mat.qty * count;
            if (owned < required) {
                const matObj = HERBS_DATA[mat.matId] || { name: mat.matId };
                showXianxiaToast(`⚠️ Không đủ dược liệu: ${matObj.name} (${owned}/${required})!`, 'error');
                return;
            }
        }

        // 3. Khấu trừ dược liệu
        rec.materials.forEach(mat => {
            consumeMaterial(mat.matId, mat.qty * count);
        });

        // 4. Tính toán thời gian thực tế với công thức gia tốc (Accelerated Batch Crafting)
        // Luyện hàng loạt giảm thời gian bình quân mỗi viên:
        const batchTimeFactor = 1 + (count - 1) * 0.42;
        const actualTime = Math.max(3, Math.round(rec.baseTime * (1 - (cauldron.timeReductionPct || 0)) * batchTimeFactor));

        brewingProcess.isBrewing = true;
        brewingProcess.activeRecipeId = recipeId;
        brewingProcess.batchCount = count;
        brewingProcess.totalSeconds = actualTime;
        brewingProcess.elapsedSeconds = 0;
        brewingProcess.modalIsOpen = true;

        // Kích hoạt animation khói sương cuồn cuộn
        const panelEl = document.getElementById('cauldron-panel');
        if (panelEl) panelEl.classList.add('is-brewing');
        const brewBox = document.getElementById('brewing-progress-box');
        if (brewBox) brewBox.classList.add('is-active');
        const brewName = document.getElementById('brew-pill-name');
        if (brewName) {
            brewName.innerHTML = `
                <i class="fa-solid fa-circle-notch fa-spin text-teal-400 mr-1"></i>Đang luyện: ${rec.name} ${count > 1 ? `<b class="text-amber-300 font-mono">(x${count})</b>` : ''}
            `;
        }

        updateHeaderUI();
        renderRecipes();

        // 5. Timer đếm ngược
        const tickRate = 100;
        if (brewingProcess.timerInterval) {
            clearInterval(brewingProcess.timerInterval);
            brewingProcess.timerInterval = null;
        }
        brewingProcess.timerInterval = setInterval(() => {
            brewingProcess.elapsedSeconds += (tickRate / 1000);
            const progressPct = Math.min(100, (brewingProcess.elapsedSeconds / brewingProcess.totalSeconds) * 100);
            const remaining = Math.max(0, brewingProcess.totalSeconds - brewingProcess.elapsedSeconds);

            const fillEl = document.getElementById('brewing-fill');
            if (fillEl) fillEl.style.width = `${progressPct}%`;
            const pctEl = document.getElementById('brew-percent-text');
            if (pctEl) pctEl.textContent = `${Math.round(progressPct)}%`;
            const timerEl = document.getElementById('brew-timer-text');
            if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;

            if (brewingProcess.elapsedSeconds >= brewingProcess.totalSeconds) {
                clearInterval(brewingProcess.timerInterval);
                brewingProcess.timerInterval = null;
                finishAlchemy(recipeId, count);
            }
        }, tickRate);
    }

    function finishAlchemy(recipeId, count = 1) {
        const rec = RECIPES_DATA.find(r => r.id === recipeId);
        if (!rec) return;

        const rates = calculateRates();
        const batchTotal = Math.max(1, count);
        let successCount = 0;
        let critCount = 0;
        let bestQuality = null;
        let bestPill = null;
        const craftedPills = [];

        // Lặp roll cho từng viên đan trong mẻ luyện
        for (let i = 0; i < batchTotal; i++) {
            // Kiểm tra nổ lò cho từng viên
            if (Math.random() > rates.successRate) {
                continue; // Viên đan bị cháy
            }
            successCount++;

            // Kiểm tra bạo kích đan đạo (Song Hoàn Đan x2)
            const isCrit = Math.random() < rates.critRate;
            const yieldCount = isCrit ? 2 : 1;
            if (isCrit) critCount++;

            for (let y = 0; y < yieldCount; y++) {
                const quality = rollPillQuality();
                const finalEffectVal = Math.round(rec.baseEffect.val * quality.multiplier);
                const newPill = {
                    id: `${rec.id}_${Date.now()}_${i}_${y}`,
                    name: `${rec.name} (${quality.name})`,
                    baseName: rec.name,
                    quality: quality.name,
                    qualityId: quality.id,
                    effectType: rec.baseEffect.type,
                    effectVal: finalEffectVal,
                    effectLabel: rec.baseEffect.label,
                    danDoc: quality.danDoc,
                    colorClass: quality.colorClass
                };

                craftedPills.push(newPill);
                playerState.inventoryPills.unshift(newPill);

                // Lưu lại viên có phẩm cấp tốt nhất để hiển thị đại diện
                if (!bestQuality || quality.multiplier > bestQuality.multiplier) {
                    bestQuality = quality;
                    bestPill = newPill;
                }

                // Đồng bộ vào Càn Khôn Nang của nhân vật
                if (typeof window.addItemToInventory === 'function') {
                    const rarityMap = { cuc_pham: 'Mythic', thuong_pham: 'Epic', trung_pham: 'Rare', ha_pham: 'Common' };
                    window.addItemToInventory({
                        id: newPill.id,
                        name: newPill.name,
                        type: 'Consumable',
                        category: 'Pill',
                        rarity: rarityMap[quality.id] || 'Common',
                        icon: '💊',
                        effectType: newPill.effectType,
                        effectVal: newPill.effectVal,
                        danDoc: newPill.danDoc,
                        desc: `${rec.desc} (${newPill.effectLabel} • Đan Độc +${newPill.danDoc}%)`
                    }, 1);
                }
            }
        }

        // Nếu toàn bộ mẻ đều nổ lò
        if (successCount === 0) {
            showXianxiaToast(`💥 NỔ LÒ RỒI! Hỏa hầu mất khống chế, toàn bộ ${batchTotal} mẻ đan [${rec.name}] bị hóa thành tro bụi!`, 'error');
            if (typeof window.addLog === 'function') {
                window.addLog(`💥 <span class="text-rose-400 font-bold">[Nổ Lò Đan]</span> Hỏa hầu phân tán, mẻ luyện <strong>${batchTotal} viên ${rec.name}</strong> bị thiêu rụi thành tro tàn!`, 'text-rose-400');
            }
            resetBrewingUI();
            updateHeaderUI();
            renderRecipes();
            return;
        }

        // Tính EXP thưởng
        const expMultiplier = critCount > 0 ? 1.25 : 1.0;
        const totalExp = Math.round(rec.expReward * successCount * expMultiplier);
        addAlchemyExp(totalExp);

        // Reset UI lò đan
        resetBrewingUI();

        // Ghi nhật ký vào Thiên Cơ Nhật Ký (#cultivation-log)
        if (typeof window.addLog === 'function') {
            const critMsg = critCount > 0 ? ` <strong class="text-amber-300 font-bold">(⚡ Bạo Kích ${critCount} lần Song Đan)</strong>` : '';
            window.addLog(`♨️ <span class="text-teal-300 font-bold">[Luyện Đan Đại Thành]</span> Luyện chế thành công <strong>${craftedPills.length} viên ${rec.name}</strong>${critMsg}! Thu hoạch <strong>+${totalExp} EXP</strong> Đan Đạo.`, 'text-teal-300');
        }

        // Báo toast trực quan
        const toastMsg = critCount > 0
            ? `✨ BẠO KÍCH ĐAN ĐẠO! Luyện thành công ${craftedPills.length} viên [${rec.name}] (Gồm ${critCount} viên Song Hoàn)!`
            : `🎉 Luyện đan thành công ${craftedPills.length} viên [${rec.name}]! (+${totalExp} EXP)`;
        showXianxiaToast(toastMsg, critCount > 0 ? 'success' : 'info');

        // Hiệu ứng "Đan Hương / Khí Linh Xuất Thế": Cột sáng bắn thẳng lên trời
        const qualityColorMap = {
            ha_pham: '#e2e8f0',     // Trắng bạc
            trung_pham: '#34d399',  // Lục ngọc
            thuong_pham: '#38bdf8', // Lam ngọc
            cuc_pham: '#facc15'     // Kim hoàng
        };
        const pillarColor = qualityColorMap[bestQuality?.id] || '#facc15';

        const cauldronWrap = document.getElementById('cauldron-visual-wrap');
        if (cauldronWrap) {
            const pillar = document.createElement('div');
            pillar.className = 'alchemy-pillar-of-light';
            pillar.style.setProperty('--pillar-color', pillarColor);
            cauldronWrap.appendChild(pillar);
            setTimeout(() => pillar.remove(), 750);
        }

        if (window.soundSystem?.play) {
            window.soundSystem.play('pill');
            if (critCount > 0 || bestQuality?.id === 'cuc_pham') {
                setTimeout(() => window.soundSystem?.play('victory'), 180);
            }
        }

        // Báo kết quả nếu modal đang mở
        const batchSummary = {
            totalPills: craftedPills.length,
            successBatches: successCount,
            critCount: critCount,
            totalExp: totalExp
        };

        if (brewingProcess.modalIsOpen) {
            setTimeout(() => {
                openPillResultModal(bestPill, bestQuality, rec, batchSummary);
            }, 300);
        }

        updateHeaderUI();
        renderRecipes();
        renderRecentPills();
    }

    function resetBrewingUI() {
        brewingProcess.isBrewing = false;
        brewingProcess.activeRecipeId = null;
        if (brewingProcess.timerInterval) {
            clearInterval(brewingProcess.timerInterval);
            brewingProcess.timerInterval = null;
        }
        const panelEl = document.getElementById('cauldron-panel');
        if (panelEl) panelEl.classList.remove('is-brewing');
        const brewBox = document.getElementById('brewing-progress-box');
        if (brewBox) brewBox.classList.remove('is-active');
        const fillEl = document.getElementById('brewing-fill');
        if (fillEl) fillEl.style.width = '0%';
    }

    // ====================================================================
    // CƠ CHẾ ĐAN ĐỘC & PHỤC DỤNG ĐAN DƯỢC (SWALLOW PILL & CLEANSE)
    // ====================================================================
    function swallowPill(pillId) {
        const idx = playerState.inventoryPills.findIndex(p => p.id === pillId);
        if (idx === -1) return;

        const pill = playerState.inventoryPills[idx];
        let msg = `🧪 Đã phục dụng [${pill.name}]: `;

        if (pill.effectType === 'heal_hp') {
            msg += `Hồi phục +${pill.effectVal.toLocaleString()} HP!`;
            if (window.state) {
                const maxHp = Number(window.state.maxHp || window.state.totalHp || 5800);
                window.state.hp = Math.min(maxHp, Number(window.state.hp || 0) + pill.effectVal);
            }
            if (window.towerPlayer) {
                window.towerPlayer.hp = Math.min(window.towerPlayer.maxHp, window.towerPlayer.hp + pill.effectVal);
            }
        } else if (pill.effectType === 'add_exp') {
            msg += `Gia tăng +${pill.effectVal.toLocaleString()} Tu Vi!`;
            if (typeof window.addExp === 'function') {
                window.addExp(pill.effectVal);
            } else if (window.state) {
                window.state.exp = Number(window.state.exp || 0) + pill.effectVal;
            }
        } else if (pill.effectType === 'tribulation_buff') {
            msg += `Tăng +${pill.effectVal}% Tỷ lệ Đột Phá / Trúc Cơ thành công!`;
            window.breakthroughBonusChance = (Number(window.breakthroughBonusChance || 0) + (pill.effectVal / 100));
            if (window.state) {
                window.state.pillBuffRemaining = (Number(window.state.pillBuffRemaining || 0) + pill.effectVal);
            }
        } else if (pill.effectType === 'cleanse_poison') {
            msg += `Thanh lọc tiêu trừ -${pill.effectVal}% Đan Độc!`;
            playerState.danDoc = Math.max(0, playerState.danDoc - pill.effectVal);
            if (window.state) window.state.danDoc = playerState.danDoc;
        } else if (pill.effectType === 'atk_buff') {
            msg += `Cố định gia tăng +${pill.effectVal} Công Kích!`;
            if (window.state) {
                window.state.atk = (Number(window.state.atk) || 28) + pill.effectVal;
                window.state.totalAtk = (Number(window.state.totalAtk) || window.state.atk) + pill.effectVal;
            }
            if (typeof window.addExp === 'function') {
                window.addExp(Math.round(pill.effectVal * 250));
            }
        } else if (pill.effectType === 'crit_buff') {
            msg += `Vĩnh viễn gia tăng +${pill.effectVal}% Bạo Kích & +30,000 HP!`;
            if (window.state) {
                window.state.crit = Math.min(100, (Number(window.state.crit) || 10) + pill.effectVal);
                const maxHp = Number(window.state.maxHp || window.state.totalHp || 5800) + 30000;
                window.state.maxHp = maxHp;
                window.state.hp = Math.min(maxHp, Number(window.state.hp || 0) + 30000);
            }
        }

        // Tích tụ đan độc (ngoại trừ đan tẩy độc)
        if (pill.effectType !== 'cleanse_poison') {
            playerState.danDoc += pill.danDoc;
        }
        if (window.state) window.state.danDoc = playerState.danDoc;
        msg += ` (Đan Độc: ${playerState.danDoc}%)`;

        // Xóa viên đan khỏi kệ hồ lô
        playerState.inventoryPills.splice(idx, 1);

        // Cảnh báo đan độc
        if (playerState.danDoc > 100) {
            msg += ` 🚨 CẢNH BÁO: Đan Độc vượt 100%! Hãy uống Thanh Tâm Đan!`;
        }

        if (typeof window.addLog === 'function') {
            window.addLog(`💊 <span class="text-teal-300 font-bold">[Phục Dược]</span> Đã nuốt <strong>${pill.name}</strong> (${pill.effectLabel}). Đan độc hiện tại: ${playerState.danDoc}%.`, 'text-teal-300');
        }

        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();

        showXianxiaToast(msg, playerState.danDoc > 100 ? 'error' : 'success');
        updateHeaderUI();
        renderRecentPills();
    }

    function swallowAllPills() {
        if (!playerState.inventoryPills.length) {
            showXianxiaToast("Hồ Lô rỗng, không có đan dược nào để phục dụng!", "info");
            return;
        }

        let totalHp = 0;
        let totalExp = 0;
        let totalBuff = 0;
        let totalAtk = 0;
        let consumedCount = 0;

        while (playerState.inventoryPills.length > 0) {
            const pill = playerState.inventoryPills[0];

            // Nếu đan độc vượt ngưỡng nguy hiểm 120%, tự động dừng để bảo hộ kinh mạch
            if (playerState.danDoc + pill.danDoc > 120 && pill.effectType !== 'cleanse_poison') {
                showXianxiaToast(`🚨 Cảnh Báo: Đã dừng cắn thuốc tại viên thứ ${consumedCount}! Kinh mạch quá tải Đan Độc (${playerState.danDoc}%). Hãy dùng Thanh Tâm Đan!`, "error");
                break;
            }

            if (pill.effectType === 'heal_hp') {
                totalHp += pill.effectVal;
                if (window.state) {
                    const maxHp = Number(window.state.maxHp || window.state.totalHp || 5800);
                    window.state.hp = Math.min(maxHp, Number(window.state.hp || 0) + pill.effectVal);
                }
            } else if (pill.effectType === 'add_exp') {
                totalExp += pill.effectVal;
                if (typeof window.addExp === 'function') {
                    window.addExp(pill.effectVal);
                } else if (window.state) {
                    window.state.exp = Number(window.state.exp || 0) + pill.effectVal;
                }
            } else if (pill.effectType === 'tribulation_buff') {
                totalBuff += pill.effectVal;
                window.breakthroughBonusChance = (Number(window.breakthroughBonusChance || 0) + (pill.effectVal / 100));
                if (window.state) {
                    window.state.pillBuffRemaining = (Number(window.state.pillBuffRemaining || 0) + pill.effectVal);
                }
            } else if (pill.effectType === 'cleanse_poison') {
                playerState.danDoc = Math.max(0, playerState.danDoc - pill.effectVal);
            } else if (pill.effectType === 'atk_buff') {
                totalAtk += pill.effectVal;
                if (window.state) {
                    window.state.atk = (Number(window.state.atk) || 28) + pill.effectVal;
                    window.state.totalAtk = (Number(window.state.totalAtk) || window.state.atk) + pill.effectVal;
                }
            } else if (pill.effectType === 'crit_buff') {
                if (window.state) {
                    window.state.crit = Math.min(100, (Number(window.state.crit) || 10) + pill.effectVal);
                }
            }

            if (pill.effectType !== 'cleanse_poison') {
                playerState.danDoc += pill.danDoc;
            }
            consumedCount++;
            playerState.inventoryPills.shift();
        }

        if (window.state) window.state.danDoc = playerState.danDoc;
        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();

        const summaryParts = [];
        if (totalHp > 0) summaryParts.push(`+${totalHp.toLocaleString()} HP`);
        if (totalExp > 0) summaryParts.push(`+${totalExp.toLocaleString()} Tu Vi`);
        if (totalBuff > 0) summaryParts.push(`+${totalBuff}% Tỷ Lệ Đột Phá`);
        if (totalAtk > 0) summaryParts.push(`+${totalAtk} Công Kích`);
        const summaryText = summaryParts.length > 0 ? summaryParts.join(', ') : 'Dược lực vận chuyển quanh chu thiên';

        showXianxiaToast(`💊 Đã ẩm thực đồng loạt ${consumedCount} viên đan! (${summaryText} • Đan Độc: ${playerState.danDoc}%)`, "success");
        if (typeof window.addLog === 'function') {
            window.addLog(`💊 <span class="text-teal-300 font-bold">[Vận Khí Luyện Đan]</span> Đã phục dụng liên tiếp <strong>${consumedCount} viên đan dược</strong> (${summaryText})! Đan độc tích tụ: ${playerState.danDoc}%.`, 'text-teal-300');
        }

        updateHeaderUI();
        renderRecentPills();
    }

    function drinkCleansePill() {
        if (playerState.danDoc <= 0) {
            showXianxiaToast("✨ Kinh mạch thanh tịnh, hoàn toàn không có Đan Độc!", "info");
            return;
        }

        let hasInventoryCleanse = false;
        if (window.state && Array.isArray(window.state.inventory)) {
            const found = window.state.inventory.find(i => i && (i.id === 'pill_thanh_tam' || i.id === 'pill_thanh_tam_tinh_hon') && i.count > 0);
            if (found) {
                hasInventoryCleanse = true;
                found.count = Math.max(0, found.count - 1);
            }
        }

        if (!hasInventoryCleanse && playerState.cleansePills <= 0) {
            showXianxiaToast("⚠️ Đã hết Thanh Tâm Đan trong người!", "error");
            return;
        }

        if (!hasInventoryCleanse) {
            playerState.cleansePills--;
        }

        playerState.danDoc = Math.max(0, playerState.danDoc - 30);
        if (window.state) window.state.danDoc = playerState.danDoc;

        showXianxiaToast(`🌿 Đã dùng 1 viên [Thanh Tâm Đan]! Tiêu trừ 30% Đan Độc (Còn lại: ${playerState.danDoc}%).`, "success");
        if (typeof window.addLog === 'function') {
            window.addLog(`🌿 <span class="text-emerald-300 font-bold">[Thanh Lọc Đan Độc]</span> Phục dụng Thanh Tâm Đan, thanh lọc kinh mạch, giảm 30% Đan Độc (Hiện còn: ${playerState.danDoc}%).`, 'text-emerald-300');
        }

        if (typeof window.updateHUD === 'function') window.updateHUD();
        if (typeof window.saveGameState === 'function') window.saveGameState();

        updateHeaderUI();
    }

    function addAlchemyExp(amount) {
        playerState.exp += amount;
        let currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
        let profLoopGuard = 0;

        while (currentProf && currentProf.maxExp > 0 && playerState.exp >= currentProf.maxExp && playerState.level < ALCHEMIST_LEVELS.length && profLoopGuard++ < 10) {
            playerState.exp -= currentProf.maxExp;
            playerState.level++;
            currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
            showXianxiaToast(`🎉 Đan đạo tinh tiến, tấn thăng: [${currentProf.title}]! ${currentProf.desc}`, "success");
            if (typeof window.addLog === 'function') {
                window.addLog(`✨ <span class="text-amber-300 font-bold">[Đan Đạo Tinh Tiến]</span> Bản Tôn tấn thăng <strong>${currentProf.title}</strong>! ${currentProf.desc}`, 'text-amber-300');
            }
        }
    }

    // ====================================================================
    // RENDER GIAO DIỆN & CẬP NHẬT HUD
    // ====================================================================
    function updateHeaderUI() {
        const prof = ALCHEMIST_LEVELS.find(p => p.level === playerState.level) || ALCHEMIST_LEVELS[0];
        const rankName = document.getElementById('alchemist-rank-name');
        if (rankName) rankName.textContent = prof.title;
        const rankTag = document.getElementById('alchemist-rank-tag');
        if (rankTag) {
            rankTag.textContent = `Cấp ${prof.level}`;
            rankTag.className = `rank-pill ${prof.tagClass}`;
        }
        const rankBuff = document.getElementById('alchemist-rank-buff');
        if (rankBuff) rankBuff.textContent = prof.desc;

        // EXP Nghề
        const expPct = Math.min(100, Math.round((playerState.exp / prof.maxExp) * 100));
        const expText = document.getElementById('alchemy-exp-text');
        if (expText) expText.textContent = `${playerState.exp} / ${prof.maxExp} EXP`;
        const expFill = document.getElementById('alchemy-exp-fill');
        if (expFill) {
            expFill.style.width = `${expPct}%`;
            if (expPct >= 100 && playerState.level < ALCHEMIST_LEVELS.length) {
                expFill.classList.add('is-ready-levelup');
                const subtext = document.getElementById('alchemy-exp-subtext');
                if (subtext) subtext.textContent = "✨ Dược khí sung mãn, sẵn sàng đột phá cấp nghề!";
            } else {
                expFill.classList.remove('is-ready-levelup');
                const subtext = document.getElementById('alchemy-exp-subtext');
                if (subtext) subtext.textContent = "Luyện đan để tích lũy kinh nghiệm thăng giai";
            }
        }

        // ĐAN ĐỘC
        const poisonFill = document.getElementById('poison-fill');
        const poisonBox = document.getElementById('poison-meter-box');
        const poisonHint = document.getElementById('poison-status-hint');
        const poisonText = document.getElementById('poison-level-text');
        if (poisonText) poisonText.textContent = `${playerState.danDoc}% / 100%`;
        if (poisonFill) poisonFill.style.width = `${Math.min(100, playerState.danDoc)}%`;

        if (poisonBox && poisonHint) {
            if (playerState.danDoc > 100) {
                poisonBox.classList.add('is-toxic-alert');
                poisonHint.textContent = "🚨 Bế Tắc: Tu Luyện -50%!";
                poisonHint.className = "text-rose-400 font-bold animate-pulse";
            } else if (playerState.danDoc > 60) {
                poisonBox.classList.remove('is-toxic-alert');
                poisonHint.textContent = "⚠️ Đan độc tích lũy cao!";
                poisonHint.className = "text-amber-400";
            } else {
                poisonBox.classList.remove('is-toxic-alert');
                poisonHint.textContent = "Kinh mạch thông suốt";
                poisonHint.className = "text-emerald-400";
            }
        }

        // Đếm dược liệu
        const cntHuysam = document.getElementById('cnt-huysam');
        if (cntHuysam) cntHuysam.textContent = getMaterialCount('herb_huysam');
        const cntLinhchi = document.getElementById('cnt-linhchi');
        if (cntLinhchi) cntLinhchi.textContent = getMaterialCount('herb_linhchi');
        const cntTinhthuy = document.getElementById('cnt-tinhthuy');
        if (cntTinhthuy) cntTinhthuy.textContent = getMaterialCount('herb_tinhthuy');
        const cntYeudan = document.getElementById('cnt-yeudan');
        if (cntYeudan) cntYeudan.textContent = getMaterialCount('herb_yeudan');

        // Tỷ lệ RNG hiển thị dưới đáy lò đan
        const rates = calculateRates();
        const successEl = document.getElementById('rate-success-pct');
        if (successEl) successEl.textContent = `${Math.round(rates.successRate * 100)}%`;
        const haEl = document.getElementById('rate-alch-ha');
        if (haEl) haEl.textContent = `${Math.round(rates.haPham * 100)}%`;
        const trungEl = document.getElementById('rate-alch-trung');
        if (trungEl) trungEl.textContent = `${Math.round(rates.trungPham * 100)}%`;
        const thuongEl = document.getElementById('rate-alch-thuong');
        if (thuongEl) thuongEl.textContent = `${Math.round(rates.thuongPham * 100)}%`;
        const cucEl = document.getElementById('rate-alch-cuc');
        if (cucEl) cucEl.textContent = `${Math.round(rates.cucPham * 100)}%`;
    }

    function renderRecipes() {
        const container = document.getElementById('recipes-scroll-list');
        if (!container) return;
        container.innerHTML = '';

        RECIPES_DATA.forEach(rec => {
            const canLevel = playerState.level >= rec.reqLevel;

            // Tính số lượng tối đa có thể luyện
            const maxCraftable = Math.max(0, Math.min(...rec.materials.map(m => {
                const owned = getMaterialCount(m.matId);
                return Math.floor(owned / m.qty);
            })));

            // Lựa chọn số lượng batch hiện tại
            let currentBatch = selectedBatch[rec.id] || 1;
            if (currentBatch > maxCraftable && maxCraftable > 0) {
                currentBatch = maxCraftable;
                selectedBatch[rec.id] = currentBatch;
            }

            let hasMats = true;
            const matsHtml = rec.materials.map(m => {
                const matObj = HERBS_DATA[m.matId] || { name: m.matId, icon: 'fa-leaf' };
                const owned = getMaterialCount(m.matId);
                const required = m.qty * currentBatch;
                const isEnough = owned >= required;
                if (!isEnough) hasMats = false;

                return `
                    <div class="rec-mat-pill ${isEnough ? 'mat--ok' : 'mat--lack'}">
                        <i class="fa-solid ${matObj.icon}"></i>
                        <span>${matObj.name}: <b>${owned}/${required}</b></span>
                    </div>
                `;
            }).join('');

            const canBrew = canLevel && hasMats && !brewingProcess.isBrewing;
            let btnText = currentBatch > 1 ? `Luyện x${currentBatch} Viên` : "Bắt Đầu Luyện Đan";
            let btnIcon = currentBatch > 1 ? "fa-fire-burner" : "fa-fire";

            if (brewingProcess.isBrewing) {
                btnText = "Lò Đang Luyện Đan...";
                btnIcon = "fa-spinner fa-spin";
            } else if (!canLevel) {
                btnText = `Khóa: Cần ${rec.reqLevelTitle}`;
                btnIcon = "fa-lock";
            } else if (!hasMats) {
                btnText = "Thiếu Dược Liệu";
                btnIcon = "fa-triangle-exclamation";
            }

            const card = document.createElement('article');
            card.className = 'recipe-card-box';
            card.innerHTML = `
                <div class="craft-card-content">
                    <div class="rec-header-row">
                        <div class="flex items-center gap-2.5">
                            <div class="rec-icon-wrap">
                                <i class="fa-solid ${rec.icon} ${rec.gradeColor}"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-sm font-serif ${rec.gradeColor}">${rec.name}</h3>
                                    <span class="text-[10px] px-2 py-0.5 rounded ${rec.gradeBadge} font-mono">${rec.grade}</span>
                                </div>
                                <p class="text-[11px] text-slate-400 mt-0.5">${rec.desc}</p>
                            </div>
                        </div>
                    </div>

                    <div class="craft-effect-row">
                        <div>Hiệu lực: <b class="text-emerald-300">${rec.baseEffect.label}</b></div>
                        <div class="text-amber-300"><i class="fa-solid fa-award mr-1"></i>+${rec.expReward * currentBatch} EXP</div>
                    </div>

                    <div class="rec-mats-grid">
                        ${matsHtml}
                    </div>
                </div>

                <div class="craft-card-action">
                    <!-- Phím chọn số lượng Batch Crafting -->
                    <div class="alchemy-batch-pills">
                        <span class="batch-pill-label">Luyện:</span>
                        <button type="button" class="batch-opt-btn ${currentBatch === 1 ? 'is-active' : ''}" onclick="setAlchemyBatch('${rec.id}', 1)" title="Luyện 1 viên">x1</button>
                        <button type="button" class="batch-opt-btn ${currentBatch === 5 ? 'is-active' : ''}" onclick="setAlchemyBatch('${rec.id}', 5)" ${maxCraftable < 5 ? 'disabled' : ''} title="Luyện mẻ 5 viên">x5</button>
                        <button type="button" class="batch-opt-btn ${currentBatch === maxCraftable && maxCraftable > 1 ? 'is-active' : ''}" onclick="setAlchemyBatch('${rec.id}', 'max')" ${maxCraftable <= 1 ? 'disabled' : ''} title="Luyện tối đa theo kho thảo dược">Max (${maxCraftable})</button>
                    </div>

                    <div class="flex items-center justify-between w-full">
                        <span class="text-xs font-mono font-bold ${canLevel ? 'text-emerald-400' : 'text-rose-400'}">
                            <i class="fa-solid ${canLevel ? 'fa-circle-check' : 'fa-lock'}"></i> Cấp ${rec.reqLevel}
                        </span>
                        <button type="button" class="btn-brew" onclick="startAlchemy('${rec.id}', ${currentBatch})" ${canBrew ? '' : 'disabled'}>
                            <i class="fa-solid ${btnIcon}"></i> ${btnText}
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function renderRecentPills() {
        const container = document.getElementById('recent-pills-container');
        if (!container) return;
        if (!playerState.inventoryPills.length) {
            container.innerHTML = '<span class="text-[11px] text-slate-500 italic">Chưa có viên đan nào được luyện trong phiên này.</span>';
            return;
        }

        const pillsHtml = playerState.inventoryPills.slice(0, 6).map(pill => {
            return `
                <div class="pill-item-badge">
                    <i class="fa-solid fa-capsules ${pill.colorClass}"></i>
                    <span class="${pill.colorClass} font-bold">${pill.name}</span>
                    <span class="text-[10px] text-lime-400 font-mono">(+${pill.danDoc}% Độc)</span>
                    <button type="button" class="btn-swallow-pill" onclick="swallowPill('${pill.id}')">Uống</button>
                </div>
            `;
        }).join('');

        const swallowAllBtn = playerState.inventoryPills.length > 1
            ? `<button type="button" class="btn-swallow-all" onclick="swallowAllPills()" title="Uống toàn bộ đan dược trong hồ lô (tự ngắt nếu Đan Độc quá tải)">
                <i class="fa-solid fa-flask-vial"></i> Uống Tất Cả (${playerState.inventoryPills.length})
               </button>`
            : '';

        container.innerHTML = pillsHtml + swallowAllBtn;
    }

    // ====================================================================
    // POPUP LÒ ĐAN, DỊ HỎA & KẾT QUẢ LUYỆN
    // ====================================================================
    function openCauldronPicker() {
        const list = document.getElementById('cauldron-options-container');
        if (!list) return;
        list.innerHTML = Object.values(CAULDRONS_DATA).map(c => {
            const isSelected = c.id === playerState.activeCauldronId;
            return `
                <div class="picker-item-row ${isSelected ? 'is-active-choice' : ''}" onclick="selectCauldron('${c.id}')">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-teal-500/40 flex items-center justify-center text-2xl text-teal-300">
                            <i class="fa-solid fa-flask"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-100 text-sm font-serif flex items-center gap-2">
                                ${c.name}
                                ${isSelected ? '<span class="text-[10px] px-2 py-0.5 rounded bg-teal-500 text-slate-950 font-bold font-mono">ĐANG DÙNG</span>' : ''}
                            </h4>
                            <span class="text-[11px] text-teal-300/90 font-mono block mt-0.5">${c.buffDesc}</span>
                            <span class="text-[10px] text-slate-400 block">${c.desc}</span>
                        </div>
                    </div>
                    <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                        ${isSelected ? 'Đã Chọn' : 'Sử Dụng'}
                    </button>
                </div>
            `;
        }).join('');
        const modal = document.getElementById('cauldron-modal');
        if (modal) modal.classList.add('is-open');
    }

    function selectCauldron(cauldronId) {
        playerState.activeCauldronId = cauldronId;
        const c = CAULDRONS_DATA[cauldronId];
        if (!c) return;
        const themeEl = document.getElementById('alchemy-body-theme');
        if (themeEl) themeEl.className = c.themeClass;
        const titleEl = document.getElementById('active-cauldron-title');
        if (titleEl) titleEl.textContent = c.name;
        const buffEl = document.getElementById('active-cauldron-buff');
        if (buffEl) buffEl.textContent = c.buffDesc;
        closeCauldronPicker();
        updateHeaderUI();
        renderRecipes();
    }

    function closeCauldronPicker() {
        const el = document.getElementById('cauldron-modal');
        if (el) el.classList.remove('is-open');
    }

    function openFirePicker() {
        const list = document.getElementById('fire-options-container');
        if (!list) return;
        list.innerHTML = Object.values(FLAMES_DATA).map(f => {
            const isSelected = f.id === playerState.activeFireId;
            return `
                <div class="picker-item-row ${isSelected ? 'is-active-choice' : ''}" onclick="selectFire('${f.id}')">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-fire text-2xl ${f.color}"></i>
                        <div>
                            <h4 class="font-bold text-sm ${f.color}">${f.name}</h4>
                            <span class="text-xs text-slate-400">Gia trì: +${Math.round(f.bonusSuccess * 100)}% Thành công • +${Math.round((f.bonusCrit || 0) * 100)}% Bạo Kích</span>
                        </div>
                    </div>
                    <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}">
                        ${isSelected ? 'Đang Dùng' : 'Chọn Hỏa'}
                    </button>
                </div>
            `;
        }).join('');
        const modal = document.getElementById('fire-modal');
        if (modal) modal.classList.add('is-open');
    }

    function selectFire(fireId) {
        playerState.activeFireId = fireId;
        const f = FLAMES_DATA[fireId];
        if (!f) return;
        const nameEl = document.getElementById('active-fire-name');
        if (nameEl) nameEl.textContent = f.name;
        closeFirePicker();
        updateHeaderUI();
        renderRecipes();
    }

    function closeFirePicker() {
        const el = document.getElementById('fire-modal');
        if (el) el.classList.remove('is-open');
    }

    function openPillResultModal(pill, quality, rec, batchSummary = null) {
        const modal = document.getElementById('pill-result-modal');
        const card = document.getElementById('result-dialog-card');
        if (!modal || !card) return;

        if (quality.isMutation || (batchSummary && batchSummary.critCount > 0)) {
            card.classList.add('is-cuc-pham-pill');
        } else {
            card.classList.remove('is-cuc-pham-pill');
        }

        const badgeEl = document.getElementById('res-pill-badge');
        if (badgeEl) {
            badgeEl.className = `text-xs font-mono font-bold px-3 py-1 rounded-full uppercase ${quality.badgeClass}`;
            if (batchSummary && batchSummary.totalPills > 1) {
                badgeEl.innerHTML = `Luyện Hàng Loạt: x${batchSummary.totalPills} Viên ${batchSummary.critCount > 0 ? `<span class="crit-alchemy-tag ml-1">⚡ Bạo Kích +${batchSummary.critCount}</span>` : ''}`;
            } else {
                badgeEl.innerHTML = `${quality.name} ${batchSummary && batchSummary.critCount > 0 ? `<span class="crit-alchemy-tag ml-1">⚡ Bạo Kích x2</span>` : ''}`;
            }
        }

        const titleEl = document.getElementById('res-pill-title');
        if (titleEl) {
            if (batchSummary && batchSummary.totalPills > 1) {
                titleEl.textContent = `${rec.name} (x${batchSummary.totalPills})`;
            } else {
                titleEl.textContent = pill.name;
            }
            titleEl.className = `text-lg font-bold font-serif mb-1 ${quality.colorClass}`;
        }

        const descEl = document.getElementById('res-pill-desc');
        if (descEl) descEl.textContent = rec.desc;

        const iconEl = document.getElementById('res-pill-icon');
        if (iconEl) iconEl.className = `fa-solid ${rec.icon} ${quality.colorClass}`;

        const circleEl = document.getElementById('res-pill-circle');
        if (circleEl) circleEl.className = `w-16 h-16 rounded-2xl mx-auto my-3 flex items-center justify-center text-3xl border ${quality.badgeClass}`;

        const statsBox = document.getElementById('res-pill-stats');
        if (statsBox) {
            if (batchSummary && batchSummary.totalPills > 1) {
                statsBox.innerHTML = `
                    <div class="flex justify-between">
                        <span>Tổng Sản Lượng:</span>
                        <strong class="text-amber-300 font-bold">${batchSummary.totalPills} Viên Đan ${batchSummary.critCount > 0 ? `(Song Hoàn +${batchSummary.critCount})` : ''}</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Phẩm Cấp Cao Nhất:</span>
                        <strong class="${quality.colorClass}">${quality.name} (Hiệu quả x${quality.multiplier})</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Tổng Kinh Nghiệm:</span>
                        <strong class="text-emerald-300">+${batchSummary.totalExp} EXP Đan Đạo</strong>
                    </div>
                    <div class="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                        <span>Đan Độc / Viên:</span>
                        <strong class="${pill.danDoc === 0 ? 'text-pink-300' : 'text-lime-400'}">
                            ${pill.danDoc === 0 ? '✨ 0% Độc (Cực Phẩm Vô Khuyết)' : `+${pill.danDoc}% Đan Độc`}
                        </strong>
                    </div>
                `;
            } else {
                statsBox.innerHTML = `
                    <div class="flex justify-between"><span>Dược Lực Đạt Được:</span><strong class="${quality.colorClass}">Hiệu quả x${quality.multiplier}</strong></div>
                    <div class="flex justify-between"><span>Tác Dụng:</span><strong class="text-emerald-300">${pill.effectLabel}</strong></div>
                    <div class="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                        <span>Đan Độc Tạp Chất:</span>
                        <strong class="${pill.danDoc === 0 ? 'text-pink-300' : 'text-lime-400'}">
                            ${pill.danDoc === 0 ? '✨ 0% Độc (Hoàn Mỹ Vô Khuyết)' : `+${pill.danDoc}% Đan Độc`}
                        </strong>
                    </div>
                `;
            }
        }

        modal.classList.add('is-open');
    }

    function closePillResultModal() {
        const modal = document.getElementById('pill-result-modal');
        if (modal) modal.classList.remove('is-open');
    }

    // Khởi động
    window.addEventListener('DOMContentLoaded', () => {
        syncMaterialsFromInventory();
        selectCauldron(playerState.activeCauldronId);
        renderRecentPills();
    });

    function openLuyenDanModal() {
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        const el = document.getElementById('modal-luyen-dan');
        if (el) {
            el.style.setProperty('display', 'block', 'important');
            el.classList.remove('hidden');
            el.classList.add('active');
            brewingProcess.modalIsOpen = true;
            syncMaterialsFromInventory();
            renderRecipes();
            updateHeaderUI();
        }
    }

    function closeLuyenDanModal() {
        const el = document.getElementById('modal-luyen-dan');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
            el.classList.add('hidden');
        }
        brewingProcess.modalIsOpen = false;
        closePillResultModal();
        closeCauldronPicker();
        closeFirePicker();
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    window.openLuyenDanModal = openLuyenDanModal;
    window.closeLuyenDanModal = closeLuyenDanModal;
    globalThis.openLuyenDanModal = openLuyenDanModal;
    globalThis.closeLuyenDanModal = closeLuyenDanModal;

    window.startAlchemy = startAlchemy;
    window.finishAlchemy = finishAlchemy;
    window.resetBrewingUI = resetBrewingUI;
    window.swallowPill = swallowPill;
    window.swallowAllPills = swallowAllPills;
    window.drinkCleansePill = drinkCleansePill;
    window.addAlchemyExp = addAlchemyExp;
    window.updateHeaderUI = updateHeaderUI;
    window.renderRecipes = renderRecipes;
    window.renderRecentPills = renderRecentPills;
    window.setAlchemyBatch = setAlchemyBatch;
    window.openCauldronPicker = openCauldronPicker;
    window.selectCauldron = selectCauldron;
    window.closeCauldronPicker = closeCauldronPicker;
    window.openFirePicker = openFirePicker;
    window.selectFire = selectFire;
    window.closeFirePicker = closeFirePicker;
    window.openPillResultModal = openPillResultModal;
    window.closePillResultModal = closePillResultModal;
})();
