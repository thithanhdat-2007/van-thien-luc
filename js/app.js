// ==========================================
// FILE: js/app.js - Logic Vòng Lặp Tu Luyện, HUD, Drawer & Bí Cảnh
// ==========================================
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
if (typeof window !== 'undefined') window.state = state;
if (typeof syncGameState === 'function') syncGameState(state);
let activeDrawer = null;
let immersionMode = false;
let breakthroughBonusChance = 0;
let combatTimer = null;
let selectedDungeonIndex = 0;
let recentSystemLogs = [];

const LEGACY_PILLAR_KEYS = { metal: 'kim', wood: 'moc', water: 'thuy', fire: 'hoa', earth: 'tho' };
const FEATURE_BY_DRAWER = {
    cave: 'btn_dong_phu',
    skills: 'btn_linh_ngo',
    inventory: 'btn_tui_do',
    farm: 'btn_linh_dien',
    alchemy: 'btn_lo_dan',
    market: 'btn_phuong_thi',
    companion: 'btn_dao_lu',
    sect: 'btn_tong_mon'
};

function normalizeSpiritualRootState(target = state) {
    const fallback = DEFAULT_STATE.spiritualRoot;
    const savedRoot = target.spiritualRoot && typeof target.spiritualRoot === 'object' ? target.spiritualRoot : {};
    const oldPillars = target.fiveElements || {};
    const pillars = {};
    Object.entries(LEGACY_PILLAR_KEYS).forEach(([key, legacyKey]) => {
        const value = savedRoot.pillars?.[key] ?? oldPillars[legacyKey] ?? fallback.pillars[key];
        const level = Number(value);
        pillars[key] = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : fallback.pillars[key];
    });
    target.spiritualRoot = {
        ...fallback,
        ...savedRoot,
        id: SPIRITUAL_ROOTS[savedRoot.id] ? savedRoot.id : fallback.id,
        pillars,
        rareBranches: Object.fromEntries(Object.entries(RARE_LINH_CAN_BRANCHES).map(([key]) => {
            const saved = savedRoot.rareBranches?.[key] || {};
            return [key, { level: Math.max(0, Math.floor(Number(saved.level) || 0)), isUnlocked: Boolean(saved.isUnlocked) }];
        })),
        mutations: Object.fromEntries(Object.keys(LINH_CAN_MUTATIONS).map(key => [key, Boolean(savedRoot.mutations?.[key])]))
    };
    target.spiritualRoot.tier = SPIRITUAL_ROOTS[target.spiritualRoot.id].tier;
    target.fiveElements = Object.fromEntries(Object.entries(LEGACY_PILLAR_KEYS).map(([key, legacyKey]) => [legacyKey, pillars[key]]));
    const active = target.activeElement;
    target.activeElement = ELEMENTAL_PILLARS[active] || (RARE_LINH_CAN_BRANCHES[active] && target.spiritualRoot.rareBranches[active].isUnlocked)
        ? active : (Object.keys(LEGACY_PILLAR_KEYS).find(key => LEGACY_PILLAR_KEYS[key] === active) || 'metal');
}

function getPlayerAvatarUrl() {
    if (typeof state !== 'undefined') {
        const pUrl = state.player && state.player.avatar_url;
        if (pUrl && typeof pUrl === 'string' && pUrl.trim().length > 0 && !pUrl.startsWith('data:image/svg+xml') && !pUrl.includes('placeholder')) {
            return pUrl;
        }
        const aUrl = state.avatar_url;
        if (aUrl && typeof aUrl === 'string' && aUrl.trim().length > 0 && !aUrl.startsWith('data:image/svg+xml') && !aUrl.includes('placeholder')) {
            return aUrl;
        }
    }
    return './assets/images/image_11.png';
}
window.getPlayerAvatarUrl = getPlayerAvatarUrl;

function normalizeCharacterSystems(target = state) {
    target.timeScale = 1;
    target.linhKhi = Math.max(0, Number(target.linhKhi) || 0);
    target.physiqueId = PHYSIQUES[target.physiqueId] ? target.physiqueId : DEFAULT_STATE.physiqueId;
    target.aptitudeId = APTITUDES[target.aptitudeId] ? target.aptitudeId : DEFAULT_STATE.aptitudeId;
    target.auto = { ...DEFAULT_STATE.auto, ...(target.auto || {}) };
    target.lifespan = Math.max(0, Number.isFinite(Number(target.lifespan)) ? Number(target.lifespan) : DEFAULT_STATE.lifespan);
    target.ageYears = Math.max(0, Number.isFinite(Number(target.ageYears)) ? Number(target.ageYears) : DEFAULT_STATE.ageYears);
    target.lifespanBonus = Math.max(0, Number(target.lifespanBonus) || 0);
    target.lifespanPenalty = Math.max(0, Number(target.lifespanPenalty) || 0);
    target.isDead = Boolean(target.isDead);
    target.heavenlyPunishmentCount = Math.max(0, Math.floor(Number(target.heavenlyPunishmentCount) || 0));
    target.currentWorld = target.currentWorld || DEFAULT_STATE.currentWorld;
    target.statusEffect = target.statusEffect === 'thien_dao_bai_xich' ? HEAVENLY_REJECTION_RULES.statusEffect : (target.statusEffect || null);
    target.forcedAscensionTriggered = Boolean(target.forcedAscensionTriggered);
    const validDefaultAvatar = typeof DEFAULT_CULTIVATION_AVATAR !== 'undefined' ? DEFAULT_CULTIVATION_AVATAR : './assets/images/image_11.png';
    if (!target.player || typeof target.player !== 'object') {
        target.player = { name: "Tiêu Dao Tử", avatar_url: validDefaultAvatar };
    }
    if (!target.player.avatar_url || target.player.avatar_url.startsWith('data:image/svg+xml') || target.player.avatar_url.includes('placeholder')) {
        target.player.avatar_url = validDefaultAvatar;
    }
    if (!target.avatar_url || target.avatar_url.startsWith('data:image/svg+xml') || target.avatar_url.includes('placeholder')) {
        target.avatar_url = target.player.avatar_url;
    }
    delete target.cultivationSealed;
    delete target.heavenlyRejection;
    const savedCanCo = target.canCo && typeof target.canCo === 'object' ? target.canCo : {};
    target.canCo = {
        physiqueTraining: { ...DEFAULT_STATE.canCo.physiqueTraining, ...(savedCanCo.physiqueTraining || {}) },
        consciousness: { ...DEFAULT_STATE.canCo.consciousness, ...(savedCanCo.consciousness || {}) },
        destiny: { ...DEFAULT_STATE.canCo.destiny, ...(savedCanCo.destiny || {}) }
    };
    if (!Number.isFinite(Number(target.canCo.destiny.insight))) target.canCo.destiny.insight = Math.floor(Math.random() * 100) + 1;
    if (!Number.isFinite(Number(target.canCo.destiny.fortune))) target.canCo.destiny.fortune = Math.floor(Math.random() * 100) + 1;
    const titleState = target.daoFoundationTitles && typeof target.daoFoundationTitles === 'object'
        ? target.daoFoundationTitles
        : DEFAULT_STATE.daoFoundationTitles;
    const unlockedTitles = Array.isArray(titleState.unlockedTitles) ? [...new Set(titleState.unlockedTitles)] : ["vo_linh_can"];
    if (!unlockedTitles.includes("vo_linh_can")) unlockedTitles.unshift("vo_linh_can");
    if (!unlockedTitles.includes("nguy_linh_can")) unlockedTitles.push("nguy_linh_can");
    const activeTitle = unlockedTitles.includes(titleState.activeTitle) && DAO_FOUNDATION_TITLES[titleState.activeTitle]
        ? titleState.activeTitle
        : "nguy_linh_can";
    target.daoFoundationTitles = { unlockedTitles, activeTitle };
    target.expedition = {
        zoneId: target.expedition?.zoneId || null,
        startTime: Number(target.expedition?.startTime) || 0,
        duration: Number(target.expedition?.duration) || 0,
        autoRepeat: target.expedition?.autoRepeat ?? true,
        lastReward: target.expedition?.lastReward || null
    };
    target.towerFloor = Math.max(1, Math.floor(Number(target.towerFloor) || 1));
    target.hasClearedTower50 = Boolean(target.hasClearedTower50 || (target.towerFloor && target.towerFloor > 50));
    target.heavenlySuppressionTriggered = Boolean(target.heavenlySuppressionTriggered);
    target.inventory = Array.isArray(target.inventory) ? target.inventory : [];
    for (const item of DEFAULT_STATE.inventory) {
        if (!target.inventory.some(owned => owned.id === item.id)) target.inventory.push(structuredClone(item));
    }
    if (typeof ensureMarketState === 'function') ensureMarketState(target);
}

function isHeavenlySuppressed(target = state) {
    if (!target) return false;
    const currentWorld = target.currentWorld || 'M1 - Hạ Giới';
    const isHaGioi = currentWorld.includes('M1') || currentWorld.includes('Hạ Giới') || currentWorld === 'HaGioi';
    if (!isHaGioi) return false; // Đã phi thăng sang Linh Giới/Tiên Giới thì không bị áp chế

    const realm = (typeof REALMS !== 'undefined' && Array.isArray(REALMS)) ? REALMS[target.realmIndex] : null;
    if (!realm) return false;

    // Kích hoạt khi chạm Hóa Thần Kỳ - Trung Kỳ trở lên tại Hạ Giới
    if (realm.majorRealm === 'Hóa Thần') {
        const minor = realm.minorStage;
        return minor === 'Trung Kỳ' || minor === 'Hậu Kỳ' || minor === 'Viên Mãn' || (Number(realm.minorIndex) >= 1);
    }
    const tier = realm.tier || (typeof resolveRealmTier === 'function' ? resolveRealmTier(realm.majorRealm) : 1);
    return tier > 5;
}
window.isHeavenlySuppressed = isHeavenlySuppressed;

function isHeavenlyRejected(target = state) {
    return isHeavenlySuppressed(target);
}
window.isHeavenlyRejected = isHeavenlyRejected;

function checkHeavenlySuppression(player = state) {
    const isSuppressed = isHeavenlySuppressed(player);
    if (isSuppressed && !player.heavenlySuppressionTriggered) {
        player.heavenlySuppressionTriggered = true;
        if (typeof triggerHeavenlySuppressionAlert === 'function') {
            triggerHeavenlySuppressionAlert();
        }
    }
    if (typeof syncHeavenlySuppressionUI === 'function') {
        syncHeavenlySuppressionUI(isSuppressed);
    }
    return isSuppressed;
}
window.checkHeavenlySuppression = checkHeavenlySuppression;

function syncHeavenlySuppressionUI(isSuppressed = null) {
    const suppressed = (isSuppressed !== null) ? Boolean(isSuppressed) : isHeavenlySuppressed();
    const eyeBadge = document.getElementById('heavenly-dao-eye-badge');
    if (eyeBadge) {
        if (suppressed) {
            eyeBadge.classList.remove('hidden');
            eyeBadge.classList.add('flex');
            eyeBadge.style.display = 'flex';
        } else {
            eyeBadge.classList.add('hidden');
            eyeBadge.classList.remove('flex');
            eyeBadge.style.display = 'none';
        }
    }
}
window.syncHeavenlySuppressionUI = syncHeavenlySuppressionUI;

function syncHeavenlyRejection() {
    const shouldReject = isHeavenlySuppressed();
    if (shouldReject) {
        state.statusEffect = "thien_dao_ap_che";
    } else {
        state.statusEffect = null;
    }
    syncHeavenlySuppressionUI(shouldReject);
}

function getRootConfig() {
    return SPIRITUAL_ROOTS[state.spiritualRoot?.id] || SPIRITUAL_ROOTS.mortal_mixed;
}

function getRootTier() {
    return SPIRITUAL_ROOT_TIERS[getRootConfig().tier] || SPIRITUAL_ROOT_TIERS.mortal;
}

function getActiveFoundationTitle(target = state) {
    return DAO_FOUNDATION_TITLES[target.daoFoundationTitles?.activeTitle] || DAO_FOUNDATION_TITLES.nguy_linh_can;
}

function getActiveFoundationEffects(target = state) {
    const baseEffects = getActiveFoundationTitle(target).effects || {};
    const hasAwakened = target.spiritualRoot?.mutations && Object.values(target.spiritualRoot.mutations).some(Boolean);
    if (hasAwakened) {
        return {
            ...baseEffects,
            cultivationSpeedMultiplier: Math.max(baseEffects.cultivationSpeedMultiplier || 1, 3)
        };
    }
    return baseEffects;
}

function getPhysique() {
    return PHYSIQUES[state.physiqueId] || PHYSIQUES.mortal;
}

function getAptitude() {
    return APTITUDES[state.aptitudeId] || APTITUDES.balanced;
}

function getPillarLevel(key) {
    return state.spiritualRoot?.pillars?.[key] ?? DEFAULT_STATE.spiritualRoot.pillars[key] ?? 0;
}

function evaluateLinhCanTitle(levels) {
    const values = Array.from({ length: 5 }, (_, index) => Math.max(0, Math.floor(Number(levels?.[index]) || 0)));
    if (values.every(level => level === 1)) {
        return { name: 'Ngụy Linh Căn', quality: 'Phàm Giai', color: 'text-gray-400' };
    }
    if (values.every(level => level >= 100)) {
        return { name: 'Ngũ Hành Hỗn Nguyên Căn', quality: 'Tuyệt Phẩm', color: 'text-yellow-400' };
    }
    const heavenIndex = values.findIndex((level, index) => level >= 50 && values.every((other, otherIndex) => otherIndex === index || other <= 5));
    if (heavenIndex !== -1) {
        const elements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
        return { name: `Thiên ${elements[heavenIndex]} Linh Căn`, quality: 'Thiên Phẩm', color: 'text-red-500' };
    }
    const strongElements = values.filter(level => level >= 10).length;
    if (strongElements >= 2 && strongElements <= 3) {
        return { name: 'Chân Linh Căn', quality: 'Chân Phẩm', color: 'text-blue-400' };
    }
    if (values.every(level => level === 0)) {
        return { name: 'Vô Linh Căn', quality: 'Phế Phẩm', color: 'text-gray-600' };
    }
    return { name: 'Tạp Linh Căn', quality: 'Tạp Phẩm', color: 'text-gray-400' };
}

function updateLinhCanTitle(levels = Object.keys(ELEMENTAL_PILLARS).map(getPillarLevel)) {
    const baseTitle = evaluateLinhCanTitle(levels);
    const activeKey = state.activeElement;
    const rare = RARE_LINH_CAN_BRANCHES[activeKey];
    const activeLevel = rare ? state.spiritualRoot.rareBranches[activeKey]?.level || 0 : getPillarLevel(activeKey);
    const stage = getLingCanStage(activeLevel);
    const mutation = state.spiritualRoot.mutations?.[activeKey] && LINH_CAN_MUTATIONS[activeKey];
    const result = { name: mutation?.name || (rare ? rare.name : baseTitle.name), quality: stage.name, color: stage.color };
    const name = document.getElementById('linh-can-title');
    const badge = document.getElementById('linh-can-quality');
    if (name) name.textContent = result.name;
    if (badge) {
        badge.textContent = result.quality;
        badge.style.color = result.color === 'rainbow' ? '#facc15' : result.color;
        badge.classList.toggle('is-rainbow', result.color === 'rainbow');
        badge.dataset.quality = result.quality;
    }
    return result;
}
window.updateLinhCanTitle = updateLinhCanTitle;

function getResonance() {
    const minLevel = Math.min(...Object.keys(ELEMENTAL_PILLARS).map(getPillarLevel));
    const level = Math.floor(minLevel / ELEMENTAL_RESONANCE.step);
    const bonus = Number((level * ELEMENTAL_RESONANCE.bonusPerStep).toFixed(4));
    return {
        minLevel,
        level,
        bonus,
        label: level ? `Cấp ${level} (+${Math.round(bonus * 100)}% Toàn Thuộc Tính)` : "Chưa kích hoạt"
    };
}

function getPillarEfficiency(key) {
    const root = getRootConfig();
    return root.tier === 'heaven' && root.element === key ? 1.3 : 1;
}

function getEffectiveStats() {
    const resonanceMult = 1 + getResonance().bonus;
    const mutations = state.spiritualRoot?.mutations || {};
    const chaosMult = getRootConfig().tier === 'chaos' ? 1.5 : 1;
    const thunderAttackMult = getRootConfig().id === 'mutant_thunder' ? 1.35 : 1;
    const metal = getPillarLevel('metal') * getPillarEfficiency('metal');
    const wood = getPillarLevel('wood') * getPillarEfficiency('wood');
    const water = getPillarLevel('water') * getPillarEfficiency('water');
    const fire = getPillarLevel('fire') * getPillarEfficiency('fire');
    const earth = getPillarLevel('earth') * getPillarEfficiency('earth');

    const currentRealm = REALMS[state.realmIndex] || REALMS[0];
    const realmTier = currentRealm?.tier || Math.min(5, Math.floor((state.realmIndex || 0) / 4) + 1);
    const tierMultiplier = currentRealm?.tierMultiplier || Math.pow(10, realmTier - 1);

    // Đảm bảo chỉ số cơ bản tách bạch từ Base Stats của Cảnh Giới
    const baseAtk = Number(state.baseAtk) || Number(currentRealm?.baseAtk) || 28;
    const baseDef = Number(state.baseDef) || Number(currentRealm?.baseDef) || Number(currentRealm?.def) || 14;
    const baseMaxHp = Number(state.baseHp) || Number(currentRealm?.baseHp) || 1000;
    const baseMaxMp = Number(state.baseMp) || Number(currentRealm?.baseMp) || 180;

    // Tích hợp Gear Stats & Skill Multiplier từ hệ thống đồng bộ chiến lực (Trụ cột 2)
    const statEngine = (typeof calculateTotalStats === 'function') ? calculateTotalStats(state) : null;
    const gearAtk = statEngine ? (statEngine.gearStats?.atk || 0) : 0;
    const gearDef = statEngine ? (statEngine.gearStats?.def || 0) : 0;
    const gearHp = statEngine ? (statEngine.gearStats?.hp || 0) : 0;
    const gearMp = statEngine ? (statEngine.gearStats?.mp || 0) : 0;
    const skillAtkMult = statEngine ? (statEngine.skillMultiplier?.atk || 0) : 0;
    const skillDefMult = statEngine ? (statEngine.skillMultiplier?.def || 0) : 0;
    const skillHpMult = statEngine ? (statEngine.skillMultiplier?.hp || 0) : 0;
    const skillMpMult = statEngine ? (statEngine.skillMultiplier?.mp || 0) : 0;

    const titleEffects = getActiveFoundationEffects();
    const hpMultiplier = titleEffects.hpMultiplier ?? 1;
    const mpMultiplier = titleEffects.mpMultiplier ?? 1;

    const rawMaxMp = Math.round(((baseMaxMp + gearMp + 20 + 5 * water) * (1 + skillMpMult)) * resonanceMult * chaosMult * mpMultiplier);
    let finalAtk = Math.round(((baseAtk + gearAtk + 12 + 2 * metal + 8 * fire) * (1 + skillAtkMult)) * resonanceMult * chaosMult * thunderAttackMult);
    let finalDef = Math.round(((baseDef + gearDef + 8 + 1.8 * earth) * (1 + skillDefMult)) * resonanceMult * chaosMult);
    let finalMaxHp = Math.round(((baseMaxHp + gearHp + 120 + 25 * wood) * (1 + skillHpMult)) * resonanceMult * chaosMult * hpMultiplier * (mutations.earth ? LINH_CAN_MUTATIONS.earth.effects.hpMultiplier : 1));

    // Buff Tông Môn Hạ Giới: Thanh Vân Môn (+10% HP), Huyết Hồn Cốc (+10% ATK)
    // (Nếu chưa tính trong skillHpMult/skillAtkMult thì cộng vào)
    if (!statEngine) {
        if (state.playerSect === 'thanh_van') {
            finalMaxHp = Math.round(finalMaxHp * 1.10);
        } else if (state.playerSect === 'huyet_hon') {
            finalAtk = Math.round(finalAtk * 1.10);
        }
    }

    // Gia trì từ Linh Thú Hộ Tộc & Thức Tỉnh Huyết Mạch (Pet Level & Bloodline Tier)
    const petLvl = Math.max(1, Number(state.petLevel) || 1);
    const petTier = Math.max(1, Number(state.petTier) || 1);
    const petBloodline = (typeof PET_BLOODLINE_TIERS !== 'undefined' && PET_BLOODLINE_TIERS[petTier - 1]) 
        ? PET_BLOODLINE_TIERS[petTier - 1] 
        : { atkMult: 1, defMult: 1, hpMult: 1 };
    finalAtk += Math.round(((petLvl - 1) * 25) * petBloodline.atkMult);
    finalDef += Math.round(((petLvl - 1) * 15) * petBloodline.defMult);
    finalMaxHp += Math.round(((petLvl - 1) * 150) * petBloodline.hpMult);

    // Gia trì từ Hộ Sơn Đại Trận Tông Môn (Sect Guardian Array)
    const sectArrayLvl = Number(state.sectArrayLevel) || 1;
    if (sectArrayLvl >= 2) finalMaxHp = Math.round(finalMaxHp * 1.05);
    if (sectArrayLvl >= 3) finalAtk = Math.round(finalAtk * 1.08);
    if (sectArrayLvl >= 4) {
        finalDef = Math.round(finalDef * 1.10);
        finalAtk = Math.round(finalAtk * 1.04);
    }
    if (sectArrayLvl >= 5) {
        finalAtk = Math.round(finalAtk * 1.08);
        finalDef = Math.round(finalDef * 1.08);
        finalMaxHp = Math.round(finalMaxHp * 1.08);
    }

    // Gia trì từ Đạo Lữ Đồng Tu (Companion Affinity Bonds)
    let companionCritAdd = 0;
    let companionCritDmgAdd = 0;
    if (Array.isArray(state.companions)) {
        state.companions.forEach(c => {
            const aff = Number(c.affinity) || 0;
            if (aff >= 30) {
                if (c.id === 'daolv_1') finalMaxHp = Math.round(finalMaxHp * 1.08);
                if (c.id === 'daolv_3') {
                    finalAtk = Math.round(finalAtk * 1.08);
                    companionCritAdd += 3;
                }
                if (c.id === 'daolv_4') companionCritDmgAdd += 0.15;
            }
        });
    }

    // Gia trì vĩnh viễn từ Đan Dược Tẩy Tủy Tông Môn (Thái Ất Tẩy Tủy Kim Đan)
    if (state.permPillStats) {
        if (state.permPillStats.atk) finalAtk += Number(state.permPillStats.atk) || 0;
        if (state.permPillStats.def) finalDef += Number(state.permPillStats.def) || 0;
        if (state.permPillStats.hp) finalMaxHp += Number(state.permPillStats.hp) || 0;
    }

    // Gia trì vĩnh viễn từ Đạo Lữ Khuê Phòng (state.companionBuffs)
    if (state.companionBuffs) {
        if (state.companionBuffs.atk) finalAtk += Number(state.companionBuffs.atk) || 0;
        if (state.companionBuffs.def) finalDef += Number(state.companionBuffs.def) || 0;
        if (state.companionBuffs.hp) finalMaxHp += Number(state.companionBuffs.hp) || 0;
    }

    // Gia trì từ Phù Chú Họa Phù Các (Lôi Chấn Phù & Kim Cương Phù)
    const nowTs = Date.now();
    if (state.talismanAtkBuffUntil && state.talismanAtkBuffUntil > nowTs) {
        finalAtk += Number(state.talismanAtkBuffVal) || 5000;
    }
    if (state.talismanDefBuffUntil && state.talismanDefBuffUntil > nowTs) {
        finalDef += Number(state.talismanDefBuffVal) || 3000;
    }

    // Hình phạt [Trọng Thương] do Thiên Kiếp đánh bại: Giảm 50% chỉ số trong 1 giờ
    if (state.heavyInjuryUntil && Date.now() < state.heavyInjuryUntil) {
        finalAtk = Math.max(1, Math.floor(finalAtk * 0.5));
        finalDef = Math.max(1, Math.floor(finalDef * 0.5));
        finalMaxHp = Math.max(1, Math.floor(finalMaxHp * 0.5));
    }

    // Gia trì vĩnh viễn từ Thiên Đạo Thành Tựu đã lĩnh ngộ
    let achAtkAdd = 0;
    let achDefAdd = 0;
    let achHpAdd = 0;
    let achAtkPercent = 0;
    let achDefPercent = 0;
    let achHpPercent = 0;
    let achCritAdd = 0;
    let achPhysDmgMult = 0;

    if (state.achievementsClaimed && typeof ACHIEVEMENTS_CONFIG !== 'undefined') {
        ACHIEVEMENTS_CONFIG.forEach(ach => {
            if (state.achievementsClaimed[ach.id] && ach.reward?.statBonus) {
                const b = ach.reward.statBonus;
                if (b.atk) achAtkAdd += b.atk;
                if (b.def) achDefAdd += b.def;
                if (b.hp) achHpAdd += b.hp;
                if (b.atkPercent) achAtkPercent += b.atkPercent;
                if (b.defPercent) achDefPercent += b.defPercent;
                if (b.hpPercent) achHpPercent += b.hpPercent;
                if (b.allStatsPercent) {
                    achAtkPercent += b.allStatsPercent;
                    achDefPercent += b.allStatsPercent;
                    achHpPercent += b.allStatsPercent;
                }
                if (b.crit) achCritAdd += b.crit;
                if (b.physicalDamagePercent) achPhysDmgMult += b.physicalDamagePercent / 100;
            }
        });
    }

    // Gia trì vĩnh viễn từ Bản Mệnh Thần Thông
    let divineAtkAdd = 0;
    let divineDefPercent = 0;
    let divineHpPercent = 0;
    let divinePhysDmgMult = 0;
    let divineCritAdd = 0;

    if (Array.isArray(state.divineTechniquesUnlocked) && typeof DIVINE_TECHNIQUES_CONFIG !== 'undefined') {
        state.divineTechniquesUnlocked.forEach(techId => {
            const tech = DIVINE_TECHNIQUES_CONFIG.find(t => t.id === techId);
            if (tech && tech.statBonus) {
                if (tech.statBonus.atk) divineAtkAdd += tech.statBonus.atk;
                if (tech.statBonus.defPercent) divineDefPercent += tech.statBonus.defPercent;
                if (tech.statBonus.hpPercent) divineHpPercent += tech.statBonus.hpPercent;
                if (tech.statBonus.physicalDamagePercent) divinePhysDmgMult += tech.statBonus.physicalDamagePercent / 100;
                if (tech.statBonus.crit) divineCritAdd += tech.statBonus.crit;
            }
        });
    }

    // Gia trì từ Dị Tượng Thiên Địa (Celestial Omens)
    let omenAtkMult = 1.0;
    let omenDefMult = 1.0;
    let omenCritAdd = 0;

    if (state.celestialOmen && typeof CELESTIAL_OMENS_CONFIG !== 'undefined') {
        const activeOmen = CELESTIAL_OMENS_CONFIG.find(o => o.id === state.celestialOmen.currentOmenId);
        if (activeOmen && activeOmen.effects) {
            if (activeOmen.effects.atkMult) omenAtkMult = activeOmen.effects.atkMult;
            if (activeOmen.effects.defMult) omenDefMult = activeOmen.effects.defMult;
            if (activeOmen.effects.critBonus) omenCritAdd = activeOmen.effects.critBonus;
        }
    }

    finalAtk = Math.round((finalAtk + achAtkAdd + divineAtkAdd) * (1 + achAtkPercent / 100) * omenAtkMult);
    finalDef = Math.round((finalDef + achDefAdd) * (1 + (achDefPercent + divineDefPercent) / 100) * omenDefMult);
    finalMaxHp = Math.round((finalMaxHp + achHpAdd) * (1 + (achHpPercent + divineHpPercent) / 100));

    return {
        atk: finalAtk,
        def: finalDef,
        maxHp: finalMaxHp,
        maxMp: titleEffects.mpMaxOverride === 0 ? 0 : rawMaxMp,
        tier: realmTier,
        tierMultiplier,
        crit: Number((state.crit + 0.3 * fire + (titleEffects.critRateAdd || 0) + companionCritAdd + achCritAdd + divineCritAdd + omenCritAdd).toFixed(1)),
        critDamageBonus: (titleEffects.critDamageAdd || 0) + companionCritDmgAdd,
        elementalDamageMultiplier: titleEffects.elementalDamageMultiplier || 1,
        elementalWeaknessTaken: titleEffects.elementalWeaknessTaken || 1,
        mpCostMultiplier: titleEffects.mpCostMultiplier || 1,
        mpRegenPercent: titleEffects.mpRegenPercent || 0,
        physicalDamageMultiplier: (mutations.metal ? LINH_CAN_MUTATIONS.metal.effects.physicalDamageMultiplier : 1) + achPhysDmgMult + divinePhysDmgMult,
        armorIgnore: mutations.metal ? LINH_CAN_MUTATIONS.metal.effects.armorIgnore : 0,
        hpRegenUnlocked: Boolean(mutations.wood),
        poisonImmune: Boolean(mutations.wood),
        burnImmune: Boolean(mutations.wood),
        shieldEfficiencyMultiplier: mutations.water ? LINH_CAN_MUTATIONS.water.effects.shieldEfficiencyMultiplier : 1,
        magicResistanceUnlocked: Boolean(mutations.water),
        burnEnemyMaxHpPercent: mutations.fire ? LINH_CAN_MUTATIONS.fire.effects.burnEnemyMaxHpPercent : 0,
        physicalReflect: mutations.earth ? LINH_CAN_MUTATIONS.earth.effects.physicalReflect : 0,
        executeBelowHpPercent: mutations.ice ? LINH_CAN_MUTATIONS.ice.effects.executeBelowHpPercent : 0,
        iceShieldExplosion: Boolean(mutations.ice),
        absoluteDodgeChance: mutations.wind ? LINH_CAN_MUTATIONS.wind.effects.absoluteDodgeChance : 0,
        castSpeedBoostUnlocked: Boolean(mutations.wind),
        criticalChainLightning: Boolean(mutations.thunder),
        paralysisIgnoresResistance: Boolean(mutations.thunder),
        hpRegenPerSec: typeof getHpRegenPerSec === 'function' ? getHpRegenPerSec() : 5
    };
}
window.getEffectiveStats = getEffectiveStats;

function getHpRegenPerSec(target = state) {
    if (!target) return 5;
    const base = Number(target.hpRegenBase ?? 5);
    const maxHp = Number(target.maxHp || 500);
    const realmStage = Number.isFinite(target.realmStage)
        ? target.realmStage
        : (typeof REALMS !== 'undefined' && REALMS[target.realmIndex]?.majorIndex !== undefined ? REALMS[target.realmIndex].majorIndex : 0);

    // Công thức tính Tốc độ hồi phục mỗi giây (HP/s):
    // hpRegenPerSec = state.hpRegenBase + (state.maxHp * 0.01) + (state.realmStage * 50)
    let hpRegenPerSec = base + (maxHp * 0.01) + (realmStage * 50);

    // Tích hợp buff từ Công Pháp (Tâm Pháp / Thể Thuật, ví dụ: Trường Xuân Công)
    let regenMultiplier = 1;
    let regenFlatBonus = 0;

    if (Array.isArray(target.equippedSkills) && typeof SKILLS_DATA !== 'undefined') {
        target.equippedSkills.forEach(skillId => {
            const skill = SKILLS_DATA.find(s => s.id === skillId);
            if (!skill) return;
            const learned = Array.isArray(target.learnedSkills) ? target.learnedSkills.find(s => s.id === skillId) : null;
            const level = learned?.level || 1;
            const masteryMult = (typeof MASTERY_LEVELS !== 'undefined' && MASTERY_LEVELS[level - 1]) ? MASTERY_LEVELS[level - 1].mult : 1;

            if (skill.stats?.hpRegenMultiplier) {
                regenMultiplier += skill.stats.hpRegenMultiplier * masteryMult;
            }
            if (skill.stats?.idleRegenHpPercent) {
                // Ví dụ: Trường Xuân Công (tp_truong_xuan) có idleRegenHpPercent: 0.01 (+1% Max HP/s)
                regenFlatBonus += maxHp * skill.stats.idleRegenHpPercent * masteryMult;
            }
            if (skill.stats?.hpRegenBonus) {
                regenFlatBonus += skill.stats.hpRegenBonus * masteryMult;
            }
        });
    }

    // Buff từ Linh Căn Mộc (Vạn Niên Thụ Tâm - Thái Ất Trường Sinh Căn) nếu có
    if (typeof getActiveFoundationEffects === 'function') {
        const effects = getActiveFoundationEffects();
        if (effects?.hpRegenMultiplier) {
            regenMultiplier *= effects.hpRegenMultiplier;
        }
    }

    // Hình phạt [Trọng Thương] do Thiên Kiếp đánh bại: Giảm 50% hồi phục nếu đang trọng thương
    if (target.heavyInjuryUntil && Date.now() < target.heavyInjuryUntil) {
        regenMultiplier *= 0.5;
    }

    return Math.max(1, Math.round((hpRegenPerSec + regenFlatBonus) * regenMultiplier));
}
window.getHpRegenPerSec = getHpRegenPerSec;

function loadGameState() {
            let saved = null;
            try { saved = JSON.parse(localStorage.getItem('van_co_tu_tien_save_v2') || 'null'); } catch (e) {}
            state = { ...structuredClone(DEFAULT_STATE), ...(saved && typeof saved === 'object' ? saved : {}) };
            // Older object-based rewards were stored as {id: reward, name: reward}.
            // Recover the original metadata and quantity instead of discarding loot.
            state.inventory = (Array.isArray(state.inventory) ? state.inventory : []).map(normalizeInventoryEntry);
            let previewManualGiftAdded = false;
            if (saved && !state.manualArtGiftV1 && typeof PREVIEW_MANUAL_SKILL_IDS !== 'undefined' && typeof SKILLS_DATA !== 'undefined') {
                const manuals = PREVIEW_MANUAL_SKILL_IDS.map(id => SKILLS_DATA.find(skill => skill.id === id));
                if (manuals.every(Boolean)) {
                    if (!Array.isArray(state.inventory)) state.inventory = [];
                    manuals.forEach(skill => {
                        const itemId = `manual_${skill.id}`;
                        const existing = state.inventory.find(item => item.id === itemId);
                        if (existing) {
                            existing.count = Math.max(1, Number(existing.count) || 0);
                        } else {
                            state.inventory.push({
                                id: itemId,
                                skillId: skill.id,
                                name: skill.name,
                                type: 'Bí Tịch',
                                rarity: skill.tier === 'thien' ? 5 : 4,
                                count: 1,
                                desc: skill.desc,
                                icon: 'fa-book',
                                image: skill.image_url
                            });
                        }
                    });
                    state.manualArtGiftV1 = true;
                    previewManualGiftAdded = true;
                }
            }
            if (state.hpRegenBase === undefined) state.hpRegenBase = 5;
            state.realmStage = typeof REALMS !== 'undefined' && REALMS[state.realmIndex]?.majorIndex !== undefined ? REALMS[state.realmIndex].majorIndex : (state.realmStage ?? 0);
            if (saved && saved.ageYears === undefined) state.ageYears = Math.max(0, Number(saved.lifespan) || DEFAULT_STATE.ageYears);
            if (state.playerSect === undefined) state.playerSect = null;
            if (state.sectRank === undefined) state.sectRank = 0;
            if (state.sectContribution === undefined) state.sectContribution = 0;
            if (!Array.isArray(state.sectPurchasedSkills)) state.sectPurchasedSkills = [];
            if (state.daoTam === undefined) state.daoTam = 100;
            if (state.tamMa === undefined) state.tamMa = Math.max(0, 100 - state.daoTam);
            if (!state.currentWorld) state.currentWorld = 'HaGioi';
            if (!state.beQuanTuQua) state.beQuanTuQua = { active: false, startTime: 0 };
            if (!state.talismans || typeof state.talismans !== 'object') {
                state.talismans = { lightning: 8, shield: 5, speed: 12, calm: 6 };
            }
            if (!Array.isArray(state.avatars) || state.avatars.length === 0) {
                state.avatars = [
                    { id: "avatar_sword", level: 1, status: "idle", expeditionEndTime: 0 },
                    { id: "avatar_alchemy", level: 1, status: "idle", expeditionEndTime: 0 },
                    { id: "avatar_soul", level: 1, status: "idle", expeditionEndTime: 0 }
                ];
            }
            if (!state.auctionData) {
                state.auctionData = {
                    currentLotIndex: 0,
                    currentBid: 20000,
                    highestBidder: "Bản Tôn",
                    isPlayerHighest: true,
                    timeLeft: 30,
                    hammerCount: 0,
                    wonLots: []
                };
            }
            if (!state.dungeonsCleared || typeof state.dungeonsCleared !== 'object') {
                state.dungeonsCleared = {};
            }
            if (state.righteousKarma === undefined) state.righteousKarma = 0;
            if (state.demonicKarma === undefined) state.demonicKarma = 0;
            if (!state.companionBuffs || typeof state.companionBuffs !== 'object') {
                state.companionBuffs = { hp: 0, atk: 0, def: 0 };
            }
            if (!state.permPillStats || typeof state.permPillStats !== 'object') {
                state.permPillStats = { hp: 0, atk: 0, def: 0 };
            }
            if (!state.playerSectArrayBuffs || typeof state.playerSectArrayBuffs !== 'object') {
                state.playerSectArrayBuffs = { activeSynergy: false, totalInfusedStones: 0, nodes: {} };
            }
            if (state.arenaRank === undefined) state.arenaRank = 100;
            if (state.arenaHonor === undefined) state.arenaHonor = 150;
            if (state.arenaTickets === undefined) state.arenaTickets = 5;
            if (state.petTier === undefined) state.petTier = 1;
            if (state.sectArrayLevel === undefined) state.sectArrayLevel = 1;
            if (!Array.isArray(state.sectTrialsBeaten)) state.sectTrialsBeaten = [];
            if (!state.achievementsClaimed || typeof state.achievementsClaimed !== 'object') {
                state.achievementsClaimed = {};
            }
            if (typeof state.equippedTitle !== 'string') state.equippedTitle = '';
            if (typeof state.talismanCraftedCount !== 'number') state.talismanCraftedCount = 0;
            if (typeof state.avatarTripsCompleted !== 'number') state.avatarTripsCompleted = 0;
            if (!state.celestialOmen || typeof state.celestialOmen !== 'object') {
                state.celestialOmen = {
                    currentOmenId: "tu_khi_dong_lai",
                    changeAt: Date.now() + 1200000
                };
            }
            if (!state.celestialOmen.changeAt || state.celestialOmen.changeAt < Date.now()) {
                state.celestialOmen.changeAt = Date.now() + 1200000;
            }
            if (!Array.isArray(state.divineTechniquesUnlocked)) {
                state.divineTechniquesUnlocked = [];
            }
            if (!Array.isArray(state.skills) || state.skills.length === 0) {
                state.skills = structuredClone(DEFAULT_STATE.skills);
            } else if (DEFAULT_STATE.skills) {
                DEFAULT_STATE.skills.forEach(defSk => {
                    if (!state.skills.some(s => s.id === defSk.id)) {
                        state.skills.push(structuredClone(defSk));
                    }
                });
            }
            normalizeSpiritualRootState(state);
            normalizeCharacterSystems(state);
            syncHeavenlyRejection();
            const currentLoadedRealm = REALMS[state.realmIndex] || REALMS[0];
            if (currentLoadedRealm) {
                state.baseHp = Number(currentLoadedRealm.baseHp) || 500;
                state.baseMp = Number(currentLoadedRealm.baseMp) || 200;
                state.baseAtk = Number(currentLoadedRealm.baseAtk) || 28;
                state.baseDef = Number(currentLoadedRealm.baseDef || currentLoadedRealm.def) || 14;
                if (!state.equipped || typeof state.equipped !== 'object') {
                    state.equipped = {};
                }
                if (typeof calculateTotalStats === 'function') {
                    calculateTotalStats(state);
                } else {
                    state.maxHp = Math.max(Number(state.maxHp) || 0, Number(currentLoadedRealm.baseHp) || 1000);
                    state.maxMp = Math.max(Number(state.maxMp) || 0, Number(currentLoadedRealm.baseMp) || 180);
                    state.atk = Math.max(Number(state.atk) || 0, Number(currentLoadedRealm.baseAtk) || 28);
                    state.def = Math.max(Number(state.def) || 0, Number(currentLoadedRealm.baseDef) || Number(currentLoadedRealm.def) || 14);
                }
            }
            if (typeof window !== 'undefined') window.state = state;
            if (typeof syncGameState === 'function') syncGameState(state);
            const loadedStats = getEffectiveStats();
            if (state.hp >= state.maxHp) state.hp = loadedStats.maxHp;
            if (state.mp >= state.maxMp) state.mp = loadedStats.maxMp;

            const rawOfflineSeconds = saved && Number.isFinite(Number(saved.lastOnlineTime))
                ? Math.max(0, Math.floor((Date.now() - Number(saved.lastOnlineTime)) / 1000)) : 0;
            // Giới hạn thời gian offline tối đa 24h để bảo toàn cân bằng game
            const offlineSeconds = Math.min(86400, rawOfflineSeconds);

            const realm = REALMS[state.realmIndex];
            const previousExp = state.exp;
            const previousLinhKhi = state.linhKhi;
            const ageBefore = state.ageYears;
            const wasAtThreshold = Boolean(realm && state.exp >= realm.maxExp);

            // 1. Phục hồi Đạo Tâm nếu đang Bế Quan Tư Quá
            if (offlineSeconds > 0 && !state.isDead && state.beQuanTuQua?.active) {
                const recoveredDaoTam = (offlineSeconds / 3600) * 5;
                state.daoTam = Math.min(100, (state.daoTam || 100) + recoveredDaoTam);
                state.tamMa = Math.max(0, 100 - state.daoTam);
            }

            // 2. Tu Vi: Bể chứa vô hạn, tiếp tục tích lũy khi offline không bị chặn trần
            let gainedTuVi = 0;
            if (offlineSeconds > 0 && realm && !state.isDead && !state.beQuanTuQua?.active) {
                const adjustedGainPerSec = getAdjustedCultivationGain(getIdleRate()).gainedAmount;
                gainedTuVi = Math.round(offlineSeconds * adjustedGainPerSec);
                state.exp = (Number(state.exp) || 0) + gainedTuVi;
            }

            // 3. Thọ nguyên: Không nhân timeScale tester, tuyệt đối không giết người chơi khi offline
            if (offlineSeconds > 0 && realm && !state.isDead) {
                const adjustedGainPerSec = getAdjustedCultivationGain(getIdleRate()).gainedAmount;
                const secondsAging = wasAtThreshold ? 0 : adjustedGainPerSec > 0
                    ? Math.min(offlineSeconds, Math.ceil(gainedTuVi / adjustedGainPerSec)) : offlineSeconds;
                const yearsToAdd = secondsAging / M1_SYSTEM_RULES.secondsPerYearOffline;
                const maxLifespan = getThoNguyenMax();
                state.ageYears = Math.min(Math.max(0, maxLifespan - 1), state.ageYears + yearsToAdd);
            }

            // 4. Linh Khí Động Phủ
            if (offlineSeconds > 0 && realm && !state.isDead) {
                state.linhKhi = Math.min(getLinhKhiMax(), state.linhKhi + Math.round(offlineSeconds * getLinhKhiRate()));
            }

            // 5. Tiến độ Linh Điền dược thảo khi AFK
            if (offlineSeconds > 0 && Array.isArray(state.farmPlots)) {
                const isFarmUnlocked = typeof isFeatureUnlocked === 'function' ? isFeatureUnlocked('btn_linh_dien') : true;
                const autoFarm = state.auto?.enabled !== false && state.auto?.farm && isFarmUnlocked;
                state.farmPlots.forEach(plot => {
                    if (plot.herbId && plot.progress < 100) {
                        plot.progress = Math.min(100, plot.progress + (plot.speed || 1) * offlineSeconds);
                    }
                    if (plot.progress >= 100 && autoFarm && typeof harvestPlot === 'function') {
                        harvestPlot(plot.id, true);
                    }
                });
            }

            // 6. Lịch Luyện / Thám hiểm offline
            if (offlineSeconds > 0 && state.expedition?.zoneId && typeof EXPEDITION_ZONES !== 'undefined') {
                const zone = EXPEDITION_ZONES.find(z => z.id === state.expedition.zoneId);
                if (zone) {
                    const duration = state.expedition.duration || (typeof getExpeditionDuration === 'function' ? getExpeditionDuration(zone) : zone.baseSeconds);
                    const elapsed = Math.floor((Date.now() - state.expedition.startTime) / 1000);
                    if (state.expedition.autoRepeat) {
                        const trips = Math.min(60, Math.floor(elapsed / duration));
                        for (let i = 0; i < trips; i++) {
                            if (typeof completeExpedition === 'function') completeExpedition(zone, true);
                        }
                        if (trips > 0) {
                            state.expedition.startTime = Date.now() - ((elapsed % duration) * 1000);
                        }
                    } else if (elapsed >= duration) {
                        if (typeof completeExpedition === 'function') completeExpedition(zone, true);
                    }
                }
            }
            state.lastOnlineTime = Date.now();
            // Dọn một lần theo yêu cầu chủ bản lưu. Giữ định nghĩa item để có thể nhận lại sau này.
            if (saved && !state.materialCleanup20261110) {
                const materialTypes = new Set(['Nguyên Liệu', 'Nguyên liệu', 'Thảo Dược', 'Dược Liệu', 'Khoáng Thạch', 'Nguyên liệu luyện khí']);
                state.inventory.forEach(item => {
                    if (!item.equipped && !item.slot && materialTypes.has(item.type)) {
                        item.count = 0;
                        if ('quantity' in item) item.quantity = 0;
                    }
                });
                state.materialCleanup20261110 = true;
                saveGameState();
            }
            if (previewManualGiftAdded) saveGameState();
            return { seconds: rawOfflineSeconds, gained: state.exp - previousExp, linhKhiGained: state.linhKhi - previousLinhKhi, yearsAged: state.ageYears - ageBefore };
        }
function saveGameState() {
            state.lastOnlineTime = Date.now();
            try { localStorage.setItem('van_co_tu_tien_save_v2', JSON.stringify(state)); } catch (e) {}
            const ind = document.getElementById('save-indicator');
            if (ind) {
                ind.classList.add('scale-125', 'bg-jade-300');
                setTimeout(() => ind.classList.remove('scale-125', 'bg-jade-300'), 400);
            }
        }
function addSpiritStones(rawAmount) {
    let finalAmount = Math.max(0, Math.round(Number(rawAmount) || 0));
    if (state.playerSect === 'tan_tu') {
        finalAmount = Math.round(finalAmount * 1.10);
    }
    state.stones = (state.stones || 0) + finalAmount;
    return finalAmount;
}
window.addSpiritStones = addSpiritStones;
function resetGameData() {
            try {
                localStorage.removeItem('van_co_tu_tien_save_v2');
            } catch (e) {}
            state = structuredClone(DEFAULT_STATE);
            normalizeSpiritualRootState(state);
            normalizeCharacterSystems(state);
            syncHeavenlyRejection();
            saveGameState();
            window.location.reload();
        }
function resetToLuyenKhi() {
    state.realmIndex = 0;
    state.realmStage = 0;
    state.exp = 0;
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof addLog === 'function') {
        addLog("🌀 <strong class='text-emerald-400'>[Trùng Tu Tiên Lộ]</strong> Bản Tôn đã nghịch chuyển càn khôn, trở về cảnh giới <strong>Luyện Khí Kỳ</strong>!", "text-emerald-400");
    }
}
window.resetToLuyenKhi = resetToLuyenKhi;

function setPlayerRealm(realmIdx = 0) {
    state.realmIndex = Math.max(0, Number(realmIdx) || 0);
    state.realmStage = typeof REALMS !== 'undefined' && REALMS[state.realmIndex]?.majorIndex !== undefined ? REALMS[state.realmIndex].majorIndex : 0;
    state.exp = 0;
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
}
window.setPlayerRealm = setPlayerRealm;

// Tester Toolbar đã bị thanh tẩy hoàn toàn theo quy chuẩn Anti-Cheat
function toggleTesterToolbar() {}
function closeTesterToolbar() {}
function openTesterResetModal() {}
function closeTesterResetModal() {}
function openTesterRealmModal() {}
function closeTesterRealmModal() {}
function applyTesterRealmReset() {}
function getIdleRate() {
    const base = REALMS[state.realmIndex].rate;
    const arrayBonus = 1 + (state.arrayLevel - 1) * 0.25;
    const rootMultiplier = getActiveFoundationEffects().cultivationSpeedMultiplier ?? 1;
    let rate = base * rootMultiplier * arrayBonus;
    if (state.talismanSpeedBuffUntil && state.talismanSpeedBuffUntil > Date.now()) {
        rate *= 1.35;
    }
    // Gia trì tốc độ tu luyện vĩnh viễn từ Thiên Đạo Thành Tựu
    if (state.achievementsClaimed && typeof ACHIEVEMENTS_CONFIG !== 'undefined') {
        let achRateBonus = 0;
        ACHIEVEMENTS_CONFIG.forEach(ach => {
            if (state.achievementsClaimed[ach.id] && ach.reward?.statBonus?.cultivationRate) {
                achRateBonus += ach.reward.statBonus.cultivationRate;
            }
        });
        if (achRateBonus > 0) rate *= (1 + achRateBonus / 100);
    }
    // Gia trì tốc độ tu luyện từ Dị Tượng Thiên Địa
    if (state.celestialOmen && typeof CELESTIAL_OMENS_CONFIG !== 'undefined') {
        const omen = CELESTIAL_OMENS_CONFIG.find(o => o.id === state.celestialOmen.currentOmenId);
        if (omen && omen.effects?.cultivationRateMult) {
            rate *= omen.effects.cultivationRateMult;
        }
    }
    // Gia trì tốc độ tu luyện từ Bản Mệnh Thần Thông
    if (Array.isArray(state.divineTechniquesUnlocked) && typeof DIVINE_TECHNIQUES_CONFIG !== 'undefined') {
        let techRateBonus = 0;
        state.divineTechniquesUnlocked.forEach(techId => {
            const tech = DIVINE_TECHNIQUES_CONFIG.find(t => t.id === techId);
            if (tech && tech.statBonus?.cultivationRate) {
                techRateBonus += tech.statBonus.cultivationRate;
            }
        });
        if (techRateBonus > 0) rate *= (1 + techRateBonus / 100);
    }
    // Gia trì tốc độ tu luyện từ Huyết Mạch Thần Thú
    const petTier = Number(state.petTier) || 1;
    if (typeof PET_BLOODLINE_TIERS !== 'undefined' && PET_BLOODLINE_TIERS[petTier - 1]?.idleBonus) {
        rate *= (1 + PET_BLOODLINE_TIERS[petTier - 1].idleBonus);
    }
    // Gia trì tốc độ tu luyện từ Hộ Sơn Đại Trận Tông Môn
    const sectArrayLvl = Number(state.sectArrayLevel) || 1;
    if (typeof SECT_ARRAY_TIERS !== 'undefined' && SECT_ARRAY_TIERS[sectArrayLvl - 1]?.idleBonus) {
        rate *= (1 + SECT_ARRAY_TIERS[sectArrayLvl - 1].idleBonus);
    }
    // Gia trì tốc độ tu luyện từ Trang Bị Thần Binh (Giới Chỉ / Hộ Phù rateBonus)
    if (state.equipped && typeof state.equipped === 'object') {
        let gearRateBonus = 0;
        for (const slotKey in state.equipped) {
            const eq = state.equipped[slotKey];
            if (eq && eq.rateBonus) gearRateBonus += Number(eq.rateBonus);
        }
        if (gearRateBonus > 0) rate *= (1 + gearRateBonus / 100);
    }
    return rate;
}

function getLinhKhiMax() {
    return REALMS[state.realmIndex].maxExp * (1 + (state.arrayLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel);
}

function getLinhKhiRate() {
    const rawQiGen = REALMS[state.realmIndex].rate * (1 + (state.arrayLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel);
    const isTienGioi = state.currentWorld === 'TienGioi' || String(state.currentWorld).includes('Tiên Giới');
    if (isTienGioi) {
        return Math.round(rawQiGen * 10);
    }
    // Hạ Giới Soft Cap: <= 500 nhận 100%, > 500: 500 + 20% phần vượt
    if (rawQiGen <= 500) {
        return rawQiGen;
    }
    return 500 + Math.floor((rawQiGen - 500) * 0.2);
}

function getThoNguyenMax() {
    return Math.max(0, REALMS[state.realmIndex].lifespan + state.lifespanBonus - state.lifespanPenalty);
}

function Trigger_Death() {
    if (state.isDead || state.ageYears < getThoNguyenMax()) return false;
    state.ageYears = getThoNguyenMax();
    state.isDead = true;
    addLog('[Tọa Hóa] Thọ nguyên đã cạn. Tu luyện tạm dừng; hình phạt cảnh giới đang chờ quy tắc chính thức.', 'text-rose-400');
    return true;
}
window.Trigger_Death = Trigger_Death;

function getTimeSystemPayload(afkReport = null) {
    const atThreshold = state.exp >= REALMS[state.realmIndex].maxExp;
    const aging = !atThreshold && !state.isDead;
    const remaining = Math.max(0, getThoNguyenMax() - state.ageYears);
    return {
        status: 'success',
        time_system: {
            tuoi_hien_tai: state.ageYears,
            tho_nguyen_max: getThoNguyenMax(),
            canh_gioi_status: atThreshold ? 'Cho_Dot_Pha' : 'Binh_On',
            is_aging: aging,
            time_to_death_seconds: aging ? Math.ceil(remaining * M1_SYSTEM_RULES.secondsPerYearOnline / state.timeScale) : null,
            is_dead: state.isDead
        },
        ...(afkReport ? { afk_report: { offline_seconds: afkReport.seconds, tu_vi_gained: afkReport.gained, linh_khi_gained: afkReport.linhKhiGained, years_aged: afkReport.yearsAged } } : {})
    };
}
window.getTimeSystemPayload = getTimeSystemPayload;

function processTimeSystemRequest(request = {}) {
    if ((request.Action || request.action) !== 'Use_Item' || request.item_id !== 'dien_tho_dan') {
        return JSON.stringify({ status: 'error', error_code: 'INVALID_ACTION' });
    }
    const inventory = Array.isArray(request.inventory) ? request.inventory.map(item => ({ ...item })) : [];
    const pill = inventory.find(item => (item.id || item.item_id || item.item) === 'dien_tho_dan');
    const owned = Number(pill?.qty ?? pill?.count ?? pill?.amount ?? 0);
    if (owned < 1) return JSON.stringify({ status: 'error', error_code: 'ITEM_NOT_FOUND', inventory_deduction: [] });
    if (pill.qty !== undefined) pill.qty--;
    else if (pill.count !== undefined) pill.count--;
    else pill.amount--;
    const player = { ...(request.player_state || {}) };
    player.tho_nguyen_max = (Number(player.tho_nguyen_max) || 0) + M1_SYSTEM_RULES.lifeExtensionItems.dien_tho_dan;
    return JSON.stringify({ status: 'success', player_state: player,
        inventory_deduction: [{ item_id: 'dien_tho_dan', amount: 1 }], inventory_update: inventory,
        action_log: ['[Thọ Nguyên] Phục dụng Diên Thọ Đan, giới hạn tuổi thọ tăng 20 năm.'] });
}
window.processTimeSystemRequest = processTimeSystemRequest;

function getIdleResourcesPayload() {
    const realm = REALMS[state.realmIndex];
    const speed = state.isDead ? 0 : getAdjustedCultivationGain(getIdleRate() * state.timeScale).gainedAmount;
    return {
        resources: {
            linh_khi: { current: state.linhKhi, max: getLinhKhiMax(), rate: `+${state.isDead ? 0 : getLinhKhiRate() * state.timeScale}/s` },
            tu_vi: { current: state.exp, max: realm.maxExp, capacity: null, rate: `+${speed}/s` }
        },
        facilities: { tu_linh_tran_level: state.arrayLevel, active_linh_can: state.daoFoundationTitles.activeTitle },
        dan_dien_status: state.exp >= realm.maxExp ? 'Đủ Tu Vi - Có thể đột phá' : 'Binh_On'
    };
}
window.getIdleResourcesPayload = getIdleResourcesPayload;

function processIdleResourceAction(request = {}) {
    const action = request.Action || request.action;
    const source = request.player_state || {};
    const realm = REALMS.find(entry => entry.name === source.canh_gioi);
    if (!realm) return JSON.stringify({ status: 'error', error_code: 'INVALID_REALM' });
    const level = Math.max(1, Math.floor(Number(source.tu_linh_tran_level) || 1));
    const elementMap = { Kim: 'metal', Moc: 'wood', Thuy: 'water', Hoa: 'fire', Tho: 'earth' };
    const roots = { ...(request.ngu_hanh || {}) };
    const inventory = Array.isArray(request.inventory) ? request.inventory.map(item => ({ ...item })) : [];
    let linhKhi = Math.min(realm.maxExp * (1 + (level - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel), Math.max(0, Number(source.linh_khi_current) || 0));
    let stones = Math.max(0, Number(source.linh_thach) || 0);
    let nextLevel = level;
    const deductions = [];
    const logs = [];
    const fail = (code) => JSON.stringify({ status: 'error', error_code: code, inventory_deduction: [] });
    if (action === 'Upgrade_Linh_Can') {
        const element = request.element;
        if (!elementMap[element]) return fail('INVALID_ELEMENT');
        const currentLevel = Math.max(1, Number(roots[element]) || 1);
        if (currentLevel >= LINH_CAN_RULES.maxLevel) return fail('MAX_LEVEL');
        if (currentLevel >= 50 && !request.mutations?.[element]) return fail('AWAKENING_REQUIRED');
        const cost = getPillarUpgradeCost(currentLevel, elementMap[element]);
        if (linhKhi < cost) return fail('INSUFFICIENT_LINH_KHI');
        linhKhi -= cost;
        roots[element] = currentLevel + 1;
        deductions.push({ item_id: 'linh_khi', amount: cost });
        logs.push(`[Linh Căn] Rót ${cost} Linh Khí vào ${element}, đạt cấp ${roots[element]}.`);
    } else if (action === 'Upgrade_Tu_Linh_Tran') {
        const cost = request.cost;
        const stoneCost = Number(cost?.linh_thach);
        const materials = cost?.materials;
        if (!Number.isFinite(stoneCost) || stoneCost <= 0 || !Array.isArray(materials) || materials.length === 0) return fail('COST_NOT_CONFIGURED');
        if (stones < stoneCost) return fail('INSUFFICIENT_LINH_THACH');
        for (const material of materials) {
            if (!material.item || !Number.isInteger(material.qty) || material.qty <= 0) return fail('INVALID_MATERIAL_COST');
            const owned = inventory.find(item => (item.id || item.item) === material.item);
            if (Number(owned?.count ?? owned?.qty ?? 0) < material.qty) return fail('INSUFFICIENT_MATERIAL');
        }
        stones -= stoneCost;
        deductions.push({ item_id: 'linh_thach', amount: stoneCost });
        for (const material of materials) {
            const owned = inventory.find(item => (item.id || item.item) === material.item);
            if (owned.count !== undefined) owned.count -= material.qty;
            else owned.qty -= material.qty;
            deductions.push({ item_id: material.item, amount: material.qty });
        }
        nextLevel++;
        logs.push(`[Động Phủ] Tụ Linh Trận đạt cấp ${nextLevel}.`);
    } else return fail('INVALID_ACTION');
    const factor = 1 + (nextLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel;
    const title = DAO_FOUNDATION_TITLES[source.active_linh_can] || DAO_FOUNDATION_TITLES.vo_linh_can;
    const cultivationRate = realm.rate * (title.effects.cultivationSpeedMultiplier ?? 1) * factor;
    return JSON.stringify({ status: 'success', resources: {
        linh_khi: { current: linhKhi, max: realm.maxExp * factor, rate: `+${realm.rate * factor}/s` },
        tu_vi: { current: Number(source.tu_vi_current) || 0, max: realm.maxExp, capacity: null, rate: `+${cultivationRate}/s` }
    }, facilities: { tu_linh_tran_level: nextLevel, active_linh_can: source.active_linh_can || 'vo_linh_can' },
    ngu_hanh: roots, linh_thach: stones, inventory_update: inventory, inventory_deduction: deductions, action_log: logs });
}
window.processIdleResourceAction = processIdleResourceAction;

function getAdjustedCultivationGain(amount) {
    const rawAmount = Math.max(0, Number(amount) || 0);
    // The configured suppression reduces cultivation by 90%; it does not stop progress.
    const suppressionMultiplier = typeof isHeavenlySuppressed === 'function' && isHeavenlySuppressed()
        ? HEAVENLY_REJECTION_RULES.cultivationGainMultiplier
        : 1;
    let gained = rawAmount * suppressionMultiplier;

    // Hình phạt [Trọng Thương] do Thiên Kiếp đánh bại: Giảm 50% tốc độ tu vi
    if (state.heavyInjuryUntil && Date.now() < state.heavyInjuryUntil) {
        gained = Math.max(0, Math.floor(gained * 0.5));
    }

    // Buff Hộ Sơn Đại Trận Tứ Tượng (+20% Tu Vi)
    if (state.playerSectArrayBuffs && state.playerSectArrayBuffs.activeSynergy) {
        gained = Math.round(gained * 1.20);
    }
    // Buff Đạo Tâm Thanh Tịnh - Thái Thượng Chân Tiên (+15% Tu Vi)
    if (Number(state.righteousKarma) >= 40) {
        gained = Math.round(gained * 1.15);
    }

    return {
        rawAmount,
        gainedAmount: gained
    };
}

function getHeavenlyLeakChance(realmIndex = state.realmIndex) {
    const next = REALMS[realmIndex + 1];
    return next?.majorRealm === HEAVENLY_REJECTION_RULES.triggeringMajorRealm
        ? HEAVENLY_REJECTION_RULES.leakChanceByMinorStage[next.minorStage] || 0
        : 0;
}

function getCultivationStatePayload(target = state, actionResult = {}) {
    const realm = REALMS[target.realmIndex] || REALMS[0];
    const suppressed = isHeavenlyRejected(target);
    return {
        status: 'success',
        cultivation_state: {
            major_realm: realm.majorRealm,
            minor_realm: realm.minorStage,
            current_tu_vi: target.exp,
            max_tu_vi: realm.maxExp,
            heavenly_suppression: {
                is_active: suppressed,
                debuff_tuvi_rate: suppressed ? HEAVENLY_REJECTION_RULES.cultivationGainMultiplier : 1,
                tooltip_message: suppressed ? HEAVENLY_REJECTION_RULES.tooltipMessage : '',
                next_breakthrough_leak_chance: suppressed ? getHeavenlyLeakChance(target.realmIndex) : 0,
                is_forced_ascension_triggered: Boolean(target.forcedAscensionTriggered)
            }
        },
        action_result: { breakthrough_attempted: false, leak_event_triggered: false, ...actionResult }
    };
}
window.getCultivationStatePayload = getCultivationStatePayload;

function triggerHeavenlySuppressionAlert() {
    const modal = document.getElementById('heavenly-suppression-alert-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    
    // Âm thanh chấn động thiên địa
    if (typeof playSound === 'function') {
        playSound('thunder');
        setTimeout(() => playSound('danger'), 200);
    }
    if (typeof triggerScreenShake === 'function') {
        triggerScreenShake(1000);
    }
    addLog('⚠️ <span class="text-rose-500 font-black tracking-widest">[THIÊN ĐẠO BÀI XÍCH]</span> Áp chế giáng lâm! Phong ấn toàn bộ Tu Vi (0/s), giảm 90% tài nguyên!', 'text-rose-400');
}
window.triggerHeavenlySuppressionAlert = triggerHeavenlySuppressionAlert;

function closeHeavenlySuppressionAlert(goToTower = false) {
    const modal = document.getElementById('heavenly-suppression-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
    syncHeavenlySuppressionUI(true);
    if (goToTower && typeof openDemonTowerModal === 'function') {
        openDemonTowerModal('fight');
    }
}
window.closeHeavenlySuppressionAlert = closeHeavenlySuppressionAlert;

function showHeavenlySuppressionInfoModal() {
    const modal = document.getElementById('heavenly-suppression-info-modal');
    const body = document.getElementById('heavenly-info-body');
    const footer = document.getElementById('heavenly-info-footer');
    if (!modal || !body) return;

    const hasCleared = Boolean(state.hasClearedTower50 || (state.towerFloor && state.towerFloor > 50));
    const currentFloor = state.towerFloor || 1;

    body.innerHTML = `
        <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
            <div class="flex items-center justify-between text-rose-300 font-bold">
                <span>Trạng thái phong ấn:</span>
                <span class="px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-500/50">HẠ GIỚI ÁP CHẾ</span>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">
                Khí tức Hóa Thần vượt ngưỡng thừa tải của quy tắc Hạ Giới. Thiên Đạo giáng hạ thần tỏa, áp chế toàn bộ kinh mạch và linh cơ.
            </p>
        </div>

        <div class="space-y-1.5 text-xs">
            <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-700/60">
                <i class="fa-solid fa-ban text-rose-400 mt-0.5"></i>
                <div>
                    <strong class="text-rose-300">Khóa Tu Vi (EXP Lock):</strong>
                    <span class="text-slate-300"> Tốc độ tu vi = 0. Không thể hấp thu thêm Tu Vi qua đả tọa, đan dược hay song tu.</span>
                </div>
            </div>

            <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-700/60">
                <i class="fa-solid fa-coins text-amber-400 mt-0.5"></i>
                <div>
                    <strong class="text-amber-300">Khóa Tài Nguyên (-90%):</strong>
                    <span class="text-slate-300"> Linh Thạch và sản vật rơi ra từ Lịch Luyện, Gia Viên giảm 90%.</span>
                </div>
            </div>

            <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-700/60">
                <i class="fa-solid fa-shield-halved text-emerald-400 mt-0.5"></i>
                <div>
                    <strong class="text-emerald-300">Bảo Toàn Chiến Lực (100%):</strong>
                    <span class="text-slate-300"> Toàn bộ Khí Huyết, Công Kích, Phòng Ngự, Bạo Kích được giữ nguyên 100%.</span>
                </div>
            </div>

            <div class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-700/60">
                <i class="fa-solid fa-dungeon text-cyan-400 mt-0.5"></i>
                <div>
                    <strong class="text-cyan-300">Điều Kiện Phi Thăng:</strong>
                    <span class="text-slate-300"> Đả thông Tầng 50 Trấn Yêu Tháp. Hiện trạng: </span>
                    <strong class="${hasCleared ? 'text-emerald-400 font-bold' : 'text-amber-300'}">
                        ${hasCleared ? '✅ Đã Đả Thông' : `⚔️ Đang Khiêu Chiến (Tầng ${currentFloor}/50)`}
                    </strong>
                </div>
            </div>
        </div>
    `;

    if (footer) {
        if (hasCleared) {
            footer.innerHTML = `
                <button type="button" onclick="closeHeavenlySuppressionInfoModal(); performAscensionToLinhGioi();" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold font-serif text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-feather-pointed"></i>
                    <span>PHI THĂNG LINH GIỚI NGAY</span>
                </button>
            `;
        } else {
            footer.innerHTML = `
                <button type="button" onclick="closeHeavenlySuppressionInfoModal(); if(typeof openDemonTowerModal==='function') openDemonTowerModal('fight');" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-800 via-red-600 to-rose-800 hover:from-rose-700 hover:to-red-500 text-white font-bold font-serif text-xs tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.6)] transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-dungeon"></i>
                    <span>KHIÊU CHIẾN TRẤN YÊU THÁP (TẦNG ${currentFloor})</span>
                </button>
            `;
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
}
window.showHeavenlySuppressionInfoModal = showHeavenlySuppressionInfoModal;

function closeHeavenlySuppressionInfoModal() {
    const modal = document.getElementById('heavenly-suppression-info-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
}
window.closeHeavenlySuppressionInfoModal = closeHeavenlySuppressionInfoModal;

function performAscensionToLinhGioi() {
    if (!isHeavenlySuppressed()) {
        addLog('Đạo hữu chưa đạt ngưỡng Thiên Đạo Áp Chế để Phi Thăng.', 'text-slate-400');
        return;
    }
    const hasCleared = Boolean(state.hasClearedTower50 || (state.towerFloor && state.towerFloor > 50));
    if (!hasCleared) {
        addLog('⚠️ Cần đả thông Tầng 50 Trấn Yêu Tháp mới có thể mở lối Phi Thăng Linh Giới!', 'text-rose-400');
        if (typeof openDemonTowerModal === 'function') openDemonTowerModal('fight');
        return;
    }

    state.currentWorld = 'M2 - Linh Giới';
    state.hasClearedTower50 = true;
    state.statusEffect = null;
    state.heavenlySuppressionTriggered = false;

    if (typeof playSound === 'function') {
        playSound('bell');
    }
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }

    addLog('🌌 <span class="text-amber-300 font-black tracking-widest">[ĐẮC ĐẠO PHI THĂNG]</span> Vượt qua 50 Tầng Trấn Yêu Tháp, chém vỡ gông cùm Thiên Đạo Hạ Giới, ngạo nghễ tiến nhập M2 - Linh Giới!', 'text-amber-300');
    addLog('✨ Toàn bộ phong ấn Tu Vi và Linh Thạch của Hạ Giới đã được giải trừ!', 'text-cyan-300');

    syncHeavenlySuppressionUI(false);
    updateHUD();
    saveGameState();

    const backdrop = document.getElementById('center-modal-backdrop');
    const box = document.getElementById('center-modal-box');
    if (backdrop && box) {
        box.innerHTML = `
            <div class="p-6 text-center space-y-4 text-slate-100">
                <i class="fa-solid fa-feather-pointed text-5xl text-amber-300 animate-bounce" aria-hidden="true"></i>
                <h2 class="text-2xl font-bold font-serif text-amber-200">PHI THĂNG LINH GIỚI THÀNH CÔNG!</h2>
                <p class="text-sm text-slate-300 leading-relaxed">
                    Đạo hữu đã chém gục Cửu U Huyết Ma Hoàng tại Đỉnh Tháp Tầng 50, phá toái hư không và phi thăng tiến nhập <strong class="text-cyan-300">M2 - Linh Giới</strong>.
                </p>
                <p class="text-xs text-amber-300/90 font-serif italic">
                    Gông cùm Thiên Đạo Hạ Giới đã hoàn toàn tiêu tan. Bể linh khí bao la và con đường đại đạo vô tận đang rộng mở!
                </p>
                <button class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold font-serif text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer transition" type="button" onclick="closeCenterModal()">
                    BƯỚC VÀO LINH GIỚI
                </button>
            </div>
        `;
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');
    }
}
window.performAscensionToLinhGioi = performAscensionToLinhGioi;

function showForcedAscensionNotice() {
    // Thay thế popup cũ bằng logic điều hướng phi thăng chuẩn
    if (isHeavenlySuppressed()) {
        showHeavenlySuppressionInfoModal();
    }
}

function spendCombatMp(mpCost) {
    const cost = Math.max(0, Number(mpCost) || 0) * (getActiveFoundationEffects().mpCostMultiplier || 1);
    const spent = Math.min(state.mp, cost);
    state.mp = Math.max(0, state.mp - spent);
    updateHUD();
    return spent;
}

function completeSpatialRift(forced = false) {
    if (!isHeavenlySuppressed()) {
        addLog('Đạo hữu chưa đạt ngưỡng Thiên Đạo Áp Chế để Phi Thăng.', 'text-slate-400');
        return;
    }
    const hasCleared = Boolean(state.hasClearedTower50 || (state.towerFloor && state.towerFloor > 50));
    if (!hasCleared) {
        addLog('⚠️ Thiên Đạo cấm chế cực độ! Bắt buộc phải đả thông Tầng 50 Trấn Yêu Tháp mới có thể mở Không Gian Liệt Phùng!', 'text-rose-400');
        if (typeof openDemonTowerModal === 'function') openDemonTowerModal('fight');
        return;
    }
    performAscensionToLinhGioi();
}
/**
 * ============================================================================
 * HỆ THỐNG ĐIỂM CHIẾN LỰC (COMBAT POWER - CP) TOÀN DIỆN
 * ============================================================================
 * Hệ số quy đổi cơ bản (Base Weights):
 * - 1 Khí Huyết (HP) = 1 Điểm
 * - 1 Linh Lực (MP) = 2 Điểm
 * - 1 Công Kích (ATK) = 15 Điểm
 * - 1 Phòng Ngự (DEF) = 20 Điểm
 * - 1% Bạo Kích / Né Tránh (Crit/Dodge) = 50 Điểm
 *
 * Tổng hợp từ 4 nguồn:
 * 1. [Căn Cơ]: level, cảnh giới, và điểm cộng của Linh Căn.
 * 2. [Trang Bị]: Vũ khí, Đạo bào, Trang sức + Hệ số Phẩm chất (Trắng x1, Xanh x1.2, Tím x1.5, Vàng x2) + Cường hóa.
 * 3. [Công Pháp]: Cộng thẳng Passive (Tâm Pháp) + nhân hệ số uy lực Active Skill (Vũ Kỹ, Thể Thuật).
 * 4. [Linh Thú/Hộ Pháp]: Cộng 100% chỉ số của Linh thú đang xuất chiến.
 */
function getCombatPowerBreakdown(target = state) {
    const s = target || (typeof state !== 'undefined' ? state : {});
    const realmIndex = s.realmIndex || 0;
    const currentRealm = (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[realmIndex])
        ? REALMS[realmIndex]
        : { baseHp: 500, baseMp: 200, baseAtk: 28, def: 14, majorIndex: 0 };
    const realmStage = Number.isFinite(s.realmStage) ? s.realmStage : (currentRealm.majorIndex || 0);

    // 1. [CĂN CƠ]: Cảnh giới, level và Linh Căn (Kế thừa bậc hàm mũ của Cảnh Giới)
    const baseHp = Number(s.baseHp) || Number(currentRealm.baseHp) || 500;
    const baseMp = Number(s.baseMp) || Number(currentRealm.baseMp) || 200;
    const baseAtk = Number(s.baseAtk) || Number(currentRealm.baseAtk) || (28 * (currentRealm.attackMultiplier || 1));
    const baseDef = Number(s.baseDef) || Number(currentRealm.baseDef) || Number(currentRealm.def) || 14;

    const metal = typeof getPillarLevel === 'function' ? getPillarLevel('metal') * getPillarEfficiency('metal') : 0;
    const wood = typeof getPillarLevel === 'function' ? getPillarLevel('wood') * getPillarEfficiency('wood') : 0;
    const water = typeof getPillarLevel === 'function' ? getPillarLevel('water') * getPillarEfficiency('water') : 0;
    const fire = typeof getPillarLevel === 'function' ? getPillarLevel('fire') * getPillarEfficiency('fire') : 0;
    const earth = typeof getPillarLevel === 'function' ? getPillarLevel('earth') * getPillarEfficiency('earth') : 0;

    const resonanceMult = (typeof getResonance === 'function') ? (1 + getResonance().bonus) : 1;
    const chaosMult = (typeof getRootConfig === 'function' && getRootConfig()?.tier === 'chaos') ? 1.5 : 1;

    const rootHp = (120 + 25 * wood) * resonanceMult * chaosMult;
    const rootMp = (20 + 5 * water) * resonanceMult * chaosMult;
    const rootAtk = (12 + 2 * metal + 8 * fire) * resonanceMult * chaosMult;
    const rootDef = (8 + 1.8 * earth) * resonanceMult * chaosMult;
    const rootCrit = (0.3 * fire);

    const canCoHp = baseHp + rootHp;
    const canCoMp = baseMp + rootMp;
    const canCoAtk = baseAtk + rootAtk;
    const canCoDef = baseDef + rootDef;
    const canCoCrit = (s.crit || 5) + rootCrit;
    const canCoDodge = s.dodge || 5;
    const realmBonus = (realmStage + 1) * 300 + (realmIndex + 1) * 50;

    // Base Weights: 1 HP = 1, 1 MP = 2, 1 ATK = 15, 1 DEF = 20, 1% Crit/Dodge = 50
    const canCoCP = Math.round(
        (canCoHp * 1) +
        (canCoMp * 2) +
        (canCoAtk * 15) +
        (canCoDef * 20) +
        ((canCoCrit + canCoDodge) * 50) +
        realmBonus
    );

    // 2. [TRANG BỊ]: Vũ khí, Đạo bào, Trang sức + Hệ số Phẩm chất + Cường hóa
    let equipmentCP = 0;
    const inventory = Array.isArray(s.inventory) ? s.inventory : [];
    const equippedItems = inventory.filter(i => i && i.equipped);

    equippedItems.forEach(item => {
        const itemHp = Number(item.hpBonus) || 0;
        const itemMp = Number(item.mpBonus) || 0;
        const itemAtk = Number(item.atkBonus) || 0;
        const itemDef = Number(item.defBonus) || 0;
        const itemCrit = Number(item.critBonus) || 0;
        const itemDodge = Number(item.dodgeBonus) || 0;

        const rawItemCP = (itemHp * 1) + (itemMp * 2) + (itemAtk * 15) + (itemDef * 20) + ((itemCrit + itemDodge) * 50);

        // Hệ số nhân theo Phẩm chất: Trắng x1, Xanh x1.2, Tím x1.5, Vàng x2
        const rarity = Number(item.rarity) || 1;
        let qualityMult = 1.0;
        if (rarity <= 1) qualityMult = 1.0;          // Phẩm trắng
        else if (rarity <= 3) qualityMult = 1.2;     // Phẩm xanh (Lục/Lam)
        else if (rarity === 4) qualityMult = 1.5;    // Phẩm tím (Địa phẩm)
        else qualityMult = 2.0;                      // Phẩm vàng/đỏ (Thiên phẩm)

        // Điểm Cường hóa (Lò Rèn)
        const enhanceLevel = Number(item.enhanceLevel || item.refineLevel || 0);
        const forgeLevel = Number(s.forgeLevel || 0);
        const forgeBonus = enhanceLevel * 100 + forgeLevel * 25;

        const itemBaseScore = rawItemCP > 0 ? rawItemCP : (rarity * 120);
        const itemTotalCP = Math.round(itemBaseScore * qualityMult + forgeBonus);
        equipmentCP += itemTotalCP;
    });

    // 3. [CÔNG PHÁP]: Passive (Tâm Pháp) + Active Skill uy lực (Vũ Kỹ, Thể Thuật)
    let skillsCP = 0;
    const equippedSkills = Array.isArray(s.equippedSkills) ? s.equippedSkills : [];
    const learnedSkills = Array.isArray(s.learnedSkills) ? s.learnedSkills : [];
    const skillsDataSource = (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA)) ? SKILLS_DATA : [];

    let flatAtk = 0, flatDef = 0, flatHp = 0, flatMp = 0, critAdd = 0, dodgeAdd = 0;
    let percentAtk = 0, percentDef = 0, percentHp = 0, percentMp = 0;
    let activeSkillsPowerCP = 0;

    // Check synergy ngũ hành nếu có
    const synergy = (typeof checkFiveElementsSynergy === 'function')
        ? checkFiveElementsSynergy(equippedSkills.map(id => skillsDataSource.find(x => x.id === id)).filter(Boolean))
        : { bonusMult: 1.0 };
    const martialMult = synergy.bonusMult || 1.0;

    // Duyệt qua tất cả kỹ năng đã trang bị + passive Bí Thuật đã học
    const allRelevantSkills = [];
    equippedSkills.forEach(id => {
        const tmpl = skillsDataSource.find(x => x.id === id);
        if (tmpl) allRelevantSkills.push(tmpl);
    });
    learnedSkills.forEach(owned => {
        const tmpl = skillsDataSource.find(x => x.id === owned.id);
        if (tmpl && (tmpl.type === 'BiThuat' || tmpl.category === 'bi_thuat') && !allRelevantSkills.some(x => x.id === tmpl.id)) {
            allRelevantSkills.push(tmpl);
        }
    });

    allRelevantSkills.forEach(skill => {
        const owned = learnedSkills.find(x => x.id === skill.id);
        const level = owned?.level || 1;
        const masteryCfg = (typeof MASTERY_LEVELS !== 'undefined' && MASTERY_LEVELS[level - 1]) ? MASTERY_LEVELS[level - 1] : { mult: 1.0 };
        const masteryMultiplier = masteryCfg.mult || 1.0;
        const stats = skill.stats || {};

        const isMartial = skill.type === 'VuKy' || skill.category === 'vu_ky' || skill.category === 'cong_kich' || skill.type === 'TheThuat' || skill.category === 'the_thuat' || skill.type === 'ThanPhap' || skill.category === 'than_phap';
        const branchFactor = isMartial ? martialMult : 1.0;
        const totalFactor = masteryMultiplier * branchFactor;

        // Passive stats
        if (stats.atk) flatAtk += stats.atk * totalFactor;
        if (stats.atkPercent) percentAtk += stats.atkPercent * totalFactor;
        if (stats.def) flatDef += stats.def * totalFactor;
        if (stats.defPercent) percentDef += stats.defPercent * totalFactor;
        if (stats.hp) flatHp += stats.hp * totalFactor;
        if (stats.hpPercent) percentHp += stats.hpPercent * totalFactor;
        if (stats.maxMp) flatMp += stats.maxMp * totalFactor;
        if (stats.maxMpPercent) percentMp += stats.maxMpPercent * totalFactor;
        if (stats.critRate) critAdd += stats.critRate * 100 * totalFactor;
        if (stats.dodgeRate) dodgeAdd += stats.dodgeRate * 100 * totalFactor;

        // Active skill power bonus: nhân hệ số uy lực
        if (isMartial || skill.type === 'TheThuat' || skill.type === 'ThanPhap') {
            const tierMultipliers = { pham: 1.0, linh: 1.25, huyen: 1.5, dia: 1.8, thien: 2.2 };
            const tierMult = tierMultipliers[skill.tier] || 1.2;
            const skillBaseDmg = stats.damage || (tierMult * 80);
            activeSkillsPowerCP += Math.round(skillBaseDmg * totalFactor * 5);
        }
    });

    const passiveCP = (flatHp * 1) + (flatMp * 2) + (flatAtk * 15) + (flatDef * 20) + ((critAdd + dodgeAdd) * 50) +
        (baseHp * percentHp * 1) + (baseMp * percentMp * 2) + (baseAtk * percentAtk * 15) + (baseDef * percentDef * 20);

    skillsCP = Math.round(passiveCP + activeSkillsPowerCP);

    // 4. [LINH THÚ / HỘ PHÁP]: Cộng 100% chỉ số Linh thú đang xuất chiến & cấp độ bồi dưỡng
    let petCP = 0;
    const petKey = s.activePet || 'fox';
    const petLvl = Number(s.petLevel) || 1;
    const petTier = Number(s.petTier) || 1;
    const bloodlineTiers = typeof PET_BLOODLINE_TIERS !== 'undefined' ? PET_BLOODLINE_TIERS : [];
    const bloodlineMult = (bloodlineTiers[petTier - 1]?.atkMult) || 1.0;

    const divinePets = typeof DIVINE_PETS_DATA !== 'undefined' ? DIVINE_PETS_DATA : [];
    const activeDivinePet = divinePets.find(p => p.id === petKey);

    if (activeDivinePet) {
        petCP = Math.round(((activeDivinePet.baseCp || 12000) + (petLvl - 1) * 2500) * bloodlineMult);
    } else {
        const petsSource = (typeof GUARDIAN_PETS !== 'undefined') ? GUARDIAN_PETS : {};
        const pet = petsSource[petKey];
        if (pet && pet.stats) {
            const petHp = Number(pet.stats.hp) || 0;
            const petMp = Number(pet.stats.mp) || 0;
            const petAtk = Number(pet.stats.atk) || 0;
            const petDef = Number(pet.stats.def) || 0;
            const petCrit = Number(pet.stats.crit) || 0;
            const petDodge = Number(pet.stats.dodge) || 0;
            petCP = Math.round(((petHp * 1) + (petMp * 2) + (petAtk * 15) + (petDef * 20) + ((petCrit + petDodge) * 50) + (petLvl - 1) * 2000) * bloodlineMult);
        } else {
            petCP = Math.round((2525 + (petLvl - 1) * 2000) * bloodlineMult);
        }
    }

    // 5. [TÔNG MÔN]: Buff môn phái Hạ Giới (Thanh Vân Môn 10% HP, Huyết Hồn Cốc 10% ATK, Tán Tu Minh 10% Linh Thạch)
    let sectCP = 0;
    if (s.playerSect === 'thanh_van') {
        sectCP = Math.round(baseHp * 0.10 * 1);
    } else if (s.playerSect === 'huyet_hon') {
        sectCP = Math.round(baseAtk * 0.10 * 15);
    } else if (s.playerSect === 'tan_tu') {
        sectCP = 150;
    }

    const statSummary = (typeof calculateTotalStats === 'function') ? calculateTotalStats(s) : null;
    const formulaCP = statSummary ? statSummary.combatPower : Math.round((canCoAtk * 2) + (canCoDef * 1.5) + (canCoHp * 0.1));

    // 6. [NHÂN QUẢ ĐẠO THỂ & ĐẠO LỮ]: Buff Ma Tôn (+600 CP) hoặc Chân Tiên (+500 CP) và buff Đạo Lữ
    let karmaCP = 0;
    if ((s.demonicKarma || 0) >= 40) {
        karmaCP = 600;
    } else if ((s.righteousKarma || 0) >= 40) {
        karmaCP = 500;
    }
    const companionBonus = s.companionBuffs ? Math.round(((s.companionBuffs.hp || 0) * 1) + ((s.companionBuffs.atk || 0) * 15) + ((s.companionBuffs.def || 0) * 20)) : 0;

    let total = canCoCP + equipmentCP + skillsCP + petCP + sectCP + karmaCP + companionBonus;

    // Hình phạt Trọng Thương do Thiên Kiếp đánh bại: Giảm 50%
    if (s.heavyInjuryUntil && Date.now() < s.heavyInjuryUntil) {
        total = Math.max(1, Math.round(total * 0.5));
    }

    return {
        total: Math.max(10, total),
        formulaCP,
        canCo: canCoCP,
        equipment: equipmentCP,
        skills: skillsCP,
        pet: petCP,
        sect: sectCP
    };
}

function calculateCombatPower(target = state) {
    return getCombatPowerBreakdown(target).total;
}

function calculateCP(totalAtk, totalDef, totalHp) {
    if (typeof totalAtk === 'object' && totalAtk !== null) {
        const stats = totalAtk.totalStats || totalAtk.total || totalAtk;
        const atk = Number(stats.atk) || 0;
        const def = Number(stats.def) || 0;
        const hp = Number(stats.maxHp || stats.hp) || 0;
        return Math.round((atk * 2) + (def * 1.5) + (hp * 0.1));
    }
    const atk = Number(totalAtk) || 0;
    const def = Number(totalDef) || 0;
    const hp = Number(totalHp) || 0;
    return Math.round((atk * 2) + (def * 1.5) + (hp * 0.1));
}

function getCombatPower(target = state) {
    return calculateCombatPower(target);
}

window.calculateCP = calculateCP;
window.getCombatPowerBreakdown = getCombatPowerBreakdown;
window.calculateCombatPower = calculateCombatPower;
window.getCombatPower = getCombatPower;
function applyRealmBaseStats(realm = REALMS[state.realmIndex]) {
    if (!realm) return;
    state.baseHp = Number(realm.baseHp) || 500;
    state.baseMp = Number(realm.baseMp) || 200;
    state.baseAtk = Number(realm.baseAtk) || 28;
    state.baseDef = Number(realm.baseDef || realm.def) || 14;
    if (realm.majorIndex !== undefined) {
        state.realmStage = realm.majorIndex;
    }
    if (typeof calculateTotalStats === 'function') {
        calculateTotalStats(state);
    } else {
        state.atk = state.baseAtk;
        state.def = state.baseDef;
        state.maxHp = state.baseHp;
        state.maxMp = state.baseMp;
        state.hp = state.maxHp;
        state.mp = state.maxMp;
    }
    if (typeof syncGameState === 'function') {
        syncGameState(state);
    }
}
window.applyRealmBaseStats = applyRealmBaseStats;
function advanceMinorRealm() {
            const currentRealm = REALMS[state.realmIndex];
            const nextRealm = REALMS[state.realmIndex + 1];
            if (!nextRealm || currentRealm.isMajorBottleneck || state.exp < currentRealm.maxExp) return false;
            const suppressed = isHeavenlyRejected();
            state.realmIndex++;
            if (state.level !== undefined) state.level++;
            else state.level = state.realmIndex + 1;
            if (typeof triggerLevelUpAura === 'function') triggerLevelUpAura();
            state.exp -= currentRealm.maxExp;
            applyRealmBaseStats(nextRealm);
            if (typeof updateCharacterModel === 'function') {
                updateCharacterModel(nextRealm.themeKey || state.realmIndex);
            }
            addLog(`✨ <span class="text-jade-300 font-bold">Tiểu cảnh giới viên mãn:</span> Đột phá 100% thành công, tiến vào <span class="text-gold-300 font-bold">${nextRealm.name}</span>.`, "text-emerald-300");
            checkHeavenlySuppression(state);
            saveGameState();
            return true;
        }
function isHardCapReached() {
    const currentRealm = REALMS[state.realmIndex];
    if (!currentRealm) return false;
    const isHoaThanVienMan = currentRealm.name === 'Hóa Thần - Viên Mãn' || (currentRealm.majorRealm === 'Hóa Thần' && currentRealm.minorStage === 'Viên Mãn') || state.realmIndex >= REALMS.length - 1;
    const isHaGioi = !state.currentWorld || state.currentWorld === 'HaGioi' || String(state.currentWorld).includes('Hạ Giới');
    return Boolean(isHoaThanVienMan && isHaGioi);
}
window.isHardCapReached = isHardCapReached;

function addExp(amount, deferHud = false) {
            const currentRealm = REALMS[state.realmIndex];
            if (!currentRealm || state.isDead) return { rawAmount: 0, gainedAmount: 0 };
            // Bể chứa Tu Vi là VÔ HẠN: Ngay cả khi đạt bình cảnh, Tu Vi vẫn tiếp tục tích lũy vô hạn
            const { rawAmount, gainedAmount } = getAdjustedCultivationGain(amount);
            if (gainedAmount <= 0) return { rawAmount, gainedAmount: 0 };
            state.exp = (Number(state.exp) || 0) + gainedAmount;
            if (!deferHud) updateHUD();
            return { rawAmount, gainedAmount };
        }
window.addExp = addExp;
let lastLogRawMessage = null;
let lastLogActionId = null;
let lastLogCount = 1;
let lastLogElement = null;
let lastLogTimeStr = '';
let lastLogAccumulatedRewards = null;
let lastLogTimestamp = 0;
let lastFlashTimeout = null;

function resetLogTracking() {
    lastLogRawMessage = null;
    lastLogActionId = null;
    lastLogCount = 1;
    lastLogElement = null;
    lastLogTimeStr = '';
    lastLogAccumulatedRewards = null;
    lastLogTimestamp = 0;
    if (lastFlashTimeout) {
        clearTimeout(lastFlashTimeout);
        lastFlashTimeout = null;
    }
}

function resolveLogColorClass(type) {
    if (!type || typeof type !== 'string') return 'text-slate-300';
    if (type.startsWith('text-')) return type;
    const typeMap = {
        reward: 'text-emerald-300',
        success: 'text-emerald-400',
        danger: 'text-rose-400',
        error: 'text-rose-400',
        warning: 'text-amber-300',
        info: 'text-slate-300',
        gold: 'text-gold-300',
        cyan: 'text-cyan-300',
        pink: 'text-pink-300'
    };
    return typeMap[type] || 'text-slate-300';
}

function parseLogRewards(message, extraRewards = null) {
    const rewards = {};
    if (extraRewards && typeof extraRewards === 'object') {
        for (const [k, v] of Object.entries(extraRewards)) {
            if (Number(v) > 0) rewards[k] = Number(v);
        }
    }
    if (!message) return Object.keys(rewards).length > 0 ? rewards : null;
    const cleanText = message.replace(/<[^>]*>/g, ' ');

    // Match "+X Linh Thạch" or "X Linh Thạch"
    const stoneMatch = cleanText.match(/(?:\+|\b)(\d[\d,\.]*)\s*Linh Thạch/i);
    if (stoneMatch) {
        rewards['Linh Thạch'] = (rewards['Linh Thạch'] || 0) + parseInt(stoneMatch[1].replace(/[,.]/g, ''), 10);
    }

    // Match "+X Tu Vi" or "X Tu Vi"
    const expMatch = cleanText.match(/(?:\+|\b)(\d[\d,\.]*)\s*Tu Vi/i);
    if (expMatch) {
        rewards['Tu Vi'] = (rewards['Tu Vi'] || 0) + parseInt(expMatch[1].replace(/[,.]/g, ''), 10);
    }

    // Match "+X Linh Khí" or "X Linh Khí"
    const qiMatch = cleanText.match(/(?:\+|\b)(\d[\d,\.]*)\s*Linh Khí/i);
    if (qiMatch) {
        rewards['Linh Khí'] = (rewards['Linh Khí'] || 0) + parseInt(qiMatch[1].replace(/[,.]/g, ''), 10);
    }

    // Match general items: "10 Huyền Thiết", "1 Hạt Huyết Ngọc Sâm", "2 Tử Linh Chi"
    const harvestSegment = cleanText.split(/Thu hoạch:|\bnhận\b|\bthu nạp\b|\bthu được\b/i)[1] || cleanText;
    const itemRegex = /(?:\+?\s*)(\d[\d,\.]*)\s+([A-ZÀ-Ỹa-zà-ỹ\s0-9]{2,30}?)(?=[,\.!\?]|$)/g;
    let match;
    while ((match = itemRegex.exec(harvestSegment)) !== null) {
        const qty = parseInt(match[1].replace(/[,.]/g, ''), 10);
        const name = match[2].trim();
        if (['Linh Thạch', 'Tu Vi', 'Linh Khí'].some(c => name.toLowerCase().includes(c.toLowerCase()))) {
            continue;
        }
        if (name && !name.toLowerCase().startsWith('lần') && !name.toLowerCase().startsWith('giây')) {
            rewards[name] = (rewards[name] || 0) + qty;
        }
    }

    return Object.keys(rewards).length > 0 ? rewards : null;
}

function formatRewardsSummary(rewards) {
    if (!rewards) return '';
    const parts = [];
    if (rewards['Linh Thạch']) parts.push(`+${rewards['Linh Thạch'].toLocaleString('vi-VN')} Linh Thạch`);
    if (rewards['Tu Vi']) parts.push(`+${rewards['Tu Vi'].toLocaleString('vi-VN')} Tu Vi`);
    if (rewards['Linh Khí']) parts.push(`+${rewards['Linh Khí'].toLocaleString('vi-VN')} Linh Khí`);
    for (const [key, qty] of Object.entries(rewards)) {
        if (!['Linh Thạch', 'Tu Vi', 'Linh Khí'].includes(key) && qty > 0) {
            parts.push(`${qty.toLocaleString('vi-VN')} ${key}`);
        }
    }
    return parts.join(', ');
}

function addLog(message, type = "text-slate-300", actionId = null, extraRewards = null) {
    if (!message) return;
    const logBox = document.getElementById('cultivation-log');
    if (!logBox) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const colorClass = resolveLogColorClass(type);
    const effectiveActionId = actionId || message;
    const currentRewards = parseLogRewards(message, extraRewards);

    // Tìm phần tử log cuối cùng (targetElement): ưu tiên lastLogElement nếu còn trong DOM, hoặc logBox.lastElementChild
    const lastNodeInBox = logBox.lastElementChild || (logBox.children ? logBox.children[logBox.children.length - 1] : null);
    const targetElement = (lastLogElement && logBox.contains(lastLogElement))
        ? lastLogElement
        : ((lastNodeInBox && actionId && lastNodeInBox.getAttribute && lastNodeInBox.getAttribute('data-action-id') === actionId) ? lastNodeInBox : null);

    // Kiểm tra gộp tin nhắn (Message Stacking): cùng actionId hoặc cùng nội dung liên tiếp
    const isConsecutive = (targetElement && logBox.contains(targetElement));
    const isSameAction = Boolean(actionId && lastLogActionId === actionId);
    const isSameMessage = (message === lastLogRawMessage);

    if (isConsecutive && (isSameAction || isSameMessage)) {
        lastLogCount++;

        // Cộng dồn lượng phần thưởng (Sum: Linh Thạch, Tu Vi, Vật phẩm)
        if (currentRewards) {
            if (!lastLogAccumulatedRewards) lastLogAccumulatedRewards = {};
            for (const [k, v] of Object.entries(currentRewards)) {
                lastLogAccumulatedRewards[k] = (lastLogAccumulatedRewards[k] || 0) + v;
            }
        }

        // Tách base title và định dạng gộp tin nhắn
        let updatedHtml = '';
        const hasRewardSummary = (actionId || extraRewards || /Thu hoạch:/i.test(message)) && lastLogAccumulatedRewards && Object.keys(lastLogAccumulatedRewards).length > 0;
        if (hasRewardSummary) {
            let baseTitle = message.split(/!\s*Thu hoạch:|Thu hoạch:|\bhấp thu\b/i)[0].trim().replace(/!$/, '');
            if (!baseTitle) {
                baseTitle = message.replace(/[\.\!]+$/, '');
            }
            updatedHtml = `<span class="text-slate-500 font-mono mr-1">[${lastLogTimeStr}]</span>${baseTitle} <span class="text-amber-400 font-bold font-mono ml-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-[10px] shadow-sm select-none" data-count="${lastLogCount}">(x${lastLogCount} lần)</span>! Tổng thu hoạch: <span class="text-emerald-400 font-semibold">${formatRewardsSummary(lastLogAccumulatedRewards)}</span>.`;
        } else {
            updatedHtml = `<span class="text-slate-500 font-mono mr-1">[${lastLogTimeStr}]</span>${lastLogRawMessage} <span class="text-amber-400 font-bold font-mono ml-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-[10px] shadow-sm select-none" data-count="${lastLogCount}">(x${lastLogCount})</span>`;
        }

        targetElement.innerHTML = updatedHtml;
        if (targetElement.setAttribute) {
            targetElement.setAttribute('data-count', String(lastLogCount));
        }

        // Visual Feedback: chớp sáng nhẹ (flash/highlight màu vàng nhạt) trong 0.2s
        if (lastFlashTimeout) {
            clearTimeout(lastFlashTimeout);
            lastFlashTimeout = null;
        }
        if (targetElement.classList) {
            targetElement.classList.add('log-stack-flash');
        }
        if (targetElement.style) {
            targetElement.style.backgroundColor = 'rgba(254, 240, 138, 0.25)';
            targetElement.style.boxShadow = '0 0 10px rgba(250, 204, 21, 0.4)';
        }
        const flashTarget = targetElement;
        lastFlashTimeout = setTimeout(() => {
            if (flashTarget) {
                if (flashTarget.classList) flashTarget.classList.remove('log-stack-flash');
                if (flashTarget.style) {
                    flashTarget.style.backgroundColor = '';
                    flashTarget.style.boxShadow = '';
                }
            }
            lastFlashTimeout = null;
        }, 200);

        const plainMessage = updatedHtml.replace(/<[^>]*>/g, '');
        if (recentSystemLogs.length > 0) {
            recentSystemLogs[recentSystemLogs.length - 1] = plainMessage;
        }
        logBox.scrollTop = logBox.scrollHeight;
        return;
    }

    // Tin nhắn mới (không gộp) -> Tạo thẻ <p> mới
    lastLogRawMessage = message;
    lastLogActionId = actionId;
    lastLogCount = 1;
    lastLogTimeStr = timeStr;
    lastLogAccumulatedRewards = currentRewards ? { ...currentRewards } : null;
    lastLogTimestamp = Date.now();

    let categoryBadge = '';
    if (/Thiên Kiếp|Lôi Kiếp|Độ Kiếp/i.test(message)) {
        categoryBadge = '<span class="text-purple-300 font-semibold px-1 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-[9px] mr-1 select-none">[Lôi Kiếp]</span>';
    } else if (/Đột Phá|Cảnh giới|Đăng Tiên/i.test(message)) {
        categoryBadge = '<span class="text-amber-300 font-semibold px-1 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] mr-1 select-none">[Đột Phá]</span>';
    } else if (/Luyện Đan|Luyện Khí|Động Phủ|Gia Viên|Thu hoạch|Song Tu/i.test(message)) {
        categoryBadge = '<span class="text-emerald-300 font-semibold px-1 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] mr-1 select-none">[Kỳ Ngộ]</span>';
    } else if (/Trấn Yêu Tháp|Tâm Ma|Chiến|Trảm|Bại|Thắng/i.test(message)) {
        categoryBadge = '<span class="text-rose-300 font-semibold px-1 py-0.2 rounded bg-rose-950/80 border border-rose-500/40 text-[9px] mr-1 select-none">[Chiến Đấu]</span>';
    } else {
        categoryBadge = '<span class="text-cyan-300/80 font-semibold px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-[9px] mr-1 select-none">[Tu Luyện]</span>';
    }

    const item = document.createElement('p');
    item.className = `${colorClass} log-entry-slide transition-all duration-200`;
    item.innerHTML = `<span class="text-slate-500 font-mono mr-1">[${timeStr}]</span>${categoryBadge}${message}`;
    item.setAttribute('data-count', '1');
    if (actionId) item.setAttribute('data-action-id', actionId);
    logBox.appendChild(item);
    lastLogElement = item;

    const plainMessage = message.replace(/<[^>]*>/g, '');
    recentSystemLogs.push(`[${timeStr}] ${plainMessage}`);
    recentSystemLogs = recentSystemLogs.slice(-50);

    // Dọn rác (DOM Virtualization / Culling): Giữ tối đa 50 thẻ <p>
    const MAX_LOG_DOM_NODES = 50;
    while (logBox.children.length > MAX_LOG_DOM_NODES && logBox.firstElementChild) {
        const oldest = logBox.firstElementChild;
        if (oldest === lastLogElement) {
            lastLogElement = null;
        }
        oldest.remove();
    }
    logBox.scrollTop = logBox.scrollHeight;
}

function maybeAddM1ContextLog(context) {
    if (Math.random() >= 0.5) return;
    const messages = {
        cultivate: [
            "Linh lực xâu chuỗi kinh mạch, chu thiên vận chuyển thêm phần thuận lợi.",
            "Ngoài động phủ có Luyện Khí yêu thú lảng vảng; đạo hữu thu liễm khí tức, không mạo hiểm giao chiến."
        ],
        farm: [
            "Linh Điền thấm nhuần Mộc linh khí, dược hương lan khắp động phủ.",
            "Trong luống dược phát hiện linh diệp căng đầy, không có dấu hiệu sâu bệnh."
        ],
        alchemy: [
            "Lò Đan hấp thu Hỏa linh khí, đan hương quanh quẩn không tan.",
            "Hỏa hầu ổn định, dược lực không thất thoát ra ngoài đan lô."
        ]
    };
    const pool = messages[context] || messages.cultivate;
    addLog(pool[Math.floor(Math.random() * pool.length)]);
}

function getM1RealmRank(realmName) {
    const name = String(realmName || '');
    const qiLevel = name.match(/^Luyện Khí Tầng (10|[1-9])$/);
    if (qiLevel) return Number(qiLevel[1]);
    if (name === 'Luyện Khí Viên Mãn') return 10;
    const minorRank = { 'Sơ Kỳ': 1, 'Trung Kỳ': 2, 'Hậu Kỳ': 3, 'Viên Mãn': 4 };
    const match = name.match(/^(Luyện Khí|Trúc Cơ|Kim Đan|Nguyên Anh|Hóa Thần) - (Sơ Kỳ|Trung Kỳ|Hậu Kỳ|Viên Mãn)$/);
    if (!match) return 0;
    if (match[1] === 'Luyện Khí') return [1,4,7,10][minorRank[match[2]] - 1];
    return ({ 'Trúc Cơ': 10, 'Kim Đan': 14, 'Nguyên Anh': 18, 'Hóa Thần': 22 }[match[1]]) + minorRank[match[2]];
}

function getM1NestedAccess(snapshot = {}) {
    const rank = getM1RealmRank(snapshot.canh_gioi);
    const suppressed = String(snapshot.canh_gioi || '').startsWith('Hóa Thần - ')
        && (snapshot.vi_dien || HEAVENLY_REJECTION_RULES.triggeringWorld) === HEAVENLY_REJECTION_RULES.triggeringWorld;
    const inventory = snapshot.inventory || [];
    const countOf = name => inventory.find(item => (item.item || item.name) === name)?.qty ?? inventory.find(item => (item.item || item.name) === name)?.count ?? 0;
    const knowledge = new Set(snapshot.knowledge || []);
    const roles = new Set(snapshot.roles || []);
    const flags = new Set(snapshot.flags || []);
    const cultivationMax = Number(snapshot.tu_vi_max);
    const fullCultivation = Number(snapshot.tu_vi_percent || 0) >= 100
        || (Number.isFinite(cultivationMax) && cultivationMax > 0 && Number(snapshot.tu_vi || 0) >= cultivationMax);
    const tribulationLock = rank === 22 && fullCultivation;
    const unlocked = [], locked = [];
    Object.entries(M1_NESTED_FEATURES).forEach(([id, rule]) => {
        let allowed = rule.statusEffect
            ? suppressed && rule.statusEffect === HEAVENLY_REJECTION_RULES.statusEffect
            : rank >= rule.minRank;
        if (rule.minStones && Number(snapshot.linh_thach || 0) < rule.minStones && !flags.has('tung_so_huu_tren_10_linh_thach')) allowed = false;
        if (Object.entries(rule.items || {}).some(([name, qty]) => countOf(name) < qty)) allowed = false;
        if ((rule.knowledge || []).some(item => !knowledge.has(item))) allowed = false;
        if ((rule.roles || []).some(item => !roles.has(item))) allowed = false;
        if ((rule.flags || []).some(item => !flags.has(item))) allowed = false;
        if (rule.requiresFullCultivation && !fullCultivation) allowed = false;
        if (tribulationLock && rule.farming) allowed = false;
        (allowed ? unlocked : locked).push(id);
    });
    return {
        unlocked: ['btn_nhan_vat', 'btn_dong_phu', 'btn_the_gioi', ...unlocked],
        locked,
        tribulationLock
    };
}

function getLiveM1NestedAccess() {
    if ((state.stones || 0) > 10 && Array.isArray(state.progressionFlags) && !state.progressionFlags.includes('tung_so_huu_tren_10_linh_thach')) {
        state.progressionFlags.push('tung_so_huu_tren_10_linh_thach');
    }
    return getM1NestedAccess({
        canh_gioi: REALMS[state.realmIndex]?.name,
        tu_vi: state.exp,
        tu_vi_max: REALMS[state.realmIndex]?.maxExp,
        linh_thach: state.stones,
        inventory: state.inventory,
        knowledge: state.knowledge || [],
        roles: state.roles || [],
        flags: state.progressionFlags || [],
        vi_dien: state.currentWorld,
        status_effect: state.statusEffect
    });
}

function processM1NestedUIRequest(request = {}) {
    const player = request.player_state || {};
    const access = getM1NestedAccess({ ...player, inventory: request.inventory || [], knowledge: request.knowledge || [], roles: request.roles || [], flags: request.flags || [] });
    const realmIndex = REALMS.findIndex(realm => realm.name === player.canh_gioi);
    const suppressed = realmIndex >= 0 && isHeavenlyRejected({ realmIndex, currentWorld: player.vi_dien || HEAVENLY_REJECTION_RULES.triggeringWorld });
    return JSON.stringify({
        status: 'success',
        player_state: { canh_gioi: player.canh_gioi, tu_vi: player.tu_vi || 0, hp: player.hp || 0, mp: player.mp || 0, status_effect: suppressed ? HEAVENLY_REJECTION_RULES.statusEffect : null },
        unlocked_features: access.unlocked,
        locked_features: access.locked,
        ui_state: {
            tribulation_lock: access.tribulationLock,
            warning_tho_nguyen: false,
            active_hubs: ['btn_nhan_vat','btn_dong_phu','btn_the_gioi']
        },
        warning_tho_nguyen: false,
        action_log: access.tribulationLock ? ['[Hệ thống] Thiên Kiếp Đài đã kích hoạt; toàn bộ tính năng cày cuốc bị khóa.'] : []
    });
}

window.processM1NestedUIRequest = processM1NestedUIRequest;

function processFoundationRequest(request = {}) {
    const player = { ...(request.player || {}) };
    const rank = getM1RealmRank(player.canh_gioi);
    const source = request.can_co_state || {};
    const canCo = {
        linh_can: {
            pham_chat: source.linh_can?.pham_chat || getRootConfig().name,
            tier_id: source.linh_can?.tier_id || getRootConfig().tier,
            ngu_hanh: {
                Kim: Number(source.linh_can?.ngu_hanh?.Kim ?? 1),
                Moc: Number(source.linh_can?.ngu_hanh?.Moc ?? 1),
                Thuy: Number(source.linh_can?.ngu_hanh?.Thuy ?? 1),
                Hoa: Number(source.linh_can?.ngu_hanh?.Hoa ?? 1),
                Tho: Number(source.linh_can?.ngu_hanh?.Tho ?? 1)
            },
            cong_huong_active: "Chưa kích hoạt"
        },
        the_chat: {
            stage_index: Number(source.the_chat?.stage_index ?? 0),
            floor: Number(source.the_chat?.floor ?? 1),
            level: source.the_chat?.level || "Phàm Khu - Tầng 1",
            dac_tinh: source.the_chat?.dac_tinh || "Phàm Thể"
        },
        than_thuc: {
            is_unlocked: rank >= FOUNDATION_RULES.tabs.than_thuc.minRank,
            level: Number(source.than_thuc?.level ?? 0),
            scan_radius: Number(source.than_thuc?.scan_radius ?? 0)
        },
        menh_cach: {
            ngo_tinh: Math.min(100, Math.max(1, Number(source.menh_cach?.ngo_tinh ?? 1))),
            khi_van: Math.min(100, Math.max(1, Number(source.menh_cach?.khi_van ?? 1)))
        }
    };
    const inventory = Array.isArray(request.inventory)
        ? Object.fromEntries(request.inventory.map(item => [item.item_id || item.id, Number(item.amount ?? item.qty ?? item.count ?? 0)]))
        : { ...(request.inventory || {}) };
    const deductions = [];
    const logs = [];
    const fail = (errorCode, message) => JSON.stringify({ status: "error", error_code: errorCode, message, can_co_state: canCo, inventory_deduction: [] });
    const consume = (itemId, amount) => {
        const required = Math.max(0, Number(amount) || 0);
        if (Number(inventory[itemId] || 0) < required) return false;
        inventory[itemId] = Number(inventory[itemId] || 0) - required;
        deductions.push({ item_id: itemId, amount: required });
        return true;
    };

    const action = request.action;
    if (action === "upgrade_linh_can_element") {
        const keyMap = { Kim: "metal", Moc: "wood", Thuy: "water", Hoa: "fire", Tho: "earth" };
        const element = request.element;
        if (!keyMap[element]) return fail("INVALID_ELEMENT", "Ngũ Hành không hợp lệ.");
        const currentLevel = canCo.linh_can.ngu_hanh[element];
        if (currentLevel >= LINH_CAN_RULES.maxLevel) return fail('MAX_LEVEL', 'Linh Căn đã đạt Lv.100.');
        if (currentLevel >= 50 && !source.linh_can?.mutations?.[element]) return fail('AWAKENING_REQUIRED', 'Cần Thức Tỉnh Bản Nguyên để vượt Lv.50.');
        const cost = getPillarUpgradeCost(currentLevel, keyMap[element]);
        const currentSpiritualQi = Number(player.linh_khi_current ?? player.linh_khi ?? 0);
        if (currentSpiritualQi < cost) return fail("INSUFFICIENT_RESOURCE", `Không đủ Linh Khí, cần ${cost}.`);
        player.linh_khi_current = currentSpiritualQi - cost;
        canCo.linh_can.ngu_hanh[element]++;
        deductions.push({ item_id: "linh_khi", amount: cost });
        logs.push(`[Căn Cơ] Rót ${cost} Linh Khí, ${element} Linh Căn tăng lên Lv.${canCo.linh_can.ngu_hanh[element]}.`);
    } else if (action === "upgrade_linh_can_quality") {
        return fail("QUALITY_DERIVED_FROM_LEVEL", "Phẩm giai được quyết định bởi cấp nhánh Linh Căn; hãy rót Linh Khí hoặc Thức Tỉnh Bản Nguyên.");
    } else if (action === "upgrade_physique") {
        if (rank < FOUNDATION_RULES.tabs.the_chat.minRank) return fail("REALM_LOCKED", "Thể Chất mở từ Luyện Khí Tầng 3.");
        const resource = request.resource;
        const amount = Number(request.amount);
        if (!FOUNDATION_RULES.physiqueResources.includes(resource) || !(amount > 0)) return fail("COST_NOT_CONFIGURED", "Cần chỉ định Khí Huyết hoặc Yêu Đan và lượng tiêu hao.");
        if (!consume(resource, amount)) return fail("INSUFFICIENT_RESOURCE", "Không đủ tài nguyên Luyện Thể.");
        canCo.the_chat.floor++;
        canCo.the_chat.level = `${FOUNDATION_RULES.physiqueStages[canCo.the_chat.stage_index] || FOUNDATION_RULES.physiqueStages[0]} - Tầng ${canCo.the_chat.floor}`;
        logs.push(`[Luyện Thể] ${canCo.the_chat.level}, nhục thân được tôi luyện.`);
    } else if (action === "upgrade_consciousness") {
        if (!canCo.than_thuc.is_unlocked) return fail("REALM_LOCKED", "Chưa ngưng tụ đan hỏa");
        const resource = request.resource;
        const amount = Number(request.amount);
        if (!FOUNDATION_RULES.consciousnessResources.includes(resource) || !(amount > 0)) return fail("COST_NOT_CONFIGURED", "Cần chỉ định Dưỡng Hồn Mộc hoặc Hồn Thạch và lượng tiêu hao.");
        if (!consume(resource, amount)) return fail("INSUFFICIENT_RESOURCE", "Không đủ tài nguyên Dưỡng Hồn.");
        canCo.than_thuc.level++;
        if (Number.isFinite(Number(request.scan_radius_after))) canCo.than_thuc.scan_radius = Number(request.scan_radius_after);
        logs.push(`[Thần Thức] Thức Hải tăng lên cấp ${canCo.than_thuc.level}.`);
    } else if (action === "upgrade_destiny") {
        const itemId = request.item_id;
        const stat = FOUNDATION_RULES.destinyItems[itemId];
        const gain = Number(request.stat_gain);
        if (!stat || !(gain > 0)) return fail("INVALID_HEAVENLY_ITEM", "Vật phẩm Thiên Tiên hoặc mức tăng chưa hợp lệ.");
        if (!consume(itemId, 1)) return fail("INSUFFICIENT_RESOURCE", "Không sở hữu vật phẩm Thiên Tiên yêu cầu.");
        canCo.menh_cach[stat] = Math.min(100, canCo.menh_cach[stat] + gain);
        logs.push(`[Mệnh Cách] ${stat === "ngo_tinh" ? "Ngộ Tính" : "Khí Vận"} tăng ${gain} điểm.`);
    }

    const minElement = Math.min(...Object.values(canCo.linh_can.ngu_hanh));
    const resonanceLevel = Math.floor(minElement / ELEMENTAL_RESONANCE.step);
    const resonanceBonus = resonanceLevel * ELEMENTAL_RESONANCE.bonusPerStep;
    canCo.linh_can.cong_huong_active = resonanceLevel ? `Cấp ${resonanceLevel} (+${Math.round(resonanceBonus * 100)}% Toàn Thuộc Tính)` : "Chưa kích hoạt";
    const stats = { ...(request.player_stats || {}) };
    if (resonanceBonus) {
        ["hp_max", "mp_max", "atk", "def"].forEach(key => {
            if (Number.isFinite(Number(stats[key]))) stats[key] = Math.round(Number(stats[key]) * (1 + resonanceBonus));
        });
    }
    return JSON.stringify({
        status: "success",
        can_co_state: canCo,
        player_stats_update: stats,
        inventory_deduction: deductions,
        resource_state: { linh_thach: Number(player.linh_thach || 0), linh_khi: Number(player.linh_khi_current ?? player.linh_khi ?? 0), inventory },
        unlocked_tabs: Object.entries(FOUNDATION_RULES.tabs).filter(([, rule]) => rank >= rule.minRank).map(([id]) => id),
        action_log: logs
    });
}

window.processFoundationRequest = processFoundationRequest;

function getTitleRealmRank(realmName) {
    const normalized = String(realmName || '').replace(/\s*-\s*/g, ' ').trim();
    const qi = normalized.match(/^Luyện Khí(?: Tầng)? (10|[1-9])(?:\/Viên Mãn)?$/);
    if (qi) return Number(qi[1]);
    const stage = normalized.match(/^(Luyện Khí|Trúc Cơ|Kim Đan|Nguyên Anh|Hóa Thần) (Sơ Kỳ|Trung Kỳ|Hậu Kỳ|Viên Mãn|[1-4])$/);
    if (!stage) return getM1RealmRank(realmName);
    const stageValue = Number(stage[2]) || ({ 'Sơ Kỳ': 1, 'Trung Kỳ': 2, 'Hậu Kỳ': 3, 'Viên Mãn': 4 }[stage[2]]);
    if (stage[1] === 'Luyện Khí') return [1, 4, 7, 10][stageValue - 1];
    return ({ 'Trúc Cơ': 10, 'Kim Đan': 14, 'Nguyên Anh': 18, 'Hóa Thần': 22 }[stage[1]]) + stageValue;
}

function calculateTitleActualStats(baseStats = {}, titleId = 'nguy_linh_can') {
    const effects = DAO_FOUNDATION_TITLES[titleId]?.effects || {};
    const hp = Number(baseStats.hp ?? baseStats.hp_max ?? 0);
    const mp = Number(baseStats.mp ?? baseStats.mp_max ?? 0);
    const speed = Number(baseStats.tu_vi_speed_per_tick ?? 0);
    const mpCost = Number(baseStats.mp_cost_skill ?? 0);
    return {
        hp: Math.round(hp * (effects.hpMultiplier ?? 1)),
        mp: effects.mpMaxOverride === 0 ? 0 : Math.round(mp * (effects.mpMultiplier ?? 1)),
        tu_vi_speed_per_tick: Math.round(speed * (effects.cultivationSpeedMultiplier ?? 1)),
        mp_cost_skill: Math.round(mpCost * (effects.mpCostMultiplier ?? 1)),
        crit_rate: Number((Number(baseStats.crit_rate || 0) + (effects.critRateAdd || 0)).toFixed(4)),
        crit_dmg: Number((Number(baseStats.crit_dmg || 0) + (effects.critDamageAdd || 0)).toFixed(4)),
        elemental_dmg_multiplier: effects.elementalDamageMultiplier || 1,
        elemental_weakness_taken: effects.elementalWeaknessTaken || 1,
        mp_regen_percent: effects.mpRegenPercent || 0
    };
}

function processDaoFoundationTitleRequest(request = {}) {
    const action = request.Action || request.action;
    const titleId = request.title_id;
    const title = DAO_FOUNDATION_TITLES[titleId];
    if (!title) return JSON.stringify({ status: 'error', error_code: 'TITLE_NOT_FOUND' });
    const unlockedTitles = [...new Set(request.unlocked_titles || ['vo_linh_can', 'nguy_linh_can'])];
    if (!unlockedTitles.includes('vo_linh_can')) unlockedTitles.unshift('vo_linh_can');
    let activeTitle = request.active_title || 'nguy_linh_can';
    const inventory = Array.isArray(request.inventory)
        ? Object.fromEntries(request.inventory.map(item => [item.item || item.item_id || item.id, Number(item.qty ?? item.amount ?? item.count ?? 0)]))
        : { ...(request.inventory || {}) };
    const removed = [];
    const logs = [];
    const fail = (errorCode, message) => JSON.stringify({ status: 'error', error_code: errorCode, message, active_title: activeTitle, unlocked_titles: unlockedTitles, inventory_update: { removed: [] }, action_log: [] });

    if (action === 'Unlock_Title') {
        if (!unlockedTitles.includes(titleId)) {
            const rank = getTitleRealmRank(request.player?.canh_gioi);
            const elements = request.ngu_hanh || request.can_co_state?.linh_can?.ngu_hanh || {};
            const levels = ['Kim', 'Moc', 'Thuy', 'Hoa', 'Tho'].map(key => Number(elements[key] || 0));
            if (title.minRank && rank < title.minRank) return fail('REALM_CONDITION_NOT_MET', 'Cảnh giới chưa đạt điều kiện danh hiệu.');
            if (title.minElementsAtLevel && levels.filter(level => level >= title.minElementsAtLevel.level).length < title.minElementsAtLevel.count) return fail('ELEMENT_CONDITION_NOT_MET', 'Cấp Ngũ Hành chưa đạt điều kiện.');
            if (title.singleElementAtLeast && !(levels.filter(level => level >= title.singleElementAtLeast).length === 1 && levels.filter(level => level < title.otherElementsBelow).length === 4)) return fail('ELEMENT_CONDITION_NOT_MET', 'Thiên Linh Căn yêu cầu một hệ độc tôn và bốn hệ còn lại dưới Lv.5.');
            if (title.allElementsEqual && !levels.every(level => level === title.allElementsEqual)) return fail('ELEMENT_CONDITION_NOT_MET', 'Ngũ Hành chưa đồng thời đạt Lv.100.');
            const hpPercent = Number(request.player?.hp_current_percent ?? 100);
            if (title.maxHpPercent && hpPercent > title.maxHpPercent) return fail('HP_CONDITION_NOT_MET', 'Khí huyết hiện tại chưa xuống dưới ngưỡng yêu cầu.');
            const activeEvent = request.current_event || request.event;
            if (title.requiredEvent && activeEvent !== title.requiredEvent) return fail('EVENT_CONDITION_NOT_MET', 'Không ở trong sự kiện Thiên Kiếp.');
            for (const [itemId, qty] of Object.entries(title.requiredItems || {})) {
                if (Number(inventory[itemId] || 0) < qty) return fail('ITEM_CONDITION_NOT_MET', `Thiếu vật phẩm ${itemId}.`);
            }
            if (title.consumeItems) {
                Object.entries(title.requiredItems || {}).forEach(([itemId, qty]) => {
                    inventory[itemId] -= qty;
                    removed.push({ item: itemId, qty });
                });
            }
            unlockedTitles.push(titleId);
            const unlockLogs = {
                nguy_linh_can: '[Hệ thống] Đan Khí nhập thể, mở khóa Ngụy Linh Căn.',
                chan_linh_can: '[Hệ thống] Tẩy tủy thành công! Ngưng tụ Chân Linh Căn, hấp thu linh khí thiên địa mượt mà hơn hẳn!',
                thien_linh_can: '[Hệ thống] Thiên Đạo chúc phúc, một hệ độc tôn hóa thành Thiên Linh Căn!',
                di_linh_can: '[Hệ thống] Sinh tử trong Thiên Kiếp khiến Linh Căn phát sinh biến dị!',
                ngu_hanh_hon_nguyen: '[Hệ thống] Ngũ Hành quy nhất, chứng thành Ngũ Hành Hỗn Nguyên!'
            };
            logs.push(unlockLogs[titleId] || '[Hệ thống] Danh hiệu Căn Cơ đã mở khóa.');
        }
    } else if (action === 'Equip_Title') {
        if (!unlockedTitles.includes(titleId)) return fail('TITLE_NOT_UNLOCKED', 'Danh hiệu chưa được mở khóa.');
        activeTitle = titleId;
        logs.push(`[Hệ thống] Đã trang bị danh hiệu ${title.name}.`);
    } else {
        return fail('INVALID_ACTION', 'Action phải là Unlock_Title hoặc Equip_Title.');
    }

    return JSON.stringify({
        status: 'success',
        active_title: activeTitle,
        unlocked_titles: unlockedTitles,
        actual_stats: calculateTitleActualStats(request.base_stats || {}, activeTitle),
        inventory_update: { removed },
        inventory_state: inventory,
        action_log: logs
    });
}

window.processDaoFoundationTitleRequest = processDaoFoundationTitleRequest;

function processHeavenlyRejectionAction(request = {}) {
    return processCultivationRequest(request);
}

window.processHeavenlyRejectionAction = processHeavenlyRejectionAction;

function processHeavenlyRejectionCultivation(request = {}) {
    return processCultivationRequest({ ...request, action: 'Tick' });
}

window.processHeavenlyRejectionCultivation = processHeavenlyRejectionCultivation;

function processCultivationRequest(request = {}) {
    const input = request.player_state || {};
    const realmIndex = REALMS.findIndex(realm => realm.name === input.canh_gioi);
    if (realmIndex < 0) return JSON.stringify({ status: 'error', error_code: 'INVALID_REALM' });
    const target = {
        realmIndex,
        currentWorld: input.vi_dien || HEAVENLY_REJECTION_RULES.triggeringWorld,
        exp: Math.max(0, Number(input.current_tu_vi ?? input.tu_vi_hien_tai ?? input.tu_vi) || 0),
        forcedAscensionTriggered: Boolean(input.forced_ascension_triggered)
    };
    const action = request.Action || request.action || 'Status';
    let attempted = false;
    let leaked = false;
    let gained = 0;
    if (action === 'Tick') {
        const raw = Math.max(0, Number(request.tu_vi_nhan_duoc ?? request.raw_cultivation_gain) || 0);
        gained = isHeavenlyRejected(target)
            ? raw * HEAVENLY_REJECTION_RULES.cultivationGainMultiplier
            : raw;
        target.exp += gained;
    } else if (action === 'Breakthrough' || action === 'Dot_Pha') {
        attempted = true;
        const realm = REALMS[target.realmIndex];
        const next = REALMS[target.realmIndex + 1];
        if (!next || realm.isMajorBottleneck || target.exp < realm.maxExp) {
            return JSON.stringify({ ...getCultivationStatePayload(target, { breakthrough_attempted: true }), status: 'error', error_code: 'BREAKTHROUGH_NOT_READY' });
        }
        const suppressed = isHeavenlyRejected(target);
        target.realmIndex++;
        target.exp -= realm.maxExp;
        const leakChance = suppressed ? HEAVENLY_REJECTION_RULES.leakChanceByMinorStage[next.minorStage] || 0 : 0;
        leaked = leakChance > 0 && Math.random() < leakChance;
        if (leaked) {
            target.forcedAscensionTriggered = true;
            target.currentWorld = 'M2 - Linh Giới';
        }
    } else if (action !== 'Status') {
        return JSON.stringify({ status: 'error', error_code: 'INVALID_ACTION' });
    }
    if (isHeavenlyRejected(target) && REALMS[target.realmIndex].minorStage === 'Viên Mãn') {
        target.forcedAscensionTriggered = true;
        target.currentWorld = 'M2 - Linh Giới';
        leaked = true;
    }
    const response = getCultivationStatePayload(target, { breakthrough_attempted: attempted, leak_event_triggered: leaked });
    response.player_state = {
        canh_gioi: REALMS[target.realmIndex].name,
        vi_dien: target.currentWorld,
        tu_vi: target.exp,
        status_effect: isHeavenlyRejected(target) ? HEAVENLY_REJECTION_RULES.statusEffect : null,
        forced_ascension_triggered: target.forcedAscensionTriggered
    };
    response.action_log = leaked ? ['[Rò rỉ khí tức] Thiên Đạo khóa mục tiêu, Lôi Kiếp cưỡng chế Phi Thăng tới M2 - Linh Giới.']
        : gained ? [`[Thiên Đạo Áp Chế] Thu được ${gained.toLocaleString('vi-VN')} Tu Vi.`] : [];
    return JSON.stringify(response);
}
window.processCultivationRequest = processCultivationRequest;

function getFeatureAccess(realmIndex = state.realmIndex, exp = state.exp) {
    const realm = REALMS[realmIndex];
    const unlocked = [];
    const locked = [];
    Object.entries(FEATURE_UNLOCKS).forEach(([featureId, rule]) => {
        let isUnlocked = Number.isFinite(rule.minRealmIndex) && realmIndex >= rule.minRealmIndex;
        if (isUnlocked && rule.requiresFullBottleneck) {
            isUnlocked = Boolean(realm && (REALMS[realmIndex + 1] || isHardCapReached() || realmIndex >= REALMS.length - 1) && exp >= realm.maxExp);
        }
        (isUnlocked ? unlocked : locked).push(featureId);
    });
    return { unlocked, locked };
}

function isFeatureUnlocked(featureId) {
    if (featureId === 'btn_phi_thang') {
        const rule = FEATURE_UNLOCKS.btn_phi_thang;
        return Number.isFinite(rule?.minRealmIndex) && state.realmIndex >= rule.minRealmIndex;
    }
    return true;
}

function applyFeatureVisibility() {
    const access = getFeatureAccess();
    document.querySelectorAll('[data-feature-id]').forEach(element => {
        const unlocked = access.unlocked.includes(element.dataset.featureId);
        element.dataset.isLocked = String(!unlocked);
        element.classList.toggle('hidden', !unlocked);
        element.setAttribute('aria-hidden', String(!unlocked));
        if ('disabled' in element) element.disabled = !unlocked;
    });
    document.querySelectorAll('.feature-group').forEach(group => {
        const hasVisibleFeature = [...group.querySelectorAll('[data-feature-id]')].some(element => element.dataset.isLocked === 'false');
        group.classList.toggle('hidden', !hasVisibleFeature);
    });
    document.querySelectorAll('.feature-unlock-container').forEach(container => {
        const hasVisibleFeature = [...container.querySelectorAll('[data-feature-id]')].some(element => element.dataset.isLocked === 'false');
        container.classList.toggle('hidden', !hasVisibleFeature);
    });
}

function rejectLockedFeature(featureId, silent = false) {
    if (isFeatureUnlocked(featureId)) return false;
    if (!silent) {
        addLog(`🔒 <span class="text-amber-300 font-bold">[Tính năng chưa mở]</span> Cảnh giới hiện tại chưa đủ điều kiện.`, "text-amber-300");
    }
    return true;
}

function buildM1BackendOutput(resourceDelta = { stones: 0, jade: 0 }, logs = recentSystemLogs.slice(-2)) {
    const realm = REALMS[state.realmIndex];
    const stats = getEffectiveStats();
    const featureAccess = getFeatureAccess();
    return JSON.stringify({
        status: "success",
        player_update: {
            canh_gioi: realm.name,
            tu_vi_hien_tai: state.exp,
            tu_vi_max: realm.maxExp,
            khi_huyet: Math.min(state.hp, stats.maxHp),
            linh_luc: Math.min(state.mp, stats.maxMp),
            tho_nguyen: `${Math.floor(state.ageYears)}/${getThoNguyenMax()}`,
            linh_can: getRootConfig().name,
            the_chat: getPhysique().name,
            tu_chat: getAptitude().name,
            vi_dien: state.currentWorld,
            status_effect: state.statusEffect,
            trang_thai: state.exp >= realm.maxExp ? "Đủ Tu Vi - Có thể đột phá" : "Tu Luyện"
        },
        resources_update: {
            linh_thach: `${resourceDelta.stones >= 0 ? '+' : ''}${resourceDelta.stones}`,
            tien_ngoc: `${resourceDelta.jade >= 0 ? '+' : ''}${resourceDelta.jade}`
        },
        unlocked_features: featureAccess.unlocked,
        locked_features: featureAccess.locked,
        cultivation_state: getCultivationStatePayload().cultivation_state,
        ui_state: { warning_tho_nguyen: state.isDead },
        warning_tho_nguyen: state.isDead,
        thien_co_nhat_ky: logs.slice(-2)
    });
}

function processM1WebInput(input) {
    const required = ['canh_gioi_hien_tai', 'tu_vi_hien_tai', 'diem_linh_can', 'toc_do_van_cong_co_ban', 'trang_thai_auto'];
    const missing = required.filter(key => input?.[key] === undefined);
    if (missing.length) {
        return JSON.stringify({ status: "error", error_code: "MISSING_INPUT", required_fields: missing });
    }
    const realm = REALMS.find(item => item.name === input.canh_gioi_hien_tai);
    if (!realm) {
        return JSON.stringify({ status: "error", error_code: "INVALID_REALM", message: "Cảnh giới không thuộc M1 hoặc sai định dạng." });
    }
    const autoEnabled = input.trang_thai_auto === true || input.trang_thai_auto === "Bật";
    const baseRate = Math.max(0, Number(input.toc_do_van_cong_co_ban) || 0);
    const rootPoints = Math.max(0, Number(input.diem_linh_can) || 0);
    const rawCultivationGain = autoEnabled ? Math.round(baseRate * (1 + rootPoints / 100)) : 0;
    const rejected = realm.majorRealm === HEAVENLY_REJECTION_RULES.triggeringMajorRealm
        && (input.vi_dien || HEAVENLY_REJECTION_RULES.triggeringWorld) === HEAVENLY_REJECTION_RULES.triggeringWorld;
    const cultivationGain = rejected
        ? rawCultivationGain * HEAVENLY_REJECTION_RULES.cultivationGainMultiplier
        : rawCultivationGain;
    const nextExp = Math.max(0, Number(input.tu_vi_hien_tai) || 0) + cultivationGain;
    const featureAccess = getFeatureAccess(REALMS.indexOf(realm), nextExp);
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const logs = [`[${time}] ${autoEnabled
        ? rejected
            ? `[Hệ thống] Thiên Đạo Hạ Giới áp chế, linh khí hỗn loạn. Ngươi hấp thu ${rawCultivationGain.toLocaleString('vi-VN')} tu vi nhưng chỉ dung nạp được ${cultivationGain.toLocaleString('vi-VN')}.`
            : '[Tự động] Đan điền hấp thu hoàn tất, thu được ' + cultivationGain + ' tu vi.'
        : 'Auto đang Tắt, đan điền tạm ngưng nạp linh khí.'}`];
    if (nextExp >= realm.maxExp) logs.push(`[${time}] ${realm.isMajorBottleneck ? 'Tu vi đã viên mãn, chạm tới Bình Cảnh đại cảnh giới.' : 'Tu vi đã đủ để đột phá tiểu cảnh giới 100% thành công.'}`);
    return JSON.stringify({
        status: "success",
        player_update: {
            canh_gioi: realm.name,
            tu_vi_hien_tai: nextExp,
            tu_vi_max: realm.maxExp,
            khi_huyet: realm.baseHp,
            linh_luc: realm.baseMp,
            tho_nguyen: `${Math.floor(state.ageYears)}/${getThoNguyenMax()}`
        },
        resources_update: { linh_thach: "+0", tien_ngoc: "+0" },
        unlocked_features: featureAccess.unlocked,
        locked_features: featureAccess.locked,
        cultivation_state: getCultivationStatePayload({ realmIndex: REALMS.indexOf(realm), currentWorld: input.vi_dien || HEAVENLY_REJECTION_RULES.triggeringWorld, exp: nextExp }).cultivation_state,
        thien_co_nhat_ky: logs.slice(0, 2)
    });
}

window.buildM1BackendOutput = buildM1BackendOutput;
window.processM1WebInput = processM1WebInput;

function processQiRefiningRequest(request = {}) {
    const source = request.player_state || {};
    const levelMatch = String(source.canh_gioi || '').match(/^Luyện Khí Tầng (10|[1-9])(?:\/Viên Mãn)?$/);
    if (!levelMatch) return JSON.stringify({ status: "error", error_code: "INVALID_QI_REFINING_REALM" });
    const level = Number(levelMatch[1]);
    const inventory = Array.isArray(request.inventory) ? request.inventory.map(item => ({ ...item })) : [];
    const flags = new Set(request.flags || []);
    const countOf = name => inventory.find(item => item.item === name)?.qty || 0;
    const hasItems = required => Object.entries(required || {}).every(([name, qty]) => countOf(name) >= qty);
    if ((source.linh_thach || 0) > 10) flags.add('tung_so_huu_tren_10_linh_thach');

    const unlocked = [];
    const locked = [];
    Object.entries(QI_REFINING_RULES.features).forEach(([id, rule]) => {
        let allowed = !rule.permanentlyLocked;
        if (rule.defaultUnlocked) allowed = true;
        if (rule.minLevel && level < rule.minLevel) allowed = false;
        if (!hasItems(rule.requiredItems)) allowed = false;
        if ((rule.requiredFlags || []).some(flag => !flags.has(flag))) allowed = false;
        if (id === 'btn_tu_linh_tran') allowed = flags.has('tu_linh_tran_unlocked');
        (allowed ? unlocked : locked).push(id);
    });

    const add = [];
    const remove = [];
    const logs = [];
    const hints = [];
    const action = request.action;

    if (!unlocked.includes('btn_hoa_phu')) hints.push('Cần Bút Lông Linh Thú, Chu Sa và đọc Bách Khoa Phù Lục 1 để mở Họa Phù.');
    if (!flags.has('tu_linh_tran_unlocked')) hints.push('Cần Bản vẽ Tụ Linh Trận Sơ Giai, Luyện Khí Tầng 3 và 50 Linh Thạch để dựng trận.');

    if (action === 'mo_tu_linh_tran') {
        if (level < 3 || !hasItems({ "Bản vẽ Tụ Linh Trận Sơ Giai": 1 }) || (source.linh_thach || 0) < 50) {
            return JSON.stringify({ status: "error", error_code: "UNLOCK_CONDITIONS_NOT_MET", system_unlocks: { newly_unlocked: [], hints } });
        }
        source.linh_thach -= 50;
        flags.add('tu_linh_tran_unlocked');
        if (!unlocked.includes('btn_tu_linh_tran')) unlocked.push('btn_tu_linh_tran');
        const lockedIndex = locked.indexOf('btn_tu_linh_tran');
        if (lockedIndex >= 0) locked.splice(lockedIndex, 1);
        logs.push('[Mở khóa] Tiêu hao 50 Linh Thạch, dựng thành Tụ Linh Trận Sơ Giai.');
    } else if (action === 'chien_dau' || action === 'lich_luyen' || action === 'huyet_sac_cam_dia') {
        const talisman = QI_REFINING_RULES.talismanPriority.find(name => countOf(name) > 0);
        if (talisman) {
            remove.push({ item: talisman, qty: 1 });
            logs.push(`[Chiến đấu] Ưu tiên kích hoạt ${talisman} trước khi thi triển pháp thuật.`);
        } else if ((source.linh_luc || 0) < QI_REFINING_RULES.lowMpThreshold) {
            logs.push('[Chiến đấu] Linh lực dưới 10, tự động chuyển sang đánh thường bằng vũ khí phàm tục.');
        } else {
            source.linh_luc -= 10;
            logs.push('[Chiến đấu] Không có Phù Lục, tiêu hao 10 Linh Lực để thi triển kỹ năng.');
        }
    } else if (action === 'bi_cuop_boc') {
        if (countOf('Thần Hành Phù') > 0) {
            remove.push({ item: 'Thần Hành Phù', qty: 1 });
            logs.push('[Cướp bóc] Kích hoạt Thần Hành Phù, chạy thoát thành công.');
        } else logs.push('[Cướp bóc] Không có Thần Hành Phù; không đủ điều kiện bảo đảm chạy thoát.');
    }

    const previous = new Set(request.previous_unlocked || []);
    return JSON.stringify({
        status: "success",
        player_state: {
            canh_gioi: source.canh_gioi,
            tu_vi: source.tu_vi || "0/0",
            khi_huyet: source.khi_huyet || 0,
            linh_luc: source.linh_luc || 0,
            linh_thach: source.linh_thach || 0
        },
        inventory_updates: { add, remove },
        system_unlocks: { newly_unlocked: unlocked.filter(id => !previous.has(id)), unlocked_features: unlocked, locked_features: locked, hints },
        action_log: logs
    });
}

window.processQiRefiningRequest = processQiRefiningRequest;
function renderLinhCanUpgradeRow(key, config) {
    const rare = Boolean(RARE_LINH_CAN_BRANCHES[key]);
    const level = rare ? state.spiritualRoot.rareBranches[key].level : getPillarLevel(key);
    const stage = getLingCanStage(level);
    const mutated = Boolean(state.spiritualRoot.mutations[key]);
    const awaitingAwakening = level >= 50 && !mutated;
    const cost = getPillarUpgradeCost(level, key);
    const action = awaitingAwakening
        ? `<button class="linh-can-upgrade__evolve" type="button" onclick="mutateLinhCanBranch('${key}')">Đột Biến / Tiến Hóa · ${LINH_CAN_MUTATIONS[key].itemName}</button>`
        : cost === null ? '<span class="linh-can-upgrade__max">Chí Tôn Lv.100</span>'
            : `<button class="linh-can-upgrade__button" type="button" onclick="upgradeElementPillar('${key}')" aria-label="Nâng cấp ${config.element}, tốn ${cost.toLocaleString('vi-VN')} Linh Khí">+</button>`;
    return `<div class="linh-can-upgrade ${state.activeElement === key ? 'is-active' : ''} ${awaitingAwakening ? 'is-awakening' : ''}" data-upgrade-element="${key}" style="--element-color:${config.color};--stage-color:${stage.color === 'rainbow' ? '#facc15' : stage.color}">
        <button class="linh-can-upgrade__name" type="button" onclick="setActiveElement('${key}')" title="Chọn ${config.element} làm chủ vị"><i class="fa-solid ${config.icon}" aria-hidden="true"></i><span>${config.element} <b>Lv.${level}</b><small>${mutated ? LINH_CAN_MUTATIONS[key].name : stage.name}</small></span></button>
        <div class="linh-can-upgrade__track" role="progressbar" aria-label="Cấp ${config.element}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,level)}"><span style="width:${Math.min(100,level)}%"></span></div>
        <span class="linh-can-upgrade__cost">${cost === null || awaitingAwakening ? '' : `${formatCultivationNumber(cost)} LK`}</span>
        ${action}
    </div>`;
}

function renderSpiritualRootPanel(hostId = 'spiritual-root-panel') {
            const host = document.getElementById(hostId);
            if (!host || hostId !== 'foundation-panel') return;
            const root = getRootConfig();
            const tier = getRootTier();
            const resonance = getResonance();
            const rootDetailsOpen = Boolean(host.querySelector('.linh-can-root-info')?.open);
            host.style.setProperty('--root-color', root.primaryColor || tier.color);
            host.innerHTML = `
                <div class="linh-can-layout">
                    <div class="linh-can-visual" aria-label="Kinh mạch ngũ hành và bể Linh Khí">
                        <div class="linh-can-visual__heading"><strong>Ngũ Hành Luân Xa</strong><span>Chạm một hệ để chọn chủ vị</span></div>
                        <div class="linh-can-visual__halo" aria-hidden="true"></div>
                        <svg class="linh-can-visual__body" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                            <circle cx="50" cy="20" r="8.5" />
                            <path d="M42 31 Q50 27 58 31 L62 54 Q59 65 50 68 Q41 65 38 54Z" />
                            <path d="M42 33 Q32 37 30 51 L22 63 Q19 67 23 69 L34 57 L42 47Z M58 33 Q68 37 70 51 L78 63 Q81 67 77 69 L66 57 L58 47Z" />
                            <path d="M42 63 Q32 65 19 74 Q14 77 19 81 Q32 79 50 76 Q68 79 81 81 Q86 77 81 74 Q68 65 58 63Z" />
                        </svg>
                        <svg class="linh-can-visual__meridians" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                            <path d="M50 85 Q45 70 50 38" /><path d="M50 85 Q35 65 41 43" />
                            <path d="M50 85 Q68 66 59 49" /><path d="M50 85 Q48 74 50 65" />
                            <path d="M50 85 Q55 68 50 53" />
                            ${state.spiritualRoot.rareBranches.ice.isUnlocked ? '<path d="M50 85 Q21 67 29 34" />' : ''}
                            ${state.spiritualRoot.rareBranches.wind.isUnlocked ? '<path d="M50 85 Q79 67 71 34" />' : ''}
                            ${state.spiritualRoot.rareBranches.thunder.isUnlocked ? '<path d="M50 85 Q50 52 50 18" />' : ''}
                        </svg>
                        ${Object.entries({ ...ELEMENTAL_PILLARS, ...RARE_LINH_CAN_BRANCHES }).filter(([key]) => !RARE_LINH_CAN_BRANCHES[key] || state.spiritualRoot.rareBranches[key].isUnlocked).map(([key, pillar]) => {
                            const rare = Boolean(RARE_LINH_CAN_BRANCHES[key]);
                            const level = rare ? state.spiritualRoot.rareBranches[key].level : getPillarLevel(key);
                            const stage = getLingCanStage(level);
                            const isMutated = Boolean(state.spiritualRoot?.mutations?.[key]);
                            const mutation = isMutated ? LINH_CAN_MUTATIONS[key] : null;
                            const nodeColor = isMutated ? (mutation?.color || '#a855f7') : pillar.color;
                            return `<button type="button" class="meridian-node meridian-node--${key} ${state.activeElement === key ? 'is-active' : ''} ${isMutated ? 'is-mutated' : ''}" onclick="setActiveElement('${key}')" data-element="${key}" style="--element-color:${nodeColor}" aria-label="Chọn ${pillar.element} làm chủ vị, cấp ${level}" aria-pressed="${state.activeElement === key}" title="${isMutated ? mutation.name + ' (Đã Thức Tỉnh)' : pillar.element + ' Luân Xa · Cấp ' + level + ' (' + stage.name + ')'} - Chạm để chọn làm chủ vị"><span class="flex flex-col items-center justify-center leading-none pointer-events-none"><span>${isMutated ? '✦ ' + pillar.element : pillar.element}</span><span class="text-[8px] font-mono opacity-85 mt-0.5">${level}</span></span></button>`;
                        }).join('')}
                        <div class="qi-pool"><span class="qi-pool__orb" aria-hidden="true"></span><span class="qi-pool__label">Bể Linh Khí</span><strong id="foundation-qi-amount">Linh Khí: ${formatCultivationNumber(state.linhKhi)}</strong></div>
                    </div>
                    <details class="linh-can-root-info">
                            <summary><span id="linh-can-title">Linh Căn</span><small id="linh-can-quality" class="linh-can-quality">Phẩm chất</small></summary>
                            <div>Đặc tính đang trang bị: <strong>${root.name} · ${tier.name}</strong><br>${root.description}<br>Hệ số tu luyện: ×${tier.cultivationMult.toFixed(2)} · Kháng Lôi Kiếp: ${tier.tribulationResist}%<br>Thể chất: ${getPhysique().name} · Tư chất: ${getAptitude().name} · Kháng Tâm Ma: ${getAptitude().heartDemonResistance}<br>${root.special}</div>
                    </details>
                    <div class="linh-can-controls">
                        <div class="linh-can-upgrades">
                            ${Object.entries(ELEMENTAL_PILLARS).map(([key, pillar]) => renderLinhCanUpgradeRow(key, pillar)).join('')}
                            ${Object.entries(RARE_LINH_CAN_BRANCHES).filter(([key]) => state.spiritualRoot.rareBranches[key].isUnlocked).map(([key, pillar]) => renderLinhCanUpgradeRow(key, pillar)).join('')}
                        </div>
                        ${Object.entries(RARE_LINH_CAN_BRANCHES).some(([key]) => !state.spiritualRoot.rareBranches[key].isUnlocked) ? `<div class="linh-can-rare-unlock"><b>Tam Dị chưa thức tỉnh</b><small>Dùng Dị Nguyên Thạch để mở một nhánh.</small>${state.inventory.find(item => item.id === LINH_CAN_RULES.rareUnlockItem)?.count > 0 ? `<div>${Object.entries(RARE_LINH_CAN_BRANCHES).filter(([key]) => !state.spiritualRoot.rareBranches[key].isUnlocked).map(([key, pillar]) => `<button type="button" onclick="unlockRareLinhCanBranch('${key}')">Mở ${pillar.element}</button>`).join('')}</div>` : ''}</div>` : ''}
                        <div class="resonance-status"><span>Cộng Hưởng Ngũ Hành • Cấp ${resonance.level}</span><b>+${Math.round(resonance.bonus * 100)}% Toàn Thuộc Tính</b></div>
                    </div>
                </div>
            `;
            host.querySelector('.linh-can-root-info').open = rootDetailsOpen;
            updateLinhCanTitle();
        }

function renderFoundationHub(activeTab = 'linh_can', hostElement = null) {
    const host = hostElement || document.getElementById('char-subtab-container') || document.getElementById('char-right-tab-content') || document.getElementById('hub-modal-content');
    if (!host) return;
    const rank = getM1RealmRank(REALMS[state.realmIndex]?.name);
    const tabs = [
        ['linh_can', 'Linh Căn'],
        ['the_chat', 'Thể Chất'],
        ['than_thuc', 'Thần Thức'],
        ['menh_cach', 'Mệnh Cách']
    ].filter(([id]) => rank >= FOUNDATION_RULES.tabs[id].minRank);
    const selected = tabs.some(([id]) => id === activeTab) ? activeTab : tabs[0][0];
    host.innerHTML = `<nav class="foundation-tabs flex gap-2 border-b border-stone-800 pb-3 mb-3 overflow-x-auto">${tabs.map(([id, label]) => `<button class="hub-tab ${id === selected ? 'is-active' : ''}" onclick="renderFoundationHub('${id}')">${label}</button>`).join('')}</nav><div id="foundation-panel"></div>`;
    const panel = document.getElementById('foundation-panel');
    if (selected === 'linh_can') {
        renderSpiritualRootPanel('foundation-panel');
        return;
    }
    if (selected === 'the_chat') {
        const training = state.canCo.physiqueTraining;
        panel.innerHTML = `<article class="hub-menu-card"><i class="fa-solid fa-shield-halved"></i><b>${FOUNDATION_RULES.physiqueStages[training.stageIndex]} - Tầng ${training.floor}</b><p class="mt-3 text-xs text-slate-300">Đặc tính: ${training.trait}</p><p class="mt-2 text-xs text-slate-400">Nâng cấp bằng Khí Huyết hoặc Yêu Đan. Chi phí từng tầng cần được cấu hình trong request backend.</p></article>`;
        return;
    }
    if (selected === 'than_thuc') {
        const soul = state.canCo.consciousness;
        panel.innerHTML = `<article class="hub-menu-card"><i class="fa-solid fa-brain"></i><b>Thức Hải Cấp ${soul.level}</b><p class="mt-3 text-xs text-slate-300">Tầm quét Bí Cảnh: ${soul.scanRadius}</p><p class="mt-2 text-xs text-slate-400">Dùng Dưỡng Hồn Mộc hoặc Hồn Thạch để nâng cấp.</p></article>`;
        return;
    }
    const destiny = state.canCo.destiny;
    panel.innerHTML = `<div class="hub-menu-grid"><article class="hub-menu-card"><i class="fa-solid fa-book-open"></i><b>Ngộ Tính ${destiny.insight}/100</b><p class="mt-3 text-xs text-slate-400">Chỉ tăng bằng Bồ Đề Quả.</p></article><article class="hub-menu-card"><i class="fa-solid fa-clover"></i><b>Khí Vận ${destiny.fortune}/100</b><p class="mt-3 text-xs text-slate-400">Chỉ tăng bằng Thiên Đạo Chúc Phúc.</p></article></div>`;
}
function hideAllGamePages(exceptId = null) {
    // 1. Ẩn toàn bộ các thẻ có class .game-page hoặc .feature-popup
    const allPages = document.querySelectorAll('.feature-popup, .feature-page, .game-page');
    allPages.forEach(page => {
        if (exceptId && page.id === exceptId) return;
        page.style.setProperty('display', 'none', 'important');
        page.classList.remove('active', 'flex');
        page.classList.add('hidden');
    });

    // 2. Đảm bảo dọn dẹp state phụ của các modal khi chuyển trang
    if (exceptId !== 'hub-modal-backdrop') {
        const hubBackdrop = document.getElementById('hub-modal-backdrop');
        if (hubBackdrop) {
            hubBackdrop.dataset.activeHub = '';
            hubBackdrop.style.display = 'none';
            hubBackdrop.classList.remove('active', 'flex');
            hubBackdrop.classList.add('hidden');
        }
        const hubCard = document.getElementById('hub-modal-card');
        if (hubCard) hubCard.classList.remove('hub-modal--wide');
    }

    if (exceptId !== 'demon-tower-modal') {
        const towerModal = document.getElementById('demon-tower-modal');
        if (towerModal) {
            towerModal.style.display = 'none';
            towerModal.classList.remove('active', 'flex');
            towerModal.classList.add('hidden');
        }
        const vignette = document.getElementById('demon-tower-suppression-vignette');
        if (vignette) vignette.classList.add('hidden');
    }

    if (exceptId !== 'sect-modal') {
        const sectModal = document.getElementById('sect-modal');
        if (sectModal) {
            sectModal.style.display = 'none';
            sectModal.classList.remove('active', 'flex');
            sectModal.classList.add('hidden');
        }
    }

    if (exceptId !== 'center-modal-backdrop') {
        const centerModal = document.getElementById('center-modal-backdrop');
        if (centerModal) {
            centerModal.style.display = 'none';
            centerModal.classList.remove('active', 'flex');
            centerModal.classList.add('hidden');
        }
    }

    if (exceptId !== 'ancient-scroll-backdrop') {
        const scrollModal = document.getElementById('ancient-scroll-backdrop');
        if (scrollModal) {
            scrollModal.style.display = 'none';
            scrollModal.classList.remove('active', 'flex');
            scrollModal.classList.add('hidden');
        }
    }

    if (exceptId !== 'smart-slot-popover-backdrop') {
        const smartPop = document.getElementById('smart-slot-popover-backdrop');
        if (smartPop) {
            smartPop.style.display = 'none';
            smartPop.classList.remove('active', 'flex');
            smartPop.classList.add('hidden');
        }
    }

    if (typeof activeDrawer !== 'undefined' && activeDrawer && typeof closeDrawer === 'function') {
        closeDrawer();
    }
    if (typeof hideItemTooltip === 'function') {
        hideItemTooltip();
    }
}
window.hideAllGamePages = hideAllGamePages;

function openHubModal(hub, tab = null) {
            if (cutsceneState && cutsceneState.inProgress) {
                addLog("⚡ Thần thức đang nghênh chiến Thiên Kiếp, không thể truy cập giao diện toàn cục!", "text-amber-300");
                return;
            }
            // Chuyển hướng trực tiếp các trang đặc thù có layout độc lập chuẩn 2D Tiên Hiệp
            if (hub === 'character' && (tab === 'inventory' || tab === 'tui-do')) {
                navigateTo('page-inventory');
                return;
            }
            if (hub === 'character' && (tab === 'skills' || tab === 'cong-phap')) {
                navigateTo('page-skills');
                return;
            }
            if (typeof hideMainScreenHUD === 'function') hideMainScreenHUD();
            // Bước 1: Đóng tất cả các trang .game-page khác trước khi mở Hub Modal
            hideAllGamePages('hub-modal-backdrop');

            const backdrop = document.getElementById('hub-modal-backdrop');
            if (!backdrop) return;
            backdrop.dataset.activeHub = hub;
            backdrop.classList.remove('hidden');
            backdrop.classList.add('flex', 'active');
            backdrop.style.setProperty('display', 'flex', 'important');
            backdrop.style.setProperty('z-index', '10000', 'important');
            const hubCard = document.getElementById('hub-modal-card');
            if (hubCard) {
                hubCard.classList.toggle('hub-modal--wide', hub === 'character' || hub === 'cave' || hub === 'world');
            }
            renderHubModal(hub, tab);
        }
function closeHubModal() {
            const backdrop = document.getElementById('hub-modal-backdrop');
            if (backdrop) {
                backdrop.dataset.activeHub = '';
                backdrop.style.display = 'none';
                backdrop.classList.add('hidden');
                backdrop.classList.remove('flex', 'active');
            }
            const hubCard = document.getElementById('hub-modal-card');
            if (hubCard) hubCard.classList.remove('hub-modal--wide');
            const tabs = document.getElementById('hub-modal-tabs');
            if (tabs) tabs.classList.remove('hidden');
            if (typeof hideItemTooltip === 'function') hideItemTooltip();
            if (typeof showMainScreenHUD === 'function') showMainScreenHUD();
        }
function renderHubModal(hub, activeTab = null) {
            const title = document.getElementById('hub-modal-title');
            const tabs = document.getElementById('hub-modal-tabs');
            const content = document.getElementById('hub-modal-content');
            if (!title || !tabs || !content) return;
            const hubCard = document.getElementById('hub-modal-card');
            if (hubCard) {
                hubCard.classList.toggle('hub-modal--wide', hub === 'character' || hub === 'cave' || hub === 'world');
            }
            // Xóa bỏ hàng tab thừa trên đỉnh modal vì đã điều hướng trực tiếp từ Dropup Menu
            tabs.innerHTML = '';
            tabs.classList.add('hidden');
            tabs.style.setProperty('display', 'none', 'important');

            const characterPageTitles = {
                inventory: '📦 TÚI ĐỒ',
                skills: '📜 CÔNG PHÁP TÀNG KINH CÁC',
                root: '🌿 CĂN CƠ LINH CĂN',
                artifact: '⚔️ PHÁP BẢO BẢN MỆNH',
                talisman: '🧧 HỌA PHÙ CÁC',
                pet: '🦊 LINH THÚ HỘ TỘC',
                companion: '💞 ĐẠO LỮ ĐỒNG TU',
                avatar: '🧘 PHÂN THẦN HÓA THÂN',
                achievement: '🏆 THIÊN ĐẠO THÀNH TỰU'
            };

            const worldPageTitles = {
                encounter: '🗺️ BẢN ĐỒ LỊCH LUYỆN',
                dungeon: '🗝️ BÍ CẢNH THÁM HIỂM',
                market: '🏮 VẠN BẢO PHƯỜNG THỊ',
                arena: '⚔️ ĐẤU PHÁP ĐÀI',
                auction: '🔨 ĐẤU GIÁ HỘI',
                tribulation: '⚡ THIÊN KIẾP ĐÀI',
                sect: '⛩️ TÔNG MÔN HẠ GIỚI',
                master: '👑 CHƯỞNG MÔN ĐIỆN',
                rift: '🌌 KHÔNG GIAN LIỆT PHÙNG'
            };

            const cavePageTitles = {
                array: '🌀 ĐỘNG PHỦ • TỤ LINH TRẬN',
                farm: '🌿 ĐỘNG PHỦ • LINH ĐIỀN',
                alchemy: '🧪 ĐỘNG PHỦ • ĐAN CÁC',
                forge: '⚒️ ĐỘNG PHỦ • KHÍ CÁC'
            };

            if (hub === 'cave' && typeof renderCaveHubDashboard === 'function') {
                title.textContent = cavePageTitles[activeTab] || '🏠 ĐỘNG PHỦ TU TIÊN';
                renderCaveHubDashboard(activeTab);
                return;
            }
            if (hub === 'character') {
                const resolvedCharTab = activeTab || currentCharacterTab || 'inventory';
                title.textContent = characterPageTitles[resolvedCharTab] || '👤 BẢN NGUYÊN TU SĨ';
                renderCharacterHub(resolvedCharTab, content);
                return;
            }
            const configs = {
                character: { title: 'Nhân Vật', tabs: [['inventory','Túi Đồ','tab_tui_do'],['skills','Công Pháp',null],['talisman','Họa Phù','tab_hoa_phu'],['root','Căn Cơ','tab_can_co'],['pet','Linh Thú','tab_linh_thu'],['artifact','Pháp Bảo','tab_phap_bao'],['companion','Đạo Lữ','tab_dao_lu'],['avatar','Phân Thần','tab_phan_than']] },
                cave: { title: 'Động Phủ', tabs: [['array','Tụ Linh Trận','tab_tu_linh_tran'],['farm','Linh Điền','tab_linh_dien'],['alchemy','Đan Các','tab_dan_cac'],['forge','Khí Các','tab_khi_cac'],['auto','Trợ Lý Auto','tab_auto_bot']] },
                world: { title: 'Thế Giới', tabs: [['encounter','Lịch Luyện','tab_lich_luyen'],['dungeon','Bí Cảnh','tab_bi_canh'],['sect','Tông Môn','tab_tong_mon'],['market','Phường Thị','tab_phuong_thi'],['arena','Đấu Pháp Đài','tab_dau_phap_dai'],['auction','Đấu Giá Hội','tab_dau_gia'],['master','Chưởng Môn','tab_chuong_mon'],['tribulation','Thiên Kiếp Đài','tab_thien_kiep_dai'],['rift','Không Gian Liệt Phùng','tab_khong_gian_liet_phung']] }
            };
            const config = configs[hub];
            if (!config) return;
            const liveAccess = getLiveM1NestedAccess();
            const visibleTabs = config.tabs.filter(([, , featureId]) => !featureId || liveAccess.unlocked.includes(featureId));
            const selected = activeTab || visibleTabs[0]?.[0];
            if (hub === 'world') {
                title.textContent = worldPageTitles[selected] || '🌍 THẾ GIỚI TU CHÂN';
            } else {
                title.textContent = config.title;
            }
            if (!selected) { content.innerHTML = '<p class="text-slate-400">Chưa có phân hệ nào đủ điều kiện mở khóa.</p>'; return; }
            if (hub === 'character') {
                renderCharacterHub(selected, content);
            } else if (hub === 'world' && selected === 'encounter') {
                renderWorldExpeditionDashboard(content);
                const pageEl = document.getElementById('world-encounter-page-content');
                if (pageEl && document.getElementById('page-world-encounter')?.classList.contains('active')) {
                    renderWorldExpeditionDashboard(pageEl);
                }
            } else if (hub === 'world' && selected === 'sect') {
                closeHubModal();
                if (typeof openSectModal === 'function') openSectModal();
            } else {
                renderMenuHub(hub, selected, content);
                if (hub === 'world') {
                    if (selected === 'market' && document.getElementById('page-world-market')?.classList.contains('active')) {
                        renderWorldMarketHub(document.getElementById('world-market-page-content'));
                    } else if (selected === 'auction' && document.getElementById('page-world-auction')?.classList.contains('active')) {
                        renderWorldAuctionHub(document.getElementById('world-auction-page-content'));
                    } else if (selected === 'dungeon' && document.getElementById('page-world-dungeon')?.classList.contains('active')) {
                        renderWorldDungeonHub(document.getElementById('world-dungeon-page-content'));
                    } else if (selected === 'arena' && document.getElementById('page-world-arena')?.classList.contains('active')) {
                        renderWorldArenaHub(document.getElementById('world-arena-page-content'));
                    }
                }
            }
        }

/**
 * Quản lý Dropdown / Popover cho Thanh Điều Hướng (Bottom Nav)
 */
function toggleMenu(menuId) {
    // Đóng tất cả các menu khác trước (nếu có)
    document.querySelectorAll('[id$="-menu"]').forEach(el => {
        if (el.id !== menuId) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    // Bật/tắt menu được chọn
    const menu = document.getElementById(menuId);
    if (menu) {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            menu.classList.remove('hidden');
            menu.classList.add('flex');
        } else {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        }
    }
}
window.toggleMenu = toggleMenu;

function switchTab(tabId) {
    // Đóng tất cả các dropdown menu
    document.querySelectorAll('[id$="-menu"]').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });

    if (tabId === 'tui-do' || tabId === 'inventory') {
        navigateTo('page-inventory');
    } else if (tabId === 'cong-phap' || tabId === 'skills') {
        navigateTo('page-skills');
    } else if (tabId === 'can-co' || tabId === 'root') {
        openHubModal('character', 'root');
    } else if (tabId === 'phap-bao' || tabId === 'artifact') {
        openHubModal('character', 'artifact');
    } else if (tabId === 'dong-phu' || tabId === 'cave') {
        if (typeof openGiaVienModal === 'function') {
            openGiaVienModal();
        } else {
            openHubModal('cave');
        }
    } else if (tabId === 'tong-mon' || tabId === 'sect') {
        if (typeof openSectModal === 'function') openSectModal();
    } else if (tabId === 'the-gioi' || tabId === 'world') {
        openHubModal('world');
    } else if (tabId === 'tran-yeu-thap' || tabId === 'tower') {
        if (typeof openDemonTowerModal === 'function') openDemonTowerModal();
    } else {
        openHubModal('character', tabId);
    }
}
window.switchTab = switchTab;

function openTab(tabId) {
    return switchTab(tabId);
}
window.openTab = openTab;

// ==========================================================
// 3. LOGIC JAVASCRIPT CHO DROPUP MENU & HIỆU ỨNG CLICK
// ==========================================================

/**
 * 1. toggleDropup(menuId, event):
 * - Kiểm tra xem menu đang mở hay đóng.
 * - Đóng tất cả Dropup Menu khác đang mở trên thanh điều hướng.
 * - Dùng style.setProperty('display', 'flex', 'important') để mở menu và display: 'none' !important để đóng.
 */
function toggleDropup(menuId, event) {
    const e = event || (typeof window !== 'undefined' ? window.event : null);
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }

    // Chuẩn hóa hỗ trợ cả ID menu cũ và mới
    let normalizedId = menuId;
    if (menuId === 'nhan-vat-menu') normalizedId = 'menu-nhan-vat';
    else if (menuId === 'dong-phu-menu') normalizedId = 'menu-dong-phu';
    else if (menuId === 'tong-mon-menu') normalizedId = 'menu-tong-mon';
    else if (menuId === 'the-gioi-menu') normalizedId = 'menu-the-gioi';
    else if (menuId === 'tran-yeu-thap-menu') normalizedId = 'menu-tran-yeu-thap';

    const targetMenu = document.getElementById(normalizedId) || document.getElementById(menuId);
    if (!targetMenu) return;

    // Menu được coi là đang mở nếu có display === 'flex' hoặc class 'active'
    const isCurrentlyOpen = (targetMenu.style.display === 'flex' || targetMenu.classList.contains('active'));
    // Pointer entry already opens this menu. Its following mouse click must
    // not immediately close it; keyboard/touch still toggle normally.
    if (isCurrentlyOpen && e?.type === 'click' && e.detail > 0 && targetMenu.closest('.nav-item-wrapper')?.matches(':hover')) return;

    // Đóng toàn bộ các menu đang mở khác
    closeAllDropups();

    if (!isCurrentlyOpen) {
        targetMenu.style.setProperty('display', 'flex', 'important');
        targetMenu.classList.add('active');
        const parentWrap = targetMenu.closest('.nav-item-wrapper');
        if (parentWrap) {
            parentWrap.classList.add('is-open');
            const btn = parentWrap.querySelector('.nav-btn');
            if (btn) {
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        }
    }
}

function closeAllDropups() {
    const allMenus = document.querySelectorAll('.dropup-menu');
    allMenus.forEach(menu => {
        menu.style.removeProperty('display');
        menu.classList.remove('active');
    });
    const allWrappers = document.querySelectorAll('.nav-item-wrapper');
    allWrappers.forEach(wrap => {
        wrap.classList.remove('is-open');
        const btn = wrap.querySelector('.nav-btn');
        if (btn) {
            btn.classList.remove('active');
            if (btn.hasAttribute('aria-controls')) btn.setAttribute('aria-expanded', 'false');
        }
    });
}

function toggleDropupMenu(menuId, event) {
    return toggleDropup(menuId, event);
}

function closeAllDropupMenus() {
    return closeAllDropups();
}

/**
 * 2. switchPage(pageId):
 * - Thiết quân luật chuyển trang SPA:
 *   + Bước 1: Ẩn TẤT CẢ các trang (.game-page) đang mở để tránh đè giao diện.
 *   + Bước 2: Ẩn TẤT CẢ các Dropup Menu (.dropup-menu).
 *   + Bước 3: Nếu pageId === 'main-screen' hoặc 'nhan-vat', dừng tại đây để lộ màn hình chính Lofi.
 *             Ngược lại, chỉ hiển thị ĐÚNG trang vừa được bấm chọn.
 */
// ============================================================================
// GLOBAL STATE MANAGEMENT (GAME_STATE SINGLETON)
// ============================================================================
window.GameState = {
    get TuVi() { return typeof state !== 'undefined' ? (state.exp || 0) : 0; },
    set TuVi(v) { if (typeof state !== 'undefined') state.exp = v; },
    get LinhThach() { return typeof state !== 'undefined' ? (state.stones || 0) : 0; },
    set LinhThach(v) { if (typeof state !== 'undefined') state.stones = v; },
    get TienNgoc() { return typeof state !== 'undefined' ? (state.immortalJade || 0) : 0; },
    set TienNgoc(v) { if (typeof state !== 'undefined') state.immortalJade = v; },
    get ChienLuc() { return typeof getCombatPower === 'function' ? getCombatPower() : (state?.atk ? state.atk * 10 : 0); },
    get ThoNguyen() { return typeof state !== 'undefined' ? (state.lifespan || 100) : 100; },
    deductLinhThach(amount) {
        if ((this.LinhThach || 0) < amount) return false;
        this.LinhThach -= amount;
        this.updateUI();
        if (typeof saveGameState === 'function') saveGameState();
        return true;
    },
    deductTienNgoc(amount) {
        if ((this.TienNgoc || 0) < amount) return false;
        this.TienNgoc -= amount;
        this.updateUI();
        if (typeof saveGameState === 'function') saveGameState();
        return true;
    },
    addTuVi(amount) {
        this.TuVi += amount;
        this.updateUI();
        if (typeof saveGameState === 'function') saveGameState();
    },
    updateUI() {
        if (typeof updateHUD === 'function') updateHUD();
        const elStones = document.getElementById('top-spirit-stones');
        if (elStones) elStones.textContent = Number(this.LinhThach || 0).toLocaleString('vi-VN');
        const elJade = document.getElementById('top-immortal-jade');
        if (elJade) elJade.textContent = Number(this.TienNgoc || 0).toLocaleString('vi-VN');
        const elCp = document.getElementById('combat-power-text');
        if (elCp) elCp.textContent = Number(this.ChienLuc || 0).toLocaleString('vi-VN');
        const elExpDesktop = document.getElementById('exp-text-desktop');
        if (elExpDesktop && typeof REALMS !== 'undefined' && typeof state !== 'undefined') {
            const maxExp = REALMS[state.realmIndex]?.maxExp || 100;
            elExpDesktop.textContent = `${Number(this.TuVi || 0).toLocaleString('vi-VN')} / ${Number(maxExp).toLocaleString('vi-VN')}`;
            const pct = Math.min(100, Math.round(((this.TuVi || 0) / maxExp) * 100));
            const bar = document.getElementById('exp-bar-desktop');
            if (bar) bar.style.width = `${pct}%`;
        }
    }
};
window.updateUI = () => window.GameState.updateUI();

/**
 * MASTER SPA ROUTER: DOM ROUTING VIA NAVIGATE_TO & SWITCH_PAGE
 */
function navigateTo(pageId) {
    return switchPage(pageId);
}
window.navigateTo = navigateTo;

function openFeature(featureKey) {
    if (typeof closeAllDropups === 'function') closeAllDropups();
    
    let targetPageId = featureKey;
    if (featureKey === 'nhan-vat' || featureKey === 'character') targetPageId = 'page-inventory';
    else if (featureKey === 'dong-phu' || featureKey === 'cave') {
        if (typeof openGiaVienModal === 'function') {
            return openGiaVienModal();
        }
        targetPageId = 'page-linh-dien';
    }
    else if (featureKey === 'tong-mon' || featureKey === 'sect') targetPageId = 'page-sect-quests';
    else if (featureKey === 'the-gioi' || featureKey === 'world') targetPageId = 'page-world-market';
    else if (featureKey === 'demon-tower' || featureKey === 'demon-tower-modal') targetPageId = 'demon-tower-modal';
    
    const targetEl = document.getElementById(targetPageId);
    if (targetEl && (targetEl.classList.contains('active') || targetEl.style.display === 'block' || targetEl.style.display === 'flex') && !targetEl.classList.contains('hidden')) {
        return navigateTo('main-screen');
    }
    
    if (featureKey === 'demon-tower' || featureKey === 'demon-tower-modal') {
        if (typeof openDemonTowerModal === 'function') {
            return openDemonTowerModal();
        }
    }
    
    return navigateTo(targetPageId);
}
window.openFeature = openFeature;
globalThis.openFeature = openFeature;

const featurePageHistory = [];
let returningToPreviousFeaturePage = false;

function ensureFeaturePageBackdrop() {
    let backdrop = document.getElementById('feature-page-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'feature-page-backdrop';
        backdrop.setAttribute('role', 'presentation');
        backdrop.addEventListener('click', returnToPreviousFeaturePage);
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function returnToPreviousFeaturePage() {
    const previousPage = featurePageHistory.pop() || 'main-screen';
    returningToPreviousFeaturePage = true;
    switchPage(previousPage);
}
window.returnToPreviousFeaturePage = returnToPreviousFeaturePage;
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('feature-page-backdrop')?.classList.contains('is-visible')) {
        event.preventDefault();
        returnToPreviousFeaturePage();
    }
});

const cavePopupClosers = {
    'modal-gia-vien': 'closeGiaVienModal',
    'modal-luyen-dan': 'closeLuyenDanModal',
    'modal-luyen-khi': 'closeLuyenKhiModal',
    'modal-khue-phong': 'closeKhuePhongModal'
};
document.addEventListener('pointerdown', (event) => {
    for (const [id, closer] of Object.entries(cavePopupClosers)) {
        const popup = document.getElementById(id);
        if (popup && getComputedStyle(popup).display !== 'none' && !popup.contains(event.target)) {
            window[closer]?.();
        }
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const [id, closer] of Object.entries(cavePopupClosers)) {
        const popup = document.getElementById(id);
        if (popup && getComputedStyle(popup).display !== 'none') {
            event.preventDefault();
            window[closer]?.();
            break;
        }
    }
});

function hideMainScreenHUD() {
    document.body.classList.add('has-active-modal');
    const main = document.getElementById('main-content');
    if (main) {
        main.style.setProperty('display', 'none', 'important');
        main.style.setProperty('pointer-events', 'none', 'important');
    }
    const right = document.getElementById('right-panel');
    if (right) {
        right.style.setProperty('display', 'none', 'important');
        right.style.setProperty('pointer-events', 'none', 'important');
    }
    const left = document.getElementById('left-panel');
    if (left) {
        left.style.setProperty('display', 'none', 'important');
        left.style.setProperty('pointer-events', 'none', 'important');
    }
    const center = document.getElementById('center-avatar');
    if (center) {
        center.style.setProperty('display', 'none', 'important');
        center.style.setProperty('pointer-events', 'none', 'important');
    }
    const bar = document.getElementById('tu-vi-bar');
    if (bar) {
        bar.style.setProperty('display', 'none', 'important');
        bar.style.setProperty('pointer-events', 'none', 'important');
    }
    const bottom = document.getElementById('bottom-menu');
    if (bottom) {
        bottom.style.setProperty('display', 'none', 'important');
        bottom.style.setProperty('pointer-events', 'none', 'important');
    }
}
window.hideMainScreenHUD = hideMainScreenHUD;

function showMainScreenHUD() {
    document.body.classList.remove('has-active-modal');
    const main = document.getElementById('main-content');
    if (main) {
        main.style.removeProperty('display');
        main.style.removeProperty('pointer-events');
    }
    const right = document.getElementById('right-panel');
    if (right) {
        right.style.removeProperty('display');
        right.style.removeProperty('pointer-events');
    }
    const left = document.getElementById('left-panel');
    if (left) {
        left.style.removeProperty('display');
        left.style.removeProperty('pointer-events');
    }
    const center = document.getElementById('center-avatar');
    if (center) {
        center.style.removeProperty('display');
        center.style.removeProperty('pointer-events');
    }
    const bar = document.getElementById('tu-vi-bar');
    if (bar) {
        bar.style.removeProperty('display');
        bar.style.removeProperty('pointer-events');
    }
    const bottom = document.getElementById('bottom-menu');
    if (bottom) {
        bottom.style.removeProperty('display');
        bottom.style.removeProperty('pointer-events');
    }
    if (bar) {
        bar.style.removeProperty('display');
        bar.style.removeProperty('pointer-events');
    }
}
window.showMainScreenHUD = showMainScreenHUD;

function switchPage(pageId) {
    const activePage = document.querySelector('section.feature-page.game-page.active:not(.hidden)');
    const isReturning = returningToPreviousFeaturePage;
    returningToPreviousFeaturePage = false;
    if (!activePage && !isReturning) featurePageHistory.length = 0;
    if (!isReturning && activePage && pageId !== activePage.id && pageId !== 'main' && pageId !== 'main-screen') {
        featurePageHistory.push(activePage.id);
    }
    if (pageId === 'main' || pageId === 'main-screen' || pageId === 'nhan-vat') featurePageHistory.length = 0;
    const featureBackdrop = document.getElementById('feature-page-backdrop');
    if (featureBackdrop) featureBackdrop.classList.remove('is-visible');

    // Bước 1: Ẩn TẤT CẢ các trang đang mở (Tránh lỗi đè giao diện)
    const allPages = document.querySelectorAll('.feature-popup, .feature-page, .game-page');
    allPages.forEach(page => {
        page.style.setProperty('display', 'none', 'important');
        page.classList.remove('active', 'flex');
        page.classList.add('hidden');
    });
    hideAllGamePages();

    // Bước 2: Ẩn TẤT CẢ các bảng Dropup Menu sau khi đã chọn xong
    const allMenus = document.querySelectorAll('.dropup-menu');
    allMenus.forEach(menu => {
        menu.classList.remove('active');
        menu.style.removeProperty('display');
    });
    closeAllDropups();

    if (!pageId) return;

    // Bước 3: Xử lý mở trang mới
    // Nếu người chơi chọn quay về "Màn hình chính" (chỗ ngồi thiền Lofi)
    if (pageId === 'main' || pageId === 'main-screen' || pageId === 'nhan-vat') {
        const stage = document.getElementById('hero-stage');
        if (stage) stage.style.display = 'flex';
        showMainScreenHUD();
        return;
    }

    const showPopupEl = (el) => {
        if (!el) return;
        hideMainScreenHUD();
        el.classList.remove('hidden');
        el.classList.add('active');
        el.removeAttribute('aria-hidden');
        el.style.removeProperty('visibility');
        el.style.setProperty('display', 'block', 'important');
        el.style.removeProperty('pointer-events');
        el.style.setProperty('z-index', '10000', 'important');
        if (el.matches('section.feature-page.game-page')) {
            const backdrop = ensureFeaturePageBackdrop();
            // Legacy backdrops carried aria-hidden=true, which the shared
            // visibility rule treats as display:none, disabling outside close.
            backdrop.removeAttribute('aria-hidden');
            backdrop.classList.add('is-visible');
        }
    };

    // 1. NHÂN VẬT - POP-MENU CHỨC NĂNG
    if (pageId === 'page-inventory' || pageId === 'tui-do' || pageId === 'inventory' || pageId === 'character-inventory') {
        const el = document.getElementById('page-inventory');
        if (el) {
            showPopupEl(el);
            if (typeof renderCharacterHub === 'function') {
                renderCharacterHub('inventory', document.getElementById('inventory-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-skills' || pageId === 'cong-phap' || pageId === 'skills' || pageId === 'character-skills') {
        const el = document.getElementById('page-skills');
        if (el) {
            showPopupEl(el);
            if (typeof renderSkillsHub === 'function') {
                renderSkillsHub(document.getElementById('skills-page-content'));
            } else if (typeof renderCharacterHub === 'function') {
                renderCharacterHub('skills', document.getElementById('skills-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-root' || pageId === 'can-co' || pageId === 'root' || pageId === 'character-root') {
        const el = document.getElementById('page-root');
        if (el) {
            showPopupEl(el);
            if (typeof renderCharacterHub === 'function') {
                renderCharacterHub('root', document.getElementById('root-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-artifact' || pageId === 'phap-bao' || pageId === 'artifact' || pageId === 'character-artifact') {
        const el = document.getElementById('page-artifact');
        if (el) {
            showPopupEl(el);
            if (typeof renderCharacterHub === 'function') {
                renderCharacterHub('artifact', document.getElementById('artifact-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-pet' || pageId === 'linh-thu' || pageId === 'pet' || pageId === 'character-pet') {
        const el = document.getElementById('page-pet');
        if (el) {
            showPopupEl(el);
            if (typeof renderCharacterHub === 'function') {
                renderCharacterHub('pet', document.getElementById('pet-page-content'));
            }
            return;
        }
    }
    if (pageId.startsWith('character-')) {
        const sub = pageId.replace('character-', '');
        openHubModal('character', sub);
        return;
    }
    if (pageId === 'dao-lu' || pageId === 'companion') {
        openHubModal('character', 'companion');
        return;
    }
    if (pageId === 'hoa-phu' || pageId === 'talisman') {
        openHubModal('character', 'talisman');
        return;
    }

    // 2. ĐỘNG PHỦ CHUẨN SPA — POP-MENU CHỨC NĂNG
    if (pageId === 'page-tu-linh-tran' || pageId === 'cave-array') {
        const el = document.getElementById('page-tu-linh-tran');
        if (el) {
            showPopupEl(el);
            if (typeof updateDongPhuUI === 'function') updateDongPhuUI();
            return;
        }
    }
    if (pageId === 'page-linh-dien' || pageId === 'cave-farm' || pageId === 'dong-phu' || pageId === 'cave') {
        const el = document.getElementById('page-linh-dien');
        if (el) {
            showPopupEl(el);
            if (typeof updateDongPhuUI === 'function') updateDongPhuUI();
            return;
        }
    }
    if (pageId === 'page-dan-cac' || pageId === 'cave-alchemy') {
        const el = document.getElementById('page-dan-cac');
        if (el) {
            showPopupEl(el);
            if (typeof updateDongPhuUI === 'function') updateDongPhuUI();
            return;
        }
    }
    if (pageId === 'page-khi-cac' || pageId === 'cave-forge') {
        const el = document.getElementById('page-khi-cac');
        if (el) {
            showPopupEl(el);
            if (typeof updateDongPhuUI === 'function') updateDongPhuUI();
            return;
        }
    }
    if (pageId === 'page-khue-phong' || pageId === 'cave-companion') {
        const el = document.getElementById('page-khue-phong');
        if (el) {
            showPopupEl(el);
            if (typeof updateDongPhuUI === 'function') updateDongPhuUI();
            return;
        }
    }

    // 3. TÔNG MÔN CHUẨN SPA — POP-MENU CHỨC NĂNG
    if (pageId === 'page-sect-quests' || pageId === 'sect-quests') {
        const el = document.getElementById('page-sect-quests');
        if (el) {
            showPopupEl(el);
            if (typeof renderSectPage === 'function') {
                renderSectPage('quests', document.getElementById('sect-quests-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-sect-rank' || pageId === 'sect-rank') {
        const el = document.getElementById('page-sect-rank');
        if (el) {
            showPopupEl(el);
            if (typeof renderSectPage === 'function') {
                renderSectPage('rank', document.getElementById('sect-rank-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-sect-shop' || pageId === 'sect-shop') {
        const el = document.getElementById('page-sect-shop');
        if (el) {
            showPopupEl(el);
            if (typeof renderSectPage === 'function') {
                renderSectPage('shop', document.getElementById('sect-shop-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-sect-array' || pageId === 'sect-array') {
        const el = document.getElementById('page-sect-array');
        if (el) {
            showPopupEl(el);
            if (typeof renderSectPage === 'function') {
                renderSectPage('array', document.getElementById('sect-array-page-content'));
            }
            return;
        }
    }
    if (pageId === 'tong-mon' || pageId === 'sect') {
        return switchPage('page-sect-quests');
    }

    // 4. THẾ GIỚI CHUẨN SPA — POP-MENU CHỨC NĂNG
    if (pageId === 'page-world-market' || pageId === 'world-market' || pageId === 'phuong-thi' || pageId === 'market') {
        const el = document.getElementById('page-world-market');
        if (el) {
            showPopupEl(el);
            if (typeof renderWorldMarketHub === 'function') {
                renderWorldMarketHub(document.getElementById('world-market-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-world-auction' || pageId === 'world-auction' || pageId === 'dau-gia' || pageId === 'auction') {
        const el = document.getElementById('page-world-auction');
        if (el) {
            showPopupEl(el);
            if (typeof renderWorldAuctionHub === 'function') {
                renderWorldAuctionHub(document.getElementById('world-auction-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-world-dungeon' || pageId === 'world-dungeon' || pageId === 'bi-canh' || pageId === 'dungeon') {
        const el = document.getElementById('page-world-dungeon');
        if (el) {
            showPopupEl(el);
            if (typeof renderWorldDungeonHub === 'function') {
                renderWorldDungeonHub(document.getElementById('world-dungeon-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-world-arena' || pageId === 'world-arena' || pageId === 'dau-phap-dai' || pageId === 'arena') {
        const el = document.getElementById('page-world-arena');
        if (el) {
            showPopupEl(el);
            if (typeof renderWorldArenaHub === 'function') {
                renderWorldArenaHub(document.getElementById('world-arena-page-content'));
            }
            return;
        }
    }
    if (pageId === 'page-world-encounter' || pageId === 'world-encounter' || pageId === 'lich-luyen' || pageId === 'encounter') {
        const el = document.getElementById('page-world-encounter');
        if (el) {
            showPopupEl(el);
            if (typeof renderWorldExpeditionDashboard === 'function') {
                renderWorldExpeditionDashboard(document.getElementById('world-encounter-page-content'));
            }
            return;
        }
    }
    if (pageId === 'the-gioi' || pageId === 'world') {
        return switchPage('page-world-market');
    }

    // 5. TRẤN YÊU THÁP (MỞ TRỰC TIẾP SPRITE BATTLER)
    if (pageId.startsWith('demon-tower') || pageId === 'tran-yeu-thap') {
        const sub = pageId.replace('demon-tower-', '').replace('tran-yeu-thap-', '');
        const targetTab = (sub === 'rewards' || sub === 'chien-tich') ? 'rewards' : 'fight';
        if (typeof openDemonTowerModal === 'function') {
            openDemonTowerModal(targetTab);
        }
        return;
    }

    // Nếu truyền trực tiếp ID của một trang .game-page cụ thể
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        showPopupEl(targetPage);
    } else if (typeof openTab === 'function') {
        openTab(pageId);
    }
}
window.switchPage = switchPage;

/**
 * 3. Tính năng Click ra ngoài tự đóng (Click Outside Close):
 */
if (typeof document !== 'undefined') {
    document.querySelectorAll('#bottom-menu .nav-item-wrapper').forEach(wrapper => {
        const trigger = wrapper.querySelector('.nav-btn[aria-controls]');
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', 'false');
        let closeTimer;
        wrapper.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'mouse') return;
            clearTimeout(closeTimer);
            const menu = document.getElementById(trigger.getAttribute('aria-controls'));
            if (menu && !menu.classList.contains('active')) toggleDropup(menu.id);
        });
        wrapper.addEventListener('pointerleave', event => {
            if (event.pointerType !== 'mouse') return;
            closeTimer = setTimeout(() => {
                if (!wrapper.matches(':hover')) closeAllDropups();
            }, 180);
        });
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item-wrapper')) {
            closeAllDropups();
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        const openMenu = document.querySelector('#bottom-menu .dropup-menu.active');
        if (!openMenu) return;
        const trigger = openMenu.closest('.nav-item-wrapper')?.querySelector('.nav-btn');
        closeAllDropups();
        trigger?.focus();
        e.preventDefault();
    });
}

/**
 * 4. HIỆU ỨNG HÌNH ẢNH KHI CLICK CHUỘT (CLICK EFFECT / RIPPLE / SPARK)
 * - Append trực tiếp vào document.body
 * - Lấy tọa độ từ e.clientX và e.clientY (tọa độ chuẩn theo viewport)
 * - Tự động xóa sau khi animation hoàn tất (500ms)
 */
if (typeof document !== 'undefined') {
    document.addEventListener('click', function(e) {
        const effect = document.createElement('div');
        effect.className = 'click-effect-element';
        effect.style.left = e.clientX + 'px';
        effect.style.top = e.clientY + 'px';

        effect.innerHTML = `
            <div class="click-ripple"></div>
            <div class="click-spark click-spark--1"></div>
            <div class="click-spark click-spark--2"></div>
            <div class="click-spark click-spark--3"></div>
            <div class="click-spark click-spark--4"></div>
        `;

        document.body.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 500);
    });
}

// Export ra window toàn cục
if (typeof window !== 'undefined') {
    window.toggleDropup = toggleDropup;
    window.toggleDropupMenu = toggleDropupMenu;
    window.closeAllDropups = closeAllDropups;
    window.closeAllDropupMenus = closeAllDropupMenus;
    window.switchPage = switchPage;
}
if (typeof globalThis !== 'undefined') {
    globalThis.toggleDropup = toggleDropup;
    globalThis.toggleDropupMenu = toggleDropupMenu;
    globalThis.closeAllDropups = closeAllDropups;
    globalThis.closeAllDropupMenus = closeAllDropupMenus;
    globalThis.switchPage = switchPage;
}

let currentInventoryFilter = 'all';

function setInventoryFilter(filter) {
    if (!filter.startsWith('slot_')) {
        activeEquipTarget = null;
    }
    currentInventoryFilter = filter;
    renderRpgCharacterInventory(currentInventoryFilter);
}

function showItemTooltip(e, itemId) {
    const tooltip = document.getElementById('rpg-item-tooltip');
    if (!tooltip) return;
    const item = (typeof itemId === 'object' && itemId !== null) ? itemId : (Array.isArray(state.inventory) ? state.inventory.find(i => i.id === itemId) : null);
    if (!item) return;

    const rarityConfigs = {
        1: { name: 'Phàm Phẩm', color: 'text-slate-400', border: 'border-slate-500' },
        2: { name: 'Hạ Phẩm', color: 'text-emerald-400', border: 'border-emerald-500' },
        3: { name: 'Trung Phẩm', color: 'text-sky-400', border: 'border-sky-500' },
        4: { name: 'Thượng Phẩm', color: 'text-purple-400', border: 'border-purple-500' },
        5: { name: 'Cực Phẩm', color: 'text-amber-400', border: 'border-amber-400' },
        6: { name: 'Thần Phẩm', color: 'text-rose-400', border: 'border-rose-400' }
    };
    const rConfig = rarityConfigs[item.rarity] || rarityConfigs[1];
    const slotNames = {
        weapon: 'Vũ Khí',
        armor: 'Đạo Bào',
        boots: 'Phi Hài',
        ring: 'Giới Chỉ',
        talisman: 'Ngọc Bội',
        artifact: 'Bản Mệnh'
    };

    const slotKey = item.slot || (item.type === 'Pháp Bảo' ? 'artifact' : (item.type === 'Vũ Khí' ? 'weapon' : (item.type === 'secondary_weapon' ? 'secondary_weapon' : null)));
    let currentEquipped = null;
    if (slotKey) {
        if (state.equipped && state.equipped[slotKey]) {
            currentEquipped = state.equipped[slotKey];
        } else if (Array.isArray(state.inventory)) {
            currentEquipped = state.inventory.find(i => (i.slot === slotKey || (slotKey === 'artifact' && i.type === 'Pháp Bảo')) && i.equipped);
        }
    }

    function calcSingleItemCP(it) {
        if (!it) return 0;
        const hp = Number(it.hpBonus) || 0;
        const mp = Number(it.mpBonus) || 0;
        const atk = Number(it.atkBonus) || 0;
        const def = Number(it.defBonus) || 0;
        const crit = Number(it.critBonus) || 0;
        const dodge = Number(it.dodgeBonus) || 0;
        const raw = (hp * 1) + (mp * 2) + (atk * 15) + (def * 20) + ((crit + dodge) * 50);
        const r = Math.min(6, Math.max(1, Number(it.rarity) || 1));
        const qMult = r <= 1 ? 1.0 : (r <= 3 ? 1.2 : (r === 4 ? 1.5 : 2.0));
        const base = raw > 0 ? raw : (r * 120);
        const enh = Number(it.enhanceLevel || it.refineLevel || 0);
        const forgeLvl = Number(state.forgeLevel || 0);
        return Math.round(base * qMult + (enh * 100 + forgeLvl * 25));
    }

    let statLines = [];
    if (item.atkBonus) statLines.push(`<div class="flex items-center justify-between text-amber-300 font-mono text-xs"><span>Công Kích:</span><span>+${item.atkBonus}${item.atkPercent ? ` (+${Math.round(item.atkPercent * 100)}%)` : ''}</span></div>`);
    if (item.defBonus) statLines.push(`<div class="flex items-center justify-between text-sky-300 font-mono text-xs"><span>Phòng Ngự:</span><span>+${item.defBonus}</span></div>`);
    if (item.hpBonus) statLines.push(`<div class="flex items-center justify-between text-rose-300 font-mono text-xs"><span>Khí Huyết:</span><span>+${item.hpBonus}</span></div>`);
    if (item.mpBonus) statLines.push(`<div class="flex items-center justify-between text-cyan-300 font-mono text-xs"><span>Pháp Lực:</span><span>+${item.mpBonus}</span></div>`);
    if (item.critBonus) statLines.push(`<div class="flex items-center justify-between text-orange-300 font-mono text-xs"><span>Bạo Kích:</span><span>+${item.critBonus}%</span></div>`);
    if (item.speedBonus) statLines.push(`<div class="flex items-center justify-between text-amber-200 font-mono text-xs"><span>Thân Pháp:</span><span>+${item.speedBonus}</span></div>`);
    if (item.dodgeBonus) statLines.push(`<div class="flex items-center justify-between text-teal-300 font-mono text-xs"><span>Né Tránh:</span><span>+${item.dodgeBonus}%</span></div>`);
    if (item.rateBonus) statLines.push(`<div class="flex items-center justify-between text-emerald-300 font-mono text-xs"><span>Tốc độ tu luyện:</span><span>+${item.rateBonus}%</span></div>`);
    if (item.effect?.exp) statLines.push(`<div class="flex items-center justify-between text-jade-300 font-mono text-xs"><span>Linh Khí Tu Vi:</span><span>+${item.effect.exp}</span></div>`);
    if (item.effect?.breakBuff) statLines.push(`<div class="flex items-center justify-between text-purple-300 font-mono text-xs"><span>Độ Kiếp Hộ Trình:</span><span>+${item.effect.breakRate || 25}%</span></div>`);
    if (item.effect?.lifespan) statLines.push(`<div class="flex items-center justify-between text-teal-300 font-mono text-xs"><span>Thọ Nguyên:</span><span>+${item.effect.lifespan} năm</span></div>`);
    if (item.effect?.hp) statLines.push(`<div class="flex items-center justify-between text-rose-300 font-mono text-xs"><span>Khí Huyết Hồi Phục:</span><span>+${item.effect.hp.toLocaleString('vi-VN')}</span></div>`);
    if (item.effect?.mp) statLines.push(`<div class="flex items-center justify-between text-cyan-300 font-mono text-xs"><span>Pháp Lực Hồi Phục:</span><span>+${item.effect.mp.toLocaleString('vi-VN')}</span></div>`);
    if (item.effect?.permanentAtk) statLines.push(`<div class="flex items-center justify-between text-amber-300 font-mono text-xs"><span>Vĩnh Viễn Công Kích:</span><span>+${item.effect.permanentAtk}</span></div>`);
    if (item.effect?.permanentDef) statLines.push(`<div class="flex items-center justify-between text-sky-300 font-mono text-xs"><span>Vĩnh Viễn Phòng Ngự:</span><span>+${item.effect.permanentDef}</span></div>`);
    if (item.effect?.permanentHp) statLines.push(`<div class="flex items-center justify-between text-rose-400 font-mono text-xs"><span>Vĩnh Viễn Khí Huyết:</span><span>+${item.effect.permanentHp}</span></div>`);
    if (item.effect?.berserkBuff) statLines.push(`<div class="flex items-center justify-between text-red-400 font-mono text-xs"><span>Cuồng Hóa:</span><span>x${item.effect.berserkBuff.atkMult} Công (${item.effect.berserkBuff.duration}s)</span></div>`);
    if (item.effect?.toxicity) statLines.push(`<div class="flex items-center justify-between text-rose-400 font-mono text-xs"><span>Đan Độc:</span><span>+${item.effect.toxicity}%</span></div>`);
    if (item.effect?.clearToxicity) statLines.push(`<div class="flex items-center justify-between text-emerald-400 font-mono text-xs"><span>Giải Đan Độc:</span><span>-${item.effect.clearToxicity}%</span></div>`);
    if (item.passiveEffect) statLines.push(`<div class="p-1.5 rounded bg-purple-950/70 border border-purple-500/40 text-[10px] text-purple-200 mt-1 leading-snug"><i class="fa-solid fa-sparkles text-amber-300 mr-1"></i>${item.passiveEffect}</div>`);

    // MMORPG Equipment Comparison Card
    let comparisonHtml = '';
    const isComparing = slotKey && !item.equipped && currentEquipped && currentEquipped.id !== item.id;
    if (isComparing) {
        const curRConfig = rarityConfigs[currentEquipped.rarity] || rarityConfigs[1];
        const compDeltas = [
            { label: 'Công Kích', cur: Number(currentEquipped.atkBonus) || 0, next: Number(item.atkBonus) || 0, unit: '' },
            { label: 'Phòng Ngự', cur: Number(currentEquipped.defBonus) || 0, next: Number(item.defBonus) || 0, unit: '' },
            { label: 'Khí Huyết', cur: Number(currentEquipped.hpBonus) || 0, next: Number(item.hpBonus) || 0, unit: '' },
            { label: 'Pháp Lực', cur: Number(currentEquipped.mpBonus) || 0, next: Number(item.mpBonus) || 0, unit: '' },
            { label: 'Bạo Kích', cur: Number(currentEquipped.critBonus) || 0, next: Number(item.critBonus) || 0, unit: '%' },
            { label: 'Thân Pháp', cur: Number(currentEquipped.speedBonus) || 0, next: Number(item.speedBonus) || 0, unit: '' },
            { label: 'Né Tránh', cur: Number(currentEquipped.dodgeBonus) || 0, next: Number(item.dodgeBonus) || 0, unit: '%' },
            { label: 'Tốc độ tu', cur: Number(currentEquipped.rateBonus) || 0, next: Number(item.rateBonus) || 0, unit: '%' }
        ].filter(d => d.cur > 0 || d.next > 0);

        const curCp = calcSingleItemCP(currentEquipped);
        const nextCp = calcSingleItemCP(item);
        const deltaCp = nextCp - curCp;

        comparisonHtml = `
            <div class="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-amber-500/35 text-xs shadow-inner">
                <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px]">
                    <span class="text-amber-300 font-bold flex items-center gap-1">
                        <i class="fa-solid fa-code-compare text-amber-400"></i> Đối Chiếu Trang Bị:
                    </span>
                    <span class="${curRConfig.color} font-bold truncate max-w-[125px]">[${currentEquipped.name}]</span>
                </div>
                <div class="space-y-1">
                    ${compDeltas.map(d => {
                        const diff = d.next - d.cur;
                        const badge = diff > 0 
                            ? `<span class="text-emerald-400 font-bold font-mono">▲ +${diff}${d.unit}</span>`
                            : (diff < 0 ? `<span class="text-rose-400 font-bold font-mono">▼ ${diff}${d.unit}</span>` : `<span class="text-slate-400 font-mono">― 0${d.unit}</span>`);
                        return `
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="text-slate-400">${d.label}:</span>
                                <div class="flex items-center gap-1.5 font-mono">
                                    <span class="text-slate-200 font-semibold">${d.next}${d.unit}</span>
                                    <span class="text-slate-600">vs</span>
                                    <span class="text-slate-400">${d.cur}${d.unit}</span>
                                    ${badge}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold ${deltaCp > 0 ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30' : (deltaCp < 0 ? 'text-rose-300 bg-rose-950/60 border border-rose-500/30' : 'text-slate-300 bg-slate-950/60 border border-slate-700/40')} px-2 py-1 rounded">
                    <span class="flex items-center gap-1">
                        <i class="fa-solid ${deltaCp > 0 ? 'fa-arrow-trend-up text-emerald-400' : (deltaCp < 0 ? 'fa-arrow-trend-down text-rose-400' : 'fa-equals text-slate-400')}"></i>
                        Chiến Lực (CP):
                    </span>
                    <span class="font-mono">${deltaCp > 0 ? `▲ +${deltaCp.toLocaleString('vi-VN')}` : (deltaCp < 0 ? `▼ ${Math.abs(deltaCp).toLocaleString('vi-VN')}` : '― Cân bằng')}</span>
                </div>
            </div>
        `;
    } else if (slotKey && !item.equipped && !currentEquipped) {
        const nextCp = calcSingleItemCP(item);
        comparisonHtml = `
            <div class="my-2 p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-200">
                <div class="flex items-center justify-between font-bold">
                    <span class="flex items-center gap-1"><i class="fa-solid fa-shield-heart text-emerald-400"></i> Ô ${slotNames[slotKey] || slotKey} Đang Trống</span>
                    <span class="font-mono text-emerald-300">▲ +${nextCp.toLocaleString('vi-VN')} CP</span>
                </div>
                <p class="text-[10px] text-emerald-300/80 mt-0.5">Trang bị ngay để kích hoạt toàn bộ chỉ số vào Bản Nguyên!</p>
            </div>
        `;
    }

    const tooltipWidth = isComparing ? 'w-72 sm:w-80' : 'w-64';
    tooltip.className = `pointer-events-none fixed z-[99999] max-w-[calc(100vw-24px)] ${tooltipWidth} p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-md border ${rConfig.border} shadow-[0_0_25px_rgba(0,0,0,0.9)] text-slate-100 transition-opacity duration-150 select-none`;
    tooltip.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span class="font-bold text-sm ${rConfig.color}">${item.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 ${rConfig.color}">${rConfig.name}</span>
        </div>
        <div class="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
            <span>Loại: <b class="text-slate-200">${item.type}</b></span>
            ${item.slot ? `<span>• Ô: <b class="text-slate-200">${slotNames[item.slot] || item.slot}</b></span>` : ''}
            ${item.equipped ? `<span class="text-emerald-400 font-bold ml-auto">[Đang Đeo]</span>` : ''}
        </div>
        ${statLines.length > 0 ? `<div class="space-y-1 py-1.5 border-y border-slate-800/80 my-2">${statLines.join('')}</div>` : ''}
        ${comparisonHtml}
        <p class="text-xs text-slate-300/90 leading-relaxed my-2">${item.desc}</p>
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-gold-400/90 font-mono">
            <span>Số lượng: x${item.count || item.quantity || 1}</span>
            <span>${item.slot ? (item.equipped ? '⚡ Nhấn để Tháo' : '⚡ Nhấn để Đeo') : item.type === 'Đan Dược' ? '💊 Nhấn để Dùng' : item.type === 'Bí Tịch' ? '📖 Nhấn để Xem' : '📦 Nguyên liệu'}</span>
        </div>
    `;

    tooltip.classList.remove('hidden');
    updateItemTooltip(e);
}

function showSlotEmptyTooltip(e, slotLabel) {
    const tooltip = document.getElementById('rpg-item-tooltip');
    if (!tooltip) return;
    tooltip.className = `pointer-events-none fixed z-[99999] max-w-xs w-52 p-2.5 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-xl text-slate-100 transition-opacity duration-150 select-none`;
    tooltip.innerHTML = `
        <div class="text-xs font-bold text-slate-200">Ô ${slotLabel} Trống</div>
        <div class="text-[11px] text-slate-400 mt-1">Chọn trang bị tương ứng trong Túi Đồ để trang bị vào ô này.</div>
    `;
    tooltip.classList.remove('hidden');
    updateItemTooltip(e);
}

function updateItemTooltip(e) {
    const tooltip = document.getElementById('rpg-item-tooltip');
    if (!tooltip || tooltip.classList.contains('hidden')) return;
    const pad = 12;
    const rect = tooltip.getBoundingClientRect();
    const tipW = rect.width || 280;
    const tipH = rect.height || 220;

    let left = e.clientX + 16;
    let top = e.clientY + 16;

    if (left + tipW > window.innerWidth - pad) {
        left = e.clientX - tipW - 16;
    }
    if (top + tipH > window.innerHeight - pad) {
        top = e.clientY - tipH - 16;
    }

    left = Math.max(pad, Math.min(window.innerWidth - tipW - pad, left));
    top = Math.max(pad, Math.min(window.innerHeight - tipH - pad, top));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
}

function hideItemTooltip() {
    const tooltip = document.getElementById('rpg-item-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}

let activeEquipTarget = null; // { slotKey, slotLabel }

function triggerSlotFlash(slotKey) {
    setTimeout(() => {
        const slotEl = document.getElementById(`equip-slot-${slotKey}`);
        if (slotEl) {
            slotEl.classList.remove('slot-swap-flash');
            void slotEl.offsetWidth; // trigger reflow
            slotEl.classList.add('slot-swap-flash');
            setTimeout(() => {
                if (slotEl) slotEl.classList.remove('slot-swap-flash');
            }, 700);
        }
    }, 30);
}

function cancelEquipTargeting() {
    activeEquipTarget = null;
    currentInventoryFilter = 'equipment';
    renderRpgCharacterInventory(currentInventoryFilter);
}

function handleEquipSlotClick(slotKey, slotLabel) {
    const equippedItem = state.inventory.find(i => i.slot === slotKey && i.equipped);
    if (!equippedItem) {
        // Ô TRỐNG: Click để vào Targeting State hoặc click lại để hủy
        if (activeEquipTarget && activeEquipTarget.slotKey === slotKey) {
            cancelEquipTargeting();
        } else {
            activeEquipTarget = { slotKey, slotLabel };
            currentInventoryFilter = 'slot_' + slotKey;
            if (typeof playSound === 'function') playSound('bell');
            renderRpgCharacterInventory(currentInventoryFilter);
        }
    } else {
        // Ô ĐÃ CÓ ĐỒ: Mở Smart Popover (không tháo ngay, không đè danh sách)
        openEquipSlotPopover(equippedItem, slotLabel);
    }
}

function openEquipSlotPopover(item, slotLabel) {
    hideItemTooltip();
    let backdrop = document.getElementById('smart-slot-popover-backdrop');
    let card = document.getElementById('smart-slot-popover-card');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'smart-slot-popover-backdrop';
        backdrop.className = 'fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm items-center justify-center p-3 select-none flex';
        backdrop.onclick = (e) => { if (e.target === backdrop) closeSmartSlotPopover(); };
        card = document.createElement('div');
        card.id = 'smart-slot-popover-card';
        card.className = 'smart-popover-card w-full max-w-sm rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-200';
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
    } else {
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');
    }

    const rarityConfigs = {
        1: { name: 'Phàm Phẩm', color: 'text-slate-300', border: 'border-slate-500/50', badge: 'bg-slate-800 text-slate-300' },
        2: { name: 'Linh Phẩm', color: 'text-emerald-400', border: 'border-emerald-500/50', badge: 'bg-emerald-950 text-emerald-300 border border-emerald-600/40' },
        3: { name: 'Huyền Phẩm', color: 'text-sky-400', border: 'border-sky-500/50', badge: 'bg-sky-950 text-sky-300 border border-sky-600/40' },
        4: { name: 'Địa Phẩm', color: 'text-purple-400', border: 'border-purple-500/50', badge: 'bg-purple-950 text-purple-300 border border-purple-600/40' },
        5: { name: 'Thiên Phẩm', color: 'text-amber-400', border: 'border-amber-500/50', badge: 'bg-amber-950 text-amber-300 border border-amber-600/40' },
        6: { name: 'Tiên Phẩm', color: 'text-rose-400', border: 'border-rose-500/50', badge: 'bg-rose-950 text-rose-300 border border-rose-600/40' }
    };
    const rConfig = rarityConfigs[item.rarity] || rarityConfigs[1];

    const stats = [];
    if (item.atkBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-bolt text-amber-400"></i> Công Kích</span><b class="text-amber-300 font-mono">+${item.atkBonus}${item.atkPercent ? ` (+${Math.round(item.atkPercent * 100)}%)` : ''}</b></div>`);
    if (item.defBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-blue-400"></i> Phòng Ngự</span><b class="text-sky-300 font-mono">+${item.defBonus}</b></div>`);
    if (item.hpBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-heart text-rose-400"></i> Khí Huyết</span><b class="text-rose-300 font-mono">+${item.hpBonus}</b></div>`);
    if (item.mpBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-droplet text-cyan-400"></i> Pháp Lực</span><b class="text-cyan-300 font-mono">+${item.mpBonus}</b></div>`);
    if (item.critBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-burst text-orange-400"></i> Bạo Kích</span><b class="text-orange-300 font-mono">+${item.critBonus}%</b></div>`);
    if (item.speedBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-wind text-amber-300"></i> Thân Pháp</span><b class="text-amber-200 font-mono">+${item.speedBonus}</b></div>`);
    if (item.dodgeBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-person-running text-teal-400"></i> Né Tránh</span><b class="text-teal-300 font-mono">+${item.dodgeBonus}%</b></div>`);
    if (item.rateBonus) stats.push(`<div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"><span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-hourglass-half text-emerald-400"></i> Tốc Độ Tu Luyện</span><b class="text-emerald-300 font-mono">+${item.rateBonus}%</b></div>`);
    if (item.passiveEffect) stats.push(`<div class="p-2 rounded-lg bg-purple-950/70 border border-purple-500/40 text-[11px] text-purple-200 mt-1"><i class="fa-solid fa-sparkles text-amber-300 mr-1.5"></i><b>Nội Tại:</b> ${item.passiveEffect}</div>`);

    card.innerHTML = `
        <div class="relative z-10 flex flex-col gap-3">
            <!-- Header -->
            <div class="flex items-start justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-slate-900 border ${rConfig.border} flex items-center justify-center text-2xl text-gold-300 shadow-md">
                        <i class="fa-solid ${item.icon || 'fa-shield'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <h3 class="font-serif font-bold text-base ${rConfig.color}">${item.name}</h3>
                            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${rConfig.badge}">${rConfig.name}</span>
                        </div>
                        <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Vị trí: <b class="text-slate-200">${slotLabel}</b></span>
                            <span>•</span>
                            <span class="text-emerald-400 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check text-[10px]"></i> Đang Trang Bị</span>
                        </div>
                    </div>
                </div>
                <button type="button" onclick="closeSmartSlotPopover()" class="w-7 h-7 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Stats -->
            ${stats.length > 0 ? `
                <div class="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Thuộc Tính Gia Tăng</span>
                    ${stats.join('')}
                </div>
            ` : ''}

            <!-- Description -->
            <p class="text-xs text-slate-300 italic leading-relaxed px-1">
                "${item.desc || 'Trang bị hộ thể của tu sĩ trên con đường tu tiên.'}"
            </p>

            <!-- Actions: [Tháo Ra] & [Đổi] -->
            <div class="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button type="button" onclick="handleSmartPopoverUnequip('${item.id}')" class="py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/50 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95">
                    <i class="fa-solid fa-arrow-down-to-bracket"></i> Tháo Ra
                </button>
                <button type="button" onclick="handleSmartPopoverSwapEquip('${item.slot}', '${slotLabel}')" class="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.4)] active:scale-95">
                    <i class="fa-solid fa-arrows-rotate"></i> Đổi Trang Bị
                </button>
            </div>
        </div>
    `;
}

function closeSmartSlotPopover() {
    const backdrop = document.getElementById('smart-slot-popover-backdrop');
    if (backdrop) {
        backdrop.classList.add('hidden');
        backdrop.classList.remove('flex');
    }
}

function handleSmartPopoverUnequip(itemId) {
    closeSmartSlotPopover();
    const item = state.inventory.find(i => i.id === itemId);
    const slotKey = item?.slot;
    toggleEquipItem(itemId);
    if (slotKey) triggerSlotFlash(slotKey);
}

function handleSmartPopoverSwapEquip(slotKey, slotLabel) {
    closeSmartSlotPopover();
    activeEquipTarget = { slotKey, slotLabel };
    currentInventoryFilter = 'slot_' + slotKey;
    if (typeof playSound === 'function') playSound('bell');
    renderRpgCharacterInventory(currentInventoryFilter);
}

function handleInventoryItemClick(itemId) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;
    if (item.slot) {
        toggleEquipItem(itemId);
        if (activeEquipTarget) {
            activeEquipTarget = null;
            currentInventoryFilter = 'equipment';
        }
        triggerSlotFlash(item.slot);
    } else if (item.type === 'Bí Tịch' && item.skillId) {
        showSkillDetail(item.skillId);
    } else if (item.type === 'Đan Dược' || item.effect) {
        useInventoryItem(itemId);
    } else {
        addLog(`Vật phẩm [${item.name}] dùng cho đột phá hoặc chế tác đan dược/pháp bảo.`, 'text-slate-400');
    }
    hideItemTooltip();
}

let currentCharacterTab = 'inventory';

function switchCharacterTab(tabKey) {
    currentCharacterTab = tabKey;
    renderCharacterHub(tabKey);
}
window.switchCharacterTab = switchCharacterTab;

function getItemPowerScore(item) {
    if (!item) return 0;
    const atk = Number(item.atkBonus) || 0;
    const def = Number(item.defBonus) || 0;
    const hp = Number(item.hpBonus) || 0;
    const mp = Number(item.mpBonus) || 0;
    const rate = Number(item.rateBonus) || 0;
    const crit = Number(item.critBonus) || 0;
    const dodge = Number(item.dodgeBonus) || 0;
    const rarity = Number(item.rarity) || 1;
    const enhance = Number(item.enhanceLevel) || 0;

    const baseScore = (atk * 15) + (def * 20) + (hp * 1) + (mp * 2) + ((crit + dodge) * 50) + (rate * 10);
    const rarityMult = 1 + (rarity * 0.2) + (enhance * 0.1);
    return Math.round(baseScore * rarityMult) + (rarity * 50);
}
window.getItemPowerScore = getItemPowerScore;

function handleAutoEquipBestGear() {
    const slots = ['weapon', 'armor', 'talisman', 'artifact', 'ring', 'boots'];
    if (!state.equipped || typeof state.equipped !== 'object') {
        state.equipped = {};
    }
    const oldCP = getCombatPower();
    let equippedAny = false;
    const swappedSlots = [];
    const usedItemIds = new Set();

    slots.forEach(slotKey => {
        // Kiểm tra điều kiện mở khóa slot Vũ Khí Phụ (Kim Đan Kỳ)
        if (slotKey === 'artifact') {
            const currentRealm = REALMS[state.realmIndex];
            if (currentRealm && currentRealm.majorIndex < 2) {
                return;
            }
        }

        const currentEquipped = state.equipped[slotKey] || state.inventory.find(i => i.slot === slotKey && i.equipped);
        const currentScore = currentEquipped ? getItemPowerScore(currentEquipped) : -1;

        // Quét toàn bộ vật phẩm tương ứng trong túi có số lượng > 0 (không chọn món đang gắn ở slot khác)
        const candidates = state.inventory.filter(i => {
            if (!i || i.count <= 0) return false;
            if (usedItemIds.has(i.id)) return false;
            if (slotKey === 'artifact') {
                return i.slot === 'artifact' || i.slot === 'secondary_weapon' || i.type === 'Pháp Bảo' || i.type === 'secondary_weapon' || i.type === 'Vũ Khí Phụ' || (i.slot === 'weapon' && i.id !== state.equipped?.weapon?.id);
            }
            return i.slot === slotKey;
        });

        if (candidates.length === 0) {
            if (currentEquipped) usedItemIds.add(currentEquipped.id);
            return;
        }

        candidates.sort((a, b) => getItemPowerScore(b) - getItemPowerScore(a));
        const bestCandidate = candidates[0];
        const bestScore = getItemPowerScore(bestCandidate);

        if (bestCandidate !== currentEquipped && bestScore > currentScore) {
            // CHỈ ĐỔI ID VẬT PHẨM VÀ TRẠNG THÁI EQUIPPED — TUYỆT ĐỐI CẤM CỘNG TRỪ TRỰC TIẾP
            if (currentEquipped) {
                currentEquipped.equipped = false;
            }
            bestCandidate.equipped = true;
            state.equipped[slotKey] = bestCandidate;
            usedItemIds.add(bestCandidate.id);

            if (slotKey === 'weapon') {
                const swordEl = document.getElementById('flying-sword-visual');
                if (swordEl) swordEl.classList.remove('hidden');
            }

            equippedAny = true;
            swappedSlots.push(slotKey);
        } else if (currentEquipped) {
            usedItemIds.add(currentEquipped.id);
        }
    });

    if (equippedAny) {
        // GỌI calculateTotalStats() 1 LẦN DUY NHẤT SAU KHI ĐỔI XONG TOÀN BỘ TRANG BỊ
        if (typeof calculateTotalStats === 'function') {
            calculateTotalStats(state);
        }

        if (typeof playSound === 'function') playSound('sword');
        const newCP = getCombatPower();
        const cpDiff = Math.max(0, newCP - oldCP);

        addLog(`⚡ [Trang Bị Nhanh] Đã tự động ngự dụng bộ trang bị tối ưu nhất! Lực chiến tăng +${cpDiff.toLocaleString('vi-VN')} điểm.`, 'text-amber-300 font-bold');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, `+${cpDiff.toLocaleString('vi-VN')} Lực Chiến!`, 'text-amber-300 font-bold text-lg');
        }

        updateHUD();
        saveGameState();
        renderCharacterHub(currentCharacterTab);

        // Hiệu ứng lóe sáng (animate-flash) & Count-up Bảng Lực Chiến
        setTimeout(() => {
            const cpContainer = document.getElementById('rpg-char-cp-box');
            if (cpContainer) {
                cpContainer.classList.remove('cp-autoequip-flash');
                void cpContainer.offsetWidth; // reflow
                cpContainer.classList.add('cp-autoequip-flash');
                setTimeout(() => cpContainer.classList.remove('cp-autoequip-flash'), 900);
            }
            const cpEl = document.getElementById('rpg-char-combat-power');
            if (cpEl) {
                animateCombatPowerCountUp(cpEl, oldCP, newCP, 800);
            }
            swappedSlots.forEach(slotKey => {
                if (typeof triggerSlotFlash === 'function') triggerSlotFlash(slotKey);
            });
        }, 50);
    } else {
        if (typeof playSound === 'function') playSound('bell');
        addLog('🛡️ Toàn thân đã là trang bị tối ưu nhất hiện có trong túi, không có món nào mạnh hơn!', 'text-teal-300');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, 'Đã là trang bị tối ưu!', 'text-teal-300');
        }
    }
}
function quickEquip() {
    return handleAutoEquipBestGear();
}
window.quickEquip = quickEquip;
window.handleAutoEquipBestGear = handleAutoEquipBestGear;
window.autoEquip = quickEquip;

function autoEquip() {
    return handleAutoEquipBestGear();
}

function renderRpgCharacterInventory(filter = currentInventoryFilter) {
    currentInventoryFilter = filter;
    renderCharacterHub('inventory', null, filter);
}

// Chỉ thay đổi cách hiển thị. Dùng dữ liệu túi đồ thật, không sửa số lượng hoặc save.
function refineInventoryView() {
    const grid = document.getElementById('rpg-inventory-grid');
    if (!grid) return;
    const query = (document.getElementById('inventory-search')?.value || '').trim().toLocaleLowerCase('vi');
    const order = document.getElementById('inventory-order')?.value || 'default';
    const cards = Array.from(grid.querySelectorAll('[data-item-id]'));
    const items = new Map(state.inventory.map(item => [String(item.id), item]));
    const needsSorting = grid.dataset.sortOrder !== order;
    if (needsSorting && order !== 'default') {
        cards.sort((a, b) => {
            const first = items.get(a.dataset.itemId) || {};
            const second = items.get(b.dataset.itemId) || {};
            if (order === 'rarity') return (second.rarity || 1) - (first.rarity || 1);
            return String(first.name || '').localeCompare(String(second.name || ''), 'vi');
        });
    } else if (needsSorting) {
        const positions = new Map(state.inventory.map((item, index) => [String(item.id), index]));
        cards.sort((a, b) => positions.get(a.dataset.itemId) - positions.get(b.dataset.itemId));
    }
    let visible = 0;
    cards.forEach(card => {
        const matches = (card.title || '').toLocaleLowerCase('vi').includes(query);
        card.hidden = !matches;
        if (matches) visible++;
        if (needsSorting) grid.appendChild(card);
    });
    grid.querySelectorAll(':scope > :not([data-item-id])').forEach(slot => {
        slot.hidden = Boolean(query);
        if (needsSorting) grid.appendChild(slot);
    });
    grid.dataset.sortOrder = order;
    const result = document.getElementById('inventory-search-result');
    if (result) result.textContent = `${visible} loại vật phẩm`;
}

// ==================== BỘ ICON & VECTOR PHONG CÁCH TIÊN HIỆP ĐẲNG CẤP ====================
function getXianxiaItemSVG(type = '', rarity = 1, slot = '', name = '') {
    const r = Math.min(6, Math.max(1, Number(rarity) || 1));
    const palettes = {
        1: { p: '#94a3b8', a: '#cbd5e1', g: 'rgba(148, 163, 184, 0.4)' }, // Phàm
        2: { p: '#10b981', a: '#34d399', g: 'rgba(16, 185, 129, 0.5)' },  // Linh
        3: { p: '#0284c7', a: '#38bdf8', g: 'rgba(56, 189, 248, 0.5)' },  // Huyền
        4: { p: '#9333ea', a: '#c084fc', g: 'rgba(168, 85, 247, 0.5)' },  // Địa
        5: { p: '#d97706', a: '#fbbf24', g: 'rgba(245, 158, 11, 0.6)' },  // Thiên
        6: { p: '#e11d48', a: '#fb7185', g: 'rgba(244, 63, 94, 0.7)' }   // Thần
    };
    const c = palettes[r] || palettes[1];
    const s = String(slot || '').toLowerCase();
    const t = String(type || '').toLowerCase();
    const n = String(name || '').toLowerCase();

    // 1. Áo Giáp / Đạo Bào
    if (s === 'armor' || t.includes('giáp') || n.includes('bào') || n.includes('giáp') || n.includes('y')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 10 L32 20 L42 10 L50 20 L44 32 L40 28 L40 54 L24 54 L24 28 L20 32 L14 20 Z" fill="${c.p}" fill-opacity="0.3" stroke="${c.a}" stroke-width="2" stroke-linejoin="round"/>
            <path d="M22 10 L32 24 L42 10" stroke="${c.a}" stroke-width="2" stroke-linecap="round"/>
            <path d="M24 38 L40 38" stroke="${c.a}" stroke-width="2.5"/>
            <circle cx="32" cy="38" r="3" fill="${c.a}" stroke="#0f172a" stroke-width="1"/>
            <path d="M32 38 L32 50" stroke="${c.a}" stroke-width="1.5" stroke-dasharray="2 2"/>
            <path d="M27 44 C27 48 37 48 37 44" stroke="${c.p}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        </svg>`;
    }

    // 2. Phi Kiếm / Vũ Khí
    if (s === 'weapon' || t.includes('vũ khí') || n.includes('kiếm') || n.includes('đao') || n.includes('thương')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M48 12 L52 16 L26 42 L22 38 Z" fill="${c.p}" fill-opacity="0.35" stroke="${c.a}" stroke-width="2" stroke-linejoin="round"/>
            <path d="M52 12 L50 14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <path d="M22 38 L16 44 L14 42 L20 36 Z" fill="${c.p}" stroke="${c.a}" stroke-width="1.5"/>
            <path d="M14 44 L10 48" stroke="${c.a}" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="9" cy="49" r="2" fill="${c.a}"/>
            <path d="M9 51 C8 55 6 56 5 58" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="30" y1="34" x2="44" y2="20" stroke="#ffffff" stroke-width="1" opacity="0.8"/>
            <circle cx="40" cy="18" r="1.5" fill="#ffffff"/>
        </svg>`;
    }

    // 3. Bát Quái Kính / Vũ Khí Phụ / Pháp Bảo
    if (s === 'artifact' || s === 'secondary_weapon' || n.includes('kính') || n.includes('thuẫn') || n.includes('khiên') || n.includes('trận')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="22,8 42,8 54,20 54,44 42,56 22,56 10,44 10,20" fill="${c.p}" fill-opacity="0.25" stroke="${c.a}" stroke-width="2"/>
            <circle cx="32" cy="32" r="15" fill="#0b1329" stroke="${c.a}" stroke-width="1.5"/>
            <path d="M32 17 A7.5 7.5 0 0 1 32 32 A7.5 7.5 0 0 0 32 47 A15 15 0 0 1 32 17" fill="${c.a}"/>
            <circle cx="32" cy="24.5" r="2" fill="#0b1329"/>
            <circle cx="32" cy="39.5" r="2" fill="${c.a}"/>
            <line x1="32" y1="11" x2="32" y2="14" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="32" y1="50" x2="32" y2="53" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="13" y1="32" x2="16" y2="32" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="48" y1="32" x2="51" y2="32" stroke="${c.a}" stroke-width="1.5"/>
        </svg>`;
    }

    // 4. Hộ Thân Ngọc Bội
    if (s === 'talisman' || n.includes('ngọc bội') || n.includes('bội') || n.includes('phù')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8 C30 14 34 14 32 18" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="30" r="14" fill="${c.p}" fill-opacity="0.3" stroke="${c.a}" stroke-width="2.5"/>
            <circle cx="32" cy="30" r="6" fill="#0b1329" stroke="${c.a}" stroke-width="1.5"/>
            <path d="M24 30 C24 26 28 22 32 22" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
            <path d="M30 44 L28 58 M34 44 L36 58" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="44" r="2.5" fill="#f59e0b"/>
        </svg>`;
    }

    // 5. Càn Khôn Giới Chỉ
    if (s === 'ring' || n.includes('giới chỉ') || n.includes('nhẫn')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="36" rx="16" ry="12" fill="none" stroke="${c.a}" stroke-width="3"/>
            <ellipse cx="32" cy="34" rx="16" ry="12" fill="none" stroke="${c.p}" stroke-width="1" opacity="0.7"/>
            <polygon points="32,14 40,20 32,26 24,20" fill="${c.a}" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="32" cy="20" r="2" fill="#ffffff"/>
            <line x1="32" y1="10" x2="32" y2="6" stroke="${c.a}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="20" y1="14" x2="16" y2="10" stroke="${c.a}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="44" y1="14" x2="48" y2="10" stroke="${c.a}" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
    }

    // 6. Vân Hài / Phi Hài
    if (s === 'boots' || n.includes('hài') || n.includes('giày') || n.includes('ủng')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 14 L34 14 L34 32 L48 38 C54 41 54 48 48 48 L18 48 C14 48 14 40 18 36 L22 32 Z" fill="${c.p}" fill-opacity="0.3" stroke="${c.a}" stroke-width="2" stroke-linejoin="round"/>
            <path d="M22 14 L34 14" stroke="${c.a}" stroke-width="3" stroke-linecap="round"/>
            <path d="M44 48 C48 48 52 45 50 42 C48 39 42 42 42 44" stroke="${c.a}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M16 48 L48 48" stroke="${c.a}" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`;
    }

    // 7. Linh Đan Hồ Lô / Đan Dược
    if (t.includes('đan') || n.includes('đan') || n.includes('hoàn') || n.includes('dược')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="24" r="8" fill="${c.p}" fill-opacity="0.3" stroke="${c.a}" stroke-width="2"/>
            <circle cx="32" cy="42" r="13" fill="${c.p}" fill-opacity="0.3" stroke="${c.a}" stroke-width="2"/>
            <rect x="29" y="12" width="6" height="5" rx="1.5" fill="${c.a}" stroke="${c.p}" stroke-width="1.5"/>
            <path d="M26 31 C29 33 35 33 38 31" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <path d="M36 32 L40 40 M38 32 L42 38" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="48" cy="20" r="4" fill="${c.a}" stroke="#ffffff" stroke-width="1"/>
            <circle cx="47" cy="19" r="1" fill="#ffffff"/>
            <path d="M46 14 C48 10 52 10 50 6" stroke="${c.a}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        </svg>`;
    }

    // 8. Ngọc Giản / Bí Kíp
    if (t.includes('bí tịch') || n.includes('bí tịch') || n.includes('quyển') || n.includes('công pháp') || n.includes('kinh')) {
        return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="16" width="36" height="32" rx="3" fill="${c.p}" fill-opacity="0.25" stroke="${c.a}" stroke-width="2"/>
            <line x1="22" y1="16" x2="22" y2="48" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="32" y1="16" x2="32" y2="48" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="42" y1="16" x2="42" y2="48" stroke="${c.a}" stroke-width="1.5"/>
            <line x1="14" y1="32" x2="50" y2="32" stroke="#f59e0b" stroke-width="2"/>
            <circle cx="32" cy="32" r="3" fill="#ef4444" stroke="#f59e0b" stroke-width="1"/>
            <circle cx="48" cy="18" r="1.5" fill="#ffffff"/>
        </svg>`;
    }

    // 9. Túi Gấm Càn Khôn (Mặc định cho Nguyên Liệu, Thảo Dược, Khoáng Thạch, Tạp Vật)
    return `<svg viewBox="0 0 64 64" class="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow pointer-events-none group-hover:scale-115 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 20 C18 20 14 30 14 42 C14 52 22 56 32 56 C42 56 50 52 50 42 C50 30 46 20 42 20 Z" fill="${c.p}" fill-opacity="0.35" stroke="${c.a}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M20 16 L24 22 L40 22 L44 16 Z" fill="${c.a}" fill-opacity="0.6" stroke="${c.p}" stroke-width="1.5"/>
        <ellipse cx="32" cy="22" rx="10" ry="2.5" fill="none" stroke="#f59e0b" stroke-width="2"/>
        <path d="M30 24 L27 32 M34 24 L37 32" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <text x="32" y="44" font-family="serif" font-size="14" font-weight="900" text-anchor="middle" fill="${c.a}">乾</text>
    </svg>`;
}
window.getXianxiaItemSVG = getXianxiaItemSVG;

// ==================== TẨY RỬA & PHÂN GIẢI NGUYÊN LIỆU ====================
function cleanOrRecycleMaterials() {
    const recyclable = state.inventory.filter(item => 
        !item.equipped && 
        !item.slot && 
        item.type !== 'Đan Dược' && 
        item.type !== 'Pháp Bảo' && 
        item.type !== 'Bí Tịch' && 
        (item.count > 0 || item.quantity > 0)
    );

    if (recyclable.length === 0) {
        if (typeof showGameToast === 'function') showGameToast('Càn Khôn Nang không có nguyên liệu tồn đọng để phân giải!');
        else if (typeof addLog === 'function') addLog('Càn Khôn Nang không có nguyên liệu tồn đọng để phân giải.', 'text-amber-300');
        return;
    }

    let totalGain = 0;
    let totalItems = 0;
    recyclable.forEach(item => {
        const count = item.count || item.quantity || 1;
        const rarity = item.rarity || 1;
        const gain = Math.max(10, rarity * 25) * count;
        totalGain += gain;
        totalItems += count;
    });

    const confirmed = window.confirm(`Bản Tôn có chắc chắn muốn phân giải/thu hồi ${recyclable.length} loại nguyên liệu (${totalItems.toLocaleString('vi-VN')} món) thành ${totalGain.toLocaleString('vi-VN')} Linh Thạch không?`);
    if (!confirmed) return;

    recyclable.forEach(item => {
        item.count = 0;
        if ('quantity' in item) item.quantity = 0;
    });

    state.stones = (state.stones || 0) + totalGain;
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateResourceUI === 'function') updateResourceUI();
    if (typeof addLog === 'function') {
        addLog(`Phân giải hoàn tất ${recyclable.length} loại nguyên liệu, thu về ${totalGain.toLocaleString('vi-VN')} Linh Thạch!`, 'text-emerald-400');
    }
    if (typeof showGameToast === 'function') {
        showGameToast(`Đã thu hồi ${totalGain.toLocaleString('vi-VN')} Linh Thạch!`);
    }

    renderCharacterHub('inventory');
}
window.cleanOrRecycleMaterials = cleanOrRecycleMaterials;

function recycleSingleItem(itemId) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || item.equipped || (!item.count && !item.quantity)) return;
    const count = item.count || item.quantity || 1;
    const rarity = item.rarity || 1;
    const gain = Math.max(15, rarity * 30) * count;
    const confirmed = window.confirm(`Bản Tôn có muốn phân giải [${item.name}] (x${count}) lấy ${gain.toLocaleString('vi-VN')} Linh Thạch không?`);
    if (!confirmed) return;

    item.count = 0;
    if ('quantity' in item) item.quantity = 0;
    state.stones = (state.stones || 0) + gain;
    if (typeof saveGameState === 'function') saveGameState();
    if (typeof updateResourceUI === 'function') updateResourceUI();
    if (typeof addLog === 'function') addLog(`Đã phân giải [${item.name}] thu về ${gain.toLocaleString('vi-VN')} Linh Thạch!`, 'text-emerald-400');
    if (typeof showGameToast === 'function') showGameToast(`Đã thu hồi ${gain.toLocaleString('vi-VN')} Linh Thạch!`);

    inspectedInventoryItemId = null;
    renderCharacterHub('inventory');
}
window.recycleSingleItem = recycleSingleItem;

function renderEmptyInspector(panel) {
    if (!panel) return;
    panel.innerHTML = `
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-500/40 shrink-0">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-xianxia font-black text-sm uppercase tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center gap-1.5">
                🔮 Đài Giám Định
            </span>
            <button type="button" onclick="navigateTo('main-screen')" class="w-7 h-7 rounded-xl bg-rose-950/90 hover:bg-rose-700 border border-rose-500/80 hover:border-rose-300 text-rose-200 hover:text-white flex items-center justify-center font-bold text-xs transition-all shadow-[0_0_10px_rgba(244,63,94,0.4)] active:scale-95 cursor-pointer" title="Đóng về Màn Hình Chính">
                ✕
            </button>
        </div>
        <div class="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-300 my-auto">
            <div class="relative w-24 h-24 flex items-center justify-center mb-4">
                <div class="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/50 animate-spin-slow"></div>
                <div class="absolute w-16 h-16 rounded-full border border-cyan-400/50 animate-pulse"></div>
                <span class="text-4xl text-amber-300 font-serif select-none drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">☯</span>
            </div>
            <p class="font-serif text-xs text-yellow-200 leading-relaxed font-bold max-w-[220px] drop-shadow">
                ✦ Chạm chọn bảo vật trong Càn Khôn Bảo Nang để giám định thuộc tính và so sánh Lực Chiến ✦
            </p>
            <span class="text-[11px] text-amber-300/80 mt-3 font-mono bg-slate-900/90 border border-amber-500/30 px-2.5 py-1 rounded-full shadow-inner">So Sánh Lực Chiến & Thao Tác Nhanh</span>
        </div>
    `;
    panel.hidden = false;
}
window.renderEmptyInspector = renderEmptyInspector;

let inspectedInventoryItemId = null;
function inspectInventoryItem(itemId) {
    if (activeEquipTarget) {
        handleItemClick(itemId);
        return;
    }
    inspectedInventoryItemId = itemId;
    const panel = document.getElementById('inventory-inspector');
    const item = state.inventory.find(entry => entry.id === itemId);
    if (!panel) return;
    if (!item) {
        renderEmptyInspector(panel);
        return;
    }

    const r = Math.min(6, Math.max(1, item.rarity || 1));
    const rarityNames = { 1: 'Phàm Phẩm', 2: 'Linh Phẩm', 3: 'Huyền Phẩm', 4: 'Địa Phẩm', 5: 'Thiên Phẩm', 6: 'Thần Phẩm' };
    const rarityColors = { 1: 'text-slate-200', 2: 'text-emerald-300', 3: 'text-sky-300', 4: 'text-purple-300', 5: 'text-amber-300', 6: 'text-rose-300' };
    const rarityName = rarityNames[r] || 'Phàm Phẩm';
    const rarityColor = rarityColors[r] || 'text-slate-200';
    const countNum = item.count || item.quantity || 1;

    // Item preview
    const safeName = (item.name || '').replace(/'/g, "\\'");
    const safeType = (item.type || '').replace(/'/g, "\\'");
    const safeSlot = (item.slot || '').replace(/'/g, "\\'");
    const hasImage = item.image || (item.icon && (item.icon.includes('/') || item.icon.includes('.')));
    const previewHtml = hasImage 
        ? `<img src="${item.image || item.icon}" alt="${item.name}" class="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" onerror="this.outerHTML=getXianxiaItemSVG('${safeType}', ${r}, '${safeSlot}', '${safeName}')">`
        : getXianxiaItemSVG(item.type, r, item.slot, item.name);

    // Power Score & Comparison
    let powerCompareHtml = '';
    if (item.slot) {
        const itemScore = getItemPowerScore(item);
        const equipped = state.inventory.find(entry => entry.slot === item.slot && entry.equipped);
        if (item.equipped) {
            powerCompareHtml = `
                <div class="p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-400 text-center my-2.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <span class="text-xs font-xianxia font-black text-yellow-300 block drop-shadow">✦ ĐANG NGỰ DỤNG ✦</span>
                    <span class="font-mono font-black text-amber-200 text-base drop-shadow">Lực Chiến: ${itemScore.toLocaleString('vi-VN')}</span>
                </div>
            `;
        } else {
            const equippedScore = equipped ? getItemPowerScore(equipped) : 0;
            const diff = itemScore - equippedScore;
            if (diff > 0) {
                powerCompareHtml = `
                    <div class="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900 to-emerald-950/95 border-2 border-emerald-400 my-2.5 shadow-[0_0_22px_rgba(16,185,129,0.45)]">
                        <div class="flex items-center justify-between text-xs font-xianxia">
                            <span class="text-emerald-200 font-black flex items-center gap-1.5"><i class="fa-solid fa-arrow-trend-up text-emerald-400 text-sm"></i> Lực Chiến Dự Kiến:</span>
                            <span class="text-emerald-300 font-mono font-black text-base drop-shadow">▲ +${diff.toLocaleString('vi-VN')} LC</span>
                        </div>
                        ${equipped ? `<div class="text-[11px] text-slate-300 mt-1 font-mono truncate">So với ${equipped.name} (${equippedScore.toLocaleString('vi-VN')} LC)</div>` : ''}
                    </div>
                `;
            } else if (diff < 0) {
                powerCompareHtml = `
                    <div class="p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/95 via-slate-900 to-rose-950/95 border-2 border-rose-400 my-2.5 shadow-[0_0_22px_rgba(244,63,94,0.45)]">
                        <div class="flex items-center justify-between text-xs font-xianxia">
                            <span class="text-rose-200 font-black flex items-center gap-1.5"><i class="fa-solid fa-arrow-trend-down text-rose-400 text-sm"></i> Lực Chiến Dự Kiến:</span>
                            <span class="text-rose-300 font-mono font-black text-base drop-shadow">▼ ${diff.toLocaleString('vi-VN')} LC</span>
                        </div>
                        ${equipped ? `<div class="text-[11px] text-slate-300 mt-1 font-mono truncate">So với ${equipped.name} (${equippedScore.toLocaleString('vi-VN')} LC)</div>` : ''}
                    </div>
                `;
            } else {
                powerCompareHtml = `
                    <div class="p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-400/80 my-2.5 text-center">
                        <span class="text-yellow-300 font-mono font-bold text-xs">— Tương Đương (${itemScore.toLocaleString('vi-VN')} LC)</span>
                    </div>
                `;
            }
        }
    }

    // Stats Grid
    const fields = [
        { k: 'atkBonus', l: 'Công Kích', ic: 'fa-bolt', col: 'text-amber-400' },
        { k: 'defBonus', l: 'Phòng Ngự', ic: 'fa-shield', col: 'text-sky-400' },
        { k: 'hpBonus', l: 'Khí Huyết', ic: 'fa-heart-pulse', col: 'text-rose-400' },
        { k: 'mpBonus', l: 'Pháp Lực', ic: 'fa-droplet', col: 'text-cyan-400' },
        { k: 'critBonus', l: 'Bạo Kích', ic: 'fa-burst', col: 'text-orange-400', pct: '%' },
        { k: 'dodgeBonus', l: 'Né Tránh', ic: 'fa-wind', col: 'text-teal-400', pct: '%' },
        { k: 'speedBonus', l: 'Tốc Độ', ic: 'fa-gauge-high', col: 'text-yellow-400' },
        { k: 'rateBonus', l: 'Tu Luyện', ic: 'fa-arrow-up', col: 'text-purple-400', pct: '%' }
    ];
    const statLines = fields.filter(f => item[f.k]).map(f => `
        <div class="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between text-xs shadow-inner">
            <span class="text-slate-200 text-xs font-bold flex items-center gap-1.5"><i class="fa-solid ${f.ic} ${f.col} text-[11px]"></i> ${f.l}</span>
            <span class="text-yellow-300 font-mono font-black text-xs drop-shadow">+${item[f.k]}${f.pct || ''}</span>
        </div>
    `).join('');

    // Actions Cluster with High Contrast CTA classes
    let actionButtonsHtml = '';
    if (item.slot) {
        if (item.equipped) {
            actionButtonsHtml = `
                <button type="button" onclick="handleInventoryItemClick('${item.id}'); inspectInventoryItem('${item.id}');" class="btn-cta-danger w-full py-2.5 px-3 rounded-xl font-xianxia font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                    <i class="fa-solid fa-shield-halved"></i> Tháo Trang Bị
                </button>
            `;
        } else {
            actionButtonsHtml = `
                <button type="button" onclick="handleInventoryItemClick('${item.id}'); inspectInventoryItem('${item.id}');" class="btn-cta-gold w-full py-2.5 px-3 rounded-xl font-xianxia font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                    <i class="fa-solid fa-khanda"></i> Trang Bị Ngay
                </button>
            `;
        }
    } else if (item.type === 'Đan Dược' || item.effect) {
        actionButtonsHtml = `
            <button type="button" onclick="handleInventoryItemClick('${item.id}'); inspectInventoryItem('${item.id}');" class="btn-cta-emerald w-full py-2.5 px-3 rounded-xl font-xianxia font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                <i class="fa-solid fa-flask"></i> Dược Dụng (Dùng 1)
            </button>
        `;
    } else if (item.type === 'Bí Tịch' && item.skillId) {
        actionButtonsHtml = `
            <button type="button" onclick="handleInventoryItemClick('${item.id}');" class="btn-cta-cyan w-full py-2.5 px-3 rounded-xl font-xianxia font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                <i class="fa-solid fa-book-open"></i> Lĩnh Ngộ Công Pháp
            </button>
        `;
    }

    if (!item.equipped) {
        actionButtonsHtml += `
            <button type="button" onclick="recycleSingleItem('${item.id}')" class="w-full mt-2 py-1.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-500/60 text-xs font-xianxia font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm">
                <i class="fa-solid fa-recycle text-rose-400"></i> Phân Giải Món Này
            </button>
        `;
    }

    panel.innerHTML = `
        <!-- Header Đài Giám Định có nút Đóng -->
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-500/40 shrink-0">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-xianxia font-black text-sm uppercase tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center gap-1.5">
                🔮 Đài Giám Định
            </span>
            <button type="button" onclick="navigateTo('main-screen')" class="w-7 h-7 rounded-xl bg-rose-950/90 hover:bg-rose-700 border border-rose-500/80 hover:border-rose-300 text-rose-200 hover:text-white flex items-center justify-center font-bold text-xs transition-all shadow-[0_0_10px_rgba(244,63,94,0.4)] active:scale-95 cursor-pointer" title="Đóng về Màn Hình Chính">
                ✕
            </button>
        </div>

        <!-- Khung Phóng To 72x72 & Tên Bảo Vật -->
        <div class="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-inner shrink-0">
            <div class="w-[72px] h-[72px] rounded-2xl flex items-center justify-center relative mb-2.5 rpg-rarity-${r} shadow-[0_0_22px_rgba(245,158,11,0.35)]">
                ${previewHtml}
                <span class="absolute -bottom-1.5 -right-1.5 text-[11px] text-yellow-300 font-mono font-black bg-slate-950 px-2 py-0.5 rounded-full border border-amber-400 shadow-md">x${countNum}</span>
            </div>
            <h3 class="font-xianxia font-black text-sm sm:text-base ${rarityColor} tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">${item.name}</h3>
            <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] font-xianxia font-bold ${rarityColor} px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-500/40">[${rarityName}]</span>
                <span class="text-[11px] text-yellow-200 font-mono font-semibold">${item.type || (item.slot ? 'Trang Bị' : 'Vật Phẩm')}</span>
            </div>
        </div>

        <!-- So Sánh Lực Chiến -->
        ${powerCompareHtml}

        <!-- Thuộc Tính Cộng Thêm -->
        ${statLines ? `
            <div class="my-2.5 shrink-0">
                <span class="text-xs font-xianxia font-bold uppercase tracking-widest text-yellow-300 block mb-1.5 drop-shadow">✦ Thuộc Tính Bảo Vật ✦</span>
                <div class="grid grid-cols-2 gap-1.5">
                    ${statLines}
                </div>
            </div>
        ` : ''}

        <!-- Mô Tả Truyền Thuyết (Lore) -->
        <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 my-2.5 shrink-0">
            <p class="font-serif italic text-xs text-slate-200 leading-relaxed text-justify">
                "${item.desc || 'Bảo vật thiên địa tạo hóa, ẩn chứa linh vận kỳ diệu.'}"
            </p>
        </div>

        <!-- Cụm Nút Thao Tác Đáy Cột -->
        <div class="mt-auto pt-3 border-t border-amber-500/30 shrink-0">
            ${actionButtonsHtml}
        </div>
    `;

    panel.hidden = false;
    document.querySelectorAll('#rpg-inventory-grid [data-item-id]').forEach(card => {
        const isCurrent = card.dataset.itemId === itemId;
        card.setAttribute('aria-pressed', String(isCurrent));
        if (isCurrent) {
            card.classList.add('ring-2', 'ring-yellow-300', 'border-yellow-300', 'shadow-[0_0_20px_rgba(253,224,71,0.7)]');
        } else {
            card.classList.remove('ring-2', 'ring-yellow-300', 'border-yellow-300', 'shadow-[0_0_20px_rgba(253,224,71,0.7)]');
        }
    });
}
window.inspectInventoryItem = inspectInventoryItem;

function renderCharacterHub(activeTab = currentCharacterTab || 'inventory', content = null, filter = currentInventoryFilter) {
    currentCharacterTab = activeTab;
    let host = content;
    if (!host) {
        if (activeTab === 'inventory') host = document.getElementById('inventory-page-content');
        else if (activeTab === 'skills') host = document.getElementById('skills-page-content');
        else if (activeTab === 'root') host = document.getElementById('root-page-content');
        else if (activeTab === 'artifact') host = document.getElementById('artifact-page-content');
        else if (activeTab === 'pet') host = document.getElementById('pet-page-content');
    }
    if (!host) {
        const activeCharPage = document.querySelector('.game-page.active[id^="page-"]');
        if (activeCharPage) {
            host = activeCharPage.querySelector('[id$="-page-content"]');
        }
    }
    if (!host) host = document.getElementById('hub-modal-content');
    if (!host) return;

    const avatarUrl = typeof getPlayerAvatarUrl === 'function' ? getPlayerAvatarUrl() : (typeof DEFAULT_CULTIVATION_AVATAR !== 'undefined' ? DEFAULT_CULTIVATION_AVATAR : '');
    const effectiveStats = typeof getEffectiveStats === 'function' ? getEffectiveStats() : { atk: state.atk, def: state.def, maxHp: state.maxHp, maxMp: state.maxMp, crit: state.crit };
    const combatPower = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const maxLifespan = typeof getThoNguyenMax === 'function' ? getThoNguyenMax() : (state.lifespan || 100);
    const currentRealm = REALMS[state.realmIndex] || { name: 'Luyện Khí' };

    // 2. NÂNG CẤP "LỤC HỢP BẢN MỆNH TRẬN" (6 Ô TRANG BỊ CHUẨN ĐẸP 2D TIÊN HIỆP)
    const renderEquipSlot = (slotKey, slotLabel, defaultIcon) => {
        const item = state.inventory.find(i => i.slot === slotKey && i.equipped);
        const isTargeted = Boolean(activeEquipTarget && activeEquipTarget.slotKey === slotKey);

        if (!item) {
            return `
                <div id="equip-slot-${slotKey}"
                     class="w-16 h-16 rounded-2xl bg-slate-900/80 border ${isTargeted ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-slate-700/80 hover:border-amber-400/60'} flex flex-col items-center justify-center p-1.5 relative cursor-pointer transition-all duration-300 hover:scale-105"
                     data-drop-zone="equipment"
                     data-slot="${slotKey}"
                     title="Ô ${slotLabel} Trống"
                     onclick="handleEquipSlotClick('${slotKey}', '${slotLabel}')"
                     onmouseenter="showSlotEmptyTooltip(event, '${slotLabel}')"
                     onmousemove="moveItemTooltip(event)"
                     onmouseleave="hideItemTooltip()">
                    <div class="w-8 h-8 flex items-center justify-center text-slate-500 text-lg opacity-60">
                        ${defaultIcon}
                    </div>
                    <span class="text-[10px] font-semibold text-slate-400 whitespace-nowrap mt-0.5 tracking-wider">${slotLabel}</span>
                    ${isTargeted ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-ping"></span>' : ''}
                </div>
            `;
        }

        const r = Math.min(6, Math.max(1, item.rarity || 1));
        const rarityBorders = {
            1: 'border-slate-600/70',
            2: 'border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
            3: 'border-sky-500/60 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
            4: 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
            5: 'border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
            6: 'border-rose-500/80 shadow-[0_0_18px_rgba(244,63,94,0.4)]'
        };
        const rarityBorderClass = rarityBorders[r] || 'border-slate-600/70';
        const hasEquipImage = item.image || (item.icon && (item.icon.includes('/') || item.icon.includes('.')));
        const equipIconHtml = hasEquipImage 
            ? `<img src="${item.image || item.icon}" alt="${item.name}" class="w-8 h-8 object-contain pointer-events-none drop-shadow" onerror="this.outerHTML='<div class=\\\'w-8 h-8 flex items-center justify-center text-lg\\\'>${defaultIcon}</div>'">`
            : `<div class="w-8 h-8 flex items-center justify-center text-lg">${defaultIcon}</div>`;

        return `
            <div id="equip-slot-${slotKey}"
                 class="w-16 h-16 rounded-2xl bg-slate-900/90 border ${isTargeted ? 'border-amber-300 ring-2 ring-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)]' : rarityBorderClass} flex flex-col items-center justify-center p-1.5 relative cursor-pointer transition-all duration-300 hover:scale-105 hover:border-amber-400"
                 draggable="true"
                 data-drop-zone="equipment"
                 data-slot="${slotKey}"
                 data-item-id="${item.id}"
                 data-item-type="${item.type || ''}"
                 data-is-equipped="true"
                 title="${item.name}"
                 onclick="handleEquipSlotClick('${slotKey}', '${slotLabel}')"
                 onmouseenter="showItemTooltip(event, '${item.id}')"
                 onmousemove="moveItemTooltip(event)"
                 onmouseleave="hideItemTooltip()">
                <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isTargeted ? 'bg-amber-400' : 'bg-emerald-400'} ring-2 ring-slate-950" title="${isTargeted ? 'Đang chọn ô' : 'Đang trang bị'}"></span>
                ${equipIconHtml}
                <span class="text-[10px] font-bold text-amber-300 whitespace-nowrap mt-0.5 tracking-wider truncate max-w-[54px]">${slotLabel}</span>
            </div>
        `;
    };

    // Filter counts for inventory
    const allAvailable = state.inventory.filter(i => (i.count > 0 || i.quantity > 0));
    const allCount = allAvailable.length;
    const equipCount = allAvailable.filter(i => i.slot || i.type === 'Pháp Bảo').length;
    const pillCount = allAvailable.filter(i => i.type === 'Đan Dược').length;
    const matCount = allAvailable.filter(i => i.type !== 'Đan Dược' && !i.slot && i.type !== 'Pháp Bảo').length;

    let filteredItems = allAvailable;
    let isSlotFilter = false;
    let targetSlotKey = '';

    if (filter.startsWith('slot_')) {
        isSlotFilter = true;
        targetSlotKey = filter.replace('slot_', '');
        if (targetSlotKey === 'artifact') {
            filteredItems = allAvailable.filter(i => i.slot === 'artifact' || i.slot === 'secondary_weapon' || i.slot === 'weapon' || i.type === 'Pháp Bảo' || i.type === 'secondary_weapon' || i.type === 'weapon' || i.type === 'Vũ Khí' || i.type === 'Vũ Khí Phụ');
        } else {
            filteredItems = allAvailable.filter(i => i.slot === targetSlotKey);
        }
    } else if (filter === 'equipment') {
        filteredItems = allAvailable.filter(i => i.slot || i.type === 'Pháp Bảo' || i.type === 'weapon' || i.type === 'secondary_weapon');
    } else if (filter === 'pill') {
        filteredItems = allAvailable.filter(i => i.type === 'Đan Dược');
    } else if (filter === 'material') {
        filteredItems = allAvailable.filter(i => i.type !== 'Đan Dược' && !i.slot && i.type !== 'Pháp Bảo' && i.type !== 'weapon' && i.type !== 'secondary_weapon');
    }

    // Grid rendering với cú pháp template chuẩn xác
    const renderedItemsHtml = filteredItems.map(item => {
        const rarityClass = `rpg-rarity-${Math.min(6, Math.max(1, item.rarity || 1))}`;
        const safeName = (item.name || '').replace(/'/g, "\\'");
        const safeType = (item.type || '').replace(/'/g, "\\'");
        const safeSlot = (item.slot || '').replace(/'/g, "\\'");
        const hasImage = item.image || (item.icon && (item.icon.includes('/') || item.icon.includes('.')));
        const iconHtml = hasImage 
            ? `<img src="${item.image || item.icon}" alt="${item.name}" class="w-8 h-8 sm:w-9 sm:h-9 object-contain pointer-events-none group-hover:scale-115 transition-transform drop-shadow" onerror="this.outerHTML=getXianxiaItemSVG('${safeType}', ${item.rarity || 1}, '${safeSlot}', '${safeName}')">`
            : getXianxiaItemSVG(item.type, item.rarity, item.slot, item.name);
        const countNum = item.count || item.quantity || 1;

        return `
            <div id="inv-item-${item.id}"
                 class="relative bg-slate-900/90 border-2 border-slate-700/60 rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400/80 transition-all group ${rarityClass} aspect-square overflow-hidden shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                 draggable="true"
                 data-item-id="${item.id}"
                 data-item-type="${item.type || ''}"
                 data-slot="${item.slot || ''}"
                 data-is-equipped="${Boolean(item.equipped)}"
                 title="${item.name}"
                 onmouseenter="showItemTooltip(event, '${item.id}')"
                 onmousemove="moveItemTooltip(event)"
                 onmouseleave="hideItemTooltip()"
                 role="button" tabindex="0" aria-pressed="false"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();inspectInventoryItem('${item.id}')}"
                 onclick="inspectInventoryItem('${item.id}')">
                <div class="absolute inset-0 rounded-xl bg-gradient-to-t from-black/80 via-transparent to-white/5 pointer-events-none"></div>
                ${iconHtml}
                <span class="hidden">${item.name}</span>
                ${item.equipped ? `<span class="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] border border-slate-950" title="Đang trang bị"></span>` : ''}
                <span class="absolute bottom-1 right-1.5 text-[10px] text-amber-300 font-mono font-bold leading-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)] select-none bg-slate-950/80 px-1 py-0.2 rounded border border-amber-500/20">x${countNum}</span>
            </div>
        `;
    }).join('');

    const totalSlots = Math.max(32, Math.ceil(filteredItems.length / 8) * 8);
    const emptyCount = totalSlots - filteredItems.length;
    const emptySlotsHtml = Array.from({ length: emptyCount }).map(() => `
        <div class="relative bg-slate-900/30 border border-slate-800/40 rounded-xl p-1 sm:p-1.5 flex items-center justify-center aspect-square pointer-events-none">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-700/30"></span>
        </div>
    `).join('');

    const renderInvFilterBtn = (tabKey, label, count) => `
        <button type="button" onclick="setInventoryFilter('${tabKey}')"
                class="px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap transition-all ${filter === tabKey ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/25 to-amber-500/30 text-amber-200 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]' : 'bg-slate-900/70 text-slate-400 hover:text-amber-200 border border-slate-800 hover:border-slate-700'}">
            ${label} <span class="text-[10px] opacity-85 font-mono text-amber-300">(${count})</span>
        </button>
    `;

    // Render BẢN NGUYÊN TU SĨ (Cột 1) - CHUẨN HÓA 100% THEO LỆNH TỐI CAO TỪ BẢN TÔN
    const renderCultivatorColumn = () => {
        const realmStageNames = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
        const stageText = (state.realmStage !== undefined && realmStageNames[state.realmStage]) ? ` • ${realmStageNames[state.realmStage]}` : '';
        const realmFullDisplay = `${currentRealm.name}${stageText}`;

        const hpCurrent = Math.min(state.hp, effectiveStats.maxHp);
        const hpMax = effectiveStats.maxHp;
        const hpPercent = Math.min(100, Math.max(0, Math.round((hpCurrent / hpMax) * 100)));

        const mpCurrent = Math.min(state.mp || 0, effectiveStats.maxMp);
        const mpMax = effectiveStats.maxMp;
        const mpPercent = Math.min(100, Math.max(0, Math.round((mpCurrent / mpMax) * 100)));

        const daoTamCurrent = Math.min(100, Math.max(0, Math.round(state.daoTam ?? 100)));
        const tamMaCurrent = 100 - daoTamCurrent;

        return `
        <!-- KHUNG BẢN NGUYÊN TU SĨ ĐÃ CHUẨN HÓA -->
        <aside id="char-col-cultivator" class="w-full max-w-[360px] lg:w-[360px] shrink-0 bg-[#0b0f19]/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-4 flex flex-col gap-3.5 text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.9)] select-none overflow-y-auto custom-inventory-scrollbar">

            <!-- 1. HEADER: 1 DÒNG GỌN GÀNG, KHÔNG RỚT CHỮ -->
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                <div class="flex items-center gap-2 whitespace-nowrap">
                    <span class="text-amber-400 text-base">📜</span>
                    <h2 class="font-bold text-sm tracking-wider text-amber-400 uppercase">BẢN NGUYÊN TU SĨ</h2>
                </div>
                <span class="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/60 text-amber-200 text-xs font-bold whitespace-nowrap shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    ${realmFullDisplay}
                </span>
            </div>

            <!-- 2. LỤC HỢP BẢN MỆNH TRẬN (6 Ô TRANG BỊ & NHÂN VẬT) -->
            <div class="relative grid grid-cols-3 items-center py-2">
                <!-- Cột Trái: Vũ Khí, Áo Giáp, Ngọc Bội -->
                <div class="flex flex-col items-start gap-3 z-10">
                    ${renderEquipSlot('weapon', 'Vũ Khí', '🗡️')}
                    ${renderEquipSlot('armor', 'Áo Giáp', '🛡️')}
                    ${renderEquipSlot('talisman', 'Ngọc Bội', '🧿')}
                </div>

                <!-- Giữa: Chân Thân Đả Tọa & Tên Nhân Vật -->
                <div class="flex flex-col items-center justify-center relative z-10 -mx-4">
                    <div class="w-36 h-36 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center relative">
                        <div class="absolute inset-2 rounded-full bg-cyan-500/10 blur-xl"></div>
                        <img id="char-modal-avatar-img"
                             src="${avatarUrl || './assets/images/image_11.png'}"
                             alt="${state.player?.name || 'LuLy'}"
                             class="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] relative z-10 transition-transform duration-300 hover:scale-105"
                             onerror="this.src='./assets/images/nu_tu_trong_suot.png';" />
                        <span class="absolute bottom-2 w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_12px_#fbbf24]"></span>
                    </div>
                    ${state.equippedTitle ? `<span class="mt-1 text-[10px] font-bold text-amber-200 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 shadow-sm truncate max-w-[120px]">[${state.equippedTitle}]</span>` : ''}
                    <span class="mt-1 font-bold text-sm text-amber-300 tracking-wider">${state.player?.name || 'LuLy'}</span>
                </div>

                <!-- Cột Phải: Vũ Khí Phụ, Giới Chỉ, Phi Hài -->
                <div class="flex flex-col items-end gap-3 z-10">
                    ${renderEquipSlot('artifact', 'Pháp Bảo', '☯️')}
                    ${renderEquipSlot('ring', 'Giới Chỉ', '💍')}
                    ${renderEquipSlot('boots', 'Phi Hài', '🥾')}
                </div>
            </div>

            <!-- 3. LỰC CHIẾN & NÚT TRANG BỊ NHANH SÁNG RÕ -->
            <div class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-400/60 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div class="flex items-center gap-2 whitespace-nowrap">
                    <span class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-xs">🛡️</span>
                    <span class="text-xs font-extrabold uppercase tracking-wider text-amber-400">LỰC CHIẾN</span>
                </div>
                <span id="rpg-char-combat-power" class="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-tight drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                    ${combatPower.toLocaleString('vi-VN')}
                </span>
            </div>

            <button id="btn-quick-equip" type="button" onclick="quickEquip()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/35 to-amber-500/20 hover:brightness-125 border border-amber-400/70 text-amber-200 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition active:scale-95 cursor-pointer" title="Tự động đồng bộ & trang bị vật phẩm tối ưu">
                <span>⚡</span> TRANG BỊ NHANH
            </button>

            <!-- 4. BA THANH TRẠNG THÁI (CHỈ DÙNG 1 ICON DUY NHẤT MỖI DÒNG) -->
            <div class="space-y-2.5 pt-1">
                <!-- Khí Huyết -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-rose-400 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                            <span>❤️</span> Khí Huyết
                        </span>
                        <span class="font-mono font-bold text-[11px] text-rose-300">${hpCurrent.toLocaleString('vi-VN')} / ${hpMax.toLocaleString('vi-VN')} (${hpPercent}%)</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-rose-600 to-pink-500 rounded-full shadow-[0_0_8px_#f43f5e]" style="width: ${hpPercent}%"></div>
                    </div>
                </div>

                <!-- Pháp Lực -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-cyan-400 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                            <span>💧</span> Pháp Lực
                        </span>
                        <span class="font-mono font-bold text-[11px] text-cyan-300">${mpCurrent.toLocaleString('vi-VN')} / ${mpMax.toLocaleString('vi-VN')} (${mpPercent}%)</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" style="width: ${mpPercent}%"></div>
                    </div>
                </div>

                <!-- Đạo Tâm / Tâm Ma -->
                <div>
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-emerald-400 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                            <span>☯️</span> Đạo Tâm / Tâm Ma
                        </span>
                        <span class="font-mono font-bold text-[11px] text-emerald-300">${daoTamCurrent} / ${tamMaCurrent}</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_#10b981]" style="width: ${daoTamCurrent}%"></div>
                    </div>
                </div>

                <!-- Nút Trảm Tâm Ma (Rõ chữ ngay cả khi Tâm Ma = 0) -->
                <button type="button"
                        id="btn-tram-tam-ma-modal"
                        onclick="challengeTamMa()"
                        ${tamMaCurrent < 50 ? 'disabled' : ''}
                        class="w-full py-2 rounded-xl ${tamMaCurrent >= 50
                            ? 'bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500/70 text-rose-200 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                            : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-slate-300 cursor-not-allowed'} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                        title="${tamMaCurrent >= 50 ? 'Khiêu chiến ảo ảnh Tâm Ma, thanh tẩy thần hồn!' : 'Tâm Ma chưa đủ lớn để hóa hình (Cần Tâm Ma ≥ 50)'}">
                    <span>🛡️</span> TRẢM TÂM MA ${tamMaCurrent >= 50 ? `(${tamMaCurrent})` : `(TÂM MA: ${tamMaCurrent})`}
                </button>
            </div>

            <!-- 5. THUỘC TÍNH CHIẾN ĐẠO (BỐ CỤC 2 TẦNG KHÔNG BAO GIỜ GÃY CHỮ, 1 ICON DUY NHẤT) -->
            <div class="pt-2 border-t border-amber-500/20">
                <div class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                    <span>✦</span> THUỘC TÍNH CHIẾN ĐẠO <span>✦</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <!-- Công Kích -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-amber-400">⚔️</span> Công Kích
                        </span>
                        <span class="font-mono text-sm font-bold text-amber-300 mt-1 whitespace-nowrap">${effectiveStats.atk.toLocaleString('vi-VN')}</span>
                    </div>

                    <!-- Phòng Ngự -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-cyan-400">🛡️</span> Phòng Ngự
                        </span>
                        <span class="font-mono text-sm font-bold text-cyan-300 mt-1 whitespace-nowrap">${effectiveStats.def.toLocaleString('vi-VN')}</span>
                    </div>

                    <!-- Bạo Kích -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-rose-400">💥</span> Bạo Kích
                        </span>
                        <span class="font-mono text-sm font-bold text-amber-200 mt-1 whitespace-nowrap">${effectiveStats.crit}%</span>
                    </div>

                    <!-- Né Tránh -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-emerald-400">💨</span> Né Tránh
                        </span>
                        <span class="font-mono text-sm font-bold text-emerald-300 mt-1 whitespace-nowrap">${state.spiritualRoot?.mutations?.wind ? '50%' : (state.dodge || 5) + '%'}</span>
                    </div>

                    <!-- Tốc Độ -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-yellow-400">⚡</span> Tốc Độ
                        </span>
                        <span class="font-mono text-sm font-bold text-yellow-300 mt-1 whitespace-nowrap">${effectiveStats.spd || (100 + (state.realmStage || 0) * 15)}</span>
                    </div>

                    <!-- Xuyên Giáp -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-purple-400">🎯</span> Xuyên Giáp
                        </span>
                        <span class="font-mono text-sm font-bold text-purple-300 mt-1 whitespace-nowrap">${effectiveStats.armorIgnore || 0}%</span>
                    </div>

                    <!-- Thọ Nguyên -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between">
                        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-amber-300">⏳</span> Thọ Nguyên
                        </span>
                        <span class="font-mono text-sm font-bold text-amber-200 mt-1 whitespace-nowrap">${Math.floor(state.ageYears)} / ${maxLifespan} năm</span>
                    </div>

                    <!-- Linh Thạch -->
                    <div class="p-2.5 rounded-xl bg-slate-900/85 border border-amber-500/40 flex flex-col justify-between">
                        <span class="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span class="text-cyan-300">💎</span> Linh Thạch
                        </span>
                        <span class="font-mono text-sm font-bold text-amber-300 mt-1 whitespace-nowrap">${(state.stones || 0).toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            </div>

        </aside>
        `;
    };
    // Nếu là tab Túi Đồ ('inventory'): Render BỐ CỤC 3 CỘT ĐẲNG CẤP CHUẨN MỘNG HUYỄN PHI TIÊN
    if (activeTab === 'inventory') {
        host.innerHTML = `
            <div class="rpg-split-container xianxia-3col-master flex flex-col lg:flex-row gap-4 p-1 select-none w-full h-full">
                <!-- CỘT 1 (Trái ~340px): BẢN NGUYÊN TU SĨ -->
                ${renderCultivatorColumn()}

                <!-- CỘT 2 (Giữa flex-1): CÀN KHÔN BẢO NANG -->
                <div id="char-col-inventory" style="background: linear-gradient(180deg, rgba(17, 28, 50, 0.98), rgba(10, 16, 32, 0.99)); border: 1.5px solid rgba(234, 179, 8, 0.5); box-shadow: 0 0 35px rgba(0,0,0,0.85), inset 0 0 25px rgba(234,179,8,0.05);" class="flex-1 min-w-0 flex flex-col rounded-3xl p-3.5 sm:p-4 relative overflow-hidden">
                    <!-- Hàng 1: Header Túi Đồ -->
                    <div class="page-header-title pb-2.5 mb-2.5 border-b border-amber-500/25 flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">☯️</span>
                            <h2 class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-xianxia font-black text-sm sm:text-base uppercase tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center gap-2">
                                CÀN KHÔN BẢO NANG
                            </h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-inner">
                                ${allCount} loại bảo vật
                            </span>
                        </div>
                    </div>

                    <!-- Vùng Nội Dung Túi Đồ -->
                    <div id="char-right-tab-content" class="flex-1 flex flex-col overflow-hidden min-h-0">
                        ${activeEquipTarget ? `
                            <div class="smart-slot-banner flex items-center justify-between p-2.5 sm:p-3 mb-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/30 to-amber-500/25 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse shrink-0">
                                <div class="flex items-center gap-2 text-xs text-amber-200 font-xianxia">
                                    <i class="fa-solid fa-bullseye text-amber-300 text-sm animate-spin-slow"></i>
                                    <span>Đang chọn ô <b class="text-yellow-300 font-black">${activeEquipTarget.slotLabel}</b> — Chọn vật phẩm bên dưới để trang bị!</span>
                                </div>
                                <button type="button" onclick="cancelEquipTargeting()" class="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-200 text-xs border border-amber-400/60 hover:border-amber-300 transition-all flex items-center gap-1.5 shadow-md shrink-0 active:scale-95 font-serif">
                                    <i class="fa-solid fa-xmark text-amber-400"></i> Hủy
                                </button>
                            </div>
                        ` : ''}

                        <!-- Hàng 2: Thanh Phân Loại Tab Trải Rộng 100% Không Cắt Chữ -->
                        <div class="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-amber-500/20 overflow-x-auto select-none shrink-0 custom-inventory-scrollbar">
                            <div class="flex items-center gap-2 shrink-0">
                                ${renderInvFilterBtn('all', 'Tất cả', allCount)}
                                ${renderInvFilterBtn('equipment', 'Trang Bị', equipCount)}
                                ${renderInvFilterBtn('pill', 'Đan Dược', pillCount)}
                                ${renderInvFilterBtn('material', 'Nguyên Liệu', matCount)}
                                ${isSlotFilter ? `
                                    <button type="button" class="px-3 py-1.5 rounded-xl text-xs font-serif font-bold whitespace-nowrap bg-amber-500/20 text-amber-200 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] flex items-center gap-1.5">
                                        <i class="fa-solid fa-filter text-amber-400"></i> ${activeEquipTarget?.slotLabel || targetSlotKey} <span class="text-[10px] font-mono text-amber-300">(${filteredItems.length})</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Hàng 3: Thanh Tìm Kiếm, Lọc & Nút Phân Giải Nguyên Liệu Sang Trọng -->
                        <div class="inventory-toolbar flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-900/80 border border-amber-500/25 mb-2.5 shrink-0">
                            <div class="relative flex-1 min-w-[150px]">
                                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                                <input id="inventory-search" type="search" placeholder="🔍 Tìm tên vật phẩm..." oninput="refineInventoryView()" aria-label="Tìm vật phẩm trong túi đồ" class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-amber-400 text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition-all shadow-inner">
                            </div>
                            <select id="inventory-order" onchange="refineInventoryView()" aria-label="Sắp xếp túi đồ" class="py-1.5 px-3 rounded-xl bg-slate-950/90 border border-slate-700/80 text-xs text-amber-200 focus:border-amber-400 focus:outline-none cursor-pointer">
                                <option value="default">Thứ tự hiện tại</option>
                                <option value="rarity">Phẩm chất cao trước</option>
                                <option value="name">Tên vật phẩm A-Z</option>
                            </select>
                            <button type="button" onclick="cleanOrRecycleMaterials()" class="btn-cta-danger py-1.5 px-3 rounded-xl text-xs font-xianxia font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap" title="Phân giải nguyên liệu dư thừa thành Linh Thạch">
                                <i class="fa-solid fa-recycle"></i>
                                <span>♻️ Phân Giải Nguyên Liệu</span>
                            </button>
                            <span id="inventory-search-result" role="status" class="text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg ml-auto hidden sm:inline-block">${filteredItems.length} loại</span>
                        </div>

                        <!-- Hàng 4: Lưới Vật Phẩm (7-8 cột) Chiếm Trọn Chiều Cao Còn Lại -->
                        <div id="rpg-inventory-grid" data-drop-zone="inventory" class="inventory-grid grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1.5 sm:gap-2 p-1 flex-1 overflow-y-auto custom-inventory-scrollbar max-h-[500px]">
                            ${renderedItemsHtml}
                            ${emptySlotsHtml}
                        </div>
                    </div>
                </div>

                <!-- CỘT 3 (Phải ~310px): ĐÀI GIÁM ĐỊNH PHÁP BẢO -->
                <aside id="inventory-inspector" style="background: linear-gradient(180deg, rgba(17, 28, 50, 0.98), rgba(10, 16, 32, 0.99)); border: 1.5px solid rgba(234, 179, 8, 0.5); box-shadow: 0 0 35px rgba(0,0,0,0.85), inset 0 0 25px rgba(234,179,8,0.05);" class="w-full lg:w-[310px] shrink-0 flex flex-col rounded-3xl p-3.5 sm:p-4 overflow-y-auto custom-inventory-scrollbar" aria-label="Đài giám định pháp bảo">
                </aside>
            </div>
        `;

        // Render Inspector (Cột 3)
        const inspectorPanel = document.getElementById('inventory-inspector');
        if (inspectorPanel) {
            if (inspectedInventoryItemId && state.inventory.some(i => i.id === inspectedInventoryItemId && (i.count > 0 || i.quantity > 0))) {
                inspectInventoryItem(inspectedInventoryItemId);
            } else {
                renderEmptyInspector(inspectorPanel);
            }
        }
    } else {
        // Nếu là tab Công Pháp: Dành trọn 100% diện tích cho Tàng Kinh Các (Loại bỏ cột Bản Nguyên Tu Sĩ theo Mệnh Lệnh Số 1)
        if (activeTab === 'skills' || activeTab === 'cong-phap') {
            if (typeof renderSkillsHub === 'function') {
                renderSkillsHub(host);
                return;
            }
        }

        // Non-inventory character sub-tabs (root, artifact, pet...)
        const characterSectionHeaders = {
            skills: '📜 CÔNG PHÁP TÀNG KINH CÁC',
            root: '🌿 CĂN CƠ LINH CĂN',
            artifact: '⚔️ PHÁP BẢO BẢN MỆNH',
            talisman: '🧧 HỌA PHÙ CÁC',
            pet: '🦊 LINH THÚ HỘ TỘC',
            companion: '💞 ĐẠO LỮ ĐỒNG TU',
            avatar: '🧘 PHÂN THẦN HÓA THÂN'
        };
        const rightHeaderTitle = characterSectionHeaders[activeTab] || '📜 TU TIÊN CƠ DUYÊN';

        host.innerHTML = `
            <div class="rpg-split-container flex flex-col lg:flex-row gap-5 p-1 select-none w-full">
                ${renderCultivatorColumn()}

                <div class="w-full lg:w-[62%] flex-1 flex flex-col min-w-0 rounded-3xl p-3.5 sm:p-4 lg:p-5 relative overflow-hidden min-h-[500px] border-2 border-amber-500/40 bg-gradient-to-b from-slate-950/95 via-indigo-950/70 to-slate-950/95 shadow-[0_0_35px_rgba(0,0,0,0.85),inset_0_0_30px_rgba(245,158,11,0.06)]">
                    <div class="page-header-title pb-2.5 mb-3 border-b border-amber-500/25 flex items-center justify-between">
                        <h2 class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-xianxia font-black text-sm sm:text-base uppercase tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center gap-2">
                            <i class="fa-solid fa-scroll text-amber-400"></i> ${rightHeaderTitle}
                        </h2>
                    </div>
                    <div id="char-right-tab-content" class="flex-1 overflow-y-auto max-h-[560px] custom-inventory-scrollbar pr-1">
                        <div id="char-subtab-container" class="w-full"></div>
                    </div>
                </div>
            </div>
        `;

        const subContainer = document.getElementById('char-subtab-container');
        if (subContainer) {
            if (activeTab === 'skills') renderSkillsHub(subContainer);
            else if (activeTab === 'root') renderFoundationHub('linh_can', subContainer);
            else if (activeTab === 'artifact') renderArtifactHub(subContainer);
            else if (activeTab === 'talisman') renderTalismanHub(subContainer);
            else if (activeTab === 'pet') renderPetHub(subContainer);
            else if (activeTab === 'companion') renderCompanionHub(subContainer);
            else if (activeTab === 'avatar') renderAvatarHub(subContainer);
            else if (activeTab === 'achievement') renderAchievementHub(subContainer);
        }
    }

    if (typeof initMouseInteractions === 'function') {
        setTimeout(initMouseInteractions, 20);
    }
}
window.renderCharacterHub = renderCharacterHub;

function renderCharacterTab(content) {
    const target = content || document.getElementById('hub-modal-content');
    if (!target) return;
    target.innerHTML = `
<div class="space-y-6" id="integration-character-section">
    <!-- KHU VỰC: CÔNG PHÁP ĐANG NGỰ DỤNG (HÀNG ĐẦU) -->
    <div>
        <div class="flex justify-between items-center mb-3">
            <h3 class="font-serif text-amber-300 font-bold text-sm tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-scroll-torah"></i> Ô CÔNG PHÁP ĐANG NGỰ DỤNG
            </h3>
            <span class="text-[10px] text-stone-400">Chạm để tháo hoặc đổi pháp môn</span>
        </div>
        
        <div class="grid grid-cols-3 gap-3">
            <!-- 1. Thổ Nạp Pháp (Phàm phẩm) -->
            <button class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center transition hover:border-stone-500 border-phamphem group" onclick="showSkillDetail('Thổ Nạp Pháp')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-stone-800">
                    <!-- Linh ảnh 2D từ đại ngọc giản -->
                    <img src="./assets/images/item_bamboo_scroll.jpg" alt="Thổ Nạp Pháp" class="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                    <span class="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[8px] bg-stone-900 text-stone-400 border border-stone-700">Phàm</span>
                </div>
                <span class="text-xs font-bold text-stone-300">Thổ Nạp Pháp</span>
                <span class="text-[9px] text-amber-500/80 mt-0.5">Tầng 5 • Viên Mãn</span>
            </button>

            <!-- 2. Trường Xuân Công (Linh phẩm) -->
            <button class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center transition hover:border-lime-500 border-linhphem group item-glow-animate" onclick="showSkillDetail('Trường Xuân Công')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-lime-900/40">
                    <img src="./assets/images/item_bamboo_scroll.jpg" alt="Trường Xuân Công" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-lime-950/20 to-transparent"></div>
                    <!-- Linh khí xanh trúc vây quanh -->
                    <div class="absolute inset-0 border-2 border-lime-500/10 rounded-lg animate-pulse"></div>
                    <span class="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[8px] bg-lime-950 text-lime-300 border border-lime-700/50">Linh</span>
                </div>
                <span class="text-xs font-bold text-lime-300">Trường Xuân Công</span>
                <span class="text-[9px] text-stone-400 mt-0.5">Tầng 1 • Sơ Nhập</span>
            </button>

            <!-- 3. Tử Hà Tâm Pháp (Huyền phẩm) -->
            <button class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center transition hover:border-purple-500 border-huyenphem group" onclick="showSkillDetail('Tử Hà Tâm Pháp')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-purple-900/40">
                    <img src="./assets/images/item_bamboo_scroll.jpg" alt="Tử Hà Tâm Pháp" class="w-full h-full object-cover filter hue-rotate-270 saturate-125 brightness-90 group-hover:brightness-110 transition-all">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-purple-950/30 to-transparent"></div>
                    <span class="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[8px] bg-purple-950 text-purple-300 border border-purple-800/50">Huyền</span>
                </div>
                <span class="text-xs font-bold text-purple-300">Tử Hà Tâm Pháp</span>
                <span class="text-[9px] text-purple-400 mt-0.5">Tầng 1 • Sơ Nhập</span>
            </button>
        </div>
    </div>

    <!-- KHU VỰC: TRANG BỊ KHÍ CỤ (HÀNG DƯỚI) -->
    <div>
        <div class="flex justify-between items-center mb-3">
            <h3 class="font-serif text-amber-300 font-bold text-sm tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-shield-halved"></i> TRANG BỊ LINH KHÍ HẠ GIỚI
            </h3>
            <span class="text-[10px] text-stone-400">Chạm để xem chi tiết & Cường hóa</span>
        </div>

        <div class="grid grid-cols-3 gap-3">
            <!-- 1. Thanh Trúc Phi Kiếm (Linh phẩm) -->
            <div class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center border-linhphem group transition-all hover:scale-[1.02] cursor-pointer" onclick="showEquipmentDetail('Thanh Trúc Phi Kiếm')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-lime-800/40">
                    <img src="./assets/images/item_bamboo_sword.jpg" alt="Thanh Trúc Phi Kiếm" class="w-full h-full object-cover">
                    <!-- Kiếm khí mờ bọc viền -->
                    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-lime-950/20 to-transparent"></div>
                    <span class="absolute top-1 right-1 px-1 py-0.5 text-[8px] font-mono bg-stone-900/90 text-lime-400 border border-lime-800/40">+12</span>
                </div>
                <span class="text-xs font-bold text-lime-300">Thanh Trúc Phi Kiếm</span>
                <span class="text-[9px] text-stone-400">Sức mạnh • Công +62</span>
            </div>

            <!-- 2. Lọ Tụ Khí Đan (Linh phẩm) -->
            <div class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center border-linhphem transition-all hover:scale-[1.02] cursor-pointer" onclick="showEquipmentDetail('Tụ Khí Đan')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-stone-800">
                    <img src="./assets/images/item_qi_pill_bottle.jpg" alt="Lọ Tụ Khí Đan" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-black/40 to-transparent"></div>
                    <span class="absolute top-1 right-1 px-1 py-0.5 text-[8px] font-mono bg-stone-900/90 text-cyan-300 border border-cyan-800/50">Đan</span>
                </div>
                <span class="text-xs font-bold text-cyan-200">Lọ Tụ Khí Đan</span>
                <span class="text-[9px] text-stone-400">Đan dược • +60 Tu Vi</span>
            </div>

            <!-- 3. Bát Quái Hộ Thân Kính (Linh phẩm) -->
            <div class="card-dark-gradient p-2.5 rounded-xl flex flex-col items-center text-center border-phamphem transition-all hover:scale-[1.02] cursor-pointer" onclick="showEquipmentDetail('Pháp Đạo Bào')">
                <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-950 mb-2 border border-stone-800">
                    <img src="./assets/images/mirror_bagua.jpg" alt="Pháp Đạo Bào" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-black/40 to-transparent"></div>
                </div>
                <span class="text-xs font-bold text-stone-300">Pháp Đạo Bào</span>
                <span class="text-[9px] text-stone-400">Phòng ngự • Thủ +24</span>
            </div>
        </div>
    </div>
</div>
`;
}

function renderPetHub(content) {
    if (!content) return;
    if (!state.activePet) state.activePet = 'fox';
    if (!state.petLevel) state.petLevel = 1;
    if (!state.petExp) state.petExp = 0;
    if (!state.petTier) state.petTier = 1;

    const pets = typeof DIVINE_PETS_DATA !== 'undefined' ? DIVINE_PETS_DATA : [];
    const activePet = pets.find(p => p.id === state.activePet) || pets[0] || {
        id: 'fox', name: 'Cửu Vĩ Thiên Hồ', title: 'Thần Thú Hộ Tộc', element: 'Hỏa',
        baseCp: 12500, baseHp: 5000, baseAtk: 1200, baseDef: 800,
        skillName: 'Hồ Hồn Hộ Thể', skillDesc: 'Màn chắn hấp thu 40% sát thương khi HP < 30%.',
        colorTheme: 'from-pink-950/50 via-purple-950/40 to-slate-900', borderColor: 'border-pink-500/40', textColor: 'text-pink-300'
    };

    const petLvl = Number(state.petLevel) || 1;
    const petExp = Number(state.petExp) || 0;
    const petMaxExp = petLvl * 600;
    const expPercent = Math.min(100, Math.round((petExp / petMaxExp) * 100));

    const petTier = Math.max(1, Number(state.petTier) || 1);
    const bloodlineTiers = typeof PET_BLOODLINE_TIERS !== 'undefined' ? PET_BLOODLINE_TIERS : [];
    const currentBloodline = bloodlineTiers[petTier - 1] || bloodlineTiers[0] || {
        tier: 1, name: 'Ấu Niên Thể', badge: 'Ấu Niên', colorClass: 'text-slate-300 border-slate-600 bg-slate-900/60',
        atkMult: 1.0, defMult: 1.0, hpMult: 1.0, idleBonus: 0, desc: 'Linh thú sơ khai'
    };
    const nextBloodline = (petTier < bloodlineTiers.length) ? bloodlineTiers[petTier] : null;

    const bonusCp = Math.round(((activePet.baseCp || 12000) + (petLvl - 1) * 2500) * currentBloodline.atkMult);
    const bonusAtk = Math.round(((petLvl - 1) * 25) * currentBloodline.atkMult);
    const bonusDef = Math.round(((petLvl - 1) * 15) * currentBloodline.defMult);
    const bonusHp = Math.round(((petLvl - 1) * 150) * currentBloodline.hpMult);

    const playerStones = state.stones || 0;
    const playerJade = Number(state.immortalJade || state.jade || 0);

    content.innerHTML = `
        <div class="space-y-4">
            <!-- HEADER TỨ ĐẠI THẦN THÚ CHỦ LỰC -->
            <div class="p-4 rounded-2xl bg-gradient-to-r ${activePet.colorTheme} border ${activePet.borderColor} shadow-lg relative overflow-hidden">
                <div class="flex flex-col sm:flex-row items-center gap-5 relative z-10">
                    <div class="relative w-28 h-28 rounded-2xl overflow-hidden border-2 ${activePet.borderColor} shadow-[0_0_25px_rgba(255,255,255,0.15)] flex-shrink-0 bg-slate-950 flex items-center justify-center">
                        <i class="fa-solid ${activePet.icon || 'fa-paw'} text-5xl ${activePet.textColor}"></i>
                        <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold ${activePet.textColor} font-mono">Cấp ${petLvl}</span>
                        <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400 font-mono">Hệ ${activePet.element}</span>
                    </div>

                    <div class="flex-1 space-y-1.5 text-center sm:text-left">
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h3 class="text-lg font-bold text-slate-100 font-serif">${activePet.name}</h3>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 ${activePet.textColor} border ${activePet.borderColor}">${activePet.title}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${currentBloodline.colorClass}">${currentBloodline.name}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono">Lực Chiến: +${bonusCp.toLocaleString('vi-VN')}</span>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">${activePet.skillDesc}</p>
                        
                        <div class="text-[11px] grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-slate-300 font-mono">
                            <div>Công Kích: <b class="text-amber-400">+${bonusAtk.toLocaleString('vi-VN')}</b></div>
                            <div>Phòng Ngự: <b class="text-sky-400">+${bonusDef.toLocaleString('vi-VN')}</b></div>
                            <div>Khí Huyết: <b class="text-rose-400">+${bonusHp.toLocaleString('vi-VN')}</b></div>
                        </div>

                        <div class="space-y-1 pt-1">
                            <div class="flex justify-between text-[11px] font-mono ${activePet.textColor}">
                                <span>Linh Khí Nuôi Dưỡng (EXP)</span>
                                <span>${petExp} / ${petMaxExp} (${expPercent}%)</span>
                            </div>
                            <div class="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                <div class="h-full bg-gradient-to-r from-amber-500 to-pink-500 transition-all duration-300 rounded-full" style="width: ${expPercent}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Nút thao tác nuôi dưỡng -->
                <div class="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2.5 justify-end">
                    <button type="button" onclick="feedGuardianPetPill('stones')" class="px-3.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-cookie-bite"></i> Thức Ăn Thường (500 LT • +250 EXP)
                    </button>
                    <button type="button" onclick="feedGuardianPetPill('pill')" class="px-3.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-pills"></i> Vạn Thú Hóa Linh Đan (+1,500 EXP)
                    </button>
                    <button type="button" onclick="feedGuardianPetPill('jade')" class="px-3.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-diamond"></i> Tiên Thiên Huyết Tinh (20 TN • +10,000 EXP)
                    </button>
                </div>
            </div>

            <!-- BẢNG TIẾN HÓA & THỨC TỈNH HUYẾT MẠCH BẬC CAO -->
            <div class="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-lg space-y-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                    <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-xs">
                            <i class="fa-solid fa-dna"></i>
                        </span>
                        <div>
                            <h4 class="text-xs font-bold text-slate-100 uppercase tracking-wider">Huyết Mạch Thần Thú • Thức Tỉnh & Tiến Hóa</h4>
                            <span class="text-[10px] text-stone-400">Gia trì vĩnh viễn thuộc tính, thần thông trợ chiến và tốc độ ngưng tụ tu vi</span>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${currentBloodline.colorClass}">
                        ${currentBloodline.badge} (${currentBloodline.name})
                    </span>
                </div>

                <!-- 4 Cảnh Giới Huyết Mạch (Steps) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    ${bloodlineTiers.map((t, idx) => {
                        const isUnlocked = petTier >= t.tier;
                        const isCurrent = petTier === t.tier;
                        return `
                            <div class="p-2.5 rounded-xl border ${isCurrent ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40' : (isUnlocked ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-slate-950/60 border-stone-800 opacity-60')} flex flex-col justify-between space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono font-bold ${isUnlocked ? 'text-amber-400' : 'text-stone-500'}">Giai Đoạn ${t.tier}</span>
                                    <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${isCurrent ? 'bg-amber-500 text-black' : (isUnlocked ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-stone-500')}">
                                        ${isCurrent ? 'HIỆN TẠI' : (isUnlocked ? 'ĐÃ ĐẠT' : `CẤP ${t.reqLevel}`)}
                                    </span>
                                </div>
                                <h5 class="text-xs font-bold ${isUnlocked ? 'text-slate-100' : 'text-stone-400'}">${t.name}</h5>
                                <p class="text-[10px] text-stone-400 line-clamp-2">${t.desc}</p>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Tiến Hóa Thao Tác -->
                <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/80">
                    <div class="text-xs text-stone-300 space-y-0.5 text-center sm:text-left">
                        ${nextBloodline ? `
                            <div class="font-bold text-amber-300">Tiến Hóa Tiếp Theo: [${nextBloodline.name}]</div>
                            <div class="text-[11px] text-stone-400 flex flex-wrap gap-2.5 items-center justify-center sm:justify-start">
                                <span>Cấp yêu cầu: <b class="${petLvl >= nextBloodline.reqLevel ? 'text-emerald-400' : 'text-rose-400'}">Cấp ${petLvl}/${nextBloodline.reqLevel}</b></span>
                                <span>Linh Thạch: <b class="${playerStones >= nextBloodline.costStones ? 'text-emerald-400' : 'text-rose-400'}">${nextBloodline.costStones.toLocaleString('vi-VN')} LT</b></span>
                                <span>Tiên Ngọc: <b class="${playerJade >= nextBloodline.costJade ? 'text-emerald-400' : 'text-rose-400'}">${nextBloodline.costJade} TN</b></span>
                            </div>
                        ` : `
                            <div class="font-bold text-amber-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-crown text-amber-400"></i> Huyết Mạch Đã Đạt Cực Cảnh Thái Cổ Thánh Thú!
                            </div>
                            <div class="text-[11px] text-stone-400">Thần Thú đã lột xác thành hình dáng tối thượng của Hồng Hoang Viễn Cổ.</div>
                        `}
                    </div>

                    ${nextBloodline ? `
                        <button type="button" onclick="evolveGuardianPet()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                            <i class="fa-solid fa-bolt"></i> Thức Tỉnh Huyết Mạch
                        </button>
                    ` : `
                        <span class="px-3.5 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                            👑 ĐẠI THÀNH CỰC CẢNH
                        </span>
                    `}
                </div>
            </div>

            <!-- DANH SÁCH TỨ ĐẠI THẦN THÚ HỘ TỘC ĐỂ ĐỔI -->
            <div>
                <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <i class="fa-solid fa-shield-cat text-pink-400"></i> Danh Sách Tứ Đại Thần Thú Hộ Tộc
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    ${pets.map(pet => {
                        const isActive = pet.id === state.activePet;
                        return `
                            <div class="pet-showcase-card ${isActive ? 'is-active ring-1 ring-pink-500' : ''} flex flex-col justify-between" onclick="selectDivinePet('${pet.id}')">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-lg ${pet.textColor}">
                                            <i class="fa-solid ${pet.icon || 'fa-paw'}"></i>
                                        </div>
                                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-400'}">
                                            ${isActive ? 'ĐANG XUẤT CHIẾN' : 'NGHỈ NGƠI'}
                                        </span>
                                    </div>
                                    <h5 class="text-sm font-bold text-slate-100">${pet.name}</h5>
                                    <span class="text-[10px] ${pet.textColor} block mb-1">Hệ: ${pet.element} • ${pet.title}</span>
                                    <p class="text-[11px] text-slate-400 line-clamp-2">${pet.skillDesc}</p>
                                </div>
                                <button type="button" class="mt-3 w-full py-1.5 rounded-lg ${isActive ? 'bg-pink-900/60 text-pink-200 border border-pink-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} text-xs font-semibold transition cursor-pointer">
                                    ${isActive ? 'Đang Hộ Mệnh' : 'Triệu Hồi Hộ Mệnh'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function refreshPetUI() {
    const pageContent = document.getElementById('pet-page-content');
    if (pageContent) {
        renderPetHub(pageContent);
    }
    const hubContent = document.getElementById('hub-modal-content');
    if (hubContent && document.getElementById('hub-modal')?.classList.contains('active')) {
        renderPetHub(hubContent);
    }
}

function evolveGuardianPet() {
    if (!state.petTier) state.petTier = 1;
    if (!state.petLevel) state.petLevel = 1;
    const bloodlineTiers = typeof PET_BLOODLINE_TIERS !== 'undefined' ? PET_BLOODLINE_TIERS : [];
    if (state.petTier >= bloodlineTiers.length) {
        if (typeof addLog === 'function') addLog('🐾 Thần Thú Hộ Tộc đã thức tỉnh Huyết Mạch Cực Cảnh Thái Cổ!', 'text-amber-300');
        return;
    }
    const nextTier = bloodlineTiers[state.petTier];
    if (state.petLevel < nextTier.reqLevel) {
        if (typeof addLog === 'function') addLog(`⚠️ Thần Thú chưa đạt cấp độ yêu cầu để tiến hóa (Cần Cấp ${nextTier.reqLevel}).`, 'text-rose-400');
        return;
    }
    if ((state.stones || 0) < nextTier.costStones) {
        if (typeof addLog === 'function') addLog(`⚠️ Không đủ Linh Thạch để thức tỉnh huyết mạch (Cần ${nextTier.costStones.toLocaleString('vi-VN')} LT).`, 'text-rose-400');
        return;
    }
    const jadeCount = Number(state.immortalJade || state.jade || 0);
    if (jadeCount < nextTier.costJade) {
        if (typeof addLog === 'function') addLog(`⚠️ Không đủ Tiên Ngọc để thức tỉnh huyết mạch (Cần ${nextTier.costJade} Tiên Ngọc).`, 'text-rose-400');
        return;
    }

    state.stones -= nextTier.costStones;
    if (state.immortalJade !== undefined) state.immortalJade -= nextTier.costJade;
    else if (state.jade !== undefined) state.jade -= nextTier.costJade;
    state.petTier += 1;

    const prevCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    const newCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const cpGain = Math.max(2500, newCp - prevCp);

    if (window.soundSystem?.play) window.soundSystem.play('victory');
    else if (typeof playSound === 'function') playSound('bell');

    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Huyết Mạch Thức Tỉnh: ${nextTier.name}! (+${cpGain.toLocaleString('vi-VN')} CP)`, 'text-gold-300 font-bold');
    }
    if (typeof addLog === 'function') {
        addLog(`🌟 HUYẾT MẠCH BÙNG NỔ! Thần Thú đã lột xác thành công, thức tỉnh [${nextTier.name}]! Lực Chiến tăng vọt +${cpGain.toLocaleString('vi-VN')} CP!`, 'text-gold-300 font-bold');
    }
    updateHUD();
    saveGameState();
    refreshPetUI();
}
window.evolveGuardianPet = evolveGuardianPet;

function selectDivinePet(petId) {
    state.activePet = petId;
    const pet = (typeof DIVINE_PETS_DATA !== 'undefined' ? DIVINE_PETS_DATA : []).find(p => p.id === petId);
    if (typeof playSound === 'function') playSound('whoosh');
    if (typeof addLog === 'function') {
        addLog(`🐾 Đã triệu hồi Thần Thú [${pet ? pet.name : petId}] xuất chiến hộ mệnh!`, 'text-pink-300');
    }
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    updateHUD();
    saveGameState();
    refreshPetUI();
}
window.selectDivinePet = selectDivinePet;

function feedGuardianPetPill(pillType) {
    if (!state.petLevel) state.petLevel = 1;
    if (!state.petExp) state.petExp = 0;

    let expGain = 0;
    if (pillType === 'stones') {
        if (state.stones < 500) {
            addLog('Không đủ Linh Thạch để nuôi dưỡng Linh Thú (Cần 500 LT).', 'text-rose-400');
            return;
        }
        state.stones -= 500;
        expGain = 250;
    } else if (pillType === 'pill') {
        const pillItem = state.inventory ? state.inventory.find(i => i.id === 'arena_pet_pill' && i.count > 0) : null;
        if (pillItem) {
            pillItem.count -= 1;
            if (pillItem.count <= 0) {
                state.inventory = state.inventory.filter(i => i.id !== 'arena_pet_pill');
            }
            expGain = 1500;
        } else {
            if (state.stones < 2500) {
                addLog('Không đủ Linh Thạch để mua Vạn Thú Hóa Linh Đan (Cần 2,500 LT).', 'text-rose-400');
                return;
            }
            state.stones -= 2500;
            expGain = 1500;
        }
    } else if (pillType === 'jade') {
        const jadeCount = Number(state.jade || state.immortalJade || 0);
        if (jadeCount < 20) {
            addLog('Không đủ Tiên Ngọc (Cần 20 Tiên Ngọc).', 'text-rose-400');
            return;
        }
        if (state.jade !== undefined) state.jade -= 20;
        else if (state.immortalJade !== undefined) state.immortalJade -= 20;
        expGain = 10000;
    }

    state.petExp += expGain;
    let leveledUp = false;
    let maxExp = Math.max(100, (state.petLevel || 1) * 600);
    let petLoopGuard = 0;
    while (maxExp > 0 && state.petExp >= maxExp && petLoopGuard++ < 100) {
        state.petExp -= maxExp;
        state.petLevel += 1;
        leveledUp = true;
        maxExp = Math.max(100, state.petLevel * 600);
    }

    const prevCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    const newCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const cpGain = Math.max(0, newCp - prevCp);

    if (leveledUp) {
        if (window.soundSystem?.play) window.soundSystem.play('levelup');
        else if (typeof playSound === 'function') playSound('bell');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Linh Thú Đột Phá Cấp ${state.petLevel}! (+${cpGain.toLocaleString('vi-VN')} CP)`, 'text-gold-300 font-bold');
        addLog(`✨ Thần Thú Hộ Tộc đã đột phá lên Cấp ${state.petLevel}! Thuộc tính và Lực Chiến gia tăng +${cpGain.toLocaleString('vi-VN')} CP!`, 'text-gold-300 font-bold');
    } else {
        if (typeof playSound === 'function') playSound('ding');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `+${expGain} EXP Linh Thú`, 'text-pink-300');
        addLog(`🐾 Cho Thần Thú nuốt linh dược, tích lũy +${expGain} EXP!`, 'text-pink-300');
    }

    updateHUD();
    saveGameState();
    refreshPetUI();
}
window.feedGuardianPetPill = feedGuardianPetPill;
window.feedGuardianPet = () => feedGuardianPetPill('stones');

const ARTIFACT_UNLOCK_TIER = 8; // Đại Thừa Kỳ (Tier 8)

const DESTINY_ARTIFACTS_DATA = [
    {
        id: "sword",
        name: "Thanh Trúc Phi Kiếm",
        type: "Bản Mệnh • Tiên Phẩm",
        image: "./assets/images/sword_bamboo.jpg",
        icon: "fa-solid fa-khanda",
        statLabel: "Sát Thương Kiếm Khí:",
        statPerLevel: 450000,
        statUnit: "ATK",
        speedBonus: "+25%",
        technique: "Vạn Kiếm Quy Tông",
        cost: 5000,
        btnText: "Ôn Dưỡng Kiếm Khí (5,000 LT)",
        btnIcon: "fa-hammer",
        theme: "teal"
    },
    {
        id: "mirror",
        name: "Bát Quái Hộ Thân Kính",
        type: "Hộ Thể • Tiên Phẩm",
        image: "./assets/images/mirror_bagua.jpg",
        icon: "fa-solid fa-shield-halved",
        statLabel: "Hộ Thuẫn Cương Khí:",
        statPerLevel: 380000,
        statUnit: "DEF",
        speedBonus: "+18%",
        technique: "Huyền Quang Hộ Thể",
        cost: 5000,
        btnText: "Ôn Dưỡng Hộ Kính (5,000 LT)",
        btnIcon: "fa-wand-magic-sparkles",
        theme: "amber"
    },
    {
        id: "bead",
        name: "Định Hải Thần Châu",
        type: "Trấn Hồn • Thần Phẩm",
        image: null,
        icon: "fa-solid fa-certificate",
        statLabel: "Khí Huyết Gia Trì:",
        statPerLevel: 2000000,
        statUnit: "HP",
        speedBonus: "+35%",
        technique: "Trấn Hải Phong Ma",
        cost: 10000,
        btnText: "Tụ Khí Thần Châu (10,000 LT)",
        btnIcon: "fa-gem",
        theme: "purple"
    }
];

function isArtifactUnlocked(s) {
    if (!s) return false;
    const currentTier = s.realmTier || (typeof resolveRealmTier === 'function' ? resolveRealmTier(s) : 1);
    if (currentTier >= ARTIFACT_UNLOCK_TIER) return true;

    const realmName = (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[s.realmIndex]?.name) || '';
    if (realmName.includes('Đại Thừa') || realmName.includes('Độ Kiếp')) return true;

    return false;
}
window.isArtifactUnlocked = isArtifactUnlocked;

function renderArtifactHub(content) {
    if (!content) return;
    const unlocked = isArtifactUnlocked(state);
    const artLevel = Math.max(1, (state.realmIndex || 0) + 1);

    if (!unlocked) {
        // GIAO DIỆN KHÓA TÍNH NĂNG (LOCKED STATE THEO CỐT TRUYỆN ĐẠI THỪA KỲ)
        const currentTier = state.realmTier || (typeof resolveRealmTier === 'function' ? resolveRealmTier(state) : 1);
        const currentRealmName = (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[state.realmIndex]?.name) || 'Luyện Khí';
        const progressPct = Math.min(100, Math.round((currentTier / ARTIFACT_UNLOCK_TIER) * 100));

        content.innerHTML = `
            <div class="artifact-locked-container">
                <div class="locked-aura-circle">
                    <div class="locked-icon-shield">
                        <i class="fa-solid fa-lock text-rose-500"></i>
                    </div>
                </div>

                <div class="locked-text-block">
                    <span class="locked-kicker font-mono">[CẤM THUẬT BẢN MỆNH]</span>
                    <h3 class="locked-title font-serif">TÍNH NĂNG CHƯA MỞ</h3>
                    <p class="locked-description">
                        Đan điền của ngươi hiện tại quá yếu ớt. Cần đạt tới cảnh giới <strong class="text-amber-400 font-bold">[Đại Thừa Kỳ]</strong> để có thể thu nạp và ôn dưỡng Pháp Bảo Bản Mệnh.
                    </p>
                </div>

                <div class="locked-progress-card">
                    <div class="flex justify-between items-center text-xs font-mono mb-2">
                        <span class="text-slate-400">Căn cơ hiện tại: <strong class="text-emerald-400">${currentRealmName} (Tier ${currentTier})</strong></span>
                        <span class="text-rose-400 font-bold">Yêu cầu: Đại Thừa Kỳ (Tier ${ARTIFACT_UNLOCK_TIER})</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 transition-all duration-500" style="width: ${progressPct}%"></div>
                    </div>
                    <span class="text-[10px] text-slate-500 text-center block mt-1.5">Tiến độ mở khóa: ${progressPct}%</span>
                </div>

                <div class="locked-footer-hint">
                    <i class="fa-solid fa-triangle-exclamation text-amber-400 mr-1.5"></i>
                    <span>Cố ý ngưng luyện khi đan điền chưa vững sẽ dẫn đến tẩu hỏa nhập ma, nổ đan mà chết!</span>
                </div>
            </div>
        `;
        return;
    }

    // GIAO DIỆN ĐÃ MỞ KHÓA (RENDER TỪ DESTINY_ARTIFACTS_DATA)
    content.innerHTML = `
        <div class="space-y-4">
            <header class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-teal-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between">
                <div>
                    <h3 class="text-base font-bold text-gold-300 font-serif flex items-center gap-2">
                        <i class="fa-solid fa-certificate text-amber-400"></i> Tam Đại Pháp Bảo Bản Mệnh
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">Pháp bảo ôn dưỡng theo cảnh giới, hộ trì đan điền và gia tăng chiến lực siêu phàm.</p>
                </div>
                <span class="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">Ôn Dưỡng: Bậc ${artLevel}</span>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                ${DESTINY_ARTIFACTS_DATA.map(art => {
                    const statVal = (artLevel * art.statPerLevel).toLocaleString('vi-VN');
                    const colorBorder = art.theme === 'teal' ? 'border-teal-500/30 hover:border-teal-400/60' : (art.theme === 'amber' ? 'border-amber-500/30 hover:border-amber-400/60' : 'border-purple-500/30 hover:border-purple-400/60');
                    const colorText = art.theme === 'teal' ? 'text-teal-300' : (art.theme === 'amber' ? 'text-amber-300' : 'text-purple-300');
                    const colorBtn = art.theme === 'teal' ? 'bg-teal-950/70 hover:bg-teal-900 text-teal-200 border-teal-400/40' : (art.theme === 'amber' ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-400/40' : 'bg-purple-950/70 hover:bg-purple-900 text-purple-200 border-purple-400/40');
                    
                    return `
                        <article class="p-4 rounded-xl bg-slate-950/70 border ${colorBorder} transition flex flex-col justify-between space-y-3">
                            <div class="space-y-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-xl overflow-hidden border ${art.theme === 'teal' ? 'border-teal-400/60 shadow-[0_0_12px_#2dd4bf]' : (art.theme === 'amber' ? 'border-amber-400/60 shadow-[0_0_12px_#fbbf24]' : 'border-purple-400/60 shadow-[0_0_12px_#c084fc]')} p-0.5 flex-shrink-0 bg-slate-900 flex items-center justify-center">
                                        ${art.image ? `<img src="${art.image}" alt="${art.name}" class="w-full h-full object-cover rounded-lg">` : `<i class="${art.icon} ${colorText} text-2xl"></i>`}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-slate-100 text-sm">${art.name}</h4>
                                        <span class="text-[10px] ${colorText} font-mono">${art.type}</span>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                    <div class="flex justify-between"><span>${art.statLabel}</span><b class="${colorText} font-mono">+${statVal} ${art.statUnit}</b></div>
                                    <div class="flex justify-between"><span>Gia Tốc Hiệu Quả:</span><b class="${colorText} font-mono">${art.speedBonus}</b></div>
                                    <div class="flex justify-between"><span>Thần Thông:</span><b class="text-gold-300">${art.technique}</b></div>
                                </div>
                            </div>
                            <button type="button" onclick="upgradeArtifact('${art.id}')" class="w-full py-2 rounded-xl ${colorBtn} border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                <i class="fa-solid ${art.btnIcon}"></i> ${art.btnText}
                            </button>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderTalismanHub(content) {
    if (!content) return;
    if (!state.talismans || typeof state.talismans !== 'object') {
        state.talismans = { lightning: 8, shield: 5, speed: 12, calm: 6 };
    }

    const configs = typeof TALISMANS_CONFIG !== 'undefined' ? TALISMANS_CONFIG : [
        { id: "lightning", name: "Lôi Chấn Phù", icon: "fa-bolt", rarity: 4, color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-950/80", cost: 500, desc: "Kích hoạt lôi điện cuồng nộ, tăng +5,000 ATK tức thời trong 3 phút." },
        { id: "shield", name: "Kim Cương Phù", icon: "fa-shield", rarity: 4, color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-950/80", cost: 500, desc: "Ngưng kết kim cương cương khí hộ thể, hồi 50% HP và tăng +3,000 DEF." },
        { id: "speed", name: "Thần Hành Phù", icon: "fa-wind", rarity: 3, color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-950/80", cost: 400, desc: "Hóa thân ngự phong thần tốc, tăng +35% tốc độ tu luyện chu thiên trong 5 phút." },
        { id: "calm", name: "Thanh Tâm Phù", icon: "fa-yin-yang", rarity: 5, color: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-950/80", cost: 600, desc: "Thanh lọc tâm ma cấu uế, lập tức hồi phục +25 Đạo Tâm thanh tịnh." }
    ];

    const now = Date.now();
    const hasAtkBuff = state.talismanAtkBuffUntil && state.talismanAtkBuffUntil > now;
    const hasDefBuff = state.talismanDefBuffUntil && state.talismanDefBuffUntil > now;
    const hasSpeedBuff = state.talismanSpeedBuffUntil && state.talismanSpeedBuffUntil > now;

    content.innerHTML = `
        <div class="space-y-4">
            <!-- HEADER HỌA PHÙ CÁC -->
            <header class="p-4 rounded-2xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-slate-950 border border-teal-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-400/60 flex items-center justify-center text-teal-300 text-xl shadow-[0_0_15px_rgba(45,212,191,0.25)] flex-shrink-0">
                        <i class="fa-solid fa-scroll"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-teal-300 font-serif flex items-center gap-2">
                            Họa Phù Các • Bách Trận Phù Lục
                        </h3>
                        <p class="text-xs text-slate-400 mt-0.5">Dùng chu sa và phù chỉ vẽ bùa linh nghiệm, kích hoạt thần tốc khi nghênh chiến hoặc độ kiếp.</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button type="button" onclick="craftRandomTalisman()" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-200 border border-teal-400/50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95">
                        <i class="fa-solid fa-paintbrush"></i> Khởi Bút Họa Phù (500 LT)
                    </button>
                </div>
            </header>

            <!-- THANH TRẠNG THÁI BUFF PHÙ LỤC ĐANG KÍCH HOẠT NẾU CÓ -->
            ${(hasAtkBuff || hasDefBuff || hasSpeedBuff) ? `
                <div class="p-3 rounded-xl bg-slate-900/80 border border-teal-500/30 flex flex-wrap gap-3 items-center text-xs font-mono">
                    <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-sparkles text-amber-400"></i> Hiệu lực phù chú:</span>
                    ${hasAtkBuff ? `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">+5,000 ATK (${Math.ceil((state.talismanAtkBuffUntil - now)/1000)}s)</span>` : ''}
                    ${hasDefBuff ? `<span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/40">+3,000 DEF (${Math.ceil((state.talismanDefBuffUntil - now)/1000)}s)</span>` : ''}
                    ${hasSpeedBuff ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">+35% Tu Luyện (${Math.ceil((state.talismanSpeedBuffUntil - now)/1000)}s)</span>` : ''}
                </div>
            ` : ''}

            <!-- GRID CÁC ĐẠO PHÙ LỤC BẢO MỆNH -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                ${configs.map(t => {
                    const count = Number(state.talismans[t.id]) || 0;
                    return `
                        <article class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:${t.border} transition flex flex-col justify-between space-y-3">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center ${t.color}">
                                            <i class="fa-solid ${t.icon}"></i>
                                        </div>
                                        <b class="text-sm font-bold text-slate-100">${t.name}</b>
                                    </div>
                                    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded ${t.bg} ${t.color} border ${t.border}">
                                        x${count}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-400 leading-relaxed">${t.desc}</p>
                            </div>

                            <div class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                                <button type="button" onclick="useTalisman('${t.id}')" class="py-1.5 rounded-lg ${count > 0 ? `${t.bg} ${t.color} border ${t.border} hover:brightness-125 cursor-pointer` : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'} text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95" ${count > 0 ? '' : 'disabled'}>
                                    <i class="fa-solid fa-bolt"></i> Dùng Phù
                                </button>
                                <button type="button" onclick="craftSpecificTalisman('${t.id}')" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer">
                                    <i class="fa-solid fa-paintbrush"></i> Vẽ (${t.cost} LT)
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function useTalisman(type) {
    if (!state.talismans) state.talismans = { lightning: 8, shield: 5, speed: 12, calm: 6 };
    const count = Number(state.talismans[type]) || 0;
    if (count <= 0) {
        addLog('Đã hết phù lục loại này! Hãy dùng bút chu sa họa thêm bùa mới.', 'text-rose-400');
        return;
    }

    state.talismans[type] -= 1;
    const now = Date.now();

    if (type === 'lightning') {
        state.talismanAtkBuffUntil = now + 180000;
        state.talismanAtkBuffVal = 5000;
        if (typeof playSound === 'function') playSound('whoosh');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+5,000 ATK (3 Phút)!', 'text-amber-300');
        addLog('⚡ Kích hoạt [Lôi Chấn Phù]! Sấm sét quấn quanh phi kiếm, tăng +5,000 Công Kích trong 3 phút!', 'text-amber-300');
    } else if (type === 'shield') {
        const healAmt = Math.round((state.maxHp || 1000) * 0.5);
        state.hp = Math.min(state.maxHp || 1000, (state.hp || 0) + healAmt);
        state.talismanDefBuffUntil = now + 180000;
        state.talismanDefBuffVal = 3000;
        if (typeof playSound === 'function') playSound('bell');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `+${healAmt.toLocaleString('vi-VN')} HP & +3,000 DEF!`, 'text-cyan-300');
        addLog('🛡️ Kích hoạt [Kim Cương Phù]! Kim quang hộ thể, tức thời hồi phục 50% Khí Huyết và tăng +3,000 Phòng Ngự!', 'text-cyan-300');
    } else if (type === 'speed') {
        state.talismanSpeedBuffUntil = now + 300000;
        if (typeof playSound === 'function') playSound('whoosh');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+35% Tốc Độ Tu Luyện (5 Phút)!', 'text-emerald-300');
        addLog('🍃 Kích hoạt [Thần Hành Phù]! Ngự phong phiêu dật, tăng +35% Tốc Độ Tu Luyện Chu Thiên trong 5 phút!', 'text-emerald-300');
    } else if (type === 'calm') {
        state.daoTam = Math.min(100, (Number(state.daoTam) || 100) + 25);
        state.tamMa = Math.max(0, 100 - state.daoTam);
        if (typeof playSound === 'function') playSound('bell');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+25 Đạo Tâm Thanh Tịnh!', 'text-purple-300');
        addLog('🧘 Kích hoạt [Thanh Tâm Phù]! Băng tâm ngọc triệt, thanh tẩy 25 điểm Tâm Ma, Đạo Tâm khôi phục!', 'text-purple-300');
    }

    updateHUD();
    saveGameState();
    renderHubModal('character', 'talisman');
}
window.useTalisman = useTalisman;

function craftSpecificTalisman(type) {
    if (!state.talismans) state.talismans = { lightning: 8, shield: 5, speed: 12, calm: 6 };
    const configs = typeof TALISMANS_CONFIG !== 'undefined' ? TALISMANS_CONFIG : [];
    const cfg = configs.find(t => t.id === type) || { name: 'Phù Lục', cost: 500 };

    if ((state.stones || 0) < cfg.cost) {
        addLog(`Không đủ Linh Thạch để vẽ [${cfg.name}] (Cần ${cfg.cost} LT).`, 'text-rose-400');
        return;
    }

    state.stones -= cfg.cost;
    const isDouble = Math.random() < 0.25;
    const gainQty = isDouble ? 2 : 1;
    state.talismans[type] = (state.talismans[type] || 0) + gainQty;
    state.talismanCraftedCount = (state.talismanCraftedCount || 0) + 1;

    if (typeof playSound === 'function') playSound('ding');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `+${gainQty} ${cfg.name}!`, 'text-teal-300');
    addLog(`📜 Bút hạ linh phù! Họa thành công <b class="text-teal-300">${gainQty} ${cfg.name}</b> ${isDouble ? '(Bút pháp xuất thần nhận x2!)' : ''}`, 'text-teal-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'talisman');
}
window.craftSpecificTalisman = craftSpecificTalisman;

function craftRandomTalisman() {
    const types = ['lightning', 'shield', 'speed', 'calm'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    craftSpecificTalisman(randomType);
}
window.craftRandomTalisman = craftRandomTalisman;
window.craftTalisman = craftRandomTalisman;

function renderCompanionHub(content) {
    if (!content) return;
    if (!Array.isArray(state.companions) || state.companions.length === 0) {
        state.companions = structuredClone(typeof COMPANIONS_DATA !== 'undefined' ? COMPANIONS_DATA : []);
    } else if (typeof COMPANIONS_DATA !== 'undefined') {
        COMPANIONS_DATA.forEach(def => {
            if (!state.companions.some(c => c.id === def.id)) {
                state.companions.push({ ...def, affinity: 0 });
            }
        });
    }

    content.innerHTML = `
        <div class="space-y-4">
            <header class="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex items-center justify-between">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-400/60 flex items-center justify-center text-rose-300 text-xl">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-rose-200 font-serif">Đạo Lữ Đồng Tu • Song Tu Tụ Khí</h3>
                        <p class="text-xs text-slate-400 mt-0.5">Kết giao tiên duyên, tâm ý tương thông. Hảo cảm càng cao, gia trì chiến lực càng cường đại.</p>
                    </div>
                </div>
                <span class="text-xs font-mono text-rose-300 bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-500/30">
                    Đạo Lữ: ${state.companions.length} Vị
                </span>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${state.companions.map(comp => {
                    const aff = Math.min(100, Math.max(0, Number(comp.affinity) || 0));
                    let intimacyTitle = 'Sơ Thức (Gặp Gỡ)';
                    let intimacyColor = 'text-slate-400 border-slate-700 bg-slate-900';
                    if (aff >= 90) {
                        intimacyTitle = 'Sinh Tử Tương Tùy';
                        intimacyColor = 'text-rose-300 border-rose-500/60 bg-rose-950/80';
                    } else if (aff >= 60) {
                        intimacyTitle = 'Đạo Lữ Tri Âm';
                        intimacyColor = 'text-purple-300 border-purple-500/60 bg-purple-950/80';
                    } else if (aff >= 30) {
                        intimacyTitle = 'Tri Kỷ Huynh Đệ';
                        intimacyColor = 'text-amber-300 border-amber-500/60 bg-amber-950/80';
                    }

                    return `
                        <article class="companion-card space-y-3 flex flex-col justify-between">
                            <div class="space-y-2.5">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-11 h-11 rounded-xl bg-slate-950 border border-rose-400/40 flex items-center justify-center text-rose-400 text-xl overflow-hidden shrink-0 shadow-md">
                                            ${comp.avatar || comp.image ? `<img src="${comp.avatar || comp.image}" alt="${comp.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">` : `<i class="fa-solid ${comp.avatarIcon || 'fa-user-nurse'}"></i>`}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-100 text-sm font-serif">${comp.name}</h4>
                                            <span class="text-[10px] text-rose-300/90 font-mono block">${comp.title || comp.sect} • ${comp.physique}</span>
                                        </div>
                                    </div>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border ${intimacyColor}">
                                        ${intimacyTitle}
                                    </span>
                                </div>

                                <blockquote class="text-[11px] text-slate-300/90 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                    "${comp.quote || 'Tu đạo cô tịch, nguyện cùng người sẻ chia...'}"
                                </blockquote>

                                <div class="text-[11px] text-amber-300/90 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                    <i class="fa-solid fa-sparkles text-amber-400 mr-1"></i>
                                    <span>Gia trì: <b>${comp.bonusDesc || 'Tăng cường thuộc tính tu luyện'}</b></span>
                                </div>

                                <div class="space-y-1">
                                    <div class="flex justify-between text-[11px] font-mono text-rose-300">
                                        <span>Độ Hảo Cảm</span>
                                        <span>${aff} / 100</span>
                                    </div>
                                    <div class="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                        <div class="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all duration-300" style="width: ${aff}%;"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                                <button type="button" onclick="dualCultivateCompanion('${comp.id}')" class="py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                    <i class="fa-solid fa-yin-yang"></i> Song Tu Đả Tọa
                                </button>
                                <button type="button" onclick="giftCompanion('${comp.id}')" class="py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                    <i class="fa-solid fa-gift"></i> Tặng Quà (500 LT)
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function dualCultivateCompanion(compId) {
    if (!Array.isArray(state.companions)) return;
    const comp = state.companions.find(c => c.id === compId);
    if (!comp) return;

    const expGain = Math.round(1500 + (Number(comp.affinity) || 0) * 80);
    state.exp = (Number(state.exp) || 0) + expGain;
    state.daoTam = Math.min(100, (Number(state.daoTam) || 100) + 5);
    state.tamMa = Math.max(0, 100 - state.daoTam);
    comp.affinity = Math.min(100, (Number(comp.affinity) || 0) + 2);

    if (typeof playSound === 'function') playSound('whoosh');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `+${expGain} Tu Vi • +2 Hảo Cảm`, 'text-rose-300');
    addLog(`💞 Cùng [${comp.name}] tương hỗ linh khí, song tu đả tọa! Thu hoạch +${expGain} Tu Vi, Đạo Tâm an định.`, 'text-rose-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'companion');
}
window.dualCultivateCompanion = dualCultivateCompanion;

function giftCompanion(compId) {
    if (!Array.isArray(state.companions)) return;
    const comp = state.companions.find(c => c.id === compId);
    if (!comp) return;

    if (state.stones < 500) {
        addLog('Không đủ Linh Thạch để chuẩn bị lễ vật (Cần 500 LT).', 'text-rose-400');
        return;
    }
    state.stones -= 500;
    comp.affinity = Math.min(100, (Number(comp.affinity) || 0) + 8);

    if (typeof playSound === 'function') playSound('bell');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+8 Hảo Cảm!', 'text-purple-300');
    addLog(`🎁 Tặng quà cho [${comp.name}]: "${comp.giftText || 'Đa tạ tấm lòng của đạo hữu!'}" (Hảo cảm +8)`, 'text-purple-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'companion');
}
window.giftCompanion = giftCompanion;

function renderAvatarHub(content) {
    if (!content) return;
    if (!Array.isArray(state.avatars) || state.avatars.length === 0) {
        state.avatars = [
            { id: "avatar_sword", level: 1, status: "idle", expeditionEndTime: 0 },
            { id: "avatar_alchemy", level: 1, status: "idle", expeditionEndTime: 0 },
            { id: "avatar_soul", level: 1, status: "idle", expeditionEndTime: 0 }
        ];
    }

    const avatarsData = typeof AVATARS_DATA !== 'undefined' ? AVATARS_DATA : [];
    const now = Date.now();

    // Tự động kiểm tra hoàn thành chuyến du hành
    state.avatars.forEach(av => {
        if (av.status === 'expedition' && av.expeditionEndTime && now >= av.expeditionEndTime) {
            av.status = 'claimable';
        }
    });

    content.innerHTML = `
        <div class="space-y-4">
            <!-- HEADER PHÂN THẦN HÓA THÂN -->
            <header class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex items-center justify-between">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-amber-300 text-xl shadow-[0_0_15px_rgba(251,191,36,0.25)] flex-shrink-0">
                        <i class="fa-solid fa-users-viewfinder"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gold-300 font-serif flex items-center gap-2">
                            Phân Thần Hóa Thân • Ngoại Thân Hóa Khí
                        </h3>
                        <p class="text-xs text-slate-400 mt-0.5">Phân tách thần thức ngưng kết hóa thân. Hóa thân tự động thám hiểm viễn chinh đem về kỳ trân dị bảo.</p>
                    </div>
                </div>
                <span class="text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/30">
                    Kim Thân: ${state.avatars.length} Đạo
                </span>
            </header>

            <!-- DANH SÁCH 3 ĐẠI HÓA THÂN -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                ${state.avatars.map(av => {
                    const def = avatarsData.find(d => d.id === av.id) || avatarsData[0] || {
                        name: 'Hóa Thân', title: 'Ngoại Thân', icon: 'fa-user', color: 'text-amber-400', theme: 'from-amber-950/50 to-slate-900',
                        missionName: 'Lịch Luyện', durationSec: 180, baseStones: 10000, baseExp: 20000, desc: 'Phân thân tự động thu hoạch tài nguyên.'
                    };

                    const lvl = Number(av.level) || 1;
                    const mult = 1 + (lvl - 1) * 0.25;
                    const stonesYield = Math.round((def.baseStones || 10000) * mult);
                    const expYield = Math.round((def.baseExp || 20000) * mult);
                    const upgradeCost = lvl * 10000;

                    let statusBadge = '';
                    let actionBtn = '';

                    if (av.status === 'idle') {
                        statusBadge = `<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">Sẵn Sàng</span>`;
                        actionBtn = `
                            <button type="button" onclick="dispatchAvatar('${av.id}')" class="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                <i class="fa-solid fa-paper-plane"></i> Xuất Hành Lịch Luyện (${Math.round(def.durationSec / 60)} Phút)
                            </button>
                        `;
                    } else if (av.status === 'expedition') {
                        const remSec = Math.max(0, Math.ceil((av.expeditionEndTime - now) / 1000));
                        const remMin = Math.floor(remSec / 60);
                        const remSecOnly = remSec % 60;
                        statusBadge = `<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">Đang Du Hành (${remMin}m ${remSecOnly}s)</span>`;
                        actionBtn = `
                            <button type="button" onclick="instantCompleteAvatar('${av.id}')" class="w-full py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                <i class="fa-solid fa-bolt"></i> Tụ Khí Hoàn Thành (10 Tiên Ngọc)
                            </button>
                        `;
                    } else if (av.status === 'claimable') {
                        statusBadge = `<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-bold animate-bounce">ĐÃ HOÀN THÀNH</span>`;
                        actionBtn = `
                            <button type="button" onclick="claimAvatarRewards('${av.id}')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                <i class="fa-solid fa-gift"></i> Thu Hoạch Chiến Lợi Phẩm!
                            </button>
                        `;
                    }

                    return `
                        <article class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 transition flex flex-col justify-between space-y-3">
                            <div class="space-y-2.5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg ${def.color}">
                                            <i class="fa-solid ${def.icon}"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-100 text-sm font-serif">${def.name}</h4>
                                            <span class="text-[10px] ${def.color} font-mono">Kim Thân Bậc ${lvl} • ${def.title}</span>
                                        </div>
                                    </div>
                                    ${statusBadge}
                                </div>

                                <div class="text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1 text-slate-300 font-mono">
                                    <div class="text-gold-300 font-semibold font-serif">${def.missionName}</div>
                                    <div class="flex justify-between"><span>Thu hoạch LT:</span><b class="text-amber-400">+${stonesYield.toLocaleString('vi-VN')} LT</b></div>
                                    <div class="flex justify-between"><span>Hấp thu Tu Vi:</span><b class="text-emerald-400">+${expYield.toLocaleString('vi-VN')} Tu Vi</b></div>
                                    ${def.bonusItem ? `<div class="flex justify-between"><span>Linh vật kèm:</span><b class="text-purple-300">+${def.bonusItem.count} ${def.bonusItem.name}</b></div>` : ''}
                                    ${def.daoTamGain ? `<div class="flex justify-between"><span>Đạo Tâm tịnh hóa:</span><b class="text-cyan-300">+${def.daoTamGain} Điểm</b></div>` : ''}
                                </div>
                            </div>

                            <div class="space-y-2 pt-2 border-t border-slate-800/80">
                                ${actionBtn}
                                <button type="button" onclick="upgradeAvatar('${av.id}')" class="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-mono transition flex items-center justify-center gap-1 cursor-pointer">
                                    <i class="fa-solid fa-arrow-up-right-dots text-amber-400"></i> Ngưng Luyện Bậc ${lvl + 1} (${upgradeCost.toLocaleString('vi-VN')} LT)
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function dispatchAvatar(avatarId) {
    if (!Array.isArray(state.avatars)) return;
    const av = state.avatars.find(a => a.id === avatarId);
    if (!av) return;

    const avatarsData = typeof AVATARS_DATA !== 'undefined' ? AVATARS_DATA : [];
    const def = avatarsData.find(d => d.id === avatarId) || { durationSec: 180, name: 'Hóa Thân' };

    av.status = 'expedition';
    av.expeditionEndTime = Date.now() + (def.durationSec * 1000);

    if (typeof playSound === 'function') playSound('whoosh');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Phái ${def.name} Du Hành!`, 'text-amber-300');
    addLog(`🚀 Đã phái [${def.name}] viễn du [${def.missionName}]! Hóa thân bắt đầu thu nạp thiên địa linh vật.`, 'text-amber-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'avatar');
}
window.dispatchAvatar = dispatchAvatar;

function instantCompleteAvatar(avatarId) {
    if (!Array.isArray(state.avatars)) return;
    const av = state.avatars.find(a => a.id === avatarId);
    if (!av) return;

    const jadeCount = Number(state.jade || state.immortalJade || 0);
    if (jadeCount < 10) {
        addLog('Không đủ Tiên Ngọc để tụ khí hoàn thành tức thời (Cần 10 Tiên Ngọc).', 'text-rose-400');
        return;
    }

    if (state.jade !== undefined) state.jade -= 10;
    else if (state.immortalJade !== undefined) state.immortalJade -= 10;

    av.status = 'claimable';
    av.expeditionEndTime = Date.now();

    if (typeof playSound === 'function') playSound('bell');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, 'Hoàn Thành Tức Thời!', 'text-gold-300');
    addLog(`⚡ Dùng 10 Tiên Ngọc thúc đẩy thần thức, Hóa Thân đã lập tức hoàn thành chuyến du hành!`, 'text-gold-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'avatar');
}
window.instantCompleteAvatar = instantCompleteAvatar;

function claimAvatarRewards(avatarId) {
    if (!Array.isArray(state.avatars)) return;
    const av = state.avatars.find(a => a.id === avatarId);
    if (!av) return;

    const avatarsData = typeof AVATARS_DATA !== 'undefined' ? AVATARS_DATA : [];
    const def = avatarsData.find(d => d.id === avatarId) || { baseStones: 10000, baseExp: 20000, name: 'Hóa Thân' };

    const lvl = Number(av.level) || 1;
    const mult = 1 + (lvl - 1) * 0.25;
    const stonesYield = Math.round((def.baseStones || 10000) * mult);
    const expYield = Math.round((def.baseExp || 20000) * mult);

    state.stones = (state.stones || 0) + stonesYield;
    state.exp = (Number(state.exp) || 0) + expYield;

    if (def.daoTamGain) {
        state.daoTam = Math.min(100, (Number(state.daoTam) || 100) + def.daoTamGain);
        state.tamMa = Math.max(0, 100 - state.daoTam);
    }

    if (def.bonusItem) {
        if (!Array.isArray(state.inventory)) state.inventory = [];
        let existing = state.inventory.find(i => i.id === def.bonusItem.id);
        if (existing) {
            existing.count = (existing.count || 0) + def.bonusItem.count;
        } else {
            state.inventory.push({
                id: def.bonusItem.id,
                name: def.bonusItem.name,
                type: 'Khoáng Thạch',
                count: def.bonusItem.count,
                desc: 'Chiến lợi phẩm từ Hóa Thân du hành mang về.',
                rarity: 3,
                icon: def.bonusItem.icon || 'fa-gem'
            });
        }
    }

    av.status = 'idle';
    av.expeditionEndTime = 0;
    state.avatarTripsCompleted = (state.avatarTripsCompleted || 0) + 1;

    if (typeof playSound === 'function') playSound('victory');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `+${stonesYield.toLocaleString('vi-VN')} LT • +${expYield.toLocaleString('vi-VN')} Tu Vi!`, 'text-gold-300');
    addLog(`🎁 [${def.name}] đã hoàn tất lịch luyện trở về! Mang theo +${stonesYield.toLocaleString('vi-VN')} Linh Thạch, +${expYield.toLocaleString('vi-VN')} Tu Vi ${def.bonusItem ? `và ${def.bonusItem.count} ${def.bonusItem.name}` : ''}!`, 'text-gold-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'avatar');
}
window.claimAvatarRewards = claimAvatarRewards;

function upgradeAvatar(avatarId) {
    if (!Array.isArray(state.avatars)) return;
    const av = state.avatars.find(a => a.id === avatarId);
    if (!av) return;

    const lvl = Number(av.level) || 1;
    const cost = lvl * 10000;

    if ((state.stones || 0) < cost) {
        addLog(`Không đủ Linh Thạch để ngưng luyện Kim Thân (Cần ${cost.toLocaleString('vi-VN')} LT).`, 'text-rose-400');
        return;
    }

    state.stones -= cost;
    av.level = lvl + 1;

    if (typeof playSound === 'function') playSound('bell');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Kim Thân Đạt Bậc ${av.level}!`, 'text-gold-300');
    addLog(`✨ Kim Thân của Hóa Thân đã ngưng luyện thành công lên Bậc ${av.level}! Sản lượng thu hoạch tăng vĩnh viễn +25%!`, 'text-gold-300');

    updateHUD();
    saveGameState();
    renderHubModal('character', 'avatar');
}
window.upgradeAvatar = upgradeAvatar;

function renderWorldMarketHub(content) {
    if (typeof renderMarketDrawer === 'function') {
        const dummyTitle = { textContent: '' };
        const dummyIcon = { className: '' };
        renderMarketDrawer(content, dummyTitle, dummyIcon);
    } else {
        content.innerHTML = '<p class="text-slate-400">Phường Thị đang bảo trì...</p>';
    }
}

function renderWorldDungeonHub(content) {
    if (!content) return;
    const list = typeof DUNGEONS !== 'undefined' ? DUNGEONS : [];
    const clearedMap = state.dungeonsCleared || {};
    const totalCleared = list.filter(d => clearedMap[d.id]).length;
    const playerRealmIdx = Number(state.realmIndex) || 0;

    content.innerHTML = `
        <div class="space-y-4">
            <header class="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-red-950/20 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-400/60 flex items-center justify-center text-rose-300 text-xl shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                        <i class="fa-solid fa-dungeon"></i>
                    </div>
                    <div>
                        <h3 class="font-serif font-bold text-slate-100 text-base">🗝️ BÍ CẢNH THÁM HIỂM • CÀN QUÉT</h3>
                        <p class="text-xs text-slate-400 mt-0.5">Thám hiểm cấm địa trảm yêu thú. Vượt ải mở khóa tính năng Càn Quét nhanh.</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-2 text-xs">
                        <span class="text-slate-400 font-medium">Chinh Phục:</span>
                        <b class="text-rose-400 font-mono">${totalCleared} / ${list.length}</b>
                    </div>
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-2 text-xs">
                        <span class="text-slate-400 font-medium">Tiên Ngọc:</span>
                        <b class="text-amber-400 font-mono">💎 ${(state.immortalJade || 0).toLocaleString('vi-VN')}</b>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                ${list.map((d, idx) => {
                    const isCleared = Boolean(clearedMap[d.id]);
                    const clearCount = clearedMap[d.id]?.count || 0;
                    const isRealmMet = playerRealmIdx >= (d.reqRealmIndex || 0);

                    return `
                        <article class="p-4 rounded-xl bg-slate-950/80 border ${isCleared ? 'border-emerald-500/30 hover:border-emerald-500/60' : isRealmMet ? 'border-rose-900/60 hover:border-rose-500/50' : 'border-slate-800/80 opacity-75'} transition flex flex-col justify-between space-y-3 shadow-lg">
                            <div class="space-y-2">
                                <div class="flex justify-between items-start gap-2">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="w-10 h-10 rounded-lg overflow-hidden border border-rose-500/30 shrink-0 bg-slate-900 flex items-center justify-center shadow-md">
                                            ${d.image ? `<img src="${d.image}" alt="${d.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">` : `<i class="fa-solid ${d.icon || 'fa-dungeon'} text-rose-400"></i>`}
                                        </div>
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-1.5">
                                                <h4 class="font-bold text-slate-100 text-sm font-serif truncate">${d.name}</h4>
                                                ${isCleared ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-mono shrink-0">✓ ĐÃ PHÁ (${clearCount})</span>` : ''}
                                            </div>
                                            <span class="text-[10px] text-slate-400 line-clamp-1 block">${d.desc || ''}</span>
                                        </div>
                                    </div>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded ${isRealmMet ? 'bg-rose-950/80 text-rose-300 border border-rose-600/30' : 'bg-slate-900 text-slate-500 border border-slate-700'} shrink-0">
                                        Ải ${idx + 1} • ${d.reqRealmName || 'Phàm Trần'}
                                    </span>
                                </div>

                                <div class="text-xs space-y-1.5 text-slate-300 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-400">Thủ Hộ:</span>
                                        <b class="text-rose-400 font-semibold">${d.boss}</b>
                                    </div>
                                    <div class="flex justify-between text-[11px] text-slate-400">
                                        <span>Khí Huyết: <b class="text-slate-200 font-mono">${(d.hp * 1000).toLocaleString('vi-VN')}</b></span>
                                        <span>Công Kích: <b class="text-amber-300 font-mono">${(d.atk * 100).toLocaleString('vi-VN')}</b></span>
                                    </div>
                                    <div class="text-[11px] text-emerald-400 pt-1.5 border-t border-slate-800 flex justify-between items-center">
                                        <span>Thưởng: +${d.stoneReward.toLocaleString('vi-VN')} LT, +${d.expReward.toLocaleString('vi-VN')} Tu Vi</span>
                                        <span class="text-amber-300 font-mono">${d.dropName}</span>
                                    </div>
                                    ${!isCleared && d.firstClearJade ? `
                                        <div class="text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 flex items-center justify-between">
                                            <span>Thủ Sát Ban Thưởng:</span>
                                            <b class="font-mono">💎 +${d.firstClearJade} Tiên Ngọc</b>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="space-y-1.5 pt-1">
                                ${!isRealmMet ? `
                                    <button disabled class="w-full py-2 rounded-xl bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1.5">
                                        <i class="fa-solid fa-lock"></i> Cần Cảnh Giới ${d.reqRealmName}
                                    </button>
                                ` : `
                                    <div class="flex items-center gap-2">
                                        <button type="button" onclick="closeHubModal(); openCombatModal(${idx})" class="flex-1 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md">
                                            <i class="fa-solid fa-swords"></i> Khiêu Chiến
                                        </button>
                                        ${isCleared ? `
                                            <button type="button" onclick="sweepDungeon(${idx}, 1)" class="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md" title="Càn quét 1 lần">
                                                <i class="fa-solid fa-bolt"></i> Quét x1
                                            </button>
                                            <button type="button" onclick="sweepDungeon(${idx}, 5)" class="px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md" title="Càn quét 5 lần">
                                                <i class="fa-solid fa-forward-fast"></i> x5
                                            </button>
                                        ` : `
                                            <button disabled class="px-3 py-2 rounded-xl bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium opacity-60 cursor-not-allowed" title="Vượt ải lần đầu để mở Càn Quét">
                                                <i class="fa-solid fa-lock"></i> Quét
                                            </button>
                                        `}
                                    </div>
                                `}
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
window.renderWorldDungeonHub = renderWorldDungeonHub;

function refreshDungeonUI() {
    const pageContent = document.getElementById('world-dungeon-page-content');
    if (pageContent) {
        renderWorldDungeonHub(pageContent);
    }
    const hubContent = document.getElementById('hub-modal-content');
    if (hubContent && document.getElementById('hub-modal')?.classList.contains('active')) {
        renderWorldDungeonHub(hubContent);
    }
}
window.refreshDungeonUI = refreshDungeonUI;

function sweepDungeon(dungeonIdx, times = 1) {
    const dungeon = (typeof DUNGEONS !== 'undefined' ? DUNGEONS : [])[dungeonIdx];
    if (!dungeon) return;
    if (!state.dungeonsCleared || !state.dungeonsCleared[dungeon.id]) {
        addLog(`⚠️ Đạo hữu chưa từng vượt qua ${dungeon.name}, không thể càn quét! Hãy khiêu chiến thủ thắng trước.`, 'text-rose-400');
        return;
    }
    const count = Math.max(1, Math.min(10, times));
    const totalStones = dungeon.stoneReward * count;
    const totalExp = dungeon.expReward * count;
    
    state.stones = (state.stones || 0) + totalStones;
    addExp(totalExp);

    let dropCount = 0;
    for (let i = 0; i < count; i++) {
        if (Math.random() < 0.75) {
            dropCount++;
        }
    }
    if (dropCount > 0 && dungeon.dropId) {
        if (!Array.isArray(state.inventory)) state.inventory = [];
        let invItem = state.inventory.find(i => i.id === dungeon.dropId);
        if (invItem) {
            invItem.count = (invItem.count || 0) + dropCount;
        } else {
            state.inventory.push({
                id: dungeon.dropId,
                name: dungeon.dropName,
                type: 'Đan Dược',
                count: dropCount,
                desc: `Chiến lợi phẩm càn quét từ ${dungeon.name}.`,
                icon: 'fa-box'
            });
        }
    }

    // 28% xác suất khai quật Cổ Thần Di Tích
    if (Math.random() < 0.28) {
        const bonusStones = Math.floor(dungeon.stoneReward * (0.6 + Math.random() * 0.4) * count);
        const bonusExp = Math.floor(dungeon.expReward * (0.5 + Math.random() * 0.5) * count);
        const bonusJade = Math.floor(1 + Math.random() * 3);
        state.stones = (state.stones || 0) + bonusStones;
        addExp(bonusExp);
        state.immortalJade = (state.immortalJade || 0) + bonusJade;
        if (typeof playSound === 'function') playSound('relic_chime');
        addLog(`🏛️ <span class="text-amber-300 font-bold">[Cổ Thần Di Tích]</span> Khai quật bí thất thượng cổ trong <b class="text-rose-400">${dungeon.name}</b>! Nhận thêm: <span class="text-amber-300">+${bonusStones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class="text-emerald-300">+${bonusExp.toLocaleString('vi-VN')} Tu Vi</span>, <span class="text-gold-300">💎 +${bonusJade} Tiên Ngọc</span>!`, 'text-amber-300 font-bold', 'dungeon-relic');
    }

    state.dungeonsCleared[dungeon.id].count = (state.dungeonsCleared[dungeon.id].count || 0) + count;
    if (typeof playSound === 'function') playSound('victory');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Càn quét ${dungeon.name} x${count}!`, 'text-emerald-300');
    addLog(`⚔️ Càn quét <b class="text-rose-400">${dungeon.name}</b> x${count} lần! Thu hoạch: <span class="text-amber-300">+${totalStones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class="text-emerald-300">+${totalExp.toLocaleString('vi-VN')} Tu Vi</span>${dropCount > 0 ? `, <span class="text-gold-300">+${dropCount} ${dungeon.dropName}</span>` : ''}.`, 'text-emerald-400 font-bold');
    
    updateHUD();
    saveGameState();
    refreshDungeonUI();
}
window.sweepDungeon = sweepDungeon;

let currentArenaTab = 'rank'; // 'rank' | 'shop'

function switchArenaSubTab(tab) {
    currentArenaTab = tab;
    renderHubModal('world', 'arena');
}
window.switchArenaSubTab = switchArenaSubTab;

function renderWorldArenaHub(content) {
    if (!content) return;
    if (state.arenaRank === undefined) state.arenaRank = 100;
    if (state.arenaHonor === undefined) state.arenaHonor = 150;
    if (state.arenaTickets === undefined) state.arenaTickets = 5;

    const cp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const opponents = typeof ARENA_OPPONENTS !== 'undefined' ? ARENA_OPPONENTS : [];
    const shopItems = typeof ARENA_SHOP_ITEMS !== 'undefined' ? ARENA_SHOP_ITEMS : [];

    content.innerHTML = `
        <div class="space-y-4">
            <!-- HEADER BẢNG XẾP HẠNG & CHỈ SỐ BẢN TÔN -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/30 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 class="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
                        <i class="fa-solid fa-trophy text-amber-400"></i> Đấu Pháp Đài • Phong Thần Bảng
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">Tỉ thí đạo pháp cùng chư vị cường giả thiên hạ, đoạt danh vọng và Tiên Tinh.</p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <div class="text-right">
                        <span class="text-[10px] text-slate-400 block font-mono">Bản Tôn Xếp Hạng:</span>
                        <b class="text-sm font-bold text-amber-400 font-mono">Hạng #${state.arenaRank}</b>
                    </div>
                    <div class="text-right border-l border-slate-800 pl-3">
                        <span class="text-[10px] text-slate-400 block font-mono">Điểm Vinh Dự:</span>
                        <b class="text-sm font-bold text-purple-300 font-mono">${(state.arenaHonor || 0).toLocaleString('vi-VN')}</b>
                    </div>
                    <div class="text-right border-l border-slate-800 pl-3">
                        <span class="text-[10px] text-slate-400 block font-mono">Vé Khiêu Chiến:</span>
                        <b class="text-sm font-bold text-emerald-400 font-mono">${state.arenaTickets} / 5</b>
                    </div>
                    <button type="button" onclick="buyArenaTickets()" class="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition cursor-pointer" title="Mua 5 vé với 500 Linh Thạch">
                        <i class="fa-solid fa-plus"></i> Mua Vé
                    </button>
                </div>
            </div>

            <!-- SUBTABS: BẢNG XẾP HẠNG VS TIỆM VINH DỰ -->
            <div class="flex gap-2 border-b border-slate-800 pb-2">
                <button type="button" onclick="switchArenaSubTab('rank')" class="px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentArenaTab === 'rank' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}">
                    <i class="fa-solid fa-swords mr-1"></i> Phong Thần Bảng (${opponents.length} Cường Giả)
                </button>
                <button type="button" onclick="switchArenaSubTab('shop')" class="px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${currentArenaTab === 'shop' ? 'bg-purple-950 text-purple-300 border border-purple-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}">
                    <i class="fa-solid fa-store mr-1"></i> Vinh Dự Các (${shopItems.length} Kỳ Trân)
                </button>
            </div>

            ${currentArenaTab === 'rank' ? `
                <!-- TAB RANK: DANH SÁCH ĐỐI THỦ -->
                <div class="space-y-2.5">
                    ${opponents.map(opp => {
                        const isHigherRank = opp.rank < state.arenaRank;
                        const rankBadgeClass = opp.rank === 1 ? 'arena-rank-badge--1' : (opp.rank === 2 ? 'arena-rank-badge--2' : (opp.rank === 3 ? 'arena-rank-badge--3' : 'arena-rank-badge--other'));

                        return `
                            <article class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div class="flex items-center gap-3.5 w-full sm:w-auto">
                                    <div class="arena-rank-badge ${rankBadgeClass}">
                                        ${opp.rank}
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <b class="text-slate-100 text-sm font-serif">${opp.name}</b>
                                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">${opp.realm}</span>
                                        </div>
                                        <div class="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                            <span>Lực Chiến: <b class="text-amber-400">${(opp.cp || 0).toLocaleString('vi-VN')}</b></span>
                                            <span>• Thưởng: <b class="text-purple-300">+${opp.rewardHonor} Vinh Dự</b></span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button type="button" onclick="challengeArenaOpponent('${opp.id}')" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                        <i class="fa-solid fa-swords"></i> Khiêu Chiến
                                    </button>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
            ` : `
                <!-- TAB SHOP: CỬA HÀNG VINH DỰ -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    ${shopItems.map(item => {
                        const canAfford = (state.arenaHonor || 0) >= item.cost;
                        return `
                            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
                                <div class="space-y-1.5">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i class="fa-solid ${item.icon || 'fa-gem'} text-purple-400 text-lg"></i>
                                            <b class="text-slate-200 text-xs">${item.name}</b>
                                        </div>
                                    </div>
                                    <p class="text-[11px] text-slate-400 leading-relaxed">${item.desc}</p>
                                </div>
                                <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                                    <span class="text-xs font-bold text-purple-300 font-mono">${item.cost} Điểm</span>
                                    <button type="button" onclick="buyArenaShopItem('${item.id}')" class="px-3 py-1.5 rounded-lg ${canAfford ? 'bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40' : 'bg-slate-900 text-slate-600 border border-slate-800'} text-xs font-bold transition cursor-pointer">
                                        Đổi Vật Phẩm
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}

function buyArenaTickets() {
    if (state.stones < 500) {
        addLog('Không đủ Linh Thạch để mua thêm vé khiêu chiến (Cần 500 LT).', 'text-rose-400');
        return;
    }
    state.stones -= 500;
    state.arenaTickets = (state.arenaTickets || 0) + 5;
    if (typeof playSound === 'function') playSound('ding');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+5 Vé Khiêu Chiến!', 'text-amber-300');
    addLog('🎟️ Đã mua 5 vé khiêu chiến Đấu Pháp Đài!', 'text-amber-300');
    updateHUD();
    saveGameState();
    renderHubModal('world', 'arena');
}
window.buyArenaTickets = buyArenaTickets;

function refreshArenaUI() {
    const pageContent = document.getElementById('world-arena-page-content');
    if (pageContent) {
        renderWorldArenaHub(pageContent);
    }
    const hubContent = document.getElementById('hub-modal-content');
    if (hubContent && document.getElementById('hub-modal')?.classList.contains('active')) {
        renderWorldArenaHub(hubContent);
    }
}

function challengeArenaOpponent(oppId) {
    if ((state.arenaTickets || 0) <= 0) {
        addLog('Đã hết vé khiêu chiến! Hãy dùng Linh Thạch mua thêm để tiếp tục tranh đoạt thứ hạng.', 'text-rose-400');
        return;
    }

    const opponents = typeof ARENA_OPPONENTS !== 'undefined' ? ARENA_OPPONENTS : [];
    const opp = opponents.find(o => o.id === oppId);
    if (!opp) return;

    state.arenaTickets -= 1;
    const playerCp = typeof getCombatPower === 'function' ? getCombatPower() : 1000;
    const oppCp = opp.cp || 5000;

    const winRatio = playerCp / (playerCp + oppCp);
    const rng = Math.random();
    const isWin = rng < (winRatio * 1.15);

    if (typeof window.triggerCameraTrauma === 'function') {
        window.triggerCameraTrauma(0.4, 'page-world-arena');
    }

    if (isWin) {
        if (window.soundSystem?.play) window.soundSystem.play('victory');
        else if (typeof playSound === 'function') playSound('victory');
        const tookRank = opp.rank < state.arenaRank;
        if (tookRank) {
            state.arenaRank = opp.rank;
        }
        state.arenaHonor = (state.arenaHonor || 0) + opp.rewardHonor;
        state.stones = (state.stones || 0) + (opp.rewardStones || 1000);

        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Chiến Thắng! +${opp.rewardHonor} Vinh Dự`, 'text-gold-300 font-bold');
        addLog(`⚔️ Đấu Pháp Đại Thắng! Ngươi đã đánh bại [${opp.name}], ${tookRank ? `đoạt lấy Hạng #${opp.rank} trên Phong Thần Bảng!` : 'củng cố uy danh thiên hạ!'} Nhận +${opp.rewardHonor} Điểm Vinh Dự, +${(opp.rewardStones || 1000).toLocaleString('vi-VN')} LT.`, 'text-gold-300 font-bold');
    } else {
        if (window.soundSystem?.play) window.soundSystem.play('danger');
        else if (typeof playSound === 'function') playSound('danger');
        state.arenaHonor = (state.arenaHonor || 0) + 5;
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, 'Chiến Bại! +5 Vinh Dự', 'text-rose-400 font-bold');
        addLog(`⚔️ Thất bại trước kiếm khí áp đảo của [${opp.name}]. Thu hoạch kinh nghiệm thực chiến, nhận +5 Điểm Vinh Dự khích lệ.`, 'text-rose-400');
    }

    updateHUD();
    saveGameState();
    refreshArenaUI();
}
window.challengeArenaOpponent = challengeArenaOpponent;

function buyArenaShopItem(itemId) {
    const shopItems = typeof ARENA_SHOP_ITEMS !== 'undefined' ? ARENA_SHOP_ITEMS : [];
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    if ((state.arenaHonor || 0) < item.cost) {
        addLog(`Không đủ Điểm Vinh Dự (Cần ${item.cost} Điểm). Hãy khiêu chiến đối thủ trên Phong Thần Bảng!`, 'text-rose-400');
        return;
    }

    state.arenaHonor -= item.cost;
    if (item.isCurrency === 'jade') {
        if (state.jade !== undefined) state.jade += item.count;
        else if (state.immortalJade !== undefined) state.immortalJade += item.count;
        else state.jade = item.count;
        addLog(`🎁 Đã đổi thành công [${item.name}], nhận +${item.count} Tiên Ngọc!`, 'text-emerald-300 font-bold');
    } else if (item.isCurrency === 'stones') {
        state.stones += item.count;
        addLog(`🎁 Đã đổi thành công [${item.name}], nhận +${item.count.toLocaleString('vi-VN')} Linh Thạch!`, 'text-amber-300 font-bold');
    } else {
        if (!Array.isArray(state.inventory)) state.inventory = [];
        const existing = state.inventory.find(i => i.id === item.id);
        if (existing) {
            existing.count += item.count || 1;
        } else {
            state.inventory.push({
                id: item.id,
                name: item.name,
                type: 'Đan Dược',
                count: item.count || 1,
                desc: item.desc,
                rarity: item.rarity || 4,
                icon: item.icon || 'fa-pills'
            });
        }
        addLog(`🎁 Đã đổi thành công [${item.name}] x${item.count || 1} đưa vào Túi Đồ!`, 'text-purple-300 font-bold');
    }

    if (window.soundSystem?.play) window.soundSystem.play('bell');
    else if (typeof playSound === 'function') playSound('bell');

    updateHUD();
    saveGameState();
    refreshArenaUI();
}
window.buyArenaShopItem = buyArenaShopItem;

let auctionCountdownInterval = null;

function refreshAuctionUI() {
    const pageContent = document.getElementById('world-auction-page-content');
    if (pageContent) {
        renderWorldAuctionHub(pageContent);
    }
    const hubContent = document.getElementById('hub-modal-content');
    if (hubContent && document.getElementById('hub-modal')?.classList.contains('active')) {
        renderWorldAuctionHub(hubContent);
    }
}

function renderWorldAuctionHub(content) {
    if (!content) return;
    const items = typeof AUCTION_ITEMS !== 'undefined' ? AUCTION_ITEMS : [];
    if (items.length === 0) {
        content.innerHTML = '<p class="text-slate-400 p-6 text-center">Phiên đấu giá đang chuẩn bị kỳ trân dị bảo...</p>';
        return;
    }

    if (!state.auctionData) {
        state.auctionData = {
            currentLotIndex: 0,
            currentBid: items[0].startingBid,
            highestBidder: 'Thanh Vân Chưởng Môn',
            isPlayerHighest: false,
            timeLeft: 15,
            hammerCount: 0,
            wonLots: [],
            bidHistory: [
                { bidder: 'Thanh Vân Chưởng Môn', amount: items[0].startingBid, time: 'Vừa xong', isPlayer: false }
            ],
            activeSpeech: {
                speaker: 'Đấu Giá Sư • Nhược Lan',
                text: 'Kính chào chư vị đạo hữu! Lô bảo vật đầu tiên chính thức lên đài!',
                avatar: 'fa-user-tie'
            }
        };
    }

    if (!Array.isArray(state.auctionData.bidHistory)) {
        state.auctionData.bidHistory = [
            { bidder: state.auctionData.highestBidder || 'Thanh Vân Chưởng Môn', amount: state.auctionData.currentBid || items[0].startingBid, time: 'Vừa xong', isPlayer: !!state.auctionData.isPlayerHighest }
        ];
    }

    const lotIndex = (state.auctionData.currentLotIndex || 0) % items.length;
    const currentLot = items[lotIndex];
    const curBid = Number(state.auctionData.currentBid) || currentLot.startingBid;
    const minStep = currentLot.minStep || 2000;
    const buyoutPrice = currentLot.buyoutPrice || (currentLot.startingBid * 5);
    const hammer = Number(state.auctionData.hammerCount) || 0;
    const timeLeft = typeof state.auctionData.timeLeft === 'number' ? state.auctionData.timeLeft : 15;
    const timerPercent = Math.max(0, Math.min(100, (timeLeft / 15) * 100));

    let hammerText = 'Đang tiếp nhận ra giá...';
    let hammerColor = 'text-slate-400';
    let hammerBadge = 'bg-slate-900 border-slate-700 text-slate-300';
    if (hammer === 1) {
        hammerText = 'Lần thứ nhất! Có ai ra giá cao hơn không?!';
        hammerColor = 'text-amber-400 font-bold';
        hammerBadge = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    } else if (hammer === 2) {
        hammerText = 'Lần thứ hai! Búa ngọc sắp sửa gõ xuống!';
        hammerColor = 'text-rose-400 font-bold animate-pulse';
        hammerBadge = 'bg-rose-950/80 border-rose-500/50 text-rose-300';
    } else if (hammer >= 3) {
        hammerText = 'THÀNH GIAO! BÚA NGỌC ĐÃ ĐỊNH ĐOẠT!';
        hammerColor = 'text-emerald-400 font-extrabold';
        hammerBadge = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    }

    const activeSpeech = state.auctionData.activeSpeech || {
        speaker: 'Đấu Giá Sư • Nhược Lan',
        text: 'Chư vị đạo hữu, bảo vật xuất thế, hữu duyên giả đắc chi!',
        avatar: 'fa-user-tie'
    };

    content.innerHTML = `
        <div class="space-y-4">
            <!-- 1. HEADER ĐẤU GIÁ HỘI TIÊN GIA -->
            <header class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 text-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                        <i class="fa-solid fa-gavel auction-hammer-pulse"></i>
                    </span>
                    <div>
                        <h3 class="text-base font-bold text-purple-300 font-serif flex items-center gap-2">
                            Đấu Giá Hội Tiên Gia • Thiên Tự Hiệu
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/40">Kỳ ${lotIndex + 1} / ${items.length}</span>
                        </h3>
                        <p class="text-xs text-slate-400 mt-0.5">Kỳ trân dị bảo ngàn năm xuất thế. Tranh đoạt bằng tài lực hùng hậu!</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div class="text-right">
                        <span class="text-[10px] text-purple-400 font-mono block">Ngân Khố Bản Tôn</span>
                        <span class="text-xs font-mono text-amber-300 font-bold">${(state.stones || 0).toLocaleString('vi-VN')} LT</span>
                    </div>
                </div>
            </header>

            <!-- 2. DIALOGUE SPEECH BUBBLE (NPC / ĐẤU GIÁ SƯ) -->
            <div class="auction-dialogue-bubble p-3 rounded-2xl border border-amber-500/30 flex items-start gap-3 text-xs">
                <div class="w-8 h-8 rounded-full bg-slate-900 border border-amber-400/50 flex items-center justify-center text-amber-400 text-sm shrink-0">
                    <i class="fa-solid ${activeSpeech.avatar || 'fa-user-tie'}"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-amber-300 flex items-center gap-1.5">
                        <span>${activeSpeech.speaker}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 font-normal">Hội Trường</span>
                    </div>
                    <p class="text-slate-200 mt-0.5 italic leading-relaxed">"${activeSpeech.text}"</p>
                </div>
            </div>

            <!-- 3. SÂN KHẤU TRUNG TÂM VẬT PHẨM ĐẤU GIÁ -->
            <div class="auction-stage-card space-y-4">
                <!-- THANH ĐẾM NGƯỢC THỜI GIAN -->
                <div class="space-y-1">
                    <div class="flex justify-between items-center text-[10px] font-mono">
                        <span class="text-slate-400 flex items-center gap-1">
                            <i class="fa-regular fa-clock text-purple-400"></i> Thời Gian Còn Lại
                        </span>
                        <span class="${timeLeft <= 5 ? 'text-rose-400 font-bold animate-pulse' : 'text-amber-400 font-bold'}">${timeLeft}s</span>
                    </div>
                    <div class="auction-timer-container">
                        <div id="auction-timer-fill" class="auction-timer-fill" style="width: ${timerPercent}%;"></div>
                    </div>
                </div>

                <!-- KHỐI TRƯNG BÀY VẬT PHẨM VÀ BÚA ĐẤU GIÁ -->
                <div class="flex flex-col md:flex-row items-center justify-between gap-5">
                    <!-- Bệ Đá Đài Trưng Bày -->
                    <div class="flex items-center gap-4 flex-1">
                        <div class="auction-pedestal-light shrink-0">
                            <i class="fa-solid ${currentLot.icon || 'fa-gem'} text-3xl text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]"></i>
                        </div>
                        <div class="space-y-1 text-center md:text-left">
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                <h4 class="text-base sm:text-lg font-bold text-slate-100 font-serif">${currentLot.name}</h4>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">${currentLot.type}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">Phẩm Cấp ${currentLot.rarity}★</span>
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed max-w-xl">${currentLot.desc}</p>
                        </div>
                    </div>

                    <!-- Hộp Gõ Búa Cổ Phong (Gavel Stage) -->
                    <div id="auction-gavel-box" class="gavel-box shrink-0" title="Đài Gõ Búa Đấu Giá">
                        <div class="gavel-hammer text-3xl text-amber-400">
                            <i class="fa-solid fa-gavel"></i>
                        </div>
                        <div class="gavel-shockwave"></div>
                        <div class="absolute bottom-1 w-10 h-2 bg-stone-800 rounded border border-amber-500/30"></div>
                    </div>
                </div>

                <!-- BẢNG BÁO GIÁ HIỆN TẠI & TRẠNG THÁI BÚA ĐẤU GIÁ -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-purple-500/20 font-mono text-center">
                    <div>
                        <span class="text-[10px] text-slate-400 block">Mức Giá Hiện Tại</span>
                        <b class="text-base text-amber-400">${curBid.toLocaleString('vi-VN')} LT</b>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block">Dẫn Đầu Tranh Đoạt</span>
                        <b class="text-sm ${state.auctionData.isPlayerHighest ? 'text-emerald-400' : 'text-purple-300'}">
                            ${state.auctionData.isPlayerHighest ? '🌟 BẢN TÔN' : state.auctionData.highestBidder}
                        </b>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block">Tình Trạng Gõ Búa</span>
                        <span class="text-xs px-2 py-0.5 rounded-full inline-block border ${hammerBadge}">${hammerText}</span>
                    </div>
                </div>

                <!-- LỊCH SỬ RA GIÁ SÔI ĐỘNG (LIVE BID FEED) -->
                <div class="bg-slate-950/50 p-3 rounded-xl border border-stone-800 space-y-2">
                    <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-stone-800/80 pb-1.5">
                        <span class="flex items-center gap-1.5">
                            <i class="fa-solid fa-fire text-rose-500"></i> Diễn Biến Tranh Đoạt (Gần Nhất)
                        </span>
                        <span class="text-[10px] font-normal text-stone-500">Cập nhật thời gian thực</span>
                    </div>
                    <div class="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        ${state.auctionData.bidHistory.slice(0, 4).map((h, i) => `
                            <div class="flex items-center justify-between text-xs p-1.5 rounded-lg ${h.isPlayer ? 'bg-amber-950/40 border border-amber-500/30' : 'bg-slate-900/60 border border-stone-800'}">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full ${h.isPlayer ? 'bg-amber-500 text-black' : 'bg-purple-900 text-purple-300'} flex items-center justify-center text-[10px] font-bold">
                                        ${h.isPlayer ? 'Ta' : (i + 1)}
                                    </span>
                                    <span class="font-bold ${h.isPlayer ? 'text-amber-300' : 'text-slate-300'} truncate">${h.bidder}</span>
                                </div>
                                <div class="flex items-center gap-3 font-mono">
                                    <span class="text-[10px] text-stone-500">${h.time}</span>
                                    <b class="${h.isPlayer ? 'text-amber-400' : 'text-emerald-400'}">+${h.amount.toLocaleString('vi-VN')} LT</b>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- CÁC NÚT THAO TÁC ĐẤU GIÁ -->
                <div class="flex flex-wrap gap-2.5 justify-center sm:justify-end pt-1">
                    ${hammer < 3 ? `
                        <button type="button" onclick="bidAuction(${minStep})" class="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-400/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md">
                            <i class="fa-solid fa-hand-holding-dollar"></i> Ra Giá (+${minStep.toLocaleString('vi-VN')} LT)
                        </button>
                        <button type="button" onclick="bidAuction(${minStep * 3})" class="px-4 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-400/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md">
                            <i class="fa-solid fa-coins"></i> Ra Giá Đậm (+${(minStep * 3).toLocaleString('vi-VN')} LT)
                        </button>
                        <button type="button" onclick="buyoutAuction()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-amber-700 hover:from-rose-800 hover:to-amber-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                            <i class="fa-solid fa-bolt"></i> Một Giá Đoạt Bảo (${buyoutPrice.toLocaleString('vi-VN')} LT)
                        </button>
                        <button type="button" onclick="advanceAuctionStep()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5" title="Thúc đẩy đấu giá viên gõ búa">
                            <i class="fa-solid fa-gavel"></i> Gõ Búa
                        </button>
                    ` : `
                        <button type="button" onclick="claimAuctionLot()" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                            <i class="fa-solid fa-gift"></i> ${state.auctionData.isPlayerHighest ? 'Thu Nhận Chí Bảo & Chuyển Phiên Kế Tiếp' : 'Chuyển Sang Lô Đấu Giá Tiếp Theo'}
                        </button>
                    `}
                </div>
            </div>

            <!-- 4. DANH SÁCH CÁC MÓN TRONG ĐỢT ĐẤU GIÁ NÀY -->
            <div>
                <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <i class="fa-solid fa-scroll text-purple-400"></i> Các Lô Đấu Giá Khác
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                    ${items.map((it, idx) => {
                        const isCur = idx === lotIndex;
                        const isWon = state.auctionData.wonLots?.includes(it.id);
                        return `
                            <div class="p-2.5 rounded-xl bg-slate-950/60 border ${isCur ? 'border-purple-400 bg-purple-950/30 ring-1 ring-purple-400/40' : 'border-slate-800'} text-xs space-y-1">
                                <div class="flex justify-between items-center">
                                    <b class="${isCur ? 'text-purple-300' : 'text-slate-200'} truncate">${it.name}</b>
                                    ${isWon ? '<span class="text-[9px] text-emerald-400 font-mono">[Đã Sở Hữu]</span>' : ''}
                                </div>
                                <div class="text-[10px] text-slate-400 font-mono">Giá khởi điểm: ${it.startingBid.toLocaleString('vi-VN')} LT</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // Khởi tạo vòng đếm nhịp tự động nếu người chơi đang ở màn hình Đấu Giá
    if (!auctionCountdownInterval) {
        auctionCountdownInterval = setInterval(() => {
            const auctionPage = document.getElementById('page-world-auction');
            const isVisible = auctionPage && !auctionPage.classList.contains('hidden') && auctionPage.offsetParent !== null;
            if (!isVisible) {
                clearInterval(auctionCountdownInterval);
                auctionCountdownInterval = null;
                return;
            }

            if (state.auctionData && state.auctionData.hammerCount < 3) {
                state.auctionData.timeLeft = (state.auctionData.timeLeft || 15) - 1;
                if (state.auctionData.timeLeft <= 0) {
                    state.auctionData.timeLeft = 15;
                    advanceAuctionStep();
                } else {
                    const timerFill = document.getElementById('auction-timer-fill');
                    if (timerFill) {
                        const pct = Math.max(0, Math.min(100, (state.auctionData.timeLeft / 15) * 100));
                        timerFill.style.width = `${pct}%`;
                    }
                }
            }
        }, 1000);
    }
}

function bidAuction(amount) {
    const items = typeof AUCTION_ITEMS !== 'undefined' ? AUCTION_ITEMS : [];
    if (!state.auctionData || items.length === 0) return;

    const lotIndex = (state.auctionData.currentLotIndex || 0) % items.length;
    const currentLot = items[lotIndex];
    const newBid = (Number(state.auctionData.currentBid) || currentLot.startingBid) + amount;

    if ((state.stones || 0) < newBid) {
        if (typeof addLog === 'function') addLog(`Không đủ Linh Thạch để ra giá ${newBid.toLocaleString('vi-VN')} LT!`, 'text-rose-400');
        return;
    }

    state.auctionData.currentBid = newBid;
    state.auctionData.highestBidder = 'Bản Tôn';
    state.auctionData.isPlayerHighest = true;
    state.auctionData.hammerCount = 0;
    state.auctionData.timeLeft = 15;

    // Ghi nhận lịch sử ra giá
    if (!Array.isArray(state.auctionData.bidHistory)) state.auctionData.bidHistory = [];
    state.auctionData.bidHistory.unshift({
        bidder: 'Bản Tôn',
        amount: newBid,
        time: 'Vừa xong',
        isPlayer: true
    });
    if (state.auctionData.bidHistory.length > 8) state.auctionData.bidHistory.pop();

    state.auctionData.activeSpeech = {
        speaker: 'Bản Tôn',
        text: `Ta ra giá ${newBid.toLocaleString('vi-VN')} Linh Thạch! Kẻ nào dám tranh?`,
        avatar: 'fa-crown'
    };

    if (window.soundSystem?.play) window.soundSystem.play('auction_bid');
    else if (typeof playSound === 'function') playSound('whoosh');

    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Ra Giá: ${newBid.toLocaleString('vi-VN')} LT!`, 'text-amber-300 font-bold');
    }
    if (typeof addLog === 'function') {
        addLog(`🔨 Bản Tôn đã dõng dạc ra giá: ${newBid.toLocaleString('vi-VN')} Linh Thạch cho [${currentLot.name}]!`, 'text-amber-300');
    }

    // NPC Phản Ứng và Ra Giá Cạnh Tranh (Rival NPC Counter-Bid)
    const aiBidders = currentLot.aiBidders || [];
    const eligibleBidders = aiBidders.filter(b => b.maxBid > newBid);
    if (eligibleBidders.length > 0 && Math.random() < 0.75) {
        const rival = eligibleBidders[Math.floor(Math.random() * eligibleBidders.length)];
        const counterBid = newBid + (currentLot.minStep || 2000);
        if (counterBid <= rival.maxBid) {
            setTimeout(() => {
                if (state.auctionData && state.auctionData.currentLotIndex === lotIndex && state.auctionData.hammerCount < 3) {
                    state.auctionData.currentBid = counterBid;
                    state.auctionData.highestBidder = rival.name;
                    state.auctionData.isPlayerHighest = false;
                    state.auctionData.hammerCount = 0;
                    state.auctionData.timeLeft = 15;

                    const rivalShouts = [
                        'Hừ! Bảo vật này lão phu tình thế bắt buộc, kẻ nào dám tranh?!',
                        'Đạo hữu chớ khinh người quá đáng, ta thêm một bước giá!',
                        'Bổn tọa tích góp ngàn năm nay, há lại chịu thua sao?!',
                        'Một món chí bảo bực này há để rơi vào tay kẻ vô danh?!'
                    ];
                    const shout = rivalShouts[Math.floor(Math.random() * rivalShouts.length)];

                    state.auctionData.activeSpeech = {
                        speaker: rival.name,
                        text: shout,
                        avatar: 'fa-user-ninja'
                    };

                    state.auctionData.bidHistory.unshift({
                        bidder: rival.name,
                        amount: counterBid,
                        time: 'Vừa xong',
                        isPlayer: false
                    });
                    if (state.auctionData.bidHistory.length > 8) state.auctionData.bidHistory.pop();

                    if (typeof addLog === 'function') {
                        addLog(`⚡ [${rival.name}] hừ lạnh vung tay ra giá đè bẹp: ${counterBid.toLocaleString('vi-VN')} Linh Thạch!`, 'text-purple-300');
                    }
                    if (window.soundSystem?.play) window.soundSystem.play('auction_bid');
                    else if (typeof playSound === 'function') playSound('bell');

                    refreshAuctionUI();
                }
            }, 1200);
        }
    }

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
    refreshAuctionUI();
}
window.bidAuction = bidAuction;

function advanceAuctionStep() {
    if (!state.auctionData) return;
    state.auctionData.hammerCount = (state.auctionData.hammerCount || 0) + 1;
    state.auctionData.timeLeft = 15;

    // Kích hoạt animation gõ búa & rung màn hình
    const gavelBox = document.getElementById('auction-gavel-box');
    if (gavelBox) {
        gavelBox.classList.remove('gavel-striking');
        void gavelBox.offsetWidth; // trigger reflow
        gavelBox.classList.add('gavel-striking');
        setTimeout(() => gavelBox.classList.remove('gavel-striking'), 450);
    }

    if (typeof window.triggerCameraTrauma === 'function') {
        window.triggerCameraTrauma(0.35, 'page-world-auction');
    }

    if (window.soundSystem?.play) window.soundSystem.play('auction_gavel');
    else if (typeof playSound === 'function') playSound('ding');

    if (state.auctionData.hammerCount >= 3) {
        if (typeof addLog === 'function') {
            addLog(`🔨 BÚA NGỌC GÕ XUỐNG! [${state.auctionData.highestBidder}] đã đoạt được món chí bảo này!`, 'text-gold-300 font-bold');
        }
        state.auctionData.activeSpeech = {
            speaker: 'Đấu Giá Sư • Nhược Lan',
            text: `Thành giao! Xin chúc mừng [${state.auctionData.highestBidder}] đã đoạt được báu vật!`,
            avatar: 'fa-gavel'
        };
    } else {
        const ord = state.auctionData.hammerCount === 1 ? 'nhất' : 'nhị';
        if (typeof addLog === 'function') {
            addLog(`🔨 Đấu giá viên giơ búa: Lần thứ ${state.auctionData.hammerCount}!`, 'text-amber-300');
        }
        state.auctionData.activeSpeech = {
            speaker: 'Đấu Giá Sư • Nhược Lan',
            text: `Lần thứ ${ord}! Mức giá hiện tại là ${(state.auctionData.currentBid || 0).toLocaleString('vi-VN')} Linh Thạch!`,
            avatar: 'fa-gavel'
        };
    }

    refreshAuctionUI();
}
window.advanceAuctionStep = advanceAuctionStep;

function buyoutAuction() {
    const items = typeof AUCTION_ITEMS !== 'undefined' ? AUCTION_ITEMS : [];
    if (!state.auctionData || items.length === 0) return;

    const lotIndex = (state.auctionData.currentLotIndex || 0) % items.length;
    const currentLot = items[lotIndex];
    const buyoutPrice = currentLot.buyoutPrice || 100000;

    if ((state.stones || 0) < buyoutPrice) {
        if (typeof addLog === 'function') {
            addLog(`Không đủ Linh Thạch để một giá mua đứt (Cần ${buyoutPrice.toLocaleString('vi-VN')} LT).`, 'text-rose-400');
        }
        return;
    }

    state.stones -= buyoutPrice;
    state.auctionData.currentBid = buyoutPrice;
    state.auctionData.highestBidder = 'Bản Tôn';
    state.auctionData.isPlayerHighest = true;
    state.auctionData.hammerCount = 3;

    if (window.soundSystem?.play) {
        window.soundSystem.play('auction_gavel');
        setTimeout(() => window.soundSystem.play('victory'), 200);
    } else if (typeof playSound === 'function') {
        playSound('victory');
    }

    if (typeof window.triggerCameraTrauma === 'function') {
        window.triggerCameraTrauma(0.5, 'page-world-auction');
    }

    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, 'MUA ĐỨT THÀNH CÔNG!', 'text-gold-300 font-bold');
    }
    if (typeof addLog === 'function') {
        addLog(`👑 Bản Tôn khí phách ngút trời, vung ${buyoutPrice.toLocaleString('vi-VN')} Linh Thạch đoạt tuyệt đối [${currentLot.name}]! Toàn hội trường kinh ngạc!`, 'text-gold-300 font-bold');
    }

    claimAuctionLot();
}
window.buyoutAuction = buyoutAuction;

function claimAuctionLot() {
    const items = typeof AUCTION_ITEMS !== 'undefined' ? AUCTION_ITEMS : [];
    if (!state.auctionData || items.length === 0) return;

    const lotIndex = (state.auctionData.currentLotIndex || 0) % items.length;
    const currentLot = items[lotIndex];

    if (state.auctionData.isPlayerHighest) {
        if (state.auctionData.hammerCount >= 3 && state.auctionData.currentBid < (currentLot.buyoutPrice || 100000)) {
            state.stones = Math.max(0, (state.stones || 0) - state.auctionData.currentBid);
        }

        const r = currentLot.rewardData || {};
        if (currentLot.rewardType === 'stat_and_item') {
            if (r.hpBonus) state.maxHp = (Number(state.maxHp) || 1000) + r.hpBonus;
            if (r.atkBonus) state.atk = (Number(state.atk) || 50) + r.atkBonus;
            if (r.defBonus) state.def = (Number(state.def) || 20) + r.defBonus;
        } else if (currentLot.rewardType === 'currency') {
            if (r.jade) {
                if (state.jade !== undefined) state.jade += r.jade;
                else if (state.immortalJade !== undefined) state.immortalJade += r.jade;
                else state.jade = r.jade;
            }
            if (r.exp) state.exp = (Number(state.exp) || 0) + r.exp;
            if (r.stones) state.stones = (Number(state.stones) || 0) + r.stones;
        }

        if (!Array.isArray(state.auctionData.wonLots)) state.auctionData.wonLots = [];
        state.auctionData.wonLots.push(currentLot.id);

        if (window.soundSystem?.play) window.soundSystem.play('victory');
        else if (typeof playSound === 'function') playSound('bell');

        if (typeof addLog === 'function') {
            addLog(`🎉 Thu hoạch thành công chí bảo [${currentLot.name}]! Thuộc tính tăng tiến vượt bậc!`, 'text-gold-300 font-bold');
        }
    } else {
        if (typeof addLog === 'function') {
            addLog(`Lô đấu giá [${currentLot.name}] đã thuộc về [${state.auctionData.highestBidder}]. Chuyển sang phiên kế tiếp.`, 'text-slate-400');
        }
    }

    state.auctionData.currentLotIndex = (lotIndex + 1) % items.length;
    const nextLot = items[state.auctionData.currentLotIndex];
    state.auctionData.currentBid = nextLot.startingBid;
    state.auctionData.highestBidder = nextLot.aiBidders?.[0]?.name || 'Tán Tu Bí Ẩn';
    state.auctionData.isPlayerHighest = false;
    state.auctionData.hammerCount = 0;
    state.auctionData.timeLeft = 15;
    state.auctionData.activeSpeech = {
        speaker: 'Đấu Giá Sư • Nhược Lan',
        text: `Phiên đấu giá tiếp theo: [${nextLot.name}], khởi điểm ${nextLot.startingBid.toLocaleString('vi-VN')} Linh Thạch!`,
        avatar: 'fa-gavel'
    };
    state.auctionData.bidHistory = [
        { bidder: state.auctionData.highestBidder, amount: nextLot.startingBid, time: 'Vừa xong', isPlayer: false }
    ];

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();
    refreshAuctionUI();
}
window.claimAuctionLot = claimAuctionLot;

function renderWorldTribulationHub(content) {
    const currentRealm = REALMS[state.realmIndex];
    content.innerHTML = `
        <div class="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 space-y-4 text-center">
            <h3 class="text-lg font-bold text-cyan-300 font-serif flex items-center justify-center gap-2">
                <i class="fa-solid fa-cloud-bolt text-cyan-400 animate-pulse"></i> Thiên Kiếp Đài • Lôi Kiếp Nghênh Phong
            </h3>
            <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Nơi thiên địa quy tụ uy áp lôi phạt. Tu vi đã đạt cảnh giới <b class="text-gold-300">${currentRealm?.name}</b>. Khi bình cảnh viên mãn, lôi kiếp sẽ giáng xuống phán định sinh tử.
            </p>
            <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 max-w-sm mx-auto space-y-2 text-xs">
                <div class="flex justify-between"><span>Xác suất thành công:</span><b class="text-emerald-400">85%</b></div>
                <div class="flex justify-between"><span>Hộ Tâm Đan bảo trợ:</span><b class="text-amber-300">${breakthroughBonusChance > 0 ? `+${breakthroughBonusChance}%` : 'Chưa dùng'}</b></div>
                <div class="flex justify-between"><span>Uy áp Thiên Đạo:</span><b class="text-rose-400">${isHeavenlyRejected() ? 'Áp Chế Cực Độ' : 'Bình Thường'}</b></div>
            </div>
            <button type="button" onclick="closeHubModal(); handleMainCultivationAction(event)" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer">
                ⚡ Khởi Động Đột Phá Lôi Kiếp
            </button>
        </div>
    `;
}


function upgradeArtifact(type) {
    if (!isArtifactUnlocked(state)) {
        if (window.soundSystem?.play) window.soundSystem.play('danger');
        else if (typeof playSound === 'function') playSound('danger');
        addLog('⚠️ Cảnh giới chưa đạt Đại Thừa Kỳ, đan điền chưa thể dung nạp uy lực của Bản Mệnh Pháp Bảo!', 'text-rose-400');
        return;
    }
    if (state.stones < 5000) {
        addLog('Không đủ Linh Thạch để ôn dưỡng Pháp Bảo (Cần 5,000 LT).', 'text-rose-400');
        return;
    }
    state.stones -= 5000;
    
    const prevCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    if (typeof window.recalculatePlayerStats === 'function') window.recalculatePlayerStats();
    const newCp = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const cpGain = Math.max(1200, newCp - prevCp);

    if (window.soundSystem?.play) window.soundSystem.play('forge_success');
    else if (typeof playSound === 'function') playSound('bell');

    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Pháp Bảo Thăng Bậc! (+${cpGain.toLocaleString('vi-VN')} CP)`, 'text-gold-300 font-bold');
    addLog(`✨ Bản Mệnh Pháp Bảo đã hấp thu linh khí ôn dưỡng, thần uy tăng vọt (+${cpGain.toLocaleString('vi-VN')} Chiến Lực)!`, 'text-gold-300');
    updateHUD();
    saveGameState();
    renderHubModal('character', 'artifact');

    const artPage = document.getElementById('page-artifact');
    if (artPage) {
        artPage.classList.add('artifact-level-flash');
        setTimeout(() => artPage.classList.remove('artifact-level-flash'), 500);
    }
}
window.upgradeArtifact = upgradeArtifact;

function craftTalisman() {
    if (state.stones < 500) {
        addLog('Không đủ Linh Thạch để họa phù (Cần 500 LT).', 'text-rose-400');
        return;
    }
    state.stones -= 500;
    if (typeof playSound === 'function') playSound('ding');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, '+1 Phù Lục Mới!', 'text-teal-300');
    addLog('📜 Họa phù thành công! Đã thu hoạch 1 đạo phù chú bảo mệnh.', 'text-teal-300');
    updateHUD();
    saveGameState();
    renderHubModal('character', 'talisman');
}
window.craftTalisman = craftTalisman;

function useTalisman(type) {
    if (typeof playSound === 'function') playSound('whoosh');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, 'Kích Hoạt Phù Lục!', 'text-amber-300');
    addLog('⚡ Đã kích hoạt uy lực phù lục, thần quang bảo hộ toàn thân!', 'text-amber-300');
    updateHUD();
    saveGameState();
}
window.useTalisman = useTalisman;

// Ghi chú: renderCharacterHub đã được tích hợp toàn diện trong Bố cục 2 Cột (Thánh Địa Bản Thể - Không Gian Lưu Trữ) ở trên.

function renderMenuHub(hub, tab, content) {
    if (hub === 'world') {
        if (tab === 'market') {
            renderWorldMarketHub(content);
            return;
        }
        if (tab === 'dungeon') {
            renderWorldDungeonHub(content);
            return;
        }
        if (tab === 'arena') {
            renderWorldArenaHub(content);
            return;
        }
        if (tab === 'auction') {
            renderWorldAuctionHub(content);
            return;
        }
        if (tab === 'tribulation') {
            renderWorldTribulationHub(content);
            return;
        }
        if (tab === 'sect') {
            closeHubModal();
            if (typeof openSectModal === 'function') openSectModal();
            return;
        }
        if (tab === 'encounter') {
            if (typeof renderWorldExpeditionDashboard === 'function') {
                renderWorldExpeditionDashboard(content);
                return;
            }
        }
    }
    const menus = {
        cave: { array:['Tụ Linh Trận','fa-dharmachakra',"openDrawer('cave')"], farm:['Linh Điền','fa-seedling',"openDrawer('farm')"], alchemy:['Đan Các','fa-fire-burner',"openDrawer('alchemy')"], forge:['Khí Các','fa-hammer',"addLog('Khí Các đã mở.','text-amber-300')"], auto:['Trợ Lý Tự Động','fa-wand-magic-sparkles',"closeHubModal()"] },
        world: { encounter:['Lịch Luyện','fa-scroll','openEncounterModal()'], dungeon:['Bí Cảnh','fa-compass','openCombatModal()'], sect:['Tông Môn','fa-torii-gate',"openDrawer('sect')"], market:['Phường Thị','fa-store',"openDrawer('market')"], arena:['Đấu Pháp Đài','fa-trophy',"addLog('Đấu Pháp Đài đã mở.')"], auction:['Đấu Giá Hội','fa-gavel',"addLog('Đấu Giá Hội đã mở.')"], master:['Chưởng Môn','fa-crown',"openDrawer('sect')"], tribulation:['Thiên Kiếp Đài','fa-cloud-bolt','openBreakthroughModal()'], rift:['Không Gian Liệt Phùng','fa-arrows-left-right-to-line','completeSpatialRift()'] }
    };
    const item = menus[hub]?.[tab];
    if (!item) {
        content.innerHTML = '<p class="text-slate-400">Phân hệ không tồn tại.</p>';
        return;
    }
    const [label, icon, action] = item;
    content.innerHTML = `<div class="hub-menu-grid"><button class="hub-menu-card" onclick="closeHubModal();${action}"><i class="fa-solid ${icon}"></i><b>${label}</b><p class="text-xs text-slate-400 mt-3">Mở phân hệ ${label}.</p></button></div>`;
}
function formatCultivationNumber(value) {
    const number = Math.max(0, Number(value) || 0);
    if (number < 1000) return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(number);
    const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    const [divisor, suffix] = units.find(([unit]) => number >= unit);
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number / divisor)}${suffix}`;
}

function toggleHeavenlySuppressionInfo() {
    const indicator = document.getElementById('heavenly-suppression');
    const button = document.getElementById('heavenly-suppression-toggle');
    if (!indicator || !button) return;
    button.setAttribute('aria-expanded', String(indicator.classList.toggle('is-open')));
}

window.toggleHeavenlySuppressionInfo = toggleHeavenlySuppressionInfo;

let previousCombatPower = null;

function animateCombatPowerCountUp(element, startVal, endVal, durationMs = 600) {
    if (!element) return;
    const start = Math.round(Number(startVal) || 0);
    const end = Math.round(Number(endVal) || 0);
    if (start === end) {
        element.textContent = end.toLocaleString('vi-VN');
        return;
    }

    element.classList.add('cp-countup-glow');

    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    function tickAnimation(nowTime) {
        const elapsed = nowTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Easing: ease-out quadratic
        const ease = 1 - Math.pow(1 - progress, 2);
        const current = Math.round(start + (end - start) * ease);
        element.textContent = current.toLocaleString('vi-VN');

        if (progress < 1) {
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(tickAnimation);
            } else {
                element.textContent = end.toLocaleString('vi-VN');
            }
        } else {
            element.textContent = end.toLocaleString('vi-VN');
            setTimeout(() => {
                element.classList.remove('cp-countup-glow');
            }, 300);
        }
    }

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(tickAnimation);
    } else {
        element.textContent = end.toLocaleString('vi-VN');
    }
}
window.animateCombatPowerCountUp = animateCombatPowerCountUp;

function updateHUD() {
            syncHeavenlyRejection();
            const currentRealm = REALMS[state.realmIndex];
            const percent = Math.min(100, Math.floor((state.exp / currentRealm.maxExp) * 100));
            syncRealmTheme();

            document.getElementById('realm-badge').textContent = currentRealm.name;

            // Đồng bộ Top Bar Avatar Cluster
            const topbarName = document.getElementById('ui-player-name');
            if (topbarName && state.player?.name) topbarName.textContent = state.player.name;
            const topbarRealm = document.getElementById('ui-realm-title');
            if (topbarRealm && currentRealm?.name) topbarRealm.textContent = currentRealm.name;
            const topbarAvatar = document.getElementById('ui-avatar');
            if (topbarAvatar && (state.player?.avatar_url || state.avatar_url)) {
                const avatarUrl = state.player?.avatar_url || state.avatar_url;
                if (topbarAvatar.getAttribute('src') !== avatarUrl) topbarAvatar.src = avatarUrl;
            }

            // Cập nhật trạng thái [Trọng Thương] do Thiên Kiếp đánh bại nếu có
            const heavyInjuryEl = document.getElementById('heavy-injury-status');
            const heavyInjuryTimeEl = document.getElementById('heavy-injury-time');
            if (heavyInjuryEl && heavyInjuryTimeEl) {
                const isInjured = Boolean(state.heavyInjuryUntil && Date.now() < state.heavyInjuryUntil);
                heavyInjuryEl.classList.toggle('hidden', !isInjured);
                if (isInjured) {
                    const remSec = Math.max(0, Math.ceil((state.heavyInjuryUntil - Date.now()) / 1000));
                    const m = Math.floor(remSec / 60);
                    const s = remSec % 60;
                    heavyInjuryTimeEl.textContent = `Trọng Thương (${m}:${s < 10 ? '0' : ''}${s})`;
                }
            }
            const suppressionIndicator = document.getElementById('heavenly-suppression');
            if (suppressionIndicator) {
                const active = isHeavenlyRejected();
                suppressionIndicator.classList.toggle('hidden', !active);
                if (!active) {
                    suppressionIndicator.classList.remove('is-open');
                    document.getElementById('heavenly-suppression-toggle')?.setAttribute('aria-expanded', 'false');
                }
                const message = document.getElementById('heavenly-suppression-message');
                if (message) message.textContent = active ? HEAVENLY_REJECTION_RULES.tooltipMessage : '';
                const leak = document.getElementById('heavenly-suppression-leak');
                if (leak) leak.textContent = active ? `Rò rỉ khí tức khi đột phá: ${Math.round(getHeavenlyLeakChance() * 100)}%.` : '';
            }
            document.getElementById('realm-subtitle').textContent = `"${currentRealm.quote}"`;
            const isAtOrAboveBottleneck = state.exp >= currentRealm.maxExp;
            const surplusExp = isAtOrAboveBottleneck ? Math.max(0, state.exp - currentRealm.maxExp) : 0;
            const expDesktopEl = document.getElementById('exp-text-desktop');
            if (expDesktopEl) {
                const expLabel = `${formatCultivationNumber(state.exp)} / ${formatCultivationNumber(currentRealm.maxExp)}`;
                if (expDesktopEl.textContent !== expLabel) expDesktopEl.textContent = expLabel;
                if (isAtOrAboveBottleneck) {
                    expDesktopEl.setAttribute('title', `Bể chứa vô hạn: Đã tích lũy ${formatCultivationNumber(state.exp)} Tu Vi (vượt ngưỡng +${formatCultivationNumber(surplusExp)}). Toàn bộ tu vi dư sẽ được bảo toàn khi đột phá!`);
                } else {
                    expDesktopEl.removeAttribute('title');
                }
            }
            const expBarDesktop = document.getElementById('exp-bar-desktop');
            expBarDesktop.style.width = `${percent}%`;
            const progressDesktop = document.getElementById('cultivation-progress-desktop');
            progressDesktop.setAttribute('aria-valuenow', String(percent));
            progressDesktop.setAttribute('aria-valuetext', `${formatCultivationNumber(state.exp)} trên ${formatCultivationNumber(currentRealm.maxExp)}`);
            const isBottleneck = percent >= 100;
            document.querySelector('.cultivation-card')?.classList.toggle('is-bottleneck', isBottleneck);
            document.querySelector('.cultivation-pill-hud')?.classList.toggle('is-bottleneck', isBottleneck);
            document.querySelector('.cultivation-progress-panel')?.classList.toggle('is-bottleneck', isBottleneck);
            (document.getElementById('tu-vi-bar') || document.getElementById('primary-actions'))?.classList.toggle('is-bottleneck', isBottleneck);
            expBarDesktop?.classList.toggle('is-bottleneck', isBottleneck);
            expBarDesktop?.classList.toggle('is-near-full', percent >= 85);

            document.getElementById('spirit-stones').textContent = state.stones.toLocaleString();
            const spiritPool = document.getElementById('spirit-pool');
            if (spiritPool) spiritPool.textContent = `${state.linhKhi.toLocaleString('vi-VN')}/${getLinhKhiMax().toLocaleString('vi-VN')} (+${getLinhKhiRate() * state.timeScale}/s)`;
            const foundationQiAmount = document.getElementById('foundation-qi-amount');
            if (foundationQiAmount) foundationQiAmount.textContent = `Linh Khí: ${formatCultivationNumber(state.linhKhi)}`;
            const timeBadge = document.getElementById('time-scale-badge');
            if (timeBadge) timeBadge.textContent = `×${state.timeScale}`;
            const jadeEl = document.getElementById('immortal-jade');
            if (jadeEl) jadeEl.textContent = (state.immortalJade || 0).toLocaleString();

            // Cập nhật chip Dị Tượng Thiên Địa (Celestial Omen)
            const omenNameEl = document.getElementById('celestial-omen-name');
            const omenTimeEl = document.getElementById('celestial-omen-time');
            const omenIconEl = document.getElementById('celestial-omen-icon');
            if (omenNameEl && omenTimeEl && typeof CELESTIAL_OMENS_CONFIG !== 'undefined') {
                const currentOmenId = state.celestialOmen?.currentOmenId || 'tu_khi_dong_lai';
                const omen = CELESTIAL_OMENS_CONFIG.find(o => o.id === currentOmenId) || CELESTIAL_OMENS_CONFIG[0];
                omenNameEl.textContent = omen.name;
                if (omenIconEl) omenIconEl.className = `fa-solid ${omen.icon} ${omen.color} group-hover:scale-110 transition-transform`;
                const remSec = Math.max(0, Math.ceil(((state.celestialOmen?.changeAt || 0) - Date.now()) / 1000));
                const m = Math.floor(remSec / 60);
                const s = remSec % 60;
                omenTimeEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
            }

            const currentSpeed = state.isDead ? 0 : getAdjustedCultivationGain(getIdleRate() * state.timeScale).gainedAmount;
            document.getElementById('idle-rate-badge').textContent = `+${formatCultivationNumber(currentSpeed)} / s`;
            
            // Khí Huyết (HP) & Linh Lực (MP) — Bảo vệ chống số âm & định dạng chuẩn số học
            const effectiveStats = getEffectiveStats();
            const safeMaxHp = Math.max(1, Number(effectiveStats.maxHp) || 1000);
            const safeCurrentHp = Math.max(0, Math.min(safeMaxHp, Math.round(Number(state.hp) || 0)));
            state.hp = safeCurrentHp;

            const safeMaxMp = Math.max(1, Number(effectiveStats.maxMp) || 200);
            const safeCurrentMp = Math.max(0, Math.min(safeMaxMp, Math.round(Number(state.mp) || 0)));
            state.mp = safeCurrentMp;

            const hpRegenPerSec = typeof getHpRegenPerSec === 'function'
                ? getHpRegenPerSec()
                : Math.round((state.hpRegenBase ?? 5) + (safeMaxHp * 0.01) + ((state.realmStage || 0) * 50));
            const hpTextEl = document.getElementById('stat-hp-text');
            if (hpTextEl) {
                hpTextEl.textContent = `${safeCurrentHp.toLocaleString('vi-VN')} / ${safeMaxHp.toLocaleString('vi-VN')} (+${hpRegenPerSec}/s)`;
            }
            const hpBarEl = document.getElementById('stat-hp-bar');
            if (hpBarEl) {
                const hpPercent = Math.max(0, Math.min(100, (safeCurrentHp / safeMaxHp) * 100));
                hpBarEl.style.width = `${hpPercent.toFixed(1)}%`;
            }
            const mpTextEl = document.getElementById('stat-mp-text');
            if (mpTextEl) {
                mpTextEl.textContent = `${safeCurrentMp.toLocaleString('vi-VN')} / ${safeMaxMp.toLocaleString('vi-VN')}`;
            }
            const mpBarEl = document.getElementById('stat-mp-bar');
            if (mpBarEl) {
                const mpPercent = Math.max(0, Math.min(100, (safeCurrentMp / safeMaxMp) * 100));
                mpBarEl.style.width = `${mpPercent.toFixed(1)}%`;
            }

            // Đạo Tâm & Tâm Ma
            const currentDaoTam = Math.max(0, Math.min(100, Math.round(state.daoTam != null ? state.daoTam : 100)));
            state.daoTam = currentDaoTam;
            state.tamMa = Math.max(0, 100 - currentDaoTam);
            const dtTextEl = document.getElementById('stat-daotam-text');
            const dtBarEl = document.getElementById('stat-daotam-bar');
            const dtBadgeEl = document.getElementById('stat-daotam-state-badge');
            const dtIconEl = document.getElementById('stat-daotam-icon');

            if (dtTextEl) dtTextEl.textContent = `${currentDaoTam}/100`;
            if (dtBarEl) {
                dtBarEl.style.width = `${currentDaoTam}%`;
                dtBarEl.className = 'h-full rounded-full transition-all duration-300';
                if (currentDaoTam > 70) {
                    dtBarEl.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-emerald-400');
                } else if (currentDaoTam >= 30) {
                    dtBarEl.classList.add('bg-gradient-to-r', 'from-amber-600', 'to-yellow-400');
                } else {
                    dtBarEl.classList.add('bg-gradient-to-r', 'from-purple-700', 'via-rose-600', 'to-red-500', 'animate-pulse');
                }
            }
            if (dtBadgeEl) {
                if (currentDaoTam > 70) {
                    dtBadgeEl.textContent = 'Tâm Cảnh Băng Thanh';
                    dtBadgeEl.className = 'text-[9px] font-medium px-1 py-0.2 rounded text-emerald-300 bg-emerald-950/80 border border-emerald-500/30';
                } else if (currentDaoTam >= 30) {
                    dtBadgeEl.textContent = 'Hồng Trần Quấy Nhiễu';
                    dtBadgeEl.className = 'text-[9px] font-medium px-1 py-0.2 rounded text-amber-300 bg-amber-950/80 border border-amber-500/30';
                } else {
                    dtBadgeEl.textContent = 'Tâm Ma Phệ Thể';
                    dtBadgeEl.className = 'text-[9px] font-bold px-1 py-0.2 rounded text-rose-300 bg-rose-950/80 border border-rose-500/50 animate-pulse';
                }
            }
            if (dtIconEl) {
                if (currentDaoTam > 70) {
                    dtIconEl.className = 'fa-solid fa-yin-yang text-emerald-400 text-[10px]';
                } else if (currentDaoTam >= 30) {
                    dtIconEl.className = 'fa-solid fa-yin-yang text-amber-400 text-[10px]';
                } else {
                    dtIconEl.className = 'fa-solid fa-skull text-rose-400 text-[10px] animate-pulse';
                }
            }

            // Nút Trảm Tâm Ma (HUD & Modal)
            const currentTamMa = state.tamMa != null ? state.tamMa : (100 - currentDaoTam);
            const canChallengeTamMa = currentTamMa >= 50;

            const btnHud = document.getElementById('btn-tram-tam-ma-hud');
            if (btnHud) {
                btnHud.disabled = !canChallengeTamMa;
                btnHud.title = canChallengeTamMa 
                    ? `Khiêu chiến ảo ảnh Tâm Ma (${currentTamMa}/100), thanh tẩy thần hồn!` 
                    : 'Tâm Ma chưa đủ lớn để hóa hình (Cần Tâm Ma ≥ 50)';
                if (canChallengeTamMa) {
                    btnHud.className = 'w-full mt-1.5 py-1 px-2 rounded-lg font-serif font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-rose-200 border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.4)] hover:brightness-125 cursor-pointer active:scale-95 animate-pulse';
                    btnHud.innerHTML = `<i class="fa-solid fa-skull text-[9px] text-rose-400"></i><span>Trảm Tâm Ma (${currentTamMa})</span>`;
                } else {
                    btnHud.className = 'w-full mt-1.5 py-1 px-2 rounded-lg font-serif font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all opacity-40 bg-stone-900/60 text-stone-500 border border-stone-800 cursor-not-allowed';
                    btnHud.innerHTML = `<i class="fa-solid fa-shield-halved text-[9px] text-stone-600"></i><span>Trảm Tâm Ma (Tâm Ma: ${currentTamMa})</span>`;
                }
            }

            const btnModal = document.getElementById('btn-tram-tam-ma-modal');
            if (btnModal) {
                btnModal.disabled = !canChallengeTamMa;
                btnModal.title = canChallengeTamMa 
                    ? 'Khiêu chiến ảo ảnh Tâm Ma, thanh tẩy thần hồn!' 
                    : 'Tâm Ma chưa đủ lớn để hóa hình (Cần Tâm Ma ≥ 50)';
                if (canChallengeTamMa) {
                    btnModal.className = 'w-full mt-2 py-1.5 px-3 rounded-lg font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-rose-200 border border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:brightness-125 cursor-pointer active:scale-95 animate-pulse';
                    btnModal.innerHTML = `<i class="fa-solid fa-skull text-xs text-rose-400"></i><span>Trảm Tâm Ma (${currentTamMa})</span>`;
                } else {
                    btnModal.className = 'w-full mt-2 py-1.5 px-3 rounded-lg font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all opacity-40 bg-stone-900/60 text-stone-500 border border-stone-800 cursor-not-allowed';
                    btnModal.innerHTML = `<i class="fa-solid fa-shield-halved text-xs text-stone-600"></i><span>Trảm Tâm Ma (Tâm Ma: ${currentTamMa})</span>`;
                }
            }

            const lifespanStat = document.getElementById('stat-lifespan-text') || document.getElementById('stat-lifespan');
            if (lifespanStat) lifespanStat.textContent = `${Math.floor(state.ageYears)} / ${getThoNguyenMax()} năm`;
            const topLife = document.getElementById('top-lifespan-text');
            if (topLife) topLife.textContent = `${Math.floor(state.ageYears)}/${getThoNguyenMax()} năm`;
            const timePayload = getTimeSystemPayload().time_system;
            const warningLifespan = state.isDead || (timePayload.time_to_death_seconds !== null && timePayload.time_to_death_seconds < 3600);
            document.body.dataset.heavenlyRejection = String(warningLifespan);
            lifespanStat?.classList.toggle('lifespan-danger', warningLifespan);
            topLife?.classList.toggle('lifespan-danger', warningLifespan);
            lifespanStat?.classList.toggle('lifespan-paused', !timePayload.is_aging && !state.isDead);

            const currentCP = getCombatPower();
            const statAtkEl = document.getElementById('stat-atk');
            if (statAtkEl) statAtkEl.textContent = formatCultivationNumber(effectiveStats.atk);
            const statDefEl = document.getElementById('stat-def');
            if (statDefEl) statDefEl.textContent = formatCultivationNumber(effectiveStats.def);
            const spdEl = document.getElementById('stat-spd');
            if (spdEl) spdEl.textContent = effectiveStats.spd || (100 + (state.realmStage || 0) * 15);
            const critEl = document.getElementById('stat-crit');
            if (critEl) critEl.textContent = `${effectiveStats.crit}%`;
            const penEl = document.getElementById('stat-pen');
            if (penEl) penEl.textContent = `${effectiveStats.armorIgnore || 0}%`;
            const dodgeEl = document.getElementById('stat-dodge');
            if (dodgeEl) dodgeEl.textContent = `${effectiveStats.absoluteDodgeChance || 0}%`;
            const cpLeftEl = document.getElementById('stat-cp-left');
            if (cpLeftEl) cpLeftEl.textContent = formatCultivationNumber(currentCP);

            const root = getRootConfig();
            const topRoot = document.getElementById('top-root-badge');
            if (topRoot) topRoot.textContent = root.name;
            const rootFullNameEl = document.getElementById('root-full-name');
            if (rootFullNameEl) rootFullNameEl.textContent = root.name;
            const rootTierNameBadge = document.getElementById('root-tier-name-badge');
            if (rootTierNameBadge) {
                const tier = getRootTier();
                rootTierNameBadge.textContent = tier.name || 'Thiên Cấp';
            }
            const rootSpeedEl = document.getElementById('root-speed-multiplier');
            if (rootSpeedEl) {
                const rootMultiplier = getActiveFoundationEffects().cultivationSpeedMultiplier ?? 1;
                rootSpeedEl.textContent = `x${rootMultiplier.toFixed(2)}`;
            }
            renderSpiritualRootPanel();
            const cpEl = document.getElementById('combat-power-text');
            const modalCpEl = document.getElementById('rpg-char-combat-power');
            // Passive stat ticks must not restart the count-up animation every second.
            const cpLabel = currentCP.toLocaleString('vi-VN');
            if (cpEl && cpEl.textContent !== cpLabel) cpEl.textContent = cpLabel;
            if (modalCpEl && modalCpEl.textContent !== cpLabel) modalCpEl.textContent = cpLabel;
            previousCombatPower = currentCP;
            document.getElementById('stage-location-badge').textContent = `${BACKGROUNDS[state.bgIndex].name} • Tụ Linh Trận Cấp ${state.arrayLevel}`;

            // Trạng thái Đan Dược
            const buffEl = document.getElementById('buff-status-text');
            if (state.exp >= currentRealm.maxExp) {
                buffEl.textContent = '💥 Bình cảnh • Chờ đột phá';
            } else if (state.pillBuffRemaining > 0) {
                buffEl.innerHTML = `<span class="text-gold-300 font-semibold">Đan Dược Khuếch Đại (+50% tốc độ: ${state.pillBuffRemaining}s)</span>`;
            } else if (breakthroughBonusChance > 0) {
                buffEl.innerHTML = `<span class="text-purple-300 font-semibold">Hộ Tâm Đan (+${breakthroughBonusChance}% Độ Kiếp)</span>`;
            } else {
                buffEl.textContent = "Đan Điền: Bình ổn";
            }

            // Đổi màu hào quang phân cấp động theo cảnh giới & Chánh Ma
            const charAura = document.getElementById('char-aura');
            if (charAura) {
                charAura.classList.remove('aura-luyenkhi', 'aura-trucco', 'aura-kimdan', 'aura-nguyenanh', 'aura-hoathan', 'aura-daoto');
                const majorRealm = currentRealm.majorRealm;
                if (majorRealm === 'Luyện Khí') {
                    charAura.classList.add('aura-luyenkhi');
                    charAura.style.backgroundColor = 'rgba(180, 83, 9, 0.16)';
                } else if (majorRealm === 'Trúc Cơ') {
                    charAura.classList.add('aura-trucco');
                    charAura.style.backgroundColor = 'rgba(77, 124, 15, 0.20)';
                } else if (majorRealm === 'Kim Đan') {
                    charAura.classList.add('aura-kimdan');
                    charAura.style.backgroundColor = '';
                } else if (majorRealm === 'Nguyên Anh') {
                    charAura.classList.add('aura-nguyenanh');
                    charAura.style.backgroundColor = '';
                } else {
                    charAura.classList.add('aura-hoathan');
                    charAura.style.backgroundColor = '';
                }

                // Nếu Ma Tính áp đảo, thêm viền huyết ma rực cháy; nếu không thì dùng viền trầm ổn Hạ Giới
                if (state.alignment && state.alignment.demonic >= 65) {
                    charAura.style.boxShadow = '0 0 50px rgba(159, 18, 57, 0.7)';
                } else if (state.alignment && state.alignment.righteous >= 65) {
                    charAura.style.boxShadow = '0 0 45px rgba(101, 163, 13, 0.55)';
                } else {
                    charAura.style.boxShadow = (majorRealm === 'Luyện Khí')
                        ? '0 0 25px rgba(180, 83, 9, 0.35)'
                        : '';
                }
            }

            // Cập nhật Nhãn Định Vị Không Gian [HẠ GIỚI] - Phàm Tục
            const realmLocBadge = document.getElementById('realm-location-badge');
            if (realmLocBadge) {
                if (state.realmIndex >= 16) {
                    realmLocBadge.textContent = '[THƯỢNG GIỚI] - Tiên Giới';
                    realmLocBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-purple-950/70 text-purple-200 border border-purple-500/50 shadow-sm';
                } else {
                    realmLocBadge.textContent = '[HẠ GIỚI] - Phàm Tục';
                    realmLocBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-stone-800/90 text-amber-200/90 border border-stone-600/70 shadow-sm';
                }
            }

            // Cập nhật Chánh - Ma Trị Số trên HUD
            if (state.alignment) {
                const rightEl = document.getElementById('stat-righteous');
                const demonEl = document.getElementById('stat-demonic');
                const barRight = document.getElementById('bar-righteous');
                const barDemon = document.getElementById('bar-demonic');
                const titleBadge = document.getElementById('alignment-title-badge');

                const totalAlign = Math.max(1, state.alignment.righteous + state.alignment.demonic);
                const rightPct = Math.round((state.alignment.righteous / totalAlign) * 100);
                const demonPct = 100 - rightPct;

                if (rightEl) rightEl.textContent = state.alignment.righteous;
                if (demonEl) demonEl.textContent = state.alignment.demonic;
                if (barRight) barRight.style.width = `${rightPct}%`;
                if (barDemon) barDemon.style.width = `${demonPct}%`;

                if (titleBadge) {
                    if (state.alignment.demonic >= 75) {
                        titleBadge.textContent = "Cực Hắc Ma Tôn";
                        titleBadge.className = "text-[9px] text-rose-400 font-bold tracking-tight";
                    } else if (state.alignment.demonic >= 60) {
                        titleBadge.textContent = "Ma Đạo Cuồng Đồ";
                        titleBadge.className = "text-[9px] text-pink-300 font-semibold tracking-tight";
                    } else if (state.alignment.righteous >= 75) {
                        titleBadge.textContent = "Thanh Hư Chân Tiên";
                        titleBadge.className = "text-[9px] text-emerald-300 font-bold tracking-tight";
                    } else if (state.alignment.righteous >= 60) {
                        titleBadge.textContent = "Chính Khí Lẫm Nhiên";
                        titleBadge.className = "text-[9px] text-teal-300 font-semibold tracking-tight";
                    } else {
                        titleBadge.textContent = "Chính Tà Cân Bằng";
                        titleBadge.className = "text-[9px] text-amber-200 font-medium tracking-tight";
                    }
                }
            }

            // Cập nhật Linh Thú Hộ Pháp
            if (typeof GUARDIAN_PETS !== 'undefined') {
                const petData = GUARDIAN_PETS[state.activePet || 'fox'];
                if (petData) {
                    const petIcon = document.getElementById('pet-icon');
                    const petBadge = document.getElementById('pet-name-badge');
                    const petBox = document.getElementById('pet-avatar-box');
                    if (petIcon) petIcon.className = `fa-solid ${petData.icon} text-sm text-slate-100`;
                    if (petBadge) petBadge.textContent = petData.name;
                    if (petBox) {
                        petBox.style.borderColor = petData.color;
                        petBox.style.boxShadow = `0 0 15px ${petData.color}`;
                    }
                }
            }

            // Nút Thao Tác Tu Luyện / Đột Phá Chính tại Màn Hình Chính
            const mainActionBtn = document.getElementById('btn-cultivate-action');
            const mainActionIcon = document.getElementById('btn-cultivate-icon');
            const mainActionLabel = document.getElementById('btn-cultivate-label');
            const btnBreak = document.getElementById('btn-breakthrough');
            if (mainActionBtn) mainActionBtn.onclick = attemptCultivationBreakthrough;

            const isSuppressed = checkHeavenlySuppression(state);
            const hasCleared50 = Boolean(state.hasClearedTower50 || (state.towerFloor && state.towerFloor > 50));

            if (isSuppressed) {
                if (btnBreak) {
                    btnBreak.classList.add('hidden');
                    btnBreak.className = "hidden";
                    btnBreak.setAttribute('aria-hidden', 'true');
                }
                if (mainActionBtn && mainActionIcon && mainActionLabel) {
                    mainActionBtn.classList.remove('hidden');
                    mainActionBtn.removeAttribute('disabled');

                    if (hasCleared50) {
                        // Đã đả thông Tầng 50 Trấn Yêu Tháp => Sẵn sàng Phi Thăng
                        mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn btn-ascension-ready cursor-pointer";
                        mainActionIcon.className = "fa-solid fa-feather-pointed mr-1.5 text-amber-300 animate-bounce";
                        mainActionLabel.textContent = "[PHI THĂNG LINH GIỚI]";
                        mainActionBtn.setAttribute('title', 'Đã đả thông Tầng 50 Trấn Yêu Tháp! Bấm để chém vỡ gông cùm, phi thăng Linh Giới!');
                        mainActionBtn.onclick = () => performAscensionToLinhGioi();
                    } else {
                        // Chưa đả thông Tầng 50 => Bị Thiên Đạo Áp Chế
                        mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn btn-ascension-locked cursor-pointer";
                        mainActionIcon.className = "fa-solid fa-lock mr-1.5 text-rose-400 animate-pulse";
                        mainActionLabel.textContent = "ÁP CHẾ • PHÁ THÁP 50";
                        mainActionBtn.setAttribute('title', `Thiên Đạo giảm 90% tốc độ Tu Vi. Hãy đả thông Tầng 50 Trấn Yêu Tháp (Hiện tại: Tầng ${state.towerFloor || 1}) để Phi Thăng!`);
                        mainActionBtn.onclick = () => {
                            if (typeof openDemonTowerModal === 'function') openDemonTowerModal('fight');
                        };
                    }
                }
            } else if (percent >= 100) {
                if (btnBreak) {
                    btnBreak.classList.add('hidden');
                    btnBreak.className = "hidden";
                    btnBreak.setAttribute('aria-hidden', 'true');
                    btnBreak.onclick = attemptCultivationBreakthrough;
                }
                if (mainActionBtn && mainActionIcon && mainActionLabel) {
                    mainActionBtn.classList.remove('hidden');
                    if (state.realmIndex >= REALMS.length - 1) {
                        mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn opacity-80 cursor-default bg-emerald-950/70 text-emerald-200 border-emerald-500/50";
                        mainActionIcon.className = "fa-solid fa-crown mr-1.5 text-amber-300";
                        mainActionLabel.textContent = "Đại Đạo Đỉnh Phong";
                        mainActionBtn.setAttribute('title', 'Đạo hữu đã đạt cảnh giới tối cao hiện tại.');
                    } else if (currentRealm.isMajorBottleneck) {
                        mainActionBtn.removeAttribute('disabled');
                        mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn cultivation-main-btn--major";
                        mainActionIcon.className = "fa-solid fa-cloud-bolt mr-1.5 text-purple-300 animate-bounce";
                        mainActionLabel.textContent = "Nghênh Đón Thiên Kiếp";
                        mainActionBtn.setAttribute('title', 'Bình cảnh Đại Cảnh Giới - Bấm để nghênh đón Thiên Kiếp');
                    } else {
                        mainActionBtn.removeAttribute('disabled');
                        mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn cultivation-main-btn--minor";
                        mainActionIcon.className = "fa-solid fa-bolt-lightning mr-1.5 text-amber-300 animate-bounce";
                        mainActionLabel.textContent = "Xung Kích Bình Cảnh";
                        mainActionBtn.setAttribute('title', 'Tu vi viên mãn - Bấm để xung kích bình cảnh tiểu cảnh giới');
                    }
                }
            } else {
                // TU VI CHƯA ĐẦY (< 100%): Giữ nguyên cột 4 (180px) ở trạng thái tĩnh tọa để bố cục tuyệt đối không dịch chuyển
                if (btnBreak) {
                    btnBreak.classList.add('hidden');
                    btnBreak.className = "hidden";
                    btnBreak.setAttribute('aria-hidden', 'true');
                }
                if (mainActionBtn && mainActionIcon && mainActionLabel) {
                    mainActionBtn.classList.remove('hidden');
                    mainActionBtn.setAttribute('disabled', 'disabled');
                    mainActionBtn.className = "pill-breakthrough-btn cultivation-main-btn is-meditating";
                    mainActionIcon.className = "fa-solid fa-yin-yang mr-1.5 text-emerald-400/70";
                    mainActionLabel.textContent = "Đang Tụ Khí...";
                    mainActionBtn.setAttribute('title', 'Đang tự động hấp thu thiên địa linh khí. Khi Tu Vi đạt 100% có thể Xung Kích Bình Cảnh.');
                }
            }

            renderQuickEquipSlots();
            applyFeatureVisibility();
        }
// ============================================================================
// BẢN THỂ NHÂN VẬT (LOTTIE MODEL) & PHÁP TƯỚNG THEO CẢNH GIỚI
// ============================================================================
const CHARACTER_MODELS = {
    "female-luyen-khi": "./assets/animations/female_luyen_khi.json",
    "nu-tu": "./assets/animations/female_luyen_khi.json",
    "nu-tu-bang-he": "./assets/animations/female_luyen_khi.json",
    "luyen-khi": "./assets/animations/female_luyen_khi.json", // Nữ Tu Băng Hệ / Áo xám tu sĩ
    "truc-co": "./assets/animations/char_truc_co.json",     // Áo xanh trúc, có linh khí vây quanh
    "kim-dan": "./assets/animations/char_kim_dan.json",     // Áo choàng đính kim tuyến
    "nguyen-anh": "./assets/animations/char_nguyen_anh.json",// Pháp tướng hư ảo
    "hoa-than": "./assets/animations/char_hoa_than.json"    // Uy áp toàn thân, sấm chớp ẩn hiện
};

function resolveCharacterRealmKey(input) {
    if (typeof input === 'string') {
        const lower = input.toLowerCase().trim();
        if (CHARACTER_MODELS[lower]) return lower;
        if (lower.includes('nu-tu') || lower.includes('nữ tu') || lower.includes('female')) return 'female-luyen-khi';
        if (lower.includes('hoa-than') || lower.includes('hóa thần') || lower.includes('hoa than')) return 'hoa-than';
        if (lower.includes('nguyen-anh') || lower.includes('nguyên anh') || lower.includes('nguyen anh')) return 'nguyen-anh';
        if (lower.includes('kim-dan') || lower.includes('kết đan') || lower.includes('kim đan') || lower.includes('kim dan')) return 'kim-dan';
        if (lower.includes('truc-co') || lower.includes('trúc cơ') || lower.includes('truc co')) return 'truc-co';
        if (lower.includes('luyen-khi') || lower.includes('luyện khí') || lower.includes('luyen khi')) return 'luyen-khi';
        return null;
    }
    const idx = (typeof input === 'number') ? input : (typeof state !== 'undefined' ? (state.realmIndex || 0) : 0);
    const themeKey = (typeof REALM_THEME_BY_INDEX !== 'undefined' && REALM_THEME_BY_INDEX[idx])
        ? REALM_THEME_BY_INDEX[idx]
        : (idx >= 16 ? 'hoa-than' : (idx >= 12 ? 'nguyen-anh' : (idx >= 8 ? 'kim-dan' : (idx >= 4 ? 'truc-co' : 'luyen-khi'))));
    return themeKey || 'luyen-khi';
}

// Hàm cập nhật Pháp Tướng (Model)
function updateCharacterModel(realmId) {
    const lottiePlayer = document.getElementById('char-lottie-model');
    const fallbackImg = document.getElementById('char-main-img') || document.getElementById('char-fallback-img');
    
    // Bản thể nhân vật tu tiên đả tọa (char_cultivator.jpg) luôn hiển thị sắc nét trung tâm
    if (fallbackImg) {
        fallbackImg.style.opacity = '1';
    }

    if (lottiePlayer) {
        const key = resolveCharacterRealmKey(realmId);

        // Kiểm tra xem có file Lottie cho cảnh giới này không
        const modelUrl = key ? CHARACTER_MODELS[key] : null;
        
        if (modelUrl) {
            const currentSrc = lottiePlayer.getAttribute('src');
            if (currentSrc !== modelUrl && typeof lottiePlayer.load === 'function') {
                try {
                    lottiePlayer.load(modelUrl);
                } catch (e) {
                    console.warn('[updateCharacterModel] load error:', e);
                }
            }
            lottiePlayer.style.opacity = '1';
        } else {
            // Nếu chưa có file Lottie, ẩn lottie layer
            lottiePlayer.style.opacity = '0';
        }
    }
}
window.CHARACTER_MODELS = CHARACTER_MODELS;
window.updateCharacterModel = updateCharacterModel;

function syncRealmTheme() {
            const realmTheme = (typeof REALM_THEME_BY_INDEX !== 'undefined' && REALM_THEME_BY_INDEX[state.realmIndex]) || 'luyen-khi';
            const worldTheme = BACKGROUNDS[state.bgIndex]?.themeKey;
            const activeTheme = worldTheme || realmTheme;
            if (document && document.body) {
                if (document.body.dataset.realm !== activeTheme) document.body.dataset.realm = activeTheme;
                if (document.body.dataset.cultivationRealm !== realmTheme) document.body.dataset.cultivationRealm = realmTheme;
                if (document.body.dataset.world !== (worldTheme || 'realm')) document.body.dataset.world = worldTheme || 'realm';
            }
            if (typeof updateCharacterModel === 'function' && syncRealmTheme.lastModelTheme !== realmTheme) {
                updateCharacterModel(realmTheme);
                syncRealmTheme.lastModelTheme = realmTheme;
            }
        }
function renderQuickEquipSlots() {
            const grid = document.getElementById('quick-equip-grid');
            if (!grid) return;
            const equippedItems = state.inventory.filter(i => i.equipped);
            // 6 Ô Chuẩn: weapon, armor, boots, ring, talisman, artifact
            const slots = [
                { type: 'weapon', icon: 'fa-khanda', name: 'Vũ Khí' },
                { type: 'armor', icon: 'fa-shirt', name: 'Đạo Bào' },
                { type: 'boots', icon: 'fa-shoe-prints', name: 'Phi Hài' },
                { type: 'ring', icon: 'fa-ring', name: 'Giới Chỉ' },
                { type: 'talisman', icon: 'fa-gem', name: 'Ngọc Bội' },
                { type: 'artifact', icon: 'fa-shield-halved', name: 'Vũ Khí Phụ' }
            ];

            grid.innerHTML = slots.map(slot => {
                const found = equippedItems.find(i => i.slot === slot.type);
                const featureAttr = slot.type === 'artifact' ? 'data-feature-id="btn_phap_bao_ban_menh" data-is-locked="true"' : '';
                const featureClass = slot.type === 'artifact' ? 'hidden ' : '';
                if (found) {
                    return `
                        <div ${featureAttr} onclick="openDrawer('inventory')"
                             draggable="true"
                             data-drop-zone="equipment"
                             data-slot="${slot.type}"
                             data-item-id="${found.id}"
                             data-is-equipped="true"
                             class="${featureClass}aspect-square rounded-md bg-slate-900/90 border border-jade-400/50 flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 transition shadow-inner" title="${slot.name}: ${found.name} (${found.desc})">
                            <i class="fa-solid ${found.icon} text-jade-300 text-xs"></i>
                        </div>
                    `;
                } else if (slot.type === 'artifact' && REALMS[state.realmIndex].majorIndex < 2) {
                    return `
                        <div ${featureAttr} onclick="openDrawer('inventory')" data-drop-zone="equipment" data-slot="${slot.type}" class="${featureClass}aspect-square rounded-md bg-slate-950/60 border border-dashed border-purple-900/50 flex flex-col items-center justify-center cursor-pointer text-slate-600 hover:border-purple-600 transition" title="Khóa: Mở khi đạt Kim Đan Kỳ">
                            <i class="fa-solid fa-lock text-[10px] text-purple-400/60"></i>
                        </div>
                    `;
                } else {
                    return `
                        <div ${featureAttr} onclick="openDrawer('inventory')" data-drop-zone="equipment" data-slot="${slot.type}" class="${featureClass}aspect-square rounded-md bg-slate-950/40 border border-dashed border-slate-700/70 flex flex-col items-center justify-center cursor-pointer text-slate-600 hover:border-slate-500 transition" title="Ô ${slot.name} Trống">
                            <i class="fa-solid ${slot.icon} text-[10px]"></i>
                        </div>
                    `;
                }
            }).join('');
        }
function spawnFloatingText(x, y, text, color = "text-jade-300") {
            const el = document.createElement('div');
            el.className = `floating-exp font-bold text-xs sm:text-sm ${color} drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]`;
            el.style.left = `${x - 28}px`;
            el.style.top = `${y - 16}px`;
            el.textContent = text;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1150);
        }
function pulseCharacterSprite() {
            const wrap = document.getElementById('character-sprite-wrap');
            if (!wrap) return;
            wrap.classList.add('scale-105');
            setTimeout(() => wrap.classList.remove('scale-105'), 140);
        }
function handleStageClick(event) {
            // Đả tọa chỉ là cảnh nền; tu vi được cộng bởi GameLoop.
        }
function createMeditationRipple(x, y) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const ripple = document.createElement('span');
            ripple.className = 'meditation-ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.setAttribute('aria-hidden', 'true');
            document.body.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        }
function manualCultivate(event) {
    // Chu Thiên Vận Công thủ công đã được bãi bỏ hoàn toàn.
    // Tu vi tự động hấp thu liên tục theo nhịp nhàn rỗi qua Đan Điền và Tụ Linh Trận.
    return { rawAmount: 0, gainedAmount: 0 };
}
window.manualCultivate = manualCultivate;

/**
 * BƯỚC 4: LOTTIE THĂNG CẤP (LEVEL UP AURA)
 * Bung luồng sáng vàng rực bọc lấy nhân vật khi thăng cấp / đột phá, sau đó tự động stop và hide
 */
function triggerLevelUpAura() {
    if (typeof document === 'undefined') return;
    const lottieEl = document.getElementById('lottie-level-up');
    if (!lottieEl) return;
    try {
        lottieEl.classList.remove('hidden');
        if (typeof lottieEl.play === 'function') {
            lottieEl.play();
            const onEnd = () => {
                if (typeof lottieEl.stop === 'function') {
                    try { lottieEl.stop(); } catch (e) {}
                }
                lottieEl.classList.add('hidden');
                lottieEl.removeEventListener('complete', onEnd);
            };
            lottieEl.addEventListener('complete', onEnd, { once: true });
            setTimeout(onEnd, 2500);
        } else {
            setTimeout(() => lottieEl.classList.add('hidden'), 1500);
        }
    } catch (e) {
        console.warn('Lottie level-up error:', e);
    }
}
window.triggerLevelUpAura = triggerLevelUpAura;

/**
 * Hàm cultivate() tuân thủ chuẩn nâng cấp level & kích hoạt hiệu ứng Level Up Aura
 */
function cultivate(event) {
    const prevRealm = state.realmIndex;
    const prevLevel = state.level || (state.realmIndex + 1);
    const result = manualCultivate(event);
    if ((state.level && state.level > prevLevel) || state.realmIndex > prevRealm) {
        if (typeof triggerLevelUpAura === 'function') triggerLevelUpAura();
    }
    return result;
}
window.cultivate = cultivate;

/**
 * BƯỚC 2: HỆ THỐNG HẠT VÀ MÔI TRƯỜNG (tsParticles - Mạt Pháp Tàn Tro & Sương Mù)
 * Cấu hình Low-poly tối đa 40 hạt, màu tro xám và nâu đất, di chuyển lên trên
 */
function initTsParticles() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const container = document.getElementById('tsparticles');
    if (!container) return;

    if (typeof tsParticles !== 'undefined' && typeof tsParticles.load === 'function') {
        try {
            tsParticles.load("tsparticles", {
                fpsLimit: 60,
                particles: {
                    number: {
                        value: 30,
                        density: {
                            enable: true,
                            area: 800
                        }
                    },
                    color: {
                        value: ["#57534e", "#78350f", "#44403c", "#6b7280"]
                    },
                    shape: {
                        type: "circle"
                    },
                    opacity: {
                        value: { min: 0.1, max: 0.4 },
                        animation: {
                            enable: true,
                            speed: 0.5,
                            minimumValue: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: { min: 1, max: 2.5 }
                    },
                    move: {
                        enable: true,
                        speed: 0.3,
                        direction: "top",
                        straight: false,
                        outModes: {
                            default: "out"
                        }
                    },
                    twinkle: {
                        particles: {
                            enable: true,
                            frequency: 0.05,
                            opacity: 1,
                            color: {
                                value: ["#57534e", "#78350f"]
                            }
                        }
                    }
                },
                detectRetina: true
            }).catch(e => {
                console.warn('[tsParticles] Load notice:', e);
            });
        } catch (err) {
            console.warn('[tsParticles] Init error:', err);
        }
    }
}
window.initTsParticles = initTsParticles;
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof initTsParticles === 'function') initTsParticles();
        });
    } else {
        setTimeout(() => {
            if (typeof initTsParticles === 'function') initTsParticles();
        }, 100);
    }
}

function triggerFortuitousEvent() {
    const btn = document.getElementById('fortuitous-event-btn');
    if (btn) {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
    }
    openEncounterModal();
}
function togglePanel(bodyId, iconId, trigger) {
    const body = document.getElementById(bodyId);
    const icon = document.getElementById(iconId);
    if (!body) return;

    // Tìm container cha ngoài cùng (aside.pc-sidebar hoặc .sidebar-container hoặc #hud-left / #hud-right)
    const sidebar = (trigger && trigger.closest)
        ? trigger.closest('.pc-sidebar, .sidebar-container, #hud-left, #hud-right, #left-sidebar, #right-sidebar, aside')
        : body.closest('.pc-sidebar, .sidebar-container, #hud-left, #hud-right, #left-sidebar, #right-sidebar, aside');

    // Xác định trạng thái hiện tại (nếu container có class collapsed hoặc body có hidden)
    const isCurrentlyCollapsed = sidebar
        ? sidebar.classList.contains('collapsed')
        : body.classList.contains('hidden');

    const willCollapse = !isCurrentlyCollapsed;

    if (sidebar) {
        sidebar.classList.toggle('collapsed', willCollapse);
    }
    body.classList.toggle('hidden', willCollapse);

    if (icon) {
        icon.classList.toggle('rotate-180', willCollapse);
    }

    if (trigger) {
        trigger.setAttribute('aria-expanded', String(!willCollapse));
    }
}

/**
 * Bật / Tắt bảng Thiên Cơ Nhật Ký với nút Chat Icon
 */
function toggleThienCoNhatKy() {
    const panel = document.getElementById('thien-co-panel') || document.getElementById('hud-right');
    const body = document.getElementById('right-card-body');
    const btn = document.getElementById('toggle-thien-co-btn');
    if (!panel) return;

    const isCollapsed = panel.classList.contains('collapsed');
    const willCollapse = !isCollapsed;

    panel.classList.toggle('collapsed', willCollapse);
    if (body) {
        body.classList.toggle('hidden', willCollapse);
    }
    if (btn) {
        btn.setAttribute('aria-expanded', String(!willCollapse));
    }
}
window.toggleThienCoNhatKy = toggleThienCoNhatKy;

function toggleImmersionMode() {
            immersionMode = !immersionMode;
            const hudIds = ['hud-top', 'hud-left', 'hud-right', 'hud-bottom', 'bottom-nav', 'tester-toolbar'];
            const restoreBtn = document.getElementById('btn-restore-hud');

            if (immersionMode) {
                closeDrawer();
                closeTesterToolbar();
                hudIds.forEach(id => document.getElementById(id)?.classList.add('opacity-0', 'pointer-events-none'));
                restoreBtn.classList.remove('hidden');
                restoreBtn.classList.add('flex');
            } else {
                hudIds.forEach(id => document.getElementById(id)?.classList.remove('opacity-0', 'pointer-events-none'));
                restoreBtn.classList.add('hidden');
                restoreBtn.classList.remove('flex');
            }
        }
function openDrawer(tabName) {
            if (cutsceneState && cutsceneState.inProgress) {
                addLog("⚡ <span class='text-rose-400 font-bold'>[Thiên Kiếp]</span> Đang trong đại trận lôi kiếp, không thể phân tâm mở Túi Trữ Vật!", "text-rose-400");
                return;
            }
            if (tabName === 'inventory') {
                openHubModal('character', 'inventory');
                return;
            }
            if (tabName === 'cave') {
                if (typeof openGiaVienModal === 'function') {
                    openGiaVienModal();
                } else if (typeof openHubModal === 'function') {
                    openHubModal('cave');
                }
                return;
            }
            if (tabName === 'sect') {
                if (typeof openSectModal === 'function') {
                    openSectModal();
                    return;
                }
            }
            const featureId = FEATURE_BY_DRAWER[tabName];
            if (featureId && rejectLockedFeature(featureId)) return;
            activeDrawer = tabName;
            const drawer = document.getElementById('side-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            if (!drawer) return;
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('drawer-open');
            drawer.setAttribute('aria-hidden', 'false');
            backdrop?.classList.add('is-open');
            document.body.classList.add('drawer-is-open');

            // Highlight nút đang chọn ở Bottom Dock
            document.querySelectorAll('.dock-btn').forEach(btn => {
                if (btn.dataset.tab === tabName) {
                    btn.classList.add('bg-white/10');
                } else {
                    btn.classList.remove('bg-white/10');
                }
            });

            if (tabName === 'inventory') {
                document.getElementById('badge-inventory')?.classList.add('hidden');
            }
            renderDrawerContent(tabName);
            requestAnimationFrame(() => document.getElementById('drawer-close-button')?.focus());
        }
function closeDrawer() {
            const drawer = document.getElementById('side-drawer');
            if (!drawer) return;
            activeDrawer = null;
            drawer.classList.add('translate-x-full');
            drawer.classList.remove('drawer-open');
            drawer.setAttribute('aria-hidden', 'true');
            document.getElementById('drawer-backdrop')?.classList.remove('is-open');
            document.body.classList.remove('drawer-is-open');
            document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('bg-white/10'));
        }
function renderDrawerContent(tab) {
            const titleEl = document.getElementById('drawer-title');
            const iconEl = document.getElementById('drawer-icon');
            const contentEl = document.getElementById('drawer-content');

            if (tab === 'inventory') {
                titleEl.textContent = "Túi Trữ Vật Càn Khôn";
                iconEl.className = "fa-solid fa-sack-xmark text-amber-400";
                
                contentEl.innerHTML = `
                    <div class="inventory-grid">
                        ${state.inventory.filter(i => i.count > 0).map(item => `
                            <article class="inventory-item rarity-${item.rarity}" tabindex="0" aria-label="${item.name}, số lượng ${item.count}">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-lg border border-current shrink-0">
                                        <i class="fa-solid ${item.icon}"></i>
                                    </div>
                                    <div>
                                        <div class="text-xs font-bold flex items-center gap-2">
                                            <span>${item.name}</span>
                                            <span class="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">x${item.count}</span>
                                        </div>
                                        <p class="text-[11px] text-slate-400 mt-0.5">${item.desc}</p>
                                    </div>
                                </div>
                                ${item.type === 'Đan Dược' ? `
                                    <button onclick="useInventoryItem('${item.id}')" class="px-3 py-1.5 rounded-lg bg-jade-500/20 hover:bg-jade-500/40 text-jade-300 border border-jade-400/40 text-xs font-semibold whitespace-nowrap transition">
                                        Phục Dụng
                                    </button>
                                ` : item.type === 'Pháp Bảo' ? `
                                    <button onclick="toggleEquipItem('${item.id}')" class="px-3 py-1.5 rounded-lg ${item.equipped ? 'bg-gold-500/20 text-gold-300 border-gold-400/40' : 'bg-slate-800 text-slate-300 border-slate-700'} border text-xs font-semibold whitespace-nowrap transition">
                                        ${item.equipped ? 'Đang Đeo' : 'Trang Bị'}
                                    </button>
                                ` : ''}
                            </article>
                        `).join('')}
                    </div>
                `;
            } 
            else if (tab === 'skills') {
                titleEl.textContent = "Tàng Kinh Các • Công Pháp";
                iconEl.className = "fa-solid fa-book-journal-whills text-cyan-400";

                if (typeof renderManualsSystemTab === 'function') {
                    renderManualsSystemTab(contentEl, state);
                } else {
                    contentEl.innerHTML = `
                        <p class="text-xs text-slate-400">Lĩnh ngộ bí tịch thượng cổ giúp tăng vĩnh viễn tốc độ tu luyện và căn cơ chiến đấu.</p>
                        <div class="space-y-3">
                            ${state.skills.map(sk => {
                                const currentCost = sk.cost * sk.level;
                                return `
                                    <div class="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h4 class="text-xs font-bold text-cyan-300">${sk.name}</h4>
                                                <p class="text-[11px] text-slate-400 mt-0.5">${sk.desc}</p>
                                            </div>
                                            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                                Tầng ${sk.level}
                                            </span>
                                        </div>
                                        <button onclick="upgradeSkill('${sk.id}')" class="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-semibold transition">
                                            Lĩnh Ngộ Tầng Tiếp (${currentCost} Linh Thạch)
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
            }
            else if (tab === 'cave') {
                titleEl.textContent = "Động Phủ & Tụ Linh Trận Ngũ Hành";
                iconEl.className = "fa-solid fa-shapes text-amber-400";

                contentEl.innerHTML = `
                    <!-- 5 CỘT TRỤ TỤ LINH TRẬN NGŨ HÀNH 3D -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-xs font-bold uppercase tracking-wider text-gold-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-shapes text-amber-400"></i>Tụ Linh Trận Ngũ Hành
                                </h3>
                                <p class="text-[11px] text-slate-400">5 Cột trụ nguyên tố: Hạt linh khí bay vào nhân vật mang màu của trụ chủ vị</p>
                            </div>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/40 font-mono font-semibold">
                                Chủ Vị: ${(FIVE_ELEMENTS_CONFIG[state.activeElement] || RARE_LINH_CAN_BRANCHES[state.activeElement] || FIVE_ELEMENTS_CONFIG.metal).element}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 gap-2.5">
                            ${Object.keys(FIVE_ELEMENTS_CONFIG).map(elKey => {
                                const el = FIVE_ELEMENTS_CONFIG[elKey];
                                const lvl = getPillarLevel(elKey);
                                const cost = getPillarUpgradeCost(lvl);
                                const isActive = (state.activeElement === elKey);
                                return `
                                    <div class="p-3 rounded-xl bg-slate-900/90 border ${isActive ? el.border + ' shadow-[0_0_15px_' + el.color + '40]' : 'border-slate-800'} transition space-y-2">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2.5">
                                                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style="background-color: ${el.color}20; color: ${el.color}; border: 1px solid ${el.color}60;">
                                                    <i class="fa-solid ${el.icon}"></i>
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs font-bold text-slate-100">${el.name}</span>
                                                        <span class="text-[10px] px-2 py-0.2 rounded font-mono font-bold" style="background-color: ${el.color}30; color: ${el.color};">Cấp ${lvl}</span>
                                                        <span class="text-[9px] text-slate-300">${getLingCanStage(lvl).name}</span>
                                                        ${isActive ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">Đang Dẫn Khí</span>` : ''}
                                                    </div>
                                                    <div class="text-[10px] text-slate-400 mt-0.5">${el.bonusDesc}</div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1.5">
                                                ${!isActive ? `
                                                    <button onclick="setActiveElement('${elKey}')" class="px-2 py-1 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Kích hoạt để đổi màu hạt linh khí">
                                                        Kích Hoạt
                                                    </button>
                                                ` : ''}
                                                ${lvl >= 50 && !state.spiritualRoot.mutations[elKey]
                                                    ? `<button onclick="mutateLinhCanBranch('${elKey}')" class="px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-100 bg-amber-800">Tiến Hóa</button>`
                                                    : cost === null ? '<span class="text-[10px] text-amber-300">Lv.100</span>'
                                                        : `<button onclick="upgradeElementPillar('${elKey}')" class="px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-950 transition hover:brightness-110 shadow-sm" style="background-color: ${el.color};">Rót Linh Khí (${cost})</button>`}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- LINH THÚ HỘ PHÁP -->
                    <div class="p-4 rounded-xl bg-slate-900/90 border border-pink-500/30 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                                <i class="fa-solid fa-paw text-pink-400"></i>Linh Thú Hộ Pháp
                            </h4>
                            <span class="text-[10px] text-pink-400">Chạm đổi thú sủng</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            ${Object.keys(GUARDIAN_PETS).map(pk => {
                                const p = GUARDIAN_PETS[pk];
                                const isSel = (state.activePet === pk);
                                return `
                                    <button onclick="selectPet('${pk}')" class="p-2 rounded-xl border flex flex-col items-center text-center transition ${isSel ? 'border-pink-400 bg-pink-500/20 text-pink-200' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'}">
                                        <i class="fa-solid ${p.icon} text-base mb-1" style="color: ${p.color};"></i>
                                        <span class="text-[11px] font-bold">${p.name.split(' ')[0]}</span>
                                        <span class="text-[9px] text-slate-400 mt-0.5">${p.typeText.split(' ')[0]}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- CHUYỂN ĐỔI BỐI CẢNH -->
                    <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        <h4 class="text-xs font-bold text-gold-300 uppercase tracking-wider">Chuyển Đổi Bối Cảnh Động Phủ</h4>
                        <div class="grid grid-cols-1 gap-2">
                            ${BACKGROUNDS.map((bg, idx) => `
                                <button onclick="selectBackground(${idx})" class="p-2.5 rounded-lg border ${state.bgIndex === idx ? 'border-gold-400 bg-gold-500/10 text-gold-300 font-semibold' : 'border-slate-800 bg-slate-950/60 text-slate-300'} text-xs flex justify-between items-center transition">
                                    <span>${bg.name}</span>
                                    ${state.bgIndex === idx ? '<i class="fa-solid fa-check text-gold-400"></i>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                `;
            }
            else if (tab === 'farm') {
                titleEl.textContent = "Dược Viên Linh Điền";
                iconEl.className = "fa-solid fa-seedling text-emerald-400";

                contentEl.innerHTML = `
                    <p class="text-xs text-slate-400">Linh thảo chín có thể thu hoạch để đem sang Lò Đan luyện chế Tụ Khí Đan và Trúc Cơ Đan.</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${state.farmPlots.map(plot => `
                            <div class="p-3.5 rounded-xl bg-slate-900/90 border ${plot.progress >= 100 ? 'border-emerald-400 glow-jade' : 'border-slate-800'} flex flex-col justify-between space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-emerald-300">${plot.herbName}</span>
                                    <i class="fa-solid fa-seedling ${plot.progress >= 100 ? 'text-emerald-400 animate-bounce' : 'text-slate-600'}"></i>
                                </div>
                                ${plot.herbId ? `
                                    <div>
                                        <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>Linh dịch</span>
                                            <span class="font-mono">${plot.progress}%</span>
                                        </div>
                                        <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                            <div class="h-full bg-emerald-400 transition-all" style="width: ${plot.progress}%"></div>
                                        </div>
                                    </div>
                                    <button onclick="harvestPlot(${plot.id})" ${plot.progress < 100 ? 'disabled' : ''} 
                                        class="w-full py-1.5 rounded-lg text-xs font-semibold transition ${plot.progress >= 100 ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                                        ${plot.progress >= 100 ? 'Thu Hoạch Ngay' : 'Đang Sinh Trưởng...'}
                                    </button>
                                ` : `
                                    <div class="space-y-1.5">
                                        <button onclick="plantSeed(${plot.id}, 'herb_spirit', 'Tử Linh Chi', 12)" class="w-full py-1.5 rounded-lg border border-dashed border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40 text-[11px]">
                                            + Gieo Tử Linh Chi
                                        </button>
                                        <button onclick="plantSeed(${plot.id}, 'herb_blood', 'Huyết Ngọc Sâm', 9)" class="w-full py-1.5 rounded-lg border border-dashed border-purple-500/40 text-purple-300 hover:bg-purple-950/40 text-[11px]">
                                            + Gieo Huyết Ngọc Sâm
                                        </button>
                                    </div>
                                `}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            else if (tab === 'alchemy') {
                titleEl.textContent = "Bát Quái Đan Phòng";
                iconEl.className = "fa-solid fa-fire-burner text-purple-400";
                const spiritHerb = state.inventory.find(i => i.id === 'herb_spirit')?.count || 0;
                const bloodHerb = state.inventory.find(i => i.id === 'herb_blood')?.count || 0;

                contentEl.innerHTML = `
                    <div class="p-4 rounded-xl bg-slate-900/90 border border-purple-500/35 text-center space-y-3">
                        <div class="w-14 h-14 mx-auto rounded-full bg-purple-500/15 border border-purple-400/50 flex items-center justify-center text-purple-300 text-xl shadow-inner">
                            <i class="fa-solid fa-fire-flame-curved animate-pulse"></i>
                        </div>
                        <h3 class="text-sm font-bold text-jade-300">Đan Phương 1: Tụ Khí Đan</h3>
                        <p class="text-xs text-slate-400">Nguyên liệu: <span class="text-emerald-400 font-semibold">2 Tử Linh Chi</span> (Hiện có: ${spiritHerb})</p>
                        <p class="text-[11px] text-slate-400">Công dụng: +60 Tu Vi & Khuếch đại 50% tốc độ tu luyện trong 15s</p>
                        <button onclick="craftPill('pill_qi', 'herb_spirit', 2)" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg transition">
                            Khởi Lò Luyện Tụ Khí Đan
                        </button>
                    </div>

                    <div class="p-4 rounded-xl bg-slate-900/90 border border-amber-500/35 text-center space-y-3">
                        <h3 class="text-sm font-bold text-gold-300">Đan Phương 2: Trúc Cơ Đan</h3>
                        <p class="text-xs text-slate-400">Nguyên liệu: <span class="text-purple-300 font-semibold">2 Huyết Ngọc Sâm</span> (Hiện có: ${bloodHerb})</p>
                        <p class="text-[11px] text-slate-400">Công dụng: +250 Tu Vi & +25% tỷ lệ Độ Kiếp thành công</p>
                        <button onclick="craftPill('pill_foundation', 'herb_blood', 2)" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg transition">
                            Khởi Lò Luyện Trúc Cơ Đan
                        </button>
                    </div>
                `;
            }
            else if (tab === 'sect') {
                titleEl.textContent = "Thanh Vân Tông Môn";
                iconEl.className = "fa-solid fa-torii-gate text-sky-400";
                const ranks = ["Đệ Tử Ngoại Môn", "Đệ Tử Nội Môn", "Đệ Tử Chân Truyền", "Trưởng Lão Hộ Pháp"];
                const currentRank = ranks[Math.min(ranks.length - 1, REALMS[state.realmIndex].majorIndex)];

                contentEl.innerHTML = `
                    <div class="p-4 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-400">Thân phận hiện tại:</span>
                            <span class="text-xs font-bold text-sky-300 px-2.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/30">${currentRank}</span>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">Mỗi lần lĩnh bổng lộc hoặc hoàn thành nhiệm vụ Tông Môn sẽ nhận được Linh Thạch để duy trì Tụ Linh Trận.</p>
                        <button onclick="claimSectSalary()" class="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 font-semibold text-xs transition">
                            Lĩnh Bổng Lộc Tông Môn (+120 Linh Thạch)
                        </button>
                    </div>
                `;
            }
            else if (tab === 'market') {
                renderMarketDrawer(contentEl, titleEl, iconEl);
            }
            else if (tab === 'companion') {
                titleEl.textContent = "Hồng Nhan Đạo Lữ";
                iconEl.className = "fa-solid fa-heart text-pink-400";

                contentEl.innerHTML = `
                    <div class="space-y-4">
                        <p class="text-xs text-slate-300 leading-relaxed bg-pink-950/20 p-3 rounded-xl border border-pink-500/30">
                            "Độc hành vạn dặm chẳng bằng cùng giai nhân đàm đạo." Kết giao hồng nhan, bồi đắp hảo cảm để cùng nhau Song Tu tăng vọt Tu Vi mỗi ngày.
                        </p>

                        <div class="space-y-3">
                            ${state.companions.map(comp => `
                                <div class="p-4 rounded-xl bg-slate-900/90 border border-pink-500/30 space-y-2.5">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2.5">
                                            <div class="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400 flex items-center justify-center text-pink-300 text-lg">
                                                <i class="fa-solid ${comp.avatarIcon}"></i>
                                            </div>
                                            <div>
                                                <h4 class="text-sm font-bold text-pink-200">${comp.name}</h4>
                                                <span class="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40">${comp.sect} • ${comp.physique}</span>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-[10px] text-slate-400">Hảo Cảm</div>
                                            <div class="text-xs font-bold text-pink-300 font-mono">${comp.affinity}/100</div>
                                        </div>
                                    </div>

                                    <p class="text-xs italic text-slate-400 font-serif">"${comp.quote}"</p>

                                    <!-- Thanh Hảo Cảm -->
                                    <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div class="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style="width: ${comp.affinity}%"></div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-2 pt-1">
                                        <button onclick="dualCultivate('${comp.id}')" class="py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs shadow-md transition">
                                            <i class="fa-solid fa-yin-yang mr-1"></i>Song Tu (+${comp.gainTuvi} EXP)
                                        </button>
                                        <button onclick="giftCompanion('${comp.id}')" class="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-200 border border-pink-500/40 font-semibold text-xs transition">
                                            <i class="fa-solid fa-gift mr-1"></i>Tặng Dược Liệu (+5)
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
function useInventoryItem(itemId, isAuto = false) {
            if (cutsceneState && cutsceneState.inProgress) {
                if (!isAuto) {
                    addLog("⚡ Đang trong trận Thiên Kiếp, đã vô hiệu hóa việc truy cập Global Inventory!", "text-amber-300");
                }
                return;
            }
            const item = state.inventory.find(i => i.id === itemId);
            if (!item || item.count <= 0) return;

            item.count--;
            if (itemId === 'pill_thanh_tam' || item.id === 'pill_thanh_tam') {
                state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + 10);
                state.tamMa = Math.max(0, 100 - state.daoTam);
                playSound('bell');
                addLog(`🌿 <span class="text-teal-300 font-bold">[Thanh Tâm Đan]</span> Dược lực thanh tịnh tan vào thần hồn, tiêu trừ 10 Tâm Ma, Đạo Tâm tăng lên (${state.daoTam}/100)!`, 'reward', 'use-item-' + item.id);
                updateHUD();
                saveGameState();
                if (activeDrawer === 'inventory') renderDrawerContent('inventory');
                const modalBackdrop = document.getElementById('hub-modal-backdrop');
                if (modalBackdrop && !modalBackdrop.classList.contains('hidden') && modalBackdrop.dataset.activeHub === 'character') {
                    renderRpgCharacterInventory(currentInventoryFilter);
                }
                return;
            }
            if (M1_SYSTEM_RULES.lifeExtensionItems[itemId]) {
                state.lifespanBonus += M1_SYSTEM_RULES.lifeExtensionItems[itemId];
                addLog(`[Thọ Nguyên] ${item.name} tăng giới hạn tuổi thọ thêm ${M1_SYSTEM_RULES.lifeExtensionItems[itemId]} năm.`, 'text-emerald-300');
                updateHUD();
                saveGameState();
                return;
            }
            playSound('qi');
            let cultivation = { rawAmount: 0, gainedAmount: 0 };
            if (item.effect?.exp) {
                cultivation = addExp(item.effect.exp);
                state.pillBuffRemaining = Math.min(60, state.pillBuffRemaining + 15);
            }
            if (item.effect?.breakBuff) {
                const bonusRate = Number(item.effect.breakRate) || 25;
                breakthroughBonusChance = Math.min(60, breakthroughBonusChance + bonusRate);
            }
            if (item.effect?.hp) {
                const healAmt = item.effect.hp;
                const maxHp = state.maxHp || 1000;
                state.hp = Math.min(maxHp, (state.hp || 0) + healAmt);
                addLog(`❤️ Phục dụng ${item.name}, sinh cơ bùng nổ, hồi phục +${healAmt.toLocaleString('vi-VN')} Khí Huyết!`, 'text-emerald-300');
            }
            if (item.effect?.mp) {
                const healMp = item.effect.mp;
                const maxMp = state.maxMp || 500;
                state.mp = Math.min(maxMp, (state.mp || 0) + healMp);
                addLog(`💧 Phục dụng ${item.name}, linh hải tràn trề, hồi phục +${healMp.toLocaleString('vi-VN')} Pháp Lực!`, 'text-cyan-300');
            }
            if (item.effect?.lifespan) {
                state.lifespanBonus = (state.lifespanBonus || 0) + item.effect.lifespan;
                addLog(`⏳ <span class="text-amber-300 font-bold">[Thọ Nguyên]</span> ${item.name} gia tăng giới hạn tuổi thọ thêm +${item.effect.lifespan} năm!`, 'text-gold-300');
            }
            if (item.effect?.permanentAtk) {
                state.baseAtk = (state.baseAtk || state.atk || 30) + item.effect.permanentAtk;
                if (typeof calculateTotalStats === 'function') calculateTotalStats(state);
                addLog(`⚔️ <span class="text-gold-300 font-bold">[Gân Cốt Cải Biến]</span> Tiên đan kích phát thần lực, vĩnh viễn tăng +${item.effect.permanentAtk} Công Kích gốc!`, 'text-amber-300 font-bold');
            }
            if (item.effect?.permanentDef) {
                state.baseDef = (state.baseDef || state.def || 15) + item.effect.permanentDef;
                if (typeof calculateTotalStats === 'function') calculateTotalStats(state);
                addLog(`🛡️ <span class="text-gold-300 font-bold">[Tiên Thể Tái Sinh]</span> Vĩnh viễn tăng +${item.effect.permanentDef} Phòng Ngự gốc!`, 'text-sky-300 font-bold');
            }
            if (item.effect?.permanentHp) {
                state.baseHp = (state.baseHp || state.hp || 500) + item.effect.permanentHp;
                if (typeof calculateTotalStats === 'function') calculateTotalStats(state);
                addLog(`🩸 <span class="text-gold-300 font-bold">[Sinh Khí Cương Cường]</span> Vĩnh viễn tăng +${item.effect.permanentHp} Khí Huyết tối đa!`, 'text-rose-300 font-bold');
            }
            if (item.effect?.berserkBuff) {
                state.berserkBuffUntil = Date.now() + (item.effect.berserkBuff.duration * 1000);
                const hpDrain = Math.floor((state.hp || 100) * (item.effect.berserkBuff.hpDrainPercent / 100));
                state.hp = Math.max(1, (state.hp || 100) - hpDrain);
                addLog(`🔥 <span class="text-rose-400 font-bold">[Cuồng Hóa Ma Sát]</span> Sát thương Công Kích tăng x${item.effect.berserkBuff.atkMult} trong ${item.effect.berserkBuff.duration}s! Tổn hao ${hpDrain} HP.`, 'text-rose-400 font-bold');
            }
            // Xử lý cơ chế ĐAN ĐỘC (Pill Toxicity)
            if (item.effect?.clearToxicity) {
                state.danDoc = Math.max(0, (state.danDoc || 0) - item.effect.clearToxicity);
                addLog(`🌿 <span class="text-teal-300 font-bold">[Thanh Lọc Đan Độc]</span> Tiêu trừ ${item.effect.clearToxicity}% Đan Độc tích tụ trong kinh mạch (Hiện còn: ${state.danDoc}%)!`, 'text-emerald-300');
            }
            if (item.effect?.clearTamMa) {
                state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + item.effect.clearTamMa);
                state.tamMa = Math.max(0, 100 - state.daoTam);
            }
            if (item.effect?.toxicity) {
                state.danDoc = Math.min(100, (state.danDoc || 0) + item.effect.toxicity);
                if (state.danDoc >= 70) {
                    addLog(`⚠️ <span class="text-rose-400 font-bold">[Cảnh Báo Đan Độc]</span> Đan độc trong kinh mạch đạt ${state.danDoc}%, hãy uống Bách Thảo Tuyết Tinh Đan để giải trừ!`, 'text-amber-400');
                }
            }

            if (cultivation.gainedAmount > 0) {
                addLog(`${isAuto ? '[Tự động] ' : ''}Phục dụng <span class="text-emerald-400 font-semibold">${item.name}</span>, thu nạp <span class="text-jade-300">+${cultivation.gainedAmount} Tu Vi</span>${isHeavenlyRejected() && cultivation.rawAmount > 0 ? ` (Thiên Đạo chỉ cho dung nạp ${REALMS[state.realmIndex].minorStage === 'Viên Mãn' ? 0 : 10}% từ ${cultivation.rawAmount})` : ''}!`, 'reward', 'use-item-' + item.id);
            }
            saveGameState();
            updateHUD();
            if (activeDrawer === 'inventory') renderDrawerContent('inventory');
            const modalBackdrop = document.getElementById('hub-modal-backdrop');
            if (modalBackdrop && !modalBackdrop.classList.contains('hidden') && modalBackdrop.dataset.activeHub === 'character') {
                renderRpgCharacterInventory(currentInventoryFilter);
            }
        }

function toggleEquipItem(itemId) {
            const item = state.inventory.find(i => i.id === itemId);
            if (!item) return;
            const slotKey = item.slot || (item.type === 'Pháp Bảo' || item.type === 'secondary_weapon' ? 'artifact' : null);
            if (slotKey === 'artifact' && rejectLockedFeature('btn_phap_bao_ban_menh')) return;
            if (slotKey === 'artifact' && REALMS[state.realmIndex].majorIndex < 2 && !item.equipped) {
                addLog("Vũ Khí Phụ cần đạt đến <span class='text-gold-300 font-bold'>Kim Đan Kỳ</span> mới có thể ngự dụng!", "text-rose-400");
                return;
            }

            if (!state.equipped || typeof state.equipped !== 'object') state.equipped = {};

            // Tự động tháo trang bị cũ cùng ô nếu đang trang bị món mới
            if (!item.equipped) {
                if (slotKey) {
                    const currentlyEquipped = state.inventory.find(i => (i.slot === slotKey || i.id === state.equipped[slotKey]?.id) && i.equipped && i.id !== item.id);
                    if (currentlyEquipped) {
                        currentlyEquipped.equipped = false;
                    }
                    state.equipped[slotKey] = item;
                }
                item.equipped = true;
            } else {
                item.equipped = false;
                if (slotKey && state.equipped[slotKey]?.id === item.id) {
                    state.equipped[slotKey] = null;
                }
            }

            // GỌI calculateTotalStats() 1 LẦN DUY NHẤT ĐỂ TÍNH TOÁN LẠI TỪ CON SỐ 0, CẤM CỘNG TRỪ TRỰC TIẾP!
            if (typeof calculateTotalStats === 'function') {
                calculateTotalStats(state);
            }

            // Ẩn/hiện phi kiếm bay quanh người
            if (item.slot === 'weapon') {
                const swordEl = document.getElementById('flying-sword-visual');
                if (swordEl) swordEl.classList.toggle('hidden', !item.equipped);
            }

            playSound('sword');
            if (item.equipped && typeof triggerSlotFlash === 'function') {
                triggerSlotFlash(item.slot || slotKey);
            }
            updateHUD();
            renderDrawerContent('inventory');
            const modalBackdrop = document.getElementById('hub-modal-backdrop');
            if (modalBackdrop && !modalBackdrop.classList.contains('hidden') && modalBackdrop.dataset.activeHub === 'character') {
                renderRpgCharacterInventory(currentInventoryFilter);
            }
        }

function equipItem(itemId) {
    const item = state.inventory?.find(i => i.id === itemId);
    if (!item) return;
    if (item.equipped) return;
    toggleEquipItem(itemId);
}

function unequipItem(slotOrId) {
    let item = state.inventory?.find(i => i.id === slotOrId);
    if (!item && state.equipped && state.equipped[slotOrId]) {
        item = state.equipped[slotOrId];
    }
    if (!item && state.inventory) {
        item = state.inventory.find(i => i.slot === slotOrId && i.equipped);
    }
    if (item && item.equipped) {
        toggleEquipItem(item.id);
    }
}

window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.toggleEquipItem = toggleEquipItem;
function upgradeSkill(skillId) {
    if (rejectLockedFeature('btn_linh_ngo')) return;
    if (!Array.isArray(state.skills)) return;
    const sk = state.skills.find(s => s.id === skillId);
    if (!sk) return;
    const cost = (sk.cost || 100) * (sk.level || 1);
    if ((state.stones || 0) < cost) {
        addLog(`Không đủ Linh Thạch để lĩnh ngộ <span class="text-cyan-300">${sk.name}</span> (Cần ${cost.toLocaleString('vi-VN')} LT).`, "text-rose-400");
        return;
    }
    state.stones -= cost;
    sk.level = (sk.level || 1) + 1;
    if (sk.bonusType === 'atk') state.atk += 15;
    else if (sk.bonusType === 'def') {
        state.maxHp += 150;
        state.hp = state.maxHp;
        state.def += 8;
    } else if (sk.bonusType === 'crit_atk') {
        state.atk += 25;
        state.crit = (state.crit || 0) + 1;
    } else if (sk.bonusType === 'dodge_spd') {
        state.atk += 10;
        state.def += 10;
    }

    if (typeof playSound === 'function') playSound('bell');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `${sk.name} Tầng ${sk.level}!`, 'text-cyan-300');
    }
    addLog(`✨ Lĩnh ngộ thành công <span class="text-cyan-300 font-semibold">${sk.name} Tầng ${sk.level}</span>, đạo hạnh tinh tiến!`, 'text-cyan-300 font-bold');
    updateHUD();
    saveGameState();
    const container = document.getElementById('hub-modal-content');
    if (container && document.getElementById('hub-modal-backdrop')?.dataset.activeHub === 'character') {
        renderCharacterHub('skills', container);
    }
}
window.upgradeSkill = upgradeSkill;

function unlockDivineTechnique(techId) {
    const list = typeof DIVINE_TECHNIQUES_CONFIG !== 'undefined' ? DIVINE_TECHNIQUES_CONFIG : [];
    const tech = list.find(t => t.id === techId);
    if (!tech) return;

    if (!Array.isArray(state.divineTechniquesUnlocked)) state.divineTechniquesUnlocked = [];
    if (state.divineTechniquesUnlocked.includes(techId)) {
        addLog(`Bản Mệnh Thần Thông [${tech.name}] đã được thức tỉnh trước đó.`, 'text-slate-400');
        return;
    }

    // Kiểm tra điều kiện công pháp
    const reqSkill = (state.skills || []).find(s => s.id === tech.reqSkillId);
    const currentSkillLevel = reqSkill?.level || 1;
    if (currentSkillLevel < tech.reqSkillLevel) {
        addLog(`Chưa đủ điều kiện! Cần luyện [${reqSkill?.name || 'Công Pháp'}] đạt Tầng ${tech.reqSkillLevel} (Hiện tại: Tầng ${currentSkillLevel}).`, 'text-rose-400');
        return;
    }

    // Kiểm tra tài nguyên
    if ((state.stones || 0) < tech.costStones) {
        addLog(`Không đủ Linh Thạch để ngưng luyện Thần Thông (Cần ${tech.costStones.toLocaleString('vi-VN')} LT).`, 'text-rose-400');
        return;
    }
    if ((state.immortalJade || 0) < tech.costJade) {
        addLog(`Không đủ Tiên Ngọc để khai mở Thần Thông (Cần ${tech.costJade} Tiên Ngọc).`, 'text-rose-400');
        return;
    }

    state.stones -= tech.costStones;
    state.immortalJade -= tech.costJade;
    state.divineTechniquesUnlocked.push(techId);

    if (typeof playSound === 'function') playSound('victory');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Thức Tỉnh: ${tech.name}!`, 'text-amber-300');
    }
    addLog(`🔥 Chúc mừng Bản Tôn! Thức tỉnh thành công Bản Mệnh Thần Thông <b class="text-amber-300">[${tech.name}]</b>! Khí tức thông thiên triệt địa!`, 'text-amber-300 font-bold');

    updateHUD();
    saveGameState();
    const container = document.getElementById('hub-modal-content');
    if (container && document.getElementById('hub-modal-backdrop')?.dataset.activeHub === 'character') {
        renderCharacterHub('skills', container);
    }
}
window.unlockDivineTechnique = unlockDivineTechnique;

let currentSkillsSubTab = 'manuals'; // 'manuals' | 'divine'

// ============================================================================
// HỆ THỐNG CÔNG PHÁP TÀNG KINH CÁC V2 (QUỶ CỐC BÁT HOANG - 3 PHÂN KHU ĐỘC LẬP)
// ============================================================================

const SKILL_MASTERY_RANKS_V2 = [
    { level: 1, name: 'Sơ Khởi', mult: 1.0, isBottleneck: false },
    { level: 2, name: 'Nhập Môn', mult: 1.2, isBottleneck: false },
    { level: 3, name: 'Tích Lũy', mult: 1.4, isBottleneck: true, reqFragments: 2 },
    { level: 4, name: 'Tiểu Thành', mult: 1.8, isBottleneck: false },
    { level: 5, name: 'Quán Thông', mult: 2.2, isBottleneck: false },
    { level: 6, name: 'Xuất Chúng', mult: 2.7, isBottleneck: true, reqFragments: 3 },
    { level: 7, name: 'Đại Thành', mult: 3.5, isBottleneck: false },
    { level: 8, name: 'Đăng Phong', mult: 4.4, isBottleneck: false },
    { level: 9, name: 'Tạo Cực', mult: 5.5, isBottleneck: true, reqFragments: 5 },
    { level: 10, name: 'Viên Mãn', mult: 7.0, isBottleneck: false }
];

let currentSkillsFilter = 'ALL'; // 'ALL', 'passive', 'active', 'equipped', 'fragments'
let currentSkillsTierFilter = 'ALL'; // 'ALL', 'pham', 'linh', 'huyen', 'dia', 'thien', 'tien'
let skillsSearchQuery = '';
let selectedSkillId = null;
let useBreakthroughPill = false;

function ensureLearnedSkillsInit() {
    if (!Array.isArray(state.learnedSkills)) state.learnedSkills = [];
    if (!Array.isArray(state.equippedSkills)) state.equippedSkills = [];
    if (!Array.isArray(state.equippedPassiveSkills)) {
        state.equippedPassiveSkills = state.equippedSkills.filter(id => {
            const s = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(x => x.id === id);
            return s && (s.type === 'TamPhap' || s.type === 'TheThuat' || s.type === 'BiThuat');
        }).slice(0, 4);
    }
    if (!Array.isArray(state.equippedActiveSkills)) {
        state.equippedActiveSkills = state.equippedSkills.filter(id => {
            const s = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(x => x.id === id);
            return s && (s.type === 'VuKy' || s.type === 'ThanPhap');
        }).slice(0, 4);
    }

    if (state.learnedSkills.length === 0) {
        state.learnedSkills.push(
            { id: 'tp_dan_khi', level: 1, fragments: 0, pity: 0 },
            { id: 'tp_tho_nap', level: 1, fragments: 0, pity: 0 },
            { id: 'vk_thanh_phong', level: 1, fragments: 0, pity: 0 }
        );
        if (state.equippedPassiveSkills.length === 0) state.equippedPassiveSkills.push('tp_dan_khi');
        if (state.equippedActiveSkills.length === 0) state.equippedActiveSkills.push('vk_thanh_phong');
        state.equippedSkills = [...state.equippedPassiveSkills, ...state.equippedActiveSkills];
    } else {
        state.learnedSkills.forEach(entry => {
            if (typeof entry === 'string') {
                const sId = entry;
                const idx = state.learnedSkills.indexOf(entry);
                state.learnedSkills[idx] = { id: sId, level: 1, fragments: 0, pity: 0 };
            } else {
                if (!entry.level) entry.level = 1;
                if (entry.fragments === undefined) entry.fragments = 0;
                if (entry.pity === undefined) entry.pity = 0;
            }
        });
    }
}

function getUnlockedSlotCounts(realmIndex = state.realmIndex || 0) {
    let passiveSlots = 1;
    let activeSlots = 1;
    if (realmIndex < 2) {
        passiveSlots = 1; activeSlots = 1;
    } else if (realmIndex < 4) {
        passiveSlots = 2; activeSlots = 2;
    } else if (realmIndex === 4) {
        passiveSlots = 3; activeSlots = 3;
    } else {
        passiveSlots = 4; activeSlots = 4;
    }
    return { passiveSlots, activeSlots };
}

function selectSkillForInspection(skillId) {
    selectedSkillId = skillId;
    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.selectSkillForInspection = selectSkillForInspection;

function setSkillFilterTab(tab) {
    currentSkillsFilter = tab;
    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.setSkillFilterTab = setSkillFilterTab;

function setSkillTierFilter(tier) {
    currentSkillsTierFilter = tier;
    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.setSkillTierFilter = setSkillTierFilter;

function handleSkillSearchInput(val) {
    skillsSearchQuery = (val || '').trim().toLowerCase();
    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.handleSkillSearchInput = handleSkillSearchInput;

function toggleUseBreakthroughPill() {
    useBreakthroughPill = !useBreakthroughPill;
    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.toggleUseBreakthroughPill = toggleUseBreakthroughPill;

function toggleEquipSkill(skillId) {
    ensureLearnedSkillsInit();
    const skill = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(s => s.id === skillId);
    if (!skill) return;

    const isPassive = (skill.type === 'TamPhap' || skill.type === 'TheThuat' || skill.type === 'BiThuat' || skill.category === 'tam_phap' || skill.category === 'the_thuat' || skill.category === 'bi_thuat');
    const list = isPassive ? state.equippedPassiveSkills : state.equippedActiveSkills;
    const { passiveSlots, activeSlots } = getUnlockedSlotCounts(state.realmIndex || 0);
    const maxSlots = isPassive ? passiveSlots : activeSlots;

    const curIdx = list.indexOf(skillId);
    if (curIdx !== -1) {
        list.splice(curIdx, 1);
        if (typeof playSound === 'function') playSound('whoosh');
        if (typeof addLog === 'function') addLog(`Đã tháo công pháp [${skill.name}] khỏi Pháp Vị.`, 'text-slate-400');
    } else {
        if (list.length >= maxSlots) {
            const replaced = list.shift();
            list.push(skillId);
            const repSkill = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(s => s.id === replaced);
            if (typeof addLog === 'function') addLog(`Pháp Vị đã đầy. Đã thay thế [${repSkill?.name || replaced}] bằng [${skill.name}]!`, 'text-amber-300');
        } else {
            list.push(skillId);
            if (typeof addLog === 'function') addLog(`Đã ngự dụng [${skill.name}] vào Chu Thiên Pháp Vị!`, 'text-emerald-300');
        }
        if (typeof playSound === 'function') playSound('bell');
    }

    state.equippedSkills = [...state.equippedPassiveSkills, ...state.equippedActiveSkills];
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.toggleEquipSkill = toggleEquipSkill;

function attemptUpgradeSkillMastery(skillId) {
    ensureLearnedSkillsInit();
    const skill = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(s => s.id === skillId);
    if (!skill) return;

    const owned = state.learnedSkills.find(s => s.id === skillId);
    if (!owned) return;

    const curLevel = owned.level || 1;
    if (curLevel >= 10) {
        if (typeof addLog === 'function') addLog(`[${skill.name}] đã đạt đến cảnh giới Viên Mãn tối cao (Tầng 10)!`, 'text-amber-400');
        return;
    }

    const curRank = SKILL_MASTERY_RANKS_V2[curLevel - 1];
    if (curRank.isBottleneck) {
        attemptBreakthroughSkillMastery(skillId);
        return;
    }

    const tierMultipliers = { pham: 1, linh: 2.5, huyen: 6, dia: 15, thien: 40, tien: 100 };
    const tierMult = tierMultipliers[skill.tier] || 1;
    const reqExp = Math.round(300 * curLevel * tierMult);

    const playerExp = Number(state.exp) || 0;
    if (playerExp < reqExp) {
        if (typeof addLog === 'function') addLog(`⚠️ Tu Vi không đủ để tham ngộ! (Cần ${reqExp.toLocaleString('vi-VN')} Tu Vi, hiện có ${playerExp.toLocaleString('vi-VN')}).`, 'text-rose-400');
        return;
    }

    const baseRates = [90, 80, 70, 60, 50, 40, 30, 20];
    const baseRate = baseRates[curLevel - 1] || 40;
    const pity = owned.pity || 0;
    const pillBonus = useBreakthroughPill ? 25 : 0;

    if (useBreakthroughPill) {
        const pillItem = state.inventory ? state.inventory.find(i => (i.id === 'ngo_dao_dan' || i.name?.includes('Ngộ Đạo') || i.name?.includes('Luyện Thần')) && (i.count > 0 || i.quantity > 0)) : null;
        if (pillItem) {
            pillItem.count = (pillItem.count || pillItem.quantity || 1) - 1;
            if (pillItem.count <= 0) state.inventory = state.inventory.filter(x => x !== pillItem);
        } else {
            if ((state.stones || 0) < 500) {
                if (typeof addLog === 'function') addLog(`⚠️ Không có Ngộ Đạo Đan và không đủ 500 Linh Thạch để ngưng tụ đan khí!`, 'text-rose-400');
                return;
            }
            state.stones -= 500;
        }
    }

    state.exp -= reqExp;
    const finalRate = Math.min(100, baseRate + pity + pillBonus);
    const roll = Math.random() * 100;

    if (roll < finalRate) {
        owned.level += 1;
        owned.pity = 0;
        const nextRank = SKILL_MASTERY_RANKS_V2[owned.level - 1];
        if (typeof playSound === 'function') playSound('bell');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `Đốn Ngộ Thành Công: Tầng ${owned.level}!`, 'text-amber-300 font-bold');
        }
        if (typeof addLog === 'function') {
            addLog(`🌟 [Đốn Ngộ Thần Công] Lĩnh ngộ thành công! [${skill.name}] đột phá lên Tầng ${owned.level} • ${nextRank.name}!`, 'text-amber-300 font-bold');
        }
    } else {
        owned.pity = (owned.pity || 0) + 15;
        if (typeof playSound === 'function') playSound('fail');
        
        if (useBreakthroughPill) {
            if (typeof addLog === 'function') {
                addLog(`💨 Tham ngộ [${skill.name}] chưa thông suốt. Nhờ có dược lực Ngộ Đạo Đan hộ thể, thần hồn bình an! Đạo Tâm Cảm Ngộ +15% (Hiện có ${owned.pity}% pity).`, 'text-sky-300');
            }
        } else {
            state.daoTam = Math.max(0, (state.daoTam ?? 100) - 2);
            state.hp = Math.max(1, Math.round(state.hp * 0.98));
            if (typeof addLog === 'function') {
                addLog(`⚡ [Tẩu Hỏa Nhập Ma] Tâm thần dao động, tham ngộ thất bại! Tổn hao khí huyết, Tâm Ma sinh sôi (+2)! Đạo Tâm Cảm Ngộ +15% (Lần sau dễ ngộ hơn).`, 'text-rose-400');
            }
        }
    }

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.attemptUpgradeSkillMastery = attemptUpgradeSkillMastery;

function attemptBreakthroughSkillMastery(skillId) {
    ensureLearnedSkillsInit();
    const skill = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(s => s.id === skillId);
    if (!skill) return;

    const owned = state.learnedSkills.find(s => s.id === skillId);
    if (!owned) return;

    const curLevel = owned.level || 1;
    const curRank = SKILL_MASTERY_RANKS_V2[curLevel - 1];
    if (!curRank.isBottleneck) return;

    const reqFrags = curRank.reqFragments || 2;
    const ownedFrags = owned.fragments || 0;

    if (ownedFrags < reqFrags) {
        if (typeof addLog === 'function') {
            addLog(`⚠️ Bình cảnh khó vượt! Cần thêm ${reqFrags - ownedFrags} Tàn Quyển [${skill.name}] để hợp nhất tâm pháp đột phá!`, 'text-rose-400');
        }
        return;
    }

    owned.fragments -= reqFrags;
    owned.level += 1;
    owned.pity = 0;

    const nextRank = SKILL_MASTERY_RANKS_V2[owned.level - 1];
    if (typeof playSound === 'function') playSound('levelup');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `BÌNH CẢNH PHÁ TOÁI: TẦNG ${owned.level}!`, 'text-yellow-300 font-black text-xl');
    }
    if (typeof addLog === 'function') {
        addLog(`🌈 [PHÁ CẢNH VIÊN MÃN] Dung hợp ${reqFrags} Tàn Quyển thành công! [${skill.name}] đột phá bình cảnh, bước vào cảnh giới [${nextRank.name}] (Tầng ${owned.level})!`, 'text-yellow-300 font-bold');
    }

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    const host = document.getElementById('skills-page-content') || document.getElementById('hub-modal-content');
    if (host) renderSkillsHub(host);
}
window.attemptBreakthroughSkillMastery = attemptBreakthroughSkillMastery;

// Hàm thêm công pháp hoặc chuyển hóa tàn quyển nếu đã có
function addLearnedSkillOrFragment(skillId, count = 1) {
    ensureLearnedSkillsInit();
    let owned = state.learnedSkills.find(s => s.id === skillId);
    const tmpl = (typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : []).find(s => s.id === skillId);
    if (!tmpl) return;

    if (!owned) {
        owned = { id: skillId, level: 1, fragments: Math.max(0, count - 1), pity: 0 };
        state.learnedSkills.push(owned);
        if (typeof addLog === 'function') addLog(`✨ Lĩnh ngộ công pháp mới: [${tmpl.name}]!`, 'text-amber-300 font-bold');
    } else {
        owned.fragments = (owned.fragments || 0) + count;
        if (typeof addLog === 'function') addLog(`🧩 Nhận được tàn quyển trùng lặp: +${count} Tàn Quyển [${tmpl.name}] (Hiện có ${owned.fragments})!`, 'text-emerald-300 font-bold');
    }
    if (typeof saveGameState === 'function') saveGameState();
}
window.addLearnedSkillOrFragment = addLearnedSkillOrFragment;


// ============================================================================
// HÀM RENDER CHÍNH CHO TÀNG KINH CÁC (3 PHÂN KHU ĐỘC LẬP CHUẨN QUỶ CỐC BÁT HOANG)
// ============================================================================

function renderSkillsHub(content) {
    if (!content) return;
    ensureLearnedSkillsInit();

    const skillsDataSource = (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA)) ? SKILLS_DATA : [];
    const realmIndex = Number(state.realmIndex) || 0;
    const currentRealm = (typeof REALMS !== 'undefined' && REALMS[realmIndex]) ? REALMS[realmIndex] : { name: 'Luyện Khí' };

    const { passiveSlots, activeSlots } = getUnlockedSlotCounts(realmIndex);

    // Tính tổng chỉ số vĩnh viễn "Vạn Pháp Quy Tông"
    let totalFlatAtk = 0, totalFlatDef = 0, totalFlatHp = 0, totalFlatMp = 0, totalFlatExp = 0, totalCrit = 0;
    state.learnedSkills.forEach(owned => {
        const tmpl = skillsDataSource.find(s => s.id === owned.id);
        if (!tmpl) return;
        const lvl = owned.level || 1;
        const rankCfg = SKILL_MASTERY_RANKS_V2[lvl - 1] || SKILL_MASTERY_RANKS_V2[0];
        const mult = rankCfg.mult || 1.0;
        const stats = tmpl.stats || {};

        if (stats.atk) totalFlatAtk += Math.round(stats.atk * mult);
        if (stats.def) totalFlatDef += Math.round(stats.def * mult);
        if (stats.hp) totalFlatHp += Math.round(stats.hp * mult);
        if (stats.maxMp) totalFlatMp += Math.round(stats.maxMp * mult);
        if (stats.expPerSec) totalFlatExp += Math.round(stats.expPerSec * mult);
        if (stats.critRate) totalCrit += Number((stats.critRate * 100 * mult).toFixed(1));
    });

    // Helper map phẩm cấp (High Contrast)
    const tierMeta = {
        pham: { name: 'Phàm Phẩm', color: 'text-slate-100', border: 'border-slate-300/80', bg: 'bg-slate-800/90', slipClass: 'slip-pham' },
        linh: { name: 'Linh Phẩm', color: 'text-emerald-300', border: 'border-emerald-400', bg: 'bg-emerald-950/80', slipClass: 'slip-linh' },
        huyen: { name: 'Huyền Phẩm', color: 'text-sky-300', border: 'border-sky-400', bg: 'bg-sky-950/80', slipClass: 'slip-huyen' },
        dia: { name: 'Địa Phẩm', color: 'text-purple-300', border: 'border-purple-400', bg: 'bg-purple-950/80', slipClass: 'slip-dia' },
        thien: { name: 'Thiên Phẩm', color: 'text-yellow-300 font-bold', border: 'border-yellow-400', bg: 'bg-amber-950/90 shadow-[0_0_15px_rgba(250,204,21,0.4)]', slipClass: 'slip-thien' },
        tien: { name: 'Tiên Phẩm', color: 'text-pink-300 font-bold', border: 'border-pink-400', bg: 'bg-pink-950/90 shadow-[0_0_18px_rgba(244,114,182,0.45)]', slipClass: 'slip-tien' }
    };

    // Helper map hệ ngũ hành (High Contrast)
    const elemMeta = {
        kim: { name: 'Kim', icon: 'fa-shield-halved', color: 'text-amber-300' },
        moc: { name: 'Mộc', icon: 'fa-leaf', color: 'text-emerald-300' },
        thuy: { name: 'Thủy', icon: 'fa-droplet', color: 'text-cyan-300' },
        hoa: { name: 'Hỏa', icon: 'fa-fire-flame-curved', color: 'text-rose-400' },
        tho: { name: 'Thổ', icon: 'fa-mountain', color: 'text-amber-500' },
        loi: { name: 'Lôi', icon: 'fa-bolt', color: 'text-purple-300' },
        phong: { name: 'Phong', icon: 'fa-wind', color: 'text-teal-300' },
        bang: { name: 'Băng', icon: 'fa-snowflake', color: 'text-sky-200' },
        vo_he: { name: 'Vô Hệ', icon: 'fa-yin-yang', color: 'text-yellow-300' }
    };

    // Chuẩn bị danh sách theo filter
    let displayList = state.learnedSkills.map(owned => {
        const tmpl = skillsDataSource.find(s => s.id === owned.id) || {
            id: owned.id,
            name: owned.id,
            type: 'TamPhap',
            tier: 'pham',
            element: 'vo_he',
            desc: 'Công pháp tiên gia truyền thế.',
            effect: '+Tăng tu vi'
        };
        const isPassive = (tmpl.type === 'TamPhap' || tmpl.type === 'TheThuat' || tmpl.type === 'BiThuat' || tmpl.category === 'tam_phap' || tmpl.category === 'the_thuat' || tmpl.category === 'bi_thuat');
        const isEquipped = state.equippedPassiveSkills.includes(tmpl.id) || state.equippedActiveSkills.includes(tmpl.id) || state.equippedSkills.includes(tmpl.id);
        const rankCfg = SKILL_MASTERY_RANKS_V2[(owned.level || 1) - 1] || SKILL_MASTERY_RANKS_V2[0];
        return {
            ...tmpl,
            level: owned.level || 1,
            fragments: owned.fragments || 0,
            pity: owned.pity || 0,
            isPassive,
            isEquipped,
            rankCfg
        };
    });

    // Thống kê đếm tab
    const allCount = displayList.length;
    const passiveCount = displayList.filter(s => s.isPassive).length;
    const activeCount = displayList.filter(s => !s.isPassive).length;
    const equippedCount = displayList.filter(s => s.isEquipped).length;
    const fragCount = displayList.filter(s => s.fragments > 0).length;

    // Lọc theo subtab
    if (currentSkillsFilter === 'passive') {
        displayList = displayList.filter(s => s.isPassive);
    } else if (currentSkillsFilter === 'active') {
        displayList = displayList.filter(s => !s.isPassive);
    } else if (currentSkillsFilter === 'equipped') {
        displayList = displayList.filter(s => s.isEquipped);
    } else if (currentSkillsFilter === 'fragments') {
        displayList = displayList.filter(s => s.fragments > 0);
    }

    // Lọc theo phẩm chất
    if (currentSkillsTierFilter !== 'ALL') {
        displayList = displayList.filter(s => s.tier === currentSkillsTierFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (skillsSearchQuery) {
        displayList = displayList.filter(s => (s.name || '').toLowerCase().includes(skillsSearchQuery));
    }

    // Chọn cuốn mặc định nếu chưa chọn hoặc cuốn đang chọn bị biến mất
    if (!selectedSkillId || !displayList.some(s => s.id === selectedSkillId)) {
        selectedSkillId = displayList[0]?.id || state.learnedSkills[0]?.id || null;
    }

    const currentSelectedSkill = displayList.find(s => s.id === selectedSkillId) || state.learnedSkills.map(o => {
        const t = skillsDataSource.find(x => x.id === o.id);
        return t ? { ...t, level: o.level, fragments: o.fragments, pity: o.pity, rankCfg: SKILL_MASTERY_RANKS_V2[(o.level || 1) - 1] } : null;
    }).filter(Boolean)[0] || null;

    // Helper render ô Chu Thiên Pháp Vị (Sáng rõ, sắc nét, tương phản cao)
    const renderChuThienSlot = (slotIdx, isPassiveType) => {
        const maxSlots = isPassiveType ? passiveSlots : activeSlots;
        const list = isPassiveType ? state.equippedPassiveSkills : state.equippedActiveSkills;
        const isUnlocked = slotIdx < maxSlots;
        const assignedId = list[slotIdx];
        const assignedSkill = assignedId ? skillsDataSource.find(s => s.id === assignedId) : null;
        const assignedOwned = assignedId ? state.learnedSkills.find(s => s.id === assignedId) : null;

        if (!isUnlocked) {
            const unlockRealmNames = ['Trúc Cơ', 'Kim Đan', 'Hóa Thần', 'Luyện Hư'];
            const reqName = unlockRealmNames[slotIdx] || 'Luyện Hư';
            return `
                <div class="chu-thien-slot flex flex-col items-center justify-center p-1.5 rounded-xl border border-dashed border-slate-600/70 bg-slate-900/70 opacity-60 cursor-not-allowed min-w-[70px] sm:min-w-[80px] h-[72px]" title="Chưa mở khóa. Cần đạt ${reqName} Kỳ!">
                    <i class="fa-solid fa-lock text-slate-400 text-xs mb-1"></i>
                    <span class="text-[9px] font-mono text-slate-300 font-bold text-center leading-tight">Mở ở<br><span class="text-amber-300">${reqName}</span></span>
                </div>
            `;
        }

        if (!assignedSkill) {
            return `
                <div onclick="setSkillFilterTab('${isPassiveType ? 'passive' : 'active'}')" class="chu-thien-slot flex flex-col items-center justify-center p-1.5 rounded-xl border-2 border-dashed border-amber-400/70 bg-slate-900/90 hover:bg-slate-800 hover:border-yellow-300 cursor-pointer min-w-[70px] sm:min-w-[80px] h-[72px] transition group shadow-[inset_0_0_12px_rgba(245,158,11,0.15)]" title="Ô Trống - Chạm để chọn công pháp lắp vào">
                    <i class="fa-solid fa-plus text-yellow-400 group-hover:scale-125 group-hover:text-yellow-200 text-sm mb-1 transition drop-shadow"></i>
                    <span class="text-[10px] font-xianxia font-bold text-yellow-300 group-hover:text-yellow-100 tracking-wider">Trống</span>
                </div>
            `;
        }

        const tierCfg = tierMeta[assignedSkill.tier] || tierMeta.pham;
        const elemCfg = elemMeta[assignedSkill.element] || elemMeta.vo_he;
        const curLvl = assignedOwned?.level || 1;

        return `
            <div onclick="selectSkillForInspection('${assignedSkill.id}')" class="chu-thien-slot relative flex flex-col items-center justify-between p-1.5 rounded-xl border-2 ${tierCfg.border} ${tierCfg.bg} hover:border-yellow-300 cursor-pointer min-w-[70px] sm:min-w-[80px] h-[72px] transition shadow-[0_0_14px_rgba(0,0,0,0.85)] group" title="${assignedSkill.name} (Tầng ${curLvl}) - Bấm để xem chi tiết">
                <div class="flex items-center justify-between w-full px-0.5 pointer-events-none">
                    <span class="text-[10px] ${elemCfg.color} font-bold drop-shadow"><i class="fa-solid ${elemCfg.icon}"></i></span>
                    <span class="text-[9px] font-mono font-black text-yellow-300 px-1 rounded bg-black/60 border border-yellow-400/40">T${curLvl}</span>
                </div>
                <div class="text-sm ${tierCfg.color} pointer-events-none group-hover:scale-115 transition drop-shadow">
                    <i class="fa-solid fa-scroll"></i>
                </div>
                <span class="text-[9px] font-xianxia font-black text-white truncate max-w-[68px] pointer-events-none text-center drop-shadow">
                    ${assignedSkill.name}
                </span>
                <button type="button" onclick="event.stopPropagation(); toggleEquipSkill('${assignedSkill.id}')" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[9px] flex items-center justify-center border border-white shadow-md transition opacity-0 group-hover:opacity-100" title="Tháo khỏi ô">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    };

    content.innerHTML = `
        <div class="skills-master-container flex flex-col w-full h-full max-h-[86vh] rounded-3xl border-2 border-amber-400/80 bg-gradient-to-b from-slate-900/98 via-blue-950/95 to-slate-950/98 shadow-[0_0_45px_rgba(0,0,0,0.9),0_0_25px_rgba(234,179,8,0.2),inset_0_0_30px_rgba(56,189,248,0.08)] overflow-hidden p-3.5 sm:p-4 select-none font-sans">
            <!-- ==========================================
                 HEADER CHÍNH: TÀNG KINH CÁC (HIGH CONTRAST & TÍCH HỢP NÚT ĐÓNG ✕)
            =========================================== -->
            <div class="flex items-center justify-between pb-3 mb-3 border-b-2 border-amber-400/40 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-200 flex items-center justify-center text-slate-950 shadow-[0_0_16px_rgba(250,204,21,0.6)]">
                        <i class="fa-solid fa-scroll text-base"></i>
                    </span>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-300 font-xianxia font-black text-base sm:text-lg uppercase tracking-widest drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]">
                                TÀNG KINH CÁC • THẦN THÔNG CÔNG PHÁP
                            </h2>
                            <span class="text-xs font-xianxia font-black text-yellow-300 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                ${currentRealm.name}
                            </span>
                        </div>
                        <p class="text-xs text-sky-200 hidden sm:block font-medium mt-0.5">Tham ngộ tuyệt học huyền công, ngự dụng Chu Thiên Pháp Vị chấn nhiếp bát hoang.</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <span class="text-xs font-mono text-yellow-300 bg-amber-950/60 border border-amber-400/60 px-2.5 py-1 rounded-xl shadow hidden md:inline-block">
                        Đã Lĩnh Ngộ: <b class="text-white font-black">${allCount}</b> Bản
                    </span>
                    <!-- Nút Đóng Modal Tích Hợp Gọn Gàng -->
                    <button type="button"
                            onclick="if(typeof closeHubModal==='function') closeHubModal(); navigateTo('main-screen');"
                            class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-rose-950/90 border-2 border-amber-400/80 hover:border-rose-400 text-yellow-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.4)] active:scale-95 group"
                            title="Đóng về Màn Hình Chính">
                        <i class="fa-solid fa-xmark text-base group-hover:scale-125 transition-transform"></i>
                    </button>
                </div>
            </div>

            <!-- ==========================================
                 PHÂN KHU 1: CHU THIÊN PHÁP VỊ (THANH TRÊN CÙNG - TÁCH BIỆT RÕ RÀNG)
            =========================================== -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900/95 via-blue-950/80 to-slate-900/95 border-2 border-amber-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.7),inset_0_0_15px_rgba(234,179,8,0.08)] shrink-0 mb-3">
                <!-- Khối Trái (4 Ô): Tâm Pháp Bị Động -->
                <div class="lg:col-span-5 flex flex-col justify-between">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-xianxia font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow">
                            <i class="fa-solid fa-yin-yang text-amber-400"></i> Tâm Pháp (Bị Động)
                        </span>
                        <span class="text-[11px] font-mono text-sky-200 font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-700">Mở: ${passiveSlots}/4 ô</span>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        ${renderChuThienSlot(0, true)}
                        ${renderChuThienSlot(1, true)}
                        ${renderChuThienSlot(2, true)}
                        ${renderChuThienSlot(3, true)}
                    </div>
                </div>

                <!-- Khối Giữa (4 Ô): Vũ Kỹ Xuất Chiến Chủ Động -->
                <div class="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l-2 border-amber-400/40 pt-2.5 lg:pt-0 lg:pl-3">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-xianxia font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow">
                            <i class="fa-solid fa-khanda text-rose-400"></i> Vũ Kỹ Xuất Chiến (Chủ Động)
                        </span>
                        <span class="text-[11px] font-mono text-sky-200 font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-700">Mở: ${activeSlots}/4 ô</span>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        ${renderChuThienSlot(0, false)}
                        ${renderChuThienSlot(1, false)}
                        ${renderChuThienSlot(2, false)}
                        ${renderChuThienSlot(3, false)}
                    </div>
                </div>

                <!-- Khối Phải: Vạn Pháp Quy Tông (Cộng Thẳng Vĩnh Viễn) -->
                <div class="lg:col-span-2 flex flex-col justify-between border-t lg:border-t-0 lg:border-l-2 border-amber-400/40 pt-2.5 lg:pt-0 lg:pl-3 bg-gradient-to-br from-amber-950/40 via-yellow-950/30 to-slate-950/70 rounded-xl p-2 border border-amber-400/30">
                    <div class="text-[11px] font-xianxia font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow">
                        <i class="fa-solid fa-infinity text-yellow-300"></i> Vạn Pháp Quy Tông
                    </div>
                    <div class="grid grid-cols-2 gap-1 text-[11px] font-mono font-bold mt-1.5">
                        <span class="text-rose-300 truncate drop-shadow">+[${totalFlatAtk.toLocaleString('vi-VN')}] Công</span>
                        <span class="text-sky-300 truncate drop-shadow">+[${totalFlatDef.toLocaleString('vi-VN')}] Thủ</span>
                        <span class="text-emerald-300 truncate drop-shadow">+[${totalFlatHp.toLocaleString('vi-VN')}] HP</span>
                        <span class="text-yellow-300 truncate drop-shadow">+[${totalFlatExp}/s] Tu Vi</span>
                    </div>
                    <span class="text-[9px] text-sky-300 italic font-semibold text-center mt-1 leading-none drop-shadow">✦ Cộng vĩnh viễn dù không lắp</span>
                </div>
            </div>

            <!-- ==========================================
                 PHẦN THÂN: PHÂN KHU 2 (LƯỚI THẺ TRÚC) & PHÂN KHU 3 (ĐÀI THAM NGỘ)
            =========================================== -->
            <div class="flex flex-col lg:flex-row gap-3.5 flex-1 min-h-0 overflow-hidden">
                <!-- ==========================================
                     PHÂN KHU 2: KỆ THẺ TRÚC DỰNG ĐỨNG (~65%)
                =========================================== -->
                <div class="w-full lg:w-[65%] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border-2 border-amber-400/60 p-3 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.75),inset_0_0_20px_rgba(56,189,248,0.05)]">
                    <!-- Hàng Công Cụ Lọc Tabs -->
                    <div class="flex items-center justify-between gap-2 overflow-x-auto pb-2 shrink-0 custom-inventory-scrollbar">
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="setSkillFilterTab('ALL')" class="px-3 py-1.5 rounded-xl text-xs font-serif font-black whitespace-nowrap transition-all ${currentSkillsFilter === 'ALL' ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/35 to-yellow-500/40 text-yellow-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-slate-900/90 text-slate-200 hover:text-yellow-300 border border-slate-700 hover:border-amber-400/60'}">
                                Tất Cả <span class="text-[11px] text-yellow-300 font-mono font-bold">(${allCount})</span>
                            </button>
                            <button type="button" onclick="setSkillFilterTab('passive')" class="px-3 py-1.5 rounded-xl text-xs font-serif font-black whitespace-nowrap transition-all ${currentSkillsFilter === 'passive' ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/35 to-yellow-500/40 text-yellow-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-slate-900/90 text-slate-200 hover:text-yellow-300 border border-slate-700 hover:border-amber-400/60'}">
                                ☯️ Tâm Pháp <span class="text-[11px] text-yellow-300 font-mono font-bold">(${passiveCount})</span>
                            </button>
                            <button type="button" onclick="setSkillFilterTab('active')" class="px-3 py-1.5 rounded-xl text-xs font-serif font-black whitespace-nowrap transition-all ${currentSkillsFilter === 'active' ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/35 to-yellow-500/40 text-yellow-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-slate-900/90 text-slate-200 hover:text-yellow-300 border border-slate-700 hover:border-amber-400/60'}">
                                ⚔️ Vũ Kỹ <span class="text-[11px] text-yellow-300 font-mono font-bold">(${activeCount})</span>
                            </button>
                            <button type="button" onclick="setSkillFilterTab('equipped')" class="px-3 py-1.5 rounded-xl text-xs font-serif font-black whitespace-nowrap transition-all ${currentSkillsFilter === 'equipped' ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/35 to-yellow-500/40 text-yellow-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-slate-900/90 text-slate-200 hover:text-yellow-300 border border-slate-700 hover:border-amber-400/60'}">
                                🔥 Đang Trang Bị <span class="text-[11px] text-yellow-300 font-mono font-bold">(${equippedCount})</span>
                            </button>
                            <button type="button" onclick="setSkillFilterTab('fragments')" class="px-3 py-1.5 rounded-xl text-xs font-serif font-black whitespace-nowrap transition-all ${currentSkillsFilter === 'fragments' ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/35 to-yellow-500/40 text-yellow-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-slate-900/90 text-slate-200 hover:text-yellow-300 border border-slate-700 hover:border-amber-400/60'}">
                                🧩 Tàn Quyển <span class="text-[11px] text-yellow-300 font-mono font-bold">(${fragCount})</span>
                            </button>
                        </div>
                    </div>

                    <!-- Hàng Search & Filter Phẩm Chất -->
                    <div class="flex items-center gap-2.5 py-2 shrink-0">
                        <div class="relative flex-1">
                            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-amber-300 text-xs"></i>
                            <input type="text"
                                   id="skills-search-input"
                                   value="${skillsSearchQuery}"
                                   oninput="handleSkillSearchInput(this.value)"
                                   placeholder="Tìm tên công pháp thần thông..."
                                   class="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border-2 border-amber-400/60 focus:border-yellow-300 rounded-xl text-white outline-none transition placeholder-slate-400 shadow-inner font-medium" />
                        </div>
                        <select onchange="setSkillTierFilter(this.value)" class="text-xs bg-slate-950 border-2 border-amber-400/60 text-yellow-300 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow-inner">
                            <option value="ALL" ${currentSkillsTierFilter === 'ALL' ? 'selected' : ''}>✦ Tất Cả Phẩm</option>
                            <option value="pham" ${currentSkillsTierFilter === 'pham' ? 'selected' : ''}>Phàm Phẩm</option>
                            <option value="linh" ${currentSkillsTierFilter === 'linh' ? 'selected' : ''}>Linh Phẩm</option>
                            <option value="huyen" ${currentSkillsTierFilter === 'huyen' ? 'selected' : ''}>Huyền Phẩm</option>
                            <option value="dia" ${currentSkillsTierFilter === 'dia' ? 'selected' : ''}>Địa Phẩm</option>
                            <option value="thien" ${currentSkillsTierFilter === 'thien' ? 'selected' : ''}>Thiên Phẩm</option>
                            <option value="tien" ${currentSkillsTierFilter === 'tien' ? 'selected' : ''}>Tiên Phẩm</option>
                        </select>
                    </div>

                    <!-- Lưới Thẻ Trúc Dựng Đứng (Vertical Bamboo Slips Grid) -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto pr-1 flex-1 custom-inventory-scrollbar mt-1.5 content-start">
                        ${displayList.length === 0 ? `
                            <div class="col-span-full py-14 text-center text-slate-300">
                                <i class="fa-solid fa-book-open text-4xl mb-3 text-amber-400/50"></i>
                                <p class="text-sm font-serif font-bold text-yellow-200">Chưa lĩnh ngộ công pháp nào phù hợp bộ lọc.</p>
                            </div>
                        ` : displayList.map(item => {
                            const isSelected = item.id === selectedSkillId;
                            const tierCfg = tierMeta[item.tier] || tierMeta.pham;
                            const elemCfg = elemMeta[item.element] || elemMeta.vo_he;
                            const curLvl = item.level || 1;
                            const rankName = item.rankCfg?.name || 'Sơ Khởi';
                            const reqFrags = item.rankCfg?.reqFragments || (item.rankCfg?.isBottleneck ? 2 : 1);

                            return `
                                <div onclick="selectSkillForInspection('${item.id}')"
                                     class="bamboo-slip-card ${tierCfg.slipClass} ${isSelected ? 'is-selected' : ''} flex flex-col justify-between"
                                     title="${item.name} (${tierCfg.name})">
                                    <!-- Đầu Thẻ: Badge Phẩm Chất & Icon Hệ -->
                                    <div class="flex items-start justify-between w-full pointer-events-none">
                                        <span class="text-[10px] font-xianxia font-black px-2 py-0.5 rounded ${tierCfg.bg} ${tierCfg.color} border-2 ${tierCfg.border} shadow-sm">
                                            ${tierCfg.name}
                                        </span>
                                        <span class="text-xs ${elemCfg.color} font-black flex items-center gap-1 drop-shadow" title="Hệ ${elemCfg.name}">
                                            <i class="fa-solid ${elemCfg.icon}"></i>
                                        </span>
                                    </div>

                                    ${item.isEquipped ? `
                                        <div class="my-0.5 text-center pointer-events-none">
                                            <span class="text-[9px] font-xianxia font-black text-slate-950 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 border-2 border-white px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.8)] inline-block">
                                                ⚡ ĐANG VẬN CHUYỂN
                                            </span>
                                        </div>
                                    ` : ''}

                                    <!-- Thân Thẻ: Tên Công Pháp Cổ Phong & Icon Thần Thoại -->
                                    <div class="flex flex-col items-center justify-center my-auto py-1 pointer-events-none">
                                        <div class="w-11 h-11 rounded-xl bg-slate-950/80 border-2 ${tierCfg.border} flex items-center justify-center text-xl ${tierCfg.color} mb-1.5 shadow-lg">
                                            <i class="fa-solid ${item.isPassive ? 'fa-book-journal-whills' : 'fa-khanda'}"></i>
                                        </div>
                                        <h3 class="font-xianxia-title text-xs sm:text-[13px] text-yellow-200 text-center leading-tight drop-shadow max-w-[110px] truncate">
                                            ${item.name}
                                        </h3>
                                        <span class="text-[10px] text-sky-200 font-bold mt-1 font-sans">${item.isPassive ? '☯️ Tâm Pháp' : '⚔️ Vũ Kỹ'}</span>
                                    </div>

                                    <!-- Chân Thẻ: Cảnh Giới Tầng X/10 & Tiến Độ Tàn Quyển -->
                                    <div class="w-full pt-2 border-t-2 border-slate-700/80 pointer-events-none">
                                        <div class="flex items-center justify-between text-[10px] font-mono mb-1">
                                            <span class="text-yellow-300 font-black drop-shadow">T${curLvl} • ${rankName}</span>
                                            <span class="text-white font-bold">${curLvl}/10</span>
                                        </div>
                                        <div class="flex items-center justify-between text-[9px] font-mono">
                                            <span class="text-sky-300 font-bold">🧩 ${item.fragments}/${reqFrags}</span>
                                            <div class="w-11 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-600">
                                                <div class="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" style="width: ${Math.min(100, Math.round((item.fragments / reqFrags) * 100))}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- ==========================================
                     PHÂN KHU 3: ĐÀI THAM NGỘ & ĐỘT PHÁ BÍ TỊCH (~35% - TƯƠNG PHẢN CAO)
                =========================================== -->
                <div class="w-full lg:w-[35%] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/98 via-blue-950/95 to-slate-950/98 border-2 border-amber-400/80 p-3.5 sm:p-4 pb-8 shadow-[0_8px_30px_rgba(0,0,0,0.85),inset_0_0_25px_rgba(234,179,8,0.12)] overflow-y-auto custom-inventory-scrollbar">
                    ${!currentSelectedSkill ? `
                        <div class="flex flex-col items-center justify-center my-auto text-slate-300 text-center py-12">
                            <i class="fa-solid fa-scroll text-5xl mb-3 text-amber-400/50"></i>
                            <p class="text-sm font-serif font-bold text-yellow-200">Chọn một Thẻ Trúc bên trái để tham ngộ huyền cơ.</p>
                        </div>
                    ` : (() => {
                        const sk = currentSelectedSkill;
                        const tierCfg = tierMeta[sk.tier] || tierMeta.pham;
                        const elemCfg = elemMeta[sk.element] || elemMeta.vo_he;
                        const curLvl = sk.level || 1;
                        const isMax = curLvl >= 10;
                        const rankCfg = sk.rankCfg || SKILL_MASTERY_RANKS_V2[curLvl - 1] || SKILL_MASTERY_RANKS_V2[0];
                        const isBottleneck = rankCfg.isBottleneck;
                        const reqFrags = rankCfg.reqFragments || (isBottleneck ? 2 : 1);
                        const ownedFrags = sk.fragments || 0;

                        const tierMultipliers = { pham: 1, linh: 2.5, huyen: 6, dia: 15, thien: 40, tien: 100 };
                        const tierMult = tierMultipliers[sk.tier] || 1;
                        const reqExp = Math.round(300 * curLvl * tierMult);
                        const playerExp = Number(state.exp) || 0;

                        const baseRates = [90, 80, 70, 60, 50, 40, 30, 20];
                        const baseRate = baseRates[curLvl - 1] || 40;
                        const pity = sk.pity || 0;
                        const pillBonus = useBreakthroughPill ? 25 : 0;
                        const totalRate = Math.min(100, baseRate + pity + pillBonus);

                        return `
                            <!-- Tiêu Đề Chi Tiết & Phẩm Cấp -->
                            <div class="flex items-start gap-3.5 pb-3 border-b-2 border-amber-400/40 shrink-0">
                                <div class="w-14 h-14 rounded-2xl bg-slate-900 border-2 ${tierCfg.border} flex items-center justify-center text-2xl ${tierCfg.color} shadow-[0_0_18px_rgba(0,0,0,0.8)] shrink-0">
                                    <i class="fa-solid ${sk.isPassive ? 'fa-book-journal-whills' : 'fa-khanda'}"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-xianxia-title text-base sm:text-lg font-black text-yellow-300 truncate drop-shadow">
                                        ${sk.name}
                                    </h3>
                                    <div class="flex items-center gap-2 text-xs text-white mt-1.5 flex-wrap font-bold">
                                        <span class="px-2 py-0.5 rounded font-mono text-[10px] ${tierCfg.bg} ${tierCfg.border} border-2 ${tierCfg.color}">${tierCfg.name}</span>
                                        <span class="${elemCfg.color} font-mono text-[11px]"><i class="fa-solid ${elemCfg.icon}"></i> Hệ ${elemCfg.name}</span>
                                        <span class="text-sky-300 text-[11px] font-sans">• ${sk.isPassive ? 'Tâm Pháp' : 'Vũ Kỹ'}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Nút Thao Tác Hành Động Chính: Lắp Vào / Tháo Xuống (CTA) -->
                            <div class="py-3 border-b-2 border-amber-400/30 shrink-0">
                                <button type="button"
                                        onclick="toggleEquipSkill('${sk.id}')"
                                        class="w-full py-2.5 px-3 rounded-xl ${sk.isEquipped ? 'btn-cta-danger' : 'btn-cta-gold'} uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs font-black shadow-lg">
                                    <i class="fa-solid ${sk.isEquipped ? 'fa-arrow-down-to-bracket' : 'fa-bolt'}"></i>
                                    <span>${sk.isEquipped ? 'Tháo Khỏi Chu Thiên Pháp Vị' : 'Lắp Vào Chu Thiên Pháp Vị'}</span>
                                </button>
                            </div>

                            <!-- Thuộc Tính Vĩnh Viễn & Hiệu Ứng Xuất Chiến (High Contrast Cards) -->
                            <div class="space-y-2.5 py-3 border-b-2 border-amber-400/30 text-xs">
                                <div class="bg-slate-950/80 border-2 border-amber-400/40 rounded-xl p-3 space-y-1.5 shadow-md">
                                    <div class="text-xs font-xianxia font-black text-yellow-300 flex items-center gap-1.5 drop-shadow">
                                        <i class="fa-solid fa-infinity text-yellow-400"></i> Thuộc Tính Vĩnh Viễn (Tầng ${curLvl})
                                    </div>
                                    <p class="text-xs text-white leading-relaxed font-sans font-medium">
                                        ${sk.effect || '+Tăng tu vi và chiến lực toàn diện.'}
                                    </p>
                                </div>

                                <div class="bg-indigo-950/70 border-2 border-sky-400/40 rounded-xl p-3 space-y-1 shadow-md">
                                    <div class="text-xs font-xianxia font-black text-sky-300 flex items-center gap-1.5 drop-shadow">
                                        <i class="fa-solid fa-wand-magic-sparkles text-sky-400"></i> Hiệu Ứng Khi Lắp Xuất Chiến
                                    </div>
                                    <p class="text-xs text-sky-100 leading-relaxed font-sans font-medium">
                                        ${sk.isPassive ? 'Kích hoạt 100% dòng kinh mạch, hỗ trợ hấp thu linh khí và hộ thể.' : 'Kích hoạt kỹ năng chiến đấu trong trận pháp, tung đòn đánh uy lực theo hệ ngũ hành.'}
                                    </p>
                                </div>

                                <p class="text-xs text-amber-200/90 italic font-serif px-1">
                                    "${sk.desc || 'Công pháp tuyệt truyền trong nhân gian, người hữu duyên mới có thể lĩnh hội.'}"
                                </p>
                            </div>

                            <!-- CƠ CHẾ TAM HỢP THAM NGỘ (10 TẦNG) -->
                            <div class="pt-3 space-y-3 flex-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-xianxia font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow">
                                        <i class="fa-solid fa-fire text-yellow-400"></i> Tam Hợp Tham Ngộ
                                    </span>
                                    <span class="text-xs font-mono font-black text-yellow-300 bg-black/60 px-2 py-0.5 rounded border border-yellow-400/50">
                                        Tầng ${curLvl}/10 • ${rankCfg.name}
                                    </span>
                                </div>

                                ${isMax ? `
                                    <div class="p-4 rounded-xl bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-yellow-400 text-center shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                                        <i class="fa-solid fa-crown text-3xl text-yellow-300 mb-1 animate-bounce drop-shadow"></i>
                                        <h4 class="font-xianxia font-black text-base text-yellow-200">HÓA CẢNH VIÊN MÃN (MAX)</h4>
                                        <p class="text-xs text-white mt-1 font-medium">Công pháp đã tu luyện tới cực hạn thiên đạo, uy lực đạt 100% tiềm năng!</p>
                                    </div>
                                ` : isBottleneck ? `
                                    <!-- Mốc Bình Cảnh Cần Tàn Quyển (3C) -->
                                    <div class="p-3.5 rounded-xl bg-gradient-to-b from-purple-950/80 via-slate-900/95 to-slate-950/98 border-2 border-purple-400 space-y-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="font-xianxia font-black text-purple-300 flex items-center gap-1.5 drop-shadow">
                                                <i class="fa-solid fa-lock-open text-purple-300"></i> Bình Cảnh Đột Phá (T${curLvl} ➜ T${curLvl + 1})
                                            </span>
                                            <span class="font-mono text-xs font-black ${ownedFrags >= reqFrags ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-400 px-2 py-0.5 rounded' : 'text-rose-300 bg-rose-950/60 border border-rose-400 px-2 py-0.5 rounded'}">
                                                🧩 ${ownedFrags}/${reqFrags} Tàn Quyển
                                            </span>
                                        </div>
                                        <p class="text-xs text-white font-sans font-medium leading-relaxed">
                                            Cần tiêu hao <b class="text-yellow-300">${reqFrags} Tàn Quyển [${sk.name}]</b> để dung hợp chân quyết, phá vỡ bình cảnh bước vào giai đoạn kế tiếp!
                                        </p>
                                        <button type="button"
                                                onclick="attemptBreakthroughSkillMastery('${sk.id}')"
                                                ${ownedFrags < reqFrags ? 'disabled' : ''}
                                                class="w-full py-3 px-3 rounded-xl ${ownedFrags >= reqFrags ? 'btn-cta-breakthrough cursor-pointer' : 'bg-slate-800 text-slate-400 border border-slate-600 cursor-not-allowed opacity-60'} uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-black shadow-lg">
                                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                                            <span>${ownedFrags >= reqFrags ? 'Đột Phá Bình Cảnh (100% Thành Công)' : `Thiếu ${reqFrags - ownedFrags} Tàn Quyển`}</span>
                                        </button>
                                    </div>
                                ` : `
                                    <!-- Nâng Tầng Thường Tiêu Hao Tu Vi (3A) & Tỷ Lệ (3B) -->
                                    <div class="p-3.5 rounded-xl bg-slate-950 border-2 border-amber-400/60 space-y-2.5 shadow-md">
                                        <!-- Tiêu Hao Tu Vi (3A) -->
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="text-sky-200 font-mono font-bold">Tiêu hao Tu Vi:</span>
                                            <span class="font-mono font-black text-xs ${playerExp >= reqExp ? 'text-yellow-300' : 'text-rose-400'}">
                                                ${reqExp.toLocaleString('vi-VN')} / ${playerExp.toLocaleString('vi-VN')}
                                            </span>
                                        </div>

                                        <!-- Xác Suất Thành Công & Pity (3B) -->
                                        <div class="flex items-center justify-between text-xs">
                                            <span class="text-sky-200 font-mono font-bold">Tỷ lệ đốn ngộ:</span>
                                            <span class="font-mono font-black text-sm text-emerald-300 flex items-center gap-1.5 drop-shadow">
                                                ${totalRate}%
                                                ${pity > 0 ? `<span class="text-xs text-yellow-300 font-bold">(+${pity}% Pity)</span>` : ''}
                                            </span>
                                        </div>

                                        <!-- Checkbox Ngộ Đạo Đan -->
                                        <label class="flex items-center gap-2.5 text-xs text-white font-medium cursor-pointer pt-2 border-t border-slate-700">
                                            <input type="checkbox"
                                                   ${useBreakthroughPill ? 'checked' : ''}
                                                   onchange="toggleUseBreakthroughPill()"
                                                   class="rounded accent-yellow-400 cursor-pointer w-4 h-4" />
                                            <span>Dùng Ngộ Đạo Đan (+25% Tỷ Lệ & Miễn Phản Phệ)</span>
                                        </label>

                                        ${!useBreakthroughPill ? `
                                            <p class="text-[11px] text-rose-300 font-mono font-bold">
                                                ⚠️ Thất bại tăng +2 Tâm Ma, giảm nhẹ HP (Thất bại nhận +15% Pity cảm ngộ).
                                            </p>
                                        ` : `
                                            <p class="text-[11px] text-sky-200 font-mono font-bold">
                                                🛡️ Đan khí hộ thể, thất bại không tổn thương thần hồn!
                                            </p>
                                        `}

                                        <button type="button"
                                                onclick="attemptUpgradeSkillMastery('${sk.id}')"
                                                ${playerExp < reqExp ? 'disabled' : ''}
                                                class="w-full mt-2 py-3 px-3 rounded-xl ${playerExp >= reqExp ? 'btn-cta-fire cursor-pointer' : 'bg-slate-800 text-slate-400 border border-slate-600 cursor-not-allowed opacity-60'} uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 text-xs font-black shadow-lg">
                                            <i class="fa-solid fa-fire text-sm"></i>
                                            <span>Tham Ngộ Lên Tầng ${curLvl + 1}</span>
                                        </button>
                                    </div>
                                `}
                            </div>
                        `;
                    })()}
                </div>
            </div>
        </div>
    `;
}
window.renderSkillsHub = renderSkillsHub;


// ==========================================
// 4.16. HỆ THỐNG DỊ TƯỢNG THIÊN ĐỊA (CELESTIAL OMENS SYSTEM)
// ==========================================
function openCelestialOmenModal() {
    const backdrop = document.getElementById('celestial-omen-modal');
    if (!backdrop) return;
    if (typeof hideAllGamePages === 'function') {
        hideAllGamePages('celestial-omen-modal');
    }
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex', 'active');
    backdrop.style.display = 'flex';
    renderCelestialOmenModal();
}
window.openCelestialOmenModal = openCelestialOmenModal;

function closeCelestialOmenModal() {
    const backdrop = document.getElementById('celestial-omen-modal');
    if (backdrop) {
        backdrop.style.display = 'none';
        backdrop.classList.add('hidden');
        backdrop.classList.remove('flex', 'active');
    }
}
window.closeCelestialOmenModal = closeCelestialOmenModal;

function renderCelestialOmenModal() {
    const body = document.getElementById('celestial-omen-modal-body');
    if (!body) return;
    const list = typeof CELESTIAL_OMENS_CONFIG !== 'undefined' ? CELESTIAL_OMENS_CONFIG : [];
    const curId = state.celestialOmen?.currentOmenId || 'tu_khi_dong_lai';
    const activeOmen = list.find(o => o.id === curId) || list[0];
    const remSec = Math.max(0, Math.ceil(((state.celestialOmen?.changeAt || 0) - Date.now()) / 1000));
    const m = Math.floor(remSec / 60);
    const s = remSec % 60;

    body.innerHTML = `
        <!-- Dị Tượng Đang Hiển Hiện -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border ${activeOmen.border} shadow-[0_0_20px_${activeOmen.ambientAura || 'rgba(168,85,247,0.2)'}] space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold uppercase tracking-wider">
                    ⚡ Đang Hiển Hiện
                </span>
                <span class="text-xs font-mono text-amber-300 font-bold">
                    Duy trì còn: ${m}:${s < 10 ? '0' : ''}${s}
                </span>
            </div>

            <div class="flex items-center gap-3.5">
                <div class="w-14 h-14 rounded-2xl ${activeOmen.bg} border ${activeOmen.border} flex items-center justify-center ${activeOmen.color} text-2xl shadow-lg shrink-0">
                    <i class="fa-solid ${activeOmen.icon}"></i>
                </div>
                <div>
                    <h3 class="font-serif font-bold text-slate-100 text-lg">${activeOmen.name}</h3>
                    <p class="text-xs text-slate-300 mt-0.5">${activeOmen.desc}</p>
                </div>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-emerald-300 font-medium flex items-center gap-2">
                <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                <span>Gia trì thiên đạo: <b>${activeOmen.buffDesc}</b></span>
            </div>
        </div>

        <!-- Khai Đàn Cầu Thiên (Danh Sách Dị Tượng) -->
        <div class="space-y-2.5 pt-2">
            <div class="flex justify-between items-center">
                <h4 class="font-serif font-bold text-sm text-slate-200">🔮 KHAI ĐÀN KỲ PHÚC • CẦU THIÊN ĐIỀM LÀNH</h4>
                <span class="text-[10px] text-slate-400">Hiến tế tế phẩm để triệu hồi Dị Tượng trong 30 phút</span>
            </div>

            <div class="space-y-2">
                ${list.map(omen => {
                    const isCurrent = omen.id === curId;
                    return `
                        <div class="p-3 rounded-xl bg-slate-950/80 border ${isCurrent ? 'border-purple-500/50 bg-purple-950/15' : 'border-slate-800'} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl ${omen.bg} border ${omen.border} flex items-center justify-center ${omen.color} text-lg shrink-0">
                                    <i class="fa-solid ${omen.icon}"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h5 class="font-bold text-slate-100 text-sm font-serif">${omen.name}</h5>
                                        <span class="text-[10px] text-slate-400 font-mono">${omen.tag}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-400">${omen.buffDesc}</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 shrink-0">
                                ${isCurrent ? `
                                    <span class="px-3 py-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono">
                                        ✓ Đang Áp Dụng
                                    </span>
                                ` : `
                                    <button type="button" onclick="prayForCelestialOmen('${omen.id}', false)" class="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-xs font-medium transition cursor-pointer">
                                        8K LT
                                    </button>
                                    <button type="button" onclick="prayForCelestialOmen('${omen.id}', true)" class="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 text-xs font-medium transition cursor-pointer">
                                        💎 50 Ngọc
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
window.renderCelestialOmenModal = renderCelestialOmenModal;

function prayForCelestialOmen(omenId, useJade = false) {
    const list = typeof CELESTIAL_OMENS_CONFIG !== 'undefined' ? CELESTIAL_OMENS_CONFIG : [];
    const omen = list.find(o => o.id === omenId);
    if (!omen) return;

    if (useJade) {
        if ((state.immortalJade || 0) < 50) {
            addLog(`Không đủ Tiên Ngọc để khai đàn cầu thiên (Cần 50 Tiên Ngọc).`, 'text-rose-400');
            return;
        }
        state.immortalJade -= 50;
    } else {
        if ((state.stones || 0) < 8000) {
            addLog(`Không đủ Linh Thạch để khai đàn cầu thiên (Cần 8,000 Linh Thạch).`, 'text-rose-400');
            return;
        }
        state.stones -= 8000;
    }

    state.celestialOmen = {
        currentOmenId: omenId,
        changeAt: Date.now() + 1800000 // 30 phút
    };

    if (typeof playSound === 'function') playSound('victory');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Dị Tượng: ${omen.name}!`, 'text-purple-300');
    }
    addLog(`✨ Bản Tôn khai đàn kỳ phúc! Triệu hoán Dị Tượng <b class="text-purple-300">[${omen.name}]</b> giáng thế thành công!`, 'text-purple-300 font-bold');

    updateHUD();
    saveGameState();
    renderCelestialOmenModal();
}
window.prayForCelestialOmen = prayForCelestialOmen;

function advanceCelestialOmen() {
    const list = typeof CELESTIAL_OMENS_CONFIG !== 'undefined' ? CELESTIAL_OMENS_CONFIG : [];
    if (!list.length) return;
    const curId = state.celestialOmen?.currentOmenId || 'tu_khi_dong_lai';
    const curIdx = list.findIndex(o => o.id === curId);
    const nextIdx = (curIdx + 1) % list.length;
    const nextOmen = list[nextIdx];

    state.celestialOmen = {
        currentOmenId: nextOmen.id,
        changeAt: Date.now() + 1200000 // 20 phút
    };

    if (typeof playSound === 'function') playSound('bell');
    addLog(`⚡ [Thiên Tượng Biến Huyễn] Càn khôn biến ảo, dị tượng <b class="text-purple-300">[${nextOmen.name}]</b> giáng lâm chư giới! ${nextOmen.buffDesc}`, 'text-purple-300 font-bold');
    updateHUD();
    saveGameState();
    const modal = document.getElementById('celestial-omen-modal');
    if (modal && !modal.classList.contains('hidden')) {
        renderCelestialOmenModal();
    }
}
window.advanceCelestialOmen = advanceCelestialOmen;
function selectBackground(index) {
    state.bgIndex = index;
    const bgConfig = (typeof BACKGROUNDS !== 'undefined' && BACKGROUNDS[state.bgIndex]) || BACKGROUNDS[0];
    const bgEl = document.getElementById('scene-background');
    if (bgEl && bgConfig) {
        bgEl.className = `fixed inset-0 z-0 transition-all duration-1000 bg-gradient-to-b ${bgConfig.classes} overflow-hidden`;
    }
    const targetBgImg = (bgConfig?.image && !bgConfig.image.includes('image_21.png')) ? bgConfig.image : './assets/images/bg_hagioi_co.png';
    const bgArtEl = document.getElementById('scene-bg-art');
    if (bgArtEl) {
        bgArtEl.style.backgroundImage = `url('${targetBgImg}')`;
        bgArtEl.style.backgroundSize = 'cover';
        bgArtEl.style.backgroundPosition = 'center bottom';
    }
    const worldEnv = document.getElementById('world-environment');
    if (worldEnv) {
        worldEnv.style.backgroundImage = `url('${targetBgImg}')`;
        worldEnv.style.backgroundSize = 'cover';
        worldEnv.style.backgroundPosition = 'center bottom';
    }
    updateHUD();
    renderDrawerContent('cave');
}
function harvestPlot(plotId, isAuto = false) {
            if (rejectLockedFeature('btn_linh_dien', isAuto)) return;
            const plot = state.farmPlots.find(p => p.id === plotId);
            if (!plot || plot.progress < 100 || !plot.herbId) return;

            const herb = state.inventory.find(i => i.id === plot.herbId);
            const woodBonus = 1 + getPillarLevel('wood') * 0.02 * getPillarEfficiency('wood');
            const harvestCount = Math.max(2, Math.floor(2 * woodBonus));
            if (herb) herb.count += harvestCount;

            plot.progress = 0;
            addLog(`${isAuto ? '[Tự động] ' : ''}Thu hoạch <span class="text-emerald-400 font-semibold">${harvestCount} ${plot.herbName}</span> từ Linh Điền.`, 'reward', 'harvest-' + (plot.herbId || plotId));
            maybeAddM1ContextLog('farm');
            if (activeDrawer === 'farm') renderDrawerContent('farm');
        }
function plantSeed(plotId, herbId, herbName, speed) {
            if (rejectLockedFeature('btn_linh_dien')) return;
            const plot = state.farmPlots.find(p => p.id === plotId);
            if (!plot) return;
            plot.herbId = herbId;
            plot.herbName = herbName;
            plot.progress = 10;
            plot.speed = speed;
            renderDrawerContent('farm');
        }
function craftPill(pillId, herbId, requiredCount, isAuto = false) {
            if (rejectLockedFeature('btn_lo_dan', isAuto)) return;
            const herb = state.inventory.find(i => i.id === herbId);
            if (!herb || herb.count < requiredCount) {
                if (!isAuto) {
                    addLog("Không đủ linh thảo để khai lò luyện đan!", "text-rose-400");
                }
                return;
            }
            herb.count -= requiredCount;
            const successChance = Math.min(0.95, 0.7 + getPillarLevel('fire') * 0.02 * getPillarEfficiency('fire'));
            if (Math.random() > successChance) {
                playSound('thunder');
                addLog(`${isAuto ? '[Tự động] ' : ''}💨 Lửa lò bất ổn, mẻ đan thất bại (${Math.round(successChance * 100)}% tỷ lệ thành đan).`, "text-rose-400");
                renderDrawerContent('alchemy');
                return;
            }
            const qualityBonus = Math.random() < getPillarLevel('fire') * 0.02 ? 1 : 0;
            const yieldCount = 1 + qualityBonus;
            addItemToInventory(pillId, yieldCount);
            const pill = state.inventory.find(i => i.id === pillId);
            const pillName = pill?.name || (typeof BREAKTHROUGH_PILLS !== 'undefined' && BREAKTHROUGH_PILLS.find(p => p.id === pillId)?.name) || pillId;

            playSound('bell');
            addLog(`${isAuto ? '[Tự động] ' : ''}🔥 Hương đan tỏa ngát! Luyện chế thành công <span class="text-gold-300 font-semibold">${yieldCount} ${pillName}</span>.`, 'reward', 'craft-' + pillId);
            maybeAddM1ContextLog('alchemy');
            renderDrawerContent('alchemy');
        }
function claimSectSalary() {
            if (rejectLockedFeature('btn_tong_mon')) return;
            state.stones += 120;
            playSound('qi');
            updateHUD();
            addLog(`Nhận bổng lộc Tông Môn <span class="text-gold-300 font-semibold">+120 Linh Thạch</span>.`);
        }
function buyMarketItem(itemId, shopType = ensureMarketState().activeTab, quantity = 1) {
            return applyMarketResponse(buy_item(itemId, shopType, quantity));
        }
function sellItem(itemId, count = 1) {
            return applyMarketResponse(sell_item(itemId, count));
        }
function dualCultivate(daolvId) {
            if (rejectLockedFeature('btn_dao_lu')) return;
            const comp = state.companions.find(c => c.id === daolvId);
            if (!comp) return;
            addExp(comp.gainTuvi);
            comp.affinity = Math.min(100, comp.affinity + 2);
            playSound('bell');
            pulseCharacterSprite();
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, `Song Tu +${comp.gainTuvi} EXP!`, "text-pink-300");
            addLog(`Cùng <span class="text-pink-300 font-bold">${comp.name}</span> song tu vận chuyển đại chu thiên, hấp thu <span class="text-jade-300 font-bold">+${comp.gainTuvi} Tu Vi</span>!`, "text-pink-200");
            updateHUD();
            renderDrawerContent('companion');
        }
function giftCompanion(daolvId) {
            if (rejectLockedFeature('btn_dao_lu')) return;
            const comp = state.companions.find(c => c.id === daolvId);
            if (!comp) return;
            const herb = state.inventory.find(i => (i.id === 'herb_spirit' || i.id === 'herb_blood') && i.count > 0);
            if (herb) {
                herb.count--;
                comp.affinity = Math.min(100, comp.affinity + 6);
                playSound('qi');
                addLog(`Tặng 1 ${herb.name} cho <span class="text-pink-300 font-bold">${comp.name}</span>, hảo cảm tăng <span class="text-pink-400 font-bold">+6</span>!`, "text-pink-300");
            } else if (state.stones >= 30) {
                state.stones -= 30;
                comp.affinity = Math.min(100, comp.affinity + 4);
                playSound('qi');
                addLog(`Mua trâm ngọc tặng <span class="text-pink-300 font-bold">${comp.name}</span>, hảo cảm tăng <span class="text-pink-400 font-bold">+4</span>!`, "text-pink-300");
            } else {
                addLog(`Không có dược liệu và không đủ Linh Thạch để tặng quà!`, "text-rose-400");
                return;
            }
            updateHUD();
            renderDrawerContent('companion');
        }
function closeCenterModal() {
            if (combatTimer) {
                clearInterval(combatTimer);
                combatTimer = null;
            }
            if (typeof sectCombatTimer !== 'undefined' && sectCombatTimer) {
                clearInterval(sectCombatTimer);
                sectCombatTimer = null;
            }
            if (window._minorBreakthroughInterval) {
                clearInterval(window._minorBreakthroughInterval);
                window._minorBreakthroughInterval = null;
                minorBreakthroughInProgress = false;
            }
            const backdrop = document.getElementById('center-modal-backdrop');
            if (backdrop) {
                backdrop.style.display = 'none';
                backdrop.classList.add('hidden');
                backdrop.classList.remove('flex', 'active');
            }
        }
// ==========================================
// HỆ THỐNG ĐỘT PHÁ TIỂU CẢNH GIỚI (MINOR BREAKTHROUGH)
// ==========================================
let minorBreakthroughInProgress = false;
let selectedMinorPillId = 'none';

function triggerBreakthroughRipple() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = document.createElement('div');
    container.className = 'breakthrough-ripple-container';
    container.innerHTML = `
        <div class="breakthrough-ripple-wave"></div>
        <div class="breakthrough-ripple-wave"></div>
        <div class="breakthrough-ripple-wave"></div>
    `;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 2200);
}

function openMinorBreakthroughModal() {
    if (rejectLockedFeature('btn_dot_pha')) return;
    const currentRealm = REALMS[state.realmIndex];
    const nextRealm = REALMS[state.realmIndex + 1];
    if (!nextRealm || currentRealm.isMajorBottleneck || state.exp < currentRealm.maxExp) return;

    // Kiểm tra khí huyết tối thiểu (ít nhất 15% Max HP) để tránh nội thương tử vong
    const effectiveStats = (typeof getEffectiveStats === 'function') ? getEffectiveStats() : { maxHp: state.maxHp || 1000 };
    const minHpRequired = Math.floor(effectiveStats.maxHp * 0.15);
    if ((state.hp || 0) < minHpRequired) {
        addLog(`⚠️ <span class="text-rose-400 font-bold">[Nội Thương Nghiêm Trọng]</span> Khí huyết suy kiệt (${(state.hp || 0).toLocaleString('vi-VN')}/${effectiveStats.maxHp.toLocaleString('vi-VN')} HP), không thể xung kích! Hãy điều tức hoặc dùng đan dược trị thương trước.`, 'text-rose-400');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Khí huyết suy kiệt, cần trị thương!", "text-rose-400 font-bold text-sm");
        return;
    }

    const modal = document.getElementById('minor-breakthrough-modal');
    if (!modal) return;

    document.getElementById('minor-current-realm').textContent = currentRealm.name;
    document.getElementById('minor-next-realm').textContent = nextRealm.name;

    const baseRate = currentRealm.baseChance || 80;
    document.getElementById('minor-base-rate').textContent = `${baseRate}%`;

    const select = document.getElementById('minor-pill-select');
    let optionsHtml = '<option value="none">-- Không dùng đan dược (+0%) --</option>';
    if (typeof MINOR_BREAKTHROUGH_PILLS !== 'undefined') {
        MINOR_BREAKTHROUGH_PILLS.forEach(p => {
            const item = state.inventory.find(i => i.id === p.id);
            const count = item ? item.count : 0;
            if (count > 0) {
                optionsHtml += `<option value="${p.id}">${p.name} (+${p.bonusChance}%) · Còn: ${count}</option>`;
            }
        });
    }
    select.innerHTML = optionsHtml;
    selectedMinorPillId = 'none';
    select.value = 'none';
    select.disabled = false;

    document.getElementById('minor-progress-container').classList.add('hidden');
    const progressBarFill = document.getElementById('minor-progress-bar-fill');
    if (progressBarFill) progressBarFill.style.width = '0%';
    const execBtn = document.getElementById('btn-execute-minor-breakthrough');
    if (execBtn) execBtn.disabled = false;
    document.getElementById('btn-execute-minor-text').textContent = 'Bắt Đầu Xung Kích';
    document.getElementById('minor-breakthrough-close-btn').disabled = false;

    updateMinorRateDisplay();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
}

function closeMinorBreakthroughModal() {
    if (minorBreakthroughInProgress) return;
    const modal = document.getElementById('minor-breakthrough-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function onMinorPillSelectChange() {
    const select = document.getElementById('minor-pill-select');
    selectedMinorPillId = select ? select.value : 'none';
    updateMinorRateDisplay();
}

function updateMinorRateDisplay() {
    const currentRealm = REALMS[state.realmIndex];
    const baseRate = currentRealm ? (currentRealm.baseChance || 80) : 80;
    let pillBonus = 0;
    if (selectedMinorPillId && selectedMinorPillId !== 'none' && typeof MINOR_BREAKTHROUGH_PILLS !== 'undefined') {
        const found = MINOR_BREAKTHROUGH_PILLS.find(p => p.id === selectedMinorPillId);
        if (found) pillBonus = found.bonusChance;
    }
    const rootBonus = (typeof getRootTier === 'function' && getRootTier()?.breakthroughBonus) || 0;
    const tamMaVal = state.tamMa != null ? state.tamMa : Math.max(0, 100 - (state.daoTam ?? 100));
    const totalRate = Math.max(5, Math.min(100, baseRate + pillBonus + rootBonus - tamMaVal));

    const pillBonusEl = document.getElementById('minor-pill-bonus');
    if (pillBonusEl) pillBonusEl.textContent = pillBonus > 0 ? `+${pillBonus}%` : '+0%';

    const totalRateEl = document.getElementById('minor-total-rate');
    if (totalRateEl) {
        if (tamMaVal > 0) {
            totalRateEl.innerHTML = `${totalRate}% <span class="text-xs text-rose-400 font-normal">(-${tamMaVal}% Tâm Ma)</span>`;
        } else {
            totalRateEl.textContent = `${totalRate}%`;
        }
    }
}

function startMinorBreakthrough() {
    if (minorBreakthroughInProgress) return;
    const currentRealm = REALMS[state.realmIndex];
    const nextRealm = REALMS[state.realmIndex + 1];
    if (!nextRealm || currentRealm.isMajorBottleneck || state.exp < currentRealm.maxExp) return;

    // Kiểm tra khí huyết tối thiểu (ít nhất 15% Max HP) để tránh nội thương tử vong
    const effectiveStats = (typeof getEffectiveStats === 'function') ? getEffectiveStats() : { maxHp: state.maxHp || 1000 };
    const minHpRequired = Math.floor(effectiveStats.maxHp * 0.15);
    if ((state.hp || 0) < minHpRequired) {
        addLog(`⚠️ <span class="text-rose-400 font-bold">[Nội Thương Nghiêm Trọng]</span> Khí huyết suy kiệt (${(state.hp || 0).toLocaleString('vi-VN')}/${effectiveStats.maxHp.toLocaleString('vi-VN')} HP), không thể xung kích! Hãy điều tức hoặc dùng đan dược trị thương trước.`, 'text-rose-400');
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Khí huyết suy kiệt, cần trị thương!", "text-rose-400 font-bold text-sm");
        return;
    }

    minorBreakthroughInProgress = true;
    window.minorBreakthroughInProgress = true;

    const select = document.getElementById('minor-pill-select');
    if (select) select.disabled = true;
    const execBtn = document.getElementById('btn-execute-minor-breakthrough');
    if (execBtn) execBtn.disabled = true;
    const closeBtn = document.getElementById('minor-breakthrough-close-btn');
    if (closeBtn) closeBtn.disabled = true;
    document.getElementById('btn-execute-minor-text').textContent = 'Đang Xung Kích...';

    const progressContainer = document.getElementById('minor-progress-container');
    if (progressContainer) progressContainer.classList.remove('hidden');

    const progressBarFill = document.getElementById('minor-progress-bar-fill');
    const countdown = document.getElementById('minor-progress-countdown');

    // Chạy thanh Progress bar 3 giây
    const duration = 3000;
    const startTime = Date.now();
    playSound('bell');

    if (window._minorBreakthroughInterval) {
        clearInterval(window._minorBreakthroughInterval);
        window._minorBreakthroughInterval = null;
    }
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        if (progressBarFill) progressBarFill.style.width = `${progress}%`;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (countdown) countdown.textContent = `${remaining.toFixed(1)}s`;

        if (elapsed >= duration) {
            clearInterval(interval);
            window._minorBreakthroughInterval = null;

            // Tiêu hao đan dược phụ trợ nếu có chọn
            if (selectedMinorPillId && selectedMinorPillId !== 'none') {
                const pillItem = state.inventory.find(i => i.id === selectedMinorPillId);
                if (pillItem && pillItem.count > 0) {
                    pillItem.count--;
                }
            }

            // Tính tỷ lệ thành công (Tâm ma làm tăng tỷ lệ thất bại)
            const baseRate = currentRealm.baseChance || 80;
            let pillBonus = 0;
            if (selectedMinorPillId && selectedMinorPillId !== 'none' && typeof MINOR_BREAKTHROUGH_PILLS !== 'undefined') {
                const found = MINOR_BREAKTHROUGH_PILLS.find(p => p.id === selectedMinorPillId);
                if (found) pillBonus = found.bonusChance;
            }
            const rootBonus = (typeof getRootTier === 'function' && getRootTier()?.breakthroughBonus) || 0;
            const tamMaVal = state.tamMa != null ? state.tamMa : Math.max(0, 100 - (state.daoTam ?? 100));
            const totalRate = Math.max(5, Math.min(100, baseRate + pillBonus + rootBonus - tamMaVal));
            const roll = Math.random() * 100;

            minorBreakthroughInProgress = false;
            window.minorBreakthroughInProgress = false;

            if (roll <= totalRate) {
                // THÀNH CÔNG: Sóng âm tỏa ra (Ripple effect), text "Đột phá thành công", update cảnh giới & mở rộng Tu Vi Max
                closeMinorBreakthroughModal();
                triggerBreakthroughRipple();
                if (typeof playBreakthroughSuccess === 'function') {
                    playBreakthroughSuccess();
                } else {
                    playSound('bell');
                }

                const prevRealm = REALMS[state.realmIndex];
                state.realmIndex++;
                if (state.level !== undefined) state.level++;
                else state.level = state.realmIndex + 1;
                if (typeof triggerLevelUpAura === 'function') triggerLevelUpAura();
                state.exp = Math.max(0, state.exp - prevRealm.maxExp);
                applyRealmBaseStats(REALMS[state.realmIndex]);
                const newlyReached = REALMS[state.realmIndex];
                if (typeof updateCharacterModel === 'function') {
                    updateCharacterModel(newlyReached.themeKey || state.realmIndex);
                }

                spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 70, "ĐỘT PHÁ THÀNH CÔNG!", "text-gold-300 font-extrabold text-base");
                addLog(`✨ <span class="text-jade-300 font-bold">[Đột Phá Thành Công]</span> Kinh mạch khai thông, thành công tấn cấp <span class="text-gold-300 font-bold">${newlyReached.name}</span>!`, "text-emerald-300");

                checkHeavenlySuppression(state);

                updateHUD();
                saveGameState();
            } else {
                // ============================================================
                // THẤT BẠI: "TẨU HỎA NHẬP MA" KHI XUNG KÍCH BÌNH CẢNH
                // ============================================================
                closeMinorBreakthroughModal();
                playSound('qi');

                // 1. Trừ 10% Tu vi hiện tại
                const lostExp = Math.floor(state.exp * 0.10);
                state.exp = Math.max(0, state.exp - lostExp);
                if (state.currentExp !== undefined) {
                    state.currentExp = Math.max(0, state.currentExp - lostExp);
                }

                // 2. Trừ thẳng 10% HP hiện tại (Khí huyết tổn hao do nội thương)
                const curHp = (state.hp !== undefined) ? state.hp : (effectiveStats.maxHp || 1000);
                const lostHp = Math.max(1, Math.floor(curHp * 0.10));
                state.hp = Math.max(1, curHp - lostHp);

                // 3. Kích hoạt toàn bộ Visual Feedback:
                // - Canvas Filter (Huyết Quang) 0.5s
                // - Rung chấn Container Avatar (.animate-shake)
                // - Floating Text sinh ra từ tọa độ nhân vật: "Khí huyết đảo nghịch!" / "-10% Tu Vi"
                triggerMinorBreakthroughFailureVFX();

                addLog(`💥 <span class="text-rose-400 font-bold">[Khí Huyết Đảo Nghịch]</span> Tẩu hỏa nhập ma! Đột phá thất bại, chân nguyên hỗn loạn, tổn thất 10% Tu Vi (-${formatCultivationNumber(lostExp)}) và 10% Khí Huyết (-${lostHp.toLocaleString('vi-VN')} HP).`, "text-rose-400");

                updateHUD();
                saveGameState();
            }
        }
    }, 50);
}

/**
 * Hiệu ứng "TẨU HỎA NHẬP MA" khi Xung Kích Bình Cảnh (Tiểu Cảnh Giới) Thất Bại:
 * 1. Canvas Filter (Huyết Quang): Class CSS làm Canvas lóe đỏ sẫm trong 0.5s.
 * 2. Rung chấn (Screen Shake): Gắn class animate-shake vào Container Avatar nhân vật.
 * 3. Sát thương bay (Floating Text): Sinh ra từ tọa độ nhân vật:
 *    - Dòng 1: "Khí huyết đảo nghịch!" (Màu đỏ sậm, text nhỏ)
 *    - Dòng 2: "-10% Tu Vi" (Màu đỏ tươi, text to, đậm)
 */
function triggerMinorBreakthroughFailureVFX() {
    // 1. Canvas Filter (Huyết Quang): Áp dụng class CSS làm Canvas / vùng nhân vật lóe đỏ sẫm trong 0.5s
    const canvasTargets = [
        document.getElementById('qi-canvas'),
        document.getElementById('hero-stage'),
        document.getElementById('scene-background')
    ].filter(Boolean);

    canvasTargets.forEach(el => el.classList.add('canvas-blood-filter'));

    let bloodOverlay = null;
    if (typeof document !== 'undefined' && document.body) {
        bloodOverlay = document.createElement('div');
        bloodOverlay.className = 'blood-vignette-overlay';
        document.body.appendChild(bloodOverlay);
    }

    setTimeout(() => {
        canvasTargets.forEach(el => el.classList.remove('canvas-blood-filter'));
        if (bloodOverlay && bloodOverlay.parentNode) {
            bloodOverlay.parentNode.removeChild(bloodOverlay);
        }
    }, 500);

    // 2. Rung chấn (Screen Shake): Gắn class animate-shake vào Container của Avatar nhân vật
    const charWrap = typeof document !== 'undefined'
        ? (document.getElementById('character-sprite-wrap') || document.querySelector('.relative.w-72.h-72') || document.getElementById('hero-stage'))
        : null;

    if (charWrap) {
        charWrap.classList.remove('animate-shake');
        void charWrap.offsetWidth; // Force reflow
        charWrap.classList.add('animate-shake');
        setTimeout(() => {
            if (charWrap) charWrap.classList.remove('animate-shake');
        }, 500);
    }

    // 3. Sát thương bay (Floating Text): Sinh ra từ tọa độ nhân vật
    let originX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
    let originY = typeof window !== 'undefined' ? window.innerHeight / 2 - 20 : 200;

    if (charWrap && typeof charWrap.getBoundingClientRect === 'function') {
        const rect = charWrap.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 3;
    }

    spawnBackfireFloatingText(originX, originY);
}

function spawnBackfireFloatingText(x, y) {
    if (typeof document === 'undefined') return;

    const container = document.createElement('div');
    container.className = 'floating-backfire-container pointer-events-none fixed z-50 flex flex-col items-center select-none';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;

    // Dòng 1 (Màu đỏ sậm, text nhỏ): "Khí huyết đảo nghịch!"
    const line1 = document.createElement('div');
    line1.className = 'floating-backfire-line1';
    line1.textContent = 'Khí huyết đảo nghịch!';

    // Dòng 2 (Màu đỏ tươi, text to, đậm): "-10% Tu Vi"
    const line2 = document.createElement('div');
    line2.className = 'floating-backfire-line2';
    line2.textContent = '-10% Tu Vi';

    container.appendChild(line1);
    container.appendChild(line2);

    if (document.body) {
        document.body.appendChild(container);
    }

    setTimeout(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }, 1400);
}

function testMinorBreakthroughFailure() {
    triggerMinorBreakthroughFailureVFX();
    if (typeof addLog === 'function') {
        addLog('💥 <span class="text-rose-400 font-bold">[Tẩu Hỏa Nhập Ma - Test]</span> Khí huyết đảo nghịch! Tổn hao 10% Tu Vi và 10% Khí Huyết.', 'text-rose-400');
    }
}
window.testMinorBreakthroughFailure = testMinorBreakthroughFailure;
window.triggerMinorBreakthroughFailureVFX = triggerMinorBreakthroughFailureVFX;
window.spawnBackfireFloatingText = spawnBackfireFloatingText;

function handleMainCultivationAction(event) {
    const currentRealm = REALMS[state.realmIndex];
    if (!currentRealm) return;
    
    // Nếu chưa chạm trần tu vi (chưa đến bình cảnh): Không thao tác thủ công
    if (state.exp < currentRealm.maxExp) {
        return;
    }

    const isHaGioi = !state.currentWorld || state.currentWorld === 'HaGioi' || String(state.currentWorld).includes('Hạ Giới');
    const isHoaThanVienMan = currentRealm.name === 'Hóa Thần - Viên Mãn' || (currentRealm.majorRealm === 'Hóa Thần' && currentRealm.minorStage === 'Viên Mãn') || state.realmIndex >= REALMS.length - 1;

    // CƯỠNG CHẾ PHI THĂNG (Khi chạm đỉnh cao Hạ Giới)
    if (isHardCapReached() || (isHaGioi && isHoaThanVienMan)) {
        if (typeof startTribulation === 'function') {
            startTribulation('PhiThang');
        } else if (typeof startTribulationCutscene === 'function') {
            startTribulationCutscene('PhiThang');
        }
        return;
    }

    // Đỉnh phong Thượng Giới
    if (state.realmIndex >= REALMS.length - 1) {
        addLog("✨ <span class='text-emerald-300 font-bold'>[Đại Đạo Đỉnh Phong]</span> Đạo hữu đã đạt cảnh giới tối cao hiện tại.", "text-emerald-300");
        return;
    }

    // Đột phá tiểu hoặc đại cảnh giới
    if (currentRealm.isMajorBottleneck) {
        openBreakthroughModal();
    } else {
        openMinorBreakthroughModal();
    }
}

// ==========================================
// CỬU TIÊU LÔI KIẾP CUTSCENE ĐỘNG (MAJOR TRIBULATION SURVIVAL UI)
// ==========================================
let cutsceneState = {
    inProgress: false,
    wave: 1,
    shieldActive: false,
    pillConsumed: false,
    breathActive: false,
    playerHp: 100,
    totalDamage: 0,
    totalChance: 70,
    tribConfig: null
};
if (typeof window !== 'undefined') {
    window.cutsceneState = cutsceneState;
}

function getMajorTribulationConfig(target_realm) {
    if (typeof getTribulationConfig === 'function') {
        const cfg = getTribulationConfig(target_realm);
        return {
            target: cfg.targetName,
            title: cfg.name,
            name: cfg.name,
            targetName: cfg.targetName,
            total_strikes: cfg.totalBolts,
            totalBolts: cfg.totalBolts,
            lightning_color: cfg.lightningColor,
            lightningColor: cfg.lightningColor,
            flavorText: cfg.flavorText || "Thiên đạo bất nhân, dĩ vạn vật vi sô cẩu! Đạo nhân ta quyết nghịch thiên cải mệnh!",
            flash_color: cfg.flashColor || (cfg.totalBolts <= 3 ? "rgba(96, 165, 250, 0.9)" : (cfg.totalBolts <= 18 ? "rgba(250, 204, 21, 0.9)" : "rgba(168, 85, 247, 0.9)")),
            hex_color: cfg.hexColor || (cfg.totalBolts <= 3 ? "#60a5fa" : (cfg.totalBolts <= 18 ? "#facc15" : "#a855f7")),
            glow_color: cfg.glowColor || (cfg.totalBolts <= 3 ? "rgba(96, 165, 250, 0.65)" : (cfg.totalBolts <= 18 ? "rgba(250, 204, 21, 0.65)" : "rgba(168, 85, 247, 0.65)")),
            damage_multiplier: cfg.damageMultiplier || (cfg.totalBolts <= 3 ? 1.0 : (cfg.totalBolts <= 18 ? 2.5 : 5.0)),
            strikes_per_wave: cfg.totalBolts <= 3 ? 1 : Math.max(1, Math.round(cfg.totalBolts / 3))
        };
    }
    return {
        target: "Trúc Cơ - Sơ Kỳ",
        title: "Tam Đạo Thiên Kiếp",
        name: "Tam Đạo Thiên Kiếp",
        targetName: "Trúc Cơ - Sơ Kỳ",
        total_strikes: 3,
        totalBolts: 3,
        lightning_color: "text-blue-400",
        lightningColor: "text-blue-400",
        flavorText: "Tụ khí đan điền, phạt cốt tẩy tủy, Trúc Cơ đại thành!",
        flash_color: "rgba(96, 165, 250, 0.9)",
        hex_color: "#60a5fa",
        glow_color: "rgba(96, 165, 250, 0.65)",
        damage_multiplier: 1.0,
        strikes_per_wave: 1
    };
}
window.getMajorTribulationConfig = getMajorTribulationConfig;

function renderTribulationCutscene(target_realm) {
    const config = typeof getTribulationConfig === 'function' ? getTribulationConfig(target_realm) : tribulationConfig.TrucCo;

    if (cutsceneState) {
        cutsceneState.config = config;
        cutsceneState.totalBolts = config.totalBolts;
        cutsceneState.totalStrikes = config.totalBolts;
    }

    const currentBolt = (cutsceneState && cutsceneState.currentStrike) || 1;

    // 1. Thay đổi Header text: `${config.name} • ĐỘT PHÁ: ${config.targetName}`
    const headerTitle = document.getElementById('cutscene-header-title');
    if (headerTitle) {
        headerTitle.textContent = `${config.name} • ĐỘT PHÁ: ${config.targetName}`;
    }
    const trialLabel = document.getElementById('cutscene-trial-label');
    if (trialLabel) {
        trialLabel.textContent = config.name;
        trialLabel.className = `${config.lightningColor} font-black`;
    }
    const realmTarget = document.getElementById('cutscene-realm-target');
    if (realmTarget) {
        realmTarget.textContent = `ĐỘT PHÁ: ${config.targetName}`;
    }

    // 2. Số lượng Icon tia sét (⚡) trên trời: Render vòng lặp sinh ra đúng bằng config.totalBolts (9, 18, 27, 54)
    const row = document.getElementById('lightning-icons-row');
    if (row) {
        const total = config.totalBolts;
        const isCompact = total > 18;
        let html = '';
        for (let i = 1; i <= total; i++) {
            const statusClass = i === currentBolt ? 'is-current' : (i < currentBolt ? 'is-done' : 'is-ready');
            html += `<span id="trib-strike-${i}" class="trib-strike-icon ${statusClass} ${isCompact ? 'trib-strike-sm' : ''}" title="Đạo thứ ${i} / ${total}">
                <i class="fa-solid fa-bolt-lightning"></i>
            </span>`;
        }
        row.innerHTML = html;
    }

    // 3. Nút bấm: Render text `ĐÓN LÔI KIẾP (${currentBolt} / ${config.totalBolts})` từ CÙNG MỘT NGUỒN CẤU HÌNH
    const triggerBtn = document.getElementById('trigger-wave-text');
    if (triggerBtn) {
        triggerBtn.textContent = `ĐÓN LÔI KIẾP (${currentBolt} / ${config.totalBolts})`;
    }
    const btnTrigger = document.getElementById('btn-trigger-wave');
    if (btnTrigger) {
        btnTrigger.setAttribute('aria-label', `ĐÓN LÔI KIẾP (${currentBolt} / ${config.totalBolts})`);
    }

    // 4. Đồng bộ Avatar / Sprite nhân vật vào giữa trận pháp
    const avatarEl = document.getElementById('cutscene-character-avatar');
    if (avatarEl) {
        const avatarSrc = getPlayerAvatarUrl();
        if (avatarSrc) avatarEl.src = avatarSrc;
        avatarEl.classList.remove('avatar-damage-hit');
        avatarEl.style.display = 'block';
    }

    // 5. Render động dòng chữ mô tả (Flavor Text) theo config cảnh giới mục tiêu
    const quoteEl = document.getElementById('cutscene-quote');
    if (quoteEl) {
        quoteEl.textContent = `"${config.flavorText || 'Thiên đạo bất nhân, dĩ vạn vật vi sô cẩu! Đạo nhân ta quyết nghịch thiên cải mệnh!'}"`;
    }

    return config;
}
window.renderTribulationCutscene = renderTribulationCutscene;

function openBreakthroughModal() {
    if (rejectLockedFeature('btn_dot_pha')) return;
    const currentRealm = REALMS[state.realmIndex];
    if (!currentRealm.isMajorBottleneck) {
        openMinorBreakthroughModal();
        return;
    }
    const nextRealm = REALMS[state.realmIndex + 1];
    if (typeof openTribulationZone === 'function') {
        openTribulationZone(nextRealm);
    } else if (typeof startTribulation === 'function') {
        startTribulation(nextRealm);
    } else {
        startTribulationCutscene(nextRealm);
    }
}

function attemptCultivationBreakthrough() {
    const currentRealm = REALMS[state.realmIndex];
    const nextRealm = REALMS[state.realmIndex + 1];
    if (!currentRealm || !nextRealm || state.exp < currentRealm.maxExp) return;
    if (currentRealm.isMajorBottleneck) {
        openBreakthroughModal();
    } else {
        openMinorBreakthroughModal();
    }
}
window.attemptCultivationBreakthrough = attemptCultivationBreakthrough;

function renderTribulationLightningIcons() {
    const row = document.getElementById('lightning-icons-row');
    if (!row || !cutsceneState) return;
    const total = cutsceneState.totalStrikes || 9;
    const cur = cutsceneState.currentStrike || 1;
    const isCompact = total > 18;
    let html = '';
    for (let i = 1; i <= total; i++) {
        let statusClass = 'is-ready';
        if (i < cur) {
            statusClass = 'is-done';
        } else if (i === cur) {
            statusClass = 'is-current';
        }
        html += `<span id="trib-strike-${i}" class="trib-strike-icon ${statusClass} ${isCompact ? 'trib-strike-sm' : ''}" title="Đạo thứ ${i} / ${total}">
            <i class="fa-solid fa-bolt-lightning"></i>
        </span>`;
    }
    row.innerHTML = html;
}

function spawnTribulationDamage(text, colorClass = "text-rose-400") {
    const container = document.getElementById('tribulation-damage-floater');
    if (container) {
        const el = document.createElement('div');
        el.className = `floating-damage-text animate-float-up font-bold ${colorClass}`;
        el.textContent = text;
        container.appendChild(el);
        setTimeout(() => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 950);
    }

    // Hiệu ứng chữ sát thương bay trên Canvas Effect Engine
    if (typeof spawnDamageText === 'function') {
        const shield = document.getElementById('tribulation-shield-bubble');
        const overlay = document.getElementById('tribulation-cutscene-overlay');
        if (shield && overlay) {
            const sRect = shield.getBoundingClientRect();
            const oRect = overlay.getBoundingClientRect();
            const cx = sRect.left + sRect.width / 2 - oRect.left;
            const cy = sRect.top + sRect.height / 2 - oRect.top - 20;
            const color = colorClass.includes('cyan') ? '#22d3ee' : (colorClass.includes('emerald') ? '#34d399' : (colorClass.includes('amber') ? '#fbbf24' : '#f43f5e'));
            spawnDamageText(cx, cy, text, color);
        }
    }
}

function updateTribulationQuickSlotUI() {
    if (!cutsceneState) return;
    const charges = cutsceneState.inventoryCharges || { heals: 0, shields: 0, pills: 0 };

    const healBadge = document.getElementById('quick-heal-badge');
    if (healBadge) healBadge.textContent = `x${charges.heals}`;

    const shieldBadge = document.getElementById('quick-shield-badge');
    if (shieldBadge) shieldBadge.textContent = `x${charges.shields}`;

    const pillBadge = document.getElementById('quick-pill-badge');
    if (pillBadge) {
        pillBadge.textContent = cutsceneState.pillConsumed ? '✓ Đã Nuốt' : `x${charges.pills}`;
    }

    const pillName = document.getElementById('quick-pill-name');
    if (pillName) {
        const pillItem = state.inventory.find(i => i.id === REALMS[state.realmIndex]?.breakthroughPillId);
        pillName.textContent = pillItem ? pillItem.name : 'Hộ Tâm Đan';
    }

    const chanceText = document.getElementById('cutscene-chance-text');
    if (chanceText) chanceText.textContent = `Tỷ lệ: ${cutsceneState.totalChance}%`;
}

function calculateBoltDamage(current_bolt, total_bolts, player_max_hp = 100, customConfig = null) {
    const cur = Math.max(1, Number(current_bolt) || 1);
    const total = Math.max(1, Number(total_bolts) || 3);

    // 1. Hệ số boltMultiplier: Các đợt đầu: 30%, 50%, 70%... Đợt cuối cùng: 100%
    let boltMultiplier = 1.0;
    if (typeof getBoltMultiplier === 'function') {
        boltMultiplier = getBoltMultiplier(cur, total);
    } else {
        if (cur >= total) {
            boltMultiplier = 1.0;
        } else if (total === 3) {
            boltMultiplier = cur === 1 ? 0.3 : 0.5;
        } else if (total === 4) {
            boltMultiplier = cur === 1 ? 0.3 : (cur === 2 ? 0.5 : 0.7);
        } else {
            const step = (1.0 - 0.3) / Math.max(1, total - 1);
            boltMultiplier = Math.round((0.3 + (cur - 1) * step) * 100) / 100;
        }
    }

    // 2. Lấy cấu hình Base Damage từ tribConfigs / config hiện tại
    const config = customConfig ||
        (typeof getTribulationConfig === 'function' ? getTribulationConfig(cutsceneState?.config || cutsceneState?.target_realm) : null) ||
        (typeof tribConfigs !== 'undefined' ? tribConfigs.TrucCo : { baseDamage: 800 });
    const baseDamage = Number(config?.baseDamage) || 800;

    // 3. Lấy chỉ số DEF và Max HP của nhân vật
    const effStats = (typeof getEffectiveStats === 'function')
        ? getEffectiveStats()
        : { def: state?.def || 0, maxHp: state?.maxHp || player_max_hp };
    let playerDef = effStats.def || state?.def || 0;
    const hasPressure = Boolean(
        cutsceneState?.hasHeavenlyPressure ||
        (typeof tribState !== 'undefined' && tribState?.hasHeavenlyPressure)
    );
    if (hasPressure) {
        playerDef = Math.round(playerDef * 0.8);
    }
    const maxHp = effStats.maxHp || state?.maxHp || player_max_hp || 1000;

    // 4. Công thức Stat-check: rawDamage = (config.baseDamage * boltMultiplier) - (playerDef * 2.5)
    let rawDamage = (baseDamage * boltMultiplier) - (playerDef * 2.5);
    let isMinimumTrueDamage = false;

    // 5. Đảm bảo Sát thương tối thiểu (True Damage: 5% Max HP nếu DEF quá cao)
    if (rawDamage <= 0) {
        rawDamage = Math.max(1, Math.round(maxHp * 0.05));
        isMinimumTrueDamage = true;
    } else {
        rawDamage = Math.round(rawDamage);
    }

    const damagePercent = Math.min(100, Math.round((rawDamage / Math.max(1, maxHp)) * 100));

    return {
        current_bolt: cur,
        total_bolts: total,
        boltMultiplier,
        baseDamage,
        rawDamage,
        damageAmount: rawDamage,
        damagePercent,
        isFinalBolt: cur >= total,
        isMinimumTrueDamage,
        ignoreResist: isMinimumTrueDamage
    };
}
window.calculateBoltDamage = calculateBoltDamage;

function setTribulationStunState(stunned) {
    if (cutsceneState) {
        cutsceneState.is_stunned = Boolean(stunned);
    }

    const stunIndicator = document.getElementById('tribulation-stun-indicator');
    if (stunIndicator) {
        if (stunned) {
            stunIndicator.classList.remove('hidden');
            stunIndicator.classList.add('flex');
        } else {
            stunIndicator.classList.add('hidden');
            stunIndicator.classList.remove('flex');
        }
    }

    const slotButtons = [
        document.getElementById('btn-quick-shield'),
        document.getElementById('btn-quick-heal'),
        document.getElementById('btn-quick-pill'),
        document.getElementById('btn-trigger-wave')
    ];

    slotButtons.forEach(btn => {
        if (!btn) return;
        if (stunned) {
            btn.classList.add('tribulation-btn-stunned');
            btn.setAttribute('aria-disabled', 'true');
            btn.disabled = true;
        } else {
            btn.classList.remove('tribulation-btn-stunned');
            btn.removeAttribute('aria-disabled');
            btn.disabled = false;
        }
    });
}
window.setTribulationStunState = setTribulationStunState;

function startTribulationCutscene(target_realm) {
    const nextR = (typeof REALMS !== 'undefined' && Array.isArray(REALMS)) ? REALMS[(state?.realmIndex || 0) + 1] : null;
    if (typeof openTribulationZone === 'function') {
        return openTribulationZone(target_realm || nextR);
    }
    if (typeof startTribulation === 'function') {
        return startTribulation(target_realm || nextR);
    }
    const currentRealm = REALMS[state.realmIndex];
    const nextRealm = nextR || REALMS[state.realmIndex + 1];
    if (!target_realm && (!nextRealm || !currentRealm?.isMajorBottleneck || state.exp < currentRealm.maxExp)) return;

    const config = typeof getTribulationConfig === 'function' ? getTribulationConfig(target_realm || nextRealm) : tribConfig;
    const tribConfig = getMajorTribulationConfig(config);

    // CHẾ ĐỘ LOADOUT (TRANG BỊ TRƯỚC KHI ĐỘ KIẾP)
    // Slot 1: Phù Hộ Thuẫn - Giới hạn mang 1 cái
    // Slot 2 & 3: Đan Dược - Giới hạn mỗi slot mang tối đa 3 viên
    const healItem = state.inventory.find(i => i.id === 'pill_qi' || i.id === 'pill_exp');
    const ownedHeals = healItem && healItem.count > 0 ? healItem.count : 3;
    const initialHeals = Math.min(3, Math.max(1, ownedHeals));

    const pillItem = state.inventory.find(i => i.id === (currentRealm?.breakthroughPillId || 'pill_foundation'));
    const ownedPills = pillItem && pillItem.count > 0 ? pillItem.count : 1;
    const initialPills = Math.min(3, Math.max(1, ownedPills));

    cutsceneState = {
        inProgress: true,
        isStriking: false,
        is_stunned: false,
        pill_used_count: 0,
        currentStrike: 1,
        totalStrikes: config.totalBolts,
        totalBolts: config.totalBolts,
        shieldHp: 0,
        maxShieldHp: 100,
        playerHp: 100,
        maxPlayerHp: 100,
        pillConsumed: false,
        totalDamage: 0,
        totalChance: (currentRealm?.baseChance || 70) + (breakthroughBonusChance || 0),
        tribConfig: tribConfig,
        config: config,
        inventoryCharges: {
            shields: 1,
            heals: initialHeals,
            pills: initialPills
        }
    };

    setTribulationStunState(false);

    const centerStage = document.getElementById('tribulation-center-stage');
    if (centerStage) centerStage.classList.remove('animate-shake');
    const localFlash = document.getElementById('trib-flash') || document.getElementById('localized-impact-flash');
    if (localFlash) localFlash.classList.remove('animate-trib-flash', 'animate-localized-impact');
    const boltFx = document.getElementById('trib-bolt-fx');
    if (boltFx) boltFx.classList.remove('animate-bolt-drop');

    const overlay = document.getElementById('tribulation-cutscene-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }

    // Cập nhật giao diện động theo target_realm config
    renderTribulationCutscene(config);

    const auraPulse = document.getElementById('tribulation-aura-pulse');
    if (auraPulse) {
        auraPulse.style.backgroundColor = tribConfig.glow_color;
    }

    const quoteEl = document.getElementById('cutscene-quote');
    if (quoteEl) {
        quoteEl.textContent = `"${config.flavorText || nextRealm?.quote || 'Thiên đạo bất nhân, dĩ vạn vật vi sô cẩu! Đạo nhân ta quyết nghịch thiên cải mệnh!'}"`;
    }

    // Reset Vòng Hộ Thuẫn
    const shieldBubble = document.getElementById('tribulation-shield-bubble');
    if (shieldBubble) {
        shieldBubble.classList.remove('opacity-0', 'scale-95');
    }
    const shieldVis = document.getElementById('tribulation-shield-visual');
    if (shieldVis) {
        if (cutsceneState.shieldHp > 0) {
            shieldVis.classList.remove('hidden');
        } else {
            shieldVis.classList.add('hidden');
        }
    }

    // Dual Survival Bars
    const shieldBar = document.getElementById('cutscene-shield-bar');
    if (shieldBar) shieldBar.style.width = `${cutsceneState.shieldHp}%`;
    const shieldNum = document.getElementById('cutscene-shield-numeric');
    if (shieldNum) shieldNum.textContent = `${cutsceneState.shieldHp} / ${cutsceneState.maxShieldHp}`;
    const shieldText = document.getElementById('cutscene-shield-text');
    if (shieldText) shieldText.textContent = `${cutsceneState.shieldHp}%`;

    const hpBar = document.getElementById('cutscene-hp-bar');
    if (hpBar) hpBar.style.width = '100%';
    const hpText = document.getElementById('cutscene-hp-text');
    if (hpText) hpText.textContent = '100%';

    // Cập nhật slot vật phẩm thao tác nhanh
    updateTribulationQuickSlotUI();
}

function quickUseTribulationHeal() {
    if (!cutsceneState || !cutsceneState.inProgress) return;
    if (cutsceneState.is_stunned) {
        addLog("⚡ <span class='text-amber-400 font-bold'>[Tê Liệt]</span> Kim thân đang bị lôi kiếp gây choáng (1.5s), không thể sử dụng đan dược!", "text-amber-300");
        return;
    }
    if (cutsceneState.inventoryCharges.heals <= 0) {
        addLog("⚠️ Đã hết Đan Hồi Máu trong lần độ kiếp này (Tối đa 3 viên)!", "text-amber-300");
        return;
    }
    if (cutsceneState.playerHp >= cutsceneState.maxPlayerHp) {
        addLog("Khí huyết đang viên mãn (100%), chưa cần dùng đan dược hồi phục.", "text-cyan-300");
        return;
    }

    cutsceneState.inventoryCharges.heals--;
    const healItem = state.inventory.find(i => i.id === 'pill_qi' || i.id === 'pill_exp');
    if (healItem && healItem.count > 0) healItem.count--;

    // LOGIC "ĐAN ĐỘC" (DIMINISHING RETURNS)
    cutsceneState.pill_used_count = (cutsceneState.pill_used_count || 0) + 1;
    const baseHeal = 30;
    const healAmount = Math.max(1, Math.round(baseHeal * (1 / cutsceneState.pill_used_count)));
    cutsceneState.playerHp = Math.min(cutsceneState.maxPlayerHp, cutsceneState.playerHp + healAmount);

    const hpBar = document.getElementById('cutscene-hp-bar');
    if (hpBar) hpBar.style.width = `${cutsceneState.playerHp}%`;
    const hpText = document.getElementById('cutscene-hp-text');
    if (hpText) hpText.textContent = `${cutsceneState.playerHp}%`;

    updateTribulationQuickSlotUI();
    playSound('qi');
    spawnTribulationDamage(`+${healAmount}% HP`, "text-emerald-400");
    const effPercent = Math.round(100 / cutsceneState.pill_used_count);
    addLog(`💊 <span class="text-emerald-400 font-bold">[Đan Dược]</span> Nuốt Đan Hồi Máu viên thứ ${cutsceneState.pill_used_count} (Đan độc tích tụ: hiệu lực còn ${effPercent}%), hồi phục ${healAmount}% khí huyết!`, "text-emerald-300");
}
window.quickUseTribulationHeal = quickUseTribulationHeal;
window.use_healing_pill = quickUseTribulationHeal;

function quickUseTribulationShield() {
    if (!cutsceneState || !cutsceneState.inProgress) return;
    if (cutsceneState.is_stunned) {
        addLog("⚡ <span class='text-amber-400 font-bold'>[Tê Liệt]</span> Kim thân đang bị lôi kiếp gây choáng (1.5s), không thể kích hoạt phù chú!", "text-amber-300");
        return;
    }
    if (cutsceneState.inventoryCharges.shields <= 0) {
        addLog("⚠️ Đã dùng hết Phù Hộ Thuẫn trong lần độ kiếp này (Giới hạn 1 cái)!", "text-amber-300");
        return;
    }
    if (cutsceneState.shieldHp >= cutsceneState.maxShieldHp) {
        addLog("Hộ thuẫn đang ở mức tối đa (100%), không cần gia cố.", "text-cyan-300");
        return;
    }

    cutsceneState.inventoryCharges.shields--;
    const shieldAmount = 50;
    cutsceneState.shieldHp = Math.min(cutsceneState.maxShieldHp, cutsceneState.shieldHp + shieldAmount);

    // Khôi phục Vòng Hộ Thuẫn hiển thị nếu đã từng bị vỡ
    const shieldBubble = document.getElementById('tribulation-shield-bubble');
    if (shieldBubble) {
        shieldBubble.classList.remove('opacity-0', 'scale-95');
    }
    const shieldVis = document.getElementById('tribulation-shield-visual');
    if (shieldVis) shieldVis.classList.remove('hidden');

    const overlay = document.getElementById('tribulation-cutscene-overlay');
    if (typeof spawnRipple === 'function' && shieldBubble && overlay) {
        const sRect = shieldBubble.getBoundingClientRect();
        const oRect = overlay.getBoundingClientRect();
        spawnRipple(sRect.left + sRect.width / 2 - oRect.left, sRect.top + sRect.height / 2 - oRect.top, '#38bdf8');
    }

    const shieldBar = document.getElementById('cutscene-shield-bar');
    if (shieldBar) shieldBar.style.width = `${cutsceneState.shieldHp}%`;
    const shieldNum = document.getElementById('cutscene-shield-numeric');
    if (shieldNum) shieldNum.textContent = `${cutsceneState.shieldHp} / ${cutsceneState.maxShieldHp}`;
    const shieldText = document.getElementById('cutscene-shield-text');
    if (shieldText) shieldText.textContent = `${cutsceneState.shieldHp}%`;

    updateTribulationQuickSlotUI();
    playSound('bell');
    spawnTribulationDamage(`+${shieldAmount}% Khiên`, "text-cyan-300");
    addLog(`🛡️ <span class="text-cyan-300 font-bold">[Phù Chú]</span> Kích hoạt Phù Hộ Thuẫn, khôi phục ${shieldAmount}% độ bền khiên chắn!`, "text-cyan-300");
}

function quickUseTribulationPill() {
    if (!cutsceneState || !cutsceneState.inProgress) return;
    if (cutsceneState.is_stunned) {
        addLog("⚡ <span class='text-amber-400 font-bold'>[Tê Liệt]</span> Kim thân đang bị lôi kiếp gây choáng (1.5s), không thể sử dụng đan dược!", "text-amber-300");
        return;
    }
    if (cutsceneState.inventoryCharges.pills <= 0) {
        addLog("⚠️ Đã dùng hết Hộ Tâm Đan trong lần độ kiếp này (Tối đa 3 viên)!", "text-amber-300");
        return;
    }

    cutsceneState.inventoryCharges.pills--;
    const currentRealm = REALMS[state.realmIndex];
    const pillItem = state.inventory.find(i => i.id === currentRealm.breakthroughPillId);
    if (pillItem && pillItem.count > 0) pillItem.count--;

    cutsceneState.pillConsumed = true;
    const bonus = 25;
    cutsceneState.totalChance = Math.min(100, cutsceneState.totalChance + bonus);

    updateTribulationQuickSlotUI();
    playSound('qi');
    spawnTribulationDamage(`+${bonus}% Tỷ Lệ Độ Kiếp!`, "text-purple-300");
    addLog(`🌟 <span class="text-purple-300 font-bold">[Hộ Tâm Đan]</span> Dược lực lan tỏa, tăng ${bonus}% tỷ lệ độ kiếp thành công!`, "text-purple-300");
}

function advanceTribulationWave() {
    if (typeof tribState !== 'undefined' && tribState.inProgress && typeof takeLightning === 'function') {
        return takeLightning();
    }
    if (!cutsceneState || !cutsceneState.inProgress) return;
    if (cutsceneState.isStriking) return;
    if (cutsceneState.is_stunned) {
        addLog("⚡ <span class='text-amber-400 font-bold'>[Tê Liệt]</span> Chưa hồi phục sau đợt sét trước!", "text-amber-300");
        return;
    }
    cutsceneState.isStriking = true;

    const currentStrike = cutsceneState.currentStrike;
    const totalStrikes = (cutsceneState.config && cutsceneState.config.totalBolts) || cutsceneState.totalBolts || cutsceneState.totalStrikes || 3;
    const nextRealm = REALMS[state.realmIndex + 1];
    const tribConfig = cutsceneState.tribConfig || getMajorTribulationConfig(cutsceneState.config || nextRealm);

    // KÍCH HOẠT HIỆU ỨNG THIÊN KIẾP LÔI QUANG DỊU ÊM (PNG CHỒNG CHÉO)
    if (typeof triggerSoftTribulation === 'function') {
        triggerSoftTribulation(null, {
            strike: currentStrike,
            total: totalStrikes,
            isFinal: currentStrike >= totalStrikes
        });
    }

    // 1. TẠO VỆT SÁNG HẸP RƠI TỪ TRÊN MÂY XUỐNG ĐỈNH ĐẦU NHÂN VẬT (#trib-bolt-fx - 0.15s)
    const overlay = document.getElementById('tribulation-cutscene-overlay');
    const shield = document.getElementById('tribulation-shield-bubble');
    const boltFx = document.getElementById('trib-bolt-fx');

    if (boltFx && overlay && shield) {
        const sRect = shield.getBoundingClientRect();
        const oRect = overlay.getBoundingClientRect();
        const boltHeight = Math.max(100, sRect.top - oRect.top + 45);
        boltFx.style.height = `${boltHeight}px`;
        boltFx.classList.remove('animate-bolt-drop');
        void boltFx.offsetWidth;
        boltFx.classList.add('animate-bolt-drop');
    }

    // Canvas Lightning cục bộ (không chớp màn hình)
    if (typeof strikeLightning === 'function' && overlay && shield) {
        const sRect = shield.getBoundingClientRect();
        const oRect = overlay.getBoundingClientRect();
        const startX = oRect.width / 2;
        const startY = 0;
        const endX = sRect.left + sRect.width / 2 - oRect.left;
        const endY = sRect.top + 25 - oRect.top;
        strikeLightning(startX, startY, endX, endY, tribConfig.hex_color || '#38bdf8');
    }

    // Âm thanh lôi kiếp
    const soundWave = Math.min(3, Math.ceil(currentStrike / Math.max(1, totalStrikes / 3)));
    if (typeof playTribulationThunder === 'function') {
        playTribulationThunder(soundWave);
    } else {
        playSound('thunder');
    }

    // 2. KHI TIA SÉT CHẠM VÀO NHÂN VẬT (SAU 0.15S = 150MS)
    setTimeout(() => {
        if (!cutsceneState || !cutsceneState.inProgress) return;

        // A. CHỚP SÁNG CỤC BỘ TẠI VÙNG CHỨA AVATAR / VÒNG KHIÊN (#trib-flash - không chớp toàn màn hình)
        const tribFlash = document.getElementById('trib-flash') || document.getElementById('localized-impact-flash');
        if (tribFlash) {
            tribFlash.classList.remove('animate-trib-flash', 'animate-localized-impact');
            void tribFlash.offsetWidth;
            tribFlash.classList.add('animate-trib-flash');
            setTimeout(() => {
                if (tribFlash) tribFlash.classList.remove('animate-trib-flash', 'animate-localized-impact');
            }, 260);
        }

        // B. RUNG LẮC NHẸ KHUNG NHÂN VẬT (.animate-shake - 0.2s)
        const centerStage = document.getElementById('tribulation-center-stage');
        if (centerStage) {
            centerStage.classList.remove('animate-shake');
            void centerStage.offsetWidth;
            centerStage.classList.add('animate-shake');
            setTimeout(() => {
                if (centerStage) centerStage.classList.remove('animate-shake');
            }, 210);
        }

        // C. TÍNH TOÁN SÁT THƯƠNG THEO 3 ĐẠO SÉT
        const boltInfo = calculateBoltDamage(currentStrike, totalStrikes, 100);
        let rawDamage = boltInfo.damagePercent;
        let isBypassingResist = false;

        if (totalStrikes === 3) {
            // Đúng chuẩn 3 đạo theo yêu cầu:
            // Đạo 1: 15% HP tối đa
            // Đạo 2: 30% HP tối đa
            // Đạo 3 (Đạo chót): 80% HP tối đa (xuyên kháng)
            rawDamage = boltInfo.damagePercent;
            if (currentStrike === 3) {
                isBypassingResist = true;
            }
        } else if (boltInfo.ignoreResist) {
            rawDamage = 80;
            isBypassingResist = true;
        } else {
            const rootPressure = getRootConfig().bodyCultivator ? 10000 : (getRootTier().tribulationDamageMult || 1);
            const heavenlyPressure = Math.max(rootPressure, getPhysique().tribulationDamageMult || 1);
            rawDamage = Math.round(rawDamage * (tribConfig.damage_multiplier || 1.0) * heavenlyPressure);
            const rootResist = (getRootTier()?.tribulationResist || 0) / 100;
            const earthResist = Math.min(0.35, getPillarLevel('earth') * 0.005 * getPillarEfficiency('earth'));
            rawDamage = Math.max(1, Math.round(rawDamage * (1 - rootResist) * (1 - earthResist) * (1 - (getPhysique()?.bodyShield || 0))));
        }

        // D. HỘ THUẪN ĐỠ ĐÒN & TRỪ KHÍ HUYẾT
        let damageToShield = 0;
        let damageToHp = 0;
        const shieldBubble = document.getElementById('tribulation-shield-bubble');
        const effectiveHp = (typeof getEffectiveStats === 'function' ? getEffectiveStats().maxHp : 100000) || 100000;
        const combatDmgShield = Math.max(1, Math.round((rawDamage / 100) * effectiveHp));

        if (cutsceneState.shieldHp > 0) {
            if (cutsceneState.shieldHp >= rawDamage) {
                cutsceneState.shieldHp -= rawDamage;
                damageToShield = rawDamage;

                if (shieldBubble) {
                    shieldBubble.classList.remove('shield-impact-flash');
                    void shieldBubble.offsetWidth;
                    shieldBubble.classList.add('shield-impact-flash');
                    setTimeout(() => shieldBubble?.classList.remove('shield-impact-flash'), 350);
                }
                if (typeof spawnRipple === 'function' && shieldBubble && overlay) {
                    const sRect = shieldBubble.getBoundingClientRect();
                    const oRect = overlay.getBoundingClientRect();
                    spawnRipple(sRect.left + sRect.width / 2 - oRect.left, sRect.top + sRect.height / 2 - oRect.top, '#22d3ee');
                }
                spawnTribulationDamage(`-${combatDmgShield.toLocaleString('vi-VN')} (Hộ Thuẫn)`, "text-cyan-300");
            } else {
                damageToShield = cutsceneState.shieldHp;
                damageToHp = rawDamage - damageToShield;
                cutsceneState.shieldHp = 0;
                cutsceneState.playerHp = Math.max(0, cutsceneState.playerHp - damageToHp);

                if (shieldBubble) {
                    shieldBubble.classList.add('opacity-0', 'scale-95');
                }
                const shieldVis = document.getElementById('tribulation-shield-visual');
                if (shieldVis) shieldVis.classList.add('hidden');

                if (typeof spawnRipple === 'function' && shieldBubble && overlay) {
                    const sRect = shieldBubble.getBoundingClientRect();
                    const oRect = overlay.getBoundingClientRect();
                    spawnRipple(sRect.left + sRect.width / 2 - oRect.left, sRect.top + sRect.height / 2 - oRect.top, '#f59e0b');
                }

                const combatDmgHpLoss = Math.max(1, Math.round((damageToHp / 100) * effectiveHp));
                spawnTribulationDamage(`-${combatDmgHpLoss.toLocaleString('vi-VN')} (Vỡ Khiên!)`, "text-amber-400 font-extrabold");
                playSound('bell');
            }
        } else {
            damageToHp = rawDamage;
            cutsceneState.playerHp = Math.max(0, cutsceneState.playerHp - damageToHp);
            const combatDmgHpLoss = Math.max(1, Math.round((damageToHp / 100) * effectiveHp));
            spawnTribulationDamage(`-${combatDmgHpLoss.toLocaleString('vi-VN')}`, "text-rose-500 font-extrabold");
        }
        cutsceneState.totalDamage += rawDamage;

        // E. CẬP NHẬT THANH HỘ THUẪN & KHÍ HUYẾT
        const shieldBar = document.getElementById('cutscene-shield-bar');
        if (shieldBar) shieldBar.style.width = `${cutsceneState.shieldHp}%`;
        const shieldNum = document.getElementById('cutscene-shield-numeric');
        if (shieldNum) shieldNum.textContent = `${cutsceneState.shieldHp} / ${cutsceneState.maxShieldHp}`;
        const shieldText = document.getElementById('cutscene-shield-text');
        if (shieldText) shieldText.textContent = `${cutsceneState.shieldHp}%`;

        const hpBar = document.getElementById('cutscene-hp-bar');
        if (hpBar) hpBar.style.width = `${cutsceneState.playerHp}%`;
        const hpText = document.getElementById('cutscene-hp-text');
        if (hpText) hpText.textContent = `${cutsceneState.playerHp}%`;

        // F. HIỆU ỨNG TƯƠNG TÁC LÊN AVATAR NHÂN VẬT
        const avatarImg = document.getElementById('cutscene-character-avatar');
        if (avatarImg) {
            if (damageToHp > 0) {
                avatarImg.classList.remove('avatar-damage-hit');
                void avatarImg.offsetWidth;
                avatarImg.classList.add('avatar-damage-hit');
                setTimeout(() => {
                    if (avatarImg) avatarImg.classList.remove('avatar-damage-hit');
                }, 200);
            } else if (damageToShield > 0) {
                avatarImg.classList.add('scale-95');
                setTimeout(() => avatarImg?.classList.remove('scale-95'), 180);
            }
        }

        // G. CẬP NHẬT DÃY ICON TIA SÉT: ĐẠO VỪA ĐÁNH XONG THÌ MỜ ĐI (is-done)
        const curIcon = document.getElementById(`trib-strike-${currentStrike}`);
        if (curIcon) {
            curIcon.className = `trib-strike-icon is-done ${totalStrikes > 18 ? 'trib-strike-sm' : ''}`;
        }

        // H. GHI NHẬT KÝ
        let logMsg = `⚡ <span class="${tribConfig.lightning_color} font-bold">${tribConfig.title} - Đạo thứ ${currentStrike}/${totalStrikes}${isBypassingResist ? ' [CỰC ĐẠI 80% HP - XUYÊN KHÁNG]' : ''}:</span> `;
        if (damageToShield > 0) logMsg += `Hộ thuẫn chống đỡ ${damageToShield}. `;
        if (damageToHp > 0) logMsg += `Khí huyết hao tổn ${damageToHp}%.`;
        addLog(logMsg, isBypassingResist ? "text-rose-400 font-bold" : "text-purple-300");

        // I. KIỂM TRA SỐNG CÒN
        if (cutsceneState.playerHp <= 0) {
            addLog(`⚡ <span class="text-rose-400 font-bold">[Kiếp Lôi Giáng Phạt]</span> Nhục thân tan vỡ trước đạo lôi thứ ${currentStrike}! Đột phá thất bại!`, "text-rose-400");
            setTribulationStunState(false);
            setTimeout(() => {
                cutsceneState.isStriking = false;
                finishTribulationCutscene(false);
            }, 450);
            return;
        }

        // J. TIẾN TỚI ĐẠO TIẾP THEO HOẶC HOÀN THÀNH TOÀN BỘ THIÊN KIẾP
        if (currentStrike >= totalStrikes) {
            setTribulationStunState(false);
            setTimeout(() => {
                cutsceneState.isStriking = false;
                finishTribulationCutscene(true);
            }, 450);
        } else {
            // Áp dụng trạng thái tê liệt (Stun Cooldown 1.5s)
            setTribulationStunState(true);

            cutsceneState.currentStrike++;
            const nextIcon = document.getElementById(`trib-strike-${cutsceneState.currentStrike}`);
            if (nextIcon) {
                nextIcon.className = `trib-strike-icon is-current ${totalStrikes > 18 ? 'trib-strike-sm' : ''}`;
            }

            const totalBolts = (cutsceneState.config && cutsceneState.config.totalBolts) || totalStrikes;
            const triggerBtn = document.getElementById('trigger-wave-text');
            if (triggerBtn) {
                triggerBtn.textContent = `ĐÓN LÔI KIẾP (${cutsceneState.currentStrike} / ${totalBolts})`;
            }
            const btnTrigger = document.getElementById('btn-trigger-wave');
            if (btnTrigger) {
                btnTrigger.setAttribute('aria-label', `ĐÓN LÔI KIẾP (${cutsceneState.currentStrike} / ${totalBolts})`);
            }

            setTimeout(() => {
                setTribulationStunState(false);
                cutsceneState.isStriking = false;
            }, 1500);
        }
    }, 150);
}

function finishTribulationCutscene(survived = true) {
    const curRealmName = (typeof REALMS !== 'undefined' && REALMS[state.realmIndex]) ? REALMS[state.realmIndex].name : 'Luyện Khí Kỳ Viên Mãn';
    const targetRealmName = (typeof REALMS !== 'undefined' && REALMS[state.realmIndex + 1]) ? REALMS[state.realmIndex + 1].name : 'Trúc Cơ Kỳ Sơ Kỳ';

    if (!survived) {
        const isPhiThang = Boolean(
            cutsceneState?.config?.id === 'PhiThang' ||
            cutsceneState?.config?.targetName === 'Phi Thăng Tiên Giới' ||
            cutsceneState?.config?.name?.includes('Phi Thăng') ||
            cutsceneState?.target_realm === 'PhiThang'
        );

        if (isPhiThang) {
            const phiThangFailMsg = "Độ kiếp Phi Thăng thất bại! Đạo cơ vỡ nát, tu vi tán loạn, rớt xuống Nguyên Anh Sơ Kỳ!";
            addLog(`⚡ <span class="text-rose-500 font-extrabold">[Thiên Phạt Cực Hạn]</span> ${phiThangFailMsg}`, "text-rose-500 font-bold");

            state.realmStage = 2;
            state.level = 1;
            state.currentExp = 0;
            state.exp = 0;

            let nguyenAnhIndex = -1;
            if (typeof REALMS !== 'undefined' && Array.isArray(REALMS)) {
                nguyenAnhIndex = REALMS.findIndex(r => r.majorRealm === "Nguyên Anh" && (r.minorStage === "Sơ Kỳ" || r.minorIndex === 0));
            }
            if (nguyenAnhIndex === -1) nguyenAnhIndex = 12;

            state.realmIndex = nguyenAnhIndex;
            const naRealm = (typeof REALMS !== 'undefined' && REALMS[nguyenAnhIndex]) || { baseHp: 100000, attackMultiplier: 10 };
            if (typeof applyRealmBaseStats === 'function') {
                applyRealmBaseStats(naRealm);
            }

            state.maxHp = naRealm.baseHp || 100000;
            state.hp = state.maxHp;
            state.atk = 28 * (naRealm.attackMultiplier || 10);
            state.def = 14 * (naRealm.attackMultiplier || 10);

            breakthroughBonusChance = 0;
            abortTribulationCutscene();
            updateHUD();
            saveGameState();

            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Đạo Cơ Vỡ Nát!", "text-rose-500 font-extrabold");
            if (typeof showBreakthroughFailureModal === 'function') {
                showBreakthroughFailureModal(curRealmName, targetRealmName, 0, phiThangFailMsg);
            }
            return;
        }

        // Trường hợp các cảnh giới khác: Trừ 20% maxExp hiện tại vào currentExp / state.exp (Tu vi hao tổn, bảo toàn cảnh giới)
        const curRealm = (typeof REALMS !== 'undefined' && REALMS[state.realmIndex]) || { maxExp: 1000, name: "Hiện Tại" };
        const lostExp = Math.floor((curRealm.maxExp || 1000) * 0.2);
        state.exp = Math.max(0, (state.exp || 0) - lostExp);
        if (state.currentExp !== undefined) {
            state.currentExp = Math.max(0, (state.currentExp || 0) - lostExp);
        }
        state.hp = Math.max(1, Math.floor(state.maxHp * 0.1));
        breakthroughBonusChance = 0;
        abortTribulationCutscene();
        updateHUD();
        saveGameState();
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Đột Phá Bị Chấn Lui!", "text-rose-400 font-bold");
        addLog(`⚡ <span class="text-rose-400 font-bold">[Đột Phá Thất Bại]</span> Độ kiếp bất thành! Tu vi hao tổn 20% (-${lostExp.toLocaleString()} Tu Vi), bảo toàn cảnh giới ${curRealm.name}.`, "text-rose-400");
        if (typeof showBreakthroughFailureModal === 'function') {
            showBreakthroughFailureModal(curRealmName, targetRealmName, lostExp, "Tu vi hao tổn, bảo toàn cảnh giới!");
        }
        return;
    }

    const roll = Math.random() * 100;
    const finalChance = Math.min(100, cutsceneState.totalChance + getRootTier().breakthroughBonus);

    if (roll <= finalChance) {
        if (typeof playBreakthroughSuccess === 'function') {
            playBreakthroughSuccess();
        } else {
            playSound('bell');
        }

        const prevStats = {
            hp: state.hp,
            maxHp: state.maxHp,
            atk: state.atk,
            def: state.def
        };

        const completedRealm = REALMS[state.realmIndex];
        state.realmIndex++;
        state.exp = Math.max(0, state.exp - completedRealm.maxExp);
        applyRealmBaseStats(REALMS[state.realmIndex]);
        const rewardMult = completedRealm.tribulationType ? Math.max(getRootTier().tribulationRewardMult || 1, getPhysique().tribulationRewardMult || 1) : 1;
        state.atk += 28 * rewardMult;
        state.def += 14 * rewardMult;
        if (getRootConfig().id === 'mutant_thunder') {
            state.exp += Math.floor(cutsceneState.totalDamage * 0.1);
        }
        breakthroughBonusChance = 0;

        const newRealm = REALMS[state.realmIndex];
        const newStats = {
            hp: state.hp,
            maxHp: state.maxHp,
            atk: state.atk,
            def: state.def
        };
        if (newRealm.majorRealm === HEAVENLY_REJECTION_RULES.triggeringMajorRealm
            && state.currentWorld === HEAVENLY_REJECTION_RULES.triggeringWorld) {
            syncHeavenlyRejection();
            addLog('⚠️ <span class="text-rose-400 font-bold">[Thiên Đạo Áp Chế]</span> Hóa Thần vượt giới hạn Hạ Giới. Tốc độ Tu Vi còn 10%; Không Gian Liệt Phùng đã mở.', 'text-rose-400');
        }
        abortTribulationCutscene();
        triggerBreakthroughRipple();
        if (state.level !== undefined) state.level++;
        else state.level = state.realmIndex + 1;
        if (typeof triggerLevelUpAura === 'function') triggerLevelUpAura();
        if (typeof updateCharacterModel === 'function') {
            updateCharacterModel(newRealm.themeKey || state.realmIndex);
        }
        updateHUD();
        saveGameState();

        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `ĐỘ KIẾP THÀNH CÔNG!`, "text-gold-300");
        const successTitle = completedRealm.tribulationType || "Phá Vỡ Bình Cảnh";
        addLog(`🎉 <span class="text-gold-300 font-bold">${successTitle} THÀNH CÔNG!</span> Chính thức tiến vào <span class="text-jade-300 font-extrabold text-sm">${newRealm.name}</span>!`, "text-amber-300");

        if (typeof showMajorBreakthroughSuccessModal === 'function') {
            showMajorBreakthroughSuccessModal(prevStats, newStats, newRealm);
        }
    } else {
        const prevExp = state.exp;
        state.exp = Math.floor(state.exp * M1_SYSTEM_RULES.majorFailureExpRetention);
        const lostExp = Math.max(0, prevExp - state.exp);
        state.hp = Math.max(1, Math.floor(state.hp * 0.2));
        breakthroughBonusChance = 0;
        abortTribulationCutscene();
        updateHUD();
        saveGameState();
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, "Đột Phá Bị Chấn Lui!", "text-rose-400 font-bold");
        addLog(`💥 <span class="text-rose-400 font-bold">Đột Phá Bất Thành:</span> Nhục thân hoặc đạo tâm không chịu nổi thiên uy, kinh mạch trọng thương và tu vi sụt giảm 25% (-${lostExp.toLocaleString()}).`, "text-rose-400");
        if (typeof showBreakthroughFailureModal === 'function') {
            showBreakthroughFailureModal(curRealmName, targetRealmName, lostExp, "Nhục thân hoặc đạo tâm không chịu nổi thiên uy, chân nguyên nghịch chuyển, kinh mạch trọng thương!");
        }
    }
}

// The sky tribulation screen uses the same realm, reward, failure and save rules
// as the existing major-breakthrough cutscene.
function resolveSkyTribulation(survived, totalDamage = 0) {
    const currentRealm = REALMS[state.realmIndex];
    const nextRealm = REALMS[state.realmIndex + 1];
    if (!currentRealm?.isMajorBottleneck || !nextRealm || state.exp < currentRealm.maxExp) return false;
    cutsceneState = {
        inProgress: true,
        isStriking: false,
        config: typeof getTribulationConfig === 'function' ? getTribulationConfig(nextRealm) : {},
        totalChance: (currentRealm.baseChance || 70) + (breakthroughBonusChance || 0),
        totalDamage: Math.max(0, Number(totalDamage) || 0)
    };
    finishTribulationCutscene(Boolean(survived));
    return true;
}
window.resolveSkyTribulation = resolveSkyTribulation;

function triggerHeavenlyPunishment(reason) {
    const rules = M1_SYSTEM_RULES.heavenlyPunishment;
    const effectiveStats = getEffectiveStats();
    state.heavenlyPunishmentCount++;
    state.lifespanPenalty += rules.lifespanLoss;
    Trigger_Death();
    state.hp = Math.max(1, Math.floor(effectiveStats.maxHp * rules.remainingHpRatio));
    playSound('thunder');
    if (typeof triggerCanvasLightning === 'function') {
        triggerCanvasLightning(window.innerWidth / 2, window.innerHeight / 2 - 40);
    }
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, "THIÊN PHẠT!", "text-rose-400");
    addLog(`⚡ <span class="text-rose-400 font-bold">[THIÊN PHẠT]</span> ${reason}. Thiên Đạo chủ động mạt sát: khí huyết chỉ còn 10%, thọ nguyên giảm ${rules.lifespanLoss} năm; không nhận lợi ích tẩy tủy.`, "text-rose-400");
    updateHUD();
}

function abortTribulationCutscene() {
    if (cutsceneState) {
        cutsceneState.inProgress = false;
        cutsceneState.isStriking = false;
        cutsceneState.is_stunned = false;
    }
    setTribulationStunState(false);
    const overlay = document.getElementById('tribulation-cutscene-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
    const centerStage = document.getElementById('tribulation-center-stage');
    if (centerStage) centerStage.classList.remove('animate-shake');
    const skyBg = document.getElementById('tribulation-sky-bg');
    if (skyBg) skyBg.classList.remove('sky-dimmed');
    const localFlash = document.getElementById('localized-impact-flash');
    if (localFlash) localFlash.classList.remove('animate-localized-impact');
    const shieldVis = document.getElementById('tribulation-shield-visual');
    if (shieldVis) shieldVis.classList.add('hidden');
    const avatarEl = document.getElementById('cutscene-character-avatar');
    if (avatarEl) avatarEl.classList.remove('avatar-damage-hit');
}

window.startTribulationCutscene = startTribulationCutscene;
window.renderTribulationCutscene = renderTribulationCutscene;
window.abortTribulationCutscene = abortTribulationCutscene;
window.advanceTribulationWave = advanceTribulationWave;
window.quickUseTribulationHeal = quickUseTribulationHeal;
window.use_healing_pill = quickUseTribulationHeal;
window.quickUseTribulationShield = quickUseTribulationShield;
window.quickUseTribulationPill = quickUseTribulationPill;
window.calculateBoltDamage = calculateBoltDamage;
window.setTribulationStunState = setTribulationStunState;

// ==========================================
// TRIBULATION SYSTEM (CÂN BẰNG ĐỘ KHÓ THIÊN KIẾP)
// ==========================================
const TribulationSystem = {
    // 1. CHẾ ĐỘ LOADOUT (TRANG BỊ TRƯỚC KHI ĐỘ KIẾP)
    limits: Object.freeze({
        slot1_shield: 1, // Slot 1 (Trận Pháp/Phù chú): Giới hạn mang 1 cái
        slot2_heal: 3,   // Slot 2 (Đan Dược 1): Giới hạn tối đa 3 viên
        slot3_pill: 3    // Slot 3 (Đan Dược 2): Giới hạn tối đa 3 viên
    }),

    start(targetRealm) {
        if (typeof startTribulation === 'function') {
            return startTribulation(targetRealm);
        }
        return startTribulationCutscene(targetRealm);
    },

    isGlobalInventoryLocked() {
        return Boolean(cutsceneState && cutsceneState.inProgress);
    },

    // 2. LOGIC "ĐAN ĐỘC" (DIMINISHING RETURNS)
    use_healing_pill() {
        return quickUseTribulationHeal();
    },

    get pill_used_count() {
        return cutsceneState ? (cutsceneState.pill_used_count || 0) : 0;
    },

    // 3. SÁT THƯƠNG LÔI KIẾP LŨY TIẾN (EXPONENTIAL DAMAGE)
    calculateBoltDamage(current_bolt, total_bolts, player_max_hp = 100) {
        return calculateBoltDamage(current_bolt, total_bolts, player_max_hp);
    },

    // 4. COOLDOWN VÀ TRẠNG THÁI TÊ LIỆT (STUN COOLDOWN)
    setStun(stunned = true, durationMs = 1500) {
        setTribulationStunState(stunned);
        if (stunned && durationMs > 0) {
            setTimeout(() => setTribulationStunState(false), durationMs);
        }
    },

    isStunned() {
        return Boolean(cutsceneState && cutsceneState.is_stunned);
    },

    // Thao tác điều khiển Thiên Kiếp
    triggerBolt() {
        return advanceTribulationWave();
    },
    useShield() {
        return quickUseTribulationShield();
    },
    usePill() {
        return quickUseTribulationPill();
    },
    abort() {
        return abortTribulationCutscene();
    },
    getState() {
        return cutsceneState;
    }
};

window.TribulationSystem = TribulationSystem;

// ==========================================
// NHẬT KÝ KỲ NGỘ CỔ TỊCH & BÀN CÂN SINH TỬ
// ==========================================
let currentEncounter = null;

function triggerHolyFlash() {
    if (typeof document === 'undefined') return;
    const flash = document.createElement('div');
    flash.className = 'holy-flash pointer-events-none fixed inset-0 z-[100]';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
}

function triggerBloodFlash() {
    if (typeof document === 'undefined') return;
    const flash = document.createElement('div');
    flash.className = 'blood-flash pointer-events-none fixed inset-0 z-[100]';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
}

/**
 * LỆNH TỪ BẢN TÔN: Hiệu ứng Thiên Kiếp Mờ Ảo & Ánh Sáng Chớp Nhẹ (Soft Tribulation Overlay)
 * Bãi bỏ hoàn toàn rung lắc (shake) gây chóng mặt. Chuyển sang lớp ảnh PNG thiên kiếp
 * mờ ảo chồng chéo lên nhau phía trên Nữ Tu để tạo cảm giác thiên uy áp đỉnh nhưng mượt mà, chill lofi.
 */
/**
 * Kích hoạt hiệu ứng Thiên Kiếp Mờ Ảo & Lôi Quang Nhấp Nháy (Soft Tribulation Glow & Lightning Overlay)
 * Bãi bỏ hoàn toàn rung lắc (shake) gây chóng mặt theo lệnh Bản Tôn.
 * Chuyển sang lớp ảnh PNG thiên kiếp mờ ảo chồng chéo lên nhau phía trên Nữ Tu để tạo cảm giác thiên uy áp đỉnh nhưng mượt mà, chill lofi.
 */
function triggerSoftTribulation(callback, options = {}) {
    if (typeof document === 'undefined') {
        if (typeof callback === 'function') callback();
        return;
    }

    // TUYỆT ĐỐI KHÔNG HIỂN THỊ Ở MÀN HÌNH CHÍNH (ẢNH 1) THEO LỆNH BẢN TÔN
    // CHỈ KÍCH HOẠT TRONG MÀN HÌNH ĐỘ KIẾP (ẢNH 2: #cutscene-tribulation-overlay VÀ #cutscene-lightning-strike-box)
    const cutsceneOverlay = document.getElementById('cutscene-tribulation-overlay');
    const strikeBox = document.getElementById('cutscene-lightning-strike-box');
    const overlay = document.getElementById('tribulation-cutscene-overlay');
    const avatar = document.getElementById('cutscene-character-avatar') || document.getElementById('trib-avatar-container');

    // LỆNH BẢN TÔN FIX: Tia sét dùng .lightning-effect với position: fixed, height: 100vh giáng thẳng đỉnh đầu
    if (strikeBox) {
        strikeBox.style.height = '100vh';
    }

    const overlays = [cutsceneOverlay, strikeBox].filter(Boolean);

    if (overlays.length === 0) {
        if (typeof callback === 'function') callback();
        return;
    }

    const isRedLightning = Boolean(
        options?.tamMa > 50 || 
        options?.isFinal || 
        options?.color?.includes('rose') || 
        options?.color?.includes('red')
    );

    overlays.forEach(box => {
        box.classList.remove('hidden');
        box.classList.add('flex');

        const redImgs = typeof box.querySelectorAll === 'function'
            ? box.querySelectorAll('#cutscene-lightning-img-red, #cutscene-lightning-bolt-red')
            : [];
        redImgs.forEach(redImg => {
            if (isRedLightning) redImg.classList.remove('hidden');
            else redImg.classList.add('hidden');
        });

        const imgs = typeof box.querySelectorAll === 'function' ? box.querySelectorAll('img') : [];
        imgs.forEach((img, idx) => {
            if (!img) return;
            if (img.classList) {
                img.classList.remove('animate-lightning-fade');
                void img.offsetWidth; // Force reflow
                img.classList.add('animate-lightning-fade');
            }
            if (img.style) {
                img.style.animationDelay = `${idx * 0.1}s`;
            }
        });
    });

    const cloudFlicker = document.getElementById('cloud-lightning-flicker');
    if (cloudFlicker) {
        cloudFlicker.classList.remove('opacity-0');
        cloudFlicker.classList.add('opacity-75');
        setTimeout(() => {
            cloudFlicker.classList.remove('opacity-75');
            cloudFlicker.classList.add('opacity-0');
        }, 280);
    }

    // Chớp sáng cục bộ trên nền sét
    const impactFlash = document.getElementById('localized-impact-flash') || document.getElementById('trib-flash');
    if (impactFlash) {
        impactFlash.style.opacity = '0.7';
        setTimeout(() => {
            impactFlash.style.opacity = '0';
        }, 220);
    }

    setTimeout(() => {
        overlays.forEach(box => {
            box.classList.add('hidden');
            box.classList.remove('flex');
        });
        if (typeof callback === 'function') callback();
    }, 900);
}
window.triggerSoftTribulation = triggerSoftTribulation;
globalThis.triggerSoftTribulation = triggerSoftTribulation;

/**
 * BẢO VỆ NHÂN VẬT & KHÔNG GIAN ĐẢ TỌA LOFI (LỖI 1 & 2 FIX)
 * Đảm bảo khối <div class="cultivation-center"> luôn hiện diện ở chính giữa màn hình với:
 * - <img src="..." class="character-sprite">
 * - <div class="spirit-array"></div>
 */
/**
 * BẢO VỆ NHÂN VẬT & KHÔNG GIAN ĐẢ TỌA LOFI (CỤM NGUYÊN KHỐI: .cultivation-cluster)
 * Đảm bảo khối <div class="cultivation-cluster"> luôn hiện diện ở chính giữa màn hình với:
 * - <div id="floating-text-container"></div>
 * - <img src="..." class="character-avatar">
 * - <div class="spirit-array-base"></div> (Duy nhất, nằm ép sát dưới mông)
 * - <div id="particle-absorb-container"></div>
 */
function ensureCultivationCenter() {
    if (typeof document === 'undefined') return;
    const heroStage = document.getElementById('hero-stage') || document.getElementById('game-viewport') || document.getElementById('world-environment');
    if (!heroStage) return;

    let container = document.getElementById('player-avatar') || document.getElementById('character-stage-container') || document.querySelector('.cultivation-center') || document.querySelector('.cultivation-cluster');
    const avatarSrc = typeof DEFAULT_CULTIVATION_AVATAR !== 'undefined' ? DEFAULT_CULTIVATION_AVATAR : './assets/images/image_11.png';

    if (!container) {
        container = document.createElement('div');
        container.id = 'player-avatar';
        container.className = 'cultivation-center cultivation-cluster absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none';
        container.style.cssText = 'position: absolute; left: 50%; bottom: 8%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 10; pointer-events: none;';

        container.innerHTML = `
            <div id="floating-text-container" style="position: relative; margin-bottom: 10px; text-align: center; z-index: 5;"></div>
            <div class="character-wrapper character-and-array-wrapper relative flex justify-center items-center w-[350px] h-[450px] md:w-[500px] md:h-[650px]" style="position: relative; display: flex; justify-content: center; align-items: center;">
                <div class="cultivator-back-aura absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-cyan-600/15 rounded-full blur-3xl animate-breathe -z-10 pointer-events-none"></div>
                <div class="cultivator-ground-shadow absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 blur-md rounded-full w-48 h-6 md:w-64 md:h-8 pointer-events-none z-1" style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.4); filter: blur(8px); border-radius: 9999px; z-index: 1; pointer-events: none;"></div>
                <img id="char-main-img" src="${avatarSrc}" alt="Bản Thể Tu Sĩ Đả Tọa" class="character-sprite character-avatar w-[350px] h-[450px] md:w-[500px] md:h-[650px]" onerror="this.src='./assets/images/nu_tu_trong_suot.png'" style="position: relative; object-fit: contain; z-index: 2; margin-bottom: -30px; filter: drop-shadow(0px 25px 20px rgba(0,0,0,0.9)); pointer-events: auto;"/>
            </div>
            <div id="particle-absorb-container" style="position: absolute; width: 100%; height: 100%; pointer-events: none;"></div>
        `;
        heroStage.prepend(container);
    } else {
        if (!container.id || container.id === 'character-stage-container') container.id = 'player-avatar';
        if (!container.classList.contains('cultivation-center')) container.classList.add('cultivation-center');
        if (!container.classList.contains('cultivation-cluster')) container.classList.add('cultivation-cluster');
        if (!container.classList.contains('absolute')) container.classList.add('absolute');
        if (!container.classList.contains('bottom-[8%]')) container.classList.add('bottom-[8%]');
        if (!container.classList.contains('left-1/2')) container.classList.add('left-1/2');
        if (!container.classList.contains('-translate-x-1/2')) container.classList.add('-translate-x-1/2');
        container.style.cssText = 'position: absolute; left: 50%; bottom: 8%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; z-index: 10; pointer-events: none;';
        container.removeAttribute('title');
        container.onclick = null;
        
        // Dọn rác các div thừa cũ
        const oldFloat = container.querySelector('#cultivation-floating-container');
        if (oldFloat) oldFloat.remove();
        const oldParticles = container.querySelector('#spirit-particles-container');
        if (oldParticles) oldParticles.remove();

        // 1. Text nổi hiển thị Tu Vi (Neo trên đầu nhân vật)
        let floatBox = container.querySelector('#floating-text-container') || document.getElementById('floating-text-container');
        if (!floatBox) {
            floatBox = document.createElement('div');
            floatBox.id = 'floating-text-container';
            container.prepend(floatBox);
        }
        floatBox.style.cssText = 'position: relative; margin-bottom: 10px; width: 100%; text-align: center; z-index: 5;';

        // 2. Vùng chứa chung Nữ Tu và Bóng Đổ Cỏ (Khóa cứng với nhau, responsive w-[350px] h-[450px] md:w-[500px] md:h-[650px])
        let wrapper = container.querySelector('.character-wrapper') || container.querySelector('.character-and-array-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'character-wrapper character-and-array-wrapper relative flex justify-center items-center w-[350px] h-[450px] md:w-[500px] md:h-[650px]';
            container.appendChild(wrapper);
        } else {
            wrapper.classList.add('character-wrapper', 'character-and-array-wrapper', 'relative', 'flex', 'justify-center', 'items-center', 'w-[350px]', 'h-[450px]', 'md:w-[500px]', 'md:h-[650px]');
        }
        wrapper.style.cssText = 'position: relative; display: flex; justify-content: center; align-items: center;';

        // Xóa hoàn toàn Tụ Linh Trận theo lệnh Bản Tôn
        const existingArrays = wrapper.querySelectorAll('.spirit-array, .spirit-array-base, .spirit-gathering-array, .tribulation-altar-array');
        existingArrays.forEach(el => el.remove());

        // Bóng đen mờ hình oval siêu mỏng (bg-black/40 blur-md rounded-full w-48 h-6 md:w-64 md:h-8)
        let shadowEl = wrapper.querySelector('.cultivator-ground-shadow');
        if (!shadowEl) {
            shadowEl = document.createElement('div');
            shadowEl.className = 'cultivator-ground-shadow absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 blur-md rounded-full w-48 h-6 md:w-64 md:h-8 pointer-events-none z-1';
            shadowEl.style.cssText = 'position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.4); filter: blur(8px); border-radius: 9999px; z-index: 1; pointer-events: none;';
            wrapper.prepend(shadowEl);
        } else {
            shadowEl.classList.add('w-48', 'h-6', 'md:w-64', 'md:h-8');
        }

        // Vầng hào quang phía sau lưng (tạo chiều sâu phóng to 80%)
        let auraEl = wrapper.querySelector('.cultivator-back-aura');
        if (!auraEl) {
            auraEl = document.createElement('div');
            auraEl.className = 'cultivator-back-aura absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-cyan-600/15 rounded-full blur-3xl animate-breathe -z-10 pointer-events-none';
            wrapper.prepend(auraEl);
        } else {
            auraEl.classList.add('w-[80%]', 'h-[80%]');
        }

        // Hạch Tâm Đan Điền (Linh Khí Băng Lam tụ tại đan điền)
        let dantianEl = wrapper.querySelector('#dantian-core');
        if (!dantianEl) {
            dantianEl = document.createElement('div');
            dantianEl.id = 'dantian-core';
            dantianEl.className = 'absolute top-[60%] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 shadow-[0_0_25px_#22d3ee] animate-ping z-30 pointer-events-none';
            dantianEl.style.animationDuration = '2.5s';
            wrapper.appendChild(dantianEl);

            const dantianInner = document.createElement('div');
            dantianInner.className = 'absolute top-[60%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_#67e8f9] z-30 pointer-events-none';
            wrapper.appendChild(dantianInner);
        }

        // Ảnh nhân vật đè lên bóng cỏ (w-[350px] h-[450px] md:w-[500px] md:h-[650px])
        let img = wrapper.querySelector('.character-sprite') || wrapper.querySelector('.character-avatar') || container.querySelector('.character-avatar') || document.getElementById('char-main-img');
        if (!img) {
            img = document.createElement('img');
            img.id = 'char-main-img';
            img.className = 'character-sprite character-avatar w-[350px] h-[450px] md:w-[500px] md:h-[650px]';
            img.src = avatarSrc;
            img.alt = 'Bản Thể Tu Sĩ Đả Tọa';
            img.onerror = () => { img.src = './assets/images/nu_tu_trong_suot.png'; };
            wrapper.appendChild(img);
        } else {
            img.classList.add('character-sprite', 'character-avatar', 'w-[350px]', 'h-[450px]', 'md:w-[500px]', 'md:h-[650px]');
            if (img.parentElement !== wrapper) {
                wrapper.appendChild(img);
            }
        }
        if (!img.src || img.src.includes('undefined')) img.src = avatarSrc;
        img.style.cssText = 'position: relative; object-fit: contain; z-index: 2; margin-bottom: -30px; filter: drop-shadow(0px 25px 20px rgba(0,0,0,0.9)); pointer-events: auto;';

        // 3. Vùng chứa hạt Linh khí hấp thụ
        let particleBox = container.querySelector('#particle-absorb-container') || document.getElementById('particle-absorb-container');
        if (!particleBox) {
            particleBox = document.createElement('div');
            particleBox.id = 'particle-absorb-container';
            container.appendChild(particleBox);
        }
        particleBox.style.cssText = 'position: absolute; width: 100%; height: 100%; pointer-events: none;';

        // DỌN RÁC TRIỆT ĐỂ: Xóa sạch vĩnh viễn mọi Tụ Linh Trận / Vòng tròn ma pháp dưới chân trên toàn hệ thống
        const strayArrays = document.querySelectorAll('.spirit-array, .spirit-array-base, .spirit-gathering-array, .tribulation-altar-array, [class*="magic_circle"]');
        strayArrays.forEach(el => el.remove());
    }
}
window.ensureCultivationCenter = ensureCultivationCenter;
globalThis.ensureCultivationCenter = ensureCultivationCenter;

/**
 * Hiệu ứng Floating Text Tu Vi màu xanh lá bay lên từ đỉnh đầu nhân vật (Phần 3)
 */
function spawnTuViFloatingText(amount, label = 'Tu Vi') {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('floating-text-container') || document.getElementById('cultivation-floating-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'tuvi-floating-text';
    const numText = typeof amount === 'number' ? `+${amount.toLocaleString('vi-VN')}` : `+${amount}`;
    el.innerHTML = `<i class="fa-solid fa-leaf text-emerald-400 mr-1 text-[11px]"></i>${numText} ${label}`;

    const offset = (Math.random() * 30 - 15).toFixed(0);
    el.style.left = `calc(50% + ${offset}px)`;

    container.appendChild(el);
    setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 1600);
}
window.spawnTuViFloatingText = spawnTuViFloatingText;

/**
 * Hiệu ứng hạt linh khí hấp thụ (Particles): Sinh ra từ bottom: 50px bay ngược lên ngực/đan điền (Phần 4)
 */
function spawnSpiritParticles(count = 3) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('particle-absorb-container') || document.getElementById('spirit-particles-container');
    if (!container) return;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'absorb-particle-dot spirit-particle-dot';

            // Hội tụ từ tụ linh trận (tọa độ phân tán quanh trục giữa)
            const spreadX = Math.random() * 120 - 60;
            p.style.left = `calc(50% + ${spreadX}px)`;

            const size = (4 + Math.random() * 4).toFixed(0);
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;

            const duration = (1.0 + Math.random() * 0.4).toFixed(2);
            p.style.animationDuration = `${duration}s`;

            container.appendChild(p);
            setTimeout(() => {
                if (p && p.parentNode) p.parentNode.removeChild(p);
            }, parseFloat(duration) * 1000);
        }, i * 120);
    }
}
window.spawnSpiritParticles = spawnSpiritParticles;

/**
 * Chặn hoàn toàn mọi hành vi click vào Nhân vật / Tụ Linh Trận (Chống gian lận auto-click)
 * Tu vi tăng hoàn toàn thụ động (Idle 100%) qua GameLoop / setInterval.
 */
function handleManualQiGathering(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    return false;
}
window.handleManualQiGathering = handleManualQiGathering;

function triggerScreenShake() {
    // Bãi bỏ rung lắc màn hình gây chóng mặt - chuyển sang hiệu ứng thiên kiếp lôi quang êm dịu
    triggerSoftTribulation();
}

function triggerDaoTamBarGlitch() {
    if (typeof document === 'undefined') return;
    const bar = document.getElementById('stat-daotam-bar');
    const container = document.getElementById('stat-daotam-container') || (bar ? bar.parentElement : null);
    if (container) {
        container.classList.add('animate-shake');
        setTimeout(() => container.classList.remove('animate-shake'), 600);
    }
}

function openEncounterModal(encIdx = null) {
    if (rejectLockedFeature('btn_lich_luyen')) return;
    const encountersList = (typeof ENCOUNTERS !== 'undefined' && Array.isArray(ENCOUNTERS) && ENCOUNTERS.length > 0) ? ENCOUNTERS : [];
    if (encountersList.length === 0) return;
    if (encIdx === null) {
        encIdx = Math.floor(Math.random() * encountersList.length);
    }
    currentEncounter = encountersList[encIdx];
    const backdrop = document.getElementById('ancient-scroll-backdrop');
    const content = document.getElementById('ancient-scroll-content');
    if (!backdrop || !content) return;

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex', 'active');
    backdrop.style.setProperty('display', 'flex', 'important');
    backdrop.style.setProperty('z-index', '10000', 'important');

    const righteous = currentEncounter.righteous || {};
    const demonic = currentEncounter.demonic || {};

    const itemDict = {
        pill_qi: "Tụ Khí Đan",
        pill_foundation: "Trúc Cơ Đan",
        herb_spirit: "Hạt Tử Linh Chi",
        herb_blood: "Hạt Huyết Sâm",
        stone_ore: "Huyền Thiết",
        pill_breakthrough: "Phá Cảnh Đan"
    };

    const rItemText = righteous.giveItem ? `+${righteous.giveItem.count} ${itemDict[righteous.giveItem.id] || righteous.giveItem.id}` : '';
    const dItemText = demonic.giveItem ? `+${demonic.giveItem.count} ${itemDict[demonic.giveItem.id] || demonic.giveItem.id}` : '';

    content.innerHTML = `
        <div class="space-y-4 text-slate-100">
            <!-- NỬA TRÊN: HOÀN CẢNH NGẶT NGHÈO / THẾ KHÓ -->
            <div class="bg-gradient-to-b from-stone-900/95 via-neutral-900/95 to-stone-950/95 p-4 sm:p-5 rounded-xl border border-stone-700/60 shadow-inner space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                    <span class="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-compass text-amber-400"></i> ${currentEncounter.location || 'Hồng Hoang Đại Lục'}
                    </span>
                    <span class="text-xs font-serif text-slate-400 italic">Vạn Giới Nghiệp Chướng • Sinh Tử Phán Định</span>
                </div>
                <h3 class="font-serif text-lg sm:text-xl font-bold text-amber-200">${currentEncounter.title}</h3>
                <p class="text-xs sm:text-sm font-serif leading-relaxed text-slate-300 border-t border-stone-800/80 pt-2">
                    ${currentEncounter.story}
                </p>
            </div>

            <!-- NỬA DƯỚI: 2 THẺ LỚN ĐỐI LẬP (BÀN CÂN SINH TỬ) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <!-- THẺ TRÁI: CHÍNH ĐẠO - THANH TÂM -->
                <div class="encounter-choice-card relative rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/80 hover:border-amber-400/90 bg-gradient-to-b from-slate-900 via-teal-950/50 to-slate-950 flex flex-col justify-between transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(45,212,191,0.3)] group">
                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-emerald-300 font-serif flex items-center gap-1.5">
                                <i class="fa-solid fa-spa text-emerald-400"></i> ${righteous.tag || 'CHÍNH ĐẠO'} • ${righteous.title || 'THANH TÂM'}
                            </span>
                            <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold">Thủ Bản Tâm</span>
                        </div>
                        <p class="text-xs text-slate-300 leading-snug">
                            ${righteous.desc || 'Thuận theo thiên địa, giữ vẹn đạo tâm thanh tịnh.'}
                        </p>
                        <!-- Phần thưởng tâm cảnh -->
                        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-1">
                            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Phần Thưởng Tâm Cảnh:</div>
                            <div class="text-xs font-mono font-bold text-gold-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-gem text-amber-400"></i> +${(righteous.stones || 500).toLocaleString('vi-VN')} Linh Thạch
                            </div>
                            <div class="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-bolt text-emerald-400"></i> +${(righteous.exp || 400).toLocaleString('vi-VN')} Tu Vi
                            </div>
                            <div class="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-yin-yang text-teal-300"></i> +${righteous.righteousDelta || 15} Chánh Khí (+Đạo Tâm)
                            </div>
                            ${rItemText ? `
                                <div class="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-gift text-amber-400"></i> ${rItemText}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <button type="button" onclick="chooseEncounterOption('righteous')" class="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-400/60 hover:border-emerald-300 text-xs font-bold font-serif shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-feather-pointed"></i>
                        <span>CHỌN CHÍNH ĐẠO</span>
                    </button>
                </div>

                <!-- THẺ PHẢI: MA ĐẠO - TRẦM LUÂN -->
                <div class="encounter-choice-card relative rounded-2xl p-4 sm:p-5 border-2 border-rose-600 hover:border-purple-500 bg-gradient-to-b from-rose-950/80 via-purple-950/70 to-black animate-pulse flex flex-col justify-between transition-all duration-300 shadow-[0_0_25px_rgba(225,29,72,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)] group overflow-hidden">
                    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-600/10 via-transparent to-transparent"></div>
                    <div class="relative space-y-2.5 z-10">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-rose-300 font-serif flex items-center gap-1.5">
                                <i class="fa-solid fa-skull text-rose-400 animate-pulse"></i> ${demonic.tag || 'MA ĐẠO'} • ${demonic.title || 'TRẦM LUÂN'}
                            </span>
                            <span class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 font-mono font-bold">Thôn Phệ</span>
                        </div>
                        <p class="text-xs text-slate-300 leading-snug">
                            ${demonic.desc || 'Nghịch thiên đoạt mệnh, sát phạt vô tình để cầu đại đạo.'}
                        </p>
                        <!-- Cám dỗ ma đạo -->
                        <div class="p-2.5 rounded-xl bg-black/60 border border-rose-500/40 space-y-1">
                            <div class="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Cám Dỗ Nghịch Thiên:</div>
                            <div class="text-xs font-mono font-bold text-gold-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-gem text-amber-400"></i> +${(demonic.stones || 15000).toLocaleString('vi-VN')} Linh Thạch
                            </div>
                            <div class="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-bolt text-cyan-400"></i> +${(demonic.exp || 20000).toLocaleString('vi-VN')} Tu Vi
                            </div>
                            <div class="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                                <i class="fa-solid fa-fire text-rose-500"></i> +${demonic.demonicDelta || 25} Ma Nghiệp (+Tâm Ma)
                            </div>
                            ${dItemText ? `
                                <div class="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-gift text-purple-400"></i> ${dItemText}
                                </div>
                            ` : ''}
                            <div class="mt-2 p-1.5 rounded-lg bg-rose-950/90 border border-rose-600 text-[10px] font-black text-rose-200 text-center flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
                                <span>CẢNH BÁO: TÂM MA GIA TĂNG, DỄ BỊ THIÊN KIẾP TRẢM!</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="chooseEncounterOption('demonic')" class="relative z-10 mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500 hover:border-rose-400 text-xs font-bold font-serif shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                        <i class="fa-solid fa-skull-crossbones"></i>
                        <span>CHỌN MA ĐẠO</span>
                    </button>
                </div>
            </div>

            <!-- BỎ QUA -->
            <div class="text-center pt-2">
                <button type="button" onclick="closeEncounterModal()" class="text-xs text-slate-400 hover:text-slate-200 font-serif underline cursor-pointer">
                    Bỏ qua, không vướng vào nhân quả này
                </button>
            </div>
        </div>
    `;
}

function chooseEncounterOption(type) {
    if (!currentEncounter) return;
    const opt = currentEncounter[type] || {};
    const stones = opt.stones || (type === 'righteous' ? 500 : 15000);
    const exp = opt.exp || (type === 'righteous' ? 400 : 20000);
    const rDelta = opt.righteousDelta || (type === 'righteous' ? 15 : -10);
    const dDelta = opt.demonicDelta || (type === 'demonic' ? 25 : -5);

    state.stones = (state.stones || 0) + stones;
    addExp(exp);

    if (opt.giveItem && typeof addItemToInventory === 'function') {
        addItemToInventory(opt.giveItem.id, opt.giveItem.count);
    }

    if (type === 'righteous') {
        state.righteousKarma = (state.righteousKarma || 0) + Math.abs(rDelta);
        state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + 12);
        state.tamMa = Math.max(0, 100 - state.daoTam);

        triggerHolyFlash();
        if (typeof playSound === 'function') playSound('holy_bell');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Đạo tâm kiên định, vạn tà bất xâm!", "text-amber-300 font-extrabold text-base");
        }
        addLog(`✨ <span class='text-amber-300 font-bold'>[Chính Đạo • ${opt.title || 'Thanh Tâm'}]</span> ${opt.rewardText || 'Đạo tâm kiên định, vạn tà bất xâm!'} Nhận <span class='text-gold-300'>+${stones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class='text-emerald-400'>+${exp.toLocaleString('vi-VN')} Tu Vi</span>, <span class='text-cyan-300'>+12 Đạo Tâm</span>.`, "text-amber-300", "karma-righteous");
    } else {
        state.demonicKarma = (state.demonicKarma || 0) + Math.abs(dDelta);
        state.daoTam = Math.max(0, (state.daoTam != null ? state.daoTam : 100) - 25);
        state.tamMa = Math.min(100, 100 - state.daoTam);

        triggerScreenShake();
        triggerBloodFlash();
        if (typeof playSound === 'function') playSound('blood_thunder');
        if (typeof window.triggerCameraTrauma === 'function') window.triggerCameraTrauma(0.4, 'ancient-scroll-backdrop');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Sát nghiệp quấn thân! Tâm Ma gia tăng!", "text-rose-500 font-black text-lg animate-pulse");
        }
        triggerDaoTamBarGlitch();

        addLog(`🩸 <span class='text-rose-500 font-bold animate-pulse'>[Ma Đạo • ${opt.title || 'Trầm Luân'}]</span> ${opt.rewardText || 'Sát nghiệp quấn thân!'} Đoạt được <span class='text-gold-300'>+${stones.toLocaleString('vi-VN')} Linh Thạch</span>, <span class='text-jade-300'>+${exp.toLocaleString('vi-VN')} Tu Vi</span>!`, "text-rose-400", "karma-demonic");
    }

    closeEncounterModal();
    updateHUD();
    saveGameState();
    if (typeof refreshExpeditionUI === 'function') refreshExpeditionUI();
}

function closeEncounterModal() {
    const backdrop = document.getElementById('ancient-scroll-backdrop');
    if (backdrop) {
        backdrop.style.setProperty('display', 'none', 'important');
        backdrop.classList.add('hidden');
        backdrop.classList.remove('flex', 'active');
    }
}

// ==========================================
// TÍNH NĂNG KHIÊU CHIẾN TÂM MA (TRẢM TÂM MA)
// ==========================================

function challengeTamMa() {
    const currentTamMa = state.tamMa != null ? state.tamMa : Math.max(0, 100 - (state.daoTam ?? 100));
    if (currentTamMa < 50) {
        addLog('Tâm Ma chưa đủ lớn để hóa hình (Cần Tâm Ma ≥ 50)!', 'text-stone-400');
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, 'Tâm Ma chưa đủ lớn để hóa hình', 'text-stone-400 font-bold');
        }
        return;
    }

    const effectiveStats = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {
        atk: state.atk || 28,
        def: state.def || 14,
        maxHp: state.maxHp || 500,
        maxMp: state.maxMp || 200,
        crit: state.crit || 5,
        dodge: state.dodge || 0
    };

    const playerCombatMaxHP = effectiveStats.maxHp;
    let playerCurHP = playerCombatMaxHP;

    // 1. Chỉ số Tâm Ma (Shadow Stats):
    // tamMaHP = player.HP * 1.0 (Máu bằng nhau)
    // tamMaATK = player.ATK * 1.15 (Tâm ma hung hãn hơn, Công kích +15%)
    // tamMaDEF = player.DEF * 0.85 (Tâm ma sơ hở hơn, Phòng ngự -15%)
    const tamMaHP = playerCombatMaxHP;
    let tamMaCurHP = tamMaHP;
    const tamMaATK = Math.max(1, Math.round(effectiveStats.atk * 1.15));
    const tamMaDEF = Math.max(0, Math.round(effectiveStats.def * 0.85));

    // 2. Buff "Chân Ngã" của Người Chơi:
    // playerCritBonus = (player.DaoTam / 100) * 15
    // playerDodgeBonus = (player.DaoTam / 100) * 10
    const currentDaoTam = Math.max(0, Math.min(100, Math.round(state.daoTam != null ? state.daoTam : (100 - currentTamMa))));
    const playerCritBonus = (currentDaoTam / 100) * 15;
    const playerDodgeBonus = (currentDaoTam / 100) * 10;
    const playerTotalCrit = (effectiveStats.crit || 5) + playerCritBonus;
    const playerTotalDodge = (effectiveStats.dodge || 0) + playerDodgeBonus;
    const chanNgaDmgBuff = 1.0 + (currentDaoTam / 100) * 0.15;

    const combatLogs = [];
    let playerWon = false;
    const maxRounds = 30;

    for (let round = 1; round <= maxRounds; round++) {
        // --- 1. LƯỢT NGƯỜI CHƠI (BẢN THỂ TẤN CÔNG TRƯỚC) ---
        const isCrit = Math.random() * 100 < playerTotalCrit;
        let basePDmg = Math.max(effectiveStats.atk * 0.2, effectiveStats.atk - tamMaDEF);
        let pDmg = Math.round(basePDmg * chanNgaDmgBuff * (0.95 + Math.random() * 0.1));
        if (isCrit) pDmg = Math.round(pDmg * 1.6);
        pDmg = Math.max(1, pDmg);

        tamMaCurHP = Math.max(0, tamMaCurHP - pDmg);
        combatLogs.push({
            round,
            attacker: 'player',
            isCrit,
            damage: pDmg,
            targetHpLeft: tamMaCurHP,
            targetMaxHp: tamMaHP,
            text: `<span class="text-cyan-400 font-bold">[Hiệp ${round}]</span> Ngươi vận chuyển Chân Ngã Đạo Tâm, ${isCrit ? '<b class="text-amber-400 font-extrabold animate-pulse">🔥 BẠO KÍCH!</b> ' : ''}trảm Tâm Ma bay mất <b class="text-cyan-300 font-mono font-bold">${pDmg.toLocaleString('vi-VN')}</b> khí huyết! (Tâm Ma: ${tamMaCurHP.toLocaleString('vi-VN')}/${tamMaHP.toLocaleString('vi-VN')})`
        });

        if (tamMaCurHP <= 0) {
            playerWon = true;
            break;
        }

        // --- 2. LƯỢT TÂM MA TẤN CÔNG ---
        const isDodge = Math.random() * 100 < playerTotalDodge;
        if (isDodge) {
            combatLogs.push({
                round,
                attacker: 'tam_ma_miss',
                isDodge: true,
                damage: 0,
                targetHpLeft: playerCurHP,
                targetMaxHp: playerCombatMaxHP,
                text: `<span class="text-rose-400 font-bold">[Hiệp ${round}]</span> Tâm Ma gầm thét vung vuốt quỷ quyệt, nhưng ngươi tâm cảnh thanh tịnh, <b class="text-emerald-400 font-bold">THÂN PHÁP NÉ TRÁNH</b> hoàn hảo!`
            });
        } else {
            const isDemonCrit = Math.random() * 100 < 5;
            let baseMDmg = Math.max(tamMaATK * 0.15, tamMaATK - effectiveStats.def);
            let mDmg = Math.round(baseMDmg * (0.95 + Math.random() * 0.1));
            if (isDemonCrit) mDmg = Math.round(mDmg * 1.5);
            mDmg = Math.max(1, mDmg);

            playerCurHP = Math.max(0, playerCurHP - mDmg);
            combatLogs.push({
                round,
                attacker: 'tam_ma',
                isCrit: isDemonCrit,
                damage: mDmg,
                targetHpLeft: playerCurHP,
                targetMaxHp: playerCombatMaxHP,
                text: `<span class="text-rose-400 font-bold">[Hiệp ${round}]</span> Tâm Ma cuồng bạo cắn trả${isDemonCrit ? ' <b class="text-rose-500 font-bold">(BẠO KÍCH!)</b>' : ''}, ngươi trúng tà niệm mất <b class="text-rose-400 font-mono font-bold">${mDmg.toLocaleString('vi-VN')}</b> khí huyết! (Bản thể: ${playerCurHP.toLocaleString('vi-VN')}/${playerCombatMaxHP.toLocaleString('vi-VN')})`
            });

            if (playerCurHP <= 0) {
                playerWon = false;
                break;
            }
        }
    }

    // 3. XỬ LÝ KẾT QUẢ & STATE:
    if (playerWon) {
        // Set player.TamMa = 0 (Thanh tẩy hoàn toàn)
        state.tamMa = 0;
        state.daoTam = 100;
        if (state.player) {
            state.player.tam_ma = 0;
            state.player.dao_tam = 100;
        }
        if (typeof playSound === 'function') playSound('break');
        addLog("✨ <span class='text-emerald-400 font-bold'>[Trảm Tâm Ma Thắng Lợi]</span> Ngươi đã chém vỡ gông cùm trong tim, Đạo Tâm thông minh, Tâm Ma tiêu tán!", "text-emerald-400 font-bold");
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Đạo Tâm Thông Minh • Tâm Ma Tiêu Tán!", "text-emerald-400 font-extrabold text-base");
        }
    } else {
        // Set player.HP = 1 (Trọng thương) & Tâm Ma +10
        state.hp = 1;
        state.tamMa = Math.min(100, currentTamMa + 10);
        state.daoTam = Math.max(0, 100 - state.tamMa);
        if (state.player) {
            state.player.tam_ma = state.tamMa;
            state.player.dao_tam = state.daoTam;
        }
        if (typeof playSound === 'function') playSound('hit');
        addLog("💀 <span class='text-rose-500 font-bold animate-pulse'>[Trảm Tâm Ma Thất Bại]</span> Tà niệm lấn át! Ngươi bị chính cái bóng của mình đánh trọng thương, Tâm Ma càng thêm sâu nặng!", "text-rose-400 font-bold");
        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, "Tà niệm cắn trả! Trọng thương!", "text-rose-500 font-black text-base");
        }
    }

    updateHUD();
    saveGameState();

    // Hiển thị Modal Trảm Tâm Ma chi tiết
    showTamMaBattleModal({
        playerWon,
        combatLogs,
        playerStats: {
            hp: playerCombatMaxHP,
            atk: effectiveStats.atk,
            def: effectiveStats.def,
            critDodge: `+${playerCritBonus.toFixed(1)}% / +${playerDodgeBonus.toFixed(1)}%`
        },
        demonStats: {
            hp: tamMaHP,
            atk: tamMaATK,
            def: tamMaDEF
        },
        finalTamMa: state.tamMa,
        finalDaoTam: state.daoTam
    });
}

let tamMaPlaybackTimer = null;
let currentTamMaBattleData = null;

function renderTamMaResultBanner(battleData) {
    const banner = document.getElementById('tm-result-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    if (battleData.playerWon) {
        banner.className = 'p-3 rounded-xl border border-emerald-500/60 bg-emerald-950/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse';
        banner.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-base font-serif font-bold text-emerald-300">
                <i class="fa-solid fa-crown text-amber-400"></i>
                <span>THẮNG LỢI VẺ VANG: TRẢM MA THÀNH CÔNG!</span>
            </div>
            <p class="text-xs font-serif mt-1 text-emerald-100">
                "Ngươi đã chém vỡ gông cùm trong tim, Đạo Tâm thông minh, Tâm Ma tiêu tán!"
            </p>
            <div class="mt-2 text-[11px] font-mono flex items-center justify-center gap-4 text-emerald-400">
                <span>Tâm Ma: <b class="text-white">0/100</b></span>
                <span>Đạo Tâm: <b class="text-emerald-300">100/100</b></span>
            </div>
        `;
        if (window.soundSystem?.play) window.soundSystem.play('victory');
    } else {
        banner.className = 'p-3 rounded-xl border border-rose-500/60 bg-rose-950/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse';
        banner.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-base font-serif font-bold text-rose-300">
                <i class="fa-solid fa-skull-crossbones text-rose-500"></i>
                <span>THẤT BẠI: TÀ NIỆM CẮN TRẢ!</span>
            </div>
            <p class="text-xs font-serif mt-1 text-rose-100">
                "Tà niệm lấn át! Ngươi bị chính cái bóng của mình đánh trọng thương, Tâm Ma càng thêm sâu nặng!"
            </p>
            <div class="mt-2 text-[11px] font-mono flex items-center justify-center gap-4 text-rose-400">
                <span>Khí Huyết: <b class="text-rose-300 font-bold">1</b></span>
                <span>Tâm Ma: <b class="text-rose-400">+10 (${battleData.finalTamMa}/100)</b></span>
            </div>
        `;
        if (window.soundSystem?.play) window.soundSystem.play('fail');
    }
}

function skipTamMaPlayback() {
    if (tamMaPlaybackTimer) {
        clearInterval(tamMaPlaybackTimer);
        tamMaPlaybackTimer = null;
    }
    if (!currentTamMaBattleData) return;
    const battleData = currentTamMaBattleData;
    const logContainer = document.getElementById('tm-battle-log');
    if (logContainer) {
        logContainer.innerHTML = battleData.combatLogs.map(l => `<div class="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">${l.text}</div>`).join('');
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    renderTamMaResultBanner(battleData);
    const roundCount = document.getElementById('tm-round-counter');
    if (roundCount) roundCount.textContent = `Hiệp ${battleData.combatLogs.length}/${battleData.combatLogs.length}`;
}
window.skipTamMaPlayback = skipTamMaPlayback;

function showTamMaBattleModal(battleData) {
    const modal = document.getElementById('tam-ma-battle-modal');
    if (!modal) return;

    currentTamMaBattleData = battleData;
    if (tamMaPlaybackTimer) {
        clearInterval(tamMaPlaybackTimer);
        tamMaPlaybackTimer = null;
    }

    const pName = document.getElementById('tm-player-name');
    if (pName) pName.textContent = state.player?.name || 'Tiêu Dao Tử';

    const pHp = document.getElementById('tm-player-hp');
    if (pHp) pHp.textContent = battleData.playerStats.hp.toLocaleString('vi-VN');

    const pAtk = document.getElementById('tm-player-atk');
    if (pAtk) pAtk.textContent = battleData.playerStats.atk.toLocaleString('vi-VN');

    const pDef = document.getElementById('tm-player-def');
    if (pDef) pDef.textContent = battleData.playerStats.def.toLocaleString('vi-VN');

    const pCd = document.getElementById('tm-player-crit-dodge');
    if (pCd) pCd.textContent = battleData.playerStats.critDodge;

    const mHp = document.getElementById('tm-demon-hp');
    if (mHp) mHp.textContent = battleData.demonStats.hp.toLocaleString('vi-VN');

    const mAtk = document.getElementById('tm-demon-atk');
    if (mAtk) mAtk.textContent = `${battleData.demonStats.atk.toLocaleString('vi-VN')} (+15%)`;

    const mDef = document.getElementById('tm-demon-def');
    if (mDef) mDef.textContent = `${battleData.demonStats.def.toLocaleString('vi-VN')} (-15%)`;

    const banner = document.getElementById('tm-result-banner');
    if (banner) {
        banner.classList.add('hidden');
        banner.innerHTML = '';
    }

    const logContainer = document.getElementById('tm-battle-log');
    if (logContainer) logContainer.innerHTML = '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const playerBox = document.getElementById('tm-player-avatar-box');
    const demonBox = document.getElementById('tm-demon-avatar-box');

    let logIndex = 0;
    const totalLogs = battleData.combatLogs.length;

    tamMaPlaybackTimer = setInterval(() => {
        if (logIndex >= totalLogs) {
            clearInterval(tamMaPlaybackTimer);
            tamMaPlaybackTimer = null;
            renderTamMaResultBanner(battleData);
            return;
        }

        const log = battleData.combatLogs[logIndex];
        logIndex++;

        const roundCount = document.getElementById('tm-round-counter');
        if (roundCount) roundCount.textContent = `Hiệp ${log.round}/${totalLogs}`;

        // Animate clash between avatars
        if (log.attacker === 'player') {
            playerBox?.classList.add('tm-lunge-player');
            setTimeout(() => playerBox?.classList.remove('tm-lunge-player'), 280);

            demonBox?.classList.add('tm-hurt-flash');
            setTimeout(() => demonBox?.classList.remove('tm-hurt-flash'), 280);

            if (mHp) mHp.textContent = log.targetHpLeft.toLocaleString('vi-VN');

            if (log.isCrit) {
                if (typeof window.triggerCameraTrauma === 'function') window.triggerCameraTrauma(0.35, 'tam-ma-battle-modal');
                if (window.soundSystem?.play) window.soundSystem.play('break');
            } else {
                if (window.soundSystem?.play) window.soundSystem.play('whoosh');
            }
        } else if (log.attacker === 'tam_ma') {
            demonBox?.classList.add('tm-lunge-demon');
            setTimeout(() => demonBox?.classList.remove('tm-lunge-demon'), 280);

            playerBox?.classList.add('tm-hurt-flash');
            setTimeout(() => playerBox?.classList.remove('tm-hurt-flash'), 280);

            if (pHp) pHp.textContent = log.targetHpLeft.toLocaleString('vi-VN');

            if (window.soundSystem?.play) window.soundSystem.play('hit');
        } else if (log.attacker === 'tam_ma_miss') {
            demonBox?.classList.add('tm-lunge-demon');
            setTimeout(() => demonBox?.classList.remove('tm-lunge-demon'), 280);

            playerBox?.classList.add('tm-dodge-back');
            setTimeout(() => playerBox?.classList.remove('tm-dodge-back'), 250);

            if (window.soundSystem?.play) window.soundSystem.play('whoosh');
        }

        if (logContainer) {
            const entry = document.createElement('div');
            entry.className = 'p-1.5 rounded bg-slate-900/60 border border-slate-800/80';
            entry.innerHTML = log.text;
            logContainer.appendChild(entry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, 380);
}

function closeTamMaBattleModal() {
    if (tamMaPlaybackTimer) {
        clearInterval(tamMaPlaybackTimer);
        tamMaPlaybackTimer = null;
    }
    const modal = document.getElementById('tam-ma-battle-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    updateHUD();
    saveGameState();
    if (typeof currentCharacterTab !== 'undefined' && currentCharacterTab === 'inventory') {
        renderCharacterHub('inventory');
    }
}

window.challengeTamMa = challengeTamMa;
window.tramTamMa = challengeTamMa;
window.showTamMaBattleModal = showTamMaBattleModal;
window.closeTamMaBattleModal = closeTamMaBattleModal;

// ==========================================
// HỆ THỐNG LỊCH LUYỆN BẢN ĐỒ THẾ GIỚI & AUTO-COMBAT (STAGE 5)
// ==========================================

function normalizeInventoryEntry(entry) {
    const nested = entry.id && typeof entry.id === 'object' ? entry.id
        : entry.name && typeof entry.name === 'object' ? entry.name : null;
    const item = nested ? { ...entry, ...nested, count: entry.count ?? entry.quantity ?? nested.count ?? 1 } : { ...entry };
    const rarityLevels = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythic: 6 };
    item.rarity = rarityLevels[item.rarity] || item.rarity;
    if (item.type === 'Material') item.type = 'Nguyên Liệu';
    if (item.type === 'Consumable' && item.category === 'Pill') item.type = 'Đan Dược';
    if (item.type === 'Equipment') item.type = 'Trang Bị';
    return item;
}

function addItemToInventory(itemId, count = 1) {
    count = Number(count);
    if (!Number.isFinite(count) || count <= 0) return;
    const suppliedItem = itemId && typeof itemId === 'object' ? normalizeInventoryEntry(itemId) : null;
    if (suppliedItem) itemId = suppliedItem.id;
    if (typeof itemId !== 'string' || !itemId) return;
    let item = state.inventory.find(i => i.id === itemId);
    if (item) {
        item.count = (Number(item.count) || 0) + count;
    } else {
        const defaultItem = suppliedItem || DEFAULT_STATE.inventory?.find(i => i.id === itemId);
        if (defaultItem) {
            item = structuredClone(defaultItem);
            item.count = count;
            state.inventory.push(item);
        } else {
            state.inventory.push({
                id: itemId,
                name: itemId,
                count: count,
                type: 'Vật Phẩm',
                rarity: 1
            });
        }
    }
}
window.addItemToInventory = addItemToInventory;

function getExpeditionDuration(zone) {
    if (!zone) return 15;
    const combatPower = typeof getCombatPower === 'function' ? getCombatPower() : 100;
    const ratio = Math.max(0.5, Math.min(3.5, combatPower / (zone.recommendedPower || 100)));
    return Math.max(6, Math.round(zone.baseSeconds / ratio));
}
window.getExpeditionDuration = getExpeditionDuration;

function refreshExpeditionUI() {
    const pageContent = document.getElementById('world-encounter-page-content');
    if (pageContent) {
        renderWorldExpeditionDashboard(pageContent);
    }
    const hubContent = document.getElementById('hub-modal-content');
    if (hubContent && document.getElementById('hub-modal')?.classList.contains('active')) {
        renderWorldExpeditionDashboard(hubContent);
    }
}
window.refreshExpeditionUI = refreshExpeditionUI;

function startExpedition(zoneId) {
    if (typeof EXPEDITION_ZONES === 'undefined') return;
    const zone = EXPEDITION_ZONES.find(z => z.id === zoneId);
    if (!zone) return;
    if (state.realmIndex < zone.minRealmIndex) {
        addLog(`[Lịch Luyện] Cảnh giới chưa đủ! Cần đạt ${REALMS[zone.minRealmIndex]?.name || 'cao hơn'}.`, 'text-rose-400');
        return;
    }
    const duration = getExpeditionDuration(zone);
    state.expedition = {
        zoneId: zone.id,
        startTime: Date.now(),
        duration: duration,
        autoRepeat: state.expedition?.autoRepeat ?? true,
        lastReward: state.expedition?.lastReward || null
    };
    if (typeof playSound === 'function') playSound('sword');
    addLog(`[Lịch Luyện] Bắt đầu thám hiểm <b>${zone.name}</b>. Dự kiến hoàn thành sau ${duration} giây!`, 'text-amber-300');
    saveGameState();
    refreshExpeditionUI();
}
window.startExpedition = startExpedition;

function cancelExpedition() {
    if (!state.expedition || !state.expedition.zoneId) return;
    const zone = typeof EXPEDITION_ZONES !== 'undefined' ? EXPEDITION_ZONES.find(z => z.id === state.expedition.zoneId) : null;
    state.expedition.zoneId = null;
    state.expedition.startTime = 0;
    state.expedition.duration = 0;
    addLog(`[Lịch Luyện] Đã thu hồi thần thức, dừng thám hiểm ${zone ? zone.name : ''}.`, 'text-slate-400');
    saveGameState();
    refreshExpeditionUI();
}
window.cancelExpedition = cancelExpedition;

function toggleExpeditionAuto(enabled) {
    if (!state.expedition) {
        state.expedition = { zoneId: null, startTime: 0, duration: 0, autoRepeat: true, lastReward: null };
    }
    state.expedition.autoRepeat = Boolean(enabled);
    saveGameState();
}
window.toggleExpeditionAuto = toggleExpeditionAuto;

function completeExpedition(zone, silent = false) {
    if (!zone || !zone.loot) return;
    const loot = zone.loot;
    const isSuppressed = typeof isHeavenlySuppressed === 'function' && isHeavenlySuppressed();
    
    const rawStones = Math.floor(Math.random() * (loot.stonesMax - loot.stonesMin + 1)) + loot.stonesMin;
    const stonesGain = isSuppressed ? Math.max(1, Math.floor(rawStones * 0.1)) : rawStones;
    state.stones += stonesGain;

    const expGain = Math.floor(Math.random() * (loot.expMax - loot.expMin + 1)) + loot.expMin;
    const addedExp = addExp(expGain);

    const rewards = [`+${stonesGain.toLocaleString()} Linh Thạch${isSuppressed ? ' (Áp Chế -90%)' : ''}`, `+${(addedExp?.gainedAmount || 0).toLocaleString()} Tu Vi`];

    // Tài nguyên rơi giảm 90% (tỷ lệ drop giảm x10)
    const dropMultiplier = isSuppressed ? 0.1 : 1.0;

    if (Math.random() < (loot.oreChance * dropMultiplier)) {
        const rawOre = Math.floor(Math.random() * (loot.oreMax - loot.oreMin + 1)) + loot.oreMin;
        const oreCount = isSuppressed ? Math.max(1, Math.floor(rawOre * 0.1)) : rawOre;
        addItemToInventory('stone_ore', oreCount);
        rewards.push(`${oreCount} Huyền Thiết`);
    }

    if (loot.spiritSeedChance && Math.random() < (loot.spiritSeedChance * dropMultiplier)) {
        addItemToInventory('herb_spirit', 1);
        rewards.push(`1 Hạt Tử Linh Chi`);
    }

    if (loot.bloodSeedChance && Math.random() < (loot.bloodSeedChance * dropMultiplier)) {
        addItemToInventory('herb_blood', 1);
        rewards.push(`1 Hạt Huyết Ngọc Sâm`);
    }

    if (loot.specialDrops) {
        for (const sp of loot.specialDrops) {
            if (Math.random() < (sp.chance * dropMultiplier)) {
                addItemToInventory(sp.itemId, 1);
                rewards.push(`1 ${sp.itemName}`);
            }
        }
    }

    state.expedition.lastReward = {
        time: Date.now(),
        zoneName: zone.name,
        rewardText: rewards.join(', ')
    };

    if (!silent) {
        addLog(`[Lịch Luyện] Hoàn thành thám hiểm <b>${zone.name}</b>! Thu hoạch: <span class="text-emerald-400">${rewards.join(', ')}</span>.`, 'reward', 'lich-luyen-' + (zone.id || zone.name));
        if (typeof playSound === 'function') playSound('qi');
        updateHUD();
    }

    if (state.expedition.autoRepeat) {
        state.expedition.startTime = Date.now();
        state.expedition.duration = getExpeditionDuration(zone);
    } else {
        state.expedition.zoneId = null;
        state.expedition.startTime = 0;
        state.expedition.duration = 0;
    }
    saveGameState();

    refreshExpeditionUI();

    // 18% cơ duyên kích hoạt Kỳ Ngộ Cổ Tịch khi kết thúc chuyến thám hiểm
    const scrollModal = document.getElementById('ancient-scroll-backdrop');
    const isScrollOpen = scrollModal && !scrollModal.classList.contains('hidden');
    if (!silent && !isScrollOpen && Math.random() < 0.18 && typeof openEncounterModal === 'function') {
        setTimeout(() => {
            openEncounterModal();
        }, 500);
    }
}
window.completeExpedition = completeExpedition;

function tickExpedition() {
    if (!state.expedition || !state.expedition.zoneId || typeof EXPEDITION_ZONES === 'undefined') return;
    const zone = EXPEDITION_ZONES.find(z => z.id === state.expedition.zoneId);
    if (!zone) {
        state.expedition.zoneId = null;
        return;
    }
    const elapsed = (Date.now() - state.expedition.startTime) / 1000;
    const duration = state.expedition.duration || getExpeditionDuration(zone);
    if (elapsed >= duration) {
        completeExpedition(zone, false);
    } else {
        const progressEl = document.getElementById('expedition-active-progress');
        const countEl = document.getElementById('expedition-active-countdown');
        if (progressEl && countEl) {
            const percent = Math.min(100, Math.max(0, (elapsed / duration) * 100));
            progressEl.style.width = `${percent}%`;
            const remaining = Math.max(0, Math.ceil(duration - elapsed));
            countEl.textContent = `${remaining}s`;
        }
    }
}
window.tickExpedition = tickExpedition;

function renderWorldExpeditionDashboard(content) {
    if (!content) return;
    const combatPower = typeof getCombatPower === 'function' ? getCombatPower() : 0;
    const currentRealm = REALMS[state.realmIndex];
    const expState = state.expedition || { zoneId: null, startTime: 0, duration: 0, autoRepeat: true, lastReward: null };
    const activeZone = (expState.zoneId && typeof EXPEDITION_ZONES !== 'undefined') ? EXPEDITION_ZONES.find(z => z.id === expState.zoneId) : null;

    let activeBannerHtml = '';
    if (activeZone) {
        const elapsed = Math.max(0, (Date.now() - expState.startTime) / 1000);
        const duration = Math.max(1, expState.duration || getExpeditionDuration(activeZone));
        const progressPercent = Math.min(100, (elapsed / duration) * 100);
        const remainingSec = Math.max(0, Math.ceil(duration - elapsed));

        activeBannerHtml = `
            <div class="expedition-active-banner p-3.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 backdrop-blur mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                            <i class="fa-solid ${activeZone.icon}"></i>
                        </span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-serif font-bold text-sm text-emerald-200">${activeZone.name}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    <i class="fa-solid fa-spinner fa-spin mr-1"></i>Đang thám hiểm
                                </span>
                            </div>
                            <div class="text-[11px] text-slate-300">
                                Dự kiến còn: <strong id="expedition-active-countdown" class="font-mono text-emerald-400">${remainingSec}s</strong> • Tốc độ: <span class="text-amber-300 font-mono">${duration}s/chuyến</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="cancelExpedition()" class="px-3 py-1.5 rounded-lg text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 transition">
                            <i class="fa-solid fa-ban mr-1"></i>Dừng Thám Hiểm
                        </button>
                    </div>
                </div>
                <div class="expedition-progress-track">
                    <div id="expedition-active-progress" class="expedition-progress-fill" style="width: ${progressPercent}%;"></div>
                </div>
                ${expState.lastReward ? `
                    <div class="mt-2 text-[11px] text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/50 flex items-center justify-between">
                        <span><i class="fa-solid fa-gift text-amber-400 mr-1.5"></i>Chuyến trước (${expState.lastReward.zoneName}): <span class="text-emerald-300 font-medium">${expState.lastReward.rewardText}</span></span>
                        <span class="text-[10px] text-slate-400">${expState.autoRepeat ? 'Tự động lặp lại' : 'Đơn chuyến'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    const zones = typeof EXPEDITION_ZONES !== 'undefined' ? EXPEDITION_ZONES : [];
    const zonesHtml = zones.map(zone => {
        const isUnlocked = state.realmIndex >= zone.minRealmIndex;
        const isActive = activeZone && activeZone.id === zone.id;
        const duration = getExpeditionDuration(zone);
        const powerRatio = combatPower / zone.recommendedPower;
        let speedBadge = '';
        if (powerRatio >= 2.5) {
            speedBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">⚡ Siêu Tốc</span>';
        } else if (powerRatio >= 1.0) {
            speedBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">Cân Bằng</span>';
        } else {
            speedBadge = '<span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">Gian Nan</span>';
        }

        const drops = [
            `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 border border-amber-500/30"><i class="fa-solid fa-coins mr-1"></i>${zone.loot.stonesMin}-${zone.loot.stonesMax} LT</span>`,
            `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-600/40"><i class="fa-solid fa-cubes mr-1"></i>Huyền Thiết</span>`
        ];
        if (zone.loot.spiritSeedChance) {
            drops.push(`<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-300 border border-emerald-500/30"><i class="fa-solid fa-seedling mr-1"></i>Tử Linh Chi</span>`);
        }
        if (zone.loot.bloodSeedChance) {
            drops.push(`<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-rose-300 border border-rose-500/30"><i class="fa-solid fa-seedling mr-1"></i>Huyết Sâm</span>`);
        }
        if (zone.loot.specialDrops) {
            zone.loot.specialDrops.forEach(sp => {
                drops.push(`<span class="px-1.5 py-0.5 rounded bg-purple-950 text-[10px] text-purple-300 border border-purple-500/40 font-semibold"><i class="fa-solid fa-sparkles mr-1"></i>${sp.itemName}</span>`);
            });
        }

        let actionButton = '';
        if (isActive) {
            actionButton = `
                <button disabled class="w-full py-2 rounded-lg bg-emerald-600/40 border border-emerald-500/80 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default">
                    <i class="fa-solid fa-spinner fa-spin text-sm"></i> Đang Thám Hiểm...
                </button>
            `;
        } else if (isUnlocked) {
            actionButton = `
                <button onclick="startExpedition('${zone.id}')" class="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-person-hiking"></i> ${activeZone ? 'Chuyển Sang Vùng Này' : 'Bắt Đầu Lịch Luyện'} (${duration}s)
                </button>
            `;
        } else {
            actionButton = `
                <button disabled class="w-full py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-500 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-lock"></i> Cần Cảnh Giới ${REALMS[zone.minRealmIndex]?.name || 'cao hơn'}
                </button>
            `;
        }

        return `
            <div class="expedition-zone-card p-3.5 flex flex-col justify-between ${isActive ? 'is-active-zone' : ''}">
                <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600/50 flex items-center justify-center text-slate-200 text-sm">
                                <i class="fa-solid ${zone.icon}"></i>
                            </span>
                            <div>
                                <h4 class="font-serif font-bold text-sm text-amber-200">${zone.name}</h4>
                                <span class="text-[10px] text-slate-400 font-serif italic">${zone.alias}</span>
                            </div>
                        </div>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/20">
                            ${zone.badge}
                        </span>
                    </div>

                    <p class="text-[11px] text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
                        ${zone.desc}
                    </p>

                    <div class="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-2.5 text-[11px]">
                        <div>
                            <span class="text-slate-400 block text-[10px]">Lực Chiến Đề Cử</span>
                            <span class="font-mono font-bold ${combatPower >= zone.recommendedPower ? 'text-emerald-400' : 'text-rose-400'}">
                                ${zone.recommendedPower.toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span class="text-slate-400 block text-[10px]">Thời Gian 1 Chuyến</span>
                            <div class="flex items-center gap-1 font-mono font-bold text-amber-300">
                                <span>${duration}s</span>
                                ${speedBadge}
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <span class="text-[10px] text-slate-400 block mb-1">Chiến Lợi Phẩm Dự Kiến:</span>
                        <div class="flex flex-wrap gap-1">
                            ${drops.join('')}
                        </div>
                    </div>
                </div>

                <div class="mt-2">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');

    const rKarma = Number(state.righteousKarma) || 0;
    const dKarma = Number(state.demonicKarma) || 0;
    let karmaTitleBadge = '';
    let karmaPassiveDesc = '';

    if (rKarma >= 40) {
        karmaTitleBadge = `<span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 font-serif font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">✨ Thái Thượng Chân Tiên</span>`;
        karmaPassiveDesc = `Chính khí hộ thể: <strong class="text-emerald-400 font-bold">+15% Tốc Độ Tu Vi</strong> toàn diện (+500 Lực Chiến).`;
    } else if (dKarma >= 40) {
        karmaTitleBadge = `<span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50 font-serif font-bold shadow-[0_0_10px_rgba(225,29,72,0.3)]">🩸 Cửu U Ma Tôn</span>`;
        karmaPassiveDesc = `Ma diễm ngập trời: <strong class="text-rose-400 font-bold">+15% Công Kích, +20% Sát Thương Bạo Kích</strong> (+600 Lực Chiến).`;
    } else {
        karmaTitleBadge = `<span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-serif font-semibold">🍃 Vô Cực Tiêu Dao</span>`;
        karmaPassiveDesc = `Tâm cảnh thanh tịnh, tùy duyên đắc đạo trong vạn cõi hồng trần.`;
    }

    content.innerHTML = `
        <div class="expedition-dashboard">
            <div class="page-header-title">
                <h2>🗺️ BẢN ĐỒ LỊCH LUYỆN</h2>
            </div>

            <!-- Controls & Info -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-3 rounded-xl bg-slate-900/70 border border-slate-700/60">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/30 to-yellow-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg shadow-inner">
                        <i class="fa-solid fa-map-location-dot"></i>
                    </div>
                    <div>
                        <h3 class="font-serif font-bold text-base text-amber-200">Bản Đồ Lịch Luyện — Thế Giới Tu Chân</h3>
                        <div class="flex items-center gap-2 text-xs text-slate-300">
                            <span>Lực Chiến: <strong class="font-mono text-amber-400">${combatPower.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span>Cảnh Giới: <strong class="text-emerald-400">${currentRealm?.name || 'Phàm Nhân'}</strong></span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <label class="inline-flex items-center cursor-pointer gap-2 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-700/60">
                        <input type="checkbox" ${expState.autoRepeat ? 'checked' : ''} onchange="toggleExpeditionAuto(this.checked)" class="sr-only peer">
                        <div class="relative w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span class="text-xs text-slate-200 font-medium">Tự Động Lặp Lại</span>
                    </label>

                    <button onclick="openEncounterModal()" class="px-3 py-1.5 text-xs bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-600/40 rounded-lg transition flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-scroll"></i> Kỳ Ngộ Cổ Tịch
                    </button>
                </div>
            </div>

            <!-- BẢNG NHÂN QUẢ CHÁNH MA (KARMIC ALIGNMENT CARD) -->
            <div class="karmic-path-card p-3.5 mb-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-300 text-base shadow-md">
                        <i class="fa-solid fa-yin-yang animate-spin-slow"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-serif font-bold text-sm text-slate-100">Đạo Nghiệp Chánh Ma:</h4>
                            ${karmaTitleBadge}
                        </div>
                        <p class="text-[11px] text-slate-400 mt-0.5">${karmaPassiveDesc}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3.5 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                    <div class="space-y-1">
                        <div class="flex items-center justify-between gap-2 text-[10px]">
                            <span class="text-emerald-300 font-bold"><i class="fa-solid fa-feather-pointed mr-1"></i>Chánh Khí:</span>
                            <span class="font-mono text-emerald-400 font-bold">${rKarma}</span>
                        </div>
                        <div class="w-24 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                            <div class="karmic-meter-fill-righteous h-full" style="width: ${Math.min(100, Math.round((rKarma / 50) * 100))}%"></div>
                        </div>
                    </div>

                    <div class="h-6 w-px bg-slate-800"></div>

                    <div class="space-y-1">
                        <div class="flex items-center justify-between gap-2 text-[10px]">
                            <span class="text-rose-400 font-bold"><i class="fa-solid fa-skull mr-1"></i>Ma Nghiệp:</span>
                            <span class="font-mono text-rose-400 font-bold">${dKarma}</span>
                        </div>
                        <div class="w-24 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                            <div class="karmic-meter-fill-demonic h-full" style="width: ${Math.min(100, Math.round((dKarma / 50) * 100))}%"></div>
                        </div>
                    </div>

                    <button onclick="openEncounterModal()" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1 shadow-sm" title="Vận dụng thần thức tìm kiếm cơ duyên">
                        <i class="fa-solid fa-feather"></i> Thám Tri
                    </button>
                </div>
            </div>

            <!-- Active Expedition Banner (if any) -->
            ${activeBannerHtml}

            <!-- Zones Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                ${zonesHtml}
            </div>
        </div>
    `;
}
window.renderWorldExpeditionDashboard = renderWorldExpeditionDashboard;

// ==========================================
// HỆ THỐNG TRẤN YÊU THÁP (DEMON SUPPRESSION TOWER SYSTEM)
// ==========================================

let currentDemonTowerTab = 'fight'; // 'fight' | 'rewards'

function openDemonTowerModal(initialTab = 'fight') {
    if (typeof hideAllGamePages === 'function') {
        hideAllGamePages('demon-tower-modal');
    }
    const modal = document.getElementById('demon-tower-modal');
    if (!modal) return;
    currentDemonTowerTab = (initialTab === 'rewards' || initialTab === 'chien-tich') ? 'rewards' : 'fight';
    renderDemonTowerModalContent(currentDemonTowerTab);
    modal.classList.remove('hidden');
    modal.classList.add('flex', 'active');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('z-index', '10000', 'important');
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    if (typeof playSound === 'function') playSound('bell');
}
window.openDemonTowerModal = openDemonTowerModal;

function switchDemonTowerTab(tab) {
    currentDemonTowerTab = (tab === 'rewards' || tab === 'chien-tich') ? 'rewards' : 'fight';
    renderDemonTowerModalContent(currentDemonTowerTab);
}
window.switchDemonTowerTab = switchDemonTowerTab;

function closeDemonTowerModal() {
    const modal = document.getElementById('demon-tower-modal');
    if (!modal) return;
    modal.style.setProperty('display', 'none', 'important');
    modal.classList.add('hidden');
    modal.classList.remove('flex', 'active');
    const vignette = document.getElementById('demon-tower-suppression-vignette');
    if (vignette) vignette.classList.add('hidden');
}
window.closeDemonTowerModal = closeDemonTowerModal;

function triggerBloodHurtFlash() {
    if (typeof document === 'undefined') return;
    const flash = document.createElement('div');
    flash.className = 'blood-hurt-flash';
    document.body.appendChild(flash);
    document.body.classList.add('animate-shake');
    setTimeout(() => {
        if (flash.parentNode) flash.remove();
        document.body.classList.remove('animate-shake');
    }, 800);
}
window.triggerBloodHurtFlash = triggerBloodHurtFlash;

function renderDemonTowerModalContent(activeTab = null) {
    const container = document.getElementById('demon-tower-content');
    if (!container) return;

    if (!Array.isArray(state.towerClaimedMilestones)) {
        state.towerClaimedMilestones = [];
    }
    if (typeof state.lastTowerSweepTime !== 'number') {
        state.lastTowerSweepTime = 0;
    }

    const tab = activeTab || currentDemonTowerTab || 'fight';
    currentDemonTowerTab = tab;

    // Cập nhật trạng thái các Tab Button trên Header
    const fightTabBtn = document.getElementById('demon-tower-tab-fight');
    const rewardsTabBtn = document.getElementById('demon-tower-tab-rewards');
    const titleEl = document.getElementById('demon-tower-title');
    const subtitleEl = document.getElementById('demon-tower-subtitle');

    if (fightTabBtn && rewardsTabBtn) {
        fightTabBtn.classList.toggle('is-active', tab === 'fight');
        rewardsTabBtn.classList.toggle('is-active', tab === 'rewards');
    }

    const floor = Math.max(1, Math.floor(Number(state.towerFloor) || 1));
    const monster = typeof getDemonTowerMonster === 'function' ? getDemonTowerMonster(floor) : {
        floor,
        name: "Huyết Dực Bọ Hung",
        icon: "fa-bug",
        title: `Huyết Dực Bọ Hung - Luyện Khí Sơ Kỳ`,
        displayTitle: `Huyết Dực Bọ Hung - Luyện Khí Sơ Kỳ`,
        realmName: "Luyện Khí",
        fullRealmName: "Luyện Khí Sơ Kỳ",
        tier: 1,
        hp: 500,
        atk: 30,
        def: 10,
        cp: 125,
        rewardStones: floor * 10,
        rewardExp: floor * 35,
        playerDebuffPercent: 0,
        playerDebuffRate: 0,
        tierDiff: 0
    };

    if (titleEl && subtitleEl) {
        if (tab === 'rewards') {
            titleEl.textContent = '📜 TRẤN YÊU THÁP • CHIẾN TÍCH & THƯỞNG';
            subtitleEl.textContent = 'Lưu danh ma bảng, thần thức càn quét & lĩnh ngộ mốc kho báu thượng cổ';
        } else {
            titleEl.textContent = '🗼 TRẤN YÊU THÁP';
            subtitleEl.textContent = 'Hầm ngục vô tận thử thách chiến lực & chém yêu đoạt bảo';
        }
    }

    // Nếu người chơi chọn Tab CHIẾN TÍCH & THƯỞNG
    if (tab === 'rewards') {
        renderDemonTowerRewardsView(container, floor, monster);
        return;
    }

    // TAB KHIÊU CHIẾN (ARENA BATTLE)
    const effective = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {
        maxHp: state.maxHp,
        atk: state.atk,
        def: state.def
    };
    const playerMaxHp = effective.maxHp || state.maxHp;
    const playerHp = Math.min(playerMaxHp, state.hp);
    const playerAtk = effective.atk || state.atk;
    const playerDef = effective.def || state.def;
    const playerStats = {
        hp: playerHp,
        maxHp: playerMaxHp,
        atk: playerAtk,
        def: playerDef,
        realmIndex: state.realmIndex || 0
    };

    const playerCP = (typeof getCombatPower === 'function')
        ? getCombatPower()
        : ((typeof calculateCombatPower === 'function') ? calculateCombatPower() : 1000);
    const monsterCP = monster.cp || (typeof calculateMonsterCombatPower === 'function' ? calculateMonsterCombatPower(monster) : Math.round((monster.atk * 2) + (monster.def * 1.5) + (monster.hp * 0.1)));
    const recommendedCP = monsterCP;

    // Tính Effective_Player_CP = Player_CP * (Hệ số Uy Áp Sát Thương Gây Ra / Hệ số Sát thương nhận vào)
    const pTier = playerStats.tier || playerStats.realmTier || (Math.floor((state.realmIndex || 0) / 4) + 1);
    const mTier = monster.tier || 1;
    const suppressionDealt = (typeof getRealmSuppression === 'function')
        ? getRealmSuppression(pTier, mTier)
        : ((typeof calculateRealmSuppression === 'function') ? calculateRealmSuppression(pTier, mTier) : 1.0);
    const suppressionTaken = (typeof getRealmSuppressionTaken === 'function')
        ? getRealmSuppressionTaken(pTier, mTier)
        : 1.0;
    const effectiveRatio = suppressionTaken > 0 ? (suppressionDealt / suppressionTaken) : suppressionDealt;
    const effectivePlayerCP = Math.round(playerCP * effectiveRatio);

    // Phân loại đánh giá & Cảnh báo thông minh theo Effective_Player_CP (UX Feedback):
    // 1. Effective_Player_CP >= Monster_CP * 1.2: Vượt trội -> Màu Xanh Lục, "Dễ như trở bàn tay"
    // 2. Effective_Player_CP >= Monster_CP * 0.9: Ngang kèo -> Màu Vàng, "Sát nút, cẩn thận trọng thương"
    // 3. Effective_Player_CP < Monster_CP * 0.9: Nguy hiểm -> Màu Đỏ sẫm, "Cửu tử nhất sinh, hãy lui lại!"
    let monsterCpColorClass = 'text-rose-500';
    let suggestionText = 'Cửu tử nhất sinh, hãy lui lại!';
    let suggestionColorClass = 'text-rose-400 font-extrabold';
    let suggestionIcon = 'fa-skull-crossbones';
    let comparisonBorderClass = 'border-rose-700/60 shadow-[0_0_15px_rgba(225,29,72,0.18)]';
    let comparisonBgClass = 'from-rose-950/40 via-slate-950 to-slate-950';

    if (effectivePlayerCP >= monsterCP * 1.2) {
        monsterCpColorClass = 'text-emerald-400';
        suggestionText = 'Dễ như trở bàn tay';
        suggestionColorClass = 'text-emerald-400 font-bold';
        suggestionIcon = 'fa-circle-check';
        comparisonBorderClass = 'border-emerald-600/50 shadow-[0_0_15px_rgba(16,185,129,0.18)]';
        comparisonBgClass = 'from-emerald-950/40 via-slate-950 to-slate-950';
    } else if (effectivePlayerCP >= monsterCP * 0.9) {
        monsterCpColorClass = 'text-amber-400';
        suggestionText = 'Sát nút, cẩn thận trọng thương';
        suggestionColorClass = 'text-amber-400 font-bold';
        suggestionIcon = 'fa-triangle-exclamation';
        comparisonBorderClass = 'border-amber-600/50 shadow-[0_0_15px_rgba(245,158,11,0.18)]';
        comparisonBgClass = 'from-amber-950/40 via-slate-950 to-slate-950';
    } else {
        monsterCpColorClass = 'text-rose-500';
        suggestionText = 'Cửu tử nhất sinh, hãy lui lại!';
        suggestionColorClass = 'text-rose-400 font-extrabold';
        suggestionIcon = 'fa-skull-crossbones';
        comparisonBorderClass = 'border-rose-700/60 shadow-[0_0_15px_rgba(225,29,72,0.18)]';
        comparisonBgClass = 'from-rose-950/40 via-slate-950 to-slate-950';
    }

    const isExtremelyDangerous = (effectivePlayerCP < monsterCP * 0.5);

    const isSuppressed = (monster.playerDebuffPercent || 0) > 0;
    const debuffRate = monster.playerDebuffRate || 0;
    const debuffedHp = Math.max(1, Math.round(playerHp * (1 - debuffRate)));
    const debuffedMaxHp = Math.max(1, Math.round(playerMaxHp * (1 - debuffRate)));
    const debuffedAtk = Math.max(1, Math.round(playerAtk * (1 - debuffRate)));
    const debuffedDef = Math.max(0, Math.round(playerDef * (1 - debuffRate)));

    // Hiển thị hoặc ẩn hiệu ứng Viền Đỏ Chớp Nháy Uy Áp (Suppression Vignette)
    const vignette = document.getElementById('demon-tower-suppression-vignette');
    if (vignette) {
        if (isSuppressed) {
            vignette.classList.remove('hidden');
        } else {
            vignette.classList.add('hidden');
        }
    }

    const isWounded = playerHp <= 0;
    const currentRealmObj = (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS[state.realmIndex])
        ? REALMS[state.realmIndex]
        : { name: 'Luyện Khí' };
    const currentRealmName = currentRealmObj.name || 'Luyện Khí';

    container.innerHTML = `
        <div class="tower-pc-arena">
            <!-- CỘT TRÁI (30%): NGƯỜI CHƠI (PLAYER SIDE) -->
            <aside class="tower-card tower-card--player">
                <div class="tower-entity-header">
                    <div class="tower-entity-avatar-wrap">
                        <div class="tower-avatar tower-avatar--player">
                            <img src="./assets/images/image_11.png" onerror="this.src=DEFAULT_IMG_FALLBACK" alt="${state.player?.name || 'Tiêu Dao Tử'}" class="w-full h-full object-cover rounded-full">
                        </div>
                        <span class="tower-badge tower-badge--emerald">
                            <i class="fa-solid fa-user-shield mr-1"></i>Đạo Hữu
                        </span>
                    </div>
                    <div class="text-center mt-2 w-full">
                        <h4 class="font-serif font-bold text-sm lg:text-base text-emerald-300 truncate">${state.player?.name || 'Tiêu Dao Tử'}</h4>
                        <div class="text-[11px] font-mono text-emerald-400/80 mt-0.5">${currentRealmName}</div>
                        <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                            <span class="text-[10px] text-slate-400 font-mono">Chiến Lực:</span>
                            <span id="demon-tower-player-cp" class="text-xs font-mono font-black text-emerald-400">${playerCP.toLocaleString('vi-VN')} CP</span>
                        </div>
                    </div>
                </div>

                <!-- BẢNG CHỈ SỐ CHI TIẾT NGƯỜI CHƠI -->
                <div class="tower-stats-panel space-y-2 mt-3.5">
                    <!-- Sinh Mệnh (HP) -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400"><i class="fa-solid fa-heart text-rose-500 mr-1.5"></i>Khí Huyết:</span>
                            <strong class="${debuffedHp <= debuffedMaxHp * 0.3 ? 'text-rose-400 animate-pulse font-bold' : 'text-emerald-400'}">
                                ${debuffedHp.toLocaleString()} / ${debuffedMaxHp.toLocaleString()}
                            </strong>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300" style="width: ${Math.min(100, Math.max(0, Math.round((debuffedHp / Math.max(1, debuffedMaxHp)) * 100)))}%"></div>
                        </div>
                    </div>

                    <!-- Công Kích -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-bolt text-amber-400 mr-1.5"></i>Công Kích:</span>
                        <div class="text-right">
                            <strong class="text-amber-300 font-bold">${debuffedAtk.toLocaleString()}</strong>
                            ${isSuppressed ? `<span class="text-[9px] text-rose-400 font-bold block">(-${monster.playerDebuffPercent}%)</span>` : ''}
                        </div>
                    </div>

                    <!-- Phòng Ngự -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-shield text-sky-400 mr-1.5"></i>Phòng Ngự:</span>
                        <div class="text-right">
                            <strong class="text-sky-300 font-bold">${debuffedDef.toLocaleString()}</strong>
                            ${isSuppressed ? `<span class="text-[9px] text-rose-400 font-bold block">(-${monster.playerDebuffPercent}%)</span>` : ''}
                        </div>
                    </div>

                    <!-- Thân Pháp -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-wind text-teal-400 mr-1.5"></i>Thân Pháp:</span>
                        <span class="text-teal-300 font-bold">${effective.spd || 100}</span>
                    </div>

                    <!-- Bạo Kích -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-crosshairs text-orange-400 mr-1.5"></i>Bạo Kích:</span>
                        <span class="text-orange-300 font-bold">${effective.critRate || 5}%</span>
                    </div>

                    <!-- Xuyên Giáp -->
                    <div class="flex justify-between items-center text-xs font-mono py-1">
                        <span class="text-slate-400"><i class="fa-solid fa-bullseye text-indigo-400 mr-1.5"></i>Phá Giáp:</span>
                        <span class="text-indigo-300 font-bold">${effective.armorPen || 0}%</span>
                    </div>
                </div>

                ${isSuppressed ? `
                    <div class="mt-3 p-2 rounded-xl bg-red-950/80 border border-red-500/70 text-center animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                        <span class="text-[10px] uppercase font-bold text-red-200 tracking-wide block">
                            <i class="fa-solid fa-triangle-exclamation text-yellow-400 mr-1"></i>Uy Áp Cảnh Giới
                        </span>
                        <span class="text-[11px] text-rose-300 font-semibold block mt-0.5">
                            Giảm -${monster.playerDebuffPercent}% mọi thuộc tính
                        </span>
                    </div>
                ` : ''}
            </aside>

            <!-- CỘT GIỮA (40%): SÀN ĐẤU / VS CLASH / BUTTON KHIÊU CHIẾN -->
            <main class="tower-card tower-card--arena flex flex-col justify-between">
                <!-- Floor Header -->
                <div class="text-center pt-1">
                    <span class="text-[11px] uppercase tracking-widest text-rose-400 font-mono font-bold block mb-0.5">
                        <i class="fa-solid fa-skull mr-1.5"></i>HẦM NGỤC VÔ TẬN • BÁT QUÁI PHONG ẤN
                    </span>
                    <h3 id="demon-tower-floor-text" class="font-serif text-3xl lg:text-4xl font-extrabold text-rose-500 tracking-widest drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]">
                        TẦNG ${floor}
                    </h3>
                </div>

                <!-- VS Clash Stage Visual -->
                <div class="tower-vs-arena-stage my-2">
                    <div class="tower-energy-ring"></div>
                    <div class="tower-vs-emblem">
                        <span class="tower-vs-text">VS</span>
                    </div>
                </div>

                <!-- Banner Cảnh Báo Uy Áp Nếu Có -->
                ${isSuppressed ? `
                    <div id="demon-tower-suppression-banner" class="p-2 rounded-xl bg-gradient-to-r from-red-950/95 via-rose-950/90 to-red-950/95 border border-red-500 text-red-100 text-center font-bold text-xs animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-yellow-400 text-sm animate-bounce"></i>
                        <span>CHỊU SỰ UY ÁP CỦA ${(monster.realmName || 'ĐẠI CẢNH GIỚI').toUpperCase()}! (-${monster.playerDebuffPercent}% CHỈ SỐ)</span>
                        <i class="fa-solid fa-triangle-exclamation text-yellow-400 text-sm animate-bounce"></i>
                    </div>
                ` : ''}

                <!-- Matchup Comparison Card -->
                <div class="p-3 rounded-xl bg-gradient-to-r ${comparisonBgClass} border ${comparisonBorderClass} space-y-1.5">
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5 font-mono">
                            <span class="text-slate-400 text-[11px]"><i class="fa-solid fa-shield-halved text-emerald-400 mr-1"></i>Lực Chiến Ta:</span>
                            <strong class="text-emerald-400 font-bold">${playerCP.toLocaleString('vi-VN')}</strong>
                        </div>
                        <div class="flex items-center gap-1.5 font-mono">
                            <span class="text-slate-400 text-[11px]"><i class="fa-solid fa-crosshairs text-amber-400 mr-1"></i>Chiến Lực Đề Cử:</span>
                            <strong id="demon-tower-recommended-cp" class="${monsterCpColorClass} font-bold">${recommendedCP.toLocaleString('vi-VN')}</strong>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-xs">
                        <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                            <i class="fa-solid fa-scale-balanced text-slate-500"></i> Đánh giá cục diện:
                        </span>
                        <span id="demon-tower-matchup-suggestion" class="${suggestionColorClass} flex items-center gap-1.5 text-xs">
                            <i class="fa-solid ${suggestionIcon}"></i>
                            <span>${suggestionText}</span>
                        </span>
                    </div>
                </div>

                <!-- Phần Thưởng Vượt Tầng -->
                <div class="p-2.5 rounded-xl bg-slate-950/80 border border-rose-900/50 flex items-center justify-between text-xs">
                    <span class="text-slate-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-gift text-amber-400"></i> Phần Thưởng Vượt Tầng:
                    </span>
                    <div class="flex items-center gap-3 font-mono font-bold">
                        <span class="text-amber-300 flex items-center gap-1">
                            <i class="fa-solid fa-coins text-amber-400"></i> +${monster.rewardStones.toLocaleString()} LT
                        </span>
                        <span class="text-emerald-300 flex items-center gap-1">
                            <i class="fa-solid fa-sparkles text-emerald-400"></i> +${monster.rewardExp.toLocaleString()} Tu Vi
                        </span>
                    </div>
                </div>

                ${isWounded ? `
                    <div class="p-2 rounded-lg bg-rose-950/80 border border-rose-700/60 text-center text-xs text-rose-300">
                        <i class="fa-solid fa-heart-crack mr-1"></i> Đạo hữu đang trọng thương! Hãy click "Vận Công" ở màn hình chính để hồi phục Khí Huyết.
                    </div>
                ` : ''}

                <!-- Nút Khiêu Chiến Siêu To -->
                <button id="btn-challenge-tower" onclick="challengeDemonTowerFloor()" ${isWounded ? 'disabled' : ''} class="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 hover:from-rose-600 hover:to-red-500 text-white font-serif font-extrabold text-base lg:text-lg shadow-[0_0_25px_rgba(225,29,72,0.6)] active:scale-95 transition flex items-center justify-center gap-2.5 ${isWounded ? 'opacity-50 cursor-not-allowed filter grayscale' : (isExtremelyDangerous ? 'opacity-80 hover:opacity-100 ring-2 ring-rose-500/80' : '')}">
                    <i class="fa-solid fa-khanda text-base lg:text-lg"></i>
                    <span>KHIÊU CHIẾN TẦNG ${floor}</span>
                </button>
            </main>

            <!-- CỘT PHẢI (30%): BOSS / QUÁI VẬT (MONSTER SIDE) -->
            <aside class="tower-card tower-card--boss">
                <div class="tower-entity-header">
                    <div class="tower-entity-avatar-wrap">
                        <div class="tower-avatar tower-avatar--boss">
                            ${monster.image ? `<img src="${monster.image}" alt="${monster.name}" class="w-full h-full object-cover rounded-full" onerror="this.src=DEFAULT_IMG_FALLBACK">` : `<i class="fa-solid ${monster.icon || 'fa-skull'} text-3xl sm:text-4xl text-rose-400"></i>`}
                        </div>
                        <span class="tower-badge tower-badge--rose">
                            ${monster.fullRealmName || monster.realmName || 'Luyện Khí'} • Tầng ${floor}
                        </span>
                    </div>
                    <div class="text-center mt-2 w-full">
                        <h4 id="demon-tower-monster-title" class="font-serif font-bold text-sm lg:text-base text-rose-200 truncate">${monster.displayTitle || `${monster.name} - ${monster.fullRealmName || monster.realmName || 'Luyện Khí'}`}</h4>
                        <div class="text-[11px] font-mono text-rose-400/80 mt-0.5">Hung Thú Trấn Tháp</div>
                        <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                            <span class="text-[10px] text-slate-400 font-mono">Chiến Lực:</span>
                            <span id="demon-tower-monster-cp" class="text-xs font-mono font-black ${monsterCpColorClass}">${monsterCP.toLocaleString('vi-VN')} CP</span>
                        </div>
                    </div>
                </div>

                <!-- BẢNG CHỈ SỐ CHI TIẾT QUÁI VẬT -->
                <div class="tower-stats-panel space-y-2 mt-3.5">
                    <!-- Khí Huyết Boss -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400"><i class="fa-solid fa-heart-pulse text-rose-500 mr-1.5"></i>Khí Huyết:</span>
                            <strong class="text-rose-400 font-bold">${monster.hp.toLocaleString()}</strong>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-rose-700 to-rose-500" style="width: 100%"></div>
                        </div>
                    </div>

                    <!-- Công Kích Boss -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-bolt text-amber-400 mr-1.5"></i>Công Kích:</span>
                        <strong class="text-amber-400 font-bold">${monster.atk.toLocaleString()}</strong>
                    </div>

                    <!-- Phòng Ngự Boss -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-shield text-sky-400 mr-1.5"></i>Phòng Ngự:</span>
                        <strong class="text-sky-400 font-bold">${monster.def.toLocaleString()}</strong>
                    </div>

                    <!-- Phẩm Cấp -->
                    <div class="flex justify-between items-center text-xs font-mono py-1 border-b border-slate-800/60">
                        <span class="text-slate-400"><i class="fa-solid fa-layer-group text-purple-400 mr-1.5"></i>Phẩm Cấp:</span>
                        <span class="text-purple-300 font-bold">Tầng ${floor} (${monster.realmName || 'Luyện Khí'})</span>
                    </div>

                    <!-- Đặc Tính -->
                    <div class="p-2 rounded-lg bg-slate-950/70 border border-rose-950/60 text-[11px] text-slate-400 italic">
                        <i class="fa-solid fa-quote-left text-rose-500/50 mr-1"></i>
                        Hấp thu tử khí vô tận trong tháp, huyết nhục ngưng luyện như huyền thiết, sát phạt vô tình!
                    </div>
                </div>
            </aside>
        </div>
    `;
}
window.renderDemonTowerModalContent = renderDemonTowerModalContent;

function challengeDemonTowerFloor() {
    if (state.hp <= 0) {
        addLog('[Trấn Yêu Tháp] Đạo hữu đang trọng thương, không thể khiêu chiến! Hãy vận công hồi phục khí huyết trước.', 'text-rose-400');
        if (typeof playSound === 'function') playSound('danger');
        return;
    }

    const floor = Math.max(1, Math.floor(Number(state.towerFloor) || 1));
    const effective = typeof getEffectiveStats === 'function' ? getEffectiveStats() : {
        maxHp: state.maxHp,
        atk: state.atk,
        def: state.def
    };

    const currentRealmObj = REALMS[state.realmIndex] || REALMS[0];
    const playerTier = effective.tier || currentRealmObj?.tier || Math.min(5, Math.floor((state.realmIndex || 0) / 4) + 1);

    const monster = typeof getDemonTowerMonster === 'function' ? getDemonTowerMonster(floor) : {
        floor,
        name: "Huyết Dực Bọ Hung",
        realmName: "Luyện Khí",
        fullRealmName: "Luyện Khí Sơ Kỳ",
        tier: 1,
        hp: 500,
        atk: 30,
        def: 10,
        cp: 125,
        rewardStones: floor * 10,
        rewardExp: floor * 35,
        playerDebuffPercent: 0,
        playerDebuffRate: 0,
        tierDiff: 0
    };

    const monsterTier = monster.tier || (Math.floor((floor - 1) / 10) + 1);
    const playerAtk = Math.max(1, Math.round(effective.atk || state.atk));
    const playerDef = Math.max(0, Math.round(effective.def || state.def));
    let curPlayerHp = Math.max(1, Math.round(state.hp));
    let curMonsterHp = monster.hp;
    const monsterAtk = monster.atk;
    const monsterDef = monster.def;

    const playerFighter = {
        total_atk: playerAtk,
        total_def: playerDef,
        atk: playerAtk,
        def: playerDef,
        tier: playerTier,
        realmIndex: state.realmIndex,
        critChance: Math.min(0.85, (Number(effective.crit) || 5) / 100),
        critDamage: 1.5 + (Number(effective.critDamageBonus) || 0),
        damageBuff: (state.berserkBuffUntil && Date.now() < state.berserkBuffUntil) ? 1.5 : 1.0
    };
    const monsterFighter = {
        total_atk: monsterAtk,
        total_def: monsterDef,
        atk: monsterAtk,
        def: monsterDef,
        tier: monsterTier,
        critChance: monster.critChance || 0.05,
        critDamage: monster.critDamage || 1.5,
        damageBuff: 1.0
    };

    let rounds = 0;
    const maxRounds = 150;
    const isFloor50 = (floor === 50);

    // Kiểm tra các công pháp đặc thù người chơi trang bị
    let playerShield = 0;
    let playerLifestealRate = 0;
    let hasRevive = false;
    let reviveUsed = false;

    const equippedIds = Array.isArray(state.equippedSkills) ? state.equippedSkills : [];
    const allSkills = typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : [];

    equippedIds.forEach(id => {
        const sk = allSkills.find(s => s.id === id);
        if (!sk) return;
        const stats = sk.stats || {};
        // 1. Khiên chắn sát thương chuẩn
        if (stats.startCombatShieldPercent) {
            playerShield += Math.round((effective.maxHp || state.maxHp) * stats.startCombatShieldPercent);
        }
        if (stats.shieldEvery5sPercent || stats.damageToShieldPercent) {
            playerShield += Math.round((effective.maxHp || state.maxHp) * (stats.shieldEvery5sPercent || stats.damageToShieldPercent || 0.25));
        }
        if (sk.effect && (sk.effect.includes('khiên') || sk.effect.includes('Khiên'))) {
            if (playerShield === 0) playerShield = Math.round((effective.maxHp || state.maxHp) * 0.35);
        }
        // 2. Hút máu
        if (stats.lostHpLifestealPercent || stats.lifestealPercent) {
            playerLifestealRate += (stats.lostHpLifestealPercent || stats.lifestealPercent || 0.15);
        }
        if (sk.effect && (sk.effect.includes('hút máu') || sk.effect.includes('Hút máu') || sk.effect.includes('Thị Huyết'))) {
            if (playerLifestealRate === 0) playerLifestealRate = 0.20;
        }
        // 3. Hồi sinh
        if (stats.reviveOnce || (sk.effect && (sk.effect.includes('hồi sinh') || sk.effect.includes('Hồi sinh') || sk.effect.includes('Niết Bàn')))) {
            hasRevive = true;
        }
    });

    // Nếu có công pháp Thiên/Địa Phẩm mà chưa có hồi sinh/khiên thì tự động kích hoạt bảo hộ
    const hasHighGradeSkill = equippedIds.some(id => {
        const sk = allSkills.find(s => s.id === id);
        return sk && (sk.grade === 'thien' || sk.grade === 'dia' || sk.tier >= 4);
    });
    if (hasHighGradeSkill && !hasRevive && playerShield === 0) {
        playerShield = Math.round((effective.maxHp || state.maxHp) * 0.25);
    }

    if (typeof triggerSwordSlash === 'function') {
        triggerSwordSlash(window.innerWidth / 2, window.innerHeight / 2, -Math.PI / 4, '#f43f5e');
    }
    if (typeof triggerScreenShake === 'function') {
        triggerScreenShake(300);
    }

    // Turn-based auto combat sử dụng Công Thức Tính Sát Thương & Áp Chế Cảnh Giới chuẩn (calculateDamage)
    while (curPlayerHp > 0 && curMonsterHp > 0 && rounds < maxRounds) {
        rounds++;
        // 1. Người chơi xuất chiêu
        const playerStrike = typeof calculateDamage === 'function'
            ? calculateDamage(playerFighter, monsterFighter)
            : {
                damage: typeof calculateCombatDamage === 'function'
                    ? calculateCombatDamage(playerAtk, monsterDef, playerTier, monsterTier)
                    : Math.max(1, Math.floor(Math.max(playerAtk - monsterDef, playerAtk * 0.1)))
            };
        const dmgToMonster = Math.max(1, playerStrike.damage);
        curMonsterHp -= dmgToMonster;

        // Cơ chế Hút Máu (Lifesteal) của người chơi
        if (playerLifestealRate > 0) {
            const healed = Math.round(dmgToMonster * playerLifestealRate);
            curPlayerHp = Math.min(effective.maxHp || state.maxHp, curPlayerHp + healed);
        }

        if (curMonsterHp <= 0) break;

        // 2. Quái vật / Boss phản kích
        let bossAtkCurrent = monsterAtk;

        if (isFloor50) {
            if (rounds === 3) {
                bossAtkCurrent = Math.round(monsterAtk * 1.5);
                addLog(`⚡ <span class="text-rose-500 font-bold">[Boss Tầng 50 Hiệp 3]</span> Cửu U Huyết Ma Hoàng phóng thích <strong>Huyết Hải Cuồng Triều</strong> cuộn trào bỏ qua hộ giáp!`, 'text-rose-400');
            } else if (rounds === 5) {
                bossAtkCurrent = Math.round(monsterAtk * 2.5);
                addLog(`⚡ <span class="text-rose-500 font-bold">[Boss Tầng 50 Hiệp 5]</span> Cửu U Huyết Ma Hoàng bộc phát <strong>Hủy Diệt Lôi Đình</strong> trảm kích cực đại!`, 'text-rose-400');
            }
        }

        // Nếu là Boss 50: Bỏ qua 35% Phòng Ngự của người chơi (Armor Penetration)
        const targetDef = isFloor50 ? Math.round(playerDef * 0.65) : playerDef;
        const monsterStrike = typeof calculateDamage === 'function'
            ? calculateDamage({ ...monsterFighter, atk: bossAtkCurrent, total_atk: bossAtkCurrent }, { ...playerFighter, def: targetDef, total_def: targetDef })
            : {
                damage: typeof calculateCombatDamage === 'function'
                    ? calculateCombatDamage(bossAtkCurrent, targetDef, monsterTier, playerTier)
                    : Math.max(1, Math.floor(Math.max(bossAtkCurrent - targetDef, bossAtkCurrent * 0.15)))
            };
        let dmgToPlayer = Math.max(1, monsterStrike.damage);

        // Cơ chế Khiên Chắn (Shield) hấp thụ sát thương trước
        if (playerShield > 0) {
            if (playerShield >= dmgToPlayer) {
                playerShield -= dmgToPlayer;
                dmgToPlayer = 0;
            } else {
                dmgToPlayer -= playerShield;
                playerShield = 0;
            }
        }

        curPlayerHp -= dmgToPlayer;

        // Cơ chế Hồi Sinh (Revive / Nirvana)
        if (curPlayerHp <= 0 && hasRevive && !reviveUsed) {
            reviveUsed = true;
            curPlayerHp = Math.round((effective.maxHp || state.maxHp) * 0.4);
            playerShield += Math.round((effective.maxHp || state.maxHp) * 0.2);
            addLog(`🌟 <span class="text-amber-300 font-bold">[Niết Bàn Trùng Sinh]</span> Công pháp kích hoạt, hồi sinh ${curPlayerHp.toLocaleString()} Khí Huyết, ngưng tụ hộ thuẫn tiếp tục quyết đấu!`, 'text-amber-300');
        }
    }

    if (curMonsterHp <= 0 && curPlayerHp > 0) {
        // VICTORY!
        state.hp = Math.min(effective.maxHp || state.maxHp, Math.max(1, curPlayerHp));
        const rewardStones = monster.rewardStones;
        const rewardExp = monster.rewardExp;
        state.stones += rewardStones;
        const addedExp = typeof addExp === 'function' ? addExp(rewardExp) : { gainedAmount: rewardExp };

        state.towerFloor = floor + 1;
        if (floor >= 50) {
            state.hasClearedTower50 = true;
        }

        if (floor === 50) {
            addLog(`🌟 <span class="text-amber-300 font-black tracking-widest">[TRẤN YÊU THÁP ĐỈNH PHONG]</span> ĐẠI THẮNG TẦNG 50! Chém gục Cửu U Huyết Ma Hoàng, phá toái gông cùm, đả thông thông đạo PHI THĂNG LINH GIỚI!`, 'text-amber-300');
        } else {
            addLog(`🗡️ <span class="text-emerald-400 font-bold">[Trấn Yêu Tháp]</span> Đại phá Tầng ${floor}! Trảm sát <strong class="text-rose-400">${monster.displayTitle || monster.name}</strong>, thu hoạch <span class="text-amber-300 font-bold">+${rewardStones.toLocaleString()} Linh Thạch</span>, <span class="text-emerald-300 font-bold">+${addedExp.gainedAmount.toLocaleString()} Tu Vi</span>!`, 'text-emerald-400');
        }

        if (typeof playSound === 'function') {
            playSound('sword');
            setTimeout(() => playSound('bell'), 150);
        }

        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `THẮNG TẦNG ${floor}!`, 'text-emerald-400');
        }
        if (typeof triggerBreakthroughBurst === 'function') {
            triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
        }

        // Micro shake
        const card = document.querySelector('#demon-tower-modal section');
        if (card) {
            card.classList.add('animate-shake');
            setTimeout(() => card.classList.remove('animate-shake'), 400);
        }

        updateHUD();
        saveGameState();
        renderDemonTowerModalContent();
    } else {
        // DEFEAT!
        state.hp = 1;

        const brokeDefense = playerAtk > monsterDef;
        const suppressionMsg = (monster.playerDebuffPercent || 0) > 0 ? ` [Dính Uy Áp -${monster.playerDebuffPercent}%]` : '';
        addLog(`🩸 <span class="text-rose-400 font-bold">[Trấn Yêu Tháp]</span> Bất lực trước hung uy của <strong class="text-rose-300">${monster.name}</strong> (${monster.realmName || 'Đại Năng'}) tại Tầng ${floor}!${suppressionMsg} ${!brokeDefense ? 'Không thể phá phòng ngự hộ thể (sát thương 1 điểm), ' : ''}Bị đánh trọng thương tháo chạy!`, 'text-rose-400');

        if (typeof playSound === 'function') {
            playSound('thunder');
        }

        if (typeof spawnFloatingText === 'function') {
            spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, `TRỌNG THƯƠNG!`, 'text-rose-500');
        }

        closeDemonTowerModal();
        triggerBloodHurtFlash();

        updateHUD();
        saveGameState();
    }
}
window.challengeDemonTowerFloor = challengeDemonTowerFloor;

// ==========================================
// CHIẾN TÍCH, MỐC THƯỞNG & THẦN THỨC CÀN QUÉT TRẤN YÊU THÁP
// ==========================================

function renderDemonTowerRewardsView(container, floor, monster) {
    if (!Array.isArray(state.towerClaimedMilestones)) {
        state.towerClaimedMilestones = [];
    }
    if (typeof state.lastTowerSweepTime !== 'number') {
        state.lastTowerSweepTime = 0;
    }

    const highestClearedFloor = Math.max(0, floor - 1);
    const timeScale = state.timeScale || 1;
    const sweepCooldownMs = (4 * 3600 * 1000) / timeScale;
    const sweepElapsed = Date.now() - (state.lastTowerSweepTime || 0);
    const canSweep = highestClearedFloor > 0 && sweepElapsed >= sweepCooldownMs;
    const sweepRemainingSec = Math.max(0, Math.ceil((sweepCooldownMs - sweepElapsed) / 1000));
    const sweepRemHours = Math.floor(sweepRemainingSec / 3600);
    const sweepRemMins = Math.floor((sweepRemainingSec % 3600) / 60);

    const sweepRewardStones = Math.round(highestClearedFloor * 250);
    const sweepRewardExp = Math.round(highestClearedFloor * 800);

    const milestones = (typeof TOWER_MILESTONES !== 'undefined' && Array.isArray(TOWER_MILESTONES))
        ? TOWER_MILESTONES
        : [];

    const totalMilestones = milestones.length;
    const claimedCount = milestones.filter(m => state.towerClaimedMilestones.includes(m.floor)).length;

    container.innerHTML = `
        <div class="tower-rewards-container space-y-4">
            <!-- 1. THẺ THỐNG KÊ CHIẾN TÍCH NHANH -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-rose-950/70 shadow-md flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg flex-shrink-0">
                        <i class="fa-solid fa-flag"></i>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">Tầng Tháp Đã Vượt</span>
                        <b class="text-sm sm:text-base font-mono text-rose-300 font-bold">${highestClearedFloor} Tầng</b>
                    </div>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-amber-950/70 shadow-md flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg flex-shrink-0">
                        <i class="fa-solid fa-skull-crossbones"></i>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">Yêu Ma Trấn Thủ</span>
                        <b class="text-sm sm:text-base font-serif text-amber-200 font-bold truncate max-w-[140px] block" title="${monster.displayTitle || monster.name}">Tầng ${floor} (${monster.realmName || 'Luyện Khí'})</b>
                    </div>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-purple-950/70 shadow-md flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-300 text-lg flex-shrink-0">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">Kho Báu Thượng Cổ</span>
                        <b class="text-sm sm:text-base font-mono text-purple-300 font-bold">${claimedCount} / ${totalMilestones} Đã Nhận</b>
                    </div>
                </div>
            </div>

            <!-- 2. BANNER THẦN THỨC CÀN QUÉT (DAILY / COOLDOWN SWEEP) -->
            <div class="tower-sweep-panel">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-900/60 to-red-950/80 border border-rose-500/50 flex items-center justify-center text-rose-300 text-xl shadow-[0_0_15px_rgba(244,63,94,0.35)] flex-shrink-0">
                            <i class="fa-solid fa-wind animate-pulse"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-serif font-bold text-sm sm:text-base text-rose-200">Thần Thức Càn Quét</h3>
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${canSweep ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 animate-pulse' : 'bg-slate-900 text-slate-400 border border-slate-700'}">
                                    ${highestClearedFloor === 0 ? 'Chưa Vượt Tầng Nào' : (canSweep ? 'Sẵn Sàng Quét' : `Hồi Khí: ${sweepRemHours}h ${sweepRemMins}m`)}
                                </span>
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5">Phóng thích thần thức quét sạch toàn bộ ${highestClearedFloor} tầng tháp đã bình định để thu hoạch tài nguyên tích lũy.</p>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div class="text-right hidden sm:block text-xs font-mono">
                            <div class="text-amber-300 font-bold">+${sweepRewardStones.toLocaleString()} Linh Thạch</div>
                            <div class="text-emerald-400 font-bold">+${sweepRewardExp.toLocaleString()} Tu Vi</div>
                        </div>
                        <button type="button" onclick="sweepDemonTower()" ${canSweep ? '' : 'disabled'} class="w-full sm:w-auto px-5 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${canSweep ? 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] hover:brightness-125 cursor-pointer animate-pulse' : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'}">
                            <i class="fa-solid fa-broom text-xs"></i>
                            <span>${canSweep ? 'Càn Quét Tầng Tháp' : (highestClearedFloor === 0 ? 'Cần Vượt Tầng 1' : 'Đang Tụ Khí')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 3. DANH SÁCH MỐC PHẦN THƯỞNG LEO THÁP (TOWER MILESTONES) -->
            <div class="space-y-3">
                <div class="flex items-center justify-between pb-1 border-b border-rose-950/60">
                    <h3 class="font-serif font-bold text-sm text-gold-300 flex items-center gap-2">
                        <i class="fa-solid fa-crown text-amber-400"></i> Mốc Phần Thưởng Leo Tháp
                    </h3>
                    <span class="text-xs text-slate-400 font-mono">Thưởng Vĩnh Viễn</span>
                </div>

                <div class="tower-milestone-grid">
                    ${milestones.map(m => {
                        const isClaimed = state.towerClaimedMilestones.includes(m.floor);
                        const canClaim = !isClaimed && highestClearedFloor >= m.floor;
                        const isLocked = !isClaimed && highestClearedFloor < m.floor;
                        const remaining = m.floor - highestClearedFloor;

                        return `
                            <article class="tower-milestone-card ${canClaim ? 'can-claim' : (isClaimed ? 'claimed' : '')}">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-9 h-9 rounded-xl ${canClaim ? 'bg-amber-950/80 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]' : (isClaimed ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-500 border border-slate-800')} flex items-center justify-center text-sm flex-shrink-0">
                                            <i class="fa-solid ${m.icon || 'fa-gift'}"></i>
                                        </div>
                                        <div>
                                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded ${canClaim ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
                                                Mốc Tầng ${m.floor}
                                            </span>
                                            <h4 class="font-serif font-bold text-xs text-slate-100 mt-1">${m.title}</h4>
                                        </div>
                                    </div>
                                    ${isClaimed ? `
                                        <span class="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                                            <i class="fa-solid fa-circle-check"></i> Đã nhận
                                        </span>
                                    ` : ''}
                                </div>

                                <p class="text-[11px] text-slate-400 leading-relaxed">${m.desc}</p>

                                <!-- Phần Thưởng Của Mốc -->
                                <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs font-mono">
                                    <div class="flex flex-wrap items-center gap-3">
                                        <span class="text-amber-400 flex items-center gap-1">
                                            <i class="fa-solid fa-coins text-[10px]"></i> +${m.stones.toLocaleString()} LT
                                        </span>
                                        <span class="text-emerald-400 flex items-center gap-1">
                                            <i class="fa-solid fa-sparkles text-[10px]"></i> +${m.exp.toLocaleString()} Tu Vi
                                        </span>
                                        ${m.jade ? `
                                            <span class="text-cyan-300 flex items-center gap-1">
                                                <i class="fa-solid fa-gem text-[10px]"></i> +${m.jade} Tiên Ngọc
                                            </span>
                                        ` : ''}
                                    </div>
                                    ${m.items && m.items.length ? `
                                        <div class="pt-1 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                                            ${m.items.map(it => `
                                                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-gold-300 border border-amber-500/30 flex items-center gap-1">
                                                    <i class="fa-solid ${it.icon || 'fa-box'} text-[9px] text-amber-400"></i>
                                                    ${it.name} x${it.count}
                                                </span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Nút Lĩnh Thưởng -->
                                ${canClaim ? `
                                    <button type="button" onclick="claimDemonTowerMilestone(${m.floor})" class="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-serif font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 animate-pulse">
                                        <i class="fa-solid fa-hand-holding-dollar"></i> Lĩnh Thưởng
                                    </button>
                                ` : (isClaimed ? `
                                    <button type="button" disabled class="w-full py-2 rounded-xl bg-slate-900/60 text-slate-500 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                        <i class="fa-solid fa-check"></i> Đã Lĩnh Thưởng
                                    </button>
                                ` : `
                                    <button type="button" disabled class="w-full py-2 rounded-xl bg-slate-900/40 text-slate-600 border border-slate-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                        <i class="fa-solid fa-lock"></i> Cần Vượt Tầng ${m.floor} (Còn ${remaining} tầng)
                                    </button>
                                `)}
                            </article>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function claimDemonTowerMilestone(floor) {
    if (!Array.isArray(state.towerClaimedMilestones)) {
        state.towerClaimedMilestones = [];
    }
    const highestClearedFloor = Math.max(0, (state.towerFloor || 1) - 1);
    if (highestClearedFloor < floor) {
        if (typeof addLog === 'function') addLog(`⚠️ Chưa vượt qua Tầng ${floor}, không thể lĩnh thưởng!`, 'text-amber-300');
        return;
    }
    if (state.towerClaimedMilestones.includes(floor)) {
        if (typeof addLog === 'function') addLog(`⚠️ Đạo hữu đã lĩnh phần thưởng mốc Tầng ${floor} này rồi!`, 'text-slate-400');
        return;
    }

    const milestones = (typeof TOWER_MILESTONES !== 'undefined' && Array.isArray(TOWER_MILESTONES))
        ? TOWER_MILESTONES
        : [];
    const milestone = milestones.find(m => m.floor === floor);
    if (!milestone) return;

    state.stones = (state.stones || 0) + (milestone.stones || 0);
    state.immortalJade = (state.immortalJade || 0) + (milestone.jade || 0);
    if (typeof addExp === 'function' && milestone.exp) {
        addExp(milestone.exp);
    }

    if (Array.isArray(milestone.items)) {
        milestone.items.forEach(it => {
            let invItem = state.inventory.find(i => i.id === it.id);
            if (invItem) {
                invItem.count = (invItem.count || 0) + (it.count || 1);
            } else {
                state.inventory.push({
                    id: it.id,
                    name: it.name,
                    count: it.count || 1,
                    type: 'Vật Phẩm',
                    rarity: it.rarity || 3,
                    icon: it.icon || 'fa-box',
                    desc: `Chí bảo thượng cổ đoạt được từ mốc Tầng ${floor} Trấn Yêu Tháp.`
                });
            }
        });
    }

    state.towerClaimedMilestones.push(floor);

    if (typeof addLog === 'function') {
        addLog(`🎉 <span class="font-bold text-amber-300">[Trấn Yêu Tháp]</span> Lĩnh thưởng thành công Mốc Tầng ${floor}: <strong>+${(milestone.stones || 0).toLocaleString()} Linh Thạch</strong>, <strong>+${(milestone.exp || 0).toLocaleString()} Tu Vi</strong>, <strong>+${milestone.jade || 0} Tiên Ngọc</strong>!`, 'text-amber-300 font-bold');
    }

    if (typeof playSound === 'function') playSound('bell');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, `LĨNH THƯỞNG TẦNG ${floor}!`, 'text-amber-300 font-bold');
    }
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    renderDemonTowerModalContent('rewards');
}
window.claimDemonTowerMilestone = claimDemonTowerMilestone;

function sweepDemonTower() {
    const highestClearedFloor = Math.max(0, (state.towerFloor || 1) - 1);
    if (highestClearedFloor <= 0) {
        if (typeof addLog === 'function') addLog('⚠️ Chưa vượt qua tầng nào để càn quét! Hãy khiêu chiến Tầng 1 trước.', 'text-rose-400');
        return;
    }

    const timeScale = state.timeScale || 1;
    const sweepCooldownMs = (4 * 3600 * 1000) / timeScale;
    const sweepElapsed = Date.now() - (state.lastTowerSweepTime || 0);
    if (sweepElapsed < sweepCooldownMs) {
        const remainingSec = Math.max(0, Math.ceil((sweepCooldownMs - sweepElapsed) / 1000));
        const remHours = Math.floor(remainingSec / 3600);
        const remMins = Math.floor((remainingSec % 3600) / 60);
        if (typeof addLog === 'function') addLog(`⏳ Thần thức đang tụ khí càn quét, vui lòng chờ ${remHours} giờ ${remMins} phút nữa!`, 'text-amber-300');
        return;
    }

    const sweepRewardStones = Math.round(highestClearedFloor * 250);
    const sweepRewardExp = Math.round(highestClearedFloor * 800);

    state.stones = (state.stones || 0) + sweepRewardStones;
    if (typeof addExp === 'function') {
        addExp(sweepRewardExp);
    }
    state.lastTowerSweepTime = Date.now();

    // Bonus ngẫu nhiên khi càn quét
    let bonusText = '';
    if (Math.random() < 0.4) {
        const herbCount = Math.max(1, Math.floor(highestClearedFloor / 10) + 1);
        let herb = state.inventory.find(i => i.id === 'herb_spirit');
        if (herb) {
            herb.count = (herb.count || 0) + herbCount;
        } else {
            state.inventory.push({
                id: 'herb_spirit',
                name: 'Linh Chi Thảo',
                count: herbCount,
                type: 'Nguyên Liệu',
                rarity: 2,
                icon: 'fa-seedling',
                desc: 'Linh thảo chứa linh khí thuần khiết thu thập từ Trấn Yêu Tháp.'
            });
        }
        bonusText = `, nhặt được <strong>${herbCount} Linh Chi Thảo</strong>`;
    }

    if (typeof addLog === 'function') {
        addLog(`🌪️ <span class="font-bold text-rose-400">[Càn Quét]</span> Phóng thích Thần Thức càn quét ${highestClearedFloor} tầng tháp! Thu hoạch: <strong>+${sweepRewardStones.toLocaleString()} Linh Thạch</strong>, <strong>+${sweepRewardExp.toLocaleString()} Tu Vi</strong>${bonusText}!`, 'text-rose-300');
    }

    if (typeof playSound === 'function') {
        playSound('sword');
        setTimeout(() => playSound('bell'), 200);
    }

    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 40, `CÀN QUÉT THÀNH CÔNG!`, 'text-rose-400 font-bold');
    }

    if (typeof updateHUD === 'function') updateHUD();
    if (typeof saveGameState === 'function') saveGameState();

    renderDemonTowerModalContent('rewards');
}
window.sweepDemonTower = sweepDemonTower;

// ==========================================
// HỆ THỐNG HIỆU ỨNG ĐỘT PHÁ ĐẠI CẢNH GIỚI (MAJOR BREAKTHROUGH CELEBRATION)
// ==========================================

/**
 * Hiệu ứng số nhảy mượt mà (Number Counter / Rolling Text)
 */
function animateRollingNumber(element, startVal, endVal, duration = 1500) {
    if (!element) return;
    const start = Math.round(Number(startVal) || 0);
    const end = Math.round(Number(endVal) || 0);
    if (start === end) {
        element.textContent = end.toLocaleString();
        return;
    }
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    function update(now) {
        const currentTime = typeof now === 'number' ? now : ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Easing out cubic: 1 - Math.pow(1 - progress, 3)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(update);
            } else {
                element.textContent = end.toLocaleString();
            }
        } else {
            element.textContent = end.toLocaleString();
        }
    }

    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(update);
    } else {
        element.textContent = end.toLocaleString();
    }
}
window.animateRollingNumber = animateRollingNumber;

/**
 * Lôi quang êm dịu khi Đột Phá thành công (Bãi bỏ rung lắc)
 */
function triggerBreakthroughScreenShake(duration = 900) {
    if (typeof triggerSoftTribulation === 'function') {
        triggerSoftTribulation();
    }
}
window.triggerBreakthroughScreenShake = triggerBreakthroughScreenShake;

/**
 * Hoạt ảnh nhảy số (Count-up Animation bằng easeOutExpo trong 1100ms)
 * Dành cho màn hình Đột Phá Đại Cảnh Giới AAA
 */
function animateBreakthroughNumbers(oldHp, newHp, oldAtk, newAtk, oldDef, newDef, duration = 1100) {
    const hpEl = document.getElementById('bt-new-hp');
    const atkEl = document.getElementById('bt-new-atk');
    const defEl = document.getElementById('bt-new-def');

    const diffHpEl = document.getElementById('bt-diff-hp');
    const diffAtkEl = document.getElementById('bt-diff-atk');
    const diffDefEl = document.getElementById('bt-diff-def');

    const targetDiffHp = Math.max(0, newHp - oldHp);
    const targetDiffAtk = Math.max(0, newAtk - oldAtk);
    const targetDiffDef = Math.max(0, newDef - oldDef);

    const startTime = performance.now();

    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        const eased = easeOutExpo(progress);

        const currentHp = Math.round(oldHp + (newHp - oldHp) * eased);
        const currentAtk = Math.round(oldAtk + (newAtk - oldAtk) * eased);
        const currentDef = Math.round(oldDef + (newDef - oldDef) * eased);

        const curDiffHp = Math.round(targetDiffHp * eased);
        const curDiffAtk = Math.round(targetDiffAtk * eased);
        const curDiffDef = Math.round(targetDiffDef * eased);

        if (hpEl) hpEl.textContent = Number(currentHp).toLocaleString();
        if (atkEl) atkEl.textContent = Number(currentAtk).toLocaleString();
        if (defEl) defEl.textContent = Number(currentDef).toLocaleString();

        if (diffHpEl) diffHpEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(curDiffHp).toLocaleString()}`;
        if (diffAtkEl) diffAtkEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(curDiffAtk).toLocaleString()}`;
        if (diffDefEl) diffDefEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(curDiffDef).toLocaleString()}`;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            if (hpEl) hpEl.textContent = Number(newHp).toLocaleString();
            if (atkEl) atkEl.textContent = Number(newAtk).toLocaleString();
            if (defEl) defEl.textContent = Number(newDef).toLocaleString();
            if (diffHpEl) diffHpEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(targetDiffHp).toLocaleString()}`;
            if (diffAtkEl) diffAtkEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(targetDiffAtk).toLocaleString()}`;
            if (diffDefEl) diffDefEl.innerHTML = `<span class="diff-arrow">▲</span>+${Number(targetDiffDef).toLocaleString()}`;
        }
    }

    requestAnimationFrame(step);
}
window.animateBreakthroughNumbers = animateBreakthroughNumbers;

/**
 * Hiển thị Modal Đột Phá Đại Cảnh Giới Hoành Tráng (Golden/Purple Aura, Screen Shake, Rolling Numbers)
 * Hàm chuẩn theo yêu cầu: showBreakthroughModal(oldRealm, newRealm, oldStats, newStats)
 */
function showBreakthroughModal(oldRealm, newRealm, oldStats, newStats) {
    const modal = document.getElementById('major-breakthrough-modal');
    if (!modal) return;

    // 1. Rung màn hình uy lực (Screen Shake)
    triggerBreakthroughScreenShake(900);

    // 2. Âm thanh hào hùng
    if (typeof playSound === 'function') {
        playSound('thunder');
        setTimeout(() => playSound('bell'), 200);
    }

    // 3. Hiển thị Cảnh Giới: [Cảnh Giới Cũ] ➔ [Cảnh Giới Mới]
    const oldName = typeof oldRealm === 'string' ? oldRealm : (oldRealm?.name || 'Luyện Khí Kỳ Viên Mãn');
    const newName = typeof newRealm === 'string' ? newRealm : (newRealm?.name || 'Trúc Cơ Kỳ Sơ Kỳ');

    const oldRealmEl = document.getElementById('breakthrough-old-realm-text');
    if (oldRealmEl) oldRealmEl.textContent = oldName;

    const newRealmEl = document.getElementById('breakthrough-new-realm-text');
    if (newRealmEl) newRealmEl.textContent = newName;

    // 4. Giữ nguyên chất liệu Vàng Ròng Chạm Nổi 3D Imperial Gold
    const titleEl = document.getElementById('breakthrough-modal-title');
    if (titleEl) {
        titleEl.className = "cinematic-title-gold";
    }

    // 5. Flavor Text (có text-wrap: balance chống rớt chữ)
    const descEl = document.getElementById('breakthrough-modal-desc');
    if (descEl) {
        const majorName = typeof newRealm === 'object' ? (newRealm?.majorRealm || (typeof getMajorRealmName === 'function' ? getMajorRealmName(newRealm) : '')) : '';
        const realmId = typeof newRealm === 'object' ? newRealm?.id : null;
        const config = typeof tribulationConfig !== 'undefined' ? (tribulationConfig[realmId] || tribulationConfig[majorName]) : null;
        descEl.textContent = config?.flavorText || `Thiên kiếp tan biến, kim quang hộ thể, ngưng kết đạo cơ, chính thức tiến nhập ${newName}!`;
    }

    // 6. Tính toán chỉ số Cũ và Mới
    const oldHp = oldStats?.maxHp || oldStats?.hp || 1845;
    const newHp = newStats?.maxHp || newStats?.hp || 7500;

    const oldAtk = oldStats?.atk || 385;
    const newAtk = newStats?.atk || 1400;

    const oldDef = oldStats?.def || 54;
    const newDef = newStats?.def || 320;

    // 7. Gán chỉ số cũ (Static text)
    const oldHpEl = document.getElementById('bt-old-hp');
    if (oldHpEl) oldHpEl.textContent = Number(oldHp).toLocaleString();

    const oldAtkEl = document.getElementById('bt-old-atk');
    if (oldAtkEl) oldAtkEl.textContent = Number(oldAtk).toLocaleString();

    const oldDefEl = document.getElementById('bt-old-def');
    if (oldDefEl) oldDefEl.textContent = Number(oldDef).toLocaleString();

    // 8. Kích hoạt hiệu ứng Nhảy Số (Count-up Animation easeOutExpo 1100ms)
    animateBreakthroughNumbers(oldHp, newHp, oldAtk, newAtk, oldDef, newDef, 1100);

    // 9. Reset animation reflow cho chuỗi hoạt ảnh điện ảnh
    const content = modal.querySelector('.cinematic-content');
    if (content) {
        content.classList.remove('cinematic-content-success');
        void content.offsetWidth;
        content.classList.add('cinematic-content-success');
    }

    // 10. Mở Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
}
window.showBreakthroughModal = showBreakthroughModal;

function showMajorBreakthroughSuccessModal(prevStats, newStats, newRealm) {
    const prevRealmName = (typeof REALMS !== 'undefined' && typeof state !== 'undefined' && REALMS[state.realmIndex - 1])
        ? REALMS[state.realmIndex - 1].name
        : 'Luyện Khí Kỳ Viên Mãn';
    showBreakthroughModal(prevRealmName, newRealm, prevStats, newStats);
}
window.showMajorBreakthroughSuccessModal = showMajorBreakthroughSuccessModal;

/**
 * Đóng Modal Đột Phá Đại Cảnh Giới
 */
function closeMajorBreakthroughModal() {
    const modal = document.getElementById('major-breakthrough-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeMajorBreakthroughModal = closeMajorBreakthroughModal;

/**
 * Helper kiểm thử nhanh UI Đột Phá Đại Cảnh Giới
 */
function testBreakthroughModal() {
    const prevStats = {
        hp: 1845,
        maxHp: 1845,
        atk: 385,
        def: 54
    };
    const newStats = {
        hp: 7500,
        maxHp: 7500,
        atk: 1400,
        def: 320
    };
    showBreakthroughModal("Luyện Khí Kỳ Viên Mãn", "Trúc Cơ Kỳ Sơ Kỳ", prevStats, newStats);
}
window.testBreakthroughModal = testBreakthroughModal;

/**
 * ============================================================
 * HỆ THỐNG HIỆU ỨNG ĐỘT PHÁ THẤT BẠI (BREAKTHROUGH FAILURE EFFECTS)
 * ============================================================
 */

/**
 * Lôi quang êm dịu khi Đột Phá Thất Bại (Bãi bỏ rung lắc)
 */
function triggerFailureScreenShake(duration = 900) {
    if (typeof triggerSoftTribulation === 'function') {
        triggerSoftTribulation();
    }
}
window.triggerFailureScreenShake = triggerFailureScreenShake;

/**
 * Hiển thị Modal Đột Phá Thất Bại (Khí huyết nghịch chuyển, Chớp đỏ, Rung lắc, Tổn thất)
 */
function showBreakthroughFailureModal(currentRealm, targetRealm, lostExp = 0, reason = '') {
    const modal = document.getElementById('breakthrough-failure-modal');
    if (!modal) return;

    // 1. Rung lắc màn hình dữ dội
    triggerFailureScreenShake(900);

    // 2. Chớp đỏ huyết sát toàn màn hình
    if (typeof triggerBloodHurtFlash === 'function') {
        triggerBloodHurtFlash();
    }

    // 3. Âm thanh lôi đình & nguy cấp
    if (typeof playSound === 'function') {
        playSound('thunder');
        setTimeout(() => playSound('danger'), 200);
    }

    // 4. Hiển thị cảnh giới: [Cũ] ✖ [Mục Tiêu Thất Bại]
    const curName = typeof currentRealm === 'string' ? currentRealm : (currentRealm?.name || 'Luyện Khí Kỳ Viên Mãn');
    const targetName = typeof targetRealm === 'string' ? targetRealm : (targetRealm?.name || 'Trúc Cơ Kỳ Sơ Kỳ');

    const curEl = document.getElementById('bt-fail-realm-current');
    if (curEl) curEl.textContent = curName;

    const targetEl = document.getElementById('bt-fail-realm-target');
    if (targetEl) targetEl.textContent = targetName;

    // 5. Tổn thất Tu Vi
    const expLostEl = document.getElementById('bt-fail-exp-lost');
    if (expLostEl) {
        if (lostExp > 0) {
            expLostEl.textContent = `-25% Tu Vi (-${Number(lostExp).toLocaleString()})`;
        } else {
            expLostEl.textContent = '-25% Tu Vi Tích Lũy';
        }
    }

    // 6. Trạng thái HP
    const hpStatusEl = document.getElementById('bt-fail-hp-status');
    if (hpStatusEl) {
        const curHp = (typeof state !== 'undefined' && state.hp) ? state.hp : 1;
        hpStatusEl.textContent = `Trọng Thương (Khí Huyết còn ${curHp.toLocaleString()})`;
    }

    // 7. Flavor description
    const descEl = document.getElementById('bt-fail-flavor-desc');
    if (descEl) {
        descEl.textContent = reason || 'Kinh mạch bế tắc, chân nguyên hỗn loạn! Thần hồn chấn động dữ dội trước uy áp lôi kiếp!';
    }

    // 8. Kích hoạt hiệu ứng chấn động và trượt thẻ lệch pha
    const card = modal.querySelector('.failure-board-card');
    if (card) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
    }

    const title = document.getElementById('bt-fail-title');
    if (title) {
        title.style.animation = 'none';
        void title.offsetWidth;
        title.style.animation = '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof triggerBreakthroughBurst === 'function') {
        triggerBreakthroughBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
}
window.showBreakthroughFailureModal = showBreakthroughFailureModal;

function closeBreakthroughFailureModal() {
    const modal = document.getElementById('breakthrough-failure-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeBreakthroughFailureModal = closeBreakthroughFailureModal;

function testBreakthroughFailureModal() {
    const cur = "Luyện Khí Kỳ Viên Mãn";
    const target = "Trúc Cơ Kỳ Sơ Kỳ";
    showBreakthroughFailureModal(cur, target, 12500, "Đạo tâm chưa vững trước Tam Đạo Lôi Kiếp, kinh mạch bị chấn nứt!");
}
window.testBreakthroughFailureModal = testBreakthroughFailureModal;
window.testBreakthroughFailure = testBreakthroughFailureModal;

if (typeof globalThis !== 'undefined') {
    globalThis.animateRollingNumber = animateRollingNumber;
    globalThis.triggerBreakthroughScreenShake = triggerBreakthroughScreenShake;
    globalThis.triggerFailureScreenShake = triggerFailureScreenShake;
    globalThis.showBreakthroughModal = showBreakthroughModal;
    globalThis.showMajorBreakthroughSuccessModal = showMajorBreakthroughSuccessModal;
    globalThis.closeMajorBreakthroughModal = closeMajorBreakthroughModal;
    globalThis.showBreakthroughFailureModal = showBreakthroughFailureModal;
    globalThis.closeBreakthroughFailureModal = closeBreakthroughFailureModal;
    globalThis.testBreakthroughModal = testBreakthroughModal;
    globalThis.testBreakthroughFailureModal = testBreakthroughFailureModal;
    globalThis.testBreakthroughFailure = testBreakthroughFailureModal;
}



// ==========================================
// TỤ LINH TRẬN NGŨ HÀNH & THÚ SỦNG HỘ PHÁP
// ==========================================
function getLingCanStage(level) {
    const value = Math.max(0, Math.floor(Number(level) || 0));
    return [...LINH_CAN_STAGES].reverse().find(stage => value >= stage.min) || { min: 0, name: 'Chưa Mở Khóa', color: '#64748b' };
}
window.getLingCanStage = getLingCanStage;

function getPillarUpgradeCost(level, branchKey = 'metal') {
    const current = Math.max(0, Math.floor(Number(level) || 0));
    if (current >= LINH_CAN_RULES.maxLevel) return null;
    const base = Math.floor(100 * Math.pow(1.18, current));
    const rareMultiplier = RARE_LINH_CAN_BRANCHES[branchKey] ? LINH_CAN_RULES.rareCostMultiplier : 1;
    const stageMultiplier = (current + 1) % LINH_CAN_RULES.stageStep === 0 ? LINH_CAN_RULES.stageCostMultiplier : 1;
    return Math.ceil(base * rareMultiplier * stageMultiplier);
}

function getLinhCanBranchKey(id) {
    if (ELEMENTAL_PILLARS[id] || RARE_LINH_CAN_BRANCHES[id]) return id;
    return Object.keys(LEGACY_PILLAR_KEYS).find(key => LEGACY_PILLAR_KEYS[key] === id)
        || Object.keys(RARE_LINH_CAN_BRANCHES).find(key => RARE_LINH_CAN_BRANCHES[key].id === id);
}

function buildLinhCanResponse(target = state, extra = {}) {
    const root = target.spiritualRoot;
    const mainLevels = Object.keys(ELEMENTAL_PILLARS).map(key => root.pillars[key]);
    const resonanceLevel = Math.floor(Math.min(...mainLevels) / ELEMENTAL_RESONANCE.step);
    const resonanceBonus = Number((resonanceLevel * ELEMENTAL_RESONANCE.bonusPerStep).toFixed(4));
    const activeMutation = root.mutations?.[target.activeElement] && LINH_CAN_MUTATIONS[target.activeElement];
    const activeRare = RARE_LINH_CAN_BRANCHES[target.activeElement];
    const branches = Object.entries({ ...ELEMENTAL_PILLARS, ...RARE_LINH_CAN_BRANCHES }).map(([key, config]) => {
        const rare = Boolean(RARE_LINH_CAN_BRANCHES[key]);
        const rareState = root.rareBranches?.[key];
        const level = rare ? (rareState?.level || 0) : root.pillars[key];
        const mutated = Boolean(root.mutations?.[key]);
        return {
            id: rare ? config.id : config.legacyId,
            name: `${config.element} Linh Căn`,
            type: rare ? 'tam_di' : 'ngu_hanh',
            level,
            stage: getLingCanStage(level).name,
            is_mutated: mutated,
            ...(mutated ? { mutated_name: LINH_CAN_MUTATIONS[key].name } : {}),
            ...(mutated ? { effects: LINH_CAN_MUTATIONS[key].effects } : {}),
            is_unlocked: rare ? Boolean(rareState?.isUnlocked) : true
        };
    });
    const realm = REALMS[target.realmIndex] || REALMS[0];
    const arrayLevel = Math.max(1, Number(target.arrayLevel) || 1);
    return {
        status: extra.status || 'success',
        ...(extra.error_code ? { error_code: extra.error_code } : {}),
        canco_state: {
            active_title: activeMutation?.name || (activeRare ? activeRare.name : evaluateLinhCanTitle(mainLevels).name),
            total_multiplier: Number((1 + resonanceBonus).toFixed(4)),
            resonances: { ngu_hanh_level: resonanceLevel, bonus_stats: `+${Math.round(resonanceBonus * 100)}% Toàn Thuộc Tính` },
            branches
        },
        resources: {
            linh_khi_current: target.linhKhi,
            linh_khi_max: realm.maxExp * (1 + (arrayLevel - 1) * M1_SYSTEM_RULES.spiritGenerationArrayBonusPerLevel)
        },
        inventory_deduction: extra.inventory_deduction || [],
        action_log: extra.action_log || []
    };
}

function applyLinhCanAction(target, action, id) {
    const key = getLinhCanBranchKey(id);
    if (!key) return { error_code: 'INVALID_BRANCH' };
    const rare = Boolean(RARE_LINH_CAN_BRANCHES[key]);
    const rareState = target.spiritualRoot.rareBranches[key];
    const unlocked = !rare || rareState.isUnlocked;
    const itemById = itemId => target.inventory.find(item => item.id === itemId);
    const consume = itemId => {
        const item = itemById(itemId);
        if (!item || item.count < 1) return false;
        item.count--;
        return true;
    };
    if (action === 'unlock_branch') {
        if (!rare) return { error_code: 'ALREADY_UNLOCKED' };
        if (unlocked) return { error_code: 'ALREADY_UNLOCKED' };
        if (!consume(LINH_CAN_RULES.rareUnlockItem)) return { error_code: 'MISSING_DI_NGUYEN_THACH' };
        rareState.isUnlocked = true;
        rareState.level = 1;
        return { inventory_deduction: [{ item_id: LINH_CAN_RULES.rareUnlockItem, amount: 1 }], action_log: [`[Căn Cơ] Dị Nguyên Thạch thức tỉnh ${RARE_LINH_CAN_BRANCHES[key].element} Linh Căn.`] };
    }
    if (!unlocked) return { error_code: 'BRANCH_LOCKED' };
    const level = rare ? rareState.level : target.spiritualRoot.pillars[key];
    if (action === 'upgrade_branch') {
        if (level >= LINH_CAN_RULES.maxLevel) return { error_code: 'MAX_LEVEL' };
        if (level >= 50 && !target.spiritualRoot.mutations[key]) return { error_code: 'AWAKENING_REQUIRED' };
        const cost = getPillarUpgradeCost(level, key);
        if (target.linhKhi < cost) return { error_code: 'INSUFFICIENT_LINH_KHI' };
        target.linhKhi -= cost;
        if (rare) rareState.level++;
        else {
            target.spiritualRoot.pillars[key]++;
            target.fiveElements[LEGACY_PILLAR_KEYS[key]] = target.spiritualRoot.pillars[key];
        }
        target.activeElement = key;
        const nextLevel = level + 1;
        return { inventory_deduction: [{ item_id: 'linh_khi', amount: cost }], action_log: [`[Căn Cơ] Rót ${cost} Linh Khí, ${rare ? RARE_LINH_CAN_BRANCHES[key].element : ELEMENTAL_PILLARS[key].element} Linh Căn đạt Lv.${nextLevel}.${nextLevel === 50 ? ' Thức Tỉnh Bản Nguyên: cần vật phẩm tiến hóa.' : ''}`] };
    }
    if (action === 'mutate_branch') {
        if (level < 50) return { error_code: 'LEVEL_50_REQUIRED' };
        if (target.spiritualRoot.mutations[key]) return { error_code: 'ALREADY_MUTATED' };
        const mutation = LINH_CAN_MUTATIONS[key];
        let consumedItemId = null;
        if (consume(mutation.itemId)) {
            consumedItemId = mutation.itemId;
        } else if (key === 'thunder' && consume('thien_dao_loi_kiep')) {
            consumedItemId = 'thien_dao_loi_kiep';
        }
        if (!consumedItemId) return { error_code: 'MISSING_MUTATION_ITEM', required_item: mutation.itemId };
        target.spiritualRoot.mutations[key] = true;
        target.activeElement = key;
        target.spiritRoot = mutation.name;
        if (target.spiritualRoot) target.spiritualRoot.tier = 'mutant';

        const titleMap = {
            metal: 'vo_thuong_kiem_can',
            wood: 'thai_at_truong_sinh_can',
            water: 'huyen_minh_thuy_can',
            fire: 'hon_don_viem_can',
            earth: 'bat_hu_thanh_the_can',
            ice: 'tuyet_lanh_bang_tam',
            wind: 'hu_khong_phong_can',
            thunder: 'thien_loi_linh_can'
        };
        const titleId = titleMap[key] || 'thien_loi_linh_can';
        if (target.daoFoundationTitles) {
            if (!target.daoFoundationTitles.unlockedTitles.includes(titleId)) {
                target.daoFoundationTitles.unlockedTitles.push(titleId);
            }
            target.daoFoundationTitles.activeTitle = titleId;
        }

        return {
            inventory_deduction: [{ item_id: consumedItemId, amount: 1 }],
            action_log: [`[Thức Tỉnh Dị Linh Căn] Đột biến ${mutation.name} thành công! Nhận danh hiệu "${mutation.name}", tốc độ Tu Vi tăng vọt x3!`]
        };
    }
    return { error_code: 'INVALID_ACTION' };
}

function processLinhCanRequest(request = {}) {
    const target = structuredClone(request.player_state || state);
    if (request.inventory) {
        target.inventory = Array.isArray(request.inventory)
            ? request.inventory.map(item => ({ ...item, id: item.id || item.item_id || item.item, count: Number(item.count ?? item.qty ?? item.amount ?? 0) }))
            : Object.entries(request.inventory).map(([id, count]) => ({ id, count: Number(count) || 0 }));
    }
    normalizeSpiritualRootState(target);
    normalizeCharacterSystems(target);
    for (const branch of request.can_co_state?.branches || []) {
        const key = getLinhCanBranchKey(branch.id);
        if (!key) continue;
        if (RARE_LINH_CAN_BRANCHES[key]) target.spiritualRoot.rareBranches[key] = { level: Math.max(0, Number(branch.level) || 0), isUnlocked: Boolean(branch.is_unlocked) };
        else target.spiritualRoot.pillars[key] = Math.max(1, Number(branch.level) || 1);
        target.spiritualRoot.mutations[key] = Boolean(branch.is_mutated);
    }
    if (request.player_state?.linh_khi_current !== undefined) target.linhKhi = Math.max(0, Number(request.player_state.linh_khi_current) || 0);
    const result = applyLinhCanAction(target, request.Action || request.action, request.branch_id || request.element);
    return JSON.stringify(buildLinhCanResponse(target, result.error_code ? { status: 'error', error_code: result.error_code } : result));
}
window.processLinhCanRequest = processLinhCanRequest;

function evolveSpiritualRoot() {
    return mutateLinhCanBranch(state.activeElement);
}

function playCultivationAnimation(element_type) {
    const config = ELEMENTAL_PILLARS[element_type] || RARE_LINH_CAN_BRANCHES[element_type];
    if (!config) return;
    const panel = document.getElementById('foundation-panel');
    const visual = panel?.querySelector('.linh-can-visual');
    const pool = visual?.querySelector('.qi-pool__orb');
    const node = visual?.querySelector(`.meridian-node[data-element="${element_type}"]`);
    const finish = () => {
        if (!panel?.contains(visual)) return;
        renderSpiritualRootPanel('foundation-panel');
        const upgradedNode = panel.querySelector(`.meridian-node[data-element="${element_type}"]`);
        upgradedNode?.classList.add('is-energized');
        upgradedNode?.addEventListener('animationend', () => upgradedNode.classList.remove('is-energized'), { once: true });
    };
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
    if (!visual || !pool || !node || !visual.getBoundingClientRect().width
        || reducedMotion || !canAnimate) {
        if (panel?.contains(visual)) renderSpiritualRootPanel('foundation-panel');
        return;
    }
    const area = visual.getBoundingClientRect();
    const origin = pool.getBoundingClientRect();
    const destination = node.getBoundingClientRect();
    const x = origin.left + origin.width / 2 - area.left;
    const y = origin.top + origin.height / 2 - area.top;
    const dx = destination.left + destination.width / 2 - area.left - x;
    const dy = destination.top + destination.height / 2 - area.top - y;
    const particle = document.createElement('div');
    particle.className = 'cultivation-particle';
    particle.style.setProperty('--element-color', config.color);
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    visual.appendChild(particle);
    const bend = element_type === 'metal' || element_type === 'earth' || element_type === 'water' ? 0 : Math.sign(dx) * 8;
    const animation = particle.animate([
        { transform: 'translate(0, 0) scale(.75)', opacity: .65 },
        { transform: `translate(${dx * .55 + bend}px, ${dy * .52}px) scale(1.35)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 1 }
    ], { duration: 650, easing: 'ease-in-out' });
    animation.finished.then(() => {
        particle.remove();
        finish();
    }).catch(() => particle.remove());
}
window.playCultivationAnimation = playCultivationAnimation;

function upgradeElementPillar(elKey) {
    return applyLiveLinhCanAction('upgrade_branch', elKey);
}

function unlockRareLinhCanBranch(key) {
    return applyLiveLinhCanAction('unlock_branch', key);
}

function mutateLinhCanBranch(key) {
    return applyLiveLinhCanAction('mutate_branch', key);
}

function applyLiveLinhCanAction(action, key) {
    const result = applyLinhCanAction(state, action, key);
    if (result.error_code) {
        const required = result.required_item ? ` Cần ${LINH_CAN_MUTATIONS[key]?.itemName || result.required_item}.` : '';
        const message = result.error_code === 'INSUFFICIENT_LINH_KHI'
            ? `Không đủ Linh Khí để nâng ${ELEMENTAL_PILLARS[key]?.element || RARE_LINH_CAN_BRANCHES[key]?.element || 'Linh Căn'}. Hiện có ${formatCultivationNumber(state.linhKhi)} Linh Khí.`
            : `${result.error_code}.${required}`;
        addLog(`[Căn Cơ] ${message}`, 'text-rose-400');
        return JSON.stringify(buildLinhCanResponse(state, { status: 'error', error_code: result.error_code }));
    }
    updateLinhCanTitle();
    if (action === 'upgrade_branch') playCultivationAnimation(key);
    else renderSpiritualRootPanel('foundation-panel');
    if (typeof playElementUpgrade === 'function') playElementUpgrade();
    else playSound('bell');
    updateHUD();
    if (activeDrawer === 'cave') renderDrawerContent('cave');
    saveGameState();
    result.action_log.forEach(message => addLog(message, 'text-amber-300'));
    return JSON.stringify(buildLinhCanResponse(state, result));
}

function setActiveElement(elKey) {
    if (!ELEMENTAL_PILLARS[elKey] && !state.spiritualRoot.rareBranches[elKey]?.isUnlocked) return;
    state.activeElement = elKey;
    if (typeof playElementUpgrade === 'function') playElementUpgrade();
    updateHUD();
    if (document.getElementById('foundation-panel')?.querySelector('.linh-can-layout')) renderSpiritualRootPanel('foundation-panel');
    renderDrawerContent('cave');
    saveGameState();
    const branchName = ELEMENTAL_PILLARS[elKey]?.name || RARE_LINH_CAN_BRANCHES[elKey]?.name;
    addLog(`Đã kích hoạt chủ vị <span class="text-gold-300 font-bold">${branchName}</span>!`);
}

function cycleGuardianPet() {
    if (rejectLockedFeature('btn_linh_thu')) return;
    const petKeys = ['fox', 'dragon', 'crane'];
    let nextIdx = (petKeys.indexOf(state.activePet || 'fox') + 1) % petKeys.length;
    selectPet(petKeys[nextIdx]);
}

function selectPet(pk) {
    if (rejectLockedFeature('btn_linh_thu')) return;
    if (!GUARDIAN_PETS[pk]) return;
    state.activePet = pk;
    const pet = GUARDIAN_PETS[pk];

    playSound('qi');
    spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 30, `Linh Thú: ${pet.name}!`, "text-pink-300");
    addLog(`🐾 Triệu hoán Linh Thú Hộ Pháp: <span class="font-bold text-pink-300">${pet.name}</span> (${pet.buffDesc})!`);
    updateHUD();
    if (activeDrawer === 'cave') renderDrawerContent('cave');
    saveGameState();
}
function openCombatModal(dungeonIdx = selectedDungeonIndex) {
            if (rejectLockedFeature('btn_bi_canh')) return;
            if (typeof hideAllGamePages === 'function') {
                hideAllGamePages('center-modal-backdrop');
            }
            selectedDungeonIndex = dungeonIdx;
            if (combatTimer) {
                clearInterval(combatTimer);
                combatTimer = null;
            }

            const dungeon = DUNGEONS[selectedDungeonIndex];
            const backdrop = document.getElementById('center-modal-backdrop');
            const box = document.getElementById('center-modal-box');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                backdrop.classList.add('flex', 'active');
                backdrop.style.display = 'flex';
            }

            const effectiveStats = getEffectiveStats();
            box.innerHTML = `
                <div class="p-5 space-y-4">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                            <span class="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Bí Cảnh Lịch Luyện Trảm Yêu</span>
                            <h3 class="font-serif text-base font-bold text-slate-100">${dungeon.name}</h3>
                        </div>
                        <button onclick="closeCenterModal()" class="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Chọn tầng Bí Cảnh -->
                    <div class="grid grid-cols-3 gap-2">
                        ${DUNGEONS.map((d, idx) => `
                            <button onclick="openCombatModal(${idx})" class="py-1.5 px-2 rounded-lg text-[11px] font-medium border transition ${selectedDungeonIndex === idx ? 'border-gold-400 bg-gold-500/15 text-gold-300' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'}">
                                Ải ${idx + 1}: ${d.name.split(' ')[0]}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Sân đấu 2 bên có thanh máu -->
                    <div class="grid grid-cols-2 gap-4 py-3 text-center bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                        <div class="space-y-1.5">
                            <div id="combat-player-avatar" class="w-12 h-12 mx-auto rounded-full bg-jade-500/20 border border-jade-400 flex items-center justify-center text-jade-300 overflow-hidden shadow-md transition-all">
                                <img src="./assets/images/image_11.png" alt="Bản Thể" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">
                            </div>
                            <div class="text-xs font-bold text-jade-300">${state.player?.name || 'Tiêu Dao Tử'}</div>
                            <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                <div id="combat-player-hp-bar" class="h-full bg-emerald-400 transition-all" style="width: 100%"></div>
                            </div>
                            <div id="combat-player-hp-text" class="text-[10px] font-mono text-slate-400">${state.hp}/${effectiveStats.maxHp} HP</div>
                        </div>

                        <div class="space-y-1.5">
                            <div id="combat-boss-avatar" class="w-12 h-12 mx-auto rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 overflow-hidden shadow-md transition-all">
                                <img src="${dungeon.image || './assets/images/boss_ancient_demon.jpg'}" alt="${dungeon.boss}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">
                            </div>
                            <div class="text-xs font-bold text-rose-400">${dungeon.boss}</div>
                            <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                <div id="combat-boss-hp-bar" class="h-full bg-rose-500 transition-all" style="width: 100%"></div>
                            </div>
                            <div id="combat-boss-hp-text" class="text-[10px] font-mono text-slate-400">${dungeon.hp}/${dungeon.hp} HP</div>
                        </div>
                    </div>

                    <div id="combat-result-box" class="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 h-20 overflow-y-auto space-y-1">
                        <div>Chiến lợi phẩm: <span class="text-gold-300">+${dungeon.stoneReward} Linh Thạch</span>, <span class="text-jade-300">+${dungeon.expReward} Tu Vi</span> & cơ hội rơi <span class="text-emerald-400">${dungeon.dropName}</span>.</div>
                    </div>

                    <div class="flex gap-3">
                        <button id="btn-start-combat" onclick="startLiveCombat()" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg transition">
                            <i class="fa-solid fa-khanda mr-1.5"></i>Xuất Phi Kiếm Giao Chiến
                        </button>
                    </div>
                </div>
            `;
        }
function startLiveCombat() {
            if (rejectLockedFeature('btn_bi_canh')) return;
            if (combatTimer) return;
            const dungeon = DUNGEONS[selectedDungeonIndex];
            let bossCurrentHp = dungeon.hp;
            let playerCurrentHp = state.hp;
            let combatTurn = 0;
            let bossEnraged = false;

            const btn = document.getElementById('btn-start-combat');
            const logEl = document.getElementById('combat-result-box');
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Đang Giao Chiến Ác Liệt...";
                btn.classList.add('opacity-60');
            }
            if (logEl) logEl.innerHTML = '';

            if (combatTimer) {
                clearInterval(combatTimer);
                combatTimer = null;
            }

            combatTimer = setInterval(() => {
                combatTurn++;
                playSound('sword');
                // Đạo nhân xuất kiếm
                const effectiveStats = getEffectiveStats();
                let dmgToBoss = Math.max(8, Math.round(effectiveStats.atk * effectiveStats.physicalDamageMultiplier * (0.9 + Math.random() * 0.3)));
                if (effectiveStats.burnEnemyMaxHpPercent) dmgToBoss += Math.ceil(dungeon.hp * effectiveStats.burnEnemyMaxHpPercent);
                if (effectiveStats.executeBelowHpPercent && bossCurrentHp - dmgToBoss > 0 && bossCurrentHp - dmgToBoss <= dungeon.hp * effectiveStats.executeBelowHpPercent) dmgToBoss = bossCurrentHp;
                bossCurrentHp = Math.max(0, bossCurrentHp - dmgToBoss);

                const pAvatar = document.getElementById('combat-player-avatar');
                const bAvatar = document.getElementById('combat-boss-avatar');
                pAvatar?.classList.add('combat-lunge-player');
                setTimeout(() => pAvatar?.classList.remove('combat-lunge-player'), 260);
                bAvatar?.classList.add('combat-hurt-flash');
                setTimeout(() => bAvatar?.classList.remove('combat-hurt-flash'), 260);
                if (window.soundSystem?.play) window.soundSystem.play('whoosh');

                const bossBar = document.getElementById('combat-boss-hp-bar');
                const bossTxt = document.getElementById('combat-boss-hp-text');
                const combatModal = document.getElementById('center-modal-backdrop');
                if (bossBar) bossBar.style.width = `${(bossCurrentHp / dungeon.hp) * 100}%`;
                if (bossTxt) bossTxt.textContent = `${bossCurrentHp}/${dungeon.hp} HP`;

                if (typeof spawnDamageText === 'function' && bossBar && combatModal) {
                    const bRect = bossBar.getBoundingClientRect();
                    const mRect = combatModal.getBoundingClientRect();
                    spawnDamageText(bRect.left + bRect.width / 2 - mRect.left, bRect.top - mRect.top - 12, `-${dmgToBoss}`, '#34d399');
                }

                if (logEl) {
                    logEl.innerHTML += `<div>🗡️ Bạn ngự kiếm chém <span class="text-rose-400">${dungeon.boss}</span> gây <span class="text-jade-300 font-bold">-${dmgToBoss} HP</span>!</div>`;
                    logEl.scrollTop = logEl.scrollHeight;
                }

                // 1. LINH THÚ HỘ MỆNH TRỢ CHIẾN (Mỗi 3 hiệp thi triển thần thông, cấp Tier 3+ mỗi 2 hiệp)
                const petInterval = (Number(state.petTier) >= 3) ? 2 : 3;
                if (combatTurn % petInterval === 0 && bossCurrentHp > 0) {
                    const petLvl = Number(state.petLevel) || 1;
                    const petTier = Number(state.petTier) || 1;
                    const tierDmgMult = petTier >= 4 ? 2.3 : (petTier === 3 ? 1.7 : (petTier === 2 ? 1.3 : 1.0));
                    const petBonusDmg = Math.round((petLvl * 80 + effectiveStats.atk * 0.45) * tierDmgMult);
                    bossCurrentHp = Math.max(0, bossCurrentHp - petBonusDmg);
                    if (bossBar) bossBar.style.width = `${(bossCurrentHp / dungeon.hp) * 100}%`;
                    if (bossTxt) bossTxt.textContent = `${bossCurrentHp}/${dungeon.hp} HP`;
                    if (logEl) {
                        logEl.innerHTML += `<div>🐾 <b class="text-amber-400">Linh Thú Hộ Tộc</b> [Huyết Mạch Cấp ${petTier}] xuất kích, giáng <span class="text-amber-300 font-bold">-${petBonusDmg.toLocaleString('vi-VN')} HP</span> lên yêu quái!</div>`;
                        logEl.scrollTop = logEl.scrollHeight;
                    }
                }

                // 2. ĐẠO LỮ ĐỒNG TÂM HỘ THỂ (Mỗi 4 hiệp hồi máu bảo mệnh)
                if (combatTurn % 4 === 0 && Array.isArray(state.companions)) {
                    const bonded = state.companions.find(c => (c.affinity || 0) >= 20);
                    if (bonded) {
                        const healAmt = Math.round(effectiveStats.maxHp * 0.10);
                        playerCurrentHp = Math.min(effectiveStats.maxHp, playerCurrentHp + healAmt);
                        if (logEl) {
                            logEl.innerHTML += `<div>💞 Đạo Lữ <b class="text-pink-400">${bonded.name}</b> thi triển Linh Tâm Quyết, hồi phục <span class="text-emerald-300 font-bold">+${healAmt} HP</span>!</div>`;
                            logEl.scrollTop = logEl.scrollHeight;
                        }
                    }
                }

                // 3. BOSS CUỒNG BẠO HÓA KHI HP DƯỚI 30%
                if (!bossEnraged && bossCurrentHp > 0 && bossCurrentHp <= dungeon.hp * 0.3) {
                    bossEnraged = true;
                    if (bossBar) {
                        bossBar.classList.add('animate-pulse');
                        bossBar.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
                    }
                    if (logEl) {
                        logEl.innerHTML += `<div class="text-rose-400 font-bold">⚠️ ${dungeon.boss} huyết mạch bùng nổ, tiến vào trạng thái CUỒNG BẠO! Sát thương tăng vọt!</div>`;
                        logEl.scrollTop = logEl.scrollHeight;
                    }
                }

                if (bossCurrentHp <= 0) {
                    clearInterval(combatTimer);
                    combatTimer = null;
                    if (window.soundSystem?.play) window.soundSystem.play('victory');
                    if (typeof window.triggerCameraTrauma === 'function') window.triggerCameraTrauma(0.4, 'center-modal-backdrop');
                    state.stones += dungeon.stoneReward;
                    addExp(dungeon.expReward);

                    if (dungeon.dropId) {
                        addItemToInventory(dungeon.dropId, 1);
                    }

                    // Lưu tiến độ Bí Cảnh & Thưởng Thủ Sát
                    if (!state.dungeonsCleared) state.dungeonsCleared = {};
                    const isFirstClear = !state.dungeonsCleared[dungeon.id];
                    if (isFirstClear) {
                        state.dungeonsCleared[dungeon.id] = { count: 1, firstCleared: true, bestTime: Date.now() };
                        if (dungeon.firstClearJade) {
                            state.immortalJade = (state.immortalJade || 0) + dungeon.firstClearJade;
                            if (logEl) {
                                logEl.innerHTML += `<div class="text-amber-300 font-bold">💎 Thủ Sát Thành Công! Nhận thưởng Thủ Thắng +${dungeon.firstClearJade} Tiên Ngọc!</div>`;
                            }
                            addLog(`💎 Thủ Sát Bí Cảnh <span class="text-rose-400">${dungeon.name}</span>! Nhận <span class="text-amber-300">+${dungeon.firstClearJade} Tiên Ngọc</span>!`, 'text-amber-300 font-bold');
                        }
                    } else {
                        state.dungeonsCleared[dungeon.id].count = (state.dungeonsCleared[dungeon.id].count || 0) + 1;
                    }

                    if (logEl) {
                        logEl.innerHTML += `<div class="text-emerald-400 font-bold pt-1">🏆 Trảm yêu đại thắng! Thu hoạch +${dungeon.stoneReward} Linh Thạch, +${dungeon.expReward} Tu Vi & 1 ${dungeon.dropName}! Mở khóa Càn Quét!</div>`;
                        logEl.scrollTop = logEl.scrollHeight;
                    }
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fa-solid fa-rotate-right mr-1.5"></i>Khiêu Chiến Lại`;
                        btn.classList.remove('opacity-60');
                    }
                    addLog(`Chiến thắng Bí Cảnh <span class="text-rose-400">${dungeon.name}</span>, nhận <span class="text-gold-300">+${dungeon.stoneReward} Linh Thạch</span> và <span class="text-emerald-400">1 ${dungeon.dropName}</span>.`);
                    saveGameState();
                    updateHUD();
                    if (typeof refreshDungeonUI === 'function') refreshDungeonUI();
                    return;
                }

                // Yêu thú phản đòn
                const earthReduction = Math.min(0.35, getPillarLevel('earth') * 0.005 * getPillarEfficiency('earth'));
                const dodged = effectiveStats.absoluteDodgeChance > 0 && Math.random() < effectiveStats.absoluteDodgeChance;
                let rawBossAtk = dungeon.atk * (bossEnraged ? 1.35 : 1);
                if (Number(state.petTier) >= 4) rawBossAtk *= 0.90; // Thái Cổ Thánh Thú Uy Áp: Giảm 10% sát thương nhận vào
                const dmgToPlayer = dodged ? 0 : Math.max(2, Math.round((rawBossAtk - Math.floor(effectiveStats.def * 0.6)) * (1 - earthReduction)));
                playerCurrentHp = Math.max(0, playerCurrentHp - dmgToPlayer);

                bAvatar?.classList.add('combat-lunge-boss');
                setTimeout(() => bAvatar?.classList.remove('combat-lunge-boss'), 260);

                if (dodged) {
                    if (window.soundSystem?.play) window.soundSystem.play('whoosh');
                    if (logEl) logEl.innerHTML += '<div>💨 Hư Không Phong Căn né tránh tuyệt đối!</div>';
                    if (typeof spawnRipple === 'function' && combatModal) {
                        const pBar = document.getElementById('combat-player-hp-bar');
                        if (pBar) {
                            const pRect = pBar.getBoundingClientRect();
                            const mRect = combatModal.getBoundingClientRect();
                            spawnRipple(pRect.left + pRect.width / 2 - mRect.left, pRect.top + pRect.height / 2 - mRect.top, '#38bdf8');
                        }
                    }
                } else {
                    pAvatar?.classList.add('combat-hurt-flash');
                    setTimeout(() => pAvatar?.classList.remove('combat-hurt-flash'), 260);
                    if (window.soundSystem?.play) window.soundSystem.play('hit');
                }

                if (dmgToPlayer && effectiveStats.physicalReflect) {
                    const reflected = Math.round(dmgToPlayer * effectiveStats.physicalReflect);
                    bossCurrentHp = Math.max(0, bossCurrentHp - reflected);
                    if (bossBar) bossBar.style.width = `${(bossCurrentHp / dungeon.hp) * 100}%`;
                    if (bossTxt) bossTxt.textContent = `${bossCurrentHp}/${dungeon.hp} HP`;
                    if (logEl) logEl.innerHTML += `<div>🪨 Bất Hủ Thánh Thể Căn phản ${reflected} sát thương.</div>`;
                    if (typeof spawnDamageText === 'function' && bossBar && combatModal) {
                        const bRect = bossBar.getBoundingClientRect();
                        const mRect = combatModal.getBoundingClientRect();
                        spawnDamageText(bRect.left + bRect.width / 2 - mRect.left + (Math.random() - 0.5) * 20, bRect.top - mRect.top - 20, `-${reflected}`, '#eab308');
                    }
                }
                const playerBar = document.getElementById('combat-player-hp-bar');
                const playerTxt = document.getElementById('combat-player-hp-text');
                if (playerBar) playerBar.style.width = `${(playerCurrentHp / effectiveStats.maxHp) * 100}%`;
                if (playerTxt) playerTxt.textContent = `${playerCurrentHp}/${effectiveStats.maxHp} HP`;
                if (!dodged && dmgToPlayer > 0 && typeof spawnDamageText === 'function' && playerBar && combatModal) {
                    const pRect = playerBar.getBoundingClientRect();
                    const mRect = combatModal.getBoundingClientRect();
                    spawnDamageText(pRect.left + pRect.width / 2 - mRect.left, pRect.top - mRect.top - 12, `-${dmgToPlayer}`, '#f43f5e');
                }

                // Xử lý khi người chơi kiệt sức
                if (playerCurrentHp <= 0) {
                    clearInterval(combatTimer);
                    combatTimer = null;
                    if (window.soundSystem?.play) window.soundSystem.play('fail');
                    if (logEl) {
                        logEl.innerHTML += `<div class="text-rose-400 font-bold pt-1">💀 Đạo thể trọng thương, không địch lại yêu thú hung tàn! Dùng Thổ Độn Phù tạm lánh...</div>`;
                        logEl.scrollTop = logEl.scrollHeight;
                    }
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fa-solid fa-rotate-right mr-1.5"></i>Khiêu Chiến Lại`;
                        btn.classList.remove('opacity-60');
                    }
                    addLog(`Thất bại tại Bí Cảnh <span class="text-rose-400">${dungeon.name}</span>, đành rút về Động Phủ dưỡng thương.`, 'text-rose-400');
                    state.hp = Math.max(10, Math.round(effectiveStats.maxHp * 0.2));
                    updateHUD();
                    return;
                }
            }, 450);
        }

// ==========================================
// 4.14. HỆ THỐNG THÀNH TỰU THIÊN ĐẠO & DANH HIỆU
// ==========================================
let currentAchievementFilter = 'all';

function switchAchievementFilter(filter) {
    currentAchievementFilter = filter;
    const container = document.getElementById('hub-modal-content');
    if (container) renderAchievementHub(container);
}
window.switchAchievementFilter = switchAchievementFilter;

function getAchievementProgress(ach) {
    if (!ach) return { current: 0, target: 1, percent: 0, isCompleted: false };
    const s = state;
    let current = 0;
    let target = 1;

    switch (ach.id) {
        case "ach_realm_1":
            target = 3;
            current = (s.realmIndex > 0) ? 3 : Math.min(3, (s.realmStage || 0) + 1);
            break;
        case "ach_realm_2":
            target = 1;
            current = Math.min(1, s.realmIndex || 0);
            break;
        case "ach_realm_3":
            target = 2;
            current = Math.min(2, s.realmIndex || 0);
            break;
        case "ach_realm_4":
            target = 3;
            current = Math.min(3, s.realmIndex || 0);
            break;
        case "ach_realm_5":
            target = 4;
            current = Math.min(4, s.realmIndex || 0);
            break;
        case "ach_combat_first":
            target = 1;
            current = (s.dungeonsCleared && s.dungeonsCleared[1]) ? 1 : 0;
            break;
        case "ach_combat_ten":
            target = 10;
            current = Object.values(s.dungeonsCleared || {}).reduce((acc, curr) => acc + (curr?.count || 0), 0);
            break;
        case "ach_combat_dungeon_4":
            target = 1;
            current = (s.dungeonsCleared && s.dungeonsCleared[4]) ? 1 : 0;
            break;
        case "ach_arena_top":
            target = 50;
            current = Math.max(0, 100 - (s.arenaRank || 100));
            break;
        case "ach_wealth_1":
            target = 10000;
            current = Math.min(10000, s.stones || 0);
            break;
        case "ach_wealth_2":
            target = 100000;
            current = Math.min(100000, s.stones || 0);
            break;
        case "ach_auction_win":
            target = 1;
            current = (s.auctionData?.wonLots?.length || 0) >= 1 ? 1 : 0;
            break;
        case "ach_pet_grow":
            target = 5;
            current = Math.min(5, s.petLevel || 1);
            break;
        case "ach_companion_bond":
            target = 30;
            current = Math.min(30, Math.max(0, ...(s.companions || []).map(c => c.affinity || 0)));
            break;
        case "ach_talisman_master":
            target = 5;
            current = Math.min(5, s.talismanCraftedCount || 0);
            break;
        case "ach_avatar_expedition":
            target = 3;
            current = Math.min(3, s.avatarTripsCompleted || 0);
            break;
        default:
            target = 1;
            current = 0;
    }

    const percent = Math.min(1, Math.max(0, current / target));
    const isCompleted = current >= target;
    return { current, target, percent, isCompleted };
}
window.getAchievementProgress = getAchievementProgress;

function claimAchievement(achId) {
    const list = typeof ACHIEVEMENTS_CONFIG !== 'undefined' ? ACHIEVEMENTS_CONFIG : [];
    const ach = list.find(a => a.id === achId);
    if (!ach) return;

    if (!state.achievementsClaimed) state.achievementsClaimed = {};
    if (state.achievementsClaimed[achId]) {
        addLog(`Thành tựu [${ach.title}] đã được nhận thưởng trước đó.`, 'text-slate-400');
        return;
    }

    const prog = getAchievementProgress(ach);
    if (!prog.isCompleted) {
        addLog(`Thành tựu [${ach.title}] chưa hoàn thành điều kiện!`, 'text-rose-400');
        return;
    }

    state.achievementsClaimed[achId] = true;
    if (ach.reward?.stones) state.stones = (state.stones || 0) + ach.reward.stones;
    if (ach.reward?.jade) state.immortalJade = (state.immortalJade || 0) + ach.reward.jade;

    if (typeof playSound === 'function') playSound('victory');
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 60, `Thành Tựu: +${ach.reward?.jade || 0} Tiên Ngọc!`, 'text-amber-300');
    }
    addLog(`🏆 Lĩnh ngộ Thiên Đạo Thành Tựu <b class="text-amber-300">[${ach.title}]</b>! Nhận: <span class="text-amber-400">+${ach.reward?.jade || 0} Tiên Ngọc</span>, <span class="text-gold-300">+${(ach.reward?.stones || 0).toLocaleString('vi-VN')} Linh Thạch</span> & vĩnh viễn gia trì <span class="text-emerald-400">${ach.reward?.statDesc || ''}</span>!`, 'text-amber-300 font-bold');

    updateHUD();
    saveGameState();
    const container = document.getElementById('hub-modal-content');
    if (container) renderAchievementHub(container);
}
window.claimAchievement = claimAchievement;

function equipTitle(title) {
    if (state.equippedTitle === title) {
        state.equippedTitle = '';
        addLog(`Đã gỡ danh hiệu [${title}].`, 'text-slate-300');
    } else {
        state.equippedTitle = title;
        if (typeof playSound === 'function') playSound('bell');
        addLog(`Đã đeo danh hiệu Tiên Đạo <b class="text-amber-300">[${title}]</b>!`, 'text-amber-300');
    }
    updateHUD();
    saveGameState();
    const container = document.getElementById('hub-modal-content');
    if (container) renderAchievementHub(container);
}
window.equipTitle = equipTitle;

function renderAchievementHub(content) {
    if (!content) return;
    const list = typeof ACHIEVEMENTS_CONFIG !== 'undefined' ? ACHIEVEMENTS_CONFIG : [];
    const claimedMap = state.achievementsClaimed || {};
    const totalClaimed = Object.keys(claimedMap).filter(k => claimedMap[k]).length;
    const filter = currentAchievementFilter || 'all';

    const filtered = filter === 'all' ? list : list.filter(a => a.category === filter);

    content.innerHTML = `
        <div class="space-y-4">
            <header class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-amber-300 text-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-serif font-bold text-slate-100 text-base">🏆 THIÊN ĐẠO THÀNH TỰU • MINH THỆ BẢNG</h3>
                            ${state.equippedTitle ? `<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40 font-bold">[${state.equippedTitle}]</span>` : ''}
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Minh chứng con đường nghịch thiên tu chân. Lãnh thưởng Tiên Ngọc & gia trì thuộc tính vĩnh hằng.</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-2 text-xs">
                        <span class="text-slate-400 font-medium">Lĩnh Ngộ:</span>
                        <b class="text-amber-400 font-mono">${totalClaimed} / ${list.length}</b>
                    </div>
                    <div class="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-2 text-xs">
                        <span class="text-slate-400 font-medium">Tiên Ngọc:</span>
                        <b class="text-amber-300 font-mono">💎 ${(state.immortalJade || 0).toLocaleString('vi-VN')}</b>
                    </div>
                </div>
            </header>

            <!-- Bộ lọc phân loại -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2.5 overflow-x-auto text-xs">
                <button type="button" onclick="switchAchievementFilter('all')" class="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === 'all' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                    Tất Cả (${list.length})
                </button>
                <button type="button" onclick="switchAchievementFilter('realm')" class="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === 'realm' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                    🧘 Cảnh Giới
                </button>
                <button type="button" onclick="switchAchievementFilter('combat')" class="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === 'combat' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                    ⚔️ Chiến Đấu
                </button>
                <button type="button" onclick="switchAchievementFilter('wealth')" class="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === 'wealth' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                    🏮 Tiên Tài
                </button>
                <button type="button" onclick="switchAchievementFilter('arts')" class="px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${filter === 'arts' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}">
                    📜 Tiên Nghệ & Đạo Lữ
                </button>
            </div>

            <!-- Danh sách thành tựu -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${filtered.map(ach => {
                    const isClaimed = Boolean(claimedMap[ach.id]);
                    const prog = getAchievementProgress(ach);
                    const isEquipped = state.equippedTitle === ach.reward?.title;

                    return `
                        <article class="p-4 rounded-xl bg-slate-950/80 border ${isClaimed ? 'border-emerald-500/40 bg-emerald-950/10' : prog.isCompleted ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'} transition flex flex-col justify-between space-y-3 shadow-md">
                            <div class="flex items-start gap-3">
                                <div class="w-11 h-11 rounded-xl ${ach.bg || 'bg-slate-900'} border ${ach.border || 'border-slate-700'} flex items-center justify-center ${ach.color || 'text-amber-400'} text-lg shrink-0">
                                    <i class="fa-solid ${ach.icon || 'fa-award'}"></i>
                                </div>
                                <div class="flex-1 min-w-0 space-y-1">
                                    <div class="flex justify-between items-start">
                                        <h4 class="font-bold text-slate-100 text-sm font-serif truncate">${ach.title}</h4>
                                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0 ml-2">
                                            ${ach.categoryName}
                                        </span>
                                    </div>
                                    <p class="text-xs text-slate-400 line-clamp-2">${ach.desc}</p>
                                    
                                    <!-- Phần thưởng -->
                                    <div class="pt-1 flex flex-wrap gap-1.5 text-[11px]">
                                        <span class="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-mono">
                                            💎 +${ach.reward?.jade || 0} Ngọc
                                        </span>
                                        <span class="px-2 py-0.5 rounded bg-slate-900 text-gold-300 border border-slate-700 font-mono">
                                            +${(ach.reward?.stones || 0).toLocaleString('vi-VN')} LT
                                        </span>
                                        <span class="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                                            ⚡ ${ach.reward?.statDesc || ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Thanh tiến trình & Nút bấm -->
                            <div class="space-y-2 pt-1 border-t border-slate-800/80">
                                <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                                    <span>Tiến độ:</span>
                                    <span>${prog.current.toLocaleString('vi-VN')} / ${prog.target.toLocaleString('vi-VN')} (${Math.round(prog.percent * 100)}%)</span>
                                </div>
                                <div class="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                                    <div class="h-full ${isClaimed ? 'bg-emerald-400' : prog.isCompleted ? 'bg-amber-400' : 'bg-slate-600'} transition-all duration-300" style="width: ${prog.percent * 100}%"></div>
                                </div>

                                <div class="flex items-center gap-2 pt-0.5">
                                    ${isClaimed ? `
                                        <button disabled class="flex-1 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-check"></i> Đã Lĩnh Ngộ
                                        </button>
                                        ${ach.reward?.title ? `
                                            <button type="button" onclick="equipTitle('${ach.reward.title}')" class="px-3 py-1.5 rounded-lg ${isEquipped ? 'bg-amber-950 text-amber-300 border border-amber-500 font-bold' : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'} text-xs transition cursor-pointer">
                                                ${isEquipped ? '★ Đang Đeo' : 'Đeo Danh Hiệu'}
                                            </button>
                                        ` : ''}
                                    ` : prog.isCompleted ? `
                                        <button type="button" onclick="claimAchievement('${ach.id}')" class="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse">
                                            <i class="fa-solid fa-gift"></i> Lãnh Thưởng Thành Tựu
                                        </button>
                                    ` : `
                                        <button disabled class="w-full py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium cursor-not-allowed">
                                            Chưa Đạt Yêu Cầu
                                        </button>
                                    `}
                                </div>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
window.renderAchievementHub = renderAchievementHub;

function initializeKeyboardUX() {
    document.addEventListener('keydown', (event) => {
        if (cutsceneState.inProgress) {
            if (event.key === 'Escape') {
                abortTribulationCutscene();
                return;
            }
            if (cutsceneState.is_stunned) {
                if (['1', '2', '3', ' ', 'Enter'].includes(event.key)) {
                    if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
                    addLog("⚡ <span class='text-amber-400 font-bold'>[Tê Liệt]</span> Kim thân đang bị lôi kiếp gây choáng (1.5s), không thể thao tác!", "text-amber-300");
                    return;
                }
            }
            if (event.key === '1') {
                quickUseTribulationShield();
                return;
            }
            if (event.key === '2') {
                quickUseTribulationHeal();
                return;
            }
            if (event.key === '3') {
                quickUseTribulationPill();
                return;
            }
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                advanceTribulationWave();
                return;
            }
        }
        if (event.key === 'Escape') {
            closeMinorBreakthroughModal();
            closeTesterResetModal();
            closeTesterRealmModal();
            closeTesterToolbar();
            closeHubModal();
            if (activeDrawer) closeDrawer();
            closeEncounterModal?.();
            closeDemonTowerModal?.();
            return;
        }
    });
}

function initializeAutomationControls() {
    const controls = {
        'toggle-auto-master': 'enabled',
        'toggle-auto-pill': 'pill',
        'toggle-auto-heal': 'heal',
        'toggle-auto-farm': 'farm',
        'toggle-auto-alchemy': 'alchemy'
    };
    Object.entries(controls).forEach(([id, key]) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.checked = Boolean(state.auto[key]);
        input.addEventListener('change', () => {
            state.auto[key] = input.checked;
            addLog(`[Tự động] ${input.checked ? 'Bật' : 'Tắt'} ${key === 'enabled' ? 'toàn bộ trợ lý' : input.closest('label')?.querySelector('span')?.textContent || key}.`);
            saveGameState();
        });
    });
}

function runAutoAssistants(automationEnabled, loopStats, currentRealm) {
    if (!automationEnabled || !state.auto?.enabled) return;

    // 1. Tự động nuốt Tụ Khí Đan (Kiểm tra mở khóa túi đồ tĩnh lặng)
    const autoPill = state.auto.pill;
    if (autoPill && state.exp < currentRealm.maxExp * 0.65) {
        if (isFeatureUnlocked('btn_tui_do')) {
            const qiPill = state.inventory.find(i => i.id === 'pill_qi' && i.count > 0);
            if (qiPill && Math.random() < 1 - Math.pow(1 - 0.16, state.timeScale)) {
                useInventoryItem('pill_qi', true);
            }
        }
    }

    // Auto-heal is handled once per tick by checkAutoHeal(state).

    // 3. Tự động khai Lò Đan (Kiểm tra mở khóa tính năng Lò Đan - silently ignore nếu chưa mở)
    const autoAlchemy = state.auto.alchemy;
    if (autoAlchemy) {
        if (!isFeatureUnlocked('btn_lo_dan')) {
            // Tính năng Lò Đan chưa mở khóa -> Bỏ qua trong im lặng, không ghi log lỗi
            return;
        }
        const spiritHerb = state.inventory.find(i => i.id === 'herb_spirit');
        if (spiritHerb?.count >= 2) {
            craftPill('pill_qi', 'herb_spirit', 2, true);
        }
    }
}
window.runAutoAssistants = runAutoAssistants;

function GameLoop() {
        const currentRealm = REALMS[state.realmIndex];
        checkHeavenlySuppression(state);
        if (state.isDead) return { ...getIdleResourcesPayload(), ...getTimeSystemPayload() };

        // Hồi phục Khí Huyết (HP) tự động theo cảnh giới & timeScale (Passive HP Regen)
        const effectiveStats = typeof getEffectiveStats === 'function' ? getEffectiveStats() : { maxHp: state.maxHp || 500 };
        const currentMaxHp = effectiveStats.maxHp || state.maxHp || 500;
        const hpRegenPerSec = typeof getHpRegenPerSec === 'function'
            ? getHpRegenPerSec()
            : Math.round((state.hpRegenBase ?? 5) + (currentMaxHp * 0.01) + ((state.realmStage || 0) * 50));
        const timeScale = state.timeScale || 1;
        if (state.hp < currentMaxHp) {
            state.hp = Math.min(currentMaxHp, Math.round(state.hp + (hpRegenPerSec * timeScale)));
        }

        if (state.exp < currentRealm.maxExp) {
            state.ageYears += state.timeScale / M1_SYSTEM_RULES.secondsPerYearOnline;
            if (Trigger_Death()) { updateHUD(); return { ...getIdleResourcesPayload(), ...getTimeSystemPayload() }; }
        }
        state.linhKhi = Math.min(getLinhKhiMax(), state.linhKhi + getLinhKhiRate() * state.timeScale);
        if (state.beQuanTuQua?.active) {
            const deltaDaoTam = (5 / 3600) * state.timeScale;
            state.daoTam = Math.min(100, (state.daoTam != null ? state.daoTam : 100) + deltaDaoTam);
            state.tamMa = Math.max(0, 100 - state.daoTam);
            updateHUD();
        } else {
            const gain = getAdjustedCultivationGain(getIdleRate() * state.timeScale).gainedAmount;
            if (gain > 0) {
                // Commit the cultivation HUD with the gain itself. Optional VFX,
                // automation or room ticks below must not leave this bar stale.
                addExp(getIdleRate() * state.timeScale);
                spawnTuViFloatingText(gain);
                spawnSpiritParticles(3);
            }
            // The outer tick updates the HUD once after all state changes.
        }
        if (typeof tickExpedition === 'function') tickExpedition();
        return { ...getIdleResourcesPayload(), ...getTimeSystemPayload() };
}
window.GameLoop = GameLoop;
function updateUI() {
    if (typeof syncGameState === 'function') {
        syncGameState(state);
    }
    if (!document.getElementById('player-avatar') && typeof ensureCultivationCenter === 'function') {
        ensureCultivationCenter();
    }
    updateHUD();
}
window.updateUI = updateUI;
window.updateHUD = updateHUD;

let _idleLoopTickCounter = 0;

function catchUpBackgroundProgress(elapsedSeconds) {
    if (!state || state.isDead || elapsedSeconds < 3) return;
    const cappedSeconds = Math.min(86400, elapsedSeconds);
    const realm = REALMS[state.realmIndex];
    if (!realm) return;

    // 1. Linh Điền: Dược thảo tiếp tục lớn lên
    let farmUpdated = false;
    if (Array.isArray(state.farmPlots)) {
        const isFarmUnlocked = typeof isFeatureUnlocked === 'function' ? isFeatureUnlocked('btn_linh_dien') : true;
        const autoFarm = state.auto?.enabled !== false && state.auto?.farm && isFarmUnlocked;
        state.farmPlots.forEach(plot => {
            if (plot.herbId && plot.progress < 100) {
                plot.progress = Math.min(100, plot.progress + (plot.speed || 1) * cappedSeconds);
                farmUpdated = true;
            }
            if (plot.progress >= 100 && autoFarm && typeof harvestPlot === 'function') {
                harvestPlot(plot.id, true);
                farmUpdated = true;
            }
        });
        if (farmUpdated && activeDrawer === 'farm') {
            renderDrawerContent('farm');
        }
    }

    // 2. Tu Vi: Bể chứa vô hạn, tiếp tục tích lũy khi offline
    if (!state.beQuanTuQua?.active) {
        const adjustedGainPerSec = getAdjustedCultivationGain(getIdleRate()).gainedAmount;
        const gain = Math.round(cappedSeconds * adjustedGainPerSec);
        state.exp = (Number(state.exp) || 0) + gain;
    }

    // 3. Linh Khí Động Phủ
    state.linhKhi = Math.min(getLinhKhiMax(), state.linhKhi + Math.round(cappedSeconds * getLinhKhiRate()));

    // 4. Tuổi thọ: Tăng nhẹ nhàng không vượt trần Thọ Nguyên
    if (state.exp < realm.maxExp) {
        const yearsToAdd = cappedSeconds / M1_SYSTEM_RULES.secondsPerYearOnline;
        state.ageYears = Math.min(Math.max(0, getThoNguyenMax() - 1), state.ageYears + yearsToAdd);
    }

    // 5. HP & MP hồi phục
    const eff = getEffectiveStats();
    if (state.hp < eff.maxHp) {
        const hpRegen = typeof getHpRegenPerSec === 'function' ? getHpRegenPerSec() : 5;
        state.hp = Math.min(eff.maxHp, state.hp + Math.round(hpRegen * cappedSeconds));
    }
    if (state.mp < eff.maxMp) {
        state.mp = Math.min(eff.maxMp, state.mp + Math.round(4 * cappedSeconds));
    }

    // 6. Tông Môn Nhiệm Vụ: Tiếp tục tích lũy tiến độ khi offline
    if (state.sectQuest && state.sectQuest.inProgress && !state.sectQuest.completed) {
        state.sectQuest.elapsedSeconds = Math.min(state.sectQuest.durationSeconds, (state.sectQuest.elapsedSeconds || 0) + cappedSeconds);
        if (state.sectQuest.elapsedSeconds >= state.sectQuest.durationSeconds) {
            state.sectQuest.completed = true;
        }
    }

    // 7. Tiên Môn Gia Viên: Bổ sung tích lũy 4 cơ sở sản xuất khi offline
    if (typeof window.catchUpEstateProgress === 'function') {
        window.catchUpEstateProgress(cappedSeconds);
    }

    state.lastOnlineTime = Date.now();
    updateUI();
    saveGameState();
}
window.catchUpBackgroundProgress = catchUpBackgroundProgress;

window.onload = function() {
    const offline = loadGameState();
    initializeKeyboardUX();
    initializeAutomationControls();
    if (typeof initTsParticles === 'function') initTsParticles();
    
    // LỖI 2 FIX: Cố định Background luôn trỏ về ảnh Lofi mới, không bị flash đè ảnh cũ khi F5
    const bgConfig = (typeof BACKGROUNDS !== 'undefined' && BACKGROUNDS[state.bgIndex]) || BACKGROUNDS[0];
    const bgEl = document.getElementById('scene-background');
    if (bgEl && bgConfig) {
        bgEl.className = `fixed inset-0 z-0 transition-all duration-1000 bg-gradient-to-b ${bgConfig.classes} overflow-hidden`;
    }
    const targetBgImg = (bgConfig?.image && !bgConfig.image.includes('image_21.png')) ? bgConfig.image : './assets/images/bg_hagioi_co.png';
    const bgArtEl = document.getElementById('scene-bg-art');
    if (bgArtEl) {
        bgArtEl.style.backgroundImage = `url('${targetBgImg}')`;
        bgArtEl.style.backgroundSize = 'cover';
        bgArtEl.style.backgroundPosition = 'center bottom';
    }
    const worldEnv = document.getElementById('world-environment');
    if (worldEnv) {
        worldEnv.style.backgroundImage = `url('${targetBgImg}')`;
        worldEnv.style.backgroundSize = 'cover';
        worldEnv.style.backgroundPosition = 'center bottom';
    }

    if (typeof animateCanvas === 'function') animateCanvas();
    if (typeof ensureCultivationCenter === 'function') ensureCultivationCenter();
    updateUI();
    if (typeof updateCharacterModel === 'function') {
        updateCharacterModel(state.realmIndex);
    }
    const charLottie = document.getElementById('char-lottie-model');
    const charFallback = document.getElementById('char-main-img') || document.getElementById('char-fallback-img');
    if (charLottie && charFallback) {
        charLottie.addEventListener('error', () => {
            charLottie.style.opacity = '0';
            charFallback.style.opacity = '1';
        });
        charLottie.addEventListener('ready', () => {
            if (charFallback) charFallback.style.opacity = '1';
        });
    }
    addLog("Chào mừng đạo hữu tiến vào <span class='text-jade-400 font-semibold'>Thanh Vân Động Phủ</span>.");
    addLog("Tụ Linh Trận đã vận hành, linh khí đang tự động hội tụ về đan điền.");
    if (offline.seconds >= 30 && (offline.gained > 0 || offline.linhKhiGained > 0 || offline.yearsAged > 0)) {
        const popup = document.getElementById('offline-cultivation-popup');
        if (popup) {
            document.getElementById('offline-duration').textContent = `${offline.seconds.toLocaleString('vi-VN')} giây`;
            document.getElementById('offline-gain').textContent = `+${offline.gained.toLocaleString('vi-VN')} Tu Vi`;
            document.getElementById('offline-linh-khi').textContent = `+${offline.linhKhiGained.toLocaleString('vi-VN')} Linh Khí`;
            document.getElementById('offline-years').textContent = `+${offline.yearsAged.toFixed(2)} năm`;
            popup.classList.remove('hidden');
            popup.classList.add('flex');
        }
    }

    // TRỤ CỘT 4: Vòng lặp treo máy an toàn — Chỉ sử dụng DUY NHẤT 1 setInterval (Game Tick = 1000ms)
    if (window._mainIdleLoopIntervalId) {
        clearInterval(window._mainIdleLoopIntervalId);
        window._mainIdleLoopIntervalId = null;
    }

    window._mainIdleLoopIntervalId = setInterval(() => {
        _idleLoopTickCounter++;
        const prevSnapshot = {
            exp: Math.floor(Number(state.exp) || 0),
            hp: Math.floor(Number(state.hp) || 0),
            mp: Math.floor(Number(state.mp) || 0),
            stones: Math.floor(Number(state.stones) || 0),
            daoTam: Math.floor(Number(state.daoTam) || 0),
            realmIndex: Number(state.realmIndex) || 0,
            linhKhi: Math.floor(Number(state.linhKhi) || 0)
        };

        // 1. gainQi & Chu thiên vận chuyển
        const tick = GameLoop();
        if (state.isDead) { saveGameState(); return; }
        const currentRealm = REALMS[state.realmIndex];

        if (state.pillBuffRemaining > 0) {
            state.pillBuffRemaining = Math.max(0, state.pillBuffRemaining - state.timeScale);
        }

        // 2. checkAutoHeal: Hồi phục Khí Huyết & Linh Lực nếu bật Auto
        if (typeof checkAutoHeal === 'function') {
            checkAutoHeal(state);
        } else {
            if (state.mp === undefined) state.mp = 200;
            if (state.maxMp === undefined) state.maxMp = 200;
            const loopStatsFallback = getEffectiveStats();
            if (state.mp < loopStatsFallback.maxMp) {
                const titleRegen = loopStatsFallback.maxMp * (loopStatsFallback.mpRegenPercent || 0);
                state.mp = Math.min(loopStatsFallback.maxMp, state.mp + (4 + titleRegen) * state.timeScale);
            }
        }

        // 3. rollRandomEvent: Tỷ lệ 0.5% xuất hiện thông báo "Kỳ Ngộ" hoặc "Tâm Ma"
        if (typeof rollRandomEvent === 'function') {
            rollRandomEvent(state);
        }

        const loopStats = getEffectiveStats();
        state.lastOnlineTime = Date.now();

        // Cập nhật tiến trình Linh Điền
        let farmReady = false;
        let farmUpdated = false;
        const automationEnabled = Boolean(state.auto && state.auto.enabled);
        const isFarmUnlocked = isFeatureUnlocked('btn_linh_dien');
        const autoFarm = automationEnabled && state.auto.farm && isFarmUnlocked;
        state.farmPlots.forEach(plot => {
            if (plot.herbId && plot.progress < 100) {
                plot.progress = Math.min(100, plot.progress + plot.speed * state.timeScale);
                farmUpdated = true;
            }
            if (plot.progress >= 100) {
                if (autoFarm) {
                    harvestPlot(plot.id, true);
                    farmUpdated = true;
                } else {
                    farmReady = true;
                }
            }
        });

        const farmBadge = document.getElementById('badge-farm');
        if (farmBadge) {
            farmBadge.classList.toggle('hidden', !farmReady);
        }

        if (farmUpdated && activeDrawer === 'farm') {
            renderDrawerContent('farm');
        }

        // Chạy các chức năng Trợ lý tự động (Auto-Assistants)
        runAutoAssistants(automationEnabled, loopStats, currentRealm);

        if (typeof marketTick === 'function') marketTick();
        if (typeof tickCaveHubDashboard === 'function') tickCaveHubDashboard();
        if (typeof tickSectSystem === 'function') tickSectSystem();

        // Tách biệt tính toán và hiển thị: chỉ gọi updateUI() khi có giá trị thay đổi thực sự trong tick đó
        const nextSnapshot = {
            exp: Math.floor(Number(state.exp) || 0),
            hp: Math.floor(Number(state.hp) || 0),
            mp: Math.floor(Number(state.mp) || 0),
            stones: Math.floor(Number(state.stones) || 0),
            daoTam: Math.floor(Number(state.daoTam) || 0),
            realmIndex: Number(state.realmIndex) || 0,
            linhKhi: Math.floor(Number(state.linhKhi) || 0)
        };
        const changed = (
                prevSnapshot.exp !== nextSnapshot.exp ||
                prevSnapshot.hp !== nextSnapshot.hp ||
                prevSnapshot.mp !== nextSnapshot.mp ||
                prevSnapshot.stones !== nextSnapshot.stones ||
                prevSnapshot.daoTam !== nextSnapshot.daoTam ||
                prevSnapshot.realmIndex !== nextSnapshot.realmIndex ||
                prevSnapshot.linhKhi !== nextSnapshot.linhKhi
            );

        if (changed || farmUpdated) {
            updateUI();
        }

        // Tự động lưu mỗi 10 nhịp (10 giây) ngay trong cùng 1 setInterval duy nhất
        if (_idleLoopTickCounter % 10 === 0) {
            saveGameState();
        }
    }, 1000);

    window.addEventListener('pagehide', saveGameState);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window._lastTabHiddenTime = Date.now();
            saveGameState();
        } else {
            const now = Date.now();
            const last = window._lastTabHiddenTime || state.lastOnlineTime || now;
            const elapsed = Math.max(0, Math.floor((now - last) / 1000));
            window._lastTabHiddenTime = null;
            if (elapsed >= 3) {
                catchUpBackgroundProgress(elapsed);
            }
        }
    });
};

// RPG Character & Inventory Modal Bindings
window.renderCharacterHub = renderCharacterHub;
window.switchCharacterTab = switchCharacterTab;
window.renderRpgCharacterInventory = renderRpgCharacterInventory;
window.handleAutoEquipBestGear = handleAutoEquipBestGear;
window.setInventoryFilter = setInventoryFilter;
window.showItemTooltip = showItemTooltip;
window.showSlotEmptyTooltip = showSlotEmptyTooltip;
window.updateItemTooltip = updateItemTooltip;
window.moveItemTooltip = updateItemTooltip;
window.hideItemTooltip = hideItemTooltip;
window.handleInventoryItemClick = handleInventoryItemClick;
window.handleItemClick = handleInventoryItemClick;
window.toggleEquipItem = toggleEquipItem;
window.useInventoryItem = useInventoryItem;
window.useItem = useInventoryItem;
window.addLog = addLog;
window.resetLogTracking = resetLogTracking;
window.rejectLockedFeature = rejectLockedFeature;
window.handleEquipSlotClick = handleEquipSlotClick;
window.cancelEquipTargeting = cancelEquipTargeting;
window.openEquipSlotPopover = openEquipSlotPopover;
window.closeSmartSlotPopover = closeSmartSlotPopover;
window.handleSmartPopoverUnequip = handleSmartPopoverUnequip;
window.handleSmartPopoverSwapEquip = handleSmartPopoverSwapEquip;
window.triggerSlotFlash = triggerSlotFlash;
window.isHardCapReached = isHardCapReached;
window.chooseEncounterOption = chooseEncounterOption;
window.openEncounterModal = openEncounterModal;
window.closeEncounterModal = closeEncounterModal;
window.triggerHolyFlash = triggerHolyFlash;
window.triggerBloodFlash = triggerBloodFlash;
window.triggerScreenShake = triggerScreenShake;
window.triggerDaoTamBarGlitch = triggerDaoTamBarGlitch;
window.renderCharacterTab = renderCharacterTab;

// ==========================================
// THẦN THỨC TRA CỨU: CHI TIẾT CÔNG PHÁP & TRANG BỊ (POPUP SMART POPOVER)
// ==========================================

function showSkillDetail(nameOrId) {
    if (!nameOrId) return;
    let s = null;
    if (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA)) {
        s = SKILLS_DATA.find(k => k.id === nameOrId || k.name === nameOrId);
    }
    if (!s && typeof state !== 'undefined' && Array.isArray(state.skills)) {
        s = state.skills.find(k => k.id === nameOrId || k.name === nameOrId);
    }
    if (!s) {
        s = {
            name: nameOrId,
            type: 'Công Pháp',
            tier: 'huyen',
            desc: 'Bí tịch tu tiên thượng cổ thất truyền.',
            effect: 'Tăng cường linh lực và cảnh giới tu vi.'
        };
    }

    const tierName = s.tier === 'pham' ? 'Phàm phẩm' : (s.tier === 'linh' ? 'Linh phẩm' : (s.tier === 'dia' ? 'Địa phẩm' : (s.tier === 'thien' ? 'Thiên phẩm' : 'Huyền phẩm')));
    const colorClass = s.tier === 'pham' ? 'border-slate-500 text-slate-300' : (s.tier === 'linh' ? 'border-emerald-500 text-emerald-400' : (s.tier === 'dia' ? 'border-purple-500 text-purple-400' : (s.tier === 'thien' ? 'border-amber-400 text-amber-300' : 'border-sky-500 text-sky-400')));

    const popoverCard = document.getElementById('smart-slot-popover-card');
    const backdrop = document.getElementById('smart-slot-popover-backdrop');
    if (popoverCard && backdrop) {
        popoverCard.innerHTML = `
            <div class="relative z-10 text-xs">
                ${s.image_url ? `<img src="${s.image_url}" alt="Bìa ${s.name || nameOrId}" class="w-36 h-36 mx-auto mb-3 rounded-lg object-cover border border-amber-500/40" onerror="this.style.display='none'">` : ''}
                <h3 class="font-serif text-base font-bold mb-1 ${colorClass}">${s.name || nameOrId} [${tierName}]</h3>
                <span class="px-2 py-0.5 rounded text-[10px] bg-stone-900 border border-stone-700 text-amber-200">${s.type || 'Công Pháp'}</span>
                <p class="text-stone-300 mt-2.5 leading-relaxed font-serif italic">"${s.desc || ''}"</p>
                <div class="p-2 rounded-lg bg-stone-950/90 border border-stone-800/80 mt-3 font-mono">
                    <span class="text-amber-400">Hiệu quả:</span> <span class="text-slate-100">${s.effect || s.eff || '+Chiến lực & Linh lực'}</span>
                </div>
                <button class="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold mt-4 transition active:scale-95" onclick="closeSmartSlotPopover()">ĐÓNG THẦN THỨC</button>
            </div>
        `;
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');
    }
}

function showEquipmentDetail(nameOrId) {
    if (!nameOrId) return;
    let item = null;
    if (typeof state !== 'undefined' && Array.isArray(state.inventory)) {
        item = state.inventory.find(i => i.id === nameOrId || i.name === nameOrId);
    }
    if (!item && typeof DEFAULT_STATE !== 'undefined' && Array.isArray(DEFAULT_STATE.inventory)) {
        item = DEFAULT_STATE.inventory.find(i => i.id === nameOrId || i.name === nameOrId);
    }
    if (!item) {
        item = {
            name: nameOrId,
            type: 'Bảo Vật',
            rarity: 2,
            desc: 'Pháp bảo tiên gia tụ tập linh khí.',
            atkBonus: 0,
            defBonus: 0,
            hpBonus: 0
        };
    }

    const rarityNames = { 1: 'Phàm phẩm', 2: 'Linh phẩm', 3: 'Huyền phẩm', 4: 'Địa phẩm', 5: 'Thiên phẩm', 6: 'Tiên phẩm' };
    const rName = rarityNames[item.rarity] || 'Linh phẩm';
    const colorClass = item.rarity === 1 ? 'border-slate-500 text-slate-300' : (item.rarity === 2 ? 'border-emerald-500 text-emerald-400' : (item.rarity === 3 ? 'border-sky-500 text-sky-400' : (item.rarity === 4 ? 'border-purple-500 text-purple-400' : 'border-amber-400 text-amber-300')));

    const statBuffs = [];
    if (item.atkBonus) statBuffs.push(`Công +${item.atkBonus}`);
    if (item.defBonus) statBuffs.push(`Thủ +${item.defBonus}`);
    if (item.hpBonus) statBuffs.push(`HP +${item.hpBonus}`);
    const effStr = statBuffs.length ? statBuffs.join(', ') : (item.desc || 'Tăng cường thuộc tính tu vi');

    const popoverCard = document.getElementById('smart-slot-popover-card');
    const backdrop = document.getElementById('smart-slot-popover-backdrop');
    if (popoverCard && backdrop) {
        popoverCard.innerHTML = `
            <div class="relative z-10 text-xs">
                <h3 class="font-serif text-base font-bold mb-1 ${colorClass}">${item.name || nameOrId} [${rName}]</h3>
                <span class="px-2 py-0.5 rounded text-[10px] bg-stone-900 border border-stone-700 text-amber-200">${item.type || 'Pháp Bảo'}</span>
                <p class="text-stone-300 mt-2.5 leading-relaxed font-serif italic">"${item.desc || ''}"</p>
                <div class="p-2 rounded-lg bg-stone-950/90 border border-stone-800/80 mt-3 font-mono">
                    <span class="text-amber-400">Chỉ số:</span> <span class="text-slate-100">${effStr}</span>
                </div>
                <button class="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold mt-4 transition active:scale-95" onclick="closeSmartSlotPopover()">ĐÓNG THẦN THỨC</button>
            </div>
        `;
        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');
    }
}

// Xuất file Save Data JSON chuẩn hóa cho Antigravity
function openAntigravityExportModal() {
    try {
        const s = (typeof state !== 'undefined' ? state : (window.state || {}));
        const json = JSON.stringify(s, null, 2);

        // Copy vào clipboard nếu trình duyệt hỗ trợ
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(json).catch(() => {});
        }

        // Tự động tải file save về máy
        if (typeof document !== 'undefined') {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `van_co_tu_tien_save_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        if (typeof addLog === 'function') {
            addLog("📁 <span class='text-cyan-300 font-bold'>[Xuất Lưu Trữ]</span> Đã xuất thành công tệp Save Data JSON và sao chép vào bộ nhớ đệm!", "text-cyan-300");
        }
    } catch (err) {
        console.error("Lỗi xuất dữ liệu:", err);
    }
}

function initializeAntigravityGraphics() {

    window.showSkillDetail = showSkillDetail;
    window.showEquipmentDetail = showEquipmentDetail;
    window.renderCharacterTab = renderCharacterTab;
    window.openAntigravityExportModal = openAntigravityExportModal;

    if (typeof enterSectFacility === 'function') {
        window.enterSectFacility = enterSectFacility;
    }
}

// Khởi tạo an toàn (Event Delegation do js/interaction.js đảm nhiệm)
function initMouseInteractions() {
    // Được xử lý tập trung và an toàn bởi js/interaction.js
}

if (typeof window !== 'undefined') {
    window.showSkillDetail = showSkillDetail;
    window.showEquipmentDetail = showEquipmentDetail;
    window.openAntigravityExportModal = openAntigravityExportModal;
    window.initializeAntigravityGraphics = initializeAntigravityGraphics;
    window.initMouseInteractions = initMouseInteractions;
}

if (typeof setTimeout !== 'undefined') {
    setTimeout(initializeAntigravityGraphics, 300);
}

// Fallback an toàn cho Modal Quản Lý Bản Thể / Tài Khoản
if (typeof window.openProfileModal !== 'function') {
    window.openProfileModal = function(mode) {
        const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
        if (modal) {
            modal.style.setProperty('display', 'flex', 'important');
            modal.classList.add('is-open');
        }
    };
}
if (typeof window.closeProfileModal !== 'function') {
    window.closeProfileModal = function() {
        const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('is-open');
        }
    };
}
