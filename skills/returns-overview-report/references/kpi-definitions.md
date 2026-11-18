# KPI definitions

These follow the **Insights dashboards in the merchant app**, as written in the facts of `insights_describe_schema` (table `platform_data.return_requests`). If the schema's facts ever say something different, the schema wins: it is the live source. Keep this file in step with it.

Use these unless the merchant defines a number otherwise, and say which definition you used. All amounts are in EUR.

| KPI | Definition | SQL (on the period's rows) |
|---|---|---|
| Return Requests | Returned items (Units), whatever their status | `count()` |
| Return Orders | Returns made in one go; one can hold several items | `uniqExact(return_order_id)` |
| Return value | Price paid for the returned items | `sum(purchase_price_value)` |
| Exchange rate | Return Requests where the customer asked for an exchange, divided by all Return Requests, whatever their status | `countIf(requested_resolution = 'Exchange') / count()` |
| Exchange rate by value | The same, by value | `sumIf(purchase_price_value, requested_resolution = 'Exchange') / sum(purchase_price_value)` |
| Store credit rate | Return Requests where the customer asked for store credit, divided by all | `countIf(requested_resolution = 'StoreCredit') / count()` |
| Refunded amount | Value of the refunded items whose refund is processed | `sumIf(resolution_amount_value, resolution_type = 'Refund' AND resolution_status = 'Processed')` |
| Store credit issued | Store credit created, incentive included, **once per store credit** | sum of `any(resolved_store_credit_amount_value)` grouped by `new_store_credit_order_number` (see query-patterns.md) |
| Of which incentive | The bonus part of that store credit | the same with `resolved_store_credit_incentive_amount_value` |
| Consumers | Distinct people who returned | `uniqExact(consumer_hash)` |
| Sales Orders with a return | Distinct order numbers | `uniqExact(purchase_order_number)` |

Things to say with these numbers:

- "Exchange rate" means the share of exchanges, not a currency rate.
- The refunded amount has no refund date: it counts Return Requests registered in the period, and grows as open and approved refunds are processed. It is not the money paid out (shipping refunds, return costs and fees are not in it).
- `consumer_id` is per Store, email and order: count people with `consumer_hash`.
- Requested resolution is what the customer asked for; resolution type is what the merchant gives, and can differ.
