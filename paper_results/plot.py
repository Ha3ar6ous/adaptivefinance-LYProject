"""Publication figures from archived CSVs only. Use bundled plotting runtime."""
import argparse
import hashlib
import json
import platform
import sys
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from PIL import Image,ImageOps,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'white','axes.titleweight':'bold'})
COLORS=['#415a77','#e09f3e','#2a9d8f']


def main(out):
    figures=out/'figures';figures.mkdir(exist_ok=False);tables=out/'tables';inputs={};paths=[]
    def read(name):
        p=tables/name;inputs[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest();return pd.read_csv(p)
    def save(fig,name):
        p=figures/name
        with p.open('xb') as f:fig.savefig(f,format='png',dpi=160,bbox_inches='tight')
        plt.close(fig);paths.append(p)
    def forecast_plot(data,models,labels,title,name,currency):
        fig,axes=plt.subplots(1,2,figsize=(11,4.3),layout='constrained')
        for ax,metric in zip(axes,['mae','rmse']):
            for j,(model,label) in enumerate(zip(models,labels)):
                vals=data[data.method==model].set_index('horizon').reindex([7,15,30])[metric]
                ax.bar(np.arange(3)+(j-1)*.25,vals,width=.24,color=COLORS[j],label=label)
            ax.set_xticks(range(3),['7','15','30']);ax.set_xlabel('Horizon (calendar days)');ax.set_ylabel(metric.upper()+f' ({currency})');ax.set_ylim(bottom=0);ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True)
        axes[0].legend(frameon=False,fontsize=9);fig.suptitle(title,fontsize=12);save(fig,name)
    forecast_plot(read('forecast_full_comparison.csv'),['original','historical_mean','mean_median_075'],['Production','Historical mean','Frozen blend'],
        'Legacy synthetic benchmark: unequal series composition across horizons','forecast_legacy.png','INR')
    d=read('data_all_forecasts.csv');d=d[d.dataset=='real_single_driver']
    forecast_plot(d,['original','historical_mean','frozen_mean_median075'],['Production','Historical mean','Frozen blend'],
        'One real driver: USD recorded earnings; absent calendar days zero-filled','real_forecast.png','USD')
    d=read('volatility_confusion.csv');d=d[d.level=='pooled']
    fig,axes=plt.subplots(1,2,figsize=(10,4.2),layout='constrained');labels=['low','medium','high']
    for ax,model,title in zip(axes,['runtime_cv30','grid_cv30_0.45_0.75'],['Runtime CV30 .35/.75','Frozen selected CV30 .45/.75']):
        sub=d[d.model==model];c=sub.pivot(index='actual',columns='predicted',values='count').reindex(index=labels,columns=labels).to_numpy()
        im=ax.imshow(c,cmap='Blues',vmin=0,vmax=d['count'].max())
        for i in range(3):
            for j in range(3):ax.text(j,i,str(int(c[i,j])),ha='center',va='center',color='white' if c[i,j]>70 else '#18232e')
        ax.set_xticks(range(3),[x.upper() for x in labels]);ax.set_yticks(range(3),[x.upper() for x in labels]);ax.set_xlabel('Predicted');ax.set_ylabel('Actual');ax.set_title(title)
    fig.colorbar(im,ax=axes,label='Origins');fig.suptitle('Forward-CV synthetic test (247 origins): HIGH recall unchanged',fontsize=12);save(fig,'volatility_confusions.png')
    d=read('router_grid.csv');fig,axes=plt.subplots(1,2,figsize=(11,4.5),layout='constrained')
    for ax,mode in zip(axes,['engine_budget','reserve_free']):
        sub=d[d.execution==mode];scatter=ax.scatter(sub.ever_contributed*100,sub.forced_liquidation_rate*100,c=sub.L,cmap='viridis',vmin=1,vmax=6,s=30,alpha=.7)
        front=sub[sub.pareto];ax.scatter(front.ever_contributed*100,front.forced_liquidation_rate*100,s=110,facecolors='none',edgecolors='#2365ad',label='Three-objective frontier')
        prod=sub[(sub.L==3)&(sub.D==.5)];ax.scatter(prod.ever_contributed*100,prod.forced_liquidation_rate*100,color='#c0392b',marker='s',s=80,label='Production 3/.5')
        chosen=sub[(sub.L==(3 if mode=='engine_budget' else 1))&(sub.D==2)];ax.scatter(chosen.ever_contributed*100,chosen.forced_liquidation_rate*100,color='black',marker='*',s=160,label='Validation choice')
        ax.set_title(mode.replace('_',' '));ax.set_xlabel('Ever contributed (%)');ax.set_ylabel('Forced liquidation (%)');ax.set_ylim(bottom=0);ax.grid(alpha=.2)
    axes[0].legend(fontsize=8,frameon=False);fig.colorbar(scatter,ax=axes,label='Liquidity cutoff (months)')
    fig.suptitle('Validation trade-off; frontier uses shortfall, participation and wealth',fontsize=12);save(fig,'router_tradeoff.png')
    d=read('score_calibration.csv');scores=read('score_models.csv').set_index('model');fig,ax=plt.subplots(figsize=(7,5),layout='constrained')
    ax.plot([0,1],[0,1],'--',color='#777',label='Perfect calibration')
    for model,label,color in zip(['original_calibrated','corrected_calibrated','fit_corrected_factors'],['Original scalar','Rejected corrected scalar','Six-factor logistic'],COLORS):
        sub=d[(d.model==model)&(d.n>0)].sort_values('mean_predicted');ax.plot(sub.mean_predicted,sub.observed,'o-',color=color,label=f'{label} (AUC {scores.loc[model,"auc"]:.4f})',markersize=4)
    ax.set(xlim=(0,1),ylim=(0,1),xlabel='Mean predicted six-month shortfall probability',ylabel='Observed simulated shortfall fraction',title='Held-out calibration: simulated outcomes, five seed cohorts')
    ax.legend(fontsize=9,frameon=False);ax.grid(alpha=.2);save(fig,'score_calibration.png')
    engine=read('engine_constraints.csv');live=read('llm_live.csv');live=live[live.seed.astype(str)=='all'].iloc[0]
    rawpath=ROOT/'engine_llm_audit/results_20261017/live_125.json';inputs[rawpath.relative_to(ROOT).as_posix()]=hashlib.sha256(rawpath.read_bytes()).hexdigest()
    raw=pd.DataFrame(json.loads(rawpath.read_text())['rows'])[['id','seed','api_success','fallback','latency_ms','error']]
    raw.to_csv(tables/'llm_live_latency.csv',index=False,mode='x')
    fig,axes=plt.subplots(2,2,figsize=(11,7),layout='constrained');before=engine[engine.stage=='before'].iloc[0];after=engine[(engine.stage=='after')&(engine.method=='proposed')].iloc[0]
    for ax,metric,title,ylabel in [(axes[0,0],'minimum_violations','Product minimum violations','Allocation count'),(axes[0,1],'percentage_violations','Percentage-total violations','Profile count')]:
        vals=[before[metric],after[metric]];ax.bar(['Before','After'],vals,color=COLORS[:2]);ax.set(title=title,ylabel=ylabel);ax.set_ylim(0,max(vals)*1.18)
        for x,y in enumerate(vals):ax.text(x,y+max(vals)*.025,str(int(y)),ha='center')
    axes[1,0].bar(['Accepted','HTTP429/fallback'],[live.accepted,live.fallback],color=[COLORS[2],'#c0392b']);axes[1,0].set(title='Live LLM requests (125)',ylabel='Requests')
    for status,label,color in [(True,'API success',COLORS[2]),(False,'HTTP429','#c0392b')]:axes[1,1].hist(raw.loc[raw.api_success==status,'latency_ms'],bins=15,alpha=.6,label=label,color=color)
    axes[1,1].axvline(live.latency_p95_ms,color='black',ls='--',label='All-request p95');axes[1,1].set(title='API-inclusive latency (pacing excluded)',xlabel='Milliseconds',ylabel='Requests');axes[1,1].legend(fontsize=8,frameon=False)
    fig.suptitle('Constraint fixes and bounded-template LLM behavior',fontsize=12);save(fig,'engine_llm.png')
    # Contact sheet for visual QA only; individual full-resolution figures are primary.
    thumbs=[]
    for p in paths:
        im=Image.open(p).convert('RGB');im.thumbnail((850,550));canvas=Image.new('RGB',(900,600),'white');canvas.paste(im,((900-im.width)//2,35));ImageDraw.Draw(canvas).text((15,10),p.name,fill='black');thumbs.append(canvas)
    sheet=Image.new('RGB',(1800,1800),'#eeeeee')
    for i,im in enumerate(thumbs):sheet.paste(im,((i%2)*900,(i//2)*600))
    with (figures/'contact_sheet_QA.png').open('xb') as f:sheet.save(f,format='PNG')
    inputs[Path(__file__).relative_to(ROOT).as_posix()]=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    with (out/'figure_inputs_sha256.json').open('x') as f:json.dump(inputs,f,indent=2)
    with (out/'plot_environment.json').open('x') as f:json.dump(dict(python=sys.version,platform=platform.platform(),matplotlib=matplotlib.__version__,numpy=np.__version__,pandas=pd.__version__),f,indent=2)
    print('Generated six figures:',figures)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',default='paper_results/results_20261017');args=parser.parse_args();main((ROOT/args.out).resolve())
