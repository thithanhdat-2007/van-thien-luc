(function () {
    'use strict';
    /**
     * Đóng toàn bộ các Pop-menu / Modal chức năng để quay về Màn Hình Chính
     */
    let globalToastTimer = null;
    function showXianxiaToast(msg, type = 'info') {
        if (!msg) return;
        const cleanMsg = String(msg).replace(/\n+/g, ' • ');
        if (typeof window.addLog === 'function') {
            const logColor = type === 'error' ? 'text-rose-400' : (type === 'success' ? 'text-emerald-400' : 'text-amber-300');
            window.addLog(cleanMsg, logColor);
        }
        let toast = document.getElementById('xianxia-global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'xianxia-global-toast';
            toast.className = 'xianxia-global-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.className = `xianxia-global-toast toast--${type} is-visible`;
        toast.textContent = cleanMsg;
        if (globalToastTimer) clearTimeout(globalToastTimer);
        globalToastTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 3200);
    }
    window.showXianxiaToast = showXianxiaToast;
    globalThis.showXianxiaToast = showXianxiaToast;

    function closeAllFeaturePopups() {
        if (typeof window.switchPage === 'function') {
            window.switchPage('main-screen');
            return;
        }
        document.getElementById('feature-page-backdrop')?.classList.remove('is-visible', 'active');
        document.querySelectorAll('.feature-popup, .feature-page, .game-page').forEach((el) => {
            el.classList.remove('active', 'flex');
            el.classList.add('hidden');
            el.style.setProperty('display', 'none', 'important');
            // display:none already disables interaction. A persistent inline
            // pointer-events:none would leave the page unusable when reopened.
            el.style.removeProperty('pointer-events');
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

    // The account module owns profile state and edit/new mode selection.
    // Keep these handlers only as a fallback while that module is loading.
    window.openProfileModal = window.openProfileModal || openProfileModal;
    window.closeProfileModal = window.closeProfileModal || closeProfileModal;
    window.openFeature = openFeature;
    window.closeAllFeaturePopups = closeAllFeaturePopups;
    globalThis.openFeature = openFeature;
    globalThis.closeAllFeaturePopups = closeAllFeaturePopups;
})();
