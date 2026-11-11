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

    // ĐIỀU KIỆN MỞ KHÓA: Luyện Khí Tầng 3 (realmIndex >= 2)
    if (playerRealmIndex < 2) {
        renderSectLockedView(content, playerRealmIndex);
        return;
    }

    // NẾU CHƯA GIA NHẬP TÔNG MÔN: HIỂN THỊ GIAO DIỆN CHỌN MÔN PHÁI
    if (!state.playerSect || !SECTS_DATA[state.playerSect]) {
        renderSectSelectionView(content);
        return;
    }

    // ĐÃ GIA NHẬP TÔNG MÔN
    const sect = SECTS_DATA[state.playerSect];
    const rankCfg = (typeof SECT_RANKS !== 'undefined' && SECT_RANKS[state.sectRank || 0]) ? SECT_RANKS[state.sectRank || 0] : SECT_RANKS[0];
    const contribution = state.sectContribution || 0;
    const sectArrayLvl = Number(state.sectArrayLevel) || 1;

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
    if (!state.playerSect) return;

    const timeScale = state.timeScale || 1;
    const cooldownMs = 86400000 / timeScale;
    const elapsed = Date.now() - (state.lastSectHomageTime || 0);

    if (elapsed < cooldownMs) {
        if (typeof addLog === 'function') {
            addLog("Đạo hữu hôm nay đã thỉnh an sư trưởng rồi, hãy quay lại vào ngày mai!", "text-stone-400");
        }
        return;
    }

    const rankIndex = Math.min(SECT_RANKS.length - 1, state.sectRank || 0);
    const rankCfg = SECT_RANKS[rankIndex];

    let stonesGained = rankCfg.dailyStones;
    if (state.playerSect === 'tan_tu') {
        stonesGained = Math.round(stonesGained * 1.10);
    }

    state.stones = (state.stones || 0) + stonesGained;
    state.sectContribution = (state.sectContribution || 0) + rankCfg.dailyContribution;
    state.lastSectHomageTime = Date.now();

    if (typeof playSound === 'function') playSound('qi');
    if (typeof addLog === 'function') {
        addLog(`⛩️ <span class="text-amber-300 font-bold">[Tông Môn]</span> Thỉnh an sư trưởng thành kính, nhận bổng lộc: <strong>+${stonesGained} Linh Thạch</strong>, <strong>+${rankCfg.dailyContribution} Cống Hiến</strong>!`, 'text-gold-300 font-bold', 'sect-salary');
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
}

// 7. TAB 1: NHIỆM VỤ ĐƯỜNG (SECT QUESTS)
function renderSectQuestsTabHtml() {
    const currentRank = state.sectRank || 0;
    const activeQuest = state.sectQuest;
    const quests = SECT_QUESTS;

    return `
        <div class="space-y-4">
            <!-- ACTIVE QUEST DISPLAY (NẾU ĐANG LÀM HOẶC ĐÃ HOÀN THÀNH) -->
            ${activeQuest ? `
                <div class="p-4 rounded-xl ${activeQuest.completed ? 'bg-emerald-950/40 border-emerald-500/60' : 'bg-slate-900/90 border-amber-500/50'} border shadow-lg space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <span class="w-8 h-8 rounded-lg ${activeQuest.completed ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-950 text-amber-300'} flex items-center justify-center">
                                <i class="fa-solid ${activeQuest.completed ? 'fa-check' : 'fa-hourglass-half animate-spin-slow'}"></i>
                            </span>
                            <div>
                                <h4 class="text-xs font-bold text-slate-100">${activeQuest.name}</h4>
                                <span class="text-[10px] text-stone-400">
                                    Thù lao: +${activeQuest.rewardContribution} Cống Hiến, +${activeQuest.rewardStones} Linh Thạch
                                </span>
                            </div>
                        </div>

                        ${activeQuest.completed ? `
                            <button onclick="claimSectQuestReward()" class="px-4 py-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border border-emerald-400 font-bold text-xs animate-bounce shadow-md">
                                <i class="fa-solid fa-gift mr-1"></i> Lĩnh Thưởng
                            </button>
                        ` : `
                            <div class="flex items-center gap-2">
                                <span id="sect-active-countdown" class="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/30">
                                    ${formatDuration(Math.max(0, activeQuest.durationSeconds - (activeQuest.elapsedSeconds || 0)))}
                                </span>
                                <button onclick="cancelSectQuest()" class="text-[11px] text-stone-500 hover:text-rose-400 px-2 py-1 rounded transition" title="Hủy nhiệm vụ">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `}
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div id="sect-active-progress" class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300" style="width: ${Math.min(100, Math.round(((activeQuest.elapsedSeconds || 0) / activeQuest.durationSeconds) * 100))}%"></div>
                    </div>
                </div>
            ` : ''}

            <!-- DANH SÁCH NHIỆM VỤ CÓ THỂ TIẾP NHẬN -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${quests.map(q => {
                    const isRankEnough = currentRank >= q.minRank;
                    const reqRankCfg = SECT_RANKS[q.minRank];
                    const isMpEnough = (state.mp || 0) >= q.mpCost;
                    const isBusy = Boolean(activeQuest);

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
                                ` : isBusy ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-[11px] font-semibold cursor-not-allowed">
                                        Đang có nhiệm vụ treo máy
                                    </button>
                                ` : !isMpEnough ? `
                                    <button disabled class="w-full py-1.5 rounded-lg bg-stone-900 text-rose-400/70 border border-rose-900/50 text-[11px] font-semibold cursor-not-allowed">
                                        Thiếu Linh Lực (${state.mp || 0}/${q.mpCost})
                                    </button>
                                ` : `
                                    <button onclick="startSectQuest('${q.id}')" class="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition shadow-sm">
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
    if (state.sectQuest) {
        if (typeof addLog === 'function') addLog("Đạo hữu đang thực thi một nhiệm vụ khác, hãy hoàn thành trước!", "text-stone-400");
        return;
    }

    const quest = SECT_QUESTS.find(q => q.id === questId);
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

    state.sectQuest = {
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

    if (typeof playSound === 'function') playSound('sword');
    if (typeof addLog === 'function') {
        addLog(`📜 <span class="text-sky-300 font-bold">[Tông Môn]</span> Tiếp nhận nhiệm vụ <strong>"${quest.name}"</strong>, bắt đầu thực thi!`, "text-sky-300", "sect-quest");
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
}

function claimSectQuestReward() {
    const q = state.sectQuest;
    if (!q || !q.completed) return;

    const contribGained = q.rewardContribution;
    let stonesGained = q.rewardStones;
    if (state.playerSect === 'tan_tu') {
        stonesGained = Math.round(stonesGained * 1.10);
    }
    const expGained = q.rewardExp;

    state.sectContribution = (state.sectContribution || 0) + contribGained;
    state.stones = (state.stones || 0) + stonesGained;
    if (typeof addExp === 'function') addExp(expGained);

    // Phần thưởng vật phẩm nếu có
    if (q.rewardItem && Array.isArray(state.inventory)) {
        const existing = state.inventory.find(i => i.id === q.rewardItem.id);
        if (existing) {
            existing.count = (existing.count || 0) + q.rewardItem.count;
        } else {
            state.inventory.push({
                id: q.rewardItem.id,
                name: q.rewardItem.name,
                type: "Nguyên Liệu",
                count: q.rewardItem.count,
                rarity: 2,
                desc: "Chiến lợi phẩm thu hoạch từ nhiệm vụ môn phái.",
                icon: "fa-box-open"
            });
        }
    }

    state.sectQuest = null;

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof addLog === 'function') {
        addLog(`🎁 <span class="text-emerald-400 font-bold">[Nhiệm Vụ Hoàn Thành]</span> Nhận: <strong>+${contribGained} Cống Hiến</strong>, <strong>+${stonesGained} Linh Thạch</strong>, <strong>+${expGained} Tu Vi</strong>!`, "text-emerald-300 font-bold", "sect-quest-done");
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
}

function cancelSectQuest() {
    if (!state.sectQuest) return;

    if (confirm("Đạo hữu có chắc chắn muốn hủy nhiệm vụ này? Linh lực đã tiêu hao sẽ không được hoàn trả.")) {
        state.sectQuest = null;
        if (typeof saveGameState === 'function') saveGameState();
        renderSectModal();
    }
}

// 8. TAB 2: TÀNG KINH CÁC (SECT SHOP)
function renderSectShopTabHtml() {
    const currentRank = state.sectRank || 0;
    const currentContrib = state.sectContribution || 0;
    const purchased = Array.isArray(state.sectPurchasedSkills) ? state.sectPurchasedSkills : [];
    const playerSectId = state.playerSect;

    // Lọc vật phẩm cho môn phái hiện tại + vật phẩm chung
    const items = SECT_SHOP_ITEMS.filter(it => it.sectId === playerSectId || it.sectId === 'all');

    return `
        <div class="space-y-3">
            <div class="flex items-center justify-between text-xs text-stone-400 pb-1">
                <span>Tàng Kinh Các độc quyền: Chỉ đổi bằng Điểm Cống Hiến môn phái.</span>
                <span class="text-amber-300 font-bold">Cống Hiến: ${currentContrib.toLocaleString('vi-VN')}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${items.map(item => {
                    const isSkill = item.type === 'Tâm Pháp' || item.type === 'Vũ Kỹ';
                    const isBought = isSkill && purchased.includes(item.id);
                    const isRankEnough = currentRank >= item.minRank;
                    const reqRankCfg = SECT_RANKS[item.minRank];
                    const isContribEnough = currentContrib >= item.price;

                    return `
                        <div class="p-3.5 rounded-xl bg-slate-900/70 border border-stone-800 flex flex-col justify-between gap-2.5 hover:border-stone-700 transition">
                            <div class="space-y-1">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 shrink-0 bg-slate-950 flex items-center justify-center shadow-md">
                                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">` : `<i class="fa-solid ${item.icon || (isSkill ? 'fa-scroll' : 'fa-pills')} text-amber-400 text-sm"></i>`}
                                        </div>
                                        <div>
                                            <h5 class="text-xs font-bold text-slate-100">${item.name}</h5>
                                            <span class="text-[9.5px] text-amber-400/80 font-mono">${item.category === 'tam_phap' ? '📜 Tâm Pháp' : item.category === 'vu_ky' ? '🗡️ Vũ Kỹ' : '💊 Đan Dược'}</span>
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
                                    <i class="fa-solid fa-award text-amber-400 mr-1"></i>${item.price} Điểm
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
                                        <button onclick="buySectShopItem('${item.id}')" class="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-500/50 text-[11px] font-bold transition shadow-sm">
                                            Đổi Bí Tịch
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
    const item = SECT_SHOP_ITEMS.find(it => it.id === itemId);
    if (!item) return;

    if ((state.sectRank || 0) < item.minRank) {
        if (typeof addLog === 'function') addLog("Thân phận chưa đủ để đổi vật phẩm này!", "text-rose-400");
        return;
    }

    if ((state.sectContribution || 0) < item.price) {
        if (typeof addLog === 'function') addLog("Điểm cống hiến không đủ!", "text-rose-400");
        return;
    }

    if (!Array.isArray(state.sectPurchasedSkills)) state.sectPurchasedSkills = [];
    const isSkill = item.type === 'Tâm Pháp' || item.type === 'Vũ Kỹ';
    if (isSkill && state.sectPurchasedSkills.includes(item.id)) {
        if (typeof addLog === 'function') addLog("Đạo hữu đã lĩnh ngộ bí kíp này rồi!", "text-amber-300");
        return;
    }

    // Trừ cống hiến an toàn
    state.sectContribution = Math.max(0, (state.sectContribution || 0) - item.price);

    if (isSkill) {
        state.sectPurchasedSkills.push(item.id);

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

        if (typeof playSound === 'function') playSound('breakthrough');
        if (typeof addLog === 'function') {
            addLog(`📖 <span class="text-amber-300 font-bold">[Tàng Kinh Các]</span> Đạo hữu dùng ${item.price} Cống Hiến đổi được và lập tức lĩnh ngộ: <strong>${item.name}</strong>!`, "text-amber-300 font-bold", "sect-buy-skill");
        }
    } else {
        // Đan Dược
        if (item.action === 'gain_exp_1000') {
            if (typeof addExp === 'function') addExp(1000);
            if (typeof playSound === 'function') playSound('qi');
            if (typeof addLog === 'function') {
                addLog(`💊 <span class="text-emerald-400 font-bold">[Tông Môn Đan Dược]</span> Phục dụng <strong>${item.name}</strong>, gân cốt thông suốt, nhận ngay <strong>+1,000 Tu Vi</strong>!`, "text-emerald-300 font-bold", "sect-use-pill");
            }
        } else if (item.action === 'clear_tam_ma_10' || item.id === 'pill_thanh_tam') {
            state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + 10);
            state.tamMa = Math.max(0, 100 - state.daoTam);
            if (typeof playSound === 'function') playSound('bell');
            if (typeof addLog === 'function') {
                addLog(`🌿 <span class="text-teal-300 font-bold">[Thanh Tâm Đan]</span> Dược lực thanh tịnh tan vào thần hồn, tiêu trừ 10 Tâm Ma, Đạo Tâm tăng lên (${state.daoTam}/100)!`, "text-teal-300 font-bold", "sect-use-pill");
            }
        } else if (item.action === 'gain_perm_stats') {
            if (!state.permPillStats) state.permPillStats = { hp: 0, atk: 0, def: 0 };
            const hpGain = Number(item.stats?.hp) || 0;
            const atkGain = Number(item.stats?.atk) || 0;
            state.permPillStats.hp = (state.permPillStats.hp || 0) + hpGain;
            state.permPillStats.atk = (state.permPillStats.atk || 0) + atkGain;
            if (typeof playSound === 'function') playSound('bell');
            if (typeof addLog === 'function') {
                addLog(`✨ <span class="text-amber-300 font-bold">[Thái Ất Tẩy Tủy]</span> Phục dụng <strong>${item.name}</strong>, gân cốt biến dị vô song, vĩnh viễn tăng <strong>+${hpGain} Khí Huyết</strong> và <strong>+${atkGain} Công Kích</strong>!`, "text-gold-300 font-bold", "sect-use-pill");
            }
        } else {
            // Thêm vào inventory
            if (Array.isArray(state.inventory)) {
                const existing = state.inventory.find(i => i.id === item.id);
                if (existing) {
                    existing.count = (existing.count || 0) + 1;
                } else {
                    state.inventory.push({
                        id: item.id,
                        name: item.name,
                        type: "Đan Dược",
                        count: 1,
                        rarity: item.tier === 'huyen' ? 4 : 3,
                        desc: item.desc,
                        icon: "fa-pills"
                    });
                }
            }
            if (typeof addLog === 'function') {
                addLog(`💊 <span class="text-emerald-400 font-bold">[Tông Môn]</span> Đổi thành công <strong>${item.name}</strong> cất vào Túi Trữ Vật!`, "text-emerald-300 font-bold", "sect-buy-pill");
            }
        }
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
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
            <!-- THÂN PHẬN HIỆN TẠI -->
            <div class="p-4 rounded-xl bg-slate-900/80 border border-stone-800 flex items-center justify-between">
                <div>
                    <span class="text-[10px] text-stone-400 uppercase tracking-wider block">Thân Phận Hiện Tại</span>
                    <h4 class="text-sm font-bold text-amber-300 flex items-center gap-2 mt-0.5">
                        <span>${currentRankCfg.name}</span>
                        <span class="text-[10px] font-normal px-2 py-0.5 rounded-full border ${currentRankCfg.badgeClass}">Cấp ${currentRankCfg.rank + 1}</span>
                    </h4>
                    <p class="text-[11px] text-stone-400 mt-1">Đặc quyền: ${currentRankCfg.privilege}</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-stone-400 block">Bổng lộc ngày</span>
                    <span class="text-xs font-mono font-bold text-emerald-400">+${currentRankCfg.dailyStones} Đá / +${currentRankCfg.dailyContribution} Điểm</span>
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
    const currentRankIdx = state.sectRank || 0;
    if (currentRankIdx >= SECT_RANKS.length - 1) return;

    const nextRankCfg = SECT_RANKS[currentRankIdx + 1];
    const playerRealmIdx = state.realmIndex || 0;
    const contribution = state.sectContribution || 0;

    if (playerRealmIdx < nextRankCfg.minRealmIndex || contribution < nextRankCfg.minContributionReq) {
        if (typeof addLog === 'function') addLog("Đạo hữu chưa thỏa mãn đủ điều kiện khảo hạch thăng cấp!", "text-rose-400");
        return;
    }

    // Trừ cống hiến an toàn
    state.sectContribution = Math.max(0, (state.sectContribution || 0) - nextRankCfg.minContributionReq);
    state.sectRank += 1;

    if (typeof playSound === 'function') playSound('breakthrough');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Thăng Cấp Thân Phận!", "text-amber-300 font-bold text-lg");
    }

    if (typeof addLog === 'function') {
        addLog(`🎉 <span class="text-amber-300 font-bold">[Chấp Sự Điện]</span> Chúc mừng đạo hữu thông qua khảo hạch, chính thức tấn thăng thành: <strong class="text-amber-300">${nextRankCfg.name}</strong>!`, "text-amber-300 font-bold", "advance-sect-rank");
    }

    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateHUD === 'function') updateHUD();

    renderSectModal();
}

// 10. TICK SYSTEM ĐƯỢC GỌI MỖI GIÂY TRONG GAMELOOP
function tickSectSystem() {
    if (!state || !state.sectQuest) return;

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
        </div>
    `;
}

function upgradeSectArray() {
    if (!state.playerSect) return;
    const arrayLvl = Number(state.sectArrayLevel) || 1;
    const arrayTiers = typeof SECT_ARRAY_TIERS !== 'undefined' ? SECT_ARRAY_TIERS : [];
    if (arrayLvl >= arrayTiers.length) {
        if (typeof addLog === 'function') addLog('🛡️ Hộ Sơn Đại Trận của tông môn đã đạt Cực Cảnh Cấp 5!', 'text-amber-300');
        return;
    }
    const nextCfg = arrayTiers[arrayLvl];
    const playerRank = Number(state.sectRank) || 0;
    if (playerRank < nextCfg.minRank) {
        const reqRankName = SECT_RANKS[nextCfg.minRank]?.name || 'Cao hơn';
        if (typeof addLog === 'function') addLog(`⚠️ Cần chức vị [${reqRankName}] trở lên để chủ trì đại trận!`, 'text-rose-400');
        return;
    }
    if ((state.sectContribution || 0) < nextCfg.reqContribution) {
        if (typeof addLog === 'function') addLog(`⚠️ Điểm Cống Hiến không đủ (Cần ${nextCfg.reqContribution} điểm).`, 'text-rose-400');
        return;
    }
    if ((state.stones || 0) < nextCfg.reqStones) {
        if (typeof addLog === 'function') addLog(`⚠️ Linh Thạch không đủ để kích hoạt linh trận (Cần ${nextCfg.reqStones.toLocaleString('vi-VN')} LT).`, 'text-rose-400');
        return;
    }

    state.sectContribution = Math.max(0, (state.sectContribution || 0) - nextCfg.reqContribution);
    state.stones = Math.max(0, (state.stones || 0) - nextCfg.reqStones);
    state.sectArrayLevel = arrayLvl + 1;

    if (typeof playSound === 'function') playSound('bell');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Hộ Sơn Đại Trận Cấp ${state.sectArrayLevel}!`, 'text-amber-300');
    }
    if (typeof addLog === 'function') {
        addLog(`🛡️ Tụ linh tế trận thành công! Hộ Sơn Đại Trận đột phá lên [${nextCfg.name}]! Tăng vọt tốc độ tu vi và uy lực môn nhân!`, 'text-amber-300 font-bold');
    }
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
    renderSectModal();
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
            if (!Array.isArray(state.sectTrialsBeaten)) state.sectTrialsBeaten = [];
            if (!state.sectTrialsBeaten.includes(trial.id)) {
                state.sectTrialsBeaten.push(trial.id);
            }
            state.sectContribution = (state.sectContribution || 0) + trial.rewardContribution;
            state.stones = (state.stones || 0) + trial.rewardStones;
            if (state.immortalJade !== undefined) state.immortalJade = (state.immortalJade || 0) + trial.rewardJade;
            else if (state.jade !== undefined) state.jade = (state.jade || 0) + trial.rewardJade;

            if (typeof playSound === 'function') playSound('bell');
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
