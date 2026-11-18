# Query patterns for sizing and fit

Tested against the live server. Replace the dates, and extend `size_names` with names found in query 1 (see attribute-names.md).

## 1. Attribute names in use

```sql
SELECT lowerUTF8(trim(name)) AS "Attribute", count() AS "Return Requests", groupUniqArray(5)(name) AS "Spellings"
FROM platform_data.return_requests
ARRAY JOIN product_attribute_names AS name
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY "Attribute" ORDER BY "Return Requests" DESC LIMIT 40
```

To see a few values of an unclear name:

```sql
SELECT product_attribute_values[indexOf(arrayMap(n -> lowerUTF8(trim(n)), product_attribute_names), 'variant')] AS "Value", count() AS "Return Requests"
FROM platform_data.return_requests
WHERE has(arrayMap(n -> lowerUTF8(trim(n)), product_attribute_names), 'variant')
GROUP BY "Value" ORDER BY "Return Requests" DESC LIMIT 20
```

## 2. Reason keys in use

```sql
SELECT ifNull(return_reason_key, 'unknown') AS "Reason key", any(return_reason_description) AS "Description", count() AS "Return Requests"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY "Reason key" ORDER BY "Return Requests" DESC LIMIT 60
```

## 3. Products and sizes that run small or large

```sql
WITH
  ['size', 'sizes', 'shoe size', 'select your size', 'choose your size', 'select size', 'clothing size',
   'maat', 'maten', 'schoenmaat', 'kies je maat', 'kies uw maat', 'grootte',
   'größe', 'groesse', 'grösse', 'schuhgröße', 'schuhgroesse', 'konfektionsgröße',
   'taille', 'pointure', 'talla', 'tamaño', 'taglia', 'misura', 'numero', 'rozmiar', 'storlek', 'størrelse'] AS size_names,
  arrayFirstIndex(n -> has(size_names, lowerUTF8(trim(n))), product_attribute_names) AS size_pos,
  replaceOne(ifNull(return_reason_key, ''), 'return_reasons.', '') AS reason
SELECT
  product_sku AS "SKU",
  product_name AS "Product name",
  if(size_pos = 0, 'Unknown', trim(product_attribute_values[size_pos])) AS "Size",
  count() AS "Return Requests",
  countIf(reason IN ('too_small', 'too_tight', 'too_narrow', 'too_short', 'too_small_and_dont_like_the_colour')) AS "Too small",
  countIf(reason IN ('too_large', 'too_wide', 'too_long', 'too_large_and_dont_like_the_colour')) AS "Too large",
  countIf(reason IN ('fit_not_as_expected', 'ordered_wrong_size')) AS "Fit in general",
  countIf(reason IN ('ordered_multiple_sizes', 'ordered_more_than_one_size')) AS "Several sizes ordered",
  round(100 * ("Too small" - "Too large") / count(), 1) AS "Lean % (+ small, - large)"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY product_sku, product_name, "Size"
HAVING count() >= 5
ORDER BY abs("Lean % (+ small, - large)") DESC, "Return Requests" DESC
LIMIT 30
```

For only the products that run small, add `AND "Lean % (+ small, - large)" > 0` to the `HAVING` and order by it descending; for large, `< 0` and ascending.

## 4. One product, per size

Filter on the product (by SKU, or by name with `ILIKE` when the merchant gives a name) and group by size only:

```sql
WITH
  ['size', 'maat', 'schoenmaat', 'größe', 'taille', 'talla', 'taglia', 'select your size'] AS size_names,
  arrayFirstIndex(n -> has(size_names, lowerUTF8(trim(n))), product_attribute_names) AS size_pos,
  replaceOne(ifNull(return_reason_key, ''), 'return_reasons.', '') AS reason
SELECT
  if(size_pos = 0, 'Unknown', trim(product_attribute_values[size_pos])) AS "Size",
  count() AS "Return Requests",
  countIf(reason IN ('too_small', 'too_tight', 'too_narrow', 'too_short')) AS "Too small",
  countIf(reason IN ('too_large', 'too_wide', 'too_long')) AS "Too large",
  round(100 * count() / sum(count()) OVER (), 1) AS "Share of this product's returns %"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
  AND product_name ILIKE '%superstar%'
GROUP BY "Size"
ORDER BY "Return Requests" DESC
```
