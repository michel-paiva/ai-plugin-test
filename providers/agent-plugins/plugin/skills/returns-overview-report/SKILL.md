---
name: returns-overview-report
description: >-
  Use when a merchant asks how returns went over a period ("how did returns go last week", "returns this month", "weekly report", "monthly returns report", "overview per store", "compare with last month", "how many returns did we have"). Builds a per-Store overview with a total, compared with the previous equal period, using the merchant app's Insights definitions for exchanges, store credit and refunds.
---

# Returns overview report

The merchant wants the headline numbers for a period, per Store, and how they changed. Answer with a short summary and one table. All numbers come from queries; follow the server's rules for dates (Amsterdam calendar days, data to the end of yesterday) and for letting SQL do every sum, share and comparison.

## 1. Settle the period

- "Last week" is Monday to Sunday, the last full week before today. "Last month" is the last full calendar month. "This week/month" runs to the end of yesterday: say so.
- Take yesterday's date from `dataUntil` in `insights_describe_schema`.
- The comparison period is the equal period right before it (the week before, the month before), unless the merchant asks for something else, such as the same month last year.
- If the period ends today or later, cut it at the end of yesterday and say today's returns are available tomorrow.

## 2. Look up the Stores

Call `core_list_stores`. Note which Stores are **Warranty**: their Return Requests are warranty claims. Report them apart and never fold them silently into "returns".

## 3. Run the queries

Use the patterns in [references/query-patterns.md](references/query-patterns.md), filling in the dates:

1. **Overview per Store**: Return Requests, Return Orders, the previous period's counts and the change, return value, exchange rate, store credit rate and refunded amount. One query, with subtotals for Returns and Warranty and a grand total.
2. **Store credit issued**: a separate query, because one store credit can cover several Return Requests and must be summed once per credit.

The definitions are in [references/kpi-definitions.md](references/kpi-definitions.md). Use them unless the merchant defines a number differently, and name the one you used.

Run more queries only if the merchant asks for more, such as a split by day or by country.

## 4. Present

1. **Summary, 2 to 4 sentences**: the exact period in Amsterdam time (weekday and date, start and end); Return Requests and Return Orders for all Stores together, both, explaining once that a Return Order can hold several items; the change against the previous period, with its dates; and the one or two Stores or numbers that stand out.
2. **One table**, one row per Store, then the subtotals and total, with these columns: Store, Return Requests, Return Orders, Change vs previous, Return value, Exchange rate, Store credit rate, Refunded amount, Store credit issued. Amounts in EUR.
3. **Notes**, only those that apply:
   - Warranty claims are counted apart and are in the total: give their number.
   - The refunded amount counts Return Requests registered in the period whose refund is processed: it grows as open and approved refunds are carried out. It is the value of the refunded items, not the money paid out.
   - Return Requests from before December 2024 can have no Store: they show as "No Store" and count only in the total.
   - If the merchant compares with the Insights dashboard: it counts days in UTC, so a few returns registered just after midnight fall on another day there.

## What it can't answer

No return *rate* (that needs sales: see the `returns-with-sales-data` skill, or suggest connecting a sales connector), no shipping costs, no arrival at the warehouse, and no days from order to return. Say so in one line when asked, and offer what the overview can show instead.
