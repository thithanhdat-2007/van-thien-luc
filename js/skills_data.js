/**
 * ============================================================================
 * VẤN THIÊN LỤC — TOÀN THƯ HỆ THỐNG CÔNG PHÁP (CULTIVATION TECHNIQUES SYSTEM)
 * ============================================================================
 * 5 Phẩm Cấp: Phàm Phẩm (Trắng) -> Linh Phẩm (Lục) -> Huyền Phẩm (Lam) -> Địa Phẩm (Tím) -> Thiên Phẩm (Vàng Kim)
 * 5 Nhánh Chính: Tâm Pháp, Thể Thuật, Vũ Kỹ, Thân Pháp, Bí Thuật (Bị động)
 * Tổng cộng 48 Bí Tịch Thượng Cổ chuẩn nguyên tác Quỷ Cốc Bát Hoang & Nhất Niệm Tiêu Dao.
 * ============================================================================
 */

// 1. ĐỊNH NGHĨA PHẨM CẤP CÔNG PHÁP (TIERS)
const SKILL_TIERS = {
    pham: {
        id: "pham",
        name: "Phàm Phẩm",
        colorClass: "text-slate-300",
        badgeBg: "bg-slate-800/80 border-slate-600/50",
        hex: "#e2e8f0",
        minRealmIndex: 0,
        minRealmName: "Luyện Khí Kỳ",
        costMultiplier: 1.0,
        icon: "fa-scroll"
    },
    linh: {
        id: "linh",
        name: "Linh Phẩm",
        colorClass: "text-emerald-400",
        badgeBg: "bg-emerald-950/70 border-emerald-500/50",
        hex: "#34d399",
        minRealmIndex: 10,
        minRealmName: "Trúc Cơ Kỳ",
        costMultiplier: 2.5,
        icon: "fa-book-sparkles"
    },
    huyen: {
        id: "huyen",
        name: "Huyền Phẩm",
        colorClass: "text-sky-400",
        badgeBg: "bg-sky-950/70 border-sky-500/50",
        hex: "#38bdf8",
        minRealmIndex: 14,
        minRealmName: "Kết Đan Kỳ",
        costMultiplier: 6.0,
        icon: "fa-book-atlas"
    },
    dia: {
        id: "dia",
        name: "Địa Phẩm",
        colorClass: "text-purple-400",
        badgeBg: "bg-purple-950/70 border-purple-500/50",
        hex: "#c084fc",
        minRealmIndex: 18,
        minRealmName: "Nguyên Anh Kỳ",
        costMultiplier: 15.0,
        icon: "fa-book-skull"
    },
    thien: {
        id: "thien",
        name: "Thiên Phẩm",
        colorClass: "text-amber-400 font-bold",
        badgeBg: "bg-amber-950/80 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
        hex: "#facc15",
        minRealmIndex: 22,
        minRealmName: "Hóa Thần Kỳ",
        costMultiplier: 40.0,
        icon: "fa-book-journal-whills"
    }
};

// 2. ĐỊNH NGHĨA 5 NHÁNH CÔNG PHÁP (CATEGORIES)
const SKILL_CATEGORIES = {
    TamPhap: {
        id: "TamPhap",
        alias: "tam_phap",
        name: "Tâm Pháp",
        english: "Core/Mental Method",
        maxSlotsBase: 1,
        icon: "fa-brain",
        accentColor: "text-amber-400",
        desc: "Quyết định Tốc độ tăng Tu Vi (EXP/giây) và giới hạn Linh Lực (Max MP)."
    },
    TheThuat: {
        id: "TheThuat",
        alias: "the_thuat",
        name: "Thể Thuật",
        english: "Body Tempering",
        maxSlotsBase: 2,
        icon: "fa-shield-halved",
        accentColor: "text-rose-400",
        desc: "Gia cố Sinh Lực (HP), Phòng Ngự (DEF), Hồi phục và Giảm sát thương."
    },
    VuKy: {
        id: "VuKy",
        alias: "cong_kich",
        name: "Vũ Kỹ",
        english: "Martial/Spell Arts",
        maxSlotsBase: 3,
        icon: "fa-khanda",
        accentColor: "text-red-400",
        desc: "Tăng Công Kích (ATK), Tỷ lệ Bạo Kích và kích hoạt Tuyệt Kỹ chiến đấu."
    },
    ThanPhap: {
        id: "ThanPhap",
        alias: "than_phap",
        name: "Thân Pháp",
        english: "Movement/Evasion",
        maxSlotsBase: 1,
        icon: "fa-wind",
        accentColor: "text-teal-400",
        desc: "Tăng Tốc độ đánh (ATK SPD), Tỷ lệ Né Tránh (Dodge) và tẩu thoát."
    },
    BiThuat: {
        id: "BiThuat",
        alias: "bi_thuat",
        name: "Bí Thuật",
        english: "Auxiliary/Secret Arts",
        maxSlotsBase: 99,
        icon: "fa-wand-magic-sparkles",
        accentColor: "text-purple-400",
        desc: "Tác dụng Bị Động vĩnh viễn: Tăng sản lượng Linh Điền, Lò Đan, Tỷ lệ rơi đồ."
    }
};

// Alias map cho tương thích
SKILL_CATEGORIES.tam_phap = SKILL_CATEGORIES.TamPhap;
SKILL_CATEGORIES.the_thuat = SKILL_CATEGORIES.TheThuat;
SKILL_CATEGORIES.cong_kich = SKILL_CATEGORIES.VuKy;
SKILL_CATEGORIES.than_phap = SKILL_CATEGORIES.ThanPhap;
SKILL_CATEGORIES.bi_thuat = SKILL_CATEGORIES.BiThuat;

// 3. ĐỘ THÔNG THẠO (MASTERY LEVELS) — MỖI CẤP TĂNG +20% HIỆU QUẢ GỐC
const MASTERY_LEVELS = [
    { level: 1, name: "Sơ Nhập", mult: 1.0, stoneCost: 100, expCost: 200 },
    { level: 2, name: "Tiểu Thành", mult: 1.2, stoneCost: 350, expCost: 800 },
    { level: 3, name: "Đại Thành", mult: 1.4, stoneCost: 1200, expCost: 3000 },
    { level: 4, name: "Đỉnh Phong", mult: 1.6, stoneCost: 4000, expCost: 12000 },
    { level: 5, name: "Viên Mãn", mult: 2.0, stoneCost: 15000, expCost: 50000, unlocksHiddenBonus: true }
];

// 4. BẢNG QUY TẮC NGŨ HÀNH & NGUYÊN TỐ
const FIVE_ELEMENTS = {
    vo_he: { name: "Vô Hệ", color: "#e2e8f0", generates: null, conquers: null },
    vo_cuc: { name: "Vô Cực", color: "#e2e8f0", generates: null, conquers: null },
    kim: { name: "Kim", color: "#fef08a", generates: "thuy", conquers: "moc" },
    moc: { name: "Mộc", color: "#34d399", generates: "hoa", conquers: "tho" },
    thuy: { name: "Thủy", color: "#38bdf8", generates: "moc", conquers: "hoa" },
    hoa: { name: "Hỏa", color: "#f87171", generates: "tho", conquers: "kim" },
    tho: { name: "Thổ", color: "#fbbf24", generates: "kim", conquers: "thuy" },
    loi: { name: "Lôi", color: "#c084fc", generates: "kim", conquers: "moc" },
    bang: { name: "Băng", color: "#67e8f9", generates: "thuy", conquers: "hoa" },
    phong: { name: "Phong", color: "#5eead4", generates: "hoa", conquers: "tho" },
    am_ma: { name: "Ma/Ám", color: "#fb7185", generates: "thuy", conquers: "hoa" },
    quang: { name: "Quang", color: "#fde047", generates: "kim", conquers: "am_ma" }
};

// 5. DANH SÁCH TOÀN BỘ 48 CÔNG PHÁP CHUẨN NGUYÊN TÁC (SKILLS_DATA)
const SKILLS_DATA = [
    // =========================================================================
    // 1. TÂM PHÁP (Tăng Tốc độ Tu Vi & Giới hạn Linh Lực)
    // =========================================================================
    {
        id: "tp_dan_khi",
        name: "Dẫn Khí Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "pham",
        element: "vo_he",
        stats: { expPerSec: 2 },
        effect: "+2 Tu vi/giây.",
        desc: "Công pháp vỡ lòng của giới tu chân, dẫn dắt linh khí nhập thể lưu chuyển kinh mạch."
    },
    {
        id: "tp_tho_nap",
        name: "Thổ Nạp Pháp",
        type: "TamPhap",
        category: "tam_phap",
        tier: "pham",
        element: "vo_he",
        stats: { expPerSec: 3, maxMp: 50 },
        effect: "+3 Tu vi/giây, +50 Giới hạn Linh Lực.",
        desc: "Hô hấp thổ nạp thuận theo tự nhiên, tích lũy đan điền linh dịch."
    },
    {
        id: "tp_truong_xuan",
        name: "Trường Xuân Công",
        type: "TamPhap",
        category: "tam_phap",
        tier: "linh",
        element: "moc",
        stats: { expPerSec: 15, hpPercent: 0.10, idleRegenHpPercent: 0.01 },
        effect: "+15 Tu vi/giây, +10% HP tối đa. Hồi phục nhẹ khi nhàn rỗi.",
        desc: "Tâm pháp Mộc hệ trường tồn, sinh cơ dồi dào như cổ mộc ngàn năm bất lão."
    },
    {
        id: "tp_hoa_van",
        name: "Hỏa Vân Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "linh",
        element: "hoa",
        stats: { expPerSec: 18, fireDamagePercent: 0.05 },
        effect: "+18 Tu vi/giây, tăng 5% sát thương hệ Hỏa.",
        desc: "Linh lực hóa thành hỏa vân rực lửa, tăng uy lực cho mọi pháp thuật Hỏa hệ."
    },
    {
        id: "tp_tu_ha",
        name: "Tử Hà Tâm Pháp",
        type: "TamPhap",
        category: "tam_phap",
        tier: "huyen",
        element: "vo_he",
        stats: { expPerSec: 80, spiritFarmRateBonus: 0.20 },
        effect: "+80 Tu vi/giây, +20% Tốc độ hấp thụ Linh Khí trong Linh Điền.",
        desc: "Đón lấy tia tử khí đông lai lúc rạng đông, khuếch đại linh khí chu thiên."
    },
    {
        id: "tp_bang_tam",
        name: "Băng Tâm Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "huyen",
        element: "thuy",
        stats: { expPerSec: 75, immuneBackfire: true },
        effect: "+75 Tu vi/giây. Miễn nhiễm 'Tẩu Hỏa Nhập Ma' khi đột phá.",
        desc: "Tâm cảnh trong trẻo như băng tuyết vạn năm, tà ma không thể xâm lấn đạo tâm."
    },
    {
        id: "tp_dai_dien",
        name: "Đại Diễn Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "vo_he",
        stats: { expPerSec: 500, extraMartialSlots: 1, sensePercent: 0.50 },
        effect: "+500 Tu vi/giây. Mở khóa thêm 1 ô trang bị Vũ Kỹ, tăng 50% Thần Thức.",
        desc: "Bí điển tôi rèn thần thức tối thượng, phân chia vạn luồng ý niệm điều khiển thiên địa quy tắc."
    },
    {
        id: "tp_huyet_ma",
        name: "Huyết Ma Công",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "am_ma",
        stats: { expPerSec: 600, damageToTuViPercent: 0.05 },
        effect: "+600 Tu vi/giây. Chuyển hóa 5% sát thương gây ra thành Tu Vi.",
        desc: "Ma công bá đạo thượng cổ, lấy chiến dưỡng chiến, rút tỉa sinh linh hóa thành tu vi."
    },
    {
        id: "tp_thai_thuong",
        name: "Thái Thượng Hóa Thần Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        element: "vo_he",
        stats: { expPerSec: 3000, breakthroughExpDiscount: 0.15 },
        effect: "+3000 Tu vi/giây. Giảm 15% lượng Tu Vi cần để đột phá tiểu/đại cảnh giới.",
        desc: "Công pháp trấn phái Đạo Môn, thuận theo tự nhiên hóa thân cùng trời đất, vô dục vô cầu."
    },
    {
        id: "tp_hon_don",
        name: "Hỗn Độn Âm Dương Kinh",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        element: "vo_he",
        stats: { expPerSec: 4000, omniElementSynergy: true },
        effect: "+4000 Tu vi/giây. Kích hoạt Duyên Phận với mọi loại Ngũ Hành.",
        desc: "Bao hàm âm dương thái cực vạn vật sơ khai, mọi đạo pháp thiên hạ đều khởi nguồn từ đây."
    },

    // =========================================================================
    // 2. THỂ THUẬT (Tăng Máu, Phòng Ngự, Kháng)
    // =========================================================================
    {
        id: "tt_thiet_bo_sam",
        name: "Thiết Bố Sam",
        type: "TheThuat",
        category: "the_thuat",
        tier: "pham",
        element: "tho",
        stats: { def: 50, hp: 200 },
        effect: "+50 Thủ, +200 HP.",
        desc: "Luyện cơ bắp và da thịt cứng như thép nguội, che chắn đòn đánh phàm tục."
    },
    {
        id: "tt_nguu_ma",
        name: "Ngưu Ma Quyền",
        type: "TheThuat",
        category: "the_thuat",
        tier: "pham",
        element: "tho",
        stats: { hp: 80, atk: 10 },
        effect: "+80 HP, +10 Công vật lý.",
        desc: "Mô phỏng sức mạnh man ngưu, gân cốt dẻo dai cường kiện."
    },
    {
        id: "tt_kim_cuong",
        name: "Kim Cương Quyết",
        type: "TheThuat",
        category: "the_thuat",
        tier: "linh",
        element: "kim",
        stats: { defPercent: 0.15, damageReduction: 0.05 },
        effect: "+15% Thủ, giảm 5% sát thương nhận vào.",
        desc: "Hấp thụ kim khí rèn đúc xương cốt, thân thể tỏa ra ánh sáng hoàng kim lấp lánh."
    },
    {
        id: "tt_bang_co",
        name: "Băng Cơ Ngọc Cốt",
        type: "TheThuat",
        category: "the_thuat",
        tier: "linh",
        element: "thuy",
        stats: { hpPercent: 0.20, onHitSlowEnemyAtkSpeed: 0.10 },
        effect: "+20% HP. Nếu bị tấn công, giảm 10% tốc độ đánh của kẻ địch.",
        desc: "Thân thể tựa ngọc lạnh giá băng, sát thương chạm vào liền đông cứng chân khí đối phương."
    },
    {
        id: "tt_huyen_quy",
        name: "Huyền Quy Hộ Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "tho",
        stats: { hpPercent: 0.30, shieldEvery5sPercent: 0.10 },
        effect: "+30% HP. Mỗi 5 giây tạo khiên chắn bằng 10% Max HP.",
        desc: "Mô phỏng lớp giáp vững chãi của Bắc Hải Huyền Quy, linh lực ngưng tụ thành thuẫn hộ thân."
    },
    {
        id: "tt_loi_dinh",
        name: "Lôi Đình Chiến Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "loi",
        stats: { defPercent: 0.25, reflectDefPercent: 0.10 },
        effect: "+25% Thủ. Phản lại sát thương bằng 10% Thủ cơ bản của bản thân.",
        desc: "Rèn luyện nhục thể trong lôi hỏa, đòn tấn công của địch chạm vào sẽ bị lôi điện phản chấn."
    },
    {
        id: "tt_bat_tu_truong_sinh",
        name: "Bất Tử Trường Sinh Kinh",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "moc",
        stats: { combatRegenPercent: 0.03, undyingChance: 0.20 },
        effect: "Hồi 3% HP mỗi giây. Hiệu ứng Bất Khuất: Nhận đòn chí mạng có 20% cơ hội giữ lại 1 máu (1 lần/trận).",
        desc: "Thuật luyện thể thượng cổ kết nối với linh mạch đất trời, vết thương tự lành trong chớp mắt."
    },
    {
        id: "tt_long_tuong",
        name: "Long Tượng Bát Nhã Công",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "tho",
        stats: { defPercent: 0.50, atkPercent: 0.30, ccImmunityBelowNascent: true },
        effect: "+50% Thủ, +30% Công. Kháng mọi hiệu ứng đẩy lùi/choáng dưới cấp Nguyên Anh.",
        desc: "Nắm giữ sức mạnh thập long thập tượng, định thân như trụ trời, chấn nhiếp muôn loài."
    },
    {
        id: "tt_cuu_chuyen",
        name: "Cửu Chuyển Huyền Công",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        element: "vo_he",
        stats: { hpPercent: 1.00, defPercent: 1.00, berserkPerLostHp10Percent: 0.05 },
        effect: "+100% HP và Thủ cơ bản. Mỗi lần bị mất 10% HP, tăng 5% toàn bộ chỉ số.",
        desc: "Đệ nhất thần công luyện thể từ thời Hồng Hoang, chín lần chuyển sinh thân thể sánh ngang thần ma."
    },
    {
        id: "tt_ban_co",
        name: "Bàn Cổ Chân Thân",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        element: "tho",
        stats: { hpPercent: 1.50, trueDamageImmune: true },
        effect: "+150% HP. Trở thành miễn nhiễm với mọi loại sát thương chuẩn (True Damage).",
        desc: "Hóa thân thần linh khai thiên lập địa, thân thể đồng hóa cùng hỗn độn bất hoại."
    },

    // =========================================================================
    // 3. VŨ KỸ (Tăng Công, Bạo kích, Sát thương kỹ năng)
    // =========================================================================
    {
        id: "vk_hoa_cau",
        name: "Hỏa Cầu Thuật",
        type: "VuKy",
        category: "cong_kich",
        tier: "pham",
        element: "hoa",
        stats: { atk: 30, procHit3Damage: 1.50 },
        effect: "+30 Công. Mỗi 3 đòn đánh tung Hỏa Cầu (150% sát thương).",
        desc: "Ngưng tụ Hỏa linh khí phóng ra hỏa cầu thiêu rụi mục tiêu phía trước."
    },
    {
        id: "vk_phong_nhan",
        name: "Phong Nhẫn",
        type: "VuKy",
        category: "cong_kich",
        tier: "pham",
        element: "moc",
        stats: { atk: 25, critRate: 0.02 },
        effect: "+25 Công, +2% Bạo kích.",
        desc: "Ngưng khí thành lưỡi đao gió sắc lẹm, chém đứt sắt đá vô thanh vô tức."
    },
    {
        id: "vk_ngu_kiem",
        name: "Ngự Kiếm Thuật",
        type: "VuKy",
        category: "cong_kich",
        tier: "linh",
        element: "kim",
        stats: { atk: 100, critRate: 0.05, doubleAttackChance: 0.15 },
        effect: "+100 Công, +5% Bạo kích. Đòn đánh có cơ hội tấn công 2 lần.",
        desc: "Ngự khí ngự kiếm, phi kiếm xuất vỏ chém rách hư không trong cự ly ngàn bước."
    },
    {
        id: "vk_thuy_lao",
        name: "Thủy Lao Thuật",
        type: "VuKy",
        category: "cong_kich",
        tier: "linh",
        element: "thuy",
        stats: { atk: 80, rootEnemyChance: 0.10, rootDuration: 2 },
        effect: "+80 Công. Đòn đánh có 10% trói chân quái 2 giây.",
        desc: "Linh dịch hóa lỏng giam cầm đối thủ trong bong bóng nước ngột ngạt."
    },
    {
        id: "vk_thanh_nguyen",
        name: "Thanh Nguyên Kiếm Mang",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "kim",
        stats: { atkPercent: 0.25, armorIgnoreChance: 0.15, armorIgnorePercent: 0.20 },
        effect: "+25% Công. 15% cơ hội bỏ qua 20% Phòng ngự của địch.",
        desc: "Kiếm quyết danh chấn thiên hạ của Thanh Nguyên Kiếm Tông, kiếm khí như rừng trúc xanh sắc bén."
    },
    {
        id: "vk_liet_dia",
        name: "Liệt Địa Trảm",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "tho",
        stats: { atkPercent: 0.30, aoeProcEvery4sPercent: 1.20 },
        effect: "+30% Công. Gây sát thương diện rộng (AoE) bằng 120% Công mỗi 4 giây.",
        desc: "Một đao chém vỡ mặt đất, địa chấn lan tỏa nghiền nát quần yêu."
    },
    {
        id: "vk_tich_ta_than_loi",
        name: "Tịch Tà Thần Lôi",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "loi",
        stats: { atkPercent: 0.50, critDmgBonus: 0.30, startCombatDamagePercent: 3.00 },
        effect: "+50% Công, +30% Sát thương Bạo Kích. Đầu trận giáng sét gây 300% Công kích.",
        desc: "Kim sắc thần lôi chuyên khắc tà ma yêu dị, vừa xuất thế vạn ma cúi đầu."
    },
    {
        id: "vk_hu_khong",
        name: "Hư Không Phá Diệt",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "vo_he",
        stats: { atkPercent: 0.60, critExecuteNonBossHpPercent: 0.05 },
        effect: "+60% Công. Đòn bạo kích sẽ hủy diệt 5% HP tối đa của địch (không áp dụng với Boss).",
        desc: "Xé toạc vết nứt hư không, nuốt chửng sinh mạng đối phương vào bóng tối vô tận."
    },
    {
        id: "vk_van_kiem_quy_tong",
        name: "Vạn Kiếm Quy Tông",
        type: "VuKy",
        category: "cong_kich",
        tier: "thien",
        element: "kim",
        stats: { atkPercent: 1.20, trueDamageHpPercent: 0.05, trueDamageCapAtkMult: 5.0 },
        effect: "+120% Công. Mỗi đòn đánh gọi kiếm khí gây True Damage = 5% HP hiện tại của mục tiêu (Cap ở 500% Công bản thân).",
        desc: "Cực hạn kiếm đạo! Hóa vạn kiếm thành mưa kiếm trảm diệt thiên địa, không giáp nào đỡ nổi."
    },
    {
        id: "vk_phan_thien",
        name: "Phần Thiên Chử Hải",
        type: "VuKy",
        category: "cong_kich",
        tier: "thien",
        element: "hoa",
        stats: { atkPercent: 1.50, burnEnemyMaxHpDps: 0.02, enemyHealingReduction: 0.50 },
        effect: "+150% Công. Thiêu đốt địch mất 2% HP tối đa mỗi giây, giảm 50% khả năng hồi máu của địch.",
        desc: "Chân hỏa Phần Thiên có thể đun sôi biển cả thiêu rụi trời xanh, vạn vật hóa tro bụi."
    },

    // =========================================================================
    // 4. THÂN PHÁP (Tăng Tốc đánh, Né tránh, Lịch luyện)
    // =========================================================================
    {
        id: "tp_khinh_than",
        name: "Khinh Thân Thuật",
        type: "ThanPhap",
        category: "than_phap",
        tier: "pham",
        element: "vo_he",
        stats: { dodgeRate: 0.05, expeditionSpeedBonus: 0.10 },
        effect: "+5% Né tránh, +10% Tốc độ di chuyển lịch luyện.",
        desc: "Thân thể nhẹ như lông hồng, nhẹ nhàng lướt trên ngọn cỏ né tránh sát thương."
    },
    {
        id: "tp_tat_phong",
        name: "Tật Phong Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "pham",
        element: "moc",
        stats: { atkSpeedPercent: 0.05 },
        effect: "+5% Tốc độ đánh.",
        desc: "Bước chân theo chiều gió thổi, rút ngắn thời gian vung vũ khí."
    },
    {
        id: "tp_lang_ba",
        name: "Lăng Ba Vi Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "thuy",
        stats: { dodgeRate: 0.10, fleeSuccessBelowHp30: 0.50 },
        effect: "+10% Né tránh, tăng tỷ lệ bỏ chạy thành công khi HP < 30%.",
        desc: "Chân đạp sóng nước hư ảo, đối thủ chỉ có thể chém trúng tàn ảnh lướt qua."
    },
    {
        id: "tp_dap_tuyet",
        name: "Đạp Tuyết Tầm Mai",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "thuy",
        stats: { atkSpeedPercent: 0.12, immuneSlow: true },
        effect: "+12% Tốc độ đánh. Kháng hiệu ứng làm chậm.",
        desc: "Lướt trên tuyết không để lại dấu chân, miễn nhiễm mọi hàn khí làm chậm."
    },
    {
        id: "tp_ngu_phong",
        name: "Ngự Phong Quyết",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        element: "moc",
        stats: { atkSpeedPercent: 0.15, dodgeRate: 0.10 },
        effect: "+15% Tốc độ đánh, +10% Né tránh.",
        desc: "Hòa mình cùng cuồng phong, tốc độ xuất chiêu và di chuyển nhanh như chớp giật."
    },
    {
        id: "tp_loi_quang",
        name: "Lôi Quang Độn",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        element: "loi",
        stats: { atkSpeedPercent: 0.20, onDodgeBuffAtkPercent: 0.30, onDodgeBuffDuration: 2 },
        effect: "+20% Tốc đánh. Sau khi né tránh thành công, tăng 30% Công trong 2 giây.",
        desc: "Biến thành một luồng điện xẹt qua khe hở của đòn tấn công, chớp thời cơ phản kích."
    },
    {
        id: "tp_thuan_di",
        name: "Thuấn Di Thuật",
        type: "ThanPhap",
        category: "than_phap",
        tier: "dia",
        element: "vo_he",
        stats: { dodgeRate: 0.20, lethalDodgeCooldown: 30 },
        effect: "+20% Né tránh. Khi nhận sát thương chí mạng, lập tức dịch chuyển ra xa, né hoàn toàn đòn đó (Hồi chiêu 30s).",
        desc: "Thuật dịch chuyển không gian vi diệu, thoát khỏi đòn kết liễu trong gang tấc."
    },
    {
        id: "tp_huyet_don",
        name: "Huyết Độn Đại Pháp",
        type: "ThanPhap",
        category: "than_phap",
        tier: "dia",
        element: "am_ma",
        stats: { activeCostHp10Dodge100Duration: 3 },
        effect: "Chủ động: Tiêu hao 10% HP để né 100% mọi đòn tấn công trong 3 giây.",
        desc: "Thiêu đốt tinh huyết trốn vào hư không, đòn đánh kẻ thù đều chém vào hư vô."
    },
    {
        id: "tp_suc_dia",
        name: "Súc Địa Thành Thốn",
        type: "ThanPhap",
        category: "than_phap",
        tier: "thien",
        element: "vo_he",
        stats: { atkSpeedPercent: 0.30, dodgeRate: 0.25, emergencyDodgeBonus: 0.50 },
        effect: "+30% Tốc đánh, +25% Né tránh. Khi HP dưới 20%, tăng thêm 50% Né.",
        desc: "Không gian đại pháp! Một bước thu vạn dặm thành gang tấc, đi lại tự do trong hư không."
    },
    {
        id: "tp_cuu_tieu",
        name: "Cửu Tiêu Lăng Vân Độn",
        type: "ThanPhap",
        category: "than_phap",
        tier: "thien",
        element: "loi",
        stats: { atkSpeedPercent: 0.40, onDodgeLightningCounterAtkPercent: 2.00 },
        effect: "+40% Tốc đánh. Mỗi lần né tránh thành công, giáng lôi kích trả đũa 200% Công.",
        desc: "Thân pháp độ kiếp đỉnh cao, thân lướt chín tầng mây, né đòn đồng thời gọi lôi phạt giáng đầu đối thủ."
    },

    // =========================================================================
    // 5. BÍ THUẬT (Passive/Phụ trợ Không giới hạn ô trang bị)
    // =========================================================================
    {
        id: "bt_linh_duoc",
        name: "Linh Dược Đồ Lục",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "pham",
        element: "vo_he",
        stats: { herbDropRateBonus: 0.05 },
        effect: "+5% tỷ lệ rơi thảo dược khi Lịch luyện.",
        desc: "Ghi chép hình dáng đặc điểm của vạn loài linh dược phàm trần."
    },
    {
        id: "bt_than_nong",
        name: "Thần Nông Bản Thảo Kinh",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "linh",
        element: "moc",
        stats: { farmYieldBonus: 0.20, farmGrowSpeedBonus: 0.10 },
        effect: "Tăng 20% sản lượng Linh Điền, giảm 10% thời gian trồng.",
        desc: "Bí kíp của Thần Nông truyền thừa, thấu hiểu dược tính muôn loài cây cỏ."
    },
    {
        id: "bt_khong_hoa",
        name: "Khống Hỏa Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "linh",
        element: "hoa",
        stats: { alchemySuccessBonus: 0.15 },
        effect: "Tăng 15% tỷ lệ luyện đan thành công.",
        desc: "Nắm giữ chân hỏa điều khiển nhiệt độ Lò Đan vi diệu tới từng sợi chân khí."
    },
    {
        id: "bt_khoi_loi",
        name: "Khôi Lỗi Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "huyen",
        element: "vo_he",
        stats: { offlineAutoAttackMaxHours: 4 },
        effect: "Tự động thay người chơi bấm tấn công quái khi offline (tối đa 4 giờ).",
        desc: "Chế tạo thần mộc khôi lỗi thay bản thân trông coi động phủ và trảm yêu."
    },
    {
        id: "bt_thien_co",
        name: "Thiên Cơ Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "vo_he",
        stats: { towerStonesBonus: 0.25, previewBossStats: true },
        effect: "Tăng 25% lượng Linh Thạch rơi ra ở Trấn Yêu Tháp. Mở khóa xem trước chỉ số Boss.",
        desc: "Bói toán mệnh số, tính toán thiên cơ giúp tầm bảo luôn thuận buồm xuôi gió."
    },
    {
        id: "bt_suu_hon",
        name: "Sưu Hồn Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "am_ma",
        stats: { stealLowSkillChance: 0.05 },
        effect: "Tỷ lệ 5% đánh cắp công pháp cấp thấp của đối thủ khi PvP hoặc đánh NPC.",
        desc: "Tìm tòi ký ức của đối thủ đã bại trận, cưỡng chế phục chế công pháp đối phương."
    },
    {
        id: "bt_phe_hon",
        name: "Phệ Hồn Đại Pháp",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        element: "am_ma",
        stats: { towerKillHealPercent: 0.20, towerKillExpBonus: 0.10 },
        effect: "Khi diệt quái Trấn Yêu Tháp, hút 20% HP và nhận thêm 10% Tu vi.",
        desc: "Tà công thượng cổ nuốt chửng linh hồn và tu vi của yêu thú vừa bị trảm sát."
    },
    {
        id: "bt_nhat_khi",
        name: "Nhất Khí Hóa Tam Thanh",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        element: "vo_he",
        stats: { dualExpeditionAvatar: true },
        effect: "Tạo ra 1 Phân thân tự động đi Lịch luyện ở một bản đồ khác, thu thập tài nguyên song song với nhân vật chính.",
        desc: "Đạo gia tối cao tuyệt kỹ, một niệm hóa ba thân, cùng lúc tầm bảo khắp cửu châu bát hoang."
    },

    // =========================================================================
    // 6. THÁI CỔ MA DIỆN & TỬ SÁT (SET 1: PRIMORDIAL DEMONIC & SLAUGHTER)
    // =========================================================================
    {
        id: "tp_cuu_u_minh_de",
        name: "🌌 Cửu U Minh Đế Kinh",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "am_ma",
        stats: { expPerSec: 750, hpPercent: 0.15, damageToShieldPercent: 0.12, lowHpExpBonus: 1.5 },
        effect: "+750 Tu vi/giây, +15% HP tối đa. Khi HP dưới 35%, tăng +150% Tu vi thu được và chuyển 12% sát thương gây ra thành Huyết Thuẫn hộ thể.",
        desc: "Minh giới chí cao kinh điển, đan xen oán niệm và tử khí vạn kiếp tôi luyện thần hồn Ma Đế."
    },
    {
        id: "tt_bach_cot_thien_ma",
        name: "💀 Bạch Cốt Thiên Ma Thân",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "am_ma",
        stats: { hp: 350, def: 45, damageReflectPercent: 0.25 },
        effect: "+350 HP, +45 Thủ. Cốt Giáp Nghịch Sát: Phản phệ 25% sát thương gánh chịu ngược lại kẻ địch.",
        desc: "Đốt tủy thành cốt thép, bạch cốt u linh bao phủ thân thể đẩy lùi sát chiêu của đối thủ."
    },
    {
        id: "vk_tuyet_tinh_huyet_kiem",
        name: "🩸 Tuyệt Tình Huyết Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "am_ma",
        stats: { atk: 180, critRate: 0.08, lostHpLifestealPercent: 0.15 },
        effect: "+180 Công Kích, +8% Bạo Kích. Thị Huyết Cuồng Sát: Đòn đánh hút máu tương đương 15% lượng HP đã mất của bản thân.",
        desc: "Kiếm chiêu thị huyết đoạn tuyệt nhân tình, người càng gần cõi chết thì mũi kiếm càng sắc nhọn."
    },
    {
        id: "thp_u_anh_quy_bo",
        name: "👤 U Ảnh Quỷ Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "am_ma",
        stats: { dodgeRate: 0.08, atkSpeedPercent: 0.12, critOnDodge: true },
        effect: "+8% Né Tránh, +12% Tốc độ đánh. Hư Ảo Dạ Hành: Khi né tránh thành công, đòn đánh kế tiếp chắc chắn kích hoạt Bạo Kích.",
        desc: "Bước chân mờ ảo như bóng ma dạ hành, biến ảo khôn lường giữa hư vô."
    },
    {
        id: "bt_luyen_hon_doat_phach",
        name: "🔮 Luyện Hồn Đoạt Phách Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        element: "am_ma",
        stats: { atk: 50, hp: 300, towerKillExpBonus: 0.25, soulHarvestBonus: true },
        effect: "+50 Công, +300 HP, +25% Tu vi khi trảm quái Trấn Yêu Tháp. Rút đoạt oán hồn yêu ma tăng sức mạnh vĩnh viễn.",
        desc: "Bí thuật phong ấn hồn phách sinh linh, chuyển hóa oán niệm vạn dặm thành linh uy nghịch thiên."
    },
    {
        id: "vk_am_sat_u_kiem",
        name: "🗡️ Ám Sát U Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "linh",
        element: "kim",
        stats: { atk: 70, critRate: 0.05, healReductionPercent: 0.40 },
        effect: "+70 Công Kích, +5% Bạo Kích. Đánh bạo kích ghim U Độc làm mục tiêu giảm 40% khả năng hồi phục trong 5s.",
        desc: "Kiếm thuật ẩn núp trong màn đêm, chuyên rạch đứt linh mạch ngăn địch thổ nạp trị thương."
    },

    // =========================================================================
    // 7. THIÊN ĐẠO THẦN LÔI & THÁI DƯƠNG QUANG HOẰNG (SET 2: CELESTIAL THUNDER & RADIANCE)
    // =========================================================================
    {
        id: "tp_dai_nhat_thien_manh",
        name: "☀️ Đại Nhật Cửu Dương Thần Công",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        element: "quang",
        stats: { expPerSec: 1200, maxMp: 400, startCombatShieldPercent: 0.50 },
        effect: "+1,200 Tu vi/giây, +400 MP. Chí Dương Hộ Thể: Đầu trận tạo Kim Quang Thánh Thuẫn tương đương 50% Max HP.",
        desc: "Hội tụ chín vầng thái dương vào đan điền, kim quang rực rỡ như vầng dương giữa trưa thiêu rụi tà ma."
    },
    {
        id: "tt_cuu_chuyen_loi_the",
        name: "⚡ Cửu Chuyển Lôi Kiếp Kim Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "loi",
        stats: { hp: 2200, def: 180, damageReduction: 0.12, tribulationDmgImmune: true },
        effect: "+2,200 HP, +180 Thủ, -12% Sát thương nhận vào. Giảm 50% sát thương từ Lôi Kiếp khi độ kiếp.",
        desc: "Lấy lôi kiếp cửu thiên tôi luyện da thịt gân cốt, thân thể kiên cố như thuẫn sét không thể xuyên thủng."
    },
    {
        id: "vk_tieu_dao_loi_kiem",
        name: "🌩️ Tử Tiêu Phá Thiên Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "loi",
        stats: { atk: 120, critRate: 0.07, lightningBurstBonus: 0.80 },
        effect: "+120 Công Kích, +7% Bạo Kích. Lôi Đình Phẫn Nộ: Khi HP địch trên 70%, đòn đánh phóng điện gây thêm +80% sát thương.",
        desc: "Dẫn sấm sét tử tiêu giáng thế, chém toạc lồng ngực yêu ma ngay khi vừa khai chiến."
    },
    {
        id: "thp_phong_loi_huyen_ao",
        name: "🌪️ Phong Lôi Huyễn Hóa Thân",
        type: "ThanPhap",
        category: "than_phap",
        tier: "dia",
        element: "phong",
        stats: { dodgeRate: 0.14, atkSpeedPercent: 0.20, dodgeCounterLightningPercent: 1.2 },
        effect: "+14% Né Tránh, +20% Tốc độ đánh. Lôi Ảnh Phản Kích: Khi né tránh thành công, phản lại sát thương lôi đình bằng 120% Công Kích.",
        desc: "Bộ pháp hòa mình vào cuồng phong sấm sét, lướt qua để lại tàn ảnh sét đánh cháy rụi kẻ địch."
    },
    {
        id: "bt_quang_minh_thien_y",
        name: "🪽 Quang Minh Thánh Dực Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "quang",
        stats: { expPerSec: 150, critRate: 0.05, critDoubleExpBuff: true },
        effect: "+150 Tu vi/giây, +5% Bạo Kích. Thiên Phúc Ban Thần: Tự động kích hoạt x2 Tu vi nhận được trong 10 giây mỗi khi đánh bạo kích.",
        desc: "Thánh tích quang minh ban phúc, đốn ngộ thiên đạo qua từng đường kiếm chí mạng chấn động hư không."
    },
    {
        id: "tt_duong_viem_hoa_cot",
        name: "🔆 Dương Viêm Hóa Cốt Thuật",
        type: "TheThuat",
        category: "the_thuat",
        tier: "linh",
        element: "hoa",
        stats: { hp: 280, def: 25, thornDamage: 20 },
        effect: "+280 HP, +25 Thủ. Kẻ địch tấn công cận chiến sẽ bị lửa thiêu đốt phản lại 20 sát thương cố định.",
        desc: "Tủy biến thành lửa đỏ hừng hực, dung nham chảy trong huyết mạch thiêu rụi kẻ nào chạm vào."
    },

    // =========================================================================
    // 8. BĂNG PHÁCH HÀN KINH & THÂM UYÊN HÀN TRIỀU (SET 3: GLACIAL SOUL & FROST)
    // =========================================================================
    {
        id: "tp_van_nien_han_bang",
        name: "❄️ Vạn Niên Hàn Băng Tuyệt Thư",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "bang",
        stats: { expPerSec: 480, maxMp: 150, tamMaResistance: 0.50 },
        effect: "+480 Tu vi/giây, +150 MP. Cực Hàn Trấn Thần: Giảm 50% tốc độ tích tụ Tâm Ma khi tu luyện.",
        desc: "Hấp thụ cực hàn u cốc ngàn năm, giữ vững đạo tâm thanh tịnh tựa hàn băng ngọc bích."
    },
    {
        id: "tt_huyen_bang_ngoc_cot",
        name: "🧊 Huyền Băng Ngọc Cốt Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "bang",
        stats: { hp: 600, def: 75, damageReduction: 0.08 },
        effect: "+600 HP, +75 Thủ, -8% Sát thương nhận vào. Giảm thiểu nguy cơ trọng thương khi bị bạo kích.",
        desc: "Gân cốt tôi luyện qua trăm ngọn băng hà, cứng rắn sáng bóng như ngọc thạch nghìn trượng."
    },
    {
        id: "vk_tuyet_anh_bang_kiem",
        name: "🗡️ Tuyết Ảnh Băng Phách Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "linh",
        element: "bang",
        stats: { atk: 55, critRate: 0.04, slowEnemyPercent: 0.15 },
        effect: "+55 Công Kích, +4% Bạo Kích. Hàn Khí Tê Liệt: Mỗi đòn chém làm chậm 15% tốc độ xuất chiêu của đối thủ.",
        desc: "Đường kiếm lướt lạnh giá như bông tuyết rơi, đóng băng kinh mạch đối phương từng nhịp thở."
    },
    {
        id: "thp_dap_tuyet_vo_ngan",
        name: "🌨️ Đạp Tuyết Vô Ngân Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "pham",
        element: "bang",
        stats: { dodgeRate: 0.06, atkSpeedPercent: 0.05 },
        effect: "+6% Né Tránh, +5% Tốc độ đánh.",
        desc: "Bộ pháp nhập môn của Băng Tinh Môn, lướt trên mặt tuyết không để lại dấu chân tì vết."
    },
    {
        id: "bt_han_tri_thien_hoa",
        name: "🌸 Hàn Trì Thiên Hoa Quyết",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "bang",
        stats: { farmYieldBonus: 0.35, farmGrowSpeedBonus: 0.20 },
        effect: "+35% Sản lượng thu hoạch thảo dược và +20% Tốc độ sinh trưởng Linh Dược trong Động Phủ.",
        desc: "Bí pháp dẫn mạch hàn tuyền tưới tiêu linh điền, thúc đẩy dược thảo sinh trưởng vượt bậc."
    },
    {
        id: "vk_bang_phong_bao_kich",
        name: "🌪️ Băng Phong Tật Lôi Trảm",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "bang",
        stats: { atk: 260, critRate: 0.12, freezeDurationSec: 1 },
        effect: "+260 Công Kích, +12% Bạo Kích. Có xác suất đóng băng mục tiêu trong 1 giây không thể cử động.",
        desc: "Kết hợp bão tuyết và phong lôi, một nhát trảm đóng băng cả không gian và hơi thở quân thù."
    },

    // =========================================================================
    // 9. HỖN ĐỘN THẦN MỘ & SINH TỬ LUÂN HỒI (SET 4: CHAOS TOMB & REINCARNATION)
    // =========================================================================
    {
        id: "tp_hon_don_khai_thien",
        name: "🌌 Hỗn Độn Khai Thiên Bí Lục",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        element: "vo_cuc",
        stats: { expPerSec: 2500, maxMp: 800, extraMartialSlots: 1 },
        effect: "+2,500 Tu vi/giây, +800 MP. Vạn Đạo Quy Nhất: Mở khóa thêm 1 ô ngự dụng Vũ Kỹ cho nhân vật.",
        desc: "Môn pháp ghi lại khoảnh khắc khai thiên lập địa, quy tụ vạn nguồn linh lực hỗn mang vào bản nguyên."
    },
    {
        id: "tt_bat_diet_ma_than",
        name: "👹 Bất Diệt Ma Thần Khôi",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        element: "am_ma",
        stats: { hp: 5000, def: 350, damageReduction: 0.20, undyingPassive: true },
        effect: "+5,000 HP, +350 Thủ, -20% Sát thương nhận vào. Bất Tử Niệm: Khi HP về 0 tự hồi 30% HP tối đa (1 lần/trận).",
        desc: "Luyện hóa cốt cách Ma Thần thượng cổ, sinh mệnh vô tận vượt thoát khỏi quy luật lục đạo luân hồi."
    },
    {
        id: "vk_luan_hoi_luc_dao",
        name: "🌀 Lục Đạo Luân Hồi Trảm",
        type: "VuKy",
        category: "cong_kich",
        tier: "thien",
        element: "vo_cuc",
        stats: { atk: 650, critRate: 0.15, critDmgBonus: 0.50 },
        effect: "+650 Công Kích, +15% Bạo Kích, +50% Sát Thương Bạo Kích. Nhát chém mang uy lực luân hồi hủy diệt.",
        desc: "Sáu vòng xoáy luân hồi hiện ra sau lưng phi kiếm, trảm nát mọi sinh cơ và thần hồn kẻ nghịch đạo."
    },
    {
        id: "thp_hu_khong_doat_anh",
        name: "🌠 Hư Không Thuấn Di Ảnh",
        type: "ThanPhap",
        category: "than_phap",
        tier: "thien",
        element: "vo_cuc",
        stats: { dodgeRate: 0.25, atkSpeedPercent: 0.30 },
        effect: "+25% Né Tránh, +30% Tốc độ xuất chiêu. Lướt qua kẽ nứt không gian biến ảo bất định.",
        desc: "Xé toạc hư không để di chuyển, thân pháp phiêu dật vượt ra ngoài tầm mắt của đại năng Hóa Thần."
    },
    {
        id: "bt_doat_thien_hoa_khi",
        name: "⏳ Đoạt Thiên Hóa Khí Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "vo_cuc",
        stats: { expPerSec: 200, lifespanBonus: 50 },
        effect: "+200 Tu vi/giây. Đoạt Tạo Hóa: Gia tăng vĩnh viễn +50 năm Thọ Nguyên cho Bản Tôn.",
        desc: "Nghịch thiên đoạt mệnh, cướp đoạt tinh hoa nhật nguyệt bồi bổ tuổi thọ và đan điền."
    },
    {
        id: "vk_am_duong_nghich_loan",
        name: "☯️ Âm Dương Nghịch Loạn Chỉ",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "vo_cuc",
        stats: { atk: 220, critRate: 0.08, mpStealPercent: 0.25 },
        effect: "+220 Công Kích, +8% Bạo Kích. Chuyển hóa 25% sát thương gây ra thành Linh Lực (MP) hồi phục.",
        desc: "Đầu ngón tay ngưng tụ hai luồng khí Âm Dương đảo lộn ngũ hành, điểm trúng huyệt đạo hút cạn pháp lực đối thủ."
    },

    // =========================================================================
    // 10. MỘC LINH CỔ ĐẠO & ĐỘC CHƯỚNG SƠN MÔN (SET 5: WOOD SPIRIT & POISON)
    // =========================================================================
    {
        id: "tp_van_co_truong_sinh",
        name: "🌲 Vạn Cổ Trường Sinh Kinh",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "moc",
        stats: { expPerSec: 520, hp: 1200, hpRegenPercent: 0.02 },
        effect: "+520 Tu vi/giây, +1,200 HP. Sinh Mệnh Chi Tuyền: Mỗi giây tự động hồi phục 2% Khí Huyết tối đa trong chiến đấu.",
        desc: "Tâm pháp cổ xưa của Thanh Mộc Tông, hóa thân thành rễ cổ thụ hấp thụ sinh cơ vạn dặm không dứt."
    },
    {
        id: "tt_thanh_moc_hoa_linh",
        name: "🌿 Thanh Mộc Bách Thảo Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "linh",
        element: "moc",
        stats: { hp: 400, def: 30, pillBuffDurationBonus: 0.50 },
        effect: "+400 HP, +30 Thủ. Tăng 50% thời gian hiệu lực của các loại Đan Dược gia trì chiến đấu.",
        desc: "Thảo mộc thanh khiết gột rửa huyết dịch, giúp cơ thể hấp thu trọn vẹn từng giọt đan dược tinh hoa."
    },
    {
        id: "vk_van_doc_xuyen_tam",
        name: "🐍 Vạn Độc Xuyên Tâm Châm",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "moc",
        stats: { atk: 110, poisonPercentPerSec: 0.03 },
        effect: "+110 Công Kích. Bắn ra độc châm ăn mòn, rút 3% HP của kẻ địch mỗi giây kéo dài 5s.",
        desc: "Độc châm chiết xuất từ độc hoa ngàn năm, ghim sâu vào da thịt thấu tận tâm can."
    },
    {
        id: "thp_lac_diep_phi_hoa",
        name: "🍃 Lạc Diệp Phi Hoa Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "moc",
        stats: { dodgeRate: 0.09, atkSpeedPercent: 0.10 },
        effect: "+9% Né Tránh, +10% Tốc độ đánh. Khi né tránh để lại luồng lá rơi mê hoặc thị giác quân thù.",
        desc: "Thân hình nhẹ tựa chiếc lá xanh rơi lả lướt trong gió thu, địch nhân chỉ chém trúng tàn diệp."
    },
    {
        id: "bt_than_nong_duoc_dien",
        name: "🏺 Thần Nông Dược Điển Chân Truyền",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        element: "moc",
        stats: { alchemySuccessBonus: 0.25, farmYieldBonus: 0.40 },
        effect: "+25% Tỷ lệ luyện đan thành công, +40% Sản lượng thảo dược thu hoạch trong Linh Điền.",
        desc: "Ghi chép bí kíp đan đạo của Thần Nông thị, nắm giữ tường tận tính dược vạn loài cỏ cây trong cõi phàm trần."
    },
    {
        id: "tt_cuc_moc_ho_the",
        name: "🪵 Thiết Mộc Bì Thuật",
        type: "TheThuat",
        category: "the_thuat",
        tier: "pham",
        element: "moc",
        stats: { hp: 80, def: 12 },
        effect: "+80 HP, +12 Thủ.",
        desc: "Luyện cho lớp da cứng như gỗ thông già, ngăn cách đòn roi thương đao thông thường."
    },

    // =========================================================================
    // 11. KIM CƯƠNG BẢO ĐIỂN & THẦN BINH DIỆT MA (SET 6: DIAMOND & WEAPONRY)
    // =========================================================================
    {
        id: "tp_dai_la_kim_tien",
        name: "⚔️ Đại La Kim Tiên Khí Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "kim",
        stats: { expPerSec: 550, atk: 100, critRate: 0.05 },
        effect: "+550 Tu vi/giây, +100 Công Kích, +5% Bạo Kích. Kim khí sắc bén nâng cao uy áp công phạt.",
        desc: "Tâm pháp rèn luyện sát phạt chí tôn, dẫn kim linh khí cuồn cuộn đổ vào đan điền như vạn mũi gươm giáo."
    },
    {
        id: "tt_kim_cuong_bat_hoai",
        name: "🛡️ Kim Cương Bất Hoại Thần Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        element: "kim",
        stats: { hp: 3500, def: 250, damageReduction: 0.25 },
        effect: "+3,500 HP, +250 Thủ, -25% Mọi loại sát thương nhận vào.",
        desc: "Bảo thể chí cao của Phật môn và Thể tu, đao kiếm chém gãy, thiên lôi đánh không xây xước."
    },
    {
        id: "vk_tuyet_sat_vo_anh",
        name: "🗡️ Tuyệt Sát Vô Ảnh Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "kim",
        stats: { atk: 280, critRate: 0.10, critDmgBonus: 0.35 },
        effect: "+280 Công Kích, +10% Bạo Kích, +35% Sát thương bạo kích. Kiếm quang vô ảnh vô hình đoạt mạng trong chớp mắt.",
        desc: "Kiếm khí sắc lẹm đến mức xé gió không phát ra tiếng động, lúc đối thủ phát giác thì đầu đã lìa khỏi cổ."
    },
    {
        id: "thp_kim_quang_thao_thien",
        name: "✨ Kim Quang Thiểm Điện Thân",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        element: "kim",
        stats: { atkSpeedPercent: 0.25, dodgeRate: 0.08 },
        effect: "+25% Tốc độ tấn công, +8% Né Tránh. Thân thể hóa thành tia kim quang phóng vút qua chiến trường.",
        desc: "Thuật hóa quang phi hành danh chấn Tu Chân giới, nháy mắt vượt trăm dặm không lưu bóng hình."
    },
    {
        id: "bt_khau_tai_hoang_kim",
        name: "💰 Kim Đỉnh Tụ Bảo Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "linh",
        element: "kim",
        stats: { expPerSec: 40, spiritStoneGatherRate: 0.20 },
        effect: "+40 Tu vi/giây, +20% Lượng Hạ Phẩm Linh Thạch nhận được từ mọi nguồn.",
        desc: "Bí pháp cảm ứng quặng mỏ và linh khí tài phú, bước chân tới đâu linh thạch tự động tụ về tới đó."
    },

    // =========================================================================
    // 12. THỔ NGUYÊN HỘ SƠN & ĐỊA MẠCH LINH QUYẾT (SET 7: EARTH CORE & DOMAIN)
    // =========================================================================
    {
        id: "tp_hau_tho_hoang_de",
        name: "⛰️ Hậu Thổ Hoàng Đế Ngũ Khí Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "tho",
        stats: { expPerSec: 500, maxMp: 200, hpPercent: 0.15 },
        effect: "+500 Tu vi/giây, +200 MP, +15% HP tối đa. Hòa nhập ngũ hành đại địa ngưng tụ căn cơ tráng kiện.",
        desc: "Thổ hệ huyền công lấy đại địa làm mẫu, tích lũy độ sâu lắng tựa lòng đất mẹ sinh sôi vạn vật."
    },
    {
        id: "tt_khoan_thach_son_than",
        name: "🪨 Thái Sơn Trầm Mặc Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "tho",
        stats: { hp: 800, def: 80, damageReduction: 0.05 },
        effect: "+800 HP, +80 Thủ, -5% Sát thương nhận vào.",
        desc: "Bất động như núi đá nghìn cân, sừng sững trước phong ba bão táp của kẻ địch."
    },
    {
        id: "vk_dia_long_pha_dia",
        name: "🐲 Địa Long Phá Thạch Kích",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "tho",
        stats: { atk: 130, critRate: 0.06, damage: 240 },
        effect: "+130 Công Kích, +6% Bạo Kích. Đập xuống mặt đất đánh thức địa long gây sát thương diện rộng.",
        desc: "Vận địa khí vào mũi thương, chọc thủng lòng đất phóng thích uy áp của rồng đất cổ đại."
    },
    {
        id: "thp_dia_hanh_tien_thuat",
        name: "🕳️ Thổ Độn Địa Hành Thuật",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "tho",
        stats: { dodgeRate: 0.10, atkSpeedPercent: 0.06 },
        effect: "+10% Né Tránh, +6% Tốc độ đánh. Độn thổ trong tích tắc tránh né chiêu thức trí mạng.",
        desc: "Mượn lực đất mẹ ẩn nấp, khi đối thủ ra tay thì người đã độn sâu vào lòng đất vạn trượng."
    },
    {
        id: "bt_long_mach_quy_nguyen",
        name: "🗺️ Địa Mạch Tụ Linh Pháp",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "tho",
        stats: { expPerSec: 80, spiritFarmRateBonus: 0.25 },
        effect: "+80 Tu vi/giây, +25% Hiệu suất ngưng tụ linh khí trong Tụ Linh Trận Động Phủ.",
        desc: "Dẫn dòng linh mạch ngầm trong lòng đất hội tụ về động phủ của bản tôn, giúp tu vi cuồn cuộn không ngừng."
    },

    // =========================================================================
    // 13. VỰC THẲM HUYẾT TẾ & MA HỎA PHẦN THIÊN (SET 8: ABYSSAL BLOOD & FIRE)
    // =========================================================================
    {
        id: "tp_ma_hoa_thien_quy",
        name: "👿 Cửu U Ma Hỏa Diệt Thế Thư",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "hoa",
        stats: { expPerSec: 680, fireDamagePercent: 0.15, critRate: 0.06 },
        effect: "+680 Tu vi/giây, +15% Sát thương Hỏa hệ, +6% Bạo Kích. Mỗi đòn bạo kích thiêu đốt đối thủ trong 4s.",
        desc: "Ma hỏa sinh ra từ đáy vực Cửu U, đốt cháy linh lực và thần thức đối phương không thể dập tắt."
    },
    {
        id: "tt_huyet_te_cuong_ma",
        name: "🩸 Huyết Ma Bất Tử Thân",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "am_ma",
        stats: { hp: 1800, def: 120, lowHpDmgReduction: 0.25 },
        effect: "+1,800 HP, +120 Thủ. Càng cạn kiệt Khí Huyết càng tăng thủ (giảm tối đa 25% sát thương khi dưới 30% HP).",
        desc: "Huyết nhục hòa quyện ma sát, khi máu chảy cạn kiệt thì chiến ý ma đạo đạt đến cảnh giới cuồng nộ."
    },
    {
        id: "vk_diet_the_ma_kiem",
        name: "🗡️ Huyết Diễm Phần Thiên Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "hoa",
        stats: { atk: 310, critRate: 0.11, burnAuraDmg: 50 },
        effect: "+310 Công Kích, +11% Bạo Kích. Kiếm khí mang theo ma diễm cực nhiệt, đốt cháy 50 HP đối thủ mỗi giây.",
        desc: "Một kiếm vung ra, biển máu cùng lửa đen cuộn trào thiêu đốt trời đất thành tro bụi."
    },
    {
        id: "thp_huyet_anh_don_thuat",
        name: "🦇 Huyết Ảnh Độn Hóa Thuật",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        element: "am_ma",
        stats: { dodgeRate: 0.12, atkSpeedPercent: 0.15 },
        effect: "+12% Né Tránh, +15% Tốc độ xuất chiêu. Khi bị đánh trúng biến thành đàn dơi máu né tránh một phần sát thương.",
        desc: "Thuật tẩu thoát thần bí của Huyết Hồn Cốc, tự bạo một giọt tinh huyết để thoát hiểm trong gang tấc."
    },
    {
        id: "bt_ma_tam_chung_dao",
        name: "🖤 Ma Tâm Chủng Đạo Quyết",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "am_ma",
        stats: { expPerSec: 180, critDmgBonus: 0.30, tamMaExpBonus: 0.20 },
        effect: "+180 Tu vi/giây, +30% Sát thương bạo kích. Tâm Ma càng cao, tu vi hấp thu từ chiến đấu càng nhiều (+20%).",
        desc: "Nuôi dưỡng tâm ma trong đạo quả, lấy tà luyện chính, nghịch chuyển âm dương để đoạt thiên địa tạo hóa."
    },
    {
        id: "vk_hoa_long_phong_tieu",
        name: "🐉 Xích Diễm Hỏa Long Tiêu",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "hoa",
        stats: { atk: 140, critRate: 0.06 },
        effect: "+140 Công Kích, +6% Bạo Kích. Triệu hồi rồng lửa gầm thét tấn công xuyên thấu hàng thủ đối phương.",
        desc: "Hỏa long chiêu thức hung mãnh, một đòn phát ra rung chuyển sơn hà."
    },

    // =========================================================================
    // 14. PHONG THẦN VỰC GIỚI & VÔ ẢNH HUYỀN KHÍ (SET 9: GALE & PHANTOM VOID)
    // =========================================================================
    {
        id: "tp_phong_than_van_bien",
        name: "🌪️ Phong Thần Vạn Biến Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "phong",
        stats: { expPerSec: 510, dodgeRate: 0.05, atkSpeedPercent: 0.15 },
        effect: "+510 Tu vi/giây, +5% Né Tránh, +15% Tốc độ đánh. Phong hành chu thiên, linh lực lưu chuyển nhanh gấp bội.",
        desc: "Hấp thụ linh khí của gió bão khắp cửu châu, thân thể nhẹ tựa hư không phiêu dạt ngàn dặm."
    },
    {
        id: "tt_cuong_phong_ho_phong",
        name: "🌬️ Cuồng Phong Hộ Mạch Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "phong",
        stats: { hp: 550, def: 65, dodgeRate: 0.04 },
        effect: "+550 HP, +65 Thủ, +4% Né Tránh. Lớp gió xoáy bao bọc kinh mạch cản trở ám khí và chiêu thức đối thủ.",
        desc: "Kinh mạch lưu chuyển cuồng phong cuộn tròn, hóa giải bớt lực va chạm của mọi binh khí."
    },
    {
        id: "vk_tuyet_phong_tam_kich",
        name: "🗡️ Tuyệt Phong Tam Tuyệt Kích",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "phong",
        stats: { atk: 150, atkSpeedPercent: 0.20, critRate: 0.06 },
        effect: "+150 Công Kích, +20% Tốc độ xuất chiêu, +6% Bạo Kích. Chém ra liên hoàn 3 nhát kiếm gió trong tích tắc.",
        desc: "Kiếm chiêu nhanh tựa chớp giật, 3 đạo phong nhận cùng lúc xuyên phá đan điền quân địch."
    },
    {
        id: "thp_thanh_phong_tieu_dao",
        name: "🍃 Thanh Phong Tiêu Dao Du",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "phong",
        stats: { dodgeRate: 0.11, atkSpeedPercent: 0.08 },
        effect: "+11% Né Tránh, +8% Tốc độ đánh. Đạp gió phiêu du tự tại không câu nệ trần thế.",
        desc: "Bộ pháp Tiêu Dao phái, tự do tự tại như làn gió mát lướt qua ngọn trúc xanh biếc."
    },
    {
        id: "bt_ngu_phong_thao_thien",
        name: "🦅 Ngự Phong Bát Hoang Thư",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "phong",
        stats: { expPerSec: 100, expeditionTimeReduction: 0.20 },
        effect: "+100 Tu vi/giây. Giảm 20% thời gian đi Lịch Luyện Phân Thân khắp các vùng đất bí cảnh.",
        desc: "Thuật ngự phong truyền thừa, giúp linh thú và phân thân bay lượn vạn dặm không mỏi mệt."
    },

    // =========================================================================
    // 15. QUANG MINH THÁNH ĐIỂN & TRỪ MA TỊNH HÓA (SET 10: PURIFYING RADIANCE)
    // =========================================================================
    {
        id: "tp_thai_duong_chan_kinh",
        name: "☀️ Thái Dương Chân Kinh Thượng Thừa",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "quang",
        stats: { expPerSec: 620, maxMp: 250, holyDmgBonus: 0.15 },
        effect: "+620 Tu vi/giây, +250 MP. Tăng 15% sát thương lên toàn bộ Yêu Ma và Oán Linh trong Trấn Ma Tháp.",
        desc: "Kinh văn thánh khiết chiếu rọi đan điền, xua tan mọi tà uế và hắc ám nội ma quấy nhiễu."
    },
    {
        id: "tt_kim_quang_thanh_the",
        name: "🛡️ Kim Quang Thánh Giáp Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "quang",
        stats: { hp: 2000, def: 160, startCombatShieldPercent: 0.20 },
        effect: "+2,000 HP, +160 Thủ. Khởi đầu chiến đấu nhận ngay lớp Khiên Quang Minh bằng 20% Max HP.",
        desc: "Ánh sáng thánh quang cô đọng thành áo giáp kim sắc vững chắc, che chắn mọi đòn đánh lén."
    },
    {
        id: "vk_thanh_quang_tru_ma",
        name: "🗡️ Thánh Quang Trừ Ma Kiếm",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "quang",
        stats: { atk: 270, critRate: 0.09, ignoreDemonicDefPercent: 0.30 },
        effect: "+270 Công Kích, +9% Bạo Kích. Bỏ qua 30% giáp của các loài quái vật mang thuộc tính Tà/Ma.",
        desc: "Thanh kiếm rực rỡ hào quang chánh đạo, mũi kiếm chạm tới đâu ma khí tan chảy tới đó."
    },
    {
        id: "thp_quang_am_thu_ngan",
        name: "✨ Quang Âm Thuấn Ảnh Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        element: "quang",
        stats: { dodgeRate: 0.13, atkSpeedPercent: 0.16 },
        effect: "+13% Né Tránh, +16% Tốc độ đánh. Lướt đi nhanh như một tia chớp sáng chói mắt đối thủ.",
        desc: "Mượn ánh sáng để khúc xạ thân thể, khiến kẻ địch hoa mắt không thể định vị phương vị."
    },
    {
        id: "bt_tinh_hoa_thien_dia",
        name: "🌟 Tịnh Hóa Bát Quái Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        element: "quang",
        stats: { expPerSec: 300, clearTamMaOnTribulation: true },
        effect: "+300 Tu vi/giây. Mỗi lần vượt ải Lôi Kiếp thành công, tự động thanh trừ 100% Tâm Ma tồn đọng.",
        desc: "Đạo pháp thánh khiết tuyệt luân, gột rửa uế tạp thần hồn, bảo hộ đạo tâm bất diệt muôn thuở."
    },

    // =========================================================================
    // 16. THỦY NGUYÊN NHU TÌNH & HẢI DƯƠNG NGHỊCH LƯU (SET 11: OCEAN FLOW)
    // =========================================================================
    {
        id: "tp_cuu_khuc_ha_thien",
        name: "🌊 Cửu Khúc Hà Thiên Kinh",
        type: "TamPhap",
        category: "tam_phap",
        tier: "dia",
        element: "thuy",
        stats: { expPerSec: 540, maxMp: 300, mpRegenPercent: 0.05 },
        effect: "+540 Tu vi/giây, +300 MP. Mỗi giây tự động hồi 5% Linh Lực tối đa, duy trì thi triển kỹ năng liên tục.",
        desc: "Dòng linh lực cuồn cuộn như chín nhánh sông lớn đổ ra biển đông, dồi dào bất tận không bao giờ cạn kiệt."
    },
    {
        id: "tt_thuy_tinh_ngoc_the",
        name: "💧 Thủy Tinh Hóa Nhu Thân",
        type: "TheThuat",
        category: "the_thuat",
        tier: "huyen",
        element: "thuy",
        stats: { hp: 700, def: 70, physicalDmgReduction: 0.10 },
        effect: "+700 HP, +70 Thủ. Nhu đạo hóa cương: Giảm 10% sát thương vật lý từ vũ khí cận chiến.",
        desc: "Nước mềm mại có thể xuyên đá, uốn lượn hóa giải sức mạnh của mọi mũi thương đao gươm giáo."
    },
    {
        id: "vk_hai_trieu_diet_linh",
        name: "🔱 Hải Triều Diệt Linh Kích",
        type: "VuKy",
        category: "cong_kich",
        tier: "dia",
        element: "thuy",
        stats: { atk: 250, critRate: 0.08, stunDurationSec: 1 },
        effect: "+250 Công Kích, +8% Bạo Kích. Đòn đánh triệu hồi sóng thần vùi dập làm choáng kẻ thù trong 1s.",
        desc: "Hải triều ngàn trượng cuộn trào, dập tắt mọi nhuệ khí công phá của quân địch."
    },
    {
        id: "thp_thuy_thuong_phieu",
        name: "🛶 Thủy Thượng Phiêu Linh Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "pham",
        element: "thuy",
        stats: { dodgeRate: 0.05, atkSpeedPercent: 0.05 },
        effect: "+5% Né Tránh, +5% Tốc độ xuất chiêu.",
        desc: "Bộ pháp lướt trên mặt nước không gợn sóng, uyển chuyển nhẹ nhàng như cánh bèo trôi."
    },
    {
        id: "bt_linh_tuyen_ho_dong",
        name: "⛲ Linh Tuyền Khai Mạch Pháp",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "thuy",
        stats: { expPerSec: 90, spiritFarmRateBonus: 0.22 },
        effect: "+90 Tu vi/giây, +22% Tốc độ hồi phục Linh Trì trong Động Phủ.",
        desc: "Khai thông mạch nước ngầm ngập tràn linh khí dưới động phủ, biến linh trì thành bảo địa tụ khí."
    },

    // =========================================================================
    // 17. LÔI THIÊN TẬT ĐIỆN & HỒNG HOANG LÔI CỔ (SET 12: ANCIENT BOLT)
    // =========================================================================
    {
        id: "tp_hong_hoang_loi_dien",
        name: "⚡ Hồng Hoang Lôi Điển Tối Thượng",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        element: "loi",
        stats: { expPerSec: 1800, atkPercent: 0.20, critRate: 0.10 },
        effect: "+1,800 Tu vi/giây, +20% Tổng Công Kích, +10% Bạo Kích. Cực hạn sát phạt công phá thiên kiếp.",
        desc: "Đạo thư thượng cổ chứa đựng tia chớp đầu tiên của vũ trụ, uy lực phá hủy vạn giới chỉ trong một niệm."
    },
    {
        id: "tt_thien_loi_pha_cot",
        name: "🌩️ Thiên Lôi Đoán Cốt Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        element: "loi",
        stats: { hp: 2100, def: 170, thornLightningDmg: 80 },
        effect: "+2,100 HP, +170 Thủ. Lôi Quang Phản Phệ: Khi bị tấn công, phóng sét giật ngược 80 sát thương chuẩn.",
        desc: "Cốt tủy như nam châm hút lôi điện, kẻ địch đánh vào sẽ bị điện giật tê liệt toàn thân."
    },
    {
        id: "vk_cuu_tieu_than_loi_kiem",
        name: "⚡ Cửu Tiêu Diệt Thần Kiếm Trảm",
        type: "VuKy",
        category: "cong_kich",
        tier: "thien",
        element: "loi",
        stats: { atk: 580, critRate: 0.16, critDmgBonus: 0.60 },
        effect: "+580 Công Kích, +16% Bạo Kích, +60% Sát thương bạo kích. Nhát chém giáng 9 đạo thiên lôi xé toạc linh đan địch.",
        desc: "Kiếm chiêu chí tôn của Kiếm Tu, một nhát vung kiếm rung chuyển cả chín tầng trời cao."
    },
    {
        id: "thp_thao_thien_loi_bo",
        name: "🌩️ Thao Thiên Lôi Ảnh Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "dia",
        element: "loi",
        stats: { dodgeRate: 0.15, atkSpeedPercent: 0.22 },
        effect: "+15% Né Tránh, +22% Tốc độ xuất chiêu. Lướt qua như tia chớp gầm vang dội khắp chiến trường.",
        desc: "Thân hình dịch chuyển với vận tốc của sấm sét, không một đao kiếm phàm trần nào có thể bắt kịp."
    },
    {
        id: "bt_loi_tri_luyen_the",
        name: "🔋 Lôi Trì Tụ Khí Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "dia",
        element: "loi",
        stats: { expPerSec: 160, tribulationPassBonusPercent: 0.20 },
        effect: "+160 Tu vi/giây. Tăng +20% Tỷ lệ thành công khi Đột Phá Lôi Kiếp ở mọi cảnh giới.",
        desc: "Luyện hóa năng lượng lôi kiếp thành chất lỏng thuần khiết, biến hiểm cảnh độ kiếp thành cơ duyên bứt phá."
    },

    // =========================================================================
    // 18. HUYỀN THIÊN KIM DIỆP & BÁCH BIẾN VÔ THƯỜNG (SET 13: HEAVENLY METALLIC)
    // =========================================================================
    {
        id: "tp_huyen_thien_bao_dien",
        name: "📜 Huyền Thiên Kim Diệp Bảo Điển",
        type: "TamPhap",
        category: "tam_phap",
        tier: "huyen",
        element: "kim",
        stats: { expPerSec: 320, atk: 60, def: 40 },
        effect: "+320 Tu vi/giây, +60 Công Kích, +40 Phòng Ngự. Cân bằng công thủ toàn diện.",
        desc: "Trúc thư bằng vàng ròng ghi chép phép vận hành kim khí chu thiên, công thủ vẹn toàn."
    },
    {
        id: "tt_thiet_giap_dong_than",
        name: "🦾 Thiết Giáp Đồng Bì Công",
        type: "TheThuat",
        category: "the_thuat",
        tier: "linh",
        element: "kim",
        stats: { hp: 450, def: 50 },
        effect: "+450 HP, +50 Thủ. Tăng độ dẻo dai của da thịt chống chọi chém đâm.",
        desc: "Nấu nước lá kim chúc ngâm mình ngàn ngày, da biến thành đồng, thịt biến thành thép."
    },
    {
        id: "vk_ba_vuong_pha_giap",
        name: "🪓 Bá Vương Phá Giáp Đao",
        type: "VuKy",
        category: "cong_kich",
        tier: "huyen",
        element: "kim",
        stats: { atk: 160, armorIgnorePercent: 0.25 },
        effect: "+160 Công Kích. Bỏ qua 25% Phòng Ngự của đối phương trong mỗi đòn chém.",
        desc: "Đao pháp bá đạo càn quét vạn quân, chém gãy khiên giáp yêu ma dễ như cắt bùn."
    },
    {
        id: "thp_vo_anh_kim_quang",
        name: "⚡ Vô Ảnh Kim Tung Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "linh",
        element: "kim",
        stats: { dodgeRate: 0.08, atkSpeedPercent: 0.12 },
        effect: "+8% Né Tránh, +12% Tốc độ đánh.",
        desc: "Di chuyển sắc bén như lưỡi gươm lướt gió, né tránh gọn gàng không chút thừa thãi."
    },
    {
        id: "bt_thien_kim_khai_khoang",
        name: "⛏️ Thiên Kim Khai Khoáng Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "huyen",
        element: "kim",
        stats: { expPerSec: 60, stoneOreDropBonus: 0.30 },
        effect: "+60 Tu vi/giây, +30% Tỷ lệ rơi Huyền Thiết Khoáng khi lịch luyện Bí Cảnh.",
        desc: "Cảm nhận quặng quý nằm sâu trong lòng núi, thu thập huyền thiết dễ như trở bàn tay."
    }
];

// ============================================================================
// CHẾ ĐỘ "ĐẠI DIỄN CÔNG PHÁP & THẦN HÌNH" (ENDLESS CULTIVATION TECHNIQUES)
// ============================================================================

function getSkillImageUrl(skill) {
    if (!skill) return 'https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png';
    const type = skill.type || skill.category || '';
    const name = skill.name || '';
    const cleanName = encodeURIComponent(name.replace(/\s+/g, ''));

    // 1. Kiếm Quyết / Vũ Kỹ / Binh Khí
    if (type === 'VuKy' || type === 'VuKhi' || type === 'cong_kich' || name.includes('Kiếm') || name.includes('Đao') || name.includes('Thương') || name.includes('Kích')) {
        return 'https://img.icons8.com/color/100/sword.png';
    }
    // 2. Thể Thuật / Trận Pháp / Luyện Thể
    if (type === 'TheThuat' || type === 'the_thuat' || name.includes('Thân') || name.includes('Trận') || name.includes('Giáp') || name.includes('Thể') || name.includes('Bì') || name.includes('Cốt')) {
        return `https://api.dicebear.com/9.x/rings/svg?seed=${cleanName}&backgroundColor=1a1a2e,450a0a`;
    }
    // 3. Ấn Quyết / Chưởng Pháp / Quyền / Chỉ
    if (name.includes('Chưởng') || name.includes('Ấn') || name.includes('Quyền') || name.includes('Chỉ') || name.includes('Thủ')) {
        return 'https://img.icons8.com/color/100/glowing-hands.png';
    }
    // 4. Bí Thuật / Tâm Pháp / Cuộn Giấy / Thân Pháp
    if (type === 'BiThuat' || type === 'bi_thuat') {
        return 'https://img.icons8.com/color/100/scroll.png';
    }
    return 'https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png';
}

// BỘ 1: U MINH HUYẾT THẦN HỆ (7 CÔNG PHÁP)
const NEW_SKILLS_SET_01 = [
    {
        id: "skill_huyet_hai_kiem_quyet",
        name: "Huyết Hải Kiếm Quyết",
        type: "VuKy",
        category: "vu_ky",
        tier: "dia",
        rarity: "Dia",
        element: "hoa",
        icon: "🩸",
        image_url: "./assets/images/skill_huyet_hai_kiem_quyet.png",
        stats: { attack: 2500, lifesteal: 12, crit_rate: 6 },
        effect: "Hút máu 12%, tăng 6% Bạo kích. Hiến tế 5% HP chém ra huyết kiếm trảm hồn.",
        desc: "Hiến tế khí huyết bản thân để chém ra một vệt kiếm đỏ thẫm, hấp thu sinh lực đối phương.",
        price: 150000
    },
    {
        id: "skill_cuu_u_chan_than",
        name: "Cửu U Bất Diệt Ma Thân",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        rarity: "Thien",
        element: "tho",
        icon: "🛡️",
        image_url: "https://api.dicebear.com/9.x/rings/svg?seed=CuuUBatDietMaThan&backgroundColor=1a1a2e,450a0a",
        stats: { hp: 45000, defense: 3200, damage_reflect: 25, shield_percent: 20 },
        effect: "Tạo khiên 20% HP tối đa khi vào trận, phản lại 25% sát thương nhận vào.",
        desc: "Luyện thể ma đạo thượng cổ, hấp thu u minh chi khí đúc thành ma khu bất diệt.",
        price: 380000
    },
    {
        id: "skill_hac_am_thien_ma_chuong",
        name: "Hắc Ám Thiên Ma Chưởng",
        type: "VuKy",
        category: "vu_ky",
        tier: "dia",
        rarity: "Dia",
        element: "hoa",
        icon: "✋",
        image_url: "https://img.icons8.com/color/100/glowing-hands.png",
        stats: { attack: 3100, armor_ignore: 25, weaken_enemy: 15 },
        effect: "Bỏ qua 25% Giáp kẻ địch, giảm 15% Công kích đối phương trong 8 giây.",
        desc: "Một chưởng vỗ ra ma khí ngập trời, ma âm nhiễu loạn thần phách đối thủ.",
        price: 180000
    },
    {
        id: "skill_u_minh_quy_anh_bo",
        name: "U Minh Quỷ Ảnh Bộ",
        type: "ThanPhap",
        category: "than_phap",
        tier: "huyen",
        rarity: "Huyen",
        element: "phong",
        icon: "💨",
        image_url: "https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png",
        stats: { speed: 180, dodge: 18, stealth_crit: 30 },
        effect: "+18% Né tránh. Đòn đánh đầu tiên sau khi né tăng 30% sát thương bạo kích.",
        desc: "Thân hình hư ảo thoắt ẩn thoắt hiện như quỷ mị giữa đêm đen.",
        price: 65000
    },
    {
        id: "skill_huyet_te_dai_phap",
        name: "Huyết Tế Càn Khôn Bí Thuật",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "thien",
        rarity: "Thien",
        element: "hoa",
        icon: "📜",
        image_url: "https://img.icons8.com/color/100/scroll.png",
        stats: { expPerSec: 350, all_damage_bonus: 30, blood_conversion: 10 },
        effect: "+350 Tu vi/giây, tăng vĩnh viễn 30% toàn bộ sát thương xuất ra.",
        desc: "Bí pháp thượng thừa của Huyết Thần Tông, chuyển hóa sát nghiệp thành căn cơ tu vi.",
        price: 420000
    },
    {
        id: "skill_nguyen_thuy_ma_kinh",
        name: "Nguyên Thủy Chân Ma Tâm Kinh",
        type: "TamPhap",
        category: "tam_phap",
        tier: "tien",
        rarity: "Tien",
        element: "vo_he",
        icon: "🌌",
        image_url: "https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png",
        stats: { expPerSec: 1200, hpPercent: 0.50, lifesteal: 15, true_damage: 5000 },
        effect: "+1200 Tu vi/giây, +50% HP, kèm 5000 sát thương chuẩn mỗi đòn đánh.",
        desc: "Căn bản tâm kinh của Chân Ma Thủy Tổ, áp đảo chư thiên vạn giới.",
        price: 1800000
    },
    {
        id: "skill_tu_la_diet_tuyet_an",
        name: "Tu La Diệt Tuyệt Đại Thủ Ấn",
        type: "VuKy",
        category: "vu_ky",
        tier: "tien",
        rarity: "Tien",
        element: "hoa",
        icon: "🔥",
        image_url: "https://img.icons8.com/color/100/glowing-hands.png",
        stats: { attack: 38000, execute_below_20_percent: 1, crit_damage: 80 },
        effect: "Kết liễu ngay kẻ địch dưới 20% HP (trừ Boss), +80% Sát thương bạo kích.",
        desc: "Ấn pháp sát phạt tuyệt đỉnh Tu La Giới, ấn xuống vạn linh tiêu tán.",
        price: 2500000
    }
];

// BỘ 2: TIÊN ĐẠO THẦN LÔI & THÁI THANH KIẾM TÔNG (7 CÔNG PHÁP)
const NEW_SKILLS_SET_02 = [
    {
        id: "skill_thien_loi_chinh_phap",
        name: "Cửu Thiên Thần Lôi Chánh Pháp",
        type: "TamPhap",
        category: "tam_phap",
        tier: "thien",
        rarity: "Thien",
        element: "loi",
        icon: "⚡",
        image_url: "./assets/images/skill_thien_loi_chinh_phap.png",
        stats: { expPerSec: 420, lightning_damage: 40, paralysis_rate: 15 },
        effect: "+420 Tu vi/giây, +40% sát thương Lôi, 15% tỷ lệ làm tê liệt mục tiêu.",
        desc: "Lôi pháp chính đạo thống lĩnh lôi đình cửu thiên, vạn tà quy phục.",
        price: 350000
    },
    {
        id: "skill_thai_thanh_van_kiem",
        name: "Vạn Kiếm Quy Tông Quyết",
        type: "VuKy",
        category: "vu_ky",
        tier: "thien",
        rarity: "Thien",
        element: "kim",
        icon: "⚔️",
        image_url: "./assets/images/skill_thai_thanh_van_kiem.png",
        stats: { attack: 14500, multihit_count: 5, crit_rate: 25 },
        effect: "Phân tách kiếm ảnh chém liên hoàn 5 đợt, +25% Tỷ lệ bạo kích.",
        desc: "Cảnh giới tối cao của kiếm tu Thái Thanh, ý niệm động vạn kiếm đồng quy.",
        price: 500000
    },
    {
        id: "skill_bat_quai_kim_quang_tran",
        name: "Bát Quái Hộ Đạo Thần Trận",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        rarity: "Dia",
        element: "tho",
        icon: "☯️",
        image_url: "https://api.dicebear.com/9.x/rings/svg?seed=BatQuaiHoDaoThanTran&backgroundColor=1a1a2e,450a0a",
        stats: { defense: 2200, hp: 28000, barrier_absorb: 15000 },
        effect: "Ngưng tụ trận bàn Bát Quái che chở, tạo lớp khiên hấp thu 15,000 sát thương.",
        desc: "Đạo gia phòng ngự pháp trận, mượn càn khôn bát quái tiêu trừ thế công.",
        price: 160000
    },
    {
        id: "skill_thien_phong_doan_khong_bo",
        name: "Thiên Phong Đoạn Không Thân Pháp",
        type: "ThanPhap",
        category: "than_phap",
        tier: "dia",
        rarity: "Dia",
        element: "phong",
        icon: "🌪️",
        image_url: "https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png",
        stats: { speed: 320, dodge: 25, counter_attack_chance: 20 },
        effect: "+320 Thân pháp, 25% Né tránh, khi né thành công phản kích 1 kiếm cực mạnh.",
        desc: "Hóa thân vào hư không vết rách, xé gió đạp mây mà đi.",
        price: 175000
    },
    {
        id: "skill_thai_at_phuc_ma_chuong",
        name: "Thái Ất Phục Ma Chưởng",
        type: "VuKy",
        category: "vu_ky",
        tier: "linh",
        rarity: "Linh",
        element: "kim",
        icon: "✨",
        image_url: "https://img.icons8.com/color/100/glowing-hands.png",
        stats: { attack: 680, demon_bane: 30 },
        effect: "Tăng 30% sát thương khi công kích Yêu Ma trong Trấn Yêu Tháp.",
        desc: "Chưởng pháp thuần dương hàng ma trứ danh của Đạo môn.",
        price: 8500
    },
    {
        id: "skill_tam_thanh_hoa_khi_quyet",
        name: "Tam Thanh Hóa Khí Bí Điển",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "tien",
        rarity: "Tien",
        element: "vo_he",
        icon: "📜",
        image_url: "https://img.icons8.com/color/100/scroll.png",
        stats: { expPerSec: 1500, mp_regen_percent: 50, spell_cooldown_reduction: 20 },
        effect: "+1500 Tu vi/giây, hồi phục linh lực +50%, giảm 20% thời gian hồi thần thông.",
        desc: "Bí điển tuyệt mật nhất đạo môn, một khí hóa tam thanh, sinh hóa vô cùng.",
        price: 3000000
    },
    {
        id: "skill_tru_tien_kiem_tran_phap",
        name: "Tru Tiên Tứ Kiếm Tuyệt Trận",
        type: "VuKy",
        category: "vu_ky",
        tier: "tien",
        rarity: "Tien",
        element: "kim",
        icon: "🗡️",
        image_url: "https://img.icons8.com/external-smashingstocks-flat-smashing-stocks/100/external-Sword-weapons-smashingstocks-flat-smashing-stocks.png",
        stats: { attack: 52000, crit_rate: 35, bleed_true_damage: 8000 },
        effect: "Gây chảy máu chuẩn 8,000 sát thương/giây trong 5 giây, không thể giải trừ.",
        desc: "Sát trận đệ nhất hồng hoang, bốn thanh kiếm Tru Tiên quy nhất diệt sát càn khôn.",
        price: 3800000
    }
];

// BỘ 3: NGŨ HÀNH DIỆU PHÁP & VẠN VẬT TỰ NHIÊN (7 CÔNG PHÁP)
const NEW_SKILLS_SET_03 = [
    {
        id: "skill_ngu_hanh_luan_chuyen_quyet",
        name: "Ngũ Hành Hỗn Nguyên Quyết",
        type: "TamPhap",
        category: "tam_phap",
        tier: "huyen",
        rarity: "Huyen",
        element: "vo_he",
        icon: "🌀",
        image_url: "https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png",
        stats: { expPerSec: 120, five_elements_buff: 15 },
        effect: "+120 Tu vi/giây, tăng 15% hiệu quả kích hoạt của mọi cộng hưởng Ngũ Hành.",
        desc: "Vận chuyển Kim Mộc Thủy Hỏa Thổ hài hòa, đan điền sinh sôi không ngừng nghỉ.",
        price: 45000
    },
    {
        id: "skill_thanh_moc_truong_sinh_the",
        name: "Thanh Mộc Trường Sinh Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "dia",
        rarity: "Dia",
        element: "moc",
        icon: "🌿",
        image_url: "./assets/images/skill_thanh_moc_truong_sinh_the.png",
        stats: { hp: 35000, defense: 1800, hp_regen_per_sec: 500 },
        effect: "Hồi phục 500 HP mỗi giây liên tục ngay trong chiến đấu.",
        desc: "Dẫn sinh khí Thái Cổ Thần Mộc vào tủy xương, tạo cơ thể trường sinh bất tử.",
        price: 190000
    },
    {
        id: "skill_thuy_long_ngam_thuat",
        name: "Băng Hà Thủy Long Ngâm",
        type: "VuKy",
        category: "vu_ky",
        tier: "dia",
        rarity: "Dia",
        element: "thuy",
        icon: "🐉",
        image_url: "https://img.icons8.com/color/100/glowing-hands.png",
        stats: { attack: 4200, freeze_chance: 20, aoe_damage: 1200 },
        effect: "Đóng băng đối thủ trong 3 giây (20% tỷ lệ), lan sát thương diện rộng.",
        desc: "Thao túng vạn trượng hàn tuyền ngưng tụ thành Cự Long oanh tạc.",
        price: 165000
    },
    {
        id: "skill_hac_diem_phan_thien_chuong",
        name: "Bắc Minh Hắc Diễm Chưởng",
        type: "VuKy",
        category: "vu_ky",
        tier: "huyen",
        rarity: "Huyen",
        element: "hoa",
        icon: "🔥",
        image_url: "https://img.icons8.com/color/100/glowing-hands.png",
        stats: { attack: 1850, burn_dot: 250 },
        effect: "Thiêu đốt chân khí đối thủ, trừ 50 Linh lực/giây khi trúng đòn.",
        desc: "Ngọn lửa đen thấu hàn từ Bắc Hải thiêu rụi kinh mạch từ bên trong.",
        price: 58000
    },
    {
        id: "skill_kim_cang_bat_hoai_than",
        name: "Đại Nhật Kim Cang Thể",
        type: "TheThuat",
        category: "the_thuat",
        tier: "thien",
        rarity: "Thien",
        element: "kim",
        icon: "☀️",
        image_url: "https://api.dicebear.com/9.x/rings/svg?seed=DaiNhatKimCangThe&backgroundColor=1a1a2e,450a0a",
        stats: { defense: 4500, hp: 60000, crowd_control_immunity: 1 },
        effect: "Miễn nhiễm mọi hiệu ứng Khống chế và Choáng, giảm 30% sát thương nhận vào.",
        desc: "Thân thể tỏa kim quang như mặt trời chói chang, không gì phá nổi.",
        price: 620000
    },
    {
        id: "skill_khong_gian_di_hinh_bo",
        name: "Hư Không Di Hình Thân Pháp",
        type: "ThanPhap",
        category: "than_phap",
        tier: "thien",
        rarity: "Thien",
        element: "phong",
        icon: "🌀",
        image_url: "https://img.icons8.com/external-flat-wichaiwi/100/external-scroll-magic-school-flat-wichaiwi.png",
        stats: { speed: 500, dodge: 35, blink_dodge: 1 },
        effect: "Tỷ lệ né 35%, khi né thành công lập tức dịch chuyển ra sau lưng đối thủ.",
        desc: "Thấu hiểu pháp tắc không gian, bước chân đạp nát quy tắc cự ly.",
        price: 750000
    },
    {
        id: "skill_hon_don_khai_thien_luc",
        name: "Hỗn Độn Khai Thiên Chân Lục",
        type: "BiThuat",
        category: "bi_thuat",
        tier: "tien",
        rarity: "Tien",
        element: "vo_he",
        icon: "🌌",
        image_url: "https://img.icons8.com/color/100/scroll.png",
        stats: { expPerSec: 2500, all_attributes_percent: 40, execute_boss_percent: 5 },
        effect: "+2500 Tu vi/giây, tăng 40% toàn chỉ số công phòng, trảm sát Boss dưới 5% HP.",
        desc: "Ghi chép khoảnh khắc Bàn Cổ khai thiên tịch địa, đệ nhất bí thuật thiên hạ.",
        price: 5000000
    }
];

// NHIỆM VỤ 1: BỔ SUNG ẢNH CHO CÔNG PHÁP CŨ (BACKFILL IMAGES)
if (Array.isArray(SKILLS_DATA)) {
    SKILLS_DATA.forEach(skill => {
        if (!skill.image_url) {
            skill.image_url = getSkillImageUrl(skill);
        }
    });

    // BỔ SUNG CÁC BỘ CÔNG PHÁP MỚI VÀO SKILLS_DATA (PUSH/APPEND KHÔNG TRÙNG LẶP)
    const allNewSkills = [...NEW_SKILLS_SET_01, ...NEW_SKILLS_SET_02, ...NEW_SKILLS_SET_03];
    allNewSkills.forEach(newSkill => {
        if (!SKILLS_DATA.some(s => s.id === newSkill.id)) {
            SKILLS_DATA.push(newSkill);
        }
    });
}

// ============================================================================
// HỆ THỐNG QUẢN LÝ Ô TRANG BỊ THEO CẢNH GIỚI (SLOT SYSTEM)
// ============================================================================

/**
 * Tính số ô trang bị tối đa cho mỗi nhánh dựa trên Cảnh Giới
 */
function getEquippedSlotsLimit(realmMajorIndex = 0, extraMartialSlots = 0) {
    const limits = {
        TamPhap: 1,
        TheThuat: 1,
        VuKy: 1,
        ThanPhap: 0,
        BiThuat: 99
    };

    if (realmMajorIndex >= 1) limits.ThanPhap = 1; // Trúc Cơ mở Thân Pháp
    if (realmMajorIndex >= 2) limits.TheThuat = 2; // Kết Đan mở ô Thể Thuật 2
    if (realmMajorIndex >= 3) limits.VuKy = 2;     // Nguyên Anh mở ô Vũ Kỹ 2
    if (realmMajorIndex >= 4) limits.VuKy = 3;     // Hóa Thần mở ô Vũ Kỹ 3

    limits.VuKy += extraMartialSlots;

    // Alias hỗ trợ
    limits.tam_phap = limits.TamPhap;
    limits.the_thuat = limits.TheThuat;
    limits.cong_kich = limits.VuKy;
    limits.than_phap = limits.ThanPhap;
    limits.bi_thuat = limits.BiThuat;

    return limits;
}

// ============================================================================
// KIỂM TRA DUYÊN PHẬN & XUNG KHẮC NGŨ HÀNH
// ============================================================================

function checkFiveElementsSynergy(equippedSkillObjects = []) {
    const mentalSkill = equippedSkillObjects.find(s => s.type === 'TamPhap' || s.category === 'tam_phap');
    
    // Nếu trang bị Hỗn Độn Âm Dương Kinh: Kích hoạt Duyên Phận với MỌI loại Ngũ Hành!
    if (mentalSkill && mentalSkill.id === 'tp_hon_don') {
        return {
            hasSynergy: true,
            hasCounter: false,
            bonusMult: 1.30,
            status: "HỖN_ĐỘN_ĐẠI_THÀNH",
            message: "☯️ [Hỗn Độn Âm Dương Kinh] Khởi nguyên vạn vật! Kích hoạt Duyên Phận Tuyệt Đối (+30% Uy Lực)."
        };
    }

    if (!mentalSkill || !mentalSkill.element || mentalSkill.element === 'vo_he' || mentalSkill.element === 'vo_cuc') {
        return { hasSynergy: false, hasCounter: false, message: "Tâm Pháp trung hòa, kinh mạch bình ổn.", bonusMult: 1.0 };
    }

    const mentalElem = FIVE_ELEMENTS[mentalSkill.element];
    if (!mentalElem) {
        return { hasSynergy: false, hasCounter: false, message: "Tâm Pháp trung hòa.", bonusMult: 1.0 };
    }

    const martialSkills = equippedSkillObjects.filter(s => s.type === 'VuKy' || s.category === 'cong_kich');

    let synergyCount = 0;
    let counterCount = 0;

    martialSkills.forEach(m => {
        if (!m.element || m.element === 'vo_he' || m.element === 'vo_cuc') return;
        if (m.element === mentalSkill.element) {
            synergyCount++; // Cùng hệ
        } else if (mentalElem.generates === m.element) {
            synergyCount++; // Tương sinh
        } else if (mentalElem.conquers === m.element) {
            counterCount++; // Tương khắc
        }
    });

    if (synergyCount > 0 && counterCount === 0) {
        const bonus = 1 + synergyCount * 0.15;
        return {
            hasSynergy: true,
            hasCounter: false,
            synergyCount,
            bonusMult: bonus,
            status: "TƯƠNG_SINH",
            message: `⚡ [Ngũ Hành Duyên Phận] ${mentalElem.name} sinh vạn vật! Uy lực Vũ Kỹ tăng +${Math.round((bonus - 1) * 100)}%.`
        };
    } else if (counterCount > 0) {
        const penalty = Math.max(0.7, 1 - counterCount * 0.10);
        return {
            hasSynergy: false,
            hasCounter: true,
            counterCount,
            bonusMult: penalty,
            status: "XUNG_KHẮC",
            message: `⚠️ [Kinh Mạch Xung Khắc] ${mentalElem.name} và Vũ Kỹ tương khắc! Uy lực giảm ${Math.round((1 - penalty) * 100)}%.`
        };
    }

    return {
        hasSynergy: false,
        hasCounter: false,
        bonusMult: 1.0,
        status: "BÌNH_ỔN",
        message: "Ngũ hành điều hòa, không xung không khắc."
    };
}

// ============================================================================
// HÀM TÍNH TOÁN TỔNG CHỈ SỐ NHÂN VẬT (CALCULATE PLAYER STATS)
// ============================================================================

/**
 * Tính toán toàn bộ chỉ số nhân vật với công pháp trang bị, độ thông thạo và ngũ hành
 * Công thức: Chỉ số cuối = (Chỉ số cơ sở + Điểm cộng thẳng) * (1 + % Tăng trưởng)
 */
function calculatePlayerStats(player) {
    if (!player) return {};

    const baseAtk = Number(player.atk) || 100;
    const baseDef = Number(player.def) || 30;
    const baseMaxHp = Number(player.maxHp) || 1000;
    const baseMaxMp = Number(player.maxMp) || 200;
    const baseCrit = Number(player.crit) || 5;
    const baseRate = Number(player.rate) || 2;

    const equippedSkillIds = Array.isArray(player.equippedSkills) ? player.equippedSkills : [];
    const ownedSkills = Array.isArray(player.learnedSkills) ? player.learnedSkills : [];

    const activeSkills = [];

    // Lấy các kỹ năng đang trang bị
    equippedSkillIds.forEach(id => {
        const template = SKILLS_DATA.find(s => s.id === id);
        const owned = ownedSkills.find(s => s.id === id);
        if (template) {
            activeSkills.push({ ...template, level: owned?.level || 1 });
        }
    });

    // Cộng thêm các Bí Thuật Passive đã học (không cần lắp ô)
    ownedSkills.forEach(owned => {
        const template = SKILLS_DATA.find(s => s.id === owned.id);
        if (template && (template.type === 'BiThuat' || template.category === 'bi_thuat') && !activeSkills.some(a => a.id === template.id)) {
            activeSkills.push({ ...template, level: owned.level || 1 });
        }
    });

    // Kiểm tra Ngũ Hành Duyên Phận
    const synergy = checkFiveElementsSynergy(activeSkills);
    const martialMult = synergy.bonusMult || 1.0;

    let flatAtk = 0, percentAtk = 0;
    let flatDef = 0, percentDef = 0;
    let flatHp = 0, percentHp = 0;
    let flatMp = 0, percentMp = 0;
    let flatRate = 0, percentRate = 0;
    let critAdd = 0, critDmgAdd = 0, dodgeAdd = 0, atkSpeedAdd = 0, damageReductionAdd = 0;
    let extraMartialSlots = 0, breakthroughExpDiscount = 0, farmYieldBonus = 0;
    let farmGrowSpeedBonus = 0, alchemySuccessBonus = 0, alchemyExplosionReduction = 0;

    // Duyệt qua từng công pháp và tính toán hiệu quả theo Tầng Thông Thạo
    activeSkills.forEach(skill => {
        const masteryCfg = MASTERY_LEVELS[Math.min(4, Math.max(0, (skill.level || 1) - 1))];
        const masteryMultiplier = masteryCfg ? masteryCfg.mult : 1.0;

        const isMartial = skill.type === 'VuKy' || skill.category === 'cong_kich';
        const branchFactor = isMartial ? martialMult : 1.0;
        const totalFactor = masteryMultiplier * branchFactor;
        const stats = skill.stats || {};

        if (stats.atk) flatAtk += stats.atk * totalFactor;
        if (stats.atkPercent) percentAtk += stats.atkPercent * totalFactor;
        if (stats.def) flatDef += stats.def * totalFactor;
        if (stats.defPercent) percentDef += stats.defPercent * totalFactor;
        if (stats.hp) flatHp += stats.hp * totalFactor;
        if (stats.hpPercent) percentHp += stats.hpPercent * totalFactor;
        if (stats.maxMp) flatMp += stats.maxMp * totalFactor;
        if (stats.maxMpPercent) percentMp += stats.maxMpPercent * totalFactor;
        if (stats.expPerSec) flatRate += stats.expPerSec * totalFactor;
        if (stats.spiritFarmRateBonus) percentRate += stats.spiritFarmRateBonus * totalFactor;

        if (stats.critRate) critAdd += stats.critRate * 100 * totalFactor;
        if (stats.critDmgBonus) critDmgAdd += stats.critDmgBonus * 100 * totalFactor;
        if (stats.dodgeRate) dodgeAdd += stats.dodgeRate * 100 * totalFactor;
        if (stats.atkSpeedPercent) atkSpeedAdd += stats.atkSpeedPercent * 100 * totalFactor;
        if (stats.damageReduction) damageReductionAdd += stats.damageReduction * 100 * totalFactor;

        if (stats.extraMartialSlots) extraMartialSlots += stats.extraMartialSlots;
        if (stats.breakthroughExpDiscount) breakthroughExpDiscount += stats.breakthroughExpDiscount;
        if (stats.farmYieldBonus) farmYieldBonus += stats.farmYieldBonus * totalFactor;
        if (stats.farmGrowSpeedBonus) farmGrowSpeedBonus += stats.farmGrowSpeedBonus * totalFactor;
        if (stats.alchemySuccessBonus) alchemySuccessBonus += stats.alchemySuccessBonus * totalFactor;
    });

    return {
        atk: Math.round((baseAtk + flatAtk) * (1 + percentAtk)),
        def: Math.round((baseDef + flatDef) * (1 + percentDef)),
        maxHp: Math.round((baseMaxHp + flatHp) * (1 + percentHp)),
        maxMp: Math.round((baseMaxMp + flatMp) * (1 + percentMp)),
        expRate: Math.round((baseRate + flatRate) * (1 + percentRate)),
        crit: Number((baseCrit + critAdd).toFixed(1)),
        critDamage: Number((150 + critDmgAdd).toFixed(1)),
        dodge: Number(dodgeAdd.toFixed(1)),
        attackSpeed: Number((100 + atkSpeedAdd).toFixed(1)),
        damageReduction: Number(Math.min(75, damageReductionAdd).toFixed(1)),
        extraMartialSlots,
        breakthroughExpDiscount,
        farmYieldBonus,
        farmGrowSpeedBonus,
        alchemySuccessBonus,
        synergy
    };
}

// ============================================================================
// HÀM QUẢN LÝ TRANG BỊ & NÂNG CẤP CÔNG PHÁP (CONTROLLER)
// ============================================================================

function equipSkill(player, skillId, replaceSkillId = null) {
    if (!player || !skillId) return { success: false, reason: "INVALID_PARAM" };

    const skill = SKILLS_DATA.find(s => s.id === skillId);
    if (!skill) return { success: false, reason: "SKILL_NOT_FOUND" };

    if (!Array.isArray(player.equippedSkills)) player.equippedSkills = [];
    if (!Array.isArray(player.learnedSkills)) player.learnedSkills = [];

    const isLearned = player.learnedSkills.some(s => s.id === skillId);
    if (!isLearned) {
        return { success: false, reason: "NOT_LEARNED", message: "Đạo hữu chưa lĩnh ngộ công pháp này!" };
    }

    if (player.equippedSkills.includes(skillId)) {
        return { success: false, reason: "ALREADY_EQUIPPED", message: "Công pháp này đã được trang bị rồi!" };
    }

    const currentTier = SKILL_TIERS[skill.tier];
    const playerRealmIndex = Number(player.realmIndex) || 0;
    if (currentTier && playerRealmIndex < currentTier.minRealmIndex) {
        return {
            success: false,
            reason: "REALM_TOO_LOW",
            message: `Cảnh giới chưa đủ! Cần đạt ${currentTier.minRealmName} mới có thể ngự dụng.`
        };
    }

    const statsCalc = calculatePlayerStats(player);
    const limits = getEquippedSlotsLimit(player.realmMajorIndex || 0, statsCalc.extraMartialSlots || 0);
    const skillCategoryKey = skill.type || skill.category;
    const categoryLimit = limits[skillCategoryKey] || limits[skill.category] || 1;

    const currentInCat = player.equippedSkills.filter(id => {
        const s = SKILLS_DATA.find(x => x.id === id);
        return s && (s.type === skill.type || s.category === skill.category);
    });

    if (replaceSkillId || currentInCat.length >= categoryLimit) {
        const toRemove = replaceSkillId || currentInCat[0];
        if (toRemove) {
            const idx = player.equippedSkills.indexOf(toRemove);
            if (idx !== -1) {
                player.equippedSkills.splice(idx, 1);
            }
            const oldSkill = SKILLS_DATA.find(s => s.id === toRemove);
            player.equippedSkills.push(skillId);
            return {
                success: true,
                swapped: true,
                replacedSkill: oldSkill,
                message: `Hoán đổi thành công: Đã thay thế [${oldSkill?.name || toRemove}] bằng [${skill.name}]!`,
                skill
            };
        }
    }

    player.equippedSkills.push(skillId);
    return { success: true, message: `Trang bị thành công: ${skill.name}!`, skill };
}

function unequipSkill(player, skillId) {
    if (!player || !skillId) return { success: false };
    if (!Array.isArray(player.equippedSkills)) return { success: false };

    const idx = player.equippedSkills.indexOf(skillId);
    if (idx === -1) return { success: false, message: "Công pháp không nằm trong danh sách trang bị." };

    player.equippedSkills.splice(idx, 1);
    const skill = SKILLS_DATA.find(s => s.id === skillId);
    return { success: true, message: `Đã tháo gỡ: ${skill?.name || skillId}`, skill };
}

function upgradeSkillMastery(player, skillId) {
    if (!player || !skillId) return { success: false, reason: "INVALID_PARAM" };
    if (!Array.isArray(player.learnedSkills)) player.learnedSkills = [];

    let owned = player.learnedSkills.find(s => s.id === skillId);
    const template = SKILLS_DATA.find(s => s.id === skillId);
    if (!template) return { success: false, reason: "SKILL_NOT_FOUND" };

    if (!owned) {
        owned = { id: skillId, level: 1 };
        player.learnedSkills.push(owned);
    }

    if (owned.level >= 5) {
        return { success: false, reason: "MAX_LEVEL", message: "Công pháp đã tu luyện đạt đến cảnh giới Viên Mãn (Lv5)!" };
    }

    const nextMastery = MASTERY_LEVELS[owned.level];
    const tierMultiplier = SKILL_TIERS[template.tier]?.costMultiplier || 1.0;
    const requiredStones = Math.round(nextMastery.stoneCost * tierMultiplier);
    const requiredExp = Math.round(nextMastery.expCost * tierMultiplier);

    const playerStones = Number(player.stones) || 0;
    const playerExp = Number(player.exp) || 0;

    if (playerStones < requiredStones || playerExp < requiredExp) {
        return {
            success: false,
            reason: "NOT_ENOUGH_RESOURCES",
            message: `Không đủ tài nguyên! Cần ${requiredStones.toLocaleString()} Linh Thạch và ${requiredExp.toLocaleString()} Tu Vi.`,
            requiredStones,
            requiredExp
        };
    }

    player.stones -= requiredStones;
    player.exp -= requiredExp;
    owned.level++;

    const reachedMastery = MASTERY_LEVELS[owned.level - 1];
    return {
        success: true,
        level: owned.level,
        masteryName: reachedMastery.name,
        message: `Lĩnh ngộ thành công! [${template.name}] đột phá lên tầng [${reachedMastery.name}] (Hiệu quả x${reachedMastery.mult}).`
    };
}

// ============================================================================
// GIAO DIỆN TAB TÀNG KINH CÁC VỚI 5 SUB-TABS PHÂN LOẠI RÕ RÀNG & SMART SLOTS
// ============================================================================

let currentManualFilterTab = 'ALL'; // 'ALL', 'TamPhap', 'TheThuat', 'VuKy', 'ThanPhap', 'BiThuat'
let activeSkillTarget = null; // { catKey, catName, replaceSkillId }

function setManualFilterTab(tabName) {
    if (activeSkillTarget && activeSkillTarget.catKey !== tabName) {
        activeSkillTarget = null;
    }
    currentManualFilterTab = tabName;
    const container = document.getElementById('hub-modal-content');
    if (container && typeof state !== 'undefined') {
        renderManualsSystemTab(container, state);
    }
}
if (typeof window !== 'undefined') window.setManualFilterTab = setManualFilterTab;

function triggerSkillCategoryFlash(catKey) {
    setTimeout(() => {
        const catEl = document.getElementById(`skill-category-slot-${catKey}`);
        if (catEl) {
            catEl.classList.remove('slot-swap-flash');
            void catEl.offsetWidth; // trigger reflow
            catEl.classList.add('slot-swap-flash');
            setTimeout(() => {
                if (catEl) catEl.classList.remove('slot-swap-flash');
            }, 700);
        }
    }, 30);
}

function handleSkillCategorySlotClick(catKey, catName) {
    if (activeSkillTarget && activeSkillTarget.catKey === catKey) {
        cancelSkillTargeting();
    } else {
        activeSkillTarget = { catKey, catName, replaceSkillId: null };
        currentManualFilterTab = catKey;
        if (typeof playSound === 'function') playSound('bell');
        const container = document.getElementById('hub-modal-content');
        if (container && typeof state !== 'undefined') {
            renderManualsSystemTab(container, state);
        }
    }
}

function cancelSkillTargeting() {
    activeSkillTarget = null;
    currentManualFilterTab = 'ALL';
    const container = document.getElementById('hub-modal-content');
    if (container && typeof state !== 'undefined') {
        renderManualsSystemTab(container, state);
    }
}

function openSkillSlotPopover(skillId, catName) {
    const skill = SKILLS_DATA.find(s => s.id === skillId);
    if (!skill) return;

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

    const tierCfg = SKILL_TIERS[skill.tier] || SKILL_TIERS.PhamPham;
    const elemCfg = FIVE_ELEMENTS[skill.element] || FIVE_ELEMENTS.vo_he;
    const playerObj = typeof state !== 'undefined' ? state : {};
    const owned = Array.isArray(playerObj.learnedSkills) ? playerObj.learnedSkills.find(s => s.id === skill.id) : null;
    const currentLevel = owned ? owned.level : 1;
    const masteryCfg = MASTERY_LEVELS[currentLevel - 1] || MASTERY_LEVELS[0];

    card.innerHTML = `
        <div class="relative z-10 flex flex-col gap-3">
            <!-- Header -->
            <div class="flex items-start justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-slate-900 border ${tierCfg.badgeBg} flex items-center justify-center text-2xl ${tierCfg.colorClass} shadow-md">
                        <i class="fa-solid fa-scroll"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <h3 class="font-serif font-bold text-base ${tierCfg.colorClass}">${skill.name}</h3>
                            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${tierCfg.badgeBg}">${tierCfg.name}</span>
                        </div>
                        <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>Hệ: <b class="text-slate-200">${elemCfg.name}</b></span>
                            <span>• Nhánh: <b class="text-amber-300">${catName}</b></span>
                        </div>
                    </div>
                </div>
                <button type="button" onclick="closeSmartSlotPopover()" class="w-7 h-7 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700/60 flex items-center justify-center transition">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- Mastery & Effect -->
            <div class="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span class="text-slate-400">Tầng Lĩnh Ngộ:</span>
                    <span class="font-bold text-amber-300 font-mono">Tầng ${currentLevel}: ${masteryCfg.name} (x${masteryCfg.mult})</span>
                </div>
                <div class="text-[11px] text-emerald-300 font-medium leading-relaxed">
                    <i class="fa-solid fa-sparkles text-amber-400 mr-1"></i>${skill.effect}
                </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-300 italic leading-relaxed px-1">
                "${skill.desc}"
            </p>

            <!-- Actions: [Tháo Ra] & [Đổi Công Pháp] -->
            <div class="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <button type="button" onclick="handleSmartPopoverUnequipSkill('${skill.id}')" class="py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/50 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95">
                    <i class="fa-solid fa-arrow-down-to-bracket"></i> Tháo Ra
                </button>
                <button type="button" onclick="handleSmartPopoverSwapSkill('${skill.id}', '${skill.type || skill.category}', '${catName}')" class="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.4)] active:scale-95">
                    <i class="fa-solid fa-arrows-rotate"></i> Đổi Công Pháp
                </button>
            </div>
        </div>
    `;
}

function handleSmartPopoverUnequipSkill(skillId) {
    if (typeof closeSmartSlotPopover === 'function') closeSmartSlotPopover();
    if (typeof handleUnequipSkillClick === 'function') {
        handleUnequipSkillClick(skillId);
    }
}

function handleSmartPopoverSwapSkill(skillId, catKey, catName) {
    if (typeof closeSmartSlotPopover === 'function') closeSmartSlotPopover();
    activeSkillTarget = { catKey, catName, replaceSkillId: skillId };
    currentManualFilterTab = catKey;
    if (typeof playSound === 'function') playSound('bell');
    const container = document.getElementById('hub-modal-content');
    if (container && typeof state !== 'undefined') {
        renderManualsSystemTab(container, state);
    }
}

function renderManualsSystemTab(container, player) {
    if (!container || !player) return;

    if (!Array.isArray(player.equippedSkills)) player.equippedSkills = [];
    if (!Array.isArray(player.learnedSkills)) {
        player.learnedSkills = [
            { id: "tp_dan_khi", level: 1 },
            { id: "tt_thiet_bo_sam", level: 1 },
            { id: "vk_hoa_cau", level: 1 }
        ];
        player.equippedSkills = ["tp_dan_khi", "tt_thiet_bo_sam", "vk_hoa_cau"];
    }

    const calculatedStats = calculatePlayerStats(player);
    const limits = getEquippedSlotsLimit(player.realmMajorIndex || 0, calculatedStats.extraMartialSlots || 0);

    const equippedList = player.equippedSkills.map(id => {
        const tmpl = SKILLS_DATA.find(s => s.id === id);
        const owned = player.learnedSkills.find(s => s.id === id);
        return { ...tmpl, level: owned?.level || 1 };
    }).filter(Boolean);

    const synergy = calculatedStats.synergy;

    // Lọc danh sách theo tab được chọn
    const filteredSkills = currentManualFilterTab === 'ALL'
        ? SKILLS_DATA
        : SKILLS_DATA.filter(s => s.type === currentManualFilterTab || s.category === currentManualFilterTab);

    let html = `
    <div class="space-y-4 text-xs font-sans text-slate-200">
        <!-- BANNER THÔNG SỐ DUYÊN PHẬN NGŨ HÀNH -->
        <div class="p-3 rounded-xl ${synergy.hasSynergy ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : synergy.hasCounter ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' : 'bg-slate-900/80 border-slate-700/60 text-slate-300'} border flex items-center justify-between shadow-md">
            <div class="flex items-center gap-2.5">
                <i class="fa-solid ${synergy.hasSynergy ? 'fa-yin-yang text-emerald-400 animate-spin-slow' : synergy.hasCounter ? 'fa-triangle-exclamation text-rose-400 animate-pulse' : 'fa-circle-nodes text-slate-400'} text-base"></i>
                <div>
                    <div class="font-bold font-serif ${synergy.hasSynergy ? 'text-emerald-300' : synergy.hasCounter ? 'text-rose-300' : 'text-slate-200'}">
                        ${synergy.message}
                    </div>
                    <div class="text-[11px] opacity-80 mt-0.5">
                        Tốc độ tu luyện: <b class="text-amber-400 font-mono">+${calculatedStats.expRate}/s</b> • Công: <b class="text-rose-400 font-mono">${calculatedStats.atk}</b> • Thủ: <b class="text-sky-400 font-mono">${calculatedStats.def}</b>
                    </div>
                </div>
            </div>
            <span class="font-mono text-xs px-2.5 py-1 rounded bg-black/40 border border-white/10 font-bold">
                Hệ số: x${synergy.bonusMult.toFixed(2)}
            </span>
        </div>

        <!-- 1. CÁC Ô ĐANG TRANG BỊ (EQUIPPED SLOTS) -->
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
                <span class="font-serif font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-layer-group text-amber-400"></i> Ô Công Pháp Đang Ngự Dụng
                </span>
                <span class="text-[11px] text-slate-400">
                    Cảnh giới: <strong class="text-emerald-400">${SKILL_TIERS[Object.keys(SKILL_TIERS)[player.realmMajorIndex || 0]]?.minRealmName || 'Luyện Khí'}</strong>
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                ${['TamPhap', 'TheThuat', 'VuKy', 'ThanPhap'].map(catKey => {
                    const catCfg = SKILL_CATEGORIES[catKey];
                    const slotMax = limits[catKey] || 0;
                    const itemsInCat = equippedList.filter(s => s.type === catKey || s.category === catCfg.alias);
                    const isTargeted = Boolean(activeSkillTarget && activeSkillTarget.catKey === catKey);

                    return `
                        <div id="skill-category-slot-${catKey}" class="p-2.5 rounded-xl bg-slate-900/90 border ${isTargeted ? 'is-targeting-slot border-amber-400' : 'border-slate-800'} flex flex-col gap-2 transition-all">
                            <div class="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5 cursor-pointer" onclick="handleSkillCategorySlotClick('${catKey}', '${catCfg.name}')">
                                <span class="font-bold ${catCfg.accentColor} flex items-center gap-1">
                                    <i class="fa-solid ${catCfg.icon}"></i> ${catCfg.name}
                                </span>
                                <div class="flex items-center gap-1.5">
                                    ${isTargeted ? '<span class="text-[10px] text-amber-300 font-bold animate-pulse"><i class="fa-solid fa-bullseye"></i> Đang chọn</span>' : ''}
                                    <span class="font-mono text-slate-400">${itemsInCat.length}/${slotMax}</span>
                                </div>
                            </div>

                            <div class="space-y-1.5 min-h-[52px] flex flex-col justify-center">
                                ${itemsInCat.length === 0 ? `
                                    <div class="text-center py-2.5 text-[11px] text-amber-300/80 cursor-pointer hover:text-amber-200 transition p-1.5 rounded-lg border border-dashed border-amber-500/30 hover:border-amber-400/60"
                                         onclick="handleSkillCategorySlotClick('${catKey}', '${catCfg.name}')">
                                        ${slotMax === 0 ? '🔒 Mở ở cảnh giới cao hơn' : '➕ Ô trống (Nhấn để ngự dụng)'}
                                    </div>
                                ` : itemsInCat.map(sk => {
                                    const tierCfg = SKILL_TIERS[sk.tier];
                                    const elemCfg = FIVE_ELEMENTS[sk.element] || FIVE_ELEMENTS.vo_he;
                                    const mLevel = MASTERY_LEVELS[sk.level - 1];

                                    return `
                                        <div class="p-2 rounded-lg bg-slate-950 border ${tierCfg.badgeBg} flex items-center justify-between cursor-pointer hover:border-amber-400/60 transition group shadow-sm"
                                             onclick="openSkillSlotPopover('${sk.id}', '${catCfg.name}')">
                                            <div>
                                                <div class="font-bold ${tierCfg.colorClass} text-xs flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                                                    <span>${sk.name}</span>
                                                    <span class="text-[9px] px-1 rounded bg-black/50 text-amber-300 font-mono">Lv.${sk.level}</span>
                                                    <span class="text-[9px] px-1 rounded bg-slate-800 text-slate-300">${elemCfg.name}</span>
                                                </div>
                                                <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    ${mLevel.name} (x${mLevel.mult})
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <span class="text-[10px] text-amber-400/80 group-hover:text-amber-300 transition flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60">
                                                    <i class="fa-solid fa-sliders"></i> <span class="hidden sm:inline">Chi tiết</span>
                                                </span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- 1.5. BANNER HƯỚNG DẪN SMART SLOTS (NẾU ĐANG CHỜ LẮP ĐỒ) -->
        ${activeSkillTarget ? `
            <div class="smart-slot-banner flex items-center justify-between p-2.5 rounded-xl animate-pulse">
                <div class="flex items-center gap-2 text-xs text-amber-200">
                    <i class="fa-solid fa-bullseye text-amber-400 text-sm animate-spin-slow"></i>
                    <span>Đang chọn ô nhánh <b class="text-amber-300 font-bold">${activeSkillTarget.catName}</b> — Chọn công pháp bên dưới để ngự dụng!</span>
                </div>
                <button type="button" onclick="cancelSkillTargeting()" class="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-[11px] border border-amber-500/40 hover:border-amber-400 transition flex items-center gap-1 shadow-sm shrink-0">
                    <i class="fa-solid fa-xmark text-amber-400"></i> Hủy Chọn
                </button>
            </div>
        ` : ''}

        <!-- 2. THANH SUB-TAB PHÂN LOẠI RÕ RÀNG (5 NHÁNH) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
            <button onclick="setManualFilterTab('ALL')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'ALL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-list mr-1"></i> Tất Cả (${SKILLS_DATA.length})
            </button>
            <button onclick="setManualFilterTab('TamPhap')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'TamPhap' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-brain mr-1 text-amber-400"></i> Tâm Pháp (${SKILLS_DATA.filter(s => s.type === 'TamPhap' || s.category === 'tam_phap').length})
            </button>
            <button onclick="setManualFilterTab('TheThuat')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'TheThuat' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-shield-halved mr-1 text-rose-400"></i> Thể Thuật (${SKILLS_DATA.filter(s => s.type === 'TheThuat' || s.category === 'the_thuat').length})
            </button>
            <button onclick="setManualFilterTab('VuKy')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'VuKy' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-khanda mr-1 text-red-400"></i> Vũ Kỹ (${SKILLS_DATA.filter(s => s.type === 'VuKy' || s.category === 'cong_kich' || s.category === 'vu_ky').length})
            </button>
            <button onclick="setManualFilterTab('ThanPhap')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'ThanPhap' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-wind mr-1 text-teal-400"></i> Thân Pháp (${SKILLS_DATA.filter(s => s.type === 'ThanPhap' || s.category === 'than_phap').length})
            </button>
            <button onclick="setManualFilterTab('BiThuat')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentManualFilterTab === 'BiThuat' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-slate-900 text-slate-400 hover:text-white'}">
                <i class="fa-solid fa-wand-magic-sparkles mr-1 text-purple-400"></i> Bí Thuật (${SKILLS_DATA.filter(s => s.type === 'BiThuat' || s.category === 'bi_thuat').length})
            </button>
        </div>

        <!-- 3. DANH SÁCH CÔNG PHÁP ĐÃ LỌC THEO TAB -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
            ${filteredSkills.map(skill => {
                const tierCfg = SKILL_TIERS[skill.tier];
                const catCfg = SKILL_CATEGORIES[skill.type] || SKILL_CATEGORIES[skill.category];
                const elemCfg = FIVE_ELEMENTS[skill.element] || FIVE_ELEMENTS.vo_he;
                const owned = player.learnedSkills.find(s => s.id === skill.id);
                const isEquipped = player.equippedSkills.includes(skill.id);
                const currentLevel = owned ? owned.level : 0;
                const masteryCfg = currentLevel > 0 ? MASTERY_LEVELS[currentLevel - 1] : null;
                const nextMasteryCfg = currentLevel < 5 ? MASTERY_LEVELS[currentLevel] : null;

                const costMultiplier = tierCfg.costMultiplier || 1.0;
                const nextCostStones = nextMasteryCfg ? Math.round(nextMasteryCfg.stoneCost * costMultiplier) : 0;
                const nextCostExp = nextMasteryCfg ? Math.round(nextMasteryCfg.expCost * costMultiplier) : 0;

                return `
                    <div class="p-3.5 rounded-xl bg-slate-900/90 border ${isEquipped ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800'} flex flex-col justify-between gap-2.5">
                        <div>
                            <!-- Header card -->
                            <div class="flex items-start justify-between gap-2.5">
                                <div class="flex items-start gap-2.5">
                                    <div class="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 shrink-0 bg-slate-950 flex items-center justify-center shadow-md">
                                        <img src="${skill.image_url || './assets/images/item_bamboo_scroll.jpg'}" alt="${skill.name}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_IMG_FALLBACK">
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <h4 class="font-bold text-sm ${tierCfg.colorClass}">${skill.name}</h4>
                                            <span class="px-1.5 py-0.2 rounded text-[10px] ${tierCfg.badgeBg} font-medium">${tierCfg.name}</span>
                                            <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">${elemCfg.name}</span>
                                            <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-950 text-slate-400 font-medium">${catCfg.name}</span>
                                        </div>
                                        <p class="text-[11px] text-slate-300 mt-1.5 font-medium"><i class="fa-solid fa-sparkles text-amber-400 mr-1"></i>${skill.effect}</p>
                                        <p class="text-[10px] text-slate-500 mt-0.5 italic">${skill.desc}</p>
                                    </div>
                                </div>
                                <div class="text-right whitespace-nowrap">
                                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/60 border border-slate-700 ${currentLevel === 5 ? 'text-amber-400 border-amber-500/40' : 'text-slate-300'}">
                                        ${currentLevel === 0 ? 'Chưa học' : `Tầng ${currentLevel}: ${masteryCfg?.name}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Footer buttons -->
                        <div class="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                            ${currentLevel === 0 ? `
                                <button onclick="handleLearnSkillClick('${skill.id}')" class="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
                                    Khai Ngộ Công Pháp (Miễn phí)
                                </button>
                            ` : `
                                ${skill.type !== 'BiThuat' && skill.category !== 'bi_thuat' ? `
                                    ${isEquipped ? `
                                        <button onclick="openSkillSlotPopover('${skill.id}', '${catCfg?.name || skill.type}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold transition flex items-center gap-1">
                                            <i class="fa-solid fa-circle-check text-emerald-400"></i> Đang Ngự Dụng
                                        </button>
                                    ` : `
                                        <button onclick="handleEquipSkillClick('${skill.id}')" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-md active:scale-95">
                                            <i class="fa-solid fa-wand-magic-sparkles"></i> Ngự Dụng
                                        </button>
                                    `}
                                ` : `
                                    <span class="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-1 rounded border border-purple-500/30 font-semibold">
                                        Bí Thuật Bị Động (Vĩnh viễn)
                                    </span>
                                `}

                                ${currentLevel < 5 ? `
                                    <button onclick="handleUpgradeMasteryClick('${skill.id}')" class="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition text-center">
                                        Lĩnh Ngộ lên ${nextMasteryCfg?.name} (<span class="text-amber-300 font-mono">${nextCostStones}</span> đá, <span class="text-teal-300 font-mono">${nextCostExp}</span> tu vi)
                                    </button>
                                ` : `
                                    <span class="flex-1 text-center py-1.5 text-xs font-bold text-amber-400 font-serif">
                                        ★ Đại Viên Mãn ★
                                    </span>
                                `}
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
    `;

    container.innerHTML = html;
}

// 7. GLOBAL ACTION HANDLERS
if (typeof window !== 'undefined') {
    window.handleEquipSkillClick = function(skillId) {
        if (typeof state === 'undefined') return;
        const replaceId = activeSkillTarget ? activeSkillTarget.replaceSkillId : null;
        const res = equipSkill(state, skillId, replaceId);
        if (res.success) {
            if (typeof addLog === 'function') addLog(`[Công Pháp] ${res.message}`, "text-amber-300");
            if (typeof playSound === 'function') playSound('bell');
            const sk = SKILLS_DATA.find(s => s.id === skillId);
            const catKey = sk?.type || sk?.category;
            if (catKey) triggerSkillCategoryFlash(catKey);
            activeSkillTarget = null;
        } else {
            if (typeof addLog === 'function') addLog(`[Công Pháp] ❌ ${res.message}`, "text-rose-400");
        }
        if (typeof updateHUD === 'function') updateHUD();
        const container = document.getElementById('hub-modal-content');
        if (container) renderManualsSystemTab(container, state);
    };

    window.handleUnequipSkillClick = function(skillId) {
        if (typeof state === 'undefined') return;
        const res = unequipSkill(state, skillId);
        if (res.success) {
            if (typeof addLog === 'function') addLog(`[Công Pháp] ${res.message}`, "text-slate-300");
        }
        if (typeof updateHUD === 'function') updateHUD();
        const container = document.getElementById('hub-modal-content');
        if (container) renderManualsSystemTab(container, state);
    };

    window.handleUpgradeMasteryClick = function(skillId) {
        if (typeof state === 'undefined') return;
        const res = upgradeSkillMastery(state, skillId);
        if (res.success) {
            if (typeof addLog === 'function') addLog(`[Công Pháp] ✨ ${res.message}`, "text-emerald-300");
            if (typeof playSound === 'function') playSound('bell');
        } else {
            if (typeof addLog === 'function') addLog(`[Công Pháp] ❌ ${res.message}`, "text-rose-400");
        }
        if (typeof updateHUD === 'function') updateHUD();
        const container = document.getElementById('hub-modal-content');
        if (container) renderManualsSystemTab(container, state);
    };

    window.handleLearnSkillClick = function(skillId) {
        if (typeof state === 'undefined') return;
        if (!Array.isArray(state.learnedSkills)) state.learnedSkills = [];
        if (!state.learnedSkills.some(s => s.id === skillId)) {
            state.learnedSkills.push({ id: skillId, level: 1 });
            const tmpl = SKILLS_DATA.find(s => s.id === skillId);
            if (typeof addLog === 'function') addLog(`[Công Pháp] 📖 Đạo hữu đã ngộ ra bí kíp: <strong class="text-amber-300">${tmpl?.name || skillId}</strong>!`, "text-amber-300");
        }
        if (typeof updateHUD === 'function') updateHUD();
        const container = document.getElementById('hub-modal-content');
        if (container) renderManualsSystemTab(container, state);
    };

    window.handleSkillCategorySlotClick = handleSkillCategorySlotClick;
    window.cancelSkillTargeting = cancelSkillTargeting;
    window.openSkillSlotPopover = openSkillSlotPopover;
    window.handleSmartPopoverUnequipSkill = handleSmartPopoverUnequipSkill;
    window.handleSmartPopoverSwapSkill = handleSmartPopoverSwapSkill;
    window.triggerSkillCategoryFlash = triggerSkillCategoryFlash;
}

// 8. XUẤT MODULE
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SKILL_TIERS,
        SKILL_CATEGORIES,
        MASTERY_LEVELS,
        FIVE_ELEMENTS,
        SKILLS_DATA,
        getEquippedSlotsLimit,
        checkFiveElementsSynergy,
        calculatePlayerStats,
        equipSkill,
        unequipSkill,
        upgradeSkillMastery,
        renderManualsSystemTab,
        handleSkillCategorySlotClick,
        cancelSkillTargeting,
        openSkillSlotPopover
    };
}

if (typeof window !== 'undefined') {
    window.SKILL_TIERS = SKILL_TIERS;
    window.SKILL_CATEGORIES = SKILL_CATEGORIES;
    window.MASTERY_LEVELS = MASTERY_LEVELS;
    window.FIVE_ELEMENTS = FIVE_ELEMENTS;
    window.SKILLS_DATA = SKILLS_DATA;
    window.getEquippedSlotsLimit = getEquippedSlotsLimit;
    window.checkFiveElementsSynergy = checkFiveElementsSynergy;
    window.calculatePlayerStats = calculatePlayerStats;
    window.equipSkill = equipSkill;
    window.unequipSkill = unequipSkill;
    window.upgradeSkillMastery = upgradeSkillMastery;
    window.renderManualsSystemTab = renderManualsSystemTab;
}
