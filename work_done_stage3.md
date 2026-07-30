Implemented the micro-investment suggestion engine.
What changed:
Added curated CSV normalization from server/data/seed/investments-mod.csv.
Added investment engine scoring/filtering/projection logic.
Added InvestmentSuggestion Mongo model.
Added investment APIs:GET /api/investments/me
POST /api/investments/run

Wired investment suggestion refresh into the existing analytics refresh pipeline.
Added riskPreference to User, defaulting to low.
Updated dashboard Home to show top investment suggestion or blocked reason.
Updated Route 3 to show full investment suggestions, projections, tags, and refresh button.
Verification done:
Backend JS syntax checks passed.
CSV parser smoke test passed: loaded 37 curated options.
Engine smoke test passed: eligible mock user received 5 ranked suggestions.
Frontend npm run build passed.
Manual test:
Start ML service, backend, and frontend.
Log in with a user who has income entries and onboarding data.
Click Dashboard Refresh.
Open Dashboard Home and Route 3.
If Stage 2 router allows investing, you should see ranked suggestions. If not, you’ll see the blocked reason from the safety router.