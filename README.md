# img2svg — Image to SVG Vectorizer

Ứng dụng web chuyển ảnh phác thảo đen trắng thành vector SVG, chạy hoàn toàn trên trình duyệt (không cần backend hay API key).

## Yêu cầu

- Node.js 18+

## Chạy local

```bash
pnpm install
pnpm dev
```

Mở http://localhost:7771

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `pnpm dev` | Dev server (port 3000) |
| `pnpm build` | Build production → `dist/` |
| `pnpm preview` | Xem bản build |
| `pnpm lint` | Kiểm tra TypeScript |
| `pnpm clean` | Xóa thư mục `dist/` |

## Tài liệu chi tiết

Xem [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — pipeline vector hóa, cấu trúc thư mục, tham số UI.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (animation)
- Lucide React (icons)

## License

Apache-2.0 (theo SPDX header trong source)
