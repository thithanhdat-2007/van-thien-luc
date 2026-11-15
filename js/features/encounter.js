(() => {
    'use strict';

    let currentEncounter = null;
    let returnFocus = null;

    function getPendingEncounter() {
        return ENCOUNTERS.find(encounter => encounter.id === state.pendingEncounterId) || null;
    }

    function syncEncounterNotification() {
        const button = document.getElementById('fortuitous-event-btn');
        if (!button) return;
        const pending = getPendingEncounter();
        button.hidden = !pending;
        button.setAttribute('aria-expanded', String(Boolean(currentEncounter)));
    }

    function queueEncounter(encIdx = null, force = false) {
        if (state.isDead) return false;
        if (getPendingEncounter() && !force) return false;
        if (!force && typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('btn_lich_luyen')) return false;
        if (!force && Date.now() - (Number(state.lastEncounterAt) || 0) < ENCOUNTER_RULES.cooldownMs) return false;
        const index = encIdx === null ? Math.floor(Math.random() * ENCOUNTERS.length) : encIdx;
        if (!Number.isInteger(index) || !ENCOUNTERS[index]) return false;
        state.pendingEncounterId = ENCOUNTERS[index].id;
        state.lastEncounterAt = Date.now();
        if (window.GameState) window.GameState.pendingEncounterId = state.pendingEncounterId;
        syncEncounterNotification();
        saveGameState();
        addLog('📜 <span class="text-amber-300 font-bold">Kỳ ngộ xuất hiện!</span> Một trang cổ tịch đang chờ đạo hữu mở xem.', 'text-amber-200');
        return true;
    }

    function getEncounterRewards(option, type) {
        return {
            stones: option.stones ?? (type === 'righteous' ? 500 : 15000),
            exp: option.exp ?? (type === 'righteous' ? 400 : 20000),
            rDelta: option.righteousDelta ?? (type === 'righteous' ? 15 : -10),
            dDelta: option.demonicDelta ?? (type === 'demonic' ? 25 : -5)
        };
    }

    function renderEncounterChoice(type) {
        const option = currentEncounter[type] || {};
        const rewards = getEncounterRewards(option, type);
        const righteous = type === 'righteous';
        const itemNames = {
            pill_qi: 'Tụ Khí Đan', pill_foundation: 'Trúc Cơ Đan', herb_spirit: 'Hạt Tử Linh Chi',
            herb_blood: 'Hạt Huyết Sâm', stone_ore: 'Huyền Thiết', pill_breakthrough: 'Phá Cảnh Đan'
        };
        const karma = righteous ? Math.abs(rewards.rDelta) : Math.abs(rewards.dDelta);
        const mind = righteous ? ENCOUNTER_RULES.righteousMindGain : ENCOUNTER_RULES.demonicMindLoss;
        const item = option.giveItem;
        return `
            <article class="encounter-path encounter-path--${type} flex flex-col rounded-2xl border p-5">
                <span class="encounter-path-label">${righteous ? '☯ Chính Đạo' : '✦ Ma Đạo'}</span>
                <h4>${option.title || (righteous ? 'Rút kiếm tương trợ' : 'Đoạt bảo')}</h4>
                <p class="encounter-action-story">${option.desc || ''}</p>
                <div class="encounter-reward-box">
                    <h5>Phần thưởng dự kiến</h5>
                    <ul class="encounter-rewards">
                        <li><span>Tu vi</span><strong>+${rewards.exp.toLocaleString('vi-VN')}</strong></li>
                        <li><span>Linh thạch</span><strong>+${rewards.stones.toLocaleString('vi-VN')}</strong></li>
                        <li><span>${righteous ? 'Chính khí' : 'Nghiệp chướng'}</span><strong>+${karma}</strong></li>
                        ${item ? `<li><span>${itemNames[item.id] || item.id}</span><strong>×${item.count}</strong></li>` : ''}
                    </ul>
                </div>
                <p class="encounter-consequence">${righteous
                    ? `+${mind} Đạo Tâm, tối đa 100. Tâm Ma giảm tương ứng.`
                    : `Rủi ro: −${mind} Đạo Tâm, tối thiểu 0. Tâm Ma tăng tương ứng, gây bất lợi khi độ kiếp.`}</p>
                <button type="button" data-encounter-choice="${type}" onclick="chooseEncounterOption('${type}')" class="encounter-choose mt-auto w-full rounded-xl transition-colors duration-200">${option.title || (righteous ? 'Chọn Chính Đạo' : 'Chọn Ma Đạo')}</button>
            </article>`;
    }

    function openEncounterModal(autoGenerate = false) {
        if (rejectLockedFeature('btn_lich_luyen')) return;
        let pending = getPendingEncounter();
        if (!pending && autoGenerate) {
            queueEncounter(null, true);
            pending = getPendingEncounter();
        }
        if (!pending) {
            if (typeof window.showGameToast === 'function') {
                window.showGameToast('Chưa có kỳ ngộ đang chờ. Hãy tiếp tục tu luyện hoặc lịch luyện.', 'info');
            } else if (typeof showMsg === 'function') {
                showMsg('Chưa có kỳ ngộ đang chờ. Hãy tiếp tục tu luyện hoặc lịch luyện.', 'info');
            }
            return;
        }
        const backdrop = document.getElementById('ancient-scroll-backdrop');
        const content = document.getElementById('ancient-scroll-content');
        if (!backdrop || !content) return;
        if (backdrop.classList.contains('active')) return;
        returnFocus = document.activeElement;
        currentEncounter = pending;
        document.getElementById('encounter-rarity').textContent = pending.rarity || 'Cơ duyên Hồng Hoang';
        content.innerHTML = `
            <section class="encounter-story">
                <span class="encounter-location">${pending.location || 'Hồng Hoang Đại Lục'}</span>
                <h3>${pending.title}</h3>
                <p>${pending.story}</p>
            </section>
            <div class="encounter-paths grid grid-cols-1 md:grid-cols-2 gap-5">
                ${renderEncounterChoice('righteous')}${renderEncounterChoice('demonic')}
            </div>
            <footer class="encounter-footer">
                <button type="button" onclick="skipEncounter()">Bỏ qua, không vướng vào nhân quả này</button>
            </footer>`;
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex', 'active');
        backdrop.removeAttribute('aria-hidden');
        backdrop.style.setProperty('display', 'flex', 'important');
        content.scrollTop = 0;
        syncEncounterNotification();
        document.getElementById('ancient-scroll-title').focus();
    }

    function closeEncounterModal() {
        const backdrop = document.getElementById('ancient-scroll-backdrop');
        const wasOpen = backdrop?.classList.contains('active');
        if (backdrop) {
            backdrop.style.setProperty('display', 'none', 'important');
            backdrop.classList.add('hidden');
            backdrop.classList.remove('flex', 'active');
            backdrop.setAttribute('aria-hidden', 'true');
        }
        currentEncounter = null;
        syncEncounterNotification();
        if (wasOpen) {
            const target = returnFocus?.isConnected && !returnFocus.hidden
                ? returnFocus : document.getElementById('btn-immersion');
            target?.focus();
        }
    }

    function skipEncounter() {
        if (!currentEncounter || currentEncounter.id !== state.pendingEncounterId) return;
        state.pendingEncounterId = null;
        closeEncounterModal();
        saveGameState();
    }

    function initializeEncounterUI() {
        const backdrop = document.getElementById('ancient-scroll-backdrop');
        if (!backdrop) return;
        if (!backdrop.dataset.encounterReady) {
            backdrop.dataset.encounterReady = 'true';
            backdrop.addEventListener('click', event => {
                if (event.target === backdrop) closeEncounterModal();
            });
            backdrop.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    closeEncounterModal();
                } else if (event.key === 'Tab') {
                    const buttons = [...backdrop.querySelectorAll('button:not(:disabled)')];
                    const first = buttons[0];
                    const last = buttons[buttons.length - 1];
                    if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'ancient-scroll-title')) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            });
        }
        syncEncounterNotification();
    }

    function chooseEncounterOption(type) {
        if (!['righteous', 'demonic'].includes(type) || !currentEncounter || currentEncounter.id !== state.pendingEncounterId) return;
        const opt = currentEncounter[type] || {};
        const { stones, exp, rDelta, dDelta } = getEncounterRewards(opt, type);

        state.pendingEncounterId = null;
        currentEncounter = null;
        state.stones = (state.stones || 0) + stones;
        addExp(exp);

        if (opt.giveItem && typeof addItemToInventory === 'function') {
            addItemToInventory(opt.giveItem.id, opt.giveItem.count);
        }

        // Tự động quay thưởng theo Loot Table kỳ ngộ tiên duyên
        if (typeof window.rollLootDrop === 'function') {
            window.rollLootDrop('encounter', state.realmIndex || 0);
        }

        if (type === 'righteous') {
            state.righteousKarma = (state.righteousKarma || 0) + Math.abs(rDelta);
            state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + ENCOUNTER_RULES.righteousMindGain);
            state.tamMa = Math.max(0, 100 - state.daoTam);

            // Đồng bộ Trục Cân Bằng Đạo Tâm (#top-dao-card)
            state.alignment = state.alignment || { righteous: 50, demonic: 50 };
            state.alignment.righteous = Math.min(100, (Number(state.alignment.righteous) || 50) + 8);
            state.alignment.demonic = Math.max(0, 100 - state.alignment.righteous);
            if (window.GameState) {
                window.GameState.stones = state.stones;
                window.GameState.inventory = state.inventory;
                window.GameState.righteousKarma = state.righteousKarma;
                window.GameState.demonicKarma = state.demonicKarma;
                window.GameState.alignment = JSON.parse(JSON.stringify(state.alignment));
                window.GameState.daoTam = state.daoTam;
                window.GameState.tamMa = state.tamMa;
            }

            triggerHolyFlash();
            if (typeof playSound === 'function') playSound('holy_bell');
            if (typeof spawnFloatingText === 'function') {
                spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Đạo tâm kiên định, vạn tà bất xâm! (+8 Chính Khí)", "text-amber-300 font-extrabold text-base");
            }
            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`✨ Chính Khí Lẫm Nhiên! Đạo tâm +${ENCOUNTER_RULES.righteousMindGain}, thu hoạch +${stones.toLocaleString('vi-VN')} Linh Thạch, +${exp.toLocaleString('vi-VN')} Tu Vi!`, 'success');
            }
            addLog(`✨ <span class='text-amber-300 font-bold'>[Chính Đạo • ${opt.title || 'Thanh Tâm'}]</span> ${opt.rewardText || 'Đạo tâm kiên định, vạn tà bất xâm!'} Nhận <span class='text-gold-300'>+${stones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class='text-emerald-400'>+${exp.toLocaleString('vi-VN')} Tu Vi</span>, <span class='text-cyan-300'>+${ENCOUNTER_RULES.righteousMindGain} Đạo Tâm</span>, <span class='text-amber-300'>+8 Chính Khí</span>.`, "text-amber-300", "karma-righteous");
        } else {
            state.demonicKarma = (state.demonicKarma || 0) + Math.abs(dDelta);
            state.daoTam = Math.max(0, (state.daoTam != null ? state.daoTam : 100) - ENCOUNTER_RULES.demonicMindLoss);
            state.tamMa = Math.min(100, 100 - state.daoTam);

            // Đồng bộ Trục Cân Bằng Đạo Tâm (#top-dao-card)
            state.alignment = state.alignment || { righteous: 50, demonic: 50 };
            state.alignment.demonic = Math.min(100, (Number(state.alignment.demonic) || 50) + 8);
            state.alignment.righteous = Math.max(0, 100 - state.alignment.demonic);
            if (window.GameState) {
                window.GameState.stones = state.stones;
                window.GameState.inventory = state.inventory;
                window.GameState.righteousKarma = state.righteousKarma;
                window.GameState.demonicKarma = state.demonicKarma;
                window.GameState.alignment = JSON.parse(JSON.stringify(state.alignment));
                window.GameState.daoTam = state.daoTam;
                window.GameState.tamMa = state.tamMa;
            }

            triggerScreenShake();
            triggerBloodFlash();
            if (typeof playSound === 'function') playSound('blood_thunder');
            if (typeof window.triggerCameraTrauma === 'function') window.triggerCameraTrauma(0.4, 'ancient-scroll-backdrop');
            if (typeof spawnFloatingText === 'function') {
                spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Sát nghiệp quấn thân! Tâm Ma gia tăng! (+8 Ma Đạo)", "text-rose-500 font-black text-lg animate-pulse");
            }
            if (typeof window.showGameToast === 'function') {
                window.showGameToast(`🩸 Sát Nghiệp Quấn Thân! Ma Khí +8, đoạt được +${stones.toLocaleString('vi-VN')} Linh Thạch, +${exp.toLocaleString('vi-VN')} Tu Vi!`, 'error');
            }
            triggerDaoTamBarGlitch();

            addLog(`🩸 <span class='text-rose-500 font-bold animate-pulse'>[Ma Đạo • ${opt.title || 'Trầm Luân'}]</span> ${opt.rewardText || 'Sát nghiệp quấn thân!'} Đoạt được <span class='text-gold-300'>+${stones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class='text-jade-300'>+${exp.toLocaleString('vi-VN')} Tu Vi</span>, <span class='text-rose-400'>+8 Ma Khí</span>!`, "text-rose-400", "karma-demonic");
        }

        closeEncounterModal();
        if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
        updateHUD();
        if (typeof window.syncTopResourceBarFromState === 'function') window.syncTopResourceBarFromState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        saveGameState();
        if (typeof refreshExpeditionUI === 'function') refreshExpeditionUI();
    }



    Object.assign(window, {
        queueEncounter, syncEncounterNotification, initializeEncounterUI,
        openEncounterModal, closeEncounterModal, skipEncounter,
        triggerFortuitousEvent: openEncounterModal, chooseEncounterOption
    });
})();
