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
    const penetration = Math.min(50, Math.max(0, Number(atkObj.armorPen) || 0));
    const defVal = Math.max(0, Number(defObj.total_def !== undefined ? defObj.total_def : (defObj.def || 0)) || 0) * (1 - penetration / 100);

    // 1. Dmg thô: Trừ phòng ngự
    let rawDamage = atkVal - defVal;

    // 2. Bảo chứng sát thương tối thiểu (Nếu Công <= Thủ, sát thương tối thiểu = 10% Công Kích nhưng tối thiểu là 1)
    if (rawDamage <= 0) rawDamage = Math.max(1, Math.floor(atkVal * 0.1));

    // Tỷ lệ bạo kích (Crit)
    let critChance = typeof atkObj.critChance === 'number'
        ? atkObj.critChance
        : (typeof atkObj.crit === 'number' ? (atkObj.crit > 1 ? atkObj.crit / 100 : atkObj.crit) : 0.05);
    critChance = Math.max(0, Math.min(1, Number(critChance) || 0) - Math.min(.5, Math.max(0, Number(defObj.critResist) || 0) / 100));
    let critDamage = Math.max(1, Number(atkObj.critDamage) || 1.5);
    let isCrit = Math.random() < critChance;
    if (isCrit) rawDamage = Math.max(1, Math.floor(rawDamage * critDamage));

    // 3. Nhân hệ số Uy Áp
    let attackerTier = atkObj.tier !== undefined ? atkObj.tier : atkObj.realmIndex !== undefined
        ? (Math.floor(atkObj.realmIndex / 4) + 1)
        : (atkObj.tier !== undefined ? atkObj.tier : (atkObj.realmTier !== undefined ? atkObj.realmTier : 1));
    let defenderTier = defObj.tier !== undefined ? defObj.tier : defObj.realmIndex !== undefined
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
    const roots = getRootStatBonuses(s);
    const rootMult = 1 + roots.resonance;
    let totalAtk = Math.floor((baseAtk + roots.atk + gearAtk) * (1 + skillAtkMult) * rootMult);
    let totalDef = Math.floor((baseDef + roots.def + gearDef) * (1 + skillDefMult) * rootMult);
    let totalHp = Math.floor((baseHp + roots.hp + gearHp) * (1 + skillHpMult) * rootMult);
    let totalMp = CultivationMathEngine.manaCap((baseMp + roots.mp + gearMp) * (1 + skillMpMult) * rootMult, realmObj);
    const totalCrit = Number(((Number(s.crit) || 10) + gearCrit + roots.crit).toFixed(1));

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

function recalculatePlayerStats(sourceState) {
    const rawState = sourceState || (typeof GameState !== 'undefined' ? GameState : (typeof state !== 'undefined' ? state : {}));
    const s = rawState._rawState ? rawState._rawState : rawState;
    if (!s) return null;

    // 1. CẢNH GIỚI VÀ HỆ SỐ TIER (EXPONENTIAL REALM SCALING)
    const realmIndex = Number(s.realmIndex || 0);
    const realmsList = (typeof REALMS !== 'undefined' && Array.isArray(REALMS) && REALMS.length > 0)
        ? REALMS
        : ((typeof REALMS_DATA !== 'undefined' && Array.isArray(REALMS_DATA)) ? REALMS_DATA : []);
    const realmObj = realmsList[realmIndex] || { majorIndex: 0, minorIndex: 0, baseHp: 500, baseAtk: 30, baseDef: 15, baseMp: 200, name: 'Luyện Khí Tầng 1' };

    const majorIndex = Number(realmObj.majorIndex ?? Math.floor(realmIndex / 4));
    const subLevel = Number(realmObj.minorIndex !== undefined ? (realmObj.minorIndex + 1) : ((realmIndex % 4) + 1));
    const tier = normalizeRealmTier(realmObj.realmTier ?? (majorIndex + 1));
    const tierMultiplier = STATS_TIER_MULTIPLIERS[tier] || Math.pow(10, Math.max(0, tier - 1));

    // A. CHỈ SỐ CƠ BẢN THEO CẢNH GIỚI
    const subStageFactor = 1 + (subLevel - 1) * 0.28;
    const baseHp = Math.round((Number(realmObj.baseHp) || 500) * subStageFactor * tierMultiplier);
    const baseAtk = Math.round((Number(realmObj.baseAtk) || 30) * subStageFactor * tierMultiplier);
    const baseDef = Math.round((Number(realmObj.baseDef) || 15) * subStageFactor * tierMultiplier);
    const baseMp = Math.round((Number(realmObj.baseMp) || 200) * subStageFactor * tierMultiplier);

    // B. TRANG BỊ ĐANG MẶC (EQUIPMENT)
    let gearAtk = 0, gearDef = 0, gearHp = 0, gearMp = 0, gearCrit = 0, gearPen = 0, gearDodge = 0;
    let gearAtkPct = 0, gearDefPct = 0, gearHpPct = 0;
    let equippedCount = 0;

    const inv = Array.isArray(s.inventory) ? s.inventory : (Array.isArray(rawState.inventory) ? rawState.inventory : []);
    const equippedMap = (s.equipped && typeof s.equipped === 'object') ? s.equipped : {};

    for (const slotKey in equippedMap) {
        const it = equippedMap[slotKey];
        if (it && typeof it === 'object') {
            equippedCount++;
            const enhanceMult = 1 + (Number(it.enhanceLevel || it.refineLevel || 0) * 0.1);
            gearAtk += Math.round((Number(it.atkBonus ?? it.atk) || 0) * enhanceMult);
            gearDef += Math.round((Number(it.defBonus ?? it.def) || 0) * enhanceMult);
            gearHp += Math.round((Number(it.hpBonus ?? it.hp) || 0) * enhanceMult);
            gearMp += Math.round((Number(it.mpBonus ?? it.mp) || 0) * enhanceMult);
            gearCrit += Number(it.critBonus ?? it.crit) || 0;
            gearPen += Number(it.penBonus ?? it.armorPen) || 0;
            gearDodge += Number(it.dodgeBonus ?? it.dodge) || 0;
            if (it.atkPercent) gearAtkPct += Number(it.atkPercent) || 0;
            if (it.defPercent) gearDefPct += Number(it.defPercent) || 0;
            if (it.hpPercent) gearHpPct += Number(it.hpPercent) || 0;
        }
    }

    inv.forEach(it => {
        if (it && it.equipped && it.slot && !equippedMap[it.slot]) {
            equippedCount++;
            const enhanceMult = 1 + (Number(it.enhanceLevel || it.refineLevel || 0) * 0.1);
            gearAtk += Math.round((Number(it.atkBonus ?? it.atk) || 0) * enhanceMult);
            gearDef += Math.round((Number(it.defBonus ?? it.def) || 0) * enhanceMult);
            gearHp += Math.round((Number(it.hpBonus ?? it.hp) || 0) * enhanceMult);
            gearMp += Math.round((Number(it.mpBonus ?? it.mp) || 0) * enhanceMult);
            gearCrit += Number(it.critBonus ?? it.crit) || 0;
            gearPen += Number(it.penBonus ?? it.armorPen) || 0;
            gearDodge += Number(it.dodgeBonus ?? it.dodge) || 0;
        }
    });

    let setBonusMult = equippedCount >= 6 ? 1.15 : (equippedCount >= 3 ? 1.05 : 1.0);
    gearAtk = Math.round(gearAtk * setBonusMult);
    gearDef = Math.round(gearDef * setBonusMult);
    gearHp = Math.round(gearHp * setBonusMult);

    // C. CẤP LINH CĂN (SPIRITUAL ROOTS) & CĂN CƠ NGŨ HÀNH
    // Kim: Công + Xuyên Giáp
    // Mộc: Khí Huyết + Hồi Máu/giây
    // Thủy: Chân Nguyên + Tốc Độ/Né + Hấp Thu Linh Khí
    // Hỏa: Tỉ Lệ Bạo Kích + Sát Thương Bạo
    // Thổ: Phòng Ngự + Kháng Bạo + Giảm Thương
    const plc = s.playerLinhCan || s.fiveElements || (s.spiritualRoot?.pillars ? {
        kim: s.spiritualRoot.pillars.metal,
        moc: s.spiritualRoot.pillars.wood,
        thuy: s.spiritualRoot.pillars.water,
        hoa: s.spiritualRoot.pillars.fire,
        tho: s.spiritualRoot.pillars.earth
    } : { kim: 2, moc: 4, thuy: 37, hoa: 1, tho: 3 });

    const kimLvl = Number(plc.kim ?? (s.spiritualRoot?.pillars?.metal ?? 0));
    const mocLvl = Number(plc.moc ?? (s.spiritualRoot?.pillars?.wood ?? 0));
    const thuyLvl = Number(plc.thuy ?? (s.spiritualRoot?.pillars?.water ?? 0));
    const hoaLvl = Number(plc.hoa ?? (s.spiritualRoot?.pillars?.fire ?? 0));
    const thoLvl = Number(plc.tho ?? (s.spiritualRoot?.pillars?.earth ?? 0));

    const rootAtk = Math.round(kimLvl * (15 + tier * 4));
    const rootPen = Number((kimLvl * 0.2).toFixed(1));

    const rootHp = Math.round(mocLvl * (120 + tier * 25));
    const rootHpRegen = Number((mocLvl * 0.6).toFixed(1));

    const rootMp = Math.round(thuyLvl * (20 + tier * 6));
    const rootDodge = Number((thuyLvl * 0.08).toFixed(1));
    const rootSpd = Math.round(thuyLvl * 0.3);

    const rootCrit = Number((hoaLvl * 0.25).toFixed(1));
    const rootCritDmg = Number((hoaLvl * 0.5).toFixed(1));

    const rootDef = Math.round(thoLvl * (10 + tier * 3));
    const rootCritResist = Number((thoLvl * 0.15).toFixed(1));

    // Dị Linh Căn (Rare Branches: Lôi, Phong, Băng)
    const rareBranches = s.spiritualRoot?.rareBranches || {};
    let rareAtk = 0, rareCrit = 0, rareDodge = 0, rareDef = 0, rareHp = 0, rareSpd = 0;
    if (rareBranches.thunder?.isUnlocked) {
        const tLvl = Number(rareBranches.thunder.level || 1);
        rareAtk += Math.round(tLvl * 25 * tier);
        rareCrit += Number((tLvl * 0.3).toFixed(1));
    }
    if (rareBranches.wind?.isUnlocked) {
        const wLvl = Number(rareBranches.wind.level || 1);
        rareDodge += Number((wLvl * 0.15).toFixed(1));
        rareSpd += Math.round(wLvl * 0.8);
    }
    if (rareBranches.ice?.isUnlocked) {
        const iLvl = Number(rareBranches.ice.level || 1);
        rareDef += Math.round(iLvl * 15 * tier);
        rareHp += Math.round(iLvl * 120 * tier);
    }

    // Cộng Hưởng Ngũ Hành (Resonance): Kích hoạt theo từng mốc 10 cấp
    const minPillar = Math.min(kimLvl, mocLvl, thuyLvl, hoaLvl, thoLvl);
    const resonanceTiers = Math.floor(minPillar / 10);
    const rootResonance = Math.min(0.60, (resonanceTiers * 0.05) + ((kimLvl + mocLvl + thuyLvl + hoaLvl + thoLvl) / 1000));

    // Thể Chất (Physique Training): Tôi luyện nhục thân vĩnh viễn
    const canCoState = s.canCo || {};
    const physique = canCoState.physiqueTraining || { stageIndex: 0, floor: 1 };
    const pStage = Number(physique.stageIndex || 0);
    const pFloor = Number(physique.floor || 1);
    const physiqueHp = Math.round((pStage * 1200 + pFloor * 120) * tier);
    const physiqueDef = Math.round((pStage * 150 + pFloor * 18) * tier);
    const physiqueResist = Math.min(35, pStage * 5 + Math.floor(pFloor / 2));

    // Thần Thức (Consciousness)
    const soulConsciousness = canCoState.consciousness || { level: 1 };
    const soulLevel = Number(soulConsciousness.level || 1);
    const soulDemonResist = Math.min(50, soulLevel * 3);

    // Mệnh Cách (Destiny Traits)
    let destinyAtkMult = 0, destinyDefMult = 0, destinyHpMult = 0, destinyCrit = 0, destinyDodge = 0;
    const destinySlots = canCoState.destiny?.slots || [];
    destinySlots.forEach(slot => {
        if (!slot) return;
        if (slot.id === 'thien_dao_sung_nhi' || slot.name?.includes('Thiên Đạo')) {
            destinyHpMult += 0.08;
            destinyAtkMult += 0.08;
        } else if (slot.id === 'kiem_tam_thong_minh' || slot.name?.includes('Kiếm Tâm')) {
            destinyAtkMult += 0.10;
            destinyCrit += 8;
        } else if (slot.id === 'khi_van_nghich_thien' || slot.name?.includes('Khí Vận')) {
            destinyDodge += 10;
            destinyDefMult += 0.08;
        }
    });

    // D. BUFF ĐẠO LỮ (COMPANIONS)
    let companionAtk = 0, companionDef = 0, companionHp = 0, companionCrit = 0;
    const comps = Array.isArray(s.companions) ? s.companions : (Array.isArray(rawState.companions) ? rawState.companions : []);
    comps.forEach(c => {
        if (!c) return;
        const aff = Number(c.affinity || c.level || c.affectionLevel || 0);
        if (aff > 0) {
            if (c.id === 'daolv_1' || c.name?.includes('Lục Tuyết')) {
                companionAtk += Math.round(aff * 15 * tier);
                companionCrit += Number((aff * 0.5).toFixed(1));
            } else if (c.id === 'daolv_2' || c.name?.includes('Nam Cung')) {
                companionDef += Math.round(aff * 12 * tier);
                companionHp += Math.round(aff * 80 * tier);
            } else if (c.id === 'companion_1' || c.name?.includes('Như Yên')) {
                companionAtk += Math.round(aff * 10 * tier);
                companionHp += Math.round(aff * 50 * tier);
            } else {
                companionAtk += Math.round(aff * 8 * tier);
                companionDef += Math.round(aff * 6 * tier);
                companionHp += Math.round(aff * 40 * tier);
            }
        }
    });

    // E. YÊU HỒN ĐÃ LUYỆN HÓA & TIẾN ĐỘ TRẤN YÊU THÁP
    let soulAtk = 0, soulDef = 0, soulHp = 0;
    const tower = s.demonTower || rawState.demonTower || {};
    const souls = Array.isArray(tower.capturedSouls) ? tower.capturedSouls : (Array.isArray(s.capturedSouls) ? s.capturedSouls : []);
    const clearedFloors = Math.max(0, (Number(s.towerFloor) || 1) - 1);

    soulAtk += Math.round(clearedFloors * 5 * tier) + (souls.length * 8 * tier);
    soulDef += Math.round(clearedFloors * 3 * tier) + (souls.length * 5 * tier);
    soulHp += Math.round(clearedFloors * 35 * tier) + (souls.length * 50 * tier);

    // E2. BUFF LINH THÚ XUẤT CHIẾN (DIVINE PET BUFFS & SPECIALIZATIONS)
    let petAtk = 0, petDef = 0, petHp = 0;
    let petCrit = 0, petSpd = 0, petPen = 0, petDodge = 0;
    if (s.activePet) {
        const petLvl = Math.max(1, Number(s.petLevel) || 1);
        const petTier = Math.max(1, Number(s.petTier) || 1);
        const bloodlineTiers = (typeof PET_BLOODLINE_TIERS !== 'undefined' && Array.isArray(PET_BLOODLINE_TIERS)) ? PET_BLOODLINE_TIERS : [];
        const currentBloodline = bloodlineTiers[petTier - 1] || { atkMult: 1.0, defMult: 1.0, hpMult: 1.0 };
        const bMult = currentBloodline.atkMult || 1.0;

        let basePetAtk = ((petLvl - 1) * 35 + 80) * bMult;
        let basePetDef = ((petLvl - 1) * 25 + 50) * (currentBloodline.defMult || bMult);
        let basePetHp = ((petLvl - 1) * 220 + 450) * (currentBloodline.hpMult || bMult);

        const pId = String(s.activePet).toLowerCase();
        if (pId === 'fox') {
            // Cửu Vĩ Thiên Hồ: Hộ vệ Đạo Tâm, tăng Bạo Kích & Thân Pháp
            petCrit += Math.min(15, 4 + petTier * 2);
            petDodge += Math.min(10, 2 + petTier);
            petAtk = Math.round(basePetAtk * 1.1);
            petDef = Math.round(basePetDef);
            petHp = Math.round(basePetHp);
        } else if (pId === 'dragon') {
            // Băng Lôi Giao Long: Lôi phạt cực hạn, tăng mạnh Công Kích & Phá Giáp
            petPen += Math.min(20, 5 + petTier * 3);
            petAtk = Math.round(basePetAtk * 1.4);
            petDef = Math.round(basePetDef * 0.9);
            petHp = Math.round(basePetHp * 1.05);
        } else if (pId === 'phoenix') {
            // Chu Tước Hỏa Phượng: Thần tốc phi quang, Niết Bàn sinh lực, tăng Tốc Độ Thân Pháp
            petSpd += Math.min(35, 10 + petTier * 5);
            petAtk = Math.round(basePetAtk * 1.2);
            petDef = Math.round(basePetDef * 0.95);
            petHp = Math.round(basePetHp * 1.25);
        } else if (pId === 'turtle') {
            // Huyền Minh Thần Quy: Bất động như sơn, đại lượng Phòng Ngự & Khí Huyết
            petAtk = Math.round(basePetAtk * 0.85);
            petDef = Math.round(basePetDef * 1.6);
            petHp = Math.round(basePetHp * 1.6);
        } else {
            petAtk = Math.round(basePetAtk);
            petDef = Math.round(basePetDef);
            petHp = Math.round(basePetHp);
        }
    }

    // E3. BUFF TAM ĐẠI BẢN MỆNH PHÁP BẢO (EQUIPPED NATAL ARTIFACTS & CỘNG MINH)
    let artifactAtk = 0, artifactDef = 0, artifactHp = 0;
    const artifactsList = Array.isArray(s.artifacts) ? s.artifacts : (Array.isArray(rawState.artifacts) ? rawState.artifacts : []);
    const equippedArtifacts = artifactsList.filter(art => art && art.equipped);
    const hasArtResonance = equippedArtifacts.length >= 3;
    const resonanceMultiplier = hasArtResonance ? 1.15 : 1.0;

    artifactsList.forEach(art => {
        if (!art || !art.equipped) return;
        const artLvl = Math.max(1, Number(art.level) || 1);
        const extremeMultiplier = artLvl >= 10 ? 1.2 : 1.0;
        if (art.id === 'sword' || art.slot === 'sword' || art.name?.includes('Kiếm')) {
            artifactAtk += Math.round(artLvl * 45 * tier * resonanceMultiplier * extremeMultiplier);
        } else if (art.id === 'mirror' || art.slot === 'mirror' || art.name?.includes('Kính')) {
            artifactDef += Math.round(artLvl * 35 * tier * resonanceMultiplier * extremeMultiplier);
        } else if (art.id === 'bead' || art.slot === 'bead' || art.slot === 'orb' || art.name?.includes('Châu')) {
            artifactHp += Math.round(artLvl * 250 * tier * resonanceMultiplier * extremeMultiplier);
        }
    });

    // Thuộc tính vĩnh viễn từ đan dược (Permanent Attribute Pills)
    const permBuffs = s.permanentStats || s.attributePills || {};
    const permAtk = Number(permBuffs.atk || 0);
    const permDef = Number(permBuffs.def || 0);
    const permHp = Number(permBuffs.hp || 0);

    // F. CÔNG PHÁP & TÂM PHÁP (KẾT HỢP SKILLS & EQUIPPEDSKILLS)
    let skillAtkMult = gearAtkPct / 100;
    let skillDefMult = gearDefPct / 100;
    let skillHpMult = gearHpPct / 100;

    const skillsArr = Array.isArray(s.skills) ? s.skills : (Array.isArray(rawState.skills) ? rawState.skills : []);
    const equippedSkillIds = Array.isArray(s.equippedSkills) ? s.equippedSkills : (Array.isArray(rawState.equippedSkills) ? rawState.equippedSkills : []);
    const learnedSkills = Array.isArray(s.learnedSkills) ? s.learnedSkills : (Array.isArray(rawState.learnedSkills) ? rawState.learnedSkills : []);
    const catalogSkills = (typeof SKILLS_DATA !== 'undefined' && Array.isArray(SKILLS_DATA)) ? SKILLS_DATA : [];

    skillsArr.forEach(sk => {
        if (!sk || typeof sk !== 'object') return;
        const lvl = Number(sk.level) || 1;
        if (sk.atkPercent || sk.atkMult) skillAtkMult += Number(sk.atkPercent || sk.atkMult) * lvl;
        if (sk.defPercent || sk.defMult) skillDefMult += Number(sk.defPercent || sk.defMult) * lvl;
        if (sk.hpPercent || sk.hpMult) skillHpMult += Number(sk.hpPercent || sk.hpMult) * lvl;
    });

    equippedSkillIds.forEach(skillId => {
        const tmpl = catalogSkills.find(item => item.id === skillId || item.alias === skillId || item.name === skillId);
        if (!tmpl || !tmpl.stats) return;
        const owned = learnedSkills.find(item => item.id === tmpl.id || item.id === skillId);
        const level = Number(owned?.level) || 1;
        const masteryMult = 1 + (level - 1) * 0.2;
        if (tmpl.stats.atkPercent) skillAtkMult += tmpl.stats.atkPercent * masteryMult;
        if (tmpl.stats.defPercent) skillDefMult += tmpl.stats.defPercent * masteryMult;
        if (tmpl.stats.hpPercent) skillHpMult += tmpl.stats.hpPercent * masteryMult;
    });

    // TỔNG HỢP CHỈ SỐ CUỐI CÙNG
    const resonanceMult = 1 + rootResonance;
    const totalAtkMult = (1 + skillAtkMult + destinyAtkMult) * resonanceMult;
    const totalDefMult = (1 + skillDefMult + destinyDefMult) * resonanceMult;
    const totalHpMult = (1 + skillHpMult + destinyHpMult) * resonanceMult;

    const totalAtk = Math.max(1, Math.floor((baseAtk + gearAtk + rootAtk + rareAtk + companionAtk + soulAtk + permAtk + petAtk + artifactAtk) * totalAtkMult));
    const totalDef = Math.max(0, Math.floor((baseDef + gearDef + rootDef + rareDef + physiqueDef + companionDef + soulDef + permDef + petDef + artifactDef) * totalDefMult));
    const totalHp = Math.max(10, Math.floor((baseHp + gearHp + rootHp + rareHp + physiqueHp + companionHp + soulHp + permHp + petHp + artifactHp) * totalHpMult));
    const totalMp = Math.max(10, Math.floor((baseMp + gearMp + rootMp) * resonanceMult));
    const baseCrit = 5;
    const baseSpd = 100 + tier * 15;
    const basePen = 0;
    const baseDodge = 3;
    const totalCrit = Math.min(100, Number((baseCrit + gearCrit + rootCrit + rareCrit + destinyCrit + companionCrit + petCrit).toFixed(1)));
    const totalSpd = Math.max(10, Math.round(baseSpd + rootSpd + rareSpd + petSpd));
    const totalPen = Math.min(75, Number((basePen + gearPen + rootPen + petPen).toFixed(1)));
    const totalDodge = Math.min(50, Number((baseDodge + gearDodge + rareDodge + destinyDodge + petDodge).toFixed(1)));

    // CÔNG THỨC CHIẾN LỰC (CP): CP = (Total_ATK * 2) + (Total_DEF * 1.5) + (Total_HP * 0.1)
    const cp = Math.round((totalAtk * 2) + (totalDef * 1.5) + (totalHp * 0.1));

    // LƯU VÀO STATE
    s.baseAtk = baseAtk;
    s.baseDef = baseDef;
    s.baseHp = baseHp;
    s.baseMp = baseMp;

    s.atk = totalAtk;
    s.def = totalDef;
    s.maxHp = totalHp;
    s.maxMp = totalMp;
    s.totalAtk = totalAtk;
    s.totalDef = totalDef;
    s.totalHp = totalHp;
    s.totalMp = totalMp;
    s.crit = totalCrit;
    s.armorPen = totalPen;
    s.dodge = totalDodge;
    s.speed = totalSpd;
    s.hpRegen = rootHpRegen;
    s.injuryResist = physiqueResist;
    s.demonResist = soulDemonResist;
    s.combatPower = cp;
    s.activeElement = s.activeElement || 'metal';

    if (s.hp === undefined || s.hp > totalHp) s.hp = totalHp;
    if (s.mp === undefined || s.mp > totalMp) s.mp = totalMp;

    const statsResult = {
        tier,
        tierMultiplier,
        base: { hp: baseHp, atk: baseAtk, def: baseDef, mp: baseMp },
        gear: { hp: gearHp, atk: gearAtk, def: gearDef, crit: gearCrit, equippedCount },
        roots: { hp: rootHp, atk: rootAtk, def: rootDef, crit: rootCrit, resonance: rootResonance },
        companion: { hp: companionHp, atk: companionAtk, def: companionDef, crit: companionCrit },
        souls: { hp: soulHp, atk: soulAtk, def: soulDef },
        total: { hp: totalHp, maxHp: totalHp, atk: totalAtk, def: totalDef, mp: totalMp, maxMp: totalMp, crit: totalCrit, spd: totalSpd, pen: totalPen, dodge: totalDodge },
        hp: totalHp,
        maxHp: totalHp,
        atk: totalAtk,
        def: totalDef,
        crit: totalCrit,
        spd: totalSpd,
        pen: totalPen,
        dodge: totalDodge,
        cp,
        combatPower: cp
    };

    if (typeof GameState !== 'undefined' && GameState) {
        GameState.totalStats = statsResult;
        GameState.combatPower = cp;
    }

    // ĐỒNG BỘ GIAO DIỆN CỘT TRÁI (#left-panel)
    if (typeof syncLeftPanelStatsUI === 'function') {
        syncLeftPanelStatsUI(statsResult, s);
    }

    // GỬI SANG IFRAME TRẤN YÊU THÁP
    if (typeof sendStatsToDemonTowerIframe === 'function') {
        sendStatsToDemonTowerIframe(statsResult, s);
    }

    // ĐỒNG BỘ TRỰC TIẾP SANG TRẤN YÊU THÁP (window.demonTower)
    if (typeof window !== 'undefined') {
        if (window.demonTower && typeof window.demonTower.syncStats === 'function') {
            window.demonTower.syncStats(statsResult);
        } else if (typeof window.syncTowerPlayerStats === 'function') {
            window.syncTowerPlayerStats();
        }
    }

    // LƯU VÀO LOCALSTORAGE
    if (typeof window !== 'undefined') {
        try {
            if (typeof window.saveGameState === 'function') {
                window.saveGameState();
            } else if (typeof window.saveGame === 'function') {
                window.saveGame();
            }
        } catch (_) {}
    }

    return statsResult;
}

function syncLeftPanelStatsUI(stats, s) {
    if (typeof document === 'undefined') return;
    const curHp = Math.min(stats.total.hp, Number(s.hp ?? stats.total.hp));
    const maxHp = stats.total.hp;
    const curMp = Math.min(stats.total.mp, Number(s.mp ?? stats.total.mp));
    const maxMp = stats.total.mp;
    const cp = stats.cp;

    const uiTotalCp = document.getElementById('ui-total-cp');
    if (uiTotalCp) uiTotalCp.textContent = `${cp.toLocaleString('vi-VN')} CP`;

    const age = Number(s.ageYears || 18);
    const maxAge = Number(s.lifespan || 200);
    const uiLifespanBrief = document.getElementById('ui-lifespan-brief');
    if (uiLifespanBrief) uiLifespanBrief.textContent = `${age} / ${maxAge} năm`;
    const uiLifespanText = document.getElementById('ui-lifespan-text');
    if (uiLifespanText) uiLifespanText.textContent = `${age} / ${maxAge} năm`;
    const uiLifespanBar = document.getElementById('ui-lifespan-bar');
    if (uiLifespanBar) uiLifespanBar.style.width = `${Math.min(100, Math.max(0, (age / maxAge) * 100)).toFixed(1)}%`;

    const uiHpText = document.getElementById('ui-hp-text');
    if (uiHpText) uiHpText.textContent = `${curHp.toLocaleString('vi-VN')} / ${maxHp.toLocaleString('vi-VN')}`;
    const uiHpBar = document.getElementById('ui-hp-bar');
    if (uiHpBar) uiHpBar.style.width = `${Math.min(100, Math.max(0, (curHp / maxHp) * 100)).toFixed(1)}%`;

    const uiMpText = document.getElementById('ui-mp-text');
    if (uiMpText) uiMpText.textContent = `${curMp.toLocaleString('vi-VN')} / ${maxMp.toLocaleString('vi-VN')}`;
    const uiMpBar = document.getElementById('ui-mp-bar');
    if (uiMpBar) uiMpBar.style.width = `${Math.min(100, Math.max(0, (curMp / maxMp) * 100)).toFixed(1)}%`;

    const uiStatAtk = document.getElementById('ui-stat-atk');
    if (uiStatAtk) uiStatAtk.textContent = stats.total.atk.toLocaleString('vi-VN');
    const uiStatDef = document.getElementById('ui-stat-def');
    if (uiStatDef) uiStatDef.textContent = stats.total.def.toLocaleString('vi-VN');
    const uiStatSpd = document.getElementById('ui-stat-spd');
    if (uiStatSpd) uiStatSpd.textContent = stats.total.spd.toLocaleString('vi-VN');
    const uiStatCrit = document.getElementById('ui-stat-crit');
    if (uiStatCrit) uiStatCrit.textContent = `${stats.total.crit}%`;
    const uiStatPen = document.getElementById('ui-stat-pen');
    if (uiStatPen) uiStatPen.textContent = `${stats.total.pen}%`;
    const uiStatDodge = document.getElementById('ui-stat-dodge') || document.getElementById('ui-stat-eva');
    if (uiStatDodge) uiStatDodge.textContent = `${stats.total.dodge}%`;
}

function sendStatsToDemonTowerIframe(stats, s) {
    if (typeof document === 'undefined') return;
    const iframe = document.getElementById('tran-yeu-thap-iframe');
    if (!iframe || !iframe.contentWindow) return;

    try {
        iframe.contentWindow.postMessage({
            type: 'van-thien-luc:tower-update-hero',
            data: {
                linhThach: Number(s.stones) || 0,
                tuVi: Number(s.exp) || 0,
                highestCleared: Math.max(0, (Number(s.towerFloor) || 1) - 1),
                hero: {
                    atk: stats.total.atk,
                    def: stats.total.def,
                    maxHp: stats.total.hp,
                    hp: Math.min(stats.total.hp, Number(s.hp ?? stats.total.hp)),
                    crit: stats.total.crit,
                    eva: stats.total.dodge,
                    armorPen: stats.total.pen,
                    tier: stats.tier,
                    realmIndex: Number(s.realmIndex) || 0
                }
            }
        }, '*');
    } catch (_) {}
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
    window.recalculatePlayerStats = recalculatePlayerStats;
    window.recalculateAllStats = recalculatePlayerStats;
    window.syncLeftPanelStatsUI = syncLeftPanelStatsUI;
    window.sendStatsToDemonTowerIframe = sendStatsToDemonTowerIframe;
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
        recalculatePlayerStats,
        syncLeftPanelStatsUI,
        sendStatsToDemonTowerIframe,
        calculateCP
    };
}
