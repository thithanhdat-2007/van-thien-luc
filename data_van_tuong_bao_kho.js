/**
 * ============================================================================
 * VẠN TƯỢNG BẢO KHỐ (ENDLESS DATA & ASSET REPOSITORY)
 * Hệ Thống Dữ Liệu Công Pháp, Thần Binh, Bảo Vật & Đan Dược Bổ Sung
 * ============================================================================
 */

// BATCH 01: 30 CÔNG PHÁP VÀ TRANG BỊ MỚI
const NEW_SKILLS_BATCH_01 = [
    {
        id: "skill_pham_thoc_kiem",
        name: "Thô Thiết Kiếm Pháp",
        type: "KiemQuyet",
        rarity: "Phàm",
        element: "Kim",
        image: "https://placehold.co/80x80/e2e8f0/0f172a?text=Kiếm",
        stats: { attack: 45, accuracy: 5 },
        desc: "Kiếm pháp vỡ lòng của tán tu thế tục, chiêu thức mộc mạc hữu hiệu.",
        price: 200
    },
    {
        id: "skill_pham_thuy_khinh_cong",
        name: "Đạp Thủy Bộ",
        type: "ThanPhap",
        rarity: "Phàm",
        element: "Thủy",
        image: "https://placehold.co/80x80/e2e8f0/0f172a?text=Bộ",
        stats: { speed: 30, dodge: 3 },
        desc: "Thân pháp lướt trên mặt nước như chim én lượn sóng.",
        price: 280
    },
    {
        id: "skill_linh_liet_hoa_quyet",
        name: "Liệt Hỏa Quyết",
        type: "TamPhap",
        rarity: "Linh",
        element: "Hỏa",
        image: "https://placehold.co/80x80/166534/ffffff?text=Hỏa",
        stats: { attack: 160, crit_rate: 3 },
        desc: "Tâm pháp hỏa hệ sơ giai, tụ nhiệt khí thiên địa hóa thành ngọn lửa cuộn trào.",
        price: 1500
    },
    {
        id: "skill_linh_moc_linh_ho_the",
        name: "Mộc Linh Hộ Thể",
        type: "CongPhap",
        rarity: "Linh",
        element: "Mộc",
        image: "https://placehold.co/80x80/166534/ffffff?text=Mộc",
        stats: { hp: 450, defense: 65 },
        desc: "Dẫn mộc linh sinh cơ bao bọc kinh mạch, tăng cường sức bền và phòng ngự.",
        price: 1800
    },
    {
        id: "skill_linh_kim_quang_thuat",
        name: "Kim Quang Trảm",
        type: "ThanThong",
        rarity: "Linh",
        element: "Kim",
        image: "https://placehold.co/80x80/166534/ffffff?text=Kim",
        stats: { attack: 220, armor_penetration: 15 },
        desc: "Ngưng tụ kim mang chém rách hộ thể cương khí của yêu thú sơ giai.",
        price: 2100
    },
    {
        id: "skill_huyen_bang_phach_kiem",
        name: "Băng Phách Kiếm Khí",
        type: "KiemQuyet",
        rarity: "Huyền",
        element: "Băng",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=Băng",
        stats: { attack: 580, slow_effect: 25 },
        desc: "Kiếm khí thấu hàn phong toái linh, khiến huyết dịch kẻ địch ngưng trệ.",
        price: 8500
    },
    {
        id: "skill_huyen_cuu_u_am_sat",
        name: "Cửu U Ám Sát Bộ",
        type: "ThanPhap",
        rarity: "Huyền",
        element: "Âm",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=U+Bộ",
        stats: { speed: 120, dodge: 12, crit_damage: 20 },
        desc: "Ẩn mình trong u ảnh bóng tối, xuất hiện chớp nhoáng đoạn tuyệt sinh cơ.",
        price: 9800
    },
    {
        id: "skill_huyen_lac_loi_tam_kinh",
        name: "Lạc Lôi Tâm Kinh",
        type: "TamPhap",
        rarity: "Huyền",
        element: "Lôi",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=Lôi",
        stats: { attack: 720, crit_rate: 8, mp: 600 },
        desc: "Dẫn cuồng lôi rèn luyện đan điền, linh lực phát ra mang uy áp sấm sét.",
        price: 12500
    },
    {
        id: "skill_dia_hac_long_phan_hai",
        name: "Hắc Long Phần Hải Điển",
        type: "ThanThong",
        rarity: "Địa",
        element: "Hỏa",
        image: "https://placehold.co/80x80/581c87/ffffff?text=Hắc+Long",
        stats: { attack: 2400, burn_damage: 350, aoe_radius: 15 },
        desc: "Tuyệt kỹ thượng thừa triệu hoán liệt hỏa cuộn trào tựa hắc long thiêu đốt cửu châu.",
        price: 48000
    },
    {
        id: "skill_dia_huyen_thien_phong_vu",
        name: "Huyền Thiên Phong Vũ",
        type: "ThanThong",
        rarity: "Địa",
        element: "Phong",
        image: "https://placehold.co/80x80/581c87/ffffff?text=Phong",
        stats: { speed: 280, dodge: 22, attack: 1800 },
        desc: "Hóa thân vào ngàn trận cuồng phong, sát tiễn vô hình xuyên phá ngàn dặm.",
        price: 52000
    },
    {
        id: "skill_dia_bat_nha_kim_cang",
        name: "Bát Nhã Kim Cang Thân",
        type: "CongPhap",
        rarity: "Địa",
        element: "Thổ",
        image: "https://placehold.co/80x80/581c87/ffffff?text=Kim+Cang",
        stats: { hp: 8500, defense: 950, damage_reduction: 18 },
        desc: "Thần thông luyện thể thượng cổ, đao kiếm khó thương, bách độc bất xâm.",
        price: 65000
    },
    {
        id: "skill_thien_thai_at_kiem_tran",
        name: "Thái Ất Kiếm Trận Kinh",
        type: "KiemQuyet",
        rarity: "Thiên",
        element: "Kim",
        image: "https://placehold.co/80x80/ca8a04/000000?text=Thái+Ất",
        stats: { attack: 9800, crit_rate: 22, crit_damage: 65 },
        desc: "Ngự cửu vạn thanh kiếm quang lập thành tuyệt trận Thái Ất, diệt sát vạn tà ma đạo.",
        price: 280000
    },
    {
        id: "skill_thien_cuu_chuyen_dan_tam",
        name: "Cửu Chuyển Đan Tâm Quyết",
        type: "TamPhap",
        rarity: "Thiên",
        element: "Mộc",
        image: "https://placehold.co/80x80/ca8a04/000000?text=Cửu+Đan",
        stats: { hp: 32000, mp: 18000, auto_recovery: 8 },
        desc: "Tâm pháp chí cao dưỡng thần định phách, chuyển hóa sinh cơ liên miên bất tuyệt.",
        price: 320000
    },
    {
        id: "skill_tien_hon_don_quy_nguyen",
        name: "Hỗn Độn Quy Nguyên Công",
        type: "TamPhap",
        rarity: "Tiên",
        element: "Hỗn Độn",
        image: "https://placehold.co/80x80/991b1b/ffffff?text=Hỗn+Độn",
        stats: { attack: 45000, hp: 120000, defense: 5800, all_attributes: 25 },
        desc: "Bí pháp khởi nguyên từ thời thiên địa chưa phân tách, dung nạp vạn pháp càn khôn.",
        price: 1500000
    },
    {
        id_skill: "skill_tien_van_kiep_loi_to",
        id: "skill_tien_van_kiep_loi_to",
        name: "Vạn Kiếp Thần Lôi Tổ Điển",
        type: "ThanThong",
        rarity: "Tiên",
        element: "Lôi",
        image: "https://placehold.co/80x80/991b1b/ffffff?text=Lôi+Tổ",
        stats: { attack: 68000, true_damage: 12000, shock_duration: 5 },
        desc: "Chưởng khống cửu thiên kiếp lôi, một kích giáng xuống vạn kiếp bất phục.",
        price: 2200000
    }
];

const NEW_ITEMS_BATCH_01 = [
    {
        id: "item_pham_thanh_phong_kiem",
        name: "Thanh Phong Kiếm",
        type: "VuKhi",
        rarity: "Phàm",
        image: "https://placehold.co/80x80/e2e8f0/0f172a?text=Thanh+Kiếm",
        stats: { attack: 55, speed: 8 },
        desc: "Đoản kiếm rèn bằng bách luyện thanh thiết, nhẹ nhàng sắc bén.",
        price: 250
    },
    {
        id: "item_pham_bach_linh_y",
        name: "Bạch Luyện Đạo Bào",
        type: "Giap",
        rarity: "Phàm",
        image: "https://placehold.co/80x80/e2e8f0/0f172a?text=Đạo+Bào",
        stats: { defense: 35, hp: 180 },
        desc: "Đạo bào phổ thông dệt bằng linh tàm ti cấp thấp, giữ ấm trừ bụi.",
        price: 320
    },
    {
        id: "item_linh_xich_dong_tram",
        name: "Xích Đồng Trảm Yêu Đao",
        type: "VuKhi",
        rarity: "Linh",
        image: "https://placehold.co/80x80/166534/ffffff?text=Xích+Đao",
        stats: { attack: 280, beast_damage: 15 },
        desc: "Đao đúc bằng xích đồng dung nham, lưỡi đao có sát khí khắc chế yêu ma.",
        price: 2200
    },
    {
        id: "item_linh_ho_tam_phu",
        name: "Thanh Mộc Hộ Tâm Phù",
        type: "PhapBao",
        rarity: "Linh",
        image: "https://placehold.co/80x80/166534/ffffff?text=Mộc+Phù",
        stats: { hp: 800, shield_block: 120 },
        desc: "Lá bùa từ gỗ ngàn năm tế luyện, tự động phát huy khi tu sĩ gặp nguy cơ chí mạng.",
        price: 2600
    },
    {
        id: "item_linh_tu_khi_hoan",
        name: "Tụ Khí Ngưng Thần Hoàn",
        type: "DanDuoc",
        rarity: "Linh",
        image: "https://placehold.co/80x80/166534/ffffff?text=Tụ+Khí",
        stats: { instant_mp: 600, exp_bonus: 5 },
        desc: "Đan dược ngưng tụ tinh hoa thảo mộc giúp tăng nhanh tốc độ thổ nạp nguyên khí.",
        price: 1200
    },
    {
        id: "item_huyen_han_bang_bao_y",
        name: "Hàn Băng Tàm Ti Y",
        type: "Giap",
        rarity: "Huyền",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=Băng+Y",
        stats: { defense: 380, hp: 2600, ice_resistance: 30 },
        desc: "Dệt từ tơ của Băng Tằm vạn trượng dưới hàn đàm tuyết sơn, băng hỏa bất xâm.",
        price: 11000
    },
    {
        id: "item_huyen_tu_loi_chieu_hon_linh",
        name: "Tử Lôi Nhiếp Hồn Linh",
        type: "PhapBao",
        rarity: "Huyền",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=Lôi+Linh",
        stats: { attack: 650, stun_rate: 8 },
        desc: "Chuông đồng chứa lôi hạch, rung lên làm chấn nhiếp hồn phách đối phương.",
        price: 14500
    },
    {
        id: "item_huyen_dia_mach_linh_nhu",
        name: "Địa Mạch Linh Nhũ",
        type: "DanDuoc",
        rarity: "Huyền",
        image: "https://placehold.co/80x80/1e3a8a/ffffff?text=Linh+Nhũ",
        stats: { breakthrough_luck: 15, permanent_hp: 500 },
        desc: "Linh dịch tích tụ vạn năm nơi mạch ngầm long mạch, gột rửa kinh mạch tẩy tủy.",
        price: 18000
    },
    {
        id: "item_dia_long_lan_trong_giap",
        name: "Xích Long Lân Giáp",
        type: "Giap",
        rarity: "Địa",
        image: "https://placehold.co/80x80/581c87/ffffff?text=Long+Giáp",
        stats: { defense: 1450, hp: 12500, fire_immune: 50 },
        desc: "Giáp nặng đúc từ vảy của Xích Viêm Chân Long, tỏa hỏa diễm hộ chủ bất diệt.",
        price: 72000
    },
    {
        id: "item_dia_u_minh_tru_tien_kiem",
        name: "U Minh Trảm Phách Kiếm",
        type: "VuKhi",
        rarity: "Địa",
        image: "https://placehold.co/80x80/581c87/ffffff?text=U+Kiếm",
        stats: { attack: 3600, lifesteal: 12, crit_damage: 35 },
        desc: "Cổ kiếm tôi luyện bằng hoàng tuyền u hỏa, hút phách trảm linh khi đắc thủ.",
        price: 88000
    },
    {
        id: "item_dia_cuu_khieu_kim_dan",
        name: "Cửu Khiếu Hóa Anh Đan",
        type: "DanDuoc",
        rarity: "Địa",
        image: "https://placehold.co/80x80/581c87/ffffff?text=Cửu+Anh",
        stats: { breakthrough_guarantee: 25, exp_grant: 150000 },
        desc: "Đan dược cửu phẩm trợ giúp Kim Đan toái anh, ngưng kết Nguyên Anh đại đạo.",
        price: 95000
    },
    {
        id: "item_thien_thai_hu_nhan",
        name: "Thái Hư Hỗn Độn Giới",
        type: "GioiChi",
        rarity: "Thiên",
        image: "https://placehold.co/80x80/ca8a04/000000?text=Thái+Hư",
        stats: { bag_slots: 200, cooldown_reduction: 15, speed: 350 },
        desc: "Nhẫn trữ vật chứa một phương tiểu thế giới độc lập, ẩn chứa pháp tắc hư không.",
        price: 450000
    },
    {
        id: "item_thien_phuong_hoang_chan_vu",
        name: "Phượng Hoàng Niết Bàn Vũ",
        type: "PhapBao",
        rarity: "Thiên",
        image: "https://placehold.co/80x80/ca8a04/000000?text=Phượng+Vũ",
        stats: { revive_chance: 100, hp_revive_percent: 50, all_damage: 30 },
        desc: "Chân vũ do Thần Hoàng niết bàn lưu lại, ban cho tu sĩ cơ hội hồi sinh từ tro tàn.",
        price: 680000
    },
    {
        id: "item_tien_tru_tien_co_kiem",
        name: "Trảm Tiên Tru Ma Cổ Kiếm",
        type: "VuKhi",
        rarity: "Tiên",
        image: "https://placehold.co/80x80/991b1b/ffffff?text=Trảm+Tiên",
        stats: { attack: 85000, armor_ignore: 80, instant_kill_low_mobs: 15 },
        desc: "Thanh kiếm tiên cổ phong ấn sát khí vô tận, xuất vỏ tất hữu thiên địa biến sắc.",
        price: 3500000
    },
    {
        id: "item_tien_bat_hoang_than_dinh",
        name: "Bát Hoang Cửu Long Đỉnh",
        type: "PhapBao",
        rarity: "Tiên",
        image: "https://placehold.co/80x80/991b1b/ffffff?text=Thần+Đỉnh",
        stats: { defense: 18000, hp: 350000, alchemy_success_rate: 100 },
        desc: "Đỉnh luyện đan trấn quốc của thượng cổ đế hoàng, luyện đan vô khuyết, áp chế bát phương.",
        price: 4800000
    }
];

// Xuất kho vào hệ thống toàn cục nếu có môi trường window/browser
if (typeof window !== "undefined") {
    window.VAN_TUONG_BAO_KHO = window.VAN_TUONG_BAO_KHO || { skills: [], items: [] };
    window.VAN_TUONG_BAO_KHO.skills.push(...NEW_SKILLS_BATCH_01);
    window.VAN_TUONG_BAO_KHO.items.push(...NEW_ITEMS_BATCH_01);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        NEW_SKILLS_BATCH_01,
        NEW_ITEMS_BATCH_01
    };
}
