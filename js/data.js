if (typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = function(obj) {
        if (obj === undefined) return undefined;
        return JSON.parse(JSON.stringify(obj));
    };
}
// ==========================================
// FILE: js/data.js - Dữ liệu tiến trình M1, Bí Cảnh, Phường Thị, Đạo Lữ & State Chuẩn
// Tuân thủ nghiêm ngặt: he_thong_canh_gioi_tu_tien.md & tong_hop_chuc_nang_game_tu_tien.md
// ==========================================

// CHUẨN HÓA ASSET FALLBACK TOÀN HỆ THỐNG (Zero Network, Offline Safe, Xianxia Bagua SVG)
const DEFAULT_IMG_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100%' height='100%' fill='%230f172a'/><circle cx='50' cy='50' r='42' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-dasharray='4 2'/><circle cx='50' cy='50' r='32' fill='%231e293b' stroke='%23f59e0b' stroke-width='1.5'/><text x='50' y='57' font-size='24' text-anchor='middle' fill='%2338bdf8' font-family='sans-serif'>☯</text></svg>";
if (typeof window !== "undefined") {
    window.DEFAULT_IMG_FALLBACK = DEFAULT_IMG_FALLBACK;
}
if (typeof globalThis !== "undefined") {
    globalThis.DEFAULT_IMG_FALLBACK = DEFAULT_IMG_FALLBACK;
}

const BASE_LINH_KHI_CAPACITY = 50000;
const BASE_LINH_KHI_REGEN = 100;
if (typeof window !== "undefined") {
    window.BASE_LINH_KHI_CAPACITY = BASE_LINH_KHI_CAPACITY;
    window.BASE_LINH_KHI_REGEN = BASE_LINH_KHI_REGEN;
}
if (typeof globalThis !== "undefined") {
    globalThis.BASE_LINH_KHI_CAPACITY = BASE_LINH_KHI_CAPACITY;
    globalThis.BASE_LINH_KHI_REGEN = BASE_LINH_KHI_REGEN;
}

const CULTIVATION_BALANCE_RULES = Object.freeze({
    pacingDampener: 0.15,
    manaDivisor: 15,
    spiritRegenDivisor: 15,
    manaSkillRatio: 0.10,
    manaSkillFlatCost: 5,
    spiritCapacityBase: 50000,
    spiritCapacityPerMajor: 25000
});

// 0. CẤU HÌNH THIÊN KIẾP ĐẠI CẢNH GIỚI ĐỘNG (MAJOR TRIBULATION DYNAMIC DATA)
const tribulationConfig = {
  "TrucCo": {
    name: "Tam Đạo Lôi Kiếp",
    targetName: "Trúc Cơ",
    totalBolts: 3,
    color: "text-blue-400",
    flavor: "Phạt cốt tẩy tủy, Trúc Cơ đại thành!",
    baseDamage: 800,
    hiddenCP: 10000,
    lightningColor: "text-blue-400",
    flavorText: "Phạt cốt tẩy tủy, Trúc Cơ đại thành!"
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
    flavorText: "Linh lực hóa lỏng, ngưng kết Kim Đan!"
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
    flavorText: "Đan toái anh sinh, nguyên thần xuất khiếu!"
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
    flavorText: "Lĩnh ngộ thiên địa, nguyên thần hóa hư!"
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
    flavorText: "Cưỡng chế phi thăng, nghịch thiên cải mệnh!"
  }
};
tribulationConfig["KetDan"] = tribulationConfig["KimDan"];
var tribConfigs = tribulationConfig;
// Per-encounter support actions for the interactive Độ Kiếp scene.
const tribulationActionConfig = Object.freeze({
    recoveryCharges: 3,
    wardCharges: 1,
    recoveryPercent: 0.18,
    wardReduction: 0.5,
    nextStrikeDelayMs: 2800
});
if (typeof window !== 'undefined') {
    window.tribulationConfig = tribulationConfig;
    window.tribConfigs = tribulationConfig;
    window.tribulationActionConfig = tribulationActionConfig;
}
if (typeof globalThis !== 'undefined') {
    globalThis.tribulationConfig = tribulationConfig;
    globalThis.tribConfigs = tribulationConfig;
}

// Hàm mapping dữ liệu để UI thay đổi dựa trên target_realm
function getTribulationConfig(target_realm) {
    // Nếu target_realm đã là Config Object hợp lệ (có totalBolts & name), trả về luôn
    if (typeof target_realm === 'object' && target_realm !== null) {
        if (target_realm.totalBolts && (target_realm.name || target_realm.targetName)) {
            return target_realm;
        }
    }

    if (!target_realm && typeof state !== 'undefined' && typeof REALMS !== 'undefined') {
        const nextRealm = REALMS[state.realmIndex + 1];
        if (nextRealm) target_realm = nextRealm.majorRealm || nextRealm.name;
    }
    if (!target_realm) return tribulationConfig.TrucCo;

    if (typeof target_realm === 'object' && target_realm !== null) {
        target_realm = target_realm.majorRealm || target_realm.targetName || target_realm.target || target_realm.name || '';
    }

    const str = String(target_realm).trim();
    if (tribulationConfig[str]) return tribulationConfig[str];

    const normalized = str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();

    if (normalized.includes('phithang') || normalized.includes('tiengioi') || normalized.includes('cuongche')) return tribulationConfig.PhiThang;
    if (normalized.includes('hoathan') || normalized.includes('tudao')) return tribulationConfig.HoaThan;
    if (normalized.includes('nguyenanh') || normalized.includes('tamcuu')) return tribulationConfig.NguyenAnh;
    if (normalized.includes('kimdan') || normalized.includes('ketdan')) return tribulationConfig.KimDan;
    if (normalized.includes('trucco')) return tribulationConfig.TrucCo;

    return tribulationConfig.TrucCo;
}
window.getTribulationConfig = getTribulationConfig;

const MAJOR_TRIBULATION_CONFIGS = {
    "Trúc Cơ": {
        target: tribulationConfig.TrucCo.targetName,
        title: tribulationConfig.TrucCo.name,
        name: tribulationConfig.TrucCo.name,
        targetName: tribulationConfig.TrucCo.targetName,
        total_strikes: tribulationConfig.TrucCo.totalBolts,
        totalBolts: tribulationConfig.TrucCo.totalBolts,
        lightning_color: tribulationConfig.TrucCo.lightningColor,
        lightningColor: tribulationConfig.TrucCo.lightningColor,
        flavorText: tribulationConfig.TrucCo.flavorText,
        baseDamage: tribulationConfig.TrucCo.baseDamage,
        flash_color: "rgba(96, 165, 250, 0.9)",
        hex_color: "#60a5fa",
        glow_color: "rgba(96, 165, 250, 0.65)",
        damage_multiplier: 1.0,
        strikes_per_wave: 1
    },
    "Kim Đan": {
        target: tribulationConfig.KimDan.targetName,
        title: tribulationConfig.KimDan.name,
        name: tribulationConfig.KimDan.name,
        targetName: tribulationConfig.KimDan.targetName,
        total_strikes: tribulationConfig.KimDan.totalBolts,
        totalBolts: tribulationConfig.KimDan.totalBolts,
        lightning_color: tribulationConfig.KimDan.lightningColor,
        lightningColor: tribulationConfig.KimDan.lightningColor,
        flavorText: tribulationConfig.KimDan.flavorText,
        baseDamage: tribulationConfig.KimDan.baseDamage,
        flash_color: "rgba(250, 204, 21, 0.9)",
        hex_color: "#facc15",
        glow_color: "rgba(250, 204, 21, 0.65)",
        damage_multiplier: 2.5,
        strikes_per_wave: 1
    },
    "Nguyên Anh": {
        target: tribulationConfig.NguyenAnh.targetName,
        title: tribulationConfig.NguyenAnh.name,
        name: tribulationConfig.NguyenAnh.name,
        targetName: tribulationConfig.NguyenAnh.targetName,
        total_strikes: tribulationConfig.NguyenAnh.totalBolts,
        totalBolts: tribulationConfig.NguyenAnh.totalBolts,
        lightning_color: tribulationConfig.NguyenAnh.lightningColor,
        lightningColor: tribulationConfig.NguyenAnh.lightningColor,
        flavorText: tribulationConfig.NguyenAnh.flavorText,
        baseDamage: tribulationConfig.NguyenAnh.baseDamage,
        flash_color: "rgba(168, 85, 247, 0.9)",
        hex_color: "#a855f7",
        glow_color: "rgba(168, 85, 247, 0.65)",
        damage_multiplier: 5.0,
        strikes_per_wave: 1
    },
    "Hóa Thần": {
        target: tribulationConfig.HoaThan.targetName,
        title: tribulationConfig.HoaThan.name,
        name: tribulationConfig.HoaThan.name,
        targetName: tribulationConfig.HoaThan.targetName,
        total_strikes: tribulationConfig.HoaThan.totalBolts,
        totalBolts: tribulationConfig.HoaThan.totalBolts,
        lightning_color: tribulationConfig.HoaThan.lightningColor,
        lightningColor: tribulationConfig.HoaThan.lightningColor,
        flavorText: tribulationConfig.HoaThan.flavorText,
        baseDamage: tribulationConfig.HoaThan.baseDamage,
        flash_color: "rgba(244, 63, 94, 0.95)",
        hex_color: "#f43f5e",
        glow_color: "rgba(244, 63, 94, 0.65)",
        damage_multiplier: 15.0,
        strikes_per_wave: 1
    },
    "Phi Thăng": {
        target: tribulationConfig.PhiThang.targetName,
        title: tribulationConfig.PhiThang.name,
        name: tribulationConfig.PhiThang.name,
        targetName: tribulationConfig.PhiThang.targetName,
        total_strikes: tribulationConfig.PhiThang.totalBolts,
        totalBolts: tribulationConfig.PhiThang.totalBolts,
        lightning_color: tribulationConfig.PhiThang.lightningColor,
        lightningColor: tribulationConfig.PhiThang.lightningColor,
        flavorText: tribulationConfig.PhiThang.flavorText,
        baseDamage: tribulationConfig.PhiThang.baseDamage,
        flash_color: "rgba(255, 255, 255, 0.98)",
        hex_color: "#f8fafc",
        glow_color: "rgba(255, 255, 255, 0.8)",
        damage_multiplier: 50.0,
        strikes_per_wave: 1
    }
};
window.MAJOR_TRIBULATION_CONFIGS = MAJOR_TRIBULATION_CONFIGS;

// ĐAN DƯỢC PHỤ TRỢ ĐỘT PHÁ TIỂU CẢNH GIỚI (MINOR BREAKTHROUGH PILLS)
const MINOR_BREAKTHROUGH_PILLS = [
    { id: "pill_qi", name: "Tụ Khí Đan", bonusChance: 10, desc: "+10% Tỷ Lệ Đột Phá" },
    { id: "tay_tuy_dan", name: "Tẩy Tủy Đan", bonusChance: 15, desc: "+15% Tỷ Lệ Đột Phá" },
    { id: "dien_tho_dan", name: "Diên Thọ Đan", bonusChance: 15, desc: "+15% Tỷ Lệ Đột Phá" },
    { id: "pill_foundation", name: "Trúc Cơ Đan", bonusChance: 20, desc: "+20% Tỷ Lệ Đột Phá" },
    { id: "pill_core", name: "Kết Đan", bonusChance: 25, desc: "+25% Tỷ Lệ Đột Phá" },
    { id: "pill_nascent", name: "Hóa Anh Đan", bonusChance: 30, desc: "+30% Tỷ Lệ Đột Phá" }
];

const MAJOR_REALM_ORDER = ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần"];

// 1. TIẾN TRÌNH M1: 5 ĐẠI CẢNH GIỚI × 4 TIỂU CẢNH GIỚI (EXPONENTIAL REALM SCALING)
// Cấp bậc (Realm Tier): Luyện Khí (Tier 1: x1), Trúc Cơ (Tier 2: x10), Kim Đan (Tier 3: x100), Nguyên Anh (Tier 4: x1,000), Hóa Thần (Tier 5: x10,000)
const REALMS = [
    ...[
        {
            major: "Luyện Khí",
            tier: 1,
            tierMultiplier: 1,
            major_multiplier: 1,
            maxExp: [100, 260, 560, 1200],
            rate: [2, 2, 2, 2],
            lifespan: [150, 150, 150, 150],
            hp: [500, 750, 1100, 1600],
            atk: [35, 50, 75, 110],
            def: [15, 22, 32, 48],
            mp: [200, 280, 380, 500],
            attackMult: 1,
            baseChance: 85,
            color: "rgba(45, 212, 191, 0.35)",
            quote: "Dẫn khí nhập thể, gột rửa phàm thai...",
            pillId: "pill_foundation"
        },
        {
            major: "Trúc Cơ",
            tier: 2,
            tierMultiplier: 10,
            major_multiplier: 10,
            maxExp: [3500, 5200, 7000, 9000],
            rate: [10, 10, 10, 10],
            lifespan: [250, 250, 250, 250],
            hp: [12000, 18000, 26000, 38000],
            atk: [1200, 1800, 2600, 3800],
            def: [450, 680, 980, 1400],
            mp: [2000, 3000, 4200, 5800],
            attackMult: 10,
            baseChance: 70,
            color: "rgba(56, 189, 248, 0.45)",
            quote: "Linh dịch hóa tuyền, ngự kiếm phi hành!",
            pillId: "pill_core"
        },
        {
            major: "Kim Đan",
            tier: 3,
            tierMultiplier: 100,
            major_multiplier: 100,
            maxExp: [12000, 17000, 22000, 28000],
            rate: [50, 50, 50, 50],
            lifespan: [500, 500, 500, 500],
            hp: [120000, 180000, 260000, 380000],
            atk: [12000, 18000, 26000, 38000],
            def: [4500, 6800, 9800, 14000],
            mp: [20000, 30000, 42000, 58000],
            attackMult: 100,
            baseChance: 60,
            color: "rgba(250, 204, 21, 0.45)",
            quote: "Linh lực hóa lỏng, ngưng kết Kim Đan!",
            pillId: "pill_nascent"
        },
        {
            major: "Nguyên Anh",
            tier: 4,
            tierMultiplier: 1000,
            major_multiplier: 1000,
            maxExp: [90000, 140000, 210000, 320000],
            rate: [1200, 1900, 2700, 3800],
            lifespan: [1000, 1000, 1000, 1000],
            hp: [1200000, 1800000, 2600000, 3800000],
            atk: [120000, 180000, 260000, 380000],
            def: [45000, 68000, 98000, 140000],
            mp: [200000, 300000, 420000, 580000],
            attackMult: 1000,
            baseChance: 50,
            color: "rgba(192, 132, 252, 0.52)",
            quote: "Đan toái anh sinh, nguyên thần xuất khiếu!",
            pillId: null
        }
    ].flatMap((realm, majorIndex) => ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Viên Mãn"].map((minor, minorIndex) => {
        const nextMajor = MAJOR_REALM_ORDER[majorIndex + 1];
        const trib = minorIndex === 3 && nextMajor ? MAJOR_TRIBULATION_CONFIGS[nextMajor] : null;
        return {
            id: majorIndex * 4 + minorIndex + 1,
            name: `${realm.major} - ${minor}`,
            majorRealm: realm.major,
            minorStage: minor,
            majorIndex,
            minorIndex,
            tier: realm.tier,
            realmTier: realm.tier,
            tierMultiplier: realm.tierMultiplier,
            major_multiplier: realm.major_multiplier,
            stage: "Hạ Giới",
            maxExp: realm.maxExp[minorIndex],
            rate: realm.rate[minorIndex],
            lifespan: realm.lifespan[minorIndex],
            baseHp: realm.hp[minorIndex],
            baseAtk: realm.atk[minorIndex],
            baseDef: realm.def[minorIndex],
            baseMp: realm.mp[minorIndex],
            attackMultiplier: realm.attackMult,
            baseChance: realm.baseChance,
            isMajorBottleneck: minorIndex === 3,
            breakthroughPillId: minorIndex === 3 ? realm.pillId : null,
            tribulationType: trib ? trib.title : null,
            lightningCount: trib ? trib.total_strikes : 0,
            auraColor: realm.color,
            quote: realm.quote
        };
    }))
];

// Cảnh giới thứ 5: Hóa Thần (Tier 5 — Hệ số x10,000, máu tính bằng hàng chục triệu!)
const HOA_THAN_HP = [12000000, 18000000, 26000000, 38000000];
const HOA_THAN_ATK = [1200000, 1800000, 2600000, 3800000];
const HOA_THAN_DEF = [450000, 680000, 980000, 1400000];
const HOA_THAN_MP = [2000000, 3000000, 4200000, 5800000];
const HOA_THAN_MAX_EXP = [800000, 1500000, 3000000, 6000000];
["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ", "Viên Mãn"].forEach((minorStage, minorIndex) => REALMS.push({
    id: 17 + minorIndex,
    name: `Hóa Thần - ${minorStage}`,
    majorRealm: "Hóa Thần",
    minorStage,
    majorIndex: 4,
    minorIndex,
    tier: 5,
    realmTier: 5,
    tierMultiplier: 10000,
    major_multiplier: 10000,
    stage: "Linh Giới",
    maxExp: HOA_THAN_MAX_EXP[minorIndex],
    rate: 3800 + minorIndex * 1200,
    lifespan: 2000,
    baseHp: HOA_THAN_HP[minorIndex],
    baseAtk: HOA_THAN_ATK[minorIndex],
    baseDef: HOA_THAN_DEF[minorIndex],
    baseMp: HOA_THAN_MP[minorIndex],
    attackMultiplier: 10000,
    baseChance: 0,
    isMajorBottleneck: minorIndex === 3,
    breakthroughPillId: null,
    tribulationType: null,
    lightningCount: 0,
    auraColor: "rgba(56, 189, 248, 0.62)",
    quote: "Thiên Đạo Hạ Giới áp chế, mau tìm đường phi thăng!"
}));

if (typeof window !== "undefined") window.REALMS = REALMS;
if (typeof globalThis !== "undefined") globalThis.REALMS = REALMS;

// Theme presentation keys only; no progression or save-data behavior depends on these values.
const REALM_THEME_BY_INDEX = [
    ...Array(4).fill("luyen-khi"),
    ...Array(4).fill("truc-co"),
    ...Array(4).fill("kim-dan"),
    ...Array(4).fill("nguyen-anh"),
    ...Array(4).fill("hoa-than")
];

const HEAVENLY_REJECTION_RULES = {
    statusEffect: "thien_dao_ap_che",
    triggeringMajorRealm: "Hóa Thần",
    triggeringWorld: "M1 - Hạ Giới",
    cultivationGainMultiplier: 0.1,
    leakChanceByMinorStage: { "Trung Kỳ": 0.2, "Hậu Kỳ": 0.5, "Viên Mãn": 1 },
    tooltipMessage: "Cảnh báo: Khí tức vượt quá giới hạn Hạ Giới. Thiên Đạo đang áp chế. Lượng Tu Vi thu thập mỗi giây giảm mạnh (-90%).",
    escapeFeatureId: "tab_khong_gian_liet_phung"
};

// 2. CẢNH NỀN KHÔNG GIAN ĐA CHIỀU (thiet_ke_ui_va_prompt_tu_tien.md)
const BACKGROUNDS = [
    {
        name: "Hạ Giới Thảo Nguyên (Lofi Chill)",
        themeKey: null,
        stage: "Hạ Giới • Tiên Cảnh",
        classes: "from-slate-950 to-black",
        image: "./assets/images/bg_hagioi_co.png",
        particleColor: "#facc15",
        secondaryColor: "#38bdf8"
    },
    {
        name: "Tử Tiêu Lôi Đình Đỉnh",
        themeKey: "tu-tieu",
        stage: "Nhân Giới Cấm Địa",
        classes: "from-[#120621] via-[#1c0f36] to-[#0b0514]",
        image: "./assets/images/bg_tu_tieu_peak.jpg",
        particleColor: "#c084fc",
        secondaryColor: "#38bdf8"
    },
    {
        name: "Thanh Vân Tông",
        themeKey: "thanh-van",
        stage: "Hạ Giới Tông Môn",
        classes: "from-stone-900 via-stone-950 to-black",
        image: "./assets/images/bg_thanh_van_mat_phap.jpg",
        particleColor: "#78716c",
        secondaryColor: "#a8a29e"
    },
    {
        name: "Trấn Yêu Tháp",
        themeKey: "huyet-nguyet",
        stage: "Ma Giới Cổ Ma Tộc",
        classes: "from-[#1a050a] via-[#2b0912] to-[#0f0306]",
        image: "./assets/images/bg_demon_tower.jpg",
        particleColor: "#fb7185",
        secondaryColor: "#fbbf24"
    },
    {
        name: "Cửu Trọng Tiên Cung",
        themeKey: "tien-cung",
        stage: "Tiên Giới Thánh Địa",
        classes: "from-[#0a1128] via-[#1c1954] to-[#050817]",
        image: "./assets/images/bg_tu_tieu_peak.jpg",
        particleColor: "#38bdf8",
        secondaryColor: "#fde047"
    }
];

const XIANXIA_ASSET_PACK = {
    backgrounds: {
        rogueCave: "./assets/images/bg_ha_gioi_mat_phap.jpg",
        demonTower: "./assets/images/bg_demon_tower.jpg",
        thanhVanSect: "./assets/images/bg_thanh_van_mat_phap.jpg"
    },
    avatars: {
        loneCultivator: "./assets/images/avatar_lone_cultivator.jpg",
        heartDemon: "./assets/images/avatar_heart_demon.jpg"
    },
    items: {
        bambooSword: "./assets/images/item_bamboo_sword.jpg",
        bambooScroll: "./assets/images/item_bamboo_scroll.jpg",
        qiPillBottle: "./assets/images/item_qi_pill_bottle.jpg"
    },
    vfx: {
        baguaFormation: "./assets/images/vfx_bagua_formation.jpg",
        tribulationLightning: "./assets/images/vfx_tribulation_lightning.svg"
    }
};
if (typeof window !== "undefined") window.XIANXIA_ASSET_PACK = XIANXIA_ASSET_PACK;

// 3. BÍ CẢNH LỊCH LUYỆN & PHỤ BẢN
const DUNGEONS = [
    {
        id: 1,
        name: "Đầm Lầy Hắc Thủy",
        reqRealmIndex: 0,
        reqRealmName: "Luyện Khí",
        boss: "Hắc Thủy Huyền Xà",
        hp: 220,
        atk: 16,
        stoneReward: 80,
        expReward: 65,
        firstClearJade: 30,
        dropName: "Tử Linh Chi",
        dropId: "herb_spirit",
        icon: "fa-water",
        image: "./assets/images/bg_demon_tower.jpg",
        desc: "Đầm lầy chướng khí ngập tràn, sào huyệt của đại xà ngàn năm hút linh khí độc địa."
    },
    {
        id: 2,
        name: "Vạn Kiếm Cổ Mộ",
        reqRealmIndex: 1,
        reqRealmName: "Trúc Cơ",
        boss: "Kiếm Linh Khôi Lỗi",
        hp: 650,
        atk: 38,
        stoneReward: 220,
        expReward: 190,
        firstClearJade: 50,
        dropName: "Huyền Thiết Khoáng",
        dropId: "stone_ore",
        icon: "fa-cubes-stacked",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Vùng đất chôn vùi vạn thanh phi kiếm tàn phá, kiếm ý tàn dư sinh thành khôi lỗi thủ mộ."
    },
    {
        id: 3,
        name: "Tử Lôi Sơn Mạch",
        reqRealmIndex: 2,
        reqRealmName: "Kim Đan",
        boss: "Lôi Dực Yêu Vương",
        hp: 1900,
        atk: 95,
        stoneReward: 580,
        expReward: 520,
        firstClearJade: 80,
        dropName: "Trúc Cơ Đan",
        dropId: "pill_foundation",
        icon: "fa-bolt-lightning",
        image: "./assets/images/bg_tribulation_storm.jpg",
        desc: "Đỉnh núi quanh năm tử lôi cuồn cuộn, sào huyệt loài chimera sấm sét hung hãn xé gió."
    },
    {
        id: 4,
        name: "Trấn Ma Tháp Tầng 10",
        reqRealmIndex: 3,
        reqRealmName: "Nguyên Anh",
        boss: "Cổ Ma Thống Lĩnh",
        hp: 4800,
        atk: 190,
        stoneReward: 1600,
        expReward: 1400,
        firstClearJade: 120,
        dropName: "Bản Mệnh Pháp Bảo",
        dropId: "artifact_cauldron",
        icon: "fa-dungeon",
        image: "./assets/images/bg_demon_tower.jpg",
        desc: "Địa lao phong ấn thượng cổ ma tộc, hắc khí ngập trời làm nhiễu loạn đạo tâm người phàm."
    },
    {
        id: 5,
        name: "U Minh Huyết Hải",
        reqRealmIndex: 4,
        reqRealmName: "Hóa Thần",
        boss: "Huyết Ma Lão Tổ",
        hp: 11000,
        atk: 360,
        stoneReward: 3500,
        expReward: 3200,
        firstClearJade: 200,
        dropName: "Tẩy Tủy Đan",
        dropId: "tay_tuy_dan",
        icon: "fa-skull",
        image: "./assets/images/boss_ancient_demon.jpg",
        desc: "Biển máu vô tận tích tụ từ triệu oan hồn nghịch đạo, tiếng gầm thét xé toạc hư không."
    },
    {
        id: 6,
        name: "Thiên Hỏa Phần Cung",
        reqRealmIndex: 5,
        reqRealmName: "Luyện Hư",
        boss: "Cửu U Hỏa Phượng",
        hp: 25000,
        atk: 680,
        stoneReward: 7800,
        expReward: 7000,
        firstClearJade: 350,
        dropName: "Dị Hỏa Chủng",
        dropId: "di_hoa_chung",
        icon: "fa-fire",
        image: "./assets/images/bg_thanh_van_mat_phap.jpg",
        desc: "Cổ cung chìm trong biển lửa cực nhiệt cửu u, một giọt lửa thiêu cháy vạn dặm sơn hà."
    },
    {
        id: 7,
        name: "Cửu Thiên Tinh Vực",
        reqRealmIndex: 6,
        reqRealmName: "Hợp Thể",
        boss: "Tinh Thần Cự Thú",
        hp: 55000,
        atk: 1350,
        stoneReward: 16000,
        expReward: 15000,
        firstClearJade: 500,
        dropName: "Lôi Kiếp Dịch",
        dropId: "loi_kiep_dich",
        icon: "fa-meteor",
        image: "./assets/images/bg_tu_tieu_peak.jpg",
        desc: "Tinh hà vỡ vụn trôi dạt giữa hư vô, cự thú nuốt sao trời chấn nhiếp đại năng chư giới."
    },
    {
        id: 8,
        name: "Hỗn Độn Thái Hư Giới",
        reqRealmIndex: 7,
        reqRealmName: "Đại Thừa",
        boss: "Thái Cổ Hỗn Độn Ma Long",
        hp: 120000,
        atk: 2800,
        stoneReward: 35000,
        expReward: 32000,
        firstClearJade: 1000,
        dropName: "Biến Dị Quả",
        dropId: "bien_di_qua",
        icon: "fa-dragon",
        image: "./assets/images/avatar_heart_demon.jpg",
        desc: "Điểm tận cùng của vạn giới tu chân, rồng hỗn độn thời khai thiên tịch địa ngự trị hư vô."
    }
];

// 4. PHƯỜNG THỊ (CHỢ TU CHÂN) - 4 cửa hàng, làm mới theo thời gian thực
// Giá, trọng số và tồn kho dưới đây là giá trị cân bằng tạm thời (có thể tinh chỉnh).
// Giá cố định do người dùng chỉ định: Lôi Kiếp Dịch = 50.000, Dị Hỏa Chủng = 65.000.
const MARKET_CONFIG = {
    autoRefreshMs: 8 * 60 * 60 * 1000,   // Tự động làm mới mỗi 8 giờ thời gian thực
    manualRefreshCost: 50,               // Linh Thạch cho mỗi lần làm mới thủ công
    sellRatio: 0.2,                      // Giá thu mua = 20% giá mua gốc
    rareWeightPerRealm: 0.12,            // Mỗi bậc cảnh giới tăng trọng số hàng hiếm (theo độ hiếm)
    maxActionLog: 6
};

const MARKET_SHOPS = {
    van_bao_lau: { id: "van_bao_lau", name: "Vạn Bảo Lâu", subtitle: "Đan dược tinh luyện", icon: "fa-flask", slots: 3, theme: "jade", refreshable: true },
    tang_thu_cac: { id: "tang_thu_cac", name: "Tàng Thư Các", subtitle: "Bí kíp & công pháp", icon: "fa-book-open", slots: 2, theme: "cyan", refreshable: true },
    hac_thi: { id: "hac_thi", name: "Hắc Thị", subtitle: "Quỷ thị • hàng cấm thức tỉnh", icon: "fa-mask", slots: 2, theme: "black", refreshable: true },
    thu_mua: { id: "thu_mua", name: "Thu Mua", subtitle: "Bán tạp vật lấy Linh Thạch", icon: "fa-scale-balanced", slots: 0, theme: "amber", refreshable: false }
};

// itemId phải tồn tại trong DEFAULT_STATE.inventory (danh mục vật phẩm chuẩn).
const MARKET_ITEM_POOLS = {
    van_bao_lau: [
        { itemId: "pill_qi", price: 30, currency: "linh_thach", weight: 60, minRealmIndex: 0, stock: [3, 8] },
        { itemId: "pill_foundation", price: 300, currency: "linh_thach", weight: 25, minRealmIndex: 0, stock: [1, 3] },
        { itemId: "tay_tuy_dan", price: 800, currency: "linh_thach", weight: 15, minRealmIndex: 0, stock: [1, 2] },
        { itemId: "dien_tho_dan", price: 1500, currency: "linh_thach", weight: 10, minRealmIndex: 0, stock: [1, 2] }
    ],
    tang_thu_cac: [
        { itemId: "bi_kip_dan_khi", price: 200, currency: "linh_thach", weight: 60, minRealmIndex: 0, stock: [1, 3] },
        { itemId: "tam_phap_luyen_khi", price: 600, currency: "linh_thach", weight: 30, minRealmIndex: 0, stock: [1, 2] }
    ],
    hac_thi: [
        { itemId: "loi_kiep_dich", price: 50000, currency: "linh_thach", weight: 25, minRealmIndex: 0, stock: [1, 1], desc: "Tài liệu thức tỉnh Thiên Lôi Linh Căn." },
        { itemId: "di_hoa_chung", price: 65000, currency: "linh_thach", weight: 20, minRealmIndex: 0, stock: [1, 1], desc: "Tài liệu thức tỉnh Hỗn Độn Diệt Thế Căn." },
        { itemId: "van_nien_han_ngoc", price: 55000, currency: "linh_thach", weight: 20, minRealmIndex: 0, stock: [1, 1], desc: "Hàn ngọc vạn năm, tài liệu thức tỉnh linh căn hệ Băng." },
        { itemId: "bien_di_qua", price: 80000, currency: "linh_thach", weight: 15, minRealmIndex: 0, stock: [1, 1], desc: "Linh quả dị biến; nguyên liệu khai mở danh hiệu Dị Linh Căn." }
    ]
};

// Giá gốc dùng để tính giá Thu Mua (giá bán = 20% giá mua gốc).
const MARKET_BASE_PRICES = {
    sword_jade: 150,
    armor_cloud: 120,
    boots_wind: 150,
    ring_spirit: 300,
    talisman_jade: 200,
    artifact_cauldron: 5000,
    herb_spirit: 125,
    herb_blood: 200,
    stone_ore: 50,
    pill_core: 2500,
    pill_nascent: 6000,
    di_nguyen_thach: 20000,
    canh_kim_kiem_cot: 60000,
    van_nien_thu_tam: 60000,
    huyen_am_chan_thuy: 60000,
    hong_hoang_tuc_nhuong: 60000,
    cuu_u_han_cuc: 65000,
    cuu_tieu_cuong_phong: 65000,
    thien_dao_loi_kiep: 75000
};

// 4.05. CẤU HÌNH ĐỘNG PHỦ (CAVE DWELLING HUB - 4 CARDS)
const CAVE_HUB_RULES = {
    arrayUpgradeBaseCost: 100,
    farmExpandBaseCost: 150,
    maxFarmPlots: 8,
    alchemyUnlockRealmIndex: 0, // Mở khóa ngay từ Luyện Khí Kỳ
    forgeUnlockRealmIndex: 0,   // Mở khóa ngay từ Luyện Khí Kỳ
    seeds: [
        { herbId: "herb_spirit", herbName: "Tử Linh Chi", speed: 12, icon: "fa-leaf" },
        { herbId: "herb_blood", herbName: "Huyết Ngọc Sâm", speed: 9, icon: "fa-seedling" },
        { herbId: "herb_nguyet_hoa_thao", herbName: "Nguyệt Hoa Thảo", speed: 10, icon: "fa-seedling" },
        { herbId: "herb_sinh_co_thao", herbName: "Sinh Cơ Thảo", speed: 8, icon: "fa-spa" },
        { herbId: "herb_tinh_than_hoa", herbName: "Tinh Thần Hoa", speed: 9, icon: "fa-clover" },
        { herbId: "herb_tam_diep_lien", herbName: "Tam Diệp Liên", speed: 14, icon: "fa-leaf" },
        { herbId: "herb_tuyet_lien_ngan_nam", herbName: "Tuyết Liên", speed: 16, icon: "fa-snowflake" },
        { herbId: "herb_huyet_ma_hoa", herbName: "Huyết Ma Hoa", speed: 20, icon: "fa-cannabis" },
        { herbId: "herb_long_huyet_thao", herbName: "Long Huyết Thảo", speed: 22, icon: "fa-dragon" },
        { herbId: "herb_bo_de_tam_diep", herbName: "Bồ Đề Tâm Diệp", speed: 24, icon: "fa-tree" },
        { herbId: "herb_phuong_hoang_moc", herbName: "Phượng Hoàng Mộc", speed: 28, icon: "fa-fire" },
        { herbId: "herb_dao_tien_ngan_nam", herbName: "Thiên Sơn Tiên Đào", speed: 30, icon: "fa-apple-whole" },
        { herbId: "herb_hon_don_thanh_lien", herbName: "Hỗn Độn Thanh Liên", speed: 40, icon: "fa-sun" }
    ]
};

const ALCHEMY_RECIPES = [
    {
        id: "recipe_pill_qi",
        pillId: "pill_qi",
        name: "Tụ Khí Đan",
        desc: "+60 Tu Vi & khuếch đại tốc độ tu luyện 15s.",
        baseChance: 0.85,
        materials: [{ itemId: "herb_spirit", count: 2 }]
    },
    {
        id: "recipe_pill_foundation",
        pillId: "pill_foundation",
        name: "Trúc Cơ Đan",
        desc: "+250 Tu Vi & +25% tỷ lệ Độ Kiếp thành công.",
        baseChance: 0.70,
        materials: [{ itemId: "herb_blood", count: 2 }]
    },
    {
        id: "recipe_pill_core",
        pillId: "pill_core",
        name: "Kết Đan",
        desc: "+1.200 Tu Vi & trợ lực đột phá Kim Đan.",
        baseChance: 0.55,
        materials: [{ itemId: "herb_spirit", count: 4 }, { itemId: "herb_blood", count: 3 }]
    },
    {
        id: "recipe_dien_tho_dan",
        pillId: "dien_tho_dan",
        name: "Diên Thọ Đan",
        desc: "Tăng giới hạn Thọ Nguyên thêm +20 năm.",
        baseChance: 0.50,
        materials: [{ itemId: "herb_blood", count: 4 }, { itemId: "stone_ore", count: 2 }]
    },
    ...(typeof RECIPES_DATA !== 'undefined' ? RECIPES_DATA : (typeof window !== 'undefined' && window.RECIPES_DATA ? window.RECIPES_DATA : []))
];

const FORGE_RECIPES = [
    {
        id: "forge_sword_jade",
        targetId: "sword_jade",
        name: "Tôi Luyện Thanh Trúc Phi Kiếm",
        desc: "Cường hóa lưỡi kiếm bằng Huyền Thiết (+12 Công Kích).",
        chance: 0.85,
        stoneCost: 120,
        materials: [{ itemId: "stone_ore", count: 3 }],
        statBonus: { atk: 12 }
    },
    {
        id: "forge_armor_cloud",
        targetId: "armor_cloud",
        name: "Gia Cố Thanh Vân Đạo Bào",
        desc: "Khảm linh văn hộ thể (+10 Phòng Ngự, +120 HP).",
        chance: 0.85,
        stoneCost: 120,
        materials: [{ itemId: "stone_ore", count: 3 }, { itemId: "herb_spirit", count: 1 }],
        statBonus: { def: 10, maxHp: 120 }
    },
    {
        id: "forge_talisman_jade",
        targetId: "talisman_jade",
        name: "Tế Luyện Hộ Thân Ngọc Bội",
        desc: "Tụ linh hộ mạch (+8 Công Kích, +8 Phòng Ngự).",
        chance: 0.75,
        stoneCost: 180,
        materials: [{ itemId: "stone_ore", count: 4 }, { itemId: "herb_blood", count: 1 }],
        statBonus: { atk: 8, def: 8 }
    },
    {
        id: "forge_artifact_cauldron",
        targetId: "artifact_cauldron",
        name: "Đúc Cửu Châu Phong Lôi Đỉnh",
        desc: "Chế tác Bản Mệnh Pháp Bảo (+35 Công, +20 Thủ).",
        chance: 0.60,
        stoneCost: 500,
        materials: [{ itemId: "stone_ore", count: 8 }, { itemId: "herb_blood", count: 3 }],
        giveItem: true
    },
    // --- THẦN BINH BẢO KHỐ: RÈN ĐÚC BẢN MỆNH PHÁP BẢO & KHÍ CỤ ---
    {
        id: "forge_sword_cuu_u_huyet_nguyet",
        targetId: "sword_cuu_u_huyet_nguyet",
        name: "Luyện Huyết Nguyệt Cửu U Kiếm",
        desc: "Thiên Khí Ma Đạo (+520 Công, +12% Bạo, Hút 15% Máu).",
        chance: 0.60,
        stoneCost: 3500,
        materials: [{ itemId: "stone_ore", count: 25 }, { itemId: "herb_blood", count: 15 }],
        giveItem: true
    },
    {
        id: "forge_armor_van_cot_quy_vuong",
        targetId: "armor_van_cot_quy_vuong",
        name: "Đúc Vạn Cốt Hắc Quỷ Giáp",
        desc: "Địa Khí Ma Đạo (+180 Thủ, +2.200 HP, Phản 20% sát thương).",
        chance: 0.70,
        stoneCost: 2000,
        materials: [{ itemId: "stone_ore", count: 18 }, { itemId: "herb_blood", count: 10 }],
        giveItem: true
    },
    {
        id: "forge_boots_phong_loi_tat_hanh",
        targetId: "boots_phong_loi_tat_hanh",
        name: "Chế Phong Lôi Thuấn Hành Hài",
        desc: "Thiên Khí Thân Pháp (+95 Tốc Độ, +14% Né, Sấm sét phản đòn).",
        chance: 0.65,
        stoneCost: 2800,
        materials: [{ itemId: "stone_ore", count: 20 }, { itemId: "herb_spirit", count: 12 }],
        giveItem: true
    },
    {
        id: "forge_ring_thap_lao_ma_gioi",
        targetId: "ring_thap_lao_ma_gioi",
        name: "Luyện Thập Lao Phệ Linh Giới",
        desc: "Địa Khí Giới Chỉ (+22% Tốc Độ Tu Vi, +380 Pháp Lực).",
        chance: 0.70,
        stoneCost: 1800,
        materials: [{ itemId: "stone_ore", count: 15 }, { itemId: "herb_blood", count: 8 }],
        giveItem: true
    },
    {
        id: "forge_talisman_cuu_u_nhiep_hon",
        targetId: "talisman_cuu_u_nhiep_hon",
        name: "Khắc Cửu U Nhiếp Hồn Bội",
        desc: "Thiên Khí Hộ Phù (+140 Thủ, +1.600 HP, Huyết Thuẫn 40% HP lúc lâm nguy).",
        chance: 0.60,
        stoneCost: 3000,
        materials: [{ itemId: "stone_ore", count: 22 }, { itemId: "herb_blood", count: 12 }],
        giveItem: true
    },
    {
        id: "forge_artifact_thon_thien_ma_hu",
        targetId: "artifact_thon_thien_ma_hu",
        name: "Đúc Thôn Thiên Ma Hũ",
        desc: "Đạo Khí Viễn Cổ (+460 Công, +280 Thủ, +3.500 HP, Giảm 30% tốc đánh địch).",
        chance: 0.50,
        stoneCost: 8000,
        materials: [{ itemId: "stone_ore", count: 50 }, { itemId: "herb_blood", count: 25 }, { itemId: "herb_spirit", count: 25 }],
        giveItem: true
    },
    {
        id: "forge_sword_cuu_tieu_loi_kiem",
        targetId: "sword_cuu_tieu_loi_kiem",
        name: "Luyện Cửu Tiêu Trảm Lôi Kiếm",
        desc: "Thiên Khí Lôi Hệ (+580 Công, +15% Bạo Kích, Bạo Lôi Phá Giáp).",
        chance: 0.60,
        stoneCost: 4000,
        materials: [{ itemId: "stone_ore", count: 30 }, { itemId: "herb_spirit", count: 15 }],
        giveItem: true
    },
    {
        id: "forge_artifact_loi_dinh_van_hoa_chung",
        targetId: "artifact_loi_dinh_van_hoa_chung",
        name: "Đúc Lôi Đình Vạn Hóa Chung",
        desc: "Đạo Khí Thần Lôi (+480 Công, +260 Thủ, +3.200 HP, Triệu hoán Lôi Kiếp).",
        chance: 0.50,
        stoneCost: 9000,
        materials: [{ itemId: "stone_ore", count: 60 }, { itemId: "herb_spirit", count: 30 }],
        giveItem: true
    },
    {
        id: "forge_sword_cuu_duong_thanh_hoang",
        targetId: "sword_cuu_duong_thanh_hoang",
        name: "Đúc Cửu Dương Thánh Hoàng Kiếm",
        desc: "Tiên Khí Thái Dương (+660 Công, +16% Bạo, Chân Hỏa thiêu đốt 8% HP/hiệp).",
        chance: 0.45,
        stoneCost: 12000,
        materials: [{ itemId: "stone_ore", count: 70 }, { itemId: "herb_spirit", count: 35 }, { itemId: "herb_blood", count: 35 }],
        giveItem: true
    },
    {
        id: "forge_armor_kim_quang_thien_vu",
        targetId: "armor_kim_quang_thien_vu",
        name: "Dệt Kim Quang Thiên Vũ Bào",
        desc: "Thiên Khí Quang Minh (+240 Thủ, +3.400 HP, Khiên Quang Minh 25% HP).",
        chance: 0.60,
        stoneCost: 4500,
        materials: [{ itemId: "stone_ore", count: 28 }, { itemId: "herb_spirit", count: 20 }],
        giveItem: true
    },
    {
        id: "forge_artifact_cuu_long_than_hoa",
        targetId: "artifact_cuu_long_than_hoa",
        name: "Chế Cửu Long Thần Hỏa Tráo",
        desc: "Đạo Khí Phong Thần (+450 Công, +300 Thủ, +4.000 HP, Hỏa Long bạo kích x2).",
        chance: 0.50,
        stoneCost: 8500,
        materials: [{ itemId: "stone_ore", count: 55 }, { itemId: "herb_spirit", count: 25 }],
        giveItem: true
    },
    {
        id: "forge_weapon_ban_co_pha_thien_phu",
        targetId: "weapon_ban_co_pha_thien_phu",
        name: "Đúc Bàn Cổ Khai Thiên Phủ",
        desc: "Đạo Khí Bàn Cổ (+720 Công, Bỏ qua 40% Thủ địch, 15% Làm Choáng).",
        chance: 0.45,
        stoneCost: 11000,
        materials: [{ itemId: "stone_ore", count: 65 }, { itemId: "herb_blood", count: 30 }],
        giveItem: true
    },
    {
        id: "forge_armor_kim_cuong_bat_hoai",
        targetId: "armor_kim_cuong_bat_hoai",
        name: "Rèn Kim Cương Bất Hoại Giáp",
        desc: "Đạo Khí Địa Tâm (+360 Thủ, +5.000 HP, Giảm 25% mọi sát thương).",
        chance: 0.50,
        stoneCost: 10000,
        materials: [{ itemId: "stone_ore", count: 60 }, { itemId: "herb_spirit", count: 25 }],
        giveItem: true
    },
    {
        id: "forge_artifact_ngu_nhac_dinh_hai",
        targetId: "artifact_ngu_nhac_dinh_hai",
        name: "Đúc Ngũ Nhạc Định Hải Đỉnh",
        desc: "Đạo Khí Bát Hoang (+380 Công, +380 Thủ, +4.800 HP, Địa Chấn Choáng).",
        chance: 0.50,
        stoneCost: 9500,
        materials: [{ itemId: "stone_ore", count: 58 }, { itemId: "herb_blood", count: 28 }],
        giveItem: true
    },
    {
        id: "forge_sword_huyen_bang_tuyet_hoa",
        targetId: "sword_huyen_bang_tuyet_hoa",
        name: "Rèn Huyền Băng Tuyết Hoa Kiếm",
        desc: "Địa Khí Cực Hàn (+420 Công, +8% Bạo, 20% Đóng Băng & Làm Chậm).",
        chance: 0.70,
        stoneCost: 2200,
        materials: [{ itemId: "stone_ore", count: 16 }, { itemId: "herb_spirit", count: 10 }],
        giveItem: true
    },
    {
        id: "forge_armor_van_co_truong_sinh",
        targetId: "armor_van_co_truong_sinh",
        name: "Luyện Vạn Niên Cổ Mộc Giáp",
        desc: "Thiên Khí Mộc Hệ (+220 Thủ, +3.800 HP, Hồi 3% HP/chu thiên, +50 Năm Thọ).",
        chance: 0.60,
        stoneCost: 4200,
        materials: [{ itemId: "stone_ore", count: 25 }, { itemId: "herb_spirit", count: 20 }],
        giveItem: true
    },
    {
        id: "forge_artifact_than_nong_tu_duoc",
        targetId: "artifact_than_nong_tu_duoc",
        name: "Đúc Thần Nông Tụ Dược Đỉnh",
        desc: "Thiên Khí Thần Nông (+340 Công, +240 Thủ, +3.600 HP, +40% Tỷ lệ luyện đan).",
        chance: 0.60,
        stoneCost: 4000,
        materials: [{ itemId: "stone_ore", count: 24 }, { itemId: "herb_spirit", count: 18 }, { itemId: "herb_blood", count: 12 }],
        giveItem: true
    }
];

// 4.1. LINH CĂN BẢN MỆNH & NGŨ HÀNH LINH TRỤ
const SPIRITUAL_ROOT_TIERS = {
    mortal: { id: "mortal", name: "Tạp Linh Căn", color: "#94a3b8", cultivationMult: 1, breakthroughBonus: 0, tribulationResist: 0, tribulationDamageMult: 1, tribulationRewardMult: 1 },
    earth: { id: "earth", name: "Chân Linh Căn", color: "#38bdf8", cultivationMult: 1.35, breakthroughBonus: 5, tribulationResist: 5, tribulationDamageMult: 1, tribulationRewardMult: 1 },
    heaven: { id: "heaven", name: "Thiên Phẩm", color: "#c084fc", cultivationMult: 1.85, breakthroughBonus: 12, tribulationResist: 12, tribulationDamageMult: 2, tribulationRewardMult: 2 },
    mutant: { id: "mutant", name: "Dị Phẩm", color: "#a855f7", secondaryColor: "#22d3ee", cultivationMult: 2.4, breakthroughBonus: 18, tribulationResist: 25, tribulationDamageMult: 3, tribulationRewardMult: 5 },
    immortal: { id: "immortal", name: "Tiên Phẩm", color: "#fbbf24", cultivationMult: 3.25, breakthroughBonus: 25, tribulationResist: 35 },
    chaos: { id: "chaos", name: "Hỗn Độn Chí Tôn", color: "#f43f5e", cultivationMult: 5, breakthroughBonus: 40, tribulationResist: 50 }
};

const PHYSIQUES = {
    mortal: { id: "mortal", name: "Phàm Thể", tribulationDamageMult: 1, tribulationRewardMult: 1, bodyShield: 0 },
    spirit: { id: "spirit", name: "Linh Thể", tribulationDamageMult: 1, tribulationRewardMult: 1, bodyShield: 0.08 },
    immortal: { id: "immortal", name: "Tiên Thể", tribulationDamageMult: 2, tribulationRewardMult: 2, bodyShield: 0.16 },
    sacred: { id: "sacred", name: "Thần/Thánh Thể", tribulationDamageMult: 3, tribulationRewardMult: 5, bodyShield: 0.25 }
};

const APTITUDES = {
    dull: { id: "dull", name: "Ngu Độn", heartDemonResistance: "Thấp", enlightenment: false },
    balanced: { id: "balanced", name: "Trung Dung", heartDemonResistance: "Trung bình", enlightenment: false },
    genius: { id: "genius", name: "Thiên Tài", heartDemonResistance: "Cao", enlightenment: true },
    dao_child: { id: "dao_child", name: "Đạo Tử", heartDemonResistance: "Cực cao", enlightenment: true }
};

const M1_SYSTEM_RULES = {
    secondsPerYearOnline: 900,
    secondsPerYearOffline: 1800,
    lifeExtensionItems: { dien_tho_dan: 20 },
    testerTimeScale: 1,
    spiritPoolCapacitySource: "realm.maxExp",
    spiritGenerationArrayBonusPerLevel: 0.25,
    minorBreakthroughSuccessRate: 1,
    majorFailureExpRetention: 0.75,
    nascentSoulLightningCount: 27,
    heavenlyPunishment: {
        purificationBenefit: false,
        lifespanLoss: 1,
        remainingHpRatio: 0.1
    }
};

// Cây mở khóa M1. Mọi consumer (UI và JSON backend) phải đọc cùng bảng này.
const FEATURE_UNLOCKS = {
    btn_dong_phu: { minRealmIndex: 0, group: "tu_luyen" },
    btn_tui_do: { minRealmIndex: 0, group: "tu_luyen" },
    btn_linh_ngo: { minRealmIndex: 0, group: "tu_luyen" },
    btn_dot_pha: { minRealmIndex: 0, group: "tu_luyen", requiresFullBottleneck: true },
    btn_phuong_thi: { minRealmIndex: 0, group: "san_xuat" },
    btn_linh_dien: { minRealmIndex: 0, group: "san_xuat" },
    btn_lo_dan: { minRealmIndex: 0, group: "san_xuat" },
    btn_lich_luyen: { minRealmIndex: 0, group: "the_gioi" },
    btn_tong_mon: { minRealmIndex: 0, group: "the_gioi" },
    btn_bi_canh: { minRealmIndex: 0, group: "the_gioi" },
    btn_linh_thu: { minRealmIndex: 0, group: "nhan_sinh" },
    btn_phap_bao_ban_menh: { minRealmIndex: 0, group: "nhan_sinh" },
    btn_dao_lu: { minRealmIndex: 0, group: "nhan_sinh" },
    btn_phi_thang: { minRealmIndex: Number.POSITIVE_INFINITY, group: "the_gioi" }
};

const QI_REFINING_RULES = {
    minLevel: 1,
    maxLevel: 10,
    lowMpThreshold: 10,
    features: {
        btn_chu_thien: { defaultUnlocked: true },
        btn_tap_dich: { defaultUnlocked: true },
        btn_tu_linh_tran: { minLevel: 1, defaultUnlocked: true, stoneCost: 0 },
        btn_hoa_phu: { defaultUnlocked: true },
        btn_luyen_dan: { defaultUnlocked: true },
        btn_luyen_khi: { defaultUnlocked: true },
        btn_phuong_thi: { defaultUnlocked: true },
        btn_tong_mon: { minLevel: 1, defaultUnlocked: true },
        btn_huyet_sac_cam_dia: { minLevel: 1, defaultUnlocked: true },
        btn_lich_luyen: { defaultUnlocked: true }
    },
    talismanPriority: ["Thần Hành Phù", "Hỏa Cầu Phù", "Khinh Công Phù"],
    talismanRecipes: {
        "Hỏa Cầu Phù": { outputQty: 2, mpCost: 10, hpCost: null, materials: { "Chu Sa": 1 } },
        "Khinh Công Phù": { outputQty: null, mpCost: null, hpCost: null, materials: { "Chu Sa": null } },
        "Thần Hành Phù": { outputQty: null, mpCost: null, hpCost: null, materials: { "Chu Sa": null } }
    },
    laborRewards: {
        don_cui: { item: "Mộc Tài", qty: null },
        dao_khoang: { items: [{ item: "Hắc Thiết", qty: null }, { item: "Linh Thạch Phế", qty: null }] }
    }
};

const M1_NESTED_FEATURES = {
    tab_chu_thien: { minRank: 1, hub: "cave", farming: true },
    tab_lich_luyen: { minRank: 1, hub: "world", farming: true },
    tab_tui_do: { minRank: 1, hub: "character" },
    tab_phuong_thi: { minRank: 1, hub: "world" },
    tab_tong_mon: { minRank: 1, hub: "world" },
    tab_hoa_phu: { minRank: 1, hub: "character" },
    tab_can_co: { minRank: 1, hub: "character" },
    tab_bi_canh: { minRank: 1, hub: "world", farming: true },
    tab_dan_cac: { minRank: 1, hub: "cave", farming: true },
    tab_linh_dien: { minRank: 1, hub: "cave", farming: true },
    tab_khi_cac: { minRank: 1, hub: "cave", farming: true },
    tab_tu_linh_tran: { minRank: 1, hub: "cave", farming: true },
    tab_linh_thu: { minRank: 1, hub: "character" },
    tab_auto_bot: { minRank: 1, hub: "cave" },
    tab_phap_bao: { minRank: 1, hub: "character" },
    tab_dau_phap_dai: { minRank: 1, hub: "world" },
    tab_dau_gia: { minRank: 1, hub: "world" },
    tab_dao_lu: { minRank: 1, hub: "character" },
    tab_phan_than: { minRank: 1, hub: "character" },
    tab_chuong_mon: { minRank: 1, hub: "world" },
    tab_thien_kiep_dai: { minRank: 1, hub: "world" },
    tab_khong_gian_liet_phung: { statusEffect: "thien_dao_ap_che", hub: "world" }
};

const SPIRITUAL_ROOTS = {
    none_body: { id: "none_body", name: "Vô Linh Căn • Luyện Thể", tier: "mortal", element: "neutral", primaryColor: "#78716c", secondaryColor: "#ef4444", description: "Không thể dẫn linh nhập thể, chỉ dùng nhục thân phàm tục đối kháng thiên uy.", special: "Độ kiếp Luyện Thể khó gấp 10.000 lần.", bodyCultivator: true },
    mortal_mixed: { id: "mortal_mixed", name: "Ngũ Hành Tạp Linh Căn", tier: "mortal", element: "neutral", primaryColor: "#94a3b8", secondaryColor: "#cbd5e1", description: "Linh khí năm hệ xung đột trong kinh mạch, đường tu tiên gian nan vạn phần.", special: "Không có hiệu ứng đặc biệt." },
    heaven_kim: { id: "heaven_kim", name: "Thiên Kim Linh Căn", tier: "heaven", element: "metal", primaryColor: "#f8fafc", secondaryColor: "#eab308", description: "Kim linh khí thuần khiết, sắc bén như tiên kiếm.", special: "+30% hiệu quả Kim Trụ và +25% uy lực công pháp hệ Kim." },
    heaven_moc: { id: "heaven_moc", name: "Thiên Mộc Linh Căn", tier: "heaven", element: "wood", primaryColor: "#4ade80", secondaryColor: "#bbf7d0", description: "Mộc linh khí sinh sôi bất tận, dưỡng mạch trường sinh.", special: "+30% hiệu quả Mộc Trụ và +25% uy lực công pháp hệ Mộc." },
    heaven_thuy: { id: "heaven_thuy", name: "Thiên Thủy Linh Căn", tier: "heaven", element: "water", primaryColor: "#38bdf8", secondaryColor: "#bae6fd", description: "Thủy linh khí miên man, chu thiên vận chuyển không dứt.", special: "+30% hiệu quả Thủy Trụ và +25% uy lực công pháp hệ Thủy." },
    heaven_hoa: { id: "heaven_hoa", name: "Thiên Hỏa Linh Căn", tier: "heaven", element: "fire", primaryColor: "#f87171", secondaryColor: "#fdba74", description: "Hỏa linh khí cuồn cuộn, luyện vạn vật thành chân.", special: "+30% hiệu quả Hỏa Trụ và +25% uy lực công pháp hệ Hỏa." },
    heaven_tho: { id: "heaven_tho", name: "Thiên Thổ Linh Căn", tier: "heaven", element: "earth", primaryColor: "#d97706", secondaryColor: "#fde68a", description: "Thổ linh khí hậu trọng, chở che vạn pháp.", special: "+30% hiệu quả Thổ Trụ và +25% uy lực công pháp hệ Thổ." },
    mutant_ice: { id: "mutant_ice", name: "Băng Linh Căn", tier: "mutant", element: "water", primaryColor: "#a5f3fc", secondaryColor: "#e0f2fe", description: "Kim Thủy giao hòa, hàn khí ngưng kết đạo tâm.", special: "Miễn nhiễm Tẩu Hỏa Nhập Ma; 15% tỷ lệ gây Hàn Băng.", requirements: { water: 15, metal: 10 } },
    mutant_thunder: { id: "mutant_thunder", name: "Thiên Lôi Linh Căn", tier: "mutant", element: "thunder", primaryColor: "#c084fc", secondaryColor: "#38bdf8", description: "Thân mang Cửu Tiêu Thần Lôi, dùng lôi điện rèn kim thân, khắc tinh của vạn tà và thiên kiếp.", special: "+35% uy lực Lôi/Kiếm; giảm 25% sát thương Lôi Kiếp; chuyển 10% sát thương thành Tu Vi khi thành công.", requirements: { metal: 20, fire: 20 } },
    chaos_origin: { id: "chaos_origin", name: "Hỗn Độn Hồng Mông Linh Căn", tier: "chaos", element: "chaos", primaryColor: "#f43f5e", secondaryColor: "#fbbf24", colors: ["#f8fafc", "#4ade80", "#38bdf8", "#f87171", "#d97706"], description: "Vạn pháp quy nhất, ngũ hành tương sinh hóa thành Hỗn Độn sơ khai.", special: "Toàn bộ chỉ số cơ bản +50%; tương thích mọi công pháp 100%.", requirements: { allPillars: 50, minRealmIndex: 7 } }
};

const ELEMENTAL_PILLARS = {
    metal: {
        id: "metal", legacyId: "kim", name: "Thái Bạch Kim Trụ",
        element: "Kim",
        color: "#f8fafc",
        gradient: "from-amber-500/30 to-yellow-600/10",
        border: "border-amber-400/50",
        particleColor: "rgba(251, 191, 36, 0.95)",
        secondaryColor: "#fef08a",
        icon: "fa-sun",
        bonusDesc: "+12 + 2×Lv Công; +1.5% Pháp Bảo/cấp",
        baseCost: 100
    },
    wood: {
        id: "wood", legacyId: "moc", name: "Thanh Đế Mộc Trụ",
        element: "Mộc",
        color: "#34d399", // Xanh ngọc lục bảo
        gradient: "from-emerald-500/30 to-teal-600/10",
        border: "border-emerald-400/50",
        particleColor: "rgba(52, 211, 153, 0.95)",
        secondaryColor: "#a7f3d0",
        icon: "fa-seedling",
        bonusDesc: "+120 + 25×Lv HP; +2% Linh Điền/cấp",
        baseCost: 100
    },
    water: {
        id: "water", legacyId: "thuy", name: "Huyền Minh Thủy Trụ",
        element: "Thủy",
        color: "#38bdf8", // Xanh lam sóng nước
        gradient: "from-sky-500/30 to-blue-600/10",
        border: "border-sky-400/50",
        particleColor: "rgba(56, 189, 248, 0.95)",
        secondaryColor: "#bae6fd",
        icon: "fa-water",
        bonusDesc: "+20 + 5×Lv MP; +1.5% Tu Luyện/cấp",
        baseCost: 100
    },
    fire: {
        id: "fire", legacyId: "hoa", name: "Chúc Dung Hỏa Trụ",
        element: "Hỏa",
        color: "#f87171", // Đỏ rực lửa
        gradient: "from-rose-500/30 to-red-600/10",
        border: "border-rose-400/50",
        particleColor: "rgba(248, 113, 113, 0.95)",
        secondaryColor: "#fecdd3",
        icon: "fa-fire",
        bonusDesc: "+8 Công & +0.3% Bạo/cấp; +2% Thành Đan/cấp",
        baseCost: 100
    },
    earth: {
        id: "earth", legacyId: "tho", name: "Hậu Thổ Linh Trụ",
        element: "Thổ",
        color: "#fb923c", // Cam đất
        gradient: "from-orange-500/30 to-amber-700/10",
        border: "border-orange-400/50",
        particleColor: "rgba(251, 146, 60, 0.95)",
        secondaryColor: "#fed7aa",
        icon: "fa-mountain",
        bonusDesc: "+8 + 1.8×Lv Thủ; -0.5% sát thương/cấp (tối đa 35%)",
        baseCost: 100
    }
};

if (typeof window !== 'undefined') {
    window.ELEMENTAL_PILLARS = ELEMENTAL_PILLARS;
}
if (typeof globalThis !== 'undefined') {
    globalThis.ELEMENTAL_PILLARS = ELEMENTAL_PILLARS;
}

const FIVE_ELEMENTS_CONFIG = ELEMENTAL_PILLARS;
const ELEMENTAL_RESONANCE = { step: 10, bonusPerStep: 0.05 };

const LINH_CAN_STAGES = [
    { min: 1, max: 10, name: "Phàm Giai", color: "#94a3b8", colorClass: "text-slate-400" },
    { min: 11, max: 20, name: "Linh Giai", color: "#34d399", colorClass: "text-emerald-400" },
    { min: 21, max: 30, name: "Huyền Giai", color: "#60a5fa", colorClass: "text-blue-400" },
    { min: 31, max: 40, name: "Địa Giai", color: "#c084fc", colorClass: "text-purple-400" },
    { min: 41, max: 50, name: "Thiên Giai", color: "#fb923c", colorClass: "text-orange-400" },
    { min: 51, max: 60, name: "Vương Giai", color: "#ef4444", colorClass: "text-red-500" },
    { min: 61, max: 70, name: "Hoàng Giai", color: "#e11d48", colorClass: "text-rose-600" },
    { min: 71, max: 80, name: "Tôn Giai", color: "#f1f5f9", colorClass: "text-slate-100" },
    { min: 81, max: 90, name: "Thánh Giai", color: "#facc15", colorClass: "text-yellow-400" },
    { min: 91, max: 100, name: "Cực Đạo", color: "rainbow", colorClass: "cuc-dao-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 text-transparent bg-clip-text font-black animate-pulse" }
];
const NGU_HANH_TIERS = LINH_CAN_STAGES;

if (typeof window !== 'undefined') {
    window.LINH_CAN_STAGES = LINH_CAN_STAGES;
    window.NGU_HANH_TIERS = NGU_HANH_TIERS;
    window.ELEMENTAL_RESONANCE = ELEMENTAL_RESONANCE;
}
if (typeof globalThis !== 'undefined') {
    globalThis.LINH_CAN_STAGES = LINH_CAN_STAGES;
    globalThis.NGU_HANH_TIERS = NGU_HANH_TIERS;
    globalThis.ELEMENTAL_RESONANCE = ELEMENTAL_RESONANCE;
}
const LINH_CAN_RULES = { maxLevel: 100, stageStep: 10, stageCostMultiplier: 2.5, rareCostMultiplier: 1.2, rareUnlockItem: "di_nguyen_thach" };
const RARE_LINH_CAN_BRANCHES = {
    ice: { id: "bang", name: "Băng Linh Căn", element: "Băng", color: "#a5f3fc", icon: "fa-snowflake" },
    wind: { id: "phong", name: "Phong Linh Căn", element: "Phong", color: "#86efac", icon: "fa-wind" },
    thunder: { id: "loi", name: "Lôi Linh Căn", element: "Lôi", color: "#c084fc", icon: "fa-bolt" }
};
const LINH_CAN_MUTATIONS = {
    metal: { itemId: "canh_kim_kiem_cot", itemName: "Canh Kim Kiếm Cốt", name: "Vô Thượng Kiếm Căn", color: "#fef08a", effects: { cultivationSpeedMultiplier: 3, physicalDamageMultiplier: 1.5, armorIgnore: 0.3 } },
    wood: { itemId: "van_nien_thu_tam", itemName: "Vạn Niên Thụ Tâm", name: "Thái Ất Trường Sinh Căn", color: "#86efac", effects: { cultivationSpeedMultiplier: 3, hpRegenUnlocked: true, poisonImmune: true, burnImmune: true } },
    water: { itemId: "huyen_am_chan_thuy", itemName: "Huyền Âm Chân Thủy", name: "Huyền Minh Thủy Căn", color: "#67e8f9", effects: { cultivationSpeedMultiplier: 3, shieldEfficiencyMultiplier: 1.4, magicResistanceUnlocked: true } },
    fire: { itemId: "di_hoa_chung", itemName: "Dị Hỏa Chủng", name: "Hỗn Độn Viêm Căn", color: "#fb7185", effects: { cultivationSpeedMultiplier: 3, burnEnemyMaxHpPercent: 0.02 } },
    earth: { itemId: "hong_hoang_tuc_nhuong", itemName: "Hồng Hoang Tức Nhưỡng", name: "Bất Hủ Thánh Thể Căn", color: "#fdba74", effects: { cultivationSpeedMultiplier: 3, hpMultiplier: 3, physicalReflect: 0.3 } },
    ice: { itemId: "cuu_u_han_cuc", itemName: "Cửu U Hàn Cực", name: "Tuyệt Lãnh Băng Tâm", color: "#a5f3fc", effects: { cultivationSpeedMultiplier: 3, executeBelowHpPercent: 0.15, iceShieldExplosion: true } },
    wind: { itemId: "cuu_tieu_cuong_phong", itemName: "Cửu Tiêu Cương Phong", name: "Hư Không Phong Căn", color: "#a7f3d0", effects: { cultivationSpeedMultiplier: 3, absoluteDodgeChance: 0.5, castSpeedBoostUnlocked: true } },
    thunder: { itemId: "loi_kiep_dich", itemName: "Lôi Kiếp Dịch", name: "Thiên Lôi Linh Căn", color: "#e879f9", effects: { cultivationSpeedMultiplier: 3, criticalChainLightning: true, paralysisIgnoresResistance: true } }
};

const FOUNDATION_RULES = {
    tabs: {
        linh_can: { minRank: 1 },
        the_chat: { minRank: 1 },
        than_thuc: { minRank: 1 },
        menh_cach: { minRank: 1 }
    },
    physiqueStages: ["Phàm Khu", "Ngưu Bì", "Thiết Cốt", "Đồng Bì", "Kim Thân"],
    physiqueResources: ["khi_huyet", "yeu_dan"],
    consciousnessResources: ["duong_hon_moc", "hon_thach"],
    destinyItems: {
        bo_de_qua: "ngo_tinh",
        thien_dao_chuc_phuc: "khi_van"
    }
};

const DAO_FOUNDATION_TITLES = {
    thien_loi_linh_can: { id: "thien_loi_linh_can", name: "Thiên Lôi Linh Căn", effects: { cultivationSpeedMultiplier: 3 } },
    hon_don_viem_can: { id: "hon_don_viem_can", name: "Hỗn Độn Viêm Căn", effects: { cultivationSpeedMultiplier: 3 } },
    vo_thuong_kiem_can: { id: "vo_thuong_kiem_can", name: "Vô Thượng Kiếm Căn", effects: { cultivationSpeedMultiplier: 3 } },
    thai_at_truong_sinh_can: { id: "thai_at_truong_sinh_can", name: "Thái Ất Trường Sinh Căn", effects: { cultivationSpeedMultiplier: 3 } },
    huyen_minh_thuy_can: { id: "huyen_minh_thuy_can", name: "Huyền Minh Thủy Căn", effects: { cultivationSpeedMultiplier: 3 } },
    bat_hu_thanh_the_can: { id: "bat_hu_thanh_the_can", name: "Bất Hủ Thánh Thể Căn", effects: { cultivationSpeedMultiplier: 3 } },
    tuyet_lanh_bang_tam: { id: "tuyet_lanh_bang_tam", name: "Tuyệt Lãnh Băng Tâm", effects: { cultivationSpeedMultiplier: 3 } },
    hu_khong_phong_can: { id: "hu_khong_phong_can", name: "Hư Không Phong Căn", effects: { cultivationSpeedMultiplier: 3 } },
    vo_linh_can: {
        id: "vo_linh_can", name: "Vô Linh Căn", defaultUnlocked: true,
        effects: { hpMultiplier: 1.2, mpMaxOverride: 0, cultivationSpeedMultiplier: 0 }
    },
    nguy_linh_can: {
        id: "nguy_linh_can", name: "Ngụy Linh Căn", defaultUnlocked: true,
        effects: { mpMaxUnlock: true, cultivationSpeedMultiplier: 1, mpCostMultiplier: 1.3 }
    },
    chan_linh_can: {
        id: "chan_linh_can", name: "Chân Linh Căn", minElementsAtLevel: { count: 2, level: 10 },
        requiredItems: { tay_tuy_dan: 1 }, consumeItems: true,
        effects: { cultivationSpeedMultiplier: 1.5, mpCostMultiplier: 1 }
    },
    thien_linh_can: {
        id: "thien_linh_can", name: "Thiên Linh Căn", minRank: 11,
        singleElementAtLeast: 50, otherElementsBelow: 5,
        requiredItems: { thien_dao_chuc_phuc: 1 }, consumeItems: true,
        effects: { cultivationSpeedMultiplier: 3, elementalDamageMultiplier: 2, elementalWeaknessTaken: 2 }
    },
    di_linh_can: {
        id: "di_linh_can", name: "Dị Linh Căn", maxHpPercent: 10, requiredEvent: "thien_kiep",
        requiredItems: { bien_di_qua: 1 }, consumeItems: true,
        effects: { cultivationSpeedMultiplier: 2, critRateAdd: 0.3, critDamageAdd: 0.5 }
    },
    ngu_hanh_hon_nguyen: {
        id: "ngu_hanh_hon_nguyen", name: "Ngũ Hành Hỗn Nguyên", minRank: 19,
        allElementsEqual: 100,
        requiredItems: { ngu_hanh_tu_linh_dan: 1 }, consumeItems: true,
        effects: { hpMultiplier: 3, mpMultiplier: 3, cultivationSpeedMultiplier: 2.5, mpRegenPercent: 0.05 }
    }
};

// 4.2. HỆ THỐNG THÚ SỦNG HỘ PHÁP & PHÁP BẢO BẢN MỆNH QUỸ ĐẠO
const GUARDIAN_PETS = {
    fox: {
        id: "fox",
        name: "Cửu Vĩ Thiên Hồ",
        typeText: "Linh Hồ Hộ Thể",
        icon: "fa-paw",
        avatar: "./assets/images/pet_fox.jpg",
        color: "#f472b6",
        badgeBg: "bg-pink-500/20 text-pink-300 border-pink-400/40",
        buffDesc: "+18% Tụ Khí & Hộ Mạch",
        stats: { hp: 500, mp: 200, atk: 45, def: 35, dodge: 5 },
        quote: "Chủ nhân, thiếp thân nguyện cùng ngài gánh vác lôi kiếp!"
    },
    dragon: {
        id: "dragon",
        name: "Băng Lôi Giao Long",
        typeText: "Chấn Lôi Thần Thú",
        icon: "fa-dragon",
        color: "#38bdf8",
        badgeBg: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        buffDesc: "+28 Công Kích & Kháng Lôi Kiếp",
        stats: { hp: 600, mp: 300, atk: 75, def: 40, crit: 6 },
        quote: "Long ngâm cửu thiên! Cửu tiêu lôi kiếp chẳng qua là thức ăn của ta!"
    },
    crane: {
        id: "crane",
        name: "Thanh Hạc Tiên Cầm",
        typeText: "Tường Vân Tiên Hạc",
        icon: "fa-feather-pointed",
        color: "#2dd4bf",
        badgeBg: "bg-teal-500/20 text-teal-300 border-teal-400/40",
        buffDesc: "+22 Thân Pháp & Giảm Sát Thương",
        stats: { hp: 450, mp: 250, atk: 50, def: 45, dodge: 10 },
        quote: "Hạc hót từng không, đạo tâm trong sáng trường tồn với nhật nguyệt."
    }
};
window.GUARDIAN_PETS = GUARDIAN_PETS;

// 4.3. NHẬT KÝ KỲ NGỘ VĂN BẢN (CỔ TỊCH CUỘN TRÒN & CHÁNH MA TRỊ SỐ)
const ENCOUNTER_RULES = Object.freeze({
    idleChance: 0.001,
    expeditionChance: 0.05,
    cooldownMs: 10 * 60 * 1000,
    righteousMindGain: 12,
    demonicMindLoss: 25
});

const ENCOUNTERS = [
    {
        id: "enc_1",
        title: "Cổ Tu Động Phủ Tàn Dư",
        location: "Vạn Độc U Cốc",
        story: "Dưới chân vực sâu sương lam dày đặc, ngươi ngửi thấy tử khí lẫn hương linh dược thoang thoảng. Lần theo vết nứt địa tầng, trước mắt là hài cốt một vị Hóa Thần đại năng cùng viên Trấn Hồn Châu đang giam hãm một đạo tàn hồn oán khí ngập trời...",
        righteous: {
            title: "Trảm Niệm Siêu Độ",
            tag: "Chánh Đạo",
            desc: "Niệm Thái Thượng Thanh Tâm Chú, tiêu trừ oán niệm để tàn hồn vãng sinh luân hồi.",
            exp: 380,
            stones: 90,
            righteousDelta: 15,
            demonicDelta: -5,
            rewardText: "Tàn hồn trước khi siêu thoát lưu lại 2 lọ Tụ Khí Đan cảm tạ công đức!",
            giveItem: { id: "pill_qi", count: 2 }
        },
        demonic: {
            title: "Thôn Phệ Huyết Phách",
            tag: "Ma Đạo",
            desc: "Thi triển U Minh Ma Diễm luyện hóa tàn hồn, cưỡng đoạt toàn bộ tu vi tàn dư.",
            exp: 850,
            stones: 180,
            righteousDelta: -10,
            demonicDelta: 20,
            rewardText: "Ma khí cuồn cuộn! Toàn bộ công lực tàn hồn bị ngươi hút cạn, tu vi tăng vọt!",
            giveItem: { id: "herb_blood", count: 3 }
        }
    },
    {
        id: "enc_2",
        title: "Tranh Đoạt Thiên Niên Cửu Diệp Chi",
        location: "Kỳ Lân Tuyết Lĩnh",
        story: "Trên đỉnh vách băng giá rét, một đóa Cửu Diệp Tuyết Chi ngàn năm vừa khai hoa tỏa hương thơm ngát. Một tiểu tu sĩ Luyện Khí cả người đầy máu đang tuyệt vọng chống đỡ trước bầy Băng Sương Yêu Lang hung bạo...",
        righteous: {
            title: "Rút Kiếm Tương Trợ",
            tag: "Chánh Đạo",
            desc: "Ngự kiếm phá không trảm sát bầy yêu thú, cứu mạng đồng đạo gặp nạn.",
            exp: 420,
            stones: 120,
            righteousDelta: 15,
            demonicDelta: -5,
            rewardText: "Tiểu tu sĩ cảm kích dập đầu tạ ơn, chủ động tặng lại linh chi trị thương!",
            giveItem: { id: "herb_spirit", count: 4 }
        },
        demonic: {
            title: "Tọa Sơn Quan Hổ Đấu",
            tag: "Ma Đạo",
            desc: "Thu liễm khí tức đợi cả hai bên tàn sát kiệt sức, sau đó ra tay đoạt sạch bảo vật.",
            exp: 950,
            stones: 250,
            righteousDelta: -12,
            demonicDelta: 22,
            rewardText: "Tiên lộ tàn khốc! Ngươi thu hoạch sạch sành sanh linh chi và túi trữ vật của đối phương.",
            giveItem: { id: "stone_ore", count: 8 }
        }
    },
    {
        id: "enc_3",
        title: "Ma Tông Tà Tu Luyện Đan",
        location: "Hắc Huyết Đầm Lầy",
        story: "Một tên Tà Tu Lục Dục Tông bắt giữ dân làng vô tội để tế đan, chuẩn bị luyện chế Huyết Hồn Cấm Đan độc ác. Trong đỉnh lô khói đen nghi ngút, tiếng kêu khóc bi ai thấu trời...",
        righteous: {
            title: "Phá Đỉnh Cứu Sinh",
            tag: "Chánh Đạo",
            desc: "Vận kiếm cương phá tan đan đỉnh tà môn, trảm ma vệ đạo, phóng thích lương dân.",
            exp: 550,
            stones: 160,
            righteousDelta: 20,
            demonicDelta: -8,
            rewardText: "Thiên địa ban phúc vận, tâm cảnh rộng mở, nhận được 1 viên Trúc Cơ Đan thuần khiết!",
            giveItem: { id: "pill_foundation", count: 1 }
        },
        demonic: {
            title: "Đoạt Đan Nuốt Trọn",
            tag: "Ma Đạo",
            desc: "Trảm sát tà tu, cướp lấy đỉnh lô và nuốt trọn toàn bộ đan dược huyết sát cực phẩm.",
            exp: 1350,
            stones: 320,
            righteousDelta: -15,
            demonicDelta: 25,
            rewardText: "Huyết đan nhập thể, ma tính bùng nổ, tu vi gia tăng như vũ bão!",
            giveItem: { id: "pill_foundation", count: 2 },
            heavenlyViolation: "Nuốt Huyết Hồn Cấm Đan luyện từ sinh linh vô tội"
        }
    },
    {
        id: "enc_4",
        title: "Thần Thú Niết Bàn Trọng Sinh",
        location: "Bất Chu Thiên Sơn",
        story: "Giữa biển nham thạch nóng bỏng, một quả trứng Chu Tước thượng cổ đang hấp thu địa hỏa chuẩn bị niết bàn phá vỏ. Hỏa diễm bốc cao ngút trời, tỏa ra uy áp thiên địa ngập tràn...",
        righteous: {
            title: "Hộ Pháp Trợ Sinh",
            tag: "Chánh Đạo",
            desc: "Trích xuất chân nguyên thuần tịnh lập hộ trận bao bọc, trợ ấu thú thuận lợi niết bàn.",
            exp: 600,
            stones: 200,
            righteousDelta: 18,
            demonicDelta: -5,
            rewardText: "Ấu điểu phá vỏ vỗ cánh cảm tạ, tặng lại một chiếc lông vũ linh quang rực rỡ!",
            giveItem: { id: "herb_spirit", count: 6 }
        },
        demonic: {
            title: "Hút Cạn Niết Bàn Tinh Huyết",
            tag: "Ma Đạo",
            desc: "Dùng bí pháp tà đạo bóp vỡ vỏ trứng, cưỡng đoạt toàn bộ tinh hoa bản nguyên Chu Tước.",
            exp: 1500,
            stones: 400,
            righteousDelta: -20,
            demonicDelta: 28,
            rewardText: "Thần thú tinh huyết kích hoạt cuồng bạo kinh mạch! Chiến lực tăng vọt không thể ngăn cản!",
            giveItem: { id: "herb_blood", count: 6 },
            heavenlyViolation: "Bóp vỡ trứng thần thú, cưỡng đoạt bản nguyên sinh mệnh"
        }
    }
];

// 4.4. BẢN ĐỒ THẾ GIỚI & KHU VỰC LỊCH LUYỆN (EXPEDITION ZONES)
const EXPEDITION_ZONES = [
    {
        id: "thanh_truc_lam",
        name: "Thanh Trúc Lâm",
        alias: "Rừng Trúc Sơ Giai",
        desc: "Rừng trúc bạt ngàn linh khí lượn lờ, thỏ ngọc và yêu thử phàm thú qua lại kiếm ăn.",
        minRealmIndex: 0, // Luyện Khí Sơ Kỳ
        recommendedPower: 120,
        baseSeconds: 18,
        icon: "fa-tree",
        theme: "emerald",
        badge: "Sơ Giai",
        loot: {
            stonesMin: 12,
            stonesMax: 30,
            expMin: 15,
            expMax: 35,
            oreChance: 0.70,
            oreMin: 1,
            oreMax: 2,
            spiritSeedChance: 0.45,
            bloodSeedChance: 0.15
        }
    },
    {
        id: "van_doc_u_coc",
        name: "Vạn Độc U Cốc",
        alias: "Yêu Cốc Độc Chướng",
        desc: "Thung lũng u ám bao phủ chướng khí kịch độc ngút trời, độc xà mãng thú tụ tập.",
        minRealmIndex: 2, // Luyện Khí Trung Kỳ (Lv.5-6)
        recommendedPower: 380,
        baseSeconds: 32,
        icon: "fa-skull-crossbones",
        theme: "purple",
        badge: "Nguy Hiểm",
        loot: {
            stonesMin: 35,
            stonesMax: 80,
            expMin: 45,
            expMax: 90,
            oreChance: 0.85,
            oreMin: 2,
            oreMax: 4,
            spiritSeedChance: 0.60,
            bloodSeedChance: 0.45
        }
    },
    {
        id: "van_kiem_co_trung",
        name: "Vạn Kiếm Cổ Trũng",
        alias: "Cổ Kiếm Di Trủng",
        desc: "Di tích cổ chiến trường kiếm tu viễn cổ, kiếm khí tung hoành sắc bén vạn phần.",
        minRealmIndex: 4, // Trúc Cơ Sơ Kỳ
        recommendedPower: 850,
        baseSeconds: 48,
        icon: "fa-khanda",
        theme: "amber",
        badge: "Cổ Tích",
        loot: {
            stonesMin: 90,
            stonesMax: 200,
            expMin: 120,
            expMax: 240,
            oreChance: 0.95,
            oreMin: 3,
            oreMax: 6,
            spiritSeedChance: 0.70,
            bloodSeedChance: 0.60,
            specialDrops: [
                { itemId: "di_nguyen_thach", itemName: "Dị Nguyên Thạch", chance: 0.08 }
            ]
        }
    },
    {
        id: "bang_phong_tuyet_linh",
        name: "Băng Phong Tuyết Lĩnh",
        alias: "Tuyết Sơn Hàn Băng",
        desc: "Dãy núi tuyết ngàn năm hàn khí thấu xương, sản sinh dị thảo băng tính quý hiếm.",
        minRealmIndex: 6, // Trúc Cơ Hậu Kỳ
        recommendedPower: 1800,
        baseSeconds: 65,
        icon: "fa-snowflake",
        theme: "cyan",
        badge: "Hàn Cực",
        loot: {
            stonesMin: 220,
            stonesMax: 500,
            expMin: 300,
            expMax: 550,
            oreChance: 1.0,
            oreMin: 5,
            oreMax: 10,
            spiritSeedChance: 0.80,
            bloodSeedChance: 0.75,
            specialDrops: [
                { itemId: "van_nien_han_ngoc", itemName: "Vạn Niên Hàn Ngọc", chance: 0.12 }
            ]
        }
    },
    {
        id: "hoa_van_ma_quat",
        name: "Hỏa Vân Ma Quật",
        alias: "Hỏa Quật Yêu Ma",
        desc: "Sào huyệt nham thạch ma hỏa sôi trào, chứa đựng thiên kiếp địa hỏa và lôi tức viễn cổ.",
        minRealmIndex: 8, // Kim Đan Sơ Kỳ
        recommendedPower: 3600,
        baseSeconds: 85,
        icon: "fa-volcano",
        theme: "rose",
        badge: "Cực Hung",
        loot: {
            stonesMin: 550,
            stonesMax: 1300,
            expMin: 700,
            expMax: 1400,
            oreChance: 1.0,
            oreMin: 8,
            oreMax: 16,
            spiritSeedChance: 0.90,
            bloodSeedChance: 0.90,
            specialDrops: [
                { itemId: "di_hoa_chung", itemName: "Dị Hỏa Chủng", chance: 0.15 },
                { itemId: "loi_kiep_dich", itemName: "Lôi Kiếp Dịch", chance: 0.15 }
            ]
        }
    }
];
if (typeof window !== 'undefined') {
    window.EXPEDITION_ZONES = EXPEDITION_ZONES;
}
if (typeof globalThis !== 'undefined') {
    globalThis.EXPEDITION_ZONES = EXPEDITION_ZONES;
}

// 4.5. HỆ THỐNG TRẤN YÊU THÁP (DEMON SUPPRESSION TOWER CONFIG & DYNAMIC SCALING)
const DEMON_TOWER_MONSTERS = [
    { name: "Huyết Dực Bọ Hung", icon: "fa-bug", title: "Sơ Giai Yêu Trùng", image: "./assets/images/avatar_heart_demon.jpg" },
    { name: "Bạch Cốt Dạ Xoa", icon: "fa-skull", title: "Hung Sát Oán Linh", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "U Hồn Hắc Báo", icon: "fa-paw", title: "Dạ Hành Yêu Thú", image: "./assets/images/avatar_heart_demon.jpg" },
    { name: "Cửu Nhãn Ma Chu", icon: "fa-spider", title: "Độc Chướng Ma Yêu", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "Xích Huyết Cuồng Sư", icon: "fa-shield-cat", title: "Huyết Sát Ma Thú", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "Độc Giác Cự Ma", icon: "fa-ghost", title: "Thượng Cổ Di Chủng", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "U Minh Cự Mãng", icon: "fa-worm", title: "Vực Thẳm Độc Mãng", image: "./assets/images/avatar_heart_demon.jpg" },
    { name: "Hắc Diễm Quỷ Vương", icon: "fa-fire-flame-curved", title: "U Minh Quỷ Tướng", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "Cửu U Tà Long", icon: "fa-dragon", title: "Thâm Uyên Long Ma", image: "./assets/images/boss_ancient_demon.jpg" },
    { name: "Vạn Ma Chi Chủ", icon: "fa-biohazard", title: "Hỗn Độn Ma Tôn", image: "./assets/images/boss_ancient_demon.jpg" }
];

const TOWER_REALM_NAMES = [
    "Luyện Khí",  // Tier 1: Tầng 1 - 10
    "Trúc Cơ",    // Tier 2: Tầng 11 - 20
    "Kim Đan",    // Tier 3: Tầng 21 - 30
    "Nguyên Anh", // Tier 4: Tầng 31 - 40
    "Hóa Thần",   // Tier 5: Tầng 41 - 50
    "Luyện Hư",   // Tier 6: Tầng 51 - 60
    "Hợp Thể",   // Tier 7: Tầng 61 - 70
    "Đại Thừa",   // Tier 8: Tầng 71 - 80
    "Độ Kiếp"     // Tier 9: Tầng 81+
];

/**
 * Bảng dữ liệu cố định Trấn Yêu Tháp (DemonTowerData)
 * Tuyệt đối KHÔNG dùng playerStats để nhân ra chỉ số quái.
 * Công thức: EnemyStats = BaseFloorStats * TierMultiplier
 * - Tầng 1 - 10 (Quái Luyện Khí - Tier 1, x1): HP 500 - 2,000 | ATK 30 - 100
 * - Tầng 11 - 20 (Quái Trúc Cơ - Tier 2, x10): HP 15,000 - 40,000 | ATK 1,500 - 3,000
 * - Tầng 21 - 30 (Quái Kim Đan - Tier 3, x100): HP 150,000 - 400,000 | ATK 15,000 - 30,000
 * - Tầng 31 - 40 (Quái Nguyên Anh - Tier 4, x1,000): HP 1,500,000 - 4,000,000 | ATK 150,000 - 300,000
 * - Tầng 41 - 50 (Quái Hóa Thần - Tier 5, x10,000): HP 15,000,000 - 40,000,000 | ATK 1,500,000 - 3,000,000
 */
const DEMON_TOWER_TIERS_CONFIG = {
    1: {
        tier: 1,
        realmName: "Luyện Khí",
        floorRange: [1, 10],
        tierMultiplier: 1,
        baseHpMin: 500,
        baseHpMax: 2000,
        baseAtkMin: 30,
        baseAtkMax: 100,
        baseDefMin: 10,
        baseDefMax: 45
    },
    2: {
        tier: 2,
        realmName: "Trúc Cơ",
        floorRange: [11, 20],
        tierMultiplier: 10,
        baseHpMin: 1500,
        baseHpMax: 4000,
        baseAtkMin: 150,
        baseAtkMax: 300,
        baseDefMin: 45,
        baseDefMax: 110
    },
    3: {
        tier: 3,
        realmName: "Kim Đan",
        floorRange: [21, 30],
        tierMultiplier: 100,
        baseHpMin: 1500,
        baseHpMax: 4000,
        baseAtkMin: 150,
        baseAtkMax: 300,
        baseDefMin: 45,
        baseDefMax: 110
    },
    4: {
        tier: 4,
        realmName: "Nguyên Anh",
        floorRange: [31, 40],
        tierMultiplier: 1000,
        baseHpMin: 1500,
        baseHpMax: 4000,
        baseAtkMin: 150,
        baseAtkMax: 300,
        baseDefMin: 45,
        baseDefMax: 110
    },
    5: {
        tier: 5,
        realmName: "Hóa Thần",
        floorRange: [41, 50],
        tierMultiplier: 10000,
        baseHpMin: 1500,
        baseHpMax: 4000,
        baseAtkMin: 150,
        baseAtkMax: 300,
        baseDefMin: 45,
        baseDefMax: 110
    },
    6: {
        tier: 6,
        realmName: "Luyện Hư",
        floorRange: [51, 60],
        tierMultiplier: 100000,
        baseHpMin: 2000,
        baseHpMax: 5000,
        baseAtkMin: 200,
        baseAtkMax: 450,
        baseDefMin: 70,
        baseDefMax: 160
    },
    7: {
        tier: 7,
        realmName: "Hợp Thể",
        floorRange: [61, 70],
        tierMultiplier: 1000000,
        baseHpMin: 2500,
        baseHpMax: 6000,
        baseAtkMin: 250,
        baseAtkMax: 550,
        baseDefMin: 90,
        baseDefMax: 200
    },
    8: {
        tier: 8,
        realmName: "Đại Thừa",
        floorRange: [71, 80],
        tierMultiplier: 10000000,
        baseHpMin: 3000,
        baseHpMax: 7500,
        baseAtkMin: 300,
        baseAtkMax: 700,
        baseDefMin: 120,
        baseDefMax: 260
    },
    9: {
        tier: 9,
        realmName: "Độ Kiếp",
        floorRange: [81, 90],
        tierMultiplier: 100000000,
        baseHpMin: 4000,
        baseHpMax: 10000,
        baseAtkMin: 400,
        baseAtkMax: 900,
        baseDefMin: 160,
        baseDefMax: 350
    },
    10: {
        tier: 10,
        realmName: "Chân Tiên",
        floorRange: [91, 100],
        tierMultiplier: 1000000000,
        baseHpMin: 5000,
        baseHpMax: 15000,
        baseAtkMin: 500,
        baseAtkMax: 1200,
        baseDefMin: 200,
        baseDefMax: 450
    }
};

function getTowerSubRealmStageName(stepInTier) {
    const step = Math.max(1, Math.min(10, Number(stepInTier) || 1));
    if (step <= 3) return "Sơ Kỳ";
    if (step <= 6) return "Trung Kỳ";
    if (step <= 9) return "Hậu Kỳ";
    return "Đỉnh Phong";
}

function buildFixedDemonTowerFloorEntry(floor) {
    const f = Math.max(1, Math.floor(Number(floor) || 1));
    const tierIndex = Math.floor((f - 1) / 10);
    const tier = tierIndex + 1;
    const stepInTier = ((f - 1) % 10) + 1; // 1..10
    const progress = (stepInTier - 1) / 9; // 0..1 trên 10 tầng mỗi Đại Cảnh Giới

    const tierCfg = DEMON_TOWER_TIERS_CONFIG[tier] || {
        tier,
        realmName: TOWER_REALM_NAMES[tierIndex] || `Cực Cảnh (Tier ${tier})`,
        floorRange: [tierIndex * 10 + 1, (tierIndex + 1) * 10],
        tierMultiplier: Math.pow(10, tier - 1),
        baseHpMin: 1500,
        baseHpMax: 4000,
        baseAtkMin: 150,
        baseAtkMax: 300,
        baseDefMin: 45,
        baseDefMax: 110
    };

    const template = DEMON_TOWER_MONSTERS[(f - 1) % DEMON_TOWER_MONSTERS.length];
    const realmName = tierCfg.realmName;
    const subRealmName = getTowerSubRealmStageName(stepInTier);
    const fullRealmName = `${realmName} ${subRealmName}`;
    const tierMultiplier = tierCfg.tierMultiplier;

    // ĐẶC BIỆT: TẦNG 50 - ẢI TRẤN THÁP PHI THĂNG (CỬU U HUYẾT MA HOÀNG)
    if (f === 50) {
        const bossHp = 1640000;
        const bossAtk = 250000;
        const bossDef = 95000;
        const bossCp = Math.round((bossAtk * 2) + (bossDef * 1.5) + (bossHp * 0.1));
        return {
            floor: 50,
            name: "Cửu U Huyết Ma Hoàng",
            icon: "fa-skull-crossbones",
            image: "./assets/images/avatar_heart_demon.jpg",
            archetypeTitle: "Trấn Tháp Đỉnh Phong Ma Hoàng",
            realmName: "Hóa Thần",
            subRealmName: "Cực Cảnh",
            fullRealmName: "Hóa Thần Cực Cảnh (Ải Phi Thăng)",
            title: "Cửu U Huyết Ma Hoàng - Tầng 50 [Ải Phi Thăng]",
            displayTitle: "Cửu U Huyết Ma Hoàng - Hóa Thần Cực Cảnh [Ải Phi Thăng]",
            tier: 5,
            tierIndex: 4,
            stepInTier: 10,
            tierMultiplier: 10000,
            baseFloorStats: {
                hp: 1850,
                atk: 28,
                def: 12.5
            },
            hp: bossHp,
            maxHp: bossHp,
            atk: bossAtk,
            def: bossDef,
            critChance: 0.25,
            critDamage: 1.8,
            cp: bossCp,
            rewardStones: 500000,
            rewardExp: 2000000,
            isAscensionBoss: true,
            armorPenetration: 0.35,
            specialSkills: [
                { turn: 3, name: "Huyết Hải Cuồng Triều", multiplier: 1.5, type: "aoe", desc: "Sóng máu cuộn trào bỏ qua 35% hộ giáp người chơi!" },
                { turn: 5, name: "Hủy Diệt Lôi Đình", multiplier: 2.5, type: "burst", desc: "Lôi điện diệt thế bạo kích trảm hồn người chơi!" }
            ]
        };
    }

    // BaseFloorStats nội suy tuyến tính mượt mà trong 10 tầng của Tier
    const baseFloorHp = Math.round(tierCfg.baseHpMin + (tierCfg.baseHpMax - tierCfg.baseHpMin) * progress);
    const baseFloorAtk = Math.round(tierCfg.baseAtkMin + (tierCfg.baseAtkMax - tierCfg.baseAtkMin) * progress);
    const baseFloorDef = Math.round(tierCfg.baseDefMin + (tierCfg.baseDefMax - tierCfg.baseDefMin) * progress);

    // Công thức chuẩn: EnemyStats = BaseFloorStats * TierMultiplier
    const hp = Math.round(baseFloorHp * tierMultiplier);
    const atk = Math.round(baseFloorAtk * tierMultiplier);
    const def = Math.round(baseFloorDef * tierMultiplier);

    // Chiến lực chuẩn: CP = (ATK * 2) + (DEF * 1.5) + (HP * 0.1)
    const cp = Math.round((atk * 2) + (def * 1.5) + (hp * 0.1));

    const rewardStones = Math.round(f * 10 * Math.pow(3.5, tierIndex));
    const rewardExp = Math.round(f * 35 * Math.pow(4.0, tierIndex));

    return {
        floor: f,
        name: template.name,
        icon: template.icon,
        image: template.image || null,
        archetypeTitle: template.title,
        realmName,
        subRealmName,
        fullRealmName,
        title: `${template.name} - ${fullRealmName}`,
        displayTitle: `${template.name} - ${fullRealmName}`,
        tier,
        tierIndex,
        stepInTier,
        tierMultiplier,
        baseFloorStats: {
            hp: baseFloorHp,
            atk: baseFloorAtk,
            def: baseFloorDef
        },
        hp,
        maxHp: hp,
        atk,
        def,
        critChance: Number((0.05 + Math.min(0.20, tierIndex * 0.03)).toFixed(2)),
        critDamage: 1.5,
        cp,
        rewardStones,
        rewardExp
    };
}

const DemonTowerData = {
    tiers: DEMON_TOWER_TIERS_CONFIG,
    floors: {},
    getFloor(floor = 1) {
        const f = Math.max(1, Math.floor(Number(floor) || 1));
        if (!this.floors[f]) {
            this.floors[f] = buildFixedDemonTowerFloorEntry(f);
        }
        return {
            ...this.floors[f],
            baseFloorStats: { ...this.floors[f].baseFloorStats }
        };
    }
};

// Khởi tạo sẵn 100 tầng cố định trong DemonTowerData (chuẩn cấp số nhân qua 10 Đại Cảnh Giới)
for (let f = 1; f <= 100; f++) {
    const floorData = buildFixedDemonTowerFloorEntry(f);
    DemonTowerData.floors[f] = floorData;
    DemonTowerData[f] = floorData;
}

/**
 * Tính toán sát thương chuẩn theo công thức mới:
 * 1. Dmg thô = Math.max(attacker.atk - defender.def, attacker.atk * 0.1)
 * 2. Nhân hệ số Uy Áp
 * 3. Final Dmg = Math.max(1, Math.floor(rawDamage * suppression))
 */
function calculateCombatDamage(attackerAtk, defenderDef, attackerTier = 1, defenderTier = 1) {
    const atk = Math.max(1, Number(attackerAtk) || 1);
    const def = Math.max(0, Number(defenderDef) || 0);
    let baseDamage = atk - def;
    if (baseDamage <= 0) baseDamage = Math.max(1, Math.floor(atk * 0.1));
    const suppression = (typeof getRealmSuppression === 'function')
        ? getRealmSuppression(attackerTier, defenderTier)
        : ((typeof calculateRealmSuppression === 'function')
            ? calculateRealmSuppression(attackerTier, defenderTier)
            : 1.0);
    const safeSuppression = Number.isFinite(suppression) && suppression > 0 ? suppression : 1.0;
    const finalDamage = Math.floor(baseDamage * safeSuppression);
    return Math.max(1, Number.isFinite(finalDamage) ? finalDamage : 1);
}

/**
 * Lấy thông tin quái vật Trấn Yêu Tháp theo Tầng (Floor) từ DemonTowerData cố định.
 * Tuyệt đối KHÔNG dùng playerStats để nhân hay thay đổi chỉ số HP/ATK/DEF của quái!
 */
function getDemonTowerMonster(floor = 1) {
    const monster = DemonTowerData.getFloor(floor);

    // Tính toán thông tin chênh lệch cảnh giới để hiển thị cảnh báo UI (không làm đổi chỉ số quái)
    let playerTier = 1;
    if (typeof state !== 'undefined' && typeof state.realmIndex === 'number') {
        const currentRealmObj = REALMS[state.realmIndex];
        playerTier = currentRealmObj && currentRealmObj.tier
            ? currentRealmObj.tier
            : Math.min(5, Math.floor(state.realmIndex / 4) + 1);
    }

    const delta = playerTier - monster.tier;
    const tierDiff = Math.max(0, monster.tier - playerTier);
    const suppressionFn = (typeof getRealmSuppression === 'function')
        ? getRealmSuppression
        : ((typeof calculateRealmSuppression === 'function') ? calculateRealmSuppression : null);
    const suppressionTakenFn = (typeof getRealmSuppressionTaken === 'function')
        ? getRealmSuppressionTaken
        : null;

    const playerToMonsterMult = suppressionFn
        ? suppressionFn(playerTier, monster.tier)
        : (delta === 0 ? 1.0 : (delta > 0 ? 1.0 + delta * 0.1 : Math.max(0.1, 1.0 - Math.abs(delta) * 0.2)));
    const monsterToPlayerMult = suppressionTakenFn
        ? suppressionTakenFn(playerTier, monster.tier)
        : (delta === 0 ? 1.0 : (delta > 0 ? Math.max(0.1, 1.0 - delta * 0.1) : Math.min(3.0, 1.0 + Math.abs(delta) * 0.2)));

    const playerDebuffPercent = delta < 0 ? Math.round((1 - playerToMonsterMult) * 100) : 0;

    return {
        ...monster,
        playerTier,
        tierDiff,
        realmDelta: delta,
        playerDebuffPercent,
        playerDebuffRate: playerDebuffPercent / 100,
        realmSuppression: Number((1 / Math.max(0.01, playerToMonsterMult)).toFixed(2)),
        playerDamageMultiplier: playerToMonsterMult,
        monsterDamageMultiplier: monsterToPlayerMult
    };
}

function calculateMonsterCombatPower(monster) {
    if (!monster) return 0;
    const hp = Number(monster.hp || monster.maxHp || 0);
    const atk = Number(monster.atk || 0);
    const def = Number(monster.def || 0);
    return Math.round((atk * 2) + (def * 1.5) + (hp * 0.1));
}

// 4.6. BẢNG MỐC PHẦN THƯỞNG TRẤN YÊU THÁP (TOWER MILESTONES & TREASURES)
const TOWER_MILESTONES = [
    {
        floor: 5,
        title: "Khai Sơn Phục Ma",
        desc: "Vượt qua tầng 5, diệt trừ lũ tiểu yêu gác cổng tháp.",
        stones: 1500,
        exp: 3500,
        jade: 5,
        items: [{ id: "tu_khi_dan", name: "Tụ Khí Đan", count: 3, icon: "fa-pills", rarity: 2 }],
        icon: "fa-shield-halved"
    },
    {
        floor: 10,
        title: "Huyết Sát Nhập Hầu",
        desc: "Trảm sát Ma Thú Luyện Khí Viên Mãn, trấn áp tầng 10.",
        stones: 5000,
        exp: 12000,
        jade: 15,
        items: [{ id: "truc_co_dan", name: "Trúc Cơ Đan", count: 1, icon: "fa-capsules", rarity: 3 }],
        icon: "fa-skull"
    },
    {
        floor: 15,
        title: "Băng Lôi Hộ Trận",
        desc: "Phá tan tầng 15 của Trấn Yêu Tháp, lấy được bảo phù cổ xưa.",
        stones: 12000,
        exp: 30000,
        jade: 25,
        items: [{ id: "phu_ho_than", name: "Thần Hành Ngọc Phù", count: 2, icon: "fa-scroll", rarity: 3 }],
        icon: "fa-bolt"
    },
    {
        floor: 20,
        title: "Trảm Yêu Trúc Cơ",
        desc: "Tiêu diệt Ma Tướng Trúc Cơ Đỉnh Phong, chấn động Tháp Chủ.",
        stones: 25000,
        exp: 75000,
        jade: 40,
        items: [{ id: "kim_dan_dan", name: "Kim Đan Phá Chướng Đan", count: 1, icon: "fa-gem", rarity: 4 }],
        icon: "fa-khanda"
    },
    {
        floor: 25,
        title: "Hư Không Liệt Ma",
        desc: "Đoạt được dị bảo từ khe nứt hư không của tháp cổ.",
        stones: 50000,
        exp: 160000,
        jade: 60,
        items: [{ id: "thien_loi_thao", name: "Thiên Lôi Thảo", count: 5, icon: "fa-leaf", rarity: 4 }],
        icon: "fa-dragon"
    },
    {
        floor: 30,
        title: "Kim Đan Ma Tôn",
        desc: "Trảm sát Cổ Ma Hóa Hình, lưu danh ngàn đời trên bia tháp.",
        stones: 100000,
        exp: 400000,
        jade: 100,
        items: [{ id: "bat_quai_kinh", name: "Bát Quái Hộ Thể Kính", count: 1, icon: "fa-shield-heart", rarity: 5 }],
        icon: "fa-crown"
    },
    {
        floor: 40,
        title: "U Minh Quỷ Vương",
        desc: "Vượt qua tầng 40, nghiền nát huyết hải U Minh.",
        stones: 250000,
        exp: 1000000,
        jade: 200,
        items: [{ id: "nguyen_anh_dan", name: "Nguyên Anh Ngưng Hồn Đan", count: 2, icon: "fa-fire-burner", rarity: 5 }],
        icon: "fa-ghost"
    },
    {
        floor: 50,
        title: "Vạn Cổ Trấn Ma Tôn",
        desc: "Bình định 50 tầng tháp cổ, thiên hạ đệ nhất Trấn Ma Sứ!",
        stones: 600000,
        exp: 3000000,
        jade: 500,
        items: [{ id: "tran_ma_kiem", name: "Thượng Cổ Trấn Ma Kiếm", count: 1, icon: "fa-wand-magic-sparkles", rarity: 6 }],
        icon: "fa-trophy"
    }
];

// ==========================================
// 4.7. ĐẤU PHÁP ĐÀI • PHONG THẦN BẢNG (ARENA LADDER & HONOR STORE)
// ==========================================
const ARENA_OPPONENTS = [
    {
        rank: 1,
        id: "arena_1",
        name: "Cổ Thần Chân Nhân",
        title: "Thiên Hạ Đệ Nhất Kiếm",
        realm: "Hóa Thần Viên Mãn",
        realmIndex: 20,
        tier: 5,
        avatarIcon: "fa-crown",
        hp: 1200000,
        atk: 85000,
        def: 55000,
        crit: 35,
        cp: 1850000,
        quote: "Kiếm đạo của bản tọa xuất ra, vạn pháp tiêu tán!",
        rewardHonor: 150,
        rewardStones: 20000
    },
    {
        rank: 2,
        id: "arena_2",
        name: "Vạn Kiếm Tông Chủ",
        title: "Bát Hoang Kiếm Tôn",
        realm: "Hóa Thần Hậu Kỳ",
        realmIndex: 19,
        tier: 5,
        avatarIcon: "fa-khanda",
        hp: 850000,
        atk: 62000,
        def: 42000,
        crit: 30,
        cp: 1420000,
        quote: "Một kiếm chém rách nhật nguyệt, đạo hữu tiếp chiêu đi!",
        rewardHonor: 120,
        rewardStones: 15000
    },
    {
        rank: 3,
        id: "arena_3",
        name: "Huyết Ma Lão Tổ",
        title: "U Minh Huyết Hải Chủ",
        realm: "Hóa Thần Trung Kỳ",
        realmIndex: 18,
        tier: 5,
        avatarIcon: "fa-skull",
        hp: 680000,
        atk: 51000,
        def: 34000,
        crit: 25,
        cp: 1100000,
        quote: "Huyết nhục của ngươi sẽ là dưỡng chất cho ma bảo của ta!",
        rewardHonor: 100,
        rewardStones: 12000
    },
    {
        rank: 5,
        id: "arena_4",
        name: "Thanh Hư Đạo Nhân",
        title: "Nguyên Anh Tinh Tú",
        realm: "Nguyên Anh Đỉnh Phong",
        realmIndex: 15,
        tier: 4,
        avatarIcon: "fa-yin-yang",
        hp: 350000,
        atk: 28000,
        def: 19000,
        crit: 20,
        cp: 580000,
        quote: "Thuận theo tự nhiên, đạo pháp tự thành.",
        rewardHonor: 80,
        rewardStones: 8000
    },
    {
        rank: 10,
        id: "arena_5",
        name: "Bạch Hạc Tiên Tử",
        title: "Băng Tâm Kiếm Cơ",
        realm: "Nguyên Anh Sơ Kỳ",
        realmIndex: 13,
        tier: 4,
        avatarIcon: "fa-feather",
        hp: 180000,
        atk: 16000,
        def: 11000,
        crit: 18,
        cp: 320000,
        quote: "Băng sương ngưng kết, kiếm xuất vô ảnh.",
        rewardHonor: 60,
        rewardStones: 5000
    },
    {
        rank: 20,
        id: "arena_6",
        name: "Liệt Diễm Chân Tôn",
        title: "Xích Hỏa Cuồng Đao",
        realm: "Kim Đan Viên Mãn",
        realmIndex: 11,
        tier: 3,
        avatarIcon: "fa-fire",
        hp: 95000,
        atk: 8800,
        def: 5600,
        crit: 15,
        cp: 165000,
        quote: "Lửa giận ngút trời, thiêu rụi thiên địa!",
        rewardHonor: 45,
        rewardStones: 3000
    },
    {
        rank: 50,
        id: "arena_7",
        name: "Lâm Phong Tán Nhân",
        title: "Phong Lôi Kiếm Khách",
        realm: "Kim Đan Sơ Kỳ",
        realmIndex: 9,
        tier: 3,
        avatarIcon: "fa-wind",
        hp: 42000,
        atk: 4200,
        def: 2800,
        crit: 12,
        cp: 78000,
        quote: "Tốc độ là tất cả, kiếm nhanh tất thắng!",
        rewardHonor: 30,
        rewardStones: 1800
    },
    {
        rank: 100,
        id: "arena_8",
        name: "Thiết Giáp Tán Tu",
        title: "Bất Phá Đồng Bì",
        realm: "Trúc Cơ Viên Mãn",
        realmIndex: 7,
        tier: 2,
        avatarIcon: "fa-shield",
        hp: 18000,
        atk: 1800,
        def: 1600,
        crit: 8,
        cp: 32000,
        quote: "Phòng ngự của ta, ngay cả sấm sét cũng không xuyên thủng!",
        rewardHonor: 20,
        rewardStones: 1000
    }
];

const ARENA_SHOP_ITEMS = [
    {
        id: "arena_pill_dan",
        name: "Phong Thần Đột Phá Đan",
        cost: 150,
        count: 1,
        icon: "fa-pills",
        rarity: 4,
        desc: "Đan dược độc quyền Đấu Pháp Đài, tăng 100% tỷ lệ đột phá và gia tăng 50,000 Tu Vi."
    },
    {
        id: "arena_sword_fragment",
        name: "Phong Thần Kiếm Phù",
        cost: 200,
        count: 1,
        icon: "fa-khanda",
        rarity: 5,
        desc: "Lệnh phù ngưng tụ kiếm ý chiến thần, tăng vĩnh viễn +100 Công Kích."
    },
    {
        id: "arena_bead_talisman",
        name: "Thiên Cang Hộ Thể Châu",
        cost: 180,
        count: 1,
        icon: "fa-shield-halved",
        rarity: 4,
        desc: "Châu báu cổ xưa, tăng vĩnh viễn +80 Phòng Ngự và +800 Khí Huyết."
    },
    {
        id: "arena_pet_pill",
        name: "Vạn Thú Hóa Linh Đan",
        cost: 120,
        count: 3,
        icon: "fa-paw",
        rarity: 3,
        desc: "Thức ăn tiên phẩm nuôi dưỡng linh thú, tăng +500 EXP Linh Thú mỗi viên."
    },
    {
        id: "arena_jade_pack",
        name: "Hộp Tiên Ngọc Thượng Giới",
        cost: 100,
        count: 20,
        icon: "fa-diamond",
        rarity: 4,
        isCurrency: "jade",
        desc: "Mở nhận ngay 20 Tiên Ngọc Thượng Giới."
    },
    {
        id: "arena_stone_chest",
        name: "Bao Linh Thạch Cực Phẩm",
        cost: 60,
        count: 25000,
        icon: "fa-coins",
        rarity: 3,
        isCurrency: "stones",
        desc: "Nhận 25,000 Hạ Phẩm Linh Thạch."
    }
];

// ==========================================
// 4.8. HỆ THỐNG ĐẠO LỮ ĐỒNG TU CHI TIẾT
// ==========================================
const COMPANIONS_DATA = [
    {
        id: "daolv_1",
        name: "Lục Tuyết Nhi",
        title: "Băng Phách Tiên Tử",
        sect: "Thanh Vân Môn",
        physique: "Thiên Băng Chi Thể",
        affinity: 20,
        quote: "Đạo hữu, bế quan tu luyện chớ để tâm ma quấy nhiễu...",
        avatarIcon: "fa-user-nurse",
        avatar: "./assets/images/nu_tu_trong_suot.png",
        image: "./assets/images/nu_tu_trong_suot.png",
        bonusType: "def_hp",
        bonusDesc: "Tăng +8% Khí Huyết và giảm 5 Tâm Ma mỗi lần Song Tu",
        favoriteGift: "herb_spirit",
        giftText: "Đa tạ đạo hữu đã quan tâm Tuyết Nhi, linh khí quả thực rất thuần khiết!"
    },
    {
        id: "daolv_2",
        name: "Nam Cung Uyển",
        title: "Yểm Nguyệt Thánh Nữ",
        sect: "Yểm Nguyệt Tông",
        physique: "Thuần Âm Chi Thể",
        affinity: 40,
        quote: "Cùng người ngắm cảnh mây trời, đạo tâm tự tại...",
        avatarIcon: "fa-person-dress",
        avatar: "./assets/images/image_12.png",
        image: "./assets/images/image_12.png",
        bonusType: "exp_rate",
        bonusDesc: "Tăng +15% tốc độ hấp thu Linh Khí và tăng +10,000 Tu Vi khi Song Tu",
        favoriteGift: "herb_blood",
        giftText: "Món quà này của chàng... Uyển nhi nhất định sẽ trân quý ngàn đời."
    },
    {
        id: "daolv_3",
        name: "Tử Hinh Tiên Tử",
        title: "Huyền Băng Tiên Cô",
        sect: "Băng Phách Cung",
        physique: "Huyền Băng Linh Thể",
        affinity: 10,
        quote: "Thế gian tình ái như sương khói, duy có đạo tâm mới trường tồn.",
        avatarIcon: "fa-snowflake",
        avatar: "./assets/images/char_cultivator.jpg",
        image: "./assets/images/char_cultivator.jpg",
        bonusType: "atk_crit",
        bonusDesc: "Tăng +8% Công Kích và +3% Bạo Kích cho Bản Tôn",
        favoriteGift: "stone_ore",
        giftText: "Huyền Thiết Khoáng này chất lượng rất tốt, có thể gia cố pháp trận Băng Cung."
    },
    {
        id: "daolv_4",
        name: "Yến Như Yên",
        title: "Cửu U Ma Cơ",
        sect: "Ma Hỏa Tông",
        physique: "Cửu U Huyết Thể",
        affinity: 5,
        quote: "Ngươi dám cùng một ma nữ song tu, không sợ bị hút cạn tinh huyết sao?",
        avatarIcon: "fa-fire-flame-curved",
        avatar: "./assets/images/avatar_lone_cultivator.jpg",
        image: "./assets/images/avatar_lone_cultivator.jpg",
        bonusType: "lifesteal",
        bonusDesc: "Hồi phục 100% Khí Huyết và tăng +10% Sát Thương Bạo Kích",
        favoriteGift: "tu_khi_dan",
        giftText: "Hừ, đan dược coi như dùng được. Lần sau mang nhiều hơn tới gặp ta!"
    }
];

// ==========================================
// 4.9. HỆ THỐNG ĐẤU GIÁ HỘI TIÊN GIA (AUCTION LOTS DATA)
// ==========================================
const AUCTION_ITEMS = [
    {
        id: "auc_1",
        name: "Cửu Chuyển Hóa Thần Đan",
        type: "Đan Dược Chí Bảo",
        icon: "fa-pills",
        rarity: 6,
        startingBid: 20000,
        minStep: 2000,
        buyoutPrice: 120000,
        desc: "Đan dược cửu chuyển thượng phẩm giúp tăng 100% tỷ lệ đột phá và vĩnh viễn tăng +25,000 HP, +5,000 ATK.",
        rewardType: "stat_and_item",
        rewardData: { itemId: "pill_breakthrough_perfect", count: 2, hpBonus: 25000, atkBonus: 5000 },
        aiBidders: [
            { name: "Thanh Vân Chưởng Môn", maxBid: 65000, aggressiveness: 0.7 },
            { name: "Huyết Ma Tông Cẩu", maxBid: 85000, aggressiveness: 0.85 },
            { name: "Vạn Bảo Thương Nhân", maxBid: 110000, aggressiveness: 0.9 }
        ]
    },
    {
        id: "auc_2",
        name: "Bát Quái Hộ Thể Trận Đồ",
        type: "Trận Pháp Thần Đồ",
        icon: "fa-dharmachakra",
        rarity: 5,
        startingBid: 15000,
        minStep: 1500,
        buyoutPrice: 90000,
        desc: "Bản vẽ trận pháp viễn cổ hộ thể, tăng vĩnh viễn +50% tốc độ tu luyện chu thiên và +3,500 DEF.",
        rewardType: "stat_and_item",
        rewardData: { defBonus: 3500, idleRateBonus: 10 },
        aiBidders: [
            { name: "Cổ Thần Tán Tu", maxBid: 45000, aggressiveness: 0.6 },
            { name: "Thái Hư Trưởng Lão", maxBid: 70000, aggressiveness: 0.8 }
        ]
    },
    {
        id: "auc_3",
        name: "Hỗn Độn Kiếm Quyết (Tàn Thiên)",
        type: "Thần Cấp Công Pháp",
        icon: "fa-scroll",
        rarity: 6,
        startingBid: 30000,
        minStep: 3000,
        buyoutPrice: 180000,
        desc: "Công pháp đệ nhất sát phạt thượng giới, tăng +15,000 ATK và +15% Tỷ Lệ Bạo Kích.",
        rewardType: "skill",
        rewardData: { skillId: "skill_chaos_sword", atkBonus: 15000, critBonus: 15 },
        aiBidders: [
            { name: "Vạn Kiếm Tông Chủ", maxBid: 140000, aggressiveness: 0.95 },
            { name: "Thiên Kiếm Chân Quân", maxBid: 160000, aggressiveness: 0.9 }
        ]
    },
    {
        id: "auc_4",
        name: "Huyền Vũ Thần Thuẫn",
        type: "Bản Mệnh Pháp Bảo",
        icon: "fa-shield-halved",
        rarity: 5,
        startingBid: 25000,
        minStep: 2500,
        buyoutPrice: 130000,
        desc: "Lá chắn rèn từ mai rùa Huyền Vũ ngàn năm, hấp thụ 30% sát thương chí mạng.",
        rewardType: "equipment",
        rewardData: { itemId: "artifact_turtle_shield", defBonus: 6000, hpBonus: 40000 },
        aiBidders: [
            { name: "Băng Phách Tiên Cô", maxBid: 80000, aggressiveness: 0.75 },
            { name: "Vô Nhai Lão Tổ", maxBid: 115000, aggressiveness: 0.85 }
        ]
    },
    {
        id: "auc_5",
        name: "Thiên Ngoại Hỗn Độn Thạch",
        type: "Tiên Thiên Linh Vật",
        icon: "fa-gem",
        rarity: 6,
        startingBid: 40000,
        minStep: 5000,
        buyoutPrice: 250000,
        desc: "Viên đá rơi từ ngoại vực hư không, ẩn chứa 200 Tiên Ngọc và 100,000 Tu Vi thuần khiết.",
        rewardType: "currency",
        rewardData: { jade: 200, exp: 100000, stones: 50000 },
        aiBidders: [
            { name: "Cổ Thần Chân Nhân", maxBid: 210000, aggressiveness: 0.95 },
            { name: "Thiên Mệnh Chi Tử", maxBid: 190000, aggressiveness: 0.9 }
        ]
    }
];

// ==========================================
// 4.10. HỆ THỐNG TỨ ĐẠI THẦN THÚ HỘ MỆNH (DIVINE PETS)
// ==========================================
const DIVINE_PETS_DATA = [
    {
        id: "fox",
        name: "Cửu Vĩ Thiên Hồ",
        title: "Thần Thú Hộ Tộc",
        element: "Hỏa",
        icon: "fa-paw",
        image: "./assets/images/pet_fox.jpg",
        baseCp: 12500,
        baseHp: 5000,
        baseAtk: 1200,
        baseDef: 800,
        skillName: "Hồ Hồn Hộ Thể",
        skillDesc: "Tạo màn chắn hư vô hấp thụ 40% sát thương khi HP chủ nhân < 30%.",
        colorTheme: "from-pink-950/50 via-purple-950/40 to-slate-900",
        borderColor: "border-pink-500/40",
        textColor: "text-pink-300"
    },
    {
        id: "dragon",
        name: "Băng Lôi Giao Long",
        title: "Viễn Cổ Chân Long",
        element: "Lôi",
        icon: "fa-dragon",
        image: "./assets/images/pet_fox.jpg",
        baseCp: 16000,
        baseHp: 6500,
        baseAtk: 1800,
        baseDef: 1100,
        skillName: "Cửu Thiên Thần Lôi",
        skillDesc: "Gây sát thương Lôi Điện bằng 80% ATK và gây tê liệt đối thủ.",
        colorTheme: "from-cyan-950/50 via-blue-950/40 to-slate-900",
        borderColor: "border-cyan-500/40",
        textColor: "text-cyan-300"
    },
    {
        id: "phoenix",
        name: "Chu Tước Hỏa Phượng",
        title: "Bất Tử Thần Điểu",
        element: "Hỏa",
        icon: "fa-dove",
        image: "./assets/images/pet_fox.jpg",
        baseCp: 18000,
        baseHp: 4800,
        baseAtk: 2200,
        baseDef: 900,
        skillName: "Niết Bàn Trọng Sinh",
        skillDesc: "Hồi sinh 50% HP khi chủ nhân tử trận trong chiến đấu (1 lần/trận).",
        colorTheme: "from-amber-950/50 via-red-950/40 to-slate-900",
        borderColor: "border-amber-500/40",
        textColor: "text-amber-300"
    },
    {
        id: "turtle",
        name: "Huyền Minh Thần Quy",
        title: "Bắc Hải Thánh Thú",
        element: "Thủy",
        icon: "fa-shield-halved",
        image: "./assets/images/pet_fox.jpg",
        baseCp: 14000,
        baseHp: 9000,
        baseAtk: 950,
        baseDef: 2400,
        skillName: "Bắc Minh Hộ Thể",
        skillDesc: "Phản lại 25% sát thương nhận vào cho kẻ địch.",
        colorTheme: "from-emerald-950/50 via-teal-950/40 to-slate-900",
        borderColor: "border-emerald-500/40",
        textColor: "text-emerald-300"
    }
];

// ==========================================
// 4.10.1. HUYẾT MẠCH & TIẾN HÓA THẦN THÚ BẬC CAO (PET BLOODLINE TIERS)
// ==========================================
const PET_BLOODLINE_TIERS = [
    {
        tier: 1,
        name: "Ấu Niên Thể",
        badge: "Ấu Niên",
        auraColor: "rgba(148, 163, 184, 0.4)",
        colorClass: "text-slate-300 border-slate-600 bg-slate-900/60",
        reqLevel: 1,
        costStones: 0,
        costJade: 0,
        atkMult: 1.0,
        defMult: 1.0,
        hpMult: 1.0,
        idleBonus: 0,
        desc: "Linh thú thời kỳ ấu thơ, huyết mạch sơ khai đang ngưng tụ."
    },
    {
        tier: 2,
        name: "Thành Niên Khí",
        badge: "Thành Niên",
        auraColor: "rgba(52, 211, 153, 0.5)",
        colorClass: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
        reqLevel: 5,
        costStones: 15000,
        costJade: 50,
        atkMult: 1.3,
        defMult: 1.3,
        hpMult: 1.3,
        idleBonus: 0.05,
        desc: "Yêu lực đại thịnh, gân cốt cứng cáp, gia tăng 30% thuộc tính linh thú và +5% Tốc độ Tu Vi."
    },
    {
        tier: 3,
        name: "Thần Thú Biến",
        badge: "Thần Hóa",
        auraColor: "rgba(168, 85, 247, 0.6)",
        colorClass: "text-purple-300 border-purple-500/50 bg-purple-950/60",
        reqLevel: 10,
        costStones: 60000,
        costJade: 200,
        atkMult: 1.7,
        defMult: 1.7,
        hpMult: 1.7,
        idleBonus: 0.12,
        desc: "Thần uy thức tỉnh, hào quang lượn quanh, tăng 70% thuộc tính linh thú, +12% Tốc độ Tu Vi và trợ chiến mỗi 2 hiệp!"
    },
    {
        tier: 4,
        name: "Thái Cổ Thánh Thú",
        badge: "Thái Cổ",
        auraColor: "rgba(245, 158, 11, 0.8)",
        colorClass: "text-amber-300 border-amber-500/60 bg-amber-950/70 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
        reqLevel: 15,
        costStones: 200000,
        costJade: 500,
        atkMult: 2.3,
        defMult: 2.3,
        hpMult: 2.3,
        idleBonus: 0.20,
        desc: "Cực cảnh Hồng Hoang, khí tức chấn nhiếp bát hoang, tăng 130% thuộc tính linh thú, +20% Tốc độ Tu Vi và áp chế Boss Bí Cảnh!"
    }
];

// ==========================================
// 4.11. HỆ THỐNG HỌA PHÙ & PHÙ LỤC TIÊN GIA (TALISMANS CONFIG)
// ==========================================
const TALISMANS_CONFIG = [
    {
        id: "lightning",
        name: "Lôi Chấn Phù",
        icon: "fa-bolt",
        rarity: 4,
        color: "text-amber-400",
        border: "border-amber-500/40",
        bg: "bg-amber-950/80",
        cost: 500,
        desc: "Kích hoạt lôi điện cuồng nộ đánh phá kinh mạch, tăng +5,000 ATK tức thời trong 3 phút.",
        effectType: "buff_atk",
        effectVal: 5000,
        durationMs: 180000
    },
    {
        id: "shield",
        name: "Kim Cương Phù",
        icon: "fa-shield",
        rarity: 4,
        color: "text-cyan-400",
        border: "border-cyan-500/40",
        bg: "bg-cyan-950/80",
        cost: 500,
        desc: "Ngưng kết kim cương cương khí hộ thể, lập tức hồi phục 50% Khí Huyết và tăng +3,000 DEF.",
        effectType: "heal_and_def",
        effectVal: 3000,
        durationMs: 180000
    },
    {
        id: "speed",
        name: "Thần Hành Phù",
        icon: "fa-wind",
        rarity: 3,
        color: "text-emerald-400",
        border: "border-emerald-500/40",
        bg: "bg-emerald-950/80",
        cost: 400,
        desc: "Hóa thân ngự phong thần tốc, tăng +35% tốc độ tu luyện chu thiên trong 5 phút.",
        effectType: "buff_cultivation_rate",
        effectVal: 35,
        durationMs: 300000
    },
    {
        id: "calm",
        name: "Thanh Tâm Phù",
        icon: "fa-yin-yang",
        rarity: 5,
        color: "text-purple-400",
        border: "border-purple-500/40",
        bg: "bg-purple-950/80",
        cost: 600,
        desc: "Thanh lọc tâm ma cấu uế, lập tức hồi phục +25 Đạo Tâm và tịnh hóa kinh mạch.",
        effectType: "restore_daotam",
        effectVal: 25,
        durationMs: 0
    }
];

// ==========================================
// 4.12. HỆ THỐNG PHÂN THẦN HÓA THÂN (AVATARS DATA)
// ==========================================
const AVATARS_DATA = [
    {
        id: "avatar_sword",
        name: "Kiếm Đạo Hóa Thân",
        title: "Vạn Kiếm Quy Tông",
        icon: "fa-khanda",
        color: "text-amber-400",
        theme: "from-amber-950/50 via-slate-900 to-slate-950",
        missionName: "Thám Hiểm Hư Không Vực",
        durationSec: 180,
        baseStones: 12000,
        baseExp: 25000,
        bonusItem: { id: "stone_ore", name: "Huyền Thiết Khoáng", count: 4, icon: "fa-cubes-stacked" },
        desc: "Phân thân ngưng kết từ kiếm ý sắc bén, tung hoành hư không trảm quái đoạt khoáng thạch."
    },
    {
        id: "avatar_alchemy",
        name: "Đan Đạo Hóa Thân",
        title: "Bách Thảo Luyện Hóa",
        icon: "fa-fire-burner",
        color: "text-emerald-400",
        theme: "from-emerald-950/50 via-slate-900 to-slate-950",
        missionName: "Luyện Hóa Linh Dược Thượng Giới",
        durationSec: 300,
        baseStones: 8000,
        baseExp: 35000,
        bonusItem: { id: "herb_spirit", name: "Linh Dược Thảo", count: 6, icon: "fa-seedling" },
        desc: "Phân thân tinh thông dược lý, bế quan tại Đan Thất chiết xuất tinh hoa đất trời."
    },
    {
        id: "avatar_soul",
        name: "Thần Thức Hóa Thân",
        title: "Bắc Minh Ngưng Thần",
        icon: "fa-om",
        color: "text-cyan-400",
        theme: "from-cyan-950/50 via-slate-900 to-slate-950",
        missionName: "Tham Ngộ Cực Bắc Tinh Không",
        durationSec: 420,
        baseStones: 15000,
        baseExp: 50000,
        daoTamGain: 15,
        bonusItem: { id: "pill_breakthrough_perfect", name: "Hộ Tâm Đan", count: 1, icon: "fa-pills" },
        desc: "Phân thân thần thức viễn du thiên ngoại, hấp thu tinh hoa nhật nguyệt bồi dưỡng Đạo Tâm."
    }
];

// ==========================================
// 4.13. HỆ THỐNG THÀNH TỰU THIÊN ĐẠO (ACHIEVEMENTS CONFIG)
// ==========================================
const ACHIEVEMENTS_CONFIG = [
    // 1. CẢNH GIỚI TU CHÂN
    {
        id: "ach_realm_1",
        category: "realm",
        categoryName: "Cảnh Giới",
        title: "Sơ Nhập Tiên Đồ",
        desc: "Đạt đến cảnh giới Luyện Khí Tầng 3",
        icon: "fa-seedling",
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-950/40",
        reward: { stones: 1000, jade: 30, title: "Sơ Nhập Tiên Đồ", statDesc: "+5% Tốc Độ Tu Luyện", statBonus: { cultivationRate: 5 } }
    },
    {
        id: "ach_realm_2",
        category: "realm",
        categoryName: "Cảnh Giới",
        title: "Trúc Cơ Đại Thành",
        desc: "Đột phá thành công cảnh giới Trúc Cơ Kỳ",
        icon: "fa-mountain",
        color: "text-sky-400",
        border: "border-sky-500/30",
        bg: "bg-sky-950/40",
        reward: { stones: 3000, jade: 80, title: "Trúc Cơ Thượng Nhân", statDesc: "+5% Phòng Ngự Cơ Bản", statBonus: { defPercent: 5 } }
    },
    {
        id: "ach_realm_3",
        category: "realm",
        categoryName: "Cảnh Giới",
        title: "Ngưng Kết Kim Đan",
        desc: "Đột phá thành công cảnh giới Kim Đan Kỳ",
        icon: "fa-sun",
        color: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-950/40",
        reward: { stones: 8000, jade: 150, title: "Kim Đan Chân Quân", statDesc: "+8% Công Kích Cơ Bản", statBonus: { atkPercent: 8 } }
    },
    {
        id: "ach_realm_4",
        category: "realm",
        categoryName: "Cảnh Giới",
        title: "Nguyên Anh Tôn Giả",
        desc: "Đột phá thành công cảnh giới Nguyên Anh Kỳ",
        icon: "fa-dharmachakra",
        color: "text-purple-400",
        border: "border-purple-500/30",
        bg: "bg-purple-950/40",
        reward: { stones: 20000, jade: 300, title: "Nguyên Anh Lão Tổ", statDesc: "+10% Khí Huyết Tối Đa", statBonus: { hpPercent: 10 } }
    },
    {
        id: "ach_realm_5",
        category: "realm",
        categoryName: "Cảnh Giới",
        title: "Hóa Thần Chi Cảnh",
        desc: "Bước chân vào cảnh giới Hóa Thần Kỳ thông thiên triệt địa",
        icon: "fa-yin-yang",
        color: "text-rose-400",
        border: "border-rose-500/30",
        bg: "bg-rose-950/40",
        reward: { stones: 50000, jade: 600, title: "Hóa Thần Đại Năng", statDesc: "+12% Toàn Bộ Thuộc Tính", statBonus: { allStatsPercent: 12 } }
    },

    // 2. CHIẾN ĐẤU & BÍ CẢNH
    {
        id: "ach_combat_first",
        category: "combat",
        categoryName: "Chiến Đấu",
        title: "Trảm Yêu Sơ Thí",
        desc: "Vượt qua Bí Cảnh Đầm Lầy Hắc Thủy lần đầu tiên",
        icon: "fa-swords",
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-950/40",
        reward: { stones: 1200, jade: 40, title: "Trảm Yêu Dũng Sĩ", statDesc: "+50 Công Kích", statBonus: { atk: 50 } }
    },
    {
        id: "ach_combat_ten",
        category: "combat",
        categoryName: "Chiến Đấu",
        title: "Bách Chiến Thần Binh",
        desc: "Chiến thắng hoặc càn quét Bí Cảnh tổng cộng 10 lần",
        icon: "fa-skull-crossbones",
        color: "text-rose-400",
        border: "border-rose-500/30",
        bg: "bg-rose-950/40",
        reward: { stones: 5000, jade: 100, title: "Bách Chiến Tiên Tôn", statDesc: "+5% Sát Thương Vật Lý", statBonus: { physicalDamagePercent: 5 } }
    },
    {
        id: "ach_combat_dungeon_4",
        category: "combat",
        categoryName: "Chiến Đấu",
        title: "Trấn Ma Xuất Thế",
        desc: "Chinh phục Bí Cảnh Trấn Ma Tháp Tầng 10",
        icon: "fa-torii-gate",
        color: "text-violet-400",
        border: "border-violet-500/30",
        bg: "bg-violet-950/40",
        reward: { stones: 15000, jade: 250, title: "Trấn Ma Chân Nhân", statDesc: "+150 Phòng Ngự", statBonus: { def: 150 } }
    },
    {
        id: "ach_arena_top",
        category: "combat",
        categoryName: "Chiến Đấu",
        title: "Phong Thần Đăng Đỉnh",
        desc: "Vươn lên Top 50 bảng xếp hạng Đấu Pháp Đài",
        icon: "fa-trophy",
        color: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-950/40",
        reward: { stones: 18000, jade: 200, title: "Đấu Pháp Cuồng Ma", statDesc: "+5% Tỷ Lệ Bạo Kích", statBonus: { crit: 5 } }
    },

    // 3. TIÊN TÀI & PHƯỜNG THỊ
    {
        id: "ach_wealth_1",
        category: "wealth",
        categoryName: "Tiên Tài",
        title: "Tích Tiểu Thành Đại",
        desc: "Sở hữu cùng lúc hơn 10,000 Linh Thạch",
        icon: "fa-coins",
        color: "text-yellow-400",
        border: "border-yellow-500/30",
        bg: "bg-yellow-950/40",
        reward: { stones: 3000, jade: 50, title: "Tiểu Phú Hào", statDesc: "+3% Tốc Độ Tu Luyện", statBonus: { cultivationRate: 3 } }
    },
    {
        id: "ach_wealth_2",
        category: "wealth",
        categoryName: "Tiên Tài",
        title: "Vạn Bảo Cự Phú",
        desc: "Sở hữu cùng lúc hơn 100,000 Linh Thạch",
        icon: "fa-gem",
        color: "text-cyan-400",
        border: "border-cyan-500/30",
        bg: "bg-cyan-950/40",
        reward: { stones: 25000, jade: 300, title: "Vạn Bảo Phú Hào", statDesc: "+10% Tốc Độ Tu Luyện", statBonus: { cultivationRate: 10 } }
    },
    {
        id: "ach_auction_win",
        category: "wealth",
        categoryName: "Tiên Tài",
        title: "Nhất Trịch Thiên Kim",
        desc: "Đấu giá thắng ít nhất 1 trân bảo quý giá tại Đấu Giá Hội",
        icon: "fa-gavel",
        color: "text-amber-300",
        border: "border-amber-500/30",
        bg: "bg-amber-950/40",
        reward: { stones: 8000, jade: 150, title: "Kỳ Trân Cự Phách", statDesc: "+4% Phòng Ngự Toàn Thân", statBonus: { defPercent: 4 } }
    },

    // 4. TIÊN NGHỆ & ĐẠO LỮ
    {
        id: "ach_pet_grow",
        category: "arts",
        categoryName: "Tiên Nghệ",
        title: "Ngự Thú Tinh Thông",
        desc: "Bồi dưỡng Linh Thú Hộ Tộc đạt đến Cấp 5",
        icon: "fa-dragon",
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-950/40",
        reward: { stones: 6000, jade: 100, title: "Ngự Thú Tông Sư", statDesc: "+80 Công Kích", statBonus: { atk: 80 } }
    },
    {
        id: "ach_companion_bond",
        category: "arts",
        categoryName: "Tiên Nghệ",
        title: "Tiên Lữ Đồng Tâm",
        desc: "Nâng độ thân mật của bất kỳ Đạo Lữ nào lên 30 điểm",
        icon: "fa-heart",
        color: "text-pink-400",
        border: "border-pink-500/30",
        bg: "bg-pink-950/40",
        reward: { stones: 7000, jade: 120, title: "Tiên Lữ Tình Thâm", statDesc: "+600 Khí Huyết Tối Đa", statBonus: { hp: 600 } }
    },
    {
        id: "ach_talisman_master",
        category: "arts",
        categoryName: "Tiên Nghệ",
        title: "Phù Đạo Đại Sư",
        desc: "Vẽ thành công tổng cộng 5 lá Linh Phù tại Họa Phù Các",
        icon: "fa-scroll",
        color: "text-amber-300",
        border: "border-amber-500/30",
        bg: "bg-amber-950/40",
        reward: { stones: 5000, jade: 100, title: "Phù Lục Chân Sư", statDesc: "+5% Công Kích", statBonus: { atkPercent: 5 } }
    },
    {
        id: "ach_avatar_expedition",
        category: "arts",
        categoryName: "Tiên Nghệ",
        title: "Ngoại Thân Hóa Thần",
        desc: "Phân Thần hoàn thành 3 chuyến Du Ngoạn Thám Hiểm",
        icon: "fa-person-walking-arrow-right",
        color: "text-indigo-400",
        border: "border-indigo-500/30",
        bg: "bg-indigo-950/40",
        reward: { stones: 6000, jade: 120, title: "Thiên Lý Hóa Thần", statDesc: "+5% Tốc Độ Tu Luyện", statBonus: { cultivationRate: 5 } }
    }
];

// ==========================================
// 4.14. HỆ THỐNG DỊ TƯỢNG THIÊN ĐỊA (CELESTIAL OMENS)
// ==========================================
const CELESTIAL_OMENS_CONFIG = [
    {
        id: "tu_khi_dong_lai",
        name: "Tử Khí Đông Lai",
        tag: "Cát Tường Vạn Dặm",
        icon: "fa-cloud-sun",
        color: "text-purple-300",
        border: "border-purple-500/40",
        bg: "bg-purple-950/80",
        ambientAura: "rgba(168, 85, 247, 0.25)",
        desc: "Tử khí ngàn dặm cuồn cuộn từ phương đông, điềm lành hiển hiện khắp chư thiên vạn giới.",
        buffDesc: "+50% Tốc Độ Tu Luyện • +15% Tỷ Lệ Đột Phá Cảnh Giới",
        effects: {
            cultivationRateMult: 1.50,
            breakthroughBonus: 15
        }
    },
    {
        id: "huyet_nguyet_chi_da",
        name: "Huyết Nguyệt Chi Dạ",
        tag: "Ma Khí Ngập Trời",
        icon: "fa-moon",
        color: "text-rose-400",
        border: "border-rose-500/40",
        bg: "bg-rose-950/80",
        ambientAura: "rgba(244, 63, 94, 0.25)",
        desc: "Vầng trăng nhuốm máu u ám, sát khí tràn ngập càn khôn, ma tu quật khởi, chiến ý sục sôi.",
        buffDesc: "+35% Sát Thương Công Kích • +10% Bạo Kích • +50% Linh Thạch Rơi Từ Bí Cảnh",
        effects: {
            atkMult: 1.35,
            critBonus: 10,
            dungeonStoneMult: 1.50
        }
    },
    {
        id: "cuu_thien_cuong_loi",
        name: "Cửu Thiên Cuồng Lôi",
        tag: "Thiên Uy Hàng Thế",
        icon: "fa-cloud-bolt",
        color: "text-amber-300",
        border: "border-amber-500/40",
        bg: "bg-amber-950/80",
        ambientAura: "rgba(245, 158, 11, 0.25)",
        desc: "Lôi vân ngập trời vần vũ, thiên uy cuồng bạo tôi luyện đạo tâm và kinh mạch tu sĩ.",
        buffDesc: "+25% Sát Thương Phù Chú • Giảm 20% Uy Lực Thiên Kiếp • +20% Phòng Ngự",
        effects: {
            defMult: 1.20,
            talismanEffectMult: 1.25,
            tribulationResistBonus: 20
        }
    },
    {
        id: "van_hoa_linh_tiet",
        name: "Vạn Hoa Linh Tiết",
        tag: "Vạn Vật Khai Hoa",
        icon: "fa-seedling",
        color: "text-emerald-300",
        border: "border-emerald-500/40",
        bg: "bg-emerald-950/80",
        ambientAura: "rgba(16, 185, 129, 0.25)",
        desc: "Mưa xuân tiên giới tưới mát linh điền, vạn vật hồi sinh, dược hương thơm ngát trăm dặm.",
        buffDesc: "+100% Sản Lượng Dược Thảo Linh Điền • Hồi Phục Khí Huyết Tự Động x2",
        effects: {
            farmYieldMult: 2.0,
            hpRegenMult: 2.0
        }
    },
    {
        id: "that_tinh_tu_hoi",
        name: "Thất Tinh Tụ Hội",
        tag: "Tinh Thần Chi Lực",
        icon: "fa-star-and-crescent",
        color: "text-cyan-300",
        border: "border-cyan-500/40",
        bg: "bg-cyan-950/80",
        ambientAura: "rgba(6, 182, 212, 0.25)",
        desc: "Bảy ngôi cổ tinh xếp thẳng hàng chiếu rọi tinh hoa hư không xuống trần thế.",
        buffDesc: "-40% Thời Gian Phân Thần Du Ngoạn • +25 Đạo Tâm • Miễn Phí Đổi Phường Thị",
        effects: {
            avatarSpeedMult: 1.40,
            daoTamGainBonus: 25
        }
    }
];

// ==========================================
// 4.15. HỆ THỐNG BẢN MỆNH THẦN THÔNG (DIVINE TECHNIQUES)
// ==========================================
const DIVINE_TECHNIQUES_CONFIG = [
    {
        id: "van_kiem_quy_tong",
        name: "Vạn Kiếm Quy Tông",
        icon: "fa-khanda",
        element: "metal",
        color: "text-amber-400",
        border: "border-amber-500/40",
        bg: "bg-amber-950/60",
        reqSkillId: "skill_sword",
        reqSkillLevel: 5,
        costStones: 25000,
        costJade: 80,
        desc: "Dung hợp đỉnh cao kiếm ý, ngưng tụ vạn thanh kiếm khí vô hình. Tăng vĩnh viễn +18% Sát Thương Vật Lý và +8% Bạo Kích.",
        statBonus: { physicalDamagePercent: 18, crit: 8 }
    },
    {
        id: "bat_diet_than_the",
        name: "Bất Diệt Cửu Chuyển Thần Thể",
        icon: "fa-shield-halved",
        element: "earth",
        color: "text-yellow-400",
        border: "border-yellow-500/40",
        bg: "bg-yellow-950/60",
        reqSkillId: "skill_body",
        reqSkillLevel: 5,
        costStones: 25000,
        costJade: 80,
        desc: "Kim thân bất hoại, gân cốt hóa lưu ly. Tăng vĩnh viễn +20% Phòng Ngự và +15% Khí Huyết Tối Đa.",
        statBonus: { defPercent: 20, hpPercent: 15 }
    },
    {
        id: "thai_thuong_dong_khi",
        name: "Thái Thượng Hỗn Nguyên Khí",
        icon: "fa-om",
        element: "wood",
        color: "text-emerald-400",
        border: "border-emerald-500/40",
        bg: "bg-emerald-950/60",
        reqSkillId: "skill_breath",
        reqSkillLevel: 5,
        costStones: 25000,
        costJade: 80,
        desc: "Thổ nạp linh khí cửu thiên, hòa nhập vào thiên địa đạo vận. Tăng vĩnh viễn +25% Tốc Độ Tu Luyện Chu Thiên.",
        statBonus: { cultivationRate: 25 }
    },
    {
        id: "cuu_tieu_loi_kich",
        name: "Cửu Tiêu Lôi Động",
        icon: "fa-bolt-lightning",
        element: "thunder",
        color: "text-purple-400",
        border: "border-purple-500/40",
        bg: "bg-purple-950/60",
        reqSkillId: "skill_thunder",
        reqSkillLevel: 3,
        costStones: 35000,
        costJade: 120,
        desc: "Dẫn động lôi đình chín tầng trời giáng đòn hủy diệt. Tăng vĩnh viễn +120 Công Kích và +10% Tỷ Lệ Bạo Kích.",
        statBonus: { atk: 120, crit: 10 }
    }
];

if (typeof window !== 'undefined') {
    window.DUNGEONS = DUNGEONS;
    window.ACHIEVEMENTS_CONFIG = ACHIEVEMENTS_CONFIG;
    window.CELESTIAL_OMENS_CONFIG = CELESTIAL_OMENS_CONFIG;
    window.DIVINE_TECHNIQUES_CONFIG = DIVINE_TECHNIQUES_CONFIG;
    window.DEMON_TOWER_MONSTERS = DEMON_TOWER_MONSTERS;
    window.TOWER_REALM_NAMES = TOWER_REALM_NAMES;
    window.DEMON_TOWER_TIERS_CONFIG = DEMON_TOWER_TIERS_CONFIG;
    window.DemonTowerData = DemonTowerData;
    window.calculateCombatDamage = calculateCombatDamage;
    window.getDemonTowerMonster = getDemonTowerMonster;
    window.calculateMonsterCombatPower = calculateMonsterCombatPower;
    window.TOWER_MILESTONES = TOWER_MILESTONES;
    window.ARENA_OPPONENTS = ARENA_OPPONENTS;
    window.ARENA_SHOP_ITEMS = ARENA_SHOP_ITEMS;
    window.COMPANIONS_DATA = COMPANIONS_DATA;
    window.AUCTION_ITEMS = AUCTION_ITEMS;
    window.DIVINE_PETS_DATA = DIVINE_PETS_DATA;
    window.PET_BLOODLINE_TIERS = PET_BLOODLINE_TIERS;
    window.TALISMANS_CONFIG = TALISMANS_CONFIG;
    window.AVATARS_DATA = AVATARS_DATA;
}
if (typeof globalThis !== 'undefined') {
    globalThis.DUNGEONS = DUNGEONS;
    globalThis.ACHIEVEMENTS_CONFIG = ACHIEVEMENTS_CONFIG;
    globalThis.CELESTIAL_OMENS_CONFIG = CELESTIAL_OMENS_CONFIG;
    globalThis.DIVINE_TECHNIQUES_CONFIG = DIVINE_TECHNIQUES_CONFIG;
    globalThis.DEMON_TOWER_MONSTERS = DEMON_TOWER_MONSTERS;
    globalThis.TOWER_REALM_NAMES = TOWER_REALM_NAMES;
    globalThis.DEMON_TOWER_TIERS_CONFIG = DEMON_TOWER_TIERS_CONFIG;
    globalThis.DemonTowerData = DemonTowerData;
    globalThis.calculateCombatDamage = calculateCombatDamage;
    globalThis.getDemonTowerMonster = getDemonTowerMonster;
    globalThis.calculateMonsterCombatPower = calculateMonsterCombatPower;
    globalThis.TOWER_MILESTONES = TOWER_MILESTONES;
    globalThis.ARENA_OPPONENTS = ARENA_OPPONENTS;
    globalThis.ARENA_SHOP_ITEMS = ARENA_SHOP_ITEMS;
    globalThis.COMPANIONS_DATA = COMPANIONS_DATA;
    globalThis.AUCTION_ITEMS = AUCTION_ITEMS;
    globalThis.DIVINE_PETS_DATA = DIVINE_PETS_DATA;
    globalThis.PET_BLOODLINE_TIERS = PET_BLOODLINE_TIERS;
    globalThis.TALISMANS_CONFIG = TALISMANS_CONFIG;
    globalThis.AVATARS_DATA = AVATARS_DATA;
}

// 5. TRẠNG THÁI MẶC ĐỊNH (DEFAULT_STATE) - KHỞI ĐẦU TỪ CON SỐ 0
const CULTIVATION_AVATAR_RAW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 240" width="220" height="240">
  <defs>
    <linearGradient id="robeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="lotusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="50%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <circle cx="110" cy="88" r="28" fill="none" stroke="#fde047" stroke-width="1.2" opacity="0.65" stroke-dasharray="4 2"/>
  <path d="M70,125 C30,95 20,145 45,165" fill="none" stroke="url(#lotusGrad)" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
  <path d="M150,125 C190,95 200,145 175,165" fill="none" stroke="url(#lotusGrad)" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
  <ellipse cx="110" cy="204" rx="76" ry="18" fill="rgba(20, 184, 166, 0.2)" stroke="url(#lotusGrad)" stroke-width="1.5"/>
  <ellipse cx="110" cy="200" rx="58" ry="12" fill="#0f3d39" stroke="#d4af37" stroke-width="1.2"/>
  <path d="M55,198 Q75,180 95,198" fill="#115e59" stroke="#5eead4" stroke-width="1"/>
  <path d="M125,198 Q145,180 165,198" fill="#115e59" stroke="#5eead4" stroke-width="1"/>
  <path d="M85,202 Q110,178 135,202" fill="#134e4a" stroke="#fde047" stroke-width="1.2"/>
  <path d="M66,195 C56,155 72,118 110,118 C148,118 164,155 154,195 Z" fill="url(#robeGrad)" stroke="#2dd4bf" stroke-width="1.8"/>
  <path d="M76,125 C50,145 48,180 72,190" fill="#0f172a" stroke="#2dd4bf" stroke-width="1.4"/>
  <path d="M144,125 C170,145 172,180 148,190" fill="#0f172a" stroke="#2dd4bf" stroke-width="1.4"/>
  <path d="M90,119 L110,150 L130,119" fill="none" stroke="#d4af37" stroke-width="3"/>
  <path d="M110,150 L110,195" fill="none" stroke="#d4af37" stroke-width="2.2"/>
  <rect x="82" y="158" width="56" height="6" rx="3" fill="#b48a1e" stroke="#fde047" stroke-width="0.8"/>
  <path d="M56,192 Q110,210 164,192" fill="none" stroke="#cbd5e1" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="110" cy="168" r="9" fill="#2dd4bf" opacity="0.6"/>
  <circle cx="110" cy="168" r="5.5" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/>
  <circle cx="110" cy="90" r="21" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.2"/>
  <path d="M89,86 C90,68 130,68 131,86 C125,74 95,74 89,86 Z" fill="#0f172a"/>
  <path d="M99,91 Q103,94 107,91" fill="none" stroke="#334155" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M113,91 Q117,94 121,91" fill="none" stroke="#334155" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M110,81 L108.5,85 L110,87 L111.5,85 Z" fill="#ef4444"/>
  <ellipse cx="110" cy="65" rx="10" ry="8" fill="#0f172a" stroke="#d4af37" stroke-width="1.4"/>
  <line x1="93" y1="65" x2="127" y2="65" stroke="#2dd4bf" stroke-width="2.8" stroke-linecap="round"/>
</svg>`;
const DEFAULT_CULTIVATION_AVATAR = './assets/images/image_11.png';
window.DEFAULT_CULTIVATION_AVATAR = DEFAULT_CULTIVATION_AVATAR;

// ============================================================================
// HỆ THỐNG TÔNG MÔN HẠ GIỚI (SECTS SYSTEM DATA)
// ============================================================================
const SECTS_DATA = {
    thanh_van: {
        id: "thanh_van",
        name: "Thanh Vân Môn",
        alignment: "Chính Đạo",
        theme: "sky",
        colorClass: "text-sky-300",
        borderClass: "border-sky-500/50",
        bgClass: "bg-sky-950/40",
        badgeBg: "bg-sky-900/60 text-sky-200 border-sky-400/50",
        icon: "fa-mountain-sun",
        buffType: "hp",
        buffPercent: 0.10,
        buffDesc: "Buff: +10% Khí Huyết (HP) Tối Đa",
        slogan: "Linh phong thiên trượng, chính khí trường tồn.",
        desc: "Chính Đạo danh môn đệ nhất Hạ Giới, lấy phòng ngự dưỡng sinh làm gốc, đạo tâm kiên định, sinh mệnh dồi dào."
    },
    huyet_hon: {
        id: "huyet_hon",
        name: "Huyết Hồn Cốc",
        alignment: "Ma Đạo",
        theme: "rose",
        colorClass: "text-rose-400",
        borderClass: "border-rose-600/50",
        bgClass: "bg-rose-950/40",
        badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/50",
        icon: "fa-skull-crossbones",
        buffType: "atk",
        buffPercent: 0.10,
        buffDesc: "Buff: +10% Công Kích (ATK)",
        slogan: "Huyết sát ngút trời, dĩ sát chỉ sát.",
        desc: "Ma Đạo tông phái hung danh hiển hách, ngưng tụ sát khí rèn luyện thân thể, tấn công bạo liệt tuyệt luân."
    },
    tan_tu: {
        id: "tan_tu",
        name: "Tán Tu Minh",
        alignment: "Trung Lập",
        theme: "amber",
        colorClass: "text-amber-300",
        borderClass: "border-amber-600/50",
        bgClass: "bg-stone-900/60",
        badgeBg: "bg-amber-950/80 text-amber-200 border-amber-500/50",
        icon: "fa-coins",
        buffType: "stones",
        buffPercent: 0.10,
        buffDesc: "Buff: +10% Tốc Độ Thu Thập Linh Thạch",
        slogan: "Tiêu dao thiên địa, phú giáp nhất phương.",
        desc: "Liên minh các thương gia & tán tu tự do, làm chủ mạch giao thương khoáng mạch khắp Cửu Châu, tài lộ hanh thông."
    }
};

const SECT_RANKS = [
    {
        rank: 0,
        id: "tap_dich",
        name: "Đệ Tử Tạp Dịch",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-600",
        dailyStones: 60,
        dailyContribution: 25,
        reqDesc: "Nhập môn bái sơn môn",
        privilege: "Làm việc vặt sơn môn, mua đan dược cơ bản"
    },
    {
        rank: 1,
        id: "ngoai_mon",
        name: "Đệ Tử Ngoại Môn",
        badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-500/60",
        minRealmIndex: 4, // Luyện Khí Tầng 5
        minContributionReq: 300,
        dailyStones: 180,
        dailyContribution: 60,
        reqDesc: "Luyện Khí Tầng 5 + 300 Điểm Cống Hiến",
        privilege: "Mở nhiệm vụ Săn Yêu Thú, mua Bí Kíp Ngoại Môn"
    },
    {
        rank: 2,
        id: "noi_mon",
        name: "Đệ Tử Nội Môn",
        badgeClass: "bg-sky-950 text-sky-300 border-sky-500/60",
        minRealmIndex: 10, // Trúc Cơ Sơ Kỳ
        minContributionReq: 1000,
        dailyStones: 500,
        dailyContribution: 150,
        reqDesc: "Trúc Cơ Sơ Kỳ + 1,000 Điểm Cống Hiến",
        privilege: "Mở nhiệm vụ Tuần Tra Sơn Môn, mua Tuyệt Kỹ Nội Môn"
    },
    {
        rank: 3,
        id: "chan_truyen",
        name: "Đệ Tử Chân Truyền",
        badgeClass: "bg-purple-950 text-purple-300 border-purple-500/60",
        minRealmIndex: 12, // Trúc Cơ Hậu Kỳ / Viên Mãn
        minContributionReq: 2500,
        dailyStones: 1200,
        dailyContribution: 400,
        reqDesc: "Trúc Cơ Hậu Kỳ + 2,500 Điểm Cống Hiến",
        privilege: "Hưởng bổng lộc dồi dào, mua Thần Kỹ Chân Truyền"
    },
    {
        rank: 4,
        id: "truong_lao",
        name: "Trưởng Lão Hộ Pháp",
        badgeClass: "bg-amber-950 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
        minRealmIndex: 14, // Kim Đan Sơ Kỳ
        minContributionReq: 6000,
        dailyStones: 3000,
        dailyContribution: 1000,
        reqDesc: "Kim Đan Sơ Kỳ + 6,000 Điểm Cống Hiến",
        privilege: "Thống lĩnh đệ tử, bổng lộc tối thượng"
    }
];

const SECT_QUESTS = [
    {
        id: "quest_ganh_nuoc",
        name: "Gánh Nước Tưới Dược Điền",
        desc: "Lên đỉnh Thanh Tuyền gánh linh tuyền về tưới linh điền cho môn phái.",
        icon: "fa-bucket",
        minRank: 0,
        mpCost: 20,
        durationSeconds: 30,
        rewardContribution: 40,
        rewardStones: 60,
        rewardExp: 50
    },
    {
        id: "quest_che_cui",
        name: "Chẻ Củi Thiết Mộc Cho Lò Đan",
        desc: "Dùng rìu thiết rèn ngàn năm chẻ Thiết Mộc làm nhiên liệu đan phòng.",
        icon: "fa-axe",
        minRank: 0,
        mpCost: 40,
        durationSeconds: 90,
        rewardContribution: 100,
        rewardStones: 150,
        rewardExp: 120
    },
    {
        id: "quest_cham_soc_duoc",
        name: "Trồng Trọt & Chăm Sóc Dược Thảo",
        desc: "Bón phân tụ linh, bắt trừ sâu độc cho vườn dược thảo sơn môn.",
        icon: "fa-seedling",
        minRank: 1,
        mpCost: 80,
        durationSeconds: 240,
        rewardContribution: 250,
        rewardStones: 350,
        rewardExp: 300,
        rewardItem: { id: "herb_spirit", name: "Tử Linh Chi", count: 2 }
    },
    {
        id: "quest_san_yeu_thu",
        name: "Săn Lùng Ma Lang Quấy Nhiễu",
        desc: "Tiễu trừ bầy Ma Lang hung bạo quấy nhiễu phàm nhân dưới chân núi.",
        icon: "fa-paw",
        minRank: 1,
        mpCost: 150,
        durationSeconds: 600,
        rewardContribution: 600,
        rewardStones: 900,
        rewardExp: 800,
        rewardItem: { id: "loi_kiep_dich", name: "Yêu Lang Nội Đan", count: 1 }
    },
    {
        id: "quest_tuan_tra_diet_ma",
        name: "Tuần Tra Cấm Địa Sơn Môn",
        desc: "Cùng chấp sự tiến vào khu vực phong ấn cấm địa trấn áp ma khí tiết lộ.",
        icon: "fa-shield-halved",
        minRank: 2,
        mpCost: 300,
        durationSeconds: 1800,
        rewardContribution: 1500,
        rewardStones: 2500,
        rewardExp: 2200,
        rewardItem: { id: "tay_tuy_dan", name: "Tẩy Tủy Đan", count: 1 }
    }
];

const SECT_SHOP_ITEMS = [
    // Bí Kíp Thanh Vân Môn
    {
        id: "bk_thanh_van_phu_dao",
        sectId: "thanh_van",
        name: "Thanh Vân Phù Dao Quyết",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "pham",
        minRank: 0,
        price: 150,
        icon: "fa-scroll",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Tâm pháp nhập môn Thanh Vân, dưỡng khí hóa tuyền.",
        effect: "+15% Tốc độ tu luyện, +80 Khí Huyết (HP)",
        stats: { expRateMultiplier: 0.15, hp: 80 }
    },
    {
        id: "bk_quy_nguyen_kiem_quyet",
        sectId: "thanh_van",
        name: "Quy Nguyên Kiếm Quyết",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "linh",
        minRank: 1,
        price: 400,
        icon: "fa-khanda",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Kiếm pháp chính tông Thanh Vân, kiếm khí thuần dương hộ thể.",
        effect: "+35 Công Kích, +25 Phòng Ngự",
        stats: { atk: 35, def: 25, damage: 160 }
    },
    {
        id: "bk_thien_cuong_loi_dinh",
        sectId: "thanh_van",
        name: "Thiên Cương Lôi Đình Tâm Pháp",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "huyen",
        minRank: 2,
        price: 1000,
        icon: "fa-bolt",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Dẫn thiên lôi cương khí rèn đan điền, uy lực chấn nhiếp ma đạo.",
        effect: "+120 Công Kích, +100 Phòng Ngự, +500 Khí Huyết",
        stats: { atk: 120, def: 100, hp: 500 }
    },
    {
        id: "bk_van_kiem_quy_tong",
        sectId: "thanh_van",
        name: "Vạn Kiếm Quy Tông",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "dia",
        minRank: 3,
        price: 2800,
        icon: "fa-burst",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Tuyệt học trấn phái Thanh Vân Môn, vạn kiếm tề phát tồi sơn đảo hải.",
        effect: "+380 Công Kích, +2500 Khí Huyết, +10% Bạo Kích",
        stats: { atk: 380, hp: 2500, critRate: 0.10, damage: 650 }
    },
    {
        id: "bk_thai_at_than_kiem",
        sectId: "thanh_van",
        name: "Thái Ất Thần Kiếm Quyết",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "thien",
        minRank: 4,
        price: 5500,
        icon: "fa-bolt-lightning",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Thượng cổ kiếm quyết uy lực cái thế, nhất kiếm toái hư không, dẫn cửu thiên thần lôi trảm yêu trừ ma.",
        effect: "+880 Công Kích, +4500 Khí Huyết, +15% Bạo Kích, +10% Tốc độ tu vi",
        stats: { atk: 880, hp: 4500, critRate: 0.15, expRateMultiplier: 0.10, damage: 1250 }
    },
    {
        id: "bk_cuu_chuyen_kim_than",
        sectId: "thanh_van",
        name: "Cửu Chuyển Kim Thân Quyết",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "thien",
        minRank: 4,
        price: 6000,
        icon: "fa-shield-halved",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Bất hoại kim thân chi đạo, nhục thân bất diệt, vạn kiếp bất xâm.",
        effect: "+350 Phòng Ngự, +6000 Khí Huyết, +15% Tốc độ tu luyện",
        stats: { def: 350, hp: 6000, expRateMultiplier: 0.15 }
    },

    // Bí Kíp Huyết Hồn Cốc
    {
        id: "bk_huyet_ma_hoa_cot",
        sectId: "huyet_hon",
        name: "Huyết Hột Cốt Công",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "pham",
        minRank: 0,
        price: 150,
        icon: "fa-skull",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Luyện huyết dưỡng sát, tủy biến như huyền thiết.",
        effect: "+15% Tốc độ tu luyện, +20 Công Kích",
        stats: { expRateMultiplier: 0.15, atk: 20 }
    },
    {
        id: "bk_huyet_sat_dao_phap",
        sectId: "huyet_hon",
        name: "Huyết Sát Đao Pháp",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "linh",
        minRank: 1,
        price: 400,
        icon: "fa-fire-flame-curved",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Đao pháp thị huyết cuồng bạo, trảm kích sắc lạnh.",
        effect: "+50 Công Kích, +5% Bạo Kích",
        stats: { atk: 50, critRate: 0.05, damage: 180 }
    },
    {
        id: "bk_u_minh_quy_dao",
        sectId: "huyet_hon",
        name: "U Minh Quỷ Đạo Bí Điển",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "huyen",
        minRank: 2,
        price: 1000,
        icon: "fa-ghost",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Thu nạp cửu u quỷ khí, hóa sát thành cương lực.",
        effect: "+160 Công Kích, +60 Phòng Ngự, +300 Khí Huyết",
        stats: { atk: 160, def: 60, hp: 300 }
    },
    {
        id: "bk_huyet_hai_phan_thien",
        sectId: "huyet_hon",
        name: "Huyết Hải Phần Thiên",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "dia",
        minRank: 3,
        price: 2800,
        icon: "fa-meteor",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Huyết sát hóa hải dương thiêu rụi thiên địa, sát phạt cùng cực.",
        effect: "+450 Công Kích, +1500 Khí Huyết, +12% Bạo Kích",
        stats: { atk: 450, hp: 1500, critRate: 0.12, damage: 720 }
    },
    {
        id: "bk_cuu_u_huyet_de",
        sectId: "huyet_hon",
        name: "Cửu U Huyết Đế Kinh",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "thien",
        minRank: 4,
        price: 6000,
        icon: "fa-skull-crossbones",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Đế kinh chí cao của ma đạo cửu u, luyện hóa vạn linh huyết sát thành bổ dưỡng vô thượng căn cơ.",
        effect: "+920 Công Kích, +3000 Khí Huyết, +18% Bạo Kích, +15% Tốc độ tu luyện",
        stats: { atk: 920, hp: 3000, critRate: 0.18, expRateMultiplier: 0.15 }
    },
    {
        id: "bk_tuyet_diet_ma_tranh",
        sectId: "huyet_hon",
        name: "Thiên Ma Diệt Thế Trảo",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "thien",
        minRank: 4,
        price: 5500,
        icon: "fa-hand-back-fist",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Trảo xuất xé rách thương khung, sát ý ngập trời thị huyết cuồng nộ.",
        effect: "+1050 Công Kích, +2500 Khí Huyết, +20% Sát Thương Bạo Kích",
        stats: { atk: 1050, hp: 2500, critDmg: 0.20, damage: 1400 }
    },

    // Bí Kíp Tán Tu Minh
    {
        id: "bk_tan_tu_tieu_dao",
        sectId: "tan_tu",
        name: "Tán Tu Tiêu Dao Thư",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "pham",
        minRank: 0,
        price: 150,
        icon: "fa-book-open-reader",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Tâm pháp tự tại không câu nệ, tích lũy linh khí nhẹ nhàng thông suốt.",
        effect: "+15% Tốc độ tu luyện, +10% Thu thập Linh Thạch",
        stats: { expRateMultiplier: 0.15, spiritStoneGatherRate: 0.10 }
    },
    {
        id: "bk_bach_thao_ho_menh",
        sectId: "tan_tu",
        name: "Bách Thảo Hộ Mệnh Pháp",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "linh",
        minRank: 1,
        price: 400,
        icon: "fa-leaf",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Vận linh thảo hộ thể, vừa tấn công vừa trị liệu ngoại thương.",
        effect: "+30 Công Kích, +30 Phòng Ngự, +120 Khí Huyết",
        stats: { atk: 30, def: 30, hp: 120, damage: 150 }
    },
    {
        id: "bk_van_co_hoa_linh",
        sectId: "tan_tu",
        name: "Vạn Cổ Hóa Linh Thư",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "huyen",
        minRank: 2,
        price: 1000,
        icon: "fa-yin-yang",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Chuyển hóa ngũ hành thiên địa vào đan điền, linh lực vô cùng vô tận.",
        effect: "+100 Công Kích, +120 Phòng Ngự, +600 Khí Huyết",
        stats: { atk: 100, def: 120, hp: 600 }
    },
    {
        id: "bk_nhat_khi_hoa_tam_thanh",
        sectId: "tan_tu",
        name: "Nhất Khí Hóa Tam Thanh",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "dia",
        minRank: 3,
        price: 2800,
        icon: "fa-wand-magic-sparkles",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Đạo pháp chí cao của Tán Tu liên minh, nhất khí phân thân uy áp quần hùng.",
        effect: "+360 Công Kích, +2000 Khí Huyết, +200 Phòng Ngự",
        stats: { atk: 360, hp: 2000, def: 200, damage: 680 }
    },
    {
        id: "bk_hon_don_quy_nhat",
        sectId: "tan_tu",
        name: "Hỗn Độn Quy Nhất Quyết",
        type: "Tâm Pháp",
        category: "tam_phap",
        tier: "thien",
        minRank: 4,
        price: 6000,
        icon: "fa-infinity",
        image: "./assets/images/item_bamboo_scroll.jpg",
        desc: "Quy vạn pháp về hỗn độn tiên thiên, ngũ hành tương sinh, linh khí thiên địa vô tận quy tụ.",
        effect: "+750 Công Kích, +300 Phòng Ngự, +5000 Khí Huyết, +20% Tốc độ tu luyện",
        stats: { atk: 750, def: 300, hp: 5000, expRateMultiplier: 0.20 }
    },
    {
        id: "bk_thien_dia_vo_cuc",
        sectId: "tan_tu",
        name: "Thiên Địa Vô Cực Trận Bút",
        type: "Vũ Kỹ",
        category: "vu_ky",
        tier: "thien",
        minRank: 4,
        price: 5500,
        icon: "fa-compass-drafting",
        image: "./assets/images/item_bamboo_sword.jpg",
        desc: "Hóa thiên địa làm trận, chỉ tay điểm họa vạn dặm sơn hà trấn sát càn khôn.",
        effect: "+820 Công Kích, +350 Phòng Ngự, +4000 Khí Huyết, +12% Bạo Kích",
        stats: { atk: 820, def: 350, hp: 4000, critRate: 0.12, damage: 1300 }
    },

    // Đan Dược & Vật Phẩm Tông Môn Dùng Chung
    {
        id: "pill_tay_cot_sect",
        sectId: "all",
        name: "Tẩy Cốt Đan Tông Môn",
        type: "Đan Dược",
        category: "dan_duoc",
        tier: "linh",
        minRank: 0,
        price: 100,
        icon: "fa-pills",
        image: "./assets/images/item_qi_pill_bottle.jpg",
        desc: "Đan dược tôi luyện gân cốt do đại sư môn phái luyện chế.",
        effect: "Tăng trực tiếp +1,000 Tu Vi lập tức khi dùng",
        usable: true,
        action: "gain_exp_1000"
    },
    {
        id: "pill_truc_co_sect",
        sectId: "all",
        name: "Trúc Cơ Đan Thượng Phẩm",
        type: "Đan Dược",
        category: "dan_duoc",
        tier: "linh",
        minRank: 1,
        price: 400,
        icon: "fa-capsules",
        image: "./assets/images/item_qi_pill_bottle.jpg",
        desc: "Đan dược bảo vật giúp đệ tử ngoại môn vững bước Trúc Cơ.",
        effect: "Tăng 25% tỷ lệ đột phá cảnh giới Trúc Cơ",
        usable: true,
        action: "breakthrough_bonus_25"
    },
    {
        id: "pill_kim_dan_sect",
        sectId: "all",
        name: "Kim Đan Phá Chướng Tán",
        type: "Đan Dược",
        category: "dan_duoc",
        tier: "huyen",
        minRank: 2,
        price: 1200,
        icon: "fa-circle-radiation",
        image: "./assets/images/item_qi_pill_bottle.jpg",
        desc: "Dược hoàn phá trừ chướng ngại kết đan, ngưng tụ Kim Đan cực phẩm.",
        effect: "Tăng 30% tỷ lệ đột phá cảnh giới Kim Đan",
        usable: true,
        action: "breakthrough_bonus_30"
    },
    {
        id: "pill_thanh_tam",
        sectId: "all",
        name: "Thanh Tâm Đan",
        type: "Đan Dược",
        category: "dan_duoc",
        tier: "linh",
        minRank: 0,
        price: 200,
        icon: "fa-spa",
        image: "./assets/images/item_qi_pill_bottle.jpg",
        desc: "Đan dược thanh tâm an thần, gột rửa uế tạp, tiêu trừ 10 Tâm Ma (+10 Đạo Tâm).",
        effect: "Giảm 10 Tâm Ma, khôi phục 10 Đạo Tâm",
        usable: true,
        action: "clear_tam_ma_10"
    },
    {
        id: "pill_thai_at_tay_tuy",
        sectId: "all",
        name: "Thái Ất Tẩy Tủy Kim Đan",
        type: "Đan Dược",
        category: "dan_duoc",
        tier: "thien",
        minRank: 4,
        price: 3500,
        icon: "fa-sun",
        image: "./assets/images/item_qi_pill_bottle.jpg",
        desc: "Tuyệt phẩm tiên đan tẩy rửa linh căn toàn diện, tăng vĩnh viễn 1000 Khí Huyết và 80 Công Kích.",
        effect: "Vĩnh viễn: +1000 HP, +80 ATK",
        usable: true,
        action: "gain_perm_stats",
        stats: { hp: 1000, atk: 80 }
    }
];

// ==========================================
// 4.15. HỘ SƠN ĐẠI TRẬN & THÍ LUYỆN TRƯỞNG LÃO TÔNG MÔN
// ==========================================
const SECT_ARRAY_TIERS = [
    {
        level: 1,
        name: "Sơ Khai Hộ Tông Trận",
        minRank: 0,
        reqContribution: 0,
        reqStones: 0,
        idleBonus: 0.05,
        buffDesc: "+5% Tốc độ Tu Vi Tông Môn",
        icon: "fa-shield-halved",
        badgeClass: "text-slate-300 border-slate-700 bg-slate-900/60"
    },
    {
        level: 2,
        name: "Tụ Linh Hộ Sơn Trận",
        minRank: 1,
        reqContribution: 800,
        reqStones: 15000,
        idleBonus: 0.10,
        hpBonusPercent: 5,
        buffDesc: "+10% Tốc độ Tu Vi, +5% Khí Huyết Tối Đa",
        icon: "fa-gem",
        badgeClass: "text-emerald-400 border-emerald-500/40 bg-emerald-950/60"
    },
    {
        level: 3,
        name: "Cửu Cung Phong Lôi Trận",
        minRank: 2,
        reqContribution: 2500,
        reqStones: 50000,
        idleBonus: 0.16,
        hpBonusPercent: 5,
        atkBonusPercent: 8,
        buffDesc: "+16% Tốc độ Tu Vi, +8% Công Kích, +5% HP",
        icon: "fa-bolt-lightning",
        badgeClass: "text-sky-400 border-sky-500/40 bg-sky-950/60"
    },
    {
        level: 4,
        name: "Thái Hư Càn Khôn Trận",
        minRank: 3,
        reqContribution: 6000,
        reqStones: 120000,
        idleBonus: 0.24,
        hpBonusPercent: 10,
        atkBonusPercent: 12,
        defBonusPercent: 10,
        buffDesc: "+24% Tốc độ Tu Vi, +12% Công Kích, +10% Phòng Ngự, +10% HP",
        icon: "fa-yin-yang",
        badgeClass: "text-purple-400 border-purple-500/40 bg-purple-950/60"
    },
    {
        level: 5,
        name: "Vạn Tiên Tru Ma Đại Trận",
        minRank: 4,
        reqContribution: 15000,
        reqStones: 300000,
        idleBonus: 0.35,
        hpBonusPercent: 18,
        atkBonusPercent: 20,
        defBonusPercent: 18,
        breakthroughBonus: 10,
        buffDesc: "+35% Tốc độ Tu Vi, +20% ATK, +18% DEF, +18% HP, +10% Tỷ lệ Đột phá",
        icon: "fa-sun",
        badgeClass: "text-amber-400 border-amber-500/50 bg-amber-950/70 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
    }
];

const SECT_ELDER_TRIALS = [
    {
        id: "trial_elder_1",
        name: "Triệu Bá Thiên",
        title: "Chấp Sự Trưởng Lão",
        sectRealmReq: 1,
        minRealmIdx: 8,
        realmName: "Trúc Cơ Viên Mãn",
        hp: 85000,
        atk: 3200,
        def: 2100,
        avatarIcon: "fa-user-shield",
        colorTheme: "border-sky-500/50 bg-sky-950/40",
        textColor: "text-sky-300",
        desc: "Thủ lĩnh chấp sự ngoại sơn, đao pháp trầm ổn tựa thái sơn, khảo hạch căn cơ thực chiến của môn nhân.",
        rewardStones: 30000,
        rewardJade: 50,
        rewardContribution: 1200,
        rewardTitle: "Đệ Tử Chân Truyền"
    },
    {
        id: "trial_elder_2",
        name: "Vô Vi Chân Nhân",
        title: "Truyền Công Trưởng Lão",
        sectRealmReq: 2,
        minRealmIdx: 14,
        realmName: "Kim Đan Hậu Kỳ",
        hp: 280000,
        atk: 9800,
        def: 6500,
        avatarIcon: "fa-scroll",
        colorTheme: "border-purple-500/50 bg-purple-950/40",
        textColor: "text-purple-300",
        desc: "Bậc thầy truyền kinh giảng đạo, ngự kiếm xuất thần nhập hóa, khảo nghiệm ngộ tính và kiếm ý môn nhân.",
        rewardStones: 80000,
        rewardJade: 150,
        rewardContribution: 3500,
        rewardTitle: "Thiên Kiêu Tông Môn"
    },
    {
        id: "trial_elder_3",
        name: "Huyền Cơ Lão Tổ",
        title: "Thái Thượng Trưởng Lão",
        sectRealmReq: 3,
        minRealmIdx: 18,
        realmName: "Nguyên Anh Đỉnh Phong",
        hp: 850000,
        atk: 28000,
        def: 19000,
        avatarIcon: "fa-cloud-bolt",
        colorTheme: "border-amber-500/50 bg-amber-950/40",
        textColor: "text-amber-300",
        desc: "Lão quái bế quan ngàn năm của tông môn, chưởng khống thiên lôi thần phạt, chỉ khảo nghiệm thiên tài cái thế.",
        rewardStones: 250000,
        rewardJade: 400,
        rewardContribution: 10000,
        rewardTitle: "Tông Môn Hộ Pháp"
    }
];

if (typeof window !== 'undefined') {
    window.SECTS_DATA = SECTS_DATA;
    window.SECT_RANKS = SECT_RANKS;
    window.SECT_QUESTS = SECT_QUESTS;
    window.SECT_SHOP_ITEMS = SECT_SHOP_ITEMS;
    window.SECT_ARRAY_TIERS = SECT_ARRAY_TIERS;
    window.SECT_ELDER_TRIALS = SECT_ELDER_TRIALS;
}
if (typeof globalThis !== 'undefined') {
    globalThis.SECTS_DATA = SECTS_DATA;
    globalThis.SECT_RANKS = SECT_RANKS;
    globalThis.SECT_QUESTS = SECT_QUESTS;
    globalThis.SECT_SHOP_ITEMS = SECT_SHOP_ITEMS;
    globalThis.SECT_ARRAY_TIERS = SECT_ARRAY_TIERS;
    globalThis.SECT_ELDER_TRIALS = SECT_ELDER_TRIALS;
}

// Bộ bí tịch mẫu tặng một lần cho nhân vật đã có bản lưu.
const PREVIEW_MANUAL_SKILL_IDS = [
    'skill_huyet_hai_kiem_quyet',
    'skill_thien_loi_chinh_phap',
    'skill_thanh_moc_truong_sinh_the',
    'skill_thai_thanh_van_kiem'
];

const DEFAULT_STATE = {
    player: {
        name: "Tiêu Dao Tử",
        avatar_url: DEFAULT_CULTIVATION_AVATAR
    },
    avatar_url: DEFAULT_CULTIVATION_AVATAR,
    timeScale: 1,
    realmIndex: 0,
    exp: 0,
    linhKhi: 6000000,
    maxLinhKhi: 50000,
    linhKhiRegen: 100,
    stones: 0,
    immortalJade: 0,
    hp: 500,
    maxHp: 500,
    baseHp: 500,
    hpRegenBase: 5,
    realmStage: 0,
    mp: 200,
    maxMp: 200,
    baseMp: 200,
    atk: 28,
    baseAtk: 28,
    def: 14,
    baseDef: 14,
    totalAtk: 28,
    totalDef: 14,
    totalHp: 500,
    totalMp: 200,
    combatPower: 0,
    equipped: {},
    speed: 20,
    crit: 10,
    lifespan: 24,
    ageYears: 18,
    lifespanBonus: 0,
    lifespanPenalty: 0,
    isDead: false,
    playerSect: null,
    sectRank: 0,
    sectContribution: 0,
    sectQuest: null,
    lastSectHomageTime: 0,
    sectPurchasedSkills: [],
    sectArrayLevel: 1,
    sectTrialsBeaten: [],
    daoTam: 100,
    tamMa: 0,
    beQuanTuQua: { active: false, startTime: 0 },
    currentWorld: "HaGioi",
    statusEffect: null,
    forcedAscensionTriggered: false,
    physiqueId: "mortal",
    aptitudeId: "balanced",
    canCo: {
        physiqueTraining: { stageIndex: 0, floor: 1, trait: "Phàm Thể" },
        consciousness: { level: 0, scanRadius: 0 },
        destiny: { insight: null, fortune: null }
    },
    daoFoundationTitles: {
        unlockedTitles: ["vo_linh_can", "nguy_linh_can"],
        activeTitle: "nguy_linh_can"
    },
    auto: {
        enabled: true,
        pill: true,
        heal: true,
        farm: true,
        alchemy: false
    },
    heavenlyPunishmentCount: 0,
    knowledge: [],
    roles: [],
    progressionFlags: [],
    spiritRoot: "Ngụy Linh Căn",
    playerLinhCan: {
        kim: 2,
        moc: 4,
        thuy: 37,
        hoa: 1,
        tho: 3
    },
    spiritualRoot: {
        id: "mortal_mixed",
        tier: "mortal",
        awakenStage: 0,
        pillars: { metal: 2, wood: 4, water: 37, fire: 1, earth: 3 },
        rareBranches: { ice: { level: 0, isUnlocked: false }, wind: { level: 0, isUnlocked: false }, thunder: { level: 0, isUnlocked: false } },
        mutations: { metal: false, wood: false, water: false, fire: false, earth: false, ice: false, wind: false, thunder: false }
    },
    daoHeart: "Kiếm Tu (Thuần Chiến)",
    arrayLevel: 1,
    bgIndex: 0,
    pillBuffRemaining: 0,
    sectRankIndex: 0,
    pendingEncounterId: null,
    lastEncounterAt: 0,
    lastOnlineTime: Date.now(),
    // NÂNG CẤP TỤ LINH TRẬN NGŨ HÀNH & KỲ NGỘ CHÁNH MA
    fiveElements: { kim: 1, moc: 1, thuy: 1, hoa: 1, tho: 1 },
    activeElement: "metal",
    alignment: {
        righteous: 50, // Thiên Tâm
        demonic: 50    // Ma Tính
    },
    activePet: "fox", // fox (Cửu Vĩ Thiên Hồ), dragon (Băng Lôi Giao Long), crane (Thanh Hạc)
    petLevel: 1,
    petExp: 0,
    petTier: 1,
    orbitArtifacts: ["sword", "shield", "bead"], // 3 Pháp Bảo Bản Mệnh quay quanh
    tribulationWave: 0,
    towerFloor: 1,
    hasClearedTower50: false,
    heavenlySuppressionTriggered: false,
    towerClaimedMilestones: [],
    lastTowerSweepTime: 0,
    arenaRank: 100,
    arenaHonor: 120,
    arenaTickets: 5,
    lastArenaTicketRecharge: Date.now(),
    auctionData: {
        currentLotIndex: 0,
        currentBid: 20000,
        highestBidder: "Bản Tôn",
        isPlayerHighest: true,
        timeLeft: 30,
        hammerCount: 0,
        wonLots: []
    },
    expedition: {
        zoneId: null,
        startTime: 0,
        duration: 0,
        autoRepeat: true,
        lastReward: null
    },
    talismans: {
        lightning: 8,
        shield: 5,
        speed: 12,
        calm: 6
    },
    avatars: [
        {
            id: "avatar_sword",
            level: 1,
            status: "idle",
            expeditionEndTime: 0
        },
        {
            id: "avatar_alchemy",
            level: 1,
            status: "idle",
            expeditionEndTime: 0
        },
        {
            id: "avatar_soul",
            level: 1,
            status: "idle",
            expeditionEndTime: 0
        }
    ],
    dungeonsCleared: {},
    achievementsClaimed: {},
    equippedTitle: "",
    talismanCraftedCount: 0,
    avatarTripsCompleted: 0,
    celestialOmen: {
        currentOmenId: "tu_khi_dong_lai",
        changeAt: 0
    },
    divineTechniquesUnlocked: [],
    companions: [
        {
            id: "daolv_1",
            name: "Lục Tuyết Nhi",
            sect: "Thanh Vân Môn",
            physique: "Thiên Băng Chi Thể",
            affinity: 0,
            quote: "Đạo hữu, bế quan tu luyện chớ để tâm ma quấy nhiễu...",
            dualCultivatedToday: false,
            gainTuvi: 150,
            avatarIcon: "fa-user-nurse"
        },
        {
            id: "daolv_2",
            name: "Nam Cung Uyển",
            sect: "Yểm Nguyệt Tông",
            physique: "Thuần Âm Chi Thể",
            affinity: 0,
            quote: "Cùng người ngắm cảnh mây trời, đạo tâm tự tại...",
            dualCultivatedToday: false,
            gainTuvi: 280,
            avatarIcon: "fa-person-dress"
        }
    ],
    skills: [
        {
            id: "skill_breath",
            name: "Thái Thanh Thổ Nạp Quyết",
            level: 1,
            cost: 80,
            desc: "Tăng +20% tốc độ hấp thu Linh Khí mỗi cấp.",
            bonusType: "rate"
        },
        {
            id: "skill_sword",
            name: "Thanh Liên Kiếm Điển",
            level: 1,
            cost: 100,
            desc: "Tăng +12 Công Kích mỗi cấp.",
            bonusType: "atk"
        },
        {
            id: "skill_body",
            name: "Bất Diệt Kim Thân Quyết",
            level: 1,
            cost: 90,
            desc: "Tăng +120 Khí Huyết và +6 Thủ mỗi cấp.",
            bonusType: "def"
        },
        {
            id: "skill_thunder",
            name: "Cửu Tiêu Thần Lôi Quyết",
            level: 1,
            cost: 150,
            desc: "Tăng +25 Công Kích và +1% Tỷ Lệ Bạo Kích mỗi cấp.",
            bonusType: "crit_atk"
        },
        {
            id: "skill_wind",
            name: "Hư Không Thuấn Di Quyết",
            level: 1,
            cost: 120,
            desc: "Tăng +10 Công, +10 Thủ và +1% Tỷ Lệ Né Tránh mỗi cấp.",
            bonusType: "dodge_spd"
        }
    ],
    // 6 Ô TRANG BỊ CHUẨN: weapon, armor, boots, ring, talisman, artifact
    inventory: [
        {
            id: "sword_jade",
            name: "Thanh Trúc Phi Kiếm",
            type: "Pháp Bảo",
            slot: "weapon",
            rarity: 3,
            count: 1,
            equipped: true,
            atkBonus: 15,
            desc: "Phi kiếm trúc xanh chém sắt như bùn (+15 Công).",
            icon: "fa-khanda",
            image: "./assets/images/item_bamboo_sword.jpg"
        },
        {
            id: "armor_cloud",
            name: "Thanh Vân Đạo Bào",
            type: "Pháp Bảo",
            slot: "armor",
            rarity: 2,
            count: 1,
            equipped: true,
            defBonus: 10,
            desc: "Đạo bào dệt từ mây xanh (+10 Thủ).",
            icon: "fa-shirt",
            image: "./assets/images/mirror_bagua.jpg"
        },
        {
            id: "boots_wind",
            name: "Truy Phong Tiên Hài",
            type: "Pháp Bảo",
            slot: "boots",
            rarity: 3,
            count: 1,
            equipped: true,
            atkBonus: 5,
            defBonus: 5,
            desc: "Giày tiên lướt gió tăng tốc độ thám hiểm (+5 Công, +5 Thủ).",
            icon: "fa-shoe-prints",
            image: "./assets/images/magic_circle.svg"
        },
        {
            id: "ring_spirit",
            name: "Tụ Linh Giới Chỉ",
            type: "Pháp Bảo",
            slot: "ring",
            rarity: 4,
            count: 1,
            equipped: true,
            rateBonus: 15,
            desc: "Nhẫn cổ tụ khí (+15% tốc độ tu luyện).",
            icon: "fa-ring",
            image: "./assets/images/vfx_bagua_formation.jpg"
        },
        {
            id: "talisman_jade",
            name: "Hộ Thân Ngọc Bội",
            type: "Pháp Bảo",
            slot: "talisman",
            rarity: 3,
            count: 1,
            equipped: true,
            defBonus: 8,
            desc: "Ngọc bội thanh tịnh hộ mạch chống sát thương (+8 Thủ).",
            icon: "fa-gem",
            image: "./assets/images/mirror_bagua.jpg"
        },
        {
            id: "artifact_cauldron",
            name: "Cửu Châu Phong Lôi Đỉnh",
            type: "Pháp Bảo",
            slot: "artifact",
            rarity: 5,
            count: 0,
            equipped: false,
            atkBonus: 35,
            defBonus: 20,
            desc: "Bản Mệnh Pháp Bảo viễn cổ mở khi Kim Đan (+35 Công, +20 Thủ).",
            icon: "fa-shield-halved",
            image: "./assets/images/mirror_bagua.jpg"
        },
        {
            id: "pill_qi",
            name: "Tụ Khí Đan",
            type: "Đan Dược",
            rarity: 2,
            count: 0,
            desc: "Nuốt vào tăng ngay 60 Tu Vi Linh Khí.",
            effect: { exp: 60 },
            icon: "fa-pills",
            image: "./assets/images/item_qi_pill_bottle.jpg"
        },
        {
            id: "pill_foundation",
            name: "Trúc Cơ Đan",
            type: "Đan Dược",
            rarity: 4,
            count: 0,
            desc: "Tăng +25% tỷ lệ Độ Kiếp thành công và +250 Tu Vi.",
            effect: { exp: 250, breakBuff: true },
            icon: "fa-circle-radiation",
            image: "./assets/images/item_qi_pill_bottle.jpg"
        },
        {
            id: "pill_thanh_tam",
            name: "Thanh Tâm Đan",
            type: "Đan Dược",
            rarity: 3,
            count: 0,
            desc: "Đan dược thanh tâm an thần, tiêu trừ 10 Tâm Ma (+10 Đạo Tâm).",
            effect: { clearTamMa: 10 },
            icon: "fa-spa",
            image: "./assets/images/item_qi_pill_bottle.jpg"
        },
        {
            id: "pill_core",
            name: "Kết Đan",
            type: "Đan Dược",
            rarity: 5,
            count: 0,
            desc: "Hộ trình khi phá bình cảnh Trúc Cơ, tăng 25% tỷ lệ kết Kim Đan.",
            effect: { exp: 0, breakBuff: true },
            icon: "fa-sun",
            image: "./assets/images/item_qi_pill_bottle.jpg"
        },
        {
            id: "pill_nascent",
            name: "Hóa Anh Đan",
            type: "Đan Dược",
            rarity: 6,
            count: 0,
            desc: "Bảo hộ Kim Đan khi đan vỡ hóa anh, tăng 25% tỷ lệ vượt Tam Cửu Thiên Kiếp.",
            effect: { exp: 0, breakBuff: true },
            icon: "fa-child-reaching",
            image: "./assets/images/item_qi_pill_bottle.jpg"
        },
        {
            id: "herb_spirit",
            name: "Tử Linh Chi",
            type: "Thảo Dược",
            rarity: 3,
            count: 0,
            desc: "Linh thảo ngàn năm dùng luyện Tụ Khí Đan.",
            icon: "fa-leaf",
            image: "./assets/images/item_bamboo_scroll.jpg"
        },
        {
            id: "herb_blood",
            name: "Huyết Ngọc Sâm",
            type: "Thảo Dược",
            rarity: 4,
            count: 0,
            desc: "Dược liệu quý dùng luyện Trúc Cơ Đan.",
            icon: "fa-seedling",
            image: "./assets/images/item_bamboo_scroll.jpg"
        },
        {
            id: "stone_ore",
            name: "Huyền Thiết Khoáng",
            type: "Khoáng Thạch",
            rarity: 1,
            count: 0,
            desc: "Khoáng thạch dùng nâng cấp Tụ Linh Trận.",
            icon: "fa-cubes",
            image: "./assets/images/item_bamboo_scroll.jpg"
        },
        { id: "di_nguyen_thach", name: "Dị Nguyên Thạch", type: "Căn Cơ", rarity: 5, count: 0, desc: "Mở một nhánh Tam Dị.", icon: "fa-gem", image: "./assets/images/mirror_bagua.jpg" },
        ...Object.values(LINH_CAN_MUTATIONS).map(mutation => ({ id: mutation.itemId, name: mutation.itemName, type: "Căn Cơ", rarity: 6, count: 0, desc: `Vật phẩm thức tỉnh ${mutation.name}.`, icon: "fa-sparkles", image: "./assets/images/vfx_tribulation_lightning.svg" })),
        // Vật phẩm Phường Thị
        { id: "tay_tuy_dan", name: "Tẩy Tủy Đan", type: "Căn Cơ", rarity: 4, count: 0, desc: "Gột rửa kinh mạch; nguyên liệu khai mở danh hiệu Chân Linh Căn.", icon: "fa-prescription-bottle", image: "./assets/images/item_qi_pill_bottle.jpg" },
        { id: "dien_tho_dan", name: "Diên Thọ Đan", type: "Đan Dược", rarity: 5, count: 0, desc: "Phục dụng tăng giới hạn tuổi thọ thêm 20 năm.", effect: { lifespan: 20 }, icon: "fa-hourglass-half", image: "./assets/images/item_qi_pill_bottle.jpg" },
        { id: "bi_kip_dan_khi", name: "Bí Kíp Dẫn Khí", type: "Bí Kíp", rarity: 2, count: 0, desc: "Cổ tịch nhập môn dẫn khí nhập thể.", icon: "fa-book", image: "./assets/images/item_bamboo_scroll.jpg" },
        { id: "tam_phap_luyen_khi", name: "Tâm Pháp Luyện Khí", type: "Bí Kíp", rarity: 3, count: 0, desc: "Tâm pháp vận chuyển chu thiên của Luyện Khí kỳ.", icon: "fa-book-bookmark", image: "./assets/images/item_bamboo_scroll.jpg" },
        { id: "loi_kiep_dich", name: "Lôi Kiếp Dịch", type: "Căn Cơ", rarity: 6, count: 0, desc: "Tài liệu thức tỉnh Thiên Lôi Linh Căn.", icon: "fa-bolt", image: "./assets/images/vfx_tribulation_lightning.svg" },
        { id: "van_nien_han_ngoc", name: "Vạn Niên Hàn Ngọc", type: "Căn Cơ", rarity: 6, count: 0, desc: "Hàn ngọc vạn năm, tài liệu thức tỉnh linh căn hệ Băng.", icon: "fa-snowflake", image: "./assets/images/mirror_bagua.jpg" },
        { id: "bien_di_qua", name: "Biến Dị Quả", type: "Căn Cơ", rarity: 6, count: 0, desc: "Linh quả dị biến; nguyên liệu khai mở danh hiệu Dị Linh Căn.", icon: "fa-apple-whole", image: "./assets/images/item_qi_pill_bottle.jpg" }
    ],
    // Trạng thái Phường Thị (được chuẩn hóa/khởi tạo bởi js/market.js)
    market: {
        activeTab: "van_bao_lau",
        nextAutoRefreshAt: 0,
        shops: {},
        actionLog: []
    },
    farmPlots: [
        {
            id: 1,
            herbId: null,
            herbName: "Trống",
            progress: 0,
            speed: 0
        },
        {
            id: 2,
            herbId: null,
            herbName: "Trống",
            progress: 0,
            speed: 0
        },
        {
            id: 3,
            herbId: null,
            herbName: "Trống",
            progress: 0,
            speed: 0
        },
        {
            id: 4,
            herbId: null,
            herbName: "Trống",
            progress: 0,
            speed: 0
        }
    ]
};
DEFAULT_STATE.equipped = {
    weapon: DEFAULT_STATE.inventory[0],
    armor: DEFAULT_STATE.inventory[1],
    boots: DEFAULT_STATE.inventory[2],
    ring: DEFAULT_STATE.inventory[3],
    talisman: DEFAULT_STATE.inventory[4],
    artifact: null
};

if (typeof window !== 'undefined') {
    window.DEFAULT_STATE = DEFAULT_STATE;
}
if (typeof globalThis !== 'undefined') {
    globalThis.DEFAULT_STATE = DEFAULT_STATE;
}

// =========================================================================
// 6. TRỤ CỘT 1: QUẢN LÝ TRẠNG THÁI TẬP TRUNG (CENTRALIZED GLOBAL GAME STATE)
// =========================================================================

const EQUIP_SLOT_MAPPING = {
    weapon: 'weapon',
    armor: 'armor',
    boots: 'boots',
    ring: 'ring',
    talisman: 'talisman',
    artifact: 'artifact',
    secondary_weapon: 'artifact',
    'secondary-weapon': 'artifact',
    'vu-khi-phu': 'artifact',
    vukhiphu: 'artifact',
    vukhi: 'weapon',
    giap: 'armor',
    hai: 'boots',
    nhan: 'ring',
    ngocboi: 'talisman',
    phapbao: 'artifact',
    'phap-bao': 'artifact',
    'vu-khi': 'weapon',
    'y-phuc': 'armor',
    'phu-kien': 'talisman'
};

function deriveRealmSubLevelInfo(realmIndex = 0) {
    const idx = Math.max(0, Math.floor(Number(realmIndex) || 0));
    const realmObj = REALMS[idx] || REALMS[0];
    const tier = realmObj && typeof realmObj.tier === 'number'
        ? realmObj.tier
        : Math.min(5, Math.floor(idx / 4) + 1);
    const tierMultiplier = realmObj && typeof realmObj.tierMultiplier === 'number'
        ? realmObj.tierMultiplier
        : Math.pow(10, tier - 1);
    const subLevel = (realmObj && typeof realmObj.minorIndex === 'number')
        ? (realmObj.minorIndex + 1)
        : ((idx % 4) + 1);
    const majorRealmNames = {
        1: "Luyện Khí",
        2: "Trúc Cơ",
        3: "Kim Đan",
        4: "Nguyên Anh",
        5: "Hóa Thần"
    };
    return {
        realmIndex: idx,
        realmObj,
        currentRealm: majorRealmNames[tier] || (realmObj ? realmObj.name : "Luyện Khí"),
        fullRealmName: realmObj ? realmObj.name : "Luyện Khí Tầng 1",
        subLevel,
        tier,
        tierMultiplier
    };
}

const GameState = {
    player: {
        base_stats: {
            atk: DEFAULT_STATE.atk || 28,
            def: DEFAULT_STATE.def || 14,
            hp: DEFAULT_STATE.maxHp || 1000,
            mp: DEFAULT_STATE.maxMp || 180
        },
        total_stats: {
            atk: DEFAULT_STATE.atk || 28,
            def: DEFAULT_STATE.def || 14,
            hp: DEFAULT_STATE.maxHp || 1000,
            mp: DEFAULT_STATE.maxMp || 180
        },
        combat_power: 0,
        current_realm: "Luyện Khí",
        full_realm_name: "Luyện Khí Tầng 1 [Sơ Kỳ]",
        realm_index: 0,
        sub_level: 1,
        tier: 1,
        tier_multiplier: 1,
        dao_tam: 100,
        tam_ma: 0,
        exp: 0,
        max_exp: 1000,
        hp: 1000,
        max_hp: 1000,
        mp: 180,
        max_mp: 180,
        stones: 0
    },
    equipment: {
        weapon: null,
        armor: null,
        boots: null,
        ring: null,
        talisman: null,
        artifact: null
    },
    skills: [],
    inventory: [],
    _rawState: null,
    _listeners: [],

    /**
     * Đồng bộ dữ liệu từ biến state sang GameState chuẩn hóa
     */
    syncFromState(sourceState = null) {
        const s = sourceState || this._rawState || (typeof window !== 'undefined' && window.state) || (typeof state !== 'undefined' ? state : DEFAULT_STATE);
        if (!s) return this;
        this._rawState = s;

        const realmInfo = deriveRealmSubLevelInfo(s.realmIndex || 0);
        const realmObj = realmInfo.realmObj || REALMS[0];

        const baseAtk = Math.max(Number(s.atk) || 0, Number(realmObj?.baseAtk) || 28);
        const baseDef = Math.max(Number(s.def) || 0, Number(realmObj?.baseDef) || 14);
        const baseHp = Math.max(Number(s.maxHp) || 0, Number(realmObj?.baseHp) || 1000);
        const baseMp = Math.max(Number(s.maxMp) || 0, Number(realmObj?.baseMp) || 180);

        const daoTam = typeof s.daoTam === 'number' ? Math.max(0, Math.min(100, s.daoTam)) : 100;

        this.player.base_stats = {
            atk: baseAtk,
            def: baseDef,
            hp: baseHp,
            mp: baseMp
        };
        this.player.current_realm = realmInfo.currentRealm;
        this.player.full_realm_name = realmInfo.fullRealmName;
        this.player.realm_index = realmInfo.realmIndex;
        this.player.sub_level = realmInfo.subLevel;
        this.player.tier = realmInfo.tier;
        this.player.tier_multiplier = realmInfo.tierMultiplier;
        this.player.dao_tam = daoTam;
        this.player.tam_ma = 100 - daoTam;
        this.player.exp = Number(s.exp) || 0;
        this.player.max_exp = Number(realmObj?.maxExp) || 1000;
        this.player.hp = Number(s.hp) || baseHp;
        this.player.max_hp = baseHp;
        this.player.mp = Number(s.mp) || baseMp;
        this.player.max_mp = baseMp;
        this.player.stones = Number(s.stones) || 0;

        // Đồng bộ 6 vị trí trang bị (weapon, armor, boots, ring, talisman, artifact)
        const eqSource = s.equippedItems || s.equipment || {};
        const getEquippedFromInv = (slot) => (Array.isArray(s.inventory) ? s.inventory.find(i => i.slot === slot && i.equipped) : null);
        this.equipment.weapon = eqSource.weapon || eqSource.vukhi || eqSource['vu-khi'] || getEquippedFromInv('weapon') || null;
        this.equipment.armor = eqSource.armor || eqSource.giap || eqSource['y-phuc'] || getEquippedFromInv('armor') || null;
        this.equipment.boots = eqSource.boots || eqSource.hai || eqSource.hài || getEquippedFromInv('boots') || null;
        this.equipment.ring = eqSource.ring || eqSource.nhan || getEquippedFromInv('ring') || null;
        this.equipment.talisman = eqSource.talisman || eqSource.ngocboi || eqSource['phu-kien'] || getEquippedFromInv('talisman') || null;
        this.equipment.artifact = eqSource.artifact || eqSource.phapbao || eqSource['phap-bao'] || getEquippedFromInv('artifact') || null;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment.weapon = this.equipment.weapon;
            s.equipment.armor = this.equipment.armor;
            s.equipment.boots = this.equipment.boots;
            s.equipment.ring = this.equipment.ring;
            s.equipment.talisman = this.equipment.talisman;
            s.equipment.artifact = this.equipment.artifact;
        }

        // Đồng bộ mảng công pháp đã học & đang trang bị
        const learnedSkills = [];
        if (Array.isArray(s.skills)) {
            learnedSkills.push(...s.skills);
        }
        if (Array.isArray(s.sectLearnedSkills)) {
            s.sectLearnedSkills.forEach(skillId => {
                if (!learnedSkills.some(sk => (typeof sk === 'string' ? sk === skillId : sk?.id === skillId))) {
                    learnedSkills.push({
                        id: skillId,
                        equipped: true,
                        source: 'sect'
                    });
                }
            });
        }
        if (Array.isArray(s.inventory)) {
            s.inventory.forEach(item => {
                if (item && item.type === 'Công Pháp' && (item.count > 0 || item.learned)) {
                    if (!learnedSkills.some(sk => (typeof sk === 'string' ? sk === item.id : sk?.id === item.id))) {
                        learnedSkills.push({
                            id: item.id,
                            name: item.name,
                            equipped: true,
                            effect: item.effect || null,
                            source: 'inventory'
                        });
                    }
                }
            });
        }
        this.skills = learnedSkills;

        // Đồng bộ túi đồ (tham chiếu trực tiếp mảng inventory để tránh phân mảnh)
        if (Array.isArray(s.inventory)) {
            this.inventory = s.inventory;
        }

        // Tự động tính lại Tổng Chiến Lực nếu hàm calculateTotalStats đã nạp
        if (typeof calculateTotalStats === 'function') {
            const summary = calculateTotalStats(this);
            this.player.total_stats = {
                atk: summary.totalStats.atk,
                def: summary.totalStats.def,
                hp: summary.totalStats.hp,
                mp: summary.totalStats.mp
            };
            this.player.combat_power = summary.combatPower;
        }

        return this;
    },

    /**
     * Đẩy ngược các thay đổi từ GameState xuống đối tượng state hiện hành
     */
    applyToState(targetState = null) {
        const s = targetState || this._rawState || (typeof window !== 'undefined' && window.state) || (typeof state !== 'undefined' ? state : null);
        if (!s) return this;

        if (typeof this.player.exp === 'number') s.exp = this.player.exp;
        if (typeof this.player.hp === 'number') s.hp = this.player.hp;
        if (typeof this.player.mp === 'number') s.mp = this.player.mp;
        if (typeof this.player.dao_tam === 'number') {
            s.daoTam = Math.max(0, Math.min(100, this.player.dao_tam));
            s.tamMa = 100 - s.daoTam;
            this.player.tam_ma = s.tamMa;
        }
        if (typeof this.player.stones === 'number') s.stones = this.player.stones;
        if (typeof this.player.base_stats?.atk === 'number') s.atk = this.player.base_stats.atk;
        if (typeof this.player.base_stats?.def === 'number') s.def = this.player.base_stats.def;
        if (typeof this.player.base_stats?.hp === 'number') s.maxHp = this.player.base_stats.hp;
        if (typeof this.player.base_stats?.mp === 'number') s.maxMp = this.player.base_stats.mp;

        s.equipment = { ...this.equipment };
        if (!s.equippedItems || typeof s.equippedItems !== 'object') {
            s.equippedItems = {};
        }
        Object.assign(s.equippedItems, this.equipment);

        if (Array.isArray(this.inventory)) {
            s.inventory = this.inventory;
        }
        return this;
    },

    /**
     * Setter tập trung: mọi thay đổi đi qua hàm này sẽ tự động tính lại chỉ số và kích hoạt UI Update
     */
    set(pathOrPatch, value = undefined, options = {}) {
        const s = this._rawState || (typeof window !== 'undefined' && window.state) || (typeof state !== 'undefined' ? state : null);

        if (typeof pathOrPatch === 'function') {
            pathOrPatch(this, s);
        } else if (typeof pathOrPatch === 'string') {
            const parts = pathOrPatch.split('.');
            let cursor = this;
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== 'object') {
                    cursor[key] = {};
                }
                cursor = cursor[key];
            }
            const lastKey = parts[parts.length - 1];
            cursor[lastKey] = value;

            // Đồng bộ trực tiếp với raw state cho các trường phổ biến
            if (s) {
                if (pathOrPatch === 'player.exp' || pathOrPatch === 'exp') s.exp = Number(value) || 0;
                else if (pathOrPatch === 'player.hp' || pathOrPatch === 'hp') s.hp = Number(value) || 0;
                else if (pathOrPatch === 'player.mp' || pathOrPatch === 'mp') s.mp = Number(value) || 0;
                else if (pathOrPatch === 'player.dao_tam' || pathOrPatch === 'daoTam') {
                    s.daoTam = Math.max(0, Math.min(100, Number(value) || 0));
                    s.tamMa = 100 - s.daoTam;
                } else if (pathOrPatch === 'player.stones' || pathOrPatch === 'stones') {
                    s.stones = Number(value) || 0;
                } else if (parts[0] === 'equipment' && parts[1]) {
                    const slotName = EQUIP_SLOT_MAPPING[parts[1]] || parts[1];
                    this.equipment[slotName] = value;
                    if (!s.equippedItems) s.equippedItems = {};
                    s.equippedItems[slotName] = value;
                } else if (parts.length === 1 && Object.prototype.hasOwnProperty.call(s, lastKey)) {
                    s[lastKey] = value;
                }
            }
        } else if (pathOrPatch && typeof pathOrPatch === 'object') {
            if (pathOrPatch.player && typeof pathOrPatch.player === 'object') {
                Object.assign(this.player, pathOrPatch.player);
                if (pathOrPatch.player.base_stats) {
                    Object.assign(this.player.base_stats, pathOrPatch.player.base_stats);
                }
            }
            if (pathOrPatch.equipment && typeof pathOrPatch.equipment === 'object') {
                Object.assign(this.equipment, pathOrPatch.equipment);
            }
            if (Array.isArray(pathOrPatch.skills)) {
                this.skills = pathOrPatch.skills;
            }
            if (Array.isArray(pathOrPatch.inventory)) {
                this.inventory = pathOrPatch.inventory;
            }
            if (s) {
                Object.keys(pathOrPatch).forEach(k => {
                    if (!['player', 'equipment', 'skills', 'inventory'].includes(k)) {
                        s[k] = pathOrPatch[k];
                    }
                });
            }
        }

        this.applyToState(s);
        this.syncFromState(s);

        const opts = (typeof value === 'object' && typeof pathOrPatch !== 'string') ? (value || {}) : (options || {});
        if (!opts.silent) {
            if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
                window.updateUI();
            } else if (typeof updateUI === 'function') {
                updateUI();
            }
        }

        if (Array.isArray(this._listeners)) {
            this._listeners.forEach(fn => {
                try {
                    fn(this, s);
                } catch (err) {
                    console.error('[GameState listener error]', err);
                }
            });
        }

        return this;
    },

    update(mutatorOrPatch, options = {}) {
        return this.set(mutatorOrPatch, undefined, options);
    },

    subscribe(listener) {
        if (typeof listener === 'function' && !this._listeners.includes(listener)) {
            this._listeners.push(listener);
        }
        return () => {
            this._listeners = this._listeners.filter(fn => fn !== listener);
        };
    }
};

function setGameState(pathOrPatch, value, options) {
    return GameState.set(pathOrPatch, value, options);
}

function updateGameState(mutatorOrPatch, options) {
    return GameState.update(mutatorOrPatch, options);
}

function syncGameState(sourceState = null) {
    return GameState.syncFromState(sourceState);
}

if (typeof window !== 'undefined') {
    window.GameState = GameState;
    window.setGameState = setGameState;
    window.updateGameState = updateGameState;
    window.syncGameState = syncGameState;
    window.FORGE_RECIPES = FORGE_RECIPES;
    window.ALCHEMY_RECIPES = ALCHEMY_RECIPES;
}
if (typeof globalThis !== 'undefined') {
    globalThis.GameState = GameState;
    globalThis.setGameState = setGameState;
    globalThis.updateGameState = updateGameState;
    globalThis.syncGameState = syncGameState;
    globalThis.FORGE_RECIPES = FORGE_RECIPES;
    globalThis.ALCHEMY_RECIPES = ALCHEMY_RECIPES;
}

// Tự động nạp Vạn Dược Tiên Đỉnh & Thần Binh Bảo Khố trong môi trường Node/Browser
if (typeof require !== 'undefined') {
    if (typeof globalThis.EQUIPMENT_DATA === 'undefined') {
        try {
            const eqModule = require('./equipment_data.js');
            if (eqModule && eqModule.EQUIPMENT_DATA) globalThis.EQUIPMENT_DATA = eqModule.EQUIPMENT_DATA;
        } catch (e) {}
    }
    if (typeof globalThis.PILLS_DATA === 'undefined' || typeof globalThis.HERBS_DATA === 'undefined') {
        try {
            const alchModule = require('./alchemy_data.js');
            if (alchModule) {
                if (alchModule.PILLS_DATA) globalThis.PILLS_DATA = alchModule.PILLS_DATA;
                if (alchModule.HERBS_DATA) globalThis.HERBS_DATA = alchModule.HERBS_DATA;
                if (alchModule.RECIPES_DATA) globalThis.RECIPES_DATA = alchModule.RECIPES_DATA;
                if (alchModule.CAULDRONS_DATA) globalThis.CAULDRONS_DATA = alchModule.CAULDRONS_DATA;
                if (alchModule.HEAVENLY_FLAMES_DATA) globalThis.HEAVENLY_FLAMES_DATA = alchModule.HEAVENLY_FLAMES_DATA;
            }
        } catch (e) {}
    }
}

const catalogToSync = (typeof globalThis.EQUIPMENT_DATA !== 'undefined' && Array.isArray(globalThis.EQUIPMENT_DATA))
    ? globalThis.EQUIPMENT_DATA
    : ((typeof window !== 'undefined' && Array.isArray(window.EQUIPMENT_DATA)) ? window.EQUIPMENT_DATA : []);

if (Array.isArray(catalogToSync) && catalogToSync.length > 0 && Array.isArray(DEFAULT_STATE.inventory)) {
    catalogToSync.forEach(eq => {
        if (!DEFAULT_STATE.inventory.some(i => i && i.id === eq.id)) {
            DEFAULT_STATE.inventory.push(structuredClone(eq));
        }
    });
}

// Đồng bộ toàn bộ Thảo Dược & Đan Dược mới vào DEFAULT_STATE.inventory
const allAlchemyItems = [
    ...(typeof globalThis.HERBS_DATA !== 'undefined' && Array.isArray(globalThis.HERBS_DATA) ? globalThis.HERBS_DATA : (typeof window !== 'undefined' && Array.isArray(window.HERBS_DATA) ? window.HERBS_DATA : [])),
    ...(typeof globalThis.PILLS_DATA !== 'undefined' && Array.isArray(globalThis.PILLS_DATA) ? globalThis.PILLS_DATA : (typeof window !== 'undefined' && Array.isArray(window.PILLS_DATA) ? window.PILLS_DATA : []))
];

if (allAlchemyItems.length > 0 && Array.isArray(DEFAULT_STATE.inventory)) {
    allAlchemyItems.forEach(alchItem => {
        if (!DEFAULT_STATE.inventory.some(i => i && i.id === alchItem.id)) {
            DEFAULT_STATE.inventory.push(structuredClone(alchItem));
        }
    });
}

// Đồng bộ ALCHEMY_RECIPES nếu nạp sau
const extraRecipes = (typeof globalThis.RECIPES_DATA !== 'undefined' && Array.isArray(globalThis.RECIPES_DATA))
    ? globalThis.RECIPES_DATA
    : ((typeof window !== 'undefined' && Array.isArray(window.RECIPES_DATA)) ? window.RECIPES_DATA : []);

if (extraRecipes.length > 0 && Array.isArray(ALCHEMY_RECIPES)) {
    extraRecipes.forEach(rec => {
        if (!ALCHEMY_RECIPES.some(r => r.id === rec.id)) {
            ALCHEMY_RECIPES.push(structuredClone(rec));
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REALMS,
        DEMON_TOWER_MONSTERS,
        TOWER_REALM_NAMES,
        DEMON_TOWER_TIERS_CONFIG,
        DemonTowerData,
        DEFAULT_STATE,
        GameState,
        FORGE_RECIPES,
        ALCHEMY_RECIPES,
        EQUIPMENT_DATA: catalogToSync,
        HERBS_DATA: globalThis.HERBS_DATA || [],
        PILLS_DATA: globalThis.PILLS_DATA || [],
        RECIPES_DATA: globalThis.RECIPES_DATA || [],
        setGameState,
        updateGameState,
        syncGameState,
        getDemonTowerMonster,
        calculateCombatDamage,
        calculateMonsterCombatPower
    };
}

// Clean gameplay baseline; the item catalog remains available for reward lookups.
function createFreshGameplayState(previous = null) {
    const fresh = structuredClone(DEFAULT_STATE);
    fresh.linhKhi = 0;
    fresh.inventory = [];
    fresh.equipped = {};
    fresh.playerLinhCan = { kim: 1, moc: 1, thuy: 1, hoa: 1, tho: 1 };
    fresh.spiritualRoot.pillars = { metal: 1, wood: 1, water: 1, fire: 1, earth: 1 };
    fresh.fiveElements = { ...fresh.playerLinhCan };
    fresh.auto = Object.fromEntries(Object.keys(fresh.auto).map(key => [key, false]));
    fresh.talismans = Object.fromEntries(Object.keys(fresh.talismans).map(key => [key, 0]));
    fresh.arenaHonor = 0;
    fresh.auctionData.currentBid = 0;
    fresh.auctionData.highestBidder = null;
    fresh.auctionData.isPlayerHighest = false;
    fresh.manualArtGiftV1 = true;
    fresh.lastOnlineTime = Date.now();
    fresh.lastArenaTicketRecharge = Date.now();
    if (previous?.player) {
        fresh.player.name = previous.player.name || fresh.player.name;
        fresh.player.avatar_url = previous.player.avatar_url || fresh.player.avatar_url;
    }
    if (previous?.avatar_url) fresh.avatar_url = previous.avatar_url;
    return fresh;
}

// Per-level root bonuses. Percentage values use percentage points except critDamage.
const ROOT_STAT_RULES = Object.freeze({ atk:25, hp:250, def:15, mp:5, armorPen:.1, regen:.5, dodge:.05, speed:.2, crit:.1, critDamage:.005, critResist:.1 });
function getRootStatBonuses(player) {
    const names = {metal:'kim',wood:'moc',water:'thuy',fire:'hoa',earth:'tho'};
    const levels = Object.fromEntries(Object.entries(names).map(([key,id]) => [key, Math.min(100,Math.max(0,Number(player.playerLinhCan?.[id] ?? player.spiritualRoot?.pillars?.[key]) || 0))]));
    const r = ROOT_STAT_RULES;
    return { levels, atk:levels.metal*r.atk, hp:levels.wood*r.hp, def:levels.earth*r.def, mp:levels.water*r.mp,
        armorPen:levels.metal*r.armorPen, regen:levels.wood*r.regen, dodge:levels.water*r.dodge, speed:levels.water*r.speed,
        crit:levels.fire*r.crit, critDamage:levels.fire*r.critDamage, critResist:levels.earth*r.critResist,
        resonance:Math.floor(Math.min(...Object.values(levels))/ELEMENTAL_RESONANCE.step)*ELEMENTAL_RESONANCE.bonusPerStep };
}
const ROOT_BREAKTHROUGH_RULES = Object.freeze({ requiredRealm:'Đại Thừa', requiredStage:'Viên Mãn', chance:.01 });
function canAttemptRootCap(realm) {
    const name = String(realm?.name || realm?.title || '').normalize('NFC').toLocaleLowerCase('vi');
    const stage = String(realm?.stageName || realm?.stage || realm?.minorName || '').normalize('NFC').toLocaleLowerCase('vi');
    return name.includes('đại thừa') && (name.includes('viên mãn') || stage.includes('viên mãn'));
}
