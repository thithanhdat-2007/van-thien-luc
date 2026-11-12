# Chỉnh sửa Trấn Yêu Tháp

## Nguồn đang chạy

- `js/features/demon_tower.js` mở iframe `tran_yeu_thap_v4.html`.
- `js/tower_data.js` nạp trước engine, chứa ngũ hành, công pháp, kỹ năng, vật phẩm rơi, quái và công thức 50 tầng.
- `TOWER_RULES` trong file dữ liệu chứa FPS, thời gian lượt, giá đúc kiếm, ngưỡng cuồng bạo, số lượt hộ thể và kiếm trận.
- `tran_yeu_thap_v4.html` chứa UI, model canvas, phát hiệu ứng, state demo và xử lý chiến đấu.
- Tháp giữ bản sao chỉ số cho từng trận. Khi khiêu chiến, gọi `getTowerSyncPayload()` → `recalculateAllStats()` từ game chính; không đôn chỉ số hay dùng nhân vật demo khi chiến đấu. Kết quả, vật phẩm và tiến trình được chuyển về game chính qua cầu nối trong `js/features/demon_tower.js`.
- Mỗi lượt người/quái nghỉ theo tốc độ: 1x = 2000ms, 2x = 1000ms, 3x = 800ms. Dừng trận hủy chờ và khóa các callback cũ. `js/stats.js` cung cấp công thức sát thương và Uy Áp dùng chung.

## Thông tin cần khi nhận yêu cầu

Trước khi sửa, nói rõ phần cần sửa và file sẽ chạm. Chỉ hỏi thông tin thực sự thiếu, giữ giá trị cũ cho phần người dùng không yêu cầu.

| Yêu cầu | Thông tin cần xác định | Nơi sửa |
| --- | --- | --- |
| Điều kiện chiến đấu | Điều kiện hiện tại, giá trị mới, đơn vị, áp dụng mọi tầng hay tầng cụ thể | TOWER_RULES hoặc công thức tầng |
| Công pháp | ID/tên, ba thức, sát thương, tiêu hao, điều kiện dùng, hiệu ứng tương ứng | CULTIVATION_MANUALS và bộ phát nếu có cơ chế mới |
| Pháp bảo | ID/tên, tác dụng, thời lượng theo lượt, điều kiện dùng, hình ảnh | LOOT_DATABASE cho vật phẩm rơi, castActiveArtifact cho chủ động |
| Quái | Tầng, tên, HP/công/thủ, hệ, thưởng | DEMON_NAMES, MILESTONE_BOSSES, công thức TOWER_50_FLOORS |
| Model | Nhân vật nào, tài nguyên ảnh/sprite, kích thước, vị trí, các trạng thái | drawSwordImmortal hoặc drawDemonSovereign |
| Hiệu ứng | Kỹ năng nào, ảnh/mẫu, màu, thời lượng, điểm đánh, số đợt | Bộ phát và renderer của hiệu ứng tương ứng |

## Quy tắc dữ liệu

Giữ ID ổn định và cấu trúc trường của mục tương tự. Các vfxType phải có nhánh xử lý thực tế. Pháp bảo chủ động và vật phẩm rơi là hai đường gọi khác nhau, kiểm tra cả hai khi yêu cầu liên quan. Không thêm công thức hoặc tỷ lệ chưa được yêu cầu. Một số điều kiện vẫn ở engine, chỉ chuyển thêm khi đã xác định caller.

## Quy trình an toàn

1. Kiểm tra git diff và chủ sở hữu triển khai. Giữ thay đổi ngoài phạm vi.
2. Tìm đúng ID/hàm và các caller. Thay dữ liệu tại một nguồn, không chép công thức sang UI.
3. Đồng bộ mô tả và tooltip liên quan với giá trị mới.
4. Kiểm tra cú pháp dữ liệu và inline script, chạy npm run build.
5. Kiểm tra mở tháp, dùng chức năng vừa sửa, đổi tầng và đóng/mở lại. Với đồ họa, quan sát đủ lúc đánh và tan biến ở desktop/mobile.
6. Báo kết quả quan sát, file đã sửa và phần chưa kiểm chứng. Build qua không đủ để kết luận hết lag hoặc đúng hiệu ứng.

Khi thử tối ưu, giữ mốc commit trước thay đổi và đối chiếu cùng cảnh. Chỉ commit/push khi người dùng yêu cầu. Không xóa hiệu ứng, đổi model, giảm đồ họa hoặc đổi gameplay để xử lý lỗi ngoài phạm vi.
