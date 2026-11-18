# Returnista for AI assistants

Ask about your returns in plain language, in Claude, ChatGPT, Codex and other AI assistants. The Returnista plugin connects your assistant to your Returnista account (read-only) and teaches it how to answer returns questions well: which numbers to fetch, how to compare periods and Stores, and how to present the result.

It is made for the people who run returns: e-commerce, customer service, operations and finance. No technical knowledge is needed.

## What you can ask

- "Give me an overview of last week's returns per Store, compared with the week before."
- "What are the top return reasons per category this month?"
- "Which products run small or large, and in which sizes?"
- "What do customers write in their return comments about fit?"
- "What is the return policy of each of our shops, and why do we get so few exchanges in Germany?"
- "What happened to the return of order #123456?"
- With a sales connector such as Shopify: "What is the return rate per product for the new collection?"

## What's inside

- **The Returnista connector** (MCP server at `https://mcp.returnista.com/mcp`): reads your Account's Return Requests and Store settings. You sign in with your merchant app login; there is no API key.
- **Skills**: short guides the assistant loads when your question needs them.

| Skill | Helps with |
|---|---|
| [returnista-getting-started](skills/returnista-getting-started/) | What you can ask, with examples for your own Stores |
| [returns-overview-report](skills/returns-overview-report/) | Weekly and monthly overviews per Store, compared with the period before |
| [return-reasons-analysis](skills/return-reasons-analysis/) | Top reasons per Store, category or product; themes in return comments |
| [sizing-and-fit](skills/sizing-and-fit/) | Products and sizes that run small or large |
| [store-policy-explainer](skills/store-policy-explainer/) | Your return policy in plain words, and how it shapes the numbers |
| [order-return-lookup](skills/order-return-lookup/) | What happened to one order's return, item by item |
| [returns-with-sales-data](skills/returns-with-sales-data/) | Return rates, with sales from your shop's connector |

## Install

You need a Returnista merchant app login with the Account Admin or Returns Manager role.

### Claude (claude.ai, Claude Desktop, Cowork)

1. Go to **Customize → Plugins → Add → Add marketplace** and enter `https://github.com/returnista/ai-plugin`.
2. Install the **Returnista** plugin.
3. Open the plugin's **Connectors** tab, choose **Connect** next to Returnista, and sign in with your merchant app login (organisation, email, password and second factor). Allow the connection.
4. Start a chat and say "Get started with Returnista".

**Team and Enterprise plans:** an Owner can add the marketplace for the whole organisation, and make the plugin available or install it by default for everyone. Each person still signs in to Returnista with their own login, and sees only their own Account.

### Claude Code

```bash
claude plugin marketplace add returnista/ai-plugin
claude plugin install returnista@returnista
```

Then run `/mcp`, choose `returnista` and **Authenticate**. Update later with `claude plugin marketplace update returnista`.

### Codex, VS Code, GitHub Copilot and other Agent Plugins clients

The plugin for these clients is in [`providers/agent-plugins/plugin`](providers/agent-plugins/plugin/), in the [Agent Plugins](https://agent-plugins.org) format. In Codex:

```bash
codex plugin add github:returnista/ai-plugin
codex mcp login returnista
```

In a client that loads plugins from a folder, point it at `providers/agent-plugins/plugin`.

### Only the connector

Any assistant that supports remote MCP servers with sign-in can use the connector without the skills: add `https://mcp.returnista.com/mcp` as a custom connector (in Claude: Settings → Connectors → Add custom connector; in Codex: `codex mcp add returnista --url https://mcp.returnista.com/mcp`). You get the same data; the skills make the answers better.

## Your data

- **Read-only.** The assistant can't change anything in Returnista: no returns, refunds or settings.
- **Your own Account only.** You sign in with your merchant app login, and every request is checked again by Returnista. A User sees only their own Account's data.
- **Customers' personal details are hidden.** Names, email addresses, phone numbers and addresses are masked before the assistant can read them. The one exception is the free-text comment a customer types with a return: the skills tell the assistant to quote comments only when you ask, and to remove any personal details from them.
- **Up to the end of yesterday.** The data is loaded every night; today's returns are available tomorrow.
- **What is sent where.** Your questions and the rows the assistant reads go to the AI provider of the app you use (for example Anthropic for Claude), under that provider's terms and your plan's data settings. Returnista logs each tool call (which tool, the assistant's one-line goal, the SQL it ran, and how it went) to operate and improve the service, but not the rows it returns.
- **What it can't answer.** Return rates (that needs your sales data: connect your shop's connector), shipping costs, arrival at the warehouse, and the days between order and return.

## Support

- Help and questions: [returnista.nl/en/contact](https://www.returnista.nl/en/contact)
- Privacy policy: [returnista.nl/en/privacy](https://www.returnista.nl/en/privacy)
- Terms and conditions: [returnista.nl/en/terms-and-conditions](https://www.returnista.nl/en/terms-and-conditions)

## For contributors

Skills are written once in [`skills/`](skills/); each client's plugin in `providers/` is generated from them and from [`plugin.config.json`](plugin.config.json) (name, version, description, links, connector URL). Never edit `providers/` by hand.

```bash
node ci/generate-providers.mjs           # copy skills/ into every provider, write the manifests
node ci/validate-structure.mjs           # structure, versions, URLs, secrets
claude plugin validate --strict providers/claude/plugin
claude plugin validate --strict .
```

Test locally with `claude --plugin-dir providers/claude/plugin`. The eval cases and how to run them are in [evals/README.md](evals/README.md); how this repository is put together is in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
