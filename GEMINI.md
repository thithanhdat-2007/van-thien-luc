# Quy trình Gemini cho Vấn Thiên Lục

Áp dụng `AGENTS.md` và quyền triển khai hiện tại trong `AI_HANDOFF_GUIDE.md`.

## Đọc ít và đúng phạm vi

1. Đọc `FEATURE_MAP.md`, chọn đúng file tính năng người dùng yêu cầu.
2. Dùng `rg -n` tìm tên nút, ID hoặc hàm. Đọc khoảng 80–160 dòng quanh kết quả cần thiết.
3. Nếu có graph hiện tại, dùng một truy vấn Graphify tập trung cho đường gọi hoặc phụ thuộc. Chỉ mở rộng khi còn thiếu bằng chứng.
4. Chỉ đọc caller, callee và dữ liệu trực tiếp liên quan. Tránh quét toàn bộ `main.js`, `js/app.js`, `js/data.js`, `style.css`, các demo, `dist/`, `node_modules/`, toàn bộ graph hoặc lịch sử chat cho một sửa đổi nhỏ.
5. Trước khi sửa, nêu ngắn gọn tính năng và danh sách file dự kiến chạm tới. Mỗi lần chỉ triển khai yêu cầu hiện tại.

## Giữ đúng việc được giao

- Với Trấn Yêu Tháp, đọc `TOWER_EDITING.md`. Sửa dữ liệu tại `js/tower_data.js`, xác định caller trong engine trước khi đổi điều kiện.
- Khi nhận yêu cầu chỉnh sửa, nêu phần cần sửa, dữ liệu cần có và file dự kiến chạm. Chỉ hỏi phần chưa rõ có ảnh hưởng kết quả.
- Không sửa model, hiệu ứng, gameplay hoặc module lân cận chỉ vì đang mở cùng file. Nếu cần mở rộng phạm vi, giải thích phụ thuộc cụ thể trước.
- Sau thay đổi dữ liệu, đối chiếu tooltip/mô tả và thử chức năng thực tế. Không ghi đè thay đổi agent khác hoặc gộp các tối ưu ngoài yêu cầu.

- Người dùng yêu cầu Trấn Yêu Tháp thì bắt đầu ở `js/features/demon_tower.js`. Chỉ sửa vùng HTML/CSS/data của tháp nếu cần cho chính yêu cầu đó.
- Khi sửa thanh Tu Vi hoặc bảng chỉ số, bảo tồn ảnh, animation, kích thước, màu và hiệu ứng độ kiếp. Khi sửa độ kiếp, bảo tồn các tính năng còn lại.
- Không tự thiết kế lại giao diện, thay công thức, đổi dữ liệu save, đổi icon hoặc tối ưu tính năng ngoài yêu cầu.
- Bảo tồn thay đổi của người dùng và agent khác. Một chủ sở hữu triển khai tại một thời điểm. Nếu Codex đang triển khai, chỉ đọc và gửi nhận xét cho đến khi bàn giao.
- Sửa tối thiểu để giải quyết đầy đủ lỗi. Không thêm vòng lặp, timer hay bản sao state chỉ để che triệu chứng.
- Sau sửa chạy kiểm tra cú pháp file JS liên quan và `npm run build`. Kiểm tra thao tác thực tế cần thiết. Báo rõ phần đã quan sát và phần chưa kiểm chứng.
- Báo cáo ngắn gồm kết quả, file đã sửa và giới hạn còn lại. Không báo hoàn thành tính năng chỉ từ build thành công.
