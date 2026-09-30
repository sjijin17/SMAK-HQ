import React, { useState } from 'react';
import {
  Terminal,
  Database,
  Bot,
  ShieldCheck,
  Server,
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Coins,
  Gamepad2,
  Lock,
  DoorOpen,
  KeyRound,
  FileCode,
  AlertTriangle
} from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
}

function CodeSnippet({ code }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/90 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-slate-400">
        <span>terminal</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          title="Copy command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-emerald-300 overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'commands' | 'setup' | 'cloudrun'>('architecture');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Discord Economy & Entertainment Bot</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Foundation Milestone 1 Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Discord.js v14 • Node.js 22 • Turso Remote libSQL • Docker • Cloud Run Compatible
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Health Endpoint: <code className="text-indigo-300">GET /health</code>
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-slate-800 bg-slate-900/30 px-6 flex gap-1">
        {[
          { id: 'architecture', label: 'Architecture & Files', icon: Layers },
          { id: 'database', label: 'Turso SQL & Schema', icon: Database },
          { id: 'commands', label: 'Commands & Events', icon: Terminal },
          { id: 'setup', label: 'Local & GitHub Workflow', icon: Code2 },
          { id: 'cloudrun', label: 'Docker & Cloud Run', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* TAB 1: ARCHITECTURE & FILES */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="text-white block mb-0.5">Strict Production Foundation Requirements Met</strong>
                This codebase has been cleanly partitioned into modular services, dynamic command loaders, remote Turso database abstraction, and a Cloud Run compatible HTTP health server. No local SQLite files, no monolithic files, and zero hardcoded secrets.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
                  <Database className="w-4 h-4" /> Remote Turso libSQL
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  All member balances, accounts, and migrations reside in Turso cloud. No local SQLite file exists.
                </p>
                <div className="text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1">
                  <div>src/database/client.js</div>
                  <div>src/database/schema.sql</div>
                  <div>src/database/migrate.js</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                  <Terminal className="w-4 h-4" /> Dynamic Slash & Events
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Auto-discovers commands recursively. No manual imports in index.js. REST registration script included.
                </p>
                <div className="text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1">
                  <div>scripts/deploy-commands.js</div>
                  <div>src/commands/general/ping.js</div>
                  <div>src/commands/admin/database-status.js</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                  <Cpu className="w-4 h-4" /> 24/7 Cloud Run Ready
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Containerized via Dockerfile. HTTP health endpoint on port 8080 with graceful SIGTERM/SIGINT handlers.
                </p>
                <div className="text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1">
                  <div>Dockerfile & .dockerignore</div>
                  <div>GET /health HTTP probe</div>
                  <div>src/index.js lifecycle</div>
                </div>
              </div>
            </div>

            {/* Service Map */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" /> Modular Service Architecture
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                All future systems plug into predefined services with established contracts, so no rebuilding is required.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                    <Coins className="w-3.5 h-3.5" /> economyService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Single source of truth for all balances. Atomic transfers, account creation, and validation.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
                    <Gamepad2 className="w-3.5 h-3.5" /> earningService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Future Camera Roll attachment detection, anti-spam photo hash, and qualifying chat evaluation.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-400 mb-1">
                    <Cpu className="w-3.5 h-3.5" /> arcadeService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Daily attempt limit tracker and rewards dispatcher for Lucky Spin, Quick Math, High Card.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-400 mb-1">
                    <Lock className="w-3.5 h-3.5" /> robberyService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Daily 24h heist limits, shop inventory probability modifiers, and permanent SQL audit logging.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
                    <KeyRound className="w-3.5 h-3.5" /> jailService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Two-tier jail enforcement, Discord timeouts via member.timeout(), and secret rule scanner.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-400 mb-1">
                    <DoorOpen className="w-3.5 h-3.5" /> escapeRoomService.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Weekly 3-player team randomizer, pay-to-skip mechanism, and team puzzle coordination.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TURSO SQL & SCHEMA */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" /> Turso Remote Database & Migration System
                  </h2>
                  <p className="text-xs text-slate-400">
                    The bot connects exclusively to Turso over remote HTTPS/libSQL. No local SQLite file exists.
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  npm run db:migrate
                </span>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
                <div className="text-slate-500">// src/database/schema.sql</div>
                <div className="text-indigo-300">
                  CREATE TABLE IF NOT EXISTS _migrations (<br />
                  &nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT,<br />
                  &nbsp;&nbsp;name TEXT NOT NULL UNIQUE,<br />
                  &nbsp;&nbsp;applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP<br />
                  );
                </div>
                <div className="text-emerald-300">
                  CREATE TABLE IF NOT EXISTS users (<br />
                  &nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT,<br />
                  &nbsp;&nbsp;discord_user_id TEXT NOT NULL,<br />
                  &nbsp;&nbsp;guild_id TEXT NOT NULL,<br />
                  &nbsp;&nbsp;balance INTEGER NOT NULL DEFAULT 0,<br />
                  &nbsp;&nbsp;created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,<br />
                  &nbsp;&nbsp;updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,<br />
                  &nbsp;&nbsp;CONSTRAINT uq_guild_member UNIQUE (guild_id, discord_user_id),<br />
                  &nbsp;&nbsp;CONSTRAINT chk_balance_non_negative CHECK (balance &gt;= 0)<br />
                  );
                </div>
                <div className="text-amber-300">
                  CREATE INDEX IF NOT EXISTS idx_users_guild_discord ON users (guild_id, discord_user_id);<br />
                  CREATE INDEX IF NOT EXISTS idx_users_guild_balance ON users (guild_id, balance DESC);
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="font-semibold text-white mb-1">Multi-Tenant by Design</div>
                  <p className="text-slate-400 text-[11px]">
                    The composite unique constraint <code className="text-amber-400">uq_guild_member (guild_id, discord_user_id)</code> ensures that members have independent balances across different Discord servers.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="font-semibold text-white mb-1">Zero Local SQLite Files</div>
                  <p className="text-slate-400 text-[11px]">
                    <code className="text-emerald-400">src/database/client.js</code> explicitly asserts that the URL is remote Turso, preventing fallback to temporary local storage.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <h3 className="text-xs font-bold text-white mb-2">Executing Remote Migrations</h3>
              <p className="text-xs text-slate-400 mb-3">
                Run this command whenever you add new SQL migration files in <code className="text-slate-200">src/database/migrations/</code>:
              </p>
              <CodeSnippet code="npm run db:migrate" />
            </div>
          </div>
        )}

        {/* TAB 3: COMMANDS & EVENTS */}
        {activeTab === 'commands' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Milestone 1 Commands
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Commands are dynamically loaded by scanning <code className="text-slate-300">src/commands/</code> recursively.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-semibold text-sm">/ping</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Everyone
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Replies with "🏓 Pong! Bot is online", calculating client roundtrip latency and Discord WebSocket ping.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">src/commands/general/ping.js</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-semibold text-sm">/database-status</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-300">
                        Admin Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pings remote Turso database, tests latency, and checks registered rows in <code className="text-slate-300">users</code> and <code className="text-slate-300">_migrations</code> tables. Ephemeral output.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">src/commands/admin/database-status.js</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <h3 className="text-xs font-bold text-white mb-2">Deploy Slash Commands to Discord</h3>
                <CodeSnippet code="npm run deploy:commands" />
              </div>
            </div>

            {/* Privileged Intents Box */}
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-2 text-slate-300">
                  <strong className="text-amber-200 block text-sm">Required Privileged Gateway Intents</strong>
                  <p>
                    Ensure you enable these two toggles under the <strong>Bot</strong> tab in the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Discord Developer Portal</a>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>Server Members Intent:</strong> Required to query member status and execute Discord timeouts during jail events.
                    </li>
                    <li>
                      <strong>Message Content Intent:</strong> Required for the Camera Roll photo attachment detection and future secret-word scanning.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETUP & GITHUB WORKFLOW */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> Git & GitHub Synchronization
              </h2>
              <p className="text-xs text-slate-400">
                Follow these exact commands to push the project from your machine to GitHub:
              </p>

              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">1. Initialize and Commit</div>
                <CodeSnippet code={`git init\ngit add .\ngit commit -m "feat: initial discord bot foundation with Turso and Cloud Run"\ngit branch -M main`} />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">2. Connect Remote Repository & Push</div>
                <CodeSnippet code={`git remote add origin https://github.com/YOUR_USERNAME/discord-economy-bot.git\ngit push -u origin main`} />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">3. Clone to MacBook in VS Code</div>
                <CodeSnippet code={`git clone https://github.com/YOUR_USERNAME/discord-economy-bot.git\ncd discord-economy-bot\ncode .`} />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <h2 className="text-sm font-bold text-white">Daily Local Development Lifecycle</h2>
              <p className="text-xs text-slate-400">
                Run the bot locally in VS Code with native Node 22 auto-reload:
              </p>
              <CodeSnippet code="npm run dev:bot" />
            </div>
          </div>
        )}

        {/* TAB 5: DOCKER & CLOUD RUN */}
        {activeTab === 'cloudrun' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" /> Google Cloud Run 24/7 Deployment
              </h2>
              <p className="text-xs text-slate-400">
                Because Discord bots maintain an active Gateway WebSocket connection, Cloud Run must be configured with <strong>Min instances = 1</strong> and <strong>CPU always allocated</strong>.
              </p>

              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">Build & Test Docker Container Locally</div>
                <CodeSnippet code={`docker build -t discord-economy-bot .\ndocker run -p 8080:8080 --env-file .env discord-economy-bot`} />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">Deploy to Google Cloud Run with gcloud CLI</div>
                <CodeSnippet code={`gcloud run deploy discord-economy-bot \\\n  --image gcr.io/YOUR_PROJECT_ID/discord-economy-bot \\\n  --platform managed \\\n  --region us-central1 \\\n  --port 8080 \\\n  --min-instances 1 \\\n  --max-instances 1 \\\n  --no-cpu-throttling`} />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <strong className="text-white block mb-1">HTTP Health Probe</strong>
                Cloud Run pings <code className="text-emerald-400">GET /health</code> on port 8080 to ensure the container is healthy and responding.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-500">
        Discord Economy & Entertainment Bot • Foundation Milestone 1 • All systems prepared for future expansion
      </footer>
    </div>
  );
}
