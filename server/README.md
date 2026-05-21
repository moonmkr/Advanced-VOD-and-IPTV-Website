IPTV Ultimate+ - Backend

Quick start:

1. Install dependencies

```bash
cd server
npm install
```

2. Start server

```bash
npm run start
```

The server runs on port 3000 by default and exposes:

- `POST /api_handler.php?action=...` compatibility endpoint for the frontend.
- `POST /api/v1/admin/ingest/m3u` to ingest M3U URLs.
- `POST /api/v1/admin/ingest/xtream` to ingest Xtream provider.
- `POST /api/v1/admin/subscriber` to create a subscriber.
- `POST /api/v1/auth/login` to authenticate and receive a JWT.
- `GET /api/v1/playlist/:username` to download an M3U playlist for a user.

Data is persisted to `server/data/db.json`.
