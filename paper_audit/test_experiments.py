import copy,json,math,sys,unittest
from datetime import date,timedelta
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from experiments import *

class StatisticalTests(unittest.TestCase):
    def records(self,n=90):return [{'date':str(date(2024,1,1)+timedelta(days=i)),'income':100} for i in range(n)]
    def test_all_forecast_candidates_constant_and_finite(self):
        for c in forecast_candidates():
            result=predict_forecast(self.records(),15,c)
            self.assertEqual(result,[100]*15,c['name'])
    def test_forecast_validation_excludes_test_suffix(self):
        data={'constant':self.records(120)};poison=copy.deepcopy(data)
        for row in poison['constant'][-30:]:row['income']=10**12
        for c in forecast_candidates():self.assertEqual(forecast_eval(data,c,'validation'),forecast_eval(poison,c,'validation'))
    def test_volatility_training_validation_exclude_future_rows(self):
        data=load_data('data/volatility');poison=copy.deepcopy(data)
        for rows in poison.values():
            for r in rows[90:]:r['income']=10**12;r['volatility_label']='poison';r['volatility_label_stat']='poison'
        for split in ['train','validation','refit']:self.assertEqual(split_vol(data,split),split_vol(poison,split))
    def test_volatility_features_ignore_labels_and_derived_columns(self):
        data=load_data('data/volatility');rows=next(iter(data.values()));poison=copy.deepcopy(rows)
        for r in poison:
            r['volatility_label']='changed';r['volatility_label_stat']='changed'
            for k in ['rolling_cv_7','rolling_std_7','rolling_mean_7']:r[k]='1000000'
        self.assertEqual([r['x'] for r in features(rows)],[r['x'] for r in features(poison)])
    def test_feature_historical_causality(self):
        rows=next(iter(load_data('data/volatility').values()));original=features(rows);poison=copy.deepcopy(rows)
        for r in poison[60:]:r['income']=10**12
        self.assertEqual(original[:31],features(poison)[:31])
    def test_no_standardization_fit_on_validation_or_test(self):
        data=load_data('data/volatility');train=split_vol(data,'train');c={'name':'check','kind':'nb','smoothing':1e-6};model=fit_vol(train,c)
        self.assertEqual(model['means'],[st.mean(r['x'][j] for r in train) for j in range(11)])
        self.assertEqual(sum(model['counts'].values()),len(train))
    def test_all_classifiers_deterministic_and_valid(self):
        data=load_data('data/volatility');train=split_vol(data,'train');val=split_vol(data,'validation')
        for c in vol_candidates():
            model=fit_vol(train,c);a=predict_vol(model,val);self.assertEqual(a,predict_vol(model,val));self.assertTrue(set(a)<={'low','medium','high'})
    def test_selection_files_hashes_frozen(self):
        for target in ['forecast','volatility']:
            selection=load(target+'_selection.json');result=load(target+'_results.json')
            self.assertEqual(result['selection_file_sha256'],hashlib.sha256((ROOT/'paper_audit'/f'{target}_selection.json').read_bytes()).hexdigest())
            self.assertEqual(result['selected'],selection['selected'])
            self.assertEqual(selection['protocol_sha256'],hashlib.sha256((ROOT/'paper_audit/PROTOCOL.md').read_bytes()).hexdigest())
    def test_test_windows_unique_and_disjoint_from_validation(self):
        validation=load('forecast_selection.json')['validation']['original']['window_results'];test=load('forecast_results.json')['test']['original']['window_results']
        for a in validation:
            for b in test:
                if a['file']==b['file']:self.assertLess(a['end'],b['start'])
        self.assertEqual(len(test),22);self.assertEqual(sum(w['n'] for w in test),330)
    def test_metrics_known_confusion(self):
        r=class_metrics(['low','medium','high'],['low','high','high'])
        self.assertEqual(r['confusion_matrix'],[[1,0,0],[0,0,1],[0,0,1]])
        self.assertAlmostEqual(r['balanced_accuracy'],2/3)
    def test_archived_forecast_matches_unchanged_production(self):
        import importlib.util
        spec=importlib.util.spec_from_file_location('old_forecast',ROOT/'paper_audit/baseline/forecast.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
        for rows in load_data('data/normal').values():self.assertEqual(old.forecast_income(rows[:60],15),forecast_income(rows[:60],15))

if __name__=='__main__':unittest.main(verbosity=2)
