# Deploy MSB WorldCup 2026 lên Railway

## Yêu cầu

- Tài khoản [Railway](https://railway.com)
- Repo GitHub: `https://github.com/tuandat84/MSB_Worldcup_2026`
- (Tùy chọn) API key API-Football, OpenAI

## Bước 1 — Đẩy code lên GitHub

Đảm bảo code mới nhất (Dockerfile, `railway.toml`) đã có trên GitHub.

## Bước 2 — Tạo project trên Railway

1. Vào [railway.com/new](https://railway.com/new)
2. Chọn **Deploy from GitHub repo**
3. Chọn repo `tuandat84/MSB_Worldcup_2026`
4. Railway tự nhận `Dockerfile` và `railway.toml`

## Bước 3 — Gắn Volume (quan trọng)

SQLite và avatar cần ổ đĩa bền:

1. Trong project → **+ New** → **Volume**
2. Gắn volume vào service app
3. **Mount path:** `/data`
4. Deploy lại service

`DATA_DIR=/data` đã cấu hình sẵn trong Dockerfile.

## Bước 4 — Biến môi trường

Vào service → **Variables**, thêm:

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `JWT_SECRET` | Có | Chuỗi ngẫu nhiên dài (session đăng nhập) |
| `CRON_SECRET` | Khuyến nghị | Bảo vệ `/api/cron/sync-matches` |
| `API_FOOTBALL_KEY` | Không | Tự động cập nhật tỷ số chính xác hơn |
| `OPENAI_API_KEY` | Không | AI phân tích trận |

`DATA_DIR` và `NODE_ENV` đã có trong Dockerfile.

## Bước 5 — Domain public

1. Service → **Settings** → **Networking**
2. **Generate Domain** → nhận URL dạng `xxx.up.railway.app`
3. (Tùy chọn) Thêm custom domain + HTTPS tự động

## Bước 6 — Cron cập nhật tỷ số (mỗi 15 phút)

Railway không chạy `vercel.json` cron. Dùng một trong hai cách:

### Cách A — Railway Cron (nếu có trên plan)

Tạo Cron Job gọi:

```
GET https://<domain-cua-ban>/api/cron/sync-matches
Header: Authorization: Bearer <CRON_SECRET>
```

Lịch: `*/15 * * * *`

### Cách B — cron-job.org (miễn phí)

1. Đăng ký [cron-job.org](https://cron-job.org)
2. Tạo job URL trên, method GET
3. Header: `Authorization: Bearer <CRON_SECRET>`
4. Mỗi 15 phút

## Bước 7 — Kiểm tra sau deploy

1. Mở URL Railway → trang đăng nhập hiện ra
2. Đăng ký tài khoản hoặc admin mặc định:
   - Email: `admin@example.com`
   - Mật khẩu: `admin123` → **đổi ngay sau khi vào**
3. Kiểm tra 72 trận trong lịch thi đấu
4. Upload avatar thử
5. Gọi thử cron (hoặc đợi user vào trang — sync mỗi 5 phút)

## Migrate DB từ máy local (tùy chọn)

Nếu đã có `worldcup.db` local với user/dự đoán:

1. Railway CLI: `npm i -g @railway/cli` → `railway login`
2. `railway link` chọn project
3. Copy file lên volume (qua shell hoặc backup/restore tùy Railway UI)

Hoặc để app tự seed 72 trận mới trên volume trống.

## Chi phí tham khảo

- Railway có gói trial / hobby — volume và runtime tính theo usage
- Volume ~ vài trăm MB là đủ cho SQLite + avatar

## Xử lý lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Build fail `sqlite3` | Dockerfile đã cài `python3 make g++` |
| Mất dữ liệu sau redeploy | Chưa gắn volume `/data` |
| Cron 401 | Sai `CRON_SECRET` hoặc thiếu header Authorization |
| Avatar không hiện | Kiểm tra volume + route `/api/uploads/avatars/...` |
