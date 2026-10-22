import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

import simulate as s


class SimulatorTests(unittest.TestCase):
    def test_full_sale_and_unpaid_bills(self):
        cash,assets,arrears,sale=s.settle(np.array([100.]),np.array([50.]),np.array([200.]),np.array([0.]),np.array([1.]),.1)
        self.assertAlmostEqual(cash[0],0.)
        self.assertAlmostEqual(assets[0],0.)
        self.assertAlmostEqual(arrears[0],54.75)
        self.assertTrue(sale[0])

    def test_sale_can_prevent_shortfall(self):
        cash,assets,arrears,sale=s.settle(np.array([0.]),np.array([100.]),np.array([50.]),np.array([0.]),np.array([1.]),0.)
        self.assertEqual(arrears[0],0.)
        self.assertTrue(sale[0])
        self.assertEqual(assets[0],50.)

    def test_wealth_conservation_with_fees_and_interest(self):
        cash=np.array([0.,100.,200.]);assets=np.array([100.,50.,0.]);bills=np.array([50.,200.,300.]);income=np.array([0.,0.,10.])
        c,a,u,sale=s.settle(cash,assets,bills,income,np.ones(3),.1)
        sold=assets-a
        np.testing.assert_allclose(c+a-u,cash*1.0025+assets+income-bills-.1*sold)

    def test_budget_reserve_masks_low_thresholds(self):
        np.testing.assert_array_equal(s.budget(np.array([100.,200.,300.,400.]),100.,300.,'engine_budget'),[0,0,0,10])
        np.testing.assert_array_equal(s.budget(np.array([100.,200.]),100.,300.,'reserve_free'),[50,50])

    def test_gate_boundary_and_missing_analytics(self):
        self.assertTrue(s.gate('revised_gate',300.,50.,100.,70.,0,True))
        for args in [(299.,50.,70.,0,True),(300.,51.,70.,0,True),(300.,50.,69.,0,True),(300.,50.,70.,2,True),(300.,50.,70.,0,False)]:
            cash,debt,score,vol,valid=args
            self.assertFalse(s.gate('revised_gate',cash,debt,100.,score,vol,valid))
        self.assertTrue(s.gate('original_gate',300.,50.,100.,70.,3,False))

    def test_features_cannot_observe_future(self):
        y=np.arange(1.,391.)[None,:].repeat(2,axis=0)
        before=s.forecast(y[:,:60],2)
        y[:,60:]=1e9
        np.testing.assert_array_equal(before,s.forecast(y[:,:60],2))

    def test_same_seed_same_paths_across_scenarios(self):
        th={'low_max_cv':.35,'medium_max_cv':.75}
        a=s.generate(11,'validation','central',th,n=32);b=s.generate(11,'validation','neutral',th,n=32)
        for field in ('incomes','expense','cash','debt','regime','shock','failures'):np.testing.assert_array_equal(a[field],b[field])

    def test_chronological_block_pool(self):
        d=pd.DataFrame(dict(date=pd.date_range('2024-01-01',periods=120).strftime('%Y-%m-%d'),income=np.r_[np.full(60,111.),np.full(30,222.),np.full(30,333.)]))
        th={'low_max_cv':.35,'medium_max_cv':.75}
        with patch.object(s,'sources',return_value=[('fixture.csv',d)]):
            val=s.generate(11,'validation','central',th,n=32);test=s.generate(101,'test','central',th,n=32)
        # Ratio unaffected by household income multiplier, but inspect first-month max per donor before random regime multiplier through initial history.
        self.assertTrue((val['incomes'][:,:30]/111.>0).all())
        # Future constant blocks remain constant within every month, proving no boundary mixing.
        for c in (val,test):
            for m in range(12):self.assertTrue(np.ptp(c['incomes'][:,30+30*m:60+30*m],axis=1).max()<1e-9)
        # Same seed comparison with poisoned test pool leaves validation paths unchanged.
        d.loc[90:,'income']=1e12
        with patch.object(s,'sources',return_value=[('fixture.csv',d)]):again=s.generate(11,'validation','central',th,n=32)
        np.testing.assert_array_equal(val['incomes'],again['incomes'])

    def test_pareto_dominance(self):
        d=pd.DataFrame(dict(shortfall_rate=[.1,.2,.05],ever_contributed=[.2,.1,.1],final_net_wealth=[100.,90.,110.]))
        self.assertEqual(s.pareto(d),[True,False,True])

    def test_zero_surplus_no_policy_effect(self):
        n=3;income=np.full((n,390),100/30)
        an=[dict(fixed_health=np.full(n,30.),monthly_income=np.full(n,100.),vol=np.zeros(n,int),valid=np.ones(n,bool)) for _ in range(12)]
        c=dict(seed=1,split='fixture',scenario='neutral',n=n,cash=np.full(n,1000.),debt=np.zeros(n),expense=np.full(n,100.),nominal=np.full((n,12),100.),
               regular=np.full((n,12),100.),shock=np.zeros((n,12)),returns=np.ones((n,12)),haircut=0.,incomes=income,analytics=an)
        rows=s.simulate(c,'engine_budget',s.policies())
        for r in rows:
            self.assertEqual(r['shortfall_rate'],0)
            self.assertEqual(r['forced_liquidation_rate'],0)
            self.assertEqual(r['ever_contributed'],0)
            self.assertAlmostEqual(r['final_net_wealth'],1000*1.0025**12)


if __name__=='__main__':unittest.main()
