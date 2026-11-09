(function () {
    'use strict';
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
            if (window.state.characterName || window.state.name) {
                towerPlayer.name = window.state.characterName || window.state.name;
            }
            if (typeof window.getActivePlayerStats === 'function' && typeof window.calculateCP === 'function') {
                const liveStats = window.getActivePlayerStats();
                const liveCp = window.calculateCP(liveStats);
                const prevRatio = towerPlayer.maxHp > 0 ? (towerPlayer.hp / towerPlayer.maxHp) : 1;
                towerPlayer.maxHp = Math.max(150000, Number(liveStats.core?.maxHp || 0) * 15);
                towerPlayer.hp = Math.max(1, Math.round(towerPlayer.maxHp * prevRatio));
                towerPlayer.atk = Math.max(22000, Number(liveStats.combat?.atk || 0) * 20);
                towerPlayer.def = Math.max(9500, Number(liveStats.combat?.def || 0) * 18);
                towerPlayer.critRate = Math.min(0.75, Math.max(0.28, (Number(liveStats.combat?.critRate || 28)) / 100));
                towerPlayer.dodgeRate = Math.min(0.50, Math.max(0.15, (Number(liveStats.combat?.dodge || 15)) / 100));
                towerPlayer.cp = Math.max(520000, liveCp * 120, Number(window.state.combatPower || 0));
            } else if (window.state.combatPower) {
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
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();
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
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    function handleChallengeClick() {
        if (isCombatActive) return;
        if (towerPlayer.hp <= 0) {
            showXianxiaToast("⚠️ Đạo hữu đang trọng thương! Hãy bấm 'Vận Công Hồi Khí' trước.", "error");
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
            showXianxiaToast(`🎉 CHIẾN THẮNG TẦNG ${bossObj.floor}! Trảm sát yêu ma thành công (+${bossObj.rewardStones.toLocaleString()} Linh Thạch, +${bossObj.rewardTuvi.toLocaleString()} Tu Vi). Tiến vào Tầng ${towerCurrentFloor}!`, 'success');
        } else {
            // THẤT BẠI
            appendLog(`🩸 <b>THẤT BẠI!</b> [${playerObj.name}] trọng thương, bị khí tức Trấn Yêu Tháp đẩy lùi!`, 'log-entry--lose');
            showXianxiaToast(`🩸 THẤT BẠI! Đạo hữu đã bị đánh trọng thương tháo chạy khỏi Trấn Yêu Tháp.`, 'error');
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

        // Giới hạn tối đa 50 dòng DOM tránh tràn bộ nhớ
        while (scroll.children.length > 50 && scroll.firstElementChild) {
            scroll.firstElementChild.remove();
        }
        scroll.scrollTop = scroll.scrollHeight;
    }

    function toggleAutoClimb(checked) {
        const isQualified = towerPlayer.cp >= (towerCurrentBoss.cp * 3);
        if (checked && !isQualified) {
            showXianxiaToast(`🔒 ĐIỀU KIỆN CHƯA ĐỦ! Cần Lực Chiến gấp 3 lần Boss (Hiện tại: ${(towerPlayer.cp / towerCurrentBoss.cp).toFixed(1)}x). Hãy đột phá hoặc tăng cường tu vi!`, 'error');
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
        const maxFloorsPerSweep = 50; // Giới hạn an toàn, tránh block main thread

        while (
            climbed < maxFloorsPerSweep &&
            towerPlayer.hp > 0 &&
            towerCurrentBoss &&
            towerCurrentBoss.cp > 0 &&
            towerPlayer.cp >= (towerCurrentBoss.cp * 3)
        ) {
            climbed++;
            stonesEarned += (Number(towerCurrentBoss.rewardStones) || 0);
            tuviEarned += (Number(towerCurrentBoss.rewardTuvi) || 0);
            towerPlayer.hp = Math.max(1, towerPlayer.hp - Math.round(towerPlayer.maxHp * 0.015));

            towerCurrentFloor++;
            towerCurrentBoss = createFloorBoss(towerCurrentFloor);
        }

        towerPlayer.stones += stonesEarned;
        towerPlayer.tuvi += tuviEarned;
        updateArenaUI();

        if (climbed > 0) {
            appendLog(`⚡ [Auto-Climb] Đã càn quét nhanh ${climbed} tầng! +${stonesEarned.toLocaleString()} Linh Thạch, +${tuviEarned.toLocaleString()} Tu Vi.`, 'log-entry--win');
            showXianxiaToast(`⚡ AUTO-CLIMB THÀNH CÔNG! Quét ${climbed} Tầng Tháp (+${stonesEarned.toLocaleString()} Linh Thạch, +${tuviEarned.toLocaleString()} Tu Vi). Dừng tại Tầng ${towerCurrentFloor}.`, 'success');
        }
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

    window.openDemonTowerModal = openDemonTowerModal;
    window.closeDemonTowerModal = closeDemonTowerModal;
    window.handleChallengeClick = handleChallengeClick;
    window.toggleAutoClimb = toggleAutoClimb;
    window.fullHealPlayer = fullHealPlayer;
    window.updateArenaUI = updateArenaUI;
    window.towerPlayer = towerPlayer;
    globalThis.openDemonTowerModal = openDemonTowerModal;
    globalThis.closeDemonTowerModal = closeDemonTowerModal;
    globalThis.handleChallengeClick = handleChallengeClick;
    globalThis.toggleAutoClimb = toggleAutoClimb;
    globalThis.fullHealPlayer = fullHealPlayer;
    globalThis.updateArenaUI = updateArenaUI;
    globalThis.towerPlayer = towerPlayer;
})();
