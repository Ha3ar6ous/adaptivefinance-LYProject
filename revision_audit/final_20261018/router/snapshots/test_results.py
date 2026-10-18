import json
import os
import unittest

import numpy as np
import pandas as pd

import simulate as s


class ResultTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out=s.ROOT/os.environ.get('ROUTER_SIM_RESULTS','router_sim/results_20261017')
        cls.val=pd.read_csv(cls.out/'validation_per_seed.csv')
        cls.test=pd.read_csv(cls.out/'test_per_seed.csv')

    def test_population_and_repetitions(self):
        for d,seeds in [(self.val,s.VAL_SEEDS),(self.test,s.TEST_SEEDS)]:
            self.assertTrue(d.n.eq(10000).all())
            self.assertEqual(sorted(d.seed.unique()),seeds)
            self.assertTrue(d.groupby(['scenario','execution','policy']).seed.nunique().eq(5).all())
        self.assertEqual(len(self.val),530)
        self.assertEqual(len(self.test),180)

    def test_rate_counts_and_bounds(self):
        for d in (self.val,self.test):
            for rate,count in [('shortfall_rate','shortfall_users'),('forced_liquidation_rate','forced_liquidation_users'),
                               ('ever_cleared','cleared_users'),('ever_contributed','contributing_users')]:
                np.testing.assert_allclose(d[rate],d[count]/d.n)
                self.assertTrue(d[rate].between(0,1).all())
            self.assertTrue(d.months_below_1.between(0,12).all())
            self.assertTrue((d.months_below_1<=d.months_below_3).all())
            self.assertTrue((d.shortfall_or_liquidation_rate>=d.shortfall_rate).all())

    def test_no_investing_has_no_forced_sales_or_contributions(self):
        for d in (self.val,self.test):
            sub=d[d.policy=='no_investing']
            for k in ('forced_liquidation_rate','ever_cleared','ever_contributed','total_contributions'):
                self.assertTrue(sub[k].eq(0).all())

    def test_neutral_wealth_conservation_all_policies(self):
        for (seed,mode),d in self.test[self.test.scenario=='neutral'].groupby(['seed','execution']):
            reference=d[d.policy=='no_investing'].final_net_wealth.iloc[0]
            np.testing.assert_allclose(d.final_net_wealth,reference,rtol=1e-12,atol=1e-7)

    def test_engine_floor_masks_low_liquidity_thresholds(self):
        d=self.val[(self.val.execution=='engine_budget')&self.val.policy.str.startswith('sweep_')]
        for (seed,debt),group in d.groupby(['seed','D']):
            low=group[group.L<=3].sort_values('L')
            for k in ('shortfall_rate','forced_liquidation_rate','final_net_wealth','ever_contributed','months_below_1'):
                np.testing.assert_array_equal(low[k].to_numpy(),np.repeat(low[k].iloc[0],3))

    def test_selection_recomputed_from_validation_only(self):
        grid=pd.read_csv(self.out/'validation_pareto_grid.csv')
        mean=pd.read_csv(self.out/'validation_mean.csv')
        selected=json.loads((self.out/'selection.json').read_text())
        for mode,g in grid.groupby('execution'):
            ref=mean[(mean.execution==mode)&(mean.policy=='no_investing')].iloc[0]
            eligible=g[(g.shortfall_rate<=ref.shortfall_rate+.005)&(g.months_below_1<=ref.months_below_1+.05)]
            winner=eligible.sort_values(['ever_contributed','final_net_wealth','L','D'],ascending=[False,False,False,True]).iloc[0]
            self.assertEqual(selected['choices'][mode]['L'],winner.L)
            self.assertEqual(selected['choices'][mode]['D'],winner.D)

    def test_test_only_has_frozen_selected_pair(self):
        self.assertFalse(self.test.policy.str.startswith('sweep_').any())
        self.assertEqual(self.test.policy.nunique(),6)

    def test_frozen_validation_inputs_and_old_files_unchanged(self):
        selected=json.loads((self.out/'selection.json').read_text())
        for p,h in selected['fingerprints'].items():self.assertEqual(s.sha(self.out/p),h,p)
        for p,h in json.loads((self.out/'preserved_sha256.json').read_text()).items():self.assertEqual(s.sha(s.ROOT/p),h,p)

    def test_application_consistency_checks(self):
        for partition in ('validation','test'):
            result=json.loads((self.out/f'{partition}_implementation_checks.json').read_text())
            self.assertEqual(result['snapshots'],300)
            self.assertEqual(result['mismatches'],[])
            self.assertEqual(result['forecast_max_error'],0)

    def test_scenarios_share_households_and_regimes(self):
        cohorts=json.loads((self.out/'test_cohorts.json').read_text())
        for seed in s.TEST_SEEDS:
            rows=[r for r in cohorts if r['seed']==seed]
            for k in ('regime_counts','source_counts','adverse_user_months','analytics_missing_forecast','analytics_missing_volatility','analytics_error_status'):
                self.assertEqual(rows[0][k],rows[1][k])
                self.assertEqual(rows[0][k],rows[2][k])


if __name__=='__main__':unittest.main()
