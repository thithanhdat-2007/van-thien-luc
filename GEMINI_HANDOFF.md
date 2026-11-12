# Bàn giao Codex → Gemini 3.8 trong Antigravity

Ngày 2026-11-12 (Asia/Bangkok).

## Quyền triển khai

Người dùng giao Gemini 3.8 trong Antigravity thực hiện nhiệm vụ dưới đây. Sau khi ghi bàn giao, Codex dừng chỉnh sửa mã và chuyển sang chỉ đọc. Gemini đọc AGENTS.md, GEMINI.md, FEATURE_MAP.md và AI_HANDOFF_GUIDE.md trước khi sửa.

## Nhiệm vụ

Bản Nguyên Tu Sĩ chỉ được xuất hiện ở hai nơi: màn hình chính và khu Túi Đồ/Bản Nguyên. Rà soát mọi trang, popup và tính năng khác rồi bỏ các khối Bản Nguyên Tu Sĩ được chèn ở đó. Giữ bố cục các chức năng còn lại gọn gàng. Không xóa dữ liệu nhân vật hoặc bảng thông số hợp lệ của riêng chức năng như thanh HP trong chiến đấu. Không chỉ ẩn bằng CSS khi khối đó được render dư từ JavaScript. Không thêm các bản sao ID của thanh thông số hoặc avatar.

## Trạng thái trước bàn giao

Commit mốc 13b6acb lưu trạng thái trước đợt dọn model/cài đặt. Những thay đổi sau commit chưa được commit. Giữ nguyên mọi thay đổi có sẵn.

Codex đã dọn bảng chỉnh model cũ, thay bằng Cài đặt có kích thước nhân vật, âm thanh và ngắm cảnh. Đã bỏ nút Xuất Antigravity.

Bản sửa gần nhất cho lỗi nhảy thông số nằm ở js/master_demos.js, js/features/character.js và js/app.js: renderer cũ chuyển cho renderCharacterUI; chỉ số tối đa lấy từ getEffectiveStats; avatar có một nguồn và tránh thử lại ảnh lỗi liên tục. Kiểm tra mô phỏng HP/MP, giá trị 0, avatar lỗi và đổi avatar đã qua. npm run build đã qua. Chưa kiểm chứng trực tiếp lỗi này trên trình duyệt.

## Tệp đang thay đổi

```text
 M FEATURE_MAP.md
 D assets/images/maiden_ice_cultivator.svg
 D assets/images/model_2_character.svg
 M css/model_studio.css
 M css/styles.css
 D css/xianxia_model_rig.css
 M index.html
 M js/app.js
 M js/features/character.js
 M js/features/character_model.js
 D js/features/xianxia_model_rig.js
 M js/interaction.js
 M js/master_demos.js
 D public/assets/images/model_2_character.svg
 M style.css
```

Danh sách gồm cả thay đổi của các công việc khác. Kiểm tra diff thực tế trước khi sửa, không hoàn tác hàng loạt.

## Vị trí cần đọc

- index.html chứa #hud-left và .origin-dashboard của màn hình chính.
- js/features/character.js sở hữu renderCharacterUI và các ID ui-hp-text/ui-hp-bar/ui-avatar.
- js/app.js chứa renderCharacterHub, trang Túi Đồ/Bản Nguyên và các bố cục popup. Có ghi chú gần nhánh Công Pháp về việc bỏ cột Bản Nguyên Tu Sĩ.
- main.js và js/features/bootstrap.js quản lý popup, điều hướng và khởi động.
- style.css và css/ chứa bố cục liên quan. Dùng Graphify cho câu hỏi phụ thuộc khi phù hợp.

## Kiểm tra hoàn tất

Mở màn hình chính và Túi Đồ/Bản Nguyên xác nhận khối nhân vật hợp lệ. Mở các chức năng còn lại từ đường điều hướng thực tế và xác nhận không xuất hiện khối Bản Nguyên Tu Sĩ dư. Kiểm tra số liệu và avatar không bị ghi đè, không có ID trùng. Kiểm tra ở khung PC 1366×768 và màn hình PC rộng. Chạy npm run build, báo chính xác các tệp sửa và phần chưa kiểm chứng. Không commit/push nếu người dùng chưa yêu cầu cho đợt này.

Codex đã dừng chỉnh sửa mã sau bàn giao này.

## Thu hồi bàn giao

Người dùng đã hủy yêu cầu giao Gemini và giao Codex tiếp tục triển khai. Codex nhận lại quyền chỉnh sửa. Chưa gửi nhiệm vụ thành công cho Gemini.
