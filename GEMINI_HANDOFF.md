# Bàn giao Codex → Gemini

Ngày: 2026-11-06 (Asia/Bangkok)

## Mục tiêu và phạm vi

Người dùng yêu cầu chuyển quyền triển khai Vạn Cổ Tu Tiên từ Codex sang Gemini theo hướng dẫn. Trong lượt này chưa có yêu cầu triển khai tính năng hoặc sửa lỗi cụ thể.

## Chủ sở hữu

- Bàn giao: Codex.
- Nhận quyền triển khai: Gemini trong Antigravity.
- Từ sau khi ghi tệp này, Codex dừng chỉnh sửa và chỉ đọc/đánh giá cho đến khi được chuyển quyền trở lại.

## Trạng thái và tệp thay đổi

- Không sửa mã nguồn ứng dụng trong lượt bàn giao này.
- Tạo `AI_HANDOFF_GUIDE.md` vì tệp được `AGENTS.md` viện dẫn nhưng không còn trong thư mục dự án. Nội dung khôi phục quy trình chuyển quyền từ bản hướng dẫn còn lưu ở workspace khác, điều chỉnh cho Vạn Cổ Tu Tiên.
- Tạo `GEMINI_HANDOFF.md` để ghi trạng thái chuyển quyền.
- Thư mục hiện tại không phải Git worktree (`git status --short` báo `fatal: not a git repository`), nên không thể đối chiếu các thay đổi có sẵn bằng Git. Các tệp ứng dụng hiện có: `index.html`, `css/styles.css`, `js/app.js`, `js/audio.js`, `js/canvas.js`, `js/data.js`, `js/tailwind.config.js`.
- Có `graphify-out/`; hãy kiểm tra dữ liệu Graphify còn phù hợp trước khi dựa vào nó.

## Kiểm thử đã chạy

- Chỉ kiểm tra sự hiện diện của tệp, nội dung quy tắc và trạng thái Git.
- Không chạy `npm run build` vì không thay đổi mã ứng dụng.
- Không chạy kiểm thử giao diện.

## Rủi ro và việc còn lại

- Chưa có nhiệm vụ tính năng cụ thể để Gemini tiếp tục. Gemini nên đợi yêu cầu triển khai của người dùng trước khi sửa mã.
- Không có kênh tích hợp để Codex gửi trực tiếp tin nhắn vào khung chat Gemini; người dùng cần chuyển lời nhắn trong hướng dẫn sang Gemini.
- Gemini cần đọc `AGENTS.md`, `AI_HANDOFF_GUIDE.md`, tệp này và kiểm tra trạng thái dự án trước khi thực hiện nhiệm vụ.

**Xác nhận:** Codex dừng chỉnh sửa sau khi ghi bàn giao này.
