# 🌌 VẤN THIÊN LỤC - CÀN KHÔN TỊCH DIỆT (2D IDLE RPG)

Dự án game nhập vai tu tiên cổ phong 2D (Idle RPG) được hình thành và trích xuất hoàn chỉnh từ bản thiết kế trên Google Gemini Canvas. Dự án đã được tái cấu trúc thành kiến trúc đa file chuẩn (Modular Architecture), sẵn sàng để vận hành trên trình duyệt Web và đóng gói thành App 2D cho điện thoại (Android, iOS) cũng như máy tính (Windows, macOS).

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
d:/Dự án tu tiên/
├── index.html               # Giao diện chính, sân khấu nhân vật 2D, các panel & modals
├── package.json             # Cấu hình dependency, script chạy dev web & build app
├── capacitor.config.json    # Cấu hình đóng gói ứng dụng di động 2D (Android/iOS)
├── antigravity.json         # Metadata cấu hình dự án
├── README.md                # Tài liệu tổng quan dự án
├── HUONG_DAN_DUNG_APP_2D.md # Hướng dẫn chi tiết dựng Web & đóng gói App 2D
├── css/
│   └── styles.css           # Hiệu ứng đồ họa cổ phong, sương mù, viền kim sắc, scrollbar xianxia
└── js/
    ├── tailwind.config.js   # Bảng màu ngọc thạch (jade), hoàng kim (gold), typography cổ điển
    ├── data.js              # Cấu hình 12 Cảnh Giới, 5 Cảnh Nền Động Phủ, 4 Bí Cảnh & State mặc định
    ├── audio.js             # Bộ tổng hợp âm thanh Cổ Phong thuần Web Audio API (chuông, sét, kiếm)
    ├── canvas.js            # Engine vẽ hạt Linh Khí & Sóng Xung Kích 60 FPS trên HTML5 Canvas
    └── app.js               # Logic vòng lặp tu luyện tự động, đột phá Lôi Kiếp, chiến đấu Bí Cảnh
```

---

## ⚔️ Các Hệ Thống Gameplay Cốt Lõi (Đã Nâng Cấp Chuẩn Bom Tấn Tiên Hiệp)

1. **Đột Phá Đồ Họa Cảnh Giới & Hào Quang Thần Thú (Aura & Visuals)**:
   - **Phân cấp Hào Quang Động**: Hào quang đa tầng phát quang theo cảnh giới:
     - Luyện Khí: Xanh ngọc bích nhạt (`.aura-luyenkhi`)
     - Trúc Cơ: Xanh lam sóng nước cuộn trào (`.aura-trucco`)
     - Kim Đan: Kim quang rực lửa chói lọi (`.aura-kimdan`)
     - Nguyên Anh: Tử khí đông lai huyền bí (`.aura-nguyenanh`)
     - Hóa Thần: Hồng trần hỏa diễm bá đạo (`.aura-hoathan`)
   - **Vòng lôi điện tĩnh bao quanh nhân vật** (`.animate-lightning-arc`) phóng điện chập chờn.
   - **3 Pháp Bảo Bản Mệnh quay quỹ đạo độc lập**:
     1. *Thanh Trúc Phi Kiếm* lướt vòng cung nghiêng 25 độ (`.animate-orbit-sword`).
     2. *Bát Quái Hộ Thân Kính* quay ngược chiều bảo vệ thân (`.animate-orbit-shield`).
     3. *Định Hải Thần Châu / Phù Văn* xoay trục hẹp xung quanh đan điền (`.animate-orbit-bead`).
   - **Linh Thú Hộ Pháp sống động**: Chuyển đổi linh hoạt giữa *Cửu Vĩ Thiên Hồ* (+18% Tụ Khí), *Băng Lôi Giao Long* (+28 Công & Kháng Lôi), và *Thanh Hạc Tiên Cầm* (+22 Thân Pháp).

2. **Hệ Thống Độ Kiếp Cửu Tiêu (Thunder Tribulation Cutscene)**:
   - Khi đạt 100% tu vi và nhấn "Độ Kiếp Đột Phá!", màn hình chuyển sang trạng thái **"Thiên Địa Bi Sắc"**: Bầu trời tối sầm tím đen, mây giông cuồn cuộn, chớp lôi chói lòa liên tục.
   - **Hiệu ứng Screen Shake cực đại** kết hợp **Web Audio API tổng hợp âm trầm (Sub-bass drop 35Hz + crackle lôi điện)** khi thiên lôi giáng xuống.
   - **Vượt 3 đạo thiên kiếp** (*Sơ Kỳ Tử Lôi* $\rightarrow$ *Trung Kỳ Huyền Lôi* $\rightarrow$ *Cửu Tiêu Thần Lôi*):
     - Người chơi có thể chuẩn bị: `[Kích Hoạt Hộ Trận Động Phủ]` (kháng 35% sát thương), `[Nuốt Hộ Tâm Đan]` (+25% tỷ lệ), `[Ngưng Thần Vận Khí]`.
     - Thất bại bị phạt lùi 25% tu vi; thành công kích hoạt hiệu ứng phá giới toàn màn hình và hợp âm Tiên Âm vang vọng.

3. **Nhật Ký Kỳ Ngộ Văn Bản & Chánh - Ma Trị Số**:
   - Nút **[Lịch Luyện]** trên thanh điều hướng mở ra **Cổ Tịch Cuộn Tròn** (`ancient-scroll`) phong cách thư pháp thẻ tre cổ kính.
   - Các sự kiện kỳ ngộ phong phú (*Cổ Tu Động Phủ, Tranh Đoạt Tuyết Chi, Phá Ma Đỉnh Cứu Sinh, Niết Bàn Thần Thú...*) với 2 nhánh quyết định rõ ràng:
     - **Chánh Đạo**: Tăng *Thiên Tâm*, mở khóa danh hiệu Tiên Đạo (`Thanh Hư Chân Tiên`), nhận linh dược thuần khiết.
     - **Ma Đạo**: Tăng *Ma Tính*, mở khóa danh hiệu Ma Tôn (`Cực Hắc Ma Tôn`), tu vi tăng vọt và ngoại trang hào quang rực huyết sắc ma diễm.
   - Cặp chỉ số Thiên Tâm / Ma Tính hiển thị trực quan bằng thanh năng lượng âm dương trên đỉnh màn hình (HUD).

4. **Tụ Linh Trận Ngũ Hành 3D (Động Phủ)**:
   - Tụ Linh Trận được tách thành **5 Cột Trụ Ngũ Hành** (*Kim - Mộc - Thủy - Hỏa - Thổ*) có thể nâng cấp độc lập bằng Linh Thạch.
   - Mỗi cột trụ gia tăng chỉ số riêng biệt (Kim: Công kích & Tụ khí; Mộc: Khí huyết & Hồi phục; Thủy: Thân pháp & Kháng kiếp; Hỏa: Bạo kích; Thổ: Phòng ngự).
   - **Hiệu ứng Hạt Linh Khí Canvas**: Khi kích hoạt hoặc thăng cấp một nguyên tố, toàn bộ các hạt linh khí bay vào nhân vật trên màn hình chính sẽ lập tức đổi màu tương ứng với nguyên tố đó!

3. **6 Ô Trang Bị Chuẩn & Chỉ Số Sinh Tồn** (`thiet_ke_ui_va_prompt_tu_tien.md`):
   - 6 Ô trang bị: `[Vũ Khí]` (Phi Kiếm), `[Đạo Bào]`, `[Phi Hài]`, `[Giới Chỉ]`, `[Ngọc Bội]`, và `[Bản Mệnh Pháp Bảo]` (mở khi đạt Kim Đan Kỳ).
   - 3 Thanh Trạng Thái: Tu Vi Linh Khí, Khí Huyết (HP), và Linh Lực (MP) tự hồi phục theo chu thiên.

4. **Phường Thị & Giao Thương** (`tong_hop_chuc_nang_game_tu_tien.md` Phân hệ 8):
   - Mua bán các loại hạt giống (Tử Linh Chi, Huyết Ngọc Sâm), khoáng thạch đúc đồ, đan dược và bùa hộ thân bằng Linh Thạch.
   - Thu mua phế liệu / thảo dược thừa để tái đầu tư tài nguyên.

5. **Hồng Nhan Đạo Lữ & Song Tu** (`tong_hop_chuc_nang_game_tu_tien.md` Phân hệ 9):
   - Kết giao cùng các đại mỹ nhân (*Lục Tuyết Nhi*, *Nam Cung Uyển*).
   - Tặng thảo dược bồi đắp Hảo Cảm, cùng nhau Song Tu tăng vọt Tu Vi mỗi ngày.

6. **Thần Du Ngoại Tuyến (Offline Idle Calculation)**:
   - Tự động tích lũy Tu Vi và Linh Thạch khi người chơi rời mạng, tự động tổng kết và cộng dồn khi mở lại game.

7. **Linh Điền & Lò Luyện Đan**:
   - Trồng trọt tiên thảo theo thời gian thực, tự động thu hoạch khi chín muồi.
   - Khởi lò luyện chế Tụ Khí Đan, Trúc Cơ Đan với Chân Hỏa.

6. **Bí Cảnh Khiêu Chiến (Real-time Combat)**:
   - Thử thách các vùng đất cấm kỵ: *U Minh Sơn Lâm*, *Vạn Kiếm Trủng*, *Huyết Ma Cốc*, *Thái Hư Huyễn Cảnh*.
   - Giao chiến thời gian thực với Boss, thanh máu động và tính toán Sát thương dựa trên Công/Thủ.
   - Rơi rớt Linh Thạch và Pháp Bảo quý hiếm.

7. **Công Pháp & Tông Môn**:
   - Lĩnh ngộ và nâng cấp các bộ cổ pháp: *Thanh Vân Quyết*, *Bát Hoang Du Long Kỹ*, *Bất Diệt Kim Thân*.
   - Nhận bổng lộc hàng ngày từ Tông Môn.

8. **Âm Thanh Cổ Phong Thuần Khiết (Web Audio API)**:
   - Không cần tải file MP3 bên ngoài (tránh lỗi 404).
   - Tự động dao động âm tần tạo tiếng chuông đồng thiền tịnh, tiếng linh phong và tiếng kiếm kích.

---

## 🚀 Hướng Dẫn Chạy & Phát Triển

### 1. Chạy Web Trực Tiếp (Nhanh nhất)
- Mở trực tiếp file `index.html` bằng trình duyệt bất kỳ (Edge, Chrome, Firefox).
- Hoặc sử dụng extension **Live Server** trong VS Code / Antigravity IDE.

### 2. Chạy Với Node.js & Vite Dev Server
```bash
npm install
npm run dev
```
Trình duyệt sẽ tự động mở tại `http://localhost:5173` với tốc độ tải siêu tốc và Hot Module Replacement (HMR).

### 3. Đóng Gói Thành App 2D Di Động (Android / iOS)
Sử dụng **Capacitor** để chuyển đổi toàn bộ mã nguồn web thành ứng dụng Native App:
```bash
# Cài đặt Capacitor
npm install

# Build bản web tĩnh ra thư mục dist
npm run build

# Thêm nền tảng Android
npx cap add android

# Mở dự án trong Android Studio để xuất file APK hoặc chạy máy ảo
npx cap open android
```
*(Chi tiết xem thêm tại `HUONG_DAN_DUNG_APP_2D.md`)*

---

## 🎨 Lộ Trình Mở Rộng Đồ Họa 2D

- **Spritesheet & Animation**: Thay thế avatar tĩnh hiện tại bằng animation frame 2D (nhân vật thở, ngự kiếm, chém kiếm) bằng PixiJS hoặc Phaser 2D.
- **Bản Đồ Thế Giới 2D**: Bổ sung bản đồ lưới (Tilemap) cho phép nhân vật di chuyển khám phá các thôn làng và tông môn.
- **Hệ Thống Thú Cưỡi & Linh Thú**: Hiển thị linh thú 2D đi theo sau nhân vật.
