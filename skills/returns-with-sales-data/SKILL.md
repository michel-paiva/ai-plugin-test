---
name: returns-with-sales-data
description: >-
  Use when a merchant asks for a return rate or compares returns with sales ("what's our return rate", "return rate per product", "return rate per size", "returns vs sales", "how is the new collection doing", "which bestsellers come back most", "return percentage"), especially when a Shopify or other commerce connector is connected. Combines Returnista's returns with sold units from the sales connector; without one, explains what is missing instead of guessing a rate.
---

# Returns with sales data

A return *rate* needs two numbers: what came back (Returnista) and what was sold (the shop). Returnista only holds orders that had a return, so it can never give a rate on its own. Never estimate one. The tested query for combining both is in [references/joining-sales.md](references/joining-sales.md).

## 1. Is there a sales source?

Look at your tools for a commerce or sales connector: Shopify, WooCommerce, Magento, Shopware, Lightspeed, a BI or spreadsheet connector with sales.

- **None:** say plainly that Returnista holds returns only, so a return rate needs their sales data. Suggest connecting their shop's connector (for example Shopify) to this chat. Meanwhile, offer what Returnista alone can answer: returns per product and the share of each product in all returns, reasons, sizes. Stop there; don't make up a rate, and don't present a share of returns as a rate.
- **One:** use it. If the merchant has several shops, check its connected shop matches the Returnista Store you're looking at (by name or web address in `core_list_stores` / `store_config.url`).

## 2. Agree on the definition

Say which one you use, in one sentence:

- **Simple (default):** items returned that were *registered* in the period, divided by items *sold* in the same period. Quick, but in a launch or a sale the returns lag behind the sales.
- **Per order (cohort):** returns of the orders *placed* in the period, divided by items sold in them. Fairer for launches and collections. Use it when the merchant asks about a launch, a collection or a campaign, and the sales tool can list order numbers. Then wait a few weeks after the period, or say returns may still come in.

Sales tools often count days in the shop's time zone; Returnista uses Amsterdam time. Say so if they differ.

## 3. Get the sold units

From the sales connector, per variant SKU (or per product when SKUs are missing): units sold, net of cancellations and test orders, for the period and Store. For a collection or launch, first get the collection's SKUs (and, for the cohort, its order numbers).

## 4. Let ClickHouse compute the rate

Pass the sold units into the query as a literal list, so the arithmetic happens in SQL, not in your answer: see query 1 in [references/joining-sales.md](references/joining-sales.md). SKUs are compared without spaces or line breaks, which some shops have in their SKUs. Up to about 300 SKUs per query; for more, take the top sellers, or run it in batches and say so.

For the cohort definition, filter Returnista on the order numbers instead (query 2).

If you have a code execution tool and the lists are large, you may compute there instead; still no mental arithmetic.

## 5. Present

- The definition, the period (both time zones if they differ), and the overall rate.
- A table per SKU or product: Units sold, Units returned, Return rate, sorted by what the merchant asked (highest rate, or biggest sellers).
- **Match check:** how many returned units had no matching SKU in the sales data (query 3), so the merchant can judge the result. Above 10%, say the rate is incomplete and why (empty SKUs, renamed products, another shop).
- Offer a next step: reasons or sizes for the products with the highest rates (the `return-reasons-analysis` and `sizing-and-fit` skills).
