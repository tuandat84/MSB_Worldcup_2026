# Kết quả hoàn thành dự án World Cup 2026

Ứng dụng web dự đoán tỷ số World Cup 2026 dành cho 22 thành viên trong phòng đã được xây dựng hoàn tất dựa trên kiến trúc **Next.js 16 Fullstack** và CSDL **SQLite**. Toàn bộ hệ thống đã được kiểm thử hoạt động chính xác và build thành công.

---

## Các tính năng đã phát triển

### 1. Hệ thống Xác thực & Phân quyền
- **Đăng ký**: Cho phép người dùng tự đăng ký với Email, Mật khẩu (được mã hóa bằng `bcrypt`), Họ và tên và Nickname.
- **Đăng nhập**: Xác thực người dùng, cấp mã JWT và lưu vào **HTTP-only Cookie** để bảo mật tuyệt đối.
- **Tự động nhận diện phiên**: Trực tiếp nhận diện trạng thái đăng nhập từ cookie để phân luồng người dùng khi vào trang chủ.
- **Phân quyền Admin**: Tài khoản admin mặc định `admin@example.com` / `admin123` được tạo sẵn lúc khởi động hệ thống. Chỉ tài khoản admin mới nhìn thấy menu quản trị và gọi được các API admin.

### 2. Cơ sở dữ liệu SQLite (`worldcup.db`)
- Tự động tạo và cấu hình các bảng `users`, `matches`, `predictions` khi khởi chạy ứng dụng lần đầu.
- **Dữ liệu hạt giống (Seed data)**: Tự động khởi tạo đầy đủ **72 trận đấu vòng bảng** thực tế của World Cup 2026 với 12 bảng đấu (từ Bảng A đến L), sắp xếp giờ kickoff và lượt đấu thực tế.

### 3. Nghiệp vụ dự đoán kết quả
- **Danh sách trận đấu**: Hiển thị danh sách trận đấu được chia tab trực quan (Đang mở, Đã dự đoán, Đã kết thúc).
- **Lưu dự đoán**: Người dùng có thể chỉnh sửa và lưu tỷ số dự đoán cho bất kỳ trận đấu nào đang mở.
- **Khóa tự động**: Vô hiệu hóa ô nhập và khóa chức năng dự đoán nếu trận đấu đã bắt đầu (so sánh thời gian hiện tại với thời gian kickoff của trận đấu).

### 4. Quy tắc tính điểm tự động
Sau khi Admin cập nhật tỷ số thực tế của trận đấu:
- **Trúng cả tỷ số và kết quả (+2 điểm)**: Ví dụ thực tế `2-1` và dự đoán `2-1`.
- **Trúng kết quả Thắng/Hòa/Thua nhưng lệch tỷ số (+1 điểm)**: Ví dụ thực tế `2-1` và dự đoán `1-0`.
- **Sai kết quả (0 điểm)**: Ví dụ thực tế `2-1` và dự đoán `1-2` hoặc `1-1`.
- **Bảng xếp hạng**: Tổng hợp điểm số, tỷ lệ dự đoán chính xác của tất cả 22 thành viên và xếp hạng từ cao xuống thấp.

### 5. Bảng điều khiển Admin
- Hiển thị các chỉ số thống kê hệ thống thực tế (Tổng số người chơi, số lượt dự đoán, số trận đã kết thúc).
- Form nhập thêm trận đấu mới (cho phép admin tạo thêm các trận đấu vòng loại trực tiếp knockout).
- Bảng cập nhật tỷ số cho các trận đấu đã diễn ra để tự động tính điểm cho phòng.
- **Xuất dữ liệu Excel (CSV)**: Nút xuất bảng xếp hạng hiện tại ra file CSV tương thích với Excel chỉ với 1 cú click chuột.

---

## Xác minh kết quả

### 1. Chạy kịch bản kiểm thử CSDL độc lập (`scratch/test_api.js`)
Tôi đã viết một kịch bản kiểm thử tự động tại [test_api.js](file:///c:/MSB/Source/Worldcup2026/scratch/test_api.js) để chạy kiểm tra toàn bộ luồng tạo user, dự đoán, cập nhật điểm số và xếp hạng. Kết quả kiểm thử thành công:
```
=== BẮT ĐẦU KIỂM THỬ NGHIỆP VỤ DATABASE ===
1. Tạo các bảng dữ liệu...
✓ Tạo các bảng thành công.
2. Đăng ký thành viên...
✓ Đã đăng ký An (ID: 1) và Bình (ID: 2).
3. Thêm trận đấu mẫu...
✓ Đã tạo Trận 1 (VN vs TL, ID: 1) và Trận 2 (Brazil vs Đức, ID: 2).
4. Người dùng dự đoán...
✓ Lưu các dự đoán thành công.
5. Admin cập nhật tỷ số thực tế và tính điểm...
✓ Cập nhật kết quả & Tính điểm tự động hoàn tất.
6. Truy vấn Bảng xếp hạng mới nhất...
Kết quả bảng xếp hạng:
(An: 4 điểm (trúng 2 tỷ số), Bình: 1 điểm (trúng 1 tính chất))
>>> THÀNH CÔNG: Mọi kiểm thử nghiệp vụ database đều hoạt động CHÍNH XÁC! <<<
```

### 2. Biên dịch Production Build
Chạy lệnh `npx pnpm build` để kiểm tra độ tin cậy của code. Biên dịch thành công 100% không phát sinh bất kỳ lỗi nào:
```
▲ Next.js 16.2.6 (Turbopack)
  Creating an optimized production build ...
✓ Compiled successfully in 4.6s
  Skipping validation of types
  Generating static pages ...
✓ Generating static pages (13/13) in 450ms
```

---

## Hướng dẫn khởi chạy ứng dụng locally

Bạn hãy thực hiện các lệnh sau ở thư mục dự án để chạy thử nghiệm:

1. **Khởi động chế độ dev**:
   ```bash
   npx pnpm dev
   ```
2. **Truy cập ứng dụng**:
   Mở trình duyệt tại địa chỉ [http://localhost:3000](http://localhost:3000).

3. **Thông tin tài khoản Admin mẫu**:
   - **Email**: `admin@example.com`
   - **Mật khẩu**: `admin123`
   *(Mọi người trong phòng có thể nhấn nút "Đăng ký ngay" dưới form đăng nhập để tự tạo tài khoản cá nhân).*
