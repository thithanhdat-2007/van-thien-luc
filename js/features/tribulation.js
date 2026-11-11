(function () {
    'use strict';
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
        artifactTimer: null,
        artifactCooldown: false,
        artifactShieldBonus: 0,
        recoveryCharges: 0,
        wardCharges: 0,
        wardReduction: 0,
        auto: true,
        nextStrikeReady: false
    };

    function updateTribulationControls() {
        const rules = window.tribulationActionConfig || {};
        const active = doKiepState.inProgress && doKiepState.isStriking;
        const recover = document.getElementById('btn-trib-recover');
        const ward = document.getElementById('btn-trib-ward');
        const next = document.getElementById('btn-trib-next');
        const auto = document.getElementById('btn-trib-auto');
        if (recover) recover.disabled = !active || !doKiepState.recoveryCharges || doKiepState.currentShield >= doKiepState.maxShield;
        if (ward) ward.disabled = !active || !doKiepState.wardCharges || doKiepState.wardReduction > 0;
        if (next) {
            next.hidden = !active || doKiepState.auto;
            next.disabled = !doKiepState.nextStrikeReady;
        }
        if (auto) {
            auto.setAttribute('aria-pressed', String(doKiepState.auto));
            auto.querySelector('span').textContent = `Tự động: ${doKiepState.auto ? 'Bật' : 'Tắt'}`;
        }
        const healCount = document.getElementById('trib-recover-count');
        if (healCount) healCount.textContent = `${doKiepState.recoveryCharges}/${rules.recoveryCharges || 3}`;
        const wardCount = document.getElementById('trib-ward-count');
        if (wardCount) wardCount.textContent = `${doKiepState.wardCharges}/${rules.wardCharges || 1}`;
        const pips = document.getElementById('trib-strike-pips');
        if (pips) pips.innerHTML = Array.from({ length: doKiepState.totalStrikes }, (_, i) =>
            `<span class="${i < doKiepState.currentStrike ? 'is-spent' : i === doKiepState.currentStrike ? 'is-next' : ''}" aria-label="Đạo ${i + 1}">⚡</span>`).join('');
    }

    function updateTribulationShield() {
        const shieldNum = document.getElementById('trib-shield-num');
        const shieldBar = document.getElementById('trib-shield-bar');
        if (shieldNum) shieldNum.textContent = `${doKiepState.currentShield.toLocaleString()} / ${doKiepState.maxShield.toLocaleString()}`;
        if (shieldBar) shieldBar.style.width = `${Math.max(0, Math.min(100, doKiepState.currentShield / doKiepState.maxShield * 100))}%`;
        updateTribulationControls();
    }

    function openDoKiepModal(targetRealm = null) {
        // Lấy thông tin cảnh giới hiện tại và mục tiêu
        const gState = window.state || (typeof state !== 'undefined' ? state : null);
        const realmsArr = window.REALMS || (typeof REALMS !== 'undefined' ? REALMS : []);
        const rIdx = gState?.realmIndex || 0;
        const currentRealm = realmsArr[rIdx] || { name: 'Luyện Khí Kỳ', maxExp: 100 };
        const nextRealm = realmsArr[rIdx + 1];
        if (!currentRealm.isMajorBottleneck || !nextRealm || Number(gState?.exp || 0) < currentRealm.maxExp) {
            if (typeof window.addLog === 'function') window.addLog('Độ Kiếp chỉ mở khi đạt Viên Mãn và đủ Tu Vi. Tiểu cảnh giới dùng Xung Kích Bình Cảnh.', 'text-amber-300');
            return;
        }
        closeAllFeaturePopups();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
        const modal = document.getElementById('modal-do-kiep');
        if (!modal) return;
        if (doKiepState.strikeTimer) clearTimeout(doKiepState.strikeTimer);
        if (doKiepState.artifactTimer) clearTimeout(doKiepState.artifactTimer);
        doKiepState.strikeTimer = null;
        doKiepState.artifactTimer = null;

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
        const rules = window.tribulationActionConfig || {};
        doKiepState.recoveryCharges = rules.recoveryCharges || 3;
        doKiepState.wardCharges = rules.wardCharges || 1;
        doKiepState.wardReduction = 0;
        doKiepState.auto = true;
        doKiepState.nextStrikeReady = false;
        const artifactBtn = document.getElementById('btn-te-phap-bao');
        if (artifactBtn) {
            artifactBtn.disabled = true;
            artifactBtn.style.opacity = '';
            artifactBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Tế pháp bảo</span>';
        }

        // Cập nhật DOM
        const titleEl = document.getElementById('trib-target-realm-title');
        if (titleEl) {
            titleEl.textContent = String(targetTitle).toUpperCase();
        }

        const avatarImg = document.getElementById('tribulation-avatar-img');
        if (avatarImg) {
            // Keep the original female cultivator artwork for this scene.
            avatarImg.src = window.DEFAULT_CULTIVATION_AVATAR || './assets/images/image_11.png';
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

        const scene = document.getElementById('trib-scene-source');
        if (scene) modal.style.setProperty('--trib-scene', `url("${scene.src}")`);
        const target = document.getElementById('trib-encounter-target');
        if (target) target.textContent = targetTitle;
        const hint = document.getElementById('trib-action-hint');
        if (hint) hint.textContent = 'Bắt đầu thiên kiếp, rồi dùng hộ trận và pháp bảo trước những đạo lôi nguy hiểm.';
        updateTribulationShield();

        // Hiển thị Modal
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('active', 'flex');
        modal.dataset.phase = 'ready';
    }

    function closeDoKiepModal(isAbandoned = false) {
        window.tribulationVisuals?.clear();
        if (doKiepState.strikeTimer) {
            clearTimeout(doKiepState.strikeTimer);
            doKiepState.strikeTimer = null;
        }
        if (doKiepState.artifactTimer) {
            clearTimeout(doKiepState.artifactTimer);
            doKiepState.artifactTimer = null;
        }

        if (isAbandoned && doKiepState.inProgress && doKiepState.isStriking) {
            // Hình phạt Tẩu Hỏa Nhập Ma khi bỏ cuộc giữa chừng
            const gState = window.state || (typeof state !== 'undefined' ? state : null);
            if (gState && gState.exp > 0) {
                const penalty = Math.round(gState.exp * 0.15);
                gState.exp = Math.max(0, gState.exp - penalty);
                if (typeof window.saveGameState === 'function') window.saveGameState();
                if (typeof window.updateHUD === 'function') window.updateHUD();
                if (typeof window.addLog === 'function') {
                    window.addLog(`⚠️ <span class="text-rose-400 font-bold">[Tẩu Hỏa Nhập Ma]</span> Giữa chừng bỏ chạy khỏi thiên kiếp! Chân khí tán loạn, tổn thất ${penalty.toLocaleString()} Tu Vi!`, 'text-rose-400');
                }
            }
        }

        doKiepState.inProgress = false;
        doKiepState.isStriking = false;
        doKiepState.nextStrikeReady = false;

        const modal = document.getElementById('modal-do-kiep');
        if (modal) {
            modal.dataset.phase = '';
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active', 'flex');
        }
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    function playTribulationThunder() {
        if (window.soundSystem && typeof window.soundSystem.playThunder === 'function') {
            window.soundSystem.playThunder();
        } else if (typeof window.playSound === 'function') {
            window.playSound('breakthrough');
        }
    }

    // Nút Tế Pháp Bảo
    function defendWithArtifact(event) {
        if (event) event.stopPropagation();
        if (!doKiepState.inProgress || !doKiepState.isStriking) return;

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
        updateTribulationControls();

        // Thông báo bay lên
        spawnFloatingDamage(`+${heal.toLocaleString()} Chân Khí!`, true);

        const btn = document.getElementById('btn-te-phap-bao');
        if (btn) {
            btn.style.opacity = '0.6';
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Đang hộ thể</span>';
        }

        doKiepState.artifactTimer = setTimeout(() => {
            doKiepState.artifactCooldown = false;
            doKiepState.artifactTimer = null;
            if (btn) {
                btn.style.opacity = '1';
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Tế pháp bảo</span>';
            }
        }, 4000);
        updateTribulationControls();
    }

    function recoverTribulationShield() {
        if (!doKiepState.inProgress || !doKiepState.isStriking || doKiepState.recoveryCharges <= 0 || doKiepState.currentShield >= doKiepState.maxShield) return;
        const rules = window.tribulationActionConfig || {};
        const heal = Math.round(doKiepState.maxShield * (rules.recoveryPercent || 0.18));
        doKiepState.recoveryCharges--;
        doKiepState.currentShield = Math.min(doKiepState.maxShield, doKiepState.currentShield + heal);
        updateTribulationShield();
        spawnFloatingDamage(`+${heal.toLocaleString()} Chân Khí`, true);
    }

    function raiseTribulationWard() {
        if (!doKiepState.inProgress || !doKiepState.isStriking || doKiepState.wardCharges <= 0 || doKiepState.wardReduction > 0) return;
        const rules = window.tribulationActionConfig || {};
        doKiepState.wardCharges--;
        doKiepState.wardReduction = rules.wardReduction || 0.5;
        const hint = document.getElementById('trib-action-hint');
        if (hint) hint.textContent = 'Hộ trận đã dựng: đạo lôi kế tiếp sẽ được giảm uy lực.';
        updateTribulationControls();
    }

    function advanceTribulationStrike() {
        if (!doKiepState.inProgress || !doKiepState.isStriking || !doKiepState.nextStrikeReady) return;
        if (doKiepState.strikeTimer) clearTimeout(doKiepState.strikeTimer);
        doKiepState.strikeTimer = null;
        doKiepState.nextStrikeReady = false;
        executeNextStrike();
    }

    function toggleTribulationAuto() {
        if (!doKiepState.inProgress) return;
        doKiepState.auto = !doKiepState.auto;
        if (doKiepState.nextStrikeReady && doKiepState.auto) {
            const rules = window.tribulationActionConfig || {};
            doKiepState.strikeTimer = setTimeout(advanceTribulationStrike, rules.nextStrikeDelayMs || 2800);
        } else if (!doKiepState.auto && doKiepState.strikeTimer) {
            clearTimeout(doKiepState.strikeTimer);
            doKiepState.strikeTimer = null;
        }
        updateTribulationControls();
    }

    // Bắt đầu chuỗi sét đánh
    function startDoKiepStrikes() {
        if (!doKiepState.inProgress || doKiepState.isStriking) return;
        doKiepState.isStriking = true;
        document.getElementById('modal-do-kiep')?.setAttribute('data-phase', 'running');
        const artifactBtn = document.getElementById('btn-te-phap-bao');
        if (artifactBtn) artifactBtn.disabled = false;

        const btnStart = document.getElementById('btn-start-dokiep');
        if (btnStart) btnStart.style.display = 'none';

        const stateDesc = document.getElementById('trib-state-desc');
        if (stateDesc) {
            stateDesc.textContent = '⚡ Thiên uy cuồng bạo, lôi kiếp bắt đầu giáng hạ!';
            stateDesc.style.color = '#f43f5e';
        }
        doKiepState.nextStrikeReady = true;
        updateTribulationControls();
        advanceTribulationStrike();
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

        window.tribulationVisuals?.strike(cur, total);
        playTribulationThunder();
        const stateDesc = document.getElementById('trib-state-desc');
        if (stateDesc) stateDesc.textContent = `Đạo lôi thứ ${cur}/${total} đang giáng xuống!`;
        doKiepState.strikeTimer = setTimeout(() => {
            doKiepState.strikeTimer = null;
            if (!doKiepState.inProgress) return;
            const modal = document.getElementById('modal-do-kiep');
            modal?.classList.add('trib-impact');
            setTimeout(() => modal?.classList.remove('trib-impact'), 420);

        // Tính sát thương của đạo lôi kiếp này
        let strikeDamage = Math.round((doKiepState.maxShield / total) * (0.65 + cur * 0.15));
        if (doKiepState.artifactShieldBonus > 0) {
            strikeDamage = Math.round(strikeDamage * (1 - doKiepState.artifactShieldBonus));
            doKiepState.artifactShieldBonus = 0; // Đã tiêu hao khiên giảm thương
        }
        if (doKiepState.wardReduction > 0) {
            strikeDamage = Math.round(strikeDamage * (1 - doKiepState.wardReduction));
            doKiepState.wardReduction = 0;
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
        updateTribulationControls();

        // Nổi sát thương
        spawnFloatingDamage(`-${strikeDamage.toLocaleString()} HP`);
        if (typeof window.addLog === 'function') {
            window.addLog(`⚡ <span class="text-amber-400 font-bold">[Thiên Kiếp Giáng Lâm]</span> Đạo lôi thứ <strong>${cur}/${total}</strong> oanh tạc hộ thể chân khí (-${strikeDamage.toLocaleString()} HP)!`, 'text-amber-300');
        }

        // Kiểm tra sống chết
        if (doKiepState.currentShield <= 0) {
            // Thất bại
            const stateDesc = document.getElementById('trib-state-desc');
            if (stateDesc) {
                stateDesc.textContent = '💀 Chân khí vỡ vụn, đạo cơ chấn động!';
                stateDesc.style.color = '#ef4444';
            }
            if (typeof window.addLog === 'function') {
                window.addLog(`💀 <span class="text-rose-400 font-bold">[Độ Kiếp Bất Thành]</span> Chân khí hộ thể vỡ nát, đạo cơ chấn động trước uy áp thiên lôi!`, 'text-rose-400');
            }

            doKiepState.strikeTimer = setTimeout(() => {
                closeDoKiepModal();
                window.resolveSkyTribulation?.(false, doKiepState.maxShield - doKiepState.currentShield);
            }, 2800);
            return;
        }

        if (cur >= total) {
            // Thành công viên mãn!
            const stateDesc = document.getElementById('trib-state-desc');
            if (stateDesc) {
                stateDesc.textContent = 'Đã vượt qua lôi kiếp, đang kết toán bình cảnh...';
                stateDesc.style.color = '#34d399';
            }
            if (typeof window.addLog === 'function') {
                window.addLog(`✨ <span class="text-emerald-300 font-bold">[Độ Kiếp Viên Mãn]</span> Vượt qua toàn bộ <strong>${total} đạo lôi kiếp</strong>! Bình cảnh giải trừ, đạo cơ thăng hoa!`, 'text-emerald-300');
            }

            doKiepState.strikeTimer = setTimeout(() => {
                closeDoKiepModal();
                window.resolveSkyTribulation?.(true, doKiepState.maxShield - doKiepState.currentShield);
            }, 2800);
            return;
        }

        doKiepState.nextStrikeReady = true;
        const hint = document.getElementById('trib-action-hint');
        if (hint) hint.textContent = `Đã vượt đạo ${cur}/${total}. Hồi nguyên, dựng hộ trận hoặc tế pháp bảo trước đạo tiếp theo.`;
        updateTribulationShield();
        if (doKiepState.auto) {
            const rules = window.tribulationActionConfig || {};
            doKiepState.strikeTimer = setTimeout(advanceTribulationStrike, rules.nextStrikeDelayMs || 2800);
        }
        }, 430);
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

    window.openDoKiepModal = openDoKiepModal;
    window.closeDoKiepModal = closeDoKiepModal;
    window.defendWithArtifact = defendWithArtifact;
    window.startDoKiepStrikes = startDoKiepStrikes;
    window.recoverTribulationShield = recoverTribulationShield;
    window.raiseTribulationWard = raiseTribulationWard;
    window.advanceTribulationStrike = advanceTribulationStrike;
    window.toggleTribulationAuto = toggleTribulationAuto;
    window.openBreakthroughModal = openDoKiepModal;
    window.openTribulationZone = openDoKiepModal;
    globalThis.openDoKiepModal = openDoKiepModal;
    globalThis.closeDoKiepModal = closeDoKiepModal;
    globalThis.defendWithArtifact = defendWithArtifact;
    globalThis.startDoKiepStrikes = startDoKiepStrikes;
    globalThis.recoverTribulationShield = recoverTribulationShield;
    globalThis.raiseTribulationWard = raiseTribulationWard;
    globalThis.advanceTribulationStrike = advanceTribulationStrike;
    globalThis.toggleTribulationAuto = toggleTribulationAuto;
    globalThis.openBreakthroughModal = openDoKiepModal;
    globalThis.openTribulationZone = openDoKiepModal;
})();
