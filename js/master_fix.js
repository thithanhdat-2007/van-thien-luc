/**
 * ============================================================================
 * VẤN THIÊN LỤC — BỘ ĐIỀU KHIỂN & CHỐNG LIỆT TẬP TRUNG (MASTER CONTROLLER & FIX)
 * File: js/master_fix.js
 * 
 * 1. Ép Nút Thoát (✖ ĐÓNG) luôn nổi trên cùng và bất tử (Fixed top-right, z-index 99999).
 * 2. Thống nhất bộ mở trang/modal chống liệt nút với fallback render tự động.
 * 3. Bọc try-catch chống sập script toàn diện & nối lại toàn bộ sự kiện các nút chính.
 * ============================================================================
 */

(() => {
    'use strict';

    console.log('⚡ [MasterFix] Đang khởi động bộ điều khiển chống liệt tập trung...');

    /* ==========================================================================
       1. INJECT CSS BẤT TỬ CHO NÚT THOÁT & MODAL TRÊN TOÀN GIAO DIỆN
       ========================================================================== */
    function injectMasterFixStyles() {
        if (document.getElementById('master-fix-immortal-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'master-fix-immortal-styles';
        styleEl.textContent = `
            /* Ép toàn bộ popup và trang full-page có z-index chuẩn 9500 */
            .feature-popup,
            .game-page,
            .feature-page,
            .modal-overlay,
            .profile-account-overlay,
            .xianxia-modal-backdrop,
            #hub-modal-backdrop,
            #celestial-omen-modal,
            #sect-modal,
            #reset-confirm-modal,
            #modal-be-quan-offline,
            #modal-game-settings,
            #modal-gia-vien,
            #modal-luyen-dan,
            #modal-luyen-khi,
            #modal-khue-phong,
            #modal-tran-yeu-thap,
            #demon-tower-modal,
            #modal-do-kiep,
            #minor-breakthrough-modal,
            #profile-login-modal,
            #profile-account-modal {
                z-index: 9500 !important;
            }

            /* NÚT THOÁT BẤT TỬ (✖ ĐÓNG) — Nổi tuyệt đối ở góc trên phải màn hình */
            .btn-close-modal,
            .encounter-close,
            .btn-close-dispatch,
            .master-immortal-close,
            #minor-breakthrough-close-btn,
            #hub-modal-backdrop .btn-close,
            #celestial-omen-modal .btn-close,
            #sect-modal .btn-close,
            [data-close] {
                position: fixed !important;
                top: 16px !important;
                right: 20px !important;
                z-index: 99999 !important;
                pointer-events: auto !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                background: rgba(15, 23, 42, 0.94) !important;
                color: #fca5a5 !important;
                border: 1.5px solid rgba(248, 113, 113, 0.75) !important;
                border-radius: 8px !important;
                padding: 6px 16px !important;
                font-family: 'Cinzel', 'Noto Serif', serif !important;
                font-size: 13px !important;
                font-weight: 800 !important;
                letter-spacing: 0.8px !important;
                text-transform: uppercase !important;
                box-shadow: 0 0 18px rgba(239, 68, 68, 0.45), 0 4px 12px rgba(0, 0, 0, 0.85) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            .btn-close-modal:hover,
            .encounter-close:hover,
            .btn-close-dispatch:hover,
            .master-immortal-close:hover,
            [data-close]:hover {
                background: rgba(220, 38, 38, 0.95) !important;
                color: #ffffff !important;
                border-color: #f87171 !important;
                box-shadow: 0 0 25px rgba(239, 68, 68, 0.85) !important;
                transform: scale(1.05) !important;
            }

            /* Đảm bảo trạng thái mở modal luôn hiển thị rõ ràng */
            .feature-popup.is-open,
            .feature-popup.active,
            .game-page.is-open,
            .game-page.active,
            .feature-page.is-open,
            .feature-page.active,
            .profile-account-overlay.is-open,
            .profile-account-overlay.active {
                opacity: 1 !important;
                pointer-events: auto !important;
            }

            /* Dropup Menu ở đáy màn hình */
            .dropup-menu.active,
            .dropup-menu.is-open {
                display: flex !important;
                flex-direction: column !important;
                pointer-events: auto !important;
                z-index: 10000 !important;
            }

            /* Fallback Grid Cards khi container rỗng */
            .master-fallback-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                gap: 1rem;
                padding: 1rem 0;
            }
            .master-fallback-card {
                background: rgba(15, 23, 42, 0.75);
                border: 1px solid rgba(251, 191, 36, 0.3);
                border-radius: 12px;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                transition: all 0.2s ease;
            }
            .master-fallback-card:hover {
                border-color: rgba(251, 191, 36, 0.7);
                box-shadow: 0 0 20px rgba(251, 191, 36, 0.25);
                transform: translateY(-2px);
            }
            .master-fallback-btn {
                margin-top: auto;
                padding: 8px 14px;
                border-radius: 8px;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.8), rgba(217, 119, 6, 0.9));
                color: #0f172a;
                font-weight: 800;
                font-size: 12px;
                font-family: 'Cinzel', serif;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid rgba(251, 191, 36, 0.5);
                cursor: pointer;
                transition: all 0.2s;
            }
            .master-fallback-btn:hover {
                filter: brightness(1.15);
                box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
            }

            /* Thanh Sub-navigation bên trong Popup */
            .popup-subnav-bar {
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
                max-width: 960px !important;
                margin: 8px auto 16px auto !important;
                padding: 6px 12px !important;
                background: rgba(15, 23, 42, 0.88) !important;
                border: 1px solid rgba(251, 191, 36, 0.4) !important;
                border-radius: 12px !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                z-index: 9600 !important;
            }
            .popup-subnav-btn {
                padding: 6px 14px !important;
                border-radius: 8px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                font-family: 'Cinzel', 'Noto Serif', serif !important;
                color: #cbd5e1 !important;
                background: rgba(30, 41, 59, 0.7) !important;
                border: 1px solid rgba(148, 163, 184, 0.25) !important;
                cursor: pointer !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .popup-subnav-btn:hover {
                color: #fde68a !important;
                border-color: rgba(251, 191, 36, 0.7) !important;
                background: rgba(51, 65, 85, 0.9) !important;
                transform: translateY(-1px) !important;
            }
            .popup-subnav-btn.is-active {
                color: #0f172a !important;
                background: linear-gradient(135deg, #fbbf24, #d97706) !important;
                border-color: #f59e0b !important;
                box-shadow: 0 0 14px rgba(245, 158, 11, 0.55) !important;
                font-weight: 800 !important;
            }
        `;
        document.head.appendChild(styleEl);
    }
    injectMasterFixStyles();

    /* ==========================================================================
       2. HÀM ĐÓNG TOÀN DIỆN BẤT TỬ (window.forceCloseAllPopups)
       ========================================================================== */
    function forceCloseAllPopups() {
        try {
            // 1. Dọn dẹp backdrop
            const backdrop = document.getElementById('feature-page-backdrop');
            if (backdrop) {
                backdrop.classList.remove('is-visible', 'active');
                backdrop.style.setProperty('display', 'none', 'important');
                backdrop.style.setProperty('pointer-events', 'none', 'important');
            }

            // 2. Dọn Trấn Yêu Tháp frame
            try {
                document.getElementById('tower-v4-frame')?.remove();
                document.body?.classList?.remove('tower-v4-active');
            } catch (_) {}

            // 3. Toàn bộ danh sách modal/popup/page
            const selectors = [
                '.feature-popup',
                '.game-page',
                '.feature-page',
                '.profile-account-overlay',
                '.modal-overlay',
                '#hub-modal-backdrop',
                '#celestial-omen-modal',
                '#sect-modal',
                '#reset-confirm-modal',
                '#modal-be-quan-offline',
                '#modal-game-settings',
                '#modal-offline-rewards',
                '#modal-setting',
                '#modal-gia-vien',
                '#modal-luyen-dan',
                '#modal-luyen-khi',
                '#modal-khue-phong',
                '#modal-tran-yeu-thap',
                '#demon-tower-modal',
                '#modal-do-kiep',
                '#profile-login-modal',
                '#profile-account-modal',
                '#modal-breakthrough',
                '#modal-breakthrough-minor',
                '#minor-breakthrough-modal',
                '#page-inventory',
                '#page-skills',
                '#page-root',
                '#page-artifact',
                '#page-pet',
                '#page-sect-quests',
                '#page-sect-rank',
                '#page-sect-shop',
                '#page-sect-array',
                '#page-world-market',
                '#page-world-auction',
                '#page-world-dungeon',
                '#page-world-arena',
                '#page-world-encounter',
                '#tam-ma-battle-modal'
            ];

            // Tạm dừng và giải phóng timer giao tranh tháp & tâm ma
            if (typeof window.closeDemonTowerModal === 'function') {
                try { window.closeDemonTowerModal(); } catch (_) {}
            }
            if (typeof window.closeTamMaBattleModal === 'function') {
                try { window.closeTamMaBattleModal(); } catch (_) {}
            }

            document.querySelectorAll(selectors.join(', ')).forEach((el) => {
                el.classList.remove('is-open', 'active', 'is-active', 'flex', 'show');
                el.classList.add('hidden');
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            });

            // 4. Đóng tất cả dropup menu
            document.querySelectorAll('.dropup-menu').forEach((m) => {
                m.classList.remove('active', 'is-open');
                m.style.setProperty('display', 'none', 'important');
            });

            // 5. Gỡ trạng thái modal trên body
            document.body.classList.remove('has-active-modal');

            // 6. Khôi phục HUD màn hình chính
            if (typeof window.showMainScreenHUD === 'function') {
                try { window.showMainScreenHUD(); } catch (_) {}
            }
            const topBar = document.getElementById('global-top-resource-bar') || document.getElementById('top-bar');
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            const tuViBar = document.getElementById('tu-vi-bar');
            const bottomMenu = document.getElementById('bottom-menu');
            if (topBar) topBar.style.removeProperty('display');
            if (leftPanel) leftPanel.style.removeProperty('display');
            if (rightPanel) rightPanel.style.removeProperty('display');
            if (tuViBar) tuViBar.style.removeProperty('display');
            if (bottomMenu) bottomMenu.style.removeProperty('display');
        } catch (err) {
            console.warn('[forceCloseAllPopups error]', err);
        }
    }

    /**
     * Đảm bảo mọi modal khi mở đều có nút Đóng bất tử
     */
    function ensureImmortalCloseButton(targetEl) {
        if (!targetEl) return;
        let btn = targetEl.querySelector('.btn-close-modal, .encounter-close, .master-immortal-close');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-close-modal master-immortal-close';
            btn.innerHTML = '✖ ĐÓNG';
            btn.title = 'Thoát về Màn Hình Tu Tiên';
            targetEl.appendChild(btn);
        }
        btn.onclick = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            forceCloseAllPopups();
        };
    }

    /* ==========================================================================
       3. BẢN ĐỒ ALIAS & BỘ MỞ TRANG / MODAL ĐỒNG NHẤT
       ========================================================================== */
    const MODAL_ALIAS_MAP = {
        // Nhóm Nhân Vật
        'inventory': 'page-inventory',
        'tui-do': 'page-inventory',
        'page-tui-do': 'page-inventory',
        'page-inventory': 'page-inventory',
        'modal-nhan-vat': 'page-inventory',

        'skills': 'page-skills',
        'cong-phap': 'page-skills',
        'page-cong-phap': 'page-skills',
        'page-skills': 'page-skills',

        'root': 'page-root',
        'can-co': 'page-root',
        'page-can-co': 'page-root',
        'page-root': 'page-root',

        'artifact': 'page-artifact',
        'phap-bao': 'page-artifact',
        'page-phap-bao': 'page-artifact',
        'page-artifact': 'page-artifact',

        'pet': 'page-pet',
        'linh-thu': 'page-pet',
        'page-linh-thu': 'page-pet',
        'page-pet': 'page-pet',

        // Nhóm Động Phủ
        'gia-vien': 'modal-gia-vien',
        'dong-phu': 'modal-gia-vien',
        'page-gia-vien': 'modal-gia-vien',
        'page-dong-phu': 'modal-gia-vien',
        'modal-gia-vien': 'modal-gia-vien',

        'luyen-dan': 'modal-luyen-dan',
        'dan-cac': 'modal-luyen-dan',
        'page-dan-cac': 'modal-luyen-dan',
        'modal-luyen-dan': 'modal-luyen-dan',

        'luyen-khi': 'modal-luyen-khi',
        'khi-cac': 'modal-luyen-khi',
        'page-khi-cac': 'modal-luyen-khi',
        'modal-luyen-khi': 'modal-luyen-khi',

        'khue-phong': 'modal-khue-phong',
        'dao-lu': 'modal-khue-phong',
        'page-khue-phong': 'modal-khue-phong',
        'modal-khue-phong': 'modal-khue-phong',

        // Trấn Yêu Tháp
        'tran-yeu-thap': 'modal-tran-yeu-thap',
        'demon-tower': 'modal-tran-yeu-thap',
        'page-tran-yeu-thap': 'modal-tran-yeu-thap',
        'demon-tower-modal': 'modal-tran-yeu-thap',
        'modal-tran-yeu-thap': 'modal-tran-yeu-thap',

        // Nhóm Tông Môn
        'sect-quests': 'page-sect-quests',
        'nhiem-vu-duong': 'page-sect-quests',
        'page-sect-quests': 'page-sect-quests',
        'modal-tong-mon': 'page-sect-quests',

        'sect-rank': 'page-sect-rank',
        'chap-su-dien': 'page-sect-rank',
        'page-sect-rank': 'page-sect-rank',

        'sect-shop': 'page-sect-shop',
        'tang-kinh-cac': 'page-sect-shop',
        'page-sect-shop': 'page-sect-shop',

        'sect-array': 'page-sect-array',
        'ho-son-dai-tran': 'page-sect-array',
        'page-sect-array': 'page-sect-array',

        // Nhóm Thế Giới
        'world-market': 'page-world-market',
        'phuong-thi': 'page-world-market',
        'market': 'page-world-market',
        'page-world-market': 'page-world-market',
        'modal-the-gioi': 'page-world-market',

        'world-auction': 'page-world-auction',
        'dau-gia': 'page-world-auction',
        'auction': 'page-world-auction',
        'page-world-auction': 'page-world-auction',

        'world-dungeon': 'page-world-dungeon',
        'bi-canh': 'page-world-dungeon',
        'dungeon': 'page-world-dungeon',
        'page-world-dungeon': 'page-world-dungeon',

        'world-arena': 'page-world-arena',
        'dau-phap-dai': 'page-world-arena',
        'arena': 'page-world-arena',
        'page-world-arena': 'page-world-arena',

        'world-encounter': 'page-world-encounter',
        'lich-luyen': 'page-world-encounter',
        'encounter': 'page-world-encounter',
        'page-world-encounter': 'page-world-encounter',

        // Hệ Thống
        'do-kiep': 'modal-do-kiep',
        'modal-do-kiep': 'modal-do-kiep',
        'breakthrough': 'modal-do-kiep',

        'celestial-omen-modal': 'celestial-omen-modal',
        'celestial-omen': 'celestial-omen-modal',
        'di-tuong': 'celestial-omen-modal',
        'page-celestial-omen': 'celestial-omen-modal',

        'minor-breakthrough-modal': 'minor-breakthrough-modal',
        'modal-breakthrough-minor': 'minor-breakthrough-modal',
        'breakthrough-minor': 'minor-breakthrough-modal',
        'xung-kich': 'minor-breakthrough-modal',

        'settings': 'modal-game-settings',
        'cai-dat': 'modal-game-settings',
        'modal-game-settings': 'modal-game-settings',

        'profile': 'profile-account-modal',
        'ho-so': 'profile-account-modal',
        'profile-login-modal': 'profile-account-modal',
        'profile-account-modal': 'profile-account-modal'
    };

    /**
     * Fallback UI khi container rỗng
     */
    function renderFallbackCards(pageId, container) {
        if (!container) return;
        const titles = {
            'page-inventory': { title: 'Túi Đồ Bản Nguyên', icon: 'fa-box-open', desc: 'Lưu trữ linh đan, pháp bảo và dược liệu thu thập được.' },
            'page-skills': { title: 'Công Pháp Tu Luyện', icon: 'fa-book-journal-whills', desc: 'Lĩnh ngộ tâm pháp & võ kỹ gia tăng tu vi và chiến lực.' },
            'page-root': { title: 'Căn Cơ Linh Căn', icon: 'fa-dna', desc: 'Bồi dưỡng ngũ hành căn cơ Kim - Mộc - Thủy - Hỏa - Thổ.' },
            'page-artifact': { title: 'Pháp Bảo Bản Mệnh', icon: 'fa-shield-halved', desc: 'Tôi luyện chiến khí bản mệnh hộ thể trừ yêu.' },
            'page-pet': { title: 'Linh Thú Hộ Mệnh', icon: 'fa-paw', desc: 'Thu phục và bồi dưỡng thần thú hộ đạo.' },
            'page-sect-quests': { title: 'Nhiệm Vụ Đường', icon: 'fa-scroll', desc: 'Nhận ủy thác tông môn tích lũy điểm cống hiến.' },
            'page-sect-rank': { title: 'Chấp Sự Điện', icon: 'fa-landmark', desc: 'Thăng tiến chức vị đệ tử và nhận bổng lộc.' },
            'page-sect-shop': { title: 'Tàng Kinh Các', icon: 'fa-book-atlas', desc: 'Đổi cống hiến lấy bí tịch và đan phương hiếm.' },
            'page-sect-array': { title: 'Hộ Sơn Đại Trận', icon: 'fa-chess-board', desc: 'Bồi dưỡng linh trận tông môn tăng tốc độ tu luyện.' },
            'page-world-market': { title: 'Phường Thị Tu Tiên', icon: 'fa-store', desc: 'Giao thương mua bán nguyên liệu và pháp bảo.' },
            'page-world-auction': { title: 'Đấu Giá Hội', icon: 'fa-gavel', desc: 'Tham gia đấu giá các kỳ trân dị bảo ngàn năm.' },
            'page-world-dungeon': { title: 'Bí Cảnh Thám Hiểm', icon: 'fa-dungeon', desc: 'Tiến vào di tích cổ thám hiểm tìm cơ duyên.' },
            'page-world-arena': { title: 'Đấu Pháp Đài', icon: 'fa-hand-fist', desc: 'Luận đạo tranh tài cùng tu sĩ phương xa.' },
            'page-world-encounter': { title: 'Lịch Luyện Hồng Hoang', icon: 'fa-compass', desc: 'Chu du tứ hải tìm kiếm kỳ ngộ thiên địa.' }
        };

        const info = titles[pageId] || { title: 'Khu Vực Tu Tiên', icon: 'fa-mountain-sun', desc: 'Không gian tĩnh mịch chiêm nghiệm đạo pháp.' };

        container.innerHTML = `
            <div class="master-fallback-grid">
                <div class="master-fallback-card">
                    <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-lg">
                            <i class="fa-solid ${info.icon}"></i>
                        </span>
                        <div>
                            <h3 class="text-sm font-bold font-serif text-amber-300">${info.title} Sơ Khởi</h3>
                            <p class="text-[11px] text-slate-400">Bản ngộ đệ nhất tầng</p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">${info.desc}</p>
                    <button type="button" onclick="window.handleMasterAction('${pageId}', 1)" class="master-fallback-btn">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Khởi Động
                    </button>
                </div>
                <div class="master-fallback-card">
                    <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-gem"></i>
                        </span>
                        <div>
                            <h3 class="text-sm font-bold font-serif text-teal-300">Tụ Khí Bồi Dưỡng</h3>
                            <p class="text-[11px] text-slate-400">Gia tăng linh thạch & tu vi</p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed">Vận hành chu thiên bồi dưỡng căn cơ thêm thâm hậu.</p>
                    <button type="button" onclick="window.handleMasterAction('${pageId}', 2)" class="master-fallback-btn" style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.8), rgba(13, 148, 136, 0.9)); color: #fff;">
                        <i class="fa-solid fa-fire-flame-curved mr-1"></i> Bồi Dưỡng
                    </button>
                </div>
            </div>
        `;
    }

    // Hành động xử lý mẫu tương tác fallback
    window.handleMasterAction = function(pageId, type) {
        const s = window.GameState;
        if (!s) return;
        if (type === 1) {
            s.exp = (Number(s.exp) || 0) + 100;
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast('Đã khởi động cơ duyên: +100 Tu Vi!', 'success');
            }
        } else {
            s.spiritStones = (Number(s.spiritStones) || 0) + 50;
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast('Đã vận hành chu thiên: +50 Linh Thạch!', 'info');
            }
        }
        if (typeof window.saveGame === 'function') window.saveGame();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
    };

    /**
     * Kích hoạt render nội dung cho từng trang tương ứng
     */
    function triggerPageRender(mappedId, targetEl) {
        try {
            switch (mappedId) {
                case 'page-inventory':
                    if (typeof window.renderCharacterHub === 'function') {
                        window.renderCharacterHub('inventory', document.getElementById('inventory-page-content'));
                    }
                    break;
                case 'page-skills':
                    if (typeof window.renderSkillsHub === 'function') {
                        window.renderSkillsHub(document.getElementById('skills-page-content'));
                    }
                    break;
                case 'page-root':
                    if (typeof window.renderNguHanhLinhCanPanel === 'function') {
                        window.renderNguHanhLinhCanPanel(document.getElementById('root-page-content'));
                    } else if (typeof window.renderCharacterHub === 'function') {
                        window.renderCharacterHub('root', document.getElementById('root-page-content'));
                    }
                    break;
                case 'page-artifact':
                    if (typeof window.renderArtifactsPage === 'function') {
                        window.renderArtifactsPage(document.getElementById('artifact-page-content'));
                    } else if (typeof window.renderCharacterHub === 'function') {
                        window.renderCharacterHub('artifact', document.getElementById('artifact-page-content'));
                    }
                    break;
                case 'page-pet':
                    if (typeof window.renderPetPage === 'function') {
                        window.renderPetPage(document.getElementById('pet-page-content'));
                    } else if (typeof window.renderCharacterHub === 'function') {
                        window.renderCharacterHub('pet', document.getElementById('pet-page-content'));
                    }
                    break;
                case 'modal-gia-vien':
                    if (typeof window.renderEstateUI === 'function') window.renderEstateUI();
                    break;
                case 'modal-luyen-dan':
                    if (typeof window.renderAlchemyUI === 'function') window.renderAlchemyUI();
                    break;
                case 'modal-luyen-khi':
                    if (typeof window.renderForgingUI === 'function') window.renderForgingUI();
                    break;
                case 'modal-khue-phong':
                    if (typeof window.renderChamberUI === 'function') window.renderChamberUI();
                    break;
                case 'modal-tran-yeu-thap':
                    if (typeof window.renderDemonTowerUI === 'function') window.renderDemonTowerUI();
                    break;
                case 'modal-do-kiep':
                    if (typeof window.openDoKiepModal === 'function') window.openDoKiepModal(null);
                    break;
                case 'page-sect-quests':
                    if (typeof window.renderSectPage === 'function') {
                        window.renderSectPage('quests', document.getElementById('sect-quests-page-content'));
                    }
                    break;
                case 'page-sect-rank':
                    if (typeof window.renderSectPage === 'function') {
                        window.renderSectPage('rank', document.getElementById('sect-rank-page-content'));
                    }
                    break;
                case 'page-sect-shop':
                    if (typeof window.renderSectPage === 'function') {
                        window.renderSectPage('shop', document.getElementById('sect-shop-page-content'));
                    }
                    break;
                case 'page-sect-array':
                    if (typeof window.renderSectPage === 'function') {
                        window.renderSectPage('array', document.getElementById('sect-array-page-content'));
                    }
                    break;
                case 'page-world-market':
                    if (typeof window.renderWorldMarketPage === 'function') {
                        window.renderWorldMarketPage(document.getElementById('world-market-page-content'));
                    } else if (typeof window.renderWorldPage === 'function') {
                        window.renderWorldPage('market', document.getElementById('world-market-page-content'));
                    }
                    break;
                case 'page-world-auction':
                    if (typeof window.renderWorldAuctionPage === 'function') {
                        window.renderWorldAuctionPage(document.getElementById('world-auction-page-content'));
                    } else if (typeof window.renderWorldPage === 'function') {
                        window.renderWorldPage('auction', document.getElementById('world-auction-page-content'));
                    }
                    break;
                case 'page-world-dungeon':
                    if (typeof window.renderWorldDungeonPage === 'function') {
                        window.renderWorldDungeonPage(document.getElementById('world-dungeon-page-content'));
                    } else if (typeof window.renderWorldPage === 'function') {
                        window.renderWorldPage('dungeon', document.getElementById('world-dungeon-page-content'));
                    }
                    break;
                case 'page-world-arena':
                    if (typeof window.renderWorldArenaPage === 'function') {
                        window.renderWorldArenaPage(document.getElementById('world-arena-page-content'));
                    } else if (typeof window.renderWorldPage === 'function') {
                        window.renderWorldPage('arena', document.getElementById('world-arena-page-content'));
                    }
                    break;
                case 'page-world-encounter':
                    if (typeof window.renderWorldEncounterPage === 'function') {
                        window.renderWorldEncounterPage(document.getElementById('world-encounter-page-content'));
                    } else if (typeof window.renderWorldPage === 'function') {
                        window.renderWorldPage('encounter', document.getElementById('world-encounter-page-content'));
                    }
                    break;
                case 'celestial-omen-modal':
                    if (typeof window.renderCelestialOmenModal === 'function') {
                        try { window.renderCelestialOmenModal(); } catch (_) {}
                    }
                    break;
                case 'minor-breakthrough-modal':
                    if (typeof window.openMinorBreakthroughModal === 'function') {
                        try { window.openMinorBreakthroughModal(); } catch (_) {}
                    }
                    break;
            }

            // Kiểm tra nội dung rỗng để chèn fallback nếu cần
            const contentContainers = {
                'page-inventory': document.getElementById('inventory-page-content'),
                'page-skills': document.getElementById('skills-page-content'),
                'page-root': document.getElementById('root-page-content'),
                'page-artifact': document.getElementById('artifact-page-content'),
                'page-pet': document.getElementById('pet-page-content'),
                'page-sect-quests': document.getElementById('sect-quests-page-content'),
                'page-sect-rank': document.getElementById('sect-rank-page-content'),
                'page-sect-shop': document.getElementById('sect-shop-page-content'),
                'page-sect-array': document.getElementById('sect-array-page-content'),
                'page-world-market': document.getElementById('world-market-page-content'),
                'page-world-auction': document.getElementById('world-auction-page-content'),
                'page-world-dungeon': document.getElementById('world-dungeon-page-content'),
                'page-world-arena': document.getElementById('world-arena-page-content'),
                'page-world-encounter': document.getElementById('world-encounter-page-content')
            };

            const cnt = contentContainers[mappedId];
            if (cnt && (!cnt.innerHTML || cnt.innerHTML.trim() === '')) {
                renderFallbackCards(mappedId, cnt);
            }
        } catch (err) {
            console.error('[triggerPageRender error]', err);
        }
    }

    /**
     * Hàm mở modal chung chuẩn tắc
     */
    function masterNavigateTo(targetId) {
        if (!targetId || targetId === 'main-screen') {
            forceCloseAllPopups();
            return;
        }

        // Đóng các popup cũ
        forceCloseAllPopups();

        const mappedId = MODAL_ALIAS_MAP[targetId] || targetId;
        let targetEl = document.getElementById(mappedId);
        if (!targetEl) {
            targetEl = document.querySelector(`[data-alias="${mappedId}"]`) || document.querySelector(`[data-alias="${targetId}"]`);
        }

        if (!targetEl) {
            console.warn('[masterNavigateTo] Không tìm thấy phần tử:', targetId, '->', mappedId);
            return;
        }

        // Nếu là modal profile
        if (mappedId === 'profile-login-modal' || mappedId === 'profile-account-modal') {
            masterOpenProfileModal();
            return;
        }

        // Ẩn HUD màn hình chính khi mở modal toàn màn hình
        if (typeof window.hideMainScreenHUD === 'function') {
            try { window.hideMainScreenHUD(); } catch (_) {}
        }
        document.body.classList.add('has-active-modal');

        // Mở hiển thị
        targetEl.classList.remove('hidden');
        targetEl.classList.add('is-open', 'active', 'flex');
        const isFullscreenPage = targetEl.classList.contains('game-page') || targetEl.classList.contains('feature-page');
        const isCaveRoom = ['modal-gia-vien', 'modal-luyen-dan', 'modal-luyen-khi', 'modal-khue-phong'].includes(mappedId);
        targetEl.style.setProperty('display', isFullscreenPage ? 'block' : 'flex', 'important');
        targetEl.style.setProperty('pointer-events', 'auto', 'important');
        targetEl.style.setProperty('z-index', isCaveRoom ? '10000' : '9500', 'important');
        targetEl.style.setProperty('opacity', '1', 'important');

        // Backdrop cho feature page nếu có (không áp dụng cho Động Phủ)
        const backdrop = document.getElementById('feature-page-backdrop');
        if (backdrop && isFullscreenPage && !isCaveRoom) {
            backdrop.classList.add('is-visible', 'active');
            backdrop.style.setProperty('display', 'block', 'important');
            backdrop.style.setProperty('pointer-events', 'auto', 'important');
        }

        // Render nội dung
        triggerPageRender(mappedId, targetEl);

        // Cập nhật trạng thái .is-active cho thanh subnav trong targetEl
        const subnavBar = targetEl.querySelector('.popup-subnav-bar');
        if (subnavBar) {
            subnavBar.querySelectorAll('.popup-subnav-btn').forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick') || '';
                if (onclickAttr.includes(mappedId) || onclickAttr.includes(targetId)) {
                    btn.classList.add('is-active');
                } else {
                    btn.classList.remove('is-active');
                }
            });
        }

        // Gắn nút đóng bất tử
        ensureImmortalCloseButton(targetEl);
    }

    /**
     * Mở modal Profile / Hồ Sơ Bản Thể
     */
    function masterOpenProfileModal(forcedMode) {
        forceCloseAllPopups();
        const modal = document.getElementById('profile-account-modal') || document.getElementById('profile-login-modal');
        if (!modal) return;

        try {
            if (typeof window.getStoredProfile === 'function') {
                const profile = window.getStoredProfile();
                const mode = forcedMode || (window.currentUser || profile ? 'edit' : 'new');
                const stateNew = document.getElementById('profile-state-new');
                const stateEdit = document.getElementById('profile-state-edit');
                const closeBtn = document.getElementById('profile-close-btn');

                if (mode === 'new') {
                    if (stateNew) stateNew.classList.remove('hidden');
                    if (stateEdit) stateEdit.classList.add('hidden');
                    if (closeBtn) closeBtn.classList.add('hidden');
                } else {
                    if (stateEdit) stateEdit.classList.remove('hidden');
                    if (stateNew) stateNew.classList.add('hidden');
                    if (closeBtn) closeBtn.classList.remove('hidden');
                }
            }
        } catch (_) {}

        modal.classList.remove('hidden');
        modal.classList.add('is-open', 'active', 'flex');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '10000', 'important');
        ensureImmortalCloseButton(modal);
    }

    /**
     * Điều khiển Dropup Menu ở đáy màn hình
     */
    function masterToggleDropup(menuId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const menu = document.getElementById(menuId);
        if (!menu) return;
        const isCurrentlyOpen = menu.classList.contains('active') || menu.classList.contains('is-open') || menu.style.display === 'flex';

        // Đóng các dropup khác
        document.querySelectorAll('.dropup-menu').forEach((m) => {
            m.classList.remove('active', 'is-open');
            m.style.setProperty('display', 'none', 'important');
        });

        if (!isCurrentlyOpen) {
            menu.classList.add('active', 'is-open');
            menu.style.setProperty('display', 'flex', 'important');
            menu.style.setProperty('z-index', '10000', 'important');
        }
    }

    function masterCloseAllDropups() {
        document.querySelectorAll('.dropup-menu').forEach((m) => {
            m.classList.remove('active', 'is-open');
            m.style.setProperty('display', 'none', 'important');
        });
    }

    /* ==========================================================================
       4. ĐĂNG KÝ HÀM TOÀN CỤC (GHI ĐÈ CHỐNG LIỆT NÚT)
       ========================================================================== */
    window.forceCloseAllPopups = forceCloseAllPopups;
    window.closeAllModals = forceCloseAllPopups;
    window.closeAllFeaturePopups = forceCloseAllPopups;

    window.navigateTo = masterNavigateTo;
    window.openGameModal = masterNavigateTo;
    window.openFeature = masterNavigateTo;
    window.switchPage = masterNavigateTo;

    window.openGiaVienModal = () => masterNavigateTo('modal-gia-vien');
    window.openLuyenDanModal = () => masterNavigateTo('modal-luyen-dan');
    window.openLuyenKhiModal = () => masterNavigateTo('modal-luyen-khi');
    window.openKhuePhongModal = () => masterNavigateTo('modal-khue-phong');
    window.openDemonTowerModal = () => masterNavigateTo('modal-tran-yeu-thap');
    window.openProfileModal = masterOpenProfileModal;
    window.closeProfileModal = forceCloseAllPopups;
    window.openGameSettings = () => masterNavigateTo('modal-game-settings');
    window.closeGameSettings = forceCloseAllPopups;
    window.openCelestialOmenModal = () => masterNavigateTo('celestial-omen-modal');
    window.closeCelestialOmenModal = forceCloseAllPopups;
    window.openMinorBreakthroughModal = () => masterNavigateTo('minor-breakthrough-modal');
    window.closeMinorBreakthroughModal = forceCloseAllPopups;
    window.openChamberModal = () => masterNavigateTo('modal-khue-phong');
    window.closeChamberModal = forceCloseAllPopups;
    window.openBreakthroughModal = () => masterNavigateTo('modal-do-kiep');
    window.openDoKiepModal = () => masterNavigateTo('modal-do-kiep');
    window.openSectModal = () => masterNavigateTo('page-sect-quests');
    window.closeSectModal = forceCloseAllPopups;
    window.openHubModal = (hubId) => masterNavigateTo(hubId || 'page-inventory');
    window.closeHubModal = forceCloseAllPopups;

    window.closeGiaVienModal = forceCloseAllPopups;
    window.closeLuyenDanModal = forceCloseAllPopups;
    window.closeLuyenKhiModal = forceCloseAllPopups;
    window.closeKhuePhongModal = forceCloseAllPopups;
    window.closeDemonTowerModal = forceCloseAllPopups;
    window.closeDoKiepModal = forceCloseAllPopups;

    window.toggleDropup = masterToggleDropup;
    window.toggleDropupMenu = masterToggleDropup;
    window.closeAllDropups = masterCloseAllDropups;

    // Đăng ký cả trên globalThis
    globalThis.forceCloseAllPopups = forceCloseAllPopups;
    globalThis.closeAllModals = forceCloseAllPopups;
    globalThis.navigateTo = masterNavigateTo;
    globalThis.openGameModal = masterNavigateTo;
    globalThis.openGiaVienModal = window.openGiaVienModal;
    globalThis.openLuyenDanModal = window.openLuyenDanModal;
    globalThis.openLuyenKhiModal = window.openLuyenKhiModal;
    globalThis.openKhuePhongModal = window.openKhuePhongModal;
    globalThis.openDemonTowerModal = window.openDemonTowerModal;
    globalThis.openProfileModal = window.openProfileModal;
    globalThis.openGameSettings = window.openGameSettings;
    globalThis.openCelestialOmenModal = window.openCelestialOmenModal;
    globalThis.closeCelestialOmenModal = forceCloseAllPopups;
    globalThis.openMinorBreakthroughModal = window.openMinorBreakthroughModal;
    globalThis.closeMinorBreakthroughModal = forceCloseAllPopups;
    globalThis.toggleDropup = masterToggleDropup;
    globalThis.closeAllDropups = masterCloseAllDropups;

    /* ==========================================================================
       5. NỐI LẠI SỰ KIỆN CÁC NÚT CHÍNH & PHÍM TẮT ESC
       ========================================================================== */
    function attachMasterListeners() {
        try {
            // 1. Phím tắt Nhanh Toàn Trang (Hotkeys)
            document.addEventListener('keydown', (e) => {
                const tag = (e.target && e.target.tagName ? e.target.tagName : '').toUpperCase();
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) {
                    if (e.key === 'Escape') forceCloseAllPopups();
                    return;
                }

                // ESC: Đóng toàn bộ popup/modal đang mở về màn hình chính
                if (e.key === 'Escape' || e.code === 'Escape' || e.keyCode === 27) {
                    forceCloseAllPopups();
                    return;
                }

                // Space: Kích hoạt nhanh Đột Phá / Xung Kích
                if (e.code === 'Space' || e.key === ' ') {
                    e.preventDefault();
                    try {
                        if (typeof window.attemptCultivationBreakthrough === 'function') {
                            window.attemptCultivationBreakthrough();
                        } else if (typeof window.openDoKiepModal === 'function') {
                            window.openDoKiepModal(null);
                        }
                    } catch (_) {}
                    return;
                }

                // 1 -> 5: Mở nhanh các phòng chức năng chính
                if (e.key === '1' || e.code === 'Digit1') {
                    e.preventDefault();
                    masterNavigateTo('page-inventory');
                } else if (e.key === '2' || e.code === 'Digit2') {
                    e.preventDefault();
                    masterNavigateTo('modal-gia-vien');
                } else if (e.key === '3' || e.code === 'Digit3') {
                    e.preventDefault();
                    masterNavigateTo('modal-luyen-dan');
                } else if (e.key === '4' || e.code === 'Digit4') {
                    e.preventDefault();
                    masterNavigateTo('page-sect-quests');
                } else if (e.key === '5' || e.code === 'Digit5') {
                    e.preventDefault();
                    masterNavigateTo('modal-tran-yeu-thap');
                }
            });

            // 2. Event delegation cho TẤT CẢ các nút đóng (chạy ở capture phase)
            document.addEventListener('click', (e) => {
                const closeBtn = e.target.closest(
                    '.btn-close-modal, .encounter-close, .btn-close-dispatch, .master-immortal-close, [data-close], ' +
                    '#profile-close-btn, [aria-label*="Đóng"], [aria-label*="đóng"], [title*="Đóng"], [title*="Thoát"]'
                );
                if (closeBtn) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Xử lý các sub-dialog bên trong các phòng lớn
                    if (closeBtn.closest('#dispatch-modal, .dispatch-modal-backdrop')) {
                        if (typeof window.closeDispatchModal === 'function') window.closeDispatchModal();
                        return;
                    }
                    if (closeBtn.closest('#cauldron-modal, #fire-modal, #alchemy-cauldron-select-modal, #pill-result-modal')) {
                        if (typeof window.closeCauldronPicker === 'function') window.closeCauldronPicker();
                        if (typeof window.closeFirePicker === 'function') window.closeFirePicker();
                        if (typeof window.closePillResultModal === 'function') window.closePillResultModal();
                        return;
                    }
                    if (closeBtn.closest('#crafting-modal-overlay')) {
                        if (typeof window.closeCraftingModal === 'function') window.closeCraftingModal();
                        return;
                    }
                    if (closeBtn.closest('#dual-cultivation-overlay')) {
                        if (typeof window.closeDualAnimation === 'function') window.closeDualAnimation();
                        return;
                    }

                    forceCloseAllPopups();
                }
            }, true);

            // 3. Đóng dropup khi click bên ngoài
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#bottom-menu') && !e.target.closest('.dropup-menu')) {
                    masterCloseAllDropups();
                }
            });

            // 4. Nút Avatar (Hồ sơ bản thể)
            const avatarCluster = document.querySelector('.topbar-avatar-cluster');
            if (avatarCluster) {
                avatarCluster.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    masterOpenProfileModal();
                };
            }

            // 5. Nút Cài Đặt (Bánh răng)
            const settingsBtn = document.getElementById('btn-immersion');
            if (settingsBtn) {
                settingsBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    masterNavigateTo('modal-game-settings');
                };
            }

            // 6. Nút Đột Phá
            const cultivateBtn = document.getElementById('btn-cultivate-action');
            if (cultivateBtn) {
                cultivateBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        if (typeof window.attemptCultivationBreakthrough === 'function') {
                            window.attemptCultivationBreakthrough();
                        } else if (typeof window.openDoKiepModal === 'function') {
                            window.openDoKiepModal(null);
                        }
                    } catch (err) {
                        console.warn('Cultivate action error:', err);
                        masterNavigateTo('modal-do-kiep');
                    }
                };
            }

            // 7. Gắn nút đóng bất tử cho các modal đã có sẵn trong DOM
            document.querySelectorAll('.feature-popup, .game-page, .feature-page, .profile-account-overlay').forEach((modal) => {
                ensureImmortalCloseButton(modal);
            });

            console.log('✅ [MasterFix] Đã gắn toàn bộ sự kiện chống liệt thành công.');
        } catch (err) {
            console.error('[MasterFix attachMasterListeners error]', err);
        }
    }

    /* ==========================================================================
       6. CHỐNG SPAM CLICK & DEBOUNCE CHO CÁC NÚT HÀNH ĐỘNG CỐT LÕI
       ========================================================================== */
    const actionThrottleMap = new Map();
    function throttleAction(actionKey, delayMs = 450) {
        const now = Date.now();
        const last = actionThrottleMap.get(actionKey) || 0;
        if (now - last < delayMs) {
            return false;
        }
        actionThrottleMap.set(actionKey, now);
        return true;
    }

    function wrapActionWithDebounce(fnName, delayMs = 450) {
        try {
            const originalFn = window[fnName];
            if (typeof originalFn === 'function' && !originalFn._isDebounced) {
                const wrapped = function(...args) {
                    if (!throttleAction(fnName, delayMs)) {
                        if (typeof window.showGameToast === 'function') {
                            window.showGameToast('Đạo hữu thao tác quá nhanh, xin hoãn lại một nhịp!', 'info');
                        }
                        return;
                    }
                    return originalFn.apply(this, args);
                };
                wrapped._isDebounced = true;
                window[fnName] = wrapped;
                globalThis[fnName] = wrapped;
            }
        } catch (_) {}
    }

    // Bọc các hàm hành động quan trọng
    ['attemptCultivationBreakthrough', 'startMinorBreakthrough', 'craftPill', 'performQuickAlchemyAuto', 'startForging', 'dualCultivate', 'dualCultivateCompanion', 'handleChallengeClick', 'startTowerCombat'].forEach((fn) => {
        wrapActionWithDebounce(fn, 500);
    });

    // Chống double click bừa bãi toàn cục ở Capture Phase
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .btn, [role="button"], .master-fallback-btn, .action-btn');
        if (!btn) return;
        // Miễn trừ các nút điều hướng hoặc nút đóng
        if (btn.closest('.popup-subnav-bar') || btn.closest('.nav-item') || btn.matches('.btn-close-modal, .encounter-close, .btn-close-dispatch, .master-immortal-close, [data-close], #profile-close-btn')) {
            return;
        }
        const now = Date.now();
        const last = btn._lastClickTs || 0;
        if (now - last < 350) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        btn._lastClickTs = now;
    }, true);

    /* ==========================================================================
       7. BỘ THÔNG BÁO TOAST THỐNG NHẤT (showGameToast / showToast / showXianxiaToast)
       ========================================================================== */
    let masterToastTimer = null;
    function showGameToast(msg, type = 'info') {
        if (!msg) return;
        const cleanMsg = String(msg).replace(/\n+/g, ' • ');
        
        // Ghi log nhật ký
        if (typeof window.addLog === 'function') {
            const logColor = type === 'error' ? 'text-rose-400' : (type === 'success' ? 'text-emerald-400' : (type === 'warning' ? 'text-amber-400' : 'text-slate-300'));
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

        // Đảm bảo CSS hiển thị rõ nét
        toast.className = `xianxia-global-toast toast--${type} is-visible`;
        toast.textContent = cleanMsg;

        if (masterToastTimer) clearTimeout(masterToastTimer);
        masterToastTimer = setTimeout(() => {
            if (toast) toast.classList.remove('is-visible');
        }, 2800);

        // Hiệu ứng âm thanh nhẹ nếu có
        try {
            if (typeof window.playSound === 'function') {
                if (type === 'success') window.playSound('ding');
                else if (type === 'info') window.playSound('whoosh');
            }
        } catch (_) {}
    }

    window.showGameToast = showGameToast;
    window.showToast = showGameToast;
    window.showXianxiaToast = showGameToast;
    globalThis.showGameToast = showGameToast;
    globalThis.showToast = showGameToast;
    globalThis.showXianxiaToast = showGameToast;

    /* ==========================================================================
       8. WEB AUDIO API AUTOPLAY UNLOCK
       ========================================================================== */
    function setupAudioAutoplayUnlock() {
        const unlock = () => {
            try {
                if (typeof window.initAudio === 'function') {
                    window.initAudio();
                } else if (window.audioCtx && window.audioCtx.state === 'suspended') {
                    window.audioCtx.resume();
                }
            } catch (_) {}
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
            window.removeEventListener('touchstart', unlock, true);
        };
        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('keydown', unlock, true);
        window.addEventListener('touchstart', unlock, true);
    }
    setupAudioAutoplayUnlock();

    /* ==========================================================================
       9. CHỮ SỐ BAY (FLOATING NUMBERS) & GIỚI HẠN NHẬT KÝ TU LUYỆN
       ========================================================================== */
    function spawnFloatingNumber(text, type = 'tuvi', x = null, y = null) {
        try {
            const posX = (typeof x === 'number' && !isNaN(x)) ? x : (window.innerWidth / 2);
            const posY = (typeof y === 'number' && !isNaN(y)) ? y : (window.innerHeight / 2 - 40);

            const el = document.createElement('div');
            let colorStyle = 'color: #c084fc; border-color: rgba(192, 132, 252, 0.6); box-shadow: 0 0 16px rgba(192, 132, 252, 0.5);'; // mặc định tím cho Tu Vi
            if (type === 'stones' || type === 'gold') {
                colorStyle = 'color: #fbbf24; border-color: rgba(251, 191, 36, 0.6); box-shadow: 0 0 16px rgba(251, 191, 36, 0.5);';
            } else if (type === 'crit' || type === 'damage' || type === 'lose') {
                colorStyle = 'color: #f87171; border-color: rgba(248, 113, 113, 0.6); box-shadow: 0 0 16px rgba(248, 113, 113, 0.5); font-size: 15px !important;';
            } else if (type === 'heal' || type === 'hp') {
                colorStyle = 'color: #34d399; border-color: rgba(52, 211, 153, 0.6); box-shadow: 0 0 16px rgba(52, 211, 153, 0.5);';
            }

            el.className = 'floating-exp tuvi-floating-text';
            el.style.cssText = `
                position: fixed;
                left: ${posX - 35}px;
                top: ${posY}px;
                z-index: 100000;
                pointer-events: none;
                ${colorStyle}
            `;
            el.textContent = text;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1600);
        } catch (_) {}
    }

    window.spawnFloatingNumber = spawnFloatingNumber;
    window.spawnFloatingText = function(x, y, text, color) {
        let type = 'tuvi';
        if (typeof text === 'string') {
            if (/Linh Thạch|LT|Vàng/i.test(text)) type = 'stones';
            else if (/Bạo Kích|Sát thương|HP -|Trọng Thương/i.test(text)) type = 'crit';
            else if (/Hồi Phục|Chân Khí|HP \+/i.test(text)) type = 'heal';
        }
        spawnFloatingNumber(text, type, x, y);
    };
    window.spawnTuViFloatingText = function(amount, x, y) {
        spawnFloatingNumber(`+${Number(amount || 0).toLocaleString()} Tu Vi`, 'tuvi', x, y);
    };

    // Bọc addLog để luôn giữ tối đa 50 phần tử và auto-scroll
    if (typeof window.addLog === 'function') {
        const origAddLog = window.addLog;
        window.addLog = function(...args) {
            try {
                origAddLog.apply(this, args);
            } catch (err) {
                console.warn('addLog error:', err);
            }
            try {
                const logBox = document.getElementById('cultivation-log');
                if (logBox) {
                    while (logBox.children.length > 50 && logBox.firstElementChild) {
                        logBox.firstElementChild.remove();
                    }
                    logBox.scrollTop = logBox.scrollHeight;
                }
            } catch (_) {}
        };
    }

    /* ==========================================================================
       10. TỰ ĐỘNG BẢO VỆ TOÀN BỘ ẢNH LỖI (GLOBAL IMG ERROR FALLBACK)
       ========================================================================== */
    window.addEventListener('error', (event) => {
        if (event && event.target && event.target.tagName === 'IMG') {
            const img = event.target;
            if (!img.dataset.fallbackApplied) {
                img.dataset.fallbackApplied = 'true';
                img.src = window.DEFAULT_IMG_FALLBACK || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100%' height='100%' fill='%230f172a'/><circle cx='50' cy='50' r='42' fill='none' stroke='%2338bdf8' stroke-width='2'/><text x='50' y='57' font-size='24' text-anchor='middle' fill='%2338bdf8'>☯</text></svg>";
            }
        }
    }, true);

    /* ==========================================================================
       11. HỆ THỐNG THIÊN ĐẠO ÁP CHẾ & PHI THĂNG LINH GIỚI (ENDGAME LOOP)
       ========================================================================== */
    function checkAndApplyHeavenlySuppression() {
        try {
            const s = window.GameState || window.state;
            if (!s) return false;

            const isAscended = Boolean(s.isAscended || (s.currentWorld && s.currentWorld.includes('Linh Giới')));
            const currentWorld = s.currentWorld || s.world || 'M1 - Hạ Giới';
            const isHaGioi = !isAscended && (currentWorld.includes('M1') || currentWorld.includes('Hạ Giới') || currentWorld === 'HaGioi');

            const realms = window.REALMS || window.REALMS_DATA || [];
            const realmIndex = Number(s.realmIndex) || 0;
            const currentRealm = realms[realmIndex] || {};
            const isHoaThan = currentRealm.majorRealm === 'Hóa Thần' || (currentRealm.name && currentRealm.name.includes('Hóa Thần')) || (realmIndex >= 22 && realmIndex <= 25);

            const isSuppressed = isHaGioi && isHoaThan;
            s.isSuppressed = isSuppressed;

            // Cập nhật biểu tượng trên thanh Tu Vi
            const suppressionEl = document.getElementById('heavenly-suppression');
            if (suppressionEl) {
                if (isSuppressed) {
                    suppressionEl.classList.remove('hidden');
                    suppressionEl.style.display = 'inline-flex';
                } else {
                    suppressionEl.classList.add('hidden');
                    suppressionEl.style.display = 'none';
                }
            }

            // Nút Phi Thăng Linh Giới trên thanh Tu Vi
            const ascendBarBtn = document.getElementById('btn-ascend-linh-gioi-bar');
            const canAscend = isSuppressed && (Boolean(s.hasClearedTower50) || Number(s.towerFloor || 0) >= 50);
            if (ascendBarBtn) {
                if (canAscend) {
                    ascendBarBtn.classList.remove('hidden');
                    ascendBarBtn.style.display = 'inline-flex';
                } else {
                    ascendBarBtn.classList.add('hidden');
                    ascendBarBtn.style.display = 'none';
                }
            }

            // Tự động kích hoạt thông báo Thiên Đạo Áp Chế khi mới chạm Hóa Thần tại Hạ Giới
            if (isSuppressed && !s._hasSeenSuppressionAlert) {
                s._hasSeenSuppressionAlert = true;
                const alertModal = document.getElementById('heavenly-suppression-alert-modal');
                if (alertModal) {
                    alertModal.classList.remove('hidden');
                    alertModal.classList.add('flex');
                    alertModal.style.display = 'flex';
                    if (typeof window.playSound === 'function') window.playSound('thunder');
                }
            }

            return isSuppressed;
        } catch (_) {
            return false;
        }
    }

    function performMasterAscension() {
        const s = window.GameState || window.state;
        if (!s) return;

        const hasCleared = Boolean(s.hasClearedTower50 || (Number(s.towerFloor) >= 50));
        if (!hasCleared) {
            if (typeof window.showGameToast === 'function') {
                window.showGameToast('⚠️ Cần đả thông Tầng 50 Trấn Yêu Tháp mới có thể Phi Thăng Linh Giới!', 'error');
            }
            return;
        }

        // 1. Cập nhật trạng thái GameState
        s.isAscended = true;
        s.currentWorld = 'M2 - Linh Giới';
        s.world = 'linh-gioi';
        s.isSuppressed = false;
        s.hasClearedTower50 = true;
        s.ascensionQiBuff = 3; // Nhân 3 tốc độ tụ khí cơ bản

        // Cập nhật banner góc trên trái
        const bannerRealm = document.getElementById('banner-map-realm');
        if (bannerRealm) bannerRealm.textContent = 'LINH GIỚI';
        const bannerName = document.getElementById('banner-map-name');
        if (bannerName) bannerName.textContent = 'Linh Giới Tiên Vực — Bích Lạc Đài';

        // 2. Thay đổi bối cảnh màn hình sang Linh Giới
        const worldEnv = document.getElementById('world-environment');
        if (worldEnv) {
            worldEnv.style.backgroundImage = "url('./assets/images/bg_linh_gioi.jpg'), url('./assets/images/bg_thanh_van_sect.jpg')";
            worldEnv.style.backgroundSize = "cover";
            worldEnv.style.backgroundPosition = "center bottom";
        }
        const sceneArt = document.getElementById('scene-bg-art');
        if (sceneArt) {
            sceneArt.style.backgroundImage = "url('./assets/images/bg_linh_gioi.jpg'), url('./assets/images/bg_tu_tieu_peak.jpg')";
        }

        // 3. Ẩn cảnh báo áp chế & nút phi thăng
        const suppressionEl = document.getElementById('heavenly-suppression');
        if (suppressionEl) suppressionEl.classList.add('hidden');
        const ascendBarBtn = document.getElementById('btn-ascend-linh-gioi-bar');
        if (ascendBarBtn) {
            ascendBarBtn.classList.add('hidden');
            ascendBarBtn.style.display = 'none';
        }

        // 4. Âm thanh & thông báo
        if (typeof window.playSound === 'function') window.playSound('bell');
        if (typeof window.showGameToast === 'function') {
            window.showGameToast('🎉 ĐẮC ĐẠO PHI THĂNG! Tiến nhập Linh Giới thành công!', 'success');
        }

        if (typeof window.addLog === 'function') {
            window.addLog('🌌 <span class="text-amber-300 font-black tracking-widest">[ĐẮC ĐẠO PHI THĂNG]</span> Vượt qua 50 Tầng Trấn Yêu Tháp, chém vỡ gông cùm Thiên Đạo Hạ Giới, ngạo nghễ tiến nhập M2 - Linh Giới!', 'text-amber-300');
            window.addLog('✨ Toàn bộ áp chế đã được giải trừ! Tốc độ tu vi nhân đôi (+100% Rate), mở khóa các tầng cảnh giới Luyện Hư -> Hợp Thể -> Đại Thừa -> Độ Kiếp!', 'text-cyan-300');
        }

        // 5. Lưu và đồng bộ
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        if (typeof window.saveGameState === 'function') window.saveGameState();
        else if (typeof window.saveGame === 'function') window.saveGame();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();

        // 6. Hiển thị modal chúc mừng
        forceCloseAllPopups();
        const centerModal = document.getElementById('center-modal-backdrop');
        const box = document.getElementById('center-modal-box');
        if (centerModal && box) {
            box.innerHTML = `
                <div class="p-6 text-center space-y-4 text-slate-100">
                    <i class="fa-solid fa-feather-pointed text-5xl text-amber-300 animate-bounce" aria-hidden="true"></i>
                    <h2 class="text-2xl font-bold font-serif text-amber-200">PHI THĂNG LINH GIỚI THÀNH CÔNG!</h2>
                    <p class="text-sm text-slate-300 leading-relaxed">
                        Đạo hữu đã chém gục Ma Hoàng tại Đỉnh Tháp Tầng 50, phá toái hư không và ngạo nghễ phi thăng <strong class="text-cyan-300">Linh Giới</strong>.
                    </p>
                    <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 space-y-1">
                        <p>✨ <b>Giải trừ hoàn toàn:</b> Thiên Đạo Áp Chế Hạ Giới.</p>
                        <p>⚡ <b>Thiên Phú Linh Giới:</b> Nhân ba tốc độ tụ khí cơ bản (x3 Rate).</p>
                        <p>🔓 <b>Mở khóa Cảnh Giới:</b> Luyện Hư, Hợp Thể, Đại Thừa, Độ Kiếp.</p>
                    </div>
                    <button class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold font-serif text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer transition" type="button" onclick="document.getElementById('center-modal-backdrop')?.classList.add('hidden')">
                        BƯỚC VÀO LINH GIỚI
                    </button>
                </div>
            `;
            centerModal.classList.remove('hidden');
            centerModal.classList.add('flex');
            centerModal.style.display = 'flex';
        }
    }

    // =========================================================================
    // HỆ THỐNG RƠI ĐỒ TIÊN DUYÊN (LOOT TABLE ENGINE) & DUNG LUYỆN
    // =========================================================================
    function rollLootDrop(source = 'tower', levelOrFloor = 1) {
        const gs = window.GameState;
        if (!gs) return null;
        if (!Array.isArray(gs.inventory)) gs.inventory = [];

        const realmIdx = Number(gs.realmIndex) || 0;
        const floor = Number(levelOrFloor) || (realmIdx + 1);

        // 1. Phân cấp tỷ lệ phẩm chất theo cảnh giới & tầng tháp
        let targetTier = 'ha';
        let targetRealmName = 'Luyện Khí';
        let tierRarity = 1;

        if (realmIdx >= 18 || floor >= 40) {
            targetRealmName = 'Hóa Thần';
            targetTier = Math.random() < 0.65 ? 'cuc' : 'thuong';
            tierRarity = targetTier === 'cuc' ? 6 : 5;
        } else if (realmIdx >= 13 || floor >= 30) {
            targetRealmName = 'Nguyên Anh';
            targetTier = Math.random() < 0.45 ? 'cuc' : (Math.random() < 0.7 ? 'thuong' : 'trung');
            tierRarity = targetTier === 'cuc' ? 5 : 4;
        } else if (realmIdx >= 8 || floor >= 20) {
            targetRealmName = 'Kim Đan';
            targetTier = Math.random() < 0.20 ? 'cuc' : (Math.random() < 0.65 ? 'thuong' : 'trung');
            tierRarity = targetTier === 'cuc' ? 5 : (targetTier === 'thuong' ? 4 : 3);
        } else if (realmIdx >= 4 || floor >= 10) {
            targetRealmName = 'Trúc Cơ';
            targetTier = Math.random() < 0.15 ? 'thuong' : (Math.random() < 0.60 ? 'trung' : 'ha');
            tierRarity = targetTier === 'thuong' ? 3 : 2;
        } else {
            targetRealmName = 'Luyện Khí';
            targetTier = Math.random() < 0.25 ? 'trung' : 'ha';
            tierRarity = targetTier === 'trung' ? 2 : 1;
        }

        // 2. Quyết định loại phần thưởng rơi ra: 45% Trang Bị, 35% Đan Dược, 20% Nguyên Liệu
        const rollType = Math.random();
        let droppedItem = null;

        const eqCatalog = (window.OFFICIAL_EQUIPMENT_CATALOG && window.OFFICIAL_EQUIPMENT_CATALOG.length > 0)
            ? window.OFFICIAL_EQUIPMENT_CATALOG
            : (window.EQUIPMENT_DATA || []);

        const pillsCatalog = (window.PILLS_DATA && window.PILLS_DATA.length > 0)
            ? window.PILLS_DATA
            : [];

        if (rollType < 0.45 && eqCatalog.length > 0) {
            // RƠI TRANG BỊ
            let candidateList = eqCatalog.filter(eq => eq.realmTier === targetRealmName || eq.tier === targetTier);
            if (candidateList.length === 0) candidateList = eqCatalog;
            const chosen = candidateList[Math.floor(Math.random() * candidateList.length)];
            droppedItem = {
                id: chosen.id,
                name: chosen.name,
                type: 'equip',
                slot: chosen.slot || 'weapon',
                equipSlot: chosen.equipSlot || (chosen.slot === 'weapon' ? 'sword' : (chosen.slot === 'armor' ? 'mirror' : 'orb')),
                realmTier: chosen.realmTier || targetRealmName,
                tier: chosen.tier || targetTier,
                rarity: chosen.rarity || tierRarity,
                count: 1,
                atk: chosen.atk || chosen.atkBonus || 20,
                atkBonus: chosen.atkBonus || chosen.atk || 20,
                def: chosen.def || chosen.defBonus || 15,
                defBonus: chosen.defBonus || chosen.def || 15,
                maxHp: chosen.maxHp || chosen.hpBonus || 150,
                hpBonus: chosen.hpBonus || chosen.maxHp || 150,
                maxMp: chosen.maxMp || chosen.mpBonus || 100,
                mpBonus: chosen.mpBonus || chosen.maxMp || 100,
                crit: chosen.crit || chosen.critBonus || 2,
                critBonus: chosen.critBonus || chosen.crit || 2,
                spd: chosen.spd || chosen.speedBonus || 10,
                speedBonus: chosen.speedBonus || chosen.spd || 10,
                value: chosen.value || 100,
                icon: chosen.icon || 'fa-solid fa-khanda',
                image: chosen.image || './assets/images/item_bamboo_sword.jpg',
                desc: chosen.desc || `${chosen.name} rơi ra từ chiến tích viễn chinh.`
            };
        } else if (rollType < 0.80 && pillsCatalog.length > 0) {
            // RƠI ĐAN DƯỢC
            let candidateList = pillsCatalog.filter(p => p.tier === targetTier || p.rarity === tierRarity);
            if (candidateList.length === 0) candidateList = pillsCatalog;
            const chosen = candidateList[Math.floor(Math.random() * candidateList.length)];
            droppedItem = {
                id: chosen.id,
                name: chosen.name,
                type: 'pill',
                tier: chosen.tier || targetTier,
                rarity: chosen.rarity || tierRarity,
                count: 1,
                desc: chosen.desc,
                effect: chosen.effect || {},
                icon: chosen.icon || 'fa-solid fa-capsules',
                image: chosen.image || './assets/images/item_qi_pill_bottle.jpg',
                value: (chosen.rarity || 2) * 25
            };
        } else {
            // RƠI NGUYÊN LIỆU QUÝ
            const matList = [
                { id: 'mat_huyen_thiet', name: 'Huyền Thiết Ngàn Năm', type: 'material', tier: 'trung', count: 3, desc: 'Khoáng thạch quý rèn tạo pháp bảo.', icon: 'fa-solid fa-cubes-stacked', value: 15 },
                { id: 'mat_huyet_sam', name: 'Huyết Sâm Linh Căn', type: 'material', tier: 'thuong', count: 2, desc: 'Dược thảo thượng phẩm bồi bổ kinh mạch.', icon: 'fa-solid fa-seedling', value: 25 },
                { id: 'mat_linh_chi', name: 'Ngàn Năm Linh Chi', type: 'material', tier: 'thuong', count: 2, desc: 'Thần dược tự nhiên luyện chế đan dược.', icon: 'fa-solid fa-spa', value: 35 },
                { id: 'mat_thai_at_tinh', name: 'Thái Ất Tinh Kim', type: 'material', tier: 'cuc', count: 1, desc: 'Khoáng thạch viễn cổ đúc kiếm thai.', icon: 'fa-solid fa-gem', value: 80 }
            ];
            const chosen = matList[Math.floor(Math.random() * matList.length)];
            droppedItem = JSON.parse(JSON.stringify(chosen));
        }

        // 3. Cộng thêm Linh Thạch và Tiên Ngọc
        const bonusStones = Math.round(floor * 45 + Math.random() * 50);
        const bonusJade = Math.random() < 0.25 ? Math.max(1, Math.floor(floor / 10)) : 0;
        gs.spiritStones = (Number(gs.spiritStones || gs.stones) || 0) + bonusStones;
        if (gs.stones !== undefined) gs.stones = gs.spiritStones;
        if (bonusJade > 0) {
            gs.immortalJade = (Number(gs.immortalJade) || 0) + bonusJade;
        }

        // 4. Đưa vật phẩm vào GameState.inventory
        if (droppedItem) {
            const existing = gs.inventory.find(i => i.id === droppedItem.id);
            if (existing) {
                existing.count = (Number(existing.count) || 0) + (Number(droppedItem.count) || 1);
            } else {
                gs.inventory.push(droppedItem);
            }
        }

        // 5. Ghi log và Toast thông báo
        const sourceLabel = source === 'tower' ? `Trấn Yêu Tháp Tầng ${floor}` : (source === 'dungeon' ? 'Thám Hiểm Bí Cảnh' : 'Kỳ Ngộ Tiên Duyên');
        const itemName = droppedItem ? `[${droppedItem.name}] x${droppedItem.count || 1}` : 'Linh Bảo';
        const msg = `🎁 <b>${sourceLabel}</b> trảm sát yêu thú rơi bảo vật: <strong class="text-amber-300">${itemName}</strong> (+${bonusStones} Linh Thạch${bonusJade > 0 ? `, +${bonusJade} Tiên Ngọc` : ''})!`;

        if (typeof window.addLog === 'function') {
            window.addLog(`🎁 <span class="text-amber-400 font-bold">[Chiến Lợi Phẩm]</span> ${msg}`, 'text-amber-300');
        }

        if (typeof window.showXianxiaToast === 'function') {
            window.showXianxiaToast(`🎁 Thu hoạch: ${droppedItem ? droppedItem.name : 'Chiến lợi phẩm'} (+${bonusStones} LT)!`, 'success');
        }

        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        if (typeof window.saveGame === 'function') window.saveGame();
        if (typeof window.renderCharacterHub === 'function') window.renderCharacterHub();

        return droppedItem;
    }

    // Xuất bản Loot Drop & Dung Luyện toàn cục
    window.rollLootDrop = rollLootDrop;
    globalThis.rollLootDrop = rollLootDrop;

    // Tích hợp tìm kiếm toàn diện cho Tooltip
    if (typeof window !== 'undefined') {
        const nativeShowTooltip = window.showItemTooltip;
        window.showItemTooltip = function(e, itemId) {
            if (!e) return;
            let itemObj = (typeof itemId === 'object' && itemId !== null) ? itemId : null;
            if (!itemObj && typeof itemId === 'string') {
                const s = window.GameState || window.state || {};
                if (Array.isArray(s.inventory)) itemObj = s.inventory.find(i => i.id === itemId);
                if (!itemObj && Array.isArray(window.OFFICIAL_EQUIPMENT_CATALOG)) itemObj = window.OFFICIAL_EQUIPMENT_CATALOG.find(i => i.id === itemId);
                if (!itemObj && Array.isArray(window.EQUIPMENT_DATA)) itemObj = window.EQUIPMENT_DATA.find(i => i.id === itemId);
                if (!itemObj && Array.isArray(window.PILLS_DATA)) itemObj = window.PILLS_DATA.find(i => i.id === itemId);
                if (!itemObj && Array.isArray(window.HERBS_DATA)) itemObj = window.HERBS_DATA.find(i => i.id === itemId);
            }
            if (itemObj && typeof nativeShowTooltip === 'function') {
                nativeShowTooltip(e, itemObj);
            }
        };
    }

    window.checkAndApplyHeavenlySuppression = checkAndApplyHeavenlySuppression;
    window.performAscensionToLinhGioi = performMasterAscension;
    globalThis.performAscensionToLinhGioi = performMasterAscension;

    // Cung cấp hàm recalculatePlayerStats chuẩn hóa
    window.recalculatePlayerStats = function() {
        if (typeof window.recalculateAllStats === 'function') {
            return window.recalculateAllStats();
        }
    };
    globalThis.recalculatePlayerStats = window.recalculatePlayerStats;

    // Chu kỳ kiểm tra áp chế và đồng bộ
    setInterval(checkAndApplyHeavenlySuppression, 3000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachMasterListeners);
    } else {
        attachMasterListeners();
    }
})();
