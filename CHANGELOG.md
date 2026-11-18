# Changelog

The version lives in `plugin.config.json`; `node ci/generate-providers.mjs` writes it into every manifest.

## 0.1.0 (unreleased)

First version.

- The Returnista connector (`https://mcp.returnista.com/mcp`, sign-in with the merchant app login) for Claude and Agent Plugins clients (Codex, VS Code, GitHub Copilot).
- Seven skills: `returnista-getting-started`, `returns-overview-report`, `return-reasons-analysis`, `sizing-and-fit`, `store-policy-explainer`, `order-return-lookup`, `returns-with-sales-data`. Every SQL pattern in them was run against the live connector on 18 November 2026.
- 21 eval cases with mocks of the connector's four tools.
