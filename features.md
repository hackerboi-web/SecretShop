1. Core Bot Foundation & Startup Behaviour
 
‑ On bot ready event: connect to assigned Supabase project
‑ Auto‑panel workflow: locate dedicated panel‑channel; purge only existing bot‑sent messages; re‑post all main interactive panels sequentially
‑ Save each new panel message‑ID + channel‑ID to Supabase for component‑listener reference
‑ Controlled short delays between panel posts to avoid Discord rate‑limits
‑ Graceful error logging if panel‑channel missing / permissions insufficient
‑ Bot acts primarily as an interactive frontend; writes & reads economy data via Supabase; does not handle direct Stripe processing
 
2. Permanent Interactive Panels (posted on startup)
 
‑ Bank Panel: loyalty‑point balance view, recent‑transaction preview, quick‑action transfer‑buttons; entry‑gateway to Activity‑Log Viewer & Vault‑Panel
‑ Chest Panel: loot‑opening interface, cooldown status, reward preview; random point / material / special‑item drops
‑ Digsite Panel: resource‑gathering interface; entry‑cost display; cooldown tracking; rotating‑zone support; some zones subscription‑tier‑locked
‑ Forge Panel: crafting‑recipe list; material‑requirement checks; success‑chance display; craft‑trigger buttons; support for Forge‑Guard‑Pass consumables; shared‑crafting session option
‑ Quests Panel: daily‑weekly rotating objectives + one‑time story‑quests; progress meters; reward‑claim controls; activity‑streak‑bonus indicator
‑ Giveaways Panel: official‑hosted giveaway system; optional point‑entry‑fee; join‑button; winner‑roll logic; extends to verified‑user‑hosted giveaways with staff‑alert triggers
‑ Invite‑Event Panel: fully hosted on separate dedicated invite‑bot; its own Supabase DB + secured API + staff‑verification embed flow; Secret Shop only makes authorised external API calls to receive validated invite‑milestone rewards
 
3. Loyalty‑Point Earning Channels
 
‑ Completing quests
‑ Random point drops from opening chests
‑ Points awarded as giveaway prizes
‑ One‑off point purchases managed via Stripe backend: base rate £1 = 10 points; boosted pp£ rates apply for active subscribers
 
4. Subscription‑Tier Definitions (managed via dashboard‑backend; bot only displays values)
 
Definitions: pp£ = points‑per‑£ conversion multiplier for one‑off buys; PPM = points‑per‑month automatic grant (only activates after 3 consecutive active paid‑subscription months; counter resets if subscription lapses)
‑ Level 0 ‑ Free: £0 | pp£ = 10 | PPM = 0
‑ Level 1 ‑ Basic: £5 | pp£ = 15 | PPM = 50
‑ Level 2 ‑ Standard: £10 | pp£ = 20 | PPM = 100
‑ Level 3 ‑ Advanced: £15 | pp£ = 25 | PPM = 150
‑ Level 4 ‑ Premium: £20 | pp£ = 30 | PPM = 200
‑ Level 5 ‑ Elite: £25 | pp£ = 35 | PPM = 250
‑ pp£ bonus active immediately upon paid‑tier activation; PPM eligibility requires 3‑month continuous‑subscription check run by backend scheduled jobs
 
5. Extended Bot‑Side Features
 
‑ Activity‑Log‑Viewer Panel: accessible from Bank‑panel; user‑only snapshot history of points, chest opens, digsite runs, forge attempts, quest completions; shows PPM‑eligibility progress counter
‑ Forge‑Guard‑Passes: consumable items; when activated before‑craft preserves all input materials on failure; standard‑ & premium‑rarity variants obtainable via chests, special quests, limited‑events
‑ Rotating Digsite Zones: dashboard‑configurable zones with unique loot pools, entry‑costs, cooldown‑multipliers; some zones locked to minimum subscription tiers
‑ Player‑Hosted Giveaways: verified users spend own loyalty‑points to launch giveaways; staff‑channel alert triggers; configurable frequency & payout limits; audit‑records stored in Supabase
‑ Shared‑Crafting Sessions: multi‑user forge‑workflow; contributors add materials via‑panel; session‑timeout protection; pre‑defined reward‑distribution rule
‑ Personal‑Activity Reminders: opt‑in DM‑alerts for digsite‑ready, chest‑ready, new‑daily‑quests; preference flags stored per‑user in Supabase
‑ Economy Safeguard Indicators: soft‑cap warning near maximum‑point‑balance; activity‑streak tracker on Quests‑panel; low‑stock alerts visible on Shop‑panel for virtual‑ & IRL‑redeemable goods
 
6. Vault System (Supabase‑powered; animated interactive visuals are dashboard‑only)
 
‑ Every new user automatically receives one free Tiny Vault: capacity 5 inventory‑items + 10 000 points; stores points, regular‑items, chest‑keys; no reserved‑payment tagging
‑ General vault‑purchase rules for tiers above Tiny:
 ‑ Limit: maximum 1 vault‑instance per vault‑type for any user
 ‑ Higher‑tier vaults may require rare inventory‑items; may also require ownership of prior‑tier vault (configurable: retain or retire‑and‑migrate contents)
 ‑ Each vault creates its own dedicated Supabase storage‑table (partition‑style fallback available for scaling planning)
 ‑ Supported stored resources: loyalty‑points, any‑item‑type, chest‑keys, named reserved‑payment‑goal allocations (available Small‑vault‑tier upward)
‑ Example configurable vault‑tier chain (adjustable in dashboard):
  1. Tiny Vault ‑ free | 5 items / 10 000 pts | no prereq
  2. Small Vault ‑ cost: 3 Common Ore + 1 Basic Chest‑Key | 20 items / 30 000 pts | requires Tiny Vault (retained)
  3. Medium Vault ‑ cost: 5 Rare Crystal + 2 Forged‑Steel‑Ingots | 60 items / 75 000 pts | requires Small Vault (migrate & retire old vault)
  4. Large Vault ‑ cost: 3 Ancient Shard + 1 Premium Forge‑Guard‑Pass | 150 items / 200 000 pts | requires Medium Vault (migrate & retire)
  5. Premium Vault ‑ cost: 5 Ancient Shard + 2 Legendary‑Forged‑Items | 400 items / 500 000 pts | requires Large Vault (migrate & retire)
‑ Bot‑side Vault‑Panel: list owned vaults; used‑vs‑max‑capacity display; unlock‑requirement preview; transfer‑in / transfer‑out buttons; reservation‑goal creation; duplicate‑ownership prevention warning; migration‑confirmation prompts
‑ Vault‑table provisioning & content‑migration actions executed securely from dashboard‑backend after purchase validation; bot does not directly run dynamic‑DDL commands
 
7. Dashboard‑Linked Features (configured/executed backend‑side; bot only reads‑state)
 
‑ Limited‑time seasonal‑event system: temporary loot‑pools, exclusive forge‑recipes, event‑only quest‑chains controlled by Supabase timestamps
‑ Extended‑inventory & collection‑tracker: per‑user collection‑log records every unique‑item obtained; set‑completion bonus‑point rewards; collection‑view accessible via bot panels
‑ Party‑style activity‑bonus logic: passive small point‑/loot boost when multiple users run digsite / forge near‑in‑time; timestamp‑based checks stored in Supabase
‑ Staff manual‑adjustment portal: audited point‑/material changes; user‑activity review view
‑ Tier‑locked virtual‑perks: subscription‑linked cooldown reductions, improved forge success‑chances
‑ IRL‑item wishlist & restock‑alert workflow: user‑submitted wish‑list; bot‑sent DM restock‑notifications
‑ Analytics & CSV‑export tools: activity‑trend visualisation; redemption‑ & transaction‑log exports
‑ Cross‑bot reward integration with Invite‑Bot: invite‑milestone bonus‑triggers via secured‑API + staff‑verification‑embed flow
‑ Long‑term roadmap concepts: referral‑bonus scheme for new paid‑subscriptions; rare‑master‑crafting‑recipes exclusive to long‑term‑eligible subscribers
‑ Animated interactive vault‑visualisation page: mobile‑game‑style clickable‑item‑representation; staff‑audit vault‑inspect view
 
8. External API Link (Secret Shop ↔ Invite‑Bot)
 
‑ Request signature: guild_id + bot_id + current‑timestamp + pre‑shared‑API‑key in request‑headers
‑ Invite‑bot performs timestamp‑freshness check; on initial‑pass sends verification‑embed to its staff‑channel; staff approve/deny via Discord‑buttons; final response returned
‑ Only after confirmed approval can Secret Shop apply economy‑rewards to the target‑user Supabase‑records
 
9. Important Implementation Notes
 
‑ All persistent state stored in Supabase; plan appropriate row‑level‑security policies
‑ All payment‑processing, subscription‑status‑updates, scheduled‑PPM grants run from separate dashboard‑backend; Discord‑bot never holds Stripe‑secret‑keys
‑ Dynamic‑per‑vault‑tables: monitor Supabase instance limits; prepare partition‑based alternative‑schema if many vaults expected
‑ Open‑source repo scope: public‑release older stable‑versions; two‑most‑recent production‑builds are restricted‑access requiring your formal permission‑document before use
‑ Legal‑check reminder: seek relevant UK‑consumer‑rights & intellectual‑property review before launching paid‑features or public‑release.