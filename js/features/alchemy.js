/* ==========================================================================
   MODULE 10: LUYỆN ĐAN PHÒNG (ALCHEMY SYSTEM - TÁCH BIỆT TRONG IIFE)
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
                cucPhamRateBonus: 0.20, // +20% tỷ lệ Cực Phẩm
                timeReductionPct: 0.30,
                desc: "Khắc phù trận Bát Quái, có khả năng lọc sạch hoàn toàn tạp chất Đan Độc!"
            }
        };

        // ====================================================================
        // KHỐI 2.1: HỆ THỐNG DỊ HỎA (FLAMES_DATA - MỞ RỘNG)
        // ====================================================================
        const FLAMES_DATA = {
            fire_mortal: { id: "fire_mortal", name: "Địa Hỏa Phàm Hỏa", bonusSuccess: 0, color: "text-amber-400" },
            fire_lotus: { id: "fire_lotus", name: "Thanh Liên Địa Tâm Hỏa", bonusSuccess: 0.05, color: "text-teal-300" },
            fire_sammuoi: { id: "fire_sammuoi", name: "Tam Muội Chân Hỏa", bonusSuccess: 0.10, color: "text-purple-400" }
        };

        // ====================================================================
        // KHỐI 3: CẤP BẬC LUYỆN ĐAN SƯ (ALCHEMIST_LEVELS)
        // ====================================================================
        const ALCHEMIST_LEVELS = [
            {
                level: 1,
                title: "Đan Đồng",
                tagClass: "bg-slate-800 text-slate-300 border-slate-600",
                maxExp: 150,
                canCraftLinhDan: false,
                bonusSuccessRate: 0.0,
                desc: "Mới bước chân vào Đan đạo, chỉ có thể luyện Phàm Đan."
            },
            {
                level: 2,
                title: "Nhất Giai Luyện Đan Sư",
                tagClass: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
                maxExp: 400,
                canCraftLinhDan: false,
                bonusSuccessRate: 0.05, // +5% cơ bản
                desc: "Nắm vững phân phối hỏa hầu. +5% tỷ lệ đan thành công."
            },
            {
                level: 3,
                title: "Nhị Giai Luyện Đan Sư",
                tagClass: "bg-purple-950/90 text-purple-300 border-purple-400",
                maxExp: 1000,
                canCraftLinhDan: true, // Cho phép luyện Linh Đan
                bonusSuccessRate: 0.10,
                desc: "Đại sư Đan đạo! Cho phép luyện Linh Đan, tăng tỷ lệ đan dược thượng thừa."
            }
        ];

        // ====================================================================
        // KHỐI 4: ĐAN PHƯƠNG (RECIPES_DATA)
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
                baseTime: 6, // 6s
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
                reqLevel: 2, // Nhất Giai Luyện Đan Sư
                reqLevelTitle: "Nhất Giai Luyện Đan Sư (Cấp 2)",
                materials: [
                    { matId: "herb_linhchi", qty: 10 },
                    { matId: "herb_tinhthuy", qty: 5 }
                ],
                baseTime: 10, // 10s
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
                reqLevel: 3, // Nhị Giai Luyện Đan Sư
                reqLevelTitle: "Nhị Giai Luyện Đan Sư (Cấp 3)",
                materials: [
                    { matId: "herb_yeudan", qty: 1 },
                    { matId: "herb_linhchi", qty: 20 }
                ],
                baseTime: 15, // 15s
                expReward: 80,
                baseEffect: { type: "tribulation_buff", val: 30, label: "+30% Thành Công Đột Phá Trúc Cơ" },
                desc: "Nghịch thiên linh đan trợ giúp tu sĩ phá tan gông xiềng Luyện Khí, bước vào Trúc Cơ."
            }
        ];

        // ====================================================================
        // STATE NGƯỜI CHƠI & ĐAN ĐỘC
        // ====================================================================
        const playerState = {
            level: 2,          // Nhất Giai Luyện Đan Sư (Cấp 2)
            exp: 300,          // 300 EXP
            danDoc: 25,        // Đan độc tích tụ ban đầu: 25%
            cleansePills: 5,   // Số viên Thanh Tâm Đan sẵn có
            activeCauldronId: "cauldron_2", // Thanh Mộc Đỉnh
            activeFireId: "fire_lotus",     // Thanh Liên Địa Tâm Hỏa
            materials: {
                herb_huysam: 20,
                herb_linhchi: 25,
                herb_tinhthuy: 15,
                herb_yeudan: 5
            },
            inventoryPills: [] // Túi trữ đan dược
        };
        window.alchemyPlayerState = playerState;

        const brewingProcess = {
            isBrewing: false,
            activeRecipeId: null,
            timerInterval: null,
            totalSeconds: 0,
            elapsedSeconds: 0
        };

        // ====================================================================
        // TÍNH TOÁN XÁC SUẤT RNG DỰA TRÊN LÒ ĐAN, DỊ HỎA & CẤP NGHỀ
        // ====================================================================
        function calculateRates() {
            const cauldron = CAULDRONS_DATA[playerState.activeCauldronId];
            const prof = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
            const fire = FLAMES_DATA[playerState.activeFireId];

            // Tỷ lệ thành công (không bị nổ lò):
            let successRate = Math.min(0.99, 0.85 + cauldron.successRateBonus + prof.bonusSuccessRate + fire.bonusSuccess);

            // Tỷ lệ Cực Phẩm:
            let rateCucPham = cauldron.cucPhamRateBonus || 0.005; // 0.5% base hoặc +20% nếu dùng Bát Quái Lò
            let rateThuongPham = 0.08 + (prof.bonusSuccessRate * 0.8);
            let rateTrungPham = 0.30 + (prof.bonusSuccessRate * 0.6);
            let rateHaPham = Math.max(0.1, 1 - (rateCucPham + rateThuongPham + rateTrungPham));

            const total = rateCucPham + rateThuongPham + rateTrungPham + rateHaPham;
            return {
                successRate: successRate,
                cucPham: rateCucPham / total,
                thuongPham: rateThuongPham / total,
                trungPham: rateTrungPham / total,
                haPham: rateHaPham / total
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
                    danDoc: 0, // 0% ĐAN ĐỘC (TUYỆT ĐỐI KHÔNG ĐỘC)
                    badgeClass: "bg-purple-950 text-pink-300 border border-pink-400 shadow-[0_0_15px_#e879f9]",
                    colorClass: "text-pink-300",
                    isMutation: true
                };
            } else if (rand < rates.cucPham + rates.thuongPham) {
                return {
                    id: "thuong_pham",
                    name: "Thượng Phẩm",
                    multiplier: 2.0,
                    danDoc: 1, // 1% ĐAN ĐỘC
                    badgeClass: "bg-sky-950 text-sky-300 border border-sky-400",
                    colorClass: "text-sky-400",
                    isMutation: false
                };
            } else if (rand < rates.cucPham + rates.thuongPham + rates.trungPham) {
                return {
                    id: "trung_pham",
                    name: "Trung Phẩm",
                    multiplier: 1.5,
                    danDoc: 5, // 5% ĐAN ĐỘC
                    badgeClass: "bg-emerald-950 text-emerald-300 border border-emerald-500",
                    colorClass: "text-emerald-400",
                    isMutation: false
                };
            } else {
                return {
                    id: "ha_pham",
                    name: "Hạ Phẩm",
                    multiplier: 1.0,
                    danDoc: 10, // 10% ĐAN ĐỘC
                    badgeClass: "bg-slate-800 text-slate-300 border-slate-600",
                    colorClass: "text-slate-200",
                    isMutation: false
                };
            }
        }

        // ====================================================================
        // LOGIC START ALCHEMY & FINISH ALCHEMY
        // ====================================================================
        function startAlchemy(recipeId) {
            if (brewingProcess.isBrewing) return;

            const rec = RECIPES_DATA.find(r => r.id === recipeId);
            const cauldron = CAULDRONS_DATA[playerState.activeCauldronId];
            if (!rec || !cauldron) return;

            // 1. Kiểm tra cấp nghề
            if (playerState.level < rec.reqLevel) {
                showXianxiaToast(`⚠️ Cấp nghề chưa đủ! Cần đạt ${rec.reqLevelTitle}.`, 'error');
                return;
            }

            // 2. Kiểm tra nguyên liệu
            for (const mat of rec.materials) {
                const owned = playerState.materials[mat.matId] || 0;
                if (owned < mat.qty) {
                    const matObj = HERBS_DATA[mat.matId];
                    showXianxiaToast(`⚠️ Không đủ dược liệu: ${matObj.name} (${owned}/${mat.qty})!`, 'error');
                    return;
                }
            }

            // 3. Khấu trừ dược liệu
            rec.materials.forEach(mat => {
                playerState.materials[mat.matId] -= mat.qty;
            });

            // 4. Tính toán thời gian thực tế
            const actualTime = Math.max(2, Math.round(rec.baseTime * (1 - cauldron.timeReductionPct)));

            brewingProcess.isBrewing = true;
            brewingProcess.activeRecipeId = recipeId;
            brewingProcess.totalSeconds = actualTime;
            brewingProcess.elapsedSeconds = 0;

            // Kích hoạt animation khói sương cuồn cuộn
            document.getElementById('cauldron-panel').classList.add('is-brewing');
            document.getElementById('brewing-progress-box').classList.add('is-active');
            document.getElementById('brew-pill-name').innerHTML = `
                <i class="fa-solid fa-circle-notch fa-spin text-teal-400 mr-1"></i>Đang luyện: ${rec.name}
            `;

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

                document.getElementById('brewing-fill').style.width = `${progressPct}%`;
                document.getElementById('brew-percent-text').textContent = `${Math.round(progressPct)}%`;
                document.getElementById('brew-timer-text').textContent = `${remaining.toFixed(1)}s`;

                if (brewingProcess.elapsedSeconds >= brewingProcess.totalSeconds) {
                    clearInterval(brewingProcess.timerInterval);
                    finishAlchemy(recipeId);
                }
            }, tickRate);
        }

        function finishAlchemy(recipeId) {
            const rec = RECIPES_DATA.find(r => r.id === recipeId);
            if (!rec) return;

            const rates = calculateRates();

            // Kiểm tra nổ lò
            if (Math.random() > rates.successRate) {
                showXianxiaToast(`💥 NỔ LÒ RỒI! Hỏa hầu mất khống chế, mẻ đan [${rec.name}] bị cháy thành tro bụi!`, 'error');
                resetBrewingUI();
                updateHeaderUI();
                renderRecipes();
                return;
            }

            // 1. Quay phẩm chất
            const quality = rollPillQuality();

            // 2. Tính toán hiệu quả theo hệ số phẩm chất
            const finalEffectVal = Math.round(rec.baseEffect.val * quality.multiplier);

            // 3. Tạo viên đan hoàn chỉnh
            const newPill = {
                id: `${rec.id}_${Date.now()}`,
                name: `${rec.name} (${quality.name})`,
                baseName: rec.name,
                quality: quality.name,
                qualityId: quality.id,
                effectType: rec.baseEffect.type,
                effectVal: finalEffectVal,
                effectLabel: rec.baseEffect.label,
                danDoc: quality.danDoc, // % Đan độc chứa trong viên đan
                colorClass: quality.colorClass
            };
            playerState.inventoryPills.unshift(newPill);

            // Đồng bộ đan dược vào Túi Đồ Bản Nguyên
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

            // 4. Cộng EXP nghề
            addAlchemyExp(rec.expReward);

            // 5. Reset UI
            resetBrewingUI();

            // 6. Hiển thị Popup kết quả
            openPillResultModal(newPill, quality, rec);

            updateHeaderUI();
            renderRecipes();
            renderRecentPills();
        }

        function resetBrewingUI() {
            brewingProcess.isBrewing = false;
            brewingProcess.activeRecipeId = null;
            document.getElementById('cauldron-panel').classList.remove('is-brewing');
            document.getElementById('brewing-progress-box').classList.remove('is-active');
            document.getElementById('brewing-fill').style.width = '0%';
        }

        // ====================================================================
        // CƠ CHẾ ĐAN ĐỘC & UỐNG ĐAN DƯỢC
        // ====================================================================
        function swallowPill(pillId) {
            const idx = playerState.inventoryPills.findIndex(p => p.id === pillId);
            if (idx === -1) return;

            const pill = playerState.inventoryPills[idx];

            // 1. Nhận tác dụng đan dược và đồng bộ trực tiếp vào window.state
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
            }

            // 2. Tích tụ đan độc
            playerState.danDoc += pill.danDoc;
            if (window.state) window.state.danDoc = playerState.danDoc;
            msg += ` (Đan Độc: ${playerState.danDoc}%)`;

            // Xóa viên đan khỏi túi
            playerState.inventoryPills.splice(idx, 1);

            // Kiểm tra quá tải đan độc
            if (playerState.danDoc > 100) {
                msg += ` 🚨 CẢNH BÁO: Đan Độc vượt 100%! Hãy uống Thanh Tâm Đan!`;
            }

            if (typeof window.updateHUD === 'function') window.updateHUD();
            if (typeof window.saveGameState === 'function') window.saveGameState();
            showXianxiaToast(msg, playerState.danDoc > 100 ? 'error' : 'success');
            updateHeaderUI();
            renderRecentPills();
        }

        function drinkCleansePill() {
            if (playerState.danDoc <= 0) {
                showXianxiaToast("✨ Kinh mạch thanh tịnh, hoàn toàn không có Đan Độc!", "info");
                return;
            }
            if (playerState.cleansePills <= 0) {
                showXianxiaToast("⚠️ Đã hết Thanh Tâm Đan trong người!", "error");
                return;
            }

            playerState.cleansePills--;
            playerState.danDoc = Math.max(0, playerState.danDoc - 30);
            if (window.state) window.state.danDoc = playerState.danDoc;
            showXianxiaToast(`🌿 Đã dùng 1 viên [Thanh Tâm Đan]! Tiêu trừ 30% Đan Độc (Còn lại: ${playerState.danDoc}%).`, "success");
            updateHeaderUI();
        }

        // ====================================================================
        // HỆ THỐNG EXP & THĂNG CẤP LUYỆN ĐAN SƯ
        // ====================================================================
        function addAlchemyExp(amount) {
            playerState.exp += amount;
            let currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
            let profLoopGuard = 0;

            while (currentProf && currentProf.maxExp > 0 && playerState.exp >= currentProf.maxExp && playerState.level < 3 && profLoopGuard++ < 10) {
                playerState.exp -= currentProf.maxExp;
                playerState.level++;
                currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
                showXianxiaToast(`🎉 Đan đạo tinh tiến, tấn thăng: [${currentProf.title}]! ${currentProf.desc}`, "success");
            }
        }

        // ====================================================================
        // RENDER GIAO DIỆN & CẬP NHẬT HUD
        // ====================================================================
        function updateHeaderUI() {
            const prof = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
            document.getElementById('alchemist-rank-name').textContent = prof.title;
            document.getElementById('alchemist-rank-tag').textContent = `Cấp ${prof.level}`;
            document.getElementById('alchemist-rank-tag').className = `rank-pill ${prof.tagClass}`;
            document.getElementById('alchemist-rank-buff').textContent = prof.desc;

            // EXP
            const expPct = Math.min(100, Math.round((playerState.exp / prof.maxExp) * 100));
            document.getElementById('alchemy-exp-text').textContent = `${playerState.exp} / ${prof.maxExp} EXP`;
            const expFill = document.getElementById('alchemy-exp-fill');
            expFill.style.width = `${expPct}%`;

            if (expPct >= 100 && playerState.level < 3) {
                expFill.classList.add('is-ready-levelup');
                document.getElementById('alchemy-exp-subtext').textContent = "✨ Dược khí sung mãn, sẵn sàng đột phá cấp nghề!";
            } else {
                expFill.classList.remove('is-ready-levelup');
                document.getElementById('alchemy-exp-subtext').textContent = "Luyện đan để tích lũy kinh nghiệm thăng giai";
            }

            // ĐAN ĐỘC
            const poisonFill = document.getElementById('poison-fill');
            const poisonBox = document.getElementById('poison-meter-box');
            const poisonHint = document.getElementById('poison-status-hint');
            document.getElementById('poison-level-text').textContent = `${playerState.danDoc}% / 100%`;
            poisonFill.style.width = `${Math.min(100, playerState.danDoc)}%`;

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

            // Herb counters
            document.getElementById('cnt-huysam').textContent = playerState.materials.herb_huysam;
            document.getElementById('cnt-linhchi').textContent = playerState.materials.herb_linhchi;
            document.getElementById('cnt-tinhthuy').textContent = playerState.materials.herb_tinhthuy;
            document.getElementById('cnt-yeudan').textContent = playerState.materials.herb_yeudan;

            // Rates
            const rates = calculateRates();
            document.getElementById('rate-success-pct').textContent = `${Math.round(rates.successRate * 100)}%`;
            document.getElementById('rate-alch-ha').textContent = `${Math.round(rates.haPham * 100)}%`;
            document.getElementById('rate-alch-trung').textContent = `${Math.round(rates.trungPham * 100)}%`;
            document.getElementById('rate-alch-thuong').textContent = `${Math.round(rates.thuongPham * 100)}%`;
            document.getElementById('rate-alch-cuc').textContent = `${Math.round(rates.cucPham * 100)}%`;
        }

        function renderRecipes() {
            const container = document.getElementById('recipes-scroll-list');
            container.innerHTML = '';

            RECIPES_DATA.forEach(rec => {
                const canLevel = playerState.level >= rec.reqLevel;
                let hasMats = true;

                const matsHtml = rec.materials.map(m => {
                    const matObj = HERBS_DATA[m.matId];
                    const owned = playerState.materials[m.matId] || 0;
                    const isEnough = owned >= m.qty;
                    if (!isEnough) hasMats = false;

                    return `
                        <div class="rec-mat-pill ${isEnough ? 'mat--ok' : 'mat--lack'}">
                            <i class="fa-solid ${matObj.icon}"></i>
                            <span>${matObj.name}: <b>${owned}/${m.qty}</b></span>
                        </div>
                    `;
                }).join('');

                const canBrew = canLevel && hasMats && !brewingProcess.isBrewing;
                let btnText = "Bắt Đầu Luyện Đan";
                let btnIcon = "fa-fire";

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
                    <div class="rec-header-row">
                        <div class="flex items-center gap-2.5">
                            <div class="rec-icon-wrap">
                                <i class="fa-solid ${rec.icon} ${rec.gradeColor}"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-sm font-serif ${rec.gradeColor}">[${rec.grade}] ${rec.name}</h3>
                                    <span class="text-[10px] px-2 py-0.5 rounded ${rec.gradeBadge} font-mono">${rec.grade}</span>
                                </div>
                                <p class="text-[11px] text-slate-400 mt-0.5">${rec.desc}</p>
                            </div>
                        </div>
                        <span class="text-xs font-mono font-bold ${canLevel ? 'text-emerald-400' : 'text-rose-400'}">
                            <i class="fa-solid ${canLevel ? 'fa-circle-check' : 'fa-lock'}"></i> Cấp ${rec.reqLevel}
                        </span>
                    </div>

                    <div class="flex justify-between items-center text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono mb-2">
                        <div>Hiệu lực: <b class="text-emerald-300">${rec.baseEffect.label}</b></div>
                        <div class="text-amber-300"><i class="fa-solid fa-award mr-1"></i>+${rec.expReward} EXP</div>
                    </div>

                    <div class="rec-mats-grid">
                        ${matsHtml}
                    </div>

                    <button type="button" class="btn-brew" onclick="startAlchemy('${rec.id}')" ${canBrew ? '' : 'disabled'}>
                        <i class="fa-solid ${btnIcon}"></i> ${btnText}
                    </button>
                `;
                container.appendChild(card);
            });
        }

        function renderRecentPills() {
            const container = document.getElementById('recent-pills-container');
            if (!playerState.inventoryPills.length) {
                container.innerHTML = '<span class="text-[11px] text-slate-500 italic">Chưa có viên đan nào được luyện trong phiên này.</span>';
                return;
            }

            container.innerHTML = playerState.inventoryPills.slice(0, 5).map(pill => {
                return `
                    <div class="pill-item-badge">
                        <i class="fa-solid fa-capsules ${pill.colorClass}"></i>
                        <span class="${pill.colorClass} font-bold">${pill.name}</span>
                        <span class="text-[10px] text-lime-400 font-mono">(+${pill.danDoc}% Độc)</span>
                        <button type="button" class="btn-swallow-pill" onclick="swallowPill('${pill.id}')">Uống</button>
                    </div>
                `;
            }).join('');
        }

        // ====================================================================
        // POPUP LÒ ĐAN, DỊ HỎA & KẾT QUẢ LUYỆN
        // ====================================================================
        function openCauldronPicker() {
            const list = document.getElementById('cauldron-options-container');
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
            document.getElementById('cauldron-modal').classList.add('is-open');
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
                                <span class="text-xs text-slate-400">Gia trì: +${Math.round(f.bonusSuccess * 100)}% Thành công</span>
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
        }

        function closeFirePicker() {
            const el = document.getElementById('fire-modal');
            if (el) el.classList.remove('is-open');
        }

        function openPillResultModal(pill, quality, rec) {
            const modal = document.getElementById('pill-result-modal');
            const card = document.getElementById('result-dialog-card');

            if (quality.isMutation) card.classList.add('is-cuc-pham-pill');
            else card.classList.remove('is-cuc-pham-pill');

            document.getElementById('res-pill-badge').className = `text-xs font-mono font-bold px-3 py-1 rounded-full uppercase ${quality.badgeClass}`;
            document.getElementById('res-pill-badge').textContent = quality.name;

            document.getElementById('res-pill-title').textContent = pill.name;
            document.getElementById('res-pill-title').className = `text-lg font-bold font-serif mb-1 ${quality.colorClass}`;
            document.getElementById('res-pill-desc').textContent = rec.desc;

            document.getElementById('res-pill-icon').className = `fa-solid ${rec.icon} ${quality.colorClass}`;
            document.getElementById('res-pill-circle').className = `w-16 h-16 rounded-2xl mx-auto my-3 flex items-center justify-center text-3xl border ${quality.badgeClass}`;

            const statsBox = document.getElementById('res-pill-stats');
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

            modal.classList.add('is-open');
        }

        function closePillResultModal() {
            document.getElementById('pill-result-modal').classList.remove('is-open');
        }

        // Khởi động
        window.addEventListener('DOMContentLoaded', () => {
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
            if (typeof renderRecipes === 'function') renderRecipes();
            if (typeof updateHeaderUI === 'function') updateHeaderUI();
        }
    }

    function closeLuyenDanModal() {
        const el = document.getElementById('modal-luyen-dan');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
            el.classList.add('hidden');
        }
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
    window.drinkCleansePill = drinkCleansePill;
    window.addAlchemyExp = addAlchemyExp;
    window.updateHeaderUI = updateHeaderUI;
    window.renderRecipes = renderRecipes;
    window.renderRecentPills = renderRecentPills;
    window.openCauldronPicker = openCauldronPicker;
    window.selectCauldron = selectCauldron;
    window.closeCauldronPicker = closeCauldronPicker;
    window.openFirePicker = openFirePicker;
    window.selectFire = selectFire;
    window.closeFirePicker = closeFirePicker;
    window.openPillResultModal = openPillResultModal;
    window.closePillResultModal = closePillResultModal;
})();
