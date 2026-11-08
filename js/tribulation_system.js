/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG THIÊN KIẾP (HEAVENLY TRIBULATION SYSTEM)
 * ============================================================================
 * Cơ chế Sát Thương Dựa Trên Chỉ Số (Stat-check Logic):
 * - Sát thương chuẩn (Base Damage) cố định theo 5 mốc cảnh giới.
 * - Công thức: rawDamage = (config.baseDamage * boltMultiplier) - (state.def * 2.5)
 * - Đảm bảo sát thương tối thiểu (True Damage): Nếu DEF quá cao, rawDamage <= 0 thì set = Max HP * 0.05 (5% máu).
 * - Hình phạt khi thất bại:
 *   + Cưỡng Chế Phi Thăng: Đạo cơ vỡ nát, tu vi tán loạn, rớt về Nguyên Anh Sơ Kỳ (realmStage=2, level=1, currentExp=0).
 *   + Cảnh giới khác: Trừ 20% maxExp hiện tại vào currentExp (bảo toàn cảnh giới).
 * ============================================================================
 */

// 1. CẤU HÌNH THIÊN KIẾP tribConfigs (5 MỐC ĐỘT PHÁ CỐ ĐỊNH BASE DAMAGE)
var tribConfigs = {
    "TrucCo": {
        name: "Tam Đạo Lôi Kiếp",
        targetName: "Trúc Cơ",
        totalBolts: 3,
        color: "text-blue-400",
        flavor: "Phạt cốt tẩy tủy, Trúc Cơ đại thành!",
        baseDamage: 800,
        hiddenCP: 10000,
        // Compatibility aliases
        lightningColor: "text-blue-400",
        flavorText: "Phạt cốt tẩy tủy, Trúc Cơ đại thành!",
        hexColor: "#60a5fa"
    },
    "KimDan": {
        name: "Tam Đạo Lôi Kiếp",
        targetName: "Kim Đan",
        totalBolts: 3,
        color: "text-yellow-400",
        flavor: "Linh lực hóa lỏng, ngưng kết Kim Đan!",
        baseDamage: 5000,
        hiddenCP: 60000,
        lightningColor: "text-yellow-400",
        flavorText: "Linh lực hóa lỏng, ngưng kết Kim Đan!",
        hexColor: "#facc15"
    },
    "NguyenAnh": {
        name: "Tam Đạo Lôi Kiếp",
        targetName: "Nguyên Anh",
        totalBolts: 3,
        color: "text-purple-500",
        flavor: "Đan toái anh sinh, nguyên thần xuất khiếu!",
        baseDamage: 45000,
        hiddenCP: 350000,
        lightningColor: "text-purple-500",
        flavorText: "Đan toái anh sinh, nguyên thần xuất khiếu!",
        hexColor: "#a855f7"
    },
    "HoaThan": {
        name: "Tứ Đạo Lôi Kiếp",
        targetName: "Hóa Thần",
        totalBolts: 4,
        color: "text-rose-500",
        flavor: "Lĩnh ngộ thiên địa, nguyên thần hóa hư!",
        baseDamage: 500000,
        hiddenCP: 3000000,
        lightningColor: "text-rose-500",
        flavorText: "Lĩnh ngộ thiên địa, nguyên thần hóa hư!",
        hexColor: "#f43f5e"
    },
    "PhiThang": {
        name: "Cửu Đạo Thiên Kiếp",
        targetName: "Phi Thăng Tiên Giới",
        totalBolts: 9,
        color: "text-slate-100",
        flavor: "Cưỡng chế phi thăng, nghịch thiên cải mệnh!",
        baseDamage: 9999999,
        hiddenCP: 25000000,
        lightningColor: "text-slate-100",
        flavorText: "Cưỡng chế phi thăng, nghịch thiên cải mệnh!",
        hexColor: "#f8fafc"
    }
};

// Đồng bộ alias Kết Đan ➔ Kim Đan
tribConfigs["KetDan"] = tribConfigs["KimDan"];

// Export alias TRIBULATION_CONFIGS
var TRIBULATION_CONFIGS = tribConfigs;

/**
 * Trích xuất cấu hình Thiên Kiếp dựa trên tên cảnh giới hoặc đối tượng cảnh giới
 */
function getTribulationConfig(targetRealm) {
    if (!targetRealm && typeof window !== "undefined" && window.state && window.REALMS) {
        const nextRealm = window.REALMS[window.state.realmIndex + 1];
        if (nextRealm) targetRealm = nextRealm.majorRealm || nextRealm.name;
    }
    if (!targetRealm) return tribConfigs.TrucCo;

    if (typeof targetRealm === "object" && targetRealm !== null) {
        if (targetRealm.baseDamage && (targetRealm.name || targetRealm.targetName)) {
            return targetRealm;
        }
        targetRealm = targetRealm.majorRealm || targetRealm.name || targetRealm.targetName || targetRealm.target || "";
    }

    const str = String(targetRealm).trim();
    if (tribConfigs[str]) return tribConfigs[str];

    const normalized = str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

    if (normalized.includes("phithang") || normalized.includes("tiengioi") || normalized.includes("cuongche")) return tribConfigs.PhiThang;
    if (normalized.includes("hoathan") || normalized.includes("tudao")) return tribConfigs.HoaThan;
    if (normalized.includes("nguyenanh") || normalized.includes("tamcuu")) return tribConfigs.NguyenAnh;
    if (normalized.includes("kimdan") || normalized.includes("ketdan") || normalized.includes("nhicuu")) return tribConfigs.KimDan;
    if (normalized.includes("trucco") || normalized.includes("tamdao") || normalized.includes("nhatcuu")) return tribConfigs.TrucCo;

    return tribConfigs.TrucCo;
}

/**
 * Tính hệ số boltMultiplier tăng dần theo đợt sét
 * - Các đợt đầu (Bolt 1, 2...): Sát thương chỉ bằng 30%, 50%, 70% của baseDamage.
 * - Đợt cuối cùng (Final Bolt): Sát thương = 100% baseDamage.
 */
function getBoltMultiplier(currentBolt, totalBolts) {
    const cur = Math.max(1, Number(currentBolt) || 1);
    const total = Math.max(1, Number(totalBolts) || 3);

    // Đợt cuối cùng: luôn bằng 100% baseDamage
    if (cur >= total) {
        return 1.0;
    }

    // Nếu có 3 đợt (Trúc Cơ, Kim Đan, Nguyên Anh):
    if (total === 3) {
        return cur === 1 ? 0.3 : 0.5;
    }

    // Nếu có 4 đợt (Hóa Thần): 30%, 50%, 70%, 100%
    if (total === 4) {
        if (cur === 1) return 0.3;
        if (cur === 2) return 0.5;
        if (cur === 3) return 0.7;
        return 1.0;
    }

    // Nếu có 9 đợt (Phi Thăng) hoặc số đợt khác:
    // Tăng dần từ 0.3 đến 1.0
    const step = (1.0 - 0.3) / (total - 1);
    return Math.round((0.3 + (cur - 1) * step) * 100) / 100;
}

// 2. STATE QUẢN LÝ TIẾN TRÌNH THIÊN KIẾP (tribState)
var tribState = {
    inProgress: false,
    config: null,
    targetRealm: null,
    currentStrike: 1,
    totalStrikes: 3,
    hp: 1000,
    playerHp: 1000,
    maxHp: 1000,
    playerMaxHp: 1000,
    shieldHp: 0,
    maxShieldHp: 1000,
    intervalTimer: null,
    countdownTimer: null,
    nextStrikeTime: 0,
    isStriking: false,
    isParalyzed: false,
    paralyzeUntil: 0,
    charges: {
        shields: 1,
        heals: 3,
        pills: 1
    },
    healsUsedCount: 0,
    totalDamageDealt: 0,
    qte: {
        active: false,
        timer: null,
        clicksCount: 0,
        requiredClicks: 5,
        deadline: 0,
        timeLimitMs: 3000
    }
};

// Alias activeTribulationState trỏ cùng object với tribState
var activeTribulationState = tribState;

/**
 * Bắt đầu quá trình Thiên Kiếp
 * @param {string|Object} targetRealm Cảnh giới mục tiêu
 * @param {Object} [options]
 */
function startTribulation(targetRealm, options = {}) {
    const config = getTribulationConfig(targetRealm);
    const targetName = config.targetName || "Cảnh Giới Mới";

    const gState = typeof window !== "undefined" ? window.state : (typeof state !== "undefined" ? state : null);
    const effectiveStats = (typeof window !== "undefined" && typeof window.getEffectiveStats === "function")
        ? window.getEffectiveStats()
        : { maxHp: gState?.maxHp || 10000, atk: gState?.atk || 100, def: gState?.def || 50 };

    const playerMaxHp = Math.max(100, effectiveStats.maxHp || 10000);
    const initialShield = Math.round(playerMaxHp * 0.5);

    clearAllTribulationTimers();

    tribState.inProgress = true;
    tribState.config = config;
    tribState.targetRealm = targetRealm;
    tribState.currentStrike = 1;
    tribState.totalStrikes = config.totalBolts || 3;
    tribState.hp = playerMaxHp;
    tribState.playerHp = playerMaxHp;
    tribState.maxHp = playerMaxHp;
    tribState.playerMaxHp = playerMaxHp;
    tribState.shieldHp = initialShield;
    tribState.maxShieldHp = initialShield;
    tribState.totalDamageDealt = 0;
    tribState.isStriking = false;
    tribState.isParalyzed = false;
    tribState.paralyzeUntil = 0;
    tribState.healsUsedCount = 0;
    tribState.charges = {
        shields: 1,
        heals: 3,
        pills: 1
    };

    // Đồng bộ với cutsceneState nếu có
    if (typeof window !== "undefined" && window.cutsceneState) {
        window.cutsceneState.inProgress = true;
        window.cutsceneState.config = config;
        window.cutsceneState.currentStrike = 1;
        window.cutsceneState.totalBolts = config.totalBolts;
        window.cutsceneState.totalStrikes = config.totalBolts;
        window.cutsceneState.playerHp = playerMaxHp;
        window.cutsceneState.shieldHp = initialShield;
    }

    // Cơ chế Uy Áp (Heavenly Pressure): So sánh Player_CP và Tribulation_hiddenCP
    let playerCP = 0;
    if (typeof window !== "undefined" && typeof window.calculateCombatPower === "function") {
        playerCP = window.calculateCombatPower(gState);
    } else if (typeof calculateCombatPower === "function") {
        playerCP = calculateCombatPower(gState);
    } else if (typeof window !== "undefined" && typeof window.getCombatPower === "function") {
        playerCP = window.getCombatPower(gState);
    } else if (typeof getCombatPower === "function") {
        playerCP = getCombatPower(gState);
    } else if (gState) {
        const hp = Number(gState.maxHp || gState.hp || 500);
        const mp = Number(gState.maxMp || gState.mp || 200);
        const atk = Number(gState.atk || 28);
        const def = Number(gState.def || 14);
        const crit = Number(gState.crit || 5);
        const dodge = Number(gState.dodge || 5);
        playerCP = Math.round(hp * 1 + mp * 2 + atk * 15 + def * 20 + (crit + dodge) * 50 + 2525);
    }
    const hiddenCP = Number(config.hiddenCP) || 10000;

    if (playerCP < hiddenCP) {
        tribState.hasHeavenlyPressure = true;
        tribState.hasHeavenlyResistance = false;
        if (typeof window !== "undefined" && window.cutsceneState) {
            window.cutsceneState.hasHeavenlyPressure = true;
            window.cutsceneState.hasHeavenlyResistance = false;
        }
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog(`⚠️ <span class="text-rose-400 font-bold">[Thiên Đạo Uy Áp]</span> Ngươi cảm nhận được một luồng uy áp kinh khủng giáng xuống, linh lực ngưng trệ!`, "text-rose-400");
        }
    } else {
        tribState.hasHeavenlyPressure = false;
        tribState.hasHeavenlyResistance = true;
        if (typeof window !== "undefined" && window.cutsceneState) {
            window.cutsceneState.hasHeavenlyPressure = false;
            window.cutsceneState.hasHeavenlyResistance = true;
        }
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog(`⚡ <span class="text-amber-300 font-bold">[Nghịch Thiên Kình Khí]</span> Khí thế ngút trời, Nghịch Thiên Kình Khí bộc phát, ngạnh kháng thiên uy!`, "text-amber-300");
        }
    }

    if (typeof window !== "undefined" && typeof window.addLog === "function") {
        window.addLog(`🌩️ <span class="${config.color} font-bold">[${config.name} • ${targetName}]</span> Đã tiến vào Không Gian Thiên Kiếp. Nhấp [Nghênh Đón Thiên Kiếp] để khai lôi!`, "text-amber-300");
    }

    openTribulationZone(targetRealm);

    return {
        success: true,
        inProgress: true,
        totalStrikes: config.totalBolts,
        config: config
    };
}

/**
 * ============================================================================
 * KHÔNG GIAN ĐỘ KIẾP ĐỘC LẬP (DEDICATED TRIBULATION SPACE)
 * ============================================================================
 */
function openTribulationZone(targetRealm = null) {
    const zone = document.getElementById('tribulation-zone');
    if (!zone) return;

    clearAllTribulationTimers();

    const gState = typeof window !== 'undefined' ? window.state : (typeof state !== 'undefined' ? state : null);
    const realmsArr = typeof window !== 'undefined' && window.REALMS ? window.REALMS : (typeof REALMS !== 'undefined' ? REALMS : []);
    const rIdx = gState?.realmIndex || 0;
    const currentRealm = realmsArr[rIdx];
    const nextRealm = targetRealm || realmsArr[rIdx + 1] || currentRealm;
    const config = getTribulationConfig(nextRealm);

    tribState.inProgress = true;
    tribState.config = config;
    tribState.targetRealm = nextRealm;
    tribState.currentStrike = 1;
    tribState.totalStrikes = config.totalBolts || 3;
    tribState.isStriking = false;

    // 1. Mở không gian toàn màn hình
    zone.style.display = 'flex';

    // 2. Avatar nhân vật to rõ, ngồi trên mặt sân trống trải
    const avatarImg = zone.querySelector('.trib-avatar');
    if (avatarImg) {
        avatarImg.src = gState?.avatar || './assets/images/image_11.png';
    }

    // 3. Thanh HP đầy 100%
    const hpFill = document.getElementById('trib-hp-fill');
    if (hpFill) {
        hpFill.style.width = '100%';
    }

    // 4. Trạng thái bình lặng
    const statusText = document.getElementById('trib-status-text');
    if (statusText) {
        statusText.textContent = `Chuẩn bị Nghênh Chiến Lôi Kiếp [${config.targetName || 'Cảnh Giới Mới'}]!`;
        statusText.style.color = '#fef08a';
    }

    // 5. Nơi sét đánh trống rỗng hoàn toàn
    const lightningContainer = document.getElementById('lightning-strike-container');
    if (lightningContainer) {
        lightningContainer.innerHTML = '';
    }

    // 6. Nút kích hoạt sẵn sàng
    const btnNghenhChien = document.getElementById('btn-nghenh-chien');
    if (btnNghenhChien) {
        btnNghenhChien.style.display = 'block';
        btnNghenhChien.disabled = false;
        btnNghenhChien.textContent = '⚡ NGHÊNH ĐÓN THIÊN KIẾP ⚡';
    }

    // Trời vẫn yên biển lặng - tuyệt đối không giáng sét
}

function closeTribulationZone() {
    if (tribState.isStriking) {
        if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
            window.addLog('⚡ Lôi kiếp đang oanh kích đỉnh đầu, không thể tự tiện bỏ chạy!', 'text-amber-300');
        }
        return;
    }
    clearAllTribulationTimers();
    tribState.inProgress = false;
    const zone = document.getElementById('tribulation-zone');
    if (zone) zone.style.display = 'none';
}

function startLightningStrikes() {
    if (!tribState.inProgress || tribState.isStriking) return;
    tribState.isStriking = true;

    // 1. Ẩn nút kích hoạt
    const btnNghenhChien = document.getElementById('btn-nghenh-chien');
    if (btnNghenhChien) {
        btnNghenhChien.style.display = 'none';
    }

    const config = tribState.config || getTribulationConfig(tribState.targetRealm);
    const totalBolts = config.totalBolts || 3;
    tribState.totalStrikes = totalBolts;
    tribState.currentStrike = 1;

    const lightningContainer = document.getElementById('lightning-strike-container');
    const hpFill = document.getElementById('trib-hp-fill');
    const statusText = document.getElementById('trib-status-text');

    const lightningAssets = [
        './assets/images/lightning_overlay_1.png',
        './assets/images/lightning_overlay_2.png',
        './assets/images/lightning_overlay_red.png'
    ];

    let currentHpPercent = 100;
    const damagePctPerStrike = Math.round(75 / totalBolts);

    function doStrike() {
        if (tribState.currentStrike > totalBolts) {
            // Hoàn tất độ kiếp
            tribState.isStriking = false;
            tribState.inProgress = false;

            if (statusText) {
                statusText.textContent = `✨ NGHÊNH ĐÓN THIÊN KIẾP THÀNH CÔNG! ĐẠT TỚI ${config.targetName || 'CẢNH GIỚI MỚI'}! ✨`;
                statusText.style.color = '#34d399';
            }
            if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
                window.playSound('bell');
            }

            handleTribulationSuccess(config);

            setTimeout(() => {
                const zone = document.getElementById('tribulation-zone');
                if (zone) zone.style.display = 'none';
                if (btnNghenhChien) btnNghenhChien.style.display = 'block';
            }, 2500);
            return;
        }

        const strikeIndex = tribState.currentStrike;
        if (statusText) {
            statusText.textContent = `⚡ Lôi Kiếp Đạo Thứ ${strikeIndex} / ${totalBolts} Giáng Lâm!`;
            statusText.style.color = strikeIndex === totalBolts ? '#f43f5e' : '#fef08a';
        }

        // 1. Âm thanh sấm sét
        playTribulationThunderSound(strikeIndex);

        // 2. Chớp sáng toàn màn hình
        triggerScreenFlash();

        // 3. Inject tia sét lôi kiếp từ bộ 5 đạo lôi tím của Bản Tôn vào #lightning-strike-container
        if (lightningContainer) {
            lightningContainer.innerHTML = '';
            const boltIndex = ((strikeIndex - 1) % 5) + 1;
            const boltEl = document.createElement('div');
            boltEl.className = `tribulation-lightning-bolt bolt-${boltIndex}`;
            boltEl.setAttribute('role', 'img');
            boltEl.setAttribute('aria-label', `Tia Sét Lôi Kiếp Đạo #${strikeIndex}`);
            lightningContainer.appendChild(boltEl);

            setTimeout(() => {
                if (lightningContainer) lightningContainer.innerHTML = '';
            }, 420);
        }

        // 4. Trừ HP
        currentHpPercent = Math.max(15, currentHpPercent - damagePctPerStrike);
        if (hpFill) {
            hpFill.style.width = currentHpPercent + '%';
        }

        tribState.currentStrike++;
        setTimeout(doStrike, 1400);
    }

    setTimeout(doStrike, 400);
}

/**
 * Lập lịch giáng đạo lôi kiếp kế tiếp sau 2 giây
 */
function scheduleNextStrike() {
    if (!tribState.inProgress) return;

    const intervalMs = 2000;
    tribState.nextStrikeTime = Date.now() + intervalMs;

    updateCountdownUI();
    if (tribState.countdownTimer) clearInterval(tribState.countdownTimer);
    tribState.countdownTimer = setInterval(updateCountdownUI, 100);

    if (tribState.intervalTimer) clearTimeout(tribState.intervalTimer);
    tribState.intervalTimer = setTimeout(() => {
        takeLightning();
    }, intervalMs);
}

/**
 * ============================================================================
 * HÀM takeLightning(): CƠ CHẾ SÁT THƯƠNG DỰA TRÊN CHỈ SỐ (STAT-CHECK LOGIC)
 * ============================================================================
 * • Công thức: rawDamage = (config.baseDamage * boltMultiplier) - (state.def * 2.5)
 *   (Trong đó DEF của người chơi sẽ đỡ được 2.5 lần sát thương lôi kiếp).
 * • Hệ số boltMultiplier (Tăng dần theo đợt):
 *   + Các đợt đầu (Bolt 1, 2...): Sát thương = 30%, 50%, 70% của baseDamage.
 *   + Đợt cuối cùng (Final Bolt): Sát thương = 100% baseDamage.
 * • Đảm bảo sát thương tối thiểu (True Damage):
 *   + Nếu DEF quá cao, rawDamage <= 0 thì set = Max HP * 0.05 (5% máu).
 * ============================================================================
 */
function takeLightning(boltIndex = null, customConfig = null) {
    if (!tribState.inProgress && boltIndex === null) return null;
    if (tribState.isStriking) return null;
    tribState.isStriking = true;

    const config = customConfig || tribState.config || (typeof getTribulationConfig === "function" ? getTribulationConfig(tribState.targetRealm) : tribConfigs.TrucCo);
    const currentBolt = boltIndex !== null ? boltIndex : (tribState.currentStrike || 1);
    const totalBolts = config.totalBolts || 3;

    // KÍCH HOẠT HIỆU ỨNG THIÊN KIẾP LÔI KIẾP HOÀNH TRÁNG, CHỚP SÁNG TOÀN MÀN HÌNH & ÂM THANH SẤM SÉT
    triggerScreenFlash();
    playTribulationThunderSound(currentBolt);
    if (typeof document !== "undefined") {
        // 1. Dải Lôi Kiếp Hoành Tráng Quét Dọc Toàn Khung Hình Xuống Đỉnh Đầu Nhân Vật
        const massiveBolt = document.getElementById("massive-lightning-bolt");
        if (massiveBolt) {
            massiveBolt.classList.remove("hidden");
            massiveBolt.classList.remove("massive-bolt-striking");
            void massiveBolt.offsetWidth;
            massiveBolt.classList.add("massive-bolt-striking");
            setTimeout(() => {
                massiveBolt.classList.remove("massive-bolt-striking");
            }, 500);
        }

        // 2. Vệt sáng Lôi Kiếp quét dọc
        const tribBoltFx = document.getElementById("trib-bolt-fx");
        if (tribBoltFx) {
            tribBoltFx.classList.remove("animate-bolt-drop");
            void tribBoltFx.offsetWidth;
            tribBoltFx.classList.add("animate-bolt-drop");
            setTimeout(() => {
                tribBoltFx.classList.remove("animate-bolt-drop");
            }, 500);
        }

        // 3. Lottie sấm sét hỗ trợ
        const lottieBolt = document.getElementById("lottie-bolt");
        if (lottieBolt) {
            lottieBolt.classList.remove("hidden");
            if (typeof lottieBolt.seek === "function") lottieBolt.seek(0);
            if (typeof lottieBolt.play === "function") lottieBolt.play();
            setTimeout(() => {
                lottieBolt.classList.add("hidden");
            }, 700);
        }
    }
    if (typeof window !== "undefined" && typeof window.triggerSoftTribulation === "function") {
        window.triggerSoftTribulation(null, {
            strike: currentBolt,
            total: totalBolts,
            isFinal: currentBolt >= totalBolts,
            color: config.color,
            tamMa: (typeof state !== "undefined" && state?.tamMa) ? state.tamMa : 0
        });
    }

    // 1. Tính hệ số boltMultiplier (30%, 50%, 70%... đợt cuối 100%)
    const boltMultiplier = getBoltMultiplier(currentBolt, totalBolts);

    // 2. Lấy chỉ số DEF và HP của người chơi
    const gState = typeof window !== "undefined" ? window.state : (typeof state !== "undefined" ? state : null);
    const effectiveStats = (typeof window !== "undefined" && typeof window.getEffectiveStats === "function")
        ? window.getEffectiveStats()
        : { def: gState?.def || 0, maxHp: gState?.maxHp || 1000 };

    let playerDef = effectiveStats.def || gState?.def || 0;
    // Cơ chế Uy Áp (Heavenly Pressure): Nếu dính Uy Áp Thiên Đạo, giảm 20% Phòng Ngự
    const hasPressure = (tribState.hasHeavenlyPressure !== undefined)
        ? tribState.hasHeavenlyPressure
        : ((typeof calculateCombatPower === "function" ? calculateCombatPower(gState) : ((typeof window !== "undefined" && typeof window.calculateCombatPower === "function") ? window.calculateCombatPower(gState) : ((typeof getCombatPower === "function") ? getCombatPower() : 0))) < (Number(config.hiddenCP) || 10000));

    if (hasPressure) {
        playerDef = Math.round(playerDef * 0.8);
    }
    const playerMaxHp = effectiveStats.maxHp || gState?.maxHp || 1000;

    // 3. Công thức: rawDamage = (config.baseDamage * boltMultiplier) - (playerDef * 2.5)
    // Áp dụng Tâm Ma Phệ Thể: Base Damage nhân với (1 + tamMa / 100). Nếu tamMa = 100, sát thương lôi kiếp x2!
    const tamMaVal = gState ? (gState.tamMa != null ? gState.tamMa : Math.max(0, 100 - (gState.daoTam ?? 100))) : 0;
    const demonFactor = 1 + (tamMaVal / 100);
    const effectiveBaseDamage = Math.round(config.baseDamage * demonFactor);

    if (tamMaVal > 0 && currentBolt === 1) {
        const logFn = typeof window !== "undefined" && typeof window.addLog === "function" ? window.addLog : (typeof addLog === "function" ? addLog : null);
        if (logFn) {
            logFn(`⚡ <span class="text-rose-500 font-black animate-pulse">[Tâm Ma Phệ Thể]</span> Oán khí quấn thân, Thiên Đạo phẫn nộ, uy lực lôi kiếp tăng vọt! (+${tamMaVal}%)`, "text-rose-400 font-bold", "tam-ma-tribulation");
        }
    }

    let rawDamage = (effectiveBaseDamage * boltMultiplier) - (playerDef * 2.5);

    // 4. Đảm bảo sát thương tối thiểu (True Damage: 5% Max HP nếu DEF quá cao)
    let isMinimumTrueDamage = false;
    if (rawDamage <= 0) {
        rawDamage = Math.max(1, Math.round(playerMaxHp * 0.05));
        isMinimumTrueDamage = true;
    } else {
        rawDamage = Math.round(rawDamage);
    }

    // Áp dụng thêm giảm thương nếu người chơi có Công Pháp Thể Thuật
    const playerEquipped = gState?.equippedSkills || [];
    let reduction = 0;
    if (playerEquipped.includes("tt_ban_co")) reduction += 0.30;
    if (playerEquipped.includes("tt_huyen_quy")) reduction += 0.15;
    if (reduction > 0 && !isMinimumTrueDamage) {
        rawDamage = Math.max(1, Math.round(rawDamage * (1 - reduction)));
    }

    // 5. Trừ vào Hộ Thuẫn trước, sau đó mới trừ vào Khí Huyết
    let damageToShield = 0;
    let damageToHp = 0;

    if (tribState.shieldHp > 0) {
        if (tribState.shieldHp >= rawDamage) {
            tribState.shieldHp -= rawDamage;
            damageToShield = rawDamage;
            damageToHp = 0;
        } else {
            damageToShield = tribState.shieldHp;
            damageToHp = rawDamage - damageToShield;
            tribState.shieldHp = 0;
        }
    } else {
        damageToHp = rawDamage;
    }

    const calculatedHp = Math.max(0, (tribState.hp !== undefined ? tribState.hp : playerMaxHp) - damageToHp);

    // Hàm thực thi trừ máu, nổ sát thương và hiệu ứng sau khi tia sét giáng xuống
    const applyDamageResolution = () => {
        // Cập nhật HP
        tribState.hp = calculatedHp;
        tribState.playerHp = tribState.hp;
        if (gState) gState.hp = tribState.hp;

        // Đồng bộ cutsceneState
        if (typeof window !== "undefined" && window.cutsceneState) {
            window.cutsceneState.playerHp = tribState.hp;
            window.cutsceneState.shieldHp = tribState.shieldHp;
            window.cutsceneState.currentStrike = currentBolt;
        }

        tribState.totalDamageDealt += rawDamage;

        // 6. Hiệu ứng Visual, Flash & Screen Shake
        triggerScreenFlash();
        triggerScreenShake();
        spawnFloatingDamageText(rawDamage, damageToHp > 0);
        updateTribulationBarsUI();
        playTribulationThunderSound(currentBolt);

        // 7. Ghi Log chi tiết
        const boltColor = config.color || config.lightningColor || "text-amber-400";
        let logMsg = `⚡ <span class="${boltColor} font-bold">${config.name} - Đạo thứ ${currentBolt}/${totalBolts}:</span> Uy lực ${Math.round(config.baseDamage * boltMultiplier).toLocaleString('vi-VN')} (Hệ số x${boltMultiplier}). Thủ (${playerDef.toLocaleString('vi-VN')} × 2.5 = ${Math.round(playerDef * 2.5).toLocaleString('vi-VN')}) ngạnh kháng!`;
        if (isMinimumTrueDamage) {
            logMsg += ` <span class="text-amber-300 font-bold">[Ngạnh Kháng Hoàn Hảo] Thủ vượt trội lôi uy, chỉ chịu sát thương chuẩn tối thiểu 5% Max HP (-${rawDamage.toLocaleString('vi-VN')} HP)!</span>`;
        } else {
            logMsg += ` Sát thương nhận vào: <span class="text-rose-400 font-bold">-${rawDamage.toLocaleString('vi-VN')}</span>.`;
        }
        if (damageToShield > 0) logMsg += ` Hộ thuẫn đỡ ${damageToShield.toLocaleString('vi-VN')}.`;
        if (damageToHp > 0) logMsg += ` Khí huyết hao tổn ${damageToHp.toLocaleString('vi-VN')}.`;

        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog(logMsg, isMinimumTrueDamage ? "text-amber-300" : "text-rose-400");
        }

        // 8. KIỂM TRA SỐNG CÒN & HÌNH PHẠT KHI THẤT BẠI (tribState.hp <= 0)
        if (tribState.hp <= 0) {
            // Kiểm tra Công Pháp Bất Tử Trường Sinh Kinh (Tự hồi sinh 1 lần)
            if (playerEquipped.includes("tt_bat_tu") && !tribState.hasRevivedOnce) {
                tribState.hasRevivedOnce = true;
                tribState.hp = Math.round(playerMaxHp * 0.3);
                tribState.playerHp = tribState.hp;
                if (gState) gState.hp = tribState.hp;
                updateTribulationBarsUI();
                if (typeof window !== "undefined" && typeof window.addLog === "function") {
                    window.addLog(`🌿 <span class="text-emerald-400 font-extrabold">[Bất Tử Trường Sinh Kinh]</span> Niết bàn trọng sinh từ cõi chết! Khôi phục 30% Khí Huyết!`, "text-emerald-300");
                }
                continueToNextStrike();
                return;
            }

            // KÍCH HOẠT HÌNH PHẠT THẤT BẠI CHUẨN
            handleTribulationFailure(config);
            tribState.isStriking = false;
            return;
        }

        // Nếu còn sống:
        continueToNextStrike();
    };

    // Đồng bộ thời gian tia sét giáng xuống tiếp xúc khiên/nhân vật (220ms):
    // Tia sét PNG giáng xuống đỉnh đầu -> Chạm khiên nổ sát thương -> Trừ HP / Hộ Thuẫn
    setTimeout(() => {
        applyDamageResolution();
    }, 220);

    return {
        rawDamage,
        damageToHp,
        damageToShield,
        boltMultiplier,
        survived: calculatedHp > 0,
        hp: calculatedHp
    };
}

// Giữ lại hàm executeLightningStrike để tương thích ngược 100%
function executeLightningStrike() {
    return takeLightning();
}

/**
 * Chuyển sang đạo sét tiếp theo hoặc hoàn thành độ kiếp
 */
function continueToNextStrike() {
    if (tribState.currentStrike >= tribState.totalStrikes) {
        // Sống sót qua đợt lôi kiếp cuối cùng ➔ THÀNH CÔNG!
        setTimeout(() => {
            handleTribulationSuccess(tribState.config);
        }, 500);
    } else {
        tribState.currentStrike++;
        tribState.isStriking = false;
        scheduleNextStrike();
    }
}

/**
 * ============================================================================
 * 3. LOGIC HÌNH PHẠT KHI THẤT BẠI (tribState.hp <= 0)
 * ============================================================================
 * • Trường hợp Cưỡng Chế Phi Thăng (Đang độ kiếp PhiThang):
 *   + In log: "Độ kiếp Phi Thăng thất bại! Đạo cơ vỡ nát, tu vi tán loạn, rớt xuống Nguyên Anh Sơ Kỳ!" (Màu đỏ).
 *   + Đưa state cảnh giới về lại Nguyên Anh (state.realmStage = 2, state.level = 1),
 *     reset Tu Vi (state.currentExp = 0), và giảm trừ các chỉ số HP/ATK/DEF về mức Nguyên Anh.
 * • Trường hợp đột phá các cảnh giới khác:
 *   + Áp dụng hình phạt: Trừ 20% maxExp hiện tại vào currentExp (Tu vi hao tổn, bảo toàn cảnh giới).
 * ============================================================================
 */
function handleTribulationFailure(customConfig = null) {
    clearAllTribulationTimers();
    tribState.inProgress = false;
    tribState.isStriking = false;
    closeTribulationModalUI();

    const config = customConfig || tribState.config || tribConfigs.TrucCo;
    const gState = typeof window !== "undefined" ? window.state : (typeof state !== "undefined" ? state : null);
    if (!gState) return;

    const isPhiThang = Boolean(
        config.id === "PhiThang" ||
        config.targetName === "Phi Thăng Tiên Giới" ||
        config.name?.includes("Phi Thăng") ||
        (tribState.targetRealm && String(tribState.targetRealm).toLowerCase().includes("phithang"))
    );

    if (isPhiThang) {
        // In log chính xác câu chữ màu đỏ
        const phiThangFailMsg = "Độ kiếp Phi Thăng thất bại! Đạo cơ vỡ nát, tu vi tán loạn, rớt xuống Nguyên Anh Sơ Kỳ!";
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog(`⚡ <span class="text-rose-500 font-extrabold">[Thiên Phạt Cực Hạn]</span> ${phiThangFailMsg}`, "text-rose-500 font-bold");
        }

        // Đưa state cảnh giới về lại Nguyên Anh (state.realmStage = 2, state.level = 1)
        gState.realmStage = 2;
        gState.level = 1;

        // Reset Tu Vi (state.currentExp = 0)
        gState.currentExp = 0;
        gState.exp = 0;

        // Giảm trừ các chỉ số HP/ATK/DEF về mức Nguyên Anh
        const realmsArr = typeof window !== "undefined" && window.REALMS ? window.REALMS : (typeof REALMS !== "undefined" ? REALMS : []);
        let nguyenAnhIndex = realmsArr.findIndex(r => r.majorRealm === "Nguyên Anh" && (r.minorStage === "Sơ Kỳ" || r.minorIndex === 0));
        if (nguyenAnhIndex === -1) nguyenAnhIndex = 12; // Mốc index chuẩn của Nguyên Anh - Sơ Kỳ

        gState.realmIndex = nguyenAnhIndex;
        const naRealm = realmsArr[nguyenAnhIndex] || { baseHp: 1200000, baseMp: 180000, baseAtk: 120000, baseDef: 42000, attackMultiplier: 1000 };

        if (typeof window !== "undefined" && typeof window.applyRealmBaseStats === "function") {
            window.applyRealmBaseStats(naRealm);
        }

        gState.maxHp = naRealm.baseHp || 1200000;
        gState.hp = gState.maxHp;
        gState.atk = naRealm.baseAtk || (28 * (naRealm.attackMultiplier || 10));
        gState.def = naRealm.baseDef || naRealm.def || (14 * (naRealm.attackMultiplier || 10));
        if (typeof window !== "undefined" && typeof window.syncGameState === "function") {
            window.syncGameState(gState);
        }

        if (typeof window !== "undefined") {
            if (typeof window.saveGameState === "function") window.saveGameState();
            if (typeof window.updateHUD === "function") window.updateHUD();
            if (typeof window.showBreakthroughFailureModal === "function") {
                window.showBreakthroughFailureModal(config.name, config.targetName, 0, phiThangFailMsg);
            }
        }
    } else {
        // Trường hợp đột phá các cảnh giới khác:
        // Áp dụng hình phạt: Trừ 20% maxExp hiện tại vào currentExp (Tu vi hao tổn, bảo toàn cảnh giới).
        const realmsArr = typeof window !== "undefined" && window.REALMS ? window.REALMS : (typeof REALMS !== "undefined" ? REALMS : []);
        const curRealm = realmsArr[gState.realmIndex] || { maxExp: 1000, name: "Hiện Tại" };
        const penaltyExp = Math.floor((curRealm.maxExp || 1000) * 0.2);

        gState.exp = Math.max(0, (gState.exp || 0) - penaltyExp);
        if (gState.currentExp !== undefined) {
            gState.currentExp = Math.max(0, (gState.currentExp || 0) - penaltyExp);
        }

        // Bảo toàn nhân vật không bị chết hẳn
        const effectiveHp = (typeof window !== "undefined" && typeof window.getEffectiveStats === "function") ? window.getEffectiveStats().maxHp : (gState.maxHp || 1000);
        gState.hp = Math.max(1, Math.floor(effectiveHp * 0.1));

        const failMsg = `⚡ <span class="text-rose-400 font-bold">[Đột Phá Thất Bại]</span> Độ kiếp bất thành! Tu vi hao tổn 20% (-${penaltyExp.toLocaleString('vi-VN')} Tu Vi), bảo toàn cảnh giới ${curRealm.name}.`;
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog(failMsg, "text-rose-400 font-bold");
        }

        if (typeof window !== "undefined") {
            if (typeof window.saveGameState === "function") window.saveGameState();
            if (typeof window.updateHUD === "function") window.updateHUD();
            if (typeof window.showBreakthroughFailureModal === "function") {
                window.showBreakthroughFailureModal(curRealm.name, config.targetName, penaltyExp, "Tu vi hao tổn, bảo toàn cảnh giới!");
            }
        }
    }
}

/**
 * Xử lý khi Đột Phá Thành Công (Sống sót sau toàn bộ các đạo lôi kiếp)
 */
function handleTribulationSuccess(customConfig = null) {
    clearAllTribulationTimers();
    tribState.inProgress = false;
    tribState.isStriking = false;
    closeTribulationModalUI();

    const config = customConfig || tribState.config || tribConfigs.TrucCo;
    const gState = typeof window !== "undefined" ? window.state : (typeof state !== "undefined" ? state : null);
    if (!gState) return;

    const isPhiThang = Boolean(
        config.id === "PhiThang" ||
        config.targetName === "Phi Thăng Tiên Giới" ||
        config.name?.includes("Phi Thăng")
    );

    if (isPhiThang) {
        gState.currentWorld = 'TienGioi';
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog("🎉 <span class='text-gold-300 font-black'>[PHI THĂNG TIÊN GIỚI THÀNH CÔNG]</span> Cửu Đạo Thiên Kiếp đã vượt, vũ hóa đăng tiên, nghênh đón tiên quang!", "text-amber-300");
        }
        if (typeof window !== "undefined" && typeof window.completeSpatialRift === "function") {
            window.completeSpatialRift(false);
        }
        if (typeof window !== "undefined" && typeof window.updateHUD === "function") window.updateHUD();
        if (typeof window !== "undefined" && typeof window.saveGameState === "function") window.saveGameState();
        return;
    }

    const prevStats = {
        hp: gState.hp,
        maxHp: gState.maxHp,
        atk: gState.atk,
        def: gState.def
    };

    // Trừ sạch Tu Vi & thăng cấp cảnh giới
    gState.exp = 0;
    if (gState.currentExp !== undefined) gState.currentExp = 0;

    const realmsArr = typeof window !== "undefined" && window.REALMS ? window.REALMS : (typeof REALMS !== "undefined" ? REALMS : []);
    if (gState.realmIndex < realmsArr.length - 1) {
        gState.realmIndex++;
        const nextRealmObj = realmsArr[gState.realmIndex];
        if (nextRealmObj) {
            gState.maxHp = Math.max(gState.maxHp || 0, nextRealmObj.baseHp || 0);
            gState.maxMp = Math.max(gState.maxMp || 0, nextRealmObj.baseMp || 0);
            gState.atk = Math.max(gState.atk || 0, nextRealmObj.baseAtk || 0);
            gState.def = Math.max(gState.def || 0, nextRealmObj.baseDef || nextRealmObj.def || 0);
        }
        if (typeof window !== "undefined" && typeof window.applyRealmBaseStats === "function") {
            window.applyRealmBaseStats(nextRealmObj);
        }
        if (typeof window !== "undefined" && typeof window.updateCharacterModel === "function") {
            window.updateCharacterModel(nextRealmObj?.themeKey || gState.realmIndex);
        }
        if (typeof window !== "undefined" && typeof window.syncGameState === "function") {
            window.syncGameState(gState);
        }
    }

    // Hồi đầy 100% Khí Huyết
    const effectiveStats = (typeof window !== "undefined" && typeof window.getEffectiveStats === "function")
        ? window.getEffectiveStats()
        : { maxHp: gState.maxHp };
    gState.hp = effectiveStats.maxHp;

    const newRealm = realmsArr[gState.realmIndex] || { name: config.targetName };
    const newStats = {
        hp: gState.hp,
        maxHp: gState.maxHp,
        atk: gState.atk,
        def: gState.def
    };

    if (typeof window !== "undefined") {
        if (typeof window.saveGameState === "function") window.saveGameState();
        if (typeof window.updateHUD === "function") window.updateHUD();
        if (typeof window.addLog === "function") {
            window.addLog(`🎉 <span class="text-gold-300 font-black">[ĐỘ KIẾP THÀNH CÔNG]</span> Vượt qua ${config.name}! Đột phá tiến nhập <strong class="text-jade-300">${newRealm.name}</strong>! Khí huyết phục hồi viên mãn 100%!`, "text-amber-300");
        }
        if (typeof window.showMajorBreakthroughSuccessModal === "function") {
            window.showMajorBreakthroughSuccessModal(prevStats, newStats, newRealm);
        }
    }
}

/**
 * Thao tác dùng Đan Hồi Máu
 */
function useTribulationHeal() {
    if (!tribState.inProgress) return;
    if (tribState.charges.heals <= 0) {
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog("⚠️ Đã dùng hết Đan Hồi Máu trong lượt độ kiếp này (Tối đa 3 viên)!", "text-amber-300");
        }
        return;
    }

    tribState.charges.heals--;
    tribState.healsUsedCount++;

    const healPercent = Math.max(15, Math.round(35 / tribState.healsUsedCount));
    const healAmount = Math.round(tribState.playerMaxHp * (healPercent / 100));
    tribState.hp = Math.min(tribState.playerMaxHp, tribState.hp + healAmount);
    tribState.playerHp = tribState.hp;

    const gState = typeof window !== "undefined" ? window.state : (typeof state !== "undefined" ? state : null);
    if (gState) gState.hp = tribState.hp;

    updateTribulationBarsUI();
    spawnFloatingDamageText(healAmount, false, true);

    if (typeof window !== "undefined") {
        if (typeof window.playSound === "function") window.playSound("qi");
        if (typeof window.addLog === "function") {
            window.addLog(`💊 <span class="text-emerald-400 font-bold">[Đan Dược]</span> Dùng Đan Hồi Máu, hồi phục +${healAmount.toLocaleString('vi-VN')} HP (${healPercent}%)!`, "text-emerald-300");
        }
    }
}

/**
 * Thao tác dùng Phù Hộ Thuẫn
 */
function useTribulationShield() {
    if (!tribState.inProgress) return;
    if (tribState.charges.shields <= 0) {
        if (typeof window !== "undefined" && typeof window.addLog === "function") {
            window.addLog("⚠️ Đã hết Phù Hộ Thuẫn trong lượt độ kiếp này!", "text-amber-300");
        }
        return;
    }

    tribState.charges.shields--;
    const shieldAdd = Math.round(tribState.playerMaxHp * 0.5);
    tribState.shieldHp = Math.min(tribState.maxShieldHp, tribState.shieldHp + shieldAdd);

    updateTribulationBarsUI();
    if (typeof window !== "undefined") {
        if (typeof window.playSound === "function") window.playSound("bell");
        if (typeof window.addLog === "function") {
            window.addLog(`🛡️ <span class="text-cyan-300 font-bold">[Phù Hộ Thuẫn]</span> Kích hoạt trận pháp, gia cố +${shieldAdd.toLocaleString('vi-VN')} độ bền khiên chắn!`, "text-cyan-300");
        }
    }
}

/**
 * Đón sét ngay lập tức không cần chờ 2 giây
 */
function triggerNextStrikeImmediately() {
    if (!tribState.inProgress || tribState.isStriking) return;
    clearTimeout(tribState.intervalTimer);
    takeLightning();
}

/**
 * Bỏ cuộc / Rút lui khỏi thiên kiếp
 */
function abortTribulation() {
    if (!tribState.inProgress) return;
    handleTribulationFailure();
}

/* ============================================================================
   UI & VFX ENGINE HELPERS
   ============================================================================ */

function initTribulationModalUI(config) {
    const overlay = document.getElementById("tribulation-cutscene-overlay");
    if (!overlay) return;

    // DỌN RÁC TRIỆT ĐỂ: Xóa sạch vĩnh viễn Tụ Linh Trận dưới mông nhân vật
    const strayArrays = overlay.querySelectorAll('.tribulation-altar-array, .spirit-array, .spirit-array-base, .spirit-gathering-array');
    strayArrays.forEach(el => el.remove());

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    const skyBg = document.getElementById("tribulation-sky-bg");
    if (skyBg) skyBg.classList.add("clouds-moving-bg");

    const headerTitle = document.getElementById("cutscene-header-title");
    if (headerTitle) {
        headerTitle.textContent = `${config.name} • ĐỘT PHÁ: ${config.targetName}`;
    }

    renderLightningIconsRow(config.totalBolts, 1);
    updateTribulationBarsUI();

    const quoteEl = document.getElementById("cutscene-quote");
    if (quoteEl) {
        quoteEl.textContent = `"${config.flavor || config.flavorText}"`;
    }
}

function closeTribulationModalUI() {
    const overlay = document.getElementById("tribulation-cutscene-overlay");
    if (overlay) {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex");
    }
}

function renderLightningIconsRow(total, current) {
    const row = document.getElementById("lightning-icons-row");
    if (!row) return;

    let html = "";
    for (let i = 1; i <= total; i++) {
        let statusClass = "is-ready";
        if (i < current) statusClass = "is-done";
        else if (i === current) statusClass = "is-current";

        html += `<span id="trib-strike-${i}" class="trib-strike-icon ${statusClass}" title="Đạo thứ ${i}/${total}">
            <i class="fa-solid fa-bolt-lightning"></i>
        </span>`;
    }
    row.innerHTML = html;
}

function updateCountdownUI() {
    if (!tribState.inProgress) return;

    const remainingMs = Math.max(0, tribState.nextStrikeTime - Date.now());
    const secStr = (remainingMs / 1000).toFixed(1);

    const triggerBtn = document.getElementById("trigger-wave-text");
    if (triggerBtn) {
        triggerBtn.textContent = `⚡ ĐÓN LÔI KIẾP (${tribState.currentStrike}/${tribState.totalStrikes}) - ${secStr}s ⚡`;
    }
}

function updateTribulationBarsUI() {
    const hpPercent = Math.max(0, Math.min(100, Math.round((tribState.hp / tribState.maxHp) * 100)));
    const shieldPercent = tribState.maxShieldHp > 0 ? Math.max(0, Math.min(100, Math.round((tribState.shieldHp / tribState.maxShieldHp) * 100))) : 0;

    const hpBar = document.getElementById("cutscene-hp-bar");
    if (hpBar) hpBar.style.width = `${hpPercent}%`;

    const hpText = document.getElementById("cutscene-hp-text");
    if (hpText) {
        hpText.textContent = `${tribState.hp.toLocaleString('vi-VN')} / ${tribState.maxHp.toLocaleString('vi-VN')} HP (${hpPercent}%)`;
    }

    const shieldBar = document.getElementById("cutscene-shield-bar");
    if (shieldBar) shieldBar.style.width = `${shieldPercent}%`;

    const shieldText = document.getElementById("cutscene-shield-text");
    if (shieldText) {
        shieldText.textContent = `${tribState.shieldHp.toLocaleString('vi-VN')} / ${tribState.maxShieldHp.toLocaleString('vi-VN')} (${shieldPercent}%)`;
    }

    renderLightningIconsRow(tribState.totalStrikes, tribState.currentStrike);
}

function triggerScreenFlash() {
    const flash = document.getElementById("trib-screen-flash");
    if (flash) {
        flash.style.display = "block";
        flash.style.opacity = "0.95";
        setTimeout(() => {
            flash.style.opacity = "0";
            setTimeout(() => { flash.style.display = "none"; }, 250);
        }, 50);
    }
    const flashEl = document.getElementById("tribulation-screen-flash");
    if (flashEl) {
        flashEl.classList.remove("screen-flash-active");
        void flashEl.offsetWidth;
        flashEl.classList.add("screen-flash-active");
        setTimeout(() => {
            flashEl.classList.remove("screen-flash-active");
        }, 350);
    }
}

function triggerScreenShake() {
    if (typeof window !== "undefined" && typeof window.triggerSoftTribulation === 'function') {
        window.triggerSoftTribulation();
    } else if (typeof triggerSoftTribulation === 'function') {
        triggerSoftTribulation();
    }
}

function spawnFloatingDamageText(amount, isHpDamage = true, isHeal = false) {
    const container = document.getElementById("tribulation-damage-floater") || document.getElementById("tribulation-center-stage");
    if (!container) return;

    const el = document.createElement("div");
    if (isHeal) {
        el.className = "floating-damage-crimson text-emerald-400";
        el.style.color = "#34d399";
        el.textContent = `+${amount.toLocaleString('vi-VN')} HP`;
    } else {
        el.className = "floating-damage-crimson";
        el.textContent = `-${amount.toLocaleString('vi-VN')} HP`;
    }

    container.appendChild(el);
    setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
}

function playTribulationThunderSound(strikeIndex) {
    if (typeof window !== "undefined") {
        if (typeof window.playTribulationThunder === "function") {
            window.playTribulationThunder(Math.min(3, Math.ceil(strikeIndex / 3)));
        } else if (typeof window.playSound === "function") {
            window.playSound("thunder");
        }
    }
}

function clearAllTribulationTimers() {
    if (tribState.intervalTimer) clearTimeout(tribState.intervalTimer);
    if (tribState.countdownTimer) clearInterval(tribState.countdownTimer);
    tribState.isStriking = false;
}

// 4. EXPORT RA WINDOW TOÀN CỤC
if (typeof window !== "undefined") {
    window.tribConfigs = tribConfigs;
    window.tribulationConfig = tribConfigs;
    window.TRIBULATION_CONFIGS = tribConfigs;
    window.getTribulationConfig = getTribulationConfig;
    window.getBoltMultiplier = getBoltMultiplier;
    window.takeLightning = takeLightning;
    window.executeLightningStrike = executeLightningStrike;
    window.tribState = tribState;
    window.activeTribulationState = tribState;
    window.startTribulation = startTribulation;
    window.handleTribulationFailure = handleTribulationFailure;
    window.handleTribulationSuccess = handleTribulationSuccess;
    window.triggerNextStrikeImmediately = triggerNextStrikeImmediately;
    window.useTribulationHeal = useTribulationHeal;
    window.useTribulationShield = useTribulationShield;
    window.abortTribulation = abortTribulation;
    window.openTribulationZone = openTribulationZone;
    window.closeTribulationZone = closeTribulationZone;
    window.startLightningStrikes = startLightningStrikes;
}
