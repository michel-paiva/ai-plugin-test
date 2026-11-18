---
name: order-return-lookup
description: >-
  Use when a merchant gives an order number and asks what happened to its return ("what happened to the return of order #123456", "status of the return for order 1005505", "was order X refunded", "why was this return denied", "did the customer get store credit or an exchange", a customer service agent checking one return). Shows each returned item of that order with its reason, what the customer asked for, what was decided, and where it stands.
---

# Order return lookup

The merchant, often someone in customer service, has one order number and wants to know what happened to its return. Look it up, then tell the story per return and per item. The tested query and what each status means are in [references/lookup.md](references/lookup.md).

## Steps

1. **The order number.** Take it as the merchant gives it. Order numbers are matched with or without a leading `#` (`#1005505` and `1005505` find the same order). If the merchant gives a customer's name or email instead, explain that customer details are hidden in this data, so the lookup works by order number only, and ask for it.
2. **Run the lookup** (query 1 in references/lookup.md). It returns one row per returned item, across all Stores and all returns made against that order. Don't put the order number in the call's `intent`: write "one order" instead.
3. **No rows?** Say no return is registered for that order number up to the end of yesterday. Possible reasons: the return was started today (available tomorrow), the number has a typo or a prefix the shop doesn't use, or the customer never confirmed the return. Ask the merchant to check the number; don't try look-alike numbers.
4. **Rows:** tell the story.

## Present

- One sentence: how many items were returned against the order, in how many returns (Return Orders), in which Store, and when (Amsterdam time).
- One line or small table per item: product (and size or colour if in the name), reason, what the customer asked for (refund, exchange, store credit), what was decided if different, and the status in plain words:
  - **Open**: not decided yet.
  - **Approved**: approved, not carried out yet.
  - **Processed**: carried out and confirmed by the shop: refund made, store credit issued or exchange order created. It does not mean the money has reached the customer.
  - **Denied**: refused, with the denial reason in words (for example *worn or washed*, *return window expired*).
- For an exchange, give the new exchange order number; for store credit, its reference, when they are there.
- If the merchant asked a specific question ("was it refunded?"), answer it first, in one sentence, then the details.

## Don't

- Don't show or guess the customer's name, email, phone or address: they are masked in this data and must stay that way. Don't show the masked values either.
- Quote the customer's comment only if the merchant asks for it, with any personal data replaced by [removed].
- Don't say when the money arrived or when the parcel reached the warehouse: the data doesn't hold either. For those, point to the shop's order page or the carrier's tracking.
