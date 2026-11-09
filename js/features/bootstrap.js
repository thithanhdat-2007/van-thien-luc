(function () {
    'use strict';

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

        const updatePanelDisplays = () => {
            const isDesktop = window.innerWidth >= 1025;
            const rightPanel = document.getElementById('right-panel');
            if (rightPanel) {
                rightPanel.style.setProperty('display', isDesktop ? 'flex' : 'none', 'important');
            }
            const leftPanel = document.getElementById('left-panel');
            if (leftPanel) {
                leftPanel.style.setProperty('display', isDesktop ? 'flex' : 'none', 'important');
            }
        };
        updatePanelDisplays();
        window.addEventListener('resize', updatePanelDisplays);

        const topBar = document.getElementById('top-bar');
        if (topBar) {
            topBar.style.setProperty('display', 'flex', 'important');
            topBar.style.setProperty('position', 'fixed', 'important');
            topBar.style.setProperty('top', '0', 'important');
            topBar.style.setProperty('height', '64px', 'important');
            topBar.style.setProperty('z-index', '50', 'important');
        }

        // Đồng bộ thanh Top Resource Bar & Bản Nguyên Tu Sĩ (Character UI)
        syncTopResourceBarFromState();
        renderCharacterUI();

        // Tự động hook vào updateHUD nếu có (chỉ hook 1 lần duy nhất)
        if (typeof window.updateHUD === 'function' && !window.__hudMasterHooked) {
            const prevHUD = window.updateHUD;
            window.updateHUD = function() {
                prevHUD.apply(this, arguments);
                syncTopResourceBarFromState();
                renderCharacterUI();
            };
            window.__hudMasterHooked = true;
        }

        // Lặp định kỳ 1s duy nhất cho Main Screen HUD, tự động tạm nghỉ khi đang mở Modal toàn màn hình
        if (window.__mainScreenSyncInterval) clearInterval(window.__mainScreenSyncInterval);
        window.__mainScreenSyncInterval = setInterval(function() {
            if (document.body.classList.contains('has-active-modal')) return;
            syncTopResourceBarFromState();
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
