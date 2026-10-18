# Prompt 2: provenance audit

Executed `forecast_audit/.venv/Scripts/python.exe revision_audit/provenance.py`.
Added PROVENANCE.md, revision_audit/provenance.py and its evidence.json/output log.
No dataset, label, model or prior result changed; before/after numerical metrics
are unchanged. Audited all16 current data CSVs and3 distinct notebook blobs from
all reachable Git history, including deleted notebooks. Git follows the normal
CSV renames to their first additions. Current hashes and checkout metadata are
recorded separately from author dates.

Recovered code for the statistical-label transformation (trailing7 sampleCV,
.3/.6), but no supported original-income generator or original-label definition.
The separate unseeded MongoDB account seeder is not a CSV provenance chain.
Unknown source/license/collection/seed facts remain unknown. PROVENANCE.md ends
with a three-sentence paper-safe statement and team-confirmation checklist.

To reproduce without replacing these evidence files, copy the script to a new
run and change only its OUT/report destinations, or inspect the recorded Git
objects using the revision/file pairs in evidence.json. The audit script reads
notebooks as JSON; it never executes their potentially destructive CSV writes.
