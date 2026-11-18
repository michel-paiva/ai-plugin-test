---
name: returnista-getting-started
description: >-
  Use when a merchant says hello to Returnista, asks what Returnista can do in this chat, which account or shops they are connected to, or how to start; also when they ask about their returns but the Returnista tools are missing or not connected. Introduces the connector with example questions built from their own Stores, and explains its limits.
---

# Getting started with Returnista

The merchant wants to know what they can do here. Give a short, personal introduction: who they are connected as, questions that fit their own Stores, and what is not possible. Keep the whole answer under about 200 words.

## When the Returnista tools are not there

If `core_get_started`, `core_list_stores`, `insights_describe_schema` and `insights_run_query` are not among your tools, Returnista is not connected yet. Don't answer from memory and never make up numbers. Tell the merchant how to connect, in their app:

- **claude.ai, Claude Desktop, Cowork**: open the Returnista plugin's **Connectors** tab (or Settings, Connectors), choose Returnista, **Connect**, and sign in with the merchant app login (organisation, email, password, second factor), then allow the connection.
- **Claude Code**: run `/mcp`, choose `returnista`, then **Authenticate**.
- **Other apps**: see https://github.com/returnista/ai-plugin#install.

Then ask them to repeat their question.

## Steps

1. Call `core_get_started`. It says who the merchant is, their role and Account, with generic example questions and the limits.
2. Call `core_list_stores` to see their Stores, each Store's type (Returns or Warranty) and status.
3. Answer in this order:
   - One line: who they are connected as and which Account, as `core_get_started` says it.
   - **3 to 5 example questions built from their Stores**, replacing the generic ones (don't print both lists). Use real Store names:
     - Several Stores: "Compare last month's returns between <Store A> and <Store B>."
     - A Warranty Store: "How many warranty claims did <Warranty Store> get last month, and why?"
     - Always one about reasons ("What are the top return reasons per category this month?") and one about fit ("Which products run small or large?") when their Stores sell clothing or shoes; for other products, "Which products are returned as damaged?"
     - One lookup: "What happened to the return of order #<order number>?"
     - Skip Stores still being set up when you pick names.
   - **Good to know**, three short bullets: Returnista is read-only here; the data runs to the end of yesterday (loaded every night); customers' names, emails and addresses are hidden.
   - **Works better with**: a sales connector (for example Shopify) for return *rates* and launches; inventory and finance connectors for reorders and monthly reports. Only suggest ones that are not connected already: look at which other tools you have.
4. End with one question: what would they like to look at first?

When the merchant asks what is **not** possible, list all of it: change anything in Returnista (read-only); today's returns (available tomorrow); customers' names, emails or addresses (hidden); a return rate (needs sales data); shipping costs, whether a parcel arrived at the warehouse, and the days from order to return (not in the data). Don't add limits that aren't real: per Store, product, category, size, reason, country and period breakdowns all work.

## Don't

- Don't run `insights_run_query` for the introduction: it's not needed and costs the merchant time.
- Don't show Store ids, unless asked.
- Don't promise anything the limits rule out: changing returns, today's returns, customer details, or a return rate without sales data.
