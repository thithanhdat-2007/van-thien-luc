# Bản đồ phạm vi tính năng

Đọc đúng hàng liên quan đến yêu cầu trước khi tìm mã. Các file dưới đây là classic script có IIFE riêng, được nạp theo thứ tự trong cuối `index.html`. Các hàm công khai trên `window` giữ tương thích với nút HTML và các module cũ.

| Phần người dùng yêu cầu | File điều khiển chính | Nguồn liên quan khi cần |
| --- | --- | --- |
| Trấn Yêu Tháp | `js/features/demon_tower.js` | Nút mở `tran_yeu_thap_v4.html` trong iframe toàn màn hình. Engine và dữ liệu của mẫu v4 nằm trong trang đó, chưa đồng bộ save chính. `#modal-tran-yeu-thap` và hệ tháp trong `js/app.js` là các bản cũ |
| Độ kiếp | `js/features/tribulation.js` | `js/tribulation_visuals.js`, `js/tribulation_system.js`, `#modal-do-kiep` |
| Gia viên | `js/features/estate.js` | `js/dong_phu_ecosystem.js`, `js/cave.js`, `#modal-gia-vien` |
| Luyện đan | `js/features/alchemy.js` | `js/alchemy_data.js`, `#modal-luyen-dan` |
| Luyện khí | `js/features/forging.js` | `js/equipment_data.js`, `#modal-luyen-khi` |
| Khuê phòng, đạo lữ | `js/features/chamber.js` | `#modal-khue-phong` |
| Bản Nguyên Tu Sĩ | `js/features/character.js` | `#hud-left`, `.origin-dashboard` trong `style.css` |
| Thanh tài nguyên trên | `js/features/topbar.js` | `#global-top-resource-bar` |
| Menu, đóng/mở popup chung | `main.js` | `js/features/bootstrap.js`, router trong `js/app.js` |
| Khởi động, nối các tính năng | `js/features/bootstrap.js` | Thứ tự script cuối `index.html` |
| Tu Vi, bình cảnh, vòng lặp | `js/app.js` | Tìm `addExp`, `GameLoop`, `updateHUD`, `attemptCultivationBreakthrough`; `js/loop.js` |
| Định nghĩa gameplay và save | `js/data.js` | `js/realms_data.js`, các file dữ liệu chuyên biệt hiện có |

## Cách tìm nhanh

```powershell
rg -n "openDemonTowerModal|handleChallengeClick" js/features/demon_tower.js
rg -n "modal-tran-yeu-thap" index.html style.css css
rg -n "addExp|function updateHUD|function GameLoop" js/app.js
```

HTML và CSS dùng chung vẫn ở `index.html` và `style.css`. Chỉ đọc/sửa vùng selector hoặc ID của tính năng được giao. `js/app.js`, `js/integrated_rooms.js` và `js/master_demos.js` còn các hệ cũ hoặc tích hợp khác. Xác định đúng caller qua `onclick`, export cuối file và thứ tự script trước khi sửa chúng.

Không ghép các file tính năng trở lại `main.js`. Chức năng mới đặt trong module phù hợp. Logic dùng chung chỉ tách khi có caller cụ thể cần dùng, tránh tạo bản sao state hoặc công thức.
