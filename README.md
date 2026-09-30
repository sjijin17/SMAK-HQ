# 🤖 Discord Economy & Entertainment Bot

A production-grade, modular Discord economy and entertainment bot built with **Discord.js v14**, **Node.js 22+**, **remote Turso (libSQL)** SQL database, **Docker**, and **Google Cloud Run** compatibility.

This project is engineered as a robust technical foundation designed to run 24/7 in the cloud while persisting all data remotely in Turso—ensuring your server data remains completely intact even when your personal computer is turned off.

---

## 📋 Table of Contents

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Technology Stack](#2-technology-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project Architecture](#4-project-architecture)
5. [Discord Developer Portal Setup](#5-discord-developer-portal-setup)
6. [Privileged Gateway Intents (Critical)](#6-privileged-gateway-intents-critical)
7. [Turso Database Setup](#7-turso-database-setup)
8. [Environment Variables Configuration](#8-environment-variables-configuration)
9. [Local Installation & Development](#9-local-installation--development)
10. [Database Migrations](#10-database-migrations)
11. [Deploying Slash Commands](#11-deploying-slash-commands)
12. [Running the Bot](#12-running-the-bot)
13. [Available Commands (Milestone 1)](#13-available-commands-milestone-1)
14. [Git & GitHub Workflow (Beginner Guide)](#14-git--github-workflow-beginner-guide)
15. [Cloning the Repo into VS Code on macOS](#15-cloning-the-repo-into-vs-code-on-macos)
16. [Docker Containerization](#16-docker-containerization)
17. [Google Cloud Run Deployment](#17-google-cloud-run-deployment)
18. [Future Milestones Roadmap](#18-future-milestones-roadmap)
19. [Verification Checklist](#19-verification-checklist)

---

## 1. Project Overview & Purpose

The bot serves as an extensible entertainment, currency, and gamification system for Discord communities. 

### Current Milestone 1 (Foundation):
- **Discord Gateway Connection**: Discord.js v14 client with event and command dynamic loaders.
- **Remote Database**: Remote Turso (libSQL) SQL database with zero local SQLite file dependencies.
- **Multi-Tenant Users Schema**: SQL `users` table uniquely keyed by `(guild_id, discord_user_id)`.
- **Migration Architecture**: Automated SQL migration runner (`npm run db:migrate`).
- **Transactional Economy Service**: Centralized balance modification layer with atomicity guarantees.
- **REST Slash Command Registration**: Dedicated registration script (`npm run deploy:commands`).
- **Initial Slash Commands**: `/ping` and `/database-status` (Admin only).
- **Google Cloud Run Health Server**: HTTP server responding on `GET /health` with `status: ok` and service telemetry.
- **Modular Service Stubs**: Future systems (`earningService`, `arcadeService`, `robberyService`, `jailService`, `escapeRoomService`) cleanly mapped without requiring architectural rewrites.

---

## 2. Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js 22+** | Runtime environment supporting ES Modules and modern async APIs |
| **Discord.js v14** | Official Discord API client (Slash commands, Gateway WebSocket, embeds) |
| **Turso / libSQL** | Remote serverless SQLite cloud database (No local `.sqlite` files) |
| **Docker** | Containerization with multi-stage non-root user execution |
| **Google Cloud Run** | 24/7 cloud container runtime with HTTP health monitoring |
| **GitHub** | Version control and synchronization with macOS VS Code |

---

## 3. Prerequisites

Before running the project locally or deploying, ensure you have:
1. **Node.js 22.x or higher** installed on your MacBook (`node -v` to check).
2. **npm 10.x or higher** (`npm -v` to check).
3. A **Discord Account** with permission to create applications and invite bots to a test server.
4. A free **Turso Account** at [https://turso.tech](https://turso.tech) or the Turso CLI installed.
5. **Git** installed on macOS (`git --version` to check).
6. **Visual Studio Code** installed.

---

## 4. Project Architecture

```
discord-economy-bot/
├── src/
│   ├── index.js                  # Bot lifecycle, Gateway connection & HTTP health server
│   │
│   ├── commands/                 # Slash command modules (dynamically discovered)
│   │   ├── general/
│   │   │   └── ping.js           # /ping latency command
│   │   ├── admin/
│   │   │   └── database-status.js # /database-status (Admin only Turso check)
│   │   ├── economy/              # [Roadmap] /balance, /pay, /daily
│   │   ├── arcade/               # [Roadmap] /arcade mini-games
│   │   ├── robbery/              # [Roadmap] /rob @member
│   │   ├── jail/                 # [Roadmap] /jail status, /jail bail
│   │   ├── shop/                 # [Roadmap] /shop, /inventory
│   │   └── escape/               # [Roadmap] /escape room weekly challenge
│   │
│   ├── events/                   # Discord gateway event handlers
│   │   ├── ready.js              # Bot presence & startup confirmation
│   │   ├── interactionCreate.js  # Slash commands, button, modal & select router
│   │   ├── messageCreate.js      # Message gateway listener
│   │   └── errorHandlers.js      # Global unhandled rejection & shard monitoring
│   │
│   ├── services/                 # Business logic & persistent operations
│   │   ├── economyService.js     # Centralized balance & transaction methods
│   │   ├── earningService.js     # Camera roll & chat activity evaluation stubs
│   │   ├── arcadeService.js      # Mini-game attempt tracking stubs
│   │   ├── robberyService.js     # Robbery probability & cooldown stubs
│   │   ├── jailService.js        # Jail sentence & Discord timeout stubs
│   │   └── escapeRoomService.js  # Weekly random 3-player selection stubs
│   │
│   ├── database/                 # Remote Turso SQL database layer
│   │   ├── client.js             # libSQL remote client singleton & parameterized helpers
│   │   ├── schema.sql            # Master database schema declaration
│   │   ├── migrate.js            # Automated migration execution runner
│   │   └── migrations/           # Numbered SQL migration files
│   │       └── 001_initial_schema.sql
│   │
│   ├── games/                    # Future mini-game engine modules
│   │
│   ├── config/                   # Configuration management
│   │   ├── environment.js        # Validated env vars with secret protection
│   │   └── defaults.js           # Centralized gameplay & system defaults
│   │
│   └── utils/                    # Core utilities
│       ├── logger.js             # Formatted logs with automatic secret redaction
│       ├── errors.js             # Custom error hierarchy & safe Discord responses
│       └── validators.js         # Snowflake IDs, URLs, and currency validators
│
├── scripts/
│   └── deploy-commands.js        # Discord REST API slash command registrar
│
├── package.json                  # Scripts & dependencies
├── Dockerfile                    # Production container image for Google Cloud Run
├── .dockerignore                 # Excludes local files from Docker builds
├── .gitignore                    # Prevents .env and credentials from being committed
├── .env.example                  # Template configuration without secrets
└── README.md                     # Comprehensive documentation
```

---

## 5. Discord Developer Portal Setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** in the top right.
3. Enter a name (e.g. `Server Economy Bot`) and click **Create**.
4. Go to the **Bot** tab on the left navigation bar:
   - Click **Reset Token** (or **Add Bot** if prompted).
   - **Copy the Token** immediately. This is your `DISCORD_TOKEN`. (Never share this!).
5. Go to the **OAuth2** tab on the left:
   - Copy the **Client ID**. This is your `CLIENT_ID`.
6. Invite the Bot to your Test Server:
   - In **OAuth2** -> **URL Generator**:
   - Check Scopes: `bot`, `applications.commands`.
   - Check Bot Permissions:
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Read Message History`
     - `Moderate Members` *(Required for timeouts when jailing)*
     - `Use Slash Commands`
   - Copy the generated URL at the bottom, paste it into your browser, select your server, and authorize the bot.

---

## 6. Privileged Gateway Intents (Critical)

Discord requires explicit permission in the Developer Portal for bots to access certain real-time events.

### How to Enable Privileged Intents:
1. In the [Discord Developer Portal](https://discord.com/developers/applications), select your application.
2. Click the **Bot** tab on the left.
3. Scroll down to the section titled **Privileged Gateway Intents**.
4. Toggle **ON** both:
   - **SERVER MEMBERS INTENT** (`GatewayIntentBits.GuildMembers`)
     - *Why needed:* Required for fetching members to apply Discord timeouts (`member.timeout()`) during jail events and managing member-specific balance accounts.
   - **MESSAGE CONTENT INTENT** (`GatewayIntentBits.MessageContent`)
     - *Why needed:* Required for inspecting incoming photo attachments in the Camera Roll channel and evaluating chat activity without relying on bot mentions.
5. Click **Save Changes** at the bottom of the screen.

> ⚠️ **Note:** If you run the bot without enabling these in the portal, the bot startup will clearly notify you with error code `DisallowedIntents`.

---

## 7. Turso Database Setup

This project uses **Turso**, a remote distributed SQLite/libSQL database. Your data is stored securely in the cloud and persists 24/7.

### Option A: Using Turso Web Dashboard (Simplest)
1. Go to [https://turso.tech](https://turso.tech) and log in with GitHub.
2. Click **Create Database**. Name it `discord-economy-db`.
3. Choose a region closest to your Discord server or Cloud Run host.
4. Once created, copy the **Database URL** (e.g., `libsql://discord-economy-db-yourusername.turso.io`).
5. Click **Create Token** -> Generate an auth token.
6. Copy the token. This is your `TURSO_AUTH_TOKEN`.

### Option B: Using Turso CLI on macOS
```bash
# 1. Install Turso CLI via Homebrew
brew install tursodatabase/tap/turso

# 2. Authenticate
turso auth login

# 3. Create a remote database
turso db create discord-economy-db

# 4. View the connection URL
turso db show discord-economy-db --url

# 5. Generate a persistent authentication token
turso db tokens create discord-economy-db
```

---

## 8. Environment Variables Configuration

In the project root, create a file named `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` in VS Code and fill in your credentials:

```ini
# ==========================================
# Discord Economy & Entertainment Bot - Config
# ==========================================

# Discord Bot Credentials
DISCORD_TOKEN=MTE5OTg...your_discord_bot_token_here...
CLIENT_ID=123456789012345678
GUILD_ID=987654321098765432

# Turso / libSQL Remote Database
TURSO_DATABASE_URL=libsql://discord-economy-db-yourusername.turso.io
TURSO_AUTH_TOKEN=eyJh...your_turso_auth_token_here...

# Server & Runtime Configuration
PORT=8080
NODE_ENV=development
```

> 💡 **Tip for GUILD_ID:** In Discord, enable User Settings -> Advanced -> **Developer Mode**. Right-click your server icon and click **Copy Server ID**. Providing `GUILD_ID` allows instant slash command registration without waiting for global cache propagation!

---

## 9. Local Installation & Development

Open your Terminal in the project root:

```bash
# 1. Install all required dependencies
npm install
```

---

## 10. Database Migrations

Before starting the bot for the first time, execute the SQL migration runner to provision the `users` table on Turso:

```bash
npm run db:migrate
```

### What this does:
- Connects securely to remote Turso over encrypted HTTPS/libSQL.
- Creates the `_migrations` tracking table if it doesn't already exist.
- Applies `001_initial_schema.sql` (creates `users` table and composite indexes).
- Records the migration name so it is never re-run.

### How to Create Future Migrations:
1. Create a new file in `src/database/migrations/` following the naming convention:
   `002_create_transactions_table.sql`
2. Add your SQL statements separated by semicolons.
3. Run `npm run db:migrate`. The runner automatically applies only new migrations!

---

## 11. Deploying Slash Commands

Before users can see `/ping` and `/database-status` in Discord, register them using the deployment script:

```bash
npm run deploy:commands
```

Output:
```
🚀 Discord Slash Command Deployment Script
🔍 Found 2 command file(s) across commands subdirectories.
  ✓ Loaded command: /ping (general/ping.js)
  ✓ Loaded command: /database-status (admin/database-status.js)
📡 Registering 2 slash command(s) with Discord API...
Targeting Guild ID: 987654321098765432 (Instant deployment)
✅ Successfully registered 2 guild slash command(s)!
🎉 Deployment complete. Commands are ready in Discord!
```

---

## 12. Running the Bot

### For Local Development (with auto-reload on file edits):
```bash
npm run dev:bot
```
*(Uses Node.js 22 built-in `--watch` flag to restart automatically when code changes).*

### For Production Mode:
```bash
npm start
```

Upon launching, the terminal will log:
```
[INFO]  🤖 Starting Discord Economy & Entertainment Bot
[INFO]  HTTP Health Server listening on port 8080 (Health check at GET /health)
[INFO]  Testing connection to remote Turso database...
[INFO]  Turso remote database client initialized successfully.
[INFO]  Turso database connection verified! Latency: 42ms
[INFO]  Loading slash commands from .../src/commands...
[INFO]  Successfully loaded 2 slash command(s).
[INFO]  Loading event handlers from .../src/events...
[INFO]  Connecting Discord bot to Discord Gateway...
[INFO]  Discord Bot connected successfully as Server Economy Bot#1234
[INFO]  Active in 1 server(s).
```

You can test the HTTP health check endpoint in a separate terminal:
```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "uptimeSeconds": 12,
  "timestamp": "2026-09-30T09:45:00.000Z",
  "bot": {
    "status": "connected",
    "user": "Server Economy Bot#1234",
    "guildCount": 1
  },
  "database": {
    "connected": true,
    "latencyMs": 38,
    "type": "Turso/libSQL (Remote)"
  }
}
```

---

## 13. Available Commands (Milestone 1)

### 1. `/ping`
- **Permissions:** Available to all server members.
- **Description:** Checks bot responsiveness, round-trip message latency, and Discord WebSocket ping.
- **Response:**
  > 🏓 **Pong! Bot is online.**  
  > ⏱️ **Roundtrip Latency:** 54ms  
  > 📡 **Discord Gateway:** 28ms  

### 2. `/database-status`
- **Permissions:** Administrator only (`PermissionFlagsBits.Administrator`).
- **Description:** Verifies remote communication with Turso and checks foundation row counts.
- **Response (Ephemeral):**
  > ✅ **Turso Database Status: Operational & Connected**  
  > ⚡ **Latency:** 41ms  
  > 📦 **Applied Migrations:** 1  
  > 👥 **Registered Member Accounts:** 0  
  > 🔒 **Storage Type:** Remote libSQL / Turso Cloud (Zero local SQLite files)  

---

## 14. Git & GitHub Workflow (Beginner Guide)

Follow these exact Terminal steps to commit and push this repository to GitHub:

### Step 1: Create a New Empty Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Enter a repository name: `discord-economy-bot`.
3. Set visibility to **Private** (or Public).
4. **Do NOT check** "Initialize this repository with a README" (we already have a complete one).
5. Click **Create repository**.
6. Copy your repository URL (e.g. `https://github.com/your-username/discord-economy-bot.git`).

### Step 2: Initialize Git and Commit
In your terminal inside the project directory:

```bash
# 1. Initialize local git repository (if not already initialized)
git init

# 2. Stage all project files (ignoring secrets defined in .gitignore)
git add .

# 3. Create your initial commit
git commit -m "feat: initial foundation with Discord.js v14, Turso libSQL, and Cloud Run support"

# 4. Ensure your default branch is named 'main'
git branch -M main

# 5. Link your local project to your GitHub repository
# (REPLACE with your actual GitHub URL!)
git remote add origin https://github.com/your-username/discord-economy-bot.git

# 6. Push your project to GitHub
git push -u origin main
```

---

## 15. Cloning the Repo into VS Code on macOS

Once your repository is pushed to GitHub, you can clone and work on it on your MacBook:

```bash
# 1. Open Terminal on your Mac and navigate to your projects folder
cd ~/Desktop

# 2. Clone the repository from GitHub
git clone https://github.com/your-username/discord-economy-bot.git

# 3. Enter the project folder
cd discord-economy-bot

# 4. Open in VS Code
code .
```

### In VS Code:
1. Open the integrated terminal (`Ctrl + ~` or `Terminal` -> `New Terminal`).
2. Run `npm install` to install packages.
3. Create your `.env` file: `cp .env.example .env` and fill in credentials.
4. Run `npm run db:migrate` to connect to Turso.
5. Run `npm run deploy:commands` to register slash commands.
6. Run `npm run dev:bot` to start coding!

---

## 16. Docker Containerization

The included `Dockerfile` builds a lightweight, production-ready Alpine Linux image running under a non-root user.

### To Build and Run with Docker Locally:

```bash
# Build Docker image
docker build -t discord-economy-bot .

# Run Docker container with environment file
docker run -p 8080:8080 --env-file .env discord-economy-bot
```

---

## 17. Google Cloud Run Deployment

Google Cloud Run allows you to deploy containerized applications that run continuously.

### Important Architectural Design Note:
- Traditional web applications on Cloud Run scale down to 0 instances when no HTTP requests arrive.
- **Discord bots require an uninterrupted Gateway WebSocket connection.**
- Therefore, when deploying to Cloud Run, you must configure **Minimum instances = 1** (`--min-instances 1`) and **CPU Allocation = CPU always allocated** (`--no-cpu-throttling`).
- The bot includes an HTTP health check on port `8080` (`GET /health`) specifically so Cloud Run container health probes succeed.

### Deploying via Google Cloud CLI (`gcloud`):

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Build and submit container image to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/discord-economy-bot

# 3. Deploy to Cloud Run with 1 persistent instance and always-on CPU
gcloud run deploy discord-economy-bot \
  --image gcr.io/YOUR_PROJECT_ID/discord-economy-bot \
  --platform managed \
  --region us-central1 \
  --port 8080 \
  --min-instances 1 \
  --max-instances 1 \
  --no-cpu-throttling \
  --set-env-vars NODE_ENV=production \
  --set-env-vars TURSO_DATABASE_URL=your_turso_url \
  --set-env-vars TURSO_AUTH_TOKEN=your_turso_token \
  --set-env-vars DISCORD_TOKEN=your_discord_token \
  --set-env-vars CLIENT_ID=your_client_id \
  --set-env-vars GUILD_ID=your_guild_id
```

---

## 18. Future Milestones Roadmap

The architecture is built so all future systems plug directly into existing services without refactoring:

| System | Target Service | Key Planned Features |
| :--- | :--- | :--- |
| **Activity Earning** | `earningService.js` | Camera Roll photo bonus, spam hash check, chat cooldowns |
| **Arcade Mini-Games** | `arcadeService.js` | Lucky Spin, Quick Math, Number Guess, daily limit tracking |
| **Robbery** | `robberyService.js` | `/rob @target`, 24h limit, success calculations, SQL audit |
| **Shop & Inventory** | `economyService.js` | In-server store, item probability modifiers |
| **Jail & Timeouts** | `jailService.js` | Robbery & Secret-rule tiers, Discord server timeouts, bail |
| **Secret Rule** | `jailService.js` | Covert forbidden phrase detection with automated timeout |
| **Escape Room** | `escapeRoomService.js` | Weekly 3-player team selection, pay-to-skip, interactive puzzles |

---

## 19. Verification Checklist

Use this checklist to confirm the foundation is functioning:

- [ ] `.env` created with valid `DISCORD_TOKEN`, `CLIENT_ID`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
- [ ] Privileged Intents enabled in Discord Developer Portal (Server Members & Message Content).
- [ ] `npm run db:migrate` runs and logs `Applied 1 migration(s)`.
- [ ] `npm run deploy:commands` registers `/ping` and `/database-status`.
- [ ] `npm start` connects to Discord Gateway without warnings.
- [ ] `curl http://localhost:8080/health` returns `status: ok` and `database.connected: true`.
- [ ] Typing `/ping` in your Discord server returns the bot's latency.
- [ ] Typing `/database-status` as an Administrator verifies the remote Turso database.
- [ ] `.gitignore` prevents `.env` from ever being staged in Git.
