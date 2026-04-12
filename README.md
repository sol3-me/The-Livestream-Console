# The Livestream Console

A web app to help manage your YouTube live streams — view, create, edit, stop, and delete broadcasts and manage playlists, all from one place.

**Live:** <https://livestream.sol3.me>

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React Server Components)
- **Auth:** [NextAuth.js (Auth.js)](https://authjs.dev/) with Google OAuth
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **YouTube integration:** [YouTube Data API v3](https://developers.google.com/youtube/v3) via `googleapis`
- **Runtime:** Node.js ≥ 24
- **Deployment:** Docker (standalone output) → self-hosted runner via GitHub Actions

## Getting Started

### Prerequisites

- Node.js ≥ 24
- A [Google Cloud Console](https://console.cloud.google.com/) project with the YouTube Data API v3 enabled and OAuth 2.0 credentials configured

### Installation

```bash
git clone https://github.com/sol3-me/The-Livestream-Console.git
cd The-Livestream-Console
npm install
```

### Configuration

Copy the example env file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables (see `.env.local.example`):

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` for local dev |

### Development

```bash
npm run dev
```

The app will be available at <http://localhost:3000>.

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up --build
```

See [`docker-compose.yml`](docker-compose.yml) for full details.

## Legacy App

The original version of The Livestream Console was a monolithic Node.js/Express application using server-rendered Handlebars templates, Bootstrap 5, and cookie-based OAuth. That codebase has been preserved in the [`tlc-legacy/`](tlc-legacy/) directory for reference. The current app is a ground-up rewrite using the modern stack described above.

## Contributing

Contributions, ideas, and feedback are welcome. Feel free to open an issue or contact me at admin@sol3.me.

## License

[GNU General Public License v3.0](LICENSE)

Please credit me if you use this for your own projects.
