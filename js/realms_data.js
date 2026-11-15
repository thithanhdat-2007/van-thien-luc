/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG CẢNH GIỚI VÀ TIẾN TRÌNH TU LUYỆN (REALMS_DATA)
 * ============================================================================
 * Quy hoạch 5 Đại Cảnh Giới:
 * 1. Luyện Khí Kỳ (10 Tầng)       - Hệ số sức mạnh x1
 * 2. Trúc Cơ Kỳ (4 Tiểu Cảnh Giới) - Hệ số sức mạnh x5
 * 3. Kết Đan Kỳ (4 Tiểu Cảnh Giới) - Hệ số sức mạnh x25
 * 4. Nguyên Anh Kỳ (4 Tiểu Cảnh Giới)- Hệ số sức mạnh x100
 * 5. Hóa Thần Kỳ (4 Tiểu Cảnh Giới)- Hệ số sức mạnh x500
 * ============================================================================
 */

// Hệ phương trình Chỉ số Cảnh giới (Exponential Realm Scaling):
// Luyện Khí (Tier 1): x1 | Trúc Cơ (Tier 2): x10 | Kim Đan (Tier 3): x100 | Nguyên Anh (Tier 4): x1,000 | Hóa Thần (Tier 5): x10,000
const REALM_TIER_MULTIPLIERS = {
    1: 1,
    2: 10,
    3: 100,
    4: 1000,
    5: 10000
};

// Cấu hình 5 Đại Cảnh Giới
const MAJOR_REALMS_CONFIG = [
    {
        name: "Luyện Khí",
        title: "Luyện Khí Kỳ",
        multiplier: 1,
        major_multiplier: 1,
        tierMultiplier: 1,
        tier: 0,
        realmTier: 1,
        lifespan: 150,
        baseRate: 2,
        color: "rgba(45, 212, 191, 0.45)",
        stages: Array.from({ length: 10 }, (_, i) => ({
            name: `Tầng ${i + 1}`,
            minorIndex: i
        }))
    },
    {
        name: "Trúc Cơ",
        title: "Trúc Cơ Kỳ",
        multiplier: 5,
        major_multiplier: 10,
        tierMultiplier: 10,
        tier: 1,
        realmTier: 2,
        lifespan: 250,
        baseRate: 15,
        color: "rgba(56, 189, 248, 0.55)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Kết Đan",
        alias: "Kim Đan",
        title: "Kết Đan Kỳ",
        multiplier: 25,
        major_multiplier: 100,
        tierMultiplier: 100,
        tier: 2,
        realmTier: 3,
        lifespan: 500,
        baseRate: 80,
        color: "rgba(250, 204, 21, 0.6)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Nguyên Anh",
        title: "Nguyên Anh Kỳ",
        multiplier: 100,
        major_multiplier: 1000,
        tierMultiplier: 1000,
        tier: 3,
        realmTier: 4,
        lifespan: 1000,
        baseRate: 500,
        color: "rgba(192, 132, 252, 0.65)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Hóa Thần",
        title: "Hóa Thần Kỳ",
        multiplier: 500,
        major_multiplier: 10000,
        tierMultiplier: 10000,
        tier: 4,
        realmTier: 5,
        lifespan: 2000,
        baseRate: 2500,
        color: "rgba(244, 63, 94, 0.75)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Luyện Hư",
        title: "Luyện Hư Kỳ",
        multiplier: 2500,
        major_multiplier: 50000,
        tierMultiplier: 50000,
        tier: 5,
        realmTier: 6,
        lifespan: 5000,
        baseRate: 12000,
        color: "rgba(168, 85, 247, 0.8)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Hợp Thể",
        title: "Hợp Thể Kỳ",
        multiplier: 12000,
        major_multiplier: 250000,
        tierMultiplier: 250000,
        tier: 6,
        realmTier: 7,
        lifespan: 10000,
        baseRate: 60000,
        color: "rgba(236, 72, 153, 0.85)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Đại Thừa",
        title: "Đại Thừa Kỳ",
        multiplier: 60000,
        major_multiplier: 1200000,
        tierMultiplier: 1200000,
        tier: 7,
        realmTier: 8,
        lifespan: 25000,
        baseRate: 300000,
        color: "rgba(245, 158, 11, 0.9)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    },
    {
        name: "Độ Kiếp",
        title: "Độ Kiếp Kỳ",
        multiplier: 300000,
        major_multiplier: 6000000,
        tierMultiplier: 6000000,
        tier: 8,
        realmTier: 9,
        lifespan: 50000,
        baseRate: 1500000,
        color: "rgba(239, 68, 68, 0.95)",
        stages: [
            { name: "Sơ Kỳ", minorIndex: 0 },
            { name: "Trung Kỳ", minorIndex: 1 },
            { name: "Hậu Kỳ", minorIndex: 2 },
            { name: "Viên Mãn", minorIndex: 3 }
        ]
    }
];

/**
 * Danh sách toàn bộ Cảnh Giới (Bao gồm Nhân Giới và Linh Giới)
 */
const REALMS_DATA = [
    // -------------------------------------------------------------
    // CẢNH GIỚI 1: LUYỆN KHÍ KỲ (TẦNG 1 ĐẾN TẦNG 10) — HỆ SỐ x1
    // -------------------------------------------------------------
    {
        id: 1,
        index: 0,
        name: "Luyện Khí Tầng 1",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 1",
        majorIndex: 0,
        minorIndex: 0,
        multiplier: 1,
        maxExp: 100,
        baseHp: 1000,
        baseAtk: 100,
        baseDef: 30,
        baseMp: 200,
        rate: 5,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.35)",
        desc: "Dẫn khí nhập thể, gột rửa phàm thai, bắt đầu bước vào con đường trường sinh."
    },
    {
        id: 2,
        index: 1,
        name: "Luyện Khí Tầng 2",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 2",
        majorIndex: 0,
        minorIndex: 1,
        multiplier: 1,
        maxExp: 180,
        baseHp: 1250,
        baseAtk: 125,
        baseDef: 38,
        baseMp: 250,
        rate: 8,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.38)",
        desc: "Kinh mạch dần mở rộng, linh khí lưu thông suôn sẻ hơn."
    },
    {
        id: 3,
        index: 2,
        name: "Luyện Khí Tầng 3",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 3",
        majorIndex: 0,
        minorIndex: 2,
        multiplier: 1,
        maxExp: 300,
        baseHp: 1560,
        baseAtk: 156,
        baseDef: 48,
        baseMp: 310,
        rate: 12,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.40)",
        desc: "Linh khí tụ tại đan điền, thể chất phàm nhân bắt đầu biến đổi."
    },
    {
        id: 4,
        index: 3,
        name: "Luyện Khí Tầng 4",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 4",
        majorIndex: 0,
        minorIndex: 3,
        multiplier: 1,
        maxExp: 480,
        baseHp: 1950,
        baseAtk: 195,
        baseDef: 60,
        baseMp: 390,
        rate: 18,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.42)",
        desc: "Khí tức ngưng tụ, có thể xuất chưởng kèm linh phong."
    },
    {
        id: 5,
        index: 4,
        name: "Luyện Khí Tầng 5",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 5",
        majorIndex: 0,
        minorIndex: 4,
        multiplier: 1,
        maxExp: 750,
        baseHp: 2440,
        baseAtk: 244,
        baseDef: 75,
        baseMp: 490,
        rate: 25,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [
            {
                key: "auto_farm",
                featureId: "btn_linh_dien",
                name: "Tự động thu hoạch Linh Điền",
                desc: "Trợ lý động phủ tự động chăm sóc và thu hoạch linh thảo khi dược liệu chín muồi."
            }
        ],
        color: "rgba(45, 212, 191, 0.45)",
        desc: "Thần niệm sơ khai, có thể câu thông linh điền, vạn vật sinh sôi."
    },
    {
        id: 6,
        index: 5,
        name: "Luyện Khí Tầng 6",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 6",
        majorIndex: 0,
        minorIndex: 5,
        multiplier: 1,
        maxExp: 1100,
        baseHp: 3050,
        baseAtk: 305,
        baseDef: 94,
        baseMp: 610,
        rate: 35,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.48)",
        desc: "Lục phủ ngũ tạng được linh khí gột rửa, thân thể nhẹ nhàng như yến."
    },
    {
        id: 7,
        index: 6,
        name: "Luyện Khí Tầng 7",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 7",
        majorIndex: 0,
        minorIndex: 6,
        multiplier: 1,
        maxExp: 1600,
        baseHp: 3810,
        baseAtk: 381,
        baseDef: 118,
        baseMp: 760,
        rate: 50,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.50)",
        desc: "Bước vào hậu kỳ Luyện Khí, linh uy tỏa ra khiến dã thú khiếp sợ."
    },
    {
        id: 8,
        index: 7,
        name: "Luyện Khí Tầng 8",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 8",
        majorIndex: 0,
        minorIndex: 7,
        multiplier: 1,
        maxExp: 2400,
        baseHp: 4760,
        baseAtk: 476,
        baseDef: 148,
        baseMp: 950,
        rate: 70,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.52)",
        desc: "Bách mạch quán thông, linh lực trong đan điền dồi dào như suối nhỏ."
    },
    {
        id: 9,
        index: 8,
        name: "Luyện Khí Tầng 9",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 9",
        majorIndex: 0,
        minorIndex: 8,
        multiplier: 1,
        maxExp: 3500,
        baseHp: 5950,
        baseAtk: 595,
        baseDef: 185,
        baseMp: 1190,
        rate: 95,
        lifespan: 150,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(45, 212, 191, 0.55)",
        desc: "Khí tức đạt đỉnh phàm giới, chuẩn bị nghênh đón bình cảnh cực hạn."
    },
    {
        id: 10,
        index: 9,
        name: "Luyện Khí Tầng 10",
        majorRealm: "Luyện Khí",
        minorStage: "Tầng 10",
        majorIndex: 0,
        minorIndex: 9,
        multiplier: 1,
        maxExp: 5200,
        baseHp: 7440,
        baseAtk: 744,
        baseDef: 231,
        baseMp: 1490,
        rate: 130,
        lifespan: 150,
        isMajorBottleneck: true,
        breakthroughPill: "pill_foundation",
        unlocks: [],
        color: "rgba(45, 212, 191, 0.65)",
        desc: "Luyện Khí Viên Mãn, linh khí hóa sương đặc quánh, sẵn sàng Trúc Cơ Nghịch Thiên!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 2: TRÚC CƠ KỲ (4 TIỂU CẢNH GIỚI) — HỆ SỐ x5
    // -------------------------------------------------------------
    {
        id: 11,
        index: 10,
        name: "Trúc Cơ - Sơ Kỳ",
        majorRealm: "Trúc Cơ",
        minorStage: "Sơ Kỳ",
        majorIndex: 1,
        minorIndex: 0,
        multiplier: 5,
        maxExp: 6000,
        baseHp: 18000,
        baseAtk: 1800,
        baseDef: 580,
        baseMp: 3600,
        rate: 200,
        lifespan: 250,
        isMajorBottleneck: false,
        unlocks: [
            {
                key: "alchemy_furnace",
                featureId: "btn_lo_dan",
                name: "Lò Đan & Tự động khai Lò Đan",
                desc: "Mở khóa Đan Các, khai lô luyện đan dược và kích hoạt trợ lý tự động luyện chế đan dược."
            }
        ],
        color: "rgba(56, 189, 248, 0.45)",
        desc: "Linh khí hóa lỏng thành trì, chính thức đúc thành đạo cơ trường sinh, ngự kiếm phi hành!"
    },
    {
        id: 12,
        index: 11,
        name: "Trúc Cơ - Trung Kỳ",
        majorRealm: "Trúc Cơ",
        minorStage: "Trung Kỳ",
        majorIndex: 1,
        minorIndex: 1,
        multiplier: 5,
        maxExp: 9600,
        baseHp: 22500,
        baseAtk: 2250,
        baseDef: 725,
        baseMp: 4500,
        rate: 300,
        lifespan: 250,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(56, 189, 248, 0.50)",
        desc: "Đạo cơ vững chắc, linh dịch trong kinh mạch cuồn cuộn không ngừng."
    },
    {
        id: 13,
        index: 12,
        name: "Trúc Cơ - Hậu Kỳ",
        majorRealm: "Trúc Cơ",
        minorStage: "Hậu Kỳ",
        majorIndex: 1,
        minorIndex: 2,
        multiplier: 5,
        maxExp: 15500,
        baseHp: 28100,
        baseAtk: 2810,
        baseDef: 900,
        baseMp: 5600,
        rate: 450,
        lifespan: 250,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(56, 189, 248, 0.55)",
        desc: "Linh hải tràn đầy, thần thức có thể bao phủ chu vi trăm dặm."
    },
    {
        id: 14,
        index: 13,
        name: "Trúc Cơ - Viên Mãn",
        majorRealm: "Trúc Cơ",
        minorStage: "Viên Mãn",
        majorIndex: 1,
        minorIndex: 3,
        multiplier: 5,
        maxExp: 26000,
        baseHp: 35100,
        baseAtk: 3510,
        baseDef: 1125,
        baseMp: 7000,
        rate: 650,
        lifespan: 250,
        isMajorBottleneck: true,
        breakthroughPill: "pill_core",
        unlocks: [],
        color: "rgba(56, 189, 248, 0.65)",
        desc: "Đạo đài viên mãn, linh dịch cô đọng chuẩn bị kết xuất Kim Đan vô thượng!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 3: KẾT ĐAN KỲ (4 TIỂU CẢNH GIỚI) — HỆ SỐ x25
    // -------------------------------------------------------------
    {
        id: 15,
        index: 14,
        name: "Kết Đan - Sơ Kỳ",
        majorRealm: "Kết Đan",
        minorStage: "Sơ Kỳ",
        majorIndex: 2,
        minorIndex: 0,
        multiplier: 25,
        maxExp: 32000,
        baseHp: 90000,
        baseAtk: 9000,
        baseDef: 2900,
        baseMp: 18000,
        rate: 1000,
        lifespan: 500,
        isMajorBottleneck: false,
        unlocks: [
            {
                key: "demon_tower",
                featureId: "btn_tran_yeu_thap",
                name: "Trấn Yêu Tháp",
                desc: "Mở khóa Hầm ngục vô tận Trấn Yêu Tháp để thử thách lực chiến, trảm yêu đoạt bảo vật."
            }
        ],
        color: "rgba(250, 204, 21, 0.50)",
        desc: "Một viên Kim Đan nuốt vào bụng, từ nay mệnh ta do ta không do trời!"
    },
    {
        id: 16,
        index: 15,
        name: "Kết Đan - Trung Kỳ",
        majorRealm: "Kết Đan",
        minorStage: "Trung Kỳ",
        majorIndex: 2,
        minorIndex: 1,
        multiplier: 25,
        maxExp: 52000,
        baseHp: 112500,
        baseAtk: 11250,
        baseDef: 3625,
        baseMp: 22500,
        rate: 1500,
        lifespan: 500,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(250, 204, 21, 0.55)",
        desc: "Đan văn hiển lộ, chân hỏa đan điền rực cháy bất diệt."
    },
    {
        id: 17,
        index: 16,
        name: "Kết Đan - Hậu Kỳ",
        majorRealm: "Kết Đan",
        minorStage: "Hậu Kỳ",
        majorIndex: 2,
        minorIndex: 2,
        multiplier: 25,
        maxExp: 82000,
        baseHp: 140600,
        baseAtk: 14060,
        baseDef: 4530,
        baseMp: 28100,
        rate: 2200,
        lifespan: 500,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(250, 204, 21, 0.60)",
        desc: "Đan khí cửu chuyển, kim quang chói lọi, ngự khí cửu thiên."
    },
    {
        id: 18,
        index: 17,
        name: "Kết Đan - Viên Mãn",
        majorRealm: "Kết Đan",
        minorStage: "Viên Mãn",
        majorIndex: 2,
        minorIndex: 3,
        multiplier: 25,
        maxExp: 135000,
        baseHp: 175800,
        baseAtk: 17580,
        baseDef: 5660,
        baseMp: 35100,
        rate: 3200,
        lifespan: 500,
        isMajorBottleneck: true,
        breakthroughPill: "pill_nascent",
        unlocks: [],
        color: "rgba(250, 204, 21, 0.70)",
        desc: "Kim Đan đại viên mãn, xuất hiện vết rạn sinh cơ, chuẩn bị Đan Toái Anh Sinh!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 4: NGUYÊN ANH KỲ (4 TIỂU CẢNH GIỚI) — HỆ SỐ x100
    // -------------------------------------------------------------
    {
        id: 19,
        index: 18,
        name: "Nguyên Anh - Sơ Kỳ",
        majorRealm: "Nguyên Anh",
        minorStage: "Sơ Kỳ",
        majorIndex: 3,
        minorIndex: 0,
        multiplier: 100,
        maxExp: 175000,
        baseHp: 450000,
        baseAtk: 45000,
        baseDef: 15000,
        baseMp: 90000,
        rate: 5000,
        lifespan: 1000,
        isMajorBottleneck: false,
        unlocks: [
            {
                key: "divine_sense_expedition",
                featureId: "btn_than_thuc",
                name: "Thần Thức (Auto thám hiểm cấp cao)",
                desc: "Thần thức phân xuất, tự động khám phá các bí cảnh thượng cổ hiểm nguy với tỷ lệ tìm bảo vật cực lớn."
            }
        ],
        color: "rgba(192, 132, 252, 0.55)",
        desc: "Đan toái anh sinh! Nguyên thần xuất khiếu ngao du thiên địa, thọ nguyên ngàn năm!"
    },
    {
        id: 20,
        index: 19,
        name: "Nguyên Anh - Trung Kỳ",
        majorRealm: "Nguyên Anh",
        minorStage: "Trung Kỳ",
        majorIndex: 3,
        minorIndex: 1,
        multiplier: 100,
        maxExp: 280000,
        baseHp: 562500,
        baseAtk: 56250,
        baseDef: 18750,
        baseMp: 112500,
        rate: 7500,
        lifespan: 1000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(192, 132, 252, 0.60)",
        desc: "Nguyên Anh ngưng thực, nắm giữ thiên địa quy tắc sơ cấp."
    },
    {
        id: 21,
        index: 20,
        name: "Nguyên Anh - Hậu Kỳ",
        majorRealm: "Nguyên Anh",
        minorStage: "Hậu Kỳ",
        majorIndex: 3,
        minorIndex: 2,
        multiplier: 100,
        maxExp: 440000,
        baseHp: 703000,
        baseAtk: 70300,
        baseDef: 23400,
        baseMp: 140600,
        rate: 11000,
        lifespan: 1000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(192, 132, 252, 0.65)",
        desc: "Đại tu sĩ Nguyên Anh hậu kỳ, một niệm dời non lấp bể, uy chấn một phương tinh vực."
    },
    {
        id: 22,
        index: 21,
        name: "Nguyên Anh - Viên Mãn",
        majorRealm: "Nguyên Anh",
        minorStage: "Viên Mãn",
        majorIndex: 3,
        minorIndex: 3,
        multiplier: 100,
        maxExp: 720000,
        baseHp: 878000,
        baseAtk: 87800,
        baseDef: 29250,
        baseMp: 175800,
        rate: 16000,
        lifespan: 1000,
        isMajorBottleneck: true,
        breakthroughPill: "pill_god_transformation",
        unlocks: [],
        color: "rgba(192, 132, 252, 0.75)",
        desc: "Nguyên Anh hóa thần, chạm đến ngưỡng cửa thiên nhân hợp nhất!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 5: HÓA THẦN KỲ (4 TIỂU CẢNH GIỚI) — HỆ SỐ x500
    // -------------------------------------------------------------
    {
        id: 23,
        index: 22,
        name: "Hóa Thần - Sơ Kỳ",
        majorRealm: "Hóa Thần",
        minorStage: "Sơ Kỳ",
        majorIndex: 4,
        minorIndex: 0,
        multiplier: 500,
        maxExp: 1000000,
        baseHp: 2500000,
        baseAtk: 250000,
        baseDef: 85000,
        baseMp: 500000,
        rate: 25000,
        lifespan: 2000,
        isMajorBottleneck: false,
        unlocks: [
            {
                key: "avatar_gathering_x2",
                featureId: "btn_phan_than",
                name: "Phân Thân (Tăng tốc thu thập x2)",
                desc: "Hóa sinh phân thân độc lập, nhân đôi toàn bộ tốc độ thu thập tài nguyên và tích lũy Tu Vi."
            }
        ],
        color: "rgba(244, 63, 94, 0.65)",
        desc: "Thiên nhân tương hợp, lĩnh ngộ ý cảnh đại đạo! Bắt đầu chịu sự áp chế của Thiên Đạo Hạ Giới."
    },
    {
        id: 24,
        index: 23,
        name: "Hóa Thần - Trung Kỳ",
        majorRealm: "Hóa Thần",
        minorStage: "Trung Kỳ",
        majorIndex: 4,
        minorIndex: 1,
        multiplier: 500,
        maxExp: 1600000,
        baseHp: 3125000,
        baseAtk: 312500,
        baseDef: 106000,
        baseMp: 625000,
        rate: 38000,
        lifespan: 2000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(244, 63, 94, 0.70)",
        desc: "Ý cảnh viên mãn, thân hóa tự nhiên, vạn pháp bất xâm."
    },
    {
        id: 25,
        index: 24,
        name: "Hóa Thần - Hậu Kỳ",
        majorRealm: "Hóa Thần",
        minorStage: "Hậu Kỳ",
        majorIndex: 4,
        minorIndex: 2,
        multiplier: 500,
        maxExp: 2400000,
        baseHp: 3900000,
        baseAtk: 390000,
        baseDef: 132500,
        baseMp: 780000,
        rate: 55000,
        lifespan: 2000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(244, 63, 94, 0.75)",
        desc: "Lực lượng vượt khỏi giới hạn không gian, có thể xé rách hư không."
    },
    {
        id: 26,
        index: 25,
        name: "Hóa Thần - Viên Mãn",
        majorRealm: "Hóa Thần",
        minorStage: "Viên Mãn",
        majorIndex: 4,
        minorIndex: 3,
        multiplier: 500,
        maxExp: 3600000,
        baseHp: 4875000,
        baseAtk: 487500,
        baseDef: 165600,
        baseMp: 975000,
        rate: 80000,
        lifespan: 2000,
        isMajorBottleneck: true,
        breakthroughPill: null,
        unlocks: [],
        color: "rgba(244, 63, 94, 0.85)",
        desc: "Cực hạn chi cảnh Nhân Giới! 2 Tỷ Tu Vi viên mãn, chỉ đợi Thiên Kiếp Phi Thăng Linh Giới!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 6: LUYỆN HƯ KỲ (LINH GIỚI) — HỆ SỐ x2500
    // -------------------------------------------------------------
    {
        id: 27,
        index: 26,
        name: "Luyện Hư - Sơ Kỳ",
        majorRealm: "Luyện Hư",
        minorStage: "Sơ Kỳ",
        majorIndex: 5,
        minorIndex: 0,
        multiplier: 2500,
        maxExp: 5000000,
        baseHp: 12000000,
        baseAtk: 1200000,
        baseDef: 400000,
        baseMp: 2400000,
        rate: 120000,
        lifespan: 5000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(168, 85, 247, 0.8)",
        desc: "Thần hồn phản hư, sơ bộ dung nhập thiên địa pháp tắc Linh Giới!"
    },
    {
        id: 28,
        index: 27,
        name: "Luyện Hư - Trung Kỳ",
        majorRealm: "Luyện Hư",
        minorStage: "Trung Kỳ",
        majorIndex: 5,
        minorIndex: 1,
        multiplier: 2500,
        maxExp: 7000000,
        baseHp: 16000000,
        baseAtk: 1600000,
        baseDef: 530000,
        baseMp: 3200000,
        rate: 180000,
        lifespan: 5000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(168, 85, 247, 0.85)",
        desc: "Luyện Hư trung kỳ, thân như hư vô, pháp lực như thủy triều vô tận."
    },
    {
        id: 29,
        index: 28,
        name: "Luyện Hư - Hậu Kỳ",
        majorRealm: "Luyện Hư",
        minorStage: "Hậu Kỳ",
        majorIndex: 5,
        minorIndex: 2,
        multiplier: 2500,
        maxExp: 10000000,
        baseHp: 21000000,
        baseAtk: 2100000,
        baseDef: 700000,
        baseMp: 4200000,
        rate: 260000,
        lifespan: 5000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(168, 85, 247, 0.9)",
        desc: "Ngưng luyện hư không pháp bảo, lĩnh ngộ tiểu thế giới chi lực."
    },
    {
        id: 30,
        index: 29,
        name: "Luyện Hư - Viên Mãn",
        majorRealm: "Luyện Hư",
        minorStage: "Viên Mãn",
        majorIndex: 5,
        minorIndex: 3,
        multiplier: 2500,
        maxExp: 15000000,
        baseHp: 28000000,
        baseAtk: 2800000,
        baseDef: 950000,
        baseMp: 5600000,
        rate: 380000,
        lifespan: 5000,
        isMajorBottleneck: true,
        unlocks: [],
        color: "rgba(168, 85, 247, 0.95)",
        desc: "Đỉnh phong Luyện Hư, chuẩn bị hợp nhất chân thân và pháp tướng!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 7: HỢP THỂ KỲ — HỆ SỐ x12000
    // -------------------------------------------------------------
    {
        id: 31,
        index: 30,
        name: "Hợp Thể - Sơ Kỳ",
        majorRealm: "Hợp Thể",
        minorStage: "Sơ Kỳ",
        majorIndex: 6,
        minorIndex: 0,
        multiplier: 12000,
        maxExp: 22000000,
        baseHp: 65000000,
        baseAtk: 6500000,
        baseDef: 2200000,
        baseMp: 13000000,
        rate: 550000,
        lifespan: 10000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(236, 72, 153, 0.8)",
        desc: "Pháp tướng hợp nhất với nhục thân, lực lượng kinh thiên động địa!"
    },
    {
        id: 32,
        index: 31,
        name: "Hợp Thể - Trung Kỳ",
        majorRealm: "Hợp Thể",
        minorStage: "Trung Kỳ",
        majorIndex: 6,
        minorIndex: 1,
        multiplier: 12000,
        maxExp: 32000000,
        baseHp: 85000000,
        baseAtk: 8500000,
        baseDef: 2800000,
        baseMp: 17000000,
        rate: 800000,
        lifespan: 10000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(236, 72, 153, 0.85)",
        desc: "Lĩnh ngộ quy tắc đại đạo trung cấp, chưởng khống thiên địa linh mạch."
    },
    {
        id: 33,
        index: 32,
        name: "Hợp Thể - Hậu Kỳ",
        majorRealm: "Hợp Thể",
        minorStage: "Hậu Kỳ",
        majorIndex: 6,
        minorIndex: 2,
        multiplier: 12000,
        maxExp: 46000000,
        baseHp: 110000000,
        baseAtk: 11000000,
        baseDef: 3600000,
        baseMp: 22000000,
        rate: 1150000,
        lifespan: 10000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(236, 72, 153, 0.9)",
        desc: "Cự đầu Linh Giới, xưng bá một phương thánh vực!"
    },
    {
        id: 34,
        index: 33,
        name: "Hợp Thể - Viên Mãn",
        majorRealm: "Hợp Thể",
        minorStage: "Viên Mãn",
        majorIndex: 6,
        minorIndex: 3,
        multiplier: 12000,
        maxExp: 65000000,
        baseHp: 145000000,
        baseAtk: 14500000,
        baseDef: 4800000,
        baseMp: 29000000,
        rate: 1600000,
        lifespan: 10000,
        isMajorBottleneck: true,
        unlocks: [],
        color: "rgba(236, 72, 153, 0.95)",
        desc: "Viên mãn Hợp Thể, chỉ một bước nữa là bước chân vào Đại Thừa Chí Tôn!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 8: ĐẠI THỪA KỲ — HỆ SỐ x60000
    // -------------------------------------------------------------
    {
        id: 35,
        index: 34,
        name: "Đại Thừa - Sơ Kỳ",
        majorRealm: "Đại Thừa",
        minorStage: "Sơ Kỳ",
        majorIndex: 7,
        minorIndex: 0,
        multiplier: 60000,
        maxExp: 90000000,
        baseHp: 320000000,
        baseAtk: 32000000,
        baseDef: 11000000,
        baseMp: 64000000,
        rate: 2200000,
        lifespan: 25000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(245, 158, 11, 0.9)",
        desc: "Đại Thừa tu sĩ! Nắm giữ pháp tắc chí cao, thọ ngang nhật nguyệt."
    },
    {
        id: 36,
        index: 35,
        name: "Đại Thừa - Trung Kỳ",
        majorRealm: "Đại Thừa",
        minorStage: "Trung Kỳ",
        majorIndex: 7,
        minorIndex: 1,
        multiplier: 60000,
        maxExp: 130000000,
        baseHp: 420000000,
        baseAtk: 42000000,
        baseDef: 14000000,
        baseMp: 84000000,
        rate: 3200000,
        lifespan: 25000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(245, 158, 11, 0.92)",
        desc: "Thân dung vạn tượng, một ý niệm có thể tái sinh sinh linh."
    },
    {
        id: 37,
        index: 36,
        name: "Đại Thừa - Hậu Kỳ",
        majorRealm: "Đại Thừa",
        minorStage: "Hậu Kỳ",
        majorIndex: 7,
        minorIndex: 2,
        multiplier: 60000,
        maxExp: 185000000,
        baseHp: 550000000,
        baseAtk: 55000000,
        baseDef: 18500000,
        baseMp: 110000000,
        rate: 4500000,
        lifespan: 25000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(245, 158, 11, 0.95)",
        desc: "Chí tôn Linh Giới, gần như bất tử bất diệt trong giới diện này."
    },
    {
        id: 38,
        index: 37,
        name: "Đại Thừa - Viên Mãn",
        majorRealm: "Đại Thừa",
        minorStage: "Viên Mãn",
        majorIndex: 7,
        minorIndex: 3,
        multiplier: 60000,
        maxExp: 260000000,
        baseHp: 720000000,
        baseAtk: 72000000,
        baseDef: 24000000,
        baseMp: 144000000,
        rate: 6500000,
        lifespan: 25000,
        isMajorBottleneck: true,
        unlocks: [],
        color: "rgba(245, 158, 11, 1.0)",
        desc: "Đại Thừa viên mãn, chuẩn bị nghênh đón Cửu Cửu Thiên Kiếp!"
    },

    // -------------------------------------------------------------
    // CẢNH GIỚI 9: ĐỘ KIẾP KỲ — HỆ SỐ x300000
    // -------------------------------------------------------------
    {
        id: 39,
        index: 38,
        name: "Độ Kiếp - Sơ Kỳ",
        majorRealm: "Độ Kiếp",
        minorStage: "Sơ Kỳ",
        majorIndex: 8,
        minorIndex: 0,
        multiplier: 300000,
        maxExp: 360000000,
        baseHp: 1600000000,
        baseAtk: 160000000,
        baseDef: 55000000,
        baseMp: 320000000,
        rate: 9000000,
        lifespan: 50000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(239, 68, 68, 0.9)",
        desc: "Thiên Lôi bắt đầu tẩy lễ nhục thân và nguyên thần, bước vào giai đoạn Độ Kiếp!"
    },
    {
        id: 40,
        index: 39,
        name: "Độ Kiếp - Trung Kỳ",
        majorRealm: "Độ Kiếp",
        minorStage: "Trung Kỳ",
        majorIndex: 8,
        minorIndex: 1,
        multiplier: 300000,
        maxExp: 500000000,
        baseHp: 2200000000,
        baseAtk: 220000000,
        baseDef: 75000000,
        baseMp: 440000000,
        rate: 12500000,
        lifespan: 50000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(239, 68, 68, 0.92)",
        desc: "Chịu đựng lục sắc thiên lôi, pháp lực chuyển hóa thành Tiên Thiên Tiên Khí."
    },
    {
        id: 41,
        index: 40,
        name: "Độ Kiếp - Hậu Kỳ",
        majorRealm: "Độ Kiếp",
        minorStage: "Hậu Kỳ",
        majorIndex: 8,
        minorIndex: 2,
        multiplier: 300000,
        maxExp: 700000000,
        baseHp: 3000000000,
        baseAtk: 300000000,
        baseDef: 100000000,
        baseMp: 600000000,
        rate: 17500000,
        lifespan: 50000,
        isMajorBottleneck: false,
        unlocks: [],
        color: "rgba(239, 68, 68, 0.95)",
        desc: "Tiên thể sơ thành, thần thông thông thiên triệt địa, sẵn sàng phi thăng Chân Tiên Giới."
    },
    {
        id: 42,
        index: 41,
        name: "Độ Kiếp - Viên Mãn",
        majorRealm: "Độ Kiếp",
        minorStage: "Viên Mãn",
        majorIndex: 8,
        minorIndex: 3,
        multiplier: 300000,
        maxExp: 1000000000,
        baseHp: 4200000000,
        baseAtk: 420000000,
        baseDef: 140000000,
        baseMp: 840000000,
        rate: 25000000,
        lifespan: 50000,
        isMajorBottleneck: true,
        unlocks: [],
        color: "rgba(239, 68, 68, 1.0)",
        desc: "Đỉnh Thiên Lập Địa! Chờ đón Tiên Môn rộng mở, đắc đạo thành Tiên, tiêu dao vạn cổ!"
    }
];

/**
 * Hàm kiểm tra Tu Vi và thực hiện thăng cấp (checkAndLevelUp)
 * @param {Object} player - Đối tượng nhân vật (hoặc state game)
 * @param {Object} options - Tùy chọn (forced: ép thăng cấp bỏ qua exp check)
 * @returns {Object} Kết quả thăng cấp: { leveledUp, isMajorBreakthrough, oldRealm, newRealm, statsIncrease, newlyUnlocked, reason }
 */
function checkAndLevelUp(player, options = {}) {
    if (!player) {
        return { leveledUp: false, reason: "INVALID_PLAYER" };
    }

    // Đảm bảo chỉ số cảnh giới hợp lệ
    const currentIndex = Number.isInteger(player.realmIndex) ? player.realmIndex : 0;
    const currentRealm = REALMS_DATA[currentIndex];

    if (!currentRealm) {
        return { leveledUp: false, reason: "REALM_NOT_FOUND" };
    }

    // Kiểm tra đã đạt đỉnh cảnh giới cao nhất chưa
    if (currentIndex >= REALMS_DATA.length - 1) {
        return {
            leveledUp: false,
            reason: "MAX_REALM_REACHED",
            currentRealm
        };
    }

    const nextRealm = REALMS_DATA[currentIndex + 1];

    // Kiểm tra điều kiện Phi Thăng Linh Giới khi ở Hóa Thần Viên Mãn (index 25)
    if (currentIndex === 25) {
        const isAscended = Boolean(player.isAscended || (player.currentWorld && player.currentWorld.includes('Linh Giới')));
        if (!isAscended && !options.forced) {
            return {
                leveledUp: false,
                reason: "REQUIRES_ASCENSION",
                message: "⚠️ Đạo hữu cần hoàn thành Phi Thăng Linh Giới (vượt Tầng 50 Trấn Yêu Tháp) mới có thể đột phá lên Luyện Hư Kỳ!",
                currentRealm,
                nextRealm
            };
        }
    }

    // 1. Kiểm tra điều kiện Tu Vi (EXP Curve)
    const currentExp = Number(player.exp) || 0;
    const requiredExp = currentRealm.maxExp;

    if (!options.forced && currentExp < requiredExp) {
        return {
            leveledUp: false,
            reason: "NOT_ENOUGH_EXP",
            currentExp,
            requiredExp,
            remainingExp: requiredExp - currentExp,
            percent: Math.min(100, Math.floor((currentExp / requiredExp) * 100)),
            currentRealm,
            nextRealm
        };
    }

    // 2. Thực hiện thăng cấp
    // Trừ lượng Tu Vi tiêu hao của cảnh giới cũ (giữ lại Tu Vi tích lũy dư thừa)
    if (!options.forced) {
        player.exp = Math.max(0, currentExp - requiredExp);
    }

    player.realmIndex = currentIndex + 1;
    const isMajorBreakthrough = nextRealm.majorRealm !== currentRealm.majorRealm;

    // 3. Cập nhật hệ số và chỉ số nhân vật
    player.realmMultiplier = nextRealm.multiplier;

    // Lưu lại chỉ số trước thăng cấp để tính chênh lệch
    const oldStats = {
        hp: player.maxHp || currentRealm.baseHp,
        atk: player.atk || currentRealm.baseAtk,
        def: player.def || currentRealm.baseDef,
        mp: player.maxMp || currentRealm.baseMp
    };

    // Áp dụng chỉ số cơ bản mới theo cảnh giới
    player.maxHp = nextRealm.baseHp;
    player.hp = nextRealm.baseHp; // Hồi phục đầy đủ sinh mệnh khi đột phá
    player.atk = nextRealm.baseAtk;
    player.def = nextRealm.baseDef;
    player.maxMp = nextRealm.baseMp;
    player.mp = nextRealm.baseMp;

    if (player.lifespan !== undefined) {
        player.lifespan = nextRealm.lifespan;
    }

    // 4. Mở khóa Đặc Quyền & Tính Năng mới (Feature Unlocks)
    if (!player.unlockedFeatures) {
        player.unlockedFeatures = [];
    }

    const newlyUnlocked = [];
    if (nextRealm.unlocks && nextRealm.unlocks.length > 0) {
        nextRealm.unlocks.forEach(unlock => {
            const hasFeature = Array.isArray(player.unlockedFeatures)
                ? player.unlockedFeatures.includes(unlock.key)
                : player.unlockedFeatures[unlock.key];

            if (!hasFeature) {
                if (Array.isArray(player.unlockedFeatures)) {
                    player.unlockedFeatures.push(unlock.key);
                } else {
                    player.unlockedFeatures[unlock.key] = true;
                }
                newlyUnlocked.push(unlock);
            }
        });
    }

    // 5. Trả về kết quả chi tiết
    return {
        leveledUp: true,
        isMajorBreakthrough,
        oldRealm: currentRealm,
        newRealm: nextRealm,
        statsIncrease: {
            hp: nextRealm.baseHp - oldStats.hp,
            atk: nextRealm.baseAtk - oldStats.atk,
            def: nextRealm.baseDef - oldStats.def,
            mp: nextRealm.baseMp - oldStats.mp,
            hpGainPercent: Number(((nextRealm.baseHp / oldStats.hp - 1) * 100).toFixed(1)),
            atkGainPercent: Number(((nextRealm.baseAtk / oldStats.atk - 1) * 100).toFixed(1)),
            defGainPercent: Number(((nextRealm.baseDef / oldStats.def - 1) * 100).toFixed(1))
        },
        multiplierGrowth: {
            from: currentRealm.multiplier,
            to: nextRealm.multiplier,
            factor: nextRealm.multiplier / currentRealm.multiplier
        },
        newlyUnlocked
    };
}

/**
 * Lấy danh sách tất cả các tính năng đã mở khóa tính đến cảnh giới hiện tại
 * @param {number} realmIndex 
 * @returns {Array} Danh sách đặc quyền đã kích hoạt
 */
function getAllUnlockedFeaturesUpTo(realmIndex) {
    const safeIndex = Math.min(REALMS_DATA.length - 1, Math.max(0, realmIndex));
    const unlocks = [];
    for (let i = 0; i <= safeIndex; i++) {
        if (REALMS_DATA[i].unlocks && REALMS_DATA[i].unlocks.length > 0) {
            unlocks.push(...REALMS_DATA[i].unlocks);
        }
    }
    return unlocks;
}

/**
 * Kiểm tra xem người chơi đã mở khóa tính năng cụ thể chưa
 * @param {number} realmIndex 
 * @param {string} featureKey 
 * @returns {boolean}
 */
function isFeatureUnlockedByRealm(realmIndex, featureKey) {
    const allUnlocks = getAllUnlockedFeaturesUpTo(realmIndex);
    return allUnlocks.some(u => u.key === featureKey || u.featureId === featureKey);
}

// Đồng bộ major_multiplier và realmTier (1 -> 5) cho toàn bộ REALMS_DATA
REALMS_DATA.forEach(r => {
    const tierNum = (r.majorIndex || 0) + 1;
    const tierMult = REALM_TIER_MULTIPLIERS[tierNum] || Math.pow(10, tierNum - 1);
    r.realmTier = tierNum;
    r.major_multiplier = tierMult;
    r.tierMultiplier = tierMult;
});

/**
 * Chuẩn hóa cấp bậc Đại Cảnh Giới (Tier 1..5):
 * 1: Luyện Khí | 2: Trúc Cơ | 3: Kim Đan / Kết Đan | 4: Nguyên Anh | 5: Hóa Thần
 */
function resolveRealmTier(val) {
    if (typeof val === 'number' && !Number.isNaN(val)) {
        return Math.max(1, Math.floor(val));
    }
    if (typeof val === 'object' && val !== null) {
        if (typeof val.realmTier === 'number') return Math.max(1, val.realmTier);
        if (typeof val.tier === 'number') return val.tier >= 1 ? val.tier : val.tier + 1;
        if (typeof val.majorIndex === 'number') return val.majorIndex + 1;
        if (typeof val.realmIndex === 'number') {
            if (typeof window !== 'undefined' && Array.isArray(window.REALMS) && window.REALMS[val.realmIndex]) {
                return (window.REALMS[val.realmIndex].majorIndex || 0) + 1;
            }
            if (REALMS_DATA[val.realmIndex]) {
                return (REALMS_DATA[val.realmIndex].majorIndex || 0) + 1;
            }
        }
    }
    const str = String(val || '').toLowerCase();
    if (str.includes('hóa thần') || str.includes('hoa than')) return 5;
    if (str.includes('nguyên anh') || str.includes('nguyen anh')) return 4;
    if (str.includes('kim đan') || str.includes('kết đan') || str.includes('kim dan') || str.includes('ket dan')) return 3;
    if (str.includes('trúc cơ') || str.includes('truc co')) return 2;
    return 1;
}

/**
 * Lấy Hệ số nhân Base Stats theo Tier (Exponential Realm Scaling):
 * Tier 1 (Luyện Khí): x1 | Tier 2 (Trúc Cơ): x10 | Tier 3 (Kim Đan): x100 | Tier 4 (Nguyên Anh): x1,000 | Tier 5 (Hóa Thần): x10,000
 */
function getRealmTierMultiplier(tierInput) {
    const tier = resolveRealmTier(tierInput);
    return REALM_TIER_MULTIPLIERS[tier] || Math.pow(10, Math.max(0, tier - 1));
}

/**
 * CƠ CHẾ UY ÁP CẢNH GIỚI (REALM SUPPRESSION ALGORITHM)
 * - delta = attackerTier - defenderTier
 * - delta == 0: 1.0 (100% sát thương bình thường), nhận 100% (1.0)
 * - delta < 0 (Đánh vượt cấp - Bị Uy Áp):
 *   + Mỗi 1 cấp chênh lệch: Giảm 20% Sát thương gây ra, Tăng 20% Sát thương nhận vào.
 *   + VD: Vượt 1 cấp (delta = -1) -> Gây 80% (0.8), Nhận 120% (1.2)
 *   + VD: Vượt 2 cấp (delta = -2) -> Gây 60% (0.6), Nhận 140% (1.4)
 *   + Giới hạn trần (Cap): Tối đa chỉ giảm đến 10% Dmg (0.10) và nhận tối đa 300% Dmg (3.00)
 * - delta > 0 (Đè cấp):
 *   + Mỗi 1 cấp cao hơn: Tăng 10% Sát thương gây ra (1 + delta * 0.10)
 *   + Giảm 10% Sát thương nhận vào (1 - delta * 0.10, tối thiểu 0.10)
 */
function getRealmSuppression(attackerTier, defenderTier) {
    const aTier = resolveRealmTier(attackerTier);
    const dTier = resolveRealmTier(defenderTier);
    const delta = aTier - dTier;

    if (delta === 0) return 1.0;

    if (delta < 0) {
        const diff = Math.abs(delta);
        return Math.max(0.10, Number((1.0 - diff * 0.20).toFixed(2)));
    }

    return Number((1.0 + delta * 0.10).toFixed(2));
}

function getRealmSuppressionTaken(attackerTier, defenderTier) {
    const aTier = resolveRealmTier(attackerTier);
    const dTier = resolveRealmTier(defenderTier);
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
 * Trả về thông tin chi tiết Uy Áp Cảnh Giới (Sát thương gây ra & Sát thương nhận vào)
 */
function getRealmSuppressionDetails(attackerTier, defenderTier) {
    const aTier = resolveRealmTier(attackerTier);
    const dTier = resolveRealmTier(defenderTier);
    const delta = aTier - dTier;

    const dealtMult = getRealmSuppression(aTier, dTier);
    const takenMult = getRealmSuppressionTaken(aTier, dTier);

    if (delta === 0) {
        return {
            attackerTier: aTier,
            defenderTier: dTier,
            delta: 0,
            damageDealtMultiplier: 1.0,
            damageTakenMultiplier: 1.0,
            status: 'equal',
            description: 'Đồng cảnh giới: Sát thương gây ra 100%, sát thương nhận vào 100%'
        };
    }

    if (delta > 0) {
        return {
            attackerTier: aTier,
            defenderTier: dTier,
            delta,
            damageDealtMultiplier: dealtMult,
            damageTakenMultiplier: takenMult,
            status: 'dominant',
            description: `Áp chế cảnh giới (+${delta} bậc): Sát thương gây ra x${dealtMult} (+${Math.round((dealtMult - 1) * 100)}%), sát thương nhận vào x${takenMult} (-${Math.round((1 - takenMult) * 100)}%)`
        };
    }

    const diff = Math.abs(delta);
    return {
        attackerTier: aTier,
        defenderTier: dTier,
        delta,
        damageDealtMultiplier: dealtMult,
        damageTakenMultiplier: takenMult,
        status: 'suppressed',
        description: `Chịu uy áp cảnh giới (-${diff} bậc): Sát thương gây ra x${dealtMult} (-${Math.round((1 - dealtMult) * 100)}%), sát thương nhận vào x${takenMult} (+${Math.round((takenMult - 1) * 100)}%)`
    };
}

// Xuất Module cho môi trường Node.js và Trình duyệt
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REALM_TIER_MULTIPLIERS,
        MAJOR_REALMS_CONFIG,
        REALMS_DATA,
        REALMS: REALMS_DATA,
        checkAndLevelUp,
        getAllUnlockedFeaturesUpTo,
        isFeatureUnlockedByRealm,
        resolveRealmTier,
        getRealmTierMultiplier,
        getRealmSuppression,
        getRealmSuppressionTaken,
        calculateRealmSuppression,
        getRealmSuppressionDetails
    };
}

if (typeof window !== 'undefined') {
    window.REALM_TIER_MULTIPLIERS = REALM_TIER_MULTIPLIERS;
    window.MAJOR_REALMS_CONFIG = MAJOR_REALMS_CONFIG;
    window.REALMS_DATA = REALMS_DATA;
    window.REALMS = REALMS_DATA;
    window.checkAndLevelUp = checkAndLevelUp;
    window.getAllUnlockedFeaturesUpTo = getAllUnlockedFeaturesUpTo;
    window.isFeatureUnlockedByRealm = isFeatureUnlockedByRealm;
    window.resolveRealmTier = resolveRealmTier;
    window.getRealmTierMultiplier = getRealmTierMultiplier;
    window.getRealmSuppression = getRealmSuppression;
    window.getRealmSuppressionTaken = getRealmSuppressionTaken;
    window.calculateRealmSuppression = calculateRealmSuppression;
    window.getRealmSuppressionDetails = getRealmSuppressionDetails;
}
