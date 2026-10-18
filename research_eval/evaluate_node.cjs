/* Research-only harness: loads unchanged service source in a VM, replaces DB
 * adapters with memory fixtures, exposes private helpers in memory. No DB writes. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
function load(rel,extra=[],mocks={}) {
  const filename=path.join(ROOT,rel), req=createRequire(filename), module={exports:{}};
  const context={module,exports:module.exports,require:n=>n in mocks?mocks[n]:n.startsWith('../models/')?{}:req(n),console,process,fetch,AbortController,setTimeout,clearTimeout,Date};
  vm.runInNewContext(fs.readFileSync(filename,'utf8')+'\n'+extra.map(n=>`module.exports.${n}=${n};`).join('\n'),context,{filename});
  return module.exports;
}
const health=require('../server/services/healthScoreService'),router=require('../server/services/decisionRouterService');
const engine={...load('server/services/investmentEngineService.js',['deriveInputs','hardFilter','scoreOption']),...require('../server/services/investmentEngineService')};
const {loadInvestmentOptions}=require('../server/data/investmentOptions');
const options=loadInvestmentOptions();
const round=x=>Math.round(Math.max(0,Math.min(100,x)));
const phase=s=>s<40?'crisis':s<60?'survival':s<80?'stability':'growth';
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const count=a=>a.reduce((r,v)=>(r[v]=(r[v]||0)+1,r),{});
const investAllowed=r=>r.actions.find(a=>a.key==='conservative_investing').allowed;
function fixture({income=1000,expenses=20000,balance=100000,debt=0,vol='low',trend=1,n=30,risk='low'}={}) {
  return {userId:'research-fixture',user:{bankBalance:balance,monthlyExpenses:expenses,debts:debt,riskPreference:risk},entries:Array.from({length:n},(_,i)=>({date:new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10),income})),analytics:{volatility:{label:vol,features:{coefficientOfVariation:vol==='high'?.8:vol==='medium'?.5:.1}},forecast:{horizon:15,points:Array.from({length:15},()=>({income:income*trend})),method:'synthetic_control'}}};
}
function pipeline(f){f.analytics.health=health.calculateHealthScore(f); f.analytics.router=router.buildDecisionRouter({...f,health:f.analytics.health});return engine.buildInvestmentSuggestion(f);}
function timer(fn,n=500,warmup=50){for(let i=0;i<warmup;i++)fn();let v=[];for(let i=0;i<n;i++){let a=process.hrtime.bigint();fn();v.push(Number(process.hrtime.bigint()-a)/1e6);}v.sort((a,b)=>a-b);const avg=mean(v);return {n,warmup,mean_ms:avg,std_ms:Math.sqrt(mean(v.map(x=>(x-avg)**2))),median_ms:(v[n/2-1]+v[n/2])/2,p95_ms:v[Math.ceil(n*.95)-1],min_ms:v[0],max_ms:v.at(-1)};}
async function main(){
const out={health:{},router:{},investment:{},llm:{},tests:[],performance:{}};
const matrix=[];
for(const income of [0,500,1500])for(const expenses of [10000,20000,40000])for(const liq of [0,.5,1,3,6])for(const debtRatio of [0,.5,2,4])for(const vol of ['low','medium','high','unknown'])for(const trend of [.5,1,1.5])for(const n of [3,14,30]){
 const f=fixture({income,expenses,balance:expenses*liq,debt:expenses*debtRatio,vol,trend,n});const h=health.calculateHealthScore(f);
 matrix.push({income,expenses,liq,debtRatio,vol,trend,n,score:h.score,phase:h.phase,factors:Object.values(h.factors).map(x=>x.value),allow:investAllowed(router.buildDecisionRouter({...f,health:h}))});
}
out.health.matrix_n=matrix.length;out.health.score={min:Math.min(...matrix.map(x=>x.score)),max:Math.max(...matrix.map(x=>x.score)),mean:mean(matrix.map(x=>x.score))};out.health.phases=count(matrix.map(x=>x.phase));
out.health.monotonicity=[];
for(const [factor,levels,expected] of [['liq',[0,.5,1,3,6],1],['debtRatio',[0,.5,2,4],-1],['vol',['high','medium','low'],1],['trend',[.5,1,1.5],1],['n',[3,14,30],1],['income',[500,1500],1]]) {
 const groups=new Map();for(const x of matrix){if(!levels.includes(x[factor]))continue;const k=JSON.stringify(Object.fromEntries(Object.entries(x).filter(([a])=>['income','expenses','liq','debtRatio','vol','trend','n'].includes(a)&&a!==factor)));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x);}
 const delta=[];for(const xs of groups.values()){xs.sort((a,b)=>levels.indexOf(a[factor])-levels.indexOf(b[factor]));for(let i=1;i<xs.length;i++)delta.push(xs[i].score-xs[i-1].score);}
 out.health.monotonicity.push({factor,pairs:delta.length,violations:delta.filter(x=>x*expected<0).length,equalities:delta.filter(x=>x===0).length,min_delta:Math.min(...delta),max_delta:Math.max(...delta)});
}
const expenseProbes=[];for(const balance of [0,10000,60000,120000])for(const debt of [0,10000,60000,100000]){let prev=null;for(const expenses of [10000,20000,40000]){let h=health.calculateHealthScore(fixture({balance,debt,expenses}));if(prev)expenseProbes.push({balance,debt,from:prev.expenses,to:expenses,delta:h.score-prev.score});prev={expenses,score:h.score};}}
out.health.fixed_amount_expense={pairs:expenseProbes.length,increases:expenseProbes.filter(x=>x.delta>0).length,decreases:expenseProbes.filter(x=>x.delta<0).length,equalities:expenseProbes.filter(x=>x.delta===0).length,counterexamples:expenseProbes.filter(x=>x.delta>0)};
const weights=[.3,.25,.2,.15,.1], names=['liquidity','debtSafety','incomeStability','forecastTrend','dataConsistency'];out.health.ablation=[];
for(let i=0;i<5;i++)for(const mult of [0,.8,1.2]){const w=weights.map((x,j)=>i===j?x*mult:x),sum=w.reduce((a,b)=>a+b,0);const normalized=w.map(x=>x/sum),d=matrix.map(x=>round(x.factors.reduce((s,v,j)=>s+v*normalized[j],0))-x.score);const alternative=matrix.map((x,k)=>x.score+d[k]);out.health.ablation.push({component:names[i],multiplier:mult,weights:normalized,mean_abs_delta:mean(d.map(Math.abs)),max_abs_delta:Math.max(...d.map(Math.abs)),phase_changes:alternative.filter((s,k)=>phase(s)!==matrix[k].phase).length,score70_crossings:alternative.filter((s,k)=>(s>=70)!==(matrix[k].score>=70)).length,router_changes:alternative.filter((s,k)=>{const x=matrix[k];return (s>=70&&x.liq>=1&&x.debtRatio<=2&&x.vol!=='high')!==x.allow;}).length});}
out.health.selected=[['stable',{}],['zero_income',{income:0}],['zero_income_no_forecast',{income:0,trend:0}],['high_debt',{debt:100000,vol:'medium'}],['vulnerable',{income:500,balance:10000,debt:60000,vol:'high'}]].map(([name,cfg])=>({name,...health.calculateHealthScore(fixture(cfg))}));
const cases=[];for(const liq of [0,.99,1,1.01,2.99,3,3.01,6])for(const d of [0,.49,.5,.51,1.99,2,2.01,3])for(const score of [0,39,60,69,70,71,100])for(const vol of ['low','medium','high','unknown']){const f=fixture({balance:20000*liq,debt:20000*d,vol});const actual=investAllowed(router.buildDecisionRouter({...f,health:{score}}));cases.push({liq,debt_ratio:d,score,vol,actual,implemented:liq>=1&&d<=2&&score>=70&&vol!=='high',conservative:liq>=3&&d<=.5&&score>=70&&vol!=='high'});}
out.router.n=cases.length;out.router.allowed=cases.filter(x=>x.actual).length;
for(const key of ['implemented','conservative']){out.router[key]={passed:cases.filter(x=>x.actual===x[key]).length,failed:cases.filter(x=>x.actual!==x[key]).length,false_allow:cases.filter(x=>x.actual&&!x[key]).length,false_block:cases.filter(x=>!x.actual&&x[key]).length};}
out.router.unknown_allowed=cases.filter(x=>x.vol==='unknown'&&x.actual).length;
out.router.boundaries=[];
for(const [factor,vals] of [['liq',[.99,1,1.01,2.99,3,3.01]],['debt_ratio',[.49,.5,.51,1.99,2,2.01]],['score',[69,70,71]]])for(const v of vals){const x={liq:4,debt_ratio:0,score:80,vol:'low',[factor]:v};const f=fixture({balance:20000*x.liq,debt:20000*x.debt_ratio});const r=router.buildDecisionRouter({...f,health:{score:x.score}});out.router.boundaries.push({...x,invest_allowed:investAllowed(r),emergency_action:r.actions[0].allowed,debt_action:r.actions[1].allowed});}
out.router.rule_coverage={liq_below:cases.filter(x=>x.liq<1).length,debt_above:cases.filter(x=>x.debt_ratio>2).length,high_vol:cases.filter(x=>x.vol==='high').length,low_health:cases.filter(x=>x.score<70).length,all_clear:cases.filter(x=>x.implemented).length};
const outage=fixture();outage.analytics={forecast:{horizon:15,points:[],method:'error'},volatility:{label:'unknown',features:{entryCount:30}}};const outageInvestment=pipeline(outage);out.router.ml_outage={score:outage.analytics.health.score,phase:outage.analytics.health.phase,volatility:outage.analytics.volatility.label,allowed:investAllowed(outage.analytics.router),recommended:outageInvestment.suggestions.length,investable:outageInvestment.investableAmount};
const rules=[['amount',(o,i)=>o.minMonthlyAmount<=i.investableAmount],['income',(o,i)=>i.monthlyIncome>=o.minMonthlyEarning],['debt',(o,i)=>i.debt<=o.maxDebt],['savings',(o,i)=>i.savings>=o.minSavings],['risk',(o,i)=>!(i.riskProfile==='low'&&o.riskLevel==='high')],['risk_volatility',(o,i)=>!(i.riskProfile==='low'&&i.volatility!=='low'&&o.riskLevel==='medium')],['volatility_safe',(o,i)=>!(i.volatility==='high'&&!o.volatilitySafe)]];
function inspect(f,bypass=false){if(bypass)f.analytics.router={actions:[{key:'conservative_investing',allowed:true}]};else pipeline(f);const inputs=engine.deriveInputs(f);let remain=options;const filters=rules.map(([name,fn])=>{const before=remain.length;const independent=options.filter(o=>!fn(o,inputs)).length;remain=remain.filter(o=>fn(o,inputs));return {name,removed:before-remain.length,remaining:remain.length,independent_removed:independent};});const result=engine.buildInvestmentSuggestion(f);return {inputs,filters,survivors:remain.length,router_allowed:investAllowed(f.analytics.router),result};}
out.investment.dataset={n:options.length,risk:count(options.map(o=>o.riskLevel)),volatility_safe:options.filter(o=>o.volatilitySafe).length};
const representative=[['safe_low',{}],['safe_medium',{risk:'medium'}],['safe_high',{risk:'high'}],['medium_vol_low_risk',{vol:'medium'}],['high_vol_gated',{vol:'high'}],['high_vol_filter_isolation',{vol:'high',risk:'medium'}],['reserve_only',{balance:60000}],['small_budget',{balance:61000}],['high_debt',{debt:100000}],['no_surplus',{income:500}],['affluent',{income:3000,balance:200000,risk:'medium'}],['falling_forecast',{trend:.85}]];
out.investment.representatives=representative.map(([name,cfg])=>({name,config:cfg,...inspect(fixture(cfg),name==='high_vol_filter_isolation')}));
const investmentCases=[];const violations={budget:0,negative:0,minimum_allocated:0,hard_filter:0,top5:0,router_bypass:0,pct_sum_not100:0};let allocationCount=0,unused=[],eligible=0;
for(const income of [500,1000,3000])for(const balance of [60000,61000,100000,200000])for(const debt of [0,10000,50000,100000])for(const vol of ['low','medium','high','unknown'])for(const risk of ['low','medium','high'])for(const trend of [.85,1,1.15]){const f=fixture({income,balance,debt,vol,risk,trend});const r=pipeline(f),i=engine.deriveInputs(f);const total=r.suggestions.reduce((s,o)=>s+o.allocationAmount,0);if(r.eligible){eligible++;unused.push(r.investableAmount-total);if(r.suggestions.reduce((s,o)=>s+o.allocationPct,0)!==100)violations.pct_sum_not100++;}if(total>r.investableAmount)violations.budget++;if(r.suggestions.length>5)violations.top5++;if(!investAllowed(f.analytics.router)&&r.eligible)violations.router_bypass++;for(const s of r.suggestions){allocationCount++;let o=options.find(o=>o.id===s.optionId);if(s.allocationAmount<0)violations.negative++;if(s.allocationAmount<o.minMonthlyAmount)violations.minimum_allocated++;if(!engine.hardFilter(o,i))violations.hard_filter++;}investmentCases.push({income,balance,debt,vol,risk,trend,score:f.analytics.health.score,router_allowed:investAllowed(f.analytics.router),eligible:r.eligible,investable:r.investableAmount,recommended:r.suggestions.length});}
out.investment.grid={n:investmentCases.length,eligible,blocked:investmentCases.length-eligible,allocations:allocationCount,violations,unused:unused.length?{min:Math.min(...unused),max:Math.max(...unused),mean:mean(unused)}:{},recommended_distribution:count(investmentCases.map(x=>x.recommended))};
const baseline=inspect(fixture());const ids=baseline.result.suggestions.map(o=>o.optionId);out.investment.stability=[];
for(const [name,cfg] of [['repeat',{}],['income_minus5pct',{income:950}],['income_plus5pct',{income:1050}],['balance_minus5pct',{balance:95000}],['balance_plus5pct',{balance:105000}],['forecast_drop',{trend:.85}],['medium_risk',{risk:'medium'}],['high_risk',{risk:'high'}]]){const r=inspect(fixture(cfg)).result;const next=r.suggestions.map(o=>o.optionId),inter=next.filter(x=>ids.includes(x)).length;let common=ids.filter(x=>next.includes(x)),pairs=0,inversions=0;for(let a=0;a<common.length;a++)for(let b=a+1;b<common.length;b++){pairs++;if(next.indexOf(common[a])>next.indexOf(common[b]))inversions++;}out.investment.stability.push({name,ids:next,jaccard:inter/(new Set([...ids,...next]).size||1),same_order:JSON.stringify(ids)===JSON.stringify(next),common_pairs:pairs,inversions});}
// DB mock adapters for actual snapshot and explanation orchestration.
let current=fixture();pipeline(current);let currentInvestment=engine.buildInvestmentSuggestion(current),stored;
const chain=v=>({select(){return this},lean:async()=>v});
let groqMode='good',groqValue;
const models={'../models/User':{findById:()=>chain(current.user)},'../models/IncomeAnalytics':{findOne:()=>chain(current.analytics)},'../models/InvestmentSuggestion':{findOne:()=>chain(currentInvestment)},'../models/AiExplanation':{findOneAndUpdate:async(_q,p)=>{stored=p;return p;}}};
const ai=load('server/services/aiExplanationService.js',['validateExplanation','fallbackFromSnapshot','forecastDirection','systemPrompt'],{...models,'./groqService':{callGroqJson:async()=>{if(groqMode==='fail')throw new Error('controlled transport failure');return groqValue;}}});
const snap=await ai.buildSnapshot('research-fixture');const good=ai.fallbackFromSnapshot(snap);
groqValue=good;out.llm.controlled=[];
for(const [name,mode,value,force] of [['valid','good',good,false],['transport_failure','fail',good,false],['schema_failure','good',{},false],['forced_fallback','good',good,true],['invented_numbers','good',{...good,healthInsight:'Your score is 999 and you can invest Rs 999999.',investmentInsight:'Buy ImaginaryProduct for Rs 999999 monthly.'},false],['wrong_overview_types','good',{...good,overview:{headline:123,summary:{bad:true},nextAction:['buy']}},false],['missing_optional_fields','good',{...good,actionPlan:undefined,watchOut:undefined},false]]){groqMode=mode;groqValue=value;let start=process.hrtime.bigint();const p=await ai.generateAiExplanationForUser('research-fixture',{forceFallback:force});out.llm.controlled.push({name,status:p.status,local_ms:Number(process.hrtime.bigint()-start)/1e6,healthInsight:p.healthInsight,investmentInsight:p.investmentInsight,overview:p.overview,error:p.error,snapshot_unchanged:JSON.stringify(p.sourceSnapshot)===JSON.stringify(snap)});}
out.llm.fallback_snapshots=[];for(const [name,cfg] of [['safe',{}],['high_vol',{vol:'high'}],['declining',{trend:.5}],['rising',{trend:1.5}],['crisis',{balance:0,debt:100000,vol:'high'}]]){current=fixture(cfg);pipeline(current);currentInvestment=engine.buildInvestmentSuggestion(current);const s=await ai.buildSnapshot('research-fixture'),p=ai.fallbackFromSnapshot(s,'Controlled');out.llm.fallback_snapshots.push({name,snapshot:s,direction:ai.forecastDirection(s),status:p.status,overview:p.overview,forecastInsight:p.forecastInsight,decisionInsight:p.decisionInsight,investmentInsight:p.investmentInsight});}
// Exercise actual HTTP parser/timeout/error paths using mock fetch, no network.
out.llm.transport=[];const savedKey=process.env.GROQ_API_KEY,savedTimeout=process.env.GROQ_TIMEOUT_MS;process.env.GROQ_API_KEY='research-dummy-key';process.env.GROQ_TIMEOUT_MS='20';
for(const mode of ['valid_json','fenced_json','malformed','missing_json','http_429','timeout']){let fakeFetch=async(_url,o)=>{if(mode==='timeout')return new Promise((_,reject)=>o.signal.addEventListener('abort',()=>reject(new Error('Controlled timeout'))));return {ok:mode!=='http_429',status:429,json:async()=>({choices:[{message:{content:mode==='valid_json'?JSON.stringify(good):mode==='fenced_json'?'```json\n'+JSON.stringify(good)+'\n```':mode==='malformed'?'{broken}':'no json'}}]})};};let g=load('server/services/groqService.js',[],{}); // replace only runtime fetch in isolated context
const filename=path.join(ROOT,'server/services/groqService.js'),module={exports:{}};vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,exports:module.exports,process,fetch:fakeFetch,AbortController,setTimeout,clearTimeout},{filename});g=module.exports;let a=process.hrtime.bigint();try{await g.callGroqJson({systemPrompt:ai.systemPrompt,userPayload:snap});out.llm.transport.push({mode,success:true,ms:Number(process.hrtime.bigint()-a)/1e6});}catch(e){out.llm.transport.push({mode,success:false,error:e.message,ms:Number(process.hrtime.bigint()-a)/1e6});}}
if(savedKey===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=savedKey;if(savedTimeout===undefined)delete process.env.GROQ_TIMEOUT_MS;else process.env.GROQ_TIMEOUT_MS=savedTimeout;
// Optional tiny live evaluation, actual production Groq client + validator, synthetic snapshot only.
out.llm.live=[];
// Offline reruns retain the already executed final live diagnostic; --live explicitly calls API again.
if(!process.argv.includes('--live')&&fs.existsSync(path.join(__dirname,'node_results.json'))){const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'node_results.json'),'utf8'));out.llm.live=prior.llm.live||[];out.llm.live_configuration=prior.llm.live_configuration;}
if(process.argv.includes('--live')){
 require('../server/node_modules/dotenv').config({path:path.join(ROOT,'server/.env'),quiet:true});
 const groq=require('../server/services/groqService');out.llm.live_configuration={key_configured:Boolean(process.env.GROQ_API_KEY),model:process.env.GROQ_MODEL||'qwen/qwen3.8-27b',timeout_ms:Number(process.env.GROQ_TIMEOUT_MS||12000),temperature:.2};
 const liveCount=Number((process.argv.find(a=>a.startsWith('--live-count='))||'--live-count=3').split('=')[1]);
 for(const cfg of [{},{vol:'high'},{income:500,balance:10000,debt:60000,vol:'high'}].slice(0,liveCount)){
  current=fixture(cfg);pipeline(current);currentInvestment=engine.buildInvestmentSuggestion(current);const s=await ai.buildSnapshot('research-fixture');let a=process.hrtime.bigint(),raw;
  try{raw=await groq.callGroqJson({systemPrompt:ai.systemPrompt,userPayload:s});const elapsed=Number(process.hrtime.bigint()-a)/1e6;try{const validated=ai.validateExplanation(raw);out.llm.live.push({cfg,snapshot:s,api_success:true,schema_success:true,fallback:false,latency_ms:elapsed,raw,validated});}catch(e){out.llm.live.push({cfg,snapshot:s,api_success:true,schema_success:false,fallback:true,latency_ms:elapsed,raw,error:e.message});}}
  catch(e){out.llm.live.push({cfg,snapshot:s,api_success:false,schema_success:false,fallback:true,latency_ms:Number(process.hrtime.bigint()-a)/1e6,error:e.message});}
 }
}
// Named requirement/regression checks; deliberately keep genuine failures visible.
function test(name,fn){try{fn();out.tests.push({name,passed:true});}catch(e){out.tests.push({name,passed:false,error:e.message});}}
test('health bounded over full matrix',()=>assert(matrix.every(x=>x.score>=0&&x.score<=100)));
test('health monotonic liquidity debt volatility forecast history',()=>assert(out.health.monotonicity.filter(x=>x.factor!=='income').every(x=>x.violations===0)));
test('health insufficient history',()=>assert.equal(health.calculateHealthScore(fixture({n:2})).phase,'insufficient_data'));
test('score income-sensitive with all other factors fixed',()=>assert(health.calculateHealthScore(fixture({income:1500})).score>health.calculateHealthScore(fixture({income:500})).score));
test('zero earnings should not pass investment gate',()=>{const f=fixture({income:0});const h=health.calculateHealthScore(f);assert.equal(investAllowed(router.buildDecisionRouter({...f,health:h})),false);});
test('router exact implemented truth table',()=>assert.equal(out.router.implemented.failed,0));
test('router conservative 3 month and 0.5 debt safety requirement',()=>assert.equal(out.router.conservative.false_allow,0));
test('router blocks unknown volatility',()=>assert.equal(investAllowed(router.buildDecisionRouter({...fixture({vol:'unknown'}),health:{score:80}})),false));
test('router ML outage fails closed',()=>assert.equal(out.router.ml_outage.allowed,false));
test('investment total allocation within budget',()=>assert.equal(violations.budget,0));
test('investment respects all hard filters',()=>assert.equal(violations.hard_filter,0));
test('investment respects router block',()=>assert.equal(violations.router_bypass,0));
test('investment no negative allocation and at most five',()=>assert.equal(violations.negative+violations.top5,0));
test('investment allocated product minimums satisfied',()=>assert.equal(violations.minimum_allocated,0));
test('investment displayed percentages sum to 100',()=>assert.equal(violations.pct_sum_not100,0));
test('ranking deterministic repeat',()=>assert.equal(out.investment.stability[0].same_order,true));
test('LLM rejects missing required fields',()=>assert.throws(()=>ai.validateExplanation({})));
test('LLM fallback on controlled schema transport forced errors',()=>assert(out.llm.controlled.filter(x=>['transport_failure','schema_failure','forced_fallback'].includes(x.name)).every(x=>x.status==='fallback')));
test('LLM numerical invention rejected',()=>assert.equal(out.llm.controlled.find(x=>x.name==='invented_numbers').status,'fallback'));
test('LLM wrong overview types rejected',()=>assert.equal(out.llm.controlled.find(x=>x.name==='wrong_overview_types').status,'fallback'));
test('snapshot remains unchanged through LLM validation',()=>assert(out.llm.controlled.every(x=>x.snapshot_unchanged)));
test('fallback detects falling and rising forecasts',()=>{assert.equal(out.llm.fallback_snapshots.find(x=>x.name==='declining').direction,'softening');assert.equal(out.llm.fallback_snapshots.find(x=>x.name==='rising').direction,'improving');});
test('Groq malformed missing HTTP timeout paths reject',()=>assert(out.llm.transport.filter(x=>['malformed','missing_json','http_429','timeout'].includes(x.mode)).every(x=>!x.success)));
test('Groq JSON and fenced JSON parse',()=>assert(out.llm.transport.filter(x=>['valid_json','fenced_json'].includes(x.mode)).every(x=>x.success)));
current=fixture();pipeline(current);out.performance.health_router_investment=timer(()=>pipeline(fixture()));out.performance.health_router=timer(()=>{const f=fixture();router.buildDecisionRouter({...f,health:health.calculateHealthScore(f)});});out.performance.investment_only=timer(()=>engine.buildInvestmentSuggestion(current));out.performance.fixture_only=timer(()=>fixture());out.performance.fallback=timer(()=>ai.fallbackFromSnapshot(snap,'Controlled'));
out.test_summary={total:out.tests.length,passed:out.tests.filter(x=>x.passed).length,failed:out.tests.filter(x=>!x.passed).length};
fs.writeFileSync(path.join(__dirname,'node_results.json'),JSON.stringify(out,null,2));
if(process.argv.includes('--check')&&out.test_summary.failed)process.exitCode=1;
console.log(JSON.stringify({health:{n:out.health.matrix_n,phases:out.health.phases,monotonicity:out.health.monotonicity},router:out.router,investment:out.investment.grid,llm:{transport:out.llm.transport,live:out.llm.live.map(({raw,validated,snapshot,...r})=>r)},tests:out.test_summary,failures:out.tests.filter(x=>!x.passed),performance:out.performance},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
