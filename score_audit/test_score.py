import json
import os
import unittest
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
import run as s

R=s.ROOT/os.environ.get('SCORE_AUDIT_RESULTS','score_audit/results_20261017')


class ScoreTests(unittest.TestCase):
    def test_monotonic_candidate(self):
        self.assertEqual(json.loads((R/'corrected_expense_monotonicity.json').read_text())['score_increased'],0)

    def test_original_failure_retained(self):
        self.assertGreater(json.loads((R/'original_expense_monotonicity.json').read_text())['score_increased'],0)

    def test_frozen_selection(self):
        for p,h in json.loads((R/'selection.json').read_text())['hashes'].items():self.assertEqual(s.base.sha(R/p),h)

    def test_no_source_edits(self):
        self.assertEqual(json.loads((R/'preservation_check.json').read_text())['changed'],[])
        self.assertEqual(s.base.sha(R/'health_original.js'),s.base.sha(s.ROOT/'server/services/healthScoreService.js'))

    def test_heldout_metrics(self):
        d=pd.read_csv(R/'test_predictions.csv');m=pd.read_csv(R/'test_metrics.csv').set_index('model')
        for name in m.index:self.assertAlmostEqual(roc_auc_score(d.outcome,d[name]),m.loc[name,'auc'])

    def test_weighted_auc_ci_matches_sklearn(self):
        rng=np.random.default_rng(5);d=pd.DataFrame(dict(platform=np.repeat(list('abcde'),10),outcome=np.tile([0,1],25)))
        p=rng.choice([.1,.3,.6,.9],size=50)
        actual=s.ci(d,p)
        weights=np.concatenate([np.random.default_rng(seed).multinomial(5,np.ones(5)/5,size=200) for seed in s.base.VAL_SEEDS])
        values=[roc_auc_score(d.outcome,p,sample_weight=np.repeat(w,10)) for w in weights]
        self.assertAlmostEqual(actual['auc_lo95'],np.quantile(values,.025))
        self.assertAlmostEqual(actual['auc_hi95'],np.quantile(values,.975))


if __name__=='__main__':unittest.main()
