/**
 * VẤN THIÊN LỤC — VẠN DƯỢC TIÊN ĐỈNH (ALCHEMY & PILLS CATALOG)
 * Chứa toàn bộ định danh Đan Dược, Linh Thảo, Dược Phương, Lò Đan và Dị Hỏa
 * Chuẩn 6 phẩm cấp Đan Dược:
 *   1: Phàm Đan
 *   2: Linh Đan
 *   3: Huyền Đan
 *   4: Địa Đan
 *   5: Thiên Đan
 *   6: Tiên Đan
 */

// =========================================================================
// 1. DANH MỤC LINH THẢO, NGUYÊN LIỆU, YÊU ĐAN & LINH TUYỀN (HERBS_DATA)
// =========================================================================
const HERBS_DATA = [
    // --- LINH THẢO (PLANTS & HERBS) ---
    {
        id: "herb_nguyet_hoa_thao",
        name: "Nguyệt Hoa Thảo",
        type: "Thảo Dược",
        rarity: 2,
        count: 5,
        speed: 10,
        desc: "Linh thảo hấp thụ ánh trăng lạnh trên đỉnh núi tuyết, dùng luyện sơ giai đan dược.",
        icon: "fa-seedling",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_tam_diep_lien",
        name: "Tam Diệp Thần Liên",
        type: "Thảo Dược",
        rarity: 3,
        count: 3,
        speed: 14,
        desc: "Sen ba lá nở trong đầm linh khí, giúp ngưng thần tụ đỉnh khi kết đan.",
        icon: "fa-leaf",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_sinh_co_thao",
        name: "Sinh Cơ Hoàn Hồn Thảo",
        type: "Thảo Dược",
        rarity: 2,
        count: 5,
        speed: 8,
        desc: "Thảo dược chứa mầm sống mãnh liệt, có thể liền da lành thịt cấp tốc.",
        icon: "fa-spa",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_tinh_than_hoa",
        name: "U Tinh Tinh Thần Hoa",
        type: "Thảo Dược",
        rarity: 2,
        count: 4,
        speed: 9,
        desc: "Bông hoa màu lam tím tỏa sáng trong bóng tối, bổ dưỡng thần thức và pháp lực.",
        icon: "fa-clover",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_tuyet_lien_ngan_nam",
        name: "Thiên Sơn Tuyết Liên",
        type: "Thảo Dược",
        rarity: 3,
        count: 2,
        speed: 16,
        desc: "Bông sen ngàn năm mọc giữa bão tuyết Cực Bắc, tiêu trừ độc tố và tâm ma tà niệm.",
        icon: "fa-snowflake",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_huyet_ma_hoa",
        name: "Huyết Ma U Uất Hoa",
        type: "Thảo Dược",
        rarity: 4,
        count: 0,
        speed: 20,
        desc: "Hấp thụ máu ma tu mà lớn, cuồng bạo dị thường, dùng luyện các loại Cuồng Hóa Ma Đan.",
        icon: "fa-cannabis",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_long_huyet_thao",
        name: "Long Huyết Thần Thảo",
        type: "Thảo Dược",
        rarity: 4,
        count: 0,
        speed: 22,
        desc: "Nơi chân long nhỏ máu sinh ra loài thảo này, chứa long khí trợ lực hóa sinh Nguyên Anh.",
        icon: "fa-dragon",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_phuong_hoang_moc",
        name: "Phượng Hoàng Niết Bàn Chi",
        type: "Thảo Dược",
        rarity: 5,
        count: 0,
        speed: 28,
        desc: "Nhánh cây nơi Phượng Hoàng từng niết bàn dục hỏa, có uy lực cải tử hoàn sinh.",
        icon: "fa-fire",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_dao_tien_ngan_nam",
        name: "Thiên Sơn Tiên Đào Quả",
        type: "Thảo Dược",
        rarity: 5,
        count: 0,
        speed: 30,
        desc: "Ba ngàn năm nở hoa, ba ngàn năm kết quả, ăn vào kéo dài thọ nguyên trăm năm.",
        icon: "fa-apple-whole",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_bo_de_tam_diep",
        name: "Bồ Đề Tâm Diệp",
        type: "Thảo Dược",
        rarity: 4,
        count: 0,
        speed: 24,
        desc: "Lá cây Bồ Đề viễn cổ, soi rọi bản tâm, tịnh hóa tuyệt đối mọi u uế đan độc.",
        icon: "fa-tree",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },
    {
        id: "herb_hon_don_thanh_lien",
        name: "Hỗn Độn Thanh Liên Quả",
        type: "Thảo Dược",
        rarity: 6,
        count: 0,
        speed: 40,
        desc: "Hạt giống của đóa Thanh Liên sinh ra trước khi trời đất phân định, chí bảo thế gian.",
        icon: "fa-sun",
        image: "./assets/images/item_bamboo_scroll.jpg"
    },

    // --- LINH TUYỀN & NƯỚC THẦN (WATERS) ---
    {
        id: "water_linh_tuyen",
        name: "Thanh Tuyền Linh Dịch",
        type: "Linh Tuyền",
        rarity: 2,
        count: 10,
        desc: "Mạch nước ngầm giàu linh khí dưới chân núi Tiên Tông, chất dẫn hoàn hảo cho đan phương.",
        icon: "fa-droplet",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "water_han_bang_tuyen",
        name: "Hàn Băng Thần Tuyền",
        type: "Linh Tuyền",
        rarity: 3,
        count: 5,
        desc: "Nước giếng băng vạn trượng lạnh buốt thấu xương, dùng dung hòa dược tính hung bạo.",
        icon: "fa-water",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "water_thien_nhat_chan_thuy",
        name: "Thiên Nhất Chân Thủy",
        type: "Linh Tuyền",
        rarity: 5,
        count: 2,
        desc: "Giọt nước nguyên sơ tích tụ từ chín tầng mây, là dung dịch luyện Tiên Đan cực phẩm.",
        icon: "fa-gem",
        image: "./assets/images/mirror_bagua.jpg"
    },

    // --- YÊU ĐAN & THÚ CỐT (BEAST CORES & BONES) ---
    {
        id: "monster_yeu_dan_nhat_giai",
        name: "Nhất Giai Yêu Đan",
        type: "Yêu Đan",
        rarity: 2,
        count: 5,
        desc: "Nội đan kết tinh từ yêu thú Luyện Khí kỳ, chứa đựng linh lực nguyên thủy.",
        icon: "fa-circle-dot",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "monster_yeu_dan_nhi_giai",
        name: "Nhị Giai Yêu Đan",
        type: "Yêu Đan",
        rarity: 3,
        count: 3,
        desc: "Nội đan săn được từ yêu thú Trúc Cơ kỳ, tỏa ra yêu khí mờ ảo.",
        icon: "fa-circle-dot",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "monster_yeu_dan_tam_giai",
        name: "Tam Giai Yêu Đan",
        type: "Yêu Đan",
        rarity: 4,
        count: 1,
        desc: "Nội đan của Yêu Vương Kim Đan kỳ, uy áp cuồn cuộn làm chấn động lò luyện.",
        icon: "fa-meteor",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "monster_yeu_dan_tu_giai",
        name: "Tứ Giai Thần Thú Nội Đan",
        type: "Yêu Đan",
        rarity: 6,
        count: 0,
        desc: "Nội đan của Hóa Hình Yêu Hoàng, ngưng kết thiên địa chi lực vạn năm.",
        icon: "fa-dragon",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "bone_bach_ho_yeu_cot",
        name: "Bạch Hổ Yêu Cốt",
        type: "Yêu Cốt",
        rarity: 3,
        count: 2,
        desc: "Mẩu xương cứng rắn như kim cương của Bạch Hổ tinh, nguyên liệu tôi luyện gân cốt.",
        icon: "fa-bone",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "bone_man_nguu_cot",
        name: "Man Ngưu Thú Cốt",
        type: "Yêu Cốt",
        rarity: 3,
        count: 2,
        desc: "Xương đùi Viễn Cổ Man Ngưu dũng mãnh, kích phát cuồng tính hung bạo.",
        icon: "fa-bone",
        image: "./assets/images/mirror_bagua.jpg"
    },
    {
        id: "bone_chan_long_cot",
        name: "Thái Cổ Chân Long Cốt",
        type: "Yêu Cốt",
        rarity: 6,
        count: 0,
        desc: "Xương rồng thần thoại thời hồng hoang, ngâm rượu hay luyện đan đều tái tạo sinh mệnh.",
        icon: "fa-shield-halved",
        image: "./assets/images/mirror_bagua.jpg"
    }
];

// =========================================================================
// 2. DANH MỤC ĐAN DƯỢC TOÀN HỆ THỐNG (PILLS_DATA)
// =========================================================================
const PILLS_DATA = [
    // --- PHÂN LOẠI 1: TĂNG TU VI (CỘNG KINH NGHIỆM) ---
    {
        id: "pill_quy_nguyen_dan",
        name: "Quy Nguyên Hóa Khí Đan",
        type: "Đan Dược",
        rarity: 2,
        count: 2,
        desc: "Nuốt vào lập tức hấp thu 300 Tu Vi, tích tụ 8% Đan Độc trong kinh mạch.",
        effect: { exp: 300, toxicity: 8 },
        icon: "fa-capsules",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_thien_dia_nguyen_khi",
        name: "Thiên Địa Nguyên Khí Đan",
        type: "Đan Dược",
        rarity: 4,
        count: 0,
        desc: "Chắt lọc từ linh khí thuần khiết của càn khôn, tăng ngay 3.500 Tu Vi (+15% Đan Độc).",
        effect: { exp: 3500, toxicity: 15 },
        icon: "fa-atom",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },

    // --- PHÂN LOẠI 2: TRỊ LIỆU & HỒI PHỤC (HP / MP) ---
    {
        id: "pill_thanh_huyet_sinh_co",
        name: "Thanh Huyết Sinh Cơ Đan",
        type: "Đan Dược",
        rarity: 2,
        count: 3,
        desc: "Trị nội ngoại thương thần tốc, hồi phục lập tức 1.500 HP (+5% Đan Độc).",
        effect: { hp: 1500, toxicity: 5 },
        icon: "fa-heart-pulse",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_tinh_than_hoi_khi",
        name: "Tụ Thần Hồi Khí Đan",
        type: "Đan Dược",
        rarity: 2,
        count: 3,
        desc: "Thanh lọc tâm thức, hồi phục ngay 400 Pháp Lực MP (+4% Đan Độc).",
        effect: { mp: 400, toxicity: 4 },
        icon: "fa-droplet",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_thao_thien_phuc_sinh",
        name: "Cửu Mệnh Phục Sinh Đan",
        type: "Đan Dược",
        rarity: 5,
        count: 0,
        desc: "Mang linh tính Niết Bàn, kẻ hấp hối uống vào hồi phục 8.000 HP (+10% Đan Độc).",
        effect: { hp: 8000, toxicity: 10 },
        icon: "fa-ankh",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },

    // --- PHÂN LOẠI 3: TRỢ ĐỘT PHÁ (TĂNG TỶ LỆ VƯỢT CẢNH GIỚI / KIẾP NẠN) ---
    {
        id: "pill_tam_hoa_tu_dinh",
        name: "Tam Hoa Tụ Đỉnh Đan",
        type: "Đan Dược",
        rarity: 3,
        count: 1,
        desc: "Trợ lực tụ linh hoa trên đỉnh đầu, tăng +35% tỷ lệ Đột Phá cảnh giới (+12% Đan Độc).",
        effect: { exp: 500, breakBuff: true, breakRate: 35, toxicity: 12 },
        icon: "fa-spa",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_cuu_chuyen_nguyen_anh",
        name: "Cửu Chuyển Hóa Anh Đan",
        type: "Đan Dược",
        rarity: 5,
        count: 0,
        desc: "Bảo hộ Kim Đan vỡ sinh Nguyên Anh, tăng +45% tỷ lệ vượt Lôi Kiếp (+25% Đan Độc).",
        effect: { exp: 8000, breakBuff: true, breakRate: 45, toxicity: 25 },
        icon: "fa-child-reaching",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_hoa_than_phi_thang",
        name: "Hóa Thần Quy Chân Tiên Đan",
        type: "Đan Dược",
        rarity: 6,
        count: 0,
        desc: "Nghịch thiên cải mệnh trợ lực vượt Cửu Cửu Thiên Kiếp, +60% tỷ lệ đắc đạo phi thăng (+10% Đan Độc).",
        effect: { exp: 25000, breakBuff: true, breakRate: 60, toxicity: 10 },
        icon: "fa-wand-magic-sparkles",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },

    // --- PHÂN LOẠI 4: TĂNG CHỈ SỐ GỐC VĨNH VIỄN (PERMANENT STAT BOOST) ---
    {
        id: "pill_tay_tuy_hoan_cot",
        name: "Tẩy Tủy Hoán Cốt Đan",
        type: "Đan Dược",
        rarity: 4,
        count: 0,
        desc: "Gọt rửa tủy xương, vĩnh viễn tăng +15 Công Kích và +25 Phòng Ngự gốc (+20% Đan Độc).",
        effect: { permanentAtk: 15, permanentDef: 25, toxicity: 20 },
        icon: "fa-bone",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_van_tho_truong_sinh",
        name: "Vạn Thọ Vô Cương Đan",
        type: "Đan Dược",
        rarity: 5,
        count: 0,
        desc: "Gia tăng thêm 60 năm Thọ Nguyên và vĩnh viễn +500 Khí Huyết tối đa (+8% Đan Độc).",
        effect: { lifespan: 60, permanentHp: 500, toxicity: 8 },
        icon: "fa-hourglass",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_hon_don_tai_tao",
        name: "Hỗn Độn Tái Tạo Tiên Đan",
        type: "Đan Dược",
        rarity: 6,
        count: 0,
        desc: "Tái sinh tiên cốt hỗn độn, vĩnh viễn +100 Công, +100 Thủ và +2.000 HP (+5% Đan Độc).",
        effect: { permanentAtk: 100, permanentDef: 100, permanentHp: 2000, toxicity: 5 },
        icon: "fa-gem",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_dai_lao_bat_tu",
        name: "Đại La Bất Diệt Đan",
        type: "Đan Dược",
        rarity: 6,
        count: 0,
        desc: "Tiên đan tối thượng kéo dài 200 năm Thọ Nguyên, +5.000 HP tối đa, 100% không đan độc.",
        effect: { lifespan: 200, permanentHp: 5000, toxicity: 0 },
        icon: "fa-sun",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },

    // --- PHÂN LOẠI 5: CUỒNG HÓA & BUFF CHIẾN ĐẤU (BERSERK BUFF) ---
    {
        id: "pill_cuong_huyet_ma_dan",
        name: "Cuồng Huyết Ma Sát Đan",
        type: "Đan Dược",
        rarity: 4,
        count: 1,
        desc: "Kích phát tiềm năng ma đạo, x1.5 sát thương Công Kích trong 60s nhưng tổn hao 20% máu (+18% Đan Độc).",
        effect: { berserkBuff: { duration: 60, atkMult: 1.5, hpDrainPercent: 20 }, toxicity: 18 },
        icon: "fa-skull",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },

    // --- PHÂN LOẠI 6: THANH TÂM & GIẢI ĐAN ĐỘC (PURGE TOXICITY) ---
    {
        id: "pill_tuyet_tinh_thanh_doc",
        name: "Bách Thảo Tuyết Tinh Đan",
        type: "Đan Dược",
        rarity: 3,
        count: 2,
        desc: "Luyện từ tuyết liên vạn trượng, giải trừ 30% Đan Độc tích tụ và tiêu trừ 15 Tâm Ma.",
        effect: { clearToxicity: 30, clearTamMa: 15, toxicity: 0 },
        icon: "fa-shield-virus",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_thanh_tam_tinh_hon",
        name: "Cửu Chuyển Thanh Hồn Đan",
        type: "Đan Dược",
        rarity: 4,
        count: 0,
        desc: "Hóa giải 60% Đan Độc trong kinh mạch, quét sạch 35 điểm Tâm Ma, tâm cảnh an tĩnh.",
        effect: { clearToxicity: 60, clearTamMa: 35, toxicity: 0 },
        icon: "fa-dove",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    },
    {
        id: "pill_vo_cuc_tay_tuy",
        name: "Vô Cực Tẩy Độc Kim Đan",
        type: "Đan Dược",
        rarity: 6,
        count: 0,
        desc: "Thần đan vô giá tẩy sạch 100% Đan Độc, tiêu trừ hoàn toàn Tâm Ma về 0!",
        effect: { clearToxicity: 100, clearTamMa: 100, toxicity: 0 },
        icon: "fa-fire-burner",
        image: "./assets/images/item_qi_pill_bottle.jpg"
    }
];

// =========================================================================
// 3. ĐAN PHƯƠNG & CÔNG THỨC LUYỆN ĐAN (RECIPES_DATA)
// =========================================================================
const RECIPES_DATA = [
    // --- BẬC 1: LINH ĐAN NHẬP MÔN ---
    {
        id: "recipe_quy_nguyen_dan",
        pillId: "pill_quy_nguyen_dan",
        name: "Quy Nguyên Hóa Khí Đan",
        desc: "Hấp thụ linh khí trăng rằm (+300 Tu Vi, +8% Đan Độc).",
        baseChance: 0.85,
        materials: [
            { itemId: "herb_nguyet_hoa_thao", count: 2 },
            { itemId: "water_linh_tuyen", count: 1 }
        ]
    },
    {
        id: "recipe_thanh_huyet_sinh_co",
        pillId: "pill_thanh_huyet_sinh_co",
        name: "Thanh Huyết Sinh Cơ Đan",
        desc: "Trị thương cấp tốc (+1.500 HP, +5% Đan Độc).",
        baseChance: 0.85,
        materials: [
            { itemId: "herb_sinh_co_thao", count: 2 },
            { itemId: "water_linh_tuyen", count: 1 }
        ]
    },
    {
        id: "recipe_tinh_than_hoi_khi",
        pillId: "pill_tinh_than_hoi_khi",
        name: "Tụ Thần Hồi Khí Đan",
        desc: "Bổ dưỡng thần thức (+400 MP Pháp Lực, +4% Đan Độc).",
        baseChance: 0.85,
        materials: [
            { itemId: "herb_tinh_than_hoa", count: 2 },
            { itemId: "herb_nguyet_hoa_thao", count: 1 }
        ]
    },

    // --- BẬC 2: HUYỀN ĐAN TRUNG CẤP ---
    {
        id: "recipe_tam_hoa_tu_dinh",
        pillId: "pill_tam_hoa_tu_dinh",
        name: "Tam Hoa Tụ Đỉnh Đan",
        desc: "Hội tụ tam hoa (+35% Đột Phá, +500 Tu Vi, +12% Đan Độc).",
        baseChance: 0.70,
        materials: [
            { itemId: "herb_tam_diep_lien", count: 3 },
            { itemId: "monster_yeu_dan_nhat_giai", count: 1 }
        ]
    },
    {
        id: "recipe_tuyet_tinh_thanh_doc",
        pillId: "pill_tuyet_tinh_thanh_doc",
        name: "Bách Thảo Tuyết Tinh Đan",
        desc: "Thanh tẩy kinh mạch (-30% Đan Độc, -15 Tâm Ma).",
        baseChance: 0.75,
        materials: [
            { itemId: "herb_tuyet_lien_ngan_nam", count: 2 },
            { itemId: "herb_spirit", count: 2 }
        ]
    },

    // --- BẬC 3: ĐỊA ĐAN CAO CẤP ---
    {
        id: "recipe_tay_tuy_hoan_cot",
        pillId: "pill_tay_tuy_hoan_cot",
        name: "Tẩy Tủy Hoán Cốt Đan",
        desc: "Gột rửa phàm thai (Vĩnh viễn +15 Công, +25 Thủ, +20% Đan Độc).",
        baseChance: 0.60,
        materials: [
            { itemId: "bone_bach_ho_yeu_cot", count: 2 },
            { itemId: "herb_blood", count: 2 },
            { itemId: "water_han_bang_tuyen", count: 1 }
        ]
    },
    {
        id: "recipe_cuong_huyet_ma_dan",
        pillId: "pill_cuong_huyet_ma_dan",
        name: "Cuồng Huyết Ma Sát Đan",
        desc: "Cuồng bạo ma tính (x1.5 Sát thương Công, -20% HP, +18% Đan Độc).",
        baseChance: 0.65,
        materials: [
            { itemId: "monster_yeu_dan_nhi_giai", count: 2 },
            { itemId: "herb_huyet_ma_hoa", count: 3 },
            { itemId: "bone_man_nguu_cot", count: 1 }
        ]
    },
    {
        id: "recipe_thien_dia_nguyen_khi",
        pillId: "pill_thien_dia_nguyen_khi",
        name: "Thiên Địa Nguyên Khí Đan",
        desc: "Thu nạp thiên địa linh khí (+3.500 Tu Vi, +15% Đan Độc).",
        baseChance: 0.60,
        materials: [
            { itemId: "herb_long_huyet_thao", count: 2 },
            { itemId: "herb_tam_diep_lien", count: 2 },
            { itemId: "water_linh_tuyen", count: 1 }
        ]
    },
    {
        id: "recipe_thanh_tam_tinh_hon",
        pillId: "pill_thanh_tam_tinh_hon",
        name: "Cửu Chuyển Thanh Hồn Đan",
        desc: "Đại pháp thanh tẩy (-60% Đan Độc, -35 Tâm Ma).",
        baseChance: 0.65,
        materials: [
            { itemId: "herb_tuyet_lien_ngan_nam", count: 2 },
            { itemId: "herb_bo_de_tam_diep", count: 2 }
        ]
    },

    // --- BẬC 4: THIÊN ĐAN THƯỢNG THỪA ---
    {
        id: "recipe_cuu_chuyen_nguyen_anh",
        pillId: "pill_cuu_chuyen_nguyen_anh",
        name: "Cửu Chuyển Hóa Anh Đan",
        desc: "Hóa Kim Đan thành Nguyên Anh (+45% Vượt Kiếp, +8.000 Tu Vi, +25% Đan Độc).",
        baseChance: 0.50,
        materials: [
            { itemId: "monster_yeu_dan_tam_giai", count: 1 },
            { itemId: "herb_long_huyet_thao", count: 3 },
            { itemId: "water_thien_nhat_chan_thuy", count: 1 }
        ]
    },
    {
        id: "recipe_thao_thien_phuc_sinh",
        pillId: "pill_thao_thien_phuc_sinh",
        name: "Cửu Mệnh Phục Sinh Đan",
        desc: "Niết Bàn dục hỏa (+8.000 HP, +10% Đan Độc).",
        baseChance: 0.55,
        materials: [
            { itemId: "herb_phuong_hoang_moc", count: 2 },
            { itemId: "monster_yeu_dan_tam_giai", count: 2 }
        ]
    },
    {
        id: "recipe_van_tho_truong_sinh",
        pillId: "pill_van_tho_truong_sinh",
        name: "Vạn Thọ Vô Cương Đan",
        desc: "Trường thọ ngàn năm (+60 năm Thọ Nguyên, +500 HP, +8% Đan Độc).",
        baseChance: 0.50,
        materials: [
            { itemId: "herb_dao_tien_ngan_nam", count: 3 },
            { itemId: "water_thien_nhat_chan_thuy", count: 1 }
        ]
    },

    // --- BẬC 5: TIÊN ĐAN CHÍ TÔN NGHỊCH THIÊN ---
    {
        id: "recipe_hon_don_tai_tao",
        pillId: "pill_hon_don_tai_tao",
        name: "Hỗn Độn Tái Tạo Tiên Đan",
        desc: "Tái tạo hỗn độn (Vĩnh viễn +100 Công, +100 Thủ, +2.000 HP, +5% Đan Độc).",
        baseChance: 0.40,
        materials: [
            { itemId: "herb_hon_don_thanh_lien", count: 1 },
            { itemId: "monster_yeu_dan_tu_giai", count: 1 },
            { itemId: "water_thien_nhat_chan_thuy", count: 2 }
        ]
    },
    {
        id: "recipe_hoa_than_phi_thang",
        pillId: "pill_hoa_than_phi_thang",
        name: "Hóa Thần Quy Chân Tiên Đan",
        desc: "Phi thăng Tiên Giới (+60% Vượt Kiếp, +25.000 Tu Vi, +10% Đan Độc).",
        baseChance: 0.35,
        materials: [
            { itemId: "herb_hon_don_thanh_lien", count: 2 },
            { itemId: "monster_yeu_dan_tu_giai", count: 2 },
            { itemId: "bone_chan_long_cot", count: 1 }
        ]
    },
    {
        id: "recipe_dai_lao_bat_tu",
        pillId: "pill_dai_lao_bat_tu",
        name: "Đại La Bất Diệt Đan",
        desc: "Bất diệt trường tồn (+200 năm Thọ Nguyên, +5.000 HP, 0% Đan Độc).",
        baseChance: 0.35,
        materials: [
            { itemId: "herb_dao_tien_ngan_nam", count: 3 },
            { itemId: "herb_phuong_hoang_moc", count: 1 },
            { itemId: "bone_chan_long_cot", count: 1 }
        ]
    },
    {
        id: "recipe_vo_cuc_tay_tuy",
        pillId: "pill_vo_cuc_tay_tuy",
        name: "Vô Cực Tẩy Độc Kim Đan",
        desc: "Tẩy tịnh hoàn toàn (-100% Đan Độc, -100 Tâm Ma).",
        baseChance: 0.45,
        materials: [
            { itemId: "herb_hon_don_thanh_lien", count: 1 },
            { itemId: "herb_bo_de_tam_diep", count: 2 }
        ]
    }
];

// =========================================================================
// 4. DANH MỤC LÒ ĐAN & THIÊN ĐỊA DỊ HỎA (CAULDRONS & FLAMES)
// =========================================================================
const CAULDRONS_DATA = [
    {
        id: "cauldron_thanh_dong",
        name: "Thanh Đồng Cổ Đỉnh",
        rarity: 2,
        successBonus: 0.05,
        toxicityReduction: 0.05,
        desc: "Đỉnh đồng cổ xưa của tán tu hạ giới, tăng 5% tỷ lệ thành công và giảm 5% đan độc.",
        icon: "fa-mortar-pestle"
    },
    {
        id: "cauldron_tu_hu",
        name: "Tử Hư Bát Quái Lô",
        rarity: 4,
        successBonus: 0.15,
        toxicityReduction: 0.15,
        critPillChance: 0.10,
        desc: "Lò bát quái hấp thụ tinh hoa tử khí, tăng 15% tỷ lệ thành công, giảm 15% đan độc, 10% ra Cực Phẩm.",
        icon: "fa-fire-burner"
    },
    {
        id: "cauldron_than_nong",
        name: "Thần Nông Bách Dược Đỉnh",
        rarity: 6,
        successBonus: 0.35,
        toxicityReduction: 0.40,
        critPillChance: 0.30,
        desc: "Thần đỉnh truyền thế của Viễn Cổ Dược Thánh, tăng 35% thành công, giảm 40% đan độc, 30% ra Cực Phẩm Tiên Đan.",
        icon: "fa-gem"
    }
];

const HEAVENLY_FLAMES_DATA = [
    {
        id: "flame_tam_muoi",
        name: "Tam Muội Chân Hỏa",
        rarity: 3,
        speedBonus: 0.20,
        desc: "Ngọn lửa tinh thuần đạo gia, thiêu đốt tạp chất giúp rút ngắn 20% thời gian luyện đan.",
        icon: "fa-fire"
    },
    {
        id: "flame_cot_nhiem_lanh_hoa",
        name: "Cốt Nhiễm Lãnh Hỏa",
        rarity: 5,
        toxicityReduction: 0.30,
        desc: "Dị hỏa sinh ra tại nơi giao thoa cực hàn và cực nhiệt, giảm 30% Đan Độc khi kết đan.",
        icon: "fa-snowflake"
    },
    {
        id: "flame_cuu_long_loi_cuong",
        name: "Cửu Long Lôi Cương Hỏa",
        rarity: 6,
        potencyBonus: 0.40,
        desc: "Lôi Hỏa viễn cổ mang tiếng rồng gầm, gia tăng 40% dược lực của toàn bộ Tiên Đan.",
        icon: "fa-bolt-lightning"
    }
];

// =========================================================================
// XUẤT BẢN DỮ LIỆU TOÀN CỤC AN TOÀN
// =========================================================================
if (typeof window !== 'undefined') {
    window.HERBS_DATA = HERBS_DATA;
    window.PILLS_DATA = PILLS_DATA;
    window.RECIPES_DATA = RECIPES_DATA;
    window.CAULDRONS_DATA = CAULDRONS_DATA;
    window.HEAVENLY_FLAMES_DATA = HEAVENLY_FLAMES_DATA;
}
if (typeof globalThis !== 'undefined') {
    globalThis.HERBS_DATA = HERBS_DATA;
    globalThis.PILLS_DATA = PILLS_DATA;
    globalThis.RECIPES_DATA = RECIPES_DATA;
    globalThis.CAULDRONS_DATA = CAULDRONS_DATA;
    globalThis.HEAVENLY_FLAMES_DATA = HEAVENLY_FLAMES_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HERBS_DATA,
        PILLS_DATA,
        RECIPES_DATA,
        CAULDRONS_DATA,
        HEAVENLY_FLAMES_DATA
    };
}
