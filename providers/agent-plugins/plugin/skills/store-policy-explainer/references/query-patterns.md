# Query patterns for store settings

Tested against the live server.

## 1. The return policy of each Store

```sql
SELECT
  trim(store_name) AS "Store",
  type AS "Type",
  status AS "Status",
  return_policy_return_period_days AS "Return period",
  return_policy_grace_period AS "Grace period",
  ifNull(return_policy_return_period_days, 0) + ifNull(return_policy_grace_period, 0) AS "Last day to start a return",
  return_policy_allow_exchanges AS "Allow Exchanges",
  store_credit_enabled AS "Allow Store credit",
  store_credit_incentive_type AS "Incentive type",
  store_credit_incentive_percentage AS "Incentive percentage",
  store_credit_incentive_maximum_amount AS "Maximum amount",
  store_credit_incentive_amount AS "Incentive amount",
  store_credit_incentive_amount_currency AS "Incentive amount currency",
  return_policy_charge_type AS "Charge type",
  return_policy_shipping_fee_amount AS "Shipping fee",
  return_policy_shipping_fee_currency AS "Shipping fee currency",
  return_policy_return_request_fee_amount AS "Return request fee",
  return_policy_return_request_fee_threshold AS "Request fee threshold",
  return_policy_gatekeeping_enabled AS "Enable Gatekeeping",
  return_policy_non_returnable_categories AS "Non-returnable categories",
  formatDateTime(updated_at, '%Y-%m-%d') AS "Settings last changed"
FROM platform_data.store_config FINAL
ORDER BY "Store", "Type"
```

## 2. Settings next to the numbers

```sql
SELECT
  trim(s.store_name) AS "Store",
  s.type AS "Type",
  s.return_policy_allow_exchanges AS "Allow Exchanges",
  s.store_credit_enabled AS "Allow Store credit",
  s.store_credit_incentive_type AS "Incentive type",
  s.return_policy_charge_type AS "Charge type",
  count() AS "Return Requests",
  round(100 * countIf(r.requested_resolution = 'Exchange') / count(), 1) AS "Exchange %",
  round(100 * countIf(r.requested_resolution = 'StoreCredit') / count(), 1) AS "Store credit %",
  round(100 * countIf(r.requested_resolution = 'Refund') / count(), 1) AS "Refund %",
  formatDateTime(s.updated_at, '%Y-%m-%d') AS "Settings last changed"
FROM platform_data.return_requests AS r
JOIN platform_data.store_config AS s FINAL ON s.store_id = r.store_id
WHERE r.created_at >= toDateTime('2026-10-01', 'Europe/Amsterdam') AND r.created_at < toDateTime('2026-11-01', 'Europe/Amsterdam')
GROUP BY s.store_id, s.store_name, s.type, s.return_policy_allow_exchanges, s.store_credit_enabled,
         s.store_credit_incentive_type, s.return_policy_charge_type, s.updated_at
ORDER BY "Return Requests" DESC
```

## 3. Refunds against the price paid

The data can't show the deduction itself: `resolution_amount_value` is the item's value (it equals the price paid), not the money paid out after costs were deducted. So when a merchant asks why refunds are lower than prices, say which Stores have Charge type *deduction* and what is deducted per return (the shipping option's price, the Shipping fee, the Return request fee), and that the amounts actually paid out are in the shop's own refund or payment data.
