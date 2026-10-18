"""Checks executed result integrity; set VOL_AUDIT_RESULTS for another run."""
import json
import os
import unittest

import numpy as np
import pandas as pd

import run as a


class ResultTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out=a.ROOT/os.environ.get('VOL_AUDIT_RESULTS','volatility_audit/results_20261017')
        cls.diag=cls.out/'family_diagnostics_v2'
        cls.splits={s:pd.read_csv(cls.out/f'{s}_examples.csv') for s in ('train','validation','test')}

    def test_target_thresholds_fit_train_only(self):
        cut=json.loads((self.out/'target_cutoffs.json').read_text())['cutoffs']
        np.testing.assert_allclose(cut,np.quantile(self.splits['train'].realized_cv,[1/3,2/3]),rtol=1e-14)
        for d in self.splits.values(): np.testing.assert_array_equal(a.label(d.realized_cv,cut),d.target)

    def test_no_cross_partition_outcomes(self):
        for split,limit in [('train',60),('validation',90)]:
            d=self.splits[split]
            self.assertTrue((d.origin+14<=limit).all())
        self.assertTrue((self.splits['test'].origin>=90).all())

    def test_frozen_selection_inputs_unchanged(self):
        s=json.loads((self.out/'selection.json').read_text())
        for name,h in s['fingerprints'].items(): self.assertEqual(a.digest(self.out/name),h,name)
        d=json.loads((self.diag/'frozen_diagnostics.json').read_text())
        self.assertTrue(d['frozen_before_forward_test'])
        self.assertEqual(d['selection_sha256'],a.digest(self.out/'selection.json'))

    def test_no_existing_results_or_sources_modified(self):
        for name,h in json.loads((self.out/'preserved_sha256.json').read_text()).items():
            self.assertEqual(a.digest(a.ROOT/name),h,name)

    def test_all_predictions_retained_and_metrics_match(self):
        p=pd.read_csv(self.diag/'all_models_predictions.csv')
        scores=pd.read_csv(self.diag/'all_models_test_metrics.csv').query("level=='pooled'").set_index('model')
        te=self.splits['test']
        for name,d in p.groupby('model',sort=False):
            self.assertEqual(list(zip(d.series,d.origin)),list(zip(te.series,te.origin)))
            self.assertEqual(len(d),len(te))
            for metric in ('macro_f1','high_recall','balanced_accuracy'):
                self.assertAlmostEqual(a.score(d.actual,d.predicted)[metric],scores.loc[name,metric])

    def test_grid_never_swept_on_test(self):
        g=pd.read_csv(self.out/'validation_threshold_grid.csv')
        self.assertEqual(len(g),25)
        names=pd.read_csv(self.out/'test_predictions.csv').model.unique()
        self.assertEqual(sum(n.startswith('grid_') for n in names),1)

    def test_gb_ensemble_uses_all_five_seeds(self):
        p=pd.read_csv(self.diag/'diagnostic_seed_probabilities.csv')
        g=p[p.model.str.startswith('GB_')]
        self.assertEqual(sorted(g.seed.unique().astype(int).tolist()),a.SEEDS)
        self.assertTrue(g.groupby(['series','origin']).size().eq(5).all())
        probs=g.groupby(['series','origin'],sort=False)[['p_low','p_medium','p_high']].mean()
        frozen=json.loads((self.diag/'frozen_diagnostics.json').read_text())['winners']['GB']
        preds=pd.read_csv(self.diag/'all_models_predictions.csv')
        rows=preds[preds.model==frozen['name']].set_index(['series','origin'])
        np.testing.assert_array_equal(a.decide(probs.to_numpy(),frozen['decision']),rows.loc[probs.index,'predicted'])

    def test_bootstrap_clusters_and_five_seeds(self):
        ci=pd.read_csv(self.diag/'test_bootstrap_ci.csv')
        self.assertTrue(ci.draws.eq(5000).all())
        self.assertTrue((ci.valid_draws<=ci.draws).all())
        self.assertTrue(ci[ci.group=='all'].clusters.eq(5).all())
        self.assertTrue(ci[ci.group=='all'].resampling_unit.eq('platform').all())

    def test_no_overlap_diagnostic_count(self):
        d=self.splits['test']; sub=d[(d.origin-90)%14==0]
        for _,g in sub.groupby('series'):
            self.assertTrue((np.diff(g.origin)>=14).all())
        scores=pd.read_csv(self.diag/'all_models_nonoverlap_metrics.csv').query("level=='pooled'")
        self.assertTrue(scores.n.eq(len(sub)).all())


if __name__=='__main__': unittest.main()
