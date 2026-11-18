---
name: store-policy-explainer
description: >-
  Use when a merchant asks how their Stores are set up or why numbers look the way they do because of a setting ("what is our return policy", "how many days can customers return", "do we allow exchanges", "why so few exchanges", "why so much store credit", "why are refunds lower than the price", "do we charge for returns", "what incentive do we give for store credit", "compare the policies of our shops"). Reads each Store's settings and links them to the return numbers.
---

# Store policy explainer

The merchant wants their return policy in plain words, or wants to know whether a setting explains a number. Read the settings from `platform_data.store_config` (always with `FINAL`), explain each one by its merchant app label (`displayAs`), and link it to the numbers. The tested queries are in [references/query-patterns.md](references/query-patterns.md); what each setting means and what it does to the numbers is in [references/settings.md](references/settings.md).

## Steps

1. **Which Stores.** Call `core_list_stores`. It lists the Stores that exist today; `store_config` can still hold a deleted Store. Two Stores can have the same name (for example a Returns and a Warranty Store): tell them apart by type or Returns portal address, and ask when the merchant's words fit both.
2. **Read the policy** (query 1). Show only the settings that answer the question. For "what is our return policy", give per Store: Return period (and the grace period on top, as the last day to start a return), whether Exchanges and Store credit are allowed, the store credit incentive, who pays the return costs (Charge type) and any fees, Gatekeeping, and non-returnable categories.
3. **Link to the numbers** when the merchant asks *why* (query 2): put each Store's setting next to its share of exchanges, store credit or refunds in the period. Use [references/settings.md](references/settings.md) for what each setting can explain, for example:
   - Allow Exchanges off → few or no exchanges.
   - Allow Store credit off → no store credit; an incentive on → more store credit.
   - Charge type *deduction* → refunds come out lower than the price paid.
   - Gatekeeping on → returns wait for approval, so more stay Open.
4. **Check the timing.** These are today's settings. Compare `updated_at` with the period: if the Store changed after the period started, say the settings may have been different then (earlier settings are not kept).

## Present

- For a policy: one short block per Store, or a table when comparing Stores, with settings named by their labels (Return period, Allow Exchanges, Charge type...) and explained in plain words: "Customers have 30 days after delivery to start a return, and up to 33 days in practice: there are 3 grace days they don't see."
- For a *why*: the setting, the number next to it, and the link in one sentence. Say clearly when a setting does **not** explain the number, and what else might.
- Incentives: report only the field that belongs to the incentive type (a percentage for Percentage, an amount for FixedAmount); the other field can hold an old value.

## What is not in the settings

Return rules and vouchers (which can change the period or fees of a single return), shipping options and their prices, and which attributes an exchange may differ in. When the question depends on them, say they are set in the merchant app and not visible here. Leave out technical fields (connection ids, tag manager ids, tax numbers, branding) unless the merchant asks for them.
