"""Deterministic small statistical baselines; no third-party dependencies."""
import csv,hashlib,importlib.util,json,math,statistics as st,sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'ml_service'))
from modules.forecast import forecast_income
from modules.volatility import classify_volatility

def read(p):
    with p.open(encoding='utf-8-sig',newline='') as f:return sorted(list(csv.DictReader(f)),key=lambda r:r['date'])
def load_data(folder):return {str(p.relative_to(ROOT)).replace('\\','/'):read(p) for p in sorted((ROOT/folder).glob('*.csv'))}
def fingerprint(files):return {k:hashlib.sha256((ROOT/k).read_bytes()).hexdigest() for k in files}
def write(name,value):(ROOT/'paper_audit'/name).write_text(json.dumps(value,indent=2,allow_nan=False),encoding='utf-8')
def load(name):return json.loads((ROOT/'paper_audit'/name).read_text(encoding='utf-8'))
def error_metrics(errors):
    return {'n':len(errors),'mae':st.mean(abs(e) for e in errors),'rmse':math.sqrt(st.mean(e*e for e in errors))}
def class_metrics(truth,pred):
    labels=['low','medium','high'];matrix=[[sum(a==t and b==p for t,p in zip(truth,pred)) for b in labels] for a in labels];per={}
    for i,lab in enumerate(labels):
        tp=matrix[i][i];support=sum(matrix[i]);predicted=sum(r[i] for r in matrix)
        precision=tp/predicted if predicted else 0;recall=tp/support if support else 0
        per[lab]={'precision':precision,'recall':recall,'f1':2*precision*recall/(precision+recall) if precision+recall else 0,'support':support,'predicted':predicted}
    return {'n':len(truth),'accuracy':sum(a==b for a,b in zip(truth,pred))/len(truth),'macro_f1':st.mean(v['f1'] for v in per.values()),'balanced_accuracy':st.mean(v['recall'] for v in per.values()),'macro_precision':st.mean(v['precision'] for v in per.values()),'per_class':per,'confusion_matrix':matrix}

def forecast_candidates():
    return [{'name':'original','kind':'original'},{'name':'historical_mean','kind':'mean'},
        *[{'name':f'ma_{w}','kind':'moving','window':w} for w in [7,14,30,60]],
        {'name':'seasonal_naive_7','kind':'seasonal'},
        *[{'name':f'ses_{a}','kind':'ses','alpha':a} for a in [.05,.1,.2,.4,.6,.8]],
        *[{'name':f'holt_{a}_{b}_{phi}','kind':'holt','alpha':a,'beta':b,'phi':phi} for a in [.1,.3] for b in [.05,.2] for phi in [.9,.98]],
        {'name':'ar1_ols','kind':'ar1'},
        *[{'name':f'mean_median_{w}','kind':'median_mix','weight':w} for w in [.25,.5,.75,1]]]
def predict_forecast(rows,h,c):
    y=[float(r['income']) for r in rows];kind=c['kind']
    if kind=='original':return [p['income'] for p in forecast_income(rows,h)['points']]
    if kind=='mean':out=[st.mean(y)]*h
    elif kind=='moving':out=[st.mean(y[-c['window']:])]*h
    elif kind=='seasonal':out=[y[-7+i%7] for i in range(h)]
    elif kind=='median_mix':out=[st.mean(y)*(1-c['weight'])+st.median(y)*c['weight']]*h
    elif kind=='ses':
        level=y[0]
        for v in y[1:]:level=c['alpha']*v+(1-c['alpha'])*level
        out=[level]*h
    elif kind=='holt':
        level=y[0];trend=0;a=c['alpha'];b=c['beta'];phi=c['phi']
        for v in y[1:]:
            old=level;level=a*v+(1-a)*(level+phi*trend);trend=b*(level-old)+(1-b)*phi*trend
        out=[level+sum(phi**j for j in range(1,i+1))*trend for i in range(1,h+1)]
    elif kind=='ar1':
        x=y[:-1];z=y[1:];mx=st.mean(x);mz=st.mean(z);den=sum((v-mx)**2 for v in x)
        beta=max(-.98,min(.98,sum((a-mx)*(b-mz) for a,b in zip(x,z))/den)) if den else 0
        intercept=mz-beta*mx;last=y[-1];out=[]
        for _ in range(h):last=max(0,intercept+beta*last);out.append(last)
    else:raise ValueError(kind)
    # All experimental alternatives use currency-rounded predictions, as does production.
    return [round(max(0,v),2) for v in out]
def forecast_eval(data,c,split):
    errors=[];windows=[]
    for name,rows in data.items():
        offsets=[60,45] if split=='validation' else [30,15]
        for offset in offsets:
            origin=len(rows)-offset;pred=predict_forecast(rows[:origin],15,c);actual=[float(r['income']) for r in rows[origin:origin+15]]
            e=[p-a for p,a in zip(pred,actual)];errors+=e
            windows.append({'file':name,'origin':origin,'train_end':rows[origin-1]['date'],'start':rows[origin]['date'],'end':rows[origin+14]['date'],'predictions':pred,'actuals':actual,**error_metrics(e)})
    return {**error_metrics(errors),'windows':len(windows),'window_mae_std':st.pstdev(w['mae'] for w in windows),'window_rmse_std':st.pstdev(w['rmse'] for w in windows),'window_results':windows}
def select_forecast():
    data=load_data('data/normal');configs=forecast_candidates();scores={c['name']:forecast_eval(data,c,'validation') for c in configs};ref=scores['historical_mean']
    chosen=min(configs,key=lambda c:scores[c['name']]['mae']/ref['mae']+scores[c['name']]['rmse']/ref['rmse'])
    r=scores[chosen['name']];orig=scores['original'];eligible=all(r[k]<ref[k] and r[k]<orig[k] for k in ['mae','rmse'])
    result={'protocol_sha256':hashlib.sha256((ROOT/'paper_audit/PROTOCOL.md').read_bytes()).hexdigest(),'data_sha256':fingerprint(data),'seed':None,'selection_objective':'pooled MAE / historical_mean MAE + pooled RMSE / historical_mean RMSE','configurations':configs,'validation':scores,'selected':chosen,'deployment_eligible_from_validation':eligible}
    write('forecast_selection.json',result);print('FORECAST SELECTION',chosen,'deploy eligible',eligible)
def test_forecast():
    data=load_data('data/normal');selected=load('forecast_selection.json');assert fingerprint(data)==selected['data_sha256']
    results={c['name']:forecast_eval(data,c,'test') for c in selected['configurations']}
    out={'selection_file_sha256':hashlib.sha256((ROOT/'paper_audit/forecast_selection.json').read_bytes()).hexdigest(),'selected':selected['selected'],'deployment_eligible_from_validation':selected['deployment_eligible_from_validation'],'test':results}
    write('forecast_results.json',out);print('FORECAST TEST',json.dumps({k:{a:b for a,b in results[k].items() if a!='window_results'} for k in ['original','historical_mean',selected['selected']['name']]},indent=2))

def cv(y):
    avg=st.mean(y);return st.stdev(y)/avg if avg>0 and len(y)>1 else 0
def features(rows):
    out=[];y=[float(r['income']) for r in rows]
    for i in range(29,len(rows)):
        f=[];cvs={}
        for w in [7,14,30]:
            values=y[i-w+1:i+1];avg=st.mean(values);sd=st.stdev(values);cvs[w]=sd/avg if avg else 0;f.extend([avg,sd,cvs[w]])
        recent=y[i-29:i+1];f.extend([sum(v==0 for v in recent)/30,y[i]/st.mean(recent) if st.mean(recent) else 0])
        out.append({'index':i,'date':rows[i]['date'],'x':f,'cvs':cvs,'original':rows[i]['volatility_label'],'stat':rows[i]['volatility_label_stat'],'runtime':classify_volatility(rows[:i+1])['label']})
    return out
def split_vol(data,split):
    lo,hi={'train':(29,60),'validation':(60,90),'refit':(29,90),'test':(90,120)}[split]
    return [{**r,'file':name} for name,rows in data.items() for r in features(rows[:hi]) if lo<=r['index']<hi]
def vol_candidates():
    return [{'name':'original_30','kind':'original'},{'name':'majority','kind':'majority'},
        *[{'name':f'quantile_{w}','kind':'quantile','window':w} for w in [7,14,30]],
        *[{'name':f'supervised_cv_{w}','kind':'threshold','window':w} for w in [7,14,30]],
        *[{'name':f'gaussian_nb_{v}','kind':'nb','smoothing':v} for v in [1e-6,.01,.1]],
        *[{'name':f'centroid_{v}','kind':'centroid','prior':v} for v in ['uniform','inverse_frequency']],
        *[{'name':f'knn_{k}','kind':'knn','k':k} for k in [5,15,31]]]
def threshold(v,a,b):return 'low' if v<a else 'medium' if v<b else 'high'
def fit_threshold(train,w):
    ordered=sorted(train,key=lambda r:r['cvs'][w]);labels=['low','medium','high'];prefix=[[0,0,0]]
    for r in ordered:
        a=prefix[-1].copy();a[labels.index(r['original'])]+=1;prefix.append(a)
    cuts=[i for i in range(1,len(ordered)) if ordered[i-1]['cvs'][w]<ordered[i]['cvs'][w]]
    best=(-1,None)
    for i in cuts:
        for j in cuts:
            if j<=i:continue
            cm=[[prefix[i][k],prefix[j][k]-prefix[i][k],prefix[-1][k]-prefix[j][k]] for k in range(3)]
            score=st.mean(2*cm[k][k]/(sum(cm[k])+sum(row[k] for row in cm)) if sum(cm[k])+sum(row[k] for row in cm) else 0 for k in range(3))
            if score>best[0]:best=(score,(i,j))
    i,j=best[1]
    return [(ordered[v-1]['cvs'][w]+ordered[v]['cvs'][w])/2 for v in [i,j]]
def fit_vol(train,c):
    counts=Counter(r['original'] for r in train);model={'config':c,'counts':dict(counts)}
    if c['kind'] in ['quantile','threshold']:
        vals=sorted(r['cvs'][c['window']] for r in train)
        model['thresholds']=[round(vals[int(len(vals)*q)],3) for q in [.33,.66]] if c['kind']=='quantile' else fit_threshold(train,c['window'])
    elif c['kind'] in ['nb','centroid','knn']:
        model['means']=[st.mean(r['x'][j] for r in train) for j in range(11)]
        model['scales']=[max(st.pstdev(r['x'][j] for r in train),1e-9) for j in range(11)]
        samples=[{'x':[(v-m)/s for v,m,s in zip(r['x'],model['means'],model['scales'])],'label':r['original']} for r in train]
        model['samples']=samples;model['centers']={};model['variances']={}
        for lab in ['low','medium','high']:
            group=[r['x'] for r in samples if r['label']==lab]
            model['centers'][lab]=[st.mean(v[j] for v in group) for j in range(11)]
            model['variances'][lab]=[st.pvariance(v[j] for v in group)+c.get('smoothing',1e-6) for j in range(11)]
    return model
def predict_vol(model,rows):
    c=model['config'];labs=['low','medium','high'];pred=[]
    for r in rows:
        if c['kind']=='original':lab=r['runtime']
        elif c['kind']=='majority':lab=max(labs,key=lambda l:model['counts'].get(l,0))
        elif c['kind'] in ['quantile','threshold']:lab=threshold(r['cvs'][c['window']],*model['thresholds'])
        else:
            z=[(v-m)/s for v,m,s in zip(r['x'],model['means'],model['scales'])]
            if c['kind']=='knn':
                nearest=sorted(enumerate(model['samples']),key=lambda it:(sum((a-b)**2 for a,b in zip(z,it[1]['x'])),it[0]))[:c['k']]
                votes=Counter(x['label'] for _,x in nearest);lab=max(labs,key=lambda l:votes[l])
            elif c['kind']=='nb':
                def score(l):return math.log(model['counts'][l]/sum(model['counts'].values()))-.5*sum(math.log(2*math.pi*v)+(a-b)**2/v for a,b,v in zip(z,model['centers'][l],model['variances'][l]))
                lab=max(labs,key=score)
            else:
                def score(l):return -.5*sum((a-b)**2 for a,b in zip(z,model['centers'][l]))+(-math.log(model['counts'][l]) if c['prior']=='inverse_frequency' else 0)
                lab=max(labs,key=score)
        pred.append(lab)
    return pred
def select_volatility():
    data=load_data('data/volatility');train=split_vol(data,'train');val=split_vol(data,'validation');configs=vol_candidates();scores={}
    for c in configs:
        model=fit_vol(train,c);pred=predict_vol(model,val);scores[c['name']]={'original':class_metrics([r['original'] for r in val],pred),'stat_diagnostic':class_metrics([r['stat'] for r in val],pred),'model':{k:v for k,v in model.items() if k not in ['samples']}}
    selected=max(configs,key=lambda c:(scores[c['name']]['original']['macro_f1'],scores[c['name']]['original']['balanced_accuracy']))
    out={'protocol_sha256':hashlib.sha256((ROOT/'paper_audit/PROTOCOL.md').read_bytes()).hexdigest(),'data_sha256':fingerprint(data),'seed':None,'features':['mean_7','sd_7','cv_7','mean_14','sd_14','cv_14','mean_30','sd_30','cv_30','zero_fraction_30','latest_income_over_mean30'],'train_n':len(train),'validation_n':len(val),'configurations':configs,'validation':scores,'selected':selected,'distributions':{s:{t:dict(Counter(r[t] for r in split_vol(data,s))) for t in ['original','stat']} for s in ['train','validation']}}
    write('volatility_selection.json',out);print('VOLATILITY SELECTION',selected,'validation',scores[selected['name']]['original'])
def test_volatility():
    data=load_data('data/volatility');selection=load('volatility_selection.json');assert fingerprint(data)==selection['data_sha256'];train=split_vol(data,'refit');test=split_vol(data,'test');scores={};predictions={}
    for c in selection['configurations']:
        model=fit_vol(train,c);pred=predict_vol(model,test);predictions[c['name']]=pred
        scores[c['name']]={'original':class_metrics([r['original'] for r in test],pred),'stat_diagnostic':class_metrics([r['stat'] for r in test],pred),'model':{k:v for k,v in model.items() if k!='samples'}}
    aligned=[threshold(r['cvs'][7],.3,.6) for r in test]
    recon=[]
    for name,rows in data.items():
        incomes=[float(r['income']) for r in rows]
        for i,r in enumerate(rows):recon.append({'cv_error':abs(cv(incomes[max(0,i-6):i+1])-float(r['rolling_cv_7'])),'stat_match':threshold(cv(incomes[max(0,i-6):i+1]),.3,.6)==r['volatility_label_stat'],'columns_agree':r['volatility_label']==r['volatility_label_stat']})
    selected=selection['selected']['name']
    out={'selection_file_sha256':hashlib.sha256((ROOT/'paper_audit/volatility_selection.json').read_bytes()).hexdigest(),'selected':selection['selected'],'refit_n':len(train),'test_n':len(test),'test':scores,'prediction_rows':[{**{k:v for k,v in r.items() if k in ['index','file','date','original','stat']},'original_prediction':predictions['original_30'][i],'selected_prediction':predictions[selected][i],'aligned_rule_prediction':aligned[i]} for i,r in enumerate(test)],'derived_reconstruction_diagnostic':{'n':len(recon),'max_cv_error':max(r['cv_error'] for r in recon),'stat_matches':sum(r['stat_match'] for r in recon),'column_agreement':sum(r['columns_agree'] for r in recon),'test':class_metrics([r['stat'] for r in test],aligned),'test_original_target':class_metrics([r['original'] for r in test],aligned)},'distributions':{s:{t:dict(Counter(r[t] for r in split_vol(data,s))) for t in ['original','stat']} for s in ['refit','test']}}
    write('volatility_results.json',out);print('VOLATILITY TEST',json.dumps({k:scores[k]['original'] for k in ['original_30','majority',selected]},indent=2))
if __name__=='__main__':
    if sys.argv[1:] == ['select']:
        select_forecast();select_volatility()
    elif sys.argv[1:] == ['test']:
        test_forecast();test_volatility()
    else:raise SystemExit('Usage: python paper_audit/experiments.py select|test')
