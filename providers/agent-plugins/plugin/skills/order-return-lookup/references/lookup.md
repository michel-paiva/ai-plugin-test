# Looking up one order's returns

Tested against the live server.

## 1. Every returned item of one order

Put the order number in both places of `trimLeft(..., '#')`, so it matches with or without `#`.

```sql
SELECT
  formatDateTime(created_at, '%Y-%m-%d %H:%i') AS "Created at",
  trim(store_name) AS "Store",
  return_order_id AS return_order,
  product_name AS "Product name",
  product_sku AS "SKU",
  return_reason_description AS "Return reasons description",
  requested_resolution AS "Requested resolution",
  resolution_type AS "Resolution type",
  if(resolution_status = '', 'Unknown', resolution_status) AS "Status",
  resolution_denial_reason AS "Denial reason",
  resolution_amount_value AS "Resolution amount",
  new_exchange_order_number AS "Exchange order",
  exchange_product_name AS "Exchanged for",
  new_store_credit_order_number AS "Store credit reference",
  formatDateTime(updated_at, '%Y-%m-%d %H:%i') AS "Updated at"
FROM platform_data.return_requests
WHERE trimLeft(purchase_order_number, '#') = trimLeft('#1005505', '#')
ORDER BY created_at, return_order_id
LIMIT 100
```

Count the returns (Return Orders) with `uniqExact(return_order_id)` in a second query if the merchant wants the count, or read it off the distinct `return_order` values; show `return_order` only to group rows, not as an id.

## Statuses

| Status | Meaning |
|---|---|
| Open | Not decided yet. With Gatekeeping on, it may wait for the merchant's approval |
| Approved | Approved, not carried out yet |
| Processed | Carried out and confirmed by the shop's platform: refund made, store credit issued or exchange order created. Not proof the customer has the money |
| Denied | Refused; see the denial reason |
| (empty) | Unknown: older Return Requests from the previous system can have no status |

Older Return Requests can also hold the text `<missing>` in a column, such as the resolution type or the order number: the previous system did not record it. Write "not recorded", never `<missing>`.

## Resolutions

| Code | In words |
|---|---|
| Refund | money back |
| Exchange | swapped for another product |
| StoreCredit | store credit (gift card or credit) |
| ProcessedElsewhere | handled outside Returnista |
| Replacement | replaced (rare) |

The requested resolution is what the customer chose; the resolution type is what the merchant gives, and can differ: say so when it does.

## Denial reasons

Write the code in words: `EXPIRED_RETURN_WINDOW` → return window expired, `WORN_OR_WASHED` → worn or washed, `NOT_DELIVERED` → not delivered, `ITEM_NOT_IN_ORIGINAL_CONDITION` → not in its original condition, `OTHER` → other reason. For other codes, replace `_` with spaces and use lower case.
