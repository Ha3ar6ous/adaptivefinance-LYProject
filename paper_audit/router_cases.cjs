const fs = require('node:fs')
const path = require('node:path')
const ROOT = path.resolve(__dirname, '..')
const phase = (s) => s < 40 ? 'crisis' : s < 60 ? 'survival' : s < 80 ? 'stability' : 'growth'
function fixture({ liquidity=4, debt=0, score=80, volatility='low' } = {}) {
  const cv = volatility === 'low' ? .2 : volatility === 'medium' ? .5 : .8
  return {
    user: { monthlyExpenses: 20000, bankBalance: liquidity*20000, debts: debt*20000, riskPreference:'low' },
    health: { score, phase: phase(score) },
    analytics: { forecast: { horizon: 15, method:'trend_weekday', points:Array.from({length:15},(_,i)=>({date:new Date(Date.UTC(2024,1,1+i)).toISOString().slice(0,10),income:1000})) },
      volatility: { label:volatility, features:{entryCount:30,recentAverageIncome:1000,recentStdIncome:1000*cv,coefficientOfVariation:cv} } },
  }
}
function grid() {
  const rows=[]
  for(const liquidity of [0,.99,1,1.01,2.99,3,3.01,6])
    for(const debt of [0,.49,.5,.51,1.99,2,2.01,3])
      for(const score of [0,39,60,69,70,71,100])
        for(const volatility of ['low','medium','high','unknown']) {
          rows.push({name:`L=${liquidity},D=${debt},S=${score},V=${volatility}`,category:'boundary_grid',
            expected:liquidity>=3 && debt<=.5 && score>=70 && ['low','medium'].includes(volatility),
            input:fixture({liquidity,debt,score,volatility})})
        }
  return rows
}
function invalidCases() {
  const mutations=[]
  const add=(name,fn)=>{const x=fixture();fn(x);mutations.push({name,category:'invalid',input:x,expected:false})}
  for(const field of ['monthlyExpenses','bankBalance','debts'])
    for(const value of [undefined,null,NaN,Infinity,-Infinity,-1,'20000',true,{},[]])
      add(`user.${field}=${String(value)}`,x=>{x.user[field]=value})
  add('zero expenses',x=>{x.user.monthlyExpenses=0})
  for(const value of [undefined,null,NaN,Infinity,-1,101,'80',true]) add(`score=${String(value)}`,x=>{x.health.score=value})
  add('phase inconsistent',x=>{x.health.phase='crisis'})
  for(const key of ['user','health','analytics']) for(const value of [undefined,null,[],true]) add(`${key} missing/malformed ${String(value)}`,x=>{x[key]=value})
  for(const key of ['forecast','volatility']) add(`missing ${key}`,x=>{delete x.analytics[key]})
  for(const value of ['error','insufficient_data',null,'']) add(`status=${value}`,x=>{x.analytics.status=value})
  add('analytics error message',x=>{x.analytics.error='transport failed'})
  add('missing forecast points',x=>{delete x.analytics.forecast.points})
  add('empty forecast',x=>{x.analytics.forecast.points=[]})
  add('wrong horizon length',x=>{x.analytics.forecast.horizon=14})
  for(const value of [0,31,1.5,'15',null,NaN,Infinity]) add(`horizon=${String(value)}`,x=>{x.analytics.forecast.horizon=value})
  for(const value of ['error','unknown','insufficient_data','bogus',null]) add(`method=${value}`,x=>{x.analytics.forecast.method=value})
  for(const value of [undefined,null,'1000',NaN,Infinity,-1]) add(`forecast income=${String(value)}`,x=>{x.analytics.forecast.points[0].income=value})
  for(const value of ['bad','2024-02-30',null,'2024-2-1']) add(`forecast date=${value}`,x=>{x.analytics.forecast.points[0].date=value})
  add('duplicate forecast dates',x=>{x.analytics.forecast.points[1].date=x.analytics.forecast.points[0].date})
  add('reversed forecast dates',x=>{x.analytics.forecast.points.reverse()})
  add('zero-only forecast',x=>{x.analytics.forecast.points.forEach(p=>p.income=0)})
  add('overflowing forecast total',x=>{x.analytics.forecast.points.forEach(p=>p.income=Number.MAX_VALUE)})
  add('null forecast point',x=>{x.analytics.forecast.points[0]=null})
  add('missing features',x=>{delete x.analytics.volatility.features})
  for(const field of ['entryCount','recentAverageIncome','recentStdIncome','coefficientOfVariation'])
    for(const value of [undefined,null,NaN,Infinity,-1,'30']) add(`${field}=${String(value)}`,x=>{x.analytics.volatility.features[field]=value})
  add('too few volatility entries',x=>{x.analytics.volatility.features.entryCount=2})
  add('noninteger entry count',x=>{x.analytics.volatility.features.entryCount=3.1})
  add('zero income mean',x=>{x.analytics.volatility.features.recentAverageIncome=0})
  add('inconsistent CV',x=>{x.analytics.volatility.features.coefficientOfVariation=.1})
  for(const value of ['unknown','high','bogus',null]) add(`volatility=${value}`,x=>{x.analytics.volatility.label=value})
  return mutations
}
const allowed=r=>r.actions.find(a=>a.key==='conservative_investing').allowed
function evaluate(fn,rows) {
  const result={n:rows.length,tp:0,fp:0,fn:0,tn:0,exceptions:0,failures:[]}
  for(const row of rows){let actual=false,error='';try{actual=allowed(fn(row.input))}catch(e){result.exceptions++;error=e.message}
    result[row.expected?(actual?'tp':'fn'):(actual?'fp':'tn')]++
    if(actual!==row.expected||error)result.failures.push({name:row.name,expected:row.expected,actual,error})
  }
  result.accuracy=(result.tp+result.tn)/result.n
  result.precision=result.tp+result.fp?result.tp/(result.tp+result.fp):null
  result.recall=result.tp+result.fn?result.tp/(result.tp+result.fn):null
  result.false_allow=result.fp;result.false_block=result.fn
  return result
}
function main(){const original=require('./baseline/decisionRouterService.js').buildDecisionRouter,revised=require('../server/services/decisionRouterService').buildDecisionRouter
  const result={policy:'paper_audit/PROTOCOL.md',splits:{}}
  for(const [name,rows] of [['boundary_grid',grid()],['invalid_inputs',invalidCases()],['combined',[...grid(),...invalidCases()]]]) result.splits[name]={original:evaluate(original,rows),revised:evaluate(revised,rows)}
  fs.writeFileSync(path.join(__dirname,'router_results.json'),JSON.stringify(result,null,2))
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result.splits).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([s,r])=>[s,{...r,failures:r.failures.length}]))])),null,2))
}
module.exports={fixture,grid,invalidCases,allowed,evaluate}
if(require.main===module)main()
