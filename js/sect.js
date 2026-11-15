/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG TÔNG MÔN HẠ GIỚI (SECT SYSTEM)
 * ============================================================================
 * - Giai đoạn Hạ Giới: Người chơi không tự lập phái, chỉ làm đệ tử.
 * - Mở khóa từ: Luyện Khí Tầng 3 (realmIndex >= 2).
 * - 3 Đại Thế Lực: Thanh Vân Môn (+10% HP), Huyết Hồn Cốc (+10% ATK), Tán Tu Minh (+10% Linh Thạch).
 * - 3 Phân hệ: Nhiệm Vụ Đường (Idle), Tàng Kinh Các (Shop), Chấp Sự Điện (Thăng cấp).
 * ============================================================================
 */

let activeSectTab = 'quests'; // 'quests' | 'shop' | 'rank'

// 1. MỞ / ĐÓNG MODAL TÔNG MÔN
function openSectModal(initialTab = null) {
    if (typeof cutsceneState !== 'undefined' && cutsceneState && cutsceneState.inProgress) {
        if (typeof addLog === 'function') {
            addLog("⚡ Thần thức đang nghênh chiến Thiên Kiếp, không thể phân tâm bái sơn môn!", "text-amber-300");
        }
        return;
    }

    if (typeof hideAllGamePages === 'function') {
        hideAllGamePages('sect-modal');
    }

    const modal = document.getElementById('sect-modal');
    if (!modal) return;

    if (initialTab) activeSectTab = initialTab;

    modal.classList.remove('hidden');
    modal.classList.add('flex', 'active');
    modal.style.display = 'flex';

    renderSectModal();
}

function closeSectModal() {
    const modal = document.getElementById('sect-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'active');
    }
}

// RENDER STANDALONE SECT PAGE (CHUẨN FULL-PAGE SPA, ZERO SIDEBAR)
function renderSectPage(tab = activeSectTab || 'quests', hostContainer = null) {
    activeSectTab = tab;
    let content = hostContainer;
    if (!content) {
        if (tab === 'quests') content = document.getElementById('sect-quests-page-content');
        else if (tab === 'rank') content = document.getElementById('sect-rank-page-content');
        else if (tab === 'shop') content = document.getElementById('sect-shop-page-content');
        else if (tab === 'array') content = document.getElementById('sect-array-page-content');
    }
    if (!content) content = document.getElementById('sect-modal-content');
    if (!content) return;

    const playerRealmIndex = (typeof state !== 'undefined' && typeof state.realmIndex === 'number') ? state.realmIndex : 0;

    // Đảm bảo luôn có môn phái mặc định để giao diện hoạt động mượt mà
    if (!state.playerSect || !SECTS_DATA[state.playerSect]) {
        state.playerSect = 'thanh_van';
    }

    // ĐÃ GIA NHẬP TÔNG MÔN
    const sect = SECTS_DATA[state.playerSect];
    const curRankIdx = Number(window.GameState?.sectRank ?? state.sectRank) || 0;
    const rankCfg = (typeof SECT_RANKS !== 'undefined' && SECT_RANKS[curRankIdx]) ? SECT_RANKS[curRankIdx] : SECT_RANKS[0];
    const contribution = Number(window.GameState?.sectPoints ?? window.GameState?.sectContribution ?? state.sectContribution) || 0;
    const sectArrayLvl = Number(window.GameState?.sectArrayLevel ?? state.sectArrayLevel) || 1;

    // Tính toán cooldown Thỉnh An (24h)
    const timeScale = state.timeScale || 1;
    const cooldownMs = 86400000 / timeScale;
    const elapsed = Date.now() - (state.lastSectHomageTime || 0);
    const canHomage = elapsed >= cooldownMs;
    const remainingSec = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
    const remHours = Math.floor(remainingSec / 3600);
    const remMins = Math.floor((remainingSec % 3600) / 60);

    let dailyStones = rankCfg.dailyStones;
    if (state.playerSect === 'tan_tu') {
        dailyStones = Math.round(dailyStones * 1.10);
    }

    let subtabHtml = '';
    if (tab === 'quests') subtabHtml = renderSectQuestsTabHtml();
    else if (tab === 'rank') subtabHtml = renderSectRankTabHtml();
    else if (tab === 'shop') subtabHtml = renderSectShopTabHtml();
    else if (tab === 'array') subtabHtml = renderSectArrayTabHtml();
    else subtabHtml = renderSectQuestsTabHtml();

    content.innerHTML = `
        <div class="space-y-4">
            <!-- BANNER TỔNG QUAN TÔNG MÔN (STANDARDIZED HEADER INFO - ZERO SIDEBAR) -->
            <div class="card-dark-gradient p-4 rounded-2xl border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                    <span class="w-12 h-12 rounded-xl bg-slate-950/80 border ${sect.borderClass} flex items-center justify-center text-2xl ${sect.colorClass} shadow-md shrink-0">
                        <i class="fa-solid ${sect.icon}"></i>
                    </span>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-serif text-lg font-bold ${sect.colorClass}">${sect.name}</h3>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${sect.badgeBg}">
                                ${sect.alignment}
                            </span>
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-300">
                                ${rankCfg.name}
                            </span>
                        </div>
                        <p class="text-xs text-stone-300 mt-0.5">
                            <span class="font-bold text-amber-400"><i class="fa-solid fa-sparkles"></i> ${sect.buffDesc}</span>
                            <span class="text-stone-500 mx-1.5">•</span>
                            <span class="text-stone-400">Hộ Sơn Đại Trận: <strong class="text-amber-300">Cấp ${sectArrayLvl}</strong></span>
                        </p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-stone-800 flex items-center gap-2">
                        <span class="text-xs text-stone-400">Cống Hiến:</span>
                        <strong class="text-amber-300 font-mono text-sm">${contribution.toLocaleString('vi-VN')}</strong>
                    </div>

                    <!-- Nút Thỉnh An Sư Trưởng -->
                    <button id="btn-sect-homage" onclick="claimSectHomage()" ${canHomage ? '' : 'disabled'}
                            class="py-2 px-4 rounded-xl border font-bold text-xs tracking-wide transition shadow-lg flex items-center gap-2 ${canHomage ? 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border-amber-400/60 animate-pulse cursor-pointer' : 'bg-slate-900 text-stone-500 border-stone-800 cursor-not-allowed'}">
                        <i class="fa-solid fa-hands-praying text-amber-400"></i>
                        <span>${canHomage ? `Thỉnh An Sư Trưởng (+${dailyStones} Đá, +${rankCfg.dailyContribution} Cống Hiến)` : `Đã Thỉnh An (${remHours}h ${remMins}m)`}</span>
                    </button>
                </div>
            </div>

            <!-- PHÂN HỆ NỘI DUNG (FULL WIDTH, ĐỘC LẬP HOÀN TOÀN) -->
            <div id="sect-subtab-container" class="sect-subtab-container min-h-[400px]">
                ${subtabHtml}
            </div>
        </div>
    `;
}

// 2. RENDER VIEW CHÍNH
function renderSectModal() {
    if (document.getElementById('page-sect-quests')?.classList.contains('active')) {
        renderSectPage('quests', document.getElementById('sect-quests-page-content'));
        return;
    }
    if (document.getElementById('page-sect-rank')?.classList.contains('active')) {
        renderSectPage('rank', document.getElementById('sect-rank-page-content'));
        return;
    }
    if (document.getElementById('page-sect-shop')?.classList.contains('active')) {
        renderSectPage('shop', document.getElementById('sect-shop-page-content'));
        return;
    }
    if (document.getElementById('page-sect-array')?.classList.contains('active')) {
        renderSectPage('array', document.getElementById('sect-array-page-content'));
        return;
    }

    const content = document.getElementById('sect-modal-content');
    const titleEl = document.getElementById('sect-modal-title');
    const subtitleEl = document.getElementById('sect-modal-subtitle');
    const headerIcon = document.getElementById('sect-header-icon');
    const badgeRealm = document.getElementById('sect-badge-realm');
    const auraGlowTop = document.getElementById('sect-aura-glow');

    if (!content) return;

    const playerRealmIndex = (typeof state !== 'undefined' && typeof state.realmIndex === 'number') ? state.realmIndex : 0;

    // ĐIỀU KIỆN MỞ KHÓA: Luyện Khí Tầng 3 (realmIndex >= 2)
    if (playerRealmIndex < 2) {
        if (titleEl) titleEl.innerHTML = `<span>Tông Môn Hạ Giới</span>`;
        if (subtitleEl) subtitleEl.textContent = `Chưa đủ tư cách bái nhập môn phái`;
        if (headerIcon) headerIcon.innerHTML = `<i class="fa-solid fa-lock text-stone-400"></i>`;
        if (badgeRealm) {
            badgeRealm.textContent = "Chưa Đủ Điều Kiện";
            badgeRealm.className = "text-[10px] font-sans px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-600";
        }
        renderSectLockedView(content, playerRealmIndex);
        return;
    }

    // NẾU CHƯA GIA NHẬP TÔNG MÔN: HIỂN THỊ GIAO DIỆN CHỌN MÔN PHÁI
    if (!state.playerSect || !SECTS_DATA[state.playerSect]) {
        if (titleEl) titleEl.innerHTML = `<span>Gia Nhập Tông Môn</span>`;
        if (subtitleEl) subtitleEl.textContent = `Lựa chọn thế lực Hạ Giới để nương tựa tu hành`;
        if (headerIcon) headerIcon.innerHTML = `<i class="fa-solid fa-torii-gate text-amber-400"></i>`;
        if (badgeRealm) {
            badgeRealm.textContent = "Khai Sơn Thu Đồ";
            badgeRealm.className = "text-[10px] font-sans px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600";
        }
        if (auraGlowTop) auraGlowTop.className = "pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl";
        renderSectSelectionView(content);
        return;
    }

    // ĐÃ GIA NHẬP TÔNG MÔN: HIỂN THỊ SECT DASHBOARD
    const sect = SECTS_DATA[state.playerSect];
    const rankCfg = (typeof SECT_RANKS !== 'undefined' && SECT_RANKS[state.sectRank || 0]) ? SECT_RANKS[state.sectRank || 0] : SECT_RANKS[0];

    if (titleEl) titleEl.innerHTML = `<span>${sect.name}</span>`;
    if (subtitleEl) subtitleEl.textContent = `${sect.slogan} • ${sect.buffDesc}`;
    if (headerIcon) headerIcon.innerHTML = `<i class="fa-solid ${sect.icon} ${sect.colorClass}"></i>`;
    if (badgeRealm) {
        badgeRealm.textContent = rankCfg.name;
        badgeRealm.className = `text-[10px] font-sans px-2 py-0.5 rounded-full border ${rankCfg.badgeClass}`;
    }

    // Dynamic aura styling
    if (auraGlowTop) {
        const glowColor = sect.theme === 'sky' ? 'bg-sky-500/15' : (sect.theme === 'rose' ? 'bg-rose-500/15' : 'bg-amber-500/15');
        auraGlowTop.className = `pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full ${glowColor} blur-3xl`;
    }

    renderSectDashboardView(content);
}

// 3. GIAO DIỆN KHI CHƯA ĐẠT LUYỆN KHÍ TẦNG 3
function renderSectLockedView(content, currentRealmIdx) {
    const currentRealmName = (typeof REALMS !== 'undefined' && REALMS[currentRealmIdx]?.name) ? REALMS[currentRealmIdx].name : `Luyện Khí Tầng ${currentRealmIdx + 1}`;
    const progressPct = Math.min(100, Math.round(((currentRealmIdx + 1) / 3) * 100));

    content.innerHTML = `
        <div class="flex flex-col items-center text-center p-6 sm:p-8 bg-stone-900/60 rounded-2xl border border-stone-800">
            <div class="w-16 h-16 rounded-full bg-stone-950/80 border-2 border-stone-700 flex items-center justify-center text-3xl text-stone-500 mb-4 shadow-inner">
                <i class="fa-solid fa-lock"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-stone-200 uppercase tracking-widest mb-2">
                Chưa Đủ Tư Cách Bái Nhập Môn Phái
            </h3>
            <p class="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed mb-5">
                Các đại tiên môn ở Hạ Giới quy củ nghiêm cẩn, sơn môn đóng kín. Đạo hữu chỉ có thể xin bái nhập khi đã đạt tối thiểu <strong class="text-amber-300">Luyện Khí Tầng 3</strong>.
            </p>

            <div class="w-full max-w-xs bg-slate-950 p-3.5 rounded-xl border border-stone-800 space-y-2 mb-6">
                <div class="flex justify-between text-xs">
                    <span class="text-stone-400">Tiến độ căn cơ:</span>
                    <span class="text-amber-300 font-bold">${currentRealmName} / Luyện Khí Tầng 3</span>
                </div>
                <div class="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500" style="width: ${progressPct}%"></div>
                </div>
            </div>

            <button onclick="closeSectModal()" class="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-semibold tracking-wide transition shadow-md">
                Tiếp Tục Khổ Tu
            </button>
        </div>
    `;
}

// 4. GIAO DIỆN CHỌN TÔNG MÔN (3 THẾ LỰC)
function renderSectSelectionView(content) {
    const sects = Object.values(SECTS_DATA);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="text-center space-y-1">
                <h3 class="font-serif text-base sm:text-lg font-bold text-amber-200 tracking-wider">
                    KHAI SƠN THU ĐỒ — LỰA CHỌN MÔN PHÁI
                </h3>
                <p class="text-xs text-stone-400 max-w-lg mx-auto">
                    Mỗi môn phái mang sở trường và tín điều riêng biệt. Một khi đã bái nhập tông môn, <strong class="text-rose-400">cả đời không thể đổi phái</strong>. Đạo hữu hãy cân nhắc kỹ!
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                ${sects.map(s => {
                    const isSky = s.theme === 'sky';
                    const isRose = s.theme === 'rose';
                    const btnClass = isSky
                        ? 'bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 border-sky-400/50'
                        : (isRose ? 'bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border-rose-500/50' : 'bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 border-amber-500/50');

                    return `
                        <div class="flex flex-col justify-between p-4 rounded-2xl ${s.bgClass} border ${s.borderClass} shadow-lg relative overflow-hidden transition-all duration-200 hover:scale-[1.01]">
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="w-10 h-10 rounded-xl bg-slate-950/70 border ${s.borderClass} flex items-center justify-center text-xl ${s.colorClass}">
                                        <i class="fa-solid ${s.icon}"></i>
                                    </span>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeBg}">
                                        ${s.alignment}
                                    </span>
                                </div>

                                <div>
                                    <h4 class="font-serif text-base font-bold ${s.colorClass}">${s.name}</h4>
                                    <p class="text-[11px] font-serif italic text-stone-400 mt-0.5">"${s.slogan}"</p>
                                </div>

                                <p class="text-xs text-slate-300 leading-relaxed min-h-[44px]">
                                    ${s.desc}
                                </p>

                                <div class="p-2.5 rounded-xl bg-slate-950/80 border border-stone-800 text-xs">
                                    <div class="flex items-center gap-2 font-bold ${s.colorClass}">
                                        <i class="fa-solid ${isSky ? 'fa-heart-pulse' : (isRose ? 'fa-bolt' : 'fa-gem')}"></i>
                                        <span>${s.buffDesc}</span>
                                    </div>
                                </div>
                            </div>

                            <button onclick="confirmJoinSect('${s.id}')" class="w-full mt-4 py-2.5 rounded-xl border font-bold text-xs tracking-wider transition ${btnClass} shadow-md flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-scroll"></i>
                                <span>Bái Nhập Môn Phái</span>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Xác nhận gia nhập môn phái
function confirmJoinSect(sectId) {
    const sect = SECTS_DATA[sectId];
    if (!sect) return;

    if (confirm(`Đạo hữu có chắc chắn muốn bái nhập ${sect.name} (${sect.alignment})?\n\nChú ý: Sau khi gia nhập, không thể phản xuất môn phái hay đổi phái khác!`)) {
        joinSect(sectId);
    }
}

function joinSect(sectId) {
    const sect = SECTS_DATA[sectId];
    if (!sect) return;

    state.playerSect = sectId;
    state.sectRank = 0; // Đệ Tử Tạp Dịch
    state.sectContribution = 100; // Khởi đầu
    state.sectQuest = null;
    state.lastSectHomageTime = 0;
    if (!Array.isArray(state.sectPurchasedSkills)) state.sectPurchasedSkills = [];

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof addLog === 'function') {
        addLog(`🎉 <span class="font-bold text-amber-300">[Tông Môn]</span> Chúc mừng đạo hữu chính thức bái nhập <strong>${sect.name}</strong>, nhận thân phận <strong>Đệ Tử Tạp Dịch</strong>!`, 'text-amber-300 font-bold', 'join-sect');
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
}

// 5. GIAO DIỆN TÔNG MÔN CHÍNH (SECT DASHBOARD)
function renderSectDashboardView(content) {
    const sect = SECTS_DATA[state.playerSect] || SECTS_DATA.thanh_van;
    const rankIndex = Math.min(SECT_RANKS.length - 1, state.sectRank || 0);
    const rankCfg = SECT_RANKS[rankIndex];
    const contribution = state.sectContribution || 0;

    // Tính toán cooldown Thỉnh An (24h điều chỉnh theo timeScale)
    const timeScale = state.timeScale || 1;
    const cooldownMs = 86400000 / timeScale;
    const elapsed = Date.now() - (state.lastSectHomageTime || 0);
    const canHomage = elapsed >= cooldownMs;
    const remainingSec = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
    const remHours = Math.floor(remainingSec / 3600);
    const remMins = Math.floor((remainingSec % 3600) / 60);

    // Tính toán lương ngày
    let dailyStones = rankCfg.dailyStones;
    if (state.playerSect === 'tan_tu') {
        dailyStones = Math.round(dailyStones * 1.10);
    }

    const sectHeaders = {
        quests: '📜 NHIỆM VỤ ĐƯỜNG',
        shop: '📖 TÀNG KINH CÁC',
        rank: '🏛️ ĐIỆN TRƯỞNG LÃO (CHẤP SỰ ĐIỆN)',
        array: '🛡️ HỘ SƠN ĐẠI TRẬN & THÍ LUYỆN TRƯỞNG LÃO'
    };
    const currentSectHeader = sectHeaders[activeSectTab] || '⛩️ TÔNG MÔN ĐẠI ĐIỆN';
    const sectArrayLvl = Number(state.sectArrayLevel) || 1;

    content.innerHTML = `
        <div class="sect-pc-container" id="integration-sect-section">
            <!-- CỘT TRÁI (SIDEBAR - 25%): THÔNG TIN ĐỆ TỬ, THỈNH AN & DANH MỤC TÔNG MÔN -->
            <aside class="sect-sidebar">
                <div class="sect-sidebar-profile card-dark-gradient p-3.5 rounded-xl border border-stone-800 space-y-3">
                    <div class="flex items-center gap-2.5">
                        <span class="w-10 h-10 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 text-lg shadow-inner flex-shrink-0">
                            <i class="fa-solid ${sect.icon}"></i>
                        </span>
                        <div class="min-w-0 flex-1">
                            <h4 class="font-serif font-bold text-sm text-slate-100 truncate">${sect.name}</h4>
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-900 border border-stone-700 text-amber-300 mt-0.5">
                                ${rankCfg.name}
                            </span>
                        </div>
                    </div>

                    <div class="p-2 rounded-lg bg-slate-950/80 border border-stone-800/80 text-[11px] font-mono flex justify-between items-center">
                        <span class="text-stone-400">Điểm Cống Hiến:</span>
                        <strong id="sect-contribution-display" class="text-amber-300 text-xs">${contribution.toLocaleString('vi-VN')}</strong>
                    </div>

                    <!-- Nút Thỉnh An Sư Trưởng -->
                    <button id="btn-sect-homage" onclick="claimSectHomage()" ${canHomage ? '' : 'disabled'} class="w-full py-2 px-3 rounded-lg border font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${canHomage ? 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border-amber-400/60 animate-pulse cursor-pointer' : 'bg-slate-900 text-stone-500 border-stone-800 cursor-not-allowed'}">
                        <i class="fa-solid fa-hands-praying"></i>
                        <span>${canHomage ? `Thỉnh An (+${dailyStones} Đá, +${rankCfg.dailyContribution})` : `Đã Thỉnh An (${remHours}h ${remMins}m)`}</span>
                    </button>

                    <!-- DANH MỤC SUB-TABS TRONG TÔNG MÔN -->
                    <div class="pt-2 border-t border-stone-800/80 space-y-1.5">
                        <button type="button" onclick="switchSectTab('quests')" class="w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${activeSectTab === 'quests' ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-slate-900/60 text-slate-300 border-stone-800 hover:bg-slate-800'} cursor-pointer">
                            <i class="fa-solid fa-scroll text-amber-400 w-4 text-center"></i>
                            <span>Nhiệm Vụ Đường</span>
                        </button>
                        <button type="button" onclick="switchSectTab('shop')" class="w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${activeSectTab === 'shop' ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-slate-900/60 text-slate-300 border-stone-800 hover:bg-slate-800'} cursor-pointer">
                            <i class="fa-solid fa-book-open text-sky-400 w-4 text-center"></i>
                            <span>Tàng Kinh Các</span>
                        </button>
                        <button type="button" onclick="switchSectTab('rank')" class="w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${activeSectTab === 'rank' ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-slate-900/60 text-slate-300 border-stone-800 hover:bg-slate-800'} cursor-pointer">
                            <i class="fa-solid fa-landmark text-purple-400 w-4 text-center"></i>
                            <span>Điện Trưởng Lão</span>
                        </button>
                        <button type="button" onclick="switchSectTab('array')" class="w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${activeSectTab === 'array' ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-slate-900/60 text-slate-300 border-stone-800 hover:bg-slate-800'} cursor-pointer">
                            <i class="fa-solid fa-shield-halved text-emerald-400 w-4 text-center"></i>
                            <span>Hộ Sơn Trận & Thí Luyện</span>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- CỘT PHẢI (MAIN CONTENT - 75%): TIÊU ĐỀ TRANG & NỘI DUNG PHÂN HỆ -->
            <main class="sect-main-content space-y-4">
                <div class="page-header-title">
                    <h2 id="sect-page-header-h2">${currentSectHeader}</h2>
                </div>

                <!-- CẢNH QUAN TÔNG MÔN & ĐÀI LUYỆN KHÍ -->
                <div class="relative rounded-2xl border border-stone-700 bg-stone-950 overflow-hidden shadow-2xl h-32 sm:h-36">
                    <img src="./assets/images/bg_thanh_van_sect.jpg" alt="${sect.name}" class="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity scale-105">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>

                    <div class="absolute bottom-3 left-4 right-4 z-10 flex justify-between items-end gap-3">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                <h3 class="font-serif text-base sm:text-lg font-bold text-slate-100 tracking-wide">${sect.name}</h3>
                                <span class="text-[11px] text-stone-400 italic">(${sect.alignment || 'Chính Đạo'})</span>
                            </div>
                            <p class="text-[11px] text-stone-300 font-serif italic">${sect.buffDesc || 'Nơi quần sơn sương khói bế tắc, Phàm nhân mưu cầu tiên cơ'}</p>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                HỘ TÔNG TRẬN: CẤP ${sectArrayLvl}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- NỘI DUNG TRANG ĐANG CHỌN -->
                <div id="sect-subtab-container" class="sect-subtab-container min-h-[300px]">
                    ${activeSectTab === 'quests' ? renderSectQuestsTabHtml() : (activeSectTab === 'shop' ? renderSectShopTabHtml() : (activeSectTab === 'array' ? renderSectArrayTabHtml() : renderSectRankTabHtml()))}
                </div>
            </main>
        </div>
    `;
}

function switchSectTab(tabName) {
    activeSectTab = tabName;
    const container = document.getElementById('sect-subtab-container');
    if (!container) return renderSectModal();

    const sectHeaders = {
        quests: '📜 NHIỆM VỤ ĐƯỜNG',
        shop: '📖 TÀNG KINH CÁC',
        rank: '🏛️ ĐIỆN TRƯỞNG LÃO (CHẤP SỰ ĐIỆN)',
        array: '🛡️ HỘ SƠN ĐẠI TRẬN & THÍ LUYỆN TRƯỞNG LÃO'
    };
    const headerH2 = document.getElementById('sect-page-header-h2');
    if (headerH2) headerH2.textContent = sectHeaders[tabName] || '⛩️ TÔNG MÔN ĐẠI ĐIỆN';

    if (tabName === 'quests') container.innerHTML = renderSectQuestsTabHtml();
    else if (tabName === 'shop') container.innerHTML = renderSectShopTabHtml();
    else if (tabName === 'rank') container.innerHTML = renderSectRankTabHtml();
    else if (tabName === 'array') container.innerHTML = renderSectArrayTabHtml();
}

// 6. THỈNH AN SƯ TRƯỞNG / LĨNH LƯƠNG NGÀY
function claimSectHomage() {
    const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : {});
    const playerSect = s.playerSect || (typeof state !== 'undefined' ? state.playerSect : null) || 'thanh_van';
    s.playerSect = playerSect;
    if (typeof state !== 'undefined') state.playerSect = playerSect;

    const timeScale = s.timeScale || (typeof state !== 'undefined' ? state.timeScale : 1) || 1;
    const cooldownMs = 86400000 / timeScale;
    const lastTime = (s.lastSectHomageTime !== undefined) ? s.lastSectHomageTime : ((typeof state !== 'undefined' && state.lastSectHomageTime) || 0);
    const elapsed = Date.now() - lastTime;

    if (elapsed < cooldownMs) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast("ℹ️ Đạo hữu hôm nay đã thỉnh an sư trưởng rồi, hãy quay lại vào ngày mai!", "info");
        } else if (typeof addLog === 'function') {
            addLog("Đạo hữu hôm nay đã thỉnh an sư trưởng rồi, hãy quay lại vào ngày mai!", "text-stone-400");
        }
        return;
    }

    const rankIndex = Math.min(SECT_RANKS.length - 1, Number(s.sectRank ?? (typeof state !== 'undefined' ? state.sectRank : 0)) || 0);
    const rankCfg = SECT_RANKS[rankIndex] || SECT_RANKS[0];

    let stonesGained = rankCfg.dailyStones;
    if (playerSect === 'tan_tu') {
        stonesGained = Math.round(stonesGained * 1.10);
    }

    const now = Date.now();
    if (typeof state !== 'undefined') {
        state.stones = (state.stones || 0) + stonesGained;
        state.sectContribution = (state.sectContribution || 0) + rankCfg.dailyContribution;
        state.lastSectHomageTime = now;
    }

    if (window.GameState) {
        window.GameState.stones = (Number(window.GameState.stones) || 0) + stonesGained;
        window.GameState.spiritStones = window.GameState.stones;
        window.GameState.sectPoints = (Number(window.GameState.sectPoints) || 0) + rankCfg.dailyContribution;
        window.GameState.sectContribution = window.GameState.sectPoints;
        window.GameState.lastSectHomageTime = now;
    }
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`⛩️ Thỉnh an thành công: +${stonesGained} Linh Thạch, +${rankCfg.dailyContribution} Cống Hiến!`, 'success');
    }
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    if (typeof playSound === 'function') playSound('qi');
    if (typeof addLog === 'function') {
        addLog(`⛩️ <span class="text-amber-300 font-bold">[Tông Môn]</span> Thỉnh an sư trưởng thành kính, nhận bổng lộc: <strong>+${stonesGained} Linh Thạch</strong>, <strong>+${rankCfg.dailyContribution} Cống Hiến</strong>!`, 'text-gold-300 font-bold', 'sect-salary');
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    if (document.getElementById('page-sect-rank')?.classList.contains('active')) {
        renderSectPage('rank', document.getElementById('sect-rank-page-content'));
    } else {
        renderSectModal();
    }
}

// 7. TAB 1: NHIỆM VỤ ĐƯỜNG (SECT QUESTS)
const DEFAULT_SECT_QUESTS = [
    {
        id: "quest_tu_khi",
        name: "Tụ Khí Nhập Thể",
        desc: "Ngồi tĩnh tọa tại Tụ Linh Trận môn phái, vận chuyển chu thiên hấp thu linh khí cửu châu.",
        icon: "fa-person-praying",
        minRank: 0,
        mpCost: 2,
        durationSeconds: 15,
        rewardContribution: 80,
        rewardStones: 150,
        rewardExp: 150
    },
    {
        id: "quest_luyen_dan",
        name: "Đan Đạo Sơ Tâm",
        desc: "Khai lò trợ lực Đan Phòng, phụ giúp trưởng lão luyện chế một lô Dưỡng Khí Đan cơ bản.",
        icon: "fa-fire-burner",
        minRank: 0,
        mpCost: 3,
        durationSeconds: 25,
        rewardContribution: 150,
        rewardStones: 250,
        rewardExp: 220,
        rewardItem: { id: "pill_tay_cot_sect", name: "Tẩy Cốt Đan", count: 1 }
    },
    {
        id: "quest_tram_yeu",
        name: "Trảm Yêu Trừ Ma",
        desc: "Tiến vào Trấn Yêu Tháp hoặc vùng ngoại vi sơn môn trảm sát nghiệt súc quấy nhiễu.",
        icon: "fa-skull-crossbones",
        minRank: 1,
        mpCost: 5,
        durationSeconds: 35,
        rewardContribution: 250,
        rewardStones: 450,
        rewardExp: 350,
        rewardItem: { id: "loi_kiep_dich", name: "Yêu Thú Nội Đan", count: 1 }
    },
    {
        id: "quest_thinh_an",
        name: "Thỉnh An Sư Trưởng",
        desc: "Đến Chính Điện dâng linh trà vấn an Chưởng Môn và các vị Trưởng Lão hộ pháp.",
        icon: "fa-hands-praying",
        minRank: 0,
        mpCost: 2,
        durationSeconds: 10,
        rewardContribution: 60,
        rewardStones: 120,
        rewardExp: 80
    },
    {
        id: "quest_cong_nap_khoang",
        name: "Cống Nạp Huyền Thiết",
        desc: "Tìm kiếm và cống nạp khoáng thạch Huyền Thiết gia cố Hộ Sơn Đại Trận môn phái.",
        icon: "fa-hammer",
        minRank: 1,
        mpCost: 4,
        durationSeconds: 30,
        rewardContribution: 200,
        rewardStones: 350,
        rewardExp: 300,
        rewardItem: { id: "mat_huyen_thiet", name: "Huyền Thiết", count: 2 }
    }
];

function refreshSectQuests(forceWithStones = false) {
    const cost = 50;
    const now = Date.now();
    const cooldownMs = 180000; // 3 phút tự động làm mới miễn phí
    const lastRefresh = state.lastSectQuestRefreshTime || 0;
    const canFree = (now - lastRefresh) >= cooldownMs;

    if (forceWithStones) {
        if ((state.stones || 0) < cost) {
            if (typeof addLog === 'function') addLog(`⚠️ Không đủ Linh Thạch! Cần ${cost} Linh Thạch để làm mới bảng nhiệm vụ ngay lập tức.`, 'text-rose-400');
            return;
        }
        state.stones -= cost;
        state.lastSectQuestRefreshTime = now;
        if (window.GameState) window.GameState.spiritStones = state.stones;
        if (typeof addLog === 'function') {
            addLog(`🔄 <span class="text-amber-300 font-bold">[Chấp Sự Điện]</span> Tiêu hao <strong>${cost} Linh Thạch</strong> làm mới bảng vàng nhiệm vụ môn phái ngay lập tức!`, "text-amber-300");
        }
    } else {
        state.lastSectQuestRefreshTime = now;
        if (typeof addLog === 'function') {
            addLog(`🔄 <span class="text-amber-300 font-bold">[Nhiệm Vụ Đường]</span> Chấp sự điện đã làm mới danh sách bảng vàng nhiệm vụ môn phái!`, "text-amber-300");
        }
    }

    if (typeof playSound === 'function') playSound('click');
    if (typeof window.saveGameState === 'function') window.saveGameState();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();

    if (document.getElementById('page-sect-quests')?.classList.contains('active')) {
        renderSectPage('quests', document.getElementById('sect-quests-page-content'));
    } else {
        renderSectModal();
    }
}
window.refreshSectQuests = refreshSectQuests;

function ensureSectActiveQuests(s) {
    if (!s) return [];
    if (!Array.isArray(s.sectActiveQuests)) {
        s.sectActiveQuests = [];
    }
    if (s.sectQuest && !s.sectActiveQuests.some(q => q && q.id === s.sectQuest.id)) {
        s.sectActiveQuests.push(s.sectQuest);
    }
    return s.sectActiveQuests;
}

// Hook cộng dồn tiến độ nhiệm vụ từ mọi màn hình (tu luyện, luyện đan, đánh tháp, gia viên)
function progressSectQuest(actionType, bonusSeconds = 5) {
    const s = (typeof state !== 'undefined' ? state : null) || window.state || (window.GameState ? window.GameState._rawState : null);
    if (!s) return;
    const activeQuests = ensureSectActiveQuests(s);
    if (!activeQuests.length) return;

    let anyUpdated = false;
    for (const q of activeQuests) {
        if (!q || !q.inProgress || q.completed) continue;
        let applies = false;
        let reason = '';

        if ((actionType === 'cultivate' || actionType === 'meditate') && (q.id === 'quest_tu_khi' || q.id === 'quest_thinh_an')) {
            applies = true;
            reason = 'Tĩnh tọa tu luyện';
        } else if (actionType === 'alchemy' && q.id === 'quest_luyen_dan') {
            applies = true;
            bonusSeconds = Math.max(bonusSeconds, 15);
            reason = 'Khai lò luyện đan';
        } else if ((actionType === 'tower' || actionType === 'combat') && q.id === 'quest_tram_yeu') {
            applies = true;
            bonusSeconds = Math.max(bonusSeconds, 15);
            reason = 'Trảm yêu trừ ma';
        } else if ((actionType === 'estate' || actionType === 'mine') && q.id === 'quest_cong_nap_khoang') {
            applies = true;
            bonusSeconds = Math.max(bonusSeconds, 15);
            reason = 'Khai thác khoáng thạch';
        } else if (actionType === 'any') {
            applies = true;
            reason = 'Hành động tu tiên';
        }

        if (applies) {
            anyUpdated = true;
            q.elapsedSeconds = Math.min(q.durationSeconds, (q.elapsedSeconds || 0) + bonusSeconds);
            if (q.elapsedSeconds >= q.durationSeconds) {
                q.elapsedSeconds = q.durationSeconds;
                q.completed = true;
                q.inProgress = false;
                if (typeof addLog === 'function') {
                    addLog(`⚡ <span class="text-emerald-400 font-bold">[Nhiệm Vụ Tông Môn]</span> Nhờ <strong>${reason}</strong>, nhiệm vụ "${q.name}" đã hoàn tất! Mau tới Nhiệm Vụ Đường lĩnh thưởng!`, "text-emerald-300 font-bold", "sect-quest-ready");
                }
            }
        }
    }

    if (anyUpdated) {
        s.sectQuest = activeQuests[0] || null;
        if (typeof updateSectLiveUI === 'function') updateSectLiveUI();
    }
}
window.progressSectQuest = progressSectQuest;
globalThis.progressSectQuest = progressSectQuest;

function renderSectQuestsTabHtml() {
    const currentRank = state.sectRank || 0;
    const activeQuests = ensureSectActiveQuests(state);
    const quests = (typeof DEFAULT_SECT_QUESTS !== 'undefined' && DEFAULT_SECT_QUESTS.length) ? DEFAULT_SECT_QUESTS : (typeof SECT_QUESTS !== 'undefined' ? SECT_QUESTS : []);

    const now = Date.now();
    const lastRefresh = state.lastSectQuestRefreshTime || now;
    const remRefreshSec = Math.max(0, Math.ceil((180000 - (now - lastRefresh)) / 1000));
    const remM = Math.floor(remRefreshSec / 60);
    const remS = remRefreshSec % 60;

    return `
        <div class="space-y-4">
            <!-- HEADER TOOLBAR -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
                <div class="flex items-center gap-2">
                    <span class="text-amber-400 text-sm"><i class="fa-solid fa-scroll"></i></span>
                    <div>
                        <h4 class="text-xs font-bold text-slate-200 tracking-wider uppercase">Bảng Vàng Nhiệm Vụ Môn Phái</h4>
                        <span class="text-[10px] font-mono text-stone-400 block">Đang tiếp nhận: <b class="text-amber-300">${activeQuests.length} / 3 nhiệm vụ</b> • Làm mới sau: <b class="text-amber-400">${remM}:${remS < 10 ? '0' : ''}${remS}</b></span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${remRefreshSec <= 0 ? `
                        <button type="button" onclick="refreshSectQuests(false)" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm">
                            <i class="fa-solid fa-arrows-rotate"></i> Làm Mới (Miễn Phí)
                        </button>
                    ` : ''}
                    <button type="button" onclick="refreshSectQuests(true)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-bolt"></i> Làm Mới (50 LT)
                    </button>
                </div>
            </div>

            <!-- ACTIVE QUESTS DISPLAY (TỐI ĐA 3 NHIỆM VỤ TIẾP NHẬN ĐỒNG THỜI) -->
            ${activeQuests.length > 0 ? `
                <div class="space-y-2.5">
                    <div class="text-[11px] font-bold text-amber-300/90 flex items-center gap-1.5">
                        <i class="fa-solid fa-list-check"></i> Nhiệm Vụ Đang Thực Thi (${activeQuests.length}/3):
                    </div>
                    ${activeQuests.map(q => `
                        <div class="p-3.5 rounded-xl ${q.completed ? 'bg-emerald-950/40 border-emerald-500/60' : 'bg-slate-900/90 border-amber-500/50'} border shadow-md space-y-2.5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-7 h-7 rounded-lg ${q.completed ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-950 text-amber-300'} flex items-center justify-center text-xs">
                                        <i class="fa-solid ${q.completed ? 'fa-check' : 'fa-hourglass-half animate-spin-slow'}"></i>
                                    </span>
                                    <div>
                                        <h4 class="text-xs font-bold text-slate-100">${q.name}</h4>
                                        <span class="text-[10px] text-stone-400">
                                            Thù lao: +${q.rewardContribution} Cống Hiến, +${q.rewardStones} Linh Thạch
                                        </span>
                                    </div>
                                </div>

                                ${q.completed ? `
                                    <button onclick="claimSectQuestReward('${q.id}')" class="px-3.5 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border border-emerald-400 font-bold text-xs animate-bounce shadow-md cursor-pointer flex items-center gap-1">
                                        <i class="fa-solid fa-gift"></i> Lĩnh Thưởng
                                    </button>
                                ` : `
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/30">
                                            ${formatDuration(Math.max(0, q.durationSeconds - (q.elapsedSeconds || 0)))}
                                        </span>
                                        <button onclick="cancelSectQuest('${q.id}')" class="text-[11px] text-stone-500 hover:text-rose-400 px-1.5 py-0.5 rounded transition cursor-pointer" title="Hủy nhiệm vụ">
                                            <i class="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                `}
                            </div>

                            <!-- Progress Bar -->
                            <div class="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300" style="width: ${Math.min(100, Math.round(((q.elapsedSeconds || 0) / q.durationSeconds) * 100))}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- DANH SÁCH NHIỆM VỤ CÓ THỂ TIẾP NHẬN -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${quests.map(q => {
                    const isRankEnough = currentRank >= q.minRank;
                    const reqRankCfg = SECT_RANKS[q.minRank] || { name: 'Môn Phái' };
                    const isMpEnough = (state.mp || 0) >= q.mpCost;
                    const isAlreadyAccepted = activeQuests.some(aq => aq && aq.id === q.id);
                    const isMaxQuests = activeQuests.length >= 3;

                    return `
                        <div class="p-3.5 rounded-xl bg-slate-900/70 border border-stone-800 flex flex-col justify-between gap-3 hover:border-stone-700 transition">
                            <div class="space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="fa-solid ${q.icon} text-amber-400 text-sm"></i>
                                        <h5 class="text-xs font-bold text-slate-200">${q.name}</h5>
                                    </div>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-stone-400 border border-stone-800">
                                        ⏱️ ${formatDuration(q.durationSeconds)}
                                    </span>
                                </div>
                                <p class="text-[11px] text-stone-400 leading-snug">${q.desc}</p>
                                
                                <div class="flex items-center gap-2 text-[10px] text-amber-300/90 pt-1 flex-wrap">
                                    <span>🏆 +${q.rewardContribution} Cống Hiến</span>
                                    <span>💎 +${q.rewardStones} Đá</span>
                                    <span>⚡ Tiêu hao: ${q.mpCost} MP</span>
                                    ${q.rewardItem ? `<span class="text-emerald-400">🎁 +${q.rewardItem.count} ${q.rewardItem.name}</span>` : ''}
                                </div>
                            </div>

                            <div>
                                ${!isRankEnough ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-[11px] font-semibold cursor-not-allowed">
                                        Yêu cầu ${reqRankCfg.name}
                                    </button>
                                ` : isAlreadyAccepted ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold cursor-default">
                                        ✓ Đang Thực Thi
                                    </button>
                                ` : isMaxQuests ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-[11px] font-semibold cursor-not-allowed">
                                        Đã nhận tối đa 3 nhiệm vụ
                                    </button>
                                ` : !isMpEnough ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-stone-900 text-rose-400/70 border border-rose-900/50 text-[11px] font-semibold cursor-not-allowed">
                                        Thiếu Linh Lực (${state.mp || 0}/${q.mpCost})
                                    </button>
                                ` : `
                                    <button onclick="startSectQuest('${q.id}')" class="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition shadow-sm cursor-pointer">
                                        Tiến Hành Nhiệm Vụ
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function startSectQuest(questId) {
    const activeQuests = ensureSectActiveQuests(state);
    if (activeQuests.length >= 3) {
        const msg = "Đạo hữu đã tiếp nhận tối đa 3 nhiệm vụ cùng lúc, hãy hoàn thành trước!";
        if (typeof addLog === 'function') addLog(msg, "text-stone-400");
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, "warning");
        return;
    }

    if (activeQuests.some(q => q && q.id === questId)) {
        if (typeof addLog === 'function') addLog("Nhiệm vụ này đang được thực thi!", "text-stone-400");
        return;
    }

    const questPool = (typeof DEFAULT_SECT_QUESTS !== 'undefined' && Array.isArray(DEFAULT_SECT_QUESTS)) ? DEFAULT_SECT_QUESTS : (typeof SECT_QUESTS !== 'undefined' ? SECT_QUESTS : []);
    const quest = questPool.find(q => q.id === questId) || (typeof SECT_QUESTS !== 'undefined' ? SECT_QUESTS.find(q => q.id === questId) : null);
    if (!quest) return;

    if ((state.sectRank || 0) < quest.minRank) {
        if (typeof addLog === 'function') addLog("Thân phận chưa đủ để tiếp nhận nhiệm vụ này!", "text-rose-400");
        return;
    }

    if ((state.mp || 0) < quest.mpCost) {
        if (typeof addLog === 'function') addLog("Linh lực bất túc, hãy điều tức hồi phục trước khi nhận việc!", "text-rose-400");
        return;
    }

    // Tiêu hao MP
    state.mp -= quest.mpCost;
    if (window.GameState) window.GameState.mp = state.mp;

    const newQuest = {
        id: quest.id,
        name: quest.name,
        startTime: Date.now(),
        durationSeconds: quest.durationSeconds,
        elapsedSeconds: 0,
        rewardContribution: quest.rewardContribution,
        rewardStones: quest.rewardStones,
        rewardExp: quest.rewardExp,
        rewardItem: quest.rewardItem,
        inProgress: true,
        completed: false
    };

    activeQuests.push(newQuest);
    state.sectQuest = activeQuests[0] || newQuest;

    if (typeof playSound === 'function') playSound('sword');
    if (typeof addLog === 'function') {
        addLog(`📜 <span class="text-sky-300 font-bold">[Tông Môn]</span> Tiếp nhận nhiệm vụ <strong>"${quest.name}"</strong> (${activeQuests.length}/3), bắt đầu thực thi!`, "text-sky-300", "sect-quest");
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    if (document.getElementById('page-sect-quests')?.classList.contains('active')) {
        renderSectPage('quests', document.getElementById('sect-quests-page-content'));
    } else {
        renderSectModal();
    }
}

function claimSectQuestReward(questId) {
    const activeQuests = ensureSectActiveQuests(state);
    const targetIdx = questId ? activeQuests.findIndex(q => q && q.id === questId && q.completed) : activeQuests.findIndex(q => q && q.completed);
    if (targetIdx === -1) return;
    const q = activeQuests[targetIdx];

    const contribGained = q.rewardContribution;
    let stonesGained = q.rewardStones;
    if (state.playerSect === 'tan_tu') {
        stonesGained = Math.round(stonesGained * 1.10);
    }
    const expGained = q.rewardExp;

    state.sectContribution = (state.sectContribution || 0) + contribGained;
    state.stones = (state.stones || 0) + stonesGained;
    if (typeof addExp === 'function') addExp(expGained);

    // Đồng bộ GameState
    if (window.GameState) {
        window.GameState.sectPoints = (Number(window.GameState.sectPoints) || 0) + contribGained;
        window.GameState.sectContribution = window.GameState.sectPoints;
        window.GameState.stones = (Number(window.GameState.stones) || 0) + stonesGained;
        window.GameState.spiritStones = window.GameState.stones;
    }

    // Phần thưởng vật phẩm nếu có
    if (q.rewardItem) {
        const inv = (window.GameState && Array.isArray(window.GameState.inventory)) ? window.GameState.inventory : state.inventory;
        const existing = inv.find(i => i && i.id === q.rewardItem.id);
        if (existing) {
            existing.count = (existing.count || 0) + q.rewardItem.count;
        } else {
            inv.push({
                id: q.rewardItem.id,
                name: q.rewardItem.name,
                type: "Nguyên Liệu",
                count: q.rewardItem.count,
                rarity: 2,
                desc: "Chiến lợi phẩm thu hoạch từ nhiệm vụ môn phái.",
                icon: "fa-box-open"
            });
        }
        if (state.inventory !== inv) state.inventory = inv;
    }

    // Xóa khỏi danh sách active
    activeQuests.splice(targetIdx, 1);
    state.sectQuest = activeQuests[0] || null;

    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof addLog === 'function') {
        addLog(`🎁 <span class="text-emerald-400 font-bold">[Nhiệm Vụ Hoàn Thành]</span> Nhận: <strong>+${contribGained} Cống Hiến</strong>, <strong>+${stonesGained} Linh Thạch</strong>, <strong>+${expGained} Tu Vi</strong>!`, "text-emerald-300 font-bold", "sect-quest-done");
    }
    if (typeof window.showGameToast === 'function') {
        window.showGameToast(`🎁 Hoàn thành: +${contribGained} Cống Hiến, +${stonesGained} Linh Thạch!`, 'success');
    }

    if (document.getElementById('page-sect-quests')?.classList.contains('active')) {
        renderSectPage('quests', document.getElementById('sect-quests-page-content'));
    } else {
        renderSectModal();
    }
}

function cancelSectQuest(questId) {
    const activeQuests = ensureSectActiveQuests(state);
    const targetIdx = questId ? activeQuests.findIndex(q => q && q.id === questId) : 0;
    if (targetIdx === -1 || !activeQuests[targetIdx]) return;

    if (confirm("Đạo hữu có chắc chắn muốn hủy nhiệm vụ này? Linh lực đã tiêu hao sẽ không được hoàn trả.")) {
        activeQuests.splice(targetIdx, 1);
        state.sectQuest = activeQuests[0] || null;
        if (typeof saveGameState === 'function') saveGameState();
        if (document.getElementById('page-sect-quests')?.classList.contains('active')) {
            renderSectPage('quests', document.getElementById('sect-quests-page-content'));
        } else {
            renderSectModal();
        }
    }
}

// 8. TAB 2: TÀNG KINH CÁC (SECT SHOP)
const SECT_RECIPE_CAULDRON_ITEMS = [
    {
        id: "recipe_truc_co_dan",
        sectId: "all",
        name: "Đan Phương: Trúc Cơ Đan",
        type: "Đan Phương",
        category: "dan_phuong",
        tier: "linh",
        minRank: 1,
        price: 300,
        icon: "fa-scroll",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Phương thuốc chuẩn mực của môn phái luyện chế Trúc Cơ Đan tăng tỷ lệ phá cảnh.",
        effect: "Mở khóa công thức luyện Trúc Cơ Đan trong Luyện Đan Phòng"
    },
    {
        id: "recipe_tay_tuy_dan",
        sectId: "all",
        name: "Đan Phương: Tẩy Tủy Đan",
        type: "Đan Phương",
        category: "dan_phuong",
        tier: "huyen",
        minRank: 2,
        price: 600,
        icon: "fa-scroll",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Bí pháp phối hợp dược thảo tẩy trần tạp chất, vững bền căn cốt.",
        effect: "Mở khóa công thức luyện Tẩy Tủy Đan trong Luyện Đan Phòng"
    },
    {
        id: "cauldron_bat_quai",
        sectId: "all",
        name: "Bát Quái Huyền Thiết Lò",
        type: "Lò Đan",
        category: "lo_dan",
        tier: "dia",
        minRank: 2,
        price: 1000,
        icon: "fa-fire-burner",
        image: "./assets/images/item_dan_pot_tier1.jpg",
        desc: "Lò luyện đan đúc từ Huyền Thiết ngàn năm, tương trợ hỏa hầu đan đạo.",
        effect: "+25% Tỷ lệ thành đan, +15% Xác suất đan dược cực phẩm"
    },
    {
        id: "cauldron_cuu_long",
        sectId: "all",
        name: "Cửu Long Ly Hỏa Đỉnh",
        type: "Lò Đan",
        category: "lo_dan",
        tier: "thien",
        minRank: 3,
        price: 2500,
        icon: "fa-fire-burner",
        image: "./assets/images/item_dan_pot_tier2.jpg",
        desc: "Đỉnh lô thượng cổ khắc cửu long, dẫn chân hỏa ngưng tụ cực phẩm linh đan.",
        effect: "+50% Tỷ lệ thành đan, +35% Tỷ lệ dị biến đan văn"
    }
];

function renderSectShopTabHtml() {
    const currentRank = state.sectRank || 0;
    const currentContrib = state.sectContribution || 0;
    const purchased = Array.isArray(state.sectPurchasedSkills) ? state.sectPurchasedSkills : [];
    const playerSectId = state.playerSect;

    // Hợp nhất item kho bí tịch + đan phương + lò đan
    let allPool = (typeof SECT_SHOP_ITEMS !== 'undefined' && Array.isArray(SECT_SHOP_ITEMS)) ? [...SECT_SHOP_ITEMS] : [];
    SECT_RECIPE_CAULDRON_ITEMS.forEach(r => {
        if (!allPool.some(item => item.id === r.id)) allPool.push(r);
    });

    // Lọc vật phẩm cho môn phái hiện tại + vật phẩm chung
    const items = allPool.filter(it => it.sectId === playerSectId || it.sectId === 'all');

    return `
        <div class="space-y-3">
            <div class="flex items-center justify-between text-xs text-stone-400 pb-1 border-b border-stone-800">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-book-bookmark text-amber-400"></i> Tàng Kinh Các: Bí tịch, Đan phương & Lò đan độc quyền</span>
                <span class="text-amber-300 font-bold font-mono">Cống Hiến: ${currentContrib.toLocaleString('vi-VN')}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${items.map(item => {
                    const isSkill = item.type === 'Tâm Pháp' || item.type === 'Vũ Kỹ';
                    const isBought = isSkill && purchased.includes(item.id);
                    const isRankEnough = currentRank >= item.minRank;
                    const reqRankCfg = SECT_RANKS[item.minRank] || { name: 'Môn Phái' };
                    const isContribEnough = currentContrib >= item.price;
                    const tierBorder = item.tier === 'thien' ? 'border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                                       item.tier === 'dia' ? 'border-purple-500/70 shadow-[0_0_6px_rgba(168,85,247,0.25)]' :
                                       item.tier === 'huyen' ? 'border-sky-500/60' :
                                       item.tier === 'linh' ? 'border-emerald-500/60' : 'border-stone-700';

                    return `
                        <div class="p-3.5 rounded-xl bg-slate-900/70 border ${tierBorder} flex flex-col justify-between gap-2.5 hover:border-amber-400/60 transition">
                            <div class="space-y-1">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 shrink-0 bg-slate-950 flex items-center justify-center shadow-md">
                                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">` : `<i class="fa-solid ${item.icon || (isSkill ? 'fa-scroll' : 'fa-pills')} text-amber-400 text-sm"></i>`}
                                        </div>
                                        <div>
                                            <h5 class="text-xs font-bold text-slate-100">${item.name}</h5>
                                            <span class="text-[9.5px] text-amber-400/80 font-mono">${item.category === 'tam_phap' ? '📜 Tâm Pháp' : item.category === 'vu_ky' ? '🗡️ Vũ Kỹ' : item.category === 'dan_phuong' ? '📜 Đan Phương' : item.category === 'lo_dan' ? '🔥 Lò Đan' : '💊 Đan Dược'}</span>
                                        </div>
                                    </div>
                                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-stone-800">
                                        ${item.type}
                                    </span>
                                </div>
                                <p class="text-[11px] text-stone-400">${item.desc}</p>
                                <p class="text-[11px] text-emerald-400 font-semibold">${item.effect}</p>
                            </div>

                            <div class="flex items-center justify-between pt-1 border-t border-stone-800/80">
                                <span class="text-xs font-mono font-bold text-amber-300">
                                    <i class="fa-solid fa-award text-amber-400 mr-1"></i>${item.price.toLocaleString('vi-VN')} Điểm
                                </span>

                                <div>
                                    ${isBought ? `
                                        <span class="px-3 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 text-[11px] font-bold">
                                            ✓ Đã Lĩnh Ngộ
                                        </span>
                                    ` : !isRankEnough ? `
                                        <span class="px-2.5 py-1 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-[11px] font-semibold">
                                            Khóa (${reqRankCfg.name})
                                        </span>
                                    ` : !isContribEnough ? `
                                        <button disabled class="px-3 py-1 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-[11px] font-semibold cursor-not-allowed">
                                            Thiếu Cống Hiến
                                        </button>
                                    ` : `
                                        <button onclick="buySectShopItem('${item.id}')" class="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/50 text-[11px] font-bold transition shadow-sm cursor-pointer">
                                            Đổi Ngay
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function buySectShopItem(itemId) {
    let allPool = (typeof SECT_SHOP_ITEMS !== 'undefined' && Array.isArray(SECT_SHOP_ITEMS)) ? [...SECT_SHOP_ITEMS] : [];
    if (typeof SECT_RECIPE_CAULDRON_ITEMS !== 'undefined' && Array.isArray(SECT_RECIPE_CAULDRON_ITEMS)) {
        SECT_RECIPE_CAULDRON_ITEMS.forEach(r => {
            if (!allPool.some(item => item.id === r.id)) allPool.push(r);
        });
    }
    const item = allPool.find(it => it.id === itemId);
    if (!item) return;

    const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : {});
    const curRank = Number(s.sectRank ?? (typeof state !== 'undefined' ? state.sectRank : 0)) || 0;
    if (curRank < item.minRank) {
        const msg = "Thân phận chưa đủ để đổi vật phẩm này!";
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, "warning");
        else if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        return;
    }

    const curContrib = Number(s.sectPoints ?? s.sectContribution ?? (typeof state !== 'undefined' ? state.sectContribution : 0)) || 0;
    if (curContrib < item.price) {
        const msg = "Điểm cống hiến môn phái không đủ!";
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, "warning");
        else if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        return;
    }

    const purchasedSkills = s.sectPurchasedSkills || (typeof state !== 'undefined' ? state.sectPurchasedSkills : []) || [];
    const isSkill = item.type === 'Tâm Pháp' || item.type === 'Vũ Kỹ';
    if (isSkill && purchasedSkills.includes(item.id)) {
        const msg = "Đạo hữu đã lĩnh ngộ bí kíp này rồi!";
        if (typeof window.showGameToast === 'function') window.showGameToast(`ℹ️ ${msg}`, "info");
        else if (typeof addLog === 'function') addLog(msg, "text-amber-300");
        return;
    }

    // Trừ cống hiến an toàn
    const newContrib = Math.max(0, curContrib - item.price);
    if (typeof state !== 'undefined') {
        state.sectContribution = newContrib;
        if (!Array.isArray(state.sectPurchasedSkills)) state.sectPurchasedSkills = [];
    }
    if (window.GameState) {
        window.GameState.sectPoints = newContrib;
        window.GameState.sectContribution = newContrib;
    }

    if (isSkill) {
        state.sectPurchasedSkills.push(item.id);
        if (window.GameState) {
            if (!Array.isArray(window.GameState.sectPurchasedSkills)) window.GameState.sectPurchasedSkills = [];
            if (!window.GameState.sectPurchasedSkills.includes(item.id)) window.GameState.sectPurchasedSkills.push(item.id);
        }

        // Đăng ký vào SKILLS_DATA nếu chưa có
        if (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA) && !SKILLS_DATA.some(s => s.id === item.id)) {
            SKILLS_DATA.push({
                id: item.id,
                name: item.name,
                type: item.type === 'Tâm Pháp' ? 'TamPhap' : 'VuKy',
                category: item.category,
                tier: item.tier,
                element: 'vo_he',
                stats: item.stats || {},
                effect: item.effect,
                desc: item.desc
            });
        }

        // Tự động lĩnh ngộ vào learnedSkills
        if (!Array.isArray(state.learnedSkills)) state.learnedSkills = [];
        if (!state.learnedSkills.some(s => s.id === item.id)) {
            state.learnedSkills.push({ id: item.id, level: 1 });
        }
        if (window.GameState) {
            if (!Array.isArray(window.GameState.learnedSkills)) window.GameState.learnedSkills = [];
            if (!window.GameState.learnedSkills.some(s => s.id === item.id)) {
                window.GameState.learnedSkills.push({ id: item.id, level: 1 });
            }
        }

        if (typeof playSound === 'function') playSound('breakthrough');
        const logMsg = `📖 <span class="text-amber-300 font-bold">[Tàng Kinh Các]</span> Đạo hữu dùng ${item.price} Cống Hiến đổi được và lập tức lĩnh ngộ: <strong>${item.name}</strong>!`;
        if (typeof addLog === 'function') addLog(logMsg, "text-amber-300 font-bold", "sect-buy-skill");
        if (typeof window.showGameToast === 'function') window.showGameToast(`📖 Lĩnh ngộ thành công: ${item.name}!`, "success");
    } else {
        // Đan Phương / Lò Đan / Đan Dược
        if (item.action === 'gain_exp_1000') {
            if (typeof addExp === 'function') addExp(1000);
            if (typeof playSound === 'function') playSound('qi');
            const logMsg = `💊 <span class="text-emerald-400 font-bold">[Tông Môn Đan Dược]</span> Phục dụng <strong>${item.name}</strong>, gân cốt thông suốt, nhận ngay <strong>+1,000 Tu Vi</strong>!`;
            if (typeof addLog === 'function') addLog(logMsg, "text-emerald-300 font-bold", "sect-use-pill");
            if (typeof window.showGameToast === 'function') window.showGameToast(`💊 Phục dụng ${item.name} (+1.000 Tu Vi)!`, "success");
        } else if (item.action === 'clear_tam_ma_10' || item.id === 'pill_thanh_tam') {
            state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + 10);
            state.tamMa = Math.max(0, 100 - state.daoTam);
            if (window.GameState) {
                window.GameState.daoTam = state.daoTam;
                window.GameState.tamMa = state.tamMa;
            }
            if (typeof playSound === 'function') playSound('bell');
            const logMsg = `🌿 <span class="text-teal-300 font-bold">[Thanh Tâm Đan]</span> Dược lực thanh tịnh tan vào thần hồn, tiêu trừ 10 Tâm Ma, Đạo Tâm tăng lên (${state.daoTam}/100)!`;
            if (typeof addLog === 'function') addLog(logMsg, "text-teal-300 font-bold", "sect-use-pill");
            if (typeof window.showGameToast === 'function') window.showGameToast(`🌿 Tiêu trừ 10 Tâm Ma, Đạo Tâm đạt ${state.daoTam}!`, "success");
        } else if (item.action === 'gain_perm_stats') {
            if (!state.permPillStats) state.permPillStats = { hp: 0, atk: 0, def: 0 };
            const hpGain = Number(item.stats?.hp) || 0;
            const atkGain = Number(item.stats?.atk) || 0;
            state.permPillStats.hp = (state.permPillStats.hp || 0) + hpGain;
            state.permPillStats.atk = (state.permPillStats.atk || 0) + atkGain;
            if (window.GameState) {
                window.GameState.permPillStats = state.permPillStats;
            }
            if (typeof playSound === 'function') playSound('bell');
            const logMsg = `✨ <span class="text-amber-300 font-bold">[Thái Ất Tẩy Tủy]</span> Phục dụng <strong>${item.name}</strong>, gân cốt biến dị vô song, vĩnh viễn tăng <strong>+${hpGain} Khí Huyết</strong> và <strong>+${atkGain} Công Kích</strong>!`;
            if (typeof addLog === 'function') addLog(logMsg, "text-gold-300 font-bold", "sect-use-pill");
            if (typeof window.showGameToast === 'function') window.showGameToast(`✨ Tăng vĩnh viễn +${hpGain} Máu, +${atkGain} Công Kích!`, "success");
        } else {
            // Thêm vào inventory (Đan Dược / Đan Phương / Lò Đan)
            const inv = (window.GameState && Array.isArray(window.GameState.inventory)) ? window.GameState.inventory : state.inventory;
            if (Array.isArray(inv)) {
                const existing = inv.find(i => i && i.id === item.id);
                if (existing) {
                    existing.count = (existing.count || 0) + 1;
                    existing.quantity = existing.count;
                } else {
                    inv.push({
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        count: 1,
                        quantity: 1,
                        rarity: item.tier === 'thien' ? 5 : item.tier === 'dia' ? 4 : item.tier === 'huyen' ? 3 : 2,
                        desc: item.desc,
                        icon: item.icon || (item.category === 'dan_phuong' ? "fa-scroll" : "fa-box")
                    });
                }
                if (state.inventory !== inv) state.inventory = inv;
                if (window.GameState) window.GameState.inventory = inv;
            }
            if (item.category === 'dan_phuong') {
                if (!Array.isArray(state.unlockedRecipes)) state.unlockedRecipes = [];
                if (!state.unlockedRecipes.includes(item.id)) state.unlockedRecipes.push(item.id);
                if (window.GameState) {
                    if (!Array.isArray(window.GameState.unlockedRecipes)) window.GameState.unlockedRecipes = [];
                    if (!window.GameState.unlockedRecipes.includes(item.id)) window.GameState.unlockedRecipes.push(item.id);
                }
                if (typeof window.syncMaterialsFromInventory === 'function') window.syncMaterialsFromInventory();
                if (typeof window.updateAlchemyUI === 'function') window.updateAlchemyUI();
            }
            if (typeof addLog === 'function') {
                addLog(`🎁 <span class="text-emerald-400 font-bold">[Tông Môn]</span> Dùng ${item.price} Cống Hiến đổi thành công <strong>${item.name}</strong> (${item.type}) cất vào Túi Trữ Vật!`, "text-emerald-300 font-bold", "sect-buy-item");
            }
            if (typeof window.showGameToast === 'function') window.showGameToast(`🎁 Đã đổi thành công: ${item.name}!`, "success");
        }
    }

    if (window.GameState) {
        window.GameState.sectContribution = state.sectContribution;
        if (state.inventory) window.GameState.inventory = state.inventory;
    }
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    if (document.getElementById('page-sect-shop')?.classList.contains('active')) {
        renderSectPage('shop', document.getElementById('sect-shop-page-content'));
    } else {
        renderSectModal();
    }
}

// 9. TAB 3: CHẤP SỰ ĐIỆN (THĂNG CẤP THÂN PHẬN)
function renderSectRankTabHtml() {
    const currentRankIdx = Math.min(SECT_RANKS.length - 1, state.sectRank || 0);
    const currentRankCfg = SECT_RANKS[currentRankIdx];
    const isMaxRank = currentRankIdx >= SECT_RANKS.length - 1;
    const nextRankCfg = isMaxRank ? null : SECT_RANKS[currentRankIdx + 1];
    const contribution = state.sectContribution || 0;
    const playerRealmIdx = state.realmIndex || 0;

    let canAdvance = false;
    let realmOk = false;
    let contribOk = false;

    if (nextRankCfg) {
        realmOk = playerRealmIdx >= nextRankCfg.minRealmIndex;
        contribOk = contribution >= nextRankCfg.minContributionReq;
        canAdvance = realmOk && contribOk;
    }

    return `
        <div class="space-y-4">
            <!-- THÂN PHẬN HIỆN TẠI & BỔNG LỘC HÀNG NGÀY -->
            <div class="p-4 rounded-xl bg-slate-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                    <span class="text-[10px] text-stone-400 uppercase tracking-wider block">Thân Phận Hiện Tại</span>
                    <h4 class="text-sm font-bold text-amber-300 flex items-center gap-2 mt-0.5">
                        <span>${currentRankCfg.name}</span>
                        <span class="text-[10px] font-normal px-2 py-0.5 rounded-full border ${currentRankCfg.badgeClass}">Cấp ${currentRankCfg.rank + 1}</span>
                    </h4>
                    <p class="text-[11px] text-stone-400 mt-1">Đặc quyền: ${currentRankCfg.privilege}</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <span class="text-[10px] text-stone-400 block">Bổng lộc ngày</span>
                        <span class="text-xs font-mono font-bold text-emerald-400">+${currentRankCfg.dailyStones} Đá / +${currentRankCfg.dailyContribution} Điểm</span>
                    </div>
                    <button type="button" onclick="claimSectHomage()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0">
                        <i class="fa-solid fa-gift"></i> Nhận Bổng Lộc Ngày
                    </button>
                </div>
            </div>

            <!-- TIẾN TRÌNH THĂNG TIẾN (LADDER) -->
            <div class="space-y-2">
                <span class="text-[11px] font-bold text-stone-300 block">Hệ Thống Phẩm Trật Môn Phái:</span>
                <div class="space-y-2">
                    ${SECT_RANKS.map(r => {
                        const isCurrent = r.rank === currentRankIdx;
                        const isPassed = r.rank < currentRankIdx;

                        return `
                            <div class="p-2.5 rounded-xl border flex items-center justify-between text-xs ${isCurrent ? 'bg-amber-950/40 border-amber-500/50 font-bold' : (isPassed ? 'bg-slate-950/40 border-stone-800 text-stone-400' : 'bg-slate-950 border-stone-900 text-stone-500')}">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-5 h-5 rounded-full ${isPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : (isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-stone-900 text-stone-600')} flex items-center justify-center text-[10px] font-bold">
                                        ${isPassed ? '✓' : r.rank + 1}
                                    </span>
                                    <span>${r.name}</span>
                                </div>
                                <span class="text-[11px] font-serif italic">${r.reqDesc}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- KHẢO HẠCH THĂNG CẤP TIẾP THEO -->
            ${!isMaxRank && nextRankCfg ? `
                <div class="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-md">
                    <div class="flex justify-between items-center">
                        <h4 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <i class="fa-solid fa-graduation-cap text-amber-400"></i>
                            <span>Khảo Hạch Thăng Cấp: <strong class="text-amber-300">${nextRankCfg.name}</strong></span>
                        </h4>
                        <span class="text-[10px] text-stone-400">Quyền lợi: ${nextRankCfg.privilege}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-2.5 rounded-lg bg-slate-950 border ${realmOk ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-900/50 text-rose-300'}">
                            <span class="block text-[10px] text-stone-400">Yêu cầu Cảnh giới:</span>
                            <span class="font-bold">${realmOk ? '✓ Đạt' : '✗ Chưa đạt'} (${REALMS[nextRankCfg.minRealmIndex]?.name || 'Trúc Cơ'})</span>
                        </div>
                        <div class="p-2.5 rounded-lg bg-slate-950 border ${contribOk ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-900/50 text-rose-300'}">
                            <span class="block text-[10px] text-stone-400">Yêu cầu Cống hiến:</span>
                            <span class="font-bold">${contribOk ? '✓ Đạt' : '✗ Chưa đủ'} (${contribution}/${nextRankCfg.minContributionReq})</span>
                        </div>
                    </div>

                    <button onclick="advanceSectRank()" ${canAdvance ? '' : 'disabled'} class="w-full py-2.5 rounded-xl border font-bold text-xs tracking-wider transition shadow-lg ${canAdvance ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border-amber-300 animate-pulse' : 'bg-slate-900 text-stone-500 border-stone-800 cursor-not-allowed'}">
                        ${canAdvance ? 'Tiến Hành Khảo Hạch / Thăng Cấp' : 'Chưa Đạt Đủ Điều Kiện Khảo Hạch'}
                    </button>
                </div>
            ` : `
                <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center text-xs text-amber-300 font-bold">
                    👑 Đạo hữu đã đạt đến phẩm trật tối cao trong môn phái (${currentRankCfg.name})!
                </div>
            `}
        </div>
    `;
}

function advanceSectRank() {
    const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : {});
    const currentRankIdx = Number(s.sectRank ?? (typeof state !== 'undefined' ? state.sectRank : 0)) || 0;
    if (currentRankIdx >= SECT_RANKS.length - 1) return;

    const nextRankCfg = SECT_RANKS[currentRankIdx + 1];
    const playerRealmIdx = Number(s.realmIndex ?? (typeof state !== 'undefined' ? state.realmIndex : 0)) || 0;
    const contribution = Number(s.sectPoints ?? s.sectContribution ?? (typeof state !== 'undefined' ? state.sectContribution : 0)) || 0;

    if (playerRealmIdx < nextRankCfg.minRealmIndex || contribution < nextRankCfg.minContributionReq) {
        const msg = "Đạo hữu chưa thỏa mãn đủ điều kiện khảo hạch thăng cấp!";
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, "warning");
        else if (typeof addLog === 'function') addLog(msg, "text-rose-400");
        return;
    }

    // Trừ cống hiến an toàn
    const newContrib = Math.max(0, contribution - nextRankCfg.minContributionReq);
    const newRank = currentRankIdx + 1;
    if (typeof state !== 'undefined') {
        state.sectContribution = newContrib;
        state.sectRank = newRank;
    }

    if (window.GameState) {
        window.GameState.sectRank = newRank;
        window.GameState.sectPoints = newContrib;
        window.GameState.sectContribution = newContrib;
    }
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Thăng Cấp Thân Phận!", "text-amber-300 font-bold text-lg");
    }

    const toastMsg = `🎉 Tấn thăng chức vị [${nextRankCfg.name}] môn phái!`;
    if (typeof window.showGameToast === 'function') window.showGameToast(toastMsg, "breakthrough");
    if (typeof addLog === 'function') {
        addLog(`🎉 <span class="text-amber-300 font-bold">[Chấp Sự Điện]</span> Chúc mừng đạo hữu thông qua khảo hạch, chính thức tấn thăng thành: <strong class="text-amber-300">${nextRankCfg.name}</strong>!`, "text-amber-300 font-bold", "advance-sect-rank");
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    if (document.getElementById('page-sect-rank')?.classList.contains('active')) {
        renderSectPage('rank', document.getElementById('sect-rank-page-content'));
    } else {
        renderSectModal();
    }
}

// 10. TICK SYSTEM ĐƯỢC GỌI MỖI GIÂY TRONG GAMELOOP
function tickSectSystem() {
    if (!state) return;

    // Tự động làm mới bảng vàng nhiệm vụ mỗi 3 phút (180s)
    const now = Date.now();
    if (!state.lastSectQuestRefreshTime) state.lastSectQuestRefreshTime = now;
    if (now - state.lastSectQuestRefreshTime >= 180000) {
        state.lastSectQuestRefreshTime = now;
        if (typeof addLog === 'function') {
            addLog(`📜 <span class="text-amber-300 font-bold">[Chấp Sự Điện]</span> Đến kỳ hạn 3 phút, Bảng Vàng Nhiệm Vụ môn phái đã tự động làm mới!`, "text-amber-300");
        }
        const modal = document.getElementById('sect-modal');
        if (modal && !modal.classList.contains('hidden') && activeSectTab === 'quests') {
            renderSectModal();
        }
    }

    if (!state.sectQuest) return;

    const q = state.sectQuest;
    if (q.inProgress && !q.completed) {
        const timeScale = state.timeScale || 1;
        q.elapsedSeconds = (q.elapsedSeconds || 0) + (1 * timeScale);

        if (q.elapsedSeconds >= q.durationSeconds) {
            q.elapsedSeconds = q.durationSeconds;
            q.completed = true;
            q.inProgress = false;

            if (typeof addLog === 'function') {
                addLog(`⚡ <span class="text-emerald-400 font-bold">[Nhiệm Vụ Tông Môn]</span> "${q.name}" đã hoàn thành! Hãy mở Tông Môn để lĩnh thưởng.`, "text-emerald-300 font-bold", "sect-quest-ready");
            }

            // Nếu modal đang mở, cập nhật UI
            const modal = document.getElementById('sect-modal');
            if (modal && !modal.classList.contains('hidden') && activeSectTab === 'quests') {
                renderSectModal();
            }
        } else {
            // Live DOM update nếu modal đang mở
            updateSectLiveUI();
        }
    }
}

function updateSectLiveUI() {
    const q = state.sectQuest;
    if (!q) return;

    const countdownEl = document.getElementById('sect-active-countdown');
    const progressEl = document.getElementById('sect-active-progress');

    if (countdownEl && q.inProgress) {
        const rem = Math.max(0, q.durationSeconds - (q.elapsedSeconds || 0));
        countdownEl.textContent = formatDuration(rem);
    }

    if (progressEl && q.durationSeconds > 0) {
        const pct = Math.min(100, Math.round(((q.elapsedSeconds || 0) / q.durationSeconds) * 100));
        progressEl.style.width = `${pct}%`;
    }
}

// Tiện ích format thời gian
function formatDuration(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const remM = m % 60;
        return `${h}h ${remM < 10 ? '0' : ''}${remM}m`;
    }
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ==========================================
// 11. HỆ THỐNG HỘ SƠN ĐẠI TRẬN & THÍ LUYỆN TRƯỞNG LÃO
// ==========================================
let sectCombatTimer = null;

function renderSectArrayTabHtml() {
    const arrayLvl = Number(state.sectArrayLevel) || 1;
    const arrayTiers = typeof SECT_ARRAY_TIERS !== 'undefined' ? SECT_ARRAY_TIERS : [];
    const currentArray = arrayTiers[arrayLvl - 1] || arrayTiers[0] || { level: 1, name: 'Sơ Khai Hộ Tông Trận', buffDesc: '+5% Tu Vi' };
    const nextArray = (arrayLvl < arrayTiers.length) ? arrayTiers[arrayLvl] : null;

    const playerRank = Number(state.sectRank) || 0;
    const playerContribution = Number(state.sectContribution) || 0;
    const playerStones = Number(state.stones) || 0;

    const trials = typeof SECT_ELDER_TRIALS !== 'undefined' ? SECT_ELDER_TRIALS : [];
    const beatenTrials = Array.isArray(state.sectTrialsBeaten) ? state.sectTrialsBeaten : [];

    return `
        <div class="space-y-4">
            <!-- 1. HỘ SƠN ĐẠI TRẬN -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-stone-950 to-slate-950 border border-amber-500/30 shadow-xl space-y-3.5 relative overflow-hidden">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                    <div class="flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-sm shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            <i class="fa-solid fa-shield-halved"></i>
                        </span>
                        <div>
                            <h3 class="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
                                Hộ Sơn Đại Trận Tông Môn
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${currentArray.badgeClass || 'text-amber-300 bg-amber-950/80'}">
                                    CẤP ${arrayLvl} • ${currentArray.name}
                                </span>
                            </h3>
                            <span class="text-[10px] text-stone-400">Trấn sơn chi bảo, tụ tập linh mạch cửu châu gia trì tu vi toàn môn</span>
                        </div>
                    </div>
                    <span class="text-xs font-mono text-emerald-400 font-bold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        Hiệu Quả: ${currentArray.buffDesc}
                    </span>
                </div>

                <!-- 5 Cấp Đại Trận -->
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    ${arrayTiers.map((tier) => {
                        const isUnlocked = arrayLvl >= tier.level;
                        const isCurrent = arrayLvl === tier.level;
                        return `
                            <div class="p-2 rounded-xl border ${isCurrent ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40' : (isUnlocked ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-slate-950/60 border-stone-800 opacity-60')} flex flex-col justify-between space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono font-bold ${isUnlocked ? 'text-amber-400' : 'text-stone-500'}">Cấp ${tier.level}</span>
                                    <span class="text-[9px] px-1 py-0.2 rounded font-bold ${isCurrent ? 'bg-amber-500 text-black' : (isUnlocked ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-stone-500')}">
                                        ${isCurrent ? 'HIỆN TẠI' : (isUnlocked ? 'ĐÃ MỞ' : 'CHƯA MỞ')}
                                    </span>
                                </div>
                                <h5 class="text-[11px] font-bold ${isUnlocked ? 'text-slate-100' : 'text-stone-400'} truncate">${tier.name}</h5>
                                <p class="text-[9px] text-stone-400 line-clamp-2">${tier.buffDesc}</p>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- THANH TIẾN ĐỘ CỐNG HIẾN TOÀN PHÁI (ALL-SECT CONTRIBUTION PROGRESS) -->
                ${(() => {
                    const reqContrib = nextArray ? nextArray.reqContribution : 10000;
                    const sectTotalContrib = nextArray ? Math.min(reqContrib, Math.floor(playerContribution + (arrayLvl * (reqContrib / 5)))) : reqContrib;
                    const contribPct = Math.min(100, Math.round((sectTotalContrib / reqContrib) * 100));
                    return `
                        <div class="p-3 bg-slate-950/80 rounded-xl border border-stone-800 space-y-1.5">
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-stone-300 font-bold flex items-center gap-1.5">
                                    <i class="fa-solid fa-users text-amber-400"></i> Tiến Độ Cống Hiến Toàn Phái:
                                </span>
                                <span class="font-mono font-bold text-amber-300">${sectTotalContrib.toLocaleString('vi-VN')} / ${reqContrib.toLocaleString('vi-VN')} (${contribPct}%)</span>
                            </div>
                            <div class="w-full h-2 rounded-full bg-slate-900 border border-stone-800 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 transition-all duration-500" style="width: ${contribPct}%"></div>
                            </div>
                        </div>

                        <!-- DANH SÁCH GIA TRÌ TRẬN PHÁP ĐANG KÍCH HOẠT -->
                        <div class="p-3 bg-slate-950/80 rounded-xl border border-stone-800 space-y-2">
                            <div class="flex items-center justify-between text-xs border-b border-stone-800/80 pb-1">
                                <span class="font-bold text-slate-200 flex items-center gap-1.5">
                                    <i class="fa-solid fa-sparkles text-emerald-400"></i> Gia Trì Trận Pháp Đang Kích Hoạt (Toàn Môn Đệ Tử)
                                </span>
                                <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Cấp ${arrayLvl} / 5</span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                                <div class="flex items-center gap-2 p-1.5 rounded ${arrayLvl >= 1 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30' : 'text-stone-500 bg-slate-900/40'}">
                                    <i class="fa-solid ${arrayLvl >= 1 ? 'fa-check text-emerald-400' : 'fa-lock'}"></i>
                                    <span>[Cấp 1] +5% Tốc độ Tu Vi (Tụ Linh Toàn Môn)</span>
                                </div>
                                <div class="flex items-center gap-2 p-1.5 rounded ${arrayLvl >= 2 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30' : 'text-stone-500 bg-slate-900/40'}">
                                    <i class="fa-solid ${arrayLvl >= 2 ? 'fa-check text-emerald-400' : 'fa-lock'}"></i>
                                    <span>[Cấp 2] +5% Khí Huyết Tối Đa (Bảo Hộ Sơn Môn)</span>
                                </div>
                                <div class="flex items-center gap-2 p-1.5 rounded ${arrayLvl >= 3 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30' : 'text-stone-500 bg-slate-900/40'}">
                                    <i class="fa-solid ${arrayLvl >= 3 ? 'fa-check text-emerald-400' : 'fa-lock'}"></i>
                                    <span>[Cấp 3] +8% Sát Thương Công Kích (Chiến Ý Quy Tông)</span>
                                </div>
                                <div class="flex items-center gap-2 p-1.5 rounded ${arrayLvl >= 4 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30' : 'text-stone-500 bg-slate-900/40'}">
                                    <i class="fa-solid ${arrayLvl >= 4 ? 'fa-check text-emerald-400' : 'fa-lock'}"></i>
                                    <span>[Cấp 4] +10% Phòng Ngự & +4% Công Kích (Kim Cương Huyền Giáp)</span>
                                </div>
                                <div class="flex items-center gap-2 p-1.5 rounded ${arrayLvl >= 5 ? 'text-amber-300 bg-amber-950/50 border border-amber-500/40' : 'text-stone-500 bg-slate-900/40'} col-span-1 sm:col-span-2">
                                    <i class="fa-solid ${arrayLvl >= 5 ? 'fa-crown text-amber-400' : 'fa-lock'}"></i>
                                    <span>[Cấp 5] +8% Toàn Chỉ Số & Tứ Tượng Đại Trận Hộ Sơn (+20% Tu Vi Toàn Phần)</span>
                                </div>
                            </div>
                        </div>
                    `;
                })()}

                <!-- Thao Tác Nâng Cấp Đại Trận -->
                <div class="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/80">
                    <div class="text-xs text-stone-300 space-y-0.5 text-center sm:text-left">
                        ${nextArray ? `
                            <div class="font-bold text-amber-300">Cấp Kế Tiếp: [${nextArray.name}] — ${nextArray.buffDesc}</div>
                            <div class="text-[11px] text-stone-400 flex flex-wrap gap-2.5 items-center justify-center sm:justify-start">
                                <span>Chức Vị: <b class="${playerRank >= nextArray.minRank ? 'text-emerald-400' : 'text-rose-400'}">${(SECT_RANKS[nextArray.minRank]?.name || 'N/A')}</b></span>
                                <span>Cống Hiến: <b class="${playerContribution >= nextArray.reqContribution ? 'text-emerald-400' : 'text-rose-400'}">${playerContribution.toLocaleString('vi-VN')} / ${nextArray.reqContribution.toLocaleString('vi-VN')}</b></span>
                                <span>Linh Thạch: <b class="${playerStones >= nextArray.reqStones ? 'text-emerald-400' : 'text-rose-400'}">${playerStones.toLocaleString('vi-VN')} / ${nextArray.reqStones.toLocaleString('vi-VN')} LT</b></span>
                            </div>
                        ` : `
                            <div class="font-bold text-amber-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-crown text-amber-400"></i> Hộ Sơn Đại Trận Đã Đạt Cực Cảnh Cấp 5 (Vạn Tiên Tru Ma)!
                            </div>
                            <div class="text-[11px] text-stone-400">Trận pháp tối cường đã bao phủ toàn cõi sơn môn, không thể thăng cấp thêm.</div>
                        `}
                    </div>

                    ${nextArray ? `
                        <button type="button" onclick="upgradeSectArray()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Nâng Cấp Đại Trận
                        </button>
                    ` : `
                        <span class="px-3.5 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                            👑 ĐẠI TRẬN CỰC CẢNH
                        </span>
                    `}
                </div>
            </div>

            <!-- 2. THÍ LUYỆN TRƯỞNG LÃO TÔNG MÔN -->
            <div>
                <div class="flex items-center justify-between mb-2.5">
                    <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <i class="fa-solid fa-khanda text-amber-400"></i> Thí Luyện Trưởng Lão Tông Môn (Tam Đại Khảo Hạch)
                    </h4>
                    <span class="text-[11px] font-mono text-stone-400">Đã vượt qua: <b class="text-amber-400">${beatenTrials.length}/3</b></span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${trials.map(trial => {
                        const isBeaten = beatenTrials.includes(trial.id);
                        const canRank = playerRank >= trial.sectRealmReq;
                        const canRealm = (state.realmIndex || 0) >= trial.minRealmIdx;
                        const canFight = canRank && canRealm;
                        const reqRankName = SECT_RANKS[trial.sectRealmReq]?.name || 'N/A';

                        return `
                            <div class="p-3.5 rounded-2xl bg-slate-950/90 border ${isBeaten ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : trial.colorTheme} shadow-lg flex flex-col justify-between space-y-3">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-base ${trial.textColor}">
                                            <i class="fa-solid ${trial.avatarIcon}"></i>
                                        </div>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isBeaten ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-slate-900 text-stone-400 border border-stone-800'}">
                                            ${isBeaten ? '✓ ĐÃ VƯỢT QUA' : 'CHƯA VƯỢT'}
                                        </span>
                                    </div>

                                    <h5 class="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                        ${trial.name}
                                        <span class="text-[10px] ${trial.textColor} font-mono font-normal">(${trial.title})</span>
                                    </h5>
                                    <p class="text-[11px] text-stone-400 line-clamp-2 mt-1 mb-2">${trial.desc}</p>

                                    <!-- Stats -->
                                    <div class="text-[10px] grid grid-cols-3 gap-1 bg-stone-900/60 p-2 rounded-lg border border-stone-800 font-mono text-stone-300 mb-2">
                                        <div>HP: <b class="text-rose-400">${(trial.hp / 1000).toFixed(0)}k</b></div>
                                        <div>ATK: <b class="text-amber-400">${trial.atk.toLocaleString('vi-VN')}</b></div>
                                        <div>DEF: <b class="text-sky-400">${trial.def.toLocaleString('vi-VN')}</b></div>
                                    </div>

                                    <!-- Rewards -->
                                    <div class="text-[11px] bg-slate-900/40 p-2 rounded-lg border border-stone-800/80 space-y-0.5 font-mono">
                                        <div class="text-stone-400 text-[10px] font-sans font-bold">Thưởng Thủ Sát:</div>
                                        <div class="text-amber-300">+${trial.rewardContribution} Cống Hiến • +${(trial.rewardStones / 1000).toFixed(0)}k LT</div>
                                        <div class="text-cyan-300">+${trial.rewardJade} Tiên Ngọc • [${trial.rewardTitle}]</div>
                                    </div>
                                </div>

                                <div>
                                    ${isBeaten ? `
                                        <button type="button" onclick="startSectTrialCombat('${trial.id}')" class="w-full py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer">
                                            <i class="fa-solid fa-repeat mr-1"></i> Tái Đấu Thử Thách
                                        </button>
                                    ` : (canFight ? `
                                        <button type="button" onclick="startSectTrialCombat('${trial.id}')" class="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer">
                                            <i class="fa-solid fa-khanda mr-1"></i> Khiêu Chiến Khảo Hạch
                                        </button>
                                    ` : `
                                        <div class="text-[10px] text-center text-rose-400/90 bg-rose-950/30 p-1.5 rounded-lg border border-rose-900/40 font-mono">
                                            Yêu cầu: ${reqRankName} & ${trial.realmName}
                                        </div>
                                    `)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 3. THÍ LUYỆN HỘ SƠN THÚ -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 border border-amber-500/40 shadow-xl space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                    <div class="flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-sm shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            <i class="fa-solid fa-dragon"></i>
                        </span>
                        <div>
                            <h4 class="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
                                Thí Luyện Hộ Sơn Thú
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                                    Thử Thách Chiến Lực
                                </span>
                            </h4>
                            <span class="text-[10px] text-stone-400">Nghênh chiến Thần Thú trấn giữ sơn môn, chứng minh đạo hạnh đoạt kỳ trân dị bảo</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] text-stone-400 block">Thần Thú: <strong class="text-amber-300">Cửu Tiêu Linh Bằng</strong></span>
                        <span class="text-xs font-mono font-bold text-rose-400">Chiến Lực: 12,000 CP</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                    <div class="text-xs text-stone-300 space-y-1">
                        <div>Thù lao trảm thú: <b class="text-amber-300">+1,000 Linh Thạch</b>, <b class="text-purple-300">+20 Tiên Ngọc</b>, <b class="text-emerald-400">+300 Cống Hiến</b>, <b class="text-rose-400">+1 Yêu Đan Cực Phẩm</b>.</div>
                        <div class="text-[11px] text-stone-400">Chiến lực hiện tại của Bản Tôn: <strong class="text-emerald-400 font-mono">${((window.GameState && window.GameState.cp) ? window.GameState.cp : 15000).toLocaleString('vi-VN')} CP</strong></div>
                    </div>
                    <button type="button" onclick="challengeSectGuardianBeast()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs tracking-wider shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer shrink-0">
                        <i class="fa-solid fa-khanda"></i> Khiêu Chiến Hộ Sơn Thú
                    </button>
                </div>
            </div>
        </div>
    `;
}

function challengeSectGuardianBeast() {
    const playerCP = (typeof window.getCombatPower === 'function') 
        ? window.getCombatPower() 
        : ((window.GameState && Number(window.GameState.cp)) || 15000);
    const beastCP = 12000;
    const beastName = "Hộ Sơn Thần Thú - Cửu Tiêu Linh Bằng";

    if (typeof window.startUniversalBattle === 'function') {
        const ok = window.startUniversalBattle({
            mode: 'sect_trial',
            enemyId: 'sect_guardian_beast',
            name: beastName,
            titleBadge: '⛩️ HỘ SƠN THẦN THÚ • THÍ LUYỆN',
            realm: 'Nguyên Anh Sơ Kỳ',
            element: 'Lôi',
            hp: Math.round(beastCP * 12),
            maxHp: Math.round(beastCP * 12),
            atk: Math.round(beastCP * 1.6),
            def: Math.round(beastCP * 0.45),
            crit: 20,
            eva: 15,
            cp: beastCP,
            icon: '🦅',
            rewards: {
                title: 'Hộ Sơn Thú Thí Luyện',
                linhThach: 100000,
                contribution: 300,
                badge: 'Thần Thú Hộ Tông'
            }
        });
        if (ok) return;
    }

    if (playerCP >= beastCP) {
        const stonesWon = 100000;
        const contribWon = 300;
        const jadeWon = 30;

        const newStones = (Number(window.GameState?.stones ?? state.stones) || 0) + stonesWon;
        const newContrib = (Number(window.GameState?.sectPoints ?? state.sectContribution) || 0) + contribWon;
        const newJade = (Number(window.GameState?.jade ?? state.immortalJade) || 0) + jadeWon;

        state.stones = newStones;
        state.sectContribution = newContrib;
        state.immortalJade = newJade;

        if (!state.materials) state.materials = {};
        state.materials.yeuDan = (state.materials.yeuDan || 0) + 1;

        // Đẩy vào inventory
        const inv = (window.GameState && Array.isArray(window.GameState.inventory)) ? window.GameState.inventory : (Array.isArray(state.inventory) ? state.inventory : []);
        const existingYD = inv.find(i => i && (i.id === 'yeu_dan' || i.name === 'Yêu Đan'));
        if (existingYD) {
            existingYD.count = (Number(existingYD.count ?? existingYD.quantity) || 0) + 1;
            existingYD.quantity = existingYD.count;
        } else {
            inv.push({ id: 'yeu_dan', name: 'Yêu Đan Cực Phẩm', type: 'Nguyên Liệu', category: 'materials', count: 1, quantity: 1, rarity: 4, icon: 'fa-certificate', desc: 'Nội đan ngàn năm của Hộ Sơn Thần Thú.' });
        }
        state.inventory = inv;

        if (window.GameState) {
            window.GameState.stones = newStones;
            window.GameState.spiritStones = newStones;
            window.GameState.sectPoints = newContrib;
            window.GameState.sectContribution = newContrib;
            window.GameState.jade = newJade;
            window.GameState.immortalJade = newJade;
            window.GameState.inventory = inv;
            if (window.GameState.materials) {
                window.GameState.materials.yeuDan = state.materials.yeuDan;
            }
        }
        if (typeof playSound === 'function') playSound('breakthrough');
        if (typeof addLog === 'function') {
            addLog(`🐉 <span class="text-amber-300 font-bold">[Thí Luyện Hộ Sơn Thú]</span> Bản Tôn xuất thủ dũng mãnh, Chiến Lực (${playerCP.toLocaleString('vi-VN')} CP) áp chế <strong>${beastName}</strong>! Nhận: <strong>+${stonesWon.toLocaleString('vi-VN')} Linh Thạch</strong>, <strong>+${jadeWon} Tiên Ngọc</strong>, <strong>+${contribWon} Cống Hiến</strong>, <strong>+1 Yêu Đan Cực Phẩm</strong>!`, "text-amber-300 font-bold");
        }
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`🐉 Trấn áp Hộ Sơn Thú thành công (+${jadeWon} Ngọc, +${contribWon} Cống Hiến, +1 Yêu Đan)!`, "success");
        }
    } else {
        if (typeof playSound === 'function') playSound('defeat');
        if (typeof addLog === 'function') {
            addLog(`⚠️ <span class="text-rose-400 font-bold">[Thí Luyện Thất Bại]</span> Chiến Lực (${playerCP.toLocaleString('vi-VN')} CP) chưa đủ trấn áp <strong>${beastName}</strong> (CP ${beastCP.toLocaleString('vi-VN')}). Hãy nâng cấp căn cơ trước khi tái chiến!`, "text-rose-400");
        }
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(`⚠️ Chiến lực chưa đủ trấn áp ${beastName}!`, "warning");
        }
    }

    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    if (document.getElementById('page-sect-array')?.classList.contains('active')) {
        renderSectPage('array', document.getElementById('sect-array-page-content'));
    } else {
        renderSectModal();
    }
}
window.challengeSectGuardianBeast = challengeSectGuardianBeast;

function upgradeSectArray() {
    const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : {});
    const playerSect = s.playerSect || (typeof state !== 'undefined' ? state.playerSect : null) || 'thanh_van';
    s.playerSect = playerSect;
    if (typeof state !== 'undefined') state.playerSect = playerSect;

    const arrayLvl = Number(s.sectArrayLevel ?? (typeof state !== 'undefined' ? state.sectArrayLevel : 1)) || 1;
    const arrayTiers = typeof SECT_ARRAY_TIERS !== 'undefined' ? SECT_ARRAY_TIERS : [];
    if (arrayLvl >= arrayTiers.length) {
        const msg = "🛡️ Hộ Sơn Đại Trận của tông môn đã đạt Cực Cảnh Cấp 5!";
        if (typeof window.showGameToast === 'function') window.showGameToast(msg, 'info');
        else if (typeof addLog === 'function') addLog(msg, 'text-amber-300');
        return;
    }
    const nextCfg = arrayTiers[arrayLvl];
    const playerRank = Number(s.sectRank ?? (typeof state !== 'undefined' ? state.sectRank : 0)) || 0;
    if (playerRank < nextCfg.minRank) {
        const reqRankName = SECT_RANKS[nextCfg.minRank]?.name || 'Cao hơn';
        const msg = `Cần chức vị [${reqRankName}] trở lên để chủ trì đại trận!`;
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, 'warning');
        else if (typeof addLog === 'function') addLog(`⚠️ ${msg}`, 'text-rose-400');
        return;
    }
    const curContrib = Number(s.sectPoints ?? s.sectContribution ?? (typeof state !== 'undefined' ? state.sectContribution : 0)) || 0;
    if (curContrib < nextCfg.reqContribution) {
        const msg = `Điểm Cống Hiến không đủ (Cần ${nextCfg.reqContribution} điểm).`;
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, 'warning');
        else if (typeof addLog === 'function') addLog(`⚠️ ${msg}`, 'text-rose-400');
        return;
    }
    const curStones = Number(s.stones ?? s.spiritStones ?? (typeof state !== 'undefined' ? state.stones : 0)) || 0;
    if (curStones < nextCfg.reqStones) {
        const msg = `Linh Thạch không đủ để kích hoạt linh trận (Cần ${nextCfg.reqStones.toLocaleString('vi-VN')} LT).`;
        if (typeof window.showGameToast === 'function') window.showGameToast(`⚠️ ${msg}`, 'warning');
        else if (typeof addLog === 'function') addLog(`⚠️ ${msg}`, 'text-rose-400');
        return;
    }

    const newContrib = Math.max(0, curContrib - nextCfg.reqContribution);
    const newStones = Math.max(0, curStones - nextCfg.reqStones);
    const newArrayLevel = arrayLvl + 1;

    if (typeof state !== 'undefined') {
        state.sectContribution = newContrib;
        state.stones = newStones;
        state.sectArrayLevel = newArrayLevel;
    }

    if (window.GameState) {
        window.GameState.stones = newStones;
        window.GameState.spiritStones = newStones;
        window.GameState.sectPoints = newContrib;
        window.GameState.sectContribution = newContrib;
        window.GameState.sectArrayLevel = newArrayLevel;
    }
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.saveGame === 'function') window.saveGame();

    if (typeof playSound === 'function') playSound('bell');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Hộ Sơn Đại Trận Cấp ${newArrayLevel}!`, 'text-amber-300');
    }
    const toastMsg = `🛡️ Hộ Sơn Đại Trận đột phá lên [${nextCfg.name}] (Cấp ${newArrayLevel})!`;
    if (typeof window.showGameToast === 'function') window.showGameToast(toastMsg, 'success');
    if (typeof addLog === 'function') {
        addLog(`🛡️ Tụ linh tế trận thành công! Hộ Sơn Đại Trận đột phá lên [${nextCfg.name}]! Tăng vọt tốc độ tu vi và uy lực môn nhân!`, 'text-amber-300 font-bold');
    }
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    if (document.getElementById('page-sect-array')?.classList.contains('active')) {
        renderSectPage('array', document.getElementById('sect-array-page-content'));
    } else {
        renderSectModal();
    }
}

function startSectTrialCombat(trialId) {
    if (sectCombatTimer) return;
    const trials = typeof SECT_ELDER_TRIALS !== 'undefined' ? SECT_ELDER_TRIALS : [];
    const trial = trials.find(t => t.id === trialId);
    if (!trial) return;

    const playerRank = Number(state.sectRank) || 0;
    if (playerRank < trial.sectRealmReq) {
        const reqRank = SECT_RANKS[trial.sectRealmReq]?.name || 'Cao hơn';
        if (typeof addLog === 'function') addLog(`⚠️ Cần đạt chức vị tông môn [${reqRank}] để khiêu chiến Trưởng Lão!`, 'text-rose-400');
        return;
    }
    if ((state.realmIndex || 0) < trial.minRealmIdx) {
        if (typeof addLog === 'function') addLog(`⚠️ Cảnh giới chưa đủ để tiếp chiêu Trưởng Lão (Cần ${trial.realmName}).`, 'text-rose-400');
        return;
    }

    if (typeof window.startUniversalBattle === 'function') {
        const ok = window.startUniversalBattle({
            mode: 'sect_trial',
            enemyId: trial.id,
            name: `${trial.title} ${trial.name}`,
            titleBadge: `⛩️ THÍ LUYỆN TRƯỞNG LÃO • ${trial.title.toUpperCase()}`,
            realm: trial.realmName || 'Kim Đan Hậu Kỳ',
            element: 'Kim',
            hp: trial.hp || 35000,
            maxHp: trial.hp || 35000,
            atk: trial.atk || 4500,
            def: trial.def || 1800,
            crit: 20,
            eva: 12,
            cp: Math.round((trial.atk || 4500) * 3 + (trial.hp || 35000) * 0.1),
            icon: '🧙‍♂️',
            rewards: {
                title: trial.name,
                linhThach: (trial.rewardStones || 50000),
                contribution: (trial.rewardContrib || 200),
                badge: `Bại Tướng ${trial.name}`
            }
        });
        if (ok) return;
    }

    const container = document.getElementById('sect-subtab-container');
    if (!container) return;

    let elderHp = trial.hp;
    const effectiveStats = (typeof getEffectiveStats === 'function') ? getEffectiveStats() : { atk: 100, def: 50, maxHp: 1000 };
    let playerHp = state.hp || effectiveStats.maxHp;
    let turn = 0;

    container.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-950 border border-amber-500/50 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-stone-800 pb-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 text-lg">
                        <i class="fa-solid ${trial.avatarIcon}"></i>
                    </span>
                    <div>
                        <h4 class="font-serif font-bold text-base text-slate-100 flex items-center gap-2">
                            ${trial.name}
                            <span class="text-xs px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-300 font-mono">${trial.title}</span>
                        </h4>
                        <span class="text-xs text-stone-400">${trial.desc}</span>
                    </div>
                </div>
                <button type="button" onclick="cancelSectTrialCombat()" class="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs border border-stone-700 cursor-pointer">
                    Thối Lui
                </button>
            </div>

            <!-- BARS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <!-- Elder HP -->
                <div class="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div class="flex justify-between text-rose-300">
                        <span>${trial.title} ${trial.name}</span>
                        <span id="trial-elder-hp-text">${elderHp.toLocaleString('vi-VN')} / ${trial.hp.toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-stone-800">
                        <div id="trial-elder-hp-bar" class="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-200" style="width: 100%;"></div>
                    </div>
                </div>

                <!-- Player HP -->
                <div class="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div class="flex justify-between text-emerald-300">
                        <span>${state.player?.name || 'Bản Tôn'}</span>
                        <span id="trial-player-hp-text">${playerHp.toLocaleString('vi-VN')} / ${effectiveStats.maxHp.toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-stone-800">
                        <div id="trial-player-hp-bar" class="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-200" style="width: 100%;"></div>
                    </div>
                </div>
            </div>

            <!-- COMBAT LOGS BOX -->
            <div id="sect-trial-combat-logs" class="h-44 overflow-y-auto p-3 rounded-xl bg-black/60 border border-stone-800 font-mono text-[11px] space-y-1 text-slate-300">
                <div class="text-amber-300 italic">⚔️ Bắt đầu cuộc tỷ thí khảo hạch trước mặt chúng đệ tử tông môn!</div>
            </div>

            <div id="sect-trial-action-container" class="flex justify-center pt-1">
                <span class="text-xs text-amber-400 animate-pulse font-mono flex items-center gap-2">
                    <i class="fa-solid fa-spinner fa-spin"></i> Hai bên đang thi triển tuyệt kỹ tranh đấu...
                </span>
            </div>
        </div>
    `;

    const logsBox = document.getElementById('sect-trial-combat-logs');
    const elderBar = document.getElementById('trial-elder-hp-bar');
    const elderTxt = document.getElementById('trial-elder-hp-text');
    const playerBar = document.getElementById('trial-player-hp-bar');
    const playerTxt = document.getElementById('trial-player-hp-text');
    const actionBox = document.getElementById('sect-trial-action-container');

    if (sectCombatTimer) {
        clearInterval(sectCombatTimer);
        sectCombatTimer = null;
    }

    sectCombatTimer = setInterval(() => {
        turn++;
        if (typeof playSound === 'function') playSound('sword');

        // Player attacks Elder
        const pDmg = Math.max(10, Math.round(effectiveStats.atk * (0.85 + Math.random() * 0.3) - trial.def * 0.4));
        elderHp = Math.max(0, elderHp - pDmg);
        if (elderBar) elderBar.style.width = `${(elderHp / trial.hp) * 100}%`;
        if (elderTxt) elderTxt.textContent = `${elderHp.toLocaleString('vi-VN')} / ${trial.hp.toLocaleString('vi-VN')}`;

        if (logsBox) {
            logsBox.innerHTML += `<div>🗡️ [Hiệp ${turn}] Bạn xuất chiêu đánh trúng <span class="text-amber-300">${trial.name}</span> gây <b class="text-emerald-400">-${pDmg.toLocaleString('vi-VN')} HP</b>.</div>`;
            while (logsBox.children.length > 50 && logsBox.firstElementChild) {
                logsBox.firstElementChild.remove();
            }
            logsBox.scrollTop = logsBox.scrollHeight;
        }

        // Pet Assist
        const petInterval = (Number(state.petTier) >= 3) ? 2 : 3;
        if (turn % petInterval === 0 && elderHp > 0) {
            const petLvl = Number(state.petLevel) || 1;
            const petTier = Number(state.petTier) || 1;
            const tierDmgMult = petTier >= 4 ? 2.3 : (petTier === 3 ? 1.7 : 1.2);
            const petDmg = Math.round((petLvl * 100 + effectiveStats.atk * 0.5) * tierDmgMult);
            elderHp = Math.max(0, elderHp - petDmg);
            if (elderBar) elderBar.style.width = `${(elderHp / trial.hp) * 100}%`;
            if (elderTxt) elderTxt.textContent = `${elderHp.toLocaleString('vi-VN')} / ${trial.hp.toLocaleString('vi-VN')}`;
            if (logsBox) {
                logsBox.innerHTML += `<div>🐾 Thần Thú Hộ Tộc thần uy hiển lộ, hỗ trợ giáng <b class="text-amber-300">-${petDmg.toLocaleString('vi-VN')} HP</b>!</div>`;
                while (logsBox.children.length > 50 && logsBox.firstElementChild) {
                    logsBox.firstElementChild.remove();
                }
                logsBox.scrollTop = logsBox.scrollHeight;
            }
        }

        // Check Victory
        if (elderHp <= 0) {
            clearInterval(sectCombatTimer);
            sectCombatTimer = null;
            const rContrib = trial.rewardContribution || 200;
            const rStones = trial.rewardStones || 5000;
            const rJade = trial.rewardJade || 50;

            if (window.GameState) {
                if (!Array.isArray(window.GameState.sectTrialsBeaten)) window.GameState.sectTrialsBeaten = [];
                if (!window.GameState.sectTrialsBeaten.includes(trial.id)) {
                    window.GameState.sectTrialsBeaten.push(trial.id);
                }
                window.GameState.sectPoints = (window.GameState.sectPoints || 0) + rContrib;
                window.GameState.sectContribution = window.GameState.sectPoints;
                window.GameState.stones = (window.GameState.stones || 0) + rStones;
                window.GameState.jade = (window.GameState.jade || 0) + rJade;
                if (window.GameState.spiritStones !== undefined) window.GameState.spiritStones = window.GameState.stones;
                if (window.GameState.immortalJade !== undefined) window.GameState.immortalJade = window.GameState.jade;
            }
            if (state !== window.GameState) {
                if (!Array.isArray(state.sectTrialsBeaten)) state.sectTrialsBeaten = [];
                if (!state.sectTrialsBeaten.includes(trial.id)) {
                    state.sectTrialsBeaten.push(trial.id);
                }
                state.sectContribution = (state.sectContribution || 0) + rContrib;
                state.sectPoints = state.sectContribution;
                state.stones = (state.stones || 0) + rStones;
                state.jade = (state.jade || 0) + rJade;
            }

            if (typeof playSound === 'function') playSound('bell');
            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`🎉 Đại thắng khảo hạch ${trial.name}! +${rContrib} Cống Hiến, +${rStones.toLocaleString('vi-VN')} LT, +${rJade} Tiên Ngọc!`, 'success');
            }
            if (typeof window.recalculatePlayerStats === 'function') {
                window.recalculatePlayerStats();
            }
            if (logsBox) {
                logsBox.innerHTML += `<div class="text-emerald-400 font-bold pt-2 border-t border-stone-800">🎉 ĐẠI THẮNG KHẢO HẠCH! ${trial.name} gật đầu khen ngợi: "Căn cơ vững chắc, tương lai đệ tử tiền đồ vô lượng!"</div>`;
                logsBox.innerHTML += `<div class="text-amber-300 font-bold font-mono">Phần Thưởng: +${trial.rewardContribution} Cống Hiến, +${trial.rewardStones.toLocaleString('vi-VN')} Linh Thạch, +${trial.rewardJade} Tiên Ngọc!</div>`;
                logsBox.scrollTop = logsBox.scrollHeight;
            }
            if (typeof addLog === 'function') {
                addLog(`🎉 Vượt qua Thí Luyện Trưởng Lão [${trial.name}]! Nhận +${trial.rewardContribution} Cống Hiến, +${trial.rewardStones.toLocaleString('vi-VN')} LT, +${trial.rewardJade} Tiên Ngọc!`, 'text-amber-300 font-bold');
            }
            if (actionBox) {
                actionBox.innerHTML = `
                    <button type="button" onclick="finishSectTrialCombat()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer">
                        <i class="fa-solid fa-check mr-1.5"></i> Nhận Thưởng & Trở Về
                    </button>
                `;
            }
            if (typeof updateHUD === 'function') updateHUD();
            if (typeof saveGameState === 'function') saveGameState();
            return;
        }

        // Elder attacks Player
        const elderAtkMult = (Number(state.petTier) >= 4) ? 0.90 : 1.0;
        const eDmg = Math.max(5, Math.round((trial.atk * elderAtkMult - effectiveStats.def * 0.5) * (0.8 + Math.random() * 0.4)));
        playerHp = Math.max(0, playerHp - eDmg);
        if (playerBar) playerBar.style.width = `${(playerHp / effectiveStats.maxHp) * 100}%`;
        if (playerTxt) playerTxt.textContent = `${playerHp.toLocaleString('vi-VN')} / ${effectiveStats.maxHp.toLocaleString('vi-VN')}`;

        if (logsBox) {
            logsBox.innerHTML += `<div>⚡ <span class="text-rose-400">${trial.name}</span> phóng kiếm khí đáp lễ, đánh trúng bạn <b class="text-rose-400">-${eDmg.toLocaleString('vi-VN')} HP</b>.</div>`;
            logsBox.scrollTop = logsBox.scrollHeight;
        }

        // Check Defeat
        if (playerHp <= 0) {
            clearInterval(sectCombatTimer);
            sectCombatTimer = null;
            if (logsBox) {
                logsBox.innerHTML += `<div class="text-rose-400 font-bold pt-2 border-t border-stone-800">💀 Không địch lại uy thế của Trưởng Lão! ${trial.name} thu kiếm: "Đạo hữu cần bồi dưỡng thêm căn cơ trước khi tái chiến!"</div>`;
                logsBox.scrollTop = logsBox.scrollHeight;
            }
            if (actionBox) {
                actionBox.innerHTML = `
                    <button type="button" onclick="finishSectTrialCombat()" class="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition active:scale-95 cursor-pointer">
                        Rút Lui Dưỡng Thương
                    </button>
                `;
            }
        }
    }, 900);
}

function cancelSectTrialCombat() {
    if (sectCombatTimer) {
        clearInterval(sectCombatTimer);
        sectCombatTimer = null;
    }
    switchSectTab('array');
}

function finishSectTrialCombat() {
    if (sectCombatTimer) {
        clearInterval(sectCombatTimer);
        sectCombatTimer = null;
    }
    switchSectTab('array');
}

function enterSectFacility(facilityName) {
    if (facilityName === 'Tàng Kinh Các') {
        switchSectTab('shop');
    } else if (facilityName === 'Khải Vân Điện') {
        switchSectTab('quests');
    }
}

// Export cho Window
if (typeof window !== 'undefined') {
    window.openSectModal = openSectModal;
    window.closeSectModal = closeSectModal;
    window.renderSectModal = renderSectModal;
    window.switchSectTab = switchSectTab;
    window.confirmJoinSect = confirmJoinSect;
    window.joinSect = joinSect;
    window.claimSectHomage = claimSectHomage;
    window.startSectQuest = startSectQuest;
    window.claimSectQuestReward = claimSectQuestReward;
    window.cancelSectQuest = cancelSectQuest;
    window.buySectShopItem = buySectShopItem;
    window.advanceSectRank = advanceSectRank;
    window.tickSectSystem = tickSectSystem;
    window.enterSectFacility = enterSectFacility;
    window.renderSectArrayTabHtml = renderSectArrayTabHtml;
    window.renderSectPage = renderSectPage;
    window.upgradeSectArray = upgradeSectArray;
    window.startSectTrialCombat = startSectTrialCombat;
    window.cancelSectTrialCombat = cancelSectTrialCombat;
    window.finishSectTrialCombat = finishSectTrialCombat;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openSectModal,
        closeSectModal,
        renderSectModal,
        renderSectPage,
        switchSectTab,
        confirmJoinSect,
        joinSect,
        claimSectHomage,
        startSectQuest,
        claimSectQuestReward,
        cancelSectQuest,
        buySectShopItem,
        advanceSectRank,
        tickSectSystem,
        enterSectFacility,
        renderSectArrayTabHtml,
        upgradeSectArray,
        startSectTrialCombat,
        cancelSectTrialCombat,
        finishSectTrialCombat,
        ...(typeof SECTS_DATA !== 'undefined' ? { SECTS_DATA } : {}),
        ...(typeof SECT_RANKS !== 'undefined' ? { SECT_RANKS } : {}),
        ...(typeof SECT_SHOP_ITEMS !== 'undefined' ? { SECT_SHOP_ITEMS } : {}),
        ...(typeof SECT_QUEST_TEMPLATES !== 'undefined' ? { SECT_QUEST_TEMPLATES } : {})
    };
}
