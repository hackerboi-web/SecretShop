# Discord.js Bot Plan (Components v2)

## Goal
Build a new Discord bot from scratch using discord.js v14 with Components v2 UI (containers, sections, text display, buttons, selects). Economy + shop + moderation + utility/info, persisted in Supabase, deployed as Node process (PM2).

## Stack
- discord.js ^14.14, TypeScript, tsx dev
- Supabase (supabase-js) with RLS
- Components v2 helpers (reuse existing v2.ts pattern): containers, sections, text displays, buttons, selects, separators, media galleries
- Single accent color theme across all Component v2 containers
- REST API (express) for dashboard/integration hooks

## Architecture
- `src/index.ts` client bootstrap, login, event wiring
- Auto-panel workflow: purge bot messages in panel channel, repost sequentially, save message IDs
- `src/events/interactionCreate.ts` route slash/button/select
- `src/components/v2.ts` component factory helpers + flags (32768)
- `src/components/panels.ts` panel builders per feature
- `src/economy/` Supabase data access
- `src/moderation/` mod commands + logging
- Structured JSON logs to stdout for PM2 capture

## Panels
Bank, Chest, Forge, Digsite, Quest, Achievement

## Data Model (Supabase)
users, balances, inventory, shop_items, transactions, vaults, quests, giveaways, mod_cases, automod_rules, raid_events, reminders

## Interaction Patterns
- Slash commands open panels; command replies ephemeral (flags 64) unless explicitly public
- IRL chest rewards: bot DMs a 32-char claim code; dashboard verifies code via Cloudflare, then fulfills
- Tips: public transaction log channel; bank panel button + slash command; fee continuous formula scaling with amount
- Economy writes via Supabase RPCs with row locks (atomic transactions)
- Shop auto-discounts: subscription-tier baseline + event-based boosts, additive, capped at 50%

## Validation
- Vitest for unit/integration tests; tsc build; eslint
- Manual staging guild test of each panel

## Risks
- Components v2 requires flags 32768 on every message/update
- RLS policies must be defined before production
- Rate limits handled by discord.js built-in; add small delays between panel posts

## Commands
- Help: panel with buttons; server tutorial, grouped commands (1 group/page), ticket message structure by ticket type
- Ping: paged stats (network/uptime/reliability/hardware/software/deps/storage/RAM/CPU)
- User stats: ephemeral paged lifetime stats (7d,30d,6mo,1y,lifetime)
- Server info: paged server details
- Total moderation actions: counts per action type
- Join/leave percentages: lifetime join/leave %
- User risk: % proximity to moderation + description
- Music bot availability: panel updates on VC join/leave; 3 statuses (available/busy/offline); offline check every 30s; private studio check verifies DB + scans VCs for `🔒 | {username}'s Music Studio`; on member leave/kick/ban, delete their studio and all user data (welcome sequence warns data deletion)
- Music Studio: in-server (not DM) control panel; VC analytics + anti-spam; log recent 5 join/leave/activity events + downloadable JSON (deleted on leave/kick/ban/channel deletion); 5 pts/month renewal to keep open (no auto-renew, all non-bot/non-admin member perms removed until renewal); archived 3 months if unrenewed then deleted (no refund); archive duration paused while bot offline via per-minute process writing remaining duration to file/Supabase
- Open Music Studio: in-server manage panel (ephemeral Components v2) with header `Manage: {Username}'s Music Studio`; sections: Create (cost/availability, disabled if owned), Analytics (tracked metrics, view/enable-disable), Bot status, Close, Add temp user, Add perm user, Remove user, Blacklist user; Create asks confirmation + prepay months + auto-renew toggle; Analytics shows 5 recent events + downloadable full JSON; Close confirms (yes/no/yes now); Add temp user modal with duration abbreviations; Add perm user selector; Remove user paginated allowed list; Blacklist user selector (excludes bots/admins/owner)
- Automod rules configured via external dashboard/file; bot reads state only
- Welcome (voice): main bot joins VC and plays audio files covering rules/specs; uses @discordjs/voice; cloud STT API captures agreement/disagreement responses; on success user clicks verify button in verify channel to receive `verify` role (removes Unverified), with final verified role granted later by external verification; warned that leaving/kick/ban deletes data; welcome VC max 2 members (bot + user); timeout sends user to waiting-room VC with waiting audio; waiting room unlimited; verified users lose access to welcome/waiting/verify channels
- File storage: local filesystem for audio/analytics files; filenames and metadata stored in Supabase/JSON for persistence; dashboard can access via API