(function () {
    'use strict';
    /**
     * Đóng toàn bộ các Pop-menu / Modal chức năng để quay về Màn Hình Chính
     */
    let globalToastTimer = null;
    function showGameToast(msg, type = 'info') {
        if (!msg) return;
        const cleanMsg = String(msg).replace(/\n+/g, ' • ');
        
        let normType = type;
        if (type === 'breakthrough' || type === 'major_breakthrough' || type === 'levelup') {
            normType = 'breakthrough';
        } else if (type === 'danger' || type === 'fail' || type === 'error') {
            normType = 'error';
        } else if (type === 'warning' || type === 'warn') {
            normType = 'warning';
        } else if (type === 'success' || type === 'complete') {
            normType = 'success';
        } else {
            normType = 'info';
        }

        // Ghi nhật ký vào Thiên Cơ Nhật Ký nếu có hàm addLog
        if (typeof window.addLog === 'function') {
            const logColor = normType === 'error' 
                ? 'text-rose-400' 
                : (normType === 'breakthrough' 
                    ? 'text-amber-300 font-bold' 
                    : (normType === 'success' ? 'text-emerald-400' : (normType === 'warning' ? 'text-amber-300' : 'text-cyan-300')));
            window.addLog(cleanMsg, logColor);
        }

        // Kích hoạt hiệu ứng âm thanh tương ứng từ js/audio.js
        if (typeof window.playSound === 'function') {
            if (normType === 'breakthrough') window.playSound('bell');
            else if (normType === 'success') window.playSound('ding');
            else if (normType === 'error') window.playSound('fail');
            else if (normType === 'warning') window.playSound('bell');
            else window.playSound('whoosh');
        }

        let container = document.getElementById('game-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'game-toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        // Tối đa 3 thông báo xếp chồng: nếu đã có 3 trở lên thì xóa cái cũ nhất
        while (container.children.length >= 3) {
            container.firstElementChild.remove();
        }

        // Biểu tượng icon theo phân loại thông báo
        let iconHtml = '';
        if (normType === 'breakthrough') {
            iconHtml = '<i class="fa-solid fa-crown text-amber-400 text-sm"></i>';
        } else if (normType === 'success') {
            iconHtml = '<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>';
        } else if (normType === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-xmark text-rose-400 text-sm"></i>';
        } else if (normType === 'warning') {
            iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-sm"></i>';
        } else {
            iconHtml = '<i class="fa-solid fa-circle-info text-cyan-400 text-sm"></i>';
        }

        const item = document.createElement('div');
        item.className = `game-toast-item game-toast-item--${normType}`;
        item.innerHTML = `<span class="toast-icon">${iconHtml}</span><span class="toast-text">${cleanMsg}</span>`;
        container.appendChild(item);

        // Tự động trượt mượt và biến mất sau 3 giây
        const hideTimeout = setTimeout(() => {
            item.classList.add('is-hiding');
            setTimeout(() => {
                if (item.parentNode) item.remove();
            }, 350);
        }, 3000);

        item.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            item.classList.add('is-hiding');
            setTimeout(() => {
                if (item.parentNode) item.remove();
            }, 350);
        });
    }
    window.showGameToast = showGameToast;
    globalThis.showGameToast = showGameToast;
    window.showXianxiaToast = showGameToast;
    globalThis.showXianxiaToast = showGameToast;
    window.showToast = showGameToast;
    globalThis.showToast = showGameToast;

    /**
     * Chuẩn hóa cơ chế đóng toàn bộ Modal & Pop-menu (không để kẹt pointer-events hay display !important)
     */
    function closeAllModals() {
        const backdrop = document.getElementById('feature-page-backdrop');
        if (backdrop) {
            backdrop.classList.remove('is-visible', 'active');
            backdrop.style.setProperty('display', 'none', 'important');
            backdrop.style.setProperty('pointer-events', 'none', 'important');
        }

        if (typeof window.closeDemonTowerModal === 'function') {
            try { window.closeDemonTowerModal(); } catch (e) {}
        } else {
            document.getElementById('tower-v4-frame')?.remove();
            document.body?.classList?.remove('tower-v4-active');
        }

        const allModals = document.querySelectorAll(
            '.feature-popup, .feature-page, .game-page, ' +
            '#modal-gia-vien, #modal-luyen-dan, #modal-luyen-khi, #modal-khue-phong, #modal-tran-yeu-thap, #demon-tower-modal, #modal-do-kiep, ' +
            '#profile-login-modal, #profile-account-modal, #modal-breakthrough, #modal-breakthrough-minor, #modal-offline-rewards, #modal-setting, ' +
            '#modal-be-quan-offline, #modal-game-settings, ' +
            '#page-inventory, #page-skills, #page-root, #page-artifact, #page-pet, #page-sect, #page-world-market'
        );
        allModals.forEach((el) => {
            el.classList.remove('active', 'is-open', 'is-active', 'flex');
            el.classList.add('hidden');
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
        });

        if (typeof window.closeAllDropups === 'function') {
            window.closeAllDropups();
        }
        if (typeof closeAllDropups === 'function') {
            closeAllDropups();
        }
        if (typeof window.showMainScreenHUD === 'function') {
            window.showMainScreenHUD();
        }
    }

    function closeAllFeaturePopups() {
        closeAllModals();
    }

    /**
     * Chuẩn hóa mở Game Modal / SPA Page duy nhất (tự động dọn dẹp các modal khác)
     */
    function openGameModal(targetId) {
        if (!targetId || targetId === 'main-screen') {
            closeAllModals();
            if (typeof window.showMainScreenHUD === 'function') {
                window.showMainScreenHUD();
            }
            return;
        }

        // Đóng các modal khác trước
        closeAllModals();

        // Bản đồ chuẩn hóa Alias
        let id = targetId;
        const aliases = {
            'inventory': 'page-inventory',
            'tui-do': 'page-inventory',
            'page-tui-do': 'page-inventory',
            'skills': 'page-skills',
            'cong-phap': 'page-skills',
            'page-cong-phap': 'page-skills',
            'root': 'page-root',
            'can-co': 'page-root',
            'page-can-co': 'page-root',
            'artifact': 'page-artifact',
            'phap-bao': 'page-artifact',
            'pet': 'page-pet',
            'linh-thu': 'page-pet',
            'gia-vien': 'modal-gia-vien',
            'dong-phu': 'modal-gia-vien',
            'page-gia-vien': 'modal-gia-vien',
            'page-dong-phu': 'modal-gia-vien',
            'luyen-dan': 'modal-luyen-dan',
            'dan-cac': 'modal-luyen-dan',
            'page-dan-cac': 'modal-luyen-dan',
            'luyen-khi': 'modal-luyen-khi',
            'khi-cac': 'modal-luyen-khi',
            'page-khi-cac': 'modal-luyen-khi',
            'khue-phong': 'modal-khue-phong',
            'dao-lu': 'modal-khue-phong',
            'page-khue-phong': 'modal-khue-phong',
            'tran-yeu-thap': 'modal-tran-yeu-thap',
            'demon-tower': 'modal-tran-yeu-thap',
            'page-tran-yeu-thap': 'modal-tran-yeu-thap',
            'demon-tower-modal': 'modal-tran-yeu-thap',
            'do-kiep': 'modal-do-kiep'
        };
        if (aliases[id]) id = aliases[id];

        // Xử lý các modal đặc thù có controller riêng
        if (id === 'modal-gia-vien') {
            if (typeof window.openGiaVienModal === 'function') return window.openGiaVienModal();
        }
        if (id === 'modal-luyen-dan') {
            if (typeof window.openLuyenDanModal === 'function') return window.openLuyenDanModal();
        }
        if (id === 'modal-luyen-khi') {
            if (typeof window.openLuyenKhiModal === 'function') return window.openLuyenKhiModal();
        }
        if (id === 'modal-khue-phong') {
            if (typeof window.openKhuePhongModal === 'function') return window.openKhuePhongModal();
        }
        if (id === 'modal-tran-yeu-thap') {
            if (typeof window.openDemonTowerModal === 'function') return window.openDemonTowerModal();
        }
        if (id === 'modal-do-kiep') {
            if (typeof window.openDoKiepModal === 'function') return window.openDoKiepModal(null);
        }

        // Mở các SPA Popup trang
        const el = document.getElementById(id);
        if (!el) {
            console.warn('[openGameModal] Không tìm thấy phần tử modal:', id);
            return;
        }

        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();

        el.classList.remove('hidden');
        el.classList.add('active');
        el.style.removeProperty('display');
        el.style.removeProperty('pointer-events');
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');

        const backdrop = document.getElementById('feature-page-backdrop');
        if (backdrop) {
            backdrop.classList.add('is-visible', 'active');
            backdrop.style.removeProperty('display');
            backdrop.style.setProperty('pointer-events', 'auto', 'important');
        }

        // Render nội dung tương ứng nếu cần
        if (id === 'page-inventory') {
            if (typeof window.renderCharacterHub === 'function') {
                window.renderCharacterHub('inventory', document.getElementById('inventory-page-content'));
            }
        } else if (id === 'page-skills') {
            if (typeof window.renderCharacterHub === 'function') {
                window.renderCharacterHub('skills', document.getElementById('skills-page-content'));
            } else if (typeof window.renderSkillsHub === 'function') {
                window.renderSkillsHub(document.getElementById('skills-page-content'));
            }
        } else if (id === 'page-root') {
            if (typeof window.renderCharacterHub === 'function') {
                window.renderCharacterHub('root', document.getElementById('root-page-content'));
            } else if (typeof window.renderNguHanhLinhCanPanel === 'function') {
                window.renderNguHanhLinhCanPanel();
            }
        } else if (id === 'page-artifact') {
            if (typeof window.renderCharacterHub === 'function') {
                window.renderCharacterHub('artifact', document.getElementById('artifact-page-content'));
            } else if (typeof window.renderArtifactsPage === 'function') {
                window.renderArtifactsPage();
            }
        } else if (id === 'page-pet') {
            if (typeof window.ensurePetInit === 'function') window.ensurePetInit();
            if (typeof window.renderCharacterHub === 'function') {
                window.renderCharacterHub('pet', document.getElementById('pet-page-content'));
            } else if (typeof window.renderPetPage === 'function') {
                window.renderPetPage();
            }
        } else if (id.startsWith('page-sect')) {
            const sub = id.replace('page-sect-', '') || 'quests';
            const container = document.getElementById(`sect-${sub}-page-content`) || document.getElementById(`${id}-content`);
            if (typeof window.renderSectPage === 'function') {
                window.renderSectPage(sub, container);
            }
        } else if (id.startsWith('page-world')) {
            const sub = id.replace('page-world-', '') || 'market';
            const container = document.getElementById(`world-${sub}-page-content`) || document.getElementById(`${id}-content`) || document.getElementById('world-market-page-content');
            if (typeof window.renderWorldPage === 'function') {
                window.renderWorldPage(sub, container);
            } else if (sub === 'market' && typeof window.renderWorldMarketHub === 'function') {
                window.renderWorldMarketHub(container);
            } else if (sub === 'auction' && typeof window.renderWorldAuctionHub === 'function') {
                window.renderWorldAuctionHub(container);
            } else if (sub === 'dungeon' && typeof window.renderWorldDungeonHub === 'function') {
                window.renderWorldDungeonHub(container);
            } else if (sub === 'arena' && typeof window.renderWorldArenaHub === 'function') {
                window.renderWorldArenaHub(container);
            } else if (sub === 'encounter' && typeof window.renderWorldExpeditionDashboard === 'function') {
                window.renderWorldExpeditionDashboard(container);
            }
        }
    }

    /**
     * Mở bảng Chỉnh Sửa Bản Thể / Đăng Nhập Google (Modal Overlay)
     */
    function openProfileModal() {
        const modal = document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal');
        if (modal) {
            if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
            modal.classList.remove('hidden');
            modal.classList.add('is-open');
            modal.removeAttribute('aria-hidden');
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
            modal.classList.remove('is-open', 'active', 'is-active');
            modal.style.setProperty('display', 'none', 'important');
        }
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
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
       HỆ THỐNG NHIỆM VỤ CHÍNH TUYẾN (MAIN QUEST LINE)
       ========================================================================== */
    function grantPlayerMaterial(itemId, name, count, type = 'herb') {
        const s = window.GameState;
        const ws = (typeof window !== 'undefined' ? window.state : null);
        
        // Add to GameState.inventory
        if (s) {
            if (!Array.isArray(s.inventory)) s.inventory = [];
            const existing = s.inventory.find(i => i && (i.id === itemId || i.key === itemId));
            if (existing) {
                existing.count = (Number(existing.count || existing.quantity) || 1) + count;
                existing.quantity = existing.count;
            } else {
                s.inventory.push({
                    id: itemId,
                    key: itemId,
                    name: name,
                    type: type,
                    category: type === 'ore' ? 'ores' : 'herbs',
                    count: count,
                    quantity: count,
                    desc: "Nguyên liệu " + name + " thu được trong quá trình tu hành.",
                    quality: 'common'
                });
            }
        }

        // Add to window.state.inventory
        if (ws) {
            if (!Array.isArray(ws.inventory)) ws.inventory = [];
            const existingWs = ws.inventory.find(i => i && (i.id === itemId || i.key === itemId));
            if (existingWs) {
                existingWs.count = (Number(existingWs.count || existingWs.quantity) || 1) + count;
                existingWs.quantity = existingWs.count;
            } else {
                ws.inventory.push({
                    id: itemId,
                    key: itemId,
                    name: name,
                    type: type,
                    category: type === 'ore' ? 'ores' : 'herbs',
                    count: count,
                    quantity: count,
                    desc: "Nguyên liệu " + name + " thu được trong quá trình tu hành.",
                    quality: 'common'
                });
            }
        }
    }

    function grantQuestStones(amount) {
        const num = Math.max(0, Number(amount) || 0);
        if (window.state) {
            window.state.stones = (Number(window.state.stones) || 0) + num;
            window.state.spiritStones = window.state.stones;
        }
        if (window.GameState) {
            window.GameState.stones = (Number(window.GameState.stones) || 0) + num;
            window.GameState.spiritStones = window.GameState.stones;
        }
    }

    function grantQuestJade(amount) {
        const num = Math.max(0, Number(amount) || 0);
        if (window.state) {
            window.state.immortalJade = (Number(window.state.immortalJade) || 0) + num;
            window.state.jade = window.state.immortalJade;
        }
        if (window.GameState) {
            window.GameState.immortalJade = (Number(window.GameState.immortalJade) || 0) + num;
            window.GameState.jade = window.GameState.immortalJade;
        }
    }

    function grantQuestExp(amount) {
        const num = Math.max(0, Number(amount) || 0);
        if (typeof window.addExp === 'function') {
            window.addExp(num);
        } else {
            if (window.state) window.state.exp = (Number(window.state.exp) || 0) + num;
            if (window.GameState) window.GameState.exp = (Number(window.GameState.exp) || 0) + num;
        }
    }

    const MAIN_QUEST_LINE = [
        {
            id: 'mq_1',
            step: 1,
            title: 'Vận Khí Tụ Linh',
            desc: 'Vận khí tụ linh đạt 100 Tu Vi bản nguyên để khai mở kinh mạch.',
            target: 100,
            getProgress: (s) => Math.min(100, Math.floor(Number(s.exp || window.state?.exp || 0) + (s.subRealmIndex > 0 || s.realmIndex > 0 || window.state?.realmIndex > 0 ? 100 : 0))),
            isDone: (s) => (Number(s.exp || window.state?.exp || 0) >= 100) || (s.subRealmIndex > 0) || (s.realmIndex > 0) || (window.state?.realmIndex > 0),
            rewardText: '+500 Linh Thạch',
            reward: () => {
                grantQuestStones(500);
            },
            onNavigate: () => {
                if (typeof window.closeAllModals === 'function') window.closeAllModals();
                if (typeof window.showGameToast === 'function') {
                    window.showGameToast('🧘 Đạo hữu hãy tĩnh tọa hoặc bấm Đan Điền để ngưng tụ linh khí!', 'info');
                }
            }
        },
        {
            id: 'mq_2',
            step: 2,
            title: 'Tiên Môn Gia Viên',
            desc: 'Vào Động Phủ > Tiên Môn Gia Viên và thu hoạch tài nguyên 1 lần.',
            target: 1,
            getProgress: (s) => (s.hasHarvestedEstate || window.state?.hasHarvestedEstate || s.estateHarvestCount > 0 ? 1 : 0),
            isDone: (s) => Boolean(s.hasHarvestedEstate || window.state?.hasHarvestedEstate || s.estateHarvestCount > 0),
            rewardText: '+10 Huyết Sâm, +10 Tử Linh Chi',
            reward: () => {
                grantPlayerMaterial('herb_huysam', 'Huyết Sâm Linh Thảo', 10, 'herb');
                grantPlayerMaterial('herb_linhchi', 'Tử Linh Chi', 10, 'herb');
            },
            onNavigate: () => {
                if (typeof window.openGiaVienModal === 'function') {
                    window.openGiaVienModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('page-gia-vien');
                }
            }
        },
        {
            id: 'mq_3',
            step: 3,
            title: 'Luyện Đan Sơ Khởi',
            desc: 'Vào Luyện Đan Phòng luyện thành công 1 viên Tụ Khí Đan.',
            target: 1,
            getProgress: (s) => (s.hasCraftedPill || window.state?.hasCraftedPill || s.craftedPillCount > 0 ? 1 : 0),
            isDone: (s) => Boolean(s.hasCraftedPill || window.state?.hasCraftedPill || s.craftedPillCount > 0),
            rewardText: '+1,000 Linh Thạch',
            reward: () => {
                grantQuestStones(1000);
            },
            onNavigate: () => {
                if (typeof window.openLuyenDanModal === 'function') {
                    window.openLuyenDanModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('modal-luyen-dan');
                }
            }
        },
        {
            id: 'mq_4',
            step: 4,
            title: 'Phục Dụng Đan Dược',
            desc: 'Mở Túi Đồ sử dụng Tụ Khí Đan gia tăng tu vi.',
            target: 1,
            getProgress: (s) => (s.hasUsedPill || window.state?.hasUsedPill || s.usedPillCount > 0 ? 1 : 0),
            isDone: (s) => Boolean(s.hasUsedPill || window.state?.hasUsedPill || s.usedPillCount > 0),
            rewardText: '+500 Tu Vi',
            reward: () => {
                grantQuestExp(500);
            },
            onNavigate: () => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('page-inventory');
                }
            }
        },
        {
            id: 'mq_5',
            step: 5,
            title: 'Xung Phá Cảnh Giới',
            desc: 'Đột phá lên Luyện Khí - Trung Kỳ (Tầng 2) hoặc cao hơn.',
            target: 1,
            getProgress: (s) => ((s.realmIndex > 0 || window.state?.realmIndex > 0 || (s.subRealmIndex != null && s.subRealmIndex >= 1)) ? 1 : 0),
            isDone: (s) => (s.realmIndex > 0 || window.state?.realmIndex > 0 || (s.subRealmIndex != null && s.subRealmIndex >= 1)),
            rewardText: '+15 Huyền Thiết Khoáng',
            reward: () => {
                grantPlayerMaterial('stone_ore', 'Huyền Thiết Khoáng', 15, 'ore');
            },
            onNavigate: () => {
                if (typeof window.attemptCultivationBreakthrough === 'function') {
                    window.attemptCultivationBreakthrough();
                } else if (typeof window.openDoKiepModal === 'function') {
                    window.openDoKiepModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('modal-do-kiep');
                }
            }
        },
        {
            id: 'mq_6',
            step: 6,
            title: 'Luyện Khí Đúc Kiếm',
            desc: 'Vào Luyện Khí Thất rèn 1 thanh Thanh Trúc Kiếm.',
            target: 1,
            getProgress: (s) => (s.hasForgedGear || window.state?.hasForgedGear || s.forgedGearCount > 0 ? 1 : 0),
            isDone: (s) => Boolean(s.hasForgedGear || window.state?.hasForgedGear || s.forgedGearCount > 0),
            rewardText: '+1,500 Linh Thạch',
            reward: () => {
                grantQuestStones(1500);
            },
            onNavigate: () => {
                if (typeof window.openLuyenKhiModal === 'function') {
                    window.openLuyenKhiModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('modal-luyen-khi');
                }
            }
        },
        {
            id: 'mq_7',
            step: 7,
            title: 'Trang Bị Thần Binh',
            desc: 'Trang bị Thanh Trúc Kiếm vào ô Pháp Bảo.',
            target: 1,
            getProgress: (s) => (s.hasEquippedWeapon || window.state?.hasEquippedWeapon || (window.state?.equipped && window.state.equipped.weapon) || (window.state?.inventory && window.state.inventory.some(i => i.equipped)) ? 1 : 0),
            isDone: (s) => Boolean(s.hasEquippedWeapon || window.state?.hasEquippedWeapon || (window.state?.equipped && window.state.equipped.weapon) || (window.state?.inventory && window.state.inventory.some(i => i.equipped))),
            rewardText: '+50 Điểm Cống Hiến Tông Môn',
            reward: (s) => {
                s.sectContribution = (Number(s.sectContribution) || 0) + 50;
                if (window.state) window.state.sectContribution = s.sectContribution;
            },
            onNavigate: () => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('page-inventory');
                }
            }
        },
        {
            id: 'mq_8',
            step: 8,
            title: 'Trấn Áp Yêu Ma',
            desc: 'Vào Trấn Yêu Tháp vượt qua Tầng 1 diệt trừ yêu ma.',
            target: 1,
            getProgress: (s) => ((Number(s.towerFloor || window.state?.towerFloor || 1) >= 2 || (s.towerMaxFloor && s.towerMaxFloor >= 2) || (window.state?.towerMaxFloor && window.state.towerMaxFloor >= 2)) ? 1 : 0),
            isDone: (s) => (Number(s.towerFloor || window.state?.towerFloor || 1) >= 2 || (s.towerMaxFloor && s.towerMaxFloor >= 2) || (window.state?.towerMaxFloor && window.state.towerMaxFloor >= 2)),
            rewardText: '+2,000 Linh Thạch, +1 Đan Phương (Tẩy Tủy Đan)',
            reward: (s) => {
                grantQuestStones(2000);
                if (!Array.isArray(s.unlockedRecipes)) s.unlockedRecipes = [];
                if (!s.unlockedRecipes.includes('recipe_taytuy')) s.unlockedRecipes.push('recipe_taytuy');
                if (!s.unlockedRecipes.includes('recipe_tay_tuy_dan')) s.unlockedRecipes.push('recipe_tay_tuy_dan');
                if (window.state) {
                    if (!Array.isArray(window.state.unlockedRecipes)) window.state.unlockedRecipes = [];
                    if (!window.state.unlockedRecipes.includes('recipe_taytuy')) window.state.unlockedRecipes.push('recipe_taytuy');
                    if (!window.state.unlockedRecipes.includes('recipe_tay_tuy_dan')) window.state.unlockedRecipes.push('recipe_tay_tuy_dan');
                }
                grantPlayerMaterial('recipe_taytuy_scroll', 'Đan Phương: Tẩy Tủy Đan', 1, 'manual');
            },
            onNavigate: () => {
                if (typeof window.openDemonTowerModal === 'function') {
                    window.openDemonTowerModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('modal-tran-yeu-thap');
                }
            }
        },
        {
            id: 'mq_9',
            step: 9,
            title: 'Ngũ Hành Tụ Bản',
            desc: 'Nâng cấp 1 Linh Căn bất kỳ lên cấp 5.',
            target: 5,
            getProgress: (s) => {
                const roots = s.roots || window.state?.playerLinhCan?.levels || window.state?.roots || {};
                const maxLvl = Math.max(1, ...Object.values(roots).map(r => (typeof r === 'number' ? r : (r?.level || 1))));
                return Math.min(5, maxLvl);
            },
            isDone: (s) => {
                const roots = s.roots || window.state?.playerLinhCan?.levels || window.state?.roots || {};
                const maxLvl = Math.max(1, ...Object.values(roots).map(r => (typeof r === 'number' ? r : (r?.level || 1))));
                return maxLvl >= 5;
            },
            rewardText: '+3,000 Tu Vi',
            reward: () => {
                grantQuestExp(3000);
            },
            onNavigate: () => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('page-root');
                }
            }
        },
        {
            id: 'mq_10',
            step: 10,
            title: 'Niết Bàn Trúc Cơ',
            desc: 'Độ Kiếp thành công bước vào Trúc Cơ Kỳ.',
            target: 1,
            getProgress: (s) => (s.realmIndex >= 1 || window.state?.realmIndex >= 1 ? 1 : 0),
            isDone: (s) => (s.realmIndex >= 1 || window.state?.realmIndex >= 1),
            rewardText: 'Mở khóa tính năng Auto + 50 Tiên Ngọc',
            reward: (s) => {
                s.unlockedAuto = true;
                if (window.state) window.state.unlockedAuto = true;
                grantQuestJade(50);
            },
            onNavigate: () => {
                if (typeof window.attemptCultivationBreakthrough === 'function') {
                    window.attemptCultivationBreakthrough();
                } else if (typeof window.openDoKiepModal === 'function') {
                    window.openDoKiepModal();
                } else if (typeof window.navigateTo === 'function') {
                    window.navigateTo('modal-do-kiep');
                }
            }
        }
    ];

    function handleMainQuestClick(event) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        const s = window.GameState || window.state;
        if (!s) return;
        const questIdx = Number(s.mainQuestIndex || 0);
        if (questIdx >= MAIN_QUEST_LINE.length) {
            if (typeof window.showGameToast === 'function') {
                window.showGameToast('Đạo hữu đã hoàn thành toàn bộ thiên mệnh chính tuyến khởi đầu!', 'info');
            }
            return;
        }
        const q = MAIN_QUEST_LINE[questIdx];
        if (q.isDone(s)) {
            claimMainQuestReward();
        } else if (typeof q.onNavigate === 'function') {
            q.onNavigate();
        }
    }

    function updateMainQuestUI() {
        const s = window.GameState || window.state;
        if (!s) return;
        const questIdx = Number(s.mainQuestIndex || 0);
        const widget = document.getElementById('main-quest-widget');
        if (!widget) return;

        const badgeEl = document.getElementById('main-quest-step-badge');
        const statusEl = document.getElementById('main-quest-status-text');
        const titleEl = document.getElementById('main-quest-title');
        const descEl = document.getElementById('main-quest-desc');
        const barEl = document.getElementById('main-quest-progress-bar');
        const progressEl = document.getElementById('main-quest-progress-text');
        const claimBtn = document.getElementById('btn-claim-main-quest');

        if (questIdx >= MAIN_QUEST_LINE.length) {
            widget.classList.remove('is-completed');
            if (badgeEl) badgeEl.textContent = '10/10';
            if (statusEl) {
                statusEl.textContent = 'Đại Viên Mãn';
                statusEl.className = 'text-[10px] text-amber-400 font-bold';
            }
            if (titleEl) titleEl.textContent = 'Thiên Mệnh Viên Mãn';
            if (descEl) descEl.textContent = 'Đạo hữu đã hoàn thành toàn bộ chuỗi 10 nhiệm vụ chính tuyến khởi đầu!';
            if (barEl) {
                barEl.style.width = '100%';
                barEl.className = 'h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-300';
            }
            if (progressEl) progressEl.textContent = '10/10';
            if (claimBtn) {
                claimBtn.disabled = true;
                claimBtn.className = 'self-center px-2 py-1 text-[11px] font-bold rounded border whitespace-nowrap bg-emerald-950/60 text-emerald-400 border-emerald-600/40 cursor-default';
                claimBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Đã Đạt';
            }
            return;
        }

        const q = MAIN_QUEST_LINE[questIdx];
        const progress = q.getProgress(s);
        const done = q.isDone(s);
        const pct = Math.min(100, Math.max(0, (progress / q.target) * 100));

        // Bật hào quang vàng kim viền thẻ khi nhiệm vụ đã hoàn thành
        widget.classList.toggle('is-completed', Boolean(done));

        if (badgeEl) badgeEl.textContent = (questIdx + 1) + '/' + MAIN_QUEST_LINE.length;
        if (statusEl) {
            statusEl.textContent = done ? 'Có thể nhận' : 'Đang thực hiện';
            statusEl.className = 'text-[10px] font-medium ' + (done ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400');
        }
        if (titleEl) titleEl.textContent = q.title;
        if (descEl) descEl.textContent = q.desc;
        if (barEl) barEl.style.width = pct + '%';
        if (progressEl) progressEl.textContent = progress.toLocaleString('vi-VN') + '/' + q.target.toLocaleString('vi-VN');

        if (claimBtn) {
            if (done) {
                claimBtn.disabled = false;
                claimBtn.className = 'self-center px-2.5 py-1 text-[11px] font-bold rounded border whitespace-nowrap bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] cursor-pointer animate-pulse transition-all transform hover:scale-105';
                claimBtn.innerHTML = '<i class="fa-solid fa-gift mr-1"></i>Nhận';
                claimBtn.setAttribute('title', 'Phần thưởng: ' + q.rewardText);
            } else {
                claimBtn.disabled = true;
                claimBtn.className = 'self-center px-2 py-1 text-[11px] font-bold rounded border transition-all duration-200 whitespace-nowrap bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed';
                claimBtn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i>Chưa';
                claimBtn.setAttribute('title', 'Thưởng: ' + q.rewardText);
            }
        }
    }

    function claimMainQuestReward() {
        const s = window.GameState || window.state;
        if (!s) return;
        const questIdx = Number(s.mainQuestIndex || 0);
        if (questIdx >= MAIN_QUEST_LINE.length) return;
        const q = MAIN_QUEST_LINE[questIdx];
        if (!q.isDone(s)) return;

        q.reward(s);
        const nextIdx = questIdx + 1;
        if (window.GameState) window.GameState.mainQuestIndex = nextIdx;
        if (window.state) window.state.mainQuestIndex = nextIdx;

        // Persist mainQuestIndex in localStorage
        try {
            localStorage.setItem('van_co_main_quest_v2', JSON.stringify({
                mainQuestIndex: nextIdx,
                hasHarvestedEstate: Boolean(window.GameState?.hasHarvestedEstate || window.state?.hasHarvestedEstate),
                hasCraftedPill: Boolean(window.GameState?.hasCraftedPill || window.state?.hasCraftedPill),
                hasUsedPill: Boolean(window.GameState?.hasUsedPill || window.state?.hasUsedPill),
                hasForgedGear: Boolean(window.GameState?.hasForgedGear || window.state?.hasForgedGear),
                hasEquippedWeapon: Boolean(window.GameState?.hasEquippedWeapon || window.state?.hasEquippedWeapon)
            }));
        } catch (_) {}

        if (typeof window.addLog === 'function') {
            window.addLog('📜 <span class="text-amber-300 font-bold">[Chính Tuyến ' + (questIdx + 1) + '/10]</span> Hoàn thành "' + q.title + '": <strong>' + q.rewardText + '</strong>!', 'text-amber-300 font-bold');
        }
        if (typeof window.showGameToast === 'function') {
            window.showGameToast('🎉 Hoàn thành Chính Tuyến: ' + q.title + '! (' + q.rewardText + ')', 'success');
        } else if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast('🎉 Hoàn thành Chính Tuyến: ' + q.title + '!', 'success');
        }

        if (typeof window.playSound === 'function') {
            window.playSound('levelup');
        }

        if (typeof window.recalculatePlayerStats === 'function') {
            window.recalculatePlayerStats();
        }
        if (typeof window.syncTopResourceBarFromState === 'function') {
            window.syncTopResourceBarFromState();
        }
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
        updateMainQuestUI();
    }

    function initMainQuestState() {
        try {
            const saved = JSON.parse(localStorage.getItem('van_co_main_quest_v2') || 'null');
            if (saved && typeof saved === 'object') {
                const qIdx = Number(saved.mainQuestIndex) || 0;
                if (window.GameState) {
                    window.GameState.mainQuestIndex = qIdx;
                    if (saved.hasHarvestedEstate) window.GameState.hasHarvestedEstate = true;
                    if (saved.hasCraftedPill) window.GameState.hasCraftedPill = true;
                    if (saved.hasUsedPill) window.GameState.hasUsedPill = true;
                    if (saved.hasForgedGear) window.GameState.hasForgedGear = true;
                    if (saved.hasEquippedWeapon) window.GameState.hasEquippedWeapon = true;
                }
                if (window.state) {
                    window.state.mainQuestIndex = qIdx;
                    if (saved.hasHarvestedEstate) window.state.hasHarvestedEstate = true;
                    if (saved.hasCraftedPill) window.state.hasCraftedPill = true;
                    if (saved.hasUsedPill) window.state.hasUsedPill = true;
                    if (saved.hasForgedGear) window.state.hasForgedGear = true;
                    if (saved.hasEquippedWeapon) window.state.hasEquippedWeapon = true;
                }
            }
        } catch (_) {}
        updateMainQuestUI();
    }
    window.initMainQuestState = initMainQuestState;

    /* ==========================================================================
       HỆ THỐNG THU HOẠCH BẾ QUAN (OFFLINE PROGRESS)
       ========================================================================== */
    let pendingOfflineGains = null;

    function formatOfflineDuration(diffSec) {
        if (diffSec >= 3600) {
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            return `${h} giờ ${m} phút`;
        }
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        return `${m} phút ${s} giây`;
    }

    function checkOfflineProgress() {
        if (window._offlineChecked) return;
        window._offlineChecked = true;

        const s = window.GameState;
        if (!s) return;

        const lastTime = window._lastSessionSaveTime || Number(s.lastSaveTime);
        if (!lastTime || isNaN(lastTime)) return;

        const diffSeconds = Math.min(43200, Math.floor((Date.now() - lastTime) / 1000));
        if (diffSeconds < 60) return; // Dưới 1 phút thì không tính bế quan

        const qiRate = Math.max(1, Number(s.qiRate || 10));
        const tuViEarned = Math.floor(diffSeconds * qiRate);
        const linhThachEarned = Math.floor(diffSeconds * 0.5);
        const herbsEarned = Math.floor(diffSeconds * 0.1);
        const oresEarned = Math.floor(diffSeconds * 0.08);

        pendingOfflineGains = {
            diffSeconds,
            tuViEarned,
            linhThachEarned,
            herbsEarned,
            oresEarned
        };

        const modal = document.getElementById('modal-be-quan-offline');
        if (!modal) return;

        const durEl = document.getElementById('offline-time-text');
        const tuviEl = document.getElementById('offline-gain-tuvi');
        const stonesEl = document.getElementById('offline-gain-stones');
        const herbsEl = document.getElementById('offline-gain-herbs');
        const oresEl = document.getElementById('offline-gain-ores');

        if (durEl) durEl.textContent = formatOfflineDuration(diffSeconds);
        if (tuviEl) tuviEl.textContent = `+${tuViEarned.toLocaleString('vi-VN')}`;
        if (stonesEl) stonesEl.textContent = `+${linhThachEarned.toLocaleString('vi-VN')}`;
        if (herbsEl) herbsEl.textContent = `+${herbsEarned.toLocaleString('vi-VN')}`;
        if (oresEl) oresEl.textContent = `+${oresEarned.toLocaleString('vi-VN')}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex', 'is-open');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
    }

    function claimOfflineProgress() {
        const modal = document.getElementById('modal-be-quan-offline');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex', 'is-open');
            modal.style.setProperty('display', 'none', 'important');
            modal.style.setProperty('pointer-events', 'none', 'important');
        }

        if (!pendingOfflineGains) return;
        const g = pendingOfflineGains;
        pendingOfflineGains = null;

        const s = window.GameState;
        if (!s) return;

        s.exp = (Number(s.exp) || 0) + g.tuViEarned;
        s.spiritStones = (Number(s.spiritStones) || 0) + g.linhThachEarned;

        if (g.herbsEarned > 0) {
            grantPlayerMaterial('herb_blood', 'Huyết Sâm', g.herbsEarned, 'herb');
        }
        if (g.oresEarned > 0) {
            grantPlayerMaterial('stone_ore', 'Huyền Thiết Khoáng', g.oresEarned, 'ore');
        }

        if (window.state) {
            window.state.exp = s.exp;
            window.state.spiritStones = s.spiritStones;
            window.state.herbs = (Number(window.state.herbs) || 0) + g.herbsEarned;
            window.state.ores = (Number(window.state.ores) || 0) + g.oresEarned;
        }

        const durStr = formatOfflineDuration(g.diffSeconds);
        const logMsg = `Đạo hữu xuất quan sau ${durStr} bế quan, lĩnh ngộ +${g.tuViEarned.toLocaleString('vi-VN')} Tu Vi, +${g.linhThachEarned.toLocaleString('vi-VN')} Linh Thạch, +${g.herbsEarned} Linh Thảo, +${g.oresEarned} Khoáng Thạch!`;

        if (typeof window.addLog === 'function') {
            window.addLog(logMsg, 'text-amber-300 font-bold');
        }
        if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast('Thu hoạch bế quan thành công!', 'success');
        }

        if (typeof window.saveGame === 'function') window.saveGame();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
    }

    window.MAIN_QUEST_LINE = MAIN_QUEST_LINE;
    window.updateMainQuestUI = updateMainQuestUI;
    window.claimMainQuestReward = claimMainQuestReward;
    window.handleMainQuestClick = handleMainQuestClick;
    globalThis.handleMainQuestClick = handleMainQuestClick;
    window.checkOfflineProgress = checkOfflineProgress;
    window.claimOfflineProgress = claimOfflineProgress;

    // Tự động khởi chạy khi trang tải xong
    function initFinalPolishFeatures() {
        if (typeof window.loadGame === 'function') {
            window.loadGame();
        }
        if (typeof window.checkOfflineProgress === 'function') {
            window.checkOfflineProgress();
        }
        if (typeof window.initMainQuestState === 'function') {
            window.initMainQuestState();
        } else if (typeof window.updateMainQuestUI === 'function') {
            window.updateMainQuestUI();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinalPolishFeatures);
    } else {
        setTimeout(initFinalPolishFeatures, 100);
    }

    // =========================================================================
    // KẾT NỐI TRẤN YÊU THÁP V4 QUA IFRAME & POSTMESSAGE
    // =========================================================================
    window.addEventListener('message', (event) => {
        if (!event.data || typeof event.data !== 'object') return;
        const { type, payload } = event.data;

        // 1. Khi Tháp báo sẵn sàng (tower-ready): gửi dữ liệu thật từ GameState vào Tháp
        if (type === 'van-thien-luc:tower-ready') {
            const iframe = document.getElementById('tran-yeu-thap-iframe');
            if (!iframe || !iframe.contentWindow) return;

            if (typeof window.sendTowerSyncData === 'function') {
                window.sendTowerSyncData();
            } else {
                const s = window.GameState || window.state || {};
                const realms = window.REALMS || [];
                const currentRealm = realms[s.realmIndex || 0] || { name: 'Luyện Khí Kỳ' };
                const effStats = (typeof window.getEffectiveStats === 'function') ? window.getEffectiveStats() : {};
                const savedTower = s.demonTower || {};

                const initData = {
                    characterName: s.player?.name || s.characterName || s.name || "Tiêu Dao Tử",
                    playerName: s.player?.name || s.characterName || s.name || "Tiêu Dao Tử",
                    realmName: currentRealm.name || "Luyện Khí Kỳ",
                    linhThach: Number(s.stones) || 0,
                    tuVi: Number(s.exp) || 0,
                    highestCleared: Math.max(0, (Number(s.towerFloor) || 1) - 1),
                    selectedFloor: savedTower.selectedFloor || Math.max(1, Number(s.towerFloor) || 1),
                    selectedTier: savedTower.selectedTier || Math.max(1, Math.ceil((Number(s.towerFloor) || 1) / 10)),
                    hero: {
                        name: s.player?.name || s.characterName || s.name || 'Tiêu Dao Tử',
                        realmIndex: Number(s.realmIndex) || 0,
                        tier: currentRealm.realmTier || 1,
                        maxHp: Number(effStats.maxHp ?? s.maxHp) || 1000,
                        hp: Number(effStats.maxHp ?? s.maxHp) || 1000,
                        atk: Number(effStats.atk ?? s.atk) || 100,
                        def: Number(effStats.def ?? s.def) || 50,
                        crit: Number(effStats.crit ?? s.crit) || 10,
                        eva: Number(effStats.dodge ?? s.dodge) || 5
                    },
                    activeManualId: savedTower.activeManualId || "thanh_lien_kiem_dien",
                    selectedUltId: savedTower.selectedUltId ?? 2,
                    capturedSouls: Array.isArray(savedTower.capturedSouls) ? savedTower.capturedSouls : [],
                    lootBag: Array.isArray(savedTower.lootBag) ? savedTower.lootBag : [],
                    activeGuardian: savedTower.activeGuardian || null
                };

                iframe.contentWindow.postMessage({
                    type: 'van-thien-luc:tower-init-data',
                    data: initData
                }, '*');
            }
        }
        // 2. Khi Tháp đồng bộ tiến độ / phần thưởng (tower-sync): cộng Linh Thạch, Tu Vi, vật phẩm và tầng vượt
        else if (type === 'van-thien-luc:tower-sync') {
            if (typeof window.handleTowerSyncMessage === 'function') {
                window.handleTowerSyncMessage(payload);
            } else {
                const s = window.GameState || window.state;
                if (s && payload) {
                    if (payload.linhThachGained && payload.linhThachGained > 0) {
                        if (typeof window.addSpiritStones === 'function') {
                            window.addSpiritStones(payload.linhThachGained);
                        } else {
                            s.stones = (Number(s.stones) || 0) + payload.linhThachGained;
                        }
                    } else if (payload.linhThachCost && payload.linhThachCost > 0) {
                        s.stones = Math.max(0, (Number(s.stones) || 0) - payload.linhThachCost);
                    }

                    if (payload.tuViGained && payload.tuViGained > 0) {
                        if (typeof window.addExp === 'function') {
                            window.addExp(payload.tuViGained);
                        } else {
                            s.exp = (Number(s.exp) || 0) + payload.tuViGained;
                        }
                    }

                    if (payload.floor) {
                        s.towerFloor = Math.max(Number(s.towerFloor) || 1, payload.floor + 1);
                        if (payload.floor >= 50) s.hasClearedTower50 = true;
                    }
                    if (payload.highestCleared !== undefined) {
                        s.towerFloor = Math.max(Number(s.towerFloor) || 1, payload.highestCleared + 1);
                        if (payload.highestCleared >= 50) s.hasClearedTower50 = true;
                    }

                    if (Array.isArray(payload.itemsGained) && payload.itemsGained.length > 0) {
                        payload.itemsGained.forEach(item => {
                            if (typeof window.addItemToInventory === 'function') {
                                window.addItemToInventory(item);
                            } else if (Array.isArray(s.inventory)) {
                                s.inventory.push(item);
                            }
                        });
                    }

                    if (!s.demonTower || typeof s.demonTower !== 'object') s.demonTower = {};
                    if (payload.highestCleared !== undefined) s.demonTower.highestCleared = payload.highestCleared;
                    if (payload.selectedFloor !== undefined) s.demonTower.selectedFloor = payload.selectedFloor;
                    if (payload.selectedTier !== undefined) s.demonTower.selectedTier = payload.selectedTier;
                    if (payload.capturedSouls) s.demonTower.capturedSouls = payload.capturedSouls;
                    if (payload.lootBag) s.demonTower.lootBag = payload.lootBag;
                    if (payload.activeManualId) s.demonTower.activeManualId = payload.activeManualId;
                    if (payload.selectedUltId !== undefined) s.demonTower.selectedUltId = payload.selectedUltId;
                    if (payload.activeGuardian) s.demonTower.activeGuardian = payload.activeGuardian;
                }
            }

            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();
            if (typeof window.syncAllUI === 'function') window.syncAllUI();
            else if (typeof window.updateHUD === 'function') window.updateHUD();

            if (payload && payload.action === 'close') {
                if (typeof window.closeDemonTowerModal === 'function') window.closeDemonTowerModal();
            }
        }
        // 3. Khi nhận lệnh đóng Tháp: đóng modal và quay về màn hình chính
        else if (type === 'van-thien-luc:tower-close') {
            if (typeof window.closeDemonTowerModal === 'function') {
                window.closeDemonTowerModal();
            } else {
                const modal = document.getElementById('modal-tran-yeu-thap');
                if (modal) {
                    modal.style.setProperty('display', 'none', 'important');
                    modal.classList.add('hidden');
                    modal.classList.remove('active');
                }
                if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
            }
        }
        // 4. Khi nhận kết quả chiến đấu custom (Universal Combat Engine)
        else if (type === 'van-thien-luc:custom-battle-result') {
            const result = event.data.result;
            const battle = event.data.battle || {};
            if (typeof handleCustomBattleOutcome === 'function') {
                handleCustomBattleOutcome(result, battle);
            }
        }
    });

    // The account module owns profile state and edit/new mode selection.
    // Keep these handlers only as a fallback while that module is loading.
    window.openGameModal = openGameModal;
    window.closeAllModals = closeAllModals;
    window.openProfileModal = window.openProfileModal || openProfileModal;
    window.closeProfileModal = window.closeProfileModal || closeProfileModal;
    window.openFeature = openFeature;
    window.closeAllFeaturePopups = closeAllModals;
    globalThis.openGameModal = openGameModal;
    globalThis.closeAllModals = closeAllModals;
    globalThis.openFeature = openFeature;
    globalThis.closeAllFeaturePopups = closeAllModals;
})();

// =========================================================================
// BỘ ĐIỀU PHỐI CHUẨN KIẾN TRÚC FRONTEND & THOÁT BẤT TỬ (PRINCIPAL ARCHITECT)
// Khóa và bảo vệ các hàm dùng chung: navigateTo, forceCloseAllPopups, syncAllUI
// Đóng tất cả popup/iframe, trả về màn hình chính sạch sẽ không kẹt lớp phủ pointer-events
// =========================================================================
const masterForceCloseAllPopups = function() {
    // 1. Dừng và đóng Trấn Yêu Tháp nếu đang chạy iframe
    const towerIframe = document.getElementById('tran-yeu-thap-iframe');
    if (towerIframe && towerIframe.contentWindow) {
        try {
            towerIframe.contentWindow.postMessage({ type: 'van-thien-luc:force-pause' }, '*');
        } catch (e) {}
    }
    if (typeof window.closeDemonTowerModal === 'function') {
        try { window.closeDemonTowerModal(); } catch (e) {}
    }

    // 2. Đóng cụ thể các hệ thống tính năng
    if (typeof window.closeProfileModal === 'function') {
        try { window.closeProfileModal(); } catch (e) {}
    }
    if (typeof window.closeGiaVienModal === 'function') {
        try { window.closeGiaVienModal(); } catch (e) {}
    }
    if (typeof window.closeDongPhuModal === 'function') {
        try { window.closeDongPhuModal(); } catch (e) {}
    }
    if (typeof window.closeLuyenDanModal === 'function') {
        try { window.closeLuyenDanModal(); } catch (e) {}
    }
    if (typeof window.closeLuyenKhiModal === 'function') {
        try { window.closeLuyenKhiModal(); } catch (e) {}
    }
    if (typeof window.closeKhuePhongModal === 'function') {
        try { window.closeKhuePhongModal(); } catch (e) {}
    }
    if (typeof window.closeDoKiepModal === 'function') {
        try { window.closeDoKiepModal(); } catch (e) {}
    }
    if (typeof window.closeSectModal === 'function') {
        try { window.closeSectModal(); } catch (e) {}
    }
    if (typeof window.closeCelestialOmenModal === 'function') {
        try { window.closeCelestialOmenModal(); } catch (e) {}
    }
    if (typeof window.closeCamNangModal === 'function') {
        try { window.closeCamNangModal(); } catch (e) {}
    }

    // 3. Danh sách modal/popup cụ thể
    const modalIds = [
        'modal-tran-yeu-thap',
        'modal-gia-vien',
        'modal-luyen-dan',
        'modal-luyen-khi',
        'modal-khue-phong',
        'modal-do-kiep',
        'profile-login-modal',
        'profile-account-modal',
        'sect-modal',
        'celestial-omen-modal',
        'cam-nang-modal',
        'modal-cam-nang',
        'modal-game-settings',
        'modal-be-quan-offline',
        'inventory-modal',
        'fortune-modal',
        'modal-ca-nhan',
        'modal-bang-phai',
        'dispatch-modal',
        'tam-ma-battle-modal',
        'heavenly-suppression-info-modal',
        'heavenly-suppression-alert-modal',
        'minor-breakthrough-modal',
        'major-breakthrough-modal',
        'breakthrough-failure-modal',
        'reset-confirm-modal',
        'cauldron-modal',
        'fire-modal',
        'alchemy-cauldron-select-modal',
        'pill-result-modal',
        'crafting-modal-overlay',
        'dual-cultivation-overlay'
    ];
    modalIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active', 'is-visible', 'is-open', 'is-active');
            el.classList.add('hidden');
        }
    });

    // 4. Mọi feature page & popup
    document.querySelectorAll('.feature-popup, .feature-page, .game-page, [id^="page-"]').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.classList.remove('active', 'is-visible', 'is-open', 'is-active');
        el.classList.add('hidden');
    });

    // 5. Backdrop & body classes
    document.querySelectorAll('.modal-backdrop, #feature-page-backdrop, #hub-modal-backdrop, #smart-slot-popover-backdrop, #ancient-scroll-backdrop, .dispatch-modal-backdrop, .xianxia-modal-backdrop').forEach(b => {
        b.style.setProperty('display', 'none', 'important');
        b.classList.remove('active', 'is-visible', 'is-open', 'is-active');
        b.classList.add('hidden');
    });

    document.body.classList.remove('has-active-modal', 'tower-v4-active', 'overflow-hidden');

    // 6. Khôi phục HUD & đóng các menu con
    if (typeof window.showMainScreenHUD === 'function') {
        try { window.showMainScreenHUD(); } catch (e) {}
    }
    if (typeof window.closeAllModals === 'function') {
        try { window.closeAllModals(); } catch (e) {}
    }
    if (typeof window.closeAllDropups === 'function') {
        try { window.closeAllDropups(); } catch (e) {}
    }
};

window.universalCloseAllModals = masterForceCloseAllPopups;
window.forceCloseAllPopups = masterForceCloseAllPopups;
globalThis.universalCloseAllModals = masterForceCloseAllPopups;
globalThis.forceCloseAllPopups = masterForceCloseAllPopups;

// Master Router Điều Hướng SPA
let _activeNavigateTo = function(pageId) {
    if (pageId === 'main-screen' || !pageId) {
        masterForceCloseAllPopups();
        return;
    }
    if (pageId === 'page-khue-phong' || pageId === 'modal-khue-phong') {
        if (typeof window.openKhuePhongModal === 'function') return window.openKhuePhongModal();
    }
    if (pageId === 'page-dan-cac' || pageId === 'modal-luyen-dan') {
        if (typeof window.openLuyenDanModal === 'function') return window.openLuyenDanModal();
    }
    if (pageId === 'page-khi-cac' || pageId === 'modal-luyen-khi') {
        if (typeof window.openLuyenKhiModal === 'function') return window.openLuyenKhiModal();
    }
    if (pageId === 'page-gia-vien' || pageId === 'modal-gia-vien' || pageId === 'page-dong-phu') {
        if (typeof window.openGiaVienModal === 'function') return window.openGiaVienModal();
    }
    if (pageId === 'page-tran-yeu-thap' || pageId === 'modal-tran-yeu-thap' || pageId === 'demon-tower-modal') {
        if (typeof window.openDemonTowerModal === 'function') return window.openDemonTowerModal();
    }
    if (pageId === 'modal-do-kiep') {
        if (typeof window.openDoKiepModal === 'function') return window.openDoKiepModal(null);
    }
    if (typeof window.openGameModal === 'function') {
        return window.openGameModal(pageId);
    }
    if (typeof window.switchPage === 'function') {
        return window.switchPage(pageId);
    }
};

try {
    Object.defineProperty(window, 'navigateTo', {
        get() { return _activeNavigateTo; },
        set(newFn) {
            if (typeof newFn === 'function' && newFn !== _activeNavigateTo) {
                const prevRouter = _activeNavigateTo;
                _activeNavigateTo = function(id) {
                    try { return prevRouter(id); } catch (e) { return newFn(id); }
                };
            }
        },
        configurable: true
    });
    globalThis.navigateTo = _activeNavigateTo;
} catch (e) {
    window.navigateTo = _activeNavigateTo;
    globalThis.navigateTo = _activeNavigateTo;
}

// Master UI Synchronizer
const masterSyncAllUI = function() {
    const s = (typeof window !== 'undefined' ? window.state : null) || (typeof state !== 'undefined' ? state : null);
    if (s && typeof GameState !== 'undefined' && typeof GameState.syncFromState === 'function') {
        try { GameState.syncFromState(s); } catch (e) {}
    }
    if (typeof window.updateHUD === 'function') {
        try { window.updateHUD(); } catch (e) {}
    }
};
window.syncAllUI = masterSyncAllUI;
globalThis.syncAllUI = masterSyncAllUI;

(function initUniversalCloseCoordinator() {
    function bindSafetyHandlers() {
        // 1. Phím ESC đóng tất cả
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.code === 'Escape' || e.keyCode === 27) {
                masterForceCloseAllPopups();
            }
        });

        // 2. Click mọi nút đóng hoặc vùng backdrop ngoài khung nội dung
        const closeButtonSelector = [
            '.btn-close-modal',
            '#profile-close-btn',
            '.profile-close-btn',
            '.encounter-close',
            '.btn-close-dispatch',
            '.btn-close-tower',
            '.master-immortal-close',
            '[data-close-modal]',
            '[data-close]',
            '.modal-close-btn',
            '.close-modal',
            '#btn-close-modal',
            '.close-btn',
            '.btn-close'
        ].join(', ');

        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target) return;

            // A. BẤM VÀO BẤT KỲ NÚT THOÁT / NÚT ĐÓNG
            if (target.closest(closeButtonSelector)) {
                e.preventDefault();
                e.stopPropagation();
                masterForceCloseAllPopups();
                return;
            }

            // B. LOẠI TRỪ: Bấm vào thanh menu điều hướng, dock, nút tu vi, thanh hành động hoặc bên trong card nội dung / các phòng toàn màn hình
            if (target.closest(
                '#bottom-menu, #bottom-nav, .dropup-content, .dropup-menu, .dropup-item, .dock-container, .dock-btn, .nav-btn, .topbar-tool-btn, ' +
                '#btn-cultivate-action, #btn-open-do-kiep, #tu-vi-bar, .crafting-container, .alchemy-main-wrap, .chamber-main-grid, .chamber-container, ' +
                '.estate-main-grid, .estate-content, .forging-main-container, .modal-card, .feature-page-content, .feature-page-inner, ' +
                '#modal-gia-vien, #modal-luyen-dan, #modal-luyen-khi, #modal-khue-phong, #modal-tran-yeu-thap, #modal-do-kiep, ' +
                '#page-inventory, #page-skills, #page-root, #page-artifact, #page-pet, ' +
                '#page-sect-quests, #page-sect-rank, #page-sect-shop, #page-sect-array, ' +
                '#page-world-market, #page-world-auction, #page-world-dungeon, #page-world-arena, #page-world-encounter'
            )) {
                return;
            }

            // B. BẤM VÀO VÙNG NỀN ĐEN BÊN NGOÀI KHUNG NỘI DUNG
            // 1. Target trực tiếp là lớp phủ/backdrop
            const isBackdropEl = (
                target.classList.contains('profile-account-overlay') ||
                target.classList.contains('modal-backdrop') ||
                target.classList.contains('dispatch-modal-backdrop') ||
                target.classList.contains('xianxia-modal-backdrop') ||
                target.classList.contains('crafting-modal-overlay') ||
                target.classList.contains('dual-cultivation-overlay') ||
                target.classList.contains('modal-overlay') ||
                target.id === 'feature-page-backdrop' ||
                target.id === 'hub-modal-backdrop' ||
                target.id === 'smart-slot-popover-backdrop' ||
                target.id === 'ancient-scroll-backdrop' ||
                target.id === 'profile-login-modal' ||
                target.id === 'profile-account-modal' ||
                target.id === 'sect-modal' ||
                target.id === 'celestial-omen-modal' ||
                target.id === 'modal-cam-nang' ||
                target.id === 'cam-nang-modal' ||
                target.id === 'tam-ma-battle-modal' ||
                target.id === 'heavenly-suppression-info-modal' ||
                target.id === 'heavenly-suppression-alert-modal' ||
                target.id === 'minor-breakthrough-modal' ||
                target.id === 'major-breakthrough-modal' ||
                target.id === 'breakthrough-failure-modal' ||
                target.id === 'reset-confirm-modal' ||
                target.id === 'dispatch-modal' ||
                target.id === 'cauldron-modal' ||
                target.id === 'fire-modal' ||
                target.id === 'alchemy-cauldron-select-modal' ||
                target.id === 'pill-result-modal'
            );

            // 2. Click bên trong modal overlay nhưng bên ngoài card nội dung (chỉ áp dụng cho modal nhỏ / dialog)
            let isClickOutsideCard = false;

            // Profile Modal (#profile-login-modal / #profile-account-modal)
            if (!isBackdropEl && target.closest('#profile-login-modal, #profile-account-modal')) {
                if (!target.closest('.profile-panel-card, .xianxia-glass-box, .profile-edit-box')) {
                    isClickOutsideCard = true;
                }
            }

            // Tông Môn (#sect-modal)
            if (!isBackdropEl && target.closest('#sect-modal')) {
                if (!target.closest('#sect-modal-card, .xianxia-panel')) {
                    isClickOutsideCard = true;
                }
            }

            // Dị Tượng Thiên Địa (#celestial-omen-modal)
            if (!isBackdropEl && target.closest('#celestial-omen-modal')) {
                if (!target.closest('.hub-modal, .xianxia-panel')) {
                    isClickOutsideCard = true;
                }
            }

            // Cẩm Nang Tu Tiên (#modal-cam-nang / #cam-nang-modal)
            if (!isBackdropEl && target.closest('#modal-cam-nang, #cam-nang-modal')) {
                if (!target.closest('.profile-panel-card, .xianxia-glass-box, .modal-card')) {
                    isClickOutsideCard = true;
                }
            }

            // Tuyệt đối KHÔNG đóng các trang toàn màn hình (Động Phủ, Luyện Đan, Luyện Khí, Khuê Phòng, Trấn Yêu Tháp, Túi Đồ) bằng backdrop click
            // Các phòng này chỉ đóng khi bấm nút [✖ ĐÓNG] hoặc điều hướng menu

            if (isBackdropEl || isClickOutsideCard) {
                masterForceCloseAllPopups();
            }
        });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', bindSafetyHandlers);
    } else {
        bindSafetyHandlers();
    }
})();

// ==========================================================================
// MASTER SIDEBAR CONTROLLERS: THU GỌN / MỞ RỘNG HAI BÊN
// ==========================================================================
window.togglePanel = function(bodyId, iconId, trigger) {
    // Khóa cố định sidebar trái luôn luôn hiển thị (không thu gọn)
    const panel = document.getElementById('left-panel');
    const aside = document.getElementById('hud-left');
    const body = document.getElementById(bodyId || 'left-card-body');
    if (panel) panel.classList.remove('is-collapsed', 'collapsed');
    if (aside) aside.classList.remove('is-collapsed', 'collapsed');
    if (body) {
        body.classList.remove('hidden');
        body.style.removeProperty('display');
    }
    const btn = trigger || document.querySelector('.hud-island-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'true');
};
globalThis.togglePanel = window.togglePanel;

window.toggleThienCoNhatKy = function() {
    // Khóa cố định sidebar phải luôn luôn hiển thị (không thu gọn)
    const panel = document.getElementById('right-panel');
    const aside = document.getElementById('hud-right');
    const body = document.getElementById('right-card-body');
    if (panel) panel.classList.remove('collapsed');
    if (aside) aside.classList.remove('collapsed');
    if (body) {
        body.classList.remove('hidden');
        body.style.removeProperty('display');
    }
    const btn = document.getElementById('toggle-thien-co-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
};
globalThis.toggleThienCoNhatKy = window.toggleThienCoNhatKy;

// =========================================================================
// UNIVERSAL COMBAT ENGINE DISPATCHER (VẠN CỔ TU TIÊN)
// Điều phối toàn bộ các trận chiến (Đấu Pháp Đài, Trảm Tâm Ma, Thí Luyện, Bí Cảnh)
// vào sàn đấu tran_yeu_thap_v4.html
// =========================================================================

function handleCustomBattleOutcome(result, battle) {
    const s = window.GameState || window.state || {};
    const mode = battle.mode || 'arena';

    if (result === 'victory') {
        if (typeof window.playSound === 'function') window.playSound('bell');

        if (mode === 'tamma') {
            s.tamMa = 0;
            s.daoTam = Math.min(100, (Number(s.daoTam) || 50) + 20);
            const tvReward = (battle.rewards && battle.rewards.tuVi) || 300000;
            if (typeof window.addExp === 'function') window.addExp(tvReward);
            else s.exp = (Number(s.exp) || 0) + tvReward;

            const msg = `🏆 Trảm Ma Đắc Đạo! Tâm ma tan biến, Đạo tâm tăng vọt (+${tvReward.toLocaleString('vi-VN')} Tu Vi)!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-amber-300 font-bold">${msg}</span>`, 'text-amber-300');
        } else if (mode === 'arena') {
            s.arenaPoints = (Number(s.arenaPoints) || 0) + 25;
            s.arenaRank = Math.max(1, (Number(s.arenaRank) || 100) - 1);
            s.arenaDefeatedList = s.arenaDefeatedList || [];
            if (battle.enemyId && !s.arenaDefeatedList.includes(battle.enemyId)) {
                s.arenaDefeatedList.push(battle.enemyId);
            }
            const ltReward = (battle.rewards && (battle.rewards.linhThach || battle.rewards.stones)) || 250000;
            const jadeReward = (battle.rewards && (battle.rewards.jade || battle.rewards.linhNgoc)) || 20;
            if (typeof window.addSpiritStones === 'function') window.addSpiritStones(ltReward);
            else s.stones = (Number(s.stones) || 0) + ltReward;
            s.jade = (Number(s.jade) || 0) + jadeReward;

            const msg = `🏆 Đấu Pháp Toàn Thắng! Đánh bại ${battle.name}, tăng Hạng Đấu Pháp Đài (+${ltReward.toLocaleString('vi-VN')} Linh Thạch, +${jadeReward} Linh Ngọc)!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-emerald-400 font-bold">${msg}</span>`, 'text-emerald-400');
        } else if (mode === 'sect_trial') {
            const contrib = (battle.rewards && battle.rewards.contribution) || 150;
            const ltReward = (battle.rewards && (battle.rewards.linhThach || battle.rewards.stones)) || 200000;
            s.sectContribution = (Number(s.sectContribution) || 0) + contrib;
            if (typeof window.addSpiritStones === 'function') window.addSpiritStones(ltReward);
            else s.stones = (Number(s.stones) || 0) + ltReward;

            const msg = `⛩️ Thí Luyện Đại Thắng! Kích bại ${battle.name} (+${contrib} Cống Hiến Tông Môn, +${ltReward.toLocaleString('vi-VN')} Linh Thạch)!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-cyan-300 font-bold">${msg}</span>`, 'text-cyan-300');
        } else if (mode === 'dungeon') {
            const ltReward = (battle.rewards && (battle.rewards.linhThach || battle.rewards.stones)) || 300000;
            const tvReward = (battle.rewards && battle.rewards.tuVi) || 500000;
            if (typeof window.addSpiritStones === 'function') window.addSpiritStones(ltReward);
            else s.stones = (Number(s.stones) || 0) + ltReward;
            if (typeof window.addExp === 'function') window.addExp(tvReward);
            else s.exp = (Number(s.exp) || 0) + tvReward;

            // Xử lý hoàn tất ải Bí Cảnh & Càn Quét
            const dungeonId = (battle.rewards && battle.rewards.dungeonId) || (battle.enemyId ? battle.enemyId.replace('dungeon_', '') : null);
            const list = (typeof window.DUNGEONS !== 'undefined') ? window.DUNGEONS : [];
            const dungeon = list.find(d => String(d.id) === String(dungeonId)) || list[battle.rewards?.dungeonIndex];
            const targetId = dungeon ? dungeon.id : (dungeonId || 1);

            s.dungeonsCleared = s.dungeonsCleared || {};
            const isFirstClear = !s.dungeonsCleared[targetId];
            s.dungeonsCleared[targetId] = {
                count: (s.dungeonsCleared[targetId]?.count || 0) + 1,
                timestamp: Date.now()
            };
            if (window.state && window.state !== s) {
                window.state.dungeonsCleared = window.state.dungeonsCleared || {};
                window.state.dungeonsCleared[targetId] = s.dungeonsCleared[targetId];
            }
            if (window.GameState && window.GameState !== s) {
                window.GameState.dungeonsCleared = window.GameState.dungeonsCleared || {};
                window.GameState.dungeonsCleared[targetId] = s.dungeonsCleared[targetId];
            }

            let firstClearBonusJade = 0;
            if (isFirstClear && dungeon && dungeon.firstClearJade) {
                firstClearBonusJade = Number(dungeon.firstClearJade) || 0;
                s.jade = (Number(s.jade) || 0) + firstClearBonusJade;
                s.immortalJade = s.jade;
                if (window.state && window.state !== s) {
                    window.state.jade = s.jade;
                    window.state.immortalJade = s.jade;
                }
                if (window.GameState && window.GameState !== s) {
                    window.GameState.jade = s.jade;
                    window.GameState.immortalJade = s.jade;
                }
            }

            // Trao vật phẩm rơi nếu có
            if (battle.rewards && battle.rewards.dropId) {
                const inv = (s && Array.isArray(s.inventory)) ? s.inventory : [];
                let existing = inv.find(i => i && i.id === battle.rewards.dropId);
                if (existing) {
                    existing.count = (Number(existing.count || existing.quantity) || 0) + 1;
                    existing.quantity = existing.count;
                } else {
                    inv.push({
                        id: battle.rewards.dropId,
                        name: battle.rewards.item || dungeon?.dropName || 'Bí Cảnh Linh Vật',
                        type: 'Đan Dược / Linh Vật',
                        count: 1,
                        quantity: 1,
                        desc: `Thu hoạch khi đại phá ${dungeon ? dungeon.name : battle.name}.`,
                        icon: 'fa-box',
                        rarity: 3
                    });
                }
                s.inventory = inv;
                if (window.state && window.state !== s) window.state.inventory = inv;
                if (window.GameState && window.GameState !== s) window.GameState.inventory = inv;
            }

            let msg = `🌀 Phá Bí Cảnh! Trảm sát ${battle.name} (+${ltReward.toLocaleString('vi-VN')} Linh Thạch, +${tvReward.toLocaleString('vi-VN')} Tu Vi)!`;
            if (isFirstClear) {
                msg += ` 🎉 Thủ Sát Thành Công! Mở khóa Càn Quét${firstClearBonusJade > 0 ? ` & Nhận thêm +${firstClearBonusJade} Tiên Ngọc 💎` : ''}!`;
            }
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-purple-300 font-bold">${msg}</span>`, 'text-purple-300');

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.refreshDungeonUI === 'function') window.refreshDungeonUI();
        } else if (mode === 'arena') {
            const targetRank = Number(battle.rewards?.targetRank);
            const curRank = Number(s.arenaRank || window.GameState?.arenaRank || 11);
            let promoted = false;
            if (targetRank && targetRank < curRank) {
                s.arenaRank = targetRank;
                if (window.state) window.state.arenaRank = targetRank;
                if (window.GameState) window.GameState.arenaRank = targetRank;
                promoted = true;
            }
            const ltReward = Number(battle.rewards?.linhThach) || 50000;
            const jadeReward = Number(battle.rewards?.jade) || 30;

            s.stones = (Number(s.stones) || 0) + ltReward;
            s.spiritStones = s.stones;
            s.jade = (Number(s.jade) || 0) + jadeReward;
            s.immortalJade = s.jade;

            if (window.state && window.state !== s) {
                window.state.stones = s.stones;
                window.state.spiritStones = s.stones;
                window.state.jade = s.jade;
                window.state.immortalJade = s.jade;
            }
            if (window.GameState && window.GameState !== s) {
                window.GameState.stones = s.stones;
                window.GameState.spiritStones = s.stones;
                window.GameState.jade = s.jade;
                window.GameState.immortalJade = s.jade;
            }

            const msg = promoted 
                ? `🏆 Đại Thắng Đấu Pháp Đài! Đánh bại ${battle.name}, đoạt lấy Hạng #${targetRank} (+${ltReward.toLocaleString('vi-VN')} Linh Thạch, +${jadeReward} Tiên Ngọc 💎)!`
                : `🏆 Đấu Pháp Đài Toàn Thắng trước ${battle.name}! (+${ltReward.toLocaleString('vi-VN')} Linh Thạch, +${jadeReward} Tiên Ngọc 💎)!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-amber-300 font-bold">${msg}</span>`, 'text-amber-300');

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.renderWorldPage === 'function') window.renderWorldPage('arena');
        } else if (mode === 'sect_trial') {
            const contribReward = Number(battle.rewards?.contribution) || 200;
            const ltReward = Number(battle.rewards?.linhThach) || 50000;
            
            s.sectContribution = (Number(s.sectContribution) || 0) + contribReward;
            s.sectPoints = s.sectContribution;
            s.stones = (Number(s.stones) || 0) + ltReward;
            s.spiritStones = s.stones;

            if (window.state && window.state !== s) {
                window.state.sectContribution = s.sectContribution;
                window.state.sectPoints = s.sectContribution;
                window.state.stones = s.stones;
                window.state.spiritStones = s.stones;
            }
            if (window.GameState && window.GameState !== s) {
                window.GameState.sectContribution = s.sectContribution;
                window.GameState.sectPoints = s.sectContribution;
                window.GameState.stones = s.stones;
                window.GameState.spiritStones = s.stones;
            }

            if (!Array.isArray(s.sectTrialsBeaten)) s.sectTrialsBeaten = [];
            if (battle.enemyId && !s.sectTrialsBeaten.includes(battle.enemyId)) {
                s.sectTrialsBeaten.push(battle.enemyId);
            }
            if (window.state && window.state !== s) {
                if (!Array.isArray(window.state.sectTrialsBeaten)) window.state.sectTrialsBeaten = [];
                if (battle.enemyId && !window.state.sectTrialsBeaten.includes(battle.enemyId)) {
                    window.state.sectTrialsBeaten.push(battle.enemyId);
                }
            }

            const msg = `⛩️ Vượt Thí Luyện Thành Công! Bản Tôn tiếp chiêu đại thắng trước ${battle.name} (+${contribReward} Cống Hiến, +${ltReward.toLocaleString('vi-VN')} Linh Thạch)!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-emerald-300 font-bold">${msg}</span>`, 'text-emerald-300 font-bold');

            if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
            if (typeof window.renderSectPage === 'function') window.renderSectPage('array');
        } else {
            const msg = `🏆 Đại Thắng Quyết Đấu trước ${battle.name}!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'success');
        }
    } else {
        // Defeat
        if (mode === 'tamma') {
            s.isInjured = true;
            if (window.state && window.state !== s) window.state.isInjured = true;
            const lostTv = Math.round((Number(s.exp) || 0) * 0.05);
            s.exp = Math.max(0, (Number(s.exp) || 0) - lostTv);
            if (window.state && window.state !== s) window.state.exp = s.exp;

            const msg = `⚠️ Tâm ma phản phệ! Thất bại trước ${battle.name}, tổn hao ${lostTv.toLocaleString('vi-VN')} Tu Vi và rơi vào Trọng Thương!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'error');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'danger');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-rose-400 font-bold">${msg}</span>`, 'text-rose-400');
        } else if (mode === 'arena') {
            const msg = `⚠️ Luận bàn thất bại trước ${battle.name}! Hãy tôi luyện thêm tu vi và thần thông rồi trở lại khiêu chiến!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'warning');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-rose-400 font-bold">${msg}</span>`, 'text-rose-400');
            if (typeof window.renderWorldPage === 'function') window.renderWorldPage('arena');
        } else if (mode === 'sect_trial') {
            const msg = `⚠️ Thí luyện thất bại trước ${battle.name}! Hãy tôi luyện thêm tu vi rồi tiếp tục khảo hạch!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'warning');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-rose-400 font-bold">${msg}</span>`, 'text-rose-400');
            if (typeof window.renderSectPage === 'function') window.renderSectPage('array');
        } else {
            s.isInjured = true;
            if (window.state && window.state !== s) window.state.isInjured = true;
            const msg = `⚠️ Thất bại trước ${battle.name}! Kinh mạch chấn thương, cần Vận Công Điều Tức (15s) hoặc dùng Hồi Huyết Đan!`;
            if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'error');
            else if (typeof window.showXianxiaToast === 'function') window.showXianxiaToast(msg, 'danger');
            if (typeof window.addLog === 'function') window.addLog(`<span class="text-rose-400 font-bold">${msg}</span>`, 'text-rose-400');
        }
    }

    if (typeof window.saveGame === 'function') window.saveGame();
    else if (typeof window.saveGameState === 'function') window.saveGameState();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.updateHUD === 'function') window.updateHUD();
}
window.handleCustomBattleOutcome = handleCustomBattleOutcome;
globalThis.handleCustomBattleOutcome = handleCustomBattleOutcome;

window.startUniversalBattle = function(enemyConfig) {
    if (!enemyConfig) return false;
    const s = window.GameState || window.state || {};

    // Kiểm tra trạng thái Trọng Thương
    if (s.isInjured || (s.heavyInjuryUntil && Date.now() < s.heavyInjuryUntil) || (s.hp !== undefined && s.hp <= 0)) {
        const warnMsg = '⚠️ Đang trọng thương, kinh mạch tổn hại! Hãy điều tức hoặc cắn đan hồi phục trước khi khiêu chiến!';
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(warnMsg, 'error');
        } else if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(warnMsg, 'danger');
        } else if (typeof window.addLog === 'function') {
            window.addLog(warnMsg, 'text-rose-400');
        }
        return false;
    }

    // Đóng tất cả modal/popup đang mở
    if (typeof window.closeAllModals === 'function') window.closeAllModals();
    if (typeof window.closeAllFeaturePopups === 'function') window.closeAllFeaturePopups();
    if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();

    // Mở modal Trấn Yêu Tháp
    const modal = document.getElementById('modal-tran-yeu-thap');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '9800', 'important');
        modal.classList.remove('hidden');
        modal.classList.add('active');
    }

    const iframe = document.getElementById('tran-yeu-thap-iframe');
    if (!iframe) return false;

    const sendBattlePayload = () => {
        try {
            const heroPayload = (typeof window.getTowerSyncPayload === 'function')
                ? window.getTowerSyncPayload()
                : null;
            if (heroPayload && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'van-thien-luc:tower-init-data',
                    data: heroPayload
                }, '*');
            }
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'van-thien-luc:start-custom-battle',
                    enemy: enemyConfig
                }, '*');
                iframe.contentWindow.postMessage({ type: 'van-thien-luc:tower-resume' }, '*');
            }
        } catch (e) {
            console.warn('[startUniversalBattle] send message error:', e);
        }
    };

    if (!iframe.src || iframe.src === 'about:blank' || iframe.getAttribute('src') === '') {
        iframe.src = './tran_yeu_thap_v4.html';
        iframe.onload = () => {
            setTimeout(sendBattlePayload, 200);
        };
    } else {
        sendBattlePayload();
        const prevOnload = iframe.onload;
        iframe.onload = function(ev) {
            if (typeof prevOnload === 'function') prevOnload.call(this, ev);
            setTimeout(sendBattlePayload, 200);
        };
    }

    return true;
};
globalThis.startUniversalBattle = window.startUniversalBattle;

// =========================================================================
// HỆ THỐNG ĐỘT PHÁ CẢNH GIỚI CHUẨN XIANXIA (TIỂU CẢNH GIỚI & THIÊN KIẾP)
// =========================================================================
window.attemptCultivationBreakthrough = function() {
    const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : null);
    if (!s) return;

    // 1. Kiểm tra trạng thái Trọng Thương
    if (s.isInjured || (s.heavyInjuryUntil && Date.now() < s.heavyInjuryUntil)) {
        const msg = '⚠️ Đạo hữu đang bị Trọng Thương, kinh mạch tắc nghẽn, không thể đột phá! Hãy dùng đan dược hoặc đả tọa chữa lành.';
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(msg, 'error');
        } else if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(msg, 'danger');
        }
        return;
    }

    const realmsArr = window.REALMS || window.REALMS_DATA || (typeof REALMS !== 'undefined' ? REALMS : []);
    const rIdx = Number(s.realmIndex) || 0;
    const currentRealm = realmsArr[rIdx] || { name: 'Luyện Khí Tầng 1', maxExp: 100 };
    const nextRealm = realmsArr[rIdx + 1];

    if (!nextRealm) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast('Đã đạt đỉnh cao cảnh giới của thế giới hiện tại!', 'info');
        }
        return;
    }

    const curExp = Number(s.exp) || 0;
    const reqExp = Number(currentRealm.maxExp) || 100;

    // 2. Kiểm tra Tu Vi: nếu chưa đủ, hiển thị Toast báo rõ số Tu Vi còn thiếu
    if (curExp < reqExp) {
        const missing = Math.ceil(reqExp - curExp);
        const msg = `Chưa đủ Tu Vi để đột phá! Còn thiếu ${missing.toLocaleString('vi-VN')} Tu Vi (${Math.floor(curExp).toLocaleString('vi-VN')}/${reqExp.toLocaleString('vi-VN')}).`;
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(msg, 'warning');
        } else if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(msg, 'warning');
        }
        return;
    }

    // 3. Đủ Tu Vi:
    // Kiểm tra có phải Đại Cảnh Giới / Bình Cảnh Cần Độ Kiếp không
    const isMajor = Boolean(
        currentRealm.isMajorBottleneck ||
        String(currentRealm.name || '').includes('Viên Mãn') ||
        String(currentRealm.name || '').includes('Đỉnh Phong')
    );

    if (isMajor) {
        // Mở sàn Thiên Kiếp Độ Kiếp
        if (typeof window.openDoKiepModal === 'function') {
            window.openDoKiepModal(nextRealm);
        } else {
            const modal = document.getElementById('modal-do-kiep');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                modal.style.setProperty('pointer-events', 'auto', 'important');
                modal.style.setProperty('z-index', '10000', 'important');
                modal.classList.add('active', 'flex');
                modal.classList.remove('hidden');
            }
        }
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`⚡ Chạm đỉnh Bình Cảnh! Chuẩn bị nghênh đón Thiên Kiếp để đột phá ${nextRealm.name}!`, 'breakthrough');
        }
    } else {
        // Tiểu cảnh giới: đột phá ngay lập tức
        s.exp = Math.max(0, curExp - reqExp);
        s.realmIndex = rIdx + 1;
        if (nextRealm.name) s.realm = nextRealm.name;

        if (typeof window.recalculatePlayerStats === 'function') {
            window.recalculatePlayerStats();
        } else if (typeof window.updatePlayerStats === 'function') {
            window.updatePlayerStats();
        }

        // Đảm bảo hồi phục 100% Khí Huyết và Pháp Lực sau khi chỉ số đã được tái tính toán
        if (s.maxHp) s.hp = s.maxHp;
        if (s.maxMp) s.mp = s.maxMp;

        if (typeof window.updateHUD === 'function') {
            window.updateHUD();
        }
        if (typeof window.saveGameState === 'function') {
            window.saveGameState();
        }

        const successMsg = `🎉 Đột phá thành công! Chúc mừng đạo hữu bước vào ${nextRealm.name}! Khí Huyết & Pháp Lực hồi đầy.`;
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(successMsg, 'breakthrough');
        } else if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(successMsg, 'breakthrough');
        }
        if (typeof window.addLog === 'function') {
            window.addLog(`🎉 <span class="text-amber-300 font-bold">[Đột Phá]</span> ${successMsg}`, 'text-amber-300');
        }
    }
};
globalThis.attemptCultivationBreakthrough = window.attemptCultivationBreakthrough;

// =========================================================================
// ROOM MODAL OPEN WRAPPERS: LUYỆN ĐAN, LUYỆN KHÍ, KHUÊ PHÒNG, GIA VIÊN
// =========================================================================
window.openLuyenDanModal = function() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
    if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
    const el = document.getElementById('modal-luyen-dan');
    if (el) {
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('z-index', '10000', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.classList.remove('hidden');
        el.classList.add('active', 'is-open', 'flex');
        if (typeof window.syncMaterialsFromInventory === 'function') window.syncMaterialsFromInventory();
        if (typeof window.renderRecipes === 'function') window.renderRecipes();
        if (typeof window.updateHeaderUI === 'function') window.updateHeaderUI();
    }
};
globalThis.openLuyenDanModal = window.openLuyenDanModal;

window.openLuyenKhiModal = function() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
    if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
    const el = document.getElementById('modal-luyen-khi');
    if (el) {
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('z-index', '10000', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.classList.remove('hidden');
        el.classList.add('active', 'is-open', 'flex');
        if (typeof window.renderBlueprints === 'function') window.renderBlueprints();
        if (typeof window.updateTopBarUI === 'function') window.updateTopBarUI();
    }
};
globalThis.openLuyenKhiModal = window.openLuyenKhiModal;

window.openKhuePhongModal = function() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
    if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
    const el = document.getElementById('modal-khue-phong');
    if (el) {
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('z-index', '10000', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.classList.remove('hidden');
        el.classList.add('active', 'is-open', 'flex');
        if (typeof window.updateUI === 'function') window.updateUI();
    }
};
globalThis.openKhuePhongModal = window.openKhuePhongModal;

window.openGiaVienModal = function() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof window.closeAllDropups === 'function') window.closeAllDropups();
    if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
    const modal = document.getElementById('modal-gia-vien');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '10000', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.classList.remove('hidden');
        modal.classList.add('active', 'is-open', 'flex');
        if (typeof window.updateEstateUI === 'function') window.updateEstateUI();
    }
};
globalThis.openGiaVienModal = window.openGiaVienModal;



// ============================================================================
// 1. HỆ THỐNG BẾ QUAN NGOẠI TUYẾN (OFFLINE PROGRESSION MODAL)
// ============================================================================
(function initOfflineProgressionSystem() {
    function formatOfflineDuration(totalSec) {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        const parts = [];
        if (hrs > 0) parts.push(`${hrs} giờ`);
        if (mins > 0) parts.push(`${mins} phút`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs} giây`);
        return parts.join(' ');
    }

    function showOfflineProgressionModal(offlineSeconds, gainedExp, gainedStones) {
        let modal = document.getElementById('offline-progression-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'offline-progression-modal';
            modal.className = 'fixed inset-0 z-[10500] flex items-center justify-center p-4';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.78)';
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="w-full max-w-md rounded-2xl border border-amber-500/40 p-6 text-slate-100 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative" style="background: rgba(9, 3, 12, 0.98);">
                <button type="button" aria-label="Đóng" onclick="document.getElementById('offline-progression-modal')?.remove()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 flex items-center justify-center cursor-pointer transition">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="text-center space-y-3">
                    <div class="text-4xl">🌙</div>
                    <h2 class="font-serif text-xl font-bold text-amber-300 tracking-wide">BẾ QUAN TỊNH TU THU HOẠCH</h2>
                    <p class="text-xs text-slate-400">Trong lúc đạo hữu bế quan ngoại tuyến, linh khí thiên địa vẫn âm thầm tụ hội.</p>
                    <div class="rounded-xl bg-amber-950/30 border border-amber-500/25 p-4 space-y-2 text-sm text-left">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400">⏳ Thời gian vắng mặt:</span>
                            <span class="font-bold text-amber-200">${formatOfflineDuration(offlineSeconds)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400">✨ Tu Vi tích lũy:</span>
                            <span class="font-bold text-emerald-300">+${gainedExp.toLocaleString('vi-VN')}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400">💎 Linh Thạch tích lũy:</span>
                            <span class="font-bold text-cyan-300">+${gainedStones.toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    <button id="btn-claim-offline-progress" type="button" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold font-serif text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.45)] cursor-pointer transition">
                        Thu Nạp Tu Vi
                    </button>
                </div>
            </div>
        `;

        const claimBtn = document.getElementById('btn-claim-offline-progress');
        if (claimBtn) {
            claimBtn.onclick = function () {
                const gs = window.GameState || window.state;
                if (gs) {
                    gs.exp = (Number(gs.exp) || 0) + gainedExp;
                    gs.stones = (Number(gs.stones) || 0) + gainedStones;
                    gs.lastActiveTime = Date.now();
                }
                if (window.state && window.state !== gs) {
                    window.state.exp = (Number(window.state.exp) || 0) + gainedExp;
                    window.state.stones = (Number(window.state.stones) || 0) + gainedStones;
                    window.state.lastActiveTime = Date.now();
                }
                if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
                if (typeof window.saveGameState === 'function') window.saveGameState();
                if (typeof window.syncAllUI === 'function') window.syncAllUI();
                if (typeof window.showGameToast === 'function') {
                    window.showGameToast(`🌙 Thu nạp thành công +${gainedExp.toLocaleString('vi-VN')} Tu Vi & +${gainedStones.toLocaleString('vi-VN')} Linh Thạch!`, 'success');
                }
                modal.remove();
            };
        }
    }

    window.checkOfflineProgression = function (forceTestSeconds) {
        const gs = window.GameState || window.state;
        if (!gs) return;
        const lastActive = Number(gs.lastActiveTime || gs.lastOnlineTime || 0);
        if (!lastActive && !forceTestSeconds) {
            gs.lastActiveTime = Date.now();
            return;
        }
        const rawSeconds = forceTestSeconds
            ? Number(forceTestSeconds)
            : Math.floor((Date.now() - lastActive) / 1000);
        if (rawSeconds < 60) return;

        const offlineSeconds = Math.min(43200, rawSeconds);
        const idleRate = typeof window.getQiPerSecond === 'function'
            ? Math.max(1, Number(window.getQiPerSecond()) || 10)
            : Math.max(1, Number(gs.qiPerSec) || 10);
        const gainedExp = Math.max(1, Math.floor(idleRate * 0.6 * offlineSeconds));
        const gainedStones = Math.max(1, Math.floor((offlineSeconds / 60) * 5));
        showOfflineProgressionModal(offlineSeconds, gainedExp, gainedStones);
    };

    // Lưu lastActiveTime mỗi 3 giây (chỉ khi đã load xong)
    setInterval(() => {
        if (window.__IS_GAME_LOADED === false) return;
        const gs = window.GameState || window.state;
        if (gs) {
            gs.lastActiveTime = Date.now();
            if (window.state && window.state !== gs) window.state.lastActiveTime = gs.lastActiveTime;
        }
        if (typeof window.saveGame === 'function') window.saveGame();
        else if (typeof window.saveGameState === 'function') window.saveGameState();
    }, 3000);

    // Lưu tức thì khi tải lại trang (Ctrl+Shift+R) hoặc đóng tab
    window.addEventListener('beforeunload', () => {
        if (window.__IS_GAME_LOADED === false) return;
        if (typeof window.saveGame === 'function') window.saveGame();
        else if (typeof window.saveGameState === 'function') window.saveGameState();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && window.__IS_GAME_LOADED !== false) {
            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Đảm bảo dữ liệu từ VAN_THIEN_LUC_SAVE_V1 được nạp an toàn
        try {
            const rawAcc = localStorage.getItem('VAN_THIEN_LUC_SAVE_V1') || localStorage.getItem('VAN_THIEN_LUC_ACCOUNT_SAVE') || localStorage.getItem('van_co_tu_tien_save_v2');
            if (rawAcc) {
                const parsed = JSON.parse(rawAcc);
                if (parsed && typeof parsed === 'object') {
                    const gs = window.GameState || window.state;
                    if (gs) Object.assign(gs, parsed);
                    if (window.state && window.state !== gs) Object.assign(window.state, parsed);
                }
            }
        } catch (err) {
            console.warn('[loadGame] Lỗi đọc dữ liệu từ localStorage:', err);
        }
        window.__IS_GAME_LOADED = true;
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();

        setTimeout(() => {
            if (typeof window.checkOfflineProgression === 'function') window.checkOfflineProgression();
        }, 700);
    });
})();

// Đóng modal Bế Quan bằng ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('offline-progression-modal')?.remove();
    }
});

// ============================================================================
// 3. MỞ THÔNG DÒNG CHẢY TÀI NGUYÊN, BẾ QUAN X5, PHÂN GIẢI, CƯỜNG HÓA & ĐIỂM DANH
// ============================================================================
(function initResourceFlowAndEndgameLoops() {
    function addMaterialToInventory(itemId, name, qty, icon = '🌿', type = 'material') {
        const gs = window.GameState || window.state;
        if (!gs) return;
        if (!Array.isArray(gs.inventory)) gs.inventory = [];
        const existing = gs.inventory.find(i => i && (i.id === itemId || i.name === name));
        if (existing) {
            existing.qty = (Number(existing.qty) || Number(existing.count) || 0) + qty;
            if (existing.count !== undefined) existing.count = existing.qty;
        } else {
            gs.inventory.push({ id: itemId, name, qty, count: qty, icon, type, rarity: 'linh' });
        }
        if (window.state && window.state !== gs) {
            if (!Array.isArray(window.state.inventory)) window.state.inventory = [];
            const ex2 = window.state.inventory.find(i => i && (i.id === itemId || i.name === name));
            if (ex2) {
                ex2.qty = (Number(ex2.qty) || Number(ex2.count) || 0) + qty;
                if (ex2.count !== undefined) ex2.count = ex2.qty;
            } else {
                window.state.inventory.push({ id: itemId, name, qty, count: qty, icon, type, rarity: 'linh' });
            }
        }
    }

    // 1A. Vốn khởi nghiệp tân thủ
    function grantStarterResourcesIfNeeded() {
        const gs = window.GameState || window.state;
        if (!gs || gs._starterResourcesGranted) return;
        gs._starterResourcesGranted = true;
        if ((Number(gs.stones) || 0) < 1500) {
            gs.stones = (Number(gs.stones) || 0) + 1500;
            if (window.state && window.state !== gs) window.state.stones = gs.stones;
        }
        addMaterialToInventory('mat_huyet_sam', 'Huyết Sâm', 10, '🌿', 'herb');
        addMaterialToInventory('mat_linh_chi', 'Linh Chi', 10, '🍄', 'herb');
        addMaterialToInventory('mat_huyen_thiet', 'Huyền Thiết Khoáng', 8, '🪨', 'ore');
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(grantStarterResourcesIfNeeded, 900);
    });

    // 1B. Rớt tài nguyên thật từ Trấn Yêu Tháp
    window.addEventListener('message', (event) => {
        const data = event?.data;
        if (!data || data.type !== 'van-thien-luc:tower-victory-reward') return;

        const floor = Math.max(1, Number(data.floor) || 1);
        const isBoss = Boolean(data.isBoss || floor % 5 === 0);
        const gs = window.GameState || window.state;
        if (!gs) return;

        const stonesGain = 150 * floor * (isBoss ? 3 : 1);
        gs.stones = (Number(gs.stones) || 0) + stonesGain;
        if (window.state && window.state !== gs) window.state.stones = gs.stones;

        const lootParts = [`+${stonesGain.toLocaleString('vi-VN')} Linh Thạch`];

        if (Math.random() < 0.7) {
            if (Math.random() < 0.6) {
                const qty = 2 + Math.floor(Math.random() * 4); // 2-5
                const isSam = Math.random() < 0.5;
                addMaterialToInventory(isSam ? 'mat_huyet_sam' : 'mat_linh_chi', isSam ? 'Huyết Sâm' : 'Linh Chi', qty, isSam ? '🌿' : '🍄', 'herb');
                lootParts.push(`+${qty} ${isSam ? 'Huyết Sâm' : 'Linh Chi'}`);
            } else {
                const qty = 2 + Math.floor(Math.random() * 3); // 2-4
                addMaterialToInventory('mat_huyen_thiet', 'Huyền Thiết Khoáng', qty, '🪨', 'ore');
                lootParts.push(`+${qty} Huyền Thiết Khoáng`);
            }
        }

        if (isBoss && Math.random() < 0.3) {
            addMaterialToInventory('mat_yeu_dan', 'Yêu Đan', 1, '🔮', 'core');
            lootParts.push('+1 Yêu Đan');
        }

        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`🗼 Thắng Tầng ${floor}: ${lootParts.join(', ')}`, 'success');
        }
    });

    // 2A. Bế Quan Tụ Khí (x5 Tốc Độ trong 60s)
    window.activateBeQuanX5 = function () {
        const gs = window.GameState || window.state;
        if (!gs) return;
        const now = Date.now();
        if (gs.beQuanX5Until && gs.beQuanX5Until > now) {
            const rem = Math.ceil((gs.beQuanX5Until - now) / 1000);
            if (typeof window.showGameToast === 'function') window.showGameToast(`🔥 Đang trong trạng thái Đốn Ngộ x5 (còn ${rem}s)!`, 'info');
            return;
        }

        const inv = Array.isArray(gs.inventory) ? gs.inventory : [];
        const pill = inv.find(i => i && (i.id === 'tu_khi_dan' || (i.name && i.name.includes('Tụ Khí Đan'))) && (Number(i.qty) || Number(i.count) || 0) > 0);
        if (pill) {
            pill.qty = Math.max(0, (Number(pill.qty) || Number(pill.count) || 1) - 1);
            if (pill.count !== undefined) pill.count = pill.qty;
        } else if ((Number(gs.stones) || 0) >= 500) {
            gs.stones -= 500;
            if (window.state && window.state !== gs) window.state.stones = gs.stones;
        } else {
            if (typeof window.showGameToast === 'function') window.showGameToast('⚠️ Cần 500 Linh Thạch hoặc 1 Tụ Khí Đan để Bế Quan x5!', 'error');
            return;
        }

        gs.beQuanX5Until = now + 60000;
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.showGameToast === 'function') {
            window.showGameToast('🔥 Kích hoạt ĐỐN NGỘ! Tốc độ hấp thu Tu Vi x5 trong 60 giây!', 'success');
        }
    };

    // Tick x5 Tu Vi & hiệu ứng hào quang vàng trên thanh tiến độ
    setInterval(() => {
        const gs = window.GameState || window.state;
        if (!gs) return;
        const btn = document.getElementById('btn-be-quan-x5');
        const bar = document.getElementById('cultivation-bar') || document.getElementById('tu-vi-bar');
        const now = Date.now();
        if (gs.beQuanX5Until && gs.beQuanX5Until > now) {
            const rem = Math.ceil((gs.beQuanX5Until - now) / 1000);
            // Lượng Tu Vi x5 được cộng trực tiếp trong GameLoop (js/app.js); ở đây chỉ cập nhật giao diện.
            if (btn) {
                btn.textContent = `🔥 Đốn Ngộ x5 (${rem}s)`;
                btn.classList.add('bg-amber-400', 'text-slate-950', 'animate-pulse');
            }
            if (bar) bar.style.boxShadow = '0 0 22px rgba(251, 191, 36, 0.55)';
        } else if (btn && btn.textContent.includes('Đốn Ngộ')) {
            btn.textContent = '🔥 Bế Quan x5';
            btn.classList.remove('bg-amber-400', 'text-slate-950', 'animate-pulse');
            if (bar) bar.style.boxShadow = '';
        }
    }, 1000);

    // 2B. Phân Giải Nhanh Phẩm Cấp Thấp trong Túi Đồ
    window.salvageLowTierInventory = function () {
        const gs = window.GameState || window.state;
        if (!gs || !Array.isArray(gs.inventory)) return;
        let count = 0;
        let stonesGain = 0;
        let oreGain = 0;
        const kept = [];
        for (const item of gs.inventory) {
            if (!item) continue;
            const r = String(item.rarity || item.tier || '').toLowerCase();
            const isLow = r === 'pham' || r === 'linh' || r === 'common' || r === 'uncommon' || r === 'ha' || r === 'trung';
            const isSalvageable = item.type === 'weapon' || item.type === 'armor' || item.type === 'equipment' || item.type === 'pill';
            if (isLow && isSalvageable && !item.isEquipped) {
                const q = Math.max(1, Number(item.qty) || Number(item.count) || 1);
                count += q;
                stonesGain += q * 60;
                oreGain += q * 1;
            } else {
                kept.push(item);
            }
        }
        if (count === 0) {
            if (typeof window.showGameToast === 'function') window.showGameToast('ℹ️ Không có trang bị/đan dược Hạ-Trung phẩm dư thừa để phân giải.', 'info');
            return;
        }
        gs.inventory = kept;
        if (window.state && window.state !== gs) window.state.inventory = kept;
        gs.stones = (Number(gs.stones) || 0) + stonesGain;
        if (window.state && window.state !== gs) window.state.stones = gs.stones;
        addMaterialToInventory('mat_huyen_thiet', 'Huyền Thiết Khoáng', oreGain, '🪨', 'ore');
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`♻️ Đã phân giải ${count} món đồ thừa ➔ +${stonesGain.toLocaleString('vi-VN')} Linh Thạch & +${oreGain} Huyền Thiết Khoáng!`, 'success');
        }
    };

    // 3A. Cường Hóa Trang Bị (+1 đến +15)
    window.enhanceEquippedGear = function (slotKey = 'weapon') {
        const gs = window.GameState || window.state;
        if (!gs) return;
        if (!gs.gearEnhance) gs.gearEnhance = { weapon: 0, armor: 0, artifact1: 0, artifact2: 0, artifact3: 0 };
        const curLvl = Number(gs.gearEnhance[slotKey]) || 0;
        if (curLvl >= 15) {
            if (typeof window.showGameToast === 'function') window.showGameToast('✨ Trang bị đã đạt tối đa +15!', 'info');
            return;
        }
        const reqStones = (curLvl + 1) * 300;
        const reqOre = curLvl + 2;
        const inv = Array.isArray(gs.inventory) ? gs.inventory : [];
        const oreItem = inv.find(i => i && (i.id === 'mat_huyen_thiet' || (i.name && i.name.includes('Huyền Thiết'))));
        const hasOre = Number(oreItem?.qty || oreItem?.count || 0);

        if ((Number(gs.stones) || 0) < reqStones || hasOre < reqOre) {
            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`⚠️ Cần ${reqStones.toLocaleString('vi-VN')} Linh Thạch & ${reqOre} Huyền Thiết Khoáng!`, 'error');
            }
            return;
        }
        gs.stones -= reqStones;
        if (window.state && window.state !== gs) window.state.stones = gs.stones;
        oreItem.qty = hasOre - reqOre;
        if (oreItem.count !== undefined) oreItem.count = oreItem.qty;

        gs.gearEnhance[slotKey] = curLvl + 1;
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`⚒️ Cường hóa thành công lên +${curLvl + 1} (+${(curLvl + 1) * 12}% chỉ số gốc)!`, 'success');
        }
    };

    // 3B. Thưởng Điểm Danh / Thiên Đạo Ban Phúc Hàng Ngày
    window.openDailyBlessingModal = function () {
        let modal = document.getElementById('daily-blessing-modal');
        if (modal) modal.remove();

        const gs = window.GameState || window.state || {};
        const todayStr = new Date().toISOString().slice(0, 10);
        const claimedToday = gs.lastDailyBlessingDate === todayStr;

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diffSec = Math.max(0, Math.floor((tomorrow - now) / 1000));
        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);

        modal = document.createElement('div');
        modal.id = 'daily-blessing-modal';
        modal.className = 'fixed inset-0 z-[10600] flex items-center justify-center p-4';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.innerHTML = `
            <div class="w-full max-w-md rounded-2xl border border-amber-500/40 p-6 text-slate-100 shadow-2xl relative" style="background: rgba(9, 3, 12, 0.98);">
                <button type="button" onclick="document.getElementById('daily-blessing-modal')?.remove()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 flex items-center justify-center cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
                <div class="text-center space-y-3">
                    <div class="text-4xl">🎁</div>
                    <h3 class="font-serif text-xl font-bold text-amber-300">PHÚC LỢI THIÊN ĐẠO HÀNG NGÀY</h3>
                    <p class="text-xs text-slate-400">Mỗi ngày đạo hữu được Thiên Đạo ban phúc một lần để trợ lực tu hành.</p>
                    <div class="rounded-xl bg-amber-950/30 border border-amber-500/30 p-3.5 text-xs space-y-1.5 text-left">
                        <div>💎 <b class="text-cyan-300">+2,000 Linh Thạch</b></div>
                        <div>💠 <b class="text-purple-300">+10 Tiên Ngọc</b></div>
                        <div>💊 <b class="text-emerald-300">+5 Ngộ Đạo Đan</b></div>
                    </div>
                    ${claimedToday ? `
                        <div class="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono">
                            Đã nhận hôm nay • Làm mới sau ${h} giờ ${m} phút
                        </div>
                    ` : `
                        <button type="button" onclick="claimDailyBlessing()" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.45)]">
                            Nhận Phúc Lợi Ngay
                        </button>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.claimDailyBlessing = function () {
        const gs = window.GameState || window.state;
        if (!gs) return;
        const todayStr = new Date().toISOString().slice(0, 10);
        if (gs.lastDailyBlessingDate === todayStr) return;

        gs.lastDailyBlessingDate = todayStr;
        gs.stones = (Number(gs.stones) || 0) + 2000;
        gs.jade = (Number(gs.jade) || 0) + 10;
        if (window.state && window.state !== gs) {
            window.state.stones = gs.stones;
            window.state.jade = gs.jade;
        }
        addMaterialToInventory('ngo_dao_dan', 'Ngộ Đạo Đan', 5, '💊', 'pill');
        if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.showGameToast === 'function') {
            window.showGameToast('🎁 Đã nhận Phúc Lợi Thiên Đạo: +2,000 Linh Thạch, +10 Tiên Ngọc, +5 Ngộ Đạo Đan!', 'success');
        }
        document.getElementById('daily-blessing-modal')?.remove();
    };

    // Tự động gắn nút Phân Giải vào #page-inventory khi mở
    setInterval(() => {
        const invPage = document.getElementById('page-inventory');
        if (invPage && !invPage.classList.contains('hidden') && !document.getElementById('btn-salvage-low-tier')) {
            const btn = document.createElement('button');
            btn.id = 'btn-salvage-low-tier';
            btn.type = 'button';
            btn.onclick = window.salvageLowTierInventory;
            btn.className = 'mb-3 px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer transition';
            btn.textContent = '♻️ Phân Giải Đồ Thừa (Hạ/Trung Phẩm)';
            invPage.prepend(btn);
        }
    }, 800);
})();

// ============================================================================
// 4. HIỆU ỨNG CHỮ SỐ +TU VI BAY NHẸ TRÊN ĐẦU NHÂN VẬT (#floating-text-container)
// Được gọi trực tiếp từ GameLoop() trong js/app.js với lượng Tu Vi thật vừa cộng.
// ============================================================================
window.spawnCultivationFloatingText = function (amount) {
    const val = Math.floor(Number(amount) || 0);
    if (val <= 0 || document.hidden) return;

    // Chỉ dùng container nằm trong #center-avatar (tránh trùng ID do bản dựng cũ tạo ra)
    const container = document.querySelector('#center-avatar #floating-text-container')
        || document.getElementById('floating-text-container');
    if (!container || container.getClientRects().length === 0) return;

    // Chỉ hiển thị khi đang ở màn hình chính (không có bảng chức năng đè lên)
    const hub = document.getElementById('hub-modal-backdrop');
    if (hub && !hub.classList.contains('hidden')) return;

    // Giới hạn tối đa 3 thẻ cùng lúc để mượt 60 FPS
    const existing = container.querySelectorAll('.cultivation-float-text');
    for (let i = 0; i <= existing.length - 3; i++) existing[i].remove();

    const gs = window.GameState || window.state;
    const isBeQuanX5 = Boolean(gs?.beQuanX5Until && gs.beQuanX5Until > Date.now());
    const formatted = typeof window.formatNumber === 'function'
        ? window.formatNumber(val)
        : val.toLocaleString('vi-VN');

    const span = document.createElement('span');
    span.className = 'cultivation-float-text' + (isBeQuanX5 ? ' is-be-quan' : '');
    span.textContent = `+${formatted} Tu Vi`;
    span.addEventListener('animationend', () => span.remove(), { once: true });
    container.appendChild(span);
    // Dự phòng khi animation bị tắt (prefers-reduced-motion)
    setTimeout(() => span.remove(), 1600);
};
