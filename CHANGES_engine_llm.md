# Engine / LLM change log

2026-10-17, second prompts.md task. Frozen original service source before changes
in engine_llm_audit/results_20261017/*_before.js. Existing results untouched.
1,728 financial-profile enumeration uses original parameter grid, with valid
consistent analytics; old synthetic_control/missing-date fixtures are now correctly
blocked by revised router and cannot evaluate allocations. No flattering relabeling:
this is an explicit input-contract repair, not a like-for-like old eligibility claim.

LLM evaluation: 125 varied synthetic snapshots (25 per fixed seed11/23/37/53/71),
controlled valid/schema/numeric999/product/context-corruption cases before/after.
Live API capability discovery returned configured credentials (never printed),
HTTP200 models list. Pin openai/gpt-oss-20b for JSON calls; existing qwen model
is available but preview. Official docs consulted 2026-10-17:
https://console.groq.com/docs/models and /docs/structured-outputs.

For a hard no-invented-facts contract, model will select a snapshot-bound template
and echo typed facts, rather than produce arbitrary prose. Backend renders all
numbers/products/decisions from the snapshot. This deliberately restricts creative
explanation; do not claim free-form narrative quality or semantic comprehension.
Existing public explanation fields remain. Unknown fields/altered facts/text are
rejected and deterministic fallback activates. JSON mode is retained with a precise
schema prompt; old JSON mode alone did not guarantee schema or semantics.

## Executed engine changes and results

Changed server/services/investmentEngineService.js only in scoring metadata and
allocation: retain parsed product minimum, round integer rupees by stable largest
remainder, drop the lowest-ranked infeasible product one at a time and redistribute;
round displayed percentages by largest remainder from actual allocations. Preserve
router revalidation, hard filters, proposed ranking and projections. Never allocate
below minimum; no feasible selected product means no recommendation. No profitability
optimization or new market dataset. Allocation can retain fewer than five products.

Grid: income500/1000/3000; balance60000/61000/100000/200000; debt0/10000/50000/100000;
volatility low/medium/high/unknown; risk low/medium/high; forecast ratio.85/1/1.15.
Expenses20000, 30 entries. Alternating positive incomes reproduce requested CV
(.1/.5/.8), valid dates/method/horizon and consistent CV features. Same fixtures
before and after. Deterministic exhaustive enumeration needs no random replicas.

| Method | Profiles | Eligible | Allocations | Below-minimum allocations | Profiles with percent sum≠100 | Hard-filter violations | Budget violations | Mean unused ₹ (eligible) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Original proposed | 1728 | 216 | 1080 | 312 | 120 | 0 | 0 | 2.185185 |
| Revised proposed | 1728 | 216 | 792 | 0 | 0 | 0 | 0 | 0 |
| Equal-weight baseline | 1728 | 216 | 540 | 0 | 0 | 0 | 0 | 0 |
| Risk-only baseline | 1728 | 216 | 624 | 0 | 0 | 0 | 0 | 0 |

Equal-weight uses dataset order with equal scores; risk-only ranks by risk match.
Both use identical hard filters, top-five limit and corrected allocator. On216
eligible profiles, proposed/equal mean Jaccard0, top1 agreement0; proposed/risk-only
Jaccard .503703704, top1 .222222222. This quantifies different recommendations,
not ranking superiority. No suitability ground truth or market-return backtest.
Minima retain the existing loader's monthly interpretation of varied CSV terms;
this does not establish legal product terms, annual contribution rules or suitability.

## Executed explanation changes and results

Changed aiExplanationService.js: templateId∈{standard,concise}, exact typed facts
(health score, forecast total, eligibility, product name, allocation), no extra keys.
Render public strings from snapshot-bound templates; legacy full-text accepted only
if exactly an approved snapshot rendering. Altered numbers/products/decisions fail
closed. Existing catch/fallback orchestration retained. Snapshot must be supplied
to semantic validation. No unrestricted prose passes to the user.

Changed groqService.js JSON path: pinned model openai/gpt-oss-20b, JSON object mode,
temperature0, reasoning_effort low, max_completion_tokens512, optional fixed seed.
Text-chat path unchanged. Provider model IDs are pinned, not immutable weight hashes.
Model discovery HTTP200 and one smoke call succeeded before the full experiment.
No API key or real-user profile was printed/saved/transmitted by this audit.

125 synthetic snapshots, five generation/request seeds11/23/37/53/71 ×25, varying
scores/phases, volatility, expenses/debt, forecasts, eligibility and real catalog
product names. Live snapshots/seed IDs archived. No prompt/model/threshold tuning
after live results; fixed 2.1s inter-call pacing, 12s timeout, no retries.

| Live measurement | Result | Denominator |
|---|---:|---|
| Requests | 125 | all scheduled snapshots |
| API successes | 106 (84.8%) | 125 |
| Strict schema passes | 106 (84.8%) | 125; 106/106 API successes |
| Raw typed facts faithful | 106 (84.8%) | 125; 106/106 successful responses |
| Fallback activations | 19 (15.2%) | 125 |
| HTTP429 failures | 19 | 125 |
| Live timeout failures | 0 | 125 |
| API-inclusive latency mean | 392.204282 ms | all125, including fast failures |
| API-inclusive latency p95 | 570.313040 ms | all125, linear quantile |
| Successful API latency mean | 457.831086 ms | 106 successes |

Latencies include HTTP/JSON/validation/fallback work, exclude artificial pacing;
they are not local compute benchmarks. Fast rate-limit errors lower the overall
mean. Live numeric/product faithfulness refers to raw typed facts; public text is
deterministically rendered, not evaluated unrestricted generation. No independent
human quality, readability or decision-utility study was performed.

Controlled125 snapshots ×5 cases: original accepts all125 score999, all125 invented
product, all125 context-swapped number responses; revised rejects all375/375.
Both reject125/125 empty schemas and accept125/125 approved valid responses.
Actual revised generate→validate→store/fallback orchestration exercised625 cases:
125 valid ready;125 injected transport timeouts,125 schema errors,125 fact changes,
125 unauthorized prose all fallback, original source snapshot score preserved.
These are LOCAL mock failures, not live timeout latency measurements.

## Tests / commands / limitations

Added server/tests/engineExplanation.test.cjs: eight checks for stable rounding,
minimum redistribution, budgets, unknown content/typed decisions, full enumeration,
model/JSON/seed configuration and actual client timeout path. Existing11 router
tests still pass: **19 total passed, 0 failed**. Output node_tests.txt. No dependency
install or DB write. Python3.11.9/numpy2.3.4/pandas2.3.3; Node22.18.0.

Raw files and CSVs in engine_llm_audit/results_20261017. Before/after service
snapshots retained. engine_summary.csv, ranking_comparison.csv, controlled_summary.csv,
live_summary.csv contain copyable results; all125 live rows include failures/raw JSON.
Old paper_audit/research_eval results were NOT rerun into their existing paths.

Actually executed: `node engine_llm_audit/evaluate.cjs before`, then authorized
code fixes, `node engine_llm_audit/evaluate.cjs after`, `node .../live.cjs --smoke`,
`node .../live.cjs`, `node .../orchestration.cjs`, and Python summarize.py.
Fresh output reproduction using archived originals (PowerShell):

```powershell
$env:ENGINE_AUDIT_OUT='engine_llm_audit/reproduction'
node engine_llm_audit/evaluate.cjs before --archive-before
node engine_llm_audit/evaluate.cjs after
node engine_llm_audit/orchestration.cjs
# Live repeat spends API quota; uses existing server/.env privately:
node engine_llm_audit/live.cjs
forecast_audit/.venv/Scripts/python.exe engine_llm_audit/summarize.py
node --test server/tests/engineExplanation.test.cjs server/tests/routerSafety.test.cjs
```

Offline before/after numbers are deterministic under archived inputs. Live counts,
latency and provider model revisions are time/quota-dependent; archived observations
must not be represented as guaranteed reproducible service performance. No retries
hide failures. Template constraints exchange expressive flexibility for checkable
fidelity; they do not prove source facts, financial advice, health weights, product
profitability or fallback wording are appropriate. Existing forecastDirection
compares two representations of the same forecast average; trend explanation remains
ill-defined and must not be claimed validated by these tests.
