# Query patterns for return reasons

Tested against the live server. Replace the dates; add `AND store_id = toUUID('<id from core_list_stores>')` to filter one Store.

## 1. Top reasons

```sql
SELECT
  if(ifNull(return_reason_key, 'unknown') IN ('unknown', ''), 'No reason given', any(return_reason_description)) AS "Return reason",
  ifNull(return_reason_key, 'unknown') AS reason_key,
  count() AS "Return Requests",
  round(100 * count() / sum(count()) OVER (), 1) AS "Share %"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY reason_key
ORDER BY "Return Requests" DESC
LIMIT 15
```

## 2. Top reasons per Store

```sql
SELECT
  trim(any(store_name)) AS "Store",
  any(return_reason_description) AS "Return reason",
  count() AS "Return Requests",
  round(100 * count() / sum(count()) OVER (PARTITION BY store_id), 1) AS "Share of Store %"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY store_id, ifNull(return_reason_key, 'unknown')
ORDER BY store_id, "Return Requests" DESC
LIMIT 5 BY store_id
```

## 3. Top reasons per category

Empty categories come as `[]` or `['']`: both become "No category". A product in two categories counts in both.

```sql
SELECT
  category AS "Category",
  any(return_reason_description) AS "Return reason",
  count() AS "Return Requests",
  round(100 * count() / sum(count()) OVER (PARTITION BY category), 1) AS "Share of category %"
FROM platform_data.return_requests
ARRAY JOIN if(empty(arrayFilter(c -> c != '', product_categories)), ['No category'], arrayFilter(c -> c != '', product_categories)) AS category
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY category, ifNull(return_reason_key, 'unknown')
ORDER BY category, "Return Requests" DESC
LIMIT 3 BY category
LIMIT 60
```

To keep only the biggest categories, first rank categories on their own (the same `ARRAY JOIN`, `GROUP BY category ORDER BY count() DESC LIMIT 10`) and then add `AND has(['<cat 1>', '<cat 2>'], category)` in a `HAVING`, or ask the merchant which categories matter.

## 4. Top reasons per product

```sql
SELECT
  product_sku AS "SKU",
  product_name AS "Product name",
  any(return_reason_description) AS "Return reason",
  count() AS "Return Requests",
  round(100 * count() / sum(count()) OVER (PARTITION BY product_sku, product_name), 1) AS "Share of product %"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
  AND (product_sku, product_name) IN (
    SELECT product_sku, product_name FROM platform_data.return_requests
    WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
    GROUP BY product_sku, product_name HAVING count() >= 5
    ORDER BY count() DESC LIMIT 20)
GROUP BY product_sku, product_name, ifNull(return_reason_key, 'unknown')
ORDER BY product_sku, product_name, "Return Requests" DESC
LIMIT 3 BY product_sku, product_name
```

## 5. A sample of comments

```sql
SELECT
  if(startsWith(return_reason_comment, 'sub_return_reasons.'), 'Sub-reason', 'Comment') AS "Kind",
  any(return_reason_description) AS "Return reason",
  substring(return_reason_comment, 1, 300) AS "Comment",
  count() AS "Return Requests"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
  AND length(trim(ifNull(return_reason_comment, ''))) >= 3
GROUP BY "Kind", ifNull(return_reason_key, 'unknown'), "Comment"
ORDER BY "Return Requests" DESC
LIMIT 200
```

Add a filter on `return_reason_key` or `product_sku` to look at one reason or product.

## 6. Count comment themes

One `countIf` per theme, matching words in each language the comments use (`(?i)` makes it ignore case). Adjust the words to what you read in the sample.

```sql
SELECT
  count() AS "Comments",
  countIf(match(return_reason_comment, '(?i)narrow|tight|smal|krap|eng')) AS "Too narrow or tight",
  countIf(match(return_reason_comment, '(?i)long|lang')) AS "Too long",
  countIf(match(return_reason_comment, '(?i)colou?r|kleur|farbe')) AS "Colour differs"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
  AND length(trim(ifNull(return_reason_comment, ''))) >= 3
  AND NOT startsWith(return_reason_comment, 'sub_return_reasons.')
```

A comment can match several themes, so theme counts can add up to more than the comments.
