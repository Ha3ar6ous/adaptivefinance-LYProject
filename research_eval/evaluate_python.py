"""Reproducible research evaluation; stdlib only; production modules unchanged."""
import csv, hashlib, json, math, statistics as st, sys, time, unittest
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'ml_service'))
from modules.forecast import forecast_income
from modules.volatility import classify_volatility, _load_thresholds

def read(p):
    with p.open(encoding='utf-8-sig', newline='') as f:
        return sorted(list(csv.DictReader(f)), key=lambda r:r['date'])

def cv(values):
    avg=st.mean(values)
    return st.stdev(values)/avg if avg and len(values)>1 else 0

def label(v, lo, hi):
    return 'low' if v<lo else 'medium' if v<hi else 'high'

def metrics(truth, pred):
    labs=['low','medium','high']; cm=[[sum(t==a and p==b for t,p in zip(truth,pred)) for b in labs] for a in labs]
    per={}
    for i,a in enumerate(labs):
        tp=cm[i][i]; support=sum(cm[i]); pp=sum(row[i] for row in cm)
        precision=tp/pp if pp else 0; recall=tp/support if support else 0
        per[a]={'precision':precision,'recall':recall,'f1':2*precision*recall/(precision+recall) if precision+recall else 0,'support':support,'predicted':pp}
    return {'n':len(truth),'accuracy':sum(t==p for t,p in zip(truth,pred))/len(truth),'macro_precision':st.mean(x['precision'] for x in per.values()),'macro_recall':st.mean(x['recall'] for x in per.values()),'macro_f1':st.mean(x['f1'] for x in per.values()),'weighted_f1':sum(x['f1']*x['support'] for x in per.values())/len(truth),'cm':cm,'per_class':per}

def timings(fn, n=500, warmup=50):
    for _ in range(warmup): fn()
    vals=[]
    for _ in range(n):
        a=time.perf_counter_ns(); fn(); vals.append((time.perf_counter_ns()-a)/1e6)
    return {'n':n,'warmup':warmup,'mean_ms':st.mean(vals),'std_ms':st.pstdev(vals),'median_ms':st.median(vals),'p95_ms':sorted(vals)[math.ceil(.95*n)-1],'min_ms':min(vals),'max_ms':max(vals)}

class CoreTests(unittest.TestCase):
    def test_forecast_empty(self): self.assertEqual(forecast_income([])['points'], [])
    def test_forecast_constant(self):
        r=forecast_income([{'date':str(date(2024,1,1)+timedelta(days=i)),'income':100} for i in range(60)],15)
        self.assertEqual([p['income'] for p in r['points']], [100]*15)
    def test_forecast_chronological_cleaning(self):
        r=forecast_income([{'date':'bad','income':4},{'date':'2024-01-02','income':-5},{'date':'2024-01-01','income':10}],1)
        self.assertEqual(r['points'][0]['date'],'2024-01-03'); self.assertGreaterEqual(r['points'][0]['income'],0)
    def test_forecast_horizon_bounds(self):
        r=[{'date':'2024-01-01','income':100}]
        self.assertEqual(len(forecast_income(r,99)['points']),30); self.assertEqual(len(forecast_income(r,-1)['points']),1)
    def test_volatility_insufficient(self): self.assertEqual(classify_volatility([{'income':100}]*2)['label'],'unknown')
    def test_volatility_constant(self): self.assertEqual(classify_volatility([{'income':100}]*30)['label'],'low')
    def test_volatility_high(self): self.assertEqual(classify_volatility([{'income':0},{'income':0},{'income':100}]*10)['label'],'high')
    def test_volatility_last30(self): self.assertEqual(classify_volatility([{'income':100000}]*5+[{'income':100}]*30)['label'],'low')
    def test_volatility_sample_std(self): self.assertAlmostEqual(classify_volatility([{'income':x} for x in [50,100,150]])['features']['coefficientOfVariation'],.5)
    def test_zero_income_is_not_low_risk(self):
        # Requirement test: captures current zero-mean edge case instead of blessing it.
        self.assertNotEqual(classify_volatility([{'income':0}]*30)['label'],'low')

def main():
    files=sorted((ROOT/'data').rglob('*.csv')); data={str(p.relative_to(ROOT)).replace('\\','/'):read(p) for p in files}
    out={'datasets':[],'forecast':{},'volatility':{},'performance':{}}
    for p in files:
        rows=data[str(p.relative_to(ROOT)).replace('\\','/')]; dates=[r['date'] for r in rows]
        out['datasets'].append({'file':str(p.relative_to(ROOT)).replace('\\','/'),'rows':len(rows),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'start':dates[0],'end':dates[-1],'unique_dates':len(set(dates)),'daily_contiguous':all((date.fromisoformat(b)-date.fromisoformat(a)).days==1 for a,b in zip(dates,dates[1:])),'platforms':dict(Counter(r.get('platform','') for r in rows))})
    normal={k:v for k,v in data.items() if '/normal/' in k}
    methods=['historical_mean','moving_average_14','seasonal_naive_7','proposed']
    all_errors={m:[] for m in methods}; all_windows={m:[] for m in methods}; perfile=[]
    for name,rows in normal.items():
        incomes=[float(r['income']) for r in rows]; local={m:[] for m in methods}; windows={m:[] for m in methods}
        for origin in range(60,len(rows)-14,15):
            train=rows[:origin]; actual=incomes[origin:origin+15]
            predictions={'historical_mean':[st.mean(incomes[:origin])]*15,'moving_average_14':[st.mean(incomes[origin-14:origin])]*15,'seasonal_naive_7':[incomes[origin-7+(i%7)] for i in range(15)],'proposed':[p['income'] for p in forecast_income(train,15)['points']]}
            assert [p['date'] for p in forecast_income(train,15)['points']]==[r['date'] for r in rows[origin:origin+15]]
            for m,pred in predictions.items():
                err=[p-a for p,a in zip(pred,actual)]; local[m]+=err; all_errors[m]+=err
                w={'file':name,'origin':origin,'train_end':train[-1]['date'],'test_start':rows[origin]['date'],'test_end':rows[origin+14]['date'],'mae':st.mean(abs(e) for e in err),'rmse':math.sqrt(st.mean(e*e for e in err))}
                windows[m].append(w); all_windows[m].append(w)
        perfile.append({'file':name,'windows':len(windows['proposed']),'samples':len(local['proposed']),'methods':{m:{'mae':st.mean(abs(e) for e in local[m]),'rmse':math.sqrt(st.mean(e*e for e in local[m]))} for m in methods}})
    for m in methods:
        e=all_errors[m]; w=all_windows[m]
        out['forecast'][m]={'samples':len(e),'windows':len(w),'mae':st.mean(abs(x) for x in e),'rmse':math.sqrt(st.mean(x*x for x in e)),'window_mae_mean':st.mean(x['mae'] for x in w),'window_mae_std':st.pstdev(x['mae'] for x in w),'window_rmse_mean':st.mean(x['rmse'] for x in w),'window_rmse_std':st.pstdev(x['rmse'] for x in w),'window_results':w}
    out['forecast']['per_file']=perfile
    out['forecast']['paired_proposed_vs_mean']={'mae_better_windows':sum(a['mae']<b['mae'] for a,b in zip(all_windows['proposed'],all_windows['historical_mean'])),'rmse_better_windows':sum(a['rmse']<b['rmse'] for a,b in zip(all_windows['proposed'],all_windows['historical_mean']))}
    gig=normal['data/normal/gig_income_data.csv']; actual=[float(r['income']) for r in gig[-15:]]; pred=[p['income'] for p in forecast_income(gig[:-15],15)['points']]; oldbase=st.mean(float(r['income']) for r in gig[-30:-15])
    out['forecast']['old_holdout']={m:{'mae':st.mean(abs(p-a) for p,a in zip(ps,actual)),'rmse':math.sqrt(st.mean((p-a)**2 for p,a in zip(ps,actual)))} for m,ps in [('proposed',pred),('mean_last15',[oldbase]*15)]}
    vol={k:v for k,v in data.items() if '/volatility/' in k}; rowsall=[r for rows in vol.values() for r in rows]
    out['volatility']['label_distributions']={col:dict(Counter(r[col] for r in rowsall)) for col in ['volatility_label','volatility_label_stat']}
    out['volatility']['label_column_agreement']=metrics([r['volatility_label'] for r in rowsall],[r['volatility_label_stat'] for r in rowsall])
    checks=[]
    for name,rows in vol.items():
        vals=[float(r['income']) for r in rows]
        for i,r in enumerate(rows):
            v=vals[max(0,i-6):i+1]; mean=st.mean(v); sd=st.stdev(v) if len(v)>1 else 0; c=cv(v)
            checks.append({'mean_abs_error':abs(mean-float(r['rolling_mean_7'])),'std_abs_error':abs(sd-float(r['rolling_std_7'])),'cv_abs_error':abs(c-float(r['rolling_cv_7'])),'stat_match':label(c,.3,.6)==r['volatility_label_stat']})
    out['volatility']['feature_reconstruction']={'n':len(checks),'max_abs_errors':{k:max(x[k] for x in checks) for k in ['mean_abs_error','std_abs_error','cv_abs_error']},'stat_matches':sum(x['stat_match'] for x in checks)}
    # Infer threshold intervals on chronological calibration rows ONLY.
    calibration=[r for rows in vol.values() for r in rows[:60]]
    intervals={}
    for lower,upper in [('low','medium'),('medium','high')]:
        intervals[lower+'_'+upper]={'exclusive_lower':max(float(r['rolling_cv_7']) for r in calibration if r['volatility_label_stat']==lower),'inclusive_upper':min(float(r['rolling_cv_7']) for r in calibration if r['volatility_label_stat']==upper)}
    out['volatility']['train_threshold_intervals']=intervals
    # Rounded simple .30/.60 hypothesis selected inside calibration intervals, then tested untouched.
    thresholds=_load_thresholds(); out['volatility']['runtime_thresholds']=thresholds
    cvs=sorted(float(r['rolling_cv_7']) for r in calibration)
    quantile=(round(cvs[int(len(cvs)*.33)],3),round(cvs[int(len(cvs)*.66)],3)); out['volatility']['train_quantile_thresholds']=quantile
    configs=[('current_30',30,thresholds['low_max_cv'],thresholds['medium_max_cv']),('default_7',7,.35,.75),('aligned_7',7,.3,.6),('aligned_14',14,.3,.6),('aligned_30',30,.3,.6),('train_quantile_7',7,*quantile),('train_quantile_30',30,*quantile)]
    evaluated=[]
    for name,rows in vol.items():
        vals=[float(r['income']) for r in rows]
        for i in range(29,len(rows)):
            evaluated.append({'file':name,'index':i,'date':rows[i]['date'],'original':rows[i]['volatility_label'],'stat':rows[i]['volatility_label_stat'],'cvs':{str(w):cv(vals[i-w+1:i+1]) for w in [7,14,30]},'runtime':classify_volatility(rows[:i+1])['label']})
    out['volatility']['configurations']=[]
    for name,w,lo,hi in configs:
        for split in ['all_common','chronological_test']:
            sample=evaluated if split=='all_common' else [r for r in evaluated if r['index']>=60]
            pred=[r['runtime'] if name=='current_30' else label(r['cvs'][str(w)],lo,hi) for r in sample]
            out['volatility']['configurations'].append({'name':name,'window':w,'low':lo,'high':hi,'split':split,**{truth:metrics([r[truth] for r in sample],pred) for truth in ['original','stat']}})
    sample=[r for r in evaluated if r['index']>=60]
    out['volatility']['sensitivity']=[{'low':lo,'high':hi,**metrics([r['stat'] for r in sample],[label(r['cvs']['7'],lo,hi) for r in sample])} for lo,hi in [(.27,.54),(.30,.60),(.33,.66),(.27,.60),(.33,.60),(.30,.54),(.30,.66)]]
    out['volatility']['per_file_test']=[{'file':name,'n':len([r for r in sample if r['file']==name]),'current':metrics([r['stat'] for r in sample if r['file']==name],[r['runtime'] for r in sample if r['file']==name]),'aligned':metrics([r['stat'] for r in sample if r['file']==name],[label(r['cvs']['7'],.3,.6) for r in sample if r['file']==name])} for name in vol]
    out['volatility']['cv_boundaries']=[{'input_cv':c,**classify_volatility([{'income':100*(1-c)},{'income':100},{'income':100*(1+c)}])} for c in [.449,.45,.451,.749,.75,.751]]
    out['performance']['forecast_30_on60']=timings(lambda:forecast_income(gig[:60],30))
    out['performance']['forecast_15_on180']=timings(lambda:forecast_income(gig,15))
    out['performance']['forecast_volatility_on60']=timings(lambda:(forecast_income(gig[:60],15),classify_volatility(gig[:60])))
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(CoreTests); result=unittest.TextTestRunner(verbosity=2).run(suite)
    out['tests']={'total':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failed':len(result.failures),'errors':len(result.errors),'failures':[{'test':str(t),'trace':trace} for t,trace in result.failures+result.errors]}
    (ROOT/'research_eval/python_results.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
    print(json.dumps({'forecast':{k:{a:b for a,b in v.items() if a!='window_results'} for k,v in out['forecast'].items() if k!='per_file'},'volatility_reconstruction':out['volatility']['feature_reconstruction'],'tests':out['tests'],'performance':out['performance']},indent=2))
    if '--check' in sys.argv and not result.wasSuccessful(): sys.exit(1)

if __name__=='__main__': main()
