---
title: VoiceApp Steam Revenue Projection
display:
  decimals: 2
---
# VoiceApp Steam Revenue Projection
// One-time purchase on Steam, organic-only marketing (no paid ads — word of mouth + a few personal YouTube videos). Change any assumption below to see every result update.

## Assumptions
price = 7.99 -> currency(USD, 2)
steam_cut_pct = 0.30 -> percent(0)
// Steam takes 30% up to $10M lifetime revenue, dropping to 25% at $10M and 20% at $50M — every scenario below stays far under $10M, so 30% applies throughout.
refund_rate = 0.03 -> percent(0)
// Typical refund rate for a paid Steam title is roughly 2-5%; 3% is a reasonable planning midpoint.
net_per_unit = price * (1 - refund_rate) * (1 - steam_cut_pct) -> currency(USD, 2)
// What you actually keep per copy sold, after refunds and Steam's cut.

## Scenario: Organic — 300 buyers
// Realistic floor for launch + a handful of personal YouTube videos, no paid marketing, no existing audience.
organic_units = 300
organic_gross_revenue = organic_units * price -> currency(USD, 0)
organic_net_revenue = organic_units * net_per_unit -> currency(USD, 0)

## Scenario: Modest — 1,500 buyers
// Requires at least one video to catch some traction (a few thousand views) or decent Steam algorithm pickup from good early reviews.
modest_units = 1500
modest_gross_revenue = modest_units * price -> currency(USD, 0)
modest_net_revenue = modest_units * net_per_unit -> currency(USD, 0)

## Scenario: Optimistic — 8,000 buyers
// Would need a video that meaningfully outperforms your channel's normal reach, or organic Steam curation (front-page feature, "Popular Upcoming"), which you can't plan for.
optimistic_units = 8000
optimistic_gross_revenue = optimistic_units * price -> currency(USD, 0)
optimistic_net_revenue = optimistic_units * net_per_unit -> currency(USD, 0)

## Scenario: Stretch — 25,000 buyers
// Your original upper bound. Only plausible with a genuine viral moment (a large creator covers it, or it becomes a talking point in gaming communities) — not something organic-only marketing reliably produces.
stretch_units = 25000
stretch_gross_revenue = stretch_units * price -> currency(USD, 0)
stretch_net_revenue = stretch_units * net_per_unit -> currency(USD, 0)

## Budget & Breakeven
budget_cad = 500 -> currency(CAD, 2)
cad_to_usd_rate = 0.73
// Approximate CAD→USD conversion; check the live rate closer to launch since it moves.
budget_usd = budget_cad * cad_to_usd_rate -> currency(USD, 2)
steam_direct_fee = 100 -> currency(USD, 0)
// One-time Steam Direct submission fee per app, paid upfront to publish. Steam recoups it for you automatically out of your first $1,000 gross revenue, but you still need to have the $100 in hand before launch — it's a real upfront cost on top of the $500 CAD budget.
total_upfront_cost = budget_usd + steam_direct_fee -> currency(USD, 2)
breakeven_units_exact = total_upfront_cost / net_per_unit
breakeven_units = 86
// Rounded up from breakeven_units_exact — still clears comfortably inside the Organic (300) scenario.

## Readiness Check
assert organic_net_revenue > 0
assert stretch_net_revenue > optimistic_net_revenue
assert optimistic_net_revenue > modest_net_revenue
assert modest_net_revenue > organic_net_revenue
assert steam_cut_pct <= 0.3
assert breakeven_units < organic_units
