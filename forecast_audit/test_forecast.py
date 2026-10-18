import importlib.util,json,sys,unittest,os,tempfile,shutil
from unittest.mock import patch
from datetime import date,timedelta
from pathlib import Path
import numpy as np
import pandas as pd
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from run import configs,point_predict,lag_features,origins,metrics,SEEDS,Runner,sha
from analyze import dm_statistic,counts_for_bootstrap
spec=importlib.util.spec_from_file_location('production_forecast',HERE.parent/'ml_service/modules/forecast.py');original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
class ForecastTests(unittest.TestCase):
    def rows(self,n=60):return [{'date':str(date(2024,1,1)+timedelta(days=i)),'income':1000+100*np.sin(i/3)} for i in range(n)]
    def test_all_fixed_candidates_fit_and_produce_nonnegative_30_steps(self):
        for c in configs():
            with self.subTest(model=c['name']):
                p,_=point_predict(self.rows(),c,SEEDS[0] if c['kind']=='gb' else None,original)
                self.assertEqual(len(p),30);self.assertTrue(np.isfinite(p).all());self.assertTrue((np.asarray(p)>=0).all())
    def test_future_poison_does_not_enter_lag_features(self):
        with tempfile.TemporaryDirectory(prefix='forecast_causality_') as temp:
            out=Path(temp);shutil.copyfile(HERE.parent/'ml_service/modules/forecast.py',out/'baseline_forecast.py');r=Runner(out);file=next(iter(r.data));captured=[]
            def predict(rows,c,seed,original):captured.append([v['income'] for v in rows]);return [100.]*30,None
            with patch('run.point_predict',side_effect=predict):
                r.forecast(file,28,{'name':'causal_test','kind':'mean'},11)
                for row in r.data[file]['rows'][28:]:row['income']=10**12
                r.forecast(file,28,{'name':'causal_test','kind':'mean'},23)
            self.assertEqual(captured[0],captured[1]);self.assertEqual(len(captured[0]),28)
    def test_target_values_excluded_from_features(self):
        y=list(range(30));f=lag_features(y[:20],3);y[20]=100000;self.assertEqual(f,lag_features(y[:20],3));self.assertEqual(f[0],19)
    def test_splits_never_cross_boundaries(self):
        for n in [120,180]:
            for h in [7,15,30]:
                for split,low,high in [('validation',28,60),('calibration',60,90),('test',90,n)]:
                    for origin in origins(n,split,h):self.assertGreaterEqual(origin,low);self.assertLessEqual(origin+h,high)
    def test_calibration_target_blocks_do_not_overlap(self):
        for h in [7,15,30]:
            seen=set()
            for o in origins(120,'calibration',h):
                block=set(range(o,o+h));self.assertFalse(block&seen);seen|=block
    def test_seed_model_reproducibility(self):
        c=next(c for c in configs() if c['name']=='gb_squared_error_d1')
        self.assertEqual(point_predict(self.rows(),c,SEEDS[0],original)[0],point_predict(self.rows(),c,SEEDS[0],original)[0]);self.assertEqual(len(SEEDS),5)
    def test_smape_zero_and_mase_undefined(self):
        g=pd.DataFrame({'actual':[0.,10.],'prediction':[0.,20.],'mase_scale':[0.,5.],'file':['a','a'],'origin':[2,2],'target_date':['x','y']});r=metrics(g)
        self.assertAlmostEqual(r['smape'],100/3);self.assertEqual(r['mase'],2);self.assertEqual(r['mase_n'],1)
    def test_historical_mean_baseline_is_full_prefix(self):
        rows=self.rows(30);c=next(c for c in configs() if c['name']=='historical_mean');p,_=point_predict(rows,c,None,original)
        self.assertEqual(p,[round(np.mean([r['income'] for r in rows]),2)]*30)
    def test_dm_rejects_inadequate_or_identical_series(self):
        self.assertEqual(dm_statistic(np.ones(1),30)['status'],'insufficient_origins');self.assertIsNone(dm_statistic(np.zeros(100),7)['p_raw'])
    def test_bootstrap_uses_whole_clusters_and_five_seeds(self):
        a=counts_for_bootstrap(5);self.assertEqual(a.shape,(5000,5));self.assertTrue((a.sum(axis=1)==5).all());self.assertTrue(np.array_equal(a,counts_for_bootstrap(5)))
    @unittest.skipUnless(os.environ.get('FORECAST_AUDIT_OUT'),'set FORECAST_AUDIT_OUT for executed-artifact checks')
    def test_frozen_selection_and_quantiles_unchanged(self):
        out=Path(os.environ['FORECAST_AUDIT_OUT']);frozen=json.loads((out/'test_frozen.json').read_text());selection=json.loads((out/'selection.json').read_text())
        self.assertEqual(frozen['selection_sha256'],sha(out/'selection.json'));self.assertEqual(frozen['quantiles_sha256'],sha(out/'conformal_quantiles.csv'));self.assertEqual(frozen['predictions_sha256'],sha(out/'test_predictions.csv'));self.assertEqual(selection['runner_sha256'],sha(HERE/'run.py'));self.assertEqual(selection['protocol_sha256'],sha(HERE/'PROTOCOL.md'))
    @unittest.skipUnless(os.environ.get('FORECAST_AUDIT_OUT'),'set FORECAST_AUDIT_OUT for executed-artifact checks')
    def test_actual_calibration_quantile_ranks(self):
        out=Path(os.environ['FORECAST_AUDIT_OUT']);cal=pd.read_csv(out/'calibration_predictions.csv');qs=pd.read_csv(out/'conformal_quantiles.csv')
        for q in qs.itertuples():
            g=cal[(cal.method==q.method)&(cal.horizon==q.horizon)&(cal.seed==q.seed)];scores=np.sort(abs(g.actual-g.prediction)/g.interval_scale)
            self.assertEqual(len(scores),q.n_scores);self.assertAlmostEqual(scores[q.rank-1],q.q,places=10)
    @unittest.skipUnless(os.environ.get('FORECAST_AUDIT_OUT'),'set FORECAST_AUDIT_OUT for executed-artifact checks')
    def test_no_seed_or_forecast_instances_dropped(self):
        out=Path(os.environ['FORECAST_AUDIT_OUT']);p=pd.read_csv(out/'test_predictions.csv',dtype={'seed':str})
        for (name,h),g in p.groupby(['method','horizon']):
            expected=sum(len(origins(n,'test',h))*h for n in [120]*10+[180]);counts=g.groupby('seed').size()
            self.assertTrue((counts==expected).all());self.assertEqual(len(counts),6 if name.startswith('gb_') else 1)
if __name__=='__main__':unittest.main(verbosity=2)
