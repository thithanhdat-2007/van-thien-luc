/**
 * ============================================================================
 * FILE: js/stats.js — THUẬT TOÁN ĐỒNG BỘ CHIẾN LỰC, UY ÁP CẢNH GIỚI & SÁT THƯƠNG
 * ============================================================================
 * Tuân thủ 4 Hệ Phương Trình Cốt Lõi & Trụ Cột 2:
 * 1. Hệ phương trình Chỉ số Cảnh giới (Exponential Realm Scaling: x1, x10, x100, x1000, x10000)
 * 2. Thuật toán Đồng bộ Chiến Lực (calculateTotalStats):
 *    - Base Stats = Chỉ số gốc + (Tiểu Cảnh Giới * Hệ số Cảnh Giới) * TierMultiplier
 *    - Gear Stats = Tổng (ATK, DEF, HP) từ 6 ô Trang bị + Buff theo Set
 *    - Skill Multiplier = Tỷ lệ % cộng thêm từ Tâm Pháp / Công Pháp
 *    - Total Stats = (Base + Gear) * (1 + Skill Multiplier)
 *    - CP = (Total_ATK * 2) + (Total_DEF * 1.5) + (Total_HP * 0.1)
 * 3. Cơ chế Uy Áp Cảnh Giới (calculateRealmSuppression)
 * 4. Công thức Sát Thương Tổng Hợp (calculateDamage)
 * ============================================================================
 */

const STATS_TIER_MULTIPLIERS = {
    1: 1,       // Luyện Khí (Tier 1): Base Stats * 1
    2: 10,      // Trúc Cơ (Tier 2): Base Stats * 10
    3: 100,     // Kim Đan (Tier 3): Base Stats * 100
    4: 1000,    // Nguyên Anh (Tier 4): Base Stats * 1,000
    5: 10000    // Hóa Thần (Tier 5): Base Stats * 10,000
};

const EQUIPMENT_SLOTS = ['weapon', 'armor', 'boots', 'ring', 'talisman', 'artifact'];

/**
 * Chuẩn hóa cấp bậc Đại Cảnh Giới về 1..5
 */
function normalizeRealmTier(input) {
    if (typeof resolveRealmTier === 'function') {
        return resolveRealmTier(input);
    }
    if (typeof input === 'number' && !Number.isNaN(input)) {
        return Math.max(1, Math.floor(input));
    }
    if (typeof input === 'object' && input !== null) {
        if (typeof input.tier === 'number') return input.tier >= 1 ? input.tier : input.tier + 1;
        if (typeof input.realmTier === 'number') return Math.max(1, input.realmTier);
        if (typeof input.majorIndex === 'number') return input.majorIndex + 1;
    }
    const str = String(input || '').toLowerCase();
    if (str.includes('hóa thần') || str.includes('hoa than')) return 5;
    if (str.includes('nguyên anh') || str.includes('nguyen anh')) return 4;
    if (str.includes('kim đan') || str.includes('kết đan') || str.includes('kim dan') || str.includes('ket dan')) return 3;
    if (str.includes('trúc cơ') || str.includes('truc co')) return 2;
    return 1;
}

/**
 * 2. CƠ CHẾ UY ÁP CẢNH GIỚI (REALM SUPPRESSION ALGORITHM)
 * - delta = attackerTier - defenderTier
 * - Nếu delta == 0: Sát thương 100% (1.0), nhận 100% (1.0)
 * - Nếu delta < 0 (Đánh vượt cấp - Bị Uy Áp):
 *   + Mỗi 1 cấp chênh lệch: Giảm 20% Sát thương gây ra, Tăng 20% Sát thương nhận vào.
 *   + VD: Vượt 1 cấp (delta = -1) -> Gây 80% Dmg (0.8), Nhận 120% Dmg (1.2)
 *   + VD: Vượt 2 cấp (delta = -2) -> Gây 60% Dmg (0.6), Nhận 140% Dmg (1.4)
 *   + Giới hạn trần (Cap): Tối đa chỉ giảm đến 10% Dmg (0.10) và nhận tối đa 300% Dmg (3.00)
 * - Nếu delta > 0 (Đè cấp):
 *   + Mỗi 1 cấp cao hơn: Tăng 10% Sát thương gây ra (+10%/cấp)
 *   + Giảm 10% Sát thương nhận vào (-10%/cấp, tối thiểu 0.10)
 */
function getRealmSuppression(attackerTier, defenderTier) {
    const aTier = normalizeRealmTier(attackerTier);
    const dTier = normalizeRealmTier(defenderTier);
    const delta = aTier - dTier;

    if (delta === 0) return 1.0;

    if (delta < 0) {
        const diff = Math.abs(delta);
        return Math.max(0.10, Number((1.0 - diff * 0.20).toFixed(2)));
    }

    return Number((1.0 + delta * 0.10).toFixed(2));
}

function getRealmSuppressionTaken(attackerTier, defenderTier) {
    const aTier = normalizeRealmTier(attackerTier);
    const dTier = normalizeRealmTier(defenderTier);
    const delta = aTier - dTier;

    if (delta === 0) return 1.0;

    if (delta < 0) {
        const diff = Math.abs(delta);
        return Math.min(3.0, Number((1.0 + diff * 0.20).toFixed(2)));
    }

    return Math.max(0.10, Number((1.0 - delta * 0.10).toFixed(2)));
}

function calculateRealmSuppression(attackerTier, defenderTier) {
    return getRealmSuppression(attackerTier, defenderTier);
}

/**
 * Trả về cả hệ số Sát thương gây ra và Sát thương nhận vào theo Uy Áp Cảnh Giới
 */
function calculateRealmSuppressionPair(attackerTier, defenderTier) {
    const aTier = normalizeRealmTier(attackerTier);
    const dTier = normalizeRealmTier(defenderTier);
    const delta = aTier - dTier;

    const dealt = getRealmSuppression(aTier, dTier);
    const taken = getRealmSuppressionTaken(aTier, dTier);

    return {
        delta,
        dealtMultiplier: dealt,
        takenMultiplier: taken,
        damageDealtMultiplier: dealt,
        damageTakenMultiplier: taken
    };
}

/**
 * 4. CÔNG THỨC SÁT THƯƠNG TỔNG HỢP (DAMAGE FORMULA ALGORITHM)
 */
function calculateDamage(attacker, defender) {
    const atkObj = attacker || { atk: 10, tier: 1 };
    const defObj = defender || { def: 0, tier: 1 };

    // Đảm bảo Công Kích >= 1 và Phòng Ngự >= 0, triệt tiêu hoàn toàn NaN
    const atkVal = Math.max(1, Number(atkObj.total_atk !== undefined ? atkObj.total_atk : (atkObj.atk || 0)) || 1);
    const defVal = Math.max(0, Number(defObj.total_def !== undefined ? defObj.total_def : (defObj.def || 0)) || 0);

    // 1. Dmg thô: Trừ phòng ngự
    let rawDamage = atkVal - defVal;

    // 2. Bảo chứng sát thương tối thiểu (Nếu Công <= Thủ, sát thương tối thiểu = 10% Công Kích nhưng tối thiểu là 1)
    if (rawDamage <= 0) rawDamage = Math.max(1, Math.floor(atkVal * 0.1));

    // Tỷ lệ bạo kích (Crit)
    let critChance = typeof atkObj.critChance === 'number'
        ? atkObj.critChance
        : (typeof atkObj.crit === 'number' ? (atkObj.crit > 1 ? atkObj.crit / 100 : atkObj.crit) : 0.05);
    critChance = Math.max(0, Math.min(1, Number(critChance) || 0.05));
    let critDamage = Math.max(1, Number(atkObj.critDamage) || 1.5);
    let isCrit = Math.random() < critChance;
    if (isCrit) rawDamage = Math.max(1, Math.floor(rawDamage * critDamage));

    // 3. Nhân hệ số Uy Áp
    let attackerTier = atkObj.realmIndex !== undefined
        ? (Math.floor(atkObj.realmIndex / 4) + 1)
        : (atkObj.tier !== undefined ? atkObj.tier : (atkObj.realmTier !== undefined ? atkObj.realmTier : 1));
    let defenderTier = defObj.realmIndex !== undefined
        ? (Math.floor(defObj.realmIndex / 4) + 1)
        : (defObj.tier !== undefined ? defObj.tier : (defObj.realmTier !== undefined ? defObj.realmTier : 1));
    let suppressionMultiplier = (typeof getRealmSuppression === 'function')
        ? getRealmSuppression(attackerTier, defenderTier)
        : 1.0;
    if (!Number.isFinite(suppressionMultiplier) || suppressionMultiplier <= 0) suppressionMultiplier = 1.0;

    // 4. Áp dụng Buff từ Công pháp/Đan dược nếu có
    let buffMultiplier = Number(atkObj.damageBuff) || 1.0;
    if (!Number.isFinite(buffMultiplier) || buffMultiplier <= 0) buffMultiplier = 1.0;

    // 5. Final Dmg: Tuyệt đối KHÔNG BAO GIỜ <= 0 hoặc NaN
    let finalDamage = Math.floor(rawDamage * suppressionMultiplier * buffMultiplier);
    if (!Number.isFinite(finalDamage) || finalDamage < 1) finalDamage = 1;

    return {
        damage: finalDamage,
        isCrit: isCrit,
        suppressionMultiplier: suppressionMultiplier
    };
}

/**
 * TRỤ CỘT 2: THUẬT TOÁN ĐỒNG BỘ CHIẾN LỰC (calculateTotalStats)
 * Công thức:
 * 1. Base Stats = (Chỉ số gốc + Tiểu Cảnh Giới * Hệ số) * TierMultiplier (1, 10, 100, 1000, 10000)
 * 2. Gear Stats = Tổng (ATK, DEF, HP) từ 6 ô Trang bị + Buff theo Set
 * 3. Skill Multiplier = Tỷ lệ % cộng thêm từ Tâm Pháp / Công Pháp
 * 4. Total Stats = (Base + Gear) * (1 + Skill Multiplier)
 * 5. CP = (Total_ATK * 2) + (Total_DEF * 1.5) + (Total_HP * 0.1)
 */
function calculateTotalStats(sourceState) {
    const rawState = sourceState || (typeof GameState !== 'undefined' ? GameState : (typeof state !== 'undefined' ? state : {}));
    const s = rawState._rawState ? rawState._rawState : rawState;
    const playerNode = rawState.player && rawState.player.base_stats ? rawState.player : null;

    // Xác định Cảnh giới và Tier (1..5)
    const realmIndex = Number(playerNode?.realmIndex ?? s.realmIndex ?? 0);
    const realmsList = (typeof REALMS !== 'undefined' && Array.isArray(REALMS))
        ? REALMS
        : ((typeof REALMS_DATA !== 'undefined' && Array.isArray(REALMS_DATA)) ? REALMS_DATA : []);
    const realmObj = realmsList[realmIndex] || { majorIndex: 0, minorIndex: 0, baseHp: 500, baseAtk: 35, baseDef: 15, baseMp: 200 };

    const majorIndex = Number(realmObj.majorIndex ?? Math.floor(realmIndex / 4));
    const subLevel = Number(playerNode?.sub_level ?? ((realmObj.minorIndex ?? (realmIndex % 4)) + 1));
    const tier = normalizeRealmTier(playerNode?.tier ?? realmObj.realmTier ?? (majorIndex + 1));
    const tierMultiplier = STATS_TIER_MULTIPLIERS[tier] || Math.pow(10, Math.max(0, tier - 1));

    // 1. CHỈ SỐ CƠ BẢN (BASE STATS)
    // Chỉ số gốc tạo nhân vật: HP=500, ATK=30, DEF=15, MP=200
    const originBase = playerNode?.base_stats || {
        hp: 500,
        atk: 30,
        def: 15,
        mp: 200,
        crit: s.crit || 10
    };

    // Hệ số tăng trưởng mỗi Tiểu Cảnh Giới (+25% mỗi bậc nhỏ) nhân với TierMultiplier của Đại Cảnh Giới
    const subStageFactor = 1 + (Math.max(1, subLevel) - 1) * 0.28;
    const computedRealmHp = Math.round((Number(originBase.hp) || 500) * subStageFactor * tierMultiplier);
    const computedRealmAtk = Math.round((Number(originBase.atk) || 30) * subStageFactor * tierMultiplier);
    const computedRealmDef = Math.round((Number(originBase.def) || 15) * subStageFactor * tierMultiplier);
    const computedRealmMp = Math.round((Number(originBase.mp) || 200) * subStageFactor * tierMultiplier);

    // 1. TÁCH BẠCH CHỈ SỐ GỐC (BASE STATS TỪ CẢNH GIỚI / LEVEL)
    // Tuyệt đối không đọc từ s.atk / s.def / s.maxHp vì các biến này chứa cả đồ!
    const baseHp = Number(s.baseHp) || Math.max(computedRealmHp, Number(realmObj.baseHp) || 500);
    const baseAtk = Number(s.baseAtk) || Math.max(computedRealmAtk, Number(realmObj.baseAtk) || 30);
    const baseDef = Number(s.baseDef) || Math.max(computedRealmDef, Number(realmObj.baseDef) || 15);
    const baseMp = Number(s.baseMp) || Math.max(computedRealmMp, Number(realmObj.baseMp) || 200);

    s.baseHp = baseHp;
    s.baseAtk = baseAtk;
    s.baseDef = baseDef;
    s.baseMp = baseMp;

    // 2. CHỈ SỐ TRANG BỊ (GEAR STATS) — DUYỆT QUA CÁC MÓN ĐANG MẶC TRÊN NGƯỜI
    let gearAtk = 0;
    let gearDef = 0;
    let gearHp = 0;
    let gearMp = 0;
    let gearCrit = 0;
    let gearAtkPercent = 0;
    let gearDefPercent = 0;
    let gearHpPercent = 0;
    let equippedCount = 0;

    // Đảm bảo s.equipped tồn tại
    if (!s.equipped || typeof s.equipped !== 'object') {
        s.equipped = {};
    }

    const invList = Array.isArray(s.inventory) ? s.inventory : (Array.isArray(rawState.inventory) ? rawState.inventory : []);

    // Đồng bộ nếu s.equipped chưa có món nào nhưng inventory có item.equipped = true
    EQUIPMENT_SLOTS.forEach(slot => {
        if (!s.equipped[slot] && invList.length > 0) {
            const found = invList.find(i => i && i.equipped && (i.slot === slot || (slot === 'artifact' && (i.slot === 'secondary_weapon' || i.type === 'Pháp Bảo' || i.type === 'secondary_weapon' || i.type === 'weapon'))));
            if (found) s.equipped[slot] = found;
        }
    });

    // Cộng dồn CÁC MÓN ĐANG MẶC TRÊN NGƯỜI (Equipped Items)
    for (let slot in s.equipped) {
        let item = s.equipped[slot];
        if (item) {
            equippedCount++;
            const enhanceMult = 1 + (Number(item.enhanceLevel || item.refineLevel || 0) * 0.1);
            gearAtk += Math.round((Number(item.atkBonus ?? item.atk) || 0) * enhanceMult);
            gearDef += Math.round((Number(item.defBonus ?? item.def) || 0) * enhanceMult);
            gearHp += Math.round((Number(item.hpBonus ?? item.hp) || 0) * enhanceMult);
            gearMp += Math.round((Number(item.mpBonus ?? item.mp) || 0) * enhanceMult);
            gearCrit += Number(item.critBonus ?? item.crit) || 0;
            if (item.atkPercent) gearAtkPercent += Number(item.atkPercent);
            if (item.defPercent) gearDefPercent += Number(item.defPercent);
            if (item.hpPercent) gearHpPercent += Number(item.hpPercent);
        }
    }

    // Set Bonus: Mặc từ 3 món (+5%), đủ 6 món (+15%)
    let setBonusMult = 1.0;
    if (equippedCount >= 6) setBonusMult = 1.15;
    else if (equippedCount >= 3) setBonusMult = 1.05;

    gearAtk = Math.round(gearAtk * setBonusMult);
    gearDef = Math.round(gearDef * setBonusMult);
    gearHp = Math.round(gearHp * setBonusMult);
    gearMp = Math.round(gearMp * setBonusMult);

    // 3. CHỈ SỐ CÔNG PHÁP (SKILL MULTIPLIER)
    let skillAtkMult = 0;
    let skillDefMult = 0;
    let skillHpMult = 0;
    let skillMpMult = 0;

    const skillsArray = Array.isArray(rawState.skills)
        ? rawState.skills
        : (Array.isArray(s.skills)
            ? s.skills
            : ((typeof GameState !== 'undefined' && Array.isArray(GameState.skills)) ? GameState.skills : []));
    const equippedSkillIds = Array.isArray(s.equippedSkills) ? [...s.equippedSkills] : [];
    const learnedSkills = Array.isArray(s.learnedSkills) ? s.learnedSkills : [];
    const catalogSkills = (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA)) ? SKILLS_DATA : [];

    // Duyệt từ mảng công pháp trực tiếp trong GameState.skills / state.skills
    skillsArray.forEach(sk => {
        if (!sk) return;
        if (typeof sk === 'string') {
            if (!equippedSkillIds.includes(sk)) equippedSkillIds.push(sk);
            return;
        }
        const lvl = Number(sk.level) || 1;
        if (sk.atkPercent || sk.atkMult) skillAtkMult += Number(sk.atkPercent || sk.atkMult) * lvl;
        if (sk.defPercent || sk.defMult) skillDefMult += Number(sk.defPercent || sk.defMult) * lvl;
        if (sk.hpPercent || sk.hpMult) skillHpMult += Number(sk.hpPercent || sk.hpMult) * lvl;
        if (sk.mpPercent || sk.mpMult) skillMpMult += Number(sk.mpPercent || sk.mpMult) * lvl;
        if (sk.bonusType === 'atk') skillAtkMult += 0.05 * lvl;
        if (sk.bonusType === 'def') {
            skillDefMult += 0.05 * lvl;
            skillHpMult += 0.05 * lvl;
        }
        if (sk.id === 'truong_xuan_cong' || sk.name === 'Trường Xuân Công') skillHpMult += 0.10 * lvl;
    });

    // Duyệt từ SKILLS_DATA theo equippedSkillIds
    equippedSkillIds.forEach(skillId => {
        const tmpl = catalogSkills.find(item => item.id === skillId || item.name === skillId);
        if (!tmpl || !tmpl.stats) return;
        const owned = learnedSkills.find(item => item.id === tmpl.id);
        const level = Number(owned?.level) || 1;
        const masteryMult = (typeof MASTERY_LEVELS !== 'undefined' && MASTERY_LEVELS[level - 1])
            ? MASTERY_LEVELS[level - 1].mult
            : (1 + (level - 1) * 0.2);

        if (tmpl.stats.atkPercent) skillAtkMult += tmpl.stats.atkPercent * masteryMult;
        if (tmpl.stats.defPercent) skillDefMult += tmpl.stats.defPercent * masteryMult;
        if (tmpl.stats.hpPercent) skillHpMult += tmpl.stats.hpPercent * masteryMult;
        if (tmpl.stats.maxMpPercent) skillMpMult += tmpl.stats.maxMpPercent * masteryMult;
    });

    // Cộng thêm Buff Tông Môn Hạ Giới (Thanh Vân +10% HP, Huyết Hồn +10% ATK)
    if (s.playerSect === 'thanh_van') {
        skillHpMult += 0.10;
    } else if (s.playerSect === 'huyet_hon') {
        skillAtkMult += 0.10;
    }

    // Cộng thêm Buff Tỷ Lệ % từ Thần Binh Trang Bị (Thiên Khí / Đạo Khí)
    skillAtkMult += gearAtkPercent;
    skillDefMult += gearDefPercent;
    skillHpMult += gearHpPercent;

    // 4. TỔNG CHỈ SỐ (TOTAL STATS) = (Base + Gear) * (1 + Skill Multiplier)
    let totalAtk = Math.floor((baseAtk + gearAtk) * (1 + skillAtkMult));
    let totalDef = Math.floor((baseDef + gearDef) * (1 + skillDefMult));
    let totalHp = Math.floor((baseHp + gearHp) * (1 + skillHpMult));
    let totalMp = Math.floor((baseMp + gearMp) * (1 + skillMpMult));
    const totalCrit = Number(((Number(s.crit) || 10) + gearCrit).toFixed(1));

    // Giảm 50% nếu đang Trọng Thương
    if (s.heavyInjuryUntil && Date.now() < s.heavyInjuryUntil) {
        totalAtk = Math.max(1, Math.floor(totalAtk * 0.5));
        totalDef = Math.max(1, Math.floor(totalDef * 0.5));
        totalHp = Math.max(1, Math.floor(totalHp * 0.5));
    }

    // 5. CHIẾN LỰC (COMBAT POWER - CP): CP = (Total_ATK * 2) + (Total_DEF * 1.5) + (Total_HP * 0.1)
    const cp = Math.round((totalAtk * 2) + (totalDef * 1.5) + (totalHp * 0.1));

    const baseStatsObj = {
        atk: baseAtk,
        def: baseDef,
        hp: baseHp,
        mp: baseMp
    };
    const gearStatsObj = {
        atk: gearAtk,
        def: gearDef,
        hp: gearHp,
        mp: gearMp,
        crit: gearCrit,
        equippedCount,
        setBonusMult
    };
    const totalStatsObj = {
        atk: totalAtk,
        def: totalDef,
        hp: totalHp,
        maxHp: totalHp,
        mp: totalMp,
        maxMp: totalMp,
        crit: totalCrit
    };

    const result = {
        tier,
        tierMultiplier,
        base: baseStatsObj,
        baseStats: baseStatsObj,
        gear: gearStatsObj,
        gearStats: gearStatsObj,
        skillMultiplier: {
            atk: Number(skillAtkMult.toFixed(4)),
            def: Number(skillDefMult.toFixed(4)),
            hp: Number(skillHpMult.toFixed(4)),
            mp: Number(skillMpMult.toFixed(4))
        },
        total: totalStatsObj,
        totalStats: totalStatsObj,
        atk: totalAtk,
        def: totalDef,
        hp: totalHp,
        maxHp: totalHp,
        mp: totalMp,
        maxMp: totalMp,
        crit: totalCrit,
        cp: cp,
        combatPower: cp
    };

    s.totalAtk = totalAtk;
    s.totalDef = totalDef;
    s.totalHp = totalHp;
    s.totalMp = totalMp;
    s.atk = totalAtk;
    s.def = totalDef;
    s.maxHp = totalHp;
    s.maxMp = totalMp;
    if (s.hp !== undefined) s.hp = Math.min(s.hp, totalHp);
    if (s.mp !== undefined) s.mp = Math.min(s.mp, totalMp);
    s.combatPower = cp;

    if (typeof GameState !== 'undefined' && GameState) {
        GameState.totalStats = result;
    }

    return result;
}

function calculateCP(totalAtk, totalDef, totalHp) {
    const atk = Number(totalAtk) || 0;
    const def = Number(totalDef) || 0;
    const hp = Number(totalHp) || 0;
    return Math.round((atk * 2) + (def * 1.5) + (hp * 0.1));
}

if (typeof window !== 'undefined') {
    window.STATS_TIER_MULTIPLIERS = STATS_TIER_MULTIPLIERS;
    window.getRealmSuppression = getRealmSuppression;
    window.getRealmSuppressionTaken = getRealmSuppressionTaken;
    window.calculateRealmSuppression = calculateRealmSuppression;
    window.calculateRealmSuppressionPair = calculateRealmSuppressionPair;
    window.calculateDamage = calculateDamage;
    window.calculateTotalStats = calculateTotalStats;
    window.calculateCP = calculateCP;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STATS_TIER_MULTIPLIERS,
        normalizeRealmTier,
        getRealmSuppression,
        getRealmSuppressionTaken,
        calculateRealmSuppression,
        calculateRealmSuppressionPair,
        calculateDamage,
        calculateTotalStats,
        calculateCP
    };
}
