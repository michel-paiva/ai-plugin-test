# Variant attribute names

`product_attribute_names` holds each product's variant attribute names as the shop's platform names them, and `product_attribute_values` their values at the same position. Compare names with `lowerUTF8(trim(name))` and match every name in the right list. When the Account uses a name that is not here, check a few of its values, confirm with the merchant, and add it to the query.

## Size

| Language | Names (lower case) |
|---|---|
| English | size, sizes, shoe size, select your size, choose your size, select size, clothing size, waist, length, inseam, cup size, band size |
| Dutch | maat, maten, schoenmaat, kies je maat, kies uw maat, grootte, lengte, cupmaat |
| German | größe, groesse, grösse, schuhgröße, schuhgroesse, konfektionsgröße, länge, weite |
| French | taille, pointure |
| Spanish | talla, tamaño |
| Italian | taglia, misura, numero |
| Polish | rozmiar |
| Swedish, Danish, Norwegian | storlek, størrelse |

`waist`, `length`, `inseam`, `lengte`, `länge` and `weite` are a second size dimension (jeans: W32 L34). When a product has two, show both: read each one with its own `indexOf` or `arrayFirstIndex`.

## Colour

| Language | Names (lower case) |
|---|---|
| English | color, colour, colors, colours, select color |
| Dutch | kleur, kleuren |
| German | farbe |
| French | couleur |
| Spanish | color |
| Italian | colore |
| Polish | kolor |
| Swedish, Danish, Norwegian | färg, farve, farge |

## No variants

A single attribute `title` with the value `Default Title` (Shopify) means the product has no variants: it has no size.

## In SQL

```sql
WITH
  ['size', 'sizes', 'shoe size', 'select your size', 'choose your size', 'select size', 'clothing size',
   'maat', 'maten', 'schoenmaat', 'kies je maat', 'kies uw maat', 'grootte',
   'größe', 'groesse', 'grösse', 'schuhgröße', 'schuhgroesse', 'konfektionsgröße',
   'taille', 'pointure', 'talla', 'tamaño', 'taglia', 'misura', 'numero', 'rozmiar', 'storlek', 'størrelse'] AS size_names,
  arrayFirstIndex(n -> has(size_names, lowerUTF8(trim(n))), product_attribute_names) AS size_pos
SELECT if(size_pos = 0, 'Unknown', trim(product_attribute_values[size_pos])) AS "Size", count() AS "Return Requests"
FROM platform_data.return_requests
WHERE created_at >= toDateTime('2026-08-01', 'Europe/Amsterdam') AND created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY "Size" ORDER BY "Return Requests" DESC LIMIT 30
```
