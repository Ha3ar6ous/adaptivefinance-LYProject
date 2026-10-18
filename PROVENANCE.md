# Data provenance

Audit scope: tracked data files, rename-following Git history, metadata, current documentation and all distinct notebook blobs reachable in Git. Notebook code was inspected, never executed. Filesystem times identify this checkout, not acquisition dates.

| Current file | First addition (following renames) | Author date | Author | Rows |
|---|---|---|---|---:|
| data/normal/blinkit_stable.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/blinkit_volatile.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/gig_income_data.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 180 |
| data/normal/snabbit_stable.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/snabbit_volatile.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/swiggy_stable.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/swiggy_volatile.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/uber_stable.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/uber_volatile.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/zomato_stable.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/normal/zomato_volatile.csv | be15e0543528bab679e13397295d732f5aaf7077 | 2026-07-24T01:51:42+05:30 | ha3ar6ous | 120 |
| data/volatility/blinkit_with_volatility_label.csv | 8410983231817ef4fc70f2fab787b1c90aa5c4b6 | 2026-04-27T12:27:08+05:30 | Omkar Dabde | 120 |
| data/volatility/snabbit_with_volatility_label.csv | 0ee96f903e94d92e2546eca1db8e1d80671fce62 | 2026-07-24T14:49:03+05:30 | ha3ar6ous | 120 |
| data/volatility/swiggy_with_volatility_label.csv | 0ee96f903e94d92e2546eca1db8e1d80671fce62 | 2026-07-24T14:49:03+05:30 | ha3ar6ous | 120 |
| data/volatility/uber_with_volatility_label.csv | 0ee96f903e94d92e2546eca1db8e1d80671fce62 | 2026-07-24T14:49:03+05:30 | ha3ar6ous | 120 |
| data/volatility/zomato_with_volatility_label.csv | 8410983231817ef4fc70f2fab787b1c90aa5c4b6 | 2026-04-27T12:27:08+05:30 | Omkar Dabde | 120 |

## Confirmed by repository evidence

- The eleven normal CSVs first appeared at be15e0543528bab679e13397295d732f5aaf7077 (message: datasets added); commit0ee96f903e94d92e2546eca1db8e1d80671fce62 moved them unchanged into data/normal and added five volatility CSVs.
- The deleted notebook 2volatilitymodel/volatility_classifier_2.ipynb is recoverable before5f79bfb7. Its code reads already-labeled platform files, computes grouped trailing7 sample standard deviations (initial undefined SD becomes0), divides by the corresponding means, and writes volatility_label_stat using CV cutoffs0.3/0.6. This is evidence for the statistical-label transformation, not for the original income or volatility_label origin. Numeric reconstruction is documented separately in the executed volatility audit.
- Deleted forecasting notebooks load gig_income_data.csv for ARIMA experiments. Reading a named CSV does not establish who generated or collected it. All distinct historical notebook source cells and keyword hits are preserved in revision_audit/provenance/evidence.json.
- Current server/seed_user.js uses unseeded Math.random to populate a MongoDB user with synthetic Swiggy earnings; it does not write the data/*.csv files. It is not a recovered CSV generator.
- The newer data_audit/run.py generator is a separately authored seeded research dataset, not proof of provenance of the original CSVs. The licensed one-driver case under data_audit/results_20261017 has separate attribution and is not mixed into data/.

## Unknown or unsupported

- Original income-generation code, seeds, acquisition dates, named real workers, collection consent, source license and any row-level link to Kaggle remain unverified. Platform names and realistic-looking amounts do not establish platform authenticity.
- The original volatility_label definition and generator remain unverified. The recovered statistical-label notebook starts with that column already present.
- The paper and informal project notes mention Kaggle and external earnings benchmarks, but the tracked data/history do not supply a verifiable dataset identifier or transformation chain. Those statements are author assertions, not established provenance.

## Team confirmation needed

- Identify the person who created/downloaded each original CSV family and provide the original script/notebook, seed and execution environment.
- Supply exact external dataset URLs/versions, licenses, acquisition dates, transformation steps and evidence linking them to these file hashes, if external data was used.
- Explain the meaning of volatility_label and whether any rows represent observations of actual workers; confirm permission and de-identification where applicable.

## Three-sentence paper-safe provenance statement

The repository contains eleven platform-named daily-income CSVs and five related volatility CSVs, introduced in Git in July2026. Historical notebook code documents the seven-day statistical-label transformation, but does not establish the source of the underlying income values or original volatility labels. We therefore evaluate these files as unverified development datasets and report the separately generated synthetic data and attributed public single-driver case independently.
