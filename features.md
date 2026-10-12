# Secret Shop Feature Specification

## 1. Core Bot Foundation & Startup Behaviour

- On bot ready event, connect to the assigned Supabase project.
- Auto-panel workflow: locate the dedicated panel channel, purge only bot-sent messages, and re-post all main interactive panels sequentially.
- Save each new panel message ID and channel ID to Supabase for component-listener reference.
- Add short delays between panel posts to avoid Discord rate limits.
- Log graceful errors if the panel channel is missing or permissions are insufficient.
- The bot acts primarily as an interactive frontend and reads/writes economy data via Supabase; it does not handle direct Stripe processing.

## 2. Permanent Interactive Panels (posted on startup)

- Bank Panel: loyalty-point balance view, recent transaction preview, quick-action transfer buttons; entry point to Activity Log Viewer and Vault Panel.
- Chest Panel: loot-opening interface, cooldown status, reward preview; random point/material/special-item drops.
- Digsite Panel: resource-gathering interface, entry-cost display, cooldown tracking, rotating-zone support; some zones are subscription-tier locked.
- Forge Panel: crafting recipe list, material requirement checks, success chance display, craft-trigger buttons; support for Forge-Guard-Pass consumables and shared-crafting sessions.
- Quests Panel: daily/weekly rotating objectives and one-time story quests, progress meters, reward-claim controls, and activity streak bonus indicators.
- Giveaways Panel: official-hosted giveaway system, optional point entry fee, join button, winner roll logic, and support for verified user-hosted giveaways with staff alert triggers.
- Invite-Event Panel: hosted on a separate invite bot with its own Supabase DB and secured API plus a staff-verification embed flow; Secret Shop only makes authorised external API calls to resolve rewards.

## 3. Loyalty-Point Earning Channels

- Completing quests
- Random point drops from opening chests
- Points awarded as giveaway prizes
- One-off point purchases managed via a Stripe backend; base rate is £1 = 10 points, with boosted pp£ rates for active subscribers

## 4. Subscription-Tier Definitions

Definitions:

- pp£ = points-per-£ conversion multiplier for one-off buys
- PPM = points-per-month automatic grant, only activates after 3 consecutive active paid-subscription periods

Subscription levels:

- Level 0 — Free: £0 | pp£ = 10 | PPM = 0
- Level 1 — Basic: £5 | pp£ = 15 | PPM = 50
- Level 2 — Standard: £10 | pp£ = 20 | PPM = 100
- Level 3 — Advanced: £15 | pp£ = 25 | PPM = 150
- Level 4 — Premium: £20 | pp£ = 30 | PPM = 200
- Level 5 — Elite: £25 | pp£ = 35 | PPM = 250

Notes:

- pp£ bonus is active immediately upon paid-tier activation.
- PPM eligibility requires a 3-month continuous subscription check run by backend scheduled jobs.

## 5. Extended Bot-Side Features

- Activity Log Viewer Panel: user-only snapshot history of points, chest opens, digsite runs, forge attempts, and quest completions; shows PPM eligibility progress and recent reward sources.
- Forge-Guard-Passes: consumable items that preserve all input materials on failure when activated before a craft; standard and premium variants can be obtained via chests, quests, and vault rewards.
- Rotating Digsite Zones: dashboard-configurable zones with unique loot pools, entry costs, cooldown multipliers, and some zones locked to minimum subscription tiers.
- Player-Hosted Giveaways: verified users spend their own loyalty points to launch giveaways; staff-channel alert triggers; configurable frequency and payout limits; audit records stored in Supabase.
- Shared Crafting Sessions: multi-user forge workflow, contributors add materials via panel, session-timeout protection, and predefined reward distribution rules.
- Personal Activity Reminders: opt-in DM alerts for digsite-ready status, chest-ready status, and new daily quests; preference flags stored per user in Supabase.
- Economy Safeguard Indicators: soft-cap warning near maximum balance, activity streak tracker, and low-stock alerts visible on the shop or reward panel.

## 6. Vault System

The vault system is Supabase-powered; animated interactive visuals are dashboard-only.

- Every new user automatically receives a free Tiny Vault with a capacity of 5 inventory items and 10,000 points.
- It stores points, regular items, and chest keys.
- Above Tiny, vault purchase rules apply:
  - maximum of 1 vault instance per vault type per user
  - higher-tier vaults may require rare inventory items or ownership of a prior-tier vault
  - each vault creates its own dedicated Supabase storage table; partition-style fallback is available for scaling planning
  - supported resources include points, any item type, chest keys, and named reserved payment goal allocations

Example configurable vault chain:

1. Tiny Vault — free | 5 items / 10,000 pts | no prereq
2. Small Vault — cost: 3 Common Ore + 1 Basic Chest-Key | 20 items / 30,000 pts | requires Tiny Vault (retained)
3. Medium Vault — cost: 5 Rare Crystal + 2 Forged-Steel Ingots | 60 items / 75,000 pts | requires Small Vault (migrate and retire old vault)
4. Large Vault — cost: 3 Ancient Shard + 1 Premium Forge-Guard-Pass | 150 items / 200,000 pts | requires Medium Vault (migrate and retire)
5. Premium Vault — cost: 5 Ancient Shard + 2 Legendary-Forged Items | 400 items / 500,000 pts | requires Large Vault (migrate and retire)

Additional vault notes:

- Bot-side Vault Panel: list owned vaults, used-vs-max-capacity, unlock requirement preview, transfer in/out buttons, reservation goal creation, duplicate-item summary, and vault-type filters.
- Vault table provisioning and content migration actions are executed securely from the dashboard backend after purchase validation; the bot does not directly run dynamic DDL commands.

## 7. Dashboard-Linked Features

These features are configured or executed on the backend side; the bot only reads state.

- Limited-time seasonal event system: temporary loot pools, exclusive forge recipes, event-only quest chains, and timestamp-based triggers in Supabase.
- Extended inventory and collection tracker: per-user collection log records every unique item obtained; set-completion bonus-point rewards; collection view accessible through bot panels.
- Party-style activity bonus logic: passive point/loot boost when multiple users run digsite or forge activities near each other; timestamp-based checks stored in Supabase.
- Staff manual adjustment portal: audited point/material changes and user activity review view.
- Tier-locked virtual perks: subscription-linked cooldown reductions and improved forge success chances.
- IRL item wishlist and restock-alert workflow: user-submitted wishlist and DM restock notifications.
- Analytics and CSV-export tools: activity trend visualisation and redemption/transaction log exports.
- Cross-bot reward integration with Invite-Bot: invite-milestone bonus triggers via secure API and staff verification embed flow.
- Long-term roadmap concepts: referral-bonus scheme for new paid subscriptions and rare master-crafting recipes exclusive to long-term eligible subscribers.
- Animated interactive vault visualisation page: mobile-game-style clickable item representation and staff audit vault-inspect view.

## 8. External API Link (Secret Shop ↔ Invite-Bot)

- Request signature: guild_id + bot_id + current timestamp + pre-shared API key in request headers.
- Invite bot performs timestamp freshness checks; on a valid pass, it sends a verification embed to its staff channel; staff approve or deny via Discord buttons; final response is returned.
- Only after confirmed approval can Secret Shop apply economy rewards to the target user’s Supabase records.

## 9. Important Implementation Notes

- All persistent state is stored in Supabase; plan appropriate row-level security policies.
- All payment processing, subscription status updates, and scheduled PPM grants run from a separate dashboard backend; the Discord bot never holds Stripe secret keys.
- Dynamic per-vault tables require careful monitoring of Supabase instance limits; prepare a partition-based alternative schema if many vaults are expected.
- Open-source repo scope: public release older stable versions only; the two most recent production builds are restricted-access and require a formal permission document before use.
- Legal check reminder: review UK consumer-rights and intellectual-property requirements before launching paid features or public release.

## 10. Planned Expansion Features & Future System Additions

- User Marketplace / Trading: player-to-player item exchange system with escrow, listing management, completion windows, anti-fraud checks, and trading cooldowns; requires validation to prevent duping or point inflation.
- Referral & Affiliate System: track referrals, issue reward multipliers, award bonus points or subscription perks, and expose referral leaderboards in dashboard or bot panels.
- Guilds / Clans & Shared Vaults: group-based progression, collaborative quests, raid-style activity bonuses, shared storage limits, and role-based permissions for member access.
- NPC Shop & Price Indexing: bot-controlled economy shop with dynamic item pricing, rarity tiers, and inflation tracking; adjustable price floors and ceilings with marketplace dashboards.
- Battle Pass / Seasonal Progression: time-limited reward tracks with free and premium paths, milestone objectives, cosmetic unlocks, and special seasonal loot tables.
- Tradeable Cosmetic Items & Vanity System: cosmetics with visual profile upgrades, badges, inventory slots, rarity tiers, and limited-edition seasonal vanity items.
- Anti-Abuse & Analytics Layer: detect suspicious activity like rapid point farming, reward loops, mass account abuse, and scripting attempts; store anomaly flags and escalation actions for mod review.
- Live Event Engine: dashboard-driven timed events that alter drop tables, spawn temporary challenges, trigger limited-time quests, and update users in real time.
- Extended Marketplace Dashboard: cap trading volume, monitor item scarcity, review item history, export CSV reports, and allow admin rebalancing without direct bot writes.
- Shared Crafting / Co-op Forge Events: larger team sessions with multi-user contribution thresholds, complex recipe chains, and community-wide reward thresholds.
- Social Leaderboards & Milestone Rewards: weekly ranking boards for points, crafting output, vault usage, and giveaway participation with milestone unlocks.
- Premium Reward Tiers & Long-Term Loyalty Benefits: exclusive cosmetics, early access to seasonal content, and referral-based rewards for sustained active subscribers.
- User-Triggered Restock / Wishlist Engine: advanced wishlist matching and restock alerts for IRL items, digital rewards, and rare drop notifications with configurable thresholds.
- Audit & Balancing Tools: staff dashboard actions for economy patching, event tuning, item rarity balancing, and rollback support without manual table edits.

## 11. Recommended Priority Order for Future Development

1. Anti-abuse & analytics layer
2. User marketplace / trading + escrow validation
3. Referral + affiliate system
4. Guilds / clans + shared vaults
5. Battle pass / seasonal progression
6. NPC shop + price indexing
7. Tradeable cosmetics + vanity system
8. Live event engine
9. Leaderboards + milestone rewards
10. Advanced audit & balancing tools

## 12. Summary

- Secret Shop already has a strong economy foundation and interactive front-end structure.
- Future growth is best driven by secure economy systems, anti-abuse protection, and social progression features.
- The best next feature set combines trading, referral incentives, and community systems while maintaining strict backend validation and audit controls.