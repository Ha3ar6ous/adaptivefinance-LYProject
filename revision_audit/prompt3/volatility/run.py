"""Frozen forward-target audit. Run from repository root; never writes old outputs."""
import argparse
import hashlib
import importlib.util
import itertools
import json
import platform
import shutil
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import scipy
import sklearn
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_sample_weight

ROOT = Path(__file__).resolve().parents[1]
LABELS = ['low', 'medium', 'high']
SEEDS = [11, 23, 37, 53, 71]
FEATURES = [f'{stat}_{w}' for w in (7, 14, 30) for stat in ('mean', 'sd', 'cv', 'zeros')] + ['last_ratio', 'mean_ratio', 'cv_delta', 'zero_mean']


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def dump(p, value):
    with p.open('x', encoding='utf-8') as f:
        json.dump(value, f, indent=2, allow_nan=False)


def csv(p, rows):
    pd.DataFrame(rows).to_csv(p, index=False, mode='x')


def cv(y):
    return float(np.std(y, ddof=1) / np.mean(y)) if len(y) > 1 and np.mean(y) > 0 else 0.0


def future_cv(y):
    if len(y) != 14 or not np.isfinite(y).all() or np.any(y < 0) or np.mean(y) == 0:
        return None
    return cv(y)


def features(y, t):
    past = np.asarray(y[:t], dtype=float)
    if len(past) < 30 or not np.isfinite(past).all() or np.any(past < 0):
        raise ValueError('Invalid or insufficient past history')
    out = []
    for w in (7, 14, 30):
        v = past[-w:]
        out += [float(v.mean()), float(v.std(ddof=1)), cv(v), float(np.mean(v == 0))]
    mean = past[-30:].mean()
    return out + [float(past[-1] / mean) if mean else 0., float(past[-7:].mean() / mean) if mean else 0., cv(past[-7:]) - cv(past[-30:]), float(mean == 0)]


def label(values, cutoffs):
    return np.digitize(values, cutoffs, right=False)


def matrix(y, pred):
    return np.bincount(np.asarray(y, int) * 3 + np.asarray(pred, int), minlength=9).reshape(3, 3)


def metric(c):
    c = np.asarray(c, float)
    support, predicted = c.sum(axis=-1), c.sum(axis=-2)
    diag = np.diagonal(c, axis1=-2, axis2=-1)
    precision = np.divide(diag, predicted, out=np.zeros_like(diag), where=predicted > 0)
    recall = np.divide(diag, support, out=np.zeros_like(diag), where=support > 0)
    f1 = np.divide(2 * diag, support + predicted, out=np.zeros_like(diag), where=(support + predicted) > 0)
    macro = f1.mean(axis=-1)
    high = np.where(support[..., 2] > 0, recall[..., 2], np.nan)
    balanced = recall.sum(axis=-1) / (support > 0).sum(axis=-1)
    return macro, high, balanced, precision, recall, f1


def score(y, pred):
    c = matrix(y, pred)
    m, h, b, _, _, _ = metric(c)
    return dict(n=int(c.sum()), macro_f1=float(m), high_recall=float(h) if np.isfinite(h) else None,
                balanced_accuracy=float(b), accuracy=float(np.trace(c) / c.sum()),
                high_support=int(c[2].sum()), high_to_low=int(c[2, 0]), high_to_medium=int(c[2, 1]))


def load_series():
    out = []
    for p in sorted((ROOT / 'data/normal').glob('*.csv')):
        d = pd.read_csv(p).sort_values('date').reset_index(drop=True)
        dates = pd.to_datetime(d.date)
        assert dates.diff().dropna().eq(pd.Timedelta(days=1)).all(), p
        assert dates.is_unique and np.isfinite(d.income).all() and (d.income >= 0).all(), p
        platforms = d.platform.str.lower().unique()
        assert len(platforms) == 1
        out.append((p.name, platforms[0], d))
    return out


def examples(series, split):
    rows, exclusions = [], []
    for name, plat, d in series:
        y = d.income.to_numpy(float)
        start, stop = {'train': (30, 60-14), 'validation': (60, 90-14), 'test': (90, len(y)-14)}[split]
        for t in range(start, stop + 1):
            target = future_cv(y[t:t+14])
            if target is None:
                exclusions.append(dict(series=name, origin=t, split=split, reason='undefined future CV'))
                continue
            rows.append(dict(series=name, platform=plat, origin=t, observed_through=d.date.iloc[t-1],
                             outcome_start=d.date.iloc[t], outcome_end=d.date.iloc[t+13], realized_cv=target,
                             split=split, **dict(zip(FEATURES, features(y, t)))))
    return pd.DataFrame(rows), exclusions


def preserved_files():
    paths = set((ROOT / 'data').rglob('*.csv'))
    for folder in ('paper_audit', 'research_eval', 'forecast_audit'):
        for p in (ROOT / folder).rglob('*'):
            if p.is_file() and not any(x in p.parts for x in ('.venv', '__pycache__', 'cache', '.pytest_cache')):
                paths.add(p)
    for folder in ('ml_service/modules', 'server/services', 'server/controllers', 'server/tests'):
        paths.update(p for p in (ROOT / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    for name in ('amend_test.md', 'PAPER_METRICS_AUDIT.md', 'CHANGES_forecast.md', 'server/package.json'):
        p = ROOT / name
        if p.exists(): paths.add(p)
    return {str(p.relative_to(ROOT)).replace('\\', '/'): digest(p) for p in sorted(paths)}


def prepare(out):
    out.mkdir(parents=True, exist_ok=False)
    dump(out / 'preserved_sha256.json', preserved_files())
    for name in ('PROTOCOL.md', 'requirements.txt', 'run.py', 'test_audit.py'):
        p = ROOT / 'volatility_audit' / name
        if p.exists(): shutil.copy2(p, out / name)
    # Keep the original comparator/selection experiment frozen after deployment.
    # Current deployment is evaluated separately by revision_audit/evaluate.py.
    source = ROOT / 'volatility_audit/results_20261017/runtime_snapshot.py'
    shutil.copy2(source, out / 'runtime_snapshot.py')
    artifact = ROOT / 'ml_service/artifacts/volatility_model.json'
    thresholds = json.loads(artifact.read_text()) if artifact.exists() else {'low_max_cv': .35, 'medium_max_cv': .75}
    dump(out / 'runtime_thresholds.json', thresholds)
    dump(out / 'environment.json', dict(python=sys.version, os=platform.platform(), numpy=np.__version__,
         pandas=pd.__version__, scipy=scipy.__version__, sklearn=sklearn.__version__, seeds=SEEDS,
         bootstrap_draws_per_seed=1000, artifact_existed=artifact.exists(),
         runtime_role='frozen historical .35/.75 comparator; not current deployment'))
    series = load_series()
    train, ex1 = examples(series, 'train')
    val, ex2 = examples(series, 'validation')
    cutoffs = np.quantile(train.realized_cv, [1/3, 2/3], method='linear').tolist()
    dump(out / 'target_cutoffs.json', dict(cutoffs=cutoffs, fit_split='train', n=len(train), quantile_method='linear',
                                         ties_at_cutoffs=[int((train.realized_cv == c).sum()) for c in cutoffs]))
    for name, d in [('train', train), ('validation', val)]:
        d['target'] = label(d.realized_cv, cutoffs)
        d.to_csv(out / f'{name}_examples.csv', index=False, mode='x')
    csv(out / 'data_inventory.csv', [dict(series=name, platform=plat, rows=len(d), first=d.date.iloc[0], last=d.date.iloc[-1],
        zero_income=int((d.income == 0).sum()), purged_origins=26) for name, plat, d in series])
    dump(out / 'excluded_train_validation.json', ex1+ex2)
    old_audit(out)
    print('Prepared train/validation only; training cutoffs:', cutoffs, flush=True)


def runtime(out):
    spec = importlib.util.spec_from_file_location('frozen_runtime', out / 'runtime_snapshot.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ARTIFACT_PATH = out / 'runtime_thresholds.json'
    return module


def old_audit(out):
    old, summary = [], []
    r = runtime(out)
    for p in sorted((ROOT / 'data/volatility').glob('*.csv')):
        d = pd.read_csv(p)
        raw = pd.read_csv(ROOT / 'data/normal' / p.name.replace('_with_volatility_label', '_volatile'))
        assert np.array_equal(d.income, raw.income)
        y = d.income.to_numpy(float)
        for i in range(len(d)):
            rec = cv(y[max(0, i-6):i+1])
            item = dict(series=p.name, index=i, original=d.volatility_label.iloc[i], stat=d.volatility_label_stat.iloc[i],
                        reconstructed=LABELS[int(label(rec, [.3,.6]))], cv_error=abs(rec-d.rolling_cv_7.iloc[i]))
            if i >= 29:
                item['runtime'] = r.classify_volatility(d.iloc[:i+1].to_dict('records'))['label']
            old.append(item)
    d = pd.DataFrame(old)
    d.to_csv(out / 'legacy_label_audit.csv', index=False, mode='x')
    eligible = d.dropna(subset=['runtime'])
    dump(out / 'legacy_summary.json', dict(n=len(d), original_counts=d.original.value_counts().to_dict(),
         stat_counts=d.stat.value_counts().to_dict(), reconstructed_matches=int((d.stat == d.reconstructed).sum()),
         original_stat_matches=int((d.original == d.stat).sum()), max_cv_error=float(d.cv_error.max()),
         runtime_n=len(eligible), runtime_original_matches=int((eligible.runtime == eligible.original).sum()),
         runtime_stat_matches=int((eligible.runtime == eligible.stat).sum())))


def configs():
    result = []
    for v in (1e-9, .001, .1): result.append(dict(family='NB', var_smoothing=v))
    for k, w in itertools.product((5,15,31), ('uniform','distance')): result.append(dict(family='kNN', k=k, weights=w))
    for c, w in itertools.product((.1,1.,10.), (None,'balanced')): result.append(dict(family='logistic', C=c, class_weight=w))
    for depth, bal in itertools.product((1,2), (False,True)): result.append(dict(family='GB', depth=depth, balanced=bal))
    return result


def fit_predict(config, train, evaluation, failures, stage):
    x, y, z = train[FEATURES].to_numpy(), train.target.to_numpy(int), evaluation[FEATURES].to_numpy()
    family = config['family']
    seeds = SEEDS if family == 'GB' else [None]
    probabilities = []
    for seed in seeds:
        try:
            if family == 'NB': model = GaussianNB(var_smoothing=config['var_smoothing'])
            elif family == 'kNN': model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=config['k'], weights=config['weights']))
            elif family == 'logistic': model = make_pipeline(StandardScaler(), LogisticRegression(C=config['C'], class_weight=config['class_weight'], solver='lbfgs', max_iter=2000))
            else: model = GradientBoostingClassifier(max_depth=config['depth'], n_estimators=80, learning_rate=.05, min_samples_leaf=5, subsample=.8, random_state=seed)
            with warnings.catch_warnings(record=True) as seen:
                warnings.simplefilter('always')
                if family == 'GB' and config['balanced']:
                    model.fit(x, y, sample_weight=compute_sample_weight('balanced', y))
                else: model.fit(x, y)
                p = np.zeros((len(z), 3))
                p[:, model.classes_.astype(int)] = model.predict_proba(z)
                for w in seen: failures.append(dict(stage=stage, config=config, seed=seed, warning=str(w.message)))
        except Exception as e:
            failures.append(dict(stage=stage, config=config, seed=seed, failure=repr(e)))
            p = np.zeros((len(z),3)); p[:, np.bincount(y, minlength=3).argmax()] = 1
        probabilities.append(p)
    return np.mean(probabilities, axis=0), probabilities


def decide(p, rule):
    if rule == 'argmax': return p.argmax(axis=1)
    return np.where(p[:, 2] >= float(rule), 2, p[:, :2].argmax(axis=1))


def baselines(train, evaluation, out, rules=None):
    th = json.loads((out / 'runtime_thresholds.json').read_text())
    cut = json.loads((out / 'target_cutoffs.json').read_text())['cutoffs']
    preds = dict(runtime_cv30=label(evaluation.cv_30, [th['low_max_cv'], th['medium_max_cv']]),
                 train_majority=np.full(len(evaluation), np.bincount(train.target, minlength=3).argmax()),
                 always_HIGH=np.full(len(evaluation), 2))
    learned = {} if rules is None else rules
    for w in (7,14,30):
        preds[f'past_cv{w}_target_cutoffs'] = label(evaluation[f'cv_{w}'], cut)
        if rules is None:
            candidates = np.unique(np.quantile(train[f'cv_{w}'], np.linspace(0,1,21)))
            pairs = list(itertools.combinations(candidates, 2))
            best = max(pairs, key=lambda pair: score(train.target, label(train[f'cv_{w}'], pair))['macro_f1'])
            learned[str(w)] = [float(v) for v in best]
        preds[f'train_tuned_cv{w}'] = label(evaluation[f'cv_{w}'], learned[str(w)])
    return preds, learned


def choose(rows, minimum):
    eligible = [r for r in rows if r['high_recall'] is not None and r['high_recall'] >= minimum]
    if not eligible: return None
    return max(eligible, key=lambda r: (r['macro_f1'], r['high_recall'], r['balanced_accuracy'], -r['order']))


def select(out):
    tr, va = [pd.read_csv(out / f'{s}_examples.csv') for s in ('train','validation')]
    failures, candidates, seedrows = [], [], []
    pred, trained_rules = baselines(tr, va, out)
    dump(out / 'train_threshold_rules.json', trained_rules)
    for name, p in pred.items(): candidates.append(dict(name=name, family='baseline', order=len(candidates), **score(va.target,p)))
    minimum = candidates[0]['high_recall']
    for ci, conf in enumerate(configs()):
        print('Validation fit', ci, conf, flush=True)
        probs, seeds = fit_predict(conf, tr, va, failures, 'validation')
        for rule in ('argmax', '.2', '.35', '.5'):
            name = f'{conf["family"]}_{ci}_{rule}'
            candidates.append(dict(name=name, family=conf['family'], config=conf, decision=rule, order=len(candidates), **score(va.target,decide(probs,rule))))
            if conf['family'] == 'GB':
                for seed, p in zip(SEEDS,seeds): seedrows.append(dict(stage='validation', name=name, seed=seed, **score(va.target,decide(p,rule))))
    grid = []
    for lo, hi in itertools.product((.25,.30,.35,.40,.45), (.60,.675,.75,.825,.90)):
        p = label(va.cv_30, [lo,hi]); c = matrix(va.target,p)
        row = dict(name=f'grid_cv30_{lo}_{hi}', family='grid', low=lo, high=hi, order=len(candidates), **score(va.target,p),
                   **{f'actual_{a}_pred_{b}': int(c[i,j]) for i,a in enumerate(LABELS) for j,b in enumerate(LABELS)})
        grid.append(row); candidates.append(row)
    csv(out / 'validation_all_candidates.csv', [{**r, 'config':json.dumps(r.get('config',{}),sort_keys=True)} for r in candidates])
    csv(out / 'validation_threshold_grid.csv', grid)
    g = pd.DataFrame(grid)
    for m in ('macro_f1','high_recall'):
        g.pivot(index='low',columns='high',values=m).to_csv(out / f'validation_grid_{m}_matrix.csv', mode='x')
    csv(out / 'validation_seed_metrics.csv',seedrows)
    family = {f: choose([r for r in candidates if r['family'] == f], minimum) for f in ('NB','kNN','logistic','GB')}
    selection = dict(runtime_validation_high_recall=minimum, overall=choose(candidates,minimum), families=family,
                     grid=choose(grid,minimum), criterion='validation macro-F1 subject to HIGH recall >= runtime; then HIGH recall, balanced accuracy, order',
                     stage='frozen before forward test labels/features/predictions',
                     fingerprints={p.name:digest(p) for p in out.iterdir() if p.is_file()})
    dump(out / 'selection.json',selection)
    dump(out / 'validation_fit_events.json', failures)
    print('FROZEN SELECTION:',json.dumps(selection['overall']),flush=True)


def group_reports(d, predictions, out, prefix):
    rows, confusion, classes = [], [], []
    groups = [('pooled','all',np.ones(len(d),bool))]
    for field in ('platform','series'):
        groups += [(field,v,(d[field] == v).to_numpy()) for v in sorted(d[field].unique())]
    for level, group, mask in groups:
        y = d.target.to_numpy()[mask]
        for name,p in predictions.items():
            p = np.asarray(p)[mask]; c = matrix(y,p)
            rows.append(dict(level=level,group=group,model=name,**score(y,p)))
            _,_,_,pr,re,f1 = metric(c)
            for i,a in enumerate(LABELS):
                classes.append(dict(level=level,group=group,model=name,label=a,support=int(c[i].sum()),precision=pr[i],recall=re[i],f1=f1[i]))
                for j,b in enumerate(LABELS): confusion.append(dict(level=level,group=group,model=name,actual=a,predicted=b,count=int(c[i,j])))
    csv(out / f'{prefix}_metrics.csv',rows)
    csv(out / f'{prefix}_per_class.csv',classes)
    csv(out / f'{prefix}_confusion.csv',confusion)


def bootstrap(d, predictions, selected, out):
    rows, paired = [], []
    for group in ['all']+sorted(d.platform.unique()):
        sub = d if group == 'all' else d[d.platform == group]
        cluster = 'platform' if group == 'all' else 'series'
        names = sorted(sub[cluster].unique())
        weights = np.concatenate([np.random.default_rng(seed).multinomial(len(names), np.ones(len(names))/len(names),size=1000) for seed in SEEDS])
        estimates = {}
        for model,pred in predictions.items():
            mats = np.array([matrix(d.loc[sub.index[sub[cluster] == name],'target'], np.asarray(pred)[sub.index[sub[cluster] == name]]) for name in names])
            sampled = np.einsum('bk,kij->bij',weights,mats)
            m,h,*_ = metric(sampled)
            estimates[model] = (m,h)
            for name, values in [('macro_f1',m),('high_recall',h)]:
                valid = values[np.isfinite(values)]
                lo,hi = np.quantile(valid,[.025,.975]) if len(valid) else (np.nan,np.nan)
                rows.append(dict(group=group,model=model,metric=name,lower_95=lo,upper_95=hi,valid_draws=len(valid),draws=len(weights),clusters=len(names),resampling_unit=cluster))
        for j,name in enumerate(('macro_f1','high_recall')):
            diff=estimates[selected][j]-estimates['runtime_cv30'][j]; valid=diff[np.isfinite(diff)]
            lo,hi=np.quantile(valid,[.025,.975]) if len(valid) else (np.nan,np.nan)
            paired.append(dict(group=group,comparison=f'{selected} minus runtime_cv30',metric=name,lower_95=lo,upper_95=hi,valid_draws=len(valid)))
    csv(out / 'test_bootstrap_ci.csv',rows)
    csv(out / 'test_paired_delta_ci.csv',paired)


def test(out):
    selection = json.loads((out / 'selection.json').read_text())
    for name,h in selection['fingerprints'].items(): assert digest(out / name) == h, f'Changed selection input: {name}'
    tr,va = [pd.read_csv(out / f'{s}_examples.csv') for s in ('train','validation')]
    te, excluded = examples(load_series(),'test')
    cut = json.loads((out / 'target_cutoffs.json').read_text())['cutoffs']
    te['target'] = label(te.realized_cv,cut)
    te.to_csv(out / 'test_examples.csv',index=False,mode='x')
    dump(out / 'excluded_test.json',excluded)
    fit = pd.concat([tr,va],ignore_index=True)
    preds,_ = baselines(tr,te,out,json.loads((out / 'train_threshold_rules.json').read_text()))
    failures, seedrows, probabilityrows = [],[],[]
    for family, winner in selection['families'].items():
        if winner is None: continue
        p, ps = fit_predict(winner['config'],fit,te,failures,'test_refit')
        name=winner['name']; preds[name]=decide(p,winner['decision'])
        for seed,prob in zip(SEEDS if family=='GB' else [None],ps):
            if seed is not None: seedrows.append(dict(model=name,seed=seed,**score(te.target,decide(prob,winner['decision']))))
            for i,vec in enumerate(prob): probabilityrows.append(dict(model=name,seed=seed,series=te.series.iloc[i],origin=int(te.origin.iloc[i]),p_low=vec[0],p_medium=vec[1],p_high=vec[2]))
    grid=selection['grid']
    if grid: preds[grid['name']]=label(te.cv_30,[grid['low'],grid['high']])
    selected=selection['overall']['name']
    assert selected in preds
    # Verify CV-rule baseline is exactly the frozen production implementation, not a reimplementation change.
    rt=runtime(out); by_name={n:d for n,_,d in load_series()}
    actual=[LABELS.index(rt.classify_volatility(by_name[row.series].iloc[:int(row.origin)].to_dict('records'))['label']) for row in te.itertuples()]
    assert np.array_equal(actual,preds['runtime_cv30'])
    rows=[]
    for name,p in preds.items():
        for i,value in enumerate(p): rows.append(dict(model=name,series=te.series.iloc[i],platform=te.platform.iloc[i],origin=int(te.origin.iloc[i]),actual=int(te.target.iloc[i]),predicted=int(value)))
    csv(out / 'test_predictions.csv',rows)
    csv(out / 'test_seed_metrics.csv',seedrows)
    csv(out / 'test_seed_probabilities.csv',probabilityrows)
    group_reports(te,preds,out,'test')
    mask=((te.origin-90)%14 == 0).to_numpy()
    group_reports(te.loc[mask].reset_index(drop=True),{k:np.asarray(v)[mask] for k,v in preds.items()},out,'nonoverlap_test')
    bootstrap(te,preds,selected,out)
    dump(out / 'test_fit_events.json',failures)
    counts=[]
    for s,d in [('train',tr),('validation',va),('test',te)]:
        for plat in ['all']+sorted(d.platform.unique()):
            sub=d if plat=='all' else d[d.platform==plat]
            counts.append(dict(split=s,platform=plat,n=len(sub),**{LABELS[i]:int((sub.target==i).sum()) for i in range(3)}))
    csv(out / 'class_distribution.csv',counts)
    before=score(te.target,preds['runtime_cv30']); after=score(te.target,preds[selected])
    csv(out / 'original_vs_selected.csv',[dict(metric=k,runtime=before[k],selected=after[k],absolute_change=after[k]-before[k],
        relative_change_percent=100*(after[k]-before[k])/before[k] if before[k] else None) for k in ('macro_f1','high_recall','balanced_accuracy','accuracy')])
    old=json.loads((out / 'preserved_sha256.json').read_text())
    changed=[name for name,h in old.items() if not (ROOT/name).exists() or digest(ROOT/name)!=h]
    dump(out / 'preservation_check.json',dict(files_checked=len(old),changed=changed))
    assert not changed, changed
    print('TEST runtime:',before,'selected:',selected,after,flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    parser.add_argument('--stage',choices=['prepare','select','test','all'],default='all')
    args=parser.parse_args(); out=(ROOT/args.out).resolve()
    begin=time.perf_counter()
    for stage,fn in [('prepare',prepare),('select',select),('test',test)]:
        if args.stage in (stage,'all'): fn(out)
    print('Wall seconds:',time.perf_counter()-begin,flush=True)


if __name__=='__main__': main()
