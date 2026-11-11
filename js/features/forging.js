

/* ==========================================================================
   MODULE 11: LUYỆN KHÍ THẤT (FORGING SYSTEM - TÁCH BIỆT TRONG IIFE)
   ========================================================================== */
(() => {
    // ====================================================================
        // 1. DATA STATE CỦA NGƯỜI CHƠI (PLAYER STATE ĐỒNG BỘ VỚI WINDOW.STATE)
        // ====================================================================
        const playerState = {
            _realmIndex: 2,
            _stones: 2500,
            get realmIndex() {
                if (window.state && typeof window.state.realmIndex === 'number') {
                    return Math.max(this._realmIndex, window.state.realmIndex);
                }
                return this._realmIndex;
            },
            set realmIndex(v) {
                this._realmIndex = v;
            },
            get stones() {
                if (window.state && typeof window.state.stones === 'number') {
                    return window.state.stones;
                }
                return this._stones;
            },
            set stones(v) {
                this._stones = v;
                if (window.state) {
                    window.state.stones = v;
                    if (typeof window.updateHUD === 'function') window.updateHUD();
                }
            },
            inventory: {
                stone_ore: 15,   // Huyền Thiết Khoáng
                herb_spirit: 5,  // Tử Linh Chi
                herb_blood: 3    // Huyết Ngọc Sâm
            },
            craftedBag: [] // Túi lưu các món đồ đã đúc thành công
        };
        window.forgingPlayerState = playerState;

        const REALM_LABELS = {
            0: "Luyện Khí Tầng 1",
            2: "Luyện Khí Tầng 3",
            4: "Luyện Khí Tầng 5",
            10: "Trúc Cơ - Sơ Kỳ"
        };

        // ====================================================================
        // 2. CẤU TRÚC DỮ LIỆU CÔNG THỨC (CRAFTING_RECIPES)
        // ====================================================================
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
                    { key: "stones", name: "Linh Thạch", qty: 200, icon: "fa-gem" }
                ],
                baseStats: { atk: 150 },
                craftTime: 8, // Thời gian rèn: 8 giây (để test mượt mà)
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
                craftTime: 12,
                desc: "Đạo bào ngưng tụ thanh vân linh khí, gia tăng thể phách và phòng ngự."
            },
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
                baseStats: { def: 90, atk: 70 },
                craftTime: 15,
                desc: "Ngọc bội viễn cổ hộ trì tâm mạch, công thủ toàn diện."
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
            try {
                if (!audioCtx) {
                    const AudioContextCls = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextCls) audioCtx = new AudioContextCls();
                }
                if (!audioCtx) return;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const now = audioCtx.currentTime;

                if (type === 'forge_start') {
                    // Tiếng búa gõ đe kim loại dứt khoát
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
                    gain.gain.setValueAtTime(0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now);
                    osc.stop(now + 0.35);
                } else if (type === 'forge_success') {
                    // Hợp âm ngũ cung tiên hiệp ngân vang
                    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                        gain.gain.setValueAtTime(0.25, now + idx * 0.09);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.8);
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.start(now + idx * 0.09);
                        osc.stop(now + idx * 0.09 + 0.85);
                    });
                }
            } catch (e) {
                // Ignore audio context error if disabled
            }
        }

        // ====================================================================
        // 6. RENDER GIAO DIỆN & CẬP NHẬT HUD
        // ====================================================================
        function updateTopBarUI() {
            document.getElementById('display-stones').textContent = playerState.stones.toLocaleString('vi-VN');
            document.getElementById('display-huyen-thiet').textContent = playerState.inventory.stone_ore;
            document.getElementById('display-linh-chi').textContent = playerState.inventory.herb_spirit;
            document.getElementById('display-ngoc-sam').textContent = playerState.inventory.herb_blood;
        }

        function renderBlueprints() {
            const container = document.getElementById('blueprints-list');
            container.innerHTML = '';

            CRAFTING_RECIPES.forEach(recipe => {
                const realmMet = playerState.realmIndex >= recipe.reqRealmIndex;
                let matsMet = true;

                // Kiểm tra từng nguyên liệu
                const matsHtml = recipe.materials.map(mat => {
                    let owned = 0;
                    if (mat.key === 'stones') owned = playerState.stones;
                    else owned = playerState.inventory[mat.key] || 0;

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
                            <div class="flex items-center gap-2">
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
                    if ((playerState.inventory[mat.key] || 0) < mat.qty) {
                        showXianxiaToast(`⚠️ Không đủ nguyên liệu: ${mat.name}!`, "error");
                        return;
                    }
                }
            }

            // 1. Khấu trừ nguyên liệu trong túi đồ
            recipe.materials.forEach(mat => {
                if (mat.key === 'stones') {
                    playerState.stones -= mat.qty;
                } else {
                    playerState.inventory[mat.key] -= mat.qty;
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
            if (typeof window.addItemToInventory === 'function') {
                const rarityMap = { cuc_pham: 'Legendary', thuong_pham: 'Epic', trung_pham: 'Rare', ha_pham: 'Common' };
                window.addItemToInventory({
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
                }, 1);
            }
            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            const newCp = typeof window.getCombatPower === 'function' ? window.getCombatPower() : 0;
            const cpDelta = Math.max(800, newCp - prevCp);

            if (typeof window.spawnFloatingText === 'function') {
                window.spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Rèn Thành ${quality.name}! (+${cpDelta.toLocaleString('vi-VN')} CP)`, 'text-amber-300 font-bold');
            }

            if (typeof window.addLog === 'function') {
                window.addLog(`⚒️ <span class="text-amber-300 font-bold">[Luyện Khí Đại Thành]</span> Đã rèn thành công <strong>${craftedItem.name}</strong> (${craftedItem.subStat || 'Phẩm chất ' + quality.name})! (+${cpDelta.toLocaleString('vi-VN')} CP). Đã cất vào Càn Khôn Nang.`, 'text-amber-300');
            }
            if (typeof window.saveGameState === 'function') window.saveGameState();
            if (typeof window.updateHUD === 'function') window.updateHUD();

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
            el.style.setProperty('display', 'block', 'important');
            el.classList.remove('hidden');
            el.classList.add('active');
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
})();
