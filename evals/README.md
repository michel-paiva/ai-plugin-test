# Eval cases

Behavioural tests for the skills, run with `claude plugin eval` (Claude Code). Each case is a folder with a `prompt.md` (the merchant's question) and `graders/` (what a good answer must do or avoid). Three cases per skill; the case's tag is the skill it tests.

Every case loads the Claude plugin from `providers/claude/plugin` (its `plugins:` key), so run `node ci/generate-providers.mjs` after changing a skill.

## Running

From the repository root:

```bash
# one case, one run: cheapest check while you work on a skill
claude plugin eval . --case lookup-order --runs 1 --ablation none --no-publish

# everything once, four at a time (about $5 to $8)
claude plugin eval . --runs 1 --ablation none --no-publish --concurrency 4 --threshold 0

# one skill's cases
claude plugin eval . --tag sizing-and-fit --runs 1 --ablation none --no-publish
```

Drop `--ablation none` to also run each case without the plugin and see what the skills add. Results and an HTML report land in `evals/results/` (not committed).

## The connector is mocked

The real connector needs a sign-in, so the cases run against stand-ins in [`mocks/returnista/`](mocks/returnista/), for a made-up Account, **Example Fashion**, with Stores NL, DE, a Warranty Store and one still being set up; data runs to 17 November 2026.

| File | What it is | Where it comes from |
|---|---|---|
| `_tools.json` | The connector's real `tools/list` answer: tool names, descriptions and input schemas | Exported from returnista-mcp's `createMcpServer()` |
| `core_get_started.md` | A fixed answer | returnista-mcp's `getStartedText()` for a made-up User |
| `core_list_stores.md` | A fixed answer | Made up, in the real tool's shape |
| `insights_describe_schema.md` | A fixed answer | platform-insights' `insightsSchema('2026-11-17')` |
| `insights_run_query.md` | An agent mock: a model makes up plausible rows for each SQL | Written by hand |

Every mock checks that the call has an `intent` (`expect:`); the query mock also stops the run if the intent holds a name, email or order number.

Refresh the schema and tools when the connector changes (run from the folder that holds the repositories, with Node 24):

```bash
cd platform-insights && node --input-type=module -e "
import { insightsSchema } from '#core/domain/schema/insights-schema.ts'
process.stdout.write('---\nexpect:\n  intent: string\n---\n' + JSON.stringify(insightsSchema('2026-11-17')) + '\n')
" > ../ai-plugin/evals/mocks/returnista/insights_describe_schema.md
```

For `_tools.json`, connect an in-memory MCP client to returnista-mcp's `createMcpServer({})` and save `client.listTools()`.

Known gaps:

- The mocks don't send the connector's server instructions (sent on `initialize` in real use); the schema's facts cover most of the same rules.
- The query mock's numbers are made up, so graders check the shape of an answer (the right dates, columns, caveats, no personal data), not exact numbers. Check real numbers by hand against a test Account, as below.
- An agent mock gives a different answer each run. To pin one, copy its recording from `evals/results/<run>/mock-recordings/` into `mocks/.replay/returnista/`, as the run's output explains.

## By hand, against the real connector

Before a release, run the cases' prompts in claude.ai with the plugin installed and Returnista connected to a test Account, and check each answer against its graders.

## Cases

| Case | Skill | Checks |
|---|---|---|
| getting-started-hello | returnista-getting-started | Personal introduction, examples with real Store names, limits |
| getting-started-which-shops | returnista-getting-started | Lists Stores with type, no ids |
| getting-started-limits | returnista-getting-started | Real limits only |
| overview-last-week | returns-overview-report | Return Requests and Return Orders, exact Amsterdam dates, per Store, warranty apart |
| overview-today | returns-overview-report | Data runs to yesterday; offers yesterday |
| overview-monthly-report | returns-overview-report | Summary and table, KPI definitions, compared with the month before |
| reasons-per-category | return-reasons-analysis | This month to yesterday, top reasons per category, "No category" |
| reasons-comments-about-fit | return-reasons-analysis | Themes counted by a query, no personal data |
| reasons-damaged-products | return-reasons-analysis | Products ranked, damage not claimed as confirmed |
| sizing-which-run-small | sizing-and-fit | Size attributes read and SKU with name grouped; share of returns, not a rate |
| sizing-one-product | sizing-and-fit | Per-size verdict for one product |
| sizing-german-attribute-names | sizing-and-fit | Reads Größe as size |
| policy-what-is-it | store-policy-explainer | store_config with FINAL; policy in plain words |
| policy-few-exchanges | store-policy-explainer | Links Allow Exchanges off to few exchanges; timing caveat |
| policy-refunds-below-price | store-policy-explainer | Charge type deduction; no invented payouts |
| lookup-order | order-return-lookup | Item by item, statuses in words, no personal data |
| lookup-by-email-refused | order-return-lookup | No lookup by email; asks for the order number |
| lookup-was-it-refunded | order-return-lookup | Answers first, "processed" explained |
| sales-return-rate-without-sales | returns-with-sales-data | No invented rate; suggests a sales connector |
| sales-collection-without-sales | returns-with-sales-data | Doesn't guess the collection or a rate |
| sales-rate-with-given-sales | returns-with-sales-data | Sold units passed into the SQL; rate from the query |
