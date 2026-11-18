# Joining returns with sales

Tested against the live server. The sold units come from the sales connector; you write them into the query as a list of `('SKU', units)` pairs. Remove spaces and line breaks from the SKUs you write in, as the query does on Returnista's side.

## 1. Return rate per SKU (simple definition)

```sql
WITH
  [('AD-04-blue-OS', 40), ('backpack_1', 120), ('AsTi-01-black-8', 25)] AS sales,
  arrayJoin(sales) AS s
SELECT
  s.1 AS "SKU",
  s.2 AS "Units sold",
  countIf(replaceRegexpAll(r.product_sku, '\\s+', '') = s.1) AS "Units returned",
  round(100 * countIf(replaceRegexpAll(r.product_sku, '\\s+', '') = s.1) / s.2, 1) AS "Return rate %"
FROM platform_data.return_requests AS r
WHERE r.created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND r.created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY s
ORDER BY "Return rate %" DESC
```

SKUs without returns show 0. For the overall rate, add one pair for the total (for example `('ALL', 1234)`) and count all rows for it: `if(s.1 = 'ALL', count(), countIf(...))`; or run a separate query that counts the period's returned units of those SKUs and divides by the total sold, written in as a number.

Filter one Store with `AND r.store_id = toUUID('<id>')`.

## 2. Cohort: returns of the orders placed in the period

Write the order numbers from the sales connector into the query, without `#`. Returnista's order numbers can carry `#` or not.

```sql
WITH ['1005505', '1005506', '1005507'] AS orders
SELECT
  count() AS "Units returned",
  uniqExact(purchase_order_number) AS "Orders with a return",
  round(100 * uniqExact(purchase_order_number) / length(orders), 1) AS "Share of orders with a return %"
FROM platform_data.return_requests
WHERE has(orders, trimLeft(purchase_order_number, '#'))
```

Divide units returned by the units sold in those orders the same way as query 1, writing the sold total in as a number. Up to a few thousand order numbers fit in one query.

## 3. Match check: returned units with no SKU in the sales data

```sql
WITH ['AD-04-blue-OS', 'backpack_1', 'AsTi-01-black-8'] AS sold_skus
SELECT
  count() AS "Units returned",
  countIf(NOT has(sold_skus, replaceRegexpAll(product_sku, '\\s+', ''))) AS "Without a matching SKU",
  countIf(product_sku = '') AS "Of which no SKU at all",
  round(100 * countIf(NOT has(sold_skus, replaceRegexpAll(product_sku, '\\s+', ''))) / count(), 1) AS "Unmatched %"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
```

Use the full list of SKUs sold in the period, not only the top sellers, or the unmatched share comes out too high.
