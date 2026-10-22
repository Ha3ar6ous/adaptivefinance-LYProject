"""Small regression suite for the evaluation contract; no live API or database."""
import json
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

import run as a


class AuditTests(unittest.TestCase):
    def test_future_poison_cannot_change_features(self):
        y=np.arange(1.,121.)
        before=a.features(y,60)
        y[60:]=1e12
        self.assertEqual(before,a.features(y,60))

    def test_feature_windows_are_strictly_past(self):
        y=np.arange(1.,121.)
        f=dict(zip(a.FEATURES,a.features(y,60)))
        self.assertEqual(f['mean_7'],np.mean(y[53:60]))
        self.assertAlmostEqual(f['cv_30'],np.std(y[30:60],ddof=1)/np.mean(y[30:60]))
        self.assertEqual(len(f),16)

    def test_future_definition_and_zero_mean(self):
        self.assertIsNone(a.future_cv(np.zeros(14)))
        self.assertIsNone(a.future_cv(np.ones(13)))
        self.assertIsNone(a.future_cv(np.full(14,np.nan)))
        self.assertEqual(a.future_cv(np.ones(14)),0.)

    def test_invalid_history_rejected(self):
        for y in [np.ones(29),np.full(30,np.nan),np.full(30,-1.)]:
            with self.assertRaises(ValueError): a.features(y,len(y))

    def test_target_boundaries(self):
        np.testing.assert_array_equal(a.label([.1,.2,.3,.4],[.2,.4]),[0,1,1,2])

    def test_purged_splits(self):
        s=a.load_series()
        for split,low,high in [('train',30,46),('validation',60,76)]:
            d,e=a.examples(s,split)
            self.assertEqual(e,[])
            self.assertTrue(d.origin.between(low,high).all())
            self.assertTrue((pd.to_datetime(d.outcome_end)-pd.to_datetime(d.outcome_start)).dt.days.eq(13).all())
            self.assertTrue((pd.to_datetime(d.outcome_start)-pd.to_datetime(d.observed_through)).dt.days.eq(1).all())

    def test_high_override_exact_boundary(self):
        p=np.array([[.4,.4,.2],[.5,.31,.19]])
        np.testing.assert_array_equal(a.decide(p,'.2'),[2,0])

    def test_recall_constraint_and_tie_order(self):
        rows=[dict(name='bad',macro_f1=.99,high_recall=.4,balanced_accuracy=.9,order=0),
              dict(name='safe',macro_f1=.6,high_recall=.7,balanced_accuracy=.6,order=1)]
        self.assertEqual(a.choose(rows,.7)['name'],'safe')
        self.assertIsNone(a.choose(rows,.8))

    def test_metrics_and_bootstrap_vectorization(self):
        from sklearn.metrics import f1_score,balanced_accuracy_score
        y=[0,0,1,1,2,2]; p=[0,1,1,2,2,0]
        s=a.score(y,p)
        self.assertAlmostEqual(s['macro_f1'],f1_score(y,p,average='macro'))
        self.assertAlmostEqual(s['balanced_accuracy'],balanced_accuracy_score(y,p))
        m,h,*_=a.metric(np.stack([a.matrix(y,p)]*2))
        np.testing.assert_allclose(m,s['macro_f1'])
        np.testing.assert_allclose(h,.5)

    def test_high_recall_unavailable_without_support(self):
        self.assertIsNone(a.score([0,1],[0,1])['high_recall'])

    def test_seed_contract(self):
        self.assertEqual(len(set(a.SEEDS)),5)
        self.assertEqual(len(a.configs()),19)


if __name__=='__main__': unittest.main()
