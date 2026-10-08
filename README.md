# NalaNeo Backend Tester

Paket ini adalah dashboard klasik untuk menguji backend milik sendiri.

## File
- `public/index.html` — tampilan
- `public/css/style.css` — CSS
- `public/js/app.js` — JavaScript frontend
- `server.js` — backend Node.js sederhana
- `package.json` — konfigurasi start

## Password awal
`NalaNeo`

Lebih aman menggantinya lewat environment variable:

```bash
ADMIN_PASSWORD=PasswordBaru node server.js
```

## Jalankan lokal

```bash
npm start
```

Lalu buka:

`http://localhost:3000`

## Endpoint
Health check:
`GET /health`

Service test:
- `POST /test/tiktok`
- `POST /test/youtube`
- `POST /test/instagram`
- `POST /test/spotify`

Endpoint yang dimasukkan di dashboard default:
`https://backend.vercel.app/backend-api`

Catatan:
Paket ini sengaja tidak memakai API downloader pihak ketiga. Route service saat ini adalah tester/health route, bukan resolver media. Untuk membuat downloader nyata, backend perlu implementasi resolver yang sah untuk konten publik yang memang boleh diunduh. Jangan menaruh secret/API key di `index.html`.
