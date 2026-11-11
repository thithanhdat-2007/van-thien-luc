


/* ==========================================================================
   MODULE 12: KHUÊ PHÒNG TIÊN ĐIỆN (COMPANION & DUAL CULTIVATION SYSTEM)
   ========================================================================== */
(() => {
    
        // ====================================================================
        // KHỐI 1: CẤU TRÚC DỮ LIỆU ĐẠO LỮ (COMPANIONS_DATA)
        // ====================================================================
        const COMPANIONS_DATA = [
            {
                id: "companion_1",
                name: "Liễu Như Yên",
                title: "Tiểu Sư Muội",
                sect: "Thanh Vân Tiên Phái",
                avatar: "./assets/images/pet_fox.jpg",
                quote: "Sư huynh, bế quan mệt mỏi rồi sao? Muội vừa pha linh trà tuyết liên cho huynh...",
                unlocked: true,
                unlockCondition: "Hoàn thành nhiệm vụ Trúc Cơ",
                expMultiplier: 1.5,
                affection: 1800, // Cấp 3: Tri Kỷ
                buffs: [
                    { level: 1, text: "+5% Tốc độ tu luyện toàn phần" },
                    { level: 3, text: "+10% Tốc độ hồi phục Linh Lực & Khí Huyết" },
                    { level: 5, text: "Tự động thu hoạch Linh Điền khi offline" }
                ]
            },
            {
                id: "companion_2",
                name: "Lãnh Nguyệt",
                title: "Ma Tông Thánh Nữ",
                sect: "U Minh Ma Tông",
                avatar: "./assets/images/avatar_heart_demon.jpg",
                quote: "Đạo ma bất đồng? Hừ, trên con đường vấn đỉnh trường sinh, ta chỉ tin ngươi...",
                unlocked: false,
                unlockCondition: "Điểm Tâm Ma > 500",
                expMultiplier: 2.2,
                affection: 0,
                buffs: [
                    { level: 1, text: "+10% Sát thương Bạo kích toàn phần" },
                    { level: 3, text: "+15% Xuyên Giáp & Ma Đạo Sát Khí" },
                    { level: 5, text: "Khi Song Tu có 20% tỷ lệ đột phá bình cảnh không cần Đan dược" }
                ]
            },
            {
                id: "companion_3",
                name: "Hồ Mị Nhi",
                title: "Yêu Tộc Công Chúa",
                sect: "Thiên Hồ Vương Tộc",
                avatar: "./assets/images/char_cultivator.jpg",
                quote: "Nhân loại các ngươi cứ thích đoan chính, chẳng bằng cùng ta hưởng thụ nhân gian...",
                unlocked: false,
                unlockCondition: "Thu phục Cửu Vĩ Linh Hồ",
                expMultiplier: 1.8,
                affection: 0,
                buffs: [
                    { level: 1, text: "+8% Tốc độ di chuyển & Né tránh" },
                    { level: 3, text: "+12% Hút máu khi công kích" },
                    { level: 5, text: "Tăng 20% tỷ lệ Luyện Đan ra Cực Phẩm" }
                ]
            }
        ];

        // ====================================================================
        // KHỐI 2: CẤP BẬC HẢO CẢM & VẬT PHẨM QUÀ TẶNG
        // ====================================================================
        const AFFECTION_RANKS = [
            { level: 1, title: "Người Dưng", minExp: 0, maxExp: 500 },
            { level: 2, title: "Quen Biết", minExp: 500, maxExp: 1500 },
            { level: 3, title: "Tri Kỷ", minExp: 1500, maxExp: 3000 },
            { level: 4, title: "Đạo Lữ", minExp: 3000, maxExp: 5000 },
            { level: 5, title: "Sinh Tử Giao", minExp: 5000, maxExp: 5000 }
        ];

        const GIFT_ITEMS_DATA = {
            gift_tramcai: { id: "gift_tramcai", name: "Bạch Ngọc Trâm Cài", affection: 100 },
            gift_luuly: { id: "gift_luuly", name: "Thất Bảo Lưu Ly", affection: 250 },
            gift_hoalactinh: { id: "gift_hoalactinh", name: "Hoa Lạc Tinh", affection: 600 }
        };

        // ====================================================================
        // STATE NGƯỜI CHƠI & KHUÊ PHÒNG
        // ====================================================================
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
                gift_tramcai: 5,
                gift_luuly: 3,
                gift_hoalactinh: 2
            },
            lastDualCultivationTime: 0, // Timestamp lần song tu trước
            dualCooldownHours: 12        // Cooldown 12 giờ
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
        // HÀM 1: TẶNG QUÀ (GIVE GIFT)
        // ====================================================================
        function giveGift(itemId) {
            const gift = GIFT_ITEMS_DATA[itemId];
            if (!gift) return;

            if ((playerState.gifts[itemId] || 0) <= 0) {
                showXianxiaToast(`⚠️ Đã hết [${gift.name}] trong túi!`, "error");
                return;
            }

            const comp = getActiveCompanion();
            const prevRank = getAffectionRank(comp.affection);

            // Trừ quà & cộng điểm Hảo Cảm
            playerState.gifts[itemId]--;
            comp.affection = Math.min(5000, comp.affection + gift.affection);

            const newRank = getAffectionRank(comp.affection);

            // Đồng bộ sang danh sách Đạo Lữ của Gia Viên
            if (Array.isArray(window.COMPANIONS_LIST)) {
                const estateComp = window.COMPANIONS_LIST.find(c => c.id === comp.id);
                if (estateComp) estateComp.affectionLevel = newRank.level;
            }

            // Cập nhật buff thụ động vào state người chơi
            if (window.state) {
                if (!window.state.companionBuffs) window.state.companionBuffs = {};
                if (comp.id === 'companion_1') window.state.companionBuffs.hpPercent = newRank.level * 2;
                else if (comp.id === 'companion_2') window.state.companionBuffs.atkPercent = newRank.level * 2;
                else if (comp.id === 'companion_3') window.state.companionBuffs.defPercent = newRank.level * 2;
                if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }

            // Thông báo thăng cấp hảo cảm nếu vượt mốc
            if (newRank.level > prevRank.level) {
                showXianxiaToast(`💖 TÌNH CẢM THĂNG HOA! Quan hệ với [${comp.name}] đạt cảnh giới [${newRank.title}] (Cấp ${newRank.level})!`, "success");
            } else {
                showXianxiaToast(`🎁 Đã tặng [${gift.name}] cho ${comp.name} (+${gift.affection} Hảo Cảm)!`, "info");
            }

            updateUI();
        }

        // ====================================================================
        // HÀM 2: SONG TU CÙNG ĐẠO LỮ (DUAL CULTIVATION)
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

            // Tính toán lượng Tu Vi nhận được
            const gainedExp = Math.round((playerState.realmIndex + 1) * comp.expMultiplier * 25000);

            // Cộng thực tế vào Tu Vi người chơi
            if (typeof window.addExp === 'function') {
                window.addExp(gainedExp);
            } else if (window.state) {
                window.state.exp = Number(window.state.exp || 0) + gainedExp;
            }

            // Kiểm tra hiệu quả Cấp 5 của Lãnh Nguyệt: 20% tỷ lệ đột phá bình cảnh
            let breakthroughSuccess = false;
            const currentRank = getAffectionRank(comp.affection);
            if (comp.id === 'companion_2' && currentRank.level >= 5 && Math.random() < 0.20) {
                breakthroughSuccess = true;
                window.breakthroughBonusChance = (Number(window.breakthroughBonusChance || 0) + 0.25);
            }

            // Ghi nhận timestamp hồi chiêu
            playerState.lastDualCultivationTime = Date.now();

            if (typeof window.addLog === 'function') {
                window.addLog(`🌸 <span class="text-pink-300 font-bold">[Âm Dương Song Tu]</span> Cùng đạo lữ <strong>${comp.name}</strong> giao hòa tâm thần, chu thiên tuần hoàn! Thu hoạch <strong>+${gainedExp.toLocaleString('vi-VN')} Tu Vi</strong>!`, 'text-pink-300');
            }

            if (typeof window.updateHUD === 'function') window.updateHUD();
            if (typeof window.saveGameState === 'function') window.saveGameState();

            // Bật hiệu ứng toàn màn hình lãng mạn
            showDualCultivationAnimation(gainedExp, comp, breakthroughSuccess);
            updateUI();
        }

        function resetDualCooldown() {
            playerState.lastDualCultivationTime = 0;
            updateUI();
            showXianxiaToast("✨ Đã xóa thời gian hồi chiêu Song Tu để thử nghiệm!", "success");
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

            if (window.soundSystem?.play) window.soundSystem.play('guzheng');
            else if (typeof window.playSound === 'function') window.playSound('bell');

            // Sinh cánh hoa đào rơi
            generatePetals();
            if (overlay) overlay.classList.add('is-active');
        }

        function closeDualAnimation() {
            document.getElementById('dual-cultivation-overlay').classList.remove('is-active');
            const petals = document.getElementById('petals-canvas');
            petals.innerHTML = '';
        }

        function generatePetals() {
            const container = document.getElementById('petals-canvas');
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
                btnInteract.classList.add('is-active');
                btnCompanions.classList.remove('is-active');
                viewInteract.style.display = 'block';
                viewCompanions.style.display = 'none';
            } else {
                btnInteract.classList.remove('is-active');
                btnCompanions.classList.add('is-active');
                viewInteract.style.display = 'none';
                viewCompanions.style.display = 'block';
            }
        }

        function selectCompanion(compId) {
            const comp = COMPANIONS_DATA.find(c => c.id === compId);
            if (!comp) return;

            if (!comp.unlocked) {
                showXianxiaToast(`🔒 Đạo Lữ Chưa Mở Khóa! Điều kiện: ${comp.unlockCondition}`, "error");
                return;
            }

            playerState.activeCompanionId = compId;
            updateUI();
            switchChamberTab('interact');
        }

        function unlockCompanionTest(compId) {
            const comp = COMPANIONS_DATA.find(c => c.id === compId);
            if (!comp) return;
            comp.unlocked = true;
            if (comp.affection < 500) comp.affection = 500;
            playerState.activeCompanionId = compId;
            showXianxiaToast(`🌸 Đã kết duyên mở khóa Đạo Lữ [${comp.name}] (${comp.title})!`, "success");
            updateUI();
        }

        // ====================================================================
        // CẬP NHẬT GIAO DIỆN TỔNG THỂ (UPDATE UI)
        // ====================================================================
        function updateUI() {
            const comp = getActiveCompanion();
            const rank = getAffectionRank(comp.affection);

            // Cột Trái
            document.getElementById('companion-main-img').src = comp.avatar;
            document.getElementById('companion-quote-bubble').textContent = `"${comp.quote}"`;
            document.getElementById('comp-name-title').textContent = comp.name;
            document.getElementById('comp-sect-title').textContent = `${comp.sect} • ${comp.title}`;
            document.getElementById('comp-affection-rank-badge').textContent = `${rank.title} (Cấp ${rank.level})`;

            // Affection Points & Bar
            document.getElementById('affection-points-text').textContent = `${comp.affection.toLocaleString('vi-VN')} / 5,000`;
            const pct = Math.min(100, Math.round((comp.affection / 5000) * 100));
            document.getElementById('affection-fill').style.width = `${pct}%`;

            // Passive Buffs
            const buffsBox = document.getElementById('companion-buffs-list');
            buffsBox.innerHTML = comp.buffs.map(b => {
                const isUnlocked = rank.level >= b.level;
                return `
                    <div class="buff-tag-item ${isUnlocked ? 'buff--unlocked' : 'buff--locked'}">
                        <span><i class="fa-solid ${isUnlocked ? 'fa-circle-check text-rose-400' : 'fa-lock'} mr-1.5"></i>${b.text}</span>
                        <span class="font-mono text-[10px] font-bold">[Cấp ${b.level}]</span>
                    </div>
                `;
            }).join('');

            // Cột Phải: Quà tặng
            document.getElementById('cnt-tram-cai').textContent = playerState.gifts.gift_tramcai;
            document.getElementById('cnt-luu-ly').textContent = playerState.gifts.gift_luuly;
            document.getElementById('cnt-hoa-lac-tinh').textContent = playerState.gifts.gift_hoalactinh;

            document.getElementById('badge-tram-cai').textContent = `Còn: ${playerState.gifts.gift_tramcai}`;
            document.getElementById('badge-luu-ly').textContent = `Còn: ${playerState.gifts.gift_luuly}`;
            document.getElementById('badge-hoa-lac-tinh').textContent = `Còn: ${playerState.gifts.gift_hoalactinh}`;

            // Cooldown & Nút Song Tu
            const remaining = getDualCooldownRemainingSeconds();
            const btnSongTu = document.getElementById('btn-song-tu');
            const cdStatus = document.getElementById('cooldown-timer-status');
            const rewardPreview = document.getElementById('cultivation-reward-preview');

            const gainedExp = Math.round((playerState.realmIndex + 1) * comp.expMultiplier * 25000);
            rewardPreview.textContent = `Dự kiến nhận: +${gainedExp.toLocaleString('vi-VN')} Tu Vi`;

            if (remaining > 0) {
                btnSongTu.disabled = true;
                const hours = Math.floor(remaining / 3600);
                const mins = Math.floor((remaining % 3600) / 60);
                const secs = remaining % 60;
                btnSongTu.innerHTML = `<i class="fa-regular fa-clock"></i> ĐANG HỒI KHÍ (${hours}h ${mins}m)`;
                cdStatus.textContent = `Hồi chiêu: ${hours}h ${mins}m ${secs}s`;
            } else {
                btnSongTu.disabled = false;
                btnSongTu.innerHTML = `<i class="fa-solid fa-spa"></i> KHỞI ĐỘNG SONG TU`;
                cdStatus.textContent = `Trạng thái: Sẵn sàng`;
            }

            // Danh sách Đạo Lữ (Tab 2)
            const compListContainer = document.getElementById('companion-cards-list');
            compListContainer.innerHTML = COMPANIONS_DATA.map(c => {
                const isSelected = c.id === playerState.activeCompanionId;
                const cRank = getAffectionRank(c.affection);

                if (!c.unlocked) {
                    return `
                        <div class="companion-item-card is-locked-silhouette">
                            <div class="flex items-center gap-3">
                                <img src="${c.avatar}" alt="${c.name}" class="comp-avatar-thumb">
                                <div>
                                    <h4 class="font-bold text-slate-400 text-sm font-serif flex items-center gap-2">
                                        <i class="fa-solid fa-lock text-rose-500"></i> ${c.name}
                                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">[Chưa Mở]</span>
                                    </h4>
                                    <span class="text-xs text-rose-400 font-mono block mt-0.5">Yêu cầu: ${c.unlockCondition}</span>
                                </div>
                            </div>
                            <button type="button" onclick="unlockCompanionTest('${c.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition">
                                Mở (Test)
                            </button>
                        </div>
                    `;
                }

                return `
                    <div class="companion-item-card ${isSelected ? 'is-active-companion' : ''}" onclick="selectCompanion('${c.id}')">
                        <div class="flex items-center gap-3">
                            <img src="${c.avatar}" alt="${c.name}" class="comp-avatar-thumb">
                            <div>
                                <h4 class="font-bold text-slate-100 text-sm font-serif flex items-center gap-2">
                                    ${c.name}
                                    ${isSelected ? '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold font-mono">ĐANG CHỌN</span>' : ''}
                                </h4>
                                <span class="text-xs text-pink-300 font-mono block mt-0.5">${c.sect} • ${c.title}</span>
                                <span class="text-[10px] text-slate-400 block">${cRank.title} (Hảo cảm: ${c.affection}/5000)</span>
                            </div>
                        </div>
                        <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isSelected ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                            ${isSelected ? 'Đã Chọn' : 'Đồng Hành'}
                        </button>
                    </div>
                `;
            }).join('');
        }

        // Khởi động
        window.addEventListener('DOMContentLoaded', () => {
            updateUI();
        });
    

    function openKhuePhongModal() {
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        const el = document.getElementById('modal-khue-phong');
        if (el) {
            el.style.setProperty('display', 'block', 'important');
            el.classList.remove('hidden');
            el.classList.add('active');
            if (typeof updateUI === 'function') updateUI();
        }
    }

    function closeKhuePhongModal() {
        const el = document.getElementById('modal-khue-phong');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
            el.classList.add('hidden');
        }
        if (typeof closeDualAnimation === 'function') closeDualAnimation();
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    window.COMPANIONS_DATA = COMPANIONS_DATA;
    window.openKhuePhongModal = openKhuePhongModal;
    window.closeKhuePhongModal = closeKhuePhongModal;
    window.giveGift = giveGift;
    window.triggerDualCultivation = triggerDualCultivation;
    window.resetDualCooldown = resetDualCooldown;
    window.closeDualAnimation = closeDualAnimation;
    window.switchChamberTab = switchChamberTab;
    window.selectCompanion = selectCompanion;
    window.unlockCompanionTest = unlockCompanionTest;
    window.updateKhuePhongUI = updateUI;

    globalThis.openKhuePhongModal = openKhuePhongModal;
    globalThis.closeKhuePhongModal = closeKhuePhongModal;
    globalThis.triggerDualCultivation = triggerDualCultivation;
    globalThis.giveGift = giveGift;
    globalThis.unlockCompanionTest = unlockCompanionTest;
})();
