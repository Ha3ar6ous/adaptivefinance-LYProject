import unittest
import numpy as np
import pandas as pd
import ablate as a


class AblationTests(unittest.TestCase):
    def fixture(self):
        p=a.policies();n=6;shape=(len(p),n)
        cash=np.broadcast_to(np.array([299.,300.,400.,500.,600.,700.]),shape).copy()
        debt=np.broadcast_to(np.array([0.,50.,51.,0.,0.,0.]),shape).copy()
        score=np.full(shape,80.);score[:,3]=69
        an=dict(vol=np.array([0,0,0,0,2,0]),valid=np.array([True]*5+[False]),monthly_income=np.full(n,200.))
        return p,cash,debt,np.full(n,100.),score,an

    def test_thresholds_and_no_score_equivalence(self):
        p,c,d,e,s,an=self.fixture();m=a.Gates(101)(0,p,c,d,e,s,an);names=[x['name'] for x in p]
        np.testing.assert_array_equal(m[names.index('revised_gate')],[False,True,False,False,False,False])
        np.testing.assert_array_equal(m[names.index('liquidity_debt_volatility')],m[names.index('full_minus_score')])
        self.assertTrue(m[names.index('full_minus_score'),3])

    def test_minus_volatility_really_removes_high_block(self):
        p,c,d,e,s,an=self.fixture();m=a.Gates(101)(0,p,c,d,e,s,an);names=[x['name'] for x in p]
        self.assertTrue(m[names.index('full_minus_volatility'),4])
        self.assertFalse(m[names.index('revised_gate'),4])

    def test_all_added_gates_fail_closed_on_unavailable_analytics(self):
        p,c,d,e,s,an=self.fixture();m=a.Gates(101)(0,p,c,d,e,s,an);names=[x['name'] for x in p]
        for name in a.ADDED:self.assertFalse(m[names.index(name),5],name)

    def test_match_monthly_count_exactly(self):
        p,c,d,e,s,an=self.fixture();m=a.Gates(101)(0,p,c,d,e,s,an);names=[x['name'] for x in p]
        k=m[names.index('revised_gate')].sum()
        for name in ['matched_savings']+[f'matched_random_s{x}' for x in a.RANDOM_SEEDS]:self.assertEqual(m[names.index(name)].sum(),k)

    def test_random_gates_are_seeded(self):
        p,c,d,e,s,an=self.fixture()
        np.testing.assert_array_equal(a.Gates(101)(0,p,c,d,e,s,an),a.Gates(101)(0,p,c,d,e,s,an))

    def test_select_k_ties_and_eligibility(self):
        np.testing.assert_array_equal(a.select_k(np.array([2.,1.,1.,0.]),np.array([1,1,1,0],bool),1),[0,1,0,0])
        self.assertEqual(a.select_k(np.ones(4),np.ones(4,bool),0).sum(),0)

    def test_original_accounting_unchanged_and_alias_outcomes_equal(self):
        c=a.sim.generate(101,'test','central',dict(low_max_cv=.45,medium_max_cv=.75),n=32)
        policies=a.policies();rows,d=a.sim.simulate(c,'engine_budget',policies,gate_fn=a.Gates(101),return_details=True)
        old=a.sim.simulate(c,'engine_budget',a.sim.policies())
        self.assertEqual(rows[:5],old)
        i=[p['name'] for p in policies].index('liquidity_debt_volatility');j=[p['name'] for p in policies].index('full_minus_score')
        for name in ['forced_sale','shortfall','wealth']:np.testing.assert_array_equal(d[name][i],d[name][j])

    def test_cluster_interval_zero_for_self_comparison(self):
        d=pd.DataFrame(dict(platform=list('abcde'),forced_sale_events=[1,2,3,4,5],event_trials=[10]*5))
        ci=a.interval(d,d);self.assertEqual(ci['lower95'],0.);self.assertEqual(ci['upper95'],0.);self.assertEqual(ci['draws'],5000)


if __name__=='__main__':unittest.main()
