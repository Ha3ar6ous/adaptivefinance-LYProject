const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const {ROOT,OUT,write}=require('./evaluate.cjs')
const fixtures=JSON.parse(fs.readFileSync(path.join(OUT,'snapshots.json'),'utf8'))
let snapshot,mode
const chain=value=>({select(){return this},lean:async()=>value})
const models={
 '../models/User':{findById:()=>chain({bankBalance:snapshot.userContext.monthlyExpenses*3,monthlyExpenses:snapshot.userContext.monthlyExpenses,debts:snapshot.userContext.debt,riskPreference:snapshot.userContext.riskPreference})},
 '../models/IncomeAnalytics':{findOne:()=>chain({health:snapshot.health,router:snapshot.router,volatility:{label:snapshot.volatility.label,features:{coefficientOfVariation:snapshot.volatility.cv}},forecast:{horizon:15,method:'trend_weekday',points:Array.from({length:15},()=>({income:snapshot.forecast.total/15}))}})},
 '../models/InvestmentSuggestion':{findOne:()=>chain({...snapshot.investment,suggestions:snapshot.investment.topSuggestion?[snapshot.investment.topSuggestion]:[]})},
 '../models/AiExplanation':{findOneAndUpdate:async(_q,record)=>record},
 './groqService':{callGroqJson:async({userPayload})=>{if(mode==='timeout')throw Error('Controlled transport timeout');if(mode==='schema')return {};const value={templateId:'concise',facts:{...userPayload.expectedFacts}};if(mode==='number999')value.facts.healthScore=999;if(mode==='free_prose')value.healthInsight='Buy ImaginaryProduct for 999.';return value}},
}
const moduleBox={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'server/services/aiExplanationService.js'),'utf8'),{module:moduleBox,require:n=>{if(!(n in models))throw Error(n);return models[n]},Date,console})
async function main(){const rows=[];for(const f of fixtures){snapshot=f.snapshot;for(mode of ['valid','timeout','schema','number999','free_prose']){const start=performance.now(),result=await moduleBox.exports.generateAiExplanationForUser('synthetic');rows.push({id:f.id,mode,status:result.status,error:result.error,local_latency_ms:performance.now()-start,score_preserved:result.sourceSnapshot.health.score===snapshot.health.score});if(result.status!==(mode==='valid'?'ready':'fallback'))throw Error('Unexpected orchestration status')}}write('controlled_orchestration.json',rows)}
main().catch(e=>{console.error(e.message);process.exitCode=1})
