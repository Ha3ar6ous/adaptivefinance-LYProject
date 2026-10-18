// Run after starting the existing FastAPI app on loopback port 18081.
const fs=require('node:fs'),path=require('node:path');
const {calculateHealthScore}=require('../server/services/healthScoreService');
const {buildDecisionRouter}=require('../server/services/decisionRouterService');
const {buildInvestmentSuggestion}=require('../server/services/investmentEngineService');
const lines=fs.readFileSync(path.join(__dirname,'../data/normal/gig_income_data.csv'),'utf8').trim().split(/\r?\n/);
const headers=lines.shift().split(',');
const entries=lines.slice(0,60).map(line=>{const cols=line.split(',');return {date:cols[headers.indexOf('date')],income:Number(cols[headers.indexOf('income')])};});
const user={bankBalance:100000,monthlyExpenses:20000,debts:0,riskPreference:'low'};
function stats(v,warmup){const a=v.reduce((s,x)=>s+x,0)/v.length,s=[...v].sort((a,b)=>a-b);return {n:v.length,warmup,mean_ms:a,std_ms:Math.sqrt(v.reduce((s,x)=>s+(x-a)**2,0)/v.length),median_ms:s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2,p95_ms:s[Math.ceil(.95*s.length)-1],min_ms:s[0],max_ms:s.at(-1)};}
function compute(analytics){const health=calculateHealthScore({user,entries,analytics});const router=buildDecisionRouter({user,health,analytics});return buildInvestmentSuggestion({userId:'research-fixture',user,entries,analytics:{...analytics,health,router}});}
async function analyze(){const r=await fetch('http://127.0.0.1:18081/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:'research-fixture',entries,horizon:15})});if(!r.ok)throw new Error('HTTP status '+r.status);return r.json();}
async function main(){let analytics=await analyze();const results={dataset:'data/normal/gig_income_data.csv',entries:60,user,horizon:15,python_service:'existing ml_service/app.py',volatility:analytics.volatility.label,recommendations:compute(analytics).suggestions.length};
for(let i=0;i<50;i++)compute(analytics);let local=[];for(let i=0;i<500;i++){let a=process.hrtime.bigint();compute(analytics);local.push(Number(process.hrtime.bigint()-a)/1e6);}results.local_health_router_investment=stats(local,50);
for(let i=0;i<10;i++){compute(await analyze());}let times=[],api=[];for(let i=0;i<50;i++){let a=process.hrtime.bigint();analytics=await analyze();let b=process.hrtime.bigint();compute(analytics);let c=process.hrtime.bigint();api.push(Number(b-a)/1e6);times.push(Number(c-a)/1e6);}results.loopback_analyze=stats(api,10);results.loopback_analyze_health_router_investment=stats(times,10);
fs.writeFileSync(path.join(__dirname,'performance_results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}
main().catch(e=>{console.error(e);process.exitCode=1;});
