# Natasun Chat

A lightweight, multi-tenant live chat system for your websites — built by **Natasun**.

Easily embed a branded chat widget on any website, manage conversations and agents from a single dashboard, and scale to many websites with independent agents, locales, and branding.

## Features

- **Multi-tenant** — register unlimited websites, each with its own agents, branding, and conversations.
- **Branded widget** — a tiny vanilla-JS widget that matches your site's color and logo.
- **Real-time chat** — powered by Socket.IO (WebSockets) with typing indicators and read receipts.
- **Agent dashboard** — inbox, conversation assignment, close/archive, unread counts, and agent management.
- **Subscription-ready** — the schema includes a `Subscription` model so you can sell plans later.
- **Portable deployment** — run on your own VPS, Railway, Render, Fly.io, or split between Vercel + a WebSocket host.

## Tech Stack

- **Next.js 16** (App Router) — dashboard + API routes
- **Prisma ORM** + **MySQL** (switch to PostgreSQL by changing one line)
- **Socket.IO** — real-time messaging
- **MUI v6** — UI (Natasun green branding)

---

## Deployment to Your Server (Docker)

### First time: set up the server

On your server (AlmaLinux, Ubuntu, or any Linux):

```bash
# Clone the repo
cd /opt
git clone https://github.com/YOUR_USERNAME/natasun-chat.git
cd natasun-chat

# Create your .env (real secrets)
cp .env.example .env
nano .env   # paste your real DATABASE_URL, secrets, public URLs, etc.

# Build and start
docker compose up -d --build
```

That's it. The container will:
1. Build the Next.js app + WebSocket server
2. Apply database schema automatically on startup (`prisma db push`)
3. Run both servers inside a single container

Dashboard is at `http://<your-server-ip>:3000`.

### Every time you update code (one command)

```bash
cd /opt/natasun-chat
./scripts/deploy.sh
```

This will:
1. `git pull` the latest code from GitHub
2. Rebuild the Docker container
3. Restart with zero downtime

Your `.env` file on the server is **never overwritten** — it's safe to run this repeatedly.

### If you reinstall the server

```bash
# On fresh server
cd /opt
git clone https://github.com/YOUR_USERNAME/natasun-chat.git
cd natasun-chat
# Recreate .env with your secrets (copy from backup or paste manually)
nano .env
docker compose up -d --build
```

The database lives on `162.244.93.7` (external), so your conversations survive a server reinstall.

---

## GitHub: what's safe to push

**Safe to push (code only):**
- `src/`, `prisma/`, `public/`, `scripts/`
- `Dockerfile`, `docker-compose.yml`
- `.env.example`, `.gitignore`, `.gitattributes`, `README.md`
- `package.json`, `package-lock.json`, `tsconfig.json`, etc.

**Never pushed (gitignored):**
- `.env`, `.env.local` — contains your real secrets
- `node_modules/`, `.next/`, `dist/`

To push to GitHub:

```bash
# Initialize and push
git remote add origin https://github.com/YOUR_USERNAME/natasun-chat.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

The `.env` file stays **only on your server**, not in git.

---

## Embedding the Widget

In the dashboard **Settings** page, copy the generated snippet and paste it into your website's `<head>`:

```html
<!-- Natasun Chat Widget -->
<script>
  (function(window,document) {
    var t = document.currentScript || document.scripts[document.scripts.length-1];
    var s = document.createElement('script');
    s.async = true;
    s.src = "https://your-server-ip:3000/widget.js";
    s.setAttribute('data-domain', "yourdomain.com");
    s.setAttribute('data-base-url', "https://your-server-ip:3000");
    s.setAttribute('data-ws-url', "wss://your-server-ip:3001");
    s.setAttribute('data-color', "#00A76F");
    t.parentNode.insertBefore(s, t);
  })(window, document);
</script>
```

Replace the URLs with your actual server address. For production, add a domain + reverse proxy (Caddy or Nginx) with SSL.

---

## Other Deployment Options

### Vercel + separate WebSocket host

Deploy the Next.js app to **Vercel**, run just the WebSocket server on Railway/Fly.io/your server.

```
web  (Vercel)         -> dashboard, API, static widget files
ws   (Railway/Render) -> Socket.IO WebSocket server
```

Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_WS_URL` on each.

### Railway / Render / Fly.io

Deploy the same repo directly. Set the env vars in the platform dashboard.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `SESSION_SECRET` | ✅ | Long random string for auth tokens |
| `WS_PORT` | optional | WebSocket server port (default: 3001) |
| `ALLOWED_ORIGINS` | optional | Comma-separated allowed origins (default: `*`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the dashboard (e.g. `https://chat.example.com`) |
| `NEXT_PUBLIC_WS_URL` | ✅ | Public URL of the WebSocket server |
| `SMTP_HOST` | optional | Email notifications |

---

## Project Structure

```
├── prisma/
│   └── schema.prisma           # Multi-tenant data model
├── public/
│   ├── widget.js               # Embeddable chat widget (vanilla JS)
│   └── socket.io-client.js
├── scripts/
│   ├── deploy.sh               # One-command deploy/update
│   └── server-setup.sh         # One-time server setup
├── Dockerfile                  # Production container
├── docker-compose.yml
└── src/
    ├── app/
    │   ├── api/                # REST API routes
    │   │   ├── onboarding/     # Create workspace + first agent
    │   │   ├── auth/login/     # Login
    │   │   ├── conversations/  # Agent inbox data
    │   │   ├── agents/         # Manage team members
    │   │   ├── website/        # Settings API
    │   │   └── widget/init/    # Widget initialization (visitor side)
    │   ├── dashboard/          # Agent admin UI
    │   │   ├── inbox/          # Chat interface
    │   │   ├── agents/         # Team management
    │   │   └── settings/       # Widget install snippet
    │   ├── login/              # Login page
    │   └── onboarding/         # Create-workspace page
    ├── lib/
    │   ├── prisma.ts           # Prisma client singleton
    │   ├── auth.ts             # JWT-based sessions
    │   └── store.ts            # Zustand state (conversations, socket)
    ├── server/
    │   └── ws-server.ts        # Socket.IO real-time server
    └── theme/
        └── theme-provider.tsx  # MUI theme (Natasun branding)
```

---

## Local Development

```bash
# Install
npm install

# Push schema to database
npx prisma db push

# Run (two terminals)
npm run dev     # Dashboard + API on :3000
npm run ws      # WebSocket on :3001
```

---

## Roadmap

- Email / WhatsApp / social channels
- AI assistant (agent suggestions + bot replies)
- Help center / knowledge base
- Subscription billing (Stripe)
- Translation / locale-aware dashboard
- Visitor analytics
