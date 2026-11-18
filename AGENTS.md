# AGENTS.md

This repository packages the Returnista connector (the remote MCP server built in returnista-mcp, at `https://mcp.returnista.com/mcp`) together with Agent Skills, as one plugin per AI client. It is modelled on Mollie's public plugin repository (github.com/mollie/ai). The audience is merchants (e-commerce, customer service, operations, finance) in Claude chat, Cowork and other assistants, not developers.

## Layout

- `skills/`: the only place a skill is written. One folder per skill, `SKILL.md` plus `references/`.
- `plugin.config.json`: the plugin's name, version, description, links and connector URL. The single source for every manifest.
- `assets/icon.svg` and `assets/icon.png`: the listing icon, the "Re:" mark from the Returnista logo (paths from platform-oauth's `logo-dark.svg`) in white on the website's purple `#8446E9`, at 1024 px. The generator copies the PNG into each provider. To re-render the PNG, open the SVG in Chrome headless at 1024×1024 and take a screenshot. The directory takes the icon only on the first submission.
- `providers/`: generated, never edited by hand.
  - `claude/plugin/`: Claude format (`.claude-plugin/plugin.json`, `.mcp.json`, `skills/`).
  - `agent-plugins/plugin/`: Agent Plugins 1.0 (`plugin.json`, `mcp.json`, `skills/` at the root), plus `.codex-plugin/plugin.json` for Codex, which reads its own manifest.
- `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`: marketplace pointers into `providers/`; `.mcp.json` at the root so opening the repository in an IDE connects the server. All generated.
- `ci/generate-providers.mjs`: writes everything above from `skills/` and `plugin.config.json` (`--check` to only compare).
- `ci/validate-structure.mjs`: skills, drift, versions, URLs, Agent Plugins fields, secrets, eval cases.
- `evals/`: eval cases for `claude plugin eval`, with mocks of the connector in `evals/mocks/returnista/`. See `evals/README.md`.

## Rules

- Edit skills only in `skills/`, then run `node ci/generate-providers.mjs` and commit `providers/` with the change. CI fails when they drift.
- A test copy or fork of this repository builds with its own URL: `PLUGIN_REPOSITORY=https://github.com/<owner>/<repo> node ci/generate-providers.mjs`, then commit. That copy's CI sets the same variable to the repository it runs in, so it checks against its own URL. Before pushing to `returnista/ai-plugin`, run the generator without it.
- Change the version, links or connector URL only in `plugin.config.json`. The connector URL must stay exactly the one in Returnista's connector directory listing, so people with both see one set of tools.
- Never put a token, API key or `Authorization` header in the repository: the connector signs in with OAuth. The validator scans for them.
- No top-level `bin/` in a plugin: claude.ai and Cowork refuse to install it.
- Skills add *workflows*: which questions to ask, which queries to run in which order, how to present the answer. The connector already sends its rules (vocabulary, Amsterdam time zone, data to yesterday, SQL does all arithmetic) and `insights_describe_schema` holds the columns and facts. Refer to those in one line; never copy them word for word, or the two drift apart.
- Every SQL snippet in a skill is run against the live connector (`insights_run_query`) before it is committed. The server accepts one `SELECT` or `WITH ... SELECT` on `platform_data.return_requests` and `platform_data.store_config`, without `SETTINGS`, `FORMAT`, `dictGet` or `joinGet`. Match text case-insensitively with `lowerUTF8`, not `lower` (which is ASCII only).
- A skill's `description` names the merchant's situations and phrasings, since that line decides when the skill loads. Write it as a folded block (`description: >-`): in a plain YAML value, ` #` starts a comment and cuts it short.
- Mention every file in `references/` in `SKILL.md`, so the model knows to load it. Keep `SKILL.md` well under 500 lines.
- Skills never show customers' personal data, and quote `return_reason_comment` only when the merchant asks, with personal data removed. The `intent` of a tool call is logged: skills never put names, emails or order numbers in it.
- When the connector's tools or schema change, refresh `evals/mocks/returnista/` (see `evals/README.md`) and check the skills that use the changed columns.

## Commands

```bash
node ci/generate-providers.mjs
node ci/validate-structure.mjs
claude plugin validate --strict providers/claude/plugin
claude plugin validate --strict .
claude --plugin-dir providers/claude/plugin         # try it locally; /mcp to sign in
claude plugin eval . --case <name> --runs 1 --ablation none --no-publish
```
