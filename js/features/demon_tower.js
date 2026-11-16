(function () {
    'use strict';
    // ========================================================================
    // 8. HỆ THỐNG TRẤN YÊU THÁP • AUTO-BATTLER SPA (DEMON SUPPRESSION TOWER)
    // Tích hợp từ tran_yeu_thap_sprite_battler_demo.html sang chuẩn SPA độc lập
    // ========================================================================

    const towerPlayer = {
        get name() {
            const s = window.GameState || window.state;
            return s?.name || s?.characterName || "Tiêu Dao Tử";
        },
        set name(v) {},
        get maxHp() {
            const s = window.GameState || window.state;
            return Math.max(500, Number(s?.maxHp ?? s?.baseStats?.hp ?? 500));
        },
        set maxHp(v) {},
        get hp() {
            const s = window.GameState || window.state;
            const currentHp = Number(s?.hp ?? this.maxHp);
            return currentHp > 0 ? currentHp : this.maxHp;
        },
        set hp(v) {
            const s = window.GameState || window.state;
            if (s) s.hp = Math.max(0, Number(v) || 0);
        },
        get atk() {
            const s = window.GameState || window.state;
            return Math.max(10, Number(s?.baseStats?.atk ?? s?.atk ?? 28));
        },
        set atk(v) {},
        get def() {
            const s = window.GameState || window.state;
            return Math.max(5, Number(s?.baseStats?.def ?? s?.def ?? 14));
        },
        set def(v) {},
        get critRate() {
            const s = window.GameState || window.state;
            const crit = Number(s?.baseStats?.crit ?? s?.crit ?? 10);
            return Math.min(0.95, Math.max(0.05, crit / 100));
        },
        set critRate(v) {},
        critMultiplier: 2.0,
        get dodgeRate() {
            const s = window.GameState || window.state;
            const dodge = Number(s?.baseStats?.dodge ?? s?.dodge ?? 5);
            return Math.min(0.50, Math.max(0.02, dodge / 100));
        },
        set dodgeRate(v) {},
        get cp() {
            const s = window.GameState || window.state;
            if (s && s.cp) return Number(s.cp);
            if (typeof window.getCombatPower === 'function') return window.getCombatPower(s);
            return Math.round((this.atk * 2) + (this.def * 1.5) + (this.maxHp * 0.1));
        },
        set cp(v) {},
        get stones() {
            const s = window.GameState || window.state;
            return Number(s?.spiritStones ?? s?.stones ?? 0);
        },
        set stones(v) {
            const val = Math.max(0, Number(v) || 0);
            if (window.GameState) {
                window.GameState.spiritStones = val;
                window.GameState.stones = val;
            }
            if (window.state) window.state.stones = val;
        },
        get tuvi() {
            const s = window.GameState || window.state;
            return Number(s?.exp ?? 0);
        },
        set tuvi(v) {
            const val = Math.max(0, Number(v) || 0);
            if (window.GameState) window.GameState.exp = val;
            if (window.state) window.state.exp = val;
        },
        mp: 0,
        maxMp: 100,
        get element() {
            const s = window.GameState || window.state || {};
            const raw = String(s.root?.element || s.spiritualRoot?.element || s.element || 'Kim').toLowerCase();
            if (raw.includes('wood') || raw.includes('mộc') || raw.includes('moc')) return 'Mộc';
            if (raw.includes('water') || raw.includes('thủy') || raw.includes('thuy')) return 'Thủy';
            if (raw.includes('fire') || raw.includes('hỏa') || raw.includes('hoa')) return 'Hỏa';
            if (raw.includes('earth') || raw.includes('thổ') || raw.includes('tho')) return 'Thổ';
            return 'Kim';
        },
        equippedSkill: {
            name: "Hỏa Cầu Thuật",
            triggerChance: 0.25,
            damageMultiplier: 2.3
        }
    };

    let towerCurrentFloor = 1;
    let isCombatActive = false;
    let battleTimer = null;
    let isAutoClimbOn = false;

    // QUY LUẬT NGŨ HÀNH TƯƠNG KHẮC:
    // Kim khắc Mộc | Mộc khắc Thổ | Thổ khắc Thủy | Thủy khắc Hỏa | Hỏa khắc Kim
    const ELEMENT_CYCLE = {
        'kim': 'moc',
        'moc': 'tho',
        'tho': 'thuy',
        'thuy': 'hoa',
        'hoa': 'kim'
    };

    function normalizeElementKey(elem) {
        const raw = String(elem || '').toLowerCase();
        if (raw.includes('kim')) return 'kim';
        if (raw.includes('mộc') || raw.includes('moc') || raw.includes('wood')) return 'moc';
        if (raw.includes('thổ') || raw.includes('tho') || raw.includes('earth')) return 'tho';
        if (raw.includes('thủy') || raw.includes('thuy') || raw.includes('water')) return 'thuy';
        if (raw.includes('hỏa') || raw.includes('hoa') || raw.includes('fire')) return 'hoa';
        return 'kim';
    }

    function getElementRelation(atkElem, defElem) {
        const a = normalizeElementKey(atkElem);
        const d = normalizeElementKey(defElem);
        if (ELEMENT_CYCLE[a] === d) {
            return { factor: 1.25, label: 'Tương Khắc (+25% Sát Thương)' };
        }
        if (ELEMENT_CYCLE[d] === a) {
            return { factor: 0.85, label: 'Bị Khắc (-15% Sát Thương)' };
        }
        return { factor: 1.0, label: 'Bình Hòa' };
    }

    const BOSS_TIER_NAMES = [
        "U Ảnh Ám Lang", "Độc Vĩ Hắc Hạt", "Xích Diễm Ma Bọ",
        "Thiết Giáp Cự Chu", "Băng Tinh Ma Báo", "Huyết Nhãn Khôi Lỗi",
        "Âm Phong Dơi Quỷ", "Hắc Thủy Mãng Xà", "Cửu U Ma Thú"
    ];
    const MILESTONE_BOSS_TITLES = {
        10: "Xích Diễm Huyết Lang Vương (Đại Yêu Vương)",
        20: "Huyết Dực Ma Hoàng (Đại Ma Hoàng)",
        30: "Cửu U Ma Tôn (Thượng Cổ Ma Thần)",
        40: "Vạn Độc Ma Quân (Chí Tôn Ma Đạo)",
        50: "Vô Cực Huyết Ma Thần (Bất Hủ Ma Tổ)"
    };

    const BOSS_ELEMENT_LIST = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

    function createFloorBoss(floor) {
        const isOverlord = (floor % 10 === 0);
        const isElite = (!isOverlord && floor % 5 === 0);
        const scale = Math.pow(1.15, floor - 1);
        const baseHp = Math.round(350 * scale * (isOverlord ? 1.8 : (isElite ? 1.4 : 1)));
        const baseAtk = Math.round(22 * scale * (isOverlord ? 1.45 : (isElite ? 1.25 : 1)));
        const baseDef = Math.round(11 * scale * (isOverlord ? 1.3 : (isElite ? 1.2 : 1)));
        const cp = Math.round((baseAtk * 2) + (baseDef * 1.5) + (baseHp * 0.1));

        let bossName = MILESTONE_BOSS_TITLES[floor];
        if (!bossName) {
            if (isOverlord) {
                bossName = `Thái Cổ Ma Hoàng (Tầng ${floor})`;
            } else if (isElite) {
                const subIndex = ((floor - 1) % BOSS_TIER_NAMES.length);
                bossName = `[Tinh Anh] ${BOSS_TIER_NAMES[subIndex]} (Tầng ${floor})`;
            } else {
                const subIndex = ((floor - 1) % BOSS_TIER_NAMES.length);
                bossName = `${BOSS_TIER_NAMES[subIndex]} (Tầng ${floor})`;
            }
        }

        const bossElement = BOSS_ELEMENT_LIST[(floor - 1) % BOSS_ELEMENT_LIST.length];

        return {
            floor: floor,
            name: bossName,
            isOverlord: isOverlord,
            isElite: isElite,
            specialSkill: isOverlord ? "Cuồng Bạo Huyết Ma" : (isElite ? "Huyền Vũ Hộ Thuẫn" : null),
            element: bossElement,
            maxHp: baseHp,
            hp: baseHp,
            atk: baseAtk,
            baseAtk: baseAtk,
            def: baseDef,
            critRate: isOverlord ? 0.20 : (isElite ? 0.14 : 0.08),
            critMultiplier: 1.5,
            dodgeRate: isOverlord ? 0.10 : (isElite ? 0.07 : 0.04),
            isEnraged: false,
            shieldTurns: 0,
            hasShieldUsed: false,
            cp: cp,
            rewardStones: Math.max(50, floor * 35),
            rewardTuvi: Math.max(100, floor * 80),
            rewardJade: Math.max(2, Math.floor(floor / 2))
        };
    }

    let towerCurrentBoss = createFloorBoss(towerCurrentFloor);

    function syncTowerPlayerStats() {
        const s = window.GameState || window.state;
        if (s) {
            towerCurrentFloor = Math.max(1, Number(s.towerFloor) || 1);
            towerCurrentBoss = createFloorBoss(towerCurrentFloor);
            if (towerPlayer.hp <= 0) {
                towerPlayer.hp = towerPlayer.maxHp;
            }

            // Đồng bộ kỹ năng chiến đấu từ GameState
            const equippedSkillName = s.equipped?.skill;
            const learned = Array.isArray(s.learnedSkills) ? s.learnedSkills.find(sk => sk.name === equippedSkillName) : null;
            if (learned) {
                const lv = Math.max(1, Number(learned.level) || 1);
                towerPlayer.equippedSkill = {
                    name: learned.name,
                    martialType: learned.martialType || (learned.type === 'martial' ? 'burst' : 'passive'),
                    triggerChance: Number(learned.triggerChance) || (0.25 + lv * 0.03),
                    damageMultiplier: Number(learned.burstMult) || (2.0 + lv * 0.3),
                    lifestealPercent: Number(learned.lifestealPercent) || (learned.martialType === 'lifesteal' ? 0.35 : 0),
                    stunChance: Number(learned.stunChance) || (learned.martialType === 'stun' ? 0.45 : (learned.martialType === 'divine' ? 0.60 : 0))
                };
            }
        }
        const nameEl = document.getElementById('player-fighter-name');
        if (nameEl) nameEl.textContent = towerPlayer.name;
    }

    let towerV4Frame = null;

    function getTowerSyncPayload() {
        const s = window.state || window.GameState?._rawState || window.GameState || {};
        const effStats = typeof window.recalculateAllStats === 'function'
            ? window.recalculateAllStats()
            : (typeof window.getEffectiveStats === 'function' ? window.getEffectiveStats() : s);
        const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;

        const currentRealm = (typeof window.REALMS !== 'undefined' && Array.isArray(window.REALMS))
            ? (window.REALMS[s.realmIndex] || window.REALMS[0])
            : { name: "Luyện Khí Kỳ" };
        const realmEl = typeof document !== 'undefined' ? document.getElementById('realm-badge') : null;
        const realmDisplay = (realmEl && realmEl.textContent.trim()) || currentRealm?.name || "Luyện Khí Kỳ";

        const savedTower = s.demonTower || s.towerData || {};
        const currentFloor = Math.max(1, Math.floor(Number(s.towerFloor) || 1));
        const highestCleared = Math.max(
            0,
            Number(savedTower.highestCleared ?? (currentFloor - 1))
        );
        const selectedFloor = Math.min(50, Math.max(1, Number(savedTower.selectedFloor || Math.min(50, highestCleared + 1) || currentFloor)));
        const selectedTier = Math.min(5, Math.max(1, Math.ceil(selectedFloor / 10)));

        let elem = 'Kim';
        const rawElem = s.spiritualRoot?.element || s.activeElement || s.element;
        if (rawElem) {
            const elKey = String(rawElem).toLowerCase();
            if (elKey.includes('wood') || elKey.includes('mộc') || elKey.includes('moc')) elem = 'Moc';
            else if (elKey.includes('water') || elKey.includes('thủy') || elKey.includes('thuy')) elem = 'Thuy';
            else if (elKey.includes('fire') || elKey.includes('hỏa') || elKey.includes('hoa')) elem = 'Hoa';
            else if (elKey.includes('earth') || elKey.includes('thổ') || elKey.includes('tho')) elem = 'Tho';
            else elem = 'Kim';
        }

        const hasForgedArtifact = Boolean(
            (Array.isArray(s.inventory) && s.inventory.some(i => i.equipped && (i.type === 'Pháp Bảo' || i.type === 'weapon' || i.slot === 'weapon' || i.slot === 'armor' || i.forged))) ||
            (s.equipped && Object.values(s.equipped).some(val => Boolean(val)))
        );

        const maxHp = Math.max(1, finite(effStats.maxHp ?? effStats.hp ?? s.maxHp, 500));
        const atk = Math.max(1, finite(effStats.atk ?? s.atk, 28));
        const def = Math.max(0, finite(effStats.def ?? s.def, 14));
        const crit = Math.min(100, finite(effStats.crit ?? s.crit, 10));
        const eva = Math.min(100, finite(effStats.dodge ?? s.dodge, 5));
        const cp = finite(effStats.combatPower ?? effStats.cp ?? s.combatPower ?? window.GameState?.ChienLuc, Math.round(atk * 2 + def * 1.5 + maxHp * 0.1));

        const sfBonus = effStats.swordFormation || (typeof window.getSwordFormationBonus === 'function' ? window.getSwordFormationBonus(s) : { level: 0, towerOpeningDmgPercent: 0 });
        return {
            characterName: s.player?.name || s.playerName || s.characterName || s.name || "Tiêu Dao Tử",
            playerName: s.player?.name || s.playerName || s.characterName || s.name || "Tiêu Dao Tử",
            realmName: realmDisplay,
            linhThach: Number(s.stones ?? window.GameState?.LinhThach ?? window.GameState?.stones ?? 0) || 0,
            tuVi: Number(s.exp ?? window.GameState?.TuVi ?? window.GameState?.exp ?? 0) || 0,
            highestCleared: highestCleared,
            selectedFloor: selectedFloor,
            selectedTier: selectedTier,
            hero: {
                name: s.player?.name || s.playerName || s.characterName || s.name || 'Tiêu Dao Tử',
                realmIndex: Math.max(0, Math.floor(finite(s.realmIndex))),
                tier: currentRealm.realmTier || (Number.isFinite(currentRealm.majorIndex) ? currentRealm.majorIndex + 1 : effStats.tier || 1),
                maxHp: maxHp,
                hp: maxHp,
                mp: 0,
                maxMp: 100, // Kiếm Nguyên is a combat gauge, not the player's MP pool.
                atk: atk,
                def: def,
                crit: crit,
                critDmg: 1.5 + finite(effStats.critDamageBonus),
                lifesteal: finite(effStats.lifesteal ?? s.towerLifesteal ?? s.alignmentBuffs?.lifestealPercent),
                eva: eva,
                cp: cp,
                armorPen: finite(effStats.armorPen ?? s.armorPen),
                critResist: finite(effStats.critResist ?? s.critResist),
                element: elem,
                hasForgedArtifact: hasForgedArtifact,
                swordFormationLevel: Number(sfBonus.level) || 0,
                swordFormationOpeningPct: Number(sfBonus.towerOpeningDmgPercent) || 0,
                swordCount: Number(savedTower.swordCount) || Math.min(36, Math.max(6, 6 + Math.floor((s.realmIndex || 0) * 1.5)))
            },
            activeManualId: savedTower.activeManualId || "thanh_lien_kiem_dien",
            selectedUltId: savedTower.selectedUltId ?? 2,
            capturedSouls: Array.isArray(savedTower.capturedSouls) ? savedTower.capturedSouls : [],
            lootBag: Array.isArray(savedTower.lootBag) ? savedTower.lootBag : [],
            activeGuardian: savedTower.activeGuardian || null
        };
    }

    function sendTowerSyncData() {
        const iframe = document.getElementById('tran-yeu-thap-iframe') || towerV4Frame;
        if (!iframe || !iframe.contentWindow) return;
        const payload = getTowerSyncPayload();
        try {
            iframe.contentWindow.postMessage({
                type: 'van-thien-luc:tower-init-data',
                data: payload
            }, '*');
        } catch (e) {
            console.warn('[DemonTower] sendTowerSyncData error:', e);
        }
    }

    function handleTowerSyncMessage(payload) {
        if (!payload) return;
        const s = window.state || window.GameState?._rawState || window.GameState;
        if (!s) return;

        // Trọng Thương khi thua tháp
        if (payload.isInjured) {
            s.isInjured = true;
            const maxCap = Math.max(2, Number(s.maxHp) || 100);
            if (Number(s.hp ?? maxCap) >= maxCap) {
                s.hp = Math.max(1, Math.floor(maxCap * 0.2));
            }
            if (window.state && window.state !== s) {
                window.state.isInjured = true;
                window.state.hp = s.hp;
            }
            if (window.GameState && window.GameState !== s) {
                window.GameState.isInjured = true;
                window.GameState.hp = s.hp;
            }
            if (typeof window.updateHUD === 'function') window.updateHUD();
            if (typeof window.showGameToast === 'function') {
                window.showGameToast('⚠️ Thua trận Trấn Yêu Tháp! Rơi vào trạng thái Trọng Thương (-70% Tụ Khí)! Hãy Vận Công Điều Tức!', 'error');
            } else if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast('⚠️ Thua trận Trấn Yêu Tháp! Rơi vào trạng thái Trọng Thương (-70% Tụ Khí)! Hãy Vận Công Điều Tức!', 'danger');
            }
        }

        // 1. Linh Thạch
        if (payload.linhThachGained && payload.linhThachGained > 0) {
            if (typeof window.addSpiritStones === 'function') {
                window.addSpiritStones(payload.linhThachGained);
            } else {
                s.stones = (Number(s.stones) || 0) + payload.linhThachGained;
                if (window.state && window.state !== s) window.state.stones = s.stones;
            }
        } else if (payload.linhThachCost && payload.linhThachCost > 0) {
            s.stones = Math.max(0, (Number(s.stones) || 0) - payload.linhThachCost);
            if (window.state && window.state !== s) window.state.stones = s.stones;
        }

        // 2. Tu Vi
        if (payload.tuViGained && payload.tuViGained > 0) {
            if (typeof window.addExp === 'function') {
                window.addExp(payload.tuViGained);
            } else {
                s.exp = (Number(s.exp) || 0) + payload.tuViGained;
                if (window.state && window.state !== s) window.state.exp = s.exp;
            }
        }

        // 3. Tiến trình Tầng Tháp
        if (payload.floor) {
            const nextFloor = payload.floor + 1;
            s.towerFloor = Math.max(Number(s.towerFloor) || 1, nextFloor);
            if (payload.floor >= 50) {
                s.hasClearedTower50 = true;
            }
            if (window.state && window.state !== s) {
                window.state.towerFloor = s.towerFloor;
                window.state.hasClearedTower50 = s.hasClearedTower50;
            }
        }
        if (payload.highestCleared !== undefined) {
            s.towerFloor = Math.max(Number(s.towerFloor) || 1, payload.highestCleared + 1);
            if (payload.highestCleared >= 50) {
                s.hasClearedTower50 = true;
            }
            if (window.state && window.state !== s) {
                window.state.towerFloor = s.towerFloor;
                window.state.hasClearedTower50 = s.hasClearedTower50;
            }
        }

        // 4. Lưu dữ liệu tháp độc lập vào state.demonTower
        if (!s.demonTower || typeof s.demonTower !== 'object') s.demonTower = {};
        if (payload.highestCleared !== undefined) s.demonTower.highestCleared = payload.highestCleared;
        if (payload.selectedFloor !== undefined) s.demonTower.selectedFloor = payload.selectedFloor;
        if (payload.selectedTier !== undefined) s.demonTower.selectedTier = payload.selectedTier;
        if (payload.swordCount !== undefined) s.demonTower.swordCount = payload.swordCount;
        if (payload.capturedSouls) s.demonTower.capturedSouls = payload.capturedSouls;
        if (payload.lootBag) s.demonTower.lootBag = payload.lootBag;
        if (payload.activeManualId) s.demonTower.activeManualId = payload.activeManualId;
        if (payload.selectedUltId !== undefined) s.demonTower.selectedUltId = payload.selectedUltId;
        if (payload.activeGuardian !== undefined) s.demonTower.activeGuardian = payload.activeGuardian;
        if (window.state && window.state !== s) window.state.demonTower = s.demonTower;

        // 5. Thêm vật phẩm rơi vào Túi đồ chính của nhân vật
        if (payload.droppedItem && payload.droppedItem.name) {
            const drop = payload.droppedItem;
            const itemObj = {
                id: drop.id || `tower_item_${Date.now()}`,
                name: drop.name,
                icon: drop.icon || '🎁',
                type: drop.type || 'Đạo Cụ Trấn Yêu',
                quality: drop.rarity === 'Tien' ? 'legendary' : (drop.rarity === 'Thien' ? 'epic' : 'rare'),
                desc: drop.desc || 'Chiến lợi phẩm đoạt được từ Trấn Yêu Tháp',
                quantity: 1,
                count: 1
            };
            if (typeof window.addItemToInventory === 'function') {
                window.addItemToInventory(itemObj, 1);
            } else {
                if (!Array.isArray(s.inventory)) s.inventory = [];
                const existing = s.inventory.find(i => i.id === drop.id || i.name === drop.name);
                if (existing) {
                    existing.quantity = (Number(existing.quantity || existing.count) || 1) + 1;
                    existing.count = existing.quantity;
                } else {
                    s.inventory.push(itemObj);
                }
                if (window.state && window.state !== s && Array.isArray(window.state.inventory)) {
                    const ex2 = window.state.inventory.find(i => i.id === drop.id || i.name === drop.name);
                    if (ex2) {
                        ex2.quantity = (Number(ex2.quantity || ex2.count) || 1) + 1;
                        ex2.count = ex2.quantity;
                    } else {
                        window.state.inventory.push(itemObj);
                    }
                }
            }
        }

        // 6. Ghi nhật ký vào Thiên Cơ Nhật Ký
        if (payload.action === 'victory') {
            if (typeof window.addLog === 'function') {
                const dropTxt = payload.droppedItem ? ` & nhặt được [${payload.droppedItem.name}]` : '';
                window.addLog(`🗼 <span class="text-rose-400 font-bold">[Trấn Yêu Tháp]</span> Trảm diệt Yêu Ma tầng ${payload.floor}! Thu hoạch +${Number(payload.linhThachGained || 0).toLocaleString()} Linh Thạch, +${Number(payload.tuViGained || 0).toLocaleString()} Tu Vi${dropTxt}.`, 'text-rose-400');
            }
        } else if (payload.action === 'sweep') {
            if (typeof window.addLog === 'function') {
                window.addLog(`⚡ <span class="text-amber-300 font-bold">[Trấn Yêu Càn Quét]</span> Càn quét tầng ${payload.floor}! Thu về +${Number(payload.linhThachGained || 0).toLocaleString()} Linh Thạch, +${Number(payload.tuViGained || 0).toLocaleString()} Tu Vi.`, 'text-amber-300');
            }
        }

        // 7. Đồng bộ HUD và lưu save chính
        if (window.GameState && typeof window.GameState.syncFromState === 'function') {
            window.GameState.syncFromState(s);
        }
        if (typeof window.forceSaveNow === 'function') window.forceSaveNow();
        if (typeof window.saveGame === 'function') window.saveGame();
        else if (typeof window.saveGameState === 'function') window.saveGameState();
        if (typeof window.syncAllUI === 'function') window.syncAllUI();
        else {
            if (typeof window.updateHUD === 'function') window.updateHUD();
            if (typeof window.updateUI === 'function') window.updateUI();
        }

        // 8. Nếu là lệnh đóng tháp
        if (payload.action === 'close') {
            if (typeof window.closeDemonTowerModal === 'function') window.closeDemonTowerModal();
            else closeDemonTowerModal();
        }
    }

    window.addEventListener('message', (event) => {
        if (!event.data || typeof event.data !== 'object') return;
        const iframe = document.getElementById('tran-yeu-thap-iframe');
        if (event.source !== iframe?.contentWindow && event.source !== towerV4Frame?.contentWindow && window.parent !== window) return;
        if (event.data.type === 'van-thien-luc:tower-close') {
            closeDemonTowerModal();
        } else if (event.data.type === 'van-thien-luc:tower-ready') {
            sendTowerSyncData();
        } else if (event.data.type === 'van-thien-luc:tower-sync') {
            handleTowerSyncMessage(event.data.payload);
        } else if (event.data.type === 'van-thien-luc:custom-battle-result') {
            if (typeof window.handleCustomBattleOutcome === 'function') {
                window.handleCustomBattleOutcome(event.data.result, event.data.battle);
            }
        }
    });

    function openDemonTowerModal() {
        const s = window.GameState || window.state || (typeof state !== 'undefined' ? state : null);
        if (s && typeof window.reconcileHeavyInjuryState === 'function') {
            window.reconcileHeavyInjuryState(s, { save: true, updateUi: true });
        }
        const stillInjured = s && (typeof window.isHeavyInjuryActive === 'function'
            ? window.isHeavyInjuryActive(s)
            : (s.isInjured || (s.heavyInjuryUntil && Date.now() < s.heavyInjuryUntil)));
        if (stillInjured) {
            if (typeof window.showXianxiaToast === 'function') {
                window.showXianxiaToast('⚠️ Kinh mạch đang bị Trọng Thương! Cần Vận Công Điều Tức (15s) hoặc dùng Hồi Huyết Đan/Hộ Tâm Đan trước khi vào Trấn Yêu Tháp!', 'danger');
            } else if (typeof window.addLog === 'function') {
                window.addLog('⚠️ <span class="text-rose-400 font-bold">[Trọng Thương Bế Tắc]</span> Ngươi đang bị Trọng Thương, không thể vào Trấn Yêu Tháp!', 'text-rose-400');
            }
            return;
        }

        if (typeof closeAllDropups === 'function') closeAllDropups();
        if (typeof closeAllFeaturePopups === 'function') closeAllFeaturePopups();
        if (typeof closeAllModals === 'function') closeAllModals();
        if (typeof window.hideMainScreenHUD === 'function') window.hideMainScreenHUD();

        const modal = document.getElementById('modal-tran-yeu-thap');
        if (modal) {
            modal.style.setProperty('display', 'flex', 'important');
            modal.style.setProperty('pointer-events', 'auto', 'important');
            modal.style.setProperty('z-index', '9800', 'important');
            modal.classList.remove('hidden');
            modal.classList.add('active');
        }
        sendTowerSyncData();
        const iframe = document.getElementById('tran-yeu-thap-iframe');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({ type: 'van-thien-luc:tower-resume' }, '*');
            } catch (e) {}
        }
    }

    function closeDemonTowerModal() {
        if (battleTimer) {
            clearInterval(battleTimer);
            battleTimer = null;
        }
        if (window.battleTimer) {
            clearInterval(window.battleTimer);
            window.battleTimer = null;
        }
        isCombatActive = false;

        const iframe = document.getElementById('tran-yeu-thap-iframe');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({ type: 'van-thien-luc:tower-pause' }, '*');
            } catch (e) {}
        }

        towerV4Frame?.remove();
        towerV4Frame = null;
        document.body.classList.remove('tower-v4-active');
        const el = document.getElementById('modal-tran-yeu-thap');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.classList.add('hidden');
            el.classList.remove('active');
        }
        const btn = document.getElementById('btn-challenge');
        if (btn) btn.disabled = false;
        const btnLabel = document.getElementById('btn-challenge-label');
        if (btnLabel) btnLabel.textContent = `KHIÊU CHIẾN TẦNG ${towerCurrentFloor}`;
        if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
    }

    function handleChallengeClick() {
        if (!isCombatActive) {
            syncTowerPlayerStats();
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
        bossFighter.isEnraged = false;
        bossFighter.shieldTurns = 0;
        bossFighter.hasShieldUsed = false;
        if (bossFighter.baseAtk) bossFighter.atk = bossFighter.baseAtk;
        playerFighter.mp = 0;
        updateHPDisplays();

        const scrollBox = document.getElementById('combat-log-scroll');
        if (scrollBox) scrollBox.innerHTML = '';
        const elemRel = getElementRelation(playerFighter.element, bossFighter.element);
        appendLog(`⚔️ <b>Trận chiến Tầng ${bossFighter.floor} khai hỏa!</b> <span class="text-amber-300 font-bold">[${playerFighter.element || 'Kim'} vs ${bossFighter.element || 'Mộc'}: ${elemRel.label}]</span>`, 'log-entry--round');

        let turn = 1;
        const maxTurns = 50;

        // Triệt tiêu giật lag: Đảm bảo DUY NHẤT 1 battleTimer chạy, luôn clearInterval trước khi tạo mới
        if (battleTimer) {
            clearInterval(battleTimer);
            battleTimer = null;
        }
        if (window.battleTimer) {
            clearInterval(window.battleTimer);
            window.battleTimer = null;
        }
        battleTimer = setInterval(() => {
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
        // Tự động tích lũy tiến độ Nhiệm Vụ Tông Môn (Trảm Yêu Trừ Ma)
        if (isPlayer && typeof window.progressSectQuest === 'function') {
            window.progressSectQuest('tower', 10);
        }

        // 1. Kiểm tra Choáng (Stun)
        if (attacker.isStunned) {
            attacker.isStunned = false;
            appendLog(`⚡ [Choáng] <b>${attacker.name}</b> bị lôi chấn choáng váng, không thể ra chiêu hiệp này!`, 'log-entry--stun text-amber-400');
            triggerFloatingDamage('CHOÁNG!', 'damage-number-pop--stun', isPlayer ? 'player' : 'boss');
            return;
        }

        // 2. Check Né Tránh
        if (Math.random() < defender.dodgeRate) {
            appendLog(`💨 [Né Tránh] ${defender.name} nhanh như chớp né tránh công kích!`, 'log-entry--dodge');
            triggerFloatingDamage('Né Tránh!', 'damage-number-pop--dodge', isPlayer ? 'boss' : 'player');
            triggerSpriteDodge(isPlayer ? 'boss' : 'player');
            return;
        }

        // 3. Check Linh Lực & Vũ Kỹ
        let skillMultiplier = 1.0;
        let isSkillTriggered = false;
        let didStun = false;

        if (isPlayer) {
            // Tích lũy linh lực mỗi đòn đánh thường (+34 MP)
            attacker.mp = Math.min(100, (Number(attacker.mp) || 0) + 34);
            if (attacker.mp >= 100) {
                isSkillTriggered = true;
                attacker.mp = 0; // Đầy thanh xả toàn bộ
                const skillName = attacker.equippedSkill?.name || 'Vạn Kiếm Quy Tông';
                skillMultiplier = Number(attacker.equippedSkill?.damageMultiplier) || 2.8;
                appendLog(`🔥 <b class="text-purple-400">[Võ Kỹ Khai Thiên]</b> ${attacker.name} linh lực bùng nổ, thi triển <b>[${skillName}]</b>!`, 'log-entry--skill');
                triggerFloatingDamage(`Võ Kỹ: ${skillName}!`, 'damage-number-pop--skill', 'boss');

                if (attacker.equippedSkill?.stunChance && Math.random() < attacker.equippedSkill.stunChance) {
                    defender.isStunned = true;
                    didStun = true;
                }
            }
        }

        // 4. Tính toán Ngũ Hành Tương Khắc (+25% hoặc -15%)
        const elemRel = getElementRelation(attacker.element, defender.element);
        const elemMultiplier = elemRel.factor;

        // 5. Boss Cơ Chế Đặc Biệt: Hộ Thuẫn (Elite) & Cuồng Bạo (Overlord)
        let shieldMultiplier = 1.0;
        if (defender.isElite && !defender.hasShieldUsed && defender.hp <= (defender.maxHp * 0.5)) {
            defender.hasShieldUsed = true;
            defender.shieldTurns = 2;
            appendLog(`🛡️ <b class="text-sky-300 font-bold">[Huyền Vũ Hộ Thuẫn]</b> Tinh Anh yêu thú ngưng kết chân nguyên, giảm 50% sát thương nhận vào trong 2 hiệp!`, 'log-entry--skill text-sky-400 font-bold');
            triggerFloatingDamage(`HUYỀN VŨ HỘ THUẪN!`, 'damage-number-pop--shield', 'boss');
        }

        if (defender.shieldTurns > 0) {
            shieldMultiplier = 0.5;
            defender.shieldTurns--;
            appendLog(`🛡️ [Hộ Thuẫn Cương Khí] Cương khí cản phá 50% sát thương! (Còn ${defender.shieldTurns} hiệp)`, 'log-entry--dodge text-sky-300');
            triggerFloatingDamage(`-50% Sát Thương`, 'damage-number-pop--shield', isPlayer ? 'boss' : 'player');
        }

        if (!isPlayer && attacker.isOverlord && !attacker.isEnraged && attacker.hp <= (attacker.maxHp * 0.3)) {
            attacker.isEnraged = true;
            attacker.atk = Math.round(attacker.atk * 1.5);
            appendLog(`🩸 <b class="text-rose-500 font-black animate-pulse">[Cuồng Bạo Huyết Ma]</b> Ma Hoàng HP dưới 30%, bùng phát ma hỏa tăng 50% Công kích!`, 'log-entry--crit text-rose-400 font-bold');
            triggerFloatingDamage(`CUỒNG BẠO +50% CÔNG!`, 'damage-number-pop--crit', 'boss');
        }

        // 6. Tính toán Sát Thương Cuối Cùng
        const rawDmg = Math.max(120, (attacker.atk - defender.def));
        const isCrit = Math.random() < attacker.critRate;
        const critMultiplier = isCrit ? attacker.critMultiplier : 1.0;
        const finalDmg = Math.max(1, Math.round(rawDmg * skillMultiplier * elemMultiplier * shieldMultiplier * critMultiplier));

        // Trừ HP & Cập nhật thanh máu động
        defender.hp = Math.max(0, defender.hp - finalDmg);

        // Hồi máu hút máu nếu có (từ Công Pháp hoặc Thiên Ma Sát Ý +8%)
        const totalLifestealPct = (isPlayer && isSkillTriggered && attacker.equippedSkill?.lifestealPercent ? Number(attacker.equippedSkill.lifestealPercent) : 0)
            + (isPlayer ? Number((window.GameState || window.state)?.towerLifesteal || (window.GameState || window.state)?.alignmentBuffs?.lifestealPercent || 0) : 0);
        if (isPlayer && finalDmg > 0 && totalLifestealPct > 0) {
            const lifestealHp = Math.max(1, Math.round(finalDmg * totalLifestealPct));
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + lifestealHp);
            appendLog(`🩸 [Hút Máu] Huyết quang lượn quanh, hút <b>+${lifestealHp.toLocaleString()} HP</b> hồi phục chân thân!`, 'log-entry--heal text-emerald-400');
            triggerFloatingDamage(`+${lifestealHp.toLocaleString()} HP`, 'damage-number-pop--heal', 'player');
        }

        if (didStun) {
            appendLog(`⚡ [Lôi Định] Kích phát thần lôi, <b>${defender.name}</b> rơi vào trạng thái CHOÁNG hiệp sau!`, 'log-entry--stun text-amber-300');
        }

        updateHPDisplays();

        // Hiệu ứng Sprite chớp đỏ mờ, rung nhẹ & kiếm khí vệt chém
        triggerSpriteHurt(isPlayer ? 'boss' : 'player', isCrit);

        // Floating Damage Number với màu phân biệt chuẩn thị giác
        if (isCrit) {
            triggerFloatingDamage(`⚡ BẠO KÍCH! -${finalDmg.toLocaleString()}`, 'damage-number-pop--crit', isPlayer ? 'boss' : 'player');
            appendLog(`💥 [Bạo Kích] ${attacker.name} đánh trúng tử huyệt, bạo kích <b>${finalDmg.toLocaleString()}</b> sát thương!`, 'log-entry--crit');
        } else if (isSkillTriggered) {
            triggerFloatingDamage(`-${finalDmg.toLocaleString()}`, 'damage-number-pop--skill', isPlayer ? 'boss' : 'player');
            appendLog(`⚔️ ${attacker.name} tung chiêu uy lực, trảm <b>${finalDmg.toLocaleString()}</b> sát thương.`, isPlayer ? 'log-entry--player' : 'log-entry--boss');
        } else {
            triggerFloatingDamage(`-${finalDmg.toLocaleString()}`, 'damage-number-pop--normal', isPlayer ? 'boss' : 'player');
            appendLog(`⚔️ ${attacker.name} đánh ra một kích, gây <b>${finalDmg.toLocaleString()}</b> sát thương.`, isPlayer ? 'log-entry--player' : 'log-entry--boss');
        }
    }

    function finishCombat(playerObj, bossObj) {
        if (battleTimer) {
            clearInterval(battleTimer);
            battleTimer = null;
        }
        if (window.battleTimer) {
            clearInterval(window.battleTimer);
            window.battleTimer = null;
        }
        isCombatActive = false;
        const btnChallenge = document.getElementById('btn-challenge');
        if (btnChallenge) btnChallenge.disabled = false;
        const label = document.getElementById('btn-challenge-label');
        if (label) label.textContent = `KHIÊU CHIẾN TẦNG ${towerCurrentFloor}`;

        if (bossObj.hp <= 0) {
            // CHIẾN THẮNG
            const s = window.GameState || window.state;
            const rewardStones = Number(bossObj.rewardStones || (bossObj.floor * 35));
            const rewardTuvi = Number(bossObj.rewardTuvi || (bossObj.floor * 80));
            const rewardJade = Number(bossObj.rewardJade || Math.max(2, Math.floor(bossObj.floor / 2)));

            if (s) {
                s.spiritStones = (Number(s.spiritStones || s.stones) || 0) + rewardStones;
                s.stones = s.spiritStones;
                s.immortalJade = (Number(s.immortalJade) || 0) + rewardJade;
                if (typeof window.addExp === 'function') {
                    window.addExp(rewardTuvi);
                } else {
                    s.exp = (Number(s.exp) || 0) + rewardTuvi;
                }
                s.towerFloor = Math.max(Number(s.towerFloor) || 1, bossObj.floor + 1);
                towerCurrentFloor = s.towerFloor;
            } else {
                towerCurrentFloor++;
            }

            towerPlayer.stones = s ? (s.spiritStones || s.stones) : (towerPlayer.stones + rewardStones);
            towerPlayer.tuvi = s ? s.exp : (towerPlayer.tuvi + rewardTuvi);

            // Cập nhật ngay các badge tài nguyên
            const stonesBadge = document.getElementById('player-stones-badge');
            if (stonesBadge) stonesBadge.textContent = Number(towerPlayer.stones).toLocaleString();
            const tuviBadge = document.getElementById('player-tuvi-badge');
            if (tuviBadge) tuviBadge.textContent = Number(towerPlayer.tuvi).toLocaleString();

            appendLog(`🎉 <b>CHIẾN THẮNG TẦNG ${bossObj.floor}!</b> Thu hoạch +${rewardStones.toLocaleString()} Linh Thạch, +${rewardJade} Tiên Ngọc, +${rewardTuvi.toLocaleString()} Tu Vi!`, 'log-entry--win');

            if (typeof window.addLog === 'function') {
                window.addLog(`🗼 <span class="text-rose-400 font-bold">[Trấn Yêu Tháp]</span> Trảm diệt <strong>${bossObj.name}</strong> Tầng ${bossObj.floor}! Thu hoạch +${rewardStones.toLocaleString()} Linh Thạch, +${rewardJade} Tiên Ngọc, +${rewardTuvi.toLocaleString()} Tu Vi. Đột phá Tầng ${towerCurrentFloor}!`, 'text-rose-400');
            }

            // GỌI HỆ THỐNG RƠI ĐỒ (LOOT TABLE)
            if (typeof window.rollLootDrop === 'function') {
                window.rollLootDrop('tower', bossObj.floor);
            }

            if (typeof window.saveGame === 'function') window.saveGame();
            else if (typeof window.saveGameState === 'function') window.saveGameState();
            if (typeof window.syncAllUI === 'function') window.syncAllUI();

            towerCurrentBoss = createFloorBoss(towerCurrentFloor);
            updateArenaUI();
            showXianxiaToast(`🎉 CHIẾN THẮNG TẦNG ${bossObj.floor}! Trảm sát yêu ma (+${rewardStones.toLocaleString()} Linh Thạch, +${rewardJade} Tiên Ngọc, +${rewardTuvi.toLocaleString()} Tu Vi). Tiến vào Tầng ${towerCurrentFloor}!`, 'success');
        } else {
            // THẤT BẠI
            appendLog(`🩸 <b>THẤT BẠI!</b> [${playerObj.name}] trọng thương, bị khí tức Trấn Yêu Tháp đẩy lùi!`, 'log-entry--lose');
            showXianxiaToast(`🩸 THẤT BẠI! Đạo hữu đã bị đánh trọng thương tháo chạy khỏi Trấn Yêu Tháp.`, 'error');
        }
    }

    function triggerAttackDash(target) {
        const img = document.getElementById(target === 'player' ? 'player-sprite-img' : 'boss-sprite-img');
        if (img) {
            const animClass = target === 'player' ? 'player-attack-dash' : 'boss-attack-dash';
            img.classList.add(animClass);
            setTimeout(() => img.classList.remove(animClass), 460);
        }
        if (typeof window.triggerRigCombatAnim === 'function') {
            window.triggerRigCombatAnim(target === 'player' ? '#player-model-rig' : '#boss-model-rig', 'lunge', target === 'boss');
        }
    }

    function spawnSlashArcTrail(target, isCrit) {
        const slot = document.getElementById(target === 'player' ? 'player-stage-slot' : 'boss-stage-slot');
        if (!slot) return;
        const angle = target === 'player' ? (25 + Math.random() * 20) : (-25 - Math.random() * 20);
        const slashSvg = document.createElement('div');
        slashSvg.className = 'slash-arc-trail';
        slashSvg.style.setProperty('--slash-angle', `${angle}deg`);
        const strokeColor = isCrit ? '#facc15' : '#38bdf8';
        const glowColor = isCrit ? '#ef4444' : '#0284c7';
        const gradId = `slashGrad-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        slashSvg.innerHTML = `
            <svg viewBox="0 0 240 240" fill="none" style="width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 12px ${glowColor});">
                <defs>
                    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${isCrit ? '#ef4444' : '#0ea5e9'}" stop-opacity="0" />
                        <stop offset="25%" stop-color="${strokeColor}" stop-opacity="0.9" />
                        <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
                        <stop offset="75%" stop-color="${strokeColor}" stop-opacity="0.9" />
                        <stop offset="100%" stop-color="${isCrit ? '#f59e0b' : '#38bdf8'}" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <!-- Vệt lưỡi liềm kiếm khí cong sắc bén chém ngang qua mục tiêu -->
                <path d="M 20,45 Q 120,130 220,185 Q 130,100 20,45 Z" fill="url(#${gradId})" />
                <path d="M 25,48 Q 120,125 215,182" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.95" />
            </svg>
        `;
        slot.appendChild(slashSvg);
        setTimeout(() => slashSvg.remove(), 280);
    }

    function triggerSpriteHurt(target, isCrit = false) {
        const img = document.getElementById(target === 'player' ? 'player-sprite-img' : 'boss-sprite-img');
        const slot = document.getElementById(target === 'player' ? 'player-stage-slot' : 'boss-stage-slot');
        if (img) {
            img.classList.add('sprite-hurt-flash');
            setTimeout(() => img.classList.remove('sprite-hurt-flash'), 360);
        }
        if (slot) {
            const pushClass = target === 'player' ? 'target-pushback-player' : 'target-pushback-boss';
            slot.classList.add(pushClass);
            setTimeout(() => slot.classList.remove(pushClass), 380);
        }
        spawnSlashArcTrail(target, isCrit);

        if (isCrit) {
            // Rung khung sàn đấu (#arena-stage-box) 0.2s khi trúng đòn bạo kích
            const arenaStage = document.getElementById('arena-stage-box');
            if (arenaStage) {
                arenaStage.classList.remove('arena-crit-shake');
                void arenaStage.offsetWidth;
                arenaStage.classList.add('arena-crit-shake');
                setTimeout(() => arenaStage.classList.remove('arena-crit-shake'), 200);
            }

            // 60ms Hit-Stop tạo trọng lực va chạm
            const modal = document.getElementById('modal-tran-yeu-thap');
            if (modal) {
                modal.classList.add('tower-hit-stop');
                setTimeout(() => modal.classList.remove('tower-hit-stop'), 60);
            }
            if (typeof window.triggerCameraTrauma === 'function') {
                window.triggerCameraTrauma(0.5, 'modal-tran-yeu-thap');
            }
            if (window.soundSystem?.play) {
                window.soundSystem.play('break');
            }
        } else {
            if (window.soundSystem?.play) {
                window.soundSystem.play('hit');
            }
        }

        if (typeof window.triggerRigCombatAnim === 'function') {
            window.triggerRigCombatAnim(target === 'player' ? '#player-model-rig' : '#boss-model-rig', 'hit', target === 'boss');
        }
    }

    function triggerSpriteDodge(target) {
        if (typeof window.triggerRigCombatAnim === 'function') {
            window.triggerRigCombatAnim(target === 'player' ? '#player-model-rig' : '#boss-model-rig', 'dodge', target === 'boss');
        }
    }

    function triggerFloatingDamage(text, cssClass, target) {
        const anchor = document.getElementById(target === 'player' ? 'player-damage-anchor' : 'boss-damage-anchor');
        if (!anchor) return;

        // Giới hạn tối đa 3 số sát thương bay lên cùng lúc
        while (anchor.children.length >= 3 && anchor.firstChild) {
            anchor.removeChild(anchor.firstChild);
        }

        const pop = document.createElement('div');
        pop.className = `damage-number-pop ${cssClass}`;
        const randomDx = (Math.random() - 0.5) * 44;
        pop.style.setProperty('--dx', `${randomDx}px`);
        pop.textContent = text;
        anchor.appendChild(pop);

        // Tự động xóa thẻ DOM ngay sau 600ms bằng setTimeout
        setTimeout(() => {
            if (pop.parentNode === anchor) {
                anchor.removeChild(pop);
            }
        }, 600);
    }

    function appendLog(html, className) {
        const scroll = document.getElementById('combat-log-scroll');
        if (!scroll) return;
        const div = document.createElement('div');
        div.className = `log-entry ${className || ''}`;
        div.innerHTML = html;
        scroll.appendChild(div);

        // Giới hạn danh sách #combat-log-scroll tối đa 20 dòng gần nhất (tự động xóa dòng cũ nhất bằng removeChild)
        while (scroll.children.length > 20 && scroll.firstElementChild) {
            scroll.removeChild(scroll.firstElementChild);
        }
        scroll.scrollTop = scroll.scrollHeight;
    }

    function skipDemonTowerCombat() {
        if (!isCombatActive) return;
        if (battleTimer) {
            clearInterval(battleTimer);
            battleTimer = null;
        }
        if (window.battleTimer) {
            clearInterval(window.battleTimer);
            window.battleTimer = null;
        }
        appendLog(`⏩ <b>[Bỏ Qua Giao Tranh]</b> Vận chuyển chân nguyên, kết toán tốc chiến tức thì!`, 'log-entry--round text-amber-300 font-bold');
        let maxSimTurns = 60;
        while (maxSimTurns > 0 && towerPlayer.hp > 0 && towerCurrentBoss.hp > 0) {
            executeStrike(towerPlayer, towerCurrentBoss, true);
            if (towerCurrentBoss.hp <= 0) break;
            executeStrike(towerCurrentBoss, towerPlayer, false);
            if (towerPlayer.hp <= 0) break;
            maxSimTurns--;
        }
        updateHPDisplays();
        finishCombat(towerPlayer, towerCurrentBoss);
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

    function updateHPDisplays() {
        const pFill = document.getElementById('player-hp-fill');
        const pNum = document.getElementById('player-hp-num');
        if (pFill && pNum) {
            const pPct = Math.max(0, Math.min(100, Math.round((towerPlayer.hp / towerPlayer.maxHp) * 100)));
            pFill.style.width = `${pPct}%`;
            pNum.textContent = `${towerPlayer.hp.toLocaleString()} / ${towerPlayer.maxHp.toLocaleString()}`;
        }

        const pMpFill = document.getElementById('player-mp-fill');
        if (pMpFill) {
            const mpPct = Math.max(0, Math.min(100, Math.round(((towerPlayer.mp || 0) / (towerPlayer.maxMp || 100)) * 100)));
            pMpFill.style.width = `${mpPct}%`;
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

        const pNameEl = document.getElementById('player-fighter-name');
        if (pNameEl) {
            pNameEl.innerHTML = `${towerPlayer.name} <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300 font-serif">[Hệ ${towerPlayer.element || 'Kim'}]</span>`;
        }

        const bossTitle = document.getElementById('boss-title-name');
        if (bossTitle) {
            let rankBadge = '';
            if (towerCurrentBoss.isOverlord) {
                rankBadge = '<span class="px-1.5 py-0.5 mr-1 rounded text-[10px] font-extrabold bg-rose-950 border border-rose-500 text-rose-300 animate-pulse font-serif">👑 THỦ LĨNH</span>';
            } else if (towerCurrentBoss.isElite) {
                rankBadge = '<span class="px-1.5 py-0.5 mr-1 rounded text-[10px] font-bold bg-amber-950 border border-amber-500 text-amber-300 font-serif">⭐ TINH ANH</span>';
            }
            bossTitle.innerHTML = `<i class="fa-solid fa-skull mr-1 text-rose-400"></i>${rankBadge}${towerCurrentBoss.name} <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 font-serif">[Hệ ${towerCurrentBoss.element || 'Mộc'}]</span>`;
        }

        const skipBtn = document.getElementById('btn-skip-combat');
        if (skipBtn) {
            skipBtn.onclick = () => skipDemonTowerCombat();
        }

        const ratio = (towerPlayer.cp / towerCurrentBoss.cp).toFixed(1);
        const isQualified = towerPlayer.cp >= (towerCurrentBoss.cp * 3);
        const matchupInfo = document.getElementById('matchup-cp-info');
        if (matchupInfo) {
            const rel = getElementRelation(towerPlayer.element, towerCurrentBoss.element);
            matchupInfo.innerHTML = `Tỷ số Lực Chiến: <b>${ratio}x</b> (${isQualified ? 'Đè bẹp đối thủ' : 'Cần cẩn trọng'}) • <span class="${rel.factor > 1 ? 'text-amber-300 font-bold' : (rel.factor < 1 ? 'text-rose-400' : 'text-slate-400')}">${rel.label}</span>`;
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

        // Đồng bộ tiến hóa ngoại hình 5-layer Model Rig
        if (typeof window.getCultivatorVisualConfig === 'function') {
            const pConfig = window.getCultivatorVisualConfig(window.state?.realm || 'Luyện Khí', window.state?.gender);
            const pPedestal = document.getElementById('player-rig-pedestal');
            const pBackAura = document.getElementById('player-rig-back-aura');
            const pWeapon = document.getElementById('player-rig-weapon');
            if (pPedestal) pPedestal.innerHTML = pConfig.pedestalSvg || '';
            if (pBackAura) pBackAura.innerHTML = pConfig.backAuraSvg || '';
            if (pWeapon) pWeapon.innerHTML = pConfig.weaponSvg || '';
        }

        if (typeof window.getMonsterVisualConfig === 'function') {
            const bConfig = window.getMonsterVisualConfig(towerCurrentFloor, towerCurrentBoss?.name);
            const bPedestal = document.getElementById('boss-rig-pedestal');
            const bBackAura = document.getElementById('boss-rig-back-aura');
            const bWeapon = document.getElementById('boss-rig-weapon');
            if (bPedestal) bPedestal.innerHTML = bConfig.pedestalSvg || '';
            if (bBackAura) bBackAura.innerHTML = bConfig.backAuraSvg || '';
            if (bWeapon) bWeapon.innerHTML = bConfig.weaponSvg || '';
        }
    }

    function fullHealPlayer() {
        towerPlayer.hp = towerPlayer.maxHp;
        updateHPDisplays();
        appendLog(`💚 [Vận Công] ${towerPlayer.name} hấp thu thiên địa nguyên khí, hồi phục toàn bộ Khí Huyết!`, 'log-entry--round');
    }

    const demonTower = {
        get player() { return towerPlayer; },
        get currentBoss() { return towerCurrentBoss; },
        get floor() { return towerCurrentFloor; },
        set floor(v) { towerCurrentFloor = Math.max(1, Number(v) || 1); },
        startCombat: startTowerCombat,
        finishCombat: finishCombat,
        updateArenaUI: updateArenaUI,
        syncTowerPlayerStats: syncTowerPlayerStats,
        syncStats(stats) {
            syncTowerPlayerStats();
            updateArenaUI();
        }
    };
    window.demonTower = demonTower;
    globalThis.demonTower = demonTower;

    window.openDemonTowerModal = openDemonTowerModal;
    window.closeDemonTowerModal = closeDemonTowerModal;
    window.handleChallengeClick = handleChallengeClick;
    window.skipDemonTowerCombat = skipDemonTowerCombat;
    window.executeStrike = executeStrike;
    window.appendLog = appendLog;
    window.getElementRelation = getElementRelation;
    window.toggleAutoClimb = toggleAutoClimb;
    window.fullHealPlayer = fullHealPlayer;
    window.updateArenaUI = updateArenaUI;
    window.towerPlayer = towerPlayer;
    window.startTowerCombat = startTowerCombat;
    window.finishCombat = finishCombat;
    window.createFloorBoss = createFloorBoss;
    Object.defineProperty(window, 'towerCurrentBoss', {
        get() { return towerCurrentBoss; },
        set(v) { towerCurrentBoss = v; },
        configurable: true
    });
    Object.defineProperty(window, 'battleTimer', {
        get() { return battleTimer; },
        set(v) { battleTimer = v; },
        configurable: true
    });
    Object.defineProperty(globalThis, 'battleTimer', {
        get() { return battleTimer; },
        set(v) { battleTimer = v; },
        configurable: true
    });
    window.getTowerSyncPayload = getTowerSyncPayload;
    window.handleTowerSyncMessage = handleTowerSyncMessage;
    window.sendTowerSyncData = sendTowerSyncData;
    globalThis.sendTowerSyncData = sendTowerSyncData;
    globalThis.openDemonTowerModal = openDemonTowerModal;
    globalThis.closeDemonTowerModal = closeDemonTowerModal;
    globalThis.handleChallengeClick = handleChallengeClick;
    globalThis.skipDemonTowerCombat = skipDemonTowerCombat;
    globalThis.executeStrike = executeStrike;
    globalThis.appendLog = appendLog;
    globalThis.getElementRelation = getElementRelation;
    globalThis.toggleAutoClimb = toggleAutoClimb;
    globalThis.fullHealPlayer = fullHealPlayer;
    globalThis.updateArenaUI = updateArenaUI;
    globalThis.towerPlayer = towerPlayer;
    globalThis.startTowerCombat = startTowerCombat;
    globalThis.finishCombat = finishCombat;
    globalThis.createFloorBoss = createFloorBoss;
    globalThis.getTowerSyncPayload = getTowerSyncPayload;
    globalThis.handleTowerSyncMessage = handleTowerSyncMessage;
})();
