# Pre-test diagnostic reporting amendment

Made after validation, before forward test examples/labels were computed.
Validation found no admissible configuration in NB, logistic or GB families.
The original selection.json and frozen protocol remain unchanged.

For completeness, freeze one unconstrained validation macro-F1 winner in every
family (ties: HIGH recall, balanced accuracy, declared order), and evaluate these
as explicitly rejected diagnostic comparators. These cannot change the selected
model, thresholds, target or eligibility. Refit on train+validation using original
train-only target cutoffs. Preserve all failures and five GB seeds. Save separate
tables beside original results; no overwrite. This prevents hiding failed model
families behind the safety-recall eligibility criterion.
