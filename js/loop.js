/**
 * ============================================================================
 * FILE: js/loop.js — VÒNG LẶP TREO MÁY AN TOÀN (SAFE IDLE EVENT LOOP)
 * ============================================================================
 * Tuân thủ Trụ Cột 4:
 * - Duy nhất một setInterval (Game Tick = 1000ms) làm nhịp tim của toàn hệ thống.
 * - Thực thi tuần tự trong mỗi Tick:
 *   1. gainQi(): Tăng Tu Vi dựa trên (Base Regen + Buff Động Phủ + Buff Tông Môn).
 *   2. checkAutoHeal(): Hồi phục HP/MP tự động nếu bật Auto.
 *   3. rollRandomEvent(): Xác suất 0.5% (0.005) xảy ra "Kỳ Ngộ" hoặc "Tâm Ma".
 * - Tách biệt hoàn toàn Logic tính toán (Model) và Logic vẽ UI (View/DOM):
 *   Chỉ cập nhật DOM đối với các chỉ số thực sự biến đổi trong Tick (Dirty-check).
 * ============================================================================
 */

let _masterGameTickTimer = null;
let _lastRenderedSnapshot = {
    exp: null,
    hp: null,
    maxHp: null,
    mp: null,
    maxMp: null,
    stones: null,
    linhKhi: null,
    daoTam: null,
    realmIndex: null,
    cp: null
};

/**
 * 1. gainQi(): Tăng Tu Vi dựa trên (Base Regen + Buff Động Phủ + Buff Tông Môn)
 */
function gainQi(targetState) {
    const s = targetState || (typeof state !== 'undefined' ? state : (typeof GameState !== 'undefined' ? GameState._rawState : null));
    if (!s || s.isDead) return { gainedExp: 0, gainedLinhKhi: 0, changed: false };

    const timeScale = Number(s.timeScale) || 1;
    const realmsArr = (typeof REALMS !== 'undefined' && Array.isArray(REALMS)) ? REALMS : [];
    const currentRealm = realmsArr[s.realmIndex || 0] || { maxExp: 100, rate: 2 };

    // Nếu đang Bế Quan Tư Quá -> tịnh hóa Đạo Tâm thay vì tăng Tu Vi
    if (s.beQuanTuQua && s.beQuanTuQua.active) {
        const prevDaoTam = Number(s.daoTam ?? 100);
        const deltaDaoTam = (5 / 3600) * timeScale;
        s.daoTam = Math.min(100, prevDaoTam + deltaDaoTam);
        s.tamMa = Math.max(0, 100 - s.daoTam);
        return { gainedExp: 0, gainedLinhKhi: 0, changed: s.daoTam !== prevDaoTam };
    }

    // Tính tốc độ tu luyện: Base Regen + Buff Động Phủ (Tụ Linh Trận) + Buff Tông Môn
    const baseRegen = typeof getIdleRate === 'function'
        ? getIdleRate()
        : ((currentRealm.rate || 2) + ((s.arrayLevel || 1) - 1) * 1.5);

    // Buff Động Phủ (Linh Khí Trận Pháp)
    const caveBuffMult = 1 + Math.max(0, (Number(s.arrayLevel) || 1) - 1) * 0.15;

    // Buff Tông Môn
    let sectBuffMult = 1.0;
    if (s.playerSect === 'thanh_van') sectBuffMult = 1.05;
    else if (s.playerSect === 'tan_tu') sectBuffMult = 1.10;

    const rawGain = (typeof getIdleRate === 'function')
        ? (baseRegen * timeScale)
        : Math.round(baseRegen * caveBuffMult * sectBuffMult * timeScale);

    const prevExp = Number(s.exp) || 0;
    const prevLinhKhi = Number(s.linhKhi) || 0;

    // Tích lũy Linh Khí Động Phủ
    if (typeof getLinhKhiMax === 'function' && typeof getLinhKhiRate === 'function') {
        s.linhKhi = Math.min(getLinhKhiMax(), prevLinhKhi + getLinhKhiRate() * timeScale);
    }

    // Tăng Tu Vi qua addExp (nếu có) hoặc cộng trực tiếp (Bể chứa Tu Vi là vô hạn)
    let gainedExp = 0;
    if (typeof addExp === 'function') {
        const res = addExp(rawGain);
        gainedExp = Number(res?.gainedAmount) || 0;
    } else {
        s.exp = prevExp + rawGain;
        gainedExp = rawGain;
    }

    return {
        gainedExp,
        gainedLinhKhi: (Number(s.linhKhi) || 0) - prevLinhKhi,
        changed: s.exp !== prevExp || s.linhKhi !== prevLinhKhi
    };
}

/**
 * 2. checkAutoHeal(): Hồi phục HP/MP tự động và theo chu thiên nếu bật Auto
 */
function checkAutoHeal(targetState) {
    const s = targetState || (typeof state !== 'undefined' ? state : (typeof GameState !== 'undefined' ? GameState._rawState : null));
    if (!s || s.isDead) return { healedHp: 0, restoredMp: 0, changed: false };

    const timeScale = Number(s.timeScale) || 1;
    const eff = (typeof getEffectiveStats === 'function')
        ? getEffectiveStats()
        : ((typeof calculateTotalStats === 'function') ? calculateTotalStats(s) : { maxHp: s.maxHp || 500, maxMp: s.maxMp || 200 });

    const maxHp = Number(eff.maxHp || s.maxHp || 500);
    const maxMp = Number(eff.maxMp || s.maxMp || 200);
    const prevHp = Number(s.hp ?? maxHp);
    const prevMp = Number(s.mp ?? maxMp);

    // 2.1 Hồi phục Khí Huyết tự nhiên theo chu thiên
    const hpRegenPerSec = (typeof getHpRegenPerSec === 'function')
        ? getHpRegenPerSec(s)
        : Math.round((Number(s.hpRegenBase ?? 5)) + (maxHp * 0.01) + ((Number(s.realmStage) || 0) * 50));

    if (s.hp < maxHp) {
        s.hp = Math.min(maxHp, Math.round(s.hp + hpRegenPerSec * timeScale));
    }

    // 2.2 Hồi phục Linh Lực tự nhiên
    if (s.mp === undefined) s.mp = maxMp;
    if (s.mp < maxMp) {
        const titleRegen = maxMp * (Number(eff.mpRegenPercent) || 0);
        s.mp = Math.min(maxMp, Math.round(s.mp + (4 + titleRegen) * timeScale));
    }

    // 2.3 Vận công Auto Heal bằng Linh Lực nếu bật Auto
    const autoEnabled = s.auto ? (s.auto.enabled !== false && s.auto.heal !== false) : true;
    const mpCost = 12 * (Number(eff.mpCostMultiplier) || 1);
    if (autoEnabled && s.hp < maxHp && s.mp >= mpCost) {
        s.mp = Math.max(0, Math.round(s.mp - mpCost));
        s.hp = Math.min(maxHp, Math.round(s.hp + 25 * timeScale));
    }

    return {
        healedHp: s.hp - prevHp,
        restoredMp: s.mp - prevMp,
        changed: s.hp !== prevHp || s.mp !== prevMp
    };
}

/**
 * 3. rollRandomEvent(): Xác suất 0.5% (0.005) xảy ra "Kỳ Ngộ" hoặc "Tâm Ma"
 */
function rollRandomEvent(targetState, customRng) {
    const s = targetState || (typeof state !== 'undefined' ? state : (typeof GameState !== 'undefined' ? GameState._rawState : null));
    if (!s || s.isDead) return { triggered: false, eventType: null };

    const rand = typeof customRng === 'function' ? customRng() : Math.random();
    const EVENT_PROBABILITY = 0.005; // Đúng 0.5% xác suất mỗi Tick

    if (rand >= EVENT_PROBABILITY) {
        return { triggered: false, eventType: null };
    }

    // Phân định Kỳ Ngộ hay Tâm Ma dựa trên Đạo Tâm
    const daoTam = Number(s.daoTam ?? 100);
    const isHeartDemon = daoTam < 50 ? (Math.random() < 0.65) : (Math.random() < 0.30);

    if (isHeartDemon) {
        // Sự kiện Tâm Ma quấy nhiễu
        const lossMp = Math.max(5, Math.round((Number(s.mp) || 100) * 0.05));
        s.mp = Math.max(0, (Number(s.mp) || 0) - lossMp);
        if (typeof addLog === 'function') {
            addLog(`👁️ <span class="text-purple-400 font-bold">[Tâm Ma Quấy Nhiễu]</span> Ảo ảnh hồng trần thoáng hiện trong lúc vận công, tiêu hao <span class="text-sky-300">-${lossMp} Linh Lực</span> để trấn áp!`, 'text-purple-300', 'random-tam-ma');
        }
        return { triggered: true, eventType: 'TAM_MA', lossMp };
    } else {
        // Sự kiện Thiên Cơ Kỳ Ngộ
        const bonusStones = Math.max(5, ((Number(s.realmStage) || 0) + 1) * 10);
        s.stones = (Number(s.stones) || 0) + bonusStones;
        if (typeof document !== 'undefined') {
            const eventBtn = document.getElementById('fortuitous-event-btn');
            if (eventBtn && eventBtn.classList) {
                eventBtn.classList.remove('hidden');
                eventBtn.classList.add('flex');
            }
        }
        if (typeof addLog === 'function') {
            addLog(`✨ <span class="text-amber-300 font-bold">[Thiên Cơ Kỳ Ngộ]</span> Linh quang chợt lóe nơi động phủ, nhặt được <span class="text-amber-400 font-bold">+${bonusStones} Linh Thạch</span>!`, 'text-amber-300', 'random-ky-ngo');
        }
        return { triggered: true, eventType: 'KY_NGO', bonusStones };
    }
}

/**
 * Kiểm tra xem các chỉ số hiển thị có thay đổi so với lần render trước không (Dirty Check)
 */
function hasStateChangedForUI(s) {
    if (!s) return false;
    const totalStats = (typeof GameState !== 'undefined' && GameState.totalStats)
        ? GameState.totalStats
        : { maxHp: s.maxHp, maxMp: s.maxMp, cp: 0 };

    const nextSnap = {
        exp: Math.floor(Number(s.exp) || 0),
        hp: Math.floor(Number(s.hp) || 0),
        maxHp: Math.floor(Number(totalStats.maxHp || s.maxHp) || 0),
        mp: Math.floor(Number(s.mp) || 0),
        maxMp: Math.floor(Number(totalStats.maxMp || s.maxMp) || 0),
        stones: Math.floor(Number(s.stones) || 0),
        linhKhi: Math.floor(Number(s.linhKhi) || 0),
        daoTam: Math.floor(Number(s.daoTam ?? 100)),
        realmIndex: Number(s.realmIndex) || 0,
        cp: Math.floor(Number(totalStats.cp) || 0)
    };

    let isDirty = false;
    for (const key of Object.keys(nextSnap)) {
        if (_lastRenderedSnapshot[key] !== nextSnap[key]) {
            isDirty = true;
            _lastRenderedSnapshot[key] = nextSnap[key];
        }
    }
    return isDirty;
}

/**
 * Thực thi 1 nhịp Game Tick (1000ms):
 * Tách biệt hoàn toàn tính toán Logic (Model) và cập nhật DOM (View).
 */
function executeSafeGameTick(targetState) {
    const s = targetState || (typeof state !== 'undefined' ? state : null);
    if (!s || s.isDead) return { updatedUI: false };

    // 1. Tăng Tu Vi (Base Regen + Buff Động Phủ + Buff Tông Môn)
    const qiResult = gainQi(s);

    // 2. Hồi phục HP/MP nếu bật Auto
    const healResult = checkAutoHeal(s);

    // 3. Xác suất 0.5% xảy ra Kỳ Ngộ hoặc Tâm Ma
    const eventResult = rollRandomEvent(s);

    // Hồi phục vé Khiêu Chiến Đấu Pháp Đài (1 vé mỗi 10 phút, tối đa 5 vé)
    if (s.arenaTickets !== undefined && s.arenaTickets < 5) {
        const now = Date.now();
        if (!s.lastArenaTicketRecharge) s.lastArenaTicketRecharge = now;
        if (now - s.lastArenaTicketRecharge >= 600000) {
            s.arenaTickets = Math.min(5, (s.arenaTickets || 0) + 1);
            s.lastArenaTicketRecharge = now;
        }
    }

    // Kiểm tra chu kỳ biến chuyển Dị Tượng Thiên Địa (Celestial Omens)
    if (s.celestialOmen && s.celestialOmen.changeAt && Date.now() >= s.celestialOmen.changeAt) {
        if (typeof advanceCelestialOmen === 'function') {
            advanceCelestialOmen();
        }
    }

    // 4. Chỉ cập nhật DOM nếu dữ liệu thực sự thay đổi
    const isDirty = qiResult.changed || healResult.changed || eventResult.triggered || hasStateChangedForUI(s);
    if (isDirty && typeof updateHUD === 'function') {
        updateHUD();
    }

    return {
        qiResult,
        healResult,
        eventResult,
        updatedUI: isDirty
    };
}

/**
 * Khởi chạy vòng lặp duy nhất (1000ms), tự động hủy timer cũ để chống Memory Leak
 */
function startSafeIdleLoop(customTickFn, intervalMs = 1000) {
    if (_masterGameTickTimer !== null) {
        clearInterval(_masterGameTickTimer);
        _masterGameTickTimer = null;
    }
    const tickHandler = typeof customTickFn === 'function' ? customTickFn : executeSafeGameTick;
    _masterGameTickTimer = setInterval(tickHandler, intervalMs);
    return _masterGameTickTimer;
}

function stopSafeIdleLoop() {
    if (_masterGameTickTimer !== null) {
        clearInterval(_masterGameTickTimer);
        _masterGameTickTimer = null;
    }
}

if (typeof window !== 'undefined') {
    window.gainQi = gainQi;
    window.checkAutoHeal = checkAutoHeal;
    window.rollRandomEvent = rollRandomEvent;
    window.executeSafeGameTick = executeSafeGameTick;
    window.startSafeIdleLoop = startSafeIdleLoop;
    window.stopSafeIdleLoop = stopSafeIdleLoop;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gainQi,
        checkAutoHeal,
        rollRandomEvent,
        hasStateChangedForUI,
        executeSafeGameTick,
        startSafeIdleLoop,
        stopSafeIdleLoop
    };
}
