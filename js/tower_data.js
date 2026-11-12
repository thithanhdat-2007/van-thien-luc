/** Dữ liệu tháp độc lập. Xem TOWER_EDITING.md trước khi chỉnh.
 * Giữ id công pháp/vật phẩm ổn định. Thêm vfxType cần bộ phát trong engine.
 * Game chính dùng js/data.js; cầu nối save/chỉ số nằm trong js/features/demon_tower.js.
 */
// Điều kiện vận hành đang dùng. Giữ nguyên giá trị mặc định khi tái cấu trúc.
// turnDurationMs tính bằng mili giây. enrageHpRatio nằm trong khoảng 0–1.
// FPS là trần vẽ, không phải tốc độ gameplay. Thay đổi cần kiểm tra hiệu ứng.
const TOWER_RULES = Object.freeze({
    targetFps: 60,
    turnDurationMs: 2000,
    minimumTurnDurationMs: 800,
    forgeSwordCost: 100000,
    enrageHpRatio: 0.35,
    bellShieldTurns: 4,
    domainTurns: 5
});

        const ELEMENTS = {
            Kim: { name: "Kim Kiếm Ý", icon: "⚔️", color: "#fde047", glow: "#f59e0b", counters: "Moc", desc: "Sắc bén tuyệt đối, khắc chế Mộc Yêu" },
            Moc: { name: "Mộc Kiếm Ý", icon: "🌿", color: "#6ee7b7", glow: "#10b981", counters: "Thuy", desc: "Sinh cơ bất tuyệt, khắc chế Thủy Yêu" },
            Thuy: { name: "Thủy Kiếm Ý", icon: "❄️", color: "#7dd3fc", glow: "#06b6d4", counters: "Hoa", desc: "Hàn băng thấu cốt, khắc chế Hỏa Yêu" },
            Hoa: { name: "Hỏa Kiếm Ý", icon: "🔥", color: "#fda4af", glow: "#e11d48", counters: "Loi", desc: "Phần thiên liệt diễm, khắc chế Lôi Yêu" },
            Loi: { name: "Lôi Kiếm Ý", icon: "🌩️", color: "#d8b4fe", glow: "#9333ea", counters: "Kim", desc: "Thiên phạt thần lôi, khắc chế Kim Yêu" }
        };
        const ELEMENT_KEYS = Object.keys(ELEMENTS);

        /**
         * 2. HỆ THỐNG BÁT ĐẠI ĐẠO THỐNG CÔNG PHÁP & 24 TUYỆT KỸ THẦN THÔNG CHUẨN THẾ GIỚI TU TIÊN
         * Mỗi Công Pháp thuộc 1 Đạo Đồ (Kiếm Đạo, Lôi Đạo, Dị Hỏa Đạo, Hàn Băng Đạo, Âm Dương Đại Đạo, Ma Đạo, Thể Tu Phật Đạo, Tinh Thần Đạo)
         * và sở hữu 3 Thức:
         * - Thức 1 (Tiểu Thần Thông - Tự động xuất chiêu 35% mỗi hiệp hoặc bấm tay)
         * - Thức 2 (Đại Thần Thông - Tự động xuất chiêu 25% mỗi hiệp hoặc bấm tay)
         * - Thức 3 (Tuyệt Thế Tiên Thuật / Cấm Thuật - Bùng nổ khi đầy 100 Kiếm Nguyên hoặc bấm tay)
         */
        const CULTIVATION_MANUALS = [
            {
                id: "thanh_lien_kiem_dien",
                name: "《Thanh Liên Kiếm Điển》",
                shortName: "Thanh Liên Kiếm",
                tier: "Tiên Phẩm Kiếm Đạo",
                rarity: "Tien",
                element: "Kim",
                icon: "🗡️",
                passiveDesc: "Kiếm Tâm Thông Minh: +25% Bạo Thương & +4 Phi Kiếm Hộ Thể",
                skills: [
                    {
                        id: 0,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Thanh Liên Kiếm Khí",
                        subtitle: "THẬP NHỊ PHẨM KIẾM LIÊN • TỰ SINH BẤT DIỆT",
                        icon: "🪷",
                        desc: "Ngưng tụ 12 cánh hoa sen kiếm khí sắc lẹm xoay tít cắt nát hộ thể của Yêu Vương (190% Kiếm Công).",
                        mult: 1.9,
                        toughnessBreak: 25,
                        color: "#fde047",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#06b6d4",
                        sealChar: "劍蓮",
                        vfxType: "swordrain"
                    },
                    {
                        id: 1,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Vạn Kiếm Quy Tông",
                        subtitle: "THÁI ẤT KIM QUANG • VẠN KIẾM TỀ PHI",
                        icon: "🐉",
                        desc: "Hàng vạn đạo Thái Ất Kim Kiếm từ hư không trút xuống như mưa sao băng, hồi 18% Khí Huyết (310% Kiếm Công).",
                        mult: 3.1,
                        healRatio: 0.18,
                        toughnessBreak: 45,
                        color: "#fbbf24",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#ea580c",
                        sealChar: "萬劍",
                        vfxType: "swordrain"
                    },
                    {
                        id: 2,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Nhất Kiếm Khai Thiên Môn",
                        subtitle: "TIÊN GIỚI THẦN PHẠT • TRẢM ĐỨT CỔ KIM",
                        icon: "🌌",
                        desc: "Cấm thuật Kiếm Đạo tối thượng! Xẻ đôi bầu trời, triệu hồi Nam Thiên Môn giáng đòn hủy diệt 460% Kiếm Công!",
                        mult: 4.6,
                        toughnessBreak: 80,
                        color: "#e879f9",
                        boltColor1: "#ffffff",
                        boltColor2: "#d946ef",
                        boltColor3: "#38bdf8",
                        sealChar: "開天",
                        vfxType: "heavensplit"
                    }
                ]
            },
            {
                id: "tu_tieu_loi_kinh",
                name: "《Tử Tiêu Thần Lôi Chân Kinh》",
                shortName: "Tử Tiêu Lôi Kinh",
                tier: "Thiên Giai Cực Phẩm • Lôi Đạo",
                rarity: "Thien",
                element: "Loi",
                icon: "🌩️",
                passiveDesc: "Thiên Phạt Đại Đạo: Đòn đánh kèm Lôi Điện phá +35% Yêu Cang của Boss",
                skills: [
                    {
                        id: 3,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Ngũ Lôi Chính Pháp",
                        subtitle: "CỬU THIÊN ĐẠO LÔI • TÀ MA PHỤC TRƯNG",
                        icon: "⚡",
                        desc: "Triệu hồi 5 đạo Thiên Lôi Ngũ Hành liên tiếp đánh thẳng vào thiên linh cái của Yêu Vương (210% Kiếm Công).",
                        mult: 2.1,
                        toughnessBreak: 38,
                        color: "#c084fc",
                        boltColor1: "#ffffff",
                        boltColor2: "#a855f7",
                        boltColor3: "#6366f1",
                        sealChar: "五雷",
                        vfxType: "thunder"
                    },
                    {
                        id: 4,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Cửu Thiên Lôi Long Khiếu",
                        subtitle: "LÔI ĐẾ CHÂN HÌNH • THẦN LONG GIÁNG THẾ",
                        icon: "🐲",
                        desc: "Hóa Lôi Điện thành Thái Cổ Lôi Long dài trăm trượng cắn nát thần hồn Yêu Vương (330% Kiếm Công).",
                        mult: 3.3,
                        toughnessBreak: 55,
                        color: "#a855f7",
                        boltColor1: "#ffffff",
                        boltColor2: "#9333ea",
                        boltColor3: "#38bdf8",
                        sealChar: "雷龍",
                        vfxType: "thunder"
                    },
                    {
                        id: 5,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Tử Tiêu Thần Lôi Diệt Thế Kiếp",
                        subtitle: "HỒNG MÔNG THIÊN PHẠT • THẬP CỬU CHÂU LÔI",
                        icon: "🌩️",
                        desc: "Kéo mây đen Lôi Trì bao phủ toàn tháp, giáng Cự Kiếm Thần Lôi hủy thiên diệt địa (440% Kiếm Công + Phá Cang).",
                        mult: 4.4,
                        toughnessBreak: 85,
                        color: "#d8b4fe",
                        boltColor1: "#ffffff",
                        boltColor2: "#a855f7",
                        boltColor3: "#ec4899",
                        sealChar: "雷滅",
                        vfxType: "thunder"
                    }
                ]
            },
            {
                id: "phan_quyet_di_hoa",
                name: "《Phần Quyết • Dị Hỏa Bảng》",
                shortName: "Phần Quyết Dị Hỏa",
                tier: "Tiên Phẩm Hỏa Đạo",
                rarity: "Tien",
                element: "Hoa",
                icon: "🔥",
                passiveDesc: "Thôn Phệ Dị Hỏa: Thiêu đốt vạn vật, tăng +30% Sát Thương Hỏa Hệ",
                skills: [
                    {
                        id: 6,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Đế Viêm Liệt Thiên Chưởng",
                        subtitle: "CỐT LINH LÃNH HỎA • BÁT CỰC BĂNG VIÊM",
                        icon: "☄️",
                        desc: "Chưởng lực mang theo Dị Hỏa tạo thành cột lửa xoáy xuyên thủng lồng ngực Yêu Vương (215% Kiếm Công).",
                        mult: 2.15,
                        toughnessBreak: 30,
                        color: "#fb7185",
                        boltColor1: "#ffffff",
                        boltColor2: "#f43f5e",
                        boltColor3: "#f59e0b",
                        sealChar: "帝炎",
                        vfxType: "phoenix"
                    },
                    {
                        id: 7,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Chu Tước Phần Thiên Dực",
                        subtitle: "THÁI CỔ THẦN CẦM • LIỆT DIỄM BẤT TỬ",
                        icon: "🦅",
                        desc: "Triệu hồi Chân Linh Chu Tước sải cánh lửa vạn dặm lao xuyên qua trận địa địch (350% Kiếm Công).",
                        mult: 3.5,
                        toughnessBreak: 50,
                        color: "#f43f5e",
                        boltColor1: "#ffffff",
                        boltColor2: "#e11d48",
                        boltColor3: "#fbbf24",
                        sealChar: "朱雀",
                        vfxType: "phoenix"
                    },
                    {
                        id: 8,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Phật Nộ Hỏa Liên (Tam Sắc Dị Hỏa)",
                        subtitle: "DỊ HỎA DUNG HỢP • HỦY THIÊN DIỆT ĐỊA",
                        icon: "🌺",
                        desc: "Dung hợp Thanh Liên Địa Tâm Hỏa, Vẫn Lạc Tâm Viêm & Tịnh Liên Yêu Hỏa thành Hỏa Liên phát nổ siêu tân tinh (480% Công)!",
                        mult: 4.8,
                        toughnessBreak: 75,
                        color: "#fb923c",
                        boltColor1: "#ffffff",
                        boltColor2: "#f43f5e",
                        boltColor3: "#10b981",
                        sealChar: "火蓮",
                        vfxType: "firelotus"
                    }
                ]
            },
            {
                id: "thai_hu_huyen_bang",
                name: "《Thái Hư Huyền Băng Lục》",
                shortName: "Huyền Băng Lục",
                tier: "Thiên Giai • Hàn Băng Đạo",
                rarity: "Huyen",
                element: "Thuy",
                icon: "❄️",
                passiveDesc: "Băng Tâm Tuyết Phách: Tăng +15% Thân Pháp Né Tránh & làm chậm Yêu Vương",
                skills: [
                    {
                        id: 9,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Hàn Băng Tinh Thứ",
                        subtitle: "BẮC MINH HÀN KHÍ • VẠN TIỄN XUYÊN TÂM",
                        icon: "🧊",
                        desc: "Ngưng kết hàng trăm mũi giáo băng sắc bén bắn xuyên hộ giáp Yêu Vương (195% Kiếm Công).",
                        mult: 1.95,
                        toughnessBreak: 28,
                        color: "#38bdf8",
                        boltColor1: "#ffffff",
                        boltColor2: "#0284c7",
                        boltColor3: "#67e8f9",
                        sealChar: "寒冰",
                        vfxType: "icepillar"
                    },
                    {
                        id: 10,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Tuyệt Thế Băng Liên Kiếm",
                        subtitle: "THÁI HƯ HÀN BĂNG • VẠN VẬT ĐÓNG BĂNG",
                        icon: "❄️",
                        desc: "Nở rộ Băng Liên Hoa vạn trượng đóng băng hư không, trảm 320% Kiếm Công và hồi 15% Khí Huyết.",
                        mult: 3.2,
                        healRatio: 0.15,
                        toughnessBreak: 45,
                        color: "#7dd3fc",
                        boltColor1: "#ffffff",
                        boltColor2: "#38bdf8",
                        boltColor3: "#0284c7",
                        sealChar: "冰蓮",
                        vfxType: "icepillar"
                    },
                    {
                        id: 11,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Vĩnh Hằng Băng Phong Thế Giới",
                        subtitle: "TUYỆT ĐỐI ĐỘ KHÔNG • THỜI KHÔNG ĐÓNG BĂNG",
                        icon: "🏔️",
                        desc: "Triệu hồi 12 Cột Băng Tinh Thái Cổ trồi lên từ mặt đất giam cầm và nghiền nát Yêu Vương (430% Kiếm Công)!",
                        mult: 4.3,
                        toughnessBreak: 70,
                        color: "#67e8f9",
                        boltColor1: "#ffffff",
                        boltColor2: "#06b6d4",
                        boltColor3: "#3b82f6",
                        sealChar: "冰封",
                        vfxType: "icepillar"
                    }
                ]
            },
            {
                id: "thai_thuong_am_duong",
                name: "《Thái Thượng Hỗn Độn Âm Dương Kinh》",
                shortName: "Hỗn Độn Âm Dương",
                tier: "Tiên Phẩm • Đại Đạo Pháp Tắc",
                rarity: "Tien",
                element: "Moc",
                icon: "☯️",
                passiveDesc: "Hỗn Độn Sinh Diệt: Chuyển hóa 20% sát thương thành Khí Huyết bản thân",
                skills: [
                    {
                        id: 12,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Lưỡng Nghi Sinh Diệt Kiếm",
                        subtitle: "ÂM DƯƠNG NGHỊCH LUÂN • CÀN KHÔN ĐẢO CHUYỂN",
                        icon: "☯️",
                        desc: "Hai luồng Hắc Bạch Kiếm Khí xoắn ốc vào nhau xé toạc phòng ngự của Yêu Vương (205% Kiếm Công).",
                        mult: 2.05,
                        toughnessBreak: 32,
                        color: "#34d399",
                        boltColor1: "#ffffff",
                        boltColor2: "#10b981",
                        boltColor3: "#f59e0b",
                        sealChar: "兩儀",
                        vfxType: "taiji"
                    },
                    {
                        id: 13,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Thái Cực Hỗn Độn Diệt Thế Luân",
                        subtitle: "HỖN ĐỘN ÂM DƯƠNG • NGHIỀN NÁT CÀN KHÔN",
                        icon: "🎡",
                        desc: "Phóng Cối Xay Thái Cực Âm Dương nghiền nát 65% Yêu Cang của Boss, gây 360% Công và hồi 18% HP!",
                        mult: 3.6,
                        healRatio: 0.18,
                        toughnessBreak: 65,
                        color: "#10b981",
                        boltColor1: "#ffffff",
                        boltColor2: "#10b981",
                        boltColor3: "#f59e0b",
                        sealChar: "太極",
                        vfxType: "taiji"
                    },
                    {
                        id: 14,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Đại Hoang Phiên Thiên Thủ Ấn",
                        subtitle: "CHƯỞNG PHỦ THƯƠNG KHUNG • CHẤN ÁP VẠN CỔ",
                        icon: "🖐️",
                        desc: "Ngưng tụ Bàn Tay Tiên Đạo khổng lồ che khuất bầu trời, từ chín tầng mây vỗ thẳng xuống đè bẹp Yêu Vương (470% Công)!",
                        mult: 4.7,
                        toughnessBreak: 90,
                        color: "#fbbf24",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#10b981",
                        sealChar: "翻天",
                        vfxType: "giantpalm"
                    }
                ]
            },
            {
                id: "thon_thien_ma_cong",
                name: "《Thôn Thiên Ma Công • Huyết Hải Kinh》",
                shortName: "Thôn Thiên Ma Công",
                tier: "Tiên Phẩm Ma Đạo • Cấm Thuật",
                rarity: "Tien",
                element: "Hoa",
                icon: "🩸",
                passiveDesc: "Thôn Phệ Bản Nguyên: Hút 30% Sinh Mệnh và Linh Lực của mục tiêu mỗi khi Bạo Kích",
                skills: [
                    {
                        id: 15,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Vạn Hồn Phệ Thể Quyết",
                        subtitle: "BÁCH QUỶ DẠ HÀNH • THÔN HỒN ĐOẠT PHÁCH",
                        icon: "💀",
                        desc: "Phóng thích hàng vạn oán hồn từ Vạn Hồn Phiên lao vào cắn xé và hút máu Yêu Vương (210% Công + Hồi 12% HP).",
                        mult: 2.1,
                        healRatio: 0.12,
                        toughnessBreak: 30,
                        color: "#f43f5e",
                        boltColor1: "#fda4af",
                        boltColor2: "#e11d48",
                        boltColor3: "#7e22ce",
                        sealChar: "噬魂",
                        vfxType: "blackhole"
                    },
                    {
                        id: 16,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Minh Hà Huyết Hải Đại Trận",
                        subtitle: "HUYẾT HẢI BẤT KHÔ • MINH HÀ BẤT TỬ",
                        icon: "🩸",
                        desc: "Mở ra Tu La Huyết Hải nhấn chìm Yêu Vương, gây 345% Kiếm Công và hấp thu 25% Khí Huyết!",
                        mult: 3.45,
                        healRatio: 0.25,
                        toughnessBreak: 50,
                        color: "#e11d48",
                        boltColor1: "#ffffff",
                        boltColor2: "#be123c",
                        boltColor3: "#9333ea",
                        sealChar: "血海",
                        vfxType: "blackhole"
                    },
                    {
                        id: 17,
                        stance: "Thức 3 • Tuyệt Thế Ma Thuật",
                        name: "Thôn Thiên Hắc Động • Vạn Hóa Quy Khư",
                        subtitle: "THÔN THIÊN PHỆ ĐỊA • VẠN VẬT HÓA HƯ VÔ",
                        icon: "🕳️",
                        desc: "Triệu hồi Hắc Động Thôn Thiên nuốt chửng ánh sáng và không gian, nghiền vụn Yêu Vương (485% Công + Hút 30% HP)!",
                        mult: 4.85,
                        healRatio: 0.30,
                        toughnessBreak: 85,
                        color: "#a855f7",
                        boltColor1: "#fda4af",
                        boltColor2: "#9333ea",
                        boltColor3: "#e11d48",
                        sealChar: "吞天",
                        vfxType: "blackhole"
                    }
                ]
            },
            {
                id: "bat_diet_kim_than",
                name: "《Cửu Chuyển Bất Diệt Kim Thân Quyết》",
                shortName: "Bất Diệt Kim Thân",
                tier: "Thiên Giai Cực Phẩm • Phật Đạo Thể Tu",
                rarity: "Thien",
                element: "Kim",
                icon: "卍",
                passiveDesc: "Kim Cương Bất Hoại: Tăng +40% Phòng Thủ và Phản Chấn sát thương",
                skills: [
                    {
                        id: 18,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Đại Nhật Như Lai Kim Cương Quyền",
                        subtitle: "NHẤT QUYỀN PHÁ VẠN PHÁP • KIM QUANG PHỔ CHIẾU",
                        icon: "👊",
                        desc: "Đấm ra một quyền Kim Cương rực sáng như mặt trời đập nát hộ thuẫn Yêu Vương (220% Công).",
                        mult: 2.2,
                        toughnessBreak: 45,
                        color: "#fde047",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#d97706",
                        sealChar: "金剛",
                        vfxType: "buddha"
                    },
                    {
                        id: 19,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Lục Tự Đại Minh Chú • Phục Ma Ấn",
                        subtitle: "ÁN MA NI BÁT MÊ HỒNG • TRẤN ÁP VẠN TÀ",
                        icon: "🔔",
                        desc: "Phóng Ấn Chữ Vạn 卍 khổng lồ bằng vàng ròng trấn áp Yêu Vương, gây 350% Công và kích hoạt Kim Chung hộ thể!",
                        mult: 3.5,
                        toughnessBreak: 65,
                        color: "#fbbf24",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#fef08a",
                        sealChar: "卍鎮",
                        vfxType: "buddha"
                    },
                    {
                        id: 20,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Vạn Phật Triều Tông • Như Lai Thần Chưởng",
                        subtitle: "PHẬT QUANG PHỔ CHIẾU • VẠN MA QUY TÔNG",
                        icon: "🙏",
                        desc: "Pháp Tướng Kim Thân vạn trượng giáng Chưởng Ấn Chữ Vạn 卍 kèm Cột Kim Quang thanh tẩy toàn bộ Yêu Tháp (465% Công)!",
                        mult: 4.65,
                        healRatio: 0.20,
                        toughnessBreak: 95,
                        color: "#fef08a",
                        boltColor1: "#ffffff",
                        boltColor2: "#fbbf24",
                        boltColor3: "#f59e0b",
                        sealChar: "如來",
                        vfxType: "giantpalm"
                    }
                ]
            },
            {
                id: "dai_dien_tinh_than",
                name: "《Đại Diễn Tinh Thần Biến》",
                shortName: "Tinh Thần Biến",
                tier: "Tiên Phẩm • Vũ Trụ Tinh Hà Đạo",
                rarity: "Tien",
                element: "Thuy",
                icon: "🌠",
                passiveDesc: "Chu Thiên Tinh Lực: Hấp thu ánh sao vũ trụ, mỗi hiệp hồi thêm +15 Kiếm Nguyên",
                skills: [
                    {
                        id: 21,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Bắc Đẩu Thất Tinh Kiếm Trận",
                        subtitle: "THẤT TINH LIÊN CHÂU • TINH QUANG TRẢM YÊU",
                        icon: "✨",
                        desc: "Kết nối 7 ngôi sao Bắc Đẩu bắn ra luồng cực quang tinh hà xuyên thấu Yêu Vương (215% Công).",
                        mult: 2.15,
                        toughnessBreak: 35,
                        color: "#818cf8",
                        boltColor1: "#ffffff",
                        boltColor2: "#6366f1",
                        boltColor3: "#38bdf8",
                        sealChar: "北斗",
                        vfxType: "meteor"
                    },
                    {
                        id: 22,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Chu Thiên Tinh Đấu Vẫn Thạch",
                        subtitle: "QUẦN TINH RƠI RỤNG • THIÊN BĂNG ĐỊA LIỆT",
                        icon: "☄️",
                        desc: "Triệu hồi mưa Vẫn Thạch Ngôi Sao bốc cháy từ ngoài vũ trụ nện thẳng vào trận địa Yêu Vương (365% Công).",
                        mult: 3.65,
                        toughnessBreak: 60,
                        color: "#60a5fa",
                        boltColor1: "#ffffff",
                        boltColor2: "#3b82f6",
                        boltColor3: "#a855f7",
                        sealChar: "星隕",
                        vfxType: "meteor"
                    },
                    {
                        id: 23,
                        stance: "Thức 3 • Tuyệt Thế Tiên Thuật",
                        name: "Tinh Hà Đảo Huyền • Hồng Mông Sáng Thế",
                        subtitle: "VŨ TRỤ SỤP ĐỔ • VẠN TINH QUY NHẤT",
                        icon: "🌌",
                        desc: "Kéo cả dải Ngân Hà và hàng chục ngôi sao khổng lồ giáng xuống nghiền nát không gian Trấn Yêu Tháp (500% Công)!",
                        mult: 5.0,
                        toughnessBreak: 100,
                        color: "#c084fc",
                        boltColor1: "#ffffff",
                        boltColor2: "#818cf8",
                        boltColor3: "#38bdf8",
                        sealChar: "星河",
                        vfxType: "meteor"
                    }
                ]
            },
            {
                id: "thoi_khong_luan_hoi",
                name: "《Thời Không Luân Hồi Tiên Kinh》",
                shortName: "Thời Không Luân Hồi",
                tier: "Chí Tôn Tiên Đế Pháp • Thời Không Đạo",
                rarity: "Tien",
                element: "Loi",
                icon: "⏳",
                passiveDesc: "Vạn Cổ Tuế Nguyệt: Bẻ cong thời không, tăng +25% Né Tránh & đóng băng thời gian",
                skills: [
                    {
                        id: 24,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Tuế Nguyệt Như Đao • Trảm Thọ Nguyên",
                        subtitle: "NHẤT ĐAO TRẢM VẠN NĂM • THỌ NGUYÊN KHÔ KIỆT",
                        icon: "⏳",
                        desc: "Vung lưỡi đao Thời Gian tước đoạt sinh cơ và thọ nguyên của Yêu Vương (240% Kiếm Công).",
                        mult: 2.4,
                        toughnessBreak: 40,
                        color: "#38bdf8",
                        boltColor1: "#ffffff",
                        boltColor2: "#38bdf8",
                        boltColor3: "#fbbf24",
                        sealChar: "歲月",
                        vfxType: "timestop"
                    },
                    {
                        id: 25,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Thời Không Ngưng Đọng • Tĩnh Chỉ Pháp Tắc",
                        subtitle: "VẠN VẬT ĐỨNG YÊN • DUY NGÃ ĐỘC TÔN",
                        icon: "🕰️",
                        desc: "Đóng băng toàn bộ dòng chảy thời gian và không gian, triệu hồi Pháp Luân Thời Gian cắt nát mục tiêu (385% Công)!",
                        mult: 3.85,
                        toughnessBreak: 70,
                        color: "#67e8f9",
                        boltColor1: "#ffffff",
                        boltColor2: "#22d3ee",
                        boltColor3: "#a855f7",
                        sealChar: "靜止",
                        vfxType: "timestop"
                    },
                    {
                        id: 26,
                        stance: "Thức 3 • Tuyệt Thế Tiên Đế Thuật",
                        name: "Lục Đạo Luân Hồi Bàn • Chung Cực Phán Quyết",
                        subtitle: "THIÊN ĐẠO • A TU LA • NHÂN • SÚC SINH • NGẠ QUỶ • ĐỊA NGỤC",
                        icon: "☸️",
                        desc: "Triệu hồi Bánh Xe Lục Đạo Luân Hồi khổng lồ xoay chuyển giữa hư không, đày thần hồn Yêu Vương vào vĩnh kiếp (520% Công)!",
                        mult: 5.2,
                        healRatio: 0.25,
                        toughnessBreak: 100,
                        color: "#fde047",
                        boltColor1: "#ffffff",
                        boltColor2: "#f59e0b",
                        boltColor3: "#a855f7",
                        sealChar: "輪迴",
                        vfxType: "reincarnation"
                    }
                ]
            },
            {
                id: "thao_tu_kiem_quyet",
                name: "《Thảo Tự Kiếm Quyết • Vạn Cổ Kiếm Đế》",
                shortName: "Thảo Tự Kiếm Quyết",
                tier: "Thái Cổ Thập Hung Bảo Thuật • Cực Đạo Kiếm Ý",
                rarity: "Tien",
                element: "Moc",
                icon: "🌿",
                passiveDesc: "Nhất Thảo Trảm Thiên: Một cọng cỏ hóa Cực Đạo Đế Kiếm, +45% Bạo Thương",
                skills: [
                    {
                        id: 27,
                        stance: "Thức 1 • Tiểu Thần Thông",
                        name: "Nhất Diệp Trảm Thiên Khung",
                        subtitle: "THẢO MỘC GIAI BINH • KIẾM KHÍ XUNG TIÊU",
                        icon: "🍃",
                        desc: "Một chiếc lá xanh biếc hóa thành Thần Kiếm sắc bén cắt đứt không gian và hộ thể Yêu Cang (250% Công).",
                        mult: 2.5,
                        toughnessBreak: 45,
                        color: "#34d399",
                        boltColor1: "#ffffff",
                        boltColor2: "#10b981",
                        boltColor3: "#fde047",
                        sealChar: "一葉",
                        vfxType: "grasscut"
                    },
                    {
                        id: 28,
                        stance: "Thức 2 • Đại Thần Thông",
                        name: "Cửu Diệp Kiếm Thảo • Phá Diệt Thập Phương",
                        subtitle: "CỬU DIỆP KHAI THIÊN • VẠN CỔ KIẾM MANG",
                        icon: "🌱",
                        desc: "Cửu Diệp Kiếm Thảo vươn lên giữa tinh không, 9 phiến lá rung động bắn ra 9 đạo Cực Quang chém nát thiên địa (400% Công).",
                        mult: 4.0,
                        healRatio: 0.20,
                        toughnessBreak: 75,
                        color: "#10b981",
                        boltColor1: "#ffffff",
                        boltColor2: "#34d399",
                        boltColor3: "#38bdf8",
                        sealChar: "九葉",
                        vfxType: "grasscut"
                    },
                    {
                        id: 29,
                        stance: "Thức 3 • Vạn Cổ Cấm Kỵ Tiên Thuật",
                        name: "Nhất Chu Thảo Trảm Tận Nhật Nguyệt Tinh Thần",
                        subtitle: "MỘT CỌNG CỎ CHÉM RỤNG MẶT TRỜI, MẶT TRĂNG VÀ VẠN VÌ SAO!",
                        icon: "🌿",
                        desc: "Tuyệt học tối thượng! Một cọng cỏ mảnh mai hóa thành Đại Đạo Chi Kiếm chém đôi cả Nhật, Nguyệt, Tinh Thần trên bầu trời (560% Công)!",
                        mult: 5.6,
                        healRatio: 0.25,
                        toughnessBreak: 100,
                        color: "#6ee7b7",
                        boltColor1: "#ffffff",
                        boltColor2: "#10b981",
                        boltColor3: "#fde047",
                        sealChar: "斬星",
                        vfxType: "grasscut"
                    }
                ]
            }
        ];

        // Gộp toàn bộ 30 Kỹ Năng Thần Thông từ 10 Bộ Công Pháp vào ULTIMATE_SKILLS để truy xuất tức thì
        const ULTIMATE_SKILLS = CULTIVATION_MANUALS.flatMap(m => m.skills.map(s => ({
            ...s,
            manualId: m.id,
            manualName: m.name,
            manualElement: m.element
        })));

        /**
         * 3. KHO VẬT PHẨM RỚT TRỰC TIẾP TRONG 50 TẦNG HẠ GIỚI
         */
        const LOOT_DATABASE = {
            t1: [
                { id: "dan_tu_khi", name: "Tụ Khí Đan", icon: "💊", rarity: "Linh", type: "Consumable", statBoost: { atk: 4500, hp: 25000 }, desc: "Uống vào tăng ngay +4,500 Kiếm Công & +25,000 HP" },
                { id: "manh_thanh_kiem", name: "Thanh Vân Cổ Kiếm", icon: "🗡️", rarity: "Huyen", type: "Equip", statBoost: { atk: 9000, crit: 2 }, desc: "Luyện hóa tăng +9,000 Kiếm Công & +2% Bạo Kích" }
            ],
            t2: [
                { id: "dan_truc_co", name: "Huyết Long Bảo Đan", icon: "🩸", rarity: "Huyen", type: "Consumable", statBoost: { atk: 16000, def: 5000, hp: 85000 }, desc: "Tăng +16,000 Kiếm Công, +5,000 Thủ & +85,000 HP" },
                { id: "phap_bao_kim_chung", name: "Đông Hoàng Hộ Tâm Chung", icon: "🔔", rarity: "Dia", type: "Equip", statBoost: { def: 12000, eva: 3 }, desc: "Tăng +12,000 Phòng Thủ & +3% Thân Pháp Né Tránh" },
                { id: "bi_tich_loi_quyet", name: "Thanh Liên Kiếm Điển", icon: "📜", rarity: "Thien", type: "SkillBook", statBoost: { atk: 28000, crit: 5 }, desc: "Lĩnh ngộ tăng +28,000 Kiếm Công & +5% Bạo Kích" }
            ],
            t3: [
                { id: "dan_kim_dan", name: "Cửu Chuyển Kim Đan", icon: "🔮", rarity: "Dia", type: "Consumable", statBoost: { atk: 45000, hp: 220000 }, desc: "Tăng +45,000 Kiếm Công & +220,000 Khí Huyết" },
                { id: "kiem_thai_co", name: "Tru Tiên Kiếm Phôi", icon: "⚔️", rarity: "Thien", type: "Equip", statBoost: { atk: 75000, crit: 6 }, desc: "Tăng +75,000 Kiếm Công & +6% Bạo Kích" }
            ],
            t4: [
                { id: "dan_nguyen_anh", name: "Nguyên Anh Hóa Thần Đan", icon: "👑", rarity: "Thien", type: "Consumable", statBoost: { atk: 120000, def: 45000, hp: 600000 }, desc: "Tăng +120K Công, +45K Thủ & +600K HP" },
                { id: "long_lin_giap", name: "Hắc Long Nghịch Lân Giáp", icon: "🛡️", rarity: "Tien", type: "Equip", statBoost: { def: 95000, eva: 5 }, desc: "Tăng +95,000 Phòng Thủ & +5% Né Tránh" }
            ],
            t5: [
                { id: "hong_mong_khi", name: "Hồng Mông Tử Khí", icon: "🌌", rarity: "Tien", type: "Consumable", statBoost: { atk: 350000, def: 120000, hp: 1800000, crit: 8 }, desc: "Chí bảo Hạ Giới! Tăng toàn diện thuộc tính chuẩn bị Phi Thăng!" }
            ]
        };

        /**
         * 4. KHỞI TẠO 50 TẦNG TRẤN YÊU THÁP
         */
        const DEMON_NAMES = [
            "Hắc Phong Lang Yêu", "Huyết Nhãn Độc Chu", "Thiết Giáp Cự Hùng", "Âm Phong Lệ Quỷ", "Xích Luyện Xà Yêu",
            "Bạch Cốt Khô Lâu", "Thực Nhân Thảo Yêu", "Huyền Băng Ác Giao", "Liệt Hỏa Thạch Nhân", "Cửu U Minh Báo"
        ];
        const MILESTONE_BOSSES = {
            10: { name: "Xích Viêm Yêu Vương", realmUnlock: "Trúc Cơ Kỳ", element: "Hoa", desc: "Bá chủ tầng 10. Trảm sát để đột phá Trúc Cơ Kỳ!" },
            20: { name: "Huyết Dực Ma Hoàng", realmUnlock: "Kim Đan Kỳ", element: "Moc", desc: "Đại Yêu Vương tầng 20. Trảm sát để kết tụ Kim Đan!" },
            30: { name: "Cửu U Minh Long", realmUnlock: "Nguyên Anh Kỳ", element: "Thuy", desc: "Cổ Long trấn giữ tầng 30. Trảm sát để phá đan thành Anh!" },
            40: { name: "Thái Cổ Thao Thiết", realmUnlock: "Hóa Thần Kỳ", element: "Loi", desc: "Hung thú thượng cổ tầng 40. Vượt qua để bước vào Hóa Thần!" },
            50: { name: "Thiên Đạo Chấp Pháp Sứ", realmUnlock: "Phi Thăng Linh Giới", element: "Kim", desc: "Thủ hộ giả cuối cùng của Hạ Giới! Chiến thắng sẽ mở Thiên Môn Phi Thăng Linh Giới!" }
        };

        const TOWER_50_FLOORS = [];
        for (let f = 1; f <= 50; f++) {
            const tier = Math.ceil(f / 10);
            const isBoss = f % 10 === 0;
            const scale = Math.pow(1.17, f - 1);

            const hp = Math.round(65000 * scale * (isBoss ? 1.65 : 1));
            const atk = Math.round(11500 * scale * (isBoss ? 1.35 : 1));
            const def = Math.round(2800 * scale * (isBoss ? 1.25 : 1));
            const crit = isBoss ? 22 : 12;
            const eva = isBoss ? 10 : 5;
            const cp = Math.round(hp + atk * 5 + def * 4);
            const element = isBoss ? MILESTONE_BOSSES[f].element : ELEMENT_KEYS[(f - 1) % 5];

            TOWER_50_FLOORS.push({
                floor: f,
                tier: tier,
                isMilestone: isBoss,
                element: element,
                name: isBoss ? MILESTONE_BOSSES[f].name : `${DEMON_NAMES[(f - 1) % 10]} (Tầng ${f})`,
                realmUnlock: isBoss ? MILESTONE_BOSSES[f].realmUnlock : null,
                milestoneDesc: isBoss ? MILESTONE_BOSSES[f].desc : null,
                hp, atk, def, crit, eva, cp,
                drops: LOOT_DATABASE[`t${tier}`]
            });
        }
