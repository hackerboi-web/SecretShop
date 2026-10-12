# Secret Shop

Secret Shop is a Discord-first economy and progression system built around persistent player state, loyalty points, vault management, quests, crafting, giveaways, and subscription-driven perks. The bot acts as the interactive frontend layer, while account data, balancing logic, and sensitive operations are backed by Supabase and a dashboard/backend workflow.

This repository documents the current product design and lays the foundation for a larger community-driven economy platform.

## Overview

The project is built around a modular architecture:

- Discord bot layer: permanent interactive panels, button flows, user actions, reminders
- Supabase layer: persistent user state, economy tables, vault data, item records, rewards, audit logs
- Backend dashboard: subscriptions, payment validation, point adjustment tools, analytics, seasonal logic
- External API layer: invite-bot validation and staff-approved reward actions

The bot is intentionally not the system of record for all economic activity. It focuses on UX, interaction, and state updates while the backend handles higher-risk and higher-privilege operations.

## Core feature set

The platform includes:

- Bank and activity panels
- Chest opening and random reward logic
- Digsite resource gathering with zone rotation and tier gating
- Forge crafting with material checks and pass-based protections
- Quest system with rotating objectives and streak tracking
- Giveaways and user-hosted giveaway logic
- Vault system with multiple vault tiers and migration rules
- Subscription tiers and points-per-month logic
- Staff tools, analytics exports, seasonal events, and collection tracking
- Invite-bot external reward approval flow

For the complete product plan, see features.md.

## Architecture summary

### Bot frontend

The Discord bot posts startup panels, keeps message references, and maintains interactive controls for users.

### Supabase persistence

All persistent state is intended to live in Supabase, including:

- points and materials
- item inventories
- vault capacities and contents
- quest progress
- giveaway and event records
- staff audit logs

### Dashboard and backend

The backend is responsible for:

- subscription checks
- PPM grant scheduling
- payment and billing-related logic
- manual staff adjustments
- analytics and exports
- seasonal balancing controls

### External service integration

The project supports a trusted invite-bot flow using request signatures, timestamp validation, and staff confirmation. This reduces the chance of direct reward abuse or unauthorised external actions.

## Repository layout

- features.md — implementation/product feature specification
- README.md — repository overview and developer documentation
- LICENCE.md — custom project license terms

## Roadmap and expansion ideas

The product already has a strong base. Planned expansion areas include:

- user marketplace / trading
- referral and affiliate incentives
- guild/clan systems with shared vault access
- NPC shop and price-index logic
- battle pass and seasonal progression
- cosmetic items and vanity rewards
- anti-abuse and analytics monitoring
- live event engine and dynamic seasonal campaigns

These additions are described in the expanded roadmap section in features.md.

## Development guidance

### Recommended working approach

1. Read features.md first to understand full product goals.
2. Trace bot panel creation and state update flows.
3. Review all Supabase schema and security assumptions.
4. Confirm payment and subscription logic remains backend-side only.
5. Restrict sensitive admin actions behind dashboard validation and audit logs.

### Security checklist

- Use Row Level Security in Supabase
- Do not place Stripe secrets in the Discord bot
- Validate all external API requests with signatures and timestamps
- Log permission-sensitive actions and audit them
- Limit dynamic table growth by planning schema scaling carefully

## Contributing

This repository is intended for a controlled development and deployment model. Contributions are welcome only under the terms of the project license and with explicit permission for any broader release or commercial use.

## License

This project is governed by the custom project license in LICENCE.md.

## Notes

This repository is currently a product design and implementation foundation rather than a fully public open-source project. The project deliberately includes legal and access restrictions for production stability, commercial safety, and controlled release planning.

---

For detailed product design, review features.md.