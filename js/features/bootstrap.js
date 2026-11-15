(function () {
    'use strict';

/* ==========================================================================
   ĐIỀU HƯỚNG SPA & MỞ POP-MENU / MODAL QUY CHUẨN
   ========================================================================== */
function navigateTo(pageId) {
    if (pageId === 'main-screen' || !pageId) {
        if (typeof window.closeAllModals === 'function') window.closeAllModals();
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
        return;
    }
    if (typeof window.openGameModal === 'function') {
        window.openGameModal(pageId);
        return;
    }
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

// ============================================================================
// MASTER SAVE GAME & AUTO-SAVE INDICATOR (2s + INSTANT)
// ============================================================================
(function initMasterSaveSystem() {
    const KEY = (typeof window !== 'undefined' && window.MASTER_SAVE_KEY) ? window.MASTER_SAVE_KEY : 'VAN_THIEN_LUC_MASTER_SAVE';

    window.masterSaveGame = function () {
        if (window.__IS_GAME_LOADED === false) return false;
        try {
            if (typeof localStorage === 'undefined') return false;
            const s = window.GameState || window.state || {};
            if (!s || typeof s !== 'object') return false;

            if (window.state && window.GameState && window.state !== window.GameState) {
                Object.assign(s, window.state, window.GameState);
            }
            s.localAccountId = window.localAccountId || s.localAccountId || localStorage.getItem('VAN_THIEN_LUC_LOCAL_ACCOUNT_ID');
            s.lastSaveTime = Date.now();
            s.lastActiveTime = s.lastSaveTime;

            const payload = JSON.stringify(s);
            localStorage.setItem(KEY, payload);
            localStorage.setItem('VAN_THIEN_LUC_SAVE_V1', payload);
            localStorage.setItem('van_co_tu_tien_save_v2', payload);

            const statusEl = document.getElementById('cloud-sync-status');
            if (statusEl) {
                statusEl.textContent = '🟢 Đã Lưu Tự Động';
                statusEl.className = 'text-[10px] text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex-shrink-0';
            }

            let dot = document.getElementById('master-autosave-dot');
            if (!dot) {
                dot = document.createElement('div');
                dot.id = 'master-autosave-dot';
                dot.title = 'Đã lưu tự động';
                dot.style.cssText = 'position:fixed;bottom:8px;right:10px;width:8px;height:8px;border-radius:9999px;background:#34d399;box-shadow:0 0 8px #34d399;z-index:9999;opacity:0.85;pointer-events:none;transition:transform 0.2s;';
                document.body.appendChild(dot);
            }
            dot.style.transform = 'scale(1.5)';
            setTimeout(() => { if (dot) dot.style.transform = 'scale(1)'; }, 200);

            console.log(`[AutoSave] Đã lưu Tu Vi: ${Math.floor(Number(s.exp) || 0).toLocaleString('vi-VN')} | Linh Thạch: ${Math.floor(Number(s.stones) || 0).toLocaleString('vi-VN')}`);
            return true;
        } catch (err) {
            console.warn('[masterSaveGame] Lỗi ghi localStorage:', err);
            return false;
        }
    };

    window.saveGame = window.masterSaveGame;
    globalThis.saveGame = window.masterSaveGame;
    window.saveGameState = window.masterSaveGame;

    setInterval(() => {
        if (window.__IS_GAME_LOADED !== false) {
            window.masterSaveGame();
        }
    }, 2000);
})();
