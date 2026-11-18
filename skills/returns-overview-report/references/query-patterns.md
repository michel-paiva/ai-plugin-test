# Query patterns for the overview

Tested against the live server. Replace the three dates; the current period runs from `cur_from` up to (not including) `cur_to`, the previous one from `prev_from` up to `cur_from`. Dates are Amsterdam midnights: for "last week" Monday 9 to Sunday 15 November 2026, `cur_from` is `2026-11-09`, `cur_to` is `2026-11-16` and `prev_from` is `2026-11-02`.

## 1. Overview per Store, with Returns and Warranty subtotals and a total

```sql
WITH
  toDateTime('2026-11-02', 'Europe/Amsterdam') AS prev_from,
  toDateTime('2026-11-09', 'Europe/Amsterdam') AS cur_from,
  toDateTime('2026-11-16', 'Europe/Amsterdam') AS cur_to,
  (SELECT groupArray(store_id) FROM platform_data.store_config FINAL WHERE type = 'Warranty') AS warranty_ids
SELECT
  multiIf(grouping(kind) = 1, 'Total',
          grouping(store_id) = 1, concat('All ', kind),
          store_id = toUUID('00000000-0000-0000-0000-000000000000'), 'No Store (before Dec 2024)',
          trim(any(store_name))) AS "Store",
  if(has(warranty_ids, store_id), 'Warranty claims', 'Returns') AS kind,
  countIf(created_at >= cur_from) AS "Return Requests",
  uniqExactIf(return_order_id, created_at >= cur_from) AS "Return Orders",
  countIf(created_at < cur_from) AS "Return Requests, previous period",
  round(100 * (countIf(created_at >= cur_from) - countIf(created_at < cur_from)) / nullIf(countIf(created_at < cur_from), 0), 1) AS "Change %",
  sumIf(purchase_price_value, created_at >= cur_from) AS "Return value",
  round(100 * countIf(requested_resolution = 'Exchange' AND created_at >= cur_from) / nullIf(countIf(created_at >= cur_from), 0), 1) AS "Exchange rate %",
  round(100 * countIf(requested_resolution = 'StoreCredit' AND created_at >= cur_from) / nullIf(countIf(created_at >= cur_from), 0), 1) AS "Store credit rate %",
  sumIf(resolution_amount_value, resolution_type = 'Refund' AND resolution_status = 'Processed' AND created_at >= cur_from) AS "Refunded amount"
FROM platform_data.return_requests
WHERE created_at >= prev_from AND created_at < cur_to
GROUP BY ROLLUP(kind, store_id)
ORDER BY grouping(kind), kind, grouping(store_id), "Return Requests" DESC
```

Notes:

- `ROLLUP(kind, store_id)` gives one row per Store, a subtotal per kind ("All Returns", "All Warranty claims") and the "Total" row. Drop the subtotal rows from the table when there are no Warranty Stores.
- A Store with Return Requests only in the previous period shows 0 now: keep it, it explains the change.
- `Change %` is NULL when the previous period had none: write "new" or "n/a", not 0.
- To leave warranty claims out entirely, add `AND NOT has(warranty_ids, store_id)` to the `WHERE`.
- `WITH TOTALS` does not return its totals row through this server: use `ROLLUP`.

## 2. Store credit issued, once per store credit

```sql
SELECT
  if(grouping(store_id) = 1, 'Total', trim(any(store_name))) AS "Store",
  count() AS "Store credits",
  sum(credit) AS "Store credit issued",
  sum(incentive) AS "Of which incentive"
FROM (
  SELECT store_id, any(store_name) AS store_name, new_store_credit_order_number,
         any(resolved_store_credit_amount_value) AS credit,
         any(resolved_store_credit_incentive_amount_value) AS incentive
  FROM platform_data.return_requests
  WHERE created_at >= toDateTime('2026-11-09', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-16', 'Europe/Amsterdam')
    AND resolution_type = 'StoreCredit' AND resolution_status = 'Processed'
    AND ifNull(new_store_credit_order_number, '') != ''
  GROUP BY store_id, new_store_credit_order_number
)
GROUP BY ROLLUP(store_id)
ORDER BY grouping(store_id), "Store credit issued" DESC
```

Each row of a store credit carries the credit's full total, so summing rows would count it several times.

## 3. By day, week or month

Group on the Amsterdam day, week (starting Monday) or month:

```sql
SELECT toStartOfWeek(created_at, 1, 'Europe/Amsterdam') AS "Week starting",
       count() AS "Return Requests", uniqExact(return_order_id) AS "Return Orders"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY "Week starting" ORDER BY "Week starting"
```

Use `toDate(created_at, 'Europe/Amsterdam')` for days and `toStartOfMonth(created_at, 'Europe/Amsterdam')` for months.
