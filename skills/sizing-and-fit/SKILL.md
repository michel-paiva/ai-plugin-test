---
name: sizing-and-fit
description: >-
  Use when a merchant asks about sizing or fit ("which products run small", "which run large", "fit issues by size", "does this shoe run small", "should we change the size guide", "which sizes come back most", "customers ordering several sizes"). Finds products and sizes that are returned as too small or too large, by reading each product's size attribute in whatever language the shop names it.
---

# Sizing and fit

The merchant wants to know which products and sizes don't fit as expected. Three things make this harder than it looks, and this skill handles each one:

1. **Size is a variant attribute** with a different name per shop and language (Size, Maat, Größe, Schoenmaat, Select your size...).
2. **Fit reasons have different keys** per Store (too small, too tight, fit not as expected...).
3. **SKUs are sometimes empty**, so products are grouped on SKU *and* name.

Follow the server's date rules and let SQL do all counting and shares. The tested queries are in [references/query-patterns.md](references/query-patterns.md).

## Steps

1. **Period and Store.** Default to the last 3 full months: fit needs volume. Resolve a named Store with `core_list_stores`.
2. **Find the size attribute** (query 1): list the Account's attribute names, normalised with `lowerUTF8(trim())`, with their spellings and counts. Match them against [references/attribute-names.md](references/attribute-names.md). If a name might be size but isn't on the list (for example "Variant" or "Option"), look at a few of its values first and confirm with the merchant before using it.
3. **Find the fit reasons** (query 2): list the reason keys in use and sort them into *too small*, *too large*, *fit in general*, *ordered several sizes* and *not fit* using [references/fit-reasons.md](references/fit-reasons.md). Keys you don't recognise: check their description, and ask when unsure.
4. **Products and sizes** (query 3): per SKU, product name and size, count the Return Requests, how many were too small and too large, and a lean score: (too small − too large) ÷ all, as a percentage. Keep only rows with at least 5 Return Requests (say the threshold; lower it for small shops).
5. **Per size across a product** (query 4) when the merchant asks about one product or wants to know which sizes are affected.

## Present

- A sentence with the period (Amsterdam time) and how many Return Requests were about fit, of all.
- **Runs small**: the products whose returns lean most to *too small*, with their size and counts.
- **Runs large**: the same the other way.
- **Fit in general**, if large: products with many *fit not as expected* returns and no clear direction.
- **Several sizes ordered** (bracketing): a sign customers are unsure of their size, often a size-guide issue.
- Suggest a concrete next step per finding, such as updating the size guide ("runs small: we advise one size up") or checking the size chart with the supplier.

## Be careful with

- This is a share of **returns**, not a return rate: a popular size has more returns because it sells more. For return rates per size, the merchant needs sales data (see the `returns-with-sales-data` skill).
- Size values vary too (M, Medium, 38, EU 38, 38 1/3): don't merge them yourself; show them as they come.
- *Received wrong size* is a picking error in the warehouse, not a fit problem: report it apart.
- Products without variants have one attribute `Title` = `Default Title`: they show size "Unknown".
- Return Requests from the previous system have no attributes: they also show "Unknown".
