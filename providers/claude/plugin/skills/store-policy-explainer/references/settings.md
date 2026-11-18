# Store settings: what they mean and what they explain

The schema (`insights_describe_schema`, table `platform_data.store_config`) is the source for each column; this file adds what each setting does to the return numbers. Name a setting by its label in the merchant app (the column's `displayAs`).

| Label (column) | In plain words | What it can explain |
|---|---|---|
| Return period (`return_policy_return_period_days`) | Days after the order is delivered (fulfilled) within which a customer can start a return | Returns that start late; a short period means fewer returns |
| Grace period (`return_policy_grace_period`) | Extra days after the Return period, not shown to customers | Returns that look "too late" but were accepted. Last day = Return period + Grace period |
| Allow Exchanges (`return_policy_allow_exchanges`) | Customers can choose an exchange instead of a refund | Off: few or no exchanges |
| Free returns for exchanges (`price_modifiers_is_free_exchange_returns`) | Returns with an exchange get free shipping | On: more exchanges. Being replaced by free exchange return rules, which are not visible here |
| Allow Store credit (`store_credit_enabled`) | Customers can choose store credit instead of a refund | Off: no store credit |
| Incentive type (`store_credit_incentive_type`) | A bonus for choosing store credit: a percentage or a fixed amount | On: more store credit, and store credit issued above the return value |
| Incentive percentage / Maximum amount | The percentage bonus, up to a maximum | Read only when the type is Percentage |
| Incentive amount | The fixed bonus | Read only when the type is FixedAmount |
| Unsupported payment methods (`store_credit_unsupported_payment_methods`) | Orders paid this way get no store credit option | Less store credit than expected |
| Charge type (`return_policy_charge_type`) | How customers pay return costs: *payment* (paid in the Returns portal before the label) or *deduction* (taken off the refund) | Deduction: refunds lower than the price paid |
| Shipping fee (`return_policy_shipping_fee_amount`) | A flat fee per return on top of the shipping option's price | Lower refunds (with deduction), fewer small returns |
| Return request fee / Request fee threshold | A fee per item after the first N items in one return, EUR orders only | Customers returning fewer items per return |
| Resolution SLA (`return_policy_resolution_sla`) | Days customers are told to expect their refund | Customer expectations, not the data |
| Max return shipments | Parcels one return can be sent in | Several labels per return |
| Non-returnable categories | Categories customers can't return | No returns in those categories |
| Enable Gatekeeping (`return_policy_gatekeeping_enabled`) | The merchant asks questions and approves returns before they go ahead | More returns waiting (Open) and some Denied |
| Magic link login / Postal code & Order number login | How customers sign in to the Returns portal | How easy it is to start a return |
| `single_order_flow` | When false (Multi-order flow on), one return can hold items from several orders | Return Orders spanning several order numbers |
| `return_policy_exchange_price_filter_enabled` | Exchanges limited to products that cost no more than the returned one | Fewer exchanges for cheaper items |
| `status` | New or Onboarding (being set up), Active, Closed | Stores without returns |
| `type` | Returns or Warranty | Warranty claims counted as Return Requests |

Not in the table: return rules, vouchers, shipping options and their prices, and which attributes an exchange may differ in.
