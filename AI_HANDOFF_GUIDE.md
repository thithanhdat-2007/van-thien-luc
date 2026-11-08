# Chuyển quyền giữa Codex và Gemini

Chỉ một AI được quyền chỉnh sửa dự án tại một thời điểm. Graphify có thể phục vụ phân tích trong quá trình bàn giao.

## Codex chuyển quyền cho Gemini

1. Codex dừng ở trạng thái an toàn, ghi mục tiêu, tiến độ, tệp đã thay đổi, kiểm thử, rủi ro và việc còn lại vào `GEMINI_HANDOFF.md`.
2. Sau khi ghi tệp bàn giao, Codex dừng chỉnh sửa và chuyển sang vai trò chỉ đọc.
3. Trong khung chat Gemini của Antigravity, gửi:

   ```text
   Bạn được nhận quyền triển khai dự án Vạn Cổ Tu Tiên. Hãy đọc AGENTS.md, AI_HANDOFF_GUIDE.md và GEMINI_HANDOFF.md. Kiểm tra trạng thái tệp hiện tại, bảo tồn mọi thay đổi đang có, rồi thực hiện nhiệm vụ được người dùng giao. Chạy kiểm thử phù hợp và ghi rõ kết quả. Codex đã dừng chỉnh sửa và chỉ còn vai trò đọc/đánh giá.
   ```

4. Không giao thêm việc chỉnh sửa cho Codex cho đến khi Gemini bàn giao lại.

## Gemini chuyển quyền cho Codex

1. Gemini dừng ở trạng thái an toàn, ghi cùng các thông tin trên vào `CODEX_HANDOFF.md`.
2. Gemini dừng chỉnh sửa và chuyển sang vai trò chỉ đọc.
3. Gửi cho Codex:

   ```text
   Bạn được nhận lại quyền triển khai dự án Vạn Cổ Tu Tiên. Hãy đọc AGENTS.md, AI_HANDOFF_GUIDE.md và CODEX_HANDOFF.md. Kiểm tra trạng thái tệp hiện tại, bảo tồn mọi thay đổi đang có, tiếp tục nhiệm vụ và chạy kiểm thử phù hợp.
   ```

## Nội dung bắt buộc của tệp bàn giao

- Mục tiêu và phạm vi nhiệm vụ.
- Agent bàn giao và agent nhận quyền.
- Tiến độ đã hoàn thành và danh sách chính xác các tệp đã thay đổi.
- Các lệnh kiểm thử và kết quả thực tế.
- Lỗi, rủi ro, giả định chưa xác minh và việc còn lại.
- Xác nhận agent bàn giao đã dừng chỉnh sửa.

Agent nhận quyền phải kiểm tra trạng thái tệp trước khi chỉnh sửa. Không hoàn tác, ghi đè hoặc xóa thay đổi chưa được xác minh của agent trước. Khi phạm vi nhiệm vụ chưa rõ, chỉ kiểm tra và báo cáo cho đến khi người dùng giao việc cụ thể.
