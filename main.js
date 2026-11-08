// ==========================================================================
// VẤN THIÊN LỤC — MAIN.JS (MASTER ARCHITECTURE & POP-MENU CONTROLLER)
// Khôi phục kinh mạch, kết nối sự kiện Bottom Menu, Drop-up & Pop-Menu Modals
// ==========================================================================

(function () {
    'use strict';

    /**
     * Đóng toàn bộ các Pop-menu / Modal chức năng để quay về Màn Hình Chính
     */
    function closeAllFeaturePopups() {
        document.querySelectorAll('.feature-popup, .feature-page, .game-page').forEach((el) => {
            el.classList.remove('active', 'flex');
            el.classList.add('hidden');
            el.style.setProperty('display', 'none', 'important');
        });
        if (typeof window.closeAllDropups === 'function') {
            window.closeAllDropups();
        }
    }

    /**
     * Mở bảng Chỉnh Sửa Bản Thể / Đăng Nhập Google (Modal Overlay)
     */
    function openProfileModal() {
        const modal = document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('z-index', '10020', 'important');
        } else {
            console.error("LỖI NẶNG: Không tìm thấy ID 'profile-login-modal' trong HTML!");
        }
    }

    /**
     * Đóng bảng Chỉnh Sửa Bản Thể / Đăng Nhập Google
     */
    function closeProfileModal() {
        const modal = document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
        }
    }

    /**
     * Kích hoạt Pop-menu & Drop-up khi bấm các nút trên Bottom Menu (SPA — Không tải lại trang)
     * @param {string} featureKey - 'nhan-vat' | 'dong-phu' | 'tong-mon' | 'the-gioi' | 'demon-tower'
     * @param {Event} [event]
     */
    function openFeature(featureKey, event) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }

        // Bản đồ ánh xạ từng nút Bottom Menu tới Pop-menu chính và các trang con trong nhóm
        const featureMap = {
            'nhan-vat': {
                defaultPage: 'page-inventory',
                dropupId: 'menu-nhan-vat',
                groupPages: ['page-inventory', 'page-skills', 'page-root', 'page-artifact', 'page-pet'],
                renderFn: () => {
                    if (typeof window.renderCharacterHub === 'function') {
                        window.renderCharacterHub('inventory', document.getElementById('inventory-page-content'));
                    }
                }
            },
            'dong-phu': {
                defaultPage: 'page-linh-dien',
                dropupId: 'menu-dong-phu',
                groupPages: ['page-linh-dien', 'page-dan-cac', 'page-khi-cac', 'page-khue-phong', 'page-tu-linh-tran'],
                renderFn: () => {
                    if (typeof window.updateDongPhuUI === 'function') {
                        window.updateDongPhuUI();
                    }
                }
            },
            'tong-mon': {
                defaultPage: 'page-sect-quests',
                dropupId: 'menu-tong-mon',
                groupPages: ['page-sect-quests', 'page-sect-rank', 'page-sect-shop', 'page-sect-array'],
                renderFn: () => {
                    if (typeof window.renderSectPage === 'function') {
                        window.renderSectPage('quests', document.getElementById('sect-quests-page-content'));
                    }
                }
            },
            'the-gioi': {
                defaultPage: 'page-world-market',
                dropupId: 'menu-the-gioi',
                groupPages: ['page-world-market', 'page-world-auction', 'page-world-dungeon', 'page-world-arena', 'page-world-encounter'],
                renderFn: () => {
                    if (typeof window.renderWorldMarketHub === 'function') {
                        window.renderWorldMarketHub(document.getElementById('world-market-page-content'));
                    }
                }
            },
            'demon-tower': {
                defaultPage: 'modal-tran-yeu-thap',
                dropupId: null,
                groupPages: ['modal-tran-yeu-thap', 'demon-tower-modal'],
                renderFn: () => {
                    openDemonTowerModal();
                }
            }
        };

        // Chuẩn hóa key truyền vào
        let normalizedKey = featureKey;
        if (featureKey === 'character' || featureKey === 'modal-nhan-vat') normalizedKey = 'nhan-vat';
        else if (featureKey === 'cave' || featureKey === 'modal-dong-phu') normalizedKey = 'dong-phu';
        else if (featureKey === 'sect' || featureKey === 'modal-tong-mon') normalizedKey = 'tong-mon';
        else if (featureKey === 'world' || featureKey === 'modal-the-gioi') normalizedKey = 'the-gioi';
        else if (featureKey === 'demon-tower-modal' || featureKey === 'tran-yeu-thap' || featureKey === 'modal-tran-yeu-thap') normalizedKey = 'demon-tower';

        const config = featureMap[normalizedKey];

        if (config) {
            // Kiểm tra xem có Pop-menu nào trong nhóm đang mở không
            const isGroupOpen = config.groupPages.some((id) => {
                const el = document.getElementById(id);
                return (
                    el &&
                    !el.classList.contains('hidden') &&
                    (el.classList.contains('active') ||
                        el.style.display === 'block' ||
                        el.style.display === 'flex')
                );
            });

            // Quy tắc SPA: Nếu đang mở chính nhóm này thì đóng lại về Màn Hình Chính
            if (isGroupOpen) {
                closeAllFeaturePopups();
                return;
            }

            // Đóng toàn bộ Pop-menu khác trước khi mở Pop-menu mới
            closeAllFeaturePopups();

            if (normalizedKey === 'dong-phu') {
                const giaVienEl = document.getElementById('modal-gia-vien');
                if (giaVienEl && giaVienEl.style.display !== 'none' && !giaVienEl.classList.contains('hidden')) {
                    closeGiaVienModal();
                    return;
                }
                openGiaVienModal();
                return;
            }

            if (normalizedKey === 'demon-tower') {
                const towerEl = document.getElementById('modal-tran-yeu-thap') || document.getElementById('demon-tower-modal');
                if (towerEl && towerEl.style.display !== 'none' && !towerEl.classList.contains('hidden')) {
                    closeDemonTowerModal();
                    return;
                }
                openDemonTowerModal();
                return;
            }

            // Gọi switchPage / navigateTo chuẩn và cưỡng chế bật Pop-menu bằng !important
            if (typeof window.switchPage === 'function') {
                window.switchPage(config.defaultPage);
            }
            const targetEl = document.getElementById(config.defaultPage);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                targetEl.classList.add('active');
                targetEl.style.setProperty('display', 'block', 'important');
                targetEl.style.setProperty('z-index', '10000', 'important');
                if (typeof config.renderFn === 'function') {
                    config.renderFn();
                }
            }
            return;
        }

        // Nếu truyền trực tiếp ID của một trang con (ví dụ: 'page-dan-cac', 'page-khi-cac')
        closeAllFeaturePopups();
        if (typeof window.switchPage === 'function') {
            window.switchPage(featureKey);
        }
        const directEl = document.getElementById(featureKey) || document.querySelector(`[data-alias="${featureKey}"]`);
        if (directEl) {
            directEl.classList.remove('hidden');
            directEl.classList.add('active');
            directEl.style.setProperty('display', 'block', 'important');
            directEl.style.setProperty('z-index', '10000', 'important');
        }
    }

    /* ==========================================================================
       HỆ THỐNG ĐỘ KIẾP ĐỈNH CAO (#modal-do-kiep)
       Tái chế UI Tụ Linh Trận 3D từ man_hinh_chinh_idle_demo.html
       ========================================================================== */
    const doKiepState = {
        inProgress: false,
        isStriking: false,
        currentStrike: 0,
        totalStrikes: 3,
        maxShield: 10000,
        currentShield: 10000,
        targetRealm: null,
        strikeTimer: null,
        artifactCooldown: false,
        artifactShieldBonus: 0
    };

    function openDoKiepModal(targetRealm = null) {
        const modal = document.getElementById('modal-do-kiep');
        if (!modal) return;

        // Dọn sạch timer cũ nếu có
        if (doKiepState.strikeTimer) {
            clearTimeout(doKiepState.strikeTimer);
            doKiepState.strikeTimer = null;
        }

        // Lấy thông tin cảnh giới hiện tại và mục tiêu
        const gState = window.state || (typeof state !== 'undefined' ? state : null);
        const realmsArr = window.REALMS || (typeof REALMS !== 'undefined' ? REALMS : []);
        const rIdx = gState?.realmIndex || 0;
        const currentRealm = realmsArr[rIdx] || { name: 'Luyện Khí Kỳ', maxExp: 100 };
        const nextRealm = targetRealm || realmsArr[rIdx + 1] || currentRealm;

        // Cấu hình từ tribConfigs nếu có
        let cfg = null;
        if (typeof window.getTribulationConfig === 'function') {
            cfg = window.getTribulationConfig(nextRealm);
        } else if (typeof getTribulationConfig === 'function') {
            cfg = getTribulationConfig(nextRealm);
        }
        const totalBolts = cfg?.totalBolts || (String(nextRealm?.name || '').includes('Phi Thăng') ? 9 : 3);
        const targetTitle = cfg?.targetName || nextRealm?.name || 'Cảnh Giới Mới';

        // Tính toán lượng Hộ Thể Chân Khí dựa theo chỉ số nhân vật (Khí Huyết + Phòng Ngự)
        const playerHp = Number(gState?.hp || gState?.stats?.hp || 1000);
        const playerDef = Number(gState?.def || gState?.stats?.def || 50);
        const calcShield = Math.max(1000, Math.round(playerHp * 1.5 + playerDef * 15));

        doKiepState.inProgress = true;
        doKiepState.isStriking = false;
        doKiepState.currentStrike = 0;
        doKiepState.totalStrikes = totalBolts;
        doKiepState.maxShield = calcShield;
        doKiepState.currentShield = calcShield;
        doKiepState.targetRealm = nextRealm;
        doKiepState.artifactCooldown = false;
        doKiepState.artifactShieldBonus = 0;

        // Cập nhật DOM
        const titleEl = document.getElementById('trib-target-realm-title');
        if (titleEl) {
            titleEl.textContent = `THIÊN KIẾP ĐỘT PHÁ • ${String(targetTitle).toUpperCase()}`;
        }

        const avatarImg = document.getElementById('tribulation-avatar-img');
        if (avatarImg) {
            avatarImg.src = gState?.avatar || './assets/images/image_11.png';
        }

        const shieldNum = document.getElementById('trib-shield-num');
        if (shieldNum) {
            shieldNum.textContent = `${calcShield.toLocaleString()} / ${calcShield.toLocaleString()}`;
        }

        const shieldBar = document.getElementById('trib-shield-bar');
        if (shieldBar) {
            shieldBar.style.width = '100%';
        }

        const waveBadge = document.getElementById('trib-wave-badge');
        if (waveBadge) {
            waveBadge.textContent = `Đạo Lôi Kiếp: 0 / ${totalBolts}`;
        }

        const stateDesc = document.getElementById('trib-state-desc');
        if (stateDesc) {
            stateDesc.textContent = 'Lôi vân tụ hội, áp lực ngập tràn...';
            stateDesc.style.color = '#cbd5e1';
        }

        const btnStart = document.getElementById('btn-start-dokiep');
        if (btnStart) {
            btnStart.style.display = 'flex';
            btnStart.disabled = false;
        }

        const stage = document.getElementById('trib-lightning-stage');
        if (stage) stage.innerHTML = '';

        // Đóng các modal khác nếu đang mở để giữ trải nghiệm SPA toàn cảnh
        closeAllFeaturePopups();

        // Hiển thị Modal
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('active', 'flex');
    }

    function closeDoKiepModal(isAbandoned = false) {
        if (doKiepState.strikeTimer) {
            clearTimeout(doKiepState.strikeTimer);
            doKiepState.strikeTimer = null;
        }

        if (isAbandoned && doKiepState.inProgress && doKiepState.isStriking) {
            // Hình phạt Tẩu Hỏa Nhập Ma khi bỏ cuộc giữa chừng
            const gState = window.state || (typeof state !== 'undefined' ? state : null);
            if (gState && gState.exp > 0) {
                const penalty = Math.round(gState.exp * 0.15);
                gState.exp = Math.max(0, gState.exp - penalty);
                if (typeof window.addLog === 'function') {
                    window.addLog(`⚠️ <span class="text-rose-400 font-bold">[Tẩu Hỏa Nhập Ma]</span> Giữa chừng bỏ chạy khỏi thiên kiếp! Chân khí tán loạn, tổn thất ${penalty.toLocaleString()} Tu Vi!`, 'text-rose-400');
                }
            }
        }

        doKiepState.inProgress = false;
        doKiepState.isStriking = false;

        const modal = document.getElementById('modal-do-kiep');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active', 'flex');
        }
    }

    // Hiệu ứng giáng sét từ đỉnh màn hình xuống Avatar
    function spawnLightningStrike() {
        const stage = document.getElementById('trib-lightning-stage');
        const modal = document.getElementById('modal-do-kiep');
        const flash = document.getElementById('trib-sky-flash');
        const avatarWrap = document.getElementById('tribulation-avatar-wrap');

        if (!stage || !modal) return;

        // Sinh 2 - 3 tia sét đồng thời
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const bolt = document.createElement('div');
            bolt.className = 'trib-lightning-bolt';
            
            // Tọa độ ngang giáng thẳng xuống Avatar ở giữa màn hình (offset nhẹ)
            const offsetX = (Math.random() - 0.5) * 80;
            bolt.style.left = `calc(50% + ${offsetX}px)`;
            bolt.style.height = '100vh';
            bolt.style.animationDelay = `${i * 0.06}s`;

            if (Math.random() > 0.5) {
                bolt.style.background = 'linear-gradient(180deg, #ffffff 0%, #fde047 30%, #a855f7 70%, #be123c 100%)';
            }

            stage.appendChild(bolt);
            setTimeout(() => {
                bolt.remove();
            }, 600);
        }

        // Lóe sáng toàn màn hình
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 120);
        }

        // Rung lắc Avatar và toàn màn hình
        modal.classList.add('screen-shake-intense');
        setTimeout(() => modal.classList.remove('screen-shake-intense'), 360);

        if (avatarWrap) {
            avatarWrap.style.transform = `translateY(-24px) scale(0.96) rotate(${(Math.random() * 6 - 3).toFixed(1)}deg)`;
            setTimeout(() => {
                avatarWrap.style.transform = '';
            }, 300);
        }

        // Âm thanh sấm sét nếu có
        if (window.soundSystem && typeof window.soundSystem.playThunder === 'function') {
            window.soundSystem.playThunder();
        } else if (typeof window.playSound === 'function') {
            window.playSound('breakthrough');
        }
    }

    // Nút Tế Pháp Bảo
    function defendWithArtifact(event) {
        if (event) event.stopPropagation();

        if (doKiepState.artifactCooldown) {
            if (typeof window.addLog === 'function') {
                window.addLog('🛡️ Pháp bảo đang tích nạp linh khí, chưa thể liên tục tế xuất!', 'text-amber-300');
            }
            return;
        }

        doKiepState.artifactCooldown = true;
        doKiepState.artifactShieldBonus = 0.5; // Giảm 50% sát thương đòn sét kế

        // Hồi phục 18% Hộ Thể Chân Khí
        const heal = Math.round(doKiepState.maxShield * 0.18);
        doKiepState.currentShield = Math.min(doKiepState.maxShield, doKiepState.currentShield + heal);

        // Cập nhật UI
        const shieldNum = document.getElementById('trib-shield-num');
        const shieldBar = document.getElementById('trib-shield-bar');
        if (shieldNum) {
            shieldNum.textContent = `${doKiepState.currentShield.toLocaleString()} / ${doKiepState.maxShield.toLocaleString()}`;
        }
        if (shieldBar) {
            const pct = Math.max(0, Math.min(100, (doKiepState.currentShield / doKiepState.maxShield) * 100));
            shieldBar.style.width = `${pct}%`;
        }

        // Thông báo bay lên
        spawnFloatingDamage(`+${heal.toLocaleString()} Chân Khí!`, true);

        const btn = document.getElementById('btn-te-phap-bao');
        if (btn) {
            btn.style.opacity = '0.6';
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>PHÁP BẢO ĐANG HỘ THỂ...</span>';
        }

        setTimeout(() => {
            doKiepState.artifactCooldown = false;
            if (btn) {
                btn.style.opacity = '1';
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2 text-amber-300"></i><span>TẾ PHÁP BẢO CHỐNG ĐỠ LÔI KIẾP</span>';
            }
        }, 4000);
    }

    // Bắt đầu chuỗi sét đánh
    function startDoKiepStrikes() {
        if (!doKiepState.inProgress || doKiepState.isStriking) return;
        doKiepState.isStriking = true;

        const btnStart = document.getElementById('btn-start-dokiep');
        if (btnStart) btnStart.style.display = 'none';

        const stateDesc = document.getElementById('trib-state-desc');
        if (stateDesc) {
            stateDesc.textContent = '⚡ Thiên uy cuồng bạo, lôi kiếp bắt đầu giáng hạ!';
            stateDesc.style.color = '#f43f5e';
        }

        executeNextStrike();
    }

    function executeNextStrike() {
        if (!doKiepState.inProgress) return;

        doKiepState.currentStrike++;
        const cur = doKiepState.currentStrike;
        const total = doKiepState.totalStrikes;

        // Cập nhật huy hiệu đợt sét
        const waveBadge = document.getElementById('trib-wave-badge');
        if (waveBadge) {
            waveBadge.textContent = `Đạo Lôi Kiếp: ${cur} / ${total}`;
        }

        // Tạo hiệu ứng tia sét giáng xuống
        spawnLightningStrike();

        // Tính sát thương của đạo lôi kiếp này
        let strikeDamage = Math.round((doKiepState.maxShield / total) * (0.65 + cur * 0.15));
        if (doKiepState.artifactShieldBonus > 0) {
            strikeDamage = Math.round(strikeDamage * (1 - doKiepState.artifactShieldBonus));
            doKiepState.artifactShieldBonus = 0; // Đã tiêu hao khiên giảm thương
        }

        // Trừ máu Chân Khí
        doKiepState.currentShield = Math.max(0, doKiepState.currentShield - strikeDamage);

        // Cập nhật thanh máu và số
        const shieldNum = document.getElementById('trib-shield-num');
        const shieldBar = document.getElementById('trib-shield-bar');
        if (shieldNum) {
            shieldNum.textContent = `${doKiepState.currentShield.toLocaleString()} / ${doKiepState.maxShield.toLocaleString()}`;
        }
        if (shieldBar) {
            const pct = Math.max(0, Math.min(100, (doKiepState.currentShield / doKiepState.maxShield) * 100));
            shieldBar.style.width = `${pct}%`;
        }

        // Nổi sát thương
        spawnFloatingDamage(`-${strikeDamage.toLocaleString()} HP`);

        // Kiểm tra sống chết
        if (doKiepState.currentShield <= 0) {
            // Thất bại
            const stateDesc = document.getElementById('trib-state-desc');
            if (stateDesc) {
                stateDesc.textContent = '💀 Chân khí vỡ vụn, đạo cơ chấn động!';
                stateDesc.style.color = '#ef4444';
            }

            doKiepState.strikeTimer = setTimeout(() => {
                closeDoKiepModal();
                if (typeof openBreakthroughFailureModal === 'function') {
                    openBreakthroughFailureModal();
                } else if (typeof window.openBreakthroughFailureModal === 'function') {
                    window.openBreakthroughFailureModal();
                }
            }, 1200);
            return;
        }

        if (cur >= total) {
            // Thành công viên mãn!
            const stateDesc = document.getElementById('trib-state-desc');
            if (stateDesc) {
                stateDesc.textContent = '🎉 Độ kiếp thành công! Kim quang tẩy tủy, tiến nhập tân cảnh!';
                stateDesc.style.color = '#34d399';
            }

            doKiepState.strikeTimer = setTimeout(() => {
                closeDoKiepModal();
                // Thực thi đột phá thành công
                if (typeof levelUpMajorRealm === 'function') {
                    levelUpMajorRealm();
                } else if (typeof openMajorBreakthroughModal === 'function') {
                    openMajorBreakthroughModal();
                } else if (typeof window.openMajorBreakthroughModal === 'function') {
                    window.openMajorBreakthroughModal();
                }
            }, 1400);
            return;
        }

        // Đạo kế tiếp sau 2.2 giây
        doKiepState.strikeTimer = setTimeout(() => {
            executeNextStrike();
        }, 2200);
    }

    function spawnFloatingDamage(text, isHeal = false) {
        const anchor = document.getElementById('trib-damage-anchor');
        if (!anchor) return;

        const floatEl = document.createElement('div');
        floatEl.className = 'trib-float-damage';
        floatEl.textContent = text;
        if (isHeal) {
            floatEl.style.color = '#34d399';
            floatEl.style.textShadow = '0 0 15px rgba(52, 211, 153, 0.9)';
        }

        const offsetX = (Math.random() - 0.5) * 50;
        floatEl.style.left = `calc(50% + ${offsetX}px)`;

        anchor.appendChild(floatEl);
        setTimeout(() => {
            floatEl.remove();
        }, 1400);
    }

    /* ==========================================================================
       HỆ THỐNG TIÊN MÔN GIA VIÊN • ĐỘNG PHỦ (#modal-gia-vien)
       Module khép kín chuẩn SPA theo chỉ thị Bản Tôn
       ========================================================================== */
    const ESTATE_NODES = [
        {
            id: "node_spirit_tree",
            name: "Linh Căn Mộc",
            subTitle: "Tụ Linh Trận",
            icon: "fa-solid fa-tree",
            theme: "tuvi",
            level: 1,
            baseProductionRate: 120, // 120 Tu Vi / phút (= 2 Tu Vi / giây)
            capacity: 500,
            currentAmount: 180,
            resourceType: "tuvi",
            resourceName: "Tu Vi",
            resourceUnit: "điểm",
            upgradeBaseCost: 1500,
            assignedCompanionId: "companion_1", // Mặc định Liễu Như Yên cai quản
            description: "Hấp thu thiên địa thanh khí ngưng đọng thành nguyên khí tu vi thuần khiết."
        },
        {
            id: "node_herb_spring",
            name: "Dược Tuyền",
            subTitle: "Suối Linh Dịch",
            icon: "fa-solid fa-faucet-drip",
            theme: "herb",
            level: 1,
            baseProductionRate: 6, // 6 Linh Thảo / phút
            capacity: 40,
            currentAmount: 12,
            resourceType: "herb",
            resourceName: "Linh Thảo",
            resourceUnit: "bó",
            upgradeBaseCost: 1200,
            assignedCompanionId: null,
            description: "Mạch ngầm tụ dưỡng ngọc lộ linh tuyền, giúp dược thảo phát triển thần tốc."
        },
        {
            id: "node_mineral_cavern",
            name: "Khoáng Động",
            subTitle: "Địa Mạch Thần Khoáng",
            icon: "fa-solid fa-mountain",
            theme: "ore",
            level: 1,
            baseProductionRate: 6, // 6 Khoáng Thạch / phút
            capacity: 40,
            currentAmount: 8,
            resourceType: "ore",
            resourceName: "Khoáng Thạch",
            resourceUnit: "khối",
            upgradeBaseCost: 1200,
            assignedCompanionId: null,
            description: "Địa mạch cửu u kết tụ huyền thiết thạch anh, nguyên liệu cốt lõi rèn pháp khí."
        },
        {
            id: "node_money_treasury",
            name: "Tiền Trang",
            subTitle: "Tụ Tài Trận",
            icon: "fa-solid fa-vault",
            theme: "gold",
            level: 1,
            baseProductionRate: 60, // 60 Linh Thạch / phút
            capacity: 600,
            currentAmount: 240,
            resourceType: "gold",
            resourceName: "Linh Thạch",
            resourceUnit: "viên",
            upgradeBaseCost: 2000,
            assignedCompanionId: null,
            description: "Vận chuyển thiên địa bảo khí quy tụ bốn phương tài lộc về Động Phủ."
        }
    ];

    const COMPANIONS_LIST = [
        {
            id: "companion_1",
            name: "Liễu Như Yên",
            title: "Tiểu Sư Muội",
            avatar: "./assets/images/nu_tu_trong_suot.png",
            affectionLevel: 5, // Cấp 5 -> Tự động thu thập khi đầy bồn!
            bonusDesc: "+50% Tốc độ & Tự động thu thập khi đầy bồn"
        },
        {
            id: "companion_2",
            name: "Lãnh Nguyệt",
            title: "Ma Tông Thánh Nữ",
            avatar: "./assets/images/avatar_heart_demon.jpg",
            affectionLevel: 2,
            bonusDesc: "+50% Tốc độ sản xuất tài nguyên"
        },
        {
            id: "companion_3",
            name: "Hồ Mị Nhi",
            title: "Yêu Tộc Công Chúa",
            avatar: "./assets/images/pet_fox.jpg",
            affectionLevel: 3,
            bonusDesc: "+50% Tốc độ sản xuất tài nguyên"
        }
    ];

    // State người chơi đồng bộ với window.state
    const playerState = {
        _linhThach: 25000,
        _tuVi: 128500,
        herbs: 14,
        ores: 8,
        get linhThach() {
            if (window.state && typeof window.state.stones !== 'undefined') return window.state.stones;
            return this._linhThach;
        },
        set linhThach(val) {
            this._linhThach = val;
            if (window.state) {
                window.state.stones = val;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        },
        get tuVi() {
            if (window.state && typeof window.state.exp !== 'undefined') return window.state.exp;
            return this._tuVi;
        },
        set tuVi(val) {
            this._tuVi = val;
            if (window.state) {
                window.state.exp = val;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        }
    };

    let currentActiveDispatchNodeId = null;
    let estateIdleTimer = null;

    // VÒNG LẶP IDLE SẢN XUẤT (Chạy ngầm an toàn, không sinh nhiều timer)
    function runIdleProductionTick() {
        let hasAnyFull = false;

        const lieuNhuYen = COMPANIONS_LIST.find(c => c.id === 'companion_1');
        const hasAutoClaimPerk = lieuNhuYen && lieuNhuYen.affectionLevel >= 5;

        ESTATE_NODES.forEach(node => {
            const hasCompanion = Boolean(node.assignedCompanionId);
            const multiplier = hasCompanion ? 1.5 : 1.0;
            const ratePerSecond = (node.baseProductionRate / 60) * multiplier;

            if (node.currentAmount < node.capacity) {
                node.currentAmount = Math.min(node.capacity, node.currentAmount + ratePerSecond);
            }

            if (node.currentAmount >= node.capacity) {
                hasAnyFull = true;
            }
        });

        // Tự động thu thập nếu Liễu Như Yên đạt Cấp 5
        if (hasAutoClaimPerk && hasAnyFull) {
            claimAllEstateResources(true);
        }

        // Chỉ cập nhật DOM giao diện nếu Modal Gia Viên đang mở để tối ưu hiệu năng
        const modal = document.getElementById('modal-gia-vien');
        if (modal && modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
            updateEstateUI();
        }
    }

    function initEstateIdleLoop() {
        if (estateIdleTimer) clearInterval(estateIdleTimer);
        estateIdleTimer = setInterval(runIdleProductionTick, 1000);
    }

    function getUpgradeCost(node) {
        return Math.round(node.upgradeBaseCost * Math.pow(1.65, node.level - 1));
    }

    function upgradeNode(nodeId) {
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const cost = getUpgradeCost(node);
        if (playerState.linhThach < cost) {
            showEstateToast(`⚠️ Không đủ Linh Thạch! Cần ${cost.toLocaleString()} Linh Thạch để nâng cấp.`);
            return;
        }

        playerState.linhThach -= cost;
        node.level += 1;
        node.baseProductionRate = Math.round(node.baseProductionRate * 1.45);
        node.capacity = Math.round(node.capacity * 1.5);

        showEstateToast(`✨ Chúc mừng! Đã nâng cấp [${node.name}] lên Cấp ${node.level}!`);
        updateEstateUI();
    }

    function addResourceToPlayer(type, amount) {
        switch (type) {
            case 'tuvi':
                playerState.tuVi += amount;
                break;
            case 'herb':
                playerState.herbs += amount;
                break;
            case 'ore':
                playerState.ores += amount;
                break;
            case 'gold':
                playerState.linhThach += amount;
                break;
        }
    }

    function claimSingleNode(nodeId) {
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const amountToClaim = Math.floor(node.currentAmount);
        if (amountToClaim <= 0) {
            showEstateToast(`Bồn chứa [${node.name}] chưa có đủ tài nguyên để thu thập!`);
            return;
        }

        addResourceToPlayer(node.resourceType, amountToClaim);
        node.currentAmount -= amountToClaim;

        showEstateToast(`💎 Đã thu nạp +${amountToClaim.toLocaleString()} ${node.resourceName}!`);
        updateEstateUI();
    }

    function claimAllEstateResources(isAuto = false) {
        let totalClaimed = 0;
        const summary = [];

        ESTATE_NODES.forEach(node => {
            const amount = Math.floor(node.currentAmount);
            if (amount > 0) {
                addResourceToPlayer(node.resourceType, amount);
                node.currentAmount -= amount;
                totalClaimed += amount;
                summary.push(`+${amount.toLocaleString()} ${node.resourceName}`);
            }
        });

        if (totalClaimed <= 0) {
            if (!isAuto) showEstateToast(`Không có tài nguyên nào tích lũy để thu thập!`);
            return;
        }

        if (isAuto) {
            showEstateToast(`🌸 [Liễu Như Yên Tự Động Thu Hoạch]: ${summary.join(', ')}!`);
        } else {
            showEstateToast(`✨ Thu thập tất cả thành công: ${summary.join(', ')}!`);
        }

        updateEstateUI();
    }

    // Modal Phái cử Đạo Lữ
    function openDispatchModal(nodeId) {
        currentActiveDispatchNodeId = nodeId;
        const node = ESTATE_NODES.find(n => n.id === nodeId);
        if (!node) return;

        const titleEl = document.getElementById('dispatch-modal-title');
        if (titleEl) {
            titleEl.innerHTML = `<i class="fa-solid fa-user-shield text-amber-300"></i> Phái Cử: ${node.name}`;
        }

        const listContainer = document.getElementById('dispatch-companions-list');
        if (listContainer) {
            listContainer.innerHTML = COMPANIONS_LIST.map(comp => {
                const assignedNode = ESTATE_NODES.find(n => n.assignedCompanionId === comp.id);
                const isCurrentNode = node.assignedCompanionId === comp.id;

                return `
                    <div class="companion-select-item ${isCurrentNode ? 'is-selected' : ''}" onclick="assignCompanionToNode('${comp.id}')">
                        <div class="flex items-center gap-3">
                            <img src="${comp.avatar}" class="w-10 h-10 rounded-lg object-cover border border-pink-400" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">
                            <div>
                                <h4 class="font-bold text-xs text-slate-100 flex items-center gap-2">
                                    ${comp.name}
                                    ${isCurrentNode ? '<span class="text-[10px] text-amber-300 font-mono">[Đang Cai Quản]</span>' : ''}
                                </h4>
                                <span class="text-[11px] text-pink-300">${comp.title} • Hảo Cảm Cấp ${comp.affectionLevel}</span>
                                <span class="text-[10px] text-emerald-400 block">${comp.bonusDesc}</span>
                            </div>
                        </div>
                        <button type="button" class="px-3 py-1 rounded bg-sky-900/60 text-sky-200 border border-sky-500/40 text-xs font-bold cursor-pointer">
                            ${isCurrentNode ? 'Giữ Nguyên' : (assignedNode ? 'Chuyển Sang' : 'Bổ Nhiệm')}
                        </button>
                    </div>
                `;
            }).join('');
        }

        const dispatchModal = document.getElementById('dispatch-modal');
        if (dispatchModal) dispatchModal.classList.add('is-open');
    }

    function closeDispatchModal(e) {
        if (e && e.target && e.target !== document.getElementById('dispatch-modal')) return;
        const dispatchModal = document.getElementById('dispatch-modal');
        if (dispatchModal) dispatchModal.classList.remove('is-open');
    }

    function assignCompanionToNode(companionId) {
        if (!currentActiveDispatchNodeId) return;

        ESTATE_NODES.forEach(n => {
            if (n.assignedCompanionId === companionId) {
                n.assignedCompanionId = null;
            }
        });

        const node = ESTATE_NODES.find(n => n.id === currentActiveDispatchNodeId);
        if (node) {
            node.assignedCompanionId = companionId;
            const comp = COMPANIONS_LIST.find(c => c.id === companionId);
            showEstateToast(`👤 Đã bổ nhiệm [${comp?.name || 'Đạo Lữ'}] cai quản [${node.name}] (+50% tốc độ)!`);
        }

        closeDispatchModal();
        updateEstateUI();
    }

    function unassignCompanionFromActiveNode() {
        if (!currentActiveDispatchNodeId) return;
        const node = ESTATE_NODES.find(n => n.id === currentActiveDispatchNodeId);
        if (node) {
            node.assignedCompanionId = null;
            showEstateToast(`Đã thu hồi lệnh cai quản tại [${node.name}].`);
        }
        closeDispatchModal();
        updateEstateUI();
    }

    function updateEstateUI() {
        const linhThachEl = document.getElementById('player-linh-thach');
        const tuViEl = document.getElementById('player-tu-vi');
        const herbsEl = document.getElementById('player-herbs');
        const oresEl = document.getElementById('player-ores');

        if (linhThachEl) linhThachEl.textContent = playerState.linhThach.toLocaleString();
        if (tuViEl) tuViEl.textContent = playerState.tuVi.toLocaleString();
        if (herbsEl) herbsEl.textContent = playerState.herbs.toLocaleString();
        if (oresEl) oresEl.textContent = playerState.ores.toLocaleString();

        const lieuNhuYen = COMPANIONS_LIST.find(c => c.id === 'companion_1');
        const autoInd = document.getElementById('auto-claim-indicator');
        const autoText = document.getElementById('auto-claim-text');
        if (autoInd && autoText) {
            if (lieuNhuYen && lieuNhuYen.affectionLevel >= 5) {
                autoInd.classList.remove('is-disabled');
                autoText.innerHTML = `🌸 <b>Liễu Như Yên:</b> Đang tự động thu thập khi đầy bồn`;
            } else {
                autoInd.classList.add('is-disabled');
                autoText.textContent = `Liễu Như Yên: Cần Hảo Cảm Cấp 5 để mở Auto`;
            }
        }

        const container = document.getElementById('estate-nodes-container');
        if (!container) return;

        let totalPending = 0;

        container.innerHTML = ESTATE_NODES.map(node => {
            const isFull = node.currentAmount >= node.capacity;
            const pct = Math.min(100, Math.round((node.currentAmount / node.capacity) * 100));
            const upgradeCost = getUpgradeCost(node);
            const canUpgrade = playerState.linhThach >= upgradeCost;
            const canClaim = Math.floor(node.currentAmount) > 0;
            totalPending += Math.floor(node.currentAmount);

            const assignedComp = COMPANIONS_LIST.find(c => c.id === node.assignedCompanionId);
            const hasCompanion = Boolean(assignedComp);
            const multiplier = hasCompanion ? 1.5 : 1.0;
            const effectiveRate = Math.round(node.baseProductionRate * multiplier);

            return `
                <article class="node-card ${isFull ? 'is-full' : ''}">
                    <div class="node-card-header">
                        <div class="node-meta">
                            <div class="node-icon-frame node-icon-frame--${node.theme}">
                                <i class="${node.icon}"></i>
                            </div>
                            <div class="node-title-group">
                                <h3>${node.name}</h3>
                                <span>${node.subTitle}</span>
                            </div>
                        </div>
                        <span class="node-level-badge">Cấp ${node.level}</span>
                    </div>

                    <div class="node-card-body">
                        <div class="storage-status-block">
                            <div class="storage-header">
                                <span class="storage-label">
                                    <i class="fa-solid fa-box-archive"></i> Bồn Chứa:
                                </span>
                                <span class="storage-numbers ${isFull ? 'is-maxed' : ''}">
                                    ${Math.floor(node.currentAmount).toLocaleString()} / ${node.capacity.toLocaleString()} ${node.resourceUnit}
                                    ${isFull ? '(ĐẦY)' : ''}
                                </span>
                            </div>
                            <div class="storage-track">
                                <div class="storage-fill storage-fill--${node.theme} ${isFull ? 'is-maxed' : ''}" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <div class="rate-and-dispatch-row">
                            <div class="production-rate-info">
                                <span class="rate-title">Sản lượng:</span>
                                <span class="rate-value">
                                    +${effectiveRate} / phút
                                    ${hasCompanion ? '<span class="rate-bonus-tag">+50%</span>' : ''}
                                </span>
                            </div>

                            <div class="dispatch-slot-box" onclick="openDispatchModal('${node.id}')" title="Bấm để cử Đạo Lữ tọa trấn">
                                ${hasCompanion 
                                    ? `<img src="${assignedComp.avatar}" alt="${assignedComp.name}" class="dispatch-avatar" onerror="this.src='./assets/images/nu_tu_trong_suot.png'">`
                                    : `<div class="dispatch-placeholder"><i class="fa-solid fa-plus"></i></div>`
                                }
                                <div class="dispatch-label-col">
                                    <span>Phái cử</span>
                                    <span>${hasCompanion ? assignedComp.name : 'Trống (+50%)'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="node-card-footer">
                        <button type="button" class="btn-node-action btn-claim cursor-pointer" ${canClaim ? '' : 'disabled'} onclick="claimSingleNode('${node.id}')">
                            <i class="fa-solid fa-hand-holding"></i> Thu Nạp
                        </button>
                        <button type="button" class="btn-node-action btn-upgrade cursor-pointer" ${canUpgrade ? '' : 'disabled'} onclick="upgradeNode('${node.id}')" title="Cần ${upgradeCost.toLocaleString()} Linh Thạch">
                            <i class="fa-solid fa-arrow-up-right-dots"></i> Cấp ${node.level + 1} (${upgradeCost.toLocaleString()})
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        const totalPendingEl = document.getElementById('total-pending-count');
        const btnClaimAll = document.getElementById('btn-claim-all');
        if (totalPendingEl) totalPendingEl.textContent = `${totalPending.toLocaleString()} món tài nguyên`;
        if (btnClaimAll) btnClaimAll.disabled = totalPending <= 0;
    }

    let toastTimer = null;
    function showEstateToast(msg) {
        const toast = document.getElementById('estate-toast-bubble') || document.getElementById('toast-bubble');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('is-active');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('is-active');
        }, 2600);
    }

    function openGiaVienModal() {
        closeAllFeaturePopups();
        const modal = document.getElementById('modal-gia-vien');
        if (modal) {
            modal.style.setProperty('display', 'block', 'important');
            modal.classList.remove('hidden');
            modal.classList.add('active');
            updateEstateUI();
        }
    }

    function closeGiaVienModal() {
        const modal = document.getElementById('modal-gia-vien');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    }

    
    // ========================================================================
    // 8. HỆ THỐNG TRẤN YÊU THÁP • AUTO-BATTLER SPA (DEMON SUPPRESSION TOWER)
    // Tích hợp từ tran_yeu_thap_sprite_battler_demo.html sang chuẩn SPA độc lập
    // ========================================================================

    const towerPlayer = {
        name: "Tiêu Dao Tử",
        maxHp: 150000,
        hp: 150000,
        atk: 22000,
        def: 9500,
        critRate: 0.28,      // 28% Bạo kích
        critMultiplier: 2.2, // x2.2 sát thương bạo kích
        dodgeRate: 0.15,     // 15% Né tránh
        cp: 520000,
        _stones: 18500,
        _tuvi: 96000,
        get stones() {
            if (window.state && typeof window.state.stones !== 'undefined') return window.state.stones;
            return this._stones;
        },
        set stones(v) {
            this._stones = v;
            if (window.state) {
                window.state.stones = v;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        },
        get tuvi() {
            if (window.state && typeof window.state.exp !== 'undefined') return window.state.exp;
            return this._tuvi;
        },
        set tuvi(v) {
            this._tuvi = v;
            if (window.state) {
                window.state.exp = v;
                if (typeof window.updateHUD === 'function') window.updateHUD();
            }
        },
        equippedSkill: {
            name: "Hỏa Cầu Thuật",
            triggerChance: 0.25,  // 25% tỷ lệ tung chiêu
            damageMultiplier: 2.3 // x2.3 sát thương chiêu thức
        }
    };

    let towerCurrentFloor = 20;
    let isCombatActive = false;
    let combatTimer = null;
    let isAutoClimbOn = false;

    function createFloorBoss(floor) {
        const baseHp = 30000 + (floor * 3500);
        const baseAtk = 3000 + (floor * 300);
        const baseDef = 1800 + (floor * 200);
        const cp = Math.round((baseAtk * 2) + (baseDef * 1.5) + (baseHp * 0.1));

        return {
            floor: floor,
            name: `Huyết Dực Bọ Hung (Tầng ${floor})`,
            maxHp: baseHp,
            hp: baseHp,
            atk: baseAtk,
            def: baseDef,
            critRate: 0.10,
            critMultiplier: 1.5,
            dodgeRate: 0.06,
            cp: cp,
            rewardStones: floor * 12,
            rewardTuvi: floor * 40
        };
    }

    let towerCurrentBoss = createFloorBoss(towerCurrentFloor);

    function syncTowerPlayerStats() {
        if (window.state) {
            if (window.state.characterName) towerPlayer.name = window.state.characterName;
            if (window.state.combatPower) {
                towerPlayer.cp = Math.max(towerPlayer.cp, window.state.combatPower);
                towerPlayer.atk = Math.round(towerPlayer.cp * 0.05);
                towerPlayer.def = Math.round(towerPlayer.cp * 0.025);
            }
        }
        const nameEl = document.getElementById('player-fighter-name');
        if (nameEl) nameEl.textContent = towerPlayer.name;
    }

    function openDemonTowerModal() {
        closeAllFeaturePopups();
        const el = document.getElementById('modal-tran-yeu-thap');
        if (el) {
            el.classList.remove('hidden');
            el.classList.add('active');
            el.style.setProperty('display', 'block', 'important');
            el.scrollTop = 0;
        }
        syncTowerPlayerStats();
        updateArenaUI();
    }

    function closeDemonTowerModal() {
        const el = document.getElementById('modal-tran-yeu-thap');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.add('hidden');
            el.classList.remove('active');
        }
        if (combatTimer) {
            clearInterval(combatTimer);
            combatTimer = null;
        }
        isCombatActive = false;
        const btn = document.getElementById('btn-challenge');
        if (btn) btn.disabled = false;
        const btnLabel = document.getElementById('btn-challenge-label');
        if (btnLabel) btnLabel.textContent = `KHIÊU CHIẾN TẦNG ${towerCurrentFloor}`;
    }

    function handleChallengeClick() {
        if (isCombatActive) return;
        if (towerPlayer.hp <= 0) {
            alert("⚠️ Đạo hữu đang trọng thương! Hãy bấm 'Vận Công Hồi Khí' trước.");
            return;
        }

        if (isAutoClimbOn) {
            runAutoClimbFast();
        } else {
            startTowerCombat(towerPlayer, towerCurrentBoss);
        }
    }

    function startTowerCombat(playerFighter, bossFighter) {
        isCombatActive = true;
        const btnChallenge = document.getElementById('btn-challenge');
        if (btnChallenge) btnChallenge.disabled = true;
        const label = document.getElementById('btn-challenge-label');
        if (label) label.textContent = "ĐANG TRẢM MA...";

        bossFighter.hp = bossFighter.maxHp;
        updateHPDisplays();

        const scrollBox = document.getElementById('combat-log-scroll');
        if (scrollBox) scrollBox.innerHTML = '';
        appendLog(`⚔️ <b>Trận chiến Tầng ${bossFighter.floor} khai hỏa!</b>`, 'log-entry--round');

        let turn = 1;
        const maxTurns = 50;

        if (combatTimer) clearInterval(combatTimer);
        combatTimer = setInterval(() => {
            if (turn > maxTurns || playerFighter.hp <= 0 || bossFighter.hp <= 0) {
                finishCombat(playerFighter, bossFighter);
                return;
            }

            appendLog(`--- [Hiệp ${turn}] ---`, 'log-entry--round');

            // 1. Người chơi tấn công: Sprite lao lên trước (Dash)
            triggerAttackDash('player');
            setTimeout(() => {
                executeStrike(playerFighter, bossFighter, true);

                if (bossFighter.hp <= 0) {
                    finishCombat(playerFighter, bossFighter);
                    return;
                }

                // 2. Boss phản công sau 0.45s: Sprite Boss lao sang trái (Dash)
                setTimeout(() => {
                    if (bossFighter.hp > 0 && playerFighter.hp > 0) {
                        triggerAttackDash('boss');
                        setTimeout(() => {
                            executeStrike(bossFighter, playerFighter, false);
                            if (playerFighter.hp <= 0) {
                                finishCombat(playerFighter, bossFighter);
                            }
                        }, 220);
                    }
                }, 450);

            }, 220);

            turn++;
        }, 1250);
    }

    function executeStrike(attacker, defender, isPlayer) {
        // Check Né Tránh
        if (Math.random() < defender.dodgeRate) {
            appendLog(`💨 [Né Tránh] ${defender.name} nhanh như chớp né tránh công kích!`, 'log-entry--dodge');
            triggerFloatingDamage('Né Tránh!', 'damage-number-pop--dodge', isPlayer ? 'boss' : 'player');
            return;
        }

        // Check Kỹ Năng / Vũ Kỹ
        let skillMultiplier = 1.0;
        if (isPlayer && attacker.equippedSkill) {
            if (Math.random() < attacker.equippedSkill.triggerChance) {
                skillMultiplier = attacker.equippedSkill.damageMultiplier;
                appendLog(`🔥 [Vũ Kỹ] ${attacker.name} kết ấn thi triển <b>[${attacker.equippedSkill.name}]</b>!`, 'log-entry--skill');
                triggerFloatingDamage(`Vũ Kỹ: ${attacker.equippedSkill.name}!`, 'damage-number-pop--skill', 'boss');
            }
        }

        // Tính sát thương
        const baseDmg = Math.max(120, (attacker.atk - defender.def)) * skillMultiplier;
        const isCrit = Math.random() < attacker.critRate;
        const finalDmg = Math.round(baseDmg * (isCrit ? attacker.critMultiplier : 1.0));

        // Trừ HP & Cập nhật thanh máu động
        defender.hp = Math.max(0, defender.hp - finalDmg);
        updateHPDisplays();

        // Hiệu ứng Sprite chớp đỏ mờ & rung nhẹ
        triggerSpriteHurt(isPlayer ? 'boss' : 'player');

        // Floating Damage Number
        if (isCrit) {
            triggerFloatingDamage(`CRIT! -${finalDmg.toLocaleString()}`, 'damage-number-pop--crit', isPlayer ? 'boss' : 'player');
            appendLog(`💥 [Bạo Kích] ${attacker.name} đánh trúng tử huyệt, bạo kích <b>${finalDmg.toLocaleString()}</b> sát thương!`, 'log-entry--crit');
        } else {
            triggerFloatingDamage(`-${finalDmg.toLocaleString()}`, 'damage-number-pop--normal', isPlayer ? 'boss' : 'player');
            appendLog(`⚔️ ${attacker.name} đánh ra một kích, gây <b>${finalDmg.toLocaleString()}</b> sát thương.`, isPlayer ? 'log-entry--player' : 'log-entry--boss');
        }
    }

    function finishCombat(playerObj, bossObj) {
        clearInterval(combatTimer);
        combatTimer = null;
        isCombatActive = false;
        const btnChallenge = document.getElementById('btn-challenge');
        if (btnChallenge) btnChallenge.disabled = false;
        const label = document.getElementById('btn-challenge-label');
        if (label) label.textContent = `KHIÊU CHIẾN TẦNG ${towerCurrentFloor}`;

        if (bossObj.hp <= 0) {
            // CHIẾN THẮNG
            playerObj.stones += bossObj.rewardStones;
            playerObj.tuvi += bossObj.rewardTuvi;
            appendLog(`🎉 <b>CHIẾN THẮNG TẦNG ${bossObj.floor}!</b> Thu hoạch +${bossObj.rewardStones.toLocaleString()} Linh Thạch, +${bossObj.rewardTuvi.toLocaleString()} Tu Vi!`, 'log-entry--win');

            towerCurrentFloor++;
            towerCurrentBoss = createFloorBoss(towerCurrentFloor);
            updateArenaUI();
            alert(`🎉 CHIẾN THẮNG TẦNG ${bossObj.floor}!\nTrảm sát yêu ma thành công!\nPhần thưởng: +${bossObj.rewardStones.toLocaleString()} Linh Thạch, +${bossObj.rewardTuvi.toLocaleString()} Tu Vi.\nTự động mở Tầng ${towerCurrentFloor}!`);
        } else {
            // THẤT BẠI
            appendLog(`🩸 <b>THẤT BẠI!</b> [${playerObj.name}] trọng thương, bị khí tức Trấn Yêu Tháp đẩy lùi!`, 'log-entry--lose');
            alert(`🩸 THẤT BẠI!\nĐạo hữu đã bị đánh trọng thương tháo chạy.`);
        }
    }

    function triggerAttackDash(target) {
        const img = document.getElementById(target === 'player' ? 'player-sprite-img' : 'boss-sprite-img');
        if (!img) return;
        const animClass = target === 'player' ? 'player-attack-dash' : 'boss-attack-dash';
        img.classList.add(animClass);
        setTimeout(() => img.classList.remove(animClass), 460);
    }

    function triggerSpriteHurt(target) {
        const img = document.getElementById(target === 'player' ? 'player-sprite-img' : 'boss-sprite-img');
        if (!img) return;
        img.classList.add('sprite-hurt-flash');
        setTimeout(() => img.classList.remove('sprite-hurt-flash'), 360);
    }

    function triggerFloatingDamage(text, cssClass, target) {
        const anchor = document.getElementById(target === 'player' ? 'player-damage-anchor' : 'boss-damage-anchor');
        if (!anchor) return;
        const pop = document.createElement('div');
        pop.className = `damage-number-pop ${cssClass}`;
        pop.textContent = text;
        anchor.appendChild(pop);
        setTimeout(() => pop.remove(), 1200);
    }

    function appendLog(html, className) {
        const scroll = document.getElementById('combat-log-scroll');
        if (!scroll) return;
        const div = document.createElement('div');
        div.className = `log-entry ${className || ''}`;
        div.innerHTML = html;
        scroll.appendChild(div);
        scroll.scrollTop = scroll.scrollHeight;
    }

    function toggleAutoClimb(checked) {
        const isQualified = towerPlayer.cp >= (towerCurrentBoss.cp * 3);
        if (checked && !isQualified) {
            alert(`🔒 ĐIỀU KIỆN CHƯA ĐỦ!\nCần Lực Chiến gấp 3 lần Boss (Hiện tại: ${(towerPlayer.cp / towerCurrentBoss.cp).toFixed(1)}x).\nHãy đột phá hoặc tăng cường tu vi!`);
            const toggle = document.getElementById('auto-climb-toggle');
            if (toggle) toggle.checked = false;
            isAutoClimbOn = false;
            return;
        }
        isAutoClimbOn = checked;
    }

    function runAutoClimbFast() {
        let climbed = 0;
        let stonesEarned = 0;
        let tuviEarned = 0;

        while (towerPlayer.hp > 0 && towerPlayer.cp >= (towerCurrentBoss.cp * 3)) {
            climbed++;
            stonesEarned += towerCurrentBoss.rewardStones;
            tuviEarned += towerCurrentBoss.rewardTuvi;
            towerPlayer.hp = Math.max(1, towerPlayer.hp - Math.round(towerPlayer.maxHp * 0.015));

            towerCurrentFloor++;
            towerCurrentBoss = createFloorBoss(towerCurrentFloor);
        }

        towerPlayer.stones += stonesEarned;
        towerPlayer.tuvi += tuviEarned;
        updateArenaUI();

        appendLog(`⚡ [Auto-Climb] Đã càn quét nhanh ${climbed} tầng! +${stonesEarned.toLocaleString()} Linh Thạch, +${tuviEarned.toLocaleString()} Tu Vi.`, 'log-entry--win');
        alert(`⚡ AUTO-CLIMB CÀN QUÉT THÀNH CÔNG!\nĐã quét sạch ${climbed} Tầng Tháp!\nNhận: +${stonesEarned.toLocaleString()} Linh Thạch, +${tuviEarned.toLocaleString()} Tu Vi.\nDừng lại tại Tầng ${towerCurrentFloor} do Boss quá mạnh.`);
    }

    function updateHPDisplays() {
        const pFill = document.getElementById('player-hp-fill');
        const pNum = document.getElementById('player-hp-num');
        if (pFill && pNum) {
            const pPct = Math.max(0, Math.min(100, Math.round((towerPlayer.hp / towerPlayer.maxHp) * 100)));
            pFill.style.width = `${pPct}%`;
            pNum.textContent = `${towerPlayer.hp.toLocaleString()} / ${towerPlayer.maxHp.toLocaleString()}`;
        }

        const bFill = document.getElementById('boss-hp-fill');
        const bNum = document.getElementById('boss-hp-num');
        if (bFill && bNum) {
            const bPct = Math.max(0, Math.min(100, Math.round((towerCurrentBoss.hp / towerCurrentBoss.maxHp) * 100)));
            bFill.style.width = `${bPct}%`;
            bNum.textContent = `${towerCurrentBoss.hp.toLocaleString()} / ${towerCurrentBoss.maxHp.toLocaleString()}`;
        }
    }

    function updateArenaUI() {
        const stonesBadge = document.getElementById('player-stones-badge');
        if (stonesBadge) stonesBadge.textContent = towerPlayer.stones.toLocaleString();

        const tuviBadge = document.getElementById('player-tuvi-badge');
        if (tuviBadge) tuviBadge.textContent = towerPlayer.tuvi.toLocaleString();

        const floorTitle = document.getElementById('stage-floor-title');
        if (floorTitle) floorTitle.textContent = `TẦNG ${towerCurrentFloor}`;

        const challengeLabel = document.getElementById('btn-challenge-label');
        if (challengeLabel && !isCombatActive) {
            challengeLabel.textContent = `KHIÊU CHIẾN TẦNG ${towerCurrentFloor}`;
        }

        const bossTitle = document.getElementById('boss-title-name');
        if (bossTitle) {
            bossTitle.innerHTML = `<i class="fa-solid fa-skull mr-1"></i>${towerCurrentBoss.name}`;
        }

        const ratio = (towerPlayer.cp / towerCurrentBoss.cp).toFixed(1);
        const isQualified = towerPlayer.cp >= (towerCurrentBoss.cp * 3);
        const matchupInfo = document.getElementById('matchup-cp-info');
        if (matchupInfo) {
            matchupInfo.textContent = `Tỷ số Lực Chiến: ${ratio}x (${isQualified ? 'Đè bẹp đối thủ' : 'Cần cẩn trọng'})`;
        }

        const autoDesc = document.getElementById('auto-climb-status-desc');
        const autoToggle = document.getElementById('auto-climb-toggle');
        if (autoDesc && autoToggle) {
            if (isQualified) {
                autoDesc.textContent = `Đủ điều kiện (LC Ta >= 3x LC Boss)`;
                autoToggle.disabled = false;
            } else {
                autoDesc.textContent = `Chưa đủ (Cần >= 3.0x, hiện có ${ratio}x)`;
                autoToggle.checked = false;
                autoToggle.disabled = true;
                isAutoClimbOn = false;
            }
        }

        updateHPDisplays();
    }

    function fullHealPlayer() {
        towerPlayer.hp = towerPlayer.maxHp;
        updateHPDisplays();
        appendLog(`💚 [Vận Công] ${towerPlayer.name} hấp thu thiên địa nguyên khí, hồi phục toàn bộ Khí Huyết!`, 'log-entry--round');
    }

// Gắn toàn cục lên window và globalThis để mọi nút HTML onclick gọi trực tiếp
    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.openFeature = openFeature;
    window.closeAllFeaturePopups = closeAllFeaturePopups;
    window.openDoKiepModal = openDoKiepModal;
    window.closeDoKiepModal = closeDoKiepModal;
    window.spawnLightningStrike = spawnLightningStrike;
    window.defendWithArtifact = defendWithArtifact;
    window.startDoKiepStrikes = startDoKiepStrikes;
    window.openBreakthroughModal = openDoKiepModal;
    window.openTribulationZone = openDoKiepModal;

    // Gia Viên exports
    window.openGiaVienModal = openGiaVienModal;
    window.closeGiaVienModal = closeGiaVienModal;
    window.upgradeNode = upgradeNode;
    window.claimSingleNode = claimSingleNode;
    window.claimAllEstateResources = claimAllEstateResources;
    window.openDispatchModal = openDispatchModal;
    window.closeDispatchModal = closeDispatchModal;
    window.assignCompanionToNode = assignCompanionToNode;
    window.unassignCompanionFromActiveNode = unassignCompanionFromActiveNode;
    window.updateEstateUI = updateEstateUI;
    window.showToast = showEstateToast;
    window.ESTATE_NODES = ESTATE_NODES;
    window.COMPANIONS_LIST = COMPANIONS_LIST;


    // ========================================================================
    // 9. THANH TÀI NGUYÊN KHUNG TRÊN (GLOBAL TOP RESOURCE BAR)
    // Tích hợp từ top_resource_bar_demo.html sang chuẩn SPA độc lập
    // ========================================================================

    /**
     * 1. HÀM FORMAT SỐ GỌN (1.5M, 20K, 3.2B) THEO CHUẨN TIÊN HIỆP
     */
    function formatNumber(num) {
        const n = Number(num) || 0;
        if (n >= 1e9) {
            return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
        }
        if (n >= 1e6) {
            return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
        }
        if (n >= 1e3) {
            return (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
        }
        return n.toLocaleString('vi-VN');
    }

    /**
     * 2. HÀM CẬP NHẬT TOÀN BỘ THANH TÀI NGUYÊN (UPDATE TOPBAR)
     * @param {Object} data
     *   - stones: Số Linh Thạch
     *   - jade: Số Tiên Ngọc
     *   - qiCurrent: Linh khí hiện tại
     *   - qiMax: Dung tích linh khí tối đa
     *   - qiRate: Tốc độ hấp thu mỗi giây (+X/s)
     *   - righteous: Điểm Chính Đạo (0..100)
     *   - demonic: Điểm Ma Đạo (0..100)
     */
    function updateTopResourceBar(data) {
        if (!data) return;

        // 1. Cập nhật Tiền tệ
        if (typeof data.stones !== 'undefined') {
            const elStones = document.getElementById('top-spirit-stones');
            if (elStones) elStones.textContent = formatNumber(data.stones);
            const legacyStones = document.getElementById('spirit-stones');
            if (legacyStones) legacyStones.textContent = String(data.stones);
        }
        if (typeof data.jade !== 'undefined') {
            const elJade = document.getElementById('top-immortal-jade');
            if (elJade) elJade.textContent = formatNumber(data.jade);
            const legacyJade = document.getElementById('immortal-jade');
            if (legacyJade) legacyJade.textContent = String(data.jade);
        }

        // 2. Cập nhật Khối Linh Khí / Tu Vi
        if (typeof data.qiCurrent !== 'undefined' && typeof data.qiMax !== 'undefined') {
            const cur = Math.max(0, Number(data.qiCurrent) || 0);
            const max = Math.max(1, Number(data.qiMax) || 1);
            const pct = Math.min(100, Math.max(0, (cur / max) * 100));

            const elQiFill = document.getElementById('top-qi-fill');
            if (elQiFill) elQiFill.style.width = pct.toFixed(1) + '%';

            const elQiText = document.getElementById('top-qi-text');
            if (elQiText) elQiText.textContent = `${formatNumber(cur)} / ${formatNumber(max)}`;

            const elQiRate = document.getElementById('top-qi-rate');
            if (elQiRate && typeof data.qiRate !== 'undefined') {
                elQiRate.textContent = `(+?${formatNumber(data.qiRate)}/s)`.replace('?+', '+');
            }

            const legacyVal = document.getElementById('top-qi-val');
            if (legacyVal) legacyVal.textContent = `${formatNumber(cur)} / ${formatNumber(max)}`;
        }

        // 3. Cập nhật Khối Cân Bằng Đạo Tâm (Sun / Moon)
        if (typeof data.righteous !== 'undefined' && typeof data.demonic !== 'undefined') {
            const r = Math.max(0, Number(data.righteous) || 0);
            const d = Math.max(0, Number(data.demonic) || 0);
            const total = Math.max(1, r + d);

            const sunPct = (r / total) * 100;
            const moonPct = (d / total) * 100;

            const elValSun = document.getElementById('val-righteous');
            if (elValSun) elValSun.textContent = r;

            const elValMoon = document.getElementById('val-demonic');
            if (elValMoon) elValMoon.textContent = d;

            const elTrackSun = document.getElementById('track-sun');
            if (elTrackSun) elTrackSun.style.width = sunPct.toFixed(1) + '%';

            const elTrackMoon = document.getElementById('track-moon');
            if (elTrackMoon) elTrackMoon.style.width = moonPct.toFixed(1) + '%';

            const elTrackOrb = document.getElementById('track-orb');
            if (elTrackOrb) elTrackOrb.style.left = sunPct.toFixed(1) + '%';

            // Kích hoạt Glow cho phe chiếm ưu thế
            const poleSun = document.getElementById('pole-sun');
            const poleMoon = document.getElementById('pole-moon');

            if (poleSun && poleMoon) {
                if (sunPct > 50) {
                    poleSun.classList.add('dominant');
                    poleMoon.classList.remove('dominant');
                } else if (moonPct > 50) {
                    poleMoon.classList.add('dominant');
                    poleSun.classList.remove('dominant');
                } else {
                    poleSun.classList.remove('dominant');
                    poleMoon.classList.remove('dominant');
                }
            }
        }
    }

    /**
     * 3. TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU TỪ GAME STATE SANG TOPBAR
     */
    function syncTopResourceBarFromState() {
        const s = window.state || (typeof state !== 'undefined' ? state : null);
        if (!s) return;

        const stones = typeof s.stones !== 'undefined' ? s.stones : (window.playerState?._linhThach || 0);
        const jade = typeof s.immortalJade !== 'undefined' ? s.immortalJade : (s.jade || 0);

        const curExp = typeof s.exp !== 'undefined' ? s.exp : (s.spiritPool || 0);
        const realms = window.REALMS || (typeof REALMS !== 'undefined' ? REALMS : []);
        const rIdx = s.realmIndex || 0;
        const maxExp = (realms[rIdx] && realms[rIdx].maxExp) ? realms[rIdx].maxExp : 100;
        const rate = s.spiritRate || (realms[rIdx] ? realms[rIdx].expRate : 5) || 5;

        const righteous = s.alignment?.righteous ?? 50;
        const demonic = s.alignment?.demonic ?? 50;

        updateTopResourceBar({
            stones,
            jade,
            qiCurrent: curExp,
            qiMax: maxExp,
            qiRate: rate,
            righteous,
            demonic
        });
    }

    window.openDemonTowerModal = openDemonTowerModal;
    window.closeDemonTowerModal = closeDemonTowerModal;
    window.handleChallengeClick = handleChallengeClick;
    window.toggleAutoClimb = toggleAutoClimb;
    window.fullHealPlayer = fullHealPlayer;
    window.updateArenaUI = updateArenaUI;
    window.towerPlayer = towerPlayer;
    window.formatNumber = formatNumber;
    window.updateTopResourceBar = updateTopResourceBar;
    window.syncTopResourceBarFromState = syncTopResourceBarFromState;



    globalThis.openProfileModal = openProfileModal;
    globalThis.closeProfileModal = closeProfileModal;
    globalThis.openFeature = openFeature;
    globalThis.closeAllFeaturePopups = closeAllFeaturePopups;
    globalThis.openDoKiepModal = openDoKiepModal;
    globalThis.closeDoKiepModal = closeDoKiepModal;
    globalThis.spawnLightningStrike = spawnLightningStrike;
    globalThis.defendWithArtifact = defendWithArtifact;
    globalThis.startDoKiepStrikes = startDoKiepStrikes;
    globalThis.openBreakthroughModal = openDoKiepModal;
    globalThis.openTribulationZone = openDoKiepModal;

    globalThis.openGiaVienModal = openGiaVienModal;
    globalThis.closeGiaVienModal = closeGiaVienModal;
    globalThis.upgradeNode = upgradeNode;
    globalThis.claimSingleNode = claimSingleNode;
    globalThis.claimAllEstateResources = claimAllEstateResources;
    globalThis.openDispatchModal = openDispatchModal;
    globalThis.closeDispatchModal = closeDispatchModal;
    globalThis.assignCompanionToNode = assignCompanionToNode;
    globalThis.unassignCompanionFromActiveNode = unassignCompanionFromActiveNode;
    globalThis.updateEstateUI = updateEstateUI;
    globalThis.showToast = showEstateToast;
    globalThis.ESTATE_NODES = ESTATE_NODES;
    globalThis.COMPANIONS_LIST = COMPANIONS_LIST;
    globalThis.formatNumber = formatNumber;
    globalThis.updateTopResourceBar = updateTopResourceBar;
    globalThis.syncTopResourceBarFromState = syncTopResourceBarFromState;


    globalThis.openDemonTowerModal = openDemonTowerModal;
    globalThis.closeDemonTowerModal = closeDemonTowerModal;
    globalThis.handleChallengeClick = handleChallengeClick;
    globalThis.toggleAutoClimb = toggleAutoClimb;
    globalThis.fullHealPlayer = fullHealPlayer;
    globalThis.updateArenaUI = updateArenaUI;
    globalThis.towerPlayer = towerPlayer;



    /* ==========================================================================
       HỆ THỐNG BẢN NGUYÊN TU SĨ & BẢNG CHỈ SỐ NHÂN VẬT (CHARACTER STATS ENGINE)
       Áp dụng chuẩn dữ liệu & công thức từ character_stats_demo.html
       ========================================================================== */
    const player = {
        name: "Tiêu Dao Tử",
        world: "[HẠ GIỚI] Phàm Tục",
        daoTam: "Chính Tà Cân Bằng",
        realmIndex: 4,
        realmName: "Trúc Cơ - Sơ Kỳ",
        core: {
            hp: 5800,
            maxHp: 5800,
            mp: 2400,
            maxMp: 2400,
            daoTamPoints: 100,
            maxDaoTam: 100,
            age: 18,
            maxLifespan: 200
        },
        combat: {
            atk: 680,
            def: 320,
            spd: 125,
            critRate: 18.5,
            armorPen: 12.0,
            dodge: 8.5
        },
        spiritRoot: {
            name: "Thiên Lôi Linh Căn",
            type: "mutated", // 'scrap' | 'true' | 'heaven' | 'mutated'
            elements: {
                kim: true,
                moc: false,
                thuy: true,
                hoa: false,
                tho: false
            }
        },
        companion: {
            pet: {
                name: "Cửu Vĩ Thiên Hồ",
                rank: "Thần Thú",
                desc: "Hồ ly chín đuôi thượng cổ, hộ vệ đạo tâm, gia tăng 15% Thân Pháp và 10% Tỉ lệ Bạo Kích khi xuất chiến.",
                avatar: "./assets/images/pet_fox.jpg"
            },
            artifacts: [
                { slot: "sword", name: "Trúc Kiếm Cổ Linh", equipped: true },
                { slot: "mirror", name: null, equipped: false },
                { slot: "orb", name: null, equipped: false }
            ]
        }
    };

    /**
     * TÍNH TOÁN LỰC CHIẾN (COMBAT POWER - CP)
     * Quy đổi chuẩn Xianxia RPG:
     * - Công Kích: x2.5
     * - Phòng Ngự: x2.0
     * - Khí Huyết: x0.15
     * - Linh Lực: x0.10
     * - Tốc Độ: x1.8
     * - Bạo Kích (%): x15.0
     * - Xuyên Giáp (%): x12.0
     * - Né Tránh (%): x10.0
     */
    function calculateCP(p) {
        if (!p || !p.core || !p.combat) return 0;
        const c = p.combat;
        const core = p.core;

        const cpAtk = (c.atk || 0) * 2.5;
        const cpDef = (c.def || 0) * 2.0;
        const cpHp = (core.maxHp || 0) * 0.15;
        const cpMp = (core.maxMp || 0) * 0.10;
        const cpSpd = (c.spd || 0) * 1.8;
        const cpCrit = (c.critRate || 0) * 15.0;
        const cpPen = (c.armorPen || 0) * 12.0;
        const cpDodge = (c.dodge || 0) * 10.0;

        return Math.round(cpAtk + cpDef + cpHp + cpMp + cpSpd + cpCrit + cpPen + cpDodge);
    }

    /**
     * HỆ SỐ TỐC ĐỘ HẤP THU LINH CĂN
     * - Tạp Linh Căn (4-5 hệ): x0.5
     * - Chân Linh Căn (2-3 hệ): x1.0
     * - Thiên Linh Căn (1 hệ tinh thuần): x1.5
     * - Biến Dị Linh Căn (Phong, Băng, Lôi): x2.0
     */
    function getSpiritRootMultiplier(root) {
        if (!root) return 1.0;
        switch (root.type) {
            case 'mutated':
                return 2.0;
            case 'heaven':
                return 1.5;
            case 'true':
                return 1.0;
            case 'scrap':
            default:
                return 0.5;
        }
    }

    /**
     * CƠ CHẾ THỌ NGUYÊN (LIFESPAN & TỌA HÓA)
     */
    function advanceAge(p, years) {
        if (!p) p = (typeof window !== 'undefined' && window.player) ? window.player : player;
        p.core.age += years;
        if (p.core.age >= p.core.maxLifespan) {
            triggerToaHoa(p);
            return true;
        }
        return false;
    }

    function triggerToaHoa(p) {
        console.warn("[Tọa Hóa] Đạo hữu " + p.name + " thọ nguyên đã tận (" + p.core.age + "/" + p.core.maxLifespan + " năm)!");
        if (typeof alert === 'function') {
            alert("⚠️ THỌ NGUYÊN ĐÃ TẬN!\n\nĐạo hữu " + p.name + " tuổi thọ đạt giới hạn (" + p.core.age + "/" + p.core.maxLifespan + " năm), nhục thân tan biến, hóa thành tro bụi nhân gian.\nHãy Chuyển Sinh để trùng tu kiếp sau!");
        }
    }

    function onBreakthroughMajorRealm(p, bonusYears) {
        if (!p) p = (typeof window !== 'undefined' && window.player) ? window.player : player;
        p.core.maxLifespan += bonusYears;
    }

    /**
     * CHUYỂN TAB LINH THÚ / PHÁP BẢO
     */
    function switchCompanionTab(tabType, btn) {
        document.querySelectorAll('.comp-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.comp-tab-content').forEach(c => c.classList.remove('active'));

        if (btn) btn.classList.add('active');
        if (tabType === 'pet') {
            const petTab = document.getElementById('tab-comp-pet');
            if (petTab) petTab.classList.add('active');
        } else {
            const artTab = document.getElementById('tab-comp-artifact');
            if (artTab) artTab.classList.add('active');
        }
    }

    /**
     * BỐC DỮ LIỆU ĐỒNG BỘ TỪ GAMESTATE TOÀN CỤC (WINDOW.STATE)
     */
    function getActivePlayerStats() {
        const s = (typeof window !== 'undefined' && window.state) 
            ? window.state 
            : (typeof globalThis !== 'undefined' && globalThis.state) 
                ? globalThis.state 
                : null;

        if (!s) return player;

        // Tên cảnh giới từ REALMS
        let realmName = "Trúc Cơ - Sơ Kỳ";
        if (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[s.realmIndex]) {
            realmName = REALMS[s.realmIndex].name;
        } else if (s.realmName) {
            realmName = s.realmName;
        }

        // Tên giới vực
        const worldName = (s.currentWorld === "ThuongGioi") ? "[THƯỢNG GIỚI] Tiên Vực" : "[HẠ GIỚI] Phàm Tục";

        // Đạo tâm
        let daoTamText = "Chính Tà Cân Bằng";
        const currentDaoTam = (typeof s.daoTam === 'number') ? s.daoTam : 100;
        if (currentDaoTam > 70) daoTamText = "Thái Dương Thánh Đạo";
        else if (currentDaoTam < 30) daoTamText = "Thái Âm Ma Đạo";

        // Linh căn
        const sRoot = s.spiritualRoot || {};
        const pillars = sRoot.pillars || {};
        let rootName = s.spiritRoot || "Thiên Lôi Linh Căn";
        if (sRoot.id && typeof sRoot.id === 'string') {
            if (sRoot.id === 'thunder_heaven') rootName = "Thiên Lôi Linh Căn";
            else if (sRoot.id.includes('heaven')) rootName = "Thiên Linh Căn";
            else if (sRoot.id.includes('chaos')) rootName = "Hỗn Độn Diệt Thế Căn";
        }

        let rootType = "mutated";
        if (sRoot.tier === 'heaven') rootType = 'heaven';
        else if (sRoot.tier === 'true') rootType = 'true';
        else if (sRoot.tier === 'mortal' || sRoot.tier === 'scrap') rootType = 'scrap';
        else if (sRoot.tier === 'mutated') rootType = 'mutated';

        const hasKim = typeof pillars.metal === 'number' ? pillars.metal > 0 : true;
        const hasMoc = typeof pillars.wood === 'number' ? pillars.wood > 0 : false;
        const hasThuy = typeof pillars.water === 'number' ? pillars.water > 0 : true;
        const hasHoa = typeof pillars.fire === 'number' ? pillars.fire > 0 : false;
        const hasTho = typeof pillars.earth === 'number' ? pillars.earth > 0 : false;

        return {
            name: s.player?.name || s.name || "Tiêu Dao Tử",
            world: worldName,
            daoTam: daoTamText,
            realmIndex: s.realmIndex || 0,
            realmName: realmName,
            core: {
                hp: s.hp ?? s.totalHp ?? 5800,
                maxHp: s.maxHp ?? s.totalHp ?? 5800,
                mp: s.mp ?? s.totalMp ?? 2400,
                maxMp: s.maxMp ?? s.totalMp ?? 2400,
                daoTamPoints: currentDaoTam,
                maxDaoTam: 100,
                age: s.ageYears ?? s.age ?? 18,
                maxLifespan: s.lifespan ?? 200
            },
            combat: {
                atk: s.totalAtk ?? s.atk ?? 680,
                def: s.totalDef ?? s.def ?? 320,
                spd: s.speed ?? 125,
                critRate: (typeof s.crit === 'number') ? s.crit : 18.5,
                armorPen: (typeof s.armorPen === 'number') ? s.armorPen : 12.0,
                dodge: (typeof s.dodge === 'number') ? s.dodge : 8.5
            },
            spiritRoot: {
                name: rootName,
                type: rootType,
                elements: {
                    kim: hasKim,
                    moc: hasMoc,
                    thuy: hasThuy,
                    hoa: hasHoa,
                    tho: hasTho
                }
            },
            companion: {
                pet: {
                    name: s.pet?.name || "Cửu Vĩ Thiên Hồ",
                    rank: s.pet?.rank || "Thần Thú",
                    desc: s.pet?.desc || "Hồ ly chín đuôi thượng cổ, hộ vệ đạo tâm, gia tăng 15% Thân Pháp và 10% Tỉ lệ Bạo Kích khi xuất chiến.",
                    avatar: s.pet?.avatar || "./assets/images/pet_fox.jpg"
                },
                artifacts: s.artifacts || [
                    { slot: "sword", name: "Trúc Kiếm Cổ Linh", equipped: true },
                    { slot: "mirror", name: null, equipped: false },
                    { slot: "orb", name: null, equipped: false }
                ]
            }
        };
    }

    /**
     * RENDER CẬP NHẬT GIAO DIỆN BẢN NGUYÊN TU SĨ
     */
    function renderCharacterUI(p) {
        if (!p) {
            p = getActivePlayerStats();
        }
        const cp = calculateCP(p);
        const rootMult = getSpiritRootMultiplier(p.spiritRoot);

        // Header
        const nameEl = document.getElementById('ui-player-name');
        if (nameEl) nameEl.textContent = p.name;
        const worldEl = document.getElementById('ui-world-badge');
        if (worldEl) worldEl.textContent = p.world;
        const realmEl = document.getElementById('ui-realm-title');
        if (realmEl) realmEl.textContent = p.realmName;
        const daoTamEl = document.getElementById('ui-dao-tam');
        if (daoTamEl) daoTamEl.innerHTML = '<i class="fa-solid fa-yin-yang mr-1"></i> ' + p.daoTam;
        const rootBadgeEl = document.getElementById('ui-root-badge');
        if (rootBadgeEl) rootBadgeEl.innerHTML = '<i class="fa-solid fa-bolt mr-1 text-amber-400"></i> ' + (p.spiritRoot?.name || 'Thiên Lôi Linh Căn');
        const totalCpEl = document.getElementById('ui-total-cp');
        if (totalCpEl) totalCpEl.textContent = cp.toLocaleString('vi-VN') + " CP";
        const lifespanBriefEl = document.getElementById('ui-lifespan-brief');
        if (lifespanBriefEl) lifespanBriefEl.textContent = p.core.age + " / " + p.core.maxLifespan + " năm";

        // Panel 1: Progress Bars
        const hpText = document.getElementById('ui-hp-text');
        if (hpText) hpText.textContent = Number(p.core.hp).toLocaleString() + " / " + Number(p.core.maxHp).toLocaleString();
        const hpBar = document.getElementById('ui-hp-bar');
        if (hpBar) {
            const hpPct = p.core.maxHp > 0 ? (p.core.hp / p.core.maxHp) * 100 : 100;
            hpBar.style.width = Math.min(100, Math.max(0, hpPct)) + "%";
        }

        const mpText = document.getElementById('ui-mp-text');
        if (mpText) mpText.textContent = Number(p.core.mp).toLocaleString() + " / " + Number(p.core.maxMp).toLocaleString();
        const mpBar = document.getElementById('ui-mp-bar');
        if (mpBar) {
            const mpPct = p.core.maxMp > 0 ? (p.core.mp / p.core.maxMp) * 100 : 100;
            mpBar.style.width = Math.min(100, Math.max(0, mpPct)) + "%";
        }

        const mindText = document.getElementById('ui-mind-text');
        if (mindText) mindText.textContent = p.core.daoTamPoints + " / " + p.core.maxDaoTam;
        const mindBar = document.getElementById('ui-mind-bar');
        if (mindBar) {
            const mindPct = p.core.maxDaoTam > 0 ? (p.core.daoTamPoints / p.core.maxDaoTam) * 100 : 100;
            mindBar.style.width = Math.min(100, Math.max(0, mindPct)) + "%";
        }

        const lifespanText = document.getElementById('ui-lifespan-text');
        if (lifespanText) lifespanText.textContent = p.core.age + " / " + p.core.maxLifespan + " năm";
        const lifespanBar = document.getElementById('ui-lifespan-bar');
        if (lifespanBar) {
            const lifePct = p.core.maxLifespan > 0 ? (p.core.age / p.core.maxLifespan) * 100 : 10;
            lifespanBar.style.width = Math.min(100, Math.max(0, lifePct)) + "%";
        }

        // Panel 2: Combat Stats
        const atkEl = document.getElementById('ui-stat-atk');
        if (atkEl) atkEl.textContent = Number(p.combat.atk).toLocaleString();
        const defEl = document.getElementById('ui-stat-def');
        if (defEl) defEl.textContent = Number(p.combat.def).toLocaleString();
        const spdEl = document.getElementById('ui-stat-spd');
        if (spdEl) spdEl.textContent = Number(p.combat.spd).toLocaleString();
        const critEl = document.getElementById('ui-stat-crit');
        if (critEl) critEl.textContent = p.combat.critRate + "%";
        const penEl = document.getElementById('ui-stat-pen');
        if (penEl) penEl.textContent = p.combat.armorPen + "%";
        const dodgeEl = document.getElementById('ui-stat-dodge');
        if (dodgeEl) dodgeEl.textContent = p.combat.dodge + "%";

        // Panel 3: Linh Căn
        const rootMultEl = document.getElementById('ui-root-multiplier');
        if (rootMultEl) rootMultEl.textContent = "x" + rootMult.toFixed(2);
        const rootPurityEl = document.getElementById('ui-root-purity-name');
        if (rootPurityEl && p.spiritRoot) rootPurityEl.textContent = p.spiritRoot.name;

        // 5 Nguyên tố Ngũ Hành
        const elements = p.spiritRoot?.elements || { kim: true, moc: false, thuy: true, hoa: false, tho: false };
        const elemMap = {
            'root-elem-kim': elements.kim,
            'root-elem-moc': elements.moc,
            'root-elem-thuy': elements.thuy,
            'root-elem-hoa': elements.hoa,
            'root-elem-tho': elements.tho
        };
        Object.entries(elemMap).forEach(([id, active]) => {
            const el = document.getElementById(id);
            if (el) {
                if (active) el.classList.add('active');
                else el.classList.remove('active');
            }
        });

        // Cập nhật legacy fallback elements nếu có
        const legacyHpText = document.getElementById('stat-hp-text');
        if (legacyHpText) legacyHpText.textContent = p.core.hp + "/" + p.core.maxHp;
        const legacyAtk = document.getElementById('stat-atk');
        if (legacyAtk) legacyAtk.textContent = p.combat.atk;
        const legacyDef = document.getElementById('stat-def');
        if (legacyDef) legacyDef.textContent = p.combat.def;
        const legacySpd = document.getElementById('stat-spd');
        if (legacySpd) legacySpd.textContent = p.combat.spd;
        const legacyCrit = document.getElementById('stat-crit');
        if (legacyCrit) legacyCrit.textContent = p.combat.critRate + "%";
        const legacyCp = document.getElementById('combat-power-text');
        if (legacyCp) legacyCp.textContent = cp;
    }

    // Xuất khẩu các hàm ra window và globalThis
    window.player = player;
    window.calculateCP = calculateCP;
    window.getSpiritRootMultiplier = getSpiritRootMultiplier;
    window.advanceAge = advanceAge;
    window.switchCompanionTab = switchCompanionTab;
    window.renderCharacterUI = renderCharacterUI;
    window.getActivePlayerStats = getActivePlayerStats;
    window.onBreakthroughMajorRealm = onBreakthroughMajorRealm;

    globalThis.player = player;
    globalThis.calculateCP = calculateCP;
    globalThis.getSpiritRootMultiplier = getSpiritRootMultiplier;
    globalThis.advanceAge = advanceAge;
    globalThis.switchCompanionTab = switchCompanionTab;
    globalThis.renderCharacterUI = renderCharacterUI;
    globalThis.getActivePlayerStats = getActivePlayerStats;
    globalThis.onBreakthroughMajorRealm = onBreakthroughMajorRealm;

    // Đảm bảo sau khi DOM sẵn sàng, các thanh điều hướng và khung 3 cột luôn hoạt động chuẩn xác

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
                alert(`Cấp nghề chưa đủ! Cần đạt ${rec.reqLevelTitle}.`);
                return;
            }

            // 2. Kiểm tra nguyên liệu
            for (const mat of rec.materials) {
                const owned = playerState.materials[mat.matId] || 0;
                if (owned < mat.qty) {
                    const matObj = HERBS_DATA[mat.matId];
                    alert(`Không đủ dược liệu: ${matObj.name} (${owned}/${mat.qty})!`);
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
                alert(`💥 NỔ LÒ RỒI!\nHỏa hầu mất khống chế, mẻ đan [${rec.name}] bị cháy thành tro bụi! Mất trắng dược liệu.`);
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

            // 1. Nhận tác dụng đan dược
            let msg = `🧪 Đã phục dụng [${pill.name}]: `;
            if (pill.effectType === 'heal_hp') msg += `Hồi phục +${pill.effectVal.toLocaleString()} HP!`;
            else if (pill.effectType === 'add_exp') msg += `Gia tăng +${pill.effectVal.toLocaleString()} Tu Vi!`;
            else if (pill.effectType === 'tribulation_buff') msg += `Tăng +${pill.effectVal}% Tỷ lệ Trúc Cơ thành công!`;

            // 2. Tích tụ đan độc
            playerState.danDoc += pill.danDoc;
            msg += `\n⚠️ Tích lũy thêm +${pill.danDoc}% Đan Độc (Hiện tại: ${playerState.danDoc}%).`;

            // Xóa viên đan khỏi túi
            playerState.inventoryPills.splice(idx, 1);

            // Kiểm tra quá tải đan độc
            if (playerState.danDoc > 100) {
                msg += `\n🚨 CẢNH BÁO: Đan Độc vượt 100%! Kinh mạch bế tắc, tốc độ tu luyện giảm 50%! Hãy uống Thanh Tâm Đan ngay!`;
            }

            alert(msg);
            updateHeaderUI();
            renderRecentPills();
        }

        function drinkCleansePill() {
            if (playerState.danDoc <= 0) {
                alert("Kinh mạch thanh tịnh, hoàn toàn không có Đan Độc!");
                return;
            }
            if (playerState.cleansePills <= 0) {
                alert("Đã hết Thanh Tâm Đan trong người!");
                return;
            }

            playerState.cleansePills--;
            playerState.danDoc = Math.max(0, playerState.danDoc - 30);
            alert(`🌿 Đã dùng 1 viên [Thanh Tâm Đan]!\nThanh lọc kinh mạch, tiêu trừ 30% Đan Độc. (Còn lại: ${playerState.danDoc}% Đan Độc).`);
            updateHeaderUI();
        }

        // ====================================================================
        // HỆ THỐNG EXP & THĂNG CẤP LUYỆN ĐAN SƯ
        // ====================================================================
        function addAlchemyExp(amount) {
            playerState.exp += amount;
            let currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);

            while (currentProf && playerState.exp >= currentProf.maxExp && playerState.level < 3) {
                playerState.exp -= currentProf.maxExp;
                playerState.level++;
                currentProf = ALCHEMIST_LEVELS.find(p => p.level === playerState.level);
                alert(`🎉 CHÚC MỪNG ĐẠO HỮU!\nĐan đạo tinh tiến, tấn thăng: [${currentProf.title}]!\n${currentProf.desc}`);
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
            document.getElementById('alchemy-body-theme').className = c.themeClass;
            document.getElementById('active-cauldron-title').textContent = c.name;
            document.getElementById('active-cauldron-buff').textContent = c.buffDesc;
            closeCauldronPicker();
            updateHeaderUI();
            renderRecipes();
        }

        function closeCauldronPicker() {
            document.getElementById('cauldron-modal').classList.remove('is-open');
        }

        function openFirePicker() {
            const list = document.getElementById('fire-options-container');
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
            document.getElementById('fire-modal').classList.add('is-open');
        }

        function selectFire(fireId) {
            playerState.activeFireId = fireId;
            document.getElementById('active-fire-name').textContent = FLAMES_DATA[fireId].name;
            closeFirePicker();
            updateHeaderUI();
        }

        function closeFirePicker() {
            document.getElementById('fire-modal').classList.remove('is-open');
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
        const el = document.getElementById('modal-luyen-dan');
        if (el) {
            el.style.display = 'block';
            if (typeof renderRecipes === 'function') renderRecipes();
            if (typeof updateHeaderUI === 'function') updateHeaderUI();
        }
    }

    function closeLuyenDanModal() {
        const el = document.getElementById('modal-luyen-dan');
        if (el) el.style.display = 'none';
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



/* ==========================================================================
   MODULE 11: LUYỆN KHÍ THẤT (FORGING SYSTEM - TÁCH BIỆT TRONG IIFE)
   ========================================================================== */
(() => {
    // ====================================================================
        // 1. DATA STATE CỦA NGƯỜI CHƠI (PLAYER STATE)
        // ====================================================================
        const playerState = {
            realmIndex: 2, // Mặc định: Luyện Khí Tầng 3 (Index 2)
            stones: 2500,  // Linh Thạch
            inventory: {
                stone_ore: 15,   // Huyền Thiết Khoáng
                herb_spirit: 5,  // Tử Linh Chi
                herb_blood: 3    // Huyết Ngọc Sâm
            },
            craftedBag: [] // Túi lưu các món đồ đã đúc thành công
        };

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
            }
        };

        /**
         * Quay số ngẫu nhiên phẩm chất:
         * 70% Hạ Phẩm, 25% Trung Phẩm, 5% Thượng Phẩm
         */
        function rollCraftingQuality() {
            const rand = Math.random(); // 0 -> 1
            if (rand < 0.05) {
                return CRAFTING_QUALITIES.THUONGPHAM; // 5%
            } else if (rand < 0.30) {
                return CRAFTING_QUALITIES.TRUNGPHAM;  // 25% (0.05 đến 0.30)
            } else {
                return CRAFTING_QUALITIES.HAPHAP;     // 70% (0.30 đến 1.00)
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
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        function playSoundFx(type) {
            try {
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
                        <span class="recipe-req-badge ${realmMet ? 'req--met' : 'req--unmet'}">
                            <i class="fa-solid ${realmMet ? 'fa-check' : 'fa-lock'}"></i> ${recipe.reqRealmName}
                        </span>
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

                    <button type="button" class="btn-forge" onclick="startCrafting('${recipe.id}')" ${canCraft ? '' : 'disabled'}>
                        <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
                    </button>
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
                alert(`Cảnh giới chưa đủ! Cần đạt ${recipe.reqRealmName} để đúc trang bị này.`);
                return;
            }

            // Kiểm tra nguyên liệu
            for (const mat of recipe.materials) {
                if (mat.key === 'stones') {
                    if (playerState.stones < mat.qty) {
                        alert("Không đủ Linh Thạch!");
                        return;
                    }
                } else {
                    if ((playerState.inventory[mat.key] || 0) < mat.qty) {
                        alert(`Không đủ nguyên liệu: ${mat.name}!`);
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
                subStat: quality.subStat ? quality.subStat.text : null,
                timeCreated: new Date().toLocaleTimeString('vi-VN')
            };

            // Đưa vào kho trang bị người chơi
            playerState.craftedBag.unshift(craftedItem);

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
        const el = document.getElementById('modal-luyen-khi');
        if (el) {
            el.style.display = 'block';
            if (typeof renderBlueprints === 'function') renderBlueprints();
            if (typeof updateTopBarUI === 'function') updateTopBarUI();
        }
    }

    function closeLuyenKhiModal() {
        const el = document.getElementById('modal-luyen-khi');
        if (el) el.style.display = 'none';
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
            realmIndex: 2, // Cảnh giới người chơi (Luyện Khí Tầng 3)
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
                alert(`Đã hết [${gift.name}] trong túi!`);
                return;
            }

            const comp = getActiveCompanion();
            const prevRank = getAffectionRank(comp.affection);

            // Trừ quà & cộng điểm Hảo Cảm
            playerState.gifts[itemId]--;
            comp.affection = Math.min(5000, comp.affection + gift.affection);

            const newRank = getAffectionRank(comp.affection);

            // Thông báo thăng cấp hảo cảm nếu vượt mốc
            if (newRank.level > prevRank.level) {
                alert(`💖 TÌNH CẢM THĂNG HOA!\nQuan hệ giữa ngươi và [${comp.name}] đã đạt đến cảnh giới: [${newRank.title}] (Cấp ${newRank.level})!`);
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
                alert(`⚠️ ĐẠO HỮU NGHỈ NGƠI CHÚT ĐÃ!\nSong tu đòi hỏi điều hòa âm dương, cần chờ hồi phục khí huyết:\nCòn lại: ${hours}h ${mins}m ${secs}s.`);
                return;
            }

            const comp = getActiveCompanion();

            // Tính toán lượng Tu Vi nhận được
            const gainedExp = Math.round((playerState.realmIndex + 1) * comp.expMultiplier * 25000);

            // Kiểm tra hiệu quả Cấp 5 của Lãnh Nguyệt: 20% tỷ lệ đột phá bình cảnh
            let breakthroughSuccess = false;
            const currentRank = getAffectionRank(comp.affection);
            if (comp.id === 'companion_2' && currentRank.level >= 5 && Math.random() < 0.20) {
                breakthroughSuccess = true;
            }

            // Ghi nhận timestamp hồi chiêu
            playerState.lastDualCultivationTime = Date.now();

            // Bật hiệu ứng toàn màn hình lãng mạn
            showDualCultivationAnimation(gainedExp, comp, breakthroughSuccess);
            updateUI();
        }

        function resetDualCooldown() {
            playerState.lastDualCultivationTime = 0;
            updateUI();
            alert("✨ Đã xóa thời gian hồi chiêu Song Tu để thử nghiệm!");
        }

        // ====================================================================
        // HIỆU ỨNG SONG TU ANIMATION & CÁNH HOA RƠI
        // ====================================================================
        function showDualCultivationAnimation(gainedExp, comp, breakthroughSuccess) {
            const overlay = document.getElementById('dual-cultivation-overlay');
            const rewardBox = document.getElementById('dual-reward-amount-box');
            const resultText = document.getElementById('dual-result-text');

            rewardBox.textContent = `+${gainedExp.toLocaleString('vi-VN')} Tu Vi Linh Lực!`;
            if (breakthroughSuccess) {
                resultText.innerHTML = `🌟 MA ĐẠO THẦN UY! Nhờ âm dương giao hòa cùng [${comp.name}], ngươi may mắn kích phát cảm ngộ, <b>ĐỘT PHÁ BÌNH CẢNH THÀNH CÔNG</b> mà không cần Đan dược!`;
            } else {
                resultText.textContent = `Ngươi cùng [${comp.name}] tâm thần hòa hợp, đôi bên vận chuyển chu thiên, linh lực như thủy triều dâng trào!`;
            }

            // Sinh cánh hoa đào rơi
            generatePetals();
            overlay.classList.add('is-active');
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
                alert(`🔒 Đạo Lữ Chưa Mở Khóa!\nĐiều kiện: ${comp.unlockCondition}`);
                return;
            }

            playerState.activeCompanionId = compId;
            updateUI();
            switchChamberTab('interact');
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
        const el = document.getElementById('modal-khue-phong');
        if (el) {
            el.style.display = 'block';
            if (typeof updateUI === 'function') updateUI();
        }
    }

    function closeKhuePhongModal() {
        const el = document.getElementById('modal-khue-phong');
        if (el) el.style.display = 'none';
        if (typeof closeDualAnimation === 'function') closeDualAnimation();
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
    window.updateKhuePhongUI = updateUI;

    globalThis.openKhuePhongModal = openKhuePhongModal;
    globalThis.closeKhuePhongModal = closeKhuePhongModal;
    globalThis.triggerDualCultivation = triggerDualCultivation;
    globalThis.giveGift = giveGift;
})();


/* ==========================================================================
   ĐIỀU HƯỚNG SPA & MỞ POP-MENU / MODAL QUY CHUẨN
   ========================================================================== */
function navigateTo(pageId) {
    if (pageId === 'page-khue-phong' || pageId === 'modal-khue-phong') {
        if (typeof openKhuePhongModal === 'function') openKhuePhongModal();
        return;
    }
    if (pageId === 'page-dan-cac' || pageId === 'modal-luyen-dan') {
        if (typeof openLuyenDanModal === 'function') openLuyenDanModal();
        return;
    }
    if (pageId === 'page-khi-cac' || pageId === 'modal-luyen-khi') {
        if (typeof openLuyenKhiModal === 'function') openLuyenKhiModal();
        return;
    }
    if (pageId === 'page-gia-vien' || pageId === 'modal-gia-vien' || pageId === 'page-dong-phu') {
        if (typeof openGiaVienModal === 'function') openGiaVienModal();
        return;
    }
    if (pageId === 'page-tran-yeu-thap' || pageId === 'modal-tran-yeu-thap' || pageId === 'demon-tower-modal') {
        if (typeof openDemonTowerModal === 'function') openDemonTowerModal();
        return;
    }
    if (pageId === 'modal-do-kiep') {
        if (typeof openDoKiepModal === 'function') openDoKiepModal(null);
        return;
    }
    if (typeof window.switchPage === 'function') {
        window.switchPage(pageId);
    }
}
window.navigateTo = navigateTo;
globalThis.navigateTo = navigateTo;

function openDongPhuModal() {
    if (typeof openGiaVienModal === 'function') openGiaVienModal();
}
function closeDongPhuModal() {
    if (typeof closeGiaVienModal === 'function') closeGiaVienModal();
}
window.openDongPhuModal = openDongPhuModal;
window.closeDongPhuModal = closeDongPhuModal;
globalThis.openDongPhuModal = openDongPhuModal;
globalThis.closeDongPhuModal = closeDongPhuModal;


    function initMainScreenSafeguards() {
        const bottomMenu = document.getElementById('bottom-menu');
        if (bottomMenu) {
            bottomMenu.style.setProperty('display', 'flex', 'important');
            bottomMenu.style.setProperty('z-index', '10005', 'important');
            bottomMenu.querySelectorAll('.nav-btn').forEach(btn => {
                btn.style.setProperty('display', 'inline-flex', 'important');
                btn.style.setProperty('visibility', 'visible', 'important');
                btn.style.setProperty('opacity', '1', 'important');
            });
        }

        const rightPanel = document.getElementById('right-panel');
        if (rightPanel) {
            rightPanel.style.setProperty('display', 'flex', 'important');
        }

        const leftPanel = document.getElementById('left-panel');
        if (leftPanel) {
            leftPanel.style.setProperty('display', 'flex', 'important');
        }

        const topBar = document.getElementById('top-bar');
        if (topBar) {
            topBar.style.setProperty('display', 'flex', 'important');
            topBar.style.setProperty('position', 'fixed', 'important');
            topBar.style.setProperty('top', '0', 'important');
            topBar.style.setProperty('height', '64px', 'important');
            topBar.style.setProperty('z-index', '50', 'important');
        }

        // Đồng bộ thanh Top Resource Bar
        syncTopResourceBarFromState();

        // Tự động hook vào updateHUD nếu có
        if (typeof window.updateHUD === 'function' && !window.__topbarHooked) {
            const prevHUD = window.updateHUD;
            window.updateHUD = function() {
                prevHUD.apply(this, arguments);
                syncTopResourceBarFromState();
            };
            window.__topbarHooked = true;
        }

        // Lặp định kỳ 1s cập nhật Top Resource Bar
        setInterval(syncTopResourceBarFromState, 1000);

                // Đồng bộ Bản Nguyên Tu Sĩ (Character UI)
        renderCharacterUI();

        // Tự động hook vào updateHUD nếu có
        if (typeof window.updateHUD === 'function' && !window.__characterUIHooked) {
            const prevHUD = window.updateHUD;
            window.updateHUD = function() {
                prevHUD.apply(this, arguments);
                renderCharacterUI();
            };
            window.__characterUIHooked = true;
        }

        // Lặp định kỳ 1s cập nhật Bản Nguyên Tu Sĩ
        setInterval(function() {
            renderCharacterUI();
        }, 1000);

        // Khởi động vòng lặp Gia Viên chạy ngầm 1s / tick
        initEstateIdleLoop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMainScreenSafeguards);
    } else {
        initMainScreenSafeguards();
    }
})();
